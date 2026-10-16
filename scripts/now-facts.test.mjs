#!/usr/bin/env node
// Fixture test for plugins/gtm/scripts/now-facts.mjs. Each scenario under
// scripts/fixtures/now-facts/ holds a GTM root (root/), args.json ({ branch, worktrees, mtimes,
// dirty: { file, min, worktree? }, args }) and expected.json ({ exit, facts }, facts matched as a
// subset). The test builds a throwaway repository around the root (git keeps no repository
// inside a fixture), with no global or system git config, and removes it after the run; runs the
// script at a fixed time, and checks it changed no file, no git index and no git status. Run by
// scripts/validate.mjs. No dependencies.
import { existsSync, readFileSync, readdirSync, mkdtempSync, cpSync, writeFileSync, utimesSync, appendFileSync, rmSync } from 'node:fs'
import { join, relative } from 'node:path'
import { tmpdir } from 'node:os'
import { execFileSync, spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'

const root = new URL('..', import.meta.url).pathname
const fixtures = join(root, 'scripts/fixtures/now-facts')
const script = join(root, 'plugins/gtm/scripts/now-facts.mjs')
const NOW = Date.parse('2026-10-15T10:00:00Z')
const ago = (min) => new Date(NOW - min * 60000)
const errors = []
const env = { ...process.env, GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_NOSYSTEM: '1' }

function git(cwd, args, extra = {}) {
  execFileSync('git', ['-c', 'commit.gpgsign=false', ...args], { cwd, stdio: 'pipe', env: { ...env, ...extra } })
}
function snapshot(dir) {
  const h = createHash('sha256')
  const walk = (d) => readdirSync(d, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name)).forEach((e) => {
    const p = join(d, e.name)
    if (e.isDirectory()) walk(p); else h.update(relative(dir, p)).update(readFileSync(p))
  })
  walk(dir)
  return h.digest('hex')
}
// The git index of the checkout and of every worktree: git status rewrites it when stat data is
// stale, unless optional locks are off.
function indexes(repo) {
  const wt = join(repo, '.git/worktrees')
  const files = [join(repo, '.git/index'), ...(existsSync(wt) ? readdirSync(wt).map((w) => join(wt, w, 'index')) : [])]
  return files.map((f) => createHash('sha256').update(readFileSync(f)).digest('hex')).join(' ')
}
function subset(name, got, want, path = 'facts') {
  if (want === null || typeof want !== 'object') {
    if (JSON.stringify(got) !== JSON.stringify(want)) errors.push(`${name}: ${path} is ${JSON.stringify(got)}, want ${JSON.stringify(want)}`)
    return
  }
  if (got === null || typeof got !== 'object') return errors.push(`${name}: ${path} is ${JSON.stringify(got)}, want an object`)
  if (Array.isArray(want) && got.length !== want.length) errors.push(`${name}: ${path} has ${got.length} items, want ${want.length}`)
  for (const k of Object.keys(want)) subset(name, got[k], want[k], `${path}.${k}`)
}

for (const name of readdirSync(fixtures).sort()) {
  const dir = join(fixtures, name)
  const a = JSON.parse(readFileSync(join(dir, 'args.json'), 'utf8'))
  const want = JSON.parse(readFileSync(join(dir, 'expected.json'), 'utf8'))
  const tmp = mkdtempSync(join(tmpdir(), 'gtm-now-facts-'))
  try {
    const repo = join(tmp, 'repo')
    cpSync(join(dir, 'root'), join(repo, 'root'), { recursive: true })
    const date = { GIT_AUTHOR_DATE: ago(60).toISOString(), GIT_COMMITTER_DATE: ago(60).toISOString() }
    git(repo, ['init', '-q', '-b', 'main'])
    appendFileSync(join(repo, '.git/info/exclude'), '/root/\n')
    writeFileSync(join(repo, 'README.md'), 'fixture\n')
    git(repo, ['add', 'README.md'])
    git(repo, ['-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-q', '-m', 'init'], date)
    git(repo, ['checkout', '-q', '-b', a.branch || 'main'])
    for (const w of a.worktrees || []) git(repo, ['worktree', 'add', '-q', '-b', w.branch, join(tmp, w.name)])
    if (a.dirty) { const d = join(a.dirty.worktree ? join(tmp, a.dirty.worktree) : repo, a.dirty.file); writeFileSync(d, 'changed\n'); utimesSync(d, ago(a.dirty.min), ago(a.dirty.min)) }
    for (const p of [repo, ...(a.worktrees || []).map((w) => join(tmp, w.name))]) utimesSync(join(p, 'README.md'), ago(30), ago(30))
    for (const [f, min] of Object.entries(a.mtimes || {})) utimesSync(join(repo, 'root', f), ago(min), ago(min))
    const before = snapshot(join(repo, 'root')), index = indexes(repo)
    const status = execFileSync('git', ['--no-optional-locks', 'status', '--porcelain'], { cwd: repo, encoding: 'utf8', env })
    const args = (a.args || []).map((x) => x.replace(/\{ago:(\d+)\}/g, (_, m) => ago(+m).toISOString()))
    const r = spawnSync(process.execPath, [script, '--root', join(repo, 'root'), '--now', new Date(NOW).toISOString(), ...args], { encoding: 'utf8', env: { ...env, TZ: 'UTC' } })
    if (r.status !== want.exit) errors.push(`${name}: exit ${r.status}, want ${want.exit} ${r.stderr.trim()}`)
    if (want.facts === undefined) continue
    let got
    try { got = JSON.parse(r.stdout) } catch { errors.push(`${name}: stdout is not JSON`); continue }
    subset(name, got, want.facts)
    if (/rm -rf|must-fix|\$\(|ignore all|sk live|git push/.test(r.stdout)) errors.push(`${name}: message text reached the output`)
    if (snapshot(join(repo, 'root')) !== before) errors.push(`${name}: the script changed a file in the root`)
    if (indexes(repo) !== index) errors.push(`${name}: the script wrote a git index`)
    if (execFileSync('git', ['--no-optional-locks', 'status', '--porcelain'], { cwd: repo, encoding: 'utf8', env }) !== status) errors.push(`${name}: the script changed git status`)
  } finally {
    rmSync(tmp, { recursive: true, force: true })
  }
}

if (errors.length) { console.error(errors.join('\n')); process.exit(1) }
console.log(`now-facts: ${readdirSync(fixtures).length} scenarios OK`)
