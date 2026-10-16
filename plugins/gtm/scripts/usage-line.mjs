#!/usr/bin/env node
// The usage step chained to the status line, its install into the user settings, and its reader.
//   (stdin)  status-line JSON in: writes <config>/gtm/usage.json atomically (v, time, and each
//            window's used_percentage and resets_at, nothing else), prints `5h <p>% · 7d <q>%`.
//            --breadcrumb also prints NOW.md's first `>` line; --quiet drops the usage line.
//            Always exits 0: a status line must never break.
//   --install <settings.json> [--breadcrumb]   copy this file to <config>/gtm/ and chain it before
//            the old statusLine command, kept byte for byte; a rerun changes nothing.
//   --uninstall <settings.json>                put the old command back (or remove the step alone).
//   --read [--ledger <file>] [--tokens <k left>] [--minutes <left>] [--now <ISO>]   per window:
//            used %, reset, minutes to it, age, flag. No reading: `none`; past 30 min: `stale`.
// <config> = ${CLAUDE_CONFIG_DIR:-$HOME/.claude}. No network, no git. No dependencies.
import { readFileSync, writeFileSync, renameSync, mkdirSync, existsSync, copyFileSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { homedir } from 'node:os'
import { fileURLToPath } from 'node:url'

const WINDOWS = { five_hour: '5h', seven_day: '7d', spend_limit: 'spend' }
const THRESHOLD = { five_hour: 80, seven_day: 90, spend_limit: 90 }
const STALE_MIN = 30, RUNS = 5, MIN_RUNS = 2, CRUMB = 100
const config = process.env.CLAUDE_CONFIG_DIR || join(homedir(), '.claude')
const store = join(config, 'gtm', 'usage.json'), step = join(config, 'gtm', 'usage-line.mjs')
const argv = process.argv.slice(2), flag = (k) => argv.includes(k), val = (k) => (argv.includes(k) ? argv[argv.indexOf(k) + 1] : undefined)
const atomic = (file, text) => { mkdirSync(dirname(file), { recursive: true }); const t = `${file}.${process.pid}.tmp`; writeFileSync(t, text); renameSync(t, file) }
const iso = (r) => { const t = typeof r === 'number' ? r * 1000 : typeof r === 'string' ? Date.parse(r) : NaN; return Number.isFinite(t) ? new Date(t).toISOString() : null }
const clean = (s) => [...s.replace(/[\p{Cc}\p{Cf}\p{Zl}\p{Zp}]/gu, '').trim()].slice(0, CRUMB).join('')
const median = (xs) => { const s = [...xs].sort((a, b) => a - b), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2 }
const round = (x) => Math.round(x * 10) / 10
const quote = (p) => (/["$`\\\n]/.test(p) ? null : `"${p}"`)

function stepMode() {
  let input = {}
  try { input = JSON.parse(readFileSync(0, 'utf8')) } catch { return }
  const out = []
  if (flag('--breadcrumb')) {
    const dir = input?.workspace?.project_dir || input?.cwd
    if (typeof dir === 'string') {
      let root = '.gtm'
      for (const f of ['CLAUDE.local.md', 'CLAUDE.md']) {
        const m = existsSync(join(dir, f)) && readFileSync(join(dir, f), 'utf8').match(/^GTM root: *(\S+)\s*$/m)
        if (m) { root = m[1]; break }
      }
      const now = resolve(dir, root, 'NOW.md')
      const line = existsSync(now) && readFileSync(now, 'utf8').split('\n').find((l) => l.startsWith('>'))
      if (line && !/ › shipped\b/.test(line)) out.push(clean(line.slice(1)))
    }
  }
  const limits = {}, rl = input?.rate_limits || {}
  for (const k of Object.keys(WINDOWS)) {
    const w = rl[k], p = w?.used_percentage
    if (typeof p !== 'number' || !Number.isFinite(p) || p < 0 || (k !== 'spend_limit' && p > 100)) continue
    limits[k] = { used_percentage: p, resets_at: iso(w.resets_at) }
  }
  if (Object.keys(limits).length) {
    atomic(store, JSON.stringify({ v: 1, at: new Date().toISOString(), ...limits }) + '\n')
    if (!flag('--quiet')) out.push(Object.entries(limits).filter(([k]) => k !== 'spend_limit').map(([k, w]) => `${WINDOWS[k]} ${Math.round(w.used_percentage)}%`).join(' · '))
  }
  if (out.length) console.log(out.join('\n'))
}

function settings(file, edit) {
  let s
  try { s = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : {} } catch { console.error(`usage-line: ${file} does not parse; nothing written`); process.exit(1) }
  if (s === null || typeof s !== 'object' || Array.isArray(s)) { console.error('usage-line: settings are not an object; nothing written'); process.exit(1) }
  const next = edit(s)
  if (next === undefined) return
  atomic(file, JSON.stringify(next, null, 2) + '\n')
}
function install(file) {
  const q = quote(step)
  if (!q) { console.error('usage-line: the config folder path holds a quote, $, ` or \; nothing written'); process.exit(1) }
  const crumb = flag('--breadcrumb')
  const alone = `node ${q}${crumb ? ' --breadcrumb' : ''}`
  const prefix = crumb ? `i=$(cat); printf '%s' "$i" | node ${q} --breadcrumb --quiet 2>/dev/null; printf '%s' "$i" | `
    : `i=$(cat); printf '%s' "$i" | node ${q} >/dev/null 2>&1; printf '%s' "$i" | `
  settings(file, (s) => {
    const sl = s.statusLine
    if (sl !== undefined && (sl === null || typeof sl !== 'object' || sl.type !== 'command' || typeof sl.command !== 'string')) { console.error('usage-line: statusLine is not a command; nothing written'); process.exit(1) }
    mkdirSync(dirname(step), { recursive: true })
    const self = fileURLToPath(import.meta.url)
    if (self !== step) { copyFileSync(self, `${step}.tmp`); renameSync(`${step}.tmp`, step) }
    const old = sl ? strip(sl.command) : null
    const command = old === null || old === '' ? alone : prefix + old
    if (sl && sl.command === command) return undefined
    return { ...s, statusLine: { ...(sl || {}), type: 'command', command } }
  })
  console.log(`undo: node ${q} --uninstall "${file}"`)
}
// The old command under any form of the prefix this script writes; '' for the step alone.
function strip(cmd) {
  const m = cmd.match(/^i=\$\(cat\); printf '%s' "\$i" \| node "[^"]*usage-line\.mjs"(?: --breadcrumb --quiet 2>\/dev\/null| >\/dev\/null 2>&1); printf '%s' "\$i" \| ([\s\S]*)$/)
  if (m) return m[1]
  return /^node "[^"]*usage-line\.mjs"( --breadcrumb)?$/.test(cmd) ? '' : cmd
}
function uninstall(file) {
  settings(file, (s) => {
    const sl = s.statusLine
    if (!sl || typeof sl.command !== 'string') return undefined
    const old = strip(sl.command)
    if (old === sl.command) return undefined
    const next = { ...s }
    if (old === '') delete next.statusLine; else next.statusLine = { ...sl, command: old }
    return next
  })
}

function read() {
  const now = val('--now') ? Date.parse(val('--now')) : Date.now()
  if (!existsSync(store)) { console.log('none'); return 0 }
  let u
  try { u = JSON.parse(readFileSync(store, 'utf8')) } catch { console.log('?'); return 1 }
  if (!u || u.v !== 1 || !Number.isFinite(Date.parse(u.at))) { console.log('?'); return 1 }
  const age = Math.round((now - Date.parse(u.at)) / 60000)
  const tokens = Number(val('--tokens')), minutes = Number(val('--minutes'))
  const rates = {}
  if (val('--ledger') && existsSync(val('--ledger'))) {
    const lines = readFileSync(val('--ledger'), 'utf8').split('\n').filter((l) => /^- \d{4}-\d\d-\d\d · [^·]+ · run · .* · measured [\d.]+m (\d+)k .* · limits /.test(l)).slice(-RUNS)
    for (const [k, tag] of [['five_hour', '5h'], ['seven_day', '7d']]) {
      const xs = lines.map((l) => { const t = +l.match(/ · measured [\d.]+m (\d+)k/)[1], d = l.match(new RegExp(` · limits .*\\b${tag} \\+(\\d+(?:\\.\\d+)?)%`)); return d && t > 0 ? +d[1] / (t / 100) : null }).filter((x) => x != null)
      if (xs.length >= MIN_RUNS) rates[k] = median(xs)
    }
  }
  const out = []
  for (const k of Object.keys(WINDOWS)) {
    const w = u[k]
    if (!w) continue
    const reset = Date.parse(w.resets_at), toReset = Number.isFinite(reset) ? Math.max(0, Math.round((reset - now) / 60000)) : null
    const used = toReset === 0 ? 0 : w.used_percentage
    let flagged, projected = null
    if (rates[k] != null && Number.isFinite(tokens) && Number.isFinite(minutes) && minutes > 0) {
      projected = round(used + rates[k] * (tokens / 100) * Math.min(1, (toReset ?? minutes) / minutes))
      flagged = projected >= 100
    } else flagged = used >= THRESHOLD[k]
    out.push(`${WINDOWS[k]} ${round(used)}% · resets ${Number.isFinite(reset) ? new Date(reset).toISOString() : '?'} · in ${toReset ?? '?'} min${projected != null ? ` · projected ${projected}%` : ''}${flagged ? ' · flag' : ''}`)
  }
  out.push(age > STALE_MIN ? `stale · read ${age} min ago` : `read ${age} min ago`)
  console.log(out.join('\n'))
  return 0
}

if (flag('--install')) install(val('--install'))
else if (flag('--uninstall')) uninstall(val('--uninstall'))
else if (flag('--read')) process.exit(read())
else { try { stepMode() } catch {} process.exit(0) }
