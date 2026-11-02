# Design patterns

> Helps a developer or reviewer decide whether, when and in what form to adopt a design pattern,
> then keep that decision traceable and checked.

## When it applies
- A change that adds, reshapes or removes a recurring design solution: a variation point in
  behaviour, indirection around object creation, a layer or ports-and-adapters boundary, a single
  shared instance.
- A review of code that implements or names a catalogued pattern, generated code included.
- A remote call or message flow that must cope with transient or lasting faults, duplicate
  delivery or partial failure: retries, timeouts, idempotency, an outbox or a saga.
- A pattern that no longer repays its indirection and is a candidate for removal.

## Method
1. State the problem as context and forces before naming a pattern.
2. List the options, always including simple code with no pattern and a language mechanism
   (first-class function, closure), then the pattern in its simplest form; score them on the same
   weighted criteria: indirection added, a change actually requested, shared vocabulary,
   reversibility.
3. Introduce the pattern when the need is present, not foreseen, and only where tests, continuous
   integration and refactoring keep change cheap; start from the simplest form and add complexity
   when a test or a change calls for it.
4. Record the decision in a short record kept in the repository: title, context, decision, status,
   consequences positive, negative and neutral; a replaced decision stays, marked superseded.
5. Turn the structure the pattern implies into automated rules (dependency direction, no cycles,
   placement, naming) that run with the tests; baseline existing violations so that only new ones
   fail, and let a rule that matches no code fail too.
6. For remote interactions, start from a named constraint or risk, write which quality goals the
   pattern serves and which it costs, and pair patterns to cover a gap one of them leaves open
   (retry with circuit breaker, saga with compensating transactions).
7. Revisit: a pattern that no longer repays its cost is refactored out and its record superseded.

## Reflexes
- Is this pattern making up for a mechanism the language already offers?
- For a single shared instance: do I need the class, one instance only, global access, control over
  initialization? Could the object simply be passed in?
- Would generated code that breaks this pattern fail a check, or only rely on a reviewer noticing?
- Would a retried call or a redelivered message take effect twice? Is the operation idempotent by
  nature, or keyed by a stable identifier saved in the same transaction as its effect, under a
  uniqueness constraint, and passed on to the services it calls?
- Does every remote call carry a timeout, sized from the dependency's latency percentile that
  matches a false-timeout rate the team accepts? Does only one layer of the stack retry, with capped
  backoff and jitter, so that nested retries cannot multiply the load?
- When a step changes its own data and sends a message, are both in one local transaction, the
  message saved in an outbox that a relay then sends, so that a crash or a rollback can neither lose
  it nor announce a change that never committed?

## What is measured
- New structural violations against a committed baseline (dependency direction, cycles between
  modules, placement or naming the pattern implies): the `verify` step runs the architecture rules
  with the test suite and fails on any new violation and on any rule that matches no code.
- Decision-record structure (title, context, decision, status from the allowed set, consequences):
  the `verify` step runs a lint over the records folder and fails on any missing part.
- Duplicate delivery, for each retried call and each message handler: the `verify` step runs a test
  that sends the same request or message twice in a row and twice at once, and fails unless each
  time the effect occurs once.
- A dependency that hangs or keeps failing: the `verify` step drives the call from its entry point
  against a stub that never answers or always fails, and fails when the call outlasts its timeout or
  the stub receives more attempts than the single retry policy allows.
- A state change and its message, for each step that writes local data and sends a message: the
  `verify` step runs a test that rolls the write back and fails if the message leaves, and one that
  commits and fails unless the relay sends it.
- Whether a pattern repays its indirection stays judgment: reviewed with the scored options when the
  pattern comes in and whenever it is questioned.
- A pattern's effect on quality attributes stays judgment: some studies report a pattern as helpful
  and others report the same pattern as harmful.

## Sources
- [Research state of the art on GoF design patterns: A mapping
  study](https://research.chalmers.se/en/publication/180109), 2026-11-01: a mapping of about 120
  studies; reported effects of GoF patterns on quality are contradictory.
- [Do Code LLMs Understand Design Patterns?](https://arxiv.org/abs/2501.04835v1), 2026-11-01: model
  biases; generated code often conflicts with a project's required patterns.
- [Software design pattern, Wikipedia](https://en.wikipedia.org/wiki/Software_design_pattern),
  2026-11-01: context, forces and consequences; costs of indirection and misuse; the 16 of 23
  figure.
- [Design Patterns in Dynamic Languages](https://norvig.com/design-patterns/), 2026-11-01: origin
  and date of the language-mechanism argument.
- [Criticism of patterns, Refactoring.Guru](https://refactoring.guru/design-patterns/criticism),
  2026-11-01: workarounds for weak languages, rigid use, overuse.
- [Is Design Dead?](https://martinfowler.com/articles/designDead.html), 2026-11-01: apply when
  needed, simplest form first, remove when not worth it, enabling practices.
- [Design Patterns Revisited](https://gameprogrammingpatterns.com/design-patterns-revisited.html),
  2026-11-01: the catalog stays relevant; Singleton is overused.
- [Singleton](https://gameprogrammingpatterns.com/singleton.html), 2026-11-01: questions before a
  global single instance; passing the object in.
- [Documenting Architecture
  Decisions](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions), 2026-11-01:
  decision record parts, superseding, storage in the repository.
- [ArchUnit User Guide](https://www.archunit.org/userguide/html/000_Index.html), 2026-11-01:
  architecture rules as tests, failure on empty rules, frozen baseline.
- [Cloud Design Patterns, Azure Architecture
  Center](https://learn.microsoft.com/en-us/azure/architecture/patterns/), 2026-11-01: choosing from
  the problem, trade-offs per quality pillar, pattern pairs, antipatterns.
- [Retry pattern, Azure Architecture
  Center](https://learn.microsoft.com/en-us/azure/architecture/patterns/retry), 2026-11-01: retrying
  an operation that is not idempotent could repeat its side effects; retries sit where the failure's
  full context is known, with lower layers failing fast; retry code tested against failure
  conditions.
- [Idempotent Consumer pattern, Azure Architecture
  Center](https://learn.microsoft.com/en-us/azure/architecture/patterns/idempotent-consumer),
  2026-11-01: at-least-once delivery can yield duplicates; natural idempotency first, else a stable
  key committed in one transaction with the effect, a uniqueness constraint against concurrent
  copies, the key passed to downstream calls.
- [Timeouts, retries, and backoff with jitter, Amazon Builders'
  Library](https://builder.aws.com/content/3EumjoZascWd1oZiEgL8ORlv3qE/timeouts-retries-and-backoff-with-jitter),
  2026-11-01: every remote call bounded by a timeout, sized from an accepted false-timeout rate and
  the matching downstream latency percentile; retrying at one layer, since layered retries multiply
  load; capped backoff with jitter.
- [Pattern: Transactional outbox,
  microservices.io](https://microservices.io/patterns/data/transactional-outbox.html), 2026-11-01:
  the dual-write problem; the message saved in the local transaction and sent by a relay, so it
  leaves only once that transaction commits; a relay may resend, so consumers stay idempotent.
- [Pattern: Saga, microservices.io](https://microservices.io/patterns/data/saga.html), 2026-11-01: a
  saga step is reliable only when its data change and its message go out together, through an outbox
  or event sourcing.
