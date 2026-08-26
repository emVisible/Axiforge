/**
 * SqliteStorageProvider —— L4 契约的 SQLite 实现（本地优先，ADR-024 决策 3）。
 *
 * 语义裁决（与 Memory 实现一致，契约套件双重验收）：
 * - createProject 引导默认舞台「主场景」+ 开始/结束两节点 + 一条边
 * - saveNarrative 在事务内原子覆写 nodes/edges/axs_source（I4）
 * - saveCharacter upsert（id 命中更新，否则插入）
 * - 失败语义：SQL 异常 → io；载入 JSON 解析失败 → corrupted
 */

import type {
  CreateProjectInput,
  NarrativePayload,
  ProjectBundle,
  ProjectMeta,
  ProjectMetaPatch,
  StorageProvider,
  StorageResult,
  StoredCharacter,
  StoredEdge,
  StoredNode,
} from "../types";
import { err, ok } from "../types";
import { applyMigrations, type SqlBackend, type SqlStmt } from "./backend";

const nowIso = () => new Date().toISOString();
const uuid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;

function parseJson<T>(text: unknown, entity: string, id: string, fallback: T): StorageResult<T> {
  if (typeof text !== "string") return ok(fallback);
  try {
    return ok(JSON.parse(text) as T);
  } catch (cause) {
    return err({ code: "corrupted", entity, id, detail: "JSON 解析失败", cause });
  }
}

interface ProjectRow {
  id: string;
  title: string;
  updated_at: string;
  axs_source: string | null;
}

export class SqliteStorageProvider implements StorageProvider {
  constructor(private readonly backend: SqlBackend) {}

  async init(): Promise<void> {
    await applyMigrations(this.backend);
  }

  async listProjects(): Promise<StorageResult<ProjectMeta[]>> {
    try {
      const rows = await this.backend.select<ProjectRow>(
        `SELECT id, title, updated_at FROM projects ORDER BY updated_at DESC`,
      );
      return ok(rows.map((r) => ({ id: r.id, title: r.title, updatedAt: r.updated_at })));
    } catch (cause) {
      return err({ code: "io", detail: "listProjects 查询失败", cause });
    }
  }

  async createProject(input: CreateProjectInput): Promise<StorageResult<ProjectMeta>> {
    const id = uuid();
    const now = nowIso();
    const sceneId = uuid();
    const startId = uuid();
    const endId = uuid();
    try {
      await this.backend.execute(
        `INSERT INTO projects (id, title, updated_at, created_at) VALUES (?, ?, ?, ?)`,
        [id, input.title, now, now],
      );
      await this.backend.execute(
        `INSERT INTO project_scenes (id, project_id, title, sort_order) VALUES (?, ?, ?, 0)`,
        [sceneId, id, "主场景"],
      );
      const bootstrap = [
        [startId, "开始", JSON.stringify({ position: { x: 120, y: 80 } }),
         JSON.stringify({ title: "开始", narration: "故事从这里开始...", is_anchor: true }), 0],
        [endId, "结束", JSON.stringify({ position: { x: 420, y: 80 } }),
         JSON.stringify({ title: "结束", script: [] }), 1],
      ] as const;
      for (const [nid, , ed, nd, so] of bootstrap) {
        await this.backend.execute(
          `INSERT INTO project_nodes (id, project_id, stage_id, editor_data, narrative_data, sort_order)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [nid, id, sceneId, ed, nd, so],
        );
      }
      await this.backend.execute(
        `INSERT INTO project_edges (id, project_id, source_node_id, target_node_id, label)
         VALUES (?, ?, ?, ?, ?)`,
        [`${startId}-${endId}`, id, startId, endId, "开始"],
      );
      return ok({ id, title: input.title, updatedAt: now });
    } catch (cause) {
      return err({ code: "io", detail: "createProject 写入失败", cause });
    }
  }

  async loadProject(id: string): Promise<StorageResult<ProjectBundle>> {
    try {
      const rows = await this.backend.select<ProjectRow>(
        `SELECT id, title, updated_at, axs_source FROM projects WHERE id = ?`,
        [id],
      );
      if (!rows.length) return err({ code: "not_found", entity: "project", id });
      const row = rows[0]!;

      const nodeRows = await this.backend.select<{
        id: string; stage_id: string | null; editor_data: string;
        narrative_data: string; sort_order: number;
      }>(
        `SELECT id, stage_id, editor_data, narrative_data, sort_order
         FROM project_nodes WHERE project_id = ? ORDER BY sort_order, id`,
        [id],
      );
      const nodes: StoredNode[] = [];
      for (const r of nodeRows) {
        const editor = parseJson<Record<string, unknown>>(r.editor_data, "node.editor_data", r.id, {});
        if (!editor.ok) return { ok: false, error: editor.error };
        const narrative = parseJson<Record<string, unknown>>(r.narrative_data, "node.narrative_data", r.id, {});
        if (!narrative.ok) return { ok: false, error: narrative.error };
        nodes.push({
          id: r.id,
          stageId: r.stage_id,
          editorData: editor.data,
          narrativeData: narrative.data,
          sortOrder: r.sort_order,
        });
      }

      const edgeRows = await this.backend.select<{
        id: string; source_node_id: string; target_node_id: string; label: string | null;
      }>(
        `SELECT id, source_node_id, target_node_id, label FROM project_edges WHERE project_id = ?`,
        [id],
      );
      const edges: StoredEdge[] = edgeRows.map((e) => ({
        id: e.id, source: e.source_node_id, target: e.target_node_id, label: e.label,
      }));

      const sceneRows = await this.backend.select<{ id: string; title: string }>(
        `SELECT id, title FROM project_scenes WHERE project_id = ? ORDER BY sort_order, id`,
        [id],
      );
      const roleRows = await this.backend.select<{ id: string; character_ref_id: string }>(
        `SELECT id, character_ref_id FROM project_roles WHERE project_id = ?`,
        [id],
      );

      return ok({
        meta: { id: row.id, title: row.title, updatedAt: row.updated_at },
        axsSource: row.axs_source,
        nodes,
        edges,
        scenes: sceneRows,
        roles: roleRows.map((r) => ({ id: r.id, characterRefId: r.character_ref_id })),
      });
    } catch (cause) {
      return err({ code: "io", detail: "loadProject 查询失败", cause });
    }
  }

  async deleteProject(id: string): Promise<StorageResult<void>> {
    try {
      const r = await this.backend.execute(`DELETE FROM projects WHERE id = ?`, [id]);
      return r.rowsAffected > 0
        ? ok(undefined)
        : err({ code: "not_found", entity: "project", id });
    } catch (cause) {
      return err({ code: "io", detail: "deleteProject 失败", cause });
    }
  }

  async updateProjectMeta(
    id: string,
    patch: ProjectMetaPatch,
  ): Promise<StorageResult<void>> {
    try {
      const sets: string[] = ["updated_at = ?"];
      const params: unknown[] = [nowIso()];
      if (patch.title !== undefined) { sets.push("title = ?"); params.push(patch.title); }
      if (patch.axsSource !== undefined) { sets.push("axs_source = ?"); params.push(patch.axsSource); }
      params.push(id);
      const r = await this.backend.execute(
        `UPDATE projects SET ${sets.join(", ")} WHERE id = ?`, params,
      );
      return r.rowsAffected > 0
        ? ok(undefined)
        : err({ code: "not_found", entity: "project", id });
    } catch (cause) {
      return err({ code: "io", detail: "updateProjectMeta 失败", cause });
    }
  }

  async saveNarrative(
    id: string,
    payload: NarrativePayload,
  ): Promise<StorageResult<void>> {
    try {
      const exists = await this.backend.select(
        `SELECT id FROM projects WHERE id = ?`, [id],
      );
      if (!exists.length) return err({ code: "not_found", entity: "project", id });
      const stmts = [
        { sql: `DELETE FROM project_nodes WHERE project_id = ?`, params: [id] },
        { sql: `DELETE FROM project_edges WHERE project_id = ?`, params: [id] },
        ...payload.nodes.map(
          (n): SqlStmt => ({
            sql: `INSERT INTO project_nodes (id, project_id, stage_id, editor_data, narrative_data, sort_order)
             VALUES (?, ?, ?, ?, ?, ?)`,
            params: [n.id, id, n.stageId, JSON.stringify(n.editorData), JSON.stringify(n.narrativeData), n.sortOrder],
          }),
        ),
        ...payload.edges.map(
          (e): SqlStmt => ({
            sql: `INSERT INTO project_edges (id, project_id, source_node_id, target_node_id, label)
             VALUES (?, ?, ?, ?, ?)`,
            params: [e.id, id, e.source, e.target, e.label],
          }),
        ),
        {
          sql: `UPDATE projects SET axs_source = ?, updated_at = ? WHERE id = ?`,
          params: [payload.axsSource, nowIso(), id],
        },
      ];
      await this.backend.transactional(stmts);
      return ok(undefined);
    } catch (cause) {
      return err({ code: "io", detail: "saveNarrative 事务失败已回滚", cause });
    }
  }

  async addRole(
    id: string,
    role: { characterRefId: string },
  ): Promise<StorageResult<void>> {
    try {
      const projectExists = await this.backend.select(
        `SELECT id FROM projects WHERE id = ?`, [id],
      );
      if (!projectExists.length) return err({ code: "not_found", entity: "project", id });
      const dup = await this.backend.select(
        `SELECT id FROM project_roles WHERE project_id = ? AND character_ref_id = ?`,
        [id, role.characterRefId],
      );
      if (dup.length) {
        return err({ code: "io", detail: `duplicate role characterRefId=${role.characterRefId}` });
      }
      await this.backend.execute(
        `INSERT INTO project_roles (id, project_id, character_ref_id) VALUES (?, ?, ?)`,
        [uuid(), id, role.characterRefId],
      );
      return ok(undefined);
    } catch (cause) {
      return err({ code: "io", detail: "addRole 失败", cause });
    }
  }

  async removeRole(id: string, roleId: string): Promise<StorageResult<void>> {
    try {
      const projectExists = await this.backend.select(
        `SELECT id FROM projects WHERE id = ?`, [id],
      );
      if (!projectExists.length) return err({ code: "not_found", entity: "project", id });
      await this.backend.execute(
        `DELETE FROM project_roles WHERE project_id = ? AND id = ?`,
        [id, roleId],
      );
      return ok(undefined);
    } catch (cause) {
      return err({ code: "io", detail: "removeRole 失败", cause });
    }
  }

  async listCharacters(): Promise<StorageResult<StoredCharacter[]>> {
    try {
      const rows = await this.backend.select<{
        id: string; name: string; character_data: string; image_path: string | null;
      }>(`SELECT id, name, character_data, image_path FROM characters`);
      const out: StoredCharacter[] = [];
      for (const r of rows) {
        const cd = parseJson<Record<string, unknown>>(r.character_data, "character.character_data", r.id, {});
        if (!cd.ok) return { ok: false, error: cd.error };
        out.push({ id: r.id, name: r.name, characterData: cd.data, imagePath: r.image_path });
      }
      return ok(out);
    } catch (cause) {
      return err({ code: "io", detail: "listCharacters 查询失败", cause });
    }
  }

  async getCharacter(id: string): Promise<StorageResult<StoredCharacter>> {
    try {
      const rows = await this.backend.select<{
        id: string; name: string; character_data: string; image_path: string | null;
      }>(`SELECT id, name, character_data, image_path FROM characters WHERE id = ?`, [id]);
      if (!rows.length) return err({ code: "not_found", entity: "character", id });
      const r = rows[0]!;
      const cd = parseJson<Record<string, unknown>>(r.character_data, "character.character_data", r.id, {});
      if (!cd.ok) return cd;
      return ok({ id: r.id, name: r.name, characterData: cd.data, imagePath: r.image_path });
    } catch (cause) {
      return err({ code: "io", detail: "getCharacter 查询失败", cause });
    }
  }

  async saveCharacter(
    character: StoredCharacter,
  ): Promise<StorageResult<{ id: string }>> {
    try {
      const id = character.id || uuid();
      const cd = JSON.stringify(character.characterData);
      const exists = await this.backend.select(
        `SELECT id FROM characters WHERE id = ?`, [id],
      );
      if (exists.length) {
        await this.backend.execute(
          `UPDATE characters SET name = ?, character_data = ?, image_path = ? WHERE id = ?`,
          [character.name, cd, character.imagePath, id],
        );
      } else {
        await this.backend.execute(
          `INSERT INTO characters (id, name, character_data, image_path) VALUES (?, ?, ?, ?)`,
          [id, character.name, cd, character.imagePath],
        );
      }
      return ok({ id });
    } catch (cause) {
      return err({ code: "io", detail: "saveCharacter 失败", cause });
    }
  }
}
