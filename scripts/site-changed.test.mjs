#!/usr/bin/env node
// site-measure.test.mjs --changed <base>: which pages a branch's docs changes measure. Each case is a
// throwaway repo with no build, so the run stops after printing its pages (exit 2) or measures
// nothing (exit 0). Run by scripts/validate.mjs.
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { tmpdir } from 'node:os'
import { spawnSync, execFileSync } from 'node:child_process'

const script = new URL('site-measure.test.mjs', import.meta.url).pathname
const env = { ...process.env, GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_NOSYSTEM: '1', GIT_AUTHOR_NAME: 'F', GIT_AUTHOR_EMAIL: 'f@example.com', GIT_COMMITTER_NAME: 'F', GIT_COMMITTER_EMAIL: 'f@example.com' }
const cases = [
  { name: 'pages from Markdown', files: ['docs/index.md', 'docs/reference/commands.md', 'docs/x/index.md'], out: 'pages: /,/reference/commands/,/x/', code: 2 },
  { name: 'a non-Markdown docs file measures all', files: ['docs/reference/roles.md', 'docs/assets/site.css'], out: 'pages: all', code: 2 },
  { name: 'the site config measures all', files: ['docmd.config.json'], out: 'pages: all', code: 2 },
  { name: 'no docs change measures nothing', files: ['src/a.js'], out: 'no docs page changed: nothing to measure', code: 0 },
]
const errors = []
for (const c of cases) {
  const repo = mkdtempSync(join(tmpdir(), 'gtm-site-changed-'))
  const git = (...a) => execFileSync('git', ['-C', repo, '-c', 'commit.gpgsign=false', ...a], { env, stdio: 'ignore' })
  try {
    git('init', '-q', '-b', 'main'); writeFileSync(join(repo, 'README.md'), '# r\n'); git('add', '-A'); git('commit', '-q', '-m', 'start')
    git('checkout', '-q', '-b', 'b')
    for (const f of c.files) { mkdirSync(join(repo, dirname(f)), { recursive: true }); writeFileSync(join(repo, f), 'x\n') }
    git('add', '-A'); git('commit', '-q', '-m', 'change')
    const r = spawnSync(process.execPath, [script, repo, '--changed', 'main'], { env, encoding: 'utf8' })
    if (r.stdout.split('\n')[0] !== c.out || r.status !== c.code) errors.push(`${c.name}: got exit ${r.status}, "${r.stdout.split('\n')[0]}"`)
  } finally { rmSync(repo, { recursive: true, force: true }) }
}
// Run in a scratch folder: a broken refusal lets git write its --output file there.
const scratch = mkdtempSync(join(tmpdir(), 'gtm-site-changed-'))
const bad = spawnSync(process.execPath, [script, scratch, '--changed', '--output=x'], { cwd: scratch, encoding: 'utf8' })
rmSync(scratch, { recursive: true, force: true })
if (bad.status !== 2) errors.push(`a base starting with "-" is refused: got exit ${bad.status}`)
if (errors.length) { console.error(errors.join('\n')); process.exit(1) }
console.log('site --changed: cases OK')
