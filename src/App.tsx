import { BrowserRouter, Link, NavLink, Route, Routes } from 'react-router';
import { ProgressProvider, useProgress } from './lib/progress';
import { exercises } from './content/loader';
import { Landing } from './pages/Landing';
import { ModuleMap } from './pages/ModuleMap';
import { LessonPage } from './pages/LessonPage';
import { Playground } from './pages/Playground';
import { ProgressPage } from './pages/ProgressPage';
import { NotFound } from './pages/NotFound';
import { Privacy } from './pages/Privacy';
import { Guide } from './pages/Guide';

function Header() {
  const { rows } = useProgress();
  const solved = exercises.filter((e) => rows[e.id]?.status === 'solved').length;
  return (
    <header className="site-header">
      <Link to="/" className="wordmark">
        QueryLab
      </Link>
      <nav aria-label="Main">
        <NavLink to="/learn">Lessons</NavLink>
        <NavLink to="/guide">Guide</NavLink>
        <NavLink to="/playground">Playground</NavLink>
      </nav>
      <NavLink to="/progress" className="solved-count" aria-label={`Your progress: ${solved} of ${exercises.length} exercises solved`}>
        <strong>{solved}</strong> of {exercises.length} solved
      </NavLink>
    </header>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <ProgressProvider>
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/learn" element={<ModuleMap />} />
            <Route path="/learn/:module/:lesson" element={<LessonPage />} />
            <Route path="/playground" element={<Playground />} />
            <Route path="/progress" element={<ProgressPage />} />
            <Route path="/guide" element={<Guide />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <footer className="site-footer">
          <p>
            QueryLab is free and needs no account; your progress stays in this browser (
            <Link to="/privacy">privacy policy</Link>). Sample data:{' '}
            <a href="https://github.com/lerocha/chinook-database">Chinook</a> by Luis Rocha (MIT licence) and{' '}
            <a href="https://allisonhorst.github.io/palmerpenguins/">Palmer Penguins</a> (CC0).
          </p>
        </footer>
      </ProgressProvider>
    </BrowserRouter>
  );
}
