#!/usr/bin/env node
// plugins/gtm/scripts/measure.mjs over a throwaway GTM root: grouping by path and implementer, the
// CLEAN count, means and medians that skip a missing field, --since, links skipped, usage errors,
// and no line text in the output. Run by scripts/validate.mjs.
import { mkdtempSync, mkdirSync, writeFileSync, symlinkSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { spawnSync } from 'node:child_process'

const script = new URL('../plugins/gtm/scripts/measure.mjs', import.meta.url).pathname
const root = mkdtempSync(join(tmpdir(), 'gtm-measure-'))
const run = (...a) => spawnSync(process.execPath, [script, ...a], { encoding: 'utf8' })
const errors = []
const eq = (name, got, want) => { if (JSON.stringify(got) !== JSON.stringify(want)) errors.push(`${name}: got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`) }
try {
  const put = (slug, lines) => { mkdirSync(join(root, 'reports', slug), { recursive: true }); writeFileSync(join(root, 'reports', slug, 'progress.md'), lines.join('\n') + '\n') }
  put('a', [
    '- task 1 · CLEAN · fix · full path · rounds 1 · reviewer · a..b · 600 s · 100k · 3 agents · start 2026-11-10T10:00:00Z · end x · models implementer opus/low, reviewer opus/medium · causes none · path full',
    '- task 2 · OPEN · fix · full path · rounds 3 · reviewer · a..b · 1800 s · 300k · 5 agents · start 2026-11-12T10:00:00Z · end x · models implementer sonnet, reviewer opus/medium · causes SECRET-TEXT · path full',
    '- final review · ready · 900 s · 90k',
  ])
  put('b', [
    '- task 1 · CLEAN · text path · rounds 0 · reviewer · a..b · 300 s · 40k · 2 agents · start 2026-11-12T09:00:00Z · end x · models implementer sonnet · path text',
    '- task 2 · CLEAN by ruling · start ? · end ? · models none · causes none · path code',
  ])
  mkdirSync(join(root, 'elsewhere'))
  writeFileSync(join(root, 'elsewhere', 'progress.md'), '- task 1 · CLEAN · text path · rounds 9 · 9 s · 9k\n')
  symlinkSync(join(root, 'elsewhere'), join(root, 'reports', 'linked'))

  const all = run('--json', root)
  eq('exit', all.status, 0)
  const o = JSON.parse(all.stdout)
  eq('all', o.all, { tasks: 4, clean: 3, rounds: 1.3, minutes: 10, tokens: 100 })
  eq('path full', o.path.full, { tasks: 2, clean: 1, rounds: 2, minutes: 20, tokens: 200 })
  eq('path code, no numbers', o.path.code, { tasks: 1, clean: 1, rounds: null, minutes: null, tokens: null })
  eq('implementer sonnet', o.implementer.sonnet, { tasks: 2, clean: 1, rounds: 1.5, minutes: 17.5, tokens: 170 })
  eq('implementer unknown', o.implementer['?'].tasks, 1)
  const s = JSON.parse(run('--json', '--since', '2026-11-12', root).stdout)
  eq('since', s.all.tasks, 2)
  const text = run(root)
  if (/SECRET|reviewer|a\.\.b/.test(text.stdout)) errors.push('line text in the output')
  if (!text.stdout.includes('| path text | 1 | 1 | 0 | 5 | 40 |')) errors.push(`table row: ${text.stdout}`)
  for (const bad of [[], ['--since', 'yesterday', root], [root, root], [join(root, 'nope')], [join(root, 'reports', 'a', 'progress.md')], ['--verbose', root], ['--json', '--json', root], ['--since', '2026-11-12', '--since', '2026-11-10', root], ['--since']]) {
    if (run(...bad).status !== 2) errors.push(`usage error not refused: ${bad.join(' ')}`)
  }
} finally { rmSync(root, { recursive: true, force: true }) }
if (errors.length) { console.error(errors.join('\n')); process.exit(1) }
console.log('measure: cases OK')
