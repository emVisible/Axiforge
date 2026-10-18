# Axiforge 桌面化重构宪章与阶段计划（REFACTOR）

> **文档性质**：本仓库一切工程工作的执行宪法与验收依据。
>
> **改名与主线（2026-10-18）**：本文件原名 `REFACTOR_DESKTOP.md`，`HANDOFF` 那份原名 `HANDOFF_DESKTOP.md`，
> 因 `desktop` 已快进合并进 `main`、主线不再是 `desktop` 分支而改名。**带日期的历史记录（BLUEPRINT 抬头、
> 提交清单、ADR 状态栏）一律保持原样**——改那些等于篡改历史；只有"现在时"的归属陈述被改过。
> **真相源关系**：上位决策 = [ADR-024](./ADR/024-desktop-local-first.md)（桌面优先战略）、[ADR-025](./ADR/025-axs-peer-dual-view.md)（对等双视图）；底层契约 = [KERNEL_DESIGN.md](./KERNEL_DESIGN.md)（L2–L4 构建规约）；本文件回答「做什么」与「怎么算做好」。冲突时以 ADR 为准，本文件随执行进展更新。
> **方法论底色**：axiom 第三部《技术实现宪章》、第四部《应用工程实践原则》。本宪章是其在本仓库的实例化——不重复论证，只落裁决。
> **日期**：2026-08-26 · **分支**：`desktop`（web 冻结线 `main` 只收 hotfix）

---

## 0 · 产品边界（2026-09-30）

### 产品定义

**Axiforge 是一款桌面互动叙事创作器：作者用 AXS 编写剧本，在剪辑视图中编排演出，在结构视图中检查分支，并在应用内即时预览。**

核心用户任务只有一条：创建或打开本地工程 → 编写/编排叙事 → 检查结构与预览 → 保存或导出 `.axsp`。

### 核心对象与权威

- **AXS 是唯一叙事文本语法**：解析与打印的语法权威只有 `packages/axs`，不得再造方言或第二解析器。
- **AXS 分支引用使用 Beat 标题**：工程内的目标节点 ID 在导出/打印时映射为目标标题；不能输出内部 ID，也不能静默丢失显式目标。
- **Draft/IR 是编辑期语义模型**：剪辑、剧本、结构是同一 Draft 的三个协同视图，不是三份独立数据；AXS 是可读、可编辑、可交换的文本投影，不再声明为唯一持久化真相源。
- **桌面工程是产品边界**：Tauri + 本地 SQLite/素材目录 + `.axsp`；`apps/web` 是桌面 renderer 与测试宿主，不作为独立用户产品发布。
- **Player 的范围是创作验证**：用于即时预览与检查作品，不以扩建成独立运行平台为本阶段目标。

### 本阶段非目标

- 社区平台：发现、发布、评论、关注、账号、跨设备同步与多人协作。
- 独立笔记产品、运营中台，以及需要与创作主流程并列呈现的子应用。
- 让云服务、AI 服务或外部账号成为创建、编辑、保存、导出工程的前置条件。
- 为了“功能完整”继续增加关系网、成就、跨作品记忆等运行时系统；除非它们直接改善上述核心任务，否则冻结。

Admin、Nexus、后端及浏览器态测试设施暂时保留为内部工具/迁移设施，不属于桌面产品默认入口。**本边界不授权提前删除它们**：仍按 S13 的“先替代、后删除”与验收基线搬迁顺序执行。

### 产品验收

一位创作者在不启动 API、PostgreSQL、Admin 或 Nexus 的情况下，能够从桌面应用新建/打开工程，在三种视图中编辑同一叙事内容、即时预览、保存并导出 `.axsp`；再次导入后内容与引用保持可用。各阶段只接受能推进这条任务、或保护它的工作。

## 第一部 · 重构宪章

### 一、质量观：九维验收矩阵

质量是多维的。每个维度必须翻译成本项目中**可判定**的验收问题——不可判定，即不可验收。

| # | 维度 | 验收问题（可判定） |
|---|------|------|
| Q1 | 结果质量 | 重构前后行为等价：同一工程数据在旧/新实现下产出相同的节点图投影与 StoryPackage。以 E2E 行为基线 + golden test 判定，不以「看起来还能跑」判定 |
| Q2 | 代码质量 | TS strict 无逃逸；新建文件 ≤400 行；循环依赖为 0；无 `any` 扩散 |
| Q3 | 文档质量 | 「为什么这样做」能在代码三米内找到；用户文档与解析器/实际行为一致；改协议必改文档（同 PR） |
| Q4 | UI 质量 | 设计令牌单一来源；日夜双主题下检验（衔接 ADR-023）；加载/空/错误/理想四态齐全 |
| Q5 | UX 质量 | 剪辑台全部操作键盘可达；异步失败可重试、不永久沉默；副作用不超出用户当轮可感知意图 |
| Q6 | 产品融合度 | 新交互服从 NLE 隐喻：时间轴 / 素材库 / 监视器 / Inspector 的词汇与行为一致，不引入第二套隐喻 |
| Q7 | 设计质量 | 新概念征税制：新抽象须证明无法用已有概念表达；一个词一个义——node / Beat / Instruction / Draft 全仓统一，禁止同义漂移 |
| Q8 | 可维护性 | 替换存储后端的改动趋近 1 个文件（依赖倒置）；修改一处，影响收敛一处 |
| Q9 | 可复用性 | `packages/core`、`packages/axs`、`packages/editor-core` 保持零 React/DOM 依赖（CI 断言） |

### 二、十条铁律

1. **行为不变优先** —— 重构轮次零行为变更；任何行为差异要么是 Bug 要么是显式声明的特性，不存在第三种状态。
2. **安全网先行** —— 动刀前先补测试；红-绿-重构是认知纪律而非仪式：红信号出现前，不进入假设阶段。
3. **单维度变更** —— 拆巨石不加功能，加功能不拆巨石；每次提交独立可回滚，回滚损失仅限该次目标。
4. **单一真相源** —— IR 唯一 TS 契约（`packages/core/src/ir.ts`）；同步协议只允许一份实现；解析、路由、术语表每类概念一处权威。
5. **深模块小接口** —— `editor-core` 对外 API 最小化、对内可拆；第二个消费者出现之前不制造接口。
6. **新概念征税制** —— 引入任何新模块/抽象/依赖/模式之前，先证明它无法被已有概念表达；引入后为其命名、文档与生命周期负责。
7. **删除即优化** —— 旧路径与新结构同步消亡；不留注释掉的代码、不留超过一个阶段的兼容垫片，用版本管理找回历史。
8. **失败路径先写** —— 写成功路径之前先填空：「如果 ___ 失败，返回 ___，调用方会 ___」。StorageProvider 的失败语义、损坏工程恢复、迁移回滚，先于 happy path。
9. **文档三层同 PR** —— 决策记为什么（ADR）、执行记做什么（本文件）、用户记怎么用（docs/user）；改协议或语法时三者同步。
10. **完成以产物为准** —— 门禁清单全绿 **且** 手动验收路径走通，缺一不算完成；「所有步骤成功但交付物缺失」必须降级为失败并记录原因。

### 三、量化硬门禁

以下为硬指标，未达标不得合入 `desktop`：

| # | 门禁 | 标准 | 检查方式 |
|---|------|------|------|
| G1 | 文件行数预算 | 新建文件 ≤400 行；存量超限文件按**当前长度设棘轮，只准变短**（`scripts/file-size-baseline.json` 登记 17 个，随所属阶段清零后删行） | `scripts/check-file-size.mjs`（已入 `pnpm gates`；已实测越线即 exit 1） |
| G2 | 测试覆盖率 | `packages/core` 与 `packages/editor-core` ≥90%（行+分支）；`packages/axs` round-trip 保持全绿 | vitest coverage |
| G3 | E2E 行为基线 | 动刀前 ≥6 条 Playwright 关键路径全绿并存档基线（清单见 Phase 1a），此后每阶段结束仍须全绿 | playwright test |
| G4 | 循环依赖 | =0（含 apps↔packages 方向） | dpdm CI 步骤 |
| G5 | 类型与 lint | TS strict；`no-explicit-any`；现有 lint 规则零新增违规 | tsc + eslint |
| G6 | 编译器等价 | StoryCompiler TS 移植与 Python 输出指令级 100% 一致（golden test，样本见 Phase 1d） | vitest golden |
| G7 | 依赖准入 | 新依赖须在提交说明中回答三问：能否五十行自写？停维护替换代价？实际使用率几成？ | PR 说明审查 |
| G8 | 提交纪律 | conventional commits 带 scope（`refactor(core):` / `feat(cut):` / `docs(adr):`）；单维度变更；无关脏文件永不入暂存 | git log 审查 |
| G9 | 文档同步 | 改协议/语法/端口的提交，同 PR 内更新 ADR 或用户文档 | diff 核对 |
| G10 | 完成声明 | 每阶段收尾走附录检查单，逐项打勾后方可打 tag `desktop-v0.x` | 本文件检查单 |

### 四、波次节奏与分支纪律

**每阶段固定六拍**：

```
计划 → 安全网 → 小步重构（每步可验证、可回滚）→ 门禁 → 文档同步 → 演示路径收尾
```

- 计划：写清范围、非目标、验收标准（写入本文对应阶段，勾选推进）
- 安全网：该阶段涉及的路径，测试先行于实现
- 小步重构：每一步提交后系统可用、E2E 可过；禁止「大爆炸式」长分支
- 门禁：G1–G10 全绿
- 文档同步：三层文档与代码一致
- 收尾：一条手动验收路径写在交付说明中；打 tag

**分支纪律**：短命分支从 `desktop` 拉出（`feat/*`、`refactor/*`、`docs/*`），完成即合回；阶段末在 `desktop` 打 tag。`main` 只接收 hotfix。

---

## 第二部 · 阶段计划

> 排期原则：质量优先于速度——宁可阶段内多一轮安全网，不带病进入下一阶段。各阶段验收项以 checkbox 推进，完成后在此留痕。

### Phase 0 · 产品收敛与默认入口

**目标**：让项目文档、日常启动和发行构建都把 Axiforge 桌面创作器作为默认产品；内部服务仍可显式启动，暂不删除。

- [x] 冻结本文件「产品边界」：AXS 唯一语法权威、Draft/IR 唯一编辑期语义模型、三视图协作、`.axsp` 本地工程交付。
- [x] `pnpm dev` 默认启动 Tauri 桌面应用；Web renderer 由 Tauri 配置自行启动。
- [x] `pnpm build` 默认构建 macOS `.app`；`.dmg` 安装盘用显式发行命令；renderer 与 Admin 构建保留显式命令，CI 明确调用它们。
- [x] `./dev.bash` 默认只开桌面 session；`./dev.bash all` 保留旧的多服务调试入口。
- [x] README 的快速开始与产品结构改为桌面优先，标出内部工具的显式启动方式。
- [x] 收敛首屏与导航：桌面根路径落到本地剧本列表（E14 回归测试）；创作导航保留剧本/道具/场景/角色，云功能依 S13-3 逐项显式缺席或摘除。
- [x] 统一战略文档与用户文档的产品口径；旧平台路线标记为冻结/历史，不再作为当前待办导入。

**验收**：`pnpm dev` 不启动 API/Admin/Nexus；`pnpm build` 产出 `.app`；`.dmg` 可单独请求；保留命令能显式构建 renderer/启动旧测试栈；无云服务时桌面创作主链路可运行。

### Phase 1 · 内核抽壳（当前阶段）

**目标**：把「编辑器大脑」从 React 巨石与 HTTP 后端中解耦出来，为 Tauri 壳铺平道路。全程零功能变更、零 UI 变更。

#### 1a 测试栈落地与行为基线

- [x] Vitest 接入 apps/web 纯逻辑层：`projection.ts` 行为基线 18 例全绿
- [x] `timelineUtils` 纯函数单测（`timelineUtils.test.ts` 9 例：characterTrack/insertShow/localIndex 全覆盖）
- [x] Playwright 落地：独立 e2e 库 `axiforge_e2e`（本机 PG 直连，alembic 全新链验证；开发库零接触），`pnpm e2e` 一键自包含闭环
- [x] 录制 6 条关键路径基线并全绿（确定性复跑通过，~8s）：
  - [x] E1 三轨切换往返（cut ↔ writer ↔ flow）不丢 script
  - [x] E2 剪辑台编辑指令并保存（重排片段 / 删除片段 / wait 时长修改）
  - [x] E3 剧本轨 AXS 编辑保存 → nodes/edges 同步覆写
  - [x] E4 工程添加角色 + 台词引用该角色
  - [x] E5 试玩链路：保存 → 编译 → 播放推进至分支
  - [x] E6 加载兜底：无 `axs_source` 的工程打开时自动投影生成文本
  - [x] E7 拖拽持久化：node.move → 保存 → 落库（三轮证明式，抗 fitView 时序抖动）

> 落地记录（2026-08-26）：E2E 揪出并修复迁移链真实缺陷（`002` 迁移在全新库与
> create_all 基线列冲突，已幂等化）——紧致闭环「能红」价值的首次兑现。

#### 1b editor-core 抽取（拆 ProjectFlowPage.tsx）

- [x] 新包 `packages/editor-core`：按 [KERNEL_DESIGN.md](./KERNEL_DESIGN.md) 实现 L2 文档模型（Draft/Transaction/Journal）+ L3 投影（自 `apps/web/src/features/writer/lib/projection.ts` 迁移），零 React/DOM
  - 55 例单测全绿；行覆盖 99.3%、分支覆盖 95.4%（G2 达标）；web 侧 18 例基线在适配器化后原样通过（行为等价证明）
- [x] `ProjectFlowPage.tsx`（1389 行）已删除 → `pages/editor/`：ProjectEditorPage 212 行薄宿主 + Cut/Writer/Flow 三工作台（157/46/115 行，G1 全达标）
- [x] Draft/Transaction/Journal 接入 ProjectFlowPage 状态层（一切编辑经 `apply`，单一写入口落地）
  - [x] 接缝落地：`useDraftJournal`（sync + dispatch 单一写入口）接入 `updateScript`（cut 轨）与 `saveWriter`（writer 记序）；未保存节点被 apply 拒绝时保持旧路径语义，零行为变更（绞杀者过渡态，E2E 基线原样通过）
  - [x] 拖拽记序：`node.move` 事务（内核 + E7 基线）+ `onNodeDragStop` 接线——拖拽过程走 React Flow 内部状态（高频），松手才入事务（分层设计先于 Draft 唯一持有者改造）
  - [x] 其余写路径收敛：表单/条件/效果/道具/重命名/边标签/删边/删节点/复制/onDrop 新建/onConnect 连线共 12 条全部经 `dispatch`（origin 按轨记序：cut/flow/writer）；未保存节点被拒绝时保持旧语义，零行为变更
  - [x] Draft 升级为图的唯一持有者，React Flow nodes 降级为投影（拖拽走临时层，dragStop 经 `node.move` 提交；`historyRef` JSON 快照机制删除，undo 改走 Journal；巨石 1608→1389 行）
  - [x] 内核配套：`node.restage` 事务 + `journalUndo` 更名导出（KERNEL_DESIGN 同步回写）
- [x] rolesMap N+1 收敛：新增 `GET /characters/batch`（后端 42 测试过）+ `fetchProjectDirectory`（道具 Promise.all 并行）
- [x] 验收：G1–G5 全绿；E2E 基线 7 条全绿；Q7 术语表已落 `packages/editor-core/README.md` ✅

> **G1 偏差记录**：`hooks/useProjectEditor.ts`（1084 行，headless 状态内核）超出 400 行预算。
> 理由：UI/逻辑分层优先落地（巨石已死，渲染文件全部达标）；该文件零 JSX、由 E2E 全程护航，
> 域拆分（graph/persistence）随 Phase 2 StorageProvider 改造一并处理——届时持久化层本就要重切。
> **G2/G4 偏差记录（v0.6 核验）**：`packages/core` 缺 `@vitest/coverage-v8` 依赖，覆盖率不可跑（史前状态，非本轮引入；editor-core 96.85%/93.38% 达标，axs round-trip 20/20 全绿）；
> 仓内无 dpdm/madge 配置与 CI 步骤，G4“循环依赖=0”无自动化断言（史前缺失；本轮零新增跨包导入）。两者均记为已知缺口，不阻塞 v0.6（纯核验轮，未引入新耦合）。
>
> **纠偏（2026-09-24，Phase 6 M4）**：上述两个缺口现已闭合——`@vitest/coverage-v8` 已装、`dpdm` 已装，`pnpm gates` 一条命令跑完 tsc(4 包) / vitest(core·axs·editor-core·web) / oxlint+颜色令牌 / 内核纯净度 / 循环依赖，并新增 CI `frontend-gates` job 执行它。
> 但覆盖率一旦可跑就暴露了新事实：**`packages/core` 实测 83.47% 语句 / 72.02% 分支，低于 G2 要求的 ≥90%**——此前因「跑不了」而被当作达标。差额记为 Phase 7 测试债，不下调门禁标准来迁就现状。

#### 1c StorageProvider 接口

- [x] 定义接口：listProjects / loadProject / saveNarrative / saveRoles / saveCharacters / …（已由 Phase2 L4契约 `packages/editor-core/src/storage.ts` 完成）
- [x] HTTP 实现（包装现有 api 层），web 应用全部数据访问经 Provider（`HttpStorageProvider` + Provider 工厂，Phase2）
  - **纠偏（2026-09-24，Phase 6 实测）**：本条「全部数据访问经 Provider」当时并不成立——工程列表（`useProjects`）、角色搜索、素材上传仍直连 HTTP。桌面打包离线实测表现为「播种成功但首屏空列表」。Phase 6 M3 已把 `useProjects`/角色 hooks/上传口接入 Provider，此处按实态改写，不删原记录。
- [x] 内存版 mock 实现跑通 E2E 子集（证明接口完整、UI 不直连 HTTP）（`MemoryStorageProvider` + 契约测试，Phase2）
- [x] 失败语义成文：每方法「如果失败，返回什么，调用方会怎样」（铁律 8）（`storage.ts` 判别联合 + contract.ts，Phase2）

#### 1d StoryCompiler TS 移植（2026-08-26 完成）

- [x] `packages/core/src/compiler.ts`：`compileStory(CompilerProjectInput) → StoryPackage`——输入与 L4 存储态同构（桌面断网链路：Provider.loadProject + listCharacters → compile → 引擎试玩）
- [x] 金样本 ×3（示范作①②③，含 codex 场景）：TS 与 Python 输出**逐字段一致**（G6）
  - 过程发现并修正 dump 脚本缺 `by_alias=True`（线上格式实为 `from`，FastAPI 按 alias 序列化）
  - 新增指令归一化层：对齐 pydantic 语义（按 op 白名单挑字段 + 可选字段补 null + 剥离多余字段）
  - IR 指令可选字段批量放宽 `| null`（对齐 Python 输出现实）；core 测试类型漂移顺手清偿
- [x] Python 编译器保留原位（web 冻结线继续使用），降级标注为对照基准；金样本再生成：`backend/scripts/dump_golden.py`

**Phase 1 非目标**：不加新功能、不改 UI 外观、不做 SQLite/Tauri、不动后端行为。

---

### Phase 2 · Tauri 壳与本地优先存储

**目标**：Axiforge 成为断网可用的桌面应用；`.axsp` 从远期规划变为工程容器。

**落地进展（2026-08-26）**：
- [x] L4 契约落地：`StorageProvider`（11 方法，判别联合失败语义，空值五义显式）——`packages/editor-core/src/storage.ts`
- [x] 契约测试套件 `storage/contract.ts`：一切实现（Memory/HTTP/SQLite）的统一验收标准
- [x] 双实现：MemoryStorageProvider（基准，含 bootstrap 语义）+ HttpStorageProvider（包装既有 api 层，404→not_found）
- [x] `.axsp` 容器 v0：manifest（版本/素材引用清单）+ 工程束；pack/unpack 逐字段等价测试 + corrupted 语义
- [x] SQLite 实现：`SqliteStorageProvider`（SqlBackend 抽象——生产 tauri-plugin-sql / 测试 sql.js 真引擎）+ schema v1（沿用 PG 关系模型，narrative_data JSON 文本列）+ 事务原子覆写 + **契约套件全绿**（85 测试，分支 93.4%）
- [x] TauriSqlBackend + Provider 工厂：`?`→`$n` 占位符翻译（sqlx 语法）+ 串行队列；**原子性下沉**——sqlx 池化下 BEGIN/COMMIT 跨连接失效（壳内冒烟实证），新增 Rust 命令 `sql_transaction`（单连接 + FK 级联）承载事务，回滚在真壳内实证 ✓
- [x] 壳内冒烟（DEV 自动运行，结果落盘 `~/Documents/Axiforge/storage-smoke.txt`）：create→bootstrap→覆写→回滚→**离线试玩编译**→角色去重→清理 全链路 PASS（8 步）
  2026-09-29 改动：冒烟不再自己拼 `compileStory(bundleToCompilerInput(...))`，改调 `loadStoryOffline`——投影层只允许有一处权威，手搓那份测不到真实入口的取数语义（正是它把下面那条缺陷藏住的）。断言加到「私有角色解析得到 + 道具清单非空 + 悬空引用不占位」。
- [x] 断网试玩链路：PlayerPage 桌面分支 `loadStoryOffline`（Provider 数据 → `compileStory` 本地编译，零触网）；存档/Codex/recordView 离线优雅降级（既有 catch 路径）
  **这一条勾得太早，2026-09-29 实测两处静默降级并已修**（「通路接通」不等于「渲染正确」）：
  ① 它用**无作用域的 `listCharacters()`** 取角色，而本地可见性语义是「我的 ∪ 公开」，私有角色在桌面上被裁成零条——**桌面试玩里所有说话人退化成 id、立绘与表情差分全空**（把实现改回旧形状，用例立刻报 `expected [] to deeply equal [ '凛' ]`）。后端从来不看可见性：`_build_characters` 走 `Character.id.in_(role_ids)`。现按引用取（角色/舞台/道具三个池同一规则），与后端逐字同义。
  ② `bundleToCompilerInput` 恒写 `items: []`：S13-2c 让编排台在桌面挂上道具之后，道具在试玩里仍然一个都不出现，而同一份数据经后端编译却有。引擎侧 `packages/core/src/compiler.ts:308` 早就实现了「本体缺失即跳过」，缺的只是投影层有人把这一格填上。
  金样本抓不到②：三份示范作的 `items` 全是 0（实测读 `__golden__*/input.json`），那条分支两侧都没走过——同 S13-2b 那条教训。现按同一规则三处各钉一条用例：TS 引擎（`compiler.test.ts` 三条）、投影+取数（`offlineStory.test.ts` 四条）、Python（`test_story_compiler.py::test_compiled_story_carries_item_refs`，含悬空引用与不去重）。9 次变异分别让对应那一条红（旧形状 listCharacters / items 恒空 / 不传舞台池 / io 演成缺席 / 悬空占位 / 引擎两处 / Python 一处）。
- [x] `.axsp` UI 集成：编辑器工具栏「导出」（dialog+fs / 浏览器下载）+ 工程列表「导入 .axsp」（导入 = 现有契约组合，新 id + 角色引用重建）；E2E E8 数据等价验收 ✓
- [x] 顺手修复两个真实缺陷：① apiClient 异常丢失 HTTP status（404→not_found 映射从未生效）② 后端 sync_narrative 跨工程 id 碰撞 500（.axsp 导入必踩；payload id 被其他工程占用时重映射新 id，边引用随动）
- [x] useProjectEditor 核心链路切换 Provider：装载（loadProject→bundleToResponse）/ 刷新 / saveWriter / **saveAll（逐节点 API 舞蹈 → 单次原子 saveNarrative，临时 id 客户端重映射，舞台模式保留域外节点）** / patchProjectMeta / axs 投影
  - outliner 场景/道具/角色目录暂留 HTTP（变更后经 refreshProject 汇合到 Provider 工程态）——断网场景的选角目录与舞台管理随角色域 Provider 化补齐
  - 语义裁决：saveNarrative/addRole/removeRole 先验工程存在（not_found）；损坏 JSON → corrupted 不静默兜底；io 错误路径全臂覆盖（ThrowingBackend）

- [x] `apps/desktop`：Tauri v2 壳落地（cargo check ✓ + dev 冒烟 ✓：窗口进程 + WebView 加载前端）
      插件：global-shortcut / fs（素材目录作用域 `$HOME/Documents/Axiforge`）/ dialog / opener；
      `pnpm dev:desktop` 一键起（beforeDevCommand 自动拉 web dev server）
- [x] StorageProvider 的 SQLite 实现（schema 沿用 PG 关系模型；`narrative_data` 保持 JSON 列）；素材落工程目录 + DB 存相对路径（`SqliteStorageProvider` + `sql_transaction` 原子，Phase2 8步冒烟 PASS）
- [x] `.axsp` 打包/打开（叙事 JSON + 素材引用清单）；SQLite 为工作缓存（`.axsp` v0 + pack/unpack + E8 数据等价，Phase2）
- [x] FastAPI 后端转为可选协作/发布服务；云能力缺席时全部创作流可用（断网试玩链路 PlayerPage `loadStoryOffline` + 桌面离线降级，Phase2）
- [x] 验收（2026-08-26）：
  - `.axsp` 导出再导入数据等价 → **E2E E8 断言** ✓
  - 断网链路各环节实证 → 壳内冒烟 8 步 PASS（create/bootstrap/覆写/回滚/离线编译/角色去重/清理）+ release 产物冒烟（.app 运行 + SQLite 自动建库）✓
  - macOS 构建产物 → `Axiforge.app` + `Axiforge_0.1.0_aarch64.dmg`（5.0M，未签名本地可运行）✓
  - 端到端手工走查（断网真机全流程）留待首次实际使用确认；自动化覆盖已及各环节

**Phase 2 完成。**

**非目标**：自动更新、签名公证、多窗口、移动端。

---

### Phase 3 · F2 角色即轨道（首个融合项）

**目标**：补齐 NLE 体验的角色维度——角色从「下拉框里的 ID」变成时间轴上的一等公民。

- [x] 时间轴增加可折叠角色轨：show / hide / move / 表情切换轨上拖拽编排（扩展 `timelineUtils.ts` 分轨槽位机制）
- [x] 素材库面板渲染 `character_data.sprites` 差分图，拖入即生成指令
- [x] 角色工作台独立入口（六层模型 + 传记 + 立绘管理），作品 = 选角 + 编排
- [x] 验收：一段 ≥2 角色 × ≥3 表情切换的演出纯拖拽产出且键盘可达；四态齐全；日夜主题检验通过
- [x] E2E 基线扩至 ≥8 条（新增角色轨编排 ×2，E9/E10，现 10 条）

**非目标**：音频轨扩展、镜头关键帧曲线、Live2D。

---

### Phase 4 · F1 对等双视图（落地 ADR-025）

**目标**：废除整篇重生成式镜像，剪辑台与 AXS 平级共生。

- [x] 编辑事件 dirty 记序，「最后编辑者权威」取代「文本优先」（editOrigin 修正 + saveAll dirty guard）
- [x] parser line 映射升级为指令级锚点（片段 ⇄ AXS 行号双向索引，AxsBeat.lineMap + instructionLineForNode；最小 diff 写回构想就绪）
- [x] 剪辑台内嵌迷你 AXS 片段精修器（选中片段 ⇄ 高亮对应文本行，MiniAxsEditor + 双向映射）
- [x] round-trip 单测扩展（lineMap 专项 4 例：基本/show+say合写/查询/回退；roundtrip 18 例全绿）
- [x] 用户文档同步：`docs/user/writing/axs-syntax.md` 已更新为对等双视图 + last-editor-wins + 迷你精修器说明

**非目标**：全文协同编辑、CRDT、实时多人。

---

### Phase 5 · F3 RN 进语法（护城河显影）

**目标**：把 RN 维度暴露进 AXS 与剪辑台——竞品抄不走的那一层成为日常创作词汇。

- [x] AXS 新增 `@memory` / `@relation` 类指令（IR 已有 codex 条件/效果，纯语法层暴露）：parser / printer / 单测 / 语法文档同步（`@relation A.B.field = val` / `relation.A.B.field op val`）
- [x] FX 轨可视化关系值与记忆变化（RN 行：timelineUtils effectLabel/effectColor + TimelineShell RN 轨 + CutStudioView 透传；E11 验证）
- [x] 示范作修订：至少一段剧情的关系分支可直接在剧本轨书写、在 FX 轨检视（seed_showcase 缘起·选择/再会·记忆加入 @relation 效果与 relation 条件；新增旅人角色；E11 闭环）

**非目标**：世界 tick、AI 运行时、跨作品自动继承策略变更。

---

### Phase 6 · 桌面素材与分发闭环（进行中 · 执行件 = `BLUEPRINT_v0.7.md`）

**目标**：把桌面端从「地基已铺好」推到「打包产物真的能用、作品真的能给人」。取证结论见 Blueprint §1。

- [x] M1 素材本地闭环：`saveAsset/readAsset` 进 L4 契约（Memory/HTTP/SQLite 三实现）+ `assets/<sha256>.<ext>` 内容寻址落盘去重 + 壳二进制权限与 `assetProtocol` + `ImageUpload` 注入点与 `getImageUrl` 一处委托
- [x] M2-1 `.axsp` v2 容器：zip（manifest/project/**characters**/assets）+ v1 只读兼容 + `remapCharacterIds`
- [x] M2-2 导出/导入接真实字节与演员表；E12 基线（12 条）
- [x] M2-3 示范作随包分发与空库首启播种（`public/seeds/` + `seeded.json` 标记 + `SeedOutcome` 可观测；全新库实测 `seed=seeded:3`，二次启动 `skipped:non-empty`）
- [x] M3 桌面可达域收口：角色域 Provider 化（hook 层按环境分派，web 零变更）、缺席域显式降级（概览/发现/全局搜索/筛选/版本·关系·传记·Fork·删除不给入口）、错误态抑制空态（`resolveQueryState` 四态互斥 + 用例）、首屏落本地工程列表 —— 打包壳截图确认：三部【示范】工程在列、云端入口已消失
- [~] M4 门禁固定税（CI 前端门禁 + dpdm + coverage）+ ADR-026 + 三层文档对账
  已交付（2026-09-29）：`dpdm`（`check:circular`）与 `pnpm coverage`（G2 阈值）现在都在 `pnpm gates` 里，
  CI 的 `frontend-gates` 就跑这一条命令，并**删掉了它后面那份重复的 core-only 覆盖率步骤**
  （两份会漂——过去真正被执行过的一直是第二份，gates 里压根没有覆盖率）。
  同时补上触发条件：`on.push.branches` 原先只有 `[main, master]`，而 v0.8 起所有工作都直接推 `desktop`，
  等于**这条分支上的提交一道 CI 都不跑**。ADR-026 与三层文档对账（README/BACKLOG/docs-user）此前已交付。
  未交付的两件：① CI 以桌面构建为主目标（属 S13-5，见下）；② **本条 CI 改动本身还没在远端跑过一次**——
  `gh` 在本机未登录，Actions 结果看不到，所以「desktop 推上去真的会跑、且在 ubuntu 上真的绿」目前是推断。
  已知风险点：覆盖率阈值换到 CI 的 v8/Node20 环境可能算出略微不同的分支数，
  若首跑因此变红，处置是补测试或按环境差异记录，而不是把阈值调低。

**非目标**：不拆巨石（Phase 7 单列）、不做签名公证/自动更新（Phase 10）、不做音频素材入口。

---

### Phase 7 · 巨石清偿与运行时一致性（v0.8）

**目标**：G1 预算清零 + 播放内核解耦。铁律 3 单维度：本轮只拆不加。

> 行数一律以 `scripts/file-size-baseline.json` 为唯一来源，本阶段清单不再手抄具体数字（下列条目里的行数是立项时的快照，会随修改失真）。

- [ ] `PlayerPage.tsx`（1370 行）→ IR 渲染器分层：播放状态机（纯逻辑入 `packages/core` 或 editor-core L2 同级）、指令执行器、舞台视图、系统菜单/存档面板；渲染文件全部 ≤400 行
- [ ] `useProjectEditor.ts`（1164 → **1089 行**，v0.8 M3 进行中）→ 域拆分。判据已从「按四域名词预切」改为两条真判据：**依赖方向**（不读图内容者归视图域）与**纯度**（纯计算先外提，可单测且零行为风险）。已交付 `useCanvasView` 与 `editorProjection`（后者补上投影层此前零单测的空洞）；余 persistence 与 node-inspector 两域（宪章 1b G1 偏差记录的欠账，Phase 2 时承诺未兑现）
  **2026-09-29 进展与一条如实的改判**：本轮按「纯度」判据外提了 Inspector 的读写侧三个纯函数
  （`inspectorFromNarrative` / `patchFromForm` / `conditionGroupFromItems`）进 `editorProjection.ts`，
  补 9 条用例、3 次变异见过红（写侧不再归一布尔、空条件组写成恒真组、读侧不再兜 `trigger_condition` 缺 `conditions`）。
  文件 1089 → **1081 行**（口径按 `check:size`：它数 `split("\n").length`，比 `wc -l` 多一；棘轮已收到 1081 锁住这一寸）。但**剩下的 persistence 不是一次文件搬运**：纯计算早已在
  `editorProjection` / `stageLayout` / `exportProjectMarkdown` 里，留在 hook 中的部分与 React state 交叉引用，
  `saveAll` 一次要同时拿 draft、dragPositions、rolesMap、providerRef、toast、refresh 六样——
  按「依赖方向」判据它不属于「不读图内容者」，硬拆只会得到一根传十几个 setter 的假模块。
  下一步需要先给这块定一个命令式 seam（reducer 或显式的 save 编排对象），再谈拆文件。这条保持未勾，
  并把「先设计后搬运」写在这里，免得下一轮又照名字切一刀。
- [x] 道具与场景资产域本地化（v0.8：契约 + schema v3 + 分派口 + 双支单测）：`asset_items` / `asset_scenes` 随 v3 进本地库，桌面侧栏这两页不再离线报「读取失败」（Phase 6 已把错误态显式化，不再伪装成空态）。**当时同一批没做的 `project_asset_refs` 直到 S13-2c（schema v5，2026-09-29）才补齐**——那一条欠账的形状不是"页面报错"而是"写进去读不回来"，比报错更难发现
- [x] 四态原语：`packages/ui` 新增 `QueryStatePanel` + `pickQuerySlot`（穷尽 switch，缺一态即编译不过），状态词表与判定分离，宿主 `resolveQueryState` 复用同一词表；已迁移角色页与剧本清单页两个既有消费者，其余页面按 Phase 8 逐屏巡检迁移
- [~] 本地工程元数据补齐 —— **原文前提的一半已不成立，按实测改判**：原文写「SQLite `projects` 表只有 id/title/is_public/axs_source/author_id/时间戳，缺 `description`/`cover_image`/`theme_tags`/`mechanism`/`genre`/`is_meta` 等列」。这六列**已随 v0.8 schema v3 进入本地库**（`sqlite/backend.ts` 的 `COLUMN_PATCHES` 带「缺列才 ALTER」的幂等迁移），`projectMetaToResponse` 已逐字段透传而非填空值，契约套件断言 `themeTags` 写→读往返。故「一律显示暂无描述」不再成立。
      **写入面未闭环，且 2026-09-24 复核时查出一处真实缺陷（三支实现口径不一致）**：
      ① SQLite 转发全部 8 个 patch 字段；
      ② HTTP 实现只转发 `title`/`axs_source`，因此 `description`/`theme_tags`/`mechanism`/`genre`/`cover_image`/`is_meta` 在 **web 支被静默丢弃**；
      ③ 编辑器 `useProjectEditor.patchProjectMeta` 的入参类型是 `Pick<ProjectUpdate, "title"|"description"|"world_setting"|"rules">`，而 `ProjectMetaPatch` **根本没有** `worldSetting`/`rules` 两个字段——它们两支都不落库，界面却照样弹「已保存项目信息」。tsc 不报错的原因是把非字面量的 `patch` 变量直接传参，绕过了 excess-property 检查。
      ③ 的键名不一致在源头消除而非下游加翻译层。证据：`pnpm gates` 退出码 0（typecheck tsc -b + 四套单测
      + 令牌/纯净度/循环/行数棘轮/对比度），`pnpm e2e` 13/13（17.3s）；契约套件断言扩到全 patch
      并新增「局部 patch 不得改写其余字段」，HTTP 支补 `metaPatchToUpdateBody` 等价用例，
      该用例对旧实现实测为红（临时回退旧文件跑过一次，非推定）。
      **仍未闭环的是编辑入口，不是存储**：`theme_tags`/`mechanism`/`genre`/`cover_image` 四栏
      契约与库都支持写入，但 UI 只给了简介/世界观/规则三个输入口——
      「标签与机制筛选在本地无数据可筛」这半句到今天仍然成立，因为没有人能填进去。
      补这四个入口属功能新增，按铁律 3 不夹带进本刀，登记待做。
- [x] 存档与成就本地化（v0.8：本地四步回路可存可读，后台写入失败改为可见）：`save_slots` / `player_achievements` 进 SQLite schema，桌面断网可存可读（当前离线仅优雅降级）
- [x] ~~`packages/ui` 与宿主 UI 目录双份归一~~ —— **本条前提不成立，已核实**：`apps/web/src/shared/components/ui/index.ts` 本就是 `export * from "@axiforge/ui"` 加 4 个宿主绑定件；按文件基名与导出符号两处比对，与 packages/ui 的 40 个组件、85 个导出**零同名重复**，唯一的 `ImageUpload` 是刻意覆盖（网页 fetch / 桌面本地口）。已把该覆盖写成注释显式声明，不再需要「归一」这项工程
- [ ] 验收：G1 清单为空且原文件已删；E2E 12 条原样全绿；离线存档 E2E/E13

**非目标**：新玩法、新指令、视觉改版。

> **进度实测（2026-09-24 · v0.8 M1，未勾项如实保持未勾）**
>
> 已落地：四个离线域（道具 / 场景 / 存档 / 成就）进 L4 契约共 17 个新方法；SQLite schema v3
> 补 5 张表 + `projects` 6 个元数据列（旧库经 `COLUMN_PATCHES` 幂等升级，另有专门用例验证）；
> Memory / SQLite 由**同一份**契约套件双实现验收，editor-core 用例 113 → 128 全绿；
> 门禁 `typecheck` / `test:unit` / `check:purity` / `check:circular` 全绿。
>
> 套件的即时价值：一次抓出两个真实缺陷——存档 `INSERT` 声明 9 列只传 8 参（NOT NULL 直接失败），
> 以及内存实现的元信息补丁静默丢弃新字段。后者若无单一测试源，只会在桌面实测时才暴露。
>
> 本阶段清单未勾的两个理由：
> ① 随包示范作早于新列生成，重导出（须联后端）前卡片仍显示「暂无描述」；桌面**自建**工程的
>    元数据读写与显示链路已通。
> ② **本轮一度恶化 G1，已清偿**：三个 Provider 曾涨到 523 / 433 / 414，现按域外提为
>    `SqliteProjectStore` / `MemoryPools` / `httpDomains` 协作模块，回落到 280 / 356 / 387，
>    行为零变更（128 例契约套件原样全绿）。播放页净增 22 行是失败可见化的代价，仍列为拆分对象。
>
> 清偿过程中新建了行数棘轮门禁并接入 `pnpm gates`，同时**纠正本文件一处长期错误认知**：
> G1 原先写「lint max-lines + 人工核对」且把清单写成 1 个文件——实际从未有 lint 规则在管这件事，
> 真实债务面是 **17 个文件**，含 `packages/core/src/engine.ts`(568)、`compiler.ts`(439)
> 与 `packages/axs/src/parse.ts`(587) 三个从未被 G1 收录的内核文件。
> 「Phase 7 验收 = G1 清单为空」因此比原估的大得多，已按棘轮改为分阶段收缩而非一次性清零。
>
> 已闭合的原判据缺陷：四个离线域的分派口（道具/场景、存档、成就定义）各留一个注入点，
> 使桌面本地支在 node 测试下真正可执行——此前「e2e 无后端通过」那条判据在浏览器态**结构上不可达**。
> 附带修掉一处同类错误伪装：成就面板 `refresh` 只有 `try/finally` 无 `catch`，
> 请求失败时列表停在 `[]` 却照样显示「还没有成就定义」。
> 存档/成就的四步本地回路、覆写不追加、未写过→null、底层失败显式化、
> 以及「手动存档失败不再关闭面板」均已有双支单测（web 用例 54 → 70）。

---

### Phase 8 · 设计系统收口（v0.9 · UI 与视觉设计专项）
> **版本排期变更（2026-09-24，按本文件第三部第 6 条显式声明理由）**
>
> Phase 8 提前开工，Phase 7 剩余四项结转。理由不是「设计更好玩」，而是本轮修好的
> Tailwind 源扫描缺陷改变了前提：产物 CSS 此前一直缺着共享组件库的样式，
> **在这个基线上做 Phase 7 的剩余拆分，等于给一批实际没生效的样式做重构**；
> 而 Phase 8 的逐屏巡检必须以修复后的基线为准，否则结论全部作废。
> 于是先取修复带来的新信息（令牌门禁扩容 + 字阶缺口），结转纯结构性的剩余项。
>
> Phase 7 结转清单（未静默丢弃，逐项可查）：
> ① `useProjectEditor` 的 persistence 与 node-inspector 两域——实测 9 个函数交错在 197–932 行之间，
>    依赖 providerRef/draft/dispatch/project/setSaving 多路共享，需要独立一轮按序拆，不抢刀；
> ② `PlayerPage` 分层（先建播放内核安全网再拆，顺序不可颠倒）；
> ③ 随包示范作重导出（须联后端，且未找到不重复定义内容的单权威路径，方案待定）；
> ④ `packages/core` 覆盖率 83.47% → ≥90%（本就在 Phase 8 清单内，未动）。
>
> Phase 7 已交付部分：四域离线化 + 契约单条读口 + 四态原语 + 视图域与投影层拆分 +
> 行数棘轮与令牌棘轮两道新门禁。
>


**目标**：让产品「像成品，不像工程」。本轮是纯设计轮，产出可对比的视觉证据。

- [x] G2 覆盖率（`packages/core` 与 `packages/editor-core` 行+分支 ≥90%）—— 两包两轴都过，且**这次真的挂进门禁了**
  2026-09-29 实测（`pnpm coverage`）：
  - `packages/core` **98.62% 行 / 90.07% 分支**（立项时 83.47 / 72.02）。补的三批用例分别针对
    引擎分支行为（wait / 未知 op / 起始拍回退 / 成就播报 / 存档退化）、编译器那些「金样本恰好不走」的
    分支（旁白、手动选项、术语表、旧数据 `scene.nodes` 回退、表情差分），以及条件求值的
    **「读不到只喂 `ne`」**语义——最后这条此前一字未测，而它是两端分支判据的地基。
  - `packages/editor-core` **95.46% 行 / 86.24% 分支**。此前记在文档里的 96.85 / 93.38 已失真。
    同时纠正一处**测量口径错误**：契约运行器拆成 `contract.ts` / `contractPools.ts` / `contractAuthoring.ts`
    三个文件时，覆盖率排除列表还只写着第一个，于是 39 条只有一侧可达的脚手架分支被算进生产分母。
    排除口径补齐后数字才是生产代码的真实值（也才第一次真正对上 thresholds 里那条 90%）。
  - **新事实：门禁根本没在管这件事。** `vitest.config.ts` 里写着 `thresholds: { lines: 90, branches: 90 }`,
    而 `pnpm gates` 跑的是不带 `--coverage` 的 `test:unit`——所以 editor-core 那条分支阈值一直在**静默不达标**
    同一天补齐并锁死：`pnpm coverage` 已插进 `pnpm gates`（排在 `test:unit` 之后），
    `packages/core` 也补了 `thresholds: {lines:90, branches:90}`（原来只有 editor-core 写着阈值，
    而 gates 跑的是不带 `--coverage` 的 `test:unit`，所以那条阈值一直是纸面的）。
    **见过它红**：临时塞进一个 5 分支未覆盖的函数，core 立刻掉到 89.85% 并报
    `Coverage for branches (89.85%) does not meet global threshold (90%)`；删掉后回到 90.07%。
    余下缺口补的是 SQLite 本地库的失败与缺值形状：`runtimeLocal.ts` 现在 100%/100%，
    `assetPool.ts` 98.13%/85.71%（只剩场景 UPDATE 那一段），`axsp.ts` 80.35% 分支仍是余量。
    新增 10 条用例钉住：底层抛错时 17 个方法一律返回 io 而不穿越异常；JSON 列被写坏时
    `corrupted` 点名是哪一列，且清单读取不许把坏行悄悄少给一条；从未写过的槽位 / 不存在的成就 /
    挂在不存在工程上的成就定义都是 `not_found` 而不是假成功；最小行读回来的五种空值
    （空串、null、未公开、空数组、空对象）逐字段核对。
    余量只有 0.07~0.26 个点：**新增未覆盖分支会立刻红，这是有意的棘轮**——补测试，不要降阈值。
  本轮每条新判据都配了一次「让它先红」的变异：把代码改回缺陷形状，只有对应用例失败、其余全绿才算数
  （其中三次注入本身语法失败，重做后才有结论——失败的变异不算证据）。


- [ ] 四态原语逐页迁移：`shared/lib/queryState.ts::resolveQueryState` 已建立并接入角色页与剧本列表页；道具/场景/发现各 tab/玩家页收敛到该原语（Phase 6 已逐页修正行为，此处统一形态）
- [ ] 设计令牌审计：字阶（type scale）、间距韵律（4/8 基准）、圆角与阴影层级、色彩语义（禁硬编码，`check-ui-tokens.mjs` 覆盖面扩到全 apps）
- [ ] 日夜双主题复检（ADR-023）：逐屏截图对比，修不可读对比度（WCAG AA 文本 4.5:1）
- [ ] 四态全覆盖巡检：加载/空/错误/理想 每一屏都有设计且互斥（Phase 6 M3 发现的「错误态与空态同屏」类缺陷系统性排查）
- [ ] 动效语义化：转场解释空间关系、操作有反馈、等待有进度；建立动效时长与缓动令牌，删除纯装饰动效
- [ ] 工作台信息架构：侧栏/工具栏/Inspector/时间轴的视觉权重与留白节奏重排（NLE 隐喻一致性 Q6）
- [ ] 验收：设计令牌单一来源且无硬编码；改前/改后截图成对存档于 `docs/design/`；键盘可达全通过；四态巡检表逐项打勾

**非目标**：不改功能语义、不加新界面能力。

> **Phase 8 进度实测（2026-09-24 · v0.9 M1–M3 已交付，M4 进行中）**
>
> 已完成并取证：
> - **对比度成为可计算的门禁**（`scripts/check-contrast.mjs`，已入 `pnpm gates`）：
>   18 个颜色桥接的双主题完整性 + 32 组前景/背景配对比值，正文 4.5:1、大字与非文本 3:1。
>   上线即抓出 9 项真实不达标（含操作召唤「空格继续」对黑底约 1.2:1）与一处我自己造成的
>   悬空令牌（`--ax-ink-on-scrim` 只写在暗色块）。全部修好。**「看着还行」从此有数可查。**
> - **字阶低端补齐并收口**：`--text-3xs/--text-2xs`；apps/web 与组件库内
>   9px 与 8px **全清零**（45 处），另有 122 处 10/11px 做成了**可证明等价**的替换
>   （刻意不给令牌加行高，否则「等价」立刻不成立）。
> - **动效收口**：全仓 `transition-all` 归零（26 处），每处属性表按同串里真实存在的
>   hover/active/内联样式逐处推导——进度条靠 `style={{width}}` 驱动，套模板会直接杀死它的动画。
> - **公开发现页不再把失败伪装成空态**（三个 tab 只有 `try/finally` 无 `catch`），
>   停机正反截图为证。
> - **门禁作用域按界面语汇分治**：沉浸式玩家页不套「必须走语义令牌」的硬规则
>   （会一次误报约 150 处、常红的门禁等于没有门禁），改由低透明度文字棘轮管，
>   量化出 62 处并提亮其中 15 处必读文字。
>
> 未完成（不粉饰）：
> - 逐屏巡检只覆盖 8 屏；角色详情、作者页、创作者概览、admin 端未看
> - 四态原语只迁 4 页（角色 / 剧本列表 / 道具 / 场景），discover 三 tab 仍是手写分支
> - 间距韵律、圆角与阴影层级、动效时长与缓动令牌 **一行未做**
> - 工作台信息架构重排 未做
> - `packages/core` 覆盖率 83.47% 语句 / 72.02% 分支 → ≥90% 未做（**门禁标准不下调迁就现状**）
>
> 精确入口与验证前置检查见 [`../BLUEPRINT_v0.9.md`](../BLUEPRINT_v0.9.md) §9。
> 另：Phase 7 结转四项（PlayerPage 分层、编辑器两域、随包 `.axsp` 重建、core 覆盖率）仍在原清单上。

> **起手项（2026-09-24 实测截图发现 → 同日已修复）**
>
> 剪辑台右栏下拉曾呈现**浏览器原生外观 + 一枚脱离字段的 ⌄**。组件源码与调用方都是正确的，
> 真正原因在构建层：`apps/web/src/index.css` 只有 `@import "tailwindcss"`，而 **Tailwind v4 的
> 自动源扫描不覆盖 `apps/web` 之外的 workspace 包**，于是凡**只在 packages/ui 出现**的工具类
> （`appearance-none` / `right-3` / `top-1/2` / `pr-10` …）一律不进产物 CSS——组件代码正确、
> 页面却掉回浏览器默认样式。`absolute`、`pointer-events-none` 看着正常，只是因为 apps/web 恰好也用了。
>
> 修复 `@source "../../../packages/ui/src";`。A/B 各自 `rm -rf dist` 全新构建：
> hash `index-C3-IQ7pF.css` → `index-BPPCzzhg.css`，体积 **90,043 → 103,863 字节（+13.8KB）**，
> 上述四类工具类由「0 次」变为存在；无头浏览器截图确认箭头落回字段内、原生外观消失。
> 回归：E2E 13/13 全绿，`pnpm gates` 退出码 0。
>
> **本条同时是一次方法自纠**。上一轮我曾把该根因记为「已排除」，理由是「加了 @source 后 hash 未变」——
> 那个对照本身无效，错了两处：① 相对路径少写一层（从 `apps/web/src` 出发 `../../` 只到 `apps/`，
> 解到不存在的 `apps/packages/…`，而 Tailwind 对不存在的源**静默忽略**，看起来就像「加了没用」）；
> ② 我比较的两次构建**都在改动之后**，从未取得真正的改前基线。
> 教训：**宣布假设被证伪之前，先验证对照组本身成立**——路径按解析结果核实、产物各自全新构建、
> 比较必须有一侧是真基线。被误标「已排除」的修复，代价是缺陷会带着「我们查过了」的标签活下来。
>
> 由此推论：Phase 8 之前所有「设计令牌统一」的观感结论都不可信，因为共享库的一部分样式从未生效。
> 逐屏巡检需在新基线上重做一遍。

---

### Phase 9 · 演出上限证明（v1.0 · 楔子1 成败判据）

**目标**：不写一行代码，做出一段 ≥30 秒、有镜头语言与配乐的方舟风格演出，且**在打包桌面端可看、可导出、可交给别人**。

- [ ] 演出节奏曲线与关键帧（旧 AXIFORGE_V2 波次 0 后置项，见 [归档路线](./archive/AXIFORGE_V2.md)）
- [ ] 音频轨：环境音 / ducking / crossfade / 音画同步；素材入口从「仅图片」扩到音频
- [ ] 示范作①②③补真实立绘、背景、BGM（当前 `seed_showcase.py` 零素材引用——北极星「演出上限证明」此前无载体）
- [ ] 验收：新用户 30 分钟内从模板改出一段含立绘与 BGM 的三场景短篇；示范作 `.axsp` 在另一台机器导入后演出完整

**非目标**：Live2D、视频指令、3D。

---

### Phase 10 · 桌面产品化（v1.1 · 分发与运维）

**目标**：从「我能跑起来的 .app」变成「别人能装上、坏了能自证」的产品。

- [ ] 签名与公证（macOS）+ 自动更新（或应用内检查更新与下载引导）
- [ ] 本地诊断包：日志滚动 + 一键导出（含版本、Provider 形态、素材目录状态），失败路径可远程归因
- [ ] `.axsp` 拖拽到窗口打开、最近工程与缩略图、首启引导三件套
- [ ] 验收：全新 macOS 环境（无后端、无 dev 代理）安装 → 播种 → 创作 → 导出 → 另一机导入播放，全程零命令行

**非目标**：Windows/Linux 打包、多窗口、移动端。

---

### Phase 11 · RN 深化与云回写（v1.2 · 楔子2/3 闭环）

**目标**：桌面创作的作品能回流到协作/发布服务，RN 维度跨端一致。

- [ ] 发布通道：桌面工程一键发布到后端（`is_public` + 发现页可玩），素材随包上传，冲突策略明示（本地为权威，云端为投影）
- [ ] Codex 跨作品记忆在桌面可用（含离线读写与上线后合并策略）
- [ ] 关系网本地化：角色关系子图进 SQLite + 桌面检视
- [ ] D6 交互机制试点：限时选项（可插拔机制模块的第一个）
- [ ] 验收：桌面发布 → 网页发现页可玩 → 玩家 Codex 记忆在桌面续作中生效

**非目标**：实时协同、CRDT、评论社交深化、付费。

---

### Phase 12 · 本地化与可访问性（v1.3 · 远期收口候选）

**目标**：D11 与 a11y 两项长期空白一并清偿。

- [ ] 文本外置与中英双语（UI 文案与示范作分离；AXS 叙事文本不机翻）
- [ ] 键盘可达与语义标注审计（焦点顺序、ARIA、屏幕阅读器关键路径）
- [ ] 验收：切换语言无漏字；关键路径纯键盘可完成

---

### Phase 13 · web 退场（桌面成为唯一产品形态 · 2026-09-26 人类决议）

**决议原文**：「我只要桌面端的」。据此，"去掉 web"不再是运行模式层面的含糊说法，落成两件事：**后端退场** + **浏览器形态不再是产品**（`apps/web` 本身删不掉，它就是桌面渲染层）。

**要先记住的代价（选定的成本，不是意外损失）**：后端一走，UGC 生态（ROADMAP 楔子3：发布、发现、评论、角色 IP 跨作品流转、创作者面板）就没有载体了。桌面只剩「本地创作 + 本地试玩 + `.axsp` 交付」。这与 ADR-024 里「web 原生零安装是三大差异之一」直接冲突，故本阶段必须配一条修订 ADR 的 ADR，不能静默偏离。

**执行不变量（顺序错了就会砸掉自己的安全网）**

1. **先替代，后删除**：任何能力在被本地实现顶替之前不得摘除入口。
2. **验收基线最后搬家**：13 条 e2e 与 CI 的 `build-and-test` 目前跑在浏览器态上，它是这一路唯一的回归安全网。**在壳内冒烟或注入式本地库覆盖同等行为之前，浏览器 run mode 必须继续活着**——它是测试宿主，不再是产品。
3. 每一刀结束都要 `pnpm gates` + `pnpm e2e` 全绿，且新加的门禁先红过一次。

**切片（有序）**

- [x] S13-1 传记本地化：`stories` 进 L4 契约（list/get/save/delete，挂角色之下）+ SQLite 建表 + Memory/SQLite 共用契约断言 + 前端分派口。**它是创作主数据，不是云社交功能，没有"判死"这个选项**
  —— 已交付 2026-09-26：`StoredStory` + 四方法进契约（`wordCount` 由实现重算，客户端送值不作数）；SQLite schema v4 建 `character_stories`；契约套件的传记用例同时跑在 Memory 与 SQLite 上（editor-core 130→132）；前端 `storySaves` 分派口，`useStories` 五处调用全部改线、`storyApi` 残留 0。E15 加两条传记路由（13→15 条），并已见过它红：把分派口的本地判断强制为假后，红在 `/api/v1/characters/no-such-character/stories/no-such-story`。已知两端差异：HTTP 清单端点服务端裁掉 `content`，本地清单带正文——调用方不得把清单正文当权威
- [x] S13-2a 编排台（剪辑台侧栏）：新建/删除舞台 + 角色加入/移出 在桌面可用
  —— 已交付 2026-09-26。**先记下这一刀查出来的事实，它们比改动本身贵**：
  1. 编排台在桌面**可达且没有任何守卫**（`/studio/projects/:id` → `ProjectEditorPage` → 默认 cut 模式 → `CutWorkspace` → `CutStudioView` → `OutlinerPanel`），而它六个写操作此前 100% 直连 HTTP——整个侧栏在桌面上是一个按钮都按不动的。
  2. `addRole`/`removeRole` **在 L4 契约里早就有两端实现了**（SQLite 与 HTTP 各一份），缺的只是调用方没接上。所以"本地化=写新代码"这个默认预期在这一项上是错的，答案是改一处调用。
  3. 新契约 `addProjectScene`/`removeProjectScene`。删舞台的语义必须显式兑现：PG 侧靠 `stage_id ON DELETE SET NULL`（`narrative/models.py:154`），而本地 `project_nodes.stage_id` **没有 FK 约束**，所以要在删行之前自己 UPDATE——契约套件里那条"删的是舞台不是戏"的断言就是钉这一点的，且已见过它红（把 UPDATE 改成恒等自赋值，SQLite 支立刻红）。
  4. 浏览器支的一次**有意松动**：改走 provider 后 `addScene` 不再显式送 `source:"inline"`、`addRole` 不再送 `importance:0`，两者都等于 Pydantic 默认值（`schemas.py:98`、`schemas.py:188`）。语义等价，但请求体不再逐字相同——这是 web 冻结线的一处例外，记在此处而不是留给下一个人猜。
- [x] S13-2b 编排台「从舞台库导入」本地化（含舞台库检索分派）
  —— 已交付 2026-09-26。顺序是**补列 → 通读路径 → 改写入 → 最后才换 fetcher**，反过来就得到"搜得到、点下去必败"：
  1. `project_scenes` 经 `COLUMN_PATCHES` 补 `description/location/atmosphere/scene_ref_id/source` 五列（该机制本来就是给已发布过的老库补列用的，`pragma_table_info` 判存再 ALTER）；
  2. `StoredScene` 随之扩字段（搬进 `records.ts`，与 v0.8 那批记录形态同处），`loadProject` 与 `HttpStorageProvider.toBundle` **两条读路径同时接通**——只补写不补读就是静默降级；
  3. `apps/web/src/shared/storage/index.ts` 那个把本地行适配成 `ProjectSceneResponse` 的映射，原先 `source/scene_ref_id/description/location/atmosphere` 全是硬编码，现改为如实取字段。`OutlinerPanel.tsx:158` 的舞台副标题与 `exportProjectMarkdown.ts:14-15` 的「地点/氛围」因此才有数据可读；
  4. 契约 `addProjectScene` 入参升为 `ProjectSceneInput`，浏览器支的请求体口径收在 `httpProjectScenes.ts` 里（`description ?? ""`、`source ?? "inline"` 与后端 Pydantic 默认值一致），导入通路回到与改造前逐字相同的字段集合；
  5. 契约用例「导入带来的地点/氛围/引用 id 读得回来」见过它红：把 SQLite 写入的 `location` 改成恒 null，用例立刻失败。
  顺带一次 G1 清偿：`contract.ts` 加用例后冲到 408 行，按 `contractPools.ts` 的既有形状拆出 `contractAuthoring.ts`（一份测试源、多实现验收），并把 `OutlinerPanel` 的棘轮从 623 收到 620 锁住。
  **补记（同日）——那处「仍欠」查出来不是一个遗漏，而是一条真实的两端分叉**：`packages/core/src/compiler.ts` 的场景解析把 `sceneRef` 的兜底整段丢了（写成 `s.location ?? null`），而后端 `narrative/compiler.py:333-345` 是 `location = location or asset.location`。后果：**从舞台库导入的舞台在网页试玩有背景、在桌面试玩是空白**——同一份数据、两个编译器、两种结果。金样本抓不到它，因为三个样本工程的场景都不带 `scene_ref_id`，那条分支从未被任何 fixture 走过。
  已改：TS 侧按 Python 的 `or` 语义用 `||`（空串也算没值，本地库里"没填"恰恰常是空串），`bundleToCompilerInput` 补上 `location/atmosphere/sceneRef` 投影并由 `loadStoryOffline` 预取资产池（复刻后端的一次查表，不是新抽象）；新增三条专项单测覆盖此前无覆盖的优先级，见过它红（把 `||` 换回 `??`，「空串算没值」立刻报 `expected '' to be '方舟·地下'`）。
  教训写在这里而不只写在测试注释里：**金样本证明"当前两边一致"，证明不了"每条分支两边都走"**；分支要有专门用例，否则 fixture 没覆盖 = 行为没实现。
- [x] S13-2c 编排台道具引用本地化 —— 已交付 2026-09-29，建表 / 读路径 / 写入改线 / 检索四件同批（立项理由成立：本地没有 `project_asset_refs` 表，bundle 投影把 `asset_refs` 恒写成 `[]`，"加入道具"在桌面上写进去、下次刷新凭空消失）。落地顺序照 2a/2b 的形状走：
  1. `StoredAssetRef` + `AssetRefInput` + `ProjectBundle.assetRefs` 进 L4 契约，`addAssetRef`/`removeAssetRef` 两个方法三实现齐（Memory / SQLite / HTTP）；
  2. SQLite schema v5 建表（带索引与孤儿行清理，与 `backend.ts:80-85` 的既有形状一致）。**没有加 `UNIQUE(project_id, asset_type, asset_id)`**：后端 `add_asset_ref` 是一次裸 INSERT，同一件道具加两次真的留两条，本地不替它做"更聪明"的去重；
  3. 读路径 `loadProject` 与写入 `addAssetRef/removeAssetRef` 同批接通，`useProjectOutliner` 的 `addItemRef/removeItemRef` 从 `projectApi` 改到 provider——和 2a 的第 2 条同一个教训：**契约早就有两端实现，缺的常常只是一处调用方没接上**；
  4. 道具检索 `searchImportItems`（`assetPoolSaves.ts`）与 `searchImportScenes` 同形：空白查询返回空、上限 8 条逐字保留后端口径（`platform/search_router.py:157`），桌面候选集换成本地池里"我的 ∪ 已公开"那一份；`OutlinerPanel` 的 `fetcher` 因此不再打 `/search/items`；
  5. 契约用例三条见过它们红，各对应一个真实缺陷形状：删掉 SQLite 的 `assetRefs` 读取 → 3 条同时红（就是立项写的那条静默降级）；`removeAssetRef` 改成恒成功 → 2 条红（重复删与跨工程删）；`saveNarrative` 里顺手清引用 → 红（叙事图覆写与引用是两个域）。检索侧另有 4 次变异：漏掉平台分派、去掉 8 条截断、`toBundle` 不回读 `asset_refs`、404 演成删除成功，各自只让对应用例失败；
  6. 旧库升级：`sqlite.test.ts` 那条 v0.7 形状库的用例扩到 `project_asset_refs`——两次 `init()` 后表存在、且旧工程上能写能读回引用。
  **顺带把两端真正对齐（改的是后端，行为收紧、不会更松）**：`remove_asset_ref` 此前只按 `ref_id` 删、把路径里的 `project_id` 整个丢掉，`add_asset_ref` 不校验工程是否存在。实测（把两处改回旧形状）前者让跨工程删除返回 204、后者顶出 `project_asset_refs_project_id_fkey` 的 FK 500。现按 `(project_id, id)` 删、工程不存在 404，与本地契约逐字一致；`backend/tests/test_project_api.py` 新增一条端点级用例把五点口径钉住（不去重 / 跨工程删不动 / 重复删 404 / 无主工程 404）。
  **一处已知边界（不在这一刀里扩张）**：`.axsp` 容器不装道具本体，导入时把引用原样带过去——同机导入即刻解析，跨机导入留成悬空引用，编排台按 `道具 <id前缀>` 显示、可手动移除。静默丢掉才是问题（导出者明明挂了三件道具），故选择"带着悬空"并由 `unpackAxsp` 的 `normalizeBundle` 在唯一一处补 `assetRefs: []`（早于本批的容器根本没有这个键）。详见 ADR-026。
  **G1 清偿（这一批自己越的线，按门禁处方拆）**：四个文件被新增的契约方法推过 400（`types.ts` 435 / `sqliteProject.ts` 440 / `memory.ts` 415 / `httpStorageProvider.ts` 422）。分轴沿用仓库既有形状、不改行为：契约的记录形态回到 `records.ts`（它本来就是「查表型」字段表的家，`types.ts` 仍 `export *` 再导出，消费方 import 路径不变）；SQLite 与 Memory 各出 `sqliteProjectLinks.ts` / `memoryLinks.ts`，HTTP 侧出 `httpAssetRefs.ts` / `httpCharacters.ts`（与 `httpProjectScenes` / `httpStories` 同一先例）。结果八道门禁全绿。
  **拆出来的一个真实缺口**：外提 `listCharacters` 之后做一次变异——整段删掉「公开」分支，web 的 118 条测试全绿。角色的「我的 ∪ 公开」合并在 HTTP 支从来没有用例盯着（契约套件只跑 Memory / SQLite 两支）。已补 `storage.test.ts` 角色域两条（合并去重、只取公开时不打 `/characters/user`），见过它们红：删公开分支红 2 条，去掉 `merged.has` 去重护栏红 1 条。**教训：一次纯搬运的重构也能暴露覆盖空洞——搬的时候给被搬的那段补腿，比事后追问「这块为什么没测」便宜得多。**
- [~] S13-2d 清掉 `nexus`/`ai`/`PromptExport`/`SaveSlotPanel`/`usePlayer` 五处「有数据才挂载、E14/E15 结构上测不到」的待核项
  > 2026-09-30 逐项对账：`usePlayer` ✓ E28（自动存档换页回读）、`SaveSlotPanel` ✓ E33（槽位写-读-删）、
  > 建档建议 ✓ E19、`nexus` 工具条 ✓ E18/E20 的桌面侧，**但浏览器那一半「按钮应该在」一直没人断**——
  > 本轮补上 **E40**（两半各一条，按 E35/E36/E37 的写法）。牙验过：把 `NexusSendAction` 改成浏览器态也返回 null，
  > 红在 E40 的 `toBeVisible()`，而**旧覆盖的 47 条全绿**——这正是缺口本身。`PromptExport` 仍未接线（＝#60，等定档），
  > 所以这一条保持 `[~]` 而不是勾掉。
  —— 2026-09-29 逐条取证后的**实测结论**（有一条的前提本身是错的，另有一处藏在假绿后面的真缺陷）：
  1. **`PlayerPage` 的跨作品 Codex 读侧**：`fetchCodex` 一直直接 `playerApi.getCodex`，没走分派口
     （同文件的 `recordView`/`getStory`/写侧 `syncCodex` 都走）。桌面每次开播发一条打不到的请求，
     `catch` 成空账本——**跨作品记忆在桌面上永远为空且无人知晓**。E15 之所以绿，只是因为
     `loadStoryOffline` 先抛了、根本没走到这一行。已补 `readCodex` 进 `playerSaves`（与 `syncCodex` 同一裁决：
     本地如实 `skipped-offline`、远端失败给 `via: "failed"` 带原因），并在记忆面板把这条降级**说出来**。
     3 条新用例 + 2 次变异见过红（桌面支不再短路、读失败伪装成读成功）。
  2. **`ai` 的立项前提是错的**：`CreateCharacterPage` 不在「有数据才挂载」那一类——`/studio/characters/new`
     裸访问就挂载（页内 `draft`/`ready` 由挂载副作用置真）。所以它**可以**进 E14  CLEAN_ROUTES，
     已加进去并实测通过（装载路径零 `/api/v1`）。仍然没测的是点击之后的 `aiApi.suggestCharacter`
     （`CreateCharacterPage.tsx:83`，直连 `aiApi` 无守卫）——这条属 S13-4b「AI 建档建议本地化」，
     边界写进 `desktop-http.spec.ts` 的注释里，不留成隐含预期。
  3. **`PromptExport` 与 `usePlayer` 是零消费者的孤儿**：全仓 grep 只有各自的定义与 barrel 再导出
     （`features/character/components/index.tsx:5`、`shared/hooks/index.ts:4`），
     `playerApi.startSession/draw/complete/getMemories/getFlags/getCharacterStates` 除 `usePlayer.ts` 内
     没有任何调用点。它们不是「待本地化」，是「该摘除」——已挪进 S13-3 的清单（摘除=组件 + api 段 + 后端路由一起走）。
  4. **`nexus`**（`OutlinerPanel.tsx:99` 的 `sendToNexus` → `POST /api/v1/nexus/notes`）桌面可达但**双重数据门**
     （要真工程 + 「项目」手风琴默认收起），路由级判据结构上碰不到它；`SaveSlotPanel` 本身零网络（纯展示，
     存档读写早已走 `playerSaves` 分派口）。两者的共同前提是「浏览器里得有一个能成功读取的本地库」——
     这正是 S13-5「注入内存本地库」还没做的部分：那个 host 建起来之后，这两处才谈得上被 e2e 断言。
  剩下的未完成项：`nexus` 与 `aiApi.suggestCharacter` 两条真实云调用需要处置（判死或本地化），
  孤儿模块两件待随 S13-3 摘除，E14/E15 的可测面需要 S13-5 的本地库 host 才能扩到点击路径。
  **G1 清偿（本批第 1 条自己越的线）**：`readCodex` + 降级提示把 `PlayerPage` 顶到 1406 行 > 棘轮 1393。
  按门禁处方把「会话状态」面板整块外提成 `components/PlayerStatePanel.tsx`（纯展示，只吃已算好的三张表），
  1393 → **1331** 并锁进基线。**两处刻意的不统一**：角色状态那一栏的 DOM 形状与记忆/标志不同构
  （名是 `p text-sm/70`、值是 `p text-xs/35`），逐类原样保留而不是抽一个共用行组件——外提的验收是零行为漂移，
  顺手"规整"样式就等于把重构变成改视觉。
  同一次搬运让 `lint:colors` 的低透明度文字棘轮从 47 降到 **45**（三段重复的 `text-white/30` 表头合成一处），
  新文件按仓库既有口径在 `ui-dim-text-baseline.json` 登记 3 处（`BacklogPanel` 2、`TimelinePanel` 2 同一先例）；
  **没有**为了让新文件从 0 开始而把 HUD 的 `text-white/20` 关闭键改亮——那是替用户改视觉，不是清偿债。

- [x] S13-2e 工程域**写侧**本地化（桌面首屏的主流程）—— 已交付 2026-09-29。
  起因是一次「同族缺陷普查」：本项目已经第三次撞上同一形状（读路径本地化、写路径忘了），
  所以扫了全部 `@/shared/api` 直连点里桌面可达的那些。**结果是产品最上面那一环是断的**：
  `App.tsx:26` 把桌面首屏定成 `/studio/projects`，而 `useProjects.ts` 当年只把 `list` 一支接到了
  本地 Provider，`createProject`/`deleteProject` 仍直连 `projectApi`——桌面上点「新建剧本」
  是发给一个不存在的服务端，且 `ProjectListPage` 用 `catch {}` 把失败演成「弹窗自己关了」，
  连用户输入的标题一起清掉。四个入口全部命中：列表页快速建卡、`/studio/projects/new` 表单、
  列表卡片删除、剪辑台删除。
  落地形状沿用 `playerSaves.ts`：新增分派口 `shared/storage/projectSaves.ts`（`projectSavesDeps`
  注入点 + `StorageResult.err` 一律升成可读 Error，不许塌成 undefined）。三个判断写在这里：
  1. **元信息不许丢**：创建页发 description/mechanism/genre/theme_tags/world_setting，
     而契约的 `CreateProjectInput` 只有 `title`。不动契约（三实现齐改是更大的一刀），
     改成分派口内两步：`createProject` → `updateProjectMeta`，字段逐个透传（`undefined`=没填，不参与覆写）。
  2. **补写失败就删掉刚建的工程**：留一个「只有标题」的工程比整体失败更难被发现，
     与 `importBundle` 对 saveNarrative/addRole 失败的补偿同一形状；补偿自己再失败时把残留 id 写进错误文案。
  3. **只填标题时不发第二次写入**（列表页快速建卡没有元信息，不该空转一趟）。
  界面侧把失败显示出来：列表页建卡失败保持弹窗打开并写明原因（不再关窗清输入），
  创建页改用 `mutate + onSuccess` 并直接显示 mutation 自己的 `error`（同一语义一处权威，
  不另存本地 state），剪辑台删除的 toast 从「删除失败」改成带原因。
  **`useProject`/`useUpdateProject` 零消费者**（全仓 grep 只有定义），因此没有给它们加分派腿——
  不为不存在的调用方造第二处真相源。
  **2026-09-29 收口**：这两个 hook 后来直接删掉了（实测全仓 `useProject` / `useUpdateProject` 消费者均为 0，
  `shared/hooks/index.ts` 是 `export *` 所以没有具名再导出要跟着改）。留着的代价不是「多两行」而是**埋雷**：
  两支的 `queryFn`/`mutationFn` 都是无条件 `projectApi.*`，谁哪天接上去就是一个桌面上必败的调用，
  而且它长得像已有能力——正是 S13-7「一个功能只剩一条数据通路」要消掉的那类 HTTP 挂点。
  顺手记一条查法：路由级棘轮（E14）只覆盖「进入路由时的装载路径」，`/studio/projects/new` 与
  `/studio/characters/:id/edit` 两支页面都不在那份清单里，所以要靠静态数消费者来判，别把棘轮当成全覆盖。
  验收：`projectSaves.test.ts` 10 条（用真 `MemoryStorageProvider` 建完再 `listProjects` 读回，
  证元信息真落库），4 次变异各自见过红——分派短路反过来（红 6 条）、`metaPatch` 返回空（红 3 条）、
  `unwrap` 吞错（红 2 条）、不做补偿回滚（红 2 条）；还原后 10 passed。
  **一次教训**：新文件先跑 vitest 全绿、`pnpm gates` 的 `tsc` 才报 8 处 TS2540
  （`ProjectMetaPatch` 字段是 readonly）——vitest 走 esbuild 只剥类型不做类型检查，
  新增 TS 文件的顺序应是先 typecheck 再跑测试。
- [x] S13-2f 角色设定的导出/复制本地化 —— 已交付 2026-09-29。同一普查里的第二处：
  `CharacterDetailPage` 的两个按钮都以 `characterApi.export` 开头，而**正文本来就在本地渲染**
  （`renderCharacterPrompt(character.character_data)`），只有传记与关系取自服务端那一次 POST。
  桌面上这一句 await 抛错 → 一个 `catch { console.error }`、一个 `catch {}` → 连本地已有的正文也导不出去，
  表现为「点了没反应」。
  新增 `shared/storage/characterExport.ts`：`composeCharacterMarkdown`（纯函数）+ `buildCharacterExport`（分派）。
  三个判断：
  1. **本地支复用已经分派好的 `storySaves.readStories/readStory`**，不在这里再造一条本地读法；
  2. **远端支保持原来那一次 POST**——如果无差别走 `storySaves`，web 会从 1 次请求变成 N+1 次，
     这是"顺手统一"最容易踩的隐性退化，专门写了一条用例盯住（`readStories` 在远端支必须零调用）；
  3. **桌面不含「## 关系」段**：关系域在桌面上本就不存在（S13-3 判死清单），
     一台机器上没有的功能不该在导出产物里留一个空标题；`compose` 同时滤掉畸形关系条目，
     不再写出 `undefined: undefined`（旧代码把服务端结果当 `any` 直拼，这是既有缺陷）。
  落盘改走既有的 `saveBinaryFile`（桌面 dialog+fs / 浏览器 blob），不再手写 `<a download>`——
  原实现在壳里能不能下载**从未验证过**，换用与 `.axsp` 导出同一个助手可以把这层不确定性交掉。
  该助手多了一个 `mime` 形参（原先浏览器分支写死 `application/zip`，导 .md 时 MIME 是错的）。
  失败不再静默：两个动作共用一条 `exportError` 线，渲染在按钮行下方（用既有语义令牌 `text-danger`，
  不是新增色值）。
  验收：`characterExport.test.ts` 7 条；3 次变异见过红（分派反过来红 4 条、畸形条目不再过滤红 1 条、
  空段落也写标题红 3 条）。**一次流程错误**：第一次变异脚本把 vitest 的目标写成了源文件而不是测试文件，
  三次"没有输出"被我自己当成"没红"——重做之后才有结论；另外那次 M2 的改写只是加了个类型断言，
  过滤器还在，属于无效变异（判据：改完之后坏行为真的会发生吗）。
  顺带 `-41` 行：`CharacterDetailPage` 里两处逐字重复的段落拼装被收成一处。

- [ ] S13-3 云本质功能判死并摘除：`comments`、`report`、`identity`、`user` 档案与多用户鉴权、`tags`、`discover` 发布与发现、`relations` 关系图、`versions` 角色版本历史、跨设备同步。摘除 = UI 入口 + api 模块 + 后端路由三段一起走，不留"点进去报网络错误"的残口

> S13-3 预备（2026-09-29 量好的可执行清单，只等你一句放行；数字由命令产生）：
> - **云端专属页面共 955 行 / 8 个文件**：`DiscoverPage` 96、`AuthorPage` 236、
>   `DiscoverProjectDetailPage` 136、`DiscoverCharacterDetailPage` 116、`DiscoverItemDetailPage` 101、
>   `DiscoverSceneDetailPage` 104、`DiscoverTopicPage` 101、`DiscoverCommentSection` 65。
>   每个页面的"其他引用者"都是 1（只有 `App.tsx` 的路由表），评论区是 5（挂在五个详情页上）——
>   也就是说摘除顺序是"评论区 → 五个详情页 → AuthorPage → DiscoverPage → 路由表"，一步一提交。
> - **账户与创作者面板**：`ProfilePage` 211 行（桌面态已在 E36 换成 `CloudFeatureNotice`，
>   剩下的云端分支可以整段搬走）、`CreatorDashboardPage` 188 行（自带闸门，入口已不可达）。
> - **云端实现侧（S13-7）**：`httpDomains` 394 + `httpStorageProvider` 356 + `httpStories` 99 +
>   `httpCharacters` 77 + `httpProjectScenes` 62 + `httpAssetRefs` 42 ＝ **1030 行**，
>   引用者只有 `storage/index.ts` 与两个测试（本轮 `check:dispatch` 已把它们排除在"必须有本地分支"之外）。
> - **摘每块时要一起走的判据**（避免留残口）：路由表项 + `AppHeader`/导航里的入口 +
>   对应的 `use*` hook + 该页在 E14/E15 路由清单里的条目 + `KNOWN_DEBT_ROUTES` 反向棘轮；
>   评论区与详情页只能 URL 直达（E35 之后桌面已无指向 `/discover` 的链接）。
> - **hooks 侧的交叉核对（2026-09-29 复扫，数字由命令产生）**：`apps/web/src` 里 18 个 `.ts` 消费者碰到云端 api，
>   未闸门的 5 个经逐一追消费者后定性为——2 个是误报（`useProjectEditor.ts:5`、`writer/lib/projection.ts:18`
>   都只 `import type { NarrativeSyncRequest }`，不发请求）；3 个真实但**桌面已无路可达**：
>   `useCommentThread` 只被 `DiscoverCommentSection` 用、`useTags` 只被 `DiscoverCharactersTab` 用、
>   `identityLink` 只被 `DiscoverProjectsTab` 用，而这三块都挂在 `/discover` 系页面上，
>   E35 之后桌面没有任何导航路径通向它们（只能 URL 直达）。
>   ⇒ 桌面态"点了只会失败"的云端入口到这里已经收干净：视图层 `.tsx` 未闸门数 0，hooks 层剩的都是 URL-only 页面，
>   归 S13-3 一起摘，不需要另开闸门。

- [ ] S13-4 AI 通路本地化：模型接入落到 TS provider 直连 Ollama / 兼容 API（即 v1.0「演绎内核」M3 的第三支），Python 的 provider 链与 `/editor/ai/*` 随之退场；桌面离线仍由 TS 规则引擎兜底
  - **S13-4a 已交付 2026-09-27**（提示词单一真相源 + 桌面本机模型通路 + 配置 UI）：
    1. 提示词从 `backend/llm/prompts.py` 迁到 `packages/axs/prompts/prose-to-axs.json`，两端读同一份。迁移是机械 dump 而非手抄——手抄会错在看不见的地方（末两句原本紧接、没有换行）。两端各锁一个 sha256 摘要，把"只输出"改成"请只输出"两侧同时红，见过它红。
    2. `shared/api/localLlm.ts`：webview 自己的 fetch 打 `/api/generate` 或 `/chat/completions`，不引 tauri-plugin-http（已锁定决策）。**只产文本**，回 IR 一律本端 `parseAxs`——不在这里再造第二个解析器。
    3. 分派口三段：配了端点→模型；没配→规则引擎；配了但调不通→退回规则**且把原因随结果交出去**（`degradedFrom`），徽标显示「AI · 规则引擎（模型不可用）」。静默降级会让人以为配置没生效，比报错更难查。
    4. 配置 UI 挂在 `LlmStatusBadge`（桌面态可点）→ `LlmEndpointDialog`。存 localStorage 而非 L4 契约：它是"这台机器的环境"，不属于任何作品，**绝不能被打进 `.axsp`**。
    5. E16 四条：徽标可点、填→存→**刷新→重读**、清除回到规则、全程零 `/api/v1`。「测试一次」故意做成真生成——轻量探活要么端点不统一、要么另开一条通路，都会造成"测试通过但草稿失败"的自相矛盾判据。
  - **真机验证（本机 Ollama 0.34.4 + batiai/gemma4-e4b:q4）**：通路是通的——浏览器 fetch → /api/generate → 多行 canonical AXS 回来 → 界面如实显示。这一跑还抓出一个显示缺陷：反馈区用 `<p>` 把模型的换行折叠成了一行流水账，已加 `whitespace-pre-wrap`（AXS 的行就是语义单位，折行等于把脚本显示成散文）。
  - **两条如实的未证 / 已知短板**：① 真壳里的来源是 `tauri://localhost`，浏览器测试测不到它，所以文档里那条 `OLLAMA_ORIGINS` 必设项**仍是纸面推断**，要在壳里跑一次才算证；② 4B 量化小模型会写出 `旁白: (微笑): 台词` 这类半合规行，也会偶发地把提示词里的 `标题：` 当格式抄过来。`applyDraft` 现在只拦"括号方言"和"解析不出任何指令"两种，这类**能解析但质量差**的输出会照样成草稿——那是模型能力问题，不是通路问题，但别把它说成"AI 辅助已达标"。
  - **仍欠**：`/editor/ai/suggest-character`（AI 建档建议）在桌面仍是 HTTP；Python provider 链要等 S13-6 一起退场。
    → **2026-09-29 更新（S13-4b 的一部分）**：桌面上这一支已不再发那条必然失败的请求，
    而是**显式缺席**——`handleAiSuggest` 在 `isLocalOnlyDeployment()` 下先给一条可读原因
    （「桌面版还没有本地建档建议通路（缺一份建档提示词），此项仍依赖服务端模型」）。
    为什么不是"接一下线就行"：本地这条通路要新做一项能力——`packages/axs/prompts/` 目前只有一份
    `prose-to-axs.json`，建档需要自己的提示词 + 输出 schema + 规则引擎兜底，属 ADR-029 未决项，
    由产品判断要不要做（做就是 S13-4 的第三支，不做就随 Python provider 链一起在 S13-6 退场）。
    判据：**E19** 断言点该按钮后有那条提示语且零 `/api/v1`；把闸门改成 `false &&` 之后红在提示语的
    `toBeVisible` 上（实测两轮，还原后绿）。名称字段在模板选择那一步之后，所以用例不填名——
    能力检查因此被放在名称校验之前，这条判据才不靠流程顺序成立。
- [x] 附带修掉：道具/场景**资产详情页**绕过分派口（S13-2 期间漏的半条腿）
  —— 已交付 2026-09-27。`SceneAssetDetailPage` 的 get/update/delete 与 `ItemDetailPage` 的 update/delete 仍直连 `sceneAssetApi`/`itemApi`，而**清单页早已本地化**——于是桌面能看见、能点开、改完点保存却写进一个够不到的后端。两处顺带修掉同一个假「已保存」：`setItem({ ...item, ...form })` 是乐观合并，界面立刻显示新值而写入根本没成，现改为采用回读的那一份。判据补进 E15（`/studio/scenes/no-such-scene`）。
  教训：**本地化是按"读路径"完成的，不是按"页面"完成的**——一个页面里 get/list/create/update/delete 五支各自选路，只改读的那支就等于把半条腿焊进了主干。
- [x] S13-2g `.axsp` 往返补全（元信息 + 舞台）—— 已交付 2026-09-29。
  查的是分发链路本身：导出侧把整个 `ProjectBundle` 装进容器（含 `meta` 全字段与 `scenes`），
  导入侧却只做 `createProject({title})` + `saveNarrative` + `addRole` + `addAssetRef`。两句话的差别是：
  1. **工程元信息全丢**——描述/世界观/规则/机制/题材/标签导回来是空的。实测红样：
     `description ""`、`worldSetting null`、`themeTags []`。本地列在 #21 那批就补齐了，
     「能建能显示」因此把「导回来是空的」盖住了；世界观还直接进编译器，玩家页设定面板那一栏就空了。
  2. **自定义舞台全丢**——契约的 `saveNarrative` 只管 nodes/edges/axsSource，舞台得逐个 `addProjectScene`
     并回传新 id、再把节点 `stageId` 重映射。这一段整段没做。影响面比听起来大：**首启播种走的就是这个函数**，
     而三份随包示范作各有 2 个舞台（bootstrap 主场景 + 甲板/公寓/咖啡馆），**5/7 个节点归属那个真实舞台**（实测逐包数过）
     ——旧实现下桌面示范作的舞台整块消失、那 5 个节点失去归属、背景与地点一起没有。
  实现落在新模块 `shared/storage/axspImport.ts`（`index.ts` 不在行数基线里、379 行只剩 21 行余量，
  再往里塞就撞 G1；抽出去后 `index.ts` 379→305 行，并以再导出保持所有调用方的 import 路径不变）。
  两步都带回滚：元信息或舞台建失败即 `deleteProject`，与 `importBundle` 既有补偿同形；
  返回值也从「createProject 的半成品 meta」改成补写之后的那一份。
  **顺带改掉一条把 bug 写成期望的旧断言**：`storage.test.ts` 此前断言 `copy.data.nodes` 与 `orig.data.nodes` 全等——
  而旧实现的 `stageId` 照抄导出侧，指向一个**新工程里并不存在的舞台**，所以那条断言恰好把悬空引用锁成了正确行为。
  改成「忽略 stageId 比节点 + 每个节点的舞台归属必须能在导入结果里解析到」，并在往返用例里按舞台名核对归属。
  判据：`axspRoundTrip.test.ts` 2 条（元信息 / 舞台+道具引用+归属可解析）。
  两次变异各见过红：不补写元信息 → 红在第 1 条；不重建舞台 → 红在第 2 条。还原后连同组合往返 17 passed。
  实测（本批最后一次全链）：`pnpm gates` GATES_EXIT=0、单测 471 passed + 1 skipped（web 160→162）；`pnpm e2e` E2E_EXIT=0、37 passed (46.8s)；`index.ts` 379→305 行后 `check:size` 无需改基线。
- [x] 附带：随包示范作**首启可玩**判据（`seedPlayable.test.ts`，2026-09-29，S13-2g 的追溯判据）。
  桌面交付的产品面就是「双击就有能玩的内容」，而这条此前从没吃过**真实随包字节**：
  `offlineStory.test.ts` 用自建工程、`desktopSeed.test.ts` 用自建包（`exportProjectAsAxsp` 现造），
  两份都是当场造出来的形状——S13-2g 那个缺陷恰好只在真实包上坏（自建的包本来没有舞台），所以全绿。
  **实测三份包的内容**：各 7 节点 / 2 舞台 / `assetRefs` 0；`edges` 1/1/5、`roles` 0/1/1。
  导入后 IR：`beats` 7、**7/7 个 beat 的 `sceneId` 解析得到**（旧实现 0/7）、`scenes` 2 且标题与包内一致。
  判据一律**从包里反推**（包里有几个舞台/节点/边/角色，试玩就得有几个），不写死数量：
  示范作内容改了不该红，内容在导入链路上丢了才该红。另含两条通用可玩性下限——每个 beat 至少一条指令（空 beat=点不动的死页）、至少一个结局 beat。
  三次变异各见过红（改 `axspImport.ts`，不是改断言）：整段不导入舞台 → 红 6 条（2 支判据 × 3 包）；
  不删 `createProject` 自带的空舞台 → 红 3 条（只有标题多重集那条）；不导入角色 → 红 2 条（只有演员表那条，示范作① 本就 0 角色）。
  顺带记下两条**容易下次被误判成缺陷**的实测事实：
  ① 示范作① 的 `say` 说话人是「广播」与 `null`——IR 里 `characterId=null` + `speaker` 覆盖显示名就是旁白/报幕的合法表达，不是「私有角色没解析」那条；
  ② 上一条 S13-2g 记录里「2 个舞台 = bootstrap 主场景 + 甲板」这句不准——包内那两个舞台（主场景/甲板…）**都来自包**，
  bootstrap 是导入时另建再删的那一个，实测导入后舞台数恰等于包内数（这条本身也有判据：见上面那次变异红 3 条）。
  在册漂移（与 `seedShape.test.ts` 同口径、双向可红）：随包内容仍缺 7 项——工程描述、世界观、舞台地点、舞台背景、道具清单、术语表、角色立绘。
  缺的是**内容**不是投影（三份包是 2026-09-26 之前从「meta 只有 id/title/updatedAt」的旧库导出的）。
  S13-6 真重导一次后这一栏会红，那时按甲/乙定档把它改成相等断言，而不是留着当假漂移。
  **同一串写动作补了存储侧对手**（`contractAuthoring.ts` 新增「导入器写序列」，1 条判据 × 两支实现 = 实测 editor-core 151→153 passed）：
  随包播种真正落在桌面是 **SQLite**，而上面那份可玩判据跑的是 Memory。契约套件同跑两支，于是这三件事在 SQLite 上也被钉住了：
  ① 全 `undefined` 的 `updateProjectMeta` 补丁**不许**把已有描述/世界观写成 NULL（两支实现都以 `!== undefined` 为「不动这栏」）；
  ② `createProject` 自带的 bootstrap 是**最后一个**舞台时也得删得掉——中间态「零舞台工程」若被实现方拦下，播种就直接失败；
  ③ 节点挂的是重建后的**新舞台 id**，`saveNarrative` 不许把 `stage_id` 写成 NULL。
  两次变异各见过红，且都只红在 SQLite 那一支（Memory 同批仍绿）：把 `description` 改成盲写 NULL → 红在第①条；
  把 `saveNarrative` 的 `stage_id` 参数写死 `null` → 红在第③条（报错里给出的是 SQLite 的真 UUID，证明那一支确实跑的是 SQLite）。
- [x] 附带：传记在桌面**没有入口**——已修 2026-09-29（静态普查查出来的第 6 个同类缺口）。
  查法不是跑棘轮而是**静态数消费者**：把去留清单里标红的 5 个文件逐个看挂载点与闸门。结果——
  `GlobalSearch` 有 `!isLocalOnlyDeployment()` 闸门（`AppHeader.tsx:84`，不是缺口）；`useTags` 只挂在 `discover/**`（云端页）；
  `PromptExport`（192 行）**零挂载**，唯一数据通路是 `characterApi.export`——留成在册，没顺手删（删它等于删一个未接线的功能面，等定档）；
  而 `CharacterDetailPage.tsx:552` 那条 `!localOnly || key === "info" || key === "sprites"` 里，**传记被当成云端功能滤掉了**，
  可 S13-1 早就把传记落进本地契约（`StoredStory` + SQLite v4 + `storySaves` 分派口）。
  也就是说：**本地化做完了，入口没跟上，界面上等于没有这个功能**——比「点进去报网络错误」更难发现，因为连失败都不发生。
  第 142 行那句注释「关系/传记/版本/Fork/删除依赖协作服务」就是它自己的化石证据：写的时候传记确实只有云端通路。
  修法不是往白名单里补一个字符串，而是把「这一栏凭什么算云端」搬到定义点上：新 `features/character/lib/characterTabs.ts`
  给每个 tab 带 `cloudOnly`，`visibleCharacterTabs(localOnly)` 按它过滤（页面 701→691 行）。手抄白名单的问题不是长，是**离写侧太远**，写侧变了它不会响。
  判据：`characterTabs.test.ts` 3 条（桌面态可见集 / 浏览器态全集 / 云端专属那一栏是**在册清单**不是派生布尔）。
  两次变异各见过红：把 `stories.cloudOnly` 改成 `true` → 红 2 条；把过滤改回那条旧白名单（复刻刚修的 bug）→ 红在入口那条。
  **没被门禁覆盖的部分写清楚**：这三条量的是纯函数层，桌面**壳内点击**那一层仍没判据——要装就得把「建角色 → 开详情」整条流程搬进 `?storage=memory` 宿主
  （E19 已经证明锚点在模板步之后，取它要把建角流程搬进用例，成本不抵本轮收益，记在这里不当已完成）。
  实测：`pnpm gates` GATES_EXIT=0（web 178→181 passed）、`pnpm e2e` E2E_EXIT=0（37 passed，浏览器态渲染无变化）、`tsc -b` 先于 vitest 跑且零报错。
  **顺带一条判据陷阱**：`scripts/desktop-http-inventory.mjs` 需要 5174 上活着的服务；没有服务时它对每条路由都返回 `httpCalls: []` + 一条 `ERR_CONNECTION_REFUSED`，
  看着像「全部干净」其实是「一条都没加载」。空结果不等于不存在——读它的输出前先看 `pageErrors`。
  **（2026-09-30 第十四次续做：这句"读之前自己看一眼"已经升级成脚本自己的判据——没挂载出界面的路由会让脚本退出码 1 并点名，见本节末的补记。）**
- [x] 附带：桌面**点击层判据此前结构上写不出来**的根因——已修 2026-09-29（全量普查的第 7 条，也是这轮最值钱的一条）。
  这轮把抽样普查换成**全量**：`grep -rlE "\b[A-Za-z]+Api\." apps/web/src` 得到 44 个文件，再用一张自建 import 图（`@/` 解析到 src）
  把每个文件反推到路由页面，逐个读外层闸门。结论分四类：已分派（`CharacterSearchSelect`、`useProjectDirectory` 都有 `isTauriEnvironment()` 腿，
  `PlayerPage` 的 `recordView` 也在闸门后面）、浏览器/测试宿主本身（`shared/storage/http*`）、零挂载（`PromptExport` 192 行，见 #60），
  以及**一条真缺口**：编排台「项目」栏里的「发送到 Nexus」`nexusApi.sendToInbox` 在桌面**必败**，而失败文案是「发送失败，请确认后端已启动」——
  产品已经不发后端了，那是把人往不存在的修复方向上指。处置与 E18 同口径：桌面不给入口（组件去留等 S13-7 判，本轮不删）。
  实现按 `check:size` 自己的提示外提成 `outliner/NexusSendAction.tsx`（面板 619→584 行，棘轮同时收紧；`CharacterDetailPage` 702→692 一并锁定）。

  **顺着这条缺口挖到更大的两条**（它们解释了「桌面点击路径为什么一直没法测」）：
  1. `useProjectEditor.ts:335` 与 `ProjectListPage.tsx:163` 调的是 **`createStorageProvider()` 而不是 memo 住的 `getStorageProvider()`**。
     后果一：`?storage=memory` 只在 URL 上带着，客户端一导航就掉，于是后续重建 Provider 会落进 Tauri 支——
     `TauriAssetStore.create()` 里的 `documentDir()` 抛 **未捕获** `TypeError: __TAURI_INTERNALS__.invoke is not a function`，剪辑台永远停在「加载中...」。
     **E17 此前只敢断 URL、不敢断页面，根因就是这个。** 后果二（真壳里）：每次重建都重开一条 SQLite 连接与资产根，与同一文件自己那句
     「重建 SQLite 连接没有意义」相反。改法就是两处换成 `getStorageProvider()`。
  2. `main.tsx` 的壳内冒烟用的判据是 `"__TAURI_INTERNALS__" in window`——**那恰好是 e2e 注入的标记**（`DESKTOP_MARKER_INIT` 塞的是空对象）。**2026-10-01 第三十批追注**：这句判据后来抽成 `shared/storage/shellSmokeGate.ts` 的 `shouldRunDesktopSmoke()`，入口仍引它，并由 6 条单测钉住它与 `isTauriEnvironment()` 的语义差。
     于是测试宿主里会去跑壳内冒烟，实测两条 console error + 未捕获异常。改成要求 `invoke` 真是函数：冒烟是壳内诊断，不该在测试宿主里跑。

  判据 **E20**（挂在 E17 那条流程里，因为内存库随重载归零、建好的工程只在同一文档内活着）：先展开「项目」栏，
  **再断言同栏留下的「导出 Markdown」在场**——这是可达性证明：不先证这一栏真渲染，「发送到 Nexus 数量为 0」会空载成立。
  两次变异各见过红：闸门写成 `{true && (` → 红在 `toHaveCount(0)`；把 `getStorageProvider()` 换回 `createStorageProvider()` → 红在等不到「项目」按钮
  （也就是说这条判据的可写性本身依赖上面那个修复，两件事是同一根链条）。
  **没被判据覆盖的一半**：浏览器态「这个按钮应该在」没有断言（编排台在 e2e 里需要一个有数据的工程，成本高）。记在这里不当已完成。
  实测：gates GATES_EXIT=0、`pnpm e2e` E2E_EXIT=0（37 passed）、`tsc -b` 零报错。
- [x] E21 桌面态「建角色 → 传记 → 新建篇章」上线——**当场抓出两条云端泄漏**（2026-09-29，#59 由此起）。
  为什么这条值得整条搬进 e2e：`characterTabs.test.ts` 那三条量的是纯函数层（该不该给入口），E14/E15/E20 量的是**进入路由时的装载**；
  而「本地化做完的能力，用户到底点得到、写得进、读得回」此前从没被点过一次。流程本身也顺便测到了建角主路径：
  `handleSave` 要求锚点层的「概括」(`anchor.essence`) 非空，而那一栏在**默认不渲染**的折叠层里（实测只填姓名+描述会停在原页并弹「请至少填写锚点中的『概括』」），
  所以用例点一个模板把六层一次填满——这也把「模板能建角」这条桌面路径纳入了验收。
  **它跑通的第一遍就红了**，红在最后那条零云端请求的断言上：`/api/v1/relations/presets` 与 `/api/v1/characters/<id>/versions`。
  根因不是漏了分派口，而是**入口隐藏 ≠ 数据通路停住**：`AddRelationDialog` 与版本历史 `Modal` 在详情页是常驻挂载的，
  按钮上的 `!localOnly` 只挡住了入口，挡住不了里面的 `useQuery`。三处补上查询级闸门（同一口径）：
  `useRelationPresets` 的 `enabled`、`VersionPanel` 的 `enabled`、详情页那条 versions 计数查询的 `enabled: !!character && !localOnly`。
  两次变异各见过红：去掉详情页的 `&& !localOnly` → 红在 `/characters/<id>/versions`；把 `stories.cloudOnly` 改成 `true` → 红在「传记标签不在=本地通路齐了却没入口」那句自带文案的断言上。
  实测：`pnpm gates` GATES_EXIT=0、`pnpm e2e` **37 → 38 passed** (48.0s)、详情页 691 行（在 692 的棘轮内，`enabled` 折进已有表达式没有新增行）。
- [x] **桌面态点「试玩」进不去戏**——刚建好的工程在 `/play/<id>` 显示「加载失败」。2026-09-29 实测到并当日归因修好（过程与教训见下）。
  证据：在 E17 的桌面流程里加一跳 试玩 时测到 `/play/proj-0001` 的正文是「加载失败 / 重试 / 去发现更多作品」，
  而**全程零 `/api/v1`**（所以不是网络回落），console 里也没有任何错误（catch 只 `setStatus`+`setLoadError`，不记日志）。
  同一个工程在编排台里显示 2 拍（`01 开始` / `02 结束`，`createProject` 自带的 bootstrap）。
  三条现在就能定的结论：
  ① 失败发生在本地路径内部，不是缺后端；
  ② 界面把「这个工程还没有可播放的演出」与「编译/开播抛了」压成同一句话，还给了一条**桌面根本不存在的**「去发现更多作品」出口
     （`PlayerPage.tsx:864` 那段可读空态本来就在，说明走的是 error 分支而不是 empty 分支）；
  ③ `load()` 的一个 try 同时包住 `loadStoryOffline` / `fetchCodex` / `beginStory`，归因时要先把这三段拆开门——错误口径天然合并就是它难查的原因。
  本轮为什么没顺手修：想在 catch 里加一行 `console.error` 先让它可归因，被 G1 棘轮挡住（`PlayerPage.tsx` 1332 > 棘轮 1331，只准变短）。
  **这个文件已经大到「加一行诊断要先减一行」**，这句话本身就是 finding。用例里那一跳也一起退回去了——不留一条还没归因的断言在基线里当噪声。
  同批给 E21 追加了**编辑页往返**（保存更改 → 回到详情）：桌面零云端、实测绿；
  把 `useUpdateCharacter` 的本地腿短路成 `false &&` 之后红在「回到详情页」的 URL 断言上，也就是桌面上保存会直接失效——这条腿从此有点过的证据。
  实测：`pnpm e2e` E2E_EXIT=0（38 passed, 47.7s）。

  **已修（同日，登记后一小时）**：归因到**同一个根因的第三个调用点**——`loadStoryOffline` 里的 `provider ?? await createStorageProvider()`
  绕过 memo，播放时重建 Provider 落进 Tauri 支，`TauriAssetStore.create()` 的 `documentDir()` 抛 `invoke is not a function`，
  被 `load()` 那个宽 try 吞成一句「加载失败」。三条已定结论里 ①「失败在本地路径内部」成立、②③ 也对，
  但真正原因在**取 Provider 那一步**：离线编译与引擎 `start()` 在 node 探针里跑得好好的（bootstrap 工程编译出 `node-start` 一拍戏，文案「故事从这里开始...」）。
  修法与前两处同源同口径：`offlineStory.ts` 与 `assetUpload.ts` 剩下的 `createStorageProvider()` 调用点换成 `getStorageProvider()`。
  **纪律的完整版是「任何取本地 Provider 的调用点都走 memo」**——上一轮只修了两个点就以为收口了，这就是那轮的漏网。
  判据：E17 里那一跳 试玩 **重新加回来了且绿**，断言播出了 bootstrap 那一拍的文案（出现即证明离线编译真跑通），
  并且 console 里不许再出现 `AXIFORGE-PLAY-LOAD` / `__TAURI_INTERNALS__` 这一类数据通路错误（`errs` 只筛这一类，别的不吞进判据也不放过登记）。
  变异见过红：把 `offlineStory` 换回 `createStorageProvider()` → 红在「故事从这里开始」那条可见性断言上。
  诊断能力这次真的付了钱：catch 里加了 `console.error` 打 `AXIFORGE-PLAY-LOAD`，**用删掉一个空行来抵账**（1330 ≤ 棘轮 1331）——
  上一轮那句「加一行诊断要先减一行」按字面执行：没放宽棘轮，也没留下静默失败。
  **顺带测到一条与播放无关的**：播放器里有一条 React DOM 嵌套非法的 console 错误（`In HTML, %s cannot be a descendant of <%s>`），
  属于观感/健壮性而非桌面数据通路，没有折进判据，改成单独登记（task 清单里的「播放器 DOM 嵌套非法」一条）。
  **那条也已同日修掉（#62）**：归因是「锚里套锚」——`PlayerHudBrand` 用一个 `Link` 包住 `AppBrand`，而 `AppBrand` 自己就是一个指向发现页的 `Link`，
  于是渲染出嵌套的 `a`，React 打 `In HTML, a cannot be a descendant of <a>` 并留下 hydration 隐患。
  修法去掉外层 `Link`、把「点品牌不许顺带翻一拍」的 `stopPropagation` 移到 `span` 上（这个停止冒泡是真实需求：播放器整屏 `onClick` 推进剧情）。
  **判据顺手收紧**：E17 那条 console 断言从「只筛数据通路那一类」升级为**整条桌面链路零 console 错误**——
  修掉这条非法嵌套之后才敢这么收；变异见过红（把 `span` 换回带 href 的 `a`）→ 红在那条断言，报的就是 `In HTML, %s cannot be a descendant of <%s>`。
  写 JSX 注释时的一个坑记在这里：注释里不能出现 `<a>` 这种字面量，JSX 会当真去解析它（实测 `TS17008 JSX element 'a' has no corresponding closing tag`）。
  实测：gates GATES_EXIT=0、`pnpm e2e` E2E_EXIT=0（38 passed, 48.5s）。

- [x] 附带：**交付物层三条实测 + 导航出口普查**（2026-09-29，在 `e10cae2` 之后重跑，所以产物含本轮全部生产改动）。
- [x] E22：**工程元信息写入面在桌面被点了一次**（2026-09-29，挂在 E17 的编辑器停留期间）。
  编排台「项目」栏的世界观 textarea 是 `onBlur → onProjectPatch → patchProjectMeta → Provider`（S13-2d 那条腿），此前只有契约级证据、界面从没点过。
  用例按 `Tab` 触发失焦，**判据取真回读而不是 toast**：写完后走 列表 → 再进工程 → 断言这一栏还在（`toHaveValue`）。
  理由是 toast 会自己消失，也可能被本地 state 演成"看起来保存了"；只有换一次页面再读回来才证明字节进了本地库。
  **这里我第一次打了无效变异**：把 `const res = await p.updateProjectMeta(...)` 改成"照样调用、但去掉 `!res.ok` 的抛错"，用例照绿——那删的是错误处理不是能力。
  按「变异必须拿掉能力本身」重做（`void patch` + 伪造 ok）之后，红在 `Expected: 方舟是一座会移动的城 / Received: ""`，这才算证到。
  实测：gates GATES_EXIT=0、`pnpm e2e` E2E_EXIT=0（38 passed）。
- [x] E23：**编排台的舞台写侧在桌面被点了一次**（2026-09-29，S13-2a 那条本地腿 `addProjectScene` 终于有点击层证据）。
  走法是内联输入「新舞台…」按 Enter 提交——不点「+」，因为角色/道具段也有同名按钮，取加号会撞 Playwright 严格模式。
  回读沿用 E22 的口径：**写完离开再进来**（列表 → 工程页 → 断言那一台还在），不在当前页签存在感，
  因为同一页里乐观渲染或查询缓存都能把"看起来成功了"演出来。顺带确认 `useProjectOutliner.addScene` 用的是 memo 过的
  `getStorageProvider()`——上一轮那条 memo 纪律在这一支是干净的（实测过，不是推断）。
  变异按「拿掉能力本身」打：把 `await p.addProjectScene(...)` 换成伪造 `{ok:true}` 后 `refresh()` 照跑，
  红在 `getByText(离线路台)` 不可见——这条判据确实量的是字节有没有落库。
  实测：gates GATES_EXIT=0、`pnpm e2e` 38 passed、`pnpm e2e:desktop` 25 passed（无后端）。
- [x] E24：**剧本正文的写入回读**（2026-09-29，`saveNarrative` 那条腿）。桌面创作的主数据就是 Beat 里的台词与叙述，
  前面几条证的都还是"容器"（工程 / 舞台 / 元信息 / 角色 / 传记）。这一跳填「叙述性文字」→ 保存 → **换页再进**断言那句还在，
  再点试玩——**播出来的正是我刚写进去的那句**，于是「写入 → 本地编译 → 播出」在同一条判据里一次验完。
  变异：让 `dispatchSaveNarrative` 在有节点时直接 return（写入真的不发生）→ 红在 `toHaveValue`，`Received: "故事从这里开始..."`（未改写的原句）。
  **顺带修掉一条我自己引入的 flaky**（这点必须留在文档里）：E23 换页回读前只 `waitForTimeout(400)`，
  实测无后端基线下 3 次里红 1 次——写没写完就离开了页面。改成**先等写入完成的信号**（本页那一台出现 / 保存类 toast），再做换页回读。
  口径要分清：**toast 当"写入已完成"的屏障是合法的，当判据不合法**（本地乐观渲染也能把它演出来），所以判据仍然是跨页回读那一下。
  舞台段的计数抬头（舞台1 → 舞台2）作为回读的第二信号一并断言，两个信号任一缺失都红。
  同一批还把自己写的那两个 `waitForTimeout`（换页前 400ms、试玩前 1500ms）一并去掉，改成断言自己重试到位—— criticizing 完再留一个同类就不算修完。
  确定性证据：去掉计时猜测后 `pnpm e2e:desktop` 里该用例连跑 6 次全 1 passed、整套 2 次全 25 passed（修之前同一用例 3 次里红 1 次）。
- [x] E25：**角色挂进工程**（S13-2a 那条 `addRole` 腿）在桌面被点了一次（2026-09-29）。
  同一文档里现造角色（模板一次填满 → 存名 → 回列表）再进编排台「角色」段搜索添加，
  **完成屏障用段落计数抬头**（角色0 → 角色1），然后换页再进重读一次——两个信号任一缺失都红。
  变异：把 `useProjectOutliner.addRole` 里的 `await p.addRole(...)` 换成伪造 ok（refresh 照跑）→ 红在 `getByRole(button, /角色\s*1/)` 取不到。
  一条踩坑记着：**`getByText("创建角色")` 会命中空态标题「你还没有创建角色」**（点了不导航），要用 `getByRole("link", { name: "创建角色" })`；
  这也是"文本匹配比角色匹配更宽"的一个具体实例。
  实测：`pnpm e2e:desktop` 该用例连跑 3 次全绿、整套 25 passed，`pnpm e2e` 38 passed，gates 0。
- [x] E26 / E27：**删舞台**与**道具引用增删**（2026-09-29，`2f36162` 之后的同一批）。编排台四条腿到这儿点击层齐了。
  E26 用「含这一台标题的 `div.group`」把行上的 × 限定到那一行（行内按钮只在 hover 显形且全仓同名，用 nth 位置猜就是给未来留 flaky）；
  屏障是计数抬头回到 舞台1，判据仍是换页再进后 `toHaveCount(0)`。变异：`removeProjectScene` 换成伪造 ok → 红在等不到 舞台1。
  E27 先在道具页造一件（内存宿主池本来是空的，顺带验了「建道具」），再进编排台搜索挂上、移除，
  三段都以 道具0 → 道具1 → 道具0 为屏障，末尾换页再读一次。变异：`addAssetRef` 换成伪造 ok → 红在等不到 道具1。

- [x] 附带修掉一条 **表单可达性缺陷**（E27 写判据时撞出来的，2026-09-29）：`@axiforge/ui` 的
  `Input`/`Select`/`Textarea` 都渲染了 `<label>`，但**既没有 `htmlFor` 也没有包住房控件**——标签与字段没有编程关联，
  读屏念不出「这个输入框是什么」，而 `getByLabel("名称")` 直接取不到（我先当是自己定位器写错了）。
  修法：`useId()` 生成 id，label 上 `htmlFor`、控件上 `id`，都放在 `{...props}` 之前，调用方传了 `id` 就覆盖。
  **判据就是那条 `getByLabel`**：把 `htmlFor` 摘掉，用例红在等不到该标签（变异见过红），所以这条修复不靠注释自证。
  **同族未修**：`TagEditor` 与 `ToggleInput` 的 `<label>` 同样没关联，但它们下面挂的是复合控件（输入 + 按钮 + 标签列表），
  `htmlFor` 只能指向其中一个输入，正确做法是 `aria-labelledby` 绑到容器——留作后续，不当已修。
- [x] 自查抓到并修掉**我自己上一轮埋的界面缺陷**（2026-09-29）：`PlayerHudBrand` 里那条解释性注释写在 **JSX 子位置**且是裸块注释，
  React 会把它当**文本节点渲染**——桌面播放器界面上真的印出了「/* 这里不能再用 Link 包一层… */」一整段源码文字。
  改法是把注释裹进花括号表达式；**并留一条判据**钉住这一类：`expect(page.getByText(/\/\*|\*\//)).toHaveCount(0)`（进试玩后断言页面上没有源码注释）。
  为什么门禁当时没抓到：`check:size`/`tsc`/`lint` 都不看渲染文本，e2e 当时也没有针对播放器文案的断言——**能过编译不等于能过界面**。
- [~] **撤回一条我自己没归因的判据**（E28 试玩存档回读）：实测进→出→再进会给出「继续游玩」（自动存档确实落本地库），
  但按 Space 推进一拍后该选项消失——2 拍的 bootstrap 工程会被演完、结局收掉活动存档。
  机制没读清之前不该把它当判据钉进基线，遂撤回，改为登记 task「玩家存档在桌面点击层还没有判据」并把两次观察写进去。






  1. `pnpm build:desktop` BUILD_EXIT=0，重新产出 `Axiforge.app` 与 `Axiforge_0.1.0_aarch64.dmg`。

  2. **随包示范作确实在产物里**：`strings Contents/MacOS/axiforge-desktop` 里有 `seeds/manifest.json` 与 `seeds/showcase-1/2/3.axsp`；

     而 `Contents/Resources` 只有 `icon.icns`——Tauri 把 `frontendDist` 整个嵌进可执行文件。

     我一开始按常识去 `find …/Resources -name "*.axsp"`，得到 0 个文件，**那是找错地方，不是缺陷**；

     差点据此报一条「示范作没随包」。教训同「空结果≠不存在」：产物层先确认东西存在哪一层，再谈有没有。

     注：这证明的是路径进了二进制的资源索引，不等于壳内首启真能播种——那一条仍归 #16 的人工壳内验收。

  3. 生产产物里 `storage=memory` 字面量 **0 次**（DEV 测试宿主被 `import.meta.env.DEV` 静态剥掉）。这条以前只是文档里的纸面推断，现在是实测。
     **（更正 2026-10-01）取证的那一层是错的，结论留下、证据换掉**：当时是在 `Contents/MacOS/axiforge-desktop` 上跑 `strings`——
     而 Tauri 把 renderer 资源**压缩内嵌**，JS 内容在二进制里根本读不到：同一次复核里，`选项目标未找到`、`跳转目标未找到`、`未知指令`
     三条**一直在用**的解析器文案也都是 0 命中，它们在 `apps/web/dist/assets/*.js` 里却各自存在。
     也就是说那次"0 次"对该类内容**恒为 0**，它证明不了任何事。
     现在的证据换成能承载它的那一层：`apps/web/dist/assets/` 里含 `storage=memory` 的文件数 **= 0**（grep 实测，dist 是 09:15:21 刚构建的），
     加上源码侧守卫 `apps/web/src/shared/storage/index.ts:143,144`（`import.meta.env.DEV &&` 在生产被静态替换为 false；
     **行号也顺手校正过一次**：原文写的是 `storage/index.ts:139,143`，其中 139 落在那段注释里，143/144 才是守卫与那条 `get("storage") === "memory"` 的真位置——
     而 144 行正是我今天拿去产物层搜的那个形状）。
     留在二进制里可读的只有**资源名**（`seeds/manifest.json`、三个 `.axsp` 各 1 命中）——那部分仍然有效，别混用两种承载层。

     **补记（2026-10-01 04:00）：上面第 922 行那次"换对承载层"的取证，判据形状仍然是错的——今天第三次重量它。**
     问题不在层，在**搜的字面量**：`storage=memory` 这个串在源码里根本不存在（源码是 `new URLSearchParams(window.location.search).get("storage") === "memory"`），
     minify 也造不出它——所以**任何构建、任何承载层上它都恒为 0**，那次"文件数 = 0"跟它替换掉的那次 `strings` 一样证明不了任何事。
     这次按代码真能长成什么样去搜：`get(`storage`)` / `get("storage")` / 以及 `storage` 与 `memory` 相隔 12 字符内的邻近形状，三种写法在 `apps/web/dist/assets/*.js` 里**全部 0 命中**；
     **并配正对照**——同一次 grep 在同一个 chunk（`ui-*.js`，也就是存储代码实际被打包进去的那个文件）里能找到 `axiforge.db` 1 次。
     对照组是这条测量成立的关键：没有它，"0 命中"又一次只是"搜了个不存在的东西"。
     **还有一道形状对照**：产物里能直接看到 react-router 留下的 `URLSearchParams(a.search)` 与 `.getAll(\`index\`)`——
     证明构建确实**原样保留** `X.get("字面量")` 这种形状，所以"搜不到我们的 `get("storage")`"不是被压缩变形的结果，而是那段代码真不在。
     **结论不变**（DEV 测试宿主确实没进产物），但证据从"两次恒为 0"换成"一次带对照组的 0"。源码侧守卫那条引用照旧有效。
     收成一句方法：**验"某串没进产物"之前，先问这个串在原代码里长什么样**——文档里的措辞（`?storage=memory` 是 URL 形态）不是可搜索的字面量。

  **导航出口这一轴是新做的**（此前只普查过数据通路）：桌面可达界面里指向云本质页面的出口共 4 处——

  `PlayerPage.tsx:813/816`（错误态 CTA「去发现更多作品」）、`PlayerPage.tsx:916`、`AppHeader.tsx:70`（「发现」导航）、

  `UserAccountMenu.tsx:73`（作者主页）。实测 `/discover` 在桌面是 E14 在册的**零云端路由**（进去是显式缺席，不发请求），

  所以这四处**不是数据通路泄漏**，而是同一道产品题：云本质页面在桌面要不要留入口——归 S13-3 定档，本轮只登记，不替产品判断顺手删。

- [x] 附带：金样本第四份 —— 跨语言**分支**对照（2026-09-29，把 G6 从"当前样本一致"升级到"这些分支两边都走"）。
  起因是宪章里我自己写过的那句教训（S13-2b 补记）：金样本证明"当前两边一致"，证明不了"每条分支两边都走"。
  **实测三份示范作金样本对那两条真缺陷所在的分支是零覆盖**：`input.json` 里 `sceneRefId` 全是 `null`、
  `assetRefs`/`items` 全是 0、`playMeta` 全是 `{}`。
  新增 `packages/core/src/__golden__/b1a7c0d0-【对照】分支兜底/`（播种脚本 `backend/scripts/seed_branch_parity.py`，
  固定 UUID 可反复重跑），把兜底的四种组合各铺一遍（自有值优先 / 空串算没值 / 资产字段也空 / 资产查不到）、
  道具引用一条存在 + 一条**悬空**、术语表三条（正常、缺 `id`、空 `term`）。
  **顺带修掉 `dump_golden.py` 三处真实缺陷**（都是"重生成命令自己不可执行"级别的问题）：
  ① `--out` 的值没从 id 列表里摘出来，于是按脚本自己 docstring 的写法一跑就以 exit 1 收尾
  （三份老金样本能写出来，只因为它们在崩掉之前已经完成）；② 默认输出路径相对 cwd，而脚本要从 `backend/` 跑，
  不带 `--out` 时会写到仓库外面；③ 道具预解析 `if it:` 把悬空引用**整个丢掉**，
  导致金样本喂给 TS 的输入并不是桌面真实会喂的那一份（桌面投影 `compilerInput.ts:84` 是"留着、`asset: null`"）。
  现在 dumper 与投影逐字同形，"跳过悬空"这条分支才第一次进入跨语言对照。
  **牙是这么证的**（还原后 82 passed）：`||` 退回 `??` → 金样本那条 + 场景分支单测共红 2 条；
  悬空道具不再跳过 → 红 2 条（**修 ③ 之前这条只有单测红、金样本不红**，正是那条丢掉悬空的写法造成的空转）；
  术语表去掉 `trim` → 红 2 条。
  复现：`createdb axiforge_golden` → `alembic upgrade head` → `seed_branch_parity.py` → `dump_golden.py <id>`；
  **scratch 库已删**，开发库 `axiforge` 全程零接触（实测 `pg_database` 只剩原有四个 axiforge* 库）。

  **这份样本一装上去就抓出一处真的两端不一致**（不是形状差异，是产物差异）：
  同一角色挂两条选角时，Python 的 `codexScope` 给重复项、TS 给去重项。
  判据是金样本那条用例直接红（`expected … to deeply equal …`，差集就是那一条重复 id）。
  取向按 ADR-029 决策 5 定：**TS 是真相源**，且重复项对"查哪些角色的跨作品记忆"没有语义，
  于是把 Python 侧收紧到去重（保持首次出现顺序，`compiler.py`），
  并新增 `backend/tests/test_story_compiler.py::test_codex_scope_dedups_repeated_role` 钉住它
  （把去重退回原形状 → 该用例红，实测 1 failed）。
- [x] 附带：桌面投影的**端到端**对照用例（`apps/web/src/shared/storage/compilerInput.test.ts`）。
  金样本对照的是"同一份输入 → 两端输出一致"，而本轮两条真缺陷都出在**投影**（bundle → 输入）这一层，
  那条链路此前只在单测里按字段测过、没有和服务端产物对起来过。
  新用例走完整链路：本地存储形态 → `bundleToCompilerInput` → `compileStory` → 必须等于 `expected.json`。
  **比较编译产物而不是比较输入对象**是有意的：`scenes[].nodes`、`sceneRefId`、`isPublic` 这些
  编译器不读的形状差异会淹没有意义的差异，而产物层相等才是用户看得见的一致。
  牙（还原后 4 passed）：把舞台资产在投影里丢掉（S13-2b 之前的形状）→ 红 2 条；
  把道具丢掉（S13-2c 之前 `items: []` 的形状）→ 红 2 条。这两次正是历史上真实存在过的两个缺陷。
  **两处漂移在册而不是当场修**，写成显式断言、改好就会红：
  ① 桌面 `playMeta` 恒 `{}` → 术语表在桌面试玩里不出现（就是 #58 的那半条，需产品定档）；
  ② 边级 `condition` 在本地存储没有列、投影给不出，而编译器的"多出口自动成选择"会用它
  （`compiler.ts:191`）。不补的理由：Flow 编辑器把门禁写在**节点**的 `trigger_condition` 上
  （`useProjectEditor.ts:545`，随 narrativeData 落本地、两端一致），边级条件只有 API/旧数据才写；
  为 UI 走不到的路径加 schema v6 + 契约方法 + 三实现属于给假设需求造工程。

- [~] S13-5 验收基线搬家：**内存本地库宿主已建起来**，E17 是它的第一条产出。 **2026-09-29 实测推进**：新增 `playwright.desktop.config.ts` + `pnpm e2e:desktop`（只起 vite，不起 uvicorn，`testIgnore: /baselines/`）。无后端下 25 条桌面族用例全绿；不加 ignore 时 38 条会红 12 条，且 12 条**全部**来自 `baselines.spec.ts`——这就是「基线搬家」可执行的那一半，S13-6 的前置从口号变成一条命令。 **2026-09-30 复量（同日第十二→十九次）**：`--list` 口径下浏览器态 **50 tests / 3 files**（`baselines` **13** + `desktop-http` 33 + `llm-endpoint` 4），桌面态 `pnpm e2e:desktop` **37 tests / 2 files** 零后端全绿，且已在 **Node 20.20.2**（CI 同档）实测两套配置可加载。上面那句「38 条红 12 条」是当时数字，保留不改写。**于是 S13-6 的前置不再是"要不要搬"——桌面那一半已经搬完**，待决的是这 13 条的归属（分母已量：只涉及 8 个端点形状，本地是一次 `saveNarrative` 原子覆写 ⇒ 搬离线不需新能力，代价是不再覆盖后端 REST 契约；见本节末第十九次补记与 `WEB_SUNSET_RESTORE` 的第 1 问）。
  `createStorageProvider()` 增加 `?storage=memory` 分支（**仅 DEV 生效**）。
  为什么必须有它：E14/E15 注入的 `__TAURI_INTERNALS__` 只骗得过 `isTauriEnvironment()` 的判定、
  骗不过 Rust 连接，所以「点击之后的行为」在 e2e 里结构上不可断言——S13-2d 那份审计就卡在这。
  E17 一条走完「新建剧本 → 落到工程页 → 后退列表看得见 → 删除 → 回到空态」并断言全程零 `/api/v1`
  （后退而非第二次 `goto`：内存库随页面重载归零，`goto` 会把它变成假阴性）。
  两次红证明它有牙：`create` 退回直连 `projectApi` → 红在「列表里看得见」；摘掉 `?storage=memory` 分支 → 红在首屏空态。
  **测试宿主没有进生产物**（实测，不是声明）：`pnpm --filter @axiforge/web build` 后
  `dist/assets/*.js`（10:38 刚构建）里 `get("storage")` 与 `"memory"` 各 **0 命中**，
  而同一批文件里 `"还没有剧本"` 1 命中——对照组证明 grep 面有效，`import.meta.env.DEV` 静态替换后整段被 DCE。
  仍欠：`nexus` 的 `sendToInbox` 与 `aiApi.suggestCharacter` 的**最终处置**（判死或真本地化）——后者在 2026-09-29 已改为显式缺席并进了 E19，但它缺的那份建档提示词仍未决，见上面 S13-4 的更新段；
  角色的设定导出/复制两个按钮在桌面是点了没反应（`CharacterById` 路由可达、且不在任何 `localOnly` 闸门内）；
  以及把 34→35 条 e2e 的**主目标**从浏览器 run mode 挪到壳内冒烟。
  **一处按证据作废**：普查里「工程模板 tab 仍是 `projectApi.listTemplates` + `catch(() => [])`，桌面会演成空态」
  这一条**前提不成立**——`ProjectListPage` 的工具条整块本来就被 `{!localOnly && (<>…</>)}` 包住
  （模板 tab 与元剧本筛选都在里面，桌面进不到那个 tab，那条 effect 只在 `tab === "template"` 时触发）。
  我是先写了一条断言它的服务端用例、再用恒真变异打出它的空转：把外层闸门改成 `{true && (` 之后
  桌面那一半才红（`Received: 1`），说明这条不变量值得守，而**原报告里的那个小缺陷并不存在**。
  最终留下的不是"修复"，而是 E18：断言工具条在浏览器有、桌面没有。
  E18 实测随本批跑进套件（`pnpm e2e` 36 passed）。
  顺带复核：角色页那两个导出/复制按钮**不在任何 `localOnly` 闸门里**（367/377 两处闸门在 388 的分隔线之前已闭合），
  所以 S13-2f 的立项前提成立。
  这一步做完才允许浏览器 run mode 降级为纯测试宿主

  **基线的新家已落地（2026-09-29，#26 的前半条）**：`apps/web/e2e/` → 仓库根 `e2e/`，
  `playwright.config.ts` 的 `testDir` 随之改为 `"e2e"`（旧路径只留在 BLUEPRINT 的日期条目里，那是历史轨迹不改）。
  理由很具体：web 端退场（ADR-029 决策 2）时不能把 37 条行为基线一起删掉——它们现在是桌面唯一的自动化验收面。
  **顺带补上一道此前不存在的检查**：`tsconfig.e2e.json` 把规格文件纳入 tsc，并接进 `pnpm typecheck`（G1 链第一环）。
  此前 37 条基线的 TS 从没被类型检查过（`apps/web/tsconfig.app.json` 的 include 只有 `src`），
  接上后立刻报出 `e2e/baselines.spec.ts` 里一个从未被使用的 `replaceEdges` 导入（oxlint 早就警告过，但没人把它当错误）。
  牙：往 `desktop-http.spec.ts` 注入一处类型错误 → `pnpm typecheck` 报 4 处并 exit 1；还原 → exit 0。
- [ ] S13-6 后端退场：`backend/` + Postgres + Alembic + `docker-compose.yml`。删前必核三处依赖：随包 `.axsp` 播种链路、`seed_showcase` 的三份示范作、`docs/user` 与 README 里所有指向服务端的段落的**桌面分支不受影响**（播种在壳内，示范作是构建产物）
  **事前核查（2026-09-29 做完，三条都有实测结论；这一条不是「随时能删」）**：
  1. **随包 `.axsp` 播种链路 = 桌面自足** ✓。取法是同源相对 `fetch("/seeds/manifest.json")`
     （`desktopSeed.ts:16,49-50`），文件在 `apps/web/public/seeds/` → 进 `dist/seeds/` → 打进桌面包。
     产物层证据：`Axiforge.app` 的内嵌资源索引里查到 `seeds/manifest.json`、`showcase-1.axsp`、`showcase-3.axsp` 各 1 命中
     （第一次拿中文原文当探针是 0 命中——资产内容被压缩，只有文件名在索引里明文，探针选错过一次）。
     结论：删后端不影响首启播种。
  2. **但示范作内容的重建路径依赖后端** ✗ —— 这才是 S13-6 的真前置。
     唯一干净的再生成路径是 `AXIFORGE_EXPORT_SEEDS=1 pnpm --filter @axiforge/web exec vitest run src/shared/storage/exportSeeds.test.ts`，
     它第一步就是 `POST /editor/projects/seed/showcase`（该文件注释写明「复用应用自身的导出路径，不再写一份映射」，
     因为 `ProjectResponse → ProjectBundle` 只允许一处权威）。后端一删，这条工具就废。
     **而且两份权威今天已经漂了**（实测）：`seed_showcase.py:209` 给示范作① 写了 `play_meta.glossary`（一条「交汇港」），
     而随包三份 `project.json` 的键只有 `axsSource/edges/meta/nodes/roles/scenes`，**没有 `playMeta`**；道具引用同理为 0。
     也就是说包里那份内容并不是「按当前定义导出来的」，真重导一次会改动随包内容。
     两档选项与代价（需要定档，不是我能替你选的）：
     - **甲：把示范作定义与导出器搬进 TS**（三份内容成为构建期数据，`.axsp` 由本地生成）。
       代价是一次真迁移（内容定义 + 导出映射 + 重导与 diff 复核），换来退场后仍可再生成；
     - **乙：宣布随包 `.axsp` 从此就是权威**，`seed_showcase.py` 与导出工具随后端一起删。
       代价是示范作只能手工重导更新，且要同时改掉 ADR-026 与本项目记忆里那句「重建要靠复用后端定义」。
     不能拖着不选：现在的状态是**两份都在、且已经不一致**，比只有一份危险。     **漂移已钉成机器在册**：`apps/web/src/shared/storage/seedShape.test.ts`（8 条）——三份包的字段集、`assetRefs` 为空、manifest 与目录一一对应。
     两次变异各见过红：归一化时多补一个 `playMeta` → 红 3 条（真重导过一次也要响，不许把这处漂移静默「修平」）；
     manifest 多列一个不存在的包 → 红 1 条（播种按 manifest 取文件，多一项就是一条 404）。
     在册口径写清是 **normalizeBundle 之后**的键集：`assetRefs` 那格就是补进来的空数组，
     所以「包里没有道具引用」由 `assetRefs 为空` 那条断言守着，不靠键名缺失（我第一次写就把它当成缺失，红了才发现）。
  3. **文档面** ✓（退场时只需改 README）。`docs/user/` 实测**零**服务端指向（只有 `desktop/` 与 `writing/` 两节）；
     `README.md` 命中 10 行（命令：`grep -n 'localhost:8000\|uvicorn\|docker\|dev:api\|alembic\|pnpm setup\|5432' README.md`）：16、26、27、36、37、49、60、90、96、106，覆盖 `pnpm setup` / `dev:api` / 端口表 / alembic 段，
     逐条改成桌面口径即可，不涉及结构重写。
- [ ] S13-7 分支消解：删 `httpStorageProvider`、`httpDomains`、各适配层的云端字段映射与 `isTauriEnvironment()` 的另一半。做完「一个功能只有一条数据通路」才算成立——不再需要问"桌面这条接了没有" —— 体量已实测（2026-09-29）：29 个云端分支文件 / 2538 行、25 个文件里 34 处分叉点；见 [WEB_SUNSET_RESTORE](./WEB_SUNSET_RESTORE.md) 的退场前置表。
- [x] S13-8 修订战略文档 —— 已交付 2026-09-29：新增 [ADR-029](./ADR/029-desktop-only-build-target.md)
  （桌面是唯一构建与发布目标、web 与第二套数据通路退场、代价与未决逐条实测；链接 ADR-024/008/016/027/026）；
  `docs/ADR/README.md` 索引补上 **ADR-028 与 029 两行**（028 此前根本不在索引里，文件存在却查不到，
  顺手按同一格式补上）；归档 `docs/archive/ROADMAP_FINAL.md` 的楔子3 就地标注为随分发面退场而搁置，
  并如实写明楔子2 只部分不受影响（跨作品 Codex 在桌面是「如实说出来地缺席」）；
  恢复锚点 [WEB_SUNSET_RESTORE](./WEB_SUNSET_RESTORE.md)（历史标签 `web-archive-20260926`）与
  逐功能去留 [WEB_FEATURE_DISPOSITION](./archive/WEB_FEATURE_DISPOSITION.md) 两份文档此前已存在，本条只做链接。

> **收尾快照（2026-09-29，tag `desktop-wip-20260929`）**
>
> 本轮四颗提交：
> `8838218` S13-2c 道具引用本地化（建表/读写/检索同批 + 后端按工程收紧）；
> `5fc9977` 离线试玩两处静默降级（私有角色一条不解析、道具恒空）；
> `bee4997` 引擎 11 条分支行为用例 + 旧存档缺子表导致播放页白屏；
> `c014a96` 收尾快照；以及第五颗——编译器/条件求值分支用例 + 覆盖率排除口径修正
> （G2：core 两轴达标 98.62/90.07，editor-core 行达标、分支 86.24 未达）。
> S13-2 的三个子刀（2a/2b/2c）至此全部落地。
>
> 实测验收状态（不是声明，都是刚跑出来的数；2026-09-29 随 S13-2d 重测一遍，覆盖上一版数字）：
> - `pnpm gates` 九道全绿（`pnpm coverage` 已并入）；单测 core 80 / axs 37 / editor-core 151 / web 131（另有 1 条显式跳过：需后端在线的示范作导出工具）/ admin 39 —— 合计 **438 passed + 1 skipped**
> - `uv run pytest -q` 后端 165 passed；`pnpm e2e` **34 passed**（E1–E16，独立库 `axiforge_e2e`，自包含起服务后自动收；比上一版的 33 多一条，就是本批加进 CLEAN_ROUTES 的 `/studio/characters/new`）
> - 覆盖率：`packages/core` **98.62% 语句 / 90.07% 分支**（由 `9513c74` 过线），`packages/editor-core` **96.82 / 90.26**（由 `5bf4344` 过线）—— G2 的「行+分支 ≥90%」两包两轴**均达标**（上一版此处记的是 core 分支 79.71 未过）
> - 本轮每条新判据都配了一次「让它先红」的变异：把代码改回缺陷形状，只有对应用例失败、其余全绿才算数（其中三次注入本身语法失败，重做后才有结论——失败的变异不算证据）
>
> 未做完的（保持未勾，不降级成「已完成」）：
> - S13-2d 五处「有数据才挂载、E14/E15 结构上测不到」的待核项
> - S13-3 云本质功能判死并摘除；S13-5 验收基线搬家；S13-6 后端退场；S13-7 分支消解；S13-8 战略文档修订
> - S13-4b 的两条已知短板：`OLLAMA_ORIGINS` 在真壳里仍是纸面推断（浏览器测不到 `tauri://localhost`）；
>   4B 量化模型「能解析但质量差」的输出仍会直接成草稿
>
> **三条需要用户决策才能动的新事实**（都不是我能替你定的）：

> 1. **dev 库 `axiforge.projects` 有 2638 条测试残留**（作者 `pytest` 1626 / `pytest-admin` 240 / `u1`·`owner-a`·`official`·`creator-x` 各 160；标题如「存档剧本」「编译剧本」「pytest剧本」）。
>    `a0b0cb7` 那次只清了 1765 条审核案件，工程本体没清；`created_at` 最大 2026-09-28，即 #54 的测试库隔离之后**今天零写入**（实测 dev 无 09-29 行）。
>    清理是删数据：要按作者白名单来，且先 dump 再 restore 到临时库比行数才算数。等一句「清」。
> 2. `GlossaryEditor.tsx` 在 apps/web 里**零消费者**（全仓 grep 只有它自己的定义）。术语表因此存在两处缺席：界面上喂不进去，桌面投影也不带（`bundleToCompilerInput` 的 `playMeta: {}`）。
>    要么补上入口与本地列，要么判死删组件——删功能要数活读者，这里读者是 0，但它是"待接"还是"该删"是产品判断。
>    **本条前提已按产物层重量一次（2026-09-29），结论比原条目更窄**：三个随包示范作
>    `apps/web/public/seeds/showcase-{1,2,3}.axsp` 里 `project.json` 的键只有
>    `axsSource/edges/meta/nodes/roles/scenes`，**没有 `playMeta`**（实测 unzip + JSON 键名）。
>    也就是说：光修桌面投影交付不了任何东西——缺的是写入侧（没人能产这份数据），不是读取侧。
>    服务端那边确实有：`seed_showcase.py:209` 给示范作①写了 `play_meta.glossary`（一条「交汇港」），
>    所以今天**网页试玩有这一条释义、桌面试玩没有**，但桌面看不到它的原因在容器不带该字段，而非编译器。
>    决策因此变成三档而非两档：接（补 UI + 契约字段 + 容器字段 + 重生成示范包）/ 判死（删组件与字段）/ 维持现状；
>    每档都要动的面差别很大，等你定。
> 3. 覆盖率不在 `pnpm gates` 里（只有 `pnpm coverage`）。G2 目前靠人自觉，门禁不锁的指标会漂回原样；把它锁进 CI 属 M4 的固定税。

> **收尾快照 2（2026-09-29 S13-2d/2e 两刀，tag `desktop-wip-20260929c`）**
>
> 提交：`10e04d9` S13-2d（跨作品 Codex 读侧 + 审计结论 + `PlayerStatePanel` 外提）；
> 本颗 S13-2e（工程域写侧本地化 + `?storage=memory` 宿主 + E17）。
>
> 实测验收状态（都是刚跑出来的命令与数字）：
> - `pnpm gates` GATES_EXIT=0，九道全绿；单测 core 80 / axs 37 / editor-core 151 / web 141（+1 显式跳过）/ admin 39 = **448 passed + 1 skipped**
> - `pnpm e2e` E2E_EXIT=0，**35 passed (45.7s)**（比上一版 34 多 E17 一条）
> - `cd backend && uv run pytest -q` PYTEST_EXIT=0，**165 passed**（本批未改后端，此处为同日复跑）
> - `pnpm build:desktop` BUILD_EXIT=0：`cargo` release 26.54s，产出 `Axiforge.app` 与 `Axiforge_0.1.0_aarch64.dmg`（5,319,503 B，10:19）；
>   产物新鲜度不是靠 mtime 一句话——`.app` 内二进制含 `PlayerPage-DSiQE96l`，这个名字只存在于当天 10:18 的 `apps/web/dist`
>   （第一次探针选错了：中文原文 0 命中，因为 Tauri 把资产压缩进二进制，索引里只留文件名）
> - 变异证据：`projectSaves.test.ts` 4 次（红 6/3/2/2 条）、E17 2 次（红在「列表里看得见」与首屏空态），还原后各自复跑全绿
> - DEV-only 测试宿主不进生产物：`dist/assets/*.js` 里 `get("storage")` 与 `"memory"` 各 0 命中，
>   同批文件里 `"还没有剧本"` 1 命中作正对照
>
> 本批普查（桌面可达路径里绕过分派口的直连 HTTP）其余结论已挂在上面 S13-5 的「仍欠」里：
> 角色设定导出/复制两按钮、`nexusApi.sendToInbox`、模板 tab 的 `projectApi.listTemplates` + `catch(() => [])`。
>
> **第四条需要用户决策的事实**：**桌面壳（Rust 侧）在 CI 上零信号**——`pnpm check:desktop` 刻意不在 `gates` 里
> （`971b9c8` 的理由成立：没有 Rust 工具链的人就连门禁都跑不动），而 `.github/workflows/ci.yml` 里没有任何 desktop job。
> 可选处置是加一个 `macos-latest` 的 `cargo check`（Linux 需要 webkit2gtk 等系统依赖，且 `targets: "all"` 在 Linux 上会去碰 deb/AppImage 链路），
> 但本会话无法观察远端 CI（`gh` 未登录、私有库匿名 API 返回 404），**未跑过一次的 CI 配置不该被声称有效**，所以没写进 `.github/`，等一句「加」。

> **收尾快照 3（2026-09-29 S13-2f，tag `desktop-wip-20260929d`）**
>
> 普查的最后一刀：角色设定导出/复制本地化（`characterExport.ts` 新增，页面两处逐字重复的拼装收成一处，
> `CharacterDetailPage` 棘轮 735→702）。
> 实测：`pnpm gates` GATES_EXIT=0，单测 core 80 / axs 37 / editor-core 151 / web 148（+1 跳过）/ admin 39
> = **455 passed + 1 skipped**；`pnpm e2e` E2E_EXIT=0，**35 passed (45.6s)**；
> `backend` `uv run pytest -q` **165 passed**（本批未改后端）。
> 变异证据：`characterExport.test.ts` 3 次（红 4/1/3 条）。
> 两次自身错误已入档在 S13-2f 条目里：变异脚本跑错了目标文件（三次"无输出"当时看着像"没红"），
> 以及一次改了类型断言却没改行为的无效变异。
>
> **本轮做完之后仍然没做完的**（保持未勾）：S13-3 判死与摘除、S13-4b 壳内 `OLLAMA_ORIGINS` 与小模型护栏、
> S13-5 的"CI 以桌面构建为主目标"（桌面壳在 CI 上仍是零信号，见上面第四条待决策事实）、
> S13-6/S13-7/S13-8、#49 语义令牌收编、#51 自动结案语义、#55 第二批对照标注、#57 dev 库清理、#58 术语表三档决策。
>
> 手动验收（机器给不出的那部分，仍在你手上）：把 `Axiforge.app` 双击打开，看首屏能否新建剧本、
> 试玩一台没有后端的机器上的示范作、以及角色页「设定导出」是否真落出一个 `.md`。

> **收尾快照 4（2026-09-29 本回合最后两刀，tag `desktop-wip-20260929e`）**
>
> 两刀都是"查漏补缺"而不是新功能：
> 1. `f4b4840` 加 E18 钉住「云端专属工具条在桌面不给入口」，同时**按证据作废普查里一条不成立的前提**
>    （模板 tab 早在 `{!localOnly && (<>…</>)}` 整块里，桌面进不到那条 effect）。
>    作废过程本身就是这条用例的价值来源：我先写了断言、再用 `{true && (` 打穿外层闸门，
>    看到桌面那一半红（`Received: 1`）才知道原断言是空转。**页面改动整体撤回**，不留死条件。
> 2. 本颗文档刀：新增 [ADR-029](./ADR/029-desktop-only-build-target.md)（S13-8 关闭）、
>    `docs/ADR/README.md` 补回**此前完全不在索引里的 ADR-028** 与新增的 029、
>    `docs/ROADMAP_FINAL.md` 楔子3 就地标注搁置并如实写明楔子2 只部分不受影响。
>
> 实测（本回合最后一次全链复跑，都是命令产生的数）：
> `pnpm gates` GATES_EXIT=0 / 单测 455 passed + 1 skipped；`pnpm e2e` E2E_EXIT=0 / **36 passed (45.9s)**；
> `cd backend && uv run pytest -q` PYTEST_EXIT=0 / **165 passed**；`pnpm check:desktop` EXIT=0（本地 1.0s 预热）。
>
> 一条改判（原 #25「让 web 也改调 TS 内核」）：在桌面唯一化之后，这条的正确归宿不是"web 换内核"，
> 而是**Python 编译器随 web 一起退场**（ADR-029 决策 4/5）。给要被删的那一侧新建调用路径是净负收益，
> 而双端分叉的风险已由金样本 + 分支用例 + `sceneRef` 那类专项回归守着。

> **收尾快照 5（2026-09-29 收束，tag `desktop-wip-20260929f`）**

`desktop` 分支这一轮共八颗：`10e04d9` S13-2d、`eef97ff` S13-2e、`cafe63c` S13-2f、
`f4b4840` E18 + 作废一条不成立前提、`afc22bb` ADR-029（S13-8）、`6ee75f2` S13-4b 的一部分
（建档建议显式缺席 + E19）、`296c06f` 本回合新增错误提示收成语义令牌 + #49 的实测分母。
标签依次是 `desktop-wip-20260929c/d/e/f`，收束在这段的 `g`。

最后一次全链复跑（数字全部由命令产生）：
`pnpm gates` GATES_EXIT=0，九道全绿，单测 455 passed + 1 skipped；
`pnpm e2e` E2E_EXIT=0，**37 passed (46.7s)**（E17/E18/E19 是本回合新增的三条点击/入口判据）；
`cd backend && uv run pytest -q` PYTEST_EXIT=0，165 passed；
`pnpm check:desktop` DESKTOP_CHECK_EXIT=0；`pnpm build:desktop` BUILD_EXIT=0，
产物 `Axiforge.app` + `Axiforge_0.1.0_aarch64.dmg`（5,319,503 B）。

清单状态：S13-1、S13-2a–f、S13-8 为 `[x]`；S13-2d 与 S13-5 为 `[~]`（各留真实未决项）；
S13-3、S13-4（含 4b 三条）、S13-6、S13-7 仍为 `[ ]`，它们的下一步都需要 ADR-029「未决」里那五条判断。

> **一条实测分母（2026-09-29，#49「写死色板收成语义令牌」的起点，也是一条没有下手的决定）**
>
> 扫五个硬色线根（`features/studio`、`features/discover`、`features/character`、`apps/admin/src`、`packages/ui/src`）
> 里的 `(text|bg|border|ring|…)-<palette>-<0-9>{2,3}` 类名，共 **239 处 / 44 个文件**。
> 但命中面里最大的几个都不是债：`Badge.tsx` 30、`studio/flow/types.ts` 33、`cut/timelineUtils.ts` 24、
> `flow/stageColors.ts` 12 —— 它们是**配色的定义处**（变体→色档的映射表），债在消费侧的散装用法
> （`CharacterEditor` 14、`ModerationPage` 10、`StoryNode` 10、`CharacterDetailPage` 7…）。
> 所以这一轮**没有**加"按文件计数"的棘轮：那道闸门会把映射层一起记成债，量错东西的门禁比没有门禁更贵
> （宪章 G1 那次「文档把愿望写成机制」的教训同族）。要做的前提是先定口径——要么给扫描加"只算 JSX className
> 字符串字面量"的作用域，要么先给映射层一份显式豁免清单，两者都需要一句话来定"什么算定义处"。
>
> 本回合只清偿自己新增的部分：三处错误提示原先写成 `text-red-500`，现已收成语义令牌 `text-danger`
> （`ProjectListPage` 两处、`ProjectCreatePage` 一处）。理由是实测出来的，不是审美：
> `packages/ui/styles/tokens.css` 里 `--ax-danger` 分主题（浅 #dc2626 / 深 #f87171），
> 而 `red-500` 在两套主题里是同一个死值 #ef4444——**写死色板绕过的不只是对比度门禁，还有主题切换本身**。
> 类名有效性在产物层验：`dist/assets/index-*.css` 里有 `.text-danger{color:var(--color-danger)}`。
> 此前我在 S13-2d/S13-2f 里写过「与本文件既有的 text-red-500 同一色档」，那个判断是错的，按上面这条改掉了。

> **复合控件的标签关联补齐（2026-09-29，#63）**
>
> 上一颗 `7b21a33` 把 `Input`/`Select`/`Textarea` 三个原语用 `htmlFor` 连上了标签，
> 但**复合控件**仍是纯视觉的：`TagEditor`（道具详情的机制/效果标签）、
> `ToggleInput`（建角色的六层设定，预设/自定义双形态）、`SearchSelect`（预设形态的主控件是 button）
> 各自渲染 `<label>` 却不指向任何控件——读屏在这几栏只念得出占位符。
> 三个组件统一改成：`useId()` 给可见 `<label>` 一个 id，再把 `aria-labelledby` 透到**当前真正渲染出来的那个控件**上
> （`ToggleInput` 的三个分支：SearchSelect / Textarea / Input 各一条，漏一支就是漏一条腿）。
>
> **判据长在哪个分支上，这条修复才算数**——这里我犯过一次并记在案：
> 第一次用 `toHaveAttribute("aria-labelledby")` 断自定义形态，把 ToggleInput 的 **Input 分支**属性摘掉后
> 用例**仍然全绿**。两条原因叠在一起：① 建角色页的「概括」是 `type="textarea"`，那一页根本没渲染 Input 分支，
> 变异打在死代码上；② 换成 `getByRole` 后仍绿，因为 Playwright 的名字匹配**默认子串**，
> 而控件在没有关联时的兜底可访问名正是 placeholder `一句话概括角色 *`——它里面就含「概括」两个字。
> 现在三条腿各配 `exact: true` 的角色+可访问名断言，四次变异逐条见过红：
> Textarea 分支（红在 `textbox 概括`）、Input 分支（红在 `textbox 人生主题`，这一栏的 placeholder 不含栏目名，
> 所以它才是真正的判据）、SearchSelect（红在 `button 概括`）、TagEditor（红在 `textbox 机制标签`）。
> 教训一句话：**断言"控件被这个名字指到"，不要断言"这个属性存在"——后者连指错元素都抓不到。**
>
> 顺带一条没动的事实分母：`apps/web/src` 里还有 **24 处 `<label>` 同行不带 `htmlFor`**，
> 其中一部分是包住房控件的 wrapping 型（合法，例如「公开到角色大厅」那个勾选框），
> 剩下的散装表头（`ScriptEditor` 的表情/分支选项、`ConditionSimulator`、`ItemsPage` 的两个筛选器等）
> 需要逐个分派才能定"该修还是该收进组件"，本轮没有顺手改——按范围纪律记在这里。
>
> 实测（本颗最后一次全链复跑，数字由命令产生）：`pnpm gates` 退出码 0（九道全绿，含 e2e 的 tsc）；
> `pnpm e2e` **38 passed**（49.3s）；`pnpm e2e:desktop` **25 passed**（1.0m，零后端）；
> `pnpm --filter @axiforge/web build` 成功，产物 `dist/assets/ui-*.js` 里 `aria-labelledby` 在位
> （只重建了 renderer——cargo 那段本轮未跑，改的是 TSX 属性透传，不涉及壳）。

> **E28 · 桌面自动存档的点击层判据（2026-09-29，#64）**
>
> 播放进度走分派口 `playerSaves.writeSave`，桌面此前只在契约用例里成立过，没被点过一次。
> 补在 E17 的试玩一跳之后：`离开播放器 → 再进来`，再进来时播放器读**活动存档**，读到就换
> 「继续游玩」那一屏（摘要就是刚写进那一拍的旁白字）。这条量的是存储回读，本页 state 骗不过它。
>
> 防抖 600ms 让这条一度被误判成"桌面存不上"：轮询体里用 `count()` 立刻问，连轮三轮全 0；
> 挂上旁路日志才看清 `{ok:true,via:"local"}` 早就写了、重进时 `status=active beat=node-start` 也早就读回来了——
> 红在**我读得太早**（进场是异步的：离线上架 → codex → getSave → 才渲染）。换成 `waitFor(visible)` 后一次过。
> 判据本身要等它出现，而不是等一个自己指定的时长——这两条是同一条纪律的两面。
> 变异见过红：把 `writeSaveSlot(...)` 整段换成一个 `Promise.resolve({ok:true})`（拿走能力而不是错误处理），
> 30s 内「继续游玩」永不出现 → `Expected: 1 / Received: 0`。
>
> 顺带记一条产品事实（本轮没改）：自动存档的 600ms 防抖挂在播放器的卸载清理上，
> **进播放器后 600ms 内就离开，这一拍进度会丢**。这是设计取舍还是缺陷需要定档，不在测试里替它决定。
>
> 实测：`pnpm e2e:desktop` 连续两次各 **25 passed**（1.2m，防抖+轮询这类判据必须复跑）；
> `pnpm e2e` **38 passed**（55.6s，E28 在云端宿主里同样成立）；`pnpm gates` GATES_EXIT=0。
> 本轮零产品代码改动（变异与旁路日志都在提交前逐文件还原，`git diff` 已确认 PlayerPage 干净）。

> **#65 开了个头：`AnchorEditor` 的「标签」那一栏补上 `htmlFor`（2026-09-29）**
>
> 桌面主路径（建角色页）上那处散装 `<label>` + `Input` 现在用 `useId()` 连起来了——
> 走的是「补 htmlFor + 调用方覆盖 `Input` 内部 id」而不是「收进 `Input` 的 `label` 属性」，
> 因为那一栏是 `flex items-center` 的一行（标签收进控件内部会把右边的「添加」按钮顶到标签高度上）。
> 判据：`getByRole("textbox", { name: "标签", exact: true })`；变异（只摘 `htmlFor`、留 `id`）红在这一行。
> 其余 23 处未动（含合法的 wrapping 型），仍按 #65 逐处分派。

> **#65 的第二、三处：条件/效果面板的标题改成命名分组（2026-09-29）**
>
> 「触发条件」「完成效果」原本是裸 `<label>`，但它下面是一整列行（每行各有 Select 与 Input）——
> **没有"那一个控件"可指，所以正确的修法不是 `htmlFor`，而是把这一块命名成一组**：
> `role="group"` + `aria-labelledby` 指着标题。判据取浏览器算出来的分组名
> （`getByRole("group", { name: "触发条件" })`），两条腿各见过一次变异红
> （摘掉对应那一侧的分组语义，红在对应的断言行）。
>
> 记一条自己的操作错误（它一度造出一张假判据）：变异循环里我拿的是**打补丁之前**的备份去还原，
> 于是第一次"两条腿都红"里，第二条其实红在上一条——那次的红属于被我还原掉的另一个文件。
> **变异用的还原点必须在修复之后取**，且每条判据的红要能归因到唯一被改的文件；
> 这次重新取了 `/tmp/*.fixed` 并把 EffectEditor 那条单独复跑了一次。

> **#65 的第四、五处与一条重复实现的事实（2026-09-29）**
>
> `ItemsPage` 的建道具表单里「机制标签」「效果标签」是裸 `<label>` + `Input`，各补 `htmlFor`（`useId()` 供 id，
> 调用方覆盖 `Input` 内部那个 id）。判据 `getByRole(textbox, name, exact)` 两条，
> 变异**逐条单摘**（各红在自己那一行），还原点取的是修复之后的副本——上一批我拿修复前的备份还原过，
> 那次"两条都红"的归因是假的，这次改掉了做法。
>
> 顺带一条没下手的重复：同样这两个字段，`ItemDetailPage` 用的是 `@axiforge/ui` 的 `TagEditor`，
> `ItemsPage` 的创建表单是手搓的 37 行等价标记。收进 `TagEditor` 才是净零的做法，但它会带来可见漂移
> （`labelSm` 字号、空态多一个「暂无」），而这一轮的视觉改动没有对过设计口径——所以本轮只做最小关联、
> 把"合并到同一组件"登记在这里，等一句要不要接受那点视觉差。
>
> 另：`OutlinerPanel` 那三处 `<label className="block">` 读代码确认**包住了自己的 textarea**，
> 属于合法的 wrapping 型，不在要修的 24 处之列（分派要有证据，不能只按 grep 计数判）。

> **#65 的交接清单（2026-09-29 复扫，数字由命令产生）**
>
> 本轮修掉 5 处（各配一条 exact 判据 + 一次单摘变异见过红）：`AnchorEditor` 的「标签」、
> `ItemsPage` 的「机制标签」「效果标签」补 `htmlFor`；`ConditionEditor` 的「触发条件」与
> `EffectEditor` 的「完成效果」改成 `role="group"` + `aria-labelledby`（它们下面是一整列行，
> 没有"那一个控件"可指，`htmlFor` 是错的修法）。
>
> 复扫 `grep -rn "<label" apps/web/src --include=*.tsx | grep -v htmlFor` 还剩 **21 处**，按三档分派：
>
> - **字段标签（该补 htmlFor 或收进原语的 `label` 属性）**：ScriptEditor.tsx:453（表情）、ConditionSimulator.tsx:71（模拟变量）、AchievementPanel.tsx:128（解锁条件）、NodeInspectorPanel.tsx:236、SceneAssetsPage.tsx:214
> - **组标题（该像本轮那样改命名分组）**：ScriptEditor.tsx:572（分支选项）、ConditionSimulator.tsx:126（出边预演）、NodeInspectorPanel.tsx:336（分支标签）、EffectEditor/ConditionEditor 的同族列表头（本轮已改）
> - **包裹型（`<label>` 包住房控件，合法，别动）**：ItemsPage.tsx:329、SceneAssetsPage.tsx:248、OutlinerPanel.tsx:425/438/451、PromptExport.tsx:126/138、AnchorEditor.tsx:60
>
> 其中前两档需要人给一句"视觉要不要跟着变"（收进 `Input label=` 会改字号与空态），
> 所以本轮只做零视觉漂移的最小关联；第二、三档的归属我已在上面各处按代码确认过形状，不靠 grep 计数判。

> **#65 的第六处，以及一次「幻影挂起」的归因（2026-09-29）**
>
> 场景页「新建场景」弹窗里的「标签」补上 `htmlFor`（同 `ItemsPage` 那一档：裸 label + `Input`）。
> 判据 `getByRole(textbox, name="标签", exact)` 在 E17 的点击链里，变异单摘 `htmlFor` 红在这一行；
> 这一跳当时只开弹窗验关联、没点「创建」；现在由下面的 E29 接管：真建一条场景并换页回读。
>
> **归因记录（值得留，因为我第一反应是"环境的错"）**：这一批改完后 `pnpm e2e` 连续三次跑出 16 分钟级挂起，
> 每次卡住的是不同的桌面用例（E14 路由抛异常那条、E15 的 items / characters / stories 各一次），
> 单条耗时 15.1–15.4 分钟。对照实验把范围收干净：
> HEAD（不含这两处改动）全量 **38 passed / 56.1s**；只带新腿不带场景页改动 **37 passed / 57.5s**（腿在预期的那行红）；
> 只带场景页改动不带新腿 **38 passed / 56.2s**；两处都在、但没有别的套件在飞时 **38 passed / 56.6s**。
> 结论：**挂起来自我自己并排跑了多套 Playwright（它们共用同一台 vite/uvicorn webServer，
> `reuseExistingServer` 在非 CI 下是开的），不是代码**。上一颗的"环境拥挤"猜测在拿到对照组之前是不成立的猜测，
> 已按证据撤掉。串行复跑：gates 0 / e2e:desktop 25 / e2e 38（56.9s）/ renderer 重建 0。

> **#67 落地：e2e 套件的同树互斥（2026-09-29）**
>
> 上一段的归因结论是"超时来自并排跑的多套 Playwright"，那就把它变成机制而不是自觉：
> `scripts/e2e-lock.mjs`（86 行）包住 `pnpm e2e` / `e2e:desktop` / `e2e:ui` 三个入口——
> 起跑前抢仓库根的 `.e2e-lock`（记录 PID、命令、起始时间），子进程退出时只删自己那把；
> 抢不到就退出并打印持有者。锁文件已进 `.gitignore`。
>
> 三条判据都跑过（不是"看着对"）：
> 1. 桌面套件在跑时再起 `pnpm e2e` → 立刻退出 1，打印
>    `已有套件在跑：playwright test -c playwright.desktop.config.ts（PID 31140，起于 …）`，**没有起浏览器**；
> 2. 第一套跑完 → `25 passed (1.2m)` 且 `.e2e-lock` 自行消失；
> 3. 伪造一把失效锁（PID 999999）→ 打印「收回失效锁」并以 0 退出，不留残锁。
> 第一次交付时脚本 itself 崩过（`const args` 被重新赋值 → TypeError，两套都秒退），
> 是这三条判据把它抓回来的——守卫脚本自己也要有行为判据，否则"护栏"只是文档里的词。
>
> **`optimizeDeps.include` 那半没做，因为证据不支持**：删掉 `apps/web/node_modules/.vite` 做冷启动，
> 起 vite 并跑完整桌面套件（25 passed / 1.1m），dev server 日志里没有 `optimized dependencies` /
> 整页重载的行。既然冷启动不触发中途再优化，往配置里加 react 那几个 include 就是没有依据的预防，
> 不加。相关事实与四格对照在上一段（幻影挂起归因）。

> **#65 的第七处，顺带量到成就写侧走本地（2026-09-29）**
>
> `AchievementPanel` 的「解锁条件」是裸 `<label>` + 原生 `<select>`（这处不是 ui 原语，
> 所以修法是把 `useId()` 的 id 同时给 label 的 `htmlFor` 和 select 的 `id`）。
> 判据在 E17 链里：工具条「成就」→ 项目成就面板的「添加」→ `getByRole(combobox, name="解锁条件", exact)`；
> 变异单摘 `htmlFor` 红在这一行。
>
> 这一跳附带量出一条事实：**桌面宿主里成就的定义读写走的是本地分派口**——整条链末尾那条
> `hits === []`（零 `/api/v1`）断言现在覆盖了「打开成就面板 + 新建一条成就」这一段，
> 它仍然是绿的。此前这条通路只有契约用例层面的证据，没被点过。

> **E29 · 场景池写侧的桌面点击层证据（2026-09-29，S13-2b 那条腿）**
>
> 在 E17 链里把「新建场景」点到底：填名称 → 创建 → 断言卡片出现 → 回剧本页 → 再进场景页 → 还在。
> 判据取换页再进那一次（列表来自 `listScenes` 的存储读，不是本页 state），链尾的 `hits === []`
> 同时盯着这条写腿有没有偷偷走云端。`assetPoolSaves.createScene` 的本地分支此前只在契约用例里成立过。
>
> 变异见过红：把本地分支的 `p.saveScene(...)` + `p.listScenes(...)` 换成一个"看起来成功"的伪造返回
> （拿走能力而不是拿走错误处理），链子红在 `waiting for getByText('离线路台口')`。
> 结论：**桌面建场景是本地通路，且这条通路现在有点击层证据**；S13-6 后端退场时这条不必再留 HTTP 替身。

> **#65 的口径改成"按形状分档"，并补上第八、九处（2026-09-29）**
>
> 之前用 `grep -v htmlFor` 数出来的"剩 N 处"是**高估**：它把合法包裹型和已经改成命名分组的都算进去了。
> 改成机械分档（脚本按 `<label>` 到 `</label>` 之间的片段里有没有控件来判）：
> 共 **24** 处 `<label>`，其中已关联 `htmlFor` **7**、包裹型（合法，不动）**10**、
> 剩下非 htmlFor 形态的 **7** 处逐条列在这里：features/studio/components/ScriptEditor.tsx:453、features/studio/components/ScriptEditor.tsx:572、features/studio/components/ConditionSimulator.tsx:71、features/studio/components/ConditionSimulator.tsx:126、features/studio/flow/ConditionEditor.tsx:46、features/studio/flow/NodeInspectorPanel.tsx:336、features/studio/flow/EffectEditor.tsx:42。
> 里面 `ConditionEditor`/`EffectEditor` 两处已经是命名分组（`id` + `aria-labelledby`，本就不该有 `htmlFor`），
> 真正待分派的是 `ScriptEditor`（表情=字段标签、分支选项=组标题）、`ConditionSimulator`（模拟变量、出边预演）
> 与 `NodeInspectorPanel:336`（分支标签）这几处——它们都要先在桌面里把对应的层/面板点开才看得见。
>
> 第八、九处本轮做完：`ProjectCreatePage` 的「主题标签」与 `TraceEditor`（轨迹层）的「关键事件」，
> 各补 `htmlFor` + `id`。它们**不在 E17 那条链上**——剧本列表的「新建剧本」是内联快速创建，
> 不是 `ProjectCreatePage`（我一开始把判据插进 E17，红在 `主题标签` 取不到，才发现入口搞错了），
> 所以新开一条 **E30**：`/studio/projects/new` 与 `/studio/characters/new` → 点「轨迹」层 →
> 两个字段都能按 exact 可访问名取到，且这两页零 `/api/v1`。两次单摘 `htmlFor` 的变异分别红在各自那一行。

> **#65 的第十处：演出层「表情」（2026-09-29）+ 分档复记**
>
> `ScriptEditor` 的「表情」是裸 `<label>` + 原生 `<input list=…>`。id 用 `expression-${i}` 而不是
> `useId()`——它在 `map` 出来的指令行里，钩子不能进循环（这行旁边本来就有同形状的 `sprites-${i}`）。
> 判据单独开一条 **E31**（建工程 → 演出段点「+ 立绘进场」→ `getByRole(textbox, name="表情", exact)` →
> 全程零 `/api/v1`）；不并进 E17 的理由写进用例注释：那条链末尾要播正文，给同一拍加演出指令会改变演出结果。
> 变异单摘 `htmlFor` 红在 `waiting for getByRole('textbox', { name: '表情', exact: true })`。
>
> 复记分档（同一支脚本）：共 **24** 处 `<label>` —— 已关联 `htmlFor` **8**、包裹型合法 **10**、
> 非 htmlFor 形态 **6**（其中 2 处是命名分组 ConditionEditor/EffectEditor）⇒
> **真正待分派 4 处**：studio/components/ScriptEditor.tsx:574、studio/components/ConditionSimulator.tsx:71、studio/components/ConditionSimulator.tsx:126、studio/flow/NodeInspectorPanel.tsx:336
>
> 顺手改掉 E30 用例标题里的一处错误说法：那个层在界面上叫「轨迹」（`CharacterEditor` 的 layer label），
> 我先前写成「印记」，标题与代码不符会误导下一个读的人。

> **G1 棘轮这一次是真的挡了我，我按它的处置说明做（2026-09-29）**
>
> 给「表情」补关联只加了两行，`ScriptEditor.tsx` 就从 615 涨到 617 越过棘轮，`pnpm gates` 退出码 1。
> 棘轮给的处置是「按域外提成协作模块，不要在文件内继续堆」——照做：把 `OP_META` / `OP_LABEL` /
> `POSITIONS` / `defaultInstruction` 这 55 行纯数据与纯函数外提成
> `apps/web/src/features/studio/components/instructionOps.ts`（62 行新文件，限 400）。
> `ScriptEditor.tsx` 降到 568 行，随后 `check-file-size --update` 把这个更紧的档位锁定。
>
> 两条交付教训（都是我自己造的）：① 外提时忘了给四个符号加 `export`，
> 运行时表现为「演出段打不开」，E31 红在 `waiting for getByRole('button', { name: '演出' })`——
> 类型与模块图的改动必须过 `tsc -b` 与一次真点击，二者各抓到过另一半；
> ② `useId()` 不能进 `map` 的循环，所以这一处的 id 是 `expression-${i}`（旁边本来就有同形状的 `sprites-${i}`）。
> 复跑：gates 0 / `e2e:desktop` 27 passed / `e2e` 40 passed（56.4s）/ renderer 重建 0。

> **#65 倒数第二刀：条件段预演器的两处（2026-09-29），以及一处我撤回的尝试**
>
> 复记（同一支分类脚本，判据是 `<label>` 到 `</label>` 片段里有没有控件 / 头部有没有 `htmlFor` 或 `id`）：
> 共 **23** 处 `<label>` = 已关联 `htmlFor` **8** + 包裹型合法 **10** + 命名分组（`id` + `aria-labelledby`）**4** +
> 待分派 **1**（清单：studio/flow/NodeInspectorPanel.tsx:336）。
>
> 最后四处的处置各不相同，因为它们本来就不是同一种东西：
> - 条件段的「模拟变量」下面是一整列行 → 整块 `role="group"` + `aria-labelledby` 指到标题，
>   行内三个控件各自带 `aria-label`（作用域/键/值 + 序号；`useId()` 不能进 `map`）；
> - 「出边预演（N）」根本不是字段标签 → 改成 `<h3>`，不再假冒 `<label>`；
> - 演出段的「分支选项」→ 与 ConditionEditor 同族，命名分组。
> 判据分别接进 E17（`group 模拟变量` + 三条 exact 控件名 + `heading /出边预演/`）与 E31（`group 分支选项`），
> 两处命名分组各做过一次单摘变异，分别红在自己的组名那一行。
>
> **#65 没关闭，剩两处**：`NodeInspectorPanel:336`（分支标签，连线检查器里）与
> `ScriptEditor` 的「分支选项」。后者本轮试了又撤回：加了 `role="group"` 后判据取不到——
> `getByText("分支选项")` 数 0、`getByRole("group")` 数 0，说明点了「+ 分支」之后那一块根本不在 DOM 里，
> 我没弄明白原因就不把猜测当判据交付（连同那两行改动一起撤回，`ScriptEditor.tsx` 回到 568 行的棘轮内）。
> 已落地的两处是条件段的「模拟变量」（命名分组 + 行内三个控件各自 aria-label）与「出边预演」（改 `<h3>`，
> 它本来就不是字段标签），判据在 E17 里、命名分组那次单摘变异见过红。
> 剩下的只有设计口径层面的事（`ItemsPage` 手搓的标签编辑器与 `TagEditor` 是同一字段的重复实现，
> 合并会带来可见漂移），那部分留在文档与 #49 那条色板分母里，等定档。

> **查明了「分支选项」取不到的原因：`choice` 指令在写侧没有归宿（2026-09-29）**
>
> E31 里点「+ 分支」之后，诊断打出来是：
> `分支选项文本数 = 0`、`表情行还在 = 1`、`指令行标题 = ["1. 立绘进场","2. 旁白"]`、`pageerror/console.error = []`。
> 也就是说**没有报错，那一行被换成了「旁白」**——不是判据写法问题，也不是 React 崩了。
>
> 结构性原因：Beat 的演出指令不是独立存储，它往返于 AXS 文本（`packages/axs/src/parse.ts` 与
> `projection/axs.ts`）。分支在这套方言里由**出边（连线）**表达，`choice` 这种 op 没有对应的行语法，
> 于是序列化后再解析回来就落回 `narration`。表现是：演出段点「+ 分支」看起来加了一行，实际下一帧就变成旁白，
> 静默降级、零报错。
>
> 这不是标签层的问题，我因此**不在这轮动它**：修它要动 AXS⇄Instruction 的双向映射与 golden/往返测试，
> 是主线创作路径上的一刀，半成品比不做更坏。登记为新任务（含上面这组实测数字作为复现证据）。
> #65 剩下的两处里，「分支选项」被这条堵住（没有 choice 行就没有那个组）；
> `NodeInspectorPanel:336` 的「分支标签」在连线检查器里，需要选中一条出边才能显形，与本条无关，可单独推进。

> **更正（2026-09-30）**：上述“choice 在 AXS 中没有行语法”的诊断不准确。`packages/axs` 已支持 `> 选项 -> Beat`；真实缺陷是打印器把内部目标 ID 原样写进 AXS，且空标签 `>` 被 parser 当成旁白。现已修复目标 ID→Beat 标题映射与空选项解析。新增 E38 验证 choice 可见、选项文本/跳转控件有可访问名称；标签豁免基线已归零。

> **新门禁 `check:labels`：把 #65 的成果钉成棘轮（2026-09-29）**
>
> 十三个点的标签关联工作不该靠人记住。`scripts/check-label-association.mjs` 扫 `apps/web/src/**/*.tsx`
> 的每个 `<label>`，三档都算合法：① 开始标签里有 `htmlFor`；② 开始标签里有 `id=`（命名分组那一档，
> 配套 `aria-labelledby` 在祖先上）；③ `<label>`…`</label>` 之间就包着控件（包裹型）。
> 三档都不满足就必须出现在 `scripts/label-association-baseline.json` 的具名豁免里，
> 基线现在恰好两条：`ScriptEditor :: 分支选项`（被 #68 堵住）与 `NodeInspectorPanel :: 分支标签`。
> 新增一处未具名 → 退出码 1；修掉一处而基线没删 → 打印"基线里有 N 条已经不存在"提醒删。
> 它已并入 `pnpm gates`（现在共十道），`package.json` 有 `check:labels`，README 的脚本表同轮补了行。
>
> 三条腿都验过，不是"写完就当它有效"：
> ① 该拦——在建角色页临时插一个裸 `<label>闸门探针字段</label>`，退出码 1 且点名到
>    `AnchorEditor.tsx :: 闸门探针字段`；② 该放且清得干净——还原后 `扫描 144 个文件：裸标签 2 处，基线允许 2 处 / OK`，退出码 0；
> ③ 它顺手抓到一次我自己的回归：还原探针时我用了**修复之前**的备份，等于把 `AnchorEditor` 的 `htmlFor` 又抹掉了，
>    门禁立刻红——用 `git checkout --` 回到 HEAD 后才绿（同一类错误第二次犯，见记忆里第六十四条）。
>
> 局限要说在前面：它量的是**形状**，不是"读屏真的念得出"。形状合法但指向错 id、或分组名字算错，
> 仍然要靠 E17/E25/E27/E30/E31 那些 exact 可访问名判据。两道互补，缺一不可。

> **新门禁 `check:dispatch`：分派口不许再有"只走云端"的函数（2026-09-29，S13-6 的前置）**
>
> 起因是给 S13-6 数一遍剩余本地化缺口：`scripts/check-dispatch-local.mjs` 扫
> `apps/web/src/shared/storage/` 的 `*Saves.ts` 与 `assetPool*.ts`，**4 个文件、26 个导出 async 函数，
> 全部都有本地分支**（0 处云端专属、0 处 stub；唯一的 `throw` 在 `projectSaves.createProject` 里，
> 那是写入失败上报而不是"未实现"）。既然今天就是零，这道门就不放豁免清单，新增一处云端专属直接失败。
> 意义：桌面唯一化之后，一个只走云端的函数不会报错，只会让用户点了没反应——正是本仓反复强调的
> "不许留点进去报错的入口"这类缺陷的成因。
>
> 三条腿：基线绿（26 个全过）→ 往 `assetPoolSaves.ts` 追加一个没有本地分支的导出函数 → 退出码 1
> 且点名 `__probeCloudOnly` → `git checkout --` 还原后再绿。
> 已并入 `pnpm gates`（共十一道），`check:dispatch` 与 README 同轮补上。
>
> 一条自我修正：我第一遍统计用的是 Python 扫描，得出"38 个函数"——那是 `*Saves.ts` 与 `assetPool*.ts`
> 两个 glob 让 `assetPoolSaves.ts` 被数了两遍。以 node 脚本的 26 为准，注释与文档都已按实测改。

> **#65 最后两处的可达性实测（2026-09-29 收尾，交接用）**
>
> - `NodeInspectorPanel:336`「分支标签」：**只有 `selectedEdge` 非 null 才渲染**。
>   实测挂载点四处：`CutStudioView.tsx:621` 与 `CutWorkspace.tsx:158` 把 `selectedEdge` **硬写成 null**
>   （剪辑台这条路永远打不开连线面板），真正能出连线面板的只有 `FlowWorkspace.tsx:69` 与
>   `FlowStudioView.tsx:166` 这条流程工作台路径。所以它的判据必须先去流程页选中一条边；
>   修法也不是命名分组——那一块下面是 chip 行 + 一个自由文本 `input`，该给 input 补 `htmlFor`。
>   我在收尾轮没启动它：需要新搭一条"进流程工作台 + 点中一条边"的路径，
>   半条 flaky 判据留在基线里比不做更坏。
> - `ScriptEditor`「分支选项」：被 **#68** 堵住（`choice` 指令在 AXS 写侧没有归宿，那一行根本不出现）。
>
> 这两处之外，`check:labels` 的基线就只剩这两条豁免；两条都做完后应当把它删空，让门禁归零。

> **#65 只剩一处：连线面板的「分支标签」改成命名分组（2026-09-29，E32）**
>
> 读代码定性命门：`selectedEdge` 在 `CutStudioView.tsx:621` 与 `CutWorkspace.tsx:158` 被硬写成 `null`，
> 剪辑/剧本两个模式永远打不开连线面板；只有「结构」模式（`ProjectEditorPage.tsx:127` 的
> `value="flow" / label="结构"`）经 `FlowWorkspace.tsx:69` 传真值。所以判据必须切模式再点一条边。
> 那一块下面的 `Input` 自带 `label="自定义标签"`，「分支标签」其实是章节标题——
> 正解是命名分组（`role="group"` + `aria-labelledby`，静态 id，因为面板同页只挂一个），不是 `htmlFor`。
> 新用例 E32：建工程 → 切「结构」→ 点第一条边 → `getByRole(group, name="分支标签")`；
> 变异摘掉 `role="group"` 红在这一行；全程零 `/api/v1`。
>
> `check:labels` 的豁免基线随之从 2 条收到 **1 条**（只剩 `ScriptEditor :: 分支选项`，被 #68 堵住）。
> 这里还修了分类器一个真实缺陷：它只认 `id={…}`，把静态 `id="…"` 判成违规——
> 命名分组的 id 可以来自 `useId()` 也可以是静态串。改完重跑基线，并再插一次裸标签证明它仍然有牙
> （红在 `AnchorEditor.tsx :: 分类器探针`，还原后绿）。
> 复跑：gates 0（十一道）/ e2e:desktop 28 passed / e2e 41 passed（57.0s）/ renderer 重建 0。

> **E33 · 手动存档槽位的写入 / 回读 / 删除（2026-09-29）**
>
> E28 只覆盖了自动存档那一格。手动槽位走同一批分派函数但 `slot≠0`，删除（`clearSave`）更是另一条腿，
> 桌面此前都没有点击层证据。接在 E17 的播放链里：菜单 → 存档 → 点「存档 1」这张卡 → 重开菜单走「读档」
> → 该卡含「离线路上的第一句」→ 删除 → 该卡回到「— 空槽 —」。
> 完成屏障是应用自己给的：`manualSave` 等 `writeSave` 返回 ok 才关面板，而重开面板必然再走一次
> `listSaves`，所以「回读」量的是存储不是本页 state；删除后面板自己 `refreshSaveSlots`。全程零定时等待。
>
> 两次单摘变异各红在自己的断言行：把 `manualSave` 里的 `writeSaveSlot` 换成伪造 ok → 红在
> 等不到「离线路上的第一句」；把 `deleteSaveSlot` 里的 `clearSaveSlot` 换成伪造 ok → 红在等不到「— 空槽 —」。
> 顺带一条定位器教训（第一版就栽了）：想用 class 把卡片框出来（`div.relative.overflow-hidden`）
> 会捞到外层容器，结果点在 HUD 的「创作者」按钮上等稳定性等到超时；改回用槽位自己的可访问名
> （`getByRole(button, name=/存档 1/)`）才对。另一次是 M14 的第二次改动写坏了语法，
> 两次跑红在同一行——那不算两条判据，重做了一次才算。
>
> 顺带量到一条事实：`从头开始`（`restartFresh`）会清掉**全部**存档槽，不只是自动那一格——
> 这也是 E33 进面板时六格都显示「— 空槽 —」的原因。要不要收窄成只清自动槽，属 #66 那一条一起定档。

> **E34 成就写侧的存储回读 + `check:dispatch` 补作用域（2026-09-29）**
>
> 成就面板此前在桌面只有"点得开、字段有名字"的证据（E17 那一跳），写入是否真落库没有判据。
> 补上：改标题是「输入即保存」（onChange 里 `await updateAchievement` 再 refresh），
> 于是**关掉面板再重开**就是一次真正的存储读（`listAchievements` 在挂载时跑），
> 判据取重开后那个输入框的 value。变异把 `updateAchievement` 调用拿掉后红得极干净：
> `Expected: "离线路标" / Received: "新成就"`——读回来的是库里那条默认标题，
> 正说明这条判据量的不是我刚才打过字的那个 DOM。
>
> `check:dispatch` 也补了一处我自己的作用域漏洞：它原先按 `<域>Saves.ts` 命名扫，
> 而成就域叫 `achievementDefs.ts`（已知偏差），没进扫描面。加进来后
> **5 个分派口文件 / 30 个导出 async 函数**全部有本地分支（原先报的 26 个是少数了 4 个）。
> 刻意不扩到 `http*` / `tauri*` / `index.ts`：那是单一后端的实现侧与 Provider 工厂，
> 要求它们"有本地分支"是范畴错误——门禁作用域错比的漏更贵。
> 复跑：gates 0 / e2e:desktop 连续两次各 28 passed / e2e 41 passed / renderer 重建 0。

> **E35 · Discover 入口闸门收进组件，并留下 S13-3 的实测清单（2026-09-29）**
>
> 一处真实的不一致（我自己 grep 复核过，不是听来的）：同一个 `<DiscoverBrowseLink>`，
> `ProjectListPage.tsx:154` 用 `{!localOnly && …}` 挡住了，而 `ItemsPage.tsx:147`、
> `SceneAssetsPage.tsx:138` 没挡——桌面上这两页挂着通向 `/discover` 的入口，
> 而 `/discover` 在桌面是**显式缺席**（`DiscoverPage.tsx:49` 的 `isLocalOnlyDeployment()` 分支）。
> 修法是把闸门收进组件本身（唯一权威），并删掉调用点那份重复判断；
> 判据 E35 两半都测：浏览器态两页都看得到这个入口，桌面态两页都是 0。
> **这条判据差点是假绿**：第一版桌面那一半只断 `toHaveCount(0)`，摘掉闸门后仍然全绿——
> 因为那一页没渲染到工具条也会得到 0。补了同页的正控（`新建道具` / `新建场景` 按钮可见）之后，
> 再摘闸门才红在 `Received: 1`。「入口与目标同生共死」这条不变量从此有了牙。
>
> S13-3 判死清单的输入（**我自己复核过的**：`ProfilePage.tsx`、`AuthorPage.tsx` 两文件内
> `isLocalOnlyDeployment|isTauriEnvironment|localOnly` 命中数都是 0，即这两个页面整体没有桌面闸门；
> 下面的具体调用与行号是子代理扫描报告，我未逐条复核，采纳前需再验）：
> - `/profile` 的 6 个动作（头像、昵称、绑定邮箱、邮箱恢复身份、导出数据、注销账户）都直连 `userApi`；
>   注销那条的 catch 分支仍会清本地身份并 reload。路由在 CLEAN_ROUTES 里＝装载零请求，但**点击没测过**。
> - `/author/:id` 整页走 `creatorApi.hub` / `setFeatured` / `projectApi.fork`，且没有 `DiscoverPage` 那道闸门；
>   `UserAccountMenu.tsx:73` 的「我的主页」在桌面 `profile` 恒 null → href 落成 `/author/`（空 id）。
> - `/discover/*` 的五个详情页与评论区（`DiscoverCommentSection`）没有桌面闸门，只能 URL 直达；
>   `PlayerPage.tsx:813` 与 `:916` 有两处「去发现更多」链接常驻在播放错误态/续玩屏上。
> 这些要不要摘、摘成"显式缺席"还是干脆删页面，都是 S13-3 的定档范围——我按纪律只把清单量出来，不替它决定。

> **E36 · 账户设置页在桌面换成显式缺席（2026-09-29）**
>
> `/profile` 那六个动作（头像 12 个 emoji、保存昵称、绑定邮箱、邮箱恢复、导出数据、注销账户）
> 全部直连 `userApi`，没有任何本地替身；桌面离线态点了只会把 catch 吞成一句「操作失败」。
> 注销那条更糟：它的 catch 分支仍会清本地身份并 reload。E14 那条路由级判据只能证明
> **"装载零请求"，证明不了"没有可点的死入口"**——所以补 E36，两半都测：
> 浏览器态 `保存昵称`/`导出我的数据` 可见（同页正控，防的是"整页被删也照样绿"），
> 桌面态只剩「当前身份」+「账户设置需要协作服务」且两个按钮为 0、零 `/api/v1`。
> 变异把闸门条件换成 `false` 后红在等不到那句缺席说明。文案与组件都用既有的 `CloudFeatureNotice`，
> 不新造第二套缺席口径。
>
> 两条我自己的错，都被判据/编译器抓回：
> ① 先写成 JSX 子位置的三元 `isLocalOnlyDeployment() ? (…) : (…)` 却没裹花括号 →
>    `tsc` 直接报 `TS1381 Unexpected token`（与本文件里"JSX 子位置裸写块注释"同一族）；改成早退 `return`；
> ② E36 第一版红了，但**不是产品缺陷**：`hits` 没在两半之间清零，浏览器那一半本来就该发
>    `/api/v1/users/session` ×2，我把测试自己的账算到了桌面上。加一行 `hits.length = 0;` 才绿。
>
> 复跑：见本段末尾的串行数字。S13-3 清单里还有 `/author/:id`（整页云端且没有 `DiscoverPage` 那道闸门）
> 与 `/discover/*` 五个详情页（只能 URL 直达）没动——那两个要不要一起收成缺席，等你的定档。

> **E37 · 账户菜单里的「我的主页」在桌面不再给（2026-09-29）**
>
> 又一处已验证的死入口：`UserAccountMenu` 的这条链接是 `routes.author(profile?.creator_id || "")`，
> 而桌面态 `profile` 恒 null → href 落成 `/author/`（空 id），目标页整页要协作服务、
> 且没有 `DiscoverPage` 那道 `isLocalOnlyDeployment()` 闸门。同文件同组件里「发现」与
> `GlobalSearch` 早就用同一个约定挡了——这两条是漏网，不是新决策。
> 顺手给触发按钮补了 `aria-label="账户菜单"` 与 `aria-expanded`：它此前只有会变的 displayLabel
> 当可访问名，既不好读屏也没稳定定位器。
>
> 判据两半都测，桌面那一半先断「账户设置」可见再断「我的主页」为 0——
> 菜单没渲染同样会得到 0，那是假绿（E35 刚栽过一次，这次把正控写在前面）。
> 变异把闸门打穿成 `{true && (` 后红在 `Received: 1`。
>
> `/profile` 里剩下的那条「账户设置」入口保留：它现在落到 E36 的显式缺席页，是有信息量的页面而不是死链。
> `/author/:id` 整页要不要一起收成缺席，仍属 S13-3（预备清单已在上面）；`/discover/*` 五个详情页
> 自 E35 之后桌面已无导航路径，只能 URL 直达——这层要不要连路由一起摘，也等同一句定档。
> 顺带一条自己造的坑（桌面套件当场抓到）：给触发按钮补 `aria-label="账户菜单"` 之后，
> E17 在播放器里点 HUD 的「菜单」变成 strict mode violation——Playwright 的名字匹配**默认子串**，
> 「账户菜单」里含「菜单」。改成 `{ name: "菜单", exact: true }` 才对（两处）。
> 也就是：新加一个可访问名，可能会撞上既有测试里那些不 exact 的定位器；这条已经进记忆。
> 修好后串行复跑：gates 退出码 0（十一道）/ `pnpm e2e:desktop` 连续两次各 **31 passed** /
> `pnpm e2e` **44 passed**（约 1.0m）/ renderer 重建 0。桌面基线从 30 到 31，浏览器从 43 到 44。

> **`check:dispatch` 从"提到本地"收紧成"本地那一支真干活"（2026-09-29）**
>
> 原来的判据只看函数体里出现过 `isLocal()`——一个"本地分支直接 return 一个 ok 对象"的桩也能过。
> 收紧成三档合法，缺一即失败：**①** 本地那一支 `await` 了 provider（`p.xxx()` / `Deps.provider()`）；
> **②** 或经同一批分派口里的兄弟函数间接分派；**③** 或返回**登记过的** `skipped-offline` 显式跳过
> （跨作品 Codex 那条就是③：没有本地表，如实标 skipped，而不是发一条注定失败的请求再 `.catch(()=>{})`）。
>
> 复扫时②与③各捞到真实用例：`searchImportItems` / `searchImportScenes` 走 `readItems` / `readScenes`（②），
> `readCodex` / `syncCodex` 走③——**这四处不是缺陷**，我逐条读了函数体才定性；
> 若不核对就加"必须有 provider 调用"这一条，门禁会把它们误杀（过宽的 fail-closed 比没门禁更贵）。
> 30 个导出函数在新规则下仍全绿；插一个"本地分支返回 `{ok:true}` 不调 provider"的桩，门禁退出码 1
> 并点名那个函数；删桩后回到退出码 0。
>
> 复跑：gates 0（十一道）/ e2e:desktop 31 passed / e2e 44 passed / renderer 重建 0。

> **`check:labels` 的第二档从"挂了 id 就算"收紧成"确有 aria-labelledby 指到它"（2026-09-29）**
>
> 原判据 `/\bid=\{?["\w]/` 只问"这行有没有 id"，不问"有没有人引用它"——
> 给裸 `<label>` 随手加一个 `id="x"` 就能把门禁哄过去，而读屏仍然念不出分组名。
> 现在第二档要求同文件里存在指到该 id 的 `aria-labelledby`，三种写法都认：`="x"` / `={x}` / ``={`x-${i}`} ``。
>
> 第一次收紧跑出了 **3 处假阳性**（`ConditionSimulator` 模拟变量、`ConditionEditor` 触发条件、
> `EffectEditor` 完成效果）——它们用的是 `aria-labelledby={groupId}`（花括号无引号），
> 而我的正则把引号写成了必需，于是把合法代码判成违规。判据崩在合法输入上比没判据更贵，
> 所以先把三处的真实写法 grep 出来核对，再改正则；改完 144 个文件、4 处 id 档全绿、基线仍 1 条。
>
> 双向证据（临时探针 `apps/web/src/__labelgate-probe.tsx`，测完已删）：
> 注入①无 htmlFor/无 id/不包控件的裸标签 与 ②挂 id 无人引用的假分组 → 退出码 1，两条都点名且各自给出原因；
> 把同一份探针换成合法形状（htmlFor+input、`role=group`+`aria-labelledby={groupId}`、字面量 id 三种）→ 退出码 0。
> 也就是这条判据能区分好坏，不是"新文件一律红"。

> **收尾自查抓到两处"文档替门禁代言"（2026-09-29）**
>
> **一、README 的 `pnpm gates` 那一行还写着九道链。** 它逐项列了 tsc→vitest→coverage→lint→纯净度→循环→
> 行数→对比度→ui-source，却没有今天新加的 `check:labels` 与 `check:dispatch`——
> 门禁已经生效而用户文档仍在描述旧门禁，这正是"文档不许替门禁代言"要防的形状。
> 已按 package.json 的真实顺序补成十一道（脚本表里那两行本来就有，漏的是总链那一行）。
>
> **二、脚本注释里的基线数字是旧的。** `check:dispatch` 头写着"4 个文件、26 个函数"（实测 5 / 30），
> `check:labels` 头写着"#65 还剩两处"（实测只剩一处）。数字要由命令产生，注释里的历史数不会自己更新。
>
> 同时把两道门禁**各自漏掉的形状写进脚本头**，不留"看起来它什么都管"的印象：
> `check:dispatch` 的证据取自"分派判定之后到函数末尾"，所以"本地分支是空桩 + 同一函数云端分支真调 provider"
> 这种混合形状仍会过（要收紧得先做块级配对，本轮没做）；`check:labels` 是文本级判据——认同文件里出现过
> `aria-labelledby`，不校验它是否在祖先链上，跨文件引用会被误判成假分组。
> 复跑：两道门禁退出码 0（labels 扫 144 文件 / 1 处豁免，dispatch 5 文件 30 函数全绿）。

> **`check:labels` 的作用域从 `apps/web` 扩到三个界面层（2026-09-29）**
>
> 这条棘轮原先只扫 `apps/web/src`，而同一套表单语义还有两个界面层在用：`apps/admin`（中台）与
> `packages/ui`（共享组件库，web 与 admin 都从它取 Input/Select）。"门禁作用域要匹配界面语汇"这条
> 以前是对 e2e 说的，对静态棘轮同样成立——只在 web 里成立的规则，下一个裸标签写进 admin 就没人管。
>
> 先量再扩（不扩到未知语料上直接 fail-closed）：admin 20 个 tsx / 3 处 `<label>`（htmlFor 1 + 包裹型 2）、
> `packages/ui` 40 个 tsx / 6 处，两处**判为裸的都是 0** ⇒ 扩面今天零代价。
> 扩完实测 204 个文件、基线仍 1 条豁免。牙在新增那一半单独验过：往 `apps/admin/src` 插一个裸 `<label>`
> 探针 → 退出码 1 且点名 `apps/admin/...`；删探针回到 204 / OK。
>
> 复跑：gates 0（十一道）/ labels OK / dispatch OK。

> **收束：交接快照已立档（2026-09-29，边界 tag `desktop-wip-20260929bd` = `eddebeb`）**
>
> 新增 [HANDOFF](./HANDOFF.md)：登记边界与恢复点、四条腿实测、Phase 13 清单的机械读法、
> **待决项按「谁能推进」分档**（等你一个词 7 条 / 等真机人工 3 条 / 属中台那条线 7 条）、禁区八条、
> 以及两道新门禁各自的漏检。这份宪章仍是执行权威，那份是快照——冲突时以本文件与 ADR-029 为准。
> 四条腿在 `eddebeb` 上实测：`pnpm gates` 0 / `pnpm e2e:desktop` **31 passed**（1.4m）/
> `pnpm e2e` **44 passed**（1.0m）/ `pnpm check:desktop`（cargo）0。
> 最后一遍扫描的实态：工作区除那两条受保护的 ` M` 与未纳管的 `Clearance/` 之外无残留，
> `.e2e-lock` 不存在（没有遗留锁），本轮所有临时探针文件均已删除后才取的数。
> 收束判断：**剩下的没有一条是缺技术信息的**——普查三轴（数据通路 / 入口在场 / 导航出口）都已穷尽，
> 缺的是 ADR-029 那几条判断与一次真机时段。所以这条线在这里停车，不再自开新切片。

> **choice 的同名消歧：落地 #68 时漏掉的一半（2026-09-30）**
>
> #68 把分支写进 AXS 文本后，choice 目标在文本层用 **Beat 标题**。标题不唯一时这条引用就不可寻址：
> 解析侧 `assignBeatIds` 给同名 Beat 的 id 是 `开场` / `开场-2` / `开场-3`，而打印侧无条件输出裸标题，
> 于是**指向第二个「开场」的分支回读后静默落到第一个**。这比原缺陷更坏——原来是选项丢失，现在是改指他处，
> 而且不报错、不产生诊断。
>
> 修法把契约收成一条：**beat 模型里 `options[].to` 存 beat id，标题映射只发生在打印那一刻**。
> ①`print.ts` 的 `idToTitle` → `idToBeatRef`：目标标题在同名序列里排第二及以后时，输出与解析侧同一序号规则的
> `标题-2`；②`projection/axs.ts` 的 legacy 投影撤掉「提前换成标题」那步（它会让 `to` 变成标题、
> 绕过消歧并丢掉节点 id），`titleByNodeId` 整条 plumbing 一并删。
> 判据先红后绿：axs roundtrip 新增两条（红时的 Received 是 `> 向东 -> 开场`）+ editor-core 投影一条；
> 顺手把「裸同名标题按出现顺序指向第一个」也钉成断言（这是我一开始想报诊断的那条——查了 `assignBeatIds`
> 之后承认它是既有规则的另一半而不是缺陷，所以改成钉规则，不写会误报的门禁）。
> 用户文档同轮补了这条规则（`docs/user/writing/axs-syntax.md` 的「选项与跳转」）。
> **仍欠**：把 AXS 文本 apply 回草稿时同名 Beat 会塌到同一个节点（`document.ts` 的 `titleToId` 第一个同名赢），
> 登记为 #69，判据形状写在单里。
>
> 同轮清了交接文档 §5 的四项技术问题（文件尾空行 / `ports.mjs` 缺类型面导致 `build:admin` 红 /
> 两条既存 lint warning / `.dmg` 打包），并把 web 的 lint 翻成 `--deny-warnings` 当地板。
> `.dmg` 这次跑通且 `hdiutil verify` 校验和 VALID，但**上次失败的根因未复现、仍未归因**，
> 所以这条只算「当前能出可用 DMG」，不算交付验收。
> 复跑：`pnpm gates` 退出码 0（十一道；单测 497 passed + 1 skipped，axs 41 / editor-core 155）/
> `pnpm e2e:desktop` **33 passed** / `pnpm build:admin` 0 / `pnpm --filter @axiforge/web build` 0。
> 按 §7 的硬限制，本轮**未提交、未推送、未改 tag**；在飞的改动仍留在工作区。

> **#69 清偿：同名 Beat 在 apply 回草稿时塌成一个节点（2026-09-30 同日续做）**
>
> 现场：`axs.import` 解析出的 beat id 是 slug（`开场` / `开场-2`），而 id 解析链是
> 「UUID 形式的 beat.id → 按标题复用既有节点 → idGen()」。草稿里已有一个标题「开场」的节点时，
> **两个同名 beat 都命中同一个既有 id**，`nodes.set(resolved, …)` 让后一个覆盖前一个——
> 两个桥段塌成一个节点，且没有任何报错。这与 #68 是同一条根因的两半：#68 修的是**写出去**的文本，
> 这条是**读回来**的图。
>
> 判据先行：`document.test.ts` 新增「同名 Beat 不塌成同一个节点：第二个同名必须拿新 id」，
> 改代码前红在 `expected 1 to be 2`（节点图上只剩一个「开场」）。
> 修法把契约收成一条：**一次导入里一个节点 id 只许被消费一次**——第一个同名仍复用既有节点身份
> （上一条用例钉的「Writer 重复保存不换 id」语义不变），第二个起走 `idGen()`。
>
> 顺带按门禁给的处置还了一笔债：改完 `document.ts` 436 > 棘轮 432，`check:size` 的红写的就是
> 「按域外提成协作模块，不要在文件内继续堆」。于是 `axs.import` 整段（含 `gridPosition` 与
> `beatToNarrative`）外提成新模块 `axsImport.ts`（107 行），`document.ts` 降到 **363 行**，
> baseline 里那一行随之删除（回到默认 400 硬线）、`ScriptEditor` 一并收到 512。
> 外提时刻意**不反向依赖 L2 文档模型**，避免 `check:circular` 亮。
>
> 还抓到一条门禁自身的缺陷：`check:purity` 按文本扫 `/\bdocument\./`，被我注释里那句
> 「从 `document.ts` 外提」喂了一口——**负向文本守卫会被自己解释缺陷的注释喂饱**（同类第二次）。
> 处置不是给注释加 `purity-allow`（那是把守卫关掉），而是让**纯注释行不参与扫描**：这条门禁管运行时依赖，
> 注释里的文件名不是依赖。三条腿实测：代码行 `export const b = document.title;` → 退出码 1 并点名该行；
> 同样内容写进 JSDoc（`//`、`*`、`/*` 开头）→ 退出码 0；删探针 → 40 文件 0 违规。
> 行尾注释仍会计数，这条局限写在脚本里（宁可误报也不放宽代码侧）。
>
> 复跑：`pnpm gates` 退出码 0（十一道；editor-core 154 → **156 passed**，lint 0 warning，
> 纯净度 40 文件 0 违规，循环依赖 0）/ `pnpm e2e:desktop` **33 passed**（1.4m）。
> 本轮仍未提交、未推送、未改 tag；`packages/editor-core/src/axsImport.ts` 是新文件，提交时要显式 add。

> **Phase 0 改语义的连带核对：CI 引用、`build` 的祈使句、以及一条我记错了的前提（2026-09-30 第三次续做）**
>
> 这一串不做就没人做：Phase 0 把根 `pnpm build` 的含义从「构建 web」改成「打桌面 `.app`」，
> 语义一改，所有按旧含义写的调用点都变成静默陷阱。逐类核了一遍：
>
> **① CI 的命令引用（可静态核对的部分）。** `.github/workflows/ci.yml` 本轮已被改成
> `pnpm build:web && pnpm build:admin`（因为裸 `pnpm build` 现在会去跑 Tauri 打包）。
> 用命令把 yml 里出现的每个 `pnpm <脚本>` 对 `package.json.scripts` 比一遍：`build:admin` / `build:web` / `e2e` / `gates`
> 全部可解析（`install`/`exec` 是 pnpm 内建，不是脚本）。**远端跑没跑通仍不可观测**，这里只证「引用不错」。
>
> **② 一处文档祈使句失效并已修。** `docs/design/v0.9-baseline/README.md` 的复现步骤写着
> `rm -rf apps/web/dist && pnpm build`——照今天这份含义执行会去跑一次 cargo 打包而且产不出 `apps/web/dist`。
> 已改成 `pnpm build:web`，并在原地留一条带日期的更正说明「当年写的是 `pnpm build`」，不把历史改写成没发生过。
> 其余 `pnpm build` 出现处逐条判定过：`README.md` 的两行、本文件 116/122 是新语义，正确；`docs/archive/**` 是归档记录，不动。
>
> **③ 我的一条在册前提是错的。** 我此前（也写进了 BLUEPRINT v1.6 那条）核实为「仓库从来没有 web 部署管线——无 Dockerfile/vercel/netlify」。
> 实测：根目录 `vercel.json` 是 **tracked 的，自 v0.1（`956497b`）就在**，声明 `@vercel/python` 入口 `backend/src/main.py`
> 与 `@vercel/static-build`（`apps/web/dist`）。而 `backend/src/main.py` **不存在**（真实入口 `backend/app/main.py`，
> `backend/main.py` 是兼容 shim）⇒ 那份配置按今天的仓库状态**构建不起来**。
> 所以：结论「去掉 web 不是下线一个在跑的服务」仍然成立，但依据要换成这条实测；
> 「是否曾真的连接过 Vercel 项目」属远端集成，本会话不可观测，不下判断。
> README 原来把这份配置当可用部署路径写（「部署前设置 `DATABASE_URL`」），已改成上述实测口径，
> 并把「Legacy Web / API」那句里的 Vercel 从可用调试手段中摘掉；`vercel.json` 的处置（删 / 修入口 / 留作文物）归入 S13 待决清单，不自己拍。
> BLUEPRINT 那条历史记录按「更正单列一刀」的做法补了带日子的批注，不改写原文。
>
> 顺带一条判据教训（已进记忆）：**「从来没有 X」这类缺失断言必须按具体文件名逐个 `ls`/`git ls-files` 过一遍**，
> 我那次是从「没有 Dockerfile」外推出的结论，`vercel.json` 恰好不在我列举的那三个里。
>
> 复跑：`pnpm gates` 0（十一道）/ `pnpm e2e:desktop` 33 / `pnpm e2e` 46 / `pnpm typecheck` 0 /
> > web 与 admin 构建各 0（web 构建的 `INEFFECTIVE_DYNAMIC_IMPORT` 计数 0）。本轮同样未提交、未推送。

> **两处「差点就做」的判断，理由记下来（2026-09-30 第四次续做）**
>
> **① 端口表的三处 JS 侧散写，本轮不合。** 实测还剩这些地方硬写着 `5174`/`8000`：
> `playwright.config.ts`（baseURL、webServer 的 url 与 `--port`，共 4 处）、`playwright.desktop.config.ts`（2 处）、
> `scripts/desktop-http-inventory.mjs`（BASE，1 处）；`backend/app/config.py` 的 CORS 是第六处（Python，随 S13-6 退场）。
> 看着就该并进 `scripts/ports.mjs`，**但那条 import 在 CI 上会炸**：CI 的 `setup-node` 钉的是 **Node 20**（本地是 26），
> 而 Playwright 的 `.ts` 配置是被转成 CJS 加载的——`import … from "./scripts/ports.mjs"` 会落到 `require()` ESM，
> Node 22.12 之前直接 `ERR_REQUIRE_ESM`。也就是说这份改动会在**我看不见的地方**变红、在本地全绿。
> 真要合，得把真相源下沉成 `ports.json`（CJS/ESM 都能读），`ports.mjs` 只做派生视图；
> 这属于 S13-7「消双通路」那一刀的配套，不是现在顺手能签收的事。别用「本地跑过了」替远端背书。
> > **更正（同日第十三次续做，实测后写）**：这一段的**结论对，归因错**。把 `import "./scripts/ports.mjs"` 真加进
> > `playwright.desktop.config.ts` 后，在本机三个 Node 上逐一跑 `--list`：**20.20.2 红**（`ReferenceError: exports is not defined in ES module scope`）、
> > **22.14 红**（`ReferenceError: exports is not defined`）、**26.7 红**（`SyntaxError: Cannot use 'import.meta' outside a module`），退出码都是 1。
> > 报的法子随版本不同，但**没有"本地绿、CI 红"这一回事——三个版本都红**。所以当时那条"CI 钉 Node 20 才危险"的顾虑
> > 是被高估了；真正的机制更简单：Playwright 的 `.ts` 配置走 CJS 转译，掺进 ESM 依赖就混不合格式而炸。
> > 之所以仍然值得记下来：**"看不见的远端"不是不去测的理由**——本地就装着 20/22/26 三个版本，一次 `PATH=… node … --list` 就能把猜测变成数。
> > 那一轮把它写成"机制风险"而没有去测，本质是把**没跑的对照组**当成了结论。真相源已按这里给的解法在同日下沉成 `scripts/ports.json`（见第十二次补记）。
>
> **② `.dmg` 上次失败的两条猜测都被证伪。** (a)「残留的 `rw.9752.*.dmg` 挡住了下一次建卷」——不成立：
> 本次成功的那一轮，那个 42 MB 中间件**全程在场**。(b)「Finder AppleScript 被 TCC 拒了」——也站不住：
> `osascript -e 'tell application "Finder" to get name of startup disk'` 现在答得上来。
> 脚本 `set -e` 下真正会死在这两处（`hdiutil detach` 重试、Finder 定制窗口），但**没有一条被复现过**，
> 所以 §5 里这条继续按「未归因」挂着，别写成结论。
>
> **③ 同名消歧的对称面补了一刀判据。** 显式跳转行 `-> 标题-2` 与选项行共用 `titleToId`，
> 今天只给选项行加过用例，跳转行没有。补 `roundtrip.test.ts` 一条（axs 41 → **42**）：断言它解析到第二个桥段、
> 无诊断、且打印时不回退成裸标题。这条一上来是绿的，所以按规矩验了牙——
> 把解析侧的 slug 回退那行拿掉后 **2 条同时红**（选项那条 + 跳转那条，报 `选项目标未找到: 开场-2`），
> > 还原后回到 42 passed；「裸同名指向第一个」那条在变异下仍绿，说明它钉的是另一条规则而不是运气。

> **同一个缺陷在主通路上的第二份实现（2026-09-30 第五次续做）**
>
> 查 Writer 保存到底走哪条路时抓到的：`useProjectEditor.saveWriter` 用的**不是**草稿事务 `axs.import`，
> 而是 `axsToSyncPayload → parseAxsToPlan`（`packages/editor-core/src/projection/axs.ts:170`）——
> 也就是说「AXS 文本 → 节点图」在这份代码里有**两套实现**。我在 #69 修的是其中一套。
>
> 另一套犯的是同一个错，而且后果更难看：`existingByTitle.get(beat.title)` 没有一次性消费守卫，
> 而它把结果 **push 进数组**（`axs.import` 那边是 `Map.set`，表现是一个节点被覆盖；这里直接发出
> **两个 id 相同的节点**，存储侧后写盖掉前写），顺带让邻接边两端解析成同一个 id → **自环边**。
> 判据 `parseAxsToPlan > 同名 Beat 不许共用同一个既有节点 id`：改前红在
> `expected ['existing-1','existing-1'] to deeply equal ['existing-1','gen-1']`（实测，不是推测）。
>
> 既然两套实现各自犯过一次错，就再加一条**配对判据**把它们钉在一起：
> `两条「AXS 文本 → 节点图」的通路守同一条 id 契约` 同时跑 `axs.import` 与 `parseAxsToPlan`，
> 断言两边都给两个不同 id、第一个仍复用 `keep-1`。牙重验过一次——把 `axsImport.ts` 的守卫去掉后
> **两条同时红**（这次是外提之后重验，外提前验过的不算数，因为代码已经搬过家）。
>
> **登记一笔债（别当成已完成）**：两套实现只是被同一条判据钉住，**没有合并**。
> 要合成一套（`axsImportDraft` 复用 `parseAxsToPlan`）得先核对两者的 `beatToNarrative` /
> `beatToNarrativeData` 是否逐字段等价——现在不一致，字段差异会直接改 Writer 的保存载荷，属主创路径，
> 归进 S13-7「一个功能只有一条数据通路」那一刀一起做，不顺手合。
>
> 复跑（同一代码状态，串行）：`pnpm gates` 0 / `pnpm e2e:desktop` **33 passed** / `pnpm e2e` **46 passed**。
> 仍按 §7 未提交、未推送。
>
> （上一颗的数字补记：单测 500 → **502 passed + 1 skipped**，editor-core 156 → 158。）

> **E39：给 Writer 主通路补上界面级判据——以及它第一版的假绿（2026-09-30 第六次续做）**
>
> 两处修复此前只有单元层证据。补一条点击层判据 `E39`：建工程 → 剧本轨写 AXS → 「保存剧本」 → **换页再进** →
> 断言重新投影出的文本里 `# 开场` 出现两次、两句话都在。CodeMirror 的可访问名是
> `textbox "AXS 剧本编辑器"`（`AxsCodeEditor` 用 `EditorView.contentAttributes` 挂的），
> 模式切换是 `SegmentedControl` 渲染的 `<button role="tab">`——**按 ARIA 角色定位是 `tab`，不是 `button`**，
> 第一版写成 `getByRole("button", { name: "剧本" })` 在重进那一步直接超时。
>
> **第一版的假绿更值得记**：改成 SPA 重进后它绿了，但我拿变异去验牙——把 `parseAxsToPlan` 的一次性消费守卫拿掉，
> **它照样 34 passed**。原因不是门禁失效，是**我的用例前提没够到缺陷那条分支**：
> 新建工程里没有任何叫「开场」的节点，`existingByTitle` 两次都取不到，两边直接走 `idGen()`，天然不塌陷。
> 塌陷发生在「工程里已有同名节点」的时候。改成两轮保存（第一轮存一个「开场」，第二轮改稿再加一个同名桥段）后，
> 同一处变异立刻红在该红的行：`Expected: 2 / Received: 1`——界面上真的少掉一个桥段。
> 还原后桌面 34 passed、浏览器 47 passed、`pnpm gates` 0。
>
> 另记一条通路事实：`?storage=memory` 的「换页再进」必须走 SPA 路由；整页 `page.goto` 会把模块态清掉，
> 回读到的是空白编辑器（第一次写这条用例就是这么踩到的）。既有 E24/E29/E33 用的都是 `link "剧本列表"` 那套。

> **E40：把「缺席」判据的另一半补上（2026-09-30 第七次续做，S13-2d 的 nexus 那条）**
>
> 交接文档 §3 与 S13-2d 都写着同一句：桌面侧「按钮不该在」由 E18/E20 断过，**浏览器侧「按钮应该在」一直没断言**。
> 这条缺口的后果不是"少一条测试"，而是**任何把 `NexusSendAction` 整块删掉的改法都不会被抓住**——
> 桌面那一半断的是 `toHaveCount(0)`，"组件不存在"与"组件被正确挡住"在它眼里是同一个状态。
> 补法沿用 E35/E36/E37 的两半写法（同一条用例里先跑浏览器态、清零 hits、再跑桌面态）。
>
> 牙不是假设：把闸门改成 `isLocalOnlyDeployment() || true`（浏览器态也返回 null）后，
> **E40 红在自己的 `toBeVisible()`，而其余 47 条全绿**——那 47 条里就包括只看缺席的那半。
> 还原后：`pnpm e2e` **48 passed**、`pnpm e2e:desktop` **35 passed**、`pnpm gates` 0。
> S13-2d 因此仍保持 `[~]`：五处待核里只剩 `PromptExport` 未接线（＝#60，等定档），
> 勾掉它需要的是那个决定，不是再写一条测试。

> **缺席断言的配对排查：12 条查完，补上 E41，也当场推翻了我自己一个结论（2026-09-30 第八次续做）**
>
> 顺着 E40 那一类做法把 `e2e/desktop-http.spec.ts` 里的 **12 条缺席断言**（`toHaveCount(0)`）逐条对了一遍，
> 规则是「每一条都得有另一态『它应该在』的配对判据」，否则"被闸门挡住"与"被删了"在测试眼里同形。
> 对完的结果：**工具条(E15)、我的主页(E37)、账户动作(E36)、Discover 链接(E35)、Nexus(E20+E40)** 都已有两半；
> 剩下的 `toHaveCount(0)` 不属于这一类——「离线路台」那条是**删除动作的回读**，`/\*` 那条是**渲染文本里不许出现注释符号**，
> 两者断的不是闸门。这一类因此在本文件内闭合。
>
> 顺手补了一条 **E41**：`LlmStatusBadge` 在浏览器态是只读徽标、**没有**配置按钮；桌面态那个按钮由 E16 覆盖。
> 但这里必须记一次我自己的错：**我最初的判断是"这条界面此前一条 e2e 都没有"，是错的**——
> 我只 grep 了 `desktop-http.spec.ts` 一个文件，而桌面侧四条判据住在 `e2e/llm-endpoint.spec.ts` 的 E16 里。
> 是变异把它推翻的：把 `LlmStatusBadge` 的桌面分支打穿（`if (false && desktop)`）之后，
> **E16 四条 + E41 一起红**。所以 E41 的真实价值不是"补空白"，而是补上**没被覆盖的另一半**（浏览器态不该有配置入口）。
> 教训入档：**断言"某处没被测"之前，grep 的对象是整个 `e2e/` 目录，不是单个 spec 文件**——
> 这条和"覆盖面按样本输入里的字段算而非测试条数"是同族，但更靠前：先要数对**测试文件**的集合。
>
> 还有一条没做完的：闸门点本身有 **14 个文件**（`grep -l isLocalOnlyDeployment() apps/web/src/**/*.tsx`），
> 两半都有人看着的目前只有其中约 8 个；剩下那几个（`StudioNavContent`、`VersionPanel`、
> `CreatorDashboardPage`、`DiscoverPage`、`UserContext` 等）要么由 E14/E15/E21 从数据面覆盖、要么根本没有桌面入口，
> **我没有逐个核过，不写成结论**。这一列清点记在 §6 的待核里，属于 S13-7 那一带的活。
>
> 复跑：`pnpm e2e:desktop` **36 passed** / `pnpm e2e` **49 passed**；`LlmStatusBadge` 变异残留计数 0。

> **闸门点 14 处全部定性完毕，补 E42；也记一次我自己重复犯的变异错位（2026-09-30 第九次续做）**
>
> 上一轮写下的「未逐个核过」这条现在核完了。`apps/web/src` 里 14 个用 `isLocalOnlyDeployment()` 的 `.tsx`，
> 按两半覆盖分档：
> **两半都有人看**——`ProjectListPage`(E15)、`ProfilePage`(E36)、`UserAccountMenu`(E37)、`DiscoverBrowseLink`(E35)、
> `NexusSendAction`(E20+E40)、`LlmStatusBadge`(E16+E41)、`StudioNavContent`+`CreatorDashboardPage`(本轮 E42)；
> **数据面覆盖**——`UserContext`(E14/E15 零请求)、`VersionPanel`(查询 `enabled`，E21)、`CharacterDetailPage`(E21 传记 tab)；
> **无桌面入口，结构性不可达**——`DiscoverPage`（`/discover` 在册路由本身给缺席说明，E13/E14 看着落点）、
> `CreateCharacterPage`(E19 的显式缺席 toast)、`AppHeader`(「发现」链接与 `GlobalSearch` 由 E14/E15 的零请求 +
> E35 的组件级闸门覆盖入口本身)。清点方式：把闸门打穿成两态同名，看是哪几条红。
>
> **E42** 就是这次清点的产物：侧栏「概览」项浏览器态必须在、桌面态必须不在（正控用同栏的「剧本」），
> 且 URL 直达 `/studio/dashboard` 在桌面只渲染 `PageHeader 创作概览` + 「创作数据面板需要协作服务」，
> **不许**出现「加载数据中…」（那一句是浏览器态取数分支，桌面走到它就是在等一个不存在的后端）。
>
> **一次无效变异，值得单独记**：我先把 `StudioNavContent` 的 `if (rail)` 那一支改成两态都隐藏，
> **37 条全绿**——不是判据失效，是**页面渲染的是非 rail 那一支**，我改了个不在热路径上的分支。
> 换成改实际渲染的 `{!localOnly && (` 之后，立刻红在 E42 浏览器那一行的 `getByRole('link', {name:'概览', exact})`，
> 而其余 36 条（含 E42 的桌面半）保持绿。这正是本文件早已写过的一条纪律（「变异要挑对当前渲染的分支」）——
> 我自己隔了几轮又踩一次。**判别式：变异后一条都没红，先怀疑变异落点，再怀疑判据**；
> 组件带 `rail` / 条件 JSX / 多返回分支这类结构时，先确认哪一支在渲染（红没红就是证据）。
>
> 复跑（全部在还原之后）：`pnpm gates` 0 / `pnpm e2e:desktop` **37 passed** / `pnpm e2e` **50 passed** /
> `git diff --check` 干净、`StudioNavContent.tsx` 与 HEAD 无差异、变异残留计数 0。

> **用户文档与行为对账：抓出一条"承诺了不存在的能力"（2026-09-30 第十次续做）**
>
> `docs/user/desktop/desktop-and-axsp.md` 的「桌面版目前没有的功能」里写着
> 「把道具挂进某一拍（道具引用还没有本地存储）…仍需要后端」。两句都不成立：
> ①**道具引用早就本地化了**（S13-2c 的 `project_asset_refs`，且 **E27** 在桌面点击层跑通"造道具 → 挂进工程 → 移除 → 换页回读"）；
> ②**「挂进某一拍」这个能力两端都没有**——本地表的列只有 `project_id / asset_type / asset_id / locked_version / …`（无拍、无节点字段），
> 云端 `httpAddAssetRef` 发的也只有 `asset_type` + `asset_id`；剧本指令集合里也没有 item 类 op。
> 所以这是**文档凭空承诺了一个不存在的能力**，并把已完成的那半说成缺失。
> 改法：把这条从"桌面缺失"清单里删掉，在「已知限制」里按实测重写——引用只到工程级、拍级绑定"尚未实现（要同时动数据模型、投影与试玩）"，
> 并顺手补齐清单里漏掉的三项缺席（Nexus 收件箱、「我的主页」与账户设置页的动作、AI 建档建议）。
> 这一类的判别式和门禁一样：文档说的"缺"必须能对上"某一端曾经有"，否则它就是**未实现**，不是**被裁掉**——
> 把未实现写成被裁掉，会让下一轮去找一条根本不存在的路径来"恢复"。
>
> 同轮把 §4「当前工作区状态」补成实测清单（那份文档原本只列到上一批改动，我这几轮的改动没进去），
> 用户文档改动不涉及门禁输入（六道 `check-*.mjs` 都不读 `.md`），故沿用上轮实测：gates 0 / 桌面 37 / 浏览器 50。

> **决策层与契约对账：两处 ADR 都没记下今天扩了的那条寻址契约（2026-09-30 第十一次续做）**
>
> 上几轮把用户文档、路线图逐条对着代码量了一遍；这轮把同一把尺子放到**第三层——决策层**。
> 判据是机械的：`grep -c "消歧\|同名\|序号\|标题唯一" docs/ADR/*.md` 里，今天两次修复（#68 打印侧丢指向、
> #69 导入侧 id 复用串号）所依据的那套规则，在 **ADR-016 与 ADR-027 里命中 0 次**。
> ADR-016 关于目标只有一句「`->` 显式跳转按标题解析为 edge」——这句话在标题不唯一时**没有判定权**，
> 而"没有判定权"正是那两个 bug 的根：文本层根本写不出"指第二个开场"，于是打印即换靶。
>
> 这一类的缺陷形态值得单独立一条判别式：**契约只活在实现层**。代码、测试、用户文档三方都按序号规则走了，
> 决策层却没有一条记录，等于把"这是契约"降级成"这是当前实现顺带的行为"。
> 下一轮想"简化" `print.ts` 的人看不出 `标题-N` 不是巧合而是与 `assignBeatIds` 咬合的必要条件，
> 把 `idToBeatRef` 改回裸标题不会撞上任何门禁——直到第三次静默换靶。用户文档写了怎么用、路线图记了做什么，
> 都不等于有人记着**为什么不许改回去**。
>
> 落笔内容（三方各就各位，没有新增第二真相源）：
> - **ADR-016** 新增「补记 2026-09-30」一节，把已生效的契约写成 6 条：①模型层存 id、文本层存可寻址引用、
>   映射只发生在打印那一刻；②id 由标题按出现顺序生成（第一拍裸 slug，其后 `标题-N`）；
>   ③解析次序（唯一命中→该拍；多命中→**确定性取第一拍**；无命中→退回 slug 查 id，序号别名在此生效）；
>   ④打印侧共用同一个序号规则；⑤不变量 `parse(print(g))` 靶心不变，同名是唯一定破坏者，失败模式一律静默；
>   ⑥消费侧 id 复用受"未被本轮用过"约束（`usedNodeIds`）。末了显式记一条**未清偿**：裸同名标题恒指第一拍
>   虽然可预测，但作者写错时没有任何提示，lint 诊断为欠账。
> - ADR-016 的「语法要点」补一条bullet指向该节，「质量要求」补一条：round-trip 必须覆盖同名的两种寻址形态且**双向各测一次**。
> - **ADR-027** 的方言对照表后加一条补记交叉引用——表格本身按决策时实态保留，不改写历史。
>
> 引用行号逐条 sed 复看过，不是凭记忆写的：`parse.ts:383-391`＝`assignBeatIds`、`:393-401`＝`titleToId`、
> `print.ts:70`（choice）与 `:222`（jump）都走 `idToBeatRef`、`usedNodeIds` 在 `axsImport.ts:81` 与
> `projection/axs.ts:183` 各一处、E39 在 `desktop-http.spec.ts:785`。
>
> **同一条尺子量到第三处：内核规约把两套实现画成了一行归宿。**
> `docs/KERNEL_DESIGN.md` §2.4 的迁移表写着 `axsToSyncPayload` → 「L3：`axsImport(source, roles)`」，
> 读起来像"这一条已经归一"。实态是两套并存：`axs.import` 走 `axsImport.ts:56` 的 `importAxsDraft`
> （`document.ts:355` 调用，操作 Draft 的既有节点集合），Writer 保存走 `projection.ts:96,102` 的
> `axsToSyncPayload` → `projection/axs.ts:170` 的 `parseAxsToPlan`（产出同步载荷，含边与 sort_order）。
> 这正是本文档末尾那句规矩要管的场景——「实现与本规约冲突时：要么改实现，要么回写本文并说明理由，不允许沉默漂移」，
> 所以按表内既有惯例补了一条 `> 状态（2026-09-30）`，写明两套各自在做什么、为什么不自作主张合并（语义不是逐字相同，
> 硬合会把两种语义拧成第三种），并把临时保险的判据指名到 `document.test.ts:385` 那条配对测试。
> **归并本身仍属 S13-7，等定档**——这一轮补的是记录，不是实现。
>
> 落笔时自己犯了一次引用错：先把配对判据写成在 `projection.test.ts`。那个文件里确实有一条同名 Beat 的断言（`:198`），
> 但它只测 `parseAxsToPlan` 单侧；跑两套实现的那条在 `document.test.ts:385`。**"文件里有这个词"不等于"这条判据在那个文件"**，
> 已改正。补记类文档最容易错的就是这一层——行号存在但指错了对象，比行号不存在更难被发现。
>
> 同一轮里还有两处初稿把"当前实现顺带的性质"写成了绝对保证，被代码本身驳回：
> ①「id 永远不被写进剧本正文」——`print.ts:155-156` 在 id 查不到 beat 时**原样返回 id**，悬空引用会进正文；
> ②「失败模式一律静默」——只有**换靶**是静默的，**丢靶**会由 `parse.ts:417` / `:436` 报 warning。
> 两条都改成"常规情形 + 例外 + 例外可见与否"的写法。这一类的教训不是"少写"，而是**下笔前把那句断言的反例搜一遍**：
> `if (!beat) return id` 这种兜底行就在被引用的函数里，读三行就能否掉一个全称句。
>
> 本轮只动 `.md`：六道 `check-*.mjs` 均不读 Markdown，故 `pnpm gates` **未重跑**（没有门禁输入变化）。
> 两半 e2e 各实跑一次以刷新 HANDOFF §5 的计数——`pnpm e2e:desktop` **37 passed**（1.6m）、
> `pnpm e2e` **50 passed**（1.1m，退出码单独取到 0）。第一次那条桌面跑用的是 `${PIPESTATUS[0]}`，
> 在 zsh 下取不到值（zsh 是 `$pipestatus[1]`），所以补跑浏览器那一半时才把退出码拿到——
> 「只看汇总行就当退出码 0」这条自己也犯过一次，记在这里。
>
> **同一把尺子量到第四处：退场前置那张体量表里的基线数字过期了。**
> `docs/WEB_SUNSET_RESTORE.md` 的「验收基线」一行还写着「3 个 spec、38 条用例」，那是搬家前的数字。
> 今天用 `--list` 量：浏览器态 **50 tests in 3 files**（`baselines` 13 + `desktop-http` 33 + `llm-endpoint` 4），
> 桌面态 **37 tests in 2 files**（`testIgnore: /baselines/`，零后端）。
> 意义不是数字变大，而是**第 1 问被换了**：原文问"要不要把桌面那半搬走"，实测桌面那半**早搬完了**，
> 删后端真正打掉的只剩 `baselines.spec.ts` 的 **13 条**——所以待决的是"这 13 条归谁"，不是"要不要保留后端当测试宿主"。
> **一份会被拿去支撑破坏性决定的检查单，数字过期本身就是风险**，所以按当前实态改在原表旁边，不另起文档。
> 顺带记一条 ID 漂移：上一轮补里写的「E29 场景池写侧判据」今天在 `e2e/` 里 **grep 不到**，
> 但那条写腿本身还在（`desktop-http.spec.ts:532-539`「建一条场景 → 换页再进 → 还在」，挂在 E17 链内）。
> 结论是**编号被并进了 E17 一族**，覆盖没丢。**引用测试编号前先 grep 证明它存在**——编号会被重组，标题与文件行号才是要引用的东西。

> **端口真相源下沉成 `scripts/ports.json`：把上一轮写下的"为什么没合"变成做完的一刀（2026-09-30 第十二次续做）**
>
> 上一轮留了一条判断：端口表在 `playwright.config.ts` 等 7 处硬写，看着就该并进 `scripts/ports.mjs`，
> 但那条 import 在 CI 上会炸——CI 钉 Node 20，Playwright 的 `.ts` 配置按 **CJS** 加载，`import "./ports.mjs"` 变成 `require()` ESM，
> Node 22.12 之前直接 `ERR_REQUIRE_ESM`，本地绿、远端红而远端不可观测。**同一条判断里已经写着解法**：真相源下沉成 JSON，`.mjs` 只做派生视图。
> 这一轮就是去执行那句被记下来的解法，而不是重新发明它。
>
> 做法与实测：
> - 新建 `scripts/ports.json`（四个数字，**未纳管，提交要显式 add**）；`ports.mjs` 改成 `readFileSync(new URL("./ports.json", import.meta.url))` 后派生
>   `origins` / `corsOrigins`。改动前后三个导出的值**逐字比对过**（`{api:8000,web:5174,admin:5175,nexus:5274}`、六条 CORS 来源不变）——
>   先证"没改行为"，再谈"改了结构"。
> - 消费侧 13 处改读真相源：`playwright.config.ts` 4（baseURL、`--port`、两个 `webServer.url`）、`playwright.desktop.config.ts` 2、
>   `e2e/helpers.ts` 1（`API` 顺手改成导出，`baselines.spec.ts` 那 5 处硬写的角色端点因此有唯一来源）、`e2e/baselines.spec.ts` 5、
>   `scripts/desktop-http-inventory.mjs` 1。收完再扫：**工具与 e2e 层 `5174`/`localhost:8000` 字面量 0 处**。
> - 两套 Playwright 配置都 `--list` 过（50 / 37，退出码 0），证明 JSON 在 Playwright 的转译路径下真能被加载——**这才是上一轮不敢动的那一环**。
> - 判据是双向的，不是"改完没红"：①把 `ports.json` 的 web 改成 5999 → `pnpm e2e:desktop` **37 passed**，
>   说明 vite dev server 与两套配置确实跟着这一份数字走（若任一消费点还硬写着 5174，探针就连不上而整批红）；
>   ②再把 `playwright.desktop.config.ts` 的 `webServer.url` 单独钉回 5174 → **1 failed**，报 `ERR_CONNECTION_REFUSED at http://localhost:5999/studio/projects`。
>   **一致→绿、偏离→红且点名端口**，这条重构才算有牙。两轮之后都还原了。
>
> 没做的部分与理由（写清，免得下一轮以为已全收）：`apps/{admin,nexus}/src/**` 4 处与 `apps/web/src/shared/storage/exportSeeds.test.ts` 1 处是
> `import.meta.env.VITE_*` / `process.env` 的**兜底默认值**（真要并得走 vite `define` 或注入环境变量，是另一刀）；
> `apps/nexus/electron/main.cjs`、`apps/nexus/scripts/dev.mjs` 2 处**本机起不了 Electron，改了无法验证**，不动；
> `tauri.conf.json` 的 `devUrl` 由 Tauri CLI 读，并进来需要一步生成流程；`scripts/kill-dev-ports.sh` 是"清掉相邻端口段"的工具，端口族本就比表里四个宽；
> `backend/app/config.py` 的 6 处 CORS 随 S13-6 后端退场消失。**"一个语义一处权威"要连剩余分母一起报，只报收掉的那 13 处等于没说清还剩多少。**
>
> 复跑（全部在还原之后）：`pnpm gates` 退出码 **0**（core 82 / axs 42 / editor-core 158 / web 181+1skipped / admin 39）/ `pnpm typecheck` 0 /
> `pnpm e2e:desktop` **37 passed**（1.7m，退出码 0）/ `pnpm e2e` **50 passed**（1.1m，退出码 0）。
> 一条过程记录：`e2e/helpers.ts` 的第一版我写成了自引用的废表达式（`API` 引用了还没声明的 `API_BASE_FROM_PORT`），
> 同轮内看回 diff 自己否掉重写——**typecheck 是在改正之后才跑的**，不是靠它抓到的。
> 本轮仍未提交、未推送、未改 tag（§7）。

> **给上一轮那条"机制风险"补上对照组（2026-09-30 第十三次续做）**
>
> 第十二次那一刀的理由是抄自更早一轮的判断：「`.mjs` 不能进 Playwright 的 `.ts` 配置，因为 CI 钉 Node 20、本地是 26，会 `ERR_REQUIRE_ESM`，本地绿远端红」。
> 这一轮发现**本机 `~/.nvm/versions/node` 里就装着 20.20.2 与 22.14**——那条说法从来不需要靠推断，跑一下就有数。于是把两头都跑了一遍：
> - **正向**（当前交付形状：两份配置读 `scripts/ports.json`）：`PATH=…/v20.20.2/bin node …/playwright/cli.js test --list` → 浏览器态 **50 tests in 3 files**、桌面态 **37 tests in 2 files**，退出码 **0**；Node 26.7 与 22.14 同样绿。
>   ⇒ CI 用的那一档（`ci.yml` 两个 job 都钉 `node-version: 20`）实测可用，**不再是纸面推断**。
> - **反向**（临时把 `import { origins } from "./scripts/ports.mjs"` 加进 `playwright.desktop.config.ts`）：
>   **20.20.2 → 退出码 1，`ReferenceError: exports is not defined in ES module scope`**；
>   **22.14 → 1，`ReferenceError: exports is not defined`**；**26.7 → 1，`SyntaxError: Cannot use 'import.meta' outside a module`**。
>   ⇒ 三个版本全红。所以"本地绿、CI 红"这个前提**根本不成立**——那条被引用的顾虑把结论蒙对了，但把机制说错了，而且说成了一种**不需要本地验证**的失败。
>
> 结论怎么写才算准：炸的**位置**随版本不同（有时炸在配置的 `exports`，有时炸在 `.mjs` 的 `import.meta`），所以不能报某一个错误码当"标准错法"；
> 稳的说法是「Playwright 的 `.ts` 配置走 CJS 转译，掺进 ESM 依赖就会混合格式炸，且本地就能证伪」。
> 顺手把这条纪律收成一般式的：**看到"看不见的那一端"先查本机装了几个运行时版本**——`ls ~/.nvm/versions/node` 只花一秒，
> 而这次它把一条持续了两轮的猜测直接变成了数。三份注释（两份配置 + `ports.mjs` 头）都已按实测改写，删掉了 `ERR_REQUIRE_ESM` 那个错归因。
> 探针在测完后还原（`playwright.desktop.config.ts` 现只 import `ports.json`），本轮无产品行为变化。
> 末轮复跑（注释改写之后）：`pnpm gates` 0、`pnpm e2e:desktop` **37 passed**（退出码 0）、`pnpm e2e` **50 passed**（退出码 0）、`git diff --check` 干净；
> Node 20.20.2 下两份配置 `--list` 各 50 / 37、退出码 0。

> **把一条写在文档里的判据陷阱变成脚本自己的牙（2026-09-30 第十四次续做）**
>
> `scripts/desktop-http-inventory.mjs` 是运行时普查：注入桌面探针后逐条路由走一遍，数它发过几个 `/api/v1`。
> 它的失效形状本文件早就记过（`:773`）：**服务没起来时每条路由都返回 `httpCalls: []`，输出读起来就是"桌面态零云端调用，很干净"**，
> 而当时给的处置是"读它的输出前先看 `pageErrors`"——那是把校验留给人，而这条链上没人会去看。
> 本轮把它做成机械判据：每条路由 goto 之后读 `#root` 的 `childElementCount`（`main.tsx:7` 的挂载点（2026-10-01 第三十批给入口冒烟判据加了 import，行号从 6 搬到 7）），
> 汇总行从"只报计数"改成 `ROUTES_MOUNTED=<n>/<总>`；**只要有一条没挂载，就报 `DESKTOP_MODE_HTTP_UNIQUE=UNRELIABLE` 并点名是哪几条、附上 BASE，退出码 1**，
> 计数只在 8/8 都真跑起来时才作为结论输出。
>
> 三条腿都跑了，还顺手把"旧形状确实会假绿"测出来而不是宣称：
> ① **该放**：5174 上有活服务 → `ROUTES_MOUNTED=8/8`、`DESKTOP_MODE_HTTP_UNIQUE=0`、退出码 **0**（顺带再证一次这 8 条路由在桌面态零 `/api/v1`）。
> ② **该拦**：把真相源指到一个没人监听端口（临时 `ports.json` 的 web=5999）→ `ROUTES_MOUNTED=0/8`、`…=UNRELIABLE`、退出码 **1**。
> ③ **旧形状的反事实**：用一个临时副本 `scripts/__probe_old_inventory.mjs` 复刻加固前的逻辑对同一台死服务跑一遍——
>   它打印 `…HTTP_UNIQUE=0` 且**退出码 0**，两条 `ERR_CONNECTION_REFUSED` 只躺在 `pageErrors` 里没人管。探针已删（末轮取数前删净，不留脚手架）。
> 还原后重跑 ①：8/8、0、退出码 0；`pnpm gates` 退出码 0（345 文件 0 越线，lint 0 warning）。
>
> **一条自己差点发出去的假 finding**：看见 `scripts/check-ui-tokens.mjs`（186 行、含硬编码色硬线与字号棘轮）在 `package.json` 里
> **没有 `check:ui-tokens` 这一档**，就几乎写成"这道门禁没人跑"。追调用链才看清：根 `lint` → `@axiforge/web` 的 `lint`
> （`oxlint --deny-warnings && pnpm lint:colors`）与 `@axiforge/admin` 的 `lint:colors`，两处都指向 `node ../../scripts/check-ui-tokens.mjs`，
> 而 `lint` 在 `gates` 链里 ⇒ **它一直在跑，只是没有别名**。撤销该结论。
> 收成一条纪律：**声称"某段代码/某个门禁没人执行"之前，要把调用链追到末端**（`grep -rn <脚本名>` 之后还要看 package.json 的脚本图），
> 这跟"共用的单作者主张要验 import 与调用点而非 docstring"是同一件事的另一面——只是这次对象是脚本而不是函数。

> **把 `check:dispatch` 那条在册漏检关掉：正向分支的证据必须落在它自己的块里（2026-09-30 第十五次续做）**
>
> 脚本头一直写着一条**已知不覆盖**：证据取自"分派判定之后到函数末尾"，于是
> 「本地那一支 `return []`／`return {ok:true}` 空桩 + 块外真调 provider」这种混合形状照样过。
> 这正好是本项目最贵的那类失效——桌面拿到空列表，界面读起来像"真的没有存档"，而没有任何一处报错。
>
> 收紧形状按**分支形态分档**处理，不是一刀切窄：
> - `if (isLocal()) { … }`（正向块）与 `if (isLocal()) return …;`（正向单句）：证据窗口收成**那个块/那条语句本身**。
>   语料实测分布 `positive-block=4`、其余 `after-guard=26`（30 个导出 async 函数，全绿）。
> - `if (!isLocal()) return cloud();` 反向守卫与 `const local = isLocal()` flag 形状**保持"判定之后到函数末尾"**：
>   这两族的本地本体就是守卫之后的整段，硬做块级配对反而会把合法路径切掉（这是"过宽 fail-closed 会崩合法输入"的反面教材，先量再收）。
> - 配对是文本级的，带一个跳过字符串与行注释的粗 tokenizer；不认正则字面量与嵌套模板串 `${}` ——**这条限度写在脚本头**，
>   真碰到那种形状应换 AST，而不是悄悄放宽规则。
>
> 牙是**新旧对照**跑的，不是只跑新的：
> 把 `playerSaves.ts::listSaves` 临时改成"本地 `return []`，provider 调用挪到块外"，
> 用 `git show HEAD:scripts/check-dispatch-local.mjs` 取出加固前的旧脚本对同一份改动跑 → **`OK`，退出码 0**（漏检是真的，不是假想）；
> 新脚本同输入 → **`FAIL`，退出码 1**，点名 `playerSaves.ts :: listSaves —— 本地那一支（positive-block）既不调 provider…`。
> 还原后 `git diff --stat` 该文件为空，新脚本再跑 30/30 绿，`pnpm gates` 退出码 0。
>
> **本轮最值钱的一条方法论**：新加的那行「本地分支形状分布」计数，第一次跑就报了 `after-guard=30`——
> 而我刚在源码里看见 `playerSaves.ts:70,85` 明明是正向块。**没有那行输出，这个分类 bug 会安静地跟着绿灯活下来**：
> 括号配对函数写成了"先判后减"，`conditionEnd` 永远配不上第一个 `)`，正向块全被降级成 after-guard，收紧等于没生效。
> 收成一般式：**给判据加一行"它把样本分成了几档、各档多少"的分类计数**，它既服务读者也当场暴露错分——
> 与既有那条"筛选须让零值档可见（total 与 hit 分开报）"同族，但这一例是它在自己工具上的应用。

> **`check:purity` 的"宁可误报"改成"只少报注释"：四类探针一次跑齐（2026-09-30 第十六次续做）**
>
> 脚本头自报的另一条漏检：`const x = 1; // document.foo` 这种**行尾注释**会被 `/\bdocument\./` 判成 DOM 依赖，
> 上一轮的处置是"宁可误报也不放宽代码侧"。误报的真实代价不是多打一行，而是**逼人写 `purity-allow` 把代码侧一起放宽**
> ——豁免一旦落地就长在那，这才是这条门禁真正的腐蚀路径。
> 改法是加一个 `codePart(line)`：跳过 `' " \`` 三种字符串（含转义），把行尾的 `//` 或 `/*` 之后剥掉再匹配；
> 纯注释行的豁免原样保留。**代码侧一个字没放宽**：匹配的还是剥完之后剩下的代码。
>
> 探针一次摆四个形状，四类结果同一轮取齐（临时文件 `packages/axs/src/__probePurity.ts`，用完即删）：
> - ①**该放行**：`export const P1 = 1; // document.title` → 新版不报（旧版报在第 2 行）。
> - ②③**该拦行**：`document.title`、`window.innerWidth; // react` → 新版照报（第 3、4 行）。
> - ④**最容易踩的一行**：`/a:\/\/b/.source + document.cookie` → 新版照报（第 5 行）。
>   这一条是给"剥注释"本身设的反例：**naive 地把 `//` 当注释起点，会先撞上正则字面量里转义的 `\/\/`，
>   于是把后面的真违规一起吞掉**——"减少误报"就这样悄悄变成"漏报"。转义处理让它落不进这个坑。
>
> 新旧对照（与上一轮同一手法）：同一份探针语料，`git show HEAD:` 取出的旧脚本报 **4 处**（含那条误报），
> 新脚本报 **3 处**（误报消失、真违规一条不少）。删探针后：`check:purity` 40 文件 0 违规、`pnpm gates` 退出码 0。
> 新限度写回脚本头：**跨行块注释仍不处理**（本内核包里不存在那种形状；真出现应换 tokenizer/AST，而不是继续加文本特例）。
> README 的 `check:purity` 那行没动——它描述的是"断言零 React/DOM/网络/平台依赖"，本轮改的是匹配精度，不是它断言的对象（核对过再决定不改，不是默认不改）。

> **§6 台账的机械复核：闸门文件还是 14 个，被引用的 E 编号里只剩一个是幽灵（2026-09-30 第十八次续做）**
>
> 台账是 2026-09-30 早些时候立的，之后代码与用例又动了四批，所以按既有那条纪律（已勾的条目也要重量一次）
> 把 §6 第 5 条整张表用命令重对了一遍：
> - **成员**：`isLocalOnlyDeployment()` 命中的 `.tsx` 仍是 **14 个**，与台账逐个对得上，没有新增闸门、也没有谁被摘掉。
> - **编号**：把台账引用的 14 个 E 号做一次"定义处计数"（`grep -rho '"E<号>' e2e/*.spec.ts`）——
>   E15/E16/E18/E19/E21/E35/E36/E37/E38/E39/E40/E41/E42 各 ≥1 ✓，**只有 `E20` = 0**。
> - **那条断言本身没丢**：`发送到 Nexus` 的桌面缺席腿仍在（`desktop-http.spec.ts:333`，挂在 E17 流程里），
>   两半配对覆盖由 E40 提供（`:885` 浏览器态可见 / `:901` 桌面态为 0）。也就是说**掉的是编号，不是覆盖**——
>   与今天早些时候那例 `E29` 同形：用例会重排、会并进别的流程，而台账里引用编号的人不会收到任何通知。
> - **处置**：把 spec 里两处"E20"字样的注释改成"挂在 E17 流程内、无独立编号，两半见 E40，别按旧编号 grep"，
>   并改写 HANDOFF §6 的那一格。历史补记（`:575,793,800,1813,1828` 里的 E20）**不改写**——那是决策时的实态，按 ADR/补记惯例保留。
>   改完重跑桌面那一半：**37 passed**（注释级改动，用例集合没变）。
>
> 收成一条可复用的机械核对：**引用测试编号的台账，要定期跑一遍"编号定义处计数"**——
> 一行 for 循环就能把幽灵编号捞出来；台账引用**用例名或文件行号**比引用编号更耐久。

> **`check:labels` 第一档的漏洞：提了 `htmlFor` 就算过（2026-09-30 第十七次续做）**
>
> 三档判据里第一档原来是一句 `if (open.includes("htmlFor")) continue;`——**只要标签上写了 htmlFor 就放行**，
> 于是 `htmlFor={typoVariable}`（目标 id 根本不存在）照样绿。而浏览器在显式关联悬空时**不会退回包裹式关联**，
> 读屏与点标签聚焦一起失效：这正是本门禁本要拦的那类"看着像标签却念不出字段名"。
>
> 先量再收（这条纪律今天第三次救场）：临时统计脚本扫三个界面层，**`htmlFor` 共 12 处（表达式 11 + 字面量 1），
> 按"同文件是否有同名 id 接住"逐一对完 → MISS=0**。也就是说这条收紧今天上线是**零误报**的，
> 不需要基线、不需要豁免（`--update` 那档也就不会被顺手拿来当挡箭牌）。
> 实现取"归一化比较"：把 `{x}` / `"x"` / `{'x'}` / `` {`x`} `` 都剥成同一个记号再比，
> 所以模板串与两种引号写法都不会被误判；跨文件（父组件 `useId()` 经 prop 传下来）仍会被判悬空，**这条限度写在脚本头**，
> 真出现按提示改成全仓扫，而不是把档位放宽。
>
> 探针一次摆两个形状（临时 `packages/ui/src/components/__ProbeLabel.tsx`，用完即删）：
> - `htmlFor={probeGhostId}`（本文件无此 id）→ 新脚本 **FAIL / 退出码 1**，点名"htmlFor 指向「probeGhostId」，但本文件里没有任何 id 接住它"；
>   同一份输入下 `git show HEAD:` 的旧脚本 **OK / 退出码 0** ⇒ 漏洞是真的存在过，不是我假想的。
> - `htmlFor={probeRealId}` + `id={probeRealId}` → **不报**（证明这条不是"见未知标识符就红"）。
> 删探针后：`check:labels` 205 文件 0 处、`pnpm gates` 退出码 **0**（本轮只动门禁脚本，不碰产品代码，故 e2e 两半沿 14:06 那次实测 37 / 50 未重跑）。
>
> 连着三轮的同一条矿脉：**门禁脚本注释里自报的"已知不覆盖"是最便宜的重构靶子**——
> 它已经被写代码的人承认、已经付过一次代价、而且解法常常就写在那句话里（`check:dispatch` 的块级配对、`check:purity` 的剥注释、这一条的"目标必须被接住"）。
> 剩余仍在脚本头登记的自报限度有三条：`labels` 不校验祖先链、`labels` 的悬空检查以本文件为界（跨文件 id 会误判）、
> `dispatch` 对反向守卫与 flag 两档仍取宽窗口 + 文本级配对不认正则字面量、`purity` 的跨行块注释（上一轮新写）。
> 每一条都写明了"真出现该换 AST / 改全仓扫"，而不是留成沉默的例外。
> **（2026-10-01 第二十一次续做）其中第三条已关闭**：`labels` 的悬空检查从"本文件"升到"全仓"，见本节末那一块。上面这段按当时实态保留。

> **清偿 ADR-016 最后一条在册欠账，并顺带按棘轮的处置把 `edges` 外提（2026-10-01 第二十次续做）**
>
> 补记末尾写着：裸同名标题「恒指第一拍」可预测但不显眼，作者写错第二拍时**没有任何东西挡一下**，欠一条 lint 诊断。
> 这一刀把它付清：**语义一字未改**（tie-break 仍取第一拍），只是把它说出来——
> 文案「同名 Beat「开场」有 2 处，这里指向第 1 个；要指向第 2 个请写「开场-2」」把解法直接送到作者眼前。
> 上没上线先看分母（第七十一条那条纪律）：三份随包 `.axsp` **各有 2 个同名 Beat 标题**，正是这条规则存在的场景，
> 但**裸引用同名的处数为 0** ⇒ 既有作品不会突然亮黄灯。出口也不缺：`WriterPanel` 的「N 条提示」、`AxsCodeEditor:132` 的 linter、
> 剪辑台 `MiniAxsEditor:77` 都已经在消费 `diagnostics`，severity 是 warning 所以不阻塞保存——**不需要新造 UI**。
>
> **撞上一处我自己今天写的对立断言**：`roundtrip.test.ts:196` 当时钉的是「裸同名标题**不报诊断**」。
> 那不是笔误，是当时用来反驳我另一版过度提案的特征化断言。处置是**改断言而不是删断言**：
> 换成精确断言这一条 warning（含 line/severity/文案全文），对 id 与 edges 的钉原样留着——
> 决策层（ADR）优先于特征化层，但特征化层不能因此消失，否则"语义没变"这半就没人证了。
> 新用例三条：choice 与 jump 两个调用点各报一条（**同拍里 jumps 会 continue 掉 choice 分支，所以分两拍造**）、
> 唯一标题不许报（防它变成天天红的灯）、tie-break 不许变。先跑成 RED（`1 failed | 15 passed`，received 0）再实现。
>
> **棘轮这次挡的是 `parse.ts`（600 > 587），按它给的处置走**：目标解析那一族（`parseChoiceLine`/`parseJumpLine`/
> `assignBeatIds`/`titleToId`/`buildEdges`，103 行）外提成 `packages/axs/src/edges.ts`，
> `slugifyTitle` 一并搬过去再由 `parse.ts` 转出——这样 `print.ts` 与 `index.ts` 的 import 路径一行不用改，
> 公开面不变、`check:circular` 仍绿。`parse.ts` 落到 **493 行**，baseline 收到 493（`--update` 后**逐行复核 diff：只有收紧**，
> 并顺带清掉 `document.ts` 那条已失效的记录）。这一族的头注释直接指向 ADR-016 补记，写明
> 「序号规则与 `print.ts::idToBeatRef` 是咬合的两半，单独简化一边会静默换靶」——**契约跟着代码搬了家**。
>
> 复跑：`pnpm gates` 退出码 **0**（axs 45 / core 82 / editor-core 158 / web 181+1skipped / admin 39；lint 0 warning；
> `purity` 现扫 41 文件、`size` 346 文件 0 越线）；`pnpm e2e:desktop` **37 passed**、`pnpm e2e` **50 passed**（两半退出码都 0，
> 因为改的是创作主通路的解析器，必须实测而不是只信单测）。仍按 §7 未提交未推送。

> **`labels` 的悬空检查升到全仓，并把"被放宽的那一档"单独计数（2026-10-01 第二十一次续做）**
>
> 上一轮那条限度写在脚本头：悬空以**本文件**为界，父组件 `useId()` 经 prop 传下去的 id 会被误判成悬空。
> 今天按那句提示做了——但不是简单把范围放大：**DOM 里的 id 是整个文档的**，所以"全仓找不到"才是真悬空；
> 而"跨文件接住"是合法但**异常形状**（说明有人在传 id），所以单独计数并打印：
> `[labels] … htmlFor 跨文件接住 <n> 处`。这一轮实测该值 **= 0**，也就是说这次放宽**没有放过任何一处现有代码**，
> 而它一旦长起来就是提醒，不是让门禁变哑。（与既有那条"筛选须让零值档可见 / 分档判据要打印各档计数"同族：**放宽一条判据时，必须让被放宽的那一档可见**，否则放宽与失效在输出里长得一模一样。）
>
> 牙是一次探针跑两半（临时 `packages/ui/src/components/__ProbeX1.tsx` 定义 `id={probeSharedId}`、`__ProbeX2.tsx` 同时挂
> `htmlFor={probeSharedId}` 与 `htmlFor={probeNowhereId}`）：
> 同一份输出里 `跨文件接住 1`（**前者放行**）+ 唯一一条 FAIL 点名 `probeNowhereId`「全仓没有任何 id 接住它」+ 退出码 1（**后者仍拦**）。
> 删探针后：205 文件、裸标签 0、跨文件 0、退出码 0；`pnpm gates` 退出码 0、`check:size` 346 文件 0 越线（探针不在末轮计数里）、`git diff --check` 干净。
>
> 三条自报限度到此只剩两条：`labels` 的祖先链（文本级判据的量不到，要真验证得进 DOM 层，E25/E27/E30/E31/E32/E38 那批 exact 可访问名判据就是它的行为侧替身）、
> `dispatch` 对反向守卫与 flag 两档的宽窗口 + 文本级配对不认正则字面量、`purity` 的跨行块注释。**这三条我都不建议盲动**——
> 换 AST 的收益是"少一类理论误判"，代价是新增一套要维护的解析路径与新的漏报面。
> 本轮仍未提交、未推送、未改 tag（§7）。

> **两套 AXS→图实现的"字段映射"原来是一份抄两遍——已归一，并补上主通路缺的那半判据（2026-10-01 第二十二次续做）**
>
> 我一直把 S13-7 的归并写成"两套实现的字段等价性没核对，合并会动 Writer 主路径"。这句话今天量完了，结论比预想的更难看也更省事：
> **`axsImport.ts::beatToNarrative` 与 `projection/axs.ts::beatToNarrativeData` 是逐字符相同的 8 个字段**（连 `is_anchor: key==="intro" || title==="开始"` 都一样），
> `gridPosition` 那套 4 列 / 220×140 的落位公式也是两份。所谓"两套实现"在**字段这一层根本不是两种语义，是一份逻辑被抄了两遍**——
> 归一因此不需要产品定档，它就是"一个语义一处权威"该做的活。
> 做法：唯一权威留在 `projection/axs.ts`（`beatToNarrativeData` + `gridPosition` 都从那儿导出），`axsImport.ts` 删掉两个本地副本改 import；
> `index.ts` 同时星号导出两侧，所以公开面一字未变；`document.test.ts` 的 `gridPosition` import 跟着换源；
> `axsImport` 的头注释原写"只依赖 ./types 与 @axiforge/axs"，现在多一条依赖，**注释同步改了**（注释撒谎比代码有 bug 更难查）。
> 复核：`is_anchor` 规则在全仓的出现次数 **2 → 1**，`check:circular` 仍无环。
>
> **归一之后才有牙——而且发现主通路本来就没被钉**。把唯一权威改成 `is_anchor: false` 做变异：
> - 归一前：只会红 `document.test.ts`（2 条，`axs.import` 那一侧）——Writer 保存走的 `parseAxsToPlan` **从来没断言过 is_anchor**；
>   也就是说"关键拍判定"回归，主路径一半没人拦。`projection.test.ts` 里那两处 `is_anchor` 是 图→文本 的**输入**，不是这条断言。
> - 补一条 `关键拍判定在 Writer 主通路上也钉住` 之后：同一处变异红 **3 条、跨两个文件**（156 passed | 3 failed）。
> 这条判据写完第一次跑就**红了**——它当时用的是 `[intro]`，而代码只认 `[key: intro]`（见新登记的 #79），
> 于是把我自己照 ADR 占位写法读出来的错语法抓了个正着：**判据先红不一定是判据错，也可能是写判据的人理解错了契约**——这次的差异同时暴露了一处真实的静默忽略。
>
> 末轮复跑：editor-core **159 passed**（158 + 新增 1）、`pnpm gates` 退出码 **0**、`pnpm e2e:desktop` **37 passed**（退出码 0，改的是 Writer 保存的映射，光靠单测不算数）、`git diff --check` 干净。
> S13-7 剩下的部分要澄清：归一是**字段与落位**，两条**入口通路**（草稿事务 `axs.import` 与同步载荷 `parseAxsToPlan`）依旧并存——
> 后者要合掉才需要动 Writer 保存的载荷形状，那一步仍然等定档。

> **把今天所有改动过一次"产物层"验证，顺手拆掉一条自己以前记错的取证法（2026-10-01 第二十三次续做）**
>
> 触发点很朴素：文档里写着「`build` 刻意不进 `gates`，这类形状没有门禁管 → 接手时顺手跑一次构建看一眼」，
> 而我今天改了渲染层（AXS 解析器 + 内核映射 + 面板消费的 diagnostics）。三个构建各跑一次：
> `pnpm build:web` **0**（`tsc -b && vite build`，`INEFFECTIVE_DYNAMIC_IMPORT` 0 条，产物时间 09:15:21）、
> `pnpm build:admin` **0**、`pnpm build:desktop` **0**（出 `axiforge-desktop` 15,941,328 B 与 `bundle/macos/Axiforge.app`）。
>
> 然后我在 `.app` 二进制上 `strings` 找今天新增的那句诊断文案，**0 命中**——差点就此写下"改动没进产物"。
> 按"先跑对照组"的规矩没有下笔：同法去查**一直在用**的三条解析器文案（`选项目标未找到` / `跳转目标未找到` / `未知指令`），
> **也全是 0**，而它们在 `apps/web/dist/assets/*.js` 里一一存在；二进制里能读到的只有资源名（108 个 `.js`、10 个 `.css` 的文件名）。
> ⇒ Tauri 把 renderer 资源压缩内嵌，**JS 内容在二进制层根本不可读**，那条 `strings` 检验对内容恒为 0，
> 于是它既不能证明"没进去"，也**从来不能证明"进去了"**。
>
> 被这条拆掉的旧证据是本文件 `:917` 那条「生产产物里 `storage=memory` 字面量 0 次」——结论没错，
> 但当天的取证用的正是这个读不到内容的层，所以那份"实测"是空的。已在原处带日期更正，证据换到承载得住它的层：
> `apps/web/dist/assets/` 内含该字面量的文件数 **= 0**（09:15:21 的新构建），加上源码侧 `storage/index.ts:139,143` 的
> `import.meta.env.DEV &&` 静态替换。**规则收成一句：0 命中先证明这个方法对该类内容不是恒 0，再谈它证明了什么。**
> 本轮无代码改动，故 gates / e2e 沿 01:12 那次实测（改的只有文档与产物），构建本身的退出码如上。

> 本轮无代码改动，故 gates / e2e 沿 01:12 那次实测（改的只有文档与产物），构建本身的退出码如上。

> **一条 warning 引出两刀：按棘轮的处置切了条件域，顺手挖出 `>=` 被静默编译成 `==`（2026-10-01 第二十四次续做）**
>
> 第一刀本意只是清偿 ADR-016 剩下的那类"文本层静默失败"：Beat 标题里认不出的方括号
> （`# 第二拍 [intro]`——把键名直接塞进括号，正是照本 ADR「`[key: 名称]`」占位写法误读来的）
> 走完整个 if-chain 没有分支接住，不报错、不生效、`key` 保持 `null`。
> 判据先行：`parse.test.ts` 新 describe 跑出 **RED**（`Tests 1 failed | 17 passed`，`expected [] to have a length of 1`）才动 `parse.ts`。
> 分母先量（第七十一条纪律，今天第三次用）：`packages/**` 与 `docs/user/**` 共 **20 处** Beat 标题方括号、
> **0 处**落进新分支；三份随包 `.axsp` 是结构化 JSON 不含 AXS 标题文本，golden 无括号 ⇒ 既有作品不会突然亮黄灯。
> 这里我连错两次取数法才拿到可信数字：先对 `.axsp` 里的原始 JSON 做正则（拿到 0 处，实为方法失效），
> 再 `unzip -p project.json` 结构化走一遍才确认"确实没有"——**0 命中要先怀疑量法，再谈结论**。
>
> 加完这条 warning 后 `check:size` 红：`parse.ts` 502 > 棘轮 493。棘轮给的处置是"按域外提成协作模块"，
> 于是今天第二次走同一条路。切法上有个真约束：本想切 `parseHeadingLine`，但它要用 `parseCondition`，
> 单独切出去会形成 `parse ↔ heading` 双向依赖（`check:circular` 会亮）；
> 而**条件与字面量那一族本来就是三处共用的底部依赖**（标题行 `if:`、指令行取值、`print.ts` 的打印半），
> 所以切它才是那把正确的刀 → 新文件 `packages/axs/src/condition.ts`，parse.ts 收到 **420** 行、棘轮同步收紧（`--update`：2 增 3 删）。
> 与 `./edges` 那刀的区别写进了注释：条件不是 parse 的对外 API，**不做"转出再导出"**，
> `./print` / `./index` / 测试各自直接指过去（`index.ts` 公开出口一字未变）；对应测试同批搬到 `condition.test.ts`，断言一条未改。
>
> **挖到的那条是今天最值钱的一处**：搬 `OP_MAP` 时看见它只有 `==`/`!=`/`>`/`<` 四键，
> 而 `COND_OP_RE` 认得 `>=|<=`、`docs/user/writing/axs-syntax.md:149` 白纸黑字承诺过它们。
> 缺失分支经 `?? "eq"` 兜底 ⇒ 实测（RED 断言的 Received）`parseCondition("memory.score >= 10")` 得 `operator: "eq"`：
> 作者写的"够 10 就开"被编译成"恰好等于 10 才开"，且打印回写会把原文改成 `== 10`——**静默改故事逻辑，还顺带改作者的字**。
> 修法是补齐枚举而不是拒绝语法：`ComparisonOperator` 加 `gte|lte`，
> 求值两处（`core/conditions.ts` 两个 case、`backend/.../runtime/service.py::_compare` 两条 `elif`）、
> 打印一处（`OP_PRINT`）、词法映射一处（`OP_MAP`）。**Python 那半不是顺手加的**：
> `_compare` 对未知运算符返回 `False`，只修 TS 就等于把 `>=` 的闸门在 web 端永久锁死——换一种更安静的坏。
> 今天第二次验证同一条纪律：**补一处语义之前先数它有几套实现**（这一次是 5 处，且分属两种语言）。
>
> 判据四条 + 一次实测：`condition.test.ts` 映射两支、打印原样回到 `>=`（含 `&&` 组合支）、
> `conditions.test.ts` 边界支（夹具 `coins: 10`：`gte 10` 真 / `gt 10` 假 / `gte 11` 假 / `lte 10` 真 / `lt 10` 假 / `lte 9` 假）。
> Python 侧**没有测试覆盖 `_compare`**（`grep -rln "_compare" backend/tests` 空，这条限度登记在此），
> 所以改用 `backend/.venv/bin/python` 直调取数：`10 gte 10 → True / 9 gte 10 → False / 11 gte 10 → True / 10 lte 10 → True / 11 lte 10 → False / 10 gt 10 → False`，
> 与 TS 端逐位一致；`py_compile` 退出码 **0**。
>
> 末轮实测（一次取数，非沿用）：`pnpm gates` 退出码 **0**（purity 扫 42 个文件——新文件入面、0 违规；labels/dispatch/contrast/ui-source 全 OK）、
> 单测 **511 passed + 1 skipped**（core 83 / axs 49 / editor-core 159 / web 181 / admin 39，比上一轮 +5，正是本轮 4 条新判据 + 1 条搬家拆分）、
> `pnpm e2e:desktop` **37 passed** 退出码 **0**、`pnpm e2e`（含真后端那一半）**50 passed** 退出码 **0**、`pnpm build:web` 退出码 **0**。
> 用户文档同轮：`axs-syntax.md` 补「键名要写在冒号右边」写法提醒、「认不出的方括号标记」容错条目，并把 `>=`/`<=` 含边界这句话写实（这条今天才第一次真的成立）。

> **补一处不如关掉一类：把 `?? "eq"` 那类兜底换成 fail-closed，并给词法/映射做一条不变量（2026-10-01 第二十五次续做）**
>
> 上面那一刀修的是 `>=` 这个**实例**，但成因还留在原地：`OP_MAP[opStr] ?? "eq"`。
> 只要词法认得某个记号而映射表缺键，它就替作者猜一个语义，而且猜的是最不像出错的那个。
> 于是把兜底拆掉：缺键 ⇒ 整条条件判为不可解析 ⇒ 由 `[if:` 那条**已有**的 warning 接住；映射表不再补语义。
> 同形状的判断在 `titleToId`（#77）与括号标记（#79）那两刀里已经是第二次、第三次出现——**"静默兜底"是这一族缺陷的共同底座**。
>
> 判据不做成"数一下今天的运算符"那种空载断言，而是**从真相源自己抽表**：
> 新测试把 `COND_OP_RE.source` 的第一个捕获组 split 出来当记号表，钉两条 `toEqual`
> （记号表 7 项 + 每项解析出的 operator 7 项）。为此把 `COND_OP_RE` 导出（只在模块内，包出口 `index.ts` 未变）。
> 成对变异取数（临时探针 `__probe.test.ts`，用完即删、删后复跑）：
> - 漂移（往 `COND_OP_RE` 加一个 `=~`）× **新守卫** ⇒ 探针**绿**（`parseCondition("flag.a =~ 1")` 返回 `null`），
>   不变量**红**：`expected [ '==', '!=', '>=', '<=', '>', …(3) ] to deeply equal [ …, …(2) ]`（1 failed | 50 passed）；
> - 同一漂移 × **旧 `?? "eq"`** ⇒ 探针**红**：`expected { type: 'flag', key: 'a', …(2) } to be null`，
>   Received 里那句 `"operator": "eq"` 就是 #82 的机制本体（2 failed | 49 passed）。
> 两相对照说明这条不变量不是"见新形状就红"的过宽守卫：它拦的是**漂移**，而漂移在今天并不存在，所以正常态它是 50 passed 里安静的一条。
>
> 一处自己该先做却被门禁补上的检查：新测试写完我只跑了 vitest 就往下走，`pnpm gates` 第一步 typecheck 就红——
> `condition.test.ts(83,70) error TS2339: Property 'operator' does not exist on type 'Condition'`（`Condition` 是联合类型，
> 单原子表达式的 `.operator` 要靠 `"operator" in cond` 窄化）。**vitest 只剥类型不查类型**，这条纪律今天是第二次被同一道门禁逮到。
>
> 登记限度：那条不变量是**绊线不是自动同步**——真要加运算符，记号表那行 `toEqual` 必须人手改，
> 而改它只代表"你想清楚了"，仍要自己去动 `OP_MAP`、两处求值、`OP_PRINT` 与用户文档（这正是 #82 那次五处的清单）。
> 末轮数字（01:38 一次取数）：`pnpm gates` 退出码 **0**、单测 **512 passed + 1 skipped**（core 83 / axs 50 / editor-core 159 / web 181 / admin 39）、
> `pnpm e2e:desktop` **37 passed** 退出码 **0**、purity 扫 42 文件 0 违规。`pnpm e2e`（浏览器半）沿 01:33 那次 50 passed，本轮只动 `condition.ts` 的不可达分支与测试。

> **把用户文档的示例本身变成机检对象，一刀修掉打印的写回、一刀撤回后登记成待决（2026-10-01 第二十六次续做）**
>
> 起因是今天那条最值钱的发现：`>=` 是"文档承诺跑在实现前面"捞出来的。既然靠人眼对账能捞到，
> 就别再靠人眼——新增 `packages/axs/src/doc-examples.test.ts`，把 `docs/user/writing/axs-syntax.md` 里
> **12 个 ` ```axs ` 围栏块**全部变成被测对象，判据 26 条：取块数量守卫（防"一块都没抓到"的假绿）、
> 每块 0 error 级诊断、**`printAxs` 必须是纯函数**、每块 `parse → print → parse` 结构一致。
>
> **第一刀无歧义，当场修**：往返差异里混着一种污染——`printAxs` 把内部 scratch 直接盖回调用方对象
> （旧 `print.ts:249-250`：`beat._edges = edgeMap.get(beat.id)`，而 `printBeatBody` 又去读它）。
> 后果是 `parse → print → 再序列化` 的通路会把一个私字段带进草稿与 `.axsp`。
> 改法：`edgeMap.get(beat.id)` 作为参数传给 `printBeatBody`，输入对象一字不碰。
> 活调用方两处（`projection/axs.ts:142`、`MiniAxsEditor.tsx:22`）都是打印完即弃 `doc`，**所以今天没有可见后果**——
> 但"打印不许改输入"是契约不是风格。见过它红：把 stamp 装回去 ⇒ 纯度那条红（消息点名「示例 L16 被打印改写了」）、
> 往返三条一起红（`Tests 4 failed | …`），还原后 76 全绿。
>
> **第二刀有权衡，实现过又撤回，登记为待决**：往返判据同时抓到 `printAxs` 会把**指向下一拍的顺序边**物化成
> `-> 标题` 行——文档示例 `# 开场` + `## 子场景` 之间没有任何 `->`，一次打印就凭空多一行，重新解析后 beat 上多出 `jumps`。
> 我先按缺陷实现并跑绿（axs 76），随后**既有契约断言 `projection.test.ts`「线性链按拓扑序打印，roles 反解说话人，边打印为 -> 标题」变红**——
> 这一红把问题从"实现缺陷"改判成"决策层两难"：① 显式化（现状）让"在两拍之间插一拍"不会自动接入链，新插入的那拍可能孤立；
> ② 隐式化让文本干净且往返幂等，但"移动节点/调整顺序"会静默重连连线。两边都有真实失效模式，**不该由重构轮单方面定档**，
> 于是撤回 ②，并把它的实测证据留在工单里（红过哪条断言、跑绿过哪些测试）。
> 判据的处置是不作弊也不收掉：往返比较**只摘掉与待决项相关的那一维 `jumps`**，`edges` 与 beats 其余字段照比，
> 并在比较函数注释里点名"为什么这里允许不同"、引用工单用**标题而不是编号**（这一轮就撞上编号漂移：注释里写 #85，台账给的是 #84，
> 而同批 describe 里的 "(#84)" 又另指纯度那件事）。
>
> 末轮数字：`pnpm gates` 退出码 **0**（01:51）、单测 **538 passed + 1 skipped**（core 83 / **axs 76** / editor-core 159 / web 181 / admin 39；axs 从 50 涨到 76 就是这 26 条）、
> `pnpm e2e:desktop` **37 passed**（01:51）、`pnpm e2e` **50 passed**（01:52）、`git diff --check` 干净；
> 之后两次注释/测试标题的措辞改动只重跑了受影响的包（axs **76 passed**，01:53）。
> 收成一句：**判据抓到的"不一致"要先分诊——写回输入是缺陷，物化顺序边是决策；前者当场修，后者带证据登记，别把两难当成 bug 顺手改掉。**

> **演出指令的取值集合终于有了牙齿：三族枚举 + 两处数字参数不再静默通过（2026-10-01 第二十七次续做）**
>
> 起点仍是那条"文档 ↔ 实现"的机械对照：把用户文档列出的 `@` 指令清单与解析器认识的清单逐项比（结果两边一致，`@item` 文档已明说不提供），
> 但顺着读 `parseDirectiveLine` 时读出第二类今天一直在修的形状——**吃下任意拼写再用 `as` 把类型圆过去**：
> `@transition banana` → `kind: (kind ?? "fade") as "fade"`、`@fx disco` → `as "rain"`、`@camera wiggle` → `as "zoom"`，
> 而真相源 `packages/core/src/ir.ts:136,151,159` 把这三族钉成 `CameraAction` / `TransitionKind` / `FxKind` 三个联合类型；
> `@wait soon` 与 `@camera zoom big` 更直接：`parseInt`/`parseFloat` 出 `NaN` 原样进 IR。
> **两端严格程度还不一致**：Python 侧用 pydantic `Literal` 校验同一组值（`backend/app/domains/narrative/ir.py:83,93,99`），
> 同一份文本一端拒收、另一端静默降级——已在 ADR-027 的方言对照表补记这条差异。
> 修法沿用今天那一条纪律：**只加提示、不改语义**（值仍照原样带着），warning 文案把可用列表送到眼前
> （「转场种类「banana」不在可用列表里：fade / dissolve / wipe / cut（这一行照常保留，播放端不会有任何对应效果）」）。
> **一处例外说清楚**：`@camera zoom big` 的 `scale` 不再写进 IR。理由是 `NaN` 进不了 JSON、且打印侧 `scale != null` 判定会把它当有值
> （`print.ts:122`）从而把字面量 `NaN` 印回作者文本——那是"坏数据外泄"而不是"语义"，所以这一处不是纯加提示，判据里也写明了它是什么。
>
> 分母先量（今天第四次同一条纪律）：`docs/user/**`、`docs/ADR/**`、`seed_showcase.py`、`prompt.ts` 里这四族的实际取值
> 只有 `fade` / `dissolve` / `rain` / `none` / `zoom` 与裸指令行（表格示例），**0 处落进新分支** ⇒ 零误报上线，不需要基线。
> 判据 5 条在 `parse.test.ts` 新 describe：三族各一条 + `@wait` 缺参数/非数字两条 + `@camera zoom` 的 scale 那条带"不进 IR 且不印出 NaN"的断言，
> 外加一条**对照组**（文档表格里给过的 7 种写法一条都不许报）。先跑出 RED：`4 failed | 16 passed`，`expected [] to have a length of 1`。
>
> 同轮按棘轮的处置又切一刀：加完这些分支 `parse.ts` 会越过 420 档，于是把**演出指令取值**这一族（11 个 `case`）外提成
> **`packages/axs/src/instructions.ts`**（170 行，含 `resolveRole`——立绘指令与对白行共用同一个"角色名→id"解析，
> 留在 `parse.ts` 会让新模块回头依赖它而成环）；`parse.ts` 落到 **330** 行，棘轮同步收紧（`--update`：1 增 3 删）。
> `ADR-027` 方言对照表里 `parse.ts:234-318` 那一族行号就此失效，已按"历史文本不重写"另起带日期的补记指明新落点。
>
> 末轮数字（02:00 一次取数）：`pnpm gates` 退出码 **0**、单测 **543 passed + 1 skipped**（core 83 / **axs 81** / editor-core 159 / web 181 / admin 39）、
> `pnpm e2e:desktop` **37 passed** 退出码 **0**、`pnpm build:web` 退出码 **0**。

> **一条没上线的 warning：先量分母再决定做不做，这一轮它把想法否掉了（2026-10-01 第二十八次续做）**
>
> 顺着"分支没接住就糊过去"这一族往下看，读到对白分隔符：`parseDialogueLine` 的正则只认**半角冒号**，
> 全角 `：` 的行整行落进旁白兜底 ⇒ `堰纱：你来了。` 变成 narration，说话人丢失、前缀照原样进玩家端文本。
> 这条规则此前**只存在于 ADR-027 的方言对照表**（第 50 行）和代码里——用户文档一个字没提，判据也没有。
> 直觉修法是给全角冒号加一条 warning。今天第五条分母纪律把它否了：
> 扫 `docs/**/*.md` 的 ` ```axs ` 围栏、`.axsp` 里的 `*axs*` 字段、`testdata/**` 向量，
> 全角冒号在 AXS 源文本里共 **6 处，全部来自用户文档自己的示例**，形态是 `旁白：她转身离开。`——
> 而"整行文本的旁白"是**合法用法**（`旁白：` 属于正文）。⇒ "见全角冒号就提示"的误杀率是 100%，零误报上线不可得。
> 于是本轮只做两件不需定档的事：**文档写清规则**（`axs-syntax.md` 的对白段加写法提醒，含"旁白：xxx 是合法整行旁白"这半句），
> 以及**把现状钉成特征化断言**（`parse.test.ts` 新 describe 两条：全角那支 + 半角对照组），并登记待决（工单标题
> 「全角冒号对白被静默当旁白」：要做提示必须先定"怎么区分打错的说话人与合法的旁白前缀"，三条候选各自要什么，写在工单里）。
> 特征化断言也见过它红：把正则临时改成 `[:：]` ⇒ `expected [ 'say' ] to deeply equal [ 'narration' ]`（1 failed | 21 passed），还原后 axs **83 passed**。
>
> 顺带记一条取证教训：同一次扫描里三份 `.axsp` 报 `BadZipFile`，差点被当成"随包文件格式坏了"。
> 对照魔数即可归因：`public/seeds/*.axsp` 是 `504b`（PK，真 ZIP），而报错那三份落在
> `apps/desktop/src-tauri/target/release/build/.../tauri-codegen-assets/`、魔数是 `1b…`（brotli 压缩的构建期副本）——
> **是我的 `rglob("*.axsp")` 把构建产物扫进了面，不是产物坏了**。扫描面要先按"跟踪文件 vs 构建目录"分一次。
>
> 末轮数字（02:07 一次取数）：`pnpm gates` 退出码 **0**、单测 **545 passed + 1 skipped**（core 83 / **axs 83** / editor-core 159 / web 181 / admin 39）、
> `pnpm e2e:desktop` **37 passed** 退出码 **0**、lint `Found 0 warnings and 0 errors`。本轮只动测试与文档，产品代码未改。

> **审计 `draft.ts` 时撞见一条在册契约被违反：发射器印出了自己读不回来的行（2026-10-01 第二十九次续做）**
>
> 起点是查 `defaultSpeaker` 到底生不生效。结论分两层，都有据：
> **① 那条分支确实是死支**——`draftFromProse` 只在 `i.op === "say" && !i.speaker` 时补默认名，
> 而它的唯一生产者 `proseToScriptDraft` 用 `SPEAKER_RE = /^([^\s：:]{1,20})[：:]\s*(.+)$/` 取名字，名字非空才可能成 `say`
> （认不出的名字走旁白那支），所以这条 map 在这条通路上永不点火。
> **② 但顺着找到了真缺陷**：Python 那头补默认名的位置在**发射器**（`ai_draft.py:109` `speaker = item.get("speaker") or default_speaker`），
> TS 的发射器**没有任何等价兜底**，于是实测（临时探针，跑完即删）：
> `printAxs` 把空说话人的 `say` 印成 `# 测试\n: 你来了。\n`，`parseAxs` 读回来是 `narration`、正文 `: 你来了。`
> ——**冒号漏进玩家文本、op 从 say 翻成 narration**。而 `instructionOps.ts:33` 就是编排台「+ 台词」按钮造的形状
> （`{ op: "say", characterId: null, text: "" }`），⇒ 这是活路径，不是理论输入。
>
> **这条违反的是在册契约，不是我的偏好**：本文件依据的 ADR-016 质量要求第 2 行早就写着 `parse(print(beats)) ≡ beats`。
> 修法取"按旁白那一支印出去"，依据是三方一致：`core/src/ir.ts:90` 注释写着 characterId「缺省为旁白」；
> 运行端本来就不显示空说话人的名字（`engine.ts::resolveSpeaker` 返回 `null`、`BacklogPanel.tsx:39` 的 `entry.speaker &&`）；
> 文本层没有"无名对白"这个形状。另一条候选（照 Python 补一个"旁白"显示名）会让玩家**多出一个原本没有的名字**，
> 属于播放可见变化，已作为双端差异登记进 ADR-027 补记（桌面是唯一发布目标，本 ADR 认 TS 这条）。
> 转义规则顺手归一：`printNarrationLine` 一份，`narration` 与这一支共用（此前是内联表达式，两处各写等于两处各漂）。
>
> 判据三条（`parse.test.ts` 新 describe，RED 先跑：`expected '# 测试\n: 你来了。\n' to be '# 测试\n你来了。\n'`，对照组一开始就绿）：
> 空说话人 → 印成纯文本且回读仍是那行文本、`speaker: ""` 同形、**对照组**有说话人时仍印 `名: 台词` 且回读是 `say`。
> **改断言而非删断言**的又一例：`projection.test.ts:107` 那条基线原本钉的就是坏输出（注释写着「既有行为，基线钉住」），
> 按新预期改写并留日期与原因，对选项目标映射 `> 东 -> 东方` 的钉原样保留。
>
> 末轮数字（02:17 一次取数）：`pnpm gates` 退出码 **0**、单测 **548 passed + 1 skipped**（core 83 / **axs 86** / editor-core 159 / web 181 / admin 39）、
> `pnpm e2e:desktop` **37 passed**、`pnpm e2e` **50 passed**、`check:size` 扫 348 文件 0 越线。
> 收成一句：**审计"这段死代码生不生效"值得做——它这次没直接帮上忙，却把发射器缺兜底这条活路径缺陷带了出来。**

> **共享向量补第五条"认不出的名字退回旁白"，并对两端各验一次牙齿（2026-10-01 第三十次续做）**
>
> 先查证那句"两端锁定等价"到底有没有执行者（记忆里的老规矩：声称没人跑之前把调用链追到末端）。结论是**有**：
> `.github/workflows/ci.yml:88` 在 `working-directory: backend` 下跑 `uv run pytest tests/ -v`，
> 而 `backend/tests/test_axs_draft_vectors.py` 消费的就是 `testdata/axs-draft/*.json` 同一批向量——
> 它只断言"发射器 reproduces 手写期望文本"，期望文本的合法性由 TS 侧 canonical 解析器裁决（不拿 Python 自己的正则自证）。
>
> 缺的是覆盖面：原有 4 条向量锁住了 `@bg/@bgm`、转场/特效的硬编码时长（500/600）、`\` 转义、尾部选项，
> 但**"认不出的名字不猜角色"这条双端同裁决只散在单测里**。而这条恰好有个易漂的细节：
> 两端都是 `f"{name}：{text}"` / `` `${name}：${text}` ``——**固定用全角重新拼接，与输入冒号种类无关**
> （TS 的注释此前写的是"保留全角冒号原样"，对半角输入不成立；已改成写明"与输入无关"，并把注释移进它所属的 else 分支）。
> 新向量 `testdata/axs-draft/unknown-speaker.json` 用半角输入、期望全角输出，正是为了让"谁哪天改成保留原样"必须过一次两端。
>
> 牙齿各验一侧（成对变异，改完即还原、并 `git diff --stat` 确认两个文件都无残留）：
> 把两端那处拼接同时改成半角 ⇒ TS 侧 `1 failed | 5 passed`（红在 `unknown-speaker` 那一条）、
> Python 侧 `test_rules_emitter_reproduces_vector[unknown-speaker]` AssertionError；
> 还原后 TS 向量 runner 回到 6 passed。
> 新向量首跑两端就绿（不是我改出来才绿的形状，是既成事实被补上登记），所以它的价值全在"漂移会被抓住"这一侧。
>
> 末轮数字：补向量后 `pnpm gates` 退出码 **0**、单测 **549 passed + 1 skipped**（**axs 87**：86 + 新向量那 1 条）、
> `pnpm -F @axiforge/axs typecheck` 0；Python 侧 `pytest tests/test_axs_draft_vectors.py` **6 passed**（`.venv` 宿主）。
> 产品代码未改（只动一条注释的位置与措辞 + 新增向量文件）。

> **一个 Beat 的第二个分支组在发射时被整个丢掉：钉成在册断言 + 登记三种修法（2026-10-01 第三十一次续做）**
>
> 循着上一轮自己点名的两处之一去查（`print.ts` 的 `reverseRole` 回退与"分支目标不存在"），先撞见更大的一个：
> `printBeatBody` 用 `beat.script.find((s) => s.op === "choice")` **只取第一个分支组**，
> 第二个组连同它的选项一起消失，而且 `diagnostics` 是空的。临时探针读数：
> 输入 `[say, choice[左], narration, choice[右]]` ⇒ 打印 `# 测试\n堰纱: 选吧\n中间一句\n> 左\n`——
> 回读得到 3 条指令、1 个 choice、0 条诊断。**违反 ADR-016 质量要求第 2 行 `parse(print(beats)) ≡ beats`**。
>
> **为什么这算活路径**：`ScriptEditor.tsx:81` 的 `add = (op) => onChange([...script, defaultInstruction(op)])`
> 没有任何"每拍只许一个分支"的守卫，而「分支」就躺在指令面板里（`instructionOps.ts:21,58`）⇒ 连点两次即成立。
> 三条候选修法各自都要动一层决策，所以本轮**不擅自选一条**：
> ① 合并成一组（不丢内容，但"两个先后出现的问题"被改写成"一个 N 选项问题"，叙事语义变）；
> ② 扩语法支持多组（语义保真，但要动解析器/打印/用户文档/语法冻结面，还得定旧文本怎么读）；
> ③ 保持现状但发射侧给诊断（不丢语义不改语法，代价是 `printAxs` 目前只有字符串出口、没有 diagnostics 通道，
>    要加一个可选出参并接进 Writer/编排台的提示列表）。
> 我的建议是 ③——先把"静默"止住，再谈要不要 ①②；但它属于可感知的接口调整，所以进清单等一句话。
> 本轮落地的不需定档那半：`roundtrip.test.ts` 末新增一条**特征化断言**（钉的就是"第二个组不出现"），
> 注释写明它是"这条曾经会丢"的凭据，修法定了之后要**改写而不是删除**它。
>
> 又第三次被同一道门禁逮到：新断言用了未 import 的 `Instruction`，vitest 全绿而 `typecheck` 红
> `TS2304: Cannot find name 'Instruction'`——**vitest 只剥类型不查类型**，这条纪律今天的命中率比我自己写它的次数还高。
>
> 末轮数字（02:26 一次取数）：`pnpm gates` 退出码 **0**、单测 **550 passed + 1 skipped**（**axs 88**）、`check:size` 扫 348 文件 0 越线。
> 产品代码未改（只动测试）。

> **新门禁 `check:citations`：把文档里的 `路径:行号` 变成机检对象，当天就被自己的三次搬家打到 12 条越界（2026-10-01 第三十二次续做）**
>
> 动因是今天的直接后果：`parse.ts` 一天里被按域切了三刀（600 → 331 行），而 ADR / REFACTOR / BLUEPRINT 里散落着按旧行号写的坐标。
> 上一轮我给 ADR-027 写的是"历史文本不重写 + 带日期的补记指新落点"，但那只是**声明**，没有东西挡下以下一次失效——
> 于是这道门禁把声明变成判据：**文件必须存在、行号必须落在文件长度内**。`docs/**` + 两份根文档共 47 个文档、161 条引用被判定。
>
> **判据先被自己的误报教过一次**：首版把文档里合法的简写（`parse.ts` 第 391 行、`projection/axs.ts` 第 192 行）全报成"文件不存在"，
> 166/200 是误报 ⇒ 那条判据不合格。改成**按 basename 或路径后缀在受追踪源码里找唯一匹配**：唯一才判、多义跳过、
> 构建目录/依赖目录/`Clearance/` 不参与匹配（否则 `target/` 里的副本会让判据变宽）；
> 并且**各档计数一律打出来**（已判定 161、越界 3、不存在 0、歧义跳过 37、省略号跳过 1、只落在被跳目录 4）——
> 判据退化成沉默放行时，只有计数会暴露它。牙齿验过：临时放一个 `docs/__probe_citations.md`，里面一条 `parse.ts` 第 99999 行 与一条不存在的路径，
> 门禁 **FAIL / 退出码 1** 并点名两行，探针随即删除。
>
> 真信号 **12 条越界**，处置分两类：**现状类 9 条改到今天的真实落点**（`assignBeatIds` 原 `parse.ts` 第 383-391 行 → `edges.ts` 第 36 行、
> `titleToId` → `edges.ts` 第 46 行、两条 warning → `edges.ts:84 / :103`、AXS 分派四支 `:540/:553/:559/:568` → `parse.ts:142/:297/:303/:312`（ADR-027 与 BLUEPRINT 同步）、
> `axsImport.ts` 第 81-87 行 → 第 57-63 行）；**历史日志类 3 条不改写**（当日记录里的 `ScriptEditor.tsx` 第 572 行、`parse.ts` 第 391/417 行，它们描述的是当时的实态），
> 冻结进 `scripts/doc-citation-baseline.json` 并注明"清偿后应缩短"——具名基线随修完缩短，否则棘轮等于没关。
>
> 接线三处同轮：`package.json` 新增 `check:citations` 并插进 `gates`（链从 11 条变 **12 条**）、`README.md` 的门禁表补一行（含自报限度）、
> 脚本头写明"已知不覆盖"。末轮：`pnpm gates` 退出码 **0**（含新那一道 OK），单测维持 **550 passed + 1 skipped**。
> **它第一次红是红在我自己身上**：写完这批文档后门禁报 8 条新增越界，逐条看全是「引用一个坏坐标来做说明」的那几处——判据分不出「这是断言」与「这是举例」。处置不是放宽判据，而是把示例改写成「`parse.ts` 第 391 行」这种非引用形式；**一条新门禁上线后第一批抓到的作者往往是我自己**，这正是它该有的样子。产品代码本轮未改。

> **一条"看起来是缺陷"的线按证据作废：`role.remove` 有内核能力、无界面入口（2026-10-01 第三十三次续做）**
>
> 上一轮我给自己留的下一处是 `print.ts::reverseRole`——角色反解失败时会把**内部 id 原样印进作者文本**（`@show char-1`、`char-1: 台词`）。
> 顺着"什么情况下反解失败"查下去，命中的前提是"角色被解绑后节点仍引用它"，于是去查 `role.remove` 会不会留下悬空引用：
> 内核确实留（`document.ts` 的该分支只过滤 `draft.roles`，不动 node 的 script）。看起来这就是一条活缺陷。
>
> **但没有对照之前不下结论**（本文件今天第三次靠这条纪律避免造活）：全仓 grep 分派点——
> `role.remove` 只出现在内核（`document.ts` / `types.ts`）与它自己的单测（`document.test.ts`），
> 而同一事务联合里的 `node.move`、`script.patch` 在 `apps/web/src` 有真实 dispatch 调用点。
> ⇒ **界面从不解绑角色**，"解绑后 id 泄进文本"这条路径今天不可达；内部 id 出现在文本里只剩一种现实入口：**外部灌进来的数据本身带着未绑定的 id**
> （`axs.import` 走 `resolveRole` 时名字不在 roles 里，characterId 会保持那个字符串原样——但那本来就是作者文本里写的名字，不是泄漏）。
> 结论：**不修**，也**不给 `reverseRole` 加兜底**——在没有可达输入的情况下加"未知就报提示"的分支，
> 正是我今天反复拆的那一类"为不可能的场景做防御"。
>
> 值得留册的不是缺陷而是这条不对称：**内核有 `role.remove` 能力，界面没有入口**。
> 两类后果不同，所以登记为一句待决而不是任务：
> 若将来给"从工程里移除某角色"补 UI 动作，它必须同时决定**引用该角色的节点怎么办**
> （清空成无名台词？退回旁白？还是阻止移除并列出仍在引用的节点？）——
> 参照本文件已有的口径："断掉输入路径的能力要记成能力缺口，不是机制已保留"；
> 而"删掉角色让台词变成无名"会顺带撞今天上午定下的那条（无说话人的 `say` 发射为旁白，见「第二十九次续做」）。
> 判据侧不需要新增：可达性已经由"分派点存在与否"这个机械问题决定，写测试去测一条 UI 走不到的分支只会多一条不会红的牙。
>
> 本轮无代码改动（只动文档），末轮以 `pnpm check:citations` 与 `pnpm gates` 复核（新写的这段里凡"某文件某行"都写成非引用形式，见「第三十二次续做」末尾那条自抓）。
>
> **补一条"试过并否掉"的读数（同日第三十四次）**：`check:citations` 的自报限度"不判内容层"看起来是下一步该收的矿脉，
> 真去量了：把同行反引号里的标识符拿去目标文件里找，**52 条可判引用里 20 条被标 = 误报率 38%**，
> 成因不是数据脏而是**配对不可得**——一行里同时引用两个文件时（各带自己的符号），"哪个标识符属于哪个引用"没有机械可依据的邻近关系。
> 于是这道门禁停在"存在性 + 范围"这一层，读数与成因写进脚本头，**下一会话不必再试第二次**。
> 这条与今天另外两次"按证据作废"（`_line` 死读、`role.remove` 无界面入口）同属一类：**自主矿脉的收尾产物常常是"此路不通"的凭证，而不是又一次改动。**
>
> 同一轮把 `doc-examples.test.ts` 的扫描面从"用户文档那一个文件"扩到 **`docs/**`（排除 `docs/archive`）**：
> 数下来围栏从 12 个变 **13 个**，多出来的正是 **ADR-016 自己那条语法示例**——语法权威的样例句此前落在机检面之外，
> 而它恰恰是最该被"0 error 诊断 + 打印不改输入 + 往返一致"三条管住的一段。扩面后判据数 26 → **28**（13 块 × 2 条 + 数量守卫 + 纯度条），
> 全绿：说明 ADR-016 的示例与今天的实现一致（这也是它该有的状态，但从此**漂移会被抓住**）。
> 数量守卫同时从"大于 0"抬成"大于 12"：**扫描面被谁悄悄改窄会直接红**，而不是退化成"一块没抓到也算过"的假绿。

> **`.axsp` 导出往返补进判据面：夹具之外，真实随包产物也要被钉住（2026-10-01 第三十五次续做）**
>
> **先自我更正（同日 03:21，写完下一段之后发现的）**：我下面写的"这条不变量**没人守**"**说过头了**。
> `apps/web/src/shared/storage/axspRoundTrip.test.ts`（96 行，标题就是「`.axsp` 往返不漏字段」）在**provider 层**守着更强的版本：
> 它走 `exportProjectAsAxsp → importProjectFromAxsp`，钉工程元信息（描述/世界观/规则/机制/题材/标签）、舞台与 `sceneRefId`、道具引用一起过去，
> 而且它自己的注释已经写明"`storage.test.ts` 只断言 nodes/edges/axsSource/roles/title，元信息从来没人要求它过去"——
> 也就是说这正是我今天一直在做的那类补洞，只是**它早在 S13-2 就做完了**。
> 我漏看的原因很具体：判定"有没有人守"时只 grep 了符号 `packAxsp`，而那条测试调的是**包装函数**（`exportProjectAsAxsp`），符号不匹配 ⇒ 假阴性。
> 收成一句：**问"有没有人守这条不变量"要按能力名（round trip / 往返 / 不漏字段）扫测试目录，不能只按底层符号名扫。**
>
> 于是下面这批判据的真实价值收窄为：**把"真实随包文件"这个输入类别纳入容器层往返**（既有覆盖 = 合成夹具 + provider 层；
> 新增 = 三份 shipped bundle 过 `unpack → pack → unpack` 逐字段相等 + 素材清单与包内条目一致 + 数量守卫防空载）。
> 它仍然便宜且有意义（随包示范作是唯一必然存在、又由后端导出器生成的真实产物，与 seed_showcase 的在册漂移正相邻），
> 但**不是"补了一个没人守的洞"**——这句修正同时进 HANDOFF §4 与 task 表。
>
> 先量再说有没有缺陷：拿三份**真实随包 bundle**（`apps/web/public/seeds/showcase-*.axsp`）跑 `unpack → pack → unpack`，
> project 序列化后**逐字节一致**、角色数守恒、素材清单 0 → 0（示范作不内嵌素材）⇒ **没有缺陷**。
> 但这条不变量此前**没人守**：`axsp.test.ts` 的 pack→unpack 等价用的是合成夹具，`seedShape` / `seedPlayable` 钉的是"读进来的形状与可玩性"，
> 两者中间的交叉——**用户从示范作导入工程、再点导出时会不会丢内容**——只能靠代码与夹具自证。
>
> 补 4 条判据（新 describe，含一条"目录里有三份"的数量守卫，防空载）：逐份断言再读回的 `project`、`characters`
> 与 `manifest.assets` 三方相等，并断言"清单声明的素材必须真在包里"（否则导入端读回是一条 `corrupted`）。
> **牙验过**：临时让 `packAxsp` 在序列化时改一个字段（给标题加后缀）⇒ 新增 3 条**全红**，还原后 `axsp.test.ts` 18 passed。
> 同时**如实说一句**：那次变异也被既有的两条合成夹具判据抓到，所以新增部分的价值在**输入类别**（真实产物、含 `normalizeBundle` 归一化后的形态），
> 不是新代码路径——这跟今天 `check:citations` 那条"内容层档否掉"的判断是同一把尺子：**能说清判据抓什么，才值得留它**。
>
> 末轮数字（03:19 一次取数）：`pnpm gates` 退出码 **0**、单测 **556 passed + 1 skipped**（core 83 / axs 90 / **editor-core 163** / web 181 / admin 39）。
> 只动测试与文档，产品代码一字未改。

> **桌面生产后端那条零判据的接缝：I4 的形状第一次被单测钉住（2026-10-01 第三十六次续做）**
>
> **先更正我自己的框架**：起手我以为缺陷是"两端没有共享契约"——**不对**。
> `sqlite.test.ts` 与 `memory.test.ts` 都跑了 `runStorageContractSuite` / `runStoragePoolContractSuite` / `runStorageAuthoringContractSuite` 三支，
> 同一套契约确实在两个 Provider 上各验一遍。真正的空档只剩一个，而且更窄也更要命：
> **契约套件跑的是 sql.js 后端，一次都没有实例化 `TauriSqlBackend`**（后者需要桌面壳，CI 里没有壳，桌面壳又零 CI 信号）。
> 于是 I4（`saveNarrative` 原子覆写）在**生产路径**上的保障，全部压缩在那个文件里三个形状，而三个形状**没有一条判据**。
>
> 那个文件还编码了两个"已实证失效"的决策，这类代码最容易被后来者"顺手简化"：
> ① 一批语句 = 一次 `invoke("sql_transaction")`，由 Rust 侧单连接池执行——替代形状（把 BEGIN/COMMIT 当 SQL 文本发）已被池化连接打穿；
> ② `execute` 与 `transactional` 共用一条 Promise 链串行化，保证事务窗口内没有并发写插进来。
>
> 补 7 条判据（`tauriSqlBackend.test.ts`，mock 掉 `@tauri-apps/api/core` 与 `@tauri-apps/plugin-sql`）：
> 一次 invoke 承载整批、**载荷形状逐键钉死**（这是跨语言契约：TS 侧改名不会报错，只会把错误推到壳里。真正静默的那格是 `dbName`——
> Rust 侧 `create_if_missing(true)`，库名写歪就**另建一个空库并成功提交**，而读路仍走插件那个文件 ⇒ 分裂大脑、零报错；
> 反倒是 `params` 漏发只会在带占位符的语句上被 sqlx 挡回来，因为 Rust 的 `struct Stmt` 给 `params` 挂了 `#[serde(default)]`）。
> 顺带查实 `dbName` 这条契约**壳内已有实证**：冒烟的 `saveNarrative-overwrite` 就是"经 `sql_transaction` 写、经插件 `select` 读"读回来的，
> 两边同文件被真壳验过——单测的作用不是再证一次，而是**让它在没有壳的 CI 里改坏时立刻红**。
> 占位符**按语句独立重新编号**（`?` → `$1..$n`，批次里每条各自从 $1 起）、缺省 `params` 补空数组、
> 不发逐条 `execute` 也不发含 BEGIN/COMMIT 的文本、并发两个事务只放一个进 invoke、
> 一处 `execute` 失败后下一条仍真发出、`select` 同样翻译占位符，外加 `isTauriEnvironment` 两分支（`index.ts` 靠它选后端）。
>
> **牙是四次成对变异取的，各红且只红该红的那条**：
> 退回逐条 `execute` ⇒ **4 红**；去掉 `transactional` 里的占位符翻译 ⇒ **2 红**（两条编号断言）；
> 绕过队列直接 invoke ⇒ **1 红**（串行那条）；把 `enqueue` "简化"成 `chain.then(task)`（少掉拒绝腿）⇒ **1 红**，
> 红的方式是**上一次磁盘故障的错误串给下一条无关语句**——队列被污染后故障会伪装成"这条也坏了"。全部还原后 7 passed、`tsc -b` 退出码 0。
> 第一次变异顺带量到一个此前不知道的事实：逐条走 `this.execute` 会在**同一条链上自锁**（外层任务等内层，内层等外层提交），
> 所以那个"简化"不只是丢原子性，它连活着跑完都做不到——这条写进实现文件的头注释，免得下次有人再试。
>
> **同轮拆掉一处替代码撒谎的注释**：头注释原本写"事务原子性最终由壳内冒烟实证，**若池行为不符预期**则原子性下沉到 Rust 单连接命令"，
> 而代码是**无条件**走 Rust 命令——假设语气留着，下一个读的人会以为还有一条 BEGIN/COMMIT 的通路可退。
> 顺带把冒烟那支查实了：`desktopSmoke.ts` 确有 `transaction-rollback`，用重复主键触发真回滚并断言旧状态存活，**这条注释没撒谎**，
> 但它只在 DEV 壳里由人跑，不是门禁——所以判据必须落在 CI 真会跑的 TS 侧。
>
> 又一例「vitest 只剥类型」：新测试首跑 **7 passed**，`tsc -b` 却红（把 `globalThis.window` 断言写成不可比较的类型转换）。今天第三次。**产品代码除注释外一字未改。**
> 顺手把那条注释里的**安全前提从断言改成实数**：`? → $n` 的重写只扫 SQL 文本，前提是"字面量里不含 `?`"——
> 一次只读探针（44 个非测试文件）量到**含 `?` 的 SQL 文本块 66 个，把 `?` 写进单引号字面量的 0 个**，读数与口径限度（扫不到动态拼接的 SQL）一起写进实现文件头注释。
> **没有为此建门禁**：66/0 是"当前为真"的测量，不是需要棘轮的漂移面——按今天的尺子，先量分母再决定要不要留牙。
>
> **末轮取数里拿到一次红，先归因再落笔**：`pnpm e2e:desktop` 第一跑 **36 passed / 1 failed**，红在 E17 内部的 E28 那一跳
> （`.poll(...).toBe(1)`：`goBack` → 重进 → 等「继续游玩」，30s 内全轮返回 0 后超时）；**同一份代码立刻重跑 → 37 passed**（那一跳一次就中）。
> 归因：读 `PlayerPage` 那个「单槽自动存档（slot 0）」effect，它是 600ms `setTimeout` + 卸载时 `clearTimeout`，
> 而测试的下一步正是"断言文案可见 → 立刻 goBack"——**写入被自己的卸载清掉，那一屏于是永远不出现**。
> 这不是新缺陷：它是 task「自动存档的 600ms 防抖窗口」在册那条的**第 2 次观测**（第 1 次的记录里已写明"E28 轮询第一次全红就是撞在这上面"）。
> **所以本轮登记的是一条限度而不是一条修复**：那格定档前，`e2e:desktop` 不能当全绿信号用——今天两次拿到 36/1 → 37/0 这个形状。
> 我没动它：三种修法（卸载即落盘 / 缩短或取消防抖 / 保留现状但让测试显式等过 600ms）都改玩家数据语义，那由用户定。
> 末轮取数：`pnpm test:unit` **563 passed + 1 skipped**（core 83 / axs 90 / editor-core 163 / **web 188**（+7）/ admin 39）、
> `pnpm e2e:desktop` **37 passed**（03:43，退出码 0；即 36/1 那次之后的两次连续绿，今天四样本里 1 红）、`pnpm e2e` **50 passed**（03:43，退出码 0）、`.e2e-lock` 不存在。
> `pnpm gates` 的退出码取在**全部文档改写之后**（`check:citations` 要扫本轮新写的这几段），见本块最后一行。明细同步进 `docs/HANDOFF.md` §4 第十七批与 §5。
> **末次全链（03:45，取在本文件与 HANDOFF 的本轮段落全部改写完成之后）**：`pnpm gates` 退出码 **0**（13 道）——
> `[file-size] 348 个文件 0 越线`、`[doc-citations] 已判定 165、越界 3 全在册、不存在 0`、`[publish-target] 残差 4 全在册`、`git diff --check` **0 行**。

> **把上一条里那条「测量」升成代码守的 fail-closed（2026-10-01 第三十七次续做）**
>
> 上一条留了一句"66/0 是测量，不是需要棘轮的漂移面，所以不建门禁"。**这话只对了一半**：不该建的是**扫描型门禁**（它扫不到动态拼接的 SQL，
> 报的是假安全感），该建的是**运行时的 fail-closed**——因为那条前提是 `translatePlaceholders` 唯一的正确性依赖，
> 而它此刻只活在注释里。下一个作者写一句 `WHERE op = '?'` 得到的不是报错，是**序号错位且执行成功**：`'?'` 里那个 `?` 会被当成占位符吃掉，
> 后面的真占位符集体前移一位，绑值全错而 SQLite 照收不误。这正是今天全天在拆的那一族（`>=` 被降成 eq、空说话人被打回旁白）的存储版。
>
> 落地三行：`translatePlaceholders` 先把单引号字面量扫一遍（正则认 SQLite 的 `''` 转义，所以 `'it''s ?'` 也算字面量内含 `?`），
> 命中就抛 `占位符重写不安全`，**不发出任何语句**；抛点在选择器内部，所以 `select`/`execute`/`transactional` 三条路都过不去。
> 补 3 条判据（现共 **10 条**）：字面量含 `?` 的事务**reject 且一次 invoke 都不发**、转义引号那条同样拦、
> **零误杀对照组**——`VALUES ('inline', 'it''s fine', ?)` 与 `pragma_table_info('projects')` 这类合法字面量必须照常翻译成 `$1`。
> 成对变异：把守卫退回上一条的形状 ⇒ **恰好 2 红**，且红的方式就是缺陷本身（`promise resolved "{rowsAffected: 1}" instead of rejecting`）；
> 对照组两种形状下都绿 ⇒ 这条牙只咬坏输入。全链复绿：`gates` **0**、单测 **566 passed + 1 skipped**（web 188 → **191**）。
>
> **一条如实的范围声明**：这一刀的判据全在单测层，**e2e 两套都加载不到这个模块**——桌面 e2e 跑在 chromium 里，
> `isTauriEnvironment()` 因为 `__TAURI_INTERNALS__` 不存在而返回 false，于是走 Memory 那一支；
> 这条分派条件正是上一条切片刚钉住的第 7 项，所以这个"测不到"现在是**有判据的说法**而不是推测。
> 真壳内的行为仍只有 DEV 冒烟覆盖（与本轮之前一样），这也是为什么修法选"抛"而不是"记一条 warning"：
> 抛出去会被 Provider 收成 `io` 错误、在界面上可读，而静默错位要等到用户看见错乱的存档才会暴露。

> **同一族的第三个实例搬到素材层：摘要降级会把两条在册契约同时弄破（2026-10-01 第三十八次续做）**
>
> 起点还是那句老问法——**这个生产模块有没有判据？** 答案是**一条都没有**：`tauriAssetStore.ts` 是桌面素材落盘的唯一实现，
> 契约套件跑的是 Memory 与 sql.js，e2e 两套又加载不到它（`isTauriEnvironment()` 为 false，那条分派条件昨天刚钉成断言）。
> 读代码时撞上一条**已发布的 ADR 决策本身就是坏的**：`ADR-026` 的「后果」里写着
> 「⚠️ 摘要依赖 `crypto.subtle`；非安全上下文退化为 FNV 内容键，仅用于去重不承担安全语义（代码内已写明）」——
> 而两句话都不成立：**①** `contentKey` 在 `assets.ts` 自己的注释里写明「仅供内存实现与测试做同内容去重，桌面/服务端落盘用 sha256」，
> 桌面拿它当落盘键正是那条注释禁止的用法；**②**「须留痕」在代码里**一点痕迹都没有**，静默换键。
>
> 后果落在用户看得见的那句承诺上：用户文档写「素材文件名是它内容的 SHA-256…**工程包在别的电脑上打开时能认得同一个文件**」。
> 一旦某台机器走了降级支，它的文件名在别的机器上算不出来 ⇒ 同一张图存两份、可携带性失效，**而 `write` 照样返回成功**。
> 这就是今天全天那一族（`>=` 被降成 eq、空说话人被打回旁白、`?? "eq"` 兜底）在存储层的第三个实例：**静默降级伪装成合法**。
>
> 修法：删掉兜底，不给它加痕迹。**缺 `crypto.subtle` 就抛**，`write` 把这次抛收成语义明确的
> `err(io, 「素材摘要不可用（缺 SHA-256），已拒绝落盘」)`，**一个字节都不落盘**。
> 判据 7 条（该文件首批）：已知向量钉死 ref 就是 SHA-256（`sha256("abc")` 那 64 位十六进制）、无 subtle 时不降级且 `writeFile` 一次都不发、
> 同内容第二次写不重复落盘、空字节 io、外部 URL 形态的 ref 不去拼路径、缺文件 not_found、读失败 io。
> **牙＝三次成对变异**：恢复兜底 ⇒ 1 红；把摘要换成非加密键 ⇒ 2 红（向量条 + ref 形状条）；去掉 `exists` 守卫 ⇒ 1 红（幂等条）。
> 先红后绿的顺序也照旧：守卫写之前那条降级判据就是红的，红法是 `expected true to be false`——**降级写今天会成功**。
>
> **一条改判的分寸**：这撤销了一条已发布的 ADR 决策，所以我没改写它那行历史文本，而是**在 ADR-026 末尾另起带日期的补记**，
> 把「依据是两条在册契约相撞，不是观感」、实测判据与变异读数都写进去，并**把替代修法留给用户**
> （若优先级其实是「任何环境都得能存」，就该保留兜底但把降级显性化——代价是 ref 命名契约改变、ADR 与用户文档都要重写那段）。
> 改动局限在一个函数的一条分支 + 一个 try，回退成本低。用户文档同轮补一句"这种环境会失败并说明原因，而不是给个别的电脑认不出的文件名"。
> **末轮（03:57）**：`pnpm gates` 退出码 **0**（13 道）、`pnpm test:unit` **573 passed + 1 skipped**（core 83 / axs 90 / editor-core 163 / **web 198**（+7）/ admin 39）、
> `[file-size]` 扫 **348 个文件 0 越线**（两份新测试文件都在限内）、`[doc-citations]` 已判定 165 / 越界 3 全在册。
> **中间红过一次，红得有价值**：`gates` 第一跑退出码 **1**，`tsc -b` 报 `Property 'detail' does not exist on type 'StorageError'`——
> 我在测试里直接读了联合类型的 `detail` 字段，**而 vitest 全绿放行了**（今天第 4 次同一课）。修法是先用 `code === "io"` 收窄再断言，
> 并把"这里必须先收窄"写在测试注释里；改完 7 条仍全绿、全链 0。
> **本轮未跑 e2e**，理由与上一轮同：改的是 `TauriAssetStore`，两套 e2e 都加载不到该模块（分派条件有在册断言）。

> **门禁自己被客户抓了一次：`check:citations` 的基线键里带着文档行号，于是"写文档"这件事本身在制造假新增（2026-10-01 第三十九次续做）**
>
> 现象：写完两批之后跑 `check:citations`，它报 **3 条新增悬空/越界**并退出码 1。三条**全是在册的历史引用**
> （ScriptEditor 的第 572 行、parse 的第 391 行、parse 的第 417 行），内容一个字没改——它们只是被我在它们上方插入的那些段落**顶下了十几行**。
> 根因在身份键：基线项写成「某文档 第 1939 行 越界 → parse 第 417 行」，把**位置当成了身份**。
> 后果比"烦"严重得多：这道棘轮每写一段文档就假红一次，而假红的标准处置是 `--update`——
> **那就等于每写一段文档都把漂移重新登记成合法**，棘轮实质上等于没关（既有条目「具名豁免基线要随修完缩短否则棘轮等于没关」的另一面：键不稳的基线会**随写作变长**）。
>
> 改法：**身份键去掉文档行号**，只留"哪个文档指向哪个文件哪一行"（形如「某文档 → parse 第 417 行 + 句子指纹」），打印时仍带当前行号好让人去修。
> 方法收成一句：**棘轮的键必须只用"被改动时不变"的量**——这里不变的是"引用所指的目标行"，会变的是它今天坐第几行。
>
> 四条腿各验一次（不是只验"现在绿"）：
> ① **该放**：`--update` 重取基线 ⇒ 3 条在册、退出码 0；
> ② **位置稳定**（这次修复的正判据）：在宪章顶部临时插一行，把那三条在册引用顶下一行 ⇒ 仍然 OK；探针行随即删除、文件行数复原；
> ③ **该拦**：临时探针文档放一条 `parse.ts` 第九万九千九百九十九行 与一条不存在文件 ⇒ **FAIL / 退出码 1** 并逐条点名（带当前行号），删净后 OK；
> ④ **复述不绕白**（去掉行号后新开的口子）：在宪章末尾临时加一句"同一个坏目标、不同句子"的引用 ⇒ **FAIL 且点名那一句**，删净后 OK。
>
> **④ 不是我设想出来的，是它自己浮出来的**：修完 ① 那次跑全链，门禁报 **OK**，但计数从 `已判定 165 / 越界 3` 变成 `172 / 越界 8`。
> 多出的 5 条正是我**为了解释这道门禁**而在新段落里原样复述的那三个在册目标——键里去掉行号后"同文档 + 同目标"归成一个键，
> 于是一条白名单白掉了任意多次复述。**教训两条**：
> (a) **门禁报 OK 但计数变了向也要归因**——退出码 0 不是绿灯的全部，分母变大本身就是要查的东西（它与"全量里一个 F 就足以否掉四项局部绿灯"是同一条纪律的镜像）；
> (b) **文本扫描型门禁的第一批客户还是你自己**：写解释时把坏坐标按可搜索的形态抄了一遍。处置是**改我自己的句子**
> （写成"ScriptEditor 的第 572 行"这类非引用形式），**而不是把 5 条复述登记进基线**——后者会把棘轮从 3 条放宽到 8 条，等于用豁免来修误报。
> 读数：`已判定` 回到 **167**（比 165 多的两条是上一批那两条真引用，其中一条把落点从注释行校正到 143 与 144）、`越界 3` 全在册、退出码 0。
> 另记一次：删探针时我在文件末尾留下一个空行，被 `git diff --check` 抓到并清掉（**今天第二次**——这道最土的空白检查两次都真挡下了东西）。

> **`.axsp` 导入的回滚契约零判据，顺测量到"同一个包导两次必失败"（2026-10-01 第四十次续做）**
>
> 老问法问出来的第四个生产模块：`importProjectFromAxsp` 在工程建好之后有 **7 个失败出口**，每个都调 `rollback` 删掉半建的工程，
> 函数头写着「让调用方拿到一次干净的失败，而不是留下半套内容」——**这条承诺一条判据都没有**（既有 `axspRoundTrip.test.ts` 走的全是成功路径）。
> 补 `axspImport.rollback.test.ts` **9 条**：对照组（不注入就成功）+ 7 个出口各注入一次失败并断言工程列表回到空 + **一条如实的残留特征化**。
> **牙＝两次变异**：整条回滚拆掉 ⇒ **8 红且对照组仍绿**；只漏最后一个出口（道具引用那条，正是"新加一个失败点忘了配回滚"的形状）⇒ **恰好 1 红且点名该出口**。
> 每次变异后都 `git diff --stat` 复核过被改文件**回到 HEAD 一字未动**——这条今天特别重要，因为我在产品文件里做了两次手术。
>
> **测残留时抓到一条更大的**：失败路径能删工程，但**删不掉本次新建的角色**——不是代码漏了，是 **L4 契约里根本没有删除角色的方法**
> （契约面只有 `saveCharacter` / `listCharacters` / `getCharacter`）。函数头那句"不留半套内容"因此只兑了一半。
>
> **顺带把这条线的可达性量成了实数**（探针实测，同一条节点 id 分别写进两个真 SQLite 工程）：`first.ok=true / second.ok=false`，
> 错误 `io「saveNarrative 事务失败已回滚」`。两条在册事实拼出成因：`project_nodes.id` 是**全局主键**，而导入只重映射**角色 id**、节点 id 随包原样插入。
> ⇒ **同一个 `.axsp` 导第二次一定失败**，用户看到的是一句看不懂的错，且每重试一次多一组孤儿角色。
> 这一条**不在本轮修**：三条候选（节点 id 一并重映射／把主键改成复合键／导入前查重给提示）都动包内标识语义或本地库 schema，属产品决策，
> 已带实测数字登记为待决（推荐第一条，因为它让"包内 id 是包本地的"这条既有语义终于一致——角色已经是这么做的）。
>
> **另一条测试宿主事实值得留档**：node 环境没有 `localStorage`，`getCreatorId()` 的兜底分支**每次调用返回新的随机 id**——
> 桌面壳里 `localStorage` 存在所以不是产品缺陷，但不桩定它，按 `authorId` 过滤的残留断言就会红在宿主上（我第一次跑就是这样）。
> 桩成常量之后，那条判据量的才是产品语义。**方法**：断言按归属范围读数据时，先问这个范围键在测试宿主里稳不稳。

> **同一条纪律还救了一次假红**：残留条最初用不带范围的 `listCharacters()` 断言"有 1 个残留"，实数 0——
> 无范围只回**公开**角色，而导入的角色一律不继承公开位 ⇒ 读错范围会把残留伪装成"没有残留"。改成带 `authorId` 读，并同时钉住"公开面确实是 0"。

> **"两条通路守同一条契约"那条配对判据被证明只测了它自己的夹具：同名既有节点复用什么，两边给不同答案（2026-10-01 第四十一次续做）**
>
> 起因很朴素：把待决清单里"S13-7 两套 AXS→图 要不要归并"拿去对着**当前代码**核一遍。清单写的是
> "`beatToNarrative` 与 `beatToNarrativeData` 是否逐字段等价未核对"——**那个符号今天早些时候（第三十八批那次归一）已经不存在了**，
> 所以这句话今天指不到东西。但归并并没有真的做完：剩下的不是字段映射，而是**两处各自写的策略**。对着函数体 diff 出两条真分歧：
>
> 1. **同名既有节点复用哪一个**：通路一（草稿事务 `importAxsDraft`）建标题索引时是**第一个赢**（`if (t && !titleToId.has(t))`），
>    通路二（Writer 保存 `parseAxsToPlan`）原来是 `new Map(existing.map(...))`——**最后一个赢**。
>    同一份源文本，"改 A"还是"改 Z"取决于走哪个入口。
>    **在册那条配对判据抓不到它，因为它的夹具只给了一个同名节点**——配对判据的覆盖面等于它夹具的分母，
>    所以"两套实现是不是同语义"必须读函数体判，不能读判据的名字判（这正是「登记两套实现=两种语义之前先 diff 函数体」那条的用处）。
> 2. **什么样的 `beat.id` 算既有节点身份**：`axsImport.ts` 的 `NODE_ID_RE` 与 `projection/axs.ts` 的 `UUID_RE` 是**同一串字面量抄两遍**。
>    今天不出问题，出问题的是"下次只放宽一边"，而两条通路守的是同一条确定性（I5）。
>
> 处置是**归一而不是登记**：策略统一成第一个赢（对齐工单「AXS 应用回草稿时同名 Beat 会塌到同一个节点」已经定过的语义，不是我新下的判断）；
> 正则收成一条导出的谓词 `isReusableNodeId`，两条通路各自调用——**"两侧不同判"从此在结构上不可能**，这比"钉住两侧一致"更好。
> 补 2 条判据（editor-core 163 → **165**）：一条断"两条通路对同名既有节点必须复用同一个（第一个赢）"，
> 一条断"UUID 形态复用其 id、包内序号 `开场-2` 走标题复用"，两条都同时比较两路结果。
>
> **归一类重构的判据必须双向，两次变异各打一面**：
> 把通路二钉回 `new Map(existing.map(...))` ⇒ **恰好 1 红**，点名 `expected 'keep-2' to be 'keep-1'`，
> 而**旧的配对判据仍然绿**——这就是新夹具存在的理由；
> 把共享谓词放宽成"任何 id 都可复用" ⇒ **6 红**，新增那条"同判"在名单里。
> 两次都用备份文件原样还原（`grep` 复验还原点），还原后该文件 36 passed、`tsc --noEmit` 退出码 0。
>
> **待决清单因此少了一条的一半**：S13-7 那条"要不要归并"现在只剩"两个入口的外层循环与返回形状要不要合成一个"——
> 字段映射、落位公式、可复用 id 判定、同名复用策略**四处已经同源**。剩下的那个问题不改语义，收益是少一份循环体，代价是动两条通路的调用签名。
> 末轮（04:28）：`gates` **0**、单测 **584 passed + 1 skipped**（editor-core **165**）、`e2e:desktop` **37 passed** 退出码 0、`git diff --check` 0 行。

> **把"生产模块零判据"从手工发现升级成第 14 道门禁 `check:seams`（2026-10-01 第四十二次续做）**
>
> 这一天里我**手工**撞三次同一个形状：`tauriSqlBackend.ts`（I4 的事务形状）、`tauriAssetStore.ts`（摘要静默降级）、`axspImport.ts`（7 个失败出口的回滚）。
> 三次都是"读到那个文件才发现没判据"，这不可复制。所以问一句：**有没有一条机械可判的特征，能把这一族一次性圈住？**
> 选中的特征是 **直接 `import` 了 `@tauri-apps/*`**：这类模块只在桌面壳里被执行，而壳零 CI 信号、契约套件只跑 Memory/sql.js——
> 换句话说"没有同名测试"在这类文件里等价于"发布产物里有一段没人验过的代码"。分母实测 **6 个**，其中 4 个有判据、2 个具名登记（各写理由）：
> `desktopSmoke.ts`（冒烟本身是判据的载体，不是判据的对象）、`index.ts`（分派口，桌面那一支的三个组件已各自有判据，剩下"选哪一支"要 mock 六个模块）。
>
> **两层判据，第二层是被自己逼出来的**：光要求"存在同名测试文件"会被一个空壳测试骗过；于是再加"该测试必须真的 import 被测模块"。
> 配套的结构性发现：**基线键不分层就会开后门**——如果键只是文件路径，那么给一个在册模块补个不引用它的空测试，
> 违规换了档（缺测试 → 测试未引用）而键没变，基线照样吸收。所以键写成 `文件#no-test` / `文件#no-import`，
> **腿二实测**：给在册的 `index.ts` 放一个不引用它的桩测试 ⇒ FAIL 点名 `index.ts#no-import`（基线不吸收）✓。
> 三层判据齐（该拦／该放且清干净／`--update` 可缩短），并且**退出码单独取**——我在这条上今天已经吃过一次管道里 `$?` 是 `head` 的亏，
> 这次直接 `> /dev/null 2>&1; echo $?`：桩在 **1**、删净 **0**。
>
> **新门禁的第一批客户还是我自己**：`assetContext.ts` 本来进了基线，我当场补 5 条判据把它摘出来——
> 那是"立绘显不显示"的最后一跳，出错方式是**图不出现且没有任何错误可查**（桌面拼 asset 协议、浏览器态给空串、越界 ref 一律空串、可直显的原样透传、空引用不抛）。
> 牙验过：把 `localRoot ? convertFileSrc : undefined` 摘成 `undefined` ⇒ **恰好 1 红**，红在"asset 协议没被调用"那一条；还原后 5 全绿。
>
> 接线三处同轮（这是在册纪律）：`package.json` 的 `check:seams` 脚本 + `gates` 链 **13 → 14 道** + `README.md` 门禁表补一行；脚本头写自报限度
> （只看 `apps/web/src`；第二层不检查"import 之后断言了什么"，那是每刀交付时变异取证的活，不是脚本的活）。
> 末轮（04:38）：`gates` **0**（14 道）、单测 **589 passed + 1 skipped**（web 207 → **212**）、`git diff --check` 0 行、`[doc-citations] OK`。

> **分派口不再是黑箱：`createStorageProvider` 的三条支路各有一条判据，接缝基线当场从 2 缩到 1（2026-10-01 第四十三次续做）**
>
> 上一道门禁留下的两条在册里，`index.ts`（Provider 工厂）那条我写着"要 mock 六个模块，先留册"。真去做之后**结论变了**：
> mock 面没那么大——`@tauri-apps/*` 三个包一个都不用碰，只替换本地的 `./tauriSqlBackend` / `./tauriAssetStore` / `./httpStorageProvider` /
> `./desktopSeed` / `./axspImport`，再让 editor-core 两个真 Provider 跑起来就够了。而它守的三条不变量**只有工厂自己知道**：
> ① **素材根目录必须在播种之前登记**——首启会播种示范作，晚一秒，播种进去的立绘在首屏就解析成空串（用户看到的是"官方示范作没图"，没有任何错误可查）；
> ② 播种**每进程一次**（`seedOnce` 记忆化），且 `getStorageProvider()` 每次问都要拿到同一个实例；
> ③ `?storage=memory` 那支**只替代存储、不替代壳能力**：它不得去建 `TauriAssetStore` —— 这条原本只在文档里的边界，从此有机器判据。
>
> **三次变异里有两次根本没落进去，都被"先验命中"抓回来**（本会话关于变异取证最直白的一课）：
> 想打"让 memory 支不再短路"那一刀时，`perl` 模式要求 `&&` 后带空格，而源行是 `&&` 换行 ⇒ 替换没发生而测试照绿；
> 第二次补验命中，`perl` 又命中了**注释里同名的 `import.meta.env.DEV`**（代码行未变）⇒ 又照绿；
> 换成只可能命中代码的形状（`import.meta.env.DEV &&`）并**先 `sed` 打印出被改的那一行**再跑，才拿到真正的红
> （`expected SqliteStorageProvider{…} to be an instance of MemoryStorageProvider`）。
> **方法**：变异"跑绿"先怀疑没写进去——`grep` 出被改的行，再谈红。三条各红一次（1/1/1），每次以 `cp` 备份原样还原，末了 `git diff --stat index.ts` 为空。
>
> 另一个坑单独记：`vi.resetModules()` 之后**顶层静态 import 的类**与工厂自己 import 的已经是两个不同对象，
> 直接 `toBeInstanceOf(MemoryStorageProvider)` 会假红（我就真红了一次）。判据要么从同一份新模块图里动态取类，要么比构造器名。
> 末了把测试文件按门禁的命名约定改成 `index.test.ts`（只有同名兄弟文件算覆盖），`check:seams` 当场缩短：`有判据 4 → 5`、`基线在册 2 → 1`，
> 只剩 `desktopSmoke.ts` 那条带理由的在册项——**棘轮在它上线的第二天就变短了一次**。
> 末轮（04:46）：`gates` **0**（14 道）、单测 **593 passed + 1 skipped**（web 212 → **216**）、`[desktop-seams] OK 6 个：有判据 5、缺测试 1、基线 1`、`git diff --check` 0 行。

> **最后一个非云、非冒烟的无判据模块：存储态→传输态投影的三处"刻意缺席"钉住了（2026-10-01 第四十四次续做）**
>
> `assetRecords.ts` 只有两个纯函数，但它存在的理由写在文件头里：本地 Provider 只给存储态，页面消费 REST 响应形状，
> **映射散进 hooks 就会长出两套字段口径**；而它的第二重意义更容易被"顺手清理"改掉——**本地拿不到的数要如实缺席，不许编一个值**。
> 具体那处：道具/舞台卡片的「N 个剧本引用」角标靠 `ref_count === undefined` 隐藏；谁把它"对齐"成 `0`，界面上就出现一个谁都没数过的「0 个剧本引用」。
> 而道具那一支**连这个键都不该有**，舞台那一支**键要在、值为 `undefined`**——同一个词在两个响应里刻意不对称，这正是最容易被人统一掉的东西。
>
> 补 7 条判据，钉的全是"看起来像洁癖、其实是事实来源"的四类：
> ① 两支响应**键集合不多不少**（口径只有一处的机器表达）；② `ref_count` 的三处不对称（道具无键 / 舞台键在值缺 / `view_count` 恒 0）；
> ③ **数组是拷贝**（道具的 `effects`/`mechanism_tags`、舞台的 `tags`/`node_templates`）；④ 可空字段原样透传、`authorId` 为空折成空串、`created_at` 如实等于 `updatedAt`。
> 第 ③ 类特别值得记：**别名缺陷类型系统看不见**——`readonly string[]` 直接赋过去照样通过 `tsc -b`（那次退出码 0），
> 只有"改响应不许脏写存储记录"这种**行为判据**能挡；这也是为什么第 ② 类要写成 `"ref_count" in r` 而不是只看值。
>
> 三次变异**每次都先 `grep` 出被改行再跑**（上一批的教训当场兑现）：去掉 `effects` 的展开 ⇒ 恰好 1 红（别名那条）；
> 把 `ref_count: undefined` 对齐成 `0` ⇒ 恰好 1 红（舞台缺席条）；给道具也补一个 `ref_count: 0` ⇒ 2 红（键集合条 + 道具缺席条）。
> 三次都以 `cp` 备份还原，末了 `git diff --stat assetRecords.ts` 为空、7 条仍全绿。
> 末轮（04:51）：`gates` **0**（14 道）、单测 **600 passed + 1 skipped**（web 216 → **223**）、`git diff --check` 0 行、`[desktop-seams] OK 6 / 5 / 1 / 1`。

> **第 14 道门禁自己那条"故意留的限度"关掉了（2026-10-01 第四十五次续做）**
>
> 这一刀的对象不是产品代码，是我上一批自己写的判据。`check-desktop-seams.mjs` 的脚本头当时写着：
> 「判据 2 只检查有没有 import，不检查 import 之后断言了什么——一个只调用不判断的空壳测试仍然算过」，
> 并给了理由「机械可判的下限是通路被跑到，断言有没有牙要靠变异取证，不是本脚本的活」。
> **这句话一半是托词**：相关性确实判不了（见下），但"这个文件里到底有没有断言"从来就是机械可判的；
> 把它写成"不是我的活"，等于给最容易顺手交出的那种判据——`import` 了、函数调了、一条判断都没写——免了检。
> 本会话已经撞过两次"生产模块零判据"是靠人正好读到文件才发现的，判据自己留这个口子就是把这个失败形状重新放回去。
>
> **先量在册真值再上档**（否则交付即红，是我自己的在册纪律）：扫面内 6 个接缝，5 份在册测试的真断言数 **11 / 9 / 15 / 20 / 28**、
> 恒真断言 **0** ⇒ 新档今天不误伤任何人，不需要例外条目。计数用两份独立实现各量一遍（临时探针脚本 vs 门禁本体），
> 结果一致（合计 **83**）才敢当成基线。
>
> **补成三层**：第 3 层数 `expect(...)` / `assert(...)`，**先按行剥掉注释**（`// expect(...)` 是判据的自述，不是判据），
> 再把 `expect(true)` 这类恒真断言从计数里扣掉——扣完为 0 ⇒ 档位 `#no-assert`；文件里只要还留着恒真断言 ⇒ 另记档位 `#trivial-assert`
> （今天 0 条，所以这一档也不需例外）。分档计数照旧全打印，并新增一项「真断言合计」——
> 它同时是这条检测器自己的防退化读数：正则哪天恒真，这个数会先动。
>
> **四腿取证**（临时探针 `apps/web/src/__probe_seam.ts` + 同名测试，跑完当场删净）：
> ① 干净树 `OK 退出码 0`；② 只调用不判断 ⇒ `FAIL 1` 点名 `#no-assert`；
> ③ 一条真断言 + 一条恒真 ⇒ `FAIL 1` 点名 `#trivial-assert`，且「真断言合计」只从 83 变 **84**
> （这一条顺带证明了恒真那条没被算进证据——**如果它被算进，这里会是 85**）；
> ④ 断言只写在注释里 ⇒ 回到 `#no-assert`（证明剥注释那一步不是装饰）。
> ⑤ 删净探针后复跑 `OK 0`，`git status` 回到 **61 ` M` / 17 ` D` / 26 `??`**、`git diff --check` **0 行**。
>
> **剩下的限度如实写回脚本头，并附"为什么做不到"的证据**：判得了"有没有断言"，判不了"断言说的是不是这个模块的事"——
> 一份测试可以 import 本模块、把断言全打在别的东西上仍然算过。要机械判相关性就得把断言表达式与模块的导出符号配对，
> 而配对要理解作用域；同一天 `check:citations` 试做内容层那次已经量过代价：**52 条可判引用里误报 38%**，成因正是这种没有机械邻近关系的配对。
> 所以限度改写成两条明确的：相关性不可判（不再假装是"不是我的活"）+ 断言有没有牙仍归每刀交付时的变异取证。
>
> 末轮（05:06）：`gates` **0**（14 道，`[desktop-seams] OK 6 个：有判据 5（真断言合计 83）、缺测试 1、无真断言 0、含恒真 0、基线 1`）、
> 单测 **600 passed + 1 skipped** 未变（这一刀没加测试，只加判据的强度）、`git diff --check` 0 行。

> **门禁的扫描面从"一厢情愿"改成实测：抓到 2 个上一版按定义看不见的无判据壳模块（2026-10-01 第四十六次续做）**
>
> 触发点还是脚本头那条自报限度：「只看 `apps/web/src`；`packages/*` 的内核模块不在面内（它们由契约套件与 coverage 门守着）」。
> 上一批我拿这条当"已知边界"接受了。但**它从来没被测过**——"packages 由契约套件守着"是一句推断，不是读数。
> 于是做一次全仓普查（临时脚本落在 `/tmp`，不进仓库）：扫 `apps/` + `packages/` + `e2e/` + `scripts/` 共 **416** 个源文件，
> 同时试两种形状：`@tauri-apps` 引用、以及"像在用 `invoke(...)` 调壳"。
>
> 读数（**两种形状都不是白试的**）：
> ① `@tauri-apps` 在 `packages/*` 命中 **0** ⇒ 扩根今天不减分，但把假设变成了不变量；
> ② 形状从"引用 Tauri"扩到"引用 Electron 主进程桥"抓到 **2 个真模块**：`apps/nexus/electron/main.cjs`（45 行）与
>    `apps/nexus/electron/preload.cjs`（5 行，`contextBridge.exposeInMainWorld`，唯一的桥就是 main 里那条 `ipcMain.handle("nexus:get-version")`）；
> ③ 顺带证伪了自己的宽形状：`invoke(` 这一档还会命中 `e2e/desktop-http.spec.ts` 与门禁脚本自己（**3 命中 2 假阳**），
>    所以最终采用的不是"提到 invoke 就算"，而是"引用 `electron`/`@tauri-apps` 这两个模块名才算"，且 `scripts/`、`e2e/`、`*.test.*` 结构性排除——
>    **排除的理由是它们不进发布产物**，不是"看着烦"。
>
> 一个容易漏的细节：旧面按 `/\.(ts|tsx)$/` 过滤扩展名，而 `preload.cjs` 是 `.cjs` ⇒ **就算把根扩到 `apps/`，那一版也还是打不开这个文件**。
> 所以扩根、扩形状、扩扩展名是三件事，只做前两件会得出一份"我扩面了"的假读数。
>
> **为什么这两个不顺手补测试**（这是本条最需要留痕的判断）：`apps/nexus` 没有测试设施（vitest 只给 admin 建过）；
> mock 整套 `app`/`BrowserWindow`/`ipcMain` 之后的判据只验 mock；而最根本的是 **nexus 的处置挂在 `ADR-029` 未决清单第 2 条**
> （`sendToInbox` / `aiApi.suggestCharacter` 判死还是本地化）——给一支可能判死的 Electron 壳搭测试设施等于替用户做决定。
> 处理方式是**具名基线登记**（各带理由，且理由里写了可测面到底有多大），棘轮从 1 条在册变 3 条在册。
> 面变大 + 在册变多**不是放宽**：判据强度没降，而任何新增的壳耦合模块仍必须自带测试。
>
> **牙**（扩面的判据必须证明扩到了）：临时放 `packages/ui/src/__probe_shell.ts`（引用 `@tauri-apps/api/core`、无同名测试）
> ⇒ FAIL 点名 `packages/ui/src/__probe_shell.ts#no-test`、接缝数 **8 → 9**；删净 ⇒ 回到 8、退出码 **0**。
> 探针当场删除（`ls` 取不到该文件），末了 `[desktop-seams] OK —— 桌面接缝 8 个：有判据 5（真断言合计 83）、缺测试 3、基线在册 3`。
>
> **可复用的收获**：给自己写的门禁登记"限度"时，**要分清"测过的限度"和"假设的限度"**——后者往往是免费的扩面对象。
> 这次如果没有普查，nexus 那两个壳模块会一直处在"门禁说 OK，所以没人记得它们存在"的状态；
> 而现在它们带着理由在册，并且**给了 `ADR-029` 未决第 2 条一个实测分母：nexus 的壳耦合代码总共 50 行 / 2 个文件、功能只有一个（读版本号）**。

> **入口那条"冒烟该不该跑"的判据：从活在注释里，到被 6 条判据钉住（2026-10-01 第四十七次续做）**
>
> 线索来自普查的另一半：上一批把面扩到 `apps/` + `packages/` 后，我怀疑**形状本身还缺一类**——不 import 壳包、直接读全局句柄的代码。
> 实测确认：`apps/web/src/main.tsx` 的冒烟触发条件读的就是 `window.__TAURI_INTERNALS__`，而旧形状只认 `@tauri-apps` / `electron` 两种 import ⇒ **结构性看不见**。
> 这句判据是承重的，且原注释把代价写得很清楚：e2e 桌面态注入的正是空对象 `__TAURI_INTERNALS__`，
> 若按"存在性"判，冒烟会在测试宿主里真调 plugin-fs / plugin-sql，抛 `invoke is not a function` 的未捕获异常（注释记的是"实测两条"），把被测界面自己搞坏。
> **但这条差异只存在于散文里**——没有任何判据挡着下一个人把它"顺手归一"成 `isTauriEnvironment()`。这正是本项目"注释替代码说话"的老形状，本会话已修过两处（#98、#100）。
>
> **做法**：把判据抽成 `apps/web/src/shared/storage/shellSmokeGate.ts`（`shouldRunDesktopSmoke(env, host)`，纯函数、零依赖，
> **刻意不把冒烟模块静态引进入口**——那会把整个存储栈拉进 `main.tsx` 的加载图，违背原来的懒加载设计），补同名测试 6 条：
> 真壳+DEV 跑 / **e2e 注入形状不跑** / 生产不跑 / 无全局与 `undefined`、`null` 都不跑且不抛 / `invoke` 存在但不可调用不跑 /
> **最后一条钉语义差**：同一个注入形状下 `isTauriEnvironment()` 为真而本谓词为假 ⇒ 谁合并两者就红。
>
> **牙**：把谓词"简化"成 `internals !== undefined`（就是注释警告过的那个写法）⇒ **3 条红**；`cp` 还原后 `diff -q` 与原文件一致、`tsc -b` 0、6 条复绿。
>
> **门禁跟着修两处**：形状补两档（`__TAURI_INTERNALS__`、`contextBridge|ipcRenderer`）；
> 而第一版**形状匹配吃的是全文**，于是 `main.tsx` 只因为**注释里解释了为什么不用那个全局**就被登记成无判据接缝——
> **负向文本守卫被自己的解释喂饱**（同会话第二次撞上，第一次是 `check:purity` 的行尾注释）。改成只吃 `codeOnly()` 剥注释后的代码；
> 残留限度照实写进脚本头：行尾注释与块注释中段行仍算命中，方向是"多判一个待登记"而不是漏判。
> 顺手登记一条**不处置的观察**：`navigator.clipboard.writeText` 共 **5 处**调用点全在无同名测试的页面 `.tsx` 里；
> 它在 Tauri WebView 里是否真会静默失败属运行时事实、本机无壳不可判，算进门禁会逼第一版就登记 5 条基线并稀释"壳耦合"这个概念，
> 所以既没进脚本、也**故意不占 §6 的共享编号**，只在 §4 第三十批留一句可追查的观察。
>
> 末轮（05:24）：`gates` **0**（14 道）、`[desktop-seams] OK 9 个：有判据 6（真断言合计 94）、缺测试 3、基线 3`、
> 单测 **606 passed + 1 skipped**（web 223 → **229**）、`tsc -b` 0、`git diff --check` 0 行、`git status` 62/17/28。



**非目标**：不为多人协作做本地替身（不实现 CRDT / 同步协议 / 离线评论队列）——那是另一条产品线，随 web 一起退场。**验收**：全仓 `grep -rn "/api/v1" apps/web/src` 只剩测试宿主所需或为 0；桌面是唯一构建与发布目标；gates 与新基线全绿；`backend/` 已不存在且桌面功能无回归。

> **这行验收的机械复核（2026-10-01 02:38 实测，逐条读数见 `docs/HANDOFF.md` §6 顶部那条带日期的块）**：
> 四条里**两条达成**（gates 与三份具名基线全绿；桌面功能无回归有 `e2e:desktop` 37 / `e2e` 50 的读数），
> **两条未达成且都卡在决策**：`backend/` 仍在（删除面要等 13 条 `baselines` 归属与 `.axsp` 播种权威两条定档才量得出）；
> "唯一发布目标"在脚本层达成（`build` = `build:desktop`）但发布声明层没达成——残项是**可点名的三项**：
> CI 里那段 `pnpm build:web && pnpm build:admin`、`vercel.json`（仍追踪，685 B）、`docker-compose.yml`（仍追踪）。
> 另外「`/api/v1` 只剩测试宿主所需」这条**判据本身不可判**：实数 12 处 = 测试 9 + 注释 1 + 传输基址定义 1（`shared/api/client.ts`，桌面态根本不 dispatch 进那几条 http provider）；
> 建议的可判措辞写在那条复核块里等定档。本轮无代码改动。

---

> **task #70 的分母：那 13 条 `baselines` 到底依赖什么（2026-10-01 第十九次续做，只读取数，为决策供弹药）**
>
> 定档问句换成"这 13 条归谁"之后，"归离线到底要不要新能力"是决定它的关键，而这一格此前没人量过。逐条量完（`grep` 端点形状 + 本地契约导出名对拷）：
> - **测试数**：`baselines.spec.ts` 里 13 条 `test()`，标题 E1–E13。
> - **它们打的端点形状只有 8 个**：`POST /characters/`（4 个使用点）、`GET /characters/{id}`（2 个使用点）、
>   `POST /editor/projects/`、`GET|PUT /editor/projects/{id}`、`POST …/scenes/{sid}/nodes`、`PUT …/scenes/{sid}/nodes/{nid}`、
>   `…/projects/{id}/roles`、`…/projects/{id}/edges`。其中除 6 处 `${API}/characters…` 直接写在 spec 里，其余全部经 `e2e/helpers.ts` 的夹具。
> - **本地替身的形状完全不同**：本地没有"逐节点/逐边/逐角色"的端点，而是**一次原子覆写**
>   `saveNarrative(id, { nodes, edges, axsSource })`（`packages/editor-core/src/storage/memory.ts` 第 156 行；
>   契约用例 `storage/contract.ts:42,60,79` 与 `storage/contractAuthoring.ts:103,211,262` **同跑 Memory 与 SQLite 两支**）。
>   工程级 CRUD 走 `projectSaves.createProject/deleteProject`，资产池走 `assetPoolSaves.*`，传记走 `storySaves.*`——
>   `*Saves.ts` 里 30 个导出 async 函数**全部有本地分支**（`check:dispatch` 刚实测 5 文件 / 30 函数、形状 `positive-block=4 / after-guard=26`）。
> - **所以给决策的结论是一句话：搬这 13 条不需要新能力，需要的是把夹具从"逐节点 POST"改写为"一次 saveNarrative"**，
>   外加桌面态那条已验证的换页写法（SPA 路由而非整页 reload——`?storage=memory` 是模块态，整页重载会清空，E39 踩过）。
>   代价要同时说清：改写后它们验收的是**本地路径**（这正是它们该做的），但**后端 REST 契约那一层覆盖就没了**——
>   这正是 #70 两个选项真正的分歧点，不是"要不要留着一堆测试"。
> - **顺带一处路径漂移**：`docs/KERNEL_DESIGN.md:155`（**2026-10-09 复核：这个行号已经搬家**，那句现在在「状态（2026-08-26）」那段、约 `:167`；
>   这正是 `check:citations` 的在册限度——它只保证行号落在文件范围内，不保证那一行还是当初那段代码，所以引用**优先写小节名而不是行号**）
>   写着契约落地在 `packages/editor-core/src/storage.ts`，
>   今天该文件不存在——实际是 `packages/editor-core/src/storage/` 目录（`contract.ts` / `memory.ts` / `contractAuthoring.ts` 等）。
>   按同一惯例带日期更正，不改写那句历史判断本身。**引用规约文档里的路径也要 grep 证明它今天还在**——这条今天已经在我自己身上验证过三次（E29、E20、这一处）。

## 附录 · 阶段收尾检查单（G10 执行件）

```
[x] G1–G9 全绿（或偏差已在本文件显式记录并说明理由）—— v0.6：tsc 0 error；axs 20 / core 49（含 S1-T3a 新增 3 例） / editor-core 85 / web 29；oxlint 0 error（3 史前 warning）；golden 6/6；G2/G4 偏差见上
[x] E2E 行为基线全绿（G3 六条起，按阶段递增）—— v0.6：11/11（E1-E11，14.7s）
[x] 手动验收路径走通，步骤写入交付说明 —— v0.6：RN 闭环三步写入 BLUEPRINT_v0.6.md §6；自动化等价全绿（E11 + roundtrip + conditions 30 例），人类接受 E11 为等价证据放行
[x] 三层文档一致：ADR / 本文件 checkbox / docs/user —— v0.6：ADR-024/025 均为已采纳；Phase1-5 checkbox 全勾；axs-syntax.md 含 @relation/relation. 与对等双视图表述
[x] 删除清单核销：本阶段承诺删除的旧路径已不存在 —— v0.6：ProjectFlowPage.tsx 已删（pages/editor/ 四件套在位）；v0.6 本轮零产品代码新增，无新删除项
[x] 非目标未膨胀（对照阶段开头声明的非目标逐条复核）—— v0.6：世界 tick / AI 运行时 / 跨作品继承 / 签名公证 / 自动更新 / Live2D / CRDT 均未引入（delta 仅 1 测试文件 + Blueprint + 本文件）
[x] 打 tag desktop-v0.x —— v0.6：desktop-v0.6（见 git show）
```

### Phase 6 收尾检查单（v0.7 · 2026-09-24）

```
[x] G1 新建文件 ≤400 行 —— 本轮 13 个新文件最大 163 行（assets.test.ts）；
    存量 >400 行 8 个（PlayerPage 1370 / useProjectEditor 1163 / CharacterDetailPage 734 /
    TimelineShell 712 / CutStudioView 658 / baselines.spec 649 / OutlinerPanel 624 / ScriptEditor 614），
    按铁律 3 本轮不夹带拆分，全部登记 Phase 7 清零点
[x] G2 覆盖率 —— editor-core 与 core 均可跑；**core 实测 83.47% 语句 / 72.02% 分支，未达 ≥90%**，
    记为 Phase 7 测试债（此前因缺 @vitest/coverage-v8 根本跑不了，被当作达标）
[x] G3 E2E 行为基线 —— 13/13 全绿（15.9s）：E1–E11 原样通过 + E12（.axsp v2 演员表与引用重映射）
    + E13（浏览器首屏落 /discover 的回归护栏）
[x] G4 循环依赖 = 0 —— dpdm 68 模块 0 循环，已进 pnpm gates 与 CI
[x] G5 类型与 lint —— tsc 0 error（core/axs/editor-core/web）；oxlint 0 error（3 史前 warning，无新增）
[x] G6 编译器等价 —— golden 用例随 packages/core 49 测试通过（TS 与 Python 逐字段一致）
[x] G7 依赖准入 —— fflate（zip 容器）：非五十行可自写 / 活跃无依赖 ~8KB / 只用 zipSync+unzipSync；
    dpdm 与 @vitest/coverage-v8 为 dev 工具，不进产物
[x] G8 提交纪律 —— 本轮 9 次 conventional commits 带 scope；两个 backend 无关脏文件全程未入暂存
[x] G9 文档同步 —— ADR-026 新建、KERNEL_DESIGN §2.5 回写、docs/user 新增桌面版页、
    README 结构段与脚本表纠偏、BACKLOG_V1 矛盾清除（追加注记，历史表未删）
[~] G10 手动验收路径 —— 第 1 步在 **release 打包产物**（非 dev 壳、:8000/:5174 均无监听、全新库）实证：
    冷启动后本地库出现且仅出现三部【示范】工程。由于播种发生在 `createStorageProvider()`，
    而它由 `/studio/projects` 路由上的组件调用，故「库被播种」本身即证明 release 包的
    React 已挂载、路由已落到新的桌面首屏、列表组件已执行——这是非视觉证据。
    **视觉截图未取得**：本轮次实测时 macOS 显示处于锁定/休眠，`screencapture` 只返回全黑帧
    （2940px 原分辨率、体积与黑帧一致），不据此声称看过界面。
    第 2 步「在 release .app 里点『导入立绘』唤起原生文件面板」需真实点击，**待人类验证**；
    该环节的字节链路已在壳内冒烟实证（真实可解码 PNG 的 img.onload + 外部 shasum 反查摘要一致）。
    第 3–5 步（导出→导入随包含素材与角色、引用重映射）由 E12 与冒烟 axsp-v2-carries-media 覆盖。
[x] 打 tag desktop-v0.7 —— 2026-09-24 经人类单独批准后执行：附注标签 `desktop-v0.7`
    （tag 对象 638dc53 → commit 6c95634，即 v0.7 最后一颗提交、v0.8 M1 的父节点），
    `git ls-remote origin "refs/tags/desktop-v0.7^{}"` 复核 peel 值为 6c95634；
    分支推送 `c9e3e56..db48f5d`（52 颗，快进，`merge-base --is-ancestor` 先行确认）并设 upstream。
    **仍未取证**：CI `frontend-gates` 首次实跑结果——本地 `gh` 未认证，不以「已推送」推断「已绿」。
```

## 第三部 · 自治迭代执行协议（无人值守轮次的工作宪法）

> 适用：人类不在场时的连续版本推进（Phase 6 → 12）。任何与本节冲突的临时冲动，以本节为准。

1. **起点唯一**：每个版本一份 `BLUEPRINT_v0.x.md`。开工 = 跑 `forge/scripts/trail.sh` 看轨迹 + 读 §5 首条未勾任务；不靠记忆接续。
2. **六拍不跳**：计划 → 安全网 → 小步实现 → 门禁 → 文档同步 → 演示路径收尾。跳过「安全网」即视为该任务未完成。
3. **证据标准**：只接受可复现数字（测试条数、耗时、退出码、命令输出、磁盘反查）。「看起来能跑」「应该没问题」不是证据；UI 结论必须截图或壳内冒烟落盘。
4. **授权边界**：本地 commit 可自便；**push、打 tag、改远端/CI/依赖版本线**一律等人类点头。tag 欠账在收尾检查单里显式记为「待批准」，不静默跳过。
5. **范围纪律**：单维度变更（拆巨石不夹带加功能）。发现范围外缺陷 → 记入下一版本或 §8 偏差，不在当前提交里顺手修。
6. **质量轮独立**：Phase 8（设计系统）与 Phase 9（演出上限）是产品感知层，不得被工程债挤掉——若两者被推迟，须在宪章显式写明理由。
7. **每轮自我提问**（产品经理视角）：这一版结束时，用户能多做一件什么以前做不了的事？答不出来就说明排错了任务。
8. **收尾三件套**：附录 G10 检查单逐项打勾 + 用户可见变更清单（写进 Blueprint §6）+ 下一版本的取证（新发现的实态偏差写回本文件对应 Phase）。

---

## 风险与止损

| 风险 | 信号 | 止损 |
|------|------|------|
| 1b 拆巨石牵出隐藏耦合 | E2E 基线反复变红 >3 天 | 缩小步长：先抽 projection 纯函数层，视图拆分延后半阶段 |
| 1d 编译器移植量超估 | golden test 对齐停滞 >1 周 | 缩样本到 1 个线性工程先通链路，codex 场景单独成批 |
| SQLite 行为差异 | 数据读写不一致 bug 出现 | narrative_data 全 JSON 化，放弃关系化索引，性能后置 |
| 单人产能不足 | 连续两个子波次滑期 >50% | 砍当阶段「锦上添花」验收项，主线（安全网→抽取→门禁）不动 |

---

## 补记（2026-10-01，复审）：把上一整串工作重新过一遍，抓到 6 处「判据在自己够不着的地方」

上一轮结论是「非决策矿脉至此挖空」。这一轮是一次**独立复审**，起手假设是「上一轮留下的东西大体可信」，
结论是**不成立**：在 107 个改动文件里抓到 6 处缺陷，而它们的共同形状是
**「判据（或代码）声称守住的契约，恰好落在它自己的识别面之外」**——不是漏写，是够不着。

### 一、产品代码 3 处

1. **`importProjectFromAxsp` 的回滚承诺有两处出口根本没有回滚**（`apps/web/src/shared/storage/axspImport.ts`）
   函数头写着「每一步失败都回滚已建的工程，让调用方拿到一次干净的失败，而不是留下半套内容」，
   而 `saveAsset` 与 `saveCharacter` 排在 `createProject` **之前**，`rollback` 那时还没被定义。
   后果按严重度排：`createProject` 失败时前面建好的角色**全部留在库里**（重试一次多一组孤儿，
   而调用方只是 `alert` 一句看不懂的错）；`saveCharacter` 失败时半套工程整个留在库里。
   **修法 = 把 `createProject` 提到最前**：它只需要 title（实测 `remapCharacterIds` 只重映射角色引用、
   `meta.title` 原样），于是从那一刻起每个失败出口都能删掉工程；而它之前只剩素材字节，
   素材是内容寻址的、没有引用，落地了也不可见。
   同轮把 `rollback` 吞掉 `deleteProject` 失败的那一格也补上：原来删不掉仍把原错误递出去，
   而那句话写着"已回滚"——现在合并成一条说清两件事的 `io`。
   **仍然回滚不了的一格照旧只登记**：角色（L4 契约没有 `deleteCharacter`），那是待决 ⑬。
   判据从 7 个出口补到 9 个，并**新增一条把枚举与实现里 `rollback(` 的调用点数对起来的断言**——
   枚举是手抄的，少配一处时 `it.each` 根本看不见那个出口，测试照样全绿。
   牙＝三次成对变异：去掉回滚的 `!removed.ok` 分支 ⇒ 1 红；去掉 `saveCharacter` 的 `rollback(...)` ⇒ **3 红**
   （枚举对账那条与出口那条一起红，这正是加它的理由）；把 `createProject` 挪回原顺序（旧形状）⇒ **5 红**。

2. **`translatePlaceholders` 的守卫认不出的地方，恰好是重写会静默改错的地方**（`tauriSqlBackend.ts`）
   第一轮形状是「全量替换 `?` + 一条「单引号字面量里含 `?` 就抛」的守卫」，守卫靠**正则猜引号边界**，
   于是双引号/反引号/方括号标识符、`--` 行注释、块注释里的 `?` 一概看不见。
   复审把它的两条自我描述都实测否掉了：
   - **头部原写「错位后的 SQL 照样能执行成功，只是绑错值」——不成立。**
     用 Python 的 sqlite3 真解析器逐个形状量：守卫看不见的那些形状里，全量替换把 `$n` 塞进引号或注释，
     SQLite 数到的参数就**少一个**，报 `Incorrect number of bindings supplied`
     （标识符那几种是 `no such column: op$1`）。也就是旧形状在那里是**响亮地失败**，不是静默串值。
     守卫真正买到的是**诊断质量**（在翻译处就抛、错误里带原 SQL），不是正确性——
     而它的实现决定了这笔诊断质量买不到它宣称的覆盖面。
   - 顺带否掉两条读起来很像真的缺陷：① 「守卫误伤合法 SQL」在穷举语料里**复现不出来**（0 例）；
     ② 「`''` 转义把相邻字面量错位」那个反例 `'x'', '?'` 本身**是 SQLite 语法错误**，不是合法语句。
     两条都写进来就会变成假账，所以都删了。
   **修法 = 不再猜内容**：改成结构上只重写**代码区**（引号、注释里的 `?` 原样留着，
   真占位符照旧逐语句从 `$1` 编号），守卫看不见的那几种形状因此从"报错"变成"本来就对"。
   fail-closed 保留，但位置从"猜内容是什么"挪到**可判的形状**：引号或注释没有闭合就抛。
   分母：全仓 23 段真实 SQL 文本块，新扫描器拒绝 **0** 段；旧形状拒绝 1 段（还是本测试自己的夹具），
   两者在其余 22 段上输出逐字相同。
   判据 7 条（其中 4 条是原先看不见的形状），牙：退回旧形状 ⇒ **7 红**，而事务形状那 5 条仍绿。

3. **`index.test.ts` 里两条"根目录被清空"的断言是恒真的**（`apps/web/src/shared/storage/index.test.ts`）
   `getLocalAssetRoot()` 的初值本来就是 `null`，所以"被清空"与"从来没人设过"读起来一模一样——
   把 `index.ts` 里那两行 `setLocalAssetRoot(null)` 删掉，两条用例照样全绿。
   用例名里承诺了"根目录置空"，断言却量不到它。修法是**先塞一个非空脏值再进工厂**。
   牙：删 memory 支那行 ⇒ 恰好 1 红；删浏览器支那行 ⇒ 恰好 1 红，两次都点名那个脏值。

### 二、门禁 3 处（这一类最值得记：门禁的失败方向是"绿"，而绿的那一半从没被测过）

4. **`check-doc-citations` 的「文件不存在」那一档整档是关着的**（`scripts/check-doc-citations.mjs`）
   「只在被跳目录里找到」这一档原按 **basename** 匹配 `everyFile`——仓里任何地方有个同名文件，
   一条**根本不存在的路径**就绿。实测当时就中着 `packages/core/compiler.ts`（真实路径少写了一段 `src/`），
   以及 `docs/ADR/028` 的 `gateway.py:45`（只躺在 `Clearance/` 与一个 torch 测试util 里）。
   变量名写着 `inSkipped`，代码实现的却是"按 basename 找"——**注释描述的是意图，代码实现的是别的东西**。
   另两处同族：`suffixHits` 吃 `everyFile`（含 `node_modules/` 与 `Clearance/` 的副本），
   候选一多就全变 `ambiguous` 而**静默跳过**，已判定数因此虚低 **28 条**；
   `SKIP_DIR` 在收集阶段被喂**绝对路径**、在判定阶段被喂**相对路径**，而原式要求目录名前面有一个 `/`，
   于是**位于仓库根的** `Clearance/` 两种输入下结论相反。同一份判据只能有一种输入形状。
   三处修完：已判定 **168 → 197**（29 条此前根本没被判的引用回到判据面内），
   浮出 **1 条真的路径写错**（已改正文）＋ **2 条历史快照的行号**（按"历史文本不重写"入基线，
   与它们那条 `:572` 的兄弟条目同一处置——原先它们因为同名副本太多被判成 ambiguous 而静默跳过，
   **不是新引入的漂移**）。牙：临时放一条「不存在的路径 + 仓里有同名文件」⇒ FAIL 点名、退出码 1；删净 ⇒ OK。

5. **`check:seams` 第 2 层被两种最省事的骗法绕过**（`scripts/check-desktop-seams.mjs`）
   第 2 层的机械判据是「那个测试文件必须**真的 import 被测模块**」，而实现拿**全文**跑
   `from "…/stem"` 正规——于是 `import type { X } from "./x"`（编译后被擦除，模块运行时根本没被加载）
   与 `// import { X } from "./x"`（注释掉的）都算"真的 import 了"。两条都正好命中脚本头声称已经关掉的洞。
   第 3 层同理收了一处：恒真形态只认 `expect(` / `assert(` 两种光秃秃的写法，
   `assert.ok(true)` 因此算成"真断言"，`trivial-assert` 那一档形同虚设。
   修法：第 2 层只吃剥掉注释行的代码并排除 `import type` / `export type … from`；恒真形态按 `(?:\.\w+)*` 一并匹配。
   牙＝四条腿：只有 `import type` ⇒ FAIL `#no-import`；只有注释掉的 import ⇒ FAIL `#no-import`；
   只有 `assert.ok(true)` ⇒ FAIL `#no-assert`；真 import + 真断言 ⇒ OK；删净 ⇒ 接缝数回到 9、退出码 0。
   **顺带修掉脚本头里一处已过期的实测数字**（在册真断言数仍写着"5 份 / 11,9,15,20,20"，实际已是 6 份）。

6. **`check:apibase` 的「基址定义」那一档比它的字面表述宽得多**（`scripts/check-apibase-literals.mjs`）
   判据是 `rel === BASE_FILE && /apiBase/.test(line)`——**同一文件里任何提到 `apiBase` 的行都豁免**，
   于是 `const legacy = apiBase + "/api/v1/old"` 这种"在 client.ts 里新加一个云端端点"是绿的。
   收成「那一行本身就是一次对 `apiBase` 的赋值」，今天唯一命中的是 `let apiBase = '/api/v1';`。
   牙：临时插那一行 ⇒ FAIL 点名、退出码 1；删净 ⇒ OK。
   同时把三条**已知不覆盖**写进脚本头（字面量子串可被 `` `/api/${V}` ``、`"/api/"+"v1"`、大小写绕过；
   扫描面只有 `apps/web/src/**` 的 `.ts/.tsx`，`vite.config.ts` 的 `/api` 代理在面外；
   注释判定行首锚定且本脚本**没有基线机制**），因为这条还**刻意不进 `gates`**，接进链之前要认下这些。

### 三、这一轮的方法（与前几轮不同的地方）

前几轮挖矿脉是"读代码找缺陷"；这一轮是**反过来先问「这条判据声称守的契约，它的实现够得着吗」**。
六处里五处的第一版修法提交前都被自己的判据或真实解析器**打回过一次**：
`axspImport` 那条先把 `createProject` 挪前却让旧枚举对不上（红 3 条，是枚举对账那条先抓到的）；
`translatePlaceholders` 那条先写了一版反例 SQL `'x'', '?'`，被 SQLite 自己判为语法错误；
`index.test.ts` 那条先补了断言，`cp` 备份还原跑一遍才发现**变异后照样全绿**（恒真）；
两道门禁的"红"都是靠**临时探针文件**验的，不是靠读代码判断的。
**一句方法**：给判据加断言之后，"跑绿"不算数，要拿一次**故意写错的变异**换一次红才算数；
而"变异跑绿"的第一嫌疑永远是变异本身没落进去（今天又中了一次：注释里写了个字面量 `*/` 把块注释提前闭合，esbuild 直接报语法错）。

**未改产品语义的地方要说清**：#2 那刀改的是重写器的行为（原先会抛的一类现在能跑通），不是落盘数据；
#1 那刀改的是调用顺序（`createProject` 提前），落盘结果逐字相同——两份夹具的
`axspRoundTrip.test.ts` 18 条与本轮新增的 9 条都绿。**待决清单没有因为这一轮变短**，
⑬（`deleteCharacter`）与 ADR-026 那条 Windows 安全上下文的读数仍挂着。

### 四、复审续：把同一轮审计里剩下两条发现也收掉（同日，门禁那一节的 3 处 → 5 处）

上一段只修了三道门禁，漏了**同一次审计里已经指出**的另外两道。留着就是"审计做了一半"——
而"我审计出来的缺陷只修了一半"这件事本身比那两道缺陷更难解释，所以补上。

6. **`check:dispatch` 的显式跳过标记写在注释里就能过**（`scripts/check-dispatch-local.mjs`）
   `registeredSkip` 原是整个窗口的 `seg.includes("skipped-offline")`——**任何位置**出现那个串就算过，
   于是 `// 这条以前是 skipped-offline，现在应该本地化` 这样一句注释就买一张通行证。
   收成只认剥掉注释后的代码（与 `check:purity` / `check:seams` 同一口径，到这里四道门禁终于共用
   一个"代码 vs 散文"的定义）。分母：在册真用法是 `playerSaves.ts:189,211` 两处
   `return { …, via: "skipped-offline" }`，都在代码里 ⇒ 零误伤。
   牙：注释里提一句 ⇒ 由绿转红；真用法仍绿；删净后读数不变（30 个函数、形状 `after-guard=26 / positive-block=4`）。
   **同一轮否掉一条**：审计里写"收紧后的正向档能被空块骗过"——**实测不成立**。
   `if (isLocal()) {}`、`if (isLocal()) { return null; }`、块内只有一行 TODO 注释，三种都照红。
   不成立的读数也记下来，否则下一个人会去"修"一个不存在的洞。

7. **`check:labels` 四种写法全被放过**（`scripts/check-label-association.mjs`）
   第 1 档与第 2 档各有两条够不着的路，四条都实测过（改前全绿、改后点名、其中一条把旧逻辑装回去验过确实放过）：
   - **标签自己的 id 接住自己的 `htmlFor`**：第 1 档原先只问"这个 id 有没有出现过"，于是
     `<label id="ghost" htmlFor="ghost">` 里没有任何控件带这个 id 也算接住了。收紧到
     **"目标 id 必须挂在可标注元素上"**（`label[for]` 只能指向 labelable，这本就是浏览器的规则）。
     分母：全仓 11 处 htmlFor 的目标全部落在 `input`/`select`/`textarea` 与 `Input`/`Select`/`Textarea` 上 ⇒ 零误伤。
   - **id 只写在注释里也算接住**：`idsOf` 吃全文。收成只认剥掉注释后的代码。
   - **`<label htmlFor>`（写了属性没给取值）被放过**：取到空串、被 `if (target && …)` 短路掉。
     那不可能是笔误之外的任何意思，现在判违规。
   - **`aria-labelledby` 用子串比**：`ref.includes(idValue)` 让 `aria-labelledby="group-header-2"`
     接住一个 `id="g"` 的标签（`"group-header-2".includes("g")` 为真）。
     aria-labelledby 本来就是**空格分隔的 id 引用列表**，语义单位是记号，现按空白切分后逐个相等比。
   同时把两条仍有的限度写进脚本头（第 2 档不校验是否真在祖先链上；元素归属靠"从 `id=` 往前找最近的开标签名"，
   一行两个标签的写法会认错）。
   读数不变：205 个文件、裸标签 0、跨文件接住 0。

**这一段的方法与上一段不同的地方**：上一段是先怀疑判据、先量分母再改；这一段是**先把审计结论拿探针复现一遍**，
再决定改不改——结果一条成立（labels 四条）、一条成立但很窄（dispatch 那条）、一条**不成立**（空块）。
不成立的那条如果照着改，就是在给一道没坏的门禁加复杂度。**审计报告本身也是待验证的材料，不是结论。**

### 五、审 `packages/axs`：一个静默缺陷 + 一个既有缺陷（登记为待决 ⑭）

继续按"先问判据够不够得着"往下走，落到全产品语义的真相源 `packages/axs`。
起因是复审时注意到但没追的一条：**`assignBeatIds` 的计数器按原始标题记，而 id 是拿 slug 拼的**。

- **实测形状**：`# Hello World` 与 `# hello-world` 是两个**不同标题**却共用同一个 slug
  ⇒ `seen.get(beat.title)` 对两者都给 0 ⇒ **id 相同**。`parseAxs` **零诊断**。
  下游 `parseAxsToPlan` 里 `beatIdToNodeId` 是按 `beat.id` 建键的，后一次 `set` 盖掉前一次，
  于是本该「A 顺序走到 B」的邻接边变成 `gen-2 → gen-2` 的**自环**（`id: "hello-world-hello-world"`）。
  **节点 id 本身是对的**（`gen-1` / `gen-2`，`usedNodeIds` 守卫有效）——**只有边坏了**。
  这一格值得单独记，因为它演示了一件事：只看"节点 id 有没有重复"会漏掉这一族，
  真正受害的是**边**，而边的退化在下游才现形。
- **与 #69 的关系**：同一族、不同维度。#69 是**同名**塌成一个节点（按标题去重是对的），
  这一格是**不同标题、相同 slug**。
- **修法一行**：计数器改按 slug 记。已承认的同名规则逐字不变（两个「开场」仍是 `开场` / `开场-2`），
  往返 `parse(print(beats)) ≡ beats` 保住（打印侧发原始标题，回读逐条落回本拍）。
  判据 4 条，牙：退回修改前形状 ⇒ **恰好 3 红**，而"同名族回归护栏"两边都绿（正确，那一格不碰）。
- **分母取了两次错、都记下来**：① 第一版把 Python docstring 的 `# ===` 下划线当 AXS 标题（645 文件里 18 处"撞车"全是假的），
  改成只量 `docs/**` 的 axs 围栏 + `testdata/axs-draft/*.json` + 测试内联模板串 = **33 段 / 34 条标题**；
  ② 三份 `.axsp` 第一版只输出"未解包"，按今天已犯过一次的教训改 `unzip -p` 结构化读，
  结果三份的 `axsSource` **都是空串**（叙事在 `nodes` 里）⇒ 侧分母 0。
  **最终 0 处真撞车。**
- **顺出的既有缺陷（修改前后一样红，不是本轮引入）**：`标题-N` **不是保留命名空间**。
  `# 开场` / `# 开场` / `# 开场-2` 实测得 `开场` / `开场-2` / `开场-2`（重复 id + 自环 + 零诊断）。
  不能在实现里顺手修：`titleToId` 的优先级是「原始标题先、id 后」，
  字面标题占住 `开场-2` 之后那个自动生成的引用会解析到**字面标题那一拍**；
  关掉它必须改**消歧方案本身**，而那是 ADR-016 的语法冻结面 ⇒ **登记为待决 ⑭**。
- **一条自己写错的判据**：第四版断言按"作者写 `-> slug` 是想指向第一拍"来写，红了。
  探针显示往返完全正确，而那个前提是**我编的**（引用按字面标题归属，修改前也这样）。
  按"改断言不删断言"改写成真正的契约（往返不变式），并把编出来的前提留在注释里当限度。
  **分母为 0 却没有加 warning**，理由是：唯一能修它的办法要先定消歧方案，
  而 warning 会把"字面标题占位"这件事在文本层说死——**先定档，再让文本开口**。

### 六、审 `packages/editor-core`：四条自证缺陷已修，其余线索按"复核状态"分层登记

这一层是唯一还没独立审过的。两个只读审计给了 22 条线索；**按前几轮的经验，审计报告本身是待验证材料而不是结论**
（`check:dispatch` 那次 5 条里 3 条不成立），所以逐条自己跑探针，只把**自证的**当缺陷修。

#### 已修（4 条，每条都拿变异换过红）

1. **`journalUndo` 让"任何 redo 之后的 undo"变成静默空操作**（`journal.ts`）
   `redo` 把 future 栈顶那条**原样**提升进 past，所以 undo 写 future 时就必须已经写成一条**合法的 past 条目**：
   `before` 得是"这条事务被应用到哪个状态上"，也就是 `last.before`。原实现写 `before: current`
   （事务应用**之后**的状态）⇒ 实测 `apply → undo → redo → undo` 的第二次 undo 返回 `rev=1`，
   与撤销前完全相同，**却报 `ok:true`**，而 UI 会弹「已撤销」。顺带修好了该文件自己声明的
   `rev = before.rev` 不变量（写 `current` 时 `current.rev === last.rev + 1`，自相矛盾）。
   既有那条 `record → undo → redo` 判据只断言 redo 之后的 draft 与栈长度，**没有再 undo 一次**，所以一直绿。
   牙：装回旧形状 ⇒ **恰好 1 红**，红在 `expected 1 to be +0`。
2. **`collectAssetRefs` 漏掉 `meta.coverImage`**（`axsp.ts`）：那条 ref 被序列化进 `project.json`、
   导入时又被原样写回，但**字节从来没进过包**（导出侧压根没对它调 `readAsset`）⇒ 收件机封面空白、
   `ok:true` 走完全程。这与本模块已有的不变量正好是镜像：已声明的素材必须真在包里，而这条是**ref 已声明、字节没跟**。
   分母：随包三份 `.axsp` 封面都是空，今天没有作品因此坏掉。
   牙：撤掉那一行 ⇒ **1 红**（**且第一次变异没落进去、跑绿了**——今天第 4 次，改成先 `grep` 确认落点再跑）。
3. **`removeRole` 对不存在的 role 谎报成功——而本地两端都与后端相反**：
   实测三端是 `后端 router.py:298 → 404` / `HTTP provider → not_found` / **`Memory → ok:true`** / **`SQLite → ok:true`**。
   权威是后端（`types.ts` 里 `removeAssetRef` 那行注释已经写明"后端对不存在的 ref 返回 404，所以这里也是 not_found"），
   同一文件里另外两个 `remove*` 也都报 `not_found`——**只有 `removeRole` 是异类**。
   吞掉的代价：`CutWorkspace` 会弹「已移除角色」，而它其实什么都没删。
   两端一起修，并把判据写进**契约套件**（同跑 Memory 与 SQLite(sql.js)），下一个新后端也会被拦住。
   牙：两端各自装回旧形状 ⇒ 各 **1 红**，点名同一条用例。
4. **`saveNarrative` 在 Memory 端静默吞掉重复 node id，与 SQLite 语义相反**：
   `new Map(payload.nodes.map(n => [n.id, n]))` 对重复 id 返回 `ok:true`，读回只剩**最后一个**
   （实测送 2 个 `id="dup"` ⇒ 读回 1 个、且是后者）；SQLite 因主键而 `io` + 整体回滚（读回仍是 2 个）。
   同一个契约方法在两个本地后端给出相反语义：**桌面测试宿主悄悄丢节点、真桌面报 io**。
   选对齐 SQLite（而不是改 schema 容忍重复）：铁律 8 要求显式失败语义，
   而"后写的顶掉先写的"正是前一批在 AXS 侧刚修掉的同一族。判据只断言 `code === "io"`
   ——两端 detail 措辞可以不同，**语义必须一致、文本不必**。

#### 已修（1 条，投影层）

5. **画布投影按 13 键白名单重建 `narrative_data`，静默丢字段**（`projection/canvas.ts`）
   `NarrativeData.choices`（legacy 分支组，`buildScriptFromLegacy` 的唯一输入）、白名单外的任何键
   （类型带 `[key: string]: unknown`，本就是开放的）、`editor_data` 里除 `position` 外的键，在画布碰过该节点后全部消失。
   生产链实测：`openWriterAtSelection`（"在 Writer 中打开"）→ `projectAxsFromCanvas` → `setAxsSource(projected)`，
   **Writer 面板当场拿到丢过字段的文本**，随后保存即落盘。
   责任归属用对照组钉死：同一个 legacy 节点（两个选项）走 `draftToAxs` 直连时两个选项都在，
   走 `projectAxsFromCanvas` 时两个都不在、只剩一个光标题——**丢失在画布这一层，不在 `buildScriptFromLegacy`**。
   改法：**以 base 的持久态为底**，再把已知键按原归一化覆盖上去（逐键归一化语义与改前逐字一致）。
   刻意**不**整体铺开画布 `data`——生产里 `data = {...narrative, stage_id}`，铺开会漏一个字段；另有一条判据钉住这个取舍。
   牙：装回"白名单重建" ⇒ **恰好 1 红**，红的内容就是症状本身（`'# 岔路口\n\n# 左路\n\n# 右路\n'` 不含选项）。

#### 复审续（同日第二批）：再自证 3 条、否掉 1 条，线索表已扣掉已处理项

继续按"潜在但一旦触发就丢数据"这个标准往下挑，逐条自己跑探针。

- **已修⑥`remapCharacterIds` 漏两处角色引用，跨机导入后指向不存在的角色**（`axsp.ts`）
  ① `key` 原先只重映射**第一个**点号分段，而 `relationship` 的键是**三段**的 `charA.charB.field`
  ——条件侧（`conditions.ts::case "relationship"`）与效果侧（`applyEffects`）都按 `split(".")` 取
  `[charA, charB, field]`，于是 `charB` 保留**导出方机器上**的角色 id，导入后那条关系挂在一个不存在的角色下、
  从此读写不到。实测 `char-1.char-2.trust` → `NEW1.char-2.trust`。
  ② `actors` 是 `compiler.ts::extractActors` 里优先级最高的 `explicit` 覆盖值（作者可写的角色 id 列表），
  与**已被重映射的 `codexScope` 完全同类**，却没有分支。实测 `["char-1","char-2"]` 原样穿过。
  对照组就是 `codexScope`（本来就对）——三条读数放在一起才看得出是哪两格漏。
  改法：`keyOf` 改成**逐分段查表**（`map` 里没有的分段原样保留）。
  安全性：`flag`/`memory`/`state`/`codex` 的首段是命名空间而不是角色 id，而角色 id 是 UUID 或 slug，
  不会正好等于那些命名空间——另有一条判据钉住这四族首段原样保留。
  牙：`keyOf` 装回首段 ⇒ **2 红**（新用例 + 命名空间护栏一起红，这正是把两半放进同一个用例的价值）；
  去掉 `actors` 分支 ⇒ **1 红**，点名那一条。
- **已修⑦结构不合的 `.axsp` 包抛 `TypeError` 而不是返回 `corrupted`**（`axsp.ts::unpackAxsp`）
  `storage/types.ts` 的**第一条**设计裁决是「禁止异常穿越内核边界」，本模块开头也写着
  「结构不符=corrupted，绝不静默兜底」；而 `readJson` 只保证「能 parse」，
  于是 `for (… of manifest.data.assets)` 与 `project.data.meta?.id` 两处直接吃到外部 JSON。
  实测 6 个畸形形状里 **4 个抛异常**：`assets` 缺席 / `= null` / `= 7` / `project.json` 是 `null`。
  可达性不是理论的：`importProjectFromAxsp` 调 `unpackAxsp` 没有 try，
  所以别的机器上截断或被改过的包，在导入那条路上是**未捕获的 promise 拒绝**，
  而调用方（工程列表页）只会 `alert` 一句看不懂的话。
  顺带修掉一个误导：`assets` 是字符串时 `for…of` **逐字符迭代**，报的是「清单缺素材 a」——字符串的第一个字符。
  牙：撤掉那三处形状校验（`grep` 确认两处落点都是 0 残留）⇒ **1 红**。
- **已修⑧越界守卫作废了三族「内核不判断」的引用**（`assets.ts::classifyAssetRef`）
  `..` 守卫原先在归属判定**之前**无条件生效，而下一行明说 `/uploads/…`、`http(s)://`、`data:`、
  历史裸路径「WebView 自行解析，内核不做判断」。代价**比「显示坏图」更大**：
  `httpStorageProvider.readAsset` 要求 `kind === "direct"` 才读，
  所以一个带双点的后端上传路径（`a..b.png` 在磁盘上完全合法）在浏览器态**既显示成缺图、又读不回字节**。
  守卫强度不变：本地 ref 里的 `..` 照拦（既有三条判据都钉着它）。
  顺带量了一句：我们自己生成的 ref 是 `sha256 + 扩展名`、**永远不含 `..`**，
  所以这道守卫实际只对**外来 ref** 点火——而那正是它此前误伤的那一族。
  牙：守卫装回无条件 ⇒ **1 红**。
- **否掉 1 条**：`deleteProject` 不级联（审计称 Memory 留 saves/achievements 而 SQLite `ON DELETE CASCADE` 会删）。
  实测**两端一致**（造一条存档 → 删工程 → 两端读回都还是 1 条），没有分歧。**审计那条不成立**，
  大概是只读了 schema 声明而没跑（SQLite 的外键要 `PRAGMA foreign_keys=ON` 才生效）。
  这是本轮第 3 条被否掉的审计结论——**「reports 是材料」这条纪律，回报率就在这里**。

#### 复审续（同日第三批）：舞台排序号两端不一致 + 一条降级为待决

  `ProjectSceneInput = Omit<StoredScene, "id">` **声明了** `sortOrder`，而：
  - SQLite 硬编码 `COUNT(*)`，把调用方给的值**整个忽略** ⇒ 这是**生产路径**上的契约违反
    （`.axsp` 导入 `axspImport.ts:126` 显式传的就是它）；
  - Memory 原样存调用方的值 ⇒ 不传时留下 `undefined`（读回 `null`）。
  实测**不传时**（两个 live 调用方 `useProjectOutliner` 的「+ 新舞台」与「从舞台库导入」都走这一支）：
  Memory `[["甲",null],["乙",null],["丙",null]]` / SQLite `[["甲",0],["乙",1],["丙",2]]`；
  **传了 10/20 时**：Memory `10/20` / SQLite `0/1`。
  规则收成一条并写进**契约套件**（同跑两端）：**给了就照给，没给才算下一个**；
  `null` 与 `undefined` 同义（随包三份 `.axsp` 的 `sortOrder` 全是 `null`——运行时不满足那个可选数字的声明，
  两者必须都走"算下一个"，否则现有内容行为会变；这也是本条改动零影响的原因）。
  牙：**同一条契约用例**在 Memory 侧装回旧形状 ⇒ 1 红、在 SQLite 侧装回旧形状 ⇒ 1 红，各点各自那一半。
  **顺带记一条限度**：Memory **不是生产路径**（只有 DEV 的 `?storage=memory`；桌面走 SQLite、浏览器走 HTTP），
  所以这半个分叉本身不用户可见——它的危害是**契约套件跑的就是 Memory**，
  于是一个"测试宿主顺序不同、对桌面又绿"的偏差会长期隐身。
- **降级为待决（不自行决定）**：`saveCharacter` 不像 `saveItem`/`saveScene` 那样兜底 authorId。
  实测两端一致（`authorId: null` 的角色在无范围列表与按 author 查里**都是 0 条**，只有 `getCharacter(id)` 拿得到），
  所以**没有两端分歧**；而唯一活路径 `CreateCharacterPage` 两个调用点都传了 `getCreatorId()`，
  `axspImport` 也显式传 `authorId: owner` ⇒ **今天不可触发**。
  确定的那一格在 hook：`data.author_id ?? ''` 把"没给作者"折成 `""`——
  那是**第三种东西**（既不是 null 也不是真作者），可见性判定两边都不匹配 ⇒ 角色存进去却在所有列表里查不到。
  这一行改成 `?? getCreatorId()`（零风险，唯一活路径本来就传对了）。
  核心里那条不对称要动两个后端的构造参数，且"没有作者的角色归谁"本身是个设计问题 ⇒ **登记为待决 ⑮**。

#### 复审续（同日第四批）：一条修、一条降级为"不是缺陷"

- **已修⑩同一工程内成就 `key` 必须唯一，撞了显式失败**（`memoryPools.ts` + `contractPools.ts`）
  SQLite 的 schema 有 `UNIQUE (project_id, akey)` ⇒ 第二次写 `io`；Memory 只按 id upsert ⇒ 两次都 `ok`、
  读回**两条同 key**。后果不是"多一行"：成就面板按列表渲染（用户看见重复项），
  而 `unlockAchievement` 按 **key** 解 ⇒ 另一条永远点不亮，是一条谁都够不着的死行。
  权威是 SQLite（`backend.ts` 那张表是桌面生产路径真在用的）。
  同时钉住另一半：**同 id 仍是更新**、不算冲突——否则会把 `updateAchievement`（先取回再合并补丁、
  key 不变）那一支一起堵死。
  分母：面板用 `ach_${Date.now().toString(36)}` 生成 key ⇒ 活路径不产生重复（同一毫秒连点才可能），
  所以这条是**潜在**的，值在把口径钉进契约、让下一个后端不必再猜。
  牙：Memory 装回旧形状（`grep` 确认落点 0 残留）⇒ **1 红**，点名那一条。
- **降级为"不是缺陷"（有理由的否掉第 2 条）**：`manifest.characters` 从不与 `characters.json` 对账。
  量到的关键事实是：**这个字段没有任何消费者**——v2 解包真正读的是 `characters.json`，
  生产代码里唯一读 `.manifest` 的地方是 `unpackAxspV1` 读 v1 信封。
  而 `manifest.assets` 之所以要强制"声明的素材必须在包里"，正是因为 `unpackAxsp`
  **自己**按它决定加载哪些 zip 条目——**清单在那里是承重的**。
  于是这条不是"漏了一条不变量"，而是「**承重处才强制**」的正确形状：
  在没人读的字段上加拒绝，只会让书写松散的外部包变得导不进来（而 `.axsp` 的定位就是跨机交换）。
  **不修，也不登记为缺陷**；写在这里是为了让下一次有人提这条时能直接引用这段判据。

#### 复审续（同日第五批）：列表顺序两端不一致（与 `sortOrder` 同形，第三处）

- **已修⑪`listItems` / `listScenes` 两端顺序不同**（`memoryPools.ts` + `contractPools.ts`）
  SQLite 两侧都是 `ORDER BY updated_at DESC`，而 Memory 原样给插入序。
  实测「存 A、存 B、再改 B」读回来：Memory `["A","B改"]` / SQLite `["B改","A"]`。
  权威是 SQLite（桌面生产路径），而**意图在本仓库里早已定了**：
  `memory.ts::listProjects` 早就特意写了同样的排序去对齐 SQLite 的 `ORDER BY`，
  `types.ts` 里也有"两端同一操作产生不同行数，桌面用户会比网页用户少看到重复项却没人解释为什么"那条裁决。
  所以这不是新产品决定，是**同一意图漏了两处**（与刚修的舞台 `sortOrder` 同形，是第三处）。
  危害形态：`e2e:desktop` 跑的正是 `?storage=memory` 宿主 ⇒ **凡是断言道具/场景列表顺序的 e2e
  都在断言一个桌面不会给的顺序**，而两边都绿。
  牙：`listItems` 装回插入序 ⇒ 1 红；`listScenes` 装回插入序 ⇒ 1 红（SQLite 侧两次都保持绿——它是对的那一侧）。
- **写这条判据时被自己抓到一次**（"判据本身在断言一个并列"）：
  第一版直接连存两次再断言 `[B, A]`，结果**两端都给 `[A, B]`**。
  原因是两个后端的 `saveItem` 都在存的时刻自己盖 `updatedAt = nowIso()`，
  **调用方给的值根本进不去**；而 `nowIso()` 是毫秒级 ⇒ 连续两次存几乎必然同毫秒 ⇒ `updatedAt` 相同
  ⇒ 量到的其实是"并列"（Memory 靠 `Array#sort` 稳定退回插入序，SQLite 对并列行序未定义，实测也都是插入序）。
  **那样子这条用例是绿的，却什么都没证明。** 改法：两次存之间 `await tick()`（3ms）让时间真的过去，
  并把"为什么必须等"写进注释。**教训与判据无关、只与写法有关**：
  凡是被实现盖掉的时间戳驱动的顺序，判据里都必须显式让时间前进，否则测的是并列而不是顺序。

#### 复审续（同日第六批）：一条**改契约不改代码**——本轮最该被记住的一条

- **已修⑫（改的是契约措辞，代码一行未动）`saveAsset` 的 ref 含扩展名**
  审计线索说：ref 的身份是 `(内容, 扩展名)` 而不是纯内容，**违反** `types.ts` 与 `assets.ts` 各写了一份的
  「同一内容 → 同一 ref」。实测确认：同一份字节换后缀确实给两个 ref（`…<key>.png` / `…<key>.jpg`），
  而同名同后缀给同一个 ref。
  **但结论是"那句契约不精确"，不是"实现有缺陷"**：
  本地那侧 ref 就是**落盘文件名**（`assets/<摘要>.<扩展名>`）——去掉后缀文件就没有类型，
  `readAsset` / `resolveAssetUrl` 都要靠它选解码路径。所以扩展名**必须在身份里**。
  真正该做的是把那两句改成精确形状：「**同一内容 + 同一后缀 → 同一 ref**」，
  并把"为什么含后缀是对的 + 两条用户承诺为何不受影响"写在实现旁（`assets.ts::contentKey` 上方）。
  **两条用户承诺确实不受影响**（逐条推过，不是推断）：
  ① 「同一张图重复导入只会存一份」——重复导入意味着同一个文件名、因而同一个后缀；
     而"字节完全相同但后缀不同"对真实格式几乎不可达（同一张图的 JPEG 与 PNG 字节本就不同）。
  ② 「工程包在别的电脑上打开时能认得同一个文件」——ref（摘要 + 后缀）随包一起过去，
     接收方按 ref 解析、**不重算摘要**，所以后缀在不在身份里都不影响认得。
  **判据钉的是"精确后的不变量"，不是把代码改成符合旧措辞**：
  同一内容换后缀 ⇒ 两个不同 ref，且**两个 ref 都读得回同一份字节**（只断言前半截的话两种实现都能过）。
  牙：把 `assetRefFor` 改成"只按字节、不带后缀"（也就是照旧措辞"修"代码）⇒ **4 红**：
  新契约用例在两端各 1，外加**两条既有测试独立钉住 ref 形态**。
  **这一条是本轮最值钱的形状**：不精确的源码注释本身就是"将来会被照着改错"的种子，
  而判据钉住精确形状之后，那次"改错"会被 4 条而不是 1 条拦住。

#### 复审续（同日第七批）：一条修、四条否掉——**这份线索表的尾巴基本是噪声**

- **已修⑬`redo` 丢弃 `ApplyError`，"事务应用失败"与"没有可重做的"不可区分**（`journal.ts` + `document.test.ts`）
  原失败分支是裸 `{ ok: false }`。按本仓库"空值五义"那套约定改成**可选 `error`**：
  缺席 = 没有可撤销/重做的内容（**不是失败**，不该被当错误呈现）；在场 = 那条事务真的失败了，带回自己的
  `ApplyError`。加字段是**加法**（旧调用方 `if (!r.ok)` 照旧工作），不改语义。
  为什么值得改：本文件 `redo` 上方那句「I5 确定性保证结果一致」指的正是这件事，
  而**确定性只能靠"失败时为什么失败"才谈得上**——把原因吞掉，这句话就是空的。
  分母：`redo` 目前**零生产调用方**（全仓只有 `journal.ts` 自己与测试），所以这是导出 API 的修复而非线上缺陷；
  但它是 `@axiforge/editor-core` 的公开面，而公开面没有判据就等于没有契约。
  牙：把 `error` 吞回去 ⇒ **1 红**（`expected undefined to be defined`）。
- **否掉第 4 条（线索陈旧）**：`normalizeBundle` 把类型错误的 `assetRefs` 归一成 `[]`。
  实测**代码已经精确区分**了：键缺失（旧版本）⇒ `ok` + `[]`；键在但不是数组 ⇒ `corrupted`，
  消息就是「键缺失才是旧版本；键在而形状错是坏输入」。三种错误类型（对象/数字/字符串）逐个试过，全是 `corrupted`。
  这条描述的是**修之前**的状态，而那条区分与它的判据早就在树里。
- **否掉第 5 条（不是缺陷，是既定表示）**：`draftToAxs` 对空工程返回硬编码的 `# 开始`。
  实测这个占位串在 **5 处**出现（`draftToAxs` / `useProjectEditor:303` / `writer/lib/projection.ts:90` + 两处测试），
  而且被 `projection.test.ts:43` **刻意钉住**；更关键的是它就是**新建工程的 bootstrap 种子**
  （`sqlite/sqliteProject.ts:112` / `memorySeed.ts:22`）。
  ⇒ "空工程存成一个开场拍"是与种子一致的既定表示，不是内部不一致。
  而且它**不静默**：节点是 `loadProject` 从库里读的，而删除后保存会经 `axs.import` 真的建出那一拍，
  用户在画布上看得见。**不改。**
- **两条仍按"潜在 + 要先定口径"挂着**（不修，理由在表里）：
  `unpackAxsp` 只按清单取素材（**这是对的**——清单在那一半是承重的，宽容正好让书写松散的外部包能导进来），
  `unpackAxspV1` 把 `manifest.assets` 抄进清单却返回空素材表（既有测试**钉住**了它，读那测试的意图才动）。

**这一节的方法**：22 条线索走到这一步，累计**自证并修 9 条、否掉 5 条**（另有 1 条降级为"不是缺陷"）。
否掉的比例这么高，本身就是结论：**一份对着大模块逐函数铺开的审计清单，尾巴基本是噪声**——
真正会咬人的那 9 条全都落在"同一形状在两处不一致"或"契约与实现不符"这两类里，
而"看起来不太对"的那些（命名不统一、少一个兜底、类型宽松）实测下来要么已修、要么是既定表示、要么不可达。
**继续按同一标准筛剩下 4 条，预期收益已经低于把它们写清楚的收益。**

#### 仍未复核的线索（4 条：**报告声称，我没有自己跑探针**，不作为结论引用）

按本文件「审计产出必须逐条读」那条规矩登记，并写明"是什么会 settle 它"：

| 线索 | 位置 | 是什么会 settle 它 |
|---|---|---|
| `visibility` 的 `authorId: ""` 让整份清单静默变空（`??` 只折叠 null/undefined） | `visibility.ts:15` | 传 `{ authorId: "" }` 读一次 |
| `unpackAxspV1` 把 `manifest.assets` 抄进 v2 清单却返回空素材表（既有测试**钉住**了这个不一致） | `axsp.ts:171` | 读那条测试的意图 |
| `unpackAxsp` 只按清单取素材，包里多带的条目静默丢弃 | `axsp.ts:128` | 清单少列一项的包 |
| `canvas.ts` 的 `String()` 归一在非字符串 id 下可能产出重复节点 | `canvas.ts:70` | 需要确认 HTTP DTO 能否给出数字 id |

**为什么不逐条修**：剩下这批里多数是**潜在**（需要一条今天没人走到的路径）或**契约本身要定**
（`saveAsset` 那条可能该改的是 `types.ts:180` 那句承诺而不是代码）或**需要一次产品裁决**。
把它们和已修那几条放在同一层「待办」里，会让真正会咬人的那几条被淹没。
**下一步继续挑「潜在但一旦触发就丢数据」的逐条验**，而不是一次改完。
（`.axsp` 导入会把作者排好的舞台顺序丢掉），以及 `saveCharacter` 不兜底 authorId
（角色会落进「谁的都不是」，在所有列表里都查不到——与在册的 #69 是同一族后果）。

**这一节的方法**：22 条线索里我自证 5 条、修 5 条，其余 17 条如实分层登记。
真正花时间的地方**不是修**，是**否掉与降级**——两条审计里那些"看起来很像真缺陷"的描述
（`axsp.test.ts` 里那条被测试**钉住**的不一致、`String()` 归一那两条）在动手前量一下就发现要么是契约本意、
要么不可达。**登记表比修复清单长，这就是"高信号"的形状。**

### 七、审最大的一处双实现：TS 编译器 ↔ Python 编译器（**结论：实测为健康**，登记为主动排除项）

前面每一处真缺陷都出在"同一形状有两份实现"。全仓最大的一处是
`packages/core/src/compiler.ts`（438 行）↔ `backend/app/domains/narrative/compiler.py`（451 行），
同一个 `project → StoryPackage`。纯函数一一对应：
`normalizeInstruction`↔`_instruction_list_adapter.validate_python`、`buildScript`↔`_build_script`、
`extractActors`↔`_extract_actors`、`pickStartBeat`↔`_pick_start_beat`、`buildGlossary`↔`_build_glossary`。

**结构事实**：`packages/core/src/__golden__/` 有 **4 份**金样本（`input.json` + `expected.json`），
由 `backend/scripts/dump_golden.py` 从真实 DB dump；`compiler.test.ts` 逐字段比对。
所以它是一条**跨实现契约的枢轴**，而且**双向都会红**（Python 变而没重生成 ⇒ TS 红；TS 变 ⇒ TS 红）。

**这次做的是一次免 DB 的差分**：把 `input.json` 直接喂给 Python 那四个纯函数，与 `expected.json` 比。
四项**全部零差异**（`script` / `actors` / `startBeatId` / `glossary`）⇒ **两侧今天是对齐的**。

**过程中探针错了两次，都记下来**（今天第三次与第四次）：
① 序列化了 `exclude_none=True`，而 `expected.json` **保留 null 键**（`transition: null` / `voice: null`）
   ⇒ 一度报出 **24 条"差异"**，全是假的。按 `dump_golden.py` 的真实写法（`by_alias=True`、不去 null）重跑才归零。
② `script` 是 list 不是单对象，`model_dump_json` 用错。
**"差异条数"这个读数本身会被探针的序列化方式放大**——先信格式、再信数字。

**量到的两个真实盲区**（已写进 `compiler.test.ts` 的头注释）：
- **金样本只被 TS 一侧消费**。它是枢轴，所以两侧都红；但**没有独立于枢轴的第三方校验**——
  若有人同时改两侧并顺手重生成金样本，这道门禁不会发现。
  Python 侧不是裸的：`backend/tests/test_story_compiler.py` 有 **8 条**走真实 DB + HTTP 的集成测试
  （glossary、codex 去重、道具引用、私有门禁、fork/模板），缺的只是"这 4 份**真实工程**"这一层语料。
- **语料对 `glossary` 的实际覆盖是 1/4**：4 份金样本里 **3 份的 glossary 是 0 条**，
  只有 `【对照】分支兜底` 那份带 2 条。补语料要重跑 `dump_golden.py`（需要 DB），
  所以这里**只登记分母、不假装已补**。

**为什么不为它写新判据**：Python 的 `compile()` 需要 DB，
一份"Python 侧也读这批金样本"的测试要么依赖 DB（那就等于手工重跑一次 `dump_golden.py`）、
要么靠 `SimpleNamespace` 桩 ORM 属性（会与 ORM 悄悄漂移）。
在 Python 已有 8 条真集成测试、而差分实测又确认两侧对齐的前提下，
**这个新增判据的维护成本高于它挡住的漂移** ⇒ 不写。这是"主动排除"，不是"没想到"。


### 八、补上一个**零覆盖的孪生实现**：Python 侧条件求值（跨实现共享向量，一份规格两个消费者）

这一条不是从审计清单来的，是顺着上一节那句「真正会咬人的都出在**同一形状有两份实现**」找过去的——
全仓还有一处比编译器更值得补：**条件的求值**。

- **缺口是量出来的**：TS `packages/core/src/conditions.ts::compare` 有判据（`conditions.test.ts` 388 行 / **37** 条），
  而它的孪生体 `backend/app/domains/runtime/service.py::PlayerService._compare`
  （被 `_match_memory` / `_match_flag` / `_match_character_state` 三个分支调用）
  **此前一条判据都没有**。上一轮修 `>=` / `<=` 缺失时，Python 那一侧只靠
  「用 `.venv` 直调一次取数」验过——**取过数不等于有判据**，下一次谁动它仍然无人拦。
- **做法沿用本仓已确立的模式**（先例：`testdata/axs-draft/*.json` 被 `packages/axs` 与
  `backend/tests/test_axs_draft_vectors.py` 同跑）：**一份向量、两个消费者**。
  新增 `testdata/conditions/compare.json`（**31 条**）+ 两个消费方
  （`packages/core/src/conditionVectors.test.ts`、`backend/tests/test_condition_vectors.py`），
  两边各带一条**分母守卫**（向量被清空或路径写错时那条红，否则会"全绿"而一条都没跑）。
- **权威不归任何一侧**：向量每条写死 `want`，只收答案无歧义的形状，所以它是**规格**。
  这一点与 AXS 草稿向量那批**故意不同**——那批是拿 TS 的 canonical 解析器裁决合法性，
  这里两处实现各算一个布尔值，所以规格必须由人写清；因此也**刻意不**把
  `conditions.test.ts` 的断言搬进向量（那是实现自己的期望，不是跨实现规格）。
- **向量当场抓到我自己写错的一条规格**（方法记录，比结论更值钱）：
  我第一版把 `eq` 的「带空白数字串」写成 `want: true`，以为 `eq` 会像 `gt` 那样做数值归一。
  实测**两端独立地都返回 false** ⇒ 是**规格错了、不是代码错了**。
  于是把一条真实的不对称钉进了规格：**`eq` 不做任何数值/空白归一**（只归一布尔字符串），
  而 `gt` / `lt` / `gte` / `lte` **做**归一 ⇒ 同一个带空白的数字串在 `eq` 下是假、在 `gte` 下是真。
  两侧一致说明这不是某一侧的缺陷；但它对作者是个陷阱，**登记为待观察、不改实现**
  ——改它会动播放语义，那是产品决定。
- **牙＝两端各自一次成对变异**（都先 `grep` 确认落点 0 残留）：
  把 `gte` 退回 `gt`（上一轮那个缺陷的原形状）⇒ Python **2 failed**、TS **2 红**，
  两边点名同样那两条 `gte` 边界。还原后 `diff -q` 两文件均一致。
- **顺带记一个仍未闭合的**：`_value` 解包（`{"_value": x}` 单键对象取 `x`）
  在 TS 是**一个 helper**、在 Python 是**内联在两个 `_match_*` 里**——形状不同、行为一致，
  但属于"同一语义两份实现"。**这次没有把它写进向量**：它属于**匹配层**（`_match_memory` / `_match_flag`）
  而不是 `compare`，要锁它得连 `memories` / `flags` 的形状一起定义，规格面更大。
  登记在此，**不假装已锁**。


### 九、把上一节登记的欠账补掉：匹配层的跨实现共享向量（并被变异抓出**用例名不等于覆盖**）

上一节结尾登记了一条欠账：`_value` 解包在 TS 是一个 helper、在 Python 内联在两个 `_match_*` 里，
「要锁它得连匹配层形状一起定义」。这一节就是那个"定义"。

- **两侧存储形状本来就不同，所以消费者各翻各的**：TS 的 `vars.memory` / `vars.flags` 是**字典**
  （`key in vars`），Python 的 `memories` / `flags` 是**行列表**（`for m in memories: if m.key == key`）。
  向量只描述「键 + 存储形态 + 条件」，**翻译只做形状转换、不碰语义**。
  `stored` 是**存储形态本身**（已经决定要不要包 `{"_value": …}`）——
  若写成解包后的值，这条向量会**把自己要锁的东西先假设掉**。
- 新增 `testdata/conditions/matcher.json`（**14 条**）+ 两个消费者
  （`packages/core/src/matcherVectors.test.ts`、`backend/tests/test_condition_matcher_vectors.py`），各带分母守卫。
- **一个由判据自己报出来的不对称**：条件 type 是 `flag`（单数）而容器字段是 `flags`（复数）。
  消费者按 `c.source` 直接索引会拿到 `undefined`——已记进消费者注释。
- **本节最值钱的一条：一个没红的变异抓出了用例名与覆盖不符**。
  牙＝四道：TS「unwrap 改成两键也解包」⇒ 2 红；Python「解包去掉 `len == 1`」⇒ 2 failed；
  **TS「键缺席兜底改成恒假」⇒ 15 全绿**。
  归因：向量里那四条标着"键缺席"的用例其实设了 `key: "nope"` + `stored: null`——
  测的是「**键在场值为 null**」，而缺席兜底只对「**根本没有那一行**」成立。
  修法：给向量加 `absent: true`，两个消费者在它为真时**不插键 / 返回空列表**。
  重跑那道牙 ⇒ TS **2 红**、Python **2 failed**，点名那两条 `ne` 用例。
  **「用例名不等于覆盖」**：名字写着"缺席"的用例可能压根没测缺席——
  这是**只有变异能发现**的一类缺陷，读断言读不出来（断言是绿的、名字是对的、覆盖是空的）。
- **仍未锁的**（登记，不假装已锁）：`character_state` / `codex` / `relationship` 三个族——
  形状更大（要连 `characters` 字典 / codex 账本 / 三段键一起定义），
  且 `relationship` 的三段键语义刚在另一轮改过（`remapCharacterIds` 那两条）。

### 十、锁 `relationship` 那族 ⇒ 顺带量出一条**真实的双实现分叉**（三族条件在 Python 侧静默为假）

上一批把 `_value` 解包与「键缺席」锁了，剩下三族里我点名 `relationship`——它是刚改过语义的三段键。
动手前先量两侧支持哪些族，结果量出的东西比预想的大：

| 条件族 | TS `conditions.ts` | Python `PlayerService` |
|---|---|---|
| `memory` / `flag` / `character_state` / `node_completed` | 求值 | 求值 |
| **`relationship`** | 求值 | **`return False`** |
| **`achievement`** | 求值 | **`return False`** |
| **`codex`** | 求值 | **`return False`** |

- **后果**：同一份 AXS 在两端**行为不同**——被 `[if: relationship …]` 门控的分支，
  在 TS 引擎（桌面 / 浏览器）会打开，经后端播放时**永远打不开**，而**两边都报成功、零诊断**。
  这正是本会话反复在拆的那一族：静默降级伪装成合法。
- **组类型意外一致**：我怀疑 TS 用 `not`、Python 用 `none`，**实测两边都是 `all`/`any`/`none`**。
  写进向量当断言，免得下一次再怀疑一遍。
- **为什么不把后三族补进 Python**：那个后端正在退场（ADR-029 桌面唯一化、S13-6 删 `backend/`），
  给将死的后端加功能等于**扩大删除面**。TS 是对的一侧。
- **做法不是改代码，是把分叉钉成规格 + 一条绊线**（`testdata/conditions/families.json`，7 族各带一个探针）：
  - TS 侧断言「清单里声明会求值的族，TS 确实求值」⇒ 防止 TS **悄悄丢掉**某一族；
  - Python 侧断言「这些族当前返回 False」⇒ 有人真去实现某族时**这条会红**，
    逼他同时更新清单与 ADR/S13-6 ⇒ **分叉要变成一次显式决定，而不是一个安静的洞**。
- **探针又错了两次**（今天第 6、7 次，且这次错得像真缺陷）：
  ① 第一版给所有族套同一个 `key: "A.B.trust"` ⇒ `memory` 去查 `vars.memory["A.B.trust"]`、查不到落进 `ne` 兜底返回假，
  判据红在 `memory` 上，**看起来像"memory 族坏了"**；
  ② 修完发现 `character_state` 还红 ⇒ 它的键格式是 `characterId.field`（按**第一个**点切），
  我却给了 `A.B.trust` + `characters: {"A.B": …}`。
  **修法：把探针本身放进向量**——「这一族怎么被点亮」是规格的一部分，不该由每个消费者各自猜。
- **牙＝两道**（第一道的变异也落歪过一次，缩进错、测试根本没跑 ⇒ 补 `ast.parse` 校验后才重跑）：
  TS 删掉 `relationship` 那一支 ⇒ **1 红并点名该族**；
  Python 真去实现 `relationship` ⇒ **1 failed**，消息直接写着「若你刚实现了这一族，请同步更新 families.json 与 ADR/S13-6」。
- **仍未锁的**（登记，不假装已锁）：`character_state` / `codex` / `relationship` **三族的键格式与解包语义本身**
  （本节锁的是"哪些族被求值"这个清单，不是各族的行为；行为里只覆盖了 TS 侧的"确实会求值"这一点）。

### 十一、锁「哪些族被求值」之后 ⇒ 顺手把 `character_state` 的**键格式**也锁了，抓到一处**真分叉（假值字段被吞）**

上一批只锁了"哪些族被求值"这个清单。我当时把"各族行为本身（键格式 + 解包语义）"记为未锁。
这次就锁 `character_state`——它是清单里**唯一两端都真求值**、所以可以真正当契约来比的一族
（`relationship` / `codex` 在 Python 侧压根不存在，比不了，只能靠那条绊线）。

**动手前先量键格式**，量出一处此前没人看过的分叉：

`key` 格式是 `characterId.field`（`key.indexOf(".")`，**只切第一个点**，所以 `field` 本身可以含点）。
两端取值的写法不同——

- TS：`vars.characters[charId][field]`，用 `!(field in state)` 做**存在性**判断；
- Python：`getattr(s, field, None) or s.custom_state.get(field)`。

**Python 那个 `or` 是缺陷**：`or` 对 `0` / `""` / `False` 这类**假值**短路，于是
「`affection=0` 且 `custom_state` 里没有这一项」读到的**是 `None` 而不是 `0`**。
而 `affection`（好感度）的初值就是 `0`，`affection >= 0` 这种**必然成立**的门
在服务端恒为假 ⇒ **那条分支永远不开，而两端都报成功、零诊断**。

实测对照（同一组值，2026-10-01）：

| 形状 | TS | Python（原） |
|---|---|---|
| `affection=0, gte 0` | **true** | **false** ← 缺陷 |
| `affection=0, eq 0` | **true** | **false** |
| `mood="", eq ""` | **true** | **false** |
| `flag=false, eq false` | **true** | **false** |
| `affection=0, gte 1` | false | false |
| 只在 `custom_state` 里的字段 | true | true |

**修法**（`backend/app/domains/runtime/service.py`）：用哨兵把"字段不存在"与"字段值是假值"分开——
`getattr(s, field, _FIELD_MISSING)`，**只有真的缺席**才回退 `custom_state`。
这正是 TS 侧 `!(field in state)` 的语义，不是发明新口径。
哨兵**不能用 `None`**：`None` 恰恰就是这个 bug 的成因，所以那个 `object()` 后面写了注释钉住。

**形状翻译仍由消费者做，语义不翻译**：向量里这一族拆成 `chars`（TS 的 `vars.characters` 字典）
与 `custom`（Python 的 `custom_state` 回退源）两段——TS 侧合并成一个字典，Python 侧拆成"行属性 + 回退"，
这样"回退只在真的没有时发生"这件事**两边的判据长在各自真实形状上**，而不是把两边揉成同一种形状把语义糊掉。

牙：把 Python 装回 `or` 短路那个原形状 ⇒ **4 failed**，点名的正是那四条假值用例。
"别过度修正"那条（`0 gte 1` 仍为假）也在向量里 ⇒ 防止有人改成"什么缺失都当真"。

**这次自己犯的错，两次，都是"改数据"而不是"改代码"**：
① 我建的行字段叫 `cond`，而我随后那个键重排脚本的白名单里写的是 `condition`
⇒ **`condition` 被整个丢掉 7 条**，TS 拿到 `undefined` 条件（`if (!condition) return true` 于是全返真、
看着像"这一族全坏了"），Python 直接 KeyError 7 红。**教训：先 `assert` 每个消费方要的键都在，再跑**。
② 新条目漏了 `id` 字段 ⇒ 用例名渲染成 `undefined`，一条假红。**教训：向量的 `id` 也是数据的一部分**。

**仍未锁的**（登记，不假装已锁）：`relationship` 与 `codex` 的**行为本身**——
它们在 Python 侧不存在，**没有第二份实现可对**，只能靠 TS 单侧行为 + 清单绊线。
等哪天真有人给后端补这两族，或者 Python 彻底退场、只需证明"桌面端这族行为正确"，
才谈得上对它们做同等级别的锁。

### 十二、锁「键语法 + 写读往返」⇒ 一条跨族不一致，**降级为待决 ⑯**（并更正我两次说过的头）

上一批留的债是"锁 `relationship` / `codex` 的行为本身"。本批锁的是**键怎么分段**与**写进去能不能按同一个键读回来**。

**为什么不塞进跨实现向量**：那两族在 Python 侧**不存在**，跨实现向量覆盖不到。

**为什么必须走一遍 effect**：只测读侧，分不出「两侧**同规则地**丢段」和「两侧**不同规则**」。
实测 `relationship` 写 `A.B.affection.mood=7` 落进 `{affection: 7}`，
于是**短名读得到、长名读也得到**——两者读到同一格，这才是"配套"的证据；
若只断言"长名读得到"，哪天有人只改读侧就会静默变成错配。

**量出来的跨族不一致**：

| 族 | 键规则 | 键能带点吗 |
|---|---|---|
| `character_state` | 切**第一个**点，**其余整体**是字段名 | **能** |
| `codex` | 切**第一个**点，**其余整体**是记忆键 | **能** |
| `relationship` | 按点切，取第 3 段，**第 4 段起静默丢弃** | **不能**，且零诊断 |

⇒ 同一个"带点的字段名"在两族里一个可用一个不可用。**降级为待决 ⑯**：① 改成"其余整体"
（**向后兼容**，所有现役 3 段键行为不变）；② 保持丢弃但**补诊断**（不改语义）。
复审不单方面选——① 改的是**键语法**（与 ⑭ 同族，ADR-016 冻结面），② 引入新的告警通道
（"零诊断"本身在前几批被反复当缺陷治，但那是**分支开错**类，这是**作者写错字**类，代价不同）。

牙：改**写侧** ⇒ 2 红；只改**读侧**（真错配）⇒ 2 红。

## 本次审计我自己说过的头（更正留在案）

1. **"生产代码从不往 `vars.relationships` / `vars.characters` 里写 ⇒ 这两族运行时恒为假"——错。**
   我 grep 时把 `conditions.ts` 过滤掉了，而写入就在那个文件里（`applyEffects` 的两个分支）。
   **今天第二次被自己的过滤器藏住答案。**
2. **"作者打错字会静默开错分支"——过头。** 实测读写**同规则** ⇒ **无错配**，
   残留的只是"多写的第 4 段被静默忽略" + 跨族键语法不一致。

**共同根因**：两次都是**先下结论、后补测量**。顺序应当是**先量读写两侧、再定性**；
过滤器要先确认它没把答案藏起来再下结论。判据已经补进 `families.json` 的 `_note`，让下一个人不必重新踩。

> **⑫ 交付：同一个 `.axsp` 现在能重复导入——身份重映射补到节点与边（2026-10-09 第四十八次续做）**
>
> 接手第一件事不是写代码，是**重测环境**：距上次停车 7 天，`git status` 从 62/17/28 变成 78 M/36 ??，
> `axspImport.ts` 在 10-05 被改过，另外多出条件向量一族的新工作。HEAD 仍是 `1b9ca06`（无人提交）
> ⇒ 上周的读数一律不引用，全部按当前树重取。这一条写在最前面是因为它曾是本项目的老毛病：**拿昨天的绿当今天的证据**。
>
> **前提核实**：`project_nodes.id` / `project_edges.id` / `project_roles.id` 都是**全局** `TEXT PRIMARY KEY`（不是 `(project_id, id)` 复合键），
> 而导入侧只重映射角色 id 与节点的 `stageId`。所以包里的节点与边原样插入必撞。
>
> **RED 的三种形状在这一刀里同时出现，值得记**：
> ① **缺陷复现条当场就绿**（真 SQLite 上原样导第二次 ⇒ `ok=false`、整批回滚、第一份无损）——它钉的是"今天为什么坏"，不是"我要实现的期望"，
> 所以它天然通过；把它误当成判据失败会白白推翻一个正确结论。
> ② **期望行为条红**在 `remapNodeIds is not a function`（API 还没生）。
> ③ **我的夹具自己撞了同一个坑**：拿源工程的 bundle 先往"第一个新工程"插，结果第一次就失败——
> 因为包里的 id 已经在这台机器的库里。这等于第三次独立确认同一件事，而且把缺陷的严重性从"导第二次"抬到
> **"从本机导出的包，导回本机连第一次都失败"**。修法不变，但这条读数要按这个更宽的说法写。
>
> **实现**：`remapNodeIds(project)` 放在 `packages/editor-core/src/axsp.ts`，与 `remapCharacterIds` 同族同形状；
> id 取 `rows.ts::uuid`（存储行 id 的唯一权威，不另造第二个生成器）；
> 同时换**节点 id、边 id、边的 `source`/`target`**——只换节点不换边是把"撞主键"换成"边悬空"，那更安静、更难发现。
> 纯函数、不改入参、`narrativeData`/`editorData`/`axsSource` 一字不动：图内跳转按 Beat 标题寻址（ADR-016），
> 节点 id 只存在于边两端，所以"要换哪些字段"是由**寻址方式**决定的，不是靠列清单列全的。
>
> **判据分层，且没为测试污染产物层**：真库那半在 editor-core（`SqlJsBackend` 只在包内可达；
> **没有**为 apps/web 的测试把它新开成公共导出——那会把 sql.js 拖进 web 的入口依赖图，代价落在发布产物上）；
> 通路那半在 apps/web 的往返条（新旧工程节点 id 互不相交、边数相等、边内容等价、边两端解析得到）。
>
> **既有基线改的是连接键，不是覆盖**：`seedPlayable.test.ts` 原先拿随包文件的原始 id 去 IR join，身份一换那 join 天然失效；
> 改成「节点数 + 有舞台的节点数 ↔ 有 `sceneId` 的 Beat 数 + 每个 `sceneId` 真在 `scenes` 里 + `sceneTitle` 非空」——
> 舞台解析那半反而更宽（遍历全部 Beat，不再只遍历 join 得上的那些）。
> 往返条的夹具从 **0 条边补成 1 条边**，否则"边两端跟着换"是一条**恒真的空判据**。
> 还有一个中文断言的坑：我先前用 `.sort()` 比标题多重集，默认按码点会把「乙拍」排在「甲拍」前 ⇒ 判据红在排序规则上而不是产品语义上；
> 改成 `toContain` + 长度。**CJK 一律不要用默认 `sort()` 断言顺序。**
>
> **三刀变异**（每刀先 `grep` 出被改的那一行再跑）：只换节点不换边 ⇒ editor-core 2 红 + web 往返 1 红；
> 节点 id 根本不换 ⇒ 2 红（含"互不相交"条）；把 `axspImport` 里的调用摘掉 ⇒ web 往返**恰好 1 红、其余 166 条仍绿**。
> 第三刀的读数很重要：它说明**通路判据只有往返条在守**，`seedPlayable` 那三条换了连接键之后不再对身份敏感——
> 这是覆盖面真相，不是我的夸大，三刀均以 `cp` 还原、`diff -q` 一致。
>
> 末轮（06:37）：`gates` **0**（14 道，`[desktop-seams] OK 9 / 有判据 6（真断言合计 99）/ 基线 3`）、
> editor-core `tsc --noEmit` 0、web `tsc -b` 0、web storage 套件 **167 passed + 1 skipped**、`[doc-citations] OK 209 / 越界 5（基线在册，非本轮新增）`。
> **两套 e2e 本轮欠着**：端口 8000/5174/5274 上有一支 8 天龄的别人的 dev 栈，非 CI 下 `reuseExistingServer` 会让套件测到别人的代码；
> 本轮改的是产品代码（导入通路），所以这条欠账必须在 §5 写明，不能拿上周的 37/50 当今天的点击层证据。

> **⑫ 的点击层补上了，顺手把我自己那句"结构上点不了"纠正到准确形状（2026-10-09 第四十九次续做）**
>
> 跑之前先做一件本会话被反复教育的事：**证明端口上是被测代码**。5174 上那支 vite 起了 9 天、不是我起的，
> 所以先 `curl localhost:5174/src/shared/storage/axspImport.ts | grep -c remapNodeIds` ⇒ **2**（`main.tsx` 里 `shellSmokeGate` 同样 2，
> 且返回的是转换后的模块、`"DEV": true`，不是 404 页）。证明成立，`e2e:desktop` 的读数才算数：**38 passed**（37 + E43）。
> **浏览器那一半我没跑**：8000 上是别人的 `uvicorn app.main:app --reload`，它连的是**开发库**而不是 `axiforge_e2e`；
> 复用那台等于把测试数据写进用户库——这不是"读数差一点"，是不可逆的副作用，所以我停下并写明欠账。
>
> **E43 测的是此前完全没有判据的一条路**：`.axsp` 导入。同一个 `showcase-1.axsp` 连导两次 ⇒
> 两次各自落到 `/studio/projects/<id>`（内存库给顺序 id，实测 `proj-0001` / `proj-0002`），"还没有剧本"消失，没有「导入失败」弹窗。
>
> **一条纠正，也是一条过头**：上一轮我说「`openBinaryFile` 在测试宿主里结构上点不了」，随后我用 `filechooser` 把它点通了，
> 于是写下"那句话是错的"。**纠正过头本身又是错**——真正的原因被下一条测试暴露：
> `openBinaryFile` 先判 `isTauriEnvironment()`。**注入桌面标记（E17 一族的做法）时它走 `@tauri-apps/plugin-dialog` 支，
> chromium 里确实开不出选择器**（我的第一次尝试就 60s 超时在这）；**不注入标记、只用 `?storage=memory` 时它走
> `<input type=file>` + `click()` 回退支，Playwright 接得到**。所以准确说法是"两支持别"，而不是"我说错了"。
> plugin-dialog 那一腿仍归真壳手验（待决⑦），我没有为它造 mock picker——那会给测试宿主新增一种壳语义，属新决策。
>
> **两条差点写成假判据的东西，都删了**：
> ① 「零 `/api/v1`」——不注入标记时页面照旧发 4 笔（`users/session`、`editor/projects/user/<creator>`、`llm/health`），
>    因为那些消费者由 `isLocalOnlyDeployment()` 闸门，与 `?storage=memory` 不是同一条件。
>    在 E43 里断它会得到一条**永远为假**或**靠运气**的判据；把 `hits` 降级成断言消息里的诊断上下文，
>    并删掉我差点留下的 `hits.length >= 0`（恒真条，等于没判）。
> ② 「列表里有两张卡」——第一次按标题文本数，撞上页面顶部【示范】条带的同名项，且那个条带的元素在 Playwright 下
>    60s 内一直 "not stable / detached from DOM"；第二次改按工程 id 找 `a[href]`，`element(s) not found`（卡片不是锚点）。
>    结论：**这条判据今天写不出稳定形状，我选择不写**，而不是猜一个能过的选择器。
>    顺带留下两条只登记不处置的观察：【示范】条带永不稳定意味着列表可能在持续重渲染（`key` 用的是 `proj.id`，不是重复键，怀疑无限动画），
>    以及卡片不是锚点 ⇒ 列表的可访问性形状值得单独查。
>
> 末轮（06:55–06:56）：`e2e:desktop` **38 passed** 0、`tsc -p tsconfig.e2e.json --noEmit` **0**、产品代码本轮一字未改
> （所以上一批 `gates` 0 仍代表代码状态）、`.e2e-lock` 跑完不在。

> **把 S13-3 从"每次靠人读"变成一条五步收紧的数据链（2026-10-09 第五十次续做，对应 HANDOFF §4 第三十四…第四十一批）**
>
> 起点是一句我自己说过的话：「桌面态真会打到 `/api/v1` 的有 34 条」。**今天结束时这句话被证明是错的**，
> 而把它证伪的过程就是这一整条链。为什么值得为一张"清单"做五轮：S13-3 要求逐条定性（判死 / 本地化 / 只差接线），
> 而每一轮都要重新读 `shared/api` 的话，结论会随代码漂移变成假话——这正是本文件反复登记的那类失效。
>
> **五步，每步都只解决上一轮留下的一个具体假读数**：
> ① 装载面普查两臂（`check:http-inventory`）。桌面臂原来只注入 `__TAURI_INTERNALS__`，在 chromium 里必败，
>    于是报出一个**空载装出来的 0**。改成"标记 + `?storage=memory`"（要一个真可读写的本地库）并补齐路由到 9/9 ⇒ `DESKTOP_UNIQUE=0 / BROWSER_UNIQUE=11`（浏览器臂是正对照）。
> ② 端点面六档（`cloud:callmap`）。95 个端点定义 ⇒ 死面 12 / 仅 HTTP 实现侧 9 / 绕过 34 / 已有分派口 26 / 混合 6 / 已接本地 8（相加 95 才敢用）。
>    这一轮抓到分类器三处错：分派口只认 `*Saves` 命名（漏 `getStorageProvider`）、符号归属取每文件第一个 `xxxApi`、HTTP 实现文件被当界面绕过点。
> ③ 资源 → 本地承载三态。**词元匹配从 substring 改成下划线/camelCase 全等**（`play` 曾匹进 `player_achievements`），
>    且**只有路径末段命中才算"该资源自身有承载"**（`/characters/{id}/versions` 的 owner 是 characters，但"版本"没有专属表）。
>    22 / 6 / 4 / 1 / 1 = 34。
> ④ **壳守卫算到调用点**——这一步才真正改掉那句错话：34 条里有 5 条的调用点带 `enabled:` / 早退守卫，桌面根本不发。
>    按文件算会把 `useRelations.ts`（五条查询只有 `presets` 带 `enabled`）读成五条全安全，所以判据必须定位到"被保护的那一次调用"：
>    S1 同块（含调用**之后**写在同一对象里的 `enabled`）／S2 同句（块头）／S3 早退（祖先块的直接子语句且含 `return`/`throw`）。
>    ⇒ **绕过 34 → 真会打出去 29**，其子集分档重算为 17 / 6 / 4 / 1 / 1。两次变异各证一头：关 S1 ⇒ 9→2；去掉 S3 的深度限制 ⇒ 9→**11**（把 `versionApi.get/rollback` 错判成安全）。
>    S2 在本面 0 命中，于是**把扫描面扩到"混合"**让它有真样本，另用合成样本正反各两条钉住。
> ⑤ 死面的两侧证据：读者面（`apps`+`packages`+`e2e`+`scripts` 448 文件，跑在剥注释与字符串之后的文本上）× 后端路由（107 个 .py 解析出 148 条）。
>    12 条死面前端读者**全部为 0**、后端路由 **11 在 / 1 不在**。
>
> **⑤ 里那条"不在"是新登记的缺陷**：`projectApi.updateProjectNode` 指向 `PUT /editor/projects/{projectId}/nodes/{nodeId}`，
> 而后端 `backend/app/domains/narrative/router.py` 对 node 的 PUT 只有带 scenes 段的那条（:237），DELETE 同理（:254）——**既零读者又指错**。
> 零读者 ⇒ 今天无用户影响；摘不摘仍归待决 ②，我没有替自己拍这块板。
> 同一批还留下一条**反面信息**：调用过任何 `xxxApi.method(` 的测试/e2e 文件数 = 0（机器算的，不是印象）。
> 所以判死这批不会碰坏任何测试，代价是 api 层在测试层零覆盖、判错了没有回归网。
>
> **本轮的工具缺陷与流程错误，一并留档**：
> `useRe` 带 `g` 却被跨文件反复 `.test()` ⇒ `lastIndex` 跟着对象走，理论上会静默漏计调用点（今日语料实测两版全等，属"形状上的洞"，已去掉 `g`）；
> 一次 `grep` 空输出其实是脚本 `SyntaxError: suspect 已重复声明`——**判据脚本空输出先取退出码和输出尾部**；
> 一次 `Edit` 漏传 `old_string` 把 `const root = process.cwd();` 整行吃掉，`node --check` 通过而运行时 `ReferenceError`——**改完脚本必须真跑一次**；
> 两套分档交叉时我差点把母集数 22 当成子集数写进文档（正确是 17）。
>
> **限度（写在脚本头，不在这里冒充判据）**：本表只列 `apps/web/src` 的调用点；正向匹配必须回代码核对（`getCharacterStates` 是词元全等也挡不住的语义假阳性）；
> "桌面不可达"只认调用者完全落在 `features/discover/` 下；`Clearance/` 在遍历跳过清单里写死（未纳管且含 `.env`）。
> 三道普查都**不进 `gates`**：它们需要读 `backend/` 或扫全仓，且给的是定档弹药而非回归判据——把候选清单当成门禁是这个工具最容易被误用的方式。
>
> 末轮（08:53）：`cloud:callmap` **0**（连跑两次逐字节相同）、`gates` **0**（14 道；`[doc-citations]` 已判定 211 / 越界 5 = 基线数、`[desktop-seams]` 9 / 有判据 6 / 真断言合计 99、`[file-size]` 349 文件 0 越线）、
> 单测 **706 passed + 1 skipped**（`awk` 从门禁日志加出）、`git diff --check` 0 行、`.e2e-lock` 不在；
> 产品代码自 ⑫ 交付（第三十一批）后一字未改，所以点击层沿用**带取数时间**的读数：`e2e:desktop` **38 passed**（2026-10-09 06:55）、`e2e` **50 passed**（2026-10-01 收口那一次）；
> 浏览器那一半今天没重跑，继续欠在别人的 dev 栈上（8000 上那支 uvicorn 连的是开发库）。

> **「活着但没人测的本地读写」这一族从手工发现做到九格收口（2026-10-09 第五十一次续做，对应 HANDOFF §4 第六十八…七十二批）**
>
> 为什么这一族单独做：现有两道门禁都看不见它。`check:seams` 只认平台分支（`__TAURI_INTERNALS__` / `contextBridge` 那一类形状），
> `check:dead-surface` 只管 import 闭包之外——而这九个模块**都在闭包内、都不是平台分支、却全在真写用户的机器**。
> 桌面化把云端面挡掉之后，本地持久层就是剩下的唯一有状态表面，它出问题的方式是"数据没了但界面没说"。
>
> **分母先按命令取，不按印象取**：`grep -l localStorage apps/web/src/shared/lib/*.ts` ＝ **9 个模块**。
> 我第一版心算成"七个"，写收口结论时按 `grep -c` 重取才纠正过来——收口类句子必须先测分母再测覆盖。
> 现状：**8 格有同名测试**（`playerUnlocks` 10／`creatorId` 8／`playerToken` 8／`playerSettings` 8／`llmSettings` 7／`playerReadState` 7／`routeHistory` 7／`draftManager` 10），
> `identityLink.ts` 仍无同名测试——它两个身份绑定导出**全仓零 import**（只有 `reportContent` 被 `DiscoverProjectsTab` 用），属 S13-3 判死名单该过的一格，
> 我不给可能判死的函数搭测试设施；它的键耦合在下面那段第七十二批里已结构性关闭。
>
> **本轮真正值得留档的是三次自我证伪，不是这 68 条新判据本身**（web 单档从 241 → 309，差值正好 68）：
> ① 上一批我写的「重复解锁…**且不重新写盘**」用的是 `expect(raw).toBe(before)`。设计本批变异时发现：重写同样内容得到的字符串与原串**相等**，
>    `toBe` 比的是值 ⇒ 那一半当时没有牙。给替身加**写入计数器**后，变异 U2（保留去重、只拿掉"跳过写入"）给出直接证据
>    `AssertionError: expected 2 to be 1`，而同一条里"只有一条""内容不变"两个断言全放行。
>    推论要记下：`check:seams` 第三层数的是"有没有真断言"，它**看不见**这种弱判据——它测的是断言能否读，不是能否失败。
> ② 我以为"草稿存不上时 `DraftIndicator` 会说『✓ 已保存』"。顺着数据流读到 `markClean()` 只在角色真保存成功后被调，就把这条否了；
>    真实后果弱一档：草稿**静默丢失且无任何提示**（表现是下次不再问你是否恢复）。玩家侧同 hazard 已有 `syncNotice`，角色草稿侧没有——补不补是定档，登记不处置。
> ③ `git rev-parse --short desktop-handoff-20260929` 打出 `dbf1dde` 而非 `1b9ca06`，一度像"tag 被动过"。
>    实际它是附注标签，`%(*objectname)` peel 后仍是 `1b9ca06`、taggerdate 未变。比对引用必须 peel，这句已写进 HANDOFF §6。
>
> **两处平台/工具形状**（下次直接照抄，别再试）：
> `globalThis.crypto` 是 getter-only（`configurable: true`、无 setter），`vi.stubGlobal("crypto", {})` 直接抛 `TypeError`；
> 只能 `Object.defineProperty` 换值、`afterEach` 装回 getter，并且**两条分支各带一条探针控制位**（先断 `"randomUUID" in crypto` 为 true，另一条断为 false），
> 否则"分支没走到"会伪装成双绿。`fileURLToPath(new URL("../..", import.meta.url))` 返回**带尾斜杠**的目录，
> 遍历用 `${dir}/${name}` 拼接会得双斜杠路径，令任何"干净路径"豁免集永不命中——症状是扫描判据开局就红、且红在被豁免的文件身上。
>
> **最后一批动了产品代码**（第七十二次）：身份键两串字面量原手抄在四文件八处，收成 `CREATOR_ID_KEY`／`PLAYER_TOKEN_KEY` 单一权威（键值一字未改）。
> 这道缺陷是**没有类型、没有门禁能看见**的：只改权威一处，登录与恢复身份就写进孤儿 key，而 `getCreatorId()` 读新 key 铸出全新身份
> ⇒ 本地作品库按 `author_id` 整片不可见、界面上零错误。新判据 `identityKeyAuthority.test.ts` 的搜索串**由真相源运行时 import 得来**，
> 所以守卫文件自己不含那两串（不会被自己的注释喂饱），改名时它自动跟着真相源走；另带扫描面地板 `>=200`（实测 255）与"权威确实带着串"两条对照位。
> 归一判据按在册纪律做**双向**：改真相源 ⇒ 值钉类 6 红而扫描仍绿；把字面量抄回 `UserContext.tsx` 或 `identityLink.ts` ⇒ 扫描红并点名是哪个文件。
>
> 末轮（16:45 复取，因这批改过云端面上的文件，沿用旧绿灯对这一项不成立）：
> `cloud:callmap` **0**——死面 11／仅实现侧 9／绕过 34／有分派口 27／混合 6／本地已接 8，未守卫调用点 37、宿主可达 20、端点级 24/30，
> **逐档与 16:06 那次全等**（改动只是把字面量换成 import，没有增删调用点）；`check:http-inventory` **0**——桌面态零 `/api/v1`、
> 正对照浏览器态 20 个唯一调用点、`ROUTES=25`（解析得出）、`SPEC_URLS=64`、正则 33/33、完全没证据的路由 0。
> `gates` **0**（十五道；`test:unit` **774 passed + 1 skipped**、web **309 passed | 1 skipped**、`[file-size]` 349／0、`[desktop-seams]` 9／6／99、`[dead-surface]` 面 294）·
> **`e2e:desktop` 重跑 62 passed／0 skipped（2.9m）**（产品代码动过就必须重跑点击层，这条不能沿用）· `git diff --check` 0 行 · stash 0 · `.e2e-lock` 不在 ·
> 三引用按 peel 仍 `1b9ca06`，本会话未提交未推送未动 tag；`e2e`（浏览器那一半）继续欠着，等一句授权。
>
> **第五十二次续做**（2026-10-09 19:03，覆盖 HANDOFF 第七十三～八十二批；这一段的主题只有一个：**把"已经收口"的每句话交给机器看着**）
>
> 三批新判据把云端面的最后一格补上：`e2e:desktop` **62 → 68 passed／0 skipped**——
> **E56**（账户页三条从未按名守过的动作入口）· **E57**（发现页四个 `?tab=` 子视图各访一遍，逐 tab 断占位符做正对照）·
> **E58**（`/comments/{id}/report` 那颗「举报评论」键；难点是浏览器臂**必须喂一条别人写的评论**才点得亮，
> 于是三条通路全部 `page.route` 就地应答，**连举报的 POST 也本地应答 ⇒ 一个字节都不出浏览器**——
> 本机 :8000 跑着他的 uvicorn、vite 代理 `/api`，这是前提不是加分项）。
>
> 然后是两次"自己写的话自己不信"：
> ① `cloud:callmap` 加**第十四段**＋真相源 `scripts/desktop-cloud-judgements.json`——「第十二段那 12 条已逐条有判据」
>   原本只活在 README 里，改一个测试标题就静默变假。**身份键用标题原文不用 E 编号**（E20/E29 是在册的幽灵编号）。
> ② `check:dead-surface` 长出**第二档＝多余的对外出口**（导出级，基线 24 条／340 个具名值导出／参考池 424 文件）：
>   模块级判据看不见「活着的面包着死的口」，而 `identityLink.ts` 那三个零 import 的身份绑定导出正是 S13-3 该数清的一格
>   （顺带把时机档「不明 8」定性完：**5 条死出口／1 条分派口远端支／1 条只在浏览器态／1 条已被守**，没有一条会在桌面真打出去）。
>
> 途中修掉一处**共用遮蔽层的真缺陷**：`maskNonCode` 不认正则字面量，`{url.replace(/^https?:\/\//, "")}` 被当成行注释抹到行尾
> ⇒ 花括号失配 ⇒ "函数体"只剩一行 ⇒ **整页早退判据被结构性吃掉**。方向要说清：遮蔽过度是**藏缺陷**（保守上界从 20 缩到 16 是修复的副产物），
> 不是虚报；同批把判据抽成纯函数并配 5 条合成样本（3 正 2 反），不一致就 `UNRELIABLE` 退出 1。
>
> 两次自我更正（都写进了 §4，不是悄悄改）：上一批写的「档位计数未变」当场被推翻；
> 取变异牙时我写的 `io.open(f,"w").write(io.open(f).read()+…)` **先截断再读**，把 `identityLink.ts` 写成空壳，
> 造出一串看着像"图判据对内容敏感"的红——只读探针复测同一改动证明是我的工具误用（产品文件靠"写前快照＋还原后相等断言"零损失救回）。
>
> 末轮读数（19:02 一次取齐）：`gates` **0**（**仍是十五道**，第二档长在既有命令里；`test:unit` 774 passed + 1 skipped；
> `[dead-surface]` 第一档 10 在册／面 294／闭包 245，第二档 24＝基线 24；`[seams]` 9／6／99；`check:citations` 已判定 **254**）·
> `pnpm cloud:callmap` 与 `LOADFACE=… pnpm cloud:callmap` 各 **0**（台账 12／B 档 12／缺判据 0；逐档与 18:15 四次全等）·
> `check:http-inventory` **0**（`ROUTES=25`、桌面 0／浏览器 20、完全没证据的路由 0）· `git diff --check` 0 行 · `??` 52
> ⇒ **待显式 add 十一份**（九份 `.test.ts`＋`desktop-cloud-judgements.json`＋`dead-export-baseline.json`，两份新基线都是"不在就红"的锁）·
> 三引用按 peel 仍 `1b9ca06`，本会话未提交未推送未动 tag；`pnpm e2e`（浏览器那一半，会写他的开发库）继续欠着，等一句授权。

### 十三、把 S13-6 那个"二选一"量成一行可决：`.axsp` 侧是后端播种的**严格超集**

计划里四个"未完成"阶段（S13-3/4b/6/7）**全部卡在口径决定**上，两个"部分完成"里
S13-2d 只剩 `PromptExport`（未接线＝等 #60）、S13-5 剩 CI 配置。
所以"下一阶段"没有一个能自主推进——**可控的最高价值活，是把挡在最前面的那个决定压到一行可决**。

S13-6 的前置是「随包示范作的**重建权威**二选一」。量法：借 `test_seed_showcase.py` 的 `client` fixture
真跑一次后端播种（一次性探针，量完即删），把产出与 `apps/web/public/seeds/*.axsp` **逐项对齐**——
节点按标题**多重集**比、边按「源标题→目标标题」比（两边各有 2 个同名「开始/结束」，按 id 比会误判）：

| 示范作 | 场景 | 节点 | 角色 | 边（后端） | 边（`.axsp`） |
|---|---|---|---|---|---|
| 序章·交汇 | 2 | 7 | 0 | 1 | 1 |
| 缘起·选择 | 2 | 7 | 1 | 1 | 1 |
| **再会·记忆** | 2 | 7 | 1 | **3** | **5** |

- **节点集合三部全同**（多重集相等；顺序不同，但那落在 `sortOrder` 上，不是内容差）。
- **唯一的差异**：第三部后端**少 `她记得你→结束` 与 `陌生重逢→结束` 两条收尾边**
  ⇒ **后端播种的第三部有两条走不到「结束」的断头分支**。
- **时间线对得上**：`seed_showcase.py` 停在 2026-08-29 `0b38b90`「示范作关系分支」——
  那个提交**加了分支、漏了收尾**；`.axsp` 停在 2026-09-24 `f05971a`「桌面空库首启播种」，收尾齐全。

⇒ **宣布 `.axsp` 为权威在内容轴上不是取舍，是严格改进**。剩下的才是真决定：今后改内容以谁为准。
复审**建议「宣布 `.axsp` 为权威」**，因为 `desktopSeed.ts` 已经在真消费 `/seeds/manifest.json`
（不是待接线），所以这条**零新增工程**；反方向的「把内容定义/导出器迁进 TS」是
为"以后想 diff 内容"付今天的工程债。两个选项的完整代价已写进 `HANDOFF.md` §6 ②'。

**这一批没有改产品代码**（只有一次测量探针，已删净并复核 git 面干净）——
它是这一串复审里少见的"**不动代码也能推进**"的一类：把决定所需的分母量出来，让决定从"要不要"变成"选哪个"。

### 十四、这一轮真正的头条不是 S13-6：**工作区在复审途中被换掉了**

把 S13-6 那个决定量完之后，我按惯例重跑全链，发现读数对不上：

- 我这一轮前面三次 `pnpm e2e:desktop` 都是 **37 passed / 退出码 0**；
- 同一条命令、同一棵树，第四次是 **77 tests、75 passed、2 failed、退出码 1**。

同一棵树不可能既 37 又 77。查下来是：**`HEAD` 已从 `1b9ca06` 走到 `4bdb4fb`**，
reflog 里有 **13 笔提交**（`fb810f9` → `71422b5` → `7b797f4` → `5489665` → `f317dbf` → `4bdb4fb`），
而 handoff 里写着「**已 push**，快进 `1b9ca06..f317dbf` 十三笔，**tag 未动**」
⇒ **另一会话在我复审期间把我这一轮的活提交并推送了**（`REFACTOR.md` 里那些 2026-10-09 的段落
与 E43、`remapNodeIds` 都是那一轮的东西）。git 面随之从 `78 M / 17 D / 36 ??` 变成 `3 M / 11 ??`。

**这直接推翻了我记进文档的数字**（`e2e:desktop 37`、单测 `693/700/703`）——
它们当时是真的，但**不再是当前树的读数**。本项目的老毛病是"拿昨天的绿当今天的证据"，
这次是"**拿上一轮���绿当这一轮的**"，而中间隔着一次别人提交的推送。
已在 `HANDOFF.md` 顶部加**「当前树权威状态」**一节，明写下面所有历史读数分属不同的树、不可混用。

**当前树诚实读数**：`gates` 0 · 单测 **796 passed + 1 skipped**（core 143 / axs 97 / editor-core 192 / web 325 / admin 39）·
后端 **226 passed** · **`e2e:desktop` 75 passed / 2 failed（77）** · **`e2e` 89 passed / 1 failed（90）** · `git diff --check` 0 行。

### 十五、三条 E2E 红：一条当场修掉，两条定位清楚但**不擅自重构**

**E64 当场修掉并验证转绿**（`e2e/desktop-http.spec.ts:2354`）：`getByRole("button", { name: "演出" })`
与后来新增的「预览此节点演出」**可及名子串撞车** ⇒ strict mode 报 2 个元素。修法是 Playwright 自己给出的 `exact: true`。
它同时是一条通用证据：**新增可及名要回头复查既有选择器**——这类撞车不会让旧测试变红，只会让新测试变成"红在别人头上"。

**E40 / E43 定位清楚，但处置是口径，不该我单方面重构别人刚提交的测试**：

| | 现象 | 硬证据 |
|---|---|---|
| **E40** | 无后端配置下，浏览器那一半创建工程失败、URL 停在列表页 | 测试自己的注释写着「**走真后端（这一半本来就要发云端请求）**」；**带后端 `pnpm e2e` 里 ✓、不带 ✗** |
| **E43** | 两套配置都红，**且 flaky** | 无后端断在前置（`还没有剧本` 不出现——请求失败落 `error` 态，而页面「**错误不得显示成空态**」是对的）；带后端断在断言处（`toHaveCount(2)` 读到 **0**） |

两条的共同点值得记：**它们住在"只起 vite、不起 uvicorn"的配置里，却依赖后端**——
而那份配置的注释写着「用例如果偷偷依赖后端，就会在这一份配置下红，**那正是我们要的信号**」。
**所以这两条红是信号在响，不是意外**；我先前一度想直接动手改它们，停下来是因为处置本身是口径：

- E40 的名字是「**两半各有一条断言**」——**断言跨两种环境差异的测试，结构上无法只活在单一环境配置里**；
- E43 的**被测对象**（本地库重复导入，桌面本地行为）与**观测面**（页面级 HTTP 消费者供的列表）**不同源**，
  且对同库其他测试的副作用敏感（E64 这次跑过之后它就红）。

三个候选（按环境拆条 / `page.route()` 打桩 / 记成常驻红）连代价写进 `HANDOFF.md` 待决 ⑰。
其中"给测试宿主造假的云端形状"与项目此前明确拒绝过的做法同族（"为 UI 走不到的路径造工程"、
plugin-dialog 宁可归真壳手验也不造 mock picker），所以我不推荐它；
而"记成常驻红"最接近本项目一贯的反面（全绿正是这条基线唯一的信号），所以我也不推荐。
**另有一条独立于三选之外**：E43 的被测对象与观测面不同源，**本身可能是产品侧的一致性问题**（本地库写入后列表为何不刷新），
值得单独查一次，**不要当成测试问题一并盖掉**。

**这一批的净产出**：1 处产品级修复（E64）+ 1 条被压到一行可决的 S13-6 决定（见第十三节）
+ 当前树权威读数 + 两条定位清楚的红。**没有擅自动别人的测试形状。**

## 十四、合并 `desktop` → `main` 前的自查：干净 clone 才是判据

计划里的四个"未完成"阶段全部卡在口径决定上，本轮把重心转到**主线归属**：
`desktop` 是否可以快进合并进 `main`、并且**完全优于** `main`。

### 结构层：严格超集，可以无损快进

`git rev-list --left-right --count main...desktop` = **`0 / 277`**
⇒ main **没有任何** desktop 不含的提交；desktop 有 277 笔 main 没有的。
main tip 停在 `777591f "feat: v0.4"`（**2026-07-09**，落后约三个月）。
528 文件、+67711 / −3613。desktop 会顺带删掉 main 上的 2 个文件（`ProjectFlowPage.tsx`、
`docs/ADMIN_VNEXT.md`）：都是重构有意删的，desktop 上只剩文档/历史提及、**无悬空 import**。

> **更正一条我自己判错的事**（同一轮里先写进文档、后查清）：我曾把 `docs/archive/AXIFORGE_V2.md`
> 里那条指向 `ADMIN_VEXT.md` 的相对链接记成「指向已删文件的死链」。**不成立**——
> 那个链接相对 `docs/archive/` 解析，指向**归档副本** `docs/archive/ADMIN_VEXT.md`，文件在树里。
> 我是拿 `git diff` 的删除清单直接套到相对链接上得出的结论，而相对链接的基点是**所在目录**。
> 全仓实测：跟踪文档的 Markdown 链接**没有一条是死的**（唯一两个初判"死"的
> `docs/user/README.md` 那两条是无扩展名的站点干净 URL，落点是 `desktop/desktop-and-axsp.md`
> 与 `writing/axs-syntax.md`，都在）。
> **教训**：从"某文件被删了"推出"指向它的链接死了"，中间隔着一步——链接基点是不是仓库根。

### 但"完全优于"不成立：合并进去的那棵树，CI 本来会红

`package.json`（已跟踪）引用三个**不在树里**的脚本：`check:apibase` / `check:tracked` / `cloud:callmap`
各自指向 `scripts/check-apibase-literals.mjs` / `check-chain-tracked.mjs` / `cloud-callmap.mjs`。
三个都不在 `gates` 的 15 条里，所以**本机 gates 绿**；而 `check:citations`（在 gates 里）本机绿是靠
`existsSync` 命中磁盘上那份未跟踪文件，**干净 clone 上判 `missing` ⇒ gates 红 ⇒ CI 红**。

这不是新问题，是 `docs/HANDOFF.md` 里已记载的同一类（"门禁脚本与基线自己也在未跟踪里……
干净 clone 上 `pnpm gates` 整条链跑不起来"），10-10 那轮修了一部分，**这三个漏了**。

补齐时又当场抓到**第四处、第五处**同一形状：
- `cloud-callmap.mjs:1230` **真去读** `scripts/desktop-cloud-judgements.json`，而台账自己未跟踪 ⇒ 干净 clone 上它自判「文件不存在」。**这是上一笔提交引进来的**，我在提交它之后才发现。
- `testdata/axs-draft/unknown-speaker.json` 未跟踪，而两端 harness 都是**枚举**（`glob` / `readdirSync`）⇒ 这份向量**本机已在两端各参与一次，干净 clone 上不存在** ⇒ CI 比本机**少判一格**。它不会报错，只是判据少一条——比前四处更隐蔽。

### 干净 clone 的诚实读数（2026-10-18，`--depth 1` clone 到临时目录）

| 项 | 读数 |
|---|---|
| `pnpm install --frozen-lockfile` | exit 0 |
| `pnpm gates` | **exit 0**（796 passed + 1 skipped；`doc-citations` 不存在 0、`publish-target` 残差 4 全在册） |
| `pnpm check:apibase` | 越界调用点 **0**（脚本在树上、跑得起来了） |
| 后端 `pytest -q` | **226 passed**（与本机同数 ⇒ 那三个 Python 向量确实在树里） |
| `pnpm e2e:desktop` | **77 passed / 1 skipped**，exit 0 |
| `pnpm e2e` | **91 passed**，exit 0 |

跑 E2E 前按老规矩先证明了端口上是被测代码：`lsof` 看 5174/8000 **都空** ⇒ clone 自己起 vite，
不复用本机那台（复用等于把两棵树的读数混成一条）。

### 顺带抓到一处真缺陷（已登记，未在本轮改）

`scripts/check-chain-tracked.mjs` 的 `CG_CONTROLS` **硬编码了作者那台机器的瞬时状态**：

```js
{ p: "packages/axs/src/condition.ts", want: true, why: "…import 且未跟踪" }
```

它断言这个文件**应当**被算成"未跟踪的编译缺口"。而它现在**已被正确跟踪**
（`git ls-files` 认它）⇒ 对照组不符 ⇒ 脚本判 `UNRELIABLE` 并 **exit 1**。
第二条对照 `apps/web/src/shared/lib/clipboard.ts` 同理（同样已被正确跟踪）。

**更正我自己的一个读数**（写这一节时我把 `grep` 的退出码当成了脚本的）：**本机与干净 clone 都是 exit 1**，
不是"本机 0、clone 1"。两条对照在两台机器上都过期。

而它**真正在查的那件事已经修好了**：`已跟踪 19 / 未跟踪 0`、编译缺口 **0 个模块（0 处）**。
换句话说 README 里"干净 clone 上四道门禁连文件都找不到"那句**曾经是真的、现在不成立**——
本轮 P1 提交的就是它要的那批文件。**脚本仍红是判据自证的对照组过期，不是被查对象还有问题。**

**为什么本轮不顺手改**：它的对照是"该拦的必须被拦、该放的必须被放"这类**判据自证**，
改成合成对照（同族脚本 `check-doc-citations.mjs` 的 `extControls` 就是合成对照、
`check-chain-tracked.mjs` 自己的 `JD` 也是）属于改它的判据设计，是口径不是顺手修。
它**不在 `gates` 里**，所以不阻断 CI、不阻断合并。**如实登记，不假装已修。**
