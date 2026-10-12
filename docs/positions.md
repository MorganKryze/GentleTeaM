# Positions

> The stances GTM takes, each with its reason, its cost, and how the plugin enforces it. They are
> deliberate trade-offs, not universal truths: where a project needs otherwise, the config, the team
> profile or the conventions can say so, and the change is recorded. Disagreeing with one is a good
> reason to open an issue.

## 1. Light over complete
- **Statement:** the smallest process that keeps quality: three tracks, few artifacts, short files.
- **Why:** every extra document is read by someone, or ignored; both cost.
- **Cost:** some decisions are made in a plan rather than a separate architecture document.
- **Enforced by:** the tracks; templates that skip what a track does not need; no PRD or
  architecture document unless a decision demands one.

## 2. Three human touchpoints
- **Statement:** per Feature, the human approves the board, approves the spec synthesis, and gives
  the go. Everything else is settled inside the team and listed as rulings.
- **Why:** decisions the human must take are few; burying them among status updates loses them.
- **Cost:** the team will sometimes take a ruling the human would have taken differently; the
  ruling list and the ledger make it cheap to overturn.
- **Enforced by:** the `gtm` router and the design, spec, deliver and ship skills.

## 3. Evidence before claims
- **Statement:** no "done", "fixed" or "passing" without the command and its result; what was not
  verified is said plainly.
- **Why:** a confident claim without evidence is the most expensive kind of error to find later.
- **Cost:** reports are slightly longer; checks take time.
- **Enforced by:** every agent's hand-back contract ("never claim a check you did not run");
  reviewers cite file:line; the final review reruns the gate.

## 4. Tests first
- **Statement:** a failing test before the code; every acceptance line has a test.
- **Why:** the RED run proves the test can fail; EARS lines turn the spec into tests directly.
- **Cost:** slower first commits on exploratory work.
- **Enforced by:** the implementer's method, the reviewer's checks, `guidelines/tests.md`.

## 5. File-based hand-offs
- **Statement:** agents receive paths and return at most ten lines; full reports live on disk.
- **Why:** the main conversation holds verdicts, not transcripts, which saves context and usage.
- **Cost:** one more file per task under `.gtm/reports/`.
- **Enforced by:** agent hand-back contracts; workflows that keep intermediate results in script
  variables and return structured objects.

## 6. Triggered specialists
- **Statement:** security, data and UX reviewers run only when a diff touches their ground, decided
  by path regexes the project owns.
- **Why:** a specialist on every task is expensive noise; a specialist missing on the task that
  needed it is a hole. Path triggers make the choice explicit and reviewable.
- **Cost:** a trigger that is too narrow misses a change; `/gtm:tune` and the final review catch it.
- **Enforced by:** `deliver-task` and the Specialists section of `.gtm/team.md`.

## 7. One strong model, effort by role
- **Statement:** by default every role runs the strongest model and roles differ by reasoning
  effort: high where a miss is costly (security, final review), low where the plan carries the
  thinking (implementation).
- **Why:** model mixing adds failure modes; effort is the cheaper and more predictable lever.
- **Cost:** higher per-token price than a mixed fleet on simple tasks.
- **Enforced by:** agent frontmatter defaults, overridden per dispatch by the team profile.

## 8. Weights are a project decision, recorded and revisited
- **Statement:** how much security, data integrity, UX, performance, speed and cost matter is
  decided per project, written down once with reasons and dates, and revisited with evidence.
- **Why:** a banking backend and a weekend prototype should not run the same team; and nobody
  should have to restate their priorities every session.
- **Cost:** a few minutes at init; a profile that drifts if never tuned.
- **Enforced by:** `.gtm/team.md` (written at `/gtm:init`), read by every skill and workflow;
  `/gtm:tune` proposes changes from the ledger; `/gtm:retro` suggests it when a pattern appears.

## 9. Security and data integrity are non-negotiable
- **Statement:** an insecure or data-losing change never ships, whatever the track or the deadline.
- **Why:** these are the failures that cannot be apologised away or rolled back.
- **Cost:** specialist reviews at the highest effort; occasionally a blocked task.
- **Enforced by:** Fix escalates to Feature on a schema or security surface; the security and data
  reviewers; the final review orders security and data first; findings there are never "minor".

## 10. Nothing pushed, merged or released without the human's go
- **Statement:** agents never push, merge, tag or release; the orchestrator does it only after an
  explicit go for that exact action.
- **Why:** shipping is the decision with consequences outside the repository.
- **Cost:** one message per branch.
- **Enforced by:** every agent's project rules; `/gtm:ship`; `git.push: ask` in the config.

## 11. Keep history, no squash by default
- **Statement:** merge commits, small logical commits, never rewrite pushed history.
- **Why:** the history is the record of how a decision was implemented; bisect needs it.
- **Cost:** a longer log.
- **Enforced by:** `git.merge` in the config and `guidelines/git.md`; a project may choose squash,
  and the choice is recorded.

## 12. Plain language, in the human's own language
- **Statement:** verdict first, short sentences, no jargon where a plain word exists, in the
  language the human chose; code-facing artifacts in the code language.
- **Why:** reading in a second language costs attention; jargon hides weak reasoning.
- **Cost:** two languages to keep consistent in some projects.
- **Enforced by:** `language` and `briefing` in the config; the briefing format.

## 13. Cite sources, credit inspirations
- **Statement:** claims about libraries or behaviour cite where they come from; ideas taken from
  other methods are credited.
- **Why:** traceability for the human, honesty towards the people whose work GTM builds on.
- **Cost:** a line or a link.
- **Enforced by:** reviewers' file:line evidence; the README's inspirations section.

## 14. Accessibility is a rule, not a polish item
- **Statement:** targets, contrast, keyboard access and accessible names are hard rules; a failure
  is an important finding.
- **Why:** an inaccessible screen is a broken screen for some users; fixing it late costs more.
- **Cost:** stricter design rounds and an automated check per screen and theme.
- **Enforced by:** `guidelines/accessibility.md` and `design.md`; the design critic's measurements;
  ux-qa on every screen diff.
