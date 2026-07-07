import { useState } from "react";
import { MapPin, Plus } from "lucide-react";

import {
  useSceneAssets,
  useCreateSceneAsset,
  SCENE_ASSET_KEYS,
} from "@/hooks/useAssets";
import { useQueryClient } from "@tanstack/react-query";
import Shell from "@/components/Shell";
import {
  Badge,
  Button,
  CardGrid,
  EmptyState,
  EntityCard,
  Input,
  Modal,
  ModalActions,
  PageHeader,
  SegmentedControl,
  Textarea,
} from "@/components/ui";
import type { AssetSceneResponse } from "@/types/asset";
import { getCreatorId } from "@/lib/creatorId";

function SceneCard({
  scene,
  onDelete,
}: {
  scene: AssetSceneResponse;
  onDelete: () => void;
}) {
  const meta = [
    scene.location && `地点 · ${scene.location}`,
    scene.era && `时代 · ${scene.era}`,
    scene.atmosphere && `氛围 · ${scene.atmosphere}`,
  ]
    .filter(Boolean)
    .join("  ");

  return (
    <EntityCard
      to={`/studio/scenes/${scene.id}`}
      title={scene.name}
      description={scene.description || scene.world_setting || "暂无描述"}
      onDelete={onDelete}
      meta={meta || undefined}
      badges={
        <>
          <Badge variant={scene.is_public ? "emerald" : "default"} size="sm">
            {scene.is_public ? "公开" : "私有"}
          </Badge>
          {scene.tags.slice(0, 3).map((t) => (
            <Badge key={t} variant="brand" size="sm">
              {t}
            </Badge>
          ))}
        </>
      }
    />
  );
}

const emptyForm = {
  name: "",
  description: "",
  location: "",
  atmosphere: "",
  era: "",
  world_setting: "",
  rules: "",
  tagInput: "",
  is_public: false,
  tags: [] as string[],
};

export default function SceneAssetsPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [tab, setTab] = useState<"my" | "public">("public");
  const [form, setForm] = useState(emptyForm);

  const { data: scenes, isLoading } = useSceneAssets(
    tab === "my" ? { author_id: getCreatorId() } : undefined,
  );
  const createScene = useCreateSceneAsset();
  const qc = useQueryClient();

  const addTag = () => {
    const t = form.tagInput.trim();
    if (t && !form.tags.includes(t)) {
      setForm({ ...form, tags: [...form.tags, t], tagInput: "" });
    }
  };

  const handleCreate = () => {
    if (!form.name.trim()) return;
    createScene.mutate(
      {
        name: form.name.trim(),
        description: form.description,
        location: form.location || undefined,
        atmosphere: form.atmosphere || undefined,
        era: form.era || undefined,
        world_setting: form.world_setting || undefined,
        rules: form.rules || undefined,
        tags: form.tags,
      },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: SCENE_ASSET_KEYS.all });
          setShowCreate(false);
          setForm({ ...emptyForm, is_public: form.is_public });
        },
      },
    );
  };

  const handleDelete = async (id: string) => {
    const { sceneAssetApi } = await import("@/api/editor");
    await sceneAssetApi.delete(id);
    qc.invalidateQueries({ queryKey: SCENE_ASSET_KEYS.all });
  };

  return (
    <Shell>
      <PageHeader
        title="场景"
        description="世界观、地理与舞台设定"
        action={
          <Button
            size="sm"
            icon={<Plus className="h-4 w-4" strokeWidth={1.75} />}
            onClick={() => setShowCreate(true)}
          >
            新建场景
          </Button>
        }
      />

      <div className="mb-6">
        <SegmentedControl
          value={tab}
          onChange={setTab}
          options={[
            { value: "public", label: "大厅" },
            { value: "my", label: "我的" },
          ]}
        />
      </div>

      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="新建场景"
        size="lg"
        footer={
          <ModalActions
            onCancel={() => setShowCreate(false)}
            onConfirm={handleCreate}
            confirmLabel={createScene.isPending ? "创建中..." : "创建"}
            loading={createScene.isPending}
            disabled={!form.name.trim()}
          />
        }
      >
        <div className="space-y-4">
          <Input
            label="名称"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="场景名称"
            autoFocus
          />
          <Textarea
            label="描述"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="场景描述"
            rows={3}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="地点"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="如：京都、太空站"
            />
            <Input
              label="时代"
              value={form.era}
              onChange={(e) => setForm({ ...form, era: e.target.value })}
              placeholder="如：现代、中世纪"
            />
          </div>
          <Input
            label="氛围"
            value={form.atmosphere}
            onChange={(e) => setForm({ ...form, atmosphere: e.target.value })}
            placeholder="阴森、温暖、肃杀..."
          />
          <Input
            label="世界观"
            value={form.world_setting}
            onChange={(e) =>
              setForm({ ...form, world_setting: e.target.value })
            }
            placeholder="所属世界观"
          />
          <Input
            label="规则"
            value={form.rules}
            onChange={(e) => setForm({ ...form, rules: e.target.value })}
            placeholder="场景特殊规则"
          />
          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink-muted">
              标签
            </label>
            <div className="mb-2 flex gap-2">
              <Input
                value={form.tagInput}
                onChange={(e) => setForm({ ...form, tagInput: e.target.value })}
                onKeyDown={(e) =>
                  e.key === "Enter" && (e.preventDefault(), addTag())
                }
                placeholder="添加标签"
              />
              <Button type="button" variant="secondary" size="sm" onClick={addTag}>
                添加
              </Button>
            </div>
            <div className="flex flex-wrap gap-1">
              {form.tags.map((t) => (
                <Badge
                  key={t}
                  variant="brand"
                  size="sm"
                  onRemove={() =>
                    setForm({
                      ...form,
                      tags: form.tags.filter((x) => x !== t),
                    })
                  }
                >
                  {t}
                </Badge>
              ))}
            </div>
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-muted">
            <input
              type="checkbox"
              checked={form.is_public}
              onChange={(e) =>
                setForm({ ...form, is_public: e.target.checked })
              }
              className="rounded border-border text-brand focus:ring-brand/20"
            />
            公开到大厅
          </label>
        </div>
      </Modal>

      {isLoading && (
        <p className="py-10 text-center text-sm text-ink-muted">加载中...</p>
      )}
      {!isLoading && !scenes?.length && (
        <EmptyState
          icon={MapPin}
          title="还没有场景"
          description="创建第一个场景模板"
        />
      )}
      {scenes && scenes.length > 0 && (
        <CardGrid>
          {scenes.map((s) => (
            <SceneCard
              key={s.id}
              scene={s}
              onDelete={() => {
                if (confirm("删除？")) handleDelete(s.id);
              }}
            />
          ))}
        </CardGrid>
      )}
    </Shell>
  );
}
