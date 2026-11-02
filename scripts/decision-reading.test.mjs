#!/usr/bin/env node
// Pins the spec skill's decision steps: each clause that keeps, skips or exempts sits once in the
// skill, whitespace joined, and the check's command, run as the skill writes it, passes a spec the
// check accepts and keeps its exit 2 on a missing spec. No other wording is pinned. Run by
// scripts/validate.mjs. No dependencies.
import { spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const plugin = new URL('../plugins/gtm/', import.meta.url).pathname
const skill = readFileSync(join(plugin, 'skills/spec/SKILL.md'), 'utf8').replace(/\s+/g, ' ')
const errors = []
const PHRASES = [
  'Any other exit: a Heads-up saying the form was not checked; that code never counts as a pass.',
  'send the list to the architect once; gaps that remain go in a Heads-up with the spec, none hidden.',
  'An objection never blocks: no send-back, no verdict, no second reader.',
  'The human stays free to answer against it, and it stays on the card after the answer.',
  'Nothing usable back: show the cards with one line saying no second reading ran.',
  "`decision review: off` in the team settings' Gates: skip it and say so in one line; no such line, or any other value: it runs.",
  "no edit but this step's Decisions and Status and §2b's objections",
]
for (const p of PHRASES) if (skill.split(p).length !== 2) errors.push(`spec skill: "${p}" must appear once`)

const command = /`(node "\$\{CLAUDE_PLUGIN_ROOT\}\/scripts\/decision-check\.mjs"[^`]*)`/.exec(skill)?.[1]
if (!command) errors.push('spec skill: no decision-check command')
else {
  const dir = mkdtempSync(join(tmpdir(), 'gtm-decision-reading-'))
  writeFileSync(join(dir, 'config.yml'), 'verify:\n  test: "node t"\n  gate: [test]\n')
  const run = (spec) => spawnSync('bash', ['-c', command.replaceAll('<spec>', spec).replaceAll('<root>', dir)], { encoding: 'utf8', env: { ...process.env, CLAUDE_PLUGIN_ROOT: plugin } })
  const r = run(join(plugin, 'templates/spec.md'))
  const unread = run(join(dir, 'missing.md'))
  rmSync(dir, { recursive: true, force: true })
  if (r.status !== 0 || !r.stdout.includes('2 rows, 1 cards')) errors.push(`spec skill: its command reads exit ${r.status}: ${r.stdout}${r.stderr}`)
  if (unread.status !== 2) errors.push(`spec skill: its command reads exit ${unread.status} on a missing spec, never a pass: ${unread.stdout}${unread.stderr}`)
}

if (errors.length) { console.error(errors.join('\n')); process.exit(1) }
console.log(`decision-reading: ${PHRASES.length} clauses, the check's command run as written`)
