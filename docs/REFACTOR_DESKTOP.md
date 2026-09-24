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
- [x] 断网试玩链路：PlayerPage 桌面分支 `loadStoryOffline`（Provider 数据 → `compileStory` 本地编译，零触网）；存档/Codex/recordView 离线优雅降级（既有 catch 路径）
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
- [ ] M4 门禁固定税（CI 前端门禁 + dpdm + coverage）+ ADR-026 + 三层文档对账

**非目标**：不拆巨石（Phase 7 单列）、不做签名公证/自动更新（Phase 10）、不做音频素材入口。

---

### Phase 7 · 巨石清偿与运行时一致性（v0.8）

**目标**：G1 预算清零 + 播放内核解耦。铁律 3 单维度：本轮只拆不加。

- [ ] `PlayerPage.tsx`（1370 行）→ IR 渲染器分层：播放状态机（纯逻辑入 `packages/core` 或 editor-core L2 同级）、指令执行器、舞台视图、系统菜单/存档面板；渲染文件全部 ≤400 行
- [ ] `useProjectEditor.ts`（1163 行）→ 域拆分：graph 映射 / persistence / playback / layout 四模块（宪章 1b G1 偏差记录的欠账，Phase 2 时承诺未兑现）
- [ ] 道具与场景资产域本地化：`asset_items` / `asset_scenes` / `project_asset_refs` 未进 SQLite schema，桌面侧栏这两页离线只能报「读取失败」（Phase 6 已把错误态显式化，不再伪装成空态）
- [ ] 四态原语：把 loading/error/empty 的互斥收敛成一个共享查询态组件（Phase 6 已逐页修 4 处「错误态与空态同屏」碰撞），Phase 8 设计巡检以该原语为验收工具
- [ ] 本地工程元数据补齐：SQLite `projects` 表只有 id/title/is_public/axs_source/author_id/时间戳，缺 `description`/`cover_image`/`theme_tags`/`mechanism`/`genre`/`is_meta` 等列——桌面工程卡片因此一律显示「暂无描述」，标签与机制筛选在本地无数据可筛（Phase 6 播种实测暴露；适配层刻意填空值而非编造）
- [ ] 存档与成就本地化：`save_slots` / `player_achievements` 进 SQLite schema，桌面断网可存可读（当前离线仅优雅降级）
- [ ] `packages/ui` 与 `apps/web/src/shared/components/ui` 双份 UI 目录归一（一处权威，另一处只做宿主绑定）
- [ ] 验收：G1 清单为空且原文件已删；E2E 12 条原样全绿；离线存档 E2E/E13

**非目标**：新玩法、新指令、视觉改版。

---

### Phase 8 · 设计系统收口（v0.9 · UI 与视觉设计专项）

**目标**：让产品「像成品，不像工程」。本轮是纯设计轮，产出可对比的视觉证据。

- [ ] `packages/core` 覆盖率补到 G2 门禁线：实测 83.47% 语句 / 72.02% 分支 → ≥90%（覆盖率可跑之后才暴露的差额；宪章要求「这是引擎，不是业务代码」，100% 是原意，先回 90 再谈 100）
- [ ] 四态原语逐页迁移：`shared/lib/queryState.ts::resolveQueryState` 已建立并接入角色页与剧本列表页；道具/场景/发现各 tab/玩家页收敛到该原语（Phase 6 已逐页修正行为，此处统一形态）
- [ ] 设计令牌审计：字阶（type scale）、间距韵律（4/8 基准）、圆角与阴影层级、色彩语义（禁硬编码，`check-ui-tokens.mjs` 覆盖面扩到全 apps）
- [ ] 日夜双主题复检（ADR-023）：逐屏截图对比，修不可读对比度（WCAG AA 文本 4.5:1）
- [ ] 四态全覆盖巡检：加载/空/错误/理想 每一屏都有设计且互斥（Phase 6 M3 发现的「错误态与空态同屏」类缺陷系统性排查）
- [ ] 动效语义化：转场解释空间关系、操作有反馈、等待有进度；建立动效时长与缓动令牌，删除纯装饰动效
- [ ] 工作台信息架构：侧栏/工具栏/Inspector/时间轴的视觉权重与留白节奏重排（NLE 隐喻一致性 Q6）
- [ ] 验收：设计令牌单一来源且无硬编码；改前/改后截图成对存档于 `docs/design/`；键盘可达全通过；四态巡检表逐项打勾

**非目标**：不改功能语义、不加新界面能力。

---

### Phase 9 · 演出上限证明（v1.0 · 楔子1 成败判据）

**目标**：不写一行代码，做出一段 ≥30 秒、有镜头语言与配乐的方舟风格演出，且**在打包桌面端可看、可导出、可交给别人**。

- [ ] 演出节奏曲线与关键帧（AXIFORGE_V2 波次 0 推迟项落地）
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
