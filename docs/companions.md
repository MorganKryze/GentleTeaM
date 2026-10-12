# Companion plugins

> GTM works alone: every role, workflow and template it needs ships in the plugin. Some other
> plugins make a role stronger; this page says, per role, what to keep, add or skip, and which
> overlaps to avoid. Recommendations, not requirements. Survey date: October 2026.

## Per role
| Role | Verdict | Companion | Why |
| --- | --- | --- | --- |
| analyst | optional | [superpowers](https://github.com/obra/superpowers) `brainstorming` | Socratic exploration for vague ideas, before `/gtm` picks a track |
| designer | keep one | one design skill at most (e.g. `frontend-design`) | many overlapping design skills inflate every session's context |
| design-critic | add | [impeccable](https://github.com/pbakaus/impeccable) `critique` / `audit` | deterministic design-tell detectors, cheap and repeatable |
| architect | optional | [context7](https://github.com/upstash/context7) | current library docs while planning |
| implementer | optional | superpowers `test-driven-development`, `systematic-debugging` | same discipline GTM asks for, in more depth |
| reviewer | optional | [ponytail](https://github.com/DietrichGebert/ponytail) `ponytail-review` or `code-simplifier` (pick one) | an over-engineering pass; GTM's reviewer already checks simplification |
| security-reviewer | add | `security-guidance` (official) hooks; [Trail of Bits skills](https://github.com/trailofbits/skills) `differential-review`, `insecure-defaults` | a cheap per-edit net plus real review depth |
| data-reviewer | idea | Every's `data-integrity-guardian` agent, from [compound-engineering](https://github.com/EveryInc/compound-engineering-plugin) | GTM's data reviewer follows the same idea; copy prompts, do not install a second workflow |
| ux-qa | optional | an accessibility-checking skill | GTM's ux-qa already runs axe and measures targets |
| final-reviewer | keep | Claude Code's built-in `/code-review` or `/security-review` for a second opinion | GTM's final review already orders security and data first |
| release-qa | add | the official [Playwright MCP](https://github.com/microsoft/playwright-mcp) | the only real browser driver; screenshots for bug reports |
| ship | optional | `commit-commands` (official) | small, useful for commits and PRs outside GTM |

## Overlaps to avoid
- **One code-review system.** GTM's reviewer and final reviewer are it. Do not run a second
  multi-agent PR reviewer on every task; use one only as an occasional second opinion.
- **One simplifier.** Pick ponytail-review, code-simplifier or the built-in `/simplify`, not several.
- **One workflow owner.** GTM owns the loop. Do not let superpowers' plan execution,
  compound-engineering, feature-dev or a loop plugin drive the same branch; use their individual
  skills only.
- **No second memory system.** The ledger is GTM's memory, next to Claude Code's own CLAUDE.md and
  auto-memory. A memory plugin with its own hooks duplicates both and costs context every turn.

## Licences
Trail of Bits skills are CC-BY-SA-4.0 (fine for local use). Taskmaster carries a Commons Clause:
borrow ideas, do not embed it. The others listed are MIT or Apache-2.0.
