#!/usr/bin/env node
// Measure: reads the task lines of every `<root>/reports/*/progress.md` and prints, per review
// path and per implementer model, how many tasks ran, how many ended CLEAN, how many were cut
// (their line ends `· cut <report>` or `· cut none`, templates/delivery.md), the mean correction
// rounds and the median minutes and tokens. It prints numbers only, never line text, writes
// nothing, and skips links. A field a line lacks is left out of that mean or median, never
// guessed. No dependencies.
//
// node measure.mjs [--json] [--since <YYYY-MM-DD>] <root>
// --since keeps the tasks whose `start` instant is on or after that day (a line with no start
// instant is left out).
import { readdirSync, readFileSync, lstatSync } from 'node:fs'
import { join } from 'node:path'

const argv = process.argv.slice(2)
const json = argv.includes('--json')
const si = argv.indexOf('--since')
const since = si >= 0 ? argv[si + 1] : null
const rest = argv.filter((a, i) => !a.startsWith('--') && (si < 0 || i !== si + 1))
const root = rest[0]
const usage = () => { console.error('usage: node measure.mjs [--json] [--since YYYY-MM-DD] <root>'); process.exit(2) }
const flags = argv.filter((a, i) => a.startsWith('--') && (si < 0 || i !== si + 1))
if (flags.some((f) => !['--json', '--since'].includes(f)) || new Set(flags).size !== flags.length || rest.length !== 1 || (since !== null && !/^\d{4}-\d{2}-\d{2}$/.test(since || ''))) usage()
let reports
try { if (!lstatSync(root).isDirectory()) usage(); reports = join(root, 'reports'); if (!lstatSync(reports).isDirectory()) usage() } catch { usage() }

const tasks = []
for (const d of readdirSync(reports)) {
  const f = join(reports, d, 'progress.md')
  try { if (!lstatSync(join(reports, d)).isDirectory() || !lstatSync(f).isFile()) continue } catch { continue }
  for (const line of readFileSync(f, 'utf8').split('\n')) {
    if (!/^- task \d+ · /.test(line)) continue
    const parts = line.split(' · ')
    const start = line.match(/ · start (\d{4}-\d{2}-\d{2})T/)
    if (since && (!start || start[1] < since)) continue
    const num = (re) => { const m = line.match(re); return m ? Number(m[1]) : null }
    const path = (line.match(/ · (text|code|full) path\b/) || line.match(/ · path (text|code|full)\b/) || [])[1] || '?'
    const model = (line.match(/ · models [^·]*\bimplementer (opus|sonnet|haiku|fable)\b/) || [])[1] || '?'
    tasks.push({
      path, model, clean: parts[1].startsWith('CLEAN'), cut: / · cut (none|\S+)\s*$/.test(line),
      rounds: num(/ · rounds (\d+)\b/), seconds: num(/ · (\d+) s\b/) ?? span(line), tokens: num(/ · (\d+)k\b/) ?? (/ · 0 agents\b/.test(line) ? 0 : null),
    })
  }
}

// A line with no seconds segment, such as a task the lead did in session: its end minus its start,
// when both are instants; any `?` leaves it unknown.
function span(line) {
  const t = (k) => { const m = line.match(new RegExp(` · ${k} (\\d{4}-\\d\\d-\\d\\dT\\d\\d:\\d\\d:\\d\\dZ)\\b`)); return m ? Date.parse(m[1]) : NaN }
  const s = (t('end') - t('start')) / 1000
  return Number.isFinite(s) && s >= 0 ? s : null
}
const median = (xs) => { if (!xs.length) return null; const s = [...xs].sort((a, b) => a - b); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2 }
const round1 = (x) => (x === null ? null : Math.round(x * 10) / 10)
const sum = (group) => {
  const has = (k) => group.map((t) => t[k]).filter((v) => v !== null)
  const r = has('rounds')
  return {
    tasks: group.length, clean: group.filter((t) => t.clean).length, cut: group.filter((t) => t.cut).length,
    rounds: r.length ? round1(r.reduce((a, b) => a + b, 0) / r.length) : null,
    minutes: round1(median(has('seconds')) === null ? null : median(has('seconds')) / 60),
    tokens: median(has('tokens')),
  }
}
const by = (k) => Object.fromEntries([...new Set(tasks.map((t) => t[k]))].sort().map((v) => [v, sum(tasks.filter((t) => t[k] === v))]))
const out = { all: sum(tasks), path: by('path'), implementer: by('model') }

if (json) { console.log(JSON.stringify(out)); process.exit(0) }
const show = (v) => (v === null ? '?' : String(v))
const row = (name, s) => `| ${name} | ${s.tasks} | ${s.clean} | ${s.cut} | ${show(s.rounds)} | ${show(s.minutes)} | ${show(s.tokens)} |`
console.log('| group | tasks | clean | cut | mean rounds | median min | median k tokens |\n| --- | --- | --- | --- | --- | --- | --- |')
console.log(row('all', out.all))
for (const [k, s] of Object.entries(out.path)) console.log(row(`path ${k}`, s))
for (const [k, s] of Object.entries(out.implementer)) console.log(row(`implementer ${k}`, s))
