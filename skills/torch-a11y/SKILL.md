---
name: torch-a11y
description: Add the torch-a11y accessibility panel (text size, high contrast, reduced motion, highlighted links, readable font) to a website and prepare the codebase so every setting actually works - rem sizing, color tokens with high-contrast values, and motion that follows the panel. Use when installing torch-a11y, wiring it into Next.js or Vite, auditing or fixing a site so the panel's settings take effect, or checking that a site still honors them after changes.
---

# torch-a11y

torch-a11y is a preferences panel, not a fix. It writes the visitor's choices onto `<html>`; the site's own CSS has to respond. Your job is both halves: wire in the panel, then make the codebase honor it. A panel on a site that ignores it is worse than no panel.

Never describe the result as making a site "accessible" or "compliant". It lets people adjust a site that already does the basics.

## 1. Look before changing anything

Find out, and say what you found:

- **Framework:** Next.js App Router (`app/layout.tsx`), Next.js Pages Router (`pages/_document.tsx`), Vite or another client-only React app (`index.html` + `main.tsx`), or something else.
- **Styling:** Tailwind v4 (`@import "tailwindcss"`), Tailwind v3 (`tailwind.config.js`), CSS Modules, plain CSS, CSS-in-JS.
- **Existing theming:** color variables? a dark mode? how is it switched (`prefers-color-scheme`, a class, `data-theme`)?
- **Existing a11y code:** `prefers-reduced-motion`, `prefers-contrast`, a root `font-size`.

Run the audit in [references/audit.md](references/audit.md) and keep its output; it drives step 3.

## 2. Install and wire it in

```bash
npm install torch-a11y   # or bun add / pnpm add
```

Wire it per [references/setup.md](references/setup.md). The non-negotiables:

- The before-paint script runs inline in `<head>` (`<A11yScript />`), or `initA11y()` runs before the first render in a client-only app. Never `next/script`, `defer`, or an effect: the page would flash at the wrong size and contrast.
- `torch-a11y/panel.css` is imported once, globally.
- If you pass a `config` to the panel, pass the same one to `<A11yScript />` and `useA11y()`.
- Under a strict Content Security Policy, pass the request's `nonce` to `<A11yScript nonce={...} />`.

## 3. Make the codebase honor each setting

Follow [references/contract.md](references/contract.md). In short:

| Setting | What the site must do |
| --- | --- |
| Text size | Size text (and text-adjacent spacing) in `rem`, never `px`. Multiply the `vw` term of fluid type by `var(--a11y-text-scale, 1)`. Media query breakpoints can stay as they are. |
| High contrast | Every UI color is a CSS variable. Add high-contrast values under `:root[data-a11y-contrast="more"]`. Text 7:1 on its background, borders and controls 3:1. No per-component `!important` overrides. |
| Reduced motion | Replace `@media (prefers-reduced-motion: reduce)` with the `motion-reduce` variant (Tailwind) or `:root[data-a11y-motion="reduce"]` selectors (plain CSS). In JS, use `prefersReducedMotion()` from `torch-a11y`. Reduced means calmer, not zero: keep opacity fades, drop movement. |
| Highlighted links | Works out of the box. Mark icon-only and button-styled links `data-a11y-link="ring"`; mark decorative links `data-a11y-link="none"`. |
| Readable font | Works out of the box. Mark artwork with its own lettering, logos set in type, and code-like UI with `data-a11y-keep`. |

Change the smallest thing that works. Match the codebase's naming, comment density and idiom. Don't restyle the site.

## 4. Verify, and show evidence

Use a real browser. For each check, say what you did and what you saw; take screenshots where the user can't see your screen.

1. **Keyboard only.** Tab reaches the panel button early. Enter opens the panel and focus moves inside. Tab cycles through: Close, A−, A+, the switches, Reset. Space and Enter toggle switches. Escape closes the panel and focus returns to the button.
2. **200% text.** Step to 200%. No horizontal scrolling at a phone width (375px) or a desktop width. Nothing overlaps or clips; the panel scrolls inside itself.
3. **Both color schemes,** with high contrast on and off. Run `scripts/contrast.mjs` on every text token against its background, in both themes, with high contrast on.
4. **Reduced motion.** Entrance animations, parallax and smooth scrolling stop; fades remain. Check JS-driven motion too.
5. **No flash.** Save settings, reload, and confirm the first paint is already at the saved size and contrast (view source: the script is inline in `<head>`).
6. **The build and tests pass,** with no hydration warnings in the console.

Report what passed, what you couldn't check (for example, a screen reader you don't have), and anything you changed outside the panel.
