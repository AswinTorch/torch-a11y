# The contract: what the site does so each setting works

The panel only sets attributes on `<html>`:

| Attribute | Values |
| --- | --- |
| `style="font-size: 150%"` and `--a11y-text-scale` | the text size |
| `data-a11y-text` | `"90"` … `"200"` |
| `data-a11y-contrast` | `"more"` or `"no-preference"` |
| `data-a11y-motion` | `"reduce"` or `"no-preference"` |
| `data-a11y-links` | present when on |
| `data-a11y-font` | present when on |

`data-a11y-contrast` and `data-a11y-motion` default to the system setting (`prefers-contrast`, `prefers-reduced-motion`) until the visitor changes them.

## Text size: rem

Root font-size scales everything sized in `rem`. Anything in `px` stays put.

- Convert font sizes to `rem` (px ÷ 16). In Tailwind, arbitrary values too: `text-[15px]` → `text-[0.9375rem]`. Write the hyphen; `text[...]` is not a class.
- Fluid type scales with the viewport, not the root, so `clamp(3rem, 9vw, 5.5rem)` barely grows at 200%. Multiply the viewport term by the scale the panel sets: `clamp(3rem, 9vw * var(--a11y-text-scale, 1), 5.5rem)`. The rem bounds already scale.
- Convert spacing that sits around text (padding in buttons, gaps in text rows, a sticky header's height and `scroll-padding-top`) so text doesn't outgrow its box.
- Leave fixed-size artwork, images and media query breakpoints alone. Note that rem in media queries ignores the root font-size, which is what you want.
- If the site sets `html { font-size: ... }` itself, use `textMode: "variable"` (see setup.md) rather than removing it.

## High contrast: tokens

High contrast is the same palette, pushed apart. It is not a filter and not a pile of overrides.

1. Make every UI color a CSS variable: text, muted text, backgrounds, surfaces, borders, fills, focus rings, brand colors used for text, status colors. Inline hex values in components become tokens. Artwork colors (illustrations, canvas scenes, photos' overlays that are art) can stay literal.
2. Add the high-contrast values in one block:

   ```css
   :root[data-a11y-contrast="more"] {
     --bg: light-dark(#ffffff, #000000);
     --fg: light-dark(#000000, #ffffff);
     --fg-muted: light-dark(#3a3a3c, #d1d1d6);
     --border: light-dark(rgb(0 0 0 / 0.55), rgb(255 255 255 / 0.6));
   }
   ```

   Use the site's existing dark-mode mechanism. With `light-dark()`, one block covers both. With a class or `data-theme` dark mode, write the block twice (`:root[data-a11y-contrast="more"]` and `.dark[data-a11y-contrast="more"]`, or the equivalent).
3. Targets: text at least 7:1 against its background; borders, control outlines and focus rings at least 3:1. Check with `scripts/contrast.mjs`.
4. Watch for tokens used in two roles. A border token reused as a badge background turns into a dark slab when borders get stronger; give the badge a fill token instead.
5. Thicker focus rings help: make the ring width a token (`--ring-width: 2px`, `3px` in high contrast).

## Reduced motion: the attribute, not the media query

The visitor can turn reduced motion on or off regardless of the system, so CSS must key off the attribute.

- **Tailwind v4:** with `torch-a11y/tailwind.css` imported, `motion-reduce:` and `motion-safe:` utilities already follow the panel. In CSS, replace

  ```css
  @media (prefers-reduced-motion: reduce) {
    .card { transition: none; }
  }
  ```

  with

  ```css
  .card {
    @variant motion-reduce {
      transition: none;
    }
  }
  ```

  One rule per selector; for pseudo-elements put the variant on the element and nest `&::after` inside it.
- **Plain CSS:** `:root[data-a11y-motion="reduce"] .card { transition: none; }`. To keep a no-JS fallback, also keep the media query version scoped to `:root:not([data-a11y-motion])`.
- **JS:** replace `matchMedia("(prefers-reduced-motion: reduce)").matches` with `prefersReducedMotion()` from `torch-a11y`. In React, `useA11y().reduceMotion` re-renders when it changes.
- `html { scroll-behavior: smooth }` needs the reduced version too.
- Reduced is calmer, not zero: keep opacity and color transitions, remove movement, scaling, parallax, autoplaying loops.

## Highlighted links

`panel.css` underlines every `a[href]` on a highlighter wash when on. Mark:

- `data-a11y-link="ring"` on links with no visible text (icon buttons, logo links, image cards), so they get a ring instead of a wash.
- `data-a11y-link="none"` on links that shouldn't change at all (rare: a skip link that's already obvious).

Buttons that look like links aren't links; leave them unless the site styles them as text links, in which case `.link`-style buttons can opt in by also matching your own rule.

## Readable font

`panel.css` switches body text to Atkinson Hyperlegible Next with looser letter, word and line spacing. Code, `pre`, `kbd` and Material icon fonts keep theirs. Mark `data-a11y-keep` on anything whose lettering is the point: logos set in type, artwork, games, decorative headings built from letter-spacing.

## Don'ts

- No `!important` to force contrast or motion.
- No `filter: contrast()` or `invert()` on the page.
- Don't hide or remove focus outlines anywhere, in the panel or the site.
- Don't put the panel inside an element that gets `inert`, `aria-hidden` or `overflow: hidden` transforms; it should be a direct child of `<body>`.
