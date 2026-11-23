---
id: windows.over
title: Aggregates over a window
dataset: penguins
---
`GROUP BY` squeezes each group into a single row. Sometimes you want to keep every row and still know something about the rows around it, such as how one penguin's weight compares with the rest of its species. That's what a **window function** does. Write an aggregate as usual, then add `OVER (...)` to say which rows it looks at:

```sql run
SELECT id, species, body_mass_g,
       AVG(body_mass_g) OVER () AS average_all
FROM penguins;
```

Empty parentheses make the window every row the query returns. All 344 penguins are still there, and each row carries the overall average.

## PARTITION BY: a window for each group

`PARTITION BY` splits the rows into groups the way `GROUP BY` does, but without merging them. Each row gets the value for its own group:

```sql run
SELECT id, species, body_mass_g,
       AVG(body_mass_g) OVER (
         PARTITION BY species
       ) AS species_average,
       body_mass_g - AVG(body_mass_g) OVER (
         PARTITION BY species
       ) AS difference
FROM penguins;
```

Any aggregate works like this. `COUNT(*) OVER (PARTITION BY island)` is the number of penguins on the same island as this one.

## Filtering on a window value

Window functions are worked out after `WHERE`, `GROUP BY` and `HAVING`, so none of those can use them. Try it and SQLite stops with "misuse of window function". Instead, compute the value in a `WITH`, then filter the result:

```sql run
WITH with_average AS (
  SELECT id, species, body_mass_g,
         AVG(body_mass_g) OVER (
           PARTITION BY species
         ) AS species_average
  FROM penguins
)
SELECT id, species, body_mass_g
FROM with_average
WHERE body_mass_g > species_average;
```
