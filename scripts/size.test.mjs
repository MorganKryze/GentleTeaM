#!/usr/bin/env node
// Fixture test for plugins/gtm/scripts/size.mjs: exact counts on scripts/fixtures/size/mini (an
// agent, a model-invocable skill, a human-only skill, a workflow), the budget boundary, and the
// real plugin with 400 characters added to an agent (over) or to a human-only skill (unchanged),
// a missing or empty folder (exit 2), and a plugin copy under a path with a space (same total).
// Copies go to a temporary folder, removed after the run. Run by scripts/validate.mjs. No dependencies.
import { mkdtempSync, mkdirSync, cpSync, readFileSync, writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const script = join(root, 'plugins/gtm/scripts/size.mjs')
const mini = join(root, 'scripts/fixtures/size/mini')
const errors = []
const runAt = (at, ...args) => spawnSync(process.execPath, [at, ...args], { encoding: 'utf8' })
const run = (...args) => runAt(script, ...args)
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
  const empty = join(tmp, 'empty')
  mkdirSync(empty)
  for (const [name, dir] of [['missing folder', join(tmp, 'none')], ['empty folder', empty]]) {
    const r = run('--plugin', dir)
    expect(name, r, 2)
    if (!r.stderr.includes(dir)) errors.push(`${name}: stderr does not name ${dir}`)
  }
  const spaced = join(tmp, 'a b', 'gtm')
  cpSync(join(root, 'plugins/gtm'), spaced, { recursive: true })
  const r = runAt(join(spaced, 'scripts/size.mjs'))
  expect('path with a space', r, 0)
  if (!r.stdout.includes(`${total}  total`)) errors.push(`path with a space: total moved from ${total}`)
} finally { rmSync(tmp, { recursive: true, force: true }) }

if (errors.length) { console.error(errors.join('\n')); process.exit(1) }
console.log(`size: 9 scenarios OK (${total} tokens per session)`)
