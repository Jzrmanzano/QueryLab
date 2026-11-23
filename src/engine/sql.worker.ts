import initSqlJs from 'sql.js';
import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url';
import { Engine, errorText, explainError } from './core';
import { datasets } from '../content/datasets';
import type { Request } from './client';

// Seen from inside, a dedicated worker has the same postMessage/onmessage shape as a Worker.
const ctx = self as unknown as Worker;

// @types/sql.js >=1.16 marks useOldExtensionFunctions as required; true is sql.js's runtime default.
const ready = initSqlJs({ locateFile: () => wasmUrl, useOldExtensionFunctions: true }).then((SQL) => new Engine(SQL));
ready.then(() => ctx.postMessage({ ready: true }));

ctx.onmessage = async (e: MessageEvent<Request & { id: number }>) => {
  const { id, ...req } = e.data;
  const engine = await ready;
  const seed = datasets[req.datasetId];
  try {
    if (!seed) throw new Error(`Unknown dataset "${req.datasetId}"`);
    let result: unknown;
    if (req.type === 'run') {
      try {
        result = engine.run(req.datasetId, seed, req.sql);
      } catch (err) {
        throw new Error(explainError(errorText(err), engine.schema(req.datasetId, seed)));
      }
    } else if (req.type === 'grade') {
      result = engine.grade(req.datasetId, seed, req.sql, req.solution, req.check);
    } else {
      result = engine.schema(req.datasetId, seed);
    }
    ctx.postMessage({ id, ok: true, result });
  } catch (err) {
    ctx.postMessage({ id, ok: false, error: errorText(err) });
  }
};
