---
name: retro
description: GTM compound step - distil a delivered branch's reports into one-line ledger lessons, propose guideline changes for recurring lessons, close resolved minors, and suggest /gtm:tune when the ledger shows a pattern. Use after shipping, or when the ledger grows noisy.
argument-hint: "[slug]"
---
# Retro: make the next plan smarter

Ground rules: as in the `gtm` skill §0.

## 1. Read
`<root>/reports/<slug>/` (progress, task reports, final review), the spec and plan, and the whole
ledger. Guideline edits follow `<root>/guidelines/voice.md`.

## 2. Distil
- **Lessons:** what would have saved a fix round, a blocked task or a final-review finding. One line
  each, phrased as a rule to keep (`- <date> · <slug> · lesson · <rule>`). At most five; fewer is
  better. Skip what a test or a lint rule now enforces.
- **Guidelines:** a lesson seen in two branches or more belongs in a guideline. Propose the edit
  (file, the line to add) as a decision card; apply on the human's answer.
- **Minors:** strike through (`~~ ~~`) the ones fixed since, with a `resolved` line naming them.
- **Superseded:** strike entries a newer one contradicts; never delete.

## 3. Spot patterns for /gtm:tune
Suggest `/gtm:tune` in one line when the `run` lines show: fix rounds hitting the cap in two runs
or more; a specialist that found nothing across three runs it ran on; a final-review finding a
specialist should have caught; design loops ending at the last round; `usage` notes about limits.

## 4. Report
TL;DR (lessons added, guideline proposals, minors closed), then the decision cards, if any.
