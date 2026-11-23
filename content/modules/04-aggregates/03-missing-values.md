---
id: aggregates.missing-values
title: Missing values in aggregates
dataset: penguins
---
Real data has gaps. The `penguins` table holds measurements of 344 penguins from Antarctica, and a few of them couldn't be measured or sexed. Those values are `NULL`: not zero, not empty text, but *unknown*.

```sql run
SELECT id, species, island, body_mass_g, sex
FROM penguins
WHERE sex IS NULL;
```

Remember to write `IS NULL`, not `= NULL`. Comparing anything with `=` to `NULL` gives unknown, so `WHERE sex = NULL` matches no rows at all.

## COUNT(*) versus COUNT(column)

`COUNT(*)` counts rows. `COUNT(column)` counts only the rows where that column is **not** `NULL`:

```sql run
SELECT COUNT(*) AS penguins,
       COUNT(sex) AS with_sex,
       COUNT(body_mass_g) AS weighed
FROM penguins;
```

Same table, three different answers. Pick the one that matches the question you're asking.

## Other aggregates skip NULLs too

`SUM`, `AVG`, `MIN` and `MAX` ignore `NULL` values. The average body mass below is over the penguins that were actually weighed, not all 344:

```sql run
SELECT species, AVG(body_mass_g) AS avg_mass_g
FROM penguins
GROUP BY species;
```

That's usually what you want. Treating unknown weights as 0 would drag the average down.

## NULL gets its own group

`GROUP BY` puts all the `NULL`s together in one group. Use `COALESCE(value, fallback)`, which returns the first value that isn't `NULL`, to give that group a readable label:

```sql run
SELECT COALESCE(sex, 'unknown') AS sex, COUNT(*) AS penguins
FROM penguins
GROUP BY COALESCE(sex, 'unknown');
```
