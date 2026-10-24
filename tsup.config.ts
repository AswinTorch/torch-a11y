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
  {
    // The CLI, with its prompt library bundled in, so the package itself
    // keeps no runtime dependencies.
    entry: { cli: "src/cli/main.ts" },
    format: ["esm"],
    target: "node18",
    platform: "node",
    noExternal: ["@clack/prompts"],
    banner: { js: "#!/usr/bin/env node" },
  },
]);
