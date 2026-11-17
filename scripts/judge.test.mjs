#!/usr/bin/env node
// Pins the external judge's client against a stand-in of its service, never the real one: what it
// sends (one question per finding, masked, the key in the Authorization header only), what it
// accepts back (the pinned model, one probability from 0 to 1), how it fails (429 and 529 asked
// again at most three times, a wait past 10 s refused, any other status, a timeout or a network
// error unavailable at once, an error's body never read), where the key may come from, which
// projects it asks for (only those the user listed in a file of their own), and the allowlist of
// its input, each near miss refused. Run by scripts/validate.mjs. No dependencies.
import { spawnSync } from 'node:child_process'
import { chmodSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { HOST, MODEL, ask, decode, keyFile, listed, main, mask, projectsFile, readKey } from '../plugins/gtm/scripts/judge.mjs'

const root = new URL('..', import.meta.url).pathname
const SCRIPT = join(root, 'plugins/gtm/scripts/judge.mjs')
const errors = []
const check = (name, got, want) => {
  if (JSON.stringify(got) !== JSON.stringify(want)) errors.push(`${name}: got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`)
}
const dir = mkdtempSync(join(tmpdir(), 'gtm-judge-'))
const KEY = 'k3y.Value-for_the-judge-0123456789'
const hex = (v) => Buffer.from(typeof v === 'string' ? v : JSON.stringify(v), 'utf8').toString('hex')
const F0 = { id: 'f0', severity: 'important', category: 'behaviour', file: 'src/a.js', summary: 'drops the last row' }
const F1 = { ...F0, id: 'f1', summary: 'off by one' }

// A stand-in of the service: answers from a list, records every request.
function service(...replies) {
  const sent = []
  const fetch = async (url, init) => {
    sent.push({ url, init })
    const r = replies.length > 1 ? replies.shift() : replies[0]
    if (r instanceof Error) throw r
    return {
      status: r.status ?? 200,
      headers: { get: (h) => (h === 'retry-after' ? r.retryAfter ?? null : null) },
      json: async () => {
        if ((r.status ?? 200) !== 200) throw new Error('an error body was read')
        return r.body
      },
    }
  }
  return { fetch, sent }
}
const answer = (noul, extra = {}) => ({ body: { model: MODEL, answers: { user: { noul } }, usage: { input_tokens: 600 }, ...extra } })
const waits = []
const wait = async (ms) => { waits.push(ms) }
const opts = (s) => ({ key: KEY, fetch: s.fetch, wait, home: '/home/me' })

// Input: the allowlist and its near misses, each refused.
check('decode: two findings', decode(hex([F0, F1])), [F0, F1])
for (const [what, input] of [
  ['upper-case hex', hex([F0]).toUpperCase()],
  ['odd length', hex([F0]).slice(1)],
  ['not hex', `${hex([F0])}zz`],
  ['empty', ''],
  ['past 65536 characters', '7b'.repeat(32769)],
  ['not an array', hex(F0)],
  ['no finding', hex([])],
  ['eleven findings', hex(Array.from({ length: 11 }, (_, i) => ({ ...F0, id: `f${i}` })))],
  ['an extra field', hex([{ ...F0, by: 'reviewer' }])],
  ['a missing field', hex([{ id: 'f0', severity: 'important', category: 'behaviour', summary: 's' }])],
  ['an id twice', hex([F0, { ...F1, id: 'f0' }])],
  ['an id off f0 to f9', hex([{ ...F0, id: 'f10' }])],
  ['a critical', hex([{ ...F0, severity: 'critical' }])],
  ['a minor', hex([{ ...F0, severity: 'minor' }])],
  ['category security', hex([{ ...F0, category: 'security' }])],
  ['category proof', hex([{ ...F0, category: 'proof' }])],
  ['a summary of 501 characters', hex([{ ...F0, summary: 'x'.repeat(501) }])],
  ['a file that is not text', hex([{ ...F0, file: 3 }])],
  ['invalid UTF-8', 'ff'],
]) check(`decode refuses ${what}`, decode(input), null)
check('decode keeps a summary of 500 characters', decode(hex([{ ...F0, summary: 'é'.repeat(500) }]))?.length, 1)

// What leaves: one request per finding, to the fixed host, the key in the header only, masked text.
{
  const s = service(answer(0.12), answer(0.91))
  const got = await ask([{ ...F0, summary: 'reads /home/me/.ssh/id with ghp_abcdef123 and https://u:pw@host/x' }, F1], opts(s))
  check('ask: two answers', got, { p: { f0: 0.12, f1: 0.91 }, tokens: 1200 })
  check('ask: one request per finding, to the fixed host', s.sent.map((r) => r.url), [HOST, HOST])
  const body = JSON.parse(s.sent[0].init.body)
  check('ask: the pinned model', body.model, MODEL)
  check('ask: one atomic question', Object.keys(body.questions), ['user'])
  check('ask: a noul question', body.questions.user.type, 'noul')
  check('ask: the state holds the four fields', Object.keys(body.state.finding).sort(), ['category', 'file', 'severity', 'summary'])
  check('ask: masked', body.state.finding.summary, 'reads ~/.ssh/id with ghp_[redacted] and https://[redacted]@host/x')
  check('ask: the key in the Authorization header', s.sent[0].init.headers.Authorization, `Bearer ${KEY}`)
  check('ask: the key nowhere in the body', s.sent.some((r) => r.init.body.includes(KEY)), false)
  check('ask: no redirect followed', s.sent[0].init.redirect, 'error')
}

// What comes back: the pinned model and one probability from 0 to 1, or nothing is used.
for (const [what, reply] of [
  ['another model', answer(0.1, { model: 'jev-1.13.0' })],
  ['a probability under 0', answer(-0.01)],
  ['a probability over 1', answer(1.01)],
  ['a probability as text', answer('0.1')],
  ['no probability', { body: { model: MODEL, answers: { user: {} } } }],
  ['an extra answer', { body: { model: MODEL, answers: { user: { noul: 0.1 }, other: { noul: 0.1 } } } }],
  ['no body', { body: null }],
]) check(`ask: ${what} is unavailable`, await ask([F0], opts(service(reply))), { p: {}, tokens: 0, unavailable: 'answer' })
check('ask: 0 and 1 are answers', (await ask([F0, F1], opts(service(answer(0), answer(1))))).p, { f0: 0, f1: 1 })

// How it fails: 429 and 529 asked again, at most three attempts; anything else at once.
{
  waits.length = 0
  const s = service({ status: 429 }, answer(0.2))
  check('ask: a 429 then an answer', await ask([F0], opts(s)), { p: { f0: 0.2 }, tokens: 600 })
  check('ask: waited 1 s', waits, [1000])
  waits.length = 0
  const t = service({ status: 529 }, { status: 529 }, { status: 529 })
  check('ask: 529 three times', await ask([F0], opts(t)), { p: {}, tokens: 0, unavailable: 'rate' })
  check('ask: three attempts, waits of 1 s then 2 s', [t.sent.length, waits], [3, [1000, 2000]])
  waits.length = 0
  check('ask: a retry-after of 10 s is waited', (await ask([F0], opts(service({ status: 429, retryAfter: '10' }, answer(0.2))))).p, { f0: 0.2 })
  check('ask: waited 10 s', waits, [10000])
  waits.length = 0
  const u = service({ status: 429, retryAfter: '11' }, answer(0.2))
  check('ask: a retry-after past 10 s', await ask([F0], opts(u)), { p: {}, tokens: 0, unavailable: 'rate' })
  check('ask: no wait and no second attempt past 10 s', [u.sent.length, waits], [1, []])
}
for (const [what, reply, kind] of [
  ['a 401', { status: 401 }, 'status'],
  ['a 500', { status: 500 }, 'status'],
  ['a 302', { status: 302 }, 'status'],
  ['a timeout', Object.assign(new Error('t'), { name: 'TimeoutError' }), 'timeout'],
  ['a network error', new TypeError('fetch failed'), 'network'],
]) {
  const s = service(reply, answer(0.1))
  check(`ask: ${what} is unavailable at once`, [await ask([F0, F1], opts(s)), s.sent.length], [{ p: {}, tokens: 0, unavailable: kind }, 1])
}
check('ask: an unanswered finding stops the rest, the answered kept', await ask([F0, F1], opts(service(answer(0.1), { status: 500 }))), { p: { f0: 0.1 }, tokens: 600, unavailable: 'status' })

// Where the key may come from: one user-level file, owner-only, one line of the allowed shape,
// outside any repository. Only the condition is said, never the content.
const cfg = join(dir, 'config')
mkdirSync(join(cfg, 'gtm'), { recursive: true })
const file = keyFile({ CLAUDE_CONFIG_DIR: cfg })
check('key: the user-level file', file, join(cfg, 'gtm', 'judge.key'))
const keyed = (text, mode = 0o600) => { writeFileSync(file, text); chmodSync(file, mode); return readKey(file, () => false) }
check('key: missing', readKey(file, () => false), { off: 'key missing' })
check('key: read', keyed(`${KEY}\n`), { key: KEY })
check('key: read without a newline', keyed(KEY), { key: KEY })
for (const [what, text, mode] of [
  ['readable by the group', KEY, 0o640],
  ['readable by others', KEY, 0o604],
]) check(`key: ${what}`, keyed(text, mode), { off: 'key mode' })
for (const [what, text] of [
  ['19 characters', 'a'.repeat(19)],
  ['201 characters', 'a'.repeat(201)],
  ['a space', `${KEY} x`],
  ['two lines', `${KEY}\n${KEY}\n`],
  ['a blank line after', `${KEY}\n\n`],
  ['empty', ''],
]) check(`key: ${what}`, keyed(text), { off: 'key shape' })
check('key: 20 and 200 characters', [keyed('a'.repeat(20)), keyed('a'.repeat(200))], [{ key: 'a'.repeat(20) }, { key: 'a'.repeat(200) }])
keyed(`${KEY}\n`)
check('key: inside a repository', readKey(file, () => true), { off: 'key in a repository' })
const link = join(dir, 'link.key')
symlinkSync(file, link)
check('key: a link to a valid file', readKey(link, () => false), { key: KEY })
const folder = join(dir, 'folder.key')
mkdirSync(folder)
check('key: a folder', readKey(folder, () => false), { off: 'key not a file' })

// Which projects: those listed, one absolute path a line, in the user's own file beside the key.
const list = projectsFile({ CLAUDE_CONFIG_DIR: cfg })
check('projects: the user-level file', list, join(cfg, 'gtm', 'judge.projects'))
const proj = join(dir, 'proj')
mkdirSync(join(proj, 'sub'), { recursive: true })
const yes = (text, project = proj, mode = 0o600, inRepo = () => false) => { writeFileSync(list, text); chmodSync(list, mode); return listed(list, project, inRepo) }
rmSync(list, { force: true })
check('projects: no file', listed(list, proj, () => false), { off: 'projects missing' })
check('projects: listed', yes(`# mine\n\n${proj}\n`), { on: true })
check('projects: listed through a trailing slash and a link', [yes(`${proj}/\n`), yes(`${proj}\n`, join(dir, 'proj-link'))], [{ on: true }, { off: 'project not listed' }])
symlinkSync(proj, join(dir, 'proj-link'))
check('projects: a link to a listed project', yes(`${proj}\n`, join(dir, 'proj-link')), { on: true })
for (const [what, text, project] of [
  ['another project', `${join(dir, 'other')}\n`, proj],
  ['a folder inside the listed one', `${proj}\n`, join(proj, 'sub')],
  ['the parent of the project', `${dir}\n`, proj],
  ['a project that does not resolve', `${proj}\n`, join(dir, 'gone')],
  ['a relative project', `${proj}\n`, 'proj'],
]) check(`projects: ${what} is not listed`, yes(text, project), { off: 'project not listed' })
for (const [what, text] of [
  ['a relative line', 'proj\n'],
  ['a line with a tab', `${proj}\t\n`],
  ['an empty file', ''],
  ['blank lines only', '\n\n'],
  ['past 16 KiB', `${proj}\n${'#'.repeat(16384)}\n`],
]) check(`projects: ${what}`, yes(text), { off: 'projects shape' })
check('projects: readable by the group', yes(`${proj}\n`, proj, 0o640), { off: 'projects mode' })
check('projects: inside a repository', yes(`${proj}\n`, proj, 0o600, () => true), { off: 'projects in a repository' })
yes(`${proj}\n`)

// The whole run: a project not listed, an input refused or a key refused asks nothing.
{
  const s = service(answer(0.1))
  const run = (args, more = {}) => main(['--project', proj, ...args], { env: { CLAUDE_CONFIG_DIR: cfg }, fetch: s.fetch, wait, inRepo: () => false, home: '/home/me', ...more })
  check('main: on, checked offline', [await run(['--check']), s.sent.length], [{ code: 0, out: { v: 1, on: true } }, 0])
  check('main: a refused input asks nothing', [await run(['zz']), s.sent.length], [{ code: 0, out: { v: 1, unavailable: 'input' } }, 0])
  const none = join(dir, 'none')
  check('main: nothing listed asks nothing', [await run([hex([F0])], { env: { CLAUDE_CONFIG_DIR: none } }), s.sent.length], [{ code: 0, out: { v: 1, unavailable: 'projects missing' } }, 0])
  const other = (args) => main(['--project', join(proj, 'sub'), ...args], { env: { CLAUDE_CONFIG_DIR: cfg }, fetch: s.fetch, inRepo: () => false })
  check('main: a project not listed is off and asks nothing', [await other(['--check']), await other([hex([F0])]), s.sent.length],
    [{ code: 0, out: { v: 1, on: false, why: 'project not listed' } }, { code: 0, out: { v: 1, unavailable: 'project not listed' } }, 0])
  rmSync(file)
  check('main: listed without a key is off', [await run(['--check']), await run([hex([F0])]), s.sent.length],
    [{ code: 0, out: { v: 1, on: false, why: 'key missing' } }, { code: 0, out: { v: 1, unavailable: 'key missing' } }, 0])
  keyed(`${KEY}\n`)
  check('main: answered', await run([hex([F0])]), { code: 0, out: { v: 1, model: MODEL, p: { f0: 0.1 }, tokens: 600 } })
  for (const args of [[], [hex([F0])], ['--project', proj], ['--root', proj, hex([F0])], ['--project', proj, hex([F0]), 'x']]) check(`main: ${JSON.stringify(args).slice(0, 40)} is a usage error`, await main(args), { code: 2 })
}

// The command itself: one JSON line, nothing sent without a listed project and a key, the key
// never printed.
{
  const env = (d) => ({ ...process.env, CLAUDE_CONFIG_DIR: d })
  const r = spawnSync(process.execPath, [SCRIPT, '--project', proj, hex([F0])], { encoding: 'utf8', env: env(join(dir, 'none')) })
  check('command: nothing listed', [r.status, r.stdout], [0, '{"v":1,"unavailable":"projects missing"}\n'])
  const c = spawnSync(process.execPath, [SCRIPT, '--project', proj, '--check'], { encoding: 'utf8', env: env(cfg) })
  check('command: on', [c.status, c.stdout], [0, '{"v":1,"on":true}\n'])
  const u = spawnSync(process.execPath, [SCRIPT], { encoding: 'utf8' })
  check('command: no argument', [u.status, u.stdout], [2, ''])
  const bad = spawnSync(process.execPath, [SCRIPT, '--project', proj, 'zz'], { encoding: 'utf8', env: env(cfg) })
  check('command: the key is never printed', [bad.status, `${bad.stdout}${bad.stderr}`.includes(KEY)], [0, false])
}
check('mask: an empty home masks nothing of the path', mask('/a/b', ''), '/a/b')

rmSync(dir, { recursive: true, force: true })
if (errors.length) {
  console.error(errors.join('\n'))
  process.exit(1)
}
console.log('judge: client checks OK')
