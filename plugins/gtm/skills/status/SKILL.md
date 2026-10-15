---
name: status
description: Show where the current GTM run stands from NOW.md, rebuilt from the files when missing or stale.
disable-model-invocation: true
---
# Status: where the run stands

Ground rules: as in the `gtm` skill §0. This skill writes nothing but `<root>/NOW.md` and the
exclude line §0 describes: no dispatch, no workflow, no branch, worktree, progress, logbook or
backlog change.

1. Run `node "${CLAUDE_PLUGIN_ROOT}/scripts/now-facts.mjs" --root <root>`, adding one `--running`
   per running line of the current NOW.md (kind, name, start time, worktree) so liveness is
   computed again.
2. `stale` empty: show NOW.md as it is, with the running lines from this run's JSON (ages and
   "may have stopped" recomputed).
3. `stale` not empty (NOW.md missing, older than a source, or naming a branch or worktree that is
   gone): rebuild it from the JSON alone, with `templates/now.md`, passing no `--running` or
   `--waiting`. Mark it rebuilt on line 1, write "what runs: unknown" but the worktrees, write it
   as §0 says and show it, naming the `stale` reasons in one Heads-up.
4. Exit 1 from the script: show the `?` facts as `?`; never guess them.
