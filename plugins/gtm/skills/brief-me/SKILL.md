---
name: brief-me
description: "Re-present a GTM artifact at the detail level the human picks, or dig into it with a method. Use when the human wants one explained or challenged."
argument-hint: "[artifact path or kind] [brief|standard|deep]"
---
# Brief me

Ground rules: as in the `gtm` skill §0.

Arguments: $ARGUMENTS. Find the artifact (a path, or the latest of that kind under the root). The
detail level is the argument, else `briefing.remembered.<kind>`, else one question (brief /
standard / deep). Store the answer under `briefing.remembered.<kind>`.

| Level | What the human gets |
| --- | --- |
| brief | the TL;DR (verdict + the measure) and the open decision cards; under 10 lines |
| standard | brief, plus one block per main idea (tables over lists) and a Heads-up if anything deviates |
| deep | standard, plus every decision with its reason, the decisions made for you, the risks and what was not verified |

Rules: follow `${CLAUDE_PLUGIN_ROOT}/templates/briefing.md`; quote numbers and names, never "it
works"; say plainly what the artifact does not show. A mockup page is shown as its PNG paths (Read them),
not described. End with Next steps only if the artifact waits on the human.

## Dig
When the human asks to dig an artifact (challenge it, test it, "dig with <method>"), apply one
method from `${CLAUDE_PLUGIN_ROOT}/templates/methods/elicitation-methods.csv` or
`brain-methods.csv` in the same folder, read only then. Method named: that row. None named:
propose three suited to the artifact as one decision card, Pre-mortem Analysis first for a spec
awaiting approval, and wait for the pick.

Return at most five findings, largest risk first, each as a decision card: the options, one of
them "leave it", and the recommendation. Tag each `(lens: <method name>)`.

Dig changes no file. An option that changes the artifact is applied by the skill that owns it
(`/gtm:spec` for a spec, `/gtm:plan` for a plan), on the human's pick; an approved spec or plan
so changed goes back to its checkpoint.
