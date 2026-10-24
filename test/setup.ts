import { vi } from "vitest";

/** A matchMedia whose answers the test controls, with change events. */
export function mockMedia(initial: Record<string, boolean> = {}) {
  const state = { ...initial };
  const lists = new Map<string, Set<() => void>>();
  vi.stubGlobal("matchMedia", (query: string) => ({
    get matches() {
      return state[query] ?? false;
    },
    media: query,
    addEventListener: (_: string, fn: () => void) => {
      if (!lists.has(query)) lists.set(query, new Set());
      lists.get(query)!.add(fn);
    },
    removeEventListener: (_: string, fn: () => void) => lists.get(query)?.delete(fn),
  }));
  return {
    set(query: string, value: boolean) {
      state[query] = value;
      lists.get(query)?.forEach((fn) => fn());
    },
  };
}

export function resetDom() {
  const root = document.documentElement;
  for (const a of [...root.attributes]) if (a.name !== "lang") root.removeAttribute(a.name);
  localStorage.clear();
  sessionStorage.clear();
}
