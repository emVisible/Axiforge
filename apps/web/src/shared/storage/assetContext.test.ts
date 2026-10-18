import { describe, expect, it, vi } from "vitest";
import { assetDisplayUrl, getLocalAssetRoot, setLocalAssetRoot } from "./assetContext";

/**
 * 素材显示解析（`assetContext`）的判据。
 *
 * 这个模块的全部职责是把内核的 ref 词汇接成**当前环境里真能显示的 URL**：
 * 桌面走 asset 协议（`convertFileSrc`），浏览器态没有根目录就只能给空串（调用方渲染缺图态）。
 * 它出错的方式不是崩溃而是"图不出现"——用户看到的是立绘框空着，而没有任何错误可查。
 * 所以这里钉的是三件事：根目录有没有被接进绝对路径、没有根目录时是否老实给空串、
 * 以及**越界 ref 不许被拼成路径**（`assets/../../x` 在桌面会被壳层 scope 挡，但不该走到那一步）。
 */

const convertFileSrcMock = vi.hoisted(() => vi.fn((abs: string) => `asset://localhost/${abs}`));

vi.mock("@tauri-apps/api/core", () => ({
  convertFileSrc: (abs: string) => convertFileSrcMock(abs),
}));

describe("assetDisplayUrl 的三种归属", () => {
  it("桌面：本地 ref 拼上登记的根目录，再交给 asset 协议", () => {
    setLocalAssetRoot("/Users/x/Documents/Axiforge");
    const url = assetDisplayUrl("assets/ab12.png");

    expect(convertFileSrcMock).toHaveBeenCalledWith("/Users/x/Documents/Axiforge/assets/ab12.png");
    expect(url).toBe("asset://localhost//Users/x/Documents/Axiforge/assets/ab12.png");
    expect(getLocalAssetRoot()).toBe("/Users/x/Documents/Axiforge");
  });

  it("浏览器态（没有根目录）：本地 ref 给空串，不去拼半截路径", () => {
    setLocalAssetRoot(null);
    convertFileSrcMock.mockClear();

    expect(assetDisplayUrl("assets/ab12.png")).toBe("");
    expect(convertFileSrcMock).not.toHaveBeenCalled();
  });

  it("越界 ref 既不给 asset 协议也不给原串：一律空串", () => {
    setLocalAssetRoot("/Users/x/Documents/Axiforge");

    expect(assetDisplayUrl("assets/../../etc/passwd")).toBe("");
  });

  it("可直接显示的 ref 原样透传（http / data / 老版 /uploads）", () => {
    setLocalAssetRoot(null);

    expect(assetDisplayUrl("https://cdn.example.com/a.png")).toBe("https://cdn.example.com/a.png");
    expect(assetDisplayUrl("/uploads/characters/x.jpg")).toBe("/uploads/characters/x.jpg");
  });

  it("空引用给空串而不是抛错（null / undefined / 空白都算）", () => {
    setLocalAssetRoot("/Users/x/Documents/Axiforge");

    expect(assetDisplayUrl(null)).toBe("");
    expect(assetDisplayUrl(undefined)).toBe("");
    expect(assetDisplayUrl("   ")).toBe("");
  });
});
