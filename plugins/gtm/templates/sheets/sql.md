# SQL

> Helps a developer or reviewer write, review and change SQL queries and schemas that stay correct,
> safe and fast as data and traffic grow.

## When it applies
- Writing or reviewing a query, view, function or stored procedure in SQL.
- Building a statement from outside input: search, filters, sort order, a table or column chosen at
  run time.
- Changing the schema of a database that serves live traffic (a migration).
- Listing or paging results, or chasing a query that slowed down as tables grew.
- Deciding whether to use a newer standard feature: native JSON type, property graph queries, NULL
  handling in unique constraints.

## Method
1. Pin the target: name the engine and its version, and set the linter to that dialect. Before
   relying on a standard feature, check that this engine supports it: every SQL:2023 addition is
   optional, and some defaults are left to the implementation.
2. Keep data out of the SQL text:
   - bind every value as a parameter;
   - take table names, column names and sort direction only from a fixed allow-list in code;
   - inside procedures, bind values in dynamic SQL too;
   - never rely on escaping;
   - give the application account only the rights it needs.
3. Write predicates that stay correct with NULLs and time ranges:
   - NOT EXISTS rather than NOT IN over a subquery;
   - half-open ranges (start included, end excluded) rather than BETWEEN on timestamps;
   - time-zone-aware timestamp types;
   - no arbitrary string length; a check constraint carries the real rule;
   - state explicitly whether NULLs count as duplicates in a unique constraint.
4. Write each invariant (uniqueness, not null, allowed values, references) as a query that returns
   the offending rows. Run them all after the migrations apply on a fresh database: zero rows
   passes.
5. For a query on a hot path:
   - read its plan with real execution on production-sized data, inside a transaction that is rolled back when the statement writes;
   - compare estimated and actual rows;
   - make the ORDER BY of any limited or paged query unique, adding a unique column last when needed: tied rows come back in no fixed order, so pages can repeat or drop them, and paging by a last key that is not unique skips the rest of its tie;
   - page by the last key seen rather than by offset when users page deep or rows keep arriving.
6. Change a live schema in three phases:
   - expand: add the new shape beside the old;
   - migrate: move the code that reads and writes;
   - contract: remove the old shape once nothing uses it.

   Where the engine allows, build indexes without blocking writes, add constraints without checking existing rows and validate them in a later step, and set a lock timeout.

   Backfill existing rows as a separate step. Never run it inside the transaction that changes the schema, and never as one statement over a large table: update in batches, commit each batch, and pause between batches.
7. Gate each change with the SQL linter, the migration linter where the engine has one, and the
   invariant queries. Plan reading and data-model choices stay reviewed judgment.
8. Keep each read-then-write correct when two sessions run it at the same moment:
   - let a unique constraint, not an earlier SELECT, reject a duplicate, and use an insert-or-update that the engine documents as atomic under concurrency;
   - change a counter or balance in one statement relative to its stored value, not by reading it into code and writing it back, or else lock the rows read before writing them;
   - learn what the engine's default isolation level lets through, and trust no level by its name: the same name gives different guarantees in different engines;
   - at a stricter level, catch serialization failure (SQLSTATE 40001) and retry the whole transaction from the start;
   - keep each transaction to what integrity requires, and do not let one sit open and idle longer than necessary.

## Reflexes
- Can any part of this statement's text come from outside the code? If so, is it a bound value or a
  choice from a fixed list?
- What does this predicate return when the column, or the subquery, holds a NULL?
- Does this time range count the boundary instant in two adjacent periods?
- Is this feature in the standard, does our engine version support it, and with which default?
- Was this plan read on production-sized data, and do estimated rows match actual rows?
- Which lock does this migration take, for how long, and what happens to traffic while it waits?
- After this migration, can both the old and the new code run against the schema?
- Which invariant would a bug here break, and which zero-row query would catch it?
- If two sessions run this read-then-write at the same moment, what stops a duplicate row or a lost
  update?
- Who says this practice holds, how old is the source, and does the engine's own documentation
  agree?

## What is measured
- **SQL lint violations on changed files.** Zero passes. The `verify` step runs the linter set to
  the target dialect and reads its exit code, telling violations apart from a tool failure.
- **Lock hazards in added migrations.** Zero unexplained findings. The `verify` step runs the
  engine's migration linter on the files the change adds. For an engine with no such linter, lock
  review stays judgment.
- **Backfills on live tables.** Each runs in committed batches, outside the transaction that changes
  the schema. This is judgment checked in review, because a migration linter may not detect a
  dangerous backfill.
- **Invariant queries.** Each returns zero rows on a fresh database after all migrations. The
  `verify` step runs them all and fails on the first row.
- **Race safety of read-then-write paths.** Each such path names what stops a concurrent duplicate
  or lost update: a constraint, a single relative statement, a row lock, or a retried transaction.
  This is judgment checked in review, because invariant queries on a fresh database and tests that
  run one session at a time never exercise a race.
- **Dynamic SQL assembled by concatenation.** Counted as matches of a text scan over SQL files. It
  is a heuristic, so the `verify` step fails on new matches, and any exception carries a written
  reason.
- **Plan health of hot queries.** Gap between estimated and actual rows, and run time, on
  production-sized data. This is judgment recorded in review, not a gate, because plans read on
  small test data cannot be assumed to apply to large tables.
- **Schema-change discipline.** Releases where deployed code and schema were incompatible, and
  expansions never contracted. This is judgment, checked in review.

## Sources
- [SQL:2023 is finished: Here is what's new, Peter
  Eisentraut](https://peter.eisentraut.org/blog/2023/04/04/sql-2023-is-finished-here-is-whats-new),
  2026-11-01: SQL:2023 additions are optional; the default for NULL handling in unique constraints
  is implementation-defined.
- [OWASP SQL Injection Prevention Cheat
  Sheet](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html),
  2026-11-01: bound values, allow-lists for identifiers, dynamic SQL in procedures, no escaping,
  least privilege.
- [PostgreSQL wiki, Don't Do This](https://wiki.postgresql.org/wiki/Don%27t_Do_This), 2026-11-01:
  NOT EXISTS over NOT IN, half-open time ranges, zone-aware timestamps, no arbitrary lengths.
- [PostgreSQL 18, Using EXPLAIN](https://www.postgresql.org/docs/current/using-explain.html),
  2026-11-01: estimated vs actual rows, rolled-back analysis of writes, small tables mislead.
- [Use The Index, Luke: We need tool support for keyset
  pagination](https://use-the-index-luke.com/no-offset), 2026-11-01: paging by last key seen, and
  its limits.
- [Parallel Change, Danilo Sato](https://martinfowler.com/bliki/ParallelChange.html), 2026-11-01:
  expand, migrate, contract, and their costs.
- [Squawk documentation](https://squawkhq.com/docs/), 2026-11-01: lock hazards a migration linter
  checks: index builds, constraint validation, lock timeouts.
- [SQLFluff documentation](https://docs.sqlfluff.com/en/stable/), 2026-11-01: dialect-aware linting,
  with exit codes from [SQLFluff CLI
  use](https://docs.sqlfluff.com/en/stable/production/cli_use.html).
- [dbt, Add data tests to your DAG](https://docs.getdbt.com/docs/build/data-tests), 2026-11-01: an
  invariant as a query returning failing rows; zero rows passes.
- [PostgreSQL docs, Transaction
  Isolation](https://www.postgresql.org/docs/current/transaction-iso.html), 2026-11-01: Read
  Committed is the default; an update relative to the stored value applies to the latest row
  version; MERGE can still raise a uniqueness error on a concurrent insert; explicit row locks;
  retry the whole transaction on serialization failure, SQLSTATE 40001; keep transactions small and
  not idle.
- [PostgreSQL docs, INSERT](https://www.postgresql.org/docs/current/sql-insert.html), 2026-11-01:
  insert-or-update is atomic under concurrency, with a unique index or constraint as arbiter.
- [Hermitage, Martin Kleppmann](https://github.com/ept/hermitage), 2026-11-01: the same isolation
  level name gives different guarantees in different engines; lost update and write skew.
- [Strong Migrations, ankane](https://github.com/ankane/strong_migrations), 2026-11-01: a backfill
  inside the schema change's transaction keeps the table locked; batch, throttle, run outside a
  transaction; it does not detect dangerous backfills.
- [PostgreSQL docs, LIMIT and OFFSET](https://www.postgresql.org/docs/current/queries-limit.html),
  2026-11-01: without a unique ORDER BY, a limited query returns an unpredictable subset that can
  differ between pages.
- [Use The Index, Luke: Paging Through
  Results](https://use-the-index-luke.com/sql/partial-results/fetch-next-page), 2026-11-01: paging
  needs a deterministic sort; add a unique column; a seek on a non-unique key skips tied rows.
