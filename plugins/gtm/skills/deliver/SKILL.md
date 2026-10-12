---
name: deliver
description: Deliver an approved GTM plan - runs the deliver-task workflow over each task in order (implementer, reviewer, triggered specialists, fix rounds), keeps the ledger, runs the final review with one fix wave, and reports with the rulings taken. Use after /gtm:plan.
argument-hint: "[plan path or slug]"
---
# Deliver (ends at touchpoint 3: the go)

Ground rules: as in the `gtm` skill §0.

## 1. Prepare
- Branch: create it from `git.base` as `git.branch` says (the orchestrator does this once; agents
  never switch branches). Note the base commit.
- From `team.md`: `team` = `{ role: {model, effort} }` for every role; `triggers` = the specialists
  that are `on`, with their regexes; `fixRounds`; the Fix ceiling.
- Progress file: `<root>/reports/<slug>/progress.md`, one line per task.

## 2. Each task, in plan order
1. Write `<root>/reports/<slug>/task-<n>-brief.md`: the task verbatim, the plan's global
   constraints, the spec path, the validated board, the guidelines it touches.
2. Run the workflow `gtm:deliver-task` with args `{ brief, report:
   "<root>/reports/<slug>/task-<n>.md", branch, base: <head before this task>, mockup, triggers,
   team, fixRounds, track }`.
3. Read the result:
   - `CLEAN`: append each minor to the ledger (`minor`), one progress line (status, fix rounds,
     reviewers), go on.
   - `OPEN` (fix rounds exhausted) or `BLOCKED`: stop the loop. Present a Heads-up and one decision
     card (revise the plan / accept with the open findings logged / take over by hand), with your
     recommendation. Resume from this task after the answer.
   - `ESCALATE` (Fix only): continue as a Feature from `/gtm:spec`.

## 3. Final review (once per branch)
Dispatch `gtm:final-reviewer` with the spec, the plan, the branch range, the ledger and the report
path `<root>/reports/<slug>/final.md`. `fix-first` → one fix wave: dispatch `gtm:implementer` with
the must-fix list (effort one level above its profile), then `gtm:final-reviewer` once more on the
fix range only. Still not ready → a Heads-up and a decision card. Write `resolved` lines for minors
fixed, keep the others.

## 4. Record and report
- Ledger: one `run` line (`tasks N · fix rounds per task · findings per reviewer (critical /
  important / minor) · design rounds and score`) and each ruling taken.
- Report to the human, per the briefing format: TL;DR (ready or not, the measure: tasks clean,
  gate result, final verdict), a table per task (status, fix rounds, reviewers), deferred minors
  count, a Heads-up if anything deviated, **Rulings I made** (each with its cost if wrong), and
  Next steps with `you` · give the go (`/gtm:ship`).
