# Principles: sparing the human's attention

> GTM's central principle is that the human developer's attention is the scarcest resource in an
> agent team. Agents can produce reports, specs and reviews faster than anyone can read them; GTM
> spends that capacity inside the team and hands the human only verdicts, decisions and visuals.
> This page states the six rules that follow and where each GTM skill enforces them.

## 1. Every artifact for the human starts with "For you"
At most ten lines, in the human's language: what this is, why, what you must decide, and the
team's recommendation. The rest of the document is for the team.
Enforced by: the spec and plan templates, `/gtm:spec` (checks the block before showing anything),
`/gtm:brief-me`.

## 2. Decisions come as cards
A question, two or three options, a firm recommendation (the long-term option by default), and the
cost if the recommendation is wrong. Never a decision without a recommendation; never more than two
questions to pick a track.

**Decision: <the question>**

| Option | What it means |
| --- | --- |
| **A** <name> | <one line> |
| **B** <name> | <one line> |

**I recommend: A**, <why>. **Cost if wrong:** <one line>.

The card is plain Markdown in the human's language, never a code block, so it reads cleanly in the
terminal and in the editor.

Enforced by: the briefing format (`plugins/gtm/templates/briefing.md`), every skill.

## 3. Detail on demand, remembered
Before presenting an artifact, GTM uses the detail level stored for that kind of artifact (brief,
standard or deep). When none is stored and the config says `ask`, it asks one quick question and
stores the answer, so the question is never asked twice. `/gtm:brief-me` re-presents any artifact at
another level.
Enforced by: `briefing.detail` and `briefing.remembered` in `.gtm/config.yml`; the `gtm` skill's
ground rules.

## 4. One briefing format, in the human's language
Every human-facing message follows the same shape: a TL;DR with the verdict and the measure that
proves it (under five lines, the TL;DR is the whole answer); details from general to specific, one
idea per block, tables over lists; a Heads-up block only when something deviates; a Next-steps table
of who does what (you / me / blocked), omitted when there is nothing to do. No story of the path
taken, no recap. The language and emoji use come from the project config.
Enforced by: `plugins/gtm/templates/briefing.md`, referenced by every skill.

## 5. Visuals over prose
Mockups are PNG boards with captions; results are tables; a board is shown, not described.
Enforced by: the designer's hand-back contract, `/gtm:design`, `/gtm:brief-me`.

## 6. Three touchpoints per Feature, and the rulings listed
The human approves the scored mockup board, approves the spec synthesis, and gives the go to push,
merge or release. Everything else is settled inside the team. Every ruling the team took without
asking is listed at the end of the run under "Rulings I made", each with its cost if wrong, and
logged in the ledger, so any of them can be overturned.

| Track | Touchpoints |
| --- | --- |
| Fix | the 3-line design (with the track), the go |
| Feature | the board (if screens change), the spec synthesis, the go |
| Milestone | the decomposition, then per branch the Feature touchpoints |

Enforced by: the `gtm` router, `/gtm:design`, `/gtm:spec`, `/gtm:deliver`, `/gtm:ship`.

## The test
A GTM run is well behaved when the human could answer "what was decided, by whom, and what does it
cost if it is wrong?" without opening a single report.
