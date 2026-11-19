# Posture reading

> Run by `/gtm:gtm` before it picks the track, and by `/gtm:init` through it on a new project.

Read the ledger's last `posture · usage · read` line. None, or older than 30 days: run
`node "${CLAUDE_PLUGIN_ROOT}/scripts/posture.mjs" --json <repository top>`, adding `--branches`
with `git.protected` joined by commas when `config.yml` lists it, and append its reading as
`templates/ledger.md` says. Show at most three gaps as decision cards, ranked: a branch rule
(`rules.*`, `ci.not-required`), then dependencies (`deps.*`), then `secrets.none`; every
other gap in one card "later"; skip a gap a `ruling` line `posture <id> <where>: <answer>`
names. Each card says what the gap lets through and the team's opinion from
`<root>/guidelines/pipeline.md` (set it up yourself / accept it as it is / later); the answer is
that ruling line. GTM changes nothing in the repository or its settings. A non-zero exit: one
Heads-up line, no card.
Write `<root>/guidelines/pipeline.md` from `templates/guidelines/pipeline.md` first when it is
missing.
