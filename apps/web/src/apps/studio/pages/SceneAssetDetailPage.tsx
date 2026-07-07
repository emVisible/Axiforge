import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { Trash2 } from "lucide-react";

import Shell from "@/components/Shell";
import Toast from "@/components/Toast";
import { sceneAssetApi } from "@/api/editor";
import {
  BackLink,
  Badge,
  Button,
  CheckboxField,
  DetailEditPanel,
  DetailPanel,
  FormActions,
  ImageUpload,
  Input,
  Textarea,
} from "@/components/ui";
import { getImageUrl } from "@/lib/imageUrl";
import type { AssetSceneResponse } from "@/types/asset";

export default function SceneAssetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [scene, setScene] = useState<AssetSceneResponse | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Record<string, any>>({});
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const fetchScene = async () => {
    const data = await sceneAssetApi.get(id!);
    setScene(data);
  };

  useEffect(() => {
    fetchScene();
  }, [id]);

  const showToast = (
    message: string,
    type: "success" | "error" = "success",
  ) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  };

  if (!scene)
    return (
      <Shell>
        <p className="py-20 text-center text-sm text-ink-muted">加载中...</p>
      </Shell>
    );

  const openEdit = () => {
    setForm({
      name: scene.name,
      description: scene.description || "",
      location: scene.location || "",
      atmosphere: scene.atmosphere || "",
      era: scene.era || "",
      world_setting: scene.world_setting || "",
      rules: scene.rules || "",
      image_path: scene.image_path || "",
      is_public: scene.is_public,
    });
    setEditing(true);
  };

  const save = async () => {
    await sceneAssetApi.update(id!, {
      name: form.name,
      description: form.description,
      location: form.location || null,
      atmosphere: form.atmosphere || null,
      era: form.era || null,
      world_setting: form.world_setting || null,
      rules: form.rules || null,
      image_path: form.image_path || null,
      is_public: form.is_public || null,
    });
    await fetchScene();
    setEditing(false);
    showToast("已保存");
  };

  const handleDelete = async () => {
    if (!confirm("删除？")) return;
    await sceneAssetApi.delete(id!);
    navigate("/studio/scenes");
  };

  return (
    <Shell>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="mb-6 flex items-center justify-between">
        <BackLink to="/studio/scenes">场景列表</BackLink>
        <Button
          variant="ghost"
          size="sm"
          className="text-red-500 hover:text-red-600"
          icon={<Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />}
          onClick={handleDelete}
        >
          删除
        </Button>
      </div>

      {editing ? (
        <DetailEditPanel>
          <div>
            <span className="mb-2 block text-xs font-medium uppercase tracking-wider text-ink-muted">
              背景图（演出 bg 与场景背景使用）
            </span>
            <ImageUpload
              value={getImageUrl(form.image_path || undefined) || ""}
              onChange={(u) => setForm((p) => ({ ...p, image_path: u }))}
            />
          </div>
          <Input
            label="名称"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          />
          <Textarea
            label="描述"
            value={form.description}
            onChange={(e) =>
              setForm((p) => ({ ...p, description: e.target.value }))
            }
            rows={3}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="地点"
              value={form.location}
              onChange={(e) =>
                setForm((p) => ({ ...p, location: e.target.value }))
              }
              placeholder="如：京都、太空站"
            />
            <Input
              label="时代"
              value={form.era}
              onChange={(e) => setForm((p) => ({ ...p, era: e.target.value }))}
              placeholder="如：现代、中世纪"
            />
          </div>
          <Input
            label="氛围"
            value={form.atmosphere}
            onChange={(e) =>
              setForm((p) => ({ ...p, atmosphere: e.target.value }))
            }
            placeholder="阴森、温暖、肃杀..."
          />
          <Input
            label="世界观"
            value={form.world_setting}
            onChange={(e) =>
              setForm((p) => ({ ...p, world_setting: e.target.value }))
            }
          />
          <Input
            label="规则"
            value={form.rules}
            onChange={(e) => setForm((p) => ({ ...p, rules: e.target.value }))}
          />
          <CheckboxField
            checked={!!form.is_public}
            onChange={(checked) =>
              setForm((p) => ({ ...p, is_public: checked }))
            }
            label="公开到大厅"
          />
          <FormActions onSave={save} onCancel={() => setEditing(false)} />
        </DetailEditPanel>
      ) : (
        <DetailPanel
          title={scene.name}
          description={scene.description || "暂无描述"}
          onEdit={openEdit}
        >
          {scene.image_path && (
            <img
              src={getImageUrl(scene.image_path) || ""}
              alt={scene.name}
              className="mb-4 h-40 w-full rounded-xl object-cover"
            />
          )}
          <div className="mb-4 grid grid-cols-2 gap-4 text-sm">
            {scene.location && (
              <div>
                <span className="text-xs font-medium uppercase tracking-wider text-ink-muted">
                  地点
                </span>
                <p className="mt-1 text-ink">{scene.location}</p>
              </div>
            )}
            {scene.era && (
              <div>
                <span className="text-xs font-medium uppercase tracking-wider text-ink-muted">
                  时代
                </span>
                <p className="mt-1 text-ink">{scene.era}</p>
              </div>
            )}
            {scene.atmosphere && (
              <div>
                <span className="text-xs font-medium uppercase tracking-wider text-ink-muted">
                  氛围
                </span>
                <p className="mt-1 text-ink">{scene.atmosphere}</p>
              </div>
            )}
          </div>
          {scene.world_setting && (
            <div className="mb-4">
              <span className="text-xs font-medium uppercase tracking-wider text-ink-muted">
                世界观
              </span>
              <p className="mt-1 text-sm text-ink">{scene.world_setting}</p>
            </div>
          )}
          {scene.rules && (
            <div className="mb-4">
              <span className="text-xs font-medium uppercase tracking-wider text-ink-muted">
                规则
              </span>
              <p className="mt-1 text-sm text-ink">{scene.rules}</p>
            </div>
          )}
          <div className="flex flex-wrap gap-1.5">
            <Badge variant={scene.is_public ? "emerald" : "default"} size="sm">
              {scene.is_public ? "公开" : "私有"}
            </Badge>
            {scene.tags.map((t) => (
              <Badge key={t} variant="brand" size="sm">
                {t}
              </Badge>
            ))}
          </div>
        </DetailPanel>
      )}
    </Shell>
  );
}
