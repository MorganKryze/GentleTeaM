---
title: How the team works
description: The checks, hand-offs, re-reviews and records behind each step.
---

::: callout summary
- **You will learn:** what each step checks before work moves on, how the roles pass work to
  each other, and how each branch makes the next one cheaper.
- **Reading time:** 7 minutes, or look up one section.
- **Before this:** [Roles](/reference/roles/), for who does what.
:::

This page names the team's internal terms, each defined at first use. You never need them to use
GTM; they help when you read a report or the [logbook](/reference/glossary/#logbook). To see the
same steps from your side, follow [your first Feature](/tutorial/first-feature/).

## What must pass before work moves on?

A gate is a check that must pass before work moves on. There are six, one per step of a
[Feature](/reference/glossary/#feature).

| Gate | Passes when | Otherwise |
| --- | --- | --- |
| [Mockups](/reference/glossary/#mockups) | the critic scores at or above the threshold (`8/10` by default) with zero must-fix, within the round limit | you choose: approve as is, one more round, or change the [brief](/reference/glossary/#brief) |
| Spec | zero `[NEEDS CLARIFICATION]`, every [decision card](/reference/glossary/#decision-card) answered, your approval | back to the architect, or a card to you |
| Plan | every task has files, test steps and a verify command; every acceptance line maps to a test; risky tasks get a [dry run](/reference/glossary/#dry-run) | one [correction round](/reference/glossary/#correction-round) with the architect |
| Task | every triggered reviewer approves (no critical or important finding) within the correction-round limit | you choose: revise the plan, accept with findings logged, or take over |
| Branch | the final review says ready, after at most one fix wave, or is skipped | a decision card to you |
| Ship | your explicit go for that exact action | nothing leaves the machine |

`NEEDS CLARIFICATION` marks something the spec must not guess. EARS (Easy Approach to
Requirements Syntax) is the form of the spec's acceptance lines: WHEN, WHILE, WHERE or IF, then
THE SYSTEM SHALL.

Each task review plants up to five mutations first: one small change per acceptance line the task
touches, in a throwaway clone, with the project's own tests run against each. A mutation the tests
miss is a finding, never a silent pass, and a re-review replays it against the fix. A docs-only
task, one with no executable test, a red suite or a `review mutations: off` line in `team.md` skips
the step, and the summary says why.

The final review replays two of the mutations the task reports planted, those that move or drop a
pinned threshold, plan order on a tie (all of them when two or fewer); one that survives is a
must-fix. A branch of one task, clean at zero correction rounds, skips it: that task's review, with
every triggered specialist, was the last, and the `run` line in `ledger.md` says so. Any correction
round, a commit outside the tasks' ranges (a [Fix](/reference/glossary/#fix) that grew, a hand
commit) or a specialist whose trigger matched a task's changed paths but who did not review it
brings the final review back.

## How do roles pass work to each other?

- **Hand-off:** an agent receives paths (brief, spec, plan, report file), never pasted documents.
- **Hand-back:** at most ten lines, or the structured object a workflow asks for: status, files,
  verify result, concerns. The full report goes to the report file when one is given, else into
  that object's summary; the structured call is the agent's last action.
- **Retries:** a critic or reviewer is retried once when it throws, on a 25-call budget, before
  the workflow's fallback. A blocked or skipped one is not dispatched again, nor is an
  implementer. A reviewer left with no review keeps the task open.
- **Fresh context:** reviewers see the brief, the report and the diff, never the implementer's
  reasoning.

Specialists are called in by the path patterns in your
[team settings](/reference/glossary/#team-settings), matched against the files the implementer
reports changing: a file it leaves out triggers nothing. On a Feature the final review reads the
whole branch and catches it; a Fix has no final review.

## Who re-reviews a correction, and when does a finding stop counting?

Re-reviews go only to the reviewers who flagged something and to every specialist whose ground
the correction's diff touches. They check only their findings and that diff.

A re-review returns each finding it was sent with a status. `addressed` stops it blocking and
counting; no status leaves it open, and each finding keeps its severity until it is addressed.
Every review request carries the scope rule, read against the task's whole range on every round:
a defect the task's diff did not introduce is `minor`, unless it is critical, a security hole or
a data-integrity defect. A minor finding does not block a task; it is logged and triaged by the
final review.

## How much review does each task get?

Each task in the plan has a tier, matched to its risk. A task is **guarded** when one of its files
matches the paths of a specialist your [team settings](/reference/glossary/#team-settings) keep
per task; the security and data reviewers always are. It gets the full loop: a review after the
task, every triggered specialist, up to three correction rounds. Every other task is
**standard**: the implementer runs the checks before each commit, and one review covers the whole
wave of consecutive standard tasks, with one correction round at most; findings that do not
block go to the logbook. The `review cadence` line in `team.md` sets how often each reviewer runs:
per task, per wave, or once per branch for ux-qa. Without that line every task is guarded, as
before GTM 0.7.0. A standard task that turns out to touch a per-task specialist's paths is
reviewed on its range and stays guarded from then on.

## How hard does the implementer think on each correction round?

A task gets 3 [correction rounds](/reference/glossary/#correction-round) at most by default. Each
round raises the implementer's effort one level on the ladder `low`, `medium`, `high`, `xhigh`,
capped at `xhigh`. An effort off that ladder, such as `max`, is kept as set in `team.md`.

## When do tasks run at the same time?

A parallel wave is two or more consecutive tasks marked `[P]` in the plan whose files, CHANGELOG
included, are disjoint. They run at once, each in its own worktree outside the repository and on
its own branch. When all have returned, the clean ones merge into the delivery branch with merge
commits in plan order, then the gate runs once.

A branch name with a character other than letters, digits and `._/-`, a moved branch or head, an
overlap of files, a conflict, a red gate, a failed check or files left in a worktree's GTM folder
stops the merges, and nothing is undone without you. A task left open or blocked does not hold back
its clean siblings, which still merge, but no later task starts.

## How are several screens designed?

The design loop gives each screen its own designer and critic, all at once. Each screen is redrawn
alone until it passes or its rounds run out (3 by default), and the
[mockups](/reference/glossary/#mockups) pass when every screen passed.

## What happens after a `fix-first` final review?

One fix wave at most per branch: the implementer at a correction round's effort, then a
re-review of the fix range, one effort level lower when that range touches no specialist's
ground.

## How is a risky task proved before delivery?

While planning, the architect runs a risky task's code in a scratch clone to prove the plan
before delivery: a [dry run](/reference/glossary/#dry-run), for plans of two tasks or more. A
one-task plan plants its mutations in its test steps instead. Which paths are risky is set in
`team.md`.

## How is a plan kept small?

The architect plans at most the `tasks per branch` line of `team.md` (8 by default), a
release-only task not counted. Each task is a vertical slice, a screen or a flow, and one unit of
review. A plan over the limit goes back once, then you choose on a card to split it or accept it.

Each task names the numbered global constraints of the plan it touches. Its brief holds the task
word for word, those constraints, and paths to the rest: the implementer reads less, and the rule
stays in one place.

## When is a screen designed in code?

When `design.kit` names a validated kit and `ux-qa` is on, a Feature whose screens use only the
kit's patterns skips the mockups. `/gtm:gtm` says "design in code" and why; `ux-qa` captures the
screens at `design.widths`, and you approve those captures with the go. A new pattern, a new
direction, your own request, no kit or `ux-qa` off: the mockups run as before.

## How is a run stopped and resumed?

`/gtm:pause` stops what runs and keeps every commit, worktree and file; a half-written spec or
plan becomes `.partial`. It writes `handoff.md` and a `paused` line in the branch's progress.
On resume, `/gtm:deliver` skips the tasks already clean, and reruns each stopped task whole from
the base its line names, never from its head. A stopped final review or fix wave reruns whole
too, so nothing stopped ends clean without a full review.

## How is GTM's own size held?

The size check, `node plugins/gtm/scripts/size.mjs`, sums what each session loads from GTM: the
name and description of each agent and model-invocable skill, and each workflow's name,
description and when-to-use line, at one token per four characters. It lists them largest
first and fails above its budget. The gate and CI run it on every push.

## How does each branch make the next one cheaper?

The [logbook](/reference/glossary/#logbook), `ledger.md`, is append-only, one line per entry:
`- <date> · <slug> · <kind> · <text>`, with kinds `lesson`, `ruling`, `minor`, `resolved`, `run`
and `usage`. Superseded lines are struck through, never deleted.

This is the compound step. The architect reads the logbook before every plan and lists the
lessons it applied. [`/gtm:retro`](/reference/glossary/#retro) distils each delivered branch into
at most five lessons and promotes recurring ones to guidelines.
[`/gtm:tune`](/reference/glossary/#tune) reads the `run` and `usage` lines to adjust the
[team settings](/reference/glossary/#team-settings).

Each `run` line ends with a `lenses` segment: how many items each role tagged with each of its
reflex lenses on that branch, zeros included, as in `lenses reviewer Steelmanning 2`. A lens
that keeps reading 0 is what `/gtm:tune` offers to drop. Lines written before 0.11.0 have no
segment; they count as not measured for lenses and read as before everywhere else. Since 0.12.0
a `mutations` segment comes before it: the mutations the task reviewers planted and how many
survived; a branch with no measure reads `?`, and older lines count as not measured.

## Where does the team track larger work?

`backlog.md` stays a single table per epic.

| Entry | What it is |
| --- | --- |
| Epic | a [Milestone](/reference/glossary/#milestone) or a group of Features |
| Story | one user-visible outcome with acceptance lines; a bug is a story of type bug. One track delivers it; its acceptance lines become the spec's |
| Priority | `P0` (broken, data at risk, security hole: now), `P1` (blocks the next release), `P2` (planned), `P3` (nice to have) |
| Done | per track, as `guidelines/work.md` defines it: verified, reviewed, documented, logbook updated, and your go |

`/gtm:gtm` adds or updates the story when work starts; `/gtm:ship` marks it done. Plan tasks are
how a story is built, not stories.

## Where do the project's rules live?

`conventions.md` summarises the project's conventions in one table. Each row points at a small
guideline file under `guidelines/`: code, tests, git (commits, branches, PRs, merges, releases),
docs, dependencies, security, data, language and copy, accessibility, design, and work (priority,
epics and stories, definition of done). Each file opens with a "when to read" line.

`/gtm:init` proposes defaults adapted to what the repository already does; you accept or edit
them in one pass. Agents read only the files their role needs. `/gtm:retro` proposes guideline
edits for recurring lessons; `/gtm:tune` revisits a convention that keeps producing the same
finding.

## What does the footprint check scan?

In [stealth](/reference/glossary/#stealth) mode, `/gtm:ship` runs the footprint check after the
gate; a hit stops the ship. `plugins/gtm/scripts/footprint-check.mjs`, a Node script with no
dependencies, reads the branch against its base: the branch name, every commit message, the PR
text, every line the diff adds and every new file name.

It reports each hit with its location:

- GTM's vocabulary, and the names of excluded paths: the GTM root (`.gtm/` by default), the
  mockups folder, `git.never_name`, `.git/info/exclude`.
- The attribution text in `git.forbid`.
- In prose (commit messages, the PR, doc files, comment lines): em dashes, emoji, stock phrases,
  filler and hedging.

Lists of three and runs of short bullets come back as notes, since a pattern cannot tell them from
honest lists. The `footprint` block of `config.yml` adds words, allows known false positives and
skips tells the project's own voice uses. Sentence length and passive voice are left to
`guidelines/voice.md`.
