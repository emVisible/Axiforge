/**
 * TauriSqlBackend —— SqlBackend 的桌面生产实现（tauri-plugin-sql / sqlx）。
 *
 * 三个语义裁决（官方文档查证 + 壳内实测，axiom 第三部 17.4）：
 * 1. 占位符翻译：sqlx 对 SQLite 使用 $1/$2 语法，而 Provider 生成 ?（与 sql.js
 *    共用的契约形态）——本后端负责 ? → $n 重写，且每条语句独立重新编号。
 *    重写**只动代码区**：引号与注释里的 `?` 原样留着（见 translatePlaceholders 的说明，
 *    那里记着第一轮"全量替换 + 守卫"为什么被实测否掉）。
 *    2026-10-01 复审量的分母（口径不变：只扫源码里的字符串字面量，动态拼接不在面内，
 *    而现在只有列名白名单参与拼接）：引号/注释里含 `?` 的 SQL 文本块 **0 个**。
 * 2. 事务落地点：一批语句 = 一次 invoke("sql_transaction")，Rust 侧用单连接池
 *    执行（apps/desktop/src-tauri/src/lib.rs）。插件底下的 sqlx 是连接池，
 *    BEGIN/COMMIT 会落在不同连接——那条形状已实证失效。不要退回逐条 execute
 *    （除了跨连接，还会在同一条队列上自锁），也不要在语句文本里塞 BEGIN/COMMIT。
 * 3. 串行队列：execute 与 transactional 共用一条 Promise 链，事务窗口内不会有
 *    并发写语句插入；链上任一失败不得污染后续任务（enqueue 的两条腿）。
 *    select 不入队：读只需看见提交前或提交后的完整状态，原子性已由 2 保证。
 *
 * 三条形状由 tauriSqlBackend.test.ts 钉住。为什么判据必须单独存在：契约套件
 * 只跑 MemoryStorageProvider 与 SQLite(sql.js)，跑不到本类，而桌面壳零 CI 信号。
 * 壳内另有 desktopSmoke 的 transaction-rollback 一支（重复主键触发真回滚），
 * 那要人在 DEV 里跑，不是门禁。
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

/**
 * ? → $1/$2/...，**只重写代码区的占位符**。
 *
 * 这里是本文件第二轮改写（2026-10-01 复审）。第一轮是「全量替换 + 一条
 * 「单引号字面量里含 ? 就抛」的守卫」，而复审把它的**两条自我描述都实测否掉了**：
 *
 * ① 头部原写「错位后的 SQL 照样能执行成功，只是绑错值」——**不成立**。
 *    用 Python 的 sqlite3 真解析器量过：守卫看不见的那些形状里
 *    （`"col?"` / `` `col?` `` / `[col?]` / `-- … ?` / 块注释里的 `?`），
 *    全量替换把 `$n` 塞进引号或注释，SQLite 数到的参数就**少一个**，
 *    报错是 `Incorrect number of bindings supplied`（标识符那几种则是 `no such column: op$1`）。
 *    也就是说旧形状在这些形状上是**响亮地失败**，不是静默串值。
 *    守卫真正买到的是**诊断质量**（在翻译处就抛、错误里带原 SQL），而不是正确性。
 * ② 守卫的**盲区**来自它靠正则猜引号边界：`--` 行注释、块注释、两种引号标识符一概看不见。
 *    分母实测：全仓 23 段真实 SQL 文本块里旧形状只拒绝 1 段（还是本测试自己的夹具），
 *    所以这不是"今天已经在炸"的缺陷，是**"守卫覆盖不到的那一类"**——
 *    同样的写法换一个引号种类，守卫就从抛变成不抛，而落进不抛那一支的形状今天是红的。
 *
 * 所以不再"猜内容"：改成结构上只重写**代码区**，引号与注释里的 `?` 原样留着
 * （对 SQLite 而言那只是文本），真占位符照旧逐语句从 `$1` 编号。
 * 守卫看不见的那几种形状因此从"报错"变成"本来就对"，而不是继续赌正则。
 *
 * 仍抛的那一种是可判的：**引号或注释没有闭合**——那种 SQL 本来就是坏的。
 * fail-closed 的位置因此从"猜内容是什么"挪到"能判的形状"，这才是能长期站住的那种 fail-closed。
 * 分母：全仓 23 段真实 SQL 文本块，新扫描器拒绝 **0** 段。
 */
function translatePlaceholders(sql: string): string {
  let out = "";
  let n = 0;
  let i = 0;
  while (i < sql.length) {
    const ch = sql[i]!;
    const two = sql.slice(i, i + 2);

    if (two === "--") {
      const nl = sql.indexOf("\n", i);
      const end = nl === -1 ? sql.length : nl;
      out += sql.slice(i, end);
      i = end;
      continue;
    }
    if (two === "/*") {
      const end = sql.indexOf("*/", i + 2);
      if (end === -1) throw unterminated(sql, "块注释");
      out += sql.slice(i, end + 2);
      i = end + 2;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === "`") {
      const end = closingQuoteEnd(sql, i, ch, ch);
      out += sql.slice(i, end);
      i = end;
      continue;
    }
    if (ch === "[") {
      // SQLite 的方括号标识符到第一个 `]` 就结束，`]]` 不是转义（与 `''` / `""` 不同）
      const end = sql.indexOf("]", i + 1);
      if (end === -1) throw unterminated(sql, "方括号标识符");
      out += sql.slice(i, end + 1);
      i = end + 1;
      continue;
    }
    if (ch === "?") {
      n += 1;
      out += `$${n}`;
      i += 1;
      continue;
    }
    out += ch;
    i += 1;
  }
  return out;
}

function unterminated(sql: string, what: string): Error {
  return new Error(`占位符重写拒绝：${what}没有闭合的 SQL —— ${sql}`);
}

/** 引号区结束位置（含收尾引号）；未闭合就抛。`closer` 与 `opener` 不同者（方括号）不处理转义 */
function closingQuoteEnd(sql: string, from: number, opener: string, closer: string): number {
  let j = from + 1;
  while (j < sql.length) {
    if (sql[j] !== closer) {
      j += 1;
      continue;
    }
    if (sql[j + 1] === closer) {
      j += 2; // 转义收尾引号（'' / "" / ``）
      continue;
    }
    return j + 1;
  }
  throw unterminated(sql, `${opener} 引号`);
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
