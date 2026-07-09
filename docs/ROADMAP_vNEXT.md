# Axiforge vNext 战略：创作做透 + UGC 平台

> ⚠️ **已被取代**：本文档的里程碑排序（§5）已由 [`ROADMAP_FINAL.md`](./ROADMAP_FINAL.md) 取代；其中"做透"验收标准、UGC 克制顺序等原则被最终版继承。保留本文档作为决策演进记录。
>
> **文档性质**：下个大版本（v1.1–v1.5）产品与技术路线图  
> **最后更新**：2026-07-07  
> **前置**：v1.0 融合重构已完成，详见 `REFACTOR_PLAN.md`

---

## 0. 战略决策（已拍板）

| 决策 | 含义 |
|------|------|
| **先巩固创作体验** | 不急着上 AI / 世界 tick / Unity |
| **做透** | 每个子功能单独拆出来都够上线 |
| **不头重脚轻** | 不做「平台壳很大、工具很空」 |
| **UGC 平台** | 最终形态是创作者发布 + 玩家消费 |
| **Lite 做好** | Player 是体验终点；Unity 是 N 个版本后的事 |

**核心方向不能丢：**

> 角色优先 → 关系持续 → 记忆驱动 → 跨剧本复用 IP

UGC 是**放大器**，不是替代品。没有够硬的创作工具，UGC 只会变成空壳市场。

---

## 1. v1.0 基线（已完成）

### 主路径

```
Character Studio → Script Studio (Flow) → Lite Player
```

### 技术栈

| 层 | 技术 |
|---|---|
| 前端 | React 19 + Vite + React Router 8 + TanStack Query + React Flow + Tailwind 4 |
| 后端 | FastAPI + SQLAlchemy async + PostgreSQL 14 |
| Monorepo | pnpm workspace（`apps/web` + `packages/ui`） |
| 部署 | Vercel（前端静态 + Python serverless API） |
| CI | GitHub Actions：`pnpm build` + Postgres + pytest |

### 目录结构

```
Axiforge/
├── apps/web/
│   ├── apps/studio/          剧本 / 道具 / 场景 / Flow
│   ├── apps/player/          Lite VN Player（深色全屏）
│   └── modules/character/    Character Studio（六层编辑 + 关系图）
├── packages/ui/              27 个共享组件 + design tokens
├── backend/
│   ├── src/main.py           唯一 API 入口
│   └── app/                  routes / models / services
├── docs/REFACTOR_PLAN.md     完整重构蓝图
└── docs/ADR/001-...          六层模型决策
```

### 已验证能力

- `pnpm dev` → Web :5174 + Admin :5175 + Nexus :5274 + API :8000（见 `scripts/ports.mjs`）
- `pnpm test:api` → 5 个集成测试全绿
- Alembic：`20260706_000` baseline → `20260706_001` drop legacy
- UI：Studio 纸感（brand `#3b3473` + canvas `#f8f7f4`）；Player 暗色 VN

### 已知技术债（v1.0 刻意保留）

| 项 | 说明 |
|---|---|
| 六层 vs 四子系统 | 创作用六层 JSONB，运行时四子系统未实现（ADR-001） |
| `core/` / `shared/` | DSL 引擎包预留，未接入 Player 主路径 |
| Player 条件引擎 | 逻辑在 `backend/app/services/player.py`，未抽象为 RuntimeEngine |
| 认证 | `author_id = "anonymous"`，无 JWT |
| 前端 bundle | ~766KB，未 code-split |

---

## 2. 产品哲学（不变）

### 一句话

**Axiforge = 角色优先的叙事 IP 资产管理与创作平台**

创作者在一个产品里完成「造角色 → 编剧本 → 跑体验」；角色跨剧本复用、关系可追踪、记忆可积累。

### 叙事操作系统五维

| 维度 | 问题 | 模块 |
|------|------|------|
| **Overall** | 氛围 / 主题 / 时间线 | Project 元数据 + Timeline（规划） |
| **Project** | 整体信息 | 剧本容器 |
| **Character (Who)** | 谁在行动 | 六层人格 + 运行时状态 + 关系网 |
| **Scene (Where)** | 在哪里 | 大场景嵌套小场景 |
| **Event (What)** | 发生什么 | 图节点 + 条件 + 效果 + 记忆 |
| **Item (How)** | 用什么 | 道具 + 机制标签 |

### 三大长期核心理念

1. **关系持续性** — 角色记得玩家与彼此
2. **记忆驱动** — 条件匹配依赖 SessionMemory / Flag，而非纯分支树
3. **世界可演化** — v1.5+ 才做自动推进；v1.0 仍是「创作者预设图 + 玩家手动触发」

### 角色模型双线（ADR-001）

| 线 | 用途 | v1.0 状态 |
|---|---|---|
| **六层创作模型** | Anchor / Contour / Demeanor / Psyche / Trace / Bond | ✅ 完整可用 |
| **四子系统运行时** | Identity / Presentation / Cognition / Social | ❌ 仅规划，v1.5+ 映射层 |

---

## 3. 四条产品线（每条都应能单独上线）

```
┌─────────────────────────────────────────────────────────┐
│                    UGC 层（发现 / 发布 / Fork）              │  ← 最后加壳，设计提前留
├──────────────┬──────────────┬──────────────┬──────────────┤
│ Character    │ Script       │ Asset        │ Lite         │
│ Studio       │ Studio       │ Library      │ Player       │
│              │ (Flow)       │              │              │
│ 六层+关系+   │ 图编辑+条件+ │ 道具+场景+   │ VN体验+记忆+ │
│ 传记+版本    │ 效果+角色绑定│ 机制标签     │ 关系+分支    │
└──────────────┴──────────────┴──────────────┴──────────────┘
         ↑ 全部汇入「剧本 Project」容器 ↑
```

### 「做透」验收标准（每条产品线）

- 新用户 **30 分钟内** 能独立完成一条 happy path
- 产出物 **可公开、可被 Fork、可被 Player 消费**
- 有 **Empty / Error / Loading** 完整态，不是 demo 级
- 有 **至少 1 个集成测试或 E2E** 覆盖主路径

---

## 4. 优先级：先深后广

### ✅ 该做（v1.1 → v1.5 主线）

| 优先级 | 模块 | 为什么先做 | 「做透」长什么样 |
|--------|------|-----------|-----------------|
| **P0** | **Script Studio + Flow** | 创作主路径中枢 | 10+ 节点图、条件可读可测、保存可靠、一键试玩 |
| **P0** | **Lite Player** | UGC 消费端 | 记忆/标志驱动分支、关系/好感可见、立绘 polish、Studio 一键进入 |
| **P1** | **Character Studio** | v1.0 最成熟，需达独立产品级 | 公开角色库、Fork、Prompt 导出、关系图性能、版本 diff |
| **P1** | **Asset Library** | 场景/道具是剧本血肉 | 机制标签可用、场景嵌套引用、剧本内搜索绑定 |
| **P2** | **UGC 发布壳** | 平台身份，依赖上面四条 | 公开/私有、列表/搜索/标签、Fork、作者页、播放次数 |
| **P2** | **Runtime 条件统一** | 记忆驱动核心，可渐进 | Graph 条件 ≡ Player 条件，共用 schema，Editor 可模拟 |

### ❌ 暂不做（防头重脚轻）

| 不做 | 理由 |
|------|------|
| Unity Full Player | 推迟到 N 个版本后 |
| AI 节点 / 世界 tick | 创作工具未做透前，会掩盖工具短板 |
| 社区大厅 / 模板市场 | 先有可发布作品，再有市场 |
| 六层 → 四子系统 Big Bang | ADR-001；最多做只读映射 |
| Event Sourcing / CQRS | 工程复杂度与 UGC 价值不成比例 |
| JWT / 多租户 | 可用 `author_id` + 后续 auth；不阻塞创作 |

### 远期（v2.0+，仅规划）

| 版本 | 内容 |
|------|------|
| v2.0 | AI 节点；世界 tick；社区大厅扩展 |
| v2.5+ | Unity Full Player（Event/State JSON 协议） |

---

## 5. 版本路线：v1.x 创作深度轨

### Milestone 1 — v1.1「可试玩剧本」（约 1–2 周）

**用户感知：** 在 Studio 里写完 Flow，点「试玩」稳定进 Player 跑完。

| 范围 | 内容 |
|------|------|
| Flow | 节点校验（悬空边、无入口）、自动保存反馈、试玩入口 |
| Player | 起始节点逻辑稳定、HUD 显示 memory/flag、返回 Studio |
| 联调 | Project 创建 → 绑角色 → 画 3 节点 → 试玩 → 产生 memory |

**验收：** E2E：创建剧本 → Flow → Player 分支 → 断言 memory/flag。

---

### Milestone 2 — v1.2「条件做透」（约 2 周）

**用户感知：** 分支由「之前选过什么 / 好感多少 / 有没有某 flag」驱动。

| 范围 | 内容 |
|------|------|
| 条件 | `schemas/condition.py` 前后端统一；Flow 面板可配 memory/flag/affection |
| Player | `player.py` 完整评估条件；不满足的边不展示 |
| 编辑器 | 条件模拟器（假 memory 预览会走哪条边） |

**验收：** 测试覆盖 3 种条件类型；Graph 与 Player 行为一致。

> 这是「记忆驱动」的第一块实锤，比上 AI 更符合核心方向。

---

### Milestone 3 — v1.3「Character 可独立发布」（约 2 周）

**用户感知：** Character Studio 单独拿出来也能用——造角色、公开、被 Fork、进剧本。

| 范围 | 内容 |
|------|------|
| 公开库 | 探索页筛选/排序、角色详情 |
| Fork | Fork 后独立编辑、保留 attribution |
| 质量 | 关系图大图性能、版本回滚、图片上传稳定 |
| 剧本引用 | EntitySearchSelect 搜公开角色、locked_version |

**验收：** 不创建剧本，仅「创建 → 公开 → 被 Fork → 导出 Prompt」闭环。

---

### Milestone 4 — v1.4「Asset + 剧本发布」（约 2 周）

**用户感知：** 道具/场景也是 IP；整份剧本可标记公开。

| 范围 | 内容 |
|------|------|
| Asset | 道具 mechanism_tags 在 Flow 效果里可用；场景嵌套 |
| Project | 封面、简介、标签、is_public、view_count |
| 列表 | Studio 首页展示公开剧本/角色/道具 |

**验收：** 公开剧本在列表可见 → 他人打开 → Fork 或 Play。

---

### Milestone 5 — v1.5「UGC 最小平台」（约 2–3 周）

**用户感知：** Axiforge 像 narrative UGC 平台，而不只是本地工具。

| 范围 | 内容 |
|------|------|
| 发现 | 统一搜索/分类：角色、剧本、道具、场景 |
| 作者 | 作者页（`author_id` 下的作品列表） |
| 播放 | Player 独立 URL `/play/:projectId` |
| 数据 | 播放/浏览计数 |

**验收：** 新用户 → 浏览公开内容 → Play 一条线 → Fork 一个角色。

**仍不做：** 评论、关注、打赏、AI。

---

## 6. Lite Player「做好」清单

Unity 不做，Lite 承担 **「体验即产品」**：

| 维度 | v1.0 | vNext 目标 |
|------|------|-----------|
| 视觉 | 暗色底 + 对话框 | 立绘位、表情切换、场景背景、过渡动画 |
| 交互 | 点击继续 | 打字机速度、跳过、历史回看、选项 hover |
| 叙事 | dialogue + choices | 旁白、角色名、portrait 对齐 Workshop 头像 |
| 系统 | memory/flag 后端有 | HUD 可读、条件失败有反馈、结束页 summary |
| 关系 | CharacterRuntimeState | 好感/关系 tag 变化时 UI 提示 |
| 入口 | 手动导航 | Studio「试玩」、公开链接 `/play/:id` |
| 性能 | 够用 | 预加载下一段、图片 lazy load |

Player 做透 = **UGC 平台能留人**；否则只有创作工具，没有消费闭环。

---

## 7. UGC 平台 vs 创作工具：顺序

```
错误顺序：先做大厅 → 发现没内容 → 再做工具
正确顺序：工具做透 → 内部 dogfood 产出 10 份作品 → 再开公开列表
```

### UGC 最小集（v1.5 够用）

- `is_public` + 列表 + 搜索 + Fork + view/play count

### v1.5 暂不做

- 评论、社交 graph、推荐算法、付费

### 创作工具分层

| 层级 | 含义 | 版本 |
|------|------|------|
| **基本** | 能完成闭环、能公开 | v1.1–v1.2 |
| **完善** | 单独拆出来仍好用、有专业感 | v1.3–v1.4 |
| **平台** | 发现、Fork、作者身份 | v1.5 |

---

## 8. 待拍板 ADR（开工前）

| ID | 议题 | 选项 |
|----|------|------|
| ADR-002 | 试玩 vs 正式 Play | 试玩用 ephemeral session；正式 Play 是否持久化存档？ |
| ADR-003 | 公开内容策略 | 仅 `is_public` 无审核 vs 「仅链接可访问」 |
| ADR-004 | Fork 许可证 | Fork 时是否强制保留 attribution |
| ADR-005 | 条件表达 | 继续 JSON schema vs 引入 `.rn` 子集（建议 schema 先行） |
| ADR-006 | 用户身份 | UGC 前接简易 auth vs 长期 anonymous + 后期迁移 |

---

## 9. 四条产品线「独立上线」Checklist

### Character Studio

- [ ] 创建 / 编辑六层角色
- [ ] 关系 D3 图（50+ 节点不卡）
- [ ] 传记 Markdown + 版本历史 + Fork
- [ ] Prompt 导出（4 格式）
- [ ] 图片上传 + 公开/私有
- [ ] 探索页 + 搜索 + Fork
- [ ] 集成测试：创建 → 公开 → Fork

### Script Studio (Flow)

- [ ] 创建剧本 + 默认主场景
- [ ] React Flow 10+ 节点编辑
- [ ] 条件 / 效果面板完整
- [ ] 绑定 Character Studio 角色
- [ ] 节点校验 + 自动保存
- [ ] 一键试玩 → Player
- [ ] 集成测试：3 节点 + 条件分支

### Asset Library

- [ ] 道具 CRUD + mechanism_tags
- [ ] 场景 CRUD + 嵌套引用
- [ ] 剧本内搜索绑定
- [ ] 公开/私有 + 列表
- [ ] Flow 效果可引用道具

### Lite Player

- [ ] 打字机 + 跳读 + 历史
- [ ] 立绘 + 头像 + 表情
- [ ] 分支选择 + 条件过滤
- [ ] memory/flag HUD
- [ ] 好感/关系变化提示
- [ ] 结束页 summary
- [ ] `/play/:projectId` 独立入口
- [ ] 集成测试：分支 + memory/flag 写入

---

## 10. 新 Window 规划提示词

```markdown
# Axiforge vNext 规划 — 创作做透 + UGC 平台

## 战略约束（已拍板）
- 优先：巩固创作体验、深度完善项目，不偏离「角色优先 + 记忆驱动 + 关系持续」
- 每个子功能做透：Character Studio / Script Studio / Asset Library / Lite Player 都应能单独上线
- 平台定位：UGC 平台 + 基本且完善的创作工具
- Lite Player 做好；Unity 推迟到 N 个版本后
- 避免头重脚轻：不做 AI 节点、世界 tick、Unity、大型社区功能，直到四条产品线达标

## 必读文档
- docs/ROADMAP_vNEXT.md（本文档）
- docs/REFACTOR_PLAN.md
- docs/ADR/001-six-layer-character-model.md

## 请基于以上约束，输出：
1. 当前 Milestone（v1.x）的细化任务拆分（用户故事 + 技术任务 + 验收）
2. 指定模块的「独立上线」差距分析
3. Lite Player polish 具体 PR 序列
4. ADR-002~006 建议决策
5. 与 v1.0 主路径的兼容策略

回复简体中文。小步交付，每 milestone 可独立 ship。
```

---

## 11. 相关文档

| 文档 | 内容 |
|------|------|
| `REFACTOR_PLAN.md` | v1.0 融合蓝图（已完成） |
| `ADR/001-six-layer-character-model.md` | 六层 vs 四子系统 |
| `README.md` | 启动与架构 |

---

*本文档随 v1.x 实施进展更新。偏离须在 `docs/ADR/` 记录。*
