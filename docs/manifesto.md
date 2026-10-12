# Why GTM exists

> GentleTeaM (GTM) is a method for building software with a team of AI agents while keeping the
> human developer in charge and unburdened. It exists because agent-assisted development tends to
> move the work from writing code to reading what agents produce, and to drain context windows and
> usage limits on ceremony. GTM keeps the team small, the artifacts few, and the human's role to
> three decisions per feature.

## The problem
Agent teams are now good enough to write, review and test most of a feature. Two costs remain, and
popular methods tend to raise them:
- **Overload.** Every agent writes a report, every phase a document; reviews multiply. The human
  ends up reading more than they would have written, and decisions get lost inside long texts.
- **Drain.** Personas, long prompts, tool schemas and repeated reviews fill context windows and
  usage limits with ceremony instead of work.

## What GTM does about it
- It sizes the process to the change: three tracks (Fix, Feature, Milestone), chosen up front with
  at most two questions.
- It keeps artifacts few and short: a one-page brief, a spec and a plan per feature, an append-only
  ledger of lessons and rulings.
- It hands work over in files and gets back short, structured answers, so the main conversation
  holds verdicts, not transcripts.
- It runs specialists only when a change touches their ground, and lets each project decide, once
  and in writing, how hard each role thinks.
- It talks to the human in one compact format: verdict first, decisions as cards with a
  recommendation, visuals over prose, the team's rulings listed at the end.

## Who it is for
Developers and small teams who use Claude Code for real products and want agent speed without
giving up judgment: one person shipping a side project to production, or a team that wants the
same rules applied to every branch. It assumes git, a test suite, and a human who decides.

## What success looks like
- A feature reaches review with the human having spent minutes, not hours, on it: one board, one
  synthesis, one go.
- Every decision is traceable: who took it, why, and what it costs if it is wrong.
- The next plan is better than the last, because the ledger feeds it.
- No insecure or data-losing change ships, whatever the speed.

## What GTM is not
- **Not a heavyweight persona framework.** Eleven roles exist, but most tasks see two of them; there
  is no role-play, no story-file ceremony, no seven documents per feature.
- **Not a replacement for judgment.** Agents recommend; the human decides what matters. GTM's job
  is to make those decisions few, clear and well argued.
- **Not autonomous.** No AI decision ships without a human touchpoint: nothing is pushed, merged,
  tagged or released without the human's explicit go.
- **Not a lock-in.** It is markdown, two workflow scripts and a config file in your repository.
  Stop using it and your specs, plans and ledger remain readable documents.

Read next: [positions](positions.md) for the stances and their costs, [method](method.md) for how
it works.
