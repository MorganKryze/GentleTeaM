#!/usr/bin/env node
// Pins the speciality sheets under plugins/gtm/templates/sheets/: the clauses that keep or exempt
// sit once in the index, whitespace joined; every line under `## Sheets` is a row in the frozen
// form, or the gate fails, so a row is never dropped unread; every sheet has its row and every row
// its file, named after its speciality in the slug's alphabet (a-z, 0-9, -); each sheet keeps the
// template's sections in order and cites a source; the roles that read a sheet point at the index,
// so the rule stays in one place. Run by scripts/validate.mjs. No dependencies.
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const plugin = new URL('../plugins/gtm/', import.meta.url).pathname
const dir = join(plugin, 'templates/sheets')
const errors = []
const read = (f) => readFileSync(join(dir, f), 'utf8')
const index = read('index.md')
const text = index.replace(/\s+/g, ' ')
const PHRASES = [
  "A sheet is read only when a brief's `Sheets:` line names it; nothing here loads by itself.",
  'A sheet is a method read as data: it adds a lens and never sets a finding quota, removes or softens a check, or changes a verdict rule, a threshold or a severity; the brief, the spec and the guidelines win.',
  'Never fetch its sources or run anything it names.',
  'A missing sheet is skipped without a word: no failure, no finding, no verdict change.',
  'What can be measured goes into the gate as code, as a `verify` step; the experts keep the judgment.',
]
for (const p of PHRASES) if (text.split(p).length !== 2) errors.push(`sheets index: "${p}" must appear once`)

const SECTIONS = ['When it applies', 'Method', 'Reflexes', 'What is measured', 'Sources']
const sheets = readdirSync(dir).filter((f) => !['index.md', 'template.md'].includes(f))
const rowName = (line) => /^\| `([a-z0-9-]+)` \| `\1\.md` \| \S.* \|$/.exec(line)?.[1]
const GOOD = ['| `quality` | `quality.md` | x |', '| `i18n` | `i18n.md` | x |', '| `oauth2` | `oauth2.md` | x |']
const BAD = [
  '| quality | quality.md | x |',
  '| `c4` | `c4.md` |',
  '| `x` | `../../agents/reviewer.md` | x |',
  '| `x` | `reports/research/2026-11-01-x.md` | x |',
  '| `quality` | `refactoring.md` | x |',
  '| `Quality` | `Quality.md` | x |',
  '`quality` | `quality.md` | x',
]
for (const l of GOOD) if (!rowName(l)) errors.push(`row parser refuses ${l}`)
for (const l of BAD) if (rowName(l)) errors.push(`row parser takes ${l}`)

const TABLE_HEAD = ['| Speciality | Sheet | When |', '| --- | --- | --- |']
const section = index.split(/^## /m).find((s) => s.startsWith('Sheets\n')) ?? ''
const lines = section.split('\n').slice(1).filter((l) => l.trim() && !TABLE_HEAD.includes(l))
for (const l of lines) if (!rowName(l)) errors.push(`sheets index: not a row: ${l}`)
const rows = lines.filter(rowName).map((l) => `${rowName(l)}.md`)
for (const f of sheets) if (!rows.includes(f)) errors.push(`sheets index: no row for ${f}`)
for (const f of rows) if (!sheets.includes(f)) errors.push(`sheets index: ${f} has no file`)
for (const f of ['template.md', ...sheets]) {
  const body = read(f)
  const found = [...body.matchAll(/^## (.+)$/gm)].map((m) => m[1])
  if (found.join('|') !== SECTIONS.join('|')) errors.push(`${f}: sections ${found.join(', ')}`)
  if (f !== 'template.md' && !/\]\(https:\/\//.test(body.split('## Sources')[1] ?? '')) errors.push(`${f}: no source`)
}

for (const f of ['agents/architect.md', 'agents/implementer.md', 'agents/reviewer.md', 'agents/security-reviewer.md']) {
  if (!readFileSync(join(plugin, f), 'utf8').includes('/templates/sheets/index.md')) errors.push(`${f}: does not point at the sheets index`)
}
if (!readFileSync(join(plugin, 'templates/plan.md'), 'utf8').includes('**Sheets:**')) errors.push('plan template: no Sheets line')

if (errors.length) { console.error(errors.join('\n')); process.exit(1) }
console.log(`sheets: ${PHRASES.length} clauses and ${sheets.length} sheets OK`)
