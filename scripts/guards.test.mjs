#!/usr/bin/env node
// Pins the lines that hold the human's promises: the default `push: ask`, the UI gate's overflow
// and target checks, merge commits on a wave, the footprint check reading the PR text, a
// decision confirmed by review keeping its reader when the final review is skipped, and efforts
// raised only on risky work: the template's rule, its defaults, init's proposal, and deliver
// pointing at the rule. The agents' shipped efforts are held too: none ships at xhigh.
// Run by scripts/validate.mjs. No dependencies.
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const root = new URL('..', import.meta.url).pathname
const PINS = {
  'plugins/gtm/templates/config.yml': [/^ {2}push: ask\b/m],
  'plugins/gtm/templates/ui-gate.spec.mjs': [
    'r.width >= 44 && r.height >= 44',
    'document.documentElement.scrollWidth > width',
  ],
  'plugins/gtm/skills/deliver/SKILL.md': [
    '`git merge --no-ff --no-edit "<branch>-t<n>"`',
    '- Efforts: `team`\'s, raised or lowered on each dispatch\'s range as the Roles note of',
    '`${CLAUDE_PLUGIN_ROOT}/templates/team.md` says; `risky`: the Gates `risky paths` (`yes` or `no`).',
    'the must-fix list at a correction round\'s effort on the branch range',
  ],
  'plugins/gtm/templates/team.md': [
    '(a regex that fails matches all), the security reviewer and the final reviewer rise one level from',
    'their row (none: `high`), at most `xhigh`.',
    'up to `high`, or `xhigh` on risky work, never below its row.',
    'the final reviewer\'s effort for its fix range, one level lower (`low` at least) when that range',
    'matches no trigger and no risky path.',
    'An effort off that ladder, such as `max`, is never changed.',
    '| security-reviewer | opus | high |',
    '| final-reviewer | opus | high |',
  ],
  'plugins/gtm/skills/init/SKILL.md': ['security-reviewer on, effort high;'],
  'plugins/gtm/skills/ship/SKILL.md': ['--base <git.base> --pr <root>/reports/<slug>/pr.md`'],
  'plugins/gtm/skills/plan/SKILL.md': [
    'so it reaches the brief; a missing one goes back to the architect:',
    '`security-reviewer`, `data-reviewer` or `ux-qa` sits on a task with a File matching a trigger of',
    'that specialist, which is on; a row naming `design-critic` or `final-reviewer`, or a match that',
    'fails, goes back too: delivery runs a specialist by its triggers, never by a row.',
  ],
  'plugins/gtm/agents/security-reviewer.md': [/^effort: high$/m],
  'plugins/gtm/agents/final-reviewer.md': [/^effort: high$/m],
  'plugins/gtm/workflows/deliver-task.js': ["const SECURITY = 'high'"],
}
// And what these files must never hold: no role ships at xhigh, which only risky work reaches.
const ABSENT = { 'plugins/gtm/templates/team.md': ['| xhigh |'], 'plugins/gtm/skills/init/SKILL.md': ['effort xhigh'] }
const errors = []
for (const [file, pins] of Object.entries(PINS)) {
  const text = readFileSync(join(root, file), 'utf8')
  for (const pin of pins) if (!(pin instanceof RegExp ? pin.test(text) : text.includes(pin))) errors.push(`${file} lacks ${pin}`)
}
for (const [file, words] of Object.entries(ABSENT)) {
  const text = readFileSync(join(root, file), 'utf8')
  for (const w of words) if (text.includes(w)) errors.push(`${file} holds ${w}`)
}
for (const name of readdirSync(join(root, 'plugins/gtm/agents')).filter((f) => f.endsWith('.md'))) {
  const file = `plugins/gtm/agents/${name}`
  if (/^effort: xhigh$/m.test(readFileSync(join(root, file), 'utf8'))) errors.push(`${file} ships effort xhigh`)
}
if (errors.length) { console.error(errors.join('\n')); process.exit(1) }
console.log('guards: the promised lines hold')
