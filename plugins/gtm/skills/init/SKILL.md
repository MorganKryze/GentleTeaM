---
name: init
description: Bootstrap GTM in a project - drafts the brief, config, team settings, conventions and guidelines from the codebase, confirms them through a short interview, and sets stealth mode and whether .gtm/ stays out of git. Use once per project, or to refresh a stale setup.
argument-hint: "[root path, default .gtm]"
---
# Set up GTM in this project

Goal: a working `.gtm/` in under ten minutes of the human's time. The analyst guesses; the human
corrects. The draft takes about 1-2 minutes: say so when you dispatch the analyst. Follow `${CLAUDE_PLUGIN_ROOT}/templates/briefing.md` for every message.

## 1. Draft
- Root: `$ARGUMENTS` or `.gtm/`. If it exists, never overwrite: list what is missing or stale and
  offer to fill only that. Until §5 is answered, list the root in `.git/info/exclude`, so nothing
  of GTM can be staged by accident.
- Dispatch `gtm:analyst` in **init mode** with the root. It detects the stack, verify commands (it
  runs only the fast ones: lint, typecheck or a smoke test, within 90 seconds; the rest stay
  `[CHECK]` until the first `/gtm:deliver` run confirms them), base
  branch, commit style, UI and server paths, and drafts from `${CLAUDE_PLUGIN_ROOT}/templates/`:
  `brief.md`, `config.yml`, `team.md` (proposed), `conventions.md` and `guidelines/*.md` (adapted
  to what the repo already does: commit style, test frameworks, languages), every guess marked
  `[CHECK]`. Conventions recommend GTM's defaults unless the history clearly shows another
  established practice; then the row says so, with its evidence, and still states GTM's default and
  why (merge commits: bisectable, each change revertable; never rewrite pushed history).
- Create `specs/`, `plans/`, `reports/`, `ledger.md` and `backlog.md` (from the templates).

## 2. Interview (one message, ≤ 5 questions)
Show the guesses as a table (item · my guess · why) and ask the human to reply "OK" or to correct
lines. Cover only what the code cannot tell: purpose and users, non-negotiables, whether the product has
screens, any verify command the analyst could not find, and the **communication style**: language,
default detail level (brief / standard / deep / ask), emoji (off / light / generous; default light).
Write the answers in (`language`, `briefing` in `config.yml`); remove every `[CHECK]` except on
verify commands not run at init, which `/gtm:deliver` confirms on its first run.

## 3. Team settings (one message)
From the brief, propose `team.md`: priorities weighted low / normal / high (security, data
integrity, UX and accessibility, performance, delivery speed, usage and cost sensitivity), then per
role model and effort, which specialists exist and their path triggers, correction rounds, the design
threshold, and whether the plan dry-runs risky tasks. Derive, do not guess:
- several accounts, a server or secrets → security high: security-reviewer on, effort xhigh;
- stored or synced personal records → data integrity high: data-reviewer on, dry runs of risky tasks on;
- screens used daily or by many → UX high: ux-qa on, design threshold 8 or more;
- usage or cost sensitivity high → lower the effort of the high-volume roles (implementer,
  reviewer) first; never lower a role that guards a high priority.

Present a short table (priority or role · value · one-line reason) with your recommendation; the
human approves or edits. Write `team.md` with each value's reason and today's date.

## 4. Conventions (one message)
Show `conventions.md` as its table: one row per area (code, tests, git and releases, docs,
dependencies, security, data, language and copy, voice, accessibility, design, work: priority P0-P3, epics
and stories, definition of done), each with the default or the analyst's adapted value. The human
accepts the table or edits rows in one reply. Your recommendation per row is GTM's default; a row
that keeps the repository's own established practice says so, cites the evidence (e.g. "squash: 40
of the last 40 PRs") and still gives GTM's default and why. Never recommend a practice the history
does not already show over the default. Write the choices into the guideline files, each
keeping its "When to read" line, and today's date in the table. Delete the files of areas the
project does not have (e.g. design without screens); `voice.md` stays in every project.

## 5. Footprint (one message, at most two decision cards)
First card: stealth, from the analyst's evidence (who owns the repository, contributors, a
contribution policy on tools or disclosure).

**Decision: stealth mode**

| Option | What it means |
| --- | --- |
| **A** off | GTM's files may be shared with the team |
| **B** on | no footprint: files stay local, text in the project's voice |

**I recommend: A** for a project you own, **B** for a client's project or an open-source one you
contribute to. **Cost if wrong:** A leaves GTM's traces in someone else's history; B leaves
teammates with no memory.

Write the answer as `stealth: on|off` in `config.yml`.

**Stealth on:** no second card. Keep the whole root out of the tracked tree: its entry in
`.git/info/exclude` (never `.gitignore`, which is tracked), or a root outside the repository set
as `root:` with the `GTM root:` line in `CLAUDE.local.md`, itself listed in `.git/info/exclude`.
Add the root to `git.never_name`. Write nothing into tracked files: no README badge, no
CLAUDE.md or AGENTS.md line, no committed `.claude/settings.json` (install GTM at user scope).
`git.branch` keeps the project's branch pattern; `footprint.skip` lists only the tells the
project's own log already uses (cite the evidence). `guidelines/voice.md` is mandatory.

**Stealth off:** second card, where `.gtm/` lives:

**Decision: where .gtm/ lives**

| Option | What it means |
| --- | --- |
| **A** commit it | except `reports/` and `mockups/`, excluded locally |
| **B** keep it local | all of it in `.git/info/exclude` |

**I recommend: A**, the brief, team settings and ledger are the team's memory; reviews stay local.
**Cost if wrong:** A leaves shared files to tidy later; B starts a teammate with no memory.

Apply the choice through `.git/info/exclude`, replacing the entry from §1 (never `.gitignore`
without asking). With B, add the
root to `git.never_name` so no tracked file names it.

## 6. Done
TL;DR with what was created, then Next steps: `you` · run `/gtm:gtm <what you want done>`.
