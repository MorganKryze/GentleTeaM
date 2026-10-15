---
name: gtm
description: GentleTeaM entry point. Use when starting any piece of work with GTM - explains the method in a few lines, picks the track (Fix, Feature, Milestone) with at most two questions, and routes to the right GTM skills.
argument-hint: "[what you want done]"
---
# GTM: the light agent team

GTM runs a small team of role agents for you. You see three checkpoints per Feature (approve the
mockups, approve the spec summary, give the go); the team settles everything else and lists the
decisions it made for you at the end. Everything the human reads follows the human briefing format.

## 0. Ground rules (every GTM skill)
- **GTM root:** `.gtm/` unless the project's CLAUDE.md or CLAUDE.local.md says `GTM root: <path>`. No root: offer
  `/gtm:init` in one line and stop.
- Read `<root>/config.yml` and `<root>/team.md`. Every human-facing message follows
  `${CLAUDE_PLUGIN_ROOT}/templates/briefing.md`, in `language.human`.
- Dispatch roles as `gtm:<role>` with the model and effort the team settings give that role, on
  every dispatch (the profile wins over the agent's defaults). Pass the same values to workflows in
  `args.team`.
- Hand-offs are files: give agents paths, never paste documents. Keep their hand-backs out of the
  human's view unless something deviates.
- **Detail level:** before presenting an artifact, use `briefing.remembered.<kind>`, else
  `briefing.detail`; when that is `ask`, ask one question (brief / standard / deep) and store the
  answer under `briefing.remembered.<kind>`.
- **Stealth** (`stealth: on` in the config): GTM leaves no footprint in the project. Nothing it
  writes into tracked files, commits, PR text, comments, docs, changelogs or branch names names
  GTM, its root, roles, skills, plans, ledger or workflows; no attribution trailer; no line in the
  tracked CLAUDE.md or AGENTS.md; branches follow `git.branch`, the project's own pattern; text
  follows `<root>/guidelines/voice.md`. `/gtm:ship` runs the footprint check before anything leaves.
- **Run view:** in every track (a Fix included), rewrite `<root>/NOW.md` whole, never append,
  as the last write of the step: before each dispatch or workflow run, after each progress line,
  when a checkpoint or decision card is shown or answered, and when a skill ends or stops its run.
  Facts from `node "${CLAUDE_PLUGIN_ROOT}/scripts/now-facts.mjs" --root <root>` (add the
  `--running` and `--waiting` you know), shape from `${CLAUDE_PLUGIN_ROOT}/templates/now.md`.
  Write it only in the main checkout (`git rev-parse --git-dir` equals `git rev-parse
  --git-common-dir`), never in a worktree. Read the NOW.md there first: tracked (`git ls-files
  --error-unmatch` succeeds) or line 1 not the template's `# <slug> · <HH:MM>`, it is the user's.
  Untracked and `<root>/NOW.md.bak` absent: rename it to that, with a Heads-up; otherwise write
  no run view and say why in one Heads-up. Root inside the repository and `git check-ignore -q
  <root>/NOW.md` fails: add `/<root>/NOW.md` on its own line to the file `git rev-parse
  --git-path info/exclude` names (never `.gitignore`): create its folder if missing, and add a
  newline first when the file does not end with a newline. Say so in one Heads-up.
- Nothing is pushed, merged, tagged or released without the human's explicit go.

## 1. Pick the track (≤ 2 questions)
Request: $ARGUMENTS

No request given: explain GTM in five lines (the tracks, your checkpoints, the skills) and ask
what to do. Clear and small: judge it yourself. Otherwise dispatch `gtm:analyst` with the request and the root.

| Track | When | Flow | Human checkpoints |
| --- | --- | --- | --- |
| **Fix** | ≤ the file limit for a fix (team settings, 3 by default), no schema, migration or auth change | 3-line design in chat → implementer + reviewer, plus the specialist on security or data ground | approve the 3-line design, then the go |
| **Feature** | one capability, one branch | design-loop if screens change → spec → plan → deliver per task → final review | mockups, spec summary, go |
| **Milestone** | several branches, a new surface | decomposition into sub-features, then the Feature flow per branch, final review per branch | decomposition, then per branch: mockups, spec, go |

A Feature is **small** when it changes no screen, schema, migration or auth and touches at most
twice the file limit for a fix in estimated files (6 by default): `/gtm:spec` then has one architect pass
write the spec and the plan.

Present the track with its reason and at most two decision cards in **one** message. For a Fix,
include the 3-line design (what changes, where, how it is proven; for a threshold, the mutation its
test catches) in that same message, naming the specialists whose `team.md` triggers match its
files. For a Feature, say small or not, with the file count ("Feature, small, ~4 files").

A Fix that grows past its file limit becomes a Feature on its own, one way only (say so in
a Heads-up). Nothing downgrades mid-task.

Record the work in `<root>/backlog.md`: add or update its story (type, priority P0-P3 per
`guidelines/work.md`, status doing, track). A Milestone is an epic.

## 2. Route
- **Fix:** write `<root>/reports/<slug>/brief.md` (the approved 3 lines plus the test that proves
  it), create the branch as `git` says, run the workflow `gtm:deliver-task` with `track: "fix"`
  (args as `/gtm:deliver` builds them). `ESCALATE` → read it as `/gtm:deliver` §2 says; the
  commits stay. `OPEN` or `BLOCKED` → stop, and read it as `/gtm:deliver` §2 says. Any result:
  its progress line and measure as `/gtm:deliver` §1 and §2 step 3 say. `CLEAN` → append each
  minor to the ledger (`minor`) as `/gtm:deliver` §2 does and one `run` line as its §5 says,
  holding `Fix: CLEAN, no final review`; then present the result and ask the go (`/gtm:ship`).
- **Feature:** `/gtm:design` (only if screens change and `design.screens` is true) → `/gtm:spec` →
  `/gtm:plan` → `/gtm:deliver` → `/gtm:ship`. Invoke each skill in turn; stop only at a checkpoint.
- **Milestone:** dispatch `gtm:architect` to write `<root>/specs/<date>-<slug>-milestone.md`: the
  sub-features, one branch each, their order and dependencies, ≤ 1 page with a Summary block.
  Present it (checkpoint), then run the Feature flow per sub-feature.

## 3. End every run with
The result per the briefing format, then **Decisions made for you** (each with its cost if wrong), and
append each one, as a `ruling` line, to `<root>/ledger.md`.
