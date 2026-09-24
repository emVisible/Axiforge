import { useState } from "react";
import { Plus, Package } from "lucide-react";

import { useItems, useCreateItem, useDeleteItem } from "@/shared/hooks/useAssets";
import DiscoverBrowseLink from "@/features/discover/components/DiscoverBrowseLink";
import Shell from "@/shared/components/Shell";
import {
  Badge,
  Button,
  CardGrid,
  EmptyState,
  EntityCard,
  ErrorDisplay,
  FilterChip,
  FilterToolbar,
  Input,
  Modal,
  ModalActions,
  PageHeader,
  Select,
  Textarea,
  WorkflowGuide,
} from "@/shared/components/ui";
import type { AssetItemResponse } from "@/shared/types/asset";
import { getCreatorId } from "@/shared/lib/creatorId";
import { ITEM_WORKFLOW } from "@/shared/lib/workflowSteps";

const ITEM_CATEGORIES = ["日常", "魔幻", "科技", "关键道具"];
const ITEM_RARITIES = ["普通", "稀有", "传说"];

const rarityVariant = (rarity: string) => {
  if (rarity === "传说") return "amber" as const;
  if (rarity === "稀有") return "blue" as const;
  return "default" as const;
};

function ItemCard({
  item,
  onDelete,
}: {
  item: AssetItemResponse;
  onDelete: () => void;
}) {
  return (
    <EntityCard
      to={`/studio/items/${item.id}`}
      title={item.name}
      description={item.description || "暂无描述"}
      onDelete={onDelete}
      meta={
        item.ref_count
          ? `${item.ref_count} 个剧本引用`
          : undefined
      }
      badges={
        <>
          <Badge variant="default" size="sm">
            {item.category}
          </Badge>
          <Badge variant={rarityVariant(item.rarity)} size="sm">
            {item.rarity}
          </Badge>
          {item.mechanism_tags?.slice(0, 2).map((t) => (
            <Badge key={t} variant="amber" size="sm">
              {t}
            </Badge>
          ))}
          <Badge variant={item.is_public ? "emerald" : "default"} size="sm">
            {item.is_public ? "公开" : "私有"}
          </Badge>
          {item.effects.slice(0, 2).map((e) => (
            <Badge key={e} variant="brand" size="sm">
              {e}
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
  category: "日常",
  rarity: "普通",
  is_public: false,
  effects: [] as string[],
  mechanism_tags: [] as string[],
  effectInput: "",
  tagInput: "",
};

export default function ItemsPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [categoryFilter, setCategoryFilter] = useState("");

  const { data: items, isLoading, error } = useItems({ author_id: getCreatorId() });
  const createItem = useCreateItem();
  const deleteItem = useDeleteItem();

  const addEffect = () => {
    const v = form.effectInput.trim();
    if (v && !form.effects.includes(v))
      setForm({ ...form, effects: [...form.effects, v], effectInput: "" });
  };
  const addTag = () => {
    const v = form.tagInput.trim();
    if (v && !form.mechanism_tags.includes(v))
      setForm({
        ...form,
        mechanism_tags: [...form.mechanism_tags, v],
        tagInput: "",
      });
  };

  const handleCreate = () => {
    if (!form.name.trim()) return;
    createItem.mutate({
      name: form.name.trim(),
      description: form.description,
      category: form.category,
      rarity: form.rarity,
      is_public: form.is_public,
      effects: form.effects,
      mechanism_tags: form.mechanism_tags,
    });
    setShowCreate(false);
    setForm(emptyForm);
  };

  const filteredItems = (items || []).filter(
    (item) => !categoryFilter || item.category === categoryFilter,
  );

  return (
    <Shell>
      <PageHeader
        title="道具"
        description="管理物品、装备与特殊机制"
        action={
          <div className="flex items-center gap-2">
            <DiscoverBrowseLink tab="items" />
            <Button
              size="sm"
              icon={<Plus className="h-4 w-4" strokeWidth={1.75} />}
              onClick={() => setShowCreate(true)}
            >
              新建道具
            </Button>
          </div>
        }
      />

      <div className="mb-6" />

      <FilterToolbar className="mb-6">
        <FilterChip
          label="全部"
          active={!categoryFilter}
          onClick={() => setCategoryFilter("")}
        />
        {ITEM_CATEGORIES.map((c) => (
          <FilterChip
            key={c}
            label={c}
            active={categoryFilter === c}
            onClick={() => setCategoryFilter(categoryFilter === c ? "" : c)}
          />
        ))}
      </FilterToolbar>

      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="新建道具"
        size="lg"
        footer={
          <ModalActions
            onCancel={() => setShowCreate(false)}
            onConfirm={handleCreate}
            confirmLabel="创建"
            disabled={!form.name.trim()}
          />
        }
      >
        <div className="space-y-4">
          <Input
            label="名称"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="道具名称"
            autoFocus
          />
          <Textarea
            label="描述"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="道具描述"
            rows={2}
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="mb-1.5 text-xs font-medium text-ink-muted">分类</p>
              <div className="mb-2 flex flex-wrap gap-1">
                {ITEM_CATEGORIES.map((c) => (
                  <FilterChip
                    key={c}
                    label={c}
                    active={form.category === c}
                    onClick={() => setForm({ ...form, category: c })}
                  />
                ))}
              </div>
              <Select
                label="或选择分类"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {ITEM_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </div>
            <Select
              label="稀有度"
              value={form.rarity}
              onChange={(e) => setForm({ ...form, rarity: e.target.value })}
            >
              {ITEM_RARITIES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink-muted">
              机制标签
            </label>
            <div className="mb-2 flex gap-2">
              <Input
                value={form.tagInput}
                onChange={(e) => setForm({ ...form, tagInput: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                    e.preventDefault();
                    addTag();
                  }
                }}
                placeholder="如：骰子、好感度、背包"
                className="text-xs"
              />
              <Button type="button" variant="secondary" size="sm" onClick={addTag}>
                添加
              </Button>
            </div>
            <div className="flex flex-wrap gap-1">
              {form.mechanism_tags.map((t) => (
                <Badge
                  key={t}
                  variant="amber"
                  size="sm"
                  onRemove={() =>
                    setForm({
                      ...form,
                      mechanism_tags: form.mechanism_tags.filter((x) => x !== t),
                    })
                  }
                >
                  {t}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink-muted">
              效果标签
            </label>
            <div className="mb-2 flex gap-2">
              <Input
                value={form.effectInput}
                onChange={(e) =>
                  setForm({ ...form, effectInput: e.target.value })
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                    e.preventDefault();
                    addEffect();
                  }
                }}
                placeholder="如：治疗、伤害、解锁"
                className="text-xs"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={addEffect}
              >
                添加
              </Button>
            </div>
            <div className="flex flex-wrap gap-1">
              {form.effects.map((e) => (
                <Badge
                  key={e}
                  variant="brand"
                  size="sm"
                  onRemove={() =>
                    setForm({
                      ...form,
                      effects: form.effects.filter((x) => x !== e),
                    })
                  }
                >
                  {e}
                </Badge>
              ))}
            </div>
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-muted">
            <input
              type="checkbox"
              checked={form.is_public}
              onChange={(e) => setForm({ ...form, is_public: e.target.checked })}
              className="rounded border-border text-brand focus:ring-brand/20"
            />
            公开到 Discover
          </label>
        </div>
      </Modal>

      {isLoading && (
        <p className="py-10 text-center text-sm text-ink-muted">加载中...</p>
      )}
      {error && (
        <ErrorDisplay message="道具清单读取失败" onRetry={() => window.location.reload()} />
      )}
      {!isLoading && !error && !filteredItems.length && (
        <EmptyState
          icon={Package}
          title={categoryFilter ? "该分类下暂无道具" : "还没有道具"}
          description="创建第一个道具"
        >
          {!categoryFilter && (
            <WorkflowGuide steps={ITEM_WORKFLOW} compact className="max-w-2xl" />
          )}
        </EmptyState>
      )}
      {filteredItems.length > 0 && (
        <CardGrid>
          {filteredItems.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              onDelete={() => {
                if (confirm("删除？")) deleteItem.mutate(item.id);
              }}
            />
          ))}
        </CardGrid>
      )}
    </Shell>
  );
}
