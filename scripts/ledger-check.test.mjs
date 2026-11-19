#!/usr/bin/env node
// plugins/gtm/scripts/ledger-check.mjs on a throwaway ledger: good and struck entries pass; an
// impossible date, a bad slug, an unknown kind, no text and an open strike are each reported by
// line number with no line text; usage errors exit 2. Run by scripts/validate.mjs.
import { mkdtempSync, writeFileSync, symlinkSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { spawnSync } from 'node:child_process'

const script = new URL('../plugins/gtm/scripts/ledger-check.mjs', import.meta.url).pathname
const dir = mkdtempSync(join(tmpdir(), 'gtm-ledger-check-'))
const run = (...a) => spawnSync(process.execPath, [script, ...a], { encoding: 'utf8' })
const errors = []
try {
  const ok = join(dir, 'ok.md')
  writeFileSync(ok, [
    '# Ledger', '', '> - 2026-01-01 · note · inside a quote, skipped', '',
    '- 2026-11-18 · a-slug · ruling · a decision · with a dot', '- ~~2026-11-18 · a.slug_2 · minor · struck~~', '- 2026-02-28 · upstream · recu · id=x',
    '- 2026-11-19 · release · ship · v1 published',
  ].join('\n') + '\n')
  const r = run(ok)
  if (r.status !== 0 || r.stdout.trim() !== 'ledger: 4 entries, 0 off the format') errors.push(`clean ledger: exit ${r.status}, ${r.stdout}`)
  const bad = join(dir, 'bad.md')
  writeFileSync(bad, [
    '- 2026-02-30 · a · minor · SECRET-1', '- 2026-11-18 · Bad Slug · minor · SECRET-2', '- 2026-11-18 · a · device · SECRET-3',
    '- 2026-11-18 · a · lesson · ', '- ~~2026-11-18 · a · minor · SECRET-4', '- 2026-11-18 · a · run · fine',
  ].join('\n') + '\n')
  const b = run('--json', bad)
  const got = b.status === 1 ? JSON.parse(b.stdout) : null
  const want = { entries: 6, bad: [{ line: 1, reason: 'date' }, { line: 2, reason: 'slug' }, { line: 3, reason: 'kind' }, { line: 4, reason: 'no text' }, { line: 5, reason: 'strike not closed' }] }
  if (JSON.stringify(got) !== JSON.stringify(want)) errors.push(`bad ledger: exit ${b.status}, ${b.stdout}`)
  if (/SECRET/.test(run(bad).stdout)) errors.push('line text in the output')
  symlinkSync(ok, join(dir, 'link.md'))
  for (const args of [[], [ok, ok], ['--x'], [join(dir, 'none.md')], [dir], [join(dir, 'link.md')]]) {
    if (run(...args).status !== 2) errors.push(`usage error not refused: ${args.join(' ')}`)
  }
} finally { rmSync(dir, { recursive: true, force: true }) }
if (errors.length) { console.error(errors.join('\n')); process.exit(1) }
console.log('ledger-check: cases OK')
