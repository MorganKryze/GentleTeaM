#!/usr/bin/env node
// Gathers the facts of a run's one-page view (NOW.md) from the GTM root and git, and prints them as
// JSON: breadcrumb parts, task n/N, worktrees, last events, waiting kind, next step, ETA, staleness
// and last change; a pause's phase, handoff and resume command, uncommitted or ignored entries per
// worktree, and with --since the slug's root files changed since a time. Ship's `ci` line (one per
// CI red, templates/runner.md) moves the phase to go, its event the action; read strictly. It reads files and runs
// git with argument arrays; it prints no message text: names outside SAFE and unknown shapes print
// `?` and exit 1. It writes nothing but, with --state, <root>/state.json (the same facts for a
// program (v 1, `null` for each unknown) with the plan's steps, the open card from
// reports/<slug>/waiting.json while it passes the decision.v1 check, is of the --waiting kind and is
// not answered, the branch's place in an approved milestone and its backlog story,
// the mandate's `done when` and `stops for` and the count of the slug's default rulings in the
// ledger; that text is stripped and cut there and never printed), and, with --mandate <slug>
// --copy <file>, the mandate file and its ledger record. It refuses with exit 3 in a linked
// worktree, over a tracked file or over a file that is not a JSON object with an integer `v`.
// With --mandate <slug> it prints only whether that slug's mandate is valid, its source, why not
// and its budget: reports/<slug>/mandate.md when it exists, valid or not, else the plan's
// `## Mandate` section; valid with `- done when: <text>` and `- decides alone: reversible`, each
// key at most once, a budget `<n> min, <n>k tokens`; other lines ignored; no mandate text printed.
// The file counts only with its fingerprint: the slug's last `ruling · mandate: sha256 <hex>`
// ledger line holds the sha256 of its raw bytes, else `fingerprint`. --copy writes both: the given
// file byte for byte by a rename, then that record appended; exit 3 when it cannot write them.
// With --landing <slug> [--proofs <names>] it is the standing go check of /gtm:ship: with
// `git.push: standing` in config.yml and a valid `- standing go:` line in team.md's Gates, a clean
// tree whose changes since the merge base of `git.base` are all in that line's class, and every
// proof the class requires held (`--proofs`: those ship ran green, `gate` and `footprint`), it
// writes reports/<slug>/landing.json {class, head, proofs} by a rename; else it deletes that file.
// It prints {landing, class, head, why, file, proof}, a path only when SAFE; any error in the check
// refuses and deletes; exit 3 in a linked worktree or over a tracked file, a link or a non-file.
// `git.base` counts only as a branch, refs/heads/<base>, and the checkout's branch only when it
// ends in /<slug>. The state's `landing` is that file while its shape is exact and the same check,
// run again, gives the same landing.
// With --card <slug> it is the card writer: the card's content on stdin (at most 64 KiB of UTF-8
// JSON), checked whole against decision.v1 (an allowlist: every key required, nothing else, each
// text, length, number and list checked); it writes reports/<slug>/waiting.json by a rename with
// `v`, `slug`, `asked`, `other.allowed` and `answer` set, or refuses, deleting that file. With
// --answer <slug> it records the owner's answer ({option, other} on stdin) in that card, or
// changes nothing. Both print one line {written, field, why}: a refused field's path, built from
// the shape's own keys, and a reason from a closed list; never a card's text. Exit 1 refused; 3
// nothing written in a linked worktree or over a tracked file, a link or a non-file.
// The project sheet <root>/sheet.json (sheet.v1), only while config.yml's `project.sheet` reads
// `on`: --state then rewrites it by a rename, its fact fields (kind, plan, cost) recomputed and the
// owner fields of a sheet that passes the check kept; a sheet that fails it is left as it is, exit
// 3. With --sheet <root>/sheet.json it is the step: owner fields on stdin (as --card takes a card),
// checked whole against sheet.v1, an allowlist built from decision.v1's pieces, each given field
// replaced, or one line {written, field, why} and nothing written.
// Usage: now-facts.mjs --root <dir> [--slug <s>] [--now <ISO>] [--waiting <kind>[,<task>]]
//        [--running <kind>,<name>,<ISO>[,<worktree>]]... [--since <ISO>]
//        [--state <root>/state.json] [--mandate <slug> [--copy <file>]]
//        [--landing <slug> [--proofs <names>]] [--card <slug> | --answer <slug>]
//        [--sheet <root>/sheet.json] No dependencies.
import { readFileSync, readSync, readdirSync, readlinkSync, statSync, lstatSync, fstatSync, existsSync, realpathSync, writeFileSync, appendFileSync, renameSync, unlinkSync, linkSync, openSync, closeSync, mkdirSync, constants } from 'node:fs'
import { join, basename, resolve, relative } from 'node:path'
import { execFileSync } from 'node:child_process'
import { isatty } from 'node:tty'
import { createHash } from 'node:crypto'

const SAFE = /^[A-Za-z0-9._/-]+$/
const WINDOW = 5, EVENTS = 3, LABEL = 60, LONG = 200, OPTIONS = 9, STOPPED = 2
// Event words: one SAFE token, or a status phrase from this closed list; any other text prints `?`.
const PHRASES = ['re-review ready', 'second re-review ready']
const PHASES = ['mockups', 'spec', 'plan', 'delivery', 'final review', 'correction', 'go', 'shipped']
// A `ci` line's class, verdict and action: closed lists (templates/runner.md); any other is unknown.
const CI = { class: ['os', 'config', 'resources', 'timing', 'infra'], verdict: ['local', 'reproduced', 'flaky', 'not reproduced', 'not reproduced (gap)', 'not reproduced (cap)', 'none'],
  action: ['round', 'quarantine', 'rerun', 'hand', 'wait', 'config'] }
const safe = (s) => (typeof s === 'string' && SAFE.test(s) ? s : '?')
const label = (s, n = LABEL) => [...s.replace(/[\x00-\x1f\x7f-\x9f\p{Cf}\u2028\u2029]/gu, '').trim()].slice(0, n).join('')
const read = (f) => (existsSync(f) ? readFileSync(f, 'utf8') : null)
const mtime = (f) => (existsSync(f) ? statSync(f).mtimeMs : null)
// Optional locks off: git status then never takes index.lock nor rewrites a tree's index. Replace
// refs, grafts and the commit-graph off, so none rewrites a commit or its parents. A commit object
// rewritten under its own name still can: the merger's diff, in a clone fetched over a transport,
// is the bound.
const git = (cwd, args) => { try { return execFileSync('git', ['--no-optional-locks', '--no-replace-objects', '-c', 'core.commitGraph=false', ...args], { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], env: { ...process.env, GIT_GRAFT_FILE: '/dev/null' } }) } catch { return null } }
const round = (x) => Math.round(x * 10) / 10
const median = (xs) => { const s = [...xs].sort((a, b) => a - b), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2 }

// Usage errors exit 2: an unknown flag, a flag without its value, no --root, a --now or --since
// that is not a date-time.
const FLAGS = ['root', 'slug', 'now', 'waiting', 'running', 'since', 'state', 'mandate', 'copy', 'landing', 'proofs', 'card', 'answer', 'sheet']
const usage = () => { console.error('usage: now-facts.mjs --root <dir> [--slug <s>] [--now <ISO>] [--waiting <kind>[,<task>]] [--running <kind>,<name>,<ISO>[,<worktree>]]... [--since <ISO>] [--state <root>/state.json] [--mandate <slug> [--copy <file>]] [--landing <slug> [--proofs <names>]] [--card <slug> | --answer <slug>] [--sheet <root>/sheet.json]'); process.exit(2) }
const argv = process.argv.slice(2), opt = { running: [] }
for (let i = 0; i < argv.length; i += 2) {
  const k = argv[i].slice(2), v = argv[i + 1]
  if (!argv[i].startsWith('--') || !FLAGS.includes(k) || v === undefined || v.startsWith('--')) usage()
  if (k === 'running') opt.running.push(v); else opt[k] = v
}
if (!opt.root) usage()
if (opt.copy !== undefined && (opt.mandate === undefined || opt.state !== undefined)) { console.error('now-facts.mjs: --copy takes --mandate and no --state'); process.exit(2) }
if (opt.slug !== undefined && !/^[a-z0-9-]+$/.test(opt.slug)) { console.error('now-facts.mjs: --slug takes [a-z0-9-] only'); process.exit(2) }
if (opt.mandate !== undefined && !/^[a-z0-9-]+$/.test(opt.mandate)) { console.error('now-facts.mjs: --mandate takes [a-z0-9-] only'); process.exit(2) }
// Who holds each proof (A10): the check, ship (passed in by name) or the merging program, for
// which a landing says `due`. Each class: the proofs it requires, in order, and the files it takes.
const HOLDS = { paths: 'check', clean: 'check', gate: 'ship', footprint: 'ship', ci: 'merger' }
// The docs class is an allowlist (A7): a regular file added or modified under the top-level
// `docs/`, ending in `.md`, every segment ASCII `[A-Za-z0-9._-]` and none starting with `.`.
const DOCS = /^docs\/(?:[A-Za-z0-9_-][A-Za-z0-9._-]*\/)*[A-Za-z0-9_-][A-Za-z0-9._-]*\.md$/
const CLASSES = { docs: { proofs: ['gate', 'ci'], takes: (f) => /^[AM]$/.test(f.status) && f.mode === '100644' && f.tree === '100644' && DOCS.test(f.path) } }
const passed = opt.proofs === undefined ? [] : opt.proofs.split(',')
if (opt.landing !== undefined && (!/^[a-z0-9-]+$/.test(opt.landing) || opt.state !== undefined || opt.mandate !== undefined)) { console.error('now-facts.mjs: --landing takes [a-z0-9-] only, and no --state or --mandate'); process.exit(2) }
if (opt.proofs !== undefined && (opt.landing === undefined || passed.some((p, i) => HOLDS[p] !== 'ship' || passed.indexOf(p) !== i))) { console.error('now-facts.mjs: --proofs takes --landing and the proofs ship holds, each once'); process.exit(2) }
const cardSlug = opt.card ?? opt.answer
if (cardSlug !== undefined && (!/^[a-z0-9-]+$/.test(cardSlug) || (opt.card !== undefined && opt.answer !== undefined) || opt.state !== undefined || opt.mandate !== undefined || opt.landing !== undefined)) { console.error('now-facts.mjs: --card or --answer takes [a-z0-9-] only, alone, and no --state, --mandate or --landing'); process.exit(2) }
const root = resolve(opt.root)
if (opt.state !== undefined && resolve(opt.state) !== join(root, 'state.json')) { console.error('now-facts.mjs: --state takes <root>/state.json only'); process.exit(2) }
if (opt.sheet !== undefined && (resolve(opt.sheet) !== join(root, 'sheet.json') || opt.state !== undefined || opt.mandate !== undefined || opt.landing !== undefined || cardSlug !== undefined)) { console.error('now-facts.mjs: --sheet takes <root>/sheet.json only, and no --state, --mandate, --landing, --card or --answer'); process.exit(2) }
const now = opt.now === undefined ? Date.now() : Date.parse(opt.now)
if (Number.isNaN(now)) { console.error('now-facts.mjs: --now takes an ISO date-time'); process.exit(2) }
const repo = (git(root, ['rev-parse', '--show-toplevel']) || '').trim() || null
const since = opt.since === undefined ? null : Date.parse(opt.since)
if (Number.isNaN(since)) { console.error('now-facts.mjs: --since takes an ISO date-time'); process.exit(2) }
// The root as the human types it in a command: relative to the repository top when inside it.
const real = existsSync(root) ? realpathSync(root) : root
const rel = repo && !relative(repo, real).startsWith('..') ? relative(repo, real) || '.' : root
// What a pause resumes, per the phase it stopped in.
const RESUME = { mockups: () => '/gtm:design', spec: (s) => `/gtm:spec ${s}`, plan: (s, f) => f.spec && `/gtm:plan ${rel}/specs/${f.spec}`,
  delivery: (s, f) => f.plan && `/gtm:deliver ${rel}/plans/${f.plan}`, go: () => '/gtm:ship' }
for (const k of ['final review', 'correction']) RESUME[k] = RESUME.delivery

// Worktrees, the main checkout first: { path, name, branch }.
const trees = (repo && git(repo, ['worktree', 'list', '--porcelain']) || '').split('\n\n').filter(Boolean).map((b) => {
  const path = (b.match(/^worktree (.+)$/m) || [])[1] || ''
  const ref = (b.match(/^branch refs\/heads\/(.+)$/m) || [])[1] || ''
  // What a removal would lose, ignored files included (a GTM root in a worktree); `?` if git fails.
  const st = path ? git(path, ['status', '--porcelain', '-z', '--ignored', '--untracked-files=normal']) : null
  const changes = st === null ? '?' : st.split('\0').filter((e) => /^.. /.test(e)).length
  return { path, name: safe(basename(path)), branch: ref ? safe(ref) : '?', changes }
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

// A spec or plan is slug s's when its whole name is `<date>-<s>.md`, or with part `<date>-<s>-<part>.md`
// for a part a skill writes (gtm/SKILL.md, Milestone); any other suffix may be another story's.
const PARTS = ['milestone']
const named = (n, s, part) => new RegExp(`^\\d{4}-\\d\\d-\\d\\d-${s}${part ? `(-(${PARTS.join('|')}))?` : ''}\\.md$`).test(n)

function facts(s) {
  const progressFile = join(root, 'reports', s, 'progress.md')
  const lines = (read(progressFile) || '').split('\n').filter((l) => l.startsWith('- '))
  const latest = (dir) => (existsSync(join(root, dir)) ? readdirSync(join(root, dir), { withFileTypes: true }).filter((d) => d.isFile() && named(d.name, s)).map((d) => d.name).sort().pop() : undefined)
  const plan = latest('plans'), spec = latest('specs')
  const of = plan ? (readFileSync(join(root, 'plans', plan), 'utf8').match(/^### Task \d+\b/gm) || []).length || '?' : null
  const status = {}, events = []
  let phase = 'spec', unknown = false, paused = null, round = false
  // Two shapes orchestrators write, read strictly: `- task <n> · ` is task n's line, and
  // `- wave <ids> merged · ` (`T1-T4`, `T2,T3,T5`) a wave line; any near shape stays unknown.
  for (const l of lines.map((x) => x.replace(/^- task (\d+) · /, (_, n) => `- t${+n} · `).replace(/^- wave T\d+(?:[-,]T\d+)* merged · /, '- wave · '))) {
    const [step, second = ''] = l.slice(2).split(' · ')
    const word = (second.split(' (')[0] || '').trim()
    const done = /^(\d+ s|\?)$/.test(word)
    // `- paused · <phase>` starts a pause; any later line ends it. A PAUSED line moves no phase.
    if (step === 'paused') { paused = PHASES.slice(0, -1).includes(second.trim()) ? second.trim() : '?'; events.push('paused'); continue }
    paused = null
    // `- ci · <check> · <class> · <verdict> · <action> · …`: the check SAFE, the rest from CI's lists.
    // A CI round's own `fix` lines follow it and keep the phase at go.
    if (step === 'ci') {
      const [, check, cls, verdict, action] = l.slice(2).split(' · ')
      if (!SAFE.test(check || '') || !CI.class.includes(cls) || !CI.verdict.includes(verdict) || !CI.action.includes(action)) { unknown = true; continue }
      phase = 'go'; round = true; events.push(`ci: ${action}`); continue
    }
    if (step !== 'fix') round = false
    if (word === 'PAUSED') { if (/^t\d+$/.test(step)) status[step] = word }
    else if (step === 'design') phase = 'spec'
    else if (step === 'spec') phase = 'plan'
    else if (step === 'plan') phase = 'delivery'
    else if (/^t\d+$/.test(step)) { status[step] = word; phase = 'delivery' }
    else if (step === 'wave') phase = 'delivery'
    else if (step === 'final') phase = /ready$/.test(word) ? 'go' : 'correction'
    else if (step === 'fix') { if (!round) phase = 'final review' }
    else { unknown = true; continue }
    const name = { design: 'mockups', final: 'final review', fix: 'correction' }[step] || step
    events.push(`${name}: ${done ? 'done' : SAFE.test(word) || PHRASES.includes(word) ? word : '?'}`)
  }
  const doneTasks = Object.values(status).filter((w) => /^(CLEAN|GATED)$/.test(w)).length
  if (phase === 'delivery' && typeof of === 'number' && doneTasks >= of) phase = 'final review'
  if (new RegExp(`^- \\d{4}-\\d\\d-\\d\\d · ${s} · run · shipped`, 'm').test(ledger)) phase = 'shipped'
  const task = phase !== 'delivery' ? null : typeof of === 'number' ? { n: doneTasks + 1, of } : '?'
  const cmd = paused && RESUME[paused] ? RESUME[paused](s, { plan, spec }) : null
  const command = typeof cmd === 'string' && /^\/gtm:[a-z]+( [A-Za-z0-9._/-]+)?$/.test(cmd) ? cmd : '?'
  const handoff = existsSync(join(root, 'reports', s, 'handoff.md')) ? `reports/${s}/handoff.md` : '?'
  if (paused !== null) return { phase: unknown ? '?' : 'paused', resumes: unknown ? '?' : paused, resume: command, handoff, task: unknown || paused === '?' ? '?' : paused !== 'delivery' ? null : task, of, doneTasks, events, progressFile, plan, status }
  return { phase: unknown ? '?' : phase, task: unknown ? '?' : task, of, doneTasks, events, progressFile, plan, status }
}

const mine = slug === '?' ? null : facts(slug)
const story = stories.find((x) => x.slug === slug)
const epic = story && story.section.epic ? story.section.name : null
const nextStory = story ? (stories.filter((x) => x.section === story.section).find((x) => x.status === 'todo' && x.type !== 'epic') || {}).label || null : null
const phase = mine ? mine.phase : '?'
const next = { paused: 'resume', delivery: mine?.task?.n ? `task ${mine.task.n}` : '?', 'final review': 'final review', correction: 'correction', go: 'go', shipped: null, spec: 'spec', plan: 'plan', mockups: 'mockups' }[phase] ?? '?'

// ETA: remaining tasks (the running one in full) × the per-task median, plus each later phase.
let eta
const waitingKind = opt.waiting ? opt.waiting.split(',')[0] : null
if (!runs.length) eta = { none: 'no measured run yet', clock: null }
else {
  const left = PHASES.indexOf(phase === 'paused' ? mine.resumes : phase), parts = {}
  if (left >= 0 && left <= PHASES.indexOf('plan')) for (const k of ['spec', 'plan'].slice(Math.max(0, left - 1))) parts[k] = med(k)
  if (left >= 0 && left <= PHASES.indexOf('delivery')) parts.tasks = typeof mine.of === 'number' ? round((mine.of - mine.doneTasks) * med('task')) : null
  if (left >= 0 && left <= PHASES.indexOf('final review')) parts.final = med('final')
  if (left >= 0 && left <= PHASES.indexOf('correction')) parts.fix = med('fix')
  const vals = Object.values(parts)
  const minutes = left < 0 || vals.some((v) => v == null) ? '?' : round(vals.reduce((a, b) => a + b, 0))
  const at = new Date(now + (typeof minutes === 'number' ? minutes : 0) * 60000)
  const clock = waitingKind || phase === 'paused' || minutes === '?' ? null : `${String(at.getHours()).padStart(2, '0')}:${String(at.getMinutes()).padStart(2, '0')}`
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
  ...(phase === 'paused' ? { resumes: mine.resumes, resume: mine.resume, handoff: mine.handoff } : {}),
  worktrees: trees.slice(1).map(({ name, branch, changes }) => ({ name, branch, changes })), events: mine ? mine.events.slice(-EVENTS) : [], stale, others,
}
// With --since: this slug's specs and plans and this run's reports changed at or after that time,
// progress and handoff aside (a pause renames or lists them; a resume never reads them). A spec or
// plan is the slug's when `named` takes it, part allowed, and no longer backlog slug claims it;
// another story's files never reach the list. A spec or plan whose phase is over (the phase, or the
// one a pause resumes, comes after it) is approved and never listed; an unknown phase lists none.
const stage = PHASES.indexOf(phase === 'paused' ? mine.resumes : phase)
const open = { specs: stage >= 0 && stage <= PHASES.indexOf('spec'), plans: stage >= 0 && stage <= PHASES.indexOf('plan') }
const longer = stories.filter((x) => x.slug && x.slug.startsWith(`${slug}-`))
const ours = (n) => named(n, slug, true) && !longer.some((x) => named(n, x.slug, true))
if (since !== null) {
  const dirs = slug === '?' ? [] : ['specs', 'plans', `reports/${slug}`]
  out.changed = dirs.flatMap((d) => (existsSync(join(root, d)) ? readdirSync(join(root, d), { withFileTypes: true }).filter((e) => e.isFile() && (d.startsWith('reports/') || (open[d] && ours(e.name)))).map((e) => `${d}/${e.name}`) : []))
    .filter((f) => !/\/(progress|handoff)\.md$/.test(f) && mtime(join(root, f)) >= since).map(safe).sort()
}
if (out.waiting && out.waiting.task === '?' && !opt.waiting.includes(',')) out.waiting.task = null
const hasUnknown = (v) => v === '?' || (typeof v === 'string' && v.endsWith(': ?')) || (v && typeof v === 'object' && Object.values(v).some(hasUnknown))

// The state: the facts above for a program, every `?` a `null`, plus what the run view leaves to
// the page: the plan's steps, the open card, the branch's place in a milestone and its story.
const nul = (v) => (v === '?' ? null : Array.isArray(v) ? v.map(nul) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, nul(x)])) : v)
const text = (s, n) => (typeof s === 'string' && label(s, n)) || null
// A regular file of at most 1 MiB, or null: a link, a folder or a FIFO is never read.
const bytes = (f) => { try { const st = lstatSync(f); return st.isFile() && st.size <= 1 << 20 ? readFileSync(f) : null } catch { return null } }
const small = (f) => { const b = bytes(f); return b === null ? null : b.toString('utf8') }
const sha = (buf) => createHash('sha256').update(buf).digest('hex')
// The run's date, YYYY-MM-DD in local time.
const today = () => { const d = new Date(now); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` }
// What a path is, not followed: 'file', 'dir', 'other' (a link, a FIFO) or null when absent.
const kind = (f) => { try { const st = lstatSync(f); return st.isFile() ? 'file' : st.isDirectory() ? 'dir' : 'other' } catch { return null } }
// The record --copy appends: the sha256 of the mandate file's raw bytes, the slug's last one wins.
const RECORD = /^- \d{4}-\d\d-\d\d · ([a-z0-9-]+) · ruling · mandate: sha256 ([0-9a-f]{64})$/
const recorded = (s, t) => { let h = null; for (const l of t.split('\n')) { const m = l.match(RECORD); if (m && m[1] === s) h = m[2] } return h }
// Steps: done (CLEAN, GATED), blocked (BLOCKED, OPEN), in delivery the first other one doing (a
// running task has no progress line yet), the rest todo; a PAUSED task is todo while paused.
function steps() {
  if (!mine) return null
  if (!mine.plan) return []
  const heads = [...readFileSync(join(root, 'plans', mine.plan), 'utf8').matchAll(/^### Task (\d+)\b:?(.*)$/gm)]
  if (!heads.length) return null
  let started = phase !== 'delivery'
  return heads.map(([, n, title]) => {
    const w = mine.status[`t${+n}`]
    let status = /^(CLEAN|GATED)$/.test(w) ? 'done' : /^(BLOCKED|OPEN)$/.test(w) ? 'blocked' : 'todo'
    if (status === 'todo' && !started) { status = 'doing'; started = true }
    return { n: +n, title: text(title.replace(/\s*\[P\]\s*$/, ''), LABEL), status }
  })
}
// The card in reports/<slug>/waiting.json (A14, A15): shown only while it passes the writer's own
// check, is of the --waiting kind and is not answered; any other file keeps the kind and task alone.
function card() {
  const { kind, task } = out.waiting
  const none = { kind: nul(kind), task: nul(task), question: null, options: null, costIfWrong: null, card: null }
  let c = null
  try { c = slug === '?' ? null : decision(JSON.parse(small(join(root, 'reports', slug, 'waiting.json'))), slug, true) } catch { return none }
  if (!c || c.kind !== kind || c.answer !== null) return none
  const r = c.recommendation
  return { ...none, question: text(c.question, LONG), options: c.options.map((o) => ({ label: text(o.label, LABEL), recommended: r !== null && o.key === r.option })),
    costIfWrong: r === null ? null : text(r.costIfWrong, LONG), card: `reports/${slug}/waiting.json` }
}
// The latest approved milestone (by file name) with a `## <n>. `<branch>`: <title>` heading for
// this branch: its text, those headings and this branch's, or null.
function approved() {
  const dir = join(root, 'specs')
  if (out.branch === '?' || !existsSync(dir)) return null
  for (const f of readdirSync(dir).filter((x) => x.endsWith('-milestone.md')).sort().reverse()) {
    const t = small(join(dir, f)) || ''
    if (!/^>.*\bStatus: approved\b/m.test(t)) continue
    const heads = [...t.matchAll(/^## (\d+)\. `([^`]+)`: (.+)$/gm)], h = heads.find((m) => m[2] === out.branch)
    if (h) return { t, heads, h }
  }
  return null
}
// The state's milestone: { n, of: its number of such headings, title }.
const milestone = () => { const m = approved(); return m && { n: +m.h[1], of: m.heads.length, title: text(m.h[3], LABEL) } }
// Text t with the lines of its fenced code blocks blanked, so an example is never read as the
// thing; a fence closes on a run of its character at least as long, alone on its line.
function unfenced(t) {
  if (t === null) return null
  let open = null
  return t.split('\n').map((l) => {
    const f = l.match(/^ {0,3}(`{3,}|~{3,})(.*)$/)
    if (open) { if (f && f[1][0] === open[0] && f[1].length >= open.length && !f[2].trim()) open = null; return '' }
    if (f && !(f[1][0] === '`' && f[2].includes('`'))) { open = f[1]; return '' }
    return l
  }).join('\n')
}
// The mandate of slug s (deliver §1): its file when one exists, valid or not, else the plan's
// section; only the four keys are read, each once, and an invalid mandate is no mandate. A file
// counts only when the ledger text records its fingerprint, checked on its raw bytes first.
function mandate(s, ledgerText = ledger) {
  const no = (source, why) => ({ valid: false, source, why, done: null, stops: null, budget: null })
  const file = join(root, 'reports', s, 'mandate.md')
  let source = 'file', body
  try {
    lstatSync(file)
    const buf = bytes(file)
    if (buf !== null && recorded(s, ledgerText) !== sha(buf)) return no(source, 'fingerprint')
    body = buf === null ? null : buf.toString('utf8').replace(/^\uFEFF/, '')
  } catch { source = null }
  if (source === null) {
    const plan = facts(s).plan, t = plan ? unfenced(small(join(root, 'plans', plan))) : null
    const m = t && t.match(/^## Mandate[ \t]*\n([\s\S]*?)(?=^#{1,6} |(?![\s\S]))/m)
    if (!m) return no(null, 'none')
    if (!/^> Source: \S/m.test(m[1])) return no('plan', 'source')
    source = 'plan'; body = m[1]
  }
  if (body === null) return no(source, 'unreadable')
  const got = {}
  for (const l of body.split('\n')) {
    const m = l.match(/^- (done when|decides alone|stops for|budget): ([^\n]*)$/)
    if (!m) continue
    if (m[1] in got) return no(source, 'twice')
    got[m[1]] = m[2]
  }
  const done = text(got['done when'], LONG)
  if (!done) return no(source, 'done when')
  if (got['decides alone']?.trim() !== 'reversible') return no(source, 'decides alone')
  const b = got.budget === undefined ? null : got.budget.trim().match(/^(\d+) min, (\d+)k tokens$/)
  if (got.budget !== undefined && !b) return no(source, 'budget')
  return { valid: true, source, why: null, done, stops: text(got['stops for'], LONG), budget: b ? { minutes: +b[1], k: +b[2] } : null }
}
// Default rulings: `- <YYYY-MM-DD> · <slug> · ruling · default: ` lines of this slug exactly.
const DEFAULT = /^- \d{4}-\d\d-\d\d · ([a-z0-9-]+) · ruling · default: /
const defaults = (s) => ledger.split('\n').filter((l) => (l.match(DEFAULT) || [])[1] === s).length
const state = () => ({
  v: 1, updated: out.updated, slug: nul(out.slug), branch: nul(out.branch), epic: out.epic || null, phase: nul(out.phase), steps: steps(), task: nul(out.task),
  eta: runs.length ? { clock: out.eta.clock, minutes: nul(out.eta.minutes), measured: runs.length } : { clock: null, minutes: null, measured: 0 },
  running: nul(out.running), others: nul(out.others), waiting: out.waiting ? card() : null, milestone: milestone(), story: (story && story.label) || null,
  mandate: mine ? (({ valid, done, stops }) => (valid ? { done, stops } : null))(mandate(slug)) : null, defaults: mine ? defaults(slug) : 0, landing: mine ? landed(slug) : null,
})
// Written only in the main checkout, never over a tracked file or one that is not a state; the old
// file is replaced by a rename, so a reader sees one whole file, and no temporary file stays.
const linked = (dir) => { const d = git(dir, ['rev-parse', '--path-format=absolute', '--git-dir']), c = git(dir, ['rev-parse', '--path-format=absolute', '--git-common-dir']); return d !== null && c !== null && d !== c }
function write(file) {
  const no = (why) => { console.error(`now-facts.mjs: state not written: ${why}`); return 3 }
  if (linked(root) || linked(process.cwd())) return no('a linked worktree')
  if (git(root, ['ls-files', '--error-unmatch', '--', 'state.json']) !== null) return no('tracked by git')
  let there = true
  try { lstatSync(file) } catch { there = false }
  if (there) {
    let old = null
    try { old = JSON.parse(small(file)) } catch {}
    if (!old || typeof old !== 'object' || Array.isArray(old) || !Number.isInteger(old.v)) return no('not a state file')
  }
  const tmp = `${file}.${process.pid}.tmp`
  // Made from the exclusive open on, so a write that fails after it (a full disk) is removed too.
  let fd = null, made = false
  try {
    fd = openSync(tmp, 'wx'); made = true
    writeFileSync(fd, `${JSON.stringify(state(), null, 2)}\n`); closeSync(fd); fd = null
    renameSync(tmp, file); return null
  } catch {
    if (fd !== null) try { closeSync(fd) } catch {}
    if (made) try { unlinkSync(tmp) } catch {}
    return no('the write failed')
  }
}
// --copy: the given file read once (a regular file of at most 1 MiB, else `unreadable`, nothing
// written); the ledger, which must exist, opened for append first, so a ledger that cannot take the
// record leaves the old file in place; the mandate file replaced by a rename, never through a link or
// over a non-file; then the record appended; then the check against the ledger as written.
function copy(s, from) {
  const no = (why) => { console.error(`now-facts.mjs: mandate not copied: ${why}`); return 3 }
  let buf = null, fd = null
  try {
    fd = openSync(from, constants.O_RDONLY | constants.O_NONBLOCK)
    const st = fstatSync(fd)
    if (st.isFile() && st.size <= 1 << 20) buf = readFileSync(fd)
  } catch {} finally { if (fd !== null) try { closeSync(fd) } catch {} }
  if (buf === null) { console.log(JSON.stringify({ valid: false, source: 'file', why: 'unreadable', budget: null })); return 0 }
  const led = join(root, 'ledger.md'), dir = join(root, 'reports', s), file = join(dir, 'mandate.md')
  if (kind(led) !== 'file') return no('no ledger.md')
  for (const [d, k] of [[join(root, 'reports'), 'dir'], [dir, 'dir'], [file, 'file']]) if (![null, k].includes(kind(d))) return no(`${relative(root, d)} is not a ${k === 'dir' ? 'folder' : 'file'}`)
  let lfd = null, end = null
  try { lfd = openSync(led, constants.O_WRONLY | constants.O_APPEND | constants.O_NOFOLLOW); end = readFileSync(led) } catch {
    if (lfd !== null) try { closeSync(lfd) } catch {}
    return no('the ledger write failed')
  }
  const tmp = `${file}.${process.pid}.tmp`
  let out = null, made = false
  try {
    mkdirSync(dir, { recursive: true })
    out = openSync(tmp, 'wx'); made = true
    writeFileSync(out, buf); closeSync(out); out = null
    renameSync(tmp, file)
  } catch {
    if (out !== null) try { closeSync(out) } catch {}
    if (made) try { unlinkSync(tmp) } catch {}
    try { closeSync(lfd) } catch {}
    return no('the write failed')
  }
  try { appendFileSync(lfd, `${end.length && end[end.length - 1] !== 0x0a ? '\n' : ''}- ${today()} · ${s} · ruling · mandate: sha256 ${sha(buf)}\n`) } catch {
    console.error('now-facts.mjs: mandate copied without its record: the ledger write failed'); return 3
  } finally { try { closeSync(lfd) } catch {} }
  const { valid, source, why, budget } = mandate(s, readFileSync(led, 'utf8'))
  console.log(JSON.stringify({ valid, source, why, budget }))
  return 0
}
// config.yml read line by line: the top-level `stealth` and the `git` block's keys, each a bare
// word after `<key>: `, a comment after a space allowed; any other spelling is no value.
function config() {
  const top = {}, gitKeys = {}
  let inGit = false
  for (const l of (small(join(root, 'config.yml')) || '').split('\n')) {
    if (/^\S/.test(l)) inGit = /^git:(?: +#.*)? *$/.test(l)
    const m = l.match(/^( {2})?([a-z_]+): +([^\s#]+)(?: +#.*)? *$/)
    if (m && m[1]) { if (inGit) gitKeys[m[2]] = m[3] } else if (m) top[m[2]] = m[3]
  }
  return { push: gitKeys.push, base: gitKeys.base, stealth: top.stealth === 'on' }
}
// team.md's `## Gates` lines, fences blanked; a link or an unreadable file has none.
const gates = () => ((unfenced(small(join(root, 'team.md'))) || '').match(/^## Gates[ \t]*\n([\s\S]*?)(?=^#{1,2} |(?![\s\S]))/m) || [, ''])[1].split('\n')
// A standing go line (A1): its class, its paths regex, its proofs, why and when, exactly.
const LINE = /^- standing go: ([a-z][a-z0-9-]*) · paths `([^`]+)` · proofs ([a-z][a-z0-9-]*(?:, [a-z][a-z0-9-]*)*) · why: ([^ ·\n](?:(?! · )[^\n])*(?<! )) · (\d{4}-\d\d-\d\d)$/
// The valid lines, a map with no prototype from class to regex: a line that misses the shape voids
// them all; a class the check does not hold, a proof list other than the class's, a regex that
// fails or a class named twice voids that class (A2, A25).
function standing() {
  const got = Object.create(null), bad = new Set()
  for (const l of gates().filter((x) => x.startsWith('- standing go:'))) {
    const m = l.match(LINE)
    if (!m) return Object.create(null)
    let re = null
    try { re = new RegExp(m[2]) } catch {}
    if (!Object.hasOwn(CLASSES, m[1]) || m[3] !== CLASSES[m[1]].proofs.join(', ') || !re || m[1] in got) bad.add(m[1])
    got[m[1]] = re
  }
  for (const c of bad) delete got[c]
  return got
}
// The proofs a landing of class c lists (A10): the check's, the class's, then `footprint` in stealth.
const proofsOf = (c, stealth) => [...new Set(['paths', 'clean', ...CLASSES[c].proofs, ...(stealth ? ['footprint'] : [])])].map((name) => ({ name, result: HOLDS[name] === 'merger' ? 'due' : 'pass' }))
// The Gates risky paths: a regex that fails makes every path risky.
function riskyPaths() {
  const r = gates().find((l) => l.startsWith('- replay risky tasks:'))
  const res = [...((r || '').match(/ · risky paths (.*?) · why/)?.[1] || '').matchAll(/`([^`]+)`/g)].map((m) => m[1])
  try { const rx = res.map((x) => new RegExp(x)); return (p) => rx.some((x) => x.test(p)) } catch { return () => true }
}
// The main checkout's head, the full sha, or null.
const head = () => { const h = (repo && git(repo, ['rev-parse', '--verify', '--quiet', 'HEAD']) || '').trim(); return /^[0-9a-f]{40}$/.test(h) ? h : null }
// `git.base` is a branch name, read as refs/heads/<base> only: no `~ ^ : @`, space, `..` or
// leading `-`, so no revision expression can move the merge base.
const BRANCH = /^(?!-)(?!.*\.\.)[A-Za-z0-9._/-]+$/
// The check (A7 to A10) of slug s on the main checkout as it is, with the proofs ship held: a
// refusal { why, file?, proof? }, else { class, head, proofs }. It writes nothing. A branch other
// than the one the state names for the slug is refused as `base`, so a landing never names
// another's head.
function check(given, s) {
  const cfg = config(), lines = standing()
  if (cfg.push !== 'standing') return { why: 'setting' }
  if (!Object.keys(CLASSES).some((k) => lines[k])) return { why: 'line' }
  const branch = repo && (git(repo, ['symbolic-ref', '--quiet', '--short', 'HEAD']) || '').trim()
  // HEAD read once: every later git call takes this sha, and HEAD must still be it after them.
  const ref = `refs/heads/${cfg.base}`, at = head()
  const fork = at && branch && branch === branchOf(s) && BRANCH.test(cfg.base || '') && branch !== cfg.base && git(repo, ['rev-parse', '--verify', '--quiet', `${ref}^{commit}`]) !== null ? (git(repo, ['merge-base', ref, at]) || '').trim() : ''
  if (!fork) return { why: 'base' }
  if (git(repo, ['status', '--porcelain', '-z', '--untracked-files=all']) !== '') return { why: 'dirty' }
  // Every submodule change listed, whatever .gitmodules or the git config says to ignore.
  const raw = git(repo, ['diff', '--raw', '-z', '--no-renames', '--no-ext-diff', '--ignore-submodules=none', fork, at])
  if (raw === null) return { why: 'base' }
  if (head() !== at) return { why: 'moved' }
  const parts = raw.split('\0'), files = []
  // Each path's mode in the tree at the head, from ls-tree: a link, a submodule or an executable
  // is never 100644.
  const tree = new Map((git(repo, ['ls-tree', '-r', '-z', at, '--', 'docs']) || '').split('\0').filter(Boolean).map((e) => [e.slice(e.indexOf('\t') + 1), e.split(' ')[0]]))
  for (let i = 0; i + 1 < parts.length; i += 2) { const [, mode, , , status] = parts[i].split(' '); files.push({ mode, status, path: parts[i + 1], tree: tree.get(parts[i + 1]) }) }
  if (!files.length) return { why: 'empty' }
  const risky = riskyPaths(), signed = Object.keys(CLASSES).filter((k) => lines[k])
  const out = (c) => files.find((f) => !CLASSES[c].takes(f) || !lines[c].test(f.path) || risky(f.path))
  const c = signed.find((k) => !out(k))
  if (!c) return { why: 'class', file: safe(out(signed[0]).path) }
  const proofs = proofsOf(c, cfg.stealth), missing = proofs.find((p) => HOLDS[p.name] === 'ship' && !given.includes(p.name))
  if (missing) return { why: 'proof', proof: missing.name }
  return { class: c, head: at, proofs }
}
// The state's landing (A12): the file while its shape is exact and the check, run again now with
// the ship proofs it records, gives the same class, head and proofs; a forged or stale file is null.
function landed(s) {
  let l = null
  try { l = JSON.parse(small(join(root, 'reports', s, 'landing.json'))) } catch { return null }
  if (!l || typeof l !== 'object' || Array.isArray(l) || Object.keys(l).join() !== 'class,head,proofs' || !Array.isArray(l.proofs)) return null
  let v = null
  try { v = check(l.proofs.filter((p) => p && HOLDS[p.name] === 'ship' && p.result === 'pass').map((p) => p.name), s) } catch { return null }
  return !v.why && v.class === l.class && v.head === l.head && JSON.stringify(v.proofs) === JSON.stringify(l.proofs) ? { class: l.class, head: l.head, proofs: l.proofs } : null
}
// --landing: exit 3 before anything when it could not write or delete safely; otherwise one line,
// the landing written or the slug's old one deleted, an error in the check included (fail closed).
function land(s) {
  const no3 = (why) => { console.error(`now-facts.mjs: landing not written: ${why}`); return 3 }
  const dir = join(root, 'reports', s), file = join(dir, 'landing.json')
  if (linked(root) || linked(process.cwd())) return no3('a linked worktree')
  for (const [d, k] of [[join(root, 'reports'), 'dir'], [dir, 'dir'], [file, 'file']]) if (![null, k].includes(kind(d))) return no3(`${relative(root, d)} is not a ${k === 'dir' ? 'folder' : 'file'}`)
  if (git(root, ['ls-files', '--error-unmatch', '--', relative(root, file)]) !== null) return no3('tracked by git')
  const drop = () => { if (kind(file) === 'file') unlinkSync(file) }
  let v
  try { v = check(passed, s) } catch { v = { why: 'error' } }
  if (v.why) {
    try { drop() } catch { return no3('the old landing could not be deleted') }
    console.log(JSON.stringify({ landing: false, class: null, head: null, why: v.why, file: v.file ?? null, proof: v.proof ?? null }))
    return 0
  }
  const tmp = `${file}.${process.pid}.tmp`
  let fd = null, made = false
  try {
    mkdirSync(dir, { recursive: true })
    fd = openSync(tmp, 'wx'); made = true
    writeFileSync(fd, `${JSON.stringify(v)}\n`); closeSync(fd); fd = null
    renameSync(tmp, file)
  } catch {
    if (fd !== null) try { closeSync(fd) } catch {}
    if (made) try { unlinkSync(tmp) } catch {}
    try { drop() } catch {}
    return no3('the write failed, the old landing deleted')
  }
  console.log(JSON.stringify({ landing: true, class: v.class, head: v.head, why: null, file: null, proof: null }))
  return 0
}
// decision.v1 (A3 to A9), an allowlist: every key required, nothing else; any miss throws a
// Refused naming the field by the shape's own keys and indices, never by a key or value it was given.
class Refused { constructor(field, why) { this.field = field; this.why = why } }
const refuse = (field, why) => { throw new Refused(field, why) }
const at = (f, k) => (f ? `${f}.${k}` : k)
// A text: a string, non-empty once trimmed, no control (C0, C1), format, lone surrogate, line or
// paragraph separator character, at most n code points.
const BAD = /[\x00-\x1f\x7f-\x9f\p{Cf}\p{Cs}\u2028\u2029]/u
const txt = (v, n, f) => { if (typeof v !== 'string') refuse(f, 'type'); if (!v.trim() || BAD.test(v)) refuse(f, 'text'); if ([...v].length > n) refuse(f, 'length'); return v }
const orNull = (v, f, check) => (v === null ? null : check(v, f))
const upTo = (n) => (v, f) => txt(v, n, f)
const ISO = /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/
const iso = (v, f) => { if (typeof v !== 'string' || !ISO.test(v) || Number.isNaN(Date.parse(v)) || new Date(v).toISOString() !== v) refuse(f, 'shape'); return v }
const int = (max, min = 0) => (v, f) => { if (!Number.isSafeInteger(v)) refuse(f, 'type'); if (v < min || v > max) refuse(f, 'range'); return v }
const list = (v, min, max, f) => { if (!Array.isArray(v)) refuse(f, 'type'); if (v.length < min || v.length > max) refuse(f, 'length'); return v }
// An object with exactly these keys, copied in this order; its values are checked by the caller.
const exact = (v, keys, f) => {
  if (v === null || typeof v !== 'object' || Array.isArray(v)) refuse(f, 'type')
  if (Object.keys(v).some((k) => !keys.includes(k))) refuse(f, 'unknown')
  const gone = keys.find((k) => !Object.hasOwn(v, k))
  if (gone !== undefined) refuse(at(f, gone), 'missing')
  return Object.fromEntries(keys.map((k) => [k, v[k]]))
}
const KINDS = ['decision', 'verification', 'go', 'summary', 'review'], KEYS = 'ABCDEFGHI', SIZES = ['s', 'm', 'l', 'p']
const MODULES = { text: ['text'], metrics: ['items'], excerpt: ['file', 'where', 'head', 'lines', 'highlight'], list: ['items'], pending: [] }
// Who may recommend or object (A5): gtm, the second reader, or a role of team.md's Roles table.
function names() {
  const m = (unfenced(small(join(root, 'team.md'))) || '').match(/^## Roles[ \t]*\n([\s\S]*?)(?=^#{1,2} |(?![\s\S]))/m)
  return ['gtm', 'second-reader', ...[...(m ? m[1] : '').matchAll(/^\| ([a-z][a-z0-9-]{0,39}) \|/gm)].map((x) => x[1])]
}
// An excerpt's file (A9): a relative path under the root, segments of [A-Za-z0-9._-] none starting
// with `.`, every folder and the file itself reached through no link; its text, or a refusal.
function quoted(p, f) {
  if (typeof p !== 'string') refuse(f, 'type')
  const segs = p.split('/')
  if ([...p].length > 200 || !segs.every((x) => /^[A-Za-z0-9_-][A-Za-z0-9._-]*$/.test(x))) refuse(f, 'shape')
  let path = root
  for (const x of segs.slice(0, -1)) { path = join(path, x); if (kind(path) !== 'dir') refuse(f, 'file') }
  let fd = null
  try {
    fd = openSync(join(path, segs[segs.length - 1]), constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK)
    const st = fstatSync(fd)
    if (!st.isFile() || st.size > 1 << 20) refuse(f, 'file')
    return new TextDecoder('utf-8', { fatal: true }).decode(readFileSync(fd))
  } catch (e) { if (e instanceof Refused) throw e; refuse(f, 'file') } finally { if (fd !== null) try { closeSync(fd) } catch {} }
}
// A module (A8), the card's and the sheet's: one of MODULES' types, exactly its keys.
function moduleOf(m, f) {
  if (m === null || typeof m !== 'object' || Array.isArray(m)) refuse(f, 'type')
  if (!Object.hasOwn(m, 'type')) refuse(at(f, 'type'), 'missing')
  if (typeof m.type !== 'string' || !Object.hasOwn(MODULES, m.type)) refuse(at(f, 'type'), 'list')
  const q = exact(m, ['type', 'size', 'title', 'src', ...MODULES[m.type]], f)
  if (!SIZES.includes(q.size)) refuse(at(f, 'size'), 'list')
  txt(q.title, 60, at(f, 'title')); txt(q.src, 120, at(f, 'src'))
  if (q.type === 'text') txt(q.text, 600, at(f, 'text'))
  if (q.type === 'metrics') q.items = list(q.items, 1, 6, at(f, 'items')).map((x, j) => {
    const g = `${f}.items[${j}]`, r = exact(x, ['label', 'value', 'note', 'gauge', 'tone'], g)
    txt(r.label, 40, at(g, 'label')); txt(r.value, 20, at(g, 'value')); orNull(r.note, at(g, 'note'), upTo(120))
    if (r.gauge !== null && (typeof r.gauge !== 'number' || !(r.gauge >= 0 && r.gauge <= 1))) refuse(at(g, 'gauge'), 'range')
    if (r.tone !== null) refuse(at(g, 'tone'), 'list')
    return r
  })
  if (q.type === 'list') q.items = list(q.items, 1, 8, at(f, 'items')).map((x, j) => {
    const g = `${f}.items[${j}]`, r = exact(x, ['k', 'v'], g)
    txt(r.k, 40, at(g, 'k')); orNull(r.v, at(g, 'v'), upTo(120))
    return r
  })
  if (q.type === 'excerpt') {
    const body = quoted(q.file, at(f, 'file'))
    txt(q.where, 80, at(f, 'where')); orNull(q.head, at(f, 'head'), upTo(80))
    q.lines = list(q.lines, 1, 8, at(f, 'lines')).map((l, j) => { txt(l, 200, `${f}.lines[${j}]`); if (!body.includes(l)) refuse(`${f}.lines[${j}]`, 'quote'); return l })
    orNull(q.highlight, at(f, 'highlight'), (v, g) => { txt(v, 200, g); if (!body.includes(v)) refuse(g, 'quote'); return v })
  }
  return q
}
// The answer (A11, A12): exactly one of an option key of the card or the owner's words; the full
// shape, as stored, adds `by` (always owner) and `at`.
function answerOf(v, f, keys, stored) {
  const a = exact(v, stored ? ['option', 'other', 'by', 'at'] : ['option', 'other'], f)
  if ((a.option === null) === (a.other === null)) refuse(f, 'shape')
  if (a.option !== null && !keys.includes(a.option)) refuse(at(f, 'option'), 'option')
  orNull(a.other, at(f, 'other'), upTo(280))
  if (stored) { if (a.by !== 'owner') refuse(at(f, 'by'), 'list'); iso(a.at, at(f, 'at')) }
  return a
}
// Card c of slug s checked whole: as stored (the writer's keys in) or as the orchestrator's input
// (any of them given refuses as `set`). Returns a fresh copy, keys in the table's order.
function decision(c, s, stored) {
  const by = names()
  if (!stored && c && typeof c === 'object' && !Array.isArray(c)) {
    const given = ['v', 'slug', 'asked', 'answer'].find((k) => Object.hasOwn(c, k))
    if (given) refuse(given, 'set')
    if (c.other && typeof c.other === 'object' && Object.hasOwn(c.other, 'allowed')) refuse('other.allowed', 'set')
  }
  const o = exact(c, [...(stored ? ['v'] : []), 'id', 'kind', 'moment', ...(stored ? ['slug', 'asked'] : []), 'question', 'summary', 'why', 'criteria',
    'options', 'recommendation', 'objection', 'modules', 'other', ...(stored ? ['answer'] : [])], '')
  if (stored) { if (o.v !== 1) refuse('v', 'list'); if (o.slug !== s) refuse('slug', 'list'); iso(o.asked, 'asked') }
  if (typeof o.id !== 'string') refuse('id', 'type')
  if ([...o.id].length > 60 || !o.id.startsWith(`${s}-`) || !/^[A-Za-z0-9-]+$/.test(o.id.slice(s.length + 1))) refuse('id', 'shape')
  if (!KINDS.includes(o.kind)) refuse('kind', 'list')
  if (o.moment !== null) {
    if (!Number.isInteger(o.moment)) refuse('moment', 'type')
    if (o.moment < 1 || o.moment > 4) refuse('moment', 'range')
    if (!mandate(s).valid) refuse('moment', 'mandate')
  }
  txt(o.question, 160, 'question')
  for (const k of ['summary', 'why', 'criteria']) orNull(o[k], k, upTo(280))
  o.options = list(o.options, 1, OPTIONS, 'options').map((x, i) => {
    const f = `options[${i}]`, p = exact(x, ['key', 'label', 'proves', 'cost', 'reversible', 'recommendedBy'], f)
    if (p.key !== KEYS[i]) refuse(at(f, 'key'), 'order')
    txt(p.label, 60, at(f, 'label'))
    orNull(p.proves, at(f, 'proves'), upTo(200))
    p.cost = orNull(p.cost, at(f, 'cost'), (v, g) => {
      const q = exact(v, ['tokens', 'minutes', 'text'], g)
      orNull(q.tokens, at(g, 'tokens'), int(1e9)); orNull(q.minutes, at(g, 'minutes'), int(1e5)); orNull(q.text, at(g, 'text'), upTo(40))
      return q
    })
    if (![true, false, null].includes(p.reversible)) refuse(at(f, 'reversible'), 'type')
    p.recommendedBy = [...list(p.recommendedBy, 0, 3, at(f, 'recommendedBy'))]
    p.recommendedBy.forEach((n, j) => { if (!by.includes(n) || p.recommendedBy.indexOf(n) !== j) refuse(`${f}.recommendedBy[${j}]`, 'by') })
    return p
  })
  const keys = o.options.map((p) => p.key)
  o.recommendation = orNull(o.recommendation, 'recommendation', (v, g) => {
    const r = exact(v, ['by', 'option', 'why', 'costIfWrong'], g)
    if (!by.includes(r.by)) refuse(at(g, 'by'), 'by')
    if (!keys.includes(r.option)) refuse(at(g, 'option'), 'option')
    if (!o.options[keys.indexOf(r.option)].recommendedBy.includes(r.by)) refuse(at(g, 'by'), 'by')
    txt(r.why, 280, at(g, 'why')); txt(r.costIfWrong, 280, at(g, 'costIfWrong'))
    return r
  })
  const gtm = o.options.findIndex((p) => p.recommendedBy.includes('gtm'))
  if (o.recommendation === null && gtm >= 0) refuse(`options[${gtm}].recommendedBy`, 'by')
  o.objection = orNull(o.objection, 'objection', (v, g) => {
    const b = exact(v, ['by', 'prefers', 'text'], g)
    if (!by.includes(b.by)) refuse(at(g, 'by'), 'by')
    if (b.prefers !== null && !keys.includes(b.prefers)) refuse(at(g, 'prefers'), 'option')
    txt(b.text, 280, at(g, 'text'))
    return b
  })
  o.modules = list(o.modules, 0, 4, 'modules').map((m, i) => moduleOf(m, `modules[${i}]`))
  const other = exact(o.other, stored ? ['allowed', 'placeholder'] : ['placeholder'], 'other')
  if (stored && other.allowed !== true) refuse('other.allowed', 'list')
  orNull(other.placeholder, 'other.placeholder', upTo(80))
  o.other = { allowed: true, placeholder: other.placeholder }
  if (stored) o.answer = orNull(o.answer, 'answer', (v, g) => answerOf(v, g, keys, true))
  return o
}
// The orchestrator's input: at most 64 KiB of UTF-8 JSON on stdin, else undefined. A stdin with
// nothing to read yet (EAGAIN) is waited on 10 ms at a time, not spun on, for 5 s at most; a
// terminal is refused at once. A blocking pipe kept open with nothing on it still waits: the
// session's shell gives an empty stdin, refused at once, when the heredoc is missing.
function input() {
  if (isatty(0)) return undefined
  const chunks = [], b = Buffer.alloc(1 << 16), idle = new Int32Array(new SharedArrayBuffer(4))
  const end = Date.now() + 5000
  let n = 0
  for (;;) {
    if (Date.now() > end) return undefined
    let r
    try { r = readSync(0, b, 0, b.length, null) } catch (e) { if (e.code === 'EAGAIN') { Atomics.wait(idle, 0, 0, 10); continue } if (e.code === 'EOF') break; return undefined }
    if (r === 0) break
    if ((n += r) > 1 << 16) return undefined
    chunks.push(Buffer.from(b.subarray(0, r)))
  }
  try { return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(Buffer.concat(chunks))) } catch { return undefined }
}
// --card and --answer (A2, A10 to A13, A16): exit 3 before anything when the card file cannot be
// written safely, the root first: a root that is not a folder already is never made, as git cannot
// tell where it would be; then one line {written, field, why}. A refused card deletes the slug's
// card file; a refused answer changes nothing; any error in the check refuses (`error`).
function cardFile(s, answering) {
  const no3 = (why) => { console.error(`now-facts.mjs: card not written: ${why}`); return 3 }
  const dir = join(root, 'reports', s), file = join(dir, 'waiting.json')
  let folder = false
  try { folder = statSync(root).isDirectory() } catch {}
  if (!folder) return no3('the root is not a folder')
  if (linked(root) || linked(process.cwd())) return no3('a linked worktree')
  for (const [d, k] of [[join(root, 'reports'), 'dir'], [dir, 'dir'], [file, 'file']]) if (![null, k].includes(kind(d))) return no3(`${relative(root, d)} is not a ${k === 'dir' ? 'folder' : 'file'}`)
  if (git(root, ['ls-files', '--error-unmatch', '--', relative(root, file)]) !== null) return no3('tracked by git')
  const drop = () => { if (!answering && kind(file) === 'file') unlinkSync(file) }
  const stamp = new Date(now).toISOString()
  let c
  try {
    const given = input()
    if (given === undefined) refuse('', 'json')
    if (answering) {
      let old = null
      try { old = JSON.parse(small(file)) } catch {}
      if (old === null) refuse('', 'none')
      c = decision(old, s, true)
      if (c.answer !== null) refuse('answer', 'answered')
      c.answer = { ...answerOf(given, 'answer', c.options.map((p) => p.key), false), by: 'owner', at: stamp }
    } else {
      const { id, kind: k, moment, ...rest } = decision(given, s, false)
      c = { v: 1, id, kind: k, moment, slug: s, asked: stamp, ...rest, answer: null }
    }
  } catch (e) {
    try { drop() } catch { return no3('the old card could not be deleted') }
    console.log(JSON.stringify({ written: false, field: e instanceof Refused ? e.field || '.' : '.', why: e instanceof Refused ? e.why : 'error' }))
    return 1
  }
  const tmp = `${file}.${process.pid}.tmp`
  let fd = null, made = false
  try {
    mkdirSync(dir, { recursive: true })
    fd = openSync(tmp, 'wx'); made = true
    writeFileSync(fd, `${JSON.stringify(c, null, 2)}\n`); closeSync(fd); fd = null
    renameSync(tmp, file)
  } catch {
    if (fd !== null) try { closeSync(fd) } catch {}
    if (made) try { unlinkSync(tmp) } catch {}
    try { drop() } catch {}
    return no3(answering ? 'the write failed, the card unchanged' : 'the write failed, the old card deleted')
  }
  console.log(JSON.stringify({ written: true, field: null, why: null }))
  return 0
}
// sheet.v1 (the sheet's A3 to A13), an allowlist from decision.v1's pieces: every key required,
// nothing else. Owner fields come from the step only, fact fields from the script only.
const PROJECTS = ['app-mobile', 'app-web', 'infra', 'tool', 'sandbox'], STEPS = ['done', 'blocked', 'todo', 'doing']
const SHEET = ['v', 'kind', 'headline', 'purpose', 'users', 'plan', 'decisions', 'cost', 'difficulties', 'modules', 'showcase']
const OWNER = ['purpose', 'users', 'decisions', 'difficulties']
// config.yml's `project` block: `sheet` on only when it reads `on`, `kind` one of PROJECTS; each a
// two-space key and one bare word, a comment after a space allowed, nothing else on the line; a
// key given twice is no value.
function project() {
  const got = Object.create(null)
  let inside = false
  for (const l of (small(join(root, 'config.yml')) || '').split('\n')) {
    if (/^\S/.test(l)) inside = /^project:(?: +#.*)?$/.test(l)
    const m = inside ? l.match(/^ {2}(sheet|kind): ([^\s#]+)(?: +#.*)?$/) : null
    if (m) got[m[1]] = m[1] in got ? null : m[2]
  }
  return { sheet: got.sheet === 'on', kind: PROJECTS.includes(got.kind) ? got.kind : null }
}
const listOf = (min, max, each) => (v, f) => list(v, min, max, f).map((x, i) => each(x, `${f}[${i}]`))
const branchName = (n) => (v, f) => { if (typeof v !== 'string') refuse(f, 'type'); if (v.length > n || !SAFE.test(v)) refuse(f, 'shape'); return v }
// A real YYYY-MM-DD, not after the run's date.
const dated = (v, f) => {
  if (typeof v !== 'string' || !/^\d{4}-\d\d-\d\d$/.test(v) || new Date(Date.parse(v) || 0).toISOString().slice(0, 10) !== v) refuse(f, 'shape')
  if (v > today()) refuse(f, 'range')
  return v
}
const step = (x, g) => { const q = exact(x, ['n', 'title', 'status'], g); int(99, 1)(q.n, at(g, 'n')); orNull(q.title, at(g, 'title'), upTo(60)); if (!STEPS.includes(q.status)) refuse(at(g, 'status'), 'list'); return q }
const PLAN = {
  branch: (v, f) => orNull(v, f, branchName(100)),
  steps: (v, f) => orNull(v, f, listOf(0, 30, step)),
  milestone: (v, f) => orNull(v, f, (m, g) => {
    const q = exact(m, ['title', 'branches'], g)
    txt(q.title, 80, at(g, 'title'))
    q.branches = listOf(1, 12, (x, h) => { const b = exact(x, ['n', 'branch', 'title'], h); int(99, 1)(b.n, at(h, 'n')); branchName(60)(b.branch, at(h, 'branch')); txt(b.title, 60, at(h, 'title')); return b })(q.branches, at(g, 'branches'))
    return q
  }),
  stories: (v, f) => orNull(v, f, (s, g) => { const q = exact(s, ['done', 'total'], g); int(1e6)(q.done, at(g, 'done')); int(1e6)(q.total, at(g, 'total')); if (q.done > q.total) refuse(at(g, 'done'), 'range'); return q }),
}
const CHECKS = {
  v: (v, f) => { if (v !== 1) refuse(f, 'list'); return v },
  kind: (v, f) => { if (v !== null && !PROJECTS.includes(v)) refuse(f, 'list'); return v },
  headline: (v, f) => orNull(v, f, upTo(140)),
  purpose: (v, f) => orNull(v, f, upTo(280)),
  users: (v, f) => orNull(v, f, upTo(280)),
  plan: (v, f) => { const p = exact(v, Object.keys(PLAN), f); for (const k of Object.keys(PLAN)) p[k] = PLAN[k](p[k], at(f, k)); return p },
  decisions: listOf(0, 6, (x, g) => { const d = exact(x, ['at', 'text', 'by'], g); dated(d.at, at(g, 'at')); txt(d.text, 200, at(g, 'text')); if (!['owner', 'gtm'].includes(d.by)) refuse(at(g, 'by'), 'list'); return d }),
  cost: (v, f) => { const c = exact(v, ['tokens', 'seconds', 'dollars'], f); orNull(c.tokens, at(f, 'tokens'), int(1e12)); orNull(c.seconds, at(f, 'seconds'), int(1e9)); if (c.dollars !== null) refuse(at(f, 'dollars'), 'list'); return c },
  difficulties: listOf(0, 6, (x, g) => { const d = exact(x, ['k', 'text', 'src'], g); txt(d.k, 20, at(g, 'k')); txt(d.text, 200, at(g, 'text')); txt(d.src, 120, at(g, 'src')); return d }),
  modules: listOf(0, 8, moduleOf),
  showcase: (v, f) => { if (v !== null) refuse(f, 'list'); return v },
}
// A sheet checked whole, as stored, or the step's input: owner fields only, at least one, a fact
// field given refusing as `set`. A stored sheet without `showcase` reads it as null. Returns a fresh
// copy, keys in the table's order.
function sheetOf(v, stored) {
  if (stored && v !== null && typeof v === 'object' && !Array.isArray(v) && !Object.hasOwn(v, 'showcase')) v = { ...v, showcase: null }
  if (!stored) {
    if (v === null || typeof v !== 'object' || Array.isArray(v)) refuse('', 'type')
    const fact = SHEET.find((k) => !OWNER.includes(k) && Object.hasOwn(v, k))
    if (fact !== undefined) refuse(fact, 'set')
    if (Object.keys(v).some((k) => !OWNER.includes(k))) refuse('', 'unknown')
  }
  const keys = stored ? SHEET : OWNER.filter((k) => Object.hasOwn(v, k))
  if (!keys.length) refuse('', 'missing')
  const s = exact(v, keys, '')
  for (const k of keys) s[k] = CHECKS[k](s[k], k)
  return s
}
// This slug's spend (A5): the sums of its progress lines' `<n> s` segments and of the `<n>k`
// segment right after each; a `?` segment, a seconds segment off `<n> s` or one not followed by
// `<n>k` makes that sum null, never smaller; no slug or no progress file, both null.
function spend() {
  const t = mine ? small(join(root, 'reports', slug, 'progress.md')) : null
  let tokens = t === null ? null : 0, seconds = tokens
  for (const l of (t || '').split('\n').filter((x) => x.startsWith('- '))) {
    const segs = l.slice(2).split(' · ')
    segs.forEach((x, i) => {
      if (x === '?') { tokens = seconds = null; return }
      if (!/ s$/.test(x)) return
      seconds = seconds !== null && /^\d{1,9} s$/.test(x) ? seconds + parseInt(x, 10) : null
      tokens = tokens !== null && /^\d{1,9}k$/.test(segs[i + 1] || '') ? tokens + parseInt(segs[i + 1], 10) * 1000 : null
    })
  }
  return { tokens: tokens !== null && tokens <= 1e12 ? tokens : null, seconds: seconds !== null && seconds <= 1e9 ? seconds : null, dollars: null }
}
// The fact fields (A3 to A5): each null when unknown or off its shape; texts cut as the state's.
function factsOf() {
  const fit = (check, v) => { try { return check(v, '') } catch (e) { if (e instanceof Refused) return null; throw e } }
  const m = mine ? approved() : null, rows = stories.filter((x) => x.type !== 'epic')
  return { kind: project().kind, cost: spend(), plan: {
    branch: mine ? fit(PLAN.branch, nul(out.branch)) : null,
    steps: mine ? fit(PLAN.steps, steps()) : null,
    milestone: m && fit(PLAN.milestone, { title: text((m.t.match(/^# (.+)$/m) || [])[1], 80), branches: m.heads.map((h) => ({ n: +h[1], branch: h[2], title: text(h[3], 60) })) }),
    stories: existsSync(join(root, 'backlog.md')) ? fit(PLAN.stories, { done: rows.filter((x) => x.status === 'done').length, total: rows.filter((x) => x.status !== 'dropped').length }) : null,
  } }
}
// The step (stepping) or the rewrite after the state (A2, A6 to A9): exit 3 before anything when
// the sheet cannot be written safely; then the owner fields of the old sheet, read as an excerpt's
// file is (no link, at most 1 MiB, UTF-8) and which must pass the check, the step's given fields
// over them, the fact fields recomputed, the whole checked again and written by a rename. The step
// prints one line {written, field, why}; any error refuses. The step reads its input first; then,
// from the read of the old sheet to the rename, it holds sheet.json.lock, made exclusively, so a
// step and a rewrite never put back each other's old owner fields: the step waits for it up to a
// second, the rewrite not at all, then exit 3. A stale lock is reclaimed once first (lockFree).
function sheet(stepping) {
  const file = join(root, 'sheet.json')
  const no1 = (field, why) => { console.log(JSON.stringify({ written: false, field: field || '.', why })); return 1 }
  const no3 = (why) => { console.error(`now-facts.mjs: sheet not written: ${why}`); return 3 }
  if (stepping && !project().sheet) return no1('', 'off')
  let folder = false
  try { folder = statSync(root).isDirectory() } catch {}
  if (!folder) return no3('the root is not a folder')
  if (linked(root) || linked(process.cwd())) return no3('a linked worktree')
  if (![null, 'file'].includes(kind(file))) return no3('sheet.json is not a file')
  if (git(root, ['ls-files', '--error-unmatch', '--', 'sheet.json']) !== null) return no3('tracked by git')
  const given = stepping ? input() : {}, lock = `${file}.lock`
  let ino = null
  for (let tries = stepping ? 20 : 1, reclaims = 1; ; ) {
    try { if ((ino = lockTake(lock)) !== null) break } catch { return no3('the write failed, the old sheet left as it is') }
    if (reclaims && lockFree(lock)) { reclaims--; continue }
    if (--tries === 0) return no3(`sheet.json.lock is held; reclaimed once ${LOCK / 1000} s old, or remove it by hand when no run writes the sheet`)
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 50)
  }
  try { return held(stepping, given, file, no1, no3) } finally { try { if (lstatSync(lock).ino === ino) unlinkSync(lock) } catch {} }
}
// The pid namespace this run's pid means something in: on Linux its own, read from /proc (null when
// unreadable); elsewhere, with none, the platform's name.
const PIDNS = process.platform !== 'linux' ? process.platform : (() => { try { return readlinkSync('/proc/self/ns/pid') } catch { return null } })()
// The lock, made exclusively ('wx': never through a link) with `<pid> <PIDNS>` in it: its inode, or
// null when it is there already; any other error throws, the lock it made removed.
function lockTake(lock) {
  let fd
  try { fd = openSync(lock, 'wx') } catch (e) { if (e.code === 'EEXIST') return null; throw e }
  try { writeFileSync(fd, `${process.pid} ${PIDNS ?? '?'}`); return fstatSync(fd).ino } catch (e) { try { unlinkSync(lock) } catch {} throw e } finally { closeSync(fd) }
}
// A lock left by a killed run: a regular file whose mtime is LOCK ms or more before the run's time,
// or whose pid is gone (ESRCH) when the namespace it names is this run's PIDNS. A pid means nothing
// in another namespace (a sandbox may run each command in a new one): such a lock frees by age
// alone. A link, a FIFO or a folder never is stale. It is moved aside by a rename and removed only
// when it is still the file judged stale, else put back: true when removed.
const LOCK = 30000
function lockFree(lock) {
  let fd, st, body
  try { fd = openSync(lock, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK) } catch { return false }
  try {
    st = fstatSync(fd)
    if (!st.isFile()) return false
    const b = Buffer.alloc(64)
    body = b.toString('latin1', 0, readSync(fd, b, 0, b.length, 0))
  } catch { return false } finally { closeSync(fd) }
  const m = /^([1-9]\d{0,9}) (\S+)$/.exec(body)
  let gone = false
  if (m && m[2] === PIDNS) try { process.kill(+m[1], 0) } catch (e) { gone = e.code === 'ESRCH' }
  if (!gone && now - st.mtimeMs < LOCK) return false
  const aside = `${lock}.${process.pid}.stale`
  try { renameSync(lock, aside) } catch { return false }
  try {
    if (lstatSync(aside).ino === st.ino) return true
    try { linkSync(aside, lock) } catch {}
    return false
  } finally { try { unlinkSync(aside) } catch {} }
}
function held(stepping, given, file, no1, no3) {
  let next
  try {
    let old = null
    if (kind(file) === 'file') try { old = sheetOf(JSON.parse(quoted('sheet.json', '')), true) } catch { return stepping ? no1('', 'stored') : no3('sheet.json fails the check, left as it is') }
    if (given === undefined) refuse('', 'json')
    const o = { purpose: null, users: null, decisions: [], difficulties: [], ...(old && Object.fromEntries(OWNER.map((k) => [k, old[k]]))), ...(stepping ? sheetOf(given, false) : {}) }
    const f = factsOf()
    next = sheetOf({ v: 1, kind: f.kind, headline: null, purpose: o.purpose, users: o.users, plan: f.plan, decisions: o.decisions, cost: f.cost, difficulties: o.difficulties, modules: [], showcase: null }, true)
  } catch (e) {
    if (!stepping) return no3(e instanceof Refused ? `${e.field || '.'} off its shape` : 'an error in the check')
    return no1(e instanceof Refused ? e.field : '', e instanceof Refused ? e.why : 'error')
  }
  const tmp = `${file}.${process.pid}.tmp`
  let fd = null, made = false
  try {
    fd = openSync(tmp, 'wx'); made = true
    writeFileSync(fd, `${JSON.stringify(next, null, 2)}\n`); closeSync(fd); fd = null
    renameSync(tmp, file)
  } catch {
    if (fd !== null) try { closeSync(fd) } catch {}
    if (made) try { unlinkSync(tmp) } catch {}
    return no3('the write failed, the old sheet left as it is')
  }
  if (stepping) console.log(JSON.stringify({ written: true, field: null, why: null }))
  return 0
}
if (opt.sheet !== undefined) process.exit(sheet(true))
if (cardSlug !== undefined) process.exit(cardFile(cardSlug, opt.answer !== undefined))
if (opt.landing !== undefined) process.exit(land(opt.landing))
if (opt.copy !== undefined) process.exit(copy(opt.mandate, resolve(opt.copy)))
if (opt.mandate !== undefined) { const { valid, source, why, budget } = mandate(opt.mandate); console.log(JSON.stringify({ valid, source, why, budget })); process.exit(0) }
// The sheet is rewritten only after the state is, while the switch is on (A2, A7).
const code = (opt.state !== undefined && (write(join(root, 'state.json')) || (project().sheet ? sheet(false) : null))) || (hasUnknown(out) ? 1 : 0)
console.log(JSON.stringify(out, null, 2))
process.exit(code)
