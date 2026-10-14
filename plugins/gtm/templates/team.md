# Team profile

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
`high`, `xhigh`, `max`. The implementer's fix rounds raise its effort one level per round.

| Role | Model | Effort | Why | Decided |
| --- | --- | --- | --- | --- |
| analyst | opus | medium | clarifies once per request | YYYY-MM-DD |
| designer | opus | medium | the critic catches what it misses | YYYY-MM-DD |
| design-critic | opus | high | measured judgment gates every board | YYYY-MM-DD |
| architect | opus | high | a wrong plan costs every task after it | YYYY-MM-DD |
| implementer | opus | low | the plan carries the thinking; reviews catch the rest | YYYY-MM-DD |
| reviewer | opus | medium | runs on every task | YYYY-MM-DD |
| security-reviewer | opus | xhigh | rare, and a miss is the costliest | YYYY-MM-DD |
| data-reviewer | opus | high | lost data cannot be undone | YYYY-MM-DD |
| ux-qa | opus | medium | measures more than it reasons | YYYY-MM-DD |
| final-reviewer | opus | xhigh | once per branch, last line of defence | YYYY-MM-DD |
| release-qa | opus | low | runs a script, reports what it sees | YYYY-MM-DD |

## Specialists
A specialist reviews a task only when a changed path matches one of its triggers (JavaScript
regexes on repo-relative paths). `off` removes it. A project agent may be added by its full agent
type.

- security-reviewer: on · triggers `^(server|api|auth)/`, `migrations?/` · why: <reason> · YYYY-MM-DD
- data-reviewer: on · triggers `migrations?/`, `(db|store|sync)/` · why: <reason> · YYYY-MM-DD
- ux-qa: on · triggers `^(src/)?(components|routes|pages|screens)/`, `\.css$` · why: <reason> · YYYY-MM-DD

## Gates
- fix rounds per task: 3 · why: past three, the plan is wrong, not the code · YYYY-MM-DD
- fix rounds per standard review: 1 · why: a standard review fixes once, minors go to the ledger · YYYY-MM-DD
- Fix track ceiling: 3 files · why: above it, the change deserves a spec · YYYY-MM-DD
- design threshold: 8/10, zero must-fix · why: <reason> · YYYY-MM-DD
- design rounds: 3 · why: <reason> · YYYY-MM-DD
- replay risky tasks: yes · risky paths `migrations?/`, `(sync|contract|schema)`, `(db|store|storage)/` · why: <reason> · YYYY-MM-DD
- budget per task: none · why: no measured run yet; `/gtm:tune` proposes the medians · YYYY-MM-DD
- review cadence: reviewer per-wave, ux-qa per-branch, security-reviewer per-task, data-reviewer per-task · why: a role left out reviews per task; security and data reviewers never lighter · YYYY-MM-DD
- budget per branch: none · why: no measured run yet; `/gtm:tune` proposes the medians · YYYY-MM-DD

A budget is `none` or `<minutes> min, <tokens>k tokens`. Past 1.5× of one, `/gtm:deliver` raises a
Heads-up and goes on; no budget changes a verdict, a fix round or the order of tasks. A profile
without these lines reads as `none`. A profile without `review cadence` runs every task guarded,
as before 0.7.0: nothing to migrate, add the line to opt in.

## History
Changes made by `/gtm:tune`, newest last: `- YYYY-MM-DD · <setting>: <old> → <new> · <why>`.
