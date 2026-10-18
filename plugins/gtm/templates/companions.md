# Companions

> The optional plugins GTM knows. `/gtm:init` and `/gtm:tune` detect them, `team.md` records the
> human's choice in its `Companions` section, and a role uses one only when it is `on` there and
> present. GTM never installs, enables, updates or sets one up: that is the human's step.

## Detect
- Init and tune only, read-only: a companion is found when the session lists its skill
  (`impeccable:impeccable`, `humanize:humanize`). No tool call, nothing run or written.
- Init: each one found is a row of the team-settings table, proposed `on`; none found, no row.
  No question and no install advice either way: the docs name them.
- Record what the human approves: `- <name>: on|off · detected skill <skill> · roles <roles> ·
  why: <reason> · <YYYY-MM-DD>`; none found, `- none detected · <YYYY-MM-DD>`.
- Tune: one change-or-keep card per difference (a known one now listed but not recorded, a
  recorded one no longer listed), inside its five-card cap.
- A `team.md` without the section (made before 0.10.0) has none on; it changes only through a
  tune card the human approves.

## Use
- Read `<root>/team.md` `## Companions`. A companion is used when its line says `on` and its
  entry point exists under `<config>/plugins/cache/`, newest version folder (`<config>` =
  `${CLAUDE_CONFIG_DIR:-$HOME/.claude}`). Otherwise the role's own method, unchanged, no warning.
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
- **Entry point:** `*/impeccable/*/skills/impeccable/scripts/impeccable`; its craft floor is
  `reference/craft-floor.md` in the same skill folder.
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
- **Entry point:** `*/humanize/*/skills/humanize/SKILL.md`, with `scripts/surface_scan.py`
  beside it.
- **Run:** that SKILL.md's audit mode steps 1 to 3 only, as `--audit-only` (the scanner as
  `python3 -I <scan> --text <file>`); then rewrite only the flagged passages, keeping every fact,
  code span, command, path, number, link and name. `guidelines/voice.md` wins a disagreement (a
  habit the project has, a `footprint.skip` entry): the passage stays.
- **Text:** English, 80 words or more, else skipped with a one-line note. Never a briefing.
- **Roles:** `ship` on the PR text, and on the release notes when it writes them, before the human
  reads them and before the footprint check, then one briefing line (flagged, rewritten, kept);
  `implementer` in a task that changes documentation prose (the places `guidelines/docs.md` lists
  under "Where"; without it, the README and `docs/`), on what it changed, before its commit.
- **Never:** a rewrite of unflagged text, an audit table in a tracked file, commit or PR text,
  and with `stealth: on` no tool name either.
