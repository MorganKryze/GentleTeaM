---
name: ship
description: Prepare a GTM branch for the human's go - gate check, PR text, then push, merge, tag or release only what the human explicitly approves, plus release notes and live QA after deployment. Use when /gtm:deliver reports the branch ready.
argument-hint: "[branch or slug]"
---
# Ship (touchpoint 3: the go)

Ground rules: as in the `gtm` skill §0. Nothing is pushed, merged, tagged or released without the
human's explicit go **in this conversation**, for that exact action.

## 1. Check
The final review says ready; the working tree is clean; the gate passes once more (run it, quote
the result). Commit messages carry nothing from `git.forbid` (check with `git log --format=%B`).

## 2. Write the PR text
`<root>/reports/<slug>/pr.md`: a Conventional title; a body with the For-you summary, what changed
for the user, how it was proven (tests, gate, review verdicts), the rulings, the deferred minors.
Never name anything in `git.never_name`.

## 3. Ask the go (one decision card)
```
Decision: what to do with <branch>
Options:  A. push and open the PR · B. merge locally into <base> (merge commit) · C. wait
I recommend: <letter>, because …
Cost if wrong: …
```
Execute exactly what was approved. Merge as `git.merge` says; never squash or rewrite history
unless the config says so. Tag and release only when asked: release notes from the CHANGELOG or
the commits since the last tag, grouped by type, in the human's language.

## 4. After the human deploys
If `qa.live_url` is set, offer one line: run `gtm:release-qa` on the live instance. Report per the
briefing format; a bug becomes a Fix or a Feature through `/gtm:gtm`.

Once merged, mark the story done in `<root>/backlog.md` (definition of done: `guidelines/work.md`).
Then suggest `/gtm:retro` in one line.
