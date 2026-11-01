# Quality

> Helps a role decide what to measure in existing code and what to refactor first.

## When it applies
- A task that plans a refactor, or asks where technical debt costs the most.
- A task that adds or tunes a quality gate: complexity, duplication, change risk, test quality.
- A task that needs to know whether tests protect code about to be moved.

## Method
1. Mine change history over a bounded window, one year by default, and keep the files above the knee
   of the change-frequency distribution.
2. Cross those files with function complexity to get a candidate list.
3. Read each candidate with the people who work there: file role, architectural centrality, test or
   production code, ongoing work, temporary activity spike. Compare the score with the burden they
   report.
4. Check change coupling: files that move together are read together.
5. Before a refactor, secure the code: add tests first, then refactor, then run mutation on what
   moved.
6. Keep new debt out with gates on changed code only, and leave existing debt to the prioritised
   list.

## Reflexes
- Does this file change often, or did it spike once?
- Is this a score, or a burden someone actually reports?
- Would this number end up rating people? Then it stays out of reports.
- Is complexity above 30? Tests cannot clear it: only splitting does.
- What did the diff-only run miss: a test-only change, a dependency change?
- Does this surviving mutant point at a missing test, or at noise?

## What is measured
- Change frequency per file: `git log --numstat` over a bounded window, analysed with Code Maat
  (`revisions`, `entity-churn`, `coupling`). A report step, never a blocking `verify` step.
- Cyclomatic complexity per function: lizard for TypeScript, JavaScript, Python, Go and Rust. As a
  `verify` step: `lizard -C LIMIT` on changed files, with a limit taken from the repository's own
  distribution.
- Cognitive complexity: a reading signal, with partial validation. It stays judgment and is not a
  gate.
- CRAP score, language-neutral: `CRAP(m) = comp(m)^2 * (1 - cov(m)/100)^3 + comp(m)`, where `comp`
  is cyclomatic complexity, at least 1, and `cov` is the percentage of the function covered by
  automated tests. An optional `verify` step: for each function touched by the diff, compute the
  score and exit non-zero above a limit, 30 by default. It needs per-function coverage. cargo-crap
  computes it for Rust; elsewhere join lizard with the project's coverage report. Up to complexity 5
  the score never exceeds 30; between 6 and 30 either test or split; above 30 only splitting works.
- Mutation on changed code: StrykerJS `--incremental` for TypeScript and JavaScript, mutmut for
  Python (it re-tests changed functions, fork required), Gremlins on pull request changes
  for Go (0.x, small modules), `cargo mutants --in-diff` for Rust. A report step first, with
  survivors shown in review and capped, and a periodic full run. No source here justifies a score
  target.
- Duplication: jscpd with `--threshold` set at the repository's current level and lowered as it
  falls; confirm Python, Go and Rust support and the exit code first. As a `verify` step, it holds
  the line.
- Code smells: they feed a health score, but which ones matter stays judgment.
- What to refactor first stays judgment: scores structure the discussion and never rank alone.

## Sources
- [Technical Debt Friction for Maintenance Prioritization](https://arxiv.org/html/2607.01850),
  2026-11-01: hotspot detection, code health, friction, and its limits as a standalone signal.
- [Code Red](https://arxiv.org/abs/2203.04374), 2026-11-01: defect and lead-time gaps between low
  and high quality code.
- [An Empirical Validation of Cognitive Complexity](https://arxiv.org/abs/2007.12520), 2026-11-01:
  what cognitive complexity correlates with.
- [Savoia, C.R.A.P. index](https://www.artima.com/weblogs/viewpost.jsp?thread=210575), 2026-11-01:
  CRAP formula, limit cases, intended use.
- [cargo-crap score](https://docs.rs/crate/cargo-crap/latest/source/src/score.rs), 2026-11-01:
  default limit of 30, saturation above complexity 30.
- [Practical Mutation Testing at Scale](https://arxiv.org/abs/2102.11378), 2026-11-01: diff-scoped
  mutation surfaced in code review, with per-line and per-review limits.
- [StrykerJS incremental](https://stryker-mutator.io/docs/stryker-js/incremental/), 2026-11-01:
  incremental mode and what it does not detect.
- [mutmut](https://github.com/boxed/mutmut), 2026-11-01: requirements and changed-function
  re-testing.
- [Gremlins](https://gremlins.dev/latest/), 2026-11-01: pull request mode, 0.x status, module size
  limit.
- [cargo-mutants in-diff](https://mutants.rs/in-diff.html), 2026-11-01: diff filter and why a full
  run stays necessary.
- [lizard](https://github.com/terryyin/lizard), 2026-11-01: languages, per-function metrics,
  threshold and exit behaviour.
- [jscpd](https://github.com/kucherenko/jscpd), 2026-11-01: detection method, threshold option,
  GitHub Action.
- [Code Maat](https://github.com/adamtornhill/code-maat), 2026-11-01: version control analyses and
  the log command they consume.
