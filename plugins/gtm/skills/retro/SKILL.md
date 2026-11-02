---
name: retro
description: "Turn a shipped GTM branch into ledger lessons and guideline proposals; close resolved minors. Use when a branch has shipped."
argument-hint: "[slug]"
---
# Retro: make the next plan smarter

Ground rules: as in the `gtm` skill §0.

- Reflexes (${CLAUDE_PLUGIN_ROOT}/templates/methods/reflexes.md): Five Whys [brain], Hindsight
  Reflection [elicitation], Lessons Learned Extraction [elicitation].

## 1. Read
`<root>/reports/<slug>/` (progress, task reports, final review), the spec and plan, and the whole
ledger. Guideline edits follow `<root>/guidelines/voice.md`.

## 2. Distil
- **Lessons:** what would have saved a correction round, a blocked task or a final-review finding. One line
  each, phrased as a rule to keep (`- <date> · <slug> · lesson · <rule>`). At most five; fewer is
  better. Skip what a test or a lint rule now enforces. A lesson a reflex found ends with its
  lens tag, `(lens: <method name>)`: tune counts it.
- **Guidelines:** a lesson seen in two branches or more belongs in a guideline. Propose the edit
  (file, the line to add) as a decision card; apply on the human's answer.
- **Minors:** strike through (`~~ ~~`) the ones fixed since, with a `resolved` line naming them.
- **Superseded:** strike entries a newer one contradicts; never delete.
- **Sheets:** count, per sheet, across the `sheets` segments of every `run` line not struck through:
  runs, passes, findings by severity. A line without the segment counts for no sheet. A sheet with
  0 findings of any severity over the last 3 runs that name it gets one decision card: remove it or
  keep it. A sheet lives in the plugin: retro never edits or deletes it, and its removal is the
  human's, a reviewed commit there. Either answer is a `ruling` line; a kept sheet is proposed
  again only after 3 runs newer than that line.

## 3. Spot patterns for /gtm:tune
Suggest `/gtm:tune` in one line when the `run` lines show: correction rounds hitting the cap in two runs
or more; a specialist that found nothing across three runs it ran on; a final-review finding a
specialist should have caught; design loops ending at the last round; `usage` notes about limits.

## 4. Report
TL;DR (lessons added, guideline proposals, minors closed), the sheets' counts in one table (sheet,
runs, passes, findings `c/i/m`) when a line has them, then the decision cards, if any.
