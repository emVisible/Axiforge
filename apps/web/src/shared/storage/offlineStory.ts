/**
 * 桌面离线试玩编译：本地 Provider 数据 → `StoryPackage`（全程不触网）。
 *
 * 独立成模块的理由与 `compilerInput` 一样：`storage/index.ts` 管的是「工程束 ↔ 传输态 ↔ .axsp 容器」
 * 的装配，而这一条的读者只想问「断网时这台机器上的工程怎么变成可播放的 IR」。
 */

import { compileStory, type StoryPackage } from "@axiforge/core";
import type { StorageProvider, StorageResult } from "@axiforge/editor-core";
import { bundleToCompilerInput } from "./compilerInput";
import { createStorageProvider } from "./index";

/**
 * 三个资产池一律**按引用取**，不是按可见性清单取。后端就是这么做的
 * （`_build_characters` 走 `Character.id.in_(role_ids)`，`_build_items` 走 `asset_id.in_(ids)`），
 * 而本地可见性语义是「我的 ∪ 公开」：不带作用域地 list 会被裁成「只剩公开」，
 * 桌面试玩里私有角色的说话人因此退化成 id、立绘全空。跟后端，不跟清单。
 *
 * `provider` 可注入：node 测试环境没有 `window`，不可注入等于这条链路永不被执行
 * （与 `assetPoolDeps` 同一理由）；缺省仍走平台分派。
 */
export async function loadStoryOffline(
  projectId: string,
  provider?: StorageProvider,
): Promise<StoryPackage> {
  const p = provider ?? (await createStorageProvider());
  const bundle = await p.loadProject(projectId);
  if (!bundle.ok) {
    throw new Error(bundle.error.code === "not_found" ? "404" : bundle.error.detail);
  }
  const roleIds = [...new Set(bundle.data.roles.map((r) => r.characterRefId))];
  const sceneRefIds = [
    ...new Set(
      bundle.data.scenes.map((s) => s.sceneRefId).filter((v): v is string => Boolean(v)),
    ),
  ];
  const itemIds = [
    ...new Set(
      bundle.data.assetRefs
        .filter((r) => r.assetType === "item")
        .map((r) => r.assetId),
    ),
  ];
  const [characters, sceneAssets, itemAssets] = await Promise.all([
    resolvePool(roleIds, (id) => p.getCharacter(id), "角色"),
    resolvePool(sceneRefIds, (id) => p.getScene(id), "场景"),
    resolvePool(itemIds, (id) => p.getItem(id), "道具"),
  ]);
  return compileStory(
    bundleToCompilerInput(bundle.data, characters, sceneAssets, itemAssets),
  );
}

/**
 * 按 id 从池子里取出工程引用到的那几条。
 * `not_found`=引用悬空（道具或舞台本体已被删）→ 如实缺席，与后端 `if not item: continue` 同义；
 * 其他失败=没读到 → 抛出：把 io 演成空清单，试玩就是一片缺角色的空白而界面毫无提示。
 */
async function resolvePool<T>(
  ids: readonly string[],
  read: (id: string) => Promise<StorageResult<T>>,
  what: string,
): Promise<T[]> {
  const results = await Promise.all(ids.map(read));
  const out: T[] = [];
  for (const [i, r] of results.entries()) {
    if (r.ok) out.push(r.data);
    else if (r.error.code !== "not_found") {
      throw new Error(`${what} ${ids[i]} 读取失败：${r.error.code}`);
    }
  }
  return out;
}
