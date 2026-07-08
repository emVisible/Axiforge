import PreviewMonitor from "./PreviewMonitor";
import type { Instruction } from "@axiforge/core";

interface RoleOption {
  characterRefId: string;
  name: string;
  imagePath?: string | null;
}

/**
 * 全屏 Modal 包装 PreviewMonitor（兼容旧入口）。
 */
export default function ScriptPreview({
  script,
  roles,
  onClose,
}: {
  script: Instruction[];
  roles: RoleOption[];
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="h-[min(80vh,520px)] w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
        <PreviewMonitor
          script={script}
          roles={roles}
          embedded
          className="h-full"
          onClose={onClose}
        />
      </div>
    </div>
  );
}
