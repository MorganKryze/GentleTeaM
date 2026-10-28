---
name: init
description: "Set up GTM in a project: brief, config, team settings and guidelines from the codebase, after a short interview. Use when a project has no GTM root, or to refresh it."
argument-hint: "[root path, default .gtm]"
---
# Set up GTM in this project

Ground rules: as in the `gtm` skill §0; the root may not exist yet. Goal: a working `.gtm/` in
under ten minutes of the human's time; the analyst guesses (1-2 min, say so), the human corrects.

## 1. Draft
- Root: `$ARGUMENTS` or `.gtm/`. If it exists, never overwrite: list what is missing or stale (a
  `team.md` without `## Companions` included) and offer to fill only that. Until §5 is answered,
  list the root in `.git/info/exclude`.
- Dispatch `gtm:analyst` in **init mode** with the root and the files it holds: it drafts the rest.
- Create `specs/`, `plans/`, `reports/`, `ledger.md` and `backlog.md` (from the templates).

## 2. Interview (one message, ≤ 5 questions)
Show the guesses as a table (item · my guess · why) for an "OK" or corrections. Cover only what the
code cannot tell: purpose and users, non-negotiables, whether the product has screens, any verify
command not found, and the **communication style**: language, detail level, emoji (off / light /
generous; default light). Write the answers into `config.yml` (`language`, `briefing`); remove every
`[CHECK]` except on verify commands not run at init, which `/gtm:deliver` confirms on its first run.
- Not on Windows: one card in this message, **the usage step**: A chain it to your status line with
  the run breadcrumb (NOW.md's first `>` line, above your status line), B without it, C no; I
  recommend A. On A or B run `node "${CLAUDE_PLUGIN_ROOT}/scripts/usage-line.mjs" --install
  "<config>/settings.json"` (`--breadcrumb` on A; `<config>` =
  `${CLAUDE_CONFIG_DIR:-$HOME/.claude}`) and show its `undo:` line. It edits the user settings only,
  never the project's or local ones. Already chained (the command names `usage-line.mjs`): rerun it
  with the flags it holds (`--breadcrumb` when the command has it), no card.
- `design.screens` true, screens served over HTTP, no `verify.ui`: one card, A add / B not now,
  listing routes, `design.widths`, light and dark, the loads, start and install commands. On A, copy
  `${CLAUDE_PLUGIN_ROOT}/templates/ui-gate.spec.mjs` beside the project's tests (else `tests/`),
  fill its top block, set `verify.ui` `[CHECK]`, add `ui` to `verify.gate`; install, run and commit
  nothing. A `ui-gate.spec.mjs` already in the project: keep it untouched, only set `verify.ui`.

## 3. Team settings (one message)
From the brief, propose `team.md`: priorities weighted low / normal / high (security, data
integrity, UX and accessibility, performance, delivery speed, usage and cost sensitivity), per role
model and effort, specialists and their path triggers, correction rounds, the design threshold, dry
runs of risky tasks, and the companions found as `${CLAUDE_PLUGIN_ROOT}/templates/companions.md`
says; as a table (priority, role or companion · value · reason) with your recommendation. Write
what the human approves, with each value's reason and today's date. Derive, do not guess:
- several accounts, a server or secrets → security high: security-reviewer on, effort xhigh;
- stored or synced personal records → data integrity high: data-reviewer on, risky tasks dry-run;
- screens used daily or by many → UX high: ux-qa on, design threshold 8 or more;
- a reading under 30 minutes old (`usage-line.mjs --read`) at 5h ≥ 80%, or 7d ≥ 50% with ≥ 3 days to
  its reset → usage sensitivity high, the reading quoted in its Why;
- usage or cost sensitivity high → lower the effort of the high-volume roles (implementer, reviewer)
  first; never lower a role that guards a high priority.

## 4. Conventions (one message)
Show `conventions.md` as its table (one row per area, recommended as `gtm:analyst` method 7 says);
the human accepts it or edits rows in one reply. Write the choices into the guideline files, each
keeping its "When to read" line, and today's date into the table. Delete the files of absent areas;
`voice.md` stays in every project.

## 5. Footprint (one message, at most two decision cards)
First card: stealth, from the analyst's evidence. **Decision: stealth mode**: A off, GTM's files may
be shared with the team; B on, no footprint (files stay local, text in the project's voice). **I
recommend: A** for a project you own, **B** for a client's project or an open-source one you
contribute to. **Cost if wrong:** A leaves GTM's traces in someone else's history; B leaves
teammates with no memory. Write the answer as `stealth: on|off` in `config.yml`.

**Stealth on:** no second card. Keep the whole root out of the tracked tree: an entry in
`.git/info/exclude` (never `.gitignore`, which is tracked), or a root outside the repository
(`root:`) named by a `GTM root:` line in an excluded `CLAUDE.local.md`. Add the root to
`git.never_name`. Write nothing into tracked files: no README badge, no CLAUDE.md or AGENTS.md line,
no committed `.claude/settings.json` (install GTM at user scope). `git.branch` keeps the project's
branch pattern; `footprint.skip` lists only the tells its own log already uses, with evidence.
`guidelines/voice.md` is mandatory.

**Stealth off:** second card, **where .gtm/ lives**: A commit it, except `reports/` and `mockups/`
(excluded locally); B keep it all in `.git/info/exclude`. **I recommend: A**, the brief, team
settings and ledger are the team's memory; reviews stay local. **Cost if wrong:** A leaves shared
files to tidy later; B starts a teammate with no memory. Apply it via `.git/info/exclude`, replacing
the §1 entry (never `.gitignore` without asking); with B, add the root to `git.never_name` so no
tracked file names it.

## 6. Done
TL;DR with what was created, then Next steps: `you` · run `/gtm:gtm <what you want done>`.
