---
title: Commands
description: Every /gtm command, what it does, when to run it and what it asks of you.
---

::: callout summary
- **You will learn:** what each of the twelve commands does, when to run it and what it asks of you.
- **Reading time:** 4 minutes, or look up one row.
- **Before this:** [Which size is my change?](/guides/which-size/) for the tracks.
:::

GTM adds twelve commands to Claude Code. You type the first one; it routes you to the others.
Each command dispatches the roles it needs and comes back to you only at a
[checkpoint](/reference/glossary/#checkpoint).

## Which command do I run, and when?

| Command | What it does | When to run it | What it asks of you |
| --- | --- | --- | --- |
| `/gtm:gtm` | explains the method in a few lines, picks the track and routes to the right commands; bare `/gtm` works when unambiguous | to start any piece of work | at most two questions to pick the track |
| `/gtm:init` | drafts the brief, config, [team settings](/reference/glossary/#team-settings), conventions and guidelines from your codebase | once per project, or to refresh a stale setup | a short interview to confirm them, [stealth](/reference/glossary/#stealth) on or off, and whether `.gtm/` stays out of git |
| `/gtm:design` | runs the design loop: the designer draws [mockups](/reference/glossary/#mockups), the design critic scores them until they meet the bar | for a change of screens, before the spec | your approval of the scored mockups |
| `/gtm:spec` | writes the spec with the architect: what and why, acceptance lines, [decision cards](/reference/glossary/#decision-card) | after the mockups are approved, or first when no screen changes | your approval of the spec's summary |
| `/gtm:plan` | writes the task plan from the approved spec: files, interfaces, test-first steps, the check of each task; runs a [dry run](/reference/glossary/#dry-run) of risky tasks only | after `/gtm:spec` | nothing, unless something deviates |
| `/gtm:deliver` | runs each task in order (implementer, reviewer, the specialists it calls in, [correction rounds](/reference/glossary/#correction-round)), keeps the [logbook](/reference/glossary/#logbook), runs the final review | after `/gtm:plan` | nothing until the report, which lists the [decisions made for you](/reference/glossary/#decisions-made-for-you) |
| `/gtm:ship` | checks the branch, writes the pull request text, runs the footprint check when stealth is on; release notes and the live check after you deploy | when `/gtm:deliver` reports the branch ready | your explicit go for each push, merge, tag or release |
| `/gtm:retro` | turns a delivered branch's reports into one-line lessons, proposes guideline changes for recurring ones, closes resolved findings | after shipping, or when the logbook grows noisy | your yes or no on each guideline change |
| `/gtm:tune` | re-evaluates the team settings and conventions from the logbook and the reports; switches stealth on or off | when `/gtm:retro` suggests it, or the team feels too slow, too costly or misses things | your yes or no on each proposed change, as a decision card |
| `/gtm:brief-me` | re-presents any GTM file (spec, plan, mockups, review, report, logbook, team settings) at the detail you choose | whenever you want to understand a file without reading it | the file, and brief, standard or deep |
| `/gtm:status` | shows where a run is; rebuilds that view after a crash | any time during a run | nothing |
| `/gtm:pause` | stops what runs, keeps every commit, worktree and file, writes the [handoff](/reference/glossary/#handoff) | when you need to stop a run before it ends | nothing; resume later with the command it prints |

## How do I see where a run is?

Three places tell you, without asking the team:

- **`NOW.md`:** a short page in the GTM folder, rewritten at each step: the phase, the task, what
  runs and what waits, and when the run should end. Keep it open in your editor.
- **`/gtm:status`:** shows the same page in the chat, and rebuilds it after a crash.
- **The line atop each message:** one line that says where the run is before the message starts.

`NOW.md` is never tracked by git: GTM keeps it out of your commits.

## How do I stop a run and pick it up later?

Type `/gtm:pause`. Only you can run it: Claude never calls it by itself. It stops every agent and
workflow still running, and pushes, deletes or resets nothing. Commits, worktrees and uncommitted
files stay as they are. A spec or plan written while the run was stopping is set aside as
`<name>.partial`, never deleted.

It then writes `handoff.md` in the branch's reports folder: what was stopped, what waited, which
worktrees hold work, and the command that resumes. `NOW.md` shows the phase as paused.

To resume, start `/gtm:gtm`: it names the paused branch and its command, and runs it when you say
yes. `/gtm:status` shows the same command for you to type. A task that was stopped reruns whole,
from where it started, so nothing half done passes as reviewed.

## What do the commands run underneath?

Two workflows do the repetitive work. You never call them: the commands do.

- **`deliver-task`:** run by `/gtm:deliver` for each task. The implementer writes the task
  test-first, the reviewer and any specialist whose paths changed check it, and correction
  rounds follow until it is clean or three rounds are spent.
- **`design-loop`:** run by `/gtm:design`. The designer draws each screen and the design critic
  scores it, until it reaches 8/10 or three rounds are spent; with several screens, each gets
  its own pair, all at once.

The words used above are in the [glossary](/reference/glossary/); the roles behind each command
are in [Roles](/reference/roles/). To see the commands in order on a real change, follow
[Your first Feature](/tutorial/first-feature/).
