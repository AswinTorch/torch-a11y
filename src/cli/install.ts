import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

export const SKILL = "torch-a11y";

/** Copies the skill folder into a skills folder, replacing an older copy. */
export function copySkill(source: string, skillsDir: string) {
  const target = join(skillsDir, SKILL);
  const existed = existsSync(target);
  mkdirSync(skillsDir, { recursive: true });
  cpSync(source, target, { recursive: true, force: true });
  return { target, existed };
}

export type PackageManager = "bun" | "pnpm" | "yarn" | "npm";

/** The project's package manager: its lockfile, else whatever ran this CLI. */
export function detectPackageManager(cwd: string, userAgent = process.env.npm_config_user_agent ?? ""): PackageManager {
  if (existsSync(join(cwd, "bun.lock")) || existsSync(join(cwd, "bun.lockb"))) return "bun";
  if (existsSync(join(cwd, "pnpm-lock.yaml"))) return "pnpm";
  if (existsSync(join(cwd, "yarn.lock"))) return "yarn";
  if (existsSync(join(cwd, "package-lock.json"))) return "npm";
  for (const pm of ["bun", "pnpm", "yarn"] as const) if (userAgent.startsWith(pm)) return pm;
  return "npm";
}

export function addCommand(pm: PackageManager): [string, string[]] {
  return pm === "npm" ? ["npm", ["install", SKILL]] : [pm, ["add", SKILL]];
}

/** Whether there's a package.json, and whether it already lists torch-a11y. */
export function packageState(cwd: string): "none" | "missing" | "present" {
  const file = join(cwd, "package.json");
  if (!existsSync(file)) return "none";
  try {
    const pkg = JSON.parse(readFileSync(file, "utf8"));
    return pkg.dependencies?.[SKILL] || pkg.devDependencies?.[SKILL] ? "present" : "missing";
  } catch {
    return "none";
  }
}

export function installPackage(cwd: string, pm: PackageManager) {
  const [cmd, args] = addCommand(pm);
  const result = spawnSync(cmd, args, { cwd, encoding: "utf8", shell: process.platform === "win32" });
  return { ok: result.status === 0, output: `${result.stdout ?? ""}${result.stderr ?? ""}`.trim(), command: [cmd, ...args].join(" ") };
}
