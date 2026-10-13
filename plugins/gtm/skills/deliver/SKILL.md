---
name: deliver
description: Deliver an approved GTM plan - runs the deliver-task workflow over each task in order (implementer, reviewer, triggered specialists, fix rounds), keeps the ledger, runs the final review with one fix wave, and reports with the rulings taken. Use after /gtm:plan.
argument-hint: "[plan path or slug]"
---
# Deliver (ends at touchpoint 3: the go)

Ground rules: as in the `gtm` skill §0.

## 1. Prepare
- Branch: create it from `git.base` as `git.branch` says (the orchestrator does this once; agents
  never switch branches). Note the base commit. A name off `^[A-Za-z0-9._/-]+$` stops a wave (§3).
- From `team.md`: `team` = `{ role: {model, effort} }` for every role; `triggers` = the specialists
  that are `on`, with their regexes; `fixRounds`; `fixCeiling`, the N of the Gates line
  `Fix track ceiling: N files`; the budgets, Gates lines `budget per task` and `budget per
  branch` (`<minutes> min, <tokens>k tokens`; absent or `none`: no budget).
- Progress file: `<root>/reports/<slug>/progress.md`, one line per task run, any result (reruns
  append): status, fix rounds, reviewers, `<base>..<head>`, a wave's merge commit. Each line
  (design, spec, plan, task run, final review, re-review, re-run review, fix wave) ends `· <s> s ·
  <t>k · <a> agents`: the `duration_ms`, `subagent_tokens` and `agent_count` Claude Code gives per
  run (a dispatch is 1 agent), `?` if unreported, never an estimate; workflows add `· run <id>`.
- Verify commands still marked `[CHECK]` in `config.yml` (not run at init): run each once on the
  branch, with `verify.prefix`. It runs → remove the mark. It cannot run (missing tool, wrong
  command) or fails on the untouched base → stop with a Heads-up and one decision card (correct the
  command / drop it / accept the failure as pre-existing, logged) before the first task.

## 2. Each task, in plan order
1. Write `<root>/reports/<slug>/task-<n>-brief.md`: the task verbatim, the plan's global
   constraints, the spec path, the validated board, the guidelines it touches.
2. Run the workflow `gtm:deliver-task` with args `{ brief, report:
   "<root>/reports/<slug>/task-<n>.md", branch, base: <head before this task>, worktree (in a wave
   only, else omitted, never "none"), mockup, triggers, team, fixRounds, fixCeiling, track }`.
3. Measure it, whatever its result: the run id (`wf_...` in the result's diagnostics) on
   `^wf_[0-9a-f-]+$`, the one folder `<config>/projects/*/*/subagents/workflows/<id>` (`<config>`
   = `${CLAUDE_CONFIG_DIR:-$HOME/.claude}`), `node "${CLAUDE_PLUGIN_ROOT}/scripts/role-split.mjs"
   --json "<folder>"`, its first role the largest. An id off that pattern, no folder or several,
   or a non-zero exit: `roles ?`, the totals kept. Past 1.5× of the per-task budget (minutes or
   tokens), or the branch's total so far past 1.5× of the per-branch one: one Heads-up per
   crossing (task or phase, measure, budget, largest role), a ledger `usage` line `over budget:
   <the same>`, and go on. No budget or measure changes a verdict, a fix round, a dispatch, a
   skip or the order of tasks.
4. Read the result:
   - `CLEAN`: append each minor to the ledger (`minor`), one progress line (as §1 says), go on.
   - `OPEN` (fix rounds exhausted, or a reviewer gave no review) or `BLOCKED`: its progress line
     (as §1 says), then stop the loop. A Heads-up and one decision card (re-run the missing
     review: that role alone on the task's `<base>..<head>` with its open findings, its line
     written and measured as step 3 says / revise the plan / accept with the open findings logged
     / take over by hand), with your recommendation. Resume from this task after the answer.
   - `ESCALATE` (Fix only): append each minor to the ledger (`minor`), then continue as a Feature
     from `/gtm:spec`. Its `open` findings went to a fix round that grew the Fix past the ceiling
     and were not re-reviewed; `open` may also hold `<role> returned no review`. The spec states
     each as a requirement with its test, a missing review as owed, so the final review checks it.

## 3. Parallel waves (two or more consecutive `[P]` tasks; a lone one runs as in §2)
1. Record the checked-out branch and its head `<base>`. Per task, `git worktree add -b
   "<branch>-t<n>" "<wt>" <base>`, `<wt>` = `<repo's parent>/<repo name>-wt-<slug>-t<n>` (an
   existing path or branch stops the wave), absolute `<root>` paths in brief and args. Run them at
   once, §2's args plus `branch: <branch>-t<n>`, `base: <base>`, `worktree: <wt>`; let all return;
   write each one's progress line, measure each as §2 step 3 says.
2. Before each merge, branch/head are as last recorded and tasks' `git -c core.quotePath=false diff
   --name-only --no-renames "<base>..<branch>-t<n>"` lists disjoint. Merge each `CLEAN` branch in
   plan order (`git merge --no-ff --no-edit "<branch>-t<n>"`), record the head, gate once. Per
   merged task, only when `<root>` is out of the repo, or `git -C "<wt>" status --porcelain
   --ignored -unormal -- "<root>"` (repo path) exits 0 and lists nothing: `git worktree remove
   "<wt>"`, `git branch -d "<branch>-t<n>"`. A check that fails keeps the worktree.
3. A branch name off `^[A-Za-z0-9._/-]+$` (before step 1), a moved branch/head, overlap, conflict,
   red gate, a failed check or files in a worktree's `<root>`: merge no more, keep it and unmerged
   worktrees, undo nothing without the human. `OPEN`/`BLOCKED`: `CLEAN` siblings merge, no later
   task starts. Heads-up, §2's card. On resume, that task reruns in its worktree, base its head,
   and merges as step 2 says, checks included; the rest go on.

## 4. Final review (once per branch)
Skip it only when all of these hold:
- the plan has one task (one that only bumps the version and renames the CHANGELOG section, its
  `git -c core.quotePath=false diff --name-only --no-renames` listing those two files alone,
  does not count);
- every task, the release one included, returned `CLEAN` at 0 fix rounds;
- the tasks' ranges chain from the branch's fork point to `HEAD`: the first base is `git merge-base
  <git.base> HEAD`, each next base is the previous task's head, `HEAD` is the last task's head (no
  hand commit or escalated Fix's commit outside a task); a wave is one link: its tasks share its
  base, the next base is the head after its merges, which stay in range;
- in every task, each specialist whose trigger matches `git -c core.quotePath=false diff
  --name-only --no-renames <task base>..<task head>` (a rename lists both paths) is in that
  task's `reviewers` (the workflow picks them from the files the implementer reports).

Then dispatch no reviewer, write `final review skipped: one task, clean at 0 fix rounds` in the
`run` line and the report, leave this slug's minors for `/gtm:retro` and write no `resolved` line.

Otherwise dispatch `gtm:final-reviewer` with the spec, the plan, the branch range, the ledger and
the report path `<root>/reports/<slug>/final.md`. `fix-first` → one fix wave: dispatch
`gtm:implementer` with the must-fix list at a fix round's effort (one level above its profile, at
most `xhigh`; an effort off that ladder, such as `max`, kept), then `gtm:final-reviewer` once more
on the fix range only, one level below its profile effort when that range's `git -c
core.quotePath=false diff --name-only --no-renames` matches no specialist trigger (`low` at least,
`max` kept). Still not ready → a Heads-up and a decision card. Write `resolved` lines for minors
fixed, keep the others. Each dispatch writes its progress line and is measured as §2 step 3 says.

## 5. Record and report
- Ledger: one `run` line (`tasks N · fix rounds per task · findings per reviewer (critical /
  important / minor) · design rounds and score`), ending with `measured <W>m <T>k <A>a: <phase>
  <w>m <t>k <a>a, ...; roles <role> <p>%, ...` from every progress line (a task's runs summed):
  phases design, spec, plan, tasks, final (with its re-reviews), fix (fix waves), in that order, a
  phase not run omitted; minutes to one decimal, tokens in thousands; `<W>` the phases' sum, a wave
  its longest task; a sum holding a `?` is `?`. `roles`: roles at 5% or more, `role-split.mjs` over
  the branch's run folders plus `--also <role>:<s>:<tokens>` per dispatch (architect,
  final-reviewer, implementer, re-run review); any `?` → `roles ?`. Then each ruling taken.
- Report to the human, per the briefing format: TL;DR (ready or not, the measure: tasks clean,
  gate result, final verdict), one table (task, result, reviewers, cost) with a total row,
  deferred minors count, each budget Heads-up again, a Heads-up if anything deviated, **Rulings
  I made** (each with its cost if wrong), and Next steps with `you` · give the go (`/gtm:ship`).
