# Changelog

All notable changes to GTM. Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/);
versions follow [SemVer](https://semver.org/).

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
