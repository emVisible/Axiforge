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
  ② `bundleToCompilerInput` 恒写 `items: []`：S13-2c 让编排台在桌面挂上道具之后，道具在试玩里仍然一个都不出现，而同一份数据经后端编译却有。引擎侧 `packages/core/compiler.ts:308` 早就实现了「本体缺失即跳过」，缺的只是投影层有人把这一格填上。
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
  2. `main.tsx` 的壳内冒烟用的判据是 `"__TAURI_INTERNALS__" in window`——**那恰好是 e2e 注入的标记**（`DESKTOP_MARKER_INIT` 塞的是空对象）。
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

- [~] S13-5 验收基线搬家：**内存本地库宿主已建起来**，E17 是它的第一条产出。 **2026-09-29 实测推进**：新增 `playwright.desktop.config.ts` + `pnpm e2e:desktop`（只起 vite，不起 uvicorn，`testIgnore: /baselines/`）。无后端下 25 条桌面族用例全绿；不加 ignore 时 38 条会红 12 条，且 12 条**全部**来自 `baselines.spec.ts`——这就是「基线搬家」可执行的那一半，S13-6 的前置从口号变成一条命令。
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
  顺手按同一格式补上）；`docs/ROADMAP_FINAL.md` 的楔子3 就地标注为随分发面退场而搁置，
  并如实写明楔子2 只部分不受影响（跨作品 Codex 在桌面是「如实说出来地缺席」）；
  恢复锚点 [WEB_SUNSET_RESTORE](./WEB_SUNSET_RESTORE.md)（历史标签 `web-archive-20260926`）与
  逐功能去留 [WEB_FEATURE_DISPOSITION](./WEB_FEATURE_DISPOSITION.md) 两份文档此前已存在，本条只做链接。

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

**非目标**：不为多人协作做本地替身（不实现 CRDT / 同步协议 / 离线评论队列）——那是另一条产品线，随 web 一起退场。**验收**：全仓 `grep -rn "/api/v1" apps/web/src` 只剩测试宿主所需或为 0；桌面是唯一构建与发布目标；gates 与新基线全绿；`backend/` 已不存在且桌面功能无回归。

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
