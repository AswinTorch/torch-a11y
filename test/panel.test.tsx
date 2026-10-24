import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { A11yPanel, openA11yPanel } from "../src/react";
import { mockMedia, resetDom } from "./setup";

// jsdom has no modal dialogs; enough of one for these tests.
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
    this.dispatchEvent(new Event("close"));
  };
});

let n = 0;
const key = () => `panel-${n++}`;
const root = document.documentElement;

beforeEach(() => {
  resetDom();
  mockMedia();
});
afterEach(cleanup);

describe("A11yPanel", () => {
  it("has a labelled trigger that opens a labelled dialog", () => {
    render(<A11yPanel config={{ storageKey: key() }} />);
    const trigger = screen.getByRole("button", { name: "Accessibility settings" });
    expect(trigger.getAttribute("aria-haspopup")).toBe("dialog");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    const dialog = screen.getByRole("dialog", { name: "Accessibility" });
    expect(dialog.hasAttribute("open")).toBe(true);
    expect(trigger.getAttribute("aria-controls")).toBe(dialog.id);
  });

  it("returns focus to the trigger on close", () => {
    render(<A11yPanel config={{ storageKey: key() }} />);
    const trigger = screen.getByRole("button", { name: "Accessibility settings" });
    fireEvent.click(trigger);
    act(() => screen.getByRole("button", { name: "Close", hidden: true }).click());
    expect(document.activeElement).toBe(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
  });

  it("draws labelled switches with descriptions, and they apply", () => {
    render(<A11yPanel config={{ storageKey: key() }} />);
    const contrast = screen.getByRole("switch", { name: "High contrast", hidden: true });
    expect(contrast.getAttribute("aria-describedby")).toBeTruthy();
    expect(document.getElementById(contrast.getAttribute("aria-describedby")!)!.textContent).toMatch(/Stronger/);
    fireEvent.click(contrast);
    expect(root.dataset.a11yContrast).toBe("more");
    fireEvent.click(screen.getByRole("switch", { name: "Highlight links", hidden: true }));
    expect(root.hasAttribute("data-a11y-links")).toBe(true);
  });

  it("toggles a switch with Enter", () => {
    render(<A11yPanel config={{ storageKey: key() }} />);
    const font = screen.getByRole("switch", { name: "Readable font", hidden: true }) as HTMLInputElement;
    fireEvent.keyDown(font, { key: "Enter" });
    expect(font.checked).toBe(true);
    expect(root.hasAttribute("data-a11y-font")).toBe(true);
  });

  it("steps text size and marks the ends without disabling", () => {
    render(<A11yPanel config={{ storageKey: key(), textSteps: [100, 150] }} />);
    const larger = screen.getByRole("button", { name: "Larger text", hidden: true });
    fireEvent.click(larger);
    expect(root.style.fontSize).toBe("150%");
    expect(larger.getAttribute("aria-disabled")).toBe("true");
    expect(larger.hasAttribute("disabled")).toBe(false);
    expect(screen.getByText("150%").tagName).toBe("OUTPUT");
  });

  it("shows the motion switch on when the system reduces motion", () => {
    mockMedia({ "(prefers-reduced-motion: reduce)": true });
    render(<A11yPanel config={{ storageKey: key() }} />);
    expect((screen.getByRole("switch", { name: "Reduce motion", hidden: true }) as HTMLInputElement).checked).toBe(true);
  });

  it("resets everything", () => {
    const k = key();
    render(<A11yPanel config={{ storageKey: k }} />);
    fireEvent.click(screen.getByRole("switch", { name: "Readable font", hidden: true }));
    fireEvent.click(screen.getByRole("button", { name: "Reset", hidden: true }));
    expect(localStorage.getItem(k)).toBeNull();
    expect(root.hasAttribute("data-a11y-font")).toBe(false);
  });

  it("takes features, labels and onChange", () => {
    const changes: unknown[] = [];
    render(
      <A11yPanel
        config={{ storageKey: key() }}
        features={["links", "text"]}
        labels={{ links: "Souligner les liens", trigger: "Accessibilité" }}
        onChange={(_, change) => changes.push(change)}
      />,
    );
    expect(screen.getAllByRole("switch", { hidden: true })).toHaveLength(1);
    fireEvent.click(screen.getByRole("switch", { name: "Souligner les liens", hidden: true }));
    expect(changes).toEqual([{ links: true }]);
    expect(screen.getByRole("button", { name: "Accessibilité" })).toBeTruthy();
  });

  it("opens from your own button with trigger none, and focus goes back to it", () => {
    render(
      <>
        <button type="button" onClick={openA11yPanel}>
          Settings
        </button>
        <A11yPanel config={{ storageKey: key() }} trigger="none" />
      </>,
    );
    expect(screen.queryByRole("button", { name: "Accessibility settings" })).toBeNull();
    const mine = screen.getByRole("button", { name: "Settings" });
    mine.focus();
    act(() => mine.click());
    const dialog = screen.getByRole("dialog", { name: "Accessibility", hidden: true });
    expect(dialog.hasAttribute("open")).toBe(true);
    act(() => (dialog as HTMLDialogElement).close());
    expect(document.activeElement).toBe(mine);
  });
});
