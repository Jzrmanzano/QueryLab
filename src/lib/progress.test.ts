import { describe, expect, it } from 'vitest';
import { applyAttempt } from './progress';

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
