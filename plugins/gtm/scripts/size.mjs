#!/usr/bin/env node
// Measures what the plugin adds to every Claude Code session: the name and description of each
// agent and of each model-invocable skill, and each workflow's name, description and whenToUse.
// Tokens are ceil(characters / 4) per item. Lists items largest first and exits 1 above BUDGET.
// Usage: size.mjs [--plugin <dir>] [--budget <tokens>]. No dependencies.
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const BUDGET = 1500 // the 0.9.0 total, rounded up to the next 100
const argv = process.argv.slice(2), opt = {}
for (let i = 0; i < argv.length; i += 2) {
  if (!/^--(plugin|budget)$/.test(argv[i]) || argv[i + 1] === undefined) { console.error('usage: size.mjs [--plugin <dir>] [--budget <tokens>]'); process.exit(2) }
  opt[argv[i].slice(2)] = argv[i + 1]
}
const plugin = opt.plugin || new URL('..', import.meta.url).pathname
const budget = opt.budget === undefined ? BUDGET : Number(opt.budget)
if (!Number.isSafeInteger(budget) || budget < 0) { console.error('size.mjs: --budget takes a whole number'); process.exit(2) }

const front = (text) => {
  const m = text.match(/^---\n([\s\S]*?)\n---\n/), fm = {}
  for (const line of (m ? m[1] : '').split('\n')) { const kv = line.match(/^([A-Za-z][\w-]*):\s*(.*)$/); if (kv) fm[kv[1]] = kv[2].replace(/^"(.*)"$/, '$1') }
  return fm
}
const list = (d) => (existsSync(d) ? readdirSync(d).sort() : [])
const items = []
const add = (kind, name, ...fields) => items.push({ item: `${kind} ${name}`, tokens: Math.ceil(fields.join('').length / 4) })
for (const f of list(join(plugin, 'agents')).filter((f) => f.endsWith('.md'))) {
  const fm = front(readFileSync(join(plugin, 'agents', f), 'utf8'))
  add('agent', fm.name || f, fm.name || '', fm.description || '')
}
for (const d of list(join(plugin, 'skills'))) {
  const file = join(plugin, 'skills', d, 'SKILL.md')
  if (!existsSync(file)) continue
  const fm = front(readFileSync(file, 'utf8'))
  if (fm['disable-model-invocation'] === 'true') continue
  add('skill', fm.name || d, fm.name || d, fm.description || '')
}
for (const f of list(join(plugin, 'workflows')).filter((f) => f.endsWith('.js'))) {
  const src = readFileSync(join(plugin, 'workflows', f), 'utf8')
  const meta = (src.match(/^export const meta = \{([\s\S]*?)\n\}/m) || [])[1] || ''
  const field = (k) => (meta.match(new RegExp(`^\\s*${k}: '((?:[^'\\\\]|\\\\.)*)'`, 'm')) || [])[1] || ''
  add('workflow', field('name') || f, field('name'), field('description'), field('whenToUse'))
}
items.sort((a, b) => b.tokens - a.tokens || a.item.localeCompare(b.item))
const total = items.reduce((s, x) => s + x.tokens, 0)
for (const x of items) console.log(`${String(x.tokens).padStart(5)}  ${x.item}`)
console.log(`${String(total).padStart(5)}  total, budget ${budget}`)
if (total > budget) { console.error(`size: ${total} tokens per session, over the budget of ${budget}`); process.exit(1) }
