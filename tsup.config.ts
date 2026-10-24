import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: { index: "src/index.ts" },
    format: ["esm"],
    dts: true,
    clean: true,
    target: "es2022",
  },
  {
    // Client components: keep the directive so Next.js treats them as such.
    entry: { "react/index": "src/react/index.ts" },
    format: ["esm"],
    dts: true,
    target: "es2022",
    external: ["react", "react/jsx-runtime", "torch-a11y"],
    banner: { js: '"use client";' },
  },
]);
