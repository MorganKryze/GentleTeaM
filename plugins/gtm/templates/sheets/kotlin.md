# Kotlin

> Helps a role that writes, reviews or maintains Kotlin code let the compiler and the build enforce
> what can be checked, and keep the rest as explicit review judgment.

## When it applies
- Writing, reviewing or refactoring Kotlin code, on any target.
- Upgrading Kotlin, or changing compiler options or opt-ins.
- Writing or testing suspend functions, coroutines or flows.
- Adding, changing or removing a public declaration of a published Kotlin library.

## Method
1. Pin one Kotlin version for the whole build; check that its release line is still inside its
   published support window; plan the next language release (about every six months) and tooling
   release (about three months later).
2. Before using a feature, read its status (Stable, Beta, Alpha, Experimental) in the release notes;
   list every opt-in and every `-X` compiler argument, since those arguments are experimental.
3. Make the compiler strict: warnings fail the build, extra warnings and progressive mode on; any
   exemption is scoped to one task and written down.
4. Mark the APIs whose results must not be dropped, turn the unused-return-value checker on, and
   discard a result only on purpose, explicitly.
5. For coroutines: inject dispatchers; keep suspend functions main-safe; use suspend functions for
   one-shot work and flows for changing data; tie work to the caller's scope unless an injected
   longer-lived scope must own it; avoid the global scope; check for cancellation in long loops;
   never swallow cancellation; catch specific exceptions.
6. Test coroutine code with an injected test dispatcher, virtual time and one shared scheduler.
7. For a published library: explicit visibility and types on public declarations; a committed ABI
   dump checked on every build; avoid data classes in an API that will evolve; new optional
   parameters that keep old binary signatures; deprecation from warning to error to hidden across
   releases; experimental API behind an opt-in marker.
8. Run static analysis with type resolution and the coroutine rules on; keep a baseline only for
   findings older than the gate.
9. Treat each way around null safety as a reviewed exception: give every value read from unannotated
   Java an explicit Kotlin type where it enters, nullable unless the Java side guarantees otherwise;
   annotate the Java you own, prefer Java APIs annotated for nullability, and never lower the level
   at which their mismatches are reported; justify every `!!`; do not let `this` escape a
   constructor or call an open member from it.
10. For a published library, set the language and API version to the oldest Kotlin release its
    consumers still build with, not the compiler's default: an older compiler can at best read
    binaries from the next language release, never later ones; on the JVM at least three earlier
    versions can be set, while on other targets consumers still need the newest compiler whatever is
    set.
11. For coroutine failures: a child that fails with anything but cancellation cancels its parent
    and, through it, its siblings; give a scope whose children must fail independently a supervisor
    job or a supervisor scope, and have each supervised child handle its own failures; install an
    exception handler only on a root coroutine or a direct child of a supervisor job or a supervisor
    scope, since elsewhere it is never called, and treat it as a last report, not a recovery.

## Reflexes
- Which release line is this build on, and when does its support window close?
- Does this change keep the build at zero warnings?
- Is this feature Stable, or did I just opt into something that may change?
- Where could a null still get in here: a `!!`, a value from unannotated Java, or an object used
  before its constructor finished?
- Which scope owns this coroutine, and what cancels it?
- Could this catch block or result wrapper swallow a cancellation?
- If this coroutine fails, what else does that cancel, and is its exception handler somewhere it is
  actually called?
- If this call's result is ignored, is that a bug?
- Does this public change break binaries for a caller who does not recompile, sources for one who
  does, or behaviour for either?
- Can a consumer still on the oldest supported Kotlin release compile against this artifact?

## What is measured
- Compiler warnings, target zero. Verify step: the compile step with warnings promoted to errors.
- Ignored return values in marked code, then in all code. Verify step: the same compile with the
  checker on.
- New static-analysis findings, coroutine rules included. Verify step: analysis with type resolution
  fails on any finding outside the baseline.
- `!!` calls and platform types in public declarations. Verify step: the same type-resolved analysis
  with its unsafe-call and platform-type rules on fails on any finding outside the baseline; whether
  a value from unannotated Java may be null stays judgment.
- Public ABI drift of a published module against the committed dump. Verify step: the ABI check
  inside the default check task; accepting a drift stays a reviewed judgment.
- Oldest Kotlin release a published library supports. Verify step: the compile with language and API
  version set to that release fails on any later language feature and ignores declarations that use
  standard-library APIs introduced later; choosing the release stays judgment.
- Line or branch coverage of unit tests against a minimum bound. Verify step: coverage verification
  wired explicitly into the check task; the bound stays judgment, and the cited tool measures only
  tests run on the JVM.
- Support window of the Kotlin line in use. Verify step: a scheduled check that fails once the
  published end date has passed; when to upgrade inside the window stays judgment.
- Scope ownership, main-safety and public API design stay judgment: reviewed, not measured.
- Failure propagation between coroutines and the placement of exception handlers stay judgment:
  reviewed, not measured.

## Sources
- [What's new in Kotlin 2.4.0](https://kotlinlang.org/docs/whatsnew24.html), 2026-11-01: feature
  statuses, end of K1 support.
- [Kotlin release process](https://kotlinlang.org/docs/releases.html), 2026-11-01: release cadence,
  18-month support window.
- [Compiler options in the Kotlin Gradle
  plugin](https://kotlinlang.org/docs/gradle-compiler-options.html), 2026-11-01: warnings as errors,
  extra warnings, progressive mode, status of `-X` arguments.
- [Unused return value checker](https://kotlinlang.org/docs/unused-return-value-checker.html),
  2026-11-01: modes, marking, deliberate discards.
- [Binary compatibility validation in the Kotlin Gradle
  plugin](https://kotlinlang.org/docs/gradle-binary-compatibility-validation.html), 2026-11-01: ABI
  dump checked within the default check.
- [Backward compatibility guidelines for library
  authors](https://kotlinlang.org/docs/api-guidelines-backward-compatibility.html), 2026-11-01:
  compatibility kinds, API pitfalls, deprecation cycle.
- [Simplicity](https://kotlinlang.org/docs/api-guidelines-simplicity.html), 2026-11-01: explicit API
  mode, minimal public API.
- [Best practices for coroutines in
  Android](https://developer.android.com/kotlin/coroutines/coroutines-best-practices), 2026-11-01:
  dispatchers, scopes, cancellation, test dispatchers.
- [detekt coroutines rule set](https://detekt.dev/docs/rules/coroutines/), 2026-11-01: coroutine
  rules, defaults, type resolution.
- [Kover Gradle plugin](https://kotlin.github.io/kotlinx-kover/gradle-plugin/), 2026-11-01: coverage
  bounds and units, JVM-only scope.
- [Null safety](https://kotlinlang.org/docs/null-safety.html), 2026-11-01: the only causes of an NPE
  in Kotlin, the not-null assertion operator, leaking this and open members called during
  construction.
- [Calling Java from Kotlin](https://kotlinlang.org/docs/java-interop.html), 2026-11-01: platform
  types and their runtime failures, supported nullability annotations, JSpecify mismatches reported
  as errors by default, JSR-305 default level.
- [detekt potential-bugs rule set](https://detekt.dev/docs/rules/potential-bugs), 2026-11-01:
  UnsafeCallOnNullableType and HasPlatformType, active by default, type resolution required.
- [Kotlin evolution principles](https://kotlinlang.org/docs/kotlin-evolution-principles.html),
  2026-11-01: language and API version options, at least three earlier versions on the JVM, forward
  binary compatibility of one release at best, newest compiler needed on other targets.
- [Coroutine exceptions handling](https://kotlinlang.org/docs/exception-handling.html), 2026-11-01:
  failure propagation to parent and siblings, where an exception handler is used, supervision.
