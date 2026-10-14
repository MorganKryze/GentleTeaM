---
name: design
description: Run the GTM design loop - the designer drafts PNG mockup pages, the design critic scores them against the project guideline until the bar is met - then present the scored mockup page for the human's approval. Use for a Feature that changes screens, before the spec.
argument-hint: "[feature slug or brief]"
---
# Design loop (checkpoint 1: approve the mockups)

Ground rules: as in the `gtm` skill §0 (root, config, team settings, briefing format, detail level).
Skip this skill when `design.screens` is false or no screen changes; say so in one line.

## 1. Brief the designer
Write `<root>/mockups/<slug>/brief.md` (≤ 20 lines): the feature, a `Screens` list of one
`<screen>: <what it shows, its states (empty, error, loading, long text)>` line per screen, each
`<screen>` a slug (a-z, 0-9, -), constraints from the brief and spec, decisions already taken.

## 2. Run the loop
Run the workflow `gtm:design-loop` with args:
`{ brief: <brief text>, outDir: "<design.mockups>/<slug>", screens: [<the Screens slugs, in order>],
guideline: "<root>/guidelines/design.md", threshold: <team: design threshold>, maxRounds: <team:
design rounds>, team: { designer: {model, effort}, "design-critic": {model, effort} } }`.
Two screens or more run at once, one designer and one critic each, in `<outDir>/<screen>`; each
screen has its own rounds, and the run passes only when every screen passed.

## 3. Present the mockups
Visuals first: open each PNG (Read it) and give the human the paths; no prose description of what
the image already shows. Then, per the briefing format:
- TL;DR: passed or not, score, rounds (e.g. "Mockups ready: 8.5/10 after 2 rounds, 0 must-fix").
- The decisions the mockup page's top line lists, each as a decision card.
- Should-fix items left, only if the human asked for standard or deep detail.
- Not passed after the last round: a Heads-up and one decision card (approve as is / one more
  round with your direction / change the brief), with your recommendation.
- Two screens or more: each screen's mockup page in the brief's order, then one table (screen, score,
  rounds, must-fix) and one approval for all. A screen sent back reruns alone: `screens` omitted,
  the brief with that screen's line and the human's direction, `outDir` its folder.

The human's approval makes the mockup page the validated mockup; its path goes in the spec. Write
`design: <rounds> rounds, <score>/10` (several screens: `design: <n> screens, <most> rounds, lowest
<score>/10`) as the first line of `<root>/reports/<slug>/progress.md`, for the ledger's `run` line,
ending as `/gtm:deliver` §1 says: the measures summed over every design-loop run of the mockup page, a
screen rerun and one more round included, and `· run <id>` for each.
