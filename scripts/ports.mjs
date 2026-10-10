/**
 * Axiforge 开发端口表（517x 系列，避开 Vite 默认 5173）的**派生视图**。
 *
 * 真相源是 `scripts/ports.json`（不是这份文件）。为什么把数字放在 JSON 里（2026-09-30 实测）：
 * Playwright 的 `.ts` 配置走 CJS 转译，一旦 `import` 这份 `.mjs` 就加载失败——Node 20.20.2、22.14、26.7
 * 三个版本全红（分别报 `exports is not defined in ES module scope` 与 `Cannot use 'import.meta' outside a module`），
 * 并不存在"只在 CI 上才红"的情形。JSON 两种加载器都能读（CJS `require` 原生支持，ESM 侧由本文件用 fs 读），
 * 所以数字下沉成 `.json`，这份 `.mjs` 只保留"由数字派生来源串"这一层逻辑。
 *
 * 改端口只改 `ports.json` 一处；vite 代理、Playwright 两套配置、e2e 夹具与运行时普查脚本都从这里取值。
 * Python 侧 CORS（`backend/app/config.py`）是另一份硬写，随 S13-6 后端退场一起消失，不在本轮收口范围。
 */
import { readFileSync } from "node:fs";

export const PORTS = JSON.parse(readFileSync(new URL("./ports.json", import.meta.url), "utf8"));

export const origins = {
  api: `http://localhost:${PORTS.api}`,
  web: `http://localhost:${PORTS.web}`,
  admin: `http://localhost:${PORTS.admin}`,
  nexus: `http://localhost:${PORTS.nexus}`,
};

/** FastAPI CORS allow_origins */
export const corsOrigins = [
  origins.web,
  origins.admin,
  origins.nexus,
  origins.web.replace("localhost", "127.0.0.1"),
  origins.admin.replace("localhost", "127.0.0.1"),
  origins.nexus.replace("localhost", "127.0.0.1"),
];
