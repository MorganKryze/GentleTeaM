---
title: The .gtm/ folder
description: Every file GTM keeps in your project, what it holds, and which ones you read.
---

::: callout summary
- **You will learn:** what each file in `.gtm/` holds, and the six you actually read.
- **Reading time:** 3 minutes, or look up one row.
- **Before this:** [Roles](/reference/roles/), for who writes what.
:::

GTM keeps everything it writes in one folder at the root of your project, `.gtm/`. You read six
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
<li class="you"><code>NOW.md</code><span class="why">where the run is now</span><span class="badge">read it</span></li>
<li><code>config.yml</code><span class="why">paths and commands</span><span class="badge">skip it</span></li>
<li><code>conventions.md</code><span class="why">rules per area</span><span class="badge">skip it</span></li>
<li class="dir"><code>guidelines/</code><span class="why">one file per area</span><span class="badge">skip it</span></li>
<li class="dir"><code>plans/</code><span class="why">tasks for the team</span><span class="badge">skip it</span></li>
<li class="dir"><code>reports/</code><span class="why">full agent reports</span><span class="badge">skip it</span></li>
<li><code>ledger.md</code><span class="why">the logbook</span><span class="badge">skip it</span></li>
</ul>
<figcaption>How to read it: the rows marked read it, on a tinted ground, are yours; the grey rows are written and read by the team.</figcaption>
</figure>

## What does each file hold?

| File | What it holds | Written by |
| --- | --- | --- |
| `brief.md` | purpose, users, principles and limits, on one page | `/gtm:init`, amended rarely |
| `team.md` | your [team settings](/reference/glossary/#team-settings): effort per role, specialists, checks | `/gtm:init`, `/gtm:tune` |
| `backlog.md` | the larger pieces of work, their priority and status | `/gtm:gtm`, `/gtm:ship` |
| `specs/` | one [spec](/reference/glossary/#spec) per Feature, opened by your summary | architect |
| `mockups/` | the [mockups](/reference/glossary/#mockups), as HTML and PNG | designer |
| `NOW.md` | where the run is now: phase, task, what runs, when it should end | the orchestrator, `/gtm:status` |
| `config.yml` | paths, check commands, git rules, languages | `/gtm:init` |
| `conventions.md` | the project's rules, with one guideline file per area | `/gtm:init`, `/gtm:retro` |
| `plans/` | one plan per Feature: tasks, files, test steps | architect |
| `reports/` | each agent's full report, and the pull request text | every role |
| `ledger.md` | the [logbook](/reference/glossary/#logbook): one line per lesson or decision | every step |

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

To see each file appear as a Feature runs, follow [your first Feature](/tutorial/first-feature/).
