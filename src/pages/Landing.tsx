import { Link } from 'react-router';
import { lessons, lessonPath, modules, exercises } from '../content/loader';

// The hero shows a real query from the Filtering module and the rows it returns from the school dataset.
const heroRows = [
  ['EE 101', 'Circuits 1', 4],
  ['BIO 101', 'General Biology', 4],
];

export function Landing() {
  const first = lessons[0];
  return (
    <div className="landing">
      <section className="hero">
        <div className="hero-copy">
          <h1>Learn SQL by asking real questions of real data.</h1>
          <p className="lead">
            QueryLab runs a real database right in your browser. Read a short lesson, write a query, and know straight away whether it's right.
          </p>
          <div className="hero-actions">
            {first && (
              <Link className="btn primary big" to={lessonPath(first)}>
                Start the first lesson
              </Link>
            )}
            <Link className="btn big" to="/playground">
              Open the playground
            </Link>
          </div>
        </div>

        <figure className="hero-demo" aria-label="Example query and result">
          <pre className="hero-query">
            <code>
              {'SELECT code, title, units\nFROM courses\nWHERE units > 3;'}
            </code>
          </pre>
          <table className="grid">
            <thead>
              <tr>
                <th>code</th>
                <th>title</th>
                <th>units</th>
              </tr>
            </thead>
            <tbody>
              {heroRows.map((r) => (
                <tr key={r[0]}>
                  <td>{r[0]}</td>
                  <td>{r[1]}</td>
                  <td className="num">{r[2]}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <figcaption className="verdict pass">
            <strong>Correct.</strong> Your query returns exactly the expected result.
          </figcaption>
        </figure>
      </section>

      <section className="landing-path">
        <h2>
          {modules.length} modules, {exercises.length} exercises, no setup
        </h2>
        <ol className="path">
          {modules.map((m) => (
            <li key={m.slug}>
              <Link to={lessonPath(m.lessons[0])}>{m.title}</Link>
              <span>{m.summary}</span>
            </li>
          ))}
        </ol>
        <p className="meta">Free to use, no account needed. Your progress is saved in your browser.</p>
      </section>
    </div>
  );
}
