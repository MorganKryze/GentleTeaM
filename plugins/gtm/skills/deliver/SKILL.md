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
  that are `on`, with their regexes; `fixRounds`; `fixCeiling`, the N of the Gates line
  `Fix track ceiling: N files`.
- Progress file: `<root>/reports/<slug>/progress.md`, one line per task.
- Verify commands still marked `[CHECK]` in `config.yml` (not run at init): run each once on the
  branch, with `verify.prefix`. It runs → remove the mark. It cannot run (missing tool, wrong
  command) or fails on the untouched base → stop with a Heads-up and one decision card (correct the
  command / drop it / accept the failure as pre-existing, logged) before the first task.

## 2. Each task, in plan order
1. Write `<root>/reports/<slug>/task-<n>-brief.md`: the task verbatim, the plan's global
   constraints, the spec path, the validated board, the guidelines it touches.
2. Run the workflow `gtm:deliver-task` with args `{ brief, report:
   "<root>/reports/<slug>/task-<n>.md", branch, base: <head before this task>, mockup, triggers,
   team, fixRounds, fixCeiling, track }`.
3. Read the result:
   - `CLEAN`: append each minor to the ledger (`minor`), one progress line (status, fix rounds,
     reviewers), go on.
   - `OPEN` (fix rounds exhausted, or a reviewer gave no review) or `BLOCKED`: stop the loop.
     Present a Heads-up and one decision card (re-run the missing review / revise the plan / accept
     with the open findings logged / take over by hand), with your recommendation. Resume from this
     task after the answer.
   - `ESCALATE` (Fix only): append each minor to the ledger (`minor`), then continue as a Feature
     from `/gtm:spec`. Its `open` findings went to a fix round that grew the Fix past the ceiling
     and were not re-reviewed: the spec states each as a requirement with its test, so the final
     review checks it.

## 3. Final review (once per branch)
Skip it only when all of these hold:
- the plan has one task (one that only bumps the version and renames the CHANGELOG section, its
  `git diff --name-only --no-renames` listing those two files alone, does not count);
- every task, the release one included, returned `CLEAN` at 0 fix rounds;
- the tasks' ranges chain from the branch's fork point to `HEAD`: the first base is `git merge-base
  <git.base> HEAD`, each next base is the previous task's head, `HEAD` is the last task's head (no
  hand commit or escalated Fix's commit outside a task);
- in every task, each specialist whose trigger matches
  `git diff --name-only --no-renames <task base>..<task head>` (a rename lists both paths) is in
  that task's `reviewers` (the workflow picks them from the files the implementer reports).

Then dispatch no reviewer, write `final review skipped: one task, clean at 0 fix rounds` in the
`run` line and the report, leave this slug's minors for `/gtm:retro` and write no `resolved` line.

Otherwise dispatch `gtm:final-reviewer` with the spec, the plan, the branch range, the ledger and
the report path `<root>/reports/<slug>/final.md`. `fix-first` → one fix wave: dispatch
`gtm:implementer` with the must-fix list at a fix round's effort (one level above its profile, at
most `xhigh`; an effort off that ladder, such as `max`, kept), then `gtm:final-reviewer` once more
on the fix range only, one level below its profile effort when that range's
`git diff --name-only --no-renames` matches no specialist trigger (`low` at least, `max` kept).
Still not ready → a Heads-up and a decision card. Write `resolved` lines for minors fixed, keep
the others.

## 4. Record and report
- Ledger: one `run` line (`tasks N · fix rounds per task · findings per reviewer (critical /
  important / minor) · design rounds and score`) and each ruling taken.
- Report to the human, per the briefing format: TL;DR (ready or not, the measure: tasks clean,
  gate result, final verdict), a table per task (status, fix rounds, reviewers), deferred minors
  count, a Heads-up if anything deviated, **Rulings I made** (each with its cost if wrong), and
  Next steps with `you` · give the go (`/gtm:ship`).
