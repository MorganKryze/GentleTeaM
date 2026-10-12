# Code guideline

> When to read: architect, implementer, reviewer, final reviewer, on every task.

- Small units, clear names, no dead code, no duplicate of an existing helper. Prefer deleting to adding.
- Prefer the standard library and the platform to new code; see `dependencies.md` before adding one.
- A deliberate ceiling carries a comment naming the limit and the upgrade path.
- Errors are handled where they can be acted on; nothing is swallowed silently.
- Match the surrounding style; the formatter and linter are the arbiters.
- <Project rule: layout, import order, logging, naming.>
