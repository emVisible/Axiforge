import { useState } from "react";
import type { Character } from "@/types/character";
import { Button } from "@/components/ui";

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

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-fadeIn">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Fork 角色</h3>
        <p className="text-sm text-gray-400 mb-4">
          创建一个基于 "{character.name}" 的副本
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              新角色名称
            </label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={`${character.name} (Fork)`}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
              autoFocus
            />
          </div>

          <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-500 space-y-1">
            <p>✓ 完整的角色设定（六层数据）</p>
            <p>✓ 所有标签</p>
            <p>✓ 可自由修改不影响原角色</p>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={onClose} type="button">
              取消
            </Button>
            <Button type="submit" loading={isForking}>
              确认 Fork
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
