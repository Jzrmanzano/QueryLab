import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

/** Progress is kept in this browser's localStorage: no account, nothing leaves the device. */
export interface ProgressRow {
  exercise_id: string;
  status: 'attempted' | 'solved';
  attempts: number;
  last_sql: string | null;
  solved_at: string | null;
  updated_at: string;
}

type Rows = Record<string, ProgressRow>;

interface ProgressState {
  rows: Rows;
  record: (exerciseId: string, sql: string, passed: boolean) => void;
}

// Bump the version if ProgressRow ever changes shape.
const STORAGE_KEY = 'querylab.progress.v1';

/** Applies one submission. A solved exercise never goes back to 'attempted'. */
export function applyAttempt(
  prev: ProgressRow | undefined,
  exerciseId: string,
  sql: string,
  passed: boolean,
  now = new Date().toISOString(),
): ProgressRow {
  return {
    exercise_id: exerciseId,
    status: passed || prev?.status === 'solved' ? 'solved' : 'attempted',
    attempts: (prev?.attempts ?? 0) + 1,
    last_sql: sql,
    solved_at: prev?.solved_at ?? (passed ? now : null),
    updated_at: now,
  };
}

// Storage can be unavailable (private mode, blocked site data): the app still works, it just forgets.
function load(): Rows {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as Rows) : {};
  } catch {
    return {};
  }
}

function save(rows: Rows) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
  } catch {
    // Quota or storage disabled: keep the in-memory copy for this visit.
  }
}

const Ctx = createContext<ProgressState | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [rows, setRows] = useState<Rows>(load);

  useEffect(() => save(rows), [rows]);

  // Keep other open tabs in sync.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => e.key === STORAGE_KEY && setRows(load());
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  function record(exerciseId: string, sql: string, passed: boolean) {
    setRows((prev) => ({ ...prev, [exerciseId]: applyAttempt(prev[exerciseId], exerciseId, sql, passed) }));
  }

  return <Ctx.Provider value={{ rows, record }}>{children}</Ctx.Provider>;
}

export function useProgress() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useProgress must be used inside ProgressProvider');
  return ctx;
}
