---
title: "It is too slow or too costly: what now?"
description: What GTM costs, measured, and the levers that make a change cheaper.
---

::: callout summary
- **You will learn:** what a change costs, and six levers that lower it, each with its risk.
- **Reading time:** 4 minutes.
- **Before this:** [Change your team settings](/guides/team-settings/).
:::

GTM spends agent time to save your attention. Every role runs the strongest model by default, so
a [Feature](/reference/glossary/#feature) uses more of your plan than asking Claude Code
directly. A [Fix](/reference/glossary/#fix) is the cheap path.

## What does a change cost?

Measured on GTM's own changes:

| Change | Size | Agent time | Measured on |
| --- | --- | --- | --- |
| 2 files, on security ground | Fix | 71 s | GTM 0.3.0 |
| a docs fix and one workflow argument, 2 tasks | Feature | 11 min, 61% of it the final review | GTM 0.3.0 |
| a workflow change, 3 tasks | Feature | 58 min | GTM 0.2.0 |

Installed and idle, GTM adds about 1,300 tokens to a session. No controlled comparison with
Claude Code alone has been run yet.

## Which levers make it cheaper?

Each lever saves something and risks something. Most change your
[team settings](/reference/glossary/#team-settings); every field is in
[Settings](/reference/settings/).

| Lever | What it saves | What it risks |
| --- | --- | --- |
| Keep the change small enough to stay a Fix | the spec, the plan and the final review: 71 s against 11 min or more | nothing, while it stays within its file limit; past it, it grows into a Feature |
| Lower a role's effort with `/gtm:tune` | tokens on every call of that role; the roles that run most often save most | that role misses more; reviews and [correction rounds](/reference/glossary/#correction-round) catch part of it |
| Narrow a specialist's paths | a security, data or screen review on tasks outside its ground | a path rule that is too narrow misses a change; the final review catches it |
| Keep `design.screens` off when nothing is visual | the [mockups](/reference/glossary/#mockups) step: a designer and a critic for each screen | a screen change goes unscored before it is built |
| Mark independent tasks `[P]` in the plan | wall time: tasks whose files do not overlap run at once | nothing on the result; a conflict stops the merges until you decide |
| Read summaries with `/gtm:brief-me` | your reading time: it shows any document at brief, standard or deep detail | a detail you would have caught in the full text |

## Where does the time go in a Feature?

In the 11 minute Feature above, the final review took 61% of it. In the 58 minute one, the security
task, with its two rounds of correction, and the architect's [dry run](/reference/glossary/#dry-run)
of the plan took most of it. A Feature of one task that passes its review with no correction round
skips the final review: that review, with every specialist it called in, was the last.
