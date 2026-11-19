#!/usr/bin/env node
// Posture: reads a repository's CI/CD posture and prints each gap as `<id> <where>`, never a
// workflow's content or a secret. It reads the workflow files (.github/workflows,
// .forgejo/workflows) and the repository's own files, and, when the remote is GitHub and `gh`
// answers, the rules on each long-lived branch, through read-only `gh api` calls. It writes
// nothing. Gaps are findings, not failures: exit 0; a usage error exits 2. No dependencies.
//
// node posture.mjs [--json] [--branches <glob>,...] <repo>
// --branches adds long-lived branch patterns (`dev`, `release/*`) to the default branch.
// Without GitHub or `gh`, the branch rules read `rules.unknown`: check them by hand.
import { readdirSync, readFileSync, lstatSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'

const argv = process.argv.slice(2)
const usage = () => { console.error('usage: node posture.mjs [--json] [--branches <glob>,...] <repo>'); process.exit(2) }
const bi = argv.indexOf('--branches')
const rest = argv.filter((a, i) => !(bi >= 0 && i === bi + 1))
const flags = rest.filter((a) => a.startsWith('--'))
const pos = rest.filter((a) => !a.startsWith('--'))
if (pos.length !== 1 || flags.some((f) => !['--json', '--branches'].includes(f)) || new Set(flags).size !== flags.length) usage()
if (bi >= 0 && !/^[A-Za-z0-9._/*-]+(,[A-Za-z0-9._/*-]+)*$/.test(argv[bi + 1] || '')) usage()
const repo = pos[0]
try { if (!lstatSync(repo).isDirectory()) usage() } catch { usage() }
const json = flags.includes('--json')
const patterns = bi >= 0 ? argv[bi + 1].split(',') : []

const gaps = []
const gap = (id, where = '') => gaps.push({ id, where })

// The workflow files, regular files only.
const workflows = []
for (const d of ['.github/workflows', '.forgejo/workflows']) {
  let names = []
  try { names = readdirSync(join(repo, d)) } catch { continue }
  for (const n of names.filter((n) => /\.ya?ml$/.test(n)).sort()) {
    const p = join(repo, d, n)
    try { if (lstatSync(p).isFile()) workflows.push({ file: `${d}/${n}`, text: readFileSync(p, 'utf8') }) } catch {}
  }
}
const all = workflows.map((w) => w.text).join('\n')

for (const { file, text } of workflows) {
  const lines = text.split('\n')
  lines.forEach((l, i) => {
    const m = /^\s*(?:-\s+)?uses:\s*["']?([^\s"'#]+)/.exec(l)
    if (!m || m[1].startsWith('./')) return
    const ok = m[1].startsWith('docker://') ? /@sha256:[0-9a-f]{64}$/.test(m[1]) : /@[0-9a-f]{40}$/.test(m[1])
    if (!ok) gap('wf.unpinned', `${file}:${i + 1}`)
    if (/^actions\/checkout@/.test(m[1]) && !lines.slice(i + 1, i + 8).some((n) => /persist-credentials:\s*false/.test(n))) gap('wf.credentials', `${file}:${i + 1}`)
  })
  // Top-level permissions: missing, or any write, leaves the token wider than read.
  const top = lines.findIndex((l) => /^permissions:/.test(l))
  if (top < 0) gap('wf.permissions', file)
  else {
    let end = top + 1
    while (end < lines.length && !/^\S/.test(lines[end])) end++
    if (lines.slice(top, end).some((l) => /write/.test(l))) gap('wf.permissions', file)
  }
  if (/^\s*pull_request_target\b/m.test(text) && /github\.event\.pull_request\.head\.(sha|ref)|github\.head_ref/.test(text)) gap('wf.prt-checkout', file)
}

const has = (re) => re.test(all) || [ '.pre-commit-config.yaml', '.pre-commit-config.yml' ].some((f) => existsSync(join(repo, f)) && re.test(readFileSync(join(repo, f), 'utf8')))
const any = (files) => files.some((f) => existsSync(join(repo, f)))
if (!any(['.github/dependabot.yml', '.github/dependabot.yaml', 'renovate.json', 'renovate.json5', '.renovaterc', '.renovaterc.json', '.github/renovate.json', '.github/renovate.json5'])) gap('deps.no-updates')
if (!has(/osv-scanner|govulncheck|pip-audit|npm audit|pnpm audit|yarn npm audit|cargo audit|cargo deny|trivy (fs|repo)|dependency-review-action|grype|snyk/)) gap('deps.no-scan')
if (!has(/codeql-action|opengrep|semgrep/)) gap('sast.none')
const image = any(['Dockerfile', 'Containerfile', 'docker/Dockerfile'])
const pkg = /npm publish|twine upload|cargo publish|goreleaser|uv publish|poetry publish/.test(all)
if (image && !/trivy image|trivy-action|grype|docker scout/.test(all)) gap('image.no-scan')
if ((image || pkg) && !/cosign|attest-build-provenance|sigstore/.test(all)) gap('release.no-signature')
if ((image || pkg) && !/syft|sbom/i.test(all)) gap('release.no-sbom')

// The branch rules, through the owner's own `gh`, read-only; any failure reads as unknown.
const gh = (path, ...more) => {
  try { return JSON.parse(execFileSync('gh', ['api', path, ...more], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 20000 })) } catch { return undefined }
}
let remote = ''
try { remote = execFileSync('git', ['-C', repo, 'remote', 'get-url', 'origin'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim() } catch {}
const slug = /github\.com[:/]([\w.-]+)\/([\w.-]+?)(?:\.git)?\/?$/.exec(remote)
const info = slug && gh(`repos/${slug[1]}/${slug[2]}`)
let rules = 'unknown'
if (!info || typeof info.default_branch !== 'string') {
  gap('rules.unknown', 'check by hand')
  if (!has(/gitleaks|trufflehog/)) gap('secrets.none')
} else {
  rules = 'read'
  const base = `repos/${slug[1]}/${slug[2]}`
  const sa = info.security_and_analysis || {}
  if (!has(/gitleaks|trufflehog/) && sa.secret_scanning_push_protection?.status !== 'enabled') gap('secrets.none')
  if (info.visibility === 'public' && !/scorecard-action/.test(all)) gap('public.no-scorecard')
  const glob = (p) => new RegExp(`^${p.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[^/]*')}$`)
  let names = [info.default_branch]
  if (patterns.length) {
    const listed = gh(`${base}/branches`, '--paginate')
    const known = Array.isArray(listed) ? listed.map((b) => b.name) : []
    for (const p of patterns) for (const n of known) if (glob(p).test(n) && !names.includes(n)) names.push(n)
  }
  // The jobs a pull request runs: their names are the checks a rule can require.
  const prJobs = []
  for (const { text } of workflows) {
    if (!/^on:[\s\S]*?\bpull_request\b(?!_target)/m.test(text)) continue
    const lines = text.split('\n')
    const j = lines.findIndex((l) => /^jobs:/.test(l))
    for (let k = j + 1; j >= 0 && k < lines.length && !/^\S/.test(lines[k]); k++) {
      const key = /^  ([\w-]+):\s*$/.exec(lines[k])
      if (!key) continue
      const named = lines.slice(k + 1).find((l) => /^    name:/.test(l) || /^  \S/.test(l))
      prJobs.push(named && /^    name:/.test(named) ? named.replace(/^    name:\s*/, '').replace(/^["']|["']$/g, '').trim() : key[1])
    }
  }
  for (const b of names) {
    const got = gh(`${base}/rules/branches/${encodeURIComponent(b)}`)
    if (!Array.isArray(got)) { gap('rules.unknown', b); continue }
    if (!got.length) {
      const br = gh(`${base}/branches/${encodeURIComponent(b)}`)
      gap(br && br.protected ? 'rules.legacy' : 'rules.none', b)
      continue
    }
    const types = new Set(got.map((r) => r.type))
    if (!types.has('non_fast_forward')) gap('rules.force-push', b)
    const req = got.filter((r) => r.type === 'required_status_checks').flatMap((r) => r.parameters?.required_status_checks || []).map((c) => c.context)
    if (!req.length) gap('rules.no-required-checks', b)
    else for (const job of prJobs) if (!req.includes(job)) gap('ci.not-required', `${b} ${job}`)
  }
}

if (json) console.log(JSON.stringify({ rules, gaps }))
else {
  console.log(`posture: ${gaps.length} gaps, rules ${rules}`)
  for (const g of gaps) console.log(g.where ? `${g.id} ${g.where}` : g.id)
}
