#!/usr/bin/env node
// Gathers the facts of a run's one-page view (NOW.md) from the GTM root and git, and prints them
// as JSON: breadcrumb parts, task n/N, worktrees, last events, waiting kind, next step, ETA,
// staleness and last change. It reads files and runs git with argument arrays; it writes nothing
// and prints no message text: names outside SAFE and unknown shapes print `?` and exit 1.
// Usage: now-facts.mjs --root <dir> [--slug <s>] [--now <ISO>] [--waiting <kind>[,<task>]]
//        [--running <kind>,<name>,<ISO>[,<worktree>]]... No dependencies.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join, basename, resolve } from 'node:path'
import { execFileSync } from 'node:child_process'

const SAFE = /^[A-Za-z0-9._/-]+$/
const WINDOW = 5, EVENTS = 3, LABEL = 60, STOPPED = 2
// Event words: one SAFE token, or a status phrase from this closed list; any other text prints `?`.
const PHRASES = ['re-review ready', 'second re-review ready']
const PHASES = ['mockups', 'spec', 'plan', 'delivery', 'final review', 'correction', 'go', 'shipped']
const safe = (s) => (typeof s === 'string' && SAFE.test(s) ? s : '?')
const label = (s) => [...s.replace(/[\x00-\x1f\x7f-\x9f]/g, '').trim()].slice(0, LABEL).join('')
const read = (f) => (existsSync(f) ? readFileSync(f, 'utf8') : null)
const mtime = (f) => (existsSync(f) ? statSync(f).mtimeMs : null)
// Optional locks off: git status then never takes index.lock nor rewrites a tree's index.
const git = (cwd, args) => { try { return execFileSync('git', ['--no-optional-locks', ...args], { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }) } catch { return null } }
const round = (x) => Math.round(x * 10) / 10
const median = (xs) => { const s = [...xs].sort((a, b) => a - b), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2 }

const argv = process.argv.slice(2), opt = { running: [] }
for (let i = 0; i < argv.length; i += 2) {
  const k = argv[i].replace(/^--/, ''), v = argv[i + 1]
  if (k === 'running') opt.running.push(v); else opt[k] = v
}
if (!opt.root) { console.error('usage: now-facts.mjs --root <dir> [--slug <s>] [--now <ISO>]'); process.exit(2) }
const root = resolve(opt.root)
const now = opt.now ? Date.parse(opt.now) : Date.now()
const repo = (git(root, ['rev-parse', '--show-toplevel']) || '').trim() || null

// Worktrees, the main checkout first: { path, name, branch }.
const trees = (repo && git(repo, ['worktree', 'list', '--porcelain']) || '').split('\n\n').filter(Boolean).map((b) => {
  const path = (b.match(/^worktree (.+)$/m) || [])[1] || ''
  const ref = (b.match(/^branch refs\/heads\/(.+)$/m) || [])[1] || ''
  return { path, name: safe(basename(path)), branch: ref ? safe(ref) : '?' }
})

// Backlog: stories with their epic, status and slug (from the Spec cell).
const stories = []
let section = null
for (const line of (read(join(root, 'backlog.md')) || '').split('\n')) {
  const h = line.match(/^## (.+?)(?: \(P\d\))?$/)
  if (h) { section = { name: label(h[1]), epic: false }; continue }
  const c = line.split('|').slice(1, -1).map((x) => x.trim())
  if (!section || c.length < 6 || c[0] === 'Story' || /^-+$/.test(c[0])) continue
  if (c[1] === 'epic') section.epic = true
  stories.push({ section, label: label(c[0]), type: c[1], status: c[3], slug: (c[5].match(/\d{4}-\d\d-\d\d-([a-z0-9-]+)\.md$/) || [])[1] })
}
const active = stories.filter((s) => s.status === 'doing' && s.slug)
const branchOf = (slug) => (trees.find((t) => t.branch.endsWith(`/${slug}`)) || {}).branch || '?'
const slug = opt.slug ? safe(opt.slug) : (active.find((s) => branchOf(s.slug) === trees[0]?.branch) || active[0] || {}).slug || '?'

// Ledger: the last WINDOW measured run lines, struck lines out.
const ledger = read(join(root, 'ledger.md')) || ''
const runs = ledger.split('\n').filter((l) => /^- \d{4}-\d\d-\d\d · [^·]+ · run · .* · measured /.test(l)).slice(-WINDOW).map((l) => {
  const parts = {}, m = l.match(/ · measured [^:]+: ([^;]+)/)
  for (const p of (m ? m[1] : '').split(', ')) { const [k, v] = p.split(' '); parts[k] = /^\d+(\.\d+)?m$/.test(v) ? parseFloat(v) : null }
  const n = parseInt((l.match(/ · run · tasks (\d+)/) || [])[1], 10)
  if (parts.tasks != null) parts.task = n > 0 ? parts.tasks / n : null
  for (const k of ['final', 'fix']) if (!(k in parts)) parts[k] = 0
  return parts
})
const med = (k) => { const xs = runs.map((r) => r[k]).filter((x) => x != null); return xs.length ? round(median(xs)) : null }

function facts(s) {
  const progressFile = join(root, 'reports', s, 'progress.md')
  const lines = (read(progressFile) || '').split('\n').filter((l) => l.startsWith('- '))
  const plan = readdirSync(join(root, 'plans'), { withFileTypes: true }).filter((d) => d.isFile() && d.name.endsWith(`-${s}.md`)).map((d) => d.name).sort().pop()
  const of = plan ? (readFileSync(join(root, 'plans', plan), 'utf8').match(/^### Task \d+\b/gm) || []).length || '?' : null
  const status = {}, events = []
  let phase = 'spec', unknown = false
  for (const l of lines) {
    const [step, second = ''] = l.slice(2).split(' · ')
    const word = (second.split(' (')[0] || '').trim()
    const done = /^(\d+ s|\?)$/.test(word)
    if (step === 'design') phase = 'spec'
    else if (step === 'spec') phase = 'plan'
    else if (step === 'plan') phase = 'delivery'
    else if (/^t\d+$/.test(step)) { status[step] = word; phase = 'delivery' }
    else if (step === 'wave') phase = 'delivery'
    else if (step === 'final') phase = /ready$/.test(word) ? 'go' : 'correction'
    else if (step === 'fix') phase = 'final review'
    else { unknown = true; continue }
    const name = { design: 'mockups', final: 'final review', fix: 'correction' }[step] || step
    events.push(`${name}: ${done ? 'done' : SAFE.test(word) || PHRASES.includes(word) ? word : '?'}`)
  }
  const doneTasks = Object.values(status).filter((w) => /^(CLEAN|GATED)$/.test(w)).length
  if (phase === 'delivery' && typeof of === 'number' && doneTasks >= of) phase = 'final review'
  if (new RegExp(`^- \\d{4}-\\d\\d-\\d\\d · ${s} · run · shipped`, 'm').test(ledger)) phase = 'shipped'
  const task = phase !== 'delivery' ? null : typeof of === 'number' ? { n: doneTasks + 1, of } : '?'
  return { phase: unknown ? '?' : phase, task: unknown ? '?' : task, of, doneTasks, events, progressFile }
}

const mine = slug === '?' ? null : facts(slug)
const story = stories.find((x) => x.slug === slug)
const epic = story && story.section.epic ? story.section.name : null
const nextStory = story ? (stories.filter((x) => x.section === story.section).find((x) => x.status === 'todo' && x.type !== 'epic') || {}).label || null : null
const phase = mine ? mine.phase : '?'
const next = { delivery: mine?.task?.n ? `task ${mine.task.n}` : '?', 'final review': 'final review', correction: 'correction', go: 'go', shipped: null, spec: 'spec', plan: 'plan', mockups: 'mockups' }[phase] ?? '?'

// ETA: remaining tasks (the running one in full) × the per-task median, plus each later phase.
let eta
const waitingKind = opt.waiting ? opt.waiting.split(',')[0] : null
if (!runs.length) eta = { none: 'no measured run yet', clock: null }
else {
  const left = PHASES.indexOf(phase), parts = {}
  if (left >= 0 && left <= PHASES.indexOf('plan')) for (const k of ['spec', 'plan'].slice(Math.max(0, left - 1))) parts[k] = med(k)
  if (left >= 0 && left <= PHASES.indexOf('delivery')) parts.tasks = typeof mine.of === 'number' ? round((mine.of - mine.doneTasks) * med('task')) : null
  if (left >= 0 && left <= PHASES.indexOf('final review')) parts.final = med('final')
  if (left >= 0 && left <= PHASES.indexOf('correction')) parts.fix = med('fix')
  const vals = Object.values(parts)
  const minutes = left < 0 || vals.some((v) => v == null) ? '?' : round(vals.reduce((a, b) => a + b, 0))
  const at = new Date(now + (typeof minutes === 'number' ? minutes : 0) * 60000)
  const clock = waitingKind || minutes === '?' ? null : `${String(at.getHours()).padStart(2, '0')}:${String(at.getMinutes()).padStart(2, '0')}`
  eta = { minutes, clock, runs: runs.length, perTask: med('task'), parts, afterAnswer: !!waitingKind }
}

// Running items, with liveness: past STOPPED × their phase median, the tree's last change.
const lastChange = (tree) => {
  if (!tree) return null
  let t = parseInt(git(tree.path, ['log', '-1', '--format=%ct']) || '0', 10) * 1000
  const st = git(tree.path, ['status', '--porcelain', '-z', '--untracked-files=normal']) || ''
  for (const e of st.split('\0').filter(Boolean)) { const m = mtime(join(tree.path, e.slice(3))); if (m > t) t = m }
  return t ? Math.round((now - t) / 60000) : null
}
const running = opt.running.map((r) => {
  const [kind, name, since, wt] = r.split(',')
  const at = Date.parse(since)
  if (!/^(task|final|fix|dispatch|workflow)$/.test(kind || '') || Number.isNaN(at)) return '?'
  const ageMin = Math.round((now - at) / 60000)
  const m = { task: med('task'), final: med('final'), fix: med('fix') }[kind]
  const tree = wt ? trees.find((t) => t.name === wt) : trees[0]
  return { kind, name: safe(name), since: new Date(at).toISOString(), ageMin, lastChangeMin: lastChange(tree), mayHaveStopped: m != null && ageMin > STOPPED * m }
})

// Staleness of the NOW.md on disk.
const nowFile = join(root, 'NOW.md'), nowText = read(nowFile), stale = []
if (nowText === null) stale.push('missing')
else {
  const t = mtime(nowFile)
  for (const f of [mine?.progressFile, join(root, 'ledger.md'), join(root, 'backlog.md')]) if (f && mtime(f) > t) stale.push(`older than ${basename(f)}`)
  const crumb = (nowText.split('\n').find((l) => l.startsWith('>')) || '').slice(1).split(' › ').map((x) => x.trim())
  const b = crumb.find((x) => /^[a-z]+\/[a-z0-9-]+$/.test(x))
  if (b && !trees.some((x) => x.branch === b)) stale.push(`branch gone: ${safe(b)}`)
  for (const m of nowText.matchAll(/^- worktree (\S+)/gm)) if (!trees.some((x) => x.name === m[1])) stale.push(`worktree gone: ${safe(m[1])}`)
}

const others = active.filter((x) => x.slug !== slug && (existsSync(join(root, 'reports', x.slug, 'progress.md')) || branchOf(x.slug) !== '?')).map((x) => {
  const f = facts(x.slug)
  return { slug: safe(x.slug), branch: branchOf(x.slug), phase: f.phase, task: f.task, updated: mtime(f.progressFile) ? new Date(mtime(f.progressFile)).toISOString() : null }
})

const out = {
  updated: new Date(now).toISOString(), slug, branch: slug === '?' ? '?' : branchOf(slug), epic, phase, task: mine ? mine.task : '?',
  next, nextStory, eta, running, waiting: waitingKind ? { kind: safe(waitingKind), task: safe(opt.waiting.split(',')[1] || '') } : null,
  worktrees: trees.slice(1).map(({ name, branch }) => ({ name, branch })), events: mine ? mine.events.slice(-EVENTS) : [], stale, others,
}
if (out.waiting && out.waiting.task === '?' && !opt.waiting.includes(',')) out.waiting.task = null
const hasUnknown = (v) => v === '?' || (typeof v === 'string' && v.endsWith(': ?')) || (v && typeof v === 'object' && Object.values(v).some(hasUnknown))
console.log(JSON.stringify(out, null, 2))
process.exit(hasUnknown(out) ? 1 : 0)
