# Delivery: the rules `/gtm:deliver` reads here

> The plugin's delivery rules that do not fit in the deliver skill (128 lines). Read when the
> skill points here; the skill keeps its steps, this file their shapes. Never copied into a
> project.

## The progress line's tail
Every run's progress line (design, spec, spec+plan, plan, second reading, plan critic, task,
deferred or re-run review, hand, final review, re-review, fix wave, ship's `ci`; a direct dispatch
counts as 1 agent) ends with five segments, in this order, after every segment it has today:
`· start <S> · end <E> · models <M> · causes <C> · path <P>`
- `<S>`, `<E>`: UTC instants to the second, `YYYY-MM-DDThh:mm:ssZ`, read from the clock (`date -u
  +%Y-%m-%dT%H:%M:%SZ`) when you dispatch and when the result returns, or from what Claude Code
  recorded for that run; a hand line, when you start the edit and when its last check returns.
  Never estimated, never written later from memory: an instant you do not have is `?`.
- `<M>`: each role the run dispatched, as dispatched, `<role> <model>/<effort>` joined by `, `, a
  role at two efforts showing each (`implementer opus/low/medium`). A workflow run: its result's
  `trace.models`, copied as it is. A direct dispatch: the model and effort you passed, after a
  `limits: lighter` ruling and the raises of `templates/team.md`. Nothing dispatched: `none`. A
  model or effort you did not pass: `?`.
- `<C>`: the blocking findings that started each correction round,
  `<round>:<role>/<severity>/<category>` joined by `, `. A workflow run: its result's
  `trace.causes`, copied as it is. A final review whose must-fix start a fix wave or a hand fix:
  `1:final-reviewer/important/<category>` per must-fix. No round: `none`.
- A category is one of `behaviour`, `security`, `proof`, `doc`, `form`, `runner`; a missing or
  unknown one is `?` and never stops a run. `runner` is given only by ship's `ci` line
  (`templates/runner.md`); the reviewers keep their five.
- `<P>`: a workflow run's `trace.path`; a task's re-run, deferred or hand line, its task's path;
  any other line `none`; unknown `?`.
- Before the tail, the skill's `· <a> agents` takes Claude Code's
  `agent_count` (a dispatch is 1 agent).

Nothing else in the line changes, and segments are only added at its end, so every reader of
today's lines reads them as before. A run's line without this tail lacks its trace.

## Before each dispatch
Before a task's or a Fix's workflow, a re-run review, a re-review, a hand fix's brief, a fix wave
and the final review, read the slug's ledger `ruling` lines and the human's answers newer than the
brief. Write each one that changes its scope, its files or a decision into the brief, quoted with
its date. End the brief with `> Ledger read to line <n> (<date>).`

## Review paths
The `review path` lines read as the workflow reads them: a file on the data reviewer's triggers, on
a risky path or given as an absolute path reads `full`, whatever line covers it; else a file on a
`code` regex reads `code`, else on a `text` one `text`, else `full`; a task takes its heaviest
file; no file reads `full`; a regex that fails or is empty matches nothing; anything but a map of
objects reads as no line.
Once a task returns, its range's files from git (deliver §1) are matched against them. A heavier
path than its `trace.path`, or a reviewer that path calls for missing from its `reviewers`: that
reviewer reviews the range alone (`review: "range"` with git's files, or a direct dispatch on a
Fix), before the next task, and the heavier path holds for that task.

Tiers (`review cadence` set; not a Fix), on each task's files once it returns: a per-task
specialist its path calls for on a standard task → Heads-up, `review: "range"` on its range,
guarded from then on; a specialist its path calls for missing from a guarded task's `reviewers`
reviews it alone. `GATED`: `verify.gate` on its head, red → `BLOCKED` (deliver §2 step 4's card);
a clean deferred review with the `reviewer` over its range appends its own line. A wave (a deliver
§3 wave, or consecutive standard tasks up to a guarded task or the plan's last) gets `review:
"range"` on its range after its merges; before deliver §4, `review: "branch"` fork point to
`HEAD`; each with `files` from git. `OPEN`, `BLOCKED`, no review → deliver §2 step 4's card, minors
to the ledger (a re-run appends none twice). A resume runs each owed review before deliver §4. A
Heads-up per `Cadence` log.

## Re-reviews
Outside the workflow (a hand fix's re-check, the final review's second pass), only the roles whose
blocking findings the fix answers re-review, with each specialist the task's path calls for whose
ground the fix touches (the final review's path: `full`), on the range since the review they
answer; the whole task's range, or the branch for the final review, when one of those findings is
category `security` or comes from the security or data reviewer.

## The lead's own files
Read before the first dispatch. The orchestrator keeps the scripts, logs and tool installs it
makes for a run in `<root>/reports/<slug>/lead/`, never in the session scratchpad, which Claude
Code can wipe mid-run; a log's name carries the run's start instant, so a rerun never overwrites
it. An agent never writes there. No secret or token goes in them.
The folder is out of git when `reports/` is excluded, as `/gtm:init` sets it.
Root inside the repository: with `<rel>` its path from `git rev-parse --show-toplevel`, run from
that top, if `git check-ignore -q <rel>/reports/<slug>/lead/` fails, the folder is not ignored:
write nothing there and stop with a Heads-up. A root outside the repository is out of git already.
