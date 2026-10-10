/**
 * 桌面存储冒烟该不该跑（从 `main.tsx` 抽出来的唯一理由：让这句判据有测试跑到）。
 *
 * 判据是 **DEV + `invoke` 真是函数**，不是 `__TAURI_INTERNALS__` 在不在。
 * 后者是 e2e 桌面态的注入标记（`desktop-http.spec.ts` 的 `DESKTOP_MARKER_INIT` 塞的是空对象），
 * 用它当判据会让冒烟在测试宿主里真去调 plugin-fs / plugin-sql，抛出
 * `window.__TAURI_INTERNALS__.invoke is not a function` 的未捕获异常，把被测界面自己搞坏。
 * 所以这条谓词与 `isTauriEnvironment()` **刻意不同义**，两者的语义差钉在同名测试里，不许"归一"。
 */
export function shouldRunDesktopSmoke(
  env: { dev?: boolean } | undefined,
  host: unknown,
): boolean {
  const internals = (host as { __TAURI_INTERNALS__?: { invoke?: unknown } } | null | undefined)
    ?.__TAURI_INTERNALS__;
  return Boolean(env?.dev) && typeof internals?.invoke === "function";
}
