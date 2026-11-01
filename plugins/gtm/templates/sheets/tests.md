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
   code, and read survivors as review findings.
6. For Markdown, test the structure a reader or a script relies on, not the wording. Run code
   examples as ordinary tests instead of comparing their text output.
7. For complex logic with a wide input space, consider properties and generators, and check that
   they exercise the cases that matter.
8. For a flaky test, look first at asynchronous waits, shared order, network, randomness, and time.
   Fix the cause: a retry helps diagnose, it does not repair.

## Reflexes
- If I remove the line this test claims to protect, does it fail?
- Would a refactor with no behavior change break this test?
- Is this line covered because its effect is checked, or only because it ran?
- Does this test depend on order, the clock, the network, or an unbounded wait?
- If a test passes on a rerun, who owns the cause?
- Am I pinning wording that a reader does not depend on?
- When someone says unit or integration, what do they mean here?
- Does this new test catch a fault that no existing test catches?

## What is measured
- Ability to fail: each contract test has a deliberately broken input that it rejects. As a `verify`
  step, run the suite, including these cases.
- Fault detection: mutants surviving on changed lines. As a `verify` step, run a mutation tool
  limited to the diff and report survivors for review, without blocking. Whether a survivor matters
  stays judgment.
- Coverage floor: a low threshold on lines and branches. As a `verify` step, fail below the floor.
  No source gives a value, and coverage is never a quality target.
- Stability: repeated runs, in random order where the runner allows it, each test with a time limit.
  As a `verify` step, run periodically and fail on any divergence. Passing runs do not prove absence
  of flakiness.
- Documentation: code examples marked as runnable all execute. As a `verify` step, run them with the
  test suite.
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
  2026-11-01: coverage finds under-tested code but is not a quality target.
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
