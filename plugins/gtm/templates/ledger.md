# Ledger

> Append-only. One line per entry, newest last. Read at plan time (the compound step).
> Superseded entries are struck through (`~~...~~`), never deleted.
> Format: `- YYYY-MM-DD · <slug> · <kind> · <text>`
> Kinds: `lesson` (a rule to keep), `ruling` (a decision taken without the human, with its cost if
> wrong), `minor` (a deferred review finding), `resolved` (closes a minor, names it), `run` (one
> line per delivered branch, `/gtm:tune` reads these), `usage` (a note on cost or limits hit, or a
> budget passed).
> A `run` line: `tasks N · correction rounds per task · findings per reviewer (critical /
> important / minor) · tiers <g>g <s>s · design rounds and score · measured <W>m <T>k <A>a:
> <phase> <w>m <t>k <a>a, ...; roles <role> <p>%, ... · limits 5h +<a>% 7d +<b>% · lenses <role>
> <method name> <n>, ...`, escalated
> counts guarded, from every progress line, a task's runs summed (a `GATED` line has no rounds);
> phases design, spec, plan, tasks (re-run and deferred reviews in), final (re-reviews in), fix,
> in that order, a phase not run left out; minutes to one decimal, tokens in thousands; all
> summed, a wave's minutes are its longest task's; a sum holding a `?` is `?`, a progress line
> without measures reads `?`, a wave's merge-commit line is skipped; `roles` as `/gtm:deliver` §2
> step 3 measures them, once over every progress line's `· run <id>` folder plus `--also
> <role>:<s>:<tokens>` per dispatch (architect, final-reviewer, implementer, a re-run review's
> role), roles at 5% or more, any `?` → `roles ?`; `limits` the difference from the branch's first
> `limits at start` usage line, `?` across a reset or with no reading; `lenses` last, the items
> tagged `(lens: <method name>)` per role and method, every reflex of a role that ran listed, 0
> included: the architect's in the spec and plan, any other role's in its report files; retro and
> tune never appear in a run line (tune counts their tags itself). A `run` line
> without `lenses` (every line before 0.11.0) reads as not measured for lenses, the rest as
> before.
