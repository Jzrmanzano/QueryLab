// Every exercise's own solution must pass its own check on its dataset.
// A broken exercise fails CI instead of reaching students.
import { beforeAll, describe, expect, it } from 'vitest';
import initSqlJs from 'sql.js';
import { Engine } from '../engine/core';
import { exercises, lessons, modules } from './loader';
import { datasetIds, loadDataset } from './datasets';
import { GUIDE_LESSON_IDS } from '../pages/Guide';

let engine: Engine;
let datasets: Record<string, string>;
beforeAll(async () => {
  engine = new Engine(await initSqlJs());
  datasets = Object.fromEntries(await Promise.all(datasetIds.map(async (id) => [id, await loadDataset(id)])));
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

  // Every "Try it" example in a lesson must run on that lesson's dataset.
  const examples = lessons.flatMap((l) =>
    [...l.body.matchAll(/```sql run\r?\n([\s\S]*?)```/g)].map((m, i) => [`${l.id} example ${i + 1}`, l.dataset, m[1]] as const),
  );
  it.each(examples)('%s runs', (_name, dataset, sql) => {
    expect(() => engine.run(dataset, datasets[dataset], sql)).not.toThrow();
  });

  it('reports primary keys and foreign keys in the schema', () => {
    const col = (dataset: string, table: string, column: string) =>
      engine.schema(dataset, datasets[dataset]).find((t) => t.name === table)?.columns.find((c) => c.name === column);

    expect(col('store', 'customers', 'id')).toMatchObject({ pk: true });
    expect(col('store', 'orders', 'customer_id')).toMatchObject({ pk: false, references: { table: 'customers', column: 'id' } });
    // A composite key: both columns are part of the primary key, and both are foreign keys.
    expect(col('store', 'order_items', 'order_id')).toMatchObject({ pk: true, references: { table: 'orders' } });
    expect(col('store', 'order_items', 'product_id')).toMatchObject({ pk: true, references: { table: 'products' } });
    // A self-reference.
    expect(col('chinook', 'Employee', 'ReportsTo')).toMatchObject({ references: { table: 'Employee', column: 'EmployeeId' } });
    // One flat table: no foreign keys at all.
    const penguins = engine.schema('penguins', datasets.penguins);
    expect(penguins.flatMap((t) => t.columns).some((c) => c.references)).toBe(false);
  });

  it('links the schema guide only to lessons that exist', () => {
    const ids = new Set(lessons.map((l) => l.id));
    for (const id of GUIDE_LESSON_IDS) expect(ids, id).toContain(id);
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
