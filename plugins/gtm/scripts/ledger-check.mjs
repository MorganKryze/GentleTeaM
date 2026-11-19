#!/usr/bin/env node
// Ledger check: reads a GTM ledger and reports each entry off the format
// `- YYYY-MM-DD · <slug> · <kind> · <text>` (templates/ledger.md), a struck entry `- ~~...~~`
// read inside its marks. It prints line numbers and reasons only, never line text, and writes
// nothing. Exit 0 when every entry holds, 1 when one does not, 2 on a usage error. No dependencies.
//
// node ledger-check.mjs [--json] <ledger.md>
// Entries are the lines starting `- `; the heading, the `>` notes and blank lines are skipped.
import { readFileSync, lstatSync } from 'node:fs'

const KINDS = ['lesson', 'ruling', 'minor', 'resolved', 'run', 'usage', 'escape', 'recu', 'refus', 'ship']
const argv = process.argv.slice(2)
const json = argv.includes('--json')
const rest = argv.filter((a) => a !== '--json')
const usage = () => { console.error('usage: node ledger-check.mjs [--json] <ledger.md>'); process.exit(2) }
if (rest.length !== 1 || rest[0].startsWith('-')) usage()
try { if (!lstatSync(rest[0]).isFile()) usage() } catch { usage() }

const bad = []
let entries = 0
readFileSync(rest[0], 'utf8').split('\n').forEach((raw, i) => {
  if (!raw.startsWith('- ')) return
  entries++
  let line = raw.slice(2)
  if (line.startsWith('~~')) {
    if (!/~~\s*$/.test(line)) return bad.push({ line: i + 1, reason: 'strike not closed' })
    line = line.replace(/^~~/, '').replace(/~~\s*$/, '')
  }
  const [date, slug, kind, ...text] = line.split(' · ')
  const d = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date)
  if (!d || new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) !== date) bad.push({ line: i + 1, reason: 'date' })
  else if (!slug || !/^[a-z0-9][a-z0-9._-]*$/.test(slug)) bad.push({ line: i + 1, reason: 'slug' })
  else if (!KINDS.includes(kind)) bad.push({ line: i + 1, reason: 'kind' })
  else if (!text.join(' · ').trim()) bad.push({ line: i + 1, reason: 'no text' })
})

if (json) console.log(JSON.stringify({ entries, bad }))
else {
  console.log(`ledger: ${entries} entries, ${bad.length} off the format`)
  for (const b of bad) console.log(`  line ${b.line}: ${b.reason}`)
}
process.exit(bad.length ? 1 : 0)
