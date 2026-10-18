#!/usr/bin/env node
/**
 * 同一棵工作树里给 e2e 套件上互斥锁。
 * 起因：几套 Playwright 并排跑时共用同一台 vite/uvicorn webServer（非 CI 下 reuseExistingServer 为真），
 * 超时会被记到恰好被饿住的随机用例上，看起来像代码 flake（2026-09-29 实测三连 16 分钟挂起）。
 * 用法：node scripts/e2e-lock.mjs -- playwright test -c playwright.desktop.config.ts
 */
import { spawn } from "node:child_process";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const LOCK = join(root, ".e2e-lock");

const alive = (pid) => {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
};

const readHolder = () => {
  if (!existsSync(LOCK)) return null;
  try {
    return JSON.parse(readFileSync(LOCK, "utf8"));
  } catch {
    return { pid: 0, label: "<无法解析的锁文件>", since: "" };
  }
};

const acquire = (label) => {
  const holder = readHolder();
  if (holder && alive(holder.pid)) {
    process.stderr.write(
      `[e2e-lock] 已有套件在跑：${holder.label}（PID ${holder.pid}，起于 ${holder.since}）\n` +
        `[e2e-lock] 同树并跑会让超时落在随机用例上。等它结束，或确认 PID 已死时删掉 ${LOCK}\n`,
    );
    process.exit(1);
  }
  if (holder) {
    process.stderr.write(`[e2e-lock] 收回失效锁（PID ${holder.pid} 已不存在）\n`);
  }
  writeFileSync(LOCK, JSON.stringify({ pid: process.pid, label, since: new Date().toISOString() }));
};

const release = () => {
  const holder = readHolder();
  // 只删自己那一把：并发场景下不能把别人的锁一起清掉
  if (holder && holder.pid === process.pid) rmSync(LOCK, { force: true });
};

let args = process.argv.slice(2);
if (args[0] === "--") args = args.slice(1);
if (args.length === 0) {
  process.stderr.write("用法：node scripts/e2e-lock.mjs -- <命令...>\n");
  process.exit(2);
}

const label = args.join(" ");
acquire(label);
for (const sig of ["SIGINT", "SIGTERM", "SIGHUP"]) {
  process.on(sig, () => {
    release();
    process.kill(process.pid, sig);
  });
}

const child = spawn(args[0], args.slice(1), { cwd: root, stdio: "inherit" });
child.on("error", (e) => {
  release();
  process.stderr.write(`[e2e-lock] 起不了子进程：${e.message}\n`);
  process.exit(127);
});
child.on("exit", (code, signal) => {
  release();
  process.exit(signal ? 1 : (code ?? 1));
});
