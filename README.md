# torch-a11y

[![npm version](https://img.shields.io/npm/v/torch-a11y)](https://www.npmjs.com/package/torch-a11y)
[![npm downloads](https://img.shields.io/npm/dm/torch-a11y)](https://www.npmjs.com/package/torch-a11y)

A small accessibility preferences panel for websites. A round button in the corner opens five settings:

- **Text size**, 90% to 200%
- **High contrast**
- **Reduce motion**, following the system setting until changed
- **Highlight links**
- **Readable font**: Atkinson Hyperlegible Next, with looser spacing

Settings apply before first paint, so pages never flash at the wrong size. The panel is a real modal dialog with labelled switches, and it themes itself from your CSS variables.

It ships with an **agent skill** that does the other half: preparing your codebase so every setting actually takes effect.

## What it is, and what it isn't

People don't always browse on their own devices. A library computer, a work laptop, a friend's phone: the operating system's accessibility settings aren't theirs to change, or aren't set up. This panel puts the most useful of those settings on the page itself.

It is **not** an accessibility overlay. It doesn't scan, patch or "fix" your site, and adding it doesn't make a site accessible or compliant. It writes the visitor's choices onto `<html>`, and your CSS responds. That's the deal: rem for text, color tokens with high-contrast values, motion that listens. The [contract](#the-contract) below spells it out, and the [skill](#agent-skill) does it for you.

What it leaves out on purpose: text-to-speech, cursors, reading rulers, hiding images. Operating systems and browsers do those better.

## Install

```bash
npm install torch-a11y
```

React 18 or later for the panel. The core has no dependencies.

## Quick start

### Next.js (App Router)

```tsx
// app/layout.tsx
import { A11yPanel, A11yScript } from "torch-a11y/react";
import "torch-a11y/panel.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <A11yScript />
      </head>
      <body>
        <A11yPanel />
        {children}
      </body>
    </html>
  );
}
```

`<A11yScript />` is an inline script that applies saved settings while the HTML is still parsing. Keep it inline in `<head>`: `next/script` and deferred scripts run after first paint. Under a strict CSP, pass `nonce`.

`<A11yPanel />` goes first in `<body>`, so it's one Tab away.

### Vite, or any client-only React app

`initA11y()` alone runs in the bundled script, after first paint, so a saved high contrast setting can flash the default styles first. Put the inline `a11yScript()` output (the same script `<A11yScript />` renders) in the `<head>` of `index.html`, before the CSS and the app bundle, with a small Vite `transformIndexHtml` plugin:

```ts
// vite.config.ts
import { a11yScript } from "torch-a11y";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    {
      name: "torch-a11y",
      transformIndexHtml() {
        return [
          {
            tag: "script",
            children: a11yScript(),
            injectTo: "head-prepend",
          },
        ];
      },
    },
  ],
});
```

Still call `initA11y()` before the first render, and render `<A11yPanel />` at the top of your app.

```tsx
// src/main.tsx
import { initA11y } from "torch-a11y";
import "torch-a11y/panel.css";

initA11y(); // before the first render

createRoot(document.getElementById("root")!).render(<App />);
```

### Tailwind CSS v4

```css
@import "tailwindcss";
@import "torch-a11y/tailwind.css";
@import "torch-a11y/panel.css";
```

`tailwind.css` redefines Tailwind's own `motion-reduce`, `motion-safe` and `contrast-more` variants to follow the panel, so the utilities you already use start listening to it. It also adds `a11y-links` and `a11y-font`.

## The contract

The panel sets these on `<html>`:

| | |
| --- | --- |
| `font-size: 150%` and `--a11y-text-scale: 1.5` | text size |
| `data-a11y-text="150"` | text size |
| `data-a11y-contrast="more" \| "no-preference"` | contrast, defaulting to `prefers-contrast` |
| `data-a11y-motion="reduce" \| "no-preference"` | motion, defaulting to `prefers-reduced-motion` |
| `data-a11y-links` | present when on |
| `data-a11y-font` | present when on |

Your site's part:

**Text size.** Size text in `rem`. Anything in `px` won't scale. Fluid type driven by `vw` barely moves either, so scale its viewport term: `clamp(3rem, 9vw * var(--a11y-text-scale, 1), 5.5rem)`.

**High contrast.** Make UI colors CSS variables, and give them stronger values in one place. No overrides per component, no filters.

```css
:root[data-a11y-contrast="more"] {
  --bg: light-dark(#ffffff, #000000);
  --fg: light-dark(#000000, #ffffff);
  --fg-muted: light-dark(#3a3a3c, #d1d1d6);
  --border: light-dark(rgb(0 0 0 / 0.55), rgb(255 255 255 / 0.6));
}
```

Aim for 7:1 on text and 3:1 on borders and controls.

**Reduced motion.** Key motion off the attribute, not the media query, so the switch works both ways:

```css
/* Tailwind v4, with torch-a11y/tailwind.css */
.card {
  @variant motion-reduce {
    transition: opacity 200ms ease;
  }
}

/* Plain CSS */
:root[data-a11y-motion="reduce"] .card {
  transition: opacity 200ms ease;
}
```

In JS, `prefersReducedMotion()` answers with the panel's setting, else the system's:

```ts
import { prefersReducedMotion } from "torch-a11y";

if (!prefersReducedMotion()) el.animate(keyframes, options);
```

**Highlighted links and the readable font** work without changes. Mark icon-only links `data-a11y-link="ring"` so they get a ring instead of an underline. Mark artwork, logos and anything whose lettering matters `data-a11y-keep` so the readable font leaves it alone.

## Options

```tsx
<A11yPanel
  config={{ storageKey: "my-site-a11y", storage: "session" }}
  features={["text", "contrast", "motion"]}
  position="bottom-right"
  labels={{ title: "Lesbarkeit", reset: "Zurücksetzen" }}
  onChange={(settings, change) => track("a11y", change)}
/>
```

| Prop | Default | |
| --- | --- | --- |
| `config.storageKey` | `"torch-a11y"` | where settings are saved |
| `config.storage` | `"local"` | `"session"` forgets them when the tab closes, for public computers |
| `config.textSteps` | `[90, 100, 110, 125, 150, 175, 200]` | the stepper's sizes, in percent |
| `config.textMode` | `"root"` | `"variable"` only sets `--a11y-text-scale`, for sites that size their own root: `html { font-size: calc(62.5% * var(--a11y-text-scale, 1)) }` |
| `features` | all five | which settings, in this order |
| `position` | `"bottom-left"` | or `"bottom-right"` |
| `trigger` | `"floating"` | `"none"` draws no button; open it with `openA11yPanel()` |
| `labels` | English | any or all of the panel's words |
| `onChange` | | after every change, for haptics or analytics |

If you change `config`, pass the same one to `<A11yScript config={...} />`.

### Your own button

```tsx
import { A11yPanel, openA11yPanel } from "torch-a11y/react";

<A11yPanel trigger="none" />
<button onClick={openA11yPanel}>Accessibility</button>
```

The panel opens centered, and focus returns to your button when it closes.

### Headless

```tsx
import { useA11y } from "torch-a11y/react";

const { text, reduceMotion, moreContrast, settings, set, reset } = useA11y();
```

Without React, `getA11yStore()` from `torch-a11y` has `get`, `set`, `reset` and `subscribe`.

## Theming

The panel follows your color scheme and reads these variables, on `:root` or any ancestor:

```css
:root {
  --a11y-surface: var(--surface);
  --a11y-fg: var(--fg);
  --a11y-muted: var(--fg-muted);
  --a11y-line: var(--hairline);
}
```

Also: `--a11y-fill`, `--a11y-fill-hover`, `--a11y-knob`, `--a11y-shadow`, `--a11y-radius`, `--a11y-font`, `--a11y-offset-x`, `--a11y-offset-y`, `--a11y-z`, `--a11y-link-wash`, `--a11y-link-ring`, `--a11y-readable-font`.

The panel's parts carry `data-torch-a11y` and `data-part` attributes. Its rules key off those, so your site's bare element rules (`button { ... }`) don't leak in; target the attributes to restyle a part on purpose.

What you can't turn off: the dialog's focus handling, its labels and roles, and the contrast floor in high contrast mode. Those are the point.

## Agent skill

The panel is the easy part. The skill prepares the codebase: it audits px sizes, hardcoded colors and motion queries, converts them, adds high-contrast token values, then verifies by keyboard, at 200%, in both color schemes.

```bash
npx torch-a11y init
```

It asks which agents get the skill, with the ones it finds on your machine ticked: Claude Code, Codex, Cursor, Gemini CLI, GitHub Copilot, Windsurf, OpenCode, Amp, Cline, Zed, Kiro, Roo Code and Goose. Then whether it goes in this project (committed, so your team gets it) or on your machine, and offers to add the package with your package manager. Then ask your agent: "Set up torch-a11y on this site."

`-y` takes the defaults without asking: detected agents, this project, add the package. To choose without prompts: `--agents codex,cursor`, `--global`, `--dir <skills folder>`, `--no-install`. `add-skill` is an alias.

## The panel itself

- A modal `<dialog>`: Escape closes it, Tab stays inside, the page behind is inert, and focus returns to what opened it.
- Switches are native checkboxes with `role="switch"`, named by their label and described by their hint. Space and Enter toggle them.
- The text size stepper announces the new size. At either end its button is marked unavailable rather than disabled, so focus never drops out of the dialog.
- Sizes are rem, so the panel grows with the text setting and scrolls inside itself at 200%.
- High contrast reaches the panel even before your tokens do. Windows forced colors mode is supported.
- Hidden when printing.

Tested with the keyboard alone, at 200% text, in light and dark, in Chromium. Screen reader testing (VoiceOver, NVDA) is next; reports are welcome.

## License

MIT. Atkinson Hyperlegible Next is © The Atkinson Hyperlegible Next Project Authors, under the SIL Open Font License 1.1 (`fonts/OFL.txt`).
