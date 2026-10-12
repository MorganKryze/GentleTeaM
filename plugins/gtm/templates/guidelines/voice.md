# Project voice guideline

> When to read: implementer (commit messages, comments, docs, UI copy), ship (PR text, release
> notes), retro (guideline edits). Mandatory when `stealth` is on in the config.

Text written into the project reads as if the project's own people wrote it. Before writing, read
the last 30 subjects and a few bodies of `git log <base>`, one or two docs and the comments near
the change, and match what they do.

## Match the project
- **Commits:** the same prefix style, tense, mood, subject length and body habits as the log.
  <Project: e.g. "fix(api): imperative, lower case, no body unless the why is not obvious".>
- **PRs and release notes:** the shape of the last merged ones; no section the project never uses.
- **Comments and docs:** the same density and register as the files around them. Comments say why.
- **Branches:** the pattern the project already uses (`git.branch`).
- **Language and spelling:** the project's (`language.code`), including its British or American
  spelling and its terms for its own concepts.

## Plain writing
- Say the thing. No filler ("basically", "in order to"), no hedging ("might potentially", "it
  seems"), no throat-clearing opener or closing summary.
- No stock phrases: "seamless", "robust", "leverage", "delve", "comprehensive", "it's worth noting",
  "game-changer", "elevate", "streamline".
- Specific over generic: the function, the number, the error message, not "various improvements".
- Active voice: "the parser drops empty lines", not "empty lines are dropped".
- Vary sentence length. A short one lands a point.
- Lists only when the items are parallel and there are enough of them; two or three short items read
  better as a sentence. No reflexive groups of three.
- No em-dash habit: use a comma, a colon, parentheses or a new sentence.
- No emoji unless the project already uses them in that place.
- No attribution trailers or tool names unless the project's own rules ask for them.

## Check
Read it back once as a maintainer of this project would. Anything that sounds like a template,
rewrite. When stealth is on, `/gtm:ship` also runs the footprint check over the branch.
