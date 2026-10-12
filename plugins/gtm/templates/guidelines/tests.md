# Test guideline

> When to read: architect, implementer, reviewer, ux-qa, release-qa.

- **Test first:** the failing run is captured before the code. Tests assert behaviour and would fail
  without the change; every EARS line of a spec has at least one test.
- **Levels:** unit for rules and pure logic; integration for storage, APIs and contracts; e2e for a
  person's path through a screen. <Project frameworks and where each level lives.>
- **Coverage:** every changed behaviour is tested; no percentage target unless set here: <target>.
- **Accessibility:** every new screen gets an automated check (e.g. axe) in light and dark.
- **Flaky tests:** a flake is rerun alone once; if it fails again it is a bug. Known flakes are
  listed below with their symptom and how to confirm; a flake is fixed or deleted within <N> weeks.
- Every commit leaves the gate green.

## Known flakes
<Test name · symptom · how to confirm.>
