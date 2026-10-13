---
title: Contributing
description: How to propose a change to GTM, the checks it must pass, and how versions move.
---

::: callout summary
- **You will learn:** how to propose a change, what every change keeps, the checks, how versions
  move and how to run the plugin from a checkout.
- **Reading time:** 3 minutes.
- **Before this:** [Install GTM](/start/install/).
:::

GTM stays useful by staying light. A change is welcome when it removes work for you or the team,
and suspect when it adds a document, a role or a question. Propose it in an issue first, keep the
pull request small, and update the CHANGELOG and the version together.

## How do I propose a change?

1. Open an issue: the problem in one paragraph, the change, what it costs (a new file, more
   tokens, one more question to you) and what it removes.
2. For a change to a position or a principle, say which one and why the trade-off should move.
3. Keep each pull request to one logical change.
4. Write Conventional Commits; pull requests land as merge commits (no squash).

## What does every change keep?

- Each file earns its place and starts with a short summary; English throughout; no emoji in docs.
- Skills under 500 lines (aim for under 80); agent prompts short; descriptions concise, since
  they load in every session.
- Nothing that Claude Code ignores in a plugin is added: no agent `hooks`, `mcpServers` or
  `permissionMode`, and no root `CLAUDE.md`.
- Workflows stay deterministic: no `Date.now()`, `Math.random()` or argless `new Date()`.

## Which checks must pass?

`node scripts/validate.mjs` and `claude plugin validate .` must pass; CI runs both on every push.
`validate.mjs` also runs each workflow against scripted agents (`scripts/workflows.test.mjs`): a
new workflow needs a scenario there, and a changed default or threshold changes one.

## How do versions move?

SemVer, in `plugins/gtm/.claude-plugin/plugin.json` only, never in the marketplace entry. Bump it
in the release commit, with its `CHANGELOG.md` entry.

| Bump | When |
| --- | --- |
| Patch | fixes, wording, a clearer prompt |
| Minor | a new skill, role, config field or behaviour that existing projects can ignore |
| Major | a change existing `.gtm/` folders must migrate to (renamed files or fields); the release notes say how |

Each release adds a section to `CHANGELOG.md` (Keep a Changelog). Tags are `v<version>`, created
by the maintainer.

## How do I run GTM from a checkout?

`claude --plugin-dir ./plugins/gtm` loads the plugin from a checkout; `/reload-plugins` picks up
edits. A marketplace added from a local path also reads files in place, with no version bump.

In the VS Code extension, the command menu lists new or updated skills only after a window reload
(Developer: Reload Window); `/reload-plugins` alone does not refresh it.
