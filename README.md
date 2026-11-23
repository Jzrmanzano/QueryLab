# QueryLab

A self-paced website for learning SQL. Students read a short lesson, write queries against a real SQLite database running in their browser, and get each exercise checked instantly.

- **Stack:** Vite + React + TypeScript, sql.js (SQLite in WebAssembly) in a Web Worker, CodeMirror 6, Vercel hosting. No accounts or backend: progress is saved in the browser's localStorage.
- **Content:** 6 modules, 15 lessons, 44 exercises, 4 datasets (`school`, `store`, `chinook`, `penguins`). All of it is plain files in `content/`. Each dataset loads only when a lesson or the playground first uses it.

## Run it locally

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # grader unit tests + every exercise checked against its dataset
npm run build      # type-check and build to dist/
```

No setup or environment variables needed.

## Progress

Each learner's progress (attempts, solved exercises, last submitted query) is stored in their own browser under the localStorage key `querylab.progress.v1` (see `src/lib/progress.tsx`). It never leaves the device, so it doesn't sync across browsers or devices, and clearing site data erases it. Learners can download a JSON backup from the Progress page and restore it on another device; restoring merges with what's already there (solved wins, the newer query wins).

## Deploy to Vercel

Import the repo in Vercel (framework preset: Vite) and deploy. `vercel.json` sends every route to `index.html` so deep links like `/learn/05-joins/02-left-join` work.

The privacy policy lives in `src/pages/Privacy.tsx`. Update it if QueryLab starts collecting anything new.

## Dataset credits

- `school` and `store` were written for QueryLab.
- `chinook`: [Chinook Database](https://github.com/lerocha/chinook-database) v1.4.5 by Luis Rocha, MIT licensed. The full license notice is kept at the top of `content/datasets/chinook.sql`; keep it there if you update the file.
- `penguins`: [palmerpenguins](https://allisonhorst.github.io/palmerpenguins/) by Allison Horst, Alison Hill and Kristen Gorman, CC0. Data collected by Dr. Kristen Gorman and the Palmer Station LTER. QueryLab added the `id` column and stores `NA` as `NULL`.

## Adding a lesson

1. Add `content/modules/<NN-module>/<NN-lesson>.md` with frontmatter `id`, `title` and `dataset`. Code blocks marked `sql run` get a **Try it** button.
2. Add `<NN-lesson>.exercises.yaml` next to it:

   ```yaml
   - id: joins.left.e4            # never rename an id once published: saved progress uses it
     prompt: What the student should find.
     dataset: school
     starter: "SELECT "            # optional
     solution: SELECT ...;
     check: { ordered: true }      # optional: ordered, columnNames, precision, verify
     hints: [First hint, Second hint]
   ```

3. Run `npm test`. It fails if any solution doesn't pass its own check or returns no rows.

For INSERT/UPDATE/DELETE exercises, set `check.verify` to a SELECT. The grader runs the student's statement and the solution on separate fresh copies, then compares what `verify` returns on each.

## How grading works

The grader compares **results**, not query text, so any correct query passes. Rows are compared as a multiset (order ignored, duplicates counted) unless `ordered: true`. Numbers are rounded to 2 decimals, and `NULL` is kept distinct from `''`. Every run uses a fresh in-memory copy of the dataset, and queries running longer than 3 seconds are stopped.

Grading happens in the browser, so the expected answers are in the bundle. That's fine for self-paced practice, which is all QueryLab is for.

## Project layout

```text
content/datasets/      school.sql, store.sql (seed data)
content/modules/       module.yaml, lessons (.md), exercises (.exercises.yaml)
src/engine/            compare.ts (pure grading), core.ts (sql.js), sql.worker.ts, client.ts
src/content/           loader.ts, datasets.ts, content.test.ts
src/components/        SqlEditor, ResultsTable, SchemaPanel, Workspace, LessonBody
src/pages/             Landing, ModuleMap, LessonPage, Playground, ProgressPage, Privacy
```
