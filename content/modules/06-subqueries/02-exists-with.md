---
id: subqueries.exists-with
title: EXISTS and WITH
dataset: school
---
## EXISTS

`EXISTS (subquery)` is true when the subquery returns at least one row. The subquery can refer to the outer row. This is called a **correlated** subquery:

```sql run
SELECT c.code, c.title
FROM courses c
WHERE EXISTS (
  SELECT 1 FROM enrollments e
  WHERE e.course_id = c.id AND e.grade = 5.0
);
```

That query lists courses where at least one student failed (a grade of 5.0). `NOT EXISTS` does the opposite.

## WITH: named subqueries (CTEs)

A **common table expression** gives a subquery a name at the top of the query, so the main query reads like a story:

```sql run
WITH per_course AS (
  SELECT course_id, AVG(grade) AS avg_grade
  FROM enrollments
  WHERE grade IS NOT NULL
  GROUP BY course_id
)
SELECT c.code, per_course.avg_grade
FROM per_course
JOIN courses c ON c.id = per_course.course_id
ORDER BY per_course.avg_grade;
```

You can define several CTEs, separated by commas, and later ones can use earlier ones.
