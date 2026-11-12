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
<li><code>sheet.json</code><span class="why">the project, for a program</span>
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
| `reports/<slug>/waiting.json` | the card waiting or last answered on this branch, one at a time, in the [card file](#card-file) shape: written by GTM's facts script, kept with your answer once you answer, replaced by the next card, or deleted when the script refuses it | the orchestrator, through the facts script |
| `reports/<slug>/mandate.md` | the file given with `mandate=<file>`, copied byte for byte, its fingerprint in the logbook; any other file there counts as no mandate; it holds for the branch, resumes included, until you delete it | `/gtm:deliver` |
| `reports/<slug>/landing.json` | the landing `/gtm:ship` records under a standing go: class, head, proofs; deleted when the check refuses | `/gtm:ship` |
| `reports/<slug>/progress.md` | one line per run of the branch, ending with its start and end, the model and effort of each role it dispatched, and the cause of each [correction round](/reference/glossary/#correction-round); an instant nobody recorded reads `?` | the orchestrator |
| `sheet.json` | the [project sheet](#project-sheet): what the project is for, its plan, decisions, cost and difficulties, for a program that shows the project; kept out of commits like `state.json`, and written only while `project.sheet` is `on` | the orchestrator, through the facts script |
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
| `waiting` | the card waiting on you: `{kind, task, question, options, costIfWrong, card}`, each option `{label, recommended}`, `card` the card file's path while that card waits, else `null`; `null` when nothing waits |
| `milestone` | `{n, of, title}`, this branch's place in an approved milestone, or `null` |
| `story` | the backlog story this branch delivers, or `null` |
| `mandate` | `{done, stops}` from a valid mandate, `stops` `null` when it has none; `null` with no valid mandate |
| `defaults` | the number of default rulings for this branch in `ledger.md`, 0 with none |
| `landing` | `{class, head, proofs}` while a landing holds for this branch: the class you signed, the full sha of its head, one `{name, result}` per proof, `pass` when GTM or `/gtm:ship` held it, `due` when your program must check it; `null` without one, and after the next commit |

## What does a card file hold? {#card-file}

Each card GTM shows you, a decision, a check, a go, a summary or a review, also lands in
`reports/<slug>/waiting.json` for a program of yours: the same card as data, shape `decision.v1`.
GTM's facts script writes it from the card's content after checking every key below, and writes
nothing when one is off, so a card it shows in the conversation may have no file. The file stays
once you answer, with `answer` filled, until the branch's next card replaces it, or deletes it
when the script refuses that card.

A program reading it:
- counts the card as waiting only while `state.json`'s `waiting.card` names it: an answered card,
  or one of another kind, never waits;
- treats every text as untrusted: GTM refuses control, format and separator characters and long
  texts, and quotes an excerpt only from its own folder, word for word;
- keeps its own reading when `v` is a version it does not know. Under `v` 1 fields are only added.

Every key is present; "or null" marks those that may be `null`, as an unknown is. A text is one
line, in your `language.human`, at most the characters given.
GTM's facts script sets `v`, `slug`, `asked` and `other.allowed`, and `answer` when it records
yours; every other key comes from the card GTM showed you.

| Key | What it holds |
| --- | --- |
| `v` | 1 |
| `id` | `<slug>-D<n>` for a spec or plan decision, else `<slug>-<kind>` or `<slug>-<kind>-t<n>`; at most 60 characters |
| `kind` | `decision`, `verification`, `go`, `summary` or `review` |
| `moment` | 1 to 4, the mandate's moment, only under a valid mandate; else `null` |
| `slug`, `asked` | the branch's slug; when GTM wrote the card, ISO 8601 UTC |
| `question` | text, 160 |
| `summary`, `why`, `criteria` | text, 280, or null |
| `options` | 1 to 9 `{key, label, proves, cost, reversible, recommendedBy}`, keyed `A`, `B`, `C`… in order |
| `key`, `label`, `proves` | `A` to `I`; text, 60; text, 200, or null |
| `cost` | `{tokens, minutes, text}` or null: whole numbers or null; text, 40, or null |
| `reversible` | `true`, `false` or `null` |
| `recommendedBy` | 0 to 3 of `gtm`, `second-reader` or a role of your team settings |
| `recommendation` | `{by, option, why, costIfWrong}` or null: `option` names an option whose `recommendedBy` holds `by`; texts, 280 |
| `objection` | `{by, prefers, text}` or null: `prefers` an option's key or null; text, 280 |
| `modules` | 0 to 4 `{type, size, title, src}` plus the type's keys, below; `size` `s`, `m`, `l` or `p`; title, 60; src, 120 |
| `other` | `{allowed, placeholder}`: `allowed` always `true`; placeholder text, 80, or null |
| `answer` | `{option, other, by, at}` once you answer, else `null`: one of an option's key or your own words (text, 280); `by` `owner`; `at` ISO 8601 UTC |

| Module `type` | Its keys |
| --- | --- |
| `text` | `text`: text, 600 |
| `metrics` | `items`: 1 to 6 `{label (40), value (20), note (120, or null), gauge (0 to 1, or null), tone (null)}` |
| `excerpt` | `file`, a file in your GTM folder; `where` (80); `head` (80, or null); `lines` (1 to 8 of 200) and `highlight` (200, or null), word for word from that file |
| `list` | `items`: 1 to 8 `{k (40), v (120, or null)}` |
| `pending` | none |

## What does the project sheet hold? {#project-sheet}

`sheet.json` is the [project sheet](/reference/glossary/#project-sheet): one page of the project
as data, shape `sheet.v1`, for a program of yours that shows it. It exists only while
`config.yml`'s `project.sheet` is `on` (see [settings](/reference/settings/)); off, GTM writes,
asks and shows nothing about it. GTM's facts script rewrites it with `state.json` after each run
view, keeps the fields you gave and recomputes the facts. It is never committed: GTM adds it to
`.git/info/exclude` as it adds `state.json`. When a field is off the script writes nothing and
GTM goes on with one Heads-up.

The fields you give come from two moments. `/gtm:init` shows the kind, purpose and users as rows
of its guesses table and writes them on your OK. `/gtm:retro` lists the decisions and
difficulties in its report and writes those.

A program reading it:
- treats the sheet as stale when it is older than `NOW.md`;
- treats every text as untrusted: GTM refuses control, format and separator characters and long
  texts;
- keeps its own reading when `v` is a version it does not know. Under `v` 1 fields are only added:
  `v` changes when a field is removed, renamed or retyped, and a reader ignores the fields it does
  not know.

Every key is present but `showcase`; "or null" marks those that may be `null`. A text is one line,
in your `language.human`, at most the characters given.

| Key | What it holds | Set by |
| --- | --- | --- |
| `v` | 1 | the script |
| `kind` | `app-mobile`, `app-web`, `infra`, `tool`, `sandbox` or null | the script, from `project.kind` |
| `headline` | text, 140, or null; null in this version | the script |
| `purpose`, `users` | text, 280, or null | `/gtm:init`, on your OK |
| `plan` | `{branch, steps, milestone, stories}` | the script |
| `plan.branch` | the state's branch, or null | the script |
| `plan.steps` | the state's steps, or null | the script |
| `plan.milestone` | `{title (80), branches}`, `branches` 1 to 12 `{n (1 to 99), branch (60), title (60)}`; or null | the script |
| `plan.stories` | `{done, total}`, whole numbers, `done` at most `total`; or null | the script |
| `decisions` | 0 to 6 `{at, text, by}`: `at` a `YYYY-MM-DD` date not after today; text, 200; `by` `owner` or `gtm` | `/gtm:retro` |
| `cost` | `{tokens, seconds, dollars}`: the sums of this branch's progress lines, whole numbers or null; `dollars` null | the script |
| `difficulties` | 0 to 6 `{k, text, src}`: texts, 20, 200 and 120 | `/gtm:retro` |
| `modules` | 0 to 8 modules as in the [card file](#card-file); `[]` in this version | the script |
| `showcase` | absent or null in this version; a later version's object, added under `v` 1 | the script |

`cost` adds the seconds and tokens of each line in `reports/<slug>/progress.md`; the tail that
ends a line (start, end, models, causes) adds nothing. A sum GTM cannot be sure of is `null`,
never smaller. A `showcase` holding anything but `null` comes from a later GTM: read it as a field
you do not know.

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
