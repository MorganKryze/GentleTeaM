---
title: Where GTM comes from
description: The methods GTM borrows from, and the project it was distilled from.
---

::: callout summary
- **You will learn:** which methods GTM borrows from, and which real project shaped it.
- **Reading time:** 2 minutes.
- **Before this:** [Positions](/why/positions/), for why GTM credits its sources at all.
:::

GTM borrows openly. Each idea below came from another method, and GTM kept it because it spares
your attention or the team's context. The links lead to the original work.

## Which methods does GTM borrow from?

::: grids

::: grid

### BMAD-METHOD

[BMAD-METHOD](https://github.com/bmad-code-org/BMAD-METHOD) brought scale-adaptive entry doors:
the idea that the size of the change picks the process, which became the
[Fix](/reference/glossary/#fix), [Feature](/reference/glossary/#feature) and
[Milestone](/reference/glossary/#milestone) sizes. GTM also ships a copy of its two method
libraries, 108 brainstorming techniques and 71 elicitation methods, under BMAD-METHOD's MIT
licence, with its copyright and trademark notice kept next to them. Roles read a few rows by
name as [reflexes](/reference/roles/#which-thinking-methods-does-each-role-apply).

:::

::: grid

### GitHub spec-kit

[spec-kit](https://github.com/github/spec-kit) brought the constitution, which became your
project's one-page brief, a marker for anything a spec must not guess, and tags for the tasks
that can safely run in parallel.

:::

::: grid

### superpowers

[superpowers](https://github.com/obra/superpowers) brought a fresh context for every task, a
review against the spec before the review of quality, and verification before anything is
called complete.

:::

::: grid

### compound-engineering

[compound-engineering](https://github.com/EveryInc/compound-engineering-plugin) brought the
compound step: each solved problem is written down where it feeds the next plan, which is what
the [logbook](/reference/glossary/#logbook) does.

:::

::: grid

### Agent OS

[Agent OS](https://github.com/buildermethods/agent-os) brought small standards injected on
demand, which became the conventions files a role reads only when its task needs them.

:::

::: grid

### Kiro

[Kiro](https://kiro.dev/docs/specs/) brought a fixed sentence form for a spec's acceptance
lines, so that each line turns directly into a test.

:::

:::

## Which project was GTM distilled from?

GTM was distilled from [Belay](https://github.com/MorganKryze/belay), a self-hosted
offline-first training app built milestone by milestone with the roles, workflows and briefing
format GTM now packages. No Belay code or document is copied into GTM.

Belay exercised seven delivered branches, with a design loop for every screen change, specs with
decision tables, and plans tried in scratch copies for migrations and sync. Each task had its
review, with security, data and screen specialists called in when it touched their ground, then
a final review per branch, and a logbook per milestone whose lessons fed the next plan.

What GTM generalised from it: the role prompts, with the project's rules moved into the `.gtm/`
files; the two workflows, with agent types and triggers moved into arguments; the design
guideline, with tokens and patterns moved into placeholders; and the logbook, now one file with
one line per entry.

<div class="page-navigation gtm-pager">
<a href="../positions/" class="prev-page"><span class="arrow" aria-hidden="true">&larr;</span><span><small>Previous</small><strong>Positions</strong></span></a>
<a href="../../" class="next-page"><span><small>Back to the start</small><strong>What GTM is</strong></span><span class="arrow" aria-hidden="true">&rarr;</span></a>
</div>
