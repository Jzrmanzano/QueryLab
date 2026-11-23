// Typed wrapper around the SQL worker. A request that runs longer than
// TIMEOUT_MS kills the worker (stopping runaway queries) and starts a new one.
import type { Check, GradeResult } from './compare';
import type { RunOutput, TableSchema } from './core';

export const TIMEOUT_MS = 3000;

export type Request =
  | { type: 'run'; datasetId: string; sql: string }
  | { type: 'grade'; datasetId: string; sql: string; solution: string; check?: Check }
  | { type: 'schema'; datasetId: string };

type Pending = { resolve: (v: any) => void; reject: (e: Error) => void; timer: ReturnType<typeof setTimeout> };

let worker: Worker | null = null;
let workerReady: Promise<void> = Promise.resolve();
let nextId = 1;
const pending = new Map<number, Pending>();

// The timeout clock starts only once the engine has loaded, so a slow
// first download of the WASM file is never mistaken for a runaway query.
function getWorker(): Worker {
  if (worker) return worker;
  let markReady!: () => void;
  workerReady = new Promise((r) => (markReady = r));
  worker = new Worker(new URL('./sql.worker.ts', import.meta.url), { type: 'module' });
  worker.onmessage = (e: MessageEvent<{ id: number; ok: boolean; result?: unknown; error?: string; ready?: boolean }>) => {
    if (e.data.ready) return markReady();
    const p = pending.get(e.data.id);
    if (!p) return;
    clearTimeout(p.timer);
    pending.delete(e.data.id);
    if (e.data.ok) p.resolve(e.data.result);
    else p.reject(new Error(e.data.error));
  };
  return worker;
}

function restart(reason: string) {
  worker?.terminate();
  worker = null;
  for (const p of pending.values()) {
    clearTimeout(p.timer);
    p.reject(new Error(reason));
  }
  pending.clear();
}

async function send<T>(req: Request): Promise<T> {
  const w = getWorker();
  await workerReady;
  const id = nextId++;
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => restart(`Query stopped after ${TIMEOUT_MS / 1000} s. It may loop forever or produce too many rows.`),
      TIMEOUT_MS,
    );
    pending.set(id, { resolve, reject, timer });
    w.postMessage({ id, ...req });
  });
}

export const runQuery = (datasetId: string, sql: string) => send<RunOutput>({ type: 'run', datasetId, sql });

export const gradeQuery = (datasetId: string, sql: string, solution: string, check?: Check) =>
  send<GradeResult>({ type: 'grade', datasetId, sql, solution, check });

export const getSchema = (datasetId: string) => send<TableSchema[]>({ type: 'schema', datasetId });
