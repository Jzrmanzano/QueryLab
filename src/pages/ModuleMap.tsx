import { Link } from 'react-router';
import { modules, lessonPath } from '../content/loader';
import { useProgress } from '../lib/progress';

export function ModuleMap() {
  const { rows } = useProgress();
  const solved = (ids: string[]) => ids.filter((id) => rows[id]?.status === 'solved').length;

  return (
    <div className="page">
      <h1>Learn SQL, one module at a time</h1>
      <p className="lead">Each lesson explains one idea, then gives you exercises that are checked as soon as you submit.</p>
      <ol className="module-list">
        {modules.map((m, i) => {
          const ids = m.lessons.flatMap((l) => l.exercises.map((e) => e.id));
          const done = solved(ids);
          return (
            <li key={m.slug} className="module">
              <div className="module-num">{i + 1}</div>
              <div>
                <h2>{m.title}</h2>
                <p>{m.summary}</p>
                <ul>
                  {m.lessons.map((l) => {
                    const lessonDone = solved(l.exercises.map((e) => e.id));
                    return (
                      <li key={l.id}>
                        <Link to={lessonPath(l)}>{l.title}</Link>
                        <span className="count">
                          {lessonDone === l.exercises.length && lessonDone > 0 ? '✓ ' : ''}
                          {lessonDone}/{l.exercises.length}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
              <meter className="module-meter" min={0} max={ids.length} value={done} aria-label={`${done} of ${ids.length} exercises solved`} />
            </li>
          );
        })}
      </ol>
    </div>
  );
}
