# Concurrency and parallelism

> Helps a role design, test and measure work split into tasks that run at once, so it stays correct
> under every interleaving and gets faster when workers are added.

## When it applies
- A change that starts tasks, threads, workers or asynchronous jobs, or shares mutable state between
  them.
- A change to locks, atomics, queues, channels, caches, pools or any hand-written synchronization.
- A distributed or asynchronous protocol: retries, timeouts, replication, failover.
- A performance goal that depends on adding cores, workers or nodes.

## Method
1. List the shared mutable state. For each item, name its owner and the synchronization that orders
   every access. Prefer one owner or immutable data, and keep memory-ordering subtleties out of
   application code.
2. Give every task an owning scope. The scope waits for the task, cancels its siblings when it
   fails, hands its error to the parent and passes cancellation down. Long-lived background work
   gets an explicit long-lived scope.
3. For a new protocol or hand-written synchronization, write a small formal model and check it
   before coding.
4. Run the test suite under a happens-before race detector with all code instrumented. Each report
   is a defect; each suppression is tracked debt.
5. Write small concurrency tests (two or three tasks) under a controlled scheduler: seeded
   randomized schedules, plus bounded exhaustive exploration for the smallest primitives. Every
   failure replays from its seed or checkpoint.
6. For distributed or asynchronous systems, route clock, randomness, network, disk and scheduling
   through an injectable layer. Simulate the whole system in one process, inject faults and check
   invariants over many seeds.
7. Measure throughput at increasing worker counts and fit a contention and coherency model. Locate
   the peak, then choose the worker count.
8. Bound every queue, channel, pool and task-spawn site. When a bound is reached, the producer waits
   or the work is rejected with an explicit overload error the caller can back off on. An unbounded
   buffer hides the bottleneck only until memory runs out and latency climbs.
9. Retry only operations that are idempotent or carry an idempotency token: a timeout does not prove
   the effect did not happen. Retry at one layer of the stack, cap attempts, back off exponentially
   with jitter and spend from a retry budget, so a struggling dependency does not receive multiplied
   load.
10. Give locks one acquisition order, as levels that follow the module layers. Check it at run time
    in tests, by asserting the level on each acquisition or with a lock-order validator, so an
    inversion fails a test even when nothing hung. Call no code you do not control, such as
    callbacks or plug-ins, while holding a lock.

## Reflexes
- Who else can reach this state while I hold it, and which happens-before edge orders our accesses?
- Can this task outlive the code that started it? Who waits for it, sees its error, cancels it?
- Would a reader need the memory model to understand this code? Then it is too clever.
- Did it pass once, or for N seeds that I can replay?
- Which clock, random source, I/O or scheduling choice in this test escapes the test's control?
- Does the race detector see all the code, or can uninstrumented parts hide or invent races?
- Does one more worker add throughput, or only contention and coherency cost?
- When producers outrun consumers and keep doing so, where does the excess wait, what bounds it, and
  who is told no?
- If this call times out and is retried, can its effect happen twice, and how many attempts can one
  request cause at the bottom of the stack?
- Which locks can this path hold at once, are they taken in the declared order, and does it call
  code I do not control while holding one?

## What is measured
- Race reports on the instrumented test suite: zero, and the suppression count never grows. The
  verify step runs the suite under the detector and fails on either.
- Controlled-schedule runs: the number of seeded runs per test, sized from the scheduler's per-run
  detection bound. The verify step loops over seeds and prints the failing one.
- Simulation: one seed run twice gives the same trace hash, then N seeds keep every invariant. The
  verify step checks both.
- Scalability: throughput at 1..N workers, speedup at the target count, and fitted contention and
  coherency against a baseline. The verify step fails under a speedup floor; thresholds on the
  coefficients stay judgment until the noise is known.
- Unscoped task starts: the count never grows, checked by a ratchet verify step. Whether a task
  deserves a long-lived scope stays judgment.
- Protocol design: the model checker reports no violated property. What to model and which
  properties matter stay judgment.
- Overload: offered load held above measured capacity. The verify step fails if any queue or memory
  passes its bound, or if the service crashes or stops completing work; bound sizes, and how far
  goodput may fall, stay judgment.
- Retries: under injected failures in the simulation, no request takes effect twice, and attempts
  reaching the lowest layer per top-level request stay under the configured cap. The verify step
  checks both; the budget size stays judgment.
- Lock order: inversions reported by the run-time lock-order check over the test suite: zero. The
  verify step runs the suite with the check on and fails on any report; choosing the levels stays
  judgment.

## Sources
- [ThreadSanitizer, Clang documentation](https://clang.llvm.org/docs/ThreadSanitizer.html),
  2026-11-01: what a race detector reports, its overhead, why it generally requires all code to be
  instrumented.
- [The Go Memory Model](https://go.dev/ref/mem), 2026-11-01: data race definition, sequential
  consistency for race-free programs, the advice not to be clever.
- [Uber, Dynamic Data Race Detection in Go
  Code](https://www.uber.com/blog/dynamic-data-race-detection-in-go-code/), 2026-11-01: running a
  race detector over a large repository, dedup, owners, cost.
- [A Randomized Scheduler with Probabilistic Guarantees of Finding
  Bugs](https://www.microsoft.com/en-us/research/publication/a-randomized-scheduler-with-probabilistic-guarantees-of-finding-bugs/),
  2026-11-01: bug depth and the per-run detection bound.
- [loom](https://docs.rs/loom/latest/loom/), 2026-11-01: bounded exhaustive schedule exploration,
  preemption bound, replay, limits.
- [FoundationDB, Simulation and Testing](https://apple.github.io/foundationdb/testing.html),
  2026-11-01: whole-system deterministic simulation with fault injection.
- [Notes on structured
  concurrency](https://vorpus.org/blog/notes-on-structured-concurrency-or-go-statement-considered-harmful/),
  2026-11-01: scoped task lifetimes, error and cancellation propagation.
- [JEP 525, Structured Concurrency](https://openjdk.org/jeps/525), 2026-11-01: failures of
  unstructured task code and the scope model.
- [TLA+](https://lamport.azurewebsites.net/tla/tla.html), 2026-11-01: modeling and checking
  concurrent designs before code.
- [A General Theory of Computational Scalability Based on Rational
  Functions](https://arxiv.org/abs/0808.1431), 2026-11-01: the universal scalability law and its
  special cases.
- [usl package manual](https://smoeding.r-universe.dev/usl/doc/manual.html), 2026-11-01: contention,
  coherency, single-unit throughput, fitting, peak.
- [Queues Don't Fix Overload](https://ferd.ca/queues-don-t-fix-overload.html), 2026-11-01: a queue
  only buffers in front of the bottleneck; at the bound, choose back-pressure or load shedding.
- [Google SRE book, Addressing Cascading
  Failures](https://sre.google/sre-book/addressing-cascading-failures/), 2026-11-01: short queues
  and early rejection, load shedding, per-request retry caps, retry budgets, retrying at one layer,
  load tests past capacity.
- [Timeouts, retries, and backoff with
  jitter](https://builder.aws.com/content/3EumjoZascWd1oZiEgL8ORlv3qE/timeouts-retries-and-backoff-with-jitter),
  2026-11-01: retry amplification across layers, token-bucket retry limits, capped backoff with
  jitter, idempotency before retrying.
- [lockdep design](https://docs.kernel.org/locking/lockdep-design.html), 2026-11-01: a lock-order
  validator that flags inversions and cycles from observed lock dependencies without the deadlock
  occurring.
- [Use Lock Hierarchies to Avoid
  Deadlock](https://jacobfilipp.com/DrDobbs/articles/DDJ/2008/0801/071201hs01/071201hs01.html),
  2026-11-01: lock levels tied to layers, an asserting wrapper that fails on the first out-of-order
  acquisition, no unknown code under a lock.
