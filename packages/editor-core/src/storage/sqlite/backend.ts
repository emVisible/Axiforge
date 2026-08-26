/**
 * SQLite 存储后端抽象（KERNEL_DESIGN §2.5 / ADR-024 决策 3）。
 *
 * SqliteStorageProvider 只依赖 SqlBackend 接口：
 * - 生产：TauriSqlBackend（tauri-plugin-sql，桌面壳内）
 * - 测试：sql.js 后端（真 SQLite WASM，契约套件直接验收）
 * 同一引擎语义，契约置信度最高。
 */

export type SqlRow = Record<string, unknown>;

export interface SqlBackend {
  /** 参数化查询；返回行集合 */
  select<T>(sql: string, params?: unknown[]): Promise<T[]>;
  /** 参数化执行；返回受影响行数 */
  execute(sql: string, params?: unknown[]): Promise<{ rowsAffected: number }>;
}

/** schema v1：沿用 PG 关系模型；narrative_data/editor_data 保持 JSON 文本列 */
export const SCHEMA_MIGRATIONS: readonly string[] = [
  `
  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    is_public INTEGER NOT NULL DEFAULT 0,
    axs_source TEXT,
    author_id TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS project_scenes (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS project_nodes (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    stage_id TEXT,
    editor_data TEXT NOT NULL DEFAULT '{}',
    narrative_data TEXT NOT NULL DEFAULT '{}',
    sort_order INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS project_edges (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    source_node_id TEXT NOT NULL,
    target_node_id TEXT NOT NULL,
    source_port TEXT NOT NULL DEFAULT 'output',
    label TEXT
  );
  CREATE TABLE IF NOT EXISTS project_roles (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    character_ref_id TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS characters (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    character_data TEXT NOT NULL DEFAULT '{}',
    image_path TEXT,
    author_id TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_nodes_project ON project_nodes(project_id);
  CREATE INDEX IF NOT EXISTS idx_edges_project ON project_edges(project_id);
  `,
];

/** 依序执行迁移（幂等：IF NOT EXISTS） */
export async function applyMigrations(backend: SqlBackend): Promise<void> {
  for (const ddl of SCHEMA_MIGRATIONS) {
    await backend.execute(ddl);
  }
}
