# Rust

> Helps an engineer write, review and ship Rust code that builds without warnings, keeps
> dependencies and unsafe code under control, and honours its declared toolchain.

## When it applies
- Writing, reviewing or refactoring Rust code built with Cargo.
- Adding, removing or upgrading a crate dependency, or acting on an ecosystem security advisory.
- Writing or reviewing unsafe code, FFI declarations or concurrency primitives.
- Setting up or changing CI, the toolchain pin, the declared rust-version (MSRV) or the edition.
- Preparing a library crate for publication.

## Method
1. Read the toolchain contract first: edition, declared rust-version and its published policy,
   pinned toolchain. Raise rust-version only when the policy says so; changing it is assumed to be a
   minor incompatibility.
2. Keep the build warning-free on all targets and features with the pinned toolchain. Silence a lint
   at the narrowest scope that needs it. Enable pedantic lints one by one; never enable the
   restriction group wholesale.
3. Change dependencies only through a reviewed change to the committed lockfile, and read new build
   scripts and new transitive crates in that diff. Run any job that resolves or builds fresh
   versions without secrets.
4. Keep unsafe code small and behind a safe API, and write next to each unsafe block the invariant
   it relies on. On edition 2024, put unsafe operations inside unsafe functions in explicit unsafe
   blocks, and mark extern blocks and the export_name, link_section and no_mangle attributes unsafe.
5. Reach every unsafe path with tests and run them under Miri, with many seeds for concurrent code.
   Exclude with cfg(miri) only what Miri cannot run (most FFI, networking) and get other evidence
   for it; for complex atomics add a dedicated concurrency checker, since Miri's weak-memory
   emulation is incomplete.
6. Gate on the pinned toolchain, run beta and nightly as non-blocking jobs, and bump the toolchain
   through an automated change.
7. Migrate editions with the automatic fixer, then review by hand what it cannot judge: temporary
   drop scopes, impl Trait lifetime capture, never-type fallback, environment mutation now unsafe.
8. On a supply-chain advisory: look for the named versions in lockfiles and the local registry
   cache, clear CI caches, rotate any secret a build could have read.
9. Before publishing a library release, run cargo-semver-checks against the last published version
   and bump the leftmost non-zero version component for any break, since Cargo treats every other
   bump as compatible; review by hand what the tool cannot lint: changed types, generics and
   lifetimes, breakage under some feature sets, behaviour.
10. Return an error, not a panic, for every failure that input can cause, and count configuration
    and data files your own systems generate as input; keep unwrap and expect for invariants the
    code itself upholds, with an expect message that states the invariant.
11. Publish library releases from CI through crates.io trusted publishing, not a long-lived API
    token: tie it to one repository, one workflow file and a protected release environment, and
    review every action that workflow runs; only the first release is published by hand.

## Reflexes
- Which toolchain, edition and rust-version must this change build on, and does CI prove it?
- Does this dependency arrive through a reviewed lockfile change, and could anything that builds it
  read a secret?
- If a crate we depend on were republished maliciously today, what would it reach before we noticed?
- If our own crates.io publish token leaked today, how long would it work, and from where could it
  publish?
- What invariant does this unsafe block rely on, is it written next to it, and do tests reach it
  under Miri?
- Am I silencing one lint at one site, or weakening the gate for everyone?

## What is measured
- Zero compiler and lint warnings on all targets and features with the pinned toolchain: verify with
  `CARGO_BUILD_WARNINGS=deny cargo clippy --all-targets --all-features --keep-going`, then `cargo
  test` and `cargo doc --no-deps`.
- Crates that read outside input contain no unwrap call outside tests: verify by enabling Clippy's
  `unwrap_used` lint in those crates, with `allow-unwrap-in-tests` turned on, so the warning gate
  above fails on any new one; whether each expect guards a real invariant stays a review.
- The dependency graph passes the team's advisory, ban, licence and source policy: verify with
  `cargo deny check` against a versioned configuration.
- The declared rust-version holds for published crates: verify with `cargo hack check --rust-version
  --workspace --all-targets --ignore-private`.
- Each library release honours SemVer against the last published version: verify with `cargo
  semver-checks` before `cargo publish`, once per target where the public API differs by target;
  breakage it cannot lint and behaviour changes stay a review.
- Crates with unsafe code pass their tests under Miri: verify with `cargo miri test` in a job that
  holds no secret and writes no cache that pull requests can read.
- The lockfile is committed and changes only through reviewed update changes: verify that the file
  is tracked; judging each update stays a review.
- Judgment, not measured: soundness of each unsafe invariant (Miri cannot prove it), the MSRV
  policy, whether a dependency is worth its risk, idioms after an edition migration.

## Sources
- [Rust blog](https://blog.rust-lang.org/), 2026-11-01: six-week release cadence, current stable
  1.99, 2026 security posts.
- [Announcing Rust 1.85.0 and Rust 2024](https://blog.rust-lang.org/2025/02/20/Rust-1.85.0/),
  2026-11-01: edition 2024 changes and the cargo fix caveat.
- [Rust 2024 edition guide](https://doc.rust-lang.org/edition-guide/rust-2024/index.html),
  2026-11-01: edition 2024 is RFC 3501, stable since 1.85.0.
- [Clippy README](https://github.com/rust-lang/rust-clippy), 2026-11-01: lint groups and levels, CI
  usage, warnings as errors, MSRV awareness.
- [Cargo book: continuous
  integration](https://doc.rust-lang.org/cargo/guide/continuous-integration.html), 2026-11-01: CI
  jobs, toolchain pinning, dependency update options, rust-version check.
- [Cargo book: rust-version](https://doc.rust-lang.org/cargo/reference/rust-version.html),
  2026-11-01: MSRV semantics, policies, support expectations.
- [cargo-deny book](https://embarkstudios.github.io/cargo-deny/), 2026-11-01: the four dependency
  checks and the command that runs them.
- [Supply chain attack on
  arrayref](https://blog.rust-lang.org/2026/08/20/supply-chain-attack-on-arrayref/), 2026-11-01:
  build-script payload, yank abuse, local cache check.
- [Miri README](https://github.com/rust-lang/miri), 2026-11-01: what Miri detects, its limits, CI
  setup.
- [GitHub Actions leaking secrets when Miri output is
  cached](https://blog.rust-lang.org/2026/09/21/github-actions-leaking-secrets-when-miri-output-is-cached/),
  2026-11-01: leak conditions and mitigations.
- [Rust in Android: move fast and fix
  things](https://blog.google/security/rust-in-android-move-fast-fix-things/), 2026-11-01:
  memory-safety and delivery metrics, unsafe share, training.
- [2025 State of Rust Survey
  results](https://blog.rust-lang.org/2026/03/02/2025-State-Of-Rust-Survey-results), 2026-11-01:
  stable usage, top problems, sample caveat.
- [Cargo book: SemVer compatibility](https://doc.rust-lang.org/cargo/reference/semver.html),
  2026-11-01: major, minor and possibly-breaking changes, the leftmost non-zero component rule,
  behaviour changes left to maintainers.
- [cargo-semver-checks README](https://github.com/obi1kenobi/cargo-semver-checks), 2026-11-01:
  linting a release before cargo publish against the last crates.io version, one run per target, the
  breakage it cannot detect.
- [Rust book: To panic! or not to
  panic!](https://doc.rust-lang.org/book/ch09-03-to-panic-or-not-to-panic.html), 2026-11-01: errors
  for expected failures such as malformed input, panics for broken invariants, expect messages that
  record the assumption.
- [Clippy lint configuration](https://doc.rust-lang.org/clippy/lint_configuration.html), 2026-11-01:
  the allow-unwrap-in-tests option and the unwrap_used lint it affects.
- [Cloudflare outage on November 18, 2025](https://blog.cloudflare.com/18-november-2025-outage/),
  2026-11-01: an unwrap on an oversized generated file crashed a proxy, and internally generated
  config is to be hardened like user input.
- [crates.io development update, July
  2025](https://blog.rust-lang.org/2025/07/11/crates-io-development-update-2025-07), 2026-11-01:
  trusted publishing from CI without stored secrets, first release published by hand.
- [RFC 3691: trusted publishing for
  crates.io](https://rust-lang.github.io/rfcs/3691-trusted-publishing-cratesio.html), 2026-11-01:
  risks of long-lived API tokens, short-lived tokens bound to a crate, repository, workflow file and
  optional environment, review of release workflow actions.
