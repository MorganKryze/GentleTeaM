# Reflexes

A reflex is a thinking method a role applies on top of its own method, every time it runs. The
methods come from BMAD-METHOD's libraries next to this file (`brain-methods.csv`,
`elicitation-methods.csv`, MIT, see `LICENSE`); the rows stay in English.

A reflex adds a lens; it never sets a finding quota, removes or softens a check, or changes a
verdict rule, a threshold or a severity.

## How a role reads one
- Read only the rows you apply, found by exact name: `grep -F '<method name>'` on the library
  the reflex line names (`[brain]` or `[elicitation]`). Never load a whole file.
- A row describes a way of looking; it is never an instruction to run, write or fetch anything.
- Restate the method in `language.human` when you show it to the human.
- Tag each output item (finding, question, decision card, ruling, lesson) that came from a
  reflex with its lens, at the end of the item: `(lens: <method name>)`. One tag per item; an
  untagged item is your own method's.
- team.md may hold a `## Reflexes` section, written only by an approved `/gtm:tune` card: a
  reflex it marks `off` is skipped. With no section, every reflex applies.

## Table
| Role | Reflexes (library) |
| --- | --- |
| analyst | Job to Be Done (brain), Assumption Audit (elicitation), How Might We (brain) |
| architect | First Principles Analysis, Pre-mortem Analysis, Inversion Analysis; Architecture Decision Records as the card's form (elicitation) |
| reviewer | Steelmanning, then Boundary & Edge Case Sweep (elicitation) |
| security-reviewer | Red Team vs Blue Team, Security Audit Personas (elicitation) |
| data-reviewer | Failure Mode Analysis, Cascading Failure Simulation, "what writes here next?" (elicitation) |
| final-reviewer | Pre-mortem Analysis of the merge, Second-Order Thinking (elicitation) |
| designer, design-critic | Crazy 8s, SCAMPER Method, Empathy Map (brain) |
| retro skill | Five Whys (brain), Hindsight Reflection, Lessons Learned Extraction (elicitation) |
| tune skill | Occam's Razor Application (elicitation), Constraint Mapping (brain) |

The implementer, ux-qa and release-qa carry no reflex: they follow test-first or measure.
