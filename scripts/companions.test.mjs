#!/usr/bin/env node
// Checks the companion rules: plugins/gtm/templates/companions.md names, for each companion GTM
// knows, its entry point, the only commands a role may run, the roles that use it (each a real
// agent or skill) and what it never runs; the team settings template carries the Companions
// section; init and tune point at the rules; and no agent's tool list grows (a companion runs
// through the tools a role already has). Run by scripts/validate.mjs. No dependencies.
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const root = new URL('..', import.meta.url).pathname
const plugin = join(root, 'plugins/gtm')
const errors = []
const fail = (msg) => errors.push(msg)
const read = (rel) => existsSync(join(plugin, rel)) ? readFileSync(join(plugin, rel), 'utf8') : (fail(`${rel}: missing`), '')

// Frozen: a companion never widens a role. Change a line here only with a security review.
const TOOLS = {
  analyst: 'Read, Write, Glob, Grep, Bash',
  architect: 'Read, Write, Edit, Bash, Glob, Grep, Skill',
  'data-reviewer': 'Read, Bash, Glob, Grep',
  'design-critic': 'Read, Bash, Glob, Grep',
  designer: 'Read, Write, Edit, Bash, Glob, Grep, Skill',
  'final-reviewer': 'Read, Bash, Glob, Grep',
  implementer: 'Read, Write, Edit, Bash, Glob, Grep',
  'release-qa': 'Read, Write, Edit, Bash, Glob, Grep',
  reviewer: 'Read, Bash, Glob, Grep',
  'security-reviewer': 'Read, Bash, Glob, Grep',
  'ux-qa': 'Read, Write, Bash, Glob, Grep',
}
for (const [role, tools] of Object.entries(TOOLS)) {
  const fm = read(`agents/${role}.md`).match(/^tools: (.*)$/m)
  if (!fm || fm[1].trim() !== tools) fail(`agents/${role}.md: tools changed (want "${tools}")`)
}

const rules = read('templates/companions.md')
const section = (name) => (rules.split(/^## /m).find((s) => s.startsWith(`${name}\n`)) || '')
for (const h of ['Detect', 'Use', 'impeccable', 'humanize']) if (!section(h)) fail(`companions.md: no "## ${h}"`)
// A bullet with its wrapped continuation lines, joined by spaces.
const line = (sec, key) => ((sec.match(new RegExp(`^- \\*\\*${key}:\\*\\*.*(?:\\n  .*)*`, 'm')) || [''])[0].replace(/\n\s+/g, ' '))
const isRole = (r) => existsSync(join(plugin, 'agents', `${r}.md`)) || existsSync(join(plugin, 'skills', r, 'SKILL.md'))
for (const name of ['impeccable', 'humanize']) {
  const sec = section(name)
  for (const key of ['Source', 'Entry point', 'Run', 'Roles', 'Never']) if (!line(sec, key)) fail(`${name}: no "${key}" line`)
  const roles = [...line(sec, 'Roles').matchAll(/`([a-z-]+)`/g)].map((m) => m[1])
  if (!roles.length) fail(`${name}: Roles names no role`)
  for (const r of roles) if (!isRole(r)) fail(`${name}: role ${r} is neither an agent nor a skill`)
}
const imp = line(section('impeccable'), 'Run')
if (!/IMPECCABLE_LAUNCHER_PROBE=1 "<entry>" detect --json/.test(imp)) fail('impeccable: Run must forbid the download and run detect --json only')
if (!/exit 2/.test(imp)) fail('impeccable: Run must read exit 2 as hits, not a failure')
const hum = line(section('humanize'), 'Run')
if (!/--audit-only/.test(hum) || !/python3 -I/.test(hum)) fail('humanize: Run must be the audit only, the scanner isolated')
const use = section('Use')
for (const w of ['companion <name> skipped: <reason>', 'companion <name> dropped:', 'only adds findings', 'tracked tree'])
  if (!use.includes(w)) fail(`companions.md Use lacks "${w}"`)
if (!section('Detect').includes('none detected')) fail('companions.md Detect lacks "none detected"')

const team = read('templates/team.md')
const at = (h) => team.indexOf(`\n## ${h}\n`)
if (!(at('Specialists') < at('Companions') && at('Companions') < at('Gates'))) fail('team.md: ## Companions must sit between Specialists and Gates')
for (const w of ['none on', '- impeccable: on · detected skill `impeccable:impeccable`', 'templates/companions.md'])
  if (!team.includes(w)) fail(`team.md Companions lacks "${w}"`)

// The template's companion lines are examples: init must never keep them unchosen.
const companionsSec = (team.split(/^## /m).find((s) => s.startsWith('Companions\n')) || '')
if (!/examples/.test(companionsSec) || !/init replaces them/.test(companionsSec)) fail('team.md Companions must mark its lines as examples init replaces')
if (!/example lines/.test(section('Detect'))) fail('companions.md Detect must say init replaces the template example lines')
if (!/Companions[^.]*`- none detected/.test(read('agents/analyst.md'))) fail('agents/analyst.md must draft Companions as `- none detected`, never the example lines')

for (const s of ['init', 'tune']) if (!read(`skills/${s}/SKILL.md`).includes('templates/companions.md')) fail(`${s}/SKILL.md does not point at templates/companions.md`)
const initLines = read('skills/init/SKILL.md').split('\n').length - 1
if (initLines > 81) fail(`init/SKILL.md is ${initLines} lines (at most 81)`)

if (errors.length) { console.error(errors.join('\n')); process.exit(1) }
console.log('companions: rules, team template, pointers and frozen tool lists OK')
