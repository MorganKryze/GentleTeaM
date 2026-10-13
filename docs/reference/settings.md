---
title: Settings
description: Every field of config.yml and team.md, its default, and who reads it.
---

::: callout summary
- **You will learn:** each field of `.gtm/config.yml` and `.gtm/team.md`, its default, and who
  reads it.
- **Reading time:** 5 minutes, or look up one row.
- **Before this:** [Change your team settings](/guides/team-settings/) explains how to change them.
:::

GTM keeps its settings in two files. `config.yml` holds the mechanics: paths, commands, git
rules. `team.md`, your [team settings](/reference/glossary/#team-settings), holds the weights:
priorities, roles, specialists and limits, each with its reason and the date it was decided.
`/gtm:init` drafts both; `/gtm:tune` changes them.

## What does `config.yml` hold?

Every command and role reads it first. Paths are relative to the repository root; regexes are
JavaScript syntax, matched against repository-relative paths.

| Field | What it sets | Default | Who reads it |
| --- | --- | --- | --- |
| `root` | where GTM keeps its files; may be outside the repository | `.gtm` | every command and role |
| `stealth` | `on` turns on [stealth](/reference/glossary/#stealth): no trace of GTM in the project's tracked files | `off` | every role that writes into the project, `/gtm:ship` |
| `language.human` | the language of what you read: summaries, [mockup](/reference/glossary/#mockups) captions, [decision cards](/reference/glossary/#decision-card) | `en` | the commands that present to you |
| `language.code` | the language of plans, reports, commits and code comments | `en` | the architect, the implementer, the reviewers |
| `briefing.detail` | `brief`, `standard`, `deep` or `ask` (one question, then remembered) | `ask` | the commands that present to you, `/gtm:brief-me` |
| `briefing.remembered` | the detail chosen per kind of file | `{}` | the same |
| `briefing.emoji` | `off`, `light` or `generous`; never in docs, specs, plans or [logbook](/reference/glossary/#logbook) | `light` | the same |
| `verify.prefix` | prepended to every command, such as a wrapper that keeps exit codes | `""` | the implementer, the reviewers |
| `verify.lint`, `typecheck`, `test`, `build`, `size`, `e2e` | the project's commands; empty when it lacks one | `""` | the implementer, the reviewers |
| `verify.gate` | the commands run before every commit; build, size and e2e run at task end | `[lint, typecheck, test]` | the implementer |
| `git.base` | the base branch | `main` | every command that branches or merges |
| `git.branch` | the branch name pattern | `"<slug>"` | `/gtm:deliver` |
| `git.commits` | Conventional Commits, one logical change, tests with their code | `conventional` | the implementer |
| `git.forbid` | text never written in a commit message | `["Co-authored-by", "Generated with"]` | the implementer, `/gtm:ship` |
| `git.never_name` | paths or words never written in tracked files | `[]` | the implementer, `/gtm:ship` |
| `git.merge` | `merge-commit`, `rebase` or `squash` | `merge-commit` | `/gtm:deliver`, `/gtm:ship` |
| `git.push` | `ask`: nothing pushed, merged, tagged or released without your go | `ask` | `/gtm:ship` |
| `footprint.words` | more regexes to flag in stealth mode | `[]` | `/gtm:ship` |
| `footprint.allow` | regexes; a flagged line matching one is ignored | `[]` | `/gtm:ship` |
| `footprint.skip` | writing habits the project's own voice uses, not flagged | `[]` | `/gtm:ship` |
| `design.screens` | `false` when the project has no screens; the design loop never runs | `true` | `/gtm:gtm`, `/gtm:design` |
| `design.mockups` | where the mockups are kept, HTML and PNG | `.gtm/mockups` | the designer, the design critic |
| `design.render` | `"<cmd> {html} {png} {width}"`; empty uses a Playwright screenshot | `""` | the designer, `ux-qa` |
| `design.widths` | the screen widths drawn and measured | `[360, 390, 1280]` | the designer, the design critic, `ux-qa` |
| `qa.live_url` | the live site checked after you deploy; empty skips the check | `""` | `release-qa` |
| `qa.account` | where the test account's credentials live, never the values | `""` | `release-qa` |

## What does `team.md` hold?

Your team settings, read by every command that dispatches a role. Each line carries its reason
and the date it was decided; GTM passes the role values on every call, so they win over the
defaults in the role files.

| Section | Each line | Default | Who reads it |
| --- | --- | --- | --- |
| Priorities | security, data integrity, UX and accessibility, performance, delivery speed, usage and cost sensitivity: `low`, `normal` or `high` | `normal` for all six | `/gtm:init`, `/gtm:tune`, the architect |
| Roles | each role's model (`opus`, `sonnet`, `haiku`, `fable`, a full model id or `inherit`) and effort (`low` to `max`) | `opus`, with the efforts in [Roles](/reference/roles/) | every command that dispatches a role |
| Specialists | `security-reviewer`, `data-reviewer`, `ux-qa`: `on` or `off`, and the path regexes that call each one in | all `on`, with example triggers to adapt | `/gtm:deliver` |
| Limits | [correction rounds](/reference/glossary/#correction-round), [file limit for a fix](/reference/glossary/#file-limit-for-a-fix), mockup threshold and rounds, [dry runs](/reference/glossary/#dry-run) of risky tasks and which paths are risky, `budget per task` and `budget per branch` | see below | `/gtm:gtm`, `/gtm:design`, `/gtm:plan`, `/gtm:deliver`, `/gtm:tune` |
| History | one line per change made by `/gtm:tune`: date, setting, old and new value, why | empty | `/gtm:tune`, `/gtm:retro` |

The limits and their defaults: a task gets 3
[correction rounds](/reference/glossary/#correction-round), each raising the implementer's effort one level; the
[file limit for a fix](/reference/glossary/#file-limit-for-a-fix) is 3 files; mockups pass at 8/10 with no
must-fix finding, and are redrawn 3 times at most; risky tasks get a
[dry run](/reference/glossary/#dry-run), on paths matching `migrations?/`, `(sync|contract|schema)` and
`(db|store|storage)/`. The two budgets, `budget per task` and `budget per branch`, are `none`
or `<minutes> min, <tokens>k tokens`, and start at `none`; a profile without these lines reads as
`none`. Past 1.5 times a budget, `/gtm:deliver` raises a Heads-up, notes it in the ledger and goes
on: no budget changes a verdict, a correction round or the order of tasks. After three measured
runs with no budget, `/gtm:tune` proposes both at the medians of those runs.

To change any of them, see [Change your team settings](/guides/team-settings/).
