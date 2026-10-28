#!/usr/bin/env node
// Checks the advisor and dig wording: the fixed phrases of brief-me's dig and gtm's advisor
// rule, the advisor's states and thresholds, and gtm/SKILL.md's line ceiling. Each phrase is
// looked for in the one file that states it. Run by scripts/validate.mjs. No dependencies.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = new URL('..', import.meta.url).pathname
const errors = []
const read = (p) => { try { return readFileSync(join(root, p), 'utf8') } catch { errors.push(`${p}: missing`); return '' } }
const flat = (s) => s.replace(/\s+/g, ' ')
const has = (file, text, phrase) => { if (!flat(text).includes(phrase)) errors.push(`${file}: missing "${phrase}"`) }

const BRIEF = 'plugins/gtm/skills/brief-me/SKILL.md'
const GTM = 'plugins/gtm/skills/gtm/SKILL.md'
const ADVISOR = 'plugins/gtm/templates/advisor.md'

const brief = read(BRIEF)
for (const p of [
  'Dig changes no file.', 'at most five', 'leave it',
  'the artifact path and the picked option', 'edits that file in place after reading it',
  'Decisions table and approval history kept',
]) has(BRIEF, brief, p)

has(BRIEF, brief, 'goes back to its checkpoint')
for (const [f, ps] of [
  ['plugins/gtm/skills/spec/SKILL.md', ['An amend (a dig pick from `/gtm:brief-me`)', 'edits that file in place, same path, Decisions and approval history kept', "§3's checkpoint reopens"]],
  ['plugins/gtm/skills/plan/SKILL.md', ['An amend (a dig pick from `/gtm:brief-me`)', 'never the shortcut below', 'the plan is shown to the human before delivery']],
  ['plugins/gtm/agents/architect.md', ['An amend gives instead an existing spec or plan path and the picked option', 'write no new file']],
]) { const t = read(f); for (const p of ps) has(f, t, p) }
// An amend leaves no bare "approved" Status that plan §0 would accept, and the one-pass ending goes.
for (const [f, ps] of [
  ['plugins/gtm/skills/spec/SKILL.md', ['sets `Status: draft (amended <date>; approved by the human on <old date>)`', 'drops the `; plan kept from the one pass` ending']],
  ['plugins/gtm/agents/architect.md', ['set `Status: draft (amended <date>; approved by the human on <old date>)`', 'drop the `; plan kept from the one pass` ending']],
  ['plugins/gtm/skills/plan/SKILL.md', ["The spec's Status must start with `approved`"]],
]) { const t = read(f); for (const p of ps) has(f, t, p) }
// A plan amend records its pick and stops for the human's go before delivery.
for (const [f, ps] of [
  ['plugins/gtm/skills/plan/SKILL.md', ['writes the pick into the plan\'s "Decisions made where the spec is silent" and a ledger `ruling` line', "After an amend, show the plan and wait for the human's go before `/gtm:deliver`."]],
  [BRIEF, ["an amended plan is shown and waits for the human's go before delivery"]],
  ['CHANGELOG.md', ['`/gtm:plan`, which shows the plan and waits for your go']],
]) { const t = read(f); for (const p of ps) has(f, t, p) }
has(ADVISOR, read(ADVISOR), 'git --no-optional-locks status')
has(BRIEF, brief, 'A dig skips the detail question')

const gtm = read(GTM)
const ground = gtm.slice(gtm.indexOf('## 0.'), gtm.indexOf('## 1.'))
for (const p of [
  'The advisor only proposes: it runs no skill, workflow or git command that writes, and never pushes, merges, tags or starts a run until the human picks.',
  'one next command from `${CLAUDE_PLUGIN_ROOT}/templates/commands.md`',
  'none when the state calls for none',
]) has(`${GTM} §0`, ground, p)
has(GTM, gtm, 'its path, read only: tell the analyst never to write it')
if (/explain GTM in five lines/.test(flat(gtm))) errors.push(`${GTM}: still explains GTM in five lines`)
if (!flat(gtm).includes('templates/advisor.md')) errors.push(`${GTM}: no pointer to advisor.md`)
const lines = gtm.split('\n').length - (gtm.endsWith('\n') ? 1 : 0)
if (lines > 117) errors.push(`${GTM}: ${lines} lines, over 117`)

const advisor = read(ADVISOR)
for (const p of [
  'paused run', 'open brainstorm note', 'no request and no run', 'spec awaiting approval',
  'Pre-mortem Analysis', 'shipped story without retro', '`/gtm:retro`', 'costly last run',
  '`/gtm:tune`', 'companion installed and not in team.md', 'limits flagged', '`/gtm:pause`',
  '5 or more open', '1.5 ×', 'flag',
]) has(ADVISOR, advisor, p)

if (errors.length) { console.error(errors.join('\n')); process.exit(1) }
console.log('advisor: dig, advisor rule, states and thresholds OK')
