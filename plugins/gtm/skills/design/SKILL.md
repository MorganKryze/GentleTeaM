---
name: design
description: Run the GTM design loop - the designer drafts PNG mockup boards, the design critic scores them against the project guideline until the bar is met - then present the scored board for the human's approval. Use for a Feature that changes screens, before the spec.
argument-hint: "[feature slug or brief]"
---
# Design loop (touchpoint 1: approve the board)

Ground rules: as in the `gtm` skill §0 (root, config, team profile, briefing format, detail level).
Skip this skill when `design.screens` is false or no screen changes; say so in one line.

## 1. Brief the designer
Write `<root>/mockups/<slug>/brief.md` (≤ 20 lines): the feature, the screens, the states (empty,
error, loading, long text), constraints from the brief and spec, decisions already taken.

## 2. Run the loop
Run the workflow `gtm:design-loop` with args:
`{ brief: <brief text>, outDir: "<design.mockups>/<slug>", guideline: "<root>/guidelines/design.md",
threshold: <team: design threshold>, maxRounds: <team: design rounds>,
team: { designer: {model, effort}, "design-critic": {model, effort} } }`.

## 3. Present the board
Visuals first: open each PNG (Read it) and give the human the paths; no prose description of what
the image already shows. Then, per the briefing format:
- TL;DR: passed or not, score, rounds (e.g. "Board ready: 8.5/10 after 2 rounds, 0 must-fix").
- The decisions the board's top line lists, each as a decision card.
- Should-fix items left, only if the human asked for standard or deep detail.
- Not passed after the last round: a Heads-up and one decision card (approve as is / one more
  round with your direction / change the brief), with your recommendation.

The human's approval makes the board the validated mockup; its path goes in the spec. Write
`design: <rounds> rounds, <score>/10` as the first line of `<root>/reports/<slug>/progress.md`, for
the ledger's `run` line.
