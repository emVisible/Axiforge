# Axiforge 内核设计规约（Kernel Design）

> **文档性质**：`packages/editor-core`（L2–L4）的构建规约——先于实现存在的底层契约。
> **上位**：[ADR-024](./ADR/024-desktop-local-first.md)、[ADR-025](./ADR/025-axs-peer-dual-view.md)；执行计划见 [REFACTOR_DESKTOP.md](./REFACTOR_DESKTOP.md)。
> **设计立场**：Linux 内核式——机制与策略分离；内核不知道 UI，UI 不知道存储。上层的表现与维护成本由本层的决定预先锁定。
> **日期**：2026-08-26 · 状态：已评审采纳（随 Phase 1 实现演进，签名变更须回写本文）

---

## 一、分层模型（L0–L5）

```
L5  绑定层    apps/web：React 组件 + zustand store（editor-core 的适配器）
              ↑ 订阅 draft、派生视图模型、生产 Transaction
L4  存取契约  editor-core/storage：StorageProvider 接口 + Result 失败语义
              ↑ editor-core 只认接口；HTTP / SQLite 是可替换实现
L3  投影层    editor-core/projection：Draft ⇄ AXS 双向投影、锚点索引
              ↑ 纯函数，无副作用
L2  文档模型  editor-core/document：Draft（不可变快照）+ Transaction（唯一写入口）
              + Journal（有界事务日志）
              ↑ 只依赖 L0/L1
L1  叙事语言  packages/axs（已有，零改动）
L0  IR 契约   packages/core/src/ir.ts + engine.ts（已有，零改动）
```

**依赖方向铁律**：只允许向下依赖。L2–L4 的任何模块不得 import `react`/`react-dom`/DOM API/网络库（CI 断言，宪章 G 门禁）。`zustand` 属于 L5，禁止进入 packages/*。

## 二、五个核心抽象

### 2.1 Draft —— 文档的不可变快照

```ts
/** 编辑器世界的全部状态。值语义：永不原地修改。 */
export interface Draft {
  readonly rev: number;                 // 单调递增修订号
  readonly nodes: ReadonlyMap<NodeId, Readonly<NarrativeNode>>;
  readonly edges: readonly Edge[];
  readonly roles: readonly ProjectRole[];
  readonly scenes: readonly Scene[];
}

export interface NarrativeNode {
  readonly id: NodeId;
  readonly stageId: string | null;
  readonly position: { x: number; y: number };
  readonly narrative: Readonly<NarrativeData>;   // 含 script: Instruction[]
  readonly sortOrder: number;                    // 编辑器排序（后端 sort_order 的域形态）
}
```

**不变量**：
- I1 `rev` 随每次 apply 单调 +1；相同 rev 必然相同内容
- I2 节点 id 全局唯一；edge 的 source/target 必须引用存在节点
- I3 `script[]` 内元素均为合法 IR Instruction（复用 core 校验）

**为什么不可变**（axiom 1.3 状态层级 1）：快照即值 → undo/redo 是指针回退、React 渲染靠引用比较、E2E 断言靠 rev。结构共享保证重排一条指令的成本是 O(改动)，不是 O(全量拷贝)。

### 2.2 Transaction —— 一切编辑的唯一入口

**单一写入口原则**：系统中不存在第二条修改 Draft 的路径。剪辑台拖拽、AXS 解析覆写、角色增删、未来 F2 角色轨编排——全部编译为同一种东西：

```ts
export type Transaction =
  | { kind: "script.replace"; nodeId: NodeId; script: Instruction[] }
  | { kind: "script.reorder"; nodeId: NodeId; from: number; to: number }
  | { kind: "script.remove";  nodeId: NodeId; index: number }
  | { kind: "script.patch";   nodeId: NodeId; index: number; patch: Partial<Instruction> }
  | { kind: "node.add";    node: NarrativeNode }
  | { kind: "node.remove"; nodeId: NodeId }
  | { kind: "node.patch";  nodeId: NodeId; patch: Partial<NarrativeData> }
  | { kind: "edges.replaceAll"; edges: Edge[] }
  | { kind: "role.add"; role: ProjectRole }
  | { kind: "role.remove"; refId: string }
  | { kind: "axs.import"; source: string }        // Writer 轨保存 = 一个事务
  ;

export interface Envelope {
  readonly tx: Transaction;
  readonly origin: Origin;      // "cut" | "writer" | "flow" | "system"
  readonly at: number;          // 逻辑时钟 = apply 前 rev
}
```

**不变量**：
- I4 `apply` 要么整体成功返回新 Draft，要么拒绝并返回结构化错误——不存在半应用状态（原子性）
- I5 同一事务重放（同一起始 rev）必然产出相同结果（确定性——测试回放的根基）
- I6 `origin` 必填：ADR-025「最后编辑者权威」的记序依据就是它

### 2.3 Journal —— 有界事务日志

```ts
export interface Journal {
  readonly past: readonly Envelope[];   // 上限 MAX_JOURNAL（默认 200），FIFO 淘汰
  readonly future: readonly Envelope[]; // redo 栈，新事务入栈时清空
}
```

**一个日志买四样东西**：
| 能力 | 来源 |
|------|------|
| undo / redo（宪章 Q5 键盘可达的撤销） | past/future 栈 |
| ADR-025 dirty 记序（谁最后编辑谁权威） | envelope.origin + 顺序 |
| 崩溃恢复（Phase 2 损坏工程路径） | 重放 journal 尾部 |
| 测试回放（给定事务序列断言最终 Draft） | I5 确定性 |

**不变量**：I7 Journal 有界，淘汰策略 FIFO，无静默无限增长（axiom 第三部 7.3）。

### 2.4 Projection —— 纯函数投影

迁移自 `apps/web/src/features/writer/lib/projection.ts`（395 行，现状已纯逻辑，仅类型 import 经 `@/` 别名需解耦为本地类型）：

| 现有函数 | 归宿 |
|----------|------|
| `projectToAxs` / `nodeToBeat` / `topologicalNodeOrder` | L3：`draftToAxs(draft, roles)` |
| `axsToSyncPayload` | L3：`axsImport(source, roles) → Transaction("axs.import") 的载荷` |
| `beatLineForNode` / `nodeIdForBeat` | L3：锚点索引 v0（行级）；ADR-025 落地时升级指令级 |
| `mergeCanvasIntoProjectNodes` / `canvasEdgesForProjection` | L3：画布快照 → Draft 差异合并 |
| `collectProjectNodes` | L5 兼容层（服务端响应形态归一），最终随旧 API 层消亡（铁律 7） |

> 状态（2026-09-30）：这张表把 `axsToSyncPayload` 与 `axs.import` 画成同一归宿，**实态是两套实现**，按本文末尾的规矩在此回写而不是沉默漂移：
> - `Transaction("axs.import")` 的载荷由 `packages/editor-core/src/axsImport.ts:56` 的 `importAxsDraft` 产出（`document.ts:355` 调用）——它读写 **Draft 的既有节点集合**。
> - `axsToSyncPayload`（仍在 `apps/web/src/features/writer/lib/projection.ts:96,102`）调的是另一套 `parseAxsToPlan`（`packages/editor-core/src/projection/axs.ts`）——它产出**同步载荷**（节点 + 边 + sort_order + 网格位置）。
> 两者对「标题命中既有节点」的复用与排序语义不是逐字相同，直接合并会把两种语义拧成第三种（这是 #69 那批缺陷的土壤），故归并登记在 S13-7 等定档，本轮不自作主张。
> 临时保险两条，都是机械的：`packages/editor-core/src/document.test.ts:385` 那条**配对判据**「两条『AXS 文本 → 节点图』的通路守同一条 id 契约（防止只修一处）」在同一段测试里跑两套实现，断言两者都必须"两个桥段两个 id、第一个仍复用既有节点身份"（去掉任一侧的守卫都会让它红）；契约文本本身在 [ADR-016](./ADR/016-axs-narrative-language.md) 补记第 6 条。合并那天，这两条一起退场——它们的存在理由是一份尚未归并的实现，不是两种业务语义。
>
> 状态更新（2026-10-01）：上面那句"两套实现"要在**层次上说准**。实测 `beatToNarrative` ≡ `beatToNarrativeData` 是**逐字符相同的 8 个字段**（连 `is_anchor` 规则与 4 列落位公式都各抄了一遍）——
> 那部分不是两种语义，是一份逻辑被抄两遍，**现已归一到 `projection/axs.ts` 一处**（`index.ts` 同时星号导出两侧，公开面不变、`check:circular` 仍无环）。
> 真正仍并存的是**两条入口通路**：草稿事务 `axs.import`（读写 Draft 的节点集合）与 Writer 保存的同步载荷 `parseAxsToPlan`（产出节点 + 边 + 排序）。
> 归并这两条入口需要动 Writer 保存的载荷形状，**仍属 S13-7、等定档**。归一后另补了一条主通路判据（`projection.test.ts` 的关键拍断言）：
> 在此之前 Writer 那一侧对 `is_anchor` 没有任何断言，同一处回归只红一半。

**不变量**：I8 投影函数无副作用、不读时钟、不触网——同一输入永远同一输出。

### 2.5 StorageProvider —— 显式失败语义的存取契约

```ts
export type StorageError =
  | { code: "not_found";     entity: string; id: string }
  | { code: "corrupted";     entity: string; detail: string }
  | { code: "io";            detail: string; cause?: unknown };

export type StorageResult<T> =
  | { ok: true;  data: T }
  | { ok: false; error: StorageError };
```

**失败语义先填空**（铁律 8，axiom 4.1）：
- `loadProject(id)` 失败 → 返回 `{ ok:false, error }`，调用方（L5）负责渲染四态中的错误态并允许重试——Provider 不弹 toast、不重试内部逻辑（重试是策略，归调用方）
- 空值五义显式区分（axiom 1.4）：工程不存在=`not_found`；字段缺失=领域内 `null`；解析失败=`corrupted`；磁盘/网络故障=`io`

**接口方法**（v1，三实现：Memory / HTTP / SQLite）：
`listProjects / createProject / loadProject / deleteProject / updateProjectMeta / saveNarrative / addRole / removeRole`；
角色域 `listCharacters(scope?) / getCharacter / saveCharacter`；
素材域 `saveAsset(input) / readAsset(ref)`。

> **v1 变更（2026-09-24，随桌面 Phase 6）**：
> - `StoredCharacter` 补 `isPublic` / `authorId` 为**必填**字段——缺失不是 false，五义在此一处定死；
>   必填的意义是让每个实现与每份夹具都被迫显式表态，浏览器态与桌面态因此不会漂移。
> - `listCharacters(scope?)` 的范围语义 = 「我的（给 authorId）∪ 公开（includePublic）」，
>   两者都不给即「仅公开」；实现在 `storage/characters.ts::filterCharacters` 一处定义，
>   HTTP 实现按同一语义合并 listUser/listPublic。
> - `saveAsset/readAsset` 承载素材字节：ref 形态由实现决定（桌面 `assets/<摘要>.<ext>`、
>   服务端 `/uploads/...`），契约只保证「同内容→同 ref、ref 可读回等价字节」。
> - 引用→显示 URL 的规则在 `storage/assets.ts::resolveAssetUrl`（纯函数，注入根目录与
>   平台转换器）；文件系统与 Tauri asset 协议经 `AssetStore` 端口注入，内核零平台依赖。

> 状态（2026-08-26）：契约已落地 `packages/editor-core/src/storage.ts`，
> 契约测试套件 `storage/contract.test.ts` 是一切实现的验收标准（Memory 实现先行，SQLite 随 Phase 2）。
>
> 路径更正（2026-10-01 实测）：那个单文件 `storage.ts` 已不存在——契约与实现现拆在 **`packages/editor-core/src/storage/`** 目录下
> （`contract.ts` 跑双支契约用例、`memory.ts` 是内存实现（`saveNarrative` 在 `:156`）、`contractAuthoring.ts` / `contractPools.ts` 拆脚手架）。
> 上面那句按当时实态保留；后续引用请指目录，别再指 `storage.ts`。
>
> 第二次更正（2026-10-09 文档↔实树机检实测）：上一段只纠正了 `storage.ts` 那一半，**`storage/contract.test.ts` 那个文件名从来没有存在过**——
> 现状是 `contract.ts` / `contractPools.ts` / `contractAuthoring.ts` **导出**契约套件，真正**跑**它的是
> **`packages/editor-core/src/storage/memory.test.ts`**（`import { runStorageContractSuite } from "./contract"`，同一文件还跑了 pool 与 authoring 两支），
> 云端与 Tauri 两支的实现则由 `apps/web/src/shared/storage/` 那 22 个测试文件按各自契约面覆盖。
> 所以上面"`contract.ts` 跑双支契约用例"这句也不准确：它是定义处，不是运行处。历史句子按当时实态保留。

## 三、内核原则 → 本项目落地映射

| 内核级原则 | 本项目落地 |
|-----------|-----------|
| 一切皆文件 → **一切皆事务** | §2.2：编辑入口只有一个 `apply(envelope)` |
| 机制与策略分离 | L2–L4 提供机制（事务/投影/契约）；快捷键、自动保存时机、toast 是 L5 策略 |
| 单一写入口 | 废除现散落写点（`updateScript`/`saveWriter` 各自改 state），收敛后 E2E 只需验证一条管道 |
| 不可变 + 结构共享 | §2.1，zustand 留在 L5 做订阅分发 |
| 有界资源 | §2.3 Journal 上限；缓存 TTL 由 L5 react-query 管理 |
| 显式失败 | §2.5 Result 类型；禁止异常穿透内核边界 |
| 概念征税制 | 新抽象仅此五个；F1/F2/F3 均为现有概念的组合（见 §六） |

## 四、术语表（一个词一个义，全仓强制）

| 术语 | 唯一含义 | 禁止混用 |
|------|---------|---------|
| **Draft** | 编辑器内存态文档快照 | 不叫 store/state/model |
| **Transaction (tx)** | 一次原子编辑意图 | 不叫 action/mutation/op |
| **origin** | 事务来源轨（cut/writer/flow/system） | 不叫 source（与边的 source 冲突） |
| **Journal** | 事务日志 | 不叫 history/log |
| **Projection** | Draft⇄AXS 纯函数 | 不叫 sync/exporter |
| **Provider** | 存取契约实现 | 不叫 repository/dao |
| Beat / Instruction / Stage | 沿用 IR 定义 | — |

## 五、性能预算（先定预算再谈优化，axiom 第三部 7.1）

| 操作 | 预算 | 保障手段 |
|------|------|---------|
| `apply` 单事务 @1000 条指令的 script | < 1ms | 结构共享，O(改动) |
| `draftToAxs` 全量投影 @200 节点 | < 50ms | 纯函数可缓存（按 rev 记忆化，属 L3 允许的实现细节） |
| Journal 内存 | ≤ 200 envelope | I7 |
| 快照深比较 | 不需要 | rev 相等即相等（I1） |

## 六、地基承载力证明：三融合如何落在内核上

| 融合项 | 在内核上的成本 | 新概念数 |
|--------|--------------|---------|
| **F2 角色轨**（Phase 3） | 时间轴拖拽 = 生产既有 tx（`script.reorder`/`node.patch`）；角色轨只是 L5 视图分组 | **0** |
| **F1 对等双视图**（Phase 4） | dirty 记序 = 读 journal 的 origin 序列；行级→指令级锚点 = L3 索引升级；局部精修 = `script.patch` tx | **0**（锚点表是数据结构非抽象层） |
| **F3 RN 进语法**（Phase 5） | IR 已有 codex 效果 → AXS 新指令由 L1 承接；剪辑台 FX 轨展示 = L3 投影多一种读法 | **0** |

三个融合方向零新内核概念——这就是「优秀设计减少维护成本」的可验收形态。

## 七、迁移映射（现有代码 → 内核归属）

| 现状 | 去向 | 备注 |
|------|------|------|
| `projection.ts` 全部纯函数 | L2/L3 | Phase 1b 迁移，单测先行（本轮已在原位铺测试） |
| `ProjectFlowPage.tsx` 中 nodes/edges/script useState 与 `updateScript` 等 | L2 store + L5 绑定 | 拆解后删除原文件（G1 清零点） |
| `rolesMap` N+1 fetch（`:422-444`） | L4 Provider `loadProject` 一次带出 | 行为不变的内聚优化 |
| `sanitizeScript` 清洗 | L2 `apply` 的 I3 校验内化 | 删除独立函数（铁律 7） |
| `useCutPlayback` / PreviewMonitor 试演 | L5（消费 StoryPackage，不经内核） | 引擎职责在 L0 |

---

*本文是 L2–L4 的「源码之前的事实」。实现与本规约冲突时：要么改实现，要么回写本文并说明理由——不允许沉默漂移。*
