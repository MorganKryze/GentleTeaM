# Security guideline

> When to read: security reviewer always; architect when a spec touches auth, a trust boundary,
> secrets or a migration; final reviewer.

## Threat model
<Who the attackers are, what they can reach, what must never leak. One paragraph.>

## Rules
- Every read and write is scoped to its owner; isolation is proven by a test per table or endpoint.
- Every input crossing a trust boundary is bounded by a schema; the server re-checks what the
  client checks.
- Refusals are targeted and logged by kind, never with personal data.
- Applied migrations are never edited; new ones are safe on a populated database.
- Secrets never in code, logs, screenshots or reports.
- <Project rule: headers, cookies, CSP, rate limits.>
