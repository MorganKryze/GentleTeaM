# Pipeline guideline

> When to read: init and the entry command when they show posture cards; ship before its go;
> the security reviewer when a workflow changes. The posture check
> (`scripts/posture.mjs`) reads most of this list; what it cannot read is checked by hand.

## Branches
- Work lands through a reviewed pull request; nobody pushes to a long-lived branch by hand.
- Each long-lived branch (the default one, and `dev` or `release/*` where the project keeps them)
  has a rule: required checks, no force push, no deletion.
- A CI job that runs on pull requests is a required check, or it blocks nothing.
- Branches are short-lived: one logical change per pull request.
- Tags and version numbers are made by the release step, not by hand.
- Two common shapes, neither imposed: trunk-based (short branches into the default branch,
  releases tagged from it), and long-lived release branches (fixes land first in the main line,
  then copied to each supported release branch).

## Dependencies
- A scan for known vulnerabilities runs on every pull request.
- An update tool proposes dependency updates.

## Code and secrets
- Static analysis (SAST) runs on every pull request.
- Secret scanning with push protection is on; a hook or a CI step scans for secrets too.

## Workflows
- Every action is pinned to a full commit SHA (an image to its digest), with the version in a
  comment.
- The token is read-only at the top level; a job widens it only for what it writes.
- A checkout keeps no credentials (`persist-credentials: false`).
- No `pull_request_target` workflow checks out or runs the pull request's code.

## Releases (when the project ships an image or a package)
- The image is scanned; images and packages are signed; an SBOM is published with them.
- A public repository runs the OpenSSF Scorecard.

## Tools per ecosystem
Names, not versions: read each tool's current documentation before setting it up.

| Control | Any | JavaScript | Python | Go | Rust | Containers |
| --- | --- | --- | --- | --- | --- | --- |
| Vulnerability scan | osv-scanner, dependency review | npm audit | pip-audit | govulncheck | cargo audit, cargo deny | Trivy, Grype |
| Updates | Renovate, Dependabot | | | | | |
| SAST | CodeQL (public), Opengrep | | | | | |
| Secrets | push protection, gitleaks | | | | | |
| Signature, SBOM | cosign, Syft | | | | | |

## Project rules
- <What this project accepts, as the owner answered each posture card.>
