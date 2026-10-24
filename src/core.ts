/**
 * The settings, how they're stored, and how they land on <html>. No
 * framework here: the React layer and the before-paint script both sit on
 * top of this.
 */

export type A11yFeature = "text" | "contrast" | "motion" | "links" | "font";

export type A11ySettings = {
  /** Text size as a percent of the browser's own. One of `textSteps`. */
  text?: number;
  /** true is more contrast, false is the site's normal palette. Unset follows `prefers-contrast: more`. */
  contrast?: boolean;
  /** true reduces motion, false allows it. Unset follows `prefers-reduced-motion`. */
  motion?: boolean;
  /** Underline and highlight links. */
  links?: boolean;
  /** Atkinson Hyperlegible Next, with looser spacing. */
  font?: boolean;
};

export type A11yConfig = {
  /** Where the settings object is kept. Default "torch-a11y". */
  storageKey: string;
  /** "local" remembers across visits; "session" forgets when the tab closes, for public computers. Default "local". */
  storage: "local" | "session";
  /** The text sizes the stepper moves through, in percent. Must include 100. */
  textSteps: number[];
  /**
   * "root" sets the root font-size, so everything in rem scales. "variable"
   * only sets `--a11y-text-scale` on <html>, for sites that size their root
   * themselves: `html { font-size: calc(62.5% * var(--a11y-text-scale, 1)) }`.
   */
  textMode: "root" | "variable";
};

export const DEFAULT_CONFIG: A11yConfig = {
  storageKey: "torch-a11y",
  storage: "local",
  textSteps: [90, 100, 110, 125, 150, 175, 200],
  textMode: "root",
};

export const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
export const MORE_CONTRAST_QUERY = "(prefers-contrast: more)";

/** Fills in defaults and keeps `textSteps` sorted, unique and including 100. */
export function resolveConfig(config?: Partial<A11yConfig>): A11yConfig {
  const steps = (config?.textSteps ?? DEFAULT_CONFIG.textSteps)
    .filter((n) => Number.isFinite(n) && n > 0)
    .concat(100);
  return {
    storageKey: config?.storageKey || DEFAULT_CONFIG.storageKey,
    storage: config?.storage === "session" ? "session" : "local",
    textSteps: [...new Set(steps)].sort((a, b) => a - b),
    textMode: config?.textMode === "variable" ? "variable" : "root",
  };
}

/**
 * Writes settings onto <html>:
 *
 * - root font-size (or `--a11y-text-scale`) and `data-a11y-text`
 * - `data-a11y-contrast`: "more" | "no-preference"
 * - `data-a11y-motion`: "reduce" | "no-preference"
 * - `data-a11y-links` and `data-a11y-font`, present when on
 *
 * Self-contained on purpose: `a11yScript()` stringifies it into the
 * before-paint script, so it can't reference anything outside itself.
 */
export function applyA11y(s: A11ySettings, c: A11yConfig) {
  const root = document.documentElement;
  const media = (q: string) => typeof matchMedia === "function" && matchMedia(q).matches;
  const text = c.textSteps.indexOf(Number(s.text)) >= 0 ? Number(s.text) : 100;
  if (c.textMode === "root") root.style.fontSize = text === 100 ? "" : text + "%";
  root.style.setProperty("--a11y-text-scale", String(text / 100));
  root.setAttribute("data-a11y-text", String(text));
  const contrast = typeof s.contrast === "boolean" ? s.contrast : media("(prefers-contrast: more)");
  root.setAttribute("data-a11y-contrast", contrast ? "more" : "no-preference");
  const motion = typeof s.motion === "boolean" ? s.motion : media("(prefers-reduced-motion: reduce)");
  root.setAttribute("data-a11y-motion", motion ? "reduce" : "no-preference");
  root.toggleAttribute("data-a11y-links", s.links === true);
  root.toggleAttribute("data-a11y-font", s.font === true);
}

/** Removes everything `applyA11y` wrote. */
export function clearA11y() {
  const root = document.documentElement;
  root.style.removeProperty("font-size");
  root.style.removeProperty("--a11y-text-scale");
  for (const name of ["data-a11y-text", "data-a11y-contrast", "data-a11y-motion", "data-a11y-links", "data-a11y-font"]) {
    root.removeAttribute(name);
  }
}

function storageFor(c: A11yConfig): Storage | null {
  try {
    return c.storage === "session" ? sessionStorage : localStorage;
  } catch {
    return null;
  }
}

/** Only known keys with the right types survive, so a bad value can't break the page. */
export function sanitize(value: unknown, c: A11yConfig): A11ySettings {
  if (!value || typeof value !== "object") return {};
  const v = value as Record<string, unknown>;
  const out: A11ySettings = {};
  if (typeof v.text === "number" && v.text !== 100 && c.textSteps.includes(v.text)) out.text = v.text;
  for (const key of ["contrast", "motion", "links", "font"] as const) {
    if (typeof v[key] === "boolean") out[key] = v[key];
  }
  if (out.links === false) delete out.links;
  if (out.font === false) delete out.font;
  return out;
}

export function readA11y(config?: Partial<A11yConfig>): A11ySettings {
  const c = resolveConfig(config);
  try {
    return sanitize(JSON.parse(storageFor(c)?.getItem(c.storageKey) ?? "null"), c);
  } catch {
    return {};
  }
}

export function writeA11y(settings: A11ySettings, config?: Partial<A11yConfig>) {
  const c = resolveConfig(config);
  const clean = sanitize(settings, c);
  try {
    const store = storageFor(c);
    if (Object.keys(clean).length) store?.setItem(c.storageKey, JSON.stringify(clean));
    else store?.removeItem(c.storageKey);
  } catch {}
  return clean;
}

/**
 * The before-paint script: reads the saved settings and applies them while
 * the HTML is still parsing, so the page never paints at the wrong size or
 * contrast. Put it inline in <head>. `<A11yScript />` does this in React.
 */
export function a11yScript(config?: Partial<A11yConfig>) {
  const c = resolveConfig(config);
  // Escaped so a config value can never close the <script> tag.
  const json = JSON.stringify(c).replace(/</g, "\\u003c");
  return `(function(c){var s={};try{s=JSON.parse(window[c.storage+"Storage"].getItem(c.storageKey))||{}}catch(e){}try{(${applyA11y.toString()})(s,c)}catch(e){}})(${json})`;
}

/**
 * For single-page apps with no server rendering: call it before the first
 * render (top of main.tsx) and the result is the same as the script.
 */
export function initA11y(config?: Partial<A11yConfig>) {
  if (typeof document === "undefined") return;
  const c = resolveConfig(config);
  applyA11y(readA11y(c), c);
}

/**
 * Whether motion should be reduced right now: the panel's setting, else the
 * system's. Use it before starting JS animations (canvas, WAAPI, scroll).
 */
export function prefersReducedMotion() {
  if (typeof document === "undefined") return false;
  const set = document.documentElement.getAttribute("data-a11y-motion");
  if (set) return set === "reduce";
  return typeof matchMedia === "function" && matchMedia(REDUCED_MOTION_QUERY).matches;
}

/** Whether more contrast is on right now: the panel's setting, else the system's. */
export function prefersMoreContrast() {
  if (typeof document === "undefined") return false;
  const set = document.documentElement.getAttribute("data-a11y-contrast");
  if (set) return set === "more";
  return typeof matchMedia === "function" && matchMedia(MORE_CONTRAST_QUERY).matches;
}

export const OPEN_EVENT = "torch-a11y:open";

/** Opens the panel from your own button or menu item. */
export function openA11yPanel() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(OPEN_EVENT));
}
