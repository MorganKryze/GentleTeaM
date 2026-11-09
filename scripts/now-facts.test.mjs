#!/usr/bin/env node
// Fixture test for plugins/gtm/scripts/now-facts.mjs. Each scenario under
// scripts/fixtures/now-facts/ holds a GTM root (root/), args.json ({ branch, worktrees, mtimes,
// dirty: { file, min, worktree? }, rootName?, rootIn?, cwd?, track?, readonly?, links?, fifos?, fsize?, args }) and
// expected.json ({ exit, facts, state?, files? }, facts and state matched as subsets, files ({ path:
// text | null }) the exact text of those root files after the run, null for absent; rootName names the
// root folder, root by default; rootIn puts the root in that worktree, cwd runs the script there,
// track commits those root files, readonly locks the root folder, links ({ path: target }) and
// fifos ([path]) make those root entries at run time, as git keeps no FIFO, fsize caps the files
// the script writes at that many 512-byte blocks (ulimit -f); `{root}` in args is its path).
// The test builds a throwaway repository around the root (git keeps no repository inside a
// fixture), with no global or system git config, and removes it after the run; runs the script at
// a fixed time, and checks it changed no file but the state it was asked for, replaced by a rename,
// and the files expected.json names, no git index and no git status; that a usage error prints nothing; that the state holds no `?`
// and none of its card, step or mandate text reached stdout. Run by scripts/validate.mjs. No
// dependencies.
import { existsSync, readFileSync, readdirSync, mkdtempSync, cpSync, writeFileSync, utimesSync, appendFileSync, rmSync, mkdirSync, statSync, lstatSync, chmodSync, symlinkSync, readlinkSync } from 'node:fs'
import { join, relative, dirname } from 'node:path'
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
function snapshot(dir, skip = []) {
  const h = createHash('sha256')
  const walk = (d) => readdirSync(d, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name)).forEach((e) => {
    const p = join(d, e.name)
    if (skip.includes(relative(dir, p))) return
    // A link is hashed by its target, a FIFO by its name: reading one would follow or block.
    if (e.isDirectory()) walk(p); else h.update(relative(dir, p)).update(e.isSymbolicLink() ? `-> ${readlinkSync(p)}` : e.isFIFO() ? 'fifo' : readFileSync(p))
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
const strings = (v) => (typeof v === 'string' ? [v] : v && typeof v === 'object' ? Object.values(v).flatMap(strings) : [])

for (const name of readdirSync(fixtures).sort()) {
  const dir = join(fixtures, name)
  const a = JSON.parse(readFileSync(join(dir, 'args.json'), 'utf8'))
  const want = JSON.parse(readFileSync(join(dir, 'expected.json'), 'utf8'))
  const tmp = mkdtempSync(join(tmpdir(), 'gtm-now-facts-'))
  const repo = join(tmp, 'repo'), gtm = join(a.rootIn ? join(tmp, a.rootIn) : repo, a.rootName || 'root')
  try {
    mkdirSync(repo)
    if (!a.rootIn) cpSync(join(dir, 'root'), gtm, { recursive: true })
    const date = { GIT_AUTHOR_DATE: ago(60).toISOString(), GIT_COMMITTER_DATE: ago(60).toISOString() }
    git(repo, ['init', '-q', '-b', 'main'])
    appendFileSync(join(repo, '.git/info/exclude'), `/${a.rootName || 'root'}/\n`)
    writeFileSync(join(repo, 'README.md'), 'fixture\n')
    git(repo, ['add', 'README.md'])
    git(repo, ['-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-q', '-m', 'init'], date)
    git(repo, ['checkout', '-q', '-b', a.branch || 'main'])
    for (const w of a.worktrees || []) git(repo, ['worktree', 'add', '-q', '-b', w.branch, join(tmp, w.name)])
    if (a.rootIn) cpSync(join(dir, 'root'), gtm, { recursive: true })
    if (a.track) { git(repo, ['add', '-f', ...a.track.map((f) => relative(repo, join(gtm, f)))]); git(repo, ['-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-q', '-m', 'track'], date) }
    if (a.dirty) { const d = join(a.dirty.worktree ? join(tmp, a.dirty.worktree) : repo, a.dirty.file); mkdirSync(dirname(d), { recursive: true }); writeFileSync(d, 'changed\n'); utimesSync(d, ago(a.dirty.min), ago(a.dirty.min)) }
    if (a.broken) writeFileSync(join(tmp, a.broken, '.git'), 'gitdir: /nonexistent\n')
    for (const p of [repo, ...(a.worktrees || []).map((w) => join(tmp, w.name))]) utimesSync(join(p, 'README.md'), ago(30), ago(30))
    for (const [f, min] of Object.entries(a.mtimes || {})) utimesSync(join(gtm, f), ago(min), ago(min))
    for (const [f, to] of Object.entries(a.links || {})) symlinkSync(to, join(gtm, f))
    for (const f of a.fifos || []) execFileSync('mkfifo', [join(gtm, f)])
    const stateFile = join(gtm, 'state.json'), skip = [...(want.state ? ['state.json'] : []), ...Object.keys(want.files || {})]
    const before = snapshot(gtm, skip), index = indexes(repo), ino = existsSync(stateFile) ? statSync(stateFile).ino : null
    const status = execFileSync('git', ['--no-optional-locks', 'status', '--porcelain'], { cwd: repo, encoding: 'utf8', env })
    const args = (a.args || []).map((x) => x.replace(/\{ago:(\d+)\}/g, (_, m) => ago(+m).toISOString()).replaceAll('{root}', gtm))
    if (a.readonly) chmodSync(gtm, 0o555)
    const cmd = [process.execPath, script, '--root', gtm, '--now', new Date(NOW).toISOString(), ...args]
    // Node ignores SIGXFSZ, so a write past the cap fails with EFBIG.
    const run = a.fsize ? ['sh', ['-c', `ulimit -f ${+a.fsize}; exec "$0" "$@"`, ...cmd]] : [cmd[0], cmd.slice(1)]
    const r = spawnSync(...run, { cwd: a.cwd ? join(tmp, a.cwd) : repo, encoding: 'utf8', env: { ...env, TZ: 'UTC' }, timeout: 60000 })
    if (a.readonly) chmodSync(gtm, 0o755)
    if (r.status !== want.exit) errors.push(`${name}: exit ${r.status}, want ${want.exit} ${r.stderr.trim()}`)
    if (want.exit === 2 && r.stdout !== '') errors.push(`${name}: a usage error printed facts`)
    if (snapshot(gtm, skip) !== before) errors.push(`${name}: the script changed a file in the root`)
    if (indexes(repo) !== index) errors.push(`${name}: the script wrote a git index`)
    if (execFileSync('git', ['--no-optional-locks', 'status', '--porcelain'], { cwd: repo, encoding: 'utf8', env }) !== status) errors.push(`${name}: the script changed git status`)
    for (const [f, t] of Object.entries(want.files || {})) {
      let got = null
      try { lstatSync(join(gtm, f)); got = readFileSync(join(gtm, f), 'utf8') } catch {}
      if (got !== t) errors.push(`${name}: files ${f} differs${t === null ? ', want absent' : ''}`)
    }
    if (want.state) {
      let st
      try { st = JSON.parse(readFileSync(stateFile, 'utf8')) } catch { errors.push(`${name}: no state written`); continue }
      subset(name, st, want.state, 'state')
      if (JSON.stringify(st).includes('"?"')) errors.push(`${name}: the state holds ?`)
      if (ino !== null && statSync(stateFile).ino === ino) errors.push(`${name}: the state was rewritten in place, not replaced`)
      const own = strings([st.waiting?.question, st.waiting?.costIfWrong, st.waiting?.options, (st.steps || []).map((s) => s.title), st.mandate]).filter((s) => s.length >= 8)
      if (own.some((s) => r.stdout.includes(s))) errors.push(`${name}: card, step or mandate text reached the output`)
    }
    if (want.facts === undefined) continue
    let got
    try { got = JSON.parse(r.stdout) } catch { errors.push(`${name}: stdout is not JSON`); continue }
    subset(name, got, want.facts)
    if (/rm -rf|must-fix|\$\(|ignore all|sk live|git push/.test(r.stdout)) errors.push(`${name}: message text reached the output`)
  } finally {
    if (a.readonly && existsSync(gtm)) chmodSync(gtm, 0o755)
    rmSync(tmp, { recursive: true, force: true })
  }
}

if (errors.length) { console.error(errors.join('\n')); process.exit(1) }
console.log(`now-facts: ${readdirSync(fixtures).length} scenarios OK`)
