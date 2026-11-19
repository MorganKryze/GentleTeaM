#!/usr/bin/env node
// The `mutations` run-line segment and the tune switch (spec A9, A11). now-facts.mjs reads a
// ledger of 3 measured run lines to the same `eta` with and without the segment before `lenses`;
// the ledger template, deliver's progress line and tune state the segment, the field, the signal,
// the pinned switch phrases (P6) and the Gates line. The `paths` segment after `limits` (spec
// A22, A24, A25) leaves the `eta` as it is; the template states it, its old-line reading and the
// `escape` kind; the retro reads both per path; init proposes the review paths. Runs now-facts.mjs in a throwaway root,
// removed after the run. Run by scripts/validate.mjs. No dependencies.
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { spawnSync } from 'node:child_process'

const root = new URL('..', import.meta.url).pathname
const script = join(root, 'plugins/gtm/scripts/now-facts.mjs')
const errors = []
const NOW = '2026-10-15T10:00:00Z'
const MUTATIONS = ' · mutations 7 planted 2 survived'
const LENSES = ' · lenses reviewer Steelmanning 2, reviewer Boundary & Edge Case Sweep 0'
const line = (d, m) => `- 2026-10-1${d} · run-${d} · run · tasks 4 (one wave) · fix rounds 1, 0, 1, 1 · `
  + `reviewer 0/0/5 · no design · measured ${m}m 1588k 47a: spec 10.4m 129k 1a, plan 17.8m 190k 1a, `
  + `tasks ${m - 40}m 682k 21a, final 17.5m 211k 2a, fix 1.6m 25k 1a; roles ? · limits 5h +3% 7d +1%`

function eta(withSegment, sheets = '', paths = '') {
  const tmp = mkdtempSync(join(tmpdir(), 'gtm-mutations-'))
  try {
    const lines = [line(1, 61.1), line(2, 72.3), line(3, 80.5)]
      .map((l) => l + paths + sheets + (withSegment ? MUTATIONS : '') + LENSES)
    writeFileSync(join(tmp, 'ledger.md'), `# Ledger\n\n${lines.join('\n')}\n`)
    // Outside a git repository the script prints its facts with `?` and exits 1.
    const r = spawnSync('node', [script, '--root', tmp, '--now', NOW], { encoding: 'utf8' })
    if (r.status > 1 || !r.stdout) { errors.push(`now-facts exit ${r.status}: ${r.stderr}`); return null }
    return JSON.parse(r.stdout).eta
  } finally { rmSync(tmp, { recursive: true, force: true }) }
}

const plain = eta(false), counted = eta(true)
if (!plain || plain.runs !== 3) errors.push(`eta without mutations reads ${JSON.stringify(plain)}, want 3 runs`)
if (JSON.stringify(plain) !== JSON.stringify(counted)) errors.push(`eta differs: ${JSON.stringify(plain)} vs ${JSON.stringify(counted)}`)
const sheeted = eta(true, ' · sheets security 3 0/1/2, nodejs 3 0/0/0')
if (JSON.stringify(plain) !== JSON.stringify(sheeted)) errors.push(`eta differs with sheets: ${JSON.stringify(plain)} vs ${JSON.stringify(sheeted)}`)

const pathed = eta(true, '', ' · paths text 2 30.5m 200k 1r, full 1 40.0m 300k 2r')
if (JSON.stringify(plain) !== JSON.stringify(pathed)) errors.push(`eta differs with paths: ${JSON.stringify(plain)} vs ${JSON.stringify(pathed)}`)

const read = (p) => readFileSync(join(root, p), 'utf8').replace(/\n> /g, ' ').replace(/\n(?!\n)/g, ' ').replace(/ {2,}/g, ' ')
const template = read('plugins/gtm/templates/ledger.md')
if (!template.includes('· mutations <planted> planted <survived> survived · lenses')) {
  errors.push('ledger template does not state the `mutations` segment before `· lenses`')
}
// `?` only where the reviewer ran and left no count: a `GATED` line has no review of its own, and
// its range review's line carries the counts.
const LEDGER = [
  '`mutations` summed over the progress lines that carry it, deferred and re-run review lines included',
  '`?` when the task progress lines do not all carry it',
  'a `GATED` line or one without the `reviewer` skipped',
  'a `?` segment left out, as budgets',
  'one without `mutations` (every line before 0.12.0) as not measured for mutations',
]
for (const p of LEDGER) if (!template.includes(p)) errors.push(`ledger template lacks: ${p}`)
const PATHS = [
  '· limits <window> +<a>% ... · paths <path> <n> <w>m <t>k <r>r, ... · sheets',
  "`paths` from the progress lines' `· path` segment",
  'a task\'s runs summed, `none` and `?` lines left out, a path with no task left out',
  'one without `paths` (every line before 0.19.0) as not measured for paths',
  '`escape` (a defect found after the merge of the branch that brought it, `- <date> · <slug of the branch that brought it> · escape · <what>, merged in <merge or PR>, found <where and by whom>, path <text|code|full|?>, category <category>`; written by the gtm skill when it records such a bug, and by the retro)',
]
for (const p of PATHS) if (!template.includes(p)) errors.push(`ledger template lacks: ${p}`)
const retro = read('plugins/gtm/skills/retro/SKILL.md')
for (const p of [
  '**Paths:** run `node "${CLAUDE_PLUGIN_ROOT}/scripts/measure.mjs" --since <day> <root>`, `<day>` the date of the third-last run line (fewer than three: no `--since`), and quote its table (tasks, CLEAN, mean rounds, median minutes and tokens, per path and per implementer model); then the `escape` lines per path.',
  'A defect of this branch found after its merge is one `escape` line.',
  'one table (path, tasks, minutes, tokens, rounds, escapes)',
]) if (!retro.includes(p)) errors.push(`retro lacks: ${p}`)
if (!read('plugins/gtm/skills/init/SKILL.md').includes('the review paths')) errors.push('init does not propose the review paths')
const deliver = read('plugins/gtm/skills/deliver/SKILL.md')
// Keyed on `planted`, set only when the review returned `mutations`: `stats.reviewer` alone exists
// whenever the reviewer reported a finding, and would write a count no review made.
if (!deliver.includes('whose result holds `stats.reviewer.planted` adds ` · mutations <planted>/<survived>`')) {
  errors.push('deliver does not key the progress field `mutations <planted>/<survived>` on `stats.reviewer.planted`')
}
if (!deliver.includes('a re-run review, a direct dispatch, from its own `mutations`')) {
  errors.push('deliver does not take a re-run review\'s field from its own `mutations`')
}
if (!deliver.includes('A line (task, deferred or re-run review)')) {
  errors.push('deliver does not give the progress field to deferred and re-run review lines')
}
const tune = read('plugins/gtm/skills/tune/SKILL.md')
const P6 = [
  'The mutation step is switched off or back on only through a card the human approves.',
  'No `review mutations` line in team.md: the step runs.',
  '- review mutations: off · why: <counts> · <date>',
]
for (const p of P6) if (!tune.includes(p)) errors.push(`tune lacks: ${p}`)
const row = readFileSync(join(root, 'plugins/gtm/skills/tune/SKILL.md'), 'utf8').split('\n').find((l) => l.startsWith('|') && l.includes('0 survived'))
if (!row || !row.includes('3 measured runs')) errors.push('tune has no signal row naming `0 survived` and `3 measured runs`')
// The clauses that keep the drop honest: runs that planted nothing, and lines without the
// segment, are no evidence that nothing survives.
const ROW = ['planted at least one mutation', 'without a `mutations` segment is not measured for mutations']
for (const p of ROW) if (!row || !row.includes(p)) errors.push(`tune's signal row lacks: ${p}`)
// Once off, runs plant 0 and the same pre-drop runs would fire the card again: the row is
// skipped, a drop writes one line, and a restore leaves no line behind.
if (!row || !row.includes('skipped while team.md holds a `review mutations: off` line')) {
  errors.push('tune\'s signal row does not skip a step already off')
}
for (const p of [
  "adds to team.md's Gates, when none is there,",
  '(their `measured` part, `lenses` and `mutations` segments included)',
  'Asked to turn the mutation step back on (`/gtm:tune review mutations on`)? One card, then §4.',
   'a restore deletes every `review mutations` line',
]) {
  if (!tune.includes(p)) errors.push(`tune lacks: ${p}`)
}

if (errors.length) { console.error(errors.join('\n')); process.exit(1) }
console.log('run-mutations: run lines read the same with and without the segment; template, deliver and tune state it')
