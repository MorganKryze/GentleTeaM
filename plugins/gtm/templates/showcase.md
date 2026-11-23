# Showcase

> Read by `/gtm:ship` when it proposes the project's showcase: after the go of its first ship (the
> sheet holds no showcase), then after the release of each new major version, and only while
> `config.yml`'s `project.sheet` reads `on`. GTM is the only writer of its root; a reader only
> reads the sheet.

## The draft
- From `<root>/brief.md`, `config.yml`'s `project.kind` and the frame below for that kind: a
  `kicker` (60), a `line` (200), up to 6 `facts` (a label of 30, a value of 80), up to 5
  `principles` (120), up to 4 `visuals`, `public` false. The numbers are most characters.
- Nothing of the work in progress: no quota, cost, wait, difficulty or decision; those stay in the
  sheet's own fields.
- Visuals: captures already under `<root>/reports/` (ux-qa's), PNG, JPEG or WebP, each with its
  `frame` and an `alt`. The card shows each one as a piece, with the line "check it shows no test
  data and no secret". A project without screens proposes none.

## The card
One decision card, the drafted showcase beside the stored one on an update: A keep as drafted, B
change the words (the owner's own), C not now. A or B hands `{"showcase": {...}}` to the sheet
step as `templates/project-sheet.md` says, `public` true only when the owner says so; C writes
nothing and the next major version asks again. The answer is a ledger `ruling` line.

## Frames per kind
| `project.kind` | Kicker, for example | Facts that suit it | Visual frames |
| --- | --- | --- | --- |
| `app-web` | "App web · auto-hébergée" | stack, hosting, languages, image size | `desktop`, `phone` |
| `app-mobile` | "App mobile · iPhone et web" | platforms, offline, sync | `phone`, `tablet` |
| `tool` | "Outil en ligne de commande" | install, language, dependencies | `none`, or a terminal capture |
| `infra` | "Infrastructure · un cluster" | where it runs, its parts, its footprint | `none`, or `desktop` for a dashboard |
| `sandbox` | "Bac à sable · une piste" | what it explores, where it stands | any |
