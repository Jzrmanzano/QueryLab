import { Link } from 'react-router';
import { Mark } from '../components/Mark';
import { modules, lessons, lessonPath } from '../content/loader';
import { useProgress } from '../lib/progress';

/** The course as a syllabus on the pad: module numbers in the margin, each module beside its lessons. */
export function ModuleMap() {
  const { rows } = useProgress();
  const isSolved = (id: string) => rows[id]?.status === 'solved';
  const solved = (ids: string[]) => ids.filter(isSolved).length;

  const started = lessons.some((l) => l.exercises.some((e) => rows[e.id]));
  const next = lessons.find((l) => l.exercises.some((e) => !isSolved(e.id)));

  return (
    <div className="page">
      <header className="sheet-head">
        <div>
          <h1>Lessons</h1>
          <p className="lead">
            {modules.length} modules, meant to be taken in order. Each lesson explains one idea, then gives you exercises
            that are checked as soon as you submit them.
          </p>
        </div>
        {next && (
          <div className="sheet-aside">
            <Link className="btn primary" to={lessonPath(next)}>
              {started ? `Continue with ${next.title}` : 'Start lesson 1'}
            </Link>
          </div>
        )}
      </header>
      <ol className="toc course">
        {modules.map((m, i) => {
          const ids = m.lessons.flatMap((l) => l.exercises.map((e) => e.id));
          const complete = ids.length > 0 && solved(ids) === ids.length;
          return (
            <li key={m.slug} className="in-margin">
              <Mark n={i + 1} solved={complete} label={complete ? 'Module complete.' : undefined} />
              <div>
                <h2>{m.title}</h2>
                <p className="summary">{m.summary}</p>
              </div>
              <ul>
                {m.lessons.map((l) => {
                  const done = solved(l.exercises.map((e) => e.id));
                  const finished = l.exercises.length > 0 && done === l.exercises.length;
                  return (
                    <li key={l.id}>
                      <Link to={lessonPath(l)}>{l.title}</Link>
                      <Mark n="" solved={finished} label={finished ? 'Completed.' : undefined} />
                      <span className="count">
                        {done} of {l.exercises.length}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
