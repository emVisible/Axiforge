# Axiforge v4 重构计划（平台化：LLM + 创作者面板 + 评论）

> **文档性质**：v4 阶段执行基准，接替 `REFACTOR_V3.md` / `LAYOUT_V2.md`。  
> **最后更新**：2026-07-08

## 五层架构

| 层 | 职责 | v4 交付 |
|----|------|---------|
| **Hall** | Discover 浏览 | 公开内容详情页 + 楼中楼评论 |
| **Studio** | 创作 + 数据 | 概览 Dashboard；LLM 辅助创作 |
| **Background** | 运营治理 | 评论举报；LLM 限流 |
| **LLM** | AI 中台 | `domains/llm`，Xinference/Ollama/Rules |
| **Basic Service** | 身份与聚合 | `/creator/dashboard` API |

## 阶段 L — LLM 服务层

- [x] `domains/llm` 多供应商 + fallback 链
- [x] `/editor/ai/*` 迁移至 `llm.service`
- [x] `GET /api/v1/llm/health`
- [x] ADR-020

## 阶段 A — 创作者数据面板

- [x] `GET /api/v1/creator/dashboard`
- [x] `CreatorDashboardPage` + 侧栏「概览」
- [x] 7 日播放/浏览趋势

## 阶段 C — 评论系统

- [x] `comments` 表 + API（楼中楼 + 排序）
- [x] `CommentThread` 组件
- [x] Discover 公开作品详情讨论区
- [x] ADR-021

## 阶段 I — 整合收口

- [x] Studio AI 显示 `source` 徽章
- [x] Discover 卡片跳转详情（非直接 Play）
- [x] 集成测试 + build 验收

## 非目标

- Grove 元界面、Ginkgo、Canopy ClusterSession
- AI 运行时旁白、世界 tick
- 关注/推荐/付费

## PR 顺序

1. Phase L — LLM  
2. Phase A — Dashboard  
3. Phase C 后端 — Comments API  
4. Phase C 前端 — CommentThread + 详情页  
5. Phase I — 收口
