#!/usr/bin/env node
// Proves each contract test can fail: every test here runs in a scratch copy of the repository
// with one defect planted, and must exit non-zero naming that defect, not some other failure. A
// defect that no longer applies fails too, so a twin cannot rot. Every scripts/*.test.mjs has a
// twin; a new one needs its row. No object in a test holds a key twice: the later one wins and
// the pins under the first never run. Run by scripts/validate.mjs. No dependencies.
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { tmpdir } from 'node:os'
import { execFileSync, spawnSync } from 'node:child_process'

const root = new URL('..', import.meta.url).pathname
const skill = (name) => `plugins/gtm/skills/${name}/SKILL.md`
const agent = (name) => `plugins/gtm/agents/${name}.md`
const script = (name) => `plugins/gtm/scripts/${name}.mjs`
const GUARD = 'plugins/gtm/templates/ui-gate.spec.mjs'
const LEDGER = 'plugins/gtm/templates/ledger.md'
// A test with no twin says why here.
const EXEMPT = {
  'twins.test.mjs': 'this file',
  'site-measure.test.mjs': 'needs a built site and a browser, CI runs it',
}
const TWINS = [
  { test: 'advisor', file: skill('brief-me'), from: 'Dig changes no file.', to: 'Dig changes files.', says: 'Dig changes no file' },
  { test: 'art-director', file: agent('art-director'), from: 'tools: WebFetch, WebSearch', to: 'tools: WebFetch, WebSearch, Bash', says: 'tools' },
  { test: 'brainstorm', file: skill('brainstorm'), from: 'never overwrites a note', to: 'may overwrite a note', says: 'never overwrites a note' },
  { test: 'companions', file: agent('reviewer'), from: 'tools: Read, Bash, Glob, Grep', to: 'tools: Read, Write, Bash, Glob, Grep', says: 'agents/reviewer.md: tools changed' },
  { test: 'crafts', file: 'plugins/gtm/templates/crafts/index.md', from: 'Read the first 150 lines at most.', to: 'Read it all.', says: 'Read the first 150 lines at most.' },
  { test: 'decision-check', file: script('decision-check'), from: 'COST_WORDS = 3', to: 'COST_WORDS = 1', says: 'D1: cost' },
  { test: 'design-flow', file: skill('design'), from: "The pick is the human's answer", to: "The pick is the art director's answer", says: "The pick is the human's answer" },
  { test: 'design-wiring', file: 'docs/reference/settings.md', from: '7 out of 10', to: '6 out of 10', says: '7 out of 10' },
  { test: 'footprint-check', file: script('footprint-check'), from: "kind: 'attribution', re: new RegExp(escape(f), 'gi')", to: "kind: 'attribution', re: new RegExp(escape(f) + 'x', 'gi')", says: 'expected' },
  { test: 'guards', file: 'plugins/gtm/templates/config.yml', from: '  push: ask', to: '  push: auto', says: 'push: ask' },
  { test: 'guards', file: GUARD, from: 'r.width >= 44 && r.height >= 44', to: 'r.width >= 40 && r.height >= 40', says: 'r.width >= 44' },
  { test: 'guards', file: GUARD, from: 'document.documentElement.scrollWidth > width', to: 'document.documentElement.scrollWidth >= width', says: 'scrollWidth > width' },
  { test: 'guards', file: skill('deliver'), from: 'git merge --no-ff --no-edit', to: 'git merge --squash --no-edit', says: '--no-ff' },
  { test: 'guards', file: skill('ship'), from: '--base <git.base> --pr <root>', to: '--base <git.base> <root>', says: '--pr' },
  { test: 'lenses', file: LEDGER, from: '· lenses <role>', to: '· lens <role>', says: 'does not state the `lenses` segment' },
  { test: 'methods', file: agent('reviewer'), from: 'Steelmanning [elicitation]', to: 'Steelman [elicitation]', says: 'reviewer' },
  { test: 'now-facts', file: script('now-facts'), from: 'return s.length % 2 ? s[m]', to: 'return s.length % 2 ? s[0]', says: 'want' },
  { test: 'prose-width', add: 'plugins/gtm/templates/sheets/long.md', to: `${'x'.repeat(101)}\n`, says: 'long.md:1 is 101 characters' },
  { test: 'research', file: skill('research'), from: 'the skill never overwrites a report', to: 'the skill may overwrite a report', says: 'never overwrites a report' },
  { test: 'researcher', file: agent('researcher'), from: 'tools: WebFetch, WebSearch', to: 'tools: WebFetch, WebSearch, Bash', says: 'tools' },
  { test: 'review-mutations', file: agent('reviewer'), from: 'only in a scratch clone outside the repository', to: 'only in a scratch clone in the repository', says: 'P1 missing' },
  { test: 'role-split', file: script('role-split'), from: 'lstatSync', to: 'statSync', says: 'expected exit' },
  { test: 'run-mutations', file: LEDGER, from: '· mutations <planted>', to: '· mutants <planted>', says: 'does not state the `mutations` segment' },
  { test: 'sheets', file: 'plugins/gtm/templates/sheets/quality.md', from: '## Method', to: '## Approach', says: 'quality.md: sections' },
  { test: 'site-checks', file: 'docmd.config.json', from: '"out": "site"', to: '"out": "dist"', says: 'docmd config src/out' },
  { test: 'size', file: script('size'), from: 'Math.ceil(', to: 'Math.floor(', says: 'want' },
  { test: 'taste', file: agent('design-critic'), from: "Put a rival's name on the board", to: 'Put a name on the board', says: "Put a rival's name on the board" },
  { test: 'ui-gate', file: GUARD, from: 'export const UI = {', to: 'export const UI2 = {', says: 'no top `export const UI' },
  { test: 'usage-line', file: script('usage-line'), from: 'flagged = projected >= 100', to: 'flagged = projected >= 1000', says: 'flag' },
  { test: 'workflows', file: 'plugins/gtm/workflows/design-loop.js', from: 'taste >= TASTE_BAR', to: 'taste >= 0', says: 'design-loop' },
]
const ARGS = { 'site-checks': ['--source', '--lasting'] }
const errors = []

// Keys of one object sit at one indent; a line further left closes it.
// ponytail: line-based, a key on a line of its own only; a parser if a one-line map ever hides one.
const twiceKeyed = (src) => {
  const seen = new Map()
  const found = []
  for (const line of src.split('\n')) {
    if (!line.trim()) continue
    const indent = line.search(/\S/)
    for (const at of seen.keys()) if (at > indent) seen.delete(at)
    const key = /^ *(?:'([^']+)'|([\w-]+)): /.exec(line)
    if (!key) continue
    const keys = seen.get(indent) ?? new Set()
    if (keys.has(key[1] ?? key[2])) found.push(key[1] ?? key[2])
    seen.set(indent, keys.add(key[1] ?? key[2]))
  }
  return found
}
const GOOD = "const A = {\n  a: [\n    'x',\n  ],\n  b: {\n    c: 1,\n  },\n  d: {\n    c: 1,\n  },\n}\nconst B = {\n  a: 1,\n}\n"
const BAD = "const A = {\n  'a.md': [\n    'x',\n  ],\n  'a.md': [\n    'y',\n  ],\n}\n"
if (twiceKeyed(GOOD).length) errors.push(`key check refuses a clean map: ${twiceKeyed(GOOD)}`)
if (twiceKeyed(BAD).join() !== 'a.md') errors.push('key check misses a key given twice')

const tests = readdirSync(join(root, 'scripts')).filter((f) => f.endsWith('.test.mjs'))
for (const f of tests) {
  for (const key of twiceKeyed(readFileSync(join(root, 'scripts', f), 'utf8'))) errors.push(`${f}: key ${key} given twice`)
  if (!EXEMPT[f] && !TWINS.some((t) => `${t.test}.test.mjs` === f)) errors.push(`${f}: no broken twin`)
}

const scratch = mkdtempSync(join(tmpdir(), 'gtm-twins-'))
const git = (...a) => execFileSync('git', a, { cwd: scratch, stdio: 'pipe' })
try {
  const files = execFileSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'], { cwd: root, encoding: 'utf8' })
    .split('\0').filter((f) => f && existsSync(join(root, f)))
  for (const f of files) {
    mkdirSync(dirname(join(scratch, f)), { recursive: true })
    cpSync(join(root, f), join(scratch, f), { verbatimSymlinks: true })
  }
  git('init', '-q', '-b', 'main')
  git('add', '-A')
  git('-c', 'user.name=gtm', '-c', 'user.email=gtm@localhost', '-c', 'commit.gpgsign=false', 'commit', '-qm', 'scratch')
  // One commit: marked shallow, as taste.test.mjs asks of a clone without its base.
  writeFileSync(join(scratch, '.git/shallow'), git('rev-parse', 'HEAD'))
  for (const t of TWINS) {
    const name = `${t.test}: ${t.add ?? `${t.file}, ${t.from}`}`
    const path = join(scratch, t.add ?? t.file)
    const before = t.add ? null : readFileSync(path, 'utf8')
    if (before !== null && !before.includes(t.from)) { errors.push(`${name}: no longer applies`); continue }
    writeFileSync(path, t.add ? t.to : before.replaceAll(t.from, t.to))
    const args = [join(scratch, 'scripts', `${t.test}.test.mjs`), ...(t.test in ARGS ? [`${scratch}/`, ...ARGS[t.test]] : [])]
    const r = spawnSync(process.execPath, args, { cwd: scratch, encoding: 'utf8' })
    const out = `${r.stdout}${r.stderr}`
    if (r.status === 0) errors.push(`${name}: the defect passed`)
    else if (!out.includes(t.says)) errors.push(`${name}: failed without saying "${t.says}":\n${out.slice(0, 400)}`)
    if (t.add) rmSync(path)
    else writeFileSync(path, before)
  }
} finally {
  rmSync(scratch, { recursive: true, force: true })
}

if (errors.length) { console.error(errors.join('\n')); process.exit(1) }
console.log(`twins: ${TWINS.length} planted defects caught, ${tests.length} tests, no key given twice`)
