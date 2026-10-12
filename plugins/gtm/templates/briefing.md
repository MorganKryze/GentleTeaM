# Human briefing format

Every message, board, synthesis or report meant for the human follows this format, in the human's
language (`language.human` in the GTM config). Agents' internal reports do not; they follow their
own hand-back contract.

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

Every decision put to the human uses this card. Never a decision without a recommendation.

```
Decision: <the question, one line>
Options:  A. <option> · B. <option> (· C. <option>)
I recommend: <letter>, because <one line>; prefer the long-term option
Cost if wrong: <what breaks, how hard to undo>
```

## Rulings I made

At the end of a run, every decision the orchestrator or an agent took without asking is listed,
one line each, so the human can overturn any of them:

```
- <ruling> (cost if wrong: <one line>)
```

## Every time

- Short: the result, the measures that prove it, what is left. Nothing else.
- A correction takes one sentence, then move on. No apology, no list of errors.
