import { useState } from 'react';
import { Link } from 'react-router';
import { Workspace } from '../components/Workspace';
import { Mark } from '../components/Mark';
import { exercises, lessonPath, lessons, modules } from '../content/loader';
import { useProgress } from '../lib/progress';

// A real question about the school dataset, answered live on the home page.
const DEMO_SQL = `SELECT c.name AS college, COUNT(*) AS students
FROM students s
JOIN colleges c ON c.id = s.college_id
GROUP BY c.name
ORDER BY students DESC;`;

/** Same arrangement as a lesson: the pad on the left, the screen on the right. */
export function Landing() {
  const [sql, setSql] = useState(DEMO_SQL);
  const { rows } = useProgress();
  const first = lessons[0];
  const allSolved = (ids: string[]) => ids.length > 0 && ids.every((id) => rows[id]?.status === 'solved');

  return (
    <div className="landing">
      <div className="page">
        <h1>Learn SQL by asking real questions of real data.</h1>
        <p className="lead">
          Each lesson explains one idea in a few minutes. Then you write queries against a real database in your
          browser, and QueryLab checks each answer the moment you submit it.
        </p>
        <div className="actions">
          {first && (
            <Link className="btn primary" to={lessonPath(first)}>
              Start lesson 1
            </Link>
          )}
          <Link className="btn" to="/learn">
            See all lessons
          </Link>
        </div>
        <p>Free, with no account to create. Your progress is saved in this browser.</p>

        <h2 id="outline-heading">
          {modules.length} modules, {lessons.length} lessons, {exercises.length} exercises
        </h2>
        <ol className="toc" aria-labelledby="outline-heading">
          {modules.map((m, i) => {
            const done = allSolved(m.lessons.flatMap((l) => l.exercises.map((e) => e.id)));
            return (
              <li key={m.slug} className="in-margin">
                <Mark n={i + 1} solved={done} label={done ? 'Module complete.' : undefined} />
                <h3>
                  <Link to={lessonPath(m.lessons[0])}>{m.title}</Link>
                </h3>
                <p className="summary">{m.summary}</p>
              </li>
            );
          })}
        </ol>
      </div>

      <section className="screen hero-screen" aria-labelledby="demo-heading">
        <h2 id="demo-heading">This query is running on the school database. Change it and press Run.</h2>
        <Workspace datasetId="school" value={sql} onChange={setSql} autoRun />
      </section>
    </div>
  );
}
