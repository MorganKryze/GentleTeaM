#!/usr/bin/env node
// Role split: reads the agent files Claude Code writes beside a workflow run's journal
// (agent-<id>.meta.json and agent-<id>.jsonl) and prints each role's agents, agent-seconds and
// share of tokens. It prints role names and numbers only, never message text, and reads regular
// files only: a link, a missing file or an unknown shape prints `roles ?` and exits 1, with no
// partial result. No dependencies.
//
// node role-split.mjs [--json] [--also <role>:<seconds>:<tokens>]... <run folder>...
// An agent's tokens are its last turn's input context (input, cache creation and cache read),
// which sum to the run's `subagent_tokens`; its seconds run from its first line to its last.
// `--also` adds one dispatched agent (spec, plan, final review, fix wave). The text form lists
// roles at 5% of the tokens or more, largest first; --json lists every role.
// Exit 0: split printed. Exit 1: unknown shape. Exit 2: usage.
import { lstatSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const ROLE = /^(?:[a-z0-9-]{1,40}:)?[a-z0-9-]{1,40}$/
const ENTRY = /^agent-([A-Za-z0-9]{1,64})\.(meta\.json|jsonl)$/
const STAMP = /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?Z$/
const count = (n) => Number.isSafeInteger(n) && n >= 0

class Shape extends Error {}
const odd = (why) => { throw new Shape(why) }
function stop(code, why) {
  console.log('roles ?')
  console.error(`role-split: ${why}`)
  process.exit(code)
}

function regular(path, name) {
  let st
  try { st = lstatSync(path) } catch { odd(`${name} is missing`) }
  if (!st.isFile()) odd(`${name} is not a regular file`)
  return readFileSync(path, 'utf8')
}

function json(text, name) {
  try { return JSON.parse(text) } catch { odd(`${name} is not JSON`) }
}

function agent(dir, id) {
  const meta = json(regular(join(dir, `agent-${id}.meta.json`), `agent-${id}.meta.json`), `agent-${id}.meta.json`)
  const name = `agent-${id}.jsonl`
  const lines = regular(join(dir, name), name).split('\n').filter((l) => l.trim()).map((l) => json(l, name))
  if (typeof meta?.agentType !== 'string' || !ROLE.test(meta.agentType)) odd(`agent-${id}.meta.json: agentType is not a role name`)
  const first = lines[0]?.timestamp
  const last = lines.at(-1)?.timestamp
  if (!STAMP.test(first) || !STAMP.test(last) || Date.parse(last) < Date.parse(first)) odd(`${name}: no time span`)
  const usage = lines.filter((l) => l?.type === 'assistant' && l.message?.usage).at(-1)?.message.usage
  const parts = [usage?.input_tokens, usage?.cache_creation_input_tokens, usage?.cache_read_input_tokens]
  if (!parts.every(count)) odd(`${name}: no token count`)
  const role = meta.agentType.replace(/^gtm:/, '')
  return { role, seconds: Math.round((Date.parse(last) - Date.parse(first)) / 1000), tokens: parts.reduce((a, b) => a + b) }
}

function run(dir) {
  let st
  try { st = lstatSync(dir) } catch { odd('a run folder is missing') }
  if (!st.isDirectory()) odd('a run folder is not a folder')
  regular(join(dir, 'journal.jsonl'), 'journal.jsonl')
  const ids = new Set()
  for (const entry of readdirSync(dir)) {
    if (!entry.startsWith('agent-')) continue
    const m = entry.match(ENTRY)
    if (!m) odd('an agent file has an unknown name')
    ids.add(m[1])
  }
  if (!ids.size) odd('a run folder has no agent files')
  return [...ids.keys()].sort().map((id) => agent(dir, id))
}

const args = process.argv.slice(2)
const asJson = args.includes('--json')
const agents = []
const dirs = []
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--json') continue
  if (args[i] === '--also') {
    const m = String(args[++i]).match(/^(.+):(\d+):(\d+)$/)
    if (!m || !ROLE.test(m[1])) stop(2, '--also takes <role>:<seconds>:<tokens>')
    agents.push({ role: m[1].replace(/^gtm:/, ''), seconds: Number(m[2]), tokens: Number(m[3]) })
  } else if (args[i].startsWith('--')) stop(2, 'unknown option')
  else dirs.push(args[i])
}
if (!dirs.length) stop(2, 'usage: role-split.mjs [--json] [--also <role>:<seconds>:<tokens>]... <run folder>...')
try { for (const dir of dirs) agents.push(...run(dir)) } catch (e) {
  if (e instanceof Shape) stop(1, e.message)
  stop(1, 'the agent files could not be read')
}

const by = new Map()
for (const a of agents) {
  const r = by.get(a.role) || { role: a.role, agents: 0, seconds: 0, tokens: 0 }
  r.agents += 1; r.seconds += a.seconds; r.tokens += a.tokens
  by.set(a.role, r)
}
const total = agents.reduce((t, a) => ({ agents: t.agents + 1, seconds: t.seconds + a.seconds, tokens: t.tokens + a.tokens }), { agents: 0, seconds: 0, tokens: 0 })
if (!total.tokens) stop(1, 'no tokens counted')
const roles = [...by.values()].sort((a, b) => b.tokens - a.tokens || a.role.localeCompare(b.role))
  .map((r) => ({ ...r, share: Math.round((100 * r.tokens) / total.tokens) }))
if (asJson) console.log(JSON.stringify({ roles, total }))
else console.log(`roles ${roles.filter((r) => 100 * r.tokens >= 5 * total.tokens).map((r) => `${r.role} ${r.share}%`).join(', ')}`)
