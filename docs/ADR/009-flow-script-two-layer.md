# ADR-009：Flow / Script 两层分离（桥2·演出本体）

**状态**：已采纳
**日期**：2026-07-07
**决策者**：Axiforge 核心团队
**关联**：`ROADMAP_FINAL.md` v1.1、`VISION_AND_BRIDGES.md` 桥2、ADR-008

## 背景

现模型里**一个图节点 = 一句对话**（`backend/app/models/project.py` 的 `ProjectNode.narrative_data` 仅含单个 speaker/dialogue/narration/choices）。真实 VN 的一个"场景/桥段"是**几十到上百条演出指令**的序列（进场→表情变→镜头推→BGM 切→说话→退场）。

后果（详见 `VISION_AND_BRIDGES.md` §3.1）：想演一段戏要拖几十个图节点，与"简便舒适"背道而驰；立绘/镜头/音频没有模型承载。这是演出（能力地图 D2）与音频（D3）全空白的**根因**——不是没做，是模型里没有它的位置。

## 决策

**把"宏观流程图（Flow）"与"微观演出脚本（Script）"拆成两层。**

- **Flow 层（Beat 图）**：图节点升级为 **Beat**（桥段），只管"哪个桥段接哪个桥段 / 分支去哪"。边（transitions）承载分支。
- **Script 层（演出指令序列）**：每个 Beat 内部是一串**有序、可含并行的演出指令** `script: Instruction[]`。

v0 指令集（8 条，`@axiforge/core` 定义）：

| 指令 | 语义 |
|------|------|
| `say` | 角色说话 / 旁白（暂停点，等继续） |
| `show` | 立绘进场（角色/表情/位置） |
| `hide` | 立绘退场 |
| `bg` | 切换背景 |
| `bgm` | 背景音乐（含 fade） |
| `se` | 音效 |
| `wait` | 定时等待 |
| `choice` | 分支选项（暂停点，等选择；选项可带条件与目标 Beat） |

镜头 / 转场 / 特效 / 富文本 / ruby 等**逐版本加指令，不改架构**（v1.3）。

### 数据落地（兼容迁移）

- `ProjectNode.narrative_data` 增加 `script: Instruction[]`。
- 编译器（ADR-008）对**旧节点**：把 speaker+dialogue/narration 包装为单条 `say`，把出边/manual choices 包装为末尾 `choice`（或线性单出边→默认转场）。旧项目零手工迁移可玩。

### 编辑器

- 节点内嵌**线性演出脚本编辑器**（v1.1 列表式 MVP；v1.3 升级分轨时间轴 + 实时预览）。
- Flow 画布退化为"桥段间流转"视图，不再承载逐句对白。

## 理由

- 指令集是 VN 的"字节码"，定得早，创作与运行时同时受益。
- 与 ADR-008 的 IR 天然契合：Beat.script 直接编译进 StoryPackage。
- 分支仍走边 + `choice`，与 v1.0 边 label 语义平滑衔接。

## 后果

### 正面
- 演出终于有承载模型；`show(char, expr)` 之类指令为资产管线（桥5）预留挂点。
- `ProjectFlowPage.tsx`（~1447 行巨石）借此拆为 节点 / 演出面板 / 持久化 三层。

### 负面 / 技术债
- 编辑器需新增演出脚本编辑区（工作量）。
- 旧"一句一节点"心智需迁移文档说明。

## 不采纳的备选
1. **保持一节点一句** — 演出永远做不透，北极星不可达。
2. **纯文本 DSL 脚本（Ren'Py 式）** — 与"普通创作者简便舒适"的无代码定位冲突；`.rn` 文本语法作为后置导入导出糖（ADR-005/012）。

## 验收（v1.1）
- [ ] `Instruction` 8 条在 `@axiforge/core` 定义并被引擎消费
- [ ] `narrative_data.script` 落库；编译器兼容包装旧节点
- [ ] 节点演出脚本编辑器（列表式）可增删改指令并保存
- [ ] 一个 Beat 能连续演出"进场→变表情→切 BGM→说话→选择"
