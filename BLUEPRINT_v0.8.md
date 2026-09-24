# Build Blueprint v1.0 | Status: draft v1.0 → awaiting confirmation

Version target: **v0.8** · Charter phase: **Phase 7 · 巨石清偿与运行时一致性**（`docs/REFACTOR_DESKTOP.md`）
Tier: Standard（8 节 · 单一执行权威）

---

## 1. Goals & Non-Goals

**Goals**

1. **离线数据域补齐**：道具、场景、存档、成就、工程元数据在桌面端离线可写可读。当前这些页面在打包应用里一律报「读取失败」，工程卡片一律「暂无描述」——这是 v0.7 交付后仍然存在的、用户可直接摸到的产品断裂。
2. **四态原语组件化**：`resolveQueryState` 已是纯函数，但每页仍手写四个分支；收敛为一个共享渲染组件，供 Phase 8 设计巡检当作验收工具使用。
3. **巨石清偿**：`useProjectEditor.ts`（1163 行 / 32 处 `useState`）按 graph / persistence / layout / ui 四域拆分；`PlayerPage.tsx`（1370 行）先补播放内核安全网再分层。G1 预算清零。
4. **UI 目录归一**：`packages/ui` 与 `apps/web/src/shared/components/ui` 双份，一处权威一处宿主绑定。
5. **门禁与文档对账**：G1–G10 复跑，宪章 Phase 7 勾选项如实标注。

**Non-Goals**

- 不做视觉改版、不加新界面能力、不改功能语义（Phase 8/9 承接）。
- 不补 `packages/core` 覆盖率——宪章已把它登记在 Phase 8，本轮不重复认领。
- 不碰 `backend/uv.lock` 与 `backend/app/domains/llm/providers/__init__.py`（用户明确要求保持不动）。
- 不做签名公证、自动更新（Phase 10）。

**关于宪章「本轮只拆不加」的说明**：Phase 7 目标行的「只拆不加」指不引入新玩法。本节 Goal 1 是把**已上线**的功能补上缺失的本地存储层，属于兑现而非新增；宪章 Phase 7 清单自身已把这几项列在本阶段内，此处不另立范围。

---

## 2. Success Criteria (checkable)

| # | 判据 | 度量方式 |
|---|------|----------|
| C1 | 道具页 / 场景页在无后端进程时可用 | 停掉 `:8000` 后跑 e2e 新增用例，两页能建、能列、能删 |
| C2 | 桌面工程卡片显示真实描述、机制、题材标签 | 播种后列表 DOM 断言含 `description` 文本，非「暂无描述」 |
| C3 | 断网存档可写可读 | 新 e2e 用例：save→list→read 全在本地 SQLite 完成 |
| C4 | 渲染层文件行数 | `PlayerPage` 及其子层、`useProjectEditor` 及其子 hooks 全部 ≤400 行，`wc -l` 实测 |
| C5 | 原巨石文件已消失 | `git ls-files` 查不到旧路径（铁律 7：删除即优化） |
| C6 | 行为零漂移 | v0.7 全部 13 条 e2e 原样全绿，且本轮不修改既有断言 |
| C7 | 四态互斥 | 共享组件内 loading/error/empty/ready 四者由单一函数裁决，编译期不可同时命中 |
| C8 | 门禁 | `pnpm gates` 退出码 0；`pnpm typecheck` 0 错误 |
| C9 | 文档 | 宪章 Phase 7 勾选与事实一致；ADR 或用户文档记录本地资产域契约变更 |

---

## 3. Technical Approach (primary + fallback + one-line reason)

**主路径 · 契约先扩后接**：在 L4 `StorageProvider` 接口上新增 `asset items / scenes` 与 `save slots / achievements` 两组方法，`SqliteStorageProvider` 与 `HttpStorageProvider` 各自实现，页面 hooks 按环境分派。理由：仓库已经用 `isTauriEnvironment()` 在 hook 层做过角色域分派（v0.7 的成熟机制），复制这条已被验证的路径，比另造一套离线同步层风险低一个量级。

**主路径 · 拆分以返回面为切割线**：先机器导出 `useProjectEditor` 的公开返回符号表（≈65 个），按符号归属切分 hooks，子 hooks 之间通过显式参数传递依赖，组合层只做一次 re-export。理由：返回面即外部契约，契约不变则调用方零改动，等价于「行为不变」的最强约束。

**主路径 · Player 先补安全网再动刀**：把播放推进逻辑（指令分发、状态迁移）先提取为可单测的纯模块并写测试，通过后再拆渲染层。理由：该文件当前**零单测**，直接拆等于在无任何网的情况下跳；铁律 10 要求完成以产物为准，产物需要证据。

**Fallback**：若 e2e 无法在无后端条件下驱动 Tauri 侧 SQLite，则以 `sqljs` 后端（已有）跑同一套契约测试替代桌面真实链路，并把「打包态实测」降级为待人类验证项——v0.7 已确立这一如实记录的先例。

---

## 4. Milestones

| M | 名称 | 维度 | 用户可否摸到 |
|---|------|------|--------------|
| M1 | 离线数据域补齐 | 数据契约（单一） | ✅ 道具/场景/存档/工程卡片 |
| M2 | 四态原语与 UI 目录归一 | 界面形态（单一） | ✅ 错误态不再伪装 |
| M3 | 编辑器巨石拆分 | 内部结构（单一） | ❌ 仅可维护性 |
| M4 | 播放内核解耦与页面分层 | 内部结构（单一） | ❌ 仅稳定性 |
| M5 | 门禁复跑与文档收口 | 质量证据 | ❌ |

顺序依据：M1 修的是**已交付产品的可见断裂**，优先级最高；M3/M4 是纯工程债，放在有 e2e 兜底之后；M4 依赖 M3 建立拆分手法。

---

## 5. Task List

> 每行一个任务，`Acceptance:` 即该任务的唯一验收句。任务 ID 全文唯一（门禁脚本按出现次数计数）。

- [ ] S1-T1 L4 契约扩展：`StorageProvider` 新增 item/scene 与 save/achievement 两组方法，含 `StoredAssetItem` / `StoredAssetScene` / `LocalSaveSlot` 类型与 scope 语义；字段以 backend 权威模型对齐（`AssetItemResponse` 声明了 `personality` 而 backend 道具模型未见同名列，先查实是漂移还是计算字段） | Acceptance: `pnpm typecheck` 通过；`packages/editor-core` 契约测试覆盖两组方法的存在性 | M1
- [ ] S1-T2 SQLite schema 补表与迁移：`asset_items` / `asset_scenes` / `save_slots` / `player_achievements` 进 DDL，沿用 `COLUMN_PATCHES` 幂等补列机制处理已发布旧库 | Acceptance: 对「旧库（无新表）」与「空库」两种初始态各跑两次 `init()`，不报错且表数稳定一致 | M1
- [ ] S1-T3 两个 Provider 落地实现：SQLite 侧读写本地表，HTTP 侧转发既有 REST 路径，二者语义等价 | Acceptance: 同一份契约测试文件对两个 Provider 各跑一遍全绿（单一测试源、双实现） | M1
- [ ] S1-T4 道具与场景页接本地：`useAssets` 按环境分派，桌面断网可建/列/删 | Acceptance: 新增 e2e 用例在无后端进程条件下通过，页面显示本地数据 | M1
- [ ] S1-T5 工程元数据补齐：`projects` 表补 `description` / `cover_image` / `theme_tags` / `mechanism` / `genre` / `is_meta`，播种携带真实值而非填空 | Acceptance: 桌面工程卡片断言含播种数据的描述文本，「暂无描述」在播种工程上不再出现 | M1
- [ ] S1-T6 存档与成就本地化：播放页存读走本地，含 player_token 跨重启稳定性 | Acceptance: e2e 断网完成 存→列→读→删 四步 | M1
- [ ] S2-T1 四态共享渲染原语 `QueryStatePanel`：由既有 `resolveQueryState` 单点裁决，页面只传数据不写分支 | Acceptance: 角色页与剧本列表页迁移后 DOM 中「错误」与「空」文案不同屏；组件单测穷举四态互斥 | M2
- [ ] S2-T2 UI 目录归一：`packages/ui` 定为权威，宿主目录仅保留 Tauri/DOM 绑定，重复组件删除 | Acceptance: 同名组件不再两处并存；`pnpm build` 通过；旧引用路径 grep 无残留 | M2
- [ ] S3-T1 导出编辑器 hook 公开符号表并入库，作为拆分契约基线（防漏判） | Acceptance: 基线文件入库，符号数与巨石返回面逐个相等，成为后续两任务的比对输入 | M3
- [ ] S3-T2 拆出 graph 域与 layout 域子 hooks（节点/边/条件/效果/脚本/自动排版） | Acceptance: 两子 hook 各 ≤400 行，e2e 全绿，巨石行数下降 | M3
- [ ] S3-T3 拆出 persistence 域与 view/ui 域子 hooks（保存/导入导出/元数据/toast/模式），组合层只做 re-export | Acceptance: 原路径 `git ls-files` 查不到；组合层 ≤200 行；公开返回面符号集与基线逐个相等 | M3
- [ ] S4-T1 播放内核提取为纯模块并补单测安全网（**先于任何渲染层改动**） | Acceptance: 新模块单测覆盖指令分发与状态迁移主干全绿，此时 `PlayerPage` 尚未拆分 | M4
- [ ] S4-T2 `PlayerPage` 分层：状态机 / 指令执行器 / 舞台视图 / 系统面板与存档面板 | Acceptance: 所有渲染文件 ≤400 行；原 1370 行文件不存在；e2e 播放用例全绿 | M4
- [ ] S5-T1 门禁复跑与遗留登记：G1–G10、`check:purity`、`check:circular`、覆盖率实测数字入档，未达标项登记不降标准 | Acceptance: 实测数字写入宪章，缺口显式且不粉饰 | M5
- [ ] S5-T2 三层文档同步：宪章 Phase 7 勾选、ADR/用户文档记录本地资产与存档契约、README 结构更新 | Acceptance: 文档所述能力均可在代码中找到且已被实测 | M5

---

## 6. Acceptance Criteria（手动验收路径）

1. `pnpm gates` → 退出码 0（退出码单独取，不看被截断的输出尾部）。
2. 杀掉 `:8000` 后端进程 → `pnpm --filter @axiforge/web e2e`：v0.7 的 13 条原样全绿 + 本轮新增用例全绿。
3. 桌面开发态启动 → 道具页新建一个道具 → **重启应用** → 该道具仍在 → 删除后列表即刻不含它（改→存→重读三段式，不只看到「已保存」提示）。
4. 同上路径验证场景页与存档页。
5. 工程列表：播种工程显示真实描述与机制标签；按标签筛选能过滤。
6. `wc -l` 逐个确认新文件 ≤400；`git ls-files | grep` 确认两个巨石路径已消失。
7. 全程不出现「错误文案与空态文案同屏」。

---

## 7. Risks & Assumptions

| # | 风险/假设 | 处置 |
|---|-----------|------|
| R1 | 前端 `AssetItemResponse` 声明了 `personality`，但 backend 道具模型未见同名列——可能是接口漂移 | 动手前先实测该字段来源（列/计算/已废弃）。若确为漂移，本轮只对齐不修，登记为独立缺陷；不夹带（铁律 3） |
| R2 | 契约扩展会让 `httpStorageProvider` 与内存 Provider 也变成必须实现，遗漏即编译失败 | 这是想要的效果：以类型强制三实现同步，而非运行期才发现 |
| R3 | 已发布的 v0.7 桌面库没有新表，`CREATE TABLE IF NOT EXISTS` 不足以覆盖旧库补列 | 沿用 `COLUMN_PATCHES` 幂等路径，并对「旧库」态专门测试 |
| R4 | 拆分 `useProjectEditor` 无直接单测兜底，只有 13 条 e2e | 以公开返回面逐个相等作为机械约束；若 e2e 覆盖不到的路径有疑，登记为待补测而非声称无损 |
| R5 | `PlayerPage` 拆分风险最高且零单测 | 强制顺序：先建安全网（第四里程碑首项）再拆，违反顺序即视为计划偏差 |
| R6 | 播种携带真实元数据依赖 seed 接口返回字段完整 | 先查接口实际返回，缺字段则只补可得部分，不编造填充 |
| R7 | 一轮跨 5 个维度，违背单维铁律 | 以里程碑为维度边界，里程碑之间不夹带：每完成一个即提交并复跑门禁 |
| R8 | 打 tag / push 仍未获批 | 本地提交继续累积，`desktop-v0.7` 与 `desktop-v0.8` 两个 tag 与全部推送一并攒到用户点头 |

---

## 8. Change Log

| 版本 | 时间 | 变更 | 偏差等级 |
|------|------|------|----------|
| v1.0 | 2026-09-24 | 依宪章 Phase 7 建立首版；M1 前置为离线数据补齐（已交付产品的可见断裂），M3/M4 纯工程债随后 | — |
| v1.0 | 2026-09-24 | 登记道具接口 `personality` 字段的契约漂移疑点为 R1，明确「先查实、只对齐不顺手修」 | L2 记录 |
