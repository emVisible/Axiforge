/**
 * 存储态 → 传输态的投影（道具 / 场景）。
 *
 * 存在的理由：页面组件消费的是 REST 响应形状，而本地 Provider 只给存储态；
 * 这层映射若散进 hooks，桌面与浏览器会各自演化出两套字段口径。
 *
 * 已知缺席字段，如实标注而非编造：
 * - ref_count：本地未做 ProjectAssetRef 计数，留空 → 页面「N 个剧本引用」角标自行隐藏
 * - view_count：本地不统计浏览
 * - created_at：本地资产池只记一个时间戳，故等于 updated_at（两页均未展示该字段）
 */

import type { AssetItemResponse, AssetSceneResponse } from "@/shared/types/asset";
import type { StoredAssetItem, StoredAssetScene } from "@axiforge/editor-core";

export function storedItemToResponse(i: StoredAssetItem): AssetItemResponse {
  return {
    id: i.id,
    name: i.name,
    description: i.description,
    category: i.category,
    rarity: i.rarity,
    effects: [...i.effects],
    mechanism_tags: [...i.mechanismTags],
    image_path: i.imagePath,
    author_id: i.authorId ?? "",
    is_public: i.isPublic,
    view_count: 0,
    created_at: i.updatedAt,
    updated_at: i.updatedAt,
  };
}

export function storedSceneToResponse(s: StoredAssetScene): AssetSceneResponse {
  return {
    id: s.id,
    name: s.name,
    description: s.description,
    location: s.location,
    atmosphere: s.atmosphere,
    era: s.era,
    world_setting: s.worldSetting,
    rules: s.rules,
    tags: [...s.tags],
    node_templates: [...s.nodeTemplates],
    image_path: s.imagePath,
    author_id: s.authorId ?? "",
    is_public: s.isPublic,
    view_count: 0,
    ref_count: undefined,
    fork_from_id: null,
    created_at: s.updatedAt,
    updated_at: s.updatedAt,
  };
}
