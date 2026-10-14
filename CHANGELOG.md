# Changelog

All notable changes to GTM. Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/);
versions follow [SemVer](https://semver.org/).

## [Unreleased]

## [0.7.0] - 2026-10-14

### Added
- A documentation site at https://morgankryze.github.io/GentleTeaM/, built with docmd and
  deployed from main: five paths (Start here, Tutorial, Guides, Reference, Why) and five diagrams.
- Risk tiers: a task the plan marks standard runs the implementer and the gate, then waits for
  a deferred review: the reviewer once per wave, ux-qa once per branch, one fix round each. A
  guarded task keeps today's loop. The tier is read on git's diff of the task and only rises:
  security or data ground makes a task guarded, and those two reviewers stay per task.
- Migration: nothing to migrate; a profile without `review cadence` keeps today's loop. To opt
  in, add the `review cadence` and `fix rounds per standard review` Gates lines from the team
  template.

### Changed
- The README is reduced to what GTM is, install, cost and the link to the site; the old docs
  pages moved into the site.

## [0.6.0] - 2026-10-13

### Added
- Measured runs: each phase of a delivery (design, spec, plan, each task, final review, fix
  waves) records the wall time, tokens and agents Claude Code reports, and the branch's `run`
  line ends with their totals per phase and each role's share of the tokens. A value Claude Code
  did not report reads `?`, never an estimate.
- `plugins/gtm/scripts/role-split.mjs` reads the agent files beside a workflow run's journal and
  prints each role's agents, agent-seconds and share of tokens: role names and numbers only,
  regular files only. A link, a missing file or an unknown shape prints `roles ?`, the totals
  kept.
- Budgets: `budget per task` and `budget per branch` in the team profile's Gates. Past 1.5× of
  one, a Heads-up names the task or phase, the measure and the largest role, and the delivery
  goes on; no budget changes a verdict, a fix round or the order of tasks.
- Estimates: the spec and the plan show tasks × the measured per-task median plus each other
  phase's median, over the last five measured runs; `/gtm:plan` raises a Heads-up when the
  plan's passes 1.5× the spec's. `/gtm:tune` reads the measures: a role at 40% of the tokens in
  two runs, a budget passed twice, no budget after three measured runs.

No change is needed to an existing GTM folder: a team profile without budget lines reads as
`none` and raises no Heads-up, and `run` lines written before this release, with no `measured`
part, are left out of the estimates and of `/gtm:tune`'s three new signals; its other signals
read them as before.

## [0.5.1] - 2026-10-13

### Fixed
- `/gtm:deliver`: the card for a missing review re-runs that role alone on the task's range, with
  its open findings. An escalated Fix's open findings may hold a reviewer that gave no review;
  its spec names that review as owed. Every `git diff --name-only` it runs sets
  `core.quotePath=false`, so a non-ASCII path still matches an anchored trigger.
- Parallel waves: a branch name off `^[A-Za-z0-9._/-]+$` is in the list of stops. A worktree is
  removed only when the check of its GTM folder exits 0 and lists nothing; a check that fails
  keeps it, where an absolute GTM root used to exit 128 with no output and read as empty. A task
  resumed after an open or blocked stop reruns in its worktree and merges with the same checks,
  then the wave goes on.
- `/gtm:gtm`: a Fix that ends open or blocked stops on a decision card, as `/gtm:deliver` does;
  it had no reading for either. A clean Fix writes a `run` line, the record `/gtm:ship` reads.
- `/gtm:ship` takes a skipped final review, or a clean Fix, only from the last `run` line a
  delivery wrote for the slug, no longer from the delivery report in chat. `/gtm:spec` gives
  the architect an escalated Fix's open findings.
- The analyst creates no report file when it is given none. The UX and accessibility QA writes
  only under the GTM folder, never the implementer's report.
- The workflow test wants exactly one log line per expected entry, counts a skill's argument only
  in key position, expects fix round 1 at `medium` when the implementer's effort is empty, and
  names a skill that runs a missing workflow in one line instead of a stack trace.

## [0.5.0] - 2026-10-13

### Added
- Parallel waves: two or more consecutive parallel-safe tasks run at once, each in its own
  worktree outside the repository and on its own branch, named in every prompt it gets. The
  clean ones merge with merge commits in plan order, then the gate runs once. A moved branch or
  head, an overlap of files, a conflict, a red gate or files left in a worktree's GTM folder stops
  the merges and undoes nothing, that worktree kept; a task left open or blocked lets its clean
  siblings merge but starts no later task.
- Per-screen design: with several screens, each gets its own designer and critic and its own
  rounds, redrawn alone until it passes; the boards come back in one table for one approval,
  and the run passes when every screen passed. One screen runs as before.

## [0.4.0] - 2026-10-13

### Changed
- A branch of one task that ends clean at 0 fix rounds skips the final review: the `run` line
  says so, `/gtm:ship` takes the skip in place of a ready verdict, and the branch's minors wait
  for `/gtm:retro`. A release-only task does not count; a fix round in any task, a commit outside
  the tasks' ranges or a specialist a task's diff triggers but who did not review it bring the
  final review back.
- The final review replays two of the planted mutations, those nearest a pinned threshold, not
  all of them; one that survives is a must-fix. A one-task plan is not replayed: its TDD steps
  plant the mutations instead.
- The re-review after the final review's fix wave runs one effort level below the final
  reviewer's profile when the fix range touches no specialist's ground.

### Fixed
- The final review's fix wave raises the implementer's effort as a fix round does: one level
  above its profile, at most `xhigh`, an effort off that ladder such as `max` kept. "One level
  above" read as `max` from `xhigh`.

## [0.3.2] - 2026-10-13

### Fixed

- A re-review returns each finding it was sent with a status. One marked `addressed` no longer
  blocks the task nor counts in that reviewer's findings or the minors; one without a status
  stays open. A status on a first review or a specialist's callback is ignored, and a `fix`
  verdict with nothing left open still blocks. Re-reviews used to answer ADDRESSED in free
  text the result could not hold, so every re-listed finding blocked again.
- Every task review request says that a defect the task's diff did not introduce is minor,
  its summary saying so, unless it is critical, a security hole or a data-integrity defect, so
  a task no longer blocks on what a later task fixes. A re-review reads it against the task's
  whole range, and each finding it was sent keeps its severity until it is addressed. The
  reviewer, security-reviewer and data-reviewer point at that rule, and a Fix that ends clean
  appends its minors to the ledger as a plan task does.

## [0.3.1] - 2026-10-13

### Changed
- README: banner, badges; issue and pull request templates; more plugin keywords.
- README: says what GTM costs in agent time, measured on its own branches; how specialist
  triggers can miss a file; stealth mode as keeping working files out, not hiding AI use.
- Docs: the method, glossary and install page say where the Fix ceiling is set (the team
  profile's Gates, changed with `/gtm:tune`) and what happens past it (the Fix continues as a
  Feature from the spec, its commits kept).

### Fixed
- A Fix now escalates at the team profile's Fix ceiling, not always past 3 files: the workflow
  arguments `/gtm:deliver` builds, which a Fix reuses, carry `fixCeiling`. The workflow test checks
  that each skill passes every argument its workflow reads.
- Install: the pinned-ref example names a real tag, `#v0.3.0`; `v0.1.0` is a branch, not a tag.
- The read-only roles (reviewer, security-reviewer, data-reviewer, final-reviewer, design-critic,
  ux-qa) end on the structured verdict a workflow asks for: a report goes only to a report file
  they are given, else into the verdict's summary, and they never create one. The design critic
  works within about 30 tool calls. Its verdict was lost in 3 passes out of 5.
- A critic or reviewer that loses its verdict is retried once when it throws, on a 25-call
  budget, with the same diff, findings, model and effort; a second throw keeps the old fallback
  (the design loop stops not passed, the task records `<role> returned no review`). A blocked or
  skipped role returns nothing and is not re-dispatched: it goes straight to that fallback. That
  finding starts no fix round and keeps the task `OPEN`; the role no longer re-reviews a later fix
  diff in place of the task's own, which could end a task `CLEAN` with no review of its own diff
  from that role. An implementer or fix round that throws is `BLOCKED`, as one that returns nothing.
- A review with a `fix` verdict and no critical or important finding is no longer an approval: it
  counts as an important finding carrying the reviewer's summary, gets a fix round and a
  re-review. A role that gives no re-review keeps the findings its fix round got open, not only
  `<role> returned no review`. `/gtm:deliver` stops on that `OPEN` too and offers to re-run the
  missing review.

## [0.3.0] - 2026-10-12

### Added
- Workflow test (`scripts/workflows.test.mjs`, no dependencies): runs deliver-task and
  design-loop against scripted agents and checks what they return and whom they dispatch,
  with which model and effort: fix rounds, the Fix ceiling, the specialists a Fix keeps on
  security and data ground, the design bar and rounds. `scripts/validate.mjs` runs it.

### Changed
- Install docs: in the VS Code extension, reload the window to see new or updated skills in the
  command menu; `/reload-plugins` alone does not refresh it.
- A Fix on security or data ground no longer escalates to a Feature: the specialist for that
  ground joins the reviewer, and only a Fix past the Fix ceiling escalates. A schema, migration or
  auth change is still a Feature from the track pick (position 9, docs/positions.md).
- A small Feature (no screen, schema, migration or auth change, at most twice the Fix ceiling in
  estimated files) gets its spec and plan from one architect pass; the plan step keeps that plan
  unless a card is answered otherwise or the spec changes. The track pick says small or not, with
  the file count.
- Fix rounds go back to every specialist whose ground the fix touches, on every track, even after
  its approval. A Fix that grows past the ceiling in a fix round escalates and carries its open
  findings to the Feature flow.

### Fixed
- Fix rounds keep the implementer at `max`, or any effort outside `low` to `xhigh`, instead of
  dropping it to `medium` on the first round; `low` to `xhigh` still rise one level per round.

## [0.2.0] - 2026-10-12

### Added
- Stealth mode (`stealth: on|off` in `.gtm/config.yml`, chosen at `/gtm:init`, switched with
  `/gtm:tune`): GTM's files stay out of the tracked tree, nothing it writes into the project names
  it, no attribution trailers, branches follow the project's pattern.
- Project voice guideline (`guidelines/voice.md`) in every project, mandatory with stealth on:
  text written into the project follows its own history and docs, in plain writing. The
  implementer, ship and retro read it.
- Footprint check (`plugins/gtm/scripts/footprint-check.mjs`, no dependencies): scans the branch
  name, commit messages, PR text, added lines and new file names for GTM's vocabulary, excluded
  paths, attribution and writing tells; `/gtm:ship` runs it with stealth on and stops on a hit.
  Patterns are configurable under `footprint` in the config; `scripts/validate.mjs` runs its
  fixture test.
- Docs: a Stealth mode section in the method, position 15 ("GTM serves the project, it does not
  sign it"), glossary entries, a README line.

### Fixed
- Decision cards render as plain Markdown (a bold question, an options table, one line with the
  recommendation and the cost if wrong) with labels in the human's language, instead of a code
  block with English labels. The briefing format keeps prose, cards and tables out of code fences
  and lines within an 80-100 column terminal.

## [0.1.1] - 2026-10-12

### Changed
- Init recommends GTM's conventions (merge commits, never rewrite pushed history) unless the
  repository's history clearly shows another established practice; it then cites the evidence and
  still states GTM's default and why.
- Init runs only fast verify commands (lint, typecheck or a smoke test) within 90 seconds and marks
  the rest `[CHECK]`; the first `/gtm:deliver` run confirms them. The draft takes about 1-2 minutes.

### Fixed
- Docs name the entry point `/gtm:gtm`; bare `/gtm` may resolve when unambiguous.

## [0.1.0] - 2026-10-12

### Added
- Marketplace `gentleteam` and plugin `gtm`.
- Three tracks (Fix, Feature, Milestone) with automatic, one-way escalation from Fix to Feature.
- Eleven role agents: analyst, designer, design-critic, architect, implementer, reviewer,
  security-reviewer, data-reviewer, ux-qa, final-reviewer, release-qa.
- Workflows `design-loop` and `deliver-task`, taking the project's team profile per dispatch.
- Skills `/gtm`, `init`, `design`, `spec`, `plan`, `deliver`, `ship`, `retro`, `tune`, `brief-me`.
- Templates for the brief, config, team profile, conventions and eleven guideline files, backlog,
  spec, plan, ledger, and the human briefing format.
- Docs: manifesto, positions, principles, method, roles, glossary, install, companions,
  contributing; CI validation of manifests, frontmatter and workflow syntax.
