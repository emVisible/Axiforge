import { beforeEach, describe, expect, it, vi } from "vitest";
import { TauriAssetStore, contentDigest } from "./tauriAssetStore";

/**
 * 桌面素材落盘（TauriAssetStore）的首批判据。
 *
 * 和 `tauriSqlBackend.test.ts` 同一条理由：这是**只有桌面才会走到的生产实现**，
 * 契约套件跑的是 Memory 与 sql.js，桌面壳零 CI 信号——落盘语义此前只靠 DEV 冒烟。
 * 这里额外守的是一处**跨层契约**：`contentKey` 在 editor-core 里写明"仅供内存实现与测试"，
 * 用户文档写明"素材文件名是内容的 SHA-256，别的电脑认得同一个文件"（`docs/user/desktop/`）。
 * 摘要一旦静默换成非加密键，同一张图在两台机器上会得到两个 ref ⇒ 承诺失效且没人报警。
 */

const fsMock = vi.hoisted(() => ({
  mkdir: vi.fn(),
  exists: vi.fn(),
  writeFile: vi.fn(),
  readFile: vi.fn(),
}));

vi.mock("@tauri-apps/api/path", () => ({
  documentDir: async () => "/user/Documents",
  join: async (...parts: string[]) => parts.join("/"),
}));
vi.mock("@tauri-apps/plugin-fs", () => ({
  mkdir: fsMock.mkdir,
  exists: fsMock.exists,
  writeFile: fsMock.writeFile,
  readFile: fsMock.readFile,
}));

const bytesOf = (text: string) => new TextEncoder().encode(text);
/** "abc" 的 SHA-256（公开向量，钉死"ref 里那串就是 sha256"） */
const SHA256_OF_ABC =
  "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad";

beforeEach(() => {
  vi.clearAllMocks();
  fsMock.mkdir.mockResolvedValue(undefined);
  fsMock.exists.mockResolvedValue(false);
  fsMock.writeFile.mockResolvedValue(undefined);
});

describe("素材摘要用的就是 SHA-256（不是非加密内容键）", () => {
  it("contentDigest 对已知向量给 64 位十六进制", async () => {
    expect(await contentDigest(bytesOf("abc"))).toBe(SHA256_OF_ABC);
  });

  it("写出的 ref 形如 assets/<sha256>.<ext>，扩展名取文件名后缀", async () => {
    const store = await TauriAssetStore.create();
    const r = await store.write({ name: "夜.png", mime: "image/png", bytes: bytesOf("abc") });

    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.ref).toBe(`assets/${SHA256_OF_ABC}.png`);
    expect(fsMock.writeFile.mock.calls[0]![0]).toBe(
      `/user/Documents/Axiforge/assets/${SHA256_OF_ABC}.png`,
    );
  });

  it("没有 crypto.subtle 时报错且不落盘：不静默换成非加密键", async () => {
    const real = globalThis.crypto;
    Object.defineProperty(globalThis, "crypto", {
      value: {}, // 有 crypto 但没有 subtle = 非安全上下文
      configurable: true,
    });
    try {
      const store = await TauriAssetStore.create();
      const r = await store.write({ name: "夜.png", mime: "image/png", bytes: bytesOf("abc") });

      expect(r.ok).toBe(false);
      if (!r.ok) {
        expect(r.error.code).toBe("io");
        // StorageError 是联合类型：detail 只在 io 那支上存在，先收窄再断言
        if (r.error.code === "io") expect(r.error.detail).toContain("摘要");
      }
      expect(fsMock.writeFile).not.toHaveBeenCalled();
    } finally {
      Object.defineProperty(globalThis, "crypto", { value: real, configurable: true });
    }
  });
});

describe("素材落盘的其余边界", () => {
  it("同内容第二次写命中同一 ref 且不重复落盘", async () => {
    const store = await TauriAssetStore.create();
    fsMock.exists.mockResolvedValueOnce(false).mockResolvedValueOnce(true);

    const first = await store.write({ name: "a.png", mime: "image/png", bytes: bytesOf("abc") });
    const second = await store.write({ name: "改名还是它.png", mime: "image/png", bytes: bytesOf("abc") });

    expect(first.ok && second.ok).toBe(true);
    if (first.ok && second.ok) expect(second.data.ref).toBe(first.data.ref);
    expect(fsMock.writeFile).toHaveBeenCalledTimes(1);
  });

  it("空字节直接 io，不去算摘要", async () => {
    const store = await TauriAssetStore.create();
    const r = await store.write({ name: "空.png", mime: "image/png", bytes: new Uint8Array(0) });

    expect(r.ok).toBe(false);
    expect(fsMock.writeFile).not.toHaveBeenCalled();
  });

  it("read 只认 local 形态：外部 URL 不去拼路径", async () => {
    const store = await TauriAssetStore.create();
    const r = await store.read("https://cdn.example.com/x.png");

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe("not_found");
    expect(fsMock.readFile).not.toHaveBeenCalled();
  });

  it("文件不在盘上给 not_found，读失败给 io", async () => {
    const store = await TauriAssetStore.create();
    fsMock.exists.mockResolvedValueOnce(false);
    const missing = await store.read(`assets/${SHA256_OF_ABC}.png`);
    expect(missing.ok).toBe(false);
    if (!missing.ok) expect(missing.error.code).toBe("not_found");

    fsMock.exists.mockResolvedValueOnce(true);
    fsMock.readFile.mockRejectedValueOnce(new Error("权限拒绝"));
    const failed = await store.read(`assets/${SHA256_OF_ABC}.png`);
    expect(failed.ok).toBe(false);
    if (!failed.ok) expect(failed.error.code).toBe("io");
  });
});
