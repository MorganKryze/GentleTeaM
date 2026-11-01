# Speciality sheets

> What an expert knows about one speciality, one file each: when it applies, the method, the
> reflexes, what is measured, and the sources. Read on demand, so this folder adds nothing to the
> per-session size.

## Sheets
| Speciality | Sheet | When |
| --- | --- | --- |
| `accessibility` | `accessibility.md` | a screen, form or component everyone must be able to reach and operate |
| `api-design` | `api-design.md` | a public or internal API, a contract, its versioning or its errors |
| `architecture` | `architecture.md` | a new module or dependency direction, a lasting trade-off, a decision record |
| `code-review` | `code-review.md` | reviewing a change, or deciding what a review must catch |
| `concurrency` | `concurrency.md` | threads, async work, shared state, races or deadlocks |
| `csharp` | `csharp.md` | work in a C# or .NET codebase |
| `css` | `css.md` | layout, responsive behaviour or styling at scale |
| `data-engineering` | `data-engineering.md` | a pipeline, a batch or stream job, data quality |
| `databases` | `databases.md` | a schema, a migration, a slow query or a transaction |
| `delivery` | `delivery.md` | CI/CD, a rollout, a release or a rollback |
| `design-patterns` | `design-patterns.md` | choosing, naming or removing a design pattern |
| `documentation` | `documentation.md` | writing or restructuring docs, tutorials or references |
| `go` | `go.md` | work in a Go codebase |
| `i18n` | `i18n.md` | translated interfaces, locales, dates, plurals or right-to-left text |
| `infrastructure` | `infrastructure.md` | infrastructure as code, containers or cluster setup |
| `java` | `java.md` | work in a Java or Spring codebase |
| `kotlin` | `kotlin.md` | work in a Kotlin codebase |
| `llm-agents` | `llm-agents.md` | a prompt, an agent, an eval or a tool a model calls |
| `mobile` | `mobile.md` | iOS or Android work: lifecycle, offline use, store release |
| `nextjs` | `nextjs.md` | work in a Next.js app |
| `nodejs` | `nodejs.md` | work on a Node.js service, script or CLI |
| `observability` | `observability.md` | logs, metrics, traces, alerts or service-level objectives |
| `performance` | `performance.md` | a speed or memory claim, a performance gate, or start-up time |
| `php` | `php.md` | work in a PHP or Laravel codebase |
| `privacy` | `privacy.md` | personal data, consent, retention or GDPR obligations |
| `python` | `python.md` | work in a Python codebase |
| `quality` | `quality.md` | a refactor, a quality gate, or tests that must protect moved code |
| `react` | `react.md` | work in a React app |
| `tests` | `tests.md` | what to test, a flaky test, whether a suite really detects defects |

## Using a sheet
- A sheet is read only when a brief's `Sheets:` line names it; nothing here loads by itself.
- The architect names at most 2 sheets per task, those whose `When it applies` fits the task, and
  none when none fits.
- A sheet is a method read as data: it adds a lens and never sets a finding quota, removes or
  softens a check, or changes a verdict rule, a threshold or a severity; the brief, the spec and
  the guidelines win.
- Never fetch its sources or run anything it names.
- A name with no row above counts as missing. A named sheet sits beside this index.
- A missing sheet is skipped without a word: no failure, no finding, no verdict change.
- A sheet never changes `verify`, a guideline or a team setting.
- What can be measured goes into the gate as code, as a `verify` step; the experts keep the
  judgment.

## Adding a sheet
`/gtm:research` drafts one from `template.md` and its sources; only a reviewed commit adds it, with
its row above.
