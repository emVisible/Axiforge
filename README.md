# Axiforge

角色优先的叙事创作平台：**桌面版是主产品**（离线优先，本地 SQLite + 本地素材），Web 版冻结为协作/发布服务（ADR-024）。

创作端是「演出即所得」的三轨工作台（剪辑 / 剧本 / 结构），运行端是记得你的 RN Player，作品可导出为 `.axsp` 工程包交给别人。

> 用户文档（含桌面版与 AXS 语法）：开发时访问 http://localhost:5174/docs ，源码在 `docs/user/`。

## Quick start

**Prerequisites:** Node 18+, pnpm, Python 3.11+, [uv](https://github.com/astral-sh/uv), PostgreSQL 14+（或 Docker）

### 方式 A：本机 PostgreSQL

```bash
pnpm setup    # 建库 + 建表（首次）
pnpm dev      # 并行启动 API + Web + Admin + Nexus
# 或 tmux 分 session：./dev.bash
```

### 方式 B：Docker 数据库

```bash
pnpm db:up
# 将 backend/.env 中 DATABASE_URL 改为：
# postgresql+asyncpg://axiforge:axiforge@localhost:5432/axiforge
pnpm setup
pnpm dev
```

| 服务 | 地址 |
|------|------|
| Web | http://localhost:5174 |
| Admin | http://localhost:5175 |
| Nexus | http://localhost:5274 |
| API | http://localhost:8000 |
| Health | http://localhost:8000/health |

端口定义见 `scripts/ports.mjs`。

用户文档（AXS 语法等）：开发时访问 http://localhost:5174/docs ，源码在 `docs/user/`。

## Scripts

| 命令 | 说明 |
|------|------|
| `pnpm dev` | 并行启动 API + Web + Admin + Nexus |
| `./dev.bash` | tmux：每个应用独立 session（`./dev.bash stop` 停止） |
| `pnpm dev:web` / `dev:admin` / `dev:nexus` / `dev:api` | 单独启动某一服务 |
| `pnpm dev:desktop` | 起 Tauri 壳（自动拉起 web dev server）；DEV 下会跑壳内存储冒烟 |
| `pnpm build:desktop` | 产出 `Axiforge.app` 与 `.dmg`（未签名） |
| `pnpm build` | 构建前端（web + admin） |
| `pnpm gates` | **一条命令跑完前端门禁**：tsc×4 → vitest×5（core/axs/editor-core/web/admin） → **coverage 阈值（G2：`core` 与 `editor-core` 行+分支 ≥90%）** → oxlint+颜色令牌 → 内核纯净度 → 循环依赖 → 行数棘轮 → 双主题对比度 → 共享组件源扫描（`check:ui-source`） |
| `pnpm typecheck` / `test:unit` / `coverage` / `lint` | 上述门禁的分项 |
| `pnpm check:purity` | 断言 `core`/`axs`/`editor-core` 零 React/DOM/网络/平台依赖 |
| `pnpm check:circular` | dpdm 循环依赖 = 0 |
| `pnpm check:labels` | 表单标签的编程关联棘轮：`htmlFor` / 命名分组（id 须真被 `aria-labelledby` 引用）/ 包裹型之外新增一处即失败（具名豁免在 `scripts/label-association-baseline.json`） |
| `pnpm check:dispatch` | 分派口（`shared/storage/*Saves.ts`）里每个导出 async 函数都必须有本地分支——桌面唯一化后，"只走云端"的新函数就是给桌面留一个静默失败的入口 |
| `pnpm check:desktop` | Tauri 壳的 `cargo check`（Rust 侧类型与权限面）。**刻意不进 `pnpm gates`**：gates 只跑 JS，合并进去会让没有 Rust 工具链的人连门禁都跑不动；实测本地 21s（预热 target），冷缓存需拉 Tauri 依赖树 |
| `pnpm e2e` | Playwright 行为基线（独立库 `axiforge_e2e`，自包含起服务）。**同树互斥**：起跑前抢 `.e2e-lock`，已被占用就退出并打印持有者 PID |
| `pnpm e2e:desktop` | 桌面态基线：**只起 vite、不起后端**（`playwright.desktop.config.ts`，后端基线 `baselines` 不在其中）；与 `pnpm e2e` 共用同一把 `.e2e-lock` |
| `pnpm test:api` | 后端集成测试。**跑在 `<DATABASE_URL 库名>_test` 上**（缺库会自动建，需要 CREATE DATABASE 权限），每个会话把表清成空集，开发库零接触——测试造的审核案件带 `raw`，混进 dev 台账会被 `calibrate --from-answers` 当成真标注（ADR-028 D28） |
| `pnpm setup` | 初始化 PostgreSQL 数据库与表 |
| `pnpm db:up` / `db:down` | 启动 / 停止 Docker PostgreSQL |

## Structure

```
packages/
  core/            L0 叙事 IR + 引擎 + TS StoryCompiler（零 UI 依赖）
  axs/             L1 AXS 文本语言 parser/printer（指令级行锚点）
  editor-core/     L2–L4 内核：Draft/Transaction/Journal、投影、StorageProvider、.axsp 容器
  ui/              设计令牌与共享组件（ImageUpload 等）
apps/
  web/             L5 宿主：Studio 三轨工作台 / Player / 角色工作台 / 发现页 / 文档站
  desktop/         Tauri v2 壳（本地 SQLite + 本地素材目录 + asset 协议）
  admin/           运营治理后台
  nexus/           Electron 笔记应用（独立，不在 pnpm build 内）
backend/
  app/main.py      FastAPI 入口（backend/main.py 为兼容 shim）
  app/domains/     character / narrative / assets / runtime / platform / llm / ginkgo / nexus
docs/
  REFACTOR_DESKTOP.md  desktop 分支执行宪章与阶段计划
  KERNEL_DESIGN.md     L2–L4 内核构建规约
  ADR/                 架构决策记录
  user/                用户文档（开发时见 http://localhost:5174/docs）
```

分层与依赖方向铁律见 `docs/KERNEL_DESIGN.md`；桌面化战略与阶段验收见 `docs/REFACTOR_DESKTOP.md`。

## Database

开发环境：`pnpm setup` 会执行 `alembic upgrade head` 建表。应用启动时 `init_db()` 作为幂等兜底（`create_all`）。

生产/演进环境：

```bash
cd backend
uv run alembic upgrade head
```

迁移链：

| Revision | 说明 |
|----------|------|
| `20260706_000` | 全量 baseline（19 张表） |
| `20260706_001` | 删除遗留 `asset_characters` / `asset_plugins` |

已有开发库若曾手动跑过 `001`，可执行 `uv run alembic stamp head` 对齐版本号。

## Deploy (Vercel)

根目录 `vercel.json` 将 `/api`、`/uploads`、`/health` 代理到 `backend/src/main.py`，静态资源与 SPA 路由由 `apps/web/dist` 提供。部署前在 Vercel 项目设置 `DATABASE_URL` 等环境变量。

## Environment

复制 `backend/.env.example` 为 `backend/.env`，按需修改 `DATABASE_URL`。
