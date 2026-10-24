import { beforeEach, describe, expect, it } from "vitest";
import {
  a11yScript,
  applyA11y,
  initA11y,
  prefersMoreContrast,
  prefersReducedMotion,
  readA11y,
  resolveConfig,
  writeA11y,
} from "torch-a11y";
import { mockMedia, resetDom } from "./setup";

const root = document.documentElement;

beforeEach(() => {
  resetDom();
  mockMedia();
});

describe("resolveConfig", () => {
  it("fills defaults", () => {
    expect(resolveConfig()).toEqual({
      storageKey: "torch-a11y",
      storage: "local",
      textSteps: [90, 100, 110, 125, 150, 175, 200],
      textMode: "root",
    });
  });
  it("sorts steps, drops junk and always includes 100", () => {
    expect(resolveConfig({ textSteps: [150, 120, 150, -5, NaN] }).textSteps).toEqual([100, 120, 150]);
  });
});

describe("applyA11y", () => {
  it("writes every setting onto <html>", () => {
    applyA11y({ text: 150, contrast: true, motion: true, links: true, font: true }, resolveConfig());
    expect(root.style.fontSize).toBe("150%");
    expect(root.style.getPropertyValue("--a11y-text-scale")).toBe("1.5");
    expect(root.dataset.a11yText).toBe("150");
    expect(root.dataset.a11yContrast).toBe("more");
    expect(root.dataset.a11yMotion).toBe("reduce");
    expect(root.hasAttribute("data-a11y-links")).toBe(true);
    expect(root.hasAttribute("data-a11y-font")).toBe(true);
  });

  it("defaults contrast and motion to the system setting", () => {
    mockMedia({ "(prefers-reduced-motion: reduce)": true, "(prefers-contrast: more)": true });
    applyA11y({}, resolveConfig());
    expect(root.dataset.a11yMotion).toBe("reduce");
    expect(root.dataset.a11yContrast).toBe("more");
  });

  it("lets an explicit choice override the system", () => {
    mockMedia({ "(prefers-reduced-motion: reduce)": true });
    applyA11y({ motion: false }, resolveConfig());
    expect(root.dataset.a11yMotion).toBe("no-preference");
  });

  it("ignores a text size that isn't a step", () => {
    applyA11y({ text: 137 }, resolveConfig());
    expect(root.style.fontSize).toBe("");
    expect(root.dataset.a11yText).toBe("100");
  });

  it("only sets the variable in variable mode", () => {
    applyA11y({ text: 125 }, resolveConfig({ textMode: "variable" }));
    expect(root.style.fontSize).toBe("");
    expect(root.style.getPropertyValue("--a11y-text-scale")).toBe("1.25");
  });
});

describe("storage", () => {
  it("round-trips and drops defaults", () => {
    writeA11y({ text: 125, links: true, font: false, motion: false });
    expect(JSON.parse(localStorage.getItem("torch-a11y")!)).toEqual({ text: 125, links: true, motion: false });
    expect(readA11y()).toEqual({ text: 125, links: true, motion: false });
  });

  it("removes the key when nothing is set", () => {
    writeA11y({ links: true });
    writeA11y({});
    expect(localStorage.getItem("torch-a11y")).toBeNull();
  });

  it("survives junk in storage", () => {
    localStorage.setItem("torch-a11y", "{not json");
    expect(readA11y()).toEqual({});
    localStorage.setItem("torch-a11y", JSON.stringify({ text: "big", contrast: 1, links: true, evil: "x" }));
    expect(readA11y()).toEqual({ links: true });
  });

  it("can use sessionStorage", () => {
    writeA11y({ font: true }, { storage: "session" });
    expect(sessionStorage.getItem("torch-a11y")).toBe('{"font":true}');
    expect(localStorage.getItem("torch-a11y")).toBeNull();
  });
});

describe("a11yScript", () => {
  it("applies saved settings when run", () => {
    localStorage.setItem("my-key", JSON.stringify({ text: 200, contrast: true, font: true }));
    new Function(a11yScript({ storageKey: "my-key" }))();
    expect(root.style.fontSize).toBe("200%");
    expect(root.dataset.a11yContrast).toBe("more");
    expect(root.dataset.a11yMotion).toBe("no-preference");
    expect(root.hasAttribute("data-a11y-font")).toBe(true);
  });

  it("still sets motion and contrast when storage throws", () => {
    mockMedia({ "(prefers-reduced-motion: reduce)": true });
    const get = Storage.prototype.getItem;
    Storage.prototype.getItem = () => {
      throw new Error("blocked");
    };
    try {
      new Function(a11yScript())();
    } finally {
      Storage.prototype.getItem = get;
    }
    expect(root.dataset.a11yMotion).toBe("reduce");
  });

  it("can't be broken out of with </script>", () => {
    expect(a11yScript({ storageKey: "</script><script>alert(1)" })).not.toContain("</script>");
  });
});

describe("initA11y and the prefers helpers", () => {
  it("applies what's saved", () => {
    writeA11y({ motion: true });
    initA11y();
    expect(prefersReducedMotion()).toBe(true);
    expect(prefersMoreContrast()).toBe(false);
  });

  it("fall back to the system before anything is applied", () => {
    mockMedia({ "(prefers-reduced-motion: reduce)": true });
    expect(prefersReducedMotion()).toBe(true);
  });
});
