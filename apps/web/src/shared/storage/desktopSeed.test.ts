import { describe, expect, it } from "vitest";
import { MemoryStorageProvider } from "@axiforge/editor-core";
import { exportProjectAsAxsp, importProjectFromAxsp } from "./index";
import { seedFromPackages } from "./desktopSeed";

/**
 * 播种逻辑（seedFromPackages）单测：桌面门禁与标记文件由 seedDesktopIfEmpty 负责，
 * 这里只验「按 manifest 逐个导入」的语义，故注入假 fetch。
 */

async function makePackage(title: string): Promise<Uint8Array> {
  const src = new MemoryStorageProvider();
  const created = await src.createProject({ title });
  if (!created.ok) throw new Error("create failed");
  const packed = await exportProjectAsAxsp(src, created.data.id);
  if (!packed.ok) throw new Error("pack failed");
  return packed.data;
}

function fakeFetch(routes: Record<string, { ok?: boolean; body?: unknown; bytes?: Uint8Array }>) {
  return (async (url: string) => {
    const hit = routes[String(url)];
    if (!hit || hit.ok === false) {
      return { ok: false, status: 404, json: async () => ({}), arrayBuffer: async () => new ArrayBuffer(0) };
    }
    return {
      ok: true,
      status: 200,
      json: async () => hit.body,
      arrayBuffer: async () =>
        hit.bytes ? hit.bytes.buffer.slice(hit.bytes.byteOffset, hit.bytes.byteOffset + hit.bytes.byteLength) : new ArrayBuffer(0),
    };
  }) as unknown as typeof fetch;
}

describe("seedFromPackages", () => {
  it("按清单导入全部工程，返回导入条数", async () => {
    const a = await makePackage("示范·甲");
    const b = await makePackage("示范·乙");
    const provider = new MemoryStorageProvider();
    const imported = await seedFromPackages({
      provider,
      importPackage: importProjectFromAxsp,
      fetchImpl: fakeFetch({
        "/seeds/manifest.json": { body: ["a.axsp", "b.axsp"] },
        "/seeds/a.axsp": { bytes: a },
        "/seeds/b.axsp": { bytes: b },
      }),
    });
    expect(imported).toBe(2);
    const list = await provider.listProjects();
    const titles = list.ok ? list.data.map((p) => p.title) : [];
    expect(titles).toHaveLength(2);
    expect(titles).toContain("示范·甲");
    expect(titles).toContain("示范·乙");
  });

  it("manifest 缺失或形态不对 → 0（不抛异常，首启不因资源缺席而卡死）", async () => {
    const provider = new MemoryStorageProvider();
    expect(
      await seedFromPackages({
        provider,
        importPackage: importProjectFromAxsp,
        fetchImpl: fakeFetch({ "/seeds/manifest.json": { ok: false } }),
      }),
    ).toBe(0);
    expect(
      await seedFromPackages({
        provider,
        importPackage: importProjectFromAxsp,
        fetchImpl: fakeFetch({ "/seeds/manifest.json": { body: { not: "array" } } }),
      }),
    ).toBe(0);
    const list = await provider.listProjects();
    expect(list.ok && list.data).toHaveLength(0);
  });

  it("单个包损坏不阻断其余导入", async () => {
    const good = await makePackage("示范·好");
    const provider = new MemoryStorageProvider();
    const imported = await seedFromPackages({
      provider,
      importPackage: importProjectFromAxsp,
      fetchImpl: fakeFetch({
        "/seeds/manifest.json": { body: ["broken.axsp", "good.axsp"] },
        "/seeds/broken.axsp": { bytes: new TextEncoder().encode("broken{") },
        "/seeds/good.axsp": { bytes: good },
      }),
    });
    expect(imported).toBe(1);
    const list = await provider.listProjects();
    expect(list.ok && list.data.map((p) => p.title)).toEqual(["示范·好"]);
  });
});
