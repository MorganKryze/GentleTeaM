---
title: Your first Feature
description: Follow one Feature from your request to the merge, with what you see at each checkpoint.
---

::: callout summary
- **You will learn:** how a Feature runs, and what to reply at each of its three
  [checkpoints](/reference/glossary/#checkpoint).
- **Reading time:** 8 minutes.
- **Before this:** [GTM installed](/start/install/) in a project you can change.
:::

<nav class="gtm-tracker" aria-label="The six steps of this tutorial">
<p class="gtm-tracker-title">Six steps: you start the Feature, the team works, and you decide at the three amber checkpoints</p>
<ol>
<li><a href="#step-1"><span class="n">1</span><span class="t">Set up GTM</span><span class="w">You, once per project</span></a></li>
<li><a href="#step-2"><span class="n">2</span><span class="t">Ask for the change</span><span class="w">You, in one sentence</span></a></li>
<li class="is-you"><a href="#step-3"><span class="n">3</span><span class="t">The mockups</span><span class="w">Designer and critic</span><span class="s">Checkpoint 1</span></a></li>
<li class="is-you"><a href="#step-4"><span class="n">4</span><span class="t">The summary</span><span class="w">Architect</span><span class="s">Checkpoint 2</span></a></li>
<li><a href="#step-5"><span class="n">5</span><span class="t">Build and review</span><span class="w">Implementer and reviewers</span></a></li>
<li class="is-you"><a href="#step-6"><span class="n">6</span><span class="t">The go</span><span class="w">Reviewer, whole branch</span><span class="s">Checkpoint 3</span></a></li>
</ol>
<p class="gtm-tracker-roles">What each role does: <a href="/reference/roles/">Roles</a>.</p>
</nav>

## Where are you going?

You will ask GTM for a **theme toggle** in a small web app and follow it **to the merge**. A
[Feature](/reference/glossary/#feature) is one capability on one branch. It stops at three
checkpoints, the moments where you decide: the [mockups](/reference/glossary/#mockups) (each new
screen, light and dark), the [summary](/reference/glossary/#summary) of the
[spec](/reference/glossary/#spec) (the document that says what will be built and how it is
checked), and the go. You read three short messages and send three replies.

## Step by step

::: steps
::: step "Set up GTM once"
In your project, run `/gtm:init`. GTM reads the repository and drafts a one-page
[brief](/reference/glossary/#brief) and your [team settings](/reference/glossary/#team-settings)
(which roles run, and how hard each thinks). Approve or edit each one in a single reply.

::: callout see "In your terminal"
```text
/gtm:init

Brief drafted: a notes web app
  for people on the go.
Team settings drafted: 11 roles,
  security review on sign-in.

Reply "approved", or what to change.
```
Illustrative text. A recorded run will replace it.
:::
:::

::: step "Ask for the change"
Run the request in plain words. GTM asks at most two questions, then proposes the size of
process, here a Feature, and starts the team.

::: callout see "In your terminal"
```text
/gtm:gtm add a theme toggle
  to Settings

Proposed: a Feature, one branch,
  feat/theme-toggle.
Screens change: mockups first.
```
Illustrative text. A recorded run will replace it.
:::
:::

::: step "Checkpoint 1: look at the mockups"
The designer draws the new screen in light and dark, at phone and desktop widths, and a critic
scores it until it passes. Then you get the mockups and a
[decision card](/reference/glossary/#decision-card) for each open choice.

::: callout you "Your reply"
`approved`, or what to change in one sentence.
:::

::: callout see "In your terminal"
```text
Mockups ready: Settings with
  a theme toggle, light and dark,
  360 to 1280 px.
Critic score 9/10, nothing to fix.

D1: toggle in Settings or header?
  Recommended: Settings.
  Cost if wrong: one design round.
```
Illustrative text. A recorded run will replace it.
:::
:::

::: step "Checkpoint 2: approve the summary"
The architect writes the spec. You read its summary, ten lines at most, and answer each
decision card: a question with a recommendation and its cost if wrong.

::: callout you "Your reply"
`approved`, or a different answer to D1.
:::

::: callout see "In your terminal"
```text
Summary: theme toggle
- Light, Dark and System in
  Settings, kept per device.
- Not included: a theme per page.
- 3 tasks. No schema change.

D1: follow the system theme?
  Recommended: yes.
```
Illustrative text. A recorded run will replace it.
:::
:::

::: step "The team builds and reviews"
Each task is written test-first, then checked by a reviewer. A blocking finding starts a
[correction round](/reference/glossary/#correction-round). When every task is done, a
[final review](/reference/glossary/#final-review) checks the whole branch against the spec.
You are not asked anything unless the plan stops working.

::: callout see "In your terminal"
```text
Task 1/3 toggle: done.
Task 2/3 stored per device: done,
  1 correction round.
Task 3/3 Settings page: done.
Final review: clean.
```
Illustrative text. A recorded run will replace it.
:::
:::

::: step "Checkpoint 3: give the go"
You get the result and the [decisions made for you](/reference/glossary/#decisions-made-for-you),
each with its cost if wrong. Nothing is pushed until you reply.

::: callout you "Your reply"
`go`, and GTM pushes the branch and opens the pull request.
:::

::: callout see "In your terminal"
```text
Ready: theme toggle, 3 tasks,
  final review clean.

Decisions made for you (2):
- Stored on the device.
  Cost if wrong: one task.
- No toggle in the mobile header.
  Cost if wrong: one small change.
```
Illustrative text. A recorded run will replace it.
:::
:::
:::

## Checklist

<ul class="gtm-check">
<li><label><input type="checkbox"> I can tell my three checkpoints from the team's work.</label></li>
<li><label><input type="checkbox"> I know what to reply at each one: approved, a change, or go.</label></li>
<li><label><input type="checkbox"> I know nothing is pushed until I give the go.</label></li>
</ul>
