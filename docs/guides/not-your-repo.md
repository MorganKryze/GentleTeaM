---
title: Work on a repository that is not yours
description: What stealth mode changes, how to switch it, and what it leaves to the project's rules.
---

::: callout summary
- **You will learn:** what stealth mode changes in a project, how to switch it, and what it never
  overrides.
- **Reading time:** 4 minutes.
- **Before this:** [Install GTM](/start/install/).
:::

[Stealth](/reference/glossary/#stealth) mode is for a repository whose history is not yours to
sign: a client's project, an open-source project you contribute to. GTM runs the same team; it
leaves no trace in the project, and what it writes there reads as if the project's own people
wrote it.

## What does stealth mode change?

| Area | Stealth off (default) | Stealth on |
| --- | --- | --- |
| GTM's files | `.gtm/` may be committed, reports and [mockups](/reference/glossary/#mockups) excluded | the whole folder excluded through `.git/info/exclude`, or kept outside the repository |
| Tracked files | a line in `CLAUDE.md` when GTM's folder moves | nothing: no README badge, no `CLAUDE.md` or `AGENTS.md` line, no committed `.claude/settings.json`; GTM is installed at user scope |
| Commits, PRs, docs, comments, changelogs, branch names | plain writing | no GTM name (GTM, `.gtm`, its roles, commands, plans, [logbook](/reference/glossary/#logbook) or workflows), no attribution trailer, branches in the project's pattern |
| Voice | `guidelines/voice.md` is read | `guidelines/voice.md` is mandatory |
| Shipping | the project's checks | the project's checks, then a scan of everything that would leave; a hit stops the ship |

The voice guideline is part of every project's conventions. It asks for the voice found in the
project's own `git log`, docs and comments, and for plain writing: no filler or hedging, no stock
phrases, no em-dash habit, no emoji clutter, specific words, active voice, varied sentence length.

## How do I switch it on or off?

`/gtm:init` asks, with a recommendation from what it found: who owns the repository, its
contributors, any policy on tools. Later, `/gtm:tune stealth on` or `/gtm:tune stealth off`
switches it. Turning it on offers to remove what GTM already left in tracked files, in one commit;
history you have already pushed is never rewritten.

## What is checked before anything leaves?

With stealth on, `/gtm:ship` scans the branch against its base before a push: the branch name,
every commit message, the PR text, every added line and every new file name. It reports each hit
with its place:

- GTM's own words and the paths kept out of the project;
- the attribution text the project forbids;
- in prose, em dashes, emoji, stock phrases, filler and hedging.

Lists of three and runs of short bullets come back as notes, since a pattern cannot tell them from
honest lists. A hit stops the ship until you fix it. How the scan works, and how to allow a known
false positive, is in [How the team works](/reference/how-the-team-works/).

## What does stealth mode not change?

::: callout warning "Your project's rules come first"
Stealth mode changes what GTM writes into the project. It does not change any rule your
organisation, or the project you contribute to, sets about AI tools and disclosure. Follow those.
:::
