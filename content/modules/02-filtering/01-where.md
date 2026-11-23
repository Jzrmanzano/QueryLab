---
id: filtering.where
title: WHERE and comparisons
dataset: school
---
`WHERE` keeps only the rows where a condition is true. It goes after `FROM`.

```sql run
SELECT first_name, last_name, year_level
FROM students
WHERE year_level = 3;
```

## Comparison operators

| Operator | Meaning |
| --- | --- |
| `=` | equal |
| `<>` or `!=` | not equal |
| `<`, `>` | less than, greater than |
| `<=`, `>=` | less or equal, greater or equal |

Text values go in **single quotes**: `WHERE code = 'IT 202'`. Numbers don't need quotes.

## Combining conditions

`AND` needs both conditions to be true. `OR` needs at least one. When you mix them, use parentheses so the meaning is clear:

```sql run
SELECT first_name, college_id, year_level
FROM students
WHERE college_id = 2 AND (year_level = 1 OR year_level = 4);
```

Without the parentheses, `AND` is evaluated first, which gives a different (and usually wrong) answer.
