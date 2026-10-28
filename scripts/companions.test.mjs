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

// Every role and skill that uses a companion points at the one rule source.
for (const f of ['agents/designer.md', 'agents/design-critic.md', 'agents/ux-qa.md', 'agents/implementer.md', 'skills/ship/SKILL.md'])
  if (!read(f).includes('templates/companions.md')) fail(`${f} does not point at templates/companions.md`)
const ship = read('skills/ship/SKILL.md')
const humAt = ship.indexOf('With humanize `on`')
if (!(ship.indexOf('\n## 2.') < humAt && humAt < ship.indexOf('\n## 2b.'))) fail('ship: the humanize pass on pr.md must sit in §2, before §2b')
if (!/stealth: on`? §2b's command with `--pr <notes\s+file>`/.test(ship)) fail('ship: release notes must get the footprint check with stealth on')
if (!read('skills/tune/SKILL.md').includes('`/gtm:tune <name> on|off`')) fail('tune: no direct companion on|off switch')
if (!use.includes("the role's own method, unchanged") || !/sort -V/.test(use)) fail('companions.md Use: an off companion leaves the role unchanged; pick the version with sort -V')
if (!/Never a briefing/.test(line(section('humanize'), 'Text')) || !/80 words/.test(line(section('humanize'), 'Text'))) fail('humanize: Text line must skip briefings and short text')
if (!/stealth: on/.test(line(section('humanize'), 'Never'))) fail('humanize: Never must keep tool names out with stealth on')
if (!/No tool call, nothing run or written/.test(section('Detect')) || !/proposed `on`/.test(section('Detect'))) fail('companions.md Detect: read-only detection, proposed on at init')
for (const f of ['agents/design-critic.md', 'agents/designer.md', 'agents/ux-qa.md']) if (!/impeccable/.test(read(f))) fail(`${f} does not name impeccable`)

if (!use.includes('`ls -d "<config>"/plugins/cache/<entry point> |')) fail('companions.md Use: quote <config> only, so the entry point glob expands')
for (const w of ['No question and no install advice']) if (!section('Detect').includes(w)) fail(`companions.md Detect lacks "${w}"`)
for (const w of ['`guidelines/voice.md` wins a disagreement', 'then one briefing line (flagged, rewritten, kept)'])
  if (!section('humanize').replace(/\n\s+/g, ' ').includes(w)) fail(`companions.md humanize lacks "${w}"`)
if (!/without a `Companions` section reads as none on; nothing to migrate/.test(readFileSync(join(root, 'CHANGELOG.md'), 'utf8'))) fail('CHANGELOG: a team.md without Companions needs "nothing to migrate"')

// The 0.11.0 entries: [Unreleased] before the release, the 0.11.0 section after it.
const unreleased = (() => {
  const c = readFileSync(join(root, 'CHANGELOG.md'), 'utf8')
  const at = (h) => c.indexOf(h), a = at('## [0.11.0]') >= 0 ? at('## [0.11.0]') : at('## [Unreleased]')
  return c.slice(a, c.indexOf('\n## [', a + 1))
})()
const bullets = unreleased.split(/\n(?=- )/).map((b) => b.replace(/\s+/g, ' '))
if (!bullets.some((b) => /`brainstorms\/`, a `## Reflexes` section in team\.md and the run line's `lenses` segment are optional; folders without them read as before; nothing to migrate/.test(b))) fail('CHANGELOG [Unreleased]: the optional additions need "nothing to migrate" on their bullet')
if (!bullets.some((b) => b.includes('nothing runs until you pick'))) fail('CHANGELOG [Unreleased]: the advisor says "nothing runs until you pick"')
if (/never runs/.test(unreleased)) fail('CHANGELOG [Unreleased]: "never runs" contradicts commands.md')
for (const w of ['`Brainstorm:` line', 'Next steps']) if (!bullets.some((b) => b.includes(w))) fail(`CHANGELOG [Unreleased] lacks "${w}"`)

for (const s of ['init', 'tune']) if (!read(`skills/${s}/SKILL.md`).includes('templates/companions.md')) fail(`${s}/SKILL.md does not point at templates/companions.md`)
const initLines = read('skills/init/SKILL.md').split('\n').length - 1
if (initLines > 81) fail(`init/SKILL.md is ${initLines} lines (at most 81)`)

if (errors.length) { console.error(errors.join('\n')); process.exit(1) }
console.log('companions: rules, team template, pointers and frozen tool lists OK')
