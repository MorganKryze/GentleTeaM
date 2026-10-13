---
title: Use GTM with other plugins
description: Per role, which other plugins to keep, add or skip, and the overlaps to avoid.
---

::: callout summary
- **You will learn:** which plugins make a role stronger, and which ones get in GTM's way.
- **Reading time:** 4 minutes.
- **Before this:** [Roles](/reference/roles/) names each role below.
:::

GTM works alone: every role, workflow and template it needs ships in the plugin. Some other
plugins make a role stronger. These are recommendations, not requirements, from a survey made in
October 2026.

## Which plugin helps which role?

| Role | Verdict | Plugin | Why |
| --- | --- | --- | --- |
| `analyst` | optional | [superpowers](https://github.com/obra/superpowers) `brainstorming` | Socratic exploration for vague ideas, before `/gtm:gtm` picks a size |
| `designer` | keep one | one design skill at most, for example `frontend-design` | many overlapping design skills inflate every session's context |
| `design-critic` | add | [impeccable](https://github.com/pbakaus/impeccable) `critique` or `audit` | deterministic detectors of design tells, cheap and repeatable |
| `architect` | optional | [context7](https://github.com/upstash/context7) | current library docs while planning |
| `implementer` | optional | superpowers `test-driven-development`, `systematic-debugging` | the discipline GTM asks for, in more depth |
| `reviewer` | optional | [ponytail](https://github.com/DietrichGebert/ponytail) `ponytail-review` or `code-simplifier`, pick one | an over-engineering pass; GTM's reviewer already checks simplification |
| `security-reviewer` | add | `security-guidance` (official) hooks; [Trail of Bits skills](https://github.com/trailofbits/skills) `differential-review`, `insecure-defaults` | a cheap net on every edit, plus real review depth |
| `data-reviewer` | idea | Every's `data-integrity-guardian` agent, from [compound-engineering](https://github.com/EveryInc/compound-engineering-plugin) | GTM's data reviewer follows the same idea; copy prompts, do not install a second workflow |
| `ux-qa` | optional | an accessibility-checking skill | GTM's ux-qa already runs axe and measures targets |
| `final-reviewer` | keep | Claude Code's built-in `/code-review` or `/security-review`, for a second opinion | GTM's final review already orders security and data first |
| `release-qa` | add | the official [Playwright MCP](https://github.com/microsoft/playwright-mcp) | the only real browser driver; screenshots for bug reports |
| ship | optional | `commit-commands` (official) | small, useful for commits and PRs outside GTM |

## Which overlaps should I avoid?

::: grids

::: grid

### One code-review system

GTM's reviewer and final reviewer are it. Do not run a second multi-agent PR reviewer on every
task; use one only as an occasional second opinion.

:::

::: grid

### One simplifier

Pick `ponytail-review`, `code-simplifier` or the built-in `/simplify`, not several.

:::

::: grid

### One owner of the loop

GTM owns the loop. Do not let superpowers' plan execution, compound-engineering, feature-dev or a
loop plugin drive the same branch; use their single skills only.

:::

::: grid

### No second memory system

The [logbook](/reference/glossary/#logbook) is GTM's memory, next to Claude Code's own `CLAUDE.md`
and auto-memory. A memory plugin with its own hooks duplicates both and costs context every turn.

:::

:::

## What about their licences?

Trail of Bits skills are CC-BY-SA-4.0, fine for local use. Taskmaster carries a Commons Clause:
borrow its ideas, do not embed it. The others listed are MIT or Apache-2.0.
