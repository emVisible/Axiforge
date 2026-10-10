import { invoke } from "@tauri-apps/api/core";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TauriSqlBackend, isTauriEnvironment } from "./tauriSqlBackend";

/**
 * 桌面生产后端的接缝判据。
 *
 * 为什么这批断言值得存在：契约套件（runStorageContractSuite 三支）跑的是
 * MemoryStorageProvider 与 SQLite(sql.js)，**没有一支跑到这个类**。
 * I4（saveNarrative 原子覆盖）在生产路径上的全部保障都压缩在下面三个形状里，
 * 而桌面壳零 CI 信号——一旦有人"顺手简化"成逐条 execute，测试仍然全绿，
 * 只有壳内冒烟（desktopSmoke 的 transaction-rollback）才会红，而那需要人跑。
 *
 * 三个形状 = 三条判据：
 * 1. 一批语句 = 一次 invoke("sql_transaction")，不拆成逐条、不塞 BEGIN 文本
 * 2. Provider 侧的 `?` 必须按 sqlx 的 `$n` 发出（每条语句独立重新编号）
 * 3. execute 与 transactional 共用一条串行队列，且一处失败不把队列带死
 */

const sqlPlugin = vi.hoisted(() => ({
  load: vi.fn(),
  select: vi.fn(),
  dbExecute: vi.fn(),
}));

vi.mock("@tauri-apps/api/core", () => ({ invoke: vi.fn() }));
vi.mock("@tauri-apps/plugin-sql", () => ({
  default: { load: sqlPlugin.load },
}));

const invokeMock = vi.mocked(invoke);

/** 队列推进需要宏任务：microtask 只在 enqueue 的第一跳够用 */
const flush = () => new Promise((r) => setTimeout(r, 0));

beforeEach(() => {
  vi.clearAllMocks();
  sqlPlugin.load.mockResolvedValue({
    select: sqlPlugin.select,
    execute: sqlPlugin.dbExecute,
  });
});

describe("TauriSqlBackend 事务形状（I4 的生产落地点）", () => {
  it("一批语句只发一次 sql_transaction，载荷带全部语句与合并影响行数", async () => {
    invokeMock.mockResolvedValue(7);
    const backend = new TauriSqlBackend();

    const result = await backend.transactional([
      { sql: `DELETE FROM project_nodes WHERE project_id = ?`, params: ["p1"] },
      {
        sql: `INSERT INTO project_nodes (id, project_id, sort_order) VALUES (?, ?, ?)`,
        params: ["n1", "p1", 0],
      },
      { sql: `UPDATE projects SET updated_at = ? WHERE id = ?`, params: ["t", "p1"] },
    ]);

    expect(result).toEqual({ rowsAffected: 7 });
    expect(invokeMock).toHaveBeenCalledTimes(1);
    expect(invokeMock.mock.calls[0]![0]).toBe("sql_transaction");
    // 载荷形状是跨语言契约，逐键钉死。真正会**静默**的那格是 dbName：Rust 侧
    // create_if_missing(true)，库名写歪就另建一个空库并成功提交，而读路仍走插件
    // 那个文件——写进去的东西"消失"且零报错。（params 反而不静默：Rust 的
    // struct Stmt 给它挂了 #[serde(default)]，但带占位符的语句会被 sqlx 挡回来。）
    expect(invokeMock.mock.calls[0]![1]).toEqual({
      dbName: "axiforge.db",
      stmts: [
        { sql: `DELETE FROM project_nodes WHERE project_id = $1`, params: ["p1"] },
        {
          sql: `INSERT INTO project_nodes (id, project_id, sort_order) VALUES ($1, $2, $3)`,
          params: ["n1", "p1", 0],
        },
        { sql: `UPDATE projects SET updated_at = $1 WHERE id = $2`, params: ["t", "p1"] },
      ],
    });
  });

  it("占位符按语句独立重新编号，缺省 params 补空数组", async () => {
    invokeMock.mockResolvedValue(2);
    const backend = new TauriSqlBackend();

    await backend.transactional([
      { sql: `INSERT INTO a (x, y) VALUES (?, ?)`, params: [1, 2] },
      { sql: `DELETE FROM b WHERE id = ?`, params: ["z"] },
      { sql: `DROP TABLE IF EXISTS c` },
    ]);

    const stmts = (invokeMock.mock.calls[0]![1] as { stmts: { sql: string; params: unknown[] }[] }).stmts;
    expect(stmts.map((s) => s.sql)).toEqual([
      "INSERT INTO a (x, y) VALUES ($1, $2)",
      "DELETE FROM b WHERE id = $1",
      "DROP TABLE IF EXISTS c",
    ]);
    expect(stmts.map((s) => s.params)).toEqual([[1, 2], ["z"], []]);
  });

  it("不发逐条 execute，也不把 BEGIN/COMMIT 当语句文本发出去", async () => {
    invokeMock.mockResolvedValue(1);
    const backend = new TauriSqlBackend();

    await backend.transactional([
      { sql: `INSERT INTO a (x) VALUES (?)`, params: [1] },
      { sql: `INSERT INTO b (x) VALUES (?)`, params: [2] },
    ]);

    // 旧形状（已实证失效）：sqlx 池化下 BEGIN/COMMIT 会落在不同连接
    expect(sqlPlugin.dbExecute).not.toHaveBeenCalled();
    const sent = JSON.stringify(invokeMock.mock.calls);
    expect(sent).not.toMatch(/\bBEGIN\b/i);
    expect(sent).not.toMatch(/\bCOMMIT\b/i);
  });

  it("两个事务并发提交时按队列串行，第二个等第一个落定", async () => {
    const releases: Array<() => void> = [];
    invokeMock.mockImplementation(
      () => new Promise<number>((resolve) => releases.push(() => resolve(1))),
    );
    const backend = new TauriSqlBackend();

    const first = backend.transactional([{ sql: `INSERT INTO a (x) VALUES (?)`, params: [1] }]);
    const second = backend.transactional([{ sql: `INSERT INTO b (x) VALUES (?)`, params: [2] }]);
    await flush();
    expect(releases).toHaveLength(1);

    releases[0]!();
    await expect(first).resolves.toEqual({ rowsAffected: 1 });
    await flush();
    expect(releases).toHaveLength(2);
    releases[1]!();
    await expect(second).resolves.toEqual({ rowsAffected: 1 });
  });

  it("一处 execute 失败不把队列带死：后续语句仍真发出", async () => {
    const backend = new TauriSqlBackend();

    sqlPlugin.dbExecute.mockRejectedValueOnce(new Error("模拟磁盘故障"));
    await expect(backend.execute(`INSERT INTO a (x) VALUES (?)`, [1])).rejects.toThrow(
      "模拟磁盘故障",
    );

    sqlPlugin.dbExecute.mockResolvedValueOnce({ rowsAffected: 3 });
    await expect(backend.execute(`INSERT INTO b (x) VALUES (?)`, [2])).resolves.toEqual({
      rowsAffected: 3,
    });
    expect(sqlPlugin.dbExecute).toHaveBeenCalledTimes(2);
  });
});

/**
 * 占位符重写的边界。
 *
 * **这一 describe 在 2026-10-01 复审里被整体改写（改写不是删除）**：原先钉的是
 * 「字面量里含 `?` 就抛」这条守卫。复审把它的两条自我描述都实测否掉了——
 * ① 头部原写「错位后的 SQL 照样能执行成功，只是绑错值」：用 Python 的 sqlite3 真解析器量过，
 *    守卫看不见的几种形状（引号标识符 / 注释里的 `?`）落进不抛那一支之后，
 *    SQLite 数到的参数少一个，报的是 `Incorrect number of bindings supplied`——**响亮地失败**，不是静默串值；
 * ② 守卫靠正则猜引号边界，所以只认单引号一种。
 * 于是守卫真正买到的是诊断质量而不是正确性，而它的盲区从"抛"翻到"不抛"就变成红的语句。
 *
 * 现在的契约是「只重写代码区」：引号与注释里的 `?` 原样留着，真占位符照旧从 `$1` 编号。
 * 下面逐个形状钉住，包括原先看不见的那几类——它们现在**本来就该跑通**。
 */
describe("TauriSqlBackend 占位符重写的边界", () => {
  it("引号里的 ? 原样留着，只有代码区的 ? 编号（第一轮守卫看不见的那一类）", async () => {
    invokeMock.mockResolvedValue(1);
    const backend = new TauriSqlBackend();

    await backend.transactional([
      { sql: `INSERT INTO ops (kind, x) VALUES ('?', ?)`, params: ["eq", 1] },
    ]);

    const stmts = (
      invokeMock.mock.calls[0]![1] as { stmts: { sql: string; params: unknown[] }[] }
    ).stmts;
    // 字面量里那个 `?` 必须还是 `?`：变成 `$1` 就会让 SQLite 少认一个真占位符、绑值整体前移
    expect(stmts[0]!.sql).toBe(`INSERT INTO ops (kind, x) VALUES ('?', $1)`);
    expect(stmts[0]!.params).toEqual(["eq", 1]);
  });

  it("双引号/反引号/方括号标识符里的 ? 同样不编号", async () => {
    invokeMock.mockResolvedValue(1);
    const backend = new TauriSqlBackend();

    await backend.transactional([
      { sql: `SELECT "col?", \`bt?\`, [br?] FROM t WHERE id = ?`, params: ["p1"] },
    ]);

    const stmts = (
      invokeMock.mock.calls[0]![1] as { stmts: { sql: string }[] }
    ).stmts;
    expect(stmts[0]!.sql).toBe(`SELECT "col?", \`bt?\`, [br?] FROM t WHERE id = $1`);
  });

  it("注释里的 ? 不编号（行注释与块注释各一次）", async () => {
    invokeMock.mockResolvedValue(1);
    const backend = new TauriSqlBackend();

    await backend.transactional([
      { sql: `SELECT ? -- it's ? fine\nFROM t WHERE id = ?`, params: ["a", "b"] },
      { sql: `SELECT ? /* it's ? fine */ FROM t WHERE id = ?`, params: ["c", "d"] },
    ]);

    const stmts = (
      invokeMock.mock.calls[0]![1] as { stmts: { sql: string }[] }
    ).stmts;
    expect(stmts[0]!.sql).toBe(`SELECT $1 -- it's ? fine\nFROM t WHERE id = $2`);
    // 第一轮守卫会把这条**当成非法 SQL 抛掉**（两个撇号 = 一个假字面量）
    expect(stmts[1]!.sql).toBe(`SELECT $1 /* it's ? fine */ FROM t WHERE id = $2`);
  });

  it("转义收尾引号与后面另一个字面量并存：两处都认得", async () => {
    invokeMock.mockResolvedValue(1);
    const backend = new TauriSqlBackend();

    // 三个字面量：中间那个以转义撇号收尾（`'it''s'`），前后各有一个真 `?`
    await backend.transactional([
      { sql: `SELECT * FROM t WHERE a = '?' AND label = 'it''s' AND b = '?' AND id = ?`, params: ["p1"] },
    ]);

    const stmts = (
      invokeMock.mock.calls[0]![1] as { stmts: { sql: string }[] }
    ).stmts;
    expect(stmts[0]!.sql).toBe(`SELECT * FROM t WHERE a = '?' AND label = 'it''s' AND b = '?' AND id = $1`);
  });

  it("零误杀对照组：合法字面量照常翻译，只有 ? 才编号", async () => {
    invokeMock.mockResolvedValue(1);
    const backend = new TauriSqlBackend();

    await backend.transactional([
      { sql: `INSERT INTO t (a, b, c) VALUES ('inline', 'it''s fine', ?)`, params: [9] },
      { sql: `SELECT n FROM pragma_table_info('projects') WHERE name = ?`, params: ["x"] },
    ]);

    const stmts = (
      invokeMock.mock.calls[0]![1] as { stmts: { sql: string }[] }
    ).stmts;
    expect(stmts.map((s) => s.sql)).toEqual([
      `INSERT INTO t (a, b, c) VALUES ('inline', 'it''s fine', $1)`,
      `SELECT n FROM pragma_table_info('projects') WHERE name = $1`,
    ]);
  });

  /**
   * fail-closed 挪到了**可判的形状**上：引号或注释不闭合时抛，那种 SQL 本来就是坏的。
   * 抛在入队之后（翻译是入队任务的第一步），但队列不留污——enqueue 的两条腿保住了后续语句。
   */
  it.each([
    ["引号没闭合", `SELECT ? FROM t WHERE a = 'oops`],
    ["方括号没闭合", `SELECT [col? FROM t`],
    ["块注释没闭合", `SELECT ? /* 没关`],
  ])("%s 就抛，且一条语句都不发出", async (_label, sql) => {
    invokeMock.mockResolvedValue(1);
    const backend = new TauriSqlBackend();

    await expect(
      backend.transactional([
        { sql: `INSERT INTO a (x) VALUES (1)`, params: [] },
        { sql, params: [] },
      ]),
    ).rejects.toThrow("没有闭合");

    // 整批都不发：stmts.map 在进入 invoke 之前求值，坏的那条让整批停在门口
    expect(invokeMock).not.toHaveBeenCalled();
    // 队列没被污染：下一条合法语句照常发出
    await backend.transactional([{ sql: `INSERT INTO a (x) VALUES (?)`, params: [2] }]);
    expect(invokeMock).toHaveBeenCalledTimes(1);
  });
});

describe("TauriSqlBackend 读路与环境判定", () => {
  it("select 也做 ? → $n，并按插件返回值给出行数组", async () => {
    sqlPlugin.select.mockResolvedValue([{ n: 1 }]);
    const backend = new TauriSqlBackend();

    const rows = await backend.select<{ n: number }>(
      `SELECT count(*) AS n FROM pragma_table_info(?) WHERE name = ?`,
      ["projects", "description"],
    );

    expect(rows).toEqual([{ n: 1 }]);
    expect(sqlPlugin.select).toHaveBeenCalledWith(
      `SELECT count(*) AS n FROM pragma_table_info($1) WHERE name = $2`,
      ["projects", "description"],
    );
  });

  it("非桌面环境不会误走这条后端（index.ts 的分派口）", () => {
    const g = globalThis as unknown as { window?: unknown };
    expect(g.window).toBeUndefined();
    expect(isTauriEnvironment()).toBe(false);

    g.window = { __TAURI_INTERNALS__: {} };
    try {
      expect(isTauriEnvironment()).toBe(true);
      g.window = {};
      expect(isTauriEnvironment()).toBe(false);
    } finally {
      delete g.window;
    }
  });
});
