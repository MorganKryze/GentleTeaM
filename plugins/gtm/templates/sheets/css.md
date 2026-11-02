# Responsive layout with CSS

> Helps a role design, build and verify CSS layouts that adapt to available space, zoom and content
> length without losing access or shifting.

## When it applies
- Building or changing a page layout, grid, component or navigation that must work from narrow
  phones to wide screens.
- Adding or changing fluid type, spacing scales or type tokens.
- Adding images, video or embeds to a page.
- Deciding whether a CSS feature is safe for the project's audience.
- Fixing horizontal scrolling, clipped or vanished content, text that will not grow, or content that
  jumps while loading.

## Method
1. Declare the support target once as a Baseline level, widely available by default; use anything
   newer only behind a feature query with a working fallback.
2. Start from content: let flexible and grid layouts wrap and size themselves within min and max
   bounds before writing any query.
3. When a component must change structure with its slot, query its container's inline size; keep
   viewport media queries for the page shell and user preferences.
4. Size text in relative units; bound fluid sizes with rem values, keep the maximum at most 2.5
   times the minimum, and never size text with viewport units alone.
5. Serve images with width descriptors and a sizes hint that matches the layout, one aspect ratio
   across candidates, and art-directed sources only when the crop must change.
6. Reserve space for every image, video, embed and late content; keep fallback fonts close to web
   fonts; animate transforms, not layout properties.
7. Verify at 320 CSS px wide, with text at 200 %, at zoom up to 400 %, with long strings, then
   measure layout shift on load.
8. Give every template one viewport meta tag with `width=device-width`, or some phones lay pages out
   on a virtual viewport wider than the screen and never use their narrow-screen media queries;
   never set `user-scalable=no` or a `maximum-scale` below 2.
9. Keep headers, footers and banners sticky or fixed only while the viewport has room for them,
   switching them to static positioning through height and width media queries, and give the root a
   `scroll-padding` at least their height so a focused element scrolls into view rather than staying
   under them.

## Reflexes
- Does this component's layout depend on its slot or on the screen? Query the one it depends on.
- What happens at 320 CSS px, at 400 % zoom, with text at 200 %?
- Does this font size still grow when the user zooms, or is it pinned to the viewport?
- What does the layout do with a long word or URL, or with content that wraps onto more lines than
  the mock-up?
- Does a flex or grid item refuse to shrink below its content, and is that intended?
- Does every image, video and embed hold its space before it loads?
- Does the visual order still match source and focus order?
- Is this feature inside our Baseline target, and what does its fallback look like?
- Did anything shown at 1280 CSS px vanish at 320, rather than move into a menu, disclosure, dialog
  or link?

## What is measured
- Reflow: at a 320 CSS px wide viewport, the document does not scroll sideways and no element passes
  the right edge outside declared two-dimensional regions (at 256 px tall, horizontally scrolling
  content does not scroll vertically); a `verify` step loads each key template in a headless browser
  and fails on any overflow. Device and 400 % zoom checks stay judgment.
- Support: every CSS feature used sits inside the declared Baseline target or behind a feature
  query; a `verify` step runs a Baseline-aware CSS linter and fails on violations, exceptions
  allowed by name.
- Text resize: no font size or type token uses viewport units alone, and every rem-bounded clamp()
  keeps max over min at or below 2.5; a `verify` step scans the compiled CSS. The zoom test at
  several widths, text reaching 200 %, stays a manual judgment step.
- Layout stability: every image, video and embed has width and height or an aspect ratio, and lab
  layout shift on load stays at or below 0.1 per key template, mobile and desktop; a `verify` step
  asserts both. Field layout shift at the 75th percentile is monitored, not gated.
- Viewport: every key template has one viewport meta tag with `width=device-width`, no
  `user-scalable=no` and no `maximum-scale` below 2; a `verify` step parses each template's served
  HTML and fails otherwise, since desktop browsers ignore the tag and a desktop-mode overflow check
  cannot notice it missing.
- Sticky content: at 1280 by 1024 and at 320 by 256 CSS px, no focused element is ever entirely
  hidden by sticky or fixed content; a `verify` step tabs forward and back through each key template
  at both sizes and fails when a focused element is fully covered. How much of a short viewport
  sticky content may take stays judgment.
- Content parity: whatever a key template shows at 1280 CSS px wide stays reachable at 320, in place
  or through a menu, disclosure, dialog or link to another view; a `verify` step compares the text,
  images and controls visible at both widths and fails on anything missing that is not on a named
  list of relocated items, whose reachability stays judgment.
- Judgment, not measured: intrinsic layout versus container or media query, where thresholds sit,
  whether a reflow exemption is justified.

## Sources
- [WCAG 2.2 Understanding Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html),
  2026-11-01: thresholds, exceptions, techniques.
- [WCAG 2.2 Technique F94](https://www.w3.org/WAI/WCAG22/Techniques/failures/F94), 2026-11-01:
  viewport-unit text failure, 200 % test.
- [Baseline](https://web.dev/baseline), 2026-11-01: support levels, 30-month rule, checking tools.
- [ESLint CSS use-baseline](https://github.com/eslint/css/blob/main/docs/rules/use-baseline.md),
  2026-11-01: feature-query guards, allow lists.
- [MDN Container
  queries](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment/Container_queries),
  2026-11-01: container types and units.
- [MDN Responsive
  images](https://developer.mozilla.org/en-US/docs/Web/HTML/Guides/Responsive_images), 2026-11-01:
  resolution switching, art direction.
- [Cumulative Layout Shift](https://web.dev/articles/cls), 2026-11-01: thresholds, lab versus field.
- [Optimize CLS](https://web.dev/articles/optimize-cls), 2026-11-01: reserved space, fonts,
  animations.
- [Fluid type accessibility, Smashing
  Magazine](https://www.smashingmagazine.com/2023/11/addressing-accessibility-concerns-fluid-type/),
  2026-11-01: 2.5 ratio rule, zoom test.
- [Build Excellent Websites](https://buildexcellentwebsit.es/), 2026-11-01: rules over breakpoints,
  fluid scales.
- [What's missing in CSS
  layout](https://patrickbrosset.com/articles/2026-05-20-whats-missing-in-css-layout/), 2026-11-01:
  flex and grid pain points, source order.
- [MDN Viewport meta
  element](https://developer.mozilla.org/en-US/docs/Web/HTML/Guides/Viewport_meta_element),
  2026-11-01: virtual viewport without the tag, device-width, warning against disabling zoom.
- [ACT rule Meta viewport allows for
  zoom](https://www.w3.org/WAI/standards-guidelines/act/rules/b4f0c3/), 2026-11-01: failing
  user-scalable and maximum-scale values, desktop browsers ignoring the tag.
- [WCAG 2.2 Technique C34](https://www.w3.org/WAI/WCAG22/Techniques/css/C34), 2026-11-01: un-fixing
  sticky headers and footers with media queries, resize and zoom test.
- [WCAG 2.2 Technique C43](https://www.w3.org/WAI/WCAG22/Techniques/css/C43), 2026-11-01: root
  scroll padding sized to fixed content, focus test.
- [WCAG 2.2 Technique F110](https://www.w3.org/WAI/WCAG22/Techniques/failures/F110), 2026-11-01:
  sticky content hiding focus, tabbing forward and back.
- [WCAG 2.2 Technique F102](https://www.w3.org/WAI/WCAG22/Techniques/failures/F102), 2026-11-01:
  content vanishing on reflow, 1280 to 320 comparison, reachable alternatives.
