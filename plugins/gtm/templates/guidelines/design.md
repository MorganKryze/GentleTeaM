# Design guideline

> When to read: designer and design critic, always; ux-qa when a diff touches screens.
> Authority: the human's validated boards. Real tokens live in <path to the project's tokens>.

## 1. Three words
**Breathing room, readability, accessibility.** Every screen is judged on these first.

## 2. Hard rules (a violation is a must-fix)
1. No horizontal overflow at the widths in `design.widths`. Long text truncates or wraps, never pushes.
2. Touch targets at least 44 × 44 px (buttons, chips, checkboxes, steppers, list rows).
3. Three choices or fewer, one word each: a segmented control, never a boxed radio list. More: chips
   that wrap, or a sheet.
4. In a sheet or form, the primary button comes right after the fields, never at the bottom of an
   empty area.
5. No crammed row: one row, one idea. A row that wraps to three lines or squeezes two controls
   together is redesigned (secondary information moves to a second line).
6. Meaning never by colour alone: every coloured state also has text or an icon.
7. Contrast WCAG AA in light and dark: text 4.5:1, large text and meaningful graphics 3:1.
8. Typography follows the locale's rules (e.g. French: narrow no-break space before `: ; ? ! %`).
9. Never a word that judges the user (a missed day, a number, an absence).
10. <Project rule.>

## 3. Look and feel
<Tone in one line. Tokens for light and dark: background, surface, foreground, muted, border,
primary, primary-soft. Radius, borders, shadows. Navigation per form factor.>

## 4. Validated patterns (reuse, do not reinvent)
<One line per pattern the human approved: name, where it lives, what it looks like.>

## 5. How mockups are made (designer)
- HTML mockups under `design.mockups/<slug>/`, reusing the shared CSS of earlier boards.
- Render with `design.render` (or `npx playwright screenshot --viewport-size=<w>,<h>
  file://<html> <png>`), then look at the PNG and fix what is wrong before handing back.
- One board per topic; every new screen in light and dark; a caption under each frame saying what
  it shows and the decision it embodies; realistic data in the human's language, no lorem ipsum.
- The board's top line lists the decisions the human must make, each with a recommendation.

## 6. How the critic scores
Score /10, must-fix list, should-fix list. Measured, not felt:
- Overflow: load the HTML at each frame width; no element's `scrollWidth` exceeds its frame.
- Targets: interactive elements at least 44 px at frame scale.
- Contrast: compute WCAG ratios of the token pairs used.
- Rules §2 one by one; patterns §4 reused where they apply; consistency with previous boards.
- 10 ships as is; 8 minor polish only; below 8 or any must-fix means another round.
