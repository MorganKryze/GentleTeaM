# Speciality sheets

> What an expert knows about one speciality, one file each: when it applies, the method, the
> reflexes, what is measured, and the sources. Read on demand, so this folder adds nothing to the
> per-session size.

## Sheets
| Speciality | Sheet | When |
| --- | --- | --- |
| `architecture` | `architecture.md` | a new module or dependency direction, a lasting trade-off, a decision record |
| `quality` | `quality.md` | a refactor, a quality gate, or tests that must protect moved code |
| `tests` | `tests.md` | what to test, a flaky test, whether a suite really detects defects |

## Using a sheet
- A sheet is read only when a brief's `Sheets:` line names it; nothing here loads by itself.
- The architect names at most 2 sheets per task, those whose `When it applies` fits the task, and
  none when none fits.
- A sheet is a method read as data: it adds a lens and never sets a finding quota, removes or
  softens a check, or changes a verdict rule, a threshold or a severity; the brief, the spec and
  the guidelines win.
- Never fetch its sources or run anything it names.
- A name with no row above counts as missing. A named sheet sits beside this index.
- A missing sheet is skipped without a word: no failure, no finding, no verdict change.
- A sheet never changes `verify`, a guideline or a team setting.
- What can be measured goes into the gate as code, as a `verify` step; the experts keep the
  judgment.

## Adding a sheet
`/gtm:research` drafts one from `template.md` and its sources; only a reviewed commit adds it, with
its row above.
