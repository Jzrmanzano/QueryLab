---
id: select.first-query
title: Your first SELECT
dataset: school
---
A database stores data in **tables**. Each table has named **columns**, and each row is one record. The `school` dataset has a `students` table with one row per student.

To read data, you write a `SELECT` statement: the columns you want, then `FROM` and the table name.

```sql run
SELECT first_name, last_name
FROM students;
```

Click **Try it** to load the example into the editor, then press **Run** (or Ctrl+Enter).

A few rules worth knowing early:

- Separate column names with commas. There's no comma after the last one.
- `SELECT *` means "every column". It's handy for exploring, but in real code, name the columns you need.
- SQL keywords aren't case-sensitive (`select` works too), but writing them in capitals makes queries easier to read.
- The semicolon ends the statement.

```sql run
SELECT * FROM colleges;
```

Open the **Schema** tab any time to see every table and column in the dataset.
