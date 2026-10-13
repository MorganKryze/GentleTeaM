---
title: Why GTM exists
description: The problem GTM answers, who it is for, and what it is not.
---

::: callout summary
- **You will learn:** the problem GTM answers, who it is for and what it is not.
- **Reading time:** 3 minutes.
- **Before this:** nothing.
:::

## What is the problem?

Agent teams can now write, review and test most of a feature. What they also produce is reading:
reports, [specs](/reference/glossary/#spec), reviews, status updates. You end up reading more
than you would have written, and the decisions that are yours get lost inside long texts. Two
costs remain, and popular methods tend to raise them.

The first is overload: every agent writes a report, every phase a document, and reviews
multiply. The second is drain: personas, long prompts, tool schemas and repeated reviews fill
context windows and usage limits with ceremony instead of work.

## What does GTM do about it?

GTM spends that output inside the team and hands you verdicts,
[decision cards](/reference/glossary/#decision-card) and pictures, in your language. It sizes
the process to the change: a [Fix](/reference/glossary/#fix), a
[Feature](/reference/glossary/#feature) or a [Milestone](/reference/glossary/#milestone),
chosen up front with at most two questions.

It keeps the working files few and short: a one-page brief, a spec and a plan per feature, and a
[logbook](/reference/glossary/#logbook) of lessons and decisions that only grows. Agents get
paths to files and answer in a few lines, so your conversation holds verdicts, not transcripts.

Specialists run only when a change touches their ground, and each project decides once, in
writing, how hard each role thinks: its [team settings](/reference/glossary/#team-settings).
Everything reaches you in one compact format, verdict first, with the
[decisions made for you](/reference/glossary/#decisions-made-for-you) listed at the end.

## Who GTM is for

Developers and small teams who use Claude Code for real products and want agent speed without
giving up judgment: one person shipping a side project to production, or a team that wants the
same rules applied to every branch. It assumes git, a test suite, and a person who decides.

## What does success look like?

A feature reaches review with you having spent minutes on it, not hours: one look at the
[mockups](/reference/glossary/#mockups), one [Summary](/reference/glossary/#summary), one go.
Those are the three [checkpoints](/reference/glossary/#checkpoint) of a Feature.

Every decision can be traced: who took it, why, and what it costs if it is wrong. The next plan
is better than the last, because the logbook feeds it. And no insecure or data-losing change
ships, whatever the speed.

## What GTM is not

It is not a heavyweight persona framework. Eleven roles exist, but most tasks see two of them;
there is no role-play, no story-file ceremony, no seven documents per feature.

It is not a replacement for judgment. Agents recommend and you decide what matters; GTM's job is
to make those decisions few, clear and well argued.

It is not autonomous. Nothing is pushed, merged, tagged or released without your explicit go,
and the decisions the team takes on its own are listed so you can overturn any of them.

It is not a lock-in. It is Markdown, two workflow scripts and a config file in your repository.
Stop using it and your specs, plans and logbook remain readable documents.

The stances behind these choices, and what each costs, are in [Positions](/why/positions/); the
rules that protect your attention are in [Principles](/why/principles/).
