---
title: Your first Feature
description: Follow one Feature from your request to the merge, with what you see at each checkpoint.
---

::: callout summary
- **You will learn:** how a Feature runs, and what to reply at each of its three
  [checkpoints](/reference/glossary/#checkpoint).
- **Reading time:** 9 minutes.
- **Before this:** [GTM installed](/start/install/) in a project you can change.
:::

<nav class="gtm-tracker" aria-label="The six steps of this tutorial">
<p class="gtm-tracker-title">Six steps: you start the <a href="/reference/glossary/#feature">Feature</a>, the team works, and you decide at the three amber <a href="/reference/glossary/#checkpoint">checkpoints</a></p>
<ol>
<li><a href="#step-1"><span class="n">1</span><span class="t">Set up GTM</span><span class="w">You, once per project</span></a></li>
<li><a href="#step-2"><span class="n">2</span><span class="t">Ask for the change</span><span class="w">You, in one sentence</span></a></li>
<li class="is-you"><a href="#step-3"><span class="n">3</span><span class="t">The mockups</span><span class="w">Skipped here: no screens</span><span class="s">Checkpoint 1</span></a></li>
<li class="is-you"><a href="#step-4"><span class="n">4</span><span class="t">The summary</span><span class="w">Architect</span><span class="s">Checkpoint 2</span></a></li>
<li><a href="#step-5"><span class="n">5</span><span class="t">Build and review</span><span class="w">Implementer and reviewers</span></a></li>
<li class="is-you"><a href="#step-6"><span class="n">6</span><span class="t">The go</span><span class="w">Reviewer, whole branch</span><span class="s">Checkpoint 3</span></a></li>
</ol>
<p class="gtm-tracker-roles">What each role does: <a href="/reference/roles/">Roles</a>.</p>
</nav>

## Where are you going?

This page follows one real run. GTM 0.11.0 added **due dates** to
[gtm-sample-todo](https://github.com/MorganKryze/gtm-sample-todo), a small Node todo CLI, and took
them **to the merge** in [pull request #1](https://github.com/MorganKryze/gtm-sample-todo/pull/1).
A [Feature](/reference/glossary/#feature) is one capability on one branch. It stops at three
checkpoints, the moments where you decide: the [mockups](/reference/glossary/#mockups) (each new
screen, light and dark), the [summary](/reference/glossary/#summary) of the
[spec](/reference/glossary/#spec) (the document that says what will be built and how it is
checked), and the go.

The whole run took 33 minutes from the sample's first commit to the merge, about 0.33M tokens, and
one human answer, at set-up. After that the human handed the decisions to GTM, so the replies below
are the ones GTM recorded for them. The excerpts come from the run's files, shortened.

## Step by step

::: steps
::: step "Set up GTM once"
In your project, run `/gtm:init`. GTM reads the repository and drafts a one-page
[brief](/reference/glossary/#brief) and your [team settings](/reference/glossary/#team-settings)
(which roles run, and how hard each thinks). Approve or edit each one in a single reply. Here it
took 5 minutes, and the one reply was `A, A`: both drafts as proposed.

::: callout see "In your terminal"
```text
/gtm:init

Brief: a tiny command-line todo
  list: todo add <text>,
  todo done <id>, todo list.
Team: data-reviewer on src/todo.js.
  designer, design-critic, ux-qa:
  off, no screens.

> A, A
```
From the sample's brief and team settings, shortened.
:::
:::

::: step "Ask for the change"
Run `/gtm:gtm` with your request in plain words. Here it ran with no request at all, so GTM
proposed a brainstorm. In under a minute the brainstorm kept one idea, due dates, and the request
came from its note. GTM sized it as a small Feature on one branch.

::: callout see "In your terminal"
```text
/gtm:gtm
  1. /gtm:brainstorm (recommended:
     no request and no run)
  2. a request of yours

Kept: due dates. todo add buy milk
  --due 2026-11-02, list shows the
  date and marks overdue items.

Feature, small (~4 files).
  data-reviewer on src/todo.js.
```
From the run log and the brainstorm note, shortened.
:::
:::

::: step "Checkpoint 1: the mockups"
When a Feature changes a screen, the designer draws it in light and dark and a critic scores it
before you see it. In this run checkpoint 1 is skipped because the project has no screens: the
sample is a command-line tool, and its settings say `design.screens: false`. On a project with
screens, this is where you read the mockups and reply. [Which size is my
change?](/guides/which-size/) shows the three checkpoints and when the first one is skipped.

::: callout you "Your reply"
None here. With screens: `approved`, or what to change in one sentence.
:::
:::

::: step "Checkpoint 2: approve the summary"
The architect wrote the spec and the plan in one pass, in 3.5 minutes. You read the spec's
summary and answer each [decision card](/reference/glossary/#decision-card): a question with a
recommendation and its cost if wrong. A pre-mortem dig on the spec found one point, `--due` placed
before the text, which the plan already covers, so it was left as is.

::: callout you "Your reply"
`A A`: overdue on the local calendar date, and `list` keeps the id order.
:::

::: callout see "In your terminal"
```text
Summary
A todo can carry a due date:
  todo add <text> --due YYYY-MM-DD.
  list shows the date after the text
  and writes overdue on an open todo
  whose date has passed.
Guards: an old todo.json without a
  due date loads as it is; a bad date
  is refused, never stored; the time
  zone never shifts a date.
To decide: two cards. I recommend A
  for both.
```
The summary was written in French, the human's language; this is a translation, shortened.
:::
:::

::: step "The team builds and reviews"
Each task is written test-first, then checked by a reviewer. A blocking finding starts a
[correction round](/reference/glossary/#correction-round). Here both tasks came back clean in 10
minutes, each checked by the reviewer and by the data reviewer, which the settings call in for
`src/todo.js`. You are not asked anything unless the plan stops working.

::: callout see "In your terminal"
```text
task 1 · CLEAN · 0 rounds
  reviewer, data-reviewer
task 2 · CLEAN · 0 rounds
  reviewer, data-reviewer
```
From the run's progress file, shortened.
:::
:::

::: step "Checkpoint 3: give the go"
A [final review](/reference/glossary/#final-review) checks the whole branch against the spec. Here
it planted 8 small bugs in the code and 4 of them passed the tests. GTM added 4 tests, the review
ran again and said ready, 13 minutes in all. You then get the result and the
[decisions made for you](/reference/glossary/#decisions-made-for-you). Nothing is pushed until you
reply. The pull request text was checked for plain writing before it was opened.

::: callout you "Your reply"
`go`, and GTM pushes the branch and opens the pull request. Here it merged a minute later.
:::

::: callout see "In your terminal"
```text
Final review: fix-first.
  4 of 8 mutations survive: plain
  add, the time zone, the message,
  done drops the due date.
Fix: 1 test commit, 19 tests.
Re-review: ready.

PR #1 opened and merged (4266a86).
```
From the final review and the run log, shortened.
:::
:::
:::

## Checklist

<ul class="gtm-check">
<li><label><input type="checkbox"> I can tell my three checkpoints from the team's work.</label></li>
<li><label><input type="checkbox"> I know what to reply at each one: approved, a change, or go.</label></li>
<li><label><input type="checkbox"> I know nothing is pushed until I give the go.</label></li>
</ul>
