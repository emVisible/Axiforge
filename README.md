# Axiforge

Narrative simulation platform — character studio, script editor, lite player.

## Quick start

**Prerequisites:** Node 18+, pnpm, Python 3.11+, [uv](https://github.com/astral-sh/uv), PostgreSQL 14+（或 Docker）

### 方式 A：本机 PostgreSQL

```bash
pnpm setup    # 建库 + 建表
pnpm dev
```

### 方式 B：Docker 数据库

```bash
pnpm db:up
# 将 backend/.env 中 DATABASE_URL 改为：
# postgresql+asyncpg://axiforge:axiforge@localhost:5432/axiforge
pnpm setup
pnpm dev
```

- Web: http://localhost:5174
- API: http://localhost:8000
- Health: http://localhost:8000/health

## Scripts

| 命令 | 说明 |
|------|------|
| `pnpm dev` | 并行启动 Web + API |
| `pnpm build` | 构建前端 |
| `pnpm test:api` | 运行后端集成测试 |
| `pnpm setup` | 初始化 PostgreSQL 数据库与表 |
| `pnpm db:up` | 启动 Docker PostgreSQL |
| `pnpm db:down` | 停止 Docker PostgreSQL |

## Structure

```
apps/web/
  apps/studio/       剧本 / 道具 / 场景 / Flow 编辑器
  apps/player/       Lite VN Player
  modules/character/ Character Studio（页面 + 组件）
  components/ui/     App 专属 UI + @axiforge/ui 重导出
backend/
  src/main.py        唯一 API 入口（main.py 为兼容 shim）
  app/               FastAPI 路由 / 模型 / 服务
packages/ui/       共享设计系统
docs/              架构与重构文档
```

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
