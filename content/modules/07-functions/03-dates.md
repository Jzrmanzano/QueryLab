---
id: functions.dates
title: Dates
dataset: store
---
SQLite has no separate date type. Dates are stored as text in the form `YYYY-MM-DD`, such as `'2025-03-16'`. Because the year comes first, comparing and sorting that text puts dates in the right order:

```sql run
SELECT id, ordered_on
FROM orders
WHERE ordered_on >= '2025-06-01'
ORDER BY ordered_on;
```

## Pulling out part of a date

`strftime(format, date)` formats a date. In the format, `%Y` is the year, `%m` the month, `%d` the day, and `%w` the day of the week, where 0 is Sunday:

```sql run
SELECT id, ordered_on,
       strftime('%Y', ordered_on) AS year,
       strftime('%m', ordered_on) AS month,
       strftime('%w', ordered_on) AS weekday
FROM orders;
```

`strftime` always returns text, so `WHERE strftime('%m', ordered_on) = 3` matches nothing: the text `'03'` isn't the number 3. Compare with `'03'` instead, or convert the text first with `CAST(strftime('%m', ordered_on) AS INTEGER)`.

## Grouping by month

The format `'%Y-%m'` gives a label like `2025-03` that's the same for every day of that month, so you can group by it:

```sql run
SELECT strftime('%Y-%m', ordered_on) AS month,
       COUNT(*) AS orders
FROM orders
GROUP BY month
ORDER BY month;
```

## Date arithmetic

`date(value, modifier)` moves a date by a modifier such as `'+7 days'`, `'-1 month'` or `'start of month'`. `julianday(value)` turns a date into a day number, so subtracting two of them gives the number of days between:

```sql run
SELECT o.id, c.joined_on, o.ordered_on,
       date(o.ordered_on, '+7 days') AS follow_up,
       julianday(o.ordered_on)
         - julianday(c.joined_on)
         AS days_after_joining
FROM orders o
JOIN customers c ON c.id = o.customer_id;
```

`date('now')` gives today's date. It's useful in real work, but its answer changes every day, so these exercises don't use it.

Date functions differ more between databases than most of SQL. MySQL has `YEAR()` and `DATE_FORMAT()`, and PostgreSQL has `EXTRACT()` and `to_char()`.
