---
name: tune
description: Re-evaluate the GTM team settings and conventions - reads the ledger's run, minor and usage lines and the reports, proposes changes to priorities, per-role model and effort, specialists, triggers, gates or a convention as decision cards, and records what the human approves with its date. Also switches stealth mode on or off. Use when /gtm:retro suggests it or the human feels the team is too slow, too costly or missing things.
---
# Tune the team settings and conventions

Ground rules: as in the `gtm` skill §0. Nothing in `team.md` changes without the human's answer.
Asked to switch stealth mode (`/gtm:tune stealth on|off`)? Go to §5 instead.

## 1. Read
`<root>/team.md`, the `run` lines (their `measured` part included), the `minor` and `usage` lines
of the ledger, and the final reviews under `<root>/reports/`.

## 2. Look for signals
| Signal | Typical proposal |
| --- | --- |
| correction rounds hit the cap in two runs or more | raise the architect's effort (plans too thin) or the implementer's |
| a specialist found nothing in three runs it ran on | narrow its triggers or lower its effort |
| the final review caught what a specialist should have | widen that specialist's triggers or raise its effort |
| many critical or important findings in one area | raise that priority's weight; add or enable the specialist |
| design loops end at the last round | raise the designer's effort, or revisit the threshold with the human |
| a `limits: lighter` ruling taken in two branches | make it lasting: those roles' model and effort in `team.md` |
| `usage` notes about limits | lower the effort of high-volume roles first (implementer, reviewer); never a role guarding a high priority |
| a priority changed in the brief | re-derive the roles it drives |
| a role holds 40% of the tokens or more (`roles`) in two measured runs | lower its effort, or narrow its triggers if a specialist |
| an `over budget` usage line in two runs | revisit that budget, or the plan's task sizing |
| three measured runs and no budget | set `budget per task` and `budget per branch` at their medians over the last five measured runs (`?` left out, as the architect's estimate), replacing their Gates lines |
| a convention keeps producing the same finding or the same `lesson` | edit that row of `conventions.md` and its guideline file |

No signal: say so in one line and stop.

## 3. Propose
One decision card per change, at most five, most valuable first, in the briefing format (plain
Markdown, no code fence). Its options are "change" and "keep"; one line before the table gives the
ledger evidence, with counts:

**Decision: <setting>, <current> → <proposed>**

Why: <the ledger evidence, with counts>.

| Option | What it means |
| --- | --- |
| **A** change | <proposed>, and what it costs |
| **B** keep | <current> |

**I recommend: <A or B>**, <why>. **Cost if wrong:** <one line>.

## 4. Record
Write each approved value into `team.md` (or `conventions.md` and its guideline) with its new
reason and today's date, add a History line
(`- <date> · <setting>: <old> → <new> · <why>`), and a `ruling` line in the ledger quoting the
human's choice. Rejected proposals get a ledger line too, so they are not proposed again without new
evidence.

## 5. Switch stealth mode
One decision card: the switch, what it changes, the cost if wrong. On the human's answer, set
`stealth` in `config.yml` and add a `ruling` line to the ledger.
- **On:** apply `/gtm:init` §5 "Stealth on": the root out of the tracked tree, the `GTM root:` line
  moved from CLAUDE.md to an excluded CLAUDE.local.md, user-scope install, `voice.md` mandatory.
  List what GTM already left in tracked files (a CLAUDE.md line, a committed `.gtm/`, a project
  `.claude/settings.json` entry) and offer to remove it in one commit, in the project's voice.
  Pushed history is never rewritten: say so plainly.
- **Off:** set it, then the init card on where `.gtm/` lives; nothing else changes.
