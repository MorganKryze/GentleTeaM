#!/usr/bin/env node
// Pins the decision check on written samples: one per gap, each failing on that gap alone, in
// French and in English with the same result; a pass prints its counts; only an amended spec passes
// in the older five-column form; an unread file has its own exit; no cell text is ever printed; the
// check reads and runs nothing else; and the spec template's columns, rows and card pass the check,
// so the two cannot drift. Run by scripts/validate.mjs. No dependencies.
import { spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const root = new URL('..', import.meta.url).pathname
const CHECK = join(root, 'plugins/gtm/scripts/decision-check.mjs')
const TEMPLATE = join(root, 'plugins/gtm/templates/spec.md')
const source = readFileSync(CHECK, 'utf8')
const template = readFileSync(TEMPLATE, 'utf8')
const errors = []
const dir = mkdtempSync(join(tmpdir(), 'gtm-decision-check-'))
const specFile = join(dir, 'spec.md')
const config = join(dir, 'config.yml')
writeFileSync(config, 'verify:\n  prefix: ""\n  lint: "node l"\n  test: "node t"\n  build: ""\n  gate: [test, build]   # a comment\n')

const run = (...args) => {
  const r = spawnSync(process.execPath, [CHECK, ...args], { encoding: 'utf8' })
  return { exit: r.status, out: r.stdout, err: r.stderr, all: `${r.stdout}${r.stderr}` }
}
let samples = 0
const checked = (text, settings = config) => {
  samples++
  writeFileSync(specFile, text)
  return run('--spec', specFile, '--config', settings)
}

const EN = {
  accept: 'Acceptance (EARS)', head: 'Decisions', cols: '| # | Decision | Choice | Why | Cost if wrong | Confirmation | Status |',
  title: 'Decision D1: which one?', criteria: 'Criteria: safety, then cost.', opts: '| Option | What it means |', rec: '**I recommend: A**, it is safer.',
}
const FR = {
  accept: 'Acceptation (EARS)', head: 'Décisions', cols: '| # | Décision | Choix | Pourquoi | Coût si faux | Confirmation | Statut |',
  title: 'Décision D1 : laquelle ?', criteria: 'Critères : sûreté, puis coût.', opts: '| Option | Ce que ça implique |', rec: '**Mon avis : A**, plus sûr.',
}
const D1 = '| D1 | one | A | safer | slower for the team, an hour to undo | A1, verify.test | proposed |'
const R1 = '| R1 | two | B | cheaper | heavier for readers, a commit to undo | review: reviewer | ruling |'
const OPTION_B = '| **B** other | slower |'
const sample = (l, status = 'approved by the human on 2026-11-01') => `# Sample: spec

> Track: Feature.
> Status: ${status}

## ${l.accept}
- A1 THE SYSTEM SHALL do one thing.
- A2 WHEN asked THE SYSTEM SHALL do another.

## ${l.head}
${l.cols}
| --- | --- | --- | --- | --- | --- | --- |
${D1}
${R1}

**${l.title}**

${l.criteria}

${l.opts}
| --- | --- |
| **A** one | safer |
${OPTION_B}

${l.rec}

## Open
None.
`

// [the gap line, the row or card text changed, what it becomes]
const GAPS = [
  ['table: none', `${D1}\n${R1}\n`, ''],
  ['row 1: id', '| D1 | one', '| X1 | one'],
  ['row 1: id', '| D1 | one', '| D1x | one'],
  ['row 1: id', '| D1 | one', '| xD1 | one'],
  ['row 2: id', '| R1 | two', '| R1 text | two'],
  ['R1: twice', R1, `${R1}\n${R1}`],
  ['D1: cells', '| A | safer | slower', '| A safer | slower'],
  ['D1: empty', '| safer | slower', '|  | slower'],
  ['D1: cost', 'slower for the team, an hour to undo', 'slower undo'],
  ['D1: confirmation-line', 'A1, verify.test', 'A9, verify.test'],
  ['D1: confirmation-line', '- A1 THE', '- A10 THE'],
  ['D1: confirmation-key', 'A1, verify.test', 'A1, verify.lint'],
  ['D1: confirmation-key', 'A1, verify.test', 'A1, verify.build'],
  ['R1: confirmation-role', 'review: reviewer', 'review: release-qa'],
  ['R1: confirmation-none', 'review: reviewer', 'someone will look'],
  ['D1: options', `${OPTION_B}\n`, ''],
]
// On a pass or a gap the output is the rule lines and nothing else: a line off them fails, on
// either stream, so no text from a spec can cross. Exit 2 has its own pin, with the unread files.
const expectOnly = (label, text, exit, want, settings) => {
  const r = checked(text, settings)
  if (r.exit !== exit || r.out !== want || r.err) errors.push(`${label}: want exit ${exit} and only "${want}", got exit ${r.exit}: ${r.all}`)
}
const expectGap = (label, text, want, settings) => expectOnly(label, text, 1, `${want}\ndecision-check: ${want.split('\n').length} gaps\n`, settings)
for (const [lang, l] of [['en', EN], ['fr', FR]]) {
  const good = sample(l)
  const pass = checked(good)
  if (pass.exit !== 0 || !pass.out.includes('2 rows, 1 cards')) errors.push(`${lang}: a good spec reads exit ${pass.exit}: ${pass.all}`)
  for (const [want, from, to] of GAPS) {
    if (!good.includes(from)) errors.push(`${lang}: sample lacks ${from}`)
    expectGap(`${lang} ${want}`, good.replace(from, to), want)
  }
  expectGap(`${lang} no card`, good.replace(`**${l.title}**`, '**Which one?**'), 'D1: no-card')
  expectGap(`${lang} no options at all`, good.replace(/\| Option[\s\S]*?\| \*\*B\*\* other \| slower \|\n/, ''), 'D1: options')
  expectGap(`${lang} no criteria`, good.replace(`${l.criteria}\n\n`, ''), 'D1: criteria')
  expectGap(`${lang} a line of spaces is no criteria`, good.replace(`${l.criteria}\n`, '   \n'), 'D1: criteria')
  expectGap(`${lang} a pipe in a cell`, good.replace('| safer | slower', '| sa|fer | slower'), 'D1: cells')
  if (checked(good.replace('| safer | slower', '| sa\\|fer | slower')).exit !== 0) errors.push(`${lang}: an escaped pipe is refused`)
}
// Which cell is empty does not matter.
for (const [i, cell] of [' one ', ' A ', ' safer ', ' slower for the team, an hour to undo ', ' A1, verify.test ', ' proposed '].entries())
  expectGap(`empty cell ${i + 1}`, sample(EN).replace(D1, D1.replace(`|${cell}|`, '|  |')), 'D1: empty')
// Each of the six roles is accepted, not only the one in the sample.
for (const role of ['reviewer', 'security-reviewer', 'data-reviewer', 'final-reviewer', 'ux-qa', 'design-critic']) {
  const r = checked(sample(EN).replace('review: reviewer', `review: ${role}`))
  if (r.exit !== 0) errors.push(`review: ${role} is refused: ${r.all}`)
}
// A gate step confirms nothing unless it holds a command, however it was left empty.
const lintConfig = join(dir, 'lint.yml')
const lintAs = (line) => {
  writeFileSync(lintConfig, `verify:\n  ${line}\n  test: "node t"\n  gate: [lint, test]\n`)
  return lintConfig
}
const citesLint = sample(EN).replace('A1, verify.test', 'A1, verify.lint')
const filled = checked(citesLint, lintAs('lint: "node l"'))
if (filled.exit !== 0) errors.push(`a gate step with a command is refused: ${filled.all}`)
for (const line of ['lint: ""', 'lint:', 'lint:   # nothing yet', 'lint: {}', 'lint: []', 'lint: "   "', 'lint: ~', 'lint: null', 'lint: NULL'])
  expectGap(`a gate step as ${line}`, citesLint, 'D1: confirmation-key', lintAs(line))
// Where a table and a card begin and end.
expectGap('an earlier table is not the record', sample(EN).replace('## Acceptance', '| a | b |\n| --- | --- |\n| c | d |\n\n## Acceptance').replace(D1, D1.replace('A1, verify.test', 'A9')), 'D1: confirmation-line')
const noOptions = sample(EN).replace(/\| Option[\s\S]*?\| \*\*B\*\* other \| slower \|\n/, '')
expectGap("a later section's table is no option", `${noOptions}\n| a | b |\n| --- | --- |\n| c | d |\n| e | f |\n`, 'D1: options')
const second = `${D1.replace('| D1 |', '| D2 |')}\n`
const nextCard = `**${EN.title.replace('D1', 'D2')}**\n\n${EN.criteria}\n\n${EN.opts}\n| --- | --- |\n| **A** one | safer |\n${OPTION_B}\n\n## Open`
expectGap("the next card's table is no option", noOptions.replace(`${R1}\n`, `${R1}\n${second}`).replace('## Open', nextCard), 'D1: options')
expectGap('a row with no row of its own card', sample(EN).replace(`${R1}\n`, `${R1}\n${second}`), 'D2: no-card')
const fence = '```\n'
expectGap('a table in a fence', sample(EN).replace(`${EN.cols}\n`, `${fence}${EN.cols}\n`).replace(`${R1}\n`, `${R1}\n${fence}`), 'table: none')

// The older form: amended passes, and nothing else does.
const older = (text) => text.replace(/^\|.*\| Confirmation \|.*$/m, '| # | Decision | Choice | Why | Status |').replace('| --- | --- | --- | --- | --- | --- | --- |', '| --- | --- | --- | --- | --- |')
  .replace(D1, '| D1 | one | A | safer | proposed |').replace(R1, '| R1 | two | B | cheaper | ruling |')
const amended = 'draft (amended 2026-11-02; approved by the human on 2026-11-01)'
const passed = checked(older(sample(EN, amended)))
if (passed.exit !== 0 || !passed.out.includes('older form, not checked')) errors.push(`older form: an amended spec reads exit ${passed.exit}: ${passed.all}`)
// As real specs hold it: mid-line, or wrapped anywhere in the header's quote.
const amendedOlder = older(sample(EN, amended))
for (const [label, from, to] of [
  ['mid-line', '> Track: Feature.\n> Status:', '> Track: Feature. Date: 2026-11-01. Status:'],
  ['wrapped after Status', 'Status: draft', 'Status:\n> draft'],
  ['wrapped after draft', 'draft (amended', 'draft\n> (amended'],
  ['wrapped after amended', '(amended 2026', '(amended\n> 2026'],
]) {
  const r = checked(amendedOlder.replace(from, to))
  if (r.exit !== 0 || !r.out.includes('older form, not checked')) errors.push(`older form, ${label}: exit ${r.exit}: ${r.all}`)
}
expectGap('older form, not amended', older(sample(EN)), 'table: five columns')
expectGap('older form, amended denied', older(sample(EN, 'approved, not amended')), 'table: five columns')
expectGap('older form, the amend written in the body', `${older(sample(EN))}\n> Status: ${amended}\n`, 'table: five columns')
expectGap('older form, the amend under another field', older(sample(EN)).replace('> Track: Feature.', `> Track: ${amended}.`), 'table: five columns')
expectGap('older form, another field ending in Status', amendedOlder.replace('> Status:', '> SubStatus:'), 'table: five columns')
expectGap('older form, a longer word', amendedOlder.replace('(amended', '(amendedly'), 'table: five columns')
expectGap('older form, Status outside the quote', amendedOlder.replace('> Status:', 'Status:'), 'table: five columns')
expectGap('older form, no heading ends a header', amendedOlder.replace(/^## /gm, ''), 'table: five columns')
expectGap('older form, amended only in the body', `${older(sample(EN))}\n> Status: amended\n`, 'table: five columns')
expectGap('older form, amended in another line', older(sample(EN)).replace('> Track: Feature.', '> Track: amended.'), 'table: five columns')
const four = older(sample(EN, amended)).replace('| Why | Status |', '| Status |').replace('| --- | --- | --- | --- | --- |', '| --- | --- | --- | --- |')
  .replace('| safer | proposed |', '| proposed |').replace('| cheaper | ruling |', '| ruling |')
expectGap('four columns are not the older form', four, 'D1: cells\nR1: cells')
expectGap('seven columns stay checked when amended', sample(EN, amended).replace(D1, D1.replace('A1, verify.test', 'A9')), 'D1: confirmation-line')

// Nothing from a cell comes out, a malformed id included.
const SECRET = 'ZZSECRET'
const leak = checked(sample(EN)
  .replace('| D1 | one | A | safer | slower for the team, an hour to undo | A1, verify.test |', `| ${SECRET} | ${SECRET} | ${SECRET} | ${SECRET} | ${SECRET} | ${SECRET} |`)
  .replace('| R1 | two | B | cheaper | heavier for readers, a commit to undo | review: reviewer |', `| R1 | ${SECRET} | ${SECRET} | ${SECRET} | ${SECRET} | review: ${SECRET} |`))
if (leak.exit !== 1 || leak.all.includes(SECRET)) errors.push(`a cell's text was printed: ${leak.all}`)
// The same with text in each cell and card, a malformed id included.
const CARD = { ...EN, title: `Decision D1 ${SECRET}`, criteria: SECRET, opts: `| ${SECRET} | ${SECRET} |`, rec: SECRET }
const inCard = (text) => text.replace('| **A** one | safer |', `| **A** ${SECRET} | ${SECRET} |`)
const inCells = (id) => `| ${id} | ${SECRET} | ${SECRET} | ${SECRET} | ${SECRET} and two more | A1, verify.test ${SECRET} | ${SECRET} |`
const textual = (id) => inCard(sample(CARD)).replace(D1, inCells(id))
expectOnly('text in a pass', textual('D1'), 0, 'decision-check: 2 rows, 1 cards\n')
for (const id of [`D1 ${SECRET}`, `${SECRET} D1`, `D1-${SECRET}`, SECRET])
  expectGap(`text in the id ${id}`, textual(id), 'row 1: id')
expectGap('text in a gap', textual('D1').replace('A1, verify.test', 'A9'), 'D1: confirmation-line')
expectOnly('text in an older form', inCard(older(sample(CARD, amended))).replace('| D1 | one | A | safer | proposed |', `| D1 | ${SECRET} | ${SECRET} | ${SECRET} | ${SECRET} |`), 0, 'decision-check: older form, not checked\n')

// Unread: its own exit, never a gap's, never a pass, and one line on stderr holding nothing of the
// spec, which is already in memory when the config cannot be read. The marker sits on every line
// and in every cell, so any of it printed shows, and the line's wording stays free.
const marked = sample(CARD).replace(/^[^|*\n].*/gm, `$& ${SECRET}`).replace(/(?<=\| )(?![DR]\d |-)/g, `${SECRET} `)
const usable = checked(marked)
if (usable.exit !== 0) errors.push(`unread: the baseline is not a pass: ${usable.all}`)
for (const [label, args] of [
  ['no arguments', []],
  ['a missing spec', ['--spec', join(dir, 'none.md'), '--config', config]],
  ['a missing config', ['--spec', specFile, '--config', join(dir, 'none.yml')]],
  ['a folder for a spec', ['--spec', dir, '--config', config]],
  ['an unknown flag', ['--spec', specFile, '--config', config, '--fix']],
]) {
  const r = run(...args)
  if (r.exit !== 2 || r.out || !/^[^\n]+\n$/.test(r.err) || r.err.includes(SECRET)) errors.push(`unread: ${label}: want exit 2 and one line on stderr with nothing of the spec, got exit ${r.exit}: ${r.all}`)
}

// The check reads its two files and runs nothing.
// Every import or re-export, whatever its quotes and line breaks, names what it takes.
const imports = [...source.matchAll(/\b(?:import|export)\b([^'"]*)['"]([^'"]+)['"]/g)].map((m) => `${m[2]} ${m[1].replace(/\s|\bfrom\b/g, '')}`).sort()
if (imports.join() !== './footprint-check.mjs {parseYaml},node:fs {readFileSync}') errors.push(`check imports ${imports}`)
for (const w of [/\bimport\(/, /\brequire\(/, /\beval\(/, /new Function/, /fetch\(/, /(write|append|rm|unlink|rename|copy|mkdir)\w*Sync/, /process\.(env|binding|getBuiltinModule)/])
  if (w.test(source)) errors.push(`check source holds ${w}`)
if ((source.match(/readFileSync\(/g) ?? []).length !== 1) errors.push('check reads files in more than one place')

// The template and the check, tested against each other.
const COLUMNS = '| # | Decision | Choice | Why | Cost if wrong | Confirmation | Status |'
if (!template.includes(`${COLUMNS}\n${'| --- '.repeat(7)}|`)) errors.push('spec template: not the seven columns, in order')
if (!/^\| D1 \|.*\| A1, verify\.\w+, review: \w+ \|/m.test(template)) errors.push('spec template: its D1 row does not show the three confirmations')
const own = run('--spec', TEMPLATE, '--config', config)
if (own.exit !== 0 || !own.out.includes('2 rows, 1 cards')) errors.push(`spec template fails the check: ${own.all}`)
if (!/^- A1 THE SYSTEM SHALL/m.test(template)) errors.push('spec template: acceptance lines are not numbered')

rmSync(dir, { recursive: true, force: true })
if (errors.length) { console.error(errors.join('\n')); process.exit(1) }
console.log(`decision-check: ${samples} samples, the unread files, the template`)
