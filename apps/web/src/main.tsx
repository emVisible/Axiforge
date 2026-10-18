import React from "react";
import ReactDOM from "react-dom/client";
import App from "./app/App";
import "./index.css";
import { shouldRunDesktopSmoke } from "@/shared/storage/shellSmokeGate";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

/*
 * 桌面壳内存储链路冒烟（DEV + **真壳**才运行；结果写入 console 供日志 grep）。
 * 判据抽在 shellSmokeGate 里（那里有它自己的单测）：它要的是 `invoke` 可调用，
 * 而不是 `__TAURI_INTERNALS__` 存在——后者正是 e2e 桌面态的注入标记，
 * 用它当真会让我们在测试宿主里抛未捕获异常、搞坏被测试的界面自己。
 */
if (shouldRunDesktopSmoke({ dev: import.meta.env.DEV }, window)) {
  void import("@/shared/storage/desktopSmoke").then((m) => m.smokeDesktopStorage());
}
