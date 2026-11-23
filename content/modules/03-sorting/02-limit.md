---
id: sorting.limit
title: LIMIT and OFFSET
dataset: store
---
`LIMIT n` returns only the first `n` rows. Combined with `ORDER BY`, it answers "top N" questions:

```sql run
SELECT name, price
FROM products
ORDER BY price DESC
LIMIT 3;
```

`OFFSET` skips rows before the limit starts. This is how pages of results work: page 2 of 5-row pages is `LIMIT 5 OFFSET 5`.

```sql run
SELECT id, ordered_on
FROM orders
ORDER BY ordered_on
LIMIT 5 OFFSET 5;
```

Always use `ORDER BY` with `LIMIT`. Without it, "the first 3 rows" can be any 3 rows.

MySQL and SQLite both use `LIMIT`. SQL Server uses `TOP`, and the SQL standard uses `FETCH FIRST n ROWS ONLY`.
