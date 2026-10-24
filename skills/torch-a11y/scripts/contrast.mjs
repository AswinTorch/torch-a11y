#!/usr/bin/env node
// WCAG contrast ratio between two colors.
//
//   node contrast.mjs <foreground> <background> [<foreground> <background> ...]
//
// Colors: #rgb, #rrggbb, #rrggbbaa, rgb(r g b), rgb(r g b / a), rgba(r, g, b, a).
// A translucent foreground is composited over its background first.
// Prints the ratio and whether it clears 4.5:1 (AA text), 7:1 (AAA text)
// and 3:1 (UI components and large text).

function parse(input) {
  const s = input.trim().toLowerCase();
  if (s.startsWith("#")) {
    let h = s.slice(1);
    if (h.length === 3 || h.length === 4) h = [...h].map((c) => c + c).join("");
    if (!/^[0-9a-f]{6}([0-9a-f]{2})?$/.test(h)) throw new Error(`Can't read ${input}`);
    const n = (i) => parseInt(h.slice(i, i + 2), 16);
    return [n(0), n(2), n(4), h.length === 8 ? n(6) / 255 : 1];
  }
  const m = s.match(/^rgba?\(([^)]+)\)$/);
  if (!m) throw new Error(`Can't read ${input}`);
  const parts = m[1].split(/[\s,/]+/).filter(Boolean);
  const [r, g, b] = parts.slice(0, 3).map(Number);
  const a = parts[3] === undefined ? 1 : parts[3].endsWith("%") ? parseFloat(parts[3]) / 100 : Number(parts[3]);
  return [r, g, b, a];
}

function luminance([r, g, b]) {
  const c = [r, g, b].map((v) => {
    const x = v / 255;
    return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

function over(fg, bg) {
  const a = fg[3];
  return [0, 1, 2].map((i) => fg[i] * a + bg[i] * (1 - a));
}

const args = process.argv.slice(2);
if (args.length < 2 || args.length % 2) {
  console.error("Usage: node contrast.mjs <foreground> <background> [...more pairs]");
  process.exit(1);
}

let failed = false;
for (let i = 0; i < args.length; i += 2) {
  const bg = parse(args[i + 1]);
  const fg = over(parse(args[i]), bg);
  const [a, b] = [luminance(fg), luminance(bg)];
  const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  const marks = [
    [3, "3:1 UI"],
    [4.5, "4.5:1 AA"],
    [7, "7:1 AAA"],
  ].map(([t, label]) => `${ratio >= t ? "✓" : "✗"} ${label}`);
  if (ratio < 3) failed = true;
  console.log(`${args[i]} on ${args[i + 1]}: ${ratio.toFixed(2)}:1  ${marks.join("  ")}`);
}
process.exit(failed ? 1 : 0);
