# UX writing and interface copy

> Helps a role write, review and check interface words so every user understands and can act, in any
> language.

## When it applies
- Writing or changing a user-facing string: label, button, link, heading, hint, error, status, empty
  state, notification.
- Adding a form field, a validation rule or an error path.
- Preparing strings for translation or adding a locale.
- Setting up a voice and tone guide or a glossary.
- Reviewing AI-drafted copy before release.
- Wording a sign-up, consent, upsell or cancel screen.

## Method
1. Start from the user's task and state: what they must know or do here, and whether they are
   stressed, neutral or excited.
2. Write the plain version first: common words, literal language, simple tense and voice, no double
   negatives, one instruction per step; spell out acronyms; give branded names a plain label.
3. Use the glossary: one function, one name, everywhere; check jargon against research or search
   logs.
4. Write one error message per validation rule, in the words of the field's label: an instruction
   for an empty field, a description and the fix for a wrong format or length; no blame, no generic
   text, no humor; keep what the user typed; reuse the same text in any error summary.
5. Show errors next to their field, never by color alone, and not merely because focus passed
   through; keep blocking dialogs for severe failures.
6. Make links and buttons say where they go or what they do, and keep the visible label inside the
   accessible name.
7. Keep the voice stable and adapt the tone: empathy in errors, encouragement in onboarding,
   neutrality in policy text.
8. Write for translation: plural and gender selection at the outermost level of the message, a full
   sentence in each variant; room for expansion (strings of ten characters or fewer can triple); no
   fixed widths, no abbreviations to fit.
9. Use AI for first drafts and variants only; edit for the audience; never ship generated copy
   unreviewed.
10. Test meaning with people on critical flows, including people with cognitive disabilities when
    possible, then track how often each error shows after release.
11. Hand strings to translation as whole messages with placeholders, never as sentences joined from
    fragments; give each one a note on its context and what each placeholder will hold; keep
    separate strings where the same words serve two contexts, such as a menu item and the title of
    the screen it opens; give a string a new ID when its meaning changes.

## Reflexes
- Could a user fix this error from the message alone?
- Is every hint and example visible beside its label, not in placeholder text that vanishes as the
  user types?
- Does it still read naturally aloud, through a screen reader, and after translation?
- Is saying no, or cancelling, worded as plainly as saying yes?

## What is measured
- Blaming or vague words in error strings: zero; a `verify` step runs a prose linter with a
  banned-word rule at error level.
- Distinct error messages: no two validation rules share a text; a `verify` step reads the message
  catalogue and fails on duplicates.
- Glossary terms: zero listed synonyms in user-facing strings; a `verify` step runs substitution
  rules at error level.
- Label in name: each accessible name contains the visible text, each input has a label, no link
  uses a listed vague text; a `verify` step checks the elements collected by the UI tests.
- Placeholder text: zero inputs carry it, since it vanishes on typing and a placeholder by itself
  can pass a label check; a `verify` step fails on any input with placeholder text among the
  elements collected by the UI tests.
- Expansion: no truncation in a pseudo-locale that lengthens each string to the expansion table's
  upper bound and brackets it; a `verify` step renders key screens and fails when a closing bracket
  is missing.
- Translator notes: every message with a placeholder carries a note; a `verify` step reads the
  message catalogue and fails on any message that has a placeholder and no note; sentences joined
  from fragments stay a review point.
- Reading level: a readability score per release, read against the lower-secondary target; a signal
  only, not a `verify` step, and a reviewer decides.
- Comprehension: judgment; results of comprehension or usability tests on critical flows, recorded
  each quarter, not a `verify` step.
- Error frequency after release: tracked per error to choose what to rewrite; the choice stays
  judgment.
- Choice wording: judgment; before release a reviewer reads each sign-up, consent, upsell and cancel
  screen and rejects decline labels that shame, countdowns or deadlines that are not real, and
  price, renewal or cancel terms left unstated before the user commits; not a `verify` step.

## Sources
- [NN/g, Error-Message Guidelines](https://www.nngroup.com/articles/error-message-guidelines/),
  2026-11-01: display, wording and recovery rules for errors.
- [GOV.UK Design System, Error
  message](https://design-system.service.gov.uk/components/error-message/), 2026-11-01: one message
  per error type, words to avoid, kept input, summary wording.
- [WCAG 2.2](https://www.w3.org/TR/WCAG22/), 2026-11-01: criteria on links, labels, label in name,
  reading level, consistent names and errors.
- [W3C COGA, Making Content Usable](https://www.w3.org/TR/coga-usable/), 2026-11-01: clear-content
  patterns and inclusive testing.
- [W3C i18n, Text size in translation](https://www.w3.org/International/articles/article-text-size),
  2026-11-01: expansion by string length and layout advice.
- [Unicode CLDR 47 release](https://cldr.unicode.org/downloads/cldr-47), 2026-11-01: stable message
  syntax with plural and gender selection.
- [Vale documentation](https://docs.vale.sh/), 2026-11-01: team-written prose rules, error level
  failing the build.
- [NN/g, UX Writing: FAQs from Practitioners](https://www.nngroup.com/articles/ux-writing-faqs/),
  2026-11-01: voice and tone, test methods, reading level, AI as a first-draft tool.
- [AccessibleEU, ISO
  24495-1:2023](https://accessible-eu-centre.ec.europa.eu/content-corner/digital-library/iso-24495-12023-plain-language-part-1-governing-principles-and-guidelines_en),
  2026-11-01: scope of the plain language standard.
- [GOV.UK Design System, Text input](https://design-system.service.gov.uk/components/text-input/),
  2026-11-01: no placeholder text for labels, hints or examples, and the reasons why.
- [axe-core, label rule](https://github.com/dequelabs/axe-core/blob/develop/lib/rules/label.json),
  2026-11-01: a non-empty placeholder is enough to pass the rule.
- [Mozilla, Localization best practices for
  developers](https://mozilla-l10n.github.io/documentation/localization/dev_best_practices.html),
  2026-11-01: no concatenation, notes on context and placeholders, no reuse across contexts, a new
  ID when meaning changes.
- [ICU User Guide, Formatting
  Messages](https://unicode-org.github.io/icu/userguide/format_parse/messages/), 2026-11-01: a
  message written and translated as one unit, with full sentences in its variants.
- [FTC, Settlement with Amazon over Prime sign-up and
  cancellation](https://www.ftc.gov/news-events/news/press-releases/2025/09/ftc-secures-historic-25-billion-settlement-against-amazon),
  2026-11-01: a plain option to decline, a banned decline label, terms stated at sign-up, an easy
  way to cancel by the same method used to sign up.
- [FTC, Report on dark
  patterns](https://www.ftc.gov/news-events/news/press-releases/2022/09/ftc-report-shows-rise-sophisticated-dark-patterns-designed-trick-trap-consumers),
  2026-11-01: fake countdown offers, buried terms, hard cancellation and data-sharing defaults as
  tactics that may break the law.
- [Deceptive Design, Confirmshaming](https://www.deceptive.design/types/confirmshaming), 2026-11-01:
  guilt or shame in opt-out labels as a named deceptive pattern.
