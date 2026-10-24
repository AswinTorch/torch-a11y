// @vitest-environment node
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { beforeEach, describe, expect, it } from "vitest";
import { AGENTS, type Env, targets } from "../src/cli/agents";
import { parseArgs } from "../src/cli/index";
import { addCommand, detectPackageManager, packageState } from "../src/cli/install";

const CLI = fileURLToPath(new URL("../dist/cli.js", import.meta.url));

let home: string;
let project: string;
let env: Env;

beforeEach(() => {
  const base = mkdtempSync(join(tmpdir(), "torch-a11y-cli-"));
  home = join(base, "home");
  project = join(base, "project");
  mkdirSync(home);
  mkdirSync(project);
  env = { home, config: join(home, ".config"), cwd: project, vars: {} };
});

/** Runs the built CLI with a fake home, never on a TTY. */
function cli(...args: string[]) {
  const r = spawnSync(process.execPath, [CLI, ...args], {
    cwd: project,
    encoding: "utf8",
    env: { PATH: process.env.PATH, HOME: home, XDG_CONFIG_HOME: join(home, ".config") },
  });
  return { code: r.status, out: r.stdout + r.stderr };
}

const skill = (...parts: string[]) => join(...parts, "torch-a11y", "SKILL.md");

describe("agents", () => {
  it("detects agents from their config folders", () => {
    mkdirSync(join(home, ".claude"));
    mkdirSync(join(home, ".codex"));
    expect(AGENTS.filter((a) => a.detect(env)).map((a) => a.id)).toEqual(["claude-code", "codex"]);
  });

  it("copies once into a folder agents share", () => {
    const picked = AGENTS.filter((a) => ["claude-code", "codex", "cursor", "gemini-cli"].includes(a.id));
    const t = targets(picked, "project", env);
    expect(t.map((x) => x.dir)).toEqual([join(project, ".claude/skills"), join(project, ".agents/skills")]);
    expect(t[1]!.agents.map((a) => a.id)).toEqual(["codex", "cursor", "gemini-cli"]);
  });

  it("uses each agent's own folder globally", () => {
    const cursor = AGENTS.find((a) => a.id === "cursor")!;
    expect(targets([cursor], "global", env)[0]!.dir).toBe(join(home, ".cursor/skills"));
  });
});

describe("package manager", () => {
  it("follows the lockfile, then whatever ran it", () => {
    expect(detectPackageManager(project, "")).toBe("npm");
    expect(detectPackageManager(project, "pnpm/9.0.0 npm/? node/v22")).toBe("pnpm");
    writeFileSync(join(project, "bun.lock"), "");
    expect(detectPackageManager(project, "pnpm/9.0.0")).toBe("bun");
    expect(addCommand("bun")).toEqual(["bun", ["add", "torch-a11y"]]);
    expect(addCommand("npm")).toEqual(["npm", ["install", "torch-a11y"]]);
  });

  it("knows whether package.json already has it", () => {
    expect(packageState(project)).toBe("none");
    writeFileSync(join(project, "package.json"), JSON.stringify({ dependencies: {} }));
    expect(packageState(project)).toBe("missing");
    writeFileSync(join(project, "package.json"), JSON.stringify({ dependencies: { "torch-a11y": "^0.1.0" } }));
    expect(packageState(project)).toBe("present");
  });
});

describe("parseArgs", () => {
  it("reads flags", () => {
    expect(parseArgs(["init", "-y", "--global", "--agents", "codex,cursor", "--no-install"])).toEqual({
      command: "init",
      yes: true,
      scope: "global",
      agents: ["codex", "cursor"],
      install: false,
      help: false,
    });
    expect(parseArgs(["add-skill", "--dir=.x/skills"]).dir).toBe(".x/skills");
    expect(() => parseArgs(["init", "--nope"])).toThrow(/Unknown option/);
  });
});

describe("the built CLI", () => {
  it("installs into detected agents' project folders with -y", () => {
    mkdirSync(join(home, ".claude"));
    mkdirSync(join(home, ".cursor"));
    const r = cli("init", "-y", "--no-install");
    expect(r.code).toBe(0);
    expect(existsSync(skill(project, ".claude/skills"))).toBe(true);
    expect(existsSync(skill(project, ".agents/skills"))).toBe(true);
    expect(existsSync(join(project, ".agents/skills/torch-a11y/scripts/contrast.mjs"))).toBe(true);
    expect(r.out).toMatch(/for Cursor/);
    expect(r.out).toMatch(/Set up torch-a11y on this site/);
  });

  it("falls back to Claude Code when nothing is detected, and never prompts off a TTY", () => {
    const r = cli("init", "--no-install");
    expect(r.code).toBe(0);
    expect(existsSync(skill(project, ".claude/skills"))).toBe(true);
  });

  it("installs globally for chosen agents", () => {
    const r = cli("init", "-y", "--global", "--agents", "codex,windsurf", "--no-install");
    expect(r.code).toBe(0);
    expect(existsSync(skill(home, ".agents/skills"))).toBe(true);
    expect(existsSync(skill(home, ".codeium/windsurf/skills"))).toBe(true);
    expect(existsSync(join(project, ".agents"))).toBe(false);
  });

  it("keeps add-skill --dir working", () => {
    const r = cli("add-skill", "--dir", "custom/skills");
    expect(r.code).toBe(0);
    expect(existsSync(skill(project, "custom/skills"))).toBe(true);
  });

  it("updates an existing copy", () => {
    cli("init", "-y", "--agents", "claude-code", "--no-install");
    writeFileSync(skill(project, ".claude/skills"), "old");
    const r = cli("init", "-y", "--agents", "claude-code", "--no-install");
    expect(r.out).toMatch(/Updated/);
    expect(readFileSync(skill(project, ".claude/skills"), "utf8")).toMatch(/^---\nname: torch-a11y/);
  });

  it("tells you to add the package when it didn't", () => {
    writeFileSync(join(project, "package.json"), "{}");
    const r = cli("init", "-y", "--agents", "claude-code", "--no-install");
    expect(r.out).toMatch(/npm install torch-a11y/);
  });

  it("rejects unknown agents and commands", () => {
    expect(cli("init", "-y", "--agents", "nope").code).toBe(1);
    expect(cli("frobnicate").code).toBe(1);
    expect(cli().out).toMatch(/Usage/);
  });
});
