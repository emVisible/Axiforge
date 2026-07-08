# ADR-021：评论模型与治理边界

**状态**：已采纳（v4）  
**日期**：2026-07-08  
**关联**：ADR-003、ADR-018、REFACTOR_V4.md

## 背景

v1.5 仅支持内容举报，无讨论层。v4 需在 Hall（Discover）提供楼中楼评论，作为最小社交能力。

## 决策

### 数据模型

- 表 `comments`：`content_type` + `content_id` 多态挂载（project / character / item / scene）
- `parent_id` / `root_id` 支持楼中楼与线程分页
- `status`：`visible | hidden | deleted`（软删除）

### API

- `GET /api/v1/comments` — 排序 `recent | hot`
- `POST /api/v1/comments` — 创建主楼或回复
- `DELETE /api/v1/comments/{id}` — 作者本人软删
- `POST /api/v1/report/` — `target_type=comment` 复用举报

### 治理

- 创建限流：30 条/小时/作者（服务层）
- 敏感词复用 `content_validate`
- Admin 举报队列处理 `comment` 类型；隐藏评论 `status=hidden`

### 非目标（v4）

- 点赞 UI（`hot` 排序暂用 `reply_count` 近似）
- @提及、通知铃铛

## 后果

- ✅ Hall 从橱窗变为可讨论内容站  
- ⚠️ 需 Admin 人工审核评论举报  
