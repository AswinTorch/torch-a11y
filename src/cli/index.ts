import { cancel, confirm, intro, isCancel, log, multiselect, note, outro, select, spinner } from "@clack/prompts";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { AGENTS, type Agent, type Env, type Scope, currentEnv, skillsDir, targets } from "./agents";
import { SKILL, addCommand, copySkill, detectPackageManager, installPackage, packageState } from "./install";

// dist/cli.js when built, src/cli/index.ts in tests: the package root is
// whichever ancestor holds skills/.
const here = dirname(fileURLToPath(import.meta.url));
const root = [join(here, ".."), join(here, "..", "..")].find((d) => existsSync(join(d, "skills", SKILL))) ?? join(here, "..");
const SOURCE = join(root, "skills", SKILL);

const HELP = `torch-a11y

Usage:
  npx torch-a11y init [options]      (alias: add-skill)

Adds the torch-a11y agent skill to your coding agents, and the package to
your project. Asks first; -y takes the defaults.

Options:
  -y, --yes            No prompts: detected agents, this project, add the package
  --agents <ids>       Comma-separated: ${AGENTS.map((a) => a.id).join(", ")}
  --global             Install the skill for the whole machine
  --project            Install the skill into this project (default)
  --dir <path>         Copy the skill into this skills folder instead
  --no-install         Don't add the package to package.json
  -h, --help           Show this help`;

type Args = {
  command?: string;
  yes: boolean;
  agents?: string[];
  scope?: Scope;
  dir?: string;
  install: boolean;
  help: boolean;
};

export function parseArgs(argv: string[]): Args {
  const args: Args = { yes: false, install: true, help: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    if (a === "-y" || a === "--yes") args.yes = true;
    else if (a === "-h" || a === "--help") args.help = true;
    else if (a === "--global") args.scope = "global";
    else if (a === "--project") args.scope = "project";
    else if (a === "--no-install") args.install = false;
    else if (a === "--agents") args.agents = (argv[++i] ?? "").split(",").filter(Boolean);
    else if (a.startsWith("--agents=")) args.agents = a.slice(9).split(",").filter(Boolean);
    else if (a === "--dir") args.dir = argv[++i];
    else if (a.startsWith("--dir=")) args.dir = a.slice(6);
    else if (!a.startsWith("-") && !args.command) args.command = a;
    else throw new Error(`Unknown option: ${a}`);
  }
  return args;
}

function display(path: string, env: Env) {
  if (path.startsWith(env.cwd + "/") || path === env.cwd) return relative(env.cwd, path) || ".";
  if (path.startsWith(env.home + "/")) return "~/" + relative(env.home, path);
  return path;
}

function bail(): never {
  cancel("Nothing installed.");
  process.exit(0);
}

function version() {
  try {
    return JSON.parse(readFileSync(join(root, "package.json"), "utf8")).version as string;
  } catch {
    return "";
  }
}

export async function run(argv = process.argv.slice(2), env = currentEnv()) {
  const args = parseArgs(argv);
  if (args.help || !args.command) {
    console.log(HELP);
    return;
  }
  if (!["init", "install", "add-skill"].includes(args.command)) {
    console.error(`Unknown command: ${args.command}\n\n${HELP}`);
    process.exitCode = 1;
    return;
  }

  // An agent or CI running this can't answer prompts.
  const interactive = !args.yes && Boolean(process.stdin.isTTY && process.stdout.isTTY);
  intro(`torch-a11y ${version()}`);

  const detected = AGENTS.filter((a) => a.detect(env));
  let chosen: Agent[] = [];
  let scope: Scope = args.scope ?? "project";
  let copyTo: { dir: string; agents: Agent[] }[];

  if (args.dir) {
    copyTo = [{ dir: resolve(env.cwd, args.dir), agents: [] }];
  } else {
    if (args.agents) {
      const unknown = args.agents.filter((id) => !AGENTS.some((a) => a.id === id));
      if (unknown.length) {
        log.error(`Unknown agent: ${unknown.join(", ")}. Known: ${AGENTS.map((a) => a.id).join(", ")}`);
        process.exitCode = 1;
        return;
      }
      chosen = AGENTS.filter((a) => args.agents!.includes(a.id));
    } else if (interactive) {
      const picked = await multiselect({
        message: "Which agents should get the skill?",
        options: AGENTS.map((a) => ({
          value: a.id,
          label: a.name,
          hint: [
            detected.includes(a) ? "detected" : "",
            existsSync(join(skillsDir(a, scope, env), SKILL)) ? "has it" : "",
          ]
            .filter(Boolean)
            .join(", ") || undefined,
        })),
        initialValues: (detected.length ? detected : AGENTS.slice(0, 1)).map((a) => a.id),
        required: true,
      });
      if (isCancel(picked)) bail();
      chosen = AGENTS.filter((a) => picked.includes(a.id));
    } else {
      chosen = detected.length ? detected : AGENTS.slice(0, 1);
    }

    if (!args.scope && interactive) {
      const picked = await select({
        message: "Install it where?",
        options: [
          { value: "project", label: "This project", hint: "committed with the code, so your team gets it" },
          { value: "global", label: "This machine", hint: "every project, just you" },
        ],
        initialValue: "project" as Scope,
      });
      if (isCancel(picked)) bail();
      scope = picked;
    }
    copyTo = targets(chosen, scope, env);
  }

  const s = spinner();
  s.start("Copying the skill");
  const copied = copyTo.map(({ dir, agents }) => ({ ...copySkill(SOURCE, dir), agents }));
  s.stop("Skill copied");
  for (const { target, existed, agents } of copied) {
    const who = agents.length ? ` for ${agents.map((a) => a.name).join(", ")}` : "";
    log.success(`${existed ? "Updated" : "Added"} ${display(target, env)}${who}`);
  }

  const pkg = packageState(env.cwd);
  let hasPackage = pkg === "present";
  let failed = false;
  const pm = detectPackageManager(env.cwd);
  const [cmd, cmdArgs] = addCommand(pm);
  const addLine = [cmd, ...cmdArgs].join(" ");
  if (pkg === "present") {
    log.info("torch-a11y is already in package.json.");
  } else if (pkg === "missing" && args.install) {
    let go = true;
    if (interactive) {
      const answer = await confirm({ message: `Add the package too? (${addLine})`, initialValue: true });
      if (isCancel(answer)) bail();
      go = answer;
    }
    if (go) {
      s.start(`Running ${addLine}`);
      const result = installPackage(env.cwd, pm);
      if (result.ok) {
        s.stop(`Added torch-a11y with ${pm}`);
        hasPackage = true;
      } else {
        s.error(`${result.command} failed`);
        failed = true;
        // Scripts and CI should notice.
        process.exitCode = 1;
        if (result.output) log.message(result.output.split("\n").slice(-12).join("\n"));
      }
    }
  }

  const next = [
    hasPackage ? "" : `Add the package: ${addLine}`,
    'Ask your agent: "Set up torch-a11y on this site."',
  ].filter(Boolean);
  note(next.join("\n"), "Next");
  outro(failed ? "The skill is in. The package isn't yet." : "Done.");
}
