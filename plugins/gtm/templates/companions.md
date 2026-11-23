# Companions

> The optional plugins GTM knows. `/gtm:init` and `/gtm:tune` detect them, `team.md` records the
> human's choice in its `Companions` section, and a role uses one only when it is `on` there and
> present. GTM never installs, enables, updates or sets one up: that is the human's step.

## Detect
- Init and tune only, read-only: a companion is found when the session lists its skill
  (`impeccable:impeccable`, `humanize:humanize`, or a user-level skill such as `break-ui`).
  No tool call, nothing run or written.
- Init: each one found is a row of the team-settings table, proposed `on`; none found, no row.
  No question and no install advice either way: the docs name them.
- Record what the human approves: `- <name>: on|off · detected skill <skill> · roles <roles> ·
  why: <reason> · <YYYY-MM-DD>`; none found, `- none detected · <YYYY-MM-DD>`. These lines replace
  the template's example lines, which never stay in a project's `team.md`. A companion turned on
  replaces a `none detected` line; a missing section goes after `## Specialists`.
- Tune: one change-or-keep card per difference (a known one now listed but not recorded, one
  recorded `on` no longer listed), inside its five-card cap.
- A `team.md` without the section (made before 0.10.0) has none on; it changes only on the
  human's answer (a tune card, or init's offer to fill it), with a History line and a ledger
  `ruling`.

## Use
- Read `<root>/team.md` `## Companions`. Off or no line: the role's own method, unchanged, no
  warning. On: its entry point is the last of `ls -d "<config>"/plugins/cache/<entry point> |
  sort -V` (`<config>` = `${CLAUDE_CONFIG_DIR:-$HOME/.claude}`); a user-level skill's is the file
  its entry names under `<config>/skills/<name>/`; none: the skip line below.
- Run only the Run line, through the tools the role already has; read only what it names.
- A companion only adds findings: it never removes, downgrades or replaces one the role's own
  method found, nor changes a threshold or a verdict rule.
- The project's guideline wins: a hit that contradicts it, a validated pattern or a validated
  mockup is dropped with a report line `companion <name> dropped: <hit> (<guideline rule>)`.
- A missing entry point, a failure, or a need for network, setup or a download: skip it for this
  run and write `companion <name> skipped: <reason>` in the report. Not a finding, no verdict
  change.
- Output goes to the run's report folder under the GTM root or to a temporary folder outside the
  repository; nothing lands in the tracked tree (no `.impeccable/`, PRODUCT.md, DESIGN.md or audit
  table).

## impeccable
- **Source:** github.com/pbakaus/impeccable; the human installs it with `/plugin marketplace add
  pbakaus/impeccable`, then `/plugin install impeccable@impeccable`.
- **Entry point:** `impeccable/impeccable/*/skills/impeccable/scripts/impeccable`; its craft floor
  is `reference/craft-floor.md` in the same skill folder.
- **Run:** `IMPECCABLE_LAUNCHER_PROBE=1 "<entry>" detect --json <html file or URL>` (the variable
  makes the launcher refuse a download): exit 0 no hit, exit 2 a JSON array of hits, anything
  else a failure.
- **Roles:** `designer` reads the craft floor before drawing a new screen and runs the detector on
  its HTML before handing back, fixing the hits the design guideline allows; `design-critic` runs
  it on each mockup page, a hit breaking a hard rule is a must-fix under that rule, any other a
  should-fix; `ux-qa` runs it on the touched screens once per review, a hit on an accessibility
  rule is important, any other a minor.
- **Never:** any other command (critique, polish, live, init, document, extract, hooks, pin,
  update, doctor and the rest); its PRODUCT.md or DESIGN.md is never a design source.

## humanize
- **Source:** github.com/ccf/humanize; the human installs it with `/plugin marketplace add
  ccf/humanize`, then `/plugin install humanize@humanize`.
- **Entry point:** `humanize/humanize/*/skills/humanize/SKILL.md`, with `scripts/surface_scan.py`
  beside it.
- **Run:** that SKILL.md's audit mode steps 1 to 3 only, as `--audit-only` (the scanner as
  `python3 -I <scan> --text <file>`); then rewrite only the flagged passages, keeping every fact,
  code span, command, path, number, link and name. `guidelines/voice.md` wins a disagreement (a
  habit the project has, a `footprint.skip` entry): the passage stays.
- **Text:** English, 80 words or more, else skipped with a one-line note. Never a briefing.
- **Roles:** `ship` on the PR text before the footprint check, and on the release notes before
  the human sees them in the release go, then one briefing line (flagged, rewritten, kept);
  `implementer` in a task that changes documentation prose (the places `guidelines/docs.md` lists
  under "Where"; without it, the README and `docs/`), on what it changed, before its commit.
- **Never:** a rewrite of unflagged text, an audit table in a tracked file, commit or PR text,
  and with `stealth: on` no tool name either.

## break-ui
- **Source:** github.com/emilkowalski/skills (MIT); the human installs it with `npx skills@latest
  add emilkowalski/skills`; a user-level skill, listed as `break-ui`.
- **Entry point:** `<config>/skills/break-ui/CATALOG.md`, the worst-case data catalog.
- **Run:** read that catalog only, never the skill's workflow. For each touched screen, take the
  rows that apply and build one worst-case dataset through the boundary its demo data already
  uses, inside your own capture harness or a temporary folder outside the repository; capture the
  screen with it at `design.widths` and report each break, with no change to the project's files.
- **Roles:** `ux-qa`, once per review, on the touched screens: a break on an accessibility path
  (a lost label, a target pushed off screen) is important, any other a minor.
- **Never:** its dev toggle, a fixture or component edit, a commit or a fix; nonsense values (random
  strings, thousands of characters), which its own catalog refuses.

## review-animations
- **Source:** github.com/emilkowalski/skills (MIT), installed with break-ui; a user-level skill,
  listed as `review-animations`.
- **Entry point:** `<config>/skills/review-animations/STANDARDS.md`.
- **Run:** only when the mockup adds or changes motion (a transition, an animation, keyframes, a
  motion library call): read that file only and check each motion against it.
- **Roles:** `design-critic`, on a mockup page with motion: a motion that ignores reduced motion
  is a must-fix, any other miss a should-fix; your own measurements still decide the score.
- **Never:** its rewrite, plan or audit steps; a change to any file.
