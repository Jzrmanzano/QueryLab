import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { findLesson, lessonPath, type Lesson, type Module } from '../content/loader';
import { Workspace } from '../components/Workspace';
import { LessonBody } from '../components/LessonBody';
import { ResultDiff } from '../components/ResultDiff';
import { gradeQuery } from '../engine/client';
import type { GradeResult } from '../engine/compare';
import { useProgress } from '../lib/progress';
import { NotFound } from './NotFound';

/** Renders `backtick` spans in exercise prompts as inline code. */
const inline = (text: string) =>
  text.split(/(`[^`]+`)/).map((part, i) => (part.startsWith('`') ? <code key={i}>{part.slice(1, -1)}</code> : part));

export function LessonPage() {
  const params = useParams();
  const found = findLesson(params.module, params.lesson);
  if (!found) return <NotFound />;
  // key: a new lesson starts with fresh editor and feedback state
  return <LessonView key={found.lesson.id} {...found} />;
}

interface ViewProps {
  lesson: Lesson;
  module: Module;
  prev?: Lesson;
  next?: Lesson;
}

function LessonView({ lesson, module, prev, next }: ViewProps) {
  const { rows, record } = useProgress();
  const [active, setActive] = useState(0);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [hintsShown, setHintsShown] = useState<Record<string, number>>({});
  const [result, setResult] = useState<GradeResult | null>(null);
  const [feedbackKey, setFeedbackKey] = useState(0);
  const [grading, setGrading] = useState(false);

  const ex = lesson.exercises[active];
  const sql = ex ? (drafts[ex.id] ?? rows[ex.id]?.last_sql ?? ex.starter ?? '') : (drafts.free ?? '');
  const setSql = (v: string) => setDrafts((d) => ({ ...d, [ex?.id ?? 'free']: v }));
  const solvedCount = lesson.exercises.filter((e) => rows[e.id]?.status === 'solved').length;

  function choose(i: number) {
    setActive(i);
    setResult(null);
  }

  async function submit() {
    if (!ex || !sql.trim()) return;
    setGrading(true);
    let r: GradeResult;
    try {
      r = await gradeQuery(ex.dataset, sql, ex.solution, ex.check);
    } catch (e) {
      r = { pass: false, reason: 'error', message: (e as Error).message };
    }
    setResult(r);
    setFeedbackKey((k) => k + 1);
    setGrading(false);
    record(ex.id, sql, r.pass);
  }

  const feedback = !ex ? undefined : result === null ? (
    <p className="placeholder">Submit your query to check it against the exercise.</p>
  ) : result.pass ? (
    <div className="verdict pass" role="status">
      <p>
        <strong>Correct.</strong> Your query returns exactly the expected result.
      </p>
      {active < lesson.exercises.length - 1 ? (
        <button className="btn" onClick={() => choose(active + 1)}>
          Next exercise
        </button>
      ) : next ? (
        <Link className="btn" to={lessonPath(next)}>
          Next lesson: {next.title}
        </Link>
      ) : (
        <Link className="btn" to="/learn">
          Back to all modules
        </Link>
      )}
    </div>
  ) : (
    <>
      <div className="verdict fail" role="alert">
        <p>
          <strong>Not yet.</strong> {result.message}
        </p>
        {ex.hints && (hintsShown[ex.id] ?? 0) < ex.hints.length && (
          <button className="btn" onClick={() => setHintsShown((h) => ({ ...h, [ex.id]: (h[ex.id] ?? 0) + 1 }))}>
            Show a hint
          </button>
        )}
      </div>
      {result.diff && <ResultDiff diff={result.diff} />}
    </>
  );

  return (
    <div className="lesson-layout">
      <article className="lesson">
        <p className="crumb">
          <Link to="/learn">{module.title}</Link>
        </p>
        <h1>{lesson.title}</h1>
        <LessonBody markdown={lesson.body} onTry={setSql} />

        {lesson.exercises.length > 0 && (
          <section className="exercises" aria-labelledby="ex-heading">
            <h2 id="ex-heading">
              Exercises <span className="count">{solvedCount} of {lesson.exercises.length} solved</span>
            </h2>
            <ol>
              {lesson.exercises.map((e, i) => {
                const solved = rows[e.id]?.status === 'solved';
                const shown = hintsShown[e.id] ?? 0;
                return (
                  <li key={e.id} className={`exercise${i === active ? ' active' : ''}${solved ? ' solved' : ''}`}>
                    <button className="exercise-head" onClick={() => choose(i)} aria-expanded={i === active}>
                      <span className="mark" aria-label={solved ? 'Solved' : 'Not solved'}>{solved ? '✓' : i + 1}</span>
                      <span className="prompt">{inline(e.prompt)}</span>
                    </button>
                    {i === active && (
                      <div className="exercise-body">
                        {e.hints?.slice(0, shown).map((h, j) => (
                          <p key={j} className="hint">
                            Hint {j + 1}: {h}
                          </p>
                        ))}
                        {e.hints && shown < e.hints.length && (
                          <button className="link" onClick={() => setHintsShown((s) => ({ ...s, [e.id]: shown + 1 }))}>
                            Show a hint ({e.hints.length - shown} left)
                          </button>
                        )}
                        {e.starter !== undefined && (
                          <button className="link" onClick={() => setSql(e.starter ?? '')}>
                            Reset to starter
                          </button>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>
          </section>
        )}

        <nav className="pager">
          {prev ? <Link to={lessonPath(prev)}>Previous: {prev.title}</Link> : <span />}
          {next && <Link to={lessonPath(next)}>Next: {next.title}</Link>}
        </nav>
      </article>

      <div className="lesson-workspace">
        <Workspace
          datasetId={ex?.dataset ?? lesson.dataset}
          task={
            ex && (
              <>
                <strong>
                  Exercise {active + 1} of {lesson.exercises.length}
                  {rows[ex.id]?.status === 'solved' && ' (solved)'}
                </strong>
                {inline(ex.prompt)}
              </>
            )
          }
          value={sql}
          onChange={setSql}
          feedback={feedback}
          feedbackKey={feedbackKey}
          actions={
            ex && (
              <button className="btn submit" onClick={submit} disabled={grading}>
                {grading ? 'Checking…' : `Submit exercise ${active + 1}`}
              </button>
            )
          }
        />
      </div>
    </div>
  );
}
