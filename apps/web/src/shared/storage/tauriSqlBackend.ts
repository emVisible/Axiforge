/**
 * TauriSqlBackend —— SqlBackend 的桌面生产实现（tauri-plugin-sql / sqlx）。
 *
 * 两个语义裁决（依据官方文档查证，axiom 第三部 17.4）：
 * 1. 占位符翻译：sqlx 对 SQLite 使用 $1/$2 语法，而 Provider 生成 ?（与 sql.js
 *    共用的契约形态）——本后端负责 ? → $n 重写。Provider 生成的 SQL 不含
 *    字符串字面量问号（全部参数化），重写安全。
 * 2. 串行队列：sqlx 底层是连接池，BEGIN/COMMIT 可能落在不同连接。本后端以
 *    Promise 链串行化全部语句，保证事务窗口内无并发插入——事务原子性最终由
 *    壳内冒烟实证（回滚检查），若池行为不符预期则原子性下沉到 Rust 单连接命令。
 */

import { invoke } from "@tauri-apps/api/core";
import type { SqlBackend, SqlStmt } from "@axiforge/editor-core";

type SqlDatabase = {
  select<T>(query: string, bindValues?: unknown[]): Promise<T>;
  execute(query: string, bindValues?: unknown[]): Promise<{ rowsAffected: number }>;
};

export function isTauriEnvironment(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

let dbPromise: Promise<SqlDatabase> | null = null;

async function loadDatabase(): Promise<SqlDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const mod = await import("@tauri-apps/plugin-sql");
      return mod.default.load("sqlite:axiforge.db") as Promise<SqlDatabase>;
    })();
  }
  return dbPromise;
}

/** ? → $1/$2/... （仅重写 SQL 文本中的占位符；Provider 不生成含 ? 的字面量） */
function translatePlaceholders(sql: string): string {
  let n = 0;
  return sql.replace(/\?/g, () => `$${++n}`);
}

export class TauriSqlBackend implements SqlBackend {
  private chain: Promise<unknown> = Promise.resolve();

  private enqueue<T>(task: () => Promise<T>): Promise<T> {
    const next = this.chain.then(task, task);
    this.chain = next.catch(() => undefined);
    return next;
  }

  async select<T>(sql: string, params?: unknown[]): Promise<T[]> {
    const db = await loadDatabase();
    const rows = await db.select<T[]>(translatePlaceholders(sql), params ?? []);
    return Array.isArray(rows) ? rows : [];
  }

  async execute(sql: string, params?: unknown[]): Promise<{ rowsAffected: number }> {
    return this.enqueue(async () => {
      const db = await loadDatabase();
      const r = await db.execute(translatePlaceholders(sql), params ?? []);
      return { rowsAffected: r.rowsAffected ?? 0 };
    });
  }

  /** 原子性下沉：Rust 单连接事务（sqlx 池化下 BEGIN/COMMIT 会跨连接，已实证失效） */
  async transactional(stmts: SqlStmt[]): Promise<{ rowsAffected: number }> {
    return this.enqueue(async () => {
      const affected = await invoke<number>("sql_transaction", {
        dbName: "axiforge.db",
        stmts: stmts.map((s) => ({
          sql: translatePlaceholders(s.sql),
          params: s.params ?? [],
        })),
      });
      return { rowsAffected: affected };
    });
  }
}
