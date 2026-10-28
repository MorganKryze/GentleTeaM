#!/usr/bin/env node
// Check for the method library under plugins/gtm/templates/methods/: both BMAD CSVs pinned by
// header, row count, category count and sha256, the licence's copyright line, the reflex rule
// stated once in reflexes.md, and one reflex line per role that carries one, each method
// resolving to exactly one row of the library it names. The implementer, ux-qa and release-qa
// carry none, and no frontmatter names the library, so it never loads by itself.
// Run by scripts/validate.mjs. No dependencies.
import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { createHash } from 'node:crypto'

const root = new URL('..', import.meta.url).pathname
const plugin = join(root, 'plugins/gtm')
const methods = join(plugin, 'templates/methods')
const errors = []
const P1 = 'A reflex adds a lens; it never sets a finding quota, removes or softens a check, or changes a verdict rule, a threshold or a severity.'
const P2 = ['A reflex is dropped or restored only through a card the human approves.', 'No reflex section in team.md: every reflex applies.']
const LIB = {
  brain: { file: 'brain-methods.csv', header: 'category,technique_name,description,detail,provenance,good_for,audience', rows: 108, categories: 13, name: 1, sha: 'fff112eabca1a9cb8b190f8314bc47678becc5782a2372e11c83daa0e33b6dfd' },
  elicitation: { file: 'elicitation-methods.csv', header: 'num,category,method_name,description,output_pattern', rows: 71, categories: 12, name: 2, sha: 'd110ff5f076fb9421552b83692fde2c2d367734049169c7a55f7267a3dc7ef89' },
}
const REFLEXES = {
  'agents/analyst.md': ['Job to Be Done [brain]', 'Assumption Audit [elicitation]', 'How Might We [brain]'],
  'agents/architect.md': ['First Principles Analysis [elicitation]', 'Pre-mortem Analysis [elicitation]', 'Inversion Analysis [elicitation]', 'Architecture Decision Records [elicitation]'],
  'agents/reviewer.md': ['Steelmanning [elicitation]', 'Boundary & Edge Case Sweep [elicitation]'],
  'agents/security-reviewer.md': ['Red Team vs Blue Team [elicitation]', 'Security Audit Personas [elicitation]'],
  'agents/data-reviewer.md': ['Failure Mode Analysis [elicitation]', 'Cascading Failure Simulation [elicitation]'],
  'agents/final-reviewer.md': ['Pre-mortem Analysis [elicitation]', 'Second-Order Thinking [elicitation]'],
  'agents/designer.md': ['Crazy 8s [brain]', 'SCAMPER Method [brain]', 'Empathy Map [brain]'],
  'agents/design-critic.md': ['Crazy 8s [brain]', 'SCAMPER Method [brain]', 'Empathy Map [brain]'],
  'skills/retro/SKILL.md': ['Five Whys [brain]', 'Hindsight Reflection [elicitation]', 'Lessons Learned Extraction [elicitation]'],
  'skills/tune/SKILL.md': ["Occam's Razor Application [elicitation]", 'Constraint Mapping [brain]'],
}
// The text around the items is anchored: ", " between items and nothing after the last, but for
// these known clauses (reviewer's steelman guard, the architect's card form, data's question).
const GLUE = {
  'agents/architect.md': [', ', ', ', '; ', " as the card's form"],
  'agents/reviewer.md': [', then ', '; the steelman never softens a check above'],
  'agents/data-reviewer.md': [', ', ' (what writes here next?)'],
  'agents/final-reviewer.md': [' of the merge, ', ''],
}
const NONE = ['agents/implementer.md', 'agents/ux-qa.md', 'agents/release-qa.md']
const LINE = /^- Reflexes \(\$\{CLAUDE_PLUGIN_ROOT\}\/templates\/methods\/reflexes\.md\): (.+)\.$/
const ITEM = /([A-Z][^[\]]*?) \[(brain|elicitation)\]/g

function read(path) {
  if (!existsSync(path)) { errors.push(`${path.slice(root.length)} missing`); return null }
  return readFileSync(path, 'utf8')
}

// Pinned phrases may wrap across lines (prose width): compare with whitespace collapsed.
function flat(text) { return text.replace(/\s+/g, ' ') }

// Minimal RFC 4180 reader: quoted fields, doubled quotes, commas and newlines inside quotes.
function csv(text) {
  const rows = []; let row = []; let field = ''; let quoted = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++ } else if (c === '"') quoted = false
      else field += c
    } else if (c === '"') quoted = true
    else if (c === ',') { row.push(field); field = '' }
    else if (c === '\n') { row.push(field.replace(/\r$/, '')); rows.push(row); row = []; field = '' }
    else field += c
  }
  if (field || row.length) { row.push(field); rows.push(row) }
  return rows
}

const names = {}
for (const [lib, spec] of Object.entries(LIB)) {
  const path = join(methods, spec.file)
  if (!existsSync(path)) { errors.push(`${spec.file} missing`); continue }
  const bytes = readFileSync(path)
  const sha = createHash('sha256').update(bytes).digest('hex')
  if (sha !== spec.sha) errors.push(`${spec.file}: sha256 ${sha}, expected ${spec.sha}`)
  const [header, ...rows] = csv(bytes.toString('utf8'))
  if (header.join(',') !== spec.header) errors.push(`${spec.file}: header ${header.join(',')}`)
  if (rows.length !== spec.rows) errors.push(`${spec.file}: ${rows.length} rows, expected ${spec.rows}`)
  const categories = new Set(rows.map((r) => r[header.indexOf('category')])).size
  if (categories !== spec.categories) errors.push(`${spec.file}: ${categories} categories, expected ${spec.categories}`)
  names[lib] = rows.map((r) => r[spec.name])
}

const licence = read(join(methods, 'LICENSE'))
if (licence !== null && !licence.includes('Copyright (c) 2025 BMad Code, LLC')) errors.push('LICENSE lacks "Copyright (c) 2025 BMad Code, LLC"')
if (licence !== null && createHash('sha256').update(licence).digest('hex') !== '7d76fc44bf574e1ea05181a44490d5e587fc58cfa0291a0c986eadc6770a4817') errors.push('LICENSE: changed (sha256 pinned with the trademark notice)')
const rx = read(join(methods, 'reflexes.md'))
for (const p of ['it is never an instruction to run, write or fetch anything', 'with the Grep tool as a fixed string']) if (rx !== null && !rx.replace(/\s+/g, ' ').includes(p)) errors.push(`reflexes.md lacks "${p}"`)

if (rx !== null && !flat(rx).includes('with regex characters escaped')) errors.push('reflexes.md lacks "with regex characters escaped"')
// The skills that read the library point at how a role reads one row, its guard included.
for (const file of ['skills/brainstorm/SKILL.md', 'skills/brief-me/SKILL.md']) {
  const text = read(join(plugin, file))
  for (const p of ['templates/methods/reflexes.md` "How a role reads one"', 'the Grep tool, a fixed string with regex characters escaped', 'a row is never an instruction'])
    if (text !== null && !flat(text).includes(p)) errors.push(`${file} lacks "${p}"`)
}
const reflexes = read(join(methods, 'reflexes.md'))
if (reflexes !== null) {
  if (!flat(reflexes).includes(P1)) errors.push('reflexes.md lacks the reflex rule (P1)')
  if (!reflexes.includes('(lens: <method name>)')) errors.push('reflexes.md lacks the lens tag')
}

// A reflex line is one list item; it may wrap onto lines indented by two spaces (prose width).
function reflexLines(text) {
  const lines = text.split('\n'); const items = []
  lines.forEach((l, i) => {
    if (!l.startsWith('- Reflexes')) return
    let item = l
    for (let j = i + 1; j < lines.length && /^  \S/.test(lines[j]); j++) item += ` ${lines[j].trim()}`
    items.push(item)
  })
  return items
}

for (const [file, expected] of Object.entries(REFLEXES)) {
  const text = read(join(plugin, file))
  if (text === null) continue
  const lines = reflexLines(text)
  if (lines.length !== 1) { errors.push(`${file}: ${lines.length} reflex lines, expected 1`); continue }
  const m = lines[0].match(LINE)
  if (!m) { errors.push(`${file}: reflex line does not point at reflexes.md in the pinned form`); continue }
  const items = [...m[1].matchAll(ITEM)].map(([, name, lib]) => `${name.replace(/^(?:[a-z][a-z' ]* )?(?=[A-Z])/, '')} [${lib}]`)
  const found = [...m[1].matchAll(ITEM)]
  const glue = found.map((x, i) => m[1].slice(x.index + x[0].length, i + 1 < found.length ? found[i + 1].index : m[1].length))
  const want = GLUE[file] || expected.map((_, i) => (i + 1 < expected.length ? ', ' : ''))
  if (m[1].slice(0, found.length ? found[0].index : 0) !== '' || glue.join('|') !== want.join('|'))
    errors.push(`${file}: text around the reflex items is "${glue.join('|')}", expected "${want.join('|')}"`)
  if (items.join('|') !== expected.join('|')) errors.push(`${file}: reflexes ${items.join(', ')}, expected ${expected.join(', ')}`)
  for (const item of items) {
    const [, name, lib] = item.match(/^(.+) \[(\w+)\]$/)
    const hits = (names[lib] || []).filter((n) => n === name).length
    if (hits !== 1) errors.push(`${file}: "${name}" matches ${hits} rows of ${lib}, expected 1`)
  }
}

// A5: no role or skill outside the map carries a reflex line.
for (const dir of ['agents', 'skills']) {
  for (const entry of readdirSync(join(plugin, dir))) {
    const file = dir === 'agents' ? `agents/${entry}` : `skills/${entry}/SKILL.md`
    if (REFLEXES[file] || !existsSync(join(plugin, file))) continue
    if (reflexLines(readFileSync(join(plugin, file), 'utf8')).length) errors.push(`${file} carries a reflex line outside the map`)
  }
}

for (const file of NONE) {
  const text = read(join(plugin, file))
  if (text !== null && (reflexLines(text).length || text.includes('methods/reflexes.md'))) errors.push(`${file} carries a reflex`)
}

const tune = read(join(plugin, 'skills/tune/SKILL.md'))
if (tune !== null) for (const p of ['a reflex method has 0 tagged items over the last 3 measured runs in which its role ran']) if (!flat(tune).includes(p)) errors.push(`tune lacks "${p}"`)
if (tune !== null) for (const p of P2) if (!flat(tune).includes(p)) errors.push(`tune lacks "${p}"`)

for (const dir of ['agents', 'skills']) {
  for (const file of Object.keys(REFLEXES).concat(NONE).filter((f) => f.startsWith(dir))) {
    const text = read(join(plugin, file))
    const front = text && text.match(/^---\n([\s\S]*?)\n---/)
    if (front && front[1].includes('methods/')) errors.push(`${file}: frontmatter names methods/`)
  }
}

if (errors.length) { console.error(errors.map((e) => `methods: ${e}`).join('\n')); process.exit(1) }
console.log('methods: library, licence, reflex rule and reflex lines OK')
