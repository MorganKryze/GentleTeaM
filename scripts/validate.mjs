#!/usr/bin/env node
// Checks what `claude plugin validate` does not: agent and skill frontmatter, workflow syntax and
// the CHANGELOG entry for the plugin version. Then runs every scripts/*.test.mjs (fixture tests,
// workflow scenarios, the site's lasting source lines) but the built-site measure, and removes its
// temporary folder. No dependencies.
import { readFileSync, readdirSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs'
import { join, basename } from 'node:path'
import { tmpdir } from 'node:os'
import { execFileSync } from 'node:child_process'

const root = new URL('..', import.meta.url).pathname
const plugin = join(root, 'plugins/gtm')
const errors = []
const fail = (file, msg) => errors.push(`${file.replace(root, '')}: ${msg}`)

function frontmatter(file) {
  const text = readFileSync(file, 'utf8')
  const m = text.match(/^---\n([\s\S]*?)\n---\n/)
  if (!m) return fail(file, 'no frontmatter'), null
  const fm = {}
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^([A-Za-z][\w-]*):\s*(.*)$/)
    if (!kv) { fail(file, `unparsed frontmatter line: ${line}`); continue }
    let v = kv[2]
    if (/^".*"$/.test(v)) v = v.slice(1, -1)
    else if (/:\s/.test(v)) fail(file, `${kv[1]}: unquoted ": " breaks YAML`)
    fm[kv[1]] = v
  }
  return fm
}

for (const f of ['.claude-plugin/marketplace.json', 'plugins/gtm/.claude-plugin/plugin.json']) {
  try { JSON.parse(readFileSync(join(root, f), 'utf8')) } catch (e) { fail(f, `invalid JSON: ${e.message}`) }
}
const manifest = JSON.parse(readFileSync(join(plugin, '.claude-plugin/plugin.json'), 'utf8'))
const market = JSON.parse(readFileSync(join(root, '.claude-plugin/marketplace.json'), 'utf8'))
if (!market.plugins.some((p) => p.name === manifest.name)) fail('marketplace.json', `no entry named ${manifest.name}`)
if (!readFileSync(join(root, 'CHANGELOG.md'), 'utf8').includes(`## [${manifest.version}]`)) fail('CHANGELOG.md', `no entry for ${manifest.version}`)

const EFFORT = ['low', 'medium', 'high', 'xhigh', 'max']
const READ_ONLY = ['design-critic', 'reviewer', 'security-reviewer', 'data-reviewer', 'final-reviewer']
for (const name of readdirSync(join(plugin, 'agents'))) {
  const file = join(plugin, 'agents', name)
  const fm = frontmatter(file)
  if (!fm) continue
  for (const k of ['name', 'description', 'model', 'effort', 'maxTurns', 'tools']) if (!fm[k]) fail(file, `missing ${k}`)
  if (fm.name !== basename(name, '.md')) fail(file, 'name differs from file name')
  if (fm.effort && !EFFORT.includes(fm.effort)) fail(file, `bad effort ${fm.effort}`)
  if (fm.maxTurns && !/^\d+$/.test(fm.maxTurns)) fail(file, 'maxTurns is not an integer')
  if (READ_ONLY.includes(fm.name) && !/Write/.test(fm.disallowedTools || '')) fail(file, 'read-only role must disallow Write and Edit')
  if (/\bAgent\b/.test(fm.tools || '')) fail(file, 'role agents never dispatch subagents')
}
for (const dir of readdirSync(join(plugin, 'skills'))) {
  const file = join(plugin, 'skills', dir, 'SKILL.md')
  const fm = frontmatter(file)
  if (!fm) continue
  if (!fm.description) fail(file, 'missing description')
  if (fm.name && fm.name !== dir) fail(file, 'name differs from directory')
  if (fm.description && fm.description.length > 1024) fail(file, 'description over 1024 characters')
}
const runView = readFileSync(join(plugin, 'skills/gtm/SKILL.md'), 'utf8').replace(/\s+/g, ' ')
for (const w of ['show-toplevel', 'exact line `/<rel>/NOW.md` absent', 'only when you added the line', 'the first time in a session only'])
  if (!runView.includes(w)) fail(join(plugin, 'skills/gtm/SKILL.md'), `run view rule lacks "${w}"`)
const waves = readFileSync(join(plugin, 'skills/deliver/SKILL.md'), 'utf8').replace(/\s+/g, ' ')
for (const w of ['is the head on its last progress line', 'not yet an ancestor of `HEAD`', 'merges each wave with an unmerged task', 'never its head'])
  if (!waves.includes(w)) fail(join(plugin, 'skills/deliver/SKILL.md'), `wave merge rule lacks "${w}"`)
for (const w of ['GTM keeps them', 'no stash', 'status --porcelain -unormal'])
  if (!waves.includes(w)) fail(join(plugin, 'skills/deliver/SKILL.md'), `leftover files rule lacks "${w}"`)
const tmp = mkdtempSync(join(tmpdir(), 'gtm-'))
for (const name of readdirSync(join(plugin, 'workflows'))) {
  const file = join(plugin, 'workflows', name)
  const src = readFileSync(file, 'utf8')
  if (!src.startsWith('export const meta = {')) fail(file, 'meta must be the first statement')
  const meta = src.match(/name: '([^']+)'/)
  if (!meta || meta[1] !== basename(name, '.js')) fail(file, 'meta.name differs from file name')
  if (/Date\.now\(\)|Math\.random\(\)|new Date\(\)/.test(src)) fail(file, 'Date.now, Math.random and new Date() throw in workflows')
  // Top-level return and await are valid at runtime: wrap in an async function to check syntax.
  const wrapped = join(tmp, name)
  writeFileSync(wrapped, `(async () => {\n${src.replace(/^export const meta/m, 'const meta')}\n})()\n`)
  try { execFileSync(process.execPath, ['--check', wrapped], { stdio: 'pipe' }) } catch (e) { fail(file, e.stderr.toString().split('\n').slice(0, 5).join(' ')) }
}

rmSync(tmp, { recursive: true, force: true })

// One loop for every test. The site checks read sources only (the built-site lines run in the
// Pages workflow); the site measure needs a build and a browser, so CI runs it there.
const ARGS = { 'site-checks.test.mjs': [root, '--source', '--lasting'] }
for (const test of readdirSync(join(root, 'scripts')).filter((f) => f.endsWith('.test.mjs') && f !== 'site-measure.test.mjs').sort()) {
  const file = join(root, 'scripts', test)
  try { execFileSync(process.execPath, [file, ...(ARGS[test] || [])], { stdio: 'pipe' }) }
  catch (e) { fail(file, '\n' + (((e.stdout || '') + (e.stderr || '')).toString().trim() || e.message)) }
}

if (errors.length) { console.error(errors.join('\n')); process.exit(1) }
console.log('gtm: manifests, agents, skills, workflow syntax and every scripts/*.test.mjs OK')
