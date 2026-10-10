/**
 * `scripts/ports.mjs` 的类型面。
 * 存在理由：`ports.mjs` 是 node 脚本与 Vite 配置共用的端口表，而 `tsc -b` 在 `moduleResolution: bundler`
 * 下不给 `.mjs` 推断类型（TS7016）。转成 `.ts` 会让 `.mjs` 侧的 node 入口断掉，所以走同名声明文件。
 * 只声明形状：**数字的唯一真相源是 `scripts/ports.json`**，`ports.mjs` 是它的派生视图（origins / corsOrigins）。
 */
export declare const PORTS: {
  readonly api: number;
  readonly web: number;
  readonly admin: number;
  readonly nexus: number;
};

export declare const origins: {
  readonly api: string;
  readonly web: string;
  readonly admin: string;
  readonly nexus: string;
};

/** FastAPI `allow_origins` 用的一组来源（含 127.0.0.1 变体） */
export declare const corsOrigins: readonly string[];
