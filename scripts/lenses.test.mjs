#!/usr/bin/env node
// The `lenses` run-line segment (spec A9). now-facts.mjs reads a ledger of 3 measured run lines
// to the same `eta` with and without the segment at the end of each line, and the ledger
// template states the segment. Runs now-facts.mjs in a throwaway root, removed after the run.
// Run by scripts/validate.mjs. No dependencies.
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { spawnSync } from 'node:child_process'

const root = new URL('..', import.meta.url).pathname
const script = join(root, 'plugins/gtm/scripts/now-facts.mjs')
const errors = []
const NOW = '2026-10-15T10:00:00Z'
const SEGMENT = ' · lenses reviewer Steelmanning 2, reviewer Boundary & Edge Case Sweep 0'
const line = (d, m) => `- 2026-10-1${d} · run-${d} · run · tasks 4 (one wave) · fix rounds 1, 0, 1, 1 · `
  + `reviewer 0/0/5 · no design · measured ${m}m 1588k 47a: spec 10.4m 129k 1a, plan 17.8m 190k 1a, `
  + `tasks ${m - 40}m 682k 21a, final 17.5m 211k 2a, fix 1.6m 25k 1a; roles ?`

function eta(withSegment) {
  const tmp = mkdtempSync(join(tmpdir(), 'gtm-lenses-'))
  try {
    const lines = [line(1, 61.1), line(2, 72.3), line(3, 80.5)].map((l) => (withSegment ? l + SEGMENT : l))
    writeFileSync(join(tmp, 'ledger.md'), `# Ledger\n\n${lines.join('\n')}\n`)
    // Outside a git repository the script prints its facts with `?` and exits 1.
    const r = spawnSync('node', [script, '--root', tmp, '--now', NOW], { encoding: 'utf8' })
    if (r.status > 1 || !r.stdout) { errors.push(`now-facts exit ${r.status}: ${r.stderr}`); return null }
    return JSON.parse(r.stdout).eta
  } finally { rmSync(tmp, { recursive: true, force: true }) }
}

const plain = eta(false), lensed = eta(true)
if (!plain || plain.runs !== 3) errors.push(`eta without lenses reads ${JSON.stringify(plain)}, want 3 runs`)
if (JSON.stringify(plain) !== JSON.stringify(lensed)) errors.push(`eta differs: ${JSON.stringify(plain)} vs ${JSON.stringify(lensed)}`)

const template = readFileSync(join(root, 'plugins/gtm/templates/ledger.md'), 'utf8').replace(/\n> /g, ' ')
if (!template.includes('· lenses <role> <method name> <n>, ...')) errors.push('ledger template does not state the `lenses` segment')

if (errors.length) { console.error(errors.join('\n')); process.exit(1) }
console.log('lenses: run lines read the same with and without the segment; template states it')
