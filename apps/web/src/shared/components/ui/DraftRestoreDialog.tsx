import { draftManager } from "@/shared/lib/draftManager";
import { FileText } from "lucide-react";
import { Modal, ModalActions } from "@/shared/components/ui";

interface DraftRestoreDialogProps {
  isOpen: boolean;
  onRestore: (draftId: string) => void;
  onDiscard: () => void;
}

export default function DraftRestoreDialog({
  isOpen,
  onRestore,
  onDiscard,
}: DraftRestoreDialogProps) {
  const latestDraft = draftManager.getLatest();

  return (
    <Modal
      open={isOpen}
      onClose={onDiscard}
      title="发现草稿"
      description={
        latestDraft
          ? `「${latestDraft.name}」${
              latestDraft
                ? ` · ${Math.floor((Date.now() - latestDraft.updatedAt) / 60000)} 分钟前`
                : ""
            }`
          : "有一个未完成的角色"
      }
      footer={
        <ModalActions
          onCancel={onDiscard}
          cancelLabel="放弃"
          onConfirm={() => {
            const draft = draftManager.getLatest();
            if (draft) onRestore(draft.id);
          }}
          confirmLabel="恢复草稿"
        />
      }
    >
      <div className="flex justify-center py-2">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-muted text-brand">
          <FileText className="h-6 w-6" strokeWidth={1.75} />
        </div>
      </div>
    </Modal>
  );
}
