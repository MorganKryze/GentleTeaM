#!/usr/bin/env node
// plugins/gtm/scripts/measure.mjs over a throwaway GTM root: grouping by path and implementer, the
// CLEAN count, means and medians that skip a missing field, --since, links skipped, usage errors,
// and no line text in the output. Run by scripts/validate.mjs.
import { mkdtempSync, mkdirSync, writeFileSync, symlinkSync, rmSync, readFileSync } from 'node:fs'
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
    '- task 3 · OPEN · fix · text path · rounds 0 · reviewer · a..b · 120 s · 20k · 1 agents · start 2026-11-12T11:00:00Z · end x · models implementer sonnet · causes none · path text · cut none',
  ])
  // A task the lead did in session: no seconds or tokens segment, only its instants and 0 agents.
  put('c', ['- task 1 · CLEAN · fix · by the lead in session · a..b · rounds 0 · start 2026-11-20T10:00:00Z · end 2026-11-20T10:09:00Z · 0 agents · path code', '- task 2 · CLEAN · fix · by the lead in session · start 2026-11-20T11:00:00Z · end ? · 0 agents · path code', '- task 3 · CLEAN · fix · by the lead in session · start 2026-11-20T12:00:00Z · end 2026-11-20T11:00:00Z · 0 agents · path code'])
  const c = JSON.parse(run('--json', '--since', '2026-11-20', root).stdout)
  eq('in session: seconds from start and end, 0 agents as 0k', c.path.code, { tasks: 3, clean: 3, cut: 0, rounds: 0, minutes: 9, tokens: 0 })
  rmSync(join(root, 'reports', 'c'), { recursive: true, force: true })
  mkdirSync(join(root, 'elsewhere'))
  writeFileSync(join(root, 'elsewhere', 'progress.md'), '- task 1 · CLEAN · text path · rounds 9 · 9 s · 9k\n')
  symlinkSync(join(root, 'elsewhere'), join(root, 'reports', 'linked'))

  const all = run('--json', root)
  eq('exit', all.status, 0)
  const o = JSON.parse(all.stdout)
  eq('all', o.all, { tasks: 5, clean: 3, cut: 1, rounds: 1, minutes: 7.5, tokens: 70 })
  eq('path full', o.path.full, { tasks: 2, clean: 1, cut: 0, rounds: 2, minutes: 20, tokens: 200 })
  eq('path code, no numbers', o.path.code, { tasks: 1, clean: 1, cut: 0, rounds: null, minutes: null, tokens: null })
  eq('implementer sonnet', o.implementer.sonnet, { tasks: 3, clean: 1, cut: 1, rounds: 1, minutes: 5, tokens: 40 })
  eq('implementer unknown', o.implementer['?'].tasks, 1)
  const s = JSON.parse(run('--json', '--since', '2026-11-12', root).stdout)
  eq('since', s.all.tasks, 3)
  const text = run(root)
  if (/SECRET|reviewer|a\.\.b/.test(text.stdout)) errors.push('line text in the output')
  if (!text.stdout.includes('| path text | 2 | 1 | 1 | 0 | 3.5 | 30 |')) errors.push(`table row: ${text.stdout}`)
  for (const bad of [[], ['--since', 'yesterday', root], [root, root], [join(root, 'nope')], [join(root, 'reports', 'a', 'progress.md')], ['--verbose', root], ['--json', '--json', root], ['--since', '2026-11-12', '--since', '2026-11-10', root], ['--since']]) {
    if (run(...bad).status !== 2) errors.push(`usage error not refused: ${bad.join(' ')}`)
  }
} finally { rmSync(root, { recursive: true, force: true }) }
// The record measure.mjs reads is the one templates/delivery.md tells the lead to write.
const delivery = readFileSync(new URL('../plugins/gtm/templates/delivery.md', import.meta.url), 'utf8').replace(/\s+/g, ' ')
for (const shape of ['`· cut reports/<slug>/<file>.md`', '`· cut none`']) if (!delivery.includes(shape)) errors.push(`delivery.md does not give the cut shape ${shape}`)
if (errors.length) { console.error(errors.join('\n')); process.exit(1) }
console.log('measure: cases OK')
