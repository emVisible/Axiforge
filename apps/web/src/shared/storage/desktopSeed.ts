/**
 * 桌面首启播种（Phase 6 M2-3）：空库时把随前端资源分发的官方示范作 `.axsp`
 * 导入一次——新用户开机就有可玩内容，不必先搭后端、不必先联网。
 *
 * 播种是**一次性**的：`Documents/Axiforge/.seeded` 标记存在即不再灌，
 * 用户主动删空工程后不会被示范作重新填满（那是他的库，不是我们的演示台）。
 */

import type {
  ProjectMeta,
  StorageProvider,
  StorageResult,
} from "@axiforge/editor-core";
import { isTauriEnvironment } from "./tauriSqlBackend";

const SEED_BASE = "/seeds";
/**
 * 播种标记文件。不能用点文件名：Tauri 的 fs scope 默认不匹配隐藏文件，
 * `$HOME/Documents/Axiforge/**` 会拒掉 `.seeded`（实测 forbidden path）。
 */
const SEED_MARKER = "Axiforge/seeded.json";

export type PackageImporter = (
  provider: StorageProvider,
  bytes: Uint8Array,
) => Promise<StorageResult<ProjectMeta>>;

async function markerExists(): Promise<boolean> {
  const fs = await import("@tauri-apps/plugin-fs");
  return fs.exists(SEED_MARKER, { baseDir: fs.BaseDirectory.Document });
}

async function writeMarker(): Promise<void> {
  const fs = await import("@tauri-apps/plugin-fs");
  await fs.mkdir("Axiforge", { baseDir: fs.BaseDirectory.Document, recursive: true });
  await fs.writeTextFile(SEED_MARKER, new Date().toISOString(), {
    baseDir: fs.BaseDirectory.Document,
  });
}

/** 按 manifest 清单逐个导入（纯逻辑，可脱离桌面环境测试） */
export async function seedFromPackages(input: {
  provider: StorageProvider;
  importPackage: PackageImporter;
  fetchImpl?: typeof fetch;
  base?: string;
}): Promise<number> {
  const doFetch = input.fetchImpl ?? fetch;
  const base = input.base ?? SEED_BASE;
  const index = await doFetch(`${base}/manifest.json`);
  if (!index.ok) return 0;
  const files = (await index.json()) as unknown;
  if (!Array.isArray(files)) return 0;

  let imported = 0;
  for (const file of files) {
    if (typeof file !== "string") continue;
    const pkg = await doFetch(`${base}/${file}`);
    if (!pkg.ok) continue;
    const bytes = new Uint8Array(await pkg.arrayBuffer());
    const res = await input.importPackage(input.provider, bytes);
    if (res.ok) imported += 1;
  }
  return imported;
}

/** 播种结果（可观测：失败原因必须能被冒烟/日志读到，不得静默归零） */
export type SeedOutcome =
  | { status: "seeded"; imported: number }
  | { status: "skipped"; reason: "not-desktop" | "non-empty" | "already-marked" }
  | { status: "failed"; detail: string };

/** 桌面 + 空库 + 未播过种 三条件同时成立才播种 */
export async function seedDesktopIfEmpty(
  provider: StorageProvider,
  importPackage: PackageImporter,
): Promise<SeedOutcome> {
  if (!isTauriEnvironment()) return { status: "skipped", reason: "not-desktop" };
  const list = await provider.listProjects();
  if (!list.ok) {
    return { status: "failed", detail: `listProjects: ${list.error.code}` };
  }
  if (list.data.length > 0) return { status: "skipped", reason: "non-empty" };
  // 标记读不到时报告失败而非当作「已播过」——静默跳过会让首启空库无人察觉
  try {
    if (await markerExists()) {
      return { status: "skipped", reason: "already-marked" };
    }
  } catch (e) {
    return {
      status: "failed",
      detail: `播种标记不可读：${e instanceof Error ? e.message : String(e)}`,
    };
  }
  try {
    const imported = await seedFromPackages({ provider, importPackage });
    if (imported === 0) {
      return { status: "failed", detail: "清单为空或全部包导入失败" };
    }
    await writeMarker().catch(() => undefined);
    return { status: "seeded", imported };
  } catch (e) {
    return { status: "failed", detail: e instanceof Error ? e.message : String(e) };
  }
}
