import { useState, useEffect } from "react";
import { useRelationPresets, useCreateRelation } from "@/hooks/useRelations";
import { Button } from "@/components/ui";
import CharacterSearchSelect from "./CharacterSearchSelect";
import type { PresetRelation } from "@/types/character";

interface AddRelationDialogProps {
  characterId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function AddRelationDialog({
  characterId,
  isOpen,
  onClose,
}: AddRelationDialogProps) {
  const { data: presets } = useRelationPresets();
  const createRelation = useCreateRelation(characterId);

  const [targetId, setTargetId] = useState("");
  const [targetName, setTargetName] = useState("");
  const [relationName, setRelationName] = useState("");
  const [isCustom, setIsCustom] = useState(false);
  const [isMutual, setIsMutual] = useState(false);
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setTargetId("");
      setTargetName("");
      setRelationName("");
      setIsCustom(false);
      setIsMutual(false);
      setDescription("");
      setError("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectPreset = (preset: PresetRelation) => {
    setRelationName(preset.name);
    setIsMutual(preset.mutual);
    setIsCustom(false);
  };

  const handleSelectCharacter = (id: string, name: string) => {
    setTargetId(id);
    setTargetName(name);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetId || !relationName.trim()) {
      setError("请选择目标角色并设置关系名称");
      return;
    }
    try {
      await createRelation.mutateAsync({
        target_id: targetId,
        relation_name: relationName.trim(),
        relation_type: isCustom ? "custom" : "preset",
        is_mutual: isMutual,
        description: description || undefined,
      });
      onClose();
    } catch {
      setError("添加失败，请重试");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 max-h-[80vh] overflow-y-auto animate-fadeIn">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">添加关系</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 目标角色搜索 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              目标角色
            </label>
            <CharacterSearchSelect
              value={targetId}
              onChange={handleSelectCharacter}
              placeholder="搜索角色名称..."
              excludeId={characterId}
            />
            {targetName && (
              <p className="text-xs text-emerald-600 mt-1">
                已选择：{targetName}
              </p>
            )}
          </div>

          {/* 预设关系 */}
          {presets && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                预设关系
              </label>
              {Object.entries(presets).map(([category, relations]) => (
                <div key={category} className="mb-2">
                  <p className="text-xs text-gray-400 mb-1.5">{category}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {relations.map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => handleSelectPreset(preset)}
                        className={`px-3 py-1.5 text-xs rounded-full border transition-all ${
                          relationName === preset.name && !isCustom
                            ? "bg-blue-500 text-white border-blue-500"
                            : "border-gray-200 text-gray-600 hover:border-gray-300"
                        }`}
                      >
                        {preset.name}
                        {preset.mutual ? " ⇄" : " →"}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 自定义关系名 */}
          <input
            type="text"
            value={relationName}
            onChange={(e) => {
              setRelationName(e.target.value);
              setIsCustom(true);
            }}
            placeholder="或输入自定义关系名"
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
          />

          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={isMutual}
              onChange={(e) => setIsMutual(e.target.checked)}
              className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
            />
            双向关系
          </label>

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="关系描述（可选）"
            rows={2}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none resize-none"
          />

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={onClose} type="button">
              取消
            </Button>
            <Button type="submit" loading={createRelation.isPending}>
              添加关系
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
