---
id: windows.running
title: Running totals and the previous row
dataset: chinook
---
Give an aggregate's window an `ORDER BY` and it stops looking at the whole group. It looks at the rows from the start up to the current one, which makes a running total. Here are Chinook's monthly sales, with the total so far:

```sql run
WITH monthly AS (
  SELECT strftime('%Y-%m', InvoiceDate) AS month,
         SUM(Total) AS revenue
  FROM Invoice
  GROUP BY month
)
SELECT month, revenue,
       SUM(revenue) OVER (ORDER BY month)
         AS revenue_to_date
FROM monthly;
```

Add `PARTITION BY` and the total starts again for each group. `SUM(revenue) OVER (PARTITION BY SUBSTR(month, 1, 4) ORDER BY month)` starts again every January.

## Ties in a running total

"Up to the current row" includes every row that ties with it in the `ORDER BY`. Two invoices were issued on 1 February 2021, so ordering by date alone gives both of them the same running total:

```sql run
SELECT InvoiceId, InvoiceDate, Total,
       SUM(Total) OVER (
         ORDER BY InvoiceDate
       ) AS by_date,
       SUM(Total) OVER (
         ORDER BY InvoiceDate, InvoiceId
       ) AS by_invoice
FROM Invoice
WHERE InvoiceDate < '2021-03-01';
```

Add a column that's different on every row, such as the id, to the `ORDER BY`, and each row adds its own amount.

## Moving averages

A **frame** says exactly which rows the window covers. `ROWS BETWEEN 2 PRECEDING AND CURRENT ROW` means this row and the two before it, which gives a three-month moving average:

```sql run
WITH monthly AS (
  SELECT strftime('%Y-%m', InvoiceDate) AS month,
         SUM(Total) AS revenue
  FROM Invoice
  GROUP BY month
)
SELECT month, revenue,
       AVG(revenue) OVER (
         ORDER BY month
         ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
       ) AS three_month_average
FROM monthly;
```

The first two months don't have two months before them, so their average covers the months there are.

## LAG and LEAD: the row before and after

`LAG(column)` reads a value from the previous row in the window's order, and `LEAD(column)` reads it from the next row. The first row has no previous row, so `LAG` gives it `NULL`:

```sql run
WITH monthly AS (
  SELECT strftime('%Y-%m', InvoiceDate) AS month,
         SUM(Total) AS revenue
  FROM Invoice
  GROUP BY month
)
SELECT month, revenue,
       LAG(revenue) OVER (
         ORDER BY month
       ) AS previous_month,
       revenue - LAG(revenue) OVER (
         ORDER BY month
       ) AS change
FROM monthly;
```

`LAG(revenue, 12)` looks 12 rows back, which here is the same month a year earlier.

Window functions are standard SQL, and they work almost the same way in PostgreSQL, MySQL 8, SQL Server and SQLite.
