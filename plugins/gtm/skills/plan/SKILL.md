---
name: plan
description: Write the GTM task plan with the architect from an approved spec - per task files, interfaces, TDD steps, verify command, parallel-safe tags - applying the ledger's lessons and replaying only risky tasks in a scratch clone. No human touchpoint unless something deviates.
argument-hint: "[spec path or slug]"
---
# Plan (no touchpoint)

Ground rules: as in the `gtm` skill §0. The spec must say `Status: approved`; otherwise run
`/gtm:spec` first.

## 1. Write
The spec's Status ends with `plan kept from the one pass` and the plan exists: dispatch no
architect, go to §2. Otherwise (no one pass, a card answered otherwise, the spec changed),
dispatch `gtm:architect` (plan mode), which writes or rewrites the plan, with: the spec path, the
validated board, the output path `<root>/plans/<YYYY-MM-DD>-<slug>.md`, the ledger path, and the
team profile's Gates (replay risky tasks: yes/no; risky paths). Template:
`${CLAUDE_PLUGIN_ROOT}/templates/plan.md`.

## 2. Check
- Every task has Files, Interfaces, TDD steps with commands from `verify`, a Verify line and a
  commit message.
- `[P]` only on tasks whose files are disjoint from every other `[P]` task in the same wave.
- Every EARS line of the spec maps to at least one task's test.
- Risky tasks replayed as the architect's Replay policy says, with gate counts recorded; a plan
  of one task is not replayed, its TDD steps plant the mutations instead.
- The plan lists the ledger lessons it applied.
One round of corrections with the architect if a check fails.

## 3. Continue
Do not present the plan. Go straight to `/gtm:deliver`, unless the plan deviates from the spec (a
Heads-up and a decision card) or the human asked to see it (`/gtm:brief-me`).
