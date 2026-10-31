#!/usr/bin/env node
// Pins the wiring of art direction across files: the workflow's jobs against the craft files, its
// roles against the agents, its taste fields against the critic's, the art director's run files
// against the skill's, and the words each documentation page owes. No dependencies.
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const root = new URL('../', import.meta.url).pathname
const plugin = join(root, 'plugins/gtm')
const read = (path) => readFileSync(join(root, path), 'utf8')
const flat = (path) => read(path).replace(/\s+/g, ' ')
const errors = []

const loop = read('plugins/gtm/workflows/design-loop.js')
const skill = 'plugins/gtm/skills/design/SKILL.md'
const list = (name) => (loop.match(new RegExp(`^const ${name} = \\[(.*)\\]$`, 'm'))?.[1] ?? '').match(/[a-z-]+/g) ?? []

const crafts = readdirSync(join(plugin, 'templates/crafts')).filter((f) => f !== 'index.md').map((f) => f.replace(/\.md$/, ''))
if ([...list('JOBS')].sort().join() !== crafts.sort().join()) errors.push(`design-loop jobs ${list('JOBS')}, craft files ${crafts}`)

for (const [, role] of loop.matchAll(/\bas\('([a-z-]+)'/g)) {
  if (!existsSync(join(plugin, `agents/${role}.md`))) errors.push(`design-loop: no agent file for ${role}`)
}

const critic = flat('plugins/gtm/agents/design-critic.md').match(/five grades from 0 to 10: ([a-z, ]+)/)?.[1].split(', ').map((w) => w.trim())
if (list('TASTE').join() !== (critic ?? []).join()) errors.push(`design-loop taste ${list('TASTE')}, critic ${critic}`)

for (const file of ['plugins/gtm/agents/art-director.md', 'plugins/gtm/agents/designer.md', skill]) {
  if (!read(file).includes('templates/crafts/index.md') && !read(file).includes('crafts index')) errors.push(`${file} does not name the crafts index`)
}
if (!read(skill).includes('templates/crafts/index.md')) errors.push('design skill: no templates/crafts/index.md')
if (!read(skill).includes('templates/taste.md')) errors.push('design skill: no templates/taste.md')
if (!existsSync(join(plugin, 'templates/taste.md'))) errors.push('templates/taste.md missing')

for (const f of new Set(read('plugins/gtm/agents/art-director.md').match(/\bdirections?\.(?:md|html)|references\.md/g))) {
  if (!read(skill).includes(`\`${f}\``)) errors.push(`art director names ${f}, the skill does not`)
}

const DOCS = {
  'docs/reference/how-the-team-works.md': ['art director', 'go further', 'taste'],
  'docs/reference/commands.md': ['art director', 'go further', 'taste'],
  'docs/reference/settings.md': ['taste threshold', '7 out of 10'],
  'docs/reference/gtm-folder.md': ['taste.md'],
  'docs/why/credits.md': ['taste-skill', 'awesome-design-md'],
}
for (const [file, words] of Object.entries(DOCS)) {
  for (const w of words) if (!flat(file).includes(w)) errors.push(`${file}: no "${w}"`)
}

if (errors.length) { console.error(errors.join('\n')); process.exit(1) }
console.log('design wiring: jobs, roles, taste fields, run files and docs OK')
