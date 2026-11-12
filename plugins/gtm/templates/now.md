# Run view (NOW.md)

> The shape of `<root>/NOW.md`, the one-page view of where a run stands. Who writes it and when:
> the `gtm` skill §0. The facts come from `scripts/now-facts.mjs` (JSON); this page only renders
> them. The view is not a record: the logbook and the progress files are; it is rebuilt from them.

## Rendering rules
- Written whole, never appended to. In `language.human`, labels included. At most 30 lines of
  at most 100 columns; no table, no code fence.
- Only the JSON's fields reach the page: statuses, counts, times, durations, names. Never a
  finding, a commit message, a prompt or a hand-back. A `?` from the script stays `?`.
- Line 1: `# <slug> · <HH:MM of updated>`.
- First `>` line, the breadcrumb: `<epic> › <branch> › <phase> › task <n>/<N> · <clock>`. Leave
  out the epic when it is null, the task outside delivery, the clock when `eta.clock` is null.
- What runs: one `- <kind> <name> since <HH:MM> (<ageMin> min)` line per `running` item; when
  `mayHaveStopped`, add `, may have stopped: last change <lastChangeMin> min ago`. Under it, the
  line `  <since> · <worktree>`: the item's `since` as given (full date and time) and the worktree
  passed in its `--running` (none: leave out ` · <worktree>`), so `/gtm:status` can pass it back.
  Then one `- worktree <name> (<branch>)` line per worktree. An empty `running` reads "nothing".
- What waits: "nothing", or `<kind> · task <task> · <question>`, the question cut at 80
  characters, written by the writer in its own words (never pasted text).
- Next: `- step: <next>` and `- after this branch: <nextStory>`, each left out when null; both
  null: "nothing".
- ETA: `<minutes> min, ends about <clock> (median of <runs> runs)`. `eta.none`: "no measured run
  yet". `afterAnswer`: `<minutes> min after your answer`, no clock. `tasks` null: "after the plan".
- Paused (phase `paused`): breadcrumb `<epic> › <branch> › paused › task <n>/<N>`, no clock;
  what waits reads "resume with `<resume>`" and, under it, the `handoff` path.
- Events: the `events` list as given, newest first, at most three.
- Other branches: `- <branch> › <phase> › task <n>/<of> · updated <HH:MM>`: ` › task …` left out
  when `task` is null, `task ?` when it is `?`; ` · updated …` left out when `updated` is null.
- Rebuilt by `/gtm:status` (no `--running`, no `--waiting`): line 1 ends with ` · rebuilt`, in
  English whatever `language.human` (the `gtm` skill §0 reads it); what runs reads "what runs:
  unknown", the worktree lines still listed; what waits reads "what waits: unknown"; no clock in
  the breadcrumb or the ETA, since an answer may be pending.

## State and card file
- **State:** after each run view write, run the facts again with the same flags plus `--state
  '<root>/state.json'`, stdout dropped: the same view as versioned JSON for a program that follows
  the run; no skill or agent reads it back, the status line step only displays it.
  No run view written: no state. When the root is inside the
  repository and the state untracked, `/<rel>/state.json` goes to the exclude file as the `gtm`
  skill §0 adds `/<rel>/NOW.md`, when `git check-ignore -q <rel>/state.json` fails. Exit 3 (a
  worktree, a tracked or foreign file) or 2: one Heads-up per session, never a hold-up.
  While `config.yml`'s `project.sheet` reads `on`, the same state run also rewrites
  `<root>/sheet.json`, with no flag of its own; `/<rel>/sheet.json` goes to the exclude file as
  `state.json` does, when `git check-ignore -q <rel>/sheet.json` fails. Its exit 3: one Heads-up
  per session, never a hold-up.
- **Project sheet:** while the switch is on, never write `<root>/sheet.json` yourself: hand the
  owner's fields to the script, `node ${CLAUDE_PLUGIN_ROOT}/scripts/now-facts.mjs --root <root>
  --sheet '<root>/sheet.json' <<'GTM_SHEET'`, then one JSON object shaped as
  `templates/project-sheet.md` says, then `GTM_SHEET` alone on its line. Exit 1 names the refused
  field and why: fix that field and hand it once more; refused again, or exit 2 or 3: one Heads-up
  per session, never a hold-up. Never shorten or reword the owner's words. Switch off: never run it.
- **Card file:** when a card is shown, never write `<root>/reports/<slug>/waiting.json` yourself:
  hand its content to the script, `node ${CLAUDE_PLUGIN_ROOT}/scripts/now-facts.mjs --root <root>
  --card <slug> <<'GTM_CARD'`, then one JSON object shaped as `templates/decision.md` says, then
  `GTM_CARD` alone on its line; then pass `--waiting '<kind>,<task>'`. Exit 1 names the refused
  field and why: fix that field and hand the card once more; refused again, or exit 2 or 3, show the
  card as is with one Heads-up per session, never a hold-up. The file holds one card: with two
  cards in one message, hand only the first, and the second once the first is answered. When the
  card is answered, and the file still holds that card's `id`, record the
  answer before the run view's rewrite: the same command with `--answer <slug>` and the answer
  `templates/decision.md` describes. The file stays, answered, until the slug's next card.
  An answer refused, any exit but 0: change nothing, keep the ledger line quoting it, add one
  Heads-up; never shorten or reword the owner's words to fit.

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
