---
id: select.aliases-distinct
title: Aliases, calculations and DISTINCT
dataset: school
---
## Renaming columns with AS

`AS` gives a column a new name in the result. The table itself doesn't change, only how the output is labelled.

```sql run
SELECT code AS course_code, units AS credit_units
FROM courses;
```

## Calculating new columns

A column in `SELECT` can be an expression. Here's each student's age at the end of 2026:

```sql run
SELECT first_name, 2026 - birth_year AS age
FROM students;
```

Use `||` to join text together. (MySQL uses `CONCAT()` for this instead.)

```sql run
SELECT first_name || ' ' || last_name AS full_name
FROM students;
```

## Removing duplicates with DISTINCT

Many students share the same college. `DISTINCT` keeps only unique rows:

```sql run
SELECT DISTINCT college_id
FROM students;
```
