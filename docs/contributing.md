# Contributing

> GTM stays useful by staying light. A change is welcome when it removes work for the human or the
> team, and suspect when it adds a document, a role or a question. Propose it in an issue first,
> keep the pull request small, and update the CHANGELOG and the version together.

## Proposing a change
1. Open an issue: the problem in one paragraph, the change, what it costs (a new file, more tokens,
   one more question to the human) and what it removes.
2. For a change to a position or a principle, say which one and why the trade-off should move.
3. Small PRs: one logical change, Conventional Commits, merge commits (no squash).

## What every change keeps
- Each file earns its place and starts with a short summary; English throughout; no emoji in docs.
- Skills under 500 lines (aim for under 80); agent prompts short; descriptions concise, they are
  loaded in every session.
- Nothing Claude Code ignores in a plugin (agent `hooks`, `mcpServers`, `permissionMode`; a root
  CLAUDE.md).
- Workflows stay deterministic: no `Date.now()`, `Math.random()` or argless `new Date()`.

## Checks
`node scripts/validate.mjs` and `claude plugin validate .` must pass; CI runs both on every push.
`validate.mjs` also runs each workflow against scripted agents (`scripts/workflows.test.mjs`): a
new workflow needs a scenario there, and a changed default or threshold changes one.

## Versions
SemVer, in `plugins/gtm/.claude-plugin/plugin.json` only.
- **Patch:** fixes, wording, a clearer prompt.
- **Minor:** a new skill, role, config field or behaviour that existing projects can ignore.
- **Major:** a change existing `.gtm/` folders must migrate to (renamed files or fields). The
  release notes say how.

Each release adds a section to `CHANGELOG.md` (Keep a Changelog). Tags are `v<version>`, created by
the maintainer.
