# <Feature>: spec

> Track: <Feature | Milestone>. Date: <YYYY-MM-DD>. Mockups: <board path or "none">.
> Status: draft | approved by the human on <date>.

## For you
<At most ten lines, in the human's language: what this builds, why now, what you must decide
(each as a decision card below), and my recommendation. Read this and the cards; the rest is for
the team.>

## What and why
<What changes for the user, and why. No how: no file names, no libraries.>

Success looks like: <one measurable sentence>.

## Out of scope
- <What this spec does not do, and where it goes instead.>

## Acceptance (EARS)
Each line is testable and becomes at least one test.
- THE SYSTEM SHALL <always-true behaviour>.
- WHEN <event> THE SYSTEM SHALL <response>.
- WHILE <state> THE SYSTEM SHALL <behaviour>.
- WHERE <optional feature is present> THE SYSTEM SHALL <behaviour>.
- IF <unwanted condition> THEN THE SYSTEM SHALL <safe response>.

## Decisions
| # | Decision | Choice | Why | Status |
| --- | --- | --- | --- | --- |
| D1 | <question> | <choice> | <one line> | proposed / approved |

Open decision cards (the human answers these; zero left before the plan):

```
Decision: <question>
Options:  A. … · B. …
I recommend: <letter>, because …
Cost if wrong: …
```

## Screens
<Only when screens change: one short block per screen, pointing at the validated board.>

## Data, security, accessibility
<Only what this feature changes: new data and who can see it, the trust boundary, a11y points.>

## Open questions
`[NEEDS CLARIFICATION: <question>]` markers live here and inline. **Zero before the plan.**
