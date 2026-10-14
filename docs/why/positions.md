---
title: Positions
description: The fifteen stances GTM takes, each with its reason and its cost.
---

::: callout summary
- **You will learn:** the fifteen stances GTM takes, why, and what each one costs you.
- **Reading time:** 6 minutes.
- **Before this:** [Principles](/why/principles/).
:::

These are deliberate trade-offs, not universal truths. Where a project needs otherwise, its
config, its [team settings](/reference/glossary/#team-settings) or its
[conventions](/reference/glossary/#conventions) can say so, and the change is recorded.
Disagreeing with one is a good reason to open an issue.

## What does GTM stand for, and at what cost?

::: grids

::: grid

### 1. Light over complete

The smallest process that keeps quality: three sizes of change, few files, short pages. Every
extra document is read by someone, or ignored, and both cost. Templates skip what a size does
not need, and there is no requirements or architecture document unless a decision demands one.

<p class="gtm-cost">Cost: some decisions are made in a plan rather than in an architecture document of their own.</p>

:::

::: grid

### 2. Three checkpoints

For each [Feature](/reference/glossary/#feature) you approve the
[mockups](/reference/glossary/#mockups), approve the [Summary](/reference/glossary/#summary) and
give the go; these are its [checkpoints](/reference/glossary/#checkpoint). Everything else is
settled inside the team and listed as
[decisions made for you](/reference/glossary/#decisions-made-for-you), and kept in the
[logbook](/reference/glossary/#logbook). The decisions that are yours are few; buried among
status updates, they get lost.

<p class="gtm-cost">Cost: the team will sometimes decide as you would not have; the list and the logbook make that cheap to overturn.</p>

:::

::: grid

### 3. Evidence before claims

No "done", "fixed" or "passing" without the command and its result, and what was not checked is
said plainly. Agents never claim a check they did not run, reviewers cite file and line, and the
final review runs the checks again. A confident claim without evidence is the dearest error to
find later.

<p class="gtm-cost">Cost: reports run slightly longer, and checks take time.</p>

:::

::: grid

### 4. Tests first

A failing test comes before the code, and every acceptance line of the spec has its test. The
failing run proves the test can fail, and acceptance lines written in a fixed form turn the spec
into tests directly. The implementer's method, the reviewer's checks and `guidelines/tests.md`
hold to it.

<p class="gtm-cost">Cost: slower first commits on exploratory work.</p>

:::

::: grid

### 5. Verdicts in your chat, reports on disk

Agents receive paths to files and answer in ten lines at most; their full reports live on disk,
and the workflows keep intermediate results in their own variables. Your conversation holds
verdicts, not transcripts, which saves context and usage.

<p class="gtm-cost">Cost: one more report file per task in the project's .gtm/ folder.</p>

:::

::: grid

### 6. Specialists only where they matter

Security, data and screen reviewers run only when a change touches their ground, decided by path
patterns your project owns in `team.md`. A specialist on every task is expensive noise; a
specialist missing on the task that needed it is a hole. Path rules make the choice explicit and
open to review.

<p class="gtm-cost">Cost: a path rule that is too narrow misses a change; a tune of the settings catches it, and so does the final review on a branch that has one.</p>

:::

::: grid

### 7. One strong model, effort by role

By default every role runs the strongest model, and roles differ by how hard they think: high
where a miss is costly, such as security and the final review, low where the plan carries the
thinking, such as implementation. Mixing models adds ways to fail; effort is the cheaper and more
predictable lever.

<p class="gtm-cost">Cost: a higher price per token than a mixed fleet on simple tasks.</p>

:::

::: grid

### 8. Your priorities, recorded and revisited

How much security, data integrity, screens, performance, speed and cost matter is decided per
project at `/gtm:init`, written down once with reasons and dates, and revisited with evidence
through `/gtm:tune`. A banking backend and a weekend prototype should not run the same team, and
nobody should restate their priorities every session.

<p class="gtm-cost">Cost: a few minutes at the start, and settings that drift if never revisited.</p>

:::

::: grid

### 9. Security and data integrity come first

An insecure or data-losing change never ships, whatever the size or the deadline: these failures
cannot be apologised away or rolled back. A schema, migration or sign-in change is a Feature from
the start, the security and data reviewers check every change on their ground, their findings
always block the task, and the final review reads security and data first.

<p class="gtm-cost">Cost: specialist reviews at the highest effort, and now and then a blocked task.</p>

:::

::: grid

### 10. Nothing pushed, merged or released without your go

Agents never push, merge, tag or release; the main session does it only after your explicit go
for that exact action, through `/gtm:ship` and `git.push: ask` in the config. Shipping is the
decision with consequences outside the repository.

<p class="gtm-cost">Cost: one message per branch.</p>

:::

::: grid

### 11. Keep history, no squash by default

Merge commits, small logical commits, and pushed history is never rewritten. The history is the
record of how a decision was carried out, and bisect needs it. A project may choose squash in
`git.merge`, and the choice is recorded.

<p class="gtm-cost">Cost: a longer log.</p>

:::

::: grid

### 12. Plain language, in your own language

Verdict first, short sentences, no jargon where a plain word exists, in the language you chose;
code, commits and docs in the code language. Reading in a second language costs attention, and
jargon hides weak reasoning.

<p class="gtm-cost">Cost: two languages to keep consistent in some projects.</p>

:::

::: grid

### 13. Cite sources, credit inspirations

Claims about libraries or behaviour say where they come from, reviewers give file and line, and
ideas taken from other methods are credited in [Where GTM comes from](/why/credits/). That gives
you traceability, and it is honest towards the people whose work GTM builds on.

<p class="gtm-cost">Cost: a line or a link.</p>

:::

::: grid

### 14. Accessibility is a rule, not a polish item

Targets, contrast, keyboard access and accessible names are hard rules, and a failure is an
important finding. An inaccessible screen is a broken screen for some users, and fixing it late
costs more. The design critic measures them and the screen reviewer checks every screen change.

<p class="gtm-cost">Cost: stricter design rounds and an automated check per screen and theme.</p>

:::

::: grid

### 15. GTM serves the project, it does not sign it

What GTM writes into a project belongs to the project and reads in its voice. With
[stealth](/reference/glossary/#stealth) on, GTM leaves no trace at all: no files in the tracked
tree, no names, no trailers, checked by a scan before every ship. A project's history and docs
are read by its maintainers for years, and a tool's vocabulary there is noise. Stealth changes
what GTM writes, not the rules an organisation or a project sets on AI tools and disclosure:
follow those.

<p class="gtm-cost">Cost: with stealth on, the team's memory stays on one machine and teammates do not inherit it, and the scan before shipping can stop on a false alarm.</p>

:::

:::

<div class="page-navigation gtm-pager">
<a href="../principles/" class="prev-page"><span class="arrow" aria-hidden="true">&larr;</span><span><small>Previous</small><strong>Principles</strong></span></a>
<a href="../credits/" class="next-page"><span><small>Next</small><strong>Where GTM comes from</strong></span><span class="arrow" aria-hidden="true">&rarr;</span></a>
</div>
