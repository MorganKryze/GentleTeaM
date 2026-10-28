---
name: plan
description: "Write the GTM task plan from an approved spec with the architect. Use when the spec is approved."
argument-hint: "[spec path or slug]"
---
# Plan (no checkpoint)

Ground rules: as in the `gtm` skill §0. The spec must say `Status: approved`; otherwise run
`/gtm:spec` first.

## 1. Write
An amend (a dig pick from `/gtm:brief-me`): dispatch the architect with the existing plan path
and the picked option, never the shortcut below; it edits that file in place, same path, kept
Decisions, and the plan is shown to the human before delivery.
The spec's Status ends with `plan kept from the one pass` and the plan exists: dispatch no
architect, go to §2. Otherwise (no one pass, a card answered otherwise, the spec changed),
dispatch `gtm:architect` (plan mode), which writes or rewrites the plan, with: the spec path, the
validated mockup page, the output path `<root>/plans/<YYYY-MM-DD>-<slug>.md`, the ledger path, and the
team settings' Gates (replay risky tasks: yes/no; risky paths; `tasks per branch`). Template:
`${CLAUDE_PLUGIN_ROOT}/templates/plan.md`. When it returns, append its progress line (`plan`) as
`/gtm:deliver` §1 says, and one more after each correction round and each revision (§2); a
phase's lines are summed in the run line.

## 2. Check
- Every task has Files, Interfaces, TDD steps with commands from `verify`, a Verify line and a
  commit message.
- `[P]` only on tasks whose files, CHANGELOG included, are disjoint within their parallel wave (two
  or more consecutive `[P]` tasks); a lone `[P]` task runs as any other.
- At most the Gates line `tasks per branch` (absent: 8) tasks, a release-only one not counted,
  each a vertical slice (a screen, a flow) and one review unit; more: back to the architect
  once, then a card (split / accept), with your recommendation.
- Every task names the numbered global constraints it touches.
- Every task has `Tier: guarded | standard`: guarded when one of its Files matches a trigger of a
  specialist the team settings' `review cadence` keeps per-task (a role left out, an unknown
  value, or a lighter security-reviewer or data-reviewer: per-task; no cadence line: every task
  guarded); a security-reviewer or data-reviewer is per-task always, an invalid trigger matches
  every file, and a cadence keeping `reviewer` per-task makes every task guarded; a missing or
  wrong one goes back.
- Every EARS line of the spec maps to at least one task's test.
- Risky tasks dry-run as the architect's Dry-run policy says, with gate counts recorded; a plan
  of one task gets no dry run, its TDD steps plant the mutations instead.
- The plan lists the ledger lessons it applied.
- The Summary holds the estimate line. Past 1.5× of the spec's (minutes or tokens): a Heads-up
  and a decision card (go on / revise the plan), with your recommendation; no numeric estimate
  in the spec: no comparison, no card.
One round of corrections with the architect if a check fails.

## 3. Continue
Do not present the plan. Go straight to `/gtm:deliver`, unless the plan deviates from the spec (a
Heads-up and a decision card), its task count passes the cap (§2's split / accept card), its
estimate passes 1.5× of the spec's (§2), or the human asked to see it (`/gtm:brief-me`).
