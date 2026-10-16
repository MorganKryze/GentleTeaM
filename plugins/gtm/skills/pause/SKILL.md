---
name: pause
description: Stop the current GTM run cleanly, keep its work, and write how to resume it.
disable-model-invocation: true
---
# Pause: stop a run cleanly

Ground rules: as in the `gtm` skill §0. This skill stops dispatches and writes only under
`<root>`: progress lines, `.partial` renames, the handoff, one ledger line and NOW.md. It runs
no git command that writes; it pushes, commits and removes nothing.

1. The slug is NOW.md line 1's; `?` or no NOW.md: ask one question naming the active slugs.
2. Read the running items as `/gtm:status` step 1 reads them, and the phase NOW.md shows.
3. `TaskStop` each running item. One that has already returned: write its normal progress line
   instead, as `/gtm:deliver` §1 says.
4. Per stopped item, append to `reports/<slug>/progress.md`
   `- <step> · PAUSED · <base>..<head> · ? s · ?k · ? agents`: a task, final review or fix wave
   with its own range; a wave's tasks with the wave's base. Then append `- paused · <phase>`.
5. Run `node "${CLAUDE_PLUGIN_ROOT}/scripts/now-facts.mjs" --root '<root>' --slug '<slug>'
   --since '<earliest stopped since>'`. Each spec or plan in `changed`: rename it to
   `<name>.partial`, never deleted; a target that exists: leave both, list it. List each report
   in `changed`, left in place.
6. Write `reports/<slug>/handoff.md` whole from `${CLAUDE_PLUGIN_ROOT}/templates/handoff.md`,
   from steps 3 to 5 and the facts JSON of step 5's command rerun after the renames, without
   `--since` (worktrees and their `changes`, `resume`). A handoff already there: read it first
   and carry forward each `.partial` it lists that still exists, and its pause under "Earlier
   pauses".
7. Append to the ledger `<date> · <slug> · ruling · paused on the human's request: <phase>, <n>
   stopped, <k> worktrees kept; resume from reports/<slug>/handoff.md`.
8. Rewrite NOW.md as the `gtm` skill §0 says, then tell the human the `resume` command to type.
