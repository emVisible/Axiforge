# @axiforge/editor-core

编辑器内核：L2 文档模型 + L3 投影。设计契约见 [`docs/KERNEL_DESIGN.md`](../../docs/KERNEL_DESIGN.md)。

## 术语表（一个词一个义，全仓强制）

| 术语 | 唯一含义 | 禁止混用 |
|------|---------|---------|
| **Draft** | 编辑器内存态文档快照（不可变值，`rev` 单调） | store / state / model |
| **Transaction (tx)** | 一次原子编辑意图 | action / mutation / op |
| **origin** | 事务来源轨（cut / writer / flow / system） | source（与边的 source 冲突） |
| **Envelope** | tx + origin 的信封 | — |
| **Journal** | 有界事务日志（undo/redo/记序/回放） | history / log |
| **Projection** | Draft⇄AXS 纯函数 | sync / exporter |
| **Plan** | AXS 解析后的物化计划（节点/边域形态） | payload（那是传输态 DTO） |

## 用法一例

```ts
import { createDraft, apply, emptyJournal, record, undo } from "@axiforge/editor-core";

let draft = createDraft({ nodes, edges, roles, scenes });
let journal = emptyJournal();

const result = apply(draft, { tx: { kind: "script.replace", nodeId, script }, origin: "cut" });
if (result.ok) {
  journal = record(journal, {
    envelope: { tx, origin: "cut" },
    rev: draft.rev,
    before: draft,
  });
  draft = result.draft;
}
```

## 纪律

- 零 React/DOM/网络依赖（CI 断言，宪章 G 门禁）
- 一切编辑经 `apply`，不存在第二条写路径
- 失败返回判别联合 `ApplyResult`，禁止异常穿越内核边界
