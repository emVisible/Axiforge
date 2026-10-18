# Nexus vNext 版本规划

> **文档性质**：`apps/nexus` Electron 客户端迭代方向，承接 [AXIFORGE_V2.md](./AXIFORGE_V2.md) 波次 4 MVP。  
> **最后更新**：2026-07-09

> **状态（2026-09-30）**：冻结的独立内部工具规划，不属于 Axiforge 桌面创作器的主流程或发行物。除非产品边界重新决策，不从本文创建当前迭代任务。

## 定位（不变）

**思想收件箱 + 认知概览 + Axiforge 创作数据总线** — 不是第二个笔记应用，而是创作者/策划的「场外大脑」，与 Studio / Canopy / RN 数据互通。

---

## v0.1 已交付（波次 4）

| 能力 | 状态 |
|------|------|
| Electron + Vite + React 壳 | ✅ |
| 笔记 CRUD、标签、Minisearch | ✅ |
| 收件箱 / 笔记 / Orbit 三 Tab | ✅ |
| 后端 `domains/nexus` API | ✅ |
| Orbit 本地标签力导向聚类 | ✅ |
| 开发端口 5274 + Electron postinstall | ✅ |

---

## v0.2「可日用」— 创作联动（约 2 周）

**用户感知**：在 Nexus 记下的想法能一键变成 Studio 里的 Beat 草稿或 AXS 片段。

| 范围 | 内容 | 状态 |
|------|------|------|
| 关联解析 | `[[project:uuid]]` `[[character:uuid]]` 可点击跳转 Studio | ✅ |
| 分发 API | `POST /nexus/distribute` → `play_meta.nexus_notes` / 角色传记 | ✅ |
| 分发 UI | 收件箱笔记一键「分发到作品/角色」 | ✅ |
| Orbit 筛选 | 点击标签星团筛选笔记列表 | ✅ |
| Studio 备忘 | Outliner 展示 `play_meta.nexus_notes` | ✅ |
| 从 Studio 写入 | Outliner「发送到 Nexus」 | ✅ |
| 离线优先 | 本地 IndexedDB 缓存 + LWW | ✅ |
| 认证 | 复用 `creator_id`（`axiforge.creatorId`） | ✅ |

**验收**：Nexus 写笔记 @关联某剧本 → 可分发；Studio 发送片段 → Nexus 收件箱出现。

---

## v0.2 剩余

（v0.2 已全部交付，见上表。）

## v0.2.1 已交付（本轮）

| 范围 | 内容 |
|------|------|
| 身份统一 | Nexus 与 web 共用 `axiforge.creatorId` localStorage 键 |
| 离线缓存 | IndexedDB 笔记缓存 + `updated_at` LWW 合并 |
| Studio 同步 | `useProject` 缩短 staleTime，窗口聚焦时拉取 `play_meta.nexus_notes` |

---
## v0.3「Orbit 增强」— 认知概览（约 2 周）

**用户感知**：打开 Nexus 即理解「最近在想什么主题」，而不只是标签列表。

| 范围 | 内容 | 状态 |
|------|------|------|
| Orbit 交互 | 拖拽节点调整布局；点击星团筛选笔记列表 | ✅ |
| 主题摘要 | 本地 TF-IDF 关键词 + 近期标题（无 AI 依赖） | ✅ |
| 时间维 | 标签簇按近期活跃度淡入淡出 | ✅ |
| 导出 | Markdown 包（按主题分组 + 关联链接） | ✅ |
| LLM 增强摘要 | 可选 `domains/llm` 在线摘要 | 待做 |
| 拖拽改标签簇 | 拖入另一星团合并标签 | 待做 |

**验收**：50+ 笔记时 Orbit 仍可交互；主题簇与标签手动整理结果一致。

---

## v0.4「数据总线」— 跨产品记忆（约 3 周）

**用户感知**：Nexus 记得「某角色在多个作品里的策划备忘」，与 Ginkgo / Codex 互补。

| 范围 | 内容 |
|------|------|
| Codex 只读镜像 | 拉取 `GET /play/codex` 摘要，附在角色链接卡片上 |
| 成就 / 关系提示 | 读取 Ginkgo 成就定义与 RN 关系名，Orbit 着色 |
| Zap 占位落地 | Studio 轻量「待处理」收件箱与 Nexus inbox 双向同步 |
| 桌面深度 | 系统托盘、全局快捷键唤起快速捕获窗 |

**非目标**：替代 Studio 编辑；AI 运行时生成剧情。

---

## v1.0「独立安装包」

- macOS / Windows 签名分发（electron-builder）
- 自动更新通道（GitHub Releases）
- 与 Axiforge 账号体系统一（邮箱恢复 `creator_id`）

---

## 技术债

| 项 | 说明 |
|----|------|
| Electron 体积 | 按需拆 chunk；Orbit 单独 lazy |
| 双端 parser | 链接语法单源在 `packages/core` 或 `packages/nexus-links` |
| 安全 | 禁用 Node 集成；IPC 白名单；CORS 仅 dev API |

---

## 与 Axiforge 路线图关系

```
Studio（创作） ──dispatch──► Nexus（思考）
     ▲                            │
     └──── AXS / Beat 草稿 ◄──────┘
Canopy（消费） ◄── 公开作品链接预览
RN Codex / Ginkgo ◄── 只读上下文
Admin（治理） ── 不直接进入 Nexus；UGC 下架后 Nexus 链接标灰
```

---

## 相关

- [AXIFORGE_V2.md](./AXIFORGE_V2.md) Nexus Orbit 体验规格
- [ADMIN_VNEXT.md](./ADMIN_VNEXT.md) 管理中台（平行迭代）
