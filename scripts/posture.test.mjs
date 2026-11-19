#!/usr/bin/env node
// plugins/gtm/scripts/posture.mjs over throwaway repositories and a fake `gh` on PATH: workflow
// hygiene, repository files, conditional release controls, the branch rules (none, legacy, no
// required checks, force push, a job that runs without being required, extra long-lived
// branches), `gh` missing, no line text in the output, usage errors. Run by scripts/validate.mjs.
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, chmodSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { tmpdir } from 'node:os'
import { spawnSync, execFileSync } from 'node:child_process'

const script = new URL('../plugins/gtm/scripts/posture.mjs', import.meta.url).pathname
const dir = mkdtempSync(join(tmpdir(), 'gtm-posture-'))
const errors = []
const eq = (name, got, want) => { if (JSON.stringify(got) !== JSON.stringify(want)) errors.push(`${name}: got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`) }

// A fake gh: answers `gh api <path>` from a JSON map; an unknown path fails like a network error.
const bin = join(dir, 'bin')
mkdirSync(bin)
const fake = join(bin, 'gh')
writeFileSync(fake, `#!/usr/bin/env node\nconst m = JSON.parse(require('fs').readFileSync(process.env.FAKE_GH, 'utf8'))\nconst p = process.argv[3]\nif (!(p in m)) { console.error('no route'); process.exit(1) }\nprocess.stdout.write(JSON.stringify(m[p]))\n`)
chmodSync(fake, 0o755)

const SHA = 'a'.repeat(40)
const make = (name, files, routes, remote = 'git@github.com:o/r.git') => {
  const repo = join(dir, name)
  for (const [f, t] of Object.entries(files)) { mkdirSync(join(repo, dirname(f)), { recursive: true }); writeFileSync(join(repo, f), t) }
  mkdirSync(repo, { recursive: true })
  execFileSync('git', ['init', '-q', repo])
  if (remote) execFileSync('git', ['-C', repo, 'remote', 'add', 'origin', remote])
  const map = join(dir, `${name}.json`)
  writeFileSync(map, JSON.stringify(routes || {}))
  return { repo, map }
}
const run = ({ repo, map }, ...args) => spawnSync(process.execPath, [script, ...args, repo], { encoding: 'utf8', env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, FAKE_GH: map } })
const ids = (r) => JSON.parse(r.stdout).gaps.map((g) => (g.where ? `${g.id} ${g.where}` : g.id))

try {
  // A clean repository: every control present, rules complete.
  const ci = `on:\n  pull_request:\npermissions:\n  contents: read\njobs:\n  test:\n    name: Unit tests\n    steps:\n      - uses: actions/checkout@${SHA}\n        with:\n          persist-credentials: false\n      - run: osv-scanner . && gitleaks detect\n  lint:\n    steps:\n      - uses: ./local-action\n`
  const sec = `on:\n  push:\npermissions: {}\njobs:\n  sast:\n    steps:\n      - uses: github/codeql-action/init@${SHA}\n      - uses: ossf/scorecard-action@${SHA}\n`
  const good = make('good', { '.github/workflows/ci.yml': ci, '.github/workflows/sec.yml': sec, '.github/dependabot.yml': 'version: 2\n' }, {
    'repos/o/r': { default_branch: 'main', visibility: 'public', security_and_analysis: {} },
    'repos/o/r/rules/branches/main': [{ type: 'non_fast_forward' }, { type: 'required_status_checks', parameters: { required_status_checks: [{ context: 'Unit tests' }, { context: 'lint' }] } }],
  })
  const g = run(good, '--json')
  eq('clean repository: exit', g.status, 0)
  eq('clean repository: no gap', ids(g), [])

  // Every workflow gap, and no repository control at all.
  const bad = `on:\n  pull_request_target:\njobs:\n  build:\n    steps:\n      - uses: actions/checkout@v4\n        with:\n          ref: \${{ github.event.pull_request.head.sha }}\n      - uses: docker://alpine:3\n      - run: echo SECRET-TEXT\n      - uses: actions/checkout@${SHA}\n        with:\n          persist-credentials: true\n`
  const wide = `on:\n  push:\npermissions:\n  contents: write\njobs:\n  a:\n    steps:\n      - run: true\n`
  const b = make('bad', { '.github/workflows/bad.yml': bad, '.forgejo/workflows/wide.yaml': wide, Dockerfile: 'FROM x\n' }, {
    'repos/o/r': { default_branch: 'main', visibility: 'private', security_and_analysis: { secret_scanning_push_protection: { status: 'disabled' } } },
    'repos/o/r/rules/branches/main': [],
    'repos/o/r/branches/main': { protected: false },
  })
  eq('workflow and repository gaps', ids(run(b, '--json')).sort(), [
    'deps.no-scan', 'deps.no-updates', 'image.no-scan', 'release.no-sbom', 'release.no-signature', 'rules.none main', 'sast.none', 'secrets.none',
    'wf.credentials .github/workflows/bad.yml:6', 'wf.permissions .forgejo/workflows/wide.yaml', 'wf.permissions .github/workflows/bad.yml',
    'wf.prt-checkout .github/workflows/bad.yml', 'wf.unpinned .github/workflows/bad.yml:6', 'wf.unpinned .github/workflows/bad.yml:9', 'wf.credentials .github/workflows/bad.yml:11',
  ].sort())
  const text = run(b)
  if (/SECRET|echo|alpine|actions\//.test(text.stdout)) errors.push('line text in the output')
  if (!text.stdout.startsWith('posture: 15 gaps, rules read\n')) errors.push(`summary line: ${text.stdout.split('\n')[0]}`)

  // Branch rules: legacy protection, a rule without required checks or force-push block, a job
  // that runs without being required, an extra long-lived branch by pattern.
  const r = make('rules', { '.github/workflows/ci.yml': ci, '.github/workflows/sec.yml': sec, '.github/dependabot.yml': 'version: 2\n' }, {
    'repos/o/r': { default_branch: 'main', visibility: 'private', security_and_analysis: {} },
    'repos/o/r/rules/branches/main': [{ type: 'non_fast_forward' }, { type: 'required_status_checks', parameters: { required_status_checks: [{ context: 'Unit tests' }] } }],
    'repos/o/r/branches': [{ name: 'main' }, { name: 'dev' }, { name: 'release/1.2' }, { name: 'feat/x' }],
    'repos/o/r/rules/branches/dev': [{ type: 'pull_request' }],
    'repos/o/r/rules/branches/release%2F1.2': [],
    'repos/o/r/branches/release%2F1.2': { protected: true },
  })
  eq('branch rules', ids(run(r, '--json', '--branches', 'dev,release/*')), [
    'ci.not-required main lint', 'rules.force-push dev', 'rules.no-required-checks dev', 'rules.legacy release/1.2',
  ])
  eq('default branch only without --branches', ids(run(r, '--json')), ['ci.not-required main lint'])

  // No GitHub, or gh failing: rules unknown, never a rule gap; a secrets tool still counts.
  const n = make('nogh', { '.github/workflows/ci.yml': ci, '.github/workflows/sec.yml': sec, '.github/dependabot.yml': 'version: 2\n' }, {}, 'https://git.example.org/o/r.git')
  const no = run(n, '--json')
  eq('not GitHub: rules unknown', [no.status, JSON.parse(no.stdout).rules, ids(no)], [0, 'unknown', ['rules.unknown check by hand']])
  const f = make('ghfails', { '.github/workflows/ci.yml': ci }, {})
  eq('gh failing: rules unknown', ids(run(f, '--json')).includes('rules.unknown check by hand'), true)

  // A public repository without Scorecard, and gh answering the repository but not its rules.
  const pub = make('pub', { '.github/workflows/ci.yml': ci, '.github/dependabot.yml': 'version: 2\n' }, { 'repos/o/r': { default_branch: 'main', visibility: 'public', security_and_analysis: {} } })
  eq('public without Scorecard, rules unreadable', ids(run(pub, '--json')), ['sast.none', 'public.no-scorecard', 'rules.unknown main'])

  for (const args of [[], ['--verbose', good.repo], [good.repo, '--branches'], ['--branches', 'a;b', good.repo], ['--json', '--json', good.repo], [good.repo, good.repo]]) {
    const u = spawnSync(process.execPath, [script, ...args], { encoding: 'utf8' })
    if (u.status !== 2) errors.push(`usage error not refused: ${args.join(' ')}`)
  }
  if (spawnSync(process.execPath, [script, join(dir, 'none')], { encoding: 'utf8' }).status !== 2) errors.push('a missing repository is not refused')
} finally { rmSync(dir, { recursive: true, force: true }) }

if (errors.length) { console.error(errors.join('\n')); process.exit(1) }
console.log('posture: cases OK')
