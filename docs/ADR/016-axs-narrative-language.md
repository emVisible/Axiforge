# ADR-016：AXS 叙事文本语言（文本为真相源）

**状态**：已采纳（v2 Phase N）
**日期**：2026-07-07
**关联**：ADR-005、ADR-012（曾裁决「结构化 schema 先行，文本语法后置」——本 ADR 兑现后置承诺）

## 背景

VN 创作是高频文本产出。v1.x 的拖拽节点画布适合表达分支结构，但在具体创作时间占比上成为「长通勤」：每写一句对白都要点开节点面板。市场对标（Ren'Py 的 .rpy、Ink 的 .ink）证明**文本优先**是叙事创作的效率上限。

## 决策

1. **自研 AXS DSL**（类 Markdown 剧本语言），新包 `packages/axs`。
2. **文本为真相源，节点图为投影**：项目新增 `axs_source` 存储；文本保存 → parse → 覆写 nodes/edges；图编辑 → printer → 重生成文本；冲突时文本优先。
3. **解析只有 TS 单实现**（前端解析，结构化结果提交后端），不做 Python 双端移植——避免两个 parser 漂移。后端新增原子接口 `PUT /projects/{id}/narrative` 接收 `{ axs_source, nodes, edges }`。

## 语法要点（v1 语法冻结面）

```axs
# Beat标题 @stage(舞台名) [key] [ending: 结局名] [if: <条件表达式>]
@bg <image>            @bgm <track> [loop]      @se <sound>
@camera zoom 1.2       @fx rain                 @wait 500
@transition fade 400   @voice <sound>
@flag key = value      @memory key = value      @codex 角色.key = value
角色名: 台词
角色名(表情): 台词
@show 角色 [表情] [位置]    @hide 角色    @move 角色 位置
纯文本行 → 旁白
> 选项文字 -> 目标Beat标题
```

- Beat 由 `#`/`##` 标题行开启；`->` 显式跳转按标题解析为 edge
- 顺序相邻 Beat 之间自动生成默认 edge（无 choice 时）
- 行号 ↔ beat id 位置映射随 AST 输出，供编辑器双向定位

## 质量要求

- parser/printer 100% 单测（引擎级代码标准，同 `packages/core`）
- round-trip 性质测试：`parse(print(beats)) ≡ beats`
- 未知指令行保留为注释透传，不丢内容

## 后果

- 创作主路径从「拖拽+面板」变为「写作+预览」，画布退为结构鸟瞰
- 散文/MD 导入统一走「规则/AI → AST → printer」流水线
- 未来 `.axsp` 离线包导出（v2.5）可直接内嵌 AXS 源
