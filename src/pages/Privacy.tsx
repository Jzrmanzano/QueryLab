import { Link } from 'react-router';

// Questions go to the repo's public issue tracker, not a personal email address.
const ISSUES_URL = 'https://github.com/Jzrmanzano/QueryLab/issues';
const LAST_UPDATED = '23 November 2026';

export function Privacy() {
  return (
    <div className="page">
      <article className="prose">
        <h1>Privacy policy</h1>
        <p className="meta">Last updated {LAST_UPDATED}</p>

        <p className="lead">
          QueryLab is a free website for learning SQL. There are no accounts, and we don't collect personal information.
        </p>

        <h2>The short version</h2>
        <ul>
          <li>Your queries run entirely in your browser. Nothing you type is sent to us.</li>
          <li>Your progress is saved in your browser, on your device. We never see it.</li>
          <li>We don't show ads or use analytics or tracking cookies.</li>
        </ul>

        <h2>What stays on your device</h2>
        <p>
          Lessons, exercises and the playground run on a SQLite database inside your browser. When you check an
          exercise, QueryLab saves your progress in your browser's local storage: the exercise ID, whether you solved it,
          how many attempts you made, the last query you submitted, and when. This lets you pick up where you left off
          on the same device.
        </p>
        <p>
          This data never leaves your device, and we have no copy of it. It won't follow you to another browser or
          device. You can erase it at any time by clearing this site's data in your browser settings.
        </p>

        <h2 id="services">Services we use</h2>
        <p>Like any website, QueryLab relies on a few services that receive basic technical information when you visit:</p>
        <ul>
          <li>
            <strong>Vercel</strong> hosts the website. It processes your IP address and basic request details to deliver
            pages and keep the service secure, and may keep short-lived server logs under its own policies.
          </li>
          <li>
            <strong>Google Fonts</strong> serves the site's typefaces, so Google receives your IP address when the fonts
            load.
          </li>
        </ul>

        <h2>Children</h2>
        <p>
          QueryLab doesn't collect personal information from anyone, including children, so it's safe to use at any age.
        </p>

        <h2>Changes to this policy</h2>
        <p>
          If QueryLab ever starts collecting information, we'll update this page and the date at the top before the
          change takes effect.
        </p>

        <h2>Contact</h2>
        <p>
          Questions about this policy? Open an issue on <a href={ISSUES_URL}>QueryLab's GitHub page</a>.
        </p>

        <p className="meta">
          <Link to="/">Back to QueryLab</Link>
        </p>
      </article>
    </div>
  );
}
