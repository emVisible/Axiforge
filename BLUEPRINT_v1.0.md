# Build Blueprint v1.0 | Status: draft（待确认后进 Forge）

> 日期 2026-09-25 · 分支 `desktop` · 基线 `af8ef81`（tag `desktop-v0.7` 之后）· 主题 **演绎内核：AXS 单一语法 + 创作端 AI 辅助**
> 关联 [ADR-024](docs/ADR/024-desktop-local-first.md)、[KERNEL_DESIGN.md](docs/KERNEL_DESIGN.md) §2.5、[REFACTOR_DESKTOP.md](docs/REFACTOR_DESKTOP.md)、[ROADMAP_FINAL.md](docs/ROADMAP_FINAL.md) M3
> 人类裁决四条（本轮对齐结果，不再重开）：① 语义=AXS 语法层的创作端 AI 辅助（不是运行时即兴）；② TS 为真相源 + 双端 golden；③ 冲突策略=只出建议，采纳才落文；④ 桌面纯离线是硬约束，rules 必须独立成拍；⑤ Ollama 走 webview fetch，文档要求用户自配 `OLLAMA_ORIGINS`。

---

## 1. Goals & Non-Goals

**取证结论（全部指到源码，非推定）**

1. **AI 内核在后端几乎已经建完，但产品里摸不到。** `AiProvider` 协议定义了 `suggest_character_layers` 与 `prose_to_axs`（`llm/provider.py:14,23`）；`rules` / `ollama` / `openai_compat` 三个 provider **都实现了** `prose_to_axs`；`llm/service.py:72` 的 `prose_to_axs_with_source` 还带 `_run_with_fallback` 的来源归因。而 `llm/router.py` 只有 `@router.get("/health")` 一条路由——前端 `llmApi` 也只有 `health()`。
2. **仓库里存在三套互不兼容的 AXS 方言，而 AI 通路输出的不是 canonical 那一套。** canonical 由 `packages/axs` 定义：`@bg` / `@bgm … loop` / `@se` / `@voice` / `@wait ms` / `@transition kind ms` / `@fx` / `@camera` / `@show 角色 [表情]` / `@hide` / `@move`（见 `packages/axs/src/print.ts:85-116`），且 `【` 在 `parse.ts` 里出现 **0 次**。但 `narrative/ai_draft.py:97-110` 的发射器写的是 `【背景 x】` `【音乐 x】` `【转场 fade】` `【特效 flash】`；`llm/prompts.py:30` 还**教模型**输出 `【背景】【音乐】【转场】`；同一发射器的对白写 `speaker: 台词`（半角）而提示词写 `角色：台词`（全角）。
   → 推论：**今天把这条通路接出入口，产物会被编辑器语法层拒收**，等于往作者手写的真相源里灌不可解析文本。
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

- [ ] S1-T1 写「AXS 方言对照表」并立 ADR-027：逐指令列 canonical / `ai_draft` 发射 / `prompts` 教给模型的三种写法，每行指到源码行号 | Acceptance: ADR 状态「已采纳」含备选与否决理由；表内每条差异都有文件:行号可点验 | M1
- [ ] S1-T2 把规则引擎的舞台指令输出改为 canonical 形态（`@bg` `@bgm … loop` `@transition kind ms` `@show 角色 [表情]` `@hide`），对白分隔符按 `packages/axs` 实际接受的写法统一 | Acceptance: 新增断言用**共享向量**验产物被语法层接受，不用 Python 自己那套解析自证；旧 `【】` 形态在扫描面内计数为 0 | M1
- [ ] S1-T3 重写 `prose_to_axs_system`：只教 canonical 语法并附一段已通过 parse 的示例 | Acceptance: 提示词文本内不再出现 `【`/全角冒号示例；示例本身进 golden 用例并通过 | M1
- [ ] S1-T4 新增门禁 `scripts/check-axs-draft-grammar.mjs`：对 AI 通路样本集断言 parse 成功率 100% 且 `parse→print→parse` 幂等 | Acceptance: 先做反向实验——塞入一行 `【音乐 x】` 必须退出码 1，还原后 0；退出码单独取 | M1
- [ ] S2-T1 在 `packages/axs` 实现 `draftFromProse()`（散文 → 指令序列 → canonical AXS 文本），作为规则路径唯一真相源 | Acceptance: 单测覆盖切句、说话人归属、旁白、选项、舞台指令推断五类；零网络零 DOM 依赖 | M2
- [ ] S2-T2 建共享向量 `testdata/axs-draft/*.json` 与两端 runner（TS 进 vitest、Python 进 pytest） | Acceptance: 同一批向量名与条数在两处一致；任一端偏离即红；两端退出码各自独立可取 | M2
- [ ] S2-T3 Python 规则路径收敛：`ai_draft.prose_to_axs` 不再持有独立切句规则，改为与向量同源的单一实现 | Acceptance: 写明扫描面（`backend/app/domains/**`）后 grep 证明第二套切句规则表已不存在；pytest 全绿 | M2
- [ ] S3-T1 前端 provider 分派做成可注入 deps（沿用 `playerSavesDeps` 已验证形状），使 rules / 本地模型 / 在线三支在 node 测试下均可执行 | Acceptance: 三支同一测试源各有断言；不出现「桌面支只写在代码里、结构上永不被测」的形态 | M3
- [ ] S3-T2 `llm/router.py` 补出真实生成端点，返回 `{axs, source, degraded?}` | Acceptance: 端点契约测试通过；`/health` 现有行为与 `LlmStatusBadge` 消费字段零变更 | M3
- [ ] S3-T3 失败与缺席显式化：模型不可达 / 超时 / CORS 拒绝 → 自动落 rules，并携带 `source="rules"` 与降级原因 | Acceptance: 模拟断网与无 Ollama 两场景仍拿到合法 AXS 且原因可见；错误不被渲染成空建议 | M3
- [ ] S3-T4 用户文档与运维口径：`OLLAMA_ORIGINS` 配置要求、失败症状、离线可得的降级形态 | Acceptance: `docs/user` 新增可复现小节；README 配置/脚本表同步；docRegistry 用例不漂移 | M3
- [ ] S4-T1 建议面 API：产物只进建议结构，不写 `.axs` | Acceptance: 机械断言「改→生成→不采纳→重读」后文本字节不变 | M4
- [ ] S4-T2 采纳动作经 Transaction/Journal 落文 | Acceptance: 采纳后一次 undo 回到采纳前字节；Journal 内可见该事务；toast 只在事务 ok 时出现 | M4
- [ ] S4-T3 三层文档记位：ADR-027 回写、宪章 Phase 记位、Blueprint 收尾 | Acceptance: 三处与本文件 checkbox 与实际代码一致，无虚假勾选、历史表未删改 | M4

---

## 6. Acceptance Criteria（手动验收路径）

1. 桌面态（release .app，断网、无后端、无 Ollama）：选中一拍，输入一段散文 → 得到建议 → 面板显示 `source=rules` 与「离线降级」原因 → 采纳 → 文本轨出现合法 AXS → undo → 回到原文。
2. 同机配好 Ollama 并设 `OLLAMA_ORIGINS`：同一操作 `source=ollama`；故意关掉 Ollama 后重试 → 回到 rules 且原因可见（不是空态）。
3. 门禁：`node scripts/check-axs-draft-grammar.mjs` 与两端 runner 各自退出码为 0；塞一条旧方言行 → 红。
4. `pnpm gates` 全绿（含新门禁）、`pnpm e2e` 13 条原样全绿、`cd backend && uv run pytest -q` 全绿。

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
