import { BrowserRouter, Link, NavLink, Route, Routes } from 'react-router';
import { ProgressProvider } from './lib/progress';
import { Landing } from './pages/Landing';
import { ModuleMap } from './pages/ModuleMap';
import { LessonPage } from './pages/LessonPage';
import { Playground } from './pages/Playground';
import { ProgressPage } from './pages/ProgressPage';
import { NotFound } from './pages/NotFound';
import { Privacy } from './pages/Privacy';

function Header() {
  return (
    <header className="site-header">
      <Link to="/" className="logo" aria-label="QueryLab home">
        <span className="logo-mark" aria-hidden>
          ▦
        </span>
        QueryLab
      </Link>
      <nav>
        <NavLink to="/learn">Learn</NavLink>
        <NavLink to="/playground">Playground</NavLink>
        <NavLink to="/progress">Progress</NavLink>
      </nav>
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
            <Route path="/privacy" element={<Privacy />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <footer className="site-footer">
          <span>QueryLab</span>
          <Link to="/privacy">Privacy policy</Link>
          <span>
            Sample data: <a href="https://github.com/lerocha/chinook-database">Chinook</a> © Luis Rocha (MIT) ·{' '}
            <a href="https://allisonhorst.github.io/palmerpenguins/">Palmer Penguins</a> (CC0)
          </span>
        </footer>
      </ProgressProvider>
    </BrowserRouter>
  );
}
