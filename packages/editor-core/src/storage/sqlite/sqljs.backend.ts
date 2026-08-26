/**
 * sql.js 后端（真 SQLite WASM）——契约测试专用。
 * 生产后端为 tauri-plugin-sql（桌面壳内，见 apps/desktop）。
 */
import initSqlJs, { type Database } from "sql.js";
import type { SqlBackend, SqlStmt } from "./backend";

export class SqlJsBackend implements SqlBackend {
  private constructor(private readonly db: Database) {}

  static async create(): Promise<SqlJsBackend> {
    const SQL = await initSqlJs();
    return new SqlJsBackend(new SQL.Database());
  }

  async select<T>(sql: string, params?: unknown[]): Promise<T[]> {
    const stmt = this.db.prepare(sql);
    try {
      if (params?.length) stmt.bind(params as never);
      const rows: T[] = [];
      while (stmt.step()) rows.push(stmt.getAsObject() as T);
      return rows;
    } finally {
      stmt.free();
    }
  }

  async execute(sql: string, params?: unknown[]): Promise<{ rowsAffected: number }> {
    this.db.run(sql, params as never);
    const modified = this.db.getRowsModified();
    return { rowsAffected: modified };
  }

  async transactional(stmts: SqlStmt[]): Promise<{ rowsAffected: number }> {
    this.db.run("BEGIN");
    try {
      let affected = 0;
      for (const s of stmts) {
        this.db.run(s.sql, (s.params ?? []) as never);
        affected += this.db.getRowsModified();
      }
      this.db.run("COMMIT");
      return { rowsAffected: affected };
    } catch (e) {
      this.db.run("ROLLBACK");
      throw e;
    }
  }
}
