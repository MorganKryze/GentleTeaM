# API design

> Helps a role design, review and evolve a programmatic interface so that clients can rely on it,
> retry safely and keep working through its changes.

## When it applies
- Designing a new API, or adding resources, operations or fields to an existing one.
- Reviewing a change to an API contract or interface description before it ships.
- Defining error responses, pagination, retries, idempotency or authorization rules for an API.
- Versioning, deprecating or removing an API operation or field.

## Method
1. Write the contract before the code: one machine-readable interface description, versioned with
   the code, reviewed by peers and by a client developer.
2. Paginate every collection from the first release: opaque tokens that grant no access, a
   documented default page size, an enforced maximum, an empty next token only at the end.
3. Mark each operation safe, idempotent or neither; give each non-idempotent creation with business
   effect a client-supplied idempotency key, with defined answers for a missing key, a request still
   in progress and a key reused with another payload.
4. Declare every success and error response; serve errors as problem details with a stable type
   identifier, the HTTP status repeated in the body, a detail that tells the client what to fix, and
   nothing internal.
5. For every operation that takes an object identifier, write who may act on that object and which
   properties each caller may read or write.
6. Classify every change before merging: adding optional fields, operations or values is compatible
   only if clients ignore what they do not know; removing, renaming, retyping, changing a default, a
   value format or a resource name, or adding pagination to an existing operation breaks clients.
7. Prefer compatible evolution; when a break is unavoidable, pick one versioning scheme for the
   whole interface after scoring the options against written, weighted criteria.
8. Retire in steps: mark deprecated in the contract, announce deprecation and sunset dates on
   responses with a link to the policy, measure remaining use per client, remove only when use is
   gone or consented.

## Reflexes
- Which existing client breaks if this ships today, including one that depends on undocumented
  behavior?
- Can a caller reach another tenant's object by changing an identifier, or write a property it
  should only read?
- Can a regular caller reach an administrative operation by guessing its path or switching the
  method, say from GET to DELETE?
- What bounds the cost of one call: page size, payload size, call rate?
- Is this decision expensive to change after the first release: pagination, identifiers, error
  format?
- Is every deployed version of this interface listed somewhere, old ones included?

## What is measured
- Contract style: rule violations in the interface description against the team's ruleset; the
  verify step runs the linter with the ruleset named explicitly and fails at warning level, since a
  linter that finds no ruleset may check nothing.
- Breaking changes: definite breaks between the main-branch contract and the proposed one; the
  verify step fails on any; possible breaks go to review, and each accepted exception is written
  down with its reason.
- Contract conformance: the running service answers only as its interface description declares,
  since a diff between contracts cannot see a break made only in code; the verify step sends
  requests generated from the description to a test deployment and fails on any undeclared status
  code or media type, a missing required header, or a body that breaks its schema.
- Partial update: an update changes only the fields the client sent or named, since under whole
  replacement a client built before a field existed erases it; the verify step sends an update that
  omits an optional field and fails if that field's stored value changed. Any update kept as whole
  replacement is recorded in review with its reason.
- Error format: known-invalid requests return the problem details media type with a status member
  equal to the HTTP status; the verify step sends them to a test deployment.
- Safe retry: replaying a creation with the same key returns the same resource, and the same key
  with another payload is refused; the verify step runs this replay test.
- Object-level authorization: every operation that takes an object identifier has a negative test
  with a second identity; the verify step fails on any success answer. Who may do what stays
  judgment, settled in design review.
- Function-level authorization: the contract names the roles allowed to call every operation, not
  only those that take an object identifier, and the service denies any role it does not name; the
  verify step calls each operation as a role not named for it and fails on any success answer.
- Deprecation: every operation marked deprecated in the contract answers with a deprecation header,
  plus a sunset header no earlier than it once a date is set; the verify step checks both headers.
- Naming, resource granularity and the versioning scheme stay judgment: recorded as review
  decisions, not gates.

## Sources
- [RFC 9457, Problem Details for HTTP APIs](https://www.rfc-editor.org/rfc/rfc9457.html),
  2026-11-01: error object members, media type, multiple problems, limits of use.
- [RFC 9745, The Deprecation HTTP Response Header
  Field](https://www.rfc-editor.org/rfc/rfc9745.html), 2026-11-01: deprecation header, sunset
  ordering, policy link.
- [IETF draft, The Idempotency-Key HTTP Header
  Field](https://datatracker.ietf.org/doc/draft-ietf-httpapi-idempotency-key-header/), 2026-11-01:
  key rules and the 400, 409 and 422 answers.
- [Google AIP-180, Backwards compatibility](https://google.aip.dev/180), 2026-11-01: compatible
  versus breaking changes.
- [Google AIP-158, Pagination](https://google.aip.dev/158), 2026-11-01: pagination from the first
  release, opaque tokens.
- [Google AIP-134, Standard methods: Update](https://google.aip.dev/134), 2026-11-01: partial update
  preferred, whole replacement turns every added field into a breaking change.
- [Zalando RESTful API and Event
  Guidelines](https://opensource.zalando.com/restful-api-guidelines/), 2026-11-01: contract first,
  compatibility, deprecation and error rules.
- [OWASP API Security Top 10 2023](https://api-security.owasp.org/editions/2023/en/0x11-t10),
  2026-11-01: object and property level authorization, resource consumption, inventory.
- [OWASP API5:2023, Broken Function Level
  Authorization](https://api-security.owasp.org/editions/2023/en/0xa5-broken-function-level-authorization),
  2026-11-01: explicit grants per role, deny by default, admin functions reached by guessed paths or
  switched methods.
- [Stripe, APIs as infrastructure](https://stripe.com/blog/api-versioning), 2026-11-01: dated
  versions and their maintenance cost.
- [oasdiff, breaking
  changes](https://github.com/oasdiff/oasdiff/blob/main/docs/BREAKING-CHANGES.md), 2026-11-01:
  definite versus possible breaks, recorded exceptions.
- [Spectral CLI guide](https://github.com/stoplightio/spectral/blob/develop/docs/guides/2-cli.md),
  2026-11-01: failure threshold, explicit ruleset.
- [Schemathesis, checks reference](https://schemathesis.readthedocs.io/en/stable/reference/checks/),
  2026-11-01: conformance of status codes, media types, headers and bodies to the description.
