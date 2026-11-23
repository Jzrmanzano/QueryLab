import { Link } from 'react-router';
import { exercises, lessonPath, modules } from '../content/loader';
import { useProgress } from '../lib/progress';

export function ProgressPage() {
  const { rows } = useProgress();

  const solved = exercises.filter((e) => rows[e.id]?.status === 'solved').length;
  const last = Object.values(rows).sort((a, b) => (b.solved_at ?? '').localeCompare(a.solved_at ?? ''))[0];

  return (
    <div className="page">
      <h1>Your progress</h1>
      <p className="lead">
        You've solved <strong>{solved}</strong> of {exercises.length} exercises.
        {last?.solved_at && ` Last solved on ${new Date(last.solved_at).toLocaleDateString()}.`}
      </p>
      <p className="meta">
        Saved in this browser only. It won't follow you to another device, and clearing this site's data erases it.
      </p>
      {modules.map((m) => (
        <section key={m.slug} className="progress-module">
          <h2>{m.title}</h2>
          {m.lessons.map((l) => (
            <div key={l.id} className="progress-lesson">
              <Link to={lessonPath(l)}>{l.title}</Link>
              <ul>
                {l.exercises.map((e, i) => {
                  const row = rows[e.id];
                  return (
                    <li key={e.id} className={row?.status ?? 'todo'}>
                      <span className="mark">{row?.status === 'solved' ? '✓' : i + 1}</span>
                      {e.prompt.replace(/`/g, '')}
                      {row && <span className="count">{row.attempts} {row.attempts === 1 ? 'try' : 'tries'}</span>}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
