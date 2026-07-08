import { LoadingSpinner } from "@/shared/components/ui";

/** 剪辑 / 剧本 / 结构模式懒加载时的占位 */
export default function StudioModeFallback() {
  return (
    <div className="flex min-h-0 flex-1 items-center justify-center bg-canvas">
      <LoadingSpinner />
    </div>
  );
}
