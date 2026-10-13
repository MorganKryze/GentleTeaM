---
title: Principles
description: Six rules that spare your attention, and the test a GTM run must pass.
---

::: callout summary
- **You will learn:** the six rules that keep your reading short, and where GTM enforces each.
- **Reading time:** 4 minutes.
- **Before this:** [Why GTM exists](/why/).
:::

Your attention is the scarcest resource in an agent team. Agents produce reports, specs and
reviews faster than anyone can read them; GTM spends that capacity inside the team and hands you
only verdicts, decisions and pictures. Six rules follow from that.

## 1. Every artifact opens with a summary

Anything you are meant to read starts with at most ten lines in your language: what this is,
why, what you must decide, and the team's recommendation. For a spec this is its
[Summary](/reference/glossary/#summary); the rest of the document is for the team. The spec and
plan templates carry it, `/gtm:spec` checks it before showing anything, and `/gtm:brief-me`
re-presents it.

## 2. Decisions come as cards

A [decision card](/reference/glossary/#decision-card) holds a question, two or three options, a
firm recommendation (the long-term option by default) and the cost if that recommendation is
wrong. There is never a decision without a recommendation, and never more than two questions to
pick the size of a change. A card looks like this:

**Decision:** *the question*

| Option | What it means |
| --- | --- |
| **A** *its name* | *one line* |
| **B** *its name* | *one line* |

**I recommend: A**, *why*. **Cost if wrong:** *one line*.

The card is plain Markdown in your language, never a code block, so it reads cleanly in the
terminal and in the editor. Every skill uses it, from the briefing format in
`plugins/gtm/templates/briefing.md`.

## 3. Detail on demand, remembered

Before presenting an artifact, GTM uses the detail level stored for that kind of artifact: brief,
standard or deep. When none is stored and the config says `ask`, it asks one quick question and
stores the answer, so the question is never asked twice. `/gtm:brief-me` shows any artifact again
at another level. The levels live in `briefing.detail` and `briefing.remembered` in
`.gtm/config.yml`.

## 4. One briefing format, in your language

Every message to you has the same shape. It opens with the verdict and the measure that proves
it; under five lines, that opening is the whole answer. Details follow from general to specific,
one idea per block, tables over lists. A heads-up block appears only when something deviates,
and a table of next steps says who does what (you, me, or blocked), left out when there is
nothing to do. There is no story of the path taken and no recap. The language and the use of
emoji come from your project's config; the format is `plugins/gtm/templates/briefing.md`.

## 5. Visuals over prose

[Mockups](/reference/glossary/#mockups) are pictures with captions, results are tables, and a
picture is shown, not described. The designer returns images rather than descriptions, and
`/gtm:design` and `/gtm:brief-me` show them as they are.

## 6. Three checkpoints per Feature, with the decisions made for you listed

You approve the scored mockups, approve the summary of the spec, and give the go to push, merge
or release. Those are the three [checkpoints](/reference/glossary/#checkpoint) of a
[Feature](/reference/glossary/#feature); everything else is settled inside the team.

Every decision the team took without asking is listed at the end of the run under
[Decisions made for you](/reference/glossary/#decisions-made-for-you), each with its cost if
wrong, and kept in the [logbook](/reference/glossary/#logbook), so you can overturn any of them.
The `gtm` router, `/gtm:design`, `/gtm:spec`, `/gtm:deliver` and `/gtm:ship` hold to this.

| Size | Your checkpoints |
| --- | --- |
| [Fix](/reference/glossary/#fix) | the three-line design, with the size, then the go |
| Feature | the mockups (if screens change), the summary of the spec, the go |
| [Milestone](/reference/glossary/#milestone) | the split into branches, then each branch's Feature checkpoints |

## The test

A GTM run behaves well when you could answer "what was decided, by whom, and what does it cost if
it is wrong?" without opening a single report.
