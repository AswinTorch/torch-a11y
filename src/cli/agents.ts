import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

/**
 * Coding agents that read skills, and where. Paths follow the community
 * `skills` CLI (github.com/vercel-labs/skills, MIT). Many agents now share
 * the universal `.agents/skills` folder inside a project.
 */
export type Agent = {
  id: string;
  name: string;
  /** Skills folder inside a project. */
  project: string;
  /** Skills folder for the whole machine. */
  global: (env: Env) => string;
  /** Whether this agent seems to be installed. */
  detect: (env: Env) => boolean;
};

export type Env = { home: string; config: string; cwd: string; vars: NodeJS.ProcessEnv };

export function currentEnv(cwd = process.cwd(), vars = process.env): Env {
  const home = vars.HOME || homedir();
  return { home, config: vars.XDG_CONFIG_HOME || join(home, ".config"), cwd, vars };
}

const claudeHome = (e: Env) => e.vars.CLAUDE_CONFIG_DIR?.trim() || join(e.home, ".claude");
const codexHome = (e: Env) => e.vars.CODEX_HOME?.trim() || join(e.home, ".codex");
const has = (...paths: string[]) => paths.some((p) => existsSync(p));

export const AGENTS: Agent[] = [
  {
    id: "claude-code",
    name: "Claude Code",
    project: ".claude/skills",
    global: (e) => join(claudeHome(e), "skills"),
    detect: (e) => has(claudeHome(e), join(e.cwd, ".claude")),
  },
  {
    id: "codex",
    name: "Codex",
    project: ".agents/skills",
    global: (e) => join(e.home, ".agents/skills"),
    detect: (e) => has(codexHome(e)),
  },
  {
    id: "cursor",
    name: "Cursor",
    project: ".agents/skills",
    global: (e) => join(e.home, ".cursor/skills"),
    detect: (e) => has(join(e.home, ".cursor"), join(e.cwd, ".cursor")),
  },
  {
    id: "gemini-cli",
    name: "Gemini CLI",
    project: ".agents/skills",
    global: (e) => join(e.home, ".gemini/skills"),
    detect: (e) => has(join(e.home, ".gemini")),
  },
  {
    id: "github-copilot",
    name: "GitHub Copilot",
    project: ".agents/skills",
    global: (e) => join(e.home, ".copilot/skills"),
    detect: (e) => has(join(e.home, ".copilot")),
  },
  {
    id: "windsurf",
    name: "Windsurf",
    project: ".windsurf/skills",
    global: (e) => join(e.home, ".codeium/windsurf/skills"),
    detect: (e) => has(join(e.home, ".codeium/windsurf")),
  },
  {
    id: "opencode",
    name: "OpenCode",
    project: ".agents/skills",
    global: (e) => join(e.config, "opencode/skills"),
    detect: (e) => has(join(e.config, "opencode")),
  },
  {
    id: "amp",
    name: "Amp",
    project: ".agents/skills",
    global: (e) => join(e.config, "agents/skills"),
    detect: (e) => has(join(e.config, "amp")),
  },
  {
    id: "cline",
    name: "Cline",
    project: ".agents/skills",
    global: (e) => join(e.home, ".agents/skills"),
    detect: (e) => has(join(e.home, ".cline")),
  },
  {
    id: "zed",
    name: "Zed",
    project: ".agents/skills",
    global: (e) => join(e.home, ".agents/skills"),
    detect: (e) => has(join(e.config, "zed")),
  },
  {
    id: "kiro",
    name: "Kiro",
    project: ".kiro/skills",
    global: (e) => join(e.home, ".kiro/skills"),
    detect: (e) => has(join(e.home, ".kiro")),
  },
  {
    id: "roo",
    name: "Roo Code",
    project: ".roo/skills",
    global: (e) => join(e.home, ".roo/skills"),
    detect: (e) => has(join(e.home, ".roo")),
  },
  {
    id: "goose",
    name: "Goose",
    project: ".goose/skills",
    global: (e) => join(e.config, "goose/skills"),
    detect: (e) => has(join(e.config, "goose")),
  },
];

export type Scope = "project" | "global";

/** The skills folder for an agent in a scope, as an absolute path. */
export function skillsDir(agent: Agent, scope: Scope, env: Env) {
  return scope === "global" ? agent.global(env) : join(env.cwd, agent.project);
}

/**
 * The folders to copy into, each once, with the agents it serves. Several
 * agents share `.agents/skills`, so one copy covers them all.
 */
export function targets(agents: Agent[], scope: Scope, env: Env) {
  const byDir = new Map<string, Agent[]>();
  for (const agent of agents) {
    const dir = skillsDir(agent, scope, env);
    byDir.set(dir, [...(byDir.get(dir) ?? []), agent]);
  }
  return [...byDir].map(([dir, served]) => ({ dir, agents: served }));
}
