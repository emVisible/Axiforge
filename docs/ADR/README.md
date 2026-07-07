# Architecture Decision Records

| ID | Title | Status |
|----|-------|--------|
| [ADR-001](./001-six-layer-character-model.md) | v1.0 保留六层 JSONB 角色创作模型 | 已采纳 |
| [ADR-008](./008-narrative-ir-and-compiler.md) | Narrative IR + Story Compiler（桥1·脊椎） | 已采纳 |
| [ADR-009](./009-flow-script-two-layer.md) | Flow / Script 两层分离（桥2·演出本体） | 已采纳 |
| [ADR-015](./015-ai-assisted-creation.md) | AI 辅助创作供应商与成本（规则优先 + 可选 LLM） | 已采纳 |

## 待落文档（最终建议已定于 [`../ROADMAP_FINAL.md`](../ROADMAP_FINAL.md) §7，逐个正式落 ADR）

| ID | 议题 | 最终建议 | 落地版本 |
|----|------|----------|----------|
| ADR-002 | 试玩 vs 正式 Play 存档持久化 | 试玩 ephemeral；正式 Play 挂存档槽 | v1.2 |
| ADR-003 | 公开内容策略 | 仅 `is_public` + 举报占位 | v1.5 |
| ADR-004 | Fork 许可与 attribution | 强制保留 attribution 链 | v1.5 |
| ADR-005 | 条件表达：JSON schema vs `.rn` | schema 先行，`.rn` 语法后置 | v1.2 |
| ADR-006 | 用户身份 | 可迁移匿名身份 → 邮箱升级 | v1.5 |
| ADR-010 | 统一表达式系统落 `packages/core`（桥3） | 采纳（语义内核已随 v1.1 落地，v1.2 删后端重复） | v1.2 |
| ADR-011 | 记忆三层：会话/存档/Codex（桥4） | 采纳，分两步落 | v1.2 / v1.6 |
| ADR-012 | `.rn` DSL：语法糖 vs 纯结构化 | 语义内核先行 | v2.0 再议语法 |
| ADR-013 | 资产管线存储与优化策略（桥5） | 上传即引用；图集优化后置 | v1.3 |
| ADR-014 | Runtime 条件裁决：端上 vs 服务端 | 公开端上算，隐藏分支服务端 | v1.1 编译期标记 |
| ADR-015 | AI 辅助创作供应商与成本 | 待定 | v1.6 前 |
