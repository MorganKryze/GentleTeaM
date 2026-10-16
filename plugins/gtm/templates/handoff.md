# Handoff (reports/<slug>/handoff.md)

> Written whole by `/gtm:pause` at each pause, after reading the one already there, in English;
> read by the human and by the resume it names. Only statuses, counts, names, times and paths
> reach it: no secret, no finding, no commit message, no prompt, no hand-back. A name off
> `^[A-Za-z0-9._/-]+$` reads `?`.

## State
- slug: `<slug>` · branch: `<branch>` · paused at: `<ISO>`
- phase: `<phase NOW.md showed>` · task `<n>/<N>` (delivery only)

## Stopped
One line per item stopped: `- <kind> <name> · since <ISO> · worktree <name or none>`; an item
that had already returned reads `returned` instead of being stopped. None: "nothing".

## What waited
The card open at the pause, shown again on resume: `<kind> · task <task>`, or "nothing".

## Half-written files
- each spec or plan renamed `<name>.partial` (never deleted; a `.partial` already there stays
  and is listed), and each `.partial` an earlier pause listed that still exists; each report
  changed during a stopped run, listed and left in place. A resume never reads a `.partial` or a
  stopped run's report.

## Earlier pauses
One line per pause before this one, carried forward: `- paused at <ISO> · <phase> · <n> stopped
· waited <kind or nothing>`. None: "none".

## Worktrees and run branches
One line each: `- <worktree> (<branch>) · <changes> uncommitted · merged | not merged`.

## Resume
- command: `<resume>` (from `now-facts.mjs`; `?` when it cannot be built)
- pushed: nothing
