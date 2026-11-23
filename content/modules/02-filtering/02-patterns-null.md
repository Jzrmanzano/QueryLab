---
id: filtering.patterns-null
title: IN, BETWEEN, LIKE and NULL
dataset: school
---
## IN: match any value in a list

```sql run
SELECT code, title FROM courses
WHERE college_id IN (2, 3);
```

## BETWEEN: a range, ends included

```sql run
SELECT first_name, last_name, hired_year FROM instructors
WHERE hired_year BETWEEN 2015 AND 2020;
```

## LIKE: text patterns

`%` matches any run of characters (including none), and `_` matches exactly one character.

```sql run
SELECT first_name, last_name FROM students
WHERE last_name LIKE 'S%';
```

In SQLite, `LIKE` ignores upper/lower case for English letters.

## NULL: a missing value

`NULL` means "no value", which is different from `0` or an empty string. You can't compare it with `=`. Use `IS NULL` or `IS NOT NULL` instead:

```sql run
SELECT code, title FROM courses
WHERE instructor_id IS NULL;
```

Try `WHERE instructor_id = NULL` and you'll see it returns nothing, because `NULL = NULL` isn't true.
