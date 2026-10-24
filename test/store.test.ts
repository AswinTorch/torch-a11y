import { beforeEach, describe, expect, it } from "vitest";
import { getA11yStore } from "torch-a11y";
import { mockMedia, resetDom } from "./setup";

let n = 0;
beforeEach(() => resetDom());

describe("getA11yStore", () => {
  it("is shared per storage key", () => {
    expect(getA11yStore({ storageKey: "same" })).toBe(getA11yStore({ storageKey: "same" }));
    expect(getA11yStore({ storageKey: "same" })).not.toBe(getA11yStore({ storageKey: "other" }));
  });

  it("sets, saves, applies and notifies", () => {
    mockMedia();
    const key = `store-${n++}`;
    const store = getA11yStore({ storageKey: key });
    let calls = 0;
    const off = store.subscribe(() => calls++);
    store.set({ text: 150, links: true });
    expect(store.get()).toMatchObject({ text: 150, settings: { text: 150, links: true } });
    expect(JSON.parse(localStorage.getItem(key)!)).toEqual({ text: 150, links: true });
    expect(document.documentElement.style.fontSize).toBe("150%");
    expect(calls).toBe(1);
    store.set({ links: undefined });
    expect(store.get().settings).toEqual({ text: 150 });
    off();
  });

  it("follows the system until a choice is made, and again after reset", () => {
    const media = mockMedia();
    const store = getA11yStore({ storageKey: `store-${n++}` });
    const off = store.subscribe(() => {});
    expect(store.get().reduceMotion).toBe(false);
    media.set("(prefers-reduced-motion: reduce)", true);
    expect(store.get().reduceMotion).toBe(true);
    expect(document.documentElement.dataset.a11yMotion).toBe("reduce");
    store.set({ motion: false });
    media.set("(prefers-reduced-motion: reduce)", true);
    expect(store.get().reduceMotion).toBe(false);
    store.reset();
    expect(store.get().reduceMotion).toBe(true);
    expect(localStorage.length).toBe(0);
    off();
  });
});
