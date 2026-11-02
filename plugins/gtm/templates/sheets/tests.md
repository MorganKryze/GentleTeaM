# Tests

> Helps a role decide what to test, write tests that fail only for useful reasons, and judge whether
> a suite really detects faults.

## When it applies
- A task adds or changes behavior and needs tests to prove it.
- A task adds, repairs, or reviews tests, or deals with a test that fails intermittently.
- A task sets or changes a coverage, mutation, or test gate.
- A task changes a Markdown file that a script parses or whose code examples readers run.

## Method
1. Name the behavior before the code: given, when, then, with one behavior per test and a name
   stating the action and the outcome.
2. Go through the public interface, as a real caller does. Prefer real collaborators when they are
   fast and deterministic.
3. Assert on the resulting state rather than on calls made to collaborators. Keep tests free of
   logic, and accept duplication when it makes a test clearer.
4. Prove the test can fail: break the behavior on purpose, in a copy or a fixture, and watch it
   fail.
5. On changed code, use coverage to find what no test reaches, then use mutants on changed and
   covered lines to find what is reached but not asserted. Filter out logging, tracing, and deadline
   code, and read survivors in review.
6. For Markdown, test the structure a reader or a script relies on, not the wording. Run code
   examples as ordinary tests instead of comparing their text output.
7. For complex logic with a wide input space, consider properties and generators, and check that
   they exercise the cases that matter.
8. For a flaky test, look first at asynchronous waits, shared order, network, randomness, and time.
   Fix the cause: a retry helps diagnose, it does not repair.
9. Test the failure paths, not only the success path: drive each error that a dependency or a
   caller can signal into its handler, and check that coverage shows every handler on changed lines
   ran. Start with handlers that ignore the error, only log it, carry a TODO comment, or stop the
   whole system after catching a broad error type.
10. When a real collaborator is too slow or not deterministic, prefer a fake to stubs or call
    checks, ideally one kept by the owners of the real code. Keep it faithful with contract tests
    that run the same cases against the fake and the real implementation, and back tests that use
    doubles with a larger test on the real dependency.

## Reflexes
- Would a refactor with no behavior change break this test?
- Does this test depend on order, the clock, the network, or an unbounded wait?
- When someone says unit or integration, what do they mean here?
- Does this new test catch a fault that no existing test catches?

## What is measured
- Ability to fail: each contract test has a deliberately broken input that it rejects. As a `verify`
  step, run the suite, including these cases.
- Test integrity: changes to existing tests, such as a deleted or skipped test, a loosened
  assertion, or a rewritten expected value or snapshot. As a `verify` step, list them from the diff
  for review against the behavior change the task asks for. Making existing tests read-only during
  implementation blocks such edits, but not code that special-cases test inputs or makes equality
  always succeed: that stays judgment.
- Fault detection: mutants surviving on changed lines. As a `verify` step, run a mutation tool
  limited to the diff and report survivors for review, without blocking. Whether a survivor matters
  stays judgment.
- Coverage floor: a low threshold on lines and branches. As a `verify` step, fail below the floor.
  No source gives a value, and coverage should not be used as a quality target.
- Stability: repeated runs, in random order where the runner allows it, each test with a time limit.
  As a `verify` step, run periodically and fail on any divergence. Passing runs do not prove absence
  of flakiness.
- Judgment only: the split between kinds of tests, a test's relevance, and whether a generated test
  is worth keeping.

## Sources
- [Node.js test runner documentation](https://nodejs.org/api/test.html), 2026-11-01: runner
  stability, snapshots, coverage, mock timers, rerun constraints.
- [Node.js CLI documentation](https://nodejs.org/api/cli.html), 2026-11-01: test flags, versions,
  and the default test timeout.
- [Practical Mutation Testing at Scale](https://ar5iv.labs.arxiv.org/html/2102.11378), 2026-11-01:
  diff-based mutants, filtering, limits, coverage as a prerequisite.
- [Review of Coverage Is Not Strongly Correlated with Test Suite
  Effectiveness](https://neverworkintheory.org/2021/09/24/coverage-is-not-strongly-correlated-with-test-suite-effectiveness.html),
  2026-11-01: coverage finds under-tested code but should not be used as a quality target.
- [Mutation-Guided LLM-based Test Generation at Meta](https://arxiv.org/html/2501.12862v1),
  2026-11-01: tests that catch new faults often add no line coverage, and review stays necessary.
- [Test Flakiness' Causes, Detection, Impact and
  Responses](https://ar5iv.labs.arxiv.org/html/2212.00908), 2026-11-01: causes, detection, and the
  gap between root-cause fixes and retries.
- [Software Engineering at Google, chapter 12](https://abseil.io/resources/swe-book/html/ch12.html),
  2026-11-01: behaviors, public interfaces, state over interactions, clear tests.
- [On the Diverse And Fantastical Shapes of
  Testing](https://martinfowler.com/articles/2021-test-shapes.html), 2026-11-01: test shape debates
  hide a disagreement on definitions.
- [Property-Based Testing in
  Practice](https://researchconnect.buffalo.edu/en/publications/property-based-testing-in-practice/),
  2026-11-01: where properties help, and why they are hard to write and evaluate.
- [From doctest to runnable Markdown](https://huggingface.co/blog/huggingface/runnable-examples),
  2026-11-01: run documentation blocks as ordinary tests to prevent drift.
- [StrykerJS incremental mode](https://stryker-mutator.io/docs/stryker-js/incremental/), 2026-11-01:
  what incremental mutation tracks and what it does not.
- [StrykerJS tap runner](https://stryker-mutator.io/docs/stryker-js/tap-runner/), 2026-11-01:
  running mutation against TAP output and its limits.
- [Simple Testing Can Prevent Most Critical
  Failures](https://www.usenix.org/conference/osdi14/technical-sessions/presentation/yuan),
  2026-11-01: most catastrophic failures studied were preventable by simple tests of error-handling
  code.
- [The Morning Paper on Simple Testing Can Prevent Most Critical
  Failures](https://blog.acolyer.org/2016/10/06/simple-testing-can-prevent-most-critical-failures/),
  2026-11-01: handlers that ignore or only log an error, hold a TODO, or abort after a broad catch,
  and the value of covering every handler.
- [ImpossibleBench: Measuring LLMs' Propensity of Exploiting Test
  Cases](https://arxiv.org/html/2510.20270v1), 2026-11-01: coding agents edit tests,
  special-case inputs, or override equality to pass; read-only tests stop only the edits, and
  monitors miss many cases.
- [Software Engineering at Google, chapter 13](https://abseil.io/resources/swe-book/html/ch13.html),
  2026-11-01: fakes over stubs, contract tests that keep a fake faithful, and larger tests on the
  real dependency.
