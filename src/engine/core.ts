// SQL execution and grading on top of sql.js. Used by the Web Worker and by tests.
import type { Database, SqlJsStatic } from 'sql.js';
import { compareResults, type Check, type GradeResult, type QueryOutput } from './compare';

export const MAX_DISPLAY_ROWS = 500;

export interface RunOutput extends QueryOutput {
  rowCount: number; // total rows before truncation
  ms: number;
}

export interface ColumnSchema {
  name: string;
  type: string;
  pk: boolean; // part of the table's primary key
  references?: { table: string; column: string }; // set when the column is a foreign key
}

export type TableSchema = { name: string; columns: ColumnSchema[] };

export class Engine {
  private pristine = new Map<string, Uint8Array>();

  constructor(private SQL: SqlJsStatic) {}

  /** Fresh in-memory copy of a dataset. The pristine bytes are never modified. */
  open(datasetId: string, seed: string): Database {
    let bytes = this.pristine.get(datasetId);
    if (!bytes) {
      const db = new this.SQL.Database();
      db.exec(seed);
      bytes = db.export();
      db.close();
      this.pristine.set(datasetId, bytes);
    }
    return new this.SQL.Database(bytes);
  }

  run(datasetId: string, seed: string, sql: string): RunOutput {
    const db = this.open(datasetId, seed);
    try {
      const t0 = performance.now();
      const out = lastResult(db, sql);
      const ms = performance.now() - t0;
      return { ...out, rows: out.rows.slice(0, MAX_DISPLAY_ROWS), rowCount: out.rows.length, ms };
    } finally {
      db.close();
    }
  }

  grade(datasetId: string, seed: string, studentSql: string, solution: string, check: Check = {}): GradeResult {
    const expected = this.outcome(datasetId, seed, solution, check.verify);
    let student: QueryOutput;
    try {
      student = this.outcome(datasetId, seed, studentSql, check.verify);
    } catch (e) {
      return { pass: false, reason: 'error', message: explainError(errorText(e), this.schema(datasetId, seed)) };
    }
    return compareResults(student, expected, check);
  }

  schema(datasetId: string, seed: string): TableSchema[] {
    const db = this.open(datasetId, seed);
    try {
      const tables = db.exec("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name")[0]?.values ?? [];
      return tables.map(([tableName]) => {
        const name = String(tableName);
        // foreign_key_list rows: id, seq, table, from, to, ...
        const fks = db.exec(`PRAGMA foreign_key_list("${name}")`)[0]?.values ?? [];
        const references = new Map(fks.map((f) => [String(f[3]), { table: String(f[2]), column: f[4] === null ? '' : String(f[4]) }]));
        // table_info rows: cid, name, type, notnull, dflt_value, pk
        const columns = (db.exec(`PRAGMA table_info("${name}")`)[0]?.values ?? []).map((c): ColumnSchema => {
          const ref = references.get(String(c[1]));
          return { name: String(c[1]), type: String(c[2]), pk: Number(c[5]) > 0, ...(ref && { references: ref }) };
        });
        return { name, columns };
      });
    } finally {
      db.close();
    }
  }

  /** Result of a SELECT, or for data-changing exercises, the verify query after the statement ran. */
  private outcome(datasetId: string, seed: string, sql: string, verify?: string): QueryOutput {
    const db = this.open(datasetId, seed);
    try {
      const out = lastResult(db, sql);
      return verify ? lastResult(db, verify) : out;
    } finally {
      db.close();
    }
  }
}

function lastResult(db: Database, sql: string): QueryOutput {
  const results = db.exec(sql);
  const last = results.at(-1);
  return last ? { columns: last.columns, rows: last.values } : { columns: [], rows: [] };
}

export function errorText(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

/** Adds a plain-language hint to common SQLite errors. */
export function explainError(message: string, schema: TableSchema[]): string {
  const col = message.match(/no such column: (\S+)/);
  if (col) {
    const name = col[1].split('.').at(-1)!;
    const all = schema.flatMap((t) => t.columns.map((c) => c.name));
    return `${message}. ${suggest(name, all, 'column')}`;
  }
  const table = message.match(/no such table: (\S+)/);
  if (table) {
    return `${message}. ${suggest(table[1], schema.map((t) => t.name), 'table')}`;
  }
  if (/incomplete input/.test(message)) return `${message}. The query ends too early: check for a missing closing quote or parenthesis.`;
  if (/syntax error/.test(message)) return `${message}. Check spelling of keywords and commas between columns.`;
  return message;
}

function suggest(name: string, candidates: string[], kind: string): string {
  const close = [...new Set(candidates)]
    .map((c) => ({ c, d: distance(name.toLowerCase(), c.toLowerCase()) }))
    .filter((x) => x.d <= 3)
    .sort((a, b) => a.d - b.d)
    .slice(0, 3)
    .map((x) => x.c);
  return close.length ? `Did you mean ${close.join(', ')}?` : `Check the Schema tab for the ${kind} names.`;
}

function distance(a: string, b: string): number {
  const dp = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = dp[j];
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return dp[b.length];
}
