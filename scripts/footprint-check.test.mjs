#!/usr/bin/env node
// Fixture test for plugins/gtm/scripts/footprint-check.mjs. Each scenario under
// scripts/fixtures/footprint/ becomes a throwaway git repo (a base commit on main, then a branch
// with the scenario's files and commit messages); the check's hits and notes must equal
// expected.json, with commit hashes replaced by c1, c2... Run by scripts/validate.mjs.
// `--update` rewrites expected.json from the current output.
import { readFileSync, writeFileSync, readdirSync, mkdtempSync, mkdirSync, cpSync, rmSync, appendFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { execFileSync } from 'node:child_process'

const root = new URL('..', import.meta.url).pathname
const fixtures = join(root, 'scripts/fixtures/footprint')
const script = join(root, 'plugins/gtm/scripts/footprint-check.mjs')
const update = process.argv.includes('--update')
const env = {
  ...process.env,
  GIT_AUTHOR_NAME: 'Fixture', GIT_AUTHOR_EMAIL: 'fixture@example.com', GIT_AUTHOR_DATE: '2026-01-01T00:00:00Z',
  GIT_COMMITTER_NAME: 'Fixture', GIT_COMMITTER_EMAIL: 'fixture@example.com', GIT_COMMITTER_DATE: '2026-01-01T00:00:00Z',
  GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_NOSYSTEM: '1',
}
const errors = []

for (const name of readdirSync(fixtures, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name)) {
  const dir = join(fixtures, name)
  const repo = mkdtempSync(join(tmpdir(), `gtm-footprint-${name}-`))
  const git = (...args) => execFileSync('git', ['-C', repo, '-c', 'commit.gpgsign=false', ...args], { env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
  try {
    git('init', '-q', '-b', 'main')
    writeFileSync(join(repo, 'README.md'), '# Demo\n')
    git('add', '-A')
    git('commit', '-q', '-m', 'chore: start')
    mkdirSync(join(repo, '.git/info'), { recursive: true })
    appendFileSync(join(repo, '.git/info/exclude'), readFileSync(join(fixtures, 'exclude'), 'utf8'))
    git('checkout', '-q', '-b', readFileSync(join(dir, 'branch'), 'utf8').trim())
    cpSync(join(dir, 'files'), repo, { recursive: true })
    git('add', '-A')
    const commits = readdirSync(join(dir, 'commits')).sort()
    commits.forEach((c, i) => git('commit', '-q', ...(i ? ['--allow-empty'] : []), '-F', join(dir, 'commits', c)))
    const shas = git('rev-list', '--reverse', '--abbrev-commit', 'main..HEAD').trim().split('\n')

    let out
    let code = 0
    try {
      out = execFileSync(process.execPath, [script, '--repo', repo, '--config', join(fixtures, 'config.yml'), '--pr', join(dir, 'pr.md'), '--json'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
    } catch (e) { out = e.stdout; code = e.status }
    const result = JSON.parse(out)
    const label = (h) => `${h.kind} | ${h.where.replace(/commit ([0-9a-f]+)/, (_, s) => `commit c${shas.indexOf(s) + 1}`)} | ${h.match}`
    const actual = { exit: code, hits: result.hits.map(label), notes: result.notes.map(label) }
    const expectedFile = join(dir, 'expected.json')
    if (update) { writeFileSync(expectedFile, `${JSON.stringify(actual, null, 2)}\n`); continue }
    const expected = JSON.parse(readFileSync(expectedFile, 'utf8'))
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      errors.push(`${name}: expected\n${JSON.stringify(expected, null, 2)}\ngot\n${JSON.stringify(actual, null, 2)}`)
    }
  } catch (e) {
    errors.push(`${name}: ${e.stderr ? e.stderr.toString() : e.message}`)
  } finally {
    rmSync(repo, { recursive: true, force: true })
  }
}

if (errors.length) { console.error(errors.join('\n')); process.exit(1) }
console.log(update ? 'footprint fixtures updated' : 'footprint check: fixtures OK')
