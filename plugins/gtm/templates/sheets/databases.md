# Databases and schema migrations

> Helps a role change the schema and data of a live database without downtime, without data loss and
> without breaking the application version in service.

## When it applies
- Adding, renaming, retyping or dropping a table, column, index or constraint in a database that
  serves traffic.
- Backfilling or moving data across many rows as part of a release.
- Planning a release where the old and new application versions share one database.
- Choosing or reviewing how migrations are written, versioned, checked and applied.

## Method
1. Classify the change. It is additive (it can ship before the code that uses it), breaking (rename,
   type change, drop, new required column) or data only. A breaking change never ships in one step.
2. Split a breaking change into expand, migrate and contract over separate deploys. Add the new
   structure, write to both, backfill, move reads, stop using the old structure, then remove it.
   Give the contract step an owner and a date.
3. For each statement, check the engine's documentation for the version in production: which lock it
   takes, and whether it rewrites or scans the table. Prefer the engine's online forms: index builds
   that do not block writes, constraints added unvalidated and validated later, instant or in-place
   column changes.
4. Bound every migration with a short lock-wait timeout and a statement timeout. On a lock timeout,
   retry instead of waiting without limit.
5. Keep bulk data changes out of schema migrations. Run them as separate jobs, in throttled batches,
   outside the transaction that changes the schema.
6. Keep one append-only history: small numbered migrations in version control, applied by a tool
   that records what ran and checks checksums. Fix a mistake with a new migration, never by editing
   one that was already applied.
7. Rehearse significant changes on scrubbed, production-sized data, and record the duration and the
   longest lock wait. When the engine can only copy the table, use an online copy process that
   throttles, supports a dry run and leaves the cut-over to an operator.
8. Before merge, review significant changes with the people who run the database. Apply them through
   the same automated pipeline in every environment.
9. Before any step that destroys data, such as a drop, an in-place overwrite or a bulk delete, name
   the restore path and how long a restore takes. That is either a backup or point-in-time recovery
   window that covers the change and whose restore was tested end to end, or the old data kept
   unreachable but intact for a set period before it is purged. A replica is not a restore path: it
   copies the damage.
10. Where replicas serve reads or stand by for failover, treat their lag as a limit. Throttle
    backfills and online copies on the lag measured on the replicas that carry the changed table,
    and record peak lag when rehearsing. On some engines, a replica may start a schema change only
    once the primary has finished it, holding back the writes made meanwhile, so a long-running
    change that is online on the primary can still cause replica lag.

## Reflexes
- Can the application version now in production run on the schema after this migration?
- Which lock does each statement take, and for how long?
- Does this statement rewrite or fully scan a large table?
- Is bulk data movement mixed into the schema change?
- If it fails halfway, what state is the database in, and do we roll forward or back?
- Who owns the contract step, and by when?
- Has this run on production-sized data?

## What is measured
- Migration lint. New migrations contain no index build that blocks writes, no constraint validated
  in the same step and no breaking change without a reviewed override; each one sets a lock-wait
  timeout. Verify step: a lint command over the migration files added since the main branch, failing
  the build.
- Backward compatibility. The previous release's tests pass on the schema the branch produces.
  Verify step: migrate an empty test database with the branch, then run the previous release's tests
  without reloading the schema.
- History integrity. No merged migration is modified, deleted, renamed or reordered, and the
  migration tool's checksum validation passes after apply. Verify step: a version-control diff
  against the main branch, then the tool's validate command.
- Backfill completeness. Before reads move, and again before the contract step, no row is left to
  copy and no value differs between the old and new structures, in every environment. Verify step: a
  query counting rows missing or different in the new structure must return zero in each environment
  before the release that depends on the backfill ships; waiting a release proves nothing. Comparing
  live reads from both structures before the switch stays judgment.
- Rehearsal. Duration and longest lock wait on production-sized data. This becomes a verify step
  once the team sets thresholds; until then it stays judgment.
- Delivery. Share of database changes applied by the automated pipeline (target 100%), share of
  failed changes where the database contributed, and database work's share of lead time. Tracked per
  release, not a gate.

## Sources
- [Parallel Change](https://martinfowler.com/bliki/ParallelChange.html), 2026-11-01: expand,
  migrate, contract; the cost of never contracting.
- [Evolutionary Database Design](https://martinfowler.com/articles/evodb.html), 2026-11-01:
  versioned migrations, database CI, transition periods, DBA review.
- [DORA, Database change management](https://dora.dev/capabilities/database-change-management/),
  2026-11-01: automation, production-like tests, delivery measures.
- [PostgreSQL 18, ALTER TABLE](https://www.postgresql.org/docs/current/sql-altertable.html),
  2026-11-01: lock levels, rewrites, scans, unvalidated constraints.
- [MySQL 8.4, Online DDL
  Operations](https://dev.mysql.com/doc/refman/8.4/en/innodb-online-ddl-operations.html),
  2026-11-01: instant, in-place and copy operations and their limits.
- [GitLab, Avoiding downtime in
  migrations](https://docs.gitlab.com/development/database/avoiding_downtime_in_migrations/),
  2026-11-01: multi-release drops and renames, lock retries, batched background work.
- [strong_migrations](https://github.com/ankane/strong_migrations), 2026-11-01: unsafe operations,
  safe alternatives, timeouts, backfills.
- [Squawk, Rules](https://squawkhq.com/docs/rules), 2026-11-01: catalogue of lint rules, timeouts
  included.
- [Atlas, Declarative vs versioned](https://atlasgo.io/concepts/declarative-vs-versioned),
  2026-11-01: workflow trade-offs, linear history, lint in CI.
- [Flyway, Validate](https://documentation.red-gate.com/fd/validate-277578898.html), 2026-11-01:
  checksum, name and type validation of applied migrations.
- [pgroll](https://github.com/xataio/pgroll), 2026-11-01: automated expand and contract with
  versioned views and rollback.
- [gh-ost](https://github.com/github/gh-ost), 2026-11-01: triggerless online table copy, throttling,
  operator-controlled cut-over.
- [Stripe, Online migrations at scale](https://stripe.com/blog/online-migrations), 2026-11-01:
  recount for missing records after the backfill, compare reads from both stores before switching,
  remove old data only once nothing relies on it.
- [GitLab, Batched background
  migrations](https://docs.gitlab.com/development/database/batched_background_migrations/),
  2026-11-01: no dependence on backfilled data until the migration is finalized; a later release
  does not guarantee completion.
- [Google SRE book, Data Integrity](https://sre.google/sre-book/data-integrity/), 2026-11-01: soft
  deletion as a defense against developer error, restores over backups, end-to-end recovery tests,
  replication is not recoverability.
- [MySQL 8.4, Online DDL
  Limitations](https://dev.mysql.com/doc/refman/8.4/en/innodb-online-ddl-limitations.html),
  2026-11-01: replicas run a schema change only after the source finishes it and apply concurrent
  writes only afterwards, so long-running ones can cause lag.
- [gh-ost, Throttle](https://github.com/github/gh-ost/blob/master/doc/throttle.md), 2026-11-01:
  replica lag as a throttle signal, measured on replicas in the migrated table's replication chain.
