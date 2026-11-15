# Card file (decision.v1, v1.1)

> Read when a card is shown, as `templates/now.md` says under Card file. You never write the card
> file: you hand this object to the facts script, which checks every key below, refuses the whole
> card on any miss, and adds `v`, `slug`, `asked`, `answer` and `other.allowed` itself.

## The object you hand over
Every key present, nothing else; `null` only where a key allows it, there for what you do not
know, and never an empty text.
Texts in `language.human`, each on one line, in your own words but an excerpt's; no control or
format character; the number after a text is its most characters.

```json
{
  "id": "<slug>-D1",
  "kind": "decision",
  "moment": null,
  "question": "text, 160",
  "summary": "text, 280, or null",
  "why": "text, 280, or null",
  "criteria": "text, 280, or null",
  "options": [
    { "key": "A", "label": "text, 60", "proves": "text, 200, or null",
      "cost": { "tokens": 150000, "minutes": 15, "text": "text, 40, or null" },
      "reversible": true, "recommendedBy": ["gtm"] }
  ],
  "recommendation": { "by": "gtm", "option": "A", "why": "text, 280", "costIfWrong": "text, 280" },
  "objection": { "by": "second-reader", "prefers": null, "text": "text, 280" },
  "modules": [],
  "other": { "placeholder": "text, 80, or null" }
}
```

## Each key
- `id`: `<slug>-D<n>` for a spec or plan decision, else `<slug>-<kind>` or `<slug>-<kind>-t<n>`;
  at most 60 characters, `[A-Za-z0-9-]` after `<slug>-`.
- `kind`: `decision`, `verification`, `go`, `summary` or `review`. `moment`: 1 to 4 only under a
  valid mandate (`templates/mandate.md`), else `null`.
- `options`: the card's options exactly, 1 to 9, keyed `A`, `B`, `C`… in order. `cost`: `null`,
  or all three keys, `tokens` (0 to 10^9) and `minutes` (0 to 10^5) whole numbers or `null`.
  `reversible`: `true`, `false` or `null`. `recommendedBy`: 0 to 3 distinct names, each `gtm`,
  `second-reader` or a role of the team settings' Roles table.
- `recommendation`: `null` when the card recommends nothing, and then no option's `recommendedBy`
  holds `gtm`; else `option` names one option whose `recommendedBy` holds `by`.
- `objection`: the second reader's, or `null`; `prefers` an option's key or `null`.
- `modules`: 0 to 4, each `{type, size, title (60), src (120)}` plus its type's keys; `size` is
  `s`, `m`, `l` or `p`.
  - `text`: `text` (600).
  - `metrics`: `items`, 1 to 6 `{label (40), value (20), note (120 or null), gauge (0 to 1 or
    null), tone (null)}`.
  - `excerpt`: `file`, a regular file under the GTM root, at most 200 characters, each segment
    `[A-Za-z0-9._-]` and none starting with `.`;
    `where` (80); `head` (80 or null); `lines` (1 to 8, each 200) and `highlight` (200 or null),
    each copied verbatim from that file.
  - `list`: `items`, 1 to 8 `{k (40), v (120 or null)}`.
  - `pending`: no other key.
- `other`: `{placeholder}` only; the script sets `allowed`.

## decision.v1.1
Every card of 2 to 4 options is handed as v1.1, every other card as decision.v1. A v1.1 card is
the object above without `summary`, plus the keys below; `v` stays 1, and `tldr` marks it.
Never hand `summary` or `recommandation`: the script writes them, `summary` from `tldr` and
`recommandation` from `recommendation`'s `option` and `why`, or `null`.

```json
{
  "tldr": "text, 280",
  "hesitation": { "entre": ["A", "B"], "question": "text, 160" },
  "assurance": null,
  "doute": null,
  "pieces": [
    { "type": "tableau", "titre": "text, 80", "chemin": "reports/<slug>/versions.md",
      "essentielle": true, "apercu": ["text, 200"] }
  ],
  "session": "<the id, below>"
}
```

Each option adds:

```json
{ "implique": "text, 160", "gestes": ["text, 80"], "vous": "text, 200, or null",
  "risque": { "niveau": "faible", "texte": "text, 160" }, "message": "text, 280",
  "suite": [{ "t": "text, 120", "vous": true }] }
```

- `tldr`: at most two sentences, each ending at `.`, `!`, `?` or `…`.
- `recommendation` or `hesitation`: exactly one is not `null`. `hesitation`'s `entre` holds 2 to 4
  distinct option keys; with a hesitation, no option's `recommendedBy` holds `gtm`.
- Each option: `reversible` `true` or `false`; `gestes`, 0 to 3, what the owner does by hand;
  `vous` `null` with no geste, else what the owner must know before doing them; `risque.niveau`
  `faible`, `moyen` or `eleve`; `message` the exact words that answer this option, no space
  before or after, distinct among the options.
- `suite`: the steps the plan, the delivery or ship run after that choice, in order, up to the
  next point where the owner is asked; 1 to 8, each owner's step at `vous: true`, worded as one of
  the option's gestes, as many such steps as gestes.
- `assurance`: `null` reads as high; give a number from 0 to 1 only when it is low or you hold a
  precise doubt, and then `doute` says it. Otherwise both stay `null`.
- `pieces`: 0 to 20, at most 3 essential (`essentielle: true`), the rest folded (`false`).
  Opposing data (versions, measures, comparisons) go in a `tableau` piece whose file you write
  under `reports/<slug>/`, never in the prose of a text.
- A piece's `chemin`: a path from the project's top to a regular file under it, once links are
  resolved; no empty, `.`, `..` or `.git` segment, no backslash, no first segment starting with
  `-`, no execute bit, and one of its type's extensions, in any case: `tableau` md, csv, tsv;
  `texte` md, txt; `diff` diff, patch; `image` png, jpg, jpeg, gif, webp, heic; `video` mp4, mov,
  m4v, webm; `pdf` pdf; `doc` md, txt, rtf, docx, odt. A `lien`: an https URL with a host, at most
  500 characters, no whitespace, no backslash, no user name and no password.
- `apercu`: `null`, or for `tableau`, `texte`, `diff` and `doc` only, 1 to 10 texts of 200 copied
  word for word from the piece's file.
- A piece with no file (an error from the conversation) has `chemin` `null` and its lines in
  `apercu`, 1 to 10 texts of 200; `tableau`, `texte`, `diff` or `doc` only.
- A piece the script refuses is fixed or dropped, never its file changed to pass: no `chmod`, no
  rename.
- Leave each piece's file as it is until the card is answered: the script checks the pieces again
  when it records the answer, and refuses the answer when a file changed or moved.
- `session`: read `$CLAUDE_CODE_SESSION_ID` in your own shell; when it is set, hand it as
  `session`, else leave the key out. Never show it in a card, NOW.md, a briefing or a summary.
  The script writes a malformed id as `null` and still writes the card (`written: true`, `field:
  "session"`): never hand a dropped id again.

## The answer you record
`{"option": "<key>", "other": null}` for an option of the card, or `{"option": null, "other":
"<the owner's words>"}` for anything else, a reworked option included; on decision.v1, one line
of at most 280 characters. The script adds `by` and `at`; an answered card is never answered again.
Longer, or on several lines, the script refuses it: never shorten or reword the owner's words to
fit, as `templates/now.md` says.
On a v1.1 card the owner's words go in whole as `other`, line breaks included, at most 2000
characters, and the script records the option whose `message`, or `key` in any case, they equal
once trimmed; the limit of one line of 280 is decision.v1's alone. Each line feed goes as `\n`
inside the JSON string, never a raw line break: a raw one is refused, and a raw line reading
`GTM_CARD` would end the heredoc early.
Line feeds aside, the script refuses words holding a control character (a tab or a carriage
return among them), an invisible format character or a line or paragraph separator.
