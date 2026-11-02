#!/usr/bin/env node
// Pins the lines that hold the human's promises: the default `push: ask`, the UI gate's overflow
// and target checks, merge commits on a wave, the footprint check reading the PR text, and a
// decision confirmed by review keeping its reader when the final review is skipped.
// Run by scripts/validate.mjs. No dependencies.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = new URL('..', import.meta.url).pathname
const PINS = {
  'plugins/gtm/templates/config.yml': [/^ {2}push: ask\b/m],
  'plugins/gtm/templates/ui-gate.spec.mjs': [
    'r.width >= 44 && r.height >= 44',
    'document.documentElement.scrollWidth > width',
  ],
  'plugins/gtm/skills/deliver/SKILL.md': ['`git merge --no-ff --no-edit "<branch>-t<n>"`'],
  'plugins/gtm/skills/ship/SKILL.md': ['--base <git.base> --pr <root>/reports/<slug>/pr.md`'],
  'plugins/gtm/skills/plan/SKILL.md': ['so it reaches the brief; a missing one goes back to the architect:'],
}
const errors = []
for (const [file, pins] of Object.entries(PINS)) {
  const text = readFileSync(join(root, file), 'utf8')
  for (const pin of pins) if (!(pin instanceof RegExp ? pin.test(text) : text.includes(pin))) errors.push(`${file} lacks ${pin}`)
}
if (errors.length) { console.error(errors.join('\n')); process.exit(1) }
console.log('guards: the promised lines hold')
