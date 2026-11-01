# <Feature>: spec

> Track: <Feature | Milestone>. Date: <YYYY-MM-DD>. Mockups: <mockup page path or "none">.
> Brainstorm: <note path or none>.
> Status: draft | approved by the human on <date>.

## Summary
<At most ten lines, in the human's language: what this builds, why now, what you must decide
(each as a decision card below), and my recommendation. Read this and the cards; the rest is for
the team. Last line, the estimate: `<n> tasks × <m> min + <phase> <m> min, ... ≈ <W> min, <T>k
tokens (medians of the last <k> measured runs)`, or `no measured run yet`.>

## What and why
<What changes for the user, and why. No how: no file names, no libraries.>

Success looks like: <one measurable sentence>.

## Out of scope
- <What this spec does not do, and where it goes instead.>

## Acceptance (EARS)
Each line is numbered, testable, and becomes at least one test.
- A1 THE SYSTEM SHALL <always-true behaviour>.
- A2 WHEN <event> THE SYSTEM SHALL <response>.
- A3 WHILE <state> THE SYSTEM SHALL <behaviour>.
- A4 WHERE <optional feature is present> THE SYSTEM SHALL <behaviour>.
- A5 IF <unwanted condition> THEN THE SYSTEM SHALL <safe response>.

## Decisions
One row per decision: `D<n>` for what the human answers, `R<n>` for what the team decides alone.

A cost says what the choice makes worse and for whom, even when the choice is right, and what
undoing it costs. A confirmation names one or more of: an acceptance line of this spec (`A<n>`), a
`verify` key of the gate (`verify.<key>`), `review: <role>`. A review is named only when the
decision cannot be measured.

| # | Decision | Choice | Why | Cost if wrong | Confirmation | Status |
| --- | --- | --- | --- | --- | --- | --- |
| D1 | <question> | <choice> | <one line> | <what gets worse, for whom, what undoing costs> | A1, verify.test, review: reviewer | proposed / approved |
| R1 | <what the team decided> | <choice> | <one line> | <what gets worse, for whom, what undoing costs> | A2 | ruling |

Open decision cards (the human answers these; zero left before the plan), as plain Markdown in
the human's language, never in a code fence:

**Decision D1: <question>**

Criteria: <what the choice is judged on, one line, before any option>.

| Option | What it means |
| --- | --- |
| **A** <name> | <one line> |
| **B** <name> | <one line> |

**I recommend: <letter>**, <why, one line>. **Cost if wrong:** <one line>.

The title stays on one line and carries its `D<n>`; the labels follow the human's language. The
second reading adds its objection after the recommendation: `/gtm:spec` writes it, you never do.

## Screens
<Only when screens change: one short block per screen, pointing at the validated mockup page.>

## Data, security, accessibility
<Only what this feature changes: new data and who can see it, the trust boundary, a11y points.>

## Open questions
`[NEEDS CLARIFICATION: <question>]` markers live here and inline. **Zero before the plan.**
