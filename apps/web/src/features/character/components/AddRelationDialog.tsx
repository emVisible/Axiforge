import { useState, useEffect } from "react";
import { useRelationPresets, useCreateRelation } from "@/shared/hooks/useRelations";
import {
  CheckboxField,
  Input,
  Modal,
  ModalActions,
  Textarea,
} from "@/shared/components/ui";
import CharacterSearchSelect from "./CharacterSearchSelect";
import type { PresetRelation } from "@/shared/types/character";

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

  const handleSelectPreset = (preset: PresetRelation) => {
    setRelationName(preset.name);
    setIsMutual(preset.mutual);
    setIsCustom(false);
  };

  const handleSelectCharacter = (id: string, name: string) => {
    setTargetId(id);
    setTargetName(name);
  };

  const handleConfirm = async () => {
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
    <Modal
      open={isOpen}
      onClose={onClose}
      title="添加关系"
      size="lg"
      footer={
        <ModalActions
          onCancel={onClose}
          onConfirm={() => void handleConfirm()}
          confirmLabel="添加关系"
          loading={createRelation.isPending}
        />
      }
    >
      <div className="space-y-4 max-h-[60vh] overflow-y-auto">
        <div>
          <p className="mb-1.5 text-xs font-medium text-ink-muted">目标角色</p>
          <CharacterSearchSelect
            value={targetId}
            onChange={handleSelectCharacter}
            placeholder="搜索角色名称..."
            excludeId={characterId}
          />
          {targetName && (
            <p className="mt-1 text-xs text-emerald-600">已选择：{targetName}</p>
          )}
        </div>

        {presets && (
          <div>
            <p className="mb-2 text-sm font-medium text-ink">预设关系</p>
            {Object.entries(presets).map(([category, relations]) => (
              <div key={category} className="mb-2">
                <p className="mb-1.5 text-xs text-ink-muted">{category}</p>
                <div className="flex flex-wrap gap-1.5">
                  {relations.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
                      className={`rounded-full border px-3 py-1.5 text-xs transition-all ${
                        relationName === preset.name && !isCustom
                          ? "border-brand bg-brand text-white"
                          : "border-border text-ink-muted hover:border-border"
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

        <Input
          value={relationName}
          onChange={(e) => {
            setRelationName(e.target.value);
            setIsCustom(true);
          }}
          placeholder="或输入自定义关系名"
        />

        <CheckboxField
          checked={isMutual}
          onChange={setIsMutual}
          label="双向关系"
        />

        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="关系描述（可选）"
          rows={2}
        />

        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    </Modal>
  );
}
