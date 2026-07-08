# ADR-018：内容治理状态机与轻量风控

**状态**：已采纳（v2 Phase A/E）
**日期**：2026-07-07
**关联**：ADR-003（公开内容策略：`is_public` + 举报占位）——本 ADR 是其升级

## 背景

真实运营场景要求全环节内容校验、违规记录与处罚、防盗刷、审计。v1.x 只有 `is_public` 布尔与举报占位表，无状态机、无处罚、无限流、CORS 为 `*`。

## 决策

### 内容状态机

`projects` / `characters` 增加 `content_status`：

```
draft ──发布(校验通过)──► published ──admin下架──► taken_down
  ▲                                                    │
  └────────────── admin恢复 / 作者整改重发 ──────────────┘
```

- 发布时跑**规则校验**（敏感词/长度/必填），不做前置人工审核（保持 ADR-003 的低摩擦）
- LLM 审核留接口（`ModerationProvider`），默认关闭
- `is_public` 保留为作者意愿；实际可见性 = `is_public AND content_status == published`

### 违规与处罚

- `violations` 表：对象、条款、处理人、时间；用户维度累计 strike
- strike 阈值（默认 3）→ 自动禁发布；admin 可撤销

### 风控与合规（全部单体内轻量实现，不引外部服务）

| 项 | 实现 |
|----|------|
| 防盗刷 | 内存滑动窗口限流（IP+token 维度）；计数按 token 日去重 |
| 审计 | `audit_logs`：admin 与敏感操作全记录 |
| 网络安全 | CORS 白名单（settings 配置）、安全响应头、请求体上限 |
| 隐私 | 数据导出/注销 API；日志不落邮箱明文 |
| 存储 | sha256 去重、MIME/尺寸白名单、孤儿清理 |
| 统计 | `events` 表 + 日聚合，供中台 dashboard |

### 中台鉴权

当前无密码体系。admin API 用 `ADMIN_TOKEN` 环境变量 Bearer 校验；`user_accounts.role`（user/moderator/admin）为未来正式 RBAC 预留位。

## 后果

- 上线裸奔项清零；治理动作全部可审计、可撤销
- 单体内存限流在多实例部署时需换 Redis——留到真实多实例需求出现时（YAGNI）
