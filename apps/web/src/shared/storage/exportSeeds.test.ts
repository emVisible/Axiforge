import { describe, expect, it } from "vitest";
import { setApiBase } from "@/shared/api/client";
import { exportProjectAsAxsp } from "./index";
import { HttpStorageProvider } from "./httpStorageProvider";

/**
 * 官方示范作种子导出（构建期工具，非测试）。
 *
 * 默认跳过；显式开启时从**在线后端**导出公开示范作为 `.axsp` v2，落到
 * `apps/web/public/seeds/` 随前端资源一起打进桌面包。之所以复用应用自身的导出
 * 路径而不是另写一份映射：`ProjectResponse → ProjectBundle` 只允许有一处权威。
 *
 * 用法（需后端在跑）：
 *   AXIFORGE_EXPORT_SEEDS=1 pnpm --filter @axiforge/web exec vitest run \
 *     src/shared/storage/exportSeeds.test.ts
 */
const RUN = process.env.AXIFORGE_EXPORT_SEEDS === "1";
const API = process.env.AXIFORGE_API ?? "http://localhost:8000/api/v1";
const OUT_DIR = new URL("../../../public/seeds/", import.meta.url);
const EXPORTER_ID = "axiforge-seed-export";

// Node 里没有同源相对路径可解析，Provider 需要绝对基址
setApiBase(API);

describe.skipIf(!RUN)("示范作种子导出", () => {
  it("seed 响应即权威清单 → 逐包导出 → public/seeds/", async () => {
    const { mkdirSync, writeFileSync } = await import("node:fs");

    const seeded = await fetch(`${API}/editor/projects/seed/showcase`, { method: "POST" });
    expect(seeded.ok, `播种示范作失败 ${seeded.status}`).toBe(true);
    // 播种端点自己返回 { projects: [{id, title}] }——以它为唯一清单，
    // 不走 discover（那会把库里其它 is_public 的历史测试工程一起灌进新用户首启）
    const payload = (await seeded.json()) as {
      projects: { id: string; title: string }[];
    };
    expect(payload.projects).toHaveLength(3);
    const projects = [...payload.projects].sort((a, b) =>
      a.title.localeCompare(b.title, "zh"),
    );

    mkdirSync(OUT_DIR, { recursive: true });
    const provider = new HttpStorageProvider(EXPORTER_ID);
    const files: string[] = [];
    for (let i = 0; i < projects.length; i += 1) {
      const packed = await exportProjectAsAxsp(provider, String(projects[i].id));
      if (!packed.ok) {
        console.error("[seeds] 导出失败", projects[i], packed.error);
      }
      expect(packed.ok, `${projects[i].title} 导出失败`).toBe(true);
      if (!packed.ok) return;
      expect([packed.data[0], packed.data[1]]).toEqual([0x50, 0x4b]);
      const name = `showcase-${i + 1}.axsp`;
      writeFileSync(new URL(name, OUT_DIR), packed.data);
      files.push(name);
      console.log(`[seeds] ${name} ← ${projects[i].title} (${packed.data.byteLength}B)`);
    }
    writeFileSync(new URL("manifest.json", OUT_DIR), JSON.stringify(files, null, 2));
    expect(files).toEqual(["showcase-1.axsp", "showcase-2.axsp", "showcase-3.axsp"]);
  }, 180_000);
});
