import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

function run(name, command, args, cwd) {
  const child = spawn(command, args, {
    cwd,
    stdio: "inherit",
    shell: process.platform === "win32",
    env: process.env,
  });

  child.on("exit", (code) => {
    console.log(`${name} exited with code ${code}`);
    process.exit(code || 0);
  });

  return child;
}

const backend = run("backend", "npm", ["start"], path.join(root, "backend"));
const frontend = run("frontend", "npm", ["run", "dev"], path.join(root, "frontend"));

function shutdown() {
  backend.kill();
  frontend.kill();
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
