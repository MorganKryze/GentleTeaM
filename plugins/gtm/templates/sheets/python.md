# Python

> Helps a developer or reviewer change, check and ship Python code that installs identically
> everywhere, passes static gates and runs on every supported interpreter.

## When it applies
- Creating or restructuring a Python project, its `pyproject.toml` or its dependency declarations.
- Adding, upgrading or removing a dependency, regenerating a lock file, setting a library's
  dependency ranges, or installing from a private index.
- Changing the supported interpreter range, or moving to a new yearly CPython release.
- Setting up or tightening lint, format, type-check or test gates in continuous integration.
- Publishing a package to an index, or auditing dependencies for known vulnerabilities.

## Method
1. Read the interpreter calendar: one release a year in October, about two years of bugfixes, then
   security fixes only until five years after release. Set `requires-python` as a floor on a
   supported version, with no upper bound.
2. Keep `pyproject.toml` as the single source of truth: a declared build backend, the standard
   project table, development tools in dependency groups (PEP 735) rather than extras, and the
   license as an SPDX expression (PEP 639).
3. Resolve once, install many times: commit a lock file with hashes, fail CI when it no longer
   matches the declarations, and install from it without re-resolving. Keep an export to the
   standard `pylock.toml` format (PEP 751) as an exit door.
4. Run one linter and one formatter in check mode: locally through hooks pinned to tags, and again
   in CI on the whole tree.
5. Introduce type checking gradually: a pinned checker and a shared config, a clean subset first,
   per-module exemptions, annotations required on new code, strict mode as the target, and
   exemptions that only shrink.
6. Test the installed package: source layout, tests outside the package, an import mode that leaves
   the module search path alone, strict test-runner settings, and the oldest and newest supported
   interpreters in the matrix.
7. Before an interpreter upgrade, read the release notes for removals and changed defaults (3.15
   makes UTF-8 the default text encoding), and run the suite with the matching warnings turned into
   errors.
8. Ship without long-lived secrets: short-lived identity-based publishing tokens, a vulnerability
   audit of the locked set with documented exceptions, and a human review of every new dependency,
   since an audit must not be assumed to defend against malicious packages.
9. For a library, publish dependencies as ranges, never as exact pins or as transitive dependencies:
   users resolve them fresh and use the lock only if they install it explicitly. State for each
   dependency the oldest version the code really works with, cap one only for a known
   incompatibility, and prove those floors with a CI job that resolves every dependency to its
   lowest allowed version.
10. When any package comes from a private index, bind each internal name to that index and keep the
    resolver stopping at the first index that offers a name; a strategy that takes the best version
    across all indexes lets a same-name upload with a higher version on a public index replace the
    internal package (dependency confusion).
11. Give a trusted publisher the care of an API token: only a minimal publishing job, in a dedicated
    environment that requires a human approval, may request the identity token; the distributions
    are built in a separate job; only maintainers can create release tags; no release runs from a
    trigger that executes outside contributions with the repository's rights; and the publishers a
    departing maintainer registered are removed explicitly, since removing the user leaves them in
    place.

## Reflexes
- Does any file or stream rely on an implicit encoding, or on an API removed in the target release?
- Beyond "no known vulnerability", why should this new dependency be trusted?
- Did this change start relying on a dependency feature newer than the declared floor?

## What is measured
- Lock freshness: the lock matches the declared dependencies. Verify step: the locker's check mode,
  which fails on drift.
- Static cleanliness: zero lint findings and zero formatting diff on the whole tree. Verify step:
  linter and formatter in check mode.
- Type debt: zero errors under the committed config, and a count of exempted modules that never
  grows compared with the main branch. Verify step: the type checker plus that count. The strictness
  each module deserves stays judgment.
- Interpreter coverage: the suite passes on the oldest and newest supported versions, with strict
  runner settings and encoding warnings as errors. Verify step: a test matrix.
- Support floor: the declared minimum version is not end-of-life. Verify step: a script comparing
  `requires-python` with a maintained floor.
- Known vulnerabilities: no advisory on the locked set without a recorded ID and reason. Verify
  step: the auditor's exit code.
- Declared floors: for a library, the suite passes with every dependency resolved to its lowest
  allowed version. Verify step: a CI job using the resolver's lowest strategy. Where each floor sits
  stays judgment.
- Index binding: every internal package in the lock was resolved from the private index. Verify
  step: a script reading the index the lock records for each internal package, failing when it is
  missing or public.
- Release path: only the publishing job can request the identity token, and it names a dedicated
  environment. Verify step: a script over the CI configuration that fails otherwise. Whether that
  environment really requires an approval, and who may give it, stays judgment.
- Trust in a new dependency, adopting a pre-1.0 tool, and choosing between competing tools stay
  judgment.

## Sources
- [Status of Python versions](https://devguide.python.org/versions/), 2026-11-01: release cadence,
  support phases, end-of-life dates.
- [What's new in Python 3.15](https://docs.python.org/3/whatsnew/3.15.html), 2026-11-01: UTF-8
  default, lazy imports, removals, free-threaded stable ABI.
- [Writing your
  pyproject.toml](https://packaging.python.org/en/latest/guides/writing-pyproject-toml/),
  2026-11-01: build system, project table, floor with a caution against an upper bound, SPDX
  license.
- [pylock.toml specification](https://packaging.python.org/en/latest/specifications/pylock-toml/),
  2026-11-01: standard lock format with mandatory hashes for archives, sdists and wheels.
- [uv: Locking and syncing](https://docs.astral.sh/uv/concepts/projects/sync/), 2026-11-01: lock
  check versus frozen install, dependency groups, exports.
- [Did pip 26 close the gap with
  uv?](https://pydevtools.com/blog/did-pip-26-close-the-gap-with-uv/), 2026-11-01: installer
  trade-offs and single-vendor risk.
- [Ruff](https://docs.astral.sh/ruff/), 2026-11-01: one linter and formatter in place of several
  tools.
- [Using mypy with an existing codebase](https://mypy.readthedocs.io/en/stable/existing_code.html),
  2026-11-01: gradual type-checking method, strict flags.
- [Scientific Python Development Guide: Style and static
  checks](https://learn.scientific-python.org/development/guides/style/), 2026-11-01: pinned hooks,
  rule groups, checker strictness.
- [pytest: Good Integration
  Practices](https://docs.pytest.org/en/stable/explanation/goodpractices.html), 2026-11-01: src
  layout, importlib mode, strict mode.
- [Publishing to PyPI with a Trusted Publisher](https://docs.pypi.org/trusted-publishers/),
  2026-11-01: short-lived OIDC publishing tokens.
- [pip-audit](https://github.com/pypa/pip-audit), 2026-11-01: vulnerability audit, exit codes,
  ignore by ID, limits.
- [uv: Resolution](https://docs.astral.sh/uv/concepts/resolution/), 2026-11-01: lowest and
  lowest-direct strategies, declaring real lower bounds, testing them in CI.
- [install_requires vs requirements
  files](https://packaging.python.org/en/latest/discussions/install-requires-vs-requirements/),
  2026-11-01: minimal ranges for a project, no pins or sub-dependencies, known lower or upper
  bounds, pinned files for whole environments.
- [uv: Package indexes](https://docs.astral.sh/uv/concepts/indexes/), 2026-11-01: first-index
  default against dependency confusion, risk of best match across indexes, pinning a package to an
  index.
- [PyPI Trusted Publishers: Security model and
  considerations](https://docs.pypi.org/trusted-publishers/security-model/), 2026-11-01: publishers
  handled like tokens, any workflow may request one, dangerous triggers, dedicated environment with
  reviewers, separate build job, tag protection, offboarding.
