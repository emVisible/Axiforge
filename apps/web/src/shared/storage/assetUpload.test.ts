import { describe, expect, it } from "vitest";
import { MemoryStorageProvider, type StorageProvider } from "@axiforge/editor-core";
import { uploadToServer } from "@axiforge/ui";
import { uploadFileAsAsset } from "./assetUpload";
import PlatformImageUpload from "@/shared/components/ui/PlatformImageUpload";
import { ImageUpload } from "@/shared/components/ui";

/**
 * 上传口的平台分派验证：组件默认行为（服务端 POST）逐字段不变，
 * 宿主注入后改走 Provider，且调用方仍可覆盖。
 */

function pngFile(bytes = new Uint8Array([1, 2, 3])): File {
  return new File([bytes as unknown as BlobPart], "立绘.png", { type: "image/png" });
}

describe("默认上传口（web 冻结线）", () => {
  it("uploadToServer POST /api/v1/upload 并回传服务端 url", async () => {
    const original = globalThis.fetch;
    const seen: { url: string; hasBody: boolean }[] = [];
    globalThis.fetch = (async (url: string, init?: RequestInit) => {
      seen.push({ url: String(url), hasBody: Boolean(init?.body) });
      return {
        ok: true,
        status: 200,
        json: async () => ({ url: "/uploads/abc.png" }),
      };
    }) as unknown as typeof fetch;
    try {
      const ref = await uploadToServer(pngFile());
      expect(seen).toEqual([{ url: "/api/v1/upload", hasBody: true }]);
      expect(ref).toBe("/uploads/abc.png");
    } finally {
      globalThis.fetch = original;
    }
  });
});

describe("Provider 上传口", () => {
  it("File 的 name/mime/bytes 原样进 saveAsset，返回本地 ref", async () => {
    const provider = new MemoryStorageProvider();
    const ref = await uploadFileAsAsset(pngFile(), provider);
    expect(ref).toMatch(/^assets\/[0-9a-f]+\.png$/);
    const back = await provider.readAsset(ref);
    expect(back.ok && Array.from(back.data)).toEqual([1, 2, 3]);
  });

  it("同一文件重复上传得到同一 ref（去重）", async () => {
    const provider = new MemoryStorageProvider();
    const a = await uploadFileAsAsset(pngFile(), provider);
    const b = await uploadFileAsAsset(pngFile(), provider);
    expect(b).toBe(a);
  });

  it("Provider 失败 → 抛出带错误码的异常（组件据此呈现）", async () => {
    const broken: Partial<StorageProvider> = {
      saveAsset: async () => ({
        ok: false,
        error: { code: "io", detail: "磁盘已满" },
      }),
    };
    await expect(
      uploadFileAsAsset(pngFile(), broken as StorageProvider),
    ).rejects.toThrow("io: 磁盘已满");
  });

  it("mime 缺失时退化为 octet-stream 且仍取到扩展名", async () => {
    const provider = new MemoryStorageProvider();
    const file = new File([new Uint8Array([9]) as unknown as BlobPart], "no-mime.jpg");
    const ref = await uploadFileAsAsset(file, provider);
    expect(ref.endsWith(".jpg")).toBe(true);
  });
});

describe("宿主绑定", () => {
  it("barrel 导出的 ImageUpload 即平台绑定版（显式导出遮蔽 * 重导出）", () => {
    expect(ImageUpload).toBe(PlatformImageUpload);
  });

  it("注入 upload 与 resolve；调用方显式传入时以调用方为准", () => {
    const el = PlatformImageUpload({ value: "", onChange: () => {} }) as {
      props: { upload?: unknown; resolve?: unknown };
    };
    expect(el.props.upload).toBe(uploadFileAsAsset);
    expect(typeof el.props.resolve).toBe("function");

    const custom = () => Promise.resolve("/x.png");
    const overridden = PlatformImageUpload({
      value: "",
      onChange: () => {},
      upload: custom,
    }) as { props: { upload?: unknown } };
    expect(overridden.props.upload).toBe(custom);
  });

  it("浏览器态（未登记本地根目录）assets 引用解析为空 → 组件显示占位而非坏链", async () => {
    const { assetDisplayUrl, setLocalAssetRoot } = await import("./assetContext");
    setLocalAssetRoot(null);
    expect(assetDisplayUrl("assets/ab.png")).toBe("");
    expect(assetDisplayUrl("/uploads/ab.png")).toBe("/uploads/ab.png");
  });
});
