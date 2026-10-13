---
title: Install
description: Install GTM in Claude Code, for yourself or for a whole project.
---

::: callout summary
- **You will learn:** how to install GTM and set it up in a project.
- **Reading time:** 2 minutes.
- **Before this:** Claude Code in a terminal.
:::

## For yourself

In a Claude Code session:

```text
/plugin marketplace add MorganKryze/GentleTeaM
/plugin install gtm@gentleteam
```

On Claude Code 2.1.275 or later, one command does both:
`/plugin install gtm --marketplace MorganKryze/GentleTeaM`.

## Set up a project

In your project, run `/gtm:init`. GTM reads the repository and drafts a one-page
[brief](/reference/glossary/#brief) (your project's purpose, users and limits), your conventions
and your [team settings](/reference/glossary/#team-settings) (which roles run, and how hard each
one thinks). You approve or edit each one in a single reply.
