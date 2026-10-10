import { describe, expect, it, vi } from "vitest";
import { clipboardDeps, copyText } from "./clipboard";

/**
 * 桌面是唯一发布目标，而剪贴板在壳里／无权限时**必然可能失败**。
 * 这一档钉的是「失败会不会被说成成功」——原先三处调用点连 catch 都没有，
 * 另两处 `execCommand` 兜底把返回值丢了（false 也算复制成）。
 *
 * 桩的是 `clipboardDeps` 这个平台分派口（本仓单测宿主是 node，没有 `document`/`navigator`），
 * 四条各守一支：正路／reject 后兜底成功／兜底返回 false／兜底自己抛。
 */

function withDeps(write: (t: string) => Promise<void>, legacy: (t: string) => boolean) {
  const prevWrite = clipboardDeps.write;
  const prevLegacy = clipboardDeps.legacyCopy;
  clipboardDeps.write = write;
  clipboardDeps.legacyCopy = legacy;
  return () => {
    clipboardDeps.write = prevWrite;
    clipboardDeps.legacyCopy = prevLegacy;
  };
}

const reject = () => Promise.reject(new Error("NotAllowedError"));
const ok = () => Promise.resolve();

describe("copyText", () => {
  it("剪贴板可用时走正路，且根本不该碰退回支", async () => {
    const legacy = vi.fn(() => true);
    const restore = withDeps(ok, legacy);
    expect(await copyText("甲")).toBe("copied");
    expect(legacy).not.toHaveBeenCalled();
    restore();
  });

  it("被拒时退回 execCommand，且返回 true 才算 copied", async () => {
    const restore = withDeps(reject, () => true);
    expect(await copyText("乙")).toBe("copied");
    restore();
  });

  it("execCommand 返回 false ⇒ manual：不许把「没复制成」报成 copied", async () => {
    const restore = withDeps(reject, () => false);
    expect(await copyText("丙")).toBe("manual");
    restore();
  });

  it("退回支自己抛（壳里连 execCommand 都没有）⇒ manual 而不是把异常抛给界面", async () => {
    const restore = withDeps(reject, () => {
      throw new Error("no document");
    });
    expect(await copyText("丁")).toBe("manual");
    restore();
  });
});
