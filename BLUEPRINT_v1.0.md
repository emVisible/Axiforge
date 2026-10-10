# Build Blueprint v1.10 | Status: confirmed → executing（M1 ✓ · M2 ✓ · M3 进行中 · 已产出逐功能去留清单）

> 日期 2026-09-25 · 分支 `desktop` · 基线 `af8ef81`（tag `desktop-v0.7` 之后）· 主题 **演绎内核：AXS 单一语法 + 创作端 AI 辅助**
> 关联 [ADR-024](docs/ADR/024-desktop-local-first.md)、[KERNEL_DESIGN.md](docs/KERNEL_DESIGN.md) §2.5、[REFACTOR_DESKTOP.md](docs/REFACTOR_DESKTOP.md)、[归档 ROADMAP_FINAL.md](docs/archive/ROADMAP_FINAL.md) M3
> 人类裁决四条（本轮对齐结果，不再重开）：① 语义=AXS 语法层的创作端 AI 辅助（不是运行时即兴）；② TS 为真相源 + 双端 golden；③ 冲突策略=只出建议，采纳才落文；④ 桌面纯离线是硬约束，rules 必须独立成拍；⑤ Ollama 走 webview fetch，文档要求用户自配 `OLLAMA_ORIGINS`。

---

## 1. Goals & Non-Goals

**取证结论（全部指到源码，非推定）**

1. **【执行「发射器改造」前置取证时自我纠正】AI 通路不是「摸不到」，而是早已接通并摆在了用户面前。** 端点是 `@editor_ai_router.post("/prose-to-script")` 与 `"/prose-to-axs"`（`backend/app/domains/narrative/router.py:358,371`，前缀 `/api/v1/editor/ai`），前端封装在 `shared/api/ai.ts:6,20`，两个活入口：`ScriptEditor.tsx:110`（AI 草稿 → 替换/追加脚本）与 `StoryEditPage.tsx:125`（传记 → 「AXS 草稿」面板 + `:142` 复制到剪贴板）。**本文件初稿写的「`llm/router.py` 只有 /health、产品里摸不到」是扫描面取窄造成的误判**（只看了 `llm/` 目录，没扫 `narrative/router.py`），已在 ADR-027 同步纠正。三个 provider 都实现了 `prose_to_axs`、`llm/service.py:72` 带来源归因——这部分结论不变。
2. **仓库里存在三套互不兼容的 AXS 方言，而 AI 通路输出的不是 canonical 那一套。** canonical 由 `packages/axs` 定义：`@bg` / `@bgm … loop` / `@se` / `@voice` / `@wait ms` / `@transition kind ms` / `@fx` / `@camera` / `@show 角色 [表情]` / `@hide` / `@move`（见 `packages/axs/src/print.ts:85-140`），且 `【` 在 `parse.ts` 与 `print.ts` 里各出现 **0 次**，ADR-016 内也是 0 次。但 `narrative/ai_draft.py:97-110` 的发射器写的是 `【背景 x】` `【音乐 x】` `【转场 fade】` `【特效 flash】`；`llm/prompts.py:30` 还**教模型**输出 `【背景】【音乐】【转场】`；同一发射器的对白写 `speaker: 台词`（半角）而提示词写 `角色：台词`（全角）。
   → 根因比「方言不统一」更具体：**Python 完全不认识 canonical**（扫描面 `backend/app/**/*.py`，grep `@bg` / `@show` / `startswith("@")` 零命中），于是 `【】` 被造出来充当「模型 ↔ Python」的私有交换格式——`prompts.py:30` 教它、`axs_to_script()`（`ai_draft.py:127-141`，第二解析器，仅在 `service.py:105-107` 且 source≠rules 时回读）读它、`script_to_axs` 写它，自成一闭环。越过边界的那一刻——以「AXS 草稿」的名义交给用户——才是缺陷。
   → 后果是**静默降级而非报错**：canonical 的兜底把任何非 `@`、非 `\`、不含 ASCII 冒号的行一律当旁白（`parse.ts:142/297/303/312`），零 diagnostic。用户把草稿粘进文本轨即变形：`【背景 教堂】` 变旁白、全角冒号的对白丢说话人、`*旁白*` 星号留在正文。
   → **输入侧要分清，别误伤**：`ScriptEditor.tsx:179-188` 里的 `【旁白：…】` 是「粘贴散文/大纲」的**输入速记**，`biographyToProse`（`storyToAxs.ts:4-5`）同理。这是正当用法，本版不废除——废除的是 `【】` 的 **AXS 身份**。
3. **AXS 的表达力不缺。** 演出指令集 12 条齐备（上一条），示范作与 golden 机制（编译器 TS/Python golden 6/6）也在。所以「更进演绎」不需要扩语法，需要的是**语法单一真相源 + 一条能把内容填进去的通路**。
4. **桌面态连模型要过 CORS 这一关。** `tauri.conf.json` 的 `csp: null`，`capabilities/default.json` 无任何 http 权限；webview 直连本机 Ollama 属跨源，Ollama 默认白名单放行 `http://localhost:*` 而不含 `tauri://localhost`。已选路径是「文档要求用户自配 `OLLAMA_ORIGINS`」，代价是首启体验不确定——所以下限必须由 rules 兜底守住。

**Goals**：把「散文/粗写 → 合法 canonical AXS 建议」做成一条**四路可跑（rules / 本地 Ollama / 在线兼容 API / 后端 provider）、桌面离线仍有下限、产物默认不污染真相源**的内核通路。

**Non-Goals**（越界即 L3 冻结上报）

- 不做**运行时 AI 即兴**（AI 节点、玩家自由输入、世界 tick）——路线图显式后置 v2.0，本轮不提前吃下那笔债。
- **不扩 AXS 指令集**：本轮只统一并接通既有语法；新增指令属下一版。
- **不决定 UI 入口形态**（人类已定「本轮不限定，先做内核」）；只交付可被任一端消费的内核与建议面契约。
- 不装 `tauri-plugin-http`、不改 Rust 侧依赖、不动 sidecar 方案（已选 webview fetch 路径）。
- 不碰 `backend/uv.lock` 与 `backend/app/domains/llm/providers/__init__.py`（人类自有未提交改动）。
- 不动 web 冻结线的既有行为；方言修复若必须改 Python 发射器，以「新增 canonical 输出 + 旧格式停止产出」实现，不留双写。

---

## 2. Success Criteria (checkable)

- **C1 方言单一**：AI 通路（rules + 两个远程 provider 的 mock 输出）产出的文本，`packages/axs` 解析成功率 100%，且 `parse → print → parse` 幂等。`【背景】` `【音乐】` 一类旧形态在**产品代码路径里不再产生**（扫描面：`backend/app/domains/llm/**` 与 `backend/app/domains/narrative/ai_draft.py`）。
- **C2 TS 真相源**：散文→指令序列的规则引擎在 `packages/axs` 有一份 TS 实现并被测试覆盖；Python 侧不再有第二套独立的切句/归属规则表。
- **C3 共享向量**：`testdata/axs-draft/*.json` 一份向量集，TS runner 与 Python runner 各跑同一批，**退出码单独可取**；任一端偏离即红。
- **C4 离线下限**：零网络、零模型条件下能产出 ≥1 拍合法 AXS（含 `say` 与至少一条舞台指令），且该断言在 node 测试里跑得到（不靠 e2e——桌面支在 Playwright 下结构上永不可达，此判据形态已在上版验证）。
- **C5 建议不落文**：未点采纳时 `.axs` 文本**字节不变**，机械断言「改→生成→不采纳→重读」；采纳动作走既有 Transaction/Journal，单步 undo 回到采纳前字节。
- **C6 缺席与降级可见**：Ollama 不可达 / 在线 API 超时 / CORS 拒绝时，返回值携带 `source` 与降级原因，界面不得把「没问到」显示成「这里没有建议」（同 2026-09-24 那类假空态缺陷）。
- **C7 三层一致**：ADR-027（方言单一真相源）落盘、宪章 Phase 记位、`docs/user` 写清 OLLAMA_ORIGINS 与失败症状；无「文档声称已交付而代码未交付」项。

---

## 3. Technical Approach (primary + fallback + one-line reason)

**分四步，顺序不可颠倒**（理由：方言不统一时，任何上层通路都在生产不可解析文本，先接等于先放大缺陷）。

1. **M1 定方言 → 修方言 → 上门禁**。先写「三处写法逐指令对照表」进 ADR，再改发射器与提示词，最后加一条 parse 成功率 + 幂等门禁。门禁必须先见过它红。
2. **M2 内核搬到 TS，用共享向量锁住双端等价**。复用仓库既有 golden 机制的形态，而不是让 Python 与 TS 各写一套规则再靠人工同步。向量只描述「输入 → canonical 输出」，**禁止任何一端把向量当实现复制**（这是防它变成第三真相源的硬约束）。
3. **M3 provider 分派做成可注入 seam**，沿用已验证有效的 `playerSavesDeps` 形状（`{ isLocal, provider }` 式 deps 对象），使 rules / ollama / openai_compat 三支在 node 测试下都真跑得到；后端补真实端点，返回 `{axs, source, degraded?}`。
4. **M4 建议面与事务闭环**：产物默认只进建议面板，采纳才经 Transaction 落文，保证 undo 一步回到采纳前。入口 UI 不在本轮范围，但采纳动作的内核 API 本轮交付。

**Fallback**：若 Python 侧切句逻辑与 TS parser 的规范冲突到无法用一份向量收敛（例如全角/半角分隔符牵扯既有示范作），则 Python 的 `prose_to_axs` 降级为「仅远程模型的 HTTP 适配壳，规则路径整体改调 TS 产物的 golden 结果」，并把该偏差记为 L2，不静默保留两套规则。

---

## 4. Milestones

- **M1 语法单一真相源**（corrective，最高优先）：C1 + 门禁。退出准则 = 门禁红过一次并转绿。
- **M2 演绎内核入 TS**：C2 + C3。退出准则 = 双端 runner 同批向量全绿。
- **M3 四路通路**：C4 + C6。退出准则 = 三支在 node 下各有断言、离线产出合法 AXS。
- **M4 建议→采纳闭环 + 文档**：C5 + C7。退出准则 = undo 字节等价 + ADR/宪章/user 三处一致。

---

## 5. Task List

- [x] S1-T1 写「AXS 方言对照表」并立 ADR-027：逐指令列 canonical / `ai_draft` 发射 / `prompts` 教给模型的三种写法，每行指到源码行号 | Acceptance: ADR 状态「已采纳」含备选与否决理由；表内每条差异都有文件:行号可点验 | M1
- [x] S1-T2 把规则引擎的舞台指令输出改为 canonical 形态（`@bg` `@bgm … loop` `@transition kind ms` `@show 角色 [表情]` `@hide`），对白分隔符按 `packages/axs` 实际接受的写法统一；**发射侧与「端点回读改造」那一项同批落地**——Python 读不了 canonical，只改发射器会让 LLM 路径把所有指令静默读成旁白 | Acceptance: 新增断言用**共享向量**验产物被语法层接受，不用 Python 自己那套解析自证；输出侧的 `【】` 形态在扫描面内计数为 0，而输入侧的散文速记（UI 帮助文案与 `biographyToProse`）**保持不变且有用例守住** | M1
- [x] S1-T3 重写 `prose_to_axs_system`：只教 canonical 语法并附一段已通过 parse 的示例 | Acceptance: 提示词**不再教** `【】` 与全角冒号（实测 `【` 只剩 1 行，且是我加的禁止句「禁止使用【背景】【音乐】…那不是 AXS」，不是格式示例）；canonical 语法逐条来自 `print.ts` 实际形态；`@bgm` 只吃单 token 这一限制已在向量注释里记明 | M1
- [x] S1-T4 语法门禁（**L1 改判**：判据落在 `packages/axs/src/draftVectors.test.ts` 的 vitest runner 里，不另立 `check-axs-draft-grammar.mjs`——同一裁决写两处就是第二个真相源，且 vitest 已在 `pnpm gates` 链内） | Acceptance: 反向实验做过——把向量产物临时改回 `【背景】` 方言，断言报 `expected ['narration','narration',…] to equal ['bg','bgm','say','narration']` 且退出码 1（**diagnostics 始终为空，证明只有 op 序列才抓得住静默降级**），还原后绿；两端退出码各自单独取 | M1
- [x] S1-T5 废除 Python 侧的模型文本回读：`prose_to_script_with_source` 不再用第二解析器把 AXS 文本读回 IR，端点返回 canonical 文本，由前端 `parseAxs` 解析（复用产品自己的解析器） | Acceptance: `axs_to_script` 在扫描面 `backend/app/**` 内零引用后已删除；`ScriptEditor` 的 AI 草稿在 rules 与模型两种 source 下都产出合法指令序列（`applyDraft` 补了 5 条单测，解析不出指令时抛错带原因而非静默插入）；`ProseToScriptResponse` 契约变更同步更新了 schema、`ai.ts` 类型与 `docs` 引用 | M1
- [x] S2-T1 在 `packages/axs` 实现 `draftFromProse()`（散文 → 指令序列 → canonical AXS 文本），作为规则路径唯一真相源 | Acceptance: 单测覆盖切句、说话人归属、旁白、选项、舞台指令推断五类（`draft.test.ts` 9 条）；零网络零 DOM；**产物交回 `printAxs` 打印，内核不另立第二套发射器**；共享向量升级为三方锁（TS 内核 = Python 发射 = 向量本身 = printAxs 固定点），反向实验实测把 TS 转场时长改成 700 即报红、还原即绿、退出码单独取 | M2
- [x] S2-T2 建共享向量 `testdata/axs-draft/*.json` 与两端 runner（TS 进 vitest、Python 进 pytest） | Acceptance: 同一批向量名与条数在两处一致（目录空时两端都有「向量数量 ≥4」的哨兵用例，防 glob 静默无匹配造成假绿）；任一端偏离即红（实测把 TS 时长改 700 → 红、还原 → 绿）；两端退出码各自独立可取 | M2
- [ ] S2-T3 Python 规则路径收敛：`ai_draft.prose_to_axs` 不再持有独立切句规则，改为与向量同源的单一实现 | Acceptance: 写明扫描面（`backend/app/domains/**`）后 grep 证明第二套切句规则表已不存在；pytest 全绿 | M2
- [~] S3-T1 前端 provider 分派做成可注入 deps（沿用 `playerSavesDeps` 已验证形状），使 rules / 本地模型 / 在线三支在 node 测试下均可执行 | **已完成的部分**：`shared/api/draftDispatch.ts` 的 `draftDeps = { isLocal, remote }` 把「桌面本地规则引擎 / 浏览器走端点」两支都做成了可注入，且**两支各有断言**（本地支断言零请求 + 产物即 canonical + 标题透传；远端支断言参数按 snake_case 送出）——本地支在 node 下真被执行，不是结构上永不可达。**未完成**：本地 Ollama 与在线兼容 API 目前仍经 Python provider 到达，没在 TS 侧形成第二、第三支；那部分属于「模型接入」而非「规则通路」，随失败显式化与运维口径两项一并做 | M3
- [ ] S3-T2 端点从「私有方言」转「canonical + 归因」：`/api/v1/editor/ai/prose-to-axs` 与 `prose-to-script` 的产物改为 canonical 文本，响应补 `degraded` 原因字段（端点本身**已存在且有活入口**，本项是改造不是新建） | Acceptance: 两端点契约测试更新并绿；`/health` 现有行为与 `LlmStatusBadge` 消费字段零变更；`StoryEditPage` 的「AXS 草稿」粘进 `AxsCodeEditor` 后 parse 零 diagnostic | M3
- [ ] S3-T3 失败与缺席显式化：模型不可达 / 超时 / CORS 拒绝 → 自动落 rules，并携带 `source="rules"` 与降级原因 | Acceptance: 模拟断网与无 Ollama 两场景仍拿到合法 AXS 且原因可见；错误不被渲染成空建议 | M3
- [ ] S3-T4 用户文档与运维口径：`OLLAMA_ORIGINS` 配置要求、失败症状、离线可得的降级形态 | Acceptance: `docs/user` 新增可复现小节；README 配置/脚本表同步；docRegistry 用例不漂移 | M3
- [x] S3-T5 「概览」在桌面态做到**路由本体**缺席：入口已隐藏但直达 `/studio/dashboard` 仍会挂载并请求 `/api/v1/creator/dashboard`。真正的病灶不在页面而在数据层——页面是「第 78 行无条件起查询、第 81 行才 if 缺席 return」，钩子顺序上也不可能把 return 提到 hook 之前；故改在 `useCreatorDashboard` 的 `enabled` 上加缺席判据 | Acceptance: 该条目已挪进零请求名单并实测 `9 passed`（含 `/studio/dashboard 零 /api/v1 请求`）；反向实验先前已做过一次（塞进名单前它确实报红），修好前红、修好后绿 | M3
- [x] S3-T6 钉住硬不变量「本地存储不可用时，桌面分支也不得回落到 HTTP」（E15 规格）：注入必然失败的 `invoke`，访问四条需要 id 的路由，断言零 `/api/v1` 请求 | Acceptance: 首跑即抓出两处真回落并已修——`/play/:id` 的 `projectApi.recordView`（末尾 `.catch(() => {})` 把必败请求变成静默失败）与道具详情链路三处绕开 `readItem()` 直连 `itemApi.get`；修后该组 `13 passed`。**边界**：它只证明"不碰网络"，不证明页面能离线渲染出数据 | M3
- [ ] S4-T1 建议面 API：产物只进建议结构，不写 `.axs` | Acceptance: 机械断言「改→生成→不采纳→重读」后文本字节不变 | M4
- [ ] S4-T2 采纳动作经 Transaction/Journal 落文 | Acceptance: 采纳后一次 undo 回到采纳前字节；Journal 内可见该事务；toast 只在事务 ok 时出现 | M4
- [ ] S4-T3 三层文档记位：ADR-027 回写、宪章 Phase 记位、Blueprint 收尾 | Acceptance: 三处与本文件 checkbox 与实际代码一致，无虚假勾选、历史表未删改 | M4

---

## 6. Acceptance Criteria（手动验收路径）

1. 桌面态（release .app，断网、无后端、无 Ollama）：选中一拍，输入一段散文 → 得到建议 → 面板显示 `source=rules` 与「离线降级」原因 → 采纳 → 文本轨出现合法 AXS → undo → 回到原文。
2. 同机配好 Ollama 并设 `OLLAMA_ORIGINS`：同一操作 `source=ollama`；故意关掉 Ollama 后重试 → 回到 rules 且原因可见（不是空态）。
3. 门禁：`node scripts/check-axs-draft-grammar.mjs` 与两端 runner 各自退出码为 0；塞一条旧方言行 → 红。
4. `pnpm gates` 全绿（含新门禁）、`pnpm e2e` 全绿（基线 13 条行为用例 + 桌面态 HTTP 棘轮 9 条断言 = 22）、`cd backend && uv run pytest -q` 全绿。

---

## 7. Risks & Assumptions

1. **版本位序未定，需要人类选**：宪章 Phase 9（演出上限证明）现占 v1.0，而 ROADMAP 的「优先级铁律」是楔子1 先行。本 Blueprint 若插为 v1.0，Phase 9 需推到 v1.1；若不插位，则本内核作为 Phase 9 的前置切片并进同一版交付。**默认按后者执行**（不擅自重排长期规划），除非你另有指示。
2. 分隔符（全角/半角）差异可能牵扯既有示范作与 `.axs` 存量文本；处置是先出「AXS 方言对照表」那一项再动代码，不靠猜。
3. 共享向量有新立第三真相源的风险；约束写死：向量只描述「输入→canonical 输出」，两端不得把其内容当实现复制。
4. 桌面直连本机模型受 CORS 与用户配置影响，非确定性；因此 C4 把 rules 的下限当验收项而非兜底备注。
5. 修 Python 发射器会改变既有 `/llm` 相关行为——目前无端点、无消费者，判定为低风险（扫描面：`apps/web/src/shared/api/llm.ts` 只调 health）。

---

## 8. Change Log

- v1.0 draft（2026-09-25）：人类给出「支持演绎模式」的宽指令，经两轮前沿问答锁定语义（AXS 语法层创作端 AI 辅助，非运行时即兴）、内核落点（TS 真相源 + 双端 golden）、冲突策略（只出建议、采纳才落文）、离线下限（rules 必须独立成拍）、模型接入路径（webview fetch + 文档要求 OLLAMA_ORIGINS）。取证发现本版的真正阻塞项是三套 AXS 方言并存（`parse.ts` 内 `【` 计数 0 vs `ai_draft.py:97-110` 与 `prompts.py:30` 的 `【】` 形态），以及后端 AI 能力齐备却只有 `/health` 一条路由。据此把 M1 定为方言统一而非接模型。待人类确认后转 confirmed 进 Forge。
- v1.1 首项任务结案（2026-09-25）：对照表与 ADR-027 落盘（`docs/ADR/027-axs-single-grammar-authority.md`，已登记进 `docs/ADR/README.md`）。执行时把 §1 的判断**收紧了两处**：① 危险不是「解析失败」而是「静默降级」——canonical 的分派兜底把任何非 `@`、非 `\`、不含 ASCII 冒号的行当旁白（`parse.ts:142/297/303/312`），所以 `【背景 教堂】` 会被原样读给玩家听、全角冒号的对白会丢说话人，且**不产生任何 diagnostic**；② 规则引擎只覆盖 12 条 canonical 指令中的 5 条，`@camera`/`@show`/`@hide`/`@move` 整层不可生成——镜头语言正是「演出上限」最吃的那层，故 M1 不承诺离线也能出镜头。ADR 另立两条欠账：Python 侧 `axs_to_script()` 是第二解析器（须废除）、全角冒号应给 lint 诊断而非放宽解析（本轮不做）。发射器行号在提交前用 grep 逐个复核过（narration `:125-126`、choice `:127-130`、拍标题 `:141-153`），初稿曾按位置推算而偏一到两行。
- v1.2 发射器改造的前置取证（2026-09-25）：**推翻 §1 第 1 条自己写下的结论**。原写「AI 通路摸不到、`llm/router.py` 只有 /health」，实测端点一直在 narrative 路由上（`/api/v1/editor/ai/prose-to-script` 与 `prose-to-axs`，`router.py:358,371`），并有 `ScriptEditor.tsx:110` 与 `StoryEditPage.tsx:125` 两个活入口——误判成因是扫描面只取了 `llm/` 目录。缺陷因此从「接上会变形」升级为「**已经在用户眼前，粘贴即变形**」。同批查出根因：Python 对 canonical 零认知（`backend/app/**/*.py` grep `@bg` / `@show` / `startswith("@")` 零命中），`【】` 是为「模型 ↔ Python」造的私有交换格式，`axs_to_script` 是它的回读器。三条连带调整：① 新增「废除 Python 侧模型文本回读、改由前端 `parseAxs` 解析」一项（M1，且与发射器改造**必须同批**，否则 LLM 路径会把指令静默读成旁白，比现状更糟）；② 「端点」那一项从「新建」改写为「改造既有端点 + 补降级归因」；③ ADR-027 明确**只废 `【】` 的 AXS 身份，不废输入侧散文速记**（UI 帮助文案与 `biographyToProse` 属正当用法，另加用例守住）。过程失误一并记录：插入新增项时误覆盖了「内核入 TS」那一行任务，已读回原文恢复。
- v1.3 M1 落地（2026-09-25）：发射器改 canonical（标题不再跟空行、旁白不再套星号、舞台指令改 `@` 前缀、选项按 canonical 排在拍末、以 `@> #\` 开头的旁白加反斜杠）；`axs_to_script` 第二解析器删除，端点加 `axs`/`needs_parse`，解析交回前端 `applyDraft`（放在 `shared/api/ai.ts` 里与端点同处，契约改动就不可能忘掉解码器）；提示词只教 canonical；4 条**手写**向量 + 两端 runner（Python 验「发射器 reproduces 期望文本」，TS 验「期望文本是合法 canonical 且 print 回到自身」）。
  **红过的证据**：把向量产物临时改回 `【背景】` 方言，TS 报 `expected ['narration','narration',…] to equal ['bg','bgm','say','narration']`、退出码 1，还原后 0——**且 diagnostics 全程为空**，这直接证明「无诊断 + 可回印」两条判据都放过方言，只有断言 op 序列才有判别力（此认知来自动手前的反向推演，实现时又补了一遍实测）。
  两处偏离如实登记：① 语法门禁未另立 `.mjs` 脚本，改判为 vitest runner 承担（同一裁决写两处就是第二个真相源，且 vitest 已在 `pnpm gates` 链内）；② 「提示词不再出现 `【`」这条验收句按实测改写——现存 1 行是我加的**禁止句**而非格式示例，为了让勾成立而删掉有用的禁止语是错的。
  棘轮两次作用：`ScriptEditor` 一度涨到 628 > 615 被拦，处置是把逻辑并出门点文件而非调高基线，最终回到 615；`OutlinerPanel` 因上轮改动变短，基线 625 → 623 已收紧锁定。
  **本刀未闭合**：`@camera`/`@show`/`@hide`/`@move`/`@se`/`@voice`/`@wait` 在规则路径依然不可产生——发射器只覆盖规则引擎实际能产出的 op，没有为假设中的未来 op 预写分支。镜头语言那层要等「内核入 TS」那一项。存量内容不依赖方言已实测（见 ADR-027 后果 3）。
  补一道运行时防线（同批提交）：提示词只能**劝**模型守语法，守不住时 `【背景 x】` 会被 AXS 兜底当旁白静静插入且 diagnostics 为空。`applyDraft` 现在只拦这一种已证实的形态（`narration` 以 `【背景|音乐|旁白|转场|特效` 开头即拒绝写入），不做泛化猜测；配套测试断言 `【示范】序章那天的雨很大。` 这类正常旁白**不被误伤**。web 侧 `applyDraft` 单测 7 条。
- v1.4 内核入 TS（2026-09-25）：`packages/axs/src/draft.ts` 落 `proseToScriptDraft()` + `draftFromProse()`，9 条单测覆盖五类行为。**关键取舍：内核不自己拼文本**——`draftFromProse` 把 IR 交给 `printAxs` 打印，所以产物天然 canonical，而不是"再写一套发射器然后盼两边一致"（否则 M1 刚清掉的第二真相源就以另一种形式长回来了）。共享向量因此从两方升成**三方锁**：TS 内核产出的文本 == 向量 == Python 发射器产出 == `printAxs(parseAxs(向量))`。红过一次：把 TS 转场时长临时改 700，向量立刻报 `expected '# 转场\n@transition fade 700…' to be '…500…'`、退出码 1，还原后 0。
  对齐过程中撞到一个形状细节：`printAxs` 对**空音轨**会留下双空格（`("@bgm " + "" + " loop").trim()` 只 trim 首尾）。Python 侧刻意照搬而非"顺手修正"，并在代码里写明理由——形状以 `printAxs` 为准，要改得两端一起改，不是谁方便谁改。
- v1.5 桌面离线拿到演绎辅助（2026-09-25）：`shared/api/draftDispatch.ts` 落 `draftDeps = { isLocal, remote }` + `requestDraft` / `requestAxsDraft`，两个活入口（剪辑台 AI 草稿、角色传记→AXS）都改走分派口——桌面态规则引擎在本地成文、**一个请求都不发**，浏览器态逐字不变仍走 `/editor/ai/*`。这才是「内核入 TS」的实际收益：不是纯洁性，而是离线端从此有这个功能。`applyDraft` 一并搬进同模块（怎么把草稿变成 IR 是同一个关注点），顺带让 `ScriptEditor` 只引一个模块、停在 615 行的棘轮线内。测试两支各有断言（本地支断言零远端调用与产物文本，远端支断言 snake_case 参数），本地支在 node 下真的被执行到了。过程中删掉一个我为「测试可观察性」塞进生产 API 的 `localInstructionProbe` 字段——断言返回值与远端未被调用已经足够，测试脚手架不该进契约；它残留的调用点被 `tsc -b` 抓出。**该项只完成两支**：本地模型与在线 API 仍经 Python provider，没在 TS 侧立第三支，故按未完成记，不糊成已完成。
- v1.6 桌面化转向与 HTTP 残留棘轮（2026-09-26）：人类宣布最终形态是**只保留桌面端**。先做备份与还原手册（`docs/WEB_SUNSET_RESTORE.md`，tag `web-archive-20260926` → `777591f`；核实 `main` 无独有提交，且仓库从来没有 web 部署管线——无 Dockerfile/vercel/netlify【2026-09-30 更正：这条核实漏了一项——根目录有 tracked 的 `vercel.json`（自 v0.1 就在），但它声明的 Python 入口 `backend/src/main.py` 在仓库里已不存在（真实入口 `backend/app/main.py`），所以那份配置按今天的状态构建不起来；「去掉 web 不是下线一个在跑的服务」这个结论不变，依据换成这条实测，而是否曾连接过 Vercel 项目属远端不可观测】，所以"去掉 web"是删部署目标 + 迁功能，不是下线线上服务，也不是合并两条线）。为把"还剩多少没本地化"变成可测数字，新增 E14 棘轮 `apps/web/e2e/desktop-http.spec.ts`：注入桌面探针（`isTauriEnvironment()` 的真实判据就是 `"__TAURI_INTERNALS__" in window`）让浏览器里的 app 走本地支，断言 7 个路由零 `/api/v1` 请求 + 1 个欠账路由仍在请求（**故意反向棘轮：修好即变红，红了才删条目**），并先断言标记确实生效以防假绿。测量结果：桌面态 HTTP 残留 **2 → 1**——`UserContext` 每次挂载打的 `/users/session` 收进了缺席判据，此前它的失败被 `catch { setProfile(null) }` 静默吞掉，等于每个页面首帧都在等一次注定失败的请求。棘轮红过一次：临时把欠账路由塞进零请求名单 → `1 failed` 并报出具体端点，还原 → `9 passed`。e2e 基线从 13 条行为用例增至 22 条断言。另新查出一项未登记的工作并补进清单：「概览」入口在本地态已隐藏，但**直达路由仍会挂载发请求**，属路由本体缺席没做全。
- v1.7 桌面态 HTTP 残留清零（2026-09-26）：`/api/v1/creator/dashboard` 不再发出，已枚举的 8 个无 id 路由在桌面分支下**零云端请求**。病灶不在页面而在数据层——`CreatorDashboardPage` 是「第 78 行无条件起查询、第 81 行才 `if (isLocalOnlyDeployment()) return <CloudFeatureNotice/>`」，UI 看起来正确处理了本地态，请求照样打出去；而钩子顺序上也无法把 return 提到 hook 之前。故判据落在 `useCreatorDashboard` 的 `enabled` 上，缺席判断进数据层。**这一类查过才敢说清完**：以「引用 `isLocalOnlyDeployment` 的全部 8 个文件」为扫描面做行号粗筛，报 4 处可疑，逐条读后 3 处是误报（`useState`/`useSearchParams`/`useTheme` 被 `= use` 正则命中），真实例只有这一处。欠账表清空后把 dashboard 挪进零请求名单，实测 `9 passed`；此前它按设计报过红（`仍请求了：/api/v1/creator/dashboard`）——先红后绿，不是改完就宣称干净。**仍未证明的部分写进规格注释**：需要 id 的路由（编辑器 / 试玩 / 角色详情）在浏览器里拿不到本地 SQLite，未进名单，不等于已验证干净；已另立覆盖盲区任务。
- v1.8 桌面壳第一次有可跑的编译信号（2026-09-26）：`apps/desktop/package.json` 里的 `"check": "cargo check"` **本身就是坏的**——它在 `apps/desktop` 下执行，而 `Cargo.toml` 在 `src-tauri/`。这条脚本从没成功跑过，也正是 Rust 侧（asset 协议、fs 权限、sql 插件）在 CI 上零信号的原因。修为带 `--manifest-path`，并新增根命令 `pnpm check:desktop`。**先红后绿都做过**：注一处返回类型错误 → 退出码 101、报 `E0308 mismatched types`，还原 → 0；本地实测 21s（target 预热）。刻意**不**并进 `gates`：那条链只跑 JS，合并会让没有 Rust 工具链的人连门禁都跑不动；进 CI 还需单独的 Linux 工具链 spike（tauri 在 ubuntu 上要 webkit2gtk / pkg-config），未验证前不声称已绿。同时修正本人先前的一个说法——我说过"桌面不在 build 里"：`build:desktop` 的 `beforeBuildCommand` 会先建 web renderer（`tauri.conf.json` build 段），桌面产物是自足的；准确表述是「根 `build` 只出 web+admin，桌面的构建入口是独立命令且从未进 CI」。
- v1.9 E15 硬不变量抓出两处真回落（2026-09-26）：新增断言「本地存储必然失败时，桌面分支也不得发 `/api/v1`」——做法是注入一个 reject 的 `__TAURI_INTERNALS__.invoke`，访问四条带 id 的路由。**首跑就红了两条**：`/play/no-such-project` 打 `/editor/projects/:id/view`（`PlayerPage:373` 的 `recordView(...).catch(() => {})`：桌面没有可计数的服务端，那个 catch 只是把必败请求伪装成静默失败），`/studio/items/no-such-item` 打 `/editor/assets/items/:id`（`ItemDetailPage`、`useProjectDirectory`、`useProjectOutliner` 三处绕开 `assetPoolSaves::readItem()` 直连 `itemApi.get`，而分派口早就存在）。修法分别是本地态不发计数、三处改走 `readItem`；顺带删掉两处因此变空转的 `itemApi` 导入。修后该文件 `13 passed`。`DiscoverItemDetailPage:30` 同样直连，但发现页是云语义且桌面入口已隐藏，刻意不动（扫描面：`grep itemApi.` 于 `apps/web/src`）。棘轮又一次是对的：`PlayerPage` 那两行解释性注释被 G1 拦下（1395 > 1393），理由移进提交信息——往一个已排期拆分的巨石里加注释本身就是错的方向。
- v1.10 逐功能去留清单落盘（2026-09-26）：`docs/WEB_FEATURE_DISPOSITION.md` + 取证脚本 `scripts/desktop-disposition-inventory.mjs`。动机是 E14/E15 只量得到"页面会不会打网络"，量不到"功能在桌面上到底有没有"——**入口隐藏 ≠ 功能已同步**。清单分四类（已本地化 / 云本质按缺席处理 / 桌面可达但仍直连 = 缺口 / 判据噪声），并把脚本的三个限度写明：`discover/**` 十几个文件"无判据"是假阳（`DiscoverPage` 在任何查询之前就 return，E14 实测零请求佐证），而 `httpDomains`、`draftDispatch` 本身就是实现体与分派口。查出两条此前无人知道的 C 类缺口并各立一项：**角色传记正文在桌面根本读不出来**（五个文件全无条件走 `storyApi`；讽刺点是本版刚把「传记→AXS」接到本地内核，数据源没接，等于半条腿），以及**编排台「从资产池导入/搜索道具」仍打云端**——本地资产池 v0.8 就建好了，这条在桌面是有意义该可用的操作，不能用隐藏入口交差。顺手修掉第三类的实例：`useLlmHealth` 无 `enabled` 判据，桌面每次开编辑器发一次必败 `/llm/health`，且因 `data` 恒空把徽章算成「AI · 规则引擎（降级）」——**把"我还没问到"显示成"我查过并且坏了"**，与本项目反复清理的那类失效同形；徽章本地态改为如实显示「本地规则引擎」。另记录一个方法论事实：E14/E15 用不存在的 id 访问，页面早早 bail，因此**结构上测不到"有数据才挂载"的组件**——这是当前验收的真实盲区，已写进清单。
