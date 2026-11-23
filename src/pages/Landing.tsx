import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import { Workspace } from '../components/Workspace';
import { Mark } from '../components/Mark';
import { ResultDiff } from '../components/ResultDiff';
import { ResultsTable, type RunState } from '../components/ResultsTable';
import { exercises, lessonPath, lessons, modules } from '../content/loader';
import { DATASETS } from '../content/datasets';
import { gradeQuery, runQuery } from '../engine/client';
import type { GradeResult } from '../engine/compare';
import { highlightSql } from '../lib/highlight';
import { useProgress } from '../lib/progress';

/** The home page: a real exercise to fix, the real datasets, and the course as a contents page. */
export function Landing() {
  const { rows } = useProgress();
  const isSolved = (id: string) => rows[id]?.status === 'solved';
  const started = exercises.some((e) => rows[e.id]);
  const next = lessons.find((l) => l.exercises.some((e) => !isSolved(e.id))) ?? lessons[0];
  const cta = next && (
    <Link className="btn primary" to={lessonPath(next)}>
      {started ? `Continue with ${next.title}` : 'Start lesson 1'}
    </Link>
  );

  return (
    <div className="home">
      <div className="home-hero">
        <div className="page">
          <h1>Learn SQL by asking real questions of real data.</h1>
          <p className="lead">
            Each lesson explains one idea in a few minutes. Then you write queries against a real database in your
            browser, and every answer is checked the moment you submit it.
          </p>
          <div className="actions">
            {cta}
            <Link className="btn" to="/learn">
              See all lessons
            </Link>
          </div>
          <p className="meta">Free, with no account to create. Your progress is saved in this browser.</p>
        </div>
        <TryIt cta={cta} />
      </div>

      <DataBrowser />

      <section className="page course-sheet" aria-labelledby="course-heading">
        <header className="sheet-head">
          <div>
            <h2 id="course-heading" className="sheet-title">
              The course
            </h2>
            <p className="lead">
              {modules.length} modules, {lessons.length} lessons and {exercises.length} exercises, from{' '}
              {modules[0]?.title.toLowerCase()} to {modules.at(-1)?.title.toLowerCase()}. Each module builds on the
              ones before it, so take them in order.
            </p>
          </div>
          {cta && <div className="sheet-aside">{cta}</div>}
        </header>
        <ol className="syllabus">
          {modules.map((m, i) => {
            const ids = m.lessons.flatMap((l) => l.exercises.map((e) => e.id));
            const done = ids.length > 0 && ids.every(isSolved);
            return (
              <li key={m.slug} className="in-margin">
                <Mark n={i + 1} solved={done} label={done ? 'Module complete.' : undefined} />
                <h3>
                  <Link to={lessonPath(m.lessons[0])}>{m.title}</Link>
                </h3>
                <p>{m.summary}</p>
                <span className="count">
                  {m.lessons.length} {m.lessons.length === 1 ? 'lesson' : 'lessons'}
                </span>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}

// ---------- the hero exercise: a query with one mistake, checked by the real grader ----------

const DEMO = {
  starter: 'SELECT first_name, last_name, year_level\nFROM students\nWHERE year_level = 3;',
  solution: 'SELECT first_name, last_name, year_level FROM students WHERE year_level = 4;',
  hint: 'Fourth year means year_level = 4.',
};

function TryIt({ cta }: { cta: ReactNode }) {
  const [sql, setSql] = useState(DEMO.starter);
  const [result, setResult] = useState<GradeResult | null>(null);
  const [checking, setChecking] = useState(false);
  const [feedbackKey, setFeedbackKey] = useState(0);
  const [hint, setHint] = useState(false);

  async function check() {
    if (!sql.trim()) return;
    setChecking(true);
    let r: GradeResult;
    try {
      r = await gradeQuery('school', sql, DEMO.solution);
    } catch (e) {
      r = { pass: false, reason: 'error', message: (e as Error).message };
    }
    setResult(r);
    setFeedbackKey((k) => k + 1);
    setChecking(false);
  }

  const feedback =
    result === null ? (
      <p className="placeholder">Press Check answer to compare this query's result with the right one.</p>
    ) : result.pass ? (
      <div className="verdict pass" role="status">
        <p>
          <strong>Correct.</strong> Every exercise works like this: write a query, check it, and see exactly which rows
          are off.
        </p>
        {cta}
      </div>
    ) : (
      <>
        <div className="verdict fail" role="alert">
          <p>
            <strong>Not yet.</strong> {result.message}
          </p>
          {hint ? (
            <p>Hint: {DEMO.hint}</p>
          ) : (
            <button className="btn" onClick={() => setHint(true)}>
              Show a hint
            </button>
          )}
        </div>
        {result.diff && <ResultDiff diff={result.diff} />}
      </>
    );

  return (
    <section className="screen try-it" aria-labelledby="try-heading">
      <Workspace
        datasetId="school"
        task={
          <>
            <strong id="try-heading">Try one now</strong>
            List the students in their fourth year. This query has a mistake: check it to see which rows are wrong,
            then fix it.
          </>
        }
        value={sql}
        onChange={setSql}
        feedback={feedback}
        feedbackKey={feedbackKey}
        actions={
          <button className="btn primary" onClick={check} disabled={checking}>
            {checking ? 'Checking…' : 'Check answer'}
          </button>
        }
        autoRun
      />
    </section>
  );
}

// ---------- the datasets: pick one, see a real query and its real result ----------

const SAMPLES: Record<string, string> = {
  school: `SELECT s.first_name, s.last_name, c.code
FROM students s
JOIN colleges c ON c.id = s.college_id
LIMIT 6;`,
  store: `SELECT name, category, price
FROM products
ORDER BY price DESC
LIMIT 6;`,
  chinook: `SELECT ar.Name AS artist, al.Title AS album
FROM Album al
JOIN Artist ar ON ar.ArtistId = al.ArtistId
LIMIT 6;`,
  penguins: `SELECT species, island, sex, body_mass_g
FROM penguins
ORDER BY RANDOM()
LIMIT 6;`,
};

function DataBrowser() {
  const shown = DATASETS.filter((d) => SAMPLES[d.id]);
  const [active, setActive] = useState(shown[0]?.id ?? 'school');
  const [run, setRun] = useState<RunState>({ kind: 'running' });

  useEffect(() => {
    let current = true;
    setRun({ kind: 'running' });
    runQuery(active, SAMPLES[active]).then(
      (out) => current && setRun({ kind: 'ok', out }),
      (e: Error) => current && setRun({ kind: 'error', message: e.message }),
    );
    return () => {
      current = false;
    };
  }, [active]);

  return (
    <section className="screen data-browser" aria-labelledby="data-heading">
      <div className="data-intro">
        <h2 id="data-heading">Real data to practise on</h2>
        <p>Every lesson runs on one of these databases, inside your browser. Pick one to see a query and its result.</p>
        <div className="dataset-tabs" role="tablist" aria-orientation="vertical" aria-labelledby="data-heading">
          {shown.map((d) => (
            <button
              key={d.id}
              role="tab"
              id={`dataset-tab-${d.id}`}
              aria-selected={active === d.id}
              aria-controls="dataset-panel"
              className="dataset-tab"
              onClick={() => setActive(d.id)}
            >
              <code>{d.id}</code>
              <span>{d.blurb}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="data-sample" id="dataset-panel" role="tabpanel" aria-labelledby={`dataset-tab-${active}`}>
        <pre>
          <code dangerouslySetInnerHTML={{ __html: highlightSql(SAMPLES[active]) }} />
        </pre>
        <ResultsTable state={run} />
        <Link className="btn" to={`/playground?dataset=${active}`}>
          Open {active} in the playground
        </Link>
      </div>
    </section>
  );
}
