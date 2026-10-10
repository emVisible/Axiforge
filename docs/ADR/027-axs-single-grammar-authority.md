# ADR-027：AXS 语法单一权威（废除 `【】` 方言与第二解析器）

**状态**：已采纳
**日期**：2026-09-25
**关联**：[ADR-016](./016-axs-narrative-language.md)（AXS 语法定义；全局文本优先已由 ADR-025 修订）、[ADR-015](./015-ai-assisted-creation.md)（规则优先 + 可选 LLM）、[ADR-020](./020-llm-multi-provider-local-first.md)、[ADR-025](./025-axs-peer-dual-view.md)、[ADR-024](./024-desktop-local-first.md)、执行件 `BLUEPRINT_v1.0.md`、[REFACTOR_DESKTOP](../REFACTOR_DESKTOP.md) Phase 9 前置

## 背景

v1.0「演绎内核」的对象是「散文/粗写 → AXS 演出脚本」这条 AI 通路。

**先记一处自我纠正**：本 ADR 初稿断言「后端 AI 能力齐备但产品里摸不到，`llm/router.py` 只有 `/health`」——**错了**。真实通路在 narrative 路由上：`@editor_ai_router.post("/prose-to-script")`（`backend/app/domains/narrative/router.py:358`）与 `"/prose-to-axs"`（`:371`），前缀 `/api/v1/editor/ai`，由 `apps/web/src/shared/api/ai.ts:6,20` 封装，并有**两个活的用户入口**：`ScriptEditor.tsx:110`（AI 草稿，替换/追加脚本）与 `StoryEditPage.tsx:125`（传记 → AXS 草稿）。误判起因是扫描面只取了 `llm/` 目录，没扫 `narrative/router.py`。

所以问题不是「通路没接」，而是**通路早已接通、产物却是另一种语言**：

| 事实 | 证据 |
|---|---|
| canonical 语法由 ADR-016 规定为 `@` 前缀指令，且明确「纯文本行 → 旁白」 | `docs/ADR/016-axs-narrative-language.md:21,27,28`；该文件内 `【` 出现 **0 次** |
| `packages/axs` 的实现与 ADR-016 一致 | `parse.ts:234-318`（12 条指令）、`print.ts:85-140`；`parse.ts` 与 `print.ts` 内 `【` 各 **0 次** |
| **Python 侧完全不认识 canonical 语法** | 扫描面 `backend/app/**/*.py`，grep `@bg` / `@show` / `startswith("@")` **零命中** |
| 规则引擎把舞台指令发射成中文括号形态，并以「AXS」名义交回前端 | `ai_draft.py:99` `【背景 x】`、`:101` `【音乐 x】`、`:108` `【转场 fade】`、`:110` `【特效 flash】`；`StoryEditPage.tsx:133` 将其放进「AXS 草稿」面板、`:142` 提供复制到剪贴板 |
| 提示词教模型输出该方言，是为了让 Python 自己能读回来 | `prompts.py:30`；回读发生在 `llm/service.py:105-107`——**仅当 source ≠ rules** 时用 `axs_to_script()` 解析模型文本 |
| `axs_to_script()` 是第二个解析器 | `ai_draft.py:127-141`：自剥 `*…*`（`:137-138`）、自跳 `#`（`:135-136`）、复用散文正则 |

根因因此比「方言不统一」更具体：**Python 没有 canonical AXS 解析器**，于是 `【】` 被造出来充当「模型 ↔ Python」的私有交换格式——提示词教它、`axs_to_script` 读它、`script_to_axs` 写它，自成一个闭环。缺陷出在这个闭环**越过了边界**：同一份文本以「AXS 草稿」的名义交给用户，而产品真正用的 AXS（`parseAxs`，见 `MiniAxsEditor.tsx:28`）读不了它。

必须分清两侧，否则会误伤合法用法：

- **输入侧的 `【旁白：…】` 是散文速记，正当，本 ADR 不废除。** `ScriptEditor.tsx:179-188` 的帮助文案标题写的是「粘贴散文/大纲。格式：…」，教的正是 `_STAGE_RE`（`ai_draft.py:10`）与 `_SPEAKER_RE`（`:9`）能读的输入；`biographyToProse`（`apps/web/src/features/writer/lib/storyToAxs.ts:4-5`）把传记 markdown 转成同一种输入。
- **输出侧的 `【】` 才是缺陷**：它以 AXS 之名产出，却不是 AXS。

后果不是「解析失败」而是**静默降级**。canonical 的分派兜底是：`@` 前缀走指令（`parse.ts:142`（`@` 分派；2026-10-01 行号随三次搬家更新））、`\` 前缀走转义旁白（`:297`）、含 ASCII 冒号走对白（`:303`）、**其余一律当旁白**（`:312`）。于是用户若把「AXS 草稿」原样粘进文本轨：`【背景 教堂】` 变成读给玩家听的旁白；`角色：台词`（提示词教的全角冒号，对白正则 `:334` 只认 ASCII）连说话人一起丢；`*旁白文本*`（`ai_draft.py:97`）星号留在正文。**三条都不产生 diagnostic**，能过所有测试。

## AXS 方言对照表（逐指令，行号可点验）

> 本表记录的是**决策时**的实态（ADR 的惯例是保留判断依据的原貌，不改写历史）。M1 落地后，「`ai_draft` 写」一列的 `【】` 形态已停止产出，回读列的 `axs_to_script` 已删除；「`ai_draft` 读」的输入侧速记按决策 1 **原样保留**。

规范出处：[ADR-016](./016-axs-narrative-language.md) `:21,27,28`。解析 `packages/axs/src/parse.ts`，发射 `packages/axs/src/print.ts`，规则引擎 `backend/app/domains/narrative/ai_draft.py`，提示词 `backend/app/domains/llm/prompts.py`。

| 语义 | canonical（解析 / 发射） | `ai_draft` 读 → 写 | `prompts` 教给模型 | 差异后果 |
|---|---|---|---|---|
| 背景 | `@bg <image> [transition]` / parse `:234-243`、print `:85-86` | 只认 `【背景】` `:10,45-46` → 写 `【背景 x】` `:99` | 「【背景】」`:30` | 括号形态落入 parse `:312` 兜底 → **变成读给玩家的旁白** |
| 音乐 | `@bgm <track> [loop]` / `:244-248`、`:87-90` | `【音乐】` `:47-48`，`loop` **硬编码 True** → 写 `【音乐 x】` `:101` | 「【音乐】」 | 同上；且 loop 不可表达为 false |
| 音效 | `@se <sound>` / `:250-251`、`:92` | **读写两侧均无此形态**（解析器根本不产生该 op） | 未教 | 若 op 由别处流入，发射会落 `:111-112` 的 text 兜底；当前是永久缺席 |
| 语音 | `@voice <sound>` / `:252-255`、`:94` | **无** | 未教 | 同上 |
| 等待 | `@wait <ms>` / `:256-258`、`:96` | **无** | 未教 | 同上 |
| 转场 | `@transition <kind> [ms]` / `:260-269`、`:99` | `【转场】` `:51-52`，`ms` **硬编码 500** → `【转场 fade】` `:108` | 「【转场】」 | 落入旁白；时长不可控 |
| 特效 | `@fx <effect> [ms]` / `:271-280`、`:102` | `【特效】` `:53-54`，`ms` **硬编码 600** → `【特效 flash】` `:110` | 未教 | 落入旁白；且提示词连教都没有 |
| 镜头 | `@camera <action> [scale]` / `:282-290`、`:104-107` | **无** | 未教 | **「演出上限」最吃的一层，AI 通路整层缺失** |
| 立绘 / 走位 | `@show 角色 [表情] [位置]`、`@hide`、`@move 角色 位置` / `:291-302`、`:303-308`、`:310-318`；print `:108-119` | **全部无** | 未教 | 角色登场与位移无法生成 |
| 对白 | `角色: 台词`（**ASCII 冒号**）/ parse `:334`；发射 `:121-123` | 读 `[：:]` **两种冒号都收** `:9`；写 `speaker: text` `:95` ✓ | 「角色**：**台词」**全角** `:29` | 全角落入 `:312` → 整行变旁白，**说话人丢失** |
| 带表情对白 | `角色(表情): 台词` → 自动拆为 `@show` + `say` / parse `:343-356` | **无此形态** | 未教 | 表情层不可生成 |
| 旁白 | 纯文本行即旁白 / parse `:312`；需转义时 `\` 前缀 `:553-556`；发射 `:125-126` | 写 `*text*` `:97`（星号形态）；读时自剥 `*…*` `:137-138` | 「旁白直接写」 | canonical 无星号语法 → **星号留在正文**里被玩家看到 |
| 选项 | `> 标签 [-> 目标]` / parse `:369-376`；发射 `:127-130` | 读 `^>\s*(.+)$` `:11,60` → **` -> 目标` 被当标签的一部分**；写 `> 标签` `:102-106` **丢弃 to** | 「选项以 > 开头」 | 跳转目标在两侧都会丢或串味 |
| 跳转 | `-> 目标` / parse `:378-381` | **无** | 未教 | 分支出口不可生成 |
| 拍标题 | `# 标题 [@stage(…)] [key: …] [ending: …] [if: …]` / print `:141-153` | 写 `# 标题` `:88`（子集）；读时**跳过所有 `#` 行** `:135-136` | 「标题行 # 标题」 | 舞台绑定 / 关键拍 / 结局标记 / 触发条件四类元信息在规则路径上全不可达 |
| 未知 `@指令` | 保留 passthrough + warning「未知指令 @x」/ `:320-326` | n/a | n/a | canonical 至少**报告**，方言连报告机会都没有（静默旁白） |
| 解析器份数 | 一处：`packages/axs/src/parse.ts` | **两处**：`axs_to_script()` `:127-141` 另立一套归一化 | n/a | ADR-016 的「文本为真相源」在 Python 侧被复制成第二套语义 |

结论：12 条 canonical 指令里，规则引擎**只覆盖 5 条**（背景/音乐/旁白/转场/特效），且这 5 条的书写形态全部与 canonical 不兼容；对白与旁白的发射形态一处兼容、一处不兼容。所以问题不是"差一个端点"，是"接上就变形"。

> **补记 2026-09-30**：本表「选项」「跳转」两行把目标写作 `-> 目标`，只说了按标题寻址，没说什么情况下这个标题不可寻址。同名 Beat 的消歧契约（裸标题恒指第一拍、`标题-N` 指第 N 拍、id 只存在于模型层、映射只发生在打印那一刻）已补在 [ADR-016](./016-axs-narrative-language.md) 的「补记 2026-09-30：目标按 Beat 标题寻址，同名按出现顺序消歧」一节。这里的措辞按决策时的实态保留，不改写。

> **补记 2026-10-01：上面那张表的 `parse.ts:NNN` 行号已经搬家三次，语义未变**
> 表里的行号是**决策当时**的落点，按"历史文本不重写"的规矩原样留着。今天的三次按域外提让它们失效：
> 目标解析与边物化在 `packages/axs/src/edges.ts`，条件与字面量在 `packages/axs/src/condition.ts`，
> **演出指令 12 条（`@bg`…`@move`，即本表"背景/音乐/音效/语音/等待/转场/特效/镜头/立绘"九行的 canonical 落点）现在在
> `packages/axs/src/instructions.ts::parseStageInstruction`**；`parse.ts` 只留文档级行解析（330 行）。
> 另补一条本表没有的**严格度差异**：同一族取值（转场种类 / 特效 / 镜头动作）在 Python 侧由 pydantic `Literal` 校验
> （`backend/app/domains/narrative/ir.py:83,93,99`：`zoom|pan|shake|reset`、`fade|dissolve|wipe|cut`、`flash|rain|snow|sakura|none`），
> 而 TS 侧此前用 `as` 把任意拼写圆进联合类型、播放端按值分支 ⇒ **同一份文本一端拒收、一端静默降级**。
> 今天起 TS 侧对不在集合里的取值给 warning（语义不变），集合作为常量落在这三个文件里可读。

> **补记 2026-10-01（同日第二处严格度差异）：空说话人的 `say` 在两端的发射结果不同**
> Python 的 `script_to_axs` 在 `speaker` 缺失时补 `default_speaker`（`ai_draft.py:109`，默认「旁白」），产物是 `旁白: 台词`；
> TS 的 `printAxs` 过去既不补名字、也不改形状，直接印成 `: 台词`——**那一行解析器读不回来**，回读会整行降级成旁白并把冒号留在正文里。
> 现在 TS 按旁白那一支印出去（播放端本来就不显示空说话人的名字，见 ADR-016 质量要求的补条），
> 于是差异收敛成："Python 会给一个可见的默认名字，TS 不会"。桌面是唯一发布目标（ADR-029），本 ADR 认 TS 这条为 canonical；
> Python 那半随 web 退场，不回头改它。判据：`packages/axs/src/parse.test.ts` 的新 describe 三条（含对照组）+
> `projection.test.ts` 那条更正过的基线（它原先钉的就是 `: 走哪？`）。

## 决策

**1. canonical 语法的唯一权威 = ADR-016 的规范文本 + `packages/axs` 的实现。** `ai_draft.py` 的**输出侧**停止产出 `【】` 方言，`prompts.py` 改教 canonical 语法；方言不进入 canonical 解析器。**输入侧的 `【旁白：…】` 散文速记原样保留**（UI 帮助文案与 `biographyToProse` 依赖它）——本 ADR 废除的是「`【】` 享有 AXS 身份」，不是「作者可以用括号写舞台提示」。

**2. 演绎内核的真相源落在 TS，Python 只保留远程模型适配壳。** 散文→指令序列的规则实现归 `packages/axs`。附带一条**硬依赖**：`llm/service.py:105-107` 那条「用 `axs_to_script()` 把模型文本读回 IR」的路径必须同时废除——因为 Python 读不了 canonical（零 `@` 指令认知），若只改发射器，LLM 路径会**静默把所有指令读成旁白**，比现状更糟。正确的替换是端点返回 canonical 文本，由前端 `parseAxs` 解析（这已经是产品自己的解析器，`MiniAxsEditor.tsx:28` 在用）。`axs_to_script()` 随之删除。双端等价由**一份共享 golden 向量**（`testdata/axs-draft/*.json`：输入散文 → 期望 canonical 文本）约束，两端 runner 各跑同一批——沿用编译器 TS/Python golden 已验证过的机制形态（`packages/core` golden 6/6）。向量只描述「输入→输出」，任何一端不得把向量内容当实现复制。

**3. AI 产物只进建议面，作者采纳才落文**，采纳动作经既有 Transaction/Journal（单步 undo 回到采纳前字节）。理由：ADR-016 承诺文本是真相源，而宪章要求「文本可为真相源时须写明冲突策略」。

**4. 桌面纯离线必须有下限：`rules` 独立成拍**（至少一条 `say` 加一条舞台指令），且该断言必须在 node 测试中可执行——桌面本地支在 Playwright 下结构上不可达（`isTauriEnvironment()` 恒 false），这是上一版已经栽过的判据形态。

## 备选与否决

- **B：两种方言长期共存，中间加翻译层。** 否决——同一语义两个真相源（铁律 4）。此后每加一条指令要同步 parser / printer / ai_draft / prompts 四处，漂移不是偶发事故而是必然复发。
- **C：让 canonical 解析器也接受 `【】`。** 否决——`纯文本行 → 旁白`（`parse.ts:312`）是 ADR-016 定下的设计基线，不是缺陷。接纳 `【】` 会把「未识别内容静默变旁白」这个既有失效模式**升格为正式语法**，从此无法区分「作者写的旁白」与「舞台指令没被认出来」。
- **D：先只做后端端点，语法统一以后再说。** 否决——产物不可解析即静默变形，先接等于先放大缺陷。这正是本版把 M1 定为方言统一而非接模型的理由。
- **E：改 `parseDialogueLine` 让它也认全角冒号。** 本轮否决——它会把「作者手滑写全角」静默变成对白。正确形态是给一条 lint **诊断**（warning）而非静默接受；登记为未清偿欠账。

## 后果

**正面**：AI 通路第一次产出可被解析的合法 AXS；离线 rules 通路有了可验证的下限；第二解析器废除，AXS 语法回到一处定义。

**代价与欠账（不在本版假装清掉）**

1. `ai_draft.py` 的方言只有 5 种舞台形态（背景/音乐/旁白/转场/特效），canonical 有 12 条指令。`@se` `@voice` `@wait` `@camera` `@show` `@hide` `@move` 与 `->` 跳转在规则路径上**完全缺席**——其中 `@camera`（镜头语言）正是「演出上限」最吃的一层。M1 不承诺离线也能出镜头，这部分要等 TS 内核补齐。
2. 现存硬编码语义：`bgm` 的 `loop=True`（`:48`）、`transition` 的 `ms=500`（`:52`）、`fx` 的 `ms=600`（`:54`）。迁移时默认**保留现值**，不同步参数化——否则一次方言修复会顺带改演出语义（铁律 3 单维度变更）。
3. **存量内容是否依赖 `【】`：已实测，不依赖**。扫描面 `backend/app`、`apps/web/src`、`apps/web/public/seeds/*`：`ai_draft.py` 只剩 `_STAGE_RE`（输入侧，刻意保留）与一行说明文字；`ScriptEditor`/`storyToAxs`/`promptRenderer` 的 `【】` 全部是**输入**速记或 UI 文案；三个随包 `.axsp` 内层各 2 处 `【` 均为工程标题「【示范】…」而非舞台指令。停发方言因此不改变任何既有读取结果。
4. 全角冒号导致的静默旁白仍是作者体验陷阱，按决策 1 不靠放宽解析解决，另立 lint 诊断欠账。
