---
name: spec
description: "Write a GTM spec with the architect and present its summary for approval. Use when a Feature or Milestone needs one."
argument-hint: "[feature slug]"
---
# Spec (checkpoint 2: approve the summary)

Ground rules: as in the `gtm` skill §0.

## 1. Write
Dispatch `gtm:architect` (spec mode) with: the request, the track, the validated mockup page path (if
any), decisions already taken, an escalated Fix's `open` findings (each one a requirement with
its test, a missing review as owed, as `/gtm:deliver` §2 says), and the output path
`<root>/specs/<YYYY-MM-DD>-<slug>.md`.
An amend (a dig pick from `/gtm:brief-me`): instead, the existing spec path and the picked
option; the architect edits that file in place, same path, Decisions and approval history kept,
and §3's checkpoint reopens.
Template: `${CLAUDE_PLUGIN_ROOT}/templates/spec.md`. When it returns, append its progress line
(`spec`) as `/gtm:deliver` §1 says, and one more after
each send-back (§2) and each reopening (§3); a phase's lines are summed in the run line.

A small Feature (`gtm` skill §1, as the track pick said): dispatch it once, in one-pass mode,
adding the plan inputs of `/gtm:plan` §1; it writes the spec, then the plan, following each card's
recommended option; its progress line reads `spec+plan`. That line
counts as the run line's `spec` phase; a later plan rewrite (`/gtm:plan` §1) appends its own
`plan` line.

## 2. Check before showing anything
- The Summary block exists, ≤ 10 lines, in `language.human`, and holds the estimate line;
  otherwise send the spec back to the architect, once.
- Every acceptance line is EARS and testable.
- `grep -c "NEEDS CLARIFICATION"` is 0 outside the Open questions heading; otherwise send the spec
  back to the architect with the list, once. Still open → they become decision cards.
- No "how" in the what-and-why section (no file names, no libraries).

## 3. Present
Show the Summary block, its estimate line included, and the open decision cards. Nothing else
unless the detail level asks for it. The human answers the cards; write the answers into the
Decisions table, set `Status: approved by the human on <date>`. Rulings the architect took go to
the ledger. In one pass, when every card is answered as recommended and the spec is unchanged
since the one pass wrote the plan (no §2 correction round, no edit but this step's Decisions and
Status), end that line with `; plan kept from the one pass`.

Changing the spec later reopens this checkpoint, and drops that ending.
