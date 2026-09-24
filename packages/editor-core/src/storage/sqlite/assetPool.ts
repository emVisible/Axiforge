/**
 * 全局资产池（道具 / 场景）的 SQLite 落地——L4 契约两个域的实现体。
 *
 * 独立成模块的原因：sqliteProvider 受 G1 行数预算约束，
 * 而这两个域是纯 CRUD 行编解码，与叙事图没有任何耦合。
 * 归属语义：全局池、不挂 project_id（与 backend assets/models.py 同构）。
 */

import { filterByVisibility } from "../visibility";
import type {
  StoredAssetItem,
  StoredAssetScene,
  StorageResult,
  VisibilityScope,
} from "../types";
import { err, ok } from "../types";
import type { SqlBackend } from "./backend";
import { asBool, nowIso, parseJson, uuid } from "./rows";

interface ItemRow {
  id: string;
  name: string;
  description: string;
  category: string;
  rarity: string;
  mechanism_tags: string;
  effects: string;
  image_path: string | null;
  author_id: string | null;
  is_public: number | boolean | null;
  updated_at: string;
}

interface SceneRow {
  id: string;
  name: string;
  description: string;
  location: string | null;
  atmosphere: string | null;
  era: string | null;
  world_setting: string | null;
  rules: string | null;
  tags: string;
  node_templates: string;
  image_path: string | null;
  author_id: string | null;
  is_public: number | boolean | null;
  updated_at: string;
}

const ITEM_COLS = `id, name, description, category, rarity, mechanism_tags, effects,
  image_path, author_id, is_public, updated_at`;
const SCENE_COLS = `id, name, description, location, atmosphere, era, world_setting,
  rules, tags, node_templates, image_path, author_id, is_public, updated_at`;

export async function listItems(
  backend: SqlBackend,
  scope?: VisibilityScope,
): Promise<StorageResult<StoredAssetItem[]>> {
  try {
    const rows = await backend.select<ItemRow>(
      `SELECT ${ITEM_COLS} FROM asset_items ORDER BY updated_at DESC`,
    );
    const out: StoredAssetItem[] = [];
    for (const r of rows) {
      const tags = parseJson<string[]>(r.mechanism_tags, "item.mechanism_tags", r.id, []);
      if (!tags.ok) return tags;
      const effects = parseJson<string[]>(r.effects, "item.effects", r.id, []);
      if (!effects.ok) return effects;
      out.push({
        id: r.id,
        name: r.name,
        description: r.description ?? "",
        category: r.category,
        rarity: r.rarity,
        mechanismTags: tags.data,
        effects: effects.data,
        imagePath: r.image_path,
        isPublic: asBool(r.is_public),
        authorId: r.author_id ?? null,
        updatedAt: r.updated_at,
      });
    }
    return ok(filterByVisibility(out, scope));
  } catch (cause) {
    return err({ code: "io", detail: "listItems 查询失败", cause });
  }
}

export async function saveItem(
  backend: SqlBackend,
  item: StoredAssetItem,
  defaultAuthorId: string | null,
): Promise<StorageResult<{ id: string }>> {
  try {
    const id = item.id || uuid();
    const params = [
      item.name,
      item.description,
      item.category,
      item.rarity,
      JSON.stringify(item.mechanismTags),
      JSON.stringify(item.effects),
      item.imagePath,
      item.authorId ?? defaultAuthorId,
      item.isPublic ? 1 : 0,
      nowIso(),
      id,
    ];
    const exists = await backend.select(`SELECT id FROM asset_items WHERE id = ?`, [id]);
    if (exists.length) {
      await backend.execute(
        `UPDATE asset_items SET name=?, description=?, category=?, rarity=?, mechanism_tags=?,
         effects=?, image_path=?, author_id=?, is_public=?, updated_at=? WHERE id=?`,
        params,
      );
    } else {
      await backend.execute(
        `INSERT INTO asset_items (id, name, description, category, rarity, mechanism_tags,
         effects, image_path, author_id, is_public, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, ...params.slice(0, params.length - 1)],
      );
    }
    return ok({ id });
  } catch (cause) {
    return err({ code: "io", detail: "saveItem 失败", cause });
  }
}

export async function deleteById(
  backend: SqlBackend,
  table: "asset_items" | "asset_scenes",
  entity: string,
  id: string,
): Promise<StorageResult<void>> {
  try {
    const r = await backend.execute(`DELETE FROM ${table} WHERE id = ?`, [id]);
    return r.rowsAffected > 0
      ? ok(undefined)
      : err({ code: "not_found", entity, id });
  } catch (cause) {
    return err({ code: "io", detail: `delete ${entity} 失败`, cause });
  }
}

export async function listScenes(
  backend: SqlBackend,
  scope?: VisibilityScope,
): Promise<StorageResult<StoredAssetScene[]>> {
  try {
    const rows = await backend.select<SceneRow>(
      `SELECT ${SCENE_COLS} FROM asset_scenes ORDER BY updated_at DESC`,
    );
    const out: StoredAssetScene[] = [];
    for (const r of rows) {
      const tags = parseJson<string[]>(r.tags, "scene.tags", r.id, []);
      if (!tags.ok) return tags;
      const tpl = parseJson<Record<string, unknown>[]>(r.node_templates, "scene.node_templates", r.id, []);
      if (!tpl.ok) return tpl;
      out.push({
        id: r.id,
        name: r.name,
        description: r.description ?? "",
        location: r.location,
        atmosphere: r.atmosphere,
        era: r.era,
        worldSetting: r.world_setting,
        rules: r.rules,
        tags: tags.data,
        nodeTemplates: tpl.data,
        imagePath: r.image_path,
        isPublic: asBool(r.is_public),
        authorId: r.author_id ?? null,
        updatedAt: r.updated_at,
      });
    }
    return ok(filterByVisibility(out, scope));
  } catch (cause) {
    return err({ code: "io", detail: "listScenes 查询失败", cause });
  }
}

export async function saveScene(
  backend: SqlBackend,
  scene: StoredAssetScene,
  defaultAuthorId: string | null,
): Promise<StorageResult<{ id: string }>> {
  try {
    const id = scene.id || uuid();
    const params = [
      scene.name,
      scene.description,
      scene.location,
      scene.atmosphere,
      scene.era,
      scene.worldSetting,
      scene.rules,
      JSON.stringify(scene.tags),
      JSON.stringify(scene.nodeTemplates),
      scene.imagePath,
      scene.authorId ?? defaultAuthorId,
      scene.isPublic ? 1 : 0,
      nowIso(),
      id,
    ];
    const exists = await backend.select(`SELECT id FROM asset_scenes WHERE id = ?`, [id]);
    if (exists.length) {
      await backend.execute(
        `UPDATE asset_scenes SET name=?, description=?, location=?, atmosphere=?, era=?,
         world_setting=?, rules=?, tags=?, node_templates=?, image_path=?, author_id=?,
         is_public=?, updated_at=? WHERE id=?`,
        params,
      );
    } else {
      await backend.execute(
        `INSERT INTO asset_scenes (id, name, description, location, atmosphere, era,
         world_setting, rules, tags, node_templates, image_path, author_id, is_public, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, ...params.slice(0, params.length - 1)],
      );
    }
    return ok({ id });
  } catch (cause) {
    return err({ code: "io", detail: "saveScene 失败", cause });
  }
}
