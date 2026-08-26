# Axiforge 桌面化重构宪章与阶段计划（REFACTOR_DESKTOP）

> **文档性质**：`desktop` 分支一切工程工作的执行宪法与验收依据。
> **真相源关系**：上位决策 = [ADR-024](./ADR/024-desktop-local-first.md)（桌面优先战略）、[ADR-025](./ADR/025-axs-peer-dual-view.md)（对等双视图）；底层契约 = [KERNEL_DESIGN.md](./KERNEL_DESIGN.md)（L2–L4 构建规约）；本文件回答「做什么」与「怎么算做好」。冲突时以 ADR 为准，本文件随执行进展更新。
> **方法论底色**：axiom 第三部《技术实现宪章》、第四部《应用工程实践原则》。本宪章是其在本仓库的实例化——不重复论证，只落裁决。
> **日期**：2026-08-26 · **分支**：`desktop`（web 冻结线 `main` 只收 hotfix）

---

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
| G1 | 文件行数预算 | 新建文件 ≤400 行；存量巨石随所属阶段清零后删除原文件（当前清单：`ProjectFlowPage.tsx` ~1507 行 → Phase 1 清零） | lint max-lines + 人工核对 |
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

### Phase 1 · 内核抽壳（当前阶段）

**目标**：把「编辑器大脑」从 React 巨石与 HTTP 后端中解耦出来，为 Tauri 壳铺平道路。全程零功能变更、零 UI 变更。

#### 1a 测试栈落地与行为基线

- [x] Vitest 接入 apps/web 纯逻辑层：`projection.ts` 行为基线 18 例全绿
- [ ] `timelineUtils` 纯函数单测（随 1b 迁移补齐）
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
- [ ] Draft/Transaction/Journal 接入 ProjectFlowPage 状态层（一切编辑经 `apply`，单一写入口落地）
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

#### 1c StorageProvider 接口

- [ ] 定义接口：listProjects / loadProject / saveNarrative / saveRoles / saveCharacters / …
- [ ] HTTP 实现（包装现有 api 层），web 应用全部数据访问经 Provider
- [ ] 内存版 mock 实现跑通 E2E 子集（证明接口完整、UI 不直连 HTTP）
- [ ] 失败语义成文：每方法「如果失败，返回什么，调用方会怎样」（铁律 8）

#### 1d StoryCompiler TS 移植

- [ ] `packages/core` 增加 `compile(project) → StoryPackage`，对齐 `backend/app/domains/narrative/compiler.py`
- [ ] golden tests：≥3 个真实工程样本（须含示范作②③的 codex 场景）TS vs Python 输出指令级一致（G6）
- [ ] Python 编译器保留原位不动（web 冻结线继续使用），降级标注为对照基准

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
- [x] 壳内冒烟（DEV 自动运行，结果落盘 `~/Documents/Axiforge/storage-smoke.txt`）：create→bootstrap→覆写→回滚→角色去重→清理 全链路 PASS
- [ ] useProjectEditor 数据访问全量切换 Provider（工厂已就绪：`createStorageProvider()`）
  - 语义裁决：saveNarrative/addRole/removeRole 先验工程存在（not_found）；损坏 JSON → corrupted 不静默兜底；io 错误路径全臂覆盖（ThrowingBackend）

- [x] `apps/desktop`：Tauri v2 壳落地（cargo check ✓ + dev 冒烟 ✓：窗口进程 + WebView 加载前端）
      插件：global-shortcut / fs（素材目录作用域 `$HOME/Documents/Axiforge`）/ dialog / opener；
      `pnpm dev:desktop` 一键起（beforeDevCommand 自动拉 web dev server）
- [ ] StorageProvider 的 SQLite 实现（schema 沿用 PG 关系模型；`narrative_data` 保持 JSON 列）；素材落工程目录 + DB 存相对路径
- [ ] `.axsp` 打包/打开（叙事 JSON + 素材引用清单）；SQLite 为工作缓存
- [ ] FastAPI 后端转为可选协作/发布服务；云能力缺席时全部创作流可用
- [ ] 验收：断网完成「建工程 → 选角 → 剪辑编排 → 保存 → 关闭重开 → 试玩」全流程；`.axsp` 导出再导入数据等价（E2E 断言）；macOS 构建产物可安装运行

**非目标**：自动更新、签名公证、多窗口、移动端。

---

### Phase 3 · F2 角色即轨道（首个融合项）

**目标**：补齐 NLE 体验的角色维度——角色从「下拉框里的 ID」变成时间轴上的一等公民。

- [ ] 时间轴增加可折叠角色轨：show / hide / move / 表情切换轨上拖拽编排（扩展 `timelineUtils.ts` 分轨槽位机制）
- [ ] 素材库面板渲染 `character_data.sprites` 差分图，拖入即生成指令
- [ ] 角色工作台独立入口（六层模型 + 传记 + 立绘管理），作品 = 选角 + 编排
- [ ] 验收：一段 ≥2 角色 × ≥3 表情切换的演出纯拖拽产出且键盘可达；四态齐全；日夜主题检验通过
- [ ] E2E 基线扩至 ≥8 条（新增角色轨编排 ×2）

**非目标**：音频轨扩展、镜头关键帧曲线、Live2D。

---

### Phase 4 · F1 对等双视图（落地 ADR-025）

**目标**：废除整篇重生成式镜像，剪辑台与 AXS 平级共生。

- [ ] 编辑事件 dirty 记序，「最后编辑者权威」取代「文本优先」
- [ ] parser line 映射升级为指令级锚点（片段 ⇄ AXS 行号双向索引），最小 diff 写回
- [ ] 剪辑台内嵌迷你 AXS 片段精修器（选中片段 ⇄ 高亮对应文本行）
- [ ] round-trip 单测扩展为「剪辑态 ↔ 文本」一致性测试；锚点稳定性专项用例
- [ ] 用户文档同步：`docs/user/writing/axs-syntax.md` 中「文本为真相源」表述更新

**非目标**：全文协同编辑、CRDT、实时多人。

---

### Phase 5 · F3 RN 进语法（护城河显影）

**目标**：把 RN 维度暴露进 AXS 与剪辑台——竞品抄不走的那一层成为日常创作词汇。

- [ ] AXS 新增 `@memory` / `@relation` 类指令（IR 已有 codex 条件/效果，纯语法层暴露）：parser / printer / 单测 / 语法文档同步
- [ ] FX 轨可视化关系值与记忆变化
- [ ] 示范作修订：至少一段剧情的关系分支可直接在剧本轨书写、在 FX 轨检视

**非目标**：世界 tick、AI 运行时、跨作品自动继承策略变更。

---

## 附录 · 阶段收尾检查单（G10 执行件）

```
[ ] G1–G9 全绿（或偏差已在本文件显式记录并说明理由）
[ ] E2E 行为基线全绿（G3 六条起，按阶段递增）
[ ] 手动验收路径走通，步骤写入交付说明
[ ] 三层文档一致：ADR / 本文件 checkbox / docs/user
[ ] 删除清单核销：本阶段承诺删除的旧路径已不存在
[ ] 非目标未膨胀（对照阶段开头声明的非目标逐条复核）
[ ] 打 tag desktop-v0.x
```

## 风险与止损

| 风险 | 信号 | 止损 |
|------|------|------|
| 1b 拆巨石牵出隐藏耦合 | E2E 基线反复变红 >3 天 | 缩小步长：先抽 projection 纯函数层，视图拆分延后半阶段 |
| 1d 编译器移植量超估 | golden test 对齐停滞 >1 周 | 缩样本到 1 个线性工程先通链路，codex 场景单独成批 |
| SQLite 行为差异 | 数据读写不一致 bug 出现 | narrative_data 全 JSON 化，放弃关系化索引，性能后置 |
| 单人产能不足 | 连续两个子波次滑期 >50% | 砍当阶段「锦上添花」验收项，主线（安全网→抽取→门禁）不动 |
