import type { RunOutput } from '../engine/core';
import type { Cell } from '../engine/compare';

export type RunState =
  | { kind: 'idle' }
  | { kind: 'running' }
  | { kind: 'ok'; out: RunOutput }
  | { kind: 'error'; message: string };

function show(v: Cell) {
  if (v === null) return <span className="null">NULL</span>;
  if (v instanceof Uint8Array) return <span className="null">[{v.length} bytes]</span>;
  return String(v);
}

export function ResultsTable({ state }: { state: RunState }) {
  if (state.kind === 'idle') return <p className="placeholder">Run a query to see its result here.</p>;
  if (state.kind === 'running') return <p className="placeholder">Running…</p>;
  if (state.kind === 'error') return <p className="error" role="alert">{state.message}</p>;

  const { columns, rows, rowCount, ms } = state.out;
  if (columns.length === 0) {
    return <p className="placeholder">The statement ran in {ms.toFixed(0)} ms and returned no rows.</p>;
  }
  return (
    <>
      <div className="grid-wrap">
        <table className="grid">
          <thead>
            <tr>
              {columns.map((c, i) => (
                <th key={i}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                {r.map((v, j) => (
                  <td key={j} className={typeof v === 'number' ? 'num' : undefined}>
                    {show(v)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="meta">
        {rowCount} {rowCount === 1 ? 'row' : 'rows'} in {ms.toFixed(0)} ms
        {rowCount > rows.length && `, showing the first ${rows.length}`}
      </p>
    </>
  );
}
