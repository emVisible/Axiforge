# ADR-001：v1.0 保留六层 JSONB 角色创作模型

**状态**：已采纳  
**日期**：2026-07-06  
**决策者**：Axiforge 核心团队

## 背景

Axiforge 角色数据源自 Workshop 的「六层」模型（Anchor / Contour / Demeanor / Psyche / Trace / Bond），全部存于 `characters.character_data` JSONB 字段。与此同时，产品蓝图（v2）提出了更简化的「四子系统」运行时模型（Identity / Presentation / Cognition / Social）。

若在 v1.0 融合期强行迁移到四子系统，将同时影响：

- Character Studio 全部编辑 UI
- 关系图、传记、版本、Fork、Prompt 导出
- `project_roles.locked_version` 与 Player 运行时快照

## 决策

**v1.0 完整保留六层 JSONB 创作模型**，不引入四子系统替换层。

具体约定：

1. **单一真相源**：`characters` 表 + `character_data` JSONB，删除并禁止 `asset_characters` 双表。
2. **创作路径**：Character Studio 继续以六层手风琴编辑；导出 Prompt 基于六层字段拼装。
3. **运行时路径**：Player v1.0 通过 `project_roles` + `CharacterRuntimeState` 读取角色名称、头像、标签等**投影字段**，不在 Player 内解析完整六层语义。
4. **v2 预留**：在 schema 层允许新增 `presentation` / `identity` 等**可选**映射字段，但 v1.0 不强制双写。

## 理由

| 因素 | 说明 |
|------|------|
| 可部署性 | Workshop 六层编辑器已完整可用，融合成本低于重写 |
| 风险 | 大规模数据模型替换会阻塞 Studio + Player 主路径交付 |
| 用户价值 | v1.0 目标是「角色工坊 → 编剧本 → Flow → Player」闭环，而非运行时认知引擎 |
| 演进空间 | JSONB 允许渐进添加字段；Alembic 可在 v1.5 引入映射视图 |

## 后果

### 正面

- Character Studio 可快速迁入 Axiforge 单体，无需同步改后端 schema
- 角色版本、关系、传记 API 保持稳定
- 测试与文档可围绕单一 `CharacterResponse` 展开

### 负面 / 技术债

- 六层与 v2 四子系统在概念上并存，新成员需阅读本文档
- Player 无法直接消费「深层心理/行为」层语义（v1.0 本就不做）
- 长期需在 v1.5+ 提供 `六层 → 四子系统` 适配层（只读投影或迁移脚本）

## 不采纳的备选方案

1. **v1.0 直接切四子系统** — 编辑器、导出、关系图全量重写，周期不可控。
2. **双写六层 + 四子系统** — 增加一致性负担，v1.0 无消费者。
3. **仅保留 Anchor 扁平字段** — 损失 Workshop 已实现的深度编辑与 Prompt 质量。

## 验收

- [x] `characters.character_data` 为唯一角色创作存储
- [x] `asset_characters` 已 drop（Alembic `20260706_001`）
- [x] Character Studio 路由与六层 UI 在 `/studio/characters/*` 可用
- [ ] v1.5 映射层设计（单独 ADR）

## 相关文档

- `docs/REFACTOR_PLAN.md` §9 ADR 摘要
- `backend/app/schemas/character.py` — `CharacterData` 六层结构
- `backend/app/models/character.py` — ORM 定义
