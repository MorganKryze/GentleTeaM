# Ledger

> Append-only. One line per entry, newest last. Read at plan time (the compound step).
> Superseded entries are struck through (`~~...~~`), never deleted.
> Format: `- YYYY-MM-DD · <slug> · <kind> · <text>`
> Kinds: `lesson` (a rule to keep), `ruling` (a decision taken without the human, with its cost if
> wrong), `minor` (a deferred review finding), `resolved` (closes a minor, names it), `run` (one
> line per delivered branch: tasks, fix rounds, findings per reviewer, design rounds and score;
> `/gtm:tune` reads these), `usage` (a note on cost or limits hit).

