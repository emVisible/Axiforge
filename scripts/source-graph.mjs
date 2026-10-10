#!/usr/bin/env node
/**
 * 前端源码图的最小公共域（给 `cloud-callmap.mjs` 与 `check-dead-surface.mjs` 共用）。
 *
 * 为什么要抽出来：同一份"什么是入口、什么算引用、注释怎么遮"的判据如果被两个脚本各抄一遍，
 * 两边就会分叉——而分叉的代价是两张表对同一个模块给出相反的可达性结论，读的人无法知道该信谁。
 * 本仓有过一次同族事故（形状匹配只吃剥注释后的代码 vs 半边还在吃原文），所以这里是**真相源**，不是工具箱。
 *
 * 两份遮蔽是故意的，别合并：
 *   - `maskComments`：只遮注释、**保留字符串**。抽 import 说明符、抽路由表、找 `<组件>` 渲染点要用它
 *     （`import("@/…")` 的路径本身就在字符串里，用另一份会得到"0 条路由、全是死模块"的假读数）。
 *   - `maskNonCode`：注释与字符串都按同长度 blanks 掉。数**花括号嵌套**要用它（串里的 `{` 会把嵌套带偏）。
 *     代价：写在模板串插值里的东西看不见——判据方向上宁可"少判安全/少判死"，不要反过来。
 */
import { readdirSync, readFileSync } from "node:fs";
import { join, relative, dirname } from "node:path";

/** 遍历跳过清单。`Clearance/` 是未纳管的外部目录（里面有 `.env`），**禁止进入**，写死在这里免得下一次改宽。 */
export const WALK_SKIP = new Set([
  "node_modules", "dist", "build", "coverage", ".git", ".next", "target",
  "__pycache__", ".venv", "venv", "Clearance", ".pnpm",
]);

export function walk(dir, exts, acc = []) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return acc;
  }
  for (const e of entries) {
    if (WALK_SKIP.has(e.name) || (!e.isFile() && e.name.startsWith("."))) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, exts, acc);
    else if (exts.some((x) => e.name.endsWith(x))) acc.push(p);
  }
  return acc;
}

export function maskComments(src) {
  const a = src.split("");
  const blank = (from, to) => {
    for (let i = from; i < to && i < a.length; i++) if (a[i] !== "\n") a[i] = " ";
  };
  let i = 0;
  while (i < a.length) {
    const c = a[i];
    if (c === "/" && a[i + 1] === "/") {
      let j = i;
      while (j < a.length && a[j] !== "\n") j++;
      blank(i, j);
      i = j;
    } else if (c === "/" && a[i + 1] === "*") {
      let j = i + 2;
      while (j < a.length && !(a[j] === "*" && a[j + 1] === "/")) j++;
      blank(i, Math.min(j + 2, a.length));
      i = j + 2;
    } else if (c === '"' || c === "'" || c === "`") {
      let j = i + 1;
      while (j < a.length && a[j] !== c) {
        if (a[j] === "\\") j++;
        j++;
      }
      i = j + 1;
    } else i++;
  }
  return a.join("");
}

export function maskNonCode(src) {
  const a = src.split("");
  const blank = (from, to) => {
    for (let i = from; i < to && i < a.length; i++) if (a[i] !== "\n") a[i] = " ";
  };
  /**
   * 正则字面量必须先认出来，再决定它不是注释：
   * 实测 `playUrl.replace(/^https?:\/\//, "")` 里那对 `\/\/` 的尾部被当成行注释，
   * 于是**同一行后面的代码连同 `}` 一起被抹掉**，花括号从此配不平，
   * `blockPairs` 拿到的"函数体"退化成一行的碎片——所有建在遮蔽文本上的判据（块配对、路由解析、
   * 守卫形状、死表面、接缝）都会跟着错位，而且错位方向两种都有：
   * 抹掉 `api.x()` 就是**把云端调用藏起来**，抹掉 `return` 就是把真闸门判成没有。
   */
  const prevSignificant = (k) => {
    let k2 = k - 1;
    while (k2 >= 0 && /\s/.test(a[k2])) k2--;
    return k2 < 0 ? "" : a[k2];
  };
  let i = 0;
  while (i < a.length) {
    const c = a[i];
    if (c === "/" && a[i + 1] === "/") {
      let j = i;
      while (j < a.length && a[j] !== "\n") j++;
      blank(i, j);
      i = j;
    } else if (c === "/" && a[i + 1] === "*") {
      let j = i + 2;
      while (j < a.length && !(a[j] === "*" && a[j + 1] === "/")) j++;
      blank(i, Math.min(j + 2, a.length));
      i = j + 2;
    } else if (c === '"' || c === "'" || c === "`") {
      let j = i + 1;
      while (j < a.length && a[j] !== c) {
        if (a[j] === "\\") j++;
        j++;
      }
      blank(i + 1, j);
      i = j + 1;
    } else if (c === "/" && "/(,=:[!&|?{};+-*%<>~^".includes(prevSignificant(i))) {
      // 操作数位置上出现的 `/` 是正则开头，吃到未转义的收尾 `/`（字符类 `[...]` 里的 `/` 不算收尾）
      let j = i + 1;
      let inClass = false;
      while (j < a.length) {
        const x = a[j];
        if (x === "\n") break; // 正则不跨行：走到行尾说明这不是正则，交回普通扫描
        if (x === "\\") {
          j += 2;
          continue;
        }
        if (x === "[") inClass = true;
        else if (x === "]") inClass = false;
        else if (x === "/" && !inClass) break;
        j++;
      }
      if (j < a.length && a[j] === "/") {
        blank(i + 1, j); // 抹掉字面量内容：里面的 `{`、`}`、引号都不该参与结构
        let k = j + 1;
        while (k < a.length && /[a-z]/i.test(a[k])) k++; // 	flags
        i = k;
      } else i++;
    } else i++;
  }
  return a.join("");
}

/** 花括号配对（输入必须是 `maskNonCode` 之后的文本，否则串里的 `{` 会配错对） */
export function blockPairs(masked) {
  const stack = [], pairs = [];
  for (let i = 0; i < masked.length; i++) {
    if (masked[i] === "{") stack.push(i);
    else if (masked[i] === "}") {
      const o = stack.pop();
      if (o !== undefined) pairs.push([o, i]);
    }
  }
  return pairs;
}

/** 从 from 起的一条语句的结束位置：支持 `if (c) return;` 与 `if (c) { … return; }` 两种形状 */
export function stmtEnd(masked, from) {
  let d = 0, sawBlock = false;
  for (let i = from; i < masked.length; i++) {
    const c = masked[i];
    if (c === "{") { d++; sawBlock = true; }
    else if (c === "}") { d--; if (d === 0 && sawBlock) return i + 1; }
    else if (c === ";" && d === 0) return i + 1;
  }
  return masked.length;
}

export const lineOf = (masked, idx) => masked.slice(0, idx).split("\n").length;

/**
 * 路由表解析器（真相源）：把 `<Route>` 嵌套展开成**绝对路径**清单。
 * `cloud-callmap.mjs` 的宿主闭包与 `desktop-http-inventory.mjs` 的加载面都读这一份——
 * 路由表被抄两遍的代价是"一边新、一边旧"，而旧的那遍只会以**漏路由**的形式静默生效。
 *
 * 为什么不能用正则：`<Route path="/studio" element={<StudioLayout />}>` 里那个 `/>`
 * 会让 `<Route\b([^>]*?)\/?>` 提前收尾，于是**带子路由的父 Route** 被当成自闭合，
 * 整棵 `/studio/**` 子树丢掉前缀（实测就这么把 `projects/:id` 记成了根级路由）。
 * 所以这里是真扫描器：字符串照收、`{…}` 按深度计、只在**深度 0 的 `>`** 处结束标签，
 * 结束符前一位是 `/` 才算自闭合。
 *
 * 输入必须是 `maskComments` 之后的文本：注释里举例的 `<Route>` 不算路由，
 * 而 `path="…"` 本身就在字符串里（用 `maskNonCode` 会得到"0 条路由"）。
 *
 * 返回的每条：`{ path, label, element, kind, params, splat, layout, at }`
 *   - `kind`：`"page"`（可直接导航的叶子）／`"layout"`（非自闭合的包裹层）／
 *     `"redirect"`（导航它只会立刻跳走，测不到东西：既认 `element={<Navigate …/>}`，
 *     也认**就地定义、体内返回 `<Navigate>` 的壳组件**——实测 `ProjectFlowLegacyRedirect` 就是这一族，
 *     只按字面名判会把它当成一个页面去导航，于是"覆盖了 26 条路由"里有几条其实落在同一个地方）
 *   - `label`：给消费方当身份键用的串。无 path 的包裹层（`<Route element={<DiscoverLayout/>}>`）
 *     绝对路径是空串，直接拿 path 当键会让三条布局**共用一个闭包**，所以这里保证唯一
 *   - `layout`：这一条头顶上的布局链（页面自身的 element 除外），给闭包用
 */
export function parseRoutes(maskedSrc) {
  const tagEnd = (src, from) => {
    let d = 0;
    for (let i = from; i < src.length; i++) {
      const c = src[i];
      if (c === '"' || c === "'" || c === "`") {
        let j = i + 1;
        while (j < src.length && src[j] !== c) {
          if (src[j] === "\\") j++;
          j++;
        }
        i = j;
      } else if (c === "{") d++;
      else if (c === "}") d--;
      else if (c === ">" && d === 0) {
        return { end: i, selfClose: /\/\s*$/.test(src.slice(from, i)) };
      }
    }
    return { end: src.length, selfClose: false };
  };
  const join = (parent, child) => {
    if (child == null) return parent;
    if (child.startsWith("/")) return child;
    const p = parent.endsWith("/") ? parent.slice(0, -1) : parent;
    return `${p}/${child}`;
  };
  const out = [];
  const stack = []; // 当前祖先链（绝对路径 + element 名）
  /** 就地定义的壳组件：体内返回 `<Navigate>` 就算重定向，不是页面 */
  const localRedirect = (name) => {
    const i = maskedSrc.search(new RegExp(`(?:function\\s+${name}\\b|const\\s+${name}\\s*[:=])`));
    if (i < 0) return false;
    const rest = maskedSrc.slice(i + name.length);
    const nxt = rest.search(/\n(?:export\s+)?(?:async\s+)?(?:function|const|let|class)\s/);
    return /<Navigate\b/.test(rest.slice(0, nxt === -1 ? rest.length : nxt));
  };
  for (const m of maskedSrc.matchAll(/<(\/?)Route\b/g)) {
    const open = m[1] !== "/";
    if (!open) {
      stack.pop();
      continue;
    }
    const attrsStart = m.index + m[0].length;
    const { end, selfClose } = tagEnd(maskedSrc, attrsStart);
    const attrs = maskedSrc.slice(attrsStart, end);
    const pathAttr = (attrs.match(/\bpath=\s*["']([^"']*)["']/) || [])[1];
    const isIndex = /\binx\b(?![\w-])/.test(attrs);
    const element = (attrs.match(/element=\s*\{<(\w+)/) || [])[1];
    const abs = join(stack.length ? stack[stack.length - 1].path : "", isIndex ? null : pathAttr ?? null);
    const kind = !selfClose
      ? "layout"
      : element === undefined || element === "Navigate" || localRedirect(element)
        ? "redirect"
        : "page";
    out.push({
      path: abs,
      label: abs === "" ? `layout@${element ?? "?"}` : abs,
      element,
      kind,
      params: [...(abs.match(/:(\w+)/g) || [])].map((p) => p.slice(1)),
      splat: /\*/.test(abs),
      layout: stack.map((s) => s.element).filter(Boolean),
      at: lineOf(maskedSrc, m.index),
    });
    if (!selfClose) stack.push({ path: abs, element });
    if (!selfClose && end >= maskedSrc.length) break; // 标签没闭合：扫描器不猜，直接停
  }
  return out;
}

/**
 * `lazy(() => import("…"))` 的抽取（一份形状，两个消费方共用：路由元素 → 模块、以及"这个模块是不是某个 lazy 的目标"）。
 *
 * **`lazy(` 与 `()` 之间必须留 `\s*`**：`App.tsx` 里 5 条 discover 页写成
 * ```
 * const DiscoverProjectDetailPage = lazy(
 *   () => import("@/features/discover/pages/DiscoverProjectDetailPage"),
 * );
 * ```
 * 上一版有两条正则，一条 `lazy\(\(\)`（严）一条 `lazy\(\s*\(\)`（松）——**同一形状两份实现、宽严还不一致**，
 * 严的那条正好漏掉这 5 条：真路由页既进不了宿主闭包，也算不出"它是某个 lazy 的目标"，
 * 于是被普查报成「界面确定走不到」。给活代码贴死标签，是这批判据最不能犯的方向。
 * 实测（2026-10-09）：`App.tsx` 共 26 条 lazy 声明，严式只认 21 条。
 *
 * 名字取紧邻的 `const X =`；没有赋值形式（就地内联在 JSX 里）时 `name` 为 null，说明符照收。
 */
export function lazyImports(maskedSrc) {
  const out = [];
  for (const m of maskedSrc.matchAll(/lazy\s*\(\s*\(\s*\)\s*=>\s*import\s*\(\s*["']([^"']+)["']/g)) {
    const before = maskedSrc.slice(Math.max(0, m.index - 60), m.index);
    out.push({
      name: (before.match(/(?:const|let|var)\s+(\w+)\s*=\s*$/) || [])[1] ?? null,
      spec: m[1],
      at: m.index,
    });
  }
  return out;
}

/**
 * 建一张源码图：文件面 + 两份遮蔽缓存 + 别名解析 + import 边 + 闭包。
 * `aliasRoot` 是 `@/` 指向的目录（相对仓库根），`dir` 是要遍历的目录（默认就是 aliasRoot）。
 */
export function createSourceGraph({ root, aliasRoot, dir = aliasRoot, exts = [".ts", ".tsx"] }) {
  const files = walk(join(root, dir), exts).map((f) => relative(root, f));
  const codeCache = new Map();
  const maskedCache = new Map();
  const read = (rel) => readFileSync(join(root, rel), "utf8");
  const codeOf = (rel) => {
    if (!codeCache.has(rel)) codeCache.set(rel, maskComments(read(rel)));
    return codeCache.get(rel);
  };
  const maskedOf = (rel) => {
    if (!maskedCache.has(rel)) maskedCache.set(rel, maskNonCode(read(rel)));
    return maskedCache.get(rel);
  };
  const resolveSpec = (fromRel, spec) => {
    let base;
    if (spec.startsWith("@/")) base = aliasRoot + "/" + spec.slice(2);
    else if (spec.startsWith("./") || spec.startsWith("../")) base = join(dirname(fromRel), spec);
    else return null;
    const clean = base
      .split("/")
      .reduce((acc, part) => {
        if (part === "..") acc.pop();
        else if (part !== "." && part !== "") acc.push(part);
        return acc;
      }, [])
      .join("/");
    for (const cand of [clean + ".ts", clean + ".tsx", clean + "/index.ts", clean + "/index.tsx", clean]) {
      if (files.includes(cand)) return cand;
    }
    return null;
  };
  const importsOf = (rel) => {
    const m = codeOf(rel);
    const specs = [
      ...[...m.matchAll(/(?:from|import)\s*["']([^"']+)["']/g)].map((x) => x[1]),
      ...[...m.matchAll(/import\(\s*["']([^"']+)["']\s*\)/g)].map((x) => x[1]),
    ];
    return [...new Set(specs.map((s) => resolveSpec(rel, s)).filter(Boolean))];
  };
  /** 从入口集合出发沿 import 边闭包（含入口自身）；不在闭包里的文件，界面加载不到 */
  const closureOf = (entries) => {
    const seen = new Set(entries.filter((e) => files.includes(e)));
    const queue = [...seen];
    while (queue.length) {
      for (const nxt of importsOf(queue.shift())) {
        if (!seen.has(nxt)) {
          seen.add(nxt);
          queue.push(nxt);
        }
      }
    }
    return seen;
  };
  return { files, codeOf, maskedOf, resolveSpec, importsOf, closureOf };
}
