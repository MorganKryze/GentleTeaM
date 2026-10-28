---
name: tune
description: "Re-tune GTM team settings (roles, effort, specialists, gates, companions, reflexes, stealth) from the ledger, as decision cards. Use when the team feels slow, costly or blind."
---
# Tune the team settings and conventions

Ground rules: as in the `gtm` skill §0. Nothing in `team.md` changes without the human's answer.
Asked to switch stealth mode (`/gtm:tune stealth on|off`)? Go to §5 instead.
Asked to turn a companion on or off (`/gtm:tune <name> on|off`)? One card, then §4.

- Reflexes (${CLAUDE_PLUGIN_ROOT}/templates/methods/reflexes.md): Occam's Razor Application
  [elicitation], Constraint Mapping [brain].

## 1. Read
`<root>/team.md` (its `## Companions` against the session's skills, as
`${CLAUDE_PLUGIN_ROOT}/templates/companions.md` says, and its `## Reflexes` section, if any), the
`run` lines (their `measured` part and `lenses` segment included), the `minor` and `usage` lines
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
| a known companion listed in the session but not recorded, or recorded `on` but gone | turn it on or off (one card each); no section counts as none on |
| a reflex method has 0 tagged items over the last 3 measured runs in which its role ran | drop that reflex (one keep-or-drop card); a reflex already `off` in `## Reflexes` is skipped; a `run` line without a `lenses` segment is not measured for lenses, the rest as before; retro's and tune's own tags are counted in the ledger lessons and History lines |
| the last 3 measured runs that planted at least one mutation show 0 survived | drop the review's mutation step (one keep-or-drop card); skipped while team.md holds a `review mutations: off` line; a `run` line without a `mutations` segment is not measured for mutations, the rest as before |
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
A reflex is dropped or restored only through a card the human approves.
No reflex section in team.md: every reflex applies. Never write the section before the first
approved drop; then add `## Reflexes` before `## History`: add it once; a later drop appends its
line to it. One line per dropped reflex (`- <role>: <method name> off · why: <counts> · <date>`);
a restore deletes every line for it.
The mutation step is switched off or back on only through a card the human approves.
No `review mutations` line in team.md: the step runs. An approved drop adds to its Gates, when
none is there, `- review mutations: off · why: <counts> · <date>`, with a History line and a
ledger `ruling` line; a restore deletes every `review mutations` line.

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
