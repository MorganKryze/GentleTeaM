# Posture reading

> Run by `/gtm:gtm` before it picks the track, and by `/gtm:init` at its end.

Read the ledger's last `posture · usage · read` line. None, or older than 30 days: run `node
"${CLAUDE_PLUGIN_ROOT}/scripts/posture.mjs" --json <repository top>`, adding `--branches` with
`git.protected` joined by commas when `config.yml` lists it, and append its reading as
`templates/ledger.md` says, with the ids closed since the last reading. Show at most three gaps
as decision cards, ranked: a branch rule (`rules.*`, `ci.not-required`), then dependencies
(`deps.*`), then `secrets.none`; every other gap in one card "later", whose answer is written
for each id it lists; skip a gap a `ruling` line `posture <id> <where>: accepted` names, while
any other answer (set it up yourself, later) shows the gap again at the next reading if it is
still open. Each card says what the gap lets through and the team's opinion from
`<root>/guidelines/pipeline.md` (set it up yourself / accept it as it is / later); the answer is
that ruling line. GTM changes nothing in the repository or its settings. A non-zero exit: one
Heads-up line, no card.
Write `<root>/guidelines/pipeline.md` from `templates/guidelines/pipeline.md` first when it is
missing.
