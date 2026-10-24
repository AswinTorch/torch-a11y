import {
  type A11yConfig,
  type A11ySettings,
  MORE_CONTRAST_QUERY,
  REDUCED_MOTION_QUERY,
  applyA11y,
  readA11y,
  resolveConfig,
  writeA11y,
} from "./core";

export type A11yState = {
  /** What's saved. Unset keys are defaults. */
  settings: A11ySettings;
  /** The text size in effect, in percent. */
  text: number;
  /** Whether motion is reduced: the saved choice, else the system setting. */
  reduceMotion: boolean;
  /** Whether more contrast is on: the saved choice, else the system setting. */
  moreContrast: boolean;
  config: A11yConfig;
};

export type A11yStore = {
  get(): A11yState;
  subscribe(listener: () => void): () => void;
  /** Merges a change in, saves it, and applies it. `undefined` clears a key. */
  set(change: Partial<A11ySettings>): void;
  /** Clears everything; contrast and motion go back to following the system. */
  reset(): void;
  /** Writes the current settings onto <html> again. */
  apply(): void;
};

const stores = new Map<string, A11yStore>();

function matches(query: string) {
  return typeof matchMedia === "function" && matchMedia(query).matches;
}

/**
 * One store per storage key, shared by every panel and hook that uses it.
 * Safe to call on the server; it only touches the DOM once used.
 */
export function getA11yStore(config?: Partial<A11yConfig>): A11yStore {
  const c = resolveConfig(config);
  const id = `${c.storage}:${c.storageKey}`;
  const existing = stores.get(id);
  if (existing) return existing;

  let state: A11yState | null = null;
  const listeners = new Set<() => void>();

  const derive = (settings: A11ySettings): A11yState => ({
    settings,
    text: settings.text ?? 100,
    reduceMotion: settings.motion ?? matches(REDUCED_MOTION_QUERY),
    moreContrast: settings.contrast ?? matches(MORE_CONTRAST_QUERY),
    config: c,
  });

  const get = () => (state ??= derive(readA11y(c)));

  const publish = (settings: A11ySettings) => {
    state = derive(settings);
    applyA11y(settings, c);
    listeners.forEach((l) => l());
  };

  // A change to a system setting the user hasn't overridden, or to the
  // settings in another tab.
  const onSystem = () => publish(get().settings);
  const onStorage = (e: StorageEvent) => {
    if (e.key === c.storageKey || e.key === null) publish(readA11y(c));
  };

  let detach: (() => void) | null = null;
  const attach = () => {
    const queries = [REDUCED_MOTION_QUERY, MORE_CONTRAST_QUERY].map((q) => matchMedia(q));
    queries.forEach((m) => m.addEventListener("change", onSystem));
    window.addEventListener("storage", onStorage);
    return () => {
      queries.forEach((m) => m.removeEventListener("change", onSystem));
      window.removeEventListener("storage", onStorage);
    };
  };

  const store: A11yStore = {
    get,
    subscribe(listener) {
      listeners.add(listener);
      if (!detach && typeof window !== "undefined") detach = attach();
      return () => {
        listeners.delete(listener);
        if (!listeners.size) {
          detach?.();
          detach = null;
        }
      };
    },
    set(change) {
      const next: A11ySettings = { ...get().settings, ...change };
      for (const key of Object.keys(next) as (keyof A11ySettings)[]) {
        if (next[key] === undefined) delete next[key];
      }
      publish(writeA11y(next, c));
    },
    reset() {
      publish(writeA11y({}, c));
    },
    apply() {
      applyA11y(get().settings, c);
    },
  };
  stores.set(id, store);
  return store;
}
