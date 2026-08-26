import React from "react";
import ReactDOM from "react-dom/client";
import App from "./app/App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// 桌面壳内存储链路冒烟（DEV + Tauri 才运行；结果写入 console 供日志 grep）
if (import.meta.env.DEV && "__TAURI_INTERNALS__" in window) {
  void import("@/shared/storage/desktopSmoke").then((m) => m.smokeDesktopStorage());
}
