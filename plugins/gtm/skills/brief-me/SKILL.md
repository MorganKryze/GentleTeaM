---
name: brief-me
description: Re-present any GTM artifact (spec, plan, mockup page, review, report, ledger, team settings) at the detail level the human chooses - brief, standard or deep - in the human briefing format. Use whenever the human wants to understand an artifact without reading it.
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
