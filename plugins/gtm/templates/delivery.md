# Delivery: the rules `/gtm:deliver` reads here

> The plugin's delivery rules that do not fit in the deliver skill (128 lines). Read when the
> skill points here; the skill keeps its steps, this file their shapes. Never copied into a
> project.

## The progress line's tail
Every run's progress line (design, spec, spec+plan, plan, second reading, plan critic, task,
deferred or re-run review, hand, final review, fix wave) ends with four segments, in this order,
after every segment it has today:
`· start <S> · end <E> · models <M> · causes <C>`
- `<S>`, `<E>`: UTC instants to the second, `YYYY-MM-DDThh:mm:ssZ`, read from the clock (`date -u
  +%Y-%m-%dT%H:%M:%SZ`) when you dispatch and when the result returns, or from what Claude Code
  recorded for that run; a hand line, when you start the edit and when its last check returns.
  Never estimated, never written later from memory: an instant you do not have is `?`.
- `<M>`: each role the run dispatched, as dispatched, `<role> <model>/<effort>` joined by `, `, a
  role at two efforts showing each (`implementer opus/low/medium`). A workflow run: its result's
  `trace.models`, copied as it is. A direct dispatch: the model and effort you passed, after a
  `limits: lighter` ruling and the raises of `templates/team.md`. Nothing dispatched: `none`. A
  model or effort you did not pass: `?`.
- `<C>`: the blocking findings that started each correction round,
  `<round>:<role>/<severity>/<category>` joined by `, `. A workflow run: its result's
  `trace.causes`, copied as it is. A final review whose must-fix start a fix wave or a hand fix:
  `1:final-reviewer/important/<category>` per must-fix. No round: `none`.
- A category is one of `behaviour`, `security`, `proof`, `doc`, `form`; a missing or unknown one
  is `?` and never stops a run.

Nothing else in the line changes, and segments are only added at its end, so every reader of
today's lines reads them as before. A run's line without this tail lacks its trace.
