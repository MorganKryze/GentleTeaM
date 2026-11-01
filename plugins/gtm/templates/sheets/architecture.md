# Architecture

> Helps a role make, record and enforce structural decisions, so that the code keeps honouring what
> was decided.

## When it applies
- A task adds, moves or removes a module, a package, a public entry point or a dependency direction.
- A task chooses between options with lasting trade-offs and consequences.
- A task writes or reviews a decision record, an architecture diagram or an architecture document.
- A task changes a quality goal or a constraint the structure depends on.

## Method
1. State the context factually, with the desired qualities, before praising any solution.
2. Derive the decision criteria from context, goals and requirements, and keep them at one level of
   abstraction.
3. List at least two real options and say why each rejected one lost.
4. Seek advice from the people affected and from people with expertise, including likely dissenters;
   the decider stays free to choose and records the advice.
5. Write one decision record per decision, numbered, with a status, the reason for the choice, and
   both positive and negative consequences, for technical and non-technical stakeholders alike.
6. Say in the record how compliance is confirmed: a gate when it can be measured, a named review
   when it cannot.
7. Turn measurable decisions into boundaries: declared public entry points per package, and
   dependency rules across the repository.
8. Keep structural views beside the code, starting with system context and containers; add sections
   or views only where a reader needs them.
9. When a decision is replaced, mark the record superseded and link its successor.

## Reflexes
- Were the criteria written before the preferred option, or reverse-engineered from it?
- Is any listed alternative a real contender?
- What gets worse with this choice, and for whom?
- Who is affected and has not been asked? Who would disagree?
- How would anyone notice that this decision has stopped being followed?
- Is this boundary an API contract only, or does something depend on it as a security barrier?
- Does this rule express a recorded decision, or only a preference?
- If an AI drafted or reviewed this, who checked the output?

## What is measured
- Record form: every decision record has context, at least two options, an outcome, a negative
  consequence and a confirmation; a script over the records directory becomes a `verify` step that
  fails on any gap. It proves the form, not the quality.
- Forbidden dependencies and cycles: a dependency rule checker over the source tree must report
  none; it becomes a `verify` step once a deliberately injected violation has been seen to fail it.
- Private paths: an import of an undeclared package subpath must fail with the runtime's
  not-exported error; a small script becomes a `verify` step.
- Quality of reasoning, fairness of options and fidelity of a boundary to its domain stay judgment:
  a human review against the mistake list, with any AI review advisory only.

## Sources
- [MADR](https://adr.github.io/madr/), 2026-11-01: record sections, status values, file naming, the
  confirmation idea (release 4.0.0, 2024-09-17).
- [Ten Common Mistakes in ADRs](https://ozimmer.ch/practices/2026/09/12/ADRMistakes.html),
  2026-11-01: the review list for context, criteria, options and consequences.
- [ADR practices](https://adr.github.io/ad-practices/), 2026-11-01: same-level criteria, and a
  definition of done with a review plan.
- [Scaling the Practice of Architecture,
  Conversationally](https://martinfowler.com/articles/scaling-architecture-conversationally.html),
  2026-11-01: who decides and who is consulted.
- [Node.js Packages](https://nodejs.org/api/packages.html), 2026-11-01: entry-point encapsulation
  and its limits (v26.13.0).
- [dependency-cruiser](https://github.com/sverweij/dependency-cruiser), 2026-11-01: dependency
  rules, cycles, orphans, generated graphs.
- [C4 model](https://c4model.com/), 2026-11-01: abstraction levels, independence from notation and
  tooling.
- [Mermaid C4 diagrams](https://mermaid.js.org/syntax/c4.html), 2026-11-01: supported diagram types
  and rendering limits.
- [arc42 overview](https://arc42.org/overview), 2026-11-01: tailorable sections and the one-page
  canvas.
- [Agentic fitness
  functions](https://infoq.com/articles/agentic-fitness-functions-evolutionary-architecture),
  2026-11-01: split between deterministic gates and advisory judgment, known failure modes.
- [Architectural fitness
  function](https://www.thoughtworks.com/radar/techniques/architectural-fitness-function),
  2026-11-01: the definition only; the entry dates from 2017-2018.
