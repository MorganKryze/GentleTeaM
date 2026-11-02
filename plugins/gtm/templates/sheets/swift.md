# Swift

> Helps an engineer write, migrate and gate Swift code on the current toolchain: data-race safety,
> default isolation, tests, warnings, formatting and API design.

## When it applies
- Writing, reviewing or refactoring Swift code in a package or an application target.
- Moving a module from the Swift 5 to the Swift 6 language mode, or enabling an upcoming concurrency
  feature.
- Choosing or reviewing a target's default actor isolation.
- Writing new tests, or converting XCTest tests to Swift Testing.
- Setting CI gates on a Swift codebase: warnings, formatting, tests, language mode.
- Designing, naming or documenting a public Swift API.

## Method
1. Pin the toolchain and read its release post before relying on a feature. A feature named only by
   a secondary source stays unconfirmed until the pinned toolchain accepts it.
2. Migrate data-race safety outward-in, starting with the module nothing depends on:
   - in the Swift 5 mode, enable upcoming concurrency features one at a time, then complete checking;
   - fix each diagnostic with the smallest change that states what is true now;
   - list every unsafe opt-out as debt;
   - switch the target to the Swift 6 mode, and move on without waiting for zero warnings elsewhere.
   Before the switch ships, run each synchronous isolated function that unchecked code can call, such as `@objc` members and closures handed to modules without strict checking. The Swift 6 mode checks their actor at runtime and stops the program on a mismatch. `@preconcurrency` conformances get the same check in any mode.
3. Before enabling an upcoming feature, run the migration tooling and apply the fix-its that keep
   current behavior.
4. Decide each target's default isolation explicitly, from a weighted comparison of options:
   - keep libraries nonisolated;
   - in main-actor-default targets, mark work meant for the thread pool `@concurrent`;
   - record the decision with the toolchain version.
5. Declare the warning policy in the manifest for each migrated target: all warnings as errors
   except deprecations. Keep local exceptions in source, next to the code they cover.
6. Format and lint with the toolchain's swift-format from one committed configuration file, linting
   in strict mode.
7. Write new tests with Swift Testing:
   - struct or actor suites;
   - `#expect` to continue after a failure, `#require` to stop or unwrap;
   - traits or test cancellation to skip;
   - confirmations for events.
   Convert XCTest files as they are touched. Keep tests parallel, and serialize only suites that share state, as recorded debt.
8. Design APIs for clarity at the point of use:
   - a summary comment on every declaration;
   - variables, parameters and associated types named by role;
   - Boolean members that read as assertions;
   - complexity of computed properties documented when not O(1);
   - default parameters rather than overload families.
9. Where performance matters, prefer `Span`, `InlineArray` and noncopyable types to unsafe
   constructs. Enable strict memory safety only where security requirements justify it.

## Reflexes
- Which toolchain release brought this feature, and does the pinned toolchain have it?
- Is this target an application, an executable or a library, and does its default isolation fit?
- Does this fix state what is true now, or does it hide a data race behind an unchecked opt-out?
- Does this actor method read its state, await, then act on what it read? Actors are reentrant, so
  the state may have changed while the method was suspended. Keep each state update in a synchronous
  method.
- Does this cancellation shield only finish cleanup already started, or does it hide cancellation
  from long work?
- Does code on the cooperative thread pool wait on a semaphore or condition for work another task
  must finish? The pool has no more threads than cores and depends on each thread making progress,
  so that wait can hang a thread. Hold locks only around short critical sections, and never across
  an `await`.
- Which tests share global state and break when run in parallel?
- Does the call site read clearly without the declaration in view?

## What is measured
- Build warnings outside deprecations: zero on migrated targets. `verify` builds from a clean
  checkout under the manifest's warning policy and fails on a non-zero exit.
- Language-mode migration: the count of targets held in the Swift 5 mode never goes above a
  committed ceiling. `verify` counts the overrides in the manifest. When a target is ready to switch
  stays judgment.
- Formatting: `verify` runs swift-format lint, strict and recursive, on sources and tests; any
  finding fails.
- Tests: `verify` runs the suite on each target platform. The count of test files importing XCTest
  never goes above a committed ceiling.
- Default isolation per target: a recorded decision, reviewed at each toolchain release; judgment,
  not gated.
- API naming and documentation: review against the API design guidelines; judgment, not gated.

## Sources
- [Swift 6.4 Released](https://www.swift.org/blog/swift-6.4-released/), 2026-11-01: Swift Build
  default, @diagnose, XCTest interop, async defer, ownership types.
- [Swift 6.3 Released](https://swift.org/blog/swift-6.3-released/), 2026-11-01: test cancellation,
  warning-severity issues, C interop, Swift Build preview.
- [Swift 6.2 Released](https://www.swift.org/blog/swift-6.2-released/), 2026-11-01: approachable
  concurrency, warning control, migration tooling, Span, InlineArray, strict memory safety.
- [Swift Migration Guide, Migration
  Strategy](https://raw.githubusercontent.com/swiftlang/swift-migration-guide/main/Guide.docc/MigrationStrategy.md),
  2026-11-01: outward-in order, smallest true change, opt-outs as follow-on refactoring
  opportunities.
- [Swift Migration Guide, Enable data-race safety
  checking](https://raw.githubusercontent.com/swiftlang/swift-migration-guide/main/Guide.docc/EnableDataRaceSafety.md),
  2026-11-01: compiler, manifest and build settings for complete checking and the Swift 6 mode.
- [swift-format](https://github.com/swiftlang/swift-format), 2026-11-01: bundled since Swift 6,
  strict lint exit, recursive mode, configuration lookup.
- [Swift Testing, Migrating a test from
  XCTest](https://raw.githubusercontent.com/swiftlang/swift-testing/main/Sources/Testing/Testing.docc/MigratingFromXCTest.md),
  2026-11-01: suite shape, assertion mapping, parallel default, serialized trait.
- [API Design Guidelines](https://www.swift.org/documentation/api-design-guidelines/), 2026-11-01:
  clarity at the point of use, naming, documentation comments.
- [MainActor by Default](https://massicotte.org/blog/mainactor-by-default), 2026-11-01: a
  practitioner's case against main-actor default isolation.
- [Swift 6.4: What's New in
  Concurrency](https://www.avanderlee.com/concurrency/swift-6-4-whats-new-in-concurrency/),
  2026-11-01: limit cancellation shields to finishing cleanup already started.
- [SE-0423, Dynamic actor isolation
  enforcement](https://raw.githubusercontent.com/swiftlang/swift-evolution/main/proposals/0423-dynamic-actor-isolation.md),
  2026-11-01: the runtime actor checks the Swift 6 mode adds where unchecked code calls synchronous
  isolated functions, the program stop on a mismatch, and the same check for preconcurrency
  conformances in any mode.
- [SE-0306,
  Actors](https://raw.githubusercontent.com/swiftlang/swift-evolution/main/proposals/0306-actors.md),
  2026-11-01: actor functions are reentrant, state can change across an await, keep state updates in
  synchronous methods.
- [WWDC21, Swift concurrency: Behind the
  scenes](https://developer.apple.com/videos/play/wwdc2021/10254/), 2026-11-01: a pool with no more
  threads than cores, the forward-progress contract, semaphores and conditions unsafe, short locks,
  and care not to hold them across an await.
