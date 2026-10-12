# Examples

> GTM was distilled from a real project, Belay, a self-hosted offline-first training app built
> milestone by milestone with the roles, workflows and briefing format GTM now packages. No Belay
> code or document is copied here; this note says what the reference project shows.

## Belay as the reference project
- **Repository:** https://github.com/MorganKryze/belay.
- **What it exercised:** seven delivered branches with a design loop per screen change, specs
  with decision tables, plans replayed in scratch clones for migrations and sync, per-task review
  with triggered security, data and UX specialists, a final review per branch, and a ledger per
  milestone whose lessons fed the next plan.
- **What GTM generalised:** the role prompts (project rules moved to `.gtm/` files), the two
  workflows (agent types and triggers moved to arguments), the design guideline (tokens and
  patterns moved to placeholders), and the ledger (one file, one line per entry).

## A minimal `.gtm/` after `/gtm:init`
```
.gtm/
  brief.md          one page
  config.yml        paths, verify commands, git rules, language, briefing style
  team.md           priorities, model and effort per role, specialists, gates
  conventions.md    one table, pointing at guidelines/
  guidelines/       code, tests, git, docs, dependencies, security, data, i18n, accessibility, design, work
  backlog.md        epics and stories
  ledger.md         empty until the first branch
  specs/ plans/ reports/ mockups/
```
