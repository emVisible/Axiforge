import { draftManager } from "@/lib/draftManager";
import { FileText } from "lucide-react";
import { Button } from "@axiforge/ui";

interface DraftRestoreDialogProps {
  isOpen: boolean;
  onRestore: (draftId: string) => void;
  onDiscard: () => void;
}

export default function DraftRestoreDialog({ isOpen, onRestore, onDiscard }: DraftRestoreDialogProps) {
  if (!isOpen) return null;

  const latestDraft = draftManager.getLatest();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onDiscard} />
      <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-fadeIn">
        <div className="text-center mb-6">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-muted text-brand">
            <FileText className="h-6 w-6" strokeWidth={1.75} />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">发现草稿</h2>
          <p className="text-gray-500 text-sm">
            {latestDraft ? `「${latestDraft.name}」` : '有一个未完成的角色'}
          </p>
          <p className="text-gray-400 text-xs mt-1">
            {latestDraft && `${Math.floor((Date.now() - latestDraft.updatedAt) / 60000)} 分钟前的草稿`}
          </p>
        </div>

        <div className="flex gap-3">
          <Button variant="ghost" onClick={onDiscard} className="flex-1">
            放弃
          </Button>
          <Button onClick={() => {
            const draft = draftManager.getLatest();
            if (draft) onRestore(draft.id);
          }} className="flex-1">
            恢复草稿
          </Button>
        </div>
      </div>
    </div>
  );
}