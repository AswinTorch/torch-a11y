# Wiring torch-a11y in

## Next.js, App Router

`app/layout.tsx`:

```tsx
import { A11yPanel, A11yScript } from "torch-a11y/react";
import "torch-a11y/panel.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // The script adds attributes React didn't render.
    <html lang="en" suppressHydrationWarning>
      <head>
        <A11yScript />
      </head>
      <body>
        {/* First in <body>, so it's an early Tab stop. */}
        <A11yPanel />
        {children}
      </body>
    </html>
  );
}
```

If the site already has a before-paint theme script, put `<A11yScript />` right after it.

With a strict CSP that uses nonces, read the nonce the way the site already does (often `(await headers()).get("x-nonce")`) and pass it: `<A11yScript nonce={nonce} />`.

## Next.js, Pages Router

`pages/_document.tsx`: render `<A11yScript />` inside `<Head>`, and `<A11yPanel />` as the first child of `<body>` (above `<Main />`). Import `torch-a11y/panel.css` in `pages/_app.tsx`.

## Vite or any client-only React app

`src/main.tsx`, before `createRoot`:

```tsx
import { initA11y } from "torch-a11y";
import "torch-a11y/panel.css";

initA11y(); // before the first render, so nothing paints at the wrong size

createRoot(document.getElementById("root")!).render(<App />);
```

Then render `<A11yPanel />` first inside the app's root component.

## Other server-rendered frameworks (Remix, Astro, plain HTML)

Inline the output of `a11yScript()` (from `torch-a11y`) in a `<script>` in `<head>` at build or request time, import `panel.css`, and render `<A11yPanel />` where React runs. Without React, `getA11yStore()` gives you `get`, `set`, `reset` and `subscribe` to build your own UI; keep its markup and behavior equivalent to the React panel (modal dialog, labelled `role="switch"` checkboxes, focus returned on close).

## Tailwind CSS v4

In the main CSS file, after Tailwind:

```css
@import "tailwindcss";
@import "torch-a11y/tailwind.css";
@import "torch-a11y/panel.css";
```

(With this, skip the `panel.css` import in JS.) `tailwind.css` redefines `motion-reduce`, `motion-safe` and `contrast-more` to follow the panel, and adds `a11y-links` and `a11y-font`.

## Tailwind CSS v3

There are no CSS-defined variants in v3. Add these to `tailwind.config.js` plugins instead:

```js
const plugin = require("tailwindcss/plugin");

plugin(({ addVariant }) => {
  addVariant("motion-reduce", ':where([data-a11y-motion="reduce"]) &');
  addVariant("motion-safe", ':where([data-a11y-motion="no-preference"]) &');
  addVariant("contrast-more", ':where([data-a11y-contrast="more"]) &');
});
```

## Options worth knowing

- `config.storage: "session"` forgets settings when the tab closes. Good for sites used on public computers.
- `config.textMode: "variable"` for sites that already set a root `font-size`: the script then only sets `--a11y-text-scale`, and the site writes `html { font-size: calc(62.5% * var(--a11y-text-scale, 1)) }`.
- `trigger="none"` with `openA11yPanel()` puts the entry point in the site's own menu or footer instead of a floating button.
- `position="bottom-right"` if something already lives bottom-left (a chat widget, a cookie button).
