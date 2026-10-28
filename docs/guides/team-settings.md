---
title: Change your team settings
description: What team.md holds, how GTM proposes it, and how to change it with /gtm:tune.
---

::: callout summary
- **You will learn:** what your team settings hold, where they come from, and how to change them.
- **Reading time:** 4 minutes.
- **Before this:** [Which size is my change?](/guides/which-size/) helps, but is not required.
:::

Your [team settings](/reference/glossary/#team-settings) live in `.gtm/team.md`. They record how
your project weighs its work, so nobody restates it each session. Every value carries its reason
and the date it was decided. Each field is listed in [Settings](/reference/settings/).

## What do the team settings hold?

Four parts, read by every command and every role.

- **Priorities:** security, data integrity, UX and accessibility, performance, delivery speed,
  usage and cost sensitivity. Each is low, normal or high, with a reason and a date.
- **Roles:** the model and effort of each of the eleven roles, each with a reason. The roles keep
  defaults in their own files; GTM passes your values on every call, so your settings win.
- **Specialists:** the security, data and screen reviewers, each with the paths that call it in.
  A specialist reviews a task only when a changed path matches one of its triggers; `off`
  removes it.
- **Limits:** how many [correction rounds](/reference/glossary/#correction-round) a task gets,
  the [file limit for a fix](/reference/glossary/#file-limit-for-a-fix) before it grows into a
  [Feature](/reference/glossary/#feature), how well the [mockups](/reference/glossary/#mockups)
  must score and how many times they may be redrawn.

## Which limits can I change, and what do they do?

| Limit | Default | Its effect |
| --- | --- | --- |
| Correction rounds per task | 3 | past three, the plan is wrong, not the code: you choose what happens next |
| File limit for a fix | 3 files | a change above it grows into a Feature with a spec |
| Mockup threshold | 8/10, nothing left that the critic says must be fixed | a screen below it is redrawn |
| Mockup rounds | 3 | a screen is redrawn at most three times |

A correction round is the implementer fixing open findings, then the same reviewers checking again;
each round raises the implementer's effort one level. The file limit decides when a
[Fix](/reference/glossary/#fix) becomes a Feature. The design critic scores the mockups. The full
list, with the paths that make a task risky, is in [Settings](/reference/settings/).

## Where do the first values come from?

`/gtm:init` reads your project's [brief](/reference/glossary/#brief) and proposes the settings;
you approve or edit them in one pass. A few rules shape the proposal:

- a server with several accounts raises security;
- stored personal records raise data integrity;
- tight usage limits lower the effort of the roles that run most often first.

By default every role runs the strongest model, and roles differ by effort: high where a miss is
costly (security review, the final review), low where the plan carries the thinking (the
implementer). Mixing models adds ways to fail; effort is the cheaper and more predictable lever.
The cost is a higher price per token than a mixed team on simple tasks.

## How do I change them later?

Run `/gtm:tune`. It reads the evidence in your [logbook](/reference/glossary/#logbook), the run
and usage lines of past changes, proposes changes and records each one with its date in the
settings' history. You can also name the change yourself, for example a lower effort for one role.
`/gtm:retro` suggests a tune when a pattern appears across changes.

`/gtm:tune` also weighs the
[reflexes](/reference/roles/#which-thinking-methods-does-each-role-apply). When a reflex found
nothing in the last three measured runs of its role, it offers one card: keep it or drop it.
Nothing is dropped without your answer. A drop adds a reflexes section to the settings, dated,
with a line in the history; until then the section does not exist and every reflex applies. A
later card can restore a dropped one.

The task review also plants a few small bugs ([mutations](/reference/glossary/#mutation)) to
check that the tests catch them. When the last three measured runs that planted any let none
survive, `/gtm:tune` offers one card: keep the step or switch it off. An approved switch-off writes
a dated line in the settings, with a line in the history; until then no such line exists and the
step runs. A later card can switch it back on, which removes the line.

| Setting | Values |
| --- | --- |
| Effort | `low`, `medium`, `high`, `xhigh`, `max` |
| Model | `opus`, `sonnet`, `haiku`, `fable`, a full model id, or `inherit` |

## Why are these my decision and not GTM's?

A banking backend and a weekend prototype should not run the same team. How much security, data
integrity, UX, performance, speed and cost matter is decided per project, written down once with
its reasons and dates, and revisited with evidence. It costs a few minutes at setup, and settings
that are never tuned drift away from the project.
