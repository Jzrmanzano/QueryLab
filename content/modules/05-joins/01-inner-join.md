---
id: joins.inner
title: INNER JOIN
dataset: school
---
Related data is split across tables. A course row doesn't store the instructor's name, only `instructor_id`, which points to a row in `instructors`. A **join** puts the matching rows back together.

```sql run
SELECT courses.code, instructors.last_name
FROM courses
JOIN instructors ON instructors.id = courses.instructor_id;
```

`ON` says how rows match. `JOIN` on its own means `INNER JOIN`: only rows that have a match on **both** sides are kept. That's why the course with no instructor is missing from the result above.

## Table aliases

Typing table names gets long, so give each table a short alias:

```sql run
SELECT c.code, c.title, i.first_name, i.last_name
FROM courses AS c
JOIN instructors AS i ON i.id = c.instructor_id;
```

## Joining more than two tables

`enrollments` links students to courses. Each extra table needs its own `JOIN ... ON`:

```sql run
SELECT s.first_name, co.code, e.grade
FROM enrollments e
JOIN students s ON s.id = e.student_id
JOIN courses co ON co.id = e.course_id
LIMIT 10;
```
