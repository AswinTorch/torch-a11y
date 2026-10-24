import { type ReactNode, useState } from "react";
import { A11yPanel, openA11yPanel, useA11y } from "torch-a11y/react";

const GITHUB = "https://github.com/AswinTorch/torch-a11y";
const NPM = "https://www.npmjs.com/package/torch-a11y";

export function App() {
  return (
    <>
      {/* First in the page, so it's one Tab away. */}
      <A11yPanel />

      <div className="page">
        <header className="flex justify-end">
          <nav className="flex items-center gap-4 text-[0.875rem]">
            <a href={GITHUB}>GitHub</a>
            <a href={NPM}>npm</a>
            <ThemeToggle />
          </nav>
        </header>

        <main>
          <h1 className="mt-12 font-mono text-[1.75rem] font-semibold tracking-[-0.02em]">torch-a11y</h1>
          <p className="mt-3 text-(--fg-muted)">
            An accessibility preferences panel for React sites: text size, high contrast, reduced
            motion, highlighted links and a readable font. Applied before first paint, themed from
            your CSS variables. MIT.
          </p>

          <Command>npm install torch-a11y</Command>

          <Section title="Try it">
            <p>
              Use the button in the bottom left, or{" "}
              <button type="button" onClick={openA11yPanel} className="text-link">
                open the panel
              </button>
              . This page follows it. Here&apos;s what it writes:
            </p>
            <Attributes />
          </Section>

          <Section title="Next.js">
            <Code>{`// app/layout.tsx
import { A11yPanel, A11yScript } from "torch-a11y/react";
import "torch-a11y/panel.css";

<html lang="en" suppressHydrationWarning>
  <head>
    <A11yScript />
  </head>
  <body>
    <A11yPanel />
    {children}
  </body>
</html>`}</Code>
            <p>
              <code>{"<A11yScript />"}</code> is inline on purpose, so saved settings apply before
              first paint. Under a strict CSP, pass <code>nonce</code>.
            </p>
          </Section>

          <Section title="Vite">
            <Code>{`// src/main.tsx
import { initA11y } from "torch-a11y";
import "torch-a11y/panel.css";

initA11y(); // before the first render`}</Code>
          </Section>

          <Section title="Tailwind v4">
            <Code>{`@import "tailwindcss";
@import "torch-a11y/tailwind.css";
@import "torch-a11y/panel.css";`}</Code>
            <p>
              <code>motion-reduce:</code>, <code>motion-safe:</code> and <code>contrast-more:</code> now
              follow the panel, which defaults to the system setting.
            </p>
          </Section>

          <Section title="Your part">
            <p>The panel sets attributes. Your CSS responds.</p>
            <dl className="contract">
              <dt>Text size</dt>
              <dd>
                Text in <code>rem</code>. Fluid type scales its viewport term:{" "}
                <code>clamp(3rem, 9vw * var(--a11y-text-scale, 1), 5.5rem)</code>.
              </dd>
              <dt>Contrast</dt>
              <dd>
                Colors as variables, with stronger values under{" "}
                <code>{':root[data-a11y-contrast="more"]'}</code>. 7:1 for text, 3:1 for borders.
              </dd>
              <dt>Motion</dt>
              <dd>
                Key it off <code>{'[data-a11y-motion="reduce"]'}</code>, not the media query. In JS,{" "}
                <code>prefersReducedMotion()</code>.
              </dd>
              <dt>Links, font</dt>
              <dd>
                Nothing to do. Mark icon links <code>{'data-a11y-link="ring"'}</code> and artwork{" "}
                <code>data-a11y-keep</code>.
              </dd>
            </dl>
          </Section>

          <Section title="Options">
            <Code>{`<A11yPanel
  config={{ storageKey: "my-site", storage: "session" }}
  features={["text", "contrast", "motion"]}
  position="bottom-right"
  trigger="none"            // open with openA11yPanel()
  labels={{ title: "Lesbarkeit" }}
  onChange={(settings, change) => {}}
/>`}</Code>
            <p>
              Theme it with <code>--a11y-surface</code>, <code>--a11y-fg</code>,{" "}
              <code>--a11y-muted</code> and <code>--a11y-line</code>. Headless:{" "}
              <code>useA11y()</code>.
            </p>
          </Section>

          <Section title="Agent skill">
            <p>Audits your codebase for px text, hardcoded colors and motion queries, fixes them, and checks the result.</p>
            <Command>npx torch-a11y add-skill</Command>
          </Section>
        </main>

        {/* Room at the bottom so the last line clears the panel's button. */}
        <footer className="mt-20 flex flex-wrap gap-x-4 gap-y-1 border-t border-(--hairline) pt-6 pb-24 text-[0.875rem] text-(--fg-muted)">
          <span>
            MIT. By <a href="https://aswinnair.com">Aswin Nair</a>.
          </span>
          <a href={`${GITHUB}#readme`}>Full docs</a>
        </footer>
      </div>
    </>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-14 space-y-4">
      <h2 className="text-[1.0625rem] font-semibold">{title}</h2>
      {children}
    </section>
  );
}

/** What the panel has written onto <html>, live. */
function Attributes() {
  const { text, moreContrast, reduceMotion, settings } = useA11y();
  const attrs = [
    text !== 100 && `style="font-size: ${text}%"`,
    `data-a11y-text="${text}"`,
    `data-a11y-contrast="${moreContrast ? "more" : "no-preference"}"`,
    `data-a11y-motion="${reduceMotion ? "reduce" : "no-preference"}"`,
    settings.links && "data-a11y-links",
    settings.font && "data-a11y-font",
  ].filter(Boolean);
  return (
    <pre className="code" aria-live="polite">
      <code>{`<html\n${attrs.map((a) => `  ${a}`).join("\n")}\n>`}</code>
    </pre>
  );
}

function Code({ children }: { children: string }) {
  return (
    <pre className="code">
      <code>{children}</code>
    </pre>
  );
}

function Command({ children }: { children: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="command">
      <code>
        <span aria-hidden className="text-(--fg-muted)">
          ${" "}
        </span>
        {children}
      </code>
      <button
        type="button"
        onClick={() =>
          void navigator.clipboard?.writeText(children).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1600);
          })
        }
      >
        <span aria-live="polite">{copied ? "Copied" : "Copy"}</span>
      </button>
    </div>
  );
}

function ThemeToggle() {
  const [, rerender] = useState(0);
  const dark =
    typeof document !== "undefined" &&
    (document.documentElement.dataset.theme === "dark" ||
      (!document.documentElement.dataset.theme && matchMedia("(prefers-color-scheme: dark)").matches));
  return (
    <button
      type="button"
      className="text-link"
      onClick={() => {
        const next = dark ? "light" : "dark";
        document.documentElement.dataset.theme = next;
        try {
          localStorage.setItem("theme", next);
        } catch {}
        rerender((n) => n + 1);
      }}
    >
      {dark ? "Light" : "Dark"}
    </button>
  );
}
