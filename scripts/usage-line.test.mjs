#!/usr/bin/env node
// Fixture test for plugins/gtm/scripts/usage-line.mjs, cases F1-F9 of the usage-aware spec plus
// the breadcrumb and the undo. Each case runs with CLAUDE_CONFIG_DIR in a temporary folder,
// removed after the run; the composed status line runs in `sh`. Run by scripts/validate.mjs.
// No dependencies.
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, existsSync, rmSync, readdirSync, utimesSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { spawnSync } from 'node:child_process'
import { deepStrictEqual } from 'node:assert'

const root = new URL('..', import.meta.url).pathname
const script = join(root, 'plugins/gtm/scripts/usage-line.mjs')
const fx = (f) => readFileSync(join(root, 'scripts/fixtures/usage-line', f), 'utf8')
const errors = [], tmp = mkdtempSync(join(tmpdir(), 'gtm-usage-line-'))
let n = 0
function box() {
  const dir = join(tmp, String(n++)), config = join(dir, 'config'), project = join(dir, 'project')
  mkdirSync(config, { recursive: true }); mkdirSync(project, { recursive: true })
  const run = (args, input = '', file = script) => spawnSync(process.execPath, [file, ...args], { input, encoding: 'utf8', env: { ...process.env, CLAUDE_CONFIG_DIR: config } })
  const sh = (command, input) => spawnSync('sh', ['-c', command], { input, encoding: 'utf8', env: { ...process.env, CLAUDE_CONFIG_DIR: config } })
  return { dir, config, project, run, sh, store: join(config, 'gtm/usage.json'), settings: join(config, 'settings.json') }
}
const check = (name, ok, detail = '') => { if (!ok) errors.push(`${name}${detail ? `: ${detail}` : ''}`) }
const status = (b, f) => fx(f).replaceAll('PROJECT', b.project)

try {
  { // F1: only the numbers are stored; the usage line is printed.
    const b = box(), r = b.run([], status(b, 'f1-status.json'))
    const u = existsSync(b.store) ? JSON.parse(readFileSync(b.store, 'utf8')) : {}
    check('F1 exit', r.status === 0)
    check('F1 line', r.stdout === '5h 82% · 7d 41%\n', JSON.stringify(r.stdout))
    check('F1 keys', JSON.stringify(Object.keys(u).sort()) === '["at","five_hour","seven_day","spend_limit","v"]', Object.keys(u).join())
    check('F1 values', u.v === 1 && u.five_hour?.used_percentage === 82 && u.five_hour?.resets_at === '2026-10-16T12:00:00.000Z' && u.seven_day?.resets_at === '2026-10-20T08:00:00.000Z' && u.spend_limit?.resets_at === null)
    check('F1 window keys', ['five_hour', 'seven_day', 'spend_limit'].every((k) => Object.keys(u[k] || {}).sort().join() === 'resets_at,used_percentage'))
    check('F1 no id, path or cost', !/abc-123|transcript|jsonl|1\.23|project/.test(readFileSync(b.store, 'utf8')))
    check('F1 no temp left', readdirSync(join(b.config, 'gtm')).join() === 'usage.json')
  }
  for (const [name, f] of [['F2 no rate_limits', 'f2-no-limits.json'], ['F3 negative or text', 'f3-negative.json']]) {
    const b = box(), r = b.run([], status(b, f))
    check(name, r.status === 0 && r.stdout === '' && !existsSync(b.store), `${r.status} ${r.stdout}`)
  }
  { // Garbage in: no write, exit 0.
    const b = box(), r = b.run([], 'not json')
    check('step on garbage', r.status === 0 && !existsSync(b.store))
  }
  { // F4: claude-hud kept byte for byte, other keys deep-equal, a rerun a no-op; undo restores it.
    const b = box(), before = JSON.parse(fx('f4-claude-hud.json'))
    writeFileSync(b.settings, fx('f4-claude-hud.json'))
    const r1 = b.run(['--install', b.settings]), once = readFileSync(b.settings, 'utf8')
    const r2 = b.run(['--install', b.settings]), twice = readFileSync(b.settings, 'utf8')
    const after = JSON.parse(once)
    check('F4 exit', r1.status === 0 && r2.status === 0, r1.stderr)
    check('F4 old command kept', after.statusLine.command.endsWith(`| ${before.statusLine.command}`) && after.statusLine.command.startsWith("i=$(cat); printf '%s' \"$i\" | node \""))
    const { statusLine: s1, ...rest1 } = after, { statusLine: s0, ...rest0 } = before
    try { deepStrictEqual(rest1, rest0); deepStrictEqual({ ...s1, command: 0 }, { ...s0, command: 0 }) } catch { check('F4 other keys deep-equal', false) }
    check('F4 rerun no-op', once === twice)
    check('F4 copy', existsSync(join(b.config, 'gtm/usage-line.mjs')))
    check('F4 undo shown', r1.stdout.includes('--uninstall'))
    b.run(['--uninstall', b.settings])
    try { deepStrictEqual(JSON.parse(readFileSync(b.settings, 'utf8')), before) } catch { check('F4 undo restores', false) }
  }
  { // F5: no settings file, no status line: the step alone.
    const b = box(), r = b.run(['--install', b.settings])
    const s = JSON.parse(readFileSync(b.settings, 'utf8'))
    check('F5', r.status === 0 && s.statusLine.type === 'command' && s.statusLine.command === `node "${join(b.config, 'gtm/usage-line.mjs')}"`, s.statusLine?.command)
    const out = b.sh(s.statusLine.command, status(b, 'f1-status.json'))
    check('F5 runs alone', out.stdout === '5h 82% · 7d 41%\n', out.stdout + out.stderr)
    b.run(['--uninstall', b.settings])
    check('F5 undo', !('statusLine' in JSON.parse(readFileSync(b.settings, 'utf8'))))
  }
  for (const [name, f] of [['F6 broken JSON', 'f6-broken.json'], ['F6 not a command', 'f6-not-command.json']]) {
    const b = box()
    writeFileSync(b.settings, fx(f))
    const r = b.run(['--install', b.settings])
    check(name, r.status !== 0 && readFileSync(b.settings, 'utf8') === fx(f) && !existsSync(join(b.config, 'gtm')), `${r.status}`)
  }
  { // F7: the old output shows when the step fails or is gone.
    const b = box()
    writeFileSync(b.settings, JSON.stringify({ statusLine: { type: 'command', command: "cat >/dev/null; echo OLD" } }))
    b.run(['--install', b.settings])
    const cmd = JSON.parse(readFileSync(b.settings, 'utf8')).statusLine.command
    const ok = b.sh(cmd, status(b, 'f1-status.json'))
    check('F7 step works, old shown', ok.stdout === 'OLD\n' && existsSync(b.store), ok.stdout + ok.stderr)
    const bad = b.sh(cmd, 'not json')
    check('F7 step fails', bad.stdout === 'OLD\n', bad.stdout)
    rmSync(join(b.config, 'gtm'), { recursive: true })
    const gone = b.sh(cmd, status(b, 'f1-status.json'))
    check('F7 step gone', gone.stdout === 'OLD\n' && gone.stderr === '', gone.stdout + gone.stderr)
  }
  { // Breadcrumb: NOW.md's first `>` line, cleaned, before the old output; none once shipped.
    const b = box()
    mkdirSync(join(b.project, 'gtmroot'))
    writeFileSync(join(b.project, 'CLAUDE.md'), 'notes\nGTM root: gtmroot\n')
    writeFileSync(join(b.project, 'gtmroot/NOW.md'), '# x · 10:00\n\n> Epic › feat/x › delivery › task 2/5‮ · 10:37\n> second\n')
    writeFileSync(b.settings, JSON.stringify({ statusLine: { type: 'command', command: "cat >/dev/null; echo OLD" } }))
    b.run(['--install', b.settings, '--breadcrumb'])
    const cmd = JSON.parse(readFileSync(b.settings, 'utf8')).statusLine.command
    const r = b.sh(cmd, status(b, 'f1-status.json'))
    check('breadcrumb first', r.stdout === 'Epic › feat/x › delivery › task 2/5 · 10:37\nOLD\n', JSON.stringify(r.stdout))
    writeFileSync(join(b.project, 'gtmroot/NOW.md'), '# x · 10:00\n\n> Epic › feat/x › shipped\n')
    check('breadcrumb shipped', b.sh(cmd, status(b, 'f1-status.json')).stdout === 'OLD\n')
    b.run(['--install', b.settings])
    check('breadcrumb off again', !JSON.parse(readFileSync(b.settings, 'utf8')).statusLine.command.includes('--breadcrumb'))
    b.run(['--uninstall', b.settings])
    check('breadcrumb undo', JSON.parse(readFileSync(b.settings, 'utf8')).statusLine.command === 'cat >/dev/null; echo OLD')
  }
  { // Breadcrumb under an absolute root, as init allows in CLAUDE.local.md.
    const b = box(), abs = join(b.dir, 'outside')
    mkdirSync(abs)
    writeFileSync(join(b.project, 'CLAUDE.local.md'), `GTM root: ${abs}\n`)
    writeFileSync(join(abs, 'NOW.md'), '> Epic › feat/y › plan\n')
    const r = b.run(['--breadcrumb', '--quiet'], status(b, 'f1-status.json'))
    check('breadcrumb absolute root', r.stdout === 'Epic › feat/y › plan\n', JSON.stringify(r.stdout))
  }
  { // F8: the reader.
    const b = box(), at = '2026-10-15T10:00:00Z', w = (o) => { mkdirSync(join(b.config, 'gtm'), { recursive: true }); writeFileSync(b.store, JSON.stringify(o)) }
    check('F8 none', b.run(['--read', '--now', at]).stdout === 'none\n')
    w({ v: 1, at: '2026-10-15T09:50:00Z', five_hour: { used_percentage: 95, resets_at: '2026-10-15T09:55:00Z' }, seven_day: { used_percentage: 92, resets_at: '2026-10-18T10:00:00Z' } })
    const r = b.run(['--read', '--now', at])
    check('F8 passed reset', /^5h 0% · resets 2026-10-15T09:55:00.000Z · in 0 min\n/.test(r.stdout), r.stdout)
    check('F8 threshold 7d', /^7d 92% · resets 2026-10-18T10:00:00.000Z · in 4320 min · flag$/m.test(r.stdout), r.stdout)
    check('F8 age', /^read 10 min ago$/m.test(r.stdout))
    w({ v: 1, at: '2026-10-15T09:29:00Z', five_hour: { used_percentage: 10, resets_at: null } })
    check('F8 stale', /^stale · read 31 min ago$/m.test(b.run(['--read', '--now', at]).stdout))
    w({ v: 2, at })
    const v2 = b.run(['--read', '--now', at])
    check('F8 v2', v2.stdout === '?\n' && v2.status === 1)
    writeFileSync(b.store, '{ broken')
    const br = b.run(['--read', '--now', at])
    check('F8 broken', br.stdout === '?\n' && br.status === 1)
    w({ v: 1, at, five_hour: { used_percentage: 79, resets_at: null }, spend_limit: { used_percentage: 90, resets_at: null } })
    const th = b.run(['--read', '--now', at]).stdout
    check('F8 thresholds', /^5h 79% .* min$/m.test(th) && /^spend 90% .* · flag$/m.test(th), th)
  }
  { // F9: 82%, 3.0 per 100k from the last measured runs with limits, 640k and 40 min left.
    const b = box(), at = '2026-10-15T10:00:00Z', ledger = join(root, 'scripts/fixtures/usage-line/f9-ledger.md')
    mkdirSync(join(b.config, 'gtm'), { recursive: true })
    for (const [reset, want] of [['2026-10-15T12:00:00Z', 'projected 101.2% · flag'], ['2026-10-15T10:20:00Z', 'projected 91.6%']]) {
      writeFileSync(b.store, JSON.stringify({ v: 1, at, five_hour: { used_percentage: 82, resets_at: reset }, seven_day: { used_percentage: 92, resets_at: null } }))
      const r = b.run(['--read', '--now', at, '--ledger', ledger, '--tokens', '640', '--minutes', '40'])
      check(`F9 reset ${reset}`, new RegExp(`^5h 82% · .* · ${want.replace(/[.+]/g, '\\$&')}$`, 'm').test(r.stdout), r.stdout)
      check('F9 7d: one run with limits, threshold kept', /^7d 92% · resets \? · in \? min · flag$/m.test(r.stdout), r.stdout)
    }
  }
} finally { rmSync(tmp, { recursive: true, force: true }) }

if (errors.length) { console.error(errors.join('\n')); process.exit(1) }
console.log('usage-line: F1-F9, breadcrumb and undo OK')
