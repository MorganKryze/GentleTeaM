# Performance

> Helps an engineer or a reviewer measure, budget and protect a system's latency, throughput and
> resource use, from one change to production.

## When it applies
- A change to a hot path, query, data structure, cache, concurrency setting or dependency that may
  move latency, throughput, memory or CPU use.
- Setting or revising a performance budget, a latency objective or a capacity target.
- Investigating a slowdown, a timeout, a saturated resource or a regression flagged by a benchmark.
- Adding or changing a benchmark, a load test or the performance stage of a pipeline.
- A user-facing product whose perceived loading, responsiveness or visual stability is in question.

## Method
1. Name the budget before measuring: metric, workload, percentile, threshold and owner.
2. Record distributions, not means: full latency histograms with roughly exponential buckets; report
   median, 99th percentile and maximum; keep failed requests in their own series.
3. Drive load at a fixed intended rate and time each request from its scheduled start, so stalls are
   counted instead of skipped.
4. Compare in pairs: baseline and candidate on the same host, together or alternating, many times;
   decide on a confidence interval of their ratio, never on one run or on absolute numbers from a
   shared machine.
5. Keep two tiers: fast microbenchmarks on every change for early detection; system benchmarks and
   real-usage data on a schedule as the final judge.
6. Watch the main line: run change-point detection over each benchmark's history; a named person
   confirms each change point with reruns, isolates the culprit commit and records the outcome: fix,
   revert, or accepted trade-off with its reason.
7. Diagnose before optimising: list the resources, check errors, saturation and utilisation for
   each, read the service's latency, traffic, errors and saturation, then profile the hot path and
   link profiles to traces where possible.
8. Confirm a fix with the same paired measurement; treat an improvement that looks too good as a
   possibly broken benchmark until checked.
9. Find the breaking point: step the offered rate up past the target until the objective or the
   failure threshold breaks, and record the last rate that held as capacity; push beyond it, both
   ramped and sudden, and check that successful throughput holds while the excess is rejected or
   served degraded, and that the system recovers unaided once load falls back.

## Reflexes
- Is this a mean where a percentile or a whole distribution is needed?
- Would this load generator have stopped sending while the system stalled?
- Did baseline and candidate share one machine and its noise, and how many runs back the claim?
- Is the change larger than run-to-run noise, and larger than the smallest effect worth acting on?
- Lasting shift or spike: do enough later data points confirm it?
- Which resource saturates first, and is anything failing quietly or failing slowly?
- Does the lab agree with what real users see at a high percentile, per device class?
- Does the run hold enough samples for the percentile it reports?
- What limited the benchmark while it ran, as seen with other tools at the time: the code under
  test, or the load generator, the network or the harness itself?

## What is measured
- Candidate-to-baseline ratio from repeated paired runs on one host: a `verify` step fails when the
  lower bound of its confidence interval exceeds one plus the budget.
- Latency percentiles (median, 99th, 99.9th, maximum) at a fixed offered rate, timed from intended
  start, successes and failures apart: a `verify` step fails when the 99th percentile of successes
  exceeds the objective at the target rate.
- Failure rate at the target rate, counting explicit errors, timeouts and success responses with
  wrong content, and the latency of those failures: a `verify` step fails when the rate exceeds its
  threshold, so a change cannot pass the latency gate by failing fast, failing slowly or answering
  wrongly; reading failure latency stays judgment.
- Capacity, the highest offered rate that holds both the latency objective and the failure
  threshold: a scheduled `verify` step fails when it falls below the target rate plus the chosen
  safety margin; behaviour beyond it and recovery stay judgment.
- Change points in each benchmark's main-line history: a scheduled `verify` step fails while an
  untriaged unfavourable change point remains; fixing, reverting or accepting it stays judgment.
- User-perceived metrics at the 75th percentile of real usage, per device class: a scheduled
  `verify` step on field data, not a merge gate; lab proxies only warn early.
- Utilisation, saturation and errors per resource: a diagnostic checklist, not a gate; reading it
  stays judgment.
- Profiles of the hot path: evidence for a diagnosis, not a gate; interpreting them stays judgment.

## Sources
- [The USE Method](https://www.brendangregg.com/usemethod.html), 2026-11-01: per-resource
  utilisation, saturation and errors checklist, and its limits.
- [Monitoring Distributed Systems](https://sre.google/sre-book/monitoring-distributed-systems/),
  2026-11-01: four service signals, percentiles over means, exponential buckets, failed requests
  apart.
- [wrk2, README](https://github.com/giltene/wrk2), 2026-11-01: coordinated omission; constant rate
  and timing from the intended send time.
- [Duet Benchmarking: Improving Measurement Accuracy in the
  Cloud](https://arxiv.org/abs/2001.05811), 2026-11-01: parallel runs evaluated together for
  relative comparison on shared machines.
- [The Early Microbenchmark Catches the Bug](https://arxiv.org/abs/2311.04108), 2026-11-01:
  microbenchmarks caught injected issues earlier than an application benchmark.
- [Change Point Detection in Software Performance Testing](https://arxiv.org/abs/2003.00584),
  2026-11-01: change points over history with human triage instead of threshold-based detection.
- [Hunter: Using Change Point Detection to Hunt for Performance
  Regressions](https://arxiv.org/abs/2301.03034), 2026-11-01: deterministic significance test;
  nearby change points.
- [Apache Otava](https://otava.apache.org/), 2026-11-01: lasting shifts rather than spikes; branch
  compared with the main line.
- [Performance
  Sheriffing](https://firefox-source-docs.mozilla.org/testing/perfdocs/perf-sheriffing.html),
  2026-11-01: confirmation by later points, culprit isolation, recorded outcomes, suspicious large
  improvements.
- [OpenTelemetry Profiles Enters Public Alpha](https://opentelemetry.io/blog/2026/profiles-alpha/),
  2026-11-01: profiles linked to traces; still alpha.
- [Web Vitals](https://web.dev/articles/vitals), 2026-11-01: perceived metrics at the 75th
  percentile of field data per device class; lab as early warning.
- [Addressing Cascading Failures](https://sre.google/sre-book/addressing-cascading-failures/),
  2026-11-01: load testing up to and past the breaking point; successful rate held while excess load
  is rejected or degraded; ramped and sudden load; recovery without human help; breaking point used
  for capacity planning, regression checks and safety margins.
- [Thresholds, k6 documentation](https://grafana.com/docs/k6/latest/using-k6/thresholds/),
  2026-11-01: pass or fail criteria that pair an error-rate limit with a latency percentile limit.
- [Active Benchmarking](https://www.brendangregg.com/activebenchmarking.html), 2026-11-01: analysing
  a benchmark with other tools while it runs, to confirm what it measures and find its true limiter,
  the benchmark itself included; statistics useful after that check.
