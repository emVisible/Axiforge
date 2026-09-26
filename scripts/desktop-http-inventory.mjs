import { chromium } from "@playwright/test";

const BASE = "http://localhost:5174";
const ROUTES = [
  "/discover",
  "/studio/projects",
  "/studio/items",
  "/studio/scenes",
  "/studio/characters/mine",
  "/studio/dashboard",
  "/profile",
  "/docs",
];

const browser = await chromium.launch();
const ctx = await browser.newContext();
// 桌面态探针就是一句 `"__TAURI_INTERNALS__" in window`，注入它即可让 app 走本地支
await ctx.addInitScript(() => {
  window.__TAURI_INTERNALS__ = {};
});

const report = [];
for (const route of ROUTES) {
  const page = await ctx.newPage();
  const apiCalls = [];
  const errors = [];
  page.on("request", (req) => {
    const p = new URL(req.url()).pathname;
    if (p.startsWith("/api/v1/")) apiCalls.push(p);
  });
  page.on("pageerror", (e) => errors.push(String(e.message).slice(0, 140)));
  try {
    await page.goto(BASE + route, { waitUntil: "load", timeout: 25000 });
    await page.waitForTimeout(2500);
  } catch (e) {
    errors.push("goto:" + String(e.message).slice(0, 100));
  }
  report.push({
    route,
    httpCalls: [...new Set(apiCalls)].sort(),
    pageErrors: [...new Set(errors)].slice(0, 3),
  });
  await page.close();
}

console.log(JSON.stringify(report, null, 1));
const total = new Set(report.flatMap((r) => r.httpCalls));
console.log("DESKTOP_MODE_HTTP_UNIQUE=" + total.size);
await browser.close();
