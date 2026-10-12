# Conventions

> One-table summary of the project's conventions. Each row points at its guideline file, which
> agents read for their role. Proposed at `/gtm:init`, revisited with `/gtm:tune`.
>
> Each row starts as GTM's default. Init keeps it unless the repository's history clearly shows
> another established practice; the row then keeps that practice, cites the evidence, and still
> states GTM's default and why (e.g. "squash: 40 of the last 40 PRs, `git log --first-parent`;
> GTM default: merge commits, so each commit stays bisectable and revertable").

| Area | Convention in one line | File | Decided |
| --- | --- | --- | --- |
| Code | small units, stdlib first, no dead code | guidelines/code.md | YYYY-MM-DD |
| Tests | test first; unit, integration, e2e; flakes fixed within N weeks | guidelines/tests.md | YYYY-MM-DD |
| Git | Conventional Commits, merge commits, never rewrite pushed history | guidelines/git.md | YYYY-MM-DD |
| Releases | SemVer, CHANGELOG, tag on the human's go | guidelines/git.md | YYYY-MM-DD |
| Docs | summary first, plain tone, documented in the same branch | guidelines/docs.md | YYYY-MM-DD |
| Dependencies | a reason, a licence check, pinned | guidelines/dependencies.md | YYYY-MM-DD |
| Security | <threat model in a few words> | guidelines/security.md | YYYY-MM-DD |
| Data | nothing lost, duplicated or silently altered | guidelines/data.md | YYYY-MM-DD |
| Language and copy | <languages>, no hard-coded strings | guidelines/i18n.md | YYYY-MM-DD |
| Accessibility | WCAG <level>, 44 px targets, keyboard | guidelines/accessibility.md | YYYY-MM-DD |
| Design | breathing room, readability, accessibility | guidelines/design.md | YYYY-MM-DD |
| Work | P0-P3, epics and stories, done per track | guidelines/work.md | YYYY-MM-DD |
