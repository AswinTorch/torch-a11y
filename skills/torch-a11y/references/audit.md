# Audit: what needs changing

Run these from the project root (adjust `src` to the source folders). Use ripgrep (`rg`) if it's installed; the `grep -rnE` forms work everywhere.

## Text in px

```bash
# CSS font sizes in px
grep -rnE "font-size:\s*[0-9.]+px" --include=*.css --include=*.scss src
# Tailwind arbitrary px text and leading
grep -rnoE "(text|leading)-\[[0-9.]+px\]" --include=*.tsx --include=*.jsx --include=*.ts src | sort | uniq -c
# Fluid type driven by the viewport (scale its vw term by --a11y-text-scale)
grep -rnE "font-size:\s*clamp\([^)]*vw" --include=*.css src
# A root font-size the site sets itself (use textMode: "variable" if found)
grep -rnE "html\s*\{[^}]*font-size|:root\s*\{[^}]*font-size" --include=*.css src
```

## Colors that aren't tokens

```bash
# Hex and rgb() outside the token definitions
grep -rnE "#[0-9a-fA-F]{3,8}\b|rgba?\(" --include=*.css src | grep -vE "^\s*--"
# Tailwind palette colors in components (should usually be tokens)
grep -rnoE "\b(text|bg|border|ring|outline|fill|stroke)-(white|black|(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-[0-9]{2,3})\b" --include=*.tsx --include=*.jsx src | sort | uniq -c
# Inline style colors
grep -rnE "color:\s*['\"]#|background(Color)?:\s*['\"]#" --include=*.tsx --include=*.jsx src
```

Sort the hits into UI (must become tokens) and artwork (can stay).

## Motion

```bash
grep -rn "prefers-reduced-motion" src
grep -rnE "motion-(reduce|safe):" --include=*.tsx --include=*.jsx src | wc -l
grep -rnE "scroll-behavior:\s*smooth" src
grep -rnE "\.animate\(|requestAnimationFrame|framer-motion|motion/react|gsap" --include=*.ts --include=*.tsx src
```

Every media query hit becomes a variant or attribute selector. Every JS animation should check `prefersReducedMotion()` or `useA11y().reduceMotion`.

## Links

```bash
# Links whose only child is an icon or image: candidates for data-a11y-link="ring"
grep -rnE "<(a|Link)\b[^>]*aria-label=" --include=*.tsx --include=*.jsx src
```

## Contrast

```bash
node <skill-dir>/scripts/contrast.mjs "#6e6e73" "#ffffff"
```

List each text token and its background, in light and dark, with high contrast off and on.
