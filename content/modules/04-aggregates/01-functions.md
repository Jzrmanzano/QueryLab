---
id: aggregates.functions
title: COUNT, SUM, AVG, MIN and MAX
dataset: store
---
**Aggregate functions** turn many rows into one value.

| Function | Returns |
| --- | --- |
| `COUNT(*)` | number of rows |
| `COUNT(column)` | number of rows where the column is not NULL |
| `SUM(column)` | total |
| `AVG(column)` | average |
| `MIN(column)`, `MAX(column)` | smallest, largest |

```sql run
SELECT COUNT(*) AS products, SUM(stock) AS units_in_stock
FROM products;
```

Aggregates work together with `WHERE`. The filter runs first, then the rows that are left get counted:

```sql run
SELECT COUNT(*) AS delivered_orders
FROM orders
WHERE status = 'delivered';
```

You can aggregate an expression too. Here's the total value of one order:

```sql run
SELECT SUM(quantity * unit_price) AS order_total
FROM order_items
WHERE order_id = 1;
```
