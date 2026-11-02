# Accessibility

> Helps a team build, review and verify digital products that disabled people can use, to WCAG 2.2
> level AA, and back any conformance claim with evidence.

## When it applies
- Adding or changing a user interface: page, screen, component, form, navigation, dialog, sign-in or
  checkout flow.
- Publishing content: text, images, documents, audio or video.
- Writing an accessibility statement, a conformance report or an answer to a procurement request.
- Choosing a third-party component, widget or service that users will interact with.

## Method
1. Fix the target: WCAG 2.2 level AA unless a law or contract requires more. Keep a short register
   of the obligations in force, the version of the standard each one cites, and their deadlines.
2. Use the platform's native controls and semantics first. Add explicit roles or states only when
   nothing native fits, and then build the full keyboard behaviour they promise.
3. Design out the most frequent failures: text contrast, text alternatives, form labels, names on
   links and buttons, page language.
4. On every interface change, check the WCAG 2.2 additions at levels A and AA: focus never entirely
   hidden by author-created content, a single-pointer alternative to dragging, minimum target size,
   help in a consistent place, no redundant entry, sign-in without a cognitive test.
5. Run the automated rule check on the changed views and their states (error shown, menu open,
   dialog open). Fix each finding or record why it is a false positive.
6. Do the manual pass: keyboard only first, then the screen reader and platform pairing most of your
   users have. Record the outcome in the review.
7. Before any conformance claim, evaluate a structured and a random sample of views with an expert
   method and with disabled users. Write the statement from that report.
8. Refuse any add-on that promises automatic compliance; fix barriers at the source.
9. Add magnification to the manual pass. In a window 1280 pixels wide, zoom each changed view to
   400%. Check that nothing is lost and that nothing needs scrolling both across and down, except
   sections that need two dimensions, such as maps or data tables. Then enlarge text to 200% and
   check that no text or control is clipped, truncated or hidden.
10. Before publishing audio or video, caption every video that has sound, recorded or live. The
    captions cover the speech and the sounds needed to follow it. Give recorded audio-only content a
    transcript. Where a recorded video's picture carries information its sound does not, add audio
    description or write that information into the narration. Automatic captions count only once a
    person has confirmed they are fully accurate.
11. Before adopting a third-party component, widget or service, read its accessibility conformance
    report against your target, one criterion at a time. Treat partial support, no support and not
    evaluated as gaps to clarify with the vendor, not as passes. Then test it yourself in your own
    views with steps 5, 6 and 9 before committing. A third-party step inside a process such as
    sign-in or payment counts: no page of a process conforms unless every page in it does.

## Reflexes
- Can every action be done with the keyboard alone, and is the focused element never hidden?
- Does every control have a name that assistive technology announces?
- Am I adding a role that promises behaviour I have not built?
- Does the automated check pass only because it cannot see this barrier?
- Would this flow work for someone who cannot drag, cannot read low-contrast text, or cannot pass a
  memory test to sign in?
- Which obligation and which version of the standard does our claim rest on, and has either changed?

## What is measured
- Automated rule violations at levels A and AA on a versioned list of views and states: a `verify`
  step runs the team's rule engine and fails when an entry exceeds its ceiling. Ceilings only go
  down, and new entries start at zero.
- The six most frequent failure types (contrast, text alternatives, form labels, empty links, empty
  buttons, page language) at zero on new or changed views: checked by the same `verify` step.
- No add-on promising automatic compliance in the shipped build: a `verify` step searches the build
  against the team's deny list.
- Manual pass on each changed view: a `verify` step can only check that the review record lists
  every item; the outcome stays judgment.
- Magnification on each changed view: a `verify` step can render each listed view 320 pixels wide,
  which equals 1280 at 400% zoom. It fails when the whole view scrolls sideways, unless the review
  records a section that needs two dimensions. Loss of content at 400% zoom or at 200% text stays
  judgment and is listed in the manual pass record.
- Captions, transcripts and audio description on published media: a `verify` step can fail when a
  published video has no captions or a recorded audio-only item has no transcript. Caption accuracy
  and the need for description stay judgment.
- Third-party components in the shipped build: a `verify` step fails when the build carries a
  component, or a version of one, that is missing from the team's list of evaluated components. The
  evaluation itself stays judgment.
- Conformance to WCAG 2.2 AA stays judgment, from a sampled expert evaluation with disabled users. A
  `verify` step can only check that the report is newer than the last major release.
- Zero detected errors is never reported as conformance.

## Sources
- [W3C, What's New in WCAG 2.2](https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/),
  2026-11-01: the nine added criteria, their levels, and the removal of 4.1.1.
- [W3C, WCAG 3 Introduction](https://www.w3.org/WAI/standards-guidelines/wcag/wcag3-intro/),
  2026-11-01: WCAG 3 is still a draft; the advice is to meet WCAG 2.2 now.
- [NDA Ireland, Updated EN 301 549 Standard Strengthens Accessibility Requirements for ICT Products
  and Services](https://nda.ie/news/en301549-published), 2026-11-01: the European standard moves to
  WCAG 2.2 AA; its legal citation is still pending.
- [WebAIM, The WebAIM Million](https://webaim.org/projects/million/), 2026-11-01: the six most
  frequent failure types and the limit of automated detection.
- [GDS, Accessibility tools audit results](https://alphagov.github.io/accessibility-tool-audit/),
  2026-11-01: automated tools found a minority of planted barriers (2018 page).
- [Deque Study Shows Its Automated Testing Identifies 57 Percent of Digital Accessibility
  Issues](https://www.deque.com/blog/automated-testing-study-identifies-57-percent-of-digital-accessibility-issues),
  2026-11-01: its automated testing covered a large share of issue volume (2021, vendor study).
- [W3C, ARIA APG Read Me First](https://www.w3.org/WAI/ARIA/apg/practices/read-me-first/),
  2026-11-01: a role promises behaviour; test each browser and assistive technology pairing relevant
  within a target audience.
- [FTC Approves Final Order Requiring accessiBe to pay $1
  Million](https://www.ftc.gov/news-events/news/press-releases/2025/04/ftc-approves-final-order-requiring-accessibe-pay-1-million),
  2026-11-01: accessiBe's claims of automatic compliance are barred without evidence.
- [W3C, WCAG-EM Overview](https://www.w3.org/WAI/test-evaluate/conformance/wcag-em/), 2026-11-01:
  five-step evaluation with structured and random samples; it recommends involving disabled users.
- [W3C, Understanding SC 1.4.10: Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow),
  2026-11-01: 320 CSS pixels wide equals a 1280-pixel window at 400% zoom; content must lose nothing
  and must not need scrolling in two dimensions, except sections such as maps and data tables that
  need them.
- [W3C, Understanding SC 1.4.4: Resize
  Text](https://www.w3.org/WAI/WCAG22/Understanding/resize-text), 2026-11-01: text can be enlarged
  to 200% without loss of content or function; text or controls that are clipped, truncated or
  obscured fail.
- [W3C, Captions/Subtitles](https://www.w3.org/WAI/media/av/captions/), 2026-11-01: captions carry
  the speech and the needed non-speech sound; they are required for recorded video (A) and live
  video (AA); recorded audio-only content needs a transcript; automatic captions fall short unless
  confirmed fully accurate.
- [W3C, Description of Visual Information](https://www.w3.org/WAI/media/av/description/),
  2026-11-01: description is needed when the picture carries meaning the sound does not; it is
  required at AA for recorded video and can be written into the main script.
- [Section508.gov, Understanding Vendor Claims in Accessibility Conformance Reports for Section 508
  Conformance](https://www.section508.gov/buy/understand-claims/), 2026-11-01: partial support means
  non-conformance, no support can also be read as non-conformance, not evaluated gives no assurance,
  and buyers should test vendor claims themselves where possible.
- [W3C, Web Content Accessibility Guidelines (WCAG) 2.2](https://www.w3.org/TR/WCAG22/), 2026-11-01:
  the complete processes requirement, under which one failing page in a process stops every page in
  it from conforming.
