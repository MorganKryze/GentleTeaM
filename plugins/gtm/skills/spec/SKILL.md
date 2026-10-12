---
name: spec
description: Write a GTM spec with the architect - For-you synthesis, what and why, EARS acceptance lines, decision cards, zero NEEDS CLARIFICATION - and present the synthesis for the human's approval. Use for a Feature or Milestone after the board is approved.
argument-hint: "[feature slug]"
---
# Spec (touchpoint 2: approve the synthesis)

Ground rules: as in the `gtm` skill §0.

## 1. Write
Dispatch `gtm:architect` (spec mode) with: the request, the track, the validated board path (if
any), decisions already taken, and the output path `<root>/specs/<YYYY-MM-DD>-<slug>.md`. Template:
`${CLAUDE_PLUGIN_ROOT}/templates/spec.md`.

## 2. Check before showing anything
- The For-you block exists, ≤ 10 lines, in `language.human`.
- Every acceptance line is EARS and testable.
- `grep -c "NEEDS CLARIFICATION"` is 0 outside the Open questions heading; otherwise send the spec
  back to the architect with the list, once. Still open → they become decision cards.
- No "how" in the what-and-why section (no file names, no libraries).

## 3. Present
Show the For-you block and the open decision cards. Nothing else unless the detail level asks for
it. The human answers the cards; write the answers into the Decisions table, set
`Status: approved by the human on <date>`. Rulings the architect took go to the ledger.

Changing the spec later reopens this touchpoint.
