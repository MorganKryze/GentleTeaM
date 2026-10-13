---
title: Glossary
description: Every term GTM uses, in one line each.
---

::: callout summary
- **You will learn:** what each GTM term means, and which file, command or setting it names.
- **Reading time:** 4 minutes, or look up one term.
- **Before this:** nothing; to see the terms at work, follow
  [your first Feature](/tutorial/first-feature/).
:::

## What does each term mean?

### Backlog
`.gtm/backlog.md`: epics, their stories, priority and status, one table per epic.

### Brief
`.gtm/brief.md`: your project's one-page constitution: purpose, users, principles, limits.

### Checkpoint
A moment where you decide, three per Feature: the mockups, the summary and the go, at
`/gtm:design`, `/gtm:spec` and `/gtm:ship`.

### Conventions
The project's rules, one file per area: `conventions.md` in `.gtm/`, and its files under
`guidelines/`.

### Correction round
The implementer fixes open findings, then the same reviewers re-check. 3 at most, the
`fix rounds per task` line in `team.md`; each raises the implementer's effort one level.

### Decision card
A question, its options, a firm recommendation and the cost if wrong, shown by `/gtm:spec` and
`/gtm:deliver`.

### Decisions made for you
What the team decided without asking, each with its cost if wrong, kept in `ledger.md` as
`ruling` lines.

### Dry run
The architect runs a risky task's code in a scratch copy while planning (`/gtm:plan`), to prove
the plan; risky paths are set in `team.md`.

### Feature
One capability on one branch, with three checkpoints, started with `/gtm:gtm`.

### File limit for a fix
The most files a Fix may change, 3 by default: the `Fix track ceiling` line in `team.md`. Past
it, a fix grows into a Feature.

### Final review
One last review of the whole branch against the spec and the plan, by the `final-reviewer`, once
every task is done.

### Fix
A change of at most 3 files with no schema or sign-in change, run by `/gtm:gtm`.

### Logbook
`ledger.md`, in `.gtm/`: one line per lesson, decision or deferred finding, kept across changes.

### Milestone
Work across several branches, each run as a Feature, tracked as an epic in `backlog.md`.

### Mockups
One page showing each new screen in light and dark, scored by the critic, kept in `.gtm/mockups/`.

### Retro
`/gtm:retro`: distils a delivered branch into at most five lessons and guideline edits.

### Spec
The document the architect writes before any code, in `.gtm/specs/`: what will be built, what is
left out, and how each part is checked.

### Stealth
`stealth: on` in `config.yml`: GTM keeps its files out of the tracked tree and its names out of
everything it writes into the project.

### Summary
The ten lines at the top of a spec in `.gtm/specs/`, written for you.

### Team settings
`team.md`, in `.gtm/`: which roles run, how hard each one thinks, and why, each with its date.

### Tune
`/gtm:tune`: re-evaluates your team settings and conventions from the logbook's evidence, and
switches stealth on or off.

## Internal terms

These appear only in the reference and in the team's reports.

- **EARS:** Easy Approach to Requirements Syntax, the form of a spec's acceptance lines.
- **footprint check:** the scan `/gtm:ship` runs in stealth; a hit stops the ship.
- **gate:** a check that must pass before work moves on; see
  [How the team works](/reference/how-the-team-works/).
- **GTM root:** the folder holding GTM's files, `.gtm/` by default.
- **hand-back:** an agent's return: ten lines or a structured object.
- **hand-off:** giving an agent paths to files instead of pasting their content.
- **minor:** a review finding that does not block a task; logged and triaged by the final review.
- **NEEDS CLARIFICATION:** a marker for something the spec must not guess; none may remain.

## Retired words

Older docs and reports may use these; each now has a plain word.

- **Board:** now mockups.
- **Escalation:** now "a fix that grows becomes a Feature".
- **Fix ceiling:** now file limit for a fix.
- **Fix round:** now correction round.
- **For you:** now summary.
- **Ledger:** now logbook.
- **Replay:** now dry run.
- **Ruling:** now decisions made for you.
- **Team profile:** now team settings.
- **Touchpoint:** now checkpoint.
