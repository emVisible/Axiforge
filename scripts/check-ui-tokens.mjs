#!/usr/bin/env node
/**
 * Fails if Studio / Discover / Character paths contain hardcoded color escapes.
 * Player HUD and syntax-highlight hex are out of scope.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const SCAN_ROOTS = [
  "apps/web/src/features/studio",
  "apps/web/src/features/discover",
  "apps/web/src/features/character",
];

const PATTERNS = [
  { name: "arbitrary bg hex", regex: /bg-\[#/ },
  { name: "arbitrary text hex", regex: /text-\[#/ },
  { name: "text-white opacity", regex: /text-white\// },
  { name: "border-white opacity", regex: /border-white\// },
];

const SOURCE_EXT = new Set([".ts", ".tsx", ".js", ".jsx"]);

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const abs = path.join(dir, entry);
    const stat = statSync(abs);
    if (stat.isDirectory()) {
      walk(abs, files);
      continue;
    }
    if (SOURCE_EXT.has(path.extname(entry))) files.push(abs);
  }
  return files;
}

let failed = false;

for (const scanRoot of SCAN_ROOTS) {
  const absRoot = path.join(root, scanRoot);
  const files = walk(absRoot);

  for (const file of files) {
    const rel = path.relative(root, file);
    const lines = readFileSync(file, "utf8").split("\n");

    for (let i = 0; i < lines.length; i++) {
      for (const { name, regex } of PATTERNS) {
        if (!regex.test(lines[i])) continue;
        failed = true;
        console.error(`[lint:colors] ${name} in ${rel}:${i + 1}`);
        console.error(`  ${lines[i].trim()}`);
      }
    }
  }
}

if (failed) {
  console.error(
    "\n[lint:colors] Use semantic tokens (--ax-* / text-ink / bg-surface) instead.",
  );
  process.exit(1);
}

console.log("[lint:colors] OK");
