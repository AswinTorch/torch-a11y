import { useSyncExternalStore } from "react";
import { type A11yConfig, type A11ySettings, type A11yState, getA11yStore, resolveConfig } from "torch-a11y";

export type UseA11y = A11yState & {
  set: (change: Partial<A11ySettings>) => void;
  reset: () => void;
  /** Writes the settings onto <html> again. */
  apply: () => void;
};

// What the server and the first client render see: defaults. Cached so
// React gets the same object every time.
const serverStates = new Map<string, A11yState>();
function serverState(config?: Partial<A11yConfig>) {
  const c = resolveConfig(config);
  const id = `${c.storage}:${c.storageKey}`;
  let state = serverStates.get(id);
  if (!state) {
    state = { settings: {}, text: 100, reduceMotion: false, moreContrast: false, config: c };
    serverStates.set(id, state);
  }
  return state;
}

/**
 * The settings in effect, live, plus `set` and `reset`. For your own UI
 * (headless), or for JS that should follow them, like a canvas animation.
 * Pass the same config as the panel if you changed it.
 */
export function useA11y(config?: Partial<A11yConfig>): UseA11y {
  const store = getA11yStore(config);
  const state = useSyncExternalStore(store.subscribe, store.get, () => serverState(config));
  return { ...state, set: store.set, reset: store.reset, apply: store.apply };
}
