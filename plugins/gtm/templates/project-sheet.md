# Project sheet (sheet.json)

> What `/gtm:init` and `/gtm:retro` hand the facts script for `<root>/sheet.json` while
> `config.yml`'s `project.sheet` reads `on`. The script checks every field, adds the facts and
> writes the file; you never write it. How to hand it over: `templates/now.md`, Project sheet.

## The object you hand over
One or more of the four owner fields, nothing else; each one given replaces its stored value
whole, the others stay. Texts follow `templates/decision.md`'s rule: in `language.human`, one
line, never empty, no control or format character; the number after a text is its most characters.

```json
{
  "purpose": "text, 280, or null",
  "users": "text, 280, or null",
  "decisions": [{ "at": "YYYY-MM-DD", "text": "text, 200", "by": "owner" }],
  "difficulties": [{ "k": "text, 20", "text": "text, 200", "src": "text, 120" }]
}
```

- `decisions`: 0 to 6; `at` a real date, not after today; `by` `owner` for the owner's answer,
  `gtm` for a default taken for them.
- `difficulties`: 0 to 6.
- `showcase` is never handed in this version: the script writes it `null` and refuses it given,
  `null` included, as `set`. So does every fact field (`v`, `kind`, `headline`, `plan`, `cost`,
  `modules`).

## Who hands what
- `/gtm:init`: reads `config.yml`'s `project.kind` and `<root>/sheet.json` first (no file:
  `purpose` and `users` null). One row of its guesses table per kind unset or `purpose` or `users`
  null (the kind: the guess and why; purpose and users: a summary of the brief), rows, not
  questions, no extra message; a stored value gets no row. When the owner asks to change a stored
  value, the row shows the stored value beside the new one before the OK. On the owner's OK,
  `purpose` and `users` go through the step and the kind into `config.yml` as `kind:` under
  `project:`, never through the step; init never sets `project.sheet`.
- `/gtm:retro`: reads `<root>/sheet.json` first (no file: both lists empty), then hands
  `decisions` and `difficulties` merged into the stored lists, never rebuilt from the ledger alone,
  both listed in its report. Decisions: the stored ones, an owner's correction included, and the
  ledger's `ruling` lines that quote the owner or change what the owner sees, newest first, the 6
  newest kept. Difficulties: the stored ones not resolved since, then this retro's lessons and the
  open minors, `src` `ledger <date>` of the line it comes from, at most 6. A ledger line already
  stored counts once and its stored entry stays as it is: a `ruling` line whose date a stored
  decision holds as `at` for the same ruling, worded as stored or as the owner corrected it; a
  lesson or minor whose line a stored difficulty names in `src`. Neither is handed again.

## The words
Every text is the owner's, seen: shown in the table or the report, in `language.human`. Hand the
object in the quoted heredoc, `<<'GTM_SHEET'`, so nothing in a text runs. The script prints one
line, `{"written", "field", "why"}`; `why` is one of `json`, `set`, `unknown`, `missing`, `type`,
`text`, `length`, `range`, `list`, `shape`, `file`, `error`, `off` (the switch) or `stored` (the
stored sheet fails the check). A refused text goes back as `templates/now.md` says:
never shorten or reword the owner's words to fit.
