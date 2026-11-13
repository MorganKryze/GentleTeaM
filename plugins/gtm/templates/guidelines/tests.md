# Test guideline

> When to read: architect, implementer, reviewer, ux-qa, release-qa.

- **Test first:** the failing run is captured before the code. Tests assert behaviour and would fail
  without the change; every EARS line of a spec has at least one test.
- **Levels:** unit for rules and pure logic; integration for storage, APIs and contracts; e2e for a
  person's path through a screen. <Project frameworks and where each level lives.>
- **Coverage:** every changed behaviour is tested; no percentage target unless set here: <target>.
- **Accessibility:** every new screen gets an automated check (e.g. axe) in light and dark.
- **Flaky tests:** a test that fails then passes is a bug. A verdict on a red comes only from runs
  where it went red: a local red from local solo runs, a CI red from runs through `verify.runner`.
  A flaky verdict needs up to <k> solo runs (10 by default) within <m> minutes per verdict (30 by
  default), with both a red and a green; no rerun turns a red gate or a red CI check green. Known
  flakes are listed below with their symptom and how to confirm; a flake is fixed or deleted
  within <N> weeks.
- Every commit leaves the gate green.

## Known flakes
<Test name · symptom · how to confirm.>
