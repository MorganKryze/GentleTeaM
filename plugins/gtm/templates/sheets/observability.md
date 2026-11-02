# Observability

> Helps a developer or reviewer make a service visible in production, page only on user impact, keep
> telemetry affordable and free of personal data, and treat it as a tested interface.

## When it applies
- Adding or changing an endpoint, job, queue consumer or dependency call that must be visible in
  production.
- Adding, renaming or removing a metric, span, log event or telemetry attribute.
- Defining or changing a service-level objective, an alert or an on-call page.
- Wiring a call across services that trace context must cross.
- Reviewing telemetry cost (labels, sampling), or personal data or secrets in telemetry.

## Method
1. Start from the user: pick a few indicators (latency of successes and of failures kept apart,
   errors, traffic, saturation; last success time for batch jobs), each with an objective and a
   period.
2. Page on error-budget burn, not on causes: one fast and one slow burn-rate alert, each needing a
   long window and a short one about a twelfth as long. A slow sustained burn opens a ticket. Every
   page should be urgent, actionable and need judgment; automate the rest.
3. Name telemetry from a shared semantic-convention registry extended with team entries. Treat it as
   a public interface: versioned, diffed per release, with no stable name, type or unit changed or
   removed.
4. Propagate trace context through every hop with the standard headers; continue the trace inside
   the trust boundary; never put personal data in those headers.
5. Record latency as histograms, not averages. Emit new events and exceptions as named structured
   logs tied to the active span, not as span events.
6. Budget cost: metrics start with no labels and keep their cardinality below ten; anything that can
   pass about a hundred values goes to traces or events. Decide sampling in writing: none at low
   volume or where regulation forbids dropping data, consistent head sampling for volume, tail
   sampling only if decisions need the whole trace (such as keeping every error trace) and a
   stateful tier is accepted.
7. Minimise sensitive data at the source: no attribute without an observability purpose; truncate or
   generalise rather than hash small identifier spaces; redact in the pipeline as a second line.
8. Keep signals whose specification is not yet stable, such as continuous profiling, as pilots off
   critical paths.
9. Make silence loud: export zero for every counter an indicator needs, so its ratio exists before
   the first failure; alert when an indicator's series goes missing; check the whole alert path end
   to end from outside the monitoring system; probe critical user journeys from outside the
   service, which can catch outages that in-process telemetry cannot see.
10. Keep secrets out of values as well as keys: never record passwords, access tokens, encryption
    keys or connection strings; capture headers only from an explicit list; redact credentials and
    signed parameter values in recorded URLs; record query text only parameterised or with its
    literals replaced.

## Reflexes
- Which user-visible symptom does this alert catch, and what will the person paged do?
- If this service, or only its telemetry, went dark, which page would fire?
- At this objective and traffic, would one failed request page, and can the fast-burn alert fire at
  all?
- Can this label's values grow with users, requests or time? Then why is it on a metric?
- Does the trace survive this hop: queue, thread pool, retry, third-party call?
- Would this attribute be acceptable in a breach report?

## What is measured
- Telemetry conformance: registry violations in telemetry emitted by the tests; `verify` runs the
  suite against a live conformance check and fails on any violation. The registry-coverage threshold
  stays judgment.
- Registry evolution: diff against the previous release; `verify` validates the registry and
  publishes the diff. Accepting a breaking change stays a reviewed decision.
- Paging alerts: share that are multiwindow burn-rate alerts on an objective, target all of them;
  `verify` lints alert definitions (two windows, short about a twelfth of long, burn rate consistent
  with the budget share).
- Alert reachability: `verify` fails when a burn-rate threshold times the error budget passes 100%:
  that page can never fire. Whether each long window holds more than 1 / (burn rate × error budget)
  events at normal traffic, so a single failure cannot page, stays judgment; below that, add
  synthetic traffic, group services that share a failure domain, absorb single failures with retries
  or fallbacks, or lengthen the window, or lower the objective as a product decision.
- Alert quality: precision, recall, detection time and reset time. This stays judgment, reviewed
  after each incident and each page with no action.
- Silent failure: unit tests feed each paging rule synthetic series and expect it to fire on a
  breach and stay quiet on healthy input, and expect its missing-data alert to fire when the series
  stops or goes stale; `verify` runs them and fails on any mismatch. Whether the alert-path check
  and outside probes cover the critical journeys stays judgment.
- Context propagation: a test sends known trace headers and checks the downstream hop keeps the
  trace identifier, changes the parent and forwards the vendor state; `verify` fails otherwise.
- Cardinality and sensitive keys: series per metric in telemetry exported during tests against a
  budget (for example 100), and denied attribute keys (user identifiers, emails, client addresses,
  sessions); `verify` fails on either. What else is sensitive stays judgment.
- Secrets in values: tests send a known fake credential in a request header, a URL query string and
  a database query literal; `verify` fails if it appears in any exported attribute value or log
  body. What else can carry a secret stays judgment.
- Sampling: the strategy stays judgment, written down and revisited when volume changes by an order
  of magnitude.

## Sources
- [Google SRE Book, Monitoring Distributed
  Systems](https://sre.google/sre-book/monitoring-distributed-systems/), 2026-11-01: golden signals,
  paging rules, histograms over averages.
- [Google SRE Workbook, Alerting on SLOs](https://sre.google/workbook/alerting-on-slos/),
  2026-11-01: multiwindow, multi-burn-rate alerting and alert quality.
- [Prometheus, Instrumentation](https://prometheus.io/docs/practices/instrumentation/), 2026-11-01:
  indicators per service type, label cardinality limits.
- [W3C Trace Context](https://www.w3.org/TR/trace-context/), 2026-11-01: propagation duties and
  privacy rules for trace headers.
- [OpenTelemetry, Sampling](https://opentelemetry.io/docs/concepts/sampling/), 2026-11-01: when to
  sample, head versus tail.
- [OpenTelemetry, Handling sensitive
  data](https://opentelemetry.io/docs/security/handling-sensitive-data/), 2026-11-01: minimisation
  and the limits of hashing.
- [OpenTelemetry, Observability by Design: Unlocking Consistency with OpenTelemetry
  Weaver](https://opentelemetry.io/blog/2025/otel-weaver/), 2026-11-01: telemetry as a public
  interface, registry and diff.
- [Weaver live-check
  README](https://github.com/open-telemetry/weaver/blob/main/crates/weaver_live_check/README.md),
  2026-11-01: live conformance check failing on violations.
- [OpenTelemetry, Deprecating Span Events
  API](https://opentelemetry.io/blog/2026/deprecating-span-events/), 2026-11-01: events as logs tied
  to the active span.
- [OpenTelemetry Profiles Enters Public Alpha](https://opentelemetry.io/blog/2026/profiles-alpha/),
  2026-11-01: profiling not yet for critical workloads.
- [Charity Majors, Is It Time To Version
  Observability?](https://charity.wtf/2024/08/07/is-it-time-to-version-observability-signs-point-to-yes/),
  2026-11-01: high-cardinality context belongs on events, not metric labels.
- [Prometheus, Alerting](https://prometheus.io/docs/practices/alerting/), 2026-11-01: monitoring the
  monitoring, one end-to-end check of the alert path, outside black-box checks as a fallback.
- [Prometheus, Instrumentation: avoid missing
  metrics](https://prometheus.io/docs/practices/instrumentation/#avoid-missing-metrics), 2026-11-01:
  exporting zero for series known in advance.
- [Prometheus, Query functions](https://prometheus.io/docs/prometheus/latest/querying/functions/),
  2026-11-01: alerting when no series exist for a metric and label set.
- [Prometheus, Unit testing for
  rules](https://prometheus.io/docs/prometheus/latest/configuration/unit_testing_rules/),
  2026-11-01: alert tests on synthetic series, with missing and stale samples and cases expecting no
  alert.
- [OWASP Logging Cheat
  Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html), 2026-11-01:
  passwords, access tokens, encryption keys and connection strings kept out of logs.
- [OpenTelemetry semantic conventions, URL
  attributes](https://opentelemetry.io/docs/specs/semconv/registry/attributes/url/), 2026-11-01: no
  credentials in recorded URLs, signed query parameters redacted.
- [OpenTelemetry semantic conventions, HTTP
  attributes](https://opentelemetry.io/docs/specs/semconv/registry/attributes/http/), 2026-11-01:
  headers captured only by explicit configuration, since capturing all of them risks a leak.
- [OpenTelemetry semantic conventions, Database
  spans](https://opentelemetry.io/docs/specs/semconv/database/database-spans/), 2026-11-01: query
  text recorded by default only parameterised or with literals replaced.
- [Google SRE Workbook, Alerting on SLOs: low traffic and extreme
  goals](https://sre.google/workbook/alerting-on-slos/#low-traffic-services-and-error-budget-alerting),
  2026-11-01: single-failure pages at low traffic and their remedies, fast-burn pages unreachable at
  low objectives.
