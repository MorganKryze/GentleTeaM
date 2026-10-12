# Changelog

All notable changes to GTM. Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/);
versions follow [SemVer](https://semver.org/).

## [Unreleased]

### Added
- Workflow test (`scripts/workflows.test.mjs`, no dependencies): runs deliver-task and
  design-loop against scripted agents and checks what they return and whom they dispatch,
  with which model and effort: fix rounds, the Fix ceiling, the specialists a Fix keeps on
  security and data ground, the design bar and rounds. `scripts/validate.mjs` runs it.

### Changed
- Install docs: in the VS Code extension, reload the window to see new or updated skills in the
  command menu; `/reload-plugins` alone does not refresh it.
- A Fix on security or data ground no longer escalates to a Feature: the specialist for that
  ground joins the reviewer, and only a Fix past the Fix ceiling escalates. A schema, migration or
  auth change is still a Feature from the track pick (position 9, docs/positions.md).
- A small Feature (no screen, schema, migration or auth change, at most twice the Fix ceiling in
  estimated files) gets its spec and plan from one architect pass; the plan step keeps that plan
  unless a card is answered otherwise or the spec changes. The track pick says small or not, with
  the file count.

### Fixed
- Fix rounds keep the implementer at `max`, or any effort outside `low` to `xhigh`, instead of
  dropping it to `medium` on the first round; `low` to `xhigh` still rise one level per round.

## [0.2.0] - 2026-10-12

### Added
- Stealth mode (`stealth: on|off` in `.gtm/config.yml`, chosen at `/gtm:init`, switched with
  `/gtm:tune`): GTM's files stay out of the tracked tree, nothing it writes into the project names
  it, no attribution trailers, branches follow the project's pattern.
- Project voice guideline (`guidelines/voice.md`) in every project, mandatory with stealth on:
  text written into the project follows its own history and docs, in plain writing. The
  implementer, ship and retro read it.
- Footprint check (`plugins/gtm/scripts/footprint-check.mjs`, no dependencies): scans the branch
  name, commit messages, PR text, added lines and new file names for GTM's vocabulary, excluded
  paths, attribution and writing tells; `/gtm:ship` runs it with stealth on and stops on a hit.
  Patterns are configurable under `footprint` in the config; `scripts/validate.mjs` runs its
  fixture test.
- Docs: a Stealth mode section in the method, position 15 ("GTM serves the project, it does not
  sign it"), glossary entries, a README line.

### Fixed
- Decision cards render as plain Markdown (a bold question, an options table, one line with the
  recommendation and the cost if wrong) with labels in the human's language, instead of a code
  block with English labels. The briefing format keeps prose, cards and tables out of code fences
  and lines within an 80-100 column terminal.

## [0.1.1] - 2026-10-12

### Changed
- Init recommends GTM's conventions (merge commits, never rewrite pushed history) unless the
  repository's history clearly shows another established practice; it then cites the evidence and
  still states GTM's default and why.
- Init runs only fast verify commands (lint, typecheck or a smoke test) within 90 seconds and marks
  the rest `[CHECK]`; the first `/gtm:deliver` run confirms them. The draft takes about 1-2 minutes.

### Fixed
- Docs name the entry point `/gtm:gtm`; bare `/gtm` may resolve when unambiguous.

## [0.1.0] - 2026-10-12

### Added
- Marketplace `gentleteam` and plugin `gtm`.
- Three tracks (Fix, Feature, Milestone) with automatic, one-way escalation from Fix to Feature.
- Eleven role agents: analyst, designer, design-critic, architect, implementer, reviewer,
  security-reviewer, data-reviewer, ux-qa, final-reviewer, release-qa.
- Workflows `design-loop` and `deliver-task`, taking the project's team profile per dispatch.
- Skills `/gtm`, `init`, `design`, `spec`, `plan`, `deliver`, `ship`, `retro`, `tune`, `brief-me`.
- Templates for the brief, config, team profile, conventions and eleven guideline files, backlog,
  spec, plan, ledger, and the human briefing format.
- Docs: manifesto, positions, principles, method, roles, glossary, install, companions,
  contributing; CI validation of manifests, frontmatter and workflow syntax.
