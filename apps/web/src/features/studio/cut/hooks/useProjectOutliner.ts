import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { projectApi, sceneAssetApi } from "@/shared/api/editor";
import { getStorageProvider } from "@/shared/storage";
import { readItem } from "@/shared/storage/assetPoolSaves";
import { PROJECT_KEYS } from "@/shared/hooks/useProjects";

/**
 * 剪辑台侧栏的写操作。舞台与角色的增删走 L4 Provider（桌面=SQLite，浏览器=HTTP 实现），
 * 道具引用仍直连 HTTP——本地既没有 project_asset_refs 表，bundle 读回的
 * `asset_refs` 又恒为 []，只补写不补读会让加进去的道具在下次刷新时凭空消失。
 */
export function useProjectOutliner(projectId: string) {
  const qc = useQueryClient();
  const refresh = useCallback(
    () => qc.invalidateQueries({ queryKey: PROJECT_KEYS.detail(projectId) }),
    [qc, projectId],
  );

  const addScene = useCallback(
    async (title: string) => {
      const p = await getStorageProvider();
      const r = await p.addProjectScene(projectId, { title });
      if (!r.ok) throw new Error(`新建舞台失败：${r.error.code}`);
      await refresh();
    },
    [projectId, refresh],
  );

  const deleteScene = useCallback(
    async (sceneId: string) => {
      const p = await getStorageProvider();
      const r = await p.removeProjectScene(projectId, sceneId);
      if (!r.ok) throw new Error(`删除舞台失败：${r.error.code}`);
      await refresh();
    },
    [projectId, refresh],
  );

  const addRole = useCallback(
    async (characterId: string, _name: string) => {
      // 走 L4 契约而不是 projectApi：桌面拿到的 provider 是 SQLite 实现，
      // 浏览器拿到的是 HttpStorageProvider——两端各自的 addRole 早就写好了，
      // 缺的只是这一处调用方没接上。
      const p = await getStorageProvider();
      const r = await p.addRole(projectId, { characterRefId: characterId });
      if (!r.ok) throw new Error(`角色加入失败：${r.error.code}`);
      await refresh();
    },
    [projectId, refresh],
  );

  const removeRole = useCallback(
    async (roleId: string) => {
      const p = await getStorageProvider();
      const r = await p.removeRole(projectId, roleId);
      if (!r.ok) throw new Error(`角色移出失败：${r.error.code}`);
      await refresh();
    },
    [projectId, refresh],
  );

  const addItemRef = useCallback(
    async (itemId: string) => {
      await projectApi.addAssetRef(projectId, {
        asset_type: "item",
        asset_id: itemId,
      });
      await refresh();
    },
    [projectId, refresh],
  );

  const removeItemRef = useCallback(
    async (refId: string) => {
      await projectApi.removeAssetRef(projectId, refId);
      await refresh();
    },
    [projectId, refresh],
  );

  const importSceneAsset = useCallback(
    async (assetId: string) => {
      const asset = await sceneAssetApi.get(assetId);
      await projectApi.addScene(projectId, {
        title: asset.name,
        source: "reference",
        scene_ref_id: assetId,
        description: asset.description,
        location: asset.location,
        atmosphere: asset.atmosphere,
      });
      await refresh();
    },
    [projectId, refresh],
  );

  const resolveItemName = useCallback(async (itemId: string) => {
    try {
      const item = await readItem(itemId);
      return item.name;
    } catch {
      return `道具 ${itemId.slice(0, 6)}`;
    }
  }, []);

  return {
    refresh,
    addScene,
    deleteScene,
    addRole,
    removeRole,
    addItemRef,
    removeItemRef,
    importSceneAsset,
    resolveItemName,
  };
}
