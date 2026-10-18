/**
 * @axiforge/editor-core —— 编辑器内核（L2 文档模型 + L3 投影 + L4 存取契约）。
 * 契约见 docs/KERNEL_DESIGN.md；术语表见本包 README.md。
 */

export * from "./types";
export * from "./document";
export * from "./axsImport";
export * from "./journal";
export * from "./projection/axs";
export * from "./projection/canvas";
export * from "./storage/types";
export * from "./storage/assets";
export * from "./storage/visibility";
export * from "./storage/memory";
export * from "./storage/sqlite/backend";
export * from "./storage/sqlite/sqliteProvider";
export * from "./axsp";
