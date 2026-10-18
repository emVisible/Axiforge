/**
 * 存储态工程束 → 编译器输入（桌面断网试玩链路的投影层）。
 *
 * 从 index.ts 外提的直接原因是 G1 的 400 行棘轮；另一半理由是这块的读者只想问
 * "编译时场景/道具/角色怎么落到 IR"，不必连着 Provider 的构造与 .axsp 打包一起读。
 */

import type { ProjectBundle } from "@axiforge/editor-core";
import type { CompilerProjectInput } from "@axiforge/core";

/**
 * 存储态工程束 + 角色库 → 编译器输入（桌面断网试玩链路）。
 *
 * `sceneAssets` 是资产池那一份（道具场景的 location/atmosphere/imagePath）。
 * 传进来是为了复刻后端 `_build_scenes` 的一次查表：舞台自身的值优先、资产池的值兜底，
 * 背景图只可能来自资产池。缺了它，桌面导入的舞台在试玩里就是没有背景的空白，
 * 而同一条数据在网页端（后端编译）是有的——两端就此分叉。
 *
 * `itemAssets` 是同一条教训的第二处：后端 `_build_items`（`narrative/compiler.py:356`）
 * 把 `project_asset_refs` 里的 item 引用查表成 `ItemRef`，S13-2c 之前这里恒写 `items: []`，
 * 于是编排台挂上的道具在桌面试玩里一个都不出现，而引擎（`packages/core/compiler.ts:308`）
 * 早就在等这一格——它甚至已经实现了「引用悬空就跳过」，与 Python 的 `if not item: continue` 逐字同义。
 * 金样本抓不到这件事：三份示范作的 `items` 全是 0，那条分支两侧都没被走过。
 */
export function bundleToCompilerInput(
  b: ProjectBundle,
  characters: {
    id: string;
    name: string;
    characterData: Record<string, unknown>;
    imagePath?: string | null;
  }[],
  sceneAssets: {
    id: string;
    location?: string | null;
    atmosphere?: string | null;
    imagePath?: string | null;
  }[] = [],
  itemAssets: {
    id: string;
    name: string;
    category?: string | null;
    imagePath?: string | null;
  }[] = [],
): CompilerProjectInput {
  const assetById = new Map(sceneAssets.map((a) => [a.id, a]));
  const itemById = new Map(itemAssets.map((a) => [a.id, a]));
  return {
    id: b.meta.id,
    title: b.meta.title,
    worldSetting: b.meta.worldSetting,
    playMeta: {},
    nodes: b.nodes.map((n) => ({
      id: n.id,
      stageId: n.stageId,
      editorData: n.editorData,
      narrativeData: n.narrativeData,
      sortOrder: n.sortOrder,
    })),
    edges: b.edges.map((e) => ({
      sourceNodeId: e.source,
      targetNodeId: e.target,
      label: e.label,
    })),
    scenes: b.scenes.map((s) => {
      const asset = s.sceneRefId ? assetById.get(s.sceneRefId) : undefined;
      return {
        id: s.id,
        title: s.title,
        location: s.location ?? null,
        atmosphere: s.atmosphere ?? null,
        sceneRef: asset
          ? { location: asset.location ?? null, atmosphere: asset.atmosphere ?? null, imagePath: asset.imagePath ?? null }
          : null,
      };
    }),
    roles: b.roles.map((r) => ({ characterRefId: r.characterRefId })),
    characters: characters.map((c) => ({
      id: c.id,
      name: c.name,
      characterData: c.characterData,
      imagePath: c.imagePath ?? null,
    })),
    items: b.assetRefs
      .filter((r) => r.assetType === "item")
      .map((r) => {
        const asset = itemById.get(r.assetId);
        return {
          id: r.id,
          assetId: r.assetId,
          asset: asset
            ? { id: asset.id, name: asset.name, category: asset.category ?? null, imagePath: asset.imagePath ?? null }
            : null,
        };
      }),
  };
}
