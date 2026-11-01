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
7. Ship each refactor as its own change, apart from features and bug fixes; only small local
   cleanups ride along with those, and a bug found while moving code gets its own change. Build the
   refactor from small behaviour-preserving steps, none leaving the system broken for more than
   minutes.

## Reflexes
- Does this file change often, or did it spike once?
- Is this a score, or a burden someone actually reports?
- Would this number end up rating people? Then it stays out of reports.
- Is complexity above 30? Tests cannot clear it: only lowering complexity does.
- What did the diff-only run miss: a test-only change, a dependency change?
- Does this surviving mutant point at a missing test, or at noise?
- Would these tests pass unchanged through the refactor? Killed mutants show tests catch behaviour
  change, not that they survive a change of structure: a test bound to internal calls tends to break
  on a correct move, so first cover the code through an interface the refactor keeps.

## What is measured
- Change frequency per file: `git log --numstat` over a bounded window, analysed with Code Maat
  (`revisions`, `entity-churn`, `coupling`). A report step, never a blocking `verify` step.
- Cyclomatic complexity per function: lizard for TypeScript, JavaScript, Python, Go and Rust. As a
  `verify` step: `lizard -C LIMIT` on changed files, with a limit taken from the repository's own
  distribution.
- Existing offenders under that gate: before `lizard -C LIMIT` goes live, list the functions already
  above the limit in lizard's whitelist file, `whitelizard.txt`, as `path:function` entries whose
  path matches the relative path lizard scans, so a change touching a hotspot fails only on new
  offenders. Listed functions are ignored, growth included, so the whitelist is read with the
  prioritised list and shrinks as it is worked. It is part of the lizard `verify` step.
- Cognitive complexity: a reading signal, with partial validation. It stays judgment and is not a
  gate.
- CRAP score: `CRAP(m) = comp(m)^2 * (1 - cov(m)/100)^3 + comp(m)`, where `comp`
  is cyclomatic complexity, at least 1, and `cov` is the percentage of the function covered by
  automated tests. An optional `verify` step: for each function touched by the diff, compute the
  score and exit non-zero above a limit, 30 by default. It needs per-function coverage. cargo-crap
  computes it for Rust; elsewhere join lizard with the project's coverage report. Up to complexity 5
  the score never exceeds 30; between 6 and 30 either test or split; above 30 only lowering complexity works.
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
- [Code Red](https://arxiv.org/abs/2203.04374), 2026-11-01: defect and development-time gaps between
  low
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
- [Google Engineering Practices, Small
  CLs](https://google.github.io/eng-practices/review/developer/small-cls.html),
  2026-11-01: refactorings kept apart from features and bug fixes, small cleanups excepted.
- [Fowler, Refactoring Malapropism](https://martinfowler.com/bliki/RefactoringMalapropism.html),
  2026-11-01: refactoring as small behaviour-preserving steps, a system that should not be broken
  for more than a few minutes at a time.
- [Beck, Test Desiderata](https://testdesiderata.com/), 2026-11-01: behavioural and
  structure-insensitive tests as distinct properties.
- [Fowler, Mocks Aren't Stubs](https://martinfowler.com/articles/mocksArentStubs.html), 2026-11-01:
  tests coupled to implementation break more often under refactoring.
- [lizard warning
  controls](https://github.com/terryyin/lizard/blob/master/docs/extensions-and-warnings.rst),
  2026-11-01: whitelist file, path-scoped entries, listed functions ignored.
