---
id: aggregates.group-by
title: GROUP BY and HAVING
dataset: store
---
`GROUP BY` splits rows into groups that share a value, then runs the aggregate once per group:

```sql run
SELECT category, COUNT(*) AS products, AVG(price) AS avg_price
FROM products
GROUP BY category;
```

The rule: every column in `SELECT` must either be in `GROUP BY` or be inside an aggregate function. SQLite lets you break this rule and silently picks a value from the group, but most other databases give an error, so don't rely on it.

## HAVING: filter the groups

`WHERE` filters rows *before* grouping. `HAVING` filters groups *after* grouping, so it can use aggregates:

```sql run
SELECT customer_id, COUNT(*) AS orders
FROM orders
GROUP BY customer_id
HAVING COUNT(*) >= 5;
```

You can use both in one query: `WHERE` decides which rows go into the groups, and `HAVING` decides which groups to keep.

```sql run
SELECT status, COUNT(*) AS orders
FROM orders
WHERE ordered_on >= '2025-04-01'
GROUP BY status
HAVING COUNT(*) > 1;
```
