# Axiforge 桌面重构交接
- **复量 2026-10-10 03:24（第一百一十批末；当前恢复点，取代上面 03:15 那条）**：`pnpm e2e:desktop` **77 passed／0 failed**（03:23，3.5m；E65 两臂上线，桌面基线 75→**77**）· `pnpm gates` **0**（十五道；web 325＋1 skip、`[file-size]` 0 越线）· `check:citations` **0**（已判定 **379**）· `check:http-inventory` **0**（`SPEC_URLS=74`、`DATA_DESKTOP=0／DATA_BROWSER=20`）· 剪贴板那一族**四格全闭**（唯一通路／三处静默点／两处假兜底归一／界面腿两头判据，牙都见过红）· `pnpm check:tracked` **1**（需 add **43**，以现跑输出为准；等授权）· `git diff --check` **0 行** · stash **0** · `.e2e-lock` 不在 · 探针残留 **0**（变异 `cmp -s` 还原）· `??` **55** · 三引用 peel 仍 **`1b9ca06`**。
- **复量 2026-10-10 03:08（第一百零八批末；当前恢复点，取代上面 03:00 那条）**：本批**净变化 0 行产品代码**（第三处被 G1 挡下后整处退回）⇒ 有效读数：`pnpm gates` **0**（十五道；已判定 **378**）· `check:size` 0 越线（`StoryEditPage.tsx` wc **418**＝基线 419 之内）· `pnpm e2e:desktop` 75 passed 沿用 03:05 那组（本批未动规格与链上源码面）· `pnpm check:tracked` **1**（需 add **43**）· `git diff --check` **0 行** · stash **0** · `.e2e-lock` 不在 · 探针残留 **0** · `??` **55** · 三引用 peel 仍 **`1b9ca06`**。
- **复量 2026-10-10 03:15（第一百零九批末；已被 03:24 取代）**：`pnpm gates` **0**（十五道；web 单测 **325＋1 skip**、`[file-size]` 0 越线、已判定 **379**）· `pnpm e2e:desktop` **75 passed／0 failed**（03:14，3.5m）· **剪贴板三处静默点已全接完**：全仓 `navigator.clipboard` 现测 3 处（模块内 2＝唯一实现、`ShareActions` 1＝原有兜底），仅欠界面腿 E65（缺"建角"e2e 通路，已量）· `pnpm check:tracked` **1**（需 add **43**，以现跑输出为准）· `git diff --check` **0 行** · stash **0** · `.e2e-lock` 不在 · 探针残留 **0** · `??` **55** · 三引用 peel 仍 **`1b9ca06`**。
- **复量 2026-10-10 03:00（第一百零七批末；已被 03:08 取代）**：`pnpm check:tracked` **1**——**需 add 的准数 17 → 41 → 43**（本批修好多对一别名前缀，藏住的 2 个生产模块现形：`clipboard.ts`、`shellSmokeGate.ts`；编译面 6→8 模块）· `pnpm gates` **0**（沿用 02:49 整套，链外脚本与文档改动不影响链上源码面）· `check:citations` **0** · `git diff --check` **0 行** · stash **0** · `.e2e-lock` 不在 · 探针残留 **0**（变异脚本 `cmp -s` 还原）· `??` **55** · 三引用 peel 仍 **`1b9ca06`**。
- **复量 2026-10-10 02:48（第一百零五批末；当前恢复点，取代上面 02:37 那条）**：`pnpm gates` **0**（十五道，产品代码定稿后整套跑过；随后的棘轮 `--update` 与文档改动分别由 `check:size`／`check:citations` 单验为 0）· `pnpm e2e:desktop` **75 passed／0 failed**（02:47，3.5m）· `check:citations` **0**（已判定 **294**）· `check:http-inventory` **0**（`SPEC_URLS=73`、`DATA_DESKTOP=0／DATA_BROWSER=20`）· `check:size` **0** 越线（`CharacterDetailPage` 棘轮按归一后实值收到 **680**）· `check:seams` 9／6／真断言 **102**／基线 3 · `check:apibase` **0**（判定面越界 0）· `check:tracked` **1**（需 add 的点名清单 **17** 项；本批新增的 `clipboard.ts`／`clipboard.test.ts` 两份未跟踪文件**不在**那 17 项里，因为 `clipboard.ts` 走 `@/…` 别名 import，编译面只认相对说明符——所以待 add 实为 **19**，这一格下一批要把它补进 `check:tracked` 的口径里，别靠人记）· `git diff --check` **0 行** · stash **0** · `.e2e-lock` 不在 · 探针残留 **0** · `??` **55** · 三引用 peel 仍 **`1b9ca06`**（未提交、未推送、未动 tag，按 §7）。
- **复量 2026-10-10 02:37（第一百零四批末；已被 02:48 取代）**：本批**净变化 0 行产品代码**（做完即回退）⇒ 有效读数仍是 02:27 那一组：`pnpm typecheck` **0**、`pnpm gates` **0**（十五道；已判定 **294**）、`pnpm e2e:desktop` **75 passed／0 failed**、`check:apibase` **0**、`check:tracked` **1**（需 add **17** 个文件）· `git diff --check` **0 行** · stash **0** · `.e2e-lock` 不在 · `??` **53** · 三引用 peel 仍 **`1b9ca06`**。
- **复量 2026-10-10 02:27（第一百零三批末；已被 02:37 取代）**：`pnpm gates` **0**（**十五道未变**）· `pnpm e2e:desktop` **75 passed／0 failed**（沿用 02:22 那组——本批**只动门禁脚本与文档**，产品代码与规格一行未改）· `pnpm check:apibase` **0**（判定面越界 0；只读面 3 条疑似调用点；442 个文件；可疑写法 0）· `check:citations` **0**（已判定 **294**＝02:28 复跑 `pnpm gates` 时的实测；这个数每多一条 `路径:行号` 引用就 +1，所以引用它必须带时刻）· `git diff --check` **0 行** · stash **0** · `.e2e-lock` 不在 · 探针残留 **0**（四处变异全部 `cmp -s` 还原；`projection.ts` 追加的三行探针已随 `RESTORE_A=true` 撤回）· `??` **53** · 三引用 peel 仍 **`1b9ca06`**。
- **复量 2026-10-10 02:22（第一百零二批末；已被 02:27 取代）**：`pnpm gates` **0**（十五道）· `pnpm e2e:desktop` **75 passed／0 failed**（02:22，3.5m；E64 上线，桌面基线 74→75）· `check:citations` **0**（已判定 **284**，本节写完仍会 +）· `check:http-inventory` **0**（`SPEC_URLS=73`、`DATA_DESKTOP=0／DATA_BROWSER=20`）· `check:seams` 9／6／真断言 **102**／基线 3 · `check:size` 0 越线、棘轮 **1072** · `check:tracked` **1**（需 add **17** 个文件，等授权）· `git diff --check` **0 行** · stash **0** · `.e2e-lock` 不在 · 探针残留 **0**（本轮变异 `cmp -s` 还原 `BYTE_IDENTICAL=true`）· `??` **53** · 三引用 peel 仍 **`1b9ca06`**。

> **更新日期**：2026-09-30
> **用途**：新会话或接手者快速建立当前产品边界、工作区状态、可执行下一步与安全限制。
> **本文件是状态索引，不复制长篇实现记录**：执行项以 [`REFACTOR_DESKTOP.md`](./REFACTOR_DESKTOP.md) 为准；产品决策以 ADR 为准；本文件记录最新已验证状态和接手顺序。

## 1. 一句话产品定义

**Axiforge 是桌面互动叙事创作器：用 AXS 写剧本，在剪辑视图编排演出、在结构视图检查分支，并即时预览；作品保存/交付为 `.axsp`。**

唯一核心任务：本地新建或打开工程 → 用剧本/剪辑/结构视图协同编辑同一份 Draft → 预览 → 保存或导出 `.axsp`。

## 2. 当前决策与架构权威

- **唯一发行目标**：Tauri 桌面应用；`apps/web` 是 renderer 与浏览器测试宿主，不是独立产品。依据：[ADR-029](./ADR/029-desktop-only-build-target.md)。
- **AXS 唯一语法权威**：`packages/axs` 的 parser/printer；不得新造方言或第二解析器。依据：[ADR-027](./ADR/027-axs-single-grammar-authority.md)。
- **同一编辑模型**：Draft/IR 是编辑期语义模型；剪辑、剧本、结构是同一作品的协同投影。AXS 不是全局优先的持久化真相源；冲突策略见 [ADR-025](./ADR/025-axs-peer-dual-view.md)。
- **AXS 分支引用**：工程内部目标 ID 序列化时映射为 Beat 标题；空 choice 行是合法的未完成编辑态。实现与回归见 `packages/axs`、`packages/editor-core`。
- **桌面本地优先**：Tauri + SQLite + 本地素材 + `.axsp`。任何服务端退场遵循“先替代、后删除”和“验收基线先搬迁”。
- **现行执行清单**：[`REFACTOR_DESKTOP.md`](./REFACTOR_DESKTOP.md)。[`KERNEL_DESIGN.md`](./KERNEL_DESIGN.md) 是 editor-core 契约；[ADR-024](./ADR/024-desktop-local-first.md) 的 Web 协作/发布部分已由 ADR-029 修订。

## 3. 入口与开发命令

- `pnpm dev`：默认启动 Tauri 桌面开发应用；Web renderer 由 Tauri 自动启动。
- `pnpm build`：默认构建 macOS `.app`。`pnpm build:dmg` 单独生成 `.dmg`。
- `./dev.bash`：tmux 启动桌面；`./dev.bash all` 或 `pnpm dev:stack` 显式启动旧 API/Web/Admin/Nexus 调试栈。
- `pnpm gates`：类型、单测、覆盖率、lint、架构/无障碍等门禁。
- `pnpm e2e:desktop`：桌面态 E2E，不启动后端；`pnpm e2e` 是旧浏览器/API 回归栈。
- `pnpm check:desktop`：Tauri Rust 检查，不包含在 `pnpm gates`。

## 4. 当前工作区状态

工作分支是 `desktop`。重构文件仍在未提交工作区；**不要假设该状态已提交或可从远端恢复**。本轮已验证的改动包括：

- 默认 dev/build 入口桌面化；README 与旧战略文档补上桌面产品边界。
- AXS choice 目标从节点 ID 映射为 Beat 标题；空 `>` 不再静默降级为旁白。
- Draft 投影保留 legacy `choices[].target_node_id`。
- `ChoiceOptionsEditor` 从 `ScriptEditor` 外提；分支选项组与控件具有可访问名称。
- 标签豁免基线清空；`ScriptEditor` 文件行数棘轮由 568 收紧至 513。
- 用户文档和 ADR 中 AXS “文本真相源”的过时说法已修订；#68 旧诊断由 2026-09-30 补记更正。

同日晚些的第二批（同样未提交，按 §7 的硬限制不推远端）：

- **#68 的落地补了一半**：choice 目标在文本层用 Beat 标题，但**同名 Beat 时标题不可寻址**——
  打印侧无条件输出裸标题，指向第二个「开场」的分支回读后静默落到第一个。现打印侧沿用解析侧
  `assignBeatIds` 的序号规则（`开场` / `开场-2`），legacy 投影撤掉「提前换成标题」那步。
- **#69 两处**：`axs.import` 与 **Writer 主通路 `parseAxsToPlan`** 都缺"一次导入内 id 只消费一次"的守卫
  （后者会发出两个同 id 节点并让邻接边退化成自环）。判据三条，含一条把两套实现钉在一起的配对判据。
- `axs.import` 整段外提成 `packages/editor-core/src/axsImport.ts`（新文件未纳管），`document.ts` 436 → 363 行。
- 门禁与工程卫生：`check:labels` 的"id 档"改为必须真被 `aria-labelledby` 引用 + 作用域扩到三个界面层；
  `check:dispatch` 收成三档合法；`check:purity` 不再扫纯注释行；`apps/web` lint 翻成 `--deny-warnings`（0 warning 成地板）；
  `scripts/ports.d.mts` 补上（`build:admin` 之前因此红）；`apps/web/vite.config.ts` 不再硬写端口（env 覆盖口保留）。
- 新增 e2e：**E39 / E40 / E41 / E42**（同名桥段的界面级证据、「发送到 Nexus」两半、LLM 徽标两半、侧栏「概览」与创作概览页两半）。
- 用户文档 `docs/user/desktop/desktop-and-axsp.md` 更正：缺席清单补三项（Nexus 收件箱、「我的主页」/账户设置动作、AI 建档建议）；
  原来那条「把道具挂进某一拍…仍需要后端」是错的——**两端都只有工程级引用**（表与请求体都没有拍字段），
  该能力是"尚未实现"而不是"桌面缺失"。

同日晚些的第三批（纯文档，同样未提交）：**决策层补上今天扩的那条寻址契约**。
`docs/ADR/016-axs-narrative-language.md` 新增「补记 2026-09-30：目标按 Beat 标题寻址，同名按出现顺序消歧」六条，
「质量要求」补一条"round-trip 必须覆盖同名的两种寻址形态、双向各测一次"；`docs/ADR/027` 的方言对照表后加交叉引用（表格按决策时实态保留）。
**判据**：`grep -o "消歧\|同名\|序号\|标题唯一"` 在这两份 ADR 的 **HEAD 版各命中 0 次**——
即 #68/#69 所依据的规则此前只存在于代码与测试里。这类"契约只活在实现层"的缺口，
下一轮把 `idToBeatRef` 改回裸标题不会撞任何门禁，只会第三次静默换靶。明细见 `docs/REFACTOR_DESKTOP.md` Phase 13 末。
同轮另在 `docs/KERNEL_DESIGN.md` §2.4 补一条 `> 状态（2026-09-30）`：那张迁移表把 `axsToSyncPayload` 与 `axs.import` 画成**一行归宿**，
实态是两套实现（`axsImport.ts:56` 的 `importAxsDraft` 操作 Draft；`projection.ts:96,102` 的 `axsToSyncPayload` → `projection/axs.ts:170` 的 `parseAxsToPlan` 产出同步载荷）。
按该文件末尾"不允许沉默漂移"的规矩回写了实态与临时保险（`document.test.ts:385` 的配对判据），**归并仍属 S13-7、等定档**。

同日的第四批（这一批**动了代码/配置**，仍未提交）：**端口真相源下沉成 `scripts/ports.json`**（新文件未纳管，提交要显式 `git add`）。
`scripts/ports.mjs` 变成派生视图（fs 读 JSON，`PORTS`/`origins`/`corsOrigins` 三个导出的值实测逐字不变），
消费侧改读真相源：`playwright.config.ts` 4 处、`playwright.desktop.config.ts` 2 处、`e2e/helpers.ts` 1 处（`API` 现为导出，供 baselines 复用）、
`e2e/baselines.spec.ts` 5 处、`scripts/desktop-http-inventory.mjs` 1 处 ⇒ 工具与 e2e 层的 `5174`/`localhost:8000` 字面量 0 处。
为什么走 JSON 而不是直接 `import "./ports.mjs"`：**已实测**，不是引用旧推断——本机 `~/.nvm/versions/node` 装着 20.20.2 与 22.14，CI 两个 job 钉 `node-version: 20`。当前形状在 Node 20.20.2 下两份配置 `--list` 各 50 / 37、退出码 0；把 `.mjs` 引进配置则 **20.20.2 / 22.14 / 26.7 三档全红**（报错随版本不同：`exports is not defined [in ES module scope]`、`Cannot use 'import.meta' outside a module`）。
**这同时纠正了一条传了两轮的错归因**：早先写的"CI 钉 Node 20 才危险、本地绿远端红"不成立，这条路本地从来就红；正确说法是"Playwright 的 `.ts` 配置走 CJS 转译，掺进 ESM 依赖就混合格式炸"。收成一句：**看到"看不见的那一端"，先查本机装了几个运行时版本**。
证据是双向的：`ports.json` 的 web 改 5999 → 桌面套件 37 全绿（vite 与两套配置都跟着走）；把一处钉回 5174 → 1 failed 且报 `ERR_CONNECTION_REFUSED at …:5999`。
复跑（还原之后）：`pnpm gates` 0 / `pnpm e2e:desktop` 37 passed / `pnpm e2e` 50 passed / `pnpm typecheck` 0。

同日的第五批（**动了创作主通路的解析器**，仍未提交）：清偿 ADR-016 补记末尾那条在册欠账——
裸同名 Beat 引用现在报一条把消歧写法送到眼前的 warning（`同名 Beat「开场」有 2 处，这里指向第 1 个；要指向第 2 个请写「开场-2」），
**tie-break 语义一字未改**；上线前量过分母（随包三份 `.axsp` 各 2 个同名标题、裸引用同名 **0 处** ⇒ 既有作品不会突然亮灯），
出口也已存在（`WriterPanel` / `AxsCodeEditor:132` linter / `MiniAxsEditor:77`），severity 不阻塞保存。
途中撞到自己当天早些写的对立断言 `roundtrip.test.ts:196`（钉的是"不报诊断"）——**改断言而不是删断言**，对 id 与 edges 的钉原样保留。
棘轮把 `parse.ts` 挡在 600 > 587，按它给的处置把目标解析那一族 103 行外提成 **`packages/axs/src/edges.ts`**（**新文件未纳管，提交要显式 add**），
`slugifyTitle` 一并搬过去再由 `parse.ts` 转出 ⇒ `print.ts` / `index.ts` 的 import 路径不用改、公开面不变、`check:circular` 绿；
`parse.ts` 落到 493 行，baseline 同步收到 493（`--update` 后逐行复核 diff：**只有收紧**，并清掉 `document.ts` 那条已失效的记录）。

同日第六批（**动了内核代码**，仍未提交）：把「AXS→图」里**被抄成两份的字段映射与落位公式归一**。
`axsImport.ts::beatToNarrative` 与 `projection/axs.ts::beatToNarrativeData` 实测是逐字符相同的 8 个字段（`is_anchor` 规则、4 列 220×140 公式各两份），
唯一权威现留在 `projection/axs.ts`；`index.ts` 双侧星号导出 ⇒ 公开面不变、`check:circular` 无环、`is_anchor` 全仓出现次数 2 → 1。
归一时补了 Writer 主通路缺的那半判据（`projection.test.ts` 关键拍断言）：**归一前**把权威改成 `is_anchor: false` 只红 `document.test.ts` 2 条（Writer 侧从来没钉过），
**补完之后**同一处变异红 3 条、跨两个文件。判据第一次跑就红——因为它用了 `[intro]` 而代码只认 `[key: intro]`，这个差异登记成新在册缺陷 #79（认不出的方括号静默忽略、不生效也不报诊断）。
`axsImport` 头注释里"只依赖 ./types 与 @axiforge/axs"同步改写（多了一条 import 而注释不改，就是让注释替代码撒谎）。

同日第七批（**动了 AXS 词法与两端求值**，仍未提交）：把 #79 那条在册缺陷付清，并从它引出的棘轮处置里挖出 #82。
#79：Beat 标题里认不出的方括号（`# 第二拍 [intro]`，即把键名直接塞进括号）以前**没有分支接住**——不生效也不报；
现在给一条列出三种可用形式的 warning，**语义一字未改**；分母先量过（`packages/**` 与 `docs/user/**` 共 20 处标题括号、落进新分支 **0 处**，
`.axsp` 为结构化 JSON 不含标题文本）⇒ 既有作品不会突然亮灯。取数法这里连错两次（对原始 JSON 做正则得 0 处＝方法失效，改 `unzip -p` 结构化走一遍才坐实）。
加完这条 warning 后 `check:size` 红（`parse.ts` 502 > 493），按门禁自己给的处置**按域外提**：
条件与字面量一族移到 **`packages/axs/src/condition.ts`**（+ **`condition.test.ts`**，两支 describe 断言一字未改地搬家）⇒ parse.ts 落 **420** 行、棘轮同步收紧。
这一刀与 `./edges` 不同：条件不是 parse 的对外 API，**不做"转出再导出"**，`./print` / `./index` / 测试直接指过去（`index.ts` 公开出口不变）；
切法上有个真约束——先切 `parseHeadingLine` 会形成 `parse ↔ heading` 双向依赖（`check:circular` 会亮），所以条件族才是那把正确的刀。
**#82 是同轮挖出的真缺陷**：搬 `OP_MAP` 时看见只有 `==`/`!=`/`>`/`<` 四键，而 `COND_OP_RE` 认得 `>=|<=`、用户文档 `:149` 承诺过它们，
缺失分支经 `?? "eq"` ⇒ 实测 `parseCondition("memory.score >= 10")` 得 `operator: "eq"`：作者写的"够 10 就开"被编译成"恰好等于 10 才开"，
且回写把原文改成 `== 10`。修法补齐枚举，**五处分属两种语言**：`core/ir.ts` 加 `gte|lte`、`core/conditions.ts` 两个 case、
`axs/condition.ts::OP_MAP`、`axs/print.ts::OP_PRINT`、`backend/app/domains/runtime/service.py::_compare` 两条 `elif`
（Python 不是顺手加的：该函数对未知运算符返回 `False`，只修 TS 等于把闸门在 web 端永久锁死，换一种更安静的坏）。
判据四条（映射两支 + 打印回到 `>=` + `coins=10` 的六格边界）；Python 侧**无测试覆盖 `_compare`**，改用 `backend/.venv/bin/python` 直调取数，
与 TS 端逐位一致（`10 gte 10 True / 9 gte 10 False / 10 lte 10 True / 11 lte 10 False / 10 gt 10 False`）。
文档同轮：ADR-016 加「补记 2026-10-01」两条、`docs/user/writing/axs-syntax.md` 补「键名写在冒号右边」与「认不出的方括号」容错条目、
`>=`/`<=` 含边界这句今天才第一次真成立、`backend/.../narrative/models.py:188` 的 IR 运算符白名单注释跟上。明细见 `docs/REFACTOR_DESKTOP.md` Phase 13 末「第二十四次续做」。

同日第八批（**新增一条文档↔实现的机检通路**，仍未提交）：把 `docs/user/writing/axs-syntax.md` 的 **12 个 `axs` 示例**变成被测对象
（新文件 **`packages/axs/src/doc-examples.test.ts`**，26 条判据：取块数量守卫 / 每块 0 error 诊断 / **`printAxs` 是纯函数** / 每块往返结构一致）。
它当场捞出两件事，分诊不同：**① 无歧义缺陷已修**——`printAxs` 把内部 scratch `_edges` 盖回调用方 beat（旧 `print.ts:249`），
现改为作参数传给 `printBeatBody`；两处活调用方（`projection/axs.ts:142`、`MiniAxsEditor.tsx:22`）打印后即弃 `doc` 故今天无可见后果，
但"打印不改输入"是契约。变异证据：装回 stamp ⇒ 纯度那条红（「示例 L16 被打印改写了」）+ 往返三条红（4 failed）。
**② 有权衡的不一致已登记为待决**——打印会把"指向下一拍的顺序边"物化成 `-> 标题` 行；
我先实现"不物化"并跑绿（axs 76），既有契约断言 `projection.test.ts`「线性链按拓扑序打印…边打印为 -> 标题」随即变红，
据此改判为**决策层两难**（显式化 ⇒ 中间插拍不自动接链；隐式化 ⇒ 移动节点静默重连），已撤回语义改动、判据只摘掉 `jumps` 这一维并注释点名工单（**引用用标题不用编号**，本轮编号漂移过一次）。明细见 `docs/REFACTOR_DESKTOP.md`「第二十六次续做」。

同日第九批（**又回到解析器：演出指令的取值集合**，仍未提交）：文档列的 `@` 指令清单与解析器认识的清单逐项对过（两边一致，`@item` 文档已明说不提供），
但顺着读 `parseDirectiveLine` 读出今天一直在那一族里的形状——**吃下任意拼写再用 `as` 把类型圆过去**：
`@transition banana` → `as "fade"`、`@fx disco` → `as "rain"`、`@camera wiggle` → `as "zoom"`，而真相源 `packages/core/src/ir.ts:136,151,159`
把这三族钉成三个联合类型；`@wait soon` / `@camera zoom big` 则把 `NaN` 原样塞进 IR。
**双端严格度还不一致**：Python 用 pydantic `Literal` 校验同一组值（`backend/app/domains/narrative/ir.py:83,93,99`）⇒ 同一份文本一端拒收、另一端静默降级，已在 ADR-027 方言对照表补记。
修法沿用今天的纪律：**只加提示、不改语义**，warning 文案把可用列表送到眼前；**唯一一处语义变化说清**：`@camera zoom` 的非数字 scale 不再写进 IR
（`NaN` 进不了 JSON，且 `print.ts:122` 的 `scale != null` 会把它当有值、把字面量 `NaN` 印回作者文本）。
判据 5 条 + 1 条对照组（文档表格里给过的写法一条都不许报），先跑 RED（`4 failed | 16 passed`）；分母先量：`docs/user`、`docs/ADR`、`seed_showcase.py`、`prompt.ts`
里这四族只出现 `fade`/`dissolve`/`rain`/`none`/`zoom` 与裸指令行，**0 处落进新分支** ⇒ 零误报上线。
棘轮再挡一次（加分支会让 `parse.ts` 越过 420 档），于是把**演出指令取值**一族 11 个 `case` 外提成 **`packages/axs/src/instructions.ts`**（170 行，含 `resolveRole`——
立绘指令与对白行共用同一个"角色名→id"解析，留在 `parse.ts` 会让新模块回头依赖而成环），`parse.ts` 落到 **330** 行。
`ADR-027` 表里 `parse.ts:234-318` 那族行号随之失效，已按"历史文本不重写"另起带日期的补记指明新落点。明细见 `docs/REFACTOR_DESKTOP.md`「第二十七次续做」。

同日第十批（**只动测试与文档，产品代码未改**，仍未提交）：读到对白分隔符那一处——`parseDialogueLine` 的正则只认半角冒号，
全角 `堰纱：你来了。` 整行落进旁白兜底（说话人丢失、前缀照原样进玩家端）。这条规则此前只在 ADR-027 方言对照表与代码里，**用户文档与判据都没提**。
直觉修法"给全角冒号加 warning"被分母否掉：扫 `docs/**` 的 `axs` 围栏、`.axsp` 的 `*axs*` 字段与 `testdata/**` 向量，
全角冒号在 AXS 源文本里共 **6 处，全部是用户文档自己的 `旁白：…` 示例**，而"整行文本的旁白"是合法用法 ⇒ 误杀率 100%，零误报上线不可得。
落地的两件不需定档的事：`docs/user/writing/axs-syntax.md` 的对白段写清规则（含"`旁白：xxx` 是合法整行旁白"这半句），
`parse.test.ts` 新两条特征化断言（全角支 + 半角对照组；变异证据：正则临时改 `[:：]` ⇒ `expected ['say'] to deeply equal ['narration']`）。
warning 本体登记为待决（工单「全角冒号对白被静默当旁白」，三条候选各自的前置条件写在工单里）。
同轮还纠正一次取证：三份 `.axsp` 报 `BadZipFile` 不是产物坏了，是 `rglob` 把 `target/` 里的 brotli 构建副本扫进了面（真随包文件魔数 `504b`，副本 `1b…`）——**扫描面要先分"跟踪文件 vs 构建目录"**。明细见 `docs/REFACTOR_DESKTOP.md`「第二十八次续做」。

同日第十一批（**动了发射器**，仍未提交）：查 `draftFromProse` 的 `defaultSpeaker` 生不生效，顺出两层。
① 那条 `!i.speaker` 补默认名的分支**永不点火**（唯一生产者 `proseToScriptDraft` 的正则要求名字非空才成 `say`）；
② 顺着 Python 补默认名的位置（`ai_draft.py:109`，在**发射器**里）发现 TS 的 `printAxs` 没有等价兜底：
空说话人的 `say` 实测印成 `# 测试\n: 你来了。\n`，回读变 `narration`、正文留着冒号——**冒号漏进玩家文本、op 翻了**；
而 `instructionOps.ts:33`（编排台「+ 台词」按钮造的形状）就是 `{op:"say", characterId:null, text:""}` ⇒ 活路径。
**这违反的是在册契约**：ADR-016 质量要求第 2 行写着 `parse(print(beats)) ≡ beats`。
修法取"按旁白那一支印出去"，依据是三方一致（`ir.ts:90`「缺省为旁白」＋运行端 `resolveSpeaker→null`、`BacklogPanel` 的 `entry.speaker &&`＋文本层没有"无名对白"形状）；
另一条候选（照 Python 补"旁白"显示名）会让玩家多出一个原本没有的名字，属播放可见变化，已作为**双端差异**登记进 ADR-027 补记，本 ADR 认 TS 这条。
转义规则顺手归一：新增 `printNarrationLine` 一份，`narration` 与这一支共用。
判据三条（`parse.test.ts` 新 describe，RED 先跑 `expected '# 测试\n: 你来了。\n' to be '# 测试\n你来了。\n'`，对照组一开始就绿）；
**改断言不删断言**再一例：`projection.test.ts:107` 那条基线原本钉的就是坏输出（注释写着「既有行为，基线钉住」），已按新预期改写并留日期与原因，对 `> 东 -> 东方` 的钉原样保留。
末轮：`gates` **0**、单测 **548 passed + 1 skipped**（axs 86）、`e2e:desktop` **37**、`e2e` **50**。明细见 `docs/REFACTOR_DESKTOP.md`「第二十九次续做」。

同日第十二批（**只动测试数据与注释，产品代码未改**，仍未提交）：先查证"两端共享向量锁等价"有没有执行者——有：`ci.yml:88` 在 `working-directory: backend` 跑 `uv run pytest tests/`，
`backend/tests/test_axs_draft_vectors.py` 消费同一批 `testdata/axs-draft/*.json`，且它只断言"发射器 reproduces 手写期望文本"（合法性由 TS canonical 解析器裁决，不拿 Python 自己的正则自证）。
缺的是覆盖面：补第五条向量 `unknown-speaker.json` 锁住"认不出的名字不猜角色"这条双端同裁决，
并把那条易漂细节钉死——**两端都固定用全角 `：` 重新拼接，与输入冒号种类无关**（TS 的注释此前写"保留全角冒号原样"，对半角输入不成立，已改写并把注释移进所属分支）。
牙齿各验一侧（成对变异）：两端同时改半角 ⇒ TS `1 failed | 5 passed` 红在该条、Python `test_rules_emitter_reproduces_vector[unknown-speaker]` 红；还原后两端各自全绿。
明细见 `docs/REFACTOR_DESKTOP.md`「第三十次续做」。

同日第十三批（**只动测试**，仍未提交）：又抓到一处发射侧静默丢失，比前几处更重——
`printBeatBody` 用 `script.find(op === "choice")` **只取第一个分支组**，第二个组连同选项一起消失且无诊断。
探针读数：`[say, choice[左], narration, choice[右]]` ⇒ `# 测试\n堰纱: 选吧\n中间一句\n> 左\n`，回读只剩 1 个 choice、0 条诊断；
**违反 ADR-016 质量要求第 2 行** `parse(print(beats)) ≡ beats`。活路径证据：`ScriptEditor.tsx:81` 的 `add` 无"每拍只许一个分支"守卫，
「分支」就在指令面板里（`instructionOps.ts:21,58`）⇒ 连点两次即成立。
三条候选修法各自动不同层（合并成一组／扩语法支持多组／发射侧加诊断），**都需要产品决策**，故本轮只落不需定档那半：
`roundtrip.test.ts` 新增一条特征化断言钉住当前实态（注释写明修法定了要**改写而不是删除**它），并把三种修法与代价登记为待决（我建议 ③：先止住静默，代价是要给 `printAxs` 加一个可选诊断出参）。
末轮：`gates` **0**、单测 **550 passed + 1 skipped**（axs 88）。明细见 `docs/REFACTOR_DESKTOP.md`「第三十一次续做」。

同日第十四批（**新增一道门禁**，产品代码未改，仍未提交）：`scripts/check-doc-citations.mjs` 把文档里的 `路径:行号` 变成机检对象——
**文件必须存在、行号必须落在文件长度内**（动因就是今天这三次按域外提把 `parse.ts` 从 600 行压到 331 行，旧坐标会指到文件外面）。
判据先被自己的误报教过一次：首版把合法简写（`parse.ts` 第 391 行、`projection/axs.ts` 第 192 行）全判成不存在，**166/200 误报** ⇒ 不合格；
改成按 basename/后缀在受追踪源码里取唯一匹配，构建目录与 `Clearance/` 不参与匹配，且**各档计数打出来**（已判定 161、越界 3、不存在 0、歧义跳过 37、省略号跳过 1、只落在被跳目录 4）。
牙齿：临时 `docs/__probe_citations.md` 里放一条 `parse.ts` 第 99999 行 与一条不存在路径 ⇒ **FAIL / 退出码 1** 并点名两行，探针随即删除。
真信号 12 条越界：现状类 **9 条已改到真实落点**（`assignBeatIds`/`titleToId`/两条 warning → `edges.ts:36/46/84/103`；分派四支 → `parse.ts:142/297/303/312`；`axsImport.ts:57-63`），
历史日志类 **3 条不改写**、冻结进 `scripts/doc-citation-baseline.json`（注"清偿后应缩短"）。
接线三处同轮：`package.json` 新增 `check:citations` 并插进 `gates`（链 **11 → 12 条**）、`README.md` 门禁表补一行、脚本头写自报限度。
末轮 `pnpm gates` 退出码 **0**（含新那一道 OK）、单测维持 **550 passed + 1 skipped**。明细见 `docs/REFACTOR_DESKTOP.md`「第三十二次续做」。

同日第十五批（**一条线按证据作废，无代码改动**）：追「`reverseRole` 反解失败会把内部 id 印进作者文本」这条线，命中的前提是"角色被解绑后节点仍引用它"。
内核确实留悬空引用（`role.remove` 只过滤 `draft.roles`），但**先跑对照组**：全仓 grep 分派点后，
`role.remove` 只在内核与其单测里出现，而同联合的 `node.move` / `script.patch` 在 `apps/web/src` 有真实 dispatch 点 ⇒ **界面从不解绑角色，该路径今天不可达**。
处置是**不修也不加防御分支**（为不可能的输入加提示，正是今天反复拆的那一类），
并把真正值得留册的东西登记下来：**内核有 `role.remove` 能力、界面没有入口**——若将来补这个 UI 动作，必须同时决定"仍在引用该角色的节点怎么办"
（清空成无名台词 / 退回旁白 / 阻止移除并列出引用点），且它会撞上今天定的"无说话人的 `say` 发射为旁白"那条。明细见 `docs/REFACTOR_DESKTOP.md`「第三十三次续做」。

同日第十六批（**只动测试与文档**，仍未提交）：拿三份**真实随包 `.axsp`** 量了一次 `unpack → pack → unpack`，project 逐字节一致、角色数守恒 ⇒ 无缺陷，
但这条不变量在**容器层 + 真实产物**这个组合上没人走（**同日 03:21 更正**：我原写"此前没人守"是过强断言——`axspRoundTrip.test.ts` 早在 S13-2 就在 provider 层守着更强的 `exportProjectAsAxsp → importProjectFromAxsp` 字段守恒，只是输入是合成数据、不读随包文件；我按符号 `packAxsp` 扫，漏了包装函数）。补 4 条判据把它钉住：
逐份断言再读回的 project / characters / manifest.assets 相等，另加"清单声明的素材必须真在包里"与一条"目录里有三份"的数量守卫（防空载）。
牙验过：临时让 `packAxsp` 序列化时给标题加后缀 ⇒ 新增 3 条全红，还原后 18 passed。**如实说**：该变异也被既有两条夹具判据抓到，
所以新增价值在输入类别（真实产物、归一化后的形态）而非新代码路径。末轮 `gates` **0**、单测 **556 passed + 1 skipped**（editor-core 163）。
明细见 `docs/REFACTOR_DESKTOP.md`「第三十五次续做」。

同日第十七批（**新增一份测试 + 一处注释纠偏**，产品逻辑未改，仍未提交）：把桌面**生产后端**那条接缝钉进单测——`TauriSqlBackend` 此前**一条判据都没有**，
而 I4（`saveNarrative` 原子覆写）在生产上的保障全压在那个文件的三个形状里，桌面壳又零 CI 信号。
**先更正我自己的框架**：起手写的"两端没有共享契约"不成立，三支契约套件确实同跑 Memory 与 SQLite(sql.js)；空档只剩"契约套件跑不到 Tauri 那一支"（它需要壳）。
新增 `tauriSqlBackend.test.ts` **7 条**：一批语句 = 一次 `invoke("sql_transaction")` 且**载荷形状逐键钉死**（真会静默的那格是 `dbName`：Rust 侧 `create_if_missing(true)`，库名写歪就另建一个空库并成功提交，而读路仍走插件那个文件 ⇒ 写进去的东西"消失"且零报错；`params` 反而不静默，因为带占位符的语句会被 sqlx 挡回来），
占位符**按语句独立**从 `$1` 重新编号、不发逐条 `execute` 也不发含 BEGIN/COMMIT 的文本、并发两个事务只放一个进 invoke、
一处失败后下一条仍真发出、`select` 同样翻译、外加 `isTauriEnvironment` 两分支（`index.ts` 的分派口）。
**牙＝四次成对变异，各红且只红该红的那条**：退回逐条 execute ⇒ 4 红（并量到那个"简化"会在同一条队列上**自锁**，连跑完都做不到）；去掉事务里的占位符翻译 ⇒ 2 红；
绕过队列 ⇒ 1 红；`enqueue` 少掉拒绝腿 ⇒ 1 红（红法是上一次的磁盘故障串给下一条无关语句）。还原后 7 passed。
同轮拆掉一处替代码撒谎的头注释（原文把 Rust 单连接命令写成"**若池行为不符预期**则下沉"的条件回退，而代码无条件走它）；
并查实冒烟那条注释**没撒谎**——`desktopSmoke.ts` 确有 `transaction-rollback`（重复主键触发真回滚、断言旧状态存活），但它只在 DEV 壳里由人跑，不是门禁。
又一例「vitest 只剥类型」：新测试首跑 7 全绿，`tsc -b` 却红（`globalThis.window` 的断言写成不可比较的类型转换）——今天第三次。
另把注释里那条**安全前提从断言改成实数**：`? → $n` 的重写只扫 SQL 文本，前提是"字面量里不含 `?`"；只读探针（两个存储目录 44 个非测试文件）量到
含 `?` 的 SQL 文本块 **66 个**、单引号字面量内含 `?` 的 **0 个**，读数与**口径限度**（扫不到动态拼接的 SQL）一起写进实现文件头注释，**不建门禁**（当前为真的测量 ≠ 需要棘轮的漂移面）。
**末轮取数里的一次红（已归因，不改结论）**：`pnpm e2e:desktop` 第一跑 **36 passed / 1 failed**，红在 E17 内部的自动存档那一跳（30s 轮询全返回 0），
立刻重跑同一份代码 → **37 passed**；机制就是本文件 §6 待决清单里「自动存档的 600ms 防抖窗口」那条（写入被测试自己的快速离开清掉），
**那是它的第 2 次观测，不是回归也不是新缺陷** ⇒ 登记成一条限度：那格定档前 `e2e:desktop` 的读数不能当"全绿信号"引用。我没改产品语义也没放宽断言。
末轮：单测 **563 passed + 1 skipped**（web 181 → **188**）、`e2e:desktop` **37 passed**、`e2e` **50 passed**（03:43 两半各一次，退出码 0，`.e2e-lock` 不存在）。
明细见 `docs/REFACTOR_DESKTOP.md`「第三十六次续做」。

同日第十八批（**一处运行时 fail-closed + 3 条判据**，仍未提交）：把上一批留在注释里的那条前提升成代码守的——`translatePlaceholders` 的唯一正确性依赖是
"SQL 字面量里不含 `?`"，此前它只是注释 + 一次测量（66/0）。不建扫描型门禁（扫不到动态拼接，报的是假安全感），改建运行时守卫：
**字面量含 `?` 就抛、一条语句都不发出**。动因是这条失真的形状：`'?'` 里那个 `?` 会被当占位符吃掉，后面真占位符集体前移一位，
**绑值全错而 SQLite 照收**——与今天全天在拆的"文本层静默失败"同族，只是搬到存储层。
扫描认 SQLite 的 `''` 转义（`'it''s ?'` 也算字面量内含 `?`）。补 3 条判据（该文件现共 **10 条**）：事务遇坏字面量 reject 且零 invoke、
转义引号同样拦、**零误杀对照组**（`VALUES ('inline', 'it''s fine', ?)` 与 `pragma_table_info('projects')` 照常翻译）。
牙＝成对变异：退回上一形状 ⇒ **恰好 2 红**，红的方式就是缺陷本身（`promise resolved "{rowsAffected:1}" instead of rejecting`），对照组两种形状都绿。
**一条范围声明**：这一刀 e2e 两套都加载不到该模块（chromium 里 `isTauriEnvironment()` 为 false ⇒ 走 Memory 支；这条分派条件是上一批刚钉的第 7 项，
所以"测不到"是有判据的说法不是推测），真壳内行为仍只有 DEV 冒烟覆盖——这也是选"抛"不选"记 warning"的理由：抛会被 Provider 收成 `io` 错误、界面可读。
末轮：`gates` **0**（13 道，`[file-size]` 348 文件 0 越线）、单测 **566 passed + 1 skipped**（web 188 → **191**）、`git diff --check` 0 行。
明细见 `docs/REFACTOR_DESKTOP.md`「第三十七次续做」。

同日第十九批（**一处改判 + 一个新测试文件（7 条）**，仍未提交）：桌面素材落盘 `TauriAssetStore` 也是**零判据的生产模块**（契约套件跑 Memory/sql.js，e2e 两套加载不到它）。
读实现时撞上一条**已发布但站不住的 ADR 决策**：`ADR-026` 后果里写「非安全上下文退化为 FNV 内容键，仅用于去重不承担安全语义（代码内已写明）」——
两句都不成立：① `contentKey` 自己的注释写明「仅供内存实现与测试；桌面/服务端落盘用 sha256」，桌面拿它当落盘键正是被禁止的用法；
②「须留痕」在代码里**毫无痕迹**。后果落在用户承诺上：用户文档写「文件名是 SHA-256…别的电脑认得同一个文件」，
走降级支的机器会让同一张图在两台电脑上得到两个 ref、可携带性失效，**而 `write` 照样返回成功**——今天全天那一族"静默降级伪装成合法"在存储层的第三个实例。
修法：删掉兜底（不加痕迹）。缺 `crypto.subtle` 就抛，`write` 收成 `err(io, 「素材摘要不可用（缺 SHA-256），已拒绝落盘」)`，**一个字节都不落盘**。
新增 `tauriAssetStore.test.ts` 7 条（该文件首批）：已知向量钉死 ref 就是 SHA-256、无 subtle 不降级且 `writeFile` 零次、同内容幂等不重写、空字节 io、
外部 URL 的 ref 不去拼路径、缺文件 not_found、读失败 io。**牙＝三次成对变异**：恢复兜底 ⇒ 1 红（红法正是"降级写会成功"）；摘要换成非加密键 ⇒ 2 红；去掉 `exists` 守卫 ⇒ 1 红。
**改判的分寸**：没改写 ADR-026 那行历史，而是在其末尾**另起带日期的补记**（依据＝两条在册契约相撞、判据与变异读数、并把"保留兜底但显性化"的替代修法留给用户定档）；
用户文档同轮补一句失败行为。改动局限在 `contentDigest` 一条分支 + `write` 一个 try，回退成本低。
明细见 `docs/REFACTOR_DESKTOP.md`「第三十八次续做」。

同日第二十批（**只动文档，产品代码一字未改**，仍未提交）：把一条**在册的产物层"实测"证伪其取证方法**，再带对照组重证一次。
被审的对象是 REFACTOR 里那条「生产产物不含 DEV 测试宿主 `?storage=memory`」——它已经历过一次更正（从 `strings` 二进制换成 grep dist），
但**换完承载层之后搜的还是那个不存在的串**：源码形状是 `.get("storage") === "memory"`，`storage=memory` 这个字面量在源码和产物里都不会出现，
⇒ 那次「文件数 = 0」在任何构建上都**恒为 0**，与它替换掉的旧证据一样证明不了事（**这是"0 命中要先问它是不是恒为 0"那条的又一实例，且这次栽在已经改过一次的地方**）。
今天按代码真能长成的三种形状搜（`get(`storage`)` / `get("storage")` / `storage` 与 `memory` 相隔 12 字符内的邻近式），`apps/web/dist/assets/*.js` 全 0 命中，
**并配两道对照**：① 同一个 chunk（`ui-*.js`，存储代码实际落处）里 `axiforge.db` 命中 1 次；② 产物里能看到 react-router 原样保留的 `URLSearchParams(a.search)` 与 `.getAll(\`index\`)`，
证明构建不改写 `X.get("字面量")` 这种形状。结论不变（DEV 宿主确实没进产物），证据第一次成立。
同轮把那条引用里指错位置的行号校正（原写 `139,143`，139 落在注释里；改成 `apps/web/src/shared/storage/index.ts:143,144`）。
**方法收成一句**：验"某串没进产物"之前先问这个串在原代码里长什么样——文档里的措辞不是可搜索的字面量。明细见 `docs/REFACTOR_DESKTOP.md` 该项的「补记（2026-10-01 04:00）」。

同日第二十一批（**改门禁本体**，仍未提交）：上一批写作之后 `check:citations` 报 **3 条新增**，而那 3 条全是在册的历史引用——
基线键里带着**文档行号**，我插入的段落把它们顶下去十几行，于是"写文档"这件事本身在制造假红。
危害不止吵：假红的标准处置是 `--update`，**每写一段文档就重登记一次漂移**，棘轮实质等于没关。
修法是把身份键里的位置去掉：`某文档 → 目标文件:目标行`，打印仍带当前行号。**一句话方法**：棘轮的键只能用在"被改动时不变"的量。
四条腿各验一次：`--update` 后 3 条在册退出码 0；**位置稳定性正判据**＝宪章顶部临时插一行把在册项顶下一行 ⇒ 仍 OK（探针即删、行数复原）；
**该拦**＝临时探针文档放一条越界行号与一条不存在文件 ⇒ FAIL 退出码 1 且逐条点名，删净后 OK；
**复述不绕白**＝同一文档里另起一句复述同一个在册目标 ⇒ **FAIL 且点名那一句**（这一条是修完第一版之后被自己的绿灯逼出来的）。
**那次绿灯里的异常**：全链报 OK，但计数从 `已判定 165 / 越界 3` 变成 `172 / 越界 8`——多出的 5 条是我**为解释这道门禁而在新段落里原样复述的在册目标**；
去掉行号后"同文档 + 同目标"并成一个键，一条白名单就白掉任意多次复述，于是键里再加**所在句子指纹**。
处置是**改我自己的句子**（写成非引用形式），而不是把 5 条复述登记进基线——后者等于用豁免修误报，棘轮会从 3 条放宽到 8 条。
**方法收成一句**：门禁报 OK 但计数变了向也要归因，退出码 0 不是绿灯的全部。最终读数 `已判定 167 / 越界 3 全在册 / 退出码 0`。

同日第二十二批（**新增一份测试（9 条），产品代码一字未改**，仍未提交）：`.axsp` 导入的回滚契约此前**零判据**——`importProjectFromAxsp` 工程建好之后有 7 个失败出口，
每个都调 `rollback` 删半建工程，函数头写着「不留半套内容」，而既有往返测试只走成功路径。补 `axspImport.rollback.test.ts`：对照组 + 7 个出口各注入一次失败并断言工程列表回到空 + 一条**如实的残留特征化**。
牙＝两次变异：整条回滚拆掉 ⇒ **8 红且对照组仍绿**；只漏最后一个出口 ⇒ **恰好 1 红且点名该出口**（那正是"新加失败点忘配回滚"的形状）。两次变异后都用 `git diff --stat` 确认被改文件回到 HEAD。
**测残留时量到一条更大的**：失败路径删得掉工程、**删不掉本次新建的角色**——不是漏写，是 **L4 契约里没有删除角色的方法**（只有 `saveCharacter` / `listCharacters` / `getCharacter`），"不留半套"因此只兑了一半。
探针实测同一条节点 id 写进两个真 SQLite 工程 ⇒ `second.ok=false`，错误 `io「saveNarrative 事务失败已回滚」`；成因两条都在册（`project_nodes.id` 是全局主键；导入只重映射角色 id）。
⇒ **同一个 `.axsp` 导第二次必失败**，用户看到一句看不懂的错，且每重试一次多一组孤儿角色。修法三条候选都动包内标识语义或本地库 schema，**登记为待决 ⑫**（推荐"节点 id 一并重映射"，角色已经是这么做的）；
"要不要给契约补 `deleteCharacter`" 是**待决 ⑬**，它和今天在册的"内核有 `role.remove` 能力、界面没入口"共享同一个前置问题：仍在被引用的对象怎么办。
两条测试宿主教训：node 无 `localStorage` 时 `getCreatorId()` **每次返回新 id**（壳里不是，非产品缺陷），不桩定它就会红在宿主上；
不带范围的 `listCharacters()` 只回**公开**角色，而导入角色不继承公开位——读错范围会把残留伪装成"没有残留"，故同时钉住"带 authorId 有 1 个、公开面 0 个"。
明细见 `docs/REFACTOR_DESKTOP.md`「第四十次续做」。

同日第二十三批（**归一两条通路的策略 + 2 条判据**，产品行为按已定语义收敛，仍未提交）：把待决里"S13-7 两套 AXS→图 要不要归并"对着当前代码核了一遍——
清单原来写的"`beatToNarrative` 与 `beatToNarrativeData` 是否逐字段等价未核对"**已经指不到东西**（那个符号今天早些时候的归一里已经不在了），
但归并没有做完：差的是两处各自写的**策略**。diff 函数体抓到两条真分歧：
① 同名既有节点复用哪一个——通路一第一个赢（`if (t && !titleToId.has(t))`），通路二是 `new Map(existing.map(...))` 即**最后一个赢**，
⇒ 同一份源文本走不同入口会改到不同节点；**在册那条配对判据抓不到，因为它的夹具只给了一个同名节点**（配对判据的覆盖面 = 夹具的分母）。
② "什么算可复用的 beat.id"——同一串正则字面量在两个模块各抄一遍。
处置是归一而不是登记：策略统一成第一个赢（对齐工单「AXS 应用回草稿时同名 Beat 会塌到同一个节点」已定的语义），
正则收成一条导出谓词 `isReusableNodeId` 由两条通路共用 ⇒ **"两侧不同判"在结构上不可能**。补 2 条判据（editor-core 163 → **165**）。
**归一类判据双向取证**：把通路二钉回旧策略 ⇒ 恰好 1 红并点名 `keep-2` vs `keep-1`（而旧配对判据仍绿，这就是新夹具的理由）；
把共享谓词放宽成"任何 id 都可复用" ⇒ 6 红，新那条在名单里。两次都以备份原样还原，还原后 36 passed、`tsc --noEmit` 0。
S13-7 那条待决因此**只剩外层循环与返回形状是否合成一个**（映射、落位、id 判定、同名策略四处已同源），§6 已按实态改写。
末轮：`gates` **0**、单测 **584 passed + 1 skipped**（editor-core 163 → **165**）、`e2e:desktop` **37 passed**（改动落在 Writer 保存路径，所以点击层重量一次）、`git diff --check` 0 行。明细见 `docs/REFACTOR_DESKTOP.md`「第四十一次续做」。

同日第二十四批（**上线第 14 道门禁 `check:seams` + 补一份判据**，产品代码一字未改，仍未提交）：本会话手工发现过三次"桌面生产模块零判据"（事务形状、摘要降级、导入回滚），
所以把那个共同特征变成棘轮。判据特征选得机械可判：**直接 `import` 了 `@tauri-apps/*` 的模块只在壳里跑到**，而壳零 CI 信号、契约套件只跑 Memory/sql.js。
两层判据：① 要有同名测试文件；② 那个测试**必须真的 import 被测模块**（否则加个空测试就能骗过第一层）。基线键带层级（`文件#no-test` / `文件#no-import`），
因为**不分层的键会让"给在册模块补一个空壳测试"躲过第二层**——这一洞是我自己写基线时看到的，改完后腿二实测会红。
分母实测：扫 `apps/web/src` 得 **6 个桌面接缝模块**，4 个有判据（本会话补的三份 + `desktopSeed`），2 个具名登记在 `scripts/desktop-seam-baseline.json`
并各写理由（`desktopSmoke.ts`＝冒烟本身是判据的载体不是对象；`index.ts`＝分派口，其桌面组件已各自有判据，"选哪一支"要 mock 六个模块）。
**门禁的第一批客户还是我自己**：`assetContext.ts` 原本在基线里，我当场补了 5 条判据把它摘掉——那是"立绘显不显示"的最后一跳，出错方式是不显示且无错误可查。
牙：腿一摘掉一份真测试 ⇒ FAIL 点名 `tauriAssetStore.ts#no-test`；腿二放一个不引用 `./index` 的空壳测试 ⇒ FAIL 点名 `index.ts#no-import`（基线不吸收）；
腿三还原 ⇒ OK 且 `--update` 可缩短。**退出码单独取**（上一条管道里 `$?` 拿到的是 `head` 的）：桩文件在时 **1**、删净后 **0**。
`assetContext` 那 5 条也验过牙：把 `localRoot ? convertFileSrc : undefined` 摘成 `undefined` ⇒ **恰好 1 红**（红在"asset 协议没被调用"）。
接线三处同轮：`package.json` 的 `check:seams` + `gates` 链（**13 → 14 道**）、`README.md` 门禁表补一行、脚本头写自报限度。
末轮：`gates` **0**（14 道）、单测 **589 passed + 1 skipped**（web 207 → **212**）、`git diff --check` 0 行。明细见 `docs/REFACTOR_DESKTOP.md`「第四十二次续做」。

同日第二十五批（**分派口补判据，接缝基线 2 → 1**，产品代码一字未改，仍未提交）：上一批留给我的那条"分派口 `index.ts` 要 mock 六个模块"，真去做之后结论变了——只替换本地五个模块即可（`@tauri-apps/*` 一个都不碰），editor-core 两个真 Provider 直接跑。
新增 `index.test.ts` **4 条**，钉三条只有工厂知道的不变量：① **素材根目录必须先于播种登记**（晚一秒 ⇒ 首启播种的立绘解析成空串，图不出现且无错误可查）；② 播种每进程一次 + `getStorageProvider()` 每次同实例；③ `?storage=memory` **只替代存储不替代壳能力**（不得去建 `TauriAssetStore`）——这条边界原来只在文档里，现在有机器判据。
**取证过程值得记**：三次变异有两次**根本没落进去而测试照绿**（第一次 `perl` 模式要求 `&&` 后带空格而源行是换行；第二次命中了**注释里同名的 `import.meta.env.DEV`**）。
换成只可能命中代码的形状、并**先 `sed` 打印被改行**再跑，才拿到真红。**方法：变异跑绿先怀疑没写进去。** 另一坑：`vi.resetModules()` 后顶层静态 import 的类与工厂用的是两个不同对象，`toBeInstanceOf` 会假红 ⇒ 从同一份新模块图里动态取类。
三次各红 1 条（顺序／记忆化／短路），每次都 `cp` 原样还原，末了 `git diff --stat index.ts` 为空。文件按门禁命名约定改成 `index.test.ts` ⇒ `check:seams` 当场缩短为"有判据 5、基线 1"（只剩 `desktopSmoke.ts` 带理由在册）。
末轮：`gates` **0**（14 道）、单测 **593 passed + 1 skipped**（web 212 → **216**）、`[desktop-seams] OK`、`git diff --check` 0 行。明细见 `docs/REFACTOR_DESKTOP.md`「第四十三次续做」。

同日第二十六批（**又一份纯判据，产品代码一字未改**，仍未提交）：census 里最后一个"非云、非冒烟"的无判据模块是 `assetRecords.ts`（存储态→传输态投影，两个纯函数）。
它文件头写着"已知缺席字段，如实标注而非编造"——而这类**刻意的不对称**最容易被"顺手统一"抹掉，代价是界面上出现假事实：
道具/舞台的「N 个剧本引用」角标靠 `ref_count === undefined` 隐藏，谁把它对齐成 `0`，用户就看到一个谁都没数过的「0 个剧本引用」。
补 7 条：两支响应**键集合不多不少**、`ref_count` 的三处不对称（道具**无键** / 舞台**键在值缺** / `view_count` 恒 0）、**数组是拷贝**、可空字段原样透传与两个明说的等式。
**一条类型系统挡不住的**：`readonly string[]` 直接把引用赋过去照样 `tsc -b` 退出码 0——别名缺陷只有行为判据能挡，所以第 ② 类要写成 `"ref_count" in r` 而不只是比值。
三次变异都**先 `grep` 出被改行再跑**（上一批的教训当场兑现）：去掉 `effects` 展开 ⇒ 1 红；`ref_count: undefined` → `0` ⇒ 1 红；给道具补 `ref_count: 0` ⇒ 2 红。全部还原、`git diff --stat` 为空。
末轮：`gates` **0**（14 道）、单测 **600 passed + 1 skipped**（web 216 → **223**）、`git diff --check` 0 行。明细见 `docs/REFACTOR_DESKTOP.md`「第四十四次续做」。

同日第二十七批（**收口认证 + 把验收①从"不可判"做成一条可判候选**，产品代码一字未改，仍未提交）：
① **六条链一次跑齐、退出码逐条单独取**（04:56–04:58）：`gates` 0（14 道）· `test:unit` 600 passed + 1 skipped · `e2e` **50 passed** 0 · `e2e:desktop` **37 passed** 0 · `build:web` 0 · `build:admin` 0 · `check:desktop`（桌面壳 `cargo check`）**0** · 后端 `uv run pytest -q` **167 passed**（3.65s）0。
**桌面 cargo 这次本地绿，不改变"桌面壳零 CI 信号"这条限度**——CI 里没有 desktop job，所以那句仍挂在定档第⑦条；这一条我在文档里写明了，免得下次有人拿"跑过"当"有闸门"。
② 验收清单第①条原本被判为"判据本身不可判"，这次把建议措辞写成机械形式并**先量再交**：`/api/v1` 只允许出现在 `*.test.*` / 注释行 / `shared/api/client.ts` 里带 `apiBase` 的那一行，其余算新调用点必须为 0。
实跑 `命中：测试 9、注释 1、基址定义 1、越界调用点 0`、退出码 0；**牙验过**（临时放一个越界调用点 ⇒ FAIL 点名那一行、退出码 1；删净 ⇒ OK）；并自带一条防退化：三类命中数**全 0 时它自己报 FAIL**，防止字面量被清空后这条检查静默变成恒真。
**它刻意先不进 `gates`**（与 `check:desktop` 同类："存在但不在链里"），因为口径归用户定；定了以后接进链只差一行。登记在 `package.json` 的 `check:apibase`。
③ 顺手核掉一条躺在「接手优先级」里的事实断言并量化：`vercel.json` 共 **4 处**引用不存在的 `backend/src/main.py`（真实入口是 `backend/app/main.py`）⇒ 它不是"还能用的备用发布路径"，这条已写进 `ADR-029` 的 04:56 补记，并声明**当前定档清单的权威在 §6 这一份**。
末轮：`gates` **0**、`check:apibase` **0**、`git diff --check` **0 行**、`git status` 61/17/26。

同日第二十八批（**把第 14 道门禁自己那条"故意留的限度"关掉**，产品代码一字未改，仍未提交）：
`check:seams` 上线当天自报的限度是"第 2 层只查有没有 import，不查 import 之后断言了什么——空壳测试仍然算过"，
理由写的是"断言有没有牙要靠变异取证，不是本脚本的活"。这句话一半成立：**相关性确实不可机械判**（见下），
但"有没有断言"从来就是可判的，把它写成"不是我的活"等于给最容易顺手交出的那种判据（只调用不判断）免了检。
先量在册真值再上档（否则交付即红）：5 份在册测试的真断言数是 **11 / 9 / 15 / 20 / 28**、恒真断言 **0** ⇒ 新档今天不误伤任何人。
补成三层：第 3 层数 `expect(...)` / `assert(...)`（**先按行剥注释**，`// expect(...)` 是判据的自述不是判据），
并把 `expect(true)` 一类恒真断言从计数里扣掉——扣完为 0 ⇒ `#no-assert`；文件里还留着恒真断言 ⇒ 另记 `#trivial-assert`。
四腿取证（临时探针文件，跑完当场删净）：干净树 **OK 退出码 0**（`有判据 5 / 真断言合计 83`）→
只调用不判断 **FAIL 1** 点名 `apps/web/src/__probe_seam.ts#no-assert` →
一条真断言 + 一条恒真 **FAIL 1** 点名 `#trivial-assert`（且合计只从 83 变 **84**，证明恒真那条没被算进证据）→
断言只写在注释里 **FAIL 1** 回到 `#no-assert`（证明剥注释那一步不是装饰）→ 删净 **OK 0**。
剩下的限度如实写进脚本头并给出"为什么做不到"的证据：**判不了相关性**（一份测试可以 import 本模块、断言全打在别的东西上仍算过），
机械判相关性要把断言表达式与模块导出符号配对，而配对要理解作用域——同一天文档引用对账试做内容层那次，
52 条可判引用误报 **38%**，成因正是这种没有机械邻近关系的配对；**"断言有没有牙"仍归变异取证**。

同日第二十九批（**把 `check:seams` 自己的扫描面从"一厢情愿的 apps/web/src"改成实测过的发布源码面**，产品代码一字未改，仍未提交）：
脚本头第二条限度原写"只看 `apps/web/src`；`packages/*` 的内核模块不在面内"——这句话当年是**假设不是测量**。
先做全仓普查（`/tmp` 里的临时脚本，扫 `apps/` + `packages/` + `e2e/` + `scripts/` 共 **416** 个源文件，两种形状各种都试）：
`@tauri-apps` 在 `packages/*` 命中 **0**；但把形状从"引用 Tauri"扩到"引用 Electron 主进程桥"后，抓到 **2 个真的无判据壳模块**：
`apps/nexus/electron/main.cjs`（**45 行**：`new BrowserWindow` + dev `loadURL` / prod `loadFile` 二选一 + 一条 `ipcMain.handle("nexus:get-version")` + 三个 `app` 生命周期钩子）与
`apps/nexus/electron/preload.cjs`（**5 行**：`contextBridge.exposeInMainWorld("nexus", …)`，唯一的桥就是那条 handler）。
这两个是**今天第一次被机械地看见**——上一版门禁按定义看不见它们。
于是面改成 `apps/` + `packages/`，形状改成 Tauri 或 Electron 桥，`.cjs/.mjs/.js` 一并纳入扩展名（`preload.cjs` 正是 `.cjs`，旧面按 `\.(ts|tsx)$` 过滤根本不会打开它）。
**为什么这两个不顺手补测试**：`apps/nexus` 没有测试设施（vitest 只给 admin 建过）、mock 整套 `app/BrowserWindow/ipcMain` 得到的判据只验 mock、
而最根本的是 **nexus 的处置本身挂在 `ADR-029` 未决清单第 2 条**（`sendToInbox` / `aiApi.suggestCharacter` 判死还是本地化）——给一支可能判死的 Electron 壳搭测试设施=替用户做决定。
所以按**具名基线**登记（各带理由），棘轮从"1 条在册"变"3 条在册"：**这不是放宽**，因为面变大了、且新增壳耦合模块仍必须自带测试。
牙验过（临时探针 `packages/ui/src/__probe_shell.ts` 引用 `@tauri-apps/api/core` 且无测试 ⇒ FAIL 点名 `packages/ui/src/__probe_shell.ts#no-test`、接缝数 8→9；删净 ⇒ 回到 8 且退出码 0），
所以"扩到 packages"不是写在文档里的姿态，是跑出来过的形状。
**顺带给 `ADR-029` 未决第 2 条补了实测分母**：nexus 的壳耦合代码总共 **50 行 / 2 个文件**，全部只有一个功能（读版本号）——判死的成本比想象低，这条读数已写进基线理由，问那一条时可以直接引用。

同日第三十批（**入口那条"冒烟该不该跑"的判据从零判据升到 6 条，并补上门禁看不见的一类形状**，产品代码只动 `main.tsx` 一处抽取）：
普查壳耦合形状时（全局句柄而非 import 包：`__TAURI_INTERNALS__` / `contextBridge` / `ipcRenderer`）发现 **`main.tsx` 的冒烟触发条件读的就是这个全局，而它不在第 14 道门禁的面内**——
旧形状只认 `@tauri-apps` 与 `electron` 的 import，"读全局"这一类结构性看不见。
那句判据同时是**承重**的：它要 `invoke` 可调用而不是全局存在，因为 e2e 桌面态注入的正是空对象 `__TAURI_INTERNALS__`，
按存在性判会让冒烟在测试宿主里真调 plugin-fs/plugin-sql 并抛未捕获异常（原注释记着"实测两条"）——**而这条差异当时只活在注释里，没有任何判据挡着人把它"归一"**。
处理：判据抽成 `apps/web/src/shared/storage/shellSmokeGate.ts`（`main.tsx` 仍走懒加载，不把整个存储栈拉进入口），补同名测试 **6 条**，
其中一条**直接钉语义差**：同一个注入形状下 `isTauriEnvironment()` 为真、`shouldRunDesktopSmoke` 为假 ⇒ 谁把两者合并就会红。
牙：把谓词"简化"成 `internals !== undefined`（就是那句注释警告过的写法）⇒ **3 条红**，还原后 `diff -q` 与原文件一致、`tsc -b` 0、6 条仍全绿。
门禁形状再加两档（全局句柄 + Electron 桥），并修掉一个自己喂自己的坑：**形状匹配原本吃全文**，
`main.tsx` 只因为**注释里解释了为什么不用那个全局**就被登记成接缝——负向文本守卫被自己的解释喂饱（这是本会话第二次撞上同一形状），改成只吃剥注释后的代码；
顺带如实留一格：行尾注释与块注释中段行仍会算命中，方向是"多判一个待登记"，不会漏真引用。
末了读数 `[desktop-seams] OK —— 桌面接缝 9 个：有判据 6（真断言合计 94）、缺测试 3、基线在册 3`。
**另一条只登记不处置的观察**：`navigator.clipboard.writeText` 实测 **5 处**调用点（`ShareActions` / `StoryEditPage` / `CharacterDetailPage` ×2 / `PromptExport`）全在无同名测试的页面 `.tsx` 里；
它们在 Tauri WebView 里到底能不能用属运行时事实，不是"引用了壳包"这种机械特征，把它们算进门禁会让这道门禁第一次运行就要登记 5 条基线、把"壳耦合"稀释掉。
所以**没进脚本，也故意不占 §6 的编号**（那是共享计数器）——只在这里留一句：**桌面剪贴板是否真会静默失败，本机无壳可验，属未验证观察**。

同日第三十一批（**⑫ 交付：同一个 `.axsp` 现在能重复导入**，2026-10-09，产品代码有改动，仍未提交）：
接手先做的一件事是**重测环境**——距上次停车过了 7 天，`git status` 从 62/17/28 变成 78 M/36 ??，`axspImport.ts` 在 10-05 被改过，
还多出条件向量一族（`packages/core/src/*Vectors.test.ts`、`backend/tests/test_condition_*.py`）的新工作；HEAD 仍是 `1b9ca06`（没人提交过），
所以我按当前树取数，不引用上周的读数。
**前提逐条核实过**：`project_nodes.id`、`project_edges.id`、`project_roles.id` 在 DDL 里都是**全局** `TEXT PRIMARY KEY`（不是 `(project_id, id)` 复合键），
而导入侧只重映射角色 id 与节点的 `stageId` ⇒ 包里的节点/边原样插入。
**RED 的形状值得记**：新写的第一条判据（真 SQLite 上原样导第二次 ⇒ `ok=false`、整批回滚、第一份无损）**当场通过**——
它不是"我要实现的期望"，而是**缺陷的复现**，所以它天然绿；真正红的是另两条（`remapNodeIds is not a function`）。
一个自己的错也被这条救回来：夹具里我先拿源工程的 bundle 往第一个新工程插，**结果第一次就撞**（包里 id 已在本机库里），
这等于第三次独立确认了同一件事——"从本机导出的包，导回本机连第一次都失败"，比"导第二次"更严重。
**修法**：`remapNodeIds(project)` 放在 `packages/editor-core/src/axsp.ts`，与 `remapCharacterIds` 同族同形状；
id 取存储行 id 的唯一权威 `rows.ts::uuid`（不另造第二个生成器）；
**同时**换节点 id、边 id、以及边的 `source`/`target`——只换节点不换边就是把"撞主键"换成"边悬空"，那更安静。
纯函数、不改入参、`narrativeData`/`editorData`/`axsSource` 一字不动（图内跳转按 Beat 标题寻址，节点 id 只存在于边两端，ADR-016）。
判据分层：真库那半在 editor-core（`SqlJsBackend` 只在包内可达；**没为测试新开公共导出**，以免把 sql.js 拖进 web 产物层），
通路那半在 apps/web（`storage.test.ts` 往返条：新旧工程节点 id **互不相交**、边数相等、边内容等价、边两端解析得到）。
**既有基线改的是连接键不是覆盖**：`seedPlayable.test.ts` 原先拿随包文件的原始 id 去 IR join——身份一换那 join 天然失效，
改成"节点数 + 有舞台的节点数 ↔ 有 sceneId 的 Beat 数 + 每个 sceneId 真在 scenes 里 + sceneTitle 非空"，
舞台解析那半反而更宽（遍历全部 Beat，不再只遍历 join 得上的）；往返条顺手把夹具从 0 条边补成 1 条，
否则"边两端跟着换"那条断言是**恒真的空判据**。
牙取了三刀，每刀先 `grep` 出被改的那一行再跑：只换节点不换边 ⇒ editor-core 2 红 + web 往返 1 红；节点 id 根本不换 ⇒ 2 红（含不相交条）；
把 `axspImport` 里的调用摘掉 ⇒ web 往返恰好 1 红（其余 166 条仍绿，说明**通路判据只有往返条守着**，这是它的真实覆盖面不是我的夸大）。三刀都以 `cp` 还原、`diff -q` 一致。
末轮（06:37）：`gates` **0**（14 道）、editor-core `tsc --noEmit` 0、web `tsc -b` 0、web storage 套件 **167 passed + 1 skipped**、
`[desktop-seams] OK 9 / 有判据 6（真断言合计 99）/ 基线 3`。
**两套 e2e 本轮没跑**，理由是端口上有一支 8 天龄的别人的 dev 栈（uvicorn:8000 + 三个 vite），非 CI 下 `reuseExistingServer` 会让我测到别人的代码——
本轮改的正是产品代码，所以这条欠账我写明在 §5，下一会话要让开再取点击层数。

同日第三十二批（**⑫ 补上点击层，并把我自己那句错账纠正到准确形状**，2026-10-09，只改测试与文档，仍未提交）：
① **跑点击层前先证明端口上是被测代码**：5174 上那支 vite 起了 9 天、不是我起的，
   于是 `curl localhost:5174/src/shared/storage/axspImport.ts | grep -c remapNodeIds` ⇒ **2**（`main.tsx` 的 `shellSmokeGate` 同样 2，且返回的是转换后模块、`"DEV": true`）。
   证明成立才跑：`pnpm e2e:desktop` **38 passed** 退出码 0（原 37 + 新 E43）。**浏览器那一半我没跑**——
   8000 上是别人的 uvicorn（`--reload`，连的是**开发库**而非 `axiforge_e2e`），复用它的端口会把测试数据写进你的开发库，这条我不擅自做。
② 新增 **E43**：`.axsp` 导入这条点击路径**此前一条判据都没有**。同一个 `showcase-1.axsp` 连导两次 ⇒ 两次都各自落到
   `/studio/projects/<id>`（内存库顺序 id，实测 `proj-0001` / `proj-0002`），"还没有剧本"消失，且没有「导入失败」弹窗。
③ **我上一轮写在测试注释里的话被自己的测试证伪了一半，这里记准确形状**：
   我说「`openBinaryFile` 在测试宿主里结构上点不了」是错的——但纠正过头也是错：它先判 `isTauriEnvironment()`。
   **注入桌面标记 ⇒ 走 plugin-dialog 支，chromium 里确实开不出选择器**（本会话第一次就跑败在这，`waitForEvent("filechooser")` 60s 超时）；
   **不注入标记、只用 `?storage=memory` ⇒ 走 `document.createElement("input") + click()` 回退支，Playwright 接得到 `filechooser`**。
   所以 E43 用后者，并在注释里写清 plugin-dialog 那一腿仍属真壳手验（待决⑦）。
④ 顺带纠正一条差点写错的判据：不注入标记时页面**照旧发** 4 笔 `/api/v1`（`users/session`、`editor/projects/user/<creator>`、`llm/health`），
   因为那些消费者由 `isLocalOnlyDeployment()` 闸门、跟 `?storage=memory` 不是同一条件。
   所以我**没有**在 E43 里断"零 /api/v1"（那是 E14 的 CLEAN_ROUTES 棘轮），也没有留 `hits.length >= 0` 这种恒真条——
   `hits` 只作为断言消息里的诊断上下文。
⑤ 两条**只登记不处置的观察**：a) 工程列表页顶部【示范】条带的元素在 Playwright 下 60s 内一直 "not stable / detached from DOM"
   （第一次试图点卡片撞在这；React key 用的是 `proj.id` 不冲突，所以不是重复键，怀疑是无限动画——值得单独查，因为它意味着列表在持续重渲染）；
   b) 卡片不是 `<a href>`，按 `a[href="/studio/projects/<id>"]` 找不到 ⇒ "列表里有两张卡"这条今天写不出稳定形状，我选择**不写**而不是猜。
末轮（06:55）：`e2e:desktop` **38 passed** 0、e2e 的 `tsc -p tsconfig.e2e.json` **0**、产品代码本轮一字未改（所以上一批的 `gates` 0 仍代表代码状态，文档改完后另取 `check:citations`）。

同日第三十三批（**把上一批我写下的两条推断证伪，并把 E43 补成能测的形状**，2026-10-09，只改测试与文档）：
⑤a **「【示范】条带永不稳定 ⇒ 列表疑似持续重渲染」这条观察是我的误读，两处都错**：
`【示范】序章·交汇` 不是顶部条带，**就是我自己导入的那两份副本的标题**（示范作包里的工程名自带【示范】前缀）；
而"持续重渲染"用浏览器实测否掉了——同一页面（空态列表）挂 `MutationObserver` 观察 **2.4s ⇒ added 0 / removed 0 / attributes 0，`.animate-pulse` 节点数 0**，
`animate-pulse` 这个无限动画类只在 `packages/ui/src/components/Skeleton.tsx` 里出现。**结论：没有持续重渲染的证据**；
Playwright 报的 `not stable / detached` 只挡住**需要几何命中的动作**（点击），不挡住**计数**类断言。
⑤b 所以 E43 该补的形状补上了：`toHaveCount(0)`（导入前）→ 两次导入 → `toHaveCount(2)`，**前置对照是它自己的判据的一部分**——
没有它，`toHaveCount(2)` 可能被任何一处同名文本满足。这套形状在 07:51 的两样本都绿（全套 **38 passed**、单跑 `1 passed`）。
⑤c 顺带删掉一条**伪判据**：`importOnce` 里我写的"回到列表后『还没有剧本』应该消失"。
实测同一句空态文本在页面上有多个 section 会渲染（元剧本 / 我的 / 模板），它的有无测的是标签页布局而不是导入结果——
07:48 那次红就是这么来的（`Expected: 0 / Received: 1`，重试 14 次仍为 1）。判据要测的是"落库"，那由**工程 URL 两条各不同** + 卡片计数两条给。
⑤d 上一条里我说的"卡片不是 `<a href>`"这条**仍然成立**（按 `a[href="/studio/projects/<id>"]` 实测 `element(s) not found`），
所以"点进副本"这条腿今天写不出来，我没有为它猜选择器——**留给列表可访问性形状单独一次处理**（卡片该不该是锚点是设计问题，不是我的临时决定）。
末轮（07:51）：`e2e:desktop` **38 passed** 退出码 **0**、`-g E43` 重跑 **1 passed**、e2e 的 `tsc -p tsconfig.e2e.json --noEmit` **0**、`.e2e-lock` 跑完不在、产品代码仍一字未改。

同日第三十四批（**给 S13-3 补按路由的分母，并把一个"只活在文件里的工具"接进命令面**，2026-10-09，产品代码一字未改）：
`scripts/desktop-http-inventory.mjs` 今天之前**没登记进 `package.json`**（`grep` 实测 0 命中）——这正是我在册那条失败形状：
**新命令交付 = 脚本 + 配置 + README 三处同轮**，否则能力只活在文件里，下次没人跑。这一批三处一起补齐。
普查本身升到**两臂**：桌面臂注入 `__TAURI_INTERNALS__`、浏览器臂不注入，跑同一张 8 路由表。
加浏览器臂的理由不是"多看一眼"，而是**桌面臂那个 0 原来没有对照**：分不清「真的不发」与「根本没能力发」。
今天实测（abort 拦在本地，**一笔都没打到别人那台连开发库的 uvicorn**）：
桌面臂 8/8 路由挂载、**唯一调用点 0**；浏览器臂 **9 个唯一端点**（`users/session`、`editor/projects/user/…`、`editor/projects/discover`、
`editor/assets/items/user/…`、`editor/assets/scenes/user/…`、`characters/user/…`、`creator/dashboard`、`discover/topics`、`discover/dashboard`）
⇒ 这 9 条就是**web 分支退役时要点名的云端消费者清单**，比"还剩一些云调用"可判得多。
三条腿的牙都见过红（各一次，`cp` 还原后 `diff -q` 一致）：
把桌面臂的标记摘掉 ⇒ `REGRESSION — 桌面态仍有 9 个唯一调用点`、退出码 **1**；
把浏览器臂也注入标记（让正对照变成 0）⇒ `UNRELIABLE — …此时桌面态的 0 是恒真读数`、退出码 **1**；
还原 ⇒ `OK — 桌面态零 /api/v1（正对照 9）`、退出码 **0**。
两处自己的错也记下来：① 第一版把 `page.route` 的回调参数当 Request 用（`req.url is not a function`）——Route 要 `route.request().url()`；
② `node --check` 对 `.mjs` 报的是语法层，抓不到这种运行时 API 误用，所以**语法检查通过不等于跑得起来**，判据必须真跑一次。
**它刻意不进 `gates`**（与 `check:desktop` 同类）：普查要一个活着的 web 服务，链里跑会让门禁在没有 dev server 时恒红。
末轮（07:58）：`check:http-inventory` **0**（桌面臂 0 / 浏览器臂 9 / UNMOUNTED 0）。

同日第三十五批（**把"还剩多少云端面"从人读变成脚本**，2026-10-09，产品代码一字未改）：
上一批的普查只覆盖**页面装载时**发不发（桌面臂实测 0）；它测不到"用户点某个按钮才发出去"的那一面。
新脚本 `scripts/cloud-callmap.mjs`（命令 `pnpm cloud:callmap`，**信息性、不进 gates**）做的是同一件判断的机械化：
解析 `shared/api/**` 里每个 `xxxApi.method` 的 `动词 + 路径模板`，再扫界面侧调用点，分五档。
实测读数：**95 个端点定义**（api 文件 19 个、消费者扫描 234 个文件），分档
**死面 12 / 仅 HTTP 实现侧 9 / 直连云端 34 / 混合 8 / 已有本地支 32**（相加 = 95，先过一遍加法再信表）。
**死面 12 条**（S13-3 判死清单里最便宜的一档，全名照抄自脚本输出）：
`POST /editor/ai/prose-to-script`(aiApi.proseToScript)、`GET /play/sessions/{id}`(playerApi.getSession)、
`POST …/scenes/{sid}/nodes`(projectApi.addNode)、`POST …/nodes`(projectApi.addProjectNode)、
`DELETE …/scenes/{sid}/nodes/{nid}`(projectApi.deleteNode)、`POST …/edges`(projectApi.saveEdges)、
`PUT …/scenes/{sid}/nodes/{nid}`(projectApi.updateNode)、`PUT …/nodes/{nid}`(projectApi.updateProjectNode)、
`PUT …/roles/{rid}`(projectApi.updateRole)、`PUT …/scenes/{sid}`(projectApi.updateScene)、
`PUT /characters/{cid}/relations/{rid}`(relationApi.update)、`GET /users/author/{creatorId}`(userApi.author)。
**死面 ≠ 可以立刻删**：按在册纪律要先数活读者（界面读者与机制读者分开，`projectApi.saveEdges` 这一族此前就被证过是契约面）。
**脚本自己先错过三处，都被逐条读数抓到**（这三条比结论更值得留给下一会话）：
① 分派口只认 `*Saves` 命名 ⇒ `useCharacters.ts` 明明 import 了 `getStorageProvider` 却被判成"直连云端"；
② 符号归属只取文件里**第一个** `xxxApi` ⇒ `discoverApi.dashboard` 被挂到 `creatorApi.dashboard` 名下，表里凭空多一条重复端点；
③ 实现侧没摘出来 ⇒ `shared/storage/http*.ts` 引用 apiClient 被算成"绕过"，虚增 8 条。
三处都改了，改后的抽查逐条对过（`discoverApi.dashboard` 归位、`characterApi.create` 落到"已有本地支"、新增"仅 HTTP 实现侧"一档）。
**牙**：把 `apiDir` 指到不存在的目录 ⇒ `UNRELIABLE — api 目录文件 0 个、解析出端点 0 个`、退出码 **1**；还原 `diff -q` 一致。
**这一刀我自己差点交出去一份假牙**：第一次变异用的是 `"api"]`，而源码是 `"api");` ⇒ **替换根本没发生**，
证据是"变异后"与"还原后"两次读数一模一样。这是本会话第二次撞同一形状（第一次是 `check:dispatch` 的 perl 模式），
所以规矩再写一遍：**改完必须先 `grep` 打印被改的那一行，看到它真的变了，再谈红**。
末轮（08:05）：`cloud:callmap` **0**、牙退出码 **1** 见过、还原一致；产品代码零改动，`gates` 读数见下一段。

同日第三十六批（**把"绕过面"切成可定性的两半**，2026-10-09，产品代码一字未改）：
上一批的"直连云端 34"里混着两类完全不同的东西——**服务端本质**（评论、举报、Discover 一类，本来就该在云上）与**真该本地化却没有分派口**的。
加一条机械判据把它们分开：这个 `xxxApi.method` **有没有被任何分派口文件引用**（分派口集合沿用 `check:dispatch` 的命名约定
`*Saves.ts / assetPool* / achievementDefs.ts`，两道判据读同一个集合，不各说各话）。
读数从五档变六档，总数不变 **95**：死面 **12** / 仅 HTTP 实现侧 **9** / **绕过（无分派口引用）34** / **已有分派口引用（云端是 fallback）26** / 混合 **6** / 调用者已接本地库 **8**
（12+9+34+26+6+8 = 95，加法过了才报）。
抽查两条对得上：`ginkgoApi.*` 与 `itemApi.*` 都落到"已有分派口引用"（`achievementDefs.ts`、`playerSaves.ts`、`assetPoolSaves.ts` 各自点名），
而 `commentsApi.*` 三条、`creatorApi.*`、`discoverApi.*` 落在"绕过"——正是 S13-3 该逐个判死/判留的那批。
**这一档给 S13-3 的实际作用**：判死清单不再需要人逐个读 `shared/api`，`pnpm cloud:callmap` 直接给出"桌面态真会发出去"的 34 条端点 + 每条的调用点文件。
（**08:43 更正**：34 是"没有分派口引用"的数量，不是"桌面真会发出去"的数量——按调用点减掉壳守卫后真会发出去的是 **29** 条，见第四十批。）
按域分组（08:10 从同一份输出 `sed|sort|uniq -c` 得到，相加 = 34）：
`playerApi` 6、`userApi` 5、`relationApi` 5、`creatorApi` 3、`commentsApi` 3、`versionApi` 2、`identityApi` 2、`discoverApi` 2、
`tagApi` / `searchApi` / `reportApi` / `projectApi` / `nexusApi` / `llmApi` 各 1。
**读法要看清**：这一档里 `commentsApi` / `reportApi` / `discoverApi` / `searchApi` 属**服务端本质**（跨用户读写，桌面没有对应语义），
真正需要在 S13-3 里逐个问"判死还是本地化"的是 `playerApi`（玩家存档/成就的云端那半）、`relationApi`、`versionApi`（版本历史）、`identityApi` 这几族。
**两处自己的错也记下**（都属"工具本身坏了但输出看着正常"）：
① `grep --include=*.md` 在 zsh 下报 `no matches found`，我拿它做归属派生信号，结果 38 项全报"引用数 0"——**整列全 0 是工具没跑，不是没有引用**；
② 用 `perl -i -pe` 改脚本时，替换串里的 `${r.verb}` 被 perl 自己插值成空，把一行 `console.log` 模板拆成语法废件——
   `node --check` 当场接住（这正是它该干的活），但根因是**我不该用双引号插值环境去改含模板字符串的代码**：改代码走 Edit，不走 shell。
末轮（08:09）：`cloud:callmap` **0**（六档 12/9/34/26/6/8，相加 95）、`node --check` 0。

同日第三十七批（**拆掉我自己那道普查里的"空载 0"**，2026-10-09，产品代码一字未改）：
给普查加试玩路由 `/play/probe-project` 时顺手看了下桌面臂的配置，发现它**只注入标记、不带 `?storage=memory`**——
那样 `createStorageProvider()` 选的是 Tauri 支，chromium 里 plugin-sql 必败，页面压根没数据可读，于是"零请求"里有**空载伪装成干净**的成分
（这正是本脚本第 1 条腿要挡的那类假象，只是它藏在"路由挂载成功"底下：`rootChildren > 0` 只证明 React 挂了，不证明它有内容可渲染）。
改成**标记 + `?storage=memory`**（E17 一族用的就是这套，桌面点击路径唯一可测入口）后重跑：**9/9 路由挂载、桌面臂唯一调用点仍是 0**，
正对照从 9 升到 **11**（新增 `play/story/probe-project`、`editor/projects/probe-project/view` 一类）⇒ 这次"桌面装载面零云端依赖"是有本地库在跑、且方法被证明接得住请求的读数。
两臂合一臂（原本想加的第三臂"不注入标记 + memory"读出来和浏览器臂完全同一批端点，说明 `?storage=memory` **单独**并不能把页面级消费者切本地——
闸门是 `isLocalOnlyDeployment()`（看标记），不是存储参数。这条差异我上一批已经登记，这次它顺带被复证了一次，
所以第三臂删掉，不养一个不产生新信息的臂。
**改脚本时同一个坑连踩三次**：用 `perl -i -pe` 改含 `${...}` 模板字符串的行，perl 会把 `${p}`、`${webUnique.length}` 当成**它自己的**变量插值成空 ⇒
输出里出现 `LOCAL_UNIQUE=`、`  本地支：`（11 条明细全空）、`BROWSER_UNIQUE=（正对照）`三处断行，
其中"11 条本地支明细全空"我第一眼竟当成"没有端点"读了。**规矩钉死：改代码一律走 Edit，shell 只用来跑命令。**
末轮（08:17）：`check:http-inventory` **0**（`DESKTOP_UNIQUE=0 / BROWSER_UNIQUE=11 / ROUTES=9 UNMOUNTED=0`）。

同日第三十八批（**把 S13-3 需要的两侧事实并到同一屏：资源 → 本地表 / L4 契约方法**，2026-10-09，产品代码一字未改）：
`cloud:callmap` 末尾新增一段词元表：从 95 条端点路径里取资源词元（朴素去尾 `s` 单数化），对
`sqlite/backend.ts` 的 **13 张表** 与 `storage/types.ts::StorageProvider` 的 **39 个契约方法**做包含匹配，逐行印出"表:… / 契约:…"。
**脚本刻意不下结论**——它给的是匹配依据；让工具冒充判断是这张表最容易坏掉的方式，所以注释里写死了"匹配不到 ≠ 一定没有替身"。
这条限定不是套话，当场就有一个实例（下面第三行）：**关系**在库里没有 `character_relations` 表，看着像"无替身"，
但实测 `characters.character_data` 是 **JSON TEXT 列**，而运行时 `packages/core/src/conditions.ts`、`ir.ts`、
以及 `axsp.ts::remapCharacterIds` 都在读 `relationship` 键 ⇒ **读侧有本地承载，缺的是编辑写侧**
（`shared/api/relations.ts` 6 处 `apiClient`、零分派口引用）。所以关系这族真正的问题不是"要不要本地化"，而是
"编辑路径要不要落到 `character_data` 里"——这一句是判死/本地化定档里最省事的读法。
词元表读数（挑与定档相关的）：
`achievement` 表 `achievements,player_achievements` + 契约 `listAchievements/saveAchievement/deleteAchievement/unlockAchievement` ⇒ **四件套齐**；
`session`（`/play/sessions*`）与 `version`、`user`、`identity`、`comment`、`report`、`tag`、`search`、`llm` ⇒ **表与契约都是"无"**；
`relation` / `relation-graph` ⇒ 表与契约"无"，但如上所述读侧在 JSON 里；`storie`(=stories 的词元化产物) ⇒ 表 `character_stories` + 契约 `listStories`。
**这张表给 S13-3 的实际效果**：原本要逐条读 `shared/api` 的 34 个绕过点，现在压缩成三种问句——
① 有没有本地表/契约（有 ⇒ 只差分派；无 ⇒ 判死或新建）；② 状态是不是藏在 JSON 列里（关系即此例）；③ 是不是服务端本质（评论/举报/Discover/搜索/账号身份）。
**同时留一条诚实限定**：词元匹配会把 `stories` 变成 `storie`、把 `players` 与 `player_achievements` 牵上（`play`/`player` 词元匹配到 `player_achievements` 是**假阳性**——试玩会话表和成就表不是一回事）。
所以我只在文档里引用"表/契约为无"这一侧的结论，正向匹配一律回代码核对，不拿这张表当判据。
末轮（08:21）：`cloud:callmap` **0**（含词元段；非零守卫正常：13 表 / 39 契约方法）。

同日第三十九批（**把「绕过」那 34 条从一串名字变成可定档的三态**，2026-10-09，产品代码一字未改）：
词元表只回答"有没有替身"，而 S13-3 真正要逐条签字的问题是**这条在桌面该判死、该本地化、还是只差接线**。
所以下面这段把 34 条按两个可机械判的信号分开：**本地承载**（末段命中才算自身）+ **调用者可达性**（是否只落在 `features/discover/` 下）。
读数（`awk` 数过：22 + 6 + 4 + 1 + 1 = **34**，与「绕过」档总数相等才敢贴）：
- **无本地承载 = 22**：评论 / 举报 / 搜索 / 标签 / 会话 / 账号身份 / llm 健康 —— 服务端本质那一族，判死候选。
- **仅父资源有承载（子资源无专属表）= 6**：`relationApi` 的四条 + `versionApi` 的两条，命中词元都是 `characters`。
  这一档的问句不是"要不要建表"，而是"子资源落到父记录里还是外面"（关系已有在册实例：读侧在 `characters.character_data` 的 JSON 里）。
- **无本地承载 · 调用者仅 Discover（桌面不可达）= 4** 与 **自身承载 · 仅 Discover = 1**：桌面结构性没有这些入口，
  可达性是机器判的（`r.files.every(f => f.includes("/features/discover/"))`），不是我印象里"应该进不去"。
- **该资源自身有承载（只差分派）= 1**：`playerApi.getCharacterStates`。
**这轮新增的两条口径**（比第三十八批的包含匹配更硬）：
① **词元改成下划线全等**——第三十六批已经抽查到 `play` 子串匹到 `player_achievements` 的假阳性，当时只把它登记成限定；
   这一轮直接改判法，"匹配"这一步不再需要人工记得（**能改成算法的限定不要留在注释里**）。
② **只有路径末段命中才算"该资源自身有承载"**，父段命中单独立一档（子资源无专属表）——
   否则 `characters/${id}/relations` 会顶着 `characters` 表的命中被误读成"关系已本地化"。
另加一条可达性信号：**调用者集合是否全部落在 `features/discover/` 下**，机器判桌面结构性无入口，不靠印象。
**两条机器指对了、结论仍需回代码核对**（这正是第三十八批那条限定的形状，本轮各拿到一个实例）：
① `projectApi.get` 落在"自身承载"档，但它的界面调用点只有 `DiscoverProjectDetailPage.tsx:33`，另一处 `httpStorageProvider.ts:153` 是实现侧（已排除）⇒ 桌面不可达；
② `getCharacterStates` 命中 `characters` 词元，但它是**一次试玩会话里的角色状态**，不是角色记录本身 ⇒ 词元全等也挡不住的语义假阳性。
（第三十六批那三处分类器缺陷——分派口漏认 `getStorageProvider`、符号归属只取每文件第一个 `xxxApi`、HTTP 实现文件被当界面绕过点——**不记在本批名下**，那一批已各自修好并抽查过。）
**顺手抓到自家工具的一处静默漏计**：调用点匹配用的 `useRe` 带着 `g` 标志，而同一个正则对象会对**多个文件反复 `.test()`**
——`test()` 命中后 `lastIndex` 跟着对象走，下一个文件就从那个偏移开始搜，**调用点若出现在更早的位置会被静默判成"没调用"**（分档随之错）。
最小复现（`node -e`）：`"y ".repeat(2500)+"api.get("` 与 `"api.get("` 两个串，带 `g` 时第二次 `test` 返回 **false**，去掉 `g` 返回 **true**。
今天这份语料**没踩到**（去掉 `g` 后全表与分档计数逐字节相同，`diff` 为空——这是实测，不是推断），所以这不是"读数是假的"，是**形状上留着一个人工无法预料的洞**；已去掉 `g`（这里只用 `test`，`g` 本来没有任何作用）。
末轮（08:31）：`cloud:callmap` **0**（六档 12 / 9 / 34 / 26 / 6 / 8 = 95；绕过三态 22 / 6 / 4 / 1 / 1 = 34；去 `g` 前后表全等）。

同日第四十批（**「绕过」的真实分母要按调用点减掉壳守卫，而不是按文件**，2026-10-09，产品代码一字未改）：
"没有分派口引用"不等于"桌面态真会打出去"——还有第三种本地化形状：调用点自己带壳守卫。
按**文件**算会把这面读成 34 条全安全，实测 `useRelations.ts` 五条查询里**只有 `presets` 一条**写了
`enabled: !isLocalOnlyDeployment()`，另外四条（list / graph / create / delete）没有 ⇒ 判据必须落到调用点。
三条可机械判的形状（各配实例）：**S1 同块**（守卫在这条调用所在的最内层 `{}`，`enabled:` 即此形状；
注意要查**整块**而不是"调用之前那一截"——`enabled` 常写在 `queryFn` 后面，第一版这样写时 S1=0），
**S2 同句**（`if (guard) { api.x() }` 的块头），**S3 早退**（祖先块里"直接子语句 + 含 `return`/`throw` + 整条语句在调用之前"，
`userApi.session` 与 `nexusApi.sendToInbox` 就是这一形状）。
**读数**：扫描面「绕过 + 混合」40 条 / 调用点 **53** 处 ⇒ 有守卫 **9**（S1=7 S2=0 S3=2）/ 无守卫 **44**；
端点级：全有守卫 **5** / 部分 **4** / 全无 **31**（相加 40）。**只看绕过**：5 条调用点全被挡开、0 条部分、**29 条真会打出去**。
⇒ S13-3 的候选清单从 34 缩到 **29**（另 5 条已在界面上显式降级，跟"判死"是两种东西）。
**两次变异证明这两条收紧不是装饰**：关掉 S1 ⇒ 有守卫 9→2（S1=0）；去掉 S3 的"直接子语句"深度限制 ⇒ 有守卫 9→**11**、
"全有守卫"5→7，`versionApi.get` / `rollback` 被错判成安全——**过度信任的方向才是危险方向**（少判守卫只会多列一条候选，多判守卫会把真缺陷藏起来）。
**合成样本兜住两条真实语料里没有的形状**：`if (guard) { api.x() }` 判 S2、`!guard && api.x()` 判 S1，
反向两条（块头没守卫、守卫写在隔壁函数里）都判 `null`；S2 在本面 0 命中，所以扫描面**特意扩到「混合」**——
一条永远拿不到样本的判据分支等于一条没验过的判据分支。
**顺带修掉两处自家口径分叉**：① 词元并排表还在用 substring 包含、而三态已改词元全等 ⇒ 现在两块共用同一个 `matchOf`；
② 可达性与守卫都改读全量 `hitFiles`（展示用的 `files` 截到 4 个，超过 4 个调用点时可达性会判反）。
**还有一次流程错误值得留档**：中途一次 `grep` 结果为空，我几乎把"脚本 `SyntaxError: suspect 已重复声明`"读成"没有命中"——
判据脚本非 0 或输出缺失时，**先看退出码和输出尾部，再谈读数**。
末轮（08:46）：`cloud:callmap` **0**（连跑两次输出相同）、`gates` **0**（14 道）、单测 **706 passed + 1 skipped**、`git diff --check` 0 行。

同日第四十一批（**死面 12 条补齐判死候选的两侧证据，并登记一条"既死又指错"的端点**，2026-10-09，产品代码一字未改）：
`cloud:callmap` 第九段把「死面」那一档从"界面调用点 0"升级成**读者 × 后端路由**两列并排：
读者口径 = `apps/` + `packages/` + `e2e/` + `scripts/` 共 **448** 个文件，匹配跑在**剥掉注释与字符串之后**的文本上，并排除 `shared/api` 自身（定义处不算读者）；
后端口径 = 解析 `backend/app` 的 **107 个 .py**，从 `APIRouter(prefix=…)` 与 `@x_router.<verb>("…")` 得到 **148** 条路由，
`${…}` 与 `{param}` 都当通配段、忽略 `/api/v1` 前缀与查询串（多行装饰器靠 `\s*` 吃到换行，实测接住了 `/{project_id}/nodes` 这类写在下一行的路径）。
**读数**：12 条的**前端读者全部为 0**；后端路由 **11 在 / 1 不在**。
**那一格"不在"是一条新登记的缺陷**（人工复核过，不是匹配器的假阳性）：
`PUT /editor/projects/${projectId}/nodes/${nodeId}` ← `projectApi.updateProjectNode` 指向一条**后端根本没有的路由**——
`backend/app/domains/narrative/router.py` 里对 node 的 PUT 只有带 scenes 段的 `/{project_id}/scenes/{scene_id}/nodes/{node_id}`，
DELETE 同理，没有"不带 scenes 段的 PUT"。它零读者 ⇒ 今天没有用户影响；摘不摘仍然归在待决 ②（不替自己拍这块板）。
**「测试 0」这一列的结构性前提也做成了机器事实**：调用过任何 `xxxApi.method(` 的测试/e2e 文件数 **= 0**，
所以那一列恒 0 是"**测试层完全不 import api 层**"这个事实，而不是判据坏了——这一条同时是给 ② 的信息：
**判死这批不会碰坏任何测试**（代价是反面的：api 层在测试层零覆盖，判错了也没有回归网）。
**正对照三条**（证明读者匹配器真的在跑，而不是恒零）：`characterApi.create` 读者 2 / `characterApi.update` 2 / `characterApi.listUser` 3；
"在"那一侧也手工验过三条：`/{project_id}/nodes`、`/{project_id}/edges`、`/{project_id}/roles` 的 POST 都确实存在。
脚本自带防退化：读者面或后端路由解析出 **0** 条 ⇒ 自己报 `UNRELIABLE` 并退出 1（这两列都是 0 时表毫无意义）。
**一次流程错误留档**：本轮加这段时，一次 `Edit` 漏传 `old_string`，把 `const root = process.cwd();` **整行吃掉**——
`node --check` 完全通过，跑起来才 `ReferenceError`。**改完脚本必须真跑一次**，语法检查接不住"声明被删"这类损坏。
末轮（08:52）：`cloud:callmap` **0**（连跑两次输出逐字节相同；`gates` 与引用对账见 §5 同批条目）。

同日第四十二批（**"桌面真会打出"要看宿主走不走得到，不只看守卫——并登记一条零消费者 barrel**，2026-10-09，产品代码一字未改）：
第十段把上一批剩下的"未守卫调用点"再问一层：**这个调用点所在的模块，桌面界面根本渲染得到吗**。
机制是一条 import 闭包：从 `App.tsx` 的路由表出发（`<Route path="…" element={<X/>}>` **也包括没有 path 的 `<Route index …>`**），
沿静态 import 与 `import("…")` 走到叶子模块；`@/` 按别名解析，后缀试 `.ts/.tsx/index.*`。
**遮蔽要做两份**（这是本轮第一个坑）：抽 import/路由要用**只遮注释、保留字符串**的文本，
因为 `import("@/…")` 的路径**就在字符串里**——第一版直接拿 `maskNonCode` 去抽，得到"`0` 条路由 / 44 处调用点全判走不到"，
靠段里那条非零守卫（`routeMods` 为 0 ⇒ `UNRELIABLE` 退出 1）才没被当成读数用。
**读数**：44 处未守卫调用点 ⇒ **宿主不早退（保守上界）21 / 不在任何路由闭包 12 / 只在桌面早退的宿主页里 9 / 叶子组件全仓无 `<它>` 渲染点 2**（21+12+9+2 = 44）；
**（复量 2026-10-09 第四十七批：这四个数作废。**不在任何路由闭包** 那一档归零、宿主不早退 21 → **27**、端点级"全走不到" **12 → 6**——
成因是普查自己的缺陷（`lazy\(\(\)` 那条严正则认不出 5 条跨行写法，把真路由页算成走不到），全文见 §4 同日第四十七批。历史文本按惯例不重写，只在这里挂这条批注。）
端点级：35 条有未守卫调用点的端点里，**12 条所有未守卫点桌面都走不到、23 条至少一处走得到**。
**判成"桌面早退"的路由页实测 3 个**：`dashboard`（CreatorDashboardPage）、`/discover`（DiscoverPage）、`/profile`（ProfilePage）——
我原以为是 4 个，读代码才知 `CreateCharacterPage.tsx:84` 那条写在 `handleAiSuggest` 里，不是页面级早退。
**本轮抓到四处判据缺陷，全部是"逐条把机器结论读回代码"抓出来的，不是从读数猜的**：
① 上面那份遮蔽口径；② `<Route index>` 没有 path ⇒ PlayerPage 整棵子树看不见（**漏的是可达那一侧＝把真可达判成走不到**，方向最坏）；
③ 叶子"死组件"最初拿**文件名**当组件名 ⇒ `UserContext.tsx` 被判成死 import（它默认渲染的名字是 `UserProvider`）；
收窄到"只看 PascalCase 的**默认导出**"后，另一条早先的版本还会把 `PLAYER_KEYS` 这种常量当组件；
④ `earlyReturn` 原来是一条宽松正则 ⇒ `PlayerPage.tsx:369` 里那句写在 `load` 回调（深度 1）的 `if (!isTauriEnvironment())` 被当成"整页早退"，
改成"必须是**组件体的直接子语句**且带 `return`/`throw`"（这是**过度信任的方向**，比漏判危险，所以优先修）。
**新登记一条（只登记不处置）**：`apps/web/src/shared/hooks/index.ts` 是**零消费者的 barrel**——全仓没有一处 `from "@/shared/hooks"`，
而它 `export * from './usePlayer'` 底下的 `usePlayer.ts` 正是那 **6 条 `/play/sessions*` 端点的唯一调用者** ⇒
**这 6 个试玩云端点在任何界面（不只桌面）都走不到**。这一条同时是 S13-3（判死候选）与 S13-6（后端 `/play/sessions` 那族在为谁服务）的输入。
**限度写在脚本头**：import 闭包 ≠ 渲染可达；**消费者级条件渲染不认**——实测 `AppHeader.tsx:69` 用
`{showSearch && !isLocalOnlyDeployment() && <GlobalSearch />}` 挡住了整块搜索，而 `GlobalSearch.tsx` 自己一行守卫都没有，
所以搜索那一族留在"保守上界"里没被摘掉；方向上是**宁可多列、不许藏缺陷**。
末轮（09:06）：`cloud:callmap` **0**（连跑两次逐字节相同）、`[file-size]` 0 越线（`scripts/` 不在它的面内）、其余见 §5 同批条目。

同日第四十三批（**死表面普查上线：10 个模块界面加载不到，含两个零消费者 barrel**，2026-10-09，产品代码一字未改）：
第十一段从**真入口 `main.tsx`** 走 import 闭包，把"界面加载不到的模块"从个案发现变成一张完整清单——
此前 `PromptExport`（#60）、`GlossaryEditor`（#58）、`usePlayer` 都是一次一次手工撞出来的，同一族问题值得一次数完。
**读数**（面 = `apps/web/src` 的 285 个 .ts/.tsx）：闭包内 **245** / 闭包外 **10**；
其中"只有测试在读"= **0**（机制读者也没有 ⇒ 删掉不会碰坏任何测试）；
10 个真死模块：`shared/api/index.ts`、`shared/hooks/index.ts`、`shared/hooks/usePlayer.ts`、`features/discover/components/DiscoverStatsBar.tsx`、
`features/studio/components/GlossaryEditor.tsx`、`shared/components/{BrandIconMark,ItemCard,ItemCreateDialog,RadarChart,SceneCreateDialog}.tsx`。
另有一档"在闭包内但除 import 语句外全仓零引用"= **2**：`PromptExport.tsx`、`shared/components/ui/DraftIndicator.tsx`——
这一档是**名字判据**（比闭包弱），所以只列名不判死。
**逐条读回代码验到的两件事**：
① `shared/components/ItemCard.tsx` 确实没人用，而 `ItemsPage.tsx:38` 有一个**同名的本地** `function ItemCard` 在渲染——
名字判据会被这种撞车骗过去，**闭包判据不会**（这正是两档要分开、且只信闭包的原因）。
② `DraftIndicator` 的全部外部痕迹只有一条 barrel 再导出（`ui/index.ts` 的 `export { default as DraftIndicator }`），
所以"import 语句里的名字不算引用"这条规则必须存在，否则每个 barrel 都会替它挡一下。
**这一轮把四处判据修到了正确方向，每一处都是"给活代码贴了死标签"那种最坏的错**：
`importRanges` 第一版从关键字往后贪吃 900 字符 ⇒ 把 `export default function App() {` 当成语句、
连下面 `App.tsx:95` 的 `<StudioLayout />` 一起抹掉，活布局被判零挂载（改成"整条 import 语句"的正则，不再靠长度）；
只查**默认导出**的名字 ⇒ `PublicLayout.tsx`（只被 `import { DiscoverLayout, AccountLayout }` 用过）被误判（改成看**全部导出**）；
`CharacterCard` / `StudioLayout` / `BondEditor`（注册表 `component: BondEditor`）、`FlowStudioView`（`const LazyX = lazy(...)` 改名）四种形状先后各错过一次；
把 `allPool` 留在块作用域里而模块级的 `lazyTargets` 先用它 ⇒ `ReferenceError: allPool before initialization`，
**`node --check` 一样过不了这种错吗？过不了的是运行期**——上一批刚写过"改完脚本必须真跑一次"，这次是靠这条教训才没停在语法绿上面。
**内置对照组**（写进脚本，不靠我记得）：`shared/hooks/index.ts` 与 `usePlayer.ts` 必须落在"真死"、
`ProjectListPage.tsx` 三档都不许出现；对照不成立 ⇒ 脚本自己报 `UNRELIABLE` 并退出 1。
**给 ② 的新事实**：`shared/api/index.ts` 也是零消费者 barrel——判死时"删掉 api 层的某个函数"不会牵连 barrel，但**两个 barrel 本身现在就是可摘的死表面**。
**留一条诚实的债**：`scripts/cloud-callmap.mjs` 到 **873** 行，而 `[file-size]` 的门面是 `apps/*/src` 与 `packages/*/src`，**不含 `scripts/`**（本轮实测确认，不是推测）。
我没有拆 `scripts/lib/` ——现在只有一个消费者，抽象是猜的；等第二个消费者出现再拆，届时按依赖方向切而不是"哪段最像一块"。
末轮（09:22）：`cloud:callmap` **0**（连跑两次逐字节相同）、`gates` **0**（14 道）、单测 **706 passed + 1 skipped**、`git diff --check` **0** 行。

同日第四十四批（**把死表面从清单升成第 15 道门禁，并顺手抓出一条 README 一直在说的假话**，2026-10-09，产品代码一字未改）：
清单不会挡住"今天又写了一个没人 import 的模块"，所以上一批那 10 个死模块值得有一道棘轮。
**接线三处同轮**：`package.json` 的 `check:dead-surface` + `gates` 链 **14 → 15 道** + `README.md` 门禁表补一行。
**等价性判据机械化**（重构工具本身也要能证明没改行为）：动手前先把 `cloud:callmap` 的输出存成金样，
改完逐字节 `diff` ⇒ **只有 1 行不同**：读者面 `448 → 449`——那是我刚新增的 `scripts/source-graph.mjs` 自己进了被扫的面，
属于口径的真实变化，不是判据坏了。
**公共域抽出来了**：模块图、两份遮蔽、目录遍历（含 `Clearance/` 禁入的跳过清单）全部搬进 `scripts/source-graph.mjs`，
`cloud-callmap.mjs` 与 `check-dead-surface.mjs` 共用同一个真相源（上一批留的那条债在这里还掉——第二个消费者出现了，抽象不再是猜的）；
`cloud-callmap.mjs` 从 **873 行降到 718 行**。
**这道门禁只用闭包档**（名字档只列名不判死的理由沿用上一批：`ItemCard` 的同名本地组件会骗过名字判据）。
被测试 import 的模块**不算死**（机制读者在册），`*.test.tsx?` 自身不进基线。
**三条腿逐条验过（退出码单独取，不靠管道）**：
① 该放——现状 OK，退出码 **0**，`闭包外 10 个模块全部在册（基线 10）；面 285 个文件、闭包内 245 个`；
② 该拦——临时放一个没人 import 的 `GateProbeDeadModule.tsx` ⇒ **FAIL 退出码 1** 并点名该文件，删掉后立刻回到 OK（`git status` 该目录干净）；
③ 缩短提示——往基线里塞一条已不存在的条目 ⇒ `OK …（基线 11）；已摘除 1 个 ⇒ 基线该缩短：… --update`（具名基线不缩短等于没关）；
④ 失效锁——从 `/tmp` 跑（没有 `apps/web/src`）⇒ `UNRELIABLE —— 面=0 个文件、闭包=0 个、入口存在=false` 且**退出码 1**，
   绝不让"图没建起来"伪装成"没有死模块"。
**两工具口径对账**：门禁的 10 条与普查第十一段的 10 条**集合完全相同**（按路径比对，命令算的）——
同一份图给出同一份答案，这才是共用真相源该有的证据。
**顺带抓到一条文档谎话**：README 的 `pnpm gates` 行写着"**共十一道**"，而链上其实是 15 道（citations/publish/seams 三道都漏在文字外面）。
这条不是笔误级的小事——门禁表是给接手的人看的当前状态，它数错了就等于替门禁说谎。
现在那一行的条数写明"**以 `package.json` 的 `gates` 脚本为准**"，并把 15 个步骤名从脚本原文抄出来（历史日志里那些"14 道"是当时的事实，不重写）。
**新出现的未跟踪文件三份**（提交时要显式 add，不许顺手 `git add -A`）：`scripts/source-graph.mjs`、`scripts/check-dead-surface.mjs`、`scripts/dead-surface-baseline.json`。
末轮（09:33）：读数见 §5 同批条目。

同日第四十五批（**消费者面的定义错了一类：把 api 层里的"分派层"整个排除掉，于是一条活路径被判成死面**，2026-10-09，产品代码一字未改）：
第九段与六档匹配都把 `apps/web/src/shared/api/` **整目录**排除在消费者之外，理由是"定义处不算读者"。
但那一层里住着一个真正的分派口：`shared/api/draftDispatch.ts`——`:38` 是 `isLocal: isTauriEnvironment`、`:40` 走本地模型、
`:49` 是规则保底、`:45` 的 `remote:` 才调 `aiApi.proseToScript`。按老口径，这条端点被报成**「死面・前端读者 0」**，
而它实际是"桌面走本地、云端只是 fallback"那条**已经本地化完**的通路。
**修法**：消费者只排三类真正不算读者的——定义该符号的文件自身、传输层 `client.ts`、再导出 barrel `index.ts`；
并把 `draftDispatch.ts` 补进 `DISPATCH_FILE_RE`（它按 `shared/storage/<域>Saves.ts` 的命名约定本来就不会被认成分派口文件）。
**读数怎么变的（逐条命令重算，不心算）**：六档 `12 / 9 / 34 / 26 / 6 / 8` ⇒ **`11 / 9 / 34 / 27 / 6 / 8`**（相加仍 = 95）；
消费者扫描 234 → **253** 个文件、读者面 450 → **471**；被移走的那一条正是 `POST /editor/ai/prose-to-script`，
现在它带 `界面调用点 1  分派口: apps/web/src/shared/api/draftDispatch.ts`。
**没变的那些同样要报**：绕过 **34** 不变 ⇒ 上一批的"桌面真会打出 **29** 条"不受影响；守卫面 40 条读数一字不变（全有守卫 5 / 部分 4 / 全无 31）；
死面剩下的 **11** 条前端读者**仍然全部为 0**、后端路由 **10 在 / 1 不在**（新登记的那条 `projectApi.updateProjectNode` 指错端点不受本次修正影响）；
`check:dead-surface` 基线仍是 10 个模块。**正对照现在的第一个就是 `proseToScript`（读者=1）**——修正本身被摆在对照位上，下次再退化会立刻红。
**顺带量出一道门禁面缺口（登记，不悄悄扩）**：`check:dispatch` 遍历的是 `apps/web/src/shared/storage/`，
判据按命名约定 `<域>Saves.ts` + `assetPool*` + `achievementDefs` 一条已知偏差；
`shared/api/draftDispatch.ts` 同样在做本地/云端分派（还是四支：本地壳判定、本地模型、规则保底、remote），**却整个不在那道门禁的面里**。
它不是零判据——同目录有 `draftDispatch.test.ts`——但"每个导出函数都有本地支"这条判据今天挡不到它。
我没有顺手把它塞进门禁：**扩面前要先量这条判据套在它身上会不会误报**（它的导出形状是 `draftDeps` 对象 + 两个 async 入口，
和 `*Saves` 那族"一个函数一条本地支"不同形），这一步留作下一刀，不混在本批。
**同批更正**：§4 第四十一批写的「死面 12 条 / 后端路由 11 在 1 不在」与 §6 ② 里同一组数，是**旧口径下的真实读数**，保留不重写；
本节起以 **11 条 / 10 在 1 不在** 为准。
**同批扫了一遍 README 的"当前状态数字"**（上一批修掉"共十一道"之后，同类问题不会只出现一次）：门禁自己会打印读数，README 抄了一遍就会腐烂——
本轮改了三处：`check:citations` 写"判定 161 条 / 基线 3 条"而门禁打印 **216 / 5**；`check:labels` 写"204 个 tsx"而门禁自报 **205**；
`check:seams` 写"真断言合计 94"而现在门禁打印 **99**。三处一律改成"引门禁自报的数 + 取数日期"，
**规则**：文档里凡是"门禁自己会打印的数"都写成引用而不是抄录——抄录的那一刻起它就开始腐烂，而腐烂的当前状态比没有状态更坏。
末轮（09:43）：`cloud:callmap` **0**、`check:dead-surface` **0**（基线 10 不变），其余见 §5。

同日第四十六批（**把上一批登记的 `check:dispatch` 面缺口关掉——先量误报再扩面**，2026-10-09，产品代码一字未改）：
上一批只登记不动手，理由是"这条判据套在异形分派上会不会误报"没量过。这一批量了：
把门禁原样指向 `shared/api/draftDispatch.ts`（只改探针副本的 dir/文件名，产品代码一行未动）⇒ **两条导出 async 函数全部被误报成"没有本地分支"**
（`requestDraft` / `requestAxsDraft`；形状都是 `positive-block`，判据要的是"本地那一支调 provider"，而这一族走的是 `await draftDeps.model(...)` 与 `rulesDraft(...)` 保底）。
**所以扩面和放宽证据必须同一次做**，否则门禁一上去就是红的，下一次有人图省事就会把它摘掉。
**证据形状改成三条**：真 `await provider` / `await 注入的本地能力(...)`（即 `await \w*[Dd]eps\.(?!remote\b)\w+(`）/ 退回规则保底。
**`remote` 被显式排除**——本地窗口里出现云端调用不是证据，这条是整个判据最容易被糊弄的口子。
**读数**：`扫描 5 个分派口文件 / 30 个函数 / after-guard=26、positive-block=4` ⇒ **`6 个文件（storage 5 + api 1）/ 32 个函数 / after-guard=26、positive-block=6`**；
**旧面那 30 条一条形状都没变**（放宽只增"可接受"集合，不减既有判红），这是扩面不带回归的证据。
**牙齿两条，都是造一棵假目录树再 `cd` 进去跑，产品代码零改动**：
① 把副本里的本地支改成只 `await draftDeps.remote(` 并把 `rulesDraft(` 改名 ⇒ **FAIL 退出码 1**，逐条点名两个函数（证明"放宽"没放宽到放过假本地支）；
② 把面二那个文件删掉（模拟改名/移走）⇒ **FAIL 退出码 1**：`面二…命中 0 个文件：它被移动或改名了，这张面正在静默消失`
——**门禁的面只能显式缩短，不能悄悄缩回一半**（这条控制位是新加的，上一批 README 那条"抄数腐烂"属于同一族：无声的变化最贵）。
探针目录与副本已全部删掉（`/tmp/dprobe`、`/tmp/gate-probe.mjs`），`git status` 复核：产品代码零改动（`git diff --stat apps/web/src/shared/api/draftDispatch.ts` 空），
本轮只动 `scripts/check-dispatch-local.mjs` 与文档；**没有新文件**，所以 §6 的显式 add 清单不变（`??` 仍 **41** 项，09:47 与 09:51 两次相同）。
末轮（09:51）：读数见 §5。

工作区里还存在**本任务之前的用户改动**：`backend/app/domains/llm/providers/__init__.py`、`backend/uv.lock`，以及未纳管的 `Clearance/`。它们不是本重构的一部分，禁止覆盖、清理、暂存或读取 `Clearance/` 内的 `.env`。

同日第三十一批（**一次独立复审，107 个改动文件里抓到 6 处「判据够不着它声称守的契约」**，仍未提交）：
起手假设是"上一轮留下的东西大体可信"，结论不成立。共同形状不是漏写，是**够不着**——三处在产品代码、三处在门禁。
明细逐条在 `REFACTOR_DESKTOP.md`「补记（2026-10-01，复审）」，这里只留一句索引：
① `importProjectFromAxsp` 的 `saveAsset` / `saveCharacter` 两个出口**根本没有回滚**（`rollback` 那时还没定义），
`createProject` 失败会留下整组孤儿角色 ⇒ 修法是把它提到最前，判据从 7 个出口补到 9 个并加一条"枚举与调用点数对账"；
② `translatePlaceholders` 的守卫靠正则猜引号边界，看不见标识符与注释里的 `?`，
而头部原写"错位后照样能执行成功、只是绑错值"**被真实 sqlite3 解析器否掉**（实测是 `Incorrect number of bindings`，响亮失败）
⇒ 改成结构上只重写代码区，fail-closed 挪到"引号/注释没闭合"这个可判的形状上；
③ `index.test.ts` 两条"根目录被清空"是**恒真断言**（初值本来就是 null）⇒ 先塞脏值再进工厂；
④ `check-doc-citations` 的「文件不存在」整档被 basename 掩护关着（实测中着 1 条真错路径），
连同 `suffixHits` 吃 `everyFile`（已判定数虚低 28 条）与 `SKIP_DIR` 两种输入形状两处一起修 ⇒ **已判定 168 → 197**；
⑤ `check:seams` 第 2 层被 `import type` 与注释掉的 import 绕过（正是它声称关掉的洞）、第 3 层的 `assert.ok(true)` 算成真断言；
⑥ `check:apibase` 的「基址定义」档宽到"client.ts 里任何提到 apiBase 的行都豁免"。
**这一轮否掉两条读起来很像真的缺陷**（否则会写成假账）：「守卫误伤合法 SQL」在穷举语料里 0 例复现；
反例 `'x'', '?'` 本身是 SQLite 语法错误。**待决清单没有因为这一轮变短**。

同日第三十二批（**把同一轮审计里剩下两条发现也收掉**，仍未提交）：上一批只修了三道门禁，
漏了同一次审计里**已经指出**的另外两道——"审计出来的缺陷只修一半"这件事本身比那两道缺陷更难解释，所以补上。
- **`check:dispatch`**：`registeredSkip` 原是整窗口的 `seg.includes("skipped-offline")`，
  注释里写一句那个串就能买通行证 ⇒ 收成只认剥掉注释后的代码（与 purity / seams 同一口径，
  到这里四道门禁终于共用一个"代码 vs 散文"定义）。分母：`playerSaves.ts` 两处真用法都在代码里 ⇒ 零误伤。
- **`check:labels` 四种写法全被放过**（都实测过，其中一条把旧逻辑装回去验过确实放过）：
  标签自己的 id 接住自己的 `htmlFor`（收紧到"目标 id 必须挂在**可标注元素**上"，分母是全仓 11 处 htmlFor 全部合规 ⇒ 零误伤）／
  id 只写在注释里也算接住／`<label htmlFor>` 没给取值被 `if (target && …)` 短路掉／
  `aria-labelledby` 用子串比（`"group-header-2".includes("g")` 为真）。
- **否掉一条**：审计里写"收紧后的正向档能被空块骗过"，**实测不成立**——空块 / `return null` / 块内只有 TODO 注释，三种都照红。
  不成立的读数也记下来，否则下一个人会去"修"一个不存在的洞。**审计报告本身是待验证的材料，不是结论。**
读数不变：205 文件裸标签 0、dispatch 30 个函数形状 `after-guard=26 / positive-block=4`、`gates` **0**。

同日第三十三批（**审 `packages/axs`，抓到一个静默缺陷并修掉；顺出一个既有缺陷登记为待决 ⑭**，仍未提交）：
起手是复审时注意到但没追的一条——`assignBeatIds` 的计数器按**原始标题**记，而 id 是拿 **slug** 拼的。
- **实测**：`# Hello World` 与 `# hello-world` 是两个**不同标题**却共用同一个 slug ⇒ 都拿到 n=0 ⇒ **id 相同**；
  `parseAxs` 零诊断，下游 `parseAxsToPlan` 里 `beatIdToNodeId` 按 beat.id 建键、后者盖掉前者，
  于是一段本该「A 顺序走到 B」的邻接边**退化成自环**（读数 `gen-2 → gen-2`，`id: "hello-world-hello-world"`）。
  节点 id 本身是对的（`gen-1`/`gen-2`，`usedNodeIds` 守卫有效），**只有边坏了**——
  这也说明为什么第一轮读数里"节点没重复"差点把人骗过去。
- **与已登记的 #69 是同一族但维度不同**：那条是**同名**塌成一个节点（按标题去重是对的），
  这一格是**不同标题、相同 slug**。
- **修法一行**：计数器改按 slug 记。已承认的同名规则逐字不变（两个「开场」仍是 `开场` / `开场-2`），
  往返 `parse(print(beats)) ≡ beats` 保住。判据 4 条（id 不同且无自环 / 三个同 base 的编号 / 同名族回归护栏 / 往返不变），
  牙：退回修改前形状 ⇒ **恰好 3 红**，而回归护栏两边都绿。`axs` 90 → **94**。
- **取数两次取错，都记下来**：① 第一次分母把 Python docstring 的 `# ===` 下划线当成 AXS 标题（645 文件里 18 处"撞车"全是假的），
  改成只量 `docs` 的 axs 围栏 + `testdata/axs-draft` + 测试内联模板串（33 段 / 34 条标题）；
  ② `.axsp` 那三份第一轮只报了"未解包"——按今天已犯过一次的教训改用 `unzip -p` 结构化读，
  结果是三份的 `axsSource` **都是空串**（叙事在 `nodes` 里），侧分母 0。
  最终分母 **0 处真撞车** ⇒ 加 warning 零误报，但**没加**（理由见下）。
- **顺出的既有缺陷（不是本轮引入，修改前后一样红）**：`标题-N` 不是保留命名空间——
  `# 开场` / `# 开场` / `# 开场-2` 实测得到 `开场` / `开场-2` / `开场-2`，重复 id + 自环 + 零诊断。
  不能在实现里顺手修（`titleToId` 是「原始标题先、id 后」，字面标题占住 `开场-2` 之后自动生成的引用会解析错拍），
  要关掉它必须改**消歧方案本身** = ADR-016 的语法冻结面 ⇒ **登记为待决 ⑭**，不自行动手。
- **一条自己写错的判据**：第四版断言我按"作者写 `-> slug` 是想指向第一拍"来写，红了。
  探针显示往返完全正确，而那个前提是我编的（引用按字面标题归属，且**修改前就是这样**）。
  按"改断言不删断言"改写成真正的契约（往返不变式），把编出来的前提留在注释里当限度。

同日第三十四批（**审 `packages/editor-core`：22 条线索里自证 5 条、修 5 条，其余 17 条分层登记**，仍未提交）：
两个只读审计给了 22 条线索。按前几轮的经验（`check:dispatch` 那次 5 条里 3 条不成立），**审计报告本身是待验证材料**，
所以逐条自己跑探针，只把自证的当缺陷修。
- **① `journalUndo` 让"任何 redo 之后的 undo"变成静默空操作**：`redo` 把 future 栈顶那条**原样**提升进 past，
  所以 undo 写 future 时就必须已经写成一条合法 past 条目（`before` = `last.before`，不是 `current`）。
  实测 `apply → undo → redo → undo` 的第二次 undo 返回 `rev=1`、与撤销前完全相同，**却报 `ok:true`**，UI 会弹「已撤销」。
  顺带修好该文件自己声明的 `rev = before.rev` 不变量。既有那条判据只断言 redo 之后的 draft 与栈长度、**没有再 undo 一次**，所以一直绿。
  牙：旧形状 ⇒ **恰好 1 红**。
- **② `collectAssetRefs` 漏掉 `meta.coverImage`**：ref 进了 `project.json`、导入时原样写回，但**字节从没进过包**
  ⇒ 收件机封面空白、`ok:true` 走完全程。与本模块那条不变量正好是镜像：**ref 已声明、字节没跟**。
  牙：撤掉那一行 ⇒ 1 红——**且第一次变异没落进去、跑绿了**（今天第 4 次；改成先 `grep` 确认落点再跑）。
- **③ `removeRole` 对不存在的 role 谎报成功，而本地两端都与后端相反**：实测
  `后端 router.py:298 → 404` / `HTTP provider → not_found` / `Memory → ok:true` / `SQLite → ok:true`。
  权威是后端，同文件另两个 `remove*` 也都报 `not_found`——**只有它��异类**。吞掉的代价：`CutWorkspace` 弹「已移除角色」而什么都没删。
  两端同修 + 判据进**契约套件**（同跑 Memory 与 SQLite）。牙：两端各装回旧形状 ⇒ 各 1 红、点名同一条用例。
- **④ `saveNarrative` 在 Memory 端静默吞掉重复 node id，与 SQLite 语义相反**：Memory 返回 `ok:true`、读回只剩**后者**
  （送 2 个 `id="dup"` ⇒ 读回 1 个）；SQLite 因主键 `io` + 整体回滚（读回仍 2 个）。
  ⇒ 桌面测试宿主悄悄丢节点、真桌面报 io。选对齐 SQLite（铁律 8），判据只断言 `code === "io"`
  ——**语义必须一致、detail 文本不必**。
- **⑤ 画布投影按 13 键白名单重建 `narrative_data`，静默丢字段**：`choices`（`buildScriptFromLegacy` 的唯一输入）、
  白名单外的任何键（类型带 `[key: string]: unknown`）、`editor_data` 里除 `position` 外的键，画布碰过就全消失。
  生产链实测 `openWriterAtSelection`（"在 Writer 中打开"）→ `projectAxsFromCanvas` → `setAxsSource`，
  **Writer 面板当场拿到丢过字段的文本**，保存即落盘。**责任用对照组钉死**：同一节点走 `draftToAxs` 直连两个选项都在，
  走画布两个都不在 ⇒ 丢失在画布这层，不在 `buildScriptFromLegacy`。改法＝以 base 持久态为底 + 覆盖已知键。
  牙：旧形状 ⇒ **恰好 1 红**，红的内容就是症状本身。
- **17 条未复核的线索**按"是什么会 settle 它"逐条登记在 `REFACTOR_DESKTOP.md` 第六节（含 `deleteProject` 不级联、
  `saveAsset` 的 ref 含扩展名与契约矛盾、`visibility` 的 `authorId: ""`、`unpackAxsp` 抛 `TypeError`、`remapCharacterIds`
  漏 `relationship` 三段 key 与 `actors` 等）。**不作为结论引用**，也不和上面五条混在同一层待办里——
  否则真正会咬人的那几条会被淹没。

同日第三十五批（**从那 17 条里再自证 3 条、否掉 1 条**，仍未提交）：
- **⑥ `remapCharacterIds` 漏两处角色引用——跨机导入后指向不存在的角色**：
  ① `key` 只重映射**第一个**点号分段，而 `relationship` 的键是**三段**的 `charA.charB.field`
  （条件侧与效果侧都按 `split(".")` 取 `[charA, charB, field]`）⇒ `charB` 保留**导出方机器上**的 id，
  那条关系从此读写不到。实测 `char-1.char-2.trust` → `NEW1.char-2.trust`。
  ② `actors` 是编译器里优先级最高的 `explicit` 覆盖值（作者可写的角色 id 列表），
  与**已被正确重映射的 `codexScope` 完全同类**，却没有分支。实测原样穿过。
  对照组就是 `codexScope`——三条读数一起看才看得出漏的是哪两格。改法＝`keyOf` 逐分段查表。
  牙：装回首段 ⇒ **2 红**（新用例 + 命名空间护栏一起红）；去掉 `actors` 分支 ⇒ **1 红**。
- **⑦ 结构不合的 `.axsp` 包抛 `TypeError` 而不是返回 `corrupted`**：`storage/types.ts` 的**第一条**设计裁决就是
  「禁止异常穿越内核边界」，而 `readJson` 只保证「能 parse」。实测 6 个畸形形状里 **4 个抛异常**
  （`assets` 缺席/`null`/数字、`project.json` 是 `null`）。可达性不是理论的：`importProjectFromAxsp` 没有 try，
  所以别的机器上截断或被改过的包在导入路上是**未捕获的 promise 拒绝**，而调用方只会 `alert` 一句看不懂的话。
  顺带修掉一个误导：`assets` 是字符串时 `for…of` **逐字符迭代**，报「清单缺素材 a」。
  牙：撤掉三处形状校验 ⇒ **1 红**。
- **⑧ 越界守卫作废了三族「内核不判断」的引用**：`..` 守卫原先在归属判定**之前**无条件生效，
  而下一行明说 `/uploads/…`、`http(s)://`、`data:`、历史裸路径「WebView 自行解析，内核不做判断」。
  代价**比「显示坏图」更大**——`httpStorageProvider.readAsset` 要求 `kind === "direct"` 才读，
  所以带双点的后端上传路径（`a..b.png` 在磁盘上完全合法）在浏览器态**既显示成缺图、又读不回字节**。
  守卫强度不变（本地 ref 的 `..` 照拦）。顺带量了一句：我们自己生成的 ref 是 `sha256+扩展名`、**永不含 `..`**，
  所以这道守卫实际只对**外来 ref** 点火，而那正是它此前误伤的那一族。牙：装回无条件 ⇒ **1 红**。
- **否掉 1 条**：`deleteProject` 不级联（审计称两端分歧）。实测**两端一致**（删工程后两端存档都还是 1 条）。
  这条不成立，大概是只读了 schema 声明没真跑（SQLite 外键要 `PRAGMA foreign_keys=ON` 才生效）。
  **本轮第 3 条被否掉的审计结论**——「reports 是材料」这条纪律的回报率就在这里。
- 线索表已扣掉这 5 条已处理项，**剩 13 条**；下一个优先看的是 `addProjectScene` 的 `sortOrder` 两端不一致
  （`.axsp` 导入会丢作者排好的舞台顺序）与 `saveCharacter` 不兜底 authorId（角色落进「谁的都不是」）。

同日第三十六批（**舞台排序号 + 一条降级为待决 ⑮**，仍未提交）：
- **⑨ `addProjectScene` 的 `sortOrder` 两端各行其是**：`ProjectSceneInput` **声明了** `sortOrder`，
  而 SQLite 硬编码 `COUNT(*)` 把它**整个忽略** ⇒ 这是**生产路径**上的契约违反
  （`.axsp` 导入 `axspImport.ts:126` 显式传的就是它）；Memory 则原样存调用方的值。
  实测**不传时**（两个 live 调用方都走这一支）：Memory `[[甲,null],[乙,null],[丙,null]]` / SQLite `[[甲,0],[乙,1],[丙,2]]`；
  **传 10/20 时**：Memory `10/20` / SQLite `0/1`。
  规则收成一条并写进**契约套件**（同跑两端）：**给了就照给，没给才算下一个**；`null` 与 `undefined` 同义
  （随包三份 `.axsp` 的 `sortOrder` 全是 `null`——运行时不满足那个可选数字的声明，两者都必须走"算下一个"，
  这也是本条改动零影响的原因）。牙：**同一条契约用例**在两端各自装回旧形状 ⇒ 各 1 红、各点各自那一半。
  **顺带记一条限度**：Memory **不是生产路径**（只有 DEV 的 `?storage=memory`），
  所以这半个分叉本身不用户可见——它的危害是**契约套件跑的就是 Memory**，
  于是一个"测试宿主顺序不同、对桌面又绿"的偏差会长期隐身。
- **降级为待决 ⑮**：`saveCharacter` 不像两个兄弟那样兜底 authorId。实测**两端一致**（不是分歧），
  且今天**不可触发**（唯一活路径本来就传对了）。已修的只是 hook 那一行：
  `data.author_id ?? ''` 把"没给作者"折成 `""`——那是**第三种东西**（既不是 null 也不是真作者），
  可见性判定两边都不匹配 ⇒ 角色存进去却在**所有列表**里查不到，只有 `getCharacter(id)` 拿得到。
  改成 `?? getCreatorId()`（零风险）。核心里补兜底要动两个后端的构造参数，
  而"没有作者的角色归谁"本身是设计问题 ⇒ 不自行决定。
- 线索表剩 **12 条**。

同日第三十七批（**一条修、一条有理由地否掉**，仍未提交）：
- **⑩ 同一工程内成就 `key` 必须唯一**（`memoryPools.ts` + `contractPools.ts`）：SQLite 的 schema 有
  `UNIQUE (project_id, akey)` ⇒ 第二次写 `io`；Memory 只按 id upsert ⇒ 两次都 `ok`、读回**两条同 key**。
  后果不是"多一行"——成就面板按列表渲染（用户看见重复项），而 `unlockAchievement` 按 **key** 解
  ⇒ 另一条永远点不亮，是一条谁都够不着的死行。权威是 SQLite（`backend.ts` 那张表是桌面生产路径真在用的）。
  同时钉住另一半：**同 id 仍是更新**、不算冲突——否则会把 `updateAchievement`（先取回再合并补丁、key 不变）一起堵死。
  分母：面板用 `ach_${Date.now().toString(36)}` 生成 key ⇒ **活路径不产生重复**（同一毫秒连点才可能），
  所以这条是**潜在**的，值在把口径钉进契约、让下一个后端不必再猜。牙：Memory 装回旧形状 ⇒ **1 红**。
- **否掉第 2 条（有理由的否掉）**：`manifest.characters` 从不与 `characters.json` 对账。
  量到的关键事实是**这个字段没有任何消费者**——v2 解包真正读的是 `characters.json`，
  生产代码里唯一读 `.manifest` 的地方是 `unpackAxspV1` 读 v1 信封。
  而 `manifest.assets` 之所以要强制"声明的素材必须在包里"，正是因为 `unpackAxsp` **自己**按它决定加载哪些条目
  ——**清单在那里是承重的**。所以这条不是"漏了一条不变量"，而是「**承重处才强制**」的正确形状：
  在没人读的字段上加拒绝，只会让书写松散的外部包导不进来（而 `.axsp` 的定位就是跨机交换）。
  **不修也不登记为缺陷**，但把判据写进文档，好让下一次有人提这条时能直接引用。
- 线索表剩 **11 条**；下一个优先看 `listItems`/`listScenes` 排序两端不一致
  （Memory 插入序、SQLite `updated_at DESC` ⇒ 道具/场景列表在测试宿主与桌面上顺序不同，而两边都绿）。

同日第三十八批（**列表顺序两端不一致——与舞台 `sortOrder` 同形的第三处**，仍未提交）：
- **⑪ `listItems` / `listScenes` 两端顺序不同**（`memoryPools.ts` + `contractPools.ts`）：
  SQLite 两侧都是 `ORDER BY updated_at DESC`，Memory 原样给插入序。
  实测「存 A、存 B、再改 B」：Memory `["A","B改"]` / SQLite `["B改","A"]`。
  权威是 SQLite，而**意图在本仓库里早已定了**——`memory.ts::listProjects` 早就特意写了同样的排序去对齐 SQLite，
  `types.ts` 里也有"两端同一操作产生不同行数，桌面用户会比网页用户少看到重复项却没人解释为什么"那条裁决。
  所以这不是新产品决定，是**同一意图漏了两处**。
  危害形态值得单记：**`e2e:desktop` 跑的正是 `?storage=memory` 宿主**
  ⇒ 凡是断言道具/场景列表顺序的 e2e，都在断言一个桌面不会给的顺序，而两边都绿。
  牙：`listItems` 装回插入序 ⇒ 1 红；`listScenes` 装回插入序 ⇒ 1 红（SQLite 侧两次都保持绿——它是对的那一侧）。
- **写判据时被自己抓到一次**（"判据本身在断言一个并列"）：第一版直接连存两次再断言 `[B, A]`，
  结果**两端都给 `[A, B]`**。原因是两个后端的 `saveItem` 都在存的时刻自己盖 `updatedAt = nowIso()`，
  **调用方给的值根本进不去**；而毫秒级时间戳 ⇒ 连续两次存几乎必然同毫秒 ⇒ 量到的其实是并列
  （Memory 靠稳定排序退回插入序，SQLite 对并列行序未定义，实测也都是插入序）。
  **那样子这条用例是绿的，却什么都没证明。** 改成两次存之间 `await tick()`（3ms），
  并把"为什么必须等"写进注释。
  **教训只与写法有关**：凡是被实现盖掉的时间戳驱动的顺序，判据里都必须显式让时间前进，否则测的是并列。
- 线索表剩 **10 条**；下一个优先看 `saveAsset` 的 ref 含扩展名
  （同字节 + 不同后缀给两个 ref，与 `types.ts:180` 的「同字节→同 ref」矛盾——
  **这条可能该改的是那句契约而不是代码**，所以要先问口径）。

同日第三十九批（**一条改契约、不改代码——本轮最值钱的形状**，仍未提交）：
- **⑫ `saveAsset` 的 ref 含扩展名：结论是「那句契约不精确」，不是「实现有缺陷」**
  实测确认：同一份字节换后缀给两个 ref（`…<key>.png` / `…<key>.jpg`），同名同后缀给同一个 ref。
  但本地那侧 ref 就是**落盘文件名**（`assets/<摘要>.<扩展名>`）——去掉后缀文件就没有类型，
  `readAsset` / `resolveAssetUrl` 都要靠它选解码路径 ⇒ **扩展名必须在身份里**。
  于是改的是那两句契约（`types.ts` 与 `assets.ts` 各一份），把形状改准为
  「**同一内容 + 同一后缀 → 同一 ref**」，并把推导写在实现旁。**产品代码一行未动。**
  **两条用户承诺确实不受影响**（逐条推过、不是推断）：① 「同一张图重复导入只会存一份」——
  重复导入意味着同一个文件名、因而同一个后缀，而"字节相同但后缀不同"对真实格式几乎不可达；
  ② 「工程包在别的电脑上打开时能认得同一个文件」——ref 随包走、接收方按 ref 解析、**不重算摘要**。
  判据钉的是"精确后的不变量"：**同一内容换后缀 ⇒ 两个不同 ref，且两个都读得回同一份字节**
  （只断言前半截的话两种实现都能过）。
  牙：把 `assetRefFor` 改成"只按字节、不带后缀"（也就是照旧措辞"修"代码）⇒ **4 红**——
  新契约用例在两端各 1，外加**两条既有测试独立钉住 ref 形态**。
  **不精确的源码注释本身就是「将来会被照着改错」的种子**；判据钉住精确形状之后，
  那次"改错"会被 4 条而不是 1 条拦住。
- 线索表剩 **9 条**；下一个优先看 `normalizeBundle` 把**类型错误**的 `assetRefs` 归一成 `[]`
  （那是"损坏"而不是"旧版本没这个键"，两者被同一条规则接住 ⇒ 道具引用消失且零信号）。

同日第四十批（**一条修、四条否掉——线索表的尾巴基本是噪声**，仍未提交）：
- **⑬ `redo` 丢弃 `ApplyError`**（`journal.ts` + `document.test.ts`）：原失败分支是裸 `{ ok: false }`，
  按本仓库「空值五义」那套约定改成**可选 `error`**——缺席 = 没有可撤销/重做的内容（**不是失败**，
  不该被当错误呈现）；在场 = 那条事务真的失败了，带回自己的 `ApplyError`。
  加字段是**加法**（旧调用方 `if (!r.ok)` 照旧工作），不改语义。
  为什么值得改：`redo` 上方那句「I5 确定性保证结果一致」指的正是这件事，
  而**确定性只能靠"失败时为什么失败"才谈得上**——把原因吞掉那句话就是空的。
  分母：`redo` 目前**零生产调用方**（全仓只有 `journal.ts` 自己与测试）⇒ 这是导出 API 的修复而非线上缺陷；
  但它是公开面，而公开面没有判据就等于没有契约。牙：把 `error` 吞回去 ⇒ **1 红**。
- **否掉第 4 条（线索陈旧）**：`normalizeBundle` 把类型错误的 `assetRefs` 归一成 `[]`。
  实测**代码已经精确区分**：键缺失（旧版本）⇒ `ok` + `[]`；键在但不是数组 ⇒ `corrupted`，
  消息就是「键缺失才是旧版本；键在而形状错是坏输入」。三种错误类型逐个试过，全是 `corrupted`。
  这条描述的是**修之前**的状态，而那条区分与它的判据早就在树里。
- **否掉第 5 条（不是缺陷，是既定表示）**：`draftToAxs` 对空工程返回硬编码的 `# 开始`。
  实测该占位串在 **5 处**出现并被 `projection.test.ts:43` **刻意钉住**，而它就是**新建工程的 bootstrap 种子**
  （`sqlite/sqliteProject.ts:112` / `memorySeed.ts:22`）⇒ "空工程存成一个开场拍"是与种子一致的既定表示。
  而且**不静默**：删除后保存会经 `axs.import` 真的建出那一拍，用户在画布上看得见。**不改。**
- **两条按"潜在 + 要先定口径"挂着**：`unpackAxsp` 只按清单取素材（**这是对的**——清单在那一半承重，
  宽容正好让书写松散的外部包能导进来）；`unpackAxspV1` 把 `manifest.assets` 抄进清单却返回空素材表
  （既有测试**钉住**了它，要读那测试的意图才动）。
- **一条累计结论**（值得单独记，因为它改变下一步的做法）：22 条线索走到这里，
  累计**自证并修 9 条、否掉 5 条**，否掉比例这么高本身就是结论——
  **一份对着大模块逐函数铺开的审计清单，尾巴基本是噪声**。
  真正会咬人的 9 条全都落在两类：**同一形状在两处不一致**、**契约与实现不符**；
  而"看起来不太对"的那些（命名不统一、少一个兜底、类型宽松）实测下来要么已修、要么是既定表示、要么不可达。
  剩下 4 条的预期收益**已经低于把它们写清楚的收益**。

同日第四十一批（**审最大的一处双实现：结论是实测为健康**；**补上一个零覆盖的孪生实现**，仍未提交）：
- **审 TS 编译器 ↔ Python 编译器（438 / 451 行，同一个 `project → StoryPackage`）**：
  `__golden__/` 有 **4 份**金样本（由 `backend/scripts/dump_golden.py` 从真实 DB dump），
  `compiler.test.ts` 逐字段比对 ⇒ 这是一条**跨实现契约的枢轴**，**双向都会红**。
  我做了一次**免 DB 的差分**（把 `input.json` 直接喂给 Python 的 `_build_script` / `_extract_actors` /
  `_pick_start_beat` / `_build_glossary`，与 `expected.json` 比）⇒ **四项全部零差异**，两侧今天是对齐的。
  量到两个真实盲区（已写进 `compiler.test.ts` 头注释）：**金样本只被 TS 一侧消费**（它是枢轴，
  所以两侧都红，但**没有独立于枢轴的第三方校验**）；**语料对 `glossary` 的覆盖只有 1/4**
  （4 份里 3 份 glossary 是 0 条，补语料要重跑 dump、需要 DB）。
  **不为它写新判据**：Python 的 `compile()` 需要 DB，一份"也读这批金样本"的测试要么依赖 DB
  （等于手工重跑一次 dump）、要么靠桩 ORM 属性（会与 ORM 悄悄漂移）。
  在 Python 已有 **8 条**真集成测试而差分又确认对齐的前提下，**维护成本高于它挡住的漂移** ⇒ 主动排除。
  **探针错了两次**（今天第三、四次）：序列化了 `exclude_none=True` 而 `expected.json` **保留 null 键**
  ⇒ 一度报出 **24 条"差异"全是假的**。**"差异条数"会被探针的序列化方式放大——先信格式、再信数字。**
- **补上一个零覆盖的孪生实现：Python 侧条件求值**。缺口是量出来的：TS `compare` 有 **37** 条判据，
  而孪生体 `PlayerService._compare`（被三个 `_match_*` 分支调用）**此前一条都没有**——
  上一轮修 `>=`/`<=` 时它只靠「`.venv` 直调取数」验过，**取过数不等于有判据**。
  做法沿用本仓已确立的「两端共享向量」（先例 `testdata/axs-draft/*.json`）：
  新增 `testdata/conditions/compare.json`（**31 条**）+ 两个消费者
  （`packages/core/src/conditionVectors.test.ts`、`backend/tests/test_condition_vectors.py`），各带一条分母守卫。
  **权威不归任何一侧**：每条写死 `want`、只收答案无歧义的形状，所以它是**规格**——
  这与 AXS 草稿向量那批**故意不同**（那批拿 TS canonical 解析器裁决合法性）。
  **向量当场抓到我自己写错的一条规格**（方法记录）：我第一版把 `eq` 的"带空白数字串"写成 `want: true`，
  实测**两端独立地都返回 false** ⇒ **规格错了、不是代码错了**。
  由此钉进一条真实的不对称：**`eq` 不做任何数值/空白归一**（只归一布尔字符串），
  而 `gt/lt/gte/lte` **做**归一 ⇒ 同一个带空白的数字串在 `eq` 下是假、在 `gte` 下是真。
  两侧一致说明不是某一侧的缺陷，但对作者是个陷阱 ⇒ **登记为待观察、不改实现**（改它会动播放语义）。
  牙：两端各自把 `gte` 退回 `gt`（都先 `grep` 确认落点 0 残留）⇒ Python **2 failed**、TS **2 红**，
  点名同样那两条 `gte` 边界——就是上一轮只能手工取数验的那个缺陷。
  **仍未闭合的一条**：`_value` 解包在 TS 是一个 helper、在 Python 内联在两个 `_match_*` 里，
  形状不同行为一致；它属**匹配层**而非 `compare`，要锁得连 `memories`/`flags` 形状一起定义 ⇒ **登记，不假装已锁**。

同日第四十二批（**把上面那条欠账补掉**，仍未提交）：
- 新增 `testdata/conditions/matcher.json`（**14 条**）+ 两个消费者
  （`packages/core/src/matcherVectors.test.ts`、`backend/tests/test_condition_matcher_vectors.py`），
  锁住上一批没锁的那一半：`_value` 单键解包与「键缺席 ⇒ `operator === "ne"`」。
  **两侧存储形状本来就不同，所以消费者各翻各的**：TS 是**字典**（`key in vars`）、
  Python 是**行列表**（`for m in memories`）；翻译只做形状转换、不碰语义。
  `stored` 写的是**存储形态本身**（已决定要不要包 `{"_value": …}`）——写成解包后的值就会**把自己要锁的东西先假设掉**。
- **一个由判据自己报出来的不对称**：条件 type 是 `flag`（单数）而容器字段是 `flags`（复数）。
- **本批最值钱的一条：一个没红的变异抓出了「用例名 ≠ 覆盖」**。牙＝四道：
  TS「unwrap 改成两键也解包」⇒ 2 红；Python「解包去掉 `len == 1`」⇒ 2 failed；
  **TS「键缺席兜底改成恒假」⇒ 15 全绿**。归因：向量里那四条标着"键缺席"的用例其实设了
  `key + null`，测的是「**键在场值为 null**」，而缺席兜底只对「**根本没有那一行**」成立。
  修法：向量加 `absent: true`，两个消费者在它为真时**不插键 / 返回空列表**；重跑那道牙 ⇒
  TS **2 红**、Python **2 failed**，点名那两条 `ne` 用例。
  **「用例名不等于覆盖」——名字写着"缺席"的用例可能压根没测缺席**，
  这是**只有变异能发现**的一类缺陷：断言是绿的、名字是对的、覆盖是空的。
- **仍未锁的**（登记，不假装已锁）：`character_state` / `codex` / `relationship` 三个族——
  形状更大（要连 `characters` 字典 / codex 账本 / 三段键一起定义），
  而 `relationship` 的三段键语义刚在另一轮改过（`remapCharacterIds` 那两条）。

同日第四十三批（**锁 `relationship` 那族 ⇒ 顺带量出一条真实的双实现分叉**，仍未提交）：
- 量出**三族条件在 Python 侧静默为假**：TS 求值 **7 族**，而 `PlayerService` 只求值 **4 族**——
  **`relationship` / `achievement` / `codex`** 落到函数末尾的 `return False`。
  **后果**：同一份 AXS 在两端**行为不同**——被 `[if: relationship …]` 门控的分支，
  在 TS 引擎（桌面/浏览器）会打开，经后端播放时**永远打不开**，而**两边都报成功、零诊断**。
  这正是本会话反复在拆的那一族：静默降级伪装成合法。
- **组类型意外一致**：我怀疑 TS 用 `not`、Python 用 `none`，**实测两边都是 `all`/`any`/`none`**——
  写进向量当断言，免得下一次再怀疑一遍。
- **为什么不把后三族补进 Python**：那个后端正在退场（ADR-029 桌面唯一化、S13-6 删 `backend/`），
  给将死的后端加功能等于**扩大删除面**。TS 是对的一侧。
- **做法不是改代码，是把分叉钉成规格 + 一条绊线**（`testdata/conditions/families.json`，7 族各带一个探针）：
  TS 侧断言「声明会求值的族确实求值」⇒ 防 TS **悄悄丢族**；
  Python 侧断言「这些族当前返回 False」⇒ 有人真去实现时**这条会红**，逼他同时更新清单与 ADR/S13-6
  ⇒ **分叉要变成一次显式决定，而不是一个安静的洞**。
- **探针又错了两次**（今天第 6、7 次，且错得像真缺陷）：① 给所有族套同一个 key ⇒ `memory` 查不到、
  落进 `ne` 兜底返回假，判据红在 `memory` 上，**看起来像"memory 族坏了"**；
  ② `character_state` 的键格式是 `characterId.field`（按**第一个**点切），我给了三段键。
  **修法：把探针本身放进向量**——「这一族怎么被点亮」是规格的一部分，不该由每个消费者各自猜。
- **牙＝两道**（第一道变异也落歪过一次、缩进错、测试根本没跑 ⇒ 补 `ast.parse` 校验后重跑）：
  TS 删掉 `relationship` 那一支 ⇒ 1 红点名该族；Python 真去实现 ⇒ 1 failed，
  消息直接写着「若你刚实现了这一族，请同步更新 families.json 与 ADR/S13-6」。
- **仍未锁的**：三族**行为本身**（键格式与解包语义）——本批锁的是"哪些族被求值"这个清单。

同日第四十四批（**锁 `character_state` 的键格式 ⇒ 抓到一处真分叉：假值字段被吞**，仍未提交）：
- 清单里 **唯一两端都真求值**、因此可以真正当契约来比的一族是 `character_state`
  （`relationship` / `codex` 在 Python 侧压根不存在，**没有第二份实现可对**，只能靠上一批那条绊线）。
- 键格式是 `characterId.field`，两端都按**第一个**点切（`field` 本身可含点），但**取值写法不同**：
  - TS：`vars.characters[charId][field]`，用 `!(field in state)` 做**存在性**判断；
  - Python：`getattr(s, field, None) or s.custom_state.get(field)`。
- **Python 那个 `or` 是真缺陷**：`or` 对 `0` / 空串 / `False` 这类**假值**短路，
  于是「`affection=0` 且 `custom_state` 里没有这一项」读到**的是 `None` 而不是 `0`**。
  而 `affection`（好感度）初值就是 `0`，于是 `affection >= 0` 这种**必然成立**的门在服务端恒为假
  ⇒ **那条分支永远不开，而两端都报成功、零诊断**。
  实测对照：`affection=0 gte 0` / `eq 0` / `mood="" eq ""` / `flag=false eq false` 四条
  **TS true、Python false**；`0 gte 1` 与"只在 custom_state 里的字段"两边一致。
- **修法**（`backend/app/domains/runtime/service.py::PlayerService._match_character_state`）：
  用哨兵把"字段不存在"与"字段值是假值"分开——`getattr(s, field, _FIELD_MISSING)`，
  **只有真的缺席**才回退 `custom_state`；这正是 TS 侧 `!(field in state)` 的语义，不是发明新口径。
  哨兵**不能用 `None`**（`None` 恰恰是这个 bug 的成因），所以那个 `object()` 上面写了注释钉住。
- **形状翻译仍由消费者做，语义不翻译**：向量里这一族拆成 `chars`（TS 的 `vars.characters` 字典）
  与 `custom`（Python 的 `custom_state` 回退源）两段——TS 侧合并成一个字典，Python 侧拆成"行属性 + 回退"，
  这样"回退只在真的没有时发生"这件事**两边的判据长在各自真实形状上**，
  而不是把两边揉成同一种形状把语义糊掉。向量 14 → **21 条**。
- 牙：把 Python 装回 `or` 短路那个原形状 ⇒ **4 failed**，点名的正是那四条假值用例。
  "别过度修正"那条（`0 gte 1` 仍为假）也在向量里 ⇒ 防止有人改成"什么缺失都当真"。
- **这次自己犯的错两次，都是"改数据"而不是"改代码"**：
  ① 我建的行字段叫 `cond`，而随后键重排脚本的白名单里写的是 `condition`
  ⇒ **`condition` 被整个丢掉 7 条**：TS 拿到 `undefined` 条件（`if (!condition) return true` 于是全返真，
  看着像"这一族全坏了"），Python 直接 KeyError 7 红。**教训：先 `assert` 每个消费方要的键都在，再跑**。
  ② 新条目漏了 `id` 字段 ⇒ 用例名渲染成 `undefined`，一条假红。**教训：向量的 `id` 也是数据的一部分**。

同日第四十七批（**路由表收成一份真相源：加载面普查从手抄 9 条换成解析得出的 25 条，当夜就量出 7 个桌面云端调用点**，2026-10-09，未提交）：

- **动因**：`check:http-inventory` 手抄了一份 9 条路由的清单，而 `cloud-callmap.mjs` 已经会机械解析 `App.tsx`——
  同一张路由表两处各有一份，就必然分叉，且**分叉只会以"少测"的形态静默生效**（加一条 `<Route>` 不会有人提醒普查）。
  现在两边共读 `scripts/source-graph.mjs` 新增的 `parseRoutes()`。
- 扫描器而不是正则：`<Route path="/studio" element={<StudioLayout />}>` 里那个 `/>` 会把
  `<Route\b([\s\S]{0,120}?)\/?>` 提前截断 ⇒ 带子路由的父 Route 被当成自闭合，整棵 `/studio/**` 丢前缀。
  `parseRoutes` 按**字符串 + 花括号深度**走，只在深度 0 的 `>` 收尾，前一位是 `/` 才算自闭合。
  成对证据（同一夹具，旧式 vs 新式）：旧式解出 `projects#ProjectListPage`（相对路径，根本不是能打开的 URL），
  新式解出 `/studio/projects`。另认三件事：`<Route index>`（`/play/:projectId` 的 PlayerPage 靠它）、
  无 path 的布局包裹层（`label` 保证唯一，否则三条布局**共用一个闭包**）、
  **就地定义、体内返回 `<Navigate>` 的壳组件**（`ProjectFlowLegacyRedirect` 那一族；按字面名判会把它当页面去导航，
  于是"覆盖 25 条"里有几条落在同一个地方）。
  `App.tsx` 读数：**Route 标签 35 = page 25 + 布局 5 + 重定向 5**（重定向那 5 条不导航）。
- **普查扩面的直接产出（这批真正值钱的地方）**：路由从 9 条变 25 条之后，桌面臂立刻量到
  **`DESKTOP_UNIQUE=7`**——`/discover/{projects,characters,items,scenes}/:id`、`/discover/topics/:slug`、`/author/:authorId`
  这 6 页在桌面态直打云端（`/api/v1/editor/projects/{id}`、`/api/v1/characters/{id}`、`/api/v1/editor/assets/{items,scenes}/{id}`、
  `/api/v1/discover/topics/{slug}/projects`、`/api/v1/creator/hub`、`/api/v1/comments`）。
  **原先那句"桌面态零 /api/v1"是真的，覆盖面是假的**：手抄那 9 条里没有一条带 id 的 discover 路由。
- 修法取**补齐既有决定的另一半**，不新立决定：`DiscoverPage` 早有 `isLocalOnlyDeployment()` 缺席分支
  （注释写着「桌面离线直接输 URL 进来时，给一句准确说明而不是空白的作品街」），
  而 E35 的名字就叫**「入口与目标同生共死」**——它只测了入口那半。
  6 页各补两行闸门：`useEffect` 首行 `if (localOnly) return;`（**这条才是挡请求的那条**）+ 渲染侧 `CloudFeatureNotice feature="…"`。
  闸门必须同时改**effect**：只在渲染层早退而 hook 照样跑，请求仍然发得出去。
  复量 `check:http-inventory` 退出码 **0**：`ROUTES=25 / DESKTOP_UNIQUE=0 / BROWSER_UNIQUE=20（正对照）/ UNMOUNTED=0`，
  浏览器臂每条 discover 详情页仍是 2-3 笔 ⇒ 功能没被砍，只是桌面不再假装能连。
- **顺手挖出自己上一批的判据缺陷（方向是"把活代码判死"，必须报）**：`cloud-callmap` 里同一形状有**两条正则、一严一松**——
  `lazy\(\(\)` 与 `lazy\(\s*\(\)`。松的那条能认跨行写法，严的那条**在 `App.tsx` 26 条 lazy 声明里只认 21 条**，
  漏的正是 5 条写成
  ```
  const X = lazy(
    () => import("…"),
  );
  ```
  的 discover 页 ⇒ 真路由页既进不了宿主闭包、也不算"某 lazy 的目标"，于是被报成「界面确定走不到」。
  归一成 `source-graph.mjs` 的 `lazyImports()` 之后，第十段读数：
  **宿主不早退 21 → 27 / 只在桌面早退页 9 → 9 / 零引用 8 → 8 / 不在任何路由闭包 6 → 0**，
  端点级「所有未守卫点都桌面走不到」**12 → 6**——**在册那个 12 被工具缺陷抬高了一倍**，
  真走不到的只剩 `usePlayer.ts` 那 6 条试玩端点（它只被 `shared/hooks/index.ts` 的 `export *` 引到，barrel 不算读者）。
  其余段（死面 11 / 绕过 34 / 混合 6 / 壳守卫 S1-S3 分档 / 死表面 285·245·10）逐字节未变，已 diff 核对。
- **判据落地（不是只有普查读数）**：`e2e/desktop-http.spec.ts` 新增 `CLOUD_ONLY_ROUTES`（6 条带 id 的云端专属页）
  接进 E14 的路由棘轮，另开 **E44「云端专属详情路由在桌面给的是缺席说明，不是一次注定失败的请求」**——
  每条两半：屏幕上要有「{功能}需要协作服务」，且零 `/api/v1`。
  变异证据：**只删 `DiscoverItemDetailPage` 的 effect 闸门**（留着渲染闸门，所以提示语仍在场）
  ⇒ `-g E44` 得到 **1 failed / 5 passed**，红在 `桌面态这一页仍发了云端请求：/api/v1/editor/assets/items/no-such-item`，
  恢复后 **6 passed**。这条挡的是"以后有人把闸门只加在界面上"那种半吊子修法。
- 夹具与限度（照实登记，不当结论用）：`?storage=memory` 那支**不播种**（`createStorageProvider` 直接 return 内存 Provider，
  由 `index.test.ts` 的「不建素材仓、不播种」钉着），所以参数路由一律填 `inventory-probe` 这个必然查不到的 id。
  ⇒ **本普查覆盖的是"未命中支"**（本地查不到时会不会偷偷发云端——那恰好是最要命的形状），
  **命中支**（本地真有一条工程/角色时的路径）不在这里，在 `e2e:desktop` 的点击层里。两条互补，别把这里的 0 读成"桌面全路径零云端"。
  普查的腿从三条升到四条：**第 0 条是"路由面本身非空、且仍是手抄那 8 条的超集"**（解析器一旦又丢前缀，覆盖静默缩水就由这条报警）。
- 末轮读数：`gates` **0**（十五道；`test:unit` **706 passed + 1 skipped**：core 143 / axs 94 / editor-core 189 / web 241+1skip / admin 39）、
  `typecheck` **0**、`e2e:desktop` **50 passed**（原 38 ⇒ E14 棘轮 +6、E44 +6）、
  `check:http-inventory` **0**、`cloud:callmap` **0**、`check:dead-surface` OK（闭包外 10 全在册）、`check:dispatch` OK（6 文件 / 32 函数）。
  `pnpm e2e`（浏览器那一半）仍未跑——它写的是本机 dev 库，等一句授权。
  **产物层（因为这批改的是产品代码，而 `gates` 不含 build）**：`build:web` **0**、`build:admin` **0**；
  产物是刚构建的（`apps/web/dist/index.html` mtime 与本次构建同分钟），且包内确实带着这句话——
  搜 `"创作者主页需要协作服务"` 整串**搜不到**（模板串在产物里是拆开的：`"创作者主页"+"需要协作服务"`），
  所以正确的产物判据是搜 **`需要协作服务`**（命中 2 个 chunk），不是搜拼好的整句。

同日第四十八批（**把第五条腿架到 e2e 那三张手抄路由表上——同一类债的第二个现场**，2026-10-09，产品代码一字未改）：

- 第四十七批治的是**普查里**手抄的路由表；`e2e/desktop-http.spec.ts` 里还有三份同样手抄的表
  （`CLEAN_ROUTES` 9 条 / `CLOUD_ONLY_ROUTES` 6 条 / `LOCAL_UNAVAILABLE_ROUTES` 7 条）。
  它们的失效方式和原来那份一模一样：**新增一条 `<Route>` 不会有任何东西提醒你给它写点击判据**，
  于是"桌面点击层已经覆盖"这句话会随产品长大而静默变薄。
- `check:http-inventory` 加**第 5 条腿**：拿解析出的路由面去对账 `desktop-http.spec.ts`，
  打印「点击层没测到的路由=N（点名）」。两条设计决定：
  ① **只报不判红**——"要不要为某条路由写点击判据"是排期决定，不是缺陷，把它做成硬失败就会有人直接删判据；
     会判红的只有一种：三张表**一条都解析不出来**（清单改名或形状变了 ⇒ 判据正在消失，UNRELIABLE、退出码 1）。
  ② 判据范围要选对，否则会把**测过的**报成没测：只按三张表算时报的是 3 条，其中 `/studio/projects/new`
  其实被 E17 那一族 `page.goto("/studio/projects/new?storage=memory")` 走过去了——那是"把判据报薄"的方向，
  和第四十七批那个"把活代码判死"属同一族。于是把 **spec 里所有 `goto` / `visitInDesktopMode` 的字面量地址**
  并进来（剥掉 `?` 之后部分），读数变 **`SPEC_URLS=50`**（22 条表内 + 28 条 goto 字面量），
  没测到的从 3 → **2**：`/studio/characters/:id/edit`、`/docs/*`（文章页只测了索引页 `/docs`，正文页在桌面从没走过）。
  这条腿本身也因此有过一次"红在该红的那一半"的验证：去掉 goto 那一半就多报一条假账。
- 上界性质写进脚本头：模板串/变量拼出来的地址（`goto(route)`）这里看不见，
  所以报出来的是**"可能没测到"的上界**，只当线索，不能拿去下"这两页没判据"的死结论。
- 末轮读数：`check:http-inventory` 退出码 **0**，`ROUTES=25 / DESKTOP_UNIQUE=0 / BROWSER_UNIQUE=20（正对照）/ UNMOUNTED=0 / SPEC_URLS=50`。
  本轮只改脚本与文档，产品代码 `git diff` 里那 6 个页面是第四十七批留下的，未再动。

同日第四十九批（**第五条腿自己错了两次，都被测量抓回来：注释里的 glob 关掉块注释、正则字面量里的字符类截断扫描器**，2026-10-09，产品代码一字未改）：

- 上一批的第五条腿报「点击层没走到的路由=2」。**其中一条是假的**：`/studio/characters/:id/edit`
  其实 E21 早就走了——它是**点「编辑」走过去、再用 `toHaveURL(/…/)` 验 URL**，
  而我那档只扫字符串字面量。把"测过的"报成"没测的"仍是同族错误（**判据报薄**），
  于是加第二档：抠出测试里的 `toHaveURL(/…/)` 正则，给每条路由模式拼一个样例地址去撞。
- 那一档**第一次上线时是 0 条命中，而 0 看起来完全合理**——这才是真缺陷的样子：
  我的提取正则 `toHaveURL\(\s*\/((?:\\.|[^/\\])*)\/` 把正则字面量当"到下一个斜杠为止"，
  而测试里写的是 `/\/studio\/characters\/[^/]+\/edit$/`，**字符类 `[^/]` 里那个斜杠没转义**，
  于是抠出来的是半条非法正则 ⇒ `new RegExp` 抛错 ⇒ 被我自己的 `try/catch` 咽掉 ⇒ 静默 0 命中。
  改成**带类感知的扫描器**（`\\` 跳一位、`[` 之内斜杠不算结束、不跨行猜）后读数 **`17/17` 全抠出、正则证据 1 条**，
  并自带一条对照打印：「抠出的条数 < 出现的条数」时明说"这一档的读数是薄的"（不再让 0 冒充"没有"）。
- 分档也拆开了，因为**名字会骗人**：原来那一行叫"没测到"，实际含义是"没有字面量导航到"。
  现在三档并出：`没有字面量导航到的路由=1` → `其中确有正则证据=1（并列出命中的正则原文）` → **`完全没证据的路由=0`**。
  只有最后一档才是真欠账；正则那一档**天生不精确**（宽正则一次认掉整族），所以把命中原文贴出来由人判断，不悄悄抵账。
- 真缺的那一条补上了：**E45「随包的用户文档在桌面读得出来（命中的那一支）」**。
  普查只能量未命中支（内存宿主不播种），而 `docRegistry` 是 `import.meta.glob(..., { eager: true })`
  把 `docs/user` 下的 markdown 打进入口的——**这是全系统唯一一条"本地真有内容"的读路径**，
  以前只靠"文档确实在仓库里"这种理由相信。现在两条一对：真 slug 渲染出正文（`桌面版目前没有的功能`）且零 `/api/v1`，
  假 slug 必须给「未找到该文档页面」（少了这一条，"随便什么都渲染同一个壳"也会让正证绿）。
  写这条时自己踩的：**块注释里不能出现 glob 的 `*/`** —— 我把 `import.meta.glob("docs/user/**/*.md")` 原样抄进注释，
  那个 `*/` 当场关掉注释、后面全部变代码，`typecheck` 与用例收集同时炸（TS1109 + `No tests found`）。
- 末轮读数：`check:http-inventory` **0**（`ROUTES=25 / DESKTOP_UNIQUE=0 / BROWSER_UNIQUE=20 / SPEC_URLS=52 / 正则 17/17 / 完全没证据 0`）、
  `pnpm e2e:desktop` **52 passed**（50 → 52）、`pnpm typecheck` **0**。本轮未动产品代码。

同日第五十批（**第三层对账：ADR-029 补记 + Phase 13 那行「验收」的残项按证据重量一次**，2026-10-09，产品代码一字未改）：


- **ADR 层**：`docs/ADR/029-desktop-only-build-target.md` 加了「补记 2026-10-09」，写四件事——
  ① 第 6 条那句「不留点进去报网络错误的残口」第一次有机械判据（`check:http-inventory` 桌面臂 25 页 × 零 `/api/v1`）；
  ② **它曾被违反**：discover 的 6 个详情/主页（入口页早退了，目标页没有）——按本决策直接补齐，不需要新决策；
  ③ **判据的覆盖边界写在决策旁边**：桌面臂量的是装载路径，**点击之后才发的调用不在它覆盖内**，
    静态上界与装载实测之间的差额**今天还没对账**（登记成快照里的 ③，不当已完成）；
  ④ 一条**按证据作废的怀疑**：`isLocalOnlyDeployment()` 逐字等于 `isTauriEnvironment()`，
    与 ADR-024 那句"云为可选协作服务"**不冲突**（"可选"= 运行不依赖它，不等于"桌面配了端点就该露出云端入口"），
    所以这不是实现偏离决策——写在这里是为了下一个人不必再查一遍。
  写补记时又踩到自己登记过的那个坑：把 `## 代价` 整行当 Edit 锚点，**标题被吞掉**，改完立刻 `grep -c "^## "` 复量才发现并补回。
- **验收残项复量（11:05 取，与在册一致 ⇒ 无漂移）**：
  `.github/workflows/ci.yml:69` 仍是 `pnpm build:web && pnpm build:admin`；`vercel.json` 与 `docker-compose.yml` 仍是 tracked；
  `pnpm check:publish` 自报 **残差 4 条全部在册（基线 4）**。
  **顺带把"桌面壳在 CI 上零信号"这句的措辞钉准**：CI 里那 3 处 "desktop" 全部是**分支过滤**
  （`branches: [main, master, desktop]`，注释说明它原先不在列表里、直推 desktop 的提交一道 CI 都不跑），
  **没有任何 Rust/tauri job**——所以这句话的意思是"壳本身没被 CI 构建过"，不是"CI 完全不跑桌面分支"。
  改 CI 属于动共享流水线、且逻辑上要先有 §6 ② 那份"web/admin 判死"的决定，所以**这里只登记不擅动**。

同日第五十一批（**把快照里那条 ③「静态上界 × 装载实测的差额」真对了一遍账，做成 `cloud:callmap` 第十二段**，2026-10-09，产品代码一字未改）：

- 分的是什么：`check:http-inventory` 的桌面臂只量「进入页面那一刻」发的请求，所以 `DESKTOP_UNIQUE=0` 只证到**装载面**干净。
  第十段那条静态保守上界说"这 36 处未守卫调用点桌面真会打出"——里面有多少**装载即发**、多少**要点了才发**，
  决定的是 §6 ② 那份判死名单暴露方式：装载类靠**页面级闸门**挡着（绕开就漏），点击类只能逐条写点击判据（E19/E40/E41 那种形状）。
- 读数：**36 处 = 装载即发 26 / 点了才发 2 / 不明 8**（不明**不计入**"装载判据已覆盖"）。
  端点级：**装载类 22 个端点、其余 5 个**。点了才发那 2 处点名叫出来了：
  `apps/web/src/features/studio/pages/ProjectListPage.tsx:91`（`projectApi.fork`）与
  `apps/web/src/features/character/components/VersionPanel.tsx:44`（`versionApi.get`）。
- 与运行时对账（`LOADFACE=<普查输出>` 指进来，`${id}` 换成 `[^/]+` 后比路径）：**22 个装载类端点里普查真见过的 4 个、没见过的 18 个**。
  **这 18 才是本段真正要看的数**，两种解释都成立且必须逐条分：要么那条路在桌面已经被页面早退挡了（正常），
  要么静态分档把它**判高了**（可疑）。已知的判高质量原因写进限度：`const load = async () => api.x()` 这种**只看定义形态**的形状，
  既可能被 `useEffect` 调也可能被 `onClick` 调，这一段**不做调用图**，所以这类会偏判成"装载即发"。
- 三条控制位（缺一不可，都是这一段自己踩出来的）：
  ① **对照失败会明说**——静态说装载会发的端点与实测路径**一条都没对上**时打 ⚠ 并宣布"这一列不能用"。
     这不是假想：第一版就是这么错的，`epPath` 带前导斜杠而普查剥过 `/api/v1`  ⇒ 口径差一位斜杠，报的是 `0/22`，
     看起来像"装载面全都没见到"，实际是**没在比**。修成两边都归一到带前导斜杠之后才有 4/18。
  ② 没给 `LOADFACE=` 时报"**运行时列缺失**"，不当 0 用；
  ③ 限度里写明产物是临时的（`/tmp`），**代码一改就得重取**，否则对的是旧世界。
- 其余段**逐字节未变**（死面 11 / 绕过 34 / 混合 6 / 守卫分档 / 宿主可达性 27-9-8-0 / 死表面 `闭包内 245、闭包外 10、对照通过`），
  差异只出现在新增那段。`pnpm cloud:callmap` 退出码 0（两种跑法都是）。
- **自己又踩一次那个老坑**：拿注释的**首行**当 Edit 锚点的尾巴，把「死表面普查（第十一段）」那行说明吞了（本会话第二次）。
  这次靠"跑一遍看第十二段还在不在"抓回来并补回；教训是**锚点尾巴要落在自己新写的行上，别落在被保留的邻居行上**。

同日第五十二批（**把第十二段那 18 条"静态说装载会发、普查没见到"当场分完档，结论是否掉我自己的期待**，2026-10-09，产品代码一字未改）：

- 分档判据用**模块图**，不靠运气：这条端点的**消费者文件**在不在某条路由页的 import 闭包里。
  A 档（不在任何闭包 ⇒ 装载普查**结构上量不到**，静态与运行时不矛盾，该并进"界面走不到"）／
  B 档（在闭包内、浏览器臂也没发 ⇒ 静态把时机**判高了**，是条件渲染或点了才发，真欠点击判据）。
- 11:27 实测（普查与 callmap 同刻取数）：**A=0，B=18，相加 18**；「对照失败」那条 ⚠ **没触发**（4 条对得上，不是恒 0）。
  **（更正 12:15 第五十三批：这 18 条是假的 —— 见同日第五十三批。装载类 22 条里实际对上 7 条、没对上 15 条，
  原因是 `pathSeen` 先转义再抠 `${...}`，带参数的模板一条都换不掉；那 4 条"对得上"恰好全是无参数的，
  我当时把症状读成了结论。A=0 这个结论本身不变。）
- **这条读数对 §6 ② 的意义是坏消息，而且是我要的那种坏消息**：
  我原本期待"A 档能缩掉几条判死名单"，实测**一条都缩不掉**——18 条的消费者全都在路由闭包内，
  也就是说它们**不是"界面走不到"，只是"装载时不发"**。把它们当死面删掉的理由，这次被自己的数据否掉了。
  名单要缩只能靠 B 档逐条写点击判据（E19/E40/E41 那种形状）或者你真下令判死。
- 点名样例（B 档里的头几条）：`GET /characters/public`（消费者 `CharacterSearchSelect.tsx`、`DiscoverStatsBar.tsx`、`useCharacters.ts`，
  宿主含 `/studio/projects`）——它在闭包内但装载时不发。**为什么**没发我没测（**推测**：由搜索框交互触发，而不是进入页面就取），
  要定性得逐条读调用点或补点击判据；这里只登记"闭包内 + 装载未观测"这个事实。
  另外 `DiscoverStatsBar.tsx` 本身在死表面基线里（闭包外 10 个之一），**同一个端点的一条腿活着、另一条腿是死的**，
  这种"混合读者"的形状正是按端点判死会误伤的地方，记下来。
- 末轮（11:27 同刻）：`check:http-inventory` **0**（`ROUTES=25 / DESKTOP_UNIQUE=0 / BROWSER_UNIQUE=20 / UNMOUNTED=0`）、
  `cloud:callmap` **0**（第十二段 26/2/8；两档 A0/B18）、其余段未变。

同日第五十三批（**上一批那个 B=18 是我自己的转义 bug 造的假数；修完是 15，并给匹配器装了内建自测**，2026-10-09，产品代码一字未改）：

- **怎么发现的**：`[^/]+` vs `[^/]*` 那个变异跑完，**自测五条全绿、退出码 0** —— 一个挡不住变异的自测就是没自测。
  顺着查下去才看清：`pathSeen` 里 `[^/]*` 与 `[^/]+` 对本次的误匹配没有区别（真正的重叠是模板 `/editor/projects/${id}` 会认下真端点
  `/editor/projects/discover`，两种写法都认），**所以那条自测当时没有对准我实际犯过的错**。
- **真正的错在转义顺序**（第五十二批就已经犯了，只是那批的读数看起来太合理，没人怀疑）：
  先把整串转义（`$ { }` → `\$\{id\}`）、再按**未转义**的形状去替换 `${...}` ⇒ 一条都换不掉 ⇒
  **所有带参数的端点在运行时列里必然"没见过"**。上一批 B=18 里"能对上的 4 条恰好都是无参数的"就是这个症状，我当时把它读成了结论。
- 修法：按 `${...}` **切段 → 只转义字面段 → 用 `[^/]+` 接回**；末段是插值时再多给一条"缺席"模式
  （普查记的是 `URL.pathname`，`${qs}` 这种查询串不在里面）。**这一列如实标成上界**（模板与端点天然存在包含关系，只能当线索）。
- **自测改成打历史错误**（内建、不依赖当天数据，五条）：模板吃到参数 / 参数不跨段 / 末段查询可缺席 / 不把别的端点认进来 / 无参模板要全等。
  两头都见过红：**把顺序改回旧错法 ⇒ `模板吃到参数=失败`、`末段查询可缺席=失败`、退出码 1**；改回正确实现 ⇒ 五条全通过、退出码 0。
  变异脚手架（`process.env.MUTATE` 分支）**用完即拆**，现在 `grep -c MUTATE` = 0。
- **更正上一批的读数**（历史文本不重写，批注挂在这里）：
  第十二段「静态说装载会发、普查没见到」不是 18 条而是 **15 条**（装载类 22 = 对上 **7** / 没对上 **15**，
  其中带参数 **8** / 无参数 **7**）；分档 **A=0 / B=15**。
  **对 §6 ② 的结论不变**：A 档仍是 0 条 ⇒ 判死名单**一条都缩不掉**，这 15 条只是"装载时不发"，不是"界面走不到"。
- **顺带量到一件该记的事**：守卫段「文件有守卫但该调用点未判出」从 **15 → 22**，
  多出来的正是 discover 那 6 页——它们现在有**页面级早退**，但 S1/S2/S3 三种形状建模的是"守卫与调用点在同一块/同一句/同一直接子语句"，
  **不认"祖先块早退之后整段不可达"**。这不是新缺陷，是判据的一个已知盲区：它让这批调用点从"无守卫"变成"待人工复核"，
  **（此归因错了：真实原因是闸门被抽成变量别名、`GUARD_SRC` 只匹配字面调用；见同日第五十四批，修法已按证据验过，22 已回到 15。）**
  读数方向是**保守的**（宁可多列），但要说清，否则有人会把这 22 条当成"闸门没生效"。
- 末轮读数：`cloud:callmap` 退出码 **0**（带 `LOADFACE`），其余段与第五十二批一致
  （绕过 34 / 死面 11 / 仅实现侧 9 / 有分派口 27 / 混合 6 / 本地已接 8；宿主不早退 27、零引用 8、端点级 6 走不到 / 29 走得到）。

同日第五十四批（**守卫判据的"痕迹当证据"被抓出来：别名闸门认不出、声明位反被当成守卫**，2026-10-09，产品代码一字未改）：

- 起点是上一条批注里我自己写错的原因：我把「待人工复核 15 → 22」归因成"S1/S2/S3 不认祖先块早退"。**代码显示不是**：
  discover 那 6 页的闸门写成 `const localOnly = isLocalOnlyDeployment();` + effect 首行 `if (localOnly) return;`，
  形状正是 S3，只是 `GUARD_SRC` 只匹配字面调用 ⇒ **认不出变量别名**。写错的因果已就地更正（不重写正文）。
- 于是把守卫的字面式扩到"**同文件内、由守卫式调用直接初始化的别名，且处在布尔位置**"
  （`if (localOnly`、`!localOnly`、`&& localOnly`、`|| localOnly`、`: localOnly`、`? localOnly`）。
  **一头严一头松各错过一次**：先只要求"标识符在块里出现过"⇒ `[id, localOnly]`（依赖数组）与 `{ localOnly }`（搬值）会把没挡住的调用判成有守卫；
  改成"必须紧跟 `)`/`&&`/`?`"⇒ 又把 `enabled: !!character && !localOnly`（`CharacterDetailPage.tsx:155`，真闸门）判成没守卫——
  这条是我拿真实代码验出来的**反例**，不是推的。最终取"前面贴没贴判断结构"。
- **自测又抓到一件既存缺陷**（跟本次放宽无关，早就在）：`const 本地旗标 = isTauriEnvironment()` 这句**定义**本身
  会被 S1「扫整块」当成守卫 ⇒ 只要调用和这句声明同块就算安全。修法：S1/S2 的窗口里**跳过定义位**（前面是 `= ` 的那些出现）。
  诊断也没省：把自测从"前缀有没有匹配"改成**直接跑 `guardShape` 并打印实际判到的形状**
  ——因为真实代码里 `enabled:` 写在 `queryFn` 之后，靠的是 S1 同块，用前缀当 harness 会**判错了还自称通过**。
- 四条合成样本（正反各两条）现在实判 `S3闸门早退=S3、S1同块条件属性=S1、依赖数组=null、搬值=null` ⇒ 全通过、退出码 0；不通过就 `exit 1`。
- **语料侧读数证明这次没靠放宽换数字**：扩别名 + 严布尔位 + 跳过定义位之后，
  `端点级 全有守卫 10 / 部分 3 / 全无 27`、`待人工复核 15`、`宿主不早退 ⇒ 桌面真会打出 20 处未守卫调用点`、
  第十二段 `装载即发 19 / 点了才发 2 / 不明 8`（与"痕迹版"逐数相同，但两种误判形状已被挡下）。
  对照三版（同一棵树，只换判据）：**无别名 22 处待复核 / 痕迹版 15 / 证据版 15**。

同日第五十五批（**桌面账户设置那句自相矛盾的话：修掉，并钉成 E47**，2026-10-09，产品代码改一处文案）：

- 起点是上一批留下的账：第十二段那 15 条「待人工复核」要定性成"残口"还是"页面已早退"，
  先得在桌面上确认**入口到底存不存在**。
- 取证用一个临时探针（`scripts/.tmp-probe-entries.mjs`，**跑完已删**）在"注入标记 + `?storage=memory`"下读各页渲染出的按钮。
  **量到的第一条不是入口，是判据自己的限度**：内存宿主命中不了种子，detail 页渲染的是「角色不存在」那一支 ⇒
  **未命中支的页面证明不了入口是否存在**（这条必须在，否则下次又拿"没看见按钮"当"入口不存在"的证据）。
  在真命中支上读到的是：`CharacterDetailPage` 的三支 `{!localOnly && (` 确实把 **版本 / Fork / 删除** 三个入口在桌面关掉了。
- 换"读代码 + 读页面文案"这条路之后，**量到一条真实缺陷**：`ProfilePage` 的桌面分支顶部仍写
  「管理昵称、头像、邮箱与数据」，而同一屏下面一句就是「账户设置需要协作服务」——自相矛盾，
  正是 ADR-029 规则 6 那道"不留点进去报网络错误的残口"的**文案版**。
  修法：description 改成「这一页在本机只保留你的身份；昵称、头像、邮箱与数据管理都在协作服务那一侧」。
- 判据 **E47 桌面账户设置不许再承诺它做不到的事**（`e2e/desktop-http.spec.ts:310`）：
  浏览器态断言那句话**在**（它是真话，不许被顺手删掉），桌面态断言 `当前身份：` 与缺席说明在、
  那句承诺 `toHaveCount(0)`、全程零 `/api/v1`。
  **牙**：把文案改回旧句 ⇒ **1 failed / 1 passed**，红的正是桌面那一半，失败落在
  `await expect(page.getByText(PROMISE)).toHaveCount(0)`（`:319`）；改回修复版复绿。
- **本批第三次踩同一个坑**：拿邻居行 `test.describe("E45 …")` 当 Edit 锚点的尾巴，把那行吞了。
  已就地恢复并按升级后的硬动作复核：`grep` 两个 describe 都在、`grep -c "^test.describe"` = **20**。
  规则早就写了，这轮的教训是**"写了规则不等于执行了规则"——提交前先看一眼自己那条 `old_string` 的尾行是谁的**。
- 末轮读数（产品改动落在两份普查的扫描面内，所以两份都**重取**，没复用上一批的数）：
  `pnpm e2e:desktop` **54 passed** 退出码 **0**（52 → 54，E47 两条腿）、
  `pnpm gates` **0**（十五道；`test:unit` **706 passed + 1 skipped**＝core 143 / axs 94 / editor-core 189 / web 241+1 skipped / admin 39）、
  `pnpm check:http-inventory` **0**（`ROUTES=25`：page 25 / 布局 5 / 重定向 5，Route 标签 35；带参 14；`UNMOUNTED=0`；
  `DESKTOP_UNIQUE=0`；`BROWSER_UNIQUE=20` 正对照；**`SPEC_URLS` 52 → 54**；正则 17/17；**完全没证据的路由 0**）、
  `LOADFACE=/tmp/inv55.txt pnpm cloud:callmap` **0**（端点级 **全有守卫 10 / 部分 3 / 全无 27**；待人工复核 **15**；
  桌面真会打出 **20 处**；第十二段 装载即发 **19** / 点了才发 **2** / 不明 **8**；
  运行时列 **真见过 4 / 没见到 12**）⇒ **文案改动没移动任何一条分母**，这一句是重取出来的，不是推的。
  `pnpm check:citations` **0**（47 文档 / 已判定 **220** / 不存在 0 / 越界 5 在册）、`git diff --check` **0 行**、`.e2e-lock` 跑完不在。

同日第五十六批（**「待人工复核」里那条正对照宿主：Fork 的闸门是一把被藏起来的开关，钉成点击判据 E48**，2026-10-09，产品代码净零改动）：

- 上一批把 12 条「静态说装载会发、普查没见到」点名之后，先去量**入口到底存不存在**。挑的是 `cloud:callmap` 自己拿来当正对照的那个宿主
  （`ProjectListPage` ⇒ "宿主不早退 ⇒ 桌面真会打出"）。读代码得到**第三种情形**，既不是"页面早退"也不是"调用点有闸门"：
  ① 页面在桌面正常渲染（它是本地页）；② `handleFork` 里 `await projectApi.fork(...)` 前后都没有闸门；
  ③ 真正挡着它的是**工具条那把「我的 / 模板」开关被 `{!localOnly && (` 藏了**（`tab` 初值 `"my"`，全页只有一处 `setTab`），
  于是带 Fork 按钮的模板卡片整支、以及 `tab === "template"` 才发的那条 `listTemplates`，在桌面都不存在。
- **这类"藏控件即闸门"过去只活在结构里、没有判据**。加判据 **E48**（`e2e/desktop-http.spec.ts:1081`）：
  浏览器态断言「模板」开关**在**（否则整块守卫被删也不会红），桌面态断言「模板」/「我的」/「以此创建」都 `toHaveCount(0)`
  + 侧栏「剧本」链接可见（**挂载正控，防"空载 count 0"**）+ 零 `/api/v1`。
  **牙**：把 `{!localOnly && (` 改成 `{(localOnly || true) && (` ⇒ 桌面那一半红在 `toHaveCount(0)`（`:1100`），
  改回后 `pnpm e2e:desktop` **55 passed** 退出码 **0**。
- **`check:size` 的棘轮当场挡住了我一行注释**：想给 `handleFork` 上方写四行说明"闸门是上面那把开关"，
  文件立刻 `414 > 棘轮 408`、`gates` 退出码 **1**。处置不是放宽棘轮，而是**把说明留在判据里、把代码恢复原样**
  ——承重的应该是那条会红的断言，不是注释（注释会搬家、断言不会）。恢复后 `git diff --stat` 对该文件**为空**、407 行。
- **顺手记一条只观察不处置**：`GET /editor/projects/templates` 被分进「调用者已接本地库（8）」那一档，
  因为那一档是**按调用者**归类的——`ProjectListPage` 大部分动作确实走本地库，可 `listTemplates`（官方/社区元剧本）本身没有本地替身。
  这不是今天的缺陷，但它是那张表的一个失真方向：**"调用者本地已接"不等于"这个方法本地已接"**。
- 末轮读数：`pnpm e2e:desktop` **55 passed**（54 → 55）、`pnpm gates` **0**（十五道；`test:unit` **706 passed + 1 skipped**；
  `[file-size]` 349 文件 0 越线）、`pnpm check:http-inventory` **0**（`SPEC_URLS` 54 → **56**、`ROUTES=25`、`UNMOUNTED=0`、
  `DESKTOP_UNIQUE=0`、`BROWSER_UNIQUE=20`、正则 17/17、完全没证据 0）、
  `LOADFACE=/tmp/inv56.txt pnpm cloud:callmap` **0**（守卫 16/37 调用点、端点级 10/3/27、待复核 15、桌面真会打出 20、
  第十二段 19/2/8、运行时 见过 4 / 没见 12）⇒ **本批产品代码净零，分母一条没动**，E48 抵的是判据层的账。
  `pnpm check:citations` **0**（已判定 221）、`git diff --check` **0 行**。

同日第五十七批（**「藏入口即闸门」这一类再钉一条：桌面角色详情页不给版本 / Fork / 删除，E49**，2026-10-09，产品代码净零改动）：

- 接着上一批的形状往下走：`versionApi.get @ VersionPanel.tsx:44` 与 `versionApi.rollback @ :32` 也在「待人工复核 15 条」里。
  读代码：`VersionPanel` 的**列表查询**早就有 `enabled: !isLocalOnlyDeployment()`，注释还写明"Modal 常驻挂载，入口按钮上的 `!localOnly` 拦不住 hook"——
  但这两条调用点本身不在任何闸门作用域里。挡着它们的是**再上一级的入口**：详情页右上工具条里「×× 个版本」那颗按钮在 `{!localOnly && (` 内
  （`Fork`、`删除` 同理）⇒ 面板在桌面根本打不开，两条云调用在界面上不可达。
- 判据 **E49**（`e2e/desktop-http.spec.ts:1122`）：按 E21 的路子先在内存宿主**建一个真角色**再进详情页
  （**未命中支的详情页什么按钮都没有，count 0 就只是"页面没加载"**——上一批刚登记过这条限度，这里按它做），
  然后同一条工具条里**没被守卫的那两件**（`编辑` 链接、`分享` 按钮）当正控，缺席那三条（`/个版本/`、`Fork`、`删除`）各一条 `toHaveCount(0)`，
  外加零未捕获异常与零 `/api/v1`。
- **牙做了两头**（一条缺席断言只有"该在场时在场"和"该红时真的红"两头都证过才算数）：
  ① 把版本按钮的守卫拿掉（`{!localOnly && (` ⇒ `{(localOnly || true) && (`）⇒ **1 failed**，红在
  `await expect(page.getByRole("button", { name: /个版本/ })).toHaveCount(0)`（`:1147`）；
  ② 反过来把正控 `编辑` 也藏起来（给它套一层 `!localOnly`）⇒ **1 failed**，红在
  `await expect(... "编辑" ...).toBeVisible()`（`:1144`）。
  两次都只改产品代码、跑完即还原（`grep -c "localOnly || true"` = **0**，工具条结构回到原样）。
  **第②次是这批真正值钱的那次**：它证明正控不是装饰——没有它，那三个 count 0 可以靠"整条工具条没渲染"蒙过去。
- 末轮读数：`pnpm e2e:desktop` **56 passed**（55 → 56）、`pnpm gates` **0**（十五道；`test:unit` **706 passed + 1 skipped**）、
  `pnpm check:http-inventory` **0**（`SPEC_URLS` 56 → **57**、`toHaveURL 正则` **19/19**（17 → 19，E48/E49 各带 goto 与 URL 断言）、
  `ROUTES=25`、`UNMOUNTED=0`、`DESKTOP_UNIQUE=0`、`BROWSER_UNIQUE=20`、**完全没证据 0**）、
  `LOADFACE=/tmp/inv57.txt pnpm cloud:callmap` **0**（调用点 16/37、待复核 **15**、桌面真会打出 **20**、第十二段 **19/2/8**、运行时 **4/12**
  ⇒ 与 13:06 逐数相同：E48/E49 抵的是判据层，静态分母不动）、`pnpm check:citations` **0**（已判定 **224**）、`git diff --check` **0 行**。
- **这一类剩下的账**（先把每条的**分派点**读到代码为止，再谈缺什么——我第一版把它写成"这几条还没人看过"，
  逐条查完发现**分派点基本都在，缺的是界面级那一眼**）：
  `relationApi.*` 四条 ⇒ 分派点是 `visibleCharacterTabs(localOnly)` 的 `cloudOnly` 白名单（`characterTabs.test.ts` 已在册，缺界面级）；
  `userApi.*` 六条 + `identityLink.ts` 四条（`report`/`linkEmail`/`resolve` 都挂在"邮箱绑定/恢复"那条链上）⇒ 分派点是 `ProfilePage` 整页早退（E47 覆盖可见的那半）；
  `commentsApi.*` 三条 ⇒ 只被 discover 那 6 个详情页用到，而那些页第五十一批起整页早退（E44 覆盖）；
  `characterApi.listPublic @ apps/web/src/shared/hooks/useCharacters.ts:51` ⇒ 两个消费者各有分派点（`CharacterSearchSelect` 的 S1 守卫已被 callmap 判出；
  `DiscoverCharactersTab` 只挂在 `DiscoverPage`，整页早退）；
  **唯一一条"分派点存在但没有任何判据看着"的**是 `searchApi.global @ apps/web/src/shared/components/GlobalSearch.tsx`：
  它的闸门在调用者那一侧——`apps/web/src/shared/components/AppHeader.tsx:84` 的 `showSearch && !isLocalOnlyDeployment() && <GlobalSearch />`，
  而 callmap 的限度里明写"消费者级条件渲染不认"，所以它永远留在 `桌面真会打出 20` 这个保守上界里下不来。
  ⇒ 下一步最便宜的一条判据就是这个：桌面态首页顶栏不给搜索框（正控＝同一条顶栏上 `剧本` 那类导航项在）。

同日第五十八批（**把上一条"留给下一批"的那件事当场做掉：E50 桌面 studio 顶栏不给全局搜索**，2026-10-09，产品代码净零改动）：

- 上一批在 §6 写下"剩下最便宜的一条判据"，本批照做，不再另开矿脉。目标那条的特别之处在于**它的闸门不在自己身上**：
  `apps/web/src/shared/components/GlobalSearch.tsx` 里读不到任何判定，`searchApi.global`（调用点 `:33`）是被**挂载条件**挡住的——
  `apps/web/src/shared/components/AppHeader.tsx:84` 的 `showSearch && !isLocalOnlyDeployment() && <GlobalSearch />`
  （`showSearch` 由 `StudioLayout.tsx:33` 打开 ⇒ `/studio` 每一页本来都带搜索框）。
  `cloud:callmap` 的限度明写"消费者级条件渲染不认"，所以这条在静态侧**永远**是 `守 0/1`，下不了那 20 的保守上界——只能靠界面级证据。
- 判据 **E50**（`e2e/desktop-http.spec.ts:1167`）：浏览器态断言 `全局搜索...` 输入框**在**（证明它是被守卫掉的、不是组件本来不渲染），
  桌面态断言它 `toHaveCount(0)`，并用同一条壳上没被守卫的 `剧本` 导航项做挂载正控，最后零 `/api/v1`。
- **牙**：把挂载点改成 `{showSearch && (true || !isLocalOnlyDeployment()) && ...}` ⇒ **1 failed**，
  红在 `await expect(page.getByPlaceholder("全局搜索...")).toHaveCount(0)`（`:1186`）；还原后 `git diff --stat` 对该文件**为空**。
- 末轮读数：`pnpm e2e:desktop` **57 passed**（56 → 57）、`pnpm gates` **0**（十五道；`test:unit` **706 passed + 1 skipped**）、
  `pnpm check:http-inventory` **0**（`SPEC_URLS` 57 → **59**（E50 的两条 goto 各算一次）、`toHaveURL 正则 19/19`、
  `ROUTES=25`、`UNMOUNTED=0`、`DESKTOP_UNIQUE=0`、`BROWSER_UNIQUE=20`、完全没证据 0）、
  `LOADFACE=/tmp/inv58.txt pnpm cloud:callmap` **0**（调用点 16/37、待复核 15、桌面真会打出 20、第十二段 19/2/8、运行时 4/12；
  `searchApi.global` 仍列 `守 0/1 @ GlobalSearch.tsx:33`——**静态档位不动是预期的**，判据抵的是"看过"这件事，不是分母）、
  `pnpm check:citations` **0**、`git diff --check` **0 行**、stash **0**、`.e2e-lock` 不存在。

同日第五十九批（**E49 顺手把「关系」那一栏也看一眼——至此「待人工复核 15 条」每一条都有判据或写在册的分派点**，2026-10-09，产品代码净零改动）：

- §6 上批写的"下一个最便宜的一条"照做，**没有另开新判据而是把 E49 加长**（同一个建角色→进详情页的流程不值当跑两遍）：
  断言从三条缺席（`/个版本/`、`Fork`、`删除`）变成四条，加上 **`关系` 那一栏 `toHaveCount(0)`**；
  正控用同一排标签里在场的 **「传记」**（S13-1 就本地化过、桌面必须给）——「传记」在 ⇒ 标签条真渲染了，
  `关系` 那个 count 0 才是"被摘掉一栏"而不是"标签条没加载"。
  `describe` 标题随之改成 **「E49 桌面角色详情页不给「关系」栏与版本/Fork/删除入口」**（引用一律按标题，E 号只是号）。
- **牙**：把 `characterTabs.ts` 里 `relations` 的 `cloudOnly` 改成 `false` ⇒ **1 failed**，
  红在 `await expect(page.getByRole("button", { name: "关系", exact: true })).toHaveCount(0)`（`:1158`）；改回 `true` 后复绿。
  **这里有一条要说准**：我本想同时量"单测那一层也挡着"，但 `pnpm exec vitest run … --root apps/web` 那次**退出码 254、一行汇总都没打**——
  按在册纪律那是"没跑成"，不是"没红"。所以本批只声明 e2e 这一头的变异证据；
  单测 `characterTabs.test.ts` 那两条断言（`visibleCharacterTabs(true)` 恰为 `info/stories/sprites`）是**既有**的，不冒领成本批的新证据。
- **这条线到这里收口的读数**：「待人工复核 15 条」= `listPublic` 1 + `recordView` 1 + `fork` 1 + `relationApi` 4 + `userApi` 6 + `versionApi` 2。
  现在每一条要么有界面级判据（`fork`→E48；`relationApi` 四条与 `versionApi` 两条→E49；`userApi` 六条与 `recordView`→E47/E44 那一页的缺席说明与零请求），
  要么分派点写在 §4 第五十七批那条里（`listPublic`：`CharacterSearchSelect` 的 S1 守卫 + `DiscoverCharactersTab` 只挂在整页早退的 `DiscoverPage`）。
  ⇒ **静态分母仍然是 15**（`cloud:callmap` 不知道这些判据存在），但"这 15 条没人看过"这句已经不再成立。
- 末轮读数：`pnpm e2e:desktop` **57 passed**（条数没变——加长的是同一条用例）、`pnpm gates` **0**（`test:unit` **706 passed + 1 skipped**）、
  `pnpm check:citations` **0**、`git diff --check` **0 行**、stash **0**、`.e2e-lock` 不存在、
  `characterTabs.ts` 的 `cloudOnly: true` 那 1 处已还原（`grep -c` = **1**，与变异前一致）。

同日第六十批（**`cloud:callmap` 加第十三段「调用者侧闸门审计」——按在册纪律先只读数、不挪档，两道判据各见过一次红**，2026-10-09，产品代码净零改动）：

- §6 那条"给工具加一档可达性判据（先量误报）"照做。第十段不知道 `{showSearch && !isLocalOnlyDeployment() && <GlobalSearch />}` 这件事，
  所以 `searchApi.global` 永远留在「桌面真会打出 20」那个保守上界里。**这一段只把这类挂载列出来给人读，一档都没并**（新判据首跑就并档，等于拿没验过的谓词改分母）。
- 读数（`LOADFACE=/tmp/inv59.txt pnpm cloud:callmap`，退出码 **0**）：有未守卫调用点的 .tsx 组件模块 **6** ⇒ 全部挂载都带闸门 **1** / 部分带 **0** / 一处都没带 **5**；
  唯一那一条贴出的是 `apps/web/src/shared/components/GlobalSearch.tsx ⇒ apps/web/src/shared/components/AppHeader.tsx:84 [showSearch && !isLocalOnlyDeployment() &&]`。
  ⇒ **这就是"先量误报"要量的东西**：如果这一档一上来就报出七八条，说明谓词太松；现在只有 E50 已经钉过的那一条，读得通。
- 谓词两条（不是"或"关系，别压成一个布尔）：闸门与挂载之间**必须有 `&&`**；中间**不许出现 `? : }`**。
  四条合成样本走的就是真实函数 `gateEvidenceBefore`，判到 `[true,false,false,false]`。
- **牙做了两头**：
  ① **拿掉规则那一头**——把 `AppHeader.tsx:84` 的 `!isLocalOnlyDeployment()` 删掉 ⇒ `全部挂载都带闸门 1 → 0`、
     控制位"GlobalSearch 必须在'全部门被挡'里"**失败**、退出码 **1**、`UNRELIABLE` 那句照打（消失告警是真的会响）；
  ② **放宽限制那一头**——第一次只删 `[?:}]` 那行，**自测照样绿**：因为我原先那条三元样本中间没有 `&&`，
     挡下它的是"`&&` 必须在闸门与挂载之间"，第二条判据**从没被行使过**。
     补一条 `cond && !isLocalOnlyDeployment() && other ? <Other /> : <Probe />` 的样本之后，
     用同一份放宽版（在 `/tmp` 的副本上跑，产品脚本没动）⇒ 判到 `[true,false,**true**,false]`、退出码 **1** ⇒ 第二条判据现在有样本压着了。
     **限度要跟着写**：`[?:}]` 这一支在**当前真语料里还没有样本**（6 个模块的挂载都是路由 `<Route element={…}>` 或裸挂载），
     它今天的作用是防御性的，不是分母性的。
- 末轮读数：`pnpm gates` **0**（`test:unit` **706 passed + 1 skipped**）、`git diff --check` **0 行**、临时副本 `/tmp/loose` 已删、
  静态分母照旧（调用点 16/37、待复核 15、桌面真会打出 20）——**这一段今天不改变任何档位**，这是设计如此，不是没生效。

同日第六十一批（**给玩家存档补界面级判据时，量到一条没归因的导航现象：URL 变了、界面没变——判据写成 skip，不写成品**，2026-10-09，产品代码净零改动）：

- 动因是任务 #64：`shared/storage/playerSaves.test.ts` 那几条量的是 provider 层（清单/读写/覆写同槽），
  **界面级一条都没有**——"页面没触发自动存档 / 写错槽 / 分派口没接上"这一类没人挡。
- 判据草稿已写进 `e2e/desktop-http.spec.ts`（**E51**）：内存宿主里导一份示范作 → 进播放器 → 等防抖 →
  开「读档」面板 → 断言 `— 空槽 —` 的个数**恰好比槽位标签少一个**（自标定，不硬写 `MAX_SAVE_SLOTS`），
  外加"从没发过 `/api/v1/play/save*`"。计数交给 `toHaveCount(…, { timeout: 15000 })` 重试，
  因为自动存档是 **600ms 防抖 + effect 依赖 `view`**（打字机推进期间会重新计时），落库时刻不是固定值。
- **卡在下一步**：点「试玩」之后 `page.url()` 已经是 `/play/proj-0001`，但 `body` 的 innerText 还是工程页那一套
  （顶栏 Axiforge/STUDIO/发现/文档、侧栏 工作室/概览/剧本/道具/场景/角色、面板 结构·剧本·试玩 三标签与「序列 BEATS 7」），
  HUD 里 `aria-label="菜单"` 那颗始终不在 DOM。**文本里既没有「加载失败」也没有「空格继续」**——
  所以这不是 #61 那条已修的错报（那次的形状是 `load()` 三段各自错报），是**路由换了 URL 而界面没跟着换**。
  两颗同名入口都试过、同貌（工程页工具条那颗与大纲面板那颗，`to` 都是 `routes.play(id)`）。
- **处置纪律**：这条**没有**为了跑绿改成"断言界面还是工程页"（那是把现象钉成契约），
  也**没有**用 `waitForTimeout` 蒙一次。做法是 `test.describe.skip` + 把测量原文写在文档块里：
  `pnpm e2e:desktop` **57 passed | 1 skipped**、`pnpm typecheck` **0**。
- **归因欠的两件事**（都不该在本批顺手做）：① 真浏览器里手点一次能否复现（本机没壳，`pnpm e2e` 那半会写他 dev 库，仍在等授权）；
  ② 若是 PlayerPage 没挂载，要分清是 lazy 分块没到货、路由没重渲染，还是被错误边界吞了。
  ⇒ **任务 #64 按证据退回未完成**：它之前被标 completed 的理由是 provider 层判据齐了，界面级那半从没落地。
- 末轮读数：`pnpm e2e:desktop` **57 passed + 1 skipped**、`pnpm typecheck` **0**、`pnpm check:citations` **0**、
  `git diff --check` **0 行**、`.e2e-lock` 不存在、产品代码本批一字未改。

**第六十一批的更正（同日 14:53，两次测量都算数，不重写上面那条）**：

- **"URL 变了、界面没变"是我读得太早**。补一次结构诊断：点完「试玩」等外壳进 DOM 之后，`#root` 的唯一子元素 className
  就是播放器外壳 `min-h-screen bg-[#0a0a0f] text-white`，`a[href^="/studio"]` 数量 **0**、`BEATS` 字样 **不在**、`document.title=Axiforge`
  ⇒ **导航与卸载都是对的**，之前那次 `body` innerText 读到工程页那一套是**路由切换当口的旧快照**。
  教训归到在册那条：判"界面变成什么"要读**结构**（根元素 className / 上一屏的锚点数量），不是读整页文本的前几百字。
- **真正还没查清的**：`waitForSelector(".bg-[\\#0a0a0f]")` 通过、再对舞台 `(640,500)` 点一下之后，
  15s 内 `aria-label="菜单"` 仍然是 **0 个**；把 DOM 里"有名字的可点元素"整份列出来，
  里面既没有 HUD 那颗「菜单」、也没有 `PlayerStatePanel` 那颗文字「关闭」⇒ **`/play/...` 首屏在等什么**还没弄清（**待查，不是结论**）。
- **我从中推的一句已经撤回**：一度写成"那一屏的关闭键是个只有图标、没有名字的控件"——
  读了 `PlayerStatePanel.tsx` 的源码，那颗是**有文字「关闭」**的；"命名清单里没有它"推不出"它没有名字"（清单本身是被我过滤过的）。
- E51 因此**继续挂 `skip`**（不是挂路由的锅，也不是可及性的锅，是"首屏没弄清"的锅）。
  复量读数不变：`pnpm e2e:desktop` **57 passed + 1 skipped**、`pnpm typecheck` **0**、`pnpm check:citations` **0**、`git diff --check` **0 行**。

同日第六十二批（**E51 上线：桌面试玩真的把自动存档写进了本地库；顺带把"面板不自己刷新"这条量出来钉进判据**，2026-10-09，产品代码净零改动）：

- 上一批那句"首屏在等什么"当天就有了答案：**HUD 与系统菜单要等演出被推开**——`waitForSelector` 只等到的是外壳（`playerScreenClass` 挂在**每一个分支**上，含 loading/error，所以上壳不等于开播），
  再按一次 Space 之后 `aria-label="菜单"` 才进 DOM。之前三次试错分别栽在：读整页文本判界面（时序假象）、
  在元素不存在时直接 `innerText()`（**等满 30s 动作超时，把 60s 用例预算吃光，报出来是"浏览器已关闭"这种毫不相干的错**）、
  以及默认导入路径能与桌面标记共存（不能：导入要**没有**标记才开得出选择器，播放器要**有**标记才走本地）。
- 于是 E51 改用 **新建剧本 → 剧本轨写两拍 AXS → 保存**（E39 的同一流程）造可玩的工程，全程带桌面标记 ⇒
  这条判据同时能断言**零 `/api/v1`**（比上一版草稿更强：草稿不注入标记，只能断"没发存档类请求"）。
- 判据的形状（`e2e/desktop-http.spec.ts`，`test.describe("E51 试玩之后本地库里有自动存档（桌面态全程零云端请求）"`）：
  槽位标签计数自标定（实测 **6 格**，不硬写 `MAX_SAVE_SLOTS`）→ `— 空槽 —` 应少一个 ⇒ 自动那格真被写进。
  **两次采样**是这批最值钱的形状：A=面板开着等（第一次清单），B=关掉再重开一次（逼它重新取清单）。
  原因是实测出来的——**读档面板不会自己刷新**：面板开着等 20s，空槽数一直不动（上一版就是这么红的），
  而重开一次就能看见那条自动存档。这不是缺陷断言，是**把"必须重开才读得到"这条真实行为写进判据**，
  顺带登记一条待查：面板要不要跟着 `writeSaveSlot` 之后 invalidate（若要做，属产品决定，不属本批）。
- **牙**：给自动存档那段 effect 加一行"永远早退" ⇒ **1 failed**，失败信息把三条证据都打全了——
  `槽位 6 格，面板开着时空槽 6 个、重开之后 6 个（两种都没少到 5）；写档失败提示=没亮过（说明根本没尝试写）`；
  还原（`grep -c MUTATED` = **0**）后 **1 passed (5.4s)**。
- 末轮读数：`pnpm e2e:desktop` **58 passed**（57 + E51 转正，无 skip）· `pnpm gates` **0**（十五道；`test:unit` **706 passed + 1 skipped**；
  `[file-size]` 349 文件 0 越线；`[desktop-seams]` 9 接缝／有判据 6／真断言合计 99）· `pnpm typecheck` **0** ·
  `git diff --check` **0 行** · 产品代码本批净零改动（变异跑完即还原）· 未提交／未推送／未动 tag。


同日第六十三批（**E52：打完故事重进不再给续玩提示——变异查出它其实没盖住清槽，判据按实测改口**，2026-10-09，产品代码净零改动）：

- 桌面主玩法的存档今天有**两条**界面级判据：**E51**（推进一拍 → 读档面板里自动那格被写进）、**E52**
  （推进一拍 → 重进**有**续玩提示 → 打到结局 → 重进**没有**提示）。两条都带桌面标记走本地取故事，
  各自都能断"全程零 `/api/v1`"；E52 两次进入之间用 `goBack()`（SPA 历史导航）——
  **不能整页 `goto`**，`?storage=memory` 是模块态，一重载这份工程就没了。
- **E52 的变异量出它自己的边界**：把 `rtState.status === "ended"` 那一支短路成"永远不 clear" ⇒ **E52 照样 1 passed**。
  原因在 `apps/web/src/features/player/pages/PlayerPage.tsx:379`：续玩提示的前提是 `save.state.status === "active"`，
  结局写进去的那条本来就不是 active ⇒ "提示消失"由**状态门**提供，与 `clearSaveSlot` 无关。
  于是标题与文档块都按实测改口（**这条测的是"不再给续玩提示"，不是"槽被清了"**），并登记新的一条待决：
  **结局那次清槽在界面上今天没有可观测后果** —— 要么给它造一个读得到的形状（结局后、下一轮 600ms 写回前那扇窗口，
  或让面板区分"已结束"与"空"），要么这一支该不该存在要定档。**不擅删，也不假装它已被判据覆盖**。
- 建剧本那段在套件里是第 7 次重复（E17/E30/E31/E32/E38/E39 + 这两条）：**沿用本文件既有写法**——抽公共夹具会改到五条已绿的用例，
  属独立重构（判据是"改完七条全绿且计数不变"），不在本批顺手做。
- 末轮读数：`pnpm e2e:desktop` **59 passed**（零 skip）· `pnpm gates` **0**（十五道；`test:unit` **706 passed + 1 skipped**；
  `[file-size]` 349 文件 0 越线）· `pnpm check:http-inventory` **0**（`SPEC_URLS` 57 → **61**、`toHaveURL 正则` **25/25**、
  `ROUTES=25`、`UNMOUNTED=0`、`DESKTOP_UNIQUE=0`、`BROWSER_UNIQUE=20`、完全没证据 **0**）· `pnpm check:citations` **0** ·
  `pnpm typecheck` **0** · `git diff --check` **0 行** · 两次变异跑完即还原（`grep -c MUTATED` = 0、`grep -c 'false && rtState'` = 0）·
  未提交／未推送／未动 tag（`1b9ca06` 三引用重合）。

同日第六十四批（**E53：手动存档与删除存档在界面上真的落到本地库；变异一次到位，还原差点没做成**，2026-10-09，产品代码净零改动）：

- 桌面存档今天有三条界面级判据：**E51** 自动那格被写进 · **E52** 打完不再给续玩提示（**它测不到清槽**，见第六十三批）·
  **E53** 手动存进「存档 1」→ 该格从「— 空槽 —」变成有内容 **且长出「删除存档」那颗键** → 删除后回到基线。
  三条都带桌面标记走本地，各自断言**零 `/api/v1`** 与**零未捕获异常**。
- 形状：一次基线采样 + 一次写入 + 一次删除，每次读数都**关掉面板重开**（读档面板不自己刷新，E51 已实测）。
  基线不是"随便一个数"，而是断言出来的：`total>=3`、`empty == total-1`（自动占了 1 格）、**`del == 0`**——
  最后这条既是"删除键只随人工已填槽长出来"（`save && !isAuto`）的产品事实，也是下面那步的正控。
- **牙**：在 `manualSave` 里插一句"永远早退" ⇒ **1 failed**，失败消息把两次采样原样打出来
  （`{"base":{"total":6,"empty":5,"del":0},"saved":{"total":6,"empty":5,"del":0}}`）——空槽没少、删除键没长，两处都指回写入那一步。
- **这批差点自伤的地方，记下来**：变异与还原我分成两段 heredoc 跑，**还原那段有语法错、整段没执行**，
  于是产品文件带着 `if (true) return; // MUTATED` 继续往下跑了一整轮用例（当时的 `2 passed` 其实是在变异态下测的）。
  是收尾前那一次 `grep -c MUTATED`（返回 **1**）把它抓回来的。规则升级成：**变异与还原写在同一次执行里，
  中间任何一步失败也要走到还原**；回合结束前那条 grep 是硬门禁，不是可选检查。还原后 `grep -c MUTATED` = **0**、
  `git diff --stat` 对该文件为空，三条判据重跑 **3 passed**。
- 建剧本这段在套件里现在重复 8 次（E17/E30/E31/E32/E38/E39/E51/E52/E53 里各一份）——仍按本文件既有写法。
- 末轮读数：`pnpm e2e:desktop` **60 passed**（零 skip）· `pnpm gates` **0**（十五道；`test:unit` **706 passed + 1 skipped**；
  `[file-size]` 349 文件 0 越线）· `pnpm check:http-inventory` **0**（`SPEC_URLS` 61 → **62**、`toHaveURL 正则` **27/27**、
  `ROUTES=25`、`UNMOUNTED=0`、`DESKTOP_UNIQUE=0`、`BROWSER_UNIQUE=20`、完全没证据 **0**）·
  `git diff --check` **0 行** · `## ` 节标题 **8**（写本批前断言过 `## 5.` 只出现一次）· 未提交／未推送／未动 tag。

同日第六十五批（**E54：「对话回顾」这块本地读径有了两头判据；变异这次把还原写在失败也要执行的位置上**，2026-10-09，产品代码净零改动）：

- 玩家侧那几块面板（回顾 / 鉴赏 / 档案）在桌面上全是本地读径，此前**一条界面级判据都没有**。E54 先做「回顾」：
  `pushBacklog` 只在 `doProceed`（离开那一拍）里被调，面板读的就是这份 state。
- 判据写成**两头**，缺一头就不算证据：**开播时**打开面板要给空态「暂无对话记录」
  （没有这一句，"看见台词"可以由任何残留内容满足）；**推进一拍后**要在面板里读到原文「第一处开场。」，
  且空态 `toHaveCount(0)`。加零未捕获异常、零 `/api/v1`。
- **牙（这次按上一批的教训改了做法）**：给 `pushBacklog` 加"永远早退" ⇒ 红在 `expect(page.getByText("第一处开场。")).toBeVisible()`
  （`:1597`）。**变异与还原写在同一次执行里**，还原那一步用无条件顺序（不是 `&&` 链），跑完立刻
  `grep -c MUTATED` = **0**、`git diff --stat` 对该文件为空，再重跑 **E51–E54 → 4 passed**。
- **本批自己踩了一次已被在册的坑**：往判据的失败消息里写了 ASCII 双引号包住的词组（`那句"看见台词"`），
  直接把 spec 成语法错——症状是 `Unexpected token` + **Playwright 报「No tests found」**（不是"某条用例红"）。
  按既有纪律把引用改成「」即恢复。**教训是这条纪律要往前挪**：写带文案的断言消息时，引号一律用「」，别等编译报。
- 末轮读数（全部为还原之后重取）：`pnpm e2e:desktop` **61 passed**（零 skip）· `pnpm gates` **0**
  （十五道；`test:unit` **706 passed + 1 skipped**）· `pnpm check:http-inventory` **0**（`SPEC_URLS` 62 → **63**、
  `toHaveURL 正则` **29/29**、`ROUTES=25`、`DESKTOP_UNIQUE=0`、`BROWSER_UNIQUE=20`、完全没证据 0）·
  `pnpm typecheck` **0** · `pnpm check:citations` **0** · `git diff --check` **0 行** ·
  玩家侧判据现在四条（E51/E52/E53/E54）· 未提交／未推送／未动 tag。
- **这块剩下的**：「鉴赏」(gallery) 与「档案」(codex) 两块面板还要同样的两头形状；codex 在桌面是
  "如实说出来地缺席"（`PlayerPage.tsx:340` 那句 skipped-offline 说明），要钉的是**那句话出现在该出现的时候、
  且不发云端请求**——但它只在跨作品记忆真被请求时亮，需要一个带 codex 数据的剧本才量得到，成本比 E54 高一档。

同日第六十六批（**E55：播放器设置「按作品存」这句承诺第一次有了界面级判据；中途一次自己造的文件损坏与恢复**，2026-10-09，产品代码净零改动）：

- `shared/lib/playerSettings.ts` 的第一行注释写着「按作品存 localStorage」，此前**没有任何判据看着这句**：
  把 key 改成全局一个、或者改了不写回，界面上都读不出来。E55 走四步，每步一条会被变异打红的断言：
  ① 读到默认值 35；② 方向键把它改成 30（控件真连着 state）；③ **换页再进**还是 30（真写回并读回）；
  ④ **另一部作品**的播放器里回到 35（key 真按作品分开）。①④是彼此的对照：没有①，③可由任意初值满足；没有④，"按作品"这一半没人看。
- **第一次跑红在④，但不是产品的锅——是夹具撞了 key**：`createProject` 里那句整页 `goto` 会重置内存库，
  第二部作品又拿到 `proj-0001`，两部的 localStorage key 相同 ⇒ 读到 30 是**夹具行为**。
  改成"第二部走 SPA 导航（剧本列表 → 新建剧本）"之后 ④ 才在真隔离上成立。
  登记成一条通用限度：**在 `?storage=memory` 宿主里，任何"两个实体互不干扰"的判据都必须走 SPA 导航，不能用整页 `goto`**（id 计数会重来）。
- **牙**：把 `KEY(projectId)` 改成固定串 `…:global` ⇒ E55 红在④，消息照原样打出两值
  （`另一部作品继承了上一部的设置（读到 30，默认应是 35）`）；还原（`grep -c MUTATED` = **0**、该文件 `git diff` 为空）后
  **E51–E55 五条 5 passed**。变异与还原仍写在同一次执行里、还原无条件执行。
- **本批最贵的一次自伤，记下来免得再犯**：给 spec 插代码的 python 里我写了 `"\\n".join(...)`（该是 `"\n"`），
  于是**整份 1801 行的 spec 被折成一行**、每个真换行变成字面 `\n`。发现方式是 `pnpm typecheck` 报
  `Expecting Unicode escape sequence` + Playwright 报 No tests found。恢复做法（可复用）：
  整体 `replace("\\n", "\n")` 把 1732 个字面序列还原成换行，再针对**被一起误还原的字符串内转义**（8 处 `insertText("# 开场…")`）
  用 `"# [^"]*"` 的 DOTALL 匹配把内部换行重新收成 `\n`，`pnpm typecheck` 回到 **0**、`test.describe` 计数 29 未变。
  **教训**：改 spec 的脚本要先 `python -c` 打印"计划写入的行数变化"再落盘；一次写坏整份文件的成本远高于一次语法错。
- 末轮读数（全部在还原/恢复之后重取）：`pnpm e2e:desktop` **62 passed**（零 skip；玩家侧五条 E51–E55 全绿）·
  `pnpm gates` **0**（十五道；`test:unit` **706 passed + 1 skipped**；`[desktop-seams]` 9 接缝／有判据 6／真断言 99；`[dead-surface]` 闭包外 10 全在册）·
  `pnpm check:http-inventory` **0**（`SPEC_URLS=64`、`toHaveURL 正则` **33/33**、桌面臂 0／浏览器臂 20、完全没证据 0）·
  `pnpm typecheck` **0** · `git diff --check` **0 行** · 产品代码净零改动 · `1b9ca06` 三引用重合（未提交／未推送／未动 tag）。

同日第六十七批（**把 ADR-029 那行「验收」逐条按命令重量一次：四条里 2 达成 / 2 卡在决策与授权**，2026-10-09，代码零改动）：

- 做的是审计不是新判据。逐条读数写在 `docs/ADR/029-desktop-only-build-target.md` 的「补记 2026-10-09 16:02」，摘要：
  ① 「`/api/v1` 只剩测试宿主所需或为 0」= **达成**（raw **11 处 / 5 文件**；`check:apibase` 退出码 0，
  分类 **测试 9 / 注释 1 / 基址定义 1 / 越界 0**，剩的没有一处是运行期调用点）；
  ② 「桌面是唯一构建与发布目标」= **未达成**（`check:publish` 残差 4 在册：`vercel.json`、`docker-compose.yml`、
  CI 那行 `build:web && build:admin`，且 CI 无 desktop job）——动它要改共享流水线并以 S13-3 定档为前提；
  ③ 「gates 与新基线全绿」= **只对桌面臂成立**（gates 0、`e2e:desktop` 62 passed；`pnpm e2e` 那半没跑，写的是本机 dev 库）
  ⇒ 这句验收**不许笼统报"全绿"**，ADR 里已按两臂分开记；
  ④ 「`backend/` 已不存在」= **未达成**（定档问句：那 13 条 `baselines` 归谁）。
- 顺带把"桌面功能无回归"这半的**证据边界**写准：界面级判据到 E17–E55，但素材经 asset 协议到货、真壳里的落盘与像素
  两项在本会话这台无壳机器上**测不到**，所以那半句不能读成"全部功能都已验证无回归"。
- 末轮：本批无代码改动；`pnpm check:apibase` **0**、`pnpm check:publish` **0**（残差在册）、`pnpm gates` **0**、
  `pnpm check:citations` **0**、`git diff --check` **0 行**。

同日第六十八批（**`playerUnlocks` 从"零判据"变成 10 条单测：鉴赏解锁的落盘、去重、坏数据、按作品隔离**，2026-10-09，产品代码零改动）：

- 为什么是它：`apps/web/src/shared/lib/playerUnlocks.ts` 有 5 个导出函数、承载"鉴赏面板这件解锁了没有"整块读径，
  此前**一条判据都没有**（`check:seams` 看不见它——它不是平台分支；`check:dead-surface` 也不管它——它在闭包内是活的）。
  这类"活着的、没人测的本地读写"正是本次重构最容易留洞的一档。
- 判据写在 `apps/web/src/shared/lib/playerUnlocks.test.ts`（10 条）。两个刻意之处：
  ① vitest 的 web 档跑在 `environment: "node"`（**没有 localStorage**，这点在 `axspImport.rollback.test.ts` 头注里已记过），
    所以测试自带一份 Map 替身，并**同时断言返回值与写进存储的那份原文**——只断返回值会放过"返回对了但没落盘"；
  ② `collectGalleryAssets` 的夹具只桩 `beats[].script` 与 `scenes[].backgroundImage` 两处（它也只读这两处），
    用一次 `as unknown as StoryPackage` 并注明理由，不冒充类型校验。
- 断言清单：没存过=两份空清单 / 坏 JSON 退空不抛 / 一族不是数组就归零另一族照读 / 追加进各自的族**且落盘** /
  重复解锁只有一条且**不重新写盘** / 空路径不追加不落盘 / **按作品分开** / `saveUnlocks` 是整体覆盖 /
  bg→cgs、bgm→bgms 跨拍去重 / 场景背景也算 CG、缺字段指令不产条目。
- **牙**：把 `KEY(projectId)` 换成固定串 `…:global` ⇒ **3 failed**（其中两条正是"落盘"与"按作品分开"），
  还原（`grep -c MUTATED` = **0**）后 web **251 passed | 1 skipped**。变异与还原同一次执行、还原无条件跑。
- 末轮读数：`pnpm gates` **0**（十五道；`test:unit` **716 passed + 1 skipped**＝core 143 / axs 94 / editor-core 189 / **web 251+1skip** / admin 39；
  覆盖率 All files 98.74 与 96.97 两栏；`[file-size]` 349 文件 0 越线，新测试文件 110 行）·
  `pnpm check:citations` **0** · `git diff --check` **0 行** · 产品代码一字未改 · 未提交／未推送／未动 tag。
- **新文件要记得显式 add**：`apps/web/src/shared/lib/playerUnlocks.test.ts` 是**未跟踪**的（`git status` 里在 `??` 中），
  不 add 就永远不在树里——门禁在别的机器上会少这 10 条。

同日第六十九批（**本地身份与玩家设置三个模块从零判据到 20 条单测：`creatorId` / `playerToken` / `playerSettings`**，2026-10-09，产品代码零改动）：

- 为什么是它们三个：同一族"活着的、没人测的本地读写"。`creatorId.ts` 只有 23 行却被**二十余处** import
  （`projectSaves` / `assetPoolSaves` / `axspImport` / `storage/index` 都拿它当 `author_id`），
  `playerToken.ts` 是玩家存档的归属键，`playerSettings.ts` 的头注承诺「按作品存 localStorage」而此前只有点击层 E55 看着界面。
  三条都不被现有门禁覆盖：`check:seams` 只认平台分支，`check:dead-surface` 只管闭包外。
- 判据落在三份**同名**测试文件里（`creatorId.test.ts` 6 条 / `playerToken.test.ts` 6 条 / `playerSettings.test.ts` 8 条）。三个刻意之处：
  ① 与上一批同形：断言既读返回值也读**写进存储的原文**，专门挡"这次返回对了但没落盘"；
  ② 两个铸造分支各带一条**探针控制位**——先 `expect("randomUUID" in globalThis.crypto).toBe(true)` 再在另一条里断 `false`，
    这样"分支没走到"不可能伪装成绿灯。**踩到的坑**：`globalThis.crypto` 是 getter-only（`configurable: true`、`set` 不存在），
    `vi.stubGlobal("crypto", {})` 会直接抛 `TypeError`，只能用 `Object.defineProperty` 换值并在 `afterEach` 装回 getter；
  ③ 一条跨模块控制位：创作者身份与玩家 token 必须各占一个 key（`store.size` 断 2）。这条携带独有信息——见下面 M2。
- **五条变异，全部 byte-identical 还原，残留改动＝无**：
  M1 铸造后不写盘 ⇒ **3 failed**（落盘、空串重铸、无 uuid 分支的落盘各红一条）；
  M2 把 `creatorId` 的 key 塌成 `playerToken` 那把 ⇒ **只有 1 failed**，正是那条跨模块控制位（其余自洽断言全绿，说明不塌就没人看得见）；
  M5 `playerToken` 不写盘 ⇒ **3 failed**（含跨模块那条）；
  M3 读侧不合并默认值 ⇒ **1 failed**（缺字段补齐那条）；
  M4 默认值返回模块级那一份而非副本 ⇒ **1 failed**（"改它不许污染 `DEFAULT_PLAYER_SETTINGS`"）。
- 两条**特征化断言**（钉今天的事实，不是承诺，均未擅自改行为）：
  ① 存储被挡时：读侧 `catch` 退成默认值且静默，写侧**没有** `catch` 直接抛；身份侧退成一次性值且**每次调用都换一个**、一条也不落盘。
    桌面壳里 `localStorage` 可用性本机无证据、界面也走不到这一格，所以只登记不处置——要修就得先定"挡不住时该报错还是该缓存一个会话内身份"，那是定档不是工时。
  ② 设置合并对类型不设防：存 `{"bgmVolume": null, "textSpeedMs": "35"}` 就原样带出。今天唯一写入口是有类型的 `savePlayerSettings`，
    所以不可达；若将来出现迁移/导入往这把 key 写东西，这条就是"脏值会直通滑条与音量"的在册证据。
- 顺手复核一条在册限度（不是漏检，是设计）：`scripts/check-file-size.mjs` 用 `TEST_RE` **明确排除** `*.test.ts|tsx`，
  所以 `[file-size] 349 文件 0 越线` 这个读数不随新增测试文件变动，四份新判据文件都游离在 400 行闸门之外。
- 末轮读数：web **251 → 271 passed | 1 skipped**，`test:unit` **716 → 736 passed + 1 skipped**（core 143 / axs 94 / editor-core 189 / web 271+1skip / admin 39）·
  `pnpm gates` **0**（十五道）· `pnpm typecheck` **0**，并用 `tsc -b --listFiles` 证明三份新文件**确实在**类型检查面内（命中 **3**）·
  `[desktop-seams]` 读数**未变**（9 接缝／6 有判据／真断言 99——诚实标注：这一批的收益只在 `test:unit` 与这一族补洞，没有动接缝档）·
  `git diff --check` **0 行** · 产品代码一字未改 · 未提交／未推送／未动 tag。
- **待显式 add 的新文件现在是四份**：`playerUnlocks.test.ts`、`creatorId.test.ts`、`playerToken.test.ts`、`playerSettings.test.ts`（`git status --porcelain | grep -c '^??'` 现测 **45**，其余按在册纪律"无干净机械信号"不擅判归属）。

同日第七十批（**加固我自己上一批写的一条弱判据，并给端点配置与"跳过已读"两条本地读径补判据**，2026-10-09，产品代码零改动）：

- **先更正自己**：第六十八批那条「同一路径重复解锁只有一条，**且不重新写盘**」用的是 `expect(raw).toBe(before)`。
  设计本批变异时发现：重写同样内容得到的字符串与原串**相等**，`toBe` 比的是值——所以那一半当时根本没牙。
  已在替身里加**写入计数器**（`setItem` 自增），并给 `playerReadState` 同律那条也加上。
- **U2 是直接证据**（去重保留、只把"跳过写入"拿掉 ⇒ 每次都写一遍同样的值）：
  结果 `1 failed | 9 passed`，错误行 `AssertionError: expected 2 to be 1`，红的正是那条判据——
  同一条里的"只有一条"与"内容不变"两个断言都放行。**即：这一半的信息只有计数器抓得到，加固前它是假绿。**
  这条自纠同时意味着：`check:seams` 的"确有真断言"三层判据看不见这种弱判据（它数的是断言存在，不是断言能否失败）。
- 新增两份同名测试：`llmSettings.test.ts` 7 条 + `playerReadState.test.ts` 7 条。
  `llmSettings.ts` 值得测是因为它的读侧是 **fail-closed** 的（认不出的 `kind` 整份当没配），这正是本仓反复踩过的
  `?? 默认值` 静默兜底族的反面；`playerReadState.ts` 是「跳过已读」那份"哪些行算读过"的存储，此前界面侧无判据、模块侧也无。
- 断言清单（端点配置）：没配过=`null`（不是空对象，下游 `draftDispatch` 用它决定走不走模型）/ `kind` 不在白名单⇒`null` /
  缺 `baseUrl` 或缺 `model` 或空串⇒`null` / 坏 JSON⇒`null` 不抛 / **尾斜杠在读侧归一、写侧原样落盘** /
  往返保真且 key 里不含 projectId（头注承诺"跨工程跟着用户走"）/ `save(null)` 是 `removeItem` 而不是往里写字符串 `null`。
- 断言清单（已读行）：键是 `拍id:游标` / `markLineRead` 追加并落盘为**数组**（顺序即插入顺序）/ 重复标记不重新写盘 /
  坏 JSON 与非数组退成空 `Set` / 按作品分开 / **`lineKey(null, n)` 用 `?` 哨兵，且它与真 id 共用同一命名空间**（特征化）。
- 那条哨兵的可达性我查到底了：`currentLineKey` 只在 `view.waiting === "say"` 时生成（`PlayerPage` 的 `useMemo` 挡着），
  而 `say` 必然在某个拍内——`restore` 遇到 `currentBeatId` 缺失或指向不存在的拍会整份退回 `start()`（`packages/core/src/engine.ts` 里那条
  `if (normalized.status === "ended" || !getBeat(...))`）。所以今天撞不到，**只登记不处置**；
  我没有测"标题派生能不能产出恰好为 `?` 的拍 id"，这一格留作未验证。
- **七次变异各红一条、全部 byte-identical 还原、`git diff` 该目录为空**：
  L1 不校验 kind 白名单 / L2 `save(null)` 不删 key / L3 不剥尾斜杠 / P1 去掉"已读过跳过写入" / P2 哨兵 `?`→空串 / U1 去掉"已解锁跳过" / U2（上面那条）。
  第一次跑 U2 时锚点只吃了半块，插入后与保留下来的原行重复声明 `const next` ⇒ vitest 报 `Tests  no tests`——
  按在册纪律先辨「加载失败」与「断言失败」，改锚点为整块替换后才是上面那个数。
- 末轮读数：`src/shared/lib` 单测 **51 passed（7 个文件）**，web **271 → 285 passed | 1 skipped**，`test:unit` **750 passed + 1 skipped**·
  `pnpm gates` **0**（十五道）· `pnpm typecheck` **0** · `[desktop-seams]` **9／6／真断言 99（未变）** ·
  `[dead-surface]` 闭包外 10 条在册、面 **291**（新增两份测试文件各算一格）／闭包内 245 · `git diff --check` **0 行** ·
  产品代码一字未改，故未重跑点击层（`e2e:desktop` 沿用 16:06 那次 **62 passed**，理由：本轮改动不落在那批 spec 的扫描面上）。
- **口径更正（写给下一个读数的人）**：收尾自查时 `git rev-parse --short desktop-handoff-20260929` 打出的是 **tag 对象** `dbf1dde` 而不是提交，
  一度像"tag 被动过"。实际它是**附注标签**，peel 后 `%(*objectname)`＝`1b9ca06`、taggerdate 仍是 2026-09-29 21:46:26，三者未动。
  要比对这三个引用，请用 `git rev-parse --short 'desktop-handoff-20260929^{}'` 或 `git tag -l --format='%(*objectname:short)'`。
- **待显式 add 的新文件现在是六份**：上面四份再加 `llmSettings.test.ts`、`playerReadState.test.ts`（`??` 现测 **47**）。

同日第七十一批（**该族最后两格：`draftManager` 10 条 + `routeHistory` 7 条；并把自己一条没成立的怀疑核对掉**，2026-10-09，产品代码零改动）：

- `draftManager.ts` 是这族里唯一带**配额治理**的模块：索引只留 10 份、被挤掉的那份连正文一起删，而 `DraftRestoreDialog` 完全靠这份索引说话。
  `routeHistory.ts`（分支回想）此前只有点击层之外的零判据状态。
- 断言清单（草稿）：正文与索引一起落盘且**新的在最前** / 索引项名字按 `meta → anchor.name → anchor.essence → 未命名` 逐级退 /
  更新已有草稿时**正文覆盖、名字刷新、但索引位置不前移**（特征化）/ 第十一份进来挤掉最旧那份且**把它的正文一起删掉** /
  存储抛错时整块静默（不抛、`getIndex()` 空、`getLatest()` 为 `null`）/ `load` 与 `getIndex` 遇坏 JSON 各退 `null`／`[]` /
  `remove` 同删正文与索引项 / `clearAll` **只删索引里列出的正文**，脱离索引的 `axiforge_draft_*` 留在原地（特征化）/
  `CREATE_DRAFT_ID=create_new` 与 `editDraftId(id)="edit_<id>"` 是键的一部分（改了就等于全员丢草稿）。
- 断言清单（分支回想）：**`recordChoice` 不去重（选择是序列）而 `recordEnding` 去重（结尾是集合）**——两条律分开各钉一条，
  只测一个的话另一个被顺手改成同律也看不见 / `at` 用 fake timers 钉成记录时刻的 ISO 串 / 一族不是数组只归零那一族 /
  坏 JSON 退空 / `save` 整体覆盖 + 按作品分开 / **重复记 ending 仍会重写一遍存储**（不像 `unlockCg`/`markLineRead` 那样跳过写，靠上一批加的写入计数器才量得出）。
- **八次变异各有名有红、全部 byte-identical 还原、该目录 `git diff` 为空**：
  D1 取消裁剪⇒`expected […(11)] to have a length of 10`；D2 改成追加队尾⇒**4 红**（顺序／名字表／不前移／挤掉）；
  D3 去掉 essence 档⇒`['未命名','未命名',…]`；D4 把静默 catch 改成往外抛⇒`expected [Function] to not throw but 'Error: quota exceeded' was thrown`；
  D5 更新时挪到队首⇒`expected ['old','new'] to deeply equal ['new','old']`（这条证明"不前移"那条特征化确实有牙）；
  R1 `recordChoice` 改去重⇒长度 2 变 1；R2 `recordEnding` 不去重⇒2 红；R3 读侧不校验数组⇒`choices: '不是数组'` 直通。
- **我一条没成立的怀疑，核对后撤回**（写给下一个读者，省得重复走）：我以为"草稿存不上时 `DraftIndicator` 会说'✓ 已保存'"。
  实际链路是 `updateField` 置 `isDirty:true` → 防抖里 `draftManager.save` + `set({lastSavedAt})`，
  而 `markClean()` **只在角色真保存成功后**被调（`EditCharacterPage` 的 `handleSave` 里 `mutateAsync` 之后）——
  所以草稿写失败时界面停在「● 未保存」，不会假称已保存。
  真实的后果只有一条：**草稿静默丢失且没有任何提示**，表现是下次进来 `DraftRestoreDialog` 不再问你要不要恢复。
  同一族 hazard 在玩家侧已经有名字（`PlayerPage` 的 `reportSyncNotice`／`syncNotice`「本地进度未能保存（桌面：…）」），角色草稿侧没有——
  **这道不对称要不要补、按哪种形状补（`save` 返回 outcome 还是抛给调用方），是定档不是工时**；与 `navigator.clipboard` 那条同例，**本次只登记、不占 §6 的共享编号**。
- 末轮读数：`src/shared/lib` 单测 **68 passed／9 文件**（51→68）· web **285 → 302 passed | 1 skipped** ·
  `test:unit` **767 passed + 1 skipped**（core 143 / axs 94 / editor-core 189 / web 302+1skip / admin 39）·
  `pnpm gates` **0** · `[dead-surface]` 面 **293**（新增两份测试各算一格）／闭包内 245／闭包外 10 在册 ·
  `[desktop-seams]` **9／6／真断言 99（连续三批未变）** · `git diff --check` **0 行** · stash **0** ·
  三引用按 peel 取仍重合 **`1b9ca06`**（`git rev-parse --short 'desktop-handoff-20260929^{}'`）· 零产品改动故未重跑点击层。
- **至此这一族基本收口**（分母按命令取：`grep -l localStorage apps/web/src/shared/lib/*.ts` ＝ **9 个模块**，不是我心算的"七个"）：
  `creatorId` `draftManager` `llmSettings` `playerReadState` `playerSettings` `playerToken` `playerUnlocks` `routeHistory`
  这八个**全部有同名测试**；剩 `identityLink.ts` 一格（它读存储是为了拼身份，属云端举报通路，桌面态是否还走得到要单独查）。
  待显式 add 的新文件现为**八份** `.test.ts`（`??` 现测 **49**）。

同日第七十二批（**身份键字面量从八处手抄收成一处权威，并给这条归一配了双向判据**，2026-10-09，**这一批改了产品代码**）：

- 缺陷形状：`"axiforge.creatorId"` / `"axiforge.playerToken"` 两串字面量手抄在**四个文件八处**
  （`creatorId.ts` 与 `playerToken.ts` 是权威，`identityLink.ts` 四处写、`UserContext.tsx` 四处写/删）。
  一旦有人只改权威那一处（改名、加版本后缀），登录与恢复身份就会写进**孤儿 key**，
  而 `getCreatorId()` 读新 key 铸出一个全新身份 ⇒ 整个本地作品库按 `author_id` 变得不可见，界面上没有任何错误。
  现有门禁一条都挡不住：`check:seams` 不管（不是平台分支）、`check:dead-surface` 不管（在闭包内）、类型系统不管（两边都是 `string`）。
- 改法（值一字未改，纯结构归一）：`creatorId.ts` 导出 `CREATOR_ID_KEY`、`playerToken.ts` 导出 `PLAYER_TOKEN_KEY`，
  那八处改为 import 常量。收完后按 grep 复查：**两串字面量只剩权威模块与两份测试里的值钉**，调用方 0 处。
- 判据（`identityKeyAuthority.test.ts` 3 条 + 两份既有测试各加 2 条）：
  ① 除权威模块外 `apps/web/src` 不许再出现这两串——**模式从真相源运行时 import**，所以这个文件自己不含那两串，
    不会被自己的注释或字符串喂饱（在册教训：文本守卫的第一批客户是我自己）；
  ② 对照位·扫描面地板 `walk(SRC_DIR).length >= 200`（实测面 **255**，路径断掉会得 0 而让①退化成恒真）；
  ③ 对照位·权威模块确实带着这两串；
  ④ 两串键名各自的**值棘轮**（`expect(CREATOR_ID_KEY).toBe("axiforge.creatorId")`）——改名等于全员丢身份，必须是一次显式的、有点名的改动；
  ⑤ 恢复身份/注销的**往返**：按常量写、`getCreatorId()`/`getPlayerToken()` 读得回。
- **归一判据必须双向**（在册纪律）：
  M-a 真相源改名（加 `.v2`）⇒ **6 红**，红的正是值钉与那些用旧字面量核对落盘的断言，而①跟着真相源走、**仍绿**——
  这就是想要的分工：改名由"值钉"挡，抄回调用方由"扫描"挡。
  M-b 把 `UserContext.tsx` 一处写回字面量 ⇒ ①红且点名 `app/providers/UserContext.tsx`；
  M-c 把 `identityLink.ts` 一处写回字面量 ⇒ ①红且点名 `shared/lib/identityLink.ts`。三次变异全部 byte-identical 还原，
  收尾探针：两个调用方文件里字面量残留＝**否**、`CREATOR_ID_KEY` 值＝`axiforge.creatorId`。
- 过程中我自己踩了一次路径口径：`fileURLToPath` 给的是**带尾斜杠**的目录，`walk` 又用 `${dir}/${name}` 拼接 ⇒ 双斜杠让豁免集合永不命中，
  第一条扫描判据开局就红（红在"权威模块自己被记为越界"）。修法是 `replace(/\/$/, "")`，
  且**豁免按整路径而不是 basename**（同名文件遍布界面层时 basename 会误配，这条也在册）。
- 顺带登记一条事实（**不处置、不占共享编号**）：`identityLink.ts` 里 `linkCreatorEmail` / `restoreIdentityFromEmail`
  全仓**零 import**（只有 `reportContent` 被 `DiscoverProjectsTab` 用），而它们是云端身份绑定通路——
  这属 S13-3 判死名单该过的一格；本次只把它们的键引用收进权威，没有给"可能判死的函数"搭新测试设施。
- 末轮读数：web **302 → 309 passed | 1 skipped** · `test:unit` **774 passed + 1 skipped** · `pnpm gates` **0**（十五道，lint 0 warnings/0 errors）·
  `[dead-surface]` 面 **294**／闭包内 245／闭包外 10 在册 · `[desktop-seams]` **9／6／真断言 99** · `[file-size]` 349 文件 0 越线 ·
  **`pnpm e2e:desktop` 重跑＝62 passed／0 skipped（2.9m）**——本批动了 `UserContext.tsx` 等四个产品文件，按在册纪律不能只交门禁。
  未重跑 `check:http-inventory`：改动只是把字面量换成 import，**没有增删任何调用点**，且 62 条点击层判据各自断言了零 `/api/v1`。
- **待显式 add 的新文件现为九份** `.test.ts`（本批新增 `identityKeyAuthority.test.ts`）；`??` 现测 **50** 条。

同日第七十三批（**成对重取两道普查 + 把 README 里三处腐烂的抄数换回现测**，2026-10-09，零代码改动）：

- 为什么现在重取：上一批改过 `identityLink.ts` 与 `UserContext.tsx`，它们**就在云端调用的扫描面上**——
  按在册纪律，"沿用早先绿灯"对这一项不成立。跑法必须是成对的：
  `pnpm check:http-inventory`（输出留文件）⇒ `LOADFACE=<那个文件> pnpm cloud:callmap`，
  否则第十二段拿的是旧世界的运行时列。
- 读数**逐档与 12:47 / 14:18 那次全等**（这本身就是结论：归一只换 import，没有增删调用点）：
  六档 **11 / 9 / 34 / 27 / 6 / 8**（相加 95）／调用点 **53** ⇒ 有守卫 **16**（S1=8 / S2=0 / S3=8）、无守卫 **37**／
  宿主可达 **20 / 9 / 8 / 0**、端点级 30 = **6 / 24**、时机档 29 = **19 / 2 / 8**、静态×实测对账 = **见过 4 / 没见过 12**、
  第十三段 6 个 .tsx ⇒ 全部带闸门 **1** / 部分 **0** / 一处都没带 **5**／普查两臂 = 桌面 **0** 笔、浏览器正对照 **20** 个唯一调用点，
  `ROUTES=25`（解析）、`SPEC_URLS=64`、`toHaveURL` 正则 **33/33**、完全没证据的路由 **0**。
- **README 三处抄数腐烂已换回现测**（这是同一规律第三次应验：抄门禁打印的数就一定会腐烂）：
  死表面面 `285` ⇒ **294**（两行都改，带 16:37／16:47）、`check:citations` 已判定 `216` ⇒ **243**、歧义跳过 `37` ⇒ **18**（带 16:46）。
  其余带日期的读数（labels 205、seams 9/6/99、file-size 349、dispatch 32/26/6）本次复核**仍为真**，未改。
- `REFACTOR_DESKTOP.md` 补**第五十一次续做**条目，把第六十八…七十二批那段（为什么单独做这一族、分母怎么取、三次自我证伪、
  `crypto` getter-only 与 `fileURLToPath` 尾斜杠两个平台形状、归一的双向判据、末轮读数）收在一处。
- 写作过程中的自查：先写成"那 57 条判据"（按 web 单档 241→309 的差值重数＝**68**）、
  又写"键耦合已在第五十二次关闭"（下一段才是本段）⇒ **数量与交叉引用都要按命令/实际段落重数一遍**，不能顺着手感写。
- 末轮：`pnpm check:citations` **0**、`git diff --check` **0 行**、`.e2e-lock` 不在、三引用按 peel 仍 `1b9ca06`、未提交未推送未动 tag。

同日第七十四批（**把"六条链"补齐成今日读数，并把一条后端旧数逐文件归因到一字不差**，2026-10-09，零代码改动）：

- §6 顶部新加**「当前恢复点（16:51）」**那一段：一眼状态、九份待显式 add 的文件（逐份点名）、两条只观察不处置的新登记
  （草稿静默丢失 vs 玩家侧已有 `syncNotice`；`identityLink` 两个零 import 的身份绑定导出属 S13-3 一侧），
  以及仍欠的两次取数——都按成本排好，下一会话不必再把散落各处的复量行拼一遍。
- 补齐产物层与后端层（第七十二批改过 `UserContext.tsx`，构建层不能沿用旧绿灯）：`build:web` **0**（89 行产物；
  先 `stat` 过 `dist/index.html` 的 mtime 与本次同时，确认不是拿旧产物报新数）· `build:admin` **0** · 桌面 `cargo check` **0** · 后端 `pnpm test:api` **0**。
- **后端那条旧数归因完才敢写进文档**：今日 `-v` 收集 **34 文件／226 条**，其中**三个未被 git 跟踪的 in-flight 文件**贡献 **59 条**
  （`test_condition_vectors.py` 32 + `test_condition_matcher_vectors.py` 22 + `test_condition_family_support.py` 5）；
  **226 − 59 = 167**，与 10-01 的在册读数一字不差，也与那条"199"只登记了 32 条的批次自洽（167+32=199）。
  所以既不是回归、也不是我改坏的，是**另一支的产物进了收集面**。结论按树分开写：**HEAD 上 167，当前工作树里 226**；
  引用"后端全绿"必须说明是哪一份树，否则同一命令在两棵树上的两个读数都会被误读成回归。
- 未复验的一条如实标注：pytest 的库隔离本次没重测，沿用 #54 交付时的实测陈述（"dev 台账一字未变"）。
- 末轮：`git diff --check` **0 行** · stash **0** · `.e2e-lock` 不在 · `MUTATED` 探针 **0** · 三引用按 peel 仍 `1b9ca06`。

同日第七十五批（**文档↔实树机检：命令名零漂移，抓到一条活文档里的假文件名并另起带日期更正**，2026-10-09，零代码改动）：

- 为什么还要做一次机检：`check:citations` 只管 `` `路径:行号` `` 这种形式**存在且行号在范围内**，它不管
  ① 文档里承诺的**命令名**是否真在 `package.json` 里，② 不带行号的 `` `路径` `` 是否还在树上。用一个临时探针（跑完即删，不进仓）把这两面各量一次。
- 口径：26 份文档（README／两份根级＋`docs/` 与 `docs/ADR`）× 49 个真脚本名（根 + 各 workspace 包）× 文件全集 844（`git ls-files` 776 ＋ 未跟踪 68）。
  **① 命令名对不上＝0 条**（正则初版把 `pnpm install`、`pnpm -F` 也算进来，属 npm 内建与参数，已按名单排除——这是我自己探针的误报，先修口径再取数）。
- **② 路径面要分诊，不能直接报数**：初版给"204 条失效"，几乎全是 URL、`try/catch`、`0/22` 这类比例串——
  **写规则前先在真实语料上量命中率**这条又一次应验。收紧成"必须带已知扩展名且不是绝对路径"后得 50 条，逐类读过全部有解释：
  变异证据里刻意建了又删的探针（`__probe_*`、`.tmp-probe-*`、`netlify.toml` 那类"放进去就 FAIL"的夹具）、构建产物的哈希名（`index-D1fasm5k.js`）、
  `.axsp` **包内**成员名（`project.json`／`characters.json`／`input.json` 在归档里而不在树上）、ADR／日志按当时实态保留的历史路径、
  按在册纪律不入库的标定产物、以及技能目录里的外部脚本路径。⇒ **真失效 0 条**（除了下面那一格）。
- **抓到的那一格是活文档里的假文件名**：`docs/KERNEL_DESIGN.md` 第 168 行承诺"契约测试套件 `storage/contract.test.ts` 是一切实现的验收标准"，
  而 `packages/editor-core/src/storage/` 里**从来没有这个文件**——`contract.ts`／`contractPools.ts`／`contractAuthoring.ts` 只是**导出**套件，
  真正**跑**它的是 `packages/editor-core/src/storage/memory.test.ts`（`import { runStorageContractSuite } from "./contract"`），
  云端与 Tauri 两支由 `apps/web/src/shared/storage/` 那 **22** 个测试文件按各自契约面覆盖。
  处理方式按在册纪律：**历史句子不重写，另起一条带日期的更正**，并顺手指出 10-01 那次更正留下的"『contract.ts 跑双支契约用例』"也不准确（它是定义处不是运行处）。
- 一条限度要写清（否则这批读数会被误用）：文本级机检分不出"引的是历史"与"现状说谎"，上面那一格是靠**人读上下文**才定性的；
  所以这个探针**不进 `gates`**，也不升成门禁——它给的是候选清单，判性仍然要回代码。这与三道普查不进链是同一条理由。
- 末轮：`pnpm check:citations` **0**（改完文档重跑）· `git diff --check` **0 行** · 仓库树里没有新增探针（探针写在 `/tmp`，仓外）· 三引用按 peel 仍 `1b9ca06`。

同日第七十六批（**把普查第十二段那 12 条「静态判高」的端点逐条定性，并补上 E56 这两条从未按名守过的死入口**，2026-10-09，**动了 e2e 与文档，产品代码零改动**）：

- 为什么挑这条：`cloud:callmap` 第十二段自上线起就留着一句"这 12 条才是本段真正要逐条看的"，谁都没看完。
  它们是 S13-3 判死名单正缺的那一格——**要么桌面已被挡住（静态判高），要么桌面真会打出（残口）**，两种解释的处置完全不同。
- 取证方式：派一个只读代理逐条读消费者代码并**强制要求给出 文件:行号 + 那一行原文**，我把它四条最承重的结论自己复核了一遍
  （`UserContext.tsx:42` 的 `if (isLocalOnlyDeployment()) { setProfile(null); return; }`、`VersionPanel.tsx:27` 的
  `enabled: !isLocalOnlyDeployment()`、`CharacterSearchSelect.tsx:68` 的 `if (isTauriEnvironment())`、`DiscoverStatsBar.tsx` 确在死面基线 `:3`）。
  **代理的一处结论被我推翻**：它说"注销/邮箱恢复没有任何点击判据"——`ProfilePage` 那一页其实已有 **E36** 按名守着「保存昵称」与「导出我的数据」，
  只是没点过另三条的名。⇒ 新用例**不重复占面**，只补 E36 没守的那三条（净零新增那条纪律在这里正好用得上）。
- **结论：12 条全部 A 类，桌面 0 条真会打出**。机制分布：页面级早退 7／隐藏入口 3（relations 那三条）／调用者侧闸门 1（`/search/all`）／查询层闸门 1（版本回滚）。
  复合情形两条：`/characters/public` 的搜索腿靠的是 **`isTauriEnvironment()` 分派早退而不是部署判定**——
  **S13-7 删掉分派另一半时这层保护会一起消失**，这条应进 S13-7 的检查单（本批只登记，不动它）；版本回滚是"闸门＋藏入口"双层。
  顺带把普查那个"桌面 0 笔"从现象解释成了机制：应用级 provider 在桌面根本不发 `userApi.session`，所以静态与实测并不矛盾。
- **新判据 E56**（`e2e/desktop-http.spec.ts:324`，两半成对）：浏览器态三条动作按钮「绑定到当前账号」「用邮箱恢复旧账号」「注销账号」按名可见（正对照），
  桌面态三条 `toHaveCount(0)` + 「当前身份：」与「账户设置需要协作服务」在位 + 零 `/api/v1`。
  **牙**：把 `ProfilePage` 那句早退改成 `false && …` ⇒ **3 failed / 61 passed**，红的正是 E36 + E47 + E56 三条（这一页由三条判据合守，不是只靠早退那一行），
  还原 byte-identical。
- 读数：`e2e:desktop` **64 passed／0 skipped**（干净态 2.9m；62 → 64 就是 E56 的两半）· `tsconfig.e2e.json` 的 `tsc --noEmit` **0** ·
  `pnpm gates` **0**（十五道）· `check:citations` **0** · `git diff --check` **0 行** · 三引用按 peel 仍 `1b9ca06`、未提交未推送未动 tag。
  本批改了产品面的只有 e2e spec（`ProfilePage.tsx` 只被临时变异、已还原），故点击层是真跑过而不是沿用。
- **仍欠的两条**（下一批的候选，都不需要定档）：`/comments/*/report` 的**举报按钮**按名判据；`/discover?tab=characters` 里 tags 装载腿——
  后者需要普查带上 tab 参数，属取数口径扩展，不是新切片。

同日第七十七批（**`/tags/` 那条"普查看不见子视图参数"的缺口钉成界面级判据 E57**，2026-10-09，产品代码零改动）：

- 选形不选工具：这一格本可以改成"让加载面普查带 tab 参数"，但那会把一个**装载层仪器**推成点击爬虫，与它写在头的分工（普查＝装载、`e2e`＝界面与点击）冲突
  ⇒ 用已有的界面层形状答同一个问题，不加新工具。
- 事实来源是结构性的：`DiscoverPage.tsx:49` 那句 `if (isLocalOnlyDeployment()) return …` 在四个 tab 分支（`:89-92`）**之前**，
  所以 `?tab=characters` 那一支（`DiscoverCharactersTab` → `useTags` → `/tags/`）在桌面根本挂不上。
  而"读代码读出来的覆盖"正是最容易被后续改动悄悄破掉的那种，所以钉成判据而不是留在注释里。
- **E57**（`e2e/desktop-http.spec.ts:361`，两半成对）：浏览器态遍历四个 `?tab=`，断每一支的**搜索框占位符就是那一支的话**
  （`SEARCH_PLACEHOLDERS` 四个值各不相同）——这条正对照不可省：没有它，"整页空白也零请求"这种改动能让桌面那一半白拿绿。
  桌面态四个参数各访一遍，断「发现页需要协作服务」在位、四个占位符全部 `toHaveCount(0)`、每一支**各自**断零 `/api/v1`。
- **牙**：把那句早退改成 `false && …` ⇒ **2 failed / 64 passed**（E14 的 `/discover` 那条 + E57 桌面那一半），
  而 **E57 的浏览器态那一半在变异下仍绿**——红的确实是"桌面该挡住"这一条，不是页面被改坏。还原 byte-identical。
- 读数：`e2e:desktop` **66 passed／0 skipped**（64 → 66 就是 E57 两半）· `tsconfig.e2e.json` 的 `tsc --noEmit` **0** ·
  `git diff --check` **0 行** · `MUTATED` 探针 **0** · 三引用按 peel 仍 `1b9ca06`、未提交未推送未动 tag。
- **第十二段这 12 条现在的账面**：`/tags/` 那一格由"普查看不见"变成"界面级判据守着"，其余同上批那张表
  （早退 7／隐藏入口 3／调用者侧闸门 1／查询层闸门 1）。只剩 `/comments/{id}/report` 的**举报按钮**还没有按名判据——
  它挂在 discover 详情五页的评论区里，桌面被页面级早退挡着（E44 已量那五页零请求）；
  补它的难点是浏览器态那一半要**真有评论数据**才点得亮正对照，这个选择（造夹具 vs 用文案缺席做正控）留给下一批，
  我先把"不能没有正对照"这条约束写在用例名旁边，免得下一个人为图快写成恒真的一条。

同日第七十八批（**普查第十段的一处真判据缺陷：别名式整页早退全部看不见**，2026-10-09，改的是 `scripts/cloud-callmap.mjs`）：

- 起点不是"找活干"，是上一批留下的矛盾：我说 12 条全 A（靠读代码），而工具把 `useCommentThread` 放在
  「宿主不早退 ⇒ 桌面真会打出」那一档。两边不能同时对，所以我没有让文档盖过工具，也没有让工具盖过代码——去查判据本身。
- **根因**：`earlyReturn()` 要求守卫串**前面 24 个字符**以 `if (` 结尾。直接式 `if (isLocalOnlyDeployment())` 的匹配从调用本身开始，那条检查正好命中；
  而别名式 `if (localOnly)` 的匹配串（`ALIAS_USE`）**把 `if (` 一起吃进了匹配**，于是"前面"落到了 `if` 之前，永远不满足 ⇒ **所有别名式整页早退都被漏判**。
  这正是 `guardShape`（S1/S2/S3 那套）在第五十四批修过的同一个洞，当时只修了壳守卫档，没回头查第十段。
  修法：两种形状各测一次（`selfIf` 或 `prefixIf`），判定范围改取"这条 if 自己的块"（`blockPairs` 里第一个 `open >= p` 的块）而不是 `stmtEnd`。
- 读数：`判成"桌面早退"的路由页` **3 → 8**（新增五个：`/discover/characters/:id`、`/discover/items/:id`、`/discover/scenes/:id`、`/discover/topics/:slug`、`/author/:authorId`）。
  **五个 discover 详情页里只有 `/discover/projects/:id` 仍没被认出来**——它就是下面那个残点。
  **档位计数没动**（宿主不早退仍 20、早退档仍 9、端点级 24/6 不变）——⇒ 上一批"12 条全 A"的那个结论**没有被这次修正推翻**，
  修正的是"为什么工具不认"，不是"谁可达"。
- **顺手补了一条它自己该早就有的诊断**：那 20 条的档名写着"要人工确认早退覆盖这条路径"，却从不说是**哪条路由页**在驱动它，等于没法执行。
  现在每行带 `宿主[/discover/projects/:id]`（`不早退` 档存的就是驱动它的那几条，其余档存全部宿主，超过 6 条截断）。
  这条诊断一上线就指出了下一个残点：**`/discover/projects/:id` 仍被判"不早退"，而它的页面确实有深度 0 的 `if (localOnly) { return … }`**
  （`DiscoverProjectDetailPage.tsx:53`；四个兄弟页本次都被认出来了，只有它没有）。**成因我还没找到**，
  方向是保守的（上界虚高、不藏缺陷），且现在**输出里看得见**而不是靠人记住。复现：`LOADFACE=<普查输出> pnpm cloud:callmap`，看那一行的 `宿主[...]`。
- 复核：`diff` 旧输出只有"早退页 3→8"这一处实质变化（其余是新加的 `宿主[...]` 注）；`pnpm gates` **0**（脚本变长没顶到 `[file-size]`）；
  工具自带的控制位仍通过（`ProjectListPage` 依旧判"不早退"、`PromptExport` 依旧判"零引用"，否则退出码非 0）。
- 一句话限度：这一批改的是**读数工具的口径**，不是产品面；所以 `e2e:desktop` 那 66 条不需要重跑（无产品改动），
  但**普查读数本身已重取**，README 里"判成桌面早退的路由页 3 个"那句已随之改成 8 个并带 18:03 取数时间。

同日第七十九批（**上面那条"成因未找到"的残点查到底了：不是本段的判据问题，是共享遮蔽器不认正则字面量**，2026-10-09，改 `scripts/source-graph.mjs` + `scripts/cloud-callmap.mjs`）：

- 上一批我留了一句"方向保守、成因未找到"。这次不猜：把 `earlyReturnFrom` 拆成可自测的纯函数、加合成样本，再拿同一套代码去数**未闭合的 `{`**——
  一跑就露：`DiscoverProjectDetailPage.tsx` 遮蔽后仍有 **1 个未闭合 `{`，位置正是函数体那一行**。
- **根因**：`maskNonCode` 认行注释、块注释、三种引号，但**不认正则字面量**。该页第 139 行是
  `{playUrl.replace(/^https?:\/\//, "")}`，里面 `\/\/` 的尾部两个斜杠被当成行注释 ⇒
  **同一行之后的代码连那个 `}` 一起被抹掉** ⇒ 花括号从此配不平 ⇒ `blockPairs` 拿到的"函数体"退化成第 24 行那一个碎片。
  也就是说：这不是第十段一条判据的毛病，而是**所有建在遮蔽文本上的判据共用的那层真相源有洞**（块配对、路由解析、守卫形状、死表面、接缝、普查都用它）。
- 修法是给扫描器加一条正则分支：只有在**操作数位置**（前一个非空白字符是 `( , = : [ ! & | ? { } ; + - * % < > ~ ^` 之一）才把 `/` 当正则开头，
  吃到未转义的收尾 `/`（字符类 `[...]` 里的 `/` 不算收尾），并把字面量内容一并抹掉；碰到换行就放弃（说明那不是正则），交回普通扫描。
- **改完重取的账**（每一条都是命令读数，不是推算）：
  `判成整页早退的路由页` 8 → **9**（`/discover/projects/:id` 现在认得出来了）·
  保守上界「桌面真会打出」**20 → 16** · 「只在桌面会早退的宿主页里」**9 → 12** ·
  壳守卫档「有守卫」**16 → 17**（S3 早退 **8 → 9**）／「无守卫」**37 → 36** ·
  端点级（有未守卫调用点的）**30 → 29**、至少一处走得到 **24 → 23**、都走不到 **6** 不变 ·
  时机档 **29 → 28** 处（装载即发 19 → 18 / 点了才发 2 / 不明 8）、静态×实测对账 真见过 **4 → 3** / 没见过 **12** ·
  第十三段有未守卫调用点的 .tsx 模块 **6 → 5**（全挡 1 / 部分 0 / 没挡 **5 → 4**）· 六档 **11／9／34／27／6／8** 与端点定义 **95** 不变 ·
  `check:http-inventory`：`ROUTES=25`、`UNMOUNTED=0`、桌面臂 **0 笔**、浏览器臂正对照 **20 个**、`SPEC_URLS` 64 → **66**（就是 E56/E57 新增的字面量）。
  **方向要说清**：这次全部是"看见的代码变多"，其中**抹掉 `api.x()` 那种会把云端调用藏起来**，属于危险方向，不只是虚高。
- **牙齿**：给 `earlyReturn` 补了 **5 条合成样本**（此前一条都没有——这正是它连错两次没人发现的原因），
  其中一条专门是"同一行里有 URL 正则 + 别名式早退"的形状；四种判定：两种真早退要判出、两种"看着像守卫其实没挡住整页"（回调里包一行、别名只出现在依赖数组）不许判出。
  任一条判错就打 `UNRELIABLE` 并退出码 1。
- **全部门禁重量＝0**（共享遮蔽器一改动，凡建在它上面的判据都得重取）：`typecheck`／`test:unit`／`coverage`／`lint`／
  `check:purity`／`circular`／`size`（349 文件 0 越线）／`labels`（205 文件 0）／`dispatch`（6 文件 32 函数，形状 26/6 未变）／
  `citations`／`publish`／`seams`（9／6／真断言 **99** 未变）／`dead-surface`（面 294、闭包内 245、闭包外 10 在册）／`contrast`／`ui-source` **全绿**。
  两条基线一条没被顶开——说明这层修复只增加了可见代码，没有翻转任何既有判定。
- 探针（`probe-early.mjs`、`probe-brace.mjs`）**写在仓库根、已在本批删净**（`git status` 里 `probe` 命中 0），临时产物不留仓。

同日第八十批（**第十二段最后一格收口：`/comments/{id}/report` 的举报按钮有了按名界面判据 E58**，2026-10-09，只改 `e2e/desktop-http.spec.ts` 与文档，产品代码一行未动）

- 上一批写的「仍欠按名判据的一条」就是它。难点在**正对照要有数据**：`CommentRow` 里那颗键的渲染条件是 `onReport && !isOwner`，评论列表为空时屏幕上根本没有它（那时只有「还没有评论，来抢沙发吧。」）⇒ 桌面半那几个 `count 0` 全是空载。在册纪律：**缺席断言必须配"另一态它真该在场"**，而同页别的控件 substitute 不了——把评论区整块删掉时页面其余部分照样渲染，两条都白拿绿。
- **选形**：`e2e:desktop` 不起后端，浏览器臂原本只能验静态文案。这里用 `page.route` 就地应答三条通路（工程详情 GET、评论列表 GET、**举报 POST 本身**）。不选"用文案缺席做正控"，因为那种写法治不了恒真；夹具只活在测试层。**POST 也本地应答 ⇒ 一个字节都不出这台浏览器**：本机 :8000 上跑着他的 uvicorn、vite 把 `/api` 代理过去，所以这不是可选项而是前提（复核：`e58-project` 这类 id 不存在于他的库里，即便漏应答也只是 404 读）。
- **两头各见过一次红**（只证一头等于没牙）：M1 把 `DiscoverProjectDetailPage.tsx:53` 的整页早退改成 `false && localOnly` ⇒ 桌面半红在「公开剧本详情需要协作服务」那句，`1 failed / 1 passed`；M2 摘掉 `DiscoverCommentSection.tsx` 里 `onReport` 的接线 ⇒ 浏览器半红在 `getByRole("button", { name: "举报评论" })`，`1 failed / 1 passed`，**桌面半在 M2 下仍绿是预期的**（它断言的就是缺席）。两次都 byte-identical 还原（`diff -q` 对开工前快照），`false && localOnly` 与 `MUTATED` 残留各 **0**。
- **读数**：`pnpm e2e:desktop` **68 passed／0 skipped**（3.2m；66 → 68 就是 E58 两半，动了 e2e 规格所以整套重跑）· `gates` **0**（`test:unit` **774 passed + 1 skipped**、web 309 一字未动＝本批没写单测）· `check:http-inventory` **0**（`ROUTES=25`、`SPEC_URLS=66`、桌面 **0**／浏览器 **20**）· `cloud:callmap` 成对重取 **0** 且**逐档与 18:15 全等**（早退页 9、保守上界 16、早退档 12、端点级 29 = 6/23、时机档 28 = 18/2/8、对账 3 见过/12 没见过、第十三段 5 ⇒ 1/0/4）· `check:citations` **0**（已判定 250，本批两条新引用落笔后重量为 **252**）。
- **一处口径必须先说清，否则下一个人会把读数用反**：`SPEC_URLS=66` 没动**不等于**这条没增加覆盖。普查那第五腿只认 `goto` 的**引号字面量**，而这里用的是模板串 `` `/discover/projects/${E58_PROJECT}` `` ⇒ 扫不到（脚本自己的限度明写"报出来的'没测到'是上界"）。该路由本来就在 `CLOUD_ONLY_ROUTES` 里，所以分母不变是对的；**新增的是按名的点击判据，不是路由面**——要主张"覆盖变大了"不能拿 `SPEC_URLS` 当证据。
- **第十二段至此 12 条逐条都有界面级判据**：E56（账户三条）／E57（discover 四个 tab）／E58（评论举报），其余按四类机制分别由 E44（整页早退）、E48（藏控件）、E49（藏入口）、E50（调用者侧闸门）、E36 守着。剩下的都不是判据问题，是定档与授权：§6 那 12 条、`pnpm e2e` 那半（会写他的开发库）、真壳人工验收。

同日第八十一批（**把上面那句"逐条都有判据"从散文升成机检**，2026-10-09，新增 `scripts/desktop-cloud-judgements.json` + `cloud-callmap.mjs` 第十四段，产品代码一行未动）

- 动因是纪律本身：这句话今天只活在 README 与本节里，**改一次测试标题或删一条桌面半断言它就静默变假**，而明天读它的人（包括我自己）会当它是证据。散文承重的判据要抽成脚本——这一条今天第一次用在自己写的话上。
- 台账的**身份键用标题原文，不用 E 编号**（在册教训：编号会被重组，E20/E29 已成幽灵编号而断言仍在）。12 条端点 × 24 处证据引用，逐条走真实文件与剥注释后的真实标题文本。
- 匹配谓词 `sameEndpoint` 带**五条合成样本**，其中两条专门钉住"前缀不算覆盖"：`/comments` 挡不住 `/comments/${commentId}/report`、`/characters/{id}/relations` 挡不住 `…/relations/{relationId}`。放宽一档就会**让一条判据抵掉一整族**——这正是本项目已经付过一次钱的那类（整目录排除把分派口一起排掉）。
- 四条腿各挡一种失效，方向各不相同：台账读不出（缺失／解析失败／空）⇒ `UNRELIABLE` 退出 1；证据文件或标题找不到、同端点写两遍 ⇒ `FAIL` 点名；B 档多出一条没判据 ⇒ `FAIL` 点名；自测不成立 ⇒ `UNRELIABLE`。**台账多余只打印不判红**（端点掉出 B 档可能是量法退化，那种时候该问的是工具而不是裁台账）。
- **七次变异全部见过红**：① 删 E58 那条（无 LOADFACE）⇒ 只有写死的对照组红；② 同一条（有 LOADFACE）⇒ 覆盖腿点名 `/comments/${commentId}/report`；③ 删**另一条** `/tags/` ⇒ 点名 `/tags/`；④ 证据标题加一个字母 ⇒ 幽灵证据=1；⑤ 同端点写两遍 ⇒ 重复键=1；⑥ 谓词放宽成前缀互含 ⇒ 自测红（**而此时"没判据=0"照样打印**——只有合成样本抓住它，光看分母会被骗）；⑦ 台账文件改名 ⇒ 台账=0 条且 `UNRELIABLE`。每次还原 `diff -q` 对开工前快照，两个文件均 byte-identical。
- **本批新写的限度（是取到的，不是推的）**：覆盖腿只在给了 `LOADFACE` 时跑；没有它，删掉**任意一条**台账都不红，只有控制位那一条红。所以「gates 里的台账自洽」与「成对跑时的覆盖对账」是两件事，别把前者当后者用。
- 读数：`pnpm cloud:callmap` **0**（无 LOADFACE：台账 12／幽灵证据 0／重复键 0／对照通过，并明写"覆盖腿未跑"）· `LOADFACE=/tmp/b80-inv.txt pnpm cloud:callmap` **0**（B 档 12／没判据 0／多余 0，逐档与 18:15、18:36 三次全等）· `node --check` 通过 · `check:citations` **0**（README 那段落笔后重取）· `gates` **0**（见下面 18:48 复量行）。

同日第八十二批（**时机档「不明 8」逐条定性 + `check:dead-surface` 加第二档：多余的对外出口**，2026-10-09，改的是 `scripts/check-dead-surface.mjs` 与基线，产品代码一行未动）

- 定性结论（8 处，按机制分）：**5 处活在零外部读者的导出里**（`identityLink.ts` 的 `linkCreatorEmail`／`linkPlayerEmail`／`restoreIdentityFromEmail` ⇒ `identityApi.linkEmail`×2、`identityApi.resolve`、`userApi.updateProfile`、`userApi.resolve` 这些调用点**界面走不到**）——而 `UserContext.tsx` 里有同逻辑的第二份实现（`restoreFromEmail` 自己 `userApi.resolve` + 写两个身份键 + `reload`），这是本仓第三次撞上「一份逻辑抄两遍」；**1 处走得到但只在浏览器态**（`reportApi.create`，宿主是 discover 项目卡菜单那颗「举报」，桌面被 `/discover` 整页早退挡住）；**1 处是分派口的远端支**（`characterApi.export`，`characterExport.ts:57` 先判 `isLocal()`，桌面永不取它）；**1 处是装载类已被守**（`commentsApi.list`，E58/E44）。⇒ 这 8 条没有一条会在桌面真打出去，但它们**不是同一种"不会"**：前 5 条的成因是死出口，判死时该连同 `identityLink` 那三个导出一起摘，而不是只删端点。
- 于是这一档值得升成机检：**模块级死面看不见"活着的面包着死的口"**。`check:dead-surface` 加**第二档**（导出级，基线 `scripts/dead-export-baseline.json`）：实测 **24 条**多余导出口／闭包内 245 模块的 340 个具名值导出／参考池 424 文件。口径按在册纪律取**保守方向**——按名字数读者、保留字符串内容、参考池比导出面宽（含测试／`e2e/`／`scripts/`／admin／packages）⇒ **少判死不判死**；且这档说的是"对外暴露面宽了"，不是"函数死了"。
- 牙（三次各见过红，全部 byte-identical 还原）：新增一个没人 import 的导出 ⇒ `FAIL` 点名 `identityLink.ts :: b82ProbeUnused`（同时第一档仍 `OK 闭包外 10`）；从基线删一条在册项 ⇒ 点名那条；把 `refCountIn` 退化成恒有读者 ⇒ 合成自测 **2/4** 且对照组失败 ⇒ 退出码 1。另有一条基线不在的腿也实测过红（`UNRELIABLE —— 第二档基线不在`）。
- **本批踩到并自纠的一个工具坑（值得记住）**：取 T1 的牙时我写了 `io.open(文件,"w").write(io.open(文件).read()+…)`——**`"w"` 先截断，内层 `read()` 读到的是空文件**，于是 `identityLink.ts` 被写成空壳，门禁报「闭包外模块 12 个（新增 `shared/api/identity.ts`、`report.ts`）、导出面 335、对照组失败」。第一反应像"图判据对文件内容敏感"，插了临时诊断（`B82_DBG`，用完删净）复测同一改动 ⇒ `files=294 reach=245 idlIn=true`、第一档 `OK` ⇒ **异常是我的写入造的，不是判据造的**；同时也说明第一档的牙真会在依赖边消失时点名孤儿模块。每次写前都 `shutil.copy` 了快照并 `diff -q` 复核，产品文件零损失（与本轮开工前快照一字不差，第七十二批的 `CREATOR_ID_KEY` 六处引用都在）。教训：**变异脚本里读同一文件必须先读进变量再开 `"w"`**。
- 读数：`pnpm gates` **0**（仍是十五道，第二档长在 `check:dead-surface` 里、**没新增命令**；`test:unit` **774 passed + 1 skipped** 未变）· `check:citations` **0**（本段落笔后重取 **253**，新增那条 `characterExport.ts:57` 判定成立）· `node --check` 通过 · `git diff --check` 0 行 · `??` **52**（新增的 `scripts/dead-export-baseline.json`）⇒ **待显式 add 现为十一份**（九份 `.test.ts` ＋ 云端判据台账 ＋ 本档基线）。

同日第八十三批（**时机档「不明 8」里唯一界面真走得到的那条补成按名判据 `E59`**，2026-10-09，只改 `e2e/desktop-http.spec.ts` 与文档，产品代码一行未动）

- `reportApi.create` ⇒ `POST /report/` 的入口是卡片溢出菜单里那条 `role="menuitem"`「举报」（`DiscoverProjectsTab.tsx:150`）；挡着它的仍是**整页早退**（`DiscoverPage.tsx:49` 的 `if (isLocalOnlyDeployment())` → `CloudFeatureNotice feature="发现页"`），而普查的限度明写它不认"消费者级条件渲染"⇒ 这条一直留在保守上界里下不来。形状照 E58：浏览器臂必须**真有一张卡**才点得亮（列表空时屏幕上根本没有那颗 `aria-label="更多操作"`）。
- **只应答这条通路需要的两条**（发现列表 GET ＋ 举报 POST），这一页其它消费者（会话／健康检查）**不应答**、在浏览器臂里照常失败——本条不断言"浏览器臂零请求"，那不影响判据；"该页不该发请求"归 E14/E57 与桌面臂那一条。POST 本地应答 ⇒ 一个字节都不出这台机器（:8000 上跑着他的 uvicorn）。
- **两个新学到的 locator 形状**（都写成注释钉在用例里）：① `getByRole("button", { name: "更多操作" })` **不加 `exact` 会撞上两个元素**——卡片本身是 `<article role="button">`，它的可访问名由子树算出来、里面就含着那颗菜单键的「更多操作」；Playwright 的报错把第二支的 `aka getByRole(…, exact: true)` 直接递过来了，照抄即可。② 溢出键是 `opacity-0 group-hover:opacity-100`，Playwright 仍判它可见（可见性看 bounding box 与 `visibility`，不看 opacity），所以不需要 `force`。
- 牙（两头各一次）：M1 摘掉卡片菜单里那条「举报」⇒ 浏览器半红在 `menuitem` 不可见；M2 把 `DiscoverPage` 的早退改成 `false && …` ⇒ 桌面半红在「发现页需要协作服务」那句，`1 failed / 1 passed`（红的确实是该挡那一半）。两次都是**先读进变量再开写**（上一批那条截断坑的纠正生效）、还原后内容相等断言通过，`false && isLocalOnlyDeployment` 残留 **0**。
- **`SPEC_URLS` 这次动了：66 → 68**，且要说准为什么——它数的是**引号字面量的出现次数**，E59 两条臂各写了一次字面量地址（`/discover` 与 `/discover?storage=memory`，`?` 后被截断所以落回同一条路由）。**这不是"新覆盖了两条路由"**（两条都早已在 `CLEAN_ROUTES` 里）；与 E58 那次"读数 66 未变"合起来看：**同一个数字能被两种作者习惯推动，绝不能拿它当覆盖面证据**——覆盖面的证据是 `没有字面量导航到的路由=1 / 完全没证据=0` 那两档。
- 读数：`pnpm e2e:desktop` **70 passed／0 skipped**（3.3m；68→70＝E59 两半）· `check:http-inventory` **0**（`ROUTES=25`、桌面 **0**／浏览器 **20**、完全没证据 **0**）· `LOADFACE=… pnpm cloud:callmap` **0** 且逐档与 18:15／18:36／18:46 五次全等（早退页 9／上界 16／早退档 12／端点级 29=6/23／时机档 28=18/2/8／对账 3/12／第十三段 5⇒1/0/4／台账 12＝基线 12、没判据 0）· `pnpm gates` **0**（`test:unit` 774+1skip；第二档 24＝基线 24）· `check:citations` **0** · `git diff --check` 0 行 · 三引用 peel `1b9ca06`。
- 至此**时机档「不明 8」全部有归属**：1 条按名判据（本批）＋ 5 条死出口（第二档在册）＋ 1 条分派口远端支（`check:dispatch` 看着那个分派口）＋ 1 条已被 E58/E44 守。剩下的仍是定档与授权，不是工时。

同日第八十四批（**ADR-029 的「验收」四条同日第二次机械重量 + 一条"不造活"的决定**，2026-10-09，只改文档，代码一行未动）

- 先说**没做**的那件，因为它比做了的更值得记：`characterExport` 那条分派看起来还欠一条桌面点击判据，查下来**写不出诚实的形状**——「设定导出」按下去走 `saveBinaryFile`，注入桌面标记后那一支要 Tauri 的 save 对话框，chromium 里结构性开不出（E43 同一族）；改测「设定复制」那一半又正好撞进 clipboard 那格在册的不可判。两种写法都会变成"断言一个这台机器上量不到的东西"，所以**不写**，把它归到"只能由真壳人工验收关掉"那一格（ADR-029 补记第 4 条末尾）。
- ADR-029 四条验收的**本次读数**（已写进该文件的「补记 2026-10-09 19:17」）：① `grep -rn "/api/v1" apps/web/src`（排除 `dist`）＝ **11 处／5 个文件**，`pnpm check:apibase` 退出码 **0**（管道里取不到退出码，这次是把输出重定向到文件后单独取的），分类 测试 9／注释 1／基址定义 1／越界 **0** ⇒ **达成**；② `pnpm check:publish` 退出码 **0** 但自报残差 **4 条全部在册**，`ci.yml:69` 仍 `build:web && build:admin`、"desktop" 只在 `:8` 的分支过滤里、无 Rust/tauri job ⇒ **未达成，卡在决策**；③ `gates` **0** ＋ `e2e:desktop` **70 passed／0 skipped**（16:02 那次是 62），浏览器臂 `pnpm e2e` **仍未跑** ⇒ **只对桌面臂达成**；④ `backend/` 仍在，界面级判据区间从 **E17–E55 变成 E17–E59**，云端面第十二段 12 条＋第十三/十四段＋时机档「不明 8」全部有归属且"有归属"这句话本身已机检 ⇒ **未达成，但第二半的证据强度换了档**。
- **一条口径警告写在补记结尾**：**没有一条验收因为"加了判据"而被视作达成**；两条未达成的都卡在决定与授权。谁把"证据变多"读成"快收尾了"，要连着看第 2 与第 4 条。
- 读数：本轮**未跑** `gates`／`e2e`（只改文档），沿用 19:12／19:13 那两条；`check:citations` 落笔后重取（见下面复量行）· `git diff --check` 0 行 · 三引用 peel `1b9ca06`。
- 至此**非决策矿脉是真的见底了**：还能做的只剩三类——(a) 你定 §6 那 12 条之一（我可以直接把选定那条落进 ADR 与门禁），(b) 授权 `pnpm e2e`（会写你的开发库）或真壳人工验收（关掉④的两格），(c) 我把已有判据继续做**结构整理**（不新增能力，收益递减）。

同日第八十五批（**待决 ⑩ 的地板那一档：第二组分支在发射时丢掉，现在会说出口**，2026-10-09，产品代码改动＝`packages/axs/src/print.ts` ＋ `apps/web/src/features/studio/cut/MiniAxsEditor.tsx`）

- 为什么这一档**不算替你定档**：三种修法（并进第一组＝改叙事语义／扩语法＝动语法冻结面／发射侧给诊断）里前两种都在清单上等人选，而"把已经发生的丢失说出口"不改变任何语义、也不关掉那条待决——它和已批准的 `[intro] 不生效也不报错`、演出指令取值那两条同形，是**静默失效族的地板**。
- 实现：`printAxs(doc, { roles?, diagnostics? })` 多一个可选出参，一拍有 >1 组分支时 push 一条 `warning`（含拍名、几组、被丢掉几个选项、以及这一拍在输出文本里的行号），**输出文本逐字不变**；行号由打印过程中累计（`pushLine` 数换行），所以编辑界面能钉在正确那一拍。UI 侧 `MiniAxsEditor` 把这一趟打印收下的诊断与解析诊断**合并后**一起显示——解析看不见这件事（文本里本来就只剩一组）。
- 判据 3 条（`packages/axs/src/roundtrip.test.ts`）：一组不响／两组必响且文本不变／多拍文档行号落在第二拍。**旧的那条特征化断言保留不改**（它是"这条曾经会丢"的凭据；定档之后**改写**而不是删掉）。`test:unit` 由 **774 → 777 passed + 1 skipped**（axs 94→97）。
- 牙（两头）：删掉那条 `emit` ⇒ **2 failed / 14 passed**（"两组分支：一条 warning" 与 "行号要落在…" 红，"一组不响"仍绿＝正确分工）；让发射器顺手把第二组也印出来 ⇒ **2 failed**（旧特征化断言 ＋ "带诊断的输出与不带的逐字相同"）。两次都还原 byte-identical。
- **一条如实登记的缺口**：`MiniAxsEditor` 那行合并显示今天**只有发射侧单测撑着，没有界面级判据**——谁把它删掉，`gates` 与 `e2e:desktop` 都不会响（与 `navigator.clipboard` 那格同例，不占 §6 共享定档号）。要补得先在编排台演出层造出"一拍两组分支"的真流程，属下一条 e2e 工单。
- 读数（动了共享文本层＋一个界面组件，所以全套重取）：`pnpm typecheck` **0** · `pnpm gates` **0**（十五道；`[file-size]` 349／0——`print.ts` 315 行、`MiniAxsEditor.tsx` 205 行都在限内）· **`pnpm e2e:desktop` 70 passed／0 skipped**（3.3m，改过界面组件必须重跑）· `check:citations` **0**（已判定 258）· `git diff --check` 0 行 · 三引用 peel `1b9ca06`。ADR-016 已加「补记 2026-10-09 19:31」，工单 #91 的说明同步改口（地板已交付，语义修法仍开着）。

同日第八十六批（**上一批登记的那行缺口当场关掉：`E60` 守住"发射侧诊断在界面上看得见"**，2026-10-09，只加 `e2e/desktop-http.spec.ts:2116` 与文档，产品代码一行未动）

- 判据对象要说准：**不是** warning 文案对不对（那是 `roundtrip.test.ts` 三条单测的活），而是**"发射器报的东西用户看得见"这一截接线**——上一批自己写的"删掉那行合并显示没人报警"就是本条存在的理由。
- 形状：建剧本 → 演出 → 「+ 分支」，先断**一组不响**（`toHaveCount(0)`，防噪音），再点第二次断那句「读不回来」可见；同屏正控用「AXS 片段」那一栏标题（证明诊断所在的那块真渲染了）；链尾照例 `hits === []`。
- 牙（两头，都还原 byte-identical）：① 把 `MiniAxsEditor` 的合并退回成只用解析诊断 ⇒ E60 红在 `getByText('读不回来')`；② 删掉发射侧那条 `emit` ⇒ 同样红。第二种是刻意的——它证明这条界面判据**真的依赖**上一批那个出参，而不是碰巧被别处的文案满足。
- 读数（动了 e2e 规格 ⇒ 整套重跑）：`pnpm e2e:desktop` **71 passed／0 skipped**（19:37，3.3m）· `pnpm gates` **0**（十五道，`test:unit` 777+1skip 未动＝本批没写单测）· `check:http-inventory` **0**：`SPEC_URLS` **68 → 69**（正是上一批立的规则：它数引号字面量出现次数，E60 多一次 `goto` 就 +1，与覆盖面无关）· `LOADFACE=/tmp/b86-inv.txt pnpm cloud:callmap` **0**（台账 12＝B 档 12、没判据 0、幽灵证据 0）· `git diff --check` 0 行 · `??` 仍 **52**（无新文件）· 三引用 peel `1b9ca06`。
- 纪律一条：**登记缺口就要在能关它的时候当场关掉**，否则"已如实登记"会变成一条长期挂着的美化说法。这轮的对照是 `navigator.clipboard` 那格——那一条是真不可判（本机无壳），所以它继续挂着是对的。

同日第八十七批（**Writer 主通路接上发射侧诊断，并给「保存把丢失固化进存档」那一刻加一条常驻说明：E61**，2026-10-09，动 `packages/axs` → `editor-core` → `apps/web` 三层 ＋ `e2e`）

- 上一批那条"不需要定档的下一步"本批直接做掉了。`draftToAxs` 的返回类型是 `string`，所以出参沿用 `diagnostics?: AxsDiagnostic[]` 这一支（与 `printAxs` 同形，仓库里已有先例），参数可选 ⇒ 既有调用方一字未改。链路：`projectToAxs(nodes, edges, scenes, roles, diagnostics?)` → `draftToAxs(draft, roles, diagnostics?)` → `printAxs(doc, {roles, diagnostics})`。
- 界面侧落在 `useProjectEditor`：新增 `projectionNotice` 状态 ＋ `ProjectEditorPage` 顶部一条 `role="status"` 常驻条。为什么不是 toast——**toast 会自己消失，而这条说的是存档里已经少了内容**。
- 两条腿的成立理由不同：**装载**那一腿只在"屏幕上显示的就是这次投影的结果"时报；**保存**那一腿无条件报，因为 `persistAxsProjection` 会把投影写回 `axs_source`，丢失就在这一刻进存档。
- 牙（`pnpm e2e:desktop -g E61`，变异后都还原 byte-identical）：删掉 `print.ts` 那条 `emit` ⇒ **E61 红**（`expect(locator).toBeVisible() failed`）——界面判据确实吃到了最上游那个出参。但**另两次变异都没红**：只删保存腿的赋值 ⇒ 仍绿；只删装载腿的赋值 ⇒ 仍绿。当时我把这读成"两条腿冗余"，第八十八批纠正了这条读法（见下）。
- 单测：给 `draftToAxs` 的出参加 2 条 ⇒ `packages/editor-core/src/projection/projection.test.ts` **32 passed**。
- **这批欠了一笔账，被下一批的门禁抓回来**：`useProjectEditor.ts` 因此从 ≤1081 长到 1109，`check:size`（G1 棘轮：只准变短）在第八十八批第一次 `pnpm gates` 里 **FAIL／EXIT=1**。取退出码时又踩到自己登记过的那个坑——包装命令最后一段是 `tail`，通知里的"exit code 0"是 `tail` 的，不是 gates 的。

同日第八十八批（**偿还那条棘轮：把装载档的判据抽成可单测的纯函数，顺手量出它漏掉的一档**，2026-10-09，动 `apps/web` 三个文件 ＋ `file-size-baseline.json`）

- 棘轮的处置写在它自己的报错里：**"按域外提成协作模块，不要在文件内继续堆"**。所以没去放宽 baseline，而是搬纯逻辑出去：
  - `projectWithNotice(nodes, edges, scenes, roles, storedSource)` ⇒ 外提到 `features/writer/lib/projection.ts`，hook 里那句散文判据变成可测函数。
  - `kernelEdgeFromRf` / `kernelNodeFromRf` ⇒ 外提到 `hooks/editorProjection.ts`（那个文件的头注释本就写明它的角色：从 hook 搬出来、好让用例钉得住的纯函数）。`sortOrder` 原先就地闭包 `rfNodes.length`，改成显式入参——`onDrop` 的依赖数组里本来就写着 `rfNodes.length`，语义一字未变。
- **抽的过程里量出一个真缺陷（已修）**：装载档的条件写的是 `!p.axs_source`，它把两种状态当成一种——(a) 存档里是 Writer 手写文本，屏幕上显示的是它而不是投影 ⇒ 报"投影会丢"确实是误导，该静默；(b) 存档里那份文本**就是上一次投影写回去的**（保存过之后再打开必然如此）⇒ 屏幕上少的正是投影丢掉的那一组，此时静默等于没说。修法是把判据写成它本来想表达的那句「屏幕上是不是投影」：`!storedSource || storedSource === text`。
- 判据：`apps/web/src/features/writer/lib/projection.test.ts` 加 4 条（无存档文本要说／存档文本＝投影仍要说／手写文本不报且文本一字不改／投影本身没丢则一律静默）。成对变异各打红**不同的一条**：去掉等值那半 ⇒「重新打开仍要说」红；把判据整体放开 ⇒「手写文本不报」红；两次都还原 `RESTORED_IDENTICAL=true`。这同时**纠正第八十七批那条"冗余"读法**：两条腿不是冗余，是各守一种存档状态；当时只删一处仍绿，是因为我只测了其中一种状态。
- baseline 收紧 `1081 → 1080`；跑 `--update` 前先量过安全性：14 条 entry 全部 `>400` 且当轮 0 违规 ⇒ 这次写回只可能收紧不可能放宽（`parse.ts` / `document.ts` 两行因已降到 400 以下被脚本自己移出，正是它自述的"拆完一段就把那行删掉"）。
- 行数读数：`useProjectEditor.ts` **1079**（`wc -l` 口径；脚本报 1080，差一在末行换行的数法）。

同日第八十九批（**E48 那次一现的红：归因到"两臂共用一个计数器"，并把桌面臂的监听器自己钉住**，2026-10-09，只改 `e2e/desktop-http.spec.ts`）

- 现象：第八十八批那次全量 `pnpm e2e:desktop` = **71 passed／1 failed**，红在 E48 的 `hits === []`，收到的请求是 `/api/v1/editor/projects/user/creator-<uuid>`。**单跑 `-g E48` 两次都绿**，随后整套复跑 **72 passed／0 failed**——一现、不可复现。
- 归因（静态证据链，不是猜）：
  - `new HttpStorageProvider` 全仓**只有一个构造点**——`apps/web/src/shared/storage/index.ts:163`，即分派的第三支，进它的前提是 `isTauriEnvironment()` 为假。
  - 页面渲染用的闸门 `isLocalOnlyDeployment()`（`apps/web/src/shared/lib/deployment.ts:13`）就是 `isTauriEnvironment()` 的别名（`apps/web/src/shared/storage/tauriSqlBackend.ts:33`）；E48 桌面臂那几个 `toHaveCount(0)` 与那条 link 的正控都过了 ⇒ 同一时刻该谓词为真 ⇒ **桌面那一页自己构造不出 HTTP Provider**。
  - 同一个 URL 形状正是 E48 **浏览器臂**该发的（`tab === "my"` ⇒ `author_id: getCreatorId()`），而两臂原本共用一个 `hits` 数组、靠手写 `hits.length = 0` 切窗口。`page.on("request")` 的事件经 CDP 异步投递，负载高时上一页已发出的请求可能在我重置之后才送达 ⇒ **计数窗口串味**，与观测完全一致。
- 修法（test-only，判据不降级）：浏览器臂的监听器在切到桌面臂之前 `page.off` **摘掉**，桌面臂挂**自己的**数组。摘掉而不是清零，是因为清零挡不住"已经上路但还没送达"的那一条。
- 顺手补了这条判据**自己的正控**：桌面臂最后发一条**不存在的** `GET /api/v1/e48-sentinel`（vite 上必为 404、无副作用），断言它被记到。少了这一条，`toEqual([])` 有可能绿在"根本没人挂监听器"上——那与"桌面没发请求"是两回事。最终断言改为只看**除哨兵之外**的条目。
- 口径影响要如实说：`/api/v1/e48-sentinel` 是**故意不存在**的路径，它会进 `check:http-inventory` 的 `SPEC_URLS` 字面量计数（那条口径数的是"规格里出现的 `/api/v1` 字面量次数"，不是覆盖面），所以 `SPEC_URLS` 会 +1 而**没有任何路由获得新证据**；它也不对应任何真实端点，`cloud:callmap` 的台账里不该出现它。
- 仍**未闭环**的一点：这次归因是"最符合观测的机制"，不是复现出来的因果。若它再红一次，正控会把方向直接指出来（哨兵在／请求来自哪一臂），不必再从 72 条里找。登记在 §6 待决之外的一条观察（不占共享定档号）。
- 顺手把 §6 那条"归一还是判死"的**证据补齐**（只补证据，不定档）：`identityLink.restoreIdentityFromEmail`（`apps/web/src/shared/lib/identityLink.ts:21`）与界面真在用的 `UserContext.restoreFromEmail`（`apps/web/src/app/providers/UserContext.tsx:73`，读者是 `apps/web/src/features/profile/pages/ProfilePage.tsx:163`）**不是同一份逻辑抄两遍**，逐函数体比过，差三件：
  - 查找回退深度：死的这份是**两级**（`userApi.resolve` 没命中再走 `identityApi.resolve` 的 links）；活的这份**只有第一级**，没有 profile 行就直接 `throw new Error("not found")`。⇒ 一个"有身份链接但没有 profile 行"的邮箱，今天从界面上恢复不了。
  - 失败形状：死的返回数组（可为空），活的抛错——两者对调用方是不同的契约。
  - 副作用：活的会 `setProfile` ＋ `window.location.reload()`，死的只写 `localStorage` 并返回链接。
  - 另外 `linkPlayerEmail` 只是 `linkCreatorEmail` 的别名（`identityLink.ts:17`），这一对才是"同一件事写两遍"。
  这条属 `S13-3 判死口径` 的弹药（身份/邮箱这条链整个挂在 `userApi`/`identityApi` 这两个云端点族上，桌面态要不要保留"第二级回退"是产品判断，不由我代拍）。

同日第九十批（**桌面态的云端回落从"日志里的猜测"变成程序可读的事实**，2026-10-09，动 `apps/web/src/shared/storage/index.ts` ＋ 它的单测 ＋ `e2e`，另含第八十七批那次"删一处仍绿"的纠正）

- 为什么要做这一条：上一批那条 E48 的红**只能静态归因**，因为"这一页到底挂了哪一支 Provider"在运行时不是一个可读取的事实。整场桌面化重构最忌讳的失效形状就是"不报错，只是存到别处去了"，所以把它做成事实，而不是下次再靠人读代码。
- 做法：`StorageProviderBranch = "memory" | "shell" | "cloud"` ＋ `getStorageProviderBranch()`；三支各在**进入自己分支的第一行**登记（壳支特意在 `await TauriAssetStore.create()` **之前**登记——真壳里建素材仓或播种任一步抛错时，"它确实试过壳支"这件事仍然留下，否则读到的还是 `null`，等于什么都不知道）。DEV 下同时写 `window.__AXIFORGE_PROVIDER_BRANCH__`，生产构建里 `import.meta.env.DEV` 被静态替换成 `false`，那个句柄连字面量都不留（与 `?storage=memory` 同一套既有纪律）。
- 判据两层：`index.test.ts` 一条用例走尽三支、各断一次支名（5 passed）；`E48` 桌面臂加**空载正控** `expect(branch).toBe("memory")`，红消息里同时打出支名——这条正控把"零云端请求"与"这页根本没挂上本地库、所以没人发请求"分开，后者原本会让那条断言**空着绿过去**。
- 牙（成对，同一条命令里跑完并断言文件还原 byte-identical）：把本地库支短路成 `false && import.meta.env.DEV` ⇒ `E48` **红在"Provider 必须走本地库支"**（1 failed）；还原 ⇒ **1 passed**，`BYTE_IDENTICAL=true`。这正是过去几批一直缺的那类证据：**不是"改了没坏"，而是"改坏了会红在该红的那一行"**。
- 顺带纠正第八十七批留在文档里的一条错读法（"两条腿冗余"）：见 §4 第八十八批那条——同一句话在两个时刻各写一次时，判冗余要先列出各自成立的存档状态，否则"只删一处仍绿"读出来的是我自己的测试面不足。

同日第九十一批（**普查自己把"零请求"的两副面孔分开：12 路由证明挂在本地库支，13 路由如实登记为"没问过工厂"**，2026-10-09，只动 `scripts/desktop-http-inventory.mjs`）

- 上一批把支名做成可读事实之后，这条腿立刻能写：桌面臂每条路由读完 `__AXIFORGE_PROVIDER_BRANCH__`，**问过工厂却没挂在 `memory`** ⇒ `REGRESSION`；两臂全都读不到支名 ⇒ `UNRELIABLE`（判据空转）；浏览器臂的支名同时当这条腿的**正控**（应为 `cloud`）。
- **我第一版的判据被自己的第一次运行当场证伪**（在册教训第 N 次应验）：我写成"`!== memory` 就是空载"，第一次跑就红了 13 条。事实是它们读出 `未登记`——**这些页面从来没问过工厂**：`/docs`、`/profile`、`/discover/*`、`/studio/dashboard` 这类路由的桌面缺席由整页早退与藏控件挡着，不由 Provider 支名挡着。过宽的 fail-closed 会把合法输入崩掉，这里改成分两档：**回落 = 缺陷，没问过 = 覆盖面事实**（打印 `BRANCH_EVIDENCE=12/25` 与 `没问过工厂的路由=13`，都不判红）。
- 真实读数（20:38）：`DESKTOP_BRANCH=未登记×13 ／ memory×12`、`BROWSER_BRANCH=未登记×24 ／ cloud×1`（浏览器臂绝大多数页面走的是**绕过分派的 `shared/api` 直连**，正是 `cloud:callmap`「绕过面」那一族的老账；只有 1 条真问了工厂）、`DESKTOP_UNIQUE=0`、`ROUTES=25`、`UNMOUNTED=0`、退出码 **0**。
- 成对变异（同一条命令内跑完并断言脚本还原 byte-identical）：把普查配置退回"只给标记、不给本地库" ⇒ 12 条全变 `shell`、`BRANCH_EVIDENCE=0/25`、退出码 **1** 并点名那 12 条。**这条把脚本头那句猜测变成了测量**：脚本 12 行注释早就写着"只注入标记时那个 0 是空载伪装成干净"，但直到今天它只是**推断**——现在它红了，且红在该红的那一条上。也正因为我上一批把登记放在**第一个 await 之前**，壳支随后必然失败也仍能留下 `shell` 这个事实。
- 限度（写在这里，别当成已覆盖）：`BRANCH_EVIDENCE` 只有 12/25。剩下 13 条的"零请求"目前由 `check:http-inventory` 的另两条腿（未挂载 ⇒ `UNRELIABLE`、两臂差分）与 `cloud:callmap` 的判据台账看着；要给它们也加上"这一页确实没走云端"的直接证据，得换一个探针（比如统计 `fetch` 调用而非 `/api/v1` 字面量），那是下一条的活。

同日第九十二批（**普查补上"跨源请求"这一档：桌面臂 0，且这条腿被见过红**，2026-10-09，只动 `scripts/desktop-http-inventory.mjs`）

- 动机是上一批留下的一个具体盲区：整套判据都在看 `/api/v1` 前缀，**绕开这个前缀的出站形状完全不可见**（绝对 URL、别的主机、本机模型端口——`S13-4b` 那条 OLLAMA 欠账就属于这一族）。现在两臂都按 `new URL(req.url()).host` 与 `BASE` 的 host 比，不同源就记 `host+pathname`。
- 读数（20:45）：`EXTERNAL_DESKTOP=0 ／ EXTERNAL_BROWSER=0`，`check:http-inventory` 退出码 **0**（其余档不变：`ROUTES=25`／`DESKTOP_UNIQUE=0`／`BRANCH_EVIDENCE=12/25`／`UNMOUNTED=0`）。
- 牙（成对）：把同源定义改成一个错主机 ⇒ 桌面臂立刻 `EXTERNAL_DESKTOP=379`、退出码 **1** 并点名（第一批名字就是 `localhost:5174/@fs/...`——vite 的模块与 `/@fs` 资源请求全都算"跨源"，**这条腿的成败完全押在 `new URL(BASE).host` 这一个表达式上**，这是它的限度，也是它为什么值得存在）；还原 ⇒ 0／0、退出码 0、脚本 `BYTE_IDENTICAL=true`。
- 本轮两次自伤都在工具层，登记以免下轮重犯：① 用 `Edit` 整段插入时把 `## 5.` 标题落到了错的节里，靠"标题唯一＋整行精确匹配＋前后行内容"三条断言的修复脚本搬回（第 1982 行），事后 `check:citations` 0／`git diff --check` 0 行；② `node -e '…'` 的单引号包体里嵌了单引号字符串，被 shell 截断成 `SyntaxError`＋`command not found`（**文件未被写入**，因为脚本在第一步就解析失败）——变异类脚本一律落成 `/tmp/*.cjs` 文件再跑。

同日第九十三批（**收束批：把"待显式 add 十一份"这个错口径当场纠正**，2026-10-09，只读审计＋本节文档，产品代码一行未动）

- 触发点：我在核对 §6 那条"待显式 add 仍十一份（九份 `.test.ts` ＋ 两份基线/台账）"时把它与实树机械对了一遍。读数：`git status --porcelain | grep -c '^??'` ＝ **52**，其中未跟踪的 `.test.ts` ＝ **23**（`apps/web/src/shared/lib` 9 ／ `apps/web/src/shared/storage` 7 ／ `packages/core/src` 4 ／ `packages/axs/src` 2 ／ `packages/editor-core/src` 1）。**所以"十一份"是错的**，它是我从第七十几批一路沿用下来的旧数，每批只加不减地挂在文档里——正是我自己登记过的那类腐烂。
- 更要紧的一类此前根本没被点名：**门禁脚本与它们的基线自己也在未跟踪里**。逐条看到的名：`scripts/check-apibase-literals.mjs`／`check-dead-surface.mjs`／`check-desktop-seams.mjs`／`check-doc-citations.mjs`／`check-publish-target.mjs`／`cloud-callmap.mjs`／`source-graph.mjs`、`scripts/ports.json`、`scripts/ports.d.mts`、基线 `dead-export-baseline.json`／`dead-surface-baseline.json`／`desktop-seam-baseline.json`／`doc-citation-baseline.json`／`publish-target-baseline.json`／`desktop-cloud-judgements.json`。**后果说准**：干净 clone 出来的机器（含 CI）不是"少几条测试"，而是 `pnpm gates` 整条链跑不起来——链上多个命令的可执行文件压根不在树里。
- 生产模块未跟踪的也有几份（`packages/axs/src/condition.ts`／`edges.ts`／`instructions.ts`、`packages/editor-core/src/axspImport` 侧的 `axsImport.ts`、`apps/web/src/shared/storage/shellSmokeGate.ts`、`apps/web/src/features/studio/components/ChoiceOptionsEditor.tsx`）＋ `testdata/axs-draft/unknown-speaker.json` 与 `testdata/conditions/` 整个目录。
- 归属仍**不可机械判定**（在册限度不变）：`Clearance/`、`docs/archive/`、`docs/README.md`、`backend/tests/test_condition_*.py` ×3 这些不是我这场的产物；`grep --include` 在 zsh 里静默失败、mtime 不足以区分 ⇒ **提交时必须由人点名，禁止 `git add -A`／`git add .`**（§7 原话）。
- 一条我认为该做但**不做**的：把 `check:http-inventory` 的跨源腿接进 `gates` 链。否它的理由不是省事——那条普查要起着 vite dev server 才能跑，而链的既有口径是"不含 build、不开服务"（在册设计决定，见 §5 与 `ADR-029` 的"链外普查"）。要接就得先把"谁来起服务"定下来，那是新的口径决定，不由我顺手拍掉。这条腿现在的形态是：链外命令，红过、也绿过，读数带时刻。
- 剩余的两条不需要定档的矿脉（下一轮直接可接）：① `BRANCH_EVIDENCE` 只有 **12/25**，那 13 条"没问过工厂"的路由需要一个新探针（数 `fetch` 而不是数 `/api/v1` 字面量）才能把分母做实；② `identityLink` 那三个死出口对 `UserContext.restoreFromEmail` 的**功能欠账**（第二级 `identityApi.resolve` 回退）证据已补齐，但"归一还是判死"属 `S13-3`。

**本会话收束（2026-10-09 20:52，会话在 60 回合处停车；树是干净可接手状态）**

- 恢复点现测：`HEAD == origin/desktop == desktop-handoff-20260929^{}` ＝ **`1b9ca06`**；未提交、未推送、未动 tag（按 §7）；stash **0**；`.e2e-lock` 不在；`git diff --check` **0 行**；`MUTATED`／`false &&` 探针残留 **0**；`??` **52**。
  **（刷新 2026-10-10 00:52，取代上一行的取数时刻，状态未变）**：`??` **52**、`git diff --check` **0 行**、stash **0**、锁不在、三引用 peel 仍 `1b9ca06`；本会话之后的改动只在 `scripts/desktop-http-inventory.mjs` 与文档 ⇒ `pnpm gates` 重取 **0**（`[seams]` 9／6／真断言 102、`[dead-surface]` 一档 10 在册／二档 344 出口、零读者 24＝基线、`[file-size]` 0 越线）、`check:http-inventory` **0**（`DATA_DESKTOP=0`／`DATA_BROWSER=20`）。
  **（再刷新 00:59，第九十五批末）**：新增 `pnpm check:tracked`（**不进链**，见 §4 第九十五批的理由）；`pnpm gates` 重取 **0**（十五道未变；`[file-size]` 349／0、`[doc-citations]` 已判定 **273**／不存在 0）· `pnpm check:tracked` **退出码 1**，面 19 个文件里 **10 个未跟踪**——这十条就是"让 `gates` 在干净 clone 上跑得起来"所需 `git add` 的**完整清单**，比 §6 之前那句"待显式 add 十一份"准确得多（那条已被第九十三批作废）。`??` 现测 53、`git diff --check` 0 行、stash 0、锁不在。
  **（01:10 收口：`check:tracked` 加了第三面之后，"该 add 什么"有准数了）** —— **16 个文件**：链面 10（`check-dead-surface`／`check-desktop-seams`／`check-doc-citations`／`check-publish-target` 四个脚本 ＋ `source-graph.mjs` ＋ 5 份基线）⊕ 编译面 6（`packages/axs/src/{condition,edges,instructions}.ts`、`packages/editor-core/src/axsImport.ts`、`ChoiceOptionsEditor.tsx`、`scripts/ports.json`，两面实测不相交）。**只 add 链面 10 个还不够**：编译面那 6 个不进去，干净 clone 上 `tsc -b`／`vite build`／两个 Playwright config 都起不来。读数：`pnpm check:tracked` 退出码 **1**（两条 `REGRESSION` 并排打印）、`pnpm gates` **0**、`git diff --check` 0 行、HEAD 仍 `1b9ca06`。
    **（01:15 更正上面那个 16：加了第四面之后是 17）** —— 本仓内需 add **17 个文件**＝链面 10 ⊕ 编译面 6 ⊕ 数据面 2，`scripts/ports.json` 在编译面与数据面各出现一次故去重。另外三面之外查出两条**不由提交解决**的事实，已在 §4 第九十五批末尾两条登记（那一批把"链面／编译面／数据面／仓外依赖"四面一次交付，故没有单独的"九十六批"标题——这句先前写错了）：① `backend/eval/calibrate.py`、`backend/sidecar/calibration.py`、`backend/sidecar/server.py` 三处**已跟踪后端代码按路径引用仓外未纳管目录 `Clearance/`** ⇒ 后端今天必须有隔壁那个目录才跑得起来（`S13-6`／`backend/` 退场决策的新证据）；② `apps/desktop/src-tauri/gen/schemas/desktop-schema.json` 是 Tauri 生成物，不在树里是正确状态，第四面用 `git check-ignore` 把它挡掉。此时 `check:tracked` 的退出码 1 打印四条 `REGRESSION`（链／编译／本仓数据／仓外依赖）。
- **复量 2026-10-10 01:21（第九十八批末；当前恢复点，取代 01:15／01:10／00:59 那几条）**：`pnpm gates` **0**（十五道；`e2e` 之外全套）· `pnpm e2e:desktop` **72 passed／0 failed**（01:21，3.3m——动了产品代码所以整套重跑，不沿用）· `pnpm check:seams` **0**（9／6／真断言合计 102／基线在册 3）· `pnpm check:tracked` **1**（四条 `REGRESSION` 并排，需 add 的点名清单 17 项）· `check:citations` **0**（落笔时 **274**，本节写完再取是 **275**——这一段每多一条 `路径:行号` 引用它自己就 +1，所以引用这个数必须带时刻）· `git diff --check` **0 行** · stash **0** · `.e2e-lock` 不在 · `MUTATED`／探针残留 **0** · 三引用 peel 仍 **`1b9ca06`**（未提交、未推送、未动 tag，按 §7）· `??` **53**（`check-chain-tracked.mjs` 是第 53 项）。
  **行数棘轮现状**：`useProjectEditor.ts` wc **1074**，`check-file-size.mjs --update` 已把它那一行从对 HEAD 的 1081 收到 **1075**（同一次 `--update` 顺手把别的超限文件按现值收紧，跑前照例量过安全前提：0 违规＋全部 entry `>400` ⇒ 只可能收紧）。**这条还账方式的差别值得记**：上一批是搬域外提，这一批是清自己写下的冗余（复用同一函数里已经算好的 `scenes`、把调用收成一行）——棘轮的红不一定都靠"再拆一个模块"解，先看看是不是自己刚加的重复。
  **上一版登记的"仍未闭环的一条"已在第九十九批当场关掉**：那一行 `setProjectionNotice(null)` 现在有界面级判据 **E62**（`e2e/desktop-http.spec.ts:2228`），并且**见过它的红**——摘掉那一行 ⇒ 断言停在 `Expected: 0 / Received: 1`。配方（为什么不能写成"删空 Beat"）留在 §4 第九十八批最后两条，别再照旧的写。
- **复量 2026-10-10 01:33（第九十九批末；当前恢复点，取代 01:21／01:15／01:10／00:59 那几条）**：`pnpm gates` **0**（十五道；`[file-size]` 349／0、`[desktop-seams]` 9／6／真断言 **102**／基线 3、`[dead-surface]` 一档 10 在册／二档 零读者 24＝基线、`[doc-citations]` 已判定 **276**／不存在 0）· `pnpm e2e:desktop` **73 passed／0 failed**（01:31，3.3m，桌面基线 72→**73**；动了规格所以整套重跑）· `pnpm check:tracked` **1**（四条 `REGRESSION` 并排，需 add 的点名清单 **17** 项）· 变异一次并还原：`cmp -s` **BYTE_IDENTICAL=true** · `git diff --check` **0 行** · stash **0** · `.e2e-lock` 不在 · `??` **53**（无新文件）· 三引用 peel 仍 **`1b9ca06`**（未提交、未推送、未动 tag，按 §7）。
- 在飞的活：无。九十二批的跨源腿与九十三批的审计都已跑完取数，没有半成品留在树里。
- **复量 2026-10-10 01:54（第一百批末；已被 02:04 取代）**：`pnpm gates` **0**（十五道；web 单测 **318 passed＋1 skipped**、editor-core **192**、`[file-size]` 349／0 且棘轮已 `--update` 收到 `useProjectEditor.ts` **1073**、`[desktop-seams]` 9／6／真断言 **102**、`[doc-citations]` 已判定 **280**／不存在 0）· `pnpm e2e:desktop` **74 passed／0 failed**（01:52，3.4m）· `pnpm check:http-inventory` **0**（`SPEC_URLS` **72**、`DATA_DESKTOP=0／DATA_BROWSER=20`）· `pnpm check:tracked` **1**（四条 `REGRESSION`，需 add **17** 个文件——这一条要等人授权才解得开）· `cloud:callmap`（带 `LOADFACE`）**0**（台账 12／没判据 0／幽灵 0）· `git diff --check` **0 行** · stash **0** · `.e2e-lock` 不在 · 探针残留 **0**（两次变异脚本都 `cmp -s` 还原 `BYTE_IDENTICAL=true`）· `??` **53** · 三引用 peel 仍 **`1b9ca06`**（未提交、未推送、未动 tag，按 §7）。
- **复量 2026-10-10 02:04（第一百零一批末；已被 02:22 取代）**：`pnpm gates` **0**（十五道；web 单测 **321 passed＋1 skipped**＝27 条 `projection.test.ts` 里含新三条 `noticeFor`、editor-core 192）· `pnpm e2e:desktop` **74 passed／0 failed**（02:04）· `check:citations` **0**（已判定 **284**）· `check:seams` 9／6／真断言 **102**／基线 3 · `check:size` 0 越线且棘轮收到 **1072** · `check:http-inventory` 与 `cloud:callmap` 沿用 01:52 那组（**本批未动普查脚本、未动云端面**，产品改动只有一条横幅的字符串组装与三处调用点）· `check:tracked` **1**（需 add **17** 个文件，等授权）· `git diff --check` **0 行** · stash **0** · 锁不在 · 探针残留 **0**（`cmp -s` 两次变异都还原 `BYTE_IDENTICAL=true`）· `??` **53** · 三引用 peel 仍 **`1b9ca06`**。

- **给下一次提交的建议（这是当前最该做的一个动作，且需要你点头）**：先按 `pnpm check:tracked` **现跑输出**逐条点名 `git add`（03:09 实跑：`待 add：` 共 **43 行**＝链面 10 ⊕ 编译面 8 ⊕ 本仓数据面 2 ⊕ 判据面未跟踪测试文件 24；此前各处写过的 17／41／"至少 40 条／23 份 `.test.ts`"都是旧读数，别再照抄——命令会一条条列出来），**不要**顺手 `Clearance/`、`docs/archive/`、`docs/README.md`、`backend/tests/test_condition_*.py` ×3（归属无机械信号，见上）。理由要说白：**门禁脚本没进树 ⇒ 任何干净机器上的 `pnpm gates` 都跑不起来 ⇒ "gates 0" 目前只是一台机器上的读数**，而"CI 无桌面 job"这条验收也因此还没有讨论资格。
- 定档清单仍 **12 条**（§6），其中唯一同时打开两条验收的是 **`S13-6`「那 13 条 `baselines` 归谁」**——它决定了 Python 编译器与 `backend/` 的退场路径，也就决定 ADR-029 剩下那两条能不能从"卡在决策"变成"可执行"。其次需要授权的：`pnpm e2e` 浏览器臂（会写你 :8000 的开发库，我一直没跑）、真壳人工验收两格（素材到货、落盘与像素）。
- 剩余矿脉为何"不是不动"而是"不该在此刻动"：`BRANCH_EVIDENCE` 那 13 条需要的是**换探针**（`fetch` 计数），不是补测试；先补会造出一批钉在错口径上的判据。`navigator.clipboard` 那一格本机无壳不可判，继续挂着是正确状态。

同日第九十四批（**取数请求按 `resourceType` 数：桌面臂 0，且写法再也绕不过去**，2026-10-10，只动 `scripts/desktop-http-inventory.mjs`）

- 上一批留的"换探针"那条当场做掉。前两道腿都押在**写法**上：`/api/v1` 前缀与主机名——同源、不同前缀的直接 `fetch("/search/…")` 两边都看不见。这一档按 `req.resourceType()` 数 `fetch`／`xhr`，URL 长什么样不重要，"这次是在取数"这件事数不掉。
- 读数（2026-10-10 00:44）：`DATA_DESKTOP=0 ／ DATA_BROWSER=20`，退出码 **0**。顺带一个此前没有的交叉证据：`DATA_BROWSER=20` 与 `BROWSER_UNIQUE=20` **相等** ⇒ 浏览器臂的每一次取数都在 `/api/v1` 前缀下，桌面侧判据盯的那个前缀今天确实覆盖了全部取数面（这是读数，不是永久事实，所以做成会红的腿而不是写成注释）。
- 牙（成对，脚本还原 `BYTE_IDENTICAL=true`）：把桌面臂的壳标记摘掉 ⇒ `DATA_DESKTOP=20`、退出码 **1**、逐条点名（`localhost:5174/api/v1/characters/inventory-probe` 等）；还原 ⇒ 0／20、退出码 0。另外这条腿自带**空转告警**：若浏览器臂一次取数都没数到（`DATA_BROWSER=0`），脚本直接 `UNRELIABLE` 退出 1——因为那说明探针本身没在工作，`DATA_DESKTOP=0` 就成了假证据。
- 上一批那个"13 条没问过工厂"的悬念，这一档给出的答案比我原本提的修法更强：**这 13 条路由在桌面臂里一次取数都没发生**（`DATA_DESKTOP=0` 覆盖全部 25 条，与是否调用 Provider 无关）。所以它们不再是"证据缺口"，而是"有正证的面"；`BRANCH_EVIDENCE=12/25` 继续作为**覆盖面事实**打印，不判红。
- 本批只动普查脚本，未动产品代码 ⇒ `gates`／`e2e` 仍沿用 2026-10-09 20:53 那组（树上产品代码一字未变，HEAD 仍 `1b9ca06`）；普查与引用对账按新状态重取。


同日第九十五批（**命令面可复现锁 `check:tracked`：把"干净 clone 上 gates 跑不起来"从散文做成会红的判据**，2026-10-10，新增 `scripts/check-chain-tracked.mjs` ＋ `package.json` 一条命令 ＋ 文档）

- 触因是第九十三批那句"门禁脚本自己没进树"——当时它只是我把 `??` 清单读一遍得到的**散文结论**。本批做成锁：链从 `package.json` 的 `scripts.gates` 解析（不写死道数），抽出每个 `node scripts/*.mjs`，再走它们的**相对 import 闭包**与源码里出现的基线 JSON 字面量，逐个 `git ls-files` 查是否已跟踪。
- 现测（00:57）：链 **15** 道；面 **19** 个文件＝已跟踪 **9** ／ **未跟踪 10**（`check-dead-surface.mjs`／`check-desktop-seams.mjs`／`check-doc-citations.mjs`／`check-publish-target.mjs` ＋ `dead-export-baseline.json`／`dead-surface-baseline.json`／`desktop-seam-baseline.json`／`doc-citation-baseline.json`／`publish-target-baseline.json` ＋ 共用真相源 `source-graph.mjs`）。**后果点名到命令**：`check:seams`／`check:citations`／`check:publish`／`check:dead-surface` 四道在干净 clone 上连文件都找不到 ⇒ 此前那句 "gates 0" 说的是这台机器，不是这个仓库。
- **刻意不进 `gates` 链**：它现在是红的，而解红只有一条路——把那 10 个文件逐条 `git add` 并提交，那需要授权（§7）。把一条"我这边解不了、只能等人"的红塞进链，等于教下一个人无视整条链（G1 棘轮当年就是为躲这件事才做成"只准变短"）。命令名与用途已写进 README 表，并写明"不进链"的理由，免得下一个人以为是漏接线；提交落地后它自己翻绿，那时再排进链。
- 牙（三条，成对跑完后断言脚本 `BYTE_IDENTICAL=true`）：① 判定自测两头——`scripts/e2e-lock.mjs` 必须被认成已跟踪、`scripts/__no_such_gate__.mjs` 必须被认成未跟踪，任一不符 ⇒ `UNRELIABLE`；② 解析出的道数 < 10 ⇒ `UNRELIABLE`，防"链没解析到于是全部已跟踪"这种假绿；③ **逐脚本核对 JSON 字面量有没有解到文件**——这条是被自己的缺陷逼出来的：第一版把 `join(root, "scripts/x.json")` 当脚本目录相对去解，静默漏掉 4 份基线，只报 6 个未跟踪。退回那个写法立刻显示"4 个可疑脚本／面里 JSON 只剩 2 个"并 `UNRELIABLE`；改回来是"10 个未跟踪／可疑 0"。**聚合计数对这两种写法看不出差别，逐脚本一比就露**——这是本批最值得留下的一条方法论。
- 加了**第二档：清单**（不参与判定）。它把全部未跟踪路径按目录形状分桶打印，现测 01:04：未跟踪 **53** 项＝单元测试 23 ／ 门禁与普查脚本 10 ／ 生产模块 6 ／ 基线与台账 6 ／ 非本战场（他人在飞／域外）4 ／ 文档 2 ／ 夹具 2 ／ **未归类 0**。这一档才是"该 add 什么"的完整清单（上一条的 10 个只是**让链断掉**的那批，取自 `package.json`＋import 闭包）。分桶只看路径不看作者——未跟踪归属在本仓没有干净机械信号，这句是 §6 的在册限度，不是本档能解的事。它自带一条腿：任何路径落不进桶 ⇒ `UNRELIABLE`，对照实验是**摘掉"文档"那一桶**就报"未归类 2"并响，装回去归零。
- 加了**第三面：编译缺口**（比链闭包更硬）。它只看一件事——**已跟踪源码里的相对 import，落点存在却没被跟踪**。现测（01:09）：**6 个模块、12 处引用** ⇒ `apps/web/src/features/studio/components/ChoiceOptionsEditor.tsx`、`packages/axs/src/condition.ts`、`edges.ts`、`instructions.ts`、`packages/editor-core/src/axsImport.ts`、`scripts/ports.json`。**后果比"少一道门禁"重得多：干净 clone 上 `tsc -b` 与 `vite build` 直接断，连 Playwright 的两个 config 都加载不了**（`ports.json` 是端口唯一真相源，被 `playwright.config.ts`／`playwright.desktop.config.ts`／`e2e/helpers.ts` 三处 import）。
- 两条腿各自独立打印，今天的树同时报 `REGRESSION（编译面 6）`＋`REGRESSION（链面 10）`，退出码 1。**"该 add 什么"因此有了准数：16 个文件**（链面 10 ⊕ 编译面 6，实测两面不相交）。清单档（53 项分桶）照旧只是清单、不参与判定。
- 这一面自己带对照组（`packages/axs/src/condition.ts` 必须在册、同样被 import 的 `print.ts` 必须不被报），不符即 `UNRELIABLE`；两处自己踩到又当场修掉的假阳性值得记下：**只认磁盘上真存在的那个落点**——第一版把无扩展名的原始说明符也当落点 ⇒ 225 个假缺口；第二版用 `existsSync` ⇒ `./editor`、`./components` 这类**目录名**命中目录本身又是未跟踪 ⇒ 10 个假缺口，改成 `statSync().isFile()` 才落到 6。牙（三次运行，脚本还原 `BYTE_IDENTICAL=true`）：把 `.tsx` 从候选扩展里摘掉 ⇒ **恰好丢 `ChoiceOptionsEditor.tsx`**（6→5、12→11 处），装回即复原；`.ts`/`.tsx` 换序读数不变（一个模块只存在一种扩展名，这条腿对顺序不敏感——是对的证据）。
- 与 `check:dead-surface` 的分工要说清：那道管"树里有哪些模块没人引用"（死面），这一面管"引用了却不在树里"（缺口），方向相反、判据不重叠，共用同一套"从入口走相对 import"的解析思路但各自独立求值。
- 又加**第四面：数据文件引用**（相对 import 只覆盖 `from "./x"`，fixture／端口表是字符串路径＋`readFileSync`，还有一半在 Python 侧）。它顺手挖出一条**架构事实**：`backend/eval/calibrate.py`、`backend/sidecar/calibration.py`、`backend/sidecar/server.py` 三处**已跟踪的后端代码按路径引用仓外未纳管目录 `Clearance/`** ⇒ 后端今天必须有隔壁那个目录才跑得起来。这条明确**不计入"该 add"**（那些路径本就不该进树，`Clearance/` 里还有 `.env`），单独一档打印，并作为 `backend/` 退场与 `S13-6` 决策的证据登记。
- 这一面的假阳性来源也记清：`git check-ignore` 必须单独处理——`apps/desktop/src-tauri/gen/schemas/*.json`（Tauri 生成物）"不在树里"是**正确状态**，报出来就成谁都不服的噪声；另外 `git check-ignore` 的退出码 **1 表示"一个都没忽略"**，直接 `execFileSync` 会把它当异常抛（第一版就这么炸过一次），只有 128 才是真错误。对照组三条常驻每次运行都跑：`scripts/ports.json` 必须在册、Tauri 生成物与已跟踪的 `file-size-baseline.json` 必须不被报——不符即 `UNRELIABLE`，所以这条面的对错不需要人再证一次。
- **收口成一个数**：`[chain-tracked] 并集：要让干净 clone 真能跑，需 add 17 个文件`（链面 10 ⊕ 编译面 6 ⊕ 本仓数据面 2，去重后 17；`scripts/ports.json` 同时出现在编译面与数据面）。命令会**逐条点名**打印这 17 行"待 add"，所以提交动作不再需要谁去翻 `git status` 猜。四条 `REGRESSION` 并排打印（编译面／本仓数据面／仓外依赖／链面），退出码 1。
- 结构上改掉一处自己刚写下的问题：腿原本串在 `else if` 链上，于是**今天的树只能看到最先响的那条，后面的腿永远走不到**——一条没被真实语料行使过的判据等于不知道它有没有牙。改成各腿独立求值、结论收进 `verdicts` 数组全部打印；对照实验里能同时看到 `UNRELIABLE`（清单分桶）与 `REGRESSION`（链／编译面）并排响，正是旧结构会吞掉后者的证明。清单档与判定档也分开：一个纯展示用的分桶不该把门禁拖成不可解释的红。

同日第九十八批（**空工程那条早退没清"读不回来"的说明；顺手再还一次行数账**，2026-10-10，动 `apps/web` 一处 ＋ 单测一条）

- 洞在 `useProjectEditor.ts` 的早退分支：`if (!scene && !projectNodes.length)` 那条路径**从没走投影**，也就从没动过 `projectionNotice` ⇒ 上一次装载留下的"这一拍有第二组分支，文本里读不回来"会挂在**一个空工程**上，说的话与屏幕上看见的东西无关。
- **可达性不是猜的**：删 Beat 走 `useProjectEditor.ts` 的 `deleteSelectedNode`（`window.confirm` ＋ `node.remove`），界面上的入口是 `NodeInspectorPanel.tsx:325` 那颗「删除整个 Beat」（`CutWorkspace`／`FlowWorkspace` 都接了它）⇒ 删空工程是真路径，不是一句防御。
- 修法是那**一行**（`setProjectionNotice(null)`，注释同行以免再涨行数）；权威侧补单测一条：`projectWithNotice([], [], [], {}, …)` 出默认开场文本且 notice 为 null（含"存档里已是这份默认文本"的第二次打开）⇒ web `projection.test.ts` 22 → **23 passed**。
- 加完这两处把 `useProjectEditor.ts` 推过 `check:size` 棘轮（`wc` 1081／脚本报 1082 > 1081）。这次没搬域，而是清了自己写下的冗余：装载那次调用收成一行并复用同一函数里**已经算好的** `scenes`（消掉 `p.scenes || []` 的第二次重算），`wc` 降到 **1074**，随后 `check-file-size.mjs --update` 把该文件棘轮收紧。
- **如实登记一处未覆盖**：那一行本身没有界面级判据。但**我原本打算写的那条用例是空的**——`saveAll`（那条保存；写作当时记成 `:842`，01:56 实测函数起在 `useProjectEditor.ts:755`、投影块那句 `if (!axsDirty)` 在 `:851`）在 `!axsDirty` 时会跑投影块，而空工程算不出任何诊断 ⇒ 它自己就把说明清成了 null；也就是说"删空 Beat ⇒ 保存 ⇒ 断言说明消失"**在有我这一行和没有我这一行时都绿**，是一条没牙的判据。真正只有那一行才覆盖的状态是**从另一条保存路径进空工程**：`saveWriter`（Writer 的「保存剧本」；写作当时记成 `saveScript`／`:748`，01:56 实测在 `useProjectEditor.ts:728`）只走 `axsToSyncPayload` ＋ `refreshProject`，**完全不进投影块** ⇒ 若此时存档里的图被收成 0 节点（例如把 Writer 文本改成不含任何 `#` 标题行的内容再保存），早退就是唯一能清掉说明的地方。要补的判据因此是：**先造出 E61 那条带说明的状态 → 切到「剧本」tab → 把文本改成零桥段 → 保存 → 断言顶部那条说明消失**（不是"删 Beat"）。在那之前不把这一行算成已覆盖。**（批注 2026-10-10 01:33：第九十九批按这句配方落地了 E62，摘掉那一行可见它红 ⇒ 这一行现在算已覆盖。）**
- 事故一条（自己的老坑第 N 次）：我用整行标题 `## 5. 最新验证与已知问题` 当 Edit 锚点时把它吞掉了，立刻按"标题计数＝1、位置在本文之后"重查并补回。**这类锚点规矩在册（别拿整行标题当锚点），踩过还踩**——所以每次动 §4/§5 边界之后都要跑一次结构回读，不靠记忆。

同日第九十九批（**上一批那句"没牙的判据"当场补成有牙的那条：E62**，2026-10-10，只加 `e2e/desktop-http.spec.ts:2228` 与文档，产品代码一行未动）

- 判据对象要说准：不是"空工程会清说明"这句常识，而是**只有装载档那条早退才覆盖的那个状态**——走 `saveWriter`（Writer 页的「保存剧本」，`useProjectEditor.ts:728`）把图收成 0 节点。上一批已经把配方纠正过一遍（`saveAll` 会自己清，所以"删空 Beat ⇒ 保存"是假判据），本批照纠正后的配方落地。
- 形状：建剧本 → 演出 → 「+ 分支」×2 → 保存 →（正控）断言那句「读不回来」在场 ⇒ 再切「剧本」tab、把文本框整体替换成一行不含 `#` 标题的旁白 → 保存剧本 → `toHaveCount(0)`。**先在场再缺席**两头都要，缺席条不能单独存在。
- 牙（见过红）：删掉 `useProjectEditor.ts:289` 那一行 `setProjectionNotice(null)` ⇒ E62 红在第 2261 行 `Locator: getByRole('status').filter({ hasText: '读不回来' }) / Expected: 0 / Received: 1`，退出码 **1**；还原后 `cmp -s` 断言 **BYTE_IDENTICAL=true**（还原后 wc 1072，本批末棘轮已 `--update` 收到 1073）。这条红同时反证了上一批的分析：如果 `saveAll` 真的覆盖了它，摘掉这一行应当仍然绿。
- 读数（动了 e2e 规格 ⇒ 整套重跑，不沿用单跑）：`pnpm e2e:desktop` **73 passed／0 failed**（01:31，3.3m，桌面基线 72→**73**）· `pnpm gates` **0**（十五道；`test:unit` 全绿未动＝本批没写单测；`[file-size]` 349／0、`[desktop-seams]` 9／6／真断言 **102**／基线 3、`[dead-surface]` 一档 10 在册／二档 344 出口·零读者 24＝基线）· `check:citations` **0**（落笔时**已判定 276**，本节写完还要再取——它数 `路径:行号`，本节每加一条引用它就 +1）· `git diff --check` **0 行** · stash **0** · `.e2e-lock` 不在 · `??` **53**（本批无新文件）· 三引用 peel 仍 `1b9ca06`。
- 顺手清掉一条**文档里的假引用**：§6 那句"已在 §4 第九十六批登记"指向一个**不存在的标题**——九十五／九十六／九十七三批是在同一个 `同日第九十五批` 标题下一起交付的（台账 #167 记的是三批，正文只写了一个标题）。已改成"第九十五批末尾两条"并写明为什么没有"九十六批"。这类事 `check:citations` 挡不住（它只对账 `路径:行号`，不对账批号），属于"引用形似证据、其实没落地"的另一格。
- 上一批留在 §6 的那行「仍未闭环」至此关掉；文档里不再挂"这一行没有界面级判据"。

同日第一百零一批（**一条横幅只印第一条告警＝把"这次丢了几处"吞掉了**，2026-10-10，动 `apps/web` 两处 ＋ 单测三条）

- 与第八十五批同一个家族、同一个方向上的**另一半**：发射器是**逐拍**报的（`packages/axs/src/print.ts:240` 那条 `if (choiceGroups.length > 1 && emit)` 每个丢失的拍各发一条，消息里写着「第「X」拍有 N 组分支」），而界面上只有一条常驻横幅，三处写入点都各自手写 `warns.length ? warns[0]!.message : null` ⇒ 三拍的丢失，用户读到的是**第一拍那一条**，且不知道还有别的。"把丢失说出口"不能只说到第一条。
- 改法是**收成一处权威**：`noticeFor(warns)`（`apps/web/src/features/writer/lib/projection.ts`）——0 条 `null`／1 条逐字沿用／多条时保留第一条原文并补「（这次投影共有 N 处读不回来的丢失）」。三个写入点（装载 `projectWithNotice`、物化 `openWriterAtSelection`、保存 `saveAll` 的投影块）**全部改走它**，顺带把那三份抄了三次同一个三元表达式收掉——这既是修缺陷也是消重复，不是新增形状。文本输出仍然一字未动（地板档没被越过去，待决 ⑩ 依旧不因此关闭）。
- 判据：`projection.test.ts` 新增 `describe("noticeFor…")` **三条**（没丢就不说话／一条时逐字不改写／多条时总数说出口且第一条仍在），web 该文件 24 → **27 passed**。牙：把多条那支退回 `return first` ⇒ 恰好「多处时把总数说出口」这一条红，另两条绿；脚本 `cmp -s` 还原 **BYTE_IDENTICAL=true**。
- 一条**如实登记的界面级缺口**（别再被算成已覆盖）：界面上"N 条告警同时出现"这一格今天**没有点击判据**。原因不是没想到配方，而是那个状态在本仓今天到不了：AXS 语法表达不了一拍两组选项（正因如此才有这条告警），所以两处丢失必须各自在画布上造——需要在流程画布里新增并选中第二个 Beat，再逐个放两组分支，而 e2e 里还没有"点选画布节点"这条通路的先例。已判的部分不受影响：横幅渲染的是 `noticeFor` 的返回值这一截由 E60／E61／E62／E63 各自在界面上证过；这一批改的是**字符串怎么组**，那一截住在权威函数里并被单测钉住。要补的界面判据＝「两个 Beat 各放两组分支 → 保存 → 横幅里既出现第一个 Beat 的名字、也出现『共有 2 处』」。**（批注 2026-10-10 02:22：这一格已由 E64 关闭——通路是先切「剪辑」工作台 tab、再按大纲行 `01 甲`／`02 乙` 选拍、每次选完重新点开右侧检查器的「演出」标签；原判据缺口的"到不了"读法是错的，缺的只是这条导航先例。）**
- 行数账：`useProjectEditor.ts` 因加 import 涨到 1073、越过 G1（脚本报 1074 > 棘轮 1073）。这次没搬域，把装载那次调用里`Object.fromEntries(...)` 的三行式收成一行（98 字符，同文件本就更长的行有成片）⇒ **wc 1071**；本批末 `--update` 把棘轮从 1073 收到 **1072**（跑前照例量前提：0 违规＋14 条 entry 全 `>400` ⇒ 只可能收紧、不会静默删档）。
- 事故一条（同一条老坑第三次）：我又拿**整行标题**当 Edit 锚点，把 `同日第一百批（…）` 那一行吞掉了，当场按「标题行数＝1、正文顺序」补回并复测。这条规矩在册（`MEMORY.md`：整行标题做锚点会吞掉该标题行），**第三次仍踩**——所以任何 §4 的写入之后都跑一次 `grep -c "^同日"` 与段落顺序回读，不靠记忆。
- 读数（树定稿后整套重取）：`pnpm gates` **0**（十五道）· `pnpm e2e:desktop` **74 passed／0 failed**（02:04，3.4m；本批没加新用例，桌面基线不变）· `check:citations` **0**（**已判定 284**／不存在 0）· `check:seams` **0**（9／6／真断言 102／基线 3）· `git diff --check` **0 行** · `??` **53** · 三引用 peel 仍 `1b9ca06`（未提交、未推送、未动 tag，按 §7）。

同日第一百零二批（**把上一批自己登记的那格缺口当场关掉：E64**，2026-10-10，只加 `e2e/desktop-http.spec.ts:2317` 与文档，产品代码一行未动）

- 判据对象：横幅上「共有 N 处」这一维。上一批把它登记成缺口时给的理由是"那个状态到不了"——**这条理由被测量否掉了**：到得了，缺的只是 e2e 里没人写过这条导航。
- 形状（三步都得写出来）：文本落两拍（`# 甲` / `# 乙`，parse 表达得了多拍、表达不了一拍两组）→ 保存剧本 ⇒ 前置断言横幅不在 → 切「剪辑」工作台 tab → **按大纲行 `01 甲` 选拍** → **点开右侧检查器「演出」标签** → 「+ 分支」×2 → 同样给 `02 乙` → 保存 → 断言横幅里出现「共有 2 处」且第一个拍名仍在，链尾零 `/api/v1`。
- 三次红各归各因，都靠 DOM 快照归因而不是猜：① `button {name:"演出"}` 在 Writer 模式下**根本不存在**（超时）；② `button {name:"甲"}` **撞上两枚**（大纲行 `01 甲` ＋ 时间轴片段 `title="甲 · 00:01"`，strict mode violation）；③ 选完拍再点 `+ 分支` 仍不可见——因为 `selectFlowNode` 会把面板切回「内容」，**每选一拍都要重开「演出」标签**。这三条都是选择器/导航事实，不是产品缺陷。
- 牙（成对，还原 byte-identical）：把 `noticeFor` 多条那支退回 `return first` ⇒ E64 红在第 2378 行 `notice.filter({ hasText: "共有 2 处" })`，退出码 **1**；`cmp -s` 还原 **BYTE_IDENTICAL=true**。
- 读数（树定稿后整套重取，动过规格所以不沿用单跑）：`pnpm e2e:desktop` **75 passed／0 failed**（02:22，3.5m；桌面基线 74→**75**）· `pnpm gates` **0**（十五道；`[file-size]` 349／0、`[doc-citations]` 已判定 **284**、`[desktop-seams]` 9／6／真断言 102／基线 3）· `check:http-inventory` **0**：`SPEC_URLS` **72→73**（E64 多一次 `goto`，口径是引号字面量出现次数，与覆盖面无关）、`DATA_DESKTOP=0／DATA_BROWSER=20` · `git diff --check` **0 行** · `??` **53** · 三引用 peel 仍 `1b9ca06`（未提交、未推送、未动 tag，按 §7）。

同日第一百批（**第三个投影时刻：打开「剧本」tab 那次物化把诊断整条丢了**，2026-10-10，动 `packages/editor-core` ＋ `apps/web` 四处 ＋ 判据四条 ＋ 文档）

- 洞不在文本层，在**接线**：`openWriterAtSelection` 每次调用都把"当前画布（含未保存编辑）"投影成 AXS 并 `setAxsSource(projected)`——屏幕上显示的就是这次投影的结果，可它走的 `projectAxsFromCanvas`（web）→ `projectAxsFromCanvas`（editor-core）→ `draftToAxs` 这两层**没把出参接上**（`draftToAxs(draft, roles)` 不交数组），于是丢失在这一趟发生、被用户看见、却一个字没说。装载那一腿盖不到（它看的是存档），保存那一腿也盖不到（用户还没保存）。ADR-016 上一节写的「两个时刻」因此是**漏了一个**，已另起补记。
- 判据是**先红后绿**写的（这次不是事后补牙）：E63（`e2e/desktop-http.spec.ts:2276`）在接通之前红在 `toBeVisible()`／`element(s) not found`，接通后绿。**配方挑得有讲究**：必须"两次「+ 分支」但不保存"，因为一保存说明就被保存那一腿点亮 ⇒ 有无本次改动都绿——这与第九十九批那条是同一个陷阱的另一面。
- 权威侧**分层各钉一条**（不是一个数）：editor-core 那条量最底层，web 那条量"中间这层有没有往上交"。两条各带正控（只有一组分支 ⇒ 诊断必须为空），各钉一条"文本与不传诊断时逐字相同"——地板档的意思就是**只把丢失说出口，不改输出形状**，待决 ⑩ 一条都不因本批关闭。
- 成对变异（各自只打红该打的那一层）：web wrapper 停止转发 ⇒ web 那条红（`expected '' to contain '读不回来'`）而 editor-core 那文件 33 条全绿、`cmp -s` 还原 **BYTE_IDENTICAL=true**；hook 里那句 `setProjectionNotice(...)` 摘掉 ⇒ **E63** 红。
- 行数账：加完 `setProjectionNotice` 那一行后 `useProjectEditor.ts` 越了 G1（脚本报 1076 > 棘轮 1075）。这次按门禁给的处置走——**搬域**：把就地拼画布快照的那 5 行收成 `canvasSnapshotFromKernel`（`editorProjection.ts`，纯函数，新 2 条用例含"不写回内核节点"与"`stageId` 为 null 时如实 null"），`wc` 落到 **1072**、棘轮 `--update` 收到 **1073**（跑前照例量前提：0 违规＋14 条 entry 全 `>400` ⇒ 只可能收紧，不会静默删档）。
- 读数（树定稿之后整套重取，不沿用）：`pnpm gates` **0**（十五道；`test:unit` 里 web **315→318** passed、editor-core **191→192**，另 `coverage` 档重跑同两个项目）· `pnpm e2e:desktop` **74 passed／0 failed**（01:52，3.4m；本会话内 72→73→**74**）· `check:citations` **0**（此刻**已判定 280**／不存在 0，本节写完还会再涨）· `check:seams` **0**（9／6／真断言 **102**／基线 3——搬域没动接缝的形状）· `check:http-inventory` **0**：`SPEC_URLS` **70→72**（E62／E63 各多一次 `goto`，口径是"引号字面量出现次数"，与覆盖面无关）、`DATA_DESKTOP=0／DATA_BROWSER=20`、`BRANCH_EVIDENCE=12/25` · `check:tracked` **1**（四条 `REGRESSION` 并排、需 add 仍 **17** 个文件）· `LOADFACE=/tmp/b100-inv.txt pnpm cloud:callmap` **0**（台账 12＝B 档 12、没判据 0、幽灵证据 0、重复键 0）· `git diff --check` **0 行** · `??` **53**（无新文件）· 三引用 peel 仍 `1b9ca06`。
- 一条**过程纪律**要记下来（自己踩的，不是产品的）：第一批读数之后我在 `pnpm e2e:desktop` 仍在跑的时候继续改 `apps/web` 的产品代码，那一轮 e2e 里 E63 红了——**红因是 HMR 撞上了我半改完的树**（有一阵 hook 引用了还没导入的符号），不是判据失效。判据本身在 01:41 单跑与 01:52 整套都绿。处置不是"猜它没影响"，而是**树定稿后整套重跑**，并把作废那一轮的读数写进文档、不引用。这与"同树不并跑两个门禁"是同一条纪律的两个方向：**跑门禁的时候树不许动**。
- 自审出来的**文档引用缺陷两处**（`check:citations` 挡不住，因为它只验"行存在且在范围内"）：① 第九十八／九十九批里我把 Writer 那条保存通路记成 `saveScript`／`:748`——**真名是 `saveWriter`，实测在 `useProjectEditor.ts:728`**，`:748` 落在同一个函数体内（所以"存在且InRange"照样过）；② 同批记的 `saveAll:842` 已被本批的行数搬家挪到 `:755`（投影块那句 `if (!axsDirty)` 在 `:851`）。都在原句里带"写作当时记成……01:56 实测……"的批注改正，不抹历史。教训一条：**引用符号名也要实测，不能只引用行号**——名字错＋行号仍在范围内，是机检的死角。

同日第一百零三批（**把"判据自报的看不见"变成"看见了但不下结论"：`check:apibase` 扩面 ＋ 四档自证**，2026-10-10，只动 `scripts/check-apibase-literals.mjs` ＋ README ＋ 本节，产品代码一行未动）

- 为什么现在动它：§6 定档①卡的是**措辞**（"哪些位置算测试宿主"），不是**数字**。上一轮我确认过一件事——这条命令离进链只差一句措辞，而那句话归你；所以这一批的活是把那句话的**输入补全**，而不是替你说完。
- 三件事：①**只读面**（`apps/admin/src`／`packages`／`e2e`）按同一规则数、按档报数、**不参与红绿**——把它们算进判定等于让一条还没被认可的措辞偷偷生效；②**代价档**：`其中行尾注释 N` 单独数（注释判定只认行首，这是脚本自己登记过的限度）；③**可疑写法档**：`` `/api/${v}/x` ``、`"/api/" + "v1"`、`/API/V1` 三类绕开严格子的写法从"看不见"变成"数出来"。
- 归类抽成纯函数 `classify()` 并配**五条合成样本对照组**（含新加的 `*.spec.*` 一条）＋**三条腿的失效锁**：面文件数 < 50 ⇒ `UNRELIABLE`、基址宿主文件不在树里 ⇒ `UNRELIABLE`、三类命中全 0 ⇒ `UNRELIABLE`；判定面有越界 ⇒ `REGRESSION`。
- 扩面第一次跑就抓到自己的假阳性：`e2e/` 的 80 条命中里 **79 条是测试宿主**（断言文案与请求监听器的路径判断），因为旧 `classify()` 只认 `*.test.*` 不认 `*.spec.*`——**这不是定档，是把工具的漏判归位**；修完只读面剩 3 条疑似调用点（`adminClient.ts:20`／`ImageUpload.tsx:24`／`e2e/helpers.ts:10`），后者是测试自己的基址定义，属于"定档要不要给测试基址留一格"的输入。
- 牙（四条，各自只响在该响的那一格；两处改动都 `cmp -s` 还原 **BYTE_IDENTICAL=true**）：往 `projection.ts` 追加一行 `const probeA = "/api/v1/probe-a";` ⇒ `REGRESSION`、越界 1；再追加一行行尾注释版 ⇒ `越界 2（其中行尾注释 1）`；再追加一行 `` `/api/${"v1"}/x` `` ⇒ `可疑写法 1`（严格档 0 命中，正是这条限度要说的事）；把 `BASE_DEF_RE` 换成永不匹配的正则 ⇒ `UNRELIABLE —— 归类自测失败：期望 baseDef 实得 violation`，退出码 **1**。
- 读数：`pnpm check:apibase` **0**（判定面 测试 9／注释 1／基址定义 1／越界 0；只读面 apps/admin 1／packages 2／e2e 80；合计扫 442 个文件；可疑写法 0）· `pnpm gates` **0**（**十五道未变**——这条命令仍然刻意不在链里，理由写在脚本头与 README）· `git diff --check` **0 行** · `??` **53**（本批未新增文件）· 三引用 peel 仍 `1b9ca06`（未提交、未推送、未动 tag，按 §7）。
- 一句限度要说白：这一批**没有**把定档①推进成结论，它只把结论所需的四格数字量齐了。真要接进 `gates`，需要的是你那一句话（管不管 admin／packages／e2e），接进去是一行。

同日第一百零四批（**剪贴板静默失败：找到缺陷、动手、当场回退并登记在册**，2026-10-10，产品代码最终净变化 0 行）

- 缺陷是真的，而且量出了形状：`navigator.clipboard.writeText` 在桌面是唯一发布目标时**必然可能 reject**（无权限／非安全上下文／壳不给能力）。6 个调用点里三种形状——`ShareActions` 有 `window.prompt` 兜底；`CharacterDetailPage` 里两处 `document.execCommand("copy")` 兜底**把返回值丢了**（false 也被当成复制成）；**`PromptExport.handleCopy`／`handleCopyId`／`StoryEditPage.copyAxs` 三处连 catch 都没有**（按钮既不报成功也不报失败，用户以为内容已在剪贴板里，控制台只有一条未处理 rejection）。同一件事三套实现＝三套语义，正是「抄两遍」那一族。
- 动手做到哪一步：新增唯一通路 `shared/lib/clipboard.ts`（`copyText(text) -> "copied" | "manual"`，失败态是**结论**不是布尔）＋ 4 条单测＋把三处静默点与两处内联副本都接上去。
- **为什么回退**：两处未完工就红了——① 4 条单测全红（jsdom 下 `navigator.clipboard` 的桩法不对，我没时间先归因再修桩，而一条红着的判据不是证据）；② 归一后 `copiedId` 变成未使用变量，`tsc` TS6133。按在册纪律「未验全量就不留半成品」，这一批**整批撤回**而不是把红的留着：三个文件逐处反向替换（每处断言命中数＝1），两个新文件删掉，`pnpm typecheck` 回到 **0**、`pnpm gates` 回到 **0**、`e2e:desktop` 仍 **75 passed**（产品代码回到 02:22 那一组读数取于其上的状态）。回退过程自己还出过一次小事故：我在收尾加了一条 `navigator.clipboard` 出现次数＝1 的断言，**回退后正确的现状是 3**（正路 1＋内联 2）——那条断言按"修完"的形状写，反而在回退成功时 ABORT，好在 ABORT 发生在写盘之后、删文件之前，文件因此还留着，本轮末尾才删掉。
- 于是这一批的产物是**一条在册的修法**（不是散文抱怨）：唯一通路 `copyText`＋`CopyOutcome`；三处静默点各加可见失败态（`PromptExport`／`复制 ID`／`copyAxs`）；两处内联副本删掉；判据两层＝单测（成功／reject+execCommand true／execCommand false／`navigator.clipboard` 整个不存在，四条各守一支，且必须先把 jsdom 的桩法弄对——桩法是这次的红因）＋一条界面腿（用 `addInitScript` 把 `writeText` 打成 reject 且把 `execCommand` 打成 false，点「复制 ID」断言出现"复制失败"，正控是不打桩时出现"✓ 已复制"）。这条界面腿**不需要壳**，所以它不属于「本机无壳不可判」那一格。
- 顺带纠正一条在册登记：§6 那条「`navigator.clipboard.writeText` 桌面 WebView 里是否静默失败本机无壳不可判」写得太宽——**"壳里到底给不给剪贴板"确实不可判，但"reject 时界面会不会说话"完全可判**，而且现在已知它不会说话（三处连 catch 都没有）。这一格从「只观察不处置」升成「有缺陷、有修法、缺工时」。
- **批注 2026-10-10 02:48（第一百零五批）：这一批没有停在"只登记"。** 唯一通路 `apps/web/src/shared/lib/clipboard.ts` 已落地（带平台分派口 `clipboardDeps`，理由与形状沿用 `playerSavesDeps`），上一批那两条红因也都归因到位：**单测宿主是 node 没有 `document`**（`ReferenceError: document is not defined`，所以桩必须打在分派口上而不是 DOM 上）与**归一后遗留未使用变量**（这次改用"新增一个失败态"而不是派生同名常量）。已接上的调用点：`PromptExport.handleCopy`、`CharacterDetailPage.handleCopyId`（外加那两处忽略 `execCommand` 返回值的内联副本一起归一，该文件 693→679 行）。**剩下的三分之一是 `StoryEditPage.copyAxs`**：该文件行数正好压在 G1 棘轮 **419**，加一行失败态就得先减一行——这一批不动它，按债务信号登记，不为它放宽棘轮。界面腿（E65）同理留给下一批：`?storage=memory` 下角色列表是否播种尚未量过，不能凭猜写导航。
- 读数：`pnpm typecheck` **0** · `pnpm gates` **0**（十五道；`[doc-citations]` 已判定 **294**）· `??` **53**（比上一批末 +0：新增的两个文件已删）· `git diff --check` **0 行** · 三引用 peel 仍 `1b9ca06`（未提交、未推送、未动 tag，按 §7）。

同日第一百零五批（**剪贴板唯一通路落地：node 宿主下可测的分派口 ＋ 三处里改掉两处＋两处假兜底归一**，2026-10-10，动 `apps/web` 四处 ＋ 新模块与 4 条单测 ＋ 文档）

- 判据宿主这一条是上一批的红因，这次先量再写：`document is not defined` ⇒ **本仓 web 单测跑在 node 环境**，任何直接摸 DOM 的判据都测不到 DOM 分支。解法沿用本项目已有的先例（`shared/storage/playerSavesDeps.ts` 那句"否则 node 环境下 `window` 不存在，本地分支在测试里永远跑不到"）：把平台调用收进 `clipboardDeps`，`copyText` 只依赖这个口子——它不是测试脚手架，是那条使能单测的接缝，且生产路径一行未变。
- 返回值设计：`"copied" | "manual"` 而不是布尔——布尔会把"没复制成"和"抛异常"压成同一格；两条退回支（`execCommand` 返回 false／`execCommand` 自己不存在）都归 `manual`，调用方**必须**为此给可见文案。三处静默点里已接上的两处（`PromptExport.handleCopy`、`CharacterDetailPage.handleCopyId`）按钮现在会写「复制失败，请手动选中」。
- 顺带归一：`CharacterDetailPage` 里两份内联 `textarea + execCommand` 副本（各自把返回值丢掉，且复制失败也当成功）删掉，该文件 **693→679 行**；全仓 `navigator.clipboard` 出现次数 **6 → 4**（`grep -c` 现测：模块内 2 次就是唯一实现本身，模块外剩 2 处——`ShareActions` 那处本来就有 prompt 兜底、`StoryEditPage.copyAxs` 是这一批没接的那三分之一）。
- 单测四条各守一支（正路不碰退回支／reject 后退回成功／`execCommand` 返回 false ⇒ manual／退回支自己抛 ⇒ manual 不炸界面），web 项目 **Tests  325 passed | 1 skipped**。
- 读数（树定稿后整套重取）：`pnpm gates` **0**（十五道）· `pnpm e2e:desktop` **75 passed／0 failed**（动了产品代码所以整套重跑）· `check:citations` **0**（已判定 **294**）· `check:http-inventory` **0**（`SPEC_URLS=73` 未动、`DATA_DESKTOP=0／DATA_BROWSER=20`）· `check:seams` 9／6／真断言 102／基线 3（新模块 `clipboard.ts` 不是桌面壳接缝形状，不进那张面）· `check:size` **0** 越线且 `--update` 把 `CharacterDetailPage` 棘轮按归一后的实值收紧 · `git diff --check` **0 行** · `??` 新增 `clipboard.ts`／`clipboard.test.ts` 两份**未跟踪**（提交时要显式 `git add`，`check:tracked` 会点名）· 三引用 peel 仍 `1b9ca06`（未提交、未推送、未动 tag，按 §7）。
- 仍欠的两格都写清形状，不留含糊：① `StoryEditPage.copyAxs`（要一行失败态＝先在那 419 行里找一行真冗余）；② 界面腿 E65（先量 `?storage=memory` 下角色列表有没有播种，再决定导航怎么写；桩法是 `addInitScript` 把 `writeText` 打成 reject、`execCommand` 打成 `() => false`，正控是不打桩时出现「✓ 已复制」）。

同日第一百零六批（**`check:tracked` 加第五面：未跟踪的测试文件＝"绿灯但少测"；并集从 17 修成 41**，2026-10-10，动 `scripts/check-chain-tracked.mjs` ＋ 文档；**别名面写了但本版未生效，已如实登记**）

- 触发点：上一批那句"需 add 17 个文件"是**假准数**。两个漏口：① `clipboard.ts` 被两页 `from "@/shared/lib/clipboard"` 引用却没进名单——编译面只匹配以点开头的说明符，别名指向的文件整条面看不见；② 更隐蔽的是 **24 个 `.test.ts` 没进树**：干净 clone 上 `test:unit` 会少掉同样多条判据，而两边读起来都是"全绿"。同一个教训（门禁脚本自己没跟踪 ⇒ "gates 0" 只是一机读数）在**判据数量**上的复现。
- 第五面（已验、已生效）：从 `git ls-files --others --exclude-standard` 取未跟踪文件，按 `(test|spec).(ts|tsx)# Axiforge 桌面重构交接
- **复量 2026-10-10 02:48（第一百零五批末；已被 02:56 取代，取代上面 02:37 那条）**：`pnpm gates` **0**（十五道，产品代码定稿后整套跑过；随后的棘轮 `--update` 与文档改动分别由 `check:size`／`check:citations` 单验为 0）· `pnpm e2e:desktop` **75 passed／0 failed**（02:47，3.5m）· `check:citations` **0**（已判定 **294**）· `check:http-inventory` **0**（`SPEC_URLS=73`、`DATA_DESKTOP=0／DATA_BROWSER=20`）· `check:size` **0** 越线（`CharacterDetailPage` 棘轮按归一后实值收到 **680**）· `check:seams` 9／6／真断言 **102**／基线 3 · `check:apibase` **0**（判定面越界 0）· `check:tracked` **1**（需 add 的点名清单 **17** 项；本批新增的 `clipboard.ts`／`clipboard.test.ts` 两份未跟踪文件**不在**那 17 项里，因为 `clipboard.ts` 走 `@/…` 别名 import，编译面只认相对说明符——所以待 add 实为 **19**，这一格下一批要把它补进 `check:tracked` 的口径里，别靠人记）· `git diff --check` **0 行** · stash **0** · `.e2e-lock` 不在 · 探针残留 **0** · `??` **55** · 三引用 peel 仍 **`1b9ca06`**（未提交、未推送、未动 tag，按 §7）。
- **复量 2026-10-10 02:56（第一百零六批末；已被 03:00 取代，取代上面 02:48 那条）**：`pnpm check:tracked` **1**（五条 `REGRESSION` 并排；**需 add 的准数 17 → 41**，判据面 24 个未跟踪测试文件此前完全不在名单里；别名面本版未生效、已登记且撤下其对照组）· `pnpm gates` **0**（沿用 02:49 整套——本批只动链外脚本与文档）· `check:citations` **0**（02:56 复测 **378**；02:55 那一读是 294，本节落笔把它自己顶上去的）· `git diff --check` **0 行** · stash **0** · `.e2e-lock` 不在 · `??` **55** · 三引用 peel 仍 **`1b9ca06`**。
- **复量 2026-10-10 02:37（第一百零四批末；已被 02:48 取代）**：本批**净变化 0 行产品代码**（做完即回退）⇒ 有效读数仍是 02:27 那一组：`pnpm typecheck` **0**、`pnpm gates` **0**（十五道；已判定 **294**）、`pnpm e2e:desktop` **75 passed／0 failed**、`check:apibase` **0**、`check:tracked` **1**（需 add **17** 个文件）· `git diff --check` **0 行** · stash **0** · `.e2e-lock` 不在 · `??` **53** · 三引用 peel 仍 **`1b9ca06`**。
- **复量 2026-10-10 02:27（第一百零三批末；已被 02:37 取代）**：`pnpm gates` **0**（**十五道未变**）· `pnpm e2e:desktop` **75 passed／0 failed**（沿用 02:22 那组——本批**只动门禁脚本与文档**，产品代码与规格一行未改）· `pnpm check:apibase` **0**（判定面越界 0；只读面 3 条疑似调用点；442 个文件；可疑写法 0）· `check:citations` **0**（已判定 **294**＝02:28 复跑 `pnpm gates` 时的实测；这个数每多一条 `路径:行号` 引用就 +1，所以引用它必须带时刻）· `git diff --check` **0 行** · stash **0** · `.e2e-lock` 不在 · 探针残留 **0**（四处变异全部 `cmp -s` 还原；`projection.ts` 追加的三行探针已随 `RESTORE_A=true` 撤回）· `??` **53** · 三引用 peel 仍 **`1b9ca06`**。
- **复量 2026-10-10 02:22（第一百零二批末；已被 02:27 取代）**：`pnpm gates` **0**（十五道）· `pnpm e2e:desktop` **75 passed／0 failed**（02:22，3.5m；E64 上线，桌面基线 74→75）· `check:citations` **0**（已判定 **284**，本节写完仍会 +）· `check:http-inventory` **0**（`SPEC_URLS=73`、`DATA_DESKTOP=0／DATA_BROWSER=20`）· `check:seams` 9／6／真断言 **102**／基线 3 · `check:size` 0 越线、棘轮 **1072** · `check:tracked` **1**（需 add **17** 个文件，等授权）· `git diff --check` **0 行** · stash **0** · `.e2e-lock` 不在 · 探针残留 **0**（本轮变异 `cmp -s` 还原 `BYTE_IDENTICAL=true`）· `??` **53** · 三引用 peel 仍 **`1b9ca06`**。

> **更新日期**：2026-09-30
> **用途**：新会话或接手者快速建立当前产品边界、工作区状态、可执行下一步与安全限制。
> **本文件是状态索引，不复制长篇实现记录**：执行项以 [`REFACTOR_DESKTOP.md`](./REFACTOR_DESKTOP.md) 为准；产品决策以 ADR 为准；本文件记录最新已验证状态和接手顺序。

## 1. 一句话产品定义

**Axiforge 是桌面互动叙事创作器：用 AXS 写剧本，在剪辑视图编排演出、在结构视图检查分支，并即时预览；作品保存/交付为 `.axsp`。**

唯一核心任务：本地新建或打开工程 → 用剧本/剪辑/结构视图协同编辑同一份 Draft → 预览 → 保存或导出 `.axsp`。

## 2. 当前决策与架构权威

- **唯一发行目标**：Tauri 桌面应用；`apps/web` 是 renderer 与浏览器测试宿主，不是独立产品。依据：[ADR-029](./ADR/029-desktop-only-build-target.md)。
- **AXS 唯一语法权威**：`packages/axs` 的 parser/printer；不得新造方言或第二解析器。依据：[ADR-027](./ADR/027-axs-single-grammar-authority.md)。
- **同一编辑模型**：Draft/IR 是编辑期语义模型；剪辑、剧本、结构是同一作品的协同投影。AXS 不是全局优先的持久化真相源；冲突策略见 [ADR-025](./ADR/025-axs-peer-dual-view.md)。
- **AXS 分支引用**：工程内部目标 ID 序列化时映射为 Beat 标题；空 choice 行是合法的未完成编辑态。实现与回归见 `packages/axs`、`packages/editor-core`。
- **桌面本地优先**：Tauri + SQLite + 本地素材 + `.axsp`。任何服务端退场遵循“先替代、后删除”和“验收基线先搬迁”。
- **现行执行清单**：[`REFACTOR_DESKTOP.md`](./REFACTOR_DESKTOP.md)。[`KERNEL_DESIGN.md`](./KERNEL_DESIGN.md) 是 editor-core 契约；[ADR-024](./ADR/024-desktop-local-first.md) 的 Web 协作/发布部分已由 ADR-029 修订。

## 3. 入口与开发命令

- `pnpm dev`：默认启动 Tauri 桌面开发应用；Web renderer 由 Tauri 自动启动。
- `pnpm build`：默认构建 macOS `.app`。`pnpm build:dmg` 单独生成 `.dmg`。
- `./dev.bash`：tmux 启动桌面；`./dev.bash all` 或 `pnpm dev:stack` 显式启动旧 API/Web/Admin/Nexus 调试栈。
- `pnpm gates`：类型、单测、覆盖率、lint、架构/无障碍等门禁。
- `pnpm e2e:desktop`：桌面态 E2E，不启动后端；`pnpm e2e` 是旧浏览器/API 回归栈。
- `pnpm check:desktop`：Tauri Rust 检查，不包含在 `pnpm gates`。

## 4. 当前工作区状态

工作分支是 `desktop`。重构文件仍在未提交工作区；**不要假设该状态已提交或可从远端恢复**。本轮已验证的改动包括：

- 默认 dev/build 入口桌面化；README 与旧战略文档补上桌面产品边界。
- AXS choice 目标从节点 ID 映射为 Beat 标题；空 `>` 不再静默降级为旁白。
- Draft 投影保留 legacy `choices[].target_node_id`。
- `ChoiceOptionsEditor` 从 `ScriptEditor` 外提；分支选项组与控件具有可访问名称。
- 标签豁免基线清空；`ScriptEditor` 文件行数棘轮由 568 收紧至 513。
- 用户文档和 ADR 中 AXS “文本真相源”的过时说法已修订；#68 旧诊断由 2026-09-30 补记更正。

同日晚些的第二批（同样未提交，按 §7 的硬限制不推远端）：

- **#68 的落地补了一半**：choice 目标在文本层用 Beat 标题，但**同名 Beat 时标题不可寻址**——
  打印侧无条件输出裸标题，指向第二个「开场」的分支回读后静默落到第一个。现打印侧沿用解析侧
  `assignBeatIds` 的序号规则（`开场` / `开场-2`），legacy 投影撤掉「提前换成标题」那步。
- **#69 两处**：`axs.import` 与 **Writer 主通路 `parseAxsToPlan`** 都缺"一次导入内 id 只消费一次"的守卫
  （后者会发出两个同 id 节点并让邻接边退化成自环）。判据三条，含一条把两套实现钉在一起的配对判据。
- `axs.import` 整段外提成 `packages/editor-core/src/axsImport.ts`（新文件未纳管），`document.ts` 436 → 363 行。
- 门禁与工程卫生：`check:labels` 的"id 档"改为必须真被 `aria-labelledby` 引用 + 作用域扩到三个界面层；
  `check:dispatch` 收成三档合法；`check:purity` 不再扫纯注释行；`apps/web` lint 翻成 `--deny-warnings`（0 warning 成地板）；
  `scripts/ports.d.mts` 补上（`build:admin` 之前因此红）；`apps/web/vite.config.ts` 不再硬写端口（env 覆盖口保留）。
- 新增 e2e：**E39 / E40 / E41 / E42**（同名桥段的界面级证据、「发送到 Nexus」两半、LLM 徽标两半、侧栏「概览」与创作概览页两半）。
- 用户文档 `docs/user/desktop/desktop-and-axsp.md` 更正：缺席清单补三项（Nexus 收件箱、「我的主页」/账户设置动作、AI 建档建议）；
  原来那条「把道具挂进某一拍…仍需要后端」是错的——**两端都只有工程级引用**（表与请求体都没有拍字段），
  该能力是"尚未实现"而不是"桌面缺失"。

同日晚些的第三批（纯文档，同样未提交）：**决策层补上今天扩的那条寻址契约**。
`docs/ADR/016-axs-narrative-language.md` 新增「补记 2026-09-30：目标按 Beat 标题寻址，同名按出现顺序消歧」六条，
「质量要求」补一条"round-trip 必须覆盖同名的两种寻址形态、双向各测一次"；`docs/ADR/027` 的方言对照表后加交叉引用（表格按决策时实态保留）。
**判据**：`grep -o "消歧\|同名\|序号\|标题唯一"` 在这两份 ADR 的 **HEAD 版各命中 0 次**——
即 #68/#69 所依据的规则此前只存在于代码与测试里。这类"契约只活在实现层"的缺口，
下一轮把 `idToBeatRef` 改回裸标题不会撞任何门禁，只会第三次静默换靶。明细见 `docs/REFACTOR_DESKTOP.md` Phase 13 末。
同轮另在 `docs/KERNEL_DESIGN.md` §2.4 补一条 `> 状态（2026-09-30）`：那张迁移表把 `axsToSyncPayload` 与 `axs.import` 画成**一行归宿**，
实态是两套实现（`axsImport.ts:56` 的 `importAxsDraft` 操作 Draft；`projection.ts:96,102` 的 `axsToSyncPayload` → `projection/axs.ts:170` 的 `parseAxsToPlan` 产出同步载荷）。
按该文件末尾"不允许沉默漂移"的规矩回写了实态与临时保险（`document.test.ts:385` 的配对判据），**归并仍属 S13-7、等定档**。

同日的第四批（这一批**动了代码/配置**，仍未提交）：**端口真相源下沉成 `scripts/ports.json`**（新文件未纳管，提交要显式 `git add`）。
`scripts/ports.mjs` 变成派生视图（fs 读 JSON，`PORTS`/`origins`/`corsOrigins` 三个导出的值实测逐字不变），
消费侧改读真相源：`playwright.config.ts` 4 处、`playwright.desktop.config.ts` 2 处、`e2e/helpers.ts` 1 处（`API` 现为导出，供 baselines 复用）、
`e2e/baselines.spec.ts` 5 处、`scripts/desktop-http-inventory.mjs` 1 处 ⇒ 工具与 e2e 层的 `5174`/`localhost:8000` 字面量 0 处。
为什么走 JSON 而不是直接 `import "./ports.mjs"`：**已实测**，不是引用旧推断——本机 `~/.nvm/versions/node` 装着 20.20.2 与 22.14，CI 两个 job 钉 `node-version: 20`。当前形状在 Node 20.20.2 下两份配置 `--list` 各 50 / 37、退出码 0；把 `.mjs` 引进配置则 **20.20.2 / 22.14 / 26.7 三档全红**（报错随版本不同：`exports is not defined [in ES module scope]`、`Cannot use 'import.meta' outside a module`）。
**这同时纠正了一条传了两轮的错归因**：早先写的"CI 钉 Node 20 才危险、本地绿远端红"不成立，这条路本地从来就红；正确说法是"Playwright 的 `.ts` 配置走 CJS 转译，掺进 ESM 依赖就混合格式炸"。收成一句：**看到"看不见的那一端"，先查本机装了几个运行时版本**。
证据是双向的：`ports.json` 的 web 改 5999 → 桌面套件 37 全绿（vite 与两套配置都跟着走）；把一处钉回 5174 → 1 failed 且报 `ERR_CONNECTION_REFUSED at …:5999`。
复跑（还原之后）：`pnpm gates` 0 / `pnpm e2e:desktop` 37 passed / `pnpm e2e` 50 passed / `pnpm typecheck` 0。

同日的第五批（**动了创作主通路的解析器**，仍未提交）：清偿 ADR-016 补记末尾那条在册欠账——
裸同名 Beat 引用现在报一条把消歧写法送到眼前的 warning（`同名 Beat「开场」有 2 处，这里指向第 1 个；要指向第 2 个请写「开场-2」），
**tie-break 语义一字未改**；上线前量过分母（随包三份 `.axsp` 各 2 个同名标题、裸引用同名 **0 处** ⇒ 既有作品不会突然亮灯），
出口也已存在（`WriterPanel` / `AxsCodeEditor:132` linter / `MiniAxsEditor:77`），severity 不阻塞保存。
途中撞到自己当天早些写的对立断言 `roundtrip.test.ts:196`（钉的是"不报诊断"）——**改断言而不是删断言**，对 id 与 edges 的钉原样保留。
棘轮把 `parse.ts` 挡在 600 > 587，按它给的处置把目标解析那一族 103 行外提成 **`packages/axs/src/edges.ts`**（**新文件未纳管，提交要显式 add**），
`slugifyTitle` 一并搬过去再由 `parse.ts` 转出 ⇒ `print.ts` / `index.ts` 的 import 路径不用改、公开面不变、`check:circular` 绿；
`parse.ts` 落到 493 行，baseline 同步收到 493（`--update` 后逐行复核 diff：**只有收紧**，并清掉 `document.ts` 那条已失效的记录）。

同日第六批（**动了内核代码**，仍未提交）：把「AXS→图」里**被抄成两份的字段映射与落位公式归一**。
`axsImport.ts::beatToNarrative` 与 `projection/axs.ts::beatToNarrativeData` 实测是逐字符相同的 8 个字段（`is_anchor` 规则、4 列 220×140 公式各两份），
唯一权威现留在 `projection/axs.ts`；`index.ts` 双侧星号导出 ⇒ 公开面不变、`check:circular` 无环、`is_anchor` 全仓出现次数 2 → 1。
归一时补了 Writer 主通路缺的那半判据（`projection.test.ts` 关键拍断言）：**归一前**把权威改成 `is_anchor: false` 只红 `document.test.ts` 2 条（Writer 侧从来没钉过），
**补完之后**同一处变异红 3 条、跨两个文件。判据第一次跑就红——因为它用了 `[intro]` 而代码只认 `[key: intro]`，这个差异登记成新在册缺陷 #79（认不出的方括号静默忽略、不生效也不报诊断）。
`axsImport` 头注释里"只依赖 ./types 与 @axiforge/axs"同步改写（多了一条 import 而注释不改，就是让注释替代码撒谎）。

同日第七批（**动了 AXS 词法与两端求值**，仍未提交）：把 #79 那条在册缺陷付清，并从它引出的棘轮处置里挖出 #82。
#79：Beat 标题里认不出的方括号（`# 第二拍 [intro]`，即把键名直接塞进括号）以前**没有分支接住**——不生效也不报；
现在给一条列出三种可用形式的 warning，**语义一字未改**；分母先量过（`packages/**` 与 `docs/user/**` 共 20 处标题括号、落进新分支 **0 处**，
`.axsp` 为结构化 JSON 不含标题文本）⇒ 既有作品不会突然亮灯。取数法这里连错两次（对原始 JSON 做正则得 0 处＝方法失效，改 `unzip -p` 结构化走一遍才坐实）。
加完这条 warning 后 `check:size` 红（`parse.ts` 502 > 493），按门禁自己给的处置**按域外提**：
条件与字面量一族移到 **`packages/axs/src/condition.ts`**（+ **`condition.test.ts`**，两支 describe 断言一字未改地搬家）⇒ parse.ts 落 **420** 行、棘轮同步收紧。
这一刀与 `./edges` 不同：条件不是 parse 的对外 API，**不做"转出再导出"**，`./print` / `./index` / 测试直接指过去（`index.ts` 公开出口不变）；
切法上有个真约束——先切 `parseHeadingLine` 会形成 `parse ↔ heading` 双向依赖（`check:circular` 会亮），所以条件族才是那把正确的刀。
**#82 是同轮挖出的真缺陷**：搬 `OP_MAP` 时看见只有 `==`/`!=`/`>`/`<` 四键，而 `COND_OP_RE` 认得 `>=|<=`、用户文档 `:149` 承诺过它们，
缺失分支经 `?? "eq"` ⇒ 实测 `parseCondition("memory.score >= 10")` 得 `operator: "eq"`：作者写的"够 10 就开"被编译成"恰好等于 10 才开"，
且回写把原文改成 `== 10`。修法补齐枚举，**五处分属两种语言**：`core/ir.ts` 加 `gte|lte`、`core/conditions.ts` 两个 case、
`axs/condition.ts::OP_MAP`、`axs/print.ts::OP_PRINT`、`backend/app/domains/runtime/service.py::_compare` 两条 `elif`
（Python 不是顺手加的：该函数对未知运算符返回 `False`，只修 TS 等于把闸门在 web 端永久锁死，换一种更安静的坏）。
判据四条（映射两支 + 打印回到 `>=` + `coins=10` 的六格边界）；Python 侧**无测试覆盖 `_compare`**，改用 `backend/.venv/bin/python` 直调取数，
与 TS 端逐位一致（`10 gte 10 True / 9 gte 10 False / 10 lte 10 True / 11 lte 10 False / 10 gt 10 False`）。
文档同轮：ADR-016 加「补记 2026-10-01」两条、`docs/user/writing/axs-syntax.md` 补「键名写在冒号右边」与「认不出的方括号」容错条目、
`>=`/`<=` 含边界这句今天才第一次真成立、`backend/.../narrative/models.py:188` 的 IR 运算符白名单注释跟上。明细见 `docs/REFACTOR_DESKTOP.md` Phase 13 末「第二十四次续做」。

同日第八批（**新增一条文档↔实现的机检通路**，仍未提交）：把 `docs/user/writing/axs-syntax.md` 的 **12 个 `axs` 示例**变成被测对象
（新文件 **`packages/axs/src/doc-examples.test.ts`**，26 条判据：取块数量守卫 / 每块 0 error 诊断 / **`printAxs` 是纯函数** / 每块往返结构一致）。
它当场捞出两件事，分诊不同：**① 无歧义缺陷已修**——`printAxs` 把内部 scratch `_edges` 盖回调用方 beat（旧 `print.ts:249`），
现改为作参数传给 `printBeatBody`；两处活调用方（`projection/axs.ts:142`、`MiniAxsEditor.tsx:22`）打印后即弃 `doc` 故今天无可见后果，
但"打印不改输入"是契约。变异证据：装回 stamp ⇒ 纯度那条红（「示例 L16 被打印改写了」）+ 往返三条红（4 failed）。
**② 有权衡的不一致已登记为待决**——打印会把"指向下一拍的顺序边"物化成 `-> 标题` 行；
我先实现"不物化"并跑绿（axs 76），既有契约断言 `projection.test.ts`「线性链按拓扑序打印…边打印为 -> 标题」随即变红，
据此改判为**决策层两难**（显式化 ⇒ 中间插拍不自动接链；隐式化 ⇒ 移动节点静默重连），已撤回语义改动、判据只摘掉 `jumps` 这一维并注释点名工单（**引用用标题不用编号**，本轮编号漂移过一次）。明细见 `docs/REFACTOR_DESKTOP.md`「第二十六次续做」。

同日第九批（**又回到解析器：演出指令的取值集合**，仍未提交）：文档列的 `@` 指令清单与解析器认识的清单逐项对过（两边一致，`@item` 文档已明说不提供），
但顺着读 `parseDirectiveLine` 读出今天一直在那一族里的形状——**吃下任意拼写再用 `as` 把类型圆过去**：
`@transition banana` → `as "fade"`、`@fx disco` → `as "rain"`、`@camera wiggle` → `as "zoom"`，而真相源 `packages/core/src/ir.ts:136,151,159`
把这三族钉成三个联合类型；`@wait soon` / `@camera zoom big` 则把 `NaN` 原样塞进 IR。
**双端严格度还不一致**：Python 用 pydantic `Literal` 校验同一组值（`backend/app/domains/narrative/ir.py:83,93,99`）⇒ 同一份文本一端拒收、另一端静默降级，已在 ADR-027 方言对照表补记。
修法沿用今天的纪律：**只加提示、不改语义**，warning 文案把可用列表送到眼前；**唯一一处语义变化说清**：`@camera zoom` 的非数字 scale 不再写进 IR
（`NaN` 进不了 JSON，且 `print.ts:122` 的 `scale != null` 会把它当有值、把字面量 `NaN` 印回作者文本）。
判据 5 条 + 1 条对照组（文档表格里给过的写法一条都不许报），先跑 RED（`4 failed | 16 passed`）；分母先量：`docs/user`、`docs/ADR`、`seed_showcase.py`、`prompt.ts`
里这四族只出现 `fade`/`dissolve`/`rain`/`none`/`zoom` 与裸指令行，**0 处落进新分支** ⇒ 零误报上线。
棘轮再挡一次（加分支会让 `parse.ts` 越过 420 档），于是把**演出指令取值**一族 11 个 `case` 外提成 **`packages/axs/src/instructions.ts`**（170 行，含 `resolveRole`——
立绘指令与对白行共用同一个"角色名→id"解析，留在 `parse.ts` 会让新模块回头依赖而成环），`parse.ts` 落到 **330** 行。
`ADR-027` 表里 `parse.ts:234-318` 那族行号随之失效，已按"历史文本不重写"另起带日期的补记指明新落点。明细见 `docs/REFACTOR_DESKTOP.md`「第二十七次续做」。

同日第十批（**只动测试与文档，产品代码未改**，仍未提交）：读到对白分隔符那一处——`parseDialogueLine` 的正则只认半角冒号，
全角 `堰纱：你来了。` 整行落进旁白兜底（说话人丢失、前缀照原样进玩家端）。这条规则此前只在 ADR-027 方言对照表与代码里，**用户文档与判据都没提**。
直觉修法"给全角冒号加 warning"被分母否掉：扫 `docs/**` 的 `axs` 围栏、`.axsp` 的 `*axs*` 字段与 `testdata/**` 向量，
全角冒号在 AXS 源文本里共 **6 处，全部是用户文档自己的 `旁白：…` 示例**，而"整行文本的旁白"是合法用法 ⇒ 误杀率 100%，零误报上线不可得。
落地的两件不需定档的事：`docs/user/writing/axs-syntax.md` 的对白段写清规则（含"`旁白：xxx` 是合法整行旁白"这半句），
`parse.test.ts` 新两条特征化断言（全角支 + 半角对照组；变异证据：正则临时改 `[:：]` ⇒ `expected ['say'] to deeply equal ['narration']`）。
warning 本体登记为待决（工单「全角冒号对白被静默当旁白」，三条候选各自的前置条件写在工单里）。
同轮还纠正一次取证：三份 `.axsp` 报 `BadZipFile` 不是产物坏了，是 `rglob` 把 `target/` 里的 brotli 构建副本扫进了面（真随包文件魔数 `504b`，副本 `1b…`）——**扫描面要先分"跟踪文件 vs 构建目录"**。明细见 `docs/REFACTOR_DESKTOP.md`「第二十八次续做」。

同日第十一批（**动了发射器**，仍未提交）：查 `draftFromProse` 的 `defaultSpeaker` 生不生效，顺出两层。
① 那条 `!i.speaker` 补默认名的分支**永不点火**（唯一生产者 `proseToScriptDraft` 的正则要求名字非空才成 `say`）；
② 顺着 Python 补默认名的位置（`ai_draft.py:109`，在**发射器**里）发现 TS 的 `printAxs` 没有等价兜底：
空说话人的 `say` 实测印成 `# 测试\n: 你来了。\n`，回读变 `narration`、正文留着冒号——**冒号漏进玩家文本、op 翻了**；
而 `instructionOps.ts:33`（编排台「+ 台词」按钮造的形状）就是 `{op:"say", characterId:null, text:""}` ⇒ 活路径。
**这违反的是在册契约**：ADR-016 质量要求第 2 行写着 `parse(print(beats)) ≡ beats`。
修法取"按旁白那一支印出去"，依据是三方一致（`ir.ts:90`「缺省为旁白」＋运行端 `resolveSpeaker→null`、`BacklogPanel` 的 `entry.speaker &&`＋文本层没有"无名对白"形状）；
另一条候选（照 Python 补"旁白"显示名）会让玩家多出一个原本没有的名字，属播放可见变化，已作为**双端差异**登记进 ADR-027 补记，本 ADR 认 TS 这条。
转义规则顺手归一：新增 `printNarrationLine` 一份，`narration` 与这一支共用。
判据三条（`parse.test.ts` 新 describe，RED 先跑 `expected '# 测试\n: 你来了。\n' to be '# 测试\n你来了。\n'`，对照组一开始就绿）；
**改断言不删断言**再一例：`projection.test.ts:107` 那条基线原本钉的就是坏输出（注释写着「既有行为，基线钉住」），已按新预期改写并留日期与原因，对 `> 东 -> 东方` 的钉原样保留。
末轮：`gates` **0**、单测 **548 passed + 1 skipped**（axs 86）、`e2e:desktop` **37**、`e2e` **50**。明细见 `docs/REFACTOR_DESKTOP.md`「第二十九次续做」。

同日第十二批（**只动测试数据与注释，产品代码未改**，仍未提交）：先查证"两端共享向量锁等价"有没有执行者——有：`ci.yml:88` 在 `working-directory: backend` 跑 `uv run pytest tests/`，
`backend/tests/test_axs_draft_vectors.py` 消费同一批 `testdata/axs-draft/*.json`，且它只断言"发射器 reproduces 手写期望文本"（合法性由 TS canonical 解析器裁决，不拿 Python 自己的正则自证）。
缺的是覆盖面：补第五条向量 `unknown-speaker.json` 锁住"认不出的名字不猜角色"这条双端同裁决，
并把那条易漂细节钉死——**两端都固定用全角 `：` 重新拼接，与输入冒号种类无关**（TS 的注释此前写"保留全角冒号原样"，对半角输入不成立，已改写并把注释移进所属分支）。
牙齿各验一侧（成对变异）：两端同时改半角 ⇒ TS `1 failed | 5 passed` 红在该条、Python `test_rules_emitter_reproduces_vector[unknown-speaker]` 红；还原后两端各自全绿。
明细见 `docs/REFACTOR_DESKTOP.md`「第三十次续做」。

同日第十三批（**只动测试**，仍未提交）：又抓到一处发射侧静默丢失，比前几处更重——
`printBeatBody` 用 `script.find(op === "choice")` **只取第一个分支组**，第二个组连同选项一起消失且无诊断。
探针读数：`[say, choice[左], narration, choice[右]]` ⇒ `# 测试\n堰纱: 选吧\n中间一句\n> 左\n`，回读只剩 1 个 choice、0 条诊断；
**违反 ADR-016 质量要求第 2 行** `parse(print(beats)) ≡ beats`。活路径证据：`ScriptEditor.tsx:81` 的 `add` 无"每拍只许一个分支"守卫，
「分支」就在指令面板里（`instructionOps.ts:21,58`）⇒ 连点两次即成立。
三条候选修法各自动不同层（合并成一组／扩语法支持多组／发射侧加诊断），**都需要产品决策**，故本轮只落不需定档那半：
`roundtrip.test.ts` 新增一条特征化断言钉住当前实态（注释写明修法定了要**改写而不是删除**它），并把三种修法与代价登记为待决（我建议 ③：先止住静默，代价是要给 `printAxs` 加一个可选诊断出参）。
末轮：`gates` **0**、单测 **550 passed + 1 skipped**（axs 88）。明细见 `docs/REFACTOR_DESKTOP.md`「第三十一次续做」。

同日第十四批（**新增一道门禁**，产品代码未改，仍未提交）：`scripts/check-doc-citations.mjs` 把文档里的 `路径:行号` 变成机检对象——
**文件必须存在、行号必须落在文件长度内**（动因就是今天这三次按域外提把 `parse.ts` 从 600 行压到 331 行，旧坐标会指到文件外面）。
判据先被自己的误报教过一次：首版把合法简写（`parse.ts` 第 391 行、`projection/axs.ts` 第 192 行）全判成不存在，**166/200 误报** ⇒ 不合格；
改成按 basename/后缀在受追踪源码里取唯一匹配，构建目录与 `Clearance/` 不参与匹配，且**各档计数打出来**（已判定 161、越界 3、不存在 0、歧义跳过 37、省略号跳过 1、只落在被跳目录 4）。
牙齿：临时 `docs/__probe_citations.md` 里放一条 `parse.ts` 第 99999 行 与一条不存在路径 ⇒ **FAIL / 退出码 1** 并点名两行，探针随即删除。
真信号 12 条越界：现状类 **9 条已改到真实落点**（`assignBeatIds`/`titleToId`/两条 warning → `edges.ts:36/46/84/103`；分派四支 → `parse.ts:142/297/303/312`；`axsImport.ts:57-63`），
历史日志类 **3 条不改写**、冻结进 `scripts/doc-citation-baseline.json`（注"清偿后应缩短"）。
接线三处同轮：`package.json` 新增 `check:citations` 并插进 `gates`（链 **11 → 12 条**）、`README.md` 门禁表补一行、脚本头写自报限度。
末轮 `pnpm gates` 退出码 **0**（含新那一道 OK）、单测维持 **550 passed + 1 skipped**。明细见 `docs/REFACTOR_DESKTOP.md`「第三十二次续做」。

同日第十五批（**一条线按证据作废，无代码改动**）：追「`reverseRole` 反解失败会把内部 id 印进作者文本」这条线，命中的前提是"角色被解绑后节点仍引用它"。
内核确实留悬空引用（`role.remove` 只过滤 `draft.roles`），但**先跑对照组**：全仓 grep 分派点后，
`role.remove` 只在内核与其单测里出现，而同联合的 `node.move` / `script.patch` 在 `apps/web/src` 有真实 dispatch 点 ⇒ **界面从不解绑角色，该路径今天不可达**。
处置是**不修也不加防御分支**（为不可能的输入加提示，正是今天反复拆的那一类），
并把真正值得留册的东西登记下来：**内核有 `role.remove` 能力、界面没有入口**——若将来补这个 UI 动作，必须同时决定"仍在引用该角色的节点怎么办"
（清空成无名台词 / 退回旁白 / 阻止移除并列出引用点），且它会撞上今天定的"无说话人的 `say` 发射为旁白"那条。明细见 `docs/REFACTOR_DESKTOP.md`「第三十三次续做」。

同日第十六批（**只动测试与文档**，仍未提交）：拿三份**真实随包 `.axsp`** 量了一次 `unpack → pack → unpack`，project 逐字节一致、角色数守恒 ⇒ 无缺陷，
但这条不变量在**容器层 + 真实产物**这个组合上没人走（**同日 03:21 更正**：我原写"此前没人守"是过强断言——`axspRoundTrip.test.ts` 早在 S13-2 就在 provider 层守着更强的 `exportProjectAsAxsp → importProjectFromAxsp` 字段守恒，只是输入是合成数据、不读随包文件；我按符号 `packAxsp` 扫，漏了包装函数）。补 4 条判据把它钉住：
逐份断言再读回的 project / characters / manifest.assets 相等，另加"清单声明的素材必须真在包里"与一条"目录里有三份"的数量守卫（防空载）。
牙验过：临时让 `packAxsp` 序列化时给标题加后缀 ⇒ 新增 3 条全红，还原后 18 passed。**如实说**：该变异也被既有两条夹具判据抓到，
所以新增价值在输入类别（真实产物、归一化后的形态）而非新代码路径。末轮 `gates` **0**、单测 **556 passed + 1 skipped**（editor-core 163）。
明细见 `docs/REFACTOR_DESKTOP.md`「第三十五次续做」。

同日第十七批（**新增一份测试 + 一处注释纠偏**，产品逻辑未改，仍未提交）：把桌面**生产后端**那条接缝钉进单测——`TauriSqlBackend` 此前**一条判据都没有**，
而 I4（`saveNarrative` 原子覆写）在生产上的保障全压在那个文件的三个形状里，桌面壳又零 CI 信号。
**先更正我自己的框架**：起手写的"两端没有共享契约"不成立，三支契约套件确实同跑 Memory 与 SQLite(sql.js)；空档只剩"契约套件跑不到 Tauri 那一支"（它需要壳）。
新增 `tauriSqlBackend.test.ts` **7 条**：一批语句 = 一次 `invoke("sql_transaction")` 且**载荷形状逐键钉死**（真会静默的那格是 `dbName`：Rust 侧 `create_if_missing(true)`，库名写歪就另建一个空库并成功提交，而读路仍走插件那个文件 ⇒ 写进去的东西"消失"且零报错；`params` 反而不静默，因为带占位符的语句会被 sqlx 挡回来），
占位符**按语句独立**从 `$1` 重新编号、不发逐条 `execute` 也不发含 BEGIN/COMMIT 的文本、并发两个事务只放一个进 invoke、
一处失败后下一条仍真发出、`select` 同样翻译、外加 `isTauriEnvironment` 两分支（`index.ts` 的分派口）。
**牙＝四次成对变异，各红且只红该红的那条**：退回逐条 execute ⇒ 4 红（并量到那个"简化"会在同一条队列上**自锁**，连跑完都做不到）；去掉事务里的占位符翻译 ⇒ 2 红；
绕过队列 ⇒ 1 红；`enqueue` 少掉拒绝腿 ⇒ 1 红（红法是上一次的磁盘故障串给下一条无关语句）。还原后 7 passed。
同轮拆掉一处替代码撒谎的头注释（原文把 Rust 单连接命令写成"**若池行为不符预期**则下沉"的条件回退，而代码无条件走它）；
并查实冒烟那条注释**没撒谎**——`desktopSmoke.ts` 确有 `transaction-rollback`（重复主键触发真回滚、断言旧状态存活），但它只在 DEV 壳里由人跑，不是门禁。
又一例「vitest 只剥类型」：新测试首跑 7 全绿，`tsc -b` 却红（`globalThis.window` 的断言写成不可比较的类型转换）——今天第三次。
另把注释里那条**安全前提从断言改成实数**：`? → $n` 的重写只扫 SQL 文本，前提是"字面量里不含 `?`"；只读探针（两个存储目录 44 个非测试文件）量到
含 `?` 的 SQL 文本块 **66 个**、单引号字面量内含 `?` 的 **0 个**，读数与**口径限度**（扫不到动态拼接的 SQL）一起写进实现文件头注释，**不建门禁**（当前为真的测量 ≠ 需要棘轮的漂移面）。
**末轮取数里的一次红（已归因，不改结论）**：`pnpm e2e:desktop` 第一跑 **36 passed / 1 failed**，红在 E17 内部的自动存档那一跳（30s 轮询全返回 0），
立刻重跑同一份代码 → **37 passed**；机制就是本文件 §6 待决清单里「自动存档的 600ms 防抖窗口」那条（写入被测试自己的快速离开清掉），
**那是它的第 2 次观测，不是回归也不是新缺陷** ⇒ 登记成一条限度：那格定档前 `e2e:desktop` 的读数不能当"全绿信号"引用。我没改产品语义也没放宽断言。
末轮：单测 **563 passed + 1 skipped**（web 181 → **188**）、`e2e:desktop` **37 passed**、`e2e` **50 passed**（03:43 两半各一次，退出码 0，`.e2e-lock` 不存在）。
明细见 `docs/REFACTOR_DESKTOP.md`「第三十六次续做」。

同日第十八批（**一处运行时 fail-closed + 3 条判据**，仍未提交）：把上一批留在注释里的那条前提升成代码守的——`translatePlaceholders` 的唯一正确性依赖是
"SQL 字面量里不含 `?`"，此前它只是注释 + 一次测量（66/0）。不建扫描型门禁（扫不到动态拼接，报的是假安全感），改建运行时守卫：
**字面量含 `?` 就抛、一条语句都不发出**。动因是这条失真的形状：`'?'` 里那个 `?` 会被当占位符吃掉，后面真占位符集体前移一位，
**绑值全错而 SQLite 照收**——与今天全天在拆的"文本层静默失败"同族，只是搬到存储层。
扫描认 SQLite 的 `''` 转义（`'it''s ?'` 也算字面量内含 `?`）。补 3 条判据（该文件现共 **10 条**）：事务遇坏字面量 reject 且零 invoke、
转义引号同样拦、**零误杀对照组**（`VALUES ('inline', 'it''s fine', ?)` 与 `pragma_table_info('projects')` 照常翻译）。
牙＝成对变异：退回上一形状 ⇒ **恰好 2 红**，红的方式就是缺陷本身（`promise resolved "{rowsAffected:1}" instead of rejecting`），对照组两种形状都绿。
**一条范围声明**：这一刀 e2e 两套都加载不到该模块（chromium 里 `isTauriEnvironment()` 为 false ⇒ 走 Memory 支；这条分派条件是上一批刚钉的第 7 项，
所以"测不到"是有判据的说法不是推测），真壳内行为仍只有 DEV 冒烟覆盖——这也是选"抛"不选"记 warning"的理由：抛会被 Provider 收成 `io` 错误、界面可读。
末轮：`gates` **0**（13 道，`[file-size]` 348 文件 0 越线）、单测 **566 passed + 1 skipped**（web 188 → **191**）、`git diff --check` 0 行。
明细见 `docs/REFACTOR_DESKTOP.md`「第三十七次续做」。

同日第十九批（**一处改判 + 一个新测试文件（7 条）**，仍未提交）：桌面素材落盘 `TauriAssetStore` 也是**零判据的生产模块**（契约套件跑 Memory/sql.js，e2e 两套加载不到它）。
读实现时撞上一条**已发布但站不住的 ADR 决策**：`ADR-026` 后果里写「非安全上下文退化为 FNV 内容键，仅用于去重不承担安全语义（代码内已写明）」——
两句都不成立：① `contentKey` 自己的注释写明「仅供内存实现与测试；桌面/服务端落盘用 sha256」，桌面拿它当落盘键正是被禁止的用法；
②「须留痕」在代码里**毫无痕迹**。后果落在用户承诺上：用户文档写「文件名是 SHA-256…别的电脑认得同一个文件」，
走降级支的机器会让同一张图在两台电脑上得到两个 ref、可携带性失效，**而 `write` 照样返回成功**——今天全天那一族"静默降级伪装成合法"在存储层的第三个实例。
修法：删掉兜底（不加痕迹）。缺 `crypto.subtle` 就抛，`write` 收成 `err(io, 「素材摘要不可用（缺 SHA-256），已拒绝落盘」)`，**一个字节都不落盘**。
新增 `tauriAssetStore.test.ts` 7 条（该文件首批）：已知向量钉死 ref 就是 SHA-256、无 subtle 不降级且 `writeFile` 零次、同内容幂等不重写、空字节 io、
外部 URL 的 ref 不去拼路径、缺文件 not_found、读失败 io。**牙＝三次成对变异**：恢复兜底 ⇒ 1 红（红法正是"降级写会成功"）；摘要换成非加密键 ⇒ 2 红；去掉 `exists` 守卫 ⇒ 1 红。
**改判的分寸**：没改写 ADR-026 那行历史，而是在其末尾**另起带日期的补记**（依据＝两条在册契约相撞、判据与变异读数、并把"保留兜底但显性化"的替代修法留给用户定档）；
用户文档同轮补一句失败行为。改动局限在 `contentDigest` 一条分支 + `write` 一个 try，回退成本低。
明细见 `docs/REFACTOR_DESKTOP.md`「第三十八次续做」。

同日第二十批（**只动文档，产品代码一字未改**，仍未提交）：把一条**在册的产物层"实测"证伪其取证方法**，再带对照组重证一次。
被审的对象是 REFACTOR 里那条「生产产物不含 DEV 测试宿主 `?storage=memory`」——它已经历过一次更正（从 `strings` 二进制换成 grep dist），
但**换完承载层之后搜的还是那个不存在的串**：源码形状是 `.get("storage") === "memory"`，`storage=memory` 这个字面量在源码和产物里都不会出现，
⇒ 那次「文件数 = 0」在任何构建上都**恒为 0**，与它替换掉的旧证据一样证明不了事（**这是"0 命中要先问它是不是恒为 0"那条的又一实例，且这次栽在已经改过一次的地方**）。
今天按代码真能长成的三种形状搜（`get(`storage`)` / `get("storage")` / `storage` 与 `memory` 相隔 12 字符内的邻近式），`apps/web/dist/assets/*.js` 全 0 命中，
**并配两道对照**：① 同一个 chunk（`ui-*.js`，存储代码实际落处）里 `axiforge.db` 命中 1 次；② 产物里能看到 react-router 原样保留的 `URLSearchParams(a.search)` 与 `.getAll(\`index\`)`，
证明构建不改写 `X.get("字面量")` 这种形状。结论不变（DEV 宿主确实没进产物），证据第一次成立。
同轮把那条引用里指错位置的行号校正（原写 `139,143`，139 落在注释里；改成 `apps/web/src/shared/storage/index.ts:143,144`）。
**方法收成一句**：验"某串没进产物"之前先问这个串在原代码里长什么样——文档里的措辞不是可搜索的字面量。明细见 `docs/REFACTOR_DESKTOP.md` 该项的「补记（2026-10-01 04:00）」。

同日第二十一批（**改门禁本体**，仍未提交）：上一批写作之后 `check:citations` 报 **3 条新增**，而那 3 条全是在册的历史引用——
基线键里带着**文档行号**，我插入的段落把它们顶下去十几行，于是"写文档"这件事本身在制造假红。
危害不止吵：假红的标准处置是 `--update`，**每写一段文档就重登记一次漂移**，棘轮实质等于没关。
修法是把身份键里的位置去掉：`某文档 → 目标文件:目标行`，打印仍带当前行号。**一句话方法**：棘轮的键只能用在"被改动时不变"的量。
四条腿各验一次：`--update` 后 3 条在册退出码 0；**位置稳定性正判据**＝宪章顶部临时插一行把在册项顶下一行 ⇒ 仍 OK（探针即删、行数复原）；
**该拦**＝临时探针文档放一条越界行号与一条不存在文件 ⇒ FAIL 退出码 1 且逐条点名，删净后 OK；
**复述不绕白**＝同一文档里另起一句复述同一个在册目标 ⇒ **FAIL 且点名那一句**（这一条是修完第一版之后被自己的绿灯逼出来的）。
**那次绿灯里的异常**：全链报 OK，但计数从 `已判定 165 / 越界 3` 变成 `172 / 越界 8`——多出的 5 条是我**为解释这道门禁而在新段落里原样复述的在册目标**；
去掉行号后"同文档 + 同目标"并成一个键，一条白名单就白掉任意多次复述，于是键里再加**所在句子指纹**。
处置是**改我自己的句子**（写成非引用形式），而不是把 5 条复述登记进基线——后者等于用豁免修误报，棘轮会从 3 条放宽到 8 条。
**方法收成一句**：门禁报 OK 但计数变了向也要归因，退出码 0 不是绿灯的全部。最终读数 `已判定 167 / 越界 3 全在册 / 退出码 0`。

同日第二十二批（**新增一份测试（9 条），产品代码一字未改**，仍未提交）：`.axsp` 导入的回滚契约此前**零判据**——`importProjectFromAxsp` 工程建好之后有 7 个失败出口，
每个都调 `rollback` 删半建工程，函数头写着「不留半套内容」，而既有往返测试只走成功路径。补 `axspImport.rollback.test.ts`：对照组 + 7 个出口各注入一次失败并断言工程列表回到空 + 一条**如实的残留特征化**。
牙＝两次变异：整条回滚拆掉 ⇒ **8 红且对照组仍绿**；只漏最后一个出口 ⇒ **恰好 1 红且点名该出口**（那正是"新加失败点忘配回滚"的形状）。两次变异后都用 `git diff --stat` 确认被改文件回到 HEAD。
**测残留时量到一条更大的**：失败路径删得掉工程、**删不掉本次新建的角色**——不是漏写，是 **L4 契约里没有删除角色的方法**（只有 `saveCharacter` / `listCharacters` / `getCharacter`），"不留半套"因此只兑了一半。
探针实测同一条节点 id 写进两个真 SQLite 工程 ⇒ `second.ok=false`，错误 `io「saveNarrative 事务失败已回滚」`；成因两条都在册（`project_nodes.id` 是全局主键；导入只重映射角色 id）。
⇒ **同一个 `.axsp` 导第二次必失败**，用户看到一句看不懂的错，且每重试一次多一组孤儿角色。修法三条候选都动包内标识语义或本地库 schema，**登记为待决 ⑫**（推荐"节点 id 一并重映射"，角色已经是这么做的）；
"要不要给契约补 `deleteCharacter`" 是**待决 ⑬**，它和今天在册的"内核有 `role.remove` 能力、界面没入口"共享同一个前置问题：仍在被引用的对象怎么办。
两条测试宿主教训：node 无 `localStorage` 时 `getCreatorId()` **每次返回新 id**（壳里不是，非产品缺陷），不桩定它就会红在宿主上；
不带范围的 `listCharacters()` 只回**公开**角色，而导入角色不继承公开位——读错范围会把残留伪装成"没有残留"，故同时钉住"带 authorId 有 1 个、公开面 0 个"。
明细见 `docs/REFACTOR_DESKTOP.md`「第四十次续做」。

同日第二十三批（**归一两条通路的策略 + 2 条判据**，产品行为按已定语义收敛，仍未提交）：把待决里"S13-7 两套 AXS→图 要不要归并"对着当前代码核了一遍——
清单原来写的"`beatToNarrative` 与 `beatToNarrativeData` 是否逐字段等价未核对"**已经指不到东西**（那个符号今天早些时候的归一里已经不在了），
但归并没有做完：差的是两处各自写的**策略**。diff 函数体抓到两条真分歧：
① 同名既有节点复用哪一个——通路一第一个赢（`if (t && !titleToId.has(t))`），通路二是 `new Map(existing.map(...))` 即**最后一个赢**，
⇒ 同一份源文本走不同入口会改到不同节点；**在册那条配对判据抓不到，因为它的夹具只给了一个同名节点**（配对判据的覆盖面 = 夹具的分母）。
② "什么算可复用的 beat.id"——同一串正则字面量在两个模块各抄一遍。
处置是归一而不是登记：策略统一成第一个赢（对齐工单「AXS 应用回草稿时同名 Beat 会塌到同一个节点」已定的语义），
正则收成一条导出谓词 `isReusableNodeId` 由两条通路共用 ⇒ **"两侧不同判"在结构上不可能**。补 2 条判据（editor-core 163 → **165**）。
**归一类判据双向取证**：把通路二钉回旧策略 ⇒ 恰好 1 红并点名 `keep-2` vs `keep-1`（而旧配对判据仍绿，这就是新夹具的理由）；
把共享谓词放宽成"任何 id 都可复用" ⇒ 6 红，新那条在名单里。两次都以备份原样还原，还原后 36 passed、`tsc --noEmit` 0。
S13-7 那条待决因此**只剩外层循环与返回形状是否合成一个**（映射、落位、id 判定、同名策略四处已同源），§6 已按实态改写。
末轮：`gates` **0**、单测 **584 passed + 1 skipped**（editor-core 163 → **165**）、`e2e:desktop` **37 passed**（改动落在 Writer 保存路径，所以点击层重量一次）、`git diff --check` 0 行。明细见 `docs/REFACTOR_DESKTOP.md`「第四十一次续做」。

同日第二十四批（**上线第 14 道门禁 `check:seams` + 补一份判据**，产品代码一字未改，仍未提交）：本会话手工发现过三次"桌面生产模块零判据"（事务形状、摘要降级、导入回滚），
所以把那个共同特征变成棘轮。判据特征选得机械可判：**直接 `import` 了 `@tauri-apps/*` 的模块只在壳里跑到**，而壳零 CI 信号、契约套件只跑 Memory/sql.js。
两层判据：① 要有同名测试文件；② 那个测试**必须真的 import 被测模块**（否则加个空测试就能骗过第一层）。基线键带层级（`文件#no-test` / `文件#no-import`），
因为**不分层的键会让"给在册模块补一个空壳测试"躲过第二层**——这一洞是我自己写基线时看到的，改完后腿二实测会红。
分母实测：扫 `apps/web/src` 得 **6 个桌面接缝模块**，4 个有判据（本会话补的三份 + `desktopSeed`），2 个具名登记在 `scripts/desktop-seam-baseline.json`
并各写理由（`desktopSmoke.ts`＝冒烟本身是判据的载体不是对象；`index.ts`＝分派口，其桌面组件已各自有判据，"选哪一支"要 mock 六个模块）。
**门禁的第一批客户还是我自己**：`assetContext.ts` 原本在基线里，我当场补了 5 条判据把它摘掉——那是"立绘显不显示"的最后一跳，出错方式是不显示且无错误可查。
牙：腿一摘掉一份真测试 ⇒ FAIL 点名 `tauriAssetStore.ts#no-test`；腿二放一个不引用 `./index` 的空壳测试 ⇒ FAIL 点名 `index.ts#no-import`（基线不吸收）；
腿三还原 ⇒ OK 且 `--update` 可缩短。**退出码单独取**（上一条管道里 `$?` 拿到的是 `head` 的）：桩文件在时 **1**、删净后 **0**。
`assetContext` 那 5 条也验过牙：把 `localRoot ? convertFileSrc : undefined` 摘成 `undefined` ⇒ **恰好 1 红**（红在"asset 协议没被调用"）。
接线三处同轮：`package.json` 的 `check:seams` + `gates` 链（**13 → 14 道**）、`README.md` 门禁表补一行、脚本头写自报限度。
末轮：`gates` **0**（14 道）、单测 **589 passed + 1 skipped**（web 207 → **212**）、`git diff --check` 0 行。明细见 `docs/REFACTOR_DESKTOP.md`「第四十二次续做」。

同日第二十五批（**分派口补判据，接缝基线 2 → 1**，产品代码一字未改，仍未提交）：上一批留给我的那条"分派口 `index.ts` 要 mock 六个模块"，真去做之后结论变了——只替换本地五个模块即可（`@tauri-apps/*` 一个都不碰），editor-core 两个真 Provider 直接跑。
新增 `index.test.ts` **4 条**，钉三条只有工厂知道的不变量：① **素材根目录必须先于播种登记**（晚一秒 ⇒ 首启播种的立绘解析成空串，图不出现且无错误可查）；② 播种每进程一次 + `getStorageProvider()` 每次同实例；③ `?storage=memory` **只替代存储不替代壳能力**（不得去建 `TauriAssetStore`）——这条边界原来只在文档里，现在有机器判据。
**取证过程值得记**：三次变异有两次**根本没落进去而测试照绿**（第一次 `perl` 模式要求 `&&` 后带空格而源行是换行；第二次命中了**注释里同名的 `import.meta.env.DEV`**）。
换成只可能命中代码的形状、并**先 `sed` 打印被改行**再跑，才拿到真红。**方法：变异跑绿先怀疑没写进去。** 另一坑：`vi.resetModules()` 后顶层静态 import 的类与工厂用的是两个不同对象，`toBeInstanceOf` 会假红 ⇒ 从同一份新模块图里动态取类。
三次各红 1 条（顺序／记忆化／短路），每次都 `cp` 原样还原，末了 `git diff --stat index.ts` 为空。文件按门禁命名约定改成 `index.test.ts` ⇒ `check:seams` 当场缩短为"有判据 5、基线 1"（只剩 `desktopSmoke.ts` 带理由在册）。
末轮：`gates` **0**（14 道）、单测 **593 passed + 1 skipped**（web 212 → **216**）、`[desktop-seams] OK`、`git diff --check` 0 行。明细见 `docs/REFACTOR_DESKTOP.md`「第四十三次续做」。

同日第二十六批（**又一份纯判据，产品代码一字未改**，仍未提交）：census 里最后一个"非云、非冒烟"的无判据模块是 `assetRecords.ts`（存储态→传输态投影，两个纯函数）。
它文件头写着"已知缺席字段，如实标注而非编造"——而这类**刻意的不对称**最容易被"顺手统一"抹掉，代价是界面上出现假事实：
道具/舞台的「N 个剧本引用」角标靠 `ref_count === undefined` 隐藏，谁把它对齐成 `0`，用户就看到一个谁都没数过的「0 个剧本引用」。
补 7 条：两支响应**键集合不多不少**、`ref_count` 的三处不对称（道具**无键** / 舞台**键在值缺** / `view_count` 恒 0）、**数组是拷贝**、可空字段原样透传与两个明说的等式。
**一条类型系统挡不住的**：`readonly string[]` 直接把引用赋过去照样 `tsc -b` 退出码 0——别名缺陷只有行为判据能挡，所以第 ② 类要写成 `"ref_count" in r` 而不只是比值。
三次变异都**先 `grep` 出被改行再跑**（上一批的教训当场兑现）：去掉 `effects` 展开 ⇒ 1 红；`ref_count: undefined` → `0` ⇒ 1 红；给道具补 `ref_count: 0` ⇒ 2 红。全部还原、`git diff --stat` 为空。
末轮：`gates` **0**（14 道）、单测 **600 passed + 1 skipped**（web 216 → **223**）、`git diff --check` 0 行。明细见 `docs/REFACTOR_DESKTOP.md`「第四十四次续做」。

同日第二十七批（**收口认证 + 把验收①从"不可判"做成一条可判候选**，产品代码一字未改，仍未提交）：
① **六条链一次跑齐、退出码逐条单独取**（04:56–04:58）：`gates` 0（14 道）· `test:unit` 600 passed + 1 skipped · `e2e` **50 passed** 0 · `e2e:desktop` **37 passed** 0 · `build:web` 0 · `build:admin` 0 · `check:desktop`（桌面壳 `cargo check`）**0** · 后端 `uv run pytest -q` **167 passed**（3.65s）0。
**桌面 cargo 这次本地绿，不改变"桌面壳零 CI 信号"这条限度**——CI 里没有 desktop job，所以那句仍挂在定档第⑦条；这一条我在文档里写明了，免得下次有人拿"跑过"当"有闸门"。
② 验收清单第①条原本被判为"判据本身不可判"，这次把建议措辞写成机械形式并**先量再交**：`/api/v1` 只允许出现在 `*.test.*` / 注释行 / `shared/api/client.ts` 里带 `apiBase` 的那一行，其余算新调用点必须为 0。
实跑 `命中：测试 9、注释 1、基址定义 1、越界调用点 0`、退出码 0；**牙验过**（临时放一个越界调用点 ⇒ FAIL 点名那一行、退出码 1；删净 ⇒ OK）；并自带一条防退化：三类命中数**全 0 时它自己报 FAIL**，防止字面量被清空后这条检查静默变成恒真。
**它刻意先不进 `gates`**（与 `check:desktop` 同类："存在但不在链里"），因为口径归用户定；定了以后接进链只差一行。登记在 `package.json` 的 `check:apibase`。
③ 顺手核掉一条躺在「接手优先级」里的事实断言并量化：`vercel.json` 共 **4 处**引用不存在的 `backend/src/main.py`（真实入口是 `backend/app/main.py`）⇒ 它不是"还能用的备用发布路径"，这条已写进 `ADR-029` 的 04:56 补记，并声明**当前定档清单的权威在 §6 这一份**。
末轮：`gates` **0**、`check:apibase` **0**、`git diff --check` **0 行**、`git status` 61/17/26。

同日第二十八批（**把第 14 道门禁自己那条"故意留的限度"关掉**，产品代码一字未改，仍未提交）：
`check:seams` 上线当天自报的限度是"第 2 层只查有没有 import，不查 import 之后断言了什么——空壳测试仍然算过"，
理由写的是"断言有没有牙要靠变异取证，不是本脚本的活"。这句话一半成立：**相关性确实不可机械判**（见下），
但"有没有断言"从来就是可判的，把它写成"不是我的活"等于给最容易顺手交出的那种判据（只调用不判断）免了检。
先量在册真值再上档（否则交付即红）：5 份在册测试的真断言数是 **11 / 9 / 15 / 20 / 28**、恒真断言 **0** ⇒ 新档今天不误伤任何人。
补成三层：第 3 层数 `expect(...)` / `assert(...)`（**先按行剥注释**，`// expect(...)` 是判据的自述不是判据），
并把 `expect(true)` 一类恒真断言从计数里扣掉——扣完为 0 ⇒ `#no-assert`；文件里还留着恒真断言 ⇒ 另记 `#trivial-assert`。
四腿取证（临时探针文件，跑完当场删净）：干净树 **OK 退出码 0**（`有判据 5 / 真断言合计 83`）→
只调用不判断 **FAIL 1** 点名 `apps/web/src/__probe_seam.ts#no-assert` →
一条真断言 + 一条恒真 **FAIL 1** 点名 `#trivial-assert`（且合计只从 83 变 **84**，证明恒真那条没被算进证据）→
断言只写在注释里 **FAIL 1** 回到 `#no-assert`（证明剥注释那一步不是装饰）→ 删净 **OK 0**。
剩下的限度如实写进脚本头并给出"为什么做不到"的证据：**判不了相关性**（一份测试可以 import 本模块、断言全打在别的东西上仍算过），
机械判相关性要把断言表达式与模块导出符号配对，而配对要理解作用域——同一天文档引用对账试做内容层那次，
52 条可判引用误报 **38%**，成因正是这种没有机械邻近关系的配对；**"断言有没有牙"仍归变异取证**。

同日第二十九批（**把 `check:seams` 自己的扫描面从"一厢情愿的 apps/web/src"改成实测过的发布源码面**，产品代码一字未改，仍未提交）：
脚本头第二条限度原写"只看 `apps/web/src`；`packages/*` 的内核模块不在面内"——这句话当年是**假设不是测量**。
先做全仓普查（`/tmp` 里的临时脚本，扫 `apps/` + `packages/` + `e2e/` + `scripts/` 共 **416** 个源文件，两种形状各种都试）：
`@tauri-apps` 在 `packages/*` 命中 **0**；但把形状从"引用 Tauri"扩到"引用 Electron 主进程桥"后，抓到 **2 个真的无判据壳模块**：
`apps/nexus/electron/main.cjs`（**45 行**：`new BrowserWindow` + dev `loadURL` / prod `loadFile` 二选一 + 一条 `ipcMain.handle("nexus:get-version")` + 三个 `app` 生命周期钩子）与
`apps/nexus/electron/preload.cjs`（**5 行**：`contextBridge.exposeInMainWorld("nexus", …)`，唯一的桥就是那条 handler）。
这两个是**今天第一次被机械地看见**——上一版门禁按定义看不见它们。
于是面改成 `apps/` + `packages/`，形状改成 Tauri 或 Electron 桥，`.cjs/.mjs/.js` 一并纳入扩展名（`preload.cjs` 正是 `.cjs`，旧面按 `\.(ts|tsx)$` 过滤根本不会打开它）。
**为什么这两个不顺手补测试**：`apps/nexus` 没有测试设施（vitest 只给 admin 建过）、mock 整套 `app/BrowserWindow/ipcMain` 得到的判据只验 mock、
而最根本的是 **nexus 的处置本身挂在 `ADR-029` 未决清单第 2 条**（`sendToInbox` / `aiApi.suggestCharacter` 判死还是本地化）——给一支可能判死的 Electron 壳搭测试设施=替用户做决定。
所以按**具名基线**登记（各带理由），棘轮从"1 条在册"变"3 条在册"：**这不是放宽**，因为面变大了、且新增壳耦合模块仍必须自带测试。
牙验过（临时探针 `packages/ui/src/__probe_shell.ts` 引用 `@tauri-apps/api/core` 且无测试 ⇒ FAIL 点名 `packages/ui/src/__probe_shell.ts#no-test`、接缝数 8→9；删净 ⇒ 回到 8 且退出码 0），
所以"扩到 packages"不是写在文档里的姿态，是跑出来过的形状。
**顺带给 `ADR-029` 未决第 2 条补了实测分母**：nexus 的壳耦合代码总共 **50 行 / 2 个文件**，全部只有一个功能（读版本号）——判死的成本比想象低，这条读数已写进基线理由，问那一条时可以直接引用。

同日第三十批（**入口那条"冒烟该不该跑"的判据从零判据升到 6 条，并补上门禁看不见的一类形状**，产品代码只动 `main.tsx` 一处抽取）：
普查壳耦合形状时（全局句柄而非 import 包：`__TAURI_INTERNALS__` / `contextBridge` / `ipcRenderer`）发现 **`main.tsx` 的冒烟触发条件读的就是这个全局，而它不在第 14 道门禁的面内**——
旧形状只认 `@tauri-apps` 与 `electron` 的 import，"读全局"这一类结构性看不见。
那句判据同时是**承重**的：它要 `invoke` 可调用而不是全局存在，因为 e2e 桌面态注入的正是空对象 `__TAURI_INTERNALS__`，
按存在性判会让冒烟在测试宿主里真调 plugin-fs/plugin-sql 并抛未捕获异常（原注释记着"实测两条"）——**而这条差异当时只活在注释里，没有任何判据挡着人把它"归一"**。
处理：判据抽成 `apps/web/src/shared/storage/shellSmokeGate.ts`（`main.tsx` 仍走懒加载，不把整个存储栈拉进入口），补同名测试 **6 条**，
其中一条**直接钉语义差**：同一个注入形状下 `isTauriEnvironment()` 为真、`shouldRunDesktopSmoke` 为假 ⇒ 谁把两者合并就会红。
牙：把谓词"简化"成 `internals !== undefined`（就是那句注释警告过的写法）⇒ **3 条红**，还原后 `diff -q` 与原文件一致、`tsc -b` 0、6 条仍全绿。
门禁形状再加两档（全局句柄 + Electron 桥），并修掉一个自己喂自己的坑：**形状匹配原本吃全文**，
`main.tsx` 只因为**注释里解释了为什么不用那个全局**就被登记成接缝——负向文本守卫被自己的解释喂饱（这是本会话第二次撞上同一形状），改成只吃剥注释后的代码；
顺带如实留一格：行尾注释与块注释中段行仍会算命中，方向是"多判一个待登记"，不会漏真引用。
末了读数 `[desktop-seams] OK —— 桌面接缝 9 个：有判据 6（真断言合计 94）、缺测试 3、基线在册 3`。
**另一条只登记不处置的观察**：`navigator.clipboard.writeText` 实测 **5 处**调用点（`ShareActions` / `StoryEditPage` / `CharacterDetailPage` ×2 / `PromptExport`）全在无同名测试的页面 `.tsx` 里；
它们在 Tauri WebView 里到底能不能用属运行时事实，不是"引用了壳包"这种机械特征，把它们算进门禁会让这道门禁第一次运行就要登记 5 条基线、把"壳耦合"稀释掉。
所以**没进脚本，也故意不占 §6 的编号**（那是共享计数器）——只在这里留一句：**桌面剪贴板是否真会静默失败，本机无壳可验，属未验证观察**。

同日第三十一批（**⑫ 交付：同一个 `.axsp` 现在能重复导入**，2026-10-09，产品代码有改动，仍未提交）：
接手先做的一件事是**重测环境**——距上次停车过了 7 天，`git status` 从 62/17/28 变成 78 M/36 ??，`axspImport.ts` 在 10-05 被改过，
还多出条件向量一族（`packages/core/src/*Vectors.test.ts`、`backend/tests/test_condition_*.py`）的新工作；HEAD 仍是 `1b9ca06`（没人提交过），
所以我按当前树取数，不引用上周的读数。
**前提逐条核实过**：`project_nodes.id`、`project_edges.id`、`project_roles.id` 在 DDL 里都是**全局** `TEXT PRIMARY KEY`（不是 `(project_id, id)` 复合键），
而导入侧只重映射角色 id 与节点的 `stageId` ⇒ 包里的节点/边原样插入。
**RED 的形状值得记**：新写的第一条判据（真 SQLite 上原样导第二次 ⇒ `ok=false`、整批回滚、第一份无损）**当场通过**——
它不是"我要实现的期望"，而是**缺陷的复现**，所以它天然绿；真正红的是另两条（`remapNodeIds is not a function`）。
一个自己的错也被这条救回来：夹具里我先拿源工程的 bundle 往第一个新工程插，**结果第一次就撞**（包里 id 已在本机库里），
这等于第三次独立确认了同一件事——"从本机导出的包，导回本机连第一次都失败"，比"导第二次"更严重。
**修法**：`remapNodeIds(project)` 放在 `packages/editor-core/src/axsp.ts`，与 `remapCharacterIds` 同族同形状；
id 取存储行 id 的唯一权威 `rows.ts::uuid`（不另造第二个生成器）；
**同时**换节点 id、边 id、以及边的 `source`/`target`——只换节点不换边就是把"撞主键"换成"边悬空"，那更安静。
纯函数、不改入参、`narrativeData`/`editorData`/`axsSource` 一字不动（图内跳转按 Beat 标题寻址，节点 id 只存在于边两端，ADR-016）。
判据分层：真库那半在 editor-core（`SqlJsBackend` 只在包内可达；**没为测试新开公共导出**，以免把 sql.js 拖进 web 产物层），
通路那半在 apps/web（`storage.test.ts` 往返条：新旧工程节点 id **互不相交**、边数相等、边内容等价、边两端解析得到）。
**既有基线改的是连接键不是覆盖**：`seedPlayable.test.ts` 原先拿随包文件的原始 id 去 IR join——身份一换那 join 天然失效，
改成"节点数 + 有舞台的节点数 ↔ 有 sceneId 的 Beat 数 + 每个 sceneId 真在 scenes 里 + sceneTitle 非空"，
舞台解析那半反而更宽（遍历全部 Beat，不再只遍历 join 得上的）；往返条顺手把夹具从 0 条边补成 1 条，
否则"边两端跟着换"那条断言是**恒真的空判据**。
牙取了三刀，每刀先 `grep` 出被改的那一行再跑：只换节点不换边 ⇒ editor-core 2 红 + web 往返 1 红；节点 id 根本不换 ⇒ 2 红（含不相交条）；
把 `axspImport` 里的调用摘掉 ⇒ web 往返恰好 1 红（其余 166 条仍绿，说明**通路判据只有往返条守着**，这是它的真实覆盖面不是我的夸大）。三刀都以 `cp` 还原、`diff -q` 一致。
末轮（06:37）：`gates` **0**（14 道）、editor-core `tsc --noEmit` 0、web `tsc -b` 0、web storage 套件 **167 passed + 1 skipped**、
`[desktop-seams] OK 9 / 有判据 6（真断言合计 99）/ 基线 3`。
**两套 e2e 本轮没跑**，理由是端口上有一支 8 天龄的别人的 dev 栈（uvicorn:8000 + 三个 vite），非 CI 下 `reuseExistingServer` 会让我测到别人的代码——
本轮改的正是产品代码，所以这条欠账我写明在 §5，下一会话要让开再取点击层数。

同日第三十二批（**⑫ 补上点击层，并把我自己那句错账纠正到准确形状**，2026-10-09，只改测试与文档，仍未提交）：
① **跑点击层前先证明端口上是被测代码**：5174 上那支 vite 起了 9 天、不是我起的，
   于是 `curl localhost:5174/src/shared/storage/axspImport.ts | grep -c remapNodeIds` ⇒ **2**（`main.tsx` 的 `shellSmokeGate` 同样 2，且返回的是转换后模块、`"DEV": true`）。
   证明成立才跑：`pnpm e2e:desktop` **38 passed** 退出码 0（原 37 + 新 E43）。**浏览器那一半我没跑**——
   8000 上是别人的 uvicorn（`--reload`，连的是**开发库**而非 `axiforge_e2e`），复用它的端口会把测试数据写进你的开发库，这条我不擅自做。
② 新增 **E43**：`.axsp` 导入这条点击路径**此前一条判据都没有**。同一个 `showcase-1.axsp` 连导两次 ⇒ 两次都各自落到
   `/studio/projects/<id>`（内存库顺序 id，实测 `proj-0001` / `proj-0002`），"还没有剧本"消失，且没有「导入失败」弹窗。
③ **我上一轮写在测试注释里的话被自己的测试证伪了一半，这里记准确形状**：
   我说「`openBinaryFile` 在测试宿主里结构上点不了」是错的——但纠正过头也是错：它先判 `isTauriEnvironment()`。
   **注入桌面标记 ⇒ 走 plugin-dialog 支，chromium 里确实开不出选择器**（本会话第一次就跑败在这，`waitForEvent("filechooser")` 60s 超时）；
   **不注入标记、只用 `?storage=memory` ⇒ 走 `document.createElement("input") + click()` 回退支，Playwright 接得到 `filechooser`**。
   所以 E43 用后者，并在注释里写清 plugin-dialog 那一腿仍属真壳手验（待决⑦）。
④ 顺带纠正一条差点写错的判据：不注入标记时页面**照旧发** 4 笔 `/api/v1`（`users/session`、`editor/projects/user/<creator>`、`llm/health`），
   因为那些消费者由 `isLocalOnlyDeployment()` 闸门、跟 `?storage=memory` 不是同一条件。
   所以我**没有**在 E43 里断"零 /api/v1"（那是 E14 的 CLEAN_ROUTES 棘轮），也没有留 `hits.length >= 0` 这种恒真条——
   `hits` 只作为断言消息里的诊断上下文。
⑤ 两条**只登记不处置的观察**：a) 工程列表页顶部【示范】条带的元素在 Playwright 下 60s 内一直 "not stable / detached from DOM"
   （第一次试图点卡片撞在这；React key 用的是 `proj.id` 不冲突，所以不是重复键，怀疑是无限动画——值得单独查，因为它意味着列表在持续重渲染）；
   b) 卡片不是 `<a href>`，按 `a[href="/studio/projects/<id>"]` 找不到 ⇒ "列表里有两张卡"这条今天写不出稳定形状，我选择**不写**而不是猜。
末轮（06:55）：`e2e:desktop` **38 passed** 0、e2e 的 `tsc -p tsconfig.e2e.json` **0**、产品代码本轮一字未改（所以上一批的 `gates` 0 仍代表代码状态，文档改完后另取 `check:citations`）。

同日第三十三批（**把上一批我写下的两条推断证伪，并把 E43 补成能测的形状**，2026-10-09，只改测试与文档）：
⑤a **「【示范】条带永不稳定 ⇒ 列表疑似持续重渲染」这条观察是我的误读，两处都错**：
`【示范】序章·交汇` 不是顶部条带，**就是我自己导入的那两份副本的标题**（示范作包里的工程名自带【示范】前缀）；
而"持续重渲染"用浏览器实测否掉了——同一页面（空态列表）挂 `MutationObserver` 观察 **2.4s ⇒ added 0 / removed 0 / attributes 0，`.animate-pulse` 节点数 0**，
`animate-pulse` 这个无限动画类只在 `packages/ui/src/components/Skeleton.tsx` 里出现。**结论：没有持续重渲染的证据**；
Playwright 报的 `not stable / detached` 只挡住**需要几何命中的动作**（点击），不挡住**计数**类断言。
⑤b 所以 E43 该补的形状补上了：`toHaveCount(0)`（导入前）→ 两次导入 → `toHaveCount(2)`，**前置对照是它自己的判据的一部分**——
没有它，`toHaveCount(2)` 可能被任何一处同名文本满足。这套形状在 07:51 的两样本都绿（全套 **38 passed**、单跑 `1 passed`）。
⑤c 顺带删掉一条**伪判据**：`importOnce` 里我写的"回到列表后『还没有剧本』应该消失"。
实测同一句空态文本在页面上有多个 section 会渲染（元剧本 / 我的 / 模板），它的有无测的是标签页布局而不是导入结果——
07:48 那次红就是这么来的（`Expected: 0 / Received: 1`，重试 14 次仍为 1）。判据要测的是"落库"，那由**工程 URL 两条各不同** + 卡片计数两条给。
⑤d 上一条里我说的"卡片不是 `<a href>`"这条**仍然成立**（按 `a[href="/studio/projects/<id>"]` 实测 `element(s) not found`），
所以"点进副本"这条腿今天写不出来，我没有为它猜选择器——**留给列表可访问性形状单独一次处理**（卡片该不该是锚点是设计问题，不是我的临时决定）。
末轮（07:51）：`e2e:desktop` **38 passed** 退出码 **0**、`-g E43` 重跑 **1 passed**、e2e 的 `tsc -p tsconfig.e2e.json --noEmit` **0**、`.e2e-lock` 跑完不在、产品代码仍一字未改。

同日第三十四批（**给 S13-3 补按路由的分母，并把一个"只活在文件里的工具"接进命令面**，2026-10-09，产品代码一字未改）：
`scripts/desktop-http-inventory.mjs` 今天之前**没登记进 `package.json`**（`grep` 实测 0 命中）——这正是我在册那条失败形状：
**新命令交付 = 脚本 + 配置 + README 三处同轮**，否则能力只活在文件里，下次没人跑。这一批三处一起补齐。
普查本身升到**两臂**：桌面臂注入 `__TAURI_INTERNALS__`、浏览器臂不注入，跑同一张 8 路由表。
加浏览器臂的理由不是"多看一眼"，而是**桌面臂那个 0 原来没有对照**：分不清「真的不发」与「根本没能力发」。
今天实测（abort 拦在本地，**一笔都没打到别人那台连开发库的 uvicorn**）：
桌面臂 8/8 路由挂载、**唯一调用点 0**；浏览器臂 **9 个唯一端点**（`users/session`、`editor/projects/user/…`、`editor/projects/discover`、
`editor/assets/items/user/…`、`editor/assets/scenes/user/…`、`characters/user/…`、`creator/dashboard`、`discover/topics`、`discover/dashboard`）
⇒ 这 9 条就是**web 分支退役时要点名的云端消费者清单**，比"还剩一些云调用"可判得多。
三条腿的牙都见过红（各一次，`cp` 还原后 `diff -q` 一致）：
把桌面臂的标记摘掉 ⇒ `REGRESSION — 桌面态仍有 9 个唯一调用点`、退出码 **1**；
把浏览器臂也注入标记（让正对照变成 0）⇒ `UNRELIABLE — …此时桌面态的 0 是恒真读数`、退出码 **1**；
还原 ⇒ `OK — 桌面态零 /api/v1（正对照 9）`、退出码 **0**。
两处自己的错也记下来：① 第一版把 `page.route` 的回调参数当 Request 用（`req.url is not a function`）——Route 要 `route.request().url()`；
② `node --check` 对 `.mjs` 报的是语法层，抓不到这种运行时 API 误用，所以**语法检查通过不等于跑得起来**，判据必须真跑一次。
**它刻意不进 `gates`**（与 `check:desktop` 同类）：普查要一个活着的 web 服务，链里跑会让门禁在没有 dev server 时恒红。
末轮（07:58）：`check:http-inventory` **0**（桌面臂 0 / 浏览器臂 9 / UNMOUNTED 0）。

同日第三十五批（**把"还剩多少云端面"从人读变成脚本**，2026-10-09，产品代码一字未改）：
上一批的普查只覆盖**页面装载时**发不发（桌面臂实测 0）；它测不到"用户点某个按钮才发出去"的那一面。
新脚本 `scripts/cloud-callmap.mjs`（命令 `pnpm cloud:callmap`，**信息性、不进 gates**）做的是同一件判断的机械化：
解析 `shared/api/**` 里每个 `xxxApi.method` 的 `动词 + 路径模板`，再扫界面侧调用点，分五档。
实测读数：**95 个端点定义**（api 文件 19 个、消费者扫描 234 个文件），分档
**死面 12 / 仅 HTTP 实现侧 9 / 直连云端 34 / 混合 8 / 已有本地支 32**（相加 = 95，先过一遍加法再信表）。
**死面 12 条**（S13-3 判死清单里最便宜的一档，全名照抄自脚本输出）：
`POST /editor/ai/prose-to-script`(aiApi.proseToScript)、`GET /play/sessions/{id}`(playerApi.getSession)、
`POST …/scenes/{sid}/nodes`(projectApi.addNode)、`POST …/nodes`(projectApi.addProjectNode)、
`DELETE …/scenes/{sid}/nodes/{nid}`(projectApi.deleteNode)、`POST …/edges`(projectApi.saveEdges)、
`PUT …/scenes/{sid}/nodes/{nid}`(projectApi.updateNode)、`PUT …/nodes/{nid}`(projectApi.updateProjectNode)、
`PUT …/roles/{rid}`(projectApi.updateRole)、`PUT …/scenes/{sid}`(projectApi.updateScene)、
`PUT /characters/{cid}/relations/{rid}`(relationApi.update)、`GET /users/author/{creatorId}`(userApi.author)。
**死面 ≠ 可以立刻删**：按在册纪律要先数活读者（界面读者与机制读者分开，`projectApi.saveEdges` 这一族此前就被证过是契约面）。
**脚本自己先错过三处，都被逐条读数抓到**（这三条比结论更值得留给下一会话）：
① 分派口只认 `*Saves` 命名 ⇒ `useCharacters.ts` 明明 import 了 `getStorageProvider` 却被判成"直连云端"；
② 符号归属只取文件里**第一个** `xxxApi` ⇒ `discoverApi.dashboard` 被挂到 `creatorApi.dashboard` 名下，表里凭空多一条重复端点；
③ 实现侧没摘出来 ⇒ `shared/storage/http*.ts` 引用 apiClient 被算成"绕过"，虚增 8 条。
三处都改了，改后的抽查逐条对过（`discoverApi.dashboard` 归位、`characterApi.create` 落到"已有本地支"、新增"仅 HTTP 实现侧"一档）。
**牙**：把 `apiDir` 指到不存在的目录 ⇒ `UNRELIABLE — api 目录文件 0 个、解析出端点 0 个`、退出码 **1**；还原 `diff -q` 一致。
**这一刀我自己差点交出去一份假牙**：第一次变异用的是 `"api"]`，而源码是 `"api");` ⇒ **替换根本没发生**，
证据是"变异后"与"还原后"两次读数一模一样。这是本会话第二次撞同一形状（第一次是 `check:dispatch` 的 perl 模式），
所以规矩再写一遍：**改完必须先 `grep` 打印被改的那一行，看到它真的变了，再谈红**。
末轮（08:05）：`cloud:callmap` **0**、牙退出码 **1** 见过、还原一致；产品代码零改动，`gates` 读数见下一段。

同日第三十六批（**把"绕过面"切成可定性的两半**，2026-10-09，产品代码一字未改）：
上一批的"直连云端 34"里混着两类完全不同的东西——**服务端本质**（评论、举报、Discover 一类，本来就该在云上）与**真该本地化却没有分派口**的。
加一条机械判据把它们分开：这个 `xxxApi.method` **有没有被任何分派口文件引用**（分派口集合沿用 `check:dispatch` 的命名约定
`*Saves.ts / assetPool* / achievementDefs.ts`，两道判据读同一个集合，不各说各话）。
读数从五档变六档，总数不变 **95**：死面 **12** / 仅 HTTP 实现侧 **9** / **绕过（无分派口引用）34** / **已有分派口引用（云端是 fallback）26** / 混合 **6** / 调用者已接本地库 **8**
（12+9+34+26+6+8 = 95，加法过了才报）。
抽查两条对得上：`ginkgoApi.*` 与 `itemApi.*` 都落到"已有分派口引用"（`achievementDefs.ts`、`playerSaves.ts`、`assetPoolSaves.ts` 各自点名），
而 `commentsApi.*` 三条、`creatorApi.*`、`discoverApi.*` 落在"绕过"——正是 S13-3 该逐个判死/判留的那批。
**这一档给 S13-3 的实际作用**：判死清单不再需要人逐个读 `shared/api`，`pnpm cloud:callmap` 直接给出"桌面态真会发出去"的 34 条端点 + 每条的调用点文件。
（**08:43 更正**：34 是"没有分派口引用"的数量，不是"桌面真会发出去"的数量——按调用点减掉壳守卫后真会发出去的是 **29** 条，见第四十批。）
按域分组（08:10 从同一份输出 `sed|sort|uniq -c` 得到，相加 = 34）：
`playerApi` 6、`userApi` 5、`relationApi` 5、`creatorApi` 3、`commentsApi` 3、`versionApi` 2、`identityApi` 2、`discoverApi` 2、
`tagApi` / `searchApi` / `reportApi` / `projectApi` / `nexusApi` / `llmApi` 各 1。
**读法要看清**：这一档里 `commentsApi` / `reportApi` / `discoverApi` / `searchApi` 属**服务端本质**（跨用户读写，桌面没有对应语义），
真正需要在 S13-3 里逐个问"判死还是本地化"的是 `playerApi`（玩家存档/成就的云端那半）、`relationApi`、`versionApi`（版本历史）、`identityApi` 这几族。
**两处自己的错也记下**（都属"工具本身坏了但输出看着正常"）：
① `grep --include=*.md` 在 zsh 下报 `no matches found`，我拿它做归属派生信号，结果 38 项全报"引用数 0"——**整列全 0 是工具没跑，不是没有引用**；
② 用 `perl -i -pe` 改脚本时，替换串里的 `${r.verb}` 被 perl 自己插值成空，把一行 `console.log` 模板拆成语法废件——
   `node --check` 当场接住（这正是它该干的活），但根因是**我不该用双引号插值环境去改含模板字符串的代码**：改代码走 Edit，不走 shell。
末轮（08:09）：`cloud:callmap` **0**（六档 12/9/34/26/6/8，相加 95）、`node --check` 0。

同日第三十七批（**拆掉我自己那道普查里的"空载 0"**，2026-10-09，产品代码一字未改）：
给普查加试玩路由 `/play/probe-project` 时顺手看了下桌面臂的配置，发现它**只注入标记、不带 `?storage=memory`**——
那样 `createStorageProvider()` 选的是 Tauri 支，chromium 里 plugin-sql 必败，页面压根没数据可读，于是"零请求"里有**空载伪装成干净**的成分
（这正是本脚本第 1 条腿要挡的那类假象，只是它藏在"路由挂载成功"底下：`rootChildren > 0` 只证明 React 挂了，不证明它有内容可渲染）。
改成**标记 + `?storage=memory`**（E17 一族用的就是这套，桌面点击路径唯一可测入口）后重跑：**9/9 路由挂载、桌面臂唯一调用点仍是 0**，
正对照从 9 升到 **11**（新增 `play/story/probe-project`、`editor/projects/probe-project/view` 一类）⇒ 这次"桌面装载面零云端依赖"是有本地库在跑、且方法被证明接得住请求的读数。
两臂合一臂（原本想加的第三臂"不注入标记 + memory"读出来和浏览器臂完全同一批端点，说明 `?storage=memory` **单独**并不能把页面级消费者切本地——
闸门是 `isLocalOnlyDeployment()`（看标记），不是存储参数。这条差异我上一批已经登记，这次它顺带被复证了一次，
所以第三臂删掉，不养一个不产生新信息的臂。
**改脚本时同一个坑连踩三次**：用 `perl -i -pe` 改含 `${...}` 模板字符串的行，perl 会把 `${p}`、`${webUnique.length}` 当成**它自己的**变量插值成空 ⇒
输出里出现 `LOCAL_UNIQUE=`、`  本地支：`（11 条明细全空）、`BROWSER_UNIQUE=（正对照）`三处断行，
其中"11 条本地支明细全空"我第一眼竟当成"没有端点"读了。**规矩钉死：改代码一律走 Edit，shell 只用来跑命令。**
末轮（08:17）：`check:http-inventory` **0**（`DESKTOP_UNIQUE=0 / BROWSER_UNIQUE=11 / ROUTES=9 UNMOUNTED=0`）。

同日第三十八批（**把 S13-3 需要的两侧事实并到同一屏：资源 → 本地表 / L4 契约方法**，2026-10-09，产品代码一字未改）：
`cloud:callmap` 末尾新增一段词元表：从 95 条端点路径里取资源词元（朴素去尾 `s` 单数化），对
`sqlite/backend.ts` 的 **13 张表** 与 `storage/types.ts::StorageProvider` 的 **39 个契约方法**做包含匹配，逐行印出"表:… / 契约:…"。
**脚本刻意不下结论**——它给的是匹配依据；让工具冒充判断是这张表最容易坏掉的方式，所以注释里写死了"匹配不到 ≠ 一定没有替身"。
这条限定不是套话，当场就有一个实例（下面第三行）：**关系**在库里没有 `character_relations` 表，看着像"无替身"，
但实测 `characters.character_data` 是 **JSON TEXT 列**，而运行时 `packages/core/src/conditions.ts`、`ir.ts`、
以及 `axsp.ts::remapCharacterIds` 都在读 `relationship` 键 ⇒ **读侧有本地承载，缺的是编辑写侧**
（`shared/api/relations.ts` 6 处 `apiClient`、零分派口引用）。所以关系这族真正的问题不是"要不要本地化"，而是
"编辑路径要不要落到 `character_data` 里"——这一句是判死/本地化定档里最省事的读法。
词元表读数（挑与定档相关的）：
`achievement` 表 `achievements,player_achievements` + 契约 `listAchievements/saveAchievement/deleteAchievement/unlockAchievement` ⇒ **四件套齐**；
`session`（`/play/sessions*`）与 `version`、`user`、`identity`、`comment`、`report`、`tag`、`search`、`llm` ⇒ **表与契约都是"无"**；
`relation` / `relation-graph` ⇒ 表与契约"无"，但如上所述读侧在 JSON 里；`storie`(=stories 的词元化产物) ⇒ 表 `character_stories` + 契约 `listStories`。
**这张表给 S13-3 的实际效果**：原本要逐条读 `shared/api` 的 34 个绕过点，现在压缩成三种问句——
① 有没有本地表/契约（有 ⇒ 只差分派；无 ⇒ 判死或新建）；② 状态是不是藏在 JSON 列里（关系即此例）；③ 是不是服务端本质（评论/举报/Discover/搜索/账号身份）。
**同时留一条诚实限定**：词元匹配会把 `stories` 变成 `storie`、把 `players` 与 `player_achievements` 牵上（`play`/`player` 词元匹配到 `player_achievements` 是**假阳性**——试玩会话表和成就表不是一回事）。
所以我只在文档里引用"表/契约为无"这一侧的结论，正向匹配一律回代码核对，不拿这张表当判据。
末轮（08:21）：`cloud:callmap` **0**（含词元段；非零守卫正常：13 表 / 39 契约方法）。

同日第三十九批（**把「绕过」那 34 条从一串名字变成可定档的三态**，2026-10-09，产品代码一字未改）：
词元表只回答"有没有替身"，而 S13-3 真正要逐条签字的问题是**这条在桌面该判死、该本地化、还是只差接线**。
所以下面这段把 34 条按两个可机械判的信号分开：**本地承载**（末段命中才算自身）+ **调用者可达性**（是否只落在 `features/discover/` 下）。
读数（`awk` 数过：22 + 6 + 4 + 1 + 1 = **34**，与「绕过」档总数相等才敢贴）：
- **无本地承载 = 22**：评论 / 举报 / 搜索 / 标签 / 会话 / 账号身份 / llm 健康 —— 服务端本质那一族，判死候选。
- **仅父资源有承载（子资源无专属表）= 6**：`relationApi` 的四条 + `versionApi` 的两条，命中词元都是 `characters`。
  这一档的问句不是"要不要建表"，而是"子资源落到父记录里还是外面"（关系已有在册实例：读侧在 `characters.character_data` 的 JSON 里）。
- **无本地承载 · 调用者仅 Discover（桌面不可达）= 4** 与 **自身承载 · 仅 Discover = 1**：桌面结构性没有这些入口，
  可达性是机器判的（`r.files.every(f => f.includes("/features/discover/"))`），不是我印象里"应该进不去"。
- **该资源自身有承载（只差分派）= 1**：`playerApi.getCharacterStates`。
**这轮新增的两条口径**（比第三十八批的包含匹配更硬）：
① **词元改成下划线全等**——第三十六批已经抽查到 `play` 子串匹到 `player_achievements` 的假阳性，当时只把它登记成限定；
   这一轮直接改判法，"匹配"这一步不再需要人工记得（**能改成算法的限定不要留在注释里**）。
② **只有路径末段命中才算"该资源自身有承载"**，父段命中单独立一档（子资源无专属表）——
   否则 `characters/${id}/relations` 会顶着 `characters` 表的命中被误读成"关系已本地化"。
另加一条可达性信号：**调用者集合是否全部落在 `features/discover/` 下**，机器判桌面结构性无入口，不靠印象。
**两条机器指对了、结论仍需回代码核对**（这正是第三十八批那条限定的形状，本轮各拿到一个实例）：
① `projectApi.get` 落在"自身承载"档，但它的界面调用点只有 `DiscoverProjectDetailPage.tsx:33`，另一处 `httpStorageProvider.ts:153` 是实现侧（已排除）⇒ 桌面不可达；
② `getCharacterStates` 命中 `characters` 词元，但它是**一次试玩会话里的角色状态**，不是角色记录本身 ⇒ 词元全等也挡不住的语义假阳性。
（第三十六批那三处分类器缺陷——分派口漏认 `getStorageProvider`、符号归属只取每文件第一个 `xxxApi`、HTTP 实现文件被当界面绕过点——**不记在本批名下**，那一批已各自修好并抽查过。）
**顺手抓到自家工具的一处静默漏计**：调用点匹配用的 `useRe` 带着 `g` 标志，而同一个正则对象会对**多个文件反复 `.test()`**
——`test()` 命中后 `lastIndex` 跟着对象走，下一个文件就从那个偏移开始搜，**调用点若出现在更早的位置会被静默判成"没调用"**（分档随之错）。
最小复现（`node -e`）：`"y ".repeat(2500)+"api.get("` 与 `"api.get("` 两个串，带 `g` 时第二次 `test` 返回 **false**，去掉 `g` 返回 **true**。
今天这份语料**没踩到**（去掉 `g` 后全表与分档计数逐字节相同，`diff` 为空——这是实测，不是推断），所以这不是"读数是假的"，是**形状上留着一个人工无法预料的洞**；已去掉 `g`（这里只用 `test`，`g` 本来没有任何作用）。
末轮（08:31）：`cloud:callmap` **0**（六档 12 / 9 / 34 / 26 / 6 / 8 = 95；绕过三态 22 / 6 / 4 / 1 / 1 = 34；去 `g` 前后表全等）。

同日第四十批（**「绕过」的真实分母要按调用点减掉壳守卫，而不是按文件**，2026-10-09，产品代码一字未改）：
"没有分派口引用"不等于"桌面态真会打出去"——还有第三种本地化形状：调用点自己带壳守卫。
按**文件**算会把这面读成 34 条全安全，实测 `useRelations.ts` 五条查询里**只有 `presets` 一条**写了
`enabled: !isLocalOnlyDeployment()`，另外四条（list / graph / create / delete）没有 ⇒ 判据必须落到调用点。
三条可机械判的形状（各配实例）：**S1 同块**（守卫在这条调用所在的最内层 `{}`，`enabled:` 即此形状；
注意要查**整块**而不是"调用之前那一截"——`enabled` 常写在 `queryFn` 后面，第一版这样写时 S1=0），
**S2 同句**（`if (guard) { api.x() }` 的块头），**S3 早退**（祖先块里"直接子语句 + 含 `return`/`throw` + 整条语句在调用之前"，
`userApi.session` 与 `nexusApi.sendToInbox` 就是这一形状）。
**读数**：扫描面「绕过 + 混合」40 条 / 调用点 **53** 处 ⇒ 有守卫 **9**（S1=7 S2=0 S3=2）/ 无守卫 **44**；
端点级：全有守卫 **5** / 部分 **4** / 全无 **31**（相加 40）。**只看绕过**：5 条调用点全被挡开、0 条部分、**29 条真会打出去**。
⇒ S13-3 的候选清单从 34 缩到 **29**（另 5 条已在界面上显式降级，跟"判死"是两种东西）。
**两次变异证明这两条收紧不是装饰**：关掉 S1 ⇒ 有守卫 9→2（S1=0）；去掉 S3 的"直接子语句"深度限制 ⇒ 有守卫 9→**11**、
"全有守卫"5→7，`versionApi.get` / `rollback` 被错判成安全——**过度信任的方向才是危险方向**（少判守卫只会多列一条候选，多判守卫会把真缺陷藏起来）。
**合成样本兜住两条真实语料里没有的形状**：`if (guard) { api.x() }` 判 S2、`!guard && api.x()` 判 S1，
反向两条（块头没守卫、守卫写在隔壁函数里）都判 `null`；S2 在本面 0 命中，所以扫描面**特意扩到「混合」**——
一条永远拿不到样本的判据分支等于一条没验过的判据分支。
**顺带修掉两处自家口径分叉**：① 词元并排表还在用 substring 包含、而三态已改词元全等 ⇒ 现在两块共用同一个 `matchOf`；
② 可达性与守卫都改读全量 `hitFiles`（展示用的 `files` 截到 4 个，超过 4 个调用点时可达性会判反）。
**还有一次流程错误值得留档**：中途一次 `grep` 结果为空，我几乎把"脚本 `SyntaxError: suspect 已重复声明`"读成"没有命中"——
判据脚本非 0 或输出缺失时，**先看退出码和输出尾部，再谈读数**。
末轮（08:46）：`cloud:callmap` **0**（连跑两次输出相同）、`gates` **0**（14 道）、单测 **706 passed + 1 skipped**、`git diff --check` 0 行。

同日第四十一批（**死面 12 条补齐判死候选的两侧证据，并登记一条"既死又指错"的端点**，2026-10-09，产品代码一字未改）：
`cloud:callmap` 第九段把「死面」那一档从"界面调用点 0"升级成**读者 × 后端路由**两列并排：
读者口径 = `apps/` + `packages/` + `e2e/` + `scripts/` 共 **448** 个文件，匹配跑在**剥掉注释与字符串之后**的文本上，并排除 `shared/api` 自身（定义处不算读者）；
后端口径 = 解析 `backend/app` 的 **107 个 .py**，从 `APIRouter(prefix=…)` 与 `@x_router.<verb>("…")` 得到 **148** 条路由，
`${…}` 与 `{param}` 都当通配段、忽略 `/api/v1` 前缀与查询串（多行装饰器靠 `\s*` 吃到换行，实测接住了 `/{project_id}/nodes` 这类写在下一行的路径）。
**读数**：12 条的**前端读者全部为 0**；后端路由 **11 在 / 1 不在**。
**那一格"不在"是一条新登记的缺陷**（人工复核过，不是匹配器的假阳性）：
`PUT /editor/projects/${projectId}/nodes/${nodeId}` ← `projectApi.updateProjectNode` 指向一条**后端根本没有的路由**——
`backend/app/domains/narrative/router.py` 里对 node 的 PUT 只有带 scenes 段的 `/{project_id}/scenes/{scene_id}/nodes/{node_id}`，
DELETE 同理，没有"不带 scenes 段的 PUT"。它零读者 ⇒ 今天没有用户影响；摘不摘仍然归在待决 ②（不替自己拍这块板）。
**「测试 0」这一列的结构性前提也做成了机器事实**：调用过任何 `xxxApi.method(` 的测试/e2e 文件数 **= 0**，
所以那一列恒 0 是"**测试层完全不 import api 层**"这个事实，而不是判据坏了——这一条同时是给 ② 的信息：
**判死这批不会碰坏任何测试**（代价是反面的：api 层在测试层零覆盖，判错了也没有回归网）。
**正对照三条**（证明读者匹配器真的在跑，而不是恒零）：`characterApi.create` 读者 2 / `characterApi.update` 2 / `characterApi.listUser` 3；
"在"那一侧也手工验过三条：`/{project_id}/nodes`、`/{project_id}/edges`、`/{project_id}/roles` 的 POST 都确实存在。
脚本自带防退化：读者面或后端路由解析出 **0** 条 ⇒ 自己报 `UNRELIABLE` 并退出 1（这两列都是 0 时表毫无意义）。
**一次流程错误留档**：本轮加这段时，一次 `Edit` 漏传 `old_string`，把 `const root = process.cwd();` **整行吃掉**——
`node --check` 完全通过，跑起来才 `ReferenceError`。**改完脚本必须真跑一次**，语法检查接不住"声明被删"这类损坏。
末轮（08:52）：`cloud:callmap` **0**（连跑两次输出逐字节相同；`gates` 与引用对账见 §5 同批条目）。

同日第四十二批（**"桌面真会打出"要看宿主走不走得到，不只看守卫——并登记一条零消费者 barrel**，2026-10-09，产品代码一字未改）：
第十段把上一批剩下的"未守卫调用点"再问一层：**这个调用点所在的模块，桌面界面根本渲染得到吗**。
机制是一条 import 闭包：从 `App.tsx` 的路由表出发（`<Route path="…" element={<X/>}>` **也包括没有 path 的 `<Route index …>`**），
沿静态 import 与 `import("…")` 走到叶子模块；`@/` 按别名解析，后缀试 `.ts/.tsx/index.*`。
**遮蔽要做两份**（这是本轮第一个坑）：抽 import/路由要用**只遮注释、保留字符串**的文本，
因为 `import("@/…")` 的路径**就在字符串里**——第一版直接拿 `maskNonCode` 去抽，得到"`0` 条路由 / 44 处调用点全判走不到"，
靠段里那条非零守卫（`routeMods` 为 0 ⇒ `UNRELIABLE` 退出 1）才没被当成读数用。
**读数**：44 处未守卫调用点 ⇒ **宿主不早退（保守上界）21 / 不在任何路由闭包 12 / 只在桌面早退的宿主页里 9 / 叶子组件全仓无 `<它>` 渲染点 2**（21+12+9+2 = 44）；
**（复量 2026-10-09 第四十七批：这四个数作废。**不在任何路由闭包** 那一档归零、宿主不早退 21 → **27**、端点级"全走不到" **12 → 6**——
成因是普查自己的缺陷（`lazy\(\(\)` 那条严正则认不出 5 条跨行写法，把真路由页算成走不到），全文见 §4 同日第四十七批。历史文本按惯例不重写，只在这里挂这条批注。）
端点级：35 条有未守卫调用点的端点里，**12 条所有未守卫点桌面都走不到、23 条至少一处走得到**。
**判成"桌面早退"的路由页实测 3 个**：`dashboard`（CreatorDashboardPage）、`/discover`（DiscoverPage）、`/profile`（ProfilePage）——
我原以为是 4 个，读代码才知 `CreateCharacterPage.tsx:84` 那条写在 `handleAiSuggest` 里，不是页面级早退。
**本轮抓到四处判据缺陷，全部是"逐条把机器结论读回代码"抓出来的，不是从读数猜的**：
① 上面那份遮蔽口径；② `<Route index>` 没有 path ⇒ PlayerPage 整棵子树看不见（**漏的是可达那一侧＝把真可达判成走不到**，方向最坏）；
③ 叶子"死组件"最初拿**文件名**当组件名 ⇒ `UserContext.tsx` 被判成死 import（它默认渲染的名字是 `UserProvider`）；
收窄到"只看 PascalCase 的**默认导出**"后，另一条早先的版本还会把 `PLAYER_KEYS` 这种常量当组件；
④ `earlyReturn` 原来是一条宽松正则 ⇒ `PlayerPage.tsx:369` 里那句写在 `load` 回调（深度 1）的 `if (!isTauriEnvironment())` 被当成"整页早退"，
改成"必须是**组件体的直接子语句**且带 `return`/`throw`"（这是**过度信任的方向**，比漏判危险，所以优先修）。
**新登记一条（只登记不处置）**：`apps/web/src/shared/hooks/index.ts` 是**零消费者的 barrel**——全仓没有一处 `from "@/shared/hooks"`，
而它 `export * from './usePlayer'` 底下的 `usePlayer.ts` 正是那 **6 条 `/play/sessions*` 端点的唯一调用者** ⇒
**这 6 个试玩云端点在任何界面（不只桌面）都走不到**。这一条同时是 S13-3（判死候选）与 S13-6（后端 `/play/sessions` 那族在为谁服务）的输入。
**限度写在脚本头**：import 闭包 ≠ 渲染可达；**消费者级条件渲染不认**——实测 `AppHeader.tsx:69` 用
`{showSearch && !isLocalOnlyDeployment() && <GlobalSearch />}` 挡住了整块搜索，而 `GlobalSearch.tsx` 自己一行守卫都没有，
所以搜索那一族留在"保守上界"里没被摘掉；方向上是**宁可多列、不许藏缺陷**。
末轮（09:06）：`cloud:callmap` **0**（连跑两次逐字节相同）、`[file-size]` 0 越线（`scripts/` 不在它的面内）、其余见 §5 同批条目。

同日第四十三批（**死表面普查上线：10 个模块界面加载不到，含两个零消费者 barrel**，2026-10-09，产品代码一字未改）：
第十一段从**真入口 `main.tsx`** 走 import 闭包，把"界面加载不到的模块"从个案发现变成一张完整清单——
此前 `PromptExport`（#60）、`GlossaryEditor`（#58）、`usePlayer` 都是一次一次手工撞出来的，同一族问题值得一次数完。
**读数**（面 = `apps/web/src` 的 285 个 .ts/.tsx）：闭包内 **245** / 闭包外 **10**；
其中"只有测试在读"= **0**（机制读者也没有 ⇒ 删掉不会碰坏任何测试）；
10 个真死模块：`shared/api/index.ts`、`shared/hooks/index.ts`、`shared/hooks/usePlayer.ts`、`features/discover/components/DiscoverStatsBar.tsx`、
`features/studio/components/GlossaryEditor.tsx`、`shared/components/{BrandIconMark,ItemCard,ItemCreateDialog,RadarChart,SceneCreateDialog}.tsx`。
另有一档"在闭包内但除 import 语句外全仓零引用"= **2**：`PromptExport.tsx`、`shared/components/ui/DraftIndicator.tsx`——
这一档是**名字判据**（比闭包弱），所以只列名不判死。
**逐条读回代码验到的两件事**：
① `shared/components/ItemCard.tsx` 确实没人用，而 `ItemsPage.tsx:38` 有一个**同名的本地** `function ItemCard` 在渲染——
名字判据会被这种撞车骗过去，**闭包判据不会**（这正是两档要分开、且只信闭包的原因）。
② `DraftIndicator` 的全部外部痕迹只有一条 barrel 再导出（`ui/index.ts` 的 `export { default as DraftIndicator }`），
所以"import 语句里的名字不算引用"这条规则必须存在，否则每个 barrel 都会替它挡一下。
**这一轮把四处判据修到了正确方向，每一处都是"给活代码贴了死标签"那种最坏的错**：
`importRanges` 第一版从关键字往后贪吃 900 字符 ⇒ 把 `export default function App() {` 当成语句、
连下面 `App.tsx:95` 的 `<StudioLayout />` 一起抹掉，活布局被判零挂载（改成"整条 import 语句"的正则，不再靠长度）；
只查**默认导出**的名字 ⇒ `PublicLayout.tsx`（只被 `import { DiscoverLayout, AccountLayout }` 用过）被误判（改成看**全部导出**）；
`CharacterCard` / `StudioLayout` / `BondEditor`（注册表 `component: BondEditor`）、`FlowStudioView`（`const LazyX = lazy(...)` 改名）四种形状先后各错过一次；
把 `allPool` 留在块作用域里而模块级的 `lazyTargets` 先用它 ⇒ `ReferenceError: allPool before initialization`，
**`node --check` 一样过不了这种错吗？过不了的是运行期**——上一批刚写过"改完脚本必须真跑一次"，这次是靠这条教训才没停在语法绿上面。
**内置对照组**（写进脚本，不靠我记得）：`shared/hooks/index.ts` 与 `usePlayer.ts` 必须落在"真死"、
`ProjectListPage.tsx` 三档都不许出现；对照不成立 ⇒ 脚本自己报 `UNRELIABLE` 并退出 1。
**给 ② 的新事实**：`shared/api/index.ts` 也是零消费者 barrel——判死时"删掉 api 层的某个函数"不会牵连 barrel，但**两个 barrel 本身现在就是可摘的死表面**。
**留一条诚实的债**：`scripts/cloud-callmap.mjs` 到 **873** 行，而 `[file-size]` 的门面是 `apps/*/src` 与 `packages/*/src`，**不含 `scripts/`**（本轮实测确认，不是推测）。
我没有拆 `scripts/lib/` ——现在只有一个消费者，抽象是猜的；等第二个消费者出现再拆，届时按依赖方向切而不是"哪段最像一块"。
末轮（09:22）：`cloud:callmap` **0**（连跑两次逐字节相同）、`gates` **0**（14 道）、单测 **706 passed + 1 skipped**、`git diff --check` **0** 行。

同日第四十四批（**把死表面从清单升成第 15 道门禁，并顺手抓出一条 README 一直在说的假话**，2026-10-09，产品代码一字未改）：
清单不会挡住"今天又写了一个没人 import 的模块"，所以上一批那 10 个死模块值得有一道棘轮。
**接线三处同轮**：`package.json` 的 `check:dead-surface` + `gates` 链 **14 → 15 道** + `README.md` 门禁表补一行。
**等价性判据机械化**（重构工具本身也要能证明没改行为）：动手前先把 `cloud:callmap` 的输出存成金样，
改完逐字节 `diff` ⇒ **只有 1 行不同**：读者面 `448 → 449`——那是我刚新增的 `scripts/source-graph.mjs` 自己进了被扫的面，
属于口径的真实变化，不是判据坏了。
**公共域抽出来了**：模块图、两份遮蔽、目录遍历（含 `Clearance/` 禁入的跳过清单）全部搬进 `scripts/source-graph.mjs`，
`cloud-callmap.mjs` 与 `check-dead-surface.mjs` 共用同一个真相源（上一批留的那条债在这里还掉——第二个消费者出现了，抽象不再是猜的）；
`cloud-callmap.mjs` 从 **873 行降到 718 行**。
**这道门禁只用闭包档**（名字档只列名不判死的理由沿用上一批：`ItemCard` 的同名本地组件会骗过名字判据）。
被测试 import 的模块**不算死**（机制读者在册），`*.test.tsx?` 自身不进基线。
**三条腿逐条验过（退出码单独取，不靠管道）**：
① 该放——现状 OK，退出码 **0**，`闭包外 10 个模块全部在册（基线 10）；面 285 个文件、闭包内 245 个`；
② 该拦——临时放一个没人 import 的 `GateProbeDeadModule.tsx` ⇒ **FAIL 退出码 1** 并点名该文件，删掉后立刻回到 OK（`git status` 该目录干净）；
③ 缩短提示——往基线里塞一条已不存在的条目 ⇒ `OK …（基线 11）；已摘除 1 个 ⇒ 基线该缩短：… --update`（具名基线不缩短等于没关）；
④ 失效锁——从 `/tmp` 跑（没有 `apps/web/src`）⇒ `UNRELIABLE —— 面=0 个文件、闭包=0 个、入口存在=false` 且**退出码 1**，
   绝不让"图没建起来"伪装成"没有死模块"。
**两工具口径对账**：门禁的 10 条与普查第十一段的 10 条**集合完全相同**（按路径比对，命令算的）——
同一份图给出同一份答案，这才是共用真相源该有的证据。
**顺带抓到一条文档谎话**：README 的 `pnpm gates` 行写着"**共十一道**"，而链上其实是 15 道（citations/publish/seams 三道都漏在文字外面）。
这条不是笔误级的小事——门禁表是给接手的人看的当前状态，它数错了就等于替门禁说谎。
现在那一行的条数写明"**以 `package.json` 的 `gates` 脚本为准**"，并把 15 个步骤名从脚本原文抄出来（历史日志里那些"14 道"是当时的事实，不重写）。
**新出现的未跟踪文件三份**（提交时要显式 add，不许顺手 `git add -A`）：`scripts/source-graph.mjs`、`scripts/check-dead-surface.mjs`、`scripts/dead-surface-baseline.json`。
末轮（09:33）：读数见 §5 同批条目。

同日第四十五批（**消费者面的定义错了一类：把 api 层里的"分派层"整个排除掉，于是一条活路径被判成死面**，2026-10-09，产品代码一字未改）：
第九段与六档匹配都把 `apps/web/src/shared/api/` **整目录**排除在消费者之外，理由是"定义处不算读者"。
但那一层里住着一个真正的分派口：`shared/api/draftDispatch.ts`——`:38` 是 `isLocal: isTauriEnvironment`、`:40` 走本地模型、
`:49` 是规则保底、`:45` 的 `remote:` 才调 `aiApi.proseToScript`。按老口径，这条端点被报成**「死面・前端读者 0」**，
而它实际是"桌面走本地、云端只是 fallback"那条**已经本地化完**的通路。
**修法**：消费者只排三类真正不算读者的——定义该符号的文件自身、传输层 `client.ts`、再导出 barrel `index.ts`；
并把 `draftDispatch.ts` 补进 `DISPATCH_FILE_RE`（它按 `shared/storage/<域>Saves.ts` 的命名约定本来就不会被认成分派口文件）。
**读数怎么变的（逐条命令重算，不心算）**：六档 `12 / 9 / 34 / 26 / 6 / 8` ⇒ **`11 / 9 / 34 / 27 / 6 / 8`**（相加仍 = 95）；
消费者扫描 234 → **253** 个文件、读者面 450 → **471**；被移走的那一条正是 `POST /editor/ai/prose-to-script`，
现在它带 `界面调用点 1  分派口: apps/web/src/shared/api/draftDispatch.ts`。
**没变的那些同样要报**：绕过 **34** 不变 ⇒ 上一批的"桌面真会打出 **29** 条"不受影响；守卫面 40 条读数一字不变（全有守卫 5 / 部分 4 / 全无 31）；
死面剩下的 **11** 条前端读者**仍然全部为 0**、后端路由 **10 在 / 1 不在**（新登记的那条 `projectApi.updateProjectNode` 指错端点不受本次修正影响）；
`check:dead-surface` 基线仍是 10 个模块。**正对照现在的第一个就是 `proseToScript`（读者=1）**——修正本身被摆在对照位上，下次再退化会立刻红。
**顺带量出一道门禁面缺口（登记，不悄悄扩）**：`check:dispatch` 遍历的是 `apps/web/src/shared/storage/`，
判据按命名约定 `<域>Saves.ts` + `assetPool*` + `achievementDefs` 一条已知偏差；
`shared/api/draftDispatch.ts` 同样在做本地/云端分派（还是四支：本地壳判定、本地模型、规则保底、remote），**却整个不在那道门禁的面里**。
它不是零判据——同目录有 `draftDispatch.test.ts`——但"每个导出函数都有本地支"这条判据今天挡不到它。
我没有顺手把它塞进门禁：**扩面前要先量这条判据套在它身上会不会误报**（它的导出形状是 `draftDeps` 对象 + 两个 async 入口，
和 `*Saves` 那族"一个函数一条本地支"不同形），这一步留作下一刀，不混在本批。
**同批更正**：§4 第四十一批写的「死面 12 条 / 后端路由 11 在 1 不在」与 §6 ② 里同一组数，是**旧口径下的真实读数**，保留不重写；
本节起以 **11 条 / 10 在 1 不在** 为准。
**同批扫了一遍 README 的"当前状态数字"**（上一批修掉"共十一道"之后，同类问题不会只出现一次）：门禁自己会打印读数，README 抄了一遍就会腐烂——
本轮改了三处：`check:citations` 写"判定 161 条 / 基线 3 条"而门禁打印 **216 / 5**；`check:labels` 写"204 个 tsx"而门禁自报 **205**；
`check:seams` 写"真断言合计 94"而现在门禁打印 **99**。三处一律改成"引门禁自报的数 + 取数日期"，
**规则**：文档里凡是"门禁自己会打印的数"都写成引用而不是抄录——抄录的那一刻起它就开始腐烂，而腐烂的当前状态比没有状态更坏。
末轮（09:43）：`cloud:callmap` **0**、`check:dead-surface` **0**（基线 10 不变），其余见 §5。

同日第四十六批（**把上一批登记的 `check:dispatch` 面缺口关掉——先量误报再扩面**，2026-10-09，产品代码一字未改）：
上一批只登记不动手，理由是"这条判据套在异形分派上会不会误报"没量过。这一批量了：
把门禁原样指向 `shared/api/draftDispatch.ts`（只改探针副本的 dir/文件名，产品代码一行未动）⇒ **两条导出 async 函数全部被误报成"没有本地分支"**
（`requestDraft` / `requestAxsDraft`；形状都是 `positive-block`，判据要的是"本地那一支调 provider"，而这一族走的是 `await draftDeps.model(...)` 与 `rulesDraft(...)` 保底）。
**所以扩面和放宽证据必须同一次做**，否则门禁一上去就是红的，下一次有人图省事就会把它摘掉。
**证据形状改成三条**：真 `await provider` / `await 注入的本地能力(...)`（即 `await \w*[Dd]eps\.(?!remote\b)\w+(`）/ 退回规则保底。
**`remote` 被显式排除**——本地窗口里出现云端调用不是证据，这条是整个判据最容易被糊弄的口子。
**读数**：`扫描 5 个分派口文件 / 30 个函数 / after-guard=26、positive-block=4` ⇒ **`6 个文件（storage 5 + api 1）/ 32 个函数 / after-guard=26、positive-block=6`**；
**旧面那 30 条一条形状都没变**（放宽只增"可接受"集合，不减既有判红），这是扩面不带回归的证据。
**牙齿两条，都是造一棵假目录树再 `cd` 进去跑，产品代码零改动**：
① 把副本里的本地支改成只 `await draftDeps.remote(` 并把 `rulesDraft(` 改名 ⇒ **FAIL 退出码 1**，逐条点名两个函数（证明"放宽"没放宽到放过假本地支）；
② 把面二那个文件删掉（模拟改名/移走）⇒ **FAIL 退出码 1**：`面二…命中 0 个文件：它被移动或改名了，这张面正在静默消失`
——**门禁的面只能显式缩短，不能悄悄缩回一半**（这条控制位是新加的，上一批 README 那条"抄数腐烂"属于同一族：无声的变化最贵）。
探针目录与副本已全部删掉（`/tmp/dprobe`、`/tmp/gate-probe.mjs`），`git status` 复核：产品代码零改动（`git diff --stat apps/web/src/shared/api/draftDispatch.ts` 空），
本轮只动 `scripts/check-dispatch-local.mjs` 与文档；**没有新文件**，所以 §6 的显式 add 清单不变（`??` 仍 **41** 项，09:47 与 09:51 两次相同）。
末轮（09:51）：读数见 §5。

工作区里还存在**本任务之前的用户改动**：`backend/app/domains/llm/providers/__init__.py`、`backend/uv.lock`，以及未纳管的 `Clearance/`。它们不是本重构的一部分，禁止覆盖、清理、暂存或读取 `Clearance/` 内的 `.env`。

同日第三十一批（**一次独立复审，107 个改动文件里抓到 6 处「判据够不着它声称守的契约」**，仍未提交）：
起手假设是"上一轮留下的东西大体可信"，结论不成立。共同形状不是漏写，是**够不着**——三处在产品代码、三处在门禁。
明细逐条在 `REFACTOR_DESKTOP.md`「补记（2026-10-01，复审）」，这里只留一句索引：
① `importProjectFromAxsp` 的 `saveAsset` / `saveCharacter` 两个出口**根本没有回滚**（`rollback` 那时还没定义），
`createProject` 失败会留下整组孤儿角色 ⇒ 修法是把它提到最前，判据从 7 个出口补到 9 个并加一条"枚举与调用点数对账"；
② `translatePlaceholders` 的守卫靠正则猜引号边界，看不见标识符与注释里的 `?`，
而头部原写"错位后照样能执行成功、只是绑错值"**被真实 sqlite3 解析器否掉**（实测是 `Incorrect number of bindings`，响亮失败）
⇒ 改成结构上只重写代码区，fail-closed 挪到"引号/注释没闭合"这个可判的形状上；
③ `index.test.ts` 两条"根目录被清空"是**恒真断言**（初值本来就是 null）⇒ 先塞脏值再进工厂；
④ `check-doc-citations` 的「文件不存在」整档被 basename 掩护关着（实测中着 1 条真错路径），
连同 `suffixHits` 吃 `everyFile`（已判定数虚低 28 条）与 `SKIP_DIR` 两种输入形状两处一起修 ⇒ **已判定 168 → 197**；
⑤ `check:seams` 第 2 层被 `import type` 与注释掉的 import 绕过（正是它声称关掉的洞）、第 3 层的 `assert.ok(true)` 算成真断言；
⑥ `check:apibase` 的「基址定义」档宽到"client.ts 里任何提到 apiBase 的行都豁免"。
**这一轮否掉两条读起来很像真的缺陷**（否则会写成假账）：「守卫误伤合法 SQL」在穷举语料里 0 例复现；
反例 `'x'', '?'` 本身是 SQLite 语法错误。**待决清单没有因为这一轮变短**。

同日第三十二批（**把同一轮审计里剩下两条发现也收掉**，仍未提交）：上一批只修了三道门禁，
漏了同一次审计里**已经指出**的另外两道——"审计出来的缺陷只修一半"这件事本身比那两道缺陷更难解释，所以补上。
- **`check:dispatch`**：`registeredSkip` 原是整窗口的 `seg.includes("skipped-offline")`，
  注释里写一句那个串就能买通行证 ⇒ 收成只认剥掉注释后的代码（与 purity / seams 同一口径，
  到这里四道门禁终于共用一个"代码 vs 散文"定义）。分母：`playerSaves.ts` 两处真用法都在代码里 ⇒ 零误伤。
- **`check:labels` 四种写法全被放过**（都实测过，其中一条把旧逻辑装回去验过确实放过）：
  标签自己的 id 接住自己的 `htmlFor`（收紧到"目标 id 必须挂在**可标注元素**上"，分母是全仓 11 处 htmlFor 全部合规 ⇒ 零误伤）／
  id 只写在注释里也算接住／`<label htmlFor>` 没给取值被 `if (target && …)` 短路掉／
  `aria-labelledby` 用子串比（`"group-header-2".includes("g")` 为真）。
- **否掉一条**：审计里写"收紧后的正向档能被空块骗过"，**实测不成立**——空块 / `return null` / 块内只有 TODO 注释，三种都照红。
  不成立的读数也记下来，否则下一个人会去"修"一个不存在的洞。**审计报告本身是待验证的材料，不是结论。**
读数不变：205 文件裸标签 0、dispatch 30 个函数形状 `after-guard=26 / positive-block=4`、`gates` **0**。

同日第三十三批（**审 `packages/axs`，抓到一个静默缺陷并修掉；顺出一个既有缺陷登记为待决 ⑭**，仍未提交）：
起手是复审时注意到但没追的一条——`assignBeatIds` 的计数器按**原始标题**记，而 id 是拿 **slug** 拼的。
- **实测**：`# Hello World` 与 `# hello-world` 是两个**不同标题**却共用同一个 slug ⇒ 都拿到 n=0 ⇒ **id 相同**；
  `parseAxs` 零诊断，下游 `parseAxsToPlan` 里 `beatIdToNodeId` 按 beat.id 建键、后者盖掉前者，
  于是一段本该「A 顺序走到 B」的邻接边**退化成自环**（读数 `gen-2 → gen-2`，`id: "hello-world-hello-world"`）。
  节点 id 本身是对的（`gen-1`/`gen-2`，`usedNodeIds` 守卫有效），**只有边坏了**——
  这也说明为什么第一轮读数里"节点没重复"差点把人骗过去。
- **与已登记的 #69 是同一族但维度不同**：那条是**同名**塌成一个节点（按标题去重是对的），
  这一格是**不同标题、相同 slug**。
- **修法一行**：计数器改按 slug 记。已承认的同名规则逐字不变（两个「开场」仍是 `开场` / `开场-2`），
  往返 `parse(print(beats)) ≡ beats` 保住。判据 4 条（id 不同且无自环 / 三个同 base 的编号 / 同名族回归护栏 / 往返不变），
  牙：退回修改前形状 ⇒ **恰好 3 红**，而回归护栏两边都绿。`axs` 90 → **94**。
- **取数两次取错，都记下来**：① 第一次分母把 Python docstring 的 `# ===` 下划线当成 AXS 标题（645 文件里 18 处"撞车"全是假的），
  改成只量 `docs` 的 axs 围栏 + `testdata/axs-draft` + 测试内联模板串（33 段 / 34 条标题）；
  ② `.axsp` 那三份第一轮只报了"未解包"——按今天已犯过一次的教训改用 `unzip -p` 结构化读，
  结果是三份的 `axsSource` **都是空串**（叙事在 `nodes` 里），侧分母 0。
  最终分母 **0 处真撞车** ⇒ 加 warning 零误报，但**没加**（理由见下）。
- **顺出的既有缺陷（不是本轮引入，修改前后一样红）**：`标题-N` 不是保留命名空间——
  `# 开场` / `# 开场` / `# 开场-2` 实测得到 `开场` / `开场-2` / `开场-2`，重复 id + 自环 + 零诊断。
  不能在实现里顺手修（`titleToId` 是「原始标题先、id 后」，字面标题占住 `开场-2` 之后自动生成的引用会解析错拍），
  要关掉它必须改**消歧方案本身** = ADR-016 的语法冻结面 ⇒ **登记为待决 ⑭**，不自行动手。
- **一条自己写错的判据**：第四版断言我按"作者写 `-> slug` 是想指向第一拍"来写，红了。
  探针显示往返完全正确，而那个前提是我编的（引用按字面标题归属，且**修改前就是这样**）。
  按"改断言不删断言"改写成真正的契约（往返不变式），把编出来的前提留在注释里当限度。

同日第三十四批（**审 `packages/editor-core`：22 条线索里自证 5 条、修 5 条，其余 17 条分层登记**，仍未提交）：
两个只读审计给了 22 条线索。按前几轮的经验（`check:dispatch` 那次 5 条里 3 条不成立），**审计报告本身是待验证材料**，
所以逐条自己跑探针，只把自证的当缺陷修。
- **① `journalUndo` 让"任何 redo 之后的 undo"变成静默空操作**：`redo` 把 future 栈顶那条**原样**提升进 past，
  所以 undo 写 future 时就必须已经写成一条合法 past 条目（`before` = `last.before`，不是 `current`）。
  实测 `apply → undo → redo → undo` 的第二次 undo 返回 `rev=1`、与撤销前完全相同，**却报 `ok:true`**，UI 会弹「已撤销」。
  顺带修好该文件自己声明的 `rev = before.rev` 不变量。既有那条判据只断言 redo 之后的 draft 与栈长度、**没有再 undo 一次**，所以一直绿。
  牙：旧形状 ⇒ **恰好 1 红**。
- **② `collectAssetRefs` 漏掉 `meta.coverImage`**：ref 进了 `project.json`、导入时原样写回，但**字节从没进过包**
  ⇒ 收件机封面空白、`ok:true` 走完全程。与本模块那条不变量正好是镜像：**ref 已声明、字节没跟**。
  牙：撤掉那一行 ⇒ 1 红——**且第一次变异没落进去、跑绿了**（今天第 4 次；改成先 `grep` 确认落点再跑）。
- **③ `removeRole` 对不存在的 role 谎报成功，而本地两端都与后端相反**：实测
  `后端 router.py:298 → 404` / `HTTP provider → not_found` / `Memory → ok:true` / `SQLite → ok:true`。
  权威是后端，同文件另两个 `remove*` 也都报 `not_found`——**只有它��异类**。吞掉的代价：`CutWorkspace` 弹「已移除角色」而什么都没删。
  两端同修 + 判据进**契约套件**（同跑 Memory 与 SQLite）。牙：两端各装回旧形状 ⇒ 各 1 红、点名同一条用例。
- **④ `saveNarrative` 在 Memory 端静默吞掉重复 node id，与 SQLite 语义相反**：Memory 返回 `ok:true`、读回只剩**后者**
  （送 2 个 `id="dup"` ⇒ 读回 1 个）；SQLite 因主键 `io` + 整体回滚（读回仍 2 个）。
  ⇒ 桌面测试宿主悄悄丢节点、真桌面报 io。选对齐 SQLite（铁律 8），判据只断言 `code === "io"`
  ——**语义必须一致、detail 文本不必**。
- **⑤ 画布投影按 13 键白名单重建 `narrative_data`，静默丢字段**：`choices`（`buildScriptFromLegacy` 的唯一输入）、
  白名单外的任何键（类型带 `[key: string]: unknown`）、`editor_data` 里除 `position` 外的键，画布碰过就全消失。
  生产链实测 `openWriterAtSelection`（"在 Writer 中打开"）→ `projectAxsFromCanvas` → `setAxsSource`，
  **Writer 面板当场拿到丢过字段的文本**，保存即落盘。**责任用对照组钉死**：同一节点走 `draftToAxs` 直连两个选项都在，
  走画布两个都不在 ⇒ 丢失在画布这层，不在 `buildScriptFromLegacy`。改法＝以 base 持久态为底 + 覆盖已知键。
  牙：旧形状 ⇒ **恰好 1 红**，红的内容就是症状本身。
- **17 条未复核的线索**按"是什么会 settle 它"逐条登记在 `REFACTOR_DESKTOP.md` 第六节（含 `deleteProject` 不级联、
  `saveAsset` 的 ref 含扩展名与契约矛盾、`visibility` 的 `authorId: ""`、`unpackAxsp` 抛 `TypeError`、`remapCharacterIds`
  漏 `relationship` 三段 key 与 `actors` 等）。**不作为结论引用**，也不和上面五条混在同一层待办里——
  否则真正会咬人的那几条会被淹没。

同日第三十五批（**从那 17 条里再自证 3 条、否掉 1 条**，仍未提交）：
- **⑥ `remapCharacterIds` 漏两处角色引用——跨机导入后指向不存在的角色**：
  ① `key` 只重映射**第一个**点号分段，而 `relationship` 的键是**三段**的 `charA.charB.field`
  （条件侧与效果侧都按 `split(".")` 取 `[charA, charB, field]`）⇒ `charB` 保留**导出方机器上**的 id，
  那条关系从此读写不到。实测 `char-1.char-2.trust` → `NEW1.char-2.trust`。
  ② `actors` 是编译器里优先级最高的 `explicit` 覆盖值（作者可写的角色 id 列表），
  与**已被正确重映射的 `codexScope` 完全同类**，却没有分支。实测原样穿过。
  对照组就是 `codexScope`——三条读数一起看才看得出漏的是哪两格。改法＝`keyOf` 逐分段查表。
  牙：装回首段 ⇒ **2 红**（新用例 + 命名空间护栏一起红）；去掉 `actors` 分支 ⇒ **1 红**。
- **⑦ 结构不合的 `.axsp` 包抛 `TypeError` 而不是返回 `corrupted`**：`storage/types.ts` 的**第一条**设计裁决就是
  「禁止异常穿越内核边界」，而 `readJson` 只保证「能 parse」。实测 6 个畸形形状里 **4 个抛异常**
  （`assets` 缺席/`null`/数字、`project.json` 是 `null`）。可达性不是理论的：`importProjectFromAxsp` 没有 try，
  所以别的机器上截断或被改过的包在导入路上是**未捕获的 promise 拒绝**，而调用方只会 `alert` 一句看不懂的话。
  顺带修掉一个误导：`assets` 是字符串时 `for…of` **逐字符迭代**，报「清单缺素材 a」。
  牙：撤掉三处形状校验 ⇒ **1 红**。
- **⑧ 越界守卫作废了三族「内核不判断」的引用**：`..` 守卫原先在归属判定**之前**无条件生效，
  而下一行明说 `/uploads/…`、`http(s)://`、`data:`、历史裸路径「WebView 自行解析，内核不做判断」。
  代价**比「显示坏图」更大**——`httpStorageProvider.readAsset` 要求 `kind === "direct"` 才读，
  所以带双点的后端上传路径（`a..b.png` 在磁盘上完全合法）在浏览器态**既显示成缺图、又读不回字节**。
  守卫强度不变（本地 ref 的 `..` 照拦）。顺带量了一句：我们自己生成的 ref 是 `sha256+扩展名`、**永不含 `..`**，
  所以这道守卫实际只对**外来 ref** 点火，而那正是它此前误伤的那一族。牙：装回无条件 ⇒ **1 红**。
- **否掉 1 条**：`deleteProject` 不级联（审计称两端分歧）。实测**两端一致**（删工程后两端存档都还是 1 条）。
  这条不成立，大概是只读了 schema 声明没真跑（SQLite 外键要 `PRAGMA foreign_keys=ON` 才生效）。
  **本轮第 3 条被否掉的审计结论**——「reports 是材料」这条纪律的回报率就在这里。
- 线索表已扣掉这 5 条已处理项，**剩 13 条**；下一个优先看的是 `addProjectScene` 的 `sortOrder` 两端不一致
  （`.axsp` 导入会丢作者排好的舞台顺序）与 `saveCharacter` 不兜底 authorId（角色落进「谁的都不是」）。

同日第三十六批（**舞台排序号 + 一条降级为待决 ⑮**，仍未提交）：
- **⑨ `addProjectScene` 的 `sortOrder` 两端各行其是**：`ProjectSceneInput` **声明了** `sortOrder`，
  而 SQLite 硬编码 `COUNT(*)` 把它**整个忽略** ⇒ 这是**生产路径**上的契约违反
  （`.axsp` 导入 `axspImport.ts:126` 显式传的就是它）；Memory 则原样存调用方的值。
  实测**不传时**（两个 live 调用方都走这一支）：Memory `[[甲,null],[乙,null],[丙,null]]` / SQLite `[[甲,0],[乙,1],[丙,2]]`；
  **传 10/20 时**：Memory `10/20` / SQLite `0/1`。
  规则收成一条并写进**契约套件**（同跑两端）：**给了就照给，没给才算下一个**；`null` 与 `undefined` 同义
  （随包三份 `.axsp` 的 `sortOrder` 全是 `null`——运行时不满足那个可选数字的声明，两者都必须走"算下一个"，
  这也是本条改动零影响的原因）。牙：**同一条契约用例**在两端各自装回旧形状 ⇒ 各 1 红、各点各自那一半。
  **顺带记一条限度**：Memory **不是生产路径**（只有 DEV 的 `?storage=memory`），
  所以这半个分叉本身不用户可见——它的危害是**契约套件跑的就是 Memory**，
  于是一个"测试宿主顺序不同、对桌面又绿"的偏差会长期隐身。
- **降级为待决 ⑮**：`saveCharacter` 不像两个兄弟那样兜底 authorId。实测**两端一致**（不是分歧），
  且今天**不可触发**（唯一活路径本来就传对了）。已修的只是 hook 那一行：
  `data.author_id ?? ''` 把"没给作者"折成 `""`——那是**第三种东西**（既不是 null 也不是真作者），
  可见性判定两边都不匹配 ⇒ 角色存进去却在**所有列表**里查不到，只有 `getCharacter(id)` 拿得到。
  改成 `?? getCreatorId()`（零风险）。核心里补兜底要动两个后端的构造参数，
  而"没有作者的角色归谁"本身是设计问题 ⇒ 不自行决定。
- 线索表剩 **12 条**。

同日第三十七批（**一条修、一条有理由地否掉**，仍未提交）：
- **⑩ 同一工程内成就 `key` 必须唯一**（`memoryPools.ts` + `contractPools.ts`）：SQLite 的 schema 有
  `UNIQUE (project_id, akey)` ⇒ 第二次写 `io`；Memory 只按 id upsert ⇒ 两次都 `ok`、读回**两条同 key**。
  后果不是"多一行"——成就面板按列表渲染（用户看见重复项），而 `unlockAchievement` 按 **key** 解
  ⇒ 另一条永远点不亮，是一条谁都够不着的死行。权威是 SQLite（`backend.ts` 那张表是桌面生产路径真在用的）。
  同时钉住另一半：**同 id 仍是更新**、不算冲突——否则会把 `updateAchievement`（先取回再合并补丁、key 不变）一起堵死。
  分母：面板用 `ach_${Date.now().toString(36)}` 生成 key ⇒ **活路径不产生重复**（同一毫秒连点才可能），
  所以这条是**潜在**的，值在把口径钉进契约、让下一个后端不必再猜。牙：Memory 装回旧形状 ⇒ **1 红**。
- **否掉第 2 条（有理由的否掉）**：`manifest.characters` 从不与 `characters.json` 对账。
  量到的关键事实是**这个字段没有任何消费者**——v2 解包真正读的是 `characters.json`，
  生产代码里唯一读 `.manifest` 的地方是 `unpackAxspV1` 读 v1 信封。
  而 `manifest.assets` 之所以要强制"声明的素材必须在包里"，正是因为 `unpackAxsp` **自己**按它决定加载哪些条目
  ——**清单在那里是承重的**。所以这条不是"漏了一条不变量"，而是「**承重处才强制**」的正确形状：
  在没人读的字段上加拒绝，只会让书写松散的外部包导不进来（而 `.axsp` 的定位就是跨机交换）。
  **不修也不登记为缺陷**，但把判据写进文档，好让下一次有人提这条时能直接引用。
- 线索表剩 **11 条**；下一个优先看 `listItems`/`listScenes` 排序两端不一致
  （Memory 插入序、SQLite `updated_at DESC` ⇒ 道具/场景列表在测试宿主与桌面上顺序不同，而两边都绿）。

同日第三十八批（**列表顺序两端不一致——与舞台 `sortOrder` 同形的第三处**，仍未提交）：
- **⑪ `listItems` / `listScenes` 两端顺序不同**（`memoryPools.ts` + `contractPools.ts`）：
  SQLite 两侧都是 `ORDER BY updated_at DESC`，Memory 原样给插入序。
  实测「存 A、存 B、再改 B」：Memory `["A","B改"]` / SQLite `["B改","A"]`。
  权威是 SQLite，而**意图在本仓库里早已定了**——`memory.ts::listProjects` 早就特意写了同样的排序去对齐 SQLite，
  `types.ts` 里也有"两端同一操作产生不同行数，桌面用户会比网页用户少看到重复项却没人解释为什么"那条裁决。
  所以这不是新产品决定，是**同一意图漏了两处**。
  危害形态值得单记：**`e2e:desktop` 跑的正是 `?storage=memory` 宿主**
  ⇒ 凡是断言道具/场景列表顺序的 e2e，都在断言一个桌面不会给的顺序，而两边都绿。
  牙：`listItems` 装回插入序 ⇒ 1 红；`listScenes` 装回插入序 ⇒ 1 红（SQLite 侧两次都保持绿——它是对的那一侧）。
- **写判据时被自己抓到一次**（"判据本身在断言一个并列"）：第一版直接连存两次再断言 `[B, A]`，
  结果**两端都给 `[A, B]`**。原因是两个后端的 `saveItem` 都在存的时刻自己盖 `updatedAt = nowIso()`，
  **调用方给的值根本进不去**；而毫秒级时间戳 ⇒ 连续两次存几乎必然同毫秒 ⇒ 量到的其实是并列
  （Memory 靠稳定排序退回插入序，SQLite 对并列行序未定义，实测也都是插入序）。
  **那样子这条用例是绿的，却什么都没证明。** 改成两次存之间 `await tick()`（3ms），
  并把"为什么必须等"写进注释。
  **教训只与写法有关**：凡是被实现盖掉的时间戳驱动的顺序，判据里都必须显式让时间前进，否则测的是并列。
- 线索表剩 **10 条**；下一个优先看 `saveAsset` 的 ref 含扩展名
  （同字节 + 不同后缀给两个 ref，与 `types.ts:180` 的「同字节→同 ref」矛盾——
  **这条可能该改的是那句契约而不是代码**，所以要先问口径）。

同日第三十九批（**一条改契约、不改代码——本轮最值钱的形状**，仍未提交）：
- **⑫ `saveAsset` 的 ref 含扩展名：结论是「那句契约不精确」，不是「实现有缺陷」**
  实测确认：同一份字节换后缀给两个 ref（`…<key>.png` / `…<key>.jpg`），同名同后缀给同一个 ref。
  但本地那侧 ref 就是**落盘文件名**（`assets/<摘要>.<扩展名>`）——去掉后缀文件就没有类型，
  `readAsset` / `resolveAssetUrl` 都要靠它选解码路径 ⇒ **扩展名必须在身份里**。
  于是改的是那两句契约（`types.ts` 与 `assets.ts` 各一份），把形状改准为
  「**同一内容 + 同一后缀 → 同一 ref**」，并把推导写在实现旁。**产品代码一行未动。**
  **两条用户承诺确实不受影响**（逐条推过、不是推断）：① 「同一张图重复导入只会存一份」——
  重复导入意味着同一个文件名、因而同一个后缀，而"字节相同但后缀不同"对真实格式几乎不可达；
  ② 「工程包在别的电脑上打开时能认得同一个文件」——ref 随包走、接收方按 ref 解析、**不重算摘要**。
  判据钉的是"精确后的不变量"：**同一内容换后缀 ⇒ 两个不同 ref，且两个都读得回同一份字节**
  （只断言前半截的话两种实现都能过）。
  牙：把 `assetRefFor` 改成"只按字节、不带后缀"（也就是照旧措辞"修"代码）⇒ **4 红**——
  新契约用例在两端各 1，外加**两条既有测试独立钉住 ref 形态**。
  **不精确的源码注释本身就是「将来会被照着改错」的种子**；判据钉住精确形状之后，
  那次"改错"会被 4 条而不是 1 条拦住。
- 线索表剩 **9 条**；下一个优先看 `normalizeBundle` 把**类型错误**的 `assetRefs` 归一成 `[]`
  （那是"损坏"而不是"旧版本没这个键"，两者被同一条规则接住 ⇒ 道具引用消失且零信号）。

同日第四十批（**一条修、四条否掉——线索表的尾巴基本是噪声**，仍未提交）：
- **⑬ `redo` 丢弃 `ApplyError`**（`journal.ts` + `document.test.ts`）：原失败分支是裸 `{ ok: false }`，
  按本仓库「空值五义」那套约定改成**可选 `error`**——缺席 = 没有可撤销/重做的内容（**不是失败**，
  不该被当错误呈现）；在场 = 那条事务真的失败了，带回自己的 `ApplyError`。
  加字段是**加法**（旧调用方 `if (!r.ok)` 照旧工作），不改语义。
  为什么值得改：`redo` 上方那句「I5 确定性保证结果一致」指的正是这件事，
  而**确定性只能靠"失败时为什么失败"才谈得上**——把原因吞掉那句话就是空的。
  分母：`redo` 目前**零生产调用方**（全仓只有 `journal.ts` 自己与测试）⇒ 这是导出 API 的修复而非线上缺陷；
  但它是公开面，而公开面没有判据就等于没有契约。牙：把 `error` 吞回去 ⇒ **1 红**。
- **否掉第 4 条（线索陈旧）**：`normalizeBundle` 把类型错误的 `assetRefs` 归一成 `[]`。
  实测**代码已经精确区分**：键缺失（旧版本）⇒ `ok` + `[]`；键在但不是数组 ⇒ `corrupted`，
  消息就是「键缺失才是旧版本；键在而形状错是坏输入」。三种错误类型逐个试过，全是 `corrupted`。
  这条描述的是**修之前**的状态，而那条区分与它的判据早就在树里。
- **否掉第 5 条（不是缺陷，是既定表示）**：`draftToAxs` 对空工程返回硬编码的 `# 开始`。
  实测该占位串在 **5 处**出现并被 `projection.test.ts:43` **刻意钉住**，而它就是**新建工程的 bootstrap 种子**
  （`sqlite/sqliteProject.ts:112` / `memorySeed.ts:22`）⇒ "空工程存成一个开场拍"是与种子一致的既定表示。
  而且**不静默**：删除后保存会经 `axs.import` 真的建出那一拍，用户在画布上看得见。**不改。**
- **两条按"潜在 + 要先定口径"挂着**：`unpackAxsp` 只按清单取素材（**这是对的**——清单在那一半承重，
  宽容正好让书写松散的外部包能导进来）；`unpackAxspV1` 把 `manifest.assets` 抄进清单却返回空素材表
  （既有测试**钉住**了它，要读那测试的意图才动）。
- **一条累计结论**（值得单独记，因为它改变下一步的做法）：22 条线索走到这里，
  累计**自证并修 9 条、否掉 5 条**，否掉比例这么高本身就是结论——
  **一份对着大模块逐函数铺开的审计清单，尾巴基本是噪声**。
  真正会咬人的 9 条全都落在两类：**同一形状在两处不一致**、**契约与实现不符**；
  而"看起来不太对"的那些（命名不统一、少一个兜底、类型宽松）实测下来要么已修、要么是既定表示、要么不可达。
  剩下 4 条的预期收益**已经低于把它们写清楚的收益**。

同日第四十一批（**审最大的一处双实现：结论是实测为健康**；**补上一个零覆盖的孪生实现**，仍未提交）：
- **审 TS 编译器 ↔ Python 编译器（438 / 451 行，同一个 `project → StoryPackage`）**：
  `__golden__/` 有 **4 份**金样本（由 `backend/scripts/dump_golden.py` 从真实 DB dump），
  `compiler.test.ts` 逐字段比对 ⇒ 这是一条**跨实现契约的枢轴**，**双向都会红**。
  我做了一次**免 DB 的差分**（把 `input.json` 直接喂给 Python 的 `_build_script` / `_extract_actors` /
  `_pick_start_beat` / `_build_glossary`，与 `expected.json` 比）⇒ **四项全部零差异**，两侧今天是对齐的。
  量到两个真实盲区（已写进 `compiler.test.ts` 头注释）：**金样本只被 TS 一侧消费**（它是枢轴，
  所以两侧都红，但**没有独立于枢轴的第三方校验**）；**语料对 `glossary` 的覆盖只有 1/4**
  （4 份里 3 份 glossary 是 0 条，补语料要重跑 dump、需要 DB）。
  **不为它写新判据**：Python 的 `compile()` 需要 DB，一份"也读这批金样本"的测试要么依赖 DB
  （等于手工重跑一次 dump）、要么靠桩 ORM 属性（会与 ORM 悄悄漂移）。
  在 Python 已有 **8 条**真集成测试而差分又确认对齐的前提下，**维护成本高于它挡住的漂移** ⇒ 主动排除。
  **探针错了两次**（今天第三、四次）：序列化了 `exclude_none=True` 而 `expected.json` **保留 null 键**
  ⇒ 一度报出 **24 条"差异"全是假的**。**"差异条数"会被探针的序列化方式放大——先信格式、再信数字。**
- **补上一个零覆盖的孪生实现：Python 侧条件求值**。缺口是量出来的：TS `compare` 有 **37** 条判据，
  而孪生体 `PlayerService._compare`（被三个 `_match_*` 分支调用）**此前一条都没有**——
  上一轮修 `>=`/`<=` 时它只靠「`.venv` 直调取数」验过，**取过数不等于有判据**。
  做法沿用本仓已确立的「两端共享向量」（先例 `testdata/axs-draft/*.json`）：
  新增 `testdata/conditions/compare.json`（**31 条**）+ 两个消费者
  （`packages/core/src/conditionVectors.test.ts`、`backend/tests/test_condition_vectors.py`），各带一条分母守卫。
  **权威不归任何一侧**：每条写死 `want`、只收答案无歧义的形状，所以它是**规格**——
  这与 AXS 草稿向量那批**故意不同**（那批拿 TS canonical 解析器裁决合法性）。
  **向量当场抓到我自己写错的一条规格**（方法记录）：我第一版把 `eq` 的"带空白数字串"写成 `want: true`，
  实测**两端独立地都返回 false** ⇒ **规格错了、不是代码错了**。
  由此钉进一条真实的不对称：**`eq` 不做任何数值/空白归一**（只归一布尔字符串），
  而 `gt/lt/gte/lte` **做**归一 ⇒ 同一个带空白的数字串在 `eq` 下是假、在 `gte` 下是真。
  两侧一致说明不是某一侧的缺陷，但对作者是个陷阱 ⇒ **登记为待观察、不改实现**（改它会动播放语义）。
  牙：两端各自把 `gte` 退回 `gt`（都先 `grep` 确认落点 0 残留）⇒ Python **2 failed**、TS **2 红**，
  点名同样那两条 `gte` 边界——就是上一轮只能手工取数验的那个缺陷。
  **仍未闭合的一条**：`_value` 解包在 TS 是一个 helper、在 Python 内联在两个 `_match_*` 里，
  形状不同行为一致；它属**匹配层**而非 `compare`，要锁得连 `memories`/`flags` 形状一起定义 ⇒ **登记，不假装已锁**。

同日第四十二批（**把上面那条欠账补掉**，仍未提交）：
- 新增 `testdata/conditions/matcher.json`（**14 条**）+ 两个消费者
  （`packages/core/src/matcherVectors.test.ts`、`backend/tests/test_condition_matcher_vectors.py`），
  锁住上一批没锁的那一半：`_value` 单键解包与「键缺席 ⇒ `operator === "ne"`」。
  **两侧存储形状本来就不同，所以消费者各翻各的**：TS 是**字典**（`key in vars`）、
  Python 是**行列表**（`for m in memories`）；翻译只做形状转换、不碰语义。
  `stored` 写的是**存储形态本身**（已决定要不要包 `{"_value": …}`）——写成解包后的值就会**把自己要锁的东西先假设掉**。
- **一个由判据自己报出来的不对称**：条件 type 是 `flag`（单数）而容器字段是 `flags`（复数）。
- **本批最值钱的一条：一个没红的变异抓出了「用例名 ≠ 覆盖」**。牙＝四道：
  TS「unwrap 改成两键也解包」⇒ 2 红；Python「解包去掉 `len == 1`」⇒ 2 failed；
  **TS「键缺席兜底改成恒假」⇒ 15 全绿**。归因：向量里那四条标着"键缺席"的用例其实设了
  `key + null`，测的是「**键在场值为 null**」，而缺席兜底只对「**根本没有那一行**」成立。
  修法：向量加 `absent: true`，两个消费者在它为真时**不插键 / 返回空列表**；重跑那道牙 ⇒
  TS **2 红**、Python **2 failed**，点名那两条 `ne` 用例。
  **「用例名不等于覆盖」——名字写着"缺席"的用例可能压根没测缺席**，
  这是**只有变异能发现**的一类缺陷：断言是绿的、名字是对的、覆盖是空的。
- **仍未锁的**（登记，不假装已锁）：`character_state` / `codex` / `relationship` 三个族——
  形状更大（要连 `characters` 字典 / codex 账本 / 三段键一起定义），
  而 `relationship` 的三段键语义刚在另一轮改过（`remapCharacterIds` 那两条）。

同日第四十三批（**锁 `relationship` 那族 ⇒ 顺带量出一条真实的双实现分叉**，仍未提交）：
- 量出**三族条件在 Python 侧静默为假**：TS 求值 **7 族**，而 `PlayerService` 只求值 **4 族**——
  **`relationship` / `achievement` / `codex`** 落到函数末尾的 `return False`。
  **后果**：同一份 AXS 在两端**行为不同**——被 `[if: relationship …]` 门控的分支，
  在 TS 引擎（桌面/浏览器）会打开，经后端播放时**永远打不开**，而**两边都报成功、零诊断**。
  这正是本会话反复在拆的那一族：静默降级伪装成合法。
- **组类型意外一致**：我怀疑 TS 用 `not`、Python 用 `none`，**实测两边都是 `all`/`any`/`none`**——
  写进向量当断言，免得下一次再怀疑一遍。
- **为什么不把后三族补进 Python**：那个后端正在退场（ADR-029 桌面唯一化、S13-6 删 `backend/`），
  给将死的后端加功能等于**扩大删除面**。TS 是对的一侧。
- **做法不是改代码，是把分叉钉成规格 + 一条绊线**（`testdata/conditions/families.json`，7 族各带一个探针）：
  TS 侧断言「声明会求值的族确实求值」⇒ 防 TS **悄悄丢族**；
  Python 侧断言「这些族当前返回 False」⇒ 有人真去实现时**这条会红**，逼他同时更新清单与 ADR/S13-6
  ⇒ **分叉要变成一次显式决定，而不是一个安静的洞**。
- **探针又错了两次**（今天第 6、7 次，且错得像真缺陷）：① 给所有族套同一个 key ⇒ `memory` 查不到、
  落进 `ne` 兜底返回假，判据红在 `memory` 上，**看起来像"memory 族坏了"**；
  ② `character_state` 的键格式是 `characterId.field`（按**第一个**点切），我给了三段键。
  **修法：把探针本身放进向量**——「这一族怎么被点亮」是规格的一部分，不该由每个消费者各自猜。
- **牙＝两道**（第一道变异也落歪过一次、缩进错、测试根本没跑 ⇒ 补 `ast.parse` 校验后重跑）：
  TS 删掉 `relationship` 那一支 ⇒ 1 红点名该族；Python 真去实现 ⇒ 1 failed，
  消息直接写着「若你刚实现了这一族，请同步更新 families.json 与 ADR/S13-6」。
- **仍未锁的**：三族**行为本身**（键格式与解包语义）——本批锁的是"哪些族被求值"这个清单。

同日第四十四批（**锁 `character_state` 的键格式 ⇒ 抓到一处真分叉：假值字段被吞**，仍未提交）：
- 清单里 **唯一两端都真求值**、因此可以真正当契约来比的一族是 `character_state`
  （`relationship` / `codex` 在 Python 侧压根不存在，**没有第二份实现可对**，只能靠上一批那条绊线）。
- 键格式是 `characterId.field`，两端都按**第一个**点切（`field` 本身可含点），但**取值写法不同**：
  - TS：`vars.characters[charId][field]`，用 `!(field in state)` 做**存在性**判断；
  - Python：`getattr(s, field, None) or s.custom_state.get(field)`。
- **Python 那个 `or` 是真缺陷**：`or` 对 `0` / 空串 / `False` 这类**假值**短路，
  于是「`affection=0` 且 `custom_state` 里没有这一项」读到**的是 `None` 而不是 `0`**。
  而 `affection`（好感度）初值就是 `0`，于是 `affection >= 0` 这种**必然成立**的门在服务端恒为假
  ⇒ **那条分支永远不开，而两端都报成功、零诊断**。
  实测对照：`affection=0 gte 0` / `eq 0` / `mood="" eq ""` / `flag=false eq false` 四条
  **TS true、Python false**；`0 gte 1` 与"只在 custom_state 里的字段"两边一致。
- **修法**（`backend/app/domains/runtime/service.py::PlayerService._match_character_state`）：
  用哨兵把"字段不存在"与"字段值是假值"分开——`getattr(s, field, _FIELD_MISSING)`，
  **只有真的缺席**才回退 `custom_state`；这正是 TS 侧 `!(field in state)` 的语义，不是发明新口径。
  哨兵**不能用 `None`**（`None` 恰恰是这个 bug 的成因），所以那个 `object()` 上面写了注释钉住。
- **形状翻译仍由消费者做，语义不翻译**：向量里这一族拆成 `chars`（TS 的 `vars.characters` 字典）
  与 `custom`（Python 的 `custom_state` 回退源）两段——TS 侧合并成一个字典，Python 侧拆成"行属性 + 回退"，
  这样"回退只在真的没有时发生"这件事**两边的判据长在各自真实形状上**，
  而不是把两边揉成同一种形状把语义糊掉。向量 14 → **21 条**。
- 牙：把 Python 装回 `or` 短路那个原形状 ⇒ **4 failed**，点名的正是那四条假值用例。
  "别过度修正"那条（`0 gte 1` 仍为假）也在向量里 ⇒ 防止有人改成"什么缺失都当真"。
- **这次自己犯的错两次，都是"改数据"而不是"改代码"**：
  ① 我建的行字段叫 `cond`，而随后键重排脚本的白名单里写的是 `condition`
  ⇒ **`condition` 被整个丢掉 7 条**：TS 拿到 `undefined` 条件（`if (!condition) return true` 于是全返真，
  看着像"这一族全坏了"），Python 直接 KeyError 7 红。**教训：先 `assert` 每个消费方要的键都在，再跑**。
  ② 新条目漏了 `id` 字段 ⇒ 用例名渲染成 `undefined`，一条假红。**教训：向量的 `id` 也是数据的一部分**。

同日第四十七批（**路由表收成一份真相源：加载面普查从手抄 9 条换成解析得出的 25 条，当夜就量出 7 个桌面云端调用点**，2026-10-09，未提交）：

- **动因**：`check:http-inventory` 手抄了一份 9 条路由的清单，而 `cloud-callmap.mjs` 已经会机械解析 `App.tsx`——
  同一张路由表两处各有一份，就必然分叉，且**分叉只会以"少测"的形态静默生效**（加一条 `<Route>` 不会有人提醒普查）。
  现在两边共读 `scripts/source-graph.mjs` 新增的 `parseRoutes()`。
- 扫描器而不是正则：`<Route path="/studio" element={<StudioLayout />}>` 里那个 `/>` 会把
  `<Route\b([\s\S]{0,120}?)\/?>` 提前截断 ⇒ 带子路由的父 Route 被当成自闭合，整棵 `/studio/**` 丢前缀。
  `parseRoutes` 按**字符串 + 花括号深度**走，只在深度 0 的 `>` 收尾，前一位是 `/` 才算自闭合。
  成对证据（同一夹具，旧式 vs 新式）：旧式解出 `projects#ProjectListPage`（相对路径，根本不是能打开的 URL），
  新式解出 `/studio/projects`。另认三件事：`<Route index>`（`/play/:projectId` 的 PlayerPage 靠它）、
  无 path 的布局包裹层（`label` 保证唯一，否则三条布局**共用一个闭包**）、
  **就地定义、体内返回 `<Navigate>` 的壳组件**（`ProjectFlowLegacyRedirect` 那一族；按字面名判会把它当页面去导航，
  于是"覆盖 25 条"里有几条落在同一个地方）。
  `App.tsx` 读数：**Route 标签 35 = page 25 + 布局 5 + 重定向 5**（重定向那 5 条不导航）。
- **普查扩面的直接产出（这批真正值钱的地方）**：路由从 9 条变 25 条之后，桌面臂立刻量到
  **`DESKTOP_UNIQUE=7`**——`/discover/{projects,characters,items,scenes}/:id`、`/discover/topics/:slug`、`/author/:authorId`
  这 6 页在桌面态直打云端（`/api/v1/editor/projects/{id}`、`/api/v1/characters/{id}`、`/api/v1/editor/assets/{items,scenes}/{id}`、
  `/api/v1/discover/topics/{slug}/projects`、`/api/v1/creator/hub`、`/api/v1/comments`）。
  **原先那句"桌面态零 /api/v1"是真的，覆盖面是假的**：手抄那 9 条里没有一条带 id 的 discover 路由。
- 修法取**补齐既有决定的另一半**，不新立决定：`DiscoverPage` 早有 `isLocalOnlyDeployment()` 缺席分支
  （注释写着「桌面离线直接输 URL 进来时，给一句准确说明而不是空白的作品街」），
  而 E35 的名字就叫**「入口与目标同生共死」**——它只测了入口那半。
  6 页各补两行闸门：`useEffect` 首行 `if (localOnly) return;`（**这条才是挡请求的那条**）+ 渲染侧 `CloudFeatureNotice feature="…"`。
  闸门必须同时改**effect**：只在渲染层早退而 hook 照样跑，请求仍然发得出去。
  复量 `check:http-inventory` 退出码 **0**：`ROUTES=25 / DESKTOP_UNIQUE=0 / BROWSER_UNIQUE=20（正对照）/ UNMOUNTED=0`，
  浏览器臂每条 discover 详情页仍是 2-3 笔 ⇒ 功能没被砍，只是桌面不再假装能连。
- **顺手挖出自己上一批的判据缺陷（方向是"把活代码判死"，必须报）**：`cloud-callmap` 里同一形状有**两条正则、一严一松**——
  `lazy\(\(\)` 与 `lazy\(\s*\(\)`。松的那条能认跨行写法，严的那条**在 `App.tsx` 26 条 lazy 声明里只认 21 条**，
  漏的正是 5 条写成
  ```
  const X = lazy(
    () => import("…"),
  );
  ```
  的 discover 页 ⇒ 真路由页既进不了宿主闭包、也不算"某 lazy 的目标"，于是被报成「界面确定走不到」。
  归一成 `source-graph.mjs` 的 `lazyImports()` 之后，第十段读数：
  **宿主不早退 21 → 27 / 只在桌面早退页 9 → 9 / 零引用 8 → 8 / 不在任何路由闭包 6 → 0**，
  端点级「所有未守卫点都桌面走不到」**12 → 6**——**在册那个 12 被工具缺陷抬高了一倍**，
  真走不到的只剩 `usePlayer.ts` 那 6 条试玩端点（它只被 `shared/hooks/index.ts` 的 `export *` 引到，barrel 不算读者）。
  其余段（死面 11 / 绕过 34 / 混合 6 / 壳守卫 S1-S3 分档 / 死表面 285·245·10）逐字节未变，已 diff 核对。
- **判据落地（不是只有普查读数）**：`e2e/desktop-http.spec.ts` 新增 `CLOUD_ONLY_ROUTES`（6 条带 id 的云端专属页）
  接进 E14 的路由棘轮，另开 **E44「云端专属详情路由在桌面给的是缺席说明，不是一次注定失败的请求」**——
  每条两半：屏幕上要有「{功能}需要协作服务」，且零 `/api/v1`。
  变异证据：**只删 `DiscoverItemDetailPage` 的 effect 闸门**（留着渲染闸门，所以提示语仍在场）
  ⇒ `-g E44` 得到 **1 failed / 5 passed**，红在 `桌面态这一页仍发了云端请求：/api/v1/editor/assets/items/no-such-item`，
  恢复后 **6 passed**。这条挡的是"以后有人把闸门只加在界面上"那种半吊子修法。
- 夹具与限度（照实登记，不当结论用）：`?storage=memory` 那支**不播种**（`createStorageProvider` 直接 return 内存 Provider，
  由 `index.test.ts` 的「不建素材仓、不播种」钉着），所以参数路由一律填 `inventory-probe` 这个必然查不到的 id。
  ⇒ **本普查覆盖的是"未命中支"**（本地查不到时会不会偷偷发云端——那恰好是最要命的形状），
  **命中支**（本地真有一条工程/角色时的路径）不在这里，在 `e2e:desktop` 的点击层里。两条互补，别把这里的 0 读成"桌面全路径零云端"。
  普查的腿从三条升到四条：**第 0 条是"路由面本身非空、且仍是手抄那 8 条的超集"**（解析器一旦又丢前缀，覆盖静默缩水就由这条报警）。
- 末轮读数：`gates` **0**（十五道；`test:unit` **706 passed + 1 skipped**：core 143 / axs 94 / editor-core 189 / web 241+1skip / admin 39）、
  `typecheck` **0**、`e2e:desktop` **50 passed**（原 38 ⇒ E14 棘轮 +6、E44 +6）、
  `check:http-inventory` **0**、`cloud:callmap` **0**、`check:dead-surface` OK（闭包外 10 全在册）、`check:dispatch` OK（6 文件 / 32 函数）。
  `pnpm e2e`（浏览器那一半）仍未跑——它写的是本机 dev 库，等一句授权。
  **产物层（因为这批改的是产品代码，而 `gates` 不含 build）**：`build:web` **0**、`build:admin` **0**；
  产物是刚构建的（`apps/web/dist/index.html` mtime 与本次构建同分钟），且包内确实带着这句话——
  搜 `"创作者主页需要协作服务"` 整串**搜不到**（模板串在产物里是拆开的：`"创作者主页"+"需要协作服务"`），
  所以正确的产物判据是搜 **`需要协作服务`**（命中 2 个 chunk），不是搜拼好的整句。

同日第四十八批（**把第五条腿架到 e2e 那三张手抄路由表上——同一类债的第二个现场**，2026-10-09，产品代码一字未改）：

- 第四十七批治的是**普查里**手抄的路由表；`e2e/desktop-http.spec.ts` 里还有三份同样手抄的表
  （`CLEAN_ROUTES` 9 条 / `CLOUD_ONLY_ROUTES` 6 条 / `LOCAL_UNAVAILABLE_ROUTES` 7 条）。
  它们的失效方式和原来那份一模一样：**新增一条 `<Route>` 不会有任何东西提醒你给它写点击判据**，
  于是"桌面点击层已经覆盖"这句话会随产品长大而静默变薄。
- `check:http-inventory` 加**第 5 条腿**：拿解析出的路由面去对账 `desktop-http.spec.ts`，
  打印「点击层没测到的路由=N（点名）」。两条设计决定：
  ① **只报不判红**——"要不要为某条路由写点击判据"是排期决定，不是缺陷，把它做成硬失败就会有人直接删判据；
     会判红的只有一种：三张表**一条都解析不出来**（清单改名或形状变了 ⇒ 判据正在消失，UNRELIABLE、退出码 1）。
  ② 判据范围要选对，否则会把**测过的**报成没测：只按三张表算时报的是 3 条，其中 `/studio/projects/new`
  其实被 E17 那一族 `page.goto("/studio/projects/new?storage=memory")` 走过去了——那是"把判据报薄"的方向，
  和第四十七批那个"把活代码判死"属同一族。于是把 **spec 里所有 `goto` / `visitInDesktopMode` 的字面量地址**
  并进来（剥掉 `?` 之后部分），读数变 **`SPEC_URLS=50`**（22 条表内 + 28 条 goto 字面量），
  没测到的从 3 → **2**：`/studio/characters/:id/edit`、`/docs/*`（文章页只测了索引页 `/docs`，正文页在桌面从没走过）。
  这条腿本身也因此有过一次"红在该红的那一半"的验证：去掉 goto 那一半就多报一条假账。
- 上界性质写进脚本头：模板串/变量拼出来的地址（`goto(route)`）这里看不见，
  所以报出来的是**"可能没测到"的上界**，只当线索，不能拿去下"这两页没判据"的死结论。
- 末轮读数：`check:http-inventory` 退出码 **0**，`ROUTES=25 / DESKTOP_UNIQUE=0 / BROWSER_UNIQUE=20（正对照）/ UNMOUNTED=0 / SPEC_URLS=50`。
  本轮只改脚本与文档，产品代码 `git diff` 里那 6 个页面是第四十七批留下的，未再动。

同日第四十九批（**第五条腿自己错了两次，都被测量抓回来：注释里的 glob 关掉块注释、正则字面量里的字符类截断扫描器**，2026-10-09，产品代码一字未改）：

- 上一批的第五条腿报「点击层没走到的路由=2」。**其中一条是假的**：`/studio/characters/:id/edit`
  其实 E21 早就走了——它是**点「编辑」走过去、再用 `toHaveURL(/…/)` 验 URL**，
  而我那档只扫字符串字面量。把"测过的"报成"没测的"仍是同族错误（**判据报薄**），
  于是加第二档：抠出测试里的 `toHaveURL(/…/)` 正则，给每条路由模式拼一个样例地址去撞。
- 那一档**第一次上线时是 0 条命中，而 0 看起来完全合理**——这才是真缺陷的样子：
  我的提取正则 `toHaveURL\(\s*\/((?:\\.|[^/\\])*)\/` 把正则字面量当"到下一个斜杠为止"，
  而测试里写的是 `/\/studio\/characters\/[^/]+\/edit$/`，**字符类 `[^/]` 里那个斜杠没转义**，
  于是抠出来的是半条非法正则 ⇒ `new RegExp` 抛错 ⇒ 被我自己的 `try/catch` 咽掉 ⇒ 静默 0 命中。
  改成**带类感知的扫描器**（`\\` 跳一位、`[` 之内斜杠不算结束、不跨行猜）后读数 **`17/17` 全抠出、正则证据 1 条**，
  并自带一条对照打印：「抠出的条数 < 出现的条数」时明说"这一档的读数是薄的"（不再让 0 冒充"没有"）。
- 分档也拆开了，因为**名字会骗人**：原来那一行叫"没测到"，实际含义是"没有字面量导航到"。
  现在三档并出：`没有字面量导航到的路由=1` → `其中确有正则证据=1（并列出命中的正则原文）` → **`完全没证据的路由=0`**。
  只有最后一档才是真欠账；正则那一档**天生不精确**（宽正则一次认掉整族），所以把命中原文贴出来由人判断，不悄悄抵账。
- 真缺的那一条补上了：**E45「随包的用户文档在桌面读得出来（命中的那一支）」**。
  普查只能量未命中支（内存宿主不播种），而 `docRegistry` 是 `import.meta.glob(..., { eager: true })`
  把 `docs/user` 下的 markdown 打进入口的——**这是全系统唯一一条"本地真有内容"的读路径**，
  以前只靠"文档确实在仓库里"这种理由相信。现在两条一对：真 slug 渲染出正文（`桌面版目前没有的功能`）且零 `/api/v1`，
  假 slug 必须给「未找到该文档页面」（少了这一条，"随便什么都渲染同一个壳"也会让正证绿）。
  写这条时自己踩的：**块注释里不能出现 glob 的 `*/`** —— 我把 `import.meta.glob("docs/user/**/*.md")` 原样抄进注释，
  那个 `*/` 当场关掉注释、后面全部变代码，`typecheck` 与用例收集同时炸（TS1109 + `No tests found`）。
- 末轮读数：`check:http-inventory` **0**（`ROUTES=25 / DESKTOP_UNIQUE=0 / BROWSER_UNIQUE=20 / SPEC_URLS=52 / 正则 17/17 / 完全没证据 0`）、
  `pnpm e2e:desktop` **52 passed**（50 → 52）、`pnpm typecheck` **0**。本轮未动产品代码。

同日第五十批（**第三层对账：ADR-029 补记 + Phase 13 那行「验收」的残项按证据重量一次**，2026-10-09，产品代码一字未改）：


- **ADR 层**：`docs/ADR/029-desktop-only-build-target.md` 加了「补记 2026-10-09」，写四件事——
  ① 第 6 条那句「不留点进去报网络错误的残口」第一次有机械判据（`check:http-inventory` 桌面臂 25 页 × 零 `/api/v1`）；
  ② **它曾被违反**：discover 的 6 个详情/主页（入口页早退了，目标页没有）——按本决策直接补齐，不需要新决策；
  ③ **判据的覆盖边界写在决策旁边**：桌面臂量的是装载路径，**点击之后才发的调用不在它覆盖内**，
    静态上界与装载实测之间的差额**今天还没对账**（登记成快照里的 ③，不当已完成）；
  ④ 一条**按证据作废的怀疑**：`isLocalOnlyDeployment()` 逐字等于 `isTauriEnvironment()`，
    与 ADR-024 那句"云为可选协作服务"**不冲突**（"可选"= 运行不依赖它，不等于"桌面配了端点就该露出云端入口"），
    所以这不是实现偏离决策——写在这里是为了下一个人不必再查一遍。
  写补记时又踩到自己登记过的那个坑：把 `## 代价` 整行当 Edit 锚点，**标题被吞掉**，改完立刻 `grep -c "^## "` 复量才发现并补回。
- **验收残项复量（11:05 取，与在册一致 ⇒ 无漂移）**：
  `.github/workflows/ci.yml:69` 仍是 `pnpm build:web && pnpm build:admin`；`vercel.json` 与 `docker-compose.yml` 仍是 tracked；
  `pnpm check:publish` 自报 **残差 4 条全部在册（基线 4）**。
  **顺带把"桌面壳在 CI 上零信号"这句的措辞钉准**：CI 里那 3 处 "desktop" 全部是**分支过滤**
  （`branches: [main, master, desktop]`，注释说明它原先不在列表里、直推 desktop 的提交一道 CI 都不跑），
  **没有任何 Rust/tauri job**——所以这句话的意思是"壳本身没被 CI 构建过"，不是"CI 完全不跑桌面分支"。
  改 CI 属于动共享流水线、且逻辑上要先有 §6 ② 那份"web/admin 判死"的决定，所以**这里只登记不擅动**。

同日第五十一批（**把快照里那条 ③「静态上界 × 装载实测的差额」真对了一遍账，做成 `cloud:callmap` 第十二段**，2026-10-09，产品代码一字未改）：

- 分的是什么：`check:http-inventory` 的桌面臂只量「进入页面那一刻」发的请求，所以 `DESKTOP_UNIQUE=0` 只证到**装载面**干净。
  第十段那条静态保守上界说"这 36 处未守卫调用点桌面真会打出"——里面有多少**装载即发**、多少**要点了才发**，
  决定的是 §6 ② 那份判死名单暴露方式：装载类靠**页面级闸门**挡着（绕开就漏），点击类只能逐条写点击判据（E19/E40/E41 那种形状）。
- 读数：**36 处 = 装载即发 26 / 点了才发 2 / 不明 8**（不明**不计入**"装载判据已覆盖"）。
  端点级：**装载类 22 个端点、其余 5 个**。点了才发那 2 处点名叫出来了：
  `apps/web/src/features/studio/pages/ProjectListPage.tsx:91`（`projectApi.fork`）与
  `apps/web/src/features/character/components/VersionPanel.tsx:44`（`versionApi.get`）。
- 与运行时对账（`LOADFACE=<普查输出>` 指进来，`${id}` 换成 `[^/]+` 后比路径）：**22 个装载类端点里普查真见过的 4 个、没见过的 18 个**。
  **这 18 才是本段真正要看的数**，两种解释都成立且必须逐条分：要么那条路在桌面已经被页面早退挡了（正常），
  要么静态分档把它**判高了**（可疑）。已知的判高质量原因写进限度：`const load = async () => api.x()` 这种**只看定义形态**的形状，
  既可能被 `useEffect` 调也可能被 `onClick` 调，这一段**不做调用图**，所以这类会偏判成"装载即发"。
- 三条控制位（缺一不可，都是这一段自己踩出来的）：
  ① **对照失败会明说**——静态说装载会发的端点与实测路径**一条都没对上**时打 ⚠ 并宣布"这一列不能用"。
     这不是假想：第一版就是这么错的，`epPath` 带前导斜杠而普查剥过 `/api/v1`  ⇒ 口径差一位斜杠，报的是 `0/22`，
     看起来像"装载面全都没见到"，实际是**没在比**。修成两边都归一到带前导斜杠之后才有 4/18。
  ② 没给 `LOADFACE=` 时报"**运行时列缺失**"，不当 0 用；
  ③ 限度里写明产物是临时的（`/tmp`），**代码一改就得重取**，否则对的是旧世界。
- 其余段**逐字节未变**（死面 11 / 绕过 34 / 混合 6 / 守卫分档 / 宿主可达性 27-9-8-0 / 死表面 `闭包内 245、闭包外 10、对照通过`），
  差异只出现在新增那段。`pnpm cloud:callmap` 退出码 0（两种跑法都是）。
- **自己又踩一次那个老坑**：拿注释的**首行**当 Edit 锚点的尾巴，把「死表面普查（第十一段）」那行说明吞了（本会话第二次）。
  这次靠"跑一遍看第十二段还在不在"抓回来并补回；教训是**锚点尾巴要落在自己新写的行上，别落在被保留的邻居行上**。

同日第五十二批（**把第十二段那 18 条"静态说装载会发、普查没见到"当场分完档，结论是否掉我自己的期待**，2026-10-09，产品代码一字未改）：

- 分档判据用**模块图**，不靠运气：这条端点的**消费者文件**在不在某条路由页的 import 闭包里。
  A 档（不在任何闭包 ⇒ 装载普查**结构上量不到**，静态与运行时不矛盾，该并进"界面走不到"）／
  B 档（在闭包内、浏览器臂也没发 ⇒ 静态把时机**判高了**，是条件渲染或点了才发，真欠点击判据）。
- 11:27 实测（普查与 callmap 同刻取数）：**A=0，B=18，相加 18**；「对照失败」那条 ⚠ **没触发**（4 条对得上，不是恒 0）。
  **（更正 12:15 第五十三批：这 18 条是假的 —— 见同日第五十三批。装载类 22 条里实际对上 7 条、没对上 15 条，
  原因是 `pathSeen` 先转义再抠 `${...}`，带参数的模板一条都换不掉；那 4 条"对得上"恰好全是无参数的，
  我当时把症状读成了结论。A=0 这个结论本身不变。）
- **这条读数对 §6 ② 的意义是坏消息，而且是我要的那种坏消息**：
  我原本期待"A 档能缩掉几条判死名单"，实测**一条都缩不掉**——18 条的消费者全都在路由闭包内，
  也就是说它们**不是"界面走不到"，只是"装载时不发"**。把它们当死面删掉的理由，这次被自己的数据否掉了。
  名单要缩只能靠 B 档逐条写点击判据（E19/E40/E41 那种形状）或者你真下令判死。
- 点名样例（B 档里的头几条）：`GET /characters/public`（消费者 `CharacterSearchSelect.tsx`、`DiscoverStatsBar.tsx`、`useCharacters.ts`，
  宿主含 `/studio/projects`）——它在闭包内但装载时不发。**为什么**没发我没测（**推测**：由搜索框交互触发，而不是进入页面就取），
  要定性得逐条读调用点或补点击判据；这里只登记"闭包内 + 装载未观测"这个事实。
  另外 `DiscoverStatsBar.tsx` 本身在死表面基线里（闭包外 10 个之一），**同一个端点的一条腿活着、另一条腿是死的**，
  这种"混合读者"的形状正是按端点判死会误伤的地方，记下来。
- 末轮（11:27 同刻）：`check:http-inventory` **0**（`ROUTES=25 / DESKTOP_UNIQUE=0 / BROWSER_UNIQUE=20 / UNMOUNTED=0`）、
  `cloud:callmap` **0**（第十二段 26/2/8；两档 A0/B18）、其余段未变。

同日第五十三批（**上一批那个 B=18 是我自己的转义 bug 造的假数；修完是 15，并给匹配器装了内建自测**，2026-10-09，产品代码一字未改）：

- **怎么发现的**：`[^/]+` vs `[^/]*` 那个变异跑完，**自测五条全绿、退出码 0** —— 一个挡不住变异的自测就是没自测。
  顺着查下去才看清：`pathSeen` 里 `[^/]*` 与 `[^/]+` 对本次的误匹配没有区别（真正的重叠是模板 `/editor/projects/${id}` 会认下真端点
  `/editor/projects/discover`，两种写法都认），**所以那条自测当时没有对准我实际犯过的错**。
- **真正的错在转义顺序**（第五十二批就已经犯了，只是那批的读数看起来太合理，没人怀疑）：
  先把整串转义（`$ { }` → `\$\{id\}`）、再按**未转义**的形状去替换 `${...}` ⇒ 一条都换不掉 ⇒
  **所有带参数的端点在运行时列里必然"没见过"**。上一批 B=18 里"能对上的 4 条恰好都是无参数的"就是这个症状，我当时把它读成了结论。
- 修法：按 `${...}` **切段 → 只转义字面段 → 用 `[^/]+` 接回**；末段是插值时再多给一条"缺席"模式
  （普查记的是 `URL.pathname`，`${qs}` 这种查询串不在里面）。**这一列如实标成上界**（模板与端点天然存在包含关系，只能当线索）。
- **自测改成打历史错误**（内建、不依赖当天数据，五条）：模板吃到参数 / 参数不跨段 / 末段查询可缺席 / 不把别的端点认进来 / 无参模板要全等。
  两头都见过红：**把顺序改回旧错法 ⇒ `模板吃到参数=失败`、`末段查询可缺席=失败`、退出码 1**；改回正确实现 ⇒ 五条全通过、退出码 0。
  变异脚手架（`process.env.MUTATE` 分支）**用完即拆**，现在 `grep -c MUTATE` = 0。
- **更正上一批的读数**（历史文本不重写，批注挂在这里）：
  第十二段「静态说装载会发、普查没见到」不是 18 条而是 **15 条**（装载类 22 = 对上 **7** / 没对上 **15**，
  其中带参数 **8** / 无参数 **7**）；分档 **A=0 / B=15**。
  **对 §6 ② 的结论不变**：A 档仍是 0 条 ⇒ 判死名单**一条都缩不掉**，这 15 条只是"装载时不发"，不是"界面走不到"。
- **顺带量到一件该记的事**：守卫段「文件有守卫但该调用点未判出」从 **15 → 22**，
  多出来的正是 discover 那 6 页——它们现在有**页面级早退**，但 S1/S2/S3 三种形状建模的是"守卫与调用点在同一块/同一句/同一直接子语句"，
  **不认"祖先块早退之后整段不可达"**。这不是新缺陷，是判据的一个已知盲区：它让这批调用点从"无守卫"变成"待人工复核"，
  **（此归因错了：真实原因是闸门被抽成变量别名、`GUARD_SRC` 只匹配字面调用；见同日第五十四批，修法已按证据验过，22 已回到 15。）**
  读数方向是**保守的**（宁可多列），但要说清，否则有人会把这 22 条当成"闸门没生效"。
- 末轮读数：`cloud:callmap` 退出码 **0**（带 `LOADFACE`），其余段与第五十二批一致
  （绕过 34 / 死面 11 / 仅实现侧 9 / 有分派口 27 / 混合 6 / 本地已接 8；宿主不早退 27、零引用 8、端点级 6 走不到 / 29 走得到）。

同日第五十四批（**守卫判据的"痕迹当证据"被抓出来：别名闸门认不出、声明位反被当成守卫**，2026-10-09，产品代码一字未改）：

- 起点是上一条批注里我自己写错的原因：我把「待人工复核 15 → 22」归因成"S1/S2/S3 不认祖先块早退"。**代码显示不是**：
  discover 那 6 页的闸门写成 `const localOnly = isLocalOnlyDeployment();` + effect 首行 `if (localOnly) return;`，
  形状正是 S3，只是 `GUARD_SRC` 只匹配字面调用 ⇒ **认不出变量别名**。写错的因果已就地更正（不重写正文）。
- 于是把守卫的字面式扩到"**同文件内、由守卫式调用直接初始化的别名，且处在布尔位置**"
  （`if (localOnly`、`!localOnly`、`&& localOnly`、`|| localOnly`、`: localOnly`、`? localOnly`）。
  **一头严一头松各错过一次**：先只要求"标识符在块里出现过"⇒ `[id, localOnly]`（依赖数组）与 `{ localOnly }`（搬值）会把没挡住的调用判成有守卫；
  改成"必须紧跟 `)`/`&&`/`?`"⇒ 又把 `enabled: !!character && !localOnly`（`CharacterDetailPage.tsx:155`，真闸门）判成没守卫——
  这条是我拿真实代码验出来的**反例**，不是推的。最终取"前面贴没贴判断结构"。
- **自测又抓到一件既存缺陷**（跟本次放宽无关，早就在）：`const 本地旗标 = isTauriEnvironment()` 这句**定义**本身
  会被 S1「扫整块」当成守卫 ⇒ 只要调用和这句声明同块就算安全。修法：S1/S2 的窗口里**跳过定义位**（前面是 `= ` 的那些出现）。
  诊断也没省：把自测从"前缀有没有匹配"改成**直接跑 `guardShape` 并打印实际判到的形状**
  ——因为真实代码里 `enabled:` 写在 `queryFn` 之后，靠的是 S1 同块，用前缀当 harness 会**判错了还自称通过**。
- 四条合成样本（正反各两条）现在实判 `S3闸门早退=S3、S1同块条件属性=S1、依赖数组=null、搬值=null` ⇒ 全通过、退出码 0；不通过就 `exit 1`。
- **语料侧读数证明这次没靠放宽换数字**：扩别名 + 严布尔位 + 跳过定义位之后，
  `端点级 全有守卫 10 / 部分 3 / 全无 27`、`待人工复核 15`、`宿主不早退 ⇒ 桌面真会打出 20 处未守卫调用点`、
  第十二段 `装载即发 19 / 点了才发 2 / 不明 8`（与"痕迹版"逐数相同，但两种误判形状已被挡下）。
  对照三版（同一棵树，只换判据）：**无别名 22 处待复核 / 痕迹版 15 / 证据版 15**。

同日第五十五批（**桌面账户设置那句自相矛盾的话：修掉，并钉成 E47**，2026-10-09，产品代码改一处文案）：

- 起点是上一批留下的账：第十二段那 15 条「待人工复核」要定性成"残口"还是"页面已早退"，
  先得在桌面上确认**入口到底存不存在**。
- 取证用一个临时探针（`scripts/.tmp-probe-entries.mjs`，**跑完已删**）在"注入标记 + `?storage=memory`"下读各页渲染出的按钮。
  **量到的第一条不是入口，是判据自己的限度**：内存宿主命中不了种子，detail 页渲染的是「角色不存在」那一支 ⇒
  **未命中支的页面证明不了入口是否存在**（这条必须在，否则下次又拿"没看见按钮"当"入口不存在"的证据）。
  在真命中支上读到的是：`CharacterDetailPage` 的三支 `{!localOnly && (` 确实把 **版本 / Fork / 删除** 三个入口在桌面关掉了。
- 换"读代码 + 读页面文案"这条路之后，**量到一条真实缺陷**：`ProfilePage` 的桌面分支顶部仍写
  「管理昵称、头像、邮箱与数据」，而同一屏下面一句就是「账户设置需要协作服务」——自相矛盾，
  正是 ADR-029 规则 6 那道"不留点进去报网络错误的残口"的**文案版**。
  修法：description 改成「这一页在本机只保留你的身份；昵称、头像、邮箱与数据管理都在协作服务那一侧」。
- 判据 **E47 桌面账户设置不许再承诺它做不到的事**（`e2e/desktop-http.spec.ts:310`）：
  浏览器态断言那句话**在**（它是真话，不许被顺手删掉），桌面态断言 `当前身份：` 与缺席说明在、
  那句承诺 `toHaveCount(0)`、全程零 `/api/v1`。
  **牙**：把文案改回旧句 ⇒ **1 failed / 1 passed**，红的正是桌面那一半，失败落在
  `await expect(page.getByText(PROMISE)).toHaveCount(0)`（`:319`）；改回修复版复绿。
- **本批第三次踩同一个坑**：拿邻居行 `test.describe("E45 …")` 当 Edit 锚点的尾巴，把那行吞了。
  已就地恢复并按升级后的硬动作复核：`grep` 两个 describe 都在、`grep -c "^test.describe"` = **20**。
  规则早就写了，这轮的教训是**"写了规则不等于执行了规则"——提交前先看一眼自己那条 `old_string` 的尾行是谁的**。
- 末轮读数（产品改动落在两份普查的扫描面内，所以两份都**重取**，没复用上一批的数）：
  `pnpm e2e:desktop` **54 passed** 退出码 **0**（52 → 54，E47 两条腿）、
  `pnpm gates` **0**（十五道；`test:unit` **706 passed + 1 skipped**＝core 143 / axs 94 / editor-core 189 / web 241+1 skipped / admin 39）、
  `pnpm check:http-inventory` **0**（`ROUTES=25`：page 25 / 布局 5 / 重定向 5，Route 标签 35；带参 14；`UNMOUNTED=0`；
  `DESKTOP_UNIQUE=0`；`BROWSER_UNIQUE=20` 正对照；**`SPEC_URLS` 52 → 54**；正则 17/17；**完全没证据的路由 0**）、
  `LOADFACE=/tmp/inv55.txt pnpm cloud:callmap` **0**（端点级 **全有守卫 10 / 部分 3 / 全无 27**；待人工复核 **15**；
  桌面真会打出 **20 处**；第十二段 装载即发 **19** / 点了才发 **2** / 不明 **8**；
  运行时列 **真见过 4 / 没见到 12**）⇒ **文案改动没移动任何一条分母**，这一句是重取出来的，不是推的。
  `pnpm check:citations` **0**（47 文档 / 已判定 **220** / 不存在 0 / 越界 5 在册）、`git diff --check` **0 行**、`.e2e-lock` 跑完不在。

同日第五十六批（**「待人工复核」里那条正对照宿主：Fork 的闸门是一把被藏起来的开关，钉成点击判据 E48**，2026-10-09，产品代码净零改动）：

- 上一批把 12 条「静态说装载会发、普查没见到」点名之后，先去量**入口到底存不存在**。挑的是 `cloud:callmap` 自己拿来当正对照的那个宿主
  （`ProjectListPage` ⇒ "宿主不早退 ⇒ 桌面真会打出"）。读代码得到**第三种情形**，既不是"页面早退"也不是"调用点有闸门"：
  ① 页面在桌面正常渲染（它是本地页）；② `handleFork` 里 `await projectApi.fork(...)` 前后都没有闸门；
  ③ 真正挡着它的是**工具条那把「我的 / 模板」开关被 `{!localOnly && (` 藏了**（`tab` 初值 `"my"`，全页只有一处 `setTab`），
  于是带 Fork 按钮的模板卡片整支、以及 `tab === "template"` 才发的那条 `listTemplates`，在桌面都不存在。
- **这类"藏控件即闸门"过去只活在结构里、没有判据**。加判据 **E48**（`e2e/desktop-http.spec.ts:1081`）：
  浏览器态断言「模板」开关**在**（否则整块守卫被删也不会红），桌面态断言「模板」/「我的」/「以此创建」都 `toHaveCount(0)`
  + 侧栏「剧本」链接可见（**挂载正控，防"空载 count 0"**）+ 零 `/api/v1`。
  **牙**：把 `{!localOnly && (` 改成 `{(localOnly || true) && (` ⇒ 桌面那一半红在 `toHaveCount(0)`（`:1100`），
  改回后 `pnpm e2e:desktop` **55 passed** 退出码 **0**。
- **`check:size` 的棘轮当场挡住了我一行注释**：想给 `handleFork` 上方写四行说明"闸门是上面那把开关"，
  文件立刻 `414 > 棘轮 408`、`gates` 退出码 **1**。处置不是放宽棘轮，而是**把说明留在判据里、把代码恢复原样**
  ——承重的应该是那条会红的断言，不是注释（注释会搬家、断言不会）。恢复后 `git diff --stat` 对该文件**为空**、407 行。
- **顺手记一条只观察不处置**：`GET /editor/projects/templates` 被分进「调用者已接本地库（8）」那一档，
  因为那一档是**按调用者**归类的——`ProjectListPage` 大部分动作确实走本地库，可 `listTemplates`（官方/社区元剧本）本身没有本地替身。
  这不是今天的缺陷，但它是那张表的一个失真方向：**"调用者本地已接"不等于"这个方法本地已接"**。
- 末轮读数：`pnpm e2e:desktop` **55 passed**（54 → 55）、`pnpm gates` **0**（十五道；`test:unit` **706 passed + 1 skipped**；
  `[file-size]` 349 文件 0 越线）、`pnpm check:http-inventory` **0**（`SPEC_URLS` 54 → **56**、`ROUTES=25`、`UNMOUNTED=0`、
  `DESKTOP_UNIQUE=0`、`BROWSER_UNIQUE=20`、正则 17/17、完全没证据 0）、
  `LOADFACE=/tmp/inv56.txt pnpm cloud:callmap` **0**（守卫 16/37 调用点、端点级 10/3/27、待复核 15、桌面真会打出 20、
  第十二段 19/2/8、运行时 见过 4 / 没见 12）⇒ **本批产品代码净零，分母一条没动**，E48 抵的是判据层的账。
  `pnpm check:citations` **0**（已判定 221）、`git diff --check` **0 行**。

同日第五十七批（**「藏入口即闸门」这一类再钉一条：桌面角色详情页不给版本 / Fork / 删除，E49**，2026-10-09，产品代码净零改动）：

- 接着上一批的形状往下走：`versionApi.get @ VersionPanel.tsx:44` 与 `versionApi.rollback @ :32` 也在「待人工复核 15 条」里。
  读代码：`VersionPanel` 的**列表查询**早就有 `enabled: !isLocalOnlyDeployment()`，注释还写明"Modal 常驻挂载，入口按钮上的 `!localOnly` 拦不住 hook"——
  但这两条调用点本身不在任何闸门作用域里。挡着它们的是**再上一级的入口**：详情页右上工具条里「×× 个版本」那颗按钮在 `{!localOnly && (` 内
  （`Fork`、`删除` 同理）⇒ 面板在桌面根本打不开，两条云调用在界面上不可达。
- 判据 **E49**（`e2e/desktop-http.spec.ts:1122`）：按 E21 的路子先在内存宿主**建一个真角色**再进详情页
  （**未命中支的详情页什么按钮都没有，count 0 就只是"页面没加载"**——上一批刚登记过这条限度，这里按它做），
  然后同一条工具条里**没被守卫的那两件**（`编辑` 链接、`分享` 按钮）当正控，缺席那三条（`/个版本/`、`Fork`、`删除`）各一条 `toHaveCount(0)`，
  外加零未捕获异常与零 `/api/v1`。
- **牙做了两头**（一条缺席断言只有"该在场时在场"和"该红时真的红"两头都证过才算数）：
  ① 把版本按钮的守卫拿掉（`{!localOnly && (` ⇒ `{(localOnly || true) && (`）⇒ **1 failed**，红在
  `await expect(page.getByRole("button", { name: /个版本/ })).toHaveCount(0)`（`:1147`）；
  ② 反过来把正控 `编辑` 也藏起来（给它套一层 `!localOnly`）⇒ **1 failed**，红在
  `await expect(... "编辑" ...).toBeVisible()`（`:1144`）。
  两次都只改产品代码、跑完即还原（`grep -c "localOnly || true"` = **0**，工具条结构回到原样）。
  **第②次是这批真正值钱的那次**：它证明正控不是装饰——没有它，那三个 count 0 可以靠"整条工具条没渲染"蒙过去。
- 末轮读数：`pnpm e2e:desktop` **56 passed**（55 → 56）、`pnpm gates` **0**（十五道；`test:unit` **706 passed + 1 skipped**）、
  `pnpm check:http-inventory` **0**（`SPEC_URLS` 56 → **57**、`toHaveURL 正则` **19/19**（17 → 19，E48/E49 各带 goto 与 URL 断言）、
  `ROUTES=25`、`UNMOUNTED=0`、`DESKTOP_UNIQUE=0`、`BROWSER_UNIQUE=20`、**完全没证据 0**）、
  `LOADFACE=/tmp/inv57.txt pnpm cloud:callmap` **0**（调用点 16/37、待复核 **15**、桌面真会打出 **20**、第十二段 **19/2/8**、运行时 **4/12**
  ⇒ 与 13:06 逐数相同：E48/E49 抵的是判据层，静态分母不动）、`pnpm check:citations` **0**（已判定 **224**）、`git diff --check` **0 行**。
- **这一类剩下的账**（先把每条的**分派点**读到代码为止，再谈缺什么——我第一版把它写成"这几条还没人看过"，
  逐条查完发现**分派点基本都在，缺的是界面级那一眼**）：
  `relationApi.*` 四条 ⇒ 分派点是 `visibleCharacterTabs(localOnly)` 的 `cloudOnly` 白名单（`characterTabs.test.ts` 已在册，缺界面级）；
  `userApi.*` 六条 + `identityLink.ts` 四条（`report`/`linkEmail`/`resolve` 都挂在"邮箱绑定/恢复"那条链上）⇒ 分派点是 `ProfilePage` 整页早退（E47 覆盖可见的那半）；
  `commentsApi.*` 三条 ⇒ 只被 discover 那 6 个详情页用到，而那些页第五十一批起整页早退（E44 覆盖）；
  `characterApi.listPublic @ apps/web/src/shared/hooks/useCharacters.ts:51` ⇒ 两个消费者各有分派点（`CharacterSearchSelect` 的 S1 守卫已被 callmap 判出；
  `DiscoverCharactersTab` 只挂在 `DiscoverPage`，整页早退）；
  **唯一一条"分派点存在但没有任何判据看着"的**是 `searchApi.global @ apps/web/src/shared/components/GlobalSearch.tsx`：
  它的闸门在调用者那一侧——`apps/web/src/shared/components/AppHeader.tsx:84` 的 `showSearch && !isLocalOnlyDeployment() && <GlobalSearch />`，
  而 callmap 的限度里明写"消费者级条件渲染不认"，所以它永远留在 `桌面真会打出 20` 这个保守上界里下不来。
  ⇒ 下一步最便宜的一条判据就是这个：桌面态首页顶栏不给搜索框（正控＝同一条顶栏上 `剧本` 那类导航项在）。

同日第五十八批（**把上一条"留给下一批"的那件事当场做掉：E50 桌面 studio 顶栏不给全局搜索**，2026-10-09，产品代码净零改动）：

- 上一批在 §6 写下"剩下最便宜的一条判据"，本批照做，不再另开矿脉。目标那条的特别之处在于**它的闸门不在自己身上**：
  `apps/web/src/shared/components/GlobalSearch.tsx` 里读不到任何判定，`searchApi.global`（调用点 `:33`）是被**挂载条件**挡住的——
  `apps/web/src/shared/components/AppHeader.tsx:84` 的 `showSearch && !isLocalOnlyDeployment() && <GlobalSearch />`
  （`showSearch` 由 `StudioLayout.tsx:33` 打开 ⇒ `/studio` 每一页本来都带搜索框）。
  `cloud:callmap` 的限度明写"消费者级条件渲染不认"，所以这条在静态侧**永远**是 `守 0/1`，下不了那 20 的保守上界——只能靠界面级证据。
- 判据 **E50**（`e2e/desktop-http.spec.ts:1167`）：浏览器态断言 `全局搜索...` 输入框**在**（证明它是被守卫掉的、不是组件本来不渲染），
  桌面态断言它 `toHaveCount(0)`，并用同一条壳上没被守卫的 `剧本` 导航项做挂载正控，最后零 `/api/v1`。
- **牙**：把挂载点改成 `{showSearch && (true || !isLocalOnlyDeployment()) && ...}` ⇒ **1 failed**，
  红在 `await expect(page.getByPlaceholder("全局搜索...")).toHaveCount(0)`（`:1186`）；还原后 `git diff --stat` 对该文件**为空**。
- 末轮读数：`pnpm e2e:desktop` **57 passed**（56 → 57）、`pnpm gates` **0**（十五道；`test:unit` **706 passed + 1 skipped**）、
  `pnpm check:http-inventory` **0**（`SPEC_URLS` 57 → **59**（E50 的两条 goto 各算一次）、`toHaveURL 正则 19/19`、
  `ROUTES=25`、`UNMOUNTED=0`、`DESKTOP_UNIQUE=0`、`BROWSER_UNIQUE=20`、完全没证据 0）、
  `LOADFACE=/tmp/inv58.txt pnpm cloud:callmap` **0**（调用点 16/37、待复核 15、桌面真会打出 20、第十二段 19/2/8、运行时 4/12；
  `searchApi.global` 仍列 `守 0/1 @ GlobalSearch.tsx:33`——**静态档位不动是预期的**，判据抵的是"看过"这件事，不是分母）、
  `pnpm check:citations` **0**、`git diff --check` **0 行**、stash **0**、`.e2e-lock` 不存在。

同日第五十九批（**E49 顺手把「关系」那一栏也看一眼——至此「待人工复核 15 条」每一条都有判据或写在册的分派点**，2026-10-09，产品代码净零改动）：

- §6 上批写的"下一个最便宜的一条"照做，**没有另开新判据而是把 E49 加长**（同一个建角色→进详情页的流程不值当跑两遍）：
  断言从三条缺席（`/个版本/`、`Fork`、`删除`）变成四条，加上 **`关系` 那一栏 `toHaveCount(0)`**；
  正控用同一排标签里在场的 **「传记」**（S13-1 就本地化过、桌面必须给）——「传记」在 ⇒ 标签条真渲染了，
  `关系` 那个 count 0 才是"被摘掉一栏"而不是"标签条没加载"。
  `describe` 标题随之改成 **「E49 桌面角色详情页不给「关系」栏与版本/Fork/删除入口」**（引用一律按标题，E 号只是号）。
- **牙**：把 `characterTabs.ts` 里 `relations` 的 `cloudOnly` 改成 `false` ⇒ **1 failed**，
  红在 `await expect(page.getByRole("button", { name: "关系", exact: true })).toHaveCount(0)`（`:1158`）；改回 `true` 后复绿。
  **这里有一条要说准**：我本想同时量"单测那一层也挡着"，但 `pnpm exec vitest run … --root apps/web` 那次**退出码 254、一行汇总都没打**——
  按在册纪律那是"没跑成"，不是"没红"。所以本批只声明 e2e 这一头的变异证据；
  单测 `characterTabs.test.ts` 那两条断言（`visibleCharacterTabs(true)` 恰为 `info/stories/sprites`）是**既有**的，不冒领成本批的新证据。
- **这条线到这里收口的读数**：「待人工复核 15 条」= `listPublic` 1 + `recordView` 1 + `fork` 1 + `relationApi` 4 + `userApi` 6 + `versionApi` 2。
  现在每一条要么有界面级判据（`fork`→E48；`relationApi` 四条与 `versionApi` 两条→E49；`userApi` 六条与 `recordView`→E47/E44 那一页的缺席说明与零请求），
  要么分派点写在 §4 第五十七批那条里（`listPublic`：`CharacterSearchSelect` 的 S1 守卫 + `DiscoverCharactersTab` 只挂在整页早退的 `DiscoverPage`）。
  ⇒ **静态分母仍然是 15**（`cloud:callmap` 不知道这些判据存在），但"这 15 条没人看过"这句已经不再成立。
- 末轮读数：`pnpm e2e:desktop` **57 passed**（条数没变——加长的是同一条用例）、`pnpm gates` **0**（`test:unit` **706 passed + 1 skipped**）、
  `pnpm check:citations` **0**、`git diff --check` **0 行**、stash **0**、`.e2e-lock` 不存在、
  `characterTabs.ts` 的 `cloudOnly: true` 那 1 处已还原（`grep -c` = **1**，与变异前一致）。

同日第六十批（**`cloud:callmap` 加第十三段「调用者侧闸门审计」——按在册纪律先只读数、不挪档，两道判据各见过一次红**，2026-10-09，产品代码净零改动）：

- §6 那条"给工具加一档可达性判据（先量误报）"照做。第十段不知道 `{showSearch && !isLocalOnlyDeployment() && <GlobalSearch />}` 这件事，
  所以 `searchApi.global` 永远留在「桌面真会打出 20」那个保守上界里。**这一段只把这类挂载列出来给人读，一档都没并**（新判据首跑就并档，等于拿没验过的谓词改分母）。
- 读数（`LOADFACE=/tmp/inv59.txt pnpm cloud:callmap`，退出码 **0**）：有未守卫调用点的 .tsx 组件模块 **6** ⇒ 全部挂载都带闸门 **1** / 部分带 **0** / 一处都没带 **5**；
  唯一那一条贴出的是 `apps/web/src/shared/components/GlobalSearch.tsx ⇒ apps/web/src/shared/components/AppHeader.tsx:84 [showSearch && !isLocalOnlyDeployment() &&]`。
  ⇒ **这就是"先量误报"要量的东西**：如果这一档一上来就报出七八条，说明谓词太松；现在只有 E50 已经钉过的那一条，读得通。
- 谓词两条（不是"或"关系，别压成一个布尔）：闸门与挂载之间**必须有 `&&`**；中间**不许出现 `? : }`**。
  四条合成样本走的就是真实函数 `gateEvidenceBefore`，判到 `[true,false,false,false]`。
- **牙做了两头**：
  ① **拿掉规则那一头**——把 `AppHeader.tsx:84` 的 `!isLocalOnlyDeployment()` 删掉 ⇒ `全部挂载都带闸门 1 → 0`、
     控制位"GlobalSearch 必须在'全部门被挡'里"**失败**、退出码 **1**、`UNRELIABLE` 那句照打（消失告警是真的会响）；
  ② **放宽限制那一头**——第一次只删 `[?:}]` 那行，**自测照样绿**：因为我原先那条三元样本中间没有 `&&`，
     挡下它的是"`&&` 必须在闸门与挂载之间"，第二条判据**从没被行使过**。
     补一条 `cond && !isLocalOnlyDeployment() && other ? <Other /> : <Probe />` 的样本之后，
     用同一份放宽版（在 `/tmp` 的副本上跑，产品脚本没动）⇒ 判到 `[true,false,**true**,false]`、退出码 **1** ⇒ 第二条判据现在有样本压着了。
     **限度要跟着写**：`[?:}]` 这一支在**当前真语料里还没有样本**（6 个模块的挂载都是路由 `<Route element={…}>` 或裸挂载），
     它今天的作用是防御性的，不是分母性的。
- 末轮读数：`pnpm gates` **0**（`test:unit` **706 passed + 1 skipped**）、`git diff --check` **0 行**、临时副本 `/tmp/loose` 已删、
  静态分母照旧（调用点 16/37、待复核 15、桌面真会打出 20）——**这一段今天不改变任何档位**，这是设计如此，不是没生效。

同日第六十一批（**给玩家存档补界面级判据时，量到一条没归因的导航现象：URL 变了、界面没变——判据写成 skip，不写成品**，2026-10-09，产品代码净零改动）：

- 动因是任务 #64：`shared/storage/playerSaves.test.ts` 那几条量的是 provider 层（清单/读写/覆写同槽），
  **界面级一条都没有**——"页面没触发自动存档 / 写错槽 / 分派口没接上"这一类没人挡。
- 判据草稿已写进 `e2e/desktop-http.spec.ts`（**E51**）：内存宿主里导一份示范作 → 进播放器 → 等防抖 →
  开「读档」面板 → 断言 `— 空槽 —` 的个数**恰好比槽位标签少一个**（自标定，不硬写 `MAX_SAVE_SLOTS`），
  外加"从没发过 `/api/v1/play/save*`"。计数交给 `toHaveCount(…, { timeout: 15000 })` 重试，
  因为自动存档是 **600ms 防抖 + effect 依赖 `view`**（打字机推进期间会重新计时），落库时刻不是固定值。
- **卡在下一步**：点「试玩」之后 `page.url()` 已经是 `/play/proj-0001`，但 `body` 的 innerText 还是工程页那一套
  （顶栏 Axiforge/STUDIO/发现/文档、侧栏 工作室/概览/剧本/道具/场景/角色、面板 结构·剧本·试玩 三标签与「序列 BEATS 7」），
  HUD 里 `aria-label="菜单"` 那颗始终不在 DOM。**文本里既没有「加载失败」也没有「空格继续」**——
  所以这不是 #61 那条已修的错报（那次的形状是 `load()` 三段各自错报），是**路由换了 URL 而界面没跟着换**。
  两颗同名入口都试过、同貌（工程页工具条那颗与大纲面板那颗，`to` 都是 `routes.play(id)`）。
- **处置纪律**：这条**没有**为了跑绿改成"断言界面还是工程页"（那是把现象钉成契约），
  也**没有**用 `waitForTimeout` 蒙一次。做法是 `test.describe.skip` + 把测量原文写在文档块里：
  `pnpm e2e:desktop` **57 passed | 1 skipped**、`pnpm typecheck` **0**。
- **归因欠的两件事**（都不该在本批顺手做）：① 真浏览器里手点一次能否复现（本机没壳，`pnpm e2e` 那半会写他 dev 库，仍在等授权）；
  ② 若是 PlayerPage 没挂载，要分清是 lazy 分块没到货、路由没重渲染，还是被错误边界吞了。
  ⇒ **任务 #64 按证据退回未完成**：它之前被标 completed 的理由是 provider 层判据齐了，界面级那半从没落地。
- 末轮读数：`pnpm e2e:desktop` **57 passed + 1 skipped**、`pnpm typecheck` **0**、`pnpm check:citations` **0**、
  `git diff --check` **0 行**、`.e2e-lock` 不存在、产品代码本批一字未改。

**第六十一批的更正（同日 14:53，两次测量都算数，不重写上面那条）**：

- **"URL 变了、界面没变"是我读得太早**。补一次结构诊断：点完「试玩」等外壳进 DOM 之后，`#root` 的唯一子元素 className
  就是播放器外壳 `min-h-screen bg-[#0a0a0f] text-white`，`a[href^="/studio"]` 数量 **0**、`BEATS` 字样 **不在**、`document.title=Axiforge`
  ⇒ **导航与卸载都是对的**，之前那次 `body` innerText 读到工程页那一套是**路由切换当口的旧快照**。
  教训归到在册那条：判"界面变成什么"要读**结构**（根元素 className / 上一屏的锚点数量），不是读整页文本的前几百字。
- **真正还没查清的**：`waitForSelector(".bg-[\\#0a0a0f]")` 通过、再对舞台 `(640,500)` 点一下之后，
  15s 内 `aria-label="菜单"` 仍然是 **0 个**；把 DOM 里"有名字的可点元素"整份列出来，
  里面既没有 HUD 那颗「菜单」、也没有 `PlayerStatePanel` 那颗文字「关闭」⇒ **`/play/...` 首屏在等什么**还没弄清（**待查，不是结论**）。
- **我从中推的一句已经撤回**：一度写成"那一屏的关闭键是个只有图标、没有名字的控件"——
  读了 `PlayerStatePanel.tsx` 的源码，那颗是**有文字「关闭」**的；"命名清单里没有它"推不出"它没有名字"（清单本身是被我过滤过的）。
- E51 因此**继续挂 `skip`**（不是挂路由的锅，也不是可及性的锅，是"首屏没弄清"的锅）。
  复量读数不变：`pnpm e2e:desktop` **57 passed + 1 skipped**、`pnpm typecheck` **0**、`pnpm check:citations` **0**、`git diff --check` **0 行**。

同日第六十二批（**E51 上线：桌面试玩真的把自动存档写进了本地库；顺带把"面板不自己刷新"这条量出来钉进判据**，2026-10-09，产品代码净零改动）：

- 上一批那句"首屏在等什么"当天就有了答案：**HUD 与系统菜单要等演出被推开**——`waitForSelector` 只等到的是外壳（`playerScreenClass` 挂在**每一个分支**上，含 loading/error，所以上壳不等于开播），
  再按一次 Space 之后 `aria-label="菜单"` 才进 DOM。之前三次试错分别栽在：读整页文本判界面（时序假象）、
  在元素不存在时直接 `innerText()`（**等满 30s 动作超时，把 60s 用例预算吃光，报出来是"浏览器已关闭"这种毫不相干的错**）、
  以及默认导入路径能与桌面标记共存（不能：导入要**没有**标记才开得出选择器，播放器要**有**标记才走本地）。
- 于是 E51 改用 **新建剧本 → 剧本轨写两拍 AXS → 保存**（E39 的同一流程）造可玩的工程，全程带桌面标记 ⇒
  这条判据同时能断言**零 `/api/v1`**（比上一版草稿更强：草稿不注入标记，只能断"没发存档类请求"）。
- 判据的形状（`e2e/desktop-http.spec.ts`，`test.describe("E51 试玩之后本地库里有自动存档（桌面态全程零云端请求）"`）：
  槽位标签计数自标定（实测 **6 格**，不硬写 `MAX_SAVE_SLOTS`）→ `— 空槽 —` 应少一个 ⇒ 自动那格真被写进。
  **两次采样**是这批最值钱的形状：A=面板开着等（第一次清单），B=关掉再重开一次（逼它重新取清单）。
  原因是实测出来的——**读档面板不会自己刷新**：面板开着等 20s，空槽数一直不动（上一版就是这么红的），
  而重开一次就能看见那条自动存档。这不是缺陷断言，是**把"必须重开才读得到"这条真实行为写进判据**，
  顺带登记一条待查：面板要不要跟着 `writeSaveSlot` 之后 invalidate（若要做，属产品决定，不属本批）。
- **牙**：给自动存档那段 effect 加一行"永远早退" ⇒ **1 failed**，失败信息把三条证据都打全了——
  `槽位 6 格，面板开着时空槽 6 个、重开之后 6 个（两种都没少到 5）；写档失败提示=没亮过（说明根本没尝试写）`；
  还原（`grep -c MUTATED` = **0**）后 **1 passed (5.4s)**。
- 末轮读数：`pnpm e2e:desktop` **58 passed**（57 + E51 转正，无 skip）· `pnpm gates` **0**（十五道；`test:unit` **706 passed + 1 skipped**；
  `[file-size]` 349 文件 0 越线；`[desktop-seams]` 9 接缝／有判据 6／真断言合计 99）· `pnpm typecheck` **0** ·
  `git diff --check` **0 行** · 产品代码本批净零改动（变异跑完即还原）· 未提交／未推送／未动 tag。


同日第六十三批（**E52：打完故事重进不再给续玩提示——变异查出它其实没盖住清槽，判据按实测改口**，2026-10-09，产品代码净零改动）：

- 桌面主玩法的存档今天有**两条**界面级判据：**E51**（推进一拍 → 读档面板里自动那格被写进）、**E52**
  （推进一拍 → 重进**有**续玩提示 → 打到结局 → 重进**没有**提示）。两条都带桌面标记走本地取故事，
  各自都能断"全程零 `/api/v1`"；E52 两次进入之间用 `goBack()`（SPA 历史导航）——
  **不能整页 `goto`**，`?storage=memory` 是模块态，一重载这份工程就没了。
- **E52 的变异量出它自己的边界**：把 `rtState.status === "ended"` 那一支短路成"永远不 clear" ⇒ **E52 照样 1 passed**。
  原因在 `apps/web/src/features/player/pages/PlayerPage.tsx:379`：续玩提示的前提是 `save.state.status === "active"`，
  结局写进去的那条本来就不是 active ⇒ "提示消失"由**状态门**提供，与 `clearSaveSlot` 无关。
  于是标题与文档块都按实测改口（**这条测的是"不再给续玩提示"，不是"槽被清了"**），并登记新的一条待决：
  **结局那次清槽在界面上今天没有可观测后果** —— 要么给它造一个读得到的形状（结局后、下一轮 600ms 写回前那扇窗口，
  或让面板区分"已结束"与"空"），要么这一支该不该存在要定档。**不擅删，也不假装它已被判据覆盖**。
- 建剧本那段在套件里是第 7 次重复（E17/E30/E31/E32/E38/E39 + 这两条）：**沿用本文件既有写法**——抽公共夹具会改到五条已绿的用例，
  属独立重构（判据是"改完七条全绿且计数不变"），不在本批顺手做。
- 末轮读数：`pnpm e2e:desktop` **59 passed**（零 skip）· `pnpm gates` **0**（十五道；`test:unit` **706 passed + 1 skipped**；
  `[file-size]` 349 文件 0 越线）· `pnpm check:http-inventory` **0**（`SPEC_URLS` 57 → **61**、`toHaveURL 正则` **25/25**、
  `ROUTES=25`、`UNMOUNTED=0`、`DESKTOP_UNIQUE=0`、`BROWSER_UNIQUE=20`、完全没证据 **0**）· `pnpm check:citations` **0** ·
  `pnpm typecheck` **0** · `git diff --check` **0 行** · 两次变异跑完即还原（`grep -c MUTATED` = 0、`grep -c 'false && rtState'` = 0）·
  未提交／未推送／未动 tag（`1b9ca06` 三引用重合）。

同日第六十四批（**E53：手动存档与删除存档在界面上真的落到本地库；变异一次到位，还原差点没做成**，2026-10-09，产品代码净零改动）：

- 桌面存档今天有三条界面级判据：**E51** 自动那格被写进 · **E52** 打完不再给续玩提示（**它测不到清槽**，见第六十三批）·
  **E53** 手动存进「存档 1」→ 该格从「— 空槽 —」变成有内容 **且长出「删除存档」那颗键** → 删除后回到基线。
  三条都带桌面标记走本地，各自断言**零 `/api/v1`** 与**零未捕获异常**。
- 形状：一次基线采样 + 一次写入 + 一次删除，每次读数都**关掉面板重开**（读档面板不自己刷新，E51 已实测）。
  基线不是"随便一个数"，而是断言出来的：`total>=3`、`empty == total-1`（自动占了 1 格）、**`del == 0`**——
  最后这条既是"删除键只随人工已填槽长出来"（`save && !isAuto`）的产品事实，也是下面那步的正控。
- **牙**：在 `manualSave` 里插一句"永远早退" ⇒ **1 failed**，失败消息把两次采样原样打出来
  （`{"base":{"total":6,"empty":5,"del":0},"saved":{"total":6,"empty":5,"del":0}}`）——空槽没少、删除键没长，两处都指回写入那一步。
- **这批差点自伤的地方，记下来**：变异与还原我分成两段 heredoc 跑，**还原那段有语法错、整段没执行**，
  于是产品文件带着 `if (true) return; // MUTATED` 继续往下跑了一整轮用例（当时的 `2 passed` 其实是在变异态下测的）。
  是收尾前那一次 `grep -c MUTATED`（返回 **1**）把它抓回来的。规则升级成：**变异与还原写在同一次执行里，
  中间任何一步失败也要走到还原**；回合结束前那条 grep 是硬门禁，不是可选检查。还原后 `grep -c MUTATED` = **0**、
  `git diff --stat` 对该文件为空，三条判据重跑 **3 passed**。
- 建剧本这段在套件里现在重复 8 次（E17/E30/E31/E32/E38/E39/E51/E52/E53 里各一份）——仍按本文件既有写法。
- 末轮读数：`pnpm e2e:desktop` **60 passed**（零 skip）· `pnpm gates` **0**（十五道；`test:unit` **706 passed + 1 skipped**；
  `[file-size]` 349 文件 0 越线）· `pnpm check:http-inventory` **0**（`SPEC_URLS` 61 → **62**、`toHaveURL 正则` **27/27**、
  `ROUTES=25`、`UNMOUNTED=0`、`DESKTOP_UNIQUE=0`、`BROWSER_UNIQUE=20`、完全没证据 **0**）·
  `git diff --check` **0 行** · `## ` 节标题 **8**（写本批前断言过 `## 5.` 只出现一次）· 未提交／未推送／未动 tag。

同日第六十五批（**E54：「对话回顾」这块本地读径有了两头判据；变异这次把还原写在失败也要执行的位置上**，2026-10-09，产品代码净零改动）：

- 玩家侧那几块面板（回顾 / 鉴赏 / 档案）在桌面上全是本地读径，此前**一条界面级判据都没有**。E54 先做「回顾」：
  `pushBacklog` 只在 `doProceed`（离开那一拍）里被调，面板读的就是这份 state。
- 判据写成**两头**，缺一头就不算证据：**开播时**打开面板要给空态「暂无对话记录」
  （没有这一句，"看见台词"可以由任何残留内容满足）；**推进一拍后**要在面板里读到原文「第一处开场。」，
  且空态 `toHaveCount(0)`。加零未捕获异常、零 `/api/v1`。
- **牙（这次按上一批的教训改了做法）**：给 `pushBacklog` 加"永远早退" ⇒ 红在 `expect(page.getByText("第一处开场。")).toBeVisible()`
  （`:1597`）。**变异与还原写在同一次执行里**，还原那一步用无条件顺序（不是 `&&` 链），跑完立刻
  `grep -c MUTATED` = **0**、`git diff --stat` 对该文件为空，再重跑 **E51–E54 → 4 passed**。
- **本批自己踩了一次已被在册的坑**：往判据的失败消息里写了 ASCII 双引号包住的词组（`那句"看见台词"`），
  直接把 spec 成语法错——症状是 `Unexpected token` + **Playwright 报「No tests found」**（不是"某条用例红"）。
  按既有纪律把引用改成「」即恢复。**教训是这条纪律要往前挪**：写带文案的断言消息时，引号一律用「」，别等编译报。
- 末轮读数（全部为还原之后重取）：`pnpm e2e:desktop` **61 passed**（零 skip）· `pnpm gates` **0**
  （十五道；`test:unit` **706 passed + 1 skipped**）· `pnpm check:http-inventory` **0**（`SPEC_URLS` 62 → **63**、
  `toHaveURL 正则` **29/29**、`ROUTES=25`、`DESKTOP_UNIQUE=0`、`BROWSER_UNIQUE=20`、完全没证据 0）·
  `pnpm typecheck` **0** · `pnpm check:citations` **0** · `git diff --check` **0 行** ·
  玩家侧判据现在四条（E51/E52/E53/E54）· 未提交／未推送／未动 tag。
- **这块剩下的**：「鉴赏」(gallery) 与「档案」(codex) 两块面板还要同样的两头形状；codex 在桌面是
  "如实说出来地缺席"（`PlayerPage.tsx:340` 那句 skipped-offline 说明），要钉的是**那句话出现在该出现的时候、
  且不发云端请求**——但它只在跨作品记忆真被请求时亮，需要一个带 codex 数据的剧本才量得到，成本比 E54 高一档。

同日第六十六批（**E55：播放器设置「按作品存」这句承诺第一次有了界面级判据；中途一次自己造的文件损坏与恢复**，2026-10-09，产品代码净零改动）：

- `shared/lib/playerSettings.ts` 的第一行注释写着「按作品存 localStorage」，此前**没有任何判据看着这句**：
  把 key 改成全局一个、或者改了不写回，界面上都读不出来。E55 走四步，每步一条会被变异打红的断言：
  ① 读到默认值 35；② 方向键把它改成 30（控件真连着 state）；③ **换页再进**还是 30（真写回并读回）；
  ④ **另一部作品**的播放器里回到 35（key 真按作品分开）。①④是彼此的对照：没有①，③可由任意初值满足；没有④，"按作品"这一半没人看。
- **第一次跑红在④，但不是产品的锅——是夹具撞了 key**：`createProject` 里那句整页 `goto` 会重置内存库，
  第二部作品又拿到 `proj-0001`，两部的 localStorage key 相同 ⇒ 读到 30 是**夹具行为**。
  改成"第二部走 SPA 导航（剧本列表 → 新建剧本）"之后 ④ 才在真隔离上成立。
  登记成一条通用限度：**在 `?storage=memory` 宿主里，任何"两个实体互不干扰"的判据都必须走 SPA 导航，不能用整页 `goto`**（id 计数会重来）。
- **牙**：把 `KEY(projectId)` 改成固定串 `…:global` ⇒ E55 红在④，消息照原样打出两值
  （`另一部作品继承了上一部的设置（读到 30，默认应是 35）`）；还原（`grep -c MUTATED` = **0**、该文件 `git diff` 为空）后
  **E51–E55 五条 5 passed**。变异与还原仍写在同一次执行里、还原无条件执行。
- **本批最贵的一次自伤，记下来免得再犯**：给 spec 插代码的 python 里我写了 `"\\n".join(...)`（该是 `"\n"`），
  于是**整份 1801 行的 spec 被折成一行**、每个真换行变成字面 `\n`。发现方式是 `pnpm typecheck` 报
  `Expecting Unicode escape sequence` + Playwright 报 No tests found。恢复做法（可复用）：
  整体 `replace("\\n", "\n")` 把 1732 个字面序列还原成换行，再针对**被一起误还原的字符串内转义**（8 处 `insertText("# 开场…")`）
  用 `"# [^"]*"` 的 DOTALL 匹配把内部换行重新收成 `\n`，`pnpm typecheck` 回到 **0**、`test.describe` 计数 29 未变。
  **教训**：改 spec 的脚本要先 `python -c` 打印"计划写入的行数变化"再落盘；一次写坏整份文件的成本远高于一次语法错。
- 末轮读数（全部在还原/恢复之后重取）：`pnpm e2e:desktop` **62 passed**（零 skip；玩家侧五条 E51–E55 全绿）·
  `pnpm gates` **0**（十五道；`test:unit` **706 passed + 1 skipped**；`[desktop-seams]` 9 接缝／有判据 6／真断言 99；`[dead-surface]` 闭包外 10 全在册）·
  `pnpm check:http-inventory` **0**（`SPEC_URLS=64`、`toHaveURL 正则` **33/33**、桌面臂 0／浏览器臂 20、完全没证据 0）·
  `pnpm typecheck` **0** · `git diff --check` **0 行** · 产品代码净零改动 · `1b9ca06` 三引用重合（未提交／未推送／未动 tag）。

同日第六十七批（**把 ADR-029 那行「验收」逐条按命令重量一次：四条里 2 达成 / 2 卡在决策与授权**，2026-10-09，代码零改动）：

- 做的是审计不是新判据。逐条读数写在 `docs/ADR/029-desktop-only-build-target.md` 的「补记 2026-10-09 16:02」，摘要：
  ① 「`/api/v1` 只剩测试宿主所需或为 0」= **达成**（raw **11 处 / 5 文件**；`check:apibase` 退出码 0，
  分类 **测试 9 / 注释 1 / 基址定义 1 / 越界 0**，剩的没有一处是运行期调用点）；
  ② 「桌面是唯一构建与发布目标」= **未达成**（`check:publish` 残差 4 在册：`vercel.json`、`docker-compose.yml`、
  CI 那行 `build:web && build:admin`，且 CI 无 desktop job）——动它要改共享流水线并以 S13-3 定档为前提；
  ③ 「gates 与新基线全绿」= **只对桌面臂成立**（gates 0、`e2e:desktop` 62 passed；`pnpm e2e` 那半没跑，写的是本机 dev 库）
  ⇒ 这句验收**不许笼统报"全绿"**，ADR 里已按两臂分开记；
  ④ 「`backend/` 已不存在」= **未达成**（定档问句：那 13 条 `baselines` 归谁）。
- 顺带把"桌面功能无回归"这半的**证据边界**写准：界面级判据到 E17–E55，但素材经 asset 协议到货、真壳里的落盘与像素
  两项在本会话这台无壳机器上**测不到**，所以那半句不能读成"全部功能都已验证无回归"。
- 末轮：本批无代码改动；`pnpm check:apibase` **0**、`pnpm check:publish` **0**（残差在册）、`pnpm gates` **0**、
  `pnpm check:citations` **0**、`git diff --check` **0 行**。

同日第六十八批（**`playerUnlocks` 从"零判据"变成 10 条单测：鉴赏解锁的落盘、去重、坏数据、按作品隔离**，2026-10-09，产品代码零改动）：

- 为什么是它：`apps/web/src/shared/lib/playerUnlocks.ts` 有 5 个导出函数、承载"鉴赏面板这件解锁了没有"整块读径，
  此前**一条判据都没有**（`check:seams` 看不见它——它不是平台分支；`check:dead-surface` 也不管它——它在闭包内是活的）。
  这类"活着的、没人测的本地读写"正是本次重构最容易留洞的一档。
- 判据写在 `apps/web/src/shared/lib/playerUnlocks.test.ts`（10 条）。两个刻意之处：
  ① vitest 的 web 档跑在 `environment: "node"`（**没有 localStorage**，这点在 `axspImport.rollback.test.ts` 头注里已记过），
    所以测试自带一份 Map 替身，并**同时断言返回值与写进存储的那份原文**——只断返回值会放过"返回对了但没落盘"；
  ② `collectGalleryAssets` 的夹具只桩 `beats[].script` 与 `scenes[].backgroundImage` 两处（它也只读这两处），
    用一次 `as unknown as StoryPackage` 并注明理由，不冒充类型校验。
- 断言清单：没存过=两份空清单 / 坏 JSON 退空不抛 / 一族不是数组就归零另一族照读 / 追加进各自的族**且落盘** /
  重复解锁只有一条且**不重新写盘** / 空路径不追加不落盘 / **按作品分开** / `saveUnlocks` 是整体覆盖 /
  bg→cgs、bgm→bgms 跨拍去重 / 场景背景也算 CG、缺字段指令不产条目。
- **牙**：把 `KEY(projectId)` 换成固定串 `…:global` ⇒ **3 failed**（其中两条正是"落盘"与"按作品分开"），
  还原（`grep -c MUTATED` = **0**）后 web **251 passed | 1 skipped**。变异与还原同一次执行、还原无条件跑。
- 末轮读数：`pnpm gates` **0**（十五道；`test:unit` **716 passed + 1 skipped**＝core 143 / axs 94 / editor-core 189 / **web 251+1skip** / admin 39；
  覆盖率 All files 98.74 与 96.97 两栏；`[file-size]` 349 文件 0 越线，新测试文件 110 行）·
  `pnpm check:citations` **0** · `git diff --check` **0 行** · 产品代码一字未改 · 未提交／未推送／未动 tag。
- **新文件要记得显式 add**：`apps/web/src/shared/lib/playerUnlocks.test.ts` 是**未跟踪**的（`git status` 里在 `??` 中），
  不 add 就永远不在树里——门禁在别的机器上会少这 10 条。

同日第六十九批（**本地身份与玩家设置三个模块从零判据到 20 条单测：`creatorId` / `playerToken` / `playerSettings`**，2026-10-09，产品代码零改动）：

- 为什么是它们三个：同一族"活着的、没人测的本地读写"。`creatorId.ts` 只有 23 行却被**二十余处** import
  （`projectSaves` / `assetPoolSaves` / `axspImport` / `storage/index` 都拿它当 `author_id`），
  `playerToken.ts` 是玩家存档的归属键，`playerSettings.ts` 的头注承诺「按作品存 localStorage」而此前只有点击层 E55 看着界面。
  三条都不被现有门禁覆盖：`check:seams` 只认平台分支，`check:dead-surface` 只管闭包外。
- 判据落在三份**同名**测试文件里（`creatorId.test.ts` 6 条 / `playerToken.test.ts` 6 条 / `playerSettings.test.ts` 8 条）。三个刻意之处：
  ① 与上一批同形：断言既读返回值也读**写进存储的原文**，专门挡"这次返回对了但没落盘"；
  ② 两个铸造分支各带一条**探针控制位**——先 `expect("randomUUID" in globalThis.crypto).toBe(true)` 再在另一条里断 `false`，
    这样"分支没走到"不可能伪装成绿灯。**踩到的坑**：`globalThis.crypto` 是 getter-only（`configurable: true`、`set` 不存在），
    `vi.stubGlobal("crypto", {})` 会直接抛 `TypeError`，只能用 `Object.defineProperty` 换值并在 `afterEach` 装回 getter；
  ③ 一条跨模块控制位：创作者身份与玩家 token 必须各占一个 key（`store.size` 断 2）。这条携带独有信息——见下面 M2。
- **五条变异，全部 byte-identical 还原，残留改动＝无**：
  M1 铸造后不写盘 ⇒ **3 failed**（落盘、空串重铸、无 uuid 分支的落盘各红一条）；
  M2 把 `creatorId` 的 key 塌成 `playerToken` 那把 ⇒ **只有 1 failed**，正是那条跨模块控制位（其余自洽断言全绿，说明不塌就没人看得见）；
  M5 `playerToken` 不写盘 ⇒ **3 failed**（含跨模块那条）；
  M3 读侧不合并默认值 ⇒ **1 failed**（缺字段补齐那条）；
  M4 默认值返回模块级那一份而非副本 ⇒ **1 failed**（"改它不许污染 `DEFAULT_PLAYER_SETTINGS`"）。
- 两条**特征化断言**（钉今天的事实，不是承诺，均未擅自改行为）：
  ① 存储被挡时：读侧 `catch` 退成默认值且静默，写侧**没有** `catch` 直接抛；身份侧退成一次性值且**每次调用都换一个**、一条也不落盘。
    桌面壳里 `localStorage` 可用性本机无证据、界面也走不到这一格，所以只登记不处置——要修就得先定"挡不住时该报错还是该缓存一个会话内身份"，那是定档不是工时。
  ② 设置合并对类型不设防：存 `{"bgmVolume": null, "textSpeedMs": "35"}` 就原样带出。今天唯一写入口是有类型的 `savePlayerSettings`，
    所以不可达；若将来出现迁移/导入往这把 key 写东西，这条就是"脏值会直通滑条与音量"的在册证据。
- 顺手复核一条在册限度（不是漏检，是设计）：`scripts/check-file-size.mjs` 用 `TEST_RE` **明确排除** `*.test.ts|tsx`，
  所以 `[file-size] 349 文件 0 越线` 这个读数不随新增测试文件变动，四份新判据文件都游离在 400 行闸门之外。
- 末轮读数：web **251 → 271 passed | 1 skipped**，`test:unit` **716 → 736 passed + 1 skipped**（core 143 / axs 94 / editor-core 189 / web 271+1skip / admin 39）·
  `pnpm gates` **0**（十五道）· `pnpm typecheck` **0**，并用 `tsc -b --listFiles` 证明三份新文件**确实在**类型检查面内（命中 **3**）·
  `[desktop-seams]` 读数**未变**（9 接缝／6 有判据／真断言 99——诚实标注：这一批的收益只在 `test:unit` 与这一族补洞，没有动接缝档）·
  `git diff --check` **0 行** · 产品代码一字未改 · 未提交／未推送／未动 tag。
- **待显式 add 的新文件现在是四份**：`playerUnlocks.test.ts`、`creatorId.test.ts`、`playerToken.test.ts`、`playerSettings.test.ts`（`git status --porcelain | grep -c '^??'` 现测 **45**，其余按在册纪律"无干净机械信号"不擅判归属）。

同日第七十批（**加固我自己上一批写的一条弱判据，并给端点配置与"跳过已读"两条本地读径补判据**，2026-10-09，产品代码零改动）：

- **先更正自己**：第六十八批那条「同一路径重复解锁只有一条，**且不重新写盘**」用的是 `expect(raw).toBe(before)`。
  设计本批变异时发现：重写同样内容得到的字符串与原串**相等**，`toBe` 比的是值——所以那一半当时根本没牙。
  已在替身里加**写入计数器**（`setItem` 自增），并给 `playerReadState` 同律那条也加上。
- **U2 是直接证据**（去重保留、只把"跳过写入"拿掉 ⇒ 每次都写一遍同样的值）：
  结果 `1 failed | 9 passed`，错误行 `AssertionError: expected 2 to be 1`，红的正是那条判据——
  同一条里的"只有一条"与"内容不变"两个断言都放行。**即：这一半的信息只有计数器抓得到，加固前它是假绿。**
  这条自纠同时意味着：`check:seams` 的"确有真断言"三层判据看不见这种弱判据（它数的是断言存在，不是断言能否失败）。
- 新增两份同名测试：`llmSettings.test.ts` 7 条 + `playerReadState.test.ts` 7 条。
  `llmSettings.ts` 值得测是因为它的读侧是 **fail-closed** 的（认不出的 `kind` 整份当没配），这正是本仓反复踩过的
  `?? 默认值` 静默兜底族的反面；`playerReadState.ts` 是「跳过已读」那份"哪些行算读过"的存储，此前界面侧无判据、模块侧也无。
- 断言清单（端点配置）：没配过=`null`（不是空对象，下游 `draftDispatch` 用它决定走不走模型）/ `kind` 不在白名单⇒`null` /
  缺 `baseUrl` 或缺 `model` 或空串⇒`null` / 坏 JSON⇒`null` 不抛 / **尾斜杠在读侧归一、写侧原样落盘** /
  往返保真且 key 里不含 projectId（头注承诺"跨工程跟着用户走"）/ `save(null)` 是 `removeItem` 而不是往里写字符串 `null`。
- 断言清单（已读行）：键是 `拍id:游标` / `markLineRead` 追加并落盘为**数组**（顺序即插入顺序）/ 重复标记不重新写盘 /
  坏 JSON 与非数组退成空 `Set` / 按作品分开 / **`lineKey(null, n)` 用 `?` 哨兵，且它与真 id 共用同一命名空间**（特征化）。
- 那条哨兵的可达性我查到底了：`currentLineKey` 只在 `view.waiting === "say"` 时生成（`PlayerPage` 的 `useMemo` 挡着），
  而 `say` 必然在某个拍内——`restore` 遇到 `currentBeatId` 缺失或指向不存在的拍会整份退回 `start()`（`packages/core/src/engine.ts` 里那条
  `if (normalized.status === "ended" || !getBeat(...))`）。所以今天撞不到，**只登记不处置**；
  我没有测"标题派生能不能产出恰好为 `?` 的拍 id"，这一格留作未验证。
- **七次变异各红一条、全部 byte-identical 还原、`git diff` 该目录为空**：
  L1 不校验 kind 白名单 / L2 `save(null)` 不删 key / L3 不剥尾斜杠 / P1 去掉"已读过跳过写入" / P2 哨兵 `?`→空串 / U1 去掉"已解锁跳过" / U2（上面那条）。
  第一次跑 U2 时锚点只吃了半块，插入后与保留下来的原行重复声明 `const next` ⇒ vitest 报 `Tests  no tests`——
  按在册纪律先辨「加载失败」与「断言失败」，改锚点为整块替换后才是上面那个数。
- 末轮读数：`src/shared/lib` 单测 **51 passed（7 个文件）**，web **271 → 285 passed | 1 skipped**，`test:unit` **750 passed + 1 skipped**·
  `pnpm gates` **0**（十五道）· `pnpm typecheck` **0** · `[desktop-seams]` **9／6／真断言 99（未变）** ·
  `[dead-surface]` 闭包外 10 条在册、面 **291**（新增两份测试文件各算一格）／闭包内 245 · `git diff --check` **0 行** ·
  产品代码一字未改，故未重跑点击层（`e2e:desktop` 沿用 16:06 那次 **62 passed**，理由：本轮改动不落在那批 spec 的扫描面上）。
- **口径更正（写给下一个读数的人）**：收尾自查时 `git rev-parse --short desktop-handoff-20260929` 打出的是 **tag 对象** `dbf1dde` 而不是提交，
  一度像"tag 被动过"。实际它是**附注标签**，peel 后 `%(*objectname)`＝`1b9ca06`、taggerdate 仍是 2026-09-29 21:46:26，三者未动。
  要比对这三个引用，请用 `git rev-parse --short 'desktop-handoff-20260929^{}'` 或 `git tag -l --format='%(*objectname:short)'`。
- **待显式 add 的新文件现在是六份**：上面四份再加 `llmSettings.test.ts`、`playerReadState.test.ts`（`??` 现测 **47**）。

同日第七十一批（**该族最后两格：`draftManager` 10 条 + `routeHistory` 7 条；并把自己一条没成立的怀疑核对掉**，2026-10-09，产品代码零改动）：

- `draftManager.ts` 是这族里唯一带**配额治理**的模块：索引只留 10 份、被挤掉的那份连正文一起删，而 `DraftRestoreDialog` 完全靠这份索引说话。
  `routeHistory.ts`（分支回想）此前只有点击层之外的零判据状态。
- 断言清单（草稿）：正文与索引一起落盘且**新的在最前** / 索引项名字按 `meta → anchor.name → anchor.essence → 未命名` 逐级退 /
  更新已有草稿时**正文覆盖、名字刷新、但索引位置不前移**（特征化）/ 第十一份进来挤掉最旧那份且**把它的正文一起删掉** /
  存储抛错时整块静默（不抛、`getIndex()` 空、`getLatest()` 为 `null`）/ `load` 与 `getIndex` 遇坏 JSON 各退 `null`／`[]` /
  `remove` 同删正文与索引项 / `clearAll` **只删索引里列出的正文**，脱离索引的 `axiforge_draft_*` 留在原地（特征化）/
  `CREATE_DRAFT_ID=create_new` 与 `editDraftId(id)="edit_<id>"` 是键的一部分（改了就等于全员丢草稿）。
- 断言清单（分支回想）：**`recordChoice` 不去重（选择是序列）而 `recordEnding` 去重（结尾是集合）**——两条律分开各钉一条，
  只测一个的话另一个被顺手改成同律也看不见 / `at` 用 fake timers 钉成记录时刻的 ISO 串 / 一族不是数组只归零那一族 /
  坏 JSON 退空 / `save` 整体覆盖 + 按作品分开 / **重复记 ending 仍会重写一遍存储**（不像 `unlockCg`/`markLineRead` 那样跳过写，靠上一批加的写入计数器才量得出）。
- **八次变异各有名有红、全部 byte-identical 还原、该目录 `git diff` 为空**：
  D1 取消裁剪⇒`expected […(11)] to have a length of 10`；D2 改成追加队尾⇒**4 红**（顺序／名字表／不前移／挤掉）；
  D3 去掉 essence 档⇒`['未命名','未命名',…]`；D4 把静默 catch 改成往外抛⇒`expected [Function] to not throw but 'Error: quota exceeded' was thrown`；
  D5 更新时挪到队首⇒`expected ['old','new'] to deeply equal ['new','old']`（这条证明"不前移"那条特征化确实有牙）；
  R1 `recordChoice` 改去重⇒长度 2 变 1；R2 `recordEnding` 不去重⇒2 红；R3 读侧不校验数组⇒`choices: '不是数组'` 直通。
- **我一条没成立的怀疑，核对后撤回**（写给下一个读者，省得重复走）：我以为"草稿存不上时 `DraftIndicator` 会说'✓ 已保存'"。
  实际链路是 `updateField` 置 `isDirty:true` → 防抖里 `draftManager.save` + `set({lastSavedAt})`，
  而 `markClean()` **只在角色真保存成功后**被调（`EditCharacterPage` 的 `handleSave` 里 `mutateAsync` 之后）——
  所以草稿写失败时界面停在「● 未保存」，不会假称已保存。
  真实的后果只有一条：**草稿静默丢失且没有任何提示**，表现是下次进来 `DraftRestoreDialog` 不再问你要不要恢复。
  同一族 hazard 在玩家侧已经有名字（`PlayerPage` 的 `reportSyncNotice`／`syncNotice`「本地进度未能保存（桌面：…）」），角色草稿侧没有——
  **这道不对称要不要补、按哪种形状补（`save` 返回 outcome 还是抛给调用方），是定档不是工时**；与 `navigator.clipboard` 那条同例，**本次只登记、不占 §6 的共享编号**。
- 末轮读数：`src/shared/lib` 单测 **68 passed／9 文件**（51→68）· web **285 → 302 passed | 1 skipped** ·
  `test:unit` **767 passed + 1 skipped**（core 143 / axs 94 / editor-core 189 / web 302+1skip / admin 39）·
  `pnpm gates` **0** · `[dead-surface]` 面 **293**（新增两份测试各算一格）／闭包内 245／闭包外 10 在册 ·
  `[desktop-seams]` **9／6／真断言 99（连续三批未变）** · `git diff --check` **0 行** · stash **0** ·
  三引用按 peel 取仍重合 **`1b9ca06`**（`git rev-parse --short 'desktop-handoff-20260929^{}'`）· 零产品改动故未重跑点击层。
- **至此这一族基本收口**（分母按命令取：`grep -l localStorage apps/web/src/shared/lib/*.ts` ＝ **9 个模块**，不是我心算的"七个"）：
  `creatorId` `draftManager` `llmSettings` `playerReadState` `playerSettings` `playerToken` `playerUnlocks` `routeHistory`
  这八个**全部有同名测试**；剩 `identityLink.ts` 一格（它读存储是为了拼身份，属云端举报通路，桌面态是否还走得到要单独查）。
  待显式 add 的新文件现为**八份** `.test.ts`（`??` 现测 **49**）。

同日第七十二批（**身份键字面量从八处手抄收成一处权威，并给这条归一配了双向判据**，2026-10-09，**这一批改了产品代码**）：

- 缺陷形状：`"axiforge.creatorId"` / `"axiforge.playerToken"` 两串字面量手抄在**四个文件八处**
  （`creatorId.ts` 与 `playerToken.ts` 是权威，`identityLink.ts` 四处写、`UserContext.tsx` 四处写/删）。
  一旦有人只改权威那一处（改名、加版本后缀），登录与恢复身份就会写进**孤儿 key**，
  而 `getCreatorId()` 读新 key 铸出一个全新身份 ⇒ 整个本地作品库按 `author_id` 变得不可见，界面上没有任何错误。
  现有门禁一条都挡不住：`check:seams` 不管（不是平台分支）、`check:dead-surface` 不管（在闭包内）、类型系统不管（两边都是 `string`）。
- 改法（值一字未改，纯结构归一）：`creatorId.ts` 导出 `CREATOR_ID_KEY`、`playerToken.ts` 导出 `PLAYER_TOKEN_KEY`，
  那八处改为 import 常量。收完后按 grep 复查：**两串字面量只剩权威模块与两份测试里的值钉**，调用方 0 处。
- 判据（`identityKeyAuthority.test.ts` 3 条 + 两份既有测试各加 2 条）：
  ① 除权威模块外 `apps/web/src` 不许再出现这两串——**模式从真相源运行时 import**，所以这个文件自己不含那两串，
    不会被自己的注释或字符串喂饱（在册教训：文本守卫的第一批客户是我自己）；
  ② 对照位·扫描面地板 `walk(SRC_DIR).length >= 200`（实测面 **255**，路径断掉会得 0 而让①退化成恒真）；
  ③ 对照位·权威模块确实带着这两串；
  ④ 两串键名各自的**值棘轮**（`expect(CREATOR_ID_KEY).toBe("axiforge.creatorId")`）——改名等于全员丢身份，必须是一次显式的、有点名的改动；
  ⑤ 恢复身份/注销的**往返**：按常量写、`getCreatorId()`/`getPlayerToken()` 读得回。
- **归一判据必须双向**（在册纪律）：
  M-a 真相源改名（加 `.v2`）⇒ **6 红**，红的正是值钉与那些用旧字面量核对落盘的断言，而①跟着真相源走、**仍绿**——
  这就是想要的分工：改名由"值钉"挡，抄回调用方由"扫描"挡。
  M-b 把 `UserContext.tsx` 一处写回字面量 ⇒ ①红且点名 `app/providers/UserContext.tsx`；
  M-c 把 `identityLink.ts` 一处写回字面量 ⇒ ①红且点名 `shared/lib/identityLink.ts`。三次变异全部 byte-identical 还原，
  收尾探针：两个调用方文件里字面量残留＝**否**、`CREATOR_ID_KEY` 值＝`axiforge.creatorId`。
- 过程中我自己踩了一次路径口径：`fileURLToPath` 给的是**带尾斜杠**的目录，`walk` 又用 `${dir}/${name}` 拼接 ⇒ 双斜杠让豁免集合永不命中，
  第一条扫描判据开局就红（红在"权威模块自己被记为越界"）。修法是 `replace(/\/$/, "")`，
  且**豁免按整路径而不是 basename**（同名文件遍布界面层时 basename 会误配，这条也在册）。
- 顺带登记一条事实（**不处置、不占共享编号**）：`identityLink.ts` 里 `linkCreatorEmail` / `restoreIdentityFromEmail`
  全仓**零 import**（只有 `reportContent` 被 `DiscoverProjectsTab` 用），而它们是云端身份绑定通路——
  这属 S13-3 判死名单该过的一格；本次只把它们的键引用收进权威，没有给"可能判死的函数"搭新测试设施。
- 末轮读数：web **302 → 309 passed | 1 skipped** · `test:unit` **774 passed + 1 skipped** · `pnpm gates` **0**（十五道，lint 0 warnings/0 errors）·
  `[dead-surface]` 面 **294**／闭包内 245／闭包外 10 在册 · `[desktop-seams]` **9／6／真断言 99** · `[file-size]` 349 文件 0 越线 ·
  **`pnpm e2e:desktop` 重跑＝62 passed／0 skipped（2.9m）**——本批动了 `UserContext.tsx` 等四个产品文件，按在册纪律不能只交门禁。
  未重跑 `check:http-inventory`：改动只是把字面量换成 import，**没有增删任何调用点**，且 62 条点击层判据各自断言了零 `/api/v1`。
- **待显式 add 的新文件现为九份** `.test.ts`（本批新增 `identityKeyAuthority.test.ts`）；`??` 现测 **50** 条。

同日第七十三批（**成对重取两道普查 + 把 README 里三处腐烂的抄数换回现测**，2026-10-09，零代码改动）：

- 为什么现在重取：上一批改过 `identityLink.ts` 与 `UserContext.tsx`，它们**就在云端调用的扫描面上**——
  按在册纪律，"沿用早先绿灯"对这一项不成立。跑法必须是成对的：
  `pnpm check:http-inventory`（输出留文件）⇒ `LOADFACE=<那个文件> pnpm cloud:callmap`，
  否则第十二段拿的是旧世界的运行时列。
- 读数**逐档与 12:47 / 14:18 那次全等**（这本身就是结论：归一只换 import，没有增删调用点）：
  六档 **11 / 9 / 34 / 27 / 6 / 8**（相加 95）／调用点 **53** ⇒ 有守卫 **16**（S1=8 / S2=0 / S3=8）、无守卫 **37**／
  宿主可达 **20 / 9 / 8 / 0**、端点级 30 = **6 / 24**、时机档 29 = **19 / 2 / 8**、静态×实测对账 = **见过 4 / 没见过 12**、
  第十三段 6 个 .tsx ⇒ 全部带闸门 **1** / 部分 **0** / 一处都没带 **5**／普查两臂 = 桌面 **0** 笔、浏览器正对照 **20** 个唯一调用点，
  `ROUTES=25`（解析）、`SPEC_URLS=64`、`toHaveURL` 正则 **33/33**、完全没证据的路由 **0**。
- **README 三处抄数腐烂已换回现测**（这是同一规律第三次应验：抄门禁打印的数就一定会腐烂）：
  死表面面 `285` ⇒ **294**（两行都改，带 16:37／16:47）、`check:citations` 已判定 `216` ⇒ **243**、歧义跳过 `37` ⇒ **18**（带 16:46）。
  其余带日期的读数（labels 205、seams 9/6/99、file-size 349、dispatch 32/26/6）本次复核**仍为真**，未改。
- `REFACTOR_DESKTOP.md` 补**第五十一次续做**条目，把第六十八…七十二批那段（为什么单独做这一族、分母怎么取、三次自我证伪、
  `crypto` getter-only 与 `fileURLToPath` 尾斜杠两个平台形状、归一的双向判据、末轮读数）收在一处。
- 写作过程中的自查：先写成"那 57 条判据"（按 web 单档 241→309 的差值重数＝**68**）、
  又写"键耦合已在第五十二次关闭"（下一段才是本段）⇒ **数量与交叉引用都要按命令/实际段落重数一遍**，不能顺着手感写。
- 末轮：`pnpm check:citations` **0**、`git diff --check` **0 行**、`.e2e-lock` 不在、三引用按 peel 仍 `1b9ca06`、未提交未推送未动 tag。

同日第七十四批（**把"六条链"补齐成今日读数，并把一条后端旧数逐文件归因到一字不差**，2026-10-09，零代码改动）：

- §6 顶部新加**「当前恢复点（16:51）」**那一段：一眼状态、九份待显式 add 的文件（逐份点名）、两条只观察不处置的新登记
  （草稿静默丢失 vs 玩家侧已有 `syncNotice`；`identityLink` 两个零 import 的身份绑定导出属 S13-3 一侧），
  以及仍欠的两次取数——都按成本排好，下一会话不必再把散落各处的复量行拼一遍。
- 补齐产物层与后端层（第七十二批改过 `UserContext.tsx`，构建层不能沿用旧绿灯）：`build:web` **0**（89 行产物；
  先 `stat` 过 `dist/index.html` 的 mtime 与本次同时，确认不是拿旧产物报新数）· `build:admin` **0** · 桌面 `cargo check` **0** · 后端 `pnpm test:api` **0**。
- **后端那条旧数归因完才敢写进文档**：今日 `-v` 收集 **34 文件／226 条**，其中**三个未被 git 跟踪的 in-flight 文件**贡献 **59 条**
  （`test_condition_vectors.py` 32 + `test_condition_matcher_vectors.py` 22 + `test_condition_family_support.py` 5）；
  **226 − 59 = 167**，与 10-01 的在册读数一字不差，也与那条"199"只登记了 32 条的批次自洽（167+32=199）。
  所以既不是回归、也不是我改坏的，是**另一支的产物进了收集面**。结论按树分开写：**HEAD 上 167，当前工作树里 226**；
  引用"后端全绿"必须说明是哪一份树，否则同一命令在两棵树上的两个读数都会被误读成回归。
- 未复验的一条如实标注：pytest 的库隔离本次没重测，沿用 #54 交付时的实测陈述（"dev 台账一字未变"）。
- 末轮：`git diff --check` **0 行** · stash **0** · `.e2e-lock` 不在 · `MUTATED` 探针 **0** · 三引用按 peel 仍 `1b9ca06`。

同日第七十五批（**文档↔实树机检：命令名零漂移，抓到一条活文档里的假文件名并另起带日期更正**，2026-10-09，零代码改动）：

- 为什么还要做一次机检：`check:citations` 只管 `` `路径:行号` `` 这种形式**存在且行号在范围内**，它不管
  ① 文档里承诺的**命令名**是否真在 `package.json` 里，② 不带行号的 `` `路径` `` 是否还在树上。用一个临时探针（跑完即删，不进仓）把这两面各量一次。
- 口径：26 份文档（README／两份根级＋`docs/` 与 `docs/ADR`）× 49 个真脚本名（根 + 各 workspace 包）× 文件全集 844（`git ls-files` 776 ＋ 未跟踪 68）。
  **① 命令名对不上＝0 条**（正则初版把 `pnpm install`、`pnpm -F` 也算进来，属 npm 内建与参数，已按名单排除——这是我自己探针的误报，先修口径再取数）。
- **② 路径面要分诊，不能直接报数**：初版给"204 条失效"，几乎全是 URL、`try/catch`、`0/22` 这类比例串——
  **写规则前先在真实语料上量命中率**这条又一次应验。收紧成"必须带已知扩展名且不是绝对路径"后得 50 条，逐类读过全部有解释：
  变异证据里刻意建了又删的探针（`__probe_*`、`.tmp-probe-*`、`netlify.toml` 那类"放进去就 FAIL"的夹具）、构建产物的哈希名（`index-D1fasm5k.js`）、
  `.axsp` **包内**成员名（`project.json`／`characters.json`／`input.json` 在归档里而不在树上）、ADR／日志按当时实态保留的历史路径、
  按在册纪律不入库的标定产物、以及技能目录里的外部脚本路径。⇒ **真失效 0 条**（除了下面那一格）。
- **抓到的那一格是活文档里的假文件名**：`docs/KERNEL_DESIGN.md` 第 168 行承诺"契约测试套件 `storage/contract.test.ts` 是一切实现的验收标准"，
  而 `packages/editor-core/src/storage/` 里**从来没有这个文件**——`contract.ts`／`contractPools.ts`／`contractAuthoring.ts` 只是**导出**套件，
  真正**跑**它的是 `packages/editor-core/src/storage/memory.test.ts`（`import { runStorageContractSuite } from "./contract"`），
  云端与 Tauri 两支由 `apps/web/src/shared/storage/` 那 **22** 个测试文件按各自契约面覆盖。
  处理方式按在册纪律：**历史句子不重写，另起一条带日期的更正**，并顺手指出 10-01 那次更正留下的"『contract.ts 跑双支契约用例』"也不准确（它是定义处不是运行处）。
- 一条限度要写清（否则这批读数会被误用）：文本级机检分不出"引的是历史"与"现状说谎"，上面那一格是靠**人读上下文**才定性的；
  所以这个探针**不进 `gates`**，也不升成门禁——它给的是候选清单，判性仍然要回代码。这与三道普查不进链是同一条理由。
- 末轮：`pnpm check:citations` **0**（改完文档重跑）· `git diff --check` **0 行** · 仓库树里没有新增探针（探针写在 `/tmp`，仓外）· 三引用按 peel 仍 `1b9ca06`。

同日第七十六批（**把普查第十二段那 12 条「静态判高」的端点逐条定性，并补上 E56 这两条从未按名守过的死入口**，2026-10-09，**动了 e2e 与文档，产品代码零改动**）：

- 为什么挑这条：`cloud:callmap` 第十二段自上线起就留着一句"这 12 条才是本段真正要逐条看的"，谁都没看完。
  它们是 S13-3 判死名单正缺的那一格——**要么桌面已被挡住（静态判高），要么桌面真会打出（残口）**，两种解释的处置完全不同。
- 取证方式：派一个只读代理逐条读消费者代码并**强制要求给出 文件:行号 + 那一行原文**，我把它四条最承重的结论自己复核了一遍
  （`UserContext.tsx:42` 的 `if (isLocalOnlyDeployment()) { setProfile(null); return; }`、`VersionPanel.tsx:27` 的
  `enabled: !isLocalOnlyDeployment()`、`CharacterSearchSelect.tsx:68` 的 `if (isTauriEnvironment())`、`DiscoverStatsBar.tsx` 确在死面基线 `:3`）。
  **代理的一处结论被我推翻**：它说"注销/邮箱恢复没有任何点击判据"——`ProfilePage` 那一页其实已有 **E36** 按名守着「保存昵称」与「导出我的数据」，
  只是没点过另三条的名。⇒ 新用例**不重复占面**，只补 E36 没守的那三条（净零新增那条纪律在这里正好用得上）。
- **结论：12 条全部 A 类，桌面 0 条真会打出**。机制分布：页面级早退 7／隐藏入口 3（relations 那三条）／调用者侧闸门 1（`/search/all`）／查询层闸门 1（版本回滚）。
  复合情形两条：`/characters/public` 的搜索腿靠的是 **`isTauriEnvironment()` 分派早退而不是部署判定**——
  **S13-7 删掉分派另一半时这层保护会一起消失**，这条应进 S13-7 的检查单（本批只登记，不动它）；版本回滚是"闸门＋藏入口"双层。
  顺带把普查那个"桌面 0 笔"从现象解释成了机制：应用级 provider 在桌面根本不发 `userApi.session`，所以静态与实测并不矛盾。
- **新判据 E56**（`e2e/desktop-http.spec.ts:324`，两半成对）：浏览器态三条动作按钮「绑定到当前账号」「用邮箱恢复旧账号」「注销账号」按名可见（正对照），
  桌面态三条 `toHaveCount(0)` + 「当前身份：」与「账户设置需要协作服务」在位 + 零 `/api/v1`。
  **牙**：把 `ProfilePage` 那句早退改成 `false && …` ⇒ **3 failed / 61 passed**，红的正是 E36 + E47 + E56 三条（这一页由三条判据合守，不是只靠早退那一行），
  还原 byte-identical。
- 读数：`e2e:desktop` **64 passed／0 skipped**（干净态 2.9m；62 → 64 就是 E56 的两半）· `tsconfig.e2e.json` 的 `tsc --noEmit` **0** ·
  `pnpm gates` **0**（十五道）· `check:citations` **0** · `git diff --check` **0 行** · 三引用按 peel 仍 `1b9ca06`、未提交未推送未动 tag。
  本批改了产品面的只有 e2e spec（`ProfilePage.tsx` 只被临时变异、已还原），故点击层是真跑过而不是沿用。
- **仍欠的两条**（下一批的候选，都不需要定档）：`/comments/*/report` 的**举报按钮**按名判据；`/discover?tab=characters` 里 tags 装载腿——
  后者需要普查带上 tab 参数，属取数口径扩展，不是新切片。

同日第七十七批（**`/tags/` 那条"普查看不见子视图参数"的缺口钉成界面级判据 E57**，2026-10-09，产品代码零改动）：

- 选形不选工具：这一格本可以改成"让加载面普查带 tab 参数"，但那会把一个**装载层仪器**推成点击爬虫，与它写在头的分工（普查＝装载、`e2e`＝界面与点击）冲突
  ⇒ 用已有的界面层形状答同一个问题，不加新工具。
- 事实来源是结构性的：`DiscoverPage.tsx:49` 那句 `if (isLocalOnlyDeployment()) return …` 在四个 tab 分支（`:89-92`）**之前**，
  所以 `?tab=characters` 那一支（`DiscoverCharactersTab` → `useTags` → `/tags/`）在桌面根本挂不上。
  而"读代码读出来的覆盖"正是最容易被后续改动悄悄破掉的那种，所以钉成判据而不是留在注释里。
- **E57**（`e2e/desktop-http.spec.ts:361`，两半成对）：浏览器态遍历四个 `?tab=`，断每一支的**搜索框占位符就是那一支的话**
  （`SEARCH_PLACEHOLDERS` 四个值各不相同）——这条正对照不可省：没有它，"整页空白也零请求"这种改动能让桌面那一半白拿绿。
  桌面态四个参数各访一遍，断「发现页需要协作服务」在位、四个占位符全部 `toHaveCount(0)`、每一支**各自**断零 `/api/v1`。
- **牙**：把那句早退改成 `false && …` ⇒ **2 failed / 64 passed**（E14 的 `/discover` 那条 + E57 桌面那一半），
  而 **E57 的浏览器态那一半在变异下仍绿**——红的确实是"桌面该挡住"这一条，不是页面被改坏。还原 byte-identical。
- 读数：`e2e:desktop` **66 passed／0 skipped**（64 → 66 就是 E57 两半）· `tsconfig.e2e.json` 的 `tsc --noEmit` **0** ·
  `git diff --check` **0 行** · `MUTATED` 探针 **0** · 三引用按 peel 仍 `1b9ca06`、未提交未推送未动 tag。
- **第十二段这 12 条现在的账面**：`/tags/` 那一格由"普查看不见"变成"界面级判据守着"，其余同上批那张表
  （早退 7／隐藏入口 3／调用者侧闸门 1／查询层闸门 1）。只剩 `/comments/{id}/report` 的**举报按钮**还没有按名判据——
  它挂在 discover 详情五页的评论区里，桌面被页面级早退挡着（E44 已量那五页零请求）；
  补它的难点是浏览器态那一半要**真有评论数据**才点得亮正对照，这个选择（造夹具 vs 用文案缺席做正控）留给下一批，
  我先把"不能没有正对照"这条约束写在用例名旁边，免得下一个人为图快写成恒真的一条。

同日第七十八批（**普查第十段的一处真判据缺陷：别名式整页早退全部看不见**，2026-10-09，改的是 `scripts/cloud-callmap.mjs`）：

- 起点不是"找活干"，是上一批留下的矛盾：我说 12 条全 A（靠读代码），而工具把 `useCommentThread` 放在
  「宿主不早退 ⇒ 桌面真会打出」那一档。两边不能同时对，所以我没有让文档盖过工具，也没有让工具盖过代码——去查判据本身。
- **根因**：`earlyReturn()` 要求守卫串**前面 24 个字符**以 `if (` 结尾。直接式 `if (isLocalOnlyDeployment())` 的匹配从调用本身开始，那条检查正好命中；
  而别名式 `if (localOnly)` 的匹配串（`ALIAS_USE`）**把 `if (` 一起吃进了匹配**，于是"前面"落到了 `if` 之前，永远不满足 ⇒ **所有别名式整页早退都被漏判**。
  这正是 `guardShape`（S1/S2/S3 那套）在第五十四批修过的同一个洞，当时只修了壳守卫档，没回头查第十段。
  修法：两种形状各测一次（`selfIf` 或 `prefixIf`），判定范围改取"这条 if 自己的块"（`blockPairs` 里第一个 `open >= p` 的块）而不是 `stmtEnd`。
- 读数：`判成"桌面早退"的路由页` **3 → 8**（新增五个：`/discover/characters/:id`、`/discover/items/:id`、`/discover/scenes/:id`、`/discover/topics/:slug`、`/author/:authorId`）。
  **五个 discover 详情页里只有 `/discover/projects/:id` 仍没被认出来**——它就是下面那个残点。
  **档位计数没动**（宿主不早退仍 20、早退档仍 9、端点级 24/6 不变）——⇒ 上一批"12 条全 A"的那个结论**没有被这次修正推翻**，
  修正的是"为什么工具不认"，不是"谁可达"。
- **顺手补了一条它自己该早就有的诊断**：那 20 条的档名写着"要人工确认早退覆盖这条路径"，却从不说是**哪条路由页**在驱动它，等于没法执行。
  现在每行带 `宿主[/discover/projects/:id]`（`不早退` 档存的就是驱动它的那几条，其余档存全部宿主，超过 6 条截断）。
  这条诊断一上线就指出了下一个残点：**`/discover/projects/:id` 仍被判"不早退"，而它的页面确实有深度 0 的 `if (localOnly) { return … }`**
  （`DiscoverProjectDetailPage.tsx:53`；四个兄弟页本次都被认出来了，只有它没有）。**成因我还没找到**，
  方向是保守的（上界虚高、不藏缺陷），且现在**输出里看得见**而不是靠人记住。复现：`LOADFACE=<普查输出> pnpm cloud:callmap`，看那一行的 `宿主[...]`。
- 复核：`diff` 旧输出只有"早退页 3→8"这一处实质变化（其余是新加的 `宿主[...]` 注）；`pnpm gates` **0**（脚本变长没顶到 `[file-size]`）；
  工具自带的控制位仍通过（`ProjectListPage` 依旧判"不早退"、`PromptExport` 依旧判"零引用"，否则退出码非 0）。
- 一句话限度：这一批改的是**读数工具的口径**，不是产品面；所以 `e2e:desktop` 那 66 条不需要重跑（无产品改动），
  但**普查读数本身已重取**，README 里"判成桌面早退的路由页 3 个"那句已随之改成 8 个并带 18:03 取数时间。

同日第七十九批（**上面那条"成因未找到"的残点查到底了：不是本段的判据问题，是共享遮蔽器不认正则字面量**，2026-10-09，改 `scripts/source-graph.mjs` + `scripts/cloud-callmap.mjs`）：

- 上一批我留了一句"方向保守、成因未找到"。这次不猜：把 `earlyReturnFrom` 拆成可自测的纯函数、加合成样本，再拿同一套代码去数**未闭合的 `{`**——
  一跑就露：`DiscoverProjectDetailPage.tsx` 遮蔽后仍有 **1 个未闭合 `{`，位置正是函数体那一行**。
- **根因**：`maskNonCode` 认行注释、块注释、三种引号，但**不认正则字面量**。该页第 139 行是
  `{playUrl.replace(/^https?:\/\//, "")}`，里面 `\/\/` 的尾部两个斜杠被当成行注释 ⇒
  **同一行之后的代码连那个 `}` 一起被抹掉** ⇒ 花括号从此配不平 ⇒ `blockPairs` 拿到的"函数体"退化成第 24 行那一个碎片。
  也就是说：这不是第十段一条判据的毛病，而是**所有建在遮蔽文本上的判据共用的那层真相源有洞**（块配对、路由解析、守卫形状、死表面、接缝、普查都用它）。
- 修法是给扫描器加一条正则分支：只有在**操作数位置**（前一个非空白字符是 `( , = : [ ! & | ? { } ; + - * % < > ~ ^` 之一）才把 `/` 当正则开头，
  吃到未转义的收尾 `/`（字符类 `[...]` 里的 `/` 不算收尾），并把字面量内容一并抹掉；碰到换行就放弃（说明那不是正则），交回普通扫描。
- **改完重取的账**（每一条都是命令读数，不是推算）：
  `判成整页早退的路由页` 8 → **9**（`/discover/projects/:id` 现在认得出来了）·
  保守上界「桌面真会打出」**20 → 16** · 「只在桌面会早退的宿主页里」**9 → 12** ·
  壳守卫档「有守卫」**16 → 17**（S3 早退 **8 → 9**）／「无守卫」**37 → 36** ·
  端点级（有未守卫调用点的）**30 → 29**、至少一处走得到 **24 → 23**、都走不到 **6** 不变 ·
  时机档 **29 → 28** 处（装载即发 19 → 18 / 点了才发 2 / 不明 8）、静态×实测对账 真见过 **4 → 3** / 没见过 **12** ·
  第十三段有未守卫调用点的 .tsx 模块 **6 → 5**（全挡 1 / 部分 0 / 没挡 **5 → 4**）· 六档 **11／9／34／27／6／8** 与端点定义 **95** 不变 ·
  `check:http-inventory`：`ROUTES=25`、`UNMOUNTED=0`、桌面臂 **0 笔**、浏览器臂正对照 **20 个**、`SPEC_URLS` 64 → **66**（就是 E56/E57 新增的字面量）。
  **方向要说清**：这次全部是"看见的代码变多"，其中**抹掉 `api.x()` 那种会把云端调用藏起来**，属于危险方向，不只是虚高。
- **牙齿**：给 `earlyReturn` 补了 **5 条合成样本**（此前一条都没有——这正是它连错两次没人发现的原因），
  其中一条专门是"同一行里有 URL 正则 + 别名式早退"的形状；四种判定：两种真早退要判出、两种"看着像守卫其实没挡住整页"（回调里包一行、别名只出现在依赖数组）不许判出。
  任一条判错就打 `UNRELIABLE` 并退出码 1。
- **全部门禁重量＝0**（共享遮蔽器一改动，凡建在它上面的判据都得重取）：`typecheck`／`test:unit`／`coverage`／`lint`／
  `check:purity`／`circular`／`size`（349 文件 0 越线）／`labels`（205 文件 0）／`dispatch`（6 文件 32 函数，形状 26/6 未变）／
  `citations`／`publish`／`seams`（9／6／真断言 **99** 未变）／`dead-surface`（面 294、闭包内 245、闭包外 10 在册）／`contrast`／`ui-source` **全绿**。
  两条基线一条没被顶开——说明这层修复只增加了可见代码，没有翻转任何既有判定。
- 探针（`probe-early.mjs`、`probe-brace.mjs`）**写在仓库根、已在本批删净**（`git status` 里 `probe` 命中 0），临时产物不留仓。

同日第八十批（**第十二段最后一格收口：`/comments/{id}/report` 的举报按钮有了按名界面判据 E58**，2026-10-09，只改 `e2e/desktop-http.spec.ts` 与文档，产品代码一行未动）

- 上一批写的「仍欠按名判据的一条」就是它。难点在**正对照要有数据**：`CommentRow` 里那颗键的渲染条件是 `onReport && !isOwner`，评论列表为空时屏幕上根本没有它（那时只有「还没有评论，来抢沙发吧。」）⇒ 桌面半那几个 `count 0` 全是空载。在册纪律：**缺席断言必须配"另一态它真该在场"**，而同页别的控件 substitute 不了——把评论区整块删掉时页面其余部分照样渲染，两条都白拿绿。
- **选形**：`e2e:desktop` 不起后端，浏览器臂原本只能验静态文案。这里用 `page.route` 就地应答三条通路（工程详情 GET、评论列表 GET、**举报 POST 本身**）。不选"用文案缺席做正控"，因为那种写法治不了恒真；夹具只活在测试层。**POST 也本地应答 ⇒ 一个字节都不出这台浏览器**：本机 :8000 上跑着他的 uvicorn、vite 把 `/api` 代理过去，所以这不是可选项而是前提（复核：`e58-project` 这类 id 不存在于他的库里，即便漏应答也只是 404 读）。
- **两头各见过一次红**（只证一头等于没牙）：M1 把 `DiscoverProjectDetailPage.tsx:53` 的整页早退改成 `false && localOnly` ⇒ 桌面半红在「公开剧本详情需要协作服务」那句，`1 failed / 1 passed`；M2 摘掉 `DiscoverCommentSection.tsx` 里 `onReport` 的接线 ⇒ 浏览器半红在 `getByRole("button", { name: "举报评论" })`，`1 failed / 1 passed`，**桌面半在 M2 下仍绿是预期的**（它断言的就是缺席）。两次都 byte-identical 还原（`diff -q` 对开工前快照），`false && localOnly` 与 `MUTATED` 残留各 **0**。
- **读数**：`pnpm e2e:desktop` **68 passed／0 skipped**（3.2m；66 → 68 就是 E58 两半，动了 e2e 规格所以整套重跑）· `gates` **0**（`test:unit` **774 passed + 1 skipped**、web 309 一字未动＝本批没写单测）· `check:http-inventory` **0**（`ROUTES=25`、`SPEC_URLS=66`、桌面 **0**／浏览器 **20**）· `cloud:callmap` 成对重取 **0** 且**逐档与 18:15 全等**（早退页 9、保守上界 16、早退档 12、端点级 29 = 6/23、时机档 28 = 18/2/8、对账 3 见过/12 没见过、第十三段 5 ⇒ 1/0/4）· `check:citations` **0**（已判定 250，本批两条新引用落笔后重量为 **252**）。
- **一处口径必须先说清，否则下一个人会把读数用反**：`SPEC_URLS=66` 没动**不等于**这条没增加覆盖。普查那第五腿只认 `goto` 的**引号字面量**，而这里用的是模板串 `` `/discover/projects/${E58_PROJECT}` `` ⇒ 扫不到（脚本自己的限度明写"报出来的'没测到'是上界"）。该路由本来就在 `CLOUD_ONLY_ROUTES` 里，所以分母不变是对的；**新增的是按名的点击判据，不是路由面**——要主张"覆盖变大了"不能拿 `SPEC_URLS` 当证据。
- **第十二段至此 12 条逐条都有界面级判据**：E56（账户三条）／E57（discover 四个 tab）／E58（评论举报），其余按四类机制分别由 E44（整页早退）、E48（藏控件）、E49（藏入口）、E50（调用者侧闸门）、E36 守着。剩下的都不是判据问题，是定档与授权：§6 那 12 条、`pnpm e2e` 那半（会写他的开发库）、真壳人工验收。

同日第八十一批（**把上面那句"逐条都有判据"从散文升成机检**，2026-10-09，新增 `scripts/desktop-cloud-judgements.json` + `cloud-callmap.mjs` 第十四段，产品代码一行未动）

- 动因是纪律本身：这句话今天只活在 README 与本节里，**改一次测试标题或删一条桌面半断言它就静默变假**，而明天读它的人（包括我自己）会当它是证据。散文承重的判据要抽成脚本——这一条今天第一次用在自己写的话上。
- 台账的**身份键用标题原文，不用 E 编号**（在册教训：编号会被重组，E20/E29 已成幽灵编号而断言仍在）。12 条端点 × 24 处证据引用，逐条走真实文件与剥注释后的真实标题文本。
- 匹配谓词 `sameEndpoint` 带**五条合成样本**，其中两条专门钉住"前缀不算覆盖"：`/comments` 挡不住 `/comments/${commentId}/report`、`/characters/{id}/relations` 挡不住 `…/relations/{relationId}`。放宽一档就会**让一条判据抵掉一整族**——这正是本项目已经付过一次钱的那类（整目录排除把分派口一起排掉）。
- 四条腿各挡一种失效，方向各不相同：台账读不出（缺失／解析失败／空）⇒ `UNRELIABLE` 退出 1；证据文件或标题找不到、同端点写两遍 ⇒ `FAIL` 点名；B 档多出一条没判据 ⇒ `FAIL` 点名；自测不成立 ⇒ `UNRELIABLE`。**台账多余只打印不判红**（端点掉出 B 档可能是量法退化，那种时候该问的是工具而不是裁台账）。
- **七次变异全部见过红**：① 删 E58 那条（无 LOADFACE）⇒ 只有写死的对照组红；② 同一条（有 LOADFACE）⇒ 覆盖腿点名 `/comments/${commentId}/report`；③ 删**另一条** `/tags/` ⇒ 点名 `/tags/`；④ 证据标题加一个字母 ⇒ 幽灵证据=1；⑤ 同端点写两遍 ⇒ 重复键=1；⑥ 谓词放宽成前缀互含 ⇒ 自测红（**而此时"没判据=0"照样打印**——只有合成样本抓住它，光看分母会被骗）；⑦ 台账文件改名 ⇒ 台账=0 条且 `UNRELIABLE`。每次还原 `diff -q` 对开工前快照，两个文件均 byte-identical。
- **本批新写的限度（是取到的，不是推的）**：覆盖腿只在给了 `LOADFACE` 时跑；没有它，删掉**任意一条**台账都不红，只有控制位那一条红。所以「gates 里的台账自洽」与「成对跑时的覆盖对账」是两件事，别把前者当后者用。
- 读数：`pnpm cloud:callmap` **0**（无 LOADFACE：台账 12／幽灵证据 0／重复键 0／对照通过，并明写"覆盖腿未跑"）· `LOADFACE=/tmp/b80-inv.txt pnpm cloud:callmap` **0**（B 档 12／没判据 0／多余 0，逐档与 18:15、18:36 三次全等）· `node --check` 通过 · `check:citations` **0**（README 那段落笔后重取）· `gates` **0**（见下面 18:48 复量行）。

同日第八十二批（**时机档「不明 8」逐条定性 + `check:dead-surface` 加第二档：多余的对外出口**，2026-10-09，改的是 `scripts/check-dead-surface.mjs` 与基线，产品代码一行未动）

- 定性结论（8 处，按机制分）：**5 处活在零外部读者的导出里**（`identityLink.ts` 的 `linkCreatorEmail`／`linkPlayerEmail`／`restoreIdentityFromEmail` ⇒ `identityApi.linkEmail`×2、`identityApi.resolve`、`userApi.updateProfile`、`userApi.resolve` 这些调用点**界面走不到**）——而 `UserContext.tsx` 里有同逻辑的第二份实现（`restoreFromEmail` 自己 `userApi.resolve` + 写两个身份键 + `reload`），这是本仓第三次撞上「一份逻辑抄两遍」；**1 处走得到但只在浏览器态**（`reportApi.create`，宿主是 discover 项目卡菜单那颗「举报」，桌面被 `/discover` 整页早退挡住）；**1 处是分派口的远端支**（`characterApi.export`，`characterExport.ts:57` 先判 `isLocal()`，桌面永不取它）；**1 处是装载类已被守**（`commentsApi.list`，E58/E44）。⇒ 这 8 条没有一条会在桌面真打出去，但它们**不是同一种"不会"**：前 5 条的成因是死出口，判死时该连同 `identityLink` 那三个导出一起摘，而不是只删端点。
- 于是这一档值得升成机检：**模块级死面看不见"活着的面包着死的口"**。`check:dead-surface` 加**第二档**（导出级，基线 `scripts/dead-export-baseline.json`）：实测 **24 条**多余导出口／闭包内 245 模块的 340 个具名值导出／参考池 424 文件。口径按在册纪律取**保守方向**——按名字数读者、保留字符串内容、参考池比导出面宽（含测试／`e2e/`／`scripts/`／admin／packages）⇒ **少判死不判死**；且这档说的是"对外暴露面宽了"，不是"函数死了"。
- 牙（三次各见过红，全部 byte-identical 还原）：新增一个没人 import 的导出 ⇒ `FAIL` 点名 `identityLink.ts :: b82ProbeUnused`（同时第一档仍 `OK 闭包外 10`）；从基线删一条在册项 ⇒ 点名那条；把 `refCountIn` 退化成恒有读者 ⇒ 合成自测 **2/4** 且对照组失败 ⇒ 退出码 1。另有一条基线不在的腿也实测过红（`UNRELIABLE —— 第二档基线不在`）。
- **本批踩到并自纠的一个工具坑（值得记住）**：取 T1 的牙时我写了 `io.open(文件,"w").write(io.open(文件).read()+…)`——**`"w"` 先截断，内层 `read()` 读到的是空文件**，于是 `identityLink.ts` 被写成空壳，门禁报「闭包外模块 12 个（新增 `shared/api/identity.ts`、`report.ts`）、导出面 335、对照组失败」。第一反应像"图判据对文件内容敏感"，插了临时诊断（`B82_DBG`，用完删净）复测同一改动 ⇒ `files=294 reach=245 idlIn=true`、第一档 `OK` ⇒ **异常是我的写入造的，不是判据造的**；同时也说明第一档的牙真会在依赖边消失时点名孤儿模块。每次写前都 `shutil.copy` 了快照并 `diff -q` 复核，产品文件零损失（与本轮开工前快照一字不差，第七十二批的 `CREATOR_ID_KEY` 六处引用都在）。教训：**变异脚本里读同一文件必须先读进变量再开 `"w"`**。
- 读数：`pnpm gates` **0**（仍是十五道，第二档长在 `check:dead-surface` 里、**没新增命令**；`test:unit` **774 passed + 1 skipped** 未变）· `check:citations` **0**（本段落笔后重取 **253**，新增那条 `characterExport.ts:57` 判定成立）· `node --check` 通过 · `git diff --check` 0 行 · `??` **52**（新增的 `scripts/dead-export-baseline.json`）⇒ **待显式 add 现为十一份**（九份 `.test.ts` ＋ 云端判据台账 ＋ 本档基线）。

同日第八十三批（**时机档「不明 8」里唯一界面真走得到的那条补成按名判据 `E59`**，2026-10-09，只改 `e2e/desktop-http.spec.ts` 与文档，产品代码一行未动）

- `reportApi.create` ⇒ `POST /report/` 的入口是卡片溢出菜单里那条 `role="menuitem"`「举报」（`DiscoverProjectsTab.tsx:150`）；挡着它的仍是**整页早退**（`DiscoverPage.tsx:49` 的 `if (isLocalOnlyDeployment())` → `CloudFeatureNotice feature="发现页"`），而普查的限度明写它不认"消费者级条件渲染"⇒ 这条一直留在保守上界里下不来。形状照 E58：浏览器臂必须**真有一张卡**才点得亮（列表空时屏幕上根本没有那颗 `aria-label="更多操作"`）。
- **只应答这条通路需要的两条**（发现列表 GET ＋ 举报 POST），这一页其它消费者（会话／健康检查）**不应答**、在浏览器臂里照常失败——本条不断言"浏览器臂零请求"，那不影响判据；"该页不该发请求"归 E14/E57 与桌面臂那一条。POST 本地应答 ⇒ 一个字节都不出这台机器（:8000 上跑着他的 uvicorn）。
- **两个新学到的 locator 形状**（都写成注释钉在用例里）：① `getByRole("button", { name: "更多操作" })` **不加 `exact` 会撞上两个元素**——卡片本身是 `<article role="button">`，它的可访问名由子树算出来、里面就含着那颗菜单键的「更多操作」；Playwright 的报错把第二支的 `aka getByRole(…, exact: true)` 直接递过来了，照抄即可。② 溢出键是 `opacity-0 group-hover:opacity-100`，Playwright 仍判它可见（可见性看 bounding box 与 `visibility`，不看 opacity），所以不需要 `force`。
- 牙（两头各一次）：M1 摘掉卡片菜单里那条「举报」⇒ 浏览器半红在 `menuitem` 不可见；M2 把 `DiscoverPage` 的早退改成 `false && …` ⇒ 桌面半红在「发现页需要协作服务」那句，`1 failed / 1 passed`（红的确实是该挡那一半）。两次都是**先读进变量再开写**（上一批那条截断坑的纠正生效）、还原后内容相等断言通过，`false && isLocalOnlyDeployment` 残留 **0**。
- **`SPEC_URLS` 这次动了：66 → 68**，且要说准为什么——它数的是**引号字面量的出现次数**，E59 两条臂各写了一次字面量地址（`/discover` 与 `/discover?storage=memory`，`?` 后被截断所以落回同一条路由）。**这不是"新覆盖了两条路由"**（两条都早已在 `CLEAN_ROUTES` 里）；与 E58 那次"读数 66 未变"合起来看：**同一个数字能被两种作者习惯推动，绝不能拿它当覆盖面证据**——覆盖面的证据是 `没有字面量导航到的路由=1 / 完全没证据=0` 那两档。
- 读数：`pnpm e2e:desktop` **70 passed／0 skipped**（3.3m；68→70＝E59 两半）· `check:http-inventory` **0**（`ROUTES=25`、桌面 **0**／浏览器 **20**、完全没证据 **0**）· `LOADFACE=… pnpm cloud:callmap` **0** 且逐档与 18:15／18:36／18:46 五次全等（早退页 9／上界 16／早退档 12／端点级 29=6/23／时机档 28=18/2/8／对账 3/12／第十三段 5⇒1/0/4／台账 12＝基线 12、没判据 0）· `pnpm gates` **0**（`test:unit` 774+1skip；第二档 24＝基线 24）· `check:citations` **0** · `git diff --check` 0 行 · 三引用 peel `1b9ca06`。
- 至此**时机档「不明 8」全部有归属**：1 条按名判据（本批）＋ 5 条死出口（第二档在册）＋ 1 条分派口远端支（`check:dispatch` 看着那个分派口）＋ 1 条已被 E58/E44 守。剩下的仍是定档与授权，不是工时。

同日第八十四批（**ADR-029 的「验收」四条同日第二次机械重量 + 一条"不造活"的决定**，2026-10-09，只改文档，代码一行未动）

- 先说**没做**的那件，因为它比做了的更值得记：`characterExport` 那条分派看起来还欠一条桌面点击判据，查下来**写不出诚实的形状**——「设定导出」按下去走 `saveBinaryFile`，注入桌面标记后那一支要 Tauri 的 save 对话框，chromium 里结构性开不出（E43 同一族）；改测「设定复制」那一半又正好撞进 clipboard 那格在册的不可判。两种写法都会变成"断言一个这台机器上量不到的东西"，所以**不写**，把它归到"只能由真壳人工验收关掉"那一格（ADR-029 补记第 4 条末尾）。
- ADR-029 四条验收的**本次读数**（已写进该文件的「补记 2026-10-09 19:17」）：① `grep -rn "/api/v1" apps/web/src`（排除 `dist`）＝ **11 处／5 个文件**，`pnpm check:apibase` 退出码 **0**（管道里取不到退出码，这次是把输出重定向到文件后单独取的），分类 测试 9／注释 1／基址定义 1／越界 **0** ⇒ **达成**；② `pnpm check:publish` 退出码 **0** 但自报残差 **4 条全部在册**，`ci.yml:69` 仍 `build:web && build:admin`、"desktop" 只在 `:8` 的分支过滤里、无 Rust/tauri job ⇒ **未达成，卡在决策**；③ `gates` **0** ＋ `e2e:desktop` **70 passed／0 skipped**（16:02 那次是 62），浏览器臂 `pnpm e2e` **仍未跑** ⇒ **只对桌面臂达成**；④ `backend/` 仍在，界面级判据区间从 **E17–E55 变成 E17–E59**，云端面第十二段 12 条＋第十三/十四段＋时机档「不明 8」全部有归属且"有归属"这句话本身已机检 ⇒ **未达成，但第二半的证据强度换了档**。
- **一条口径警告写在补记结尾**：**没有一条验收因为"加了判据"而被视作达成**；两条未达成的都卡在决定与授权。谁把"证据变多"读成"快收尾了"，要连着看第 2 与第 4 条。
- 读数：本轮**未跑** `gates`／`e2e`（只改文档），沿用 19:12／19:13 那两条；`check:citations` 落笔后重取（见下面复量行）· `git diff --check` 0 行 · 三引用 peel `1b9ca06`。
- 至此**非决策矿脉是真的见底了**：还能做的只剩三类——(a) 你定 §6 那 12 条之一（我可以直接把选定那条落进 ADR 与门禁），(b) 授权 `pnpm e2e`（会写你的开发库）或真壳人工验收（关掉④的两格），(c) 我把已有判据继续做**结构整理**（不新增能力，收益递减）。

同日第八十五批（**待决 ⑩ 的地板那一档：第二组分支在发射时丢掉，现在会说出口**，2026-10-09，产品代码改动＝`packages/axs/src/print.ts` ＋ `apps/web/src/features/studio/cut/MiniAxsEditor.tsx`）

- 为什么这一档**不算替你定档**：三种修法（并进第一组＝改叙事语义／扩语法＝动语法冻结面／发射侧给诊断）里前两种都在清单上等人选，而"把已经发生的丢失说出口"不改变任何语义、也不关掉那条待决——它和已批准的 `[intro] 不生效也不报错`、演出指令取值那两条同形，是**静默失效族的地板**。
- 实现：`printAxs(doc, { roles?, diagnostics? })` 多一个可选出参，一拍有 >1 组分支时 push 一条 `warning`（含拍名、几组、被丢掉几个选项、以及这一拍在输出文本里的行号），**输出文本逐字不变**；行号由打印过程中累计（`pushLine` 数换行），所以编辑界面能钉在正确那一拍。UI 侧 `MiniAxsEditor` 把这一趟打印收下的诊断与解析诊断**合并后**一起显示——解析看不见这件事（文本里本来就只剩一组）。
- 判据 3 条（`packages/axs/src/roundtrip.test.ts`）：一组不响／两组必响且文本不变／多拍文档行号落在第二拍。**旧的那条特征化断言保留不改**（它是"这条曾经会丢"的凭据；定档之后**改写**而不是删掉）。`test:unit` 由 **774 → 777 passed + 1 skipped**（axs 94→97）。
- 牙（两头）：删掉那条 `emit` ⇒ **2 failed / 14 passed**（"两组分支：一条 warning" 与 "行号要落在…" 红，"一组不响"仍绿＝正确分工）；让发射器顺手把第二组也印出来 ⇒ **2 failed**（旧特征化断言 ＋ "带诊断的输出与不带的逐字相同"）。两次都还原 byte-identical。
- **一条如实登记的缺口**：`MiniAxsEditor` 那行合并显示今天**只有发射侧单测撑着，没有界面级判据**——谁把它删掉，`gates` 与 `e2e:desktop` 都不会响（与 `navigator.clipboard` 那格同例，不占 §6 共享定档号）。要补得先在编排台演出层造出"一拍两组分支"的真流程，属下一条 e2e 工单。
- 读数（动了共享文本层＋一个界面组件，所以全套重取）：`pnpm typecheck` **0** · `pnpm gates` **0**（十五道；`[file-size]` 349／0——`print.ts` 315 行、`MiniAxsEditor.tsx` 205 行都在限内）· **`pnpm e2e:desktop` 70 passed／0 skipped**（3.3m，改过界面组件必须重跑）· `check:citations` **0**（已判定 258）· `git diff --check` 0 行 · 三引用 peel `1b9ca06`。ADR-016 已加「补记 2026-10-09 19:31」，工单 #91 的说明同步改口（地板已交付，语义修法仍开着）。

同日第八十六批（**上一批登记的那行缺口当场关掉：`E60` 守住"发射侧诊断在界面上看得见"**，2026-10-09，只加 `e2e/desktop-http.spec.ts:2116` 与文档，产品代码一行未动）

- 判据对象要说准：**不是** warning 文案对不对（那是 `roundtrip.test.ts` 三条单测的活），而是**"发射器报的东西用户看得见"这一截接线**——上一批自己写的"删掉那行合并显示没人报警"就是本条存在的理由。
- 形状：建剧本 → 演出 → 「+ 分支」，先断**一组不响**（`toHaveCount(0)`，防噪音），再点第二次断那句「读不回来」可见；同屏正控用「AXS 片段」那一栏标题（证明诊断所在的那块真渲染了）；链尾照例 `hits === []`。
- 牙（两头，都还原 byte-identical）：① 把 `MiniAxsEditor` 的合并退回成只用解析诊断 ⇒ E60 红在 `getByText('读不回来')`；② 删掉发射侧那条 `emit` ⇒ 同样红。第二种是刻意的——它证明这条界面判据**真的依赖**上一批那个出参，而不是碰巧被别处的文案满足。
- 读数（动了 e2e 规格 ⇒ 整套重跑）：`pnpm e2e:desktop` **71 passed／0 skipped**（19:37，3.3m）· `pnpm gates` **0**（十五道，`test:unit` 777+1skip 未动＝本批没写单测）· `check:http-inventory` **0**：`SPEC_URLS` **68 → 69**（正是上一批立的规则：它数引号字面量出现次数，E60 多一次 `goto` 就 +1，与覆盖面无关）· `LOADFACE=/tmp/b86-inv.txt pnpm cloud:callmap` **0**（台账 12＝B 档 12、没判据 0、幽灵证据 0）· `git diff --check` 0 行 · `??` 仍 **52**（无新文件）· 三引用 peel `1b9ca06`。
- 纪律一条：**登记缺口就要在能关它的时候当场关掉**，否则"已如实登记"会变成一条长期挂着的美化说法。这轮的对照是 `navigator.clipboard` 那格——那一条是真不可判（本机无壳），所以它继续挂着是对的。

同日第八十七批（**Writer 主通路接上发射侧诊断，并给「保存把丢失固化进存档」那一刻加一条常驻说明：E61**，2026-10-09，动 `packages/axs` → `editor-core` → `apps/web` 三层 ＋ `e2e`）

- 上一批那条"不需要定档的下一步"本批直接做掉了。`draftToAxs` 的返回类型是 `string`，所以出参沿用 `diagnostics?: AxsDiagnostic[]` 这一支（与 `printAxs` 同形，仓库里已有先例），参数可选 ⇒ 既有调用方一字未改。链路：`projectToAxs(nodes, edges, scenes, roles, diagnostics?)` → `draftToAxs(draft, roles, diagnostics?)` → `printAxs(doc, {roles, diagnostics})`。
- 界面侧落在 `useProjectEditor`：新增 `projectionNotice` 状态 ＋ `ProjectEditorPage` 顶部一条 `role="status"` 常驻条。为什么不是 toast——**toast 会自己消失，而这条说的是存档里已经少了内容**。
- 两条腿的成立理由不同：**装载**那一腿只在"屏幕上显示的就是这次投影的结果"时报；**保存**那一腿无条件报，因为 `persistAxsProjection` 会把投影写回 `axs_source`，丢失就在这一刻进存档。
- 牙（`pnpm e2e:desktop -g E61`，变异后都还原 byte-identical）：删掉 `print.ts` 那条 `emit` ⇒ **E61 红**（`expect(locator).toBeVisible() failed`）——界面判据确实吃到了最上游那个出参。但**另两次变异都没红**：只删保存腿的赋值 ⇒ 仍绿；只删装载腿的赋值 ⇒ 仍绿。当时我把这读成"两条腿冗余"，第八十八批纠正了这条读法（见下）。
- 单测：给 `draftToAxs` 的出参加 2 条 ⇒ `packages/editor-core/src/projection/projection.test.ts` **32 passed**。
- **这批欠了一笔账，被下一批的门禁抓回来**：`useProjectEditor.ts` 因此从 ≤1081 长到 1109，`check:size`（G1 棘轮：只准变短）在第八十八批第一次 `pnpm gates` 里 **FAIL／EXIT=1**。取退出码时又踩到自己登记过的那个坑——包装命令最后一段是 `tail`，通知里的"exit code 0"是 `tail` 的，不是 gates 的。

同日第八十八批（**偿还那条棘轮：把装载档的判据抽成可单测的纯函数，顺手量出它漏掉的一档**，2026-10-09，动 `apps/web` 三个文件 ＋ `file-size-baseline.json`）

- 棘轮的处置写在它自己的报错里：**"按域外提成协作模块，不要在文件内继续堆"**。所以没去放宽 baseline，而是搬纯逻辑出去：
  - `projectWithNotice(nodes, edges, scenes, roles, storedSource)` ⇒ 外提到 `features/writer/lib/projection.ts`，hook 里那句散文判据变成可测函数。
  - `kernelEdgeFromRf` / `kernelNodeFromRf` ⇒ 外提到 `hooks/editorProjection.ts`（那个文件的头注释本就写明它的角色：从 hook 搬出来、好让用例钉得住的纯函数）。`sortOrder` 原先就地闭包 `rfNodes.length`，改成显式入参——`onDrop` 的依赖数组里本来就写着 `rfNodes.length`，语义一字未变。
- **抽的过程里量出一个真缺陷（已修）**：装载档的条件写的是 `!p.axs_source`，它把两种状态当成一种——(a) 存档里是 Writer 手写文本，屏幕上显示的是它而不是投影 ⇒ 报"投影会丢"确实是误导，该静默；(b) 存档里那份文本**就是上一次投影写回去的**（保存过之后再打开必然如此）⇒ 屏幕上少的正是投影丢掉的那一组，此时静默等于没说。修法是把判据写成它本来想表达的那句「屏幕上是不是投影」：`!storedSource || storedSource === text`。
- 判据：`apps/web/src/features/writer/lib/projection.test.ts` 加 4 条（无存档文本要说／存档文本＝投影仍要说／手写文本不报且文本一字不改／投影本身没丢则一律静默）。成对变异各打红**不同的一条**：去掉等值那半 ⇒「重新打开仍要说」红；把判据整体放开 ⇒「手写文本不报」红；两次都还原 `RESTORED_IDENTICAL=true`。这同时**纠正第八十七批那条"冗余"读法**：两条腿不是冗余，是各守一种存档状态；当时只删一处仍绿，是因为我只测了其中一种状态。
- baseline 收紧 `1081 → 1080`；跑 `--update` 前先量过安全性：14 条 entry 全部 `>400` 且当轮 0 违规 ⇒ 这次写回只可能收紧不可能放宽（`parse.ts` / `document.ts` 两行因已降到 400 以下被脚本自己移出，正是它自述的"拆完一段就把那行删掉"）。
- 行数读数：`useProjectEditor.ts` **1079**（`wc -l` 口径；脚本报 1080，差一在末行换行的数法）。

同日第八十九批（**E48 那次一现的红：归因到"两臂共用一个计数器"，并把桌面臂的监听器自己钉住**，2026-10-09，只改 `e2e/desktop-http.spec.ts`）

- 现象：第八十八批那次全量 `pnpm e2e:desktop` = **71 passed／1 failed**，红在 E48 的 `hits === []`，收到的请求是 `/api/v1/editor/projects/user/creator-<uuid>`。**单跑 `-g E48` 两次都绿**，随后整套复跑 **72 passed／0 failed**——一现、不可复现。
- 归因（静态证据链，不是猜）：
  - `new HttpStorageProvider` 全仓**只有一个构造点**——`apps/web/src/shared/storage/index.ts:163`，即分派的第三支，进它的前提是 `isTauriEnvironment()` 为假。
  - 页面渲染用的闸门 `isLocalOnlyDeployment()`（`apps/web/src/shared/lib/deployment.ts:13`）就是 `isTauriEnvironment()` 的别名（`apps/web/src/shared/storage/tauriSqlBackend.ts:33`）；E48 桌面臂那几个 `toHaveCount(0)` 与那条 link 的正控都过了 ⇒ 同一时刻该谓词为真 ⇒ **桌面那一页自己构造不出 HTTP Provider**。
  - 同一个 URL 形状正是 E48 **浏览器臂**该发的（`tab === "my"` ⇒ `author_id: getCreatorId()`），而两臂原本共用一个 `hits` 数组、靠手写 `hits.length = 0` 切窗口。`page.on("request")` 的事件经 CDP 异步投递，负载高时上一页已发出的请求可能在我重置之后才送达 ⇒ **计数窗口串味**，与观测完全一致。
- 修法（test-only，判据不降级）：浏览器臂的监听器在切到桌面臂之前 `page.off` **摘掉**，桌面臂挂**自己的**数组。摘掉而不是清零，是因为清零挡不住"已经上路但还没送达"的那一条。
- 顺手补了这条判据**自己的正控**：桌面臂最后发一条**不存在的** `GET /api/v1/e48-sentinel`（vite 上必为 404、无副作用），断言它被记到。少了这一条，`toEqual([])` 有可能绿在"根本没人挂监听器"上——那与"桌面没发请求"是两回事。最终断言改为只看**除哨兵之外**的条目。
- 口径影响要如实说：`/api/v1/e48-sentinel` 是**故意不存在**的路径，它会进 `check:http-inventory` 的 `SPEC_URLS` 字面量计数（那条口径数的是"规格里出现的 `/api/v1` 字面量次数"，不是覆盖面），所以 `SPEC_URLS` 会 +1 而**没有任何路由获得新证据**；它也不对应任何真实端点，`cloud:callmap` 的台账里不该出现它。
- 仍**未闭环**的一点：这次归因是"最符合观测的机制"，不是复现出来的因果。若它再红一次，正控会把方向直接指出来（哨兵在／请求来自哪一臂），不必再从 72 条里找。登记在 §6 待决之外的一条观察（不占共享定档号）。
- 顺手把 §6 那条"归一还是判死"的**证据补齐**（只补证据，不定档）：`identityLink.restoreIdentityFromEmail`（`apps/web/src/shared/lib/identityLink.ts:21`）与界面真在用的 `UserContext.restoreFromEmail`（`apps/web/src/app/providers/UserContext.tsx:73`，读者是 `apps/web/src/features/profile/pages/ProfilePage.tsx:163`）**不是同一份逻辑抄两遍**，逐函数体比过，差三件：
  - 查找回退深度：死的这份是**两级**（`userApi.resolve` 没命中再走 `identityApi.resolve` 的 links）；活的这份**只有第一级**，没有 profile 行就直接 `throw new Error("not found")`。⇒ 一个"有身份链接但没有 profile 行"的邮箱，今天从界面上恢复不了。
  - 失败形状：死的返回数组（可为空），活的抛错——两者对调用方是不同的契约。
  - 副作用：活的会 `setProfile` ＋ `window.location.reload()`，死的只写 `localStorage` 并返回链接。
  - 另外 `linkPlayerEmail` 只是 `linkCreatorEmail` 的别名（`identityLink.ts:17`），这一对才是"同一件事写两遍"。
  这条属 `S13-3 判死口径` 的弹药（身份/邮箱这条链整个挂在 `userApi`/`identityApi` 这两个云端点族上，桌面态要不要保留"第二级回退"是产品判断，不由我代拍）。

同日第九十批（**桌面态的云端回落从"日志里的猜测"变成程序可读的事实**，2026-10-09，动 `apps/web/src/shared/storage/index.ts` ＋ 它的单测 ＋ `e2e`，另含第八十七批那次"删一处仍绿"的纠正）

- 为什么要做这一条：上一批那条 E48 的红**只能静态归因**，因为"这一页到底挂了哪一支 Provider"在运行时不是一个可读取的事实。整场桌面化重构最忌讳的失效形状就是"不报错，只是存到别处去了"，所以把它做成事实，而不是下次再靠人读代码。
- 做法：`StorageProviderBranch = "memory" | "shell" | "cloud"` ＋ `getStorageProviderBranch()`；三支各在**进入自己分支的第一行**登记（壳支特意在 `await TauriAssetStore.create()` **之前**登记——真壳里建素材仓或播种任一步抛错时，"它确实试过壳支"这件事仍然留下，否则读到的还是 `null`，等于什么都不知道）。DEV 下同时写 `window.__AXIFORGE_PROVIDER_BRANCH__`，生产构建里 `import.meta.env.DEV` 被静态替换成 `false`，那个句柄连字面量都不留（与 `?storage=memory` 同一套既有纪律）。
- 判据两层：`index.test.ts` 一条用例走尽三支、各断一次支名（5 passed）；`E48` 桌面臂加**空载正控** `expect(branch).toBe("memory")`，红消息里同时打出支名——这条正控把"零云端请求"与"这页根本没挂上本地库、所以没人发请求"分开，后者原本会让那条断言**空着绿过去**。
- 牙（成对，同一条命令里跑完并断言文件还原 byte-identical）：把本地库支短路成 `false && import.meta.env.DEV` ⇒ `E48` **红在"Provider 必须走本地库支"**（1 failed）；还原 ⇒ **1 passed**，`BYTE_IDENTICAL=true`。这正是过去几批一直缺的那类证据：**不是"改了没坏"，而是"改坏了会红在该红的那一行"**。
- 顺带纠正第八十七批留在文档里的一条错读法（"两条腿冗余"）：见 §4 第八十八批那条——同一句话在两个时刻各写一次时，判冗余要先列出各自成立的存档状态，否则"只删一处仍绿"读出来的是我自己的测试面不足。

同日第九十一批（**普查自己把"零请求"的两副面孔分开：12 路由证明挂在本地库支，13 路由如实登记为"没问过工厂"**，2026-10-09，只动 `scripts/desktop-http-inventory.mjs`）

- 上一批把支名做成可读事实之后，这条腿立刻能写：桌面臂每条路由读完 `__AXIFORGE_PROVIDER_BRANCH__`，**问过工厂却没挂在 `memory`** ⇒ `REGRESSION`；两臂全都读不到支名 ⇒ `UNRELIABLE`（判据空转）；浏览器臂的支名同时当这条腿的**正控**（应为 `cloud`）。
- **我第一版的判据被自己的第一次运行当场证伪**（在册教训第 N 次应验）：我写成"`!== memory` 就是空载"，第一次跑就红了 13 条。事实是它们读出 `未登记`——**这些页面从来没问过工厂**：`/docs`、`/profile`、`/discover/*`、`/studio/dashboard` 这类路由的桌面缺席由整页早退与藏控件挡着，不由 Provider 支名挡着。过宽的 fail-closed 会把合法输入崩掉，这里改成分两档：**回落 = 缺陷，没问过 = 覆盖面事实**（打印 `BRANCH_EVIDENCE=12/25` 与 `没问过工厂的路由=13`，都不判红）。
- 真实读数（20:38）：`DESKTOP_BRANCH=未登记×13 ／ memory×12`、`BROWSER_BRANCH=未登记×24 ／ cloud×1`（浏览器臂绝大多数页面走的是**绕过分派的 `shared/api` 直连**，正是 `cloud:callmap`「绕过面」那一族的老账；只有 1 条真问了工厂）、`DESKTOP_UNIQUE=0`、`ROUTES=25`、`UNMOUNTED=0`、退出码 **0**。
- 成对变异（同一条命令内跑完并断言脚本还原 byte-identical）：把普查配置退回"只给标记、不给本地库" ⇒ 12 条全变 `shell`、`BRANCH_EVIDENCE=0/25`、退出码 **1** 并点名那 12 条。**这条把脚本头那句猜测变成了测量**：脚本 12 行注释早就写着"只注入标记时那个 0 是空载伪装成干净"，但直到今天它只是**推断**——现在它红了，且红在该红的那一条上。也正因为我上一批把登记放在**第一个 await 之前**，壳支随后必然失败也仍能留下 `shell` 这个事实。
- 限度（写在这里，别当成已覆盖）：`BRANCH_EVIDENCE` 只有 12/25。剩下 13 条的"零请求"目前由 `check:http-inventory` 的另两条腿（未挂载 ⇒ `UNRELIABLE`、两臂差分）与 `cloud:callmap` 的判据台账看着；要给它们也加上"这一页确实没走云端"的直接证据，得换一个探针（比如统计 `fetch` 调用而非 `/api/v1` 字面量），那是下一条的活。

同日第九十二批（**普查补上"跨源请求"这一档：桌面臂 0，且这条腿被见过红**，2026-10-09，只动 `scripts/desktop-http-inventory.mjs`）

- 动机是上一批留下的一个具体盲区：整套判据都在看 `/api/v1` 前缀，**绕开这个前缀的出站形状完全不可见**（绝对 URL、别的主机、本机模型端口——`S13-4b` 那条 OLLAMA 欠账就属于这一族）。现在两臂都按 `new URL(req.url()).host` 与 `BASE` 的 host 比，不同源就记 `host+pathname`。
- 读数（20:45）：`EXTERNAL_DESKTOP=0 ／ EXTERNAL_BROWSER=0`，`check:http-inventory` 退出码 **0**（其余档不变：`ROUTES=25`／`DESKTOP_UNIQUE=0`／`BRANCH_EVIDENCE=12/25`／`UNMOUNTED=0`）。
- 牙（成对）：把同源定义改成一个错主机 ⇒ 桌面臂立刻 `EXTERNAL_DESKTOP=379`、退出码 **1** 并点名（第一批名字就是 `localhost:5174/@fs/...`——vite 的模块与 `/@fs` 资源请求全都算"跨源"，**这条腿的成败完全押在 `new URL(BASE).host` 这一个表达式上**，这是它的限度，也是它为什么值得存在）；还原 ⇒ 0／0、退出码 0、脚本 `BYTE_IDENTICAL=true`。
- 本轮两次自伤都在工具层，登记以免下轮重犯：① 用 `Edit` 整段插入时把 `## 5.` 标题落到了错的节里，靠"标题唯一＋整行精确匹配＋前后行内容"三条断言的修复脚本搬回（第 1982 行），事后 `check:citations` 0／`git diff --check` 0 行；② `node -e '…'` 的单引号包体里嵌了单引号字符串，被 shell 截断成 `SyntaxError`＋`command not found`（**文件未被写入**，因为脚本在第一步就解析失败）——变异类脚本一律落成 `/tmp/*.cjs` 文件再跑。

同日第九十三批（**收束批：把"待显式 add 十一份"这个错口径当场纠正**，2026-10-09，只读审计＋本节文档，产品代码一行未动）

- 触发点：我在核对 §6 那条"待显式 add 仍十一份（九份 `.test.ts` ＋ 两份基线/台账）"时把它与实树机械对了一遍。读数：`git status --porcelain | grep -c '^??'` ＝ **52**，其中未跟踪的 `.test.ts` ＝ **23**（`apps/web/src/shared/lib` 9 ／ `apps/web/src/shared/storage` 7 ／ `packages/core/src` 4 ／ `packages/axs/src` 2 ／ `packages/editor-core/src` 1）。**所以"十一份"是错的**，它是我从第七十几批一路沿用下来的旧数，每批只加不减地挂在文档里——正是我自己登记过的那类腐烂。
- 更要紧的一类此前根本没被点名：**门禁脚本与它们的基线自己也在未跟踪里**。逐条看到的名：`scripts/check-apibase-literals.mjs`／`check-dead-surface.mjs`／`check-desktop-seams.mjs`／`check-doc-citations.mjs`／`check-publish-target.mjs`／`cloud-callmap.mjs`／`source-graph.mjs`、`scripts/ports.json`、`scripts/ports.d.mts`、基线 `dead-export-baseline.json`／`dead-surface-baseline.json`／`desktop-seam-baseline.json`／`doc-citation-baseline.json`／`publish-target-baseline.json`／`desktop-cloud-judgements.json`。**后果说准**：干净 clone 出来的机器（含 CI）不是"少几条测试"，而是 `pnpm gates` 整条链跑不起来——链上多个命令的可执行文件压根不在树里。
- 生产模块未跟踪的也有几份（`packages/axs/src/condition.ts`／`edges.ts`／`instructions.ts`、`packages/editor-core/src/axspImport` 侧的 `axsImport.ts`、`apps/web/src/shared/storage/shellSmokeGate.ts`、`apps/web/src/features/studio/components/ChoiceOptionsEditor.tsx`）＋ `testdata/axs-draft/unknown-speaker.json` 与 `testdata/conditions/` 整个目录。
- 归属仍**不可机械判定**（在册限度不变）：`Clearance/`、`docs/archive/`、`docs/README.md`、`backend/tests/test_condition_*.py` ×3 这些不是我这场的产物；`grep --include` 在 zsh 里静默失败、mtime 不足以区分 ⇒ **提交时必须由人点名，禁止 `git add -A`／`git add .`**（§7 原话）。
- 一条我认为该做但**不做**的：把 `check:http-inventory` 的跨源腿接进 `gates` 链。否它的理由不是省事——那条普查要起着 vite dev server 才能跑，而链的既有口径是"不含 build、不开服务"（在册设计决定，见 §5 与 `ADR-029` 的"链外普查"）。要接就得先把"谁来起服务"定下来，那是新的口径决定，不由我顺手拍掉。这条腿现在的形态是：链外命令，红过、也绿过，读数带时刻。
- 剩余的两条不需要定档的矿脉（下一轮直接可接）：① `BRANCH_EVIDENCE` 只有 **12/25**，那 13 条"没问过工厂"的路由需要一个新探针（数 `fetch` 而不是数 `/api/v1` 字面量）才能把分母做实；② `identityLink` 那三个死出口对 `UserContext.restoreFromEmail` 的**功能欠账**（第二级 `identityApi.resolve` 回退）证据已补齐，但"归一还是判死"属 `S13-3`。

**本会话收束（2026-10-09 20:52，会话在 60 回合处停车；树是干净可接手状态）**

- 恢复点现测：`HEAD == origin/desktop == desktop-handoff-20260929^{}` ＝ **`1b9ca06`**；未提交、未推送、未动 tag（按 §7）；stash **0**；`.e2e-lock` 不在；`git diff --check` **0 行**；`MUTATED`／`false &&` 探针残留 **0**；`??` **52**。
  **（刷新 2026-10-10 00:52，取代上一行的取数时刻，状态未变）**：`??` **52**、`git diff --check` **0 行**、stash **0**、锁不在、三引用 peel 仍 `1b9ca06`；本会话之后的改动只在 `scripts/desktop-http-inventory.mjs` 与文档 ⇒ `pnpm gates` 重取 **0**（`[seams]` 9／6／真断言 102、`[dead-surface]` 一档 10 在册／二档 344 出口、零读者 24＝基线、`[file-size]` 0 越线）、`check:http-inventory` **0**（`DATA_DESKTOP=0`／`DATA_BROWSER=20`）。
  **（再刷新 00:59，第九十五批末）**：新增 `pnpm check:tracked`（**不进链**，见 §4 第九十五批的理由）；`pnpm gates` 重取 **0**（十五道未变；`[file-size]` 349／0、`[doc-citations]` 已判定 **273**／不存在 0）· `pnpm check:tracked` **退出码 1**，面 19 个文件里 **10 个未跟踪**——这十条就是"让 `gates` 在干净 clone 上跑得起来"所需 `git add` 的**完整清单**，比 §6 之前那句"待显式 add 十一份"准确得多（那条已被第九十三批作废）。`??` 现测 53、`git diff --check` 0 行、stash 0、锁不在。
  **（01:10 收口：`check:tracked` 加了第三面之后，"该 add 什么"有准数了）** —— **16 个文件**：链面 10（`check-dead-surface`／`check-desktop-seams`／`check-doc-citations`／`check-publish-target` 四个脚本 ＋ `source-graph.mjs` ＋ 5 份基线）⊕ 编译面 6（`packages/axs/src/{condition,edges,instructions}.ts`、`packages/editor-core/src/axsImport.ts`、`ChoiceOptionsEditor.tsx`、`scripts/ports.json`，两面实测不相交）。**只 add 链面 10 个还不够**：编译面那 6 个不进去，干净 clone 上 `tsc -b`／`vite build`／两个 Playwright config 都起不来。读数：`pnpm check:tracked` 退出码 **1**（两条 `REGRESSION` 并排打印）、`pnpm gates` **0**、`git diff --check` 0 行、HEAD 仍 `1b9ca06`。
    **（01:15 更正上面那个 16：加了第四面之后是 17）** —— 本仓内需 add **17 个文件**＝链面 10 ⊕ 编译面 6 ⊕ 数据面 2，`scripts/ports.json` 在编译面与数据面各出现一次故去重。另外三面之外查出两条**不由提交解决**的事实，已在 §4 第九十五批末尾两条登记（那一批把"链面／编译面／数据面／仓外依赖"四面一次交付，故没有单独的"九十六批"标题——这句先前写错了）：① `backend/eval/calibrate.py`、`backend/sidecar/calibration.py`、`backend/sidecar/server.py` 三处**已跟踪后端代码按路径引用仓外未纳管目录 `Clearance/`** ⇒ 后端今天必须有隔壁那个目录才跑得起来（`S13-6`／`backend/` 退场决策的新证据）；② `apps/desktop/src-tauri/gen/schemas/desktop-schema.json` 是 Tauri 生成物，不在树里是正确状态，第四面用 `git check-ignore` 把它挡掉。此时 `check:tracked` 的退出码 1 打印四条 `REGRESSION`（链／编译／本仓数据／仓外依赖）。
- **复量 2026-10-10 01:21（第九十八批末；当前恢复点，取代 01:15／01:10／00:59 那几条）**：`pnpm gates` **0**（十五道；`e2e` 之外全套）· `pnpm e2e:desktop` **72 passed／0 failed**（01:21，3.3m——动了产品代码所以整套重跑，不沿用）· `pnpm check:seams` **0**（9／6／真断言合计 102／基线在册 3）· `pnpm check:tracked` **1**（四条 `REGRESSION` 并排，需 add 的点名清单 17 项）· `check:citations` **0**（落笔时 **274**，本节写完再取是 **275**——这一段每多一条 `路径:行号` 引用它自己就 +1，所以引用这个数必须带时刻）· `git diff --check` **0 行** · stash **0** · `.e2e-lock` 不在 · `MUTATED`／探针残留 **0** · 三引用 peel 仍 **`1b9ca06`**（未提交、未推送、未动 tag，按 §7）· `??` **53**（`check-chain-tracked.mjs` 是第 53 项）。
  **行数棘轮现状**：`useProjectEditor.ts` wc **1074**，`check-file-size.mjs --update` 已把它那一行从对 HEAD 的 1081 收到 **1075**（同一次 `--update` 顺手把别的超限文件按现值收紧，跑前照例量过安全前提：0 违规＋全部 entry `>400` ⇒ 只可能收紧）。**这条还账方式的差别值得记**：上一批是搬域外提，这一批是清自己写下的冗余（复用同一函数里已经算好的 `scenes`、把调用收成一行）——棘轮的红不一定都靠"再拆一个模块"解，先看看是不是自己刚加的重复。
  **上一版登记的"仍未闭环的一条"已在第九十九批当场关掉**：那一行 `setProjectionNotice(null)` 现在有界面级判据 **E62**（`e2e/desktop-http.spec.ts:2228`），并且**见过它的红**——摘掉那一行 ⇒ 断言停在 `Expected: 0 / Received: 1`。配方（为什么不能写成"删空 Beat"）留在 §4 第九十八批最后两条，别再照旧的写。
- **复量 2026-10-10 01:33（第九十九批末；当前恢复点，取代 01:21／01:15／01:10／00:59 那几条）**：`pnpm gates` **0**（十五道；`[file-size]` 349／0、`[desktop-seams]` 9／6／真断言 **102**／基线 3、`[dead-surface]` 一档 10 在册／二档 零读者 24＝基线、`[doc-citations]` 已判定 **276**／不存在 0）· `pnpm e2e:desktop` **73 passed／0 failed**（01:31，3.3m，桌面基线 72→**73**；动了规格所以整套重跑）· `pnpm check:tracked` **1**（四条 `REGRESSION` 并排，需 add 的点名清单 **17** 项）· 变异一次并还原：`cmp -s` **BYTE_IDENTICAL=true** · `git diff --check` **0 行** · stash **0** · `.e2e-lock` 不在 · `??` **53**（无新文件）· 三引用 peel 仍 **`1b9ca06`**（未提交、未推送、未动 tag，按 §7）。
- 在飞的活：无。九十二批的跨源腿与九十三批的审计都已跑完取数，没有半成品留在树里。
- **复量 2026-10-10 01:54（第一百批末；已被 02:04 取代）**：`pnpm gates` **0**（十五道；web 单测 **318 passed＋1 skipped**、editor-core **192**、`[file-size]` 349／0 且棘轮已 `--update` 收到 `useProjectEditor.ts` **1073**、`[desktop-seams]` 9／6／真断言 **102**、`[doc-citations]` 已判定 **280**／不存在 0）· `pnpm e2e:desktop` **74 passed／0 failed**（01:52，3.4m）· `pnpm check:http-inventory` **0**（`SPEC_URLS` **72**、`DATA_DESKTOP=0／DATA_BROWSER=20`）· `pnpm check:tracked` **1**（四条 `REGRESSION`，需 add **17** 个文件——这一条要等人授权才解得开）· `cloud:callmap`（带 `LOADFACE`）**0**（台账 12／没判据 0／幽灵 0）· `git diff --check` **0 行** · stash **0** · `.e2e-lock` 不在 · 探针残留 **0**（两次变异脚本都 `cmp -s` 还原 `BYTE_IDENTICAL=true`）· `??` **53** · 三引用 peel 仍 **`1b9ca06`**（未提交、未推送、未动 tag，按 §7）。
- **复量 2026-10-10 02:04（第一百零一批末；已被 02:22 取代）**：`pnpm gates` **0**（十五道；web 单测 **321 passed＋1 skipped**＝27 条 `projection.test.ts` 里含新三条 `noticeFor`、editor-core 192）· `pnpm e2e:desktop` **74 passed／0 failed**（02:04）· `check:citations` **0**（已判定 **284**）· `check:seams` 9／6／真断言 **102**／基线 3 · `check:size` 0 越线且棘轮收到 **1072** · `check:http-inventory` 与 `cloud:callmap` 沿用 01:52 那组（**本批未动普查脚本、未动云端面**，产品改动只有一条横幅的字符串组装与三处调用点）· `check:tracked` **1**（需 add **17** 个文件，等授权）· `git diff --check` **0 行** · stash **0** · 锁不在 · 探针残留 **0**（`cmp -s` 两次变异都还原 `BYTE_IDENTICAL=true`）· `??` **53** · 三引用 peel 仍 **`1b9ca06`**。

- **给下一次提交的建议（这是当前最该做的一个动作，且需要你点头）**：先按 `pnpm check:tracked` **现跑输出**逐条点名 `git add`（03:09 实跑：`待 add：` 共 **43 行**＝链面 10 ⊕ 编译面 8 ⊕ 本仓数据面 2 ⊕ 判据面未跟踪测试文件 24；此前各处写过的 17／41／"至少 40 条／23 份 `.test.ts`"都是旧读数，别再照抄——命令会一条条列出来），**不要**顺手 `Clearance/`、`docs/archive/`、`docs/README.md`、`backend/tests/test_condition_*.py` ×3（归属无机械信号，见上）。理由要说白：**门禁脚本没进树 ⇒ 任何干净机器上的 `pnpm gates` 都跑不起来 ⇒ "gates 0" 目前只是一台机器上的读数**，而"CI 无桌面 job"这条验收也因此还没有讨论资格。
- 定档清单仍 **12 条**（§6），其中唯一同时打开两条验收的是 **`S13-6`「那 13 条 `baselines` 归谁」**——它决定了 Python 编译器与 `backend/` 的退场路径，也就决定 ADR-029 剩下那两条能不能从"卡在决策"变成"可执行"。其次需要授权的：`pnpm e2e` 浏览器臂（会写你 :8000 的开发库，我一直没跑）、真壳人工验收两格（素材到货、落盘与像素）。
- 剩余矿脉为何"不是不动"而是"不该在此刻动"：`BRANCH_EVIDENCE` 那 13 条需要的是**换探针**（`fetch` 计数），不是补测试；先补会造出一批钉在错口径上的判据。`navigator.clipboard` 那一格本机无壳不可判，继续挂着是正确状态。

同日第九十四批（**取数请求按 `resourceType` 数：桌面臂 0，且写法再也绕不过去**，2026-10-10，只动 `scripts/desktop-http-inventory.mjs`）

- 上一批留的"换探针"那条当场做掉。前两道腿都押在**写法**上：`/api/v1` 前缀与主机名——同源、不同前缀的直接 `fetch("/search/…")` 两边都看不见。这一档按 `req.resourceType()` 数 `fetch`／`xhr`，URL 长什么样不重要，"这次是在取数"这件事数不掉。
- 读数（2026-10-10 00:44）：`DATA_DESKTOP=0 ／ DATA_BROWSER=20`，退出码 **0**。顺带一个此前没有的交叉证据：`DATA_BROWSER=20` 与 `BROWSER_UNIQUE=20` **相等** ⇒ 浏览器臂的每一次取数都在 `/api/v1` 前缀下，桌面侧判据盯的那个前缀今天确实覆盖了全部取数面（这是读数，不是永久事实，所以做成会红的腿而不是写成注释）。
- 牙（成对，脚本还原 `BYTE_IDENTICAL=true`）：把桌面臂的壳标记摘掉 ⇒ `DATA_DESKTOP=20`、退出码 **1**、逐条点名（`localhost:5174/api/v1/characters/inventory-probe` 等）；还原 ⇒ 0／20、退出码 0。另外这条腿自带**空转告警**：若浏览器臂一次取数都没数到（`DATA_BROWSER=0`），脚本直接 `UNRELIABLE` 退出 1——因为那说明探针本身没在工作，`DATA_DESKTOP=0` 就成了假证据。
- 上一批那个"13 条没问过工厂"的悬念，这一档给出的答案比我原本提的修法更强：**这 13 条路由在桌面臂里一次取数都没发生**（`DATA_DESKTOP=0` 覆盖全部 25 条，与是否调用 Provider 无关）。所以它们不再是"证据缺口"，而是"有正证的面"；`BRANCH_EVIDENCE=12/25` 继续作为**覆盖面事实**打印，不判红。
- 本批只动普查脚本，未动产品代码 ⇒ `gates`／`e2e` 仍沿用 2026-10-09 20:53 那组（树上产品代码一字未变，HEAD 仍 `1b9ca06`）；普查与引用对账按新状态重取。


同日第九十五批（**命令面可复现锁 `check:tracked`：把"干净 clone 上 gates 跑不起来"从散文做成会红的判据**，2026-10-10，新增 `scripts/check-chain-tracked.mjs` ＋ `package.json` 一条命令 ＋ 文档）

- 触因是第九十三批那句"门禁脚本自己没进树"——当时它只是我把 `??` 清单读一遍得到的**散文结论**。本批做成锁：链从 `package.json` 的 `scripts.gates` 解析（不写死道数），抽出每个 `node scripts/*.mjs`，再走它们的**相对 import 闭包**与源码里出现的基线 JSON 字面量，逐个 `git ls-files` 查是否已跟踪。
- 现测（00:57）：链 **15** 道；面 **19** 个文件＝已跟踪 **9** ／ **未跟踪 10**（`check-dead-surface.mjs`／`check-desktop-seams.mjs`／`check-doc-citations.mjs`／`check-publish-target.mjs` ＋ `dead-export-baseline.json`／`dead-surface-baseline.json`／`desktop-seam-baseline.json`／`doc-citation-baseline.json`／`publish-target-baseline.json` ＋ 共用真相源 `source-graph.mjs`）。**后果点名到命令**：`check:seams`／`check:citations`／`check:publish`／`check:dead-surface` 四道在干净 clone 上连文件都找不到 ⇒ 此前那句 "gates 0" 说的是这台机器，不是这个仓库。
- **刻意不进 `gates` 链**：它现在是红的，而解红只有一条路——把那 10 个文件逐条 `git add` 并提交，那需要授权（§7）。把一条"我这边解不了、只能等人"的红塞进链，等于教下一个人无视整条链（G1 棘轮当年就是为躲这件事才做成"只准变短"）。命令名与用途已写进 README 表，并写明"不进链"的理由，免得下一个人以为是漏接线；提交落地后它自己翻绿，那时再排进链。
- 牙（三条，成对跑完后断言脚本 `BYTE_IDENTICAL=true`）：① 判定自测两头——`scripts/e2e-lock.mjs` 必须被认成已跟踪、`scripts/__no_such_gate__.mjs` 必须被认成未跟踪，任一不符 ⇒ `UNRELIABLE`；② 解析出的道数 < 10 ⇒ `UNRELIABLE`，防"链没解析到于是全部已跟踪"这种假绿；③ **逐脚本核对 JSON 字面量有没有解到文件**——这条是被自己的缺陷逼出来的：第一版把 `join(root, "scripts/x.json")` 当脚本目录相对去解，静默漏掉 4 份基线，只报 6 个未跟踪。退回那个写法立刻显示"4 个可疑脚本／面里 JSON 只剩 2 个"并 `UNRELIABLE`；改回来是"10 个未跟踪／可疑 0"。**聚合计数对这两种写法看不出差别，逐脚本一比就露**——这是本批最值得留下的一条方法论。
- 加了**第二档：清单**（不参与判定）。它把全部未跟踪路径按目录形状分桶打印，现测 01:04：未跟踪 **53** 项＝单元测试 23 ／ 门禁与普查脚本 10 ／ 生产模块 6 ／ 基线与台账 6 ／ 非本战场（他人在飞／域外）4 ／ 文档 2 ／ 夹具 2 ／ **未归类 0**。这一档才是"该 add 什么"的完整清单（上一条的 10 个只是**让链断掉**的那批，取自 `package.json`＋import 闭包）。分桶只看路径不看作者——未跟踪归属在本仓没有干净机械信号，这句是 §6 的在册限度，不是本档能解的事。它自带一条腿：任何路径落不进桶 ⇒ `UNRELIABLE`，对照实验是**摘掉"文档"那一桶**就报"未归类 2"并响，装回去归零。
- 加了**第三面：编译缺口**（比链闭包更硬）。它只看一件事——**已跟踪源码里的相对 import，落点存在却没被跟踪**。现测（01:09）：**6 个模块、12 处引用** ⇒ `apps/web/src/features/studio/components/ChoiceOptionsEditor.tsx`、`packages/axs/src/condition.ts`、`edges.ts`、`instructions.ts`、`packages/editor-core/src/axsImport.ts`、`scripts/ports.json`。**后果比"少一道门禁"重得多：干净 clone 上 `tsc -b` 与 `vite build` 直接断，连 Playwright 的两个 config 都加载不了**（`ports.json` 是端口唯一真相源，被 `playwright.config.ts`／`playwright.desktop.config.ts`／`e2e/helpers.ts` 三处 import）。
- 两条腿各自独立打印，今天的树同时报 `REGRESSION（编译面 6）`＋`REGRESSION（链面 10）`，退出码 1。**"该 add 什么"因此有了准数：16 个文件**（链面 10 ⊕ 编译面 6，实测两面不相交）。清单档（53 项分桶）照旧只是清单、不参与判定。
- 这一面自己带对照组（`packages/axs/src/condition.ts` 必须在册、同样被 import 的 `print.ts` 必须不被报），不符即 `UNRELIABLE`；两处自己踩到又当场修掉的假阳性值得记下：**只认磁盘上真存在的那个落点**——第一版把无扩展名的原始说明符也当落点 ⇒ 225 个假缺口；第二版用 `existsSync` ⇒ `./editor`、`./components` 这类**目录名**命中目录本身又是未跟踪 ⇒ 10 个假缺口，改成 `statSync().isFile()` 才落到 6。牙（三次运行，脚本还原 `BYTE_IDENTICAL=true`）：把 `.tsx` 从候选扩展里摘掉 ⇒ **恰好丢 `ChoiceOptionsEditor.tsx`**（6→5、12→11 处），装回即复原；`.ts`/`.tsx` 换序读数不变（一个模块只存在一种扩展名，这条腿对顺序不敏感——是对的证据）。
- 与 `check:dead-surface` 的分工要说清：那道管"树里有哪些模块没人引用"（死面），这一面管"引用了却不在树里"（缺口），方向相反、判据不重叠，共用同一套"从入口走相对 import"的解析思路但各自独立求值。
- 又加**第四面：数据文件引用**（相对 import 只覆盖 `from "./x"`，fixture／端口表是字符串路径＋`readFileSync`，还有一半在 Python 侧）。它顺手挖出一条**架构事实**：`backend/eval/calibrate.py`、`backend/sidecar/calibration.py`、`backend/sidecar/server.py` 三处**已跟踪的后端代码按路径引用仓外未纳管目录 `Clearance/`** ⇒ 后端今天必须有隔壁那个目录才跑得起来。这条明确**不计入"该 add"**（那些路径本就不该进树，`Clearance/` 里还有 `.env`），单独一档打印，并作为 `backend/` 退场与 `S13-6` 决策的证据登记。
- 这一面的假阳性来源也记清：`git check-ignore` 必须单独处理——`apps/desktop/src-tauri/gen/schemas/*.json`（Tauri 生成物）"不在树里"是**正确状态**，报出来就成谁都不服的噪声；另外 `git check-ignore` 的退出码 **1 表示"一个都没忽略"**，直接 `execFileSync` 会把它当异常抛（第一版就这么炸过一次），只有 128 才是真错误。对照组三条常驻每次运行都跑：`scripts/ports.json` 必须在册、Tauri 生成物与已跟踪的 `file-size-baseline.json` 必须不被报——不符即 `UNRELIABLE`，所以这条面的对错不需要人再证一次。
- **收口成一个数**：`[chain-tracked] 并集：要让干净 clone 真能跑，需 add 17 个文件`（链面 10 ⊕ 编译面 6 ⊕ 本仓数据面 2，去重后 17；`scripts/ports.json` 同时出现在编译面与数据面）。命令会**逐条点名**打印这 17 行"待 add"，所以提交动作不再需要谁去翻 `git status` 猜。四条 `REGRESSION` 并排打印（编译面／本仓数据面／仓外依赖／链面），退出码 1。
- 结构上改掉一处自己刚写下的问题：腿原本串在 `else if` 链上，于是**今天的树只能看到最先响的那条，后面的腿永远走不到**——一条没被真实语料行使过的判据等于不知道它有没有牙。改成各腿独立求值、结论收进 `verdicts` 数组全部打印；对照实验里能同时看到 `UNRELIABLE`（清单分桶）与 `REGRESSION`（链／编译面）并排响，正是旧结构会吞掉后者的证明。清单档与判定档也分开：一个纯展示用的分桶不该把门禁拖成不可解释的红。

同日第九十八批（**空工程那条早退没清"读不回来"的说明；顺手再还一次行数账**，2026-10-10，动 `apps/web` 一处 ＋ 单测一条）

- 洞在 `useProjectEditor.ts` 的早退分支：`if (!scene && !projectNodes.length)` 那条路径**从没走投影**，也就从没动过 `projectionNotice` ⇒ 上一次装载留下的"这一拍有第二组分支，文本里读不回来"会挂在**一个空工程**上，说的话与屏幕上看见的东西无关。
- **可达性不是猜的**：删 Beat 走 `useProjectEditor.ts` 的 `deleteSelectedNode`（`window.confirm` ＋ `node.remove`），界面上的入口是 `NodeInspectorPanel.tsx:325` 那颗「删除整个 Beat」（`CutWorkspace`／`FlowWorkspace` 都接了它）⇒ 删空工程是真路径，不是一句防御。
- 修法是那**一行**（`setProjectionNotice(null)`，注释同行以免再涨行数）；权威侧补单测一条：`projectWithNotice([], [], [], {}, …)` 出默认开场文本且 notice 为 null（含"存档里已是这份默认文本"的第二次打开）⇒ web `projection.test.ts` 22 → **23 passed**。
- 加完这两处把 `useProjectEditor.ts` 推过 `check:size` 棘轮（`wc` 1081／脚本报 1082 > 1081）。这次没搬域，而是清了自己写下的冗余：装载那次调用收成一行并复用同一函数里**已经算好的** `scenes`（消掉 `p.scenes || []` 的第二次重算），`wc` 降到 **1074**，随后 `check-file-size.mjs --update` 把该文件棘轮收紧。
- **如实登记一处未覆盖**：那一行本身没有界面级判据。但**我原本打算写的那条用例是空的**——`saveAll`（那条保存；写作当时记成 `:842`，01:56 实测函数起在 `useProjectEditor.ts:755`、投影块那句 `if (!axsDirty)` 在 `:851`）在 `!axsDirty` 时会跑投影块，而空工程算不出任何诊断 ⇒ 它自己就把说明清成了 null；也就是说"删空 Beat ⇒ 保存 ⇒ 断言说明消失"**在有我这一行和没有我这一行时都绿**，是一条没牙的判据。真正只有那一行才覆盖的状态是**从另一条保存路径进空工程**：`saveWriter`（Writer 的「保存剧本」；写作当时记成 `saveScript`／`:748`，01:56 实测在 `useProjectEditor.ts:728`）只走 `axsToSyncPayload` ＋ `refreshProject`，**完全不进投影块** ⇒ 若此时存档里的图被收成 0 节点（例如把 Writer 文本改成不含任何 `#` 标题行的内容再保存），早退就是唯一能清掉说明的地方。要补的判据因此是：**先造出 E61 那条带说明的状态 → 切到「剧本」tab → 把文本改成零桥段 → 保存 → 断言顶部那条说明消失**（不是"删 Beat"）。在那之前不把这一行算成已覆盖。**（批注 2026-10-10 01:33：第九十九批按这句配方落地了 E62，摘掉那一行可见它红 ⇒ 这一行现在算已覆盖。）**
- 事故一条（自己的老坑第 N 次）：我用整行标题 `## 5. 最新验证与已知问题` 当 Edit 锚点时把它吞掉了，立刻按"标题计数＝1、位置在本文之后"重查并补回。**这类锚点规矩在册（别拿整行标题当锚点），踩过还踩**——所以每次动 §4/§5 边界之后都要跑一次结构回读，不靠记忆。

同日第九十九批（**上一批那句"没牙的判据"当场补成有牙的那条：E62**，2026-10-10，只加 `e2e/desktop-http.spec.ts:2228` 与文档，产品代码一行未动）

- 判据对象要说准：不是"空工程会清说明"这句常识，而是**只有装载档那条早退才覆盖的那个状态**——走 `saveWriter`（Writer 页的「保存剧本」，`useProjectEditor.ts:728`）把图收成 0 节点。上一批已经把配方纠正过一遍（`saveAll` 会自己清，所以"删空 Beat ⇒ 保存"是假判据），本批照纠正后的配方落地。
- 形状：建剧本 → 演出 → 「+ 分支」×2 → 保存 →（正控）断言那句「读不回来」在场 ⇒ 再切「剧本」tab、把文本框整体替换成一行不含 `#` 标题的旁白 → 保存剧本 → `toHaveCount(0)`。**先在场再缺席**两头都要，缺席条不能单独存在。
- 牙（见过红）：删掉 `useProjectEditor.ts:289` 那一行 `setProjectionNotice(null)` ⇒ E62 红在第 2261 行 `Locator: getByRole('status').filter({ hasText: '读不回来' }) / Expected: 0 / Received: 1`，退出码 **1**；还原后 `cmp -s` 断言 **BYTE_IDENTICAL=true**（还原后 wc 1072，本批末棘轮已 `--update` 收到 1073）。这条红同时反证了上一批的分析：如果 `saveAll` 真的覆盖了它，摘掉这一行应当仍然绿。
- 读数（动了 e2e 规格 ⇒ 整套重跑，不沿用单跑）：`pnpm e2e:desktop` **73 passed／0 failed**（01:31，3.3m，桌面基线 72→**73**）· `pnpm gates` **0**（十五道；`test:unit` 全绿未动＝本批没写单测；`[file-size]` 349／0、`[desktop-seams]` 9／6／真断言 **102**／基线 3、`[dead-surface]` 一档 10 在册／二档 344 出口·零读者 24＝基线）· `check:citations` **0**（落笔时**已判定 276**，本节写完还要再取——它数 `路径:行号`，本节每加一条引用它就 +1）· `git diff --check` **0 行** · stash **0** · `.e2e-lock` 不在 · `??` **53**（本批无新文件）· 三引用 peel 仍 `1b9ca06`。
- 顺手清掉一条**文档里的假引用**：§6 那句"已在 §4 第九十六批登记"指向一个**不存在的标题**——九十五／九十六／九十七三批是在同一个 `同日第九十五批` 标题下一起交付的（台账 #167 记的是三批，正文只写了一个标题）。已改成"第九十五批末尾两条"并写明为什么没有"九十六批"。这类事 `check:citations` 挡不住（它只对账 `路径:行号`，不对账批号），属于"引用形似证据、其实没落地"的另一格。
- 上一批留在 §6 的那行「仍未闭环」至此关掉；文档里不再挂"这一行没有界面级判据"。

同日第一百零一批（**一条横幅只印第一条告警＝把"这次丢了几处"吞掉了**，2026-10-10，动 `apps/web` 两处 ＋ 单测三条）

- 与第八十五批同一个家族、同一个方向上的**另一半**：发射器是**逐拍**报的（`packages/axs/src/print.ts:240` 那条 `if (choiceGroups.length > 1 && emit)` 每个丢失的拍各发一条，消息里写着「第「X」拍有 N 组分支」），而界面上只有一条常驻横幅，三处写入点都各自手写 `warns.length ? warns[0]!.message : null` ⇒ 三拍的丢失，用户读到的是**第一拍那一条**，且不知道还有别的。"把丢失说出口"不能只说到第一条。
- 改法是**收成一处权威**：`noticeFor(warns)`（`apps/web/src/features/writer/lib/projection.ts`）——0 条 `null`／1 条逐字沿用／多条时保留第一条原文并补「（这次投影共有 N 处读不回来的丢失）」。三个写入点（装载 `projectWithNotice`、物化 `openWriterAtSelection`、保存 `saveAll` 的投影块）**全部改走它**，顺带把那三份抄了三次同一个三元表达式收掉——这既是修缺陷也是消重复，不是新增形状。文本输出仍然一字未动（地板档没被越过去，待决 ⑩ 依旧不因此关闭）。
- 判据：`projection.test.ts` 新增 `describe("noticeFor…")` **三条**（没丢就不说话／一条时逐字不改写／多条时总数说出口且第一条仍在），web 该文件 24 → **27 passed**。牙：把多条那支退回 `return first` ⇒ 恰好「多处时把总数说出口」这一条红，另两条绿；脚本 `cmp -s` 还原 **BYTE_IDENTICAL=true**。
- 一条**如实登记的界面级缺口**（别再被算成已覆盖）：界面上"N 条告警同时出现"这一格今天**没有点击判据**。原因不是没想到配方，而是那个状态在本仓今天到不了：AXS 语法表达不了一拍两组选项（正因如此才有这条告警），所以两处丢失必须各自在画布上造——需要在流程画布里新增并选中第二个 Beat，再逐个放两组分支，而 e2e 里还没有"点选画布节点"这条通路的先例。已判的部分不受影响：横幅渲染的是 `noticeFor` 的返回值这一截由 E60／E61／E62／E63 各自在界面上证过；这一批改的是**字符串怎么组**，那一截住在权威函数里并被单测钉住。要补的界面判据＝「两个 Beat 各放两组分支 → 保存 → 横幅里既出现第一个 Beat 的名字、也出现『共有 2 处』」。**（批注 2026-10-10 02:22：这一格已由 E64 关闭——通路是先切「剪辑」工作台 tab、再按大纲行 `01 甲`／`02 乙` 选拍、每次选完重新点开右侧检查器的「演出」标签；原判据缺口的"到不了"读法是错的，缺的只是这条导航先例。）**
- 行数账：`useProjectEditor.ts` 因加 import 涨到 1073、越过 G1（脚本报 1074 > 棘轮 1073）。这次没搬域，把装载那次调用里`Object.fromEntries(...)` 的三行式收成一行（98 字符，同文件本就更长的行有成片）⇒ **wc 1071**；本批末 `--update` 把棘轮从 1073 收到 **1072**（跑前照例量前提：0 违规＋14 条 entry 全 `>400` ⇒ 只可能收紧、不会静默删档）。
- 事故一条（同一条老坑第三次）：我又拿**整行标题**当 Edit 锚点，把 `同日第一百批（…）` 那一行吞掉了，当场按「标题行数＝1、正文顺序」补回并复测。这条规矩在册（`MEMORY.md`：整行标题做锚点会吞掉该标题行），**第三次仍踩**——所以任何 §4 的写入之后都跑一次 `grep -c "^同日"` 与段落顺序回读，不靠记忆。
- 读数（树定稿后整套重取）：`pnpm gates` **0**（十五道）· `pnpm e2e:desktop` **74 passed／0 failed**（02:04，3.4m；本批没加新用例，桌面基线不变）· `check:citations` **0**（**已判定 284**／不存在 0）· `check:seams` **0**（9／6／真断言 102／基线 3）· `git diff --check` **0 行** · `??` **53** · 三引用 peel 仍 `1b9ca06`（未提交、未推送、未动 tag，按 §7）。

同日第一百零二批（**把上一批自己登记的那格缺口当场关掉：E64**，2026-10-10，只加 `e2e/desktop-http.spec.ts:2317` 与文档，产品代码一行未动）

- 判据对象：横幅上「共有 N 处」这一维。上一批把它登记成缺口时给的理由是"那个状态到不了"——**这条理由被测量否掉了**：到得了，缺的只是 e2e 里没人写过这条导航。
- 形状（三步都得写出来）：文本落两拍（`# 甲` / `# 乙`，parse 表达得了多拍、表达不了一拍两组）→ 保存剧本 ⇒ 前置断言横幅不在 → 切「剪辑」工作台 tab → **按大纲行 `01 甲` 选拍** → **点开右侧检查器「演出」标签** → 「+ 分支」×2 → 同样给 `02 乙` → 保存 → 断言横幅里出现「共有 2 处」且第一个拍名仍在，链尾零 `/api/v1`。
- 三次红各归各因，都靠 DOM 快照归因而不是猜：① `button {name:"演出"}` 在 Writer 模式下**根本不存在**（超时）；② `button {name:"甲"}` **撞上两枚**（大纲行 `01 甲` ＋ 时间轴片段 `title="甲 · 00:01"`，strict mode violation）；③ 选完拍再点 `+ 分支` 仍不可见——因为 `selectFlowNode` 会把面板切回「内容」，**每选一拍都要重开「演出」标签**。这三条都是选择器/导航事实，不是产品缺陷。
- 牙（成对，还原 byte-identical）：把 `noticeFor` 多条那支退回 `return first` ⇒ E64 红在第 2378 行 `notice.filter({ hasText: "共有 2 处" })`，退出码 **1**；`cmp -s` 还原 **BYTE_IDENTICAL=true**。
- 读数（树定稿后整套重取，动过规格所以不沿用单跑）：`pnpm e2e:desktop` **75 passed／0 failed**（02:22，3.5m；桌面基线 74→**75**）· `pnpm gates` **0**（十五道；`[file-size]` 349／0、`[doc-citations]` 已判定 **284**、`[desktop-seams]` 9／6／真断言 102／基线 3）· `check:http-inventory` **0**：`SPEC_URLS` **72→73**（E64 多一次 `goto`，口径是引号字面量出现次数，与覆盖面无关）、`DATA_DESKTOP=0／DATA_BROWSER=20` · `git diff --check` **0 行** · `??` **53** · 三引用 peel 仍 `1b9ca06`（未提交、未推送、未动 tag，按 §7）。

同日第一百批（**第三个投影时刻：打开「剧本」tab 那次物化把诊断整条丢了**，2026-10-10，动 `packages/editor-core` ＋ `apps/web` 四处 ＋ 判据四条 ＋ 文档）

- 洞不在文本层，在**接线**：`openWriterAtSelection` 每次调用都把"当前画布（含未保存编辑）"投影成 AXS 并 `setAxsSource(projected)`——屏幕上显示的就是这次投影的结果，可它走的 `projectAxsFromCanvas`（web）→ `projectAxsFromCanvas`（editor-core）→ `draftToAxs` 这两层**没把出参接上**（`draftToAxs(draft, roles)` 不交数组），于是丢失在这一趟发生、被用户看见、却一个字没说。装载那一腿盖不到（它看的是存档），保存那一腿也盖不到（用户还没保存）。ADR-016 上一节写的「两个时刻」因此是**漏了一个**，已另起补记。
- 判据是**先红后绿**写的（这次不是事后补牙）：E63（`e2e/desktop-http.spec.ts:2276`）在接通之前红在 `toBeVisible()`／`element(s) not found`，接通后绿。**配方挑得有讲究**：必须"两次「+ 分支」但不保存"，因为一保存说明就被保存那一腿点亮 ⇒ 有无本次改动都绿——这与第九十九批那条是同一个陷阱的另一面。
- 权威侧**分层各钉一条**（不是一个数）：editor-core 那条量最底层，web 那条量"中间这层有没有往上交"。两条各带正控（只有一组分支 ⇒ 诊断必须为空），各钉一条"文本与不传诊断时逐字相同"——地板档的意思就是**只把丢失说出口，不改输出形状**，待决 ⑩ 一条都不因本批关闭。
- 成对变异（各自只打红该打的那一层）：web wrapper 停止转发 ⇒ web 那条红（`expected '' to contain '读不回来'`）而 editor-core 那文件 33 条全绿、`cmp -s` 还原 **BYTE_IDENTICAL=true**；hook 里那句 `setProjectionNotice(...)` 摘掉 ⇒ **E63** 红。
- 行数账：加完 `setProjectionNotice` 那一行后 `useProjectEditor.ts` 越了 G1（脚本报 1076 > 棘轮 1075）。这次按门禁给的处置走——**搬域**：把就地拼画布快照的那 5 行收成 `canvasSnapshotFromKernel`（`editorProjection.ts`，纯函数，新 2 条用例含"不写回内核节点"与"`stageId` 为 null 时如实 null"），`wc` 落到 **1072**、棘轮 `--update` 收到 **1073**（跑前照例量前提：0 违规＋14 条 entry 全 `>400` ⇒ 只可能收紧，不会静默删档）。
- 读数（树定稿之后整套重取，不沿用）：`pnpm gates` **0**（十五道；`test:unit` 里 web **315→318** passed、editor-core **191→192**，另 `coverage` 档重跑同两个项目）· `pnpm e2e:desktop` **74 passed／0 failed**（01:52，3.4m；本会话内 72→73→**74**）· `check:citations` **0**（此刻**已判定 280**／不存在 0，本节写完还会再涨）· `check:seams` **0**（9／6／真断言 **102**／基线 3——搬域没动接缝的形状）· `check:http-inventory` **0**：`SPEC_URLS` **70→72**（E62／E63 各多一次 `goto`，口径是"引号字面量出现次数"，与覆盖面无关）、`DATA_DESKTOP=0／DATA_BROWSER=20`、`BRANCH_EVIDENCE=12/25` · `check:tracked` **1**（四条 `REGRESSION` 并排、需 add 仍 **17** 个文件）· `LOADFACE=/tmp/b100-inv.txt pnpm cloud:callmap` **0**（台账 12＝B 档 12、没判据 0、幽灵证据 0、重复键 0）· `git diff --check` **0 行** · `??` **53**（无新文件）· 三引用 peel 仍 `1b9ca06`。
- 一条**过程纪律**要记下来（自己踩的，不是产品的）：第一批读数之后我在 `pnpm e2e:desktop` 仍在跑的时候继续改 `apps/web` 的产品代码，那一轮 e2e 里 E63 红了——**红因是 HMR 撞上了我半改完的树**（有一阵 hook 引用了还没导入的符号），不是判据失效。判据本身在 01:41 单跑与 01:52 整套都绿。处置不是"猜它没影响"，而是**树定稿后整套重跑**，并把作废那一轮的读数写进文档、不引用。这与"同树不并跑两个门禁"是同一条纪律的两个方向：**跑门禁的时候树不许动**。
- 自审出来的**文档引用缺陷两处**（`check:citations` 挡不住，因为它只验"行存在且在范围内"）：① 第九十八／九十九批里我把 Writer 那条保存通路记成 `saveScript`／`:748`——**真名是 `saveWriter`，实测在 `useProjectEditor.ts:728`**，`:748` 落在同一个函数体内（所以"存在且InRange"照样过）；② 同批记的 `saveAll:842` 已被本批的行数搬家挪到 `:755`（投影块那句 `if (!axsDirty)` 在 `:851`）。都在原句里带"写作当时记成……01:56 实测……"的批注改正，不抹历史。教训一条：**引用符号名也要实测，不能只引用行号**——名字错＋行号仍在范围内，是机检的死角。

同日第一百零三批（**把"判据自报的看不见"变成"看见了但不下结论"：`check:apibase` 扩面 ＋ 四档自证**，2026-10-10，只动 `scripts/check-apibase-literals.mjs` ＋ README ＋ 本节，产品代码一行未动）

- 为什么现在动它：§6 定档①卡的是**措辞**（"哪些位置算测试宿主"），不是**数字**。上一轮我确认过一件事——这条命令离进链只差一句措辞，而那句话归你；所以这一批的活是把那句话的**输入补全**，而不是替你说完。
- 三件事：①**只读面**（`apps/admin/src`／`packages`／`e2e`）按同一规则数、按档报数、**不参与红绿**——把它们算进判定等于让一条还没被认可的措辞偷偷生效；②**代价档**：`其中行尾注释 N` 单独数（注释判定只认行首，这是脚本自己登记过的限度）；③**可疑写法档**：`` `/api/${v}/x` ``、`"/api/" + "v1"`、`/API/V1` 三类绕开严格子的写法从"看不见"变成"数出来"。
- 归类抽成纯函数 `classify()` 并配**五条合成样本对照组**（含新加的 `*.spec.*` 一条）＋**三条腿的失效锁**：面文件数 < 50 ⇒ `UNRELIABLE`、基址宿主文件不在树里 ⇒ `UNRELIABLE`、三类命中全 0 ⇒ `UNRELIABLE`；判定面有越界 ⇒ `REGRESSION`。
- 扩面第一次跑就抓到自己的假阳性：`e2e/` 的 80 条命中里 **79 条是测试宿主**（断言文案与请求监听器的路径判断），因为旧 `classify()` 只认 `*.test.*` 不认 `*.spec.*`——**这不是定档，是把工具的漏判归位**；修完只读面剩 3 条疑似调用点（`adminClient.ts:20`／`ImageUpload.tsx:24`／`e2e/helpers.ts:10`），后者是测试自己的基址定义，属于"定档要不要给测试基址留一格"的输入。
- 牙（四条，各自只响在该响的那一格；两处改动都 `cmp -s` 还原 **BYTE_IDENTICAL=true**）：往 `projection.ts` 追加一行 `const probeA = "/api/v1/probe-a";` ⇒ `REGRESSION`、越界 1；再追加一行行尾注释版 ⇒ `越界 2（其中行尾注释 1）`；再追加一行 `` `/api/${"v1"}/x` `` ⇒ `可疑写法 1`（严格档 0 命中，正是这条限度要说的事）；把 `BASE_DEF_RE` 换成永不匹配的正则 ⇒ `UNRELIABLE —— 归类自测失败：期望 baseDef 实得 violation`，退出码 **1**。
- 读数：`pnpm check:apibase` **0**（判定面 测试 9／注释 1／基址定义 1／越界 0；只读面 apps/admin 1／packages 2／e2e 80；合计扫 442 个文件；可疑写法 0）· `pnpm gates` **0**（**十五道未变**——这条命令仍然刻意不在链里，理由写在脚本头与 README）· `git diff --check` **0 行** · `??` **53**（本批未新增文件）· 三引用 peel 仍 `1b9ca06`（未提交、未推送、未动 tag，按 §7）。
- 一句限度要说白：这一批**没有**把定档①推进成结论，它只把结论所需的四格数字量齐了。真要接进 `gates`，需要的是你那一句话（管不管 admin／packages／e2e），接进去是一行。

同日第一百零四批（**剪贴板静默失败：找到缺陷、动手、当场回退并登记在册**，2026-10-10，产品代码最终净变化 0 行）

- 缺陷是真的，而且量出了形状：`navigator.clipboard.writeText` 在桌面是唯一发布目标时**必然可能 reject**（无权限／非安全上下文／壳不给能力）。6 个调用点里三种形状——`ShareActions` 有 `window.prompt` 兜底；`CharacterDetailPage` 里两处 `document.execCommand("copy")` 兜底**把返回值丢了**（false 也被当成复制成）；**`PromptExport.handleCopy`／`handleCopyId`／`StoryEditPage.copyAxs` 三处连 catch 都没有**（按钮既不报成功也不报失败，用户以为内容已在剪贴板里，控制台只有一条未处理 rejection）。同一件事三套实现＝三套语义，正是「抄两遍」那一族。
- 动手做到哪一步：新增唯一通路 `shared/lib/clipboard.ts`（`copyText(text) -> "copied" | "manual"`，失败态是**结论**不是布尔）＋ 4 条单测＋把三处静默点与两处内联副本都接上去。
- **为什么回退**：两处未完工就红了——① 4 条单测全红（jsdom 下 `navigator.clipboard` 的桩法不对，我没时间先归因再修桩，而一条红着的判据不是证据）；② 归一后 `copiedId` 变成未使用变量，`tsc` TS6133。按在册纪律「未验全量就不留半成品」，这一批**整批撤回**而不是把红的留着：三个文件逐处反向替换（每处断言命中数＝1），两个新文件删掉，`pnpm typecheck` 回到 **0**、`pnpm gates` 回到 **0**、`e2e:desktop` 仍 **75 passed**（产品代码回到 02:22 那一组读数取于其上的状态）。回退过程自己还出过一次小事故：我在收尾加了一条 `navigator.clipboard` 出现次数＝1 的断言，**回退后正确的现状是 3**（正路 1＋内联 2）——那条断言按"修完"的形状写，反而在回退成功时 ABORT，好在 ABORT 发生在写盘之后、删文件之前，文件因此还留着，本轮末尾才删掉。
- 于是这一批的产物是**一条在册的修法**（不是散文抱怨）：唯一通路 `copyText`＋`CopyOutcome`；三处静默点各加可见失败态（`PromptExport`／`复制 ID`／`copyAxs`）；两处内联副本删掉；判据两层＝单测（成功／reject+execCommand true／execCommand false／`navigator.clipboard` 整个不存在，四条各守一支，且必须先把 jsdom 的桩法弄对——桩法是这次的红因）＋一条界面腿（用 `addInitScript` 把 `writeText` 打成 reject 且把 `execCommand` 打成 false，点「复制 ID」断言出现"复制失败"，正控是不打桩时出现"✓ 已复制"）。这条界面腿**不需要壳**，所以它不属于「本机无壳不可判」那一格。
- 顺带纠正一条在册登记：§6 那条「`navigator.clipboard.writeText` 桌面 WebView 里是否静默失败本机无壳不可判」写得太宽——**"壳里到底给不给剪贴板"确实不可判，但"reject 时界面会不会说话"完全可判**，而且现在已知它不会说话（三处连 catch 都没有）。这一格从「只观察不处置」升成「有缺陷、有修法、缺工时」。
- **批注 2026-10-10 02:48（第一百零五批）：这一批没有停在"只登记"。** 唯一通路 `apps/web/src/shared/lib/clipboard.ts` 已落地（带平台分派口 `clipboardDeps`，理由与形状沿用 `playerSavesDeps`），上一批那两条红因也都归因到位：**单测宿主是 node 没有 `document`**（`ReferenceError: document is not defined`，所以桩必须打在分派口上而不是 DOM 上）与**归一后遗留未使用变量**（这次改用"新增一个失败态"而不是派生同名常量）。已接上的调用点：`PromptExport.handleCopy`、`CharacterDetailPage.handleCopyId`（外加那两处忽略 `execCommand` 返回值的内联副本一起归一，该文件 693→679 行）。**剩下的三分之一是 `StoryEditPage.copyAxs`**：该文件行数正好压在 G1 棘轮 **419**，加一行失败态就得先减一行——这一批不动它，按债务信号登记，不为它放宽棘轮。界面腿（E65）同理留给下一批：`?storage=memory` 下角色列表是否播种尚未量过，不能凭猜写导航。
- 读数：`pnpm typecheck` **0** · `pnpm gates` **0**（十五道；`[doc-citations]` 已判定 **294**）· `??` **53**（比上一批末 +0：新增的两个文件已删）· `git diff --check` **0 行** · 三引用 peel 仍 `1b9ca06`（未提交、未推送、未动 tag，按 §7）。

同日第一百零五批（**剪贴板唯一通路落地：node 宿主下可测的分派口 ＋ 三处里改掉两处＋两处假兜底归一**，2026-10-10，动 `apps/web` 四处 ＋ 新模块与 4 条单测 ＋ 文档）

- 判据宿主这一条是上一批的红因，这次先量再写：`document is not defined` ⇒ **本仓 web 单测跑在 node 环境**，任何直接摸 DOM 的判据都测不到 DOM 分支。解法沿用本项目已有的先例（`shared/storage/playerSavesDeps.ts` 那句"否则 node 环境下 `window` 不存在，本地分支在测试里永远跑不到"）：把平台调用收进 `clipboardDeps`，`copyText` 只依赖这个口子——它不是测试脚手架，是那条使能单测的接缝，且生产路径一行未变。
- 返回值设计：`"copied" | "manual"` 而不是布尔——布尔会把"没复制成"和"抛异常"压成同一格；两条退回支（`execCommand` 返回 false／`execCommand` 自己不存在）都归 `manual`，调用方**必须**为此给可见文案。三处静默点里已接上的两处（`PromptExport.handleCopy`、`CharacterDetailPage.handleCopyId`）按钮现在会写「复制失败，请手动选中」。
- 顺带归一：`CharacterDetailPage` 里两份内联 `textarea + execCommand` 副本（各自把返回值丢掉，且复制失败也当成功）删掉，该文件 **693→679 行**；全仓 `navigator.clipboard` 出现次数 **6 → 4**（`grep -c` 现测：模块内 2 次就是唯一实现本身，模块外剩 2 处——`ShareActions` 那处本来就有 prompt 兜底、`StoryEditPage.copyAxs` 是这一批没接的那三分之一）。
- 单测四条各守一支（正路不碰退回支／reject 后退回成功／`execCommand` 返回 false ⇒ manual／退回支自己抛 ⇒ manual 不炸界面），web 项目 **Tests  325 passed | 1 skipped**。
- 读数（树定稿后整套重取）：`pnpm gates` **0**（十五道）· `pnpm e2e:desktop` **75 passed／0 failed**（动了产品代码所以整套重跑）· `check:citations` **0**（已判定 **294**）· `check:http-inventory` **0**（`SPEC_URLS=73` 未动、`DATA_DESKTOP=0／DATA_BROWSER=20`）· `check:seams` 9／6／真断言 102／基线 3（新模块 `clipboard.ts` 不是桌面壳接缝形状，不进那张面）· `check:size` **0** 越线且 `--update` 把 `CharacterDetailPage` 棘轮按归一后的实值收紧 · `git diff --check` **0 行** · `??` 新增 `clipboard.ts`／`clipboard.test.ts` 两份**未跟踪**（提交时要显式 `git add`，`check:tracked` 会点名）· 三引用 peel 仍 `1b9ca06`（未提交、未推送、未动 tag，按 §7）。
- 仍欠的两格都写清形状，不留含糊：① `StoryEditPage.copyAxs`（要一行失败态＝先在那 419 行里找一行真冗余）；② 界面腿 E65（先量 `?storage=memory` 下角色列表有没有播种，再决定导航怎么写；桩法是 `addInitScript` 把 `writeText` 打成 reject、`execCommand` 打成 `() => false`，正控是不打桩时出现「✓ 已复制」）。 归一档，逐条点名并**并进"需 add"并集** ⇒ 现测 **24 个**，并集 **17 → 41**（链面 10 ⊕ 编译面 6 ⊕ 数据面 2 ⊕ 判据面 24，去重后 41），另出一条独立 `REGRESSION` 腿。两条对照组常驻（`clipboard.test.ts` 必须在册／`projection.test.ts` 必须不被报），不符就 `UNRELIABLE` 并明说"上面那份清单不可信"。
- **别名面这一版没生效，而且是我自己的对照组抓出来的**：`clipboard.ts` 仍未被点名。我把那条对照组（"`clipboard.ts` 该被编译面抓到"）加进去试跑，门禁立刻报 `UNRELIABLE — 编译缺口那条面的对照组不符` ⇒ 代码写了、行为没发生。诊断没在这轮做完，所以**把那条对照组撤下来**（**批注 2026-10-10 03:00：下一批已修好并验过**——根因是 `@/` 这一个前缀来自**三份** tsconfig（admin／nexus／web），`ALIASES.find()` 取第一条 ⇒ 解到 `apps/admin/src/...` 不存在 ⇒ 静默零命中。修法＝按前缀取**全部**根再试扩展名；对照组加回来后它转绿）而不是留一条永远红的自测（永远红的自测会淹掉别的红灯）。这一面的真实状态是"未生效、未验"，文档里不许写成已覆盖。
  下一批怎么判定它修好了：**把那条对照组加回去跑，它必须转绿**（`clipboard.ts` 出现在编译缺口清单里）。可疑点按成本排序：① `aliasMap()` 里那份 tsconfig 是否真被收下（同一份文件在 shell 里直接 `JSON.parse` 能读到 `"paths": {"@/*":["./src/*"]}`，所以嫌疑在脚本内的注释剥离/`compilerOptions` 取值分支）；② `rel()` 单参数按 `process.cwd()` 归一，与 `ROOT` 是否一致；③ `git ls-files -- "*.ts"` 的 pathspec 跨斜杠行为。
- 门禁档位要说白：`check:tracked` **仍在链外、仍然红**，红因没变（那批文件需要授权提交）。本批改的是它**数得准不准**，不是它该不该红。
- 读数：`node --check` 通过 · `pnpm check:tracked` 退出码 **1**（五条 `REGRESSION` 并排：链面／编译面／本仓数据面／仓外依赖／**判据面 24**；现存对照组全过）· `pnpm gates` 沿用 02:49 那组 **0**（链外脚本＋文档，链上十五道读的源码面一字未改）· `check:citations` **0**（已判定 **294**（02:55 读数；本批落笔后复测 **378**））· `git diff --check` **0 行** · `??` **55** · 三引用 peel 仍 `1b9ca06`（未提交、未推送、未动 tag，按 §7）。
- 一条自我引用：**"写了"不等于"生效"**。若没把那条对照组试跑，我会把"别名面已覆盖"写进文档，而它一行都没多抓到——对照组是唯一在 02:53 就让我发现自己没修成的东西。

同日第一百零七批（**别名面修好并验过："需 add"的准数 41 → 43，藏住的是 2 个生产模块**，2026-10-10，动 `scripts/check-chain-tracked.mjs` ＋ 文档）

- 上一批留的那格"写了没生效"这一批关掉。根因不是 tsconfig 解析（`ALIASES` 三条都在），而是**多对一前缀**：`@/` 同时来自 `apps/admin`／`apps/nexus`／`apps/web` 三份 tsconfig，而循环里用 `find()` 取第一条 ⇒ `@/shared/lib/clipboard` 被解成 `apps/admin/src/shared/lib/clipboard`（不存在）⇒ 整条别名支**静默零命中**。这正是本仓已经点过名的"同名取第一个"那一族（`document.ts` 的 `titleToId`、两条 AXS→图 通路都栽过一次），修法沿用：**按前缀取全部根，逐根试扩展名**，而不是猜哪个 app 才是权威。
- 生效证据：编译面 **6 → 8 个模块**（新增 `apps/web/src/shared/lib/clipboard.ts` 与 `apps/web/src/shared/storage/shellSmokeGate.ts`——第二个不是我原本要找的，是这条面修好后自己现形的**同一类漏项**），并集 **41 → 43**。也就是说此前那句"要让干净 clone 真能跑，需 add 17 个文件"漏了 4 个文件，其中 **2 个是生产模块**：少了它们，`tsc -b`／`vite build` 直接断，而不是"少一条判据"。
- 牙（对照组＋成对变异，还原 byte-identical）：对照组常驻一条 `clipboard.ts` 必须在册、`print.ts` 必须不被报；把 `filter()` 退回"取第一条"（`.slice(0,1)`）⇒ 编译面立刻 **8 → 6**、对照组报 `UNRELIABLE — 编译缺口那条面的对照组不符：apps/web/src/shared/lib/clipboard.ts`，退出码 **1**；`cmp -s` 还原 **true** 后复跑回到 8 模块／43 文件。**这条红就是上一批让我没把"已覆盖"写进文档的那条**——它这次是绿的，所以那句话现在可以写。
- 一次工具事故（老坑第 N 次，当场抓住）：我用 `node -e '…'` 做多处替换，脚本里含反引号 → **zsh 把反引号内容当命令替换执行**，脚本解析失败、一个字都没写盘。改成 Edit 工具后一次成功。教训在册（含 `${}`／反引号的 JS 改动一律用编辑工具），这次靠"写盘前断言＋写盘后没变化"及时发现，没有留下半改状态。
- 读数：`node --check` 通过 · `pnpm check:tracked` 退出码 **1**（五条 `REGRESSION` 并排：链面 10／编译面 8／本仓数据面 2／仓外依赖 3／判据面 24；现存对照组三条全过）· `pnpm gates` 沿用 02:49 那组 **0**（**这道命令不在链上**，且本批只动链外脚本与文档，链上十五道读的源码面一字未改）· `??` **55** · `git diff --check` **0 行** · 三引用 peel 仍 `1b9ca06`（未提交、未推送、未动 tag，按 §7）。

同日第一百零八批（**剪贴板第三处接不上、界面腿的先决条件量出来了：本地根本没有播种角色**，2026-10-10，净变化 0 行产品代码）

- 试第三处（`StoryEditPage.copyAxs`）。这次不需要新状态——那页**已经有** `axsError` 且已在 `StoryEditPage.tsx:384` 渲染成红字，所以失败反馈走它，处理函数保持三行：`if ((await copyText(axsDraft)) !== "copied") setAxsError("复制到剪贴板失败，请在下方手动选中全文再复制");`。唯一多出的是那行 import。
- **被 G1 挡下，且我不动棘轮**：该文件 wc 418、基线 419（脚本按 wc+1 计），加一行 import ⇒ wc 419／脚本报 **420 > 419** ⇒ `check:size` FAIL。按在册判断（"只准变短的棘轮挡住'加一行反馈'时是债务信号，不是放宽理由"），这一批**整处退回原状**（**批注 2026-10-10 03:15：已被第一百零九批取代**——那批把 `copyAxs` 三行收成两行，import 占一行 ⇒ 净 0 行、棘轮未放宽，第三处已接上）而不是先给一个未经测量的"顺手压缩"——那页里能压的行都是真语句，硬凑等于用无关重构换门禁放行。
- 顺手把界面腿 **E65** 的先决条件从猜测变成测量：`grep -n "character" apps/web/src/shared/storage/desktopSeed.ts` ⇒ **零命中**，也就是 `?storage=memory` 下**角色列表本来就是空的**。所以 E65 卡住的不是选择器，而是**e2e 里还没有"创建角色"这条通路**（此前 #59 那条判据建的是别的路径）。这一格因此从"配方已写好、缺试跑"精确成"缺一条建角通路先例"——比上一批的登记更可用。
- 验证（退回后）：该文件 wc **418** 复原、`check:size` **0** 越线、`pnpm typecheck` 错误行 **0**、`pnpm e2e:desktop -g "E53|E62|E63|E64"` **4 passed**（抽跑四条与剪贴板/说明同族的界面腿）· `pnpm gates` **0**（十五道；`[doc-citations]` 已判定 **378**）· `git diff --check` **0 行** · `??` **55** · 三引用 peel 仍 `1b9ca06`（未提交、未推送、未动 tag，按 §7）。
- 下一批怎么把这两格关掉（都不必等人定档）：① 第三处——先在那 418 行里找到一行**语义等价可省**的（如把 `import` 并入既有的同模块说明符、或把只被一处用到的短函数内联），再把 `copyText` 接上，判据仍是模块那 4 条；② E65——把"建角"通路做成 e2e 的第一步（表单字段与提交按钮需要一次实跑归因），然后按已写的桩法断言两态。

同日第一百零九批（**剪贴板三处静默点全部接完；G1 那条挡路用"被改的构造自己让出一行"解掉，没放宽棘轮**，2026-10-10，动 `apps/web/src/features/character/pages/StoryEditPage.tsx` 一处 ＋ 文档）

- **取代第一百零八批的退回结论**：那一批记下"加一行 import 就 420 > 419"就停了；这一批把 `copyAxs` 从三行（`async () => { await …; };`）收成**两行隐式返回**，import 占一行 ⇒ **净 0 行**，`wc` 仍是 **418**、棘轮仍是 419（脚本按 wc+1 计）。**读法**：G1 挡住时先问"我正在改的这个构造本身能不能更短"，再问"旁边有没有真冗余"，最后才考虑放宽——这次答案是前者，不需要无关重构、也没碰基线。行长合规：该文件既存最长行 168 字符，新增这行约 110。
- 顺手修掉一个既存小毛病：复制成功时把 `axsError` 清成 `null`，不再让上一条转换失败的红字冒充"复制也失败了"。
- 至此**三处静默点全部接上唯一通路**（`PromptExport.handleCopy`、`CharacterDetailPage.handleCopyId`、`StoryEditPage.copyAxs`）。全仓 `navigator.clipboard` 现测 **3 处**＝`clipboard.ts` 内部 2（唯一实现本身）＋ `ShareActions` 1（本来就有 `window.prompt` 兜底）⇒ 第一百零四批那句"6 个调用点三种形状、三处连 catch 都没有"这一族**清零**。判据仍是模块那 4 条单测＋`tsc`（`noUnusedLocals` 会抓住接了不用的情况）；**界面腿 E65 仍欠**（**批注 2026-10-10 03:24：已补，见第一百一十批**——建角通路确实能走，桩两条通路即可），先决条件已量清：`desktopSeed.ts` 里没有 character ⇒ `?storage=memory` 角色列表为空 ⇒ 缺的是"建角"e2e 通路，不是选择器。
- 读数（树定稿后整套重取，动过产品代码所以不沿用）：`pnpm gates` **0**（十五道；web 单测 **325 passed＋1 skipped**）· `pnpm e2e:desktop` **75 passed／0 failed**（03:14，3.5m；本批未动规格，桌面基线不变）· `check:citations` **0**（已判定 **379**）· `check:size` **0** 越线（**未放宽**）· `git diff --check` **0 行** · `??` **55** · 三引用 peel 仍 `1b9ca06`（未提交、未推送、未动 tag，按 §7）。

同日第一百一十批（**E65 上线：剪贴板那一族从「三处静默」到「两头都有界面判据」**，2026-10-10，只加 `e2e/desktop-http.spec.ts:2400` 一段与文档，产品代码一行未动）

- 上一批量清的"缺建角通路"这一批自己走通了：`/studio/characters/mine?storage=memory` → 「创建角色」→ 选预设 `/英雄/` → 填「角色如何称呼」→ 「保存角色」→ 回列表 → 点进那张卡 → 「复制 ID」。**没有新增产品代码**，只在 spec 里加一个共用前置函数（两条腿共用，避免同一串步骤抄两遍）。
- 失效形状是**桩出来的真实形状**，不是改产品代码：`addInitScript` 里把 `navigator.clipboard.writeText` 打成 reject **且**把 `document.execCommand` 打成 `() => false`——这两条正是第一百零四批量的那条链（正路被拒 → 退回支也说没成）。断言按钮从「复制 ID」变成含「复制失败」的文案，链尾照例零 `/api/v1`。
- 正控那一臂不桩、给足 `clipboard-write`／`clipboard-read` 权限，断言同一颗键显示「✓ 已复制」——它挡的是"这条判据永远成立"式假绿。
- 牙（成对，还原 `cmp -s`）：把 `copyText` 改成"永远返回 copied"（模拟**接了通路但不判失败**那一族缺陷）⇒ 失效臂红在 `getByRole('button', { name: /复制失败/ })`／`element(s) not found`，**正控臂仍绿**，退出码 **1**；还原后两臂都绿。**这一对恰好说明两臂量的不是同一件事**：只有一臂会被"谎报成功"打红。
- 读数（树定稿后整套重取，动过规格所以整套跑）：`pnpm e2e:desktop` **77 passed／0 failed**（03:23，3.5m；桌面基线 **75→77**）· `pnpm gates` **0**（十五道；web 单测 325＋1 skip、`[file-size]` 0 越线）· `check:citations` **0**（已判定 **379**）· `check:http-inventory` **0**：`SPEC_URLS` **73→74**（前置函数里那一次 `goto`；口径是引号字面量出现次数，与覆盖面无关）、`DATA_DESKTOP=0／DATA_BROWSER=20` · `git diff --check` **0 行** · `??` **55**（未新增文件）· 三引用 peel 仍 `1b9ca06`（未提交、未推送、未动 tag，按 §7）。
- 至此第一百零四批那一族**四格全闭**：唯一通路、三处静默点接完、两处假兜底归一、界面腿两头判据。桌面侧我能自主推进的清单至此见底——剩下的每一项都要先有你的定档或授权（见 §6）。

## 5. 最新验证与已知问题


最近一次完整验证：

同日第四十五批（**锁条件键语法 + 写读往返 ⇒ 一条跨族不一致降级为待决 ⑯**，仍未提交）：
- 上一批说"仍未锁：`relationship` / `codex` 的行为本身"——本批锁的是**键语法 + 写读往返**，
  载体是 `testdata/conditions/families.json` 新增的 `keyGrammar`（6 族各写明分段规则）与
  `roundTrip`（8 条 write→read），消费方 `packages/core/src/keyGrammarVectors.test.ts`。
  **为什么不塞进跨实现向量**：`relationship` / `codex` 在 Python 侧**不存在**，跨实现那份覆盖不到它们。
- **为什么要单独一份、还要走一遍 effect**：只测读侧看不出「两侧**同规则地**丢段」和「两侧**不同规则**」的区别。
  `relationship` 写 `A.B.affection.mood=7` 落进 `{affection: 7}`，于是**短名读得到、长名读也得到**——
  两者读到同一格，这正是"配套"的证据；如果只断言"长名读得到"，那一天有人只改读侧就会静默变成错配。
- **量出来的跨族不一致**：`character_state` / `codex` 是「切**第一个**点、**其余整体**当键」⇒ **键可以带点**；
  `relationship` 是「按点切、取第 3 段、**第 4 段起静默丢弃**」⇒ **键不能带点**，且**零诊断**。
  ⇒ 同一个"带点的字段名"在两族里一个可用一个不可用。已降级为**待决 ⑯**（选项与代价见 §6）。
- **牙＝两道，都响**：改**写侧**成"其余整体" ⇒ 2 红；只改**读侧**（写侧不动，真错配）⇒ 2 红。
- **这次我两次把结论说过头，都在"先下结论、后补测量"上**：
  ① 我用 grep 查"谁往 `vars.relationships` / `vars.characters` 里写"时**过滤掉了 `conditions.ts`**，
  于是得出"生产代码从不写 ⇒ 这两族在运行时恒为假"——**错的**，写入就在被我滤掉的那个文件里
  （`applyEffects` 的 `character_state` / `relationship` 两支）。**今天第二次被自己的过滤器藏住答案。**
  ② 我先把这条说成"作者打错字会静默**开错分支**"——**也过头了**：实测读写同规则 ⇒ **无错配**，
  真正残留的只是"作者多写的第 4 段被静默忽略" + 跨族不一致。
  ⇒ 教训：**先量读写两侧、再定性**；过滤器要先确认它没把答案藏起来再下结论。
- **2026-10-01 20:1x 第四十五批之后（键语法 + 写读往返那一批）**：
  `pnpm gates` **0**（14 道）、单测 **703 passed + 1 skipped**（core 140 → **143**、axs 94、editor-core 186、web 241、admin 39）、
  **后端 `uv run pytest -q` 226 passed**（未变，本批无 Python 改动；7.96s、退出码 0）、
  `pnpm e2e:desktop` **37 passed** 退出码 **0**、`pnpm e2e` **50 passed** 退出码 **0**、
  `git diff --check` **0 行**、`.e2e-lock` 不存在。
  条件这一族现有**五份**判据：TS 自己 37 条 + 跨实现向量三份（`compare` 31 / `matcher` 21 / `families` 7+分叉绊线）
  + **键语法与写读往返一份**（`keyGrammar` 6 + `roundTrip` 8）。
- **2026-10-01 19:4x 第四十四批之后（`character_state` 键格式那一批）**：
  `pnpm gates` **0**（14 道）、单测 **700 passed + 1 skipped**（core 133 → **140**、axs 94、editor-core 186、web 241、admin 39）、
  **后端 `uv run pytest -q` 219 → 226 passed**（8.11s、退出码 0）、
  `pnpm e2e:desktop` **37 passed** 退出码 **0**、`pnpm e2e` **50 passed** 退出码 **0**、
  `git diff --check` **0 行**、`.e2e-lock` 不存在、stash **0**。
  条件这一族现有**四份**判据：TS 自己 37 条 + 跨实现向量三份
  （`compare` 31 / `matcher` **21** / `families` 7 条清单 + 两端分叉绊线）。
- **2026-10-01 18:0x 第四十三批之后（族支持清单那一批）**：
  `pnpm gates` **0**（14 道）、单测 **693 passed + 1 skipped**（core 83 → **133**、axs 94、editor-core 186、web 241、admin 39）、
  **后端 `uv run pytest -q` 214 → 219 passed**（+5 来自 `test_condition_family_support.py`，5.33s、退出码 0）、
  `pnpm e2e:desktop` **37 passed** 退出码 **0**、`pnpm e2e` **50 passed** 退出码 **0**、
  `git diff --check` **0 行**、`.e2e-lock` 不存在、stash **0**。
  条件这一族现在有**四份**判据：TS 自己 37 条 + 跨实现向量三份
  （`compare` 31 / `matcher` 14 / `families` 7 条清单 + 两端的分叉绊线）。
- **2026-10-01 17:3x 第四十二批之后（匹配层向量那一批）**：
  `pnpm gates` **0**（14 道）、单测 **690 passed + 1 skipped**
  （core 83 → **130**（匹配层 +15）、axs 94、editor-core 186、web 241、admin 39）、
  **后端 `uv run pytest -q` 199 → 214 passed**（+15 来自 `test_condition_matcher_vectors.py`，7.00s、退出码 0）、
  `pnpm e2e:desktop` **37 passed** 退出码 **0**、`pnpm e2e` **50 passed** 退出码 **0**、
  `git diff --check` **0 行**、`.e2e-lock` 不存在、stash **0**。
  条件求值这一族现在有**三份**判据在守：TS 自己的 37 条 + 跨实现向量两份
  （`compare` 31 条 / `matcher` 14 条，每份都被两端各跑一次）⇒ **合计 82 条、两端同跑**。
- **2026-10-01 17:0x 第四十一批之后（跨实现共享向量那一批）**：
  `pnpm gates` **0**（14 道；`[doc-citations]` 已判定 **209**）、`check:apibase` 未跑（本批未触及）、
  单测 **675 passed + 1 skipped**（core 83 → **115**（+32 共享向量）、axs 94、editor-core 186、web 241、admin 39）、
  **后端 `uv run pytest -q` 199 passed**（167 → **199**，+32 来自新建的 `test_condition_vectors.py`，
  8.68s、退出码 0）、`pnpm e2e:desktop` **37 passed** 退出码 **0**、`pnpm e2e` **50 passed** 退出码 **0**、
  `git diff --check` **0 行**、`.e2e-lock` 不存在、stash **0**。
  这一批**新增了一个跨语言判据**，所以后端 pytest 从"上下文里的背景数字"变成**链上的一等读数**——
  上一轮那 8 条编译器的免 DB 差分是手工探针，这一批起同样的问题有 pytest 守着。
- **2026-10-01 16:3x 第四十批之后（redo 失败原因那一批）**：
  `pnpm gates` **0**（14 道；`[doc-citations]` 已判定 **207**、`[file-size]` 349 文件 0 越线）、
  单测 **643 passed + 1 skipped**（core 83、axs 94、**editor-core 165 → 186**、web 241、admin 39）、
  `pnpm e2e:desktop` **37 passed** 退出码 **0**、`pnpm e2e` **50 passed** 退出码 **0**、
  `git diff --check` **0 行**、`.e2e-lock` 不存在、stash **0**。
  这一批改的是 `UndoRedoResult` 这个**导出类型**（加了一个可选字段），所以除了两套 e2e 还跑了
  `tsc -b`（加法式改动不能靠 vitest 验形状）。
- **2026-10-01 14:4x 第三十九批之后（素材 ref 契约那一批）**：
  `pnpm gates` **0**（14 道；`[doc-citations]` 已判定 **209**、`[file-size]` 349 文件 0 越线）、
  单测 **641 passed + 1 skipped**（core 83、axs 94、**editor-core 165 → 184**、web 241、admin 39）、
  `pnpm e2e:desktop` **37 passed** 退出码 **0**、`pnpm e2e` **50 passed** 退出码 **0**、
  `git diff --check` **0 行**、`.e2e-lock` 不存在、stash **0**。
  这一批**产品代码一行未动**（只改两句契约措辞 + 加一条判据），但仍跑了两套 e2e：
  `ref` 形态是导入链与素材显示的共同底座，改契约文字也要确认没有连带影响。
- **2026-10-01 14:2x 第三十八批之后（列表顺序那一批）**：
  `pnpm gates` **0**（14 道；`[doc-citations]` 已判定 **210**、`[file-size]` 349 文件 0 越线）、
  单测 **639 passed + 1 skipped**（core 83、axs 94、**editor-core 165 → 182**、web 241、admin 39）、
  `pnpm e2e:desktop` **37 passed** 退出码 **0**、`pnpm e2e` **50 passed** 退出码 **0**、
  `git diff --check` **0 行**、`.e2e-lock` 不存在、stash **0**。
  这一批**尤其必须重跑 e2e**：`memoryPools` 只被 Memory provider 用，而 `e2e:desktop` 的宿主
  正是 `?storage=memory`（`desktop-http.spec.ts` 里 3 处 `page.goto("…?storage=memory")`），
  所以改的是 e2e 实际跑的那条路径。
  一处**文档自查**：线索表的表头写"10 条"而表体还是 11 行——过滤串没匹配上（我按带反引号的
  `listItems`/`listScenes` 去找，而行内其实是 `listItems/listScenes`）⇒ 计数与表体对不上，
  已核正为 10。**登记表自己的计数漂了，比表体多一条更容易误导下一个人。**
- **2026-10-01 14:0x 第三十七批之后（成就 key 唯一那一批）**：
  `pnpm gates` **0**（14 道；`[doc-citations]` 已判定 **211**、`[file-size]` 349 文件 0 越线）、
  单测 **637 passed + 1 skipped**（core 83、axs 94、**editor-core 165 → 180**、web 241、admin 39）、
  `pnpm e2e:desktop` **37 passed** 退出码 **0**、`pnpm e2e` **50 passed** 退出码 **0**、
  `git diff --check` **0 行**、`.e2e-lock` 不存在、stash **0**。
- **2026-10-01 13:5x 第三十六批之后（舞台排序号那一批）**：
  `pnpm gates` **0**（14 道；`[doc-citations]` 已判定 **211**、`[file-size]` 349 文件 0 越线、
  `[desktop-seams]` 真断言合计 99）、单测 **635 passed + 1 skipped**（core 83、axs 94、
  **editor-core 165 → 178**、web 241、admin 39）、
  `pnpm e2e:desktop` **37 passed** 退出码 **0**、`pnpm e2e` **50 passed** 退出码 **0**、
  `git diff --check` **0 行**、`.e2e-lock` 不存在、stash **0**。
  一处**自己打进注释的乱码字符**（`COUNT(*` 后面粘进一个坏字节）在插入判据时被自己发现并修掉——
  它不影响编译，只会让那行注释读起来像坏掉。
- **2026-10-01 13:2x 第三十五批之后（`.axsp` 跨机那一批）**：
  `pnpm gates` **0**（14 道；`[doc-citations]` 已判定 **211**、`[file-size]` 349 文件 0 越线）、
  单测 **632 passed + 1 skipped**（core 83、axs 94、**editor-core 165 → 176**、web 241、admin 39）、
  `pnpm e2e:desktop` **37 passed** 退出码 **0**、`pnpm e2e` **50 passed** 退出码 **0**、
  `git diff --check` **0 行**、`.e2e-lock` 不存在、stash **0**。
  这一批动的是 `.axsp` 容器解析与素材引用分类，都在**导入链**上，所以两套 e2e 必须重跑。
  **一处 `tsc -b` 中途红**：我给 `axsp.test.ts` 插入新 `it` 时把原来那行 `const noId = …` 复制成了两行，
  esbuild 直接报语法错（vitest 与 gates 都在它之后，没跑到）⇒ 删掉重复行。
- **2026-10-01 12:2x 第三十四批之后（editor-core 那一批）**：
  `pnpm gates` **0**（14 道；`[file-size]` 349 文件 0 越线、`[doc-citations]` **已判定 216**、`[labels]` 205 文件裸标签 0、
  `[dispatch]` 30 函数 `after-guard=26 / positive-block=4`、`[desktop-seams]` 真断言合计 99）、
  单测 **629 passed + 1 skipped**（core 83、axs 94、**editor-core 165 → 172**、web 241、admin 39）、
  `pnpm e2e:desktop` **37 passed** 退出码 **0**、`pnpm e2e` **50 passed** 退出码 **0**、
  `git diff --check` **0 行**、`.e2e-lock` 不存在、stash **0**。
  **两处 `tsc -b` 中途红已归因**（vitest 全绿放行，本会话第 6 次撞上"vitest 只剥类型"）：
  ① `journal.ts` 的 `current` 修完变成未读参数 ⇒ 改名 `_current` 并写明"别再把 `current` 写回 future，那正是空操作的成因"；
  ② 我在判据里把 `draftToAxs` 当成单参函数调用（实际签名 `(draft, roles)`），改前先看了签名才没继续错。
  那一批的 e2e 必须重跑：`journal.ts` / `canvas.ts` / `axsp.ts` 都在点击层后面（Writer 轨与"在 Writer 中打开"那条链）。
- **2026-10-01 11:0x 复审续（第三十二、三十三批之后）**：
  `pnpm gates` **0**（14 道；`[doc-citations]` 已判定 **198**、`[labels]` 205 文件裸标签 0、
  `[dispatch]` 30 函数形状 `after-guard=26 / positive-block=4`、`[desktop-seams]` 真断言合计 99）、
  单测 **622 passed + 1 skipped**（core 83、**axs 90 → 94**、editor-core 165、web 241、admin 39）、
  `pnpm e2e:desktop` **37 passed** 退出码 **0**、`pnpm e2e` **50 passed** 退出码 **0**、
  `git diff --check` **0 行**、`.e2e-lock` 不存在、stash **0**。
  `axs` 那一刀动的是**解析器的 id 分配**，而解析器直接喂 Writer 面板，所以两套 e2e 都重跑而不是只看 gates。
- **2026-10-01 10:2x 复审之后的收口认证（六条链，退出码逐条单独取）**：
  `pnpm gates` **0**（14 道；`[file-size]` 349 文件 0 越线、`[doc-citations]` **已判定 197**／越界 5 全在册／不存在 0、
  `[desktop-seams]` 9 个接缝：有判据 6（真断言合计 99）／在册 3、`[publish-target]` 残差 4 全在册、lint 0 warning）、
  `pnpm check:apibase`（候选判据，未进链）**0**、
  单测 **618 passed + 1 skipped**（core 83、axs 90、editor-core 165、**web 241**（229 → 241，本轮 +12）、admin 39）、
  `pnpm e2e:desktop` **37 passed** 退出码 **0**（1.6m，零后端）、`pnpm e2e` **50 passed** 退出码 **0**（1.1m，自起 uvicorn）、
  `git diff --check` **0 行**、`.e2e-lock` 跑完不在、stash **0**。
  工作区边界：`git status --porcelain` = **64 ` M` / 17 ` D` / 28 `??`**。
  **三引用仍重合**（HEAD **==** `origin/desktop` **==** tag = `1b9ca06`），
  但**复核命令要写 `git rev-parse desktop-handoff-20260929^{commit}`**：那是 annotated tag，
  不带 `^{commit}` 时 `rev-parse` 给出的是**标签对象**的 SHA（`dbf1dde`）而不是提交，
  于是"三引用不重合"的假警报会在下一次复核里再出现一次（本轮第一次量就踩了，与 §5 那条
  "拿 basename 解析简写路径"属于同一类：**量法错了，读数就反着走**）。
  **中间一次红已归因**：`tsc -b` 报两处类型错（`StorageResult` 未收窄、测试里 `stmts` 只声明了 `sql` 键），
  而 vitest 全绿放行——**本会话第 5 次撞上"vitest 只剥类型"**。改完仍 241。
  另有一处**判据自身失效**已一并改写：`storage.test.ts` 那条「新角色 id 不等于包内 id」
  原先靠 `MemoryStorageProvider.nextId` **跨前缀共用一个计数器**的巧合才绿，
  而复审把 `createProject` 提到导入最前之后两个 provider 发出了同一个 `char-0002`——
  **契约没变，变的是夹具**。现在夹具用显式包内 id，断言量的是"接收方分配了新身份"这件事本身。

- **2026-10-09 09:52 关掉上一批登记的 `check:dispatch` 面缺口（先量误报，再扩面）**：把门禁原样指向 `shared/api/draftDispatch.ts` 量一次 ⇒ **两条导出 async 函数全被误报**（这一族的本地支是 `await draftDeps.model(...)` + `rulesDraft(...)` 保底，不是调 Provider），
  所以**扩面与放宽证据同一次做**。本地证据现在认三条：真 `await provider` / `await 注入的本地能力(...)`（`await \w*[Dd]eps\.(?!remote\b)\w+(`）/ 规则保底；**`remote` 显式排除**。
  读数：`5 文件 / 30 函数 / after-guard=26、positive-block=4` ⇒ **`6 文件（storage 5 + api 1）/ 32 函数 / after-guard=26、positive-block=6`**——旧面 30 条形状一条都没变，这是"扩面不带回归"的证据。
  牙齿两条都用假目录树 `cd` 进去跑（产品代码零改动）：本地支改成只 `await ...remote(` ⇒ **FAIL 1** 点名两函数；面二文件消失 ⇒ **FAIL 1** 报"这张面正在静默消失"（面只能显式缩短）。
  上一批那句"留下一刀"到此收口。探针与副本已删（`/tmp/dprobe`、`/tmp/gate-probe.mjs`）；本轮无新文件 ⇒ §6 显式 add 清单不变（`??` 41 项，09:47 与 09:51 两次相同）。
  末轮（09:52）：`gates` **0**（15 道，`[dispatch] OK 6 文件 / 32 函数`）、`check:dispatch` 单独退出码 **0**、牙齿两条退出码单独取均为 **1**、`git diff --check` **0** 行、`[doc-citations]` OK、`HEAD 1b9ca06` 未动。

- **2026-10-09 09:43 消费者面定义修正（第四十五批）：分派层不能被整目录排除**：`cloud:callmap` 过去把 `apps/web/src/shared/api/` 全排除出消费者，
  结果把该层里的**分派口** `draftDispatch.ts` 也排掉了 ⇒ `POST /editor/ai/prose-to-script` 被报成「死面・读者 0」，而它其实是"桌面走本地/规则保底、云端只是 fallback"的活通路。
  改成只排除"定义自身 + 传输层 `client.ts` + barrel `index.ts`"，并把 `draftDispatch.ts` 认成分派口文件。
  **变化**：六档 `12/9/34/26/6/8` ⇒ **`11/9/34/27/6/8`**（相加 95）、消费者 234 → **253** 文件、读者面 450 → **471**；
  **不变**：绕过 34 ⇒ 桌面真会打出仍是 **29**；守卫面 40 条读数一字不变；死面剩余 **11** 条读者仍全为 0、后端路由 **10 在 / 1 不在**（`updateProjectNode` 那条指错的仍在册）；`check:dead-surface` 基线仍 10 个模块。
  正对照首位现在是 `aiApi.proseToScript 读者=1`（把修正本身放在对照位上，退化会立刻红）。
  **另登记一道门禁面缺口（不在本批动）**：`check:dispatch` 只遍历 `shared/storage/` 且按 `<域>Saves.ts` 命名 ⇒ `shared/api/draftDispatch.ts` 不在面内；
  它有同名测试 `draftDispatch.test.ts`（不是零判据），但"每个导出函数都有本地支"这条判据今天挡不到它——**扩面前要先量这条判据套在它身上会不会误报**（它的导出形状与 `*Saves` 不同形）。
  末轮（09:43）：`cloud:callmap` **0**、`check:dead-surface` **0**、`gates` **0**（15 道）、`git diff --check` **0** 行。

- **2026-10-09 09:34 第 15 道门禁 `check:dead-surface` 上线（死表面棘轮），并抽出公共域 `scripts/source-graph.mjs`**：`gates` 链 **14 → 15 道**。
  判据只取闭包档（从 `main.tsx` 走 import 闭包；名字档会被同名本地组件骗，上一批已实测），被测试 import 的模块不算死。
  基线 10 条与 `cloud:callmap` 第十一段的 10 条**集合完全相同**（按路径比对，命令算的）。
  三条腿逐条验过且退出码单独取：现状 OK **0**（`闭包外 10 个模块全部在册；面 285、闭包内 245`）、临时塞一个无人 import 的探针文件 ⇒ **FAIL 1** 并点名、删掉即回 OK（该目录 `git status` 干净）、往基线塞一条已不存在的条目 ⇒ OK 但提示"已摘除 1 个 ⇒ 基线该缩短 `--update`"、从 `/tmp` 跑 ⇒ `UNRELIABLE` 且退出码 **1**。
  重构工具自身的等价性用金样 `diff` 证明：改前改后输出**只差 1 行**（读者面 448 → 449，因为我新增的 `source-graph.mjs` 自己进了被扫的面——是口径真实变化，不是判据坏）。`cloud-callmap.mjs` 从 873 行降到 **718** 行。
  **顺带抓到 README 的一处当前状态谎话**：`pnpm gates` 那行原写"共十一道"，而链上是 15 道（citations / publish / seams 三道都漏在文字外）。现在该行以 `package.json` 为准并列出 15 个步骤名；历史日志里的"14 道"是当时事实，不重写。
  末轮（09:34）：`gates` **0**（**15 道**；`[dead-surface] OK`、`[doc-citations]` 已判定 216 / 越界 5＝基线数、`[desktop-seams]` 9 / 有判据 6 / 真断言合计 99、`[file-size]` 349 文件 0 越线）、单测 **706 passed + 1 skipped**、`cloud:callmap` **0**、`git diff --check` **0** 行、`.e2e-lock` 不在、`HEAD 1b9ca06` 未动、`??` 41 项（其中 3 份是本轮新文件，见 §6 显式 add 段的 09:34 复量）。

- **2026-10-09 09:22 死表面普查上线（`cloud:callmap` 第十一段）**：从真入口 `main.tsx` 走 import 闭包，面 = `apps/web/src` 的 285 个 .ts/.tsx ⇒ 闭包内 245 / 闭包外 **10**（其中"只有测试在读"= **0**）。
  10 个真死模块含**两个零消费者 barrel**（`shared/api/index.ts`、`shared/hooks/index.ts`）与 `usePlayer.ts`（那 6 条 `/play/sessions*` 端点的唯一调用者）、`GlossaryEditor.tsx`（#58 的机器版确认）、`DiscoverStatsBar.tsx`、`BrandIconMark/ItemCard/ItemCreateDialog/RadarChart/SceneCreateDialog.tsx`。
  另档"闭包内但除 import 外全仓零引用"= 2（`PromptExport.tsx`、`ui/DraftIndicator.tsx`），**只列名不判死**——因为它是名字判据：实测 `shared/components/ItemCard.tsx` 没人用，而 `ItemsPage` 里有个**同名本地组件**在渲染，名字判据会被骗、闭包判据不会。
  四处"给活代码贴死标签"的错全部当场修掉并逐条读回代码验过（`export default function App(){` 被当成 import 语句吞掉 `<StudioLayout />`、只看默认导出漏掉 `PublicLayout` 的具名导出、注册表/改名 lazy 两种形状、`allPool` 的 TDZ）。
  脚本内置对照组（`hooks/index.ts` + `usePlayer.ts` 必须真死、`ProjectListPage` 三档都不许出现），不成立就 `UNRELIABLE` 退出 1。
  留债一条：脚本已 **873** 行而 `[file-size]` 的面不含 `scripts/`（实测），暂未拆 `scripts/lib/`——只有一个消费者时抽象是猜的。
  末轮（09:24）：`cloud:callmap` **0**（连跑两次逐字节相同）、`gates` **0**（14 道）、`[doc-citations]` 已判定 216 / 越界 5＝基线数、单测 **706 passed + 1 skipped**、`git diff --check` **0** 行、`.e2e-lock` 不在、`HEAD 1b9ca06` 未动。

- **2026-10-09 09:06 宿主可达性上线（`cloud:callmap` 第十段）+ 登记一条零消费者 barrel**：44 处未守卫调用点 ⇒
  宿主不早退（保守上界）**21** / 不在任何路由闭包 **12** / 只在桌面早退的宿主页 **9** / 叶子组件全仓无渲染点 **2**（相加 44）；
  **（复量 2026-10-09 第四十七批 ⇒ 21/12/9/2 与下面那对 12/23 同时作废：改成 27/0/9/8 与 6/29。
  走不到的那 12 条端点里有 6 条其实**是**桌面走得到的，被 `lazy\(\(\)` 那条严正则藏起来了；
  真走不到的只剩 `usePlayer.ts` 那 6 条。历史文本不重写，批注挂在这里。）
  端点级 35 条里 **12 条所有未守卫点桌面都走不到、23 条至少一处走得到**。判成"整页早退"的路由页实测 **3**（dashboard / /discover / /profile）。
  **新登记（不处置）**：`apps/web/src/shared/hooks/index.ts` 零消费者（全仓没有 `from "@/shared/hooks"`），而它 `export *` 出来的 `usePlayer.ts` 是
  **6 条 `/play/sessions*` 端点的唯一调用者** ⇒ 这 6 条在任何界面都走不到（同时是 S13-3 判死与 S13-6「后端为谁服务」的输入）。
  四处判据缺陷都由"把机器结论逐条读回代码"抓出：遮蔽口径（抽 import 不能用连字符串一起遮的那份，否则 0 条路由——非零守卫第一次救场）、
  `<Route index>` 无 path 漏掉 PlayerPage（漏在可达那一侧）、叶子组件名拿文件名当身份（`UserContext` ≠ `UserProvider`）、
  `earlyReturn` 宽松正则把 `load` 回调里的 `if` 当整页早退（**过度信任的方向，优先修**）。
  限度：import 闭包 ≠ 渲染可达，**消费者级条件渲染不认**（`AppHeader.tsx:69` 的 `showSearch && !isLocalOnlyDeployment() && <GlobalSearch />` 就是这种），故计数偏保守。
  末轮（09:06）：`cloud:callmap` **0**（连跑两次逐字节相同）、`gates` **0**（14 道）、单测 **706 passed + 1 skipped**、`git diff --check` **0** 行、`.e2e-lock` 不在、`HEAD 1b9ca06` 未动。

- **2026-10-09 08:53 死面 12 条补齐两侧证据（`cloud:callmap` 第九段：读者 × 后端路由）**：读者面 = `apps`+`packages`+`e2e`+`scripts` 共 **448** 文件（匹配跑在剥注释与字符串之后、排除 `shared/api` 自身），后端 = `backend/app` **107 个 .py** 解析出 **148** 条路由。
  读数：12 条死面**前端读者全部为 0**，后端路由 **11 在 / 1 不在**。
  "不在"那条是**新登记的缺陷**：`projectApi.updateProjectNode` 指向 `PUT /editor/projects/{projectId}/nodes/{nodeId}`，后端对 node 的 PUT 只有带 scenes 段的那条 ⇒ **既零读者又指错**；今天无用户影响，摘不摘仍归待决 ②（没替自己拍板）。
  「测试」列的恒 0 做成了机器前提：调用过任何 `xxxApi.method(` 的测试/e2e 文件数 **= 0** ⇒ 判死这批不会碰坏任何测试，反面是 api 层在测试层零覆盖、判错没有回归网。
  正对照三条（`characterApi.create` 2 / `update` 2 / `listUser` 3）证明读者匹配器不是恒零；"在"那一侧手工验过 `/{project_id}/nodes`、`/edges`、`/roles` 三条 POST 确实存在。
  末轮（08:53）：`cloud:callmap` **0**（连跑两次逐字节相同）、`gates` **0**（14 道；`[doc-citations]` 已判定 211 / 越界 5＝基线数、`[desktop-seams]` 9 接缝／有判据 6／真断言合计 99、`[file-size]` 349 文件 0 越线）、单测 **706 passed + 1 skipped**（`awk` 从日志加出）、`git diff --check` **0** 行、`.e2e-lock` 不在。
  流程错误留档一次：`Edit` 漏传 `old_string` 把 `const root = process.cwd();` 整行吃掉，`node --check` 仍通过、跑起来才 `ReferenceError` ⇒ **改完脚本必须真跑一次**，语法检查接不住"声明被删"。
  同轮把 `REFACTOR_DESKTOP.md` 的续做台账补到**第五十次**（第三十四…第四十一批这条普查数据链的"为什么"此前只在 HANDOFF §4 有状态、没有理由记录）；产品代码自第三十一批后一字未改。

- **2026-10-09 08:44 「绕过」按调用点减掉壳守卫（`cloud:callmap` 第八段）**：扫描面「绕过 + 混合」**40 条 / 调用点 53 处** ⇒ 有守卫 **9**（S1 同块 7 / S2 同句 0 / S3 早退 2）/ 无守卫 44；端点级 全有守卫 5 / 部分 4 / 全无 31（相加 40）。
  **只看绕过 34 条：5 条已被壳守卫显式降级、29 条桌面真会打出去** ⇒ S13-3 的候选分母从 34 更正为 **29**。
  判据按调用点算而非按文件算（`useRelations.ts` 五条查询只有 `presets` 带 `enabled:`）；两次变异各证一头：关 S1 ⇒ 有守卫 9→2，去掉 S3 的直接子语句限制 ⇒ 9→**11**（把 `versionApi.get/rollback` 错判成安全，**过度信任才是危险方向**）。
  S2 在本面 0 命中，故把混合面纳入扫描，并用合成样本正反各两条验过（`if (guard) {api.x()}` 判 S2、块头无守卫与守卫在隔壁函数都判 `null`）。
  同一轮修掉两处自家口径分叉：词元并排表由 substring 包含改成与三态共用的 `matchOf`；可达性与守卫都改读全量 `hitFiles`（`files` 只留 4 个展示）。
  本轮未提交，只动 `scripts/cloud-callmap.mjs` 与文档，产品代码一字未改。
  末轮（08:46）：`cloud:callmap` **0**（连跑两次输出逐字节相同）；`gates` **0**（14 道；`[doc-citations]` 已判定 211、越界 5＝基线数、`[desktop-seams]` 9 接缝／有判据 6／真断言合计 99、`[file-size]` 349 文件 0 越线）、
  单测 **706 passed + 1 skipped**（core 143 / axs 94 / editor-core 189 / web 241+1skip / admin 39，`awk` 从门禁日志加出来的）、`git diff --check` 0 行。

- **2026-10-09 08:31 「绕过」34 条按本地承载 + 可达性归类（`cloud:callmap` 第七段）**：**22 无本地承载 / 6 仅父资源承载 / 4 无承载·仅 Discover / 1 自身承载·仅 Discover / 1 自身承载只差分派**（`awk` 数过相加 = 34，与「绕过」档总数一致）。
  两处口径比上一批更硬：**词元改下划线全等**（不再是包含匹配——08:21 那条记录的 `play`→`player_achievements` 假阳性，这一轮不再只当注释里的限定，直接改判法），
  **只有路径末段命中才算"该资源自身有承载"**，父段命中记成"子资源无专属表"。
  可达性也是机器判的：调用者集合是否全部落在 `features/discover/` 下 ⇒ 桌面结构性无入口，不靠印象。
  `getCharacterStates` 是**词元全等也挡不住的语义假阳性**（会话态 ≠ 角色记录），留在表里当作"正向匹配必须回代码"的活例；
  第三十六批那三处分类器缺陷（`getStorageProvider` 未被认成分派信号、符号归属只取每文件第一个 `xxxApi`、HTTP 实现文件被当界面绕过点）不在本批，那批已各自修好。
  仍未提交；本轮只动 `scripts/cloud-callmap.mjs` 与文档，产品代码一字未改。

- **2026-10-09 08:21 S13-3 的两侧事实并屏（`cloud:callmap` 新增资源→表/契约段）**：**13 张本地表 / 39 个契约方法**对 95 条端点的资源词元做包含匹配，只给依据不下结论。
  最有价值的一条是**关系（relation）**：库里没有 `character_relations` 表、契约里也没有，**但 `characters.character_data` 是 JSON 列且运行时条件求值与 `remapCharacterIds` 都在读 `relationship` 键**
  ⇒ 读侧已有本地承载、缺的只是编辑写侧（`api/relations.ts` 6 处 `apiClient`、零分派口）。
  另一侧：`session`（试玩会话）、`version`、`user`、`identity`、`comment`、`report`、`tag`、`search`、`llm` 词元**表与契约皆无**。
  限定同批写进脚本头与 §4：词元匹配有假阳性（`play`/`player` 会匹到 `player_achievements`）与畸形单数（`stories→storie`），
  所以"匹配不到"只能当线索、"匹配到了"必须回代码核对。

- **2026-10-09 08:17 普查的桌面臂配置改正（拆掉"空载 0"）**：桌面臂从"只注入标记"改成**标记 + `?storage=memory`**，
  并补上试玩路由 ⇒ `ROUTES=9 UNMOUNTED=0`、`DESKTOP_UNIQUE=0`、`BROWSER_UNIQUE=11`（正对照）。
  **（复量 2026-10-09 第四十七批：那 9 条是手抄的，覆盖面是假的——解析成 25 条后桌面臂当场量到 7 个云端调用点，
  全部来自 discover 详情族；补闸门后复量 `ROUTES=25 / DESKTOP_UNIQUE=0 / BROWSER_UNIQUE=20 / UNMOUNTED=0`。见同日第四十七批。）
  「装载面桌面零 `/api/v1`」这句话现在配得上一个能读写的本地库；点击面仍由 `cloud:callmap` 与 e2e 管，三层不互相冒充。

- **2026-10-09 08:09 「绕过面」再切一刀（`cloud:callmap` 升到六档）**：用"有没有分派口引用这个函数"把上一批的"直连云端 34"分开——
  六档读数 **12 死面 / 9 仅实现侧 / 34 绕过（无分派口引用）/ 26 已有分派口引用 / 6 混合 / 8 调用者已接本地库**，相加 = **95** 与总数一致。
  抽查对得上：`ginkgoApi.*`、`itemApi.*` 归到"已有分派口引用"（`achievementDefs.ts` / `playerSaves.ts` / `assetPoolSaves.ts` 点名），
  `commentsApi.*` / `creatorApi.*` / `discoverApi.*` 归到"绕过"——这批才是 S13-3 要逐个判死或判留的对象，现已可直接列名。

- **2026-10-09 08:05 云端面普查机械化（`pnpm cloud:callmap`）**：**95 个端点定义** → 死面 **12** / 仅 HTTP 实现侧 **9** / 直连云端 **34** / 混合 **8** / 已有本地支 **32**（相加 = 95）。
  这五档相加过了才敢用；死面 12 条全名在 §4 第三十五批（判死的最便宜一档，但"死面 ≠ 立刻可删"，先数活读者）。
  脚本的 `UNRELIABLE` 腿见过红（退出码 1），还原 `diff -q` 一致。

- **2026-10-09 07:58 普查复跑（S13-3 的分母已按路由量化）**：`pnpm check:http-inventory` 退出码 **0** ——
  桌面臂 8/8 路由挂载、**唯一云端调用点 0**；浏览器臂（正对照）**9 个**唯一端点，全部 abort 在本地、没有请求打到别人起的后端。
  这 9 条端点即 web 分支退役时要点名的消费者清单（见 §4 第三十四批）。两面失效都见过红（摘标记 ⇒ REGRESSION 1、正对照变 0 ⇒ UNRELIABLE 1），还原 `diff -q` 一致。

- **2026-10-09 07:51 E43 补形状后的两样本**：`pnpm e2e:desktop` **38 passed** 退出码 **0**、`-g "E43"` 单跑 **1 passed** 退出码 **0**、
  e2e 的 `tsc -p tsconfig.e2e.json --noEmit` **0**、`.e2e-lock` 跑完不在。
  这一批的实质不是"又跑绿一次"，而是**用测量否掉了我自己上一批写下的两条推断**：
  `【示范】序章·交汇` 是导入副本自己的标题（不是顶部条带）；空态列表页挂 `MutationObserver` 观察 2.4s 得 **0 次 DOM 变异**、
  `.animate-pulse` 计数 **0** ⇒ **"列表持续重渲染"没有证据**，`not stable` 只挡点击不挡计数，所以卡片计数（含 `toHaveCount(0)` 前置对照）加了回来。
  同时删掉一条伪判据（同一句"还没有剧本"在多个 section 渲染，它的有无测的是标签页布局）。详见 §4 第三十三批。

- **2026-10-09 06:55 点击层复跑（E43 上线之后）**：`pnpm e2e:desktop` **38 passed** 退出码 **0**（原 37 + E43；跑之前先用 `curl :5174/.../axspImport.ts | grep -c remapNodeIds = 2` 证明那支 9 天龄的 vite serve 的是今天的代码），
  e2e 的 `tsc -p tsconfig.e2e.json --noEmit` **0**，`.e2e-lock` 跑完不在。**浏览器那一半（`pnpm e2e`）刻意没跑**：
  8000 上是别人起的 uvicorn 且连**开发库**，复用会把测试数据写进你的库——这笔读数仍引 10-01 的 05:30 那次（50 passed），不要当今天。
  新登记的观察见 §4 第三十二批 ⑤（【示范】条带在 Playwright 下永不稳定 ⇒ 列表疑似持续重渲染；卡片不是锚点）。

- **2026-10-09 06:37 复跑（第三十一批＝⑫ 交付之后）**：`pnpm gates` 退出码 **0**（14 道）、
  `[desktop-seams] OK —— 桌面接缝 9 个：有判据 6（真断言合计 **99**）、缺测试 3、基线在册 3`、
  `[doc-citations] OK —— 已判定 209、越界 5（基线 5 条在册，非本轮新增）`、`tsc -b`(web) 与 editor-core `tsc --noEmit` 各 **0**、
  `pnpm --filter @axiforge/web exec vitest run src/shared/storage` **167 passed + 1 skipped**。
  **两套 e2e 本轮刻意没跑**：端口 8000/5174/5274 上有一支 **8 天龄的 dev 栈**（`uvicorn app.main:app` + 三个 vite）在别人手上，
  非 CI 下 `reuseExistingServer` 会让我的套件测到别人的代码状态 ⇒ 点击层读数仍引 10-01 的 05:30 那一次，不要当今天。
  **本轮改的是产品代码**（`axspImport.ts` 的导入通路 + 新增 `remapNodeIds`），所以下一会话若要取点击层数，得先把那支 dev 栈让开再跑。

- **2026-10-01 05:32 自造陈旧引用普查（一次性审计，脚本落 `/tmp` 不进仓库）**：动机是 `check:citations` 只判"存在 + 在范围内"，
  判不了"那一行还是不是当初那段代码"（内容层档已按 38% 误报否掉，见 §5 之前的批次）——所以我今天改过的文件里，**行号搬家但仍在范围内**的引用会静默变假话。
  做法：把 `git status` 里今日改过的 `.ts/.tsx/.json` 收集成候选集，扫所有 `.md` 里的 `路径:行号`，命中候选集就把**被引行的实际内容**打出来给人读。
  读数 **89 处命中**，逐类分诊：绝大多数是历史日志里刻意标注的"旧 `X.ts:行`"（按"历史文本不重写"保留）；
  **1 处是我今天自己造成的真失效**——第三十批给 `main.tsx` 加了一行 import，把挂载点从第 6 行搬到第 7 行，
  而 `REFACTOR_DESKTOP.md:2029` 还写着 `main.tsx:6`；已按 `grep -n createRoot` 的实际行号改成 **`main.tsx:7`** 并就地注明是谁搬的。
  同一处判定还顺手给那条 09:xx 的历史发现补了带日期追注（判据现已抽成 `shellSmokeGate.shouldRunDesktopSmoke()`）。
  **审计自己的两处失真也要如实记**：① 我按 basename 解析简写路径，于是 `storage/index.ts:139,143` 被误配到 `packages/axs/src/index.ts` 与 `packages/editor-core/src/index.ts` 并报 `<EOF>`；
  实读 `apps/web/src/shared/storage/index.ts` 第 **139**（DEV 说明行）与 **143**（`import.meta.env.DEV &&`）——**那条引用本来就是对的，假警报来自量法**。
  这正是在册那条"探针/普查脚本要自带『这次没跑成』的判据"的又一次兑现：**审计脚本的产出必须逐条读，不能当门禁结论用**。
  ② 89 这个数不是"缺陷数"，是"命中数"，分诊后真缺陷 1 条。复跑 `check:citations` 退出码 **0**。

- **2026-10-01 05:30 点击层与产物层复跑（`main.tsx` 是入口，改完必须重跑两套 e2e 而不是只看 gates）**：
  `pnpm e2e:desktop` **37 passed** 退出码 **0**（零后端，串行取码）、`pnpm e2e` **50 passed** 退出码 **0**（1.1m，自起 uvicorn），
  `.e2e-lock` 跑完自动不在；本轮 `e2e:desktop` **没有**复现那条已知 flaky 腿（066 定档前它仍不是"稳定全绿信号"，这次读数是一样本，形状记成 **37/0**）。
  产物层把 §4 第三十批那句"`main.tsx` 保持懒加载"从**断言**变成**测量**（`rm -rf apps/web/dist` 后重建，`build:web` 退出码 **0**）：
  入口 chunk 按 `dist/index.html` 取，是 `assets/index-D1fasm5k.js`——
  冒烟 grep 标记 `AXIFORGE-DESKTOP-STORAGE` 在入口 **0** 次、只落在 `assets/desktopSmoke-ObE4LQtt.js`；
  正对照：壳全局 `__TAURI_INTERNALS__` 在入口 **1** 次（证明抽出的判据确实静态进了入口，不是搜错了文件）。
  **一个别误读的细节**：入口 chunk 里能搜到 `smokeDesktopStorage` 这个词**次**——那是动态 import 的说明符/块名，不是冒烟本体；
  判"有没有被打包进去"要搜**只有实现里才有的字符串**（这里即那个 grep 标记）。
  另外 `__TAURI_INTERNALS__` 共出现在 3 个 chunk（`core` / `index` / `storage`），与 `isTauriEnvironment()` 在存储侧、新谓词在入口侧的分层一致。

- **2026-10-01 05:24 复跑（入口冒烟判据抽成有测试的模块 + 门禁形状补"读全局句柄"这一类）**：`pnpm gates` 退出码 **0**（14 道）、
  `[desktop-seams] OK —— 桌面接缝 9 个：有判据 6（真断言合计 94）、缺测试 3、测试未引用 0、无真断言 0、含恒真断言 0、基线在册 3`、
  `[doc-citations] OK 167 / 越界 3 / 基线 3`、单测 **606 passed + 1 skipped**（web 223 → **229**，新增 6 条全在 `shellSmokeGate.test.ts`）、`tsc -b` **0**、
  `git diff --check` **0 行**、`git status` **62 ` M` / 17 ` D` / 28 `??`**（新增两份文件都在面内，见 §6 显式 add 清单）。
  牙：谓词"简化"成存在性判断（正是注释警告过的那个写法）⇒ **3 条红**；`cp` 还原后 `diff -q` 一致、6 条复绿。明细见 §4 第三十批与 `REFACTOR_DESKTOP.md`「第四十七次续做」。

- **2026-10-01 05:13 复跑（`check:seams` 扩面之后）**：`pnpm gates` 退出码 **0**（14 道）、
  `[desktop-seams] OK —— 桌面接缝 8 个：有判据 5（真断言合计 83）、缺测试 3、测试未引用 0、无真断言 0、含恒真断言 0、基线在册 3`
  （新增两条在册都是 `apps/nexus/electron/`，理由里带可测面读数）、`[doc-citations] OK 已判定 167 / 越界 3 / 基线 3`、
  单测 **600 passed + 1 skipped** 未变、`git diff --check` **0 行**、`git status` **61 ` M` / 17 ` D` / 26 `??`**（探针 `packages/ui/src/__probe_shell.ts` 已删净、`ls` 取不到）。
  这一刀的牙是"扩面真接住了"：临时把壳耦合模块放进 `packages/ui/src` ⇒ FAIL 点名它、接缝 8→9；删净 ⇒ 回 8 且退出码 0。明细见 §4 第二十九批与 `REFACTOR_DESKTOP.md`「第四十六次续做」。

- **2026-10-01 05:06 复跑、05:07 文档改写后再复跑（第 14 道门禁补上第 3 层"有没有真断言"之后）**：`pnpm gates` 退出码两次都是 **0**（14 道；本轮改动落在 `check:citations` 的扫描面上，所以绿灯必须取改写后那一次——第二次 `[doc-citations] OK 已判定 167`，新增散文把可判引用从 165 推到 167，**越界仍 3、基线 3 条未动**，没拿 `--update` 绕白），
  `[desktop-seams] OK —— 桌面接缝 6 个：有判据 5（真断言合计 83）、缺测试 1、测试未引用 0、无真断言 0、含恒真断言 0、基线在册 1`；
  单测 **600 passed + 1 skipped** 未变（这一刀加的是判据强度不是测试数）、`git diff --check` **0 行**、`git status` **61 ` M` / 17 ` D` / 26 `??`**（探针已删净）。
  牙取过四腿：空壳测试 `#no-assert` 红、恒真断言 `#trivial-assert` 红且合计只 +1、注释里的断言仍算空壳、删净后 OK 0。明细见 §4 第二十八批与 `REFACTOR_DESKTOP.md`「第四十五次续做」。

- **2026-10-01 04:56 收口认证（六条链一次跑齐，退出码逐条单独取）**：
  `pnpm gates` **0**（14 道；**04:58 又整链复跑一次仍是 0**，取在全部文档改写之后）·
  `pnpm check:apibase`（候选判据，未进链）**0**·
  `pnpm test:unit` **600 passed + 1 skipped**（core 83、axs 90、editor-core 165、web 223、admin 39）·
  `pnpm e2e` **50 passed** 退出码 **0**（1.1m，浏览器半，自起 uvicorn）· `pnpm e2e:desktop` **37 passed** 退出码 **0**（1.6m，零后端）·
  `pnpm build:web` **0**（`✓ built in 291ms`）· `pnpm build:admin` **0**（`✓ built in 113ms`）·
  `pnpm check:desktop`（桌面壳 `cargo check`）**退出码 0**——这一条值得单记：它今天是**本地跑绿的**，而 CI 里仍然没有任何 desktop job，
  所以"桌面壳零 CI 信号"这条限度**没有因为这次跑绿而改变**（见 §6 定档清单第⑦条）·
  后端 `uv run pytest -q` **167 passed**（3.65s，退出码 0；480 条 warning 全是既有的 Deprecation 类，不判）。
  今天 e2e 两套的合计样本：`e2e:desktop` 五跑 1 红（36/1 那次即自动存档那一跳，机制在册）、其余 37 全绿；`e2e` 各跑均 50 全绿。
  工作区边界：`git status --porcelain` = **61 ` M` / 17 ` D` / 26 `??`**、stash **0**、`.e2e-lock` 不存在、`git diff --check` **0 行**、
  HEAD **==** `origin/desktop` **==** tag `desktop-handoff-20260929` = `1b9ca06`（未提交、未推送、未动 tag）。

- **2026-10-01 04:51 复跑（`assetRecords` 投影入判据之后）**：`pnpm gates` 退出码 **0**（14 道）、`pnpm test:unit` **600 passed + 1 skipped**
  （core 83、axs 90、editor-core 165、**web 223**（+7）、admin 39）、lint `Found 0 warnings and 0 errors`、`[desktop-seams] OK —— 6 个：有判据 5、缺测试 1、基线在册 1`、
  `[doc-citations] OK —— 已判定 167 / 越界 3 全在册`、`git diff --check` **0 行**、`.e2e-lock` 不存在、stash 0、三引用重合 `1b9ca06`。
  **产品代码一字未改**（三次变异的文件都以 `cp` 还原并 `git diff --stat` 验空）；本轮改动全是判据与文档。

- **2026-10-01 04:46 复跑（分派口补判据、接缝基线缩短之后）**：`pnpm gates` 退出码 **0**（14 道）、`pnpm test:unit` **593 passed + 1 skipped**
  （core 83、axs 90、editor-core 165、**web 216**（+4）、admin 39）、lint `Found 0 warnings and 0 errors`、
  `[desktop-seams] OK —— 6 个：有判据 5、缺测试 1、测试未引用 0、基线在册 1`、`git diff --check` **0 行**、`.e2e-lock` 不存在、stash 0、三引用重合 `1b9ca06`。
  本轮**产品代码一字未改**：三次变异都以 `cp` 备份原样还原，`git diff --stat apps/web/src/shared/storage/index.ts` 为空；e2e 未跑（分派口在两套 e2e 里都走 memory/HTTP 支，
  最近点击层读数仍是 04:28 那次的 37 passed）。

- **2026-10-01 04:38 复跑（第 14 道门禁 `check:seams` 上线之后）**：`pnpm gates` 退出码 **0**（**14 道**，含 `[desktop-seams] OK —— 桌面接缝 6 个：有判据 4、缺测试 2、测试未引用 0、基线在册 2`）、
  `pnpm test:unit` **589 passed + 1 skipped**（core 83、axs 90、editor-core 165、**web 212**（+5 来自 `assetContext.test.ts`）、admin 39）、lint `Found 0 warnings and 0 errors`、
  `[doc-citations] OK —— 已判定 167 / 越界 3 全在册`、`git diff --check` **0 行**、`.e2e-lock` 不存在、stash 0、边界三件套仍重合 `1b9ca06`。
  本轮**产品代码一字未改**（`assetContext.ts` 只在变异取证时被改过两次，均已还原并 `grep` 复验）；e2e 未跑（新增只有测试与门禁脚本，行为面未变；最近点击层读数仍是 04:28 那次的 37 passed）。

- **2026-10-01 04:28 复跑（两条通路策略归一之后）**：`pnpm gates` 退出码 **0**（13 道）、`pnpm test:unit` **584 passed + 1 skipped**
  （core 83、axs 90、**editor-core 165**（+2）、web 207、admin 39）、**`pnpm e2e:desktop` 37 passed 退出码 0**（这次改动落在 Writer 保存路径，所以点击层重量了一遍；E39 那条同名桥段判据在内）、
  `[doc-citations] OK —— 已判定 167 / 越界 3 全在册`、lint `Found 0 warnings and 0 errors`、`git diff --check` **0 行**、`.e2e-lock` 不存在、stash 0、边界三件套仍重合 `1b9ca06`。
  自动存档那一跳的 flake 样本累计：**今天四次全套 `e2e:desktop` 里 1 次红**（36/1 → 37 → 37 → 37），机制仍是待决清单里那条 600ms 防抖。

- **2026-10-01 04:19 复跑（`.axsp` 导入回滚契约入判据之后）**：`pnpm gates` 退出码 **0**（13 道）、`pnpm test:unit` **582 passed + 1 skipped**
  （core 83、axs 90、editor-core 163、**web 207**（+9 来自 `axspImport.rollback.test.ts`）、admin 39）、`[doc-citations] OK —— 已判定 167 / 越界 3 全在册`、
  `git diff --check` **0 行**、`.e2e-lock` 不存在、stash 数 0、边界三件套仍重合（HEAD **==** `origin/desktop` **==** tag = `1b9ca06`）。
  **产品代码一字未改**：两次变异手术之后都用 `git diff --stat` 确认被改文件回到 HEAD；本轮 e2e 未跑（新增的是测试文件，行为面未变，最近读数仍取 03:43 那次）。

- **2026-10-01 04:02 复跑（第二十批，只动文档）**：`pnpm build:web` 退出码 **0**；产物层三条 grep 全 0 命中，
  同一次扫描里正对照 `axiforge.db` 在同一 chunk 命中 1 次、形状对照看到 react-router 的 `URLSearchParams(a.search)` 与 `.getAll(\`index\`)` 原样存在
  ⇒ 「DEV 测试宿主没进产物」这条**第一次有了能区分好坏的证据**（读数的完整推导见 `docs/REFACTOR_DESKTOP.md` 该项 04:00 补记）。
  单测/门禁读数沿用 03:57 那次（**产品代码本轮一字未改**）；`check:citations` 那次首跑 **FAIL**，抓到的不是文档写错而是门禁本体的键设计（见下一条）。

- **2026-10-01 04:05 复跑（改掉 `check:citations` 基线的位置键之后）**：`node scripts/check-doc-citations.mjs` **OK**——
  扫描 47 个文档、`已判定 167`、`越界 3` 全在册、`不存在 0`、歧义跳过 37；`pnpm build:web` 退出码 **0**；`git diff --check` **0 行**。
  三条腿各自见过：`--update` 重取（3 条在册、退出码 0）／位置稳定性正判据（宪章顶部临时插一行把在册项顶下一行 ⇒ 仍 OK，探针即删、2738 → 2738 行）／
  该拦（临时探针文档一条越界行号 + 一条不存在文件 ⇒ FAIL 退出码 1 且逐条点名，删净后 OK）／**复述不绕白**（同文档同目标、不同句子 ⇒ FAIL 点名那一句）。`pnpm gates` 全链读数登记在本条最后一句。
  **全链末次（04:10，取在两条文档改写之后）**：`pnpm gates` 退出码 **0**（13 道）、`pnpm test:unit` **573 passed + 1 skipped**（core 83 / axs 90 / editor-core 163 / web 198 / admin 39）、
  `[doc-citations] OK —— 已判定 167、越界 3 全在册`、`git diff --check` **0 行**。

- **2026-10-01 03:57 复跑（素材摘要 fail-closed 之后）**：`pnpm gates` 退出码 **0**（13 道）、`pnpm test:unit` **573 passed + 1 skipped**
  （core 83、axs 90、editor-core 163、**web 198**（+7 来自新增的 `tauriAssetStore.test.ts`）、admin 39）、`git diff --check` **0 行**、`.e2e-lock` 不存在、stash 数 0、
  边界三件套仍重合（HEAD **==** `origin/desktop` **==** tag `desktop-handoff-20260929` = `1b9ca06`）。
  **两道中间红都记下来**：① `gates` 第一跑退出码 **1**（`tsc -b` 报我在测试里读联合类型的 `detail` 没收窄——**vitest 第 4 次全绿放行**，改完 7 条仍绿）；
  ② `git diff --check` 抓到 ADR-026 末尾多出一个空行（已删，行数 69 → 68）。本轮**未跑 e2e**：改的是 `TauriAssetStore`，两套 e2e 都加载不到该模块
  （分派条件有在册断言），最近的点击层读数仍是 03:43 那一次（`e2e:desktop` **37** / `e2e` **50**）。

- **2026-10-01 03:49 复跑（占位符重写的运行时 fail-closed 上线之后）**：`pnpm gates` 退出码 **0**（13 道；`[file-size]` 扫 **348 个文件 0 越线**、`[doc-citations]` OK）、
  `pnpm test:unit` **566 passed + 1 skipped**（core 83、axs 90、editor-core 163、**web 191**、admin 39）、`git diff --check` **0 行**、`.e2e-lock` 不存在、stash 数 0。
  边界三件套仍重合（HEAD **==** `origin/desktop` **==** tag `desktop-handoff-20260929`，都是 `1b9ca06`）。
  **本轮没跑 e2e，理由写清楚**：改动落在 `TauriSqlBackend`，而两套 e2e 都加载不到它（chromium 里 `isTauriEnvironment()` 为 false ⇒ 分派到 Memory 支；
  浏览器那半走 HTTP 支）。上一条（03:44）里 `e2e:desktop` **37** / `e2e` **50** 的读数仍是最近的点击层读数。

- **2026-10-01 03:44 复跑（桌面生产后端接缝判据入面之后）**：`pnpm test:unit` **563 passed + 1 skipped**（core 83、axs 90、editor-core 163、**web 188**（+7 全来自新测试）、admin 39）、
  `pnpm --filter @axiforge/web exec tsc -b` 退出码 **0**、`pnpm e2e:desktop` **37 passed**（退出码 0）、`pnpm e2e` **50 passed**（退出码 0）、`.e2e-lock` 不存在、`git diff --check` 干净。
  本轮产品代码改动**只有注释**（`tauriSqlBackend.ts` 头注释纠偏 + 那条安全前提的实测读数），其余为新增一份测试文件。
  **一条限度**：`e2e:desktop` 在 03:37 那一次拿到的是 **36 passed / 1 failed**（红在自动存档那一跳，机制＝§6 待决清单里 600ms 防抖那条的第 2 次观测），
  随后两次连续 **37 passed**——今天四样本 1 红。定档前它不是全绿信号，引用它时要带上这个形状。
  **取数顺序**：`pnpm gates` 排在本文件全部改写**之后**（`check:citations` 要扫本轮新写进 REFACTOR/HANDOFF 的段落），结果登记在本条最后一句，取完后只补这一句文档、并单独重跑一次 `pnpm check:citations` 确认那句没破坏对账。
  **`pnpm gates` 退出码 0**（03:45 那一次，13 道全绿：`[file-size]` 348 个文件 0 越线、`[doc-citations]` 已判定 165 / 越界 3 全在册 / 不存在 0、`[publish-target]` 残差 4 全在册）。

- **2026-10-01 03:19 复跑（`.axsp` 导出往返判据入面之后）**：`pnpm gates` 退出码 **0**（13 道，含 `check:citations` OK 与 `check:publish` OK 残差 4 在册）、
  单测 **556 passed + 1 skipped**（core 83、axs 90、**editor-core 163**、web 181 + 1 skipped、admin 39）、`pnpm typecheck` 0、`git diff --check` 干净。
  本轮**产品代码一字未改**；`.e2e-lock` 不存在、stash 数 0、边界三件套仍重合 `1b9ca06`。

- **2026-10-01 02:45 复跑（文档示例机检扩面之后）**：`pnpm gates` 退出码 **0**、单测 **552 passed + 1 skipped**（core 83、**axs 90**、editor-core 159、web 181 + 1 skipped、admin 39）、`pnpm e2e:desktop` **37 passed** 退出码 **0**、`check:citations` OK（47 文档 / 165 判定 / 基线 3 条在册）、`git diff --check` 干净。
  `axs` 88 → 90 的来源是 `doc-examples.test.ts` 的扫描面从"用户文档单文件"扩到 **`docs/**`（排除 `docs/archive`）**：`axs` 围栏 **12 → 13 块**，多出的那块正是 **ADR-016 自己的语法示例**——语法权威的样例句此前落在机检面之外，现在被同三条判据（0 error 诊断 / 打印不改输入 / 往返一致）管着，扩面后全绿即"当前一致"，从此**漂移会被抓住**；数量守卫也从"大于 0"抬成"大于 12"，**扫描面被谁悄悄改窄会直接红**而不是退化成假绿。
  同日另一条关闭读数：`check:citations` 自报限度里"不判内容层"那条**试过并量过**（52 条可判引用 → 20 条被标，误报 38%，成因是散文里"标识符↔引用"配对不可机械获得），已否掉并把读数写进脚本头与 REFACTOR「同日第三十四次」——**下一会话不必再试第二次**。

- `pnpm gates`：**链已扩到 12 条**（新增 `check:citations`，排在 `check:dispatch` 之后）。退出码 **0**（2026-10-01 02:32 那次，含"分支组特征化断言 + 文档引用对账门禁"）；单测 **550 passed + 1 skipped**（core 83、axs 88、editor-core 159、web 181 + 1 skipped、admin 39），lint 为 `Found 0 warnings and 0 errors`，`check:purity` 扫 43 文件、`check:size` 扫 348 文件均 0 越线，`check:citations` OK（47 个文档、161 条判定、基线 3 条在册），`check:circular` 无环，`labels`/`dispatch` 各档 OK。同日：02:26 为 550（旧 11 条链）、02:23 为 549、02:17 为 548、02:07 为 545、02:00 为 543、01:51 为 538、01:38 为 512、01:12 为 506。Python 侧另跑：`pytest tests/test_axs_draft_vectors.py` **6 passed**（`.venv` 宿主；系统 `python3` 缺 sqlalchemy）。
- `pnpm e2e:desktop`：**37 passed**（2026-10-01 02:00 在演出指令那刀之后重跑，1.6m，退出码 0——解析器直接喂 Writer 面板，所以点击层必须真跑），含桌面根路径、云请求隔离、choice 新建/分支组可访问名称，
  **E39**（Writer 轨改稿加一个与既有节点同名的桥段 → 换页再进仍是两个）、
  **E40**（「发送到 Nexus」两半各一条：浏览器态看得到、桌面态不给）、
  **E41**（LLM 徽标在浏览器态是只读、没有配置按钮；桌面侧那半由 `llm-endpoint.spec.ts` 的 E16 覆盖）与
  **E42**（侧栏「概览」项两半 + `/studio/dashboard` 直达只给一句缺席说明、不演成加载态）。
- `pnpm check:size`：通过（347 文件 0 越线）。`parse.ts` 因条件域外提从 493 档收到 **420**（`--update` 后 diff 为 2 增 3 删：新档 `condition.ts`、收紧 `parse.ts`、清掉一条失效记录）。`axs.import` 外提后 `document.ts` 363 行，**已低于默认 400 硬线，baseline 里那条记录随之删除**；`ScriptEditor` 的档也收到 512。
- `pnpm check:labels`：通过，205 个界面 TSX（web/admin/packages-ui 三层），裸标签 0、豁免 0。
- `pnpm typecheck`：通过（解析器那改之后与 gates 同跑，退出码 0）。`pnpm e2e`（浏览器那一半，起后端）：**50 passed**（2026-10-01 00:58 重跑，1.1m，退出码 0）——E39–E42 两半都在这个配置里跑，
  所以「浏览器态应该有」那一侧的回归在这里才会被抓住。**2026-10-01 01:33 在 #79/#82 之后重跑：50 passed、退出码 0**（解析器同时喂两端，故两半都重取）。
- **端口那改的跨运行时实测（2026-09-30 13:43）**：本机可用的 Node 是 **20.20.2 与 22.14.0**（`~/.nvm/versions/node`，另装着未跑的 24.19.0）与 **26.7.0**（`/opt/homebrew/bin/node`，本会话默认），
  而 `.github/workflows/ci.yml` 两个 job 都钉 `node-version: 20`。
  在 **20.20.2** 下：两份 Playwright 配置 `--list` 各 **50 tests / 37 tests**、退出码 **0** ⇒ 与 CI 同档可用，这条从纸面推断变成实测。
  对照组（临时把 `import "./scripts/ports.mjs"` 加进配置）：20.20.2 / 22.14 / 26.7 **三档全红**（退出码 1，
  分别报 `exports is not defined in ES module scope` / `exports is not defined` / `Cannot use 'import.meta' outside a module`）。
  于是此前那条"CI 钉 Node 20 才危险、本地绿远端红"是**错的归因**：本地根本没有绿的那一半。
  **仍未测的**：远端 CI 的实跑结果（`gh` 未认证，看不到，不据此说它绿），以及更旧的 20.x 小版本（本机没装那种二进制；
  但 JSON 这条路径不依赖 `require()` ESM，所以那一族的差异与本次交付无关）。

尚未解决的验证/环境问题：

- **2026-09-30 清偿四项**（原判据与数字见下）：
  ①`git diff --check` 已干净——`ScriptEditor.tsx` 文件尾空行删掉（该文件现 511 行，仍低于棘轮 513）。
  ②`pnpm build:admin` 已通过：缺的是 `scripts/ports.mjs` 的类型面，补了同名声明文件 `scripts/ports.d.mts`（只声明形状）。
  **更正（同日第十二次续做）**：那句「值仍以 `ports.mjs` 为唯一真相源」已被后续一轮作废——真相源现在下沉在 **`scripts/ports.json`**，`ports.mjs` 只是它的派生视图，理由见 §6 第 3 条。
  顺带把**端口的第二个真相源**收掉：`apps/web/vite.config.ts` 原先硬写 `5174` / `http://localhost:8000`，现改为读 `PORTS.web` / `origins.api`，env 覆盖口原样保留（实测值不变：web=5174、api=http://localhost:8000）。
  ③两条既存 oxlint warning 已清（`PromptExport.tsx` 的未用 catch 形参改可选捕获、`shared/api/player.ts` 去掉冗余展开），并把 `apps/web` 的 lint 翻成 `oxlint --deny-warnings`——0 warning 从此是地板而不是现状（牙：插一个未用变量 → 退出码 1 点名该文件；删掉 → 0）。
  ④`.dmg` 打包在同一份代码上**本次跑通**：`bundle/dmg/Axiforge_0.1.0_aarch64.dmg` 5,321,579 字节，`hdiutil verify` 校验和 VALID。
  但**上一次失败的根因仍未归因**（本次没能复现失败）；现场证据只有 `bundle/macos/rw.9752.Axiforge_0.1.0_aarch64.dmg`（42 MB 的读写作中间件，脚本死在建卷之后、转正之前的某一步，`set -e` 下 `hdiutil detach` 重试与 Finder AppleScript 两处都会这样）。所以这条只登记为「当前可出可用 DMG」，不登记为「DMG 交付已验收」——真机安装/挂载仍待人在壳里点（#16/#27/#31）。
  另注：`build:dmg` 会在收尾时清掉 `bundle/macos/Axiforge.app`，要 `.app` 就单独跑 `pnpm build`。
  ⑤`pnpm --filter @axiforge/web build` 的两条 `INEFFECTIVE_DYNAMIC_IMPORT` 告警已消：`ProjectEditorPage` 既静态 import 了
  `FlowWorkspace` / `WriterWorkspace`，又用 `void import("./…")` 在 `onMouseEnter` 上「预取」同一份模块——
  同一 chunk 里的预取必然是空转，那个 `<div>` 包裹层也只为了挂这个死处理器。两处一起删（实测告警计数 0，
  `pnpm e2e:desktop` 仍 33 passed，模式切换的判据在 E17/E32 里没退化）。
  **这类形状门禁不管**：`build` 刻意不进 `gates`，所以 bundler 的这类告警只在构建时可见——接手时顺手跑一次构建看一眼。
- **运行时普查脚本现在自己会拒绝"空载"**（2026-09-30 第十四次续做）：`scripts/desktop-http-inventory.mjs` 原先在服务没起来时对每条路由返回 `httpCalls: []`，
  输出读起来就是"桌面态零云端调用"——本文件旧版给的处置是"读输出前先看 `pageErrors`"，那是把校验留给人。
  现在它按路由检查 `#root` 是否真挂载出内容，汇总行 `ROUTES_MOUNTED=<n>/<总>`，**有任何一条没挂载就报 `UNRELIABLE` 并退出码 1**。
  三条腿实测：活服务 → `8/8` + `DESKTOP_MODE_HTTP_UNIQUE=0` + 退出码 0；指到死端口 → `0/8` + `UNRELIABLE` + 退出码 1；
  并用临时副本复刻加固前的逻辑跑过同一台死服务，确认**旧形状报 0 且退出码 0**（假绿实测存在，探针已删）。
- **`check:dispatch` 那条在册漏检已关掉**（2026-09-30 第十五次续做）：脚本头原先自报"证据取到函数末尾，所以『本地空桩 + 块外真调 provider』仍会过"。
  现在按分支形态分档：正向 `if (isLocal()) {…}` / `if (isLocal()) return …;` 的证据**只认自己那块/那一句**；
  反向守卫 `if (!isLocal()) return cloud();` 与 `const local = isLocal()` 的窗口原样保留（它们的本地本体就是守卫之后整段，硬收会误杀）。
  语料实测 `30` 个导出 async 函数、形状 `positive-block=4 / after-guard=26`、全绿；`pnpm gates` 退出码 0。
  牙是**新旧对照**：把 `playerSaves.ts::listSaves` 改成"本地 `return []`、provider 调用挪到块外"后，
  `git show HEAD:` 取出的旧脚本 **OK/退出码 0**（漏检是真的），新脚本 **FAIL/退出码 1** 并点名该函数；还原后该文件 `git diff` 为空。
  配对是文本级 + 粗 tokenizer（跳字符串与行注释），不认正则字面量与嵌套模板串 `${}` ——限度写在脚本头。
- **`check:purity` 的行尾注释误报已修（2026-09-30 第十六次续做）**：脚本头原来自报「行尾注释仍会被判违规，宁可误报」。
  误报的真实代价是逼人写 `purity-allow`、把代码侧一起放宽，所以改成 `codePart()` 先剥掉行尾注释再匹配（代码侧一字没放宽）。
  四个探针形状一次摆齐并各得其所：`x = 1; // document.title` 放行；`document.title` 与 `window.innerWidth; // react` 拦；
  **`/a:\/\/b/.source + document.cookie` 也拦**——最后这条是给"剥注释"本身设的反例（naive 处理会把正则里转义的 `\/\/` 当注释起点，连后面真违规一起吞掉）。
  同一份探针语料上新旧对照：`git show HEAD:` 的旧脚本 **4 处**（含误报），新脚本 **3 处**。删探针后 40 文件 0 违规、`pnpm gates` 0。
  新限度（已写进脚本头）：跨行块注释仍不处理，内核包里没那种形状；真出现该换 AST 而不是继续加文本特例。
- **`check:labels` 第一档不再"提了 htmlFor 就算过"（2026-09-30 第十七次续做）**：`htmlFor` 的目标必须真被本文件里某个 `id` 接住，否则判为**显式关联悬空**并失败。
  背景：浏览器在显式关联悬空时**不会退回包裹式关联**，读屏与点标签聚焦一起失效，而旧门禁对此完全放行。
  先量再收：三个界面层共 **12 处 htmlFor（表达式 11 + 字面量 1），逐一对完 MISS=0** ⇒ 零误报上线，不需要基线也不需要豁免。
  牙：临时探针两个形状——`htmlFor={probeGhostId}` 让新脚本 **FAIL/1** 并点名，同一输入下 `git show HEAD:` 的旧脚本 **OK/0**（漏洞真实存在）；
  `htmlFor={probeRealId}` + `id={probeRealId}` **不报**（证明不是"见未知标识符就红"）。探针已删，`check:labels` 205 文件 0 处、`pnpm gates` 0。
  限度已闭合一半（2026-10-01 第二十一次续做）：悬空检查从"本文件"升到**全仓**（DOM 里 id 是全文档的，父组件 `useId()` 经 prop 传下去时定义点天然不同文件），
  而"跨文件接住"单独计数打印（实测 **= 0** ⇒ 这次放宽没放过任何现有代码）；同一次探针里跨文件那条放行、真悬空那条仍点名报错。**放宽一条判据时要把被放宽的那一档计数打印出来**，否则放宽与失效在输出里长得一样。
- 原生壳手动验证仍需真机：`.app` 首启/播种与播放、SQLite 回读和 WKWebView 像素、Ollama 的 `tauri://localhost` 来源（见原任务 #16/#27/#31）。
- **#69 已清偿（同日续做）**：AXS 文本 apply 回草稿时两个同名 Beat 会塌到同一个节点（`titleToId` 是「第一个同名赢」，后一个 beat 覆盖前一个节点）。
  契约收成为「一次导入里一个节点 id 只许被消费一次」：第一个同名仍复用既有节点身份（Writer 重复保存不换 id 的语义不变），第二个起走 `idGen()`。
  判据在 `document.test.ts`，改前红在 `expected 1 to be 2`。
  清偿时按 `check:size` 给的处置把 `axs.import` 整段外提成 `packages/editor-core/src/axsImport.ts`（**新文件未纳管，提交要显式 add**），
  `document.ts` 436 → 363 行，baseline 里那条记录随之删除（回到默认 400 硬线），`ScriptEditor` 一并收到 512。
  同轮修了 `check:purity` 自身的误报面：它按文本扫 `document.`，会被注释里的 `document.ts` 喂一口；
  现在纯注释行不参与扫描，代码侧照旧（三条腿实测：代码行红、JSDoc 放行、删探针 40 文件 0 违规）。
- **主通路上的第二份实现也犯了同一个错，已一并修（2026-09-30 续做）**：Writer 保存不走草稿事务，走
  `axsToSyncPayload → parseAxsToPlan`（`packages/editor-core/src/projection/axs.ts`）——「AXS 文本 → 节点图」有两套实现，
  #69 只修了其中一套。另一套没有消费守卫且把结果 push 进数组，于是发出**两个 id 相同的节点**（存储侧后写盖前写）并让邻接边退化成**自环**。
  判据两条：`parseAxsToPlan > 同名 Beat 不许共用同一个既有节点 id`（改前红在 `['existing-1','existing-1']`）、
  `两条「AXS 文本 → 节点图」的通路守同一条 id 契约`（配对判据，去掉任一侧守卫都会红；牙是在 `axsImport.ts` 外提**之后**重验的）。
  **未做的债**：两套实现没合并（`beatToNarrative` 与 `beatToNarrativeData` 是否逐字段等价未核对），
  合并属 S13-7「一个功能只有一条数据通路」那一刀，别顺手做。
  **（批注 2026-10-01 04:25）上面这两句已被实态推翻两处**：① `beatToNarrative` 这个符号**不存在了**（当天早些时候的归一里它并进了 `beatToNarrativeData`），
  所以"逐字段等价未核对"这个问题本身已经没有落点；② 对着函数体重核之后抓到**两处真实分歧**并且已经归一——
  同名既有节点复用哪一个（通路一第一个赢 vs 通路二 `new Map(existing.map(...))` 最后一个赢）与"可复用 beat.id"的正则字面量抄了两遍。
  归一之后新补 2 条判据（双向取证：钉回旧策略 ⇒ 恰好 1 红；放宽共享谓词 ⇒ 6 红），S13-7 剩下的只有"外层循环与返回形状是否合成一个"。
  历史文本按当时实态保留，不重写。

## 6. 重构阶段状态

> **`REFACTOR_DESKTOP.md` 那行「验收」的机械复核（2026-10-01 02:38 实测）：四条里两条达成、两条卡在决策，卡住的两条现在有了可点数的残项清单**
>
> 原文判据：`grep -rn "/api/v1" apps/web/src` 只剩测试宿主所需或为 0；桌面是唯一构建与发布目标；gates 与新基线全绿；`backend/` 已不存在且桌面功能无回归。
>
> - **①「`/api/v1` 只剩测试宿主」——字面未达成，但**这条判据现在已经可判了**（2026-10-01 04:56 补）**：实数 **12 处** = 测试文件 9 + 注释 1 + `shared/api/client.ts` 的传输基址定义 1，
>   产品代码里**没有一处新的调用点**。建议措辞已被写成机械形式：`/api/v1` 只允许出现在 ① `*.test.*` ② 注释行 ③ `shared/api/client.ts` 里带 `apiBase` 的那一行，
>   其余任何出现都算「新的云端调用点」必须为 0。跑法：`pnpm check:apibase`（**刻意先不进 `gates`**，与 `check:desktop` 同属"存在但不在链里"的检查，等口径定了一行就能接上）。
>   **（2026-10-10 02:26 扩面后的输入，定档时直接照这几格拍）**：①*判定面没变*——`apps/web/src` 仍 `越界 0`；②**这条规则一旦把面扩出去就不是空的**：`apps/admin/src/api/adminClient.ts:20`、`packages/ui/src/components/ImageUpload.tsx:24`（两处真 `fetch`）、`e2e/helpers.ts:10`（测试基址定义）都带同一字面量 ⇒ 你要拍的是"这条规则管不管 admin／packages／e2e"，而不是"web 里还有没有"；③**注释那一档的代价已量**：行尾注释命中 0（今天的语料里没有会被误杀的），所以"行尾注释算不算例外"这一问可以用"先按行首算、以后有命中再说"过掉；④**绕开严格档的写法今天 0**（模板拼接／字符串相加／大小写变体单列一档，只读数）⇒ 这条判据的"防顺手加"强度现在是有据的，不是自报猜测。
>   今天实跑读数：`命中：测试 9、注释 1、基址定义 1、越界调用点 0`，退出码 **0**；**牙也验过**——临时放一个 `export const probeUrl = "/api/v1/things/"` ⇒ **FAIL 并点名那一行**、退出码 1，删净后回到 OK。
>   脚本还带一条防退化：三类命中数**全 0 时它自己报 FAIL**（否则字面量被清空后这条检查会静默变成恒真）。
>   旧版本文（"12 处 = 测试 9 + 注释 1 + 基址定义 1；这条判据不可判"）按当时实态保留，这段是它的后继。
> - **②「桌面是唯一构建与发布目标」——脚本层达成，发布声明层未达成**：`package.json` 的 `build` = `build:desktop` ✓；
>   但 CI 仍在 `ci.yml:69` 跑 `pnpm build:web && pnpm build:admin`，且**两个部署声明仍被 git 追踪**：`vercel.json`（685 B，键为 `version/installCommand/builds/routes/env`）与 `docker-compose.yml`。
>   ⇒ §6 清单第②条（S13-3 判死清单）从此不是一句"要不要删"，而是这三件可点名的残项：**CI 那段、`vercel.json`、`docker-compose.yml`**。
>   一句「都删」就能收；一句「CI 留着构建 web 当回归宿主、只删 vercel.json」也能收。**我不自行删**（不可逆 + 属产品发布口径）。
> - **③「gates 与新基线全绿」——达成**：`pnpm gates` 退出码 **0**（02:37 那次，链已含第 12 道 `check:citations`），
>   具名基线三份都在册且随修完缩短（`file-size-baseline` / `label-association-baseline` / 新增 `doc-citation-baseline` 3 条）。
> - **④「`backend/` 已不存在且桌面功能无回归」——未达成，且不是本轮能达成的**：`backend/` 仍在（本轮只按域切了 TS 侧，没动后端）。
>   它卡在 §6 第①条（那 13 条 `baselines` 归谁）与第③条（`.axsp` 播种权威二选一）之后：**只要那两条不定，`backend/` 的删除面就量不出来**。
>   后半句"桌面功能无回归"有读数：`e2e:desktop` **37 passed**、`e2e` **50 passed**（02:23 / 01:52）。
>
> **03:37 复量对④后半句加了一条限度（不改结论）**：`e2e:desktop` 第十七批末轮第一跑拿到 **36 passed / 1 failed**，红在 E17 内部的自动存档那一跳，
> 立刻重跑同一份代码 → **37 passed**。归因已做完：它是「自动存档的 600ms 防抖窗口」那条在册待决的**第 2 次观测**（写入被测试自己的快速离开清掉），
> 不是回归、也不是新缺陷。**但它改变了这条验收的可信度陈述**：那一格定档前，`e2e:desktop` 的读数不能当"全绿信号"引用，只能说"37 条里 36 或 37 条绿、红的那条机制已知"。
> 我没有为了让它变全绿去改产品语义（三种修法都改玩家数据生命周期），也没去放宽那条断言（**改断言不删断言**，何况它抓的是真实现象）。
>
> 结论：**验收没达成，缺口全部集中在"需要你一句话"的两条上（②与④），且现在都变成了可点名的三项残项 / 两项定档**；
> ①那处判据本身不可判，顺手把建议措辞写在这里等定档。本轮无代码改动。
>
> **同轮一条矿脉的关闭读数**：`check:citations` 自报限度里那条"不判内容层"（行号还在范围内、但那一行早已不是当初那段代码），
> 今天试过做成第二档：把同行反引号里的标识符拿去目标文件里找 ⇒ **52 条可判引用里 20 条被标，误报率 38%**，
> 逐条看全是同一个成因——一行同时引用两个文件时"标识符属于哪一个引用"没有机械可依据的邻近关系（`_edges` 被拿去 `print.ts` 找、`parseAxsToPlan` 被拿去 `axsImport.ts` 找，一半必然对不上）。
> 要判内容就得先解标识符↔引用的配对，而散文写法不支持可靠配对；放宽成"任一文件里出现即可"又等于没判。
> **结论：这道门禁停在存在性 + 范围这一层，下一会话不必再试内容层**（读数与成因已写进 `scripts/check-doc-citations.mjs` 的脚本头）。


Phase 0“产品收敛与默认入口”已完成，细项见 `REFACTOR_DESKTOP.md`。Phase 13 的总体情况：

- 已完成：S13-1；S13-2a/b/c/e/f/g；S13-8。此次 AXS choice 往返修复已落地，但不代表 S13-3/4/6/7 完成。
- 部分完成：S13-2d（剩余调用路径处置/测试覆盖）；S13-5（桌面态 E2E 已建立，桌面为 CI 主目标及原生壳 CI 信号仍未完成）。
- 未完成：S13-3 云端功能处置/摘除；S13-4b AI 剩余决策；S13-6 后端/Postgres/Alembic 退场；S13-7 HTTP 第二数据通路消解。

### 接手优先级

1. **先处理产品决策，再删入口**：按 [ADR-029 未决项](./ADR/029-desktop-only-build-target.md) 决定云功能（移除或显式缺席）、Nexus `sendToInbox`、AI 建档建议、Glossary、根目录 `vercel.json` 的处置，以及是否加桌面 CI job。
   **`vercel.json` 那条已按当前文件核过（2026-10-01 04:53，只读）**：它在 `builds` 与三条 `routes` 里共 **4 处**指向 `backend/src/main.py`，而该文件**不存在**（后端真实入口是 `backend/app/main.py`）
   ⇒ 这份声明**今天根本不是一次能部署的配置**，"删掉它"并不是在删一个还有用的备用发布路径；反面说法（"留着当 web 回归宿主"）也不成立，因为要跑起来得先改它。这条读数已并入 §6 定档清单第②条的三项残项。
2. **解决 S13-6 的真实阻塞**：随包示范作的重建权威二选一：将内容定义/导出器迁入 TS，或宣布 `.axsp` 种子包为权威；决定前不要删除后端播种路径。
3. **再迁基线、退后端、消双通路**：按 S13-5 → S13-6 → S13-7 执行，每步保留 E2E 与壳内验收，不做批量删目录。
   **基线那一半已经搬完了（2026-09-30 用 `--list` 复量）**：桌面态 `pnpm e2e:desktop` **37 tests / 2 files** 零后端全绿，
   浏览器态 **50 tests / 3 files** = `baselines` **13** + `desktop-http` 33 + `llm-endpoint` 4。
   所以 S13-6 的真实前置不再是"整条基线会被打掉"，而是"**这 13 条 `baselines` 归谁**"（搬成离线可跑，还是让后端只为这 13 条当测试宿主）——定档问句已按此改写进 `docs/WEB_SUNSET_RESTORE.md`。
   **这 13 条的分母已量好（2026-10-01 第十九次续做，只读）**：它们打的端点形状只有 **8 个**（4 处 `POST /characters/`、2 处 `GET /characters/{id}`、工程 CRUD、节点 POST/PUT、`/roles`、`/edges`），
   而本地是**一次原子覆写** `saveNarrative(id,{nodes,edges,axsSource})`（`storage/memory.ts` 第 156 行；契约用例同跑 Memory 与 SQLite），`*Saves.ts` 的 30 个导出函数全部有本地分支 ⇒
   **搬离线不需要新能力，需要的是把夹具从"逐节点 POST"改写成"一次 saveNarrative"**；
   真正的分歧点是"改写后这 13 条不再覆盖后端 REST 契约"。明细与两条待验证点见 `docs/REFACTOR_DESKTOP.md` 第十九次补记。
   **端口散写已收成一个真相源（2026-09-30 第十二次续做）**：数字下沉进 **`scripts/ports.json`**，`ports.mjs` 只做派生视图（origins / corsOrigins），
   `playwright.config.ts`（4 处）、`playwright.desktop.config.ts`（2 处）、`e2e/helpers.ts`（1 处 API 基址）、`e2e/baselines.spec.ts`（5 处硬写角色端点）、
   `scripts/desktop-http-inventory.mjs`（1 处）全部改读它——工具与 e2e 层的 `5174`/`localhost:8000` 字面量实测 **0 处**。
   上一轮记的机制阻碍（"Node 20 上 `require()` ESM 会 `ERR_REQUIRE_ESM`，本地绿远端红"）**归因是错的、结论是对的**：
   实测把 `.mjs` 引进配置在 **20.20.2 / 22.14 / 26.7 三档全红**（报错随版本不同），本地并不存在"绿"那一半；
   而 JSON 这条路在 20.20.2 上两份配置 `--list` 各 50 / 37、退出码 0，`require()` 原生支持 JSON，所以 CJS/ESM 两头都能读。
   **仍在外面的，各自有理由**：`apps/{admin,nexus}/src/**` 4 处 + `apps/web/src/shared/storage/exportSeeds.test.ts` 1 处是 `import.meta.env.VITE_*` / `process.env` 的兜底默认值（要改得走 vite define 或注入环境变量，属另一刀）、
   `apps/nexus/{electron/main.cjs,scripts/dev.mjs}` 2 处（本机起不了 Electron，改了无法验证）、
   `apps/desktop/src-tauri/tauri.conf.json` 的 `devUrl`（由 Tauri CLI 读，要并真相源需引入生成步骤）、
   `scripts/kill-dev-ports.sh`（它是"顺手清掉相邻端口段"的工具，端口族比表里四个宽）、
   `backend/app/config.py` 的 6 处 CORS（随 S13-6 后端退场消失）。
   **牙（两轮都跑过）**：把 `ports.json` 的 web 改成 5999 → `pnpm e2e:desktop` **37 passed**，说明 vite 与两套配置真的跟着这一份走；
   再把 `playwright.desktop.config.ts` 的 `webServer.url` 单独钉回 5174 → **1 failed**，报 `ERR_CONNECTION_REFUSED at http://localhost:5999/...`，
   说明任一处脱离真相源都会红而不是静默错位。
4. **安排原生壳手验**：确认冷启动、素材/数据库读写、Ollama 来源；浏览器注入不能代替真壳验证。
5. **闸门点的两半覆盖已逐个核完（2026-09-30）**：14 个用 `isLocalOnlyDeployment()` 的 `.tsx` 分成三档——
   **两半都有判据**：`ProjectListPage`(E15)、`ProfilePage`(E36)、`UserAccountMenu`(E37)、`DiscoverBrowseLink`(E35)、
   `NexusSendAction`(**E40 两半**；桌面那一腿挂在 E17 流程内、没有独立编号——旧编号 `E20` 已于 2026-09-30 从用例名里消失，按它 grep 会一无所获)、`LlmStatusBadge`(E16+E41)、`StudioNavContent`+`CreatorDashboardPage`(**E42**：浏览器态侧栏有「概览」、桌面态没有，且 `/studio/dashboard` 只给一句「创作数据面板需要协作服务」，不许出现浏览器态的「加载数据中…」)；
   **数据面覆盖**：`UserContext`、`VersionPanel`（查询级 `enabled`）、`CharacterDetailPage`(E21)；
   **无桌面入口 / 结构性不可达**：`DiscoverPage`、`CreateCharacterPage`(E19)、`AppHeader`。
   核对方法是把闸门打穿成"两态同名"、看是哪几条红。**先确认组件当前渲染的是哪一支**：
   `StudioNavContent` 有 `rail` 与非 `rail` 两支，第一次我把不在热路径的那一支改了，得到一次"全绿"的假反证。

### 接手边界（**2026-10-10 03:25 现测刷新**；这一节才是现在，上一节 09-30 那段按当时实态保留）

**本会话最终收束（2026-10-10 03:28 自查，五项全干净）**：`git diff --check` **0 行** · `.e2e-lock` **不存在** · `git stash list` **0 条** · 源码里的变异探针残留 **0**（`MUTATED`／`false &&` 在 `apps/`＋`packages/` 的 `.ts/.tsx` 中零命中）· 三引用重合 **`1b9ca06`／`1b9ca06`／`1b9ca06`**（⇒ 未提交、未推送、未动 tag，按 §7）· `??` **55**。
**这一刻树的状态（现跑，非推断）**：`gates` **0**（十五道）· `e2e:desktop` **77 passed／0 failed** · `check:tracked` **1**（`待 add：` **43 行**）· `check:http-inventory` **0**（`DATA_DESKTOP=0／DATA_BROWSER=20`、`SPEC_URLS=74`）· `check:apibase` **0**（判定面越界 0、只读面疑似调用点 3）· `check:citations` **0**（已判定 **380**）。**没有半成品留在树里**：本会话每一批的判据都在改动之后整套重跑过，最后一批（第一百一十）只加规格与文档。
**下一步（一句话就能推进，按成本排序）**：① 授权我把那 **43 个文件**按 `pnpm check:tracked` 的点名清单 `git add` 并提交 ⇒ "绿灯"从这台机器变成仓库的事实，"CI 无桌面 job"那条验收才有讨论资格；② 拍 `S13-6`「那 13 条 `baselines` 归谁」⇒ 同时解锁 ADR-029 两条验收；③ 给 `定档①` 一句口径（管不管 admin／packages／e2e）⇒ `check:apibase` 一行接进链；④ 真壳人工验收两格与 `pnpm e2e` 浏览器臂仍只能由你起手（前者需要人看屏幕，后者会经 :8000 写你的开发库）。

- **一眼状态**：三引用重合 `HEAD == origin/desktop == desktop-handoff-20260929^{} == `**`1b9ca06`** ⇒ 本会话**未提交、未推送、未动 tag**。工作区现测 **99 个 `M` ＋ 17 个 `D` ＋ 55 个 `??`**（`git status --porcelain | awk '{print $1}' | sort | uniq -c`）。
- **恢复点读数（全部现跑，别沿用上一段的旧数）**：`pnpm gates` **0**（十五道；web 单测 325＋1 skip、`[file-size]` 0 越线、`[desktop-seams]` 9／6／真断言 102／基线 3）· `pnpm e2e:desktop` **77 passed／0 failed**（03:23）· `check:citations` **0**（已判定 **380**）· `check:http-inventory` **0**（`SPEC_URLS=74`、`DATA_DESKTOP=0／DATA_BROWSER=20`）· `check:apibase` **0**（判定面越界 0；只读面疑似调用点 3）· `check:tracked` **1**（`待 add：` 现跑 **43 行**）。E 编号定义处 `test.describe("E…")` 现数 **39 个**（E14…E65 之间有历史洞：E16／E20／E22–E28／E33／E34 只以**注释里的编号**出现（判据后来并进了别的 describe），而 **E29 与 E46 在整个 `e2e/` 目录里一个字都没有** ⇒ 这两个是**幽灵编号**：文档与台账若按号引用，改引「测试标题原文＋文件行号」，别按编号 grep（同一个坑在 #76 那条里记过一次）。
- **必须人点名、不能 `git add -A`**：这 99 个 `M` 里**混着本会话之外的改动**（会话开始时 `git status` 就已列出的那批：`.github/workflows/ci.yml`、`BLUEPRINT_v1.0.md`、`apps/web/src/features/discover/pages/*` 六页、`apps/web/src/app/providers/UserContext.tsx`、`packages/core/*`（`ir.ts`／`conditions.ts`／`compiler.test.ts` 等）、`packages/axs/src/draft.ts`、`backend/app/domains/narrative/models.py`、`dev.bash` …）。**`backend/uv.lock` 与 `backend/app/domains/llm/providers/__init__.py` 永不入本重构提交（§7），`Clearance/` 一律不碰（里面有 `.env`）**。
- **本会话动过的文件**（提交时逐名点这些，别整目录扫）：`scripts/check-chain-tracked.mjs`、`scripts/desktop-http-inventory.mjs`、`scripts/file-size-baseline.json`、`package.json`（只加过 `check:tracked` 一行）、`e2e/desktop-http.spec.ts`（E62–E65）、`apps/web/src/shared/lib/clipboard.ts` ＋ `clipboard.test.ts`（**新文件，未跟踪**）、`apps/web/src/features/character/{components/PromptExport.tsx,pages/CharacterDetailPage.tsx,pages/StoryEditPage.tsx}`、`apps/web/src/features/studio/hooks/{useProjectEditor.ts,editorProjection.ts,editorProjection.test.ts}`、`apps/web/src/features/writer/lib/{projection.ts,projection.test.ts}`、`packages/editor-core/src/projection/{canvas.ts,projection.test.ts}`、`apps/web/src/shared/storage/index.ts`、`README.md`、`docs/HANDOFF_DESKTOP.md`、`docs/ADR/016-axs-narrative-language.md`、`docs/user/writing/axs-syntax.md`。**注意其中六个（`package.json`、`README.md`、`PromptExport.tsx`、`CharacterDetailPage.tsx`、`StoryEditPage.tsx`、`useProjectEditor.ts`、`editorProjection.ts`）在我动之前就已经带着别人的未提交改动** ⇒ `git add <文件>` 会把两份工作一起收进去，提交前必须逐文件 `git diff <文件>` 过一眼，或先问一句。
- **为什么此刻不开新切片（不是"没活"）**：能自主推进的都已闭合并各有见过红的牙。剩下的**全部欠一个外部输入**：① `git add` 那 43 个文件并提交（`check:tracked` 逐条点名；在此之前 "gates 0／e2e 77" 只是这台机器的读数，"CI 无桌面 job" 那条验收连讨论资格都没有）；② §6 的 **12 条定档**，其中 `S13-6`「那 13 条 `baselines` 归谁」一次解锁 ADR-029 两条验收，`定档①`（`/api/v1` 允许落点）四格输入已量齐；③ 真壳人工验收两格（素材到货、落盘与像素）；④ `pnpm e2e` 浏览器臂（经 :8000 写你的开发库）。另有两条在册小活不欠决策但欠工时：自动存档 **600ms 防抖**（#66）与 **术语表 glossary**（#58，组件零消费者）——它们都需要一次产品口径，不是我该拍的。
- **一个收口建议**：把 ① 做掉，然后把 §6 的 12 条按"一句能拍"的先拍掉（`S13-6` → `定档①` → `ADR-029 未决第 2 条` nexus），这场重构就从"代码面已完成、事实面悬空"变成可发版状态。判据侧无需再加码：本轮之后新增的每一个缺陷都自带一条会红的腿。

### 接手边界（2026-09-30 14:21 实测，供下一会话直接接上）

- **当前恢复点（2026-10-09 16:51 现测；下面 09-30 与 10-01 那几段按当时实态保留，不代表现在）**：
  **一眼状态**：三引用按 peel 仍重合 `1b9ca06`（`git rev-parse --short 'desktop-handoff-20260929^{}'`；直接 `rev-parse` 打的是附注标签对象 `dbf1dde`）、
  `git diff --check` **0 行**、`git stash list` **0**、`.e2e-lock` **不存在**、仓库内 `MUTATED` 探针 **0**、本会话**未提交／未推送／未动 tag**（§7）。
  **今天要接上的三件事，按成本从低到高**：
  ① **显式 add 九份新判据文件**（`git status --porcelain | grep '^??'` 现测 **50** 项，其中这九份是本会话写的、不 add 就永远不在树里）：
  `apps/web/src/shared/lib/` 下的 `playerUnlocks` / `creatorId` / `playerToken` / `playerSettings` / `llmSettings` / `playerReadState` / `routeHistory` / `draftManager` / `identityKeyAuthority` 各 `.test.ts`；
  其余 `??` 项的归属**无干净机械信号**（`grep --include` 在 zsh 会静默失败、mtime 也不足以区分），只能人点名，别顺手 `git add -A`。
  ② **两条只观察不处置的新登记等一句定性**（都不占共享定档号，按 `navigator.clipboard` 那条的同例处理）：
  (a) 角色草稿的 `draftManager.save` 整块 `catch {}`——写失败**没有任何界面提示**，表现是下次不再问你是否恢复；
      玩家侧同 hazard 已经有名字（`PlayerPage` 的 `syncNotice`「本地进度未能保存（桌面：…）」），草稿侧没有。
      修法形状：`save` 返回 outcome（与 `SyncOutcome` 同形）或让调用方 `editorStore` 接住异常，两者都要动界面。
      已核对掉的更强说法：它**不会**假称"✓ 已保存"——`markClean()` 只在角色真保存成功后被调。
  (b) `identityLink.ts` 的 `linkCreatorEmail` / `restoreIdentityFromEmail` **全仓零 import**（只有 `reportContent` 被 `DiscoverProjectsTab` 用），
      而它们是云端身份绑定通路 ⇒ 属 S13-3 判死名单该过的一格；本会话只把它们的键引用收进权威（见第七十二批），没给可能判死的函数搭测试设施。
  ③ **仍然欠的两次取数，不是工时而是授权**：浏览器那一半 `pnpm e2e`（8000 上那支 uvicorn 连的是你的开发库，跑它会写库）；
  以及真壳验收（§6 那条"桌面壳内人工过一遍"）。这两条我不擅自启动。
  **本会话已交付的读数**（逐条带取数时间，别当现值用）：`gates` **0**（十五道，16:37）· `test:unit` **774 passed + 1 skipped**（同一次）·
  web 单档 **309 passed | 1 skipped** · `e2e:desktop` **62 passed／0 skipped**（16:40，因第七十二批动过产品代码而重跑）·
  `check:http-inventory` 与 `cloud:callmap` 成对重取（16:45／16:47）**逐档与 12:47／14:18 全等**· `check:citations` **0**（16:48）·
  **未重取的三件事**：两个构建（`build:web` + `build:admin`）、桌面 `cargo check`、后端 `pytest`——仍是 10-01 05:30 那批读数，
  而第七十二批改过 `apps/web/src/app/providers/UserContext.tsx`，所以构建层必须重量一次才算今日收口。
  **16:52 已补成今日读数**（同一天第七十四批内）：`build:web` **0**（89 行产物，`dist/index.html` mtime 与本次同时）· `build:admin` **0** ·
  桌面 `cargo check` **0**（`pnpm check:desktop`）· 后端 `pnpm test:api` **0**／**226 passed**（480 条 `datetime.utcnow()` 弃用警告）。
  **这里有一条旧数已被逐文件归因清楚**：文档里沿用过的两条后端读数是 **167**（10-01）与 **199**（当条批次只登记了 `test_condition_vectors.py` 那 32 条），
  今天同一命令读出 **226**。按 `-v` 日志逐文件数过：`backend/tests/` 共收集 **34 个文件／226 条**，其中**三个未被 git 跟踪的 in-flight 文件**
  （`test_condition_vectors.py` 32、`test_condition_matcher_vectors.py` 22、`test_condition_family_support.py` 5 ＝ **59 条**）。
  **226 − 59 = 167**，与 10-01 那条读数一字不差——所以这不是回归、也不是新缺陷，而是**另一支的产物进了收集面**。
  推论要连着读：**HEAD 上可复现的后端读数是 167，当前工作树里是 226**；引用"后端全绿"时必须说明是哪一份树。
  测试库隔离本次**未复验**，仍沿用 #54 交付时的实测陈述（"dev 台账一字未变"）。

#### 本会话收束（2026-10-09 17:03 末轮；§4 台账第六十八…七十五批之后的收束轮，不再开新切片）

- **已验证读数**（每条都是命令打出来的，带取数时刻；不要当"当前一定还成立"用）：
  `pnpm gates` **0**，退出码单独取（17:03 那次，链上 **15** 条命令、其中 11 条是 `check:*`）·
  `test:unit` **774 passed + 1 skipped**＝core 143／axs 94／editor-core 189／**web 309 + 1skip**／admin 39 ·
  `[file-size]` 349 文件 0 越线 · `[labels]` 205 文件、裸标签 0 · `[doc-citations]` 47 文档、已判定 243、越界 5 全在册、不存在 0 ·
  `[desktop-seams]` 9 接缝／6 有判据／真断言合计 **99**／基线 3 · `[dead-surface]` 面 **294**／闭包内 245／闭包外 10 全在册 ·
  `e2e:desktop` **62 passed／0 skipped**（16:40）· `check:http-inventory` 两臂 **桌面 0 笔／浏览器正对照 20 个唯一调用点**（16:45）·
  `cloud:callmap` 六档 **11／9／34／27／6／8**（相加 95），逐档与 12:47 全等（16:47 成对重取）·
  `build:web`／`build:admin`／桌面 `cargo check` **0**、后端 `test:api` **0**（16:52；后端按树分开：**HEAD 上 167、工作树里 226**）·
  `git diff --check` **0 行** · `git stash list` **0** · `.e2e-lock` 不存在 · 仓内 `MUTATED` 探针 **0** ·
  三引用按 peel 全为 **`1b9ca06`**（本会话未提交、未推送、未动 tag，遵 §7）。
- **本会话交付了什么**（数一遍，不是"很多改进"这种说法）：
  界面层判据 **E47–E55 共 9 条**（桌面云端残口 4 条 + 玩家本地读径 5 条）；
  本地持久层单测 **68 条**（web 单档 241 → **309**，差值正好 68），覆盖 `grep -l localStorage` 那 9 格分母里的 **8 格**；
  一处**双真相源归一**（身份键字面量八处手抄 → 单一权威，键值一字未改）+ 它的**双向判据**；
  一道普查新增段（`cloud:callmap` 第十三段调用者侧闸门审计，只读数）；
  三次对我自己旧判据/旧说法的证伪与更正（弱判据靠写入计数器补牙、"假称已保存"被显示条件否掉、附注标签要 peel）；
  README 三处抄数腐烂换回现测；`KERNEL_DESIGN` 一条**从来不存在**的契约测试文件名被更正（含对 10-01 那次半截更正的再更正）；
  文档↔实树机检（命令名 **0** 漂移、路径 50 条候选逐类分诊）。
- **未达成的是决策与授权，不是工时**（三条，均可一句话解锁）：
  ① S13-3 判死名单——两侧证据已在 `cloud:callmap`（死面 11 条前端读者全 0、后端 11 在／1 不在，那"不在"是 `updateProjectNode` 指错），
     缺的是"哪些摘、哪些本地化"的定性；② S13-6 的问句仍是"**那 13 条 `baselines` 归谁**"；
  ③ ADR-029「验收」四条里 ② 与 ④ 未达成（②卡在 CI 仍构建 web/admin 与 `vercel.json` 这类发布声明；④卡在 ①／② 之后才能谈后端退场）。
  另有两次取数我没擅自启动：**`pnpm e2e`（浏览器那一半会写你的开发库）**、**真壳人工验收**。
- **一条诚实限度**：我在 17:03 试图标图用 mtime 证明"16:40 之后只改过文档"，**这个探针不成立**——
  `apps/` 下别人的在飞文件（`AuthorPage.tsx`／`ProjectListPage.tsx`／discover 那几页）与 `apps/web/dist/` 里我构建出的产物同样新。
  所以"点击层沿用 62 passed"的依据是**我自己的操作记录**（那之后我只写了文档与测试），不是机器证据。下一会话若要严格起来，重跑一次 `pnpm e2e:desktop` 约 3 分钟。
- **交接状态**：九份判据文件仍**未被 git 跟踪**（逐份点名见本节上方"当前恢复点"①），`??` 现测 **50** 条、其归属无干净机械信号，
  提交时只显式 `git add` 目标路径。§4 台账第六十八→七十五批连续，加上本收束轮（不再开新切片），`^## ` 仍是 8 段。
- **那句话就能推进的一步，给成可直接粘贴的命令**（这九份是 17:05 用 `git status --porcelain` 逐条取的；仓内没有我留下的探针或临时产物，已按 `probe|tmp|mutat|scratch` 筛过＝0 命中）：

  ```bash
  git add apps/web/src/shared/lib/creatorId.test.ts \
          apps/web/src/shared/lib/draftManager.test.ts \
          apps/web/src/shared/lib/identityKeyAuthority.test.ts \
          apps/web/src/shared/lib/llmSettings.test.ts \
          apps/web/src/shared/lib/playerReadState.test.ts \
          apps/web/src/shared/lib/playerSettings.test.ts \
          apps/web/src/shared/lib/playerToken.test.ts \
          apps/web/src/shared/lib/playerUnlocks.test.ts \
          apps/web/src/shared/lib/routeHistory.test.ts
  ```

  **别用 `git add -A`**：`??` 里还有早先批次留下的 `docs/README.md`、`docs/archive/`、`scripts/check-apibase-literals.mjs`，
  以及本周另一支在飞的 `backend/tests/test_condition_*` ×3 与 `packages/core/*Vectors*.test.ts` 等——归属只能人点名（§7 的在册纪律）。
- **复量 2026-10-09 18:17（第七十九批末；当前恢复点，取代上面 16:40 那条）**：共享遮蔽器 `maskNonCode` 修好后全部重量——
  `pnpm gates` **0**（十五道；`test:unit` 仍 **774 passed + 1 skipped**、web **309+1skip**、`[desktop-seams]` **9／6／99**、`[dead-surface]` 面 **294**／闭包内 245、`[dispatch]` 6 文件／32 函数／26+6，**没有一条基线被顶开**）·
  `check:citations` **0** · `e2e:desktop` **66 passed／0 skipped**（17:39 那次，含 E56/E57；本批只改脚本与文档，未再重跑）·
  `check:http-inventory` **0**（`ROUTES=25`、`SPEC_URLS=66`、桌面 0／浏览器 20）· `cloud:callmap` **0**（成对重取：早退页 **9**、保守上界 **16**、早退档 **12**、端点级 **29=6/23**、时机档 **28=18/2/8**、对账 **3/12**、第十三段 **5⇒1/0/4**）·
  `check:apibase` **0** · `git diff --check` **0 行** · stash **0** · `.e2e-lock` 不在 · `MUTATED` 探针 **0** · 仓内 `probe*` 残留 **0** ·
  三引用按 peel 仍 `1b9ca06`。**`??` 现测 50 条**（与本批开工前同数——中途写过的两个探针已删净），其中**本会话新写的判据 9 份**；
  全仓未跟踪的 `*.test.ts` 共 **23** 份，其余十四份是另一支在飞的产物。
- **复量 2026-10-09 18:37（第八十批末；当前恢复点，取代上面 18:17 那条）**：`pnpm e2e:desktop` **68 passed／0 skipped**（18:33，3.2m；动了 e2e 规格所以整套重跑，66→68 就是 E58 两半）· `pnpm gates` **0**（十五道；`test:unit` **774 passed + 1 skipped**＝core 143 / axs 94 / editor-core 189 / **web 309+1skip** / admin 39；`[desktop-seams]` **9／6／真断言 99**、`[dead-surface]` 面 **294**／闭包内 245／闭包外 10 在册、`[dispatch]` 6 文件 32 函数 26+6、`[labels]` 205／0、`[file-size]` 349／0）· `pnpm typecheck` **0**（含 e2e 那一腿 `tsconfig.e2e.json`，新用例的类型面因此被检查过）· `check:http-inventory` **0**（`ROUTES=25`、`SPEC_URLS=66` **未变**、桌面 **0**／浏览器 **20**、完全没证据的路由 **0**）· `LOADFACE=… pnpm cloud:callmap` **0** 且逐档与 18:15 全等（早退页 9／上界 16／早退档 12／端点级 29=6/23／时机档 28=18/2/8／对账 3/12／第十三段 5⇒1/0/4）· `check:citations` **0**（已判定 **252**、越界 5、不存在 0）· `git diff --check` **0 行** · stash **0** · `.e2e-lock` 不在 · `MUTATED` 与 `false && localOnly` 残留 **0** · 三引用 peel 仍 **`1b9ca06`**（仍未提交、未推送、未动 tag，按 §7）。**待显式 add 仍是九份** `.test.ts`（本批没新增判据文件，只加了 e2e 用例）；`??` 现测 **50** 条。**下一步（不需要他决策的那条）**：`reportApi.create` ⇒ `POST /report/` 至今仍挂在时机档「不明 8」里——它的宿主是 discover 项目卡菜单里那颗「举报」（`DiscoverProjectsTab.tsx:150`），与 E58 同形（喂一条项目卡 + 按名断言 + 桌面半断缺席与零请求），可复用同一套 `page.route` 就地应答。
- **复量 2026-10-09 18:48（第八十一批末；当前恢复点，取代上面 18:37 那条）**：`pnpm gates` **0**（十五道；`test:unit` 由命令汇总＝**774 passed + 1 skipped**＝core 143／axs 94／editor-core 189／**web 309+1skip**／admin 39，本批没写单测所以一字未动）· `check:citations` **0**（已判定 **252**、越界 5、不存在 0）· `[desktop-seams]` **9／6／真断言 99** · `[dead-surface]` 面 **294**／闭包内 245／闭包外 10 在册 · `[dispatch]` 6 文件 32 函数 26+6 · `[labels]` 205／0 · `[file-size]` 349／0（`scripts/**` 不在这张面里，`cloud-callmap.mjs` 现 **1315 行**不受 400 行闸约束——这是既有口径，不是本批新加的豁免）· `pnpm cloud:callmap` **0**（无 LOADFACE：台账 12／幽灵证据 0／重复键 0／对照通过＋"覆盖腿未跑"）· `LOADFACE=/tmp/b80-inv.txt pnpm cloud:callmap` **0**（B 档 12／没判据 0／多余 0；其余逐档与 18:15、18:36 三次全等）· `node --check scripts/cloud-callmap.mjs` 通过 · `git diff --check` **0 行** · stash **0** · `.e2e-lock` 不在 · `MUTATED` 残留 **0** · 三引用 peel 仍 **`1b9ca06`**（未提交、未推送、未动 tag，按 §7）。**`??` 现测 51 条**（比 18:37 多的那一条就是本批新文件 `scripts/desktop-cloud-judgements.json`）⇒ **待显式 add 现为十份**：九份 `.test.ts` ＋ 这份台账 JSON。**它不在别人机器上不会静默失效**——第十四段的第一条腿就是"台账读不出条目 ⇒ `UNRELIABLE` 退出 1"，所以漏 add 的表现是云面普查整条红，不是悄悄少验。下一批（仍不需要你定档）：`reportApi.create` ⇒ `POST /report/` 挂在时机档「不明 8」，与 E58 同形；再往后就只剩定档与两次授权取数。
- **复量 2026-10-09 19:00（第八十二批末；当前恢复点，取代上面 18:48 那条）**：`pnpm gates` **0**（**仍是十五道**——第二档长在 `check:dead-surface` 里，没新增命令；`[dead-surface]` 第一档 闭包外 **10** 在册／面 294／闭包内 245，第二档 多余导出口 **24**（基线 24、具名值导出 340、参考池 424）；`test:unit` **774 passed + 1 skipped**＝core 143／axs 94／editor-core 189／web 309+1skip／admin 39；`[seams]` 9／6／99、`[dispatch]` 6 文件 32 函数 26+6、`[labels]` 205／0、`[file-size]` 349／0）· `check:citations` **0**（已判定 **254**——本段每写一条 `路径:行号` 引用，这个数就自己 +1，所以引用它必须带取数时刻；越界 5／不存在 0 未变）· `pnpm cloud:callmap` 与 `LOADFACE=/tmp/b80-inv.txt pnpm cloud:callmap` 各 **0**（台账 12／B 档 12／没判据 0／逐档与 18:15 三次全等）· `node --check` 两个脚本均通过 · `git diff --check` **0 行** · stash **0** · `.e2e-lock` 不在 · `MUTATED`／`B82_DBG`／`b82ProbeUnused` **代码面残留 0**（`scripts/`＋`apps/web/src`＋`e2e/`＋`packages/` 四个目录 `grep -rl` 取到 0 个文件；这两个串在 `docs/` 与 `README.md` 各出现一次，那是本段在**描述变异本身**，不是探针没删）· 三引用 peel 仍 **`1b9ca06`**。**`??` 现测 52 条** ⇒ **待显式 add 现为十一份**：九份 `.test.ts` ＋ `scripts/desktop-cloud-judgements.json` ＋ `scripts/dead-export-baseline.json`（两份都是"不在就红"的锁，漏 add 表现为门禁 `UNRELIABLE`，不会静默）。**下一步（不需要你定档的那条）**：把 `identityLink.ts` 那三个死出口与 `UserContext.restoreFromEmail` 的第二份实现对账——**归一还是判死**属于 §6 的定档名单，但"哪一份真被界面调用"这件事我可以直接把证据补齐（`linkCreatorEmail`／`restoreIdentityFromEmail` 零 import 已由第二档在册盯着）。
- **复量 2026-10-09 19:13（第八十三批末；当前恢复点，取代上面 19:00 那条）**：`pnpm e2e:desktop` **70 passed／0 skipped**（19:12，3.3m；68→70＝E59 两半，动了 e2e 规格就整套重跑，不沿用）· `check:http-inventory` **0**（`ROUTES=25`／`SPEC_URLS=68`（66→68＝本批两条臂各一次字面量 `goto`，**不是新覆盖路由**）／桌面 **0**／浏览器 **20**／完全没证据 **0**）· `LOADFACE=/tmp/b83-inv.txt pnpm cloud:callmap` **0**，逐档与 18:15／18:36／18:46／19:02 五次全等（早退页 9／上界 16／早退档 12／端点级 29=6/23／时机档 28=18/2/8／对账 3/12／第十三段 5⇒1/0/4／台账 12=基线 12、没判据 0、幽灵证据 0）· `pnpm gates` **0**（十五道；`test:unit` **774 passed + 1 skipped**＝core 143／axs 94／editor-core 189／web 309+1skip／admin 39；`[dead-surface]` 一档 10 在册／面 294／闭包 245，二档 24＝基线 24；`[seams]` 9／6／99；`[labels]` 205／0；`[file-size]` 349／0）· `check:citations` **0**（已判定 **256**（本批文档自己新增的两条 `路径:行号` 引用各 +1；越界 5／不存在 0 未变——引用这个数必须带取数时刻））· e2e 的 `tsc -p tsconfig.e2e.json` **0** · `git diff --check` **0 行** · stash **0** · `.e2e-lock` 不在 · `false && isLocalOnlyDeployment`／`MUTATED` 代码面残留 **0** · 三引用 peel 仍 **`1b9ca06`**（未提交未推送未动 tag，按 §7）。**`??` 现测 52 条**（本批未新增文件）⇒ 待显式 add 仍**十一份**。**下一步（不需要你定档的）**：桌面臂已把「不明 8」全部归完，非决策矿脉里剩下的只有“给 `characterExport` 那条分派补一条按名点击判据”（导出按钮在桌面走本地库这一事实今天只有 `check:dispatch` 的静态档与 E17 的链尾零请求看着）；再往下每一条都要你先定 §6 那 12 条里的某一条。
- **复量 2026-10-09 19:18（第八十四批末；当前恢复点，取代上面 19:13 那条）**：本批**只改文档**（`docs/ADR/029-desktop-only-build-target.md` 的补记 + 本节），代码与测试一行未动 ⇒ 需要重跑的沿用 19:12／19:05 那批读数（`e2e:desktop` **70 passed／0 skipped**、`gates` **0**、`check:http-inventory` **0**、`LOADFACE=… cloud:callmap` **0**、e2e `tsc` **0**）；本轮新取的只有三条命令：`grep -rn "/api/v1" apps/web/src`（排除 `dist`）＝ **11 处／5 个文件**、`pnpm check:apibase` **退出码 0**（重定向到文件后单独取退出码，管道里取不到）、`pnpm check:publish` **退出码 0**（残差 4 全在册）；· `check:citations` **0**（已判定 **258**、越界 5、不存在 0） `git diff --check` **0 行** · stash **0** · `.e2e-lock` 不在 · `??` **52**（本批未新增文件；待显式 add 仍十一份）· 三引用 peel 仍 `1b9ca06`（未提交未推送未动 tag）。**状态**：非决策矿脉见底——ADR-029 四条验收**两条达成、两条卡在决策与授权**，且没有任何一条因为证据变多而升档。**下一步只能由你起头**：`S13-3` 判死口径／`S13-6`「13 条 `baselines` 归谁」／`ADR-029` 未决第 2 条（nexus 两条真云调用）／授权 `pnpm e2e`／真壳人工验收那两格。
- **复量 2026-10-09 19:31（第八十五批末；当前恢复点，取代上面 19:18 那条）**：这批**动了产品代码**（共享文本层 + 一个界面组件），所以按在册纪律全套重取而非沿用：`pnpm typecheck` **0** · `pnpm gates` **0**（十五道；`test:unit` **777 passed + 1 skipped**＝core 143／**axs 97**／editor-core 189／web 309+1skip／admin 39；`[file-size]` 349／0）· **`pnpm e2e:desktop` 70 passed／0 skipped**（19:30，3.3m）· `check:citations` **0**（已判定 **258**）· `git diff --check` **0 行** · stash **0** · `.e2e-lock` 不在 · `MUTATED` 代码面残留 **0** · 三引用 peel 仍 **`1b9ca06`**（未提交未推送未动 tag，按 §7）。`??` **52**（本批未新增文件）⇒ 待显式 add 仍**十一份**。**下一步**：(a) 需要你定档的仍照上条那五件；(b) 不需要定档、且本批新登记的下一条＝给 `MiniAxsEditor` 那行"合并显示发射侧诊断"补一条界面级判据（要在编排台演出层真造出"一拍两组分支"，否则那行删掉无人报警）；(c) 待决 ⑩ 的语义修法（并进第一组 / 扩语法）仍开着，本批只交付了"说出口"那一档。
- **复量 2026-10-09 19:40（第八十六批末；当前恢复点，取代上面 19:31 那条）**：`pnpm e2e:desktop` **71 passed／0 skipped**（19:37，3.3m；加了 `E60` 就整套重跑，不沿用）· `pnpm gates` **0**（十五道；`test:unit` **777 passed + 1 skipped**＝core 143／axs 97／editor-core 189／web 309+1skip／admin 39，本批无单测改动）· `check:http-inventory` **0**（`ROUTES=25`、`SPEC_URLS=69`（68→69＝E60 多一次字面量 `goto`，与覆盖面无关）、桌面 **0**／浏览器 **20**、完全没证据的路由 **0**）· `LOADFACE=/tmp/b86-inv.txt pnpm cloud:callmap` **0**（台账 12＝B 档 12、没判据 0、幽灵证据 0、重复键 0；其余逐档与 18:15 起六次全等）· e2e `tsc` 与 `typecheck` **0** · `check:citations` **0**（已判定 **260**，本批文档新落一条 `e2e/desktop-http.spec.ts:2116` 引用）· `git diff --check` **0 行** · stash **0** · `.e2e-lock` 不在 · `MUTATED`／`false &&` 代码面残留 **0** · 三引用 peel 仍 **`1b9ca06`**（未提交未推送未动 tag）。`??` **52** ⇒ 待显式 add 仍**十一份**（九份 `.test.ts`＋两份新基线/台账）。**状态**：界面级判据区间 **E17–E60**；上一批登记的缺口已当场关掉。**下一步**：需要你定档的仍那五件（`S13-3` 判死口径／`S13-6` 13 条 baselines 归谁／`ADR-029` 未决第 2 条／授权 `pnpm e2e`／真壳人工验收两格）；不需要定档的剩余候选已明显变薄——下一条我能想到的是给"发射侧诊断"再补一条 Writer 主通路（`draftToAxs` 目前不接这个出参，因为它的返回类型是 string，改动面涉及调用方签名，属可自决但不宜在本轮塞进来）。
- **复量 2026-10-09 20:15（第八十八、八十九批末；当前恢复点，取代上面 19:40 那条）**：`pnpm gates` **0**（十五道；这批动了 `apps/web` 与 `packages/*`，所以整套重取而非沿用）· `pnpm typecheck` **0**（含 e2e 那一腿 `tsconfig.e2e.json`）· `pnpm e2e:desktop` **72 passed／0 failed**（20:13，3.4m；第八十八批全量那次是 **71 passed／1 failed**，红在 E48，复跑不再现）· `pnpm e2e:desktop -g "E48"` 改造后**两次各 1 passed**（20:13、20:13）· `pnpm check:http-inventory` **0**、`LOADFACE=/tmp/b88-inv.txt pnpm cloud:callmap` **0**（20:12 那一对；台账 12／B 档 12／没判据 0，逐档与 18:15 起多次全等）· `pnpm check:citations` **0**（20:12；**本段之后又落了文档**，含 `apps/web/src/shared/storage/index.ts:163`、`deployment.ts:13`、`tauriSqlBackend.ts:33` 三条新坐标，故这个数以下面那条补记为准）· `[file-size]` **0**：`useProjectEditor.ts` 由 1109 降到 **1079**，baseline `1081 → 1080`（`--update` 安全前提已量：14 条 entry 全 `>400` 且当轮 0 违规）· `git diff --check` **0 行** · stash **0** · `.e2e-lock` 不在 · `MUTATED` 代码面残留 **0** · `??` **52** 条 ⇒ 待显式 add 仍**十一份**（本批没新增文件，`projection.test.ts` 与 `desktop-http.spec.ts` 都是 tracked）· 三引用 peel 仍 **`1b9ca06`**（未提交、未推送、未动 tag，按 §7）。**两条自己踩过的坑登记在此**：① 包装命令的通知退出码来自**最后一段**，第一次那次 `gates` 的 `EXIT=1` 就是被 `tail` 掩盖的（已按"重定向到文件后单独取退出码"重取）；② 我试图用 `pnpm exec tsc -p tsconfig.e2e.json` 单取 e2e 那一腿，从根目录跑得到的是 **254＝`Command "tsc" not found`**，那不是代码红，是命令写错了——正确入口一直是 `pnpm typecheck` 的最后一段。**下一步**：需要你定档的仍那五件（`S13-3` 判死口径／`S13-6` 13 条 `baselines` 归谁／`ADR-029` 未决第 2 条 nexus／授权 `pnpm e2e`／真壳人工验收两格）；非决策类剩下的一条是**把 `identityLink` 那三个死出口与 `UserContext.restoreFromEmail` 的第二份实现对账**（归一还是判死要你先定，但"哪一份真被界面调用"的证据我可以继续补）。
  **（补 20:16 那两条末取值）：`pnpm check:http-inventory` **0**（`ROUTES=25`／`DESKTOP_UNIQUE=0`／`BROWSER_UNIQUE=20` 正对照／`UNMOUNTED=0`／**完全没证据的路由 0**；`SPEC_URLS` **69 → 70** ＝ 第八十九批那条**故意不存在的** `GET /api/v1/e48-sentinel` 正控字面量，按在册口径它只数"规格里出现的字面量次数"，**没有给任何路由买到新证据**——这正是它该被这样读的方式）· `pnpm check:citations` **0**（已判定 **263**、越界 5、不存在 0、歧义跳过 18、只落在被跳目录 4；这次取数在"复量 20:15"那条落笔**之前**，故那条里三条新坐标没进 263，最终以再下一次取数为准）。
- **复量 2026-10-09 20:19（第八十九批末的棘轮与引用重取）**：`pnpm check:seams` **0**（桌面接缝 9／有判据 6／真断言合计 **99**／基线在册 3——本批没动接缝面，计数一字未变）· `pnpm check:dead-surface` **0**（一档：闭包外 **10** 全部在册，面 294／闭包内 245；二档：**具名值导出 340 → 343**（本批新增的 `projectWithNotice`／`kernelEdgeFromRf`／`kernelNodeFromRf` 都在分母里），而**零外部读者仍是 24 ＝ 基线 24** ⇒ 三个新出口都被真读者拿走，棘轮没被"加出口"这件事顺手放宽）· `pnpm check:citations` **0**（已判定 **266 → 270**，多的四条正是第八十九批那条身份链证据里的 `路径:行号`，每条落笔前都按 grep 现取过行号——`identityLink.ts:21`／`:17`、`UserContext.tsx:73`、`ProfilePage.tsx:163`）· **`pnpm e2e:desktop` 认证跑 20:21 = 72 passed／0 failed（EXIT 0）**——E48 改造之后按"动了 e2e 规格就整套重跑"这条在册纪律重取了全量，不沿用 20:13 那条。至此第八十九批的读数是齐的：**gates 0／typecheck 0／e2e:desktop 72／seams 0／dead-surface 0／citations 0（已判定 **273**，这条落笔又把数推到 273——270 是 20:19 那一次，引用它必须带时刻）／diff --check 0 行**；那次 71/1 的红在被改造的判据上不再可能出现（两臂各数各的），但其**机制仍是推断**（未复现），所以 §4 那条"未闭环"不撤销。另：`MUTATED` 代码面残留 **0**（`apps/web/src`＋`e2e`＋`scripts`＋`packages` 四目录 `grep -rl` 取到 0 个文件）。
- **复量 2026-10-09 20:28（第九十批末；当前恢复点，取代上面 20:19／20:16／20:15 那几条）**：`pnpm gates` **0**（十五道；`test:unit` 逐包＝core **143**／editor-core **191**／web **314 passed + 1 skipped**／admin **39**，web 那 309→314 就是本批的 4 条 `projectWithNotice` ＋ 1 条分派支名；`[desktop-seams]` 9 接缝／6 有判据／**真断言合计 99 → 102**——本批三条新断言被接缝门禁自己数进去了，基线未放宽／缺测试 3 与基线一致；`[file-size]` 349 文件 **0 越线**；`[dead-surface]` 一档闭包外 10 在册，二档具名值导出 **343 → 344**（新出口 `getStorageProviderBranch` 有读者）而零读者仍是 **24＝基线**）· `pnpm typecheck` **0** · `pnpm e2e:desktop -g "E48"` **0** 与全量 **72 passed／0 failed**（20:26，动了产品代码 ⇒ 整套重跑不沿用）· 成对变异一次跑完：短路本地库支 ⇒ E48 **红在"Provider 必须走本地库支"**（1 failed）；还原 ⇒ 1 passed，`BYTE_IDENTICAL=true`，且还原后重跑全量仍 72 · `pnpm check:citations` **0**（已判定 **273**、越界 5、不存在 0）· `pnpm check:http-inventory`／`pnpm cloud:callmap` 沿用 20:16 那一对（本批没动云端调用面：新加的支名不是调用点）· `git diff --check` **0 行** · stash **0** · `.e2e-lock` 不在 · `??` **52** ⇒ 待显式 add 仍**十一份**（本批只改既有文件）· 三引用 peel 仍 **`1b9ca06`**（未提交、未推送、未动 tag，按 §7）。**状态**：§4 界面级判据区间 **E17–E61**；上一批那条"未闭环"的归因手段已就位——E48 的红消息现在自带支名，下次再出现不必从 72 条里找。**下一步仍在你这边**：`S13-3` 判死口径（本批已把身份链那份对比证据补进去）／`S13-6` 13 条 `baselines` 归谁／`ADR-029` 未决第 2 条 nexus／授权 `pnpm e2e`（浏览器臂会写你 :8000 的开发库，所以我一直挂着没跑）／真壳人工验收两格（素材到货、落盘与像素）。
- **接手边界刷新（2026-10-01 05:18 复量；这节今天滚动刷新过多次，下面 09-30 那段按当时实态保留、不再代表现在）**：
  05:05–05:16 之间又落了**两刀**（第二十八批＝第 14 道门禁补第 3 层"有没有真断言"；第二十九批＝同一道门禁的扫描面从假设改成实测）；**两刀都没新建文件**，只改 `scripts/check-desktop-seams.mjs`、`scripts/desktop-seam-baseline.json` 与文档，所以下面那份显式 add 清单不变。
  **一眼状态**：边界三件套仍重合（`git rev-parse` 三个引用同为 `1b9ca06`）、`.e2e-lock` 不存在、`git diff --check` 干净；
  **六条链的一次性收口认证读数（gates / test:unit / 两套 e2e / 两个构建 / 桌面 cargo / 后端 pytest）全在 §5 顶部那几条里（04:56 的六链收口认证 + 05:06/05:07、05:13、05:24 各次复跑 + **05:30 两套 e2e 与产物层测量** + **05:32 引用陈旧普查**），取数与退出码逐条单独记录——下一会话直接引用那几条，不必再逐节拼**；
  全链绿（`gates` 0 且 **14 道**、单测 **600 passed + 1 skipped**、`e2e:desktop` **37 passed**、`check:citations` OK 第 12 道、`check:publish` OK 残差 4 在册第 13 道、**`check:seams` OK 桌面接缝 9 个 / 有判据 6（真断言合计 94）/ 在册 3 条第 14 道**、`web` 的 `tsc -b` 0）；
  **自主矿脉的位置**：AXS 文本层与门禁自报限度两条都挖到"再挖要么误报、要么等你定口径"的程度（今天三次按证据作废：`_line` 死读、`role.remove` 无界面入口、`check:citations` 内容层档）；
  **05:18 明确登记：非决策矿脉至此挖空。** 判据是"剩下的每一条都要先有人定口径"——`check:publish` 那 4 条残差要的是删不删、`check:apibase` 要的是口径措辞、
  两条 e2e 通路合并要的是入口归一、`.axsp` 那三条要的是播种权威与重复导入策略。再往下只剩两种动作：**给自己造新工具**（净零原则不该做）或**替用户做决定**（不该做）。
  **验收四条里两条未达成，且都只能由定档解锁**——见本节顶部那条机械复核块。
  **已上线第 13 道门禁 `check:publish` 把未达成的②钉成棘轮**：4 条残差具名在册（CI 那段 `build:web && build:admin`、`vercel.json`、`docker-compose.yml`），
  它不替任何人决定「删不删」，只保证不会再悄悄多出一件；删一项须重跑 `node scripts/check-publish-target.mjs --update` 缩短基线。
  牙齿：临时放 `netlify.toml` ⇒ FAIL 点名，删掉 ⇒ OK（02:48 实测）。
  ①那条原先写着「判据本身不可判」——**第二十七批已把它做成可判候选**：`pnpm check:apibase` 实测`越界调用点 0`、退出码 **0**，
  口径（"只允许出现在测试／注释／`client.ts` 的 `apiBase` 行"）你点头就接进 `gates`（差一行），所以它现在欠的不是判据而是**定口径**。
  边界三件套仍重合——HEAD `1b9ca06` **==** `refs/remotes/origin/desktop` **==** tag `desktop-handoff-20260929`，`git diff --check` 干净、`.e2e-lock` 不存在。
  `git status --porcelain` 现为 **62 ` M` / 17 ` D` / 28 `??`**（05:24 复量；比 05:17 多的 1 份 ` M` 是 `main.tsx` 抽出判据、2 份 `??` 是 `shellSmokeGate.ts` 与它的测试）。
  **⚠️ 未跟踪文件的归属不可自动判定（2026-10-09 08:06 复量，别再引用下面那句"二十四份"当现状）**：
  `git status --porcelain | grep '^??'` 现为 **38 项**（05:24 那次是 28 项），多出来的含本周另一支在飞的产物
  （`backend/tests/test_condition_*.py` ×3、`packages/core/{conditionVectors,familySupport,keyGrammarVectors,matcherVectors}.test.ts` ×4、`testdata/conditions/`）。
  两条派生信号我都试过，**都不成立**，下一会话别重试：
  ① 按"是否被本重构文档引用"归属——第一次跑就坏了：`grep --include=*.md` 在 zsh 下报 `no matches found`，
     于是 38 项全报"引用数 0"（连必定被引用过的 `shellSmokeGate.ts` 也是 0）。**整列全 0 = 我的 grep 没跑**，不是"没人引用"；
  ② 按 mtime 归属——不够用：`scripts/ports.json`、`ports.d.mts` 是 09-30 却确属本重构（#71），
     而我 10-01 写的 `tauriSqlBackend.test.ts`、`packages/editor-core/src/axsImport.ts` mtime 是 10-05（那支动过我的文件）。
  ⇒ 提交时只能由人点名：要么"两支各一次提交"，要么先确认 condition/vector 一族归谁。**禁止 `git add -A`**（§7），
  且 `Clearance/`、`backend/uv.lock`、`providers/__init__.py` 任何情况下都不许进。下面这份枚举是 **05:24 的本重构清单**，今天的增量只有
  `packages/editor-core/src/axspReimport.test.ts`、`scripts/desktop-http-inventory.mjs`(改)、`scripts/cloud-callmap.mjs`（新增）。
  **09:34 再复量：`??` 从 38 项增到 41 项**，多出的三份全部是本批新建且确属本重构的
  `scripts/source-graph.mjs`、`scripts/check-dead-surface.mjs`、`scripts/dead-surface-baseline.json`（`git ls-files` 三份计数 **0** ⇒ 确实未纳管），
  38 + 3 = 41 对得上才敢写这句；它们要连同上面那份枚举一起被**显式点名 add**，仍然禁止 `git add -A`。
  提交时必须**显式 `git add`** 的新文件共**二十四份**（05:17 用 `git status --porcelain | grep '^??'` 重量过：未纳管 **26** 项 = 这 **22** 份（05:24 复量起为 **28** 项 = **24** 份，多出的是 `shellSmokeGate.ts` 与它的测试；其余四件他人在飞不变） + `Clearance/` + `ChoiceOptionsEditor.tsx` + `docs/README.md` + `docs/archive/` 四件他人在飞，数字对得上才敢写"清单不变"；本轮新增两份：`scripts/check-apibase-literals.mjs` 与它对应的 `package.json` 行改动）：`scripts/ports.json`、`scripts/ports.d.mts`、
  **`scripts/check-doc-citations.mjs`**、**`scripts/doc-citation-baseline.json`**、
  **`scripts/check-publish-target.mjs`**、**`scripts/publish-target-baseline.json`**、
  `packages/editor-core/src/axsImport.ts`、`packages/axs/src/edges.ts`、`packages/axs/src/condition.ts`、`packages/axs/src/condition.test.ts`、
  `packages/axs/src/doc-examples.test.ts`、`packages/axs/src/instructions.ts`、`testdata/axs-draft/unknown-speaker.json`、
  **`apps/web/src/shared/storage/tauriSqlBackend.test.ts`**（第十七批新增）、
  **`apps/web/src/shared/storage/tauriAssetStore.test.ts`**（第十九批新增）、
  **`apps/web/src/shared/storage/axspImport.rollback.test.ts`**（第二十二批新增）、
  **`scripts/check-desktop-seams.mjs`**、**`scripts/desktop-seam-baseline.json`**、
  **`apps/web/src/shared/storage/assetContext.test.ts`**（第二十四批新增）、
  **`apps/web/src/shared/storage/index.test.ts`**（第二十五批新增）、
  **`apps/web/src/shared/storage/assetRecords.test.ts`**（第二十六批新增；05:18 校清单时发现它被漏在这份枚举之外——计数"二十二份"是对的，枚举只有二十一项，现在补齐），
  **`scripts/check-apibase-literals.mjs`**（第二十七批新增，`package.json` 里对应的 `check:apibase` 一行也要一起提交）、
  **`apps/web/src/shared/storage/shellSmokeGate.ts`**、**`apps/web/src/shared/storage/shellSmokeGate.test.ts`**（第三十批新增：入口冒烟判据与它的 6 条判据）。
  其余未纳管条目（`apps/web/src/features/studio/components/ChoiceOptionsEditor.tsx`、`docs/README.md`、`docs/archive/`、`Clearance/`）仍属其他在飞工作，**别顺手 add**。
  末轮数字（02:26 一次取数）：`pnpm gates` **0**、单测 **550 passed + 1 skipped**（axs 88）、`pnpm e2e:desktop` **37 passed**（02:23）、`pnpm e2e` **50 passed**（01:52）、`pnpm build:web` **0**（02:00）、`git diff --check` 干净。
  今天多交付的三刀都属"文本层静默失败"族：#79 认不出的方括号补 warning（语义未改、分母 20 处命中 0），
  #82 `>=`/`<=` 被 `?? "eq"` 静默降成相等（五处同步补齐、跨 TS 与 Python 两种语言，Python 侧无测试覆盖、改用 `.venv` 直调取数），
  以及把那条兜底本身拆成 fail-closed + 一条从 `COND_OP_RE` 自抽记号表的不变量（成对变异：加 `=~` 时新守卫得 `null`、旧兜底得 `eq`）。
- **恢复点**：本地 HEAD `1b9ca06` **==** `origin/desktop` **==** tag `desktop-handoff-20260929`（三点重合，`git rev-parse` 复核过）。
  今天第十二→十八次这一整串工作**全在未提交工作区**：`git status` 现计 **49 处 ` M` + 7 项未纳管**。
  其中本轮新增、提交时必须**显式 `git add`** 的四份：`scripts/ports.json`、`scripts/ports.d.mts`、`packages/editor-core/src/axsImport.ts`、`packages/axs/src/edges.ts`；
  别的未纳管条目（`apps/web/src/features/studio/components/ChoiceOptionsEditor.tsx`、`docs/README.md`、`docs/archive/`、`Clearance/`）属其他在飞工作，**别顺手 add**。
  `.e2e-lock` 当前不存在（没有并跑的套件），`.dmg` 那笔失败仍未归因、只登记不结论。
- **今天这一串交付了什么**（task 表 #70–#76，逐条都带实测数字与"旧脚本×新改动"的对照）：
  端口真相源下沉成 `scripts/ports.json` 并归一 13 处硬写；跨运行时实测（CI 同档 Node 20.20.2 下两套配置 `--list` 50 / 37、退出码 0，
  而 `.mjs` 进配置在 20/22/26 **三档全红**，据此撤销了一条传了两轮的错归因）；
  普查脚本 `desktop-http-inventory.mjs` 自带"这次没跑成"的判据（活服务 8/8 绿、死端口 0/8 红）；
  `check:dispatch` 关掉"块外真调 provider"漏检（正向块证据收窄到块内，语料 30 个函数形状 `positive-block=4 / after-guard=26` 全绿）；
  `check:purity` 关掉"行尾注释喂口"（四形状探针，新旧对照 4 处 → 3 处）；
  `check:labels` 第一档从"提了 htmlFor"改成"目标被同文件 id 接住"（12 处 htmlFor、MISS=0 ⇒ 零误报上线）；
  §6 闸门台账机械复核（14 个闸门文件不变；引用编号里 `E20` 已成幽灵，断言仍在，注释与台账已按实改写）。
- **末轮数字**：**2026-10-01 00:33 复核审计重跑过一遍 `pnpm gates`，退出码 0**（含今天收紧的三道各自 OK：`labels` 205 文件 0 处 / `dispatch` 5 文件 30 函数、形状 `positive-block=4、after-guard=26` / `purity` 40 文件 0 违规；单测 editor-core 158 等按同一份日志）。
  14:13 那次全链同样为 0；其后只改过 `.md` 与 spec 注释，`check:size` 于 14:20 重跑仍 0 越线。
  `pnpm e2e:desktop` **37 passed**（14:20，注释改动后重跑）/ `pnpm e2e` **50 passed**（14:06 那次，其后未动浏览器侧输入）/ `git diff --check` 干净。
  边界三件套同一时刻复量：HEAD `1b9ca06` **==** `refs/remotes/origin/desktop` **==** tag `desktop-handoff-20260929`；
  `git status` = 49 ` M` / 17 ` D` / 7 `??`；三份必须显式 add 的新文件仍在树且 `git ls-files` 计数 0（`scripts/ports.json`、`scripts/ports.d.mts`、`packages/editor-core/src/axsImport.ts`）。
- **剩下还能自主的矿脉见底了（2026-10-01 第二十一次续做后）**：原记三条限度已关掉一条（`labels` 悬空检查升到全仓，跨文件命中单独计数、实测 0）；
  剩两条是 `labels` 的祖先链（文本级判据量不到，行为侧由 E25/E27/E30/E31/E32/E38 那批 exact 可访问名判据替身）与
  `dispatch` 两档宽窗口 + `purity` 跨行块注释。三条都**不建议盲动**：换 AST 换来的是"少一类理论误判"，代价是多一套要维护的解析与新的漏报面。
  再往下就是产品判断，不是我这一轮能替你定的。
- **需要你一句话的清单**（十五条，全部带实测残项或可点名的候选修法；task 表里有对应的工单标题）：
  ① #70 —— `baselines.spec.ts` 那 **13 条**归谁（搬离线 / 让后端只为这 13 条当测试宿主）；
  ② S13-3 云本质功能判死清单（含 `vercel.json`、Nexus 收件箱、Glossary #58、`PromptExport` #60）
     ——**分母已量化**：`cloud:callmap` 的「绕过」34 条里，按调用点减掉壳守卫后**桌面真会打出去的是 29 条**（第四十批），
     这 29 条再按本地承载分：**无本地承载 17 / 仅父资源承载 6（关系与版本那一族）/ 无承载且调用者仅 Discover 4 / 自身承载但仅 Discover 1 / 自身承载只差分派 1**（17+6+4+1+1 = 29，命令算的；
     被守卫挡开的那 5 条全部落在"无本地承载"里，所以 22 是母集数、17 才是子集数——两套分档交叉时要重算，别沿用母集数字）；
     **（2026-10-09 第四十七批两笔更正 + 一件已办）**
     ⑴ 「桌面真会打出」的可达性侧原来报「12 条端点所有未守卫点桌面都走不到」——**那 12 里有 6 条是我的工具缺陷造出来的**：
     `cloud-callmap` 的 lazy 正则两条一严一松，严的那条认不出跨行的 `lazy(\n  () => import(…))`，
     于是 5 个真路由页（discover 详情族）没进宿主闭包。归一成 `source-graph.mjs` 的 `lazyImports()` 后复量：
     **端点级 6 走不到 / 29 走得到**，走不到的只剩 `usePlayer.ts` 那 6 条试玩端点。
     ⑵ 加载面普查（`check:http-inventory`）把手抄 9 条换成解析得出的 25 条之后，桌面臂当场量到 **7 个云端调用点**，
     全在 discover 详情 / 话题 / 创作者主页这 6 页 ⇒ 原来那句"桌面态零 /api/v1"是真的、**覆盖面是假的**。
     ⑶ 已办（不需要你定档）：这 6 页补了 `DiscoverPage` 那道 `isLocalOnlyDeployment()` 闸门的另一半
     （E35 的标题就叫「入口与目标同生共死」，可它只测了入口），普查复量 `DESKTOP_UNIQUE=0 / BROWSER_UNIQUE=20`，
     并上线 **E44** 六条点击层判据（变异证据：只删 effect 里那行闸门 ⇒ 恰 1 条红，点名 `/api/v1/editor/assets/items/no-such-item`）。
     ⇒ 所以这条定档要答的**不再是 discover 在桌面发不发云**（已经统一成"显式缺席"），
     而是**剩下那些没有本地承载的东西要不要判死**：三条零消费者 barrel、6 条试玩端点、死面 11 条、`vercel.json` 与 Nexus 收件箱；
     **死面 12 条的两侧证据已齐**（第四十一批）：前端读者全部为 0、后端路由 11 在 / 1 不在，
     （**09:43 更正**：第四十五批发现消费者面把 `shared/api/` 整目录排除，连带把该层里的分派口 `draftDispatch.ts` 也当不存在，
     于是 `POST /editor/ai/prose-to-script` 被误报成死面。修正后是 **11 条 / 10 在 / 1 不在**，其余读数不变）
     其中 `PUT /editor/projects/{projectId}/nodes/{nodeId}` ← `projectApi.updateProjectNode` **既零读者又指向一条后端不存在的路由**（新登记，今天无用户影响）；
     「测试」列恒 0 的前提是**测试层完全不 import api 层**（实测 0 个文件），所以判死这批不会碰坏任何测试——反面是 api 层在测试层零覆盖、判错没有回归网；
     **死表面另有机器清单**（第四十三批，从 `main.tsx` 走 import 闭包）：闭包外 **10 个模块**、"只有测试在读" **0 个**，
     其中两个是零消费者 barrel（`shared/api/index.ts`、`shared/hooks/index.ts`），`usePlayer.ts`（6 条试玩端点的唯一调用者）、`GlossaryEditor.tsx`（#58）、`DiscoverStatsBar.tsx`、五个 `shared/components/*` 都在这一档；
  ③ S13-6 随包示范作的播种权威二选一（TS 迁入 vs 宣布 `.axsp` 种子为权威）；
  ④ S13-7 两套「AXS 文本 → 图」：**策略四处已同源（字段映射、落位公式、可复用 id 判定、同名复用策略，2026-10-01 第二十三批归一）**；
     现在只剩"两个入口的外层循环与返回形状要不要合成一个"——不改语义，收益是少一份循环体，代价是动两条通路的调用签名；
  ⑤ #57 dev 库 2638 条测试残留清不清；⑥ #66 自动存档 600ms 防抖窗口；
  ⑦ #16/#27/#31 真壳手验（冷启动播种、SQLite 回读、`OLLAMA_ORIGINS`）——这三条我这边无法取证；
  ⑧ **打印要不要把"指向下一拍的顺序边"物化成显式 `->` 行**（工单同名）：现状是物化，往返多一行；不物化则文本干净但"移动节点"会静默重连。
     既有契约断言 `projection.test.ts` 钉的是"物化"，所以这一条改了会动契约，不是我单方面能定的；
  ⑨ **全角冒号对白要不要给提示**（工单「全角冒号对白被静默当旁白」）：零误报不可得，因为要先定"哪些前缀算旁白正文"——
     `旁白：她转身离开。` 是合法整行旁白，而文档自己的示例就有 6 处。三条候选（白名单前缀 / 引入显式旁白语法 / 只对已绑定角色名提示）的前置条件写在工单里；
  ⑩ **一个 Beat 的第二个分支组在发射时被丢掉**（工单同名）：`printBeatBody` 用 `find(op === "choice")` 只取第一组，第二组连选项一起消失且无诊断，
     违反 ADR-016 的 `parse(print(beats)) ≡ beats`；界面没有"每拍只许一个分支"的守卫（`ScriptEditor.tsx` 第 81 行），连点两次即成立。
     三条候选（合并成一组＝改叙事语义 / 扩语法＝动语法冻结面 / 发射侧加诊断＝要给 `printAxs` 加可选出参），**我推荐第三条**：先止住静默，语义等下一次再谈。
     判据已就位（`roundtrip.test.ts` 末那条特征化断言），定档之后改写它而不是删掉它。
     **（2026-10-09 第八十五批更新）第三条的地板已交付**：`printAxs` 现在把"第二组被丢掉"报成一条 warning（文本逐字不变），
     UI 侧 `MiniAxsEditor` 合并显示。**⑩ 本身仍开着**——欠的是语义修法选哪条（并进第一组 / 扩语法），那不是发射器能单方面定的。
  ⑪ **素材摘要的降级兜底我今天按证据撤销了**（工单「素材摘要的 FNV 兜底…」）：现在缺 `crypto.subtle` 就**拒绝落盘**并给可读错误。
     若你的优先级其实是「任何环境都得能存」，该退回另一条修法——保留兜底但把降级**显性化**（ref 加可见标记 + 一次性告警）；
     代价与依据都写在 `docs/ADR/026-local-assets-and-axsp-v2.md` 末尾的补记里（ref 命名契约会变、用户文档那段要跟着重写），改动局限在一个函数的一条分支，回退成本低。
     **（复审 2026-10-01 补记）这一刀有一个平台维度的后果本机验不了**：`crypto.subtle` 只在安全上下文里存在，
     而 Tauri v2 的生产 origin 在 macOS/Linux 是 `tauri://localhost`、**在 Windows 是 `http://tauri.localhost`**——
     后者算不算"potentially trustworthy origin"**未验证**。若算不安全上下文，那么 Windows 生产构建里
     `saveAsset` 会**每次**返回「已拒绝落盘」，即该平台上素材链路整体不可用（DEV 走 `http://localhost:5174` 回环，不受影响）。
     验法与两种可能的后果写在 ADR-026 末尾那条补记里，`desktopSmoke.ts` 的 `asset-save` 是现成观测点。
     **它不改变⑪的结论**（静默降级仍然更坏），但它让"显性化兜底"在第三种读数下反而更合适——那也是需要你定档的部分。
  ⑫ **同一个 `.axsp` 导第二次一定失败**（工单同名）——**2026-10-09 已按推荐交付，不再是待决**：修法取"导入侧同时重映射节点与边的身份"（`remapNodeIds`，与 `remapCharacterIds` 同族），判据在 `packages/editor-core/src/axspReimport.test.ts`（真 SQLite，内存宿主测不到）与 `storage.test.ts` 的往返条。原条目全文保留如下：实测同一条节点 id 写进两个真 SQLite 工程 ⇒ `second.ok=false`、错误 `io「saveNarrative 事务失败已回滚」`；
     成因是 `project_nodes.id` 为全局主键，而导入只重映射角色 id。三条候选（节点 id 一并重映射＝需同步改写边与 `axsSource` 引用／主键改成复合键＝要一次本地库迁移／导入前查重给可读提示＝最便宜但不解决正常复用需求），
     **我推荐第一条**——"包内 id 是包本地的"这条语义角色已经是这么做的，节点跟着它才一致。这动的是导入语义，所以我没单方面改。
  ⑬ **要不要给 L4 契约补 `deleteCharacter`**：失败导入删得掉工程、删不掉本次新建的角色，于是"不留半套内容"只兑了一半（每重试一次多一组孤儿角色，界面上出现在「我的角色」里）。
     这一条的前置问题与今天在册的「内核有 `role.remove` 能力、界面没有入口」是同一个：**仍在被引用的对象怎么办**（清空成无名台词／退回旁白／阻止删除并列出引用点）。定了它才能同时把⑫那半也补圆。
     **（复审 2026-10-01）这一条的范围被量准了**：原先登记的残留只覆盖"工程已建好之后"的出口，
     而 `createProject` / `saveCharacter` 排在前面那两个出口**连工程都删不掉**（已由"把 `createProject` 提到最前"消掉，
     角色残留仍在）。残留现在的精确形状是：**第 N 个角色失败 ⇒ 前 N-1 个角色留下**（夹具已改成两个角色才量得到这一格），
     判据在 `axspImport.rollback.test.ts`。所以⑬要回答的是"半套角色"而不是"整套角色"。
   ⑮ **（复审 2026-10-01 新增）核心里 `saveCharacter` 没有 authorId 兜底，而两个兄弟方法有**：
     `saveItem` / `saveScene` 都是 `authorId ?? defaultAuthorId`，而 `SqliteStorageProvider` 的第三个构造参数
     就是 `getCreatorId()`——**本地作者已经是这个 provider 自己的"默认所有者"**，角色是唯一没接上的。
     实测两端一致（`authorId: null` 的角色在无范围列表与按 author 查里都是 0 条，只有 `getCharacter(id)` 拿得到），
     且**今天不可触发**：唯一活路径 `CreateCharacterPage` 两个调用点都传了 `getCreatorId()`，
     `axspImport` 也显式传 `authorId: owner`。已修的只是 hook 那一行（`data.author_id ?? ''` 把"没给作者"
     折成 `""`，那是**第三种东西**，两边都不匹配 ⇒ 存进去却在所有列表里查不到；改成 `?? getCreatorId()`，零风险）。
     要问的是：**核心里要不要也补那条兜底**——补了要动两个后端的构造参数，
     而"一个没有作者的角色归谁"本身是个设计问题（与 ⑬ 同族的"仍在被引用的对象怎么办"）。
   ⑯ **（复审 2026-10-01 新增）`relationship` 族的键语法与另两族不一致，要不要统一、往哪边统一**：
     `character_state` 与 `codex` 是「切**第一个**点、**其余整体**当键」⇒ **键可以带点**；
     `relationship` 是「按点切、取第 3 段、**第 4 段起静默丢弃**」⇒ **键不能带点**，且**零诊断**。
     实测（2026-10-01，第四十五批）确认两族的**写侧与读侧规则一致**：
     写 `A.B.affection.mood=7` 落进 `{affection: 7}`，长键读与短键读都读到同一格
     ⇒ **不存在「写 A 读 B」的错配**，多写的第 4 段在两侧被同样地丢弃（所以这条**不是**分支开错，是"作者多写的部分被静默忽略"）。
     真正的残留是**跨族不一致**：同一个「带点的字段名」在 `character_state`/`codex` 里可用、在 `relationship` 里不可用。
     两个选项：① 把 `relationship` 也改成"其余整体"（**向后兼容**：所有现役 3 段键行为不变，
     只有 ≥4 段的键从"丢弃尾段"变成"整个键名"，而那种键没有测试、也没有文档教作者写）；
     ② 保持丢弃但**补一条诊断**（遇到 >3 段就报出来），不改语义。
     复审**不单方面选**：① 改的是**键语法**（和 ⑭ 同族——ADR-016 冻结的是 AXS 语法面），
     ② 引入一条新的告警通道（"零诊断"本身在前几批被反复当缺陷治，但那是**分支开错**类，这是**作者写错字**类，代价不同）。
     已把**现状**钉进 `testdata/conditions/families.json` 的 `keyGrammar` + `roundTrip` 与
     `packages/core/src/keyGrammarVectors.test.ts`，所以这个决定有基线、日后任何一侧改动立刻被看见。
   ⑭ **（复审 2026-10-01 新增）AXS 的消歧写法 `标题-N` 不是保留命名空间**：
     `# 开场` / `# 开场` / `# 开场-2` 实测得到 id `开场` / `开场-2` / `开场-2`——
     **重复 id + 邻接边退化成自环 + 零诊断**，且**修改前后一样红**（不是新引入的）。
     它不能在实现里顺手修：`titleToId` 的优先级是「原始标题先、id 后」，字面标题占住 `标题-N` 之后，
     那个自动生成的引用会解析到字面标题那一拍 ⇒ 关掉它必须改**消歧方案本身**，那是 ADR-016 的语法冻结面。
     三条候选（换一族标题产生不了的形式／给字面标题让路／接受现状并加 warning 把形状说破）。
     分母 **0**：三份 `.axsp` 的 `axsSource` 是空串，`docs` 围栏 + testdata + 测试模板共 34 条标题 slug 撞车 0 处。
     **我建议第三条**——零误报且不改语法，但那条 warning 会把"字面标题占位"这件事在文本层说破，作者得能改。
     依据与实测见 `docs/ADR/016-axs-narrative-language.md`「补记（2026-10-01，复审）」。
- **一个收口建议**：这一整串都在工作区里飘着，而未提交的面越大，多会话并行的改动就越难分离（今天已经发生一次：本文件被另一会话整体重写）。
  值得考虑把第十二→第二十八次这批（端口真相源 + 三道门禁收紧 + 普查脚本加固 + AXS 文本层五刀 + 文档同步）落成 3–5 颗连贯提交并补一枚 wip tag——
  **但 push 与打 tag 按 §7 需要你明确同意，我不会自行动手**。

**接手快照（2026-10-09 10:43 现测，恢复点用）**- **复量 2026-10-09 16:06（第六十八批末；当前恢复点）**：`pnpm gates` **0**（十五道；`test:unit` **716 passed + 1 skipped**，web 241 → **251**）· `pnpm e2e:desktop` **62 passed**（零 skip）· `pnpm check:http-inventory` **0**（`SPEC_URLS=64`、`正则 33/33`）· `pnpm cloud:callmap` **0**（调用点 16/37、待复核 15、桌面真会打出 20）· `pnpm typecheck` **0** · `git diff --check` **0 行** · stash **0** · 三引用仍重合 `1b9ca06`。**待显式 add 的新文件多一个**：`apps/web/src/shared/lib/playerUnlocks.test.ts`（未跟踪；不 add 就别人机器上少 10 条单测）。
- **复量 2026-10-09 16:14（第六十九批末；当前恢复点）**：`pnpm gates` **0**（十五道；`test:unit` **736 passed + 1 skipped**，web 251 → **271**）· `pnpm typecheck` **0**（`tsc -b --listFiles` 命中三份新文件＝3）· `pnpm check:citations` **0**（已判定 243、越界 5 在册、不存在 0）· `[desktop-seams]` **9／6／真断言 99（本批未变，非漏检）**· `[dead-surface]` 闭包外 10 条全在册、面 289／闭包内 245 · `pnpm e2e:desktop` 上一轮 **62 passed**（本批只加单测，未重跑点击层：改动不落在那五个 spec 的面上）· `git diff --check` **0 行** · stash **0** · 三引用仍重合 `1b9ca06`。**待显式 add 的新文件现为四份**：`playerUnlocks` / `creatorId` / `playerToken` / `playerSettings` 的 `.test.ts`；`??` 现测 **45** 条。
- **复量 2026-10-09 16:23（第七十批末；当前恢复点）**：`pnpm gates` **0**（十五道；`test:unit` **750 passed + 1 skipped**＝core 143 / axs 94 / editor-core 189 / **web 285+1skip** / admin 39）· `pnpm typecheck` **0** · `[desktop-seams]` **9 接缝／6 有判据／真断言 99（连续两批未变）**· `[dead-surface]` 闭包外 10 在册、面 **291**／闭包内 245 · `[file-size]` 349 文件 0 越线（**测试文件按 `TEST_RE` 明确排除，不在此闸**）· `git diff --check` **0 行** · stash **0** · 三引用仍重合 **`1b9ca06`**（用 `git rev-parse --short 'desktop-handoff-20260929^{}'` 取；直接 `rev-parse` 打的是附注标签对象 `dbf1dde`，别当成 tag 被动过）· `e2e:desktop` 沿用 **62 passed**（本批零产品改动，未重跑）。**待显式 add 现为六份** `.test.ts`；`??` 现测 **47** 条。
- **复量 2026-10-09 16:30（第七十一批末；当前恢复点）**：`pnpm gates` **0**（十五道；`test:unit` **767 passed + 1 skipped**＝core 143 / axs 94 / editor-core 189 / **web 302+1skip** / admin 39；`src/shared/lib` 单档 **68 条／9 文件**）· `pnpm typecheck` **0** · `[desktop-seams]` **9／6／真断言 99**· `[dead-surface]` 面 **293**／闭包内 245／闭包外 10 在册 · `[file-size]` 349 文件 0 越线 · `git diff --check` **0 行** · stash **0** · 仓库内 `MUTATED` 标记 **0** · 三引用按 peel 仍 **`1b9ca06`**（HEAD／origin／tag 三者未动，本会话仍未提交）。**待显式 add 现为八份** `.test.ts`（本批新增 `draftManager`／`routeHistory`）；`??` 现测 **49** 条。**下一步（不需要人决策的那条）**：该族按 `grep -l localStorage` 的 9 格分母只剩 `identityLink.ts`，先查它在桌面态是否真被渲染，再决定补不补判据。
- **复量 2026-10-09 16:40（第七十二批末；当前恢复点）**：`pnpm gates` **0**（十五道，lint 0/0；`test:unit` **774 passed + 1 skipped**＝core 143 / axs 94 / editor-core 189 / **web 309+1skip** / admin 39）· **`pnpm e2e:desktop` 本批重跑＝62 passed／0 skipped（2.9m，因动了 4 个产品文件）**· `pnpm typecheck` **0** · `[dead-surface]` 面 **294**／闭包内 245／闭包外 10 在册 · `[desktop-seams]` **9／6／真断言 99**· `[file-size]` 349／0 越线 · `git diff --check` **0 行** · stash **0** · `MUTATED` 标记 **0** · 三引用按 peel 仍 **`1b9ca06`**（仍未提交，按 §7）。**待显式 add 现为九份** `.test.ts`；`??` 现测 **50** 条。本批**动了产品代码**：`creatorId.ts`／`playerToken.ts`（导出键名）＋`identityLink.ts`／`UserContext.tsx`（八处字面量收成 import），键值一字未改。


- 工作区：`git status --porcelain` 计数 **` M` 85 / ` D` 17 / `??` 41**；`HEAD 1b9ca06` == `origin/desktop` == tag `desktop-handoff-20260929`（今天一整天**未提交、未推送、未改 tag**，按 §7）。
- 今天这两批（四十七、四十八）改到的路径，**提交时请逐条显式 add**：
  产品 `apps/web/src/features/discover/pages/{DiscoverProjectDetailPage,DiscoverCharacterDetailPage,DiscoverItemDetailPage,DiscoverSceneDetailPage,DiscoverTopicPage,AuthorPage}.tsx`（6 个，桌面缺席闸门）；
  判据 `e2e/desktop-http.spec.ts`（E44 + CLOUD_ONLY_ROUTES）；
  工具 `scripts/{source-graph.mjs,cloud-callmap.mjs,desktop-http-inventory.mjs,check-dispatch-local.mjs,check-dead-surface.mjs,dead-surface-baseline.json}`；
  文档 `README.md`、`docs/HANDOFF_DESKTOP.md`、`docs/REFACTOR_DESKTOP.md`、`docs/user/desktop/desktop-and-axsp.md`。
  其中 `source-graph.mjs / cloud-callmap.mjs / check-dead-surface.mjs / dead-surface-baseline.json` 是**未跟踪新文件**（不 add 就永远不在树里，别的机器上门禁直接少四道）。
- `??` 里剩下的都不是我的：`Clearance/`（未纳管、含 `.env`，**只读都不许**）、以及别人在飞的那几支。
  **未跟踪归属没有干净的机械信号**（mtime 与 `grep --include` 在 zsh 都会给假数），所以 add 名单只能这样人点名，别用 `git add -A` / `git add .`。
- 末轮可复现读数（照抄脚本自报，别心算；**2026-10-09 11:22 停车复量**，全链一次跑完）：
  `pnpm gates` **0**（十五道，`test:unit` **706 passed + 1 skipped**）· `pnpm e2e:desktop` **52 passed** ·
  `pnpm check:http-inventory` **0**（`ROUTES=25`：page 25 / 布局 5 / 重定向 5，Route 标签 35；带参 14；`UNMOUNTED=0`；
  `DESKTOP_UNIQUE=0`；`BROWSER_UNIQUE=20` 正对照；`SPEC_URLS=52`、`toHaveURL 正则 17/17`、**完全没证据的路由 0**）·
  `pnpm cloud:callmap` **0**（第十二段 装载即发 26 / 点了才发 2 / 不明 8；**这次没给 `LOADFACE=`，脚本自己报了「运行时列缺失——不当 0 用」，那条控制位算当场生效过**）·
  `pnpm check:citations` **0**（47 文档 / 已判定 219 / 不存在 0 / 越界 5 在册；**11:23 为末次文档改动前复跑一次仍 0**——再往后只剩这一行本身的措辞修订，不涉路径引用）· `pnpm build:web` **0** · `pnpm build:admin` **0** ·
  工作区 ` M` 85 / ` D` 17 / `??` 41，`git diff --check` **0 行**，stash **0**，`.e2e-lock` **不存在**，
  `HEAD 1b9ca06` == `origin/desktop` == tag `desktop-handoff-20260929`（**今天一整天没提交、没推送、没动 tag**）。
- **复量 2026-10-09 12:47（第五十五批末；这才是当前恢复点，上面 11:22 那组留着只作历史）**：
  `pnpm gates` **0**（十五道，`test:unit` **706 passed + 1 skipped**）· `pnpm e2e:desktop` **54 passed**（E47 两条腿上线）·
  `pnpm check:http-inventory` **0**（`SPEC_URLS=54`（52 → 54）、`ROUTES=25`、`UNMOUNTED=0`、`DESKTOP_UNIQUE=0`、`BROWSER_UNIQUE=20`、
  正则 17/17、**完全没证据的路由 0**）· `LOADFACE=/tmp/inv55.txt pnpm cloud:callmap` **0**
  （端点级守卫 **10 / 3 / 27**、待人工复核 **15**、桌面真会打出 **20 处**、第十二段 **19 / 2 / 8**、运行时列 **见过 4 / 没见 12**）·
  `pnpm check:citations` **0**（47 文档 / 已判定 **220** / 不存在 0 / 越界 5 在册）· `git diff --check` **0 行** · stash **0** · `.e2e-lock` 不存在。
  ⇒ **上一条里的 B 档「15 条 / 装载类 22 = 对上 7」就此作废**：第五十四批把闸门别名认上之后分母重算，
  现在真正要逐条判的是**运行时没见到的那 12 条**（复现命令同下，普查与代码必须同刻取数）。
- **复量 2026-10-09 13:06（第五十六批末）**：`pnpm e2e:desktop` **55 passed**（54 → 55，新增 E48）·
  `pnpm gates` **0**（十五道，`test:unit` **706 passed + 1 skipped**，`[file-size]` 349 文件 0 越线）·
  `pnpm check:http-inventory` **0**（`SPEC_URLS` 54 → **56**，其余读数与 12:47 同）·
  `LOADFACE=/tmp/inv56.txt pnpm cloud:callmap` **0**（守卫 16/37、待复核 15、桌面真会打出 20、第十二段 19/2/8、运行时 4/12
  ——**与 12:47 逐数相同**，这正是"本批产品代码净零"的证据：抵的是判据层的账，不是分母）·
  `pnpm check:citations` **0**（已判定 **222**）· `git diff --check` **0 行** · stash **0** · `.e2e-lock` 不存在。
  **已抵掉的那一条**：`projectApi.fork @ apps/web/src/features/studio/pages/ProjectListPage.tsx:91` 同时出现在
  「待人工复核 15 条」和「点了才发 2 条」里，现在它有一个点击层判据（E48）说"桌面走不到"，
  而**不是**一句散文。剩下 14 条待复核 / 另一条 `versionApi.get @ VersionPanel.tsx:44` 是同一形状，照做即可。
  **新登记的失真方向（只观察不处置）**：`GET /editor/projects/templates` 被归进「调用者已接本地库（8）」，
  因为那一档按**调用者**归类——"调用者本地已接"不等于"这个方法本地已接"，读那张表时要记住这条。
- **复量 2026-10-09 13:15（第五十七批末；当前恢复点）**：`pnpm e2e:desktop` **56 passed**（55 → 56，E49）·
  `pnpm gates` **0**（`test:unit` **706 passed + 1 skipped**）· `pnpm check:http-inventory` **0**
  （`SPEC_URLS=57`、`toHaveURL 正则 19/19`（17 → 19）、其余与 13:06 同、**完全没证据 0**）·
  `LOADFACE=/tmp/inv57.txt pnpm cloud:callmap` **0**（**与 13:06 逐数相同**：调用点 16/37、待复核 15、桌面真会打出 20、
  第十二段 19/2/8、运行时 4/12）· `pnpm check:citations` **0**（已判定 **224**）· `git diff --check` **0 行**。
  **E48 + E49 抵掉的账**：`projectApi.fork`（同时出现在待复核 15 与"点了才发 2"里）、
  `versionApi.get` / `versionApi.rollback`（那"点了才发 2"的另一条与它的姐妹调用点）——
  三条现在都有界面级证据说"桌面走不到"，而**静态分母一条没动**（这一句本身就是证据的形状：判据层与分母层分开记账）。
  **两头变异都做过**：拿掉版本按钮的守卫 ⇒ 红在缺席断言（`e2e/desktop-http.spec.ts:1147`）；
  把正控「编辑」也藏起来 ⇒ 红在可见断言（`:1144`）——**没做第二次的话，前一次红可以只是"整条工具条没渲染"**。
- **剩下最便宜的一条判据**（本批读到、故意留给下一批）：`searchApi.global @ apps/web/src/shared/components/GlobalSearch.tsx`
  的闸门在**调用者**那一侧（`apps/web/src/shared/components/AppHeader.tsx:84` 的 `showSearch && !isLocalOnlyDeployment() && <GlobalSearch />`），
  而 callmap 明写"消费者级条件渲染不认"⇒ 它永远留在 `桌面真会打出 20` 里下不来。界面级一眼（桌面顶栏无搜索框、正控用同一条顶栏的导航项）就能把这条从"只能保守估"变成"看过"。
  **（已做完：同日第五十八批 E50，`e2e/desktop-http.spec.ts:1167`；红在 `:1186` 的那次变异见过。）**
- **复量 2026-10-09 13:31（第五十八批末；当前恢复点）**：`pnpm e2e:desktop` **57 passed**（E47→E48→E49→E50 四条新判据全绿）·
  `pnpm gates` **0**（`test:unit` **706 passed + 1 skipped**）· `pnpm check:http-inventory` **0**（`SPEC_URLS` 54 → **59**、
  `toHaveURL 正则 19/19`、`ROUTES=25`、`DESKTOP_UNIQUE=0`、`BROWSER_UNIQUE=20`、完全没证据 0）·
  `LOADFACE=/tmp/inv58.txt pnpm cloud:callmap` **0**（调用点 **16/37**、待复核 **15**、桌面真会打出 **20**、第十二段 **19/2/8**、运行时 **4/12**
  ——四批下来**静态分母一条没动**，因为这三批抵的全是判据层的账）· `pnpm check:citations` **0**（已判定 **234**）、
  `git diff --check` **0 行**、stash **0**、`.e2e-lock` 不存在、三引用仍重合（`1b9ca06`）。
  **这批改到的路径**（提交时逐条显式 add）：`e2e/desktop-http.spec.ts`（E48/E49/E50 三段）、
  `apps/web/src/features/profile/pages/ProfilePage.tsx`（第五十五批那句文案）、`docs/HANDOFF_DESKTOP.md`、`README.md`。
  **产品代码在这三批里的净改动只有一处文案**（E48/E49/E50 三条判据都没逼出缺陷——这本身是要如实记的结论：
  "藏控件/藏入口/调用者侧闸门"这三种形状今天是对的，只是过去没人看着）。
- **下一个最便宜的**（同一形状、不用新工具）：桌面的真角色详情页不给「关系」标签
  （`visibleCharacterTabs` 的 `cloudOnly` 今天只有单测 `characterTabs.test.ts` 看着，没有界面级那一眼；
  另一态的在场由那份单测作证，正控用同一排里在场的「传记」标签——E21 已经点得动它）。
  做完这条，「待人工复核 15 条」里就**每一条**要么有判据、要么有写在 §4 的分派点。
  **（已做完：同日第五十九批把这一眼加进 E49，红在 `e2e/desktop-http.spec.ts:1158` 的那次变异见过；15 条的账已按上面那条读法收口。）**
- **这条线之后剩下的是什么**（本批实测读数，别把"判据补完了"读成"云端面收工了"）：
  静态分母**一条没动**——`待人工复核 15`、`桌面真会打出 20 处`、第十二段 `19/2/8`、运行时 `见过 4 / 没见 12`（`SPEC_URLS=59`、`正则 19/19`）。
  要让它变小只有两条路，**都不该由我单方面走**：
  ① §6 ② 那张判死名单一旦定档，UI 入口 + api 模块 + 后端路由三段一起摘，`桌面真会打出` 才是真的降；
  ② 把"调用者侧闸门"（`AppHeader.tsx:84` 那种）教给 `cloud:callmap`——那是**给工具加一档可达性判据**，
  加之前要先按在册纪律量误报（先原样指过去数命中，再上线），且新面必须自带"命中 0 即 FAIL"的消失告警。
  还欠着的两件与线无关但一直挂着：**`pnpm e2e` 浏览器那一半**（会写本机 dev 库，等一句授权）、**真壳里的落盘与像素**（§6 ⑦）。
- **复量 2026-10-09 14:20（第六十批末；当前恢复点）**：`pnpm gates` **0**（十五道，`test:unit` **706 passed + 1 skipped**）·
  `pnpm e2e:desktop` **57 passed**（本批没改用例）· `pnpm cloud:callmap` **0**（新增**第十三段·调用者侧闸门审计**：
  6 个 .tsx 组件模块 ⇒ 全部门被挡 **1** / 部分 0 / 一处都没带 5；四条合成样本 `[true,false,false,false]`；
  第十段档位**一条没动**——调用点 16/37、待复核 15、桌面真会打出 20，与设计一致）·
  `pnpm check:citations` **0**（已判定 **240**）· `git diff --check` **0 行** · stash **0** · `.e2e-lock` 不存在 · 三引用仍重合（`1b9ca06`）。
  **本批改的是工具不是产品**：`scripts/cloud-callmap.mjs`（新增第十三段 + 控制位 + 合成自测）；
  产品代码在这批里只被**临时**改过两次做变异（`AppHeader.tsx:84` 的挂载闸门），跑完都还原了，`git diff` 对该文件为空。
  **下一批该做的**：如果要把这一档并进第十段（让 `桌面真会打出` 从 20 降到 19），先决条件是**真语料里那 5 个"一处都没带"要人工读完一遍**，
  确认没有"其实被别的形状挡住而谓词认不出"的反例——现在的样本只有 1 条，并档的证据面太窄。
- **复量 2026-10-09 14:46（第六十一批末；当前恢复点）**：`pnpm e2e:desktop` **57 passed + 1 skipped**（新挂的 E51）·
  `pnpm typecheck` **0** · `pnpm check:citations` **0** · `git diff --check` **0 行** · stash **0** · `.e2e-lock` 不存在 ·
  三引用仍重合（`1b9ca06`，**未提交、未推送、未动 tag**）。
  **新登记的未归因现象（不是已修的 #61）**：工程页点「试玩」后 URL 变成 `/play/proj-0001`、界面仍是工程页；
  判据 **E51 已写好但 `skip`**，跳过的原因与两次测量原文都写在 `e2e/desktop-http.spec.ts` 的文档块里。
  **接手的人请先做归因，别先改判据**：真手点一次（或等 `pnpm e2e` 那半的授权）→ 看 PlayerPage 到底挂没挂载 →
  再决定这是路由问题、分块加载问题，还是错误边界吞了。任务 #64 已按证据退回未完成。
  **（14:53 更正：路由不是嫌疑——诊断量到 `#root` 唯一子元素就是播放器外壳，上一屏的 `a[href^="/studio"]` 已归零。
  待查的是首屏在等什么：等外壳出现并点舞台之后，15s 内 `aria-label="菜单"` 仍是 0 个。明细见 §4 第六十一批的更正。）**

- **停车点（第五十一批结束的位置；12:47 之后各批复量见上面几条）**：产品代码与判据都在绿的状态上；
  在飞的只有一件——**第十二段那 18 条「静态说装载会发、普查没见到」还没逐条分档**（每条形如"页面已早退 ⇒ 安全"或"静态判高 ⇒ 该改成点击判据"）。
  复现那 18 条：`pnpm check:http-inventory > /tmp/inv.txt 2>&1; LOADFACE=/tmp/inv.txt pnpm cloud:callmap`
  （**普查与代码必须同一时刻取**，代码一改临时产物就作废）。
- **仍欠的验证**：`pnpm e2e`（浏览器那一半）——它会写你本机 dev 库（8000 上是你起的 uvicorn），所以今天没跑，账挂在这里不算做过。
- **下一步最便宜的四件事**（按推进成本排；第四十九批已把原第②件做完）：① 决定 §6 ② 那批"没本地承载"的端点要不要判死（数据已齐）；
  ② `pnpm e2e` 那句授权（欠了八天的那半，跑之前先确认 8000 上是不是你的 uvicorn）；
  ③ **已做完（第五十一、五十二批）**：静态上界 × 装载实测的差额对账成了 `cloud:callmap` 第十二段，
  且那批端点**已经用模块图当场分完档**（12:15 修正后的读数；11:27 那版是 18 条，被同日第五十三批查出是转义顺序造的假数）：
  **A 档 消费者不在任何路由闭包 = 0 条**、**B 档 在闭包内但浏览器臂也没发 = 15 条**（装载类 22 = 对上 7 / 没对上 15）。
  ⇒ 我原本期待"A 档能缩掉几条判死名单"，**被自己的数据否掉了**：这 15 条只是"装载时不发"，不是"界面走不到"，
  按端点判死这一档**一条都缩不掉**。剩下的活是给这 15 条补**点击层判据**（E19/E40/E41 那种形状），或你真下令判死。
  复现（普查与代码必须同刻取数）：`pnpm check:http-inventory > /tmp/inv.txt 2>&1; LOADFACE=/tmp/inv.txt pnpm cloud:callmap`；
  ④ 剩下那条测不到的：**随包 `.axsp` 的首启播种**（`seedDesktopIfEmpty` 要 `isTauriEnvironment()` + `plugin-fs`，
  注入标记在 chromium 里过不去）。本地"命中支"本身已经由 E17/E21/E39/E43/E45 覆盖，
  欠的是"开机就有 3 份示范作可玩"这句产品承诺——只有壳内冒烟量得到，见 §6 ⑦。

## 7. 继续工作时的硬限制

- 不运行 `git reset --hard`、`git checkout --`；不撤销当前用户改动。
- 不把 `backend/uv.lock`、`backend/app/domains/llm/providers/__init__.py` 或 `Clearance/` 纳入重构提交；只显式暂存目标路径，禁止 `git add -A` / `git add .`。
- 不清理 dev 数据库中报告的测试工程残留（约 2638 条）除非获得明确决定；若获准，先 dump、再临时库 restore 并核对行数。
- `e2e`、`e2e:desktop`、`e2e:ui` 共用 `.e2e-lock`，不得并跑、不得手动删锁。
- 遵循 `REFACTOR_DESKTOP.md`：先替代后删除；变更前补能红的判据；文档/ADR/用户文档同轮同步；不提交、不推送、不改 tag，除非用户明确要求。

## 8. 文档可信度

- `REFACTOR_DESKTOP.md` 的 checkbox 与本交接文档的最新补记是当前执行状态来源。
- [ADR-029](./ADR/029-desktop-only-build-target.md) 是桌面唯一化的产品决策来源；ADR-025/027 分别定义对等视图与唯一 AXS 语法。
- **Beat 目标寻址与同名消歧的权威是 [ADR-016](./ADR/016-axs-narrative-language.md) 的「补记 2026-09-30」一节**（六条契约 + 一条 lint 欠账）。改 `print.ts` / `axsImport.ts` / `projection/axs.ts` 之前先读它：序号规则是契约，不是当前实现的顺带行为。
- `KERNEL_DESIGN.md` 是 L2–L4 的规约来源，其 §2.4 于 2026-09-30 起带一条状态注记，说明「AXS 文本 → 图」目前是**两套实现未归一**（不是已归一）。
- [归档的 WEB_FEATURE_DISPOSITION](./archive/WEB_FEATURE_DISPOSITION.md) 是 2026-09-26 盘点快照，不是最新逐项状态；如与 `REFACTOR_DESKTOP.md` 冲突，以后者为准。
- [归档路线与子产品计划](./README.md#归档)不再派生当前任务。

## 9. 文档自伤登记（2026-10-10 04:41 收束审计发现，**未处置**）

**事实（全部现测，命令可复跑）**：本文件 5235 行，但 `# Axiforge 桌面重构交接` 出现 **2 次**（第 1 行、以及**粘在第 2128 行行中**），`## 1.`／`## 2.`／`## 3.`／`## 4.` 各出现 **2 次**（15/21/30/39 与 2139/2145/2154/2163），`## 5.` 只有 1 次（4286）。⇒ 文件前半被整份复制了一遍，副本起点正落在 §4 台账第一百零六批「第五面」那一条的**句子中间**：

```
2128:…按 `(test|spec).(ts|tsx)# Axiforge 桌面重构交接
```

**两块哪半更新（这是修法不能"删第二份"的原因）**：
- 块 A＝第 1 行…第 2128 行前半。**头部四条复量是最新的**（03:24／03:15／03:08／03:00），**台账止于第一百零六批且那一行被截断**。
- 块 B＝第 2128 行 `# Axiforge…` 起…第 4285 行。**头部复量是旧的**（02:56／02:48／02:37／02:27），**台账完整到第一百一十批**（该批标题在 4277 行，全文件只此一处）。
- 两块逐行 diff 差 **52 行**（`diff <(sed -n '1,2137p' F) <(sed -n '2139,4275p' F)`）。

**为什么门禁没挡住（要登记的判据限度）**：`pnpm check:citations` 此时仍报 **0**——它验的是"被引用的 `路径:行号` 存在且在范围内"，而文内重复**两侧都能接住引用**，于是"指向内容错的那一份"也算绿。同理 README／§4 里任何 `docs/HANDOFF_DESKTOP.md:NNNN` 引用，今天有 52% 的前半概率落在错的那一份上。**这条限度是新的**：引用对账验不出"文档自己复制了一份"。

**修法（下一轮做，需要一整轮预算，不要顺手删）**：
1. 备份已在 `/tmp/HANDOFF_DESKTOP.pre-dedup-202601010-0440.md`（5235 行，`cmp -s` 与当时工作树**逐字节相同**）。
2. 以**块 B 为正文**（它是唯一带着第一百零七～一百一十批的那一份），把块 A 头部那四条最新复量搬进 B 的头部、删掉 B 头部那四条旧复量，然后整体丢弃块 A，并把第 2128 行粘住的 `# Axiforge…` 从"第一百零六批第五面"那句里剥开——该句完整文本在 B 内。
3. 完成后 `wc -l` 应≈**3110**（5235 − 2127 ± 搬行的几行），`grep -c '^## 1\.'` 应=**1**，`grep -c '^同日第一百一十批'` 应=**1**。
4. **行数一变就要重读引用**（既有纪律）：`grep -rn 'HANDOFF_DESKTOP\.md:[0-9]' README.md docs/ e2e/ scripts/` 逐条打开看落点，再 `pnpm check:citations`。

**为什么这一轮不修**：本文件在 HEAD 里只有 **83 行**（`git show HEAD:docs/HANDOFF_DESKTOP.md｜wc -l`）⇒ 这 5235 行台账**只活在未提交的工作树里，没有任何 git 恢复路径**。三块合并＋引用重读不是一轮能验完的量，做一半比现在更糟。**这同时也是 §6 那条"待 add 43 个文件"最硬的理由**：未提交的长文档一旦自我复制，没人能把它捞回来。

## 10. 进树（2026-10-10 05:00 两笔提交；**这是当前恢复点，取代 §6 上面那条 03:25**）

**你授权了 add＋commit，没有授权 push／tag**，所以远端与 tag 仍钉在 `1b9ca06`，本地领先两笔。

- **`a92b7d5`** —— `pnpm check:tracked` 现跑点名的 **43 个文件**逐条显式暂存（`git add --pathspec-from-file`，暂存集与名单 `diff` 为空），禁区核对 **0**（`backend/uv.lock`／`backend/app/domains/llm/providers/__init__.py`／`Clearance/` 一条都不在名单里），99 个已跟踪修改文件与另外 14 个未跟踪项**一个没碰**。
- **`5b9aa6c`** —— 两份条件夹具 `testdata/conditions/compare.json`、`testdata/conditions/families.json`。**为什么它们本来不在那 43 里**：门禁的数据面只统计「**已跟踪**源码」的引用，那四个测试文件进树之前不是已跟踪源码，它们指向的夹具就看不见 ⇒ 名单是**迭代到不动点的**，不是一发的：43 → 3 → 1。
- **主战果（比上一版这句更窄，已按测量收窄）**：链面从「已跟踪 9／未跟踪 10」变成 **已跟踪 19／未跟踪 0** ⇒ 十五道 `gates` 的四道脚本、五份基线与共用 `source-graph.mjs` **真的在树里了**。**但"gates 0 从此是仓库的性质"这句话今天还不成立**（我写完上一条后立即量出了反证，见下）：干净 clone 现在**跑得起来**这十五道，却不保证**跑得过**。
- **测量代替推测（05:06）**：两笔提交里 31 个 TS 文件的相对 import，在 **HEAD 的树**中 **0 条解不到**（载入层没问题；对照组＝同一解析器在工作树里 42 条全解到，故读数可信）。但其中 **23 条 import 指向「已跟踪却仍未提交修改」的 12 个文件**（`packages/axs/src/parse.ts`／`print.ts`、`packages/core/src/conditions.ts`／`ir.ts`、`packages/editor-core/src/projection/axs.ts`、`apps/web/src/shared/storage/{index,tauriSqlBackend,tauriAssetStore}.ts`、`creatorId.ts`、`playerToken.ts` 等）⇒ **干净 clone 上那些新判据测的是尚未进树的行为，`test:unit` 预期为红**。对照群（全仓 65 个已跟踪测试文件）命中 23 个文件／63 条 import，证明这套匹配真能命中、不是恒 0 的假绿。
- **剩余 1 项是误报，且我不动它**：`backend/tests/test_condition_family_support.py ⇐ packages/core/src/familySupport.test.ts:20` —— 那一行是**注释**（「Python 那一侧的断言在…」），该文件真正 `readFileSync` 的是已进树的 `families.json`（同文件 43 行），断言读的是 JSON 里的 `python` 列（66 行）。所以这一条不是「干净 clone 跑不起来」。修它要改判据口径（数据面改吃剥注释后的源码，与形状匹配同一口径），**会动其它计数，故留下一轮**，与 #177 同批。
- **因此"把绿灯变成仓库事实"还没完成，且它需要的不是更多 add**：那 **99 个已跟踪修改文件**才是行为本体。把它们一次性提交会造出一个巨型提交、也把 #177 那个自我复制的文档一起卷进去 ⇒ 正确顺序是「先还 #177 的文档合并 ⇒ 再按域分批提交修改 ⇒ 每批之后真跑一次 clone 对照」。这一步等你点头，我不替你把九十九份压成一笔。

## 11. 分域进树（2026-10-10 05:20–05:55，第一百一十三批；**当前恢复点，取代 §10**）

你授权「分域提交那 99 份」。执行时的口径先纠正一次：**99 是 `^ M` 的读数，漏了 17 个删除项**，
真实的未提交跟踪改动是 **116**（99 改 ＋ 17 删）。按域切成八笔，另加三笔补齐自洽：

| 域 | 文件数 | 内容 |
|---|---|---|
| 后端 | 2 | `narrative/models.py`、`runtime/service.py`（**两份禁区文件按长期约束永不进**：`backend/uv.lock`、`llm/providers/__init__.py`） |
| 语法与内核 | 28 | `packages/axs`／`core`／`editor-core`：运算符 fail-closed、空说话人按旁白印、指令取值 warning、双端向量清单、诊断出参 |
| 本地存储与分派 | 11 | 二次导入的 id 重映射、导入回滚、素材摘要 fail-closed、身份键单一权威 |
| 界面层 | 20 | 剪贴板唯一通路与失败可见、24 处标签编程关联、投影说明三个时刻 |
| 门禁与验收 | 10 | `e2e/desktop-http.spec.ts`（E43–E65）与 scripts 判据 |
| 命令面与配置 | 7 | dev.bash／vite／两套 playwright／两份 package.json／CI（CI 仍无桌面 job，未声称远端有效） |
| 文档归档**移动** | 34 | 17 删除 ＋ 17 `docs/archive/` 新增**在同一笔里**⇒ git 记为 rename，历史不断；分两笔中间那笔就是真的丢文件 |
| 活文档 | 19 | ADR-016／027／029、用户文档、README、HANDOFF |

**「跑得起来≠跑得得过」由干净 clone 亲口判了**（`git worktree` 到 `/tmp/clonecheck`，`node_modules` 符号链接复用，不碰你的库、不跑 e2e）：

1. clone 的 `pnpm typecheck` 起初**一个错**：`vite.config.ts:5` 要 `scripts/ports.d.mts`。这份**隐式伴随声明**没进树——`check:tracked` 的编译面只跟着显式 `from "…"` 走，而 `.d.mts` 不是任何人的 import 落点，**这一面结构性看不见它**。补进树（一笔）。
2. clone 的 `pnpm gates` 起初断在 `check:citations`：ADR-028 与 REFACTOR_DESKTOP 引的 `engines.py`／`gateway.py`／`store.py` 住在本机隔壁那个**未纳管的 `Clearance/`** 里。本机磁盘上有 ⇒ 落 `skippedHit`；clone 没有 ⇒ 落 `missing` ⇒ **同一句引用两种读法**。加「仓外未纳管」档：手写 `(文档, 引用)` 清单、**在碰磁盘之前**判、身份不含行号、清单过期即 FAIL。
3. 修完：clone 上 `已判定 382`／`不存在 0`／`仓外 4 次`，与本机**逐字相同**；unit 全绿（143／96／192／325＋1skip／39）。

**本轮我自己的三处量具缺陷（都是被对照抓的，不是被结果抓的）**：
- 绝对路径比相对路径集合 ⇒ **恒 0 假绿**（差点写成"新测试不依赖未提交改动"）；对照组（全仓测试文件命中 23 个）把它救回来。
- 用 `git diff --cached --name-only` 核对重命名 ⇒ **必然误报**：rename 只打印目的路径。核对要用 `--name-status -M` 的两端。
- 「该拦」这条腿**在开发机上点不亮**：摘掉清单里一对，本机仍 exit 0（掉进 `skippedHit` 而非 `missing`）。⇒ 这一腿的数只能在 clone 上取，本机绿只证明"这台机器没有新增悬空引用"。已写进脚本头当残余限度，**没假装消除**。

**剩余未跟踪 12 项**（都不在你授权的范围内，逐名）：`Clearance/`（禁区，里面有 `.env`）、`backend/tests/` 三个（他人在飞）、`docs/README.md`、`scripts/check-chain-tracked.mjs`／`check-apibase-literals.mjs`／`cloud-callmap.mjs`／`desktop-cloud-judgements.json`（四道**链外**普查与它自己的台账）、`scripts/ports.d.mts` 已进、`testdata/axs-draft/unknown-speaker.json`。
**状态**：本地领先十二笔，`origin/desktop` 与 tag 仍是 `1b9ca06`——**未 push、未打 tag**。
