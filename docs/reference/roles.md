---
title: Roles
description: The eleven role agents, what each one does, and when it runs.
---

::: callout summary
- **You will learn:** what each of the eleven roles does, how hard it thinks, and when it runs.
- **Reading time:** 5 minutes, or look up one row.
- **Before this:** [Which size is my change?](/guides/which-size/) for the tracks.
:::

GTM ships eleven role agents. Each has one job, reads only the guidelines its role needs, and
writes its full report to a file you never have to open. Reviewers are read-only. Every role
runs Opus, Claude's largest model, and roles differ by effort (defined below); your
[team settings](/reference/glossary/#team-settings) can change any of them.

## Who does what, and when?

The words in the table and below it:

- **[Spec](/reference/glossary/#spec):** the document the architect writes before any code: what
  will be built, what is left out, and how each part is checked.
- **[Mockups](/reference/glossary/#mockups):** one page showing each new screen in light and dark.
- **[Correction round](/reference/glossary/#correction-round):** the implementer fixes the open
  findings, then the same reviewers re-check; three at most.
- **[Final review](/reference/glossary/#final-review):** one last check of the whole branch
  against the spec and the plan, once every task is done.
- **Effort:** how hard a role reasons, from low to xhigh. More effort finds more, and costs more
  of your plan.
- **[Dry run](/reference/glossary/#dry-run):** the architect runs a risky task's code in a
  scratch copy while planning, to prove the plan.
- **[Logbook](/reference/glossary/#logbook):** `.gtm/ledger.md`, one line per lesson, ruling or
  deferred finding.

| Role | Job | Effort | When it runs |
| --- | --- | --- | --- |
| `analyst` | sizes the request, drafts the setup | medium | sizing, `/gtm:init` |
| `designer` | draws the mockups | medium | mockup rounds |
| `design-critic` | scores the mockups by measuring; read-only | high | mockup rounds |
| `architect` | writes the spec and the task plan | high | after the mockups |
| `implementer` | one task, test-first; the only role that writes code | low, raised per round | every task |
| `reviewer` | checks the spec, then code quality; read-only | medium | every task |
| `security-reviewer` | trust boundaries, sign-in, secrets; read-only | xhigh | the diff touches its paths |
| `data-reviewer` | lost, duplicated or altered data; read-only | high | the diff touches its paths |
| `ux-qa` | captures and measures screens | medium | the diff touches screens |
| `final-reviewer` | the whole branch against the spec; read-only | xhigh | once per branch |
| `release-qa` | the live journey after you deploy | low | after deployment |

## What happens when a reviewer finds something?

```mermaid
---
config:
  themeVariables:
    fontFamily: Helvetica Neue, Helvetica, Arial, sans-serif
    fontSize: 16px
  htmlLabels: false
  flowchart:
    htmlLabels: false
    useMaxWidth: false
    nodeSpacing: 24
    rankSpacing: 30
    padding: 12
---
flowchart TD
  I[Implementer<br/>commits a task] --> R[Reviewers check it]
  R -->|clean| D[Task done]
  R -->|blocking| F[Correction round:<br/>fix, then re-check]
  F -->|rounds 1 to 3| R
  F -->|after 3 rounds| Y([You choose:<br/>revise the plan,<br/>accept and log the findings,<br/>or take over]):::you
  classDef you stroke-width:1px
```

How to read it: you appear only when three correction rounds were not enough.

## How severe is a finding?

| Severity | Meaning | Effect |
| --- | --- | --- |
| `critical` | wrong data, a crash, a security hole | blocks the task, starts a correction round |
| `important` | a spec gap, a bug a person hits, an accessibility failure | blocks the task, starts a correction round |
| `minor` | polish, coverage, style | written to the logbook, sorted at the final review |
