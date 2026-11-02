#!/usr/bin/env node
// Runs plugins/gtm/scripts/sheet-paths.mjs on throwaway briefs: only names with a row in the sheets
// index come out, beside it, at most 2, each once; nothing of a brief is ever printed; an unread
// file is exit 2 with nothing on stdout. Also runs the command as /gtm:deliver writes it, and pins
// the clause that lets a task go on without sheets. Run by scripts/validate.mjs. No dependencies.
import { spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const plugin = new URL('../plugins/gtm/', import.meta.url).pathname
const script = join(plugin, 'scripts/sheet-paths.mjs')
const sheet = (name) => ({ name, path: join(plugin, 'templates/sheets', `${name}.md`) })
const SENTINEL = 'sentinel-from-the-brief'
const errors = []
const dir = mkdtempSync(join(tmpdir(), 'gtm-sheet-paths-'))
const brief = join(dir, 'brief.md')
const paths = (args) => spawnSync('node', [script, ...args], { encoding: 'utf8' })

const CASES = [
  ['two rows', '**Sheets:** security, nodejs', ['security', 'nodejs']],
  ['one row', '**Sheets:** architecture', ['architecture']],
  ['a plain line', 'Sheets: architecture', ['architecture']],
  ['backticks and spaces', '**Sheets:**  `security` ,`tests`  ', ['security', 'tests']],
  ['none', '**Sheets:** none', []],
  ['empty', '**Sheets:**', []],
  ['no line', '**Files:** a.js', []],
  ['a name with no row', `**Sheets:** ${SENTINEL}`, []],
  ['a name with no row beside one', `**Sheets:** ${SENTINEL}, security`, ['security']],
  ['the index and the template are no rows', '**Sheets:** index, template', []],
  ['a path', '**Sheets:** ../../agents/reviewer, ../security', []],
  ['an upper-case name', '**Sheets:** Security', []],
  ['at most 2', '**Sheets:** security, nodejs, tests', ['security', 'nodejs']],
  ['each once', '**Sheets:** security, security, nodejs', ['security', 'nodejs']],
  ['the first line wins', '**Sheets:** none\n**Sheets:** security', []],
  ['a line inside a sentence', 'See **Sheets:** security', []],
]
for (const [what, text, want] of CASES) {
  writeFileSync(brief, `# Task\n\n${text}\n\n- [ ] Step 1\n`)
  const r = paths(['--brief', brief])
  const expected = JSON.stringify(want.map(sheet))
  if (r.status !== 0 || r.stdout.trim() !== expected) errors.push(`${what}: exit ${r.status}, ${r.stdout} ${r.stderr}, want ${expected}`)
  if (r.stdout.includes(SENTINEL) || r.stderr.includes(SENTINEL)) errors.push(`${what}: printed the brief's text`)
}

const UNREAD = [
  ['no flag', []],
  ['no value', ['--brief']],
  ['another flag', ['--plan', brief]],
  ['a second brief', ['--brief', brief, '--brief', brief]],
  ['a missing file', ['--brief', join(dir, 'missing.md')]],
  ['a folder', ['--brief', dir]],
]
for (const [what, args] of UNREAD) {
  const r = paths(args)
  if (r.status !== 2 || r.stdout) errors.push(`${what}: exit ${r.status}, stdout ${r.stdout}, want 2 and nothing`)
}

// The command as the skill writes it, on a brief with a space in its path.
const deliver = readFileSync(join(plugin, 'skills/deliver/SKILL.md'), 'utf8').replace(/\s+/g, ' ')
const command = /`(node "\$\{CLAUDE_PLUGIN_ROOT\}\/scripts\/sheet-paths\.mjs" --brief "<brief>")`/.exec(deliver)?.[1]
if (!command) errors.push('deliver: no sheet-paths command')
else {
  const spaced = join(dir, 'a brief.md')
  writeFileSync(spaced, '**Sheets:** security\n')
  const r = spawnSync('bash', ['-c', command.replaceAll('<brief>', spaced)], { encoding: 'utf8', env: { ...process.env, CLAUDE_PLUGIN_ROOT: plugin } })
  if (r.status !== 0 || r.stdout.trim() !== JSON.stringify([sheet('security')])) errors.push(`deliver: its command reads exit ${r.status}: ${r.stdout}${r.stderr}`)
}
const CLAUSE = 'omitted on `[]` or any other exit than 0, the task going on'
if (deliver.split(CLAUSE).length !== 2) errors.push(`deliver: "${CLAUSE}" must appear once`)
rmSync(dir, { recursive: true, force: true })

if (errors.length) { console.error(errors.join('\n')); process.exit(1) }
console.log(`sheet-paths: ${CASES.length} briefs, ${UNREAD.length} refusals, the command as written`)
