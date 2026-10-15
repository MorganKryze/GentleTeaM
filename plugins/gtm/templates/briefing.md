# Human briefing format

Every message, mockup page, synthesis or report meant for the human follows this format, in the human's
language (`language.human` in the GTM config). Agents' internal reports do not; they follow their
own hand-back contract.

## Breadcrumb line

While `<root>/NOW.md` exists and its phase is not shipped, every message to the human starts with
its breadcrumb line (the first `>` line, see `templates/now.md`), before the TL;DR, a short answer
included. No NOW.md, or a shipped phase: no breadcrumb.

## Scale guard (read first)

If the answer fits in under five lines, the TL;DR is the whole answer: no headings, no sections, no
table. No one-row table, no heading over a single paragraph, no empty section.

## 1. TL;DR: the verdict, not the summary

One to three lines, always first. The conclusion and the measure that proves it.

| Good | Bad |
| --- | --- |
| "Task 4 is clean: 12 tests added, 0 open findings, size 169.5 of 174 kB." | "I looked at task 4, its tests and its size." |
| "No, the API has no bulk endpoint; three calls in a batch do the same." | "Good question, there are several aspects." |

## 2. Details

General to specific. One idea per block, a heading that names it. A table rather than a list of
numbers, a list rather than a long sentence. A number, a name, a command: never "it works" alone.
What was not verified is said plainly. No story of the path taken, no recap, no closing summary.

## 3. Heads-up (only when something deviates)

A surprise, a measure that contradicts the starting assumption, a decision taken on the way, a
correction of something said before. It gets its own block, titled "Heads-up" (or its translation),
never buried in the details. Nothing deviates: no block.

## 4. Next steps: who does what

A table, never prose. Omit the section when there is nothing to do; never write "Next steps: none".

| Who | Meaning | The row contains |
| --- | --- | --- |
| **you** | only the human can do it | the exact command or click, and why it needs the human |
| **me** | I continue on "go" | what I will do, in one verb |
| **blocked** | waits on something else | on what, and what would unblock it |

A request that blocks everything goes **first**, before the details.

## Decision card

Every decision put to the human uses this card, as plain Markdown (never in a code fence). Never a
decision without a recommendation; prefer the long-term option.

**Decision: <the question, one line>**

| Option | What it means |
| --- | --- |
| **A** <name> | <what it implies, one line> |
| **B** <name> | <one line> |

**I recommend: B**, <why, one line>. **Cost if wrong:** <what breaks, how hard to undo>.

A third option is a third row. The labels are written in `language.human`: in French, "Décision",
"Option", "Ce que ça implique", "Mon avis", "Si c'est faux".

## Decisions made for you

At the end of a run, every decision the orchestrator or an agent took without asking is listed,
one line each, so the human can overturn any of them:

- <ruling> (cost if wrong: <one line>)

## Layout in the terminal

Messages are read in the Claude Code terminal and in the editor extension; both render Markdown.
- Never put prose, cards or tables in a code fence, and never indent a block by four spaces (it
  renders as code). Fences are for commands, lists of paths and code only.
- Lines short enough for an 80-100 column terminal; a long cell becomes a sentence after the table.
- Tables have at most three or four columns.
- Labels and headings in `language.human`, like the rest of the message.

## Emoji
Follow `briefing.emoji`. `off`: none. `light` (default): a few markers that carry status or
structure (✅ done, ⚠️ heads-up, 🔒 security, ❌ failed), never decoration. `generous`: more are
fine in conversation. Whatever the setting: none in docs, specs, plans, reports or the ledger.

## Every time

- Short: the result, the measures that prove it, what is left. Nothing else.
- A correction takes one sentence, then move on. No apology, no list of errors.
