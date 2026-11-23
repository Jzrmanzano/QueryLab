---
id: sorting.order-by
title: ORDER BY
dataset: store
---
This module uses the `store` dataset, a small electronics shop with customers, products and orders.

Without `ORDER BY`, a database may return rows in any order. Add `ORDER BY` at the end to sort them:

```sql run
SELECT name, price
FROM products
ORDER BY price;
```

Sorting is ascending (smallest first, A to Z) by default. Add `DESC` for descending:

```sql run
SELECT name, stock
FROM products
ORDER BY stock DESC;
```

## Sorting by several columns

List more than one column to break ties. Rows are sorted by the first column, and rows with the same value are then sorted by the next one. Each column can have its own direction:

```sql run
SELECT category, name, price
FROM products
ORDER BY category ASC, price DESC;
```
