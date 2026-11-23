import { describe, expect, it } from 'vitest';
import { compareResults, type QueryOutput } from './compare';

const out = (columns: string[], rows: QueryOutput['rows']): QueryOutput => ({ columns, rows });
const expected = out(['name', 'price'], [['A', 1], ['B', 2], ['B', 2]]);

describe('compareResults', () => {
  it('passes identical results', () => {
    expect(compareResults(expected, expected).pass).toBe(true);
  });

  it('ignores row order unless ordered', () => {
    const shuffled = out(['name', 'price'], [['B', 2], ['A', 1], ['B', 2]]);
    expect(compareResults(shuffled, expected).pass).toBe(true);
    expect(compareResults(shuffled, expected, { ordered: true })).toMatchObject({ pass: false, reason: 'order' });
  });

  it('counts duplicate rows', () => {
    const noDup = out(['name', 'price'], [['A', 1], ['B', 2], ['A', 1]]);
    expect(compareResults(noDup, expected)).toMatchObject({ pass: false, reason: 'rows' });
  });

  it('reports a row count difference', () => {
    const r = compareResults(out(['name', 'price'], [['A', 1]]), expected);
    expect(r).toMatchObject({ pass: false, reason: 'rows' });
    if (!r.pass) expect(r.message).toContain('1 row; expected 3 rows');
  });

  it('reports a column count difference', () => {
    expect(compareResults(out(['name'], [['A'], ['B'], ['B']]), expected)).toMatchObject({ pass: false, reason: 'columns' });
  });

  it('only checks column names when asked', () => {
    const renamed = out(['n', 'p'], expected.rows);
    expect(compareResults(renamed, expected).pass).toBe(true);
    expect(compareResults(renamed, expected, { columnNames: true })).toMatchObject({ pass: false, reason: 'columns' });
    expect(compareResults(out(['NAME', 'Price'], expected.rows), expected, { columnNames: true }).pass).toBe(true);
  });

  it('explains columns in the wrong order', () => {
    const swapped = out(['price', 'name'], [[1, 'A'], [2, 'B'], [2, 'B']]);
    const r = compareResults(swapped, expected);
    expect(r).toMatchObject({ pass: false, reason: 'columns' });
    if (!r.pass) expect(r.message).toContain('different order');
  });

  it('keeps NULL distinct from an empty string', () => {
    expect(compareResults(out(['x'], [[null]]), out(['x'], [['']])).pass).toBe(false);
  });

  it('rounds numbers to the precision', () => {
    expect(compareResults(out(['avg'], [[2687.083333]]), out(['avg'], [[2687.08]])).pass).toBe(true);
    expect(compareResults(out(['n'], [[3]]), out(['n'], [[3.0]])).pass).toBe(true);
    expect(compareResults(out(['n'], [[100]]), out(['n'], [[1]]), { precision: 0 }).pass).toBe(false);
  });

  it('keeps numbers distinct from text', () => {
    expect(compareResults(out(['n'], [['3']]), out(['n'], [[3]])).pass).toBe(false);
  });

  it('rejects a statement with no result set', () => {
    expect(compareResults(out([], []), expected)).toMatchObject({ pass: false, reason: 'empty' });
  });
});

describe('result diff', () => {
  const diffOf = (r: ReturnType<typeof compareResults>) => (r.pass ? undefined : r.diff);

  it('flags extra and missing rows, respecting duplicates', () => {
    // Yours has one B instead of two, plus a C. Expected's second B (index 2) is missing.
    const d = diffOf(compareResults(out(['name', 'price'], [['C', 3], ['B', 2], ['A', 1]]), expected));
    expect(d).toMatchObject({ extra: [0], missing: [2], misplaced: [], yoursTotal: 3, expectedTotal: 3 });
  });

  it('flags rows when the counts differ', () => {
    const d = diffOf(compareResults(out(['name', 'price'], [['A', 1]]), expected));
    expect(d).toMatchObject({ extra: [], missing: [1, 2] });
  });

  it('flags every out-of-place position for ordered checks', () => {
    const d = diffOf(compareResults(out(['name', 'price'], [['B', 2], ['A', 1], ['B', 2]]), expected, { ordered: true }));
    expect(d).toMatchObject({ misplaced: [0, 1], extra: [], missing: [] });
  });

  it('points at a misnamed column', () => {
    const d = diffOf(compareResults(out(['name', 'cost'], expected.rows), expected, { columnNames: true }));
    expect(d?.wrongColumn).toBe(1);
  });

  it('includes both tables but no row flags when the column count is wrong', () => {
    const d = diffOf(compareResults(out(['name'], [['A']]), expected));
    expect(d).toMatchObject({ yours: { columns: ['name'] }, expected: { columns: ['name', 'price'] }, extra: [], missing: [] });
  });

  it('caps the rows sent back but keeps flag indexes for all rows', () => {
    const many = out(['n'], Array.from({ length: 80 }, (_, i) => [i]));
    const d = diffOf(compareResults(out(['n'], many.rows.slice(0, 79)), many));
    expect(d?.yours.rows).toHaveLength(50);
    expect(d).toMatchObject({ yoursTotal: 79, expectedTotal: 80, missing: [79] });
  });

  it('has no diff for SQL errors or passing results', () => {
    expect(compareResults(out([], []), expected)).not.toHaveProperty('diff');
    expect(compareResults(expected, expected)).not.toHaveProperty('diff');
  });
});
