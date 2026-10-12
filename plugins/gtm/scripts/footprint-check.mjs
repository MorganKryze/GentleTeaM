#!/usr/bin/env node
// Footprint check: scans a branch for traces of GTM before it ships with stealth on.
// Looks at the branch name, its commit messages, the PR text, the lines its diff adds and the
// files it creates, for GTM's vocabulary, excluded-path names, attribution trailers and the
// writing tells of guidelines/voice.md. No dependencies.
//
// node footprint-check.mjs [--config <root>/config.yml] [--base <ref>] [--pr <file>] [--repo <dir>] [--json]
// Exit 0: no hit (notes may remain). Exit 1: at least one hit. Exit 2: usage or git error.
//
// Config (all optional), in config.yml:
//   root: .gtm               excluded-path name
//   design.mockups           excluded-path name
//   git.base                 default base ref
//   git.forbid               attribution text, never in commit messages or the PR
//   git.never_name           more path names or words
//   footprint.words          more regexes to flag (case-insensitive), e.g. an internal codename
//   footprint.allow          regexes; a hit or note on a line matching one is dropped
//   footprint.skip           writing tells the project's own voice uses: em-dash, emoji, stock,
//                            filler, triad, bullets
import { readFileSync, existsSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { execFileSync } from 'node:child_process'

// GTM's own names. Plain English role names (reviewer, architect) are left out: too common.
const VOCABULARY = [
  String.raw`\bgtm\b`,
  String.raw`\bgentle ?team\b`,
  String.raw`\b(?:design-critic|final-reviewer|security-reviewer|data-reviewer|release-qa|ux-qa|design-loop|deliver-task|brief-me)\b`,
  String.raw`\b(?:team profile|fix rounds?|decision cards?|hand-backs?|deferred minors?|rulings I made)\b`,
  String.raw`^#+\s*for you\b`,
]
// Writing tells. Blocking: em-dash, emoji, stock, filler. Notes only (heuristic): triad, bullets.
const TELLS = {
  'em-dash': '—',
  emoji: String.raw`(?![©®™])\p{Extended_Pictographic}`,
  stock: String.raw`\b(?:delv(?:e|es|ed|ing)|seamless(?:ly)?|robust(?:ly|ness)?|leverag(?:e|es|ed|ing)|comprehensive|game[- ]changer|streamlin(?:e|es|ed|ing)|cutting[- ]edge|state[- ]of[- ]the[- ]art|empower(?:s|ed|ing)?|tapestry|testament to|it(?:'s| is) worth noting|in today's|ever[- ]evolving|harness(?:es|ed|ing)? the power|plays? a (?:crucial|pivotal|vital) role|pivotal|a myriad of|in conclusion)\b`,
  filler: String.raw`\b(?:basically|essentially|actually|arguably|needless to say|it should be noted|it is important to note|in order to|(?:might|could|may) potentially|it seems that)\b`,
}
const DOC_FILE = /\.(?:md|mdx|markdown|txt|rst|adoc)$/i
const COMMENT_LINE = /^\s*(?:\/\/|\/\*|\*|#(?!!)|<!--|--|;)/

function parseArgs(argv) {
  const a = { json: false }
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i]
    if (k === '--json') a.json = true
    else if (['--config', '--base', '--pr', '--repo'].includes(k) && argv[i + 1]) a[k.slice(2)] = argv[++i]
    else usage(`unknown argument ${k}`)
  }
  return a
}
function usage(msg) {
  console.error(`footprint-check: ${msg}\nusage: node footprint-check.mjs [--config <file>] [--base <ref>] [--pr <file>] [--repo <dir>] [--json]`)
  process.exit(2)
}

// A YAML subset: nested maps by indentation, scalars, [flow] lists, "- " block lists, comments.
export function parseYaml(text) {
  const out = {}
  const stack = [{ indent: -1, obj: out }]
  let pending = null
  for (const raw of text.split('\n')) {
    const line = stripComment(raw)
    if (!line.trim()) continue
    const indent = line.match(/^ */)[0].length
    const t = line.trim()
    if (t.startsWith('- ') && pending && indent >= pending.indent) {
      if (!Array.isArray(pending.holder[pending.key])) pending.holder[pending.key] = []
      pending.holder[pending.key].push(scalar(t.slice(2)))
      continue
    }
    pending = null
    while (stack.length > 1 && indent <= stack.at(-1).indent) stack.pop()
    const m = t.match(/^([\w.-]+):(?:\s+(.*))?$/)
    if (!m) continue
    const holder = stack.at(-1).obj
    if (m[2] === undefined || m[2] === '') {
      holder[m[1]] = {}
      stack.push({ indent, obj: holder[m[1]] })
      pending = { holder, key: m[1], indent }
    } else holder[m[1]] = value(m[2])
  }
  return out
}
function stripComment(line) {
  let q = null
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (q) { if (c === q) q = null } else if (c === '"' || c === "'") q = c
    else if (c === '#' && (i === 0 || /\s/.test(line[i - 1]))) return line.slice(0, i)
  }
  return line
}
function value(v) {
  v = v.trim()
  if (v === '{}') return {}
  if (v.startsWith('[') && v.endsWith(']')) {
    const items = []
    let cur = ''
    let q = null
    for (const c of v.slice(1, -1)) {
      if (q) { cur += c; if (c === q) q = null } else if (c === '"' || c === "'") { q = c; cur += c } else if (c === ',') { items.push(cur); cur = '' } else cur += c
    }
    if (cur.trim()) items.push(cur)
    return items.map(scalar).filter((s) => s !== '')
  }
  return scalar(v)
}
function scalar(s) {
  s = s.trim()
  if (/^".*"$/.test(s)) return s.slice(1, -1).replace(/\\\\/g, '\\').replace(/\\"/g, '"')
  if (/^'.*'$/.test(s)) return s.slice(1, -1).replace(/''/g, "'")
  return s
}

const list = (v) => (Array.isArray(v) ? v : v ? [v] : []).map(String).filter(Boolean)
const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
// A path name hits when not glued to other path characters: ".gtm" hits ".gtm/" but not "a.gtm2".
const pathRule = (p) => new RegExp(`(?<![\\w.-])${escape(p.replace(/^\/+|\/+$/g, ''))}(?![\\w-])`, 'gi')

export function buildRules(cfg, excludeText) {
  const fp = cfg.footprint || {}
  const skip = new Set(list(fp.skip))
  const paths = new Set([cfg.root || '.gtm', cfg.design?.mockups, ...list(cfg.git?.never_name)].filter(Boolean))
  for (const line of (excludeText || '').split('\n')) {
    const t = line.trim()
    if (t && !t.startsWith('#') && !t.startsWith('!') && !/[*?[\]]/.test(t)) paths.add(t)
  }
  const forbid = cfg.git?.forbid === undefined ? ['Co-authored-by', 'Generated with'] : list(cfg.git.forbid)
  const rules = []
  for (const p of paths) if (p.replace(/\//g, '')) rules.push({ kind: 'path', re: pathRule(p), scope: 'all' })
  for (const f of forbid) rules.push({ kind: 'attribution', re: new RegExp(escape(f), 'gi'), scope: 'message' })
  for (const v of VOCABULARY) rules.push({ kind: 'vocabulary', re: new RegExp(v, 'gi'), scope: 'all' })
  for (const w of list(fp.words)) rules.push({ kind: 'vocabulary', re: new RegExp(w, 'gi'), scope: 'all' })
  for (const [name, src] of Object.entries(TELLS)) if (!skip.has(name)) rules.push({ kind: name, re: new RegExp(src, 'giu'), scope: 'prose' })
  return { rules, allow: list(fp.allow).map((a) => new RegExp(a, 'i')), skip }
}

// One text line in one place. scope: 'name' (branch, file name), 'code' (non-prose diff line),
// 'prose' (doc or comment line), 'message' (commit message or PR line: prose plus attribution).
function scanLine(text, where, scope, ctx) {
  if (ctx.allow.some((a) => a.test(text))) return
  const taken = []
  const proseText = text.replace(/`[^`]*`/g, (m) => ' '.repeat(m.length))
  for (const r of ctx.rules) {
    if (r.scope === 'prose' && scope !== 'prose' && scope !== 'message') continue
    if (r.scope === 'message' && scope !== 'message') continue
    for (const m of (r.scope === 'prose' ? proseText : text).matchAll(r.re)) {
      const [from, to] = [m.index, m.index + m[0].length]
      if (taken.some(([a, b]) => from < b && to > a)) continue
      taken.push([from, to])
      ctx.hits.push({ kind: r.kind, where, match: m[0], line: text.trim().slice(0, 100) })
    }
  }
  if (scope === 'message' && !ctx.skip.has('triad')) {
    const t = proseText.match(/\b[a-z]+, [a-z]+,? (?:and|or) [a-z]+\b/i)
    if (t) ctx.notes.push({ kind: 'triad', where, match: t[0], line: text.trim().slice(0, 100) })
  }
}
// Runs of three or more bullets of at most seven words: short content that reads better as prose.
function bulletNotes(lines, whereOf, ctx) {
  if (ctx.skip.has('bullets')) return
  let run = []
  const flush = () => {
    if (run.length >= 3 && !run.some((i) => ctx.allow.some((a) => a.test(lines[i])))) {
      ctx.notes.push({ kind: 'bullets', where: whereOf(run[0]), match: `${run.length} short bullets`, line: lines[run[0]].trim().slice(0, 100) })
    }
    run = []
  }
  lines.forEach((l, i) => {
    const b = l.match(/^\s*[-*+]\s+(.*)$/)
    if (b && b[1].split(/\s+/).length <= 7) run.push(i)
    else flush()
  })
  flush()
}
function scanMessage(text, whereOf, ctx) {
  const lines = text.split('\n')
  let fenced = false
  lines.forEach((l, i) => {
    if (/^\s*```/.test(l)) { fenced = !fenced; return }
    scanLine(l, whereOf(i), fenced ? 'code' : 'message', ctx)
  })
  bulletNotes(lines, whereOf, ctx)
}

export function check({ repo = '.', config, base, pr } = {}) {
  repo = resolve(repo)
  const git = (...args) => execFileSync('git', ['-C', repo, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 << 20 })
  const cfgFile = config || join(repo, '.gtm/config.yml')
  const cfg = existsSync(cfgFile) ? parseYaml(readFileSync(cfgFile, 'utf8')) : {}
  const excludeFile = join(git('rev-parse', '--git-common-dir').trim().replace(/^(?!\/)/, `${repo}/`), 'info/exclude')
  const ctx = { ...buildRules(cfg, existsSync(excludeFile) ? readFileSync(excludeFile, 'utf8') : ''), hits: [], notes: [] }

  let baseRef = base || cfg.git?.base || 'main'
  const exists = (ref) => { try { git('rev-parse', '--verify', '--quiet', `${ref}^{commit}`); return true } catch { return false } }
  if (!exists(baseRef) && exists(`origin/${baseRef}`)) baseRef = `origin/${baseRef}`
  if (!exists(baseRef)) throw new Error(`base ref not found: ${baseRef}`)

  const branch = git('rev-parse', '--abbrev-ref', 'HEAD').trim()
  scanLine(branch, `branch ${branch}`, 'name', ctx)

  const log = git('log', '--reverse', '--format=%h%x00%B%x1e', `${baseRef}..HEAD`)
  for (const entry of log.split('\x1e')) {
    const [sha, body] = entry.replace(/^\n/, '').split('\x00')
    if (sha && body !== undefined) scanMessage(body.replace(/\n+$/, ''), (i) => `commit ${sha} line ${i + 1}`, ctx)
  }

  if (pr) scanMessage(readFileSync(pr, 'utf8'), (i) => `PR line ${i + 1}`, ctx)

  for (const f of git('diff', '--name-only', '--diff-filter=A', '--no-renames', `${baseRef}...HEAD`).split('\n').filter(Boolean)) {
    scanLine(f, `file name ${f}`, 'name', ctx)
  }

  let file = null
  let n = 0
  let fenced = false
  for (const l of git('diff', '--unified=0', '--no-color', '--no-ext-diff', '--no-renames', `${baseRef}...HEAD`).split('\n')) {
    if (l.startsWith('+++ ')) { file = l === '+++ /dev/null' ? null : l.slice(6); fenced = false; continue }
    const h = l.match(/^@@ -\S+ \+(\d+)/)
    if (h) { n = Number(h[1]); continue }
    if (!file || !l.startsWith('+')) continue
    const text = l.slice(1)
    let scope = 'code'
    if (DOC_FILE.test(file)) {
      if (/^\s*```/.test(text)) fenced = !fenced
      else if (!fenced) scope = 'prose'
    } else if (COMMENT_LINE.test(text)) scope = 'prose'
    scanLine(text, `${file}:${n}`, scope, ctx)
    n++
  }
  return { branch, base: baseRef, hits: ctx.hits, notes: ctx.notes }
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('footprint-check.mjs')) {
  const a = parseArgs(process.argv.slice(2))
  let result
  try { result = check(a) } catch (e) { usage(e.stderr ? e.stderr.toString().trim() : e.message) }
  if (a.json) console.log(JSON.stringify(result, null, 2))
  else {
    const { hits, notes } = result
    console.log(`footprint: ${hits.length} hit(s), ${notes.length} note(s) on ${result.branch} against ${result.base}`)
    for (const h of hits) console.log(`hit   ${h.kind.padEnd(11)} ${h.where}  "${h.match}"  ${h.line}`)
    for (const h of notes) console.log(`note  ${h.kind.padEnd(11)} ${h.where}  "${h.match}"  ${h.line}`)
  }
  process.exit(result.hits.length ? 1 : 0)
}
