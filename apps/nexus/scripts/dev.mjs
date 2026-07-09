#!/usr/bin/env node
/**
 * 启动 Vite + Electron；默认端口 5274（见 scripts/ports.mjs）。
 * 端口被占用时自动 +1，并写入 .dev-port 供 Electron 读取。
 */
import { spawn } from "node:child_process";
import net from "node:net";
import { writeFileSync, unlinkSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PORTS } from "../../../scripts/ports.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const portFile = path.join(root, ".dev-port");

function isFree(port) {
  return new Promise((resolve) => {
    const srv = net.createServer();
    srv.once("error", () => resolve(false));
    srv.once("listening", () => srv.close(() => resolve(true)));
    srv.listen(port, "127.0.0.1");
  });
}

async function pickPort(start) {
  for (let p = start; p < start + 20; p++) {
    if (await isFree(p)) return p;
  }
  throw new Error(`无可用端口（${start}–${start + 19}）`);
}

const start = Number(process.env.AXIFORGE_NEXUS_PORT ?? process.env.NEXUS_DEV_PORT) || PORTS.nexus;
const port = await pickPort(start);

writeFileSync(portFile, String(port), "utf8");

const env = { ...process.env, NEXUS_DEV_PORT: String(port) };

function run(cmd, args) {
  const child = spawn(cmd, args, {
    cwd: root,
    env,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  child.on("exit", (code, signal) => {
    if (signal) process.kill(process.pid, signal);
    else process.exit(code ?? 0);
  });
  return child;
}

const vite = run("pnpm", ["exec", "vite", "--port", String(port)]);

const wait = spawn(
  "pnpm",
  ["exec", "wait-on", `http://localhost:${port}`],
  { cwd: root, env, stdio: "inherit", shell: true },
);

wait.on("exit", (code) => {
  if (code !== 0) {
    vite.kill("SIGTERM");
    cleanup();
    process.exit(code ?? 1);
  }
  run("pnpm", ["exec", "electron", "."]);
});

function cleanup() {
  try {
    unlinkSync(portFile);
  } catch {
    /* ignore */
  }
}

process.on("SIGINT", () => {
  vite.kill("SIGTERM");
  cleanup();
  process.exit(0);
});

process.on("exit", cleanup);

console.log(`[nexus] dev server → http://localhost:${port}`);
