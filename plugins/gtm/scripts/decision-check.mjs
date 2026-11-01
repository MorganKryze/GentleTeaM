#!/usr/bin/env node
// Decision check: the form of a spec's Decisions table and cards, read by position and identifiers,
// never by a word of any language. It proves form, not quality: a false alternative still passes.
// It reads the spec and the config as data, changes nothing, and prints ids and rule names only.
// The table is the first one holding a `D<n>` or `R<n>` row; a card is a line wholly in bold that
// carries a `D<n>`, and runs to the next card or `## ` heading.
//
// node decision-check.mjs --spec <file> --config <root>/config.yml
// Exit 0: passed, counts printed. Exit 1: gaps, one `<id>: <rule>` line each. Exit 2: usage, or a
// file that cannot be read, which is never a pass. No dependencies.
import { readFileSync } from 'node:fs'
import { parseYaml } from './footprint-check.mjs'

const ROLES = ['reviewer', 'security-reviewer', 'data-reviewer', 'final-reviewer', 'ux-qa', 'design-critic']
const COLUMNS = 7 // id, decision, choice, why, cost if wrong, confirmation, status
const OLDER_COLUMNS = 5
const COST = 4, CONFIRMATION = 5
const COST_WORDS = 3
const ID = /^[DR]\d+$/
const hasCommand = (k) => typeof verify[k] === 'string' && !/^\s*(~|null)?\s*$/i.test(verify[k])

const stop = (msg) => { console.error(`decision-check: ${msg}`); process.exit(2) }
const argv = process.argv.slice(2), opt = {}
for (let i = 0; i < argv.length; i += 2) {
  if (!/^--(spec|config)$/.test(argv[i]) || argv[i + 1] === undefined) stop('usage: decision-check.mjs --spec <file> --config <file>')
  opt[argv[i].slice(2)] = argv[i + 1]
}
if (!opt.spec || !opt.config) stop('usage: decision-check.mjs --spec <file> --config <file>')
const read = (file) => { try { return readFileSync(file, 'utf8') } catch { stop(`cannot read ${file}`) } }
const text = read(opt.spec)
const verify = parseYaml(read(opt.config)).verify ?? {}
const gate = [verify.gate ?? []].flat()

// Fenced lines read as blank: a table shown in a fence is not the record.
let fenced = false
const lines = text.split(/\r?\n/).map((l) => {
  if (/^\s*```/.test(l)) { fenced = !fenced; return '' }
  return fenced ? '' : l
})
const isRow = (l) => l.trim().startsWith('|')
// An escaped pipe stays in its cell.
const cells = (l) => l.trim().replace(/^\|/, '').replace(/(?<!\\)\|$/, '').split(/(?<!\\)\|/).map((c) => c.trim())
const tables = (block) => {
  const found = []
  for (let i = 0; i + 1 < block.length; i++) {
    if (!isRow(block[i]) || !/^[\s|:-]*-[\s|:-]*$/.test(block[i + 1])) continue
    let end = i + 2
    while (end < block.length && isRow(block[end])) end++
    found.push({ at: i, head: cells(block[i]), rows: block.slice(i + 2, end).map(cells) })
    i = end - 1
  }
  return found
}

const titles = lines.flatMap((l, at) => {
  const id = /^\*\*(.*)\*\*\s*$/.exec(l.trim())?.[1].match(/\bD\d+\b/)?.[0]
  return id ? [{ id, at }] : []
})
const cardEnd = (at) => {
  const next = lines.findIndex((l, i) => i > at && (/^## /.test(l) || titles.some((t) => t.at === i)))
  return next < 0 ? lines.length : next
}

const gaps = []
const confirmation = (cell, name) => {
  const acceptance = [...cell.matchAll(/\bA\d+\b/g)].map((m) => m[0])
  const keys = [...cell.matchAll(/\bverify\.([\w-]+)/g)].map((m) => m[1])
  const roles = [...cell.matchAll(/\breview:\s*([\w-]+)/g)].map((m) => m[1])
  if (!acceptance.length && !keys.length && !roles.length) gaps.push(`${name}: confirmation-none`)
  if (acceptance.some((a) => !lines.some((l) => l.startsWith(`- ${a} `)))) gaps.push(`${name}: confirmation-line`)
  if (keys.some((k) => !gate.includes(k) || !hasCommand(k))) gaps.push(`${name}: confirmation-key`)
  if (roles.some((r) => !ROLES.includes(r))) gaps.push(`${name}: confirmation-role`)
}
const checkRows = (rows) => {
  const seen = new Set()
  rows.forEach((row, i) => {
    const name = ID.test(row[0]) ? row[0] : `row ${i + 1}`
    if (name !== row[0]) gaps.push(`${name}: id`)
    else if (seen.has(name)) gaps.push(`${name}: twice`)
    seen.add(name)
    if (row.length !== COLUMNS) return void gaps.push(`${name}: cells`)
    if (row.slice(1).some((c) => !c)) return void gaps.push(`${name}: empty`)
    if (row[COST].split(/\s+/).length < COST_WORDS) gaps.push(`${name}: cost`)
    confirmation(row[CONFIRMATION], name)
  })
  for (const id of seen) if (id.startsWith('D') && !titles.some((t) => t.id === id)) gaps.push(`${id}: no-card`)
}
const checkCards = () => {
  for (const { id, at } of titles) {
    const body = lines.slice(at + 1, cardEnd(at))
    const options = tables(body)[0]
    if ((options?.rows.length ?? 0) < 2) gaps.push(`${id}: options`)
    else if (!body.slice(0, options.at).some((l) => l.trim())) gaps.push(`${id}: criteria`)
  }
}

const table = tables(lines).find((t) => t.rows.some((r) => ID.test(r[0])))
// The Status of the header block alone: a quote in the body cannot widen the exemption.
const header = lines.slice(0, Math.max(0, lines.findIndex((l) => /^## /.test(l))))
const amended = header.some((l) => /^>\s*Status:.*\bamended\b/.test(l))
if (!table) gaps.push('table: none')
else if (table.head.length === OLDER_COLUMNS && amended) {
  console.log('decision-check: older form, not checked')
  process.exit(0)
} else if (table.head.length === OLDER_COLUMNS) gaps.push('table: five columns')
else { checkRows(table.rows); checkCards() }

if (gaps.length) {
  console.log(gaps.join('\n'))
  console.log(`decision-check: ${gaps.length} gaps`)
  process.exitCode = 1
} else console.log(`decision-check: ${table.rows.length} rows, ${titles.length} cards`)
