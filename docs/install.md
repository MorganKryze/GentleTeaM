# Install, update, pin

> GTM is a Claude Code plugin served from this repository, which is also its marketplace. Install it
> for yourself in two commands, or for a whole project by committing one settings file. Updates
> follow the plugin's version; pin a git ref when you need stability.

## For yourself
In a Claude Code session:
```
/plugin marketplace add MorganKryze/GentleTeaM
/plugin install gtm@gentleteam
```
On Claude Code 2.1.275 or later, one step also works:
`/plugin install gtm --marketplace MorganKryze/GentleTeaM`.

From a shell: `claude plugin marketplace add MorganKryze/GentleTeaM`, then
`claude plugin install gtm@gentleteam`.

Then, in your project: `/gtm:init`, and `/gtm:gtm <what you want done>`. The entry point is
namespaced like every plugin skill and shows as `/gtm:gtm (gtm)` in the command menu; bare `/gtm`
may also resolve when no other command shares the name.

## For a whole project
Add the marketplace at project scope and commit `.claude/settings.json`, so teammates get GTM once
they trust the folder:
```json
{
  "extraKnownMarketplaces": {
    "gentleteam": { "source": { "source": "github", "repo": "MorganKryze/GentleTeaM" } }
  },
  "enabledPlugins": { "gtm@gentleteam": true }
}
```
`claude plugin marketplace add MorganKryze/GentleTeaM --scope project` writes the first part for you.

## Update
`/plugin marketplace update gentleteam` (or `claude plugin update gtm@gentleteam`). Background
auto-update is off by default; turn it on per marketplace in `/plugin`, Marketplaces.
Because `plugin.json` sets a `version`, you stay on your installed version until a release bumps it.

## Pin
Add the marketplace at a ref: `MorganKryze/GentleTeaM#v0.1.0` (a tag) or `#main`.

## Develop locally
`claude --plugin-dir ./plugins/gtm` loads the plugin from a checkout; `/reload-plugins` picks up
edits. A marketplace added from a local path also reads files in place, with no version bump.

## Version bump rule
`version` lives in one place, `plugins/gtm/.claude-plugin/plugin.json`, never in the marketplace
entry. Bump it in the release commit, with its CHANGELOG entry: patch for fixes and wording, minor
for a new skill, role, field or behaviour that existing projects can ignore, major for a change
that existing `.gtm/` folders must migrate to. See [contributing](contributing.md).

## Requirements
Claude Code with plugins and dynamic workflows available (workflows are on all paid plans; on Pro,
enable them in `/config`). Node.js and Playwright are needed only by the roles that render or
capture screens.
