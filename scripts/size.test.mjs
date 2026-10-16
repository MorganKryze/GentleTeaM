#!/usr/bin/env node
// Fixture test for plugins/gtm/scripts/size.mjs: exact counts on scripts/fixtures/size/mini (an
// agent, a model-invocable skill, a human-only skill, a workflow), the budget boundary, and the
// real plugin with 400 characters added to an agent (over) or to a human-only skill (unchanged).
// Copies go to a temporary folder, removed after the run. Run by scripts/validate.mjs. No dependencies.
import { mkdtempSync, cpSync, readFileSync, writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { spawnSync } from 'node:child_process'

const root = new URL('..', import.meta.url).pathname
const script = join(root, 'plugins/gtm/scripts/size.mjs')
const mini = join(root, 'scripts/fixtures/size/mini')
const errors = []
const run = (...args) => spawnSync(process.execPath, [script, ...args], { encoding: 'utf8' })
const expect = (name, r, exit, re) => {
  if (r.status !== exit) errors.push(`${name}: exit ${r.status}, want ${exit}`)
  if (re && !re.test(r.stdout)) errors.push(`${name}: output lacks ${re}`)
}

expect('mini', run('--plugin', mini, '--budget', '20'), 0, /^ +10 {2}skill open\n +6 {2}workflow w\n +4 {2}agent a\n +20 {2}total, budget 20\n$/)
expect('mini over by one', run('--plugin', mini, '--budget', '19'), 1)
expect('usage', run('--budget', 'lots'), 2)
const real = run()
expect('real plugin', real, 0)
const total = +(real.stdout.match(/(\d+) {2}total/) || [])[1]
const tmp = mkdtempSync(join(tmpdir(), 'gtm-size-'))
try {
  for (const [name, file, exit] of [['agent +400', 'agents/reviewer.md', 1], ['human-only skill +400', 'skills/status/SKILL.md', 0]]) {
    const copy = join(tmp, name.replace(/\W+/g, '-'))
    cpSync(join(root, 'plugins/gtm'), copy, { recursive: true })
    const f = join(copy, file)
    writeFileSync(f, readFileSync(f, 'utf8').replace(/^(description: .*)$/m, `$1${'w'.repeat(400)}`))
    const r = run('--plugin', copy)
    expect(name, r, exit)
    if (exit === 0 && !r.stdout.includes(`${total}  total`)) errors.push(`${name}: total moved from ${total}`)
  }
} finally { rmSync(tmp, { recursive: true, force: true }) }

if (errors.length) { console.error(errors.join('\n')); process.exit(1) }
console.log(`size: 6 scenarios OK (${total} tokens per session)`)
