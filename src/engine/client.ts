// Typed wrapper around the SQL worker. A request that runs longer than
// TIMEOUT_MS kills the worker (stopping runaway queries) and starts a new one.
import type { Check, GradeResult } from './compare';
import type { RunOutput, TableSchema } from './core';

export const TIMEOUT_MS = 3000;
// Downloading and building a dataset the first time can be slow on a poor connection,
// so it gets its own, much longer limit and never eats into a query's 3 seconds.
const PREPARE_TIMEOUT_MS = 60_000;

export type Request =
  | { type: 'prepare'; datasetId: string }
  | { type: 'run'; datasetId: string; sql: string }
  | { type: 'grade'; datasetId: string; sql: string; solution: string; check?: Check }
  | { type: 'schema'; datasetId: string };

type Pending = { resolve: (v: any) => void; reject: (e: Error) => void; timer: ReturnType<typeof setTimeout> };

let worker: Worker | null = null;
let workerReady: Promise<void> = Promise.resolve();
let nextId = 1;
const pending = new Map<number, Pending>();
let prepared = new Map<string, Promise<void>>(); // datasets loaded into the current worker

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
  prepared = new Map();
  for (const p of pending.values()) {
    clearTimeout(p.timer);
    p.reject(new Error(reason));
  }
  pending.clear();
}

const QUERY_TIMEOUT = `Query stopped after ${TIMEOUT_MS / 1000} s. It may loop forever or produce too many rows.`;
const PREPARE_TIMEOUT = 'The dataset took too long to load. Check your connection and try again.';

async function send<T>(req: Request, timeoutMs = TIMEOUT_MS, timeoutMessage = QUERY_TIMEOUT): Promise<T> {
  const w = getWorker();
  await workerReady;
  const id = nextId++;
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => restart(timeoutMessage), timeoutMs);
    pending.set(id, { resolve, reject, timer });
    w.postMessage({ id, ...req });
  });
}

/** Loads a dataset into the worker once; later requests for it start their timers only after that. */
function prepare(datasetId: string): Promise<void> {
  let ready = prepared.get(datasetId);
  if (!ready) {
    ready = send<void>({ type: 'prepare', datasetId }, PREPARE_TIMEOUT_MS, PREPARE_TIMEOUT).catch((e: Error) => {
      prepared.delete(datasetId);
      throw e;
    });
    prepared.set(datasetId, ready);
  }
  return ready;
}

async function sendFor<T>(req: Exclude<Request, { type: 'prepare' }>): Promise<T> {
  await prepare(req.datasetId);
  return send<T>(req);
}

export const runQuery = (datasetId: string, sql: string) => sendFor<RunOutput>({ type: 'run', datasetId, sql });

export const gradeQuery = (datasetId: string, sql: string, solution: string, check?: Check) =>
  sendFor<GradeResult>({ type: 'grade', datasetId, sql, solution, check });

export const getSchema = (datasetId: string) => sendFor<TableSchema[]>({ type: 'schema', datasetId });
