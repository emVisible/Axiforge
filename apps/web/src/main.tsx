import React from "react";
import ReactDOM from "react-dom/client";
import App from "./app/App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

/*
 * 桌面壳内存储链路冒烟（DEV + **真壳**才运行；结果写入 console 供日志 grep）。
 * 判据用 `invoke` 是不是函数，而不是 `__TAURI_INTERNALS__` 在不在：后者正是 e2e 的
 * 桌面注入标记（`desktop-http.spec.ts` 的 `DESKTOP_MARKER_INIT` 塞的是空对象），
 * 于是内存宿主里冒烟会当真去调 plugin-fs / plugin-sql，抛出
 * `window.__TAURI_INTERNALS__.invoke is not a function` 的未捕获异常（实测两条），
 * 把被测试的界面自己搞坏——冒烟是壳内诊断，不该在测试宿主里跑。
 */
if (
  import.meta.env.DEV &&
  typeof (window as unknown as Record<string, { invoke?: unknown }>).__TAURI_INTERNALS__
    ?.invoke === "function"
) {
  void import("@/shared/storage/desktopSmoke").then((m) => m.smokeDesktopStorage());
}
