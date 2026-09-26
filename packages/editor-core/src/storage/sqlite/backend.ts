/**
 * SQLite 存储后端抽象（KERNEL_DESIGN §2.5 / ADR-024 决策 3）。
 *
 * SqliteStorageProvider 只依赖 SqlBackend 接口：
 * - 生产：TauriSqlBackend（tauri-plugin-sql，桌面壳内）
 * - 测试：sql.js 后端（真 SQLite WASM，契约套件直接验收）
 * 同一引擎语义，契约置信度最高。
 */

export type SqlRow = Record<string, unknown>;

export interface SqlStmt {
  sql: string;
  params?: unknown[];
}

export interface SqlBackend {
  /** 参数化查询；返回行集合 */
  select<T>(sql: string, params?: unknown[]): Promise<T[]>;
  /** 参数化执行；返回受影响行数 */
  execute(sql: string, params?: unknown[]): Promise<{ rowsAffected: number }>;
  /**
   * 单一事务内顺序执行全部语句，任一失败整体回滚（I4）。
   * - sql.js：单连接 BEGIN/COMMIT（真原子）
   * - Tauri：Rust 命令 sql_transaction（单连接池，绕开 sqlx 池化跨连接问题）
   */
  transactional(stmts: SqlStmt[]): Promise<{ rowsAffected: number }>;
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
    author_id TEXT,
    is_public INTEGER NOT NULL DEFAULT 0
  );
  CREATE INDEX IF NOT EXISTS idx_nodes_project ON project_nodes(project_id);
  CREATE INDEX IF NOT EXISTS idx_edges_project ON project_edges(project_id);
  `,
  // 修复早期无 FK 约束时代留下的孤儿行（幂等）
  `
  DELETE FROM project_nodes WHERE project_id NOT IN (SELECT id FROM projects);
  DELETE FROM project_edges WHERE project_id NOT IN (SELECT id FROM projects);
  DELETE FROM project_scenes WHERE project_id NOT IN (SELECT id FROM projects);
  DELETE FROM project_roles WHERE project_id NOT IN (SELECT id FROM projects);
  `,
  /**
   * schema v3（宪章 Phase 7）：把离线不可用的四个域补进本地库。
   * asset_items / asset_scenes 是全局资产池，不挂 project_id——与 backend 同构。
   */
  `
  CREATE TABLE IF NOT EXISTS asset_items (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    category TEXT NOT NULL DEFAULT '日常',
    rarity TEXT NOT NULL DEFAULT '普通',
    mechanism_tags TEXT NOT NULL DEFAULT '[]',
    effects TEXT NOT NULL DEFAULT '[]',
    image_path TEXT,
    author_id TEXT,
    is_public INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS asset_scenes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    location TEXT,
    atmosphere TEXT,
    era TEXT,
    world_setting TEXT,
    rules TEXT,
    tags TEXT NOT NULL DEFAULT '[]',
    node_templates TEXT NOT NULL DEFAULT '[]',
    image_path TEXT,
    author_id TEXT,
    is_public INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS save_slots (
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    player_token TEXT NOT NULL,
    slot INTEGER NOT NULL DEFAULT 0,
    state TEXT NOT NULL DEFAULT '{}',
    summary TEXT,
    beat_id TEXT,
    thumb_ref TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    PRIMARY KEY (project_id, player_token, slot)
  );
  CREATE TABLE IF NOT EXISTS achievements (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    akey TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    icon TEXT NOT NULL DEFAULT 'star',
    condition_json TEXT NOT NULL DEFAULT '{}',
    UNIQUE (project_id, akey)
  );
  CREATE TABLE IF NOT EXISTS player_achievements (
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    player_token TEXT NOT NULL,
    achievement_key TEXT NOT NULL,
    unlocked_at TEXT NOT NULL,
    PRIMARY KEY (project_id, player_token, achievement_key)
  );
  /* schema v4（宪章 Phase 13 S13-1）：角色传记进本地库——后端退场后它是创作主数据，
     不是可判死的云功能。character_id 硬隔离：跨角色读写一律 not_found */
  CREATE TABLE IF NOT EXISTS character_stories (
    id TEXT PRIMARY KEY,
    character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL DEFAULT '',
    sort_order INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_items_author ON asset_items(author_id);
  CREATE INDEX IF NOT EXISTS idx_scenes_author ON asset_scenes(author_id);
  CREATE INDEX IF NOT EXISTS idx_ach_project ON achievements(project_id);
  CREATE INDEX IF NOT EXISTS idx_stories_character ON character_stories(character_id);
  `,
];

/**
 * 旧库补列：`CREATE TABLE IF NOT EXISTS` 不会给已存在的表加列，
 * 已发布过 v0.6 的机器上 characters 就没有 is_public —— 迁移必须自己补齐。
 */
const COLUMN_PATCHES: readonly {
  table: string;
  column: string;
  ddl: string;
}[] = [
  {
    table: "characters",
    column: "is_public",
    ddl: "ALTER TABLE characters ADD COLUMN is_public INTEGER NOT NULL DEFAULT 0",
  },
  {
    table: "projects",
    column: "description",
    ddl: "ALTER TABLE projects ADD COLUMN description TEXT NOT NULL DEFAULT ''",
  },
  {
    table: "projects",
    column: "cover_image",
    ddl: "ALTER TABLE projects ADD COLUMN cover_image TEXT",
  },
  {
    table: "projects",
    column: "theme_tags",
    ddl: "ALTER TABLE projects ADD COLUMN theme_tags TEXT NOT NULL DEFAULT '[]'",
  },
  {
    table: "projects",
    column: "mechanism",
    ddl: "ALTER TABLE projects ADD COLUMN mechanism TEXT",
  },
  {
    table: "projects",
    column: "genre",
    ddl: "ALTER TABLE projects ADD COLUMN genre TEXT",
  },
  {
    table: "projects",
    column: "is_meta",
    ddl: "ALTER TABLE projects ADD COLUMN is_meta INTEGER NOT NULL DEFAULT 0",
  },
  {
    table: "projects",
    column: "world_setting",
    ddl: "ALTER TABLE projects ADD COLUMN world_setting TEXT",
  },
  {
    table: "projects",
    column: "rules",
    ddl: "ALTER TABLE projects ADD COLUMN rules TEXT",
  },
  /**
   * project_scenes 补列（S13-2b）：「从舞台库导入」要把 location/atmosphere/scene_ref_id
   * 一起存下来——OutlinerPanel 的舞台副标题和 Markdown 导出的「地点/氛围」都读它们。
   * 只补写不补读会静默降级成"导入成功的空舞台"，所以读路径同批改。
   */
  {
    table: "project_scenes",
    column: "description",
    ddl: "ALTER TABLE project_scenes ADD COLUMN description TEXT NOT NULL DEFAULT ''",
  },
  {
    table: "project_scenes",
    column: "location",
    ddl: "ALTER TABLE project_scenes ADD COLUMN location TEXT",
  },
  {
    table: "project_scenes",
    column: "atmosphere",
    ddl: "ALTER TABLE project_scenes ADD COLUMN atmosphere TEXT",
  },
  {
    table: "project_scenes",
    column: "scene_ref_id",
    ddl: "ALTER TABLE project_scenes ADD COLUMN scene_ref_id TEXT",
  },
  {
    table: "project_scenes",
    column: "source",
    ddl: "ALTER TABLE project_scenes ADD COLUMN source TEXT NOT NULL DEFAULT 'inline'",
  },
];

/** 依序执行迁移（幂等：IF NOT EXISTS + 缺列才 ALTER） */
export async function applyMigrations(backend: SqlBackend): Promise<void> {
  for (const ddl of SCHEMA_MIGRATIONS) {
    await backend.execute(ddl);
  }
  for (const patch of COLUMN_PATCHES) {
    const rows = await backend.select<{ n: number }>(
      `SELECT count(*) AS n FROM pragma_table_info(?) WHERE name = ?`,
      [patch.table, patch.column],
    );
    if ((rows[0]?.n ?? 0) === 0) await backend.execute(patch.ddl);
  }
}
