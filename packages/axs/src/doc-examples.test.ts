/**
 * 用户文档里每个 `axs` 示例都必须是**可解析、可往返、且打印不改输入**的。
 * 这条判据的存在理由：`>=` 那个缺陷（#82）就是"文档承诺跑在实现前面"捞出来的——
 * 把示例本身变成机检对象，文档与解析器之间就不再只靠人眼对账。
 * 文档搬家或改语法时，这里红的是**示例**，不是某个手写的 fixture。
 */
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";
import type { AxsBeat } from "./types";
import { printAxs } from "./print";
import { parseAxs } from "./parse";

/** 扫 `docs/**`（归档除外）：语法权威 ADR-016 自己那条示例，和用户文档一样该被机检管着。 */
function mdFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const abs = join(dir, e.name);
    if (e.isDirectory()) return e.name === "archive" ? [] : mdFiles(abs);
    return e.name.endsWith(".md") ? [abs] : [];
  });
}
const docsRoot = fileURLToPath(new URL("../../../docs", import.meta.url));

/** 取 ```axs 围栏里的整块源码；围栏结束行号用于失败时指回文档位置 */
function fencesOf(mdPath: string) {
  const lines = readFileSync(mdPath, "utf8").split("\n");
  const out: { file: string; lineNo: number; text: string }[] = [];
  let openAt = -1;
  lines.forEach((line, i) => {
    if (line.trim() === "```axs") openAt = i;
    else if (openAt >= 0 && line.trim() === "```") {
      out.push({
        file: relative(process.cwd(), mdPath),
        lineNo: openAt + 1,
        text: lines.slice(openAt + 1, i).join("\n") + "\n",
      });
      openAt = -1;
    }
  });
  return out;
}
const blocks = mdFiles(docsRoot).flatMap(fencesOf);

/**
 * 往返比较只看结构：行号会因打印排版而变；诊断只看 error 级（另有一条判据），片段块的可恢复提示不作数。
 * `jumps` 也排除，因为打印会把边表里的顺序边物化成 `-> 标题` 行（在册待决，工单标题"打印物化顺序边"：
 * 显式化让"在两拍之间插一拍"不再自动接上，隐式化让"移动节点"改写连线——两面都有失效模式，等定档）。
 * 真正必须守住的是 **edges（图的连接）** 与 beats 的其余字段：那条物化不改图，只多写一行。
 */
function structure(doc: { beats: AxsBeat[]; edges: unknown[] }) {
  return JSON.parse(
    JSON.stringify(
      doc,
      (k, v) =>
        k === "line" || k === "lineMap" || k === "diagnostics" || k === "jumps"
          ? undefined
          : v,
    ),
  );
}

describe("用户文档的 axs 示例：可解析", () => {
  it("围栏数量与文档一致（防止取块逻辑空载）", () => {
    const fences = mdFiles(docsRoot).reduce(
      (n, f) =>
        n + readFileSync(f, "utf8").split("\n").filter((l) => l.trim() === "```axs").length,
      0,
    );
    expect(fences).toBeGreaterThan(12);
    expect(blocks).toHaveLength(fences);
  });

  for (const b of blocks) {
    it(`${b.file} L${b.lineNo} 的示例不产生 error 级诊断`, () => {
      const doc = parseAxs(b.text);
      const errs = doc.diagnostics.filter((d) => d.severity === "error");
      expect(errs.map((e) => `${e.line}:${e.message}`)).toEqual([]);
    });
  }
});

describe("用户文档的 axs 示例：打印是纯函数", () => {
  it("printAxs 不许把中间态写回调用方的 beat", () => {
    for (const b of blocks) {
      const doc = parseAxs(b.text);
      const before = JSON.stringify(doc);
      printAxs(doc);
      // 曾经的做法是 `beat._edges = …`：打印完调用方对象上多一个私字段，
      // 于是 parse→print→再序列化 的通路会把内部 scratch 带进草稿与 .axsp。
      expect(JSON.stringify(doc), `示例 ${b.file} L${b.lineNo} 被打印改写了`).toBe(before);
    }
  });
});

describe("用户文档的 axs 示例：可往返", () => {
  for (const b of blocks) {
    it(`${b.file} L${b.lineNo} 的示例打印后重新解析，结构与原 AST 一致`, () => {
      const once = parseAxs(b.text);
      const twice = parseAxs(printAxs(once));
      expect(structure(twice)).toEqual(structure(once));
    });
  }
});
