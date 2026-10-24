#!/usr/bin/env node
// torch-a11y's CLI. One job for now: copy the agent skill into a project.
//
//   npx torch-a11y add-skill            → .claude/skills/torch-a11y
//   npx torch-a11y add-skill --dir .agents/skills

import { cpSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const source = join(here, "..", "skills", "torch-a11y");
const [command, ...rest] = process.argv.slice(2);

function flag(name) {
  const i = rest.indexOf(name);
  return i >= 0 ? rest[i + 1] : undefined;
}

if (command === "add-skill") {
  const base = resolve(process.cwd(), flag("--dir") ?? join(".claude", "skills"));
  const target = join(base, "torch-a11y");
  const existed = existsSync(target);
  mkdirSync(base, { recursive: true });
  cpSync(source, target, { recursive: true });
  console.log(`${existed ? "Updated" : "Added"} the torch-a11y skill in ${relative(process.cwd(), target) || "."}`);
  console.log('Ask your agent: "Set up torch-a11y on this site."');
} else {
  console.log(`torch-a11y

Usage:
  npx torch-a11y add-skill [--dir <skills folder>]

Copies the agent skill that installs the panel and prepares your codebase
for it. Default folder: .claude/skills (Claude Code). Other agents: point
--dir at their skills folder, or link SKILL.md from AGENTS.md.`);
  process.exit(command && command !== "help" && command !== "--help" ? 1 : 0);
}
