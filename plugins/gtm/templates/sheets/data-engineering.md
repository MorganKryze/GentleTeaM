# Data engineering and pipelines

> Helps a role build, change or review a data pipeline so that reruns are safe, bad data stops
> before readers see it, and lateness or loss is caught against agreed objectives.

## When it applies
- Building or changing a job that ingests, cleans, transforms or publishes data, in batch or
  streaming.
- Backfilling or reprocessing past periods, or recovering after a failure or a corruption.
- Publishing a dataset that another team, a report, an application or a model reads.
- Changing a column, a type, a grain or a meaning that downstream readers rely on.
- Investigating data that is late, missing, duplicated or wrong.

## Method
1. Name the readers of each output and agree with them on freshness, completeness and correctness
   objectives, measured on the final output, end to end.
2. Make every task rerunnable: it takes its partition or interval as a parameter, never reads the
   wall clock or "the latest" data, and replaces or merges its output partition instead of appending
   to it.
3. Write each run to an isolated staging location, audit it, and publish in one atomic step only
   when every audit passes; when one fails, keep serving the last good version and alert, since a
   delay usually costs less than a wrong number.
4. Write each audit as a query that counts failing rows: duplicate keys, missing required fields,
   invalid or mistyped values, row count out of bounds, reference records that no longer match their
   known values.
5. Where data crosses from one team to another, keep a versioned contract next to the producer's
   code (schema and types, quality rules with thresholds, service levels, owner, support channel)
   and check every change against it before merge.
6. Test complex transformation logic on small fixed inputs with expected outputs, in development and
   continuous integration; leave checks on real data to the audit step.
7. Emit a lineage event for each run (job, run, input and output datasets, with schema facets, and
   quality facets on inputs) so the reach of a bad input can be traced.
8. Link every alert to a playbook entry: stop the bad input, roll back, reprocess only the affected
   partitions.
9. Decide which time puts a record in a partition: event time, or arrival time where sources buffer
   records or their clocks drift. Measure how late records come and reprocess the recent partitions
   they touch. In streaming, set an explicit allowed lateness, apply late results as updates, and
   send records beyond that lateness to a counted output instead of letting the window drop them.
10. Before readers switch to changed logic, run it on the same real input as the live version
    without writing anywhere readers look. Compare the two outputs until every difference is
    explained as intended, then roll the change out over a growing share of the data.

## Reflexes
- What does a reader see while this run is half done, and after it fails?
- Which check stops a wrong type or a renamed column from upstream before publication?
- Who learns that this dataset is late, how fast, and against which agreed threshold?
- Would a check on each stage miss a field lost at a hand-off that only an end-to-end check sees?

## What is measured
- Rerun stability: the same partition run twice yields the same row count, distinct-key count and
  column sums; a `verify` step in continuous integration.
- Audit result: every audit query counts zero failing rows; a `verify` step that gates publication
  on each run. The row-count bounds stay judgment.
- Freshness: age of the newest loaded record against the agreed objective; a scheduled `verify`
  step. The threshold is a judgment made with readers.
- Completeness: share of the records the source reports sending for a period that reached the
  output; a scheduled `verify` step that compares the two counts. The accepted gap stays judgment.
- Late records: share of records that land after their partition was published, per source; a
  scheduled `verify` step. The accepted share stays judgment, agreed with readers.
- Contract conformity: every promised column exists with its declared type; a `verify` step before
  merge and before publication. Whether a change breaks a given reader stays judgment.
- Change diff: rows and values that differ between the changed and the live version on the same
  input; a `verify` step before rollout. Whether each difference is intended stays judgment.

## Sources
- [Google SRE Workbook: Data Processing Pipelines](https://sre.google/workbook/data-processing/),
  2026-11-01: end-to-end freshness and correctness, two-phase mutations, reruns, playbooks.
- [Open Data Contract Standard](https://bitol-io.github.io/open-data-contract-standard/latest/home),
  2026-11-01: what a data contract holds.
- [ODCS: Data quality](https://bitol-io.github.io/open-data-contract-standard/latest/data-quality/),
  2026-11-01: portable quality metrics and thresholds.
- [ODCS: Service-level
  agreement](https://bitol-io.github.io/open-data-contract-standard/latest/service-level-agreement/),
  2026-11-01: service levels, time to detect and repair.
- [Foidl et al., Data Pipeline Quality](https://arxiv.org/abs/2309.07067), 2026-11-01: wrong types
  as leading root cause, cleaning, compatibility.
- [OpenLineage: Object model](https://openlineage.io/docs/spec/object-model), 2026-11-01: job, run
  and dataset events with quality facets.
- [Apache Airflow: Best
  Practices](https://airflow.apache.org/docs/apache-airflow/stable/best-practices.html), 2026-11-01:
  tasks as transactions, explicit partitions, no wall clock.
- [dbt: Unit tests](https://docs.getdbt.com/docs/build/unit-tests), 2026-11-01: logic tests on fixed
  inputs versus data tests on real data.
- [Apache Iceberg: Branching and Tagging](https://iceberg.apache.org/docs/latest/branching/),
  2026-11-01: audit branch, validation, then fast-forward of main.
- [dbt Labs: State of Analytics Engineering
  2025](https://www.getdbt.com/blog/state-of-analytics-engineering-2025-summary), 2026-11-01: data
  quality still a leading problem.
- [Akidau: The world beyond batch, Streaming
  101](https://www.oreilly.com/radar/the-world-beyond-batch-streaming-101/), 2026-11-01: event time
  versus processing time, many sources can never show a period is complete, reprocessing a window
  when late data arrives.
- [Apache Flink:
  Windows](https://nightlies.apache.org/flink/flink-docs-stable/docs/dev/datastream/operators/windows/),
  2026-11-01: allowed lateness is zero by default, so late records are dropped unless sent to a
  separate output, and late firings update earlier results.
- [Google SRE Workbook: Data Processing Pipelines, development lifecycle and Spotify
  case](https://sre.google/workbook/data-processing/), 2026-11-01: canary output compared with the
  live pipeline, gradual rollout, completeness from published versus delivered counts, receipt-time
  buckets, share of misplaced late events.
