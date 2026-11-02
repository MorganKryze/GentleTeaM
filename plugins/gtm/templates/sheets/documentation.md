# Technical documentation

> Helps a role plan, write, review and maintain technical documentation that readers can find, trust
> and act on.

## When it applies
- Writing or restructuring a tutorial, how-to guide, reference page, explanation, README or design
  document.
- A change to code, an interface, a configuration or a behaviour that readers will notice, and the
  docs or changelog entry it needs.
- Reviewing a documentation change, or auditing a documentation set for gaps, staleness or
  duplication.
- Publishing docs per released version.
- Deciding which documentation checks to automate and which to leave to reviewers.

## Method
1. Name the reader and the one need the page serves: learning, completing a task, looking something
   up, or understanding.
2. Search what exists first: link to an existing page rather than duplicating it; merge or delete
   what is wrong or dead.
3. Pick the page type from the need (tutorial, how-to guide, reference, explanation), declare it in
   the page metadata, and split a page that serves two needs.
4. Change the docs in the same change as the code they describe; the reviewer checks the docs in
   that review; a skip is written down with its reason.
5. Back documented behaviour with tests wherever the behaviour is testable.
6. Once the mechanical checks pass, spend review time on substance: is it correct, does it serve the
   declared need, can a reader act on it.
7. Give every page an owner and a review date; at review, update, merge or delete, and delete by
   default when the page is dead.
8. Publish the docs per released version: readers land on the latest release by default, docs built
   from the development line warn that they may describe unreleased behaviour, and older versions
   warn that they may be out of date.

## Reflexes
- Is this page still true, who owns it, and who would notice if it stopped being true?
- Will this section still read correctly when an assistant quotes it on its own?
- Is the check I rely on mechanical, so a gate, or a judgment, so a reviewer?

## What is measured
- Docs with change: every change to a public interface touches docs or carries a written waiver;
  `verify`: a script compares changed paths and fails on interface paths with no docs path and no
  waiver.
- Changelog with change: every change to a public interface adds an entry written for readers, under
  its type (added, changed, deprecated, removed, fixed, security) in an unreleased section until it
  ships; `verify`: the same changed-paths script fails on interface paths with no changelog entry
  and no waiver. A removal announced as a deprecation at least one release earlier, with steps to
  migrate, stays judgment, at review.
- Broken links and anchors: zero; `verify`: an offline check of local links and anchors on every
  change, failing on non-zero exit; external links are checked on a schedule with a cache, reported,
  never blocking.
- Structure: heading levels step by one, one top-level heading, alternative text on every image,
  link text that names its target; `verify`: a markup structure linter over the docs folder, zero
  errors.
- Page type: every page declares one of the four types; `verify`: a metadata check. Whether the
  content fits its type stays judgment, at review.
- House terms: zero error-level alerts from the prose linter; `verify`: the linter at error level in
  the pipeline, with warnings and suggestions shown only in the editor.
- Code samples: every sample, short snippets included, builds and does what its page claims;
  `verify`: the pipeline extracts and runs the samples on every change, failing on any error. A
  sample that cannot run there, such as one that needs the network, is still built, says why it is
  not run and shows its expected result; that one stays judgment, at review.
- Freshness: pages whose last review is older than the agreed window, listed with their owner;
  `verify`: a scheduled report, never a merge blocker. Update, merge or delete stays judgment.
- Reader-perceived clarity, findability and reliability: a periodic reader survey; stays judgment,
  never a gate.

## Sources
- [Diátaxis](https://diataxis.fr/), 2026-11-01: four page types, each serving a distinct reader
  need.
- [Google, Documentation Best
  Practices](https://google.github.io/styleguide/docguide/best_practices.html), 2026-11-01: minimal
  fresh docs, docs in the same change, dead docs deleted, links over copies, tested behaviour.
- [DORA, Documentation quality](https://dora.dev/capabilities/documentation-quality/), 2026-11-01:
  quality attributes and their link to performance.
- [Write the Docs, Docs as Code](https://www.writethedocs.org/guide/docs-as-code/), 2026-11-01: docs
  in the code workflow, merging of new features without docs can be blocked.
- [ISO/IEC/IEEE 26514:2022, IEC Webstore](https://webstore.iec.ch/publication/73614), 2026-11-01:
  user needs, structure, content and format across the life cycle.
- [markdownlint](https://github.com/DavidAnson/markdownlint), 2026-11-01: heading, link and
  accessibility rules behind the structure measure.
- [lychee](https://github.com/lycheeverse/lychee), 2026-11-01: offline link and anchor checks;
  external checks with a cache.
- [Vale](https://docs.vale.sh/), 2026-11-01: a prose linter enforces team-written rules and gives no
  advice of its own.
- [Vale, MinAlertLevel](https://docs.vale.sh/keys/minalertlevel), 2026-11-01: all alerts in the
  editor, only errors fail the pipeline.
- [State of Docs 2026](https://www.gitbook.com/blog/state-of-docs-2026), 2026-11-01: AI moves
  writers toward review and shapes information architecture.
- [Google Technical Writing, Creating sample
  code](https://developers.google.com/tech-writing/two/sample-code), 2026-11-01: samples should
  build and do what they claim, need testing as systems change, snippet-heavy docs often degrade
  because snippets are tested less rigorously than full programs, writers should consider describing
  the expected result, especially for hard-to-run ones.
- [The rustdoc book, Documentation
  tests](https://doc.rust-lang.org/rustdoc/write-documentation/documentation-tests.html),
  2026-11-01: examples run as tests to stay working; network examples are built but not run; it is
  customary for an ignored example to give its reason.
- [Semantic Versioning, FAQ on deprecation](https://semver.org/), 2026-11-01: document a deprecation
  and ship it in at least one minor release before the removal.
- [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/), 2026-11-01: entries for people
  grouped by type, an unreleased section, deprecations and removals listed so upgrades are safe.
- [Read the Docs, Versions](https://docs.readthedocs.com/platform/en/stable/versions.html),
  2026-11-01: docs per release so readers match their version, a default of latest that is commonly
  set to stable, notices on development and outdated versions.
