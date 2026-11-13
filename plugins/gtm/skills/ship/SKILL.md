---
name: ship
description: "Ship a GTM branch: gate, PR text, then push, merge, tag or release only on the human's go. Use when /gtm:deliver is ready."
argument-hint: "[branch or slug]"
---
# Ship (checkpoint 3: the go)

Ground rules: as in the `gtm` skill §0. Nothing is pushed, merged, tagged or released without the
human's explicit go **in this conversation**, for that exact action.

## 1. Check
The final review says ready, or the last `run` line a delivery wrote for this slug holds
`final review skipped: one task, clean at 0 fix rounds` or `Fix: CLEAN, no final review`
(read anywhere else, neither counts); the working tree is clean; the gate passes once more
(run it, quote the result). Commit messages carry nothing from `git.forbid` (check with
`git log --format=%B`). With `verify.runner` set, run each gate command through it once at the
head too, as `${CLAUDE_PLUGIN_ROOT}/templates/runner.md` says (`## Before the push`).

## 2. Write the PR text
`<root>/reports/<slug>/pr.md`, written as `<root>/guidelines/voice.md` says: a Conventional title; a body with the Summary, what changed
for the user, how it was proven (tests, gate, review verdicts), the decisions made for you, the deferred minors.
Never name anything in `git.never_name`. With `stealth: on`, the body takes the shape of the
project's own recent PRs, with none of GTM's section names (Summary, decisions made for you, deferred minors).

With humanize `on` in `<root>/team.md` and present, run its audit on `pr.md` as
`${CLAUDE_PLUGIN_ROOT}/templates/companions.md` says (humanize), before §2b, and give its one
briefing line.

## 2b. Footprint check (stealth on only)
Run, and quote the result:
`node ${CLAUDE_PLUGIN_ROOT}/scripts/footprint-check.mjs --config <root>/config.yml --base <git.base> --pr <root>/reports/<slug>/pr.md`
Any hit stops the ship. Show each hit with its location, then fix: files in a new commit, the PR
text in place, commit messages by rewording the unpushed commits (a decision card: it rewrites
local history). A false positive goes to `footprint.allow` only with the human's answer. Rerun
until it reports no hit. Notes (lists of three, short bullet runs) do not stop it: reread those
lines against `guidelines/voice.md`.

## 3. Ask the go (one decision card)
Under a standing go (`git.push: standing`), first run and quote
`node ${CLAUDE_PLUGIN_ROOT}/scripts/now-facts.mjs --root <root> --landing <slug> --proofs gate`
(`gate,footprint` with stealth on), naming only the proofs §1 and §2b ran green.
- `landing` true: push, merge, tag and release nothing. Rewrite `NOW.md` and the state
  (`templates/now.md`), append `- <YYYY-MM-DD> · <slug> · run · landing: <class> at <short head>,
  nothing pushed` to the ledger, and say in one line that the landing holds until the next commit,
  for the human's own program to check and merge. No card.
- `landing` false, or an exit other than 0: the card below as always, with one Heads-up naming
  why (`why`, `file`, `proof`).

A tag, a release or a publication always waits for the go below, under a standing go or a
mandate. After a landing, write and offer no revert: the return window is the human's program's;
a revert the human asks for takes the usual track and this go.

**Decision: what to do with <branch>**

| Option | What it means |
| --- | --- |
| **A** push | push and open the PR |
| **B** merge | merge locally into <base> (merge commit) |
| **C** wait | nothing leaves the machine |

**I recommend: <letter>**, <why>. **Cost if wrong:** <one line>.

Execute exactly what was approved. Merge as `git.merge` says; never squash or rewrite history
unless the config says so. Tag and release only when asked: release notes from the CHANGELOG or
the commits since the last tag, grouped by type, in the project's voice (`guidelines/voice.md`);
the same humanize pass runs on the notes, then with `stealth: on` §2b's command with `--pr <notes
file>`, and the notes are shown to the human with the release go.

After a push, watch the checks read-only; the card above comes back for the merge only when every
check has ended green and none is red, a skipped or cancelled one read as `runner.md` says (`## On
a CI red`). A CI red follows `## On a CI red`; under `git.push: standing`, so does a CI red the
human reports on a landing.

## 4. After the human deploys
If `qa.live_url` is set, offer one line: run `gtm:release-qa` on the live instance. Report per the
briefing format; a bug becomes a Fix or a Feature through `/gtm:gtm`.

Once merged, mark the story done in `<root>/backlog.md` (definition of done: `guidelines/work.md`).
Then suggest `/gtm:retro` in one line.
