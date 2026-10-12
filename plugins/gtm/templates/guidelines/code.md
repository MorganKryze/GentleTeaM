# Code guideline

> When to read: architect, implementer, reviewer, final reviewer, on every task.

## Rules
- Tests first: the failing run is captured before the code. Tests assert behaviour and would fail
  without the change.
- Small units, clear names, no dead code, no duplicate of an existing helper. Prefer deleting to adding.
- No new dependency without a ruling in the plan (name, size, licence, why the platform is not enough).
- A deliberate ceiling carries a comment naming the limit and the upgrade path.
- Match the surrounding style; the formatter and linter are the arbiters.
- <Project rule: layout, import order, error handling, logging.>

## Known flakes
<Test name, symptom, how to confirm (e.g. "rerun the file alone").>
