# Axiforge

**桌面互动叙事创作器**：用 AXS 编写剧本，在剪辑视图编排演出、在结构视图检查分支，并即时预览。三种视图编辑同一份叙事工程；作品以 `.axsp` 文件本地保存与交付。

桌面应用是唯一默认产品入口（Tauri + 本地 SQLite + 本地素材）。`apps/web` 是桌面 renderer 与测试宿主；Admin、Nexus 和 API 是显式启动的内部/迁移工具，不属于桌面创作主流程。

> 用户文档（含桌面版与 AXS 语法）：开发时访问 http://localhost:5174/docs ，源码在 `docs/user/`。

## Quick start

**桌面开发依赖：** Node 20（CI 同档）、pnpm 10.8.1（`packageManager` 字段钉住）、Rust stable，
以及 macOS Xcode Command Line Tools。

```bash
pnpm install
pnpm dev      # 启动 Axiforge 桌面应用；Tauri 自动启动 renderer
pnpm gates    # 一条命令跑完前端门禁
```

需要调试旧多服务栈时，额外安装 Python 3.11+、uv、PostgreSQL 14+（或 Docker），再显式运行：

```bash
pnpm dev:stack
# 或 ./dev.bash all（tmux）
```

## Scripts

门禁条数与命令清单**以 `package.json` 的 `scripts.gates` 为准**，本表不抄一份——
抄进文档的清单会在加门禁那天变假，而一个假的清单比没有更坏（这一条是本仓库自己吃过的亏）。

```bash
pnpm gates     # 一条命令跑完前端门禁（当前 15 道）
pnpm gates:ci  # 同上，外加覆盖率阈值
```

各道门禁断言什么、以及它们当前的自报读数，由**脚本自己打印**（跑一次就有）。
下表只给一句话定位与"去哪看证据"，证据本体在 `docs/REFACTOR.md` 与 `docs/HANDOFF.md`。

### 开发

| 命令 | 说明 |
|------|------|
| `pnpm dev` | 默认启动 Axiforge Tauri 桌面应用（桌面是唯一默认产品入口） |
| `pnpm dev:desktop` | 同上；DEV 下会跑壳内存储冒烟 |
| `./dev.bash` | tmux 启动桌面应用（`./dev.bash stop` 停止） |
| `pnpm dev:stack` / `./dev.bash all` | 显式启动旧 API + Web + Admin + Nexus 调试栈（迁移期用，非桌面创作前置） |
| `pnpm dev:web` / `dev:admin` / `dev:nexus` / `dev:api` | 单独启动内部服务 / 测试宿主 |
| `pnpm build` | 构建 macOS 桌面应用 `.app` |
| `pnpm build:desktop` | `pnpm build` 的显式别名 |
| `pnpm build:dmg` | 额外打包 `.dmg` 安装盘 |
| `pnpm build:web` / `pnpm build:admin` | 单独构建 renderer / 内部 Admin |

### 门禁（在 `gates` 链上）

| 命令 | 断言什么 | 当前自报 |
|------|----------|----------|
| `pnpm typecheck` | tsc：五个包 + web + e2e | 通过 |
| `pnpm test:unit` | vitest：core / axs / editor-core / web / admin | 796 passed + 1 skipped |
| `pnpm coverage` | `core` 与 `editor-core` 行+分支 ≥90% | 过线 |
| `pnpm lint` | oxlint + 颜色令牌 / 字号棘轮 | 硬编码色 0 |
| `pnpm check:purity` | `core`/`axs`/`editor-core` 零 React/DOM/网络/平台依赖 | 0 违规 |
| `pnpm check:circular` | dpdm 循环依赖 | 0 |
| `pnpm check:size` | 文件行数棘轮（新文件 400） | 扫 350 个文件、0 越线 |
| `pnpm check:labels` | 表单标签的程序关联 | 扫 205 个文件、裸标签 0 |
| `pnpm check:dispatch` | 分派口的每个导出 async 函数都有本地分支 | 6 个分派口、32 个导出 async |
| `pnpm check:citations` | 文档里写的 `路径:行号` 必须存在且在范围内 | 扫 47 个文档、不存在 0 |
| `pnpm check:publish` | 发布目标残差棘轮（ADR-029） | 残差 4 条全在册 |
| `pnpm check:seams` | 触壳模块必须有真判据 | 接缝 9、有判据 6（真断言 102） |
| `pnpm check:dead-surface` | 真入口 import 闭包外的模块逐条在册 | 面 296、闭包外 10 全在册 |
| `pnpm check:contrast` | 双主题对比度达 AA | 32 组配对达 AA |
| `pnpm check:ui-source` | 两个界面入口都扫 `packages/ui` 的源 | 通过 |

### 存在但**不在** `gates` 上的检查

这几条各有不进链的理由（gates 必须在那台没装 Rust / 没起数据库的机器上也跑得动）。
"不在链上"不等于"不重要"，也不等于"它绿"——**跑它才有读数**。

| 命令 | 为什么不在链上 | 断言什么 |
|------|------------------|----------|
| `pnpm check:desktop` | 需要 Rust 工具链 | Tauri 壳的 `cargo check`（类型与权限面） |
| `pnpm check:tracked` | 它红的原因需要人的授权才能解（把那批文件提交进去） | 链上脚本与其基线是否都被 git 跟踪 + 编译缺口 |
| `pnpm check:apibase` | 验收①口径待定档 | `/api/v1` 只剩测试宿主 / 注释 / 基址定义三处，越界调用点必须 0 |
| `pnpm check:http-inventory` | 需要一个活着的 web 服务 | 桌面态 / 浏览器态的云端调用普查（请求一律本地 abort） |
| `pnpm cloud:callmap` | 同上（配 `LOADFACE=` 才跑全腿） | 云端调用 × 判据台账对账 |
| `pnpm e2e` / `pnpm e2e:desktop` | 需要浏览器与（前者）数据库 | 行为基线；两套同树互斥，抢 `.e2e-lock` |

> `pnpm check:tracked` **当前 exit 1**：它的两条判据自证对照组（`CG_CONTROLS`）断言
> `condition.ts` / `clipboard.ts` "应当未跟踪"，而两者现在都已被正确跟踪 ⇒ 对照组过期。
> 它**真正查的那件事已经修好**（已跟踪 19 / 未跟踪 0、编译缺口 0 个模块 0 处）。
> 判据设计的修法与证据见 `docs/REFACTOR.md` 第十四节。

### 后端（迁移期）

| 命令 | 说明 |
|------|------|
| `pnpm test:api` | 后端集成测试，跑在 `<DATABASE_URL 库名>_test` 上（缺库自动建），开发库零接触 |
| `pnpm setup` | 初始化 PostgreSQL 数据库与表 |
| `pnpm db:up` / `pnpm db:down` | 启动 / 停止 Docker PostgreSQL |

## Structure

```
packages/
  core/            L0 叙事 IR + 引擎 + TS StoryCompiler（零 UI 依赖）
  axs/             L1 AXS 文本语言 parser/printer（指令级行锚点）
  editor-core/     L2–L4 内核：Draft/Transaction/Journal、投影、StorageProvider、.axsp 容器
  ui/              设计令牌与共享组件（ImageUpload 等）
apps/
  web/             桌面 renderer 与浏览器测试宿主；云端/发现功能按 S13 收敛退场
  desktop/         Tauri v2 壳（本地 SQLite + 本地素材目录 + asset 协议）
  admin/           内部运营工具，不属于桌面创作产品
  nexus/           独立笔记工具，不属于桌面创作产品
backend/
  app/main.py      迁移期 API 与测试宿主（计划按 S13 退场）
  app/domains/     迁移期服务端域；桌面创作不以其运行作为前置
docs/
  HANDOFF.md        交接快照：当前边界、待决项按谁能推进分档、禁区
  REFACTOR.md       主线执行宪章与阶段计划
  KERNEL_DESIGN.md  L2–L4 内核构建规约
  ADR/              架构决策记录
  user/             用户文档
```

文档地图与接手顺序见 [`docs/README.md`](docs/README.md)。

分层与依赖方向铁律见 `docs/KERNEL_DESIGN.md`；桌面化战略与阶段验收见 `docs/REFACTOR.md`；
**要接手桌面化剩下的工作，先读 `docs/HANDOFF.md`**（它登记边界与待决形状，不替代上面两份）。

## Legacy Web / API Development

PostgreSQL 与 API 仅供旧栈调试、迁移与回归测试使用，不是桌面创作器的运行依赖（`vercel.json` 那条见下方「Legacy Web Deployment」，它当前构建不起来）。相关实现按 `docs/REFACTOR.md` 的 S13 顺序处置。

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

## Legacy Web Deployment (Frozen)

根目录还留着 `vercel.json`（tracked，自 v0.1）：它把 `/api`、`/uploads`、`/health` 指向 `backend/src/main.py`，静态与 SPA 路由指向 `apps/web/dist`。

**但它今天构建不起来**：那份配置声明的入口 `backend/src/main.py` 在仓库里不存在（真实入口是 `backend/app/main.py`，`backend/main.py` 只是兼容 shim，2026-09-30 实测）。
是否曾实际连接过 Vercel 项目，本会话看不到远端集成，不作判断。唯一发行目标是桌面应用（ADR-029），
`vercel.json` 的处置（删 / 修入口 / 留作文物）归 S13 那条线，需要人类定档——在那之前**不要按这份配置去部署**。

## Environment

复制 `backend/.env.example` 为 `backend/.env`，按需修改 `DATABASE_URL`。
