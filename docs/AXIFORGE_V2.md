# Axiforge v2 大版本规划（Grove 收敛版）

> **文档性质**：v2 阶段唯一执行基准，接替 [LAYOUT_V4.md](./LAYOUT_V4.md) 功能收尾与 [REFACTOR_V4.md](./REFACTOR_V4.md) 平台化阶段。  
> **最后更新**：2026-07-09  
> **北极星**：以 Axiforge 为统一平台核心；首波 Canopy 社群闭环，并行 RN 成就与 Nexus 数据总线。

---

## Grove → Axiforge 模块映射

| 原模块 | v2 落地 | 状态 |
|--------|---------|------|
| Axiforge | `apps/web` Studio + Player + Cut | 核心 |
| Canopy | `features/discover` + platform 评论/搜索 | 波次 1 |
| Pota | `backend/domains/llm` | 已交付 |
| Ginkgo | `backend/domains/ginkgo` | 波次 2 |
| Nexus | `apps/nexus` Electron | 波次 4 |
| Zap | Studio 收件箱占位 | 远期 |
| Grove 壳 | Discover Dashboard 聚合 | 波次 5 |

---

## 波次 5：Grove 发现聚合（可选）

- [x] `GET /api/v1/discover/dashboard` 公开库规模 + 7 日活跃
- [x] 热门话题与热门作品聚合
- [x] Discover 页 Grove 概览面板

**非目标**：独立 Grove 元应用壳、跨产品 SSO。

---

## 波次 0：v1.x 遗留清算

- [x] `docs/BACKLOG_V1.md` 清单
- [x] `REFACTOR_V3` V4 状态回写
- [x] 剪辑 fx/wait 预览与试玩一致
- [x] 时间轴时长拖拽 + Inspector 同步
- [x] `amber` 硬编码 token 清扫（Studio 路径）

**推迟 v2.1+**：演出节奏曲线 / 关键帧（剪辑台）。

**v2.1 已交付**：跨 Beat 主时间轴、存档缩略图服务端、分轨独立排序（见 `BACKLOG_V1.md`）。

**不纳入**：图集、`.rn` DSL、AI 运行时、Unity、Player HUD 主题合并。

---

## 波次 1：Canopy 社群 MVP

- [x] 四类公开实体详情页接入 CommentThread
- [x] Author → Creator Hub（精选、Fork 链、数据面板）
- [x] 分享链接 + Open Graph meta
- [x] 轻量话题聚合页（标签簇）
- [x] `project.allow_comments` + 治理闭环字段
- [x] Discover 卡片社交信号（评论数）
- [x] Creator dashboard 扩展指标

**非目标**：关注流、推荐算法、ClusterSession 完整版、付费。

---

## 波次 2：Ginkgo 成就

- [x] `AchievementDefinition` / `PlayerAchievement` 模型与 API
- [x] Studio 成就编辑面板
- [x] 运行时解锁 + Player 成就列表
- [x] `requiresAchievement` 分支条件（IR + 引擎）

**非目标**：跨作品技能树 DAG、社区为他人定义挑战。

---

## 波次 3：RN 关系网

- [x] `relationship` 效果与条件（core + 编译器）
- [x] 关系预设扩展（好感/信赖/对立）
- [x] 项目内出场角色关系子图入口
- [x] Codex 关系快照字段

---

## 波次 4：Nexus Electron

- [x] `apps/nexus` 脚手架（Electron + React + IPC 规范）
- [x] 笔记 CRUD、标签、Minisearch、收件箱
- [x] 双向链接解析
- [x] 分发 API 骨架
- [x] Orbit 标签聚类视图（本地，无 AI 依赖）
- [x] v0.2 创作联动（`[[project]]` / `[[character]]`、Studio 备忘、IndexedDB 离线、身份统一）

详见 [NEXUS_VNEXT.md](./NEXUS_VNEXT.md)。开发端口见 `scripts/ports.mjs`（Web 5174 / Admin 5175 / Nexus 5274 / API 8000）。

---

## Nexus Orbit 体验规格（归档）

**一句话**：Nexus 首页不是笔记列表，而是 AI/标签整理后的认知概览——用户在「思想轨道」中轻松查看主题星云与关联。

- 打开即地图：主题区域由标签聚类生成
- 悬浮即理解：关键笔记标题与关联
- 操作无阻力：拖拽关联、批量标签、一键分发
- 美学：深色底 + 暖金光点 + D3 力导向；AI 在线时增强摘要

---

## 相关文档

- [USER_DOCS.md](./USER_DOCS.md) — 用户文档站规划（Web `/docs`）
- [ADMIN_VNEXT.md](./ADMIN_VNEXT.md) — 管理中台 v2.2+ 迭代
- [NEXUS_VNEXT.md](./NEXUS_VNEXT.md) — Nexus Electron 版本路线
- [REFACTOR_V4.md](./REFACTOR_V4.md) — v4 平台化（已完成）
- [ROADMAP_FINAL.md](./ROADMAP_FINAL.md) — 楔子与桥梁长期路线
- [ADR-022](./ADR/022-cut-studio-three-track-projection.md) — 剪辑三轨
