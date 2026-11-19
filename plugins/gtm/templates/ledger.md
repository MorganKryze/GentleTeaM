# Ledger

> Append-only. One line per entry, newest last. Read at plan time (the compound step).
> Superseded entries are struck through (`~~...~~`), never deleted; a `ruling` line starting
> `judge lowering off` is struck by the human alone (`templates/delivery.md`, `## Judge`).
> Format: `- YYYY-MM-DD · <slug> · <kind> · <text>`
> An answer quoted goes in whole on one line as a JSON string, quotes included: a backslash
> `\\`, a quote `\"`, a line feed `\n`, a line or paragraph separator `\u2028`, `\u2029`.
> Kinds: `lesson` (a rule to keep), `ruling` (a decision taken without the human, with its cost if
> wrong; one taken by default under a mandate reads `- <YYYY-MM-DD> · <slug> · ruling · default:
> <choice> (cost if wrong: <one line>)`, one line each, counted in the state's `defaults`),
> `minor` (a deferred review finding), `resolved` (closes a minor, names it), `ship` (a push,
> merge, tag or publication done on the human's go), `run` (one line per
> delivered branch, `/gtm:tune` reads these), `usage` (a note on cost or limits hit, or a budget
> passed; a posture reading reads `- <date> · posture · usage · read <n> gaps open: <ids>`),
> `escape` (a defect found after the merge of the branch that brought it, `- <date> ·
> <slug of the branch that brought it> · escape · <what>, merged in <merge or PR>, found <where
> and by whom>, path <text|code|full|?>, category <category>`; written by the gtm skill when it
> records such a bug, and by the retro), `recu` and `refus` (a project report's receipt and
> refusal, slug `upstream`, written only by the upstream triage in the shapes
> `templates/upstream.md` gives; never struck;
> its `upstream · ruling · id=` item lines are triage outcomes and bind nothing).
> A `run` line: `tasks N · correction rounds per task · findings per reviewer (critical /
> important / minor) · tiers <g>g <s>s · design rounds and score · measured <W>m <T>k <A>a:
> <phase> <w>m <t>k <a>a, ...; roles <role> <p>%, ... · limits <window> +<a>% ...
> · paths <path> <n> <w>m <t>k <r>r, ... · sheets <name> <passes> <c>/<i>/<m>, ...
> · mutations <planted> planted <survived> survived · lenses <role> <method name> <n>, ...`,
> escalated
> counts guarded, from every progress line, a task's runs summed (a `GATED` line has no rounds);
> phases design, spec, plan, tasks (re-run and deferred reviews in), final (re-reviews in), fix,
> in that order, a phase not run left out; minutes to one decimal, tokens in thousands; all
> summed, a wave's minutes are its longest task's; a sum holding a `?` is `?`, a progress line
> without measures reads `?`, a wave's merge-commit line is skipped; `roles` as `/gtm:deliver` §2
> step 3 measures them, once over every progress line's `· run <id>` folder plus `--also
> <role>:<s>:<tokens>` per dispatch (architect, final-reviewer, implementer, a re-run review's
> role), roles at 5% or more, any `?` → `roles ?`; `limits` the difference from the branch's first
> `limits at start` usage line, one `<window> +<a>%` per window (`5h`, `7d`) that line and the
> reading both show, a window either lacks left out, never `+0%`, `?` across a reset or with no
> reading; `paths` from the progress lines' `· path` segment, per path in the order text, code,
> full: tasks, minutes, tokens and correction rounds, a task's runs summed, `none` and `?` lines
> left out, a path with no task left out; `sheets` summed per sheet
> over the progress lines that carry it: passes, then findings by severity, zeros kept, the segment
> left out when none does; `mutations` summed over the
> progress lines that carry it, deferred and re-run review lines included, `?` when the task
> progress lines do not all carry it (a `GATED` line or one without the `reviewer` skipped), a `?`
> segment left out, as budgets; `lenses` last, the items tagged `(lens: <method name>)` per role and
> method, every reflex of a role that ran listed, 0 included: the architect's in the spec and plan,
> any other role's in its report files; retro and tune never appear in a run line (tune counts their
> tags itself). A `run` line without `lenses` (every line before 0.11.0) reads as not measured for
> lenses, one without `mutations` (every line before 0.12.0) as not measured for mutations, one
> without `sheets` counts for no sheet, one without `paths` (every line before 0.19.0) as not
> measured for paths, the rest as before.
