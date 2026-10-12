---
name: gtm
description: GentleTeaM entry point. Use when starting any piece of work with GTM - explains the method in a few lines, picks the track (Fix, Feature, Milestone) with at most two questions, and routes to the right GTM skills.
argument-hint: "[what you want done]"
---
# GTM: the light agent team

GTM runs a small team of role agents for you. You see three touchpoints per Feature (approve the
board, approve the spec synthesis, give the go); the team settles everything else and lists its
rulings at the end. Everything the human reads follows the human briefing format.

## 0. Ground rules (every GTM skill)
- **GTM root:** `.gtm/` unless the project CLAUDE.md says `GTM root: <path>`. No root: offer
  `/gtm:init` in one line and stop.
- Read `<root>/config.yml` and `<root>/team.md`. Every human-facing message follows
  `${CLAUDE_PLUGIN_ROOT}/templates/briefing.md`, in `language.human`.
- Dispatch roles as `gtm:<role>` with the model and effort the team profile gives that role, on
  every dispatch (the profile wins over the agent's defaults). Pass the same values to workflows in
  `args.team`.
- Hand-offs are files: give agents paths, never paste documents. Keep their hand-backs out of the
  human's view unless something deviates.
- **Detail level:** before presenting an artifact, use `briefing.remembered.<kind>`, else
  `briefing.detail`; when that is `ask`, ask one question (brief / standard / deep) and store the
  answer under `briefing.remembered.<kind>`.
- Nothing is pushed, merged, tagged or released without the human's explicit go.

## 1. Pick the track (≤ 2 questions)
Request: $ARGUMENTS

Clear and small: judge it yourself. Otherwise dispatch `gtm:analyst` with the request and the root.

| Track | When | Flow | Human touchpoints |
| --- | --- | --- | --- |
| **Fix** | ≤ Fix ceiling files (team profile, 3 by default), no schema, migration, auth, trust boundary or stored-data surface | 3-line design in chat → implementer + reviewer | approve the 3-line design, then the go |
| **Feature** | one capability, one branch | design-loop if screens change → spec → plan → deliver per task → final review | board, spec synthesis, go |
| **Milestone** | several branches, a new surface | decomposition into sub-features, then the Feature flow per branch, final review per branch | decomposition, then per branch: board, spec, go |

Present the track with its reason and at most two decision cards in **one** message. For a Fix,
include the 3-line design (what changes, where, how it is proven) in that same message.

Escalation is automatic and one-way: a Fix that grows past the ceiling or touches a schema or
security surface becomes a Feature (say so in a Heads-up). Nothing downgrades mid-task.

## 2. Route
- **Fix:** write `<root>/reports/<slug>/brief.md` (the approved 3 lines plus the test that proves
  it), create the branch as `git` says, run the workflow `gtm:deliver-task` with `track: "fix"`
  (args as `/gtm:deliver` builds them). `ESCALATE` → continue as a Feature from `/gtm:spec`; the
  commits stay. `CLEAN` → present the result and ask the go (`/gtm:ship`).
- **Feature:** `/gtm:design` (only if screens change and `design.screens` is true) → `/gtm:spec` →
  `/gtm:plan` → `/gtm:deliver` → `/gtm:ship`. Invoke each skill in turn; stop only at a touchpoint.
- **Milestone:** dispatch `gtm:architect` to write `<root>/specs/<date>-<slug>-milestone.md`: the
  sub-features, one branch each, their order and dependencies, ≤ 1 page with a For-you block.
  Present it (touchpoint), then run the Feature flow per sub-feature.

## 3. End every run with
The result per the briefing format, then **Rulings I made** (each with its cost if wrong), and
append each ruling to `<root>/ledger.md`.
