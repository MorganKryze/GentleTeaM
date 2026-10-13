# <Feature>: plan

> Spec: <path> (binding). Branch: <name> from <base> at <sha>. Date: <YYYY-MM-DD>.
> Ledger lessons applied: <entries read at plan time, by date>.

## For you
<At most ten lines: how many tasks, which are risky and were replayed, what the human must know.
Usually nothing to decide here: the spec settled it. Last line, the estimate, as in the spec:
`<n> tasks × <m> min + <phase> <m> min, ... ≈ <W> min, <T>k tokens (medians of the last <k>
measured runs)`, or `no measured run yet`.>

## Global constraints
- Gate before every commit: <commands from config, with prefix>.
- Commits: <rules from config>. Tests in the same commit as their code.
- <Budgets, copy rules, a11y rules that bind every task.>

## Review focus
<The three to five places a reviewer must look hardest, each pointing at the task and test that
covers it.>

## Rulings where the spec is silent
1. <ruling> (cost if wrong: …)

## Tasks

### Task 1: <goal in one line> [P]
`[P]` = parallel-safe (disjoint files, no shared interface change). Omit when not.

**Files:** Create: `…` · Modify: `…`
**Interfaces:** Consumes: `…` · Produces: `…` (signatures)
**Risky:** <no | yes: migration / contract / persistence; replayed on <date>, gate counts>

- [ ] Step 1: write the failing test `<test name>`; run `<command>`; expect FAIL because …
- [ ] Step 2: implement …
- [ ] Step 3: run `<command>`; expect PASS
- [ ] Step 4: gate `<gate commands>`; commit `<type(scope): message>`

**Verify:** `<one command that proves the task>`
