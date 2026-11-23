---
id: windows.ranking
title: Numbering and ranking
dataset: store
---
Some window functions number rows instead of summarizing them. They need an `ORDER BY` inside `OVER` to say which order to count in:

```sql run
SELECT name, price,
       ROW_NUMBER() OVER (
         ORDER BY price DESC
       ) AS position
FROM products;
```

That `ORDER BY` only decides the numbering. To sort the rows you get back, you still need an `ORDER BY` at the end of the query.

## Ties: ROW_NUMBER, RANK and DENSE_RANK

These three differ only when values tie. Here customers are ranked by how many orders they've placed, and four of them have placed 6. All three functions use the same window, so it's written once with `WINDOW` and referred to by name:

```sql run
SELECT c.name, COUNT(*) AS orders,
       ROW_NUMBER() OVER by_orders AS row_number,
       RANK() OVER by_orders AS rank,
       DENSE_RANK() OVER by_orders AS dense_rank
FROM orders o
JOIN customers c ON c.id = o.customer_id
GROUP BY c.id, c.name
WINDOW by_orders AS (ORDER BY COUNT(*) DESC)
ORDER BY orders DESC;
```

- `ROW_NUMBER` gives every row its own number, so the four tied customers get 2, 3, 4 and 5 in no particular order.
- `RANK` gives tied rows the same rank, then skips ahead: 1, 2, 2, 2, 2, 6.
- `DENSE_RANK` gives tied rows the same rank without skipping: 1, 2, 2, 2, 2, 3.

When you use `ROW_NUMBER` and ties are possible, add a second column to its `ORDER BY`, such as `ORDER BY COUNT(*) DESC, c.name`, so you get the same numbers every time.

The window is worked out after `GROUP BY`, which is why it can rank the customers by `COUNT(*)`.

## Ranking within groups

`PARTITION BY` starts the numbering again for each group. This ranks products by price within their category:

```sql run
SELECT category, name, price,
       RANK() OVER (
         PARTITION BY category
         ORDER BY price DESC
       ) AS rank_in_category
FROM products
ORDER BY category, rank_in_category;
```

## The top rows of each group

To keep only the top rows of each group, rank them in a `WITH` and filter on the rank. This finds the most expensive product in each category, and it's one of the most common reasons to use a window function:

```sql run
WITH ranked AS (
  SELECT category, name, price,
         RANK() OVER (
           PARTITION BY category
           ORDER BY price DESC
         ) AS r
  FROM products
)
SELECT category, name, price
FROM ranked
WHERE r = 1;
```

Change `r = 1` to `r <= 3` and you get the top three of each category.
