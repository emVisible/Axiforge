import { describe, expect, it, vi } from "vitest";
import { shouldRunDesktopSmoke } from "./shellSmokeGate";

vi.mock("@tauri-apps/api/core", () => ({ invoke: () => Promise.resolve([]) }));

const SHELL_WINDOW = { __TAURI_INTERNALS__: { invoke: () => Promise.resolve([]) } };
/** e2e 桌面态注入的形状：全局标记在，但没有可调用的 invoke */
const INJECTED_WINDOW = { __TAURI_INTERNALS__: {} };

describe("shouldRunDesktopSmoke", () => {
  it("真壳 + DEV ⇒ 跑冒烟", () => {
    expect(shouldRunDesktopSmoke({ dev: true }, SHELL_WINDOW)).toBe(true);
  });

  it("e2e 注入的空标记 ⇒ 不跑（否则冒烟在测试宿主里抛未捕获异常搞坏被测界面）", () => {
    expect(shouldRunDesktopSmoke({ dev: true }, INJECTED_WINDOW)).toBe(false);
  });

  it("生产构建即使成真壳也不跑（冒烟是 DEV 诊断）", () => {
    expect(shouldRunDesktopSmoke({ dev: false }, SHELL_WINDOW)).toBe(false);
  });

  it("非桌面环境（没有该全局 / host 为 undefined 或 null）⇒ 不跑，也不抛", () => {
    expect(shouldRunDesktopSmoke({ dev: true }, {})).toBe(false);
    expect(shouldRunDesktopSmoke({ dev: true }, undefined)).toBe(false);
    expect(shouldRunDesktopSmoke({ dev: true }, null)).toBe(false);
    expect(shouldRunDesktopSmoke(undefined, SHELL_WINDOW)).toBe(false);
  });

  it("invoke 存在但不可调用 ⇒ 不跑（判据取的是可调用性，不是存在性）", () => {
    expect(shouldRunDesktopSmoke({ dev: true }, { __TAURI_INTERNALS__: { invoke: {} } })).toBe(false);
    expect(shouldRunDesktopSmoke({ dev: true }, { __TAURI_INTERNALS__: { invoke: null } })).toBe(false);
  });

  it("与 isTauriEnvironment 的语义差必须留着：同一个注入形状它判真、本谓词判假", async () => {
    const { isTauriEnvironment } = await import("./tauriSqlBackend");
    vi.stubGlobal("window", INJECTED_WINDOW);
    const inTestHost = isTauriEnvironment();
    vi.unstubAllGlobals();
    expect(inTestHost).toBe(true);
    expect(shouldRunDesktopSmoke({ dev: true }, INJECTED_WINDOW)).toBe(false);
  });
});
