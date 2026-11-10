---
title: The .gtm/ folder
description: Every file GTM keeps in your project, what it holds, and which ones you read.
---

::: callout summary
- **You will learn:** what each file in `.gtm/` holds, and the seven you actually read.
- **Reading time:** 3 minutes, or look up one row.
- **Before this:** [Roles](/reference/roles/), for who writes what.
:::

GTM keeps everything it writes in one folder at the root of your project, `.gtm/`. You read seven
entries; the team reads the rest. A project may move the folder, or keep it out of git, and says
so in its `CLAUDE.md`.

Three of those entries have names of their own. The [mockups](/reference/glossary/#mockups) are
the pages showing each new screen before it is built. Your
[team settings](/reference/glossary/#team-settings), in `team.md`, say which roles run and how
hard each one thinks. The [logbook](/reference/glossary/#logbook), `ledger.md`, keeps one line
per lesson or decision, so each [Feature](/reference/glossary/#feature) starts from what the last
one learned.

## Which files do I read?

<figure class="gtm-tree" aria-label="The .gtm/ folder, with the files you read marked read it">
<ul>
<li class="dir"><code>.gtm/</code></li>
<li class="you"><code>brief.md</code><span class="why">your project in one page</span><span class="badge">read it</span></li>
<li class="you"><code>team.md</code><span class="why">your team settings</span><span class="badge">read it</span></li>
<li class="you"><code>backlog.md</code><span class="why">what is planned next</span><span class="badge">read it</span></li>
<li class="you dir"><code>specs/</code><span class="why">the summary you approve</span><span class="badge">read it</span></li>
<li class="you dir"><code>mockups/</code><span class="why">the screens you approve</span><span class="badge">read it</span></li>
<li class="you"><code>taste.md</code><span class="why">what you like and refuse</span>
<span class="badge">read it</span></li>
<li class="you"><code>NOW.md</code><span class="why">where the run is now</span><span class="badge">read it</span></li>
<li><code>config.yml</code><span class="why">paths and commands</span><span class="badge">skip it</span></li>
<li><code>conventions.md</code><span class="why">rules per area</span><span class="badge">skip it</span></li>
<li class="dir"><code>guidelines/</code><span class="why">one file per area</span><span class="badge">skip it</span></li>
<li class="dir"><code>brainstorms/</code><span class="why">notes from brainstorms</span>
<span class="badge">skip it</span></li>
<li class="dir"><code>plans/</code><span class="why">tasks for the team</span><span class="badge">skip it</span></li>
<li class="dir"><code>reports/</code><span class="why">full agent reports</span><span class="badge">skip it</span></li>
<li><code>ledger.md</code><span class="why">the logbook</span><span class="badge">skip it</span></li>
<li><code>state.json</code><span class="why">the run, for a program</span>
<span class="badge">skip it</span></li>
</ul>
<figcaption>How to read it: the rows marked read it, on a tinted ground, are yours; the grey rows are written and read by the team.</figcaption>
</figure>

## What does each file hold?

| File | What it holds | Written by |
| --- | --- | --- |
| `brief.md` | purpose, users, principles and limits, on one page | `/gtm:init`, amended rarely |
| `team.md` | your [team settings](/reference/glossary/#team-settings): effort per role, specialists, checks | `/gtm:init`, `/gtm:tune` |
| `backlog.md` | the larger pieces of work, their priority and status | `/gtm:gtm`, `/gtm:ship` |
| `brainstorms/` | one [brainstorm](/reference/glossary/#brainstorm) note per session, `open` or `done`, cited by the spec it led to | `/gtm:brainstorm` |
| `specs/` | one [spec](/reference/glossary/#spec) per Feature, opened by your summary | architect |
| `mockups/` | the [mockups](/reference/glossary/#mockups), as HTML and PNG | designer |
| `taste.md` | what you like and refuse in a design, kept from one run to the next | `/gtm:design`, or you by hand |
| `NOW.md` | where the run is now: phase, task, what runs, when it should end | the orchestrator, `/gtm:status` |
| `state.json` | the same run view as JSON, for a program that follows the run; kept out of commits like `NOW.md` | the orchestrator, `/gtm:status` |
| `config.yml` | paths, check commands, git rules, languages | `/gtm:init` |
| `conventions.md` | the project's rules, with one guideline file per area | `/gtm:init`, `/gtm:retro` |
| `plans/` | one plan per Feature: tasks, files, test steps | architect |
| `reports/` | each agent's full report, and the pull request text | every role |
| `reports/<slug>/waiting.json` | the card waiting on your answer, in the writer's words; deleted once you answer | the orchestrator |
| `reports/<slug>/mandate.md` | the file given with `mandate=<file>`, copied byte for byte, its fingerprint in the logbook; any other file there counts as no mandate; it holds for the branch, resumes included, until you delete it | `/gtm:deliver` |
| `reports/<slug>/landing.json` | the landing `/gtm:ship` records under a standing go: class, head, proofs; deleted when the check refuses | `/gtm:ship` |
| `reports/<slug>/handoff.md` | the stopped run: what was stopped, what waited, the worktrees kept and the command that resumes | `/gtm:pause` |
| `ledger.md` | the [logbook](/reference/glossary/#logbook): one line per lesson or decision | every step |

## What does state.json hold?

`state.json` is the run view for a program that follows the run for you, such as a status line:
the facts of `NOW.md` as JSON, rewritten right after it. GTM writes it only in your main checkout.
No skill or agent reads it back; GTM's status line step only displays it, and shows `NOW.md`'s line
instead when the state is older than `NOW.md` or names another slug than its line 1, as after a
failed write. An unknown fact is `null`. A program reading it treats every text as untrusted, and
keeps its own reading when `v` is a version it does not know.

Under `v` 1 fields are only added: `v` changes when a field is removed, renamed or retyped, and a
reader ignores the fields it does not know.

| Field | What it holds |
| --- | --- |
| `v` | the version of this shape, 1 |
| `updated`, `slug`, `branch`, `epic`, `phase` | as in `NOW.md`; `phase` can be `paused` |
| `steps` | one `{n, title, status}` per task of the plan, status `todo`, `doing`, `done` or `blocked`; `[]` with no plan, `null` when the plan has no task heading |
| `task` | `{n, of}`, the task in progress |
| `eta` | `{clock, minutes, measured}`: `clock` the writer's local `HH:MM`, for display, `null` while a card waits, while paused or with no estimate; the end is `updated` plus `minutes`; `measured` the number of measured runs behind the estimate |
| `running` | what runs now: one `{kind, name, since, ageMin, lastChangeMin, mayHaveStopped}` each, or `null` for an item not understood |
| `others` | the other branches in progress: one `{slug, branch, phase, task, updated}` each |
| `waiting` | the card waiting on you: `{kind, task, question, options, costIfWrong}`, each option `{label, recommended}`, or `null` |
| `milestone` | `{n, of, title}`, this branch's place in an approved milestone, or `null` |
| `story` | the backlog story this branch delivers, or `null` |
| `mandate` | `{done, stops}` from a valid mandate, `stops` `null` when it has none; `null` with no valid mandate |
| `defaults` | the number of default rulings for this branch in `ledger.md`, 0 with none |
| `landing` | `{class, head, proofs}` while a landing holds for this branch: the class you signed, the full sha of its head, one `{name, result}` per proof, `pass` when GTM or `/gtm:ship` held it, `due` when your program must check it; `null` without one, and after the next commit |

## What does a new project start with?

Right after `/gtm:init`, the folder holds the files below. The logbook stays empty until the
first branch, and the four folders fill as you work.

```text
.gtm/
  brief.md        one page
  config.yml      paths, checks, git, language, briefings
  team.md         priorities, roles, specialists, limits
  conventions.md  one table, pointing at guidelines/
  guidelines/     code, tests, git, docs, dependencies,
                  security, data, i18n, accessibility,
                  design, work
  backlog.md      epics and stories
  ledger.md       empty until the first branch
  specs/ plans/ reports/ mockups/
```

A file whose name ends in `.partial` is a spec or plan that was being written when you ran
`/gtm:pause`. GTM never reads it again; keep it, compare it or delete it.

To see each file appear as a Feature runs, follow [your first Feature](/tutorial/first-feature/).
