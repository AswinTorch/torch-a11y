import { type CSSProperties, type ReactNode, useState } from "react";
import { A11yPanel, openA11yPanel, useA11y } from "torch-a11y/react";

const GITHUB = "https://github.com/AswinTorch/torch-a11y";
const NPM = "https://www.npmjs.com/package/torch-a11y";

const i = (n: number) => ({ "--i": n }) as CSSProperties;
const hue = (h: number) => ({ "--hue": h }) as CSSProperties;

export function App() {
  return (
    <>
      {/* First in the page, so it's one Tab away. */}
      <A11yPanel />

      <header className="sticky top-0 z-10 bg-(--bg)/70 pt-[env(safe-area-inset-top)] backdrop-blur-xl backdrop-saturate-150">
        {/* Wraps instead of overflowing when the text is large. */}
        <div className="mx-auto flex min-h-14 max-w-5xl flex-wrap items-center justify-between gap-x-4 gap-y-1 px-5 py-2 sm:px-6">
          <a href="#top" className="link rounded-sm text-[0.9375rem] font-semibold tracking-tight text-(--fg)">
            torch-a11y
          </a>
          <nav className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.875rem] sm:gap-x-6">
            <a href="#add" className="link rounded-sm">
              Add it
            </a>
            <a href={GITHUB} className="link rounded-sm">
              GitHub
            </a>
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <main id="top" className="mx-auto max-w-5xl px-5 sm:px-6">
        <section className="flex flex-col items-center pt-20 pb-24 text-center sm:pt-28 sm:pb-28">
          <p className="rise text-[0.875rem] font-medium text-(--fg-muted)" style={i(0)}>
            Open source. MIT.
          </p>
          <h1 className="display rise mt-4" style={i(1)}>
            Read it your way.
          </h1>
          <p className="lede rise mt-5 max-w-xl text-balance" style={i(2)}>
            A small accessibility panel for your site. Text size, contrast, motion, links and a readable
            font, applied before the first paint.
          </p>
          <div className="rise mt-9 flex flex-wrap items-center justify-center gap-3" style={i(3)}>
            <button
              type="button"
              onClick={openA11yPanel}
              className="pill pill-primary flex h-11 items-center rounded-full px-5 text-[0.9375rem] font-medium"
            >
              Open the panel
            </button>
            <CopyCommand command="npm install torch-a11y" />
          </div>
          <p className="rise mt-5 text-[0.8125rem] text-(--fg-muted)" style={i(4)}>
            Or use the button in the corner. Everything on this page follows it.
          </p>
        </section>

        <Section title="Five settings" lede="Tap a tile to try one. The panel stays in sync.">
          <Settings />
        </Section>

        <Section title="Why it exists" lede="People don't always browse on their own devices.">
          <div className="max-w-2xl space-y-5 text-[1.0625rem] leading-[1.6] tracking-[-0.01em] text-(--fg-muted) sm:text-[1.1875rem]">
            <p>
              A library computer, a work laptop, a friend&apos;s phone. The system&apos;s accessibility
              settings there aren&apos;t yours to change, or were never set up. A migraine or a
              bright afternoon doesn&apos;t send anyone digging through settings either.
            </p>
            <p>
              So the most useful of those settings live on the page. It isn&apos;t an overlay: it
              doesn&apos;t scan or patch anything, and it doesn&apos;t make a site compliant. It
              writes your choices onto the page, and a site built for it listens.
            </p>
            <p>
              It skips text-to-speech, cursors and reading rulers. Your system does those better.
            </p>
          </div>
        </Section>

        <Section id="add" title="Add it" lede="Three lines in a Next.js layout.">
          <Code>
            <span className="k">{"// app/layout.tsx"}</span>
            {`
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
</html>`}
          </Code>
          <p className="mt-4 text-[0.9375rem] text-(--fg-muted)">
            Using Vite? Call <InlineCode>initA11y()</InlineCode> before your first render instead. With
            Tailwind, import <InlineCode>torch-a11y/tailwind.css</InlineCode> and your{" "}
            <InlineCode>motion-reduce:</InlineCode> utilities follow the panel.
          </p>
        </Section>

        <Section title="Your part" lede="The panel sets attributes. Your CSS responds.">
          <ul className="border-t border-(--hairline)">
            <ContractRow name="Text size" rule="Size text in rem. Anything in px stays put." />
            <ContractRow
              name="High contrast"
              rule="Colors as CSS variables, with stronger values under one selector. No filters, no overrides."
            />
            <ContractRow
              name="Reduce motion"
              rule="Key motion off the attribute, not the media query, so the switch works both ways."
            />
            <ContractRow name="Links and font" rule="Nothing to do. Mark artwork data-a11y-keep." />
          </ul>
        </Section>

        <Section title="Or let your agent do it" lede="The skill audits your codebase, converts it, and checks the result.">
          <div className="flex flex-col items-start gap-4">
            <CopyCommand command="npx torch-a11y add-skill" />
            <p className="max-w-2xl text-[0.9375rem] leading-relaxed text-(--fg-muted)">
              It finds px text, hardcoded colors and motion queries, converts them, adds high contrast
              values that clear 7:1, then verifies by keyboard, at 200% and in both themes. Then ask:
              &ldquo;Set up torch-a11y on this site.&rdquo;
            </p>
          </div>
        </Section>
      </main>

      <footer className="border-t border-(--hairline)">
        {/* Room at the bottom so the last row clears the panel's button. */}
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-5 pt-10 pb-[max(5rem,calc(env(safe-area-inset-bottom)+4rem))] text-[0.875rem] text-(--fg-muted) sm:flex-row sm:px-6">
          <p>
            MIT. Made by{" "}
            <a href="https://aswinnair.com" className="link rounded-sm font-medium text-(--fg)">
              Aswin Nair
            </a>
            .
          </p>
          <div className="flex gap-5">
            <a href={GITHUB} className="link rounded-sm">
              GitHub
            </a>
            <a href={NPM} className="link rounded-sm">
              npm
            </a>
          </div>
        </div>
      </footer>
    </>
  );
}

function Section({ id, title, lede, children }: { id?: string; title: string; lede?: string; children: ReactNode }) {
  return (
    <section id={id} className="pb-24 sm:pb-28">
      <div className="mb-8 sm:mb-10">
        <h2 className="title">{title}</h2>
        {lede && <p className="mt-2 text-[1.0625rem] text-(--fg-muted)">{lede}</p>}
      </div>
      {children}
    </section>
  );
}

function Settings() {
  const { text, moreContrast, reduceMotion, settings, set, config } = useA11y();
  const steps = config.textSteps;
  const at = steps.indexOf(text);

  return (
    <ul className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
      <li className="rise" style={i(0)}>
        <div className="tile" style={hue(215)}>
          <span className="font-semibold tracking-[-0.04em]" style={{ fontSize: "3.5rem" }} aria-hidden>
            Aa
          </span>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 px-1">
          <div>
            <p className="text-[1.0625rem] font-semibold tracking-[-0.02em]">Text size</p>
            <p className="text-[0.9375rem] text-(--fg-muted)">90% to 200%.</p>
          </div>
          <div role="group" aria-label="Text size" className="flex items-center rounded-full bg-(--fill)">
            <StepButton label="Smaller text" off={at <= 0} onClick={() => set({ text: steps[at - 1] })}>
              A−
            </StepButton>
            <output aria-live="polite" className="w-12 text-center text-[0.8125rem] font-medium tabular-nums">
              {text}%
            </output>
            <StepButton label="Larger text" off={at >= steps.length - 1} onClick={() => set({ text: steps[at + 1] })}>
              A+
            </StepButton>
          </div>
        </div>
      </li>

      <Toggle
        n={1}
        hueValue={0}
        name="High contrast"
        hint="Same palette, pushed apart."
        on={moreContrast}
        onToggle={() => set({ contrast: !moreContrast })}
      >
        <div className="sample-card w-[70%] px-4 py-3 text-left">
          <p className="text-[0.9375rem] font-semibold">Order shipped</p>
          <p className="text-[0.8125rem] text-(--fg-muted)">Arrives Thursday, 2 to 4pm.</p>
        </div>
      </Toggle>

      <Toggle
        n={2}
        hueValue={150}
        name="Reduce motion"
        hint="Follows your system until changed."
        on={reduceMotion}
        onToggle={() => set({ motion: !reduceMotion })}
      >
        <div className="dots flex items-end gap-2.5 pt-6" aria-hidden>
          {[0, 1, 2].map((n) => (
            <span key={n} style={i(n)} />
          ))}
        </div>
      </Toggle>

      <Toggle
        n={3}
        hueValue={45}
        name="Highlight links"
        hint="Every link, underlined and marked."
        on={settings.links === true}
        onToggle={() => set({ links: settings.links ? undefined : true })}
      >
        <p className="w-[75%] text-[1rem] leading-relaxed" aria-hidden>
          Read the <span className="demo-link font-medium underline-offset-2">docs</span> or the{" "}
          <span className="demo-link font-medium underline-offset-2">source</span>.
        </p>
      </Toggle>

      <Toggle
        n={4}
        hueValue={275}
        name="Readable font"
        hint="Atkinson Hyperlegible, looser spacing."
        on={settings.font === true}
        onToggle={() => set({ font: settings.font ? undefined : true })}
      >
        <span className="text-[2.25rem] font-medium tracking-[0.02em]" aria-hidden>
          Il1 O0 rn
        </span>
      </Toggle>

      <li className="rise" style={i(5)}>
        <div className="tile" style={hue(30)}>
          <p className="w-[75%] text-center text-[0.9375rem] leading-snug text-(--fg-muted)">
            No text-to-speech, cursors or reading rulers. Your system does those better.
          </p>
        </div>
        <div className="mt-4 px-1">
          <p className="text-[1.0625rem] font-semibold tracking-[-0.02em]">What it skips</p>
          <p className="text-[0.9375rem] text-(--fg-muted)">On purpose.</p>
        </div>
      </li>
    </ul>
  );
}

function Toggle({
  n,
  hueValue,
  name,
  hint,
  on,
  onToggle,
  children,
}: {
  n: number;
  hueValue: number;
  name: string;
  hint: string;
  on: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <li className="rise" style={i(n)}>
      <button type="button" aria-pressed={on} onClick={onToggle} className="card block w-full text-left">
        <div className="tile" style={hue(hueValue)}>
          {children}
        </div>
        <div className="mt-4 flex items-center justify-between gap-3 px-1">
          <div>
            <p className="text-[1.0625rem] font-semibold tracking-[-0.02em]">{name}</p>
            <p className="text-[0.9375rem] text-(--fg-muted)">{hint}</p>
          </div>
          <span className="state" aria-hidden>
            {on ? "On" : "Off"}
          </span>
        </div>
      </button>
    </li>
  );
}

function StepButton({ label, off, onClick, children }: { label: string; off: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-disabled={off}
      onClick={() => !off && onClick()}
      className="pill grid h-9 w-10 place-items-center rounded-full text-[0.9375rem] font-semibold aria-disabled:opacity-40"
    >
      <span aria-hidden>{children}</span>
    </button>
  );
}

function ContractRow({ name, rule }: { name: string; rule: string }) {
  return (
    <li className="row flex flex-col gap-1 py-4 sm:flex-row sm:gap-6">
      <span className="shrink-0 text-[1rem] font-semibold tracking-[-0.015em] sm:w-44">{name}</span>
      <span className="text-[0.9375rem] text-(--fg-muted)">{rule}</span>
    </li>
  );
}

function Code({ children }: { children: ReactNode }) {
  return (
    <pre className="code overflow-x-auto px-5 py-4">
      <code>{children}</code>
    </pre>
  );
}

function InlineCode({ children }: { children: ReactNode }) {
  return <code className="rounded-md bg-(--fill) px-1.5 py-0.5 font-mono text-[0.875em] text-(--fg)">{children}</code>;
}

function CopyCommand({ command }: { command: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard?.writeText(command).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1600);
        });
      }}
      className="pill pill-secondary flex h-11 items-center gap-3 rounded-full px-5 text-[0.875rem]"
    >
      <code className="font-mono">{command}</code>
      <span className="font-sans text-[0.8125rem] font-medium text-(--fg-muted)" aria-live="polite">
        {copied ? "Copied" : "Copy"}
      </span>
    </button>
  );
}

function ThemeToggle() {
  return (
    <button
      type="button"
      aria-label="Toggle theme"
      onClick={() => {
        const root = document.documentElement;
        const dark =
          root.dataset.theme === "dark" ||
          (!root.dataset.theme && matchMedia("(prefers-color-scheme: dark)").matches);
        root.dataset.theme = dark ? "light" : "dark";
        try {
          localStorage.setItem("theme", root.dataset.theme);
        } catch {}
      }}
      className="icon-button theme-toggle relative grid size-8 place-items-center rounded-full text-(--fg-muted)"
    >
      <svg className="icon icon-moon" viewBox="0 0 20 20" width="16" height="16" aria-hidden>
        <path d="M17 11.5A7 7 0 0 1 8.5 3a7 7 0 1 0 8.5 8.5Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
      <svg className="icon icon-sun" viewBox="0 0 20 20" width="16" height="16" aria-hidden>
        <circle cx="10" cy="10" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M10 2v2M10 16v2M2 10h2M16 10h2M4.3 4.3l1.4 1.4M14.3 14.3l1.4 1.4M4.3 15.7l1.4-1.4M14.3 5.7l1.4-1.4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    </button>
  );
}
