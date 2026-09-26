import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { projectApi, sceneAssetApi } from "@/shared/api/editor";
import { readItem } from "@/shared/storage/assetPoolSaves";
import { PROJECT_KEYS } from "@/shared/hooks/useProjects";

export function useProjectOutliner(projectId: string) {
  const qc = useQueryClient();
  const refresh = useCallback(
    () => qc.invalidateQueries({ queryKey: PROJECT_KEYS.detail(projectId) }),
    [qc, projectId],
  );

  const addScene = useCallback(
    async (title: string) => {
      await projectApi.addScene(projectId, { title, source: "inline" });
      await refresh();
    },
    [projectId, refresh],
  );

  const deleteScene = useCallback(
    async (sceneId: string) => {
      await projectApi.deleteScene(projectId, sceneId);
      await refresh();
    },
    [projectId, refresh],
  );

  const addRole = useCallback(
    async (characterId: string, _name: string) => {
      await projectApi.addRole(projectId, {
        character_ref_id: characterId,
        importance: 0,
      });
      await refresh();
    },
    [projectId, refresh],
  );

  const removeRole = useCallback(
    async (roleId: string) => {
      await projectApi.removeRole(projectId, roleId);
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
