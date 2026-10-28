---
name: brainstorm
description: "Brainstorm a topic with the GTM team (three stances, methods, a roundtable) into a note for the spec. Use when the human has an idea, not yet a request."
argument-hint: "[topic]"
---
# Brainstorm

Ground rules: as in the `gtm` skill §0. It writes nothing but its note and NOW.md, runs no
script, and starts no other skill until the human picks.

Methods: `${CLAUDE_PLUGIN_ROOT}/templates/methods/brain-methods.csv` and
`${CLAUDE_PLUGIN_ROOT}/templates/methods/elicitation-methods.csv`; read only the rows you use,
found by exact name. An idea drawn from a method carries `(lens: <method name>)` at its end.

## 1. Open
- `$ARGUMENTS` names an existing note under `<root>/brainstorms/` with `Status: open`: read it and
  resume from its last line kept. A note with `Status: done` is not reopened; offer a new one.
- Otherwise confirm the topic and its goal in one message, state the token budget (40k unless
  the human sets another) and how the limits reading works, and offer the three stances as one
  decision card:
  - **facilitator:** the ideas are the human's only;
  - **partner:** both the human and the team bring ideas;
  - **ideate for me:** the team generates, the human keeps or drops.

## 2. Techniques
Propose 3 or 4 techniques picked from both libraries for this topic, each with its one-line
description, as one card. The human may ask for others by name or category, or for one you
invent, marked "invented" in the note.

## 3. Roundtable
Play the architect, security, UX and data roles, plus a user or a skeptic persona, in character,
each line prefixed with its speaker (`Architect:`). They are played in this chat; dispatch no
agent. In the facilitator stance the roles ask and challenge and supply no idea.

Dialogue: one prompt per message, at most 10 lines, in `language.human`; every choice is a
decision card, never a numbered menu.

## 4. Converge
When the human asks to converge, or 80% of the budget is spent, say so and offer converge,
extend or pause as one card. Converging groups the ideas and lets the human keep or drop each
group through cards; then set `Status: done`.

## 5. The note
`<root>/brainstorms/<YYYY-MM-DD>-<slug>.md`, `<slug>` matching `^[a-z0-9]+(-[a-z0-9]+)*$`, at most
40 characters. If the file exists, resume it or add a numeric suffix (`-2`, `-3`): the skill
never overwrites a note. Update it as the session goes: topic, goal, stance, techniques, budget
spent, kept ideas, open questions and the `Status:` line, in this shape:

```markdown
# <topic>
- topic: <one line>
- goal: <one line>
- stance: <facilitator | partner | ideate for me>
- techniques: <names, "invented" where so>
- budget spent: <k tokens> of <budget>

## Kept ideas
- <idea> (<author, partner stance only>) (lens: <method name>)

## Open questions
- <question>

Status: open
```

## 6. Stop
Stopped before converging: the note keeps everything kept so far with `Status: open`. Write
NOW.md per §0's run-view rule with `--slug <slug> --waiting brainstorm`, its question
`resume: /gtm:brainstorm <note>`. To turn the note into a request, the human runs `/gtm:gtm`;
the analyst receives the note's path and the spec cites it in its `Brainstorm:` header line.
Nobody edits the note after that.
