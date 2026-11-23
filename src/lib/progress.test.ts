import { describe, expect, it } from 'vitest';
import { applyAttempt, mergeRow, mergeRows, parseBackup, toBackup, type ProgressRow } from './progress';

const T1 = '2026-11-23T10:00:00.000Z';
const T2 = '2026-11-23T11:00:00.000Z';

describe('applyAttempt', () => {
  it('records a first failed attempt', () => {
    expect(applyAttempt(undefined, 'ex1', 'SELECT 1', false, T1)).toEqual({
      exercise_id: 'ex1', status: 'attempted', attempts: 1, last_sql: 'SELECT 1', solved_at: null, updated_at: T1,
    });
  });

  it('marks a pass as solved and stamps solved_at', () => {
    const prev = applyAttempt(undefined, 'ex1', 'SELECT 1', false, T1);
    const row = applyAttempt(prev, 'ex1', 'SELECT 2', true, T2);
    expect(row).toMatchObject({ status: 'solved', attempts: 2, last_sql: 'SELECT 2', solved_at: T2 });
  });

  it('never un-solves, and keeps the first solved_at', () => {
    const solved = applyAttempt(undefined, 'ex1', 'SELECT 1', true, T1);
    const row = applyAttempt(solved, 'ex1', 'SELECT oops', false, T2);
    expect(row).toMatchObject({ status: 'solved', attempts: 2, last_sql: 'SELECT oops', solved_at: T1, updated_at: T2 });
  });
});

const row = (over: Partial<ProgressRow>): ProgressRow => ({
  exercise_id: 'ex1', status: 'attempted', attempts: 1, last_sql: 'SELECT 1', solved_at: null, updated_at: T1, ...over,
});

describe('backups', () => {
  it('round-trips through a backup file', () => {
    const rows = { ex1: row({}), ex2: row({ exercise_id: 'ex2', status: 'solved', solved_at: T1 }) };
    expect(parseBackup(toBackup(rows, T2))).toEqual(rows);
  });

  it('rejects files that are not QueryLab backups', () => {
    expect(() => parseBackup('not json')).toThrow("couldn't be read");
    expect(() => parseBackup('{"hello": 1}')).toThrow("isn't a QueryLab progress backup");
    expect(() => parseBackup(JSON.stringify({ app: 'querylab', version: 99, progress: {} }))).toThrow('newer version');
  });

  it('drops malformed rows but keeps the valid ones', () => {
    const text = JSON.stringify({
      app: 'querylab',
      version: 1,
      progress: {
        ex1: row({}),
        bad1: { exercise_id: 'bad1', status: 'maybe', attempts: 1, last_sql: null, solved_at: null, updated_at: T1 },
        bad2: row({ exercise_id: 'not-bad2' }), // key and id disagree
        bad3: row({ exercise_id: 'bad3', attempts: -2 }),
      },
    });
    expect(Object.keys(parseBackup(text))).toEqual(['ex1']);
  });
});

describe('mergeRow', () => {
  it('keeps solved, the first solve date, the most attempts, and the newer query', () => {
    const here = row({ status: 'attempted', attempts: 5, last_sql: 'newer', updated_at: T2 });
    const backup = row({ status: 'solved', attempts: 2, last_sql: 'older', solved_at: T1, updated_at: T1 });
    expect(mergeRow(here, backup)).toEqual({
      exercise_id: 'ex1', status: 'solved', attempts: 5, last_sql: 'newer', solved_at: T1, updated_at: T2,
    });
  });

  it('is unaffected by restoring the same backup twice', () => {
    const rows = { ex1: row({ attempts: 3 }) };
    expect(mergeRows(mergeRows({}, rows), rows)).toEqual(rows);
  });

  it('adds exercises that only exist in the backup', () => {
    const merged = mergeRows({ ex1: row({}) }, { ex2: row({ exercise_id: 'ex2' }) });
    expect(Object.keys(merged).sort()).toEqual(['ex1', 'ex2']);
  });
});
