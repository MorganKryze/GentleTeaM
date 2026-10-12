---
name: init
description: Bootstrap GTM in a project - drafts the brief, config, team profile and guidelines from the codebase, confirms them through a short interview, and offers to keep .gtm/ out of git. Use once per project, or to refresh a stale setup.
argument-hint: "[root path, default .gtm]"
---
# Set up GTM in this project

Goal: a working `.gtm/` in under ten minutes of the human's time. The analyst guesses; the human
corrects. Follow `${CLAUDE_PLUGIN_ROOT}/templates/briefing.md` for every message.

## 1. Draft
- Root: `$ARGUMENTS` or `.gtm/`. If it exists, never overwrite: list what is missing or stale and
  offer to fill only that.
- Dispatch `gtm:analyst` in **init mode** with the root. It detects the stack, verify commands, base
  branch, commit style, UI and server paths, and drafts from `${CLAUDE_PLUGIN_ROOT}/templates/`:
  `brief.md`, `config.yml`, `team.md` (proposed), `guidelines/*.md`, every guess marked `[CHECK]`.
- Create `specs/`, `plans/`, `reports/` and `ledger.md` (from the template).

## 2. Interview (one message, ≤ 5 questions)
Show the guesses as a table (item · my guess · why) and ask the human to reply "OK" or to correct
lines. Cover only what the code cannot tell: purpose and users, non-negotiables, the human's
language, whether the product has screens, and any verify command the analyst could not find.
Write the answers in; remove every `[CHECK]`.

## 3. Team profile (one message)
From the brief, propose `team.md`: priorities weighted low / normal / high (security, data
integrity, UX and accessibility, performance, delivery speed, usage and cost sensitivity), then per
role model and effort, which specialists exist and their path triggers, fix rounds, the design
threshold, and whether the plan replays risky tasks. Derive, do not guess:
- several accounts, a server or secrets → security high: security-reviewer on, effort xhigh;
- stored or synced personal records → data integrity high: data-reviewer on, risky replay on;
- screens used daily or by many → UX high: ux-qa on, design threshold 8 or more;
- usage or cost sensitivity high → lower the effort of the high-volume roles (implementer,
  reviewer) first; never lower a role that guards a high priority.

Present a short table (priority or role · value · one-line reason) with your recommendation; the
human approves or edits. Write `team.md` with each value's reason and today's date.

## 4. Keep it out of git? (one decision card)
```
Decision: where .gtm/ lives
Options:  A. commit it, except reports/ and mockups/ (excluded locally)
          B. keep all of it local (.git/info/exclude)
I recommend: A: the brief, team profile and ledger are the team's memory; reviews stay local
Cost if wrong: A → shared files to tidy later; B → a teammate starts with no memory
```
Apply the choice through `.git/info/exclude` (never `.gitignore` without asking). With B, add the
root to `git.never_name` so no tracked file names it.

## 5. Done
TL;DR with what was created, then Next steps: `you` · run `/gtm <what you want done>`.
