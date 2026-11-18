#!/usr/bin/env node
// Asks the external judge, once per review finding, whether fixing it changes what a user of the
// software gets, and prints one JSON line of probabilities for the task workflow, which alone
// compares them with its threshold. It asks only for a project the user listed in a file of their
// own, beside the key; no repository file can turn it on. `--check` says whether it is on, offline. The findings come hex-encoded in one argument, so whoever runs
// this reads none of their words. The key comes from one user-level file and leaves only in the
// Authorization header of a request to the one fixed host; it is never printed. A failure prints
// `unavailable` with what was answered before it; the workflow lowers nothing else. No deps.
import { readFileSync, realpathSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { homedir } from 'node:os'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

export const HOST = 'https://api.typesafe.ai/v1/systemone'
export const MODEL = 'jev-1.14.0'
const MAX_FIELD = 500
const MAX_HEX = 65536
const TIMEOUT = 5000
const ATTEMPTS = 3
const MAX_WAIT = 10
const KEY = /^[A-Za-z0-9._-]{20,200}\n?$/
const ID = /^f[0-9]$/
const FIELDS = 'category,file,id,severity,summary'
// The question and its criteria as the 2026-11-17 measure asked them: the threshold was read there.
const QUESTIONS = {
  user: {
    type: 'noul',
    instructions: 'Would fixing the finding in `finding` change what a user of the software gets?',
    criteria: {
      true: 'The fix changes behaviour, security, data integrity or a rule the software applies.',
      false: 'The fix only adds or changes a test, a pin, a mutation check, wording, formatting or a commit message.',
    },
  },
}

// The findings, or null for anything off the allowlist: important behaviour findings, each with
// exactly an id f0 to f9 given once (so 10 at most), a file and a summary of 500 characters or less.
export function decode(hex) {
  if (typeof hex !== 'string' || !hex.length || hex.length > MAX_HEX || hex.length % 2 || !/^[0-9a-f]+$/.test(hex)) return null
  let list
  try {
    list = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(Buffer.from(hex, 'hex')))
  } catch {
    return null
  }
  if (!Array.isArray(list) || !list.length) return null
  const ids = new Set()
  for (const f of list) {
    if (!f || typeof f !== 'object' || Array.isArray(f) || Object.keys(f).sort().join(',') !== FIELDS) return null
    if (!ID.test(f.id) || ids.has(f.id) || f.severity !== 'important' || f.category !== 'behaviour') return null
    ids.add(f.id)
    for (const k of ['file', 'summary']) if (typeof f[k] !== 'string' || [...f[k]].length > MAX_FIELD) return null
  }
  return list
}

const folder = (env) => join(env.CLAUDE_CONFIG_DIR || join(homedir(), '.claude'), 'gtm')
export const keyFile = (env = process.env) => join(folder(env), 'judge.key')
export const projectsFile = (env = process.env) => join(folder(env), 'judge.projects')
const PATH = /^\/[^\x00-\x1f\x7f]{0,4095}$/

// Whether `dir` sits in a git work tree. Only git's own answer that it is in no repository reads
// as outside: git missing, its timeout or a folder it refuses all read as inside, so the file is
// refused. Git runs in English, its discovery left to the folder alone, whatever the caller's
// environment says.
function inGitTree(dir) {
  const env = Object.fromEntries(Object.entries(process.env).filter(([k]) => !k.startsWith('GIT_') && k !== 'LANGUAGE'))
  const r = spawnSync('git', ['-C', dir, 'rev-parse', '--is-inside-work-tree'], {
    encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 5000, env: { ...env, LC_ALL: 'C', GIT_DISCOVERY_ACROSS_FILESYSTEM: '1' },
  })
  if (r.status === 128 && /^fatal: not a git repository/m.test(r.stderr)) return false
  return r.status !== 0 || r.stdout.trim() === 'true'
}

// A user-level file's text, or why it is refused (`<name> <condition>`), never its content: a
// regular file (links followed), the user's and readable by them alone, within its size, outside
// any git work tree. Too big reads as empty, so its shape check refuses it.
function userFile(file, name, max, inRepo) {
  let st, real
  try {
    st = statSync(file)
    real = realpathSync(file)
  } catch {
    return { off: `${name} missing` }
  }
  if (!st.isFile()) return { off: `${name} not a file` }
  if ((st.mode & 0o077) !== 0 || (process.getuid && st.uid !== process.getuid())) return { off: `${name} mode` }
  let text
  try {
    text = st.size > max ? '' : readFileSync(real, 'utf8')
  } catch {
    return { off: `${name} unreadable` }
  }
  if (inRepo(dirname(real))) return { off: `${name} in a repository` }
  return { text }
}

// The key: one line of 20 to 200 characters of [A-Za-z0-9._-].
export function readKey(file, inRepo = inGitTree) {
  const got = userFile(file, 'key', 256, inRepo)
  if (got.off) return got
  if (!KEY.test(got.text)) return { off: 'key shape' }
  return { key: got.text.trim() }
}

// The projects the user said yes to: one absolute path a line, blank and `#` lines aside, at most
// 16 KiB; a path that does not resolve is skipped. Whether `project` is one of them, both resolved.
export function listed(file, project, inRepo = inGitTree) {
  const got = userFile(file, 'projects', 16384, inRepo)
  if (got.off) return got
  const lines = got.text.split('\n').map((l) => l.replace(/\r$/, '')).filter((l) => l.trim() && !l.startsWith('#'))
  if (!got.text.trim() || lines.some((l) => !PATH.test(l))) return { off: 'projects shape' }
  const real = (p) => {
    try {
      return realpathSync(p)
    } catch {
      return null
    }
  }
  const here = typeof project === 'string' && PATH.test(project) ? real(project) : null
  return here && lines.some((l) => real(l) === here) ? { on: true } : { off: 'project not listed' }
}

// What leaves the machine is masked: the home folder, token shapes, credentials in a URL, keys.
export function mask(text, home = homedir()) {
  const t = home ? String(text).split(home).join('~') : String(text)
  return t
    .replace(/(sk-ant-|ghp_|gho_|ghs_|ghu_|github_pat_|AKIA|xox[bpas]-)[A-Za-z0-9_-]*/g, '$1[redacted]')
    .replace(/-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?(?:-----END [A-Z ]*PRIVATE KEY-----|$)/g, '[redacted key]')
    .replace(/([a-z][a-z0-9+.-]*:\/\/)[^\s/@]+@/gi, '$1[redacted]@')
}

const pause = (ms) => new Promise((done) => setTimeout(done, ms))

// One question about one finding: its probability and input tokens, or why it went unanswered.
// Only 429 and 529 are asked again; an error's body is never read.
async function once(body, key, fetch, wait) {
  for (let attempt = 1; ; attempt++) {
    let r
    try {
      r = await fetch(HOST, {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body,
        redirect: 'error',
        signal: AbortSignal.timeout(TIMEOUT),
      })
    } catch (e) {
      return { unavailable: e?.name === 'TimeoutError' || e?.name === 'AbortError' ? 'timeout' : 'network' }
    }
    if (r.status === 429 || r.status === 529) {
      if (attempt >= ATTEMPTS) return { unavailable: 'rate' }
      const given = r.headers?.get?.('retry-after')
      const s = given == null || given === '' ? attempt : Number(given)
      if (!Number.isFinite(s) || s < 0 || s > MAX_WAIT) return { unavailable: 'rate' }
      await wait(s * 1000)
      continue
    }
    if (r.status !== 200) return { unavailable: 'status' }
    let json
    try {
      json = await r.json()
    } catch {
      return { unavailable: 'answer' }
    }
    if (!json || typeof json !== 'object' || json.model !== MODEL) return { unavailable: 'answer' }
    const answers = json.answers
    const n = answers && typeof answers === 'object' && !Array.isArray(answers) && Object.keys(answers).join() === 'user' ? answers.user?.noul : undefined
    if (typeof n !== 'number' || !Number.isFinite(n) || n < 0 || n > 1) return { unavailable: 'answer' }
    const t = json.usage?.input_tokens
    return { noul: n, tokens: Number.isSafeInteger(t) && t >= 0 ? t : 0 }
  }
}

// Each finding asked alone, as the measure did; the first unanswered one stops the rest.
export async function ask(list, { key, fetch = globalThis.fetch, wait = pause, home = homedir() } = {}) {
  const p = {}
  let tokens = 0
  for (const f of list) {
    const finding = { severity: f.severity, category: f.category, file: mask(f.file, home), summary: mask(f.summary, home) }
    const got = await once(JSON.stringify({ model: MODEL, state: { finding }, questions: QUESTIONS }), key, fetch, wait)
    if (got.unavailable) return { p, tokens, unavailable: got.unavailable }
    p[f.id] = got.noul
    tokens += got.tokens
  }
  return { p, tokens }
}

// `--project <root> --check`: on or why not, nothing sent. `--project <root> <hex>`: the answers.
export async function main(argv, { env = process.env, fetch, wait, inRepo = inGitTree, home } = {}) {
  if (argv.length !== 3 || argv[0] !== '--project') return { code: 2 }
  const yes = listed(projectsFile(env), argv[1], inRepo)
  const k = yes.off ? yes : readKey(keyFile(env), inRepo)
  if (argv[2] === '--check') return { code: 0, out: k.off ? { v: 1, on: false, why: k.off } : { v: 1, on: true } }
  const list = decode(argv[2])
  if (!list) return { code: 0, out: { v: 1, unavailable: 'input' } }
  if (k.off) return { code: 0, out: { v: 1, unavailable: k.off } }
  const got = await ask(list, { key: k.key, fetch, wait, home })
  return { code: 0, out: { v: 1, model: MODEL, p: got.p, tokens: got.tokens, ...(got.unavailable ? { unavailable: got.unavailable } : {}) } }
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { code, out } = await main(process.argv.slice(2))
  if (out) console.log(JSON.stringify(out))
  else console.error('usage: judge.mjs --project <root> (--check | <hex-encoded findings>)')
  process.exit(code)
}
