#!/usr/bin/env node
/**
 * 主题对比度门禁（宪章 Phase 8 · WCAG AA）。
 *
 * 为什么用计算而不是逐屏肉眼看：主题色是**成对**的，明暗两套 × 若干前景背景组合，
 * 人眼逐屏看既漏又不可复现；而配对关系一旦写进脚本，改色就在 CI 里立刻暴露。
 *
 * 两条规则：
 * ① **完整性**：@theme 里每个 `--color-X: var(--ax-Y)` 桥接，都必须在**明暗两套主题里都存在**。
 *    缺一个就会在那套主题下解析成无效值，文字掉回继承色——这类缺陷肉眼很容易看成「设计就这样」。
 *    （本门禁上线前，`--ax-ink-on-scrim` 就只写在暗色块里，亮色主题下是悬空引用。）
 * ② **对比度**：按显式白名单计算 WCAG 相对亮度比，正文 4.5:1、大字与非文本 3:1。
 *
 * 用法：node scripts/check-contrast.mjs
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const css = readFileSync(path.join(root, "packages/ui/styles/tokens.css"), "utf8");

// ---------- 解析两套主题的变量表 ----------
function parseBlock(re) {
  const m = css.match(re);
  if (!m) throw new Error(`tokens.css 里找不到预期的主题块：${re}`);
  const out = {};
  for (const line of m[1].split("\n")) {
    const kv = line.match(/^\s*(--ax-[\w-]+):\s*([^;]+);/);
    if (kv) out[kv[1]] = kv[2].trim();
  }
  return out;
}

const themes = {
  light: parseBlock(/\[data-theme="light"\]\s*\{([\s\S]*?)\n\}/),
  dark: parseBlock(/\[data-theme="dark"\]\s*\{([\s\S]*?)\n\}/),
};

const bridges = [...css.matchAll(/--color-([\w-]+):\s*var\((--ax-[\w-]+)\)/g)]
  .map(([, name, ax]) => ({ tailwind: `--color-${name}`, ax }));

// ---------- 颜色解析（支持 hex 与 color-mix(..., transparent)）----------
function toRgba(raw) {
  const mix = raw.match(/^color-mix\(in srgb,\s*(\S+)\s+(\d+(?:\.\d+)?)%,\s*transparent\)$/);
  if (mix) {
    const base = toRgba(mix[1]);
    return { r: base.r, g: base.g, b: base.b, a: Number(mix[2]) / 100 };
  }
  const hex = raw.match(/^#([0-9a-f]{6})$/i);
  if (hex) {
    const n = parseInt(hex[1], 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255, a: 1 };
  }
  throw new Error(`无法解析颜色：${raw}`);
}

/** 把带 alpha 的前景合成到不透明背景上 */
function composite(fg, bg) {
  const c = toRgba(fg);
  const b = toRgba(bg);
  if (c.a >= 1) return c;
  return {
    r: c.r * c.a + b.r * (1 - c.a),
    g: c.g * c.a + b.g * (1 - c.a),
    b: c.b * c.a + b.b * (1 - c.a),
    a: 1,
  };
}

function luminance({ r, g, b }) {
  const lin = (v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function ratio(fg, bg) {
  const l1 = luminance(composite(fg, bg));
  const l2 = luminance(toRgba(bg));
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

// ---------- 规则①：完整性 ----------
const problems = [];
for (const { tailwind, ax } of bridges) {
  for (const [theme, vars] of Object.entries(themes)) {
    if (!(ax in vars)) {
      problems.push(`[完整性] ${tailwind} 在 ${theme} 主题下悬空：缺 ${ax}`);
    }
  }
}

// ---------- 规则②：对比度白名单 ----------
// min: 4.5 = AA 正文；3.0 = 大字 / 非文本（边框、图标、占位提示）
const PAIRS = [
  { fg: "--ax-ink", bg: "--ax-canvas", min: 4.5, use: "正文 / 页面底" },
  { fg: "--ax-ink", bg: "--ax-surface", min: 4.5, use: "正文 / 卡片面" },
  { fg: "--ax-ink", bg: "--ax-panel", min: 4.5, use: "正文 / 面板" },
  { fg: "--ax-ink", bg: "--ax-panel-raised", min: 4.5, use: "正文 / 抬升面板" },
  { fg: "--ax-ink-muted", bg: "--ax-surface", min: 4.5, use: "次级文字 / 卡片面" },
  { fg: "--ax-ink-muted", bg: "--ax-canvas", min: 4.5, use: "次级文字 / 页面底" },
  { fg: "--ax-ink-muted", bg: "--ax-panel", min: 4.5, use: "次级文字 / 面板" },
  { fg: "--ax-ink-faint", bg: "--ax-surface", min: 3.0, use: "占位与提示 / 卡片面" },
  { fg: "--ax-ink-faint", bg: "--ax-panel", min: 3.0, use: "占位与提示 / 面板" },
  { fg: "--ax-brand", bg: "--ax-surface", min: 4.5, use: "品牌色文字 / 卡片面" },
  { fg: "--ax-brand", bg: "--ax-canvas", min: 4.5, use: "品牌色文字 / 页面底" },
  { fg: "--ax-accent", bg: "--ax-surface", min: 3.0, use: "强调色（大字/图标） / 卡片面" },
  { fg: "--ax-accent", bg: "--ax-canvas", min: 3.0, use: "强调色（大字/图标） / 页面底" },
  { fg: "--ax-danger", bg: "--ax-surface", min: 4.5, use: "错误文字 / 卡片面" },
  { fg: "--ax-ink-on-scrim", bg: "--ax-scrim-ref", min: 4.5, use: "遮罩上的文字（恒暗遮罩）" },
  { fg: "--ax-on-brand", bg: "--ax-brand", min: 4.5, use: "主色块上的文字（用 on-brand，不是 ink）" },
];

// 遮罩本身不是令牌：它是 bg-black/40 压在封面上，这里按合成结果给一个参考底色
const SCRIM = { light: "#6b6b6b", dark: "#6b6b6b" };

const rows = [];
for (const [theme, vars] of Object.entries(themes)) {
  for (const p of PAIRS) {
    const fg = vars[p.fg];
    const bg = p.bg === "--ax-scrim-ref" ? SCRIM[theme] : vars[p.bg];
    if (!fg || !bg) {
      problems.push(`[配对] ${theme} 缺色值，无法计算 ${p.fg} on ${p.bg}`);
      continue;
    }
    let r;
    try {
      r = ratio(fg, bg);
    } catch (e) {
      problems.push(`[配对] ${theme} ${p.use} 计算失败：${e.message}`);
      continue;
    }
    const ok = r >= p.min;
    rows.push({ theme, use: p.use, ratio: r, min: p.min, ok });
    if (!ok) {
      problems.push(
        `[对比度] ${theme} ${p.use}：${r.toFixed(2)}:1 < 要求 ${p.min}:1`,
      );
    }
  }
}

// ---------- 输出 ----------
for (const theme of ["light", "dark"]) {
  console.log(`\n[contrast] ${theme} 主题`);
  for (const row of rows.filter((r) => r.theme === theme)) {
    console.log(
      `  ${row.ok ? "✓" : "✗"} ${row.ratio.toFixed(2).padStart(5)}:1 (≥${row.min})  ${row.use}`,
    );
  }
}

if (problems.length) {
  console.error(`\n[contrast] FAIL —— ${problems.length} 项`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}

const weakest = rows.reduce((a, b) => (a.ratio / a.min < b.ratio / b.min ? a : b));
console.log(
  `\n[contrast] OK —— ${bridges.length} 个桥接双主题齐备，${rows.length} 组配对达 AA（最紧：${weakest.use} ${weakest.ratio.toFixed(2)}:1 / 要求 ${weakest.min}:1）`,
);
