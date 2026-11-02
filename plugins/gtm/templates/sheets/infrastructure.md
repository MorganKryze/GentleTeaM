# Infrastructure as code and containers

> Helps an engineer change infrastructure and container images through reviewed, tested, verifiable
> code, and keep what runs equal to what was reviewed.

## When it applies
- Writing or reviewing infrastructure definitions, deployment manifests or image build files.
- Planning, testing or applying an infrastructure change; investigating a gap between code and
  reality.
- Choosing, updating, scanning or replacing a base image or a third-party image source.
- Setting a workload's runtime privileges or a cluster's admission rules.
- Handling credentials that infrastructure code, its pipeline or image builds need.

## Method
1. Review the tool's preview of the change, not only the code diff; a preview made earlier may be
   stale.
2. Test logic in preview mode without creating resources: assertions on values, and negative tests
   proving invalid inputs are refused. Tests that create resources stay short-lived and tear down
   what they made.
3. From automation, apply exactly the saved preview that was reviewed, non-interactively, with state
   locking on.
4. Build images in stages so the final image holds only what runs. Start from a minimal, trusted,
   maintained base. Run as non-root with explicit IDs. Mount build-only files instead of copying
   them.
5. Reference base and deployed images by digest. Let automation propose digest updates and rebuild
   on a schedule from fresh bases, so pinning never freezes known flaws.
6. Have the hosted build platform generate and sign provenance; verify signature and provenance
   before deploy, and refuse what fails.
7. Keep secrets out of image layers, saved previews and state. Use ephemeral or write-only
   mechanisms where offered. Keep state remote, encrypted at rest, access-restricted and logged.
   Treat saved previews as secrets.
8. Enforce the strictest workload profile that fits: non-root, no privilege escalation, all
   capabilities dropped, explicit default or node-local syscall filter, closed list of volume types.
   Warn and audit first, dry-run against running workloads, then enforce per namespace with a pinned
   policy version. Write down each exception.
9. After deploy, compare actual and declared state on a schedule. Route each gap to a decision:
   revert to code, or record the change and encode it.
10. For each third-party image or platform component, know who maintains it, on what terms, and the
    way out if updates stop.
11. Before approving, read every delete and replace in the preview: a replace destroys the object,
    and renaming or moving a declaration plans a destroy and a create unless the move is declared in
    code. Mark data-holding resources so the tool rejects any preview that would destroy them;
    deleting the declaration itself bypasses that mark, so read removals with the same care.
12. Give automation short-lived credentials issued per job against trust conditions that name the
    repository and target environment, never stored long-lived keys. A preview runs provider and
    data-source code from the change under review and can leak the credentials the job holds, which
    an approval gate on apply does not stop: give the preview phase a narrower identity than apply,
    preview only changes from trusted authors, and load providers only from a source you control
    with outbound network blocked.

## Reflexes
- Which tag here could point to other content tomorrow?
- If this base stopped getting updates today, how would we notice, and where would we go?
- Where can this secret land: a layer, a log, a saved preview, the state?
- Does "sensitive" here mean hidden from output, or not stored at all?
- Is this finding new, or has it been open for months?

## What is measured
- Preview tests: a `verify` step runs the infrastructure test suite in preview mode on each change.
  Any failed assertion, or any invalid input that gets accepted, fails it.
- Destructive changes: `verify` reads the saved preview in machine-readable form and fails on any
  delete action, replacements included, on a resource whose type or address is on the team's
  data-holding list. Keeping that list current stays judgment.
- Drift: a scheduled `verify` step runs a preview with detailed exit status on the main branch.
  "Changes present" fails it and opens a ticket. Whether to revert or encode stays judgment.
- Digest pinning: share of image references carrying a digest. `verify` fails on any tag-only
  reference in rendered deploy manifests.
- Base freshness: age of each pinned base digest. `verify` warns past a team-set threshold; the
  threshold is judgment.
- Image vulnerabilities: `verify` scans each built image and fails on findings at or above a
  team-set severity; a scheduled scan of every deployed digest opens a ticket on new findings. The
  severity cut-off and each accepted exception stay judgment.
- Provenance: `verify` checks the signature and provenance attestation of each image before deploy.
  Target: zero unverified images.
- Workload profile: a server-side dry run of the restricted level per namespace. `verify` fails on
  any warning; the exception list is reviewed by hand.
- Static checks: `verify` runs build-file checks with errors on and an infrastructure security
  linter, failing on new findings. The age of open findings is tracked.
- Secret exposure: `verify` fails on secret-like names in build-file environment instructions and on
  saved previews among published artifacts. The rest stays review judgment.
- Pipeline credentials: long-lived cloud keys stored in pipeline settings, target zero. Before any
  preview runs, `verify` fails on a provider, or a data source that runs local programs, outside the
  team's allowed list. Trust conditions and each identity's rights are reviewed by hand.

## Sources
- [Docker, Building best practices](https://docs.docker.com/build/building/best-practices/),
  2026-11-01: stages, minimal bases, non-root, digest pinning trade-off, rebuilds, persistent layer
  values.
- [Docker, Build checks](https://docs.docker.com/build/checks/), 2026-11-01: build-file linting that
  can fail the build.
- [Kubernetes, Pod Security
  Standards](https://kubernetes.io/docs/concepts/security/pod-security-standards/), 2026-11-01:
  cumulative profiles and restricted controls.
- [Kubernetes, Enforce standards with namespace
  labels](https://kubernetes.io/docs/tasks/configure-pod-container/enforce-standards-namespace-labels/),
  2026-11-01: modes, version pinning, dry run, staged rollout.
- [SLSA v1.2, Build track basics](https://slsa.dev/spec/v1.2/build-track-basics), 2026-11-01:
  provenance levels and consumer validation.
- [OpenGitOps principles](https://opengitops.dev/), 2026-11-01: declared, versioned, pulled,
  continuously reconciled state.
- [Terraform, Tests](https://developer.hashicorp.com/terraform/language/tests), 2026-11-01: preview
  versus apply tests, expected failures, teardown.
- [Terraform, plan command](https://developer.hashicorp.com/terraform/cli/commands/plan),
  2026-11-01: detailed exit codes, saved plans in cleartext, refresh-only.
- [Terraform, Manage sensitive
  data](https://developer.hashicorp.com/terraform/language/manage-sensitive-data), 2026-11-01:
  secrets in state, masking versus not storing, securing state.
- [Sigstore, Verifying signatures](https://docs.sigstore.dev/cosign/verifying/verify/), 2026-11-01:
  key or identity verification, digest and log checks.
- [War et al., arXiv 2509.18761](https://arxiv.org/abs/2509.18761), 2026-11-01: 62 IaC security
  smell categories and their long persistence (preprint).
- [Bitnami, catalog change](https://github.com/bitnami/charts/issues/35164), 2026-11-01: a free
  image catalog turned into an unmaintained archive.
- [Terraform, lifecycle
  meta-argument](https://developer.hashicorp.com/terraform/language/meta-arguments/lifecycle),
  2026-11-01: a destroy guard that rejects plans, and its blind spot once the resource block is
  removed.
- [Terraform, JSON output format](https://developer.hashicorp.com/terraform/internals/json-format),
  2026-11-01: plan actions in machine-readable form, where every deletion, replacements included,
  carries a delete action.
- [Terraform,
  Refactoring](https://developer.hashicorp.com/terraform/language/modules/develop/refactoring),
  2026-11-01: changed addresses planned as destroy and create unless a move is declared.
- [Atlantis, Security](https://www.runatlantis.io/docs/security), 2026-11-01: plans running hostile
  provider or data-source code that leaks credentials, apply approval not covering it, allow-lists
  and controlled provider sources with egress blocked.
- [GitHub, OpenID Connect](https://docs.github.com/en/actions/concepts/security/openid-connect),
  2026-11-01: per-job, short-lived cloud tokens issued against claim conditions on repository and
  environment instead of stored secrets.
- [HCP Terraform, AWS dynamic
  credentials](https://developer.hashicorp.com/terraform/cloud-docs/workspaces/dynamic-provider-credentials/aws-configuration),
  2026-11-01: separate identities and trust conditions for the plan and apply phases.
- [Kubernetes, Security
  checklist](https://kubernetes.io/docs/concepts/security/security-checklist/), 2026-11-01: images
  scanned at creation and in deployment, scan results gating production, known vulnerable software
  patched.
