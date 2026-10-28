#!/usr/bin/env node
// Pins /gtm:brainstorm: its rules stated verbatim in the skill (writes only its note and NOW.md,
// never overwrites a note, the slug pattern, the budget), the three stances, the roundtable
// roles and the note fields; the command map names every skill folder once; the spec template
// cites the note. Run by scripts/validate.mjs. No dependencies.
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const plugin = join(root, 'plugins/gtm')
const read = (p) => (existsSync(join(plugin, p)) ? readFileSync(join(plugin, p), 'utf8') : '')
const errors = []
const has = (file, text, phrase) => { if (!text.includes(phrase)) errors.push(`${file}: missing "${phrase}"`) }

// Phrases may wrap at the 100-character prose limit: compare with whitespace collapsed.
const skill = read('skills/brainstorm/SKILL.md').replace(/\s+/g, ' ')
const P3 = [
  'It writes nothing but its note and NOW.md, runs no script, and starts no other skill until the human picks.',
  'never overwrites a note', '^[a-z0-9]+(-[a-z0-9]+)*$', '40k', '80%', 'one prompt per message',
  'never a numbered menu',
]
const stances = ['facilitator', 'partner', 'ideate for me']
const roles = ['architect', 'security', 'UX', 'data', 'a user or a skeptic']
const fields = ['topic', 'goal', 'stance', 'techniques', 'kept ideas', 'open questions', 'budget spent', 'Status:']
for (const p of [...P3, ...stances, ...roles, ...fields]) has('brainstorm/SKILL.md', skill, p)
has('brainstorm/SKILL.md', skill, 'templates/methods/brain-methods.csv')
has('brainstorm/SKILL.md', skill, 'templates/methods/elicitation-methods.csv')
has('brainstorm/SKILL.md', skill, '<root>/brainstorms/')
has('brainstorm/SKILL.md', skill, 'supply no idea')
// P3 allows NOW.md, so the gtm §0 run-view steps that write it are named as part of it.
has('brainstorm/SKILL.md', skill, 'its `now-facts.mjs` read, the `NOW.md.bak` rename and the exclude line')
// A pause before converging keeps every raised idea: each is written down when raised.
for (const p of ['## Ideas', '## Dropped ideas', 'every idea goes under `## Ideas` as it is raised']) has('brainstorm/SKILL.md', skill, p)

const map = read('templates/commands.md')
const line = /^- `\/gtm:([a-z-]+)` · (.+)$/
const names = []
for (const l of map.split('\n')) {
  if (!l.startsWith('- `/gtm:')) continue
  const m = l.match(line)
  if (!m) { errors.push(`commands.md: bad map line "${l}"`); continue }
  if (m[2].length > 80) errors.push(`commands.md: /gtm:${m[1]} over 80 characters`)
  names.push(m[1])
}
const skills = readdirSync(join(plugin, 'skills'), { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name)
for (const s of skills) {
  const n = names.filter((x) => x === s).length
  if (n !== 1) errors.push(`commands.md: /gtm:${s} appears ${n} times, want 1`)
}
for (const n of names) if (!skills.includes(n)) errors.push(`commands.md: /gtm:${n} has no skill folder`)

has('templates/spec.md', read('templates/spec.md'), 'Brainstorm: <note path or none>')

if (errors.length) { console.error(errors.join('\n')); process.exit(1) }
console.log(`brainstorm: skill rules, ${names.length} map lines and the spec field OK`)
