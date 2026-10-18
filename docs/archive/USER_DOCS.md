# 用户文档站规划（USER_DOCS）

> **性质**：`docs/user/` 与 Web `/docs` 的维护路线图。工程 ADR 仍在 `docs/ADR/`，不直接暴露给终端用户。

## 已交付（v1）

| 路径 | 说明 |
|------|------|
| `/docs` | 公开文档首页（`docs/user/README.md`） |
| `/docs/writing/axs-syntax` | AXS 纯文本剧本语法参考 |
| Studio 剧本模式 | 「AXS 语法」快捷链接 |
| 顶栏 | 「文档」入口 |

## 维护原则

1. **Markdown 为单一真相源** — 正文写在 `docs/user/`，由 `apps/web` 通过 `docRegistry` 加载渲染。
2. **导航** — `docs/user/_nav.json` 定义侧栏；新增文章须同时更新 nav 与 MD 文件。
3. **与 ADR 分工** — ADR 记录架构决策；用户文档写「怎么用」，可引用 ADR 路径但不复制全文。
4. **与解析器对齐** — 语法类文档以 `packages/axs` 单测与 `parse.ts` 为准。

## 后续批次

### FAQ（`docs/user/faq/`）

- 账号与 `creator_id`
- 作品保存与同步失败
- 试玩与发布区别

### Studio 指南（`docs/user/studio/`）

- 剪辑台三轨与时间轴
- Flow 结构图与舞台
- 角色/道具/场景资产
- 成就与关系分支（与 Ginkgo / RN 联动）

### 参考（`docs/user/reference/`）

- 数据模型概览（作品、角色、评论）
- API 只读说明（高级用户 / 集成）

### 治理（`docs/user/governance/`）

- 公开发布与审核
- 举报与下架对用户的影响

## 技术栈

- 渲染：`react-markdown`（`apps/web`）
- 路由：`/docs`、`/docs/:slug*`
- 源码：`docs/user/**/*.md` + `_nav.json`

## 非目标

- MDX、站内全文搜索、多语言（v2+ 再议）
- Admin / Nexus 独立文档壳（先共用 Web `/docs`）
