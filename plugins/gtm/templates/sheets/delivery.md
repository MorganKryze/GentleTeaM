# Continuous delivery and release engineering

> Helps a role keep every change releasable, ship it in small, verified, reversible steps, and
> measure whether delivery improves.

## When it applies
- Designing or changing a build, release or deployment pipeline.
- Choosing how a change reaches users: release train, feature flag, canary, deployment experiment.
- Deciding whether an artifact may be deployed: provenance, integrity, reproducibility.
- Setting up or reading delivery metrics for an application or service.
- Shipping a corrective release under a deadline, including legal vulnerability reporting.

## Method
1. Keep the mainline releasable: small batches merged at least daily, very few active branches,
   automated tests before merge, no code freeze.
2. Hide unfinished work behind a release flag, not a long-lived branch; record its category, owner
   and expiry; test both states; plan its removal when adding it.
3. Build each artifact once, on a hosted platform that generates and signs provenance; keep the
   relevant attributes of the build environment few, so independent rebuilds can match by hash.
4. Before deploying, check the provenance signature against trusted roots, the subject digest
   against the artifact, then the expected source, build type and external parameters, rejecting
   unknown fields in the external parameters.
5. Expose in stages: a representative canary judged per population against a control, on a few
   user-facing indicators and against the service objective; one canary at a time, at least one
   metric interval long; pause and roll back, or escalate, on divergence. For software installed on
   users' devices, run deployment experiments.
6. Treat flag and configuration flips as changes: roll them out gradually.
7. Ship on a fixed cadence: a late change takes the next release; only very seldom is a release held
   for a feature.
8. Record every production deployment and derive the five delivery metrics per service; read trends,
   never set targets.
9. Keep a corrective-release path and, where the law requires it, a reporting chain with named
   owners and timed drills.
10. Where the law requires it, have the pipeline produce a machine-readable software bill of
    materials with every release, listing at least the top-level dependencies, and keep it with the
    artifact; keep the corrective path able to ship a security fix apart from functionality changes,
    where technically feasible, throughout the support period (at least five years unless expected
    use is shorter), for the latest release and for any older one whose users cannot move to it at
    no cost.
11. Change stored data and shared interfaces in expand, migrate and contract steps, each releasable
    alone: leave existing structures in place while old and new versions run, so canary and control
    can share the same data and the application can roll back while the schema stays migrated;
    rehearse each migration on production-like data with sensitive fields removed, and contract only
    once nothing uses the old form, never skipping it.
12. Approve changes by peer review in the delivery platform, recorded with the change and backed by
    the automated checks; give flagged high-risk changes extra scrutiny, keep any change board for
    coordination rather than as a gate on each deployment, and answer instability with smaller,
    safer changes, not more approvals.

## Reflexes
- Could this change be merged and deployed today, hidden if unfinished?
- If it goes wrong, what turns it off: a rollback, a flag, or nothing?
- Could the previous version still run against the data and interfaces this change leaves behind?
- Is what we deploy provably what was built from the reviewed source?
- Is the canary signal attributable to the canary population, over a long enough window?
- Which flags are past their expiry, and who owns them?
- Is a delivery metric turning into a target or a ranking between teams?

## What is measured
- The five delivery metrics (deployment frequency, change lead time, failed deployment recovery
  time, change fail rate, deployment rework rate), per service over time: a `verify` step checks
  that each production deployment is recorded with service, revision, time, outcome and whether it
  was planned; reading the trends stays judgment.
- Branch age: `verify` fails when a branch proposed for merge is older than the agreed limit,
  starting at one day.
- Release flags: `verify` fails on any release flag past its expiry, or when the flag count exceeds
  the agreed cap.
- Artifact integrity: `verify` blocks deployment unless the provenance is signed by a trusted
  builder, its subject matches the artifact digest, and source and parameters match expectations.
- Reproducibility: `verify` compares the hashes of two independent builds; explaining a difference
  stays judgment.
- Canary verdict: `verify` fails the stage when the canary's error rate exceeds the control's by
  more than the tolerance, or breaches the objective; choosing indicators and thresholds stays
  judgment.
- Reporting readiness: time from awareness to early warning, notification and corrective release,
  measured in drills; deciding that a vulnerability is actively exploited stays judgment.
- Bill of materials: `verify` fails a release whose artifact has no machine-readable bill of
  materials produced by the same build, or one that omits a direct dependency the build declares;
  deciding whether a disclosed component vulnerability affects the product stays judgment.
- Data and interface compatibility: `verify` runs each migration on production-like data with
  sensitive fields removed, then the previous release's tests against the migrated state, and fails
  when an existing structure is changed or dropped outside a contract step; deciding that nothing
  still uses the old form stays judgment.
- Change approval: `verify` blocks deploying a revision with no peer approval recorded in the
  platform by someone other than its author; deciding which changes are high-risk stays judgment.

## Sources
- [DORA software delivery metrics](https://dora.dev/guides/dora-metrics/), 2026-11-01: the five
  metrics, their groups, and why they are not targets.
- [DORA history of the metrics](https://dora.dev/guides/dora-metrics/history/), 2026-11-01: the 2023
  and 2024 changes to the metrics.
- [DORA trunk-based development](https://dora.dev/capabilities/trunk-based-development/),
  2026-11-01: branch count, daily merges, no freezes, review pitfalls.
- [SLSA 1.2 Build track basics](https://slsa.dev/spec/v1.2/build-track-basics), 2026-11-01: build
  levels and the threats they address.
- [SLSA 1.2 Verifying artifacts](https://slsa.dev/spec/v1.2/verifying-artifacts), 2026-11-01:
  verification steps and expectations.
- [Reproducible Builds definition](https://reproducible-builds.org/docs/definition/), 2026-11-01:
  identical outputs from identical inputs, checked by hash.
- [Google SRE Workbook, Canarying Releases](https://sre.google/workbook/canarying-releases/),
  2026-11-01: canary against control, metrics, duration, pitfalls.
- [Software Engineering at Google, Continuous
  Delivery](https://abseil.io/resources/swe-book/html/ch24.html), 2026-11-01: small batches, release
  trains, gradual flag flips, client experiments.
- [Feature Toggles, Pete Hodgson](https://martinfowler.com/articles/feature-toggles.html),
  2026-11-01: flag categories, expiry, testing both states.
- [OpenFeature specification](https://openfeature.dev/specification/), 2026-11-01: an open flag
  evaluation specification and its stability statuses.
- [EU CRA reporting](https://digital-strategy.ec.europa.eu/en/policies/cra-reporting), 2026-11-01:
  reporting deadlines and start date.
- [EU CRA summary](https://digital-strategy.ec.europa.eu/en/policies/cra-summary), 2026-11-01:
  application dates and support period.
- [DORA database change management](https://dora.dev/capabilities/database-change-management/),
  2026-11-01: parallel change that leaves existing objects intact, application rollback with the
  database left migrated, migrations tested on sanitized production-like data.
- [Parallel Change, Danilo Sato](https://martinfowler.com/bliki/ParallelChange.html), 2026-11-01:
  expand, migrate and contract phases, each releasable, and canaries as old and new versions running
  side by side.
- [DORA streamlining change approval](https://dora.dev/capabilities/streamlining-change-approval/),
  2026-11-01: peer review recorded in the platform, extra scrutiny for high-risk changes, no
  evidence that external approval lowers change fail rates.
- [OpenSSF, SBOMs in the era of the
  CRA](https://openssf.org/blog/2025/10/22/sboms-in-the-era-of-the-cra-toward-a-unified-and-actionable-framework/),
  2026-11-01: the legal bill-of-materials duty, its minimum scope and format, generated in the
  pipeline and kept current.
- [EU CRA implementation FAQ](https://ec.europa.eu/newsroom/dae/redirection/document/123307),
  2026-11-01: security updates apart from functionality updates, the five-year minimum support
  period, which versions must be remediated.
