# Advisor

> What `/gtm:gtm` proposes when it runs with no request. Read only then: this file adds nothing
> to the per-session size. The rule that it only proposes is stated in the `gtm` skill §0.

## Read
- `<root>/NOW.md` and the facts `now-facts.mjs` gives, `<root>/backlog.md`, `<root>/ledger.md`,
  `git --no-optional-locks status` and `git branch --show-current`, the companions the session
  lists against `team.md`'s `Companions` section, and the limits reading (`usage-line.mjs --read`,
  as §0 runs it).
- Open notes: list `<root>/brainstorms/*.md` and keep those holding the line `Status: open`.
  NOW.md alone is not enough: the next skill's write replaces its pointer to a note.

## States and first proposals
The first matching state, top to bottom, gives the first proposal; the next ones that match fill
the card.

| State | First proposal |
| --- | --- |
| paused run (facts' phase `paused`) | `/gtm:status`, then its `resume` command |
| open brainstorm note | `/gtm:brainstorm <note path>`, to resume it |
| spec awaiting approval | `/gtm:brief-me <spec path>, dig with Pre-mortem Analysis` |
| limits flagged | `/gtm:pause` |
| shipped story without retro, or 5 or more open minors | `/gtm:retro` |
| costly last run | `/gtm:tune` |
| known companion installed and not in team.md | `/gtm:tune <name> on` |
| no request and no run | `/gtm:brainstorm`, or the human's request |

## Thresholds
- **Many minors:** 5 or more open `minor` lines in the ledger (a `resolved` line closes one).
- **Costly:** the last measured `run` line's tokens above 1.5 × the median of the five `run`
  lines before it; fewer than five before it, never costly.
- **Without retro:** a story done in the backlog whose slug has no `lesson` line after its `run`
  line.
- **Limits flagged:** the limits reading prints a `flag` line.

## Card
1 to 3 commands as one decision card (`templates/briefing.md`), each with a one-line reason that
names the state and its number ("7 open minors"), the first recommended. Nothing matches: say the
state in one line and offer `/gtm:brainstorm` or a request. `/gtm:status` and `/gtm:pause` are
typed by the human: the card says to type them, and a pick never invokes them.
