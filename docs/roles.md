# Roles

> GTM ships eleven role agents. Each has one job, reads only the guidelines its role needs, returns
> a short hand-back and writes its full report to a file. Reviewers are read-only. All default to
> the strongest model and differ by reasoning effort; the project's team profile can change any of
> them per dispatch.

| Role | Job | Default effort | Writes code? | When it runs |
| --- | --- | --- | --- | --- |
| analyst | clarifies the request, proposes the track, drafts the setup at init | medium | no | track selection, `/gtm:init` |
| designer | PNG mockup boards in light and dark at the configured widths | medium | mockups only | design loop |
| design-critic | scores the board with measurements: overflow, targets, contrast, rules | high | no (read-only) | design loop |
| architect | spec, then task plan; replays risky tasks in a scratch clone (plans of two tasks or more) | high | specs and plans | after the board; after the spec |
| implementer | one task or one fix list, test-first, gate, commit | low (raised per fix round) | yes | every task |
| reviewer | spec compliance, then code quality | medium | no (read-only) | every task |
| security-reviewer | isolation, trust boundaries, auth, migrations, secrets | xhigh | no (read-only) | diff matches its triggers |
| data-reviewer | lost, duplicated or altered data; upgrades, queues, conflicts | high | no (read-only) | diff matches its triggers |
| ux-qa | captures touched screens, measures overflow, targets, axe; compares with the board | medium | captures only | diff matches its triggers |
| final-reviewer | whole branch against spec and plan; replays two planted mutations; triages deferred minors | xhigh (one lower on a re-review off specialist ground) | no (read-only) | once per branch, unless one task ended clean at 0 fix rounds |
| release-qa | runs the scripted journey on the live instance with the test account | low | journey script only | after the human deploys |

## Severity scale (reviewers)
| Severity | Meaning | Effect |
| --- | --- | --- |
| critical | wrong data, crash, security hole | blocks the task; fix round |
| important | spec gap, a bug a person hits, an accessibility failure | blocks the task; fix round |
| minor | polish, coverage, style | logged in the ledger, triaged by the final review |

Every task review request adds a scope rule, read against the task's whole range on every
round: a defect the task's diff did not introduce (it neither adds nor changes the faulty lines
nor makes them newly reachable) is minor, its summary saying it predates the task, unless it is
critical, a security hole or a data-integrity defect. On a re-review, each finding sent keeps
its severity until it is addressed; a finding returned with status `addressed` no longer
blocks and is not counted; one returned without a status stays open.

## Hand-back contract
At most ten lines (twelve for the architect, fifteen for release QA), or the structured object a
workflow asks for: status, files, the verify result, concerns, the report path. Never a claim
without the command that proved it.

## Shared rules
Every role reads `.gtm/config.yml` and `.gtm/brief.md` first, never hard-codes a rule the config
can state, never pushes, merges, tags or switches branches, and never dispatches other agents.
Read-only roles that need to run something use a scratch clone.

## Plugin limits worth knowing
Claude Code ignores `hooks`, `mcpServers` and `permissionMode` in a plugin agent's frontmatter.
GTM agents rely on none of them; permissions come from the session.
