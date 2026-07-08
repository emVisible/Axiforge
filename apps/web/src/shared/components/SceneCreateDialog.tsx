
import { useState } from "react";
import type { AssetSceneCreate } from "@/shared/types/asset";
import { Button, Input, Modal, ModalActions, Textarea } from "@/shared/components/ui";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: AssetSceneCreate) => void;
  loading?: boolean;
}

export default function SceneCreateDialog({
  isOpen,
  onClose,
  onCreate,
  loading,
}: Props) {
  const [form, setForm] = useState({
    name: "",
    description: "",
    location: "",
    atmosphere: "",
    era: "",
    world_setting: "",
    rules: "",
    tagInput: "",
    tags: [] as string[],
  });

  const addTag = () => {
    const t = form.tagInput.trim();
    if (t && !form.tags.includes(t))
      setForm({ ...form, tags: [...form.tags, t], tagInput: "" });
  };

  const handleSubmit = () => {
    if (!form.name.trim()) return;
    onCreate({
      name: form.name.trim(),
      description: form.description,
      location: form.location || undefined,
      atmosphere: form.atmosphere || undefined,
      era: form.era || undefined,
      world_setting: form.world_setting || undefined,
      rules: form.rules || undefined,
      tags: form.tags,
    });
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="新建场景"
      size="lg"
      footer={
        <ModalActions
          onCancel={onClose}
          onConfirm={handleSubmit}
          confirmLabel={loading ? "创建中..." : "创建"}
          loading={loading}
          disabled={!form.name.trim()}
        />
      }
    >
      <div className="max-h-[60vh] space-y-3 overflow-y-auto">
        <Input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="场景名称"
        />
        <Textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="场景描述"
          rows={3}
        />
        <div className="grid grid-cols-2 gap-2">
          <Input
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            placeholder="地点"
          />
          <Input
            value={form.era}
            onChange={(e) => setForm({ ...form, era: e.target.value })}
            placeholder="时代"
          />
        </div>
        <Input
          value={form.atmosphere}
          onChange={(e) => setForm({ ...form, atmosphere: e.target.value })}
          placeholder="氛围（如：阴森、温暖、肃杀）"
        />
        <Input
          value={form.world_setting}
          onChange={(e) =>
            setForm({ ...form, world_setting: e.target.value })
          }
          placeholder="所属世界观"
        />
        <Input
          value={form.rules}
          onChange={(e) => setForm({ ...form, rules: e.target.value })}
          placeholder="场景规则"
        />
        <div>
          <div className="mb-1 flex gap-2">
            <Input
              value={form.tagInput}
              onChange={(e) => setForm({ ...form, tagInput: e.target.value })}
              onKeyDown={(e) =>
                e.key === "Enter" && (e.preventDefault(), addTag())
              }
              placeholder="添加标签"
              className="text-xs"
            />
            <Button type="button" variant="secondary" size="sm" onClick={addTag}>
              添加
            </Button>
          </div>
          <div className="flex flex-wrap gap-1">
            {form.tags.map((t) => (
              <span
                key={t}
                className="flex items-center gap-1 rounded-full bg-brand-muted px-2 py-0.5 text-xs text-brand"
              >
                {t}
                <button
                  type="button"
                  onClick={() =>
                    setForm({
                      ...form,
                      tags: form.tags.filter((x) => x !== t),
                    })
                  }
                  className="hover:text-red-500"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
