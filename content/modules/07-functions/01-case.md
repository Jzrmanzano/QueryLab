---
id: functions.case
title: CASE expressions
dataset: school
---
`CASE` lets a query choose a value row by row, the way "if this, then that, otherwise something else" works in everyday speech. At this school, grades run from 1.0 (best) to 3.0 (the lowest pass), and 5.0 is a fail. Here every enrollment gets a result in plain words:

```sql run
SELECT student_id, course_id, grade,
       CASE
         WHEN grade IS NULL THEN 'in progress'
         WHEN grade <= 3.0 THEN 'passed'
         ELSE 'failed'
       END AS result
FROM enrollments;
```

SQLite checks each `WHEN` from top to bottom and uses the first one that's true. `ELSE` covers the rows no `WHEN` matched; leave it out and those rows get `NULL`. Always close with `END`.

The order of the `WHEN`s matters. A missing grade is neither `<= 3.0` nor anything else, so without the first line, enrollments that haven't been graded yet would fall through to `ELSE` and show as failed.

## Matching one column against values

When every `WHEN` compares the same column with `=`, you can name the column once, right after `CASE`:

```sql run
SELECT semester,
       CASE semester
         WHEN '2025-1' THEN 'first semester'
         WHEN '2025-2' THEN 'second semester'
       END AS term,
       COUNT(*) AS enrollments
FROM enrollments
GROUP BY semester;
```

This short form only tests equality. For ranges such as `grade <= 3.0`, use the full form.

## Counting with CASE

Put a `CASE` inside `SUM` to count only the rows that meet a condition: each matching row adds 1 and every other row adds 0. One query can then count several things side by side:

```sql run
SELECT c.code,
       COUNT(*) AS enrolled,
       SUM(CASE WHEN e.grade = 5.0 THEN 1 ELSE 0 END) AS failed
FROM enrollments e
JOIN courses c ON c.id = e.course_id
GROUP BY c.code;
```

`WHERE e.grade = 5.0` couldn't do this. It would remove the other rows before `COUNT(*)` saw them, so `enrolled` would count only the failures.
