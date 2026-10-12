---
name: tune
description: Re-evaluate the GTM team profile - reads the ledger's run, minor and usage lines and the reports, proposes changes to priorities, per-role model and effort, specialists, triggers and gates as decision cards, and records what the human approves with its date. Use when /gtm:retro suggests it or the human feels the team is too slow, too costly or missing things.
---
# Tune the team profile

Ground rules: as in the `gtm` skill §0. Nothing in `team.md` changes without the human's answer.

## 1. Read
`<root>/team.md`, the `run`, `minor` and `usage` lines of the ledger, and the final reviews under
`<root>/reports/`.

## 2. Look for signals
| Signal | Typical proposal |
| --- | --- |
| fix rounds hit the cap in two runs or more | raise the architect's effort (plans too thin) or the implementer's |
| a specialist found nothing in three runs it ran on | narrow its triggers or lower its effort |
| the final review caught what a specialist should have | widen that specialist's triggers or raise its effort |
| many critical or important findings in one area | raise that priority's weight; add or enable the specialist |
| design loops end at the last round | raise the designer's effort, or revisit the threshold with the human |
| `usage` notes about limits | lower the effort of high-volume roles first (implementer, reviewer); never a role guarding a high priority |
| a priority changed in the brief | re-derive the roles it drives |

No signal: say so in one line and stop.

## 3. Propose
One decision card per change, at most five, most valuable first:
```
Decision: <setting>: <current> → <proposed>
Why: <the ledger evidence, with counts>
I recommend: yes / no, because …
Cost if wrong: …
```

## 4. Record
Write each approved value into `team.md` with its new reason and today's date, add a History line
(`- <date> · <setting>: <old> → <new> · <why>`), and a `ruling` line in the ledger quoting the
human's choice. Rejected proposals get a ledger line too, so they are not proposed again without new
evidence.
