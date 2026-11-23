---
id: subqueries.basics
title: Subqueries in WHERE
dataset: school
---
A **subquery** is a `SELECT` inside another statement, written in parentheses. The inner query runs first, and the outer query uses its result.

## IN (subquery)

When the subquery returns a list of values, use `IN`:

```sql run
SELECT first_name, last_name
FROM students
WHERE id IN (SELECT student_id FROM enrollments WHERE grade = 1.0);
```

## Scalar subqueries

When the subquery returns exactly **one value**, you can compare against it with `=`, `<` or `>`:

```sql run
SELECT code, title, units
FROM courses
WHERE units > (SELECT AVG(units) FROM courses);
```

Subqueries can be nested. Here, the innermost query finds a course id from its title:

```sql run
SELECT student_id, grade
FROM enrollments
WHERE course_id = (SELECT id FROM courses WHERE code = 'IT 101');
```

Many subqueries can also be written as joins. Use whichever is easier to read.
