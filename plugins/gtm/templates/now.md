# Run view (NOW.md)

> The shape of `<root>/NOW.md`, the one-page view of where a run stands. Who writes it and when:
> the `gtm` skill §0. The facts come from `scripts/now-facts.mjs` (JSON); this page only renders
> them. The view is not a record: the logbook and the progress files are; it is rebuilt from them.

## Rendering rules
- Written whole, never appended to. In `language.human`, labels included. At most 30 lines of
  at most 100 columns; no table, no code fence.
- Only the JSON's fields reach the page: statuses, counts, times, durations, names. Never a
  finding, a commit message, a prompt or a hand-back. A `?` from the script stays `?`.
- Line 1: `# <slug> · <HH:MM of updated>`. Rebuilt by `/gtm:status`: add ` · rebuilt`.
- First `>` line, the breadcrumb: `<epic> › <branch> › <phase> › task <n>/<N> · <clock>`. Leave
  out the epic when it is null, the task outside delivery, the clock when `eta.clock` is null.
- What runs: one `- <kind> <name> since <HH:MM> (<ageMin> min)` line per `running` item; when
  `mayHaveStopped`, add `, may have stopped: last change <lastChangeMin> min ago`. Under it, the
  line `  <since> · <worktree>`: the item's `since` as given (full date and time) and the worktree
  passed in its `--running` (none: leave out ` · <worktree>`), so `/gtm:status` can pass it back.
  Then one `- worktree <name> (<branch>)` line per worktree. An empty `running` reads "nothing";
  a rebuild by `/gtm:status` reads "what runs: unknown", the worktree lines still listed.
- What waits: "nothing", or `<kind> · task <task> · <question>`, the question cut at 80
  characters, written by the writer in its own words (never pasted text).
- ETA: `<minutes> min, ends about <clock> (median of <runs> runs)`. `eta.none`: "no measured run
  yet". `afterAnswer`: `<minutes> min after your answer`, no clock. `tasks` null: "after the plan".
- Events: the `events` list as given, newest first, at most three.
- Other branches: one line each, `- <branch> › <phase> › task <task> · updated <HH:MM>`.

## Example

```markdown
# where-am-i · 10:00

> GTM proportional assurance › feat/where-am-i › delivery › task 3/5 · 10:37

## What runs
- task t3 since 09:50 (10 min)
  2026-10-15T07:50:00.000Z · GentleTeaM-wt-where-am-i-t3
- worktree GentleTeaM-wt-where-am-i-t3 (feat/where-am-i-t3)

## What waits on you
nothing

## Next
- step: task 3
- after this branch: L, usage-aware

## ETA
36.5 min, ends about 10:37 (median of 2 runs)

## Last events
- t2: clean
- t1: clean
- plan: approved

## Other branches
- feat/clean-stop › spec · updated 09:12
```
