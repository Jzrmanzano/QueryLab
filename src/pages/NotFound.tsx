import { Link } from 'react-router';

export function NotFound() {
  return (
    <div className="page narrow">
      <h1>Page not found</h1>
      <p>
        There's no lesson or page at this address. <Link to="/learn">See all lessons</Link>.
      </p>
    </div>
  );
}
