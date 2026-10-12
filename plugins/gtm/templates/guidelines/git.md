# Git guideline: commits, branches, PRs, merges, releases

> When to read: implementer (commits), reviewer and final reviewer (hygiene), ship.

- **Commits:** Conventional Commits in <language>, one logical change each, tests in the same commit
  as their code. No attribution trailers (`Co-authored-by`, "Generated with") unless set here.
- **Branches:** one per Feature or Fix, from `<base>`, named `<type>/<slug>` or as `git.branch` says.
- **PRs:** title = a Conventional Commit; body = the For-you summary, what changed for the user, how
  it was proven, rulings, deferred minors. Size: one Feature; past ~400 changed lines (tests aside),
  split. Review rule: <e.g. one human approval>.
- **Merges:** <merge commit (default) | squash>. Never rewrite pushed history.
- **Releases:** SemVer; a CHANGELOG entry per release (Keep a Changelog); tag `v<version>` only on
  the human's go.
