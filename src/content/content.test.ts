// Every exercise's own solution must pass its own check on its dataset.
// A broken exercise fails CI instead of reaching students.
import { beforeAll, describe, expect, it } from 'vitest';
import initSqlJs from 'sql.js';
import { Engine } from '../engine/core';
import { exercises, lessons, modules } from './loader';
import { datasets } from './datasets';

let engine: Engine;
beforeAll(async () => {
  engine = new Engine(await initSqlJs());
});

describe('content', () => {
  it('loads all modules, lessons and exercises', () => {
    expect(modules.length).toBe(6);
    expect(lessons.length).toBeGreaterThan(0);
    expect(exercises.length).toBeGreaterThanOrEqual(30);
  });

  it('has unique exercise ids', () => {
    const ids = exercises.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('uses only datasets that exist', () => {
    for (const l of lessons) expect(datasets, l.id).toHaveProperty(l.dataset);
    for (const e of exercises) expect(datasets, e.id).toHaveProperty(e.dataset);
  });

  it.each(exercises.map((e) => [e.id, e] as const))('%s: solution passes its own check', (_id, e) => {
    const r = engine.grade(e.dataset, datasets[e.dataset], e.solution, e.solution, e.check);
    expect(r).toEqual({ pass: true });
    const out = engine.run(e.dataset, datasets[e.dataset], e.solution);
    expect(out.rowCount, 'solution returns no rows').toBeGreaterThan(0);
  });

  it('grades a wrong answer as wrong', () => {
    const r = engine.grade('school', datasets.school, 'SELECT first_name FROM students', 'SELECT first_name, last_name FROM students');
    expect(r).toMatchObject({ pass: false, reason: 'columns' });
  });

  it('explains a misspelled column', () => {
    const r = engine.grade('school', datasets.school, 'SELECT frist_name FROM students', 'SELECT first_name FROM students');
    expect(r.pass).toBe(false);
    if (!r.pass) expect(r.message).toContain('first_name');
  });
});
