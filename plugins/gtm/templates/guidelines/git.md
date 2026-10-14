# Git guideline: commits, branches, PRs, merges, releases

> When to read: implementer (commits), reviewer and final reviewer (hygiene), ship.

- **Commits:** Conventional Commits in <language>, one logical change each, tests in the same commit
  as their code. No attribution trailers (`Co-authored-by`, "Generated with") unless set here.
- **Branches:** one per Feature or Fix, from `<base>`, named `<type>/<slug>` or as `git.branch` says.
- **PRs:** title = a Conventional Commit; body = the Summary, what changed for the user, how
  it was proven, decisions made for you, deferred minors. Size: one Feature; past ~400 changed lines (tests aside),
  split. Review rule: <e.g. one human approval>.
- **Merges:** merge commits (GTM default: every commit stays on the base, so history can be
  bisected and any single change reverted). Another practice (squash, rebase) only when the history
  already shows it established: name it, cite the evidence, keep GTM's default and reason beside
  it. Never rewrite pushed history.
- **Releases:** SemVer; a CHANGELOG entry per release (Keep a Changelog); tag `v<version>` only on
  the human's go.
