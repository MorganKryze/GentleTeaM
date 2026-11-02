# Code review

> Helps an author prepare a change and a reviewer judge it, so each merged change leaves the
> codebase healthier without stalling the team.

## When it applies
- A change (patch, pull or merge request, diff) is being prepared for review, reviewed, approved or
  merged.
- A team sets or revisits its review rules: change size, response time, approval standard, merge
  rule, comment conventions.
- A review is stuck: long wait, disagreement, or a change too large to read.
- A team considers adding an automated or AI-based reviewer.

## Method
1. Author: give the change one self-contained purpose, with its tests. Put refactorings such as
   moves and class renames in a change of their own. Split large work by stacking dependent changes,
   or by reviewer area, layer or feature.
2. Author: get every machine-decidable check (formatting, lint, tests, static analysis) green before
   asking a human.
3. Author: say what changes and why: understanding is the key aspect of code reviewing.
4. Reviewer: respond within one business day. If busy, say when you will look or suggest another
   reviewer.
5. Reviewer: read the design first: does it belong here, does it fit the system? Then behaviour
   (edge cases, concurrency), complexity (nothing speculative), tests (would they fail if the code
   broke), naming, comments (why, not what) and documentation. Read every line and, when needed,
   the whole file.
6. Reviewer: for parts outside your competence, such as security or concurrency, get a qualified
   reviewer added instead of approving blind.
7. Reviewer: open each comment with its intent (issue, suggestion, question, nitpick, praise) and
   say whether it blocks.
8. Reviewer: weigh a change by its effect on overall code health, not against perfection, and name
   any change that definitely worsens it; the verdict rule in force decides, not this sheet. When
   approving with comments, say which ones remain expected.
9. Disagreement: data beats preference, the style guide settles style, and the author chooses
   between equally valid designs. If that fails, talk it through live and record the outcome on the
   change, then escalate.
10. Automated reviewer, if any: judge each of its comments on merit. A human still approves. Watch
    its noise and its effect on cycle time.
11. Author: read and check every line an AI assistant wrote before asking anyone to review it, and
    be ready to answer for it as its author; label substantial AI-assisted content in the
    description. Such code counts toward change size.
12. Reviewer: cover security-relevant properties in every review, not only when a specialist joins:
    untrusted input validated, access control enforced, no secret in the diff, nothing sensitive
    logged. Treat an added or upgraded third-party dependency as code the team will ship: is it
    needed, the authentic package rather than a look-alike name, maintained, licensed and free of
    serious known vulnerabilities? Read lock-file changes too: a machine-written diff, often folded,
    is where a swapped package source hides.
13. Team: make review a merge rule on every protected branch. No merge without approval from a
    trusted person other than the author, given on the latest revision: commits pushed after an
    approval, even the fixes it asked for, get reviewed again. Bot and AI approvals do not count,
    administrators are bound too, and a named trusted bot's own changes are the only standing
    exception.

## Reflexes
- Does this change leave the codebase healthier, whatever my own taste?
- Do I understand every line? If not, is the code unclear, or am I the wrong reviewer for it?
- Is this small enough to review well, or should it come back split?
- Is my comment a fact, a principle or a preference, and did I say whether it blocks?
- Has the author read and understood this AI-assisted code, or am I its first human reader?

## What is measured
- Change size: lines added plus removed, and files touched, since the merge base; deleted and
  generated files excluded. A `verify` step warns above a soft limit and fails above a hard limit
  unless reviewers agreed in advance. The team calibrates limits on its own history: about 100 lines
  is often comfortable, about 1,000 lines or 50 files usually too much.
- Time to first response: from review request to first reviewer action, weekends excluded, tracked
  weekly as median and 75th percentile. A periodic `verify` step fails when the 75th percentile
  exceeds one business day.
- Time in review across all rounds, at the 75th percentile: a trend to watch, not a gate.
- Rubber-stamp guardrail: reviewer time spent per change, read next to speed. A drop while speed
  rises is a signal; interpreting it stays judgment.
- Blocking comments still open at merge: must be zero, enforced by a `verify` step or a merge rule.
- Automated reviewer: share of its comments acted on, and change closure time before and after
  enabling it. A `verify` step at the end of a pilot fails under the floor set in advance. Whether a
  given comment was right stays judgment.
- Design quality, warranted complexity and test relevance are not measured: they stay the reviewer's
  judgment.
- Unreviewed merges: changes merged to a protected branch without an approval of their latest
  revision by someone other than the author. Must be zero: the merge rule enforces it, and a
  periodic `verify` step audits the merged history and the branch settings, administrators included.
- Security checks on each change: a `verify` step fails when the diff carries a secret, when an
  added or upgraded dependency has a serious known vulnerability or no license, or when a lock-file
  entry resolves from a source outside the team's trusted list. Whether a dependency is needed and
  trustworthy, and whether input and access handling are right, stays judgment.

## Sources
- [Google Engineering Practices: The Standard of Code
  Review](https://google.github.io/eng-practices/review/reviewer/standard.html), 2026-11-01:
  code-health approval standard, disagreement path, optional comments.
- [Google Engineering Practices: What to look for in a code
  review](https://google.github.io/eng-practices/review/reviewer/looking-for.html), 2026-11-01: what
  to look for, design as most important, every line, context, qualified reviewers.
- [Google Engineering Practices: Small
  CLs](https://google.github.io/eng-practices/review/developer/small-cls.html), 2026-11-01: size
  markers, ways to split, exceptions.
- [Google Engineering Practices: Speed of Code
  Reviews](https://google.github.io/eng-practices/review/reviewer/speed.html), 2026-11-01:
  one-business-day response, natural breaks, approval with comments.
- [Expectations, Outcomes, and Challenges of Modern Code
  Review](https://www.microsoft.com/en-us/research/publication/expectations-outcomes-and-challenges-of-modern-code-review/),
  2026-11-01: reviews are less about defects than expected and bring knowledge transfer;
  understanding is central.
- [Improving code review time at
  Meta](https://engineering.fb.com/2022/11/16/culture/meta-code-review-time-improving/), 2026-11-01:
  75th-percentile time in review, measured levers, time-spent guardrail.
- [DORA Research: 2023](https://dora.dev/research/2023/dora-report/), 2026-11-01: fast reviews
  linked to delivery and operational performance.
- [Automated Code Review In Practice](https://arxiv.org/abs/2412.18531), 2026-11-01: an LLM reviewer
  in industry, with comments resolved, slower closure and noise.
- [Conventional Comments](https://conventionalcomments.org/), 2026-11-01: comment labels and
  blocking decorations.
- [Sharing new DORA research for gen AI in software
  development](https://cloud.google.com/blog/products/ai-machine-learning/sharing-new-dora-research-for-gen-ai-in-software-development),
  2026-11-01: AI adoption and review speed; fast feedback loops.
- [SLSA v1.2: Source requirements](https://slsa.dev/spec/v1.2/source-requirements), 2026-11-01: two
  trusted persons agree to each change on a protected branch, later changes reviewed too, reviews
  cover security-relevant properties, trusted-robot exceptions.
- [OpenSSF Scorecard: Checks](https://github.com/ossf/scorecard/blob/main/docs/checks.md),
  2026-11-01: mandatory human review before merge, approval of the latest push, stale approvals
  dismissed, administrators included, bot and AI reviews not counted.
- [LLVM AI Tool Use Policy](https://llvm.org/docs/AIToolPolicy.html), 2026-11-01: human in the loop;
  contributors read AI-generated code before asking for review, answer for it, and label substantial
  tool-generated content.
- [OWASP Secure Code Review Cheat
  Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secure_Code_Review_Cheat_Sheet.html),
  2026-11-01: security review within the normal change process; input validation, access control,
  hard-coded secrets, sensitive logging, vulnerable libraries, automated checks in CI.
- [OpenSSF: Concise Guide for Evaluating Open Source
  Software](https://best.openssf.org/Concise-Guide-for-Evaluating-Open-Source-Software), 2026-11-01:
  dependency checks for necessity, authenticity and look-alike names, activity, license and known
  vulnerabilities.
- [Snyk: Why npm lockfiles can be a security blindspot for injecting malicious
  modules](https://snyk.io/blog/why-npm-lockfiles-can-be-a-security-blindspot-for-injecting-malicious-modules/),
  2026-11-01: lock-file diffs skipped in review can swap a package's source; lint them in CI.
