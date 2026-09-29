/**
 * 工程正文域（projects / nodes / edges）的 SQLite 落地。
 *
 * 从 SqliteStorageProvider 外提的原因：该 Provider 受 G1 行数预算约束，
 * 而工程域是它最大的一块（引导默认舞台、原子覆写叙事图、角色挂载）。
 * 语义未变——外提的是文件边界，不是行为。
 * 挂在正文上的三种引用（舞台 / 角色 / 道具）另见 `sqliteProjectLinks.ts`；
 * 工程束仍在这里的 `loadProject` 一处装配，两段读路径不各自成形。
 */

import type {
  AssetRefInput,
  CreateProjectInput,
  NarrativePayload,
  ProjectBundle,
  ProjectMeta,
  ProjectMetaPatch,
  ProjectSceneInput,
  StorageResult,
  StoredEdge,
  StoredNode,
} from "../types";
import { emptyProjectMetadata, err, ok } from "../types";
import type { SqlBackend, SqlStmt } from "./backend";
import { asBool, nowIso, parseJson, uuid } from "./rows";
import { SqliteProjectLinkStore } from "./sqliteProjectLinks";

interface ProjectRow {
  id: string;
  title: string;
  updated_at: string;
  axs_source: string | null;
  is_public?: number | boolean | null;
  description?: string | null;
  cover_image?: string | null;
  theme_tags?: string | null;
  mechanism?: string | null;
  genre?: string | null;
  is_meta?: number | boolean | null;
  world_setting?: string | null;
  rules?: string | null;
}

/** projects 行 → ProjectMeta：JSON 列逐字段解码，缺列按「本地库尚未迁移」如实归零 */
function toProjectMeta(r: ProjectRow): StorageResult<ProjectMeta> {
  const tags = parseJson<string[]>(r.theme_tags, "project.theme_tags", r.id, []);
  if (!tags.ok) return tags;
  return ok({
    id: r.id,
    title: r.title,
    updatedAt: r.updated_at,
    isPublic: asBool(r.is_public),
    description: r.description ?? "",
    coverImage: r.cover_image ?? null,
    themeTags: tags.data,
    mechanism: r.mechanism ?? null,
    genre: r.genre ?? null,
    isMeta: asBool(r.is_meta),
    worldSetting: r.world_setting ?? null,
    rules: r.rules ?? null,
  });
}

const PROJECT_COLS = `id, title, updated_at, is_public, description, cover_image,
  theme_tags, mechanism, genre, is_meta, world_setting, rules`;

export class SqliteProjectStore {
  /** 挂在工程正文上的三种引用；同一个 backend，在 `loadProject` 处合并成一份工程束 */
  private readonly links: SqliteProjectLinkStore;

  constructor(
    protected readonly backend: SqlBackend,
    private readonly authorId: string | null,
  ) {
    this.links = new SqliteProjectLinkStore(backend);
  }

  async listProjects(): Promise<StorageResult<ProjectMeta[]>> {
    try {
      const rows = await this.backend.select<ProjectRow>(
        `SELECT ${PROJECT_COLS} FROM projects ORDER BY updated_at DESC`,
      );
      const out: ProjectMeta[] = [];
      for (const r of rows) {
        const meta = toProjectMeta(r);
        if (!meta.ok) return meta;
        out.push(meta.data);
      }
      return ok(out);
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
        `INSERT INTO projects (id, title, updated_at, created_at, author_id, is_public) VALUES (?, ?, ?, ?, ?, ?)`,
        [id, input.title, now, now, this.authorId, input.isPublic ? 1 : 0],
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
      return ok({
        id,
        title: input.title,
        updatedAt: now,
        isPublic: input.isPublic ?? false,
        ...emptyProjectMetadata(),
      });
    } catch (cause) {
      return err({ code: "io", detail: "createProject 写入失败", cause });
    }
  }

  async loadProject(id: string): Promise<StorageResult<ProjectBundle>> {
    try {
      const rows = await this.backend.select<ProjectRow>(
        `SELECT ${PROJECT_COLS}, axs_source FROM projects WHERE id = ?`,
        [id],
      );
      if (!rows.length) return err({ code: "not_found", entity: "project", id });
      const row = rows[0]!;
      const meta = toProjectMeta(row);
      if (!meta.ok) return meta;

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

      // 舞台 / 角色 / 道具引用三段由挂接域负责，这里只做装配（分域理由见 sqliteProjectLinks.ts）
      const links = await this.links.loadLinks(id);
      if (!links.ok) return links;

      return ok({
        meta: meta.data,
        axsSource: row.axs_source,
        nodes,
        edges,
        ...links.data,
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
      if (patch.description !== undefined) { sets.push("description = ?"); params.push(patch.description); }
      if (patch.coverImage !== undefined) { sets.push("cover_image = ?"); params.push(patch.coverImage); }
      if (patch.themeTags !== undefined) { sets.push("theme_tags = ?"); params.push(JSON.stringify(patch.themeTags)); }
      if (patch.mechanism !== undefined) { sets.push("mechanism = ?"); params.push(patch.mechanism); }
      if (patch.genre !== undefined) { sets.push("genre = ?"); params.push(patch.genre); }
      if (patch.isMeta !== undefined) { sets.push("is_meta = ?"); params.push(patch.isMeta ? 1 : 0); }
      if (patch.worldSetting !== undefined) { sets.push("world_setting = ?"); params.push(patch.worldSetting); }
      if (patch.rules !== undefined) { sets.push("rules = ?"); params.push(patch.rules); }
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

  // ---------- 挂接域分派：实现体在 sqliteProjectLinks.ts，本类只做契约转调 ----------

  addProjectScene(
    id: string,
    scene: ProjectSceneInput,
  ): Promise<StorageResult<{ id: string }>> {
    return this.links.addProjectScene(id, scene);
  }

  removeProjectScene(id: string, sceneId: string): Promise<StorageResult<void>> {
    return this.links.removeProjectScene(id, sceneId);
  }

  addRole(
    id: string,
    role: { characterRefId: string },
  ): Promise<StorageResult<void>> {
    return this.links.addRole(id, role);
  }

  removeRole(id: string, roleId: string): Promise<StorageResult<void>> {
    return this.links.removeRole(id, roleId);
  }

  addAssetRef(
    id: string,
    ref: AssetRefInput,
  ): Promise<StorageResult<{ id: string }>> {
    return this.links.addAssetRef(id, ref);
  }

  removeAssetRef(id: string, refId: string): Promise<StorageResult<void>> {
    return this.links.removeAssetRef(id, refId);
  }
}