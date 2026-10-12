# Glossary

> Short definitions of the terms GTM uses, in alphabetical order. Each points at the page that
> describes it in full.

| Term | Definition |
| --- | --- |
| Backlog | `.gtm/backlog.md`: epics, their stories, priority and status. [method](method.md#backlog-epics-stories-priority) |
| Board | A PNG mockup page showing each new screen in light and dark, with captions and the decisions to take. |
| Brief | `.gtm/brief.md`: the project's one-page constitution. |
| Conventions | `.gtm/conventions.md` and its guideline files: the project's rules per area. [method](method.md#conventions) |
| Decision card | A question, options, a firm recommendation and the cost if wrong. [principles](principles.md) |
| Definition of done | What "done" means per track: verified, reviewed, documented, ledger updated, the human's go. |
| Design score | The design critic's mark out of 10; a board passes at the threshold (8 by default) with zero must-fix. |
| EARS | Easy Approach to Requirements Syntax: acceptance lines of the form WHEN / WHILE / WHERE / IF … THE SYSTEM SHALL …. |
| Epic | A Milestone or a group of Features. |
| Escalation | A Fix becoming a Feature when it exceeds the file ceiling or touches a schema or security surface. One-way. |
| Final review | The whole-branch review before the go, with at most one fix wave. |
| Fix round | One implementer pass over open findings, followed by re-review by the reviewers who raised them. Capped at three by default. |
| For you | The at-most-ten-line synthesis that opens every artifact meant for the human. |
| Gate | A check that must pass before work moves on. [method](method.md#gates) |
| GTM root | The folder holding GTM's artifacts, `.gtm/` by default. |
| Hand-back | An agent's short return to the orchestrator: at most ten lines or a structured object. |
| Hand-off | Giving an agent paths to files instead of pasting their content. |
| Heads-up | The briefing block that appears only when something deviates from the plan or the expectation. |
| Human briefing | The single format for every human-facing message: TL;DR, details, Heads-up, Next steps. |
| Ledger | `.gtm/ledger.md`: append-only one-line lessons, rulings, deferred minors and run summaries. |
| Minor | A review finding that does not block a task; logged and triaged by the final review. |
| NEEDS CLARIFICATION | A marker for something the spec must not guess; zero must remain before the plan. |
| Priority | P0 to P3, defined in `guidelines/work.md`. |
| Replay | Running a risky task's code in a scratch clone while planning, to prove the plan before delivery. |
| Retro | The compound step: distilling a branch into lessons and guideline edits. |
| Ruling | A decision the team took without asking the human, listed with its cost if wrong. |
| Specialist | A reviewer that runs only on trigger: security, data, UX. |
| Specialist trigger | A path regex in the team profile; a specialist runs when a changed file matches one. |
| Story | One user-visible outcome with acceptance lines, delivered by one track. |
| Team profile | `.gtm/team.md`: priorities, model and effort per role, specialists, gates, each with its reason and date. [method](method.md#team-profile) |
| Touchpoint | A moment where the human decides: board, spec synthesis, go. |
| Track | The size of process for a change: Fix, Feature or Milestone. |
| Tune | Re-evaluating the team profile and conventions from ledger evidence (`/gtm:tune`). |
