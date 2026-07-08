# ADR-017：节点独立于场景，场景降级为舞台

**状态**：已采纳（v2 Phase N）
**日期**：2026-07-07

## 背景

v1.x 中 `project_nodes.scene_id` 为非空外键——节点是场景的附属。但剧情逻辑（Beat/回合/关键帧）不属于任何场景：同一段剧情可以横跨多个舞台，一个舞台可承载多段剧情。概念错位导致：编译器必须遍历 scene→nodes 两层、Flow 画布被切成 per-scene 孤岛、跨场景连线别扭。

## 决策

1. `project_nodes` 增加非空 `project_id`（直挂剧本）；`scene_id` 改名 `stage_id` 且**可空**。
2. `ProjectScene` 语义降级为 **Stage（舞台）**：背景/氛围/位置的演出属性包。表名不改（避免无谓迁移），模型 docstring 与 API 语义更新。
3. 统一抽象：**Beat = 关键帧 = 一个回合**。IR 的 Beat 显式化 `actors`（参与角色）、`props`（道具）、`stage`（舞台）三个字段——角色与环境/角色/道具交互的行为转换点。
4. 节点 CRUD 迁移到项目级路由 `POST /projects/{id}/nodes`；场景嵌套路由废弃。
5. Flow 画布升级为全剧本单画布，舞台以节点着色/分组呈现。

## 迁移

Alembic：加 `project_id` 列 → 经 scene 关联回填 → 设非空；`scene_id` 重命名 `stage_id` 并放开非空约束。旧数据零手工迁移可玩。

## 后果

- 编译器直接按 project→nodes 编译，stage 信息折叠为演出指令
- AXS 语言的 `@stage()` 注解自然映射 `stage_id`
- 为 v2.0 世界演化（tick 按回合推进）铺平数据模型
