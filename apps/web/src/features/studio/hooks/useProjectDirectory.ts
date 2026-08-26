import { characterApi } from "@/shared/api/characters";
import type { Character } from "@/shared/types/character";
import { itemApi } from "@/shared/api/editor";
import type { ProjectResponse } from "@/shared/types/project";
import type { ProjectRoleOption } from "../flow/types";

/**
 * 工程目录装载（角色 + 道具引用）——批量获取，消除逐条 N+1。
 * 缺失/失败的角色以占位名兜底，不阻塞工程打开。
 */
export async function fetchProjectDirectory(p: ProjectResponse): Promise<{
  roleOptions: ProjectRoleOption[];
  items: { id: string; name: string }[];
}> {
  const roles = p.roles || [];
  const ids = [...new Set(roles.map((r) => r.character_ref_id))];
  const charById = new Map<string, Character>();
  if (ids.length) {
    try {
      const list = await characterApi.getMany(ids);
      for (const c of list) charById.set(c.id, c);
    } catch {
      /* 批量失败时全部走占位名兜底 */
    }
  }
  const roleOptions: ProjectRoleOption[] = roles.map((role) => {
    const char = charById.get(role.character_ref_id);
    return {
      roleId: role.id,
      characterRefId: role.character_ref_id,
      name: char?.name ?? `角色 ${role.character_ref_id.slice(0, 8)}`,
      imagePath: char?.image_path,
      spriteKeys: Object.keys(char?.character_data?.sprites || {}),
    };
  });

  const itemRefs = (p.asset_refs || []).filter((r) => r.asset_type === "item");
  const items = await Promise.all(
    itemRefs.map(async (ref) => {
      try {
        const item = await itemApi.get(ref.asset_id);
        return { id: ref.asset_id, name: item.name };
      } catch {
        return { id: ref.asset_id, name: `道具 ${ref.asset_id.slice(0, 8)}` };
      }
    }),
  );
  return { roleOptions, items };
}
