---
title: Install
description: Install GTM in Claude Code, for yourself or for a whole project, then run it.
---

::: callout summary
- **You will learn:** how to install GTM, keep it current, and run your first commands.
- **Reading time:** 3 minutes.
- **Before this:** Claude Code in a terminal.
:::

## How do I install it for myself?

In a Claude Code session:

```text
/plugin marketplace add MorganKryze/GentleTeaM
/plugin install gtm@gentleteam
```

On Claude Code 2.1.275 or later, one command does both:

```text
/plugin install gtm --marketplace MorganKryze/GentleTeaM
```

From a shell, the same two steps:

```text
claude plugin marketplace add MorganKryze/GentleTeaM
claude plugin install gtm@gentleteam
```

## How do I install it for a whole project?

Add the marketplace at project scope and commit the settings file of your project,
`.claude/settings.json`. Your teammates get GTM once they trust the folder:

```text
{
  "extraKnownMarketplaces": {
    "gentleteam": {
      "source": { "source": "github", "repo": "MorganKryze/GentleTeaM" }
    }
  },
  "enabledPlugins": { "gtm@gentleteam": true }
}
```

This command writes the first part:

```text
claude plugin marketplace add MorganKryze/GentleTeaM --scope project
```

## What are my first commands?

In your project, run `/gtm:init`. GTM reads the repository and drafts a one-page
[brief](/reference/glossary/#brief) (your project's purpose, users and limits), your conventions
and your [team settings](/reference/glossary/#team-settings) (which roles run, and how hard each
one thinks). You approve or edit each one in a single reply.

Then ask for a change with `/gtm:gtm <what you want done>`. GTM picks the size of the change with
at most two questions and runs it. The command menu lists it as `/gtm:gtm (gtm)`; bare `/gtm` may
also work when no other command shares the name.

Later, run `/gtm:retro` after shipping, `/gtm:tune` when the team feels slow, costly or blind to
something, and `/gtm:brief-me` to understand any file GTM wrote without reading it.

## How do I update it?

Run `/plugin marketplace update gentleteam`, or `claude plugin update gtm@gentleteam` from a
shell. Background auto-update is off by default; turn it on per marketplace in `/plugin`,
Marketplaces. GTM sets a version, so you stay on the one you installed until a release bumps it.

## How do I pin a version?

Add the marketplace at a git ref rather than at its default branch: a tag such as
`MorganKryze/GentleTeaM#v0.5.0`, or `#main` to follow the latest work.

## What do I need?

Claude Code with plugins and dynamic workflows available. Workflows are on all paid plans; on
Pro, enable them in `/config`. Node.js and Playwright are needed only by the roles that render or
capture screens.

To work on GTM itself from a checkout, see [Contributing](/reference/contributing/).
