// Pure result-set comparison. No DOM, no sql.js: easy to unit test.

export type Cell = number | string | null | Uint8Array;

export interface QueryOutput {
  columns: string[];
  rows: Cell[][];
}

export interface Check {
  ordered?: boolean;      // compare rows in sequence (ORDER BY lessons)
  columnNames?: boolean;  // column names must match (alias lessons)
  precision?: number;     // decimal places for numbers, default 2
  verify?: string;        // for INSERT/UPDATE/DELETE: query whose output is compared
}

export type GradeResult =
  | { pass: true }
  | { pass: false; reason: 'error' | 'empty' | 'columns' | 'rows' | 'order'; message: string };

function cellKey(v: Cell, precision: number): string {
  if (v === null) return 'null';
  if (typeof v === 'number') {
    const s = v.toFixed(precision);
    return 'n:' + (s.includes('.') ? s.replace(/\.?0+$/, '') : s);
  }
  if (v instanceof Uint8Array) return 'b:' + Array.from(v).join(',');
  return 's:' + v;
}

function rowKey(row: Cell[], precision: number): string {
  return JSON.stringify(row.map((v) => cellKey(v, precision)));
}

/** True when every expected column appears among the student's columns, just in another position. */
function sameColumnsReordered(student: QueryOutput, expected: QueryOutput, precision: number): boolean {
  const column = (o: QueryOutput, i: number) => o.rows.map((r) => cellKey(r[i], precision)).sort().join('\n');
  const free = student.columns.map((_, i) => column(student, i));
  return expected.columns.every((_, i) => {
    const j = free.indexOf(column(expected, i));
    if (j === -1) return false;
    free[j] = '\0used';
    return true;
  });
}

const plural =(n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

export function compareResults(student: QueryOutput, expected: QueryOutput, check: Check = {}): GradeResult {
  const precision = check.precision ?? 2;

  if (student.columns.length === 0) {
    return { pass: false, reason: 'empty', message: 'Your statement did not return any rows to check. Did you write a SELECT?' };
  }

  if (student.columns.length !== expected.columns.length) {
    return {
      pass: false,
      reason: 'columns',
      message: `Your result has ${plural(student.columns.length, 'column')}; expected ${plural(expected.columns.length, 'column')}.`,
    };
  }

  if (check.columnNames) {
    const want = expected.columns.map((c) => c.toLowerCase());
    const got = student.columns.map((c) => c.toLowerCase());
    const wrong = want.findIndex((c, i) => c !== got[i]);
    if (wrong !== -1) {
      return {
        pass: false,
        reason: 'columns',
        message: `Column ${wrong + 1} is named "${student.columns[wrong]}"; expected "${expected.columns[wrong]}".`,
      };
    }
  }

  const got = student.rows.map((r) => rowKey(r, precision));
  const want = expected.rows.map((r) => rowKey(r, precision));

  if (got.length !== want.length) {
    return {
      pass: false,
      reason: 'rows',
      message: `Your result has ${plural(got.length, 'row')}; expected ${plural(want.length, 'row')}.`,
    };
  }

  const sameSet = [...got].sort().join('\n') === [...want].sort().join('\n');
  if (!sameSet && sameColumnsReordered(student, expected, precision)) {
    return {
      pass: false,
      reason: 'columns',
      message: 'You have the right data, but the columns are in a different order. Put them in the order the exercise asks for.',
    };
  }
  if (!sameSet) {
    const remaining = new Map<string, number>();
    for (const k of want) remaining.set(k, (remaining.get(k) ?? 0) + 1);
    let wrongRows = 0;
    for (const k of got) {
      const n = remaining.get(k) ?? 0;
      if (n > 0) remaining.set(k, n - 1);
      else wrongRows++;
    }
    return {
      pass: false,
      reason: 'rows',
      message: `The row count is right, but ${plural(wrongRows, 'row')} ${wrongRows === 1 ? 'has' : 'have'} different values than expected.`,
    };
  }

  if (check.ordered && got.join('\n') !== want.join('\n')) {
    const first = got.findIndex((k, i) => k !== want[i]);
    return {
      pass: false,
      reason: 'order',
      message: `You have the right rows, but in the wrong order (first difference at row ${first + 1}). Check your ORDER BY.`,
    };
  }

  return { pass: true };
}
