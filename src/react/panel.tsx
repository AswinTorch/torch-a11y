import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { type A11yConfig, type A11yFeature, type A11ySettings, OPEN_EVENT } from "torch-a11y";
import { useA11y } from "./use-a11y";

export type A11yLabels = {
  trigger: string;
  title: string;
  close: string;
  text: string;
  smaller: string;
  larger: string;
  contrast: string;
  contrastHint: string;
  motion: string;
  motionHint: string;
  links: string;
  linksHint: string;
  font: string;
  fontHint: string;
  reset: string;
};

export const DEFAULT_LABELS: A11yLabels = {
  trigger: "Accessibility settings",
  title: "Accessibility",
  close: "Close",
  text: "Text size",
  smaller: "Smaller text",
  larger: "Larger text",
  contrast: "High contrast",
  contrastHint: "Stronger text, borders and focus rings.",
  motion: "Reduce motion",
  motionHint: "Calmer animations. Follows your system until you change it.",
  links: "Highlight links",
  linksHint: "Underlines and marks every link.",
  font: "Readable font",
  fontHint: "Atkinson Hyperlegible, with looser spacing.",
  reset: "Reset",
};

export type A11yPanelProps = {
  /** Storage key, storage type and text steps. Pass the same to <A11yScript />. */
  config?: Partial<A11yConfig>;
  /** Which settings to offer, in this order. Default: all five. */
  features?: A11yFeature[];
  /** Where the floating button sits. Default "bottom-left". */
  position?: "bottom-left" | "bottom-right";
  /**
   * "floating" draws the round button. "none" draws no button: open the
   * panel with `openA11yPanel()` from your own, and focus returns there.
   */
  trigger?: "floating" | "none";
  /** Your own words, or another language. Missing keys fall back to English. */
  labels?: Partial<A11yLabels>;
  /** Called after every change, e.g. for haptics or analytics. */
  onChange?: (settings: A11ySettings, change: Partial<A11ySettings>) => void;
};

const ALL: A11yFeature[] = ["text", "contrast", "motion", "links", "font"];

// No layout effects on the server.
const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * The button and the settings it opens. A modal <dialog>: Escape closes
 * it, focus stays inside while it's open and the page behind is inert,
 * and focus goes back to what opened it on close. Styles in panel.css.
 */
export function A11yPanel({
  config,
  features = ALL,
  position = "bottom-left",
  trigger = "floating",
  labels: custom,
  onChange,
}: A11yPanelProps) {
  const a11y = useA11y(config);
  const { settings, text, reduceMotion, moreContrast } = a11y;
  const steps = a11y.config.textSteps;
  const labels = { ...DEFAULT_LABELS, ...custom };
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const id = useId();

  // The before-paint script applies the saved settings. React in
  // development (Strict Mode) can strip attributes it doesn't own from
  // <html> on remount, so put them back.
  useIsoLayoutEffect(() => a11y.apply(), []);

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    const onClose = () => {
      setOpen(false);
      (opener.current ?? button.current)?.focus();
      opener.current = null;
    };
    const onOpen = () => {
      if (el.open) return;
      opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      el.showModal();
      setOpen(true);
    };
    el.addEventListener("close", onClose);
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => {
      el.removeEventListener("close", onClose);
      window.removeEventListener(OPEN_EVENT, onOpen);
    };
  }, []);

  const change = (next: Partial<A11ySettings>) => {
    a11y.set(next);
    onChange?.({ ...settings, ...next }, next);
  };

  const at = Math.max(0, steps.indexOf(text));
  const step = (by: -1 | 1) => {
    const next = steps[at + by];
    if (next !== undefined) change({ text: next });
  };
  const changed = Object.keys(settings).length > 0;

  const toggles: Record<Exclude<A11yFeature, "text">, { checked: boolean; set: (on: boolean) => void }> = {
    contrast: { checked: moreContrast, set: (on) => change({ contrast: on }) },
    motion: { checked: reduceMotion, set: (on) => change({ motion: on }) },
    links: { checked: settings.links === true, set: (on) => change({ links: on || undefined }) },
    font: { checked: settings.font === true, set: (on) => change({ font: on || undefined }) },
  };

  return (
    <>
      {trigger === "floating" && (
        <button
          ref={button}
          type="button"
          data-torch-a11y="trigger"
          data-position={position}
          onClick={() => {
            opener.current = button.current;
            dialog.current?.showModal();
            setOpen(true);
          }}
          aria-label={labels.trigger}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls={`${id}-panel`}
        >
          <AccessibilityIcon />
        </button>
      )}

      <dialog
        ref={dialog}
        id={`${id}-panel`}
        data-torch-a11y="panel"
        data-position={position}
        data-trigger={trigger}
        aria-labelledby={`${id}-title`}
        // A click on the backdrop lands on the dialog itself.
        onClick={(e) => e.target === e.currentTarget && e.currentTarget.close()}
      >
        <div data-part="body">
          <div data-part="header">
            <h2 id={`${id}-title`} data-part="title">
              {labels.title}
            </h2>
            <button type="button" data-part="close" onClick={() => dialog.current?.close()} aria-label={labels.close}>
              <svg viewBox="0 0 16 16" aria-hidden>
                <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {features.map((feature) =>
            feature === "text" ? (
              <div key="text" data-part="row">
                <span id={`${id}-text`} data-part="label">
                  {labels.text}
                </span>
                <div role="group" aria-labelledby={`${id}-text`} data-part="stepper">
                  <button
                    type="button"
                    onClick={() => step(-1)}
                    aria-label={labels.smaller}
                    // Not `disabled`: that would drop focus out of the dialog.
                    aria-disabled={at === 0}
                  >
                    <span aria-hidden data-part="a-small">
                      A−
                    </span>
                  </button>
                  <output aria-live="polite">{text}%</output>
                  <button
                    type="button"
                    onClick={() => step(1)}
                    aria-label={labels.larger}
                    aria-disabled={at === steps.length - 1}
                  >
                    <span aria-hidden data-part="a-large">
                      A+
                    </span>
                  </button>
                </div>
              </div>
            ) : (
              <Switch
                key={feature}
                label={labels[feature]}
                hint={labels[`${feature}Hint`]}
                checked={toggles[feature].checked}
                onChange={toggles[feature].set}
              />
            ),
          )}

          <button
            type="button"
            data-part="reset"
            onClick={() => {
              if (!changed) return;
              a11y.reset();
              onChange?.({}, {});
            }}
            aria-disabled={!changed}
          >
            {labels.reset}
          </button>
        </div>
      </dialog>
    </>
  );
}

function Switch({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (on: boolean) => void;
}) {
  const id = useId();
  return (
    // The whole row toggles it. The name is the label; the hint is the description.
    <label data-part="row" data-switch-row="">
      <span data-part="text">
        <span id={`${id}-label`} data-part="label">
          {label}
        </span>
        <span id={`${id}-hint`} data-part="hint">
          {hint}
        </span>
      </span>
      <input
        type="checkbox"
        role="switch"
        data-part="switch"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        // Space toggles a checkbox natively; switches take Enter too.
        onKeyDown={(e) => {
          if (e.key !== "Enter") return;
          e.preventDefault();
          e.currentTarget.click();
        }}
        aria-labelledby={`${id}-label`}
        aria-describedby={`${id}-hint`}
      />
    </label>
  );
}

function AccessibilityIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="4.75" r="1.9" fill="currentColor" />
      <path
        d="M5 8.75c2.3.65 4.6 1 7 1s4.7-.35 7-1M12 9.75v4.5m0 0-2.75 6m2.75-6 2.75 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
