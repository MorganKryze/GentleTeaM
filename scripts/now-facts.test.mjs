#!/usr/bin/env node
// Fixture test for plugins/gtm/scripts/now-facts.mjs. Each scenario under
// scripts/fixtures/now-facts/ holds a GTM root (root/), args.json ({ branch, worktrees, mtimes,
// dirty: { file, min, worktree? }, rootName?, rootIn?, absent?, cwd?, track?, readonly?, links?, fifos?, sizes?, modes?, fsize?, args }) and
// expected.json ({ exit, facts, state?, sheet?, files? }, facts, state and sheet matched as subsets, files ({ path:
// text | null | { sha256 } }) the exact text (or sha256) of those root files after the run, null for absent; rootName names the
// root folder, root by default; rootIn puts the root in that worktree, absent removes the root folder
// before the run, cwd runs the script there,
// track commits those root files, readonly locks the root folder, links ({ path: target }, folders made) and
// fifos ([path]) make those root entries at run time, as git keeps no FIFO, sizes ({ path: bytes }) pad
// those root files with newlines to that size, modes ({ path: octal }) set their mode for the run, fsize caps the files
// the script writes at that many 512-byte blocks (ulimit -f); `{root}` in args is its path).
// commits ([{ base?, on?, delete?: [path], write?: { path: text }, mode?: { path: octal }, link?: {
// path: target }, gitlink?: [path] }], each applied in that order) are made in order in the
// repository with fixed dates, those with base on main before the scenario's branch is made, the
// others on their `on` branch (the scenario's by default); edit ({ path: [from, to] }) changes one root file
// once, `{pidns}` in to the test's pid namespace (PIDNS), after template (true) copies the plugin's templates/config.yml into the root; gitconfig ({ key: value }, `{root}` its path) sets the repository's config; replace ({ rev:
// rev }) replaces the first commit with the second and resets the checkout to it; grafts ([line])
// writes .git/info/grafts, revs read first; graph ({ rev: rev }) writes a commit-graph in which the
// first commit has the second as its second parent, the file a session could forge; `{rev:<rev>}`
// in grafts, in the root files revs names and in expected.json is that commit's full sha; stdin
// (a file of the scenario's folder, beside root/) is the script's input, patch ([[path, value]],
// the path dotted, `$drop` deleting the key, { "$x": n } a text of n `x`) edited into it first and
// pad (n) spaces added after it; a files value true asks only that the file exists; no text of the
// input of 8 characters or more may reach stdout or stderr;
// variants ([{ ..., want? }]) run the scenario once each, merged over args.json, `want` over
// expected.json.
// The test builds a throwaway repository around the root (git keeps no repository inside a
// fixture), with no global or system git config, and removes it after the run; runs the script at
// a fixed time, and checks it changed no file but the state it was asked for, replaced by a rename,
// and the files expected.json names, no git index and no git status; that a usage error prints nothing; that the state holds no `?`
// and none of its card, step or mandate text reached stdout; that no owner text of the project
// sheet, before or after the run, reached stdout or stderr; that the sheet step, waiting on its
// input, holds no sheet.json.lock and killed there leaves none; that the lock a step holds names its
// pid and its pid namespace. Run by scripts/validate.mjs. No dependencies.
import { existsSync, readFileSync, readdirSync, mkdtempSync, cpSync, writeFileSync, utimesSync, appendFileSync, rmSync, mkdirSync, statSync, lstatSync, chmodSync, symlinkSync, readlinkSync } from 'node:fs'
import { join, relative, dirname } from 'node:path'
import { tmpdir } from 'node:os'
import { execFileSync, spawnSync, spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { JOBS, pool, run } from './pool.mjs'

const root = new URL('..', import.meta.url).pathname
const fixtures = join(root, 'scripts/fixtures/now-facts')
const script = join(root, 'plugins/gtm/scripts/now-facts.mjs')
const NOW = Date.parse('2026-10-15T10:00:00Z')
const ago = (min) => new Date(NOW - min * 60000)
const errors = []
const env = { ...process.env, GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_NOSYSTEM: '1' }
// The pid namespace the script runs in, as it names it in sheet.json.lock: Linux's from /proc, the
// platform's name elsewhere.
const PIDNS = process.platform === 'linux' ? readlinkSync('/proc/self/ns/pid') : process.platform

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
  if (existsSync(dir)) walk(dir)
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
// A version-1 commit-graph (generation as topological level, no GDAT chunk), then commit c's CDAT
// record given p as its second parent: header 8 bytes, chunk table of 12-byte entries, OIDF's last
// entry the commit count, a CDAT record the tree (20), parents (4 and 4), generation and time (8).
function forge(repo, c, p) {
  git(repo, ['-c', 'commitGraph.generationVersion=1', 'commit-graph', 'write', '--reachable'])
  const f = join(repo, '.git/objects/info/commit-graph'), b = readFileSync(f)
  const chunk = (id) => { for (let i = 0; i < b[6]; i++) if (b.toString('latin1', 8 + 12 * i, 12 + 12 * i) === id) return Number(b.readBigUInt64BE(12 + 12 * i)) }
  const oidl = chunk('OIDL'), n = b.readUInt32BE(chunk('OIDF') + 255 * 4)
  const at = (sha) => { for (let i = 0; i < n; i++) if (b.toString('hex', oidl + 20 * i, oidl + 20 * i + 20) === sha) return i }
  b.writeUInt32BE(at(p), chunk('CDAT') + 36 * at(c) + 24)
  chmodSync(f, 0o644)
  writeFileSync(f, b)
}
// The scenario's input, its patch applied: the parent of each path is walked, then the key set or
// deleted.
function input(dir, a) {
  if (!a.stdin) return undefined
  const raw = readFileSync(join(dir, a.stdin))
  if (!a.patch && !a.pad) return raw
  const v = JSON.parse(raw.toString('utf8'))
  for (const [path, val] of a.patch || []) {
    const keys = path.split('.'), last = keys.pop(), o = keys.reduce((x, k) => x[k], v)
    if (val === '$drop') delete o[last]; else o[last] = val && typeof val === 'object' && '$x' in val ? 'x'.repeat(val.$x) : val
  }
  return `${JSON.stringify(v)}${' '.repeat(a.pad || 0)}`
}
const strings = (v) => (typeof v === 'string' ? [v] : v && typeof v === 'object' ? Object.values(v).flatMap(strings) : [])
// The owner texts of a project sheet, 8 characters or more; none when it is no regular file of
// JSON (a FIFO is never read).
function owner(f) {
  try { if (!lstatSync(f).isFile()) return []; const s = JSON.parse(readFileSync(f, 'utf8')); return strings([s.purpose, s.users, s.decisions, s.difficulties]).filter((x) => x.trim().length >= 8) } catch { return [] }
}

const who = ['-c', 'user.name=t', '-c', 'user.email=t@t']
// Every scenario, a variant one of its own, numbered in name order.
const scenarios = []
for (const name of readdirSync(fixtures).sort()) {
  const dir = join(fixtures, name)
  const { variants, ...args } = JSON.parse(readFileSync(join(dir, 'args.json'), 'utf8'))
  const expected = JSON.parse(readFileSync(join(dir, 'expected.json'), 'utf8'))
  if (!variants) scenarios.push([name, dir, args, expected])
  else variants.forEach(({ want = {}, ...v }, i) => scenarios.push([`${name}#${i + 1}`, dir, { ...args, ...v }, { ...expected, ...want }]))
}

// `--shard <i>/<n>` runs the scenarios whose index is i modulo n and prints one line: its own i/n,
// the indices it ran and its errors by index; the tail checks stay with the parent. Without it,
// the parent runs JOBS shards and joins their lines: a shard with no line fails with its output,
// and the indices joined must be every scenario once.
const at = process.argv.indexOf('--shard')
if (at !== -1) {
  const m = /^(\d+)\/(\d+)$/.exec(process.argv[at + 1] ?? '')
  if (!m || +m[2] < 1 || +m[1] >= +m[2] || process.argv.length !== at + 2) {
    console.error('usage: now-facts.test.mjs [--shard <i>/<n>]')
    process.exit(2)
  }
  const own = [], ran = []
  scenarios.forEach((s, i) => {
    if (i % +m[2] !== +m[1]) return
    const from = errors.length
    scenario(...s)
    ran.push(i)
    for (const e of errors.slice(from)) own.push([i, e])
  })
  console.log(JSON.stringify({ shard: `${+m[1]}/${+m[2]}`, ran, errors: own }))
  process.exit(0)
}
// The join's own check: every scenario once passes; a shard that ran short, two shards given the
// same index and a shard with no line each fail, the last with its output.
const line = (shard, ran, errs = []) => ({ code: 0, out: `${JSON.stringify({ shard, ran, errors: errs })}\n` })
for (const [shards, total, want] of [
  [[line('0/2', [0, 2], [[2, 'two']]), line('1/2', [1])], 3, 'two'],
  [[line('0/2', [0, 2], [[2, 'two']]), line('1/2', [])], 3, 'ran 2 of 3 scenarios|two'],
  [[line('0/2', [0, 2]), line('0/2', [0, 2])], 3, 'shard 1/2: ran as 0/2|ran 2 of 3 scenarios|scenarios run twice or unknown: 0, 2'],
  [[{ code: 1, out: 'boom' }], 1, 'shard 0/1: exit 1, no result line:\nboom|ran 0 of 1 scenarios'],
]) {
  const got = collect(shards, total).join('|')
  if (got !== want) errors.push(`shard join: ${JSON.stringify(got)}, want ${JSON.stringify(want)}`)
}
const shards = await pool(Array.from({ length: JOBS }, (_, i) => i), JOBS, (i) => run(fileURLToPath(import.meta.url), ['--shard', `${i}/${JOBS}`]))
errors.push(...collect(shards, scenarios.length))

// Joins the shards' result lines into one list: what went wrong with the run, then the scenarios'
// errors by index.
function collect(shards, total) {
  const out = [], byIndex = [], times = new Map()
  for (const [i, r] of shards.entries()) {
    const line = r.out.split('\n').find((l) => l.startsWith('{"shard":'))
    let got = null
    try { got = line && JSON.parse(line) } catch {}
    if (r.code !== 0 || !Array.isArray(got?.ran) || !Array.isArray(got?.errors)) { out.push(`shard ${i}/${shards.length}: exit ${r.code}, no result line:\n${r.out.trim()}`); continue }
    if (got.shard !== `${i}/${shards.length}`) out.push(`shard ${i}/${shards.length}: ran as ${got.shard}`)
    for (const k of got.ran) times.set(k, (times.get(k) ?? 0) + 1)
    byIndex.push(...got.errors)
  }
  const ran = Array.from({ length: total }, (_, k) => k).filter((k) => times.has(k)).length
  if (ran < total) out.push(`ran ${ran} of ${total} scenarios`)
  const odd = [...times].filter(([k, n]) => n > 1 || !Number.isInteger(k) || k < 0 || k >= total).map(([k]) => k)
  if (odd.length) out.push(`scenarios run twice or unknown: ${odd.join(', ')}`)
  return [...out, ...byIndex.sort((a, b) => a[0] - b[0]).map(([, e]) => e)]
}

function scenario(name, dir, a, want) {
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
    git(repo, [...who, 'commit', '-q', '-m', 'init'], date)
    const commits = a.commits || []
    for (const [i, c] of [...commits.filter((c) => c.base), null, ...commits.filter((c) => !c.base)].entries()) {
      if (c === null) { git(repo, ['checkout', '-q', '-b', a.branch || 'main']); continue }
      if (c.on) git(repo, ['checkout', '-q', c.on])
      for (const f of c.delete || []) rmSync(join(repo, f))
      for (const [f, text] of Object.entries(c.write || {})) { mkdirSync(dirname(join(repo, f)), { recursive: true }); writeFileSync(join(repo, f), text) }
      for (const [f, m] of Object.entries(c.mode || {})) chmodSync(join(repo, f), parseInt(m, 8))
      for (const [f, to] of Object.entries(c.link || {})) { mkdirSync(dirname(join(repo, f)), { recursive: true }); symlinkSync(to, join(repo, f)) }
      git(repo, ['add', '-A'])
      // A submodule entry with no checkout: an empty folder keeps the tree clean.
      for (const f of c.gitlink || []) { mkdirSync(join(repo, f), { recursive: true }); git(repo, ['update-index', '--add', '--cacheinfo', `160000,${execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repo, encoding: 'utf8', env }).trim()},${f}`]) }
      git(repo, [...who, 'commit', '-q', '--allow-empty', '-m', `c${i}`], date)
      if (c.on) git(repo, ['checkout', '-q', a.branch || 'main'])
    }
    for (const w of a.worktrees || []) git(repo, ['worktree', 'add', '-q', '-b', w.branch, join(tmp, w.name)])
    if (a.rootIn) cpSync(join(dir, 'root'), gtm, { recursive: true })
    if (a.template) cpSync(join(root, 'plugins/gtm/templates/config.yml'), join(gtm, 'config.yml'))
    for (const [f, [from, to]] of Object.entries(a.edit || {})) {
      const t = readFileSync(join(gtm, f), 'utf8')
      if (!t.includes(from)) errors.push(`${name}: edit finds no ${JSON.stringify(from)} in ${f}`)
      writeFileSync(join(gtm, f), t.replace(from, to.replaceAll('{pidns}', PIDNS)))
    }
    for (const [k, v] of Object.entries(a.gitconfig || {})) git(repo, ['config', k, v.replaceAll('{root}', gtm)])
    for (const [from, to] of Object.entries(a.replace || {})) { const sha = (r) => execFileSync('git', ['rev-parse', r], { cwd: repo, encoding: 'utf8', env }).trim(); git(repo, ['replace', sha(from), sha(to)]); git(repo, ['reset', '-q', '--hard']) }
    const rev = (s) => s.replace(/\{rev:([^}]+)\}/g, (_, r) => execFileSync('git', ['rev-parse', r], { cwd: repo, encoding: 'utf8', env }).trim())
    if (a.grafts) writeFileSync(join(repo, '.git/info/grafts'), a.grafts.map((l) => `${rev(l)}\n`).join(''))
    for (const [c, p] of Object.entries(a.graph || {})) forge(repo, rev(`{rev:${c}}`), rev(`{rev:${p}}`))
    for (const f of a.revs || []) writeFileSync(join(gtm, f), rev(readFileSync(join(gtm, f), 'utf8')))
    want = JSON.parse(rev(JSON.stringify(want)))
    if (a.track) { git(repo, ['add', '-f', ...a.track.map((f) => relative(repo, join(gtm, f)))]); git(repo, [...who, 'commit', '-q', '-m', 'track'], date) }
    if (a.dirty) { const d = join(a.dirty.worktree ? join(tmp, a.dirty.worktree) : repo, a.dirty.file); mkdirSync(dirname(d), { recursive: true }); writeFileSync(d, 'changed\n'); utimesSync(d, ago(a.dirty.min), ago(a.dirty.min)) }
    if (a.broken) writeFileSync(join(tmp, a.broken, '.git'), 'gitdir: /nonexistent\n')
    for (const p of [repo, ...(a.worktrees || []).map((w) => join(tmp, w.name))]) if (existsSync(join(p, 'README.md'))) utimesSync(join(p, 'README.md'), ago(30), ago(30))
    for (const [f, n] of Object.entries(a.sizes || {})) appendFileSync(join(gtm, f), '\n'.repeat(n - statSync(join(gtm, f)).size))
    for (const [f, min] of Object.entries(a.mtimes || {})) utimesSync(join(gtm, f), ago(min), ago(min))
    for (const [f, to] of Object.entries(a.links || {})) { mkdirSync(dirname(join(gtm, f)), { recursive: true }); symlinkSync(to, join(gtm, f)) }
    for (const f of a.fifos || []) execFileSync('mkfifo', [join(gtm, f)])
    if (a.absent) rmSync(gtm, { recursive: true })
    const stateFile = join(gtm, 'state.json'), sheetFile = join(gtm, 'sheet.json')
    const skip = [...(want.state ? ['state.json'] : []), ...(want.sheet ? ['sheet.json'] : []), ...Object.keys(want.files || {})]
    const owned = [owner(sheetFile)]
    const before = snapshot(gtm, skip), index = indexes(repo), ino = existsSync(stateFile) ? statSync(stateFile).ino : null
    const status = execFileSync('git', ['--no-optional-locks', 'status', '--porcelain'], { cwd: repo, encoding: 'utf8', env })
    const args = (a.args || []).map((x) => x.replace(/\{ago:(\d+)\}/g, (_, m) => ago(+m).toISOString()).replaceAll('{root}', gtm))
    if (a.readonly) chmodSync(gtm, 0o555)
    for (const [f, m] of Object.entries(a.modes || {})) chmodSync(join(gtm, f), parseInt(m, 8))
    const cmd = [process.execPath, script, '--root', gtm, '--now', new Date(NOW).toISOString(), ...args]
    // Node ignores SIGXFSZ, so a write past the cap fails with EFBIG.
    const run = a.fsize ? ['sh', ['-c', `ulimit -f ${+a.fsize}; exec "$0" "$@"`, ...cmd]] : [cmd[0], cmd.slice(1)]
    const stdin = input(dir, a)
    const r = spawnSync(...run, { cwd: a.cwd ? join(tmp, a.cwd) : repo, encoding: 'utf8', env: { ...env, TZ: 'UTC' }, timeout: 60000, ...(stdin === undefined ? {} : { input: stdin }) })
    if (stdin !== undefined) {
      let given = []
      try { given = strings(JSON.parse(stdin.toString('utf8'))).filter((s) => s.trim().length >= 8) } catch {}
      if (given.some((s) => r.stdout.includes(s) || r.stderr.includes(s))) errors.push(`${name}: card text reached the output`)
    }
    if (a.readonly) chmodSync(gtm, 0o755)
    for (const f of Object.keys(a.modes || {})) chmodSync(join(gtm, f), 0o755)
    owned.push(owner(sheetFile))
    if (owned.flat().some((s) => r.stdout.includes(s) || r.stderr.includes(s))) errors.push(`${name}: a sheet's owner text reached the output`)
    if (r.status !== want.exit) errors.push(`${name}: exit ${r.status}, want ${want.exit} ${r.stderr.trim()}`)
    if (want.exit === 2 && r.stdout !== '') errors.push(`${name}: a usage error printed facts`)
    if (snapshot(gtm, skip) !== before) errors.push(`${name}: the script changed a file in the root`)
    if (indexes(repo) !== index) errors.push(`${name}: the script wrote a git index`)
    if (execFileSync('git', ['--no-optional-locks', 'status', '--porcelain'], { cwd: repo, encoding: 'utf8', env }) !== status) errors.push(`${name}: the script changed git status`)
    for (const [f, t] of Object.entries(want.files || {})) {
      let got = null
      try { lstatSync(join(gtm, f)); got = readFileSync(join(gtm, f)) } catch {}
      if (t === true) { if (got === null) errors.push(`${name}: files ${f} absent`); continue }
      if (got !== null) got = t && t.sha256 ? createHash('sha256').update(got).digest('hex') : got.toString('utf8')
      if (got !== (t && t.sha256 ? t.sha256 : t)) errors.push(`${name}: files ${f} differs${t === null ? ', want absent' : ''}`)
    }
    if (want.state) {
      let st
      try { st = JSON.parse(readFileSync(stateFile, 'utf8')) } catch { errors.push(`${name}: no state written`); return }
      subset(name, st, want.state, 'state')
      if (JSON.stringify(st).includes('"?"')) errors.push(`${name}: the state holds ?`)
      if (ino !== null && statSync(stateFile).ino === ino) errors.push(`${name}: the state was rewritten in place, not replaced`)
      const own = strings([st.waiting?.question, st.waiting?.costIfWrong, st.waiting?.options, (st.steps || []).map((s) => s.title), st.mandate]).filter((s) => s.length >= 8)
      if (own.some((s) => r.stdout.includes(s))) errors.push(`${name}: card, step or mandate text reached the output`)
    }
    if (want.sheet) {
      let sh
      try { sh = JSON.parse(readFileSync(sheetFile, 'utf8')) } catch { errors.push(`${name}: no sheet written`); return }
      subset(name, sh, want.sheet, 'sheet')
    }
    if (want.facts === undefined) return
    let got
    try { got = JSON.parse(r.stdout) } catch { errors.push(`${name}: stdout is not JSON`); return }
    subset(name, got, want.facts)
    if (/rm -rf|must-fix|\$\(|ignore all|sk live|git push/.test(r.stdout)) errors.push(`${name}: message text reached the output`)
  } finally {
    if (a.readonly && existsSync(gtm)) chmodSync(gtm, 0o755)
    rmSync(tmp, { recursive: true, force: true })
  }
}

// A18: the answer step's scenario starts from the card the writer gave for the request's example.
const d1 = (f) => readFileSync(join(fixtures, f), 'utf8')
if (d1('card-d1-answer/root/reports/mandate/waiting.json') !== JSON.parse(d1('card-d1/expected.json')).files['reports/mandate/waiting.json']) errors.push('card-d1-answer: its card is not the one card-d1 writes')
// A8: today's progress and ledger lines, then the same lines with the delivery tail appended and
// an escape line in the ledger, give the same phase, task, events and ETA.
function tailed(tail) {
  const tmp = mkdtempSync(join(tmpdir(), 'gtm-now-facts-tail-'))
  try {
    const r = join(tmp, 'root')
    mkdirSync(join(r, 'reports/x'), { recursive: true })
    mkdirSync(join(r, 'plans'))
    writeFileSync(join(r, 'plans/2026-11-12-x.md'), '### Task 1\n### Task 2\n### Task 3\n')
    const run = (d, s) => `- ${d} · ${s} · run · tasks 2 · correction rounds 1, 0 · measured 61.1m 1237k 26a: spec 10.4m 129k 1a, plan 17.8m 190k 1a, tasks 13.8m 682k 21a, final 17.5m 211k 2a, fix 1.6m 25k 1a; roles ?`
    const escape = '- 2026-11-03 · b · escape · a doc sentence false after ready · found after the landing, in the docs'
    writeFileSync(join(r, 'ledger.md'), [run('2026-11-01', 'a'), run('2026-11-02', 'b'), ...(tail ? [escape] : [])].join('\n') + '\n')
    const end = tail ? ' · start 2026-11-12T09:00:00Z · end 2026-11-12T09:20:00Z · models implementer opus/low/medium, reviewer opus/medium · causes 1:reviewer/important/proof · ab on' : ''
    const lines = ['- spec · draft written · 400 s · 129k · 1 agent', '- plan · 3 tasks · 900 s · 200k · 1 agent',
      '- task 1 · CLEAN · guarded · rounds 1 · reviewer · a..b · 900 s · 300k · 4 agents · run wf_1',
      '- task 2 · OPEN · guarded · rounds 2 · reviewer · b..c · 900 s · 300k · 4 agents · run wf_2']
    writeFileSync(join(r, 'reports/x/progress.md'), lines.map((l) => l + end).join('\n') + '\n')
    const out = spawnSync(process.execPath, [script, '--root', r, '--slug', 'x', '--now', '2026-11-12T12:00:00Z'], { cwd: tmp, encoding: 'utf8', env: { ...env, TZ: 'UTC' } })
    let f = {}
    try { f = JSON.parse(out.stdout) } catch {}
    return JSON.stringify({ exit: out.status, phase: f.phase, task: f.task, events: f.events, eta: f.eta })
  } finally {
    rmSync(tmp, { recursive: true, force: true })
  }
}
const READ = JSON.stringify({ exit: 1, phase: 'delivery', task: { n: 2, of: 3 }, events: ['plan: ?', 't1: CLEAN', 't2: OPEN'],
  eta: { minutes: 32.9, clock: '12:32', runs: 2, perTask: 6.9, parts: { tasks: 13.8, final: 17.5, fix: 1.6 }, afterAnswer: false } })
for (const tail of [false, true]) if (tailed(tail) !== READ) errors.push(`A8: ${tail ? 'the tailed' : "today's"} lines read ${tailed(tail)}, want ${READ}`)
// D2: the rewrite's scenario starts from the sheet the step gave for init's fixed input.
if (d1('sheet-init-state/root/sheet.json') !== JSON.parse(d1('sheet-init/expected.json')).files['sheet.json']) errors.push('sheet-init-state: its sheet is not the one sheet-init writes')
// The step reads its input before it takes sheet.json.lock: a step waiting on an open, empty stdin
// holds no lock, and killed there it leaves none and the sheet as it was.
async function waiting() {
  const tmp = mkdtempSync(join(tmpdir(), 'gtm-now-facts-wait-'))
  try {
    const r = join(tmp, 'root'), lock = join(r, 'sheet.json.lock')
    cpSync(join(fixtures, 'sheet-lock/root'), r, { recursive: true })
    rmSync(lock)
    const before = readFileSync(join(r, 'sheet.json'), 'utf8')
    const p = spawn(process.execPath, [script, '--root', r, '--now', new Date(NOW).toISOString(), '--sheet', join(r, 'sheet.json')], { cwd: tmp, env: { ...env, TZ: 'UTC' }, stdio: ['pipe', 'ignore', 'ignore'] })
    const gone = new Promise((done) => p.on('exit', done))
    await new Promise((done) => setTimeout(done, 1000))
    const held = existsSync(lock)
    p.kill('SIGTERM')
    await gone
    if (held) errors.push('sheet step: the lock is held while the input is read')
    if (existsSync(lock)) errors.push('sheet step: a kill while reading the input left the lock')
    if (readFileSync(join(r, 'sheet.json'), 'utf8') !== before) errors.push('sheet step: a kill while reading the input changed the sheet')
  } finally {
    rmSync(tmp, { recursive: true, force: true })
  }
}
await waiting()
// The lock a step holds reads `<pid> <pid namespace>`, so a run in another namespace never takes
// the pid for gone: a preload copies it as the step renames its sheet.
function named() {
  const tmp = mkdtempSync(join(tmpdir(), 'gtm-now-facts-lock-'))
  try {
    const r = join(tmp, 'root'), seen = join(tmp, 'seen'), pre = join(tmp, 'pre.mjs')
    cpSync(join(fixtures, 'sheet-lock/root'), r, { recursive: true })
    rmSync(join(r, 'sheet.json.lock'))
    writeFileSync(pre, `import fs from 'node:fs'\nimport { syncBuiltinESMExports } from 'node:module'\nconst rename = fs.renameSync\nfs.renameSync = (a, b) => { if (b.endsWith('/sheet.json')) fs.copyFileSync(\`\${b}.lock\`, ${JSON.stringify(seen)}); return rename(a, b) }\nsyncBuiltinESMExports()\n`)
    const p = spawnSync(process.execPath, ['--import', pathToFileURL(pre).href, script, '--root', r, '--now', new Date(NOW).toISOString(), '--sheet', join(r, 'sheet.json')], { cwd: tmp, encoding: 'utf8', env: { ...env, TZ: 'UTC' }, input: readFileSync(join(fixtures, 'sheet-lock/in.json')) })
    const got = existsSync(seen) ? readFileSync(seen, 'utf8') : null
    if (p.status !== 0 || got !== `${p.pid} ${PIDNS}`) errors.push(`sheet step: its lock reads ${JSON.stringify(got)}, want "${p.pid} ${PIDNS}" (exit ${p.status})`)
  } finally {
    rmSync(tmp, { recursive: true, force: true })
  }
}
named()
if (errors.length) { console.error(errors.join('\n')); process.exit(1) }
console.log(`now-facts: ${readdirSync(fixtures).length} scenarios and the delivery tail OK`)
