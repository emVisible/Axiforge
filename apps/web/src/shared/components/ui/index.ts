export * from "@axiforge/ui";

/**
 * 本目录不是第二套组件库，只做宿主绑定：packages/ui 是唯一权威，
 * 这里新增的都是「需要 React Router / Tauri / DOM 能力」的适配件。
 * 下面这行刻意覆盖 @axiforge/ui 的同名 ImageUpload（网页版走 fetch 上传，
 * 桌面版必须走本地素材口）——显式覆盖而非另取一名，是为了让调用方
 * 始终 `import { ImageUpload }`，不出现两套名字。
 */
export { default as ImageUpload } from "./PlatformImageUpload";
export { default as EntitySearchSelect } from "./EntitySearchSelect";
export type { SelectableItem } from "./EntitySearchSelect";
export { default as DraftRestoreDialog } from "./DraftRestoreDialog";
export { default as DraftIndicator } from "./DraftIndicator";
