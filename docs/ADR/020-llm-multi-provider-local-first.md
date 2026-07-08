# ADR-020：多供应商 LLM 与本地优先策略

**状态**：已采纳（v4）  
**日期**：2026-07-08  
**关联**：ADR-015、REFACTOR_V4.md

## 背景

v1.6 的 AI 辅助创作使用规则引擎（`ai_draft.py`）。v4 需接入真实 LLM，且开发者环境以本地推理为主。

## 决策

1. 新建 `domains/llm`，`AiProvider` 协议 + `registry` 按配置选择供应商。
2. **Fallback 链**：`Xinference → Ollama → Rules`（`LLM_PROVIDER=auto` 时）。
3. Xinference 使用 OpenAI 兼容 `/v1/chat/completions`；Ollama 使用 `/api/chat`。
4. 云端供应商（OpenAI、DeepSeek）通过同一接口后续接入，v4 不强制。
5. 按 `author_id` 软限流：`LLM_DAILY_LIMIT_PER_CREATOR`（默认 30）。
6. 响应统一带 `source` 字段；LLM 失败自动降级，不阻塞创作。

## 配置

| 变量 | 默认 |
|------|------|
| `LLM_PROVIDER` | `auto` |
| `XINFERENCE_BASE_URL` | `http://127.0.0.1:9997/v1` |
| `XINFERENCE_MODEL` | `Qwen2.5-7B-Instruct` |
| `OLLAMA_BASE_URL` | `http://127.0.0.1:11434` |
| `OLLAMA_MODEL` | `qwen2.5:7b` |
| `LLM_DAILY_LIMIT_PER_CREATOR` | `30` |

## 后果

- ✅ 无云端密钥亦可开发；规则引擎永远可用  
- ✅ `/editor/ai/*` 契约不变，前端无感切换  
- ⚠️ LLM 输出质量依赖本地模型，需人工审改  
