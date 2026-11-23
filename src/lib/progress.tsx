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

export type Rows = Record<string, ProgressRow>;

interface ProgressState {
  rows: Rows;
  record: (exerciseId: string, sql: string, passed: boolean) => void;
  /** Merges rows from a backup into this browser's progress. */
  restore: (incoming: Rows) => void;
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

// ---------- backup files ----------

const BACKUP_VERSION = 1;

/** A downloadable backup of all progress. */
export function toBackup(rows: Rows, now = new Date().toISOString()): string {
  return JSON.stringify({ app: 'querylab', version: BACKUP_VERSION, exported_at: now, progress: rows }, null, 2);
}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isTextOrNull = (v: unknown) => v === null || typeof v === 'string';

function isRow(v: unknown): v is ProgressRow {
  return (
    isObject(v) &&
    typeof v.exercise_id === 'string' &&
    (v.status === 'attempted' || v.status === 'solved') &&
    typeof v.attempts === 'number' &&
    Number.isInteger(v.attempts) &&
    v.attempts >= 0 &&
    isTextOrNull(v.last_sql) &&
    isTextOrNull(v.solved_at) &&
    typeof v.updated_at === 'string'
  );
}

/** Reads a backup file's text. Throws an Error with a learner-friendly message if it isn't one. */
export function parseBackup(text: string): Rows {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("That file isn't a QueryLab backup: it couldn't be read.");
  }
  if (!isObject(data) || data.app !== 'querylab' || !isObject(data.progress)) {
    throw new Error("That file isn't a QueryLab progress backup.");
  }
  if (typeof data.version !== 'number' || data.version > BACKUP_VERSION) {
    throw new Error('That backup was made by a newer version of QueryLab. Reload the page and try again.');
  }
  const rows: Rows = {};
  for (const [id, row] of Object.entries(data.progress)) {
    if (isRow(row) && row.exercise_id === id) rows[id] = row;
  }
  return rows;
}

/**
 * Combines two records of the same exercise without losing anything: solved wins,
 * the earliest solve date and the higher attempt count are kept, and the newer query wins.
 */
export function mergeRow(a: ProgressRow, b: ProgressRow): ProgressRow {
  const newer = b.updated_at > a.updated_at ? b : a;
  const firstSolved = [a.solved_at, b.solved_at].filter((d): d is string => d !== null).sort()[0] ?? null;
  return {
    exercise_id: a.exercise_id,
    status: a.status === 'solved' || b.status === 'solved' ? 'solved' : 'attempted',
    attempts: Math.max(a.attempts, b.attempts),
    last_sql: newer.last_sql,
    solved_at: firstSolved,
    updated_at: newer.updated_at,
  };
}

export function mergeRows(current: Rows, incoming: Rows): Rows {
  const out = { ...current };
  for (const [id, row] of Object.entries(incoming)) out[id] = out[id] ? mergeRow(out[id], row) : row;
  return out;
}

// ---------- browser storage ----------

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

  function restore(incoming: Rows) {
    setRows((prev) => mergeRows(prev, incoming));
  }

  return <Ctx.Provider value={{ rows, record, restore }}>{children}</Ctx.Provider>;
}

export function useProgress() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useProgress must be used inside ProgressProvider');
  return ctx;
}
