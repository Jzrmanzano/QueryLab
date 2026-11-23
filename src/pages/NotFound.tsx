import { Link } from 'react-router';

export function NotFound() {
  return (
    <div className="page narrow">
      <h1>Page not found</h1>
      <p>
        This lesson or page doesn't exist. <Link to="/learn">Go to all modules</Link>.
      </p>
    </div>
  );
}
