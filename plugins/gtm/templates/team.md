# Team settings

> How this project weighs its work: which roles think hardest, which specialists exist, how strict
> the gates are. Proposed at `/gtm:init`, approved by the human, revisited with `/gtm:tune`.
> Every value carries its reason and the date it was decided. Skills and workflows pass the role's
> model and effort on every dispatch, so this file wins over the agents' defaults.

## Priorities
Weights: low · normal · high. They justify everything below.

| Priority | Weight | Why | Decided |
| --- | --- | --- | --- |
| Security | normal | <e.g. one account, no server: low; several accounts on one server: high> | YYYY-MM-DD |
| Data integrity | normal | <e.g. stores a person's records offline: high> | YYYY-MM-DD |
| UX and accessibility | normal | <e.g. phone-first product used daily: high> | YYYY-MM-DD |
| Performance | normal | <e.g. a size budget or slow devices: high> | YYYY-MM-DD |
| Delivery speed | normal | <e.g. prototype: high; long-lived product: normal> | YYYY-MM-DD |
| Usage and cost sensitivity | normal | <e.g. a tight subscription limit: high> | YYYY-MM-DD |

## Roles
Model: `opus`, `sonnet`, `haiku`, `fable`, a full model id, or `inherit`. Effort: `low`, `medium`,
`high`, `xhigh`, `max`. On risky work, a task or range with a file matching the Gates `risky paths`
(a regex that fails matches all), the security reviewer and the final reviewer rise one level from
their row (none: `high`), at most `xhigh`. Each correction round raises the implementer one level,
up to `high`, or `xhigh` on risky work, never below its row. The final review's second pass takes
the final reviewer's effort for its fix range, one level lower (`low` at least) when that range
matches no trigger and no risky path. An effort off that ladder, such as `max`, is never changed.

| Role | Model | Effort | Why | Decided |
| --- | --- | --- | --- | --- |
| analyst | opus | medium | clarifies once per request | YYYY-MM-DD |
| art-director | opus | high | a bland direction costs every round after it | YYYY-MM-DD |
| designer | opus | medium | the critic catches what it misses | YYYY-MM-DD |
| design-critic | opus | high | measured judgment gates every mockup page | YYYY-MM-DD |
| architect | opus | high | a wrong plan costs every task after it | YYYY-MM-DD |
| implementer | opus | low | the plan carries the thinking; reviews catch the rest | YYYY-MM-DD |
| reviewer | opus | medium | runs on every task | YYYY-MM-DD |
| security-reviewer | opus | high | a miss is the costliest; `xhigh` on risky work | YYYY-MM-DD |
| data-reviewer | opus | high | lost data cannot be undone | YYYY-MM-DD |
| ux-qa | opus | medium | measures more than it reasons | YYYY-MM-DD |
| final-reviewer | opus | high | last line of defence; `xhigh` on a risky branch | YYYY-MM-DD |
| release-qa | opus | low | runs a script, reports what it sees | YYYY-MM-DD |
| researcher | opus | high | runs on demand; a thin survey wastes every card after it | YYYY-MM-DD |

## Specialists
A specialist reviews a task only when a changed path matches one of its triggers (JavaScript
regexes on repo-relative paths). `off` removes it. A project agent may be added by its full agent
type.

- security-reviewer: on · triggers `^(server|api|auth)/`, `migrations?/` · why: <reason> · YYYY-MM-DD
- data-reviewer: on · triggers `migrations?/`, `(db|store|sync)/` · why: <reason> · YYYY-MM-DD
- ux-qa: on · triggers `^(src/)?(components|routes|pages|screens)/`, `\.css$` · why: <reason> · YYYY-MM-DD

## Companions
Optional plugins GTM knows (`templates/companions.md`): a role uses one only when it is `on` here
and installed; GTM never installs one. The two lines below are examples: init replaces them with
one line per companion found and approved, or `- none detected · YYYY-MM-DD`. A file without this
section has none on: nothing to migrate.

- impeccable: on · detected skill `impeccable:impeccable` · roles designer, design-critic, ux-qa · why: <reason> · YYYY-MM-DD
- humanize: on · detected skill `humanize:humanize` · roles ship, implementer · why: <reason> · YYYY-MM-DD

## Gates
- fix rounds per task: 3 · why: past three, the plan is wrong, not the code · YYYY-MM-DD
- fix rounds per standard review: 1 · why: a standard review fixes once, minors go to the ledger · YYYY-MM-DD
- review cadence: reviewer per-wave, ux-qa per-branch, security-reviewer per-task, data-reviewer per-task · why: a role left out reviews per task; security and data reviewers never lighter · YYYY-MM-DD
- tasks per branch: 8 · why: each task costs a fixed ceremony; slices, not layers, keep a branch at 8 or fewer · YYYY-MM-DD
- Fix track ceiling: 3 files · why: above it, the change deserves a spec · YYYY-MM-DD
- design threshold: 8/10, zero must-fix · why: <reason> · YYYY-MM-DD
- taste threshold: 7/10 · why: the lowest of the five grades, so a bland board fails · YYYY-MM-DD
- design rounds: 3 · why: <reason> · YYYY-MM-DD
- replay risky tasks: yes · risky paths `migrations?/`, `\b(sync|contract|schema)`, `(db|store|storage)/` · why: <reason> · YYYY-MM-DD
- budget per task: none · why: no measured run yet; `/gtm:tune` proposes the medians · YYYY-MM-DD
- budget per branch: none · why: no measured run yet; `/gtm:tune` proposes the medians · YYYY-MM-DD

A budget is `none` or `<minutes> min, <tokens>k tokens`. Past 1.5× of one, `/gtm:deliver` raises a
Heads-up and goes on; no budget changes a verdict, a correction round or the order of tasks. A profile
without the budget lines reads as `none`. A profile without `review cadence` runs every task
guarded, as before 0.7.0; without `tasks per branch`, the cap is 8. Nothing to migrate.

## History
Changes made by `/gtm:tune`, newest last: `- YYYY-MM-DD · <setting>: <old> → <new> · <why>`.
