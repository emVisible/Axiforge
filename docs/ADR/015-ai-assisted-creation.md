# ADR-015：AI 辅助创作供应商与成本策略

**状态**：已采纳（v1.6）  
**日期**：2026-07-07

## 背景

v1.6 需要「结构化 AI 辅助创作」：散文→演出脚本、六层角色填充建议。市场（M3）要求 AI 填结构而非替代结构。

## 决策

### 阶段 1（v1.6 已落地）：规则引擎优先

| 能力 | 实现 | 成本 |
|------|------|------|
| 散文 → `Instruction[]` | `backend/app/services/ai_draft.py` 行解析规则 | 零 API 成本 |
| 六层角色建议 | 模板 + essence/tags 启发式填充 | 零 API 成本 |

**理由**：结构化 IR 已是质量护栏；规则 MVP 可验证编辑流程与 API 契约，不阻塞 ship。

### 阶段 2（可选，环境变量启用）：LLM 增强

- 供应商：**OpenAI API**（`gpt-4o-mini` 或同价位模型）为默认；不锁单一供应商，接口层抽象 `AiDraftProvider`。
- 启用条件：`OPENAI_API_KEY` 存在时，`prose_to_script` / `suggest_character_layers` 可尝试 LLM，失败回退规则引擎。
- **不在 v1.6 默认开启**：避免隐性成本与密钥管理负担。

### 成本护栏（启用 LLM 后）

1. 单次请求 `prose` ≤ 20,000 字符（已在 schema 限制）。
2. 按 IP + `author_id` 软限流（后续 v1.7）：建议 30 次/天/创作者。
3. 响应只返回 JSON 脚本/六层字段，不存原文到服务端（隐私 + 存储）。

### 资产 AI 生成（立绘/背景）

- **后置 v2.0**：v1.6 仅文档占位；与桥5 资产管线成熟后再接图像 API。

## 后果

- ✅ 无密钥即可完整演示 v1.6 AI 辅助流程  
- ✅ 规则与 LLM 可共存，前端无感切换（`source: rules | openai`）  
- ⚠️ 规则草稿质量有限，需创作者审改——符合「AI 填结构」定位  

## 参考

- `ROADMAP_FINAL.md` v1.6  
- `VISION_AND_BRIDGES.md` M3  
