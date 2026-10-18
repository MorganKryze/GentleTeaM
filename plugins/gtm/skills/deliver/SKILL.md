---
name: deliver
description: Deliver an approved GTM plan - runs the deliver-task workflow over each task in order (implementer, reviewer, triggered specialists, correction rounds), keeps the ledger, runs the final review with one fix wave, and reports with the rulings taken. Use after /gtm:plan.
argument-hint: "[plan path or slug]"
---
# Deliver (ends at checkpoint 3: the go)

Ground rules: as in the `gtm` skill §0.

## 1. Prepare
- Branch: from `git.base` as `git.branch` says (the orchestrator does this once; agents never switch
  branches); note the base commit. A range's files: `git -c core.quotePath=false diff --name-only
  --no-renames "<a>..<b>"` (one path a line, `"…"` C-quoted), never the planned or reported one.
- From `team.md`: `team` = `{ role: {model, effort} }` per role; `triggers`, the `on` specialists
  with their regexes; `fixRounds`; `fixCeiling`, the N of `Fix track ceiling: N files`; the budgets,
  Gates lines `budget per task` and `budget per branch` (`<minutes> min, <tokens>k tokens`; absent
  or `none`: none); `cadence`, `review cadence` (absent: none); `standardRounds`, `fix rounds per
  standard review: N` (1). A ledger `ruling` `limits: lighter …` for this slug
  overrides the roles it names in `team`, on every dispatch (resumes too), unless struck through or
  beyond what `gtm` §0's card A allows (then ignored, a Heads-up).
- Progress: `<root>/reports/<slug>/progress.md`, one line per run, any result (reruns append):
  status, tier, correction rounds, reviewers, `<base>..<head>`, a wave's merge commit. Each run's
  line (design, spec, plan, task, final review, re-review, re-run review, fix wave) ends `· <s> s ·
  <t>k · <a> agents` from Claude Code's `duration_ms`, `subagent_tokens`, `agent_count` (a dispatch
  is 1 agent), `?` if unreported, never an estimate; workflows add `· run <id>`.
- `[CHECK]` verify commands in `config.yml`: run each once on the branch with `verify.prefix`; it
  runs → remove the mark; it cannot run or fails on the untouched base → stop before any task: a
  Heads-up and a card (correct the command / drop it / accept the failure as pre-existing, logged).
- Resume (progress lines exist): skip tasks last `CLEAN` or `GATED`; rerun each `PAUSED` one whole,
  `base` its line's, never its head (unlike §3 step 3), in its worktree if any, a wave's as one
  wave; then §3 step 2 merges each wave with an unmerged task, `PAUSED` or not; a `PAUSED` final
  review or fix wave reruns whole from its base; the handoff's "what waited" card shows again.
  If `git -c core.quotePath=false -C "<wt>" status --porcelain --ignored -unormal` fails or lists
  anything: stop the loop after the wave's merges, that task is not rerun, GTM keeps it all (no
  delete, clean, stash, checkout, `git worktree remove`); Heads-up, card (recheck, rerun / by hand).

## 2. Each task, in plan order
1. Write `<root>/reports/<slug>/task-<n>-brief.md`: the task verbatim,
   the global constraints it names, by number (none named: all the plan's), and paths to the plan,
   the spec, `<root>/team.md`, the validated mockup and the guidelines it touches; nothing else.
2. Run the workflow `gtm:deliver-task` with args `{ brief, report: "<root>/reports/<slug>/task-<n>.md",
   branch, base: <head before this task>, worktree (in a wave only), mockup, triggers, team,
   fixRounds, fixCeiling, track, tier, cadence, standardRounds, review, head, files }`, an arg not
   given omitted, never "none": `tier` the plan's, `guarded` once a progress line of it says so
   (resumes too); `review`, `head`, `files`: step 5 only.
3. Measure it, any result: its run id (`wf_...` in the diagnostics) on `^wf_[0-9a-f-]+$`, the one
   folder `"<config>"/projects/*/*/subagents/workflows/<id>` (`<config>` =
   `${CLAUDE_CONFIG_DIR:-$HOME/.claude}`), `node "${CLAUDE_PLUGIN_ROOT}/scripts/role-split.mjs"
   --json "<folder>"`, first role the largest; no match, no folder or several, or a non-zero exit:
   `roles ?`, totals kept. No budget or measure changes a verdict, a correction round, a dispatch, a
   skip or the order of tasks; past 1.5× a budget (a task's minutes or tokens; the branch's total so
   far): one Heads-up per crossing (task or phase, measure, budget, largest role),
   a ledger `usage` line `over budget: <the same>` unless that slug and crossing has one; go on.
4. Read the result:
   - `CLEAN`: append each minor to the ledger (`minor`), one progress line, go on.
   - `OPEN` (correction rounds exhausted, or a reviewer gave no review) or `BLOCKED`: its progress
     line, then stop the loop. A Heads-up and one decision card (re-run the missing review: that
     role alone on `<base>..<head>` with its open findings, its line written and measured as step 3
     says / revise the plan / accept with the open findings logged / take over by hand), with your
     recommendation; resume from this task after the answer.
   - `ESCALATE` (Fix only): append each minor to the ledger (`minor`), then continue as a Feature
     from `/gtm:spec`; the spec states each `open` finding (from a correction round that grew the
     Fix past the ceiling, not re-reviewed) as a requirement with its test, and each `<role>
     returned no review` as a review owed, so the final review checks them.
5. Tiers (`review cadence` set; not a Fix), on each task's files (§1) once it returns: a per-task
   specialist's trigger on a standard task → Heads-up, `review: "range"` on its range, guarded from
   then on; a triggered specialist missing from a guarded task's `reviewers` reviews it alone.
   `GATED`: `verify.gate` on its head, red → `BLOCKED` (step 4's card); a clean deferred review with
   the `reviewer` over its range appends its own line. A wave (a §3 wave, or consecutive standard
   tasks up to a guarded task or the plan's last) gets `review: "range"` on its range after its
   merges; before §4, `review: "branch"` fork point to `HEAD`; each with `files` from git. `OPEN`,
   `BLOCKED`, no review → step 4's card, minors to the ledger (a re-run appends none twice). A
   resume runs each owed review before §4. A Heads-up per `Cadence` log.

## 3. Parallel waves (two or more consecutive `[P]` tasks; a lone one runs as in §2)
1. Record the checked-out branch and its head `<base>`. Per task, `git worktree add -b
   "<branch>-t<n>" "<wt>" <base>`, `<wt>` = `<repo's parent>/<repo name>-wt-<slug>-t<n>` (an
   existing path or branch stops the wave), absolute `<root>` paths in brief and args. Run their
   workflows at once (§2's args plus `branch: <branch>-t<n>`, `base: <base>`, `worktree: <wt>`), let
   all return, write each one's progress line (no wave total) and measure each (§2 step 3).
2. Before each merge, branch/head are as last recorded, the tip of `<branch>-t<n>` is the head on
   its last progress line, and tasks' files (§1) of `<base>..<branch>-t<n>` disjoint. Merge each
   `CLEAN` or `GATED` branch not yet an ancestor of `HEAD`, in plan order (`git merge --no-ff
   --no-edit "<branch>-t<n>"`), record the head, gate once. Per merged task, only when `<root>` is
   out of the repo, or `git -C "<wt>" status --porcelain --ignored -unormal -- "<root>"` (repo path)
   exits 0 and lists nothing: `git worktree remove "<wt>"`, `git branch -d "<branch>-t<n>"`.
3. A branch name off `^[A-Za-z0-9._/-]+$` (before step 1), a moved branch/head, overlap, conflict,
   red gate, a failed check or files in a worktree's `<root>`: merge no more, keep it and unmerged
   worktrees, undo nothing without the human. `OPEN`/`BLOCKED`: `CLEAN` or `GATED` siblings merge,
   no later task starts. Heads-up, §2's card. On resume, that task reruns in its worktree, base its
   head (overlap: the wave's `<base>`), and merges as step 2 says, checks included; the rest go on.

## 4. Final review (at most once per branch)
Skip it only when all hold; then leave this slug's minors for `/gtm:retro`, dispatch no reviewer, no
`resolved` line, `final review skipped: one task, clean at 0 fix rounds` in run line and report:
- the plan has one task (a release-only one aside: its files the version and CHANGELOG alone);
- every task, the release one included, returned `CLEAN` at 0 correction rounds (`GATED`: below);
- the tasks' ranges chain from the branch's fork point to `HEAD`: first base `git merge-base
  <git.base> HEAD`, each next base the previous task's head, `HEAD` the last task's head (no hand
  commit or escalated Fix's commit outside a task); a wave is one link: its tasks share its base,
  the next base is the head after its merges, which stay in range;
- in every task, each specialist whose trigger matches its files (§1) is in its `reviewers`;
- a standard task counts if a clean `review: "range"` with `reviewer` covers it and deferred reviews
  span fork point to `HEAD`, each clean at 0 rounds, none owed; else the final review (of
  merge-base..`HEAD`) reads in full what no task review saw: standard ranges, commits in no task or
  wave.

Otherwise dispatch `gtm:final-reviewer` with the spec, the plan, the branch range, the ledger and
the report path `<root>/reports/<slug>/final.md`. `fix-first` → one fix wave: `gtm:implementer` with
the must-fix list at a correction round's effort (one level above its profile, at most `xhigh`; an
effort off that ladder, such as `max`, kept), then `gtm:final-reviewer` once more on the fix range
only, one level below its profile (`low` at least, `max` kept) when that range's files (§1) match no
specialist trigger. Still not ready → a Heads-up and a card. `resolved` lines for the minors fixed,
the rest kept. Each dispatch: its progress line, budget as §2 step 3, roles via `--also`.

## 5. Record and report
- Ledger: one `run` line as `${CLAUDE_PLUGIN_ROOT}/templates/ledger.md` says (the plugin's template,
  never the project's copy), from every progress line; then each ruling taken.
- Report: TL;DR (ready or not; tasks clean, gate result, final verdict), one table (task, result,
  reviewers, cost) with a total row, a screen designed in code: ux-qa's capture paths at
  `design.widths`, for the human to approve with the go; deferred minors count, each budget Heads-up
  again, a Heads-up if anything deviated, **Rulings I made** (each with its cost if wrong), Next
  steps with `you` · give the go (`/gtm:ship`).
