---
id: functions.text
title: Working with text
dataset: school
---
SQL has built-in functions for reshaping text. They don't change what's stored in the table, only what your query returns.

## Capitals and length

```sql run
SELECT last_name,
       UPPER(last_name) AS upper_case,
       LOWER(last_name) AS lower_case,
       LENGTH(last_name) AS letters
FROM students;
```

`=` compares text exactly, capitals included, so `'lim' = 'Lim'` is false. To match however a value was capitalised, compare lowercase with lowercase: `WHERE LOWER(last_name) = 'lim'`. (In SQLite, `LIKE` already ignores capitals for English letters.)

## Taking part of a value

`SUBSTR(text, start, length)` cuts out a piece of text, counting positions from 1. Every student number starts with the two-digit year the student entered:

```sql run
SELECT student_no, SUBSTR(student_no, 1, 2) AS entry_year
FROM students;
```

When the piece you want doesn't have a fixed length, find where it ends with `INSTR(text, search)`. It returns the position where `search` first appears, or 0 if it doesn't. The username in an email address is everything before the `@`:

```sql run
SELECT email, SUBSTR(email, 1, INSTR(email, '@') - 1) AS username
FROM students;
```

Students with no email get `NULL` for both columns. Almost every function returns `NULL` when it's given `NULL`.

## Replacing and trimming

`REPLACE(text, find, replacement)` swaps every match. Functions can be nested, and the inner one runs first, so this turns each course title into a lowercase web address:

```sql run
SELECT title, LOWER(REPLACE(title, ' ', '-')) AS slug
FROM courses;
```

`TRIM(text)` removes spaces from both ends of a value, which helps with data that was typed by hand.

Other databases name some of these functions differently. SQL Server uses `LEN` and `SUBSTRING`, and PostgreSQL uses `STRPOS` where SQLite uses `INSTR`.
