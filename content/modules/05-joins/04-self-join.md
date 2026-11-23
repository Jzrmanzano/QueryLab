---
id: joins.self
title: Joining a table to itself
dataset: chinook
---
In Chinook, every employee except the general manager reports to someone. That someone is also an employee, so `Employee.ReportsTo` points back into the **same** table:

```sql run
SELECT EmployeeId, FirstName, LastName, Title, ReportsTo
FROM Employee;
```

To put each employee next to their manager's name, join `Employee` to itself. Give the table two different aliases so SQL can tell the two roles apart: `e` for the employee and `m` for the manager.

```sql run
SELECT e.FirstName || ' ' || e.LastName AS employee,
       m.FirstName || ' ' || m.LastName AS manager
FROM Employee e
JOIN Employee m ON m.EmployeeId = e.ReportsTo;
```

Read the `ON` line as: "the manager row is the one whose id equals this employee's `ReportsTo`".

## Keep the employee with no manager

The general manager's `ReportsTo` is `NULL`, so the inner join above drops them. A `LEFT JOIN` keeps every employee and leaves the manager columns `NULL` when there's no match:

```sql run
SELECT e.FirstName || ' ' || e.LastName AS employee,
       m.FirstName || ' ' || m.LastName AS manager
FROM Employee e
LEFT JOIN Employee m ON m.EmployeeId = e.ReportsTo;
```

Self-joins appear wherever a table refers to itself: managers and staff, categories and subcategories, replies to comments.
