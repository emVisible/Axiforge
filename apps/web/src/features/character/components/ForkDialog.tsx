import { useState } from "react";
import type { Character } from "@/shared/types/character";
import { Input, Modal, ModalActions } from "@/shared/components/ui";

interface ForkDialogProps {
  character: Character;
  isOpen: boolean;
  onClose: () => void;
  onFork: (newName: string) => Promise<void>;
  isForking: boolean;
}

export default function ForkDialog({
  character,
  isOpen,
  onClose,
  onFork,
  isForking,
}: ForkDialogProps) {
  const [newName, setNewName] = useState("");
  const [error, setError] = useState("");

  const handleConfirm = async () => {
    setError("");
    try {
      await onFork(newName.trim() || `${character.name} (Fork)`);
      setNewName("");
      onClose();
    } catch {
      setError("Fork 失败，请重试");
    }
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="Fork 角色"
      description={`创建一个基于「${character.name}」的副本`}
      footer={
        <ModalActions
          onCancel={onClose}
          onConfirm={() => void handleConfirm()}
          confirmLabel="确认 Fork"
          loading={isForking}
        />
      }
    >
      <div className="space-y-4">
        <Input
          label="新角色名称"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder={`${character.name} (Fork)`}
          autoFocus
        />
        <div className="rounded-xl bg-canvas p-4 text-sm text-ink-muted space-y-1">
          <p>✓ 完整的角色设定（六层数据）</p>
          <p>✓ 所有标签</p>
          <p>✓ 可自由修改不影响原角色</p>
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    </Modal>
  );
}
