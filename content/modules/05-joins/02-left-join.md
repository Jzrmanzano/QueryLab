---
id: joins.left
title: LEFT JOIN
dataset: school
---
An inner join drops rows that have no match. A `LEFT JOIN` keeps **every** row from the left (first) table. Where there's no match, the columns from the right table are `NULL`.

```sql run
SELECT c.code, i.last_name
FROM courses c
LEFT JOIN instructors i ON i.id = c.instructor_id;
```

Now the course with no instructor appears too, with `NULL` as the last name.

## Finding rows with no match

Combine `LEFT JOIN` with `IS NULL` to find things that are missing, such as students with no enrollments:

```sql run
SELECT s.first_name, s.last_name
FROM students s
LEFT JOIN enrollments e ON e.student_id = s.id
WHERE e.student_id IS NULL;
```

## Counting with LEFT JOIN

When you count matches, use `COUNT(column)` on the right table, not `COUNT(*)`. `COUNT(*)` counts the row that has no match as 1:

```sql run
SELECT i.last_name, COUNT(c.id) AS courses_taught
FROM instructors i
LEFT JOIN courses c ON c.instructor_id = i.id
GROUP BY i.id;
```
