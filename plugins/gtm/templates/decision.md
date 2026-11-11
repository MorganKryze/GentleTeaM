# Card file (decision.v1)

> Read when a card is shown, as `templates/now.md` says under Card file. You never write the card
> file: you hand this object to the facts script, which checks every key below, refuses the whole
> card on any miss, and adds `v`, `slug`, `asked`, `answer` and `other.allowed` itself.

## The object you hand over
Every key present, nothing else; `null` only where a key allows it, and for what you do not know.
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
  or all three keys, `tokens` and `minutes` whole numbers or `null`. `reversible`: `true`, `false`
  or `null`. `recommendedBy`: 0 to 3 names, each `gtm`, `second-reader` or a role of the team
  settings' Roles table.
- `recommendation`: `null` when the card recommends nothing, and then no option's `recommendedBy`
  holds `gtm`; else `option` names one option whose `recommendedBy` holds `by`.
- `objection`: the second reader's, or `null`; `prefers` an option's key or `null`.
- `modules`: 0 to 4, each `{type, size, title (60), src (120)}` plus its type's keys; `size` is
  `s`, `m`, `l` or `p`.
  - `text`: `text` (600).
  - `metrics`: `items`, 1 to 6 `{label (40), value (20), note (120 or null), gauge (0 to 1 or
    null), tone (null)}`.
  - `excerpt`: `file`, a path under the GTM root with no segment starting with `.` and no link;
    `where` (80); `head` (80 or null); `lines` (1 to 8, each 200) and `highlight` (200 or null),
    each copied verbatim from that file.
  - `list`: `items`, 1 to 8 `{k (40), v (120 or null)}`.
  - `pending`: no other key.
- `other`: `{placeholder}` only; the script sets `allowed`.

## The answer you record
`{"option": "<key>", "other": null}` for an option of the card, or `{"option": null, "other":
"<the owner's words>"}` for anything else, a reworked option included: one line, at most 280
characters. The script adds `by` and `at`; an answered card is never answered again.
Longer, or on several lines, the script refuses it: never shorten or reword the owner's words to
fit, as `templates/now.md` says.
