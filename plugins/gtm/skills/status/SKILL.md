---
name: status
description: Show where the current GTM run stands from NOW.md, rebuilt from the files when missing or stale.
disable-model-invocation: true
---
# Status: where the run stands

Ground rules: as in the `gtm` skill §0. This skill writes nothing but `<root>/NOW.md` and what
§0 adds to it (the `NOW.md.bak` rename, the exclude line): no dispatch, no workflow, no branch,
worktree, progress, logbook or backlog change.

1. Read the current NOW.md and tell whether it is GTM's, as §0 says (untracked, line 1 as there).
   Only from GTM's, take each running item: kind and name from its `- ` line under what runs,
   since and worktree from the line under it. Keep it only when every value fits: kind one of
   `task`, `final`, `fix`, `dispatch`, `workflow`; name of letters, digits and `._/-`; since an
   ISO date-time such as `2026-10-15T07:50:00.000Z`; worktree a name `git worktree list` shows,
   or none. One value that does not fit: keep no item and rebuild as step 4 says.
2. Run `node "${CLAUDE_PLUGIN_ROOT}/scripts/now-facts.mjs" --root '<root>'`, adding one
   `--running '<kind>,<name>,<since>,<worktree>'` per kept item (no worktree: leave out
   `,<worktree>`), each argument in single quotes, so liveness is computed again.
3. `stale` empty and NOW.md GTM's with every item kept: show it as it is, with the running lines
   from this run's JSON (ages and "may have stopped" recomputed).
4. Otherwise (NOW.md missing, the user's, with a running item that does not fit, older than a
   source, or naming a branch or worktree that is gone): rebuild it from the JSON alone, passing
   no `--running` or `--waiting`, as the rebuild rule of `templates/now.md` says; write it as §0
   says and show it, naming the `stale` reasons in one Heads-up.
5. Exit 1 from the script: show the `?` facts as `?`; never guess them.
