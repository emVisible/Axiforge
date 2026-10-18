# Build Blueprint v1.8 | Status: confirmed v1.0 → executing v1.8

Version target: **v0.9** · Charter phase: **Phase 8 · 设计系统收口（UI 与视觉设计专项）**
Tier: Standard（8 节 · 单一执行权威）

前置事实（决定了本轮的起点，不是从零开始）：
产物 CSS 此前一直缺着共享组件库的样式（Tailwind v4 不扫 `apps/web` 之外的包），
该缺陷已修复，CSS 由 90,043 → 104,192 字节。**因此本轮之前任何观感结论都不可信，逐屏巡检在新基线上重做。**

---

## 1. Goals & Non-Goals

**Goals**

1. **可读性下限**：12px 以下不再有第三种字号。当前实测剩 73 处任意值，其中 46 处是 `text-[9px]`——中文在 9px 下笔画粘连，这是可读性问题，不是风格偏好。
2. **对比度可判定**：把日夜双主题的 WCAG AA 变成一条能跑的数字门禁，而不是「看着还行」。
3. **动效诚实**：`transition-all` 清零（现剩 20 处），每处只动画它真正会变的属性；密集界面不再连带布局抖动。
4. **四态巡检**：用已建成的 `QueryStatePanel` 逐屏收敛，消灭「错误伪装成空态」这一类缺陷的残余。
5. **主题一致性**：硬编码色为 0（门禁已生效），日夜双主题逐屏复检。

**Non-Goals**

- 不改功能语义、不加新界面能力（宪章 Phase 8 非目标原文）。
- 不拆 `PlayerPage` / `useProjectEditor` 剩余两域——那是 Phase 7 结转项，混进设计轮会同时毁掉两边的单维度纪律。
- 不做动效库大改或新增装饰性动画；本轮只让既有动效变得**有名分、可预期、不抖**。

---

## 2. Success Criteria (checkable)

| # | 判据 | 度量方式 |
|---|------|----------|
| C1 | `text-[9px]` 归零 | `grep -c` 全仓为 0；字号棘轮 baseline 同步收紧 |
| C2 | 对比度达标 | 新门禁对 tokens.css 明暗两套逐一计算 WCAG 比值，正文 ≥4.5:1、大字 ≥3:1，退出码 0 |
| C3 | `transition-all` 归零 | 门禁 baseline 该项总数 0 |
| C4 | 四态巡检 | 巡检表逐屏打勾，且每屏错误态与空态不同时出现（DOM 断言） |
| C5 | 观感证据 | 每个改动里程碑有改前/改后成对截图存 `docs/design/`，含复现条件 |
| C6 | 不夹带 | 功能回归：E2E 13 条原样全绿；`pnpm gates` 退出码 0 |
| C7 | 结构不回退 | 行数棘轮 0 越线（设计轮同样不许把文件写大） |

---

## 3. Technical Approach (primary + fallback + one-line reason)

**主路径 · 对比度用计算而非肉眼**：从 `packages/ui/styles/tokens.css` 解析明暗两套 `--ax-*`，
按「前景/背景」语义配对（ink/canvas、ink-muted/surface、ink-on-scrim/遮罩等）算相对亮度与对比度，
低于 WCAG AA 即退出码非 0。理由：主题色是**成对**的，肉眼逐屏看会漏且不可复现；
而配对关系一旦写进脚本，改色就立刻在 CI 里暴露，这是唯一能长期守住的形态。

**主路径 · 字号迁移按屏推进、每屏看一次**：`text-[9px]` 集中在 Outliner / Timeline / 图例等密集 NLE 面板，
9→10px 是有意的观感改动（不是等价替换），必须一处一处看溢出与换行，不批量推。

**Fallback**：若某面板 10px 会挤破布局，则**不降字号**而是减少该处同时出现的微标签数量
（合并/省略次要信息）——宁可少放字，不可把字缩回不可读。

---

## 4. Milestones

| M | 名称 | 交付判据 | 用户可否看见 |
|---|------|----------|--------------|
| M1 | 对比度门禁 | C2 | 间接（主题可读性被锁住） |
| M2 | 字号收口 | C1 + C5 | ✅ 微标签可读性 |
| M3 | 动效收口 | C3 | ✅ 悬停/切换不再抖 |
| M4 | 四态与主题逐屏巡检 | C4 + C5 + C6 + C7 | ✅ 空态/错误态与日夜主题 |

---

## 5. Task List

- [x] S1-T1 写 `scripts/check-contrast.mjs`：解析 tokens.css 明暗两套变量，按语义配对算 WCAG 比值，低于 AA 即失败 | Acceptance: 门禁对当前主题跑出真实数字并**至少一条处于临界**（证明它不是恒绿）；人为把某色改浅一档 → 退出码 1，还原 → 0 | M1
- [x] S1-T2 修门禁查出的对比度不足项（若明或暗任一配对不达 AA） | Acceptance: 全配对达标，改前/改后截图成对存档 | M1
- [x] S1-T3 把对比度门禁接入 `pnpm gates` | Acceptance: `gates` 退出码单独取到 0，且移除该步会失败的负向验证做过一次 | M1
- [x] S2-T1 迁移 Outliner 的 17 处 `text-[9px]` | Acceptance: 该文件计数归零、棘轮收紧，改后截图确认无溢出与换行错位 | M2
- [x] S2-T2 迁移 Timeline 与图例类的剩余 `text-[9px]`，并连带清掉 Outliner 里 5 处更糟的 `text-[8px] text-ink-faint`（最小字号配最低对比度） | Acceptance: 全仓 `text-[9px]` 为 0；若某处挤破布局，按 fallback 减标签而非缩字，并在变更日志写明取舍 | M2
- [ ] S2-T3 收口其余字号任意值（`text-[8px]` 等长尾） | Acceptance: 字号棘轮总数 ≤20 且无新增档位 | M2
- [x] S3-T1 迁移 apps/web 与组件库剩余 26 处 `transition-all` | Acceptance: 逐处按同一串里实际存在的 hover/active 类导出显式属性表；门禁该项总数 0 | M3
- [ ] S3-T2 悬停与切换的观感核验（录屏或逐帧截图） | Acceptance: 至少覆盖卡片、按钮、侧栏、节点四处，改前后成对存档并写明哪些无法静态验证 | M3
- [ ] S4-T1 四态巡检（**进行中**：道具页与场景页已收敛到 `QueryStatePanel`；discover 三个 tab 的「失败伪装成空态」已修（真实停机验证），但仍是手写分支未套原语；作者页、创作者概览未处理）：把仍手写四分支的页面收敛到 `QueryStatePanel` | Acceptance: 巡检表逐屏打勾；每屏断言错误态与空态不同时出现 | M4
- [ ] S4-T2 日夜双主题逐屏复检（**进行中**：已核验 discover / 剧本列表 / 剪辑台三屏的明暗两套，含确认主题切换真的生效；角色详情、发现各 tab、玩家页、admin 未看） | Acceptance: 每屏两套主题各一张截图，无不可读文本、无色块断层 | M4
- [ ] S4-T3 本轮收尾：宪章 Phase 8 勾选按实测标注，未达成项结转 v1.0 并写理由 | Acceptance: 文档所述均可被门禁或截图证据支撑 | M4

> 引用任务时一律用标题词而非裸 ID：门禁按**全文出现次数**判重，§7/§8 里写一个 ID 就会与 §5 相撞。

---

## 6. Acceptance Criteria（手动验收路径）

1. `pnpm gates` → 退出码单独取（不看被截断的尾部输出）。
2. `node scripts/check-contrast.mjs` → 打印每对配方的比值与判定。
3. `grep -rc "text-\[9px\]" apps/web/src packages/ui/src` → 全 0。
4. `grep -rc "transition-all" apps/web/src packages/ui/src` → 全 0。
5. 打开 Discover / 剧本列表 / 剪辑台 / 角色详情，切日夜主题各看一遍：无不可读文本、无悬停抖动。
6. 对照 `docs/design/` 成对截图确认改动确实发生且可复现。

---

## 7. Risks & Assumptions

| # | 风险 | 处置 |
|---|------|------|
| R1 | 9→10px 在密集面板挤破布局 | 逐屏改、逐屏看；宁可减标签不缩字 |
| R2 | 对比度脚本把「语义配对」猜错，产生假绿或假红 | 配对表写成显式白名单并在输出里打印，人工可核；宁可漏报不误报为达标 |
| R3 | 静态截图无法证明过渡动画正确 | 明确标注证据边界；动效观感用录屏/逐帧，或留待人工核验，不谎称已验证 |
| R4 | 设计轮顺手改结构，破坏单维度 | 行数棘轮与 E2E 全程在线，越线即停 |
| R5 | 门禁自身写错却长绿 | 每条新门禁上线前做一次反向实验，亲眼见它红过 |
| R6 | 随包示范作仍缺元数据（Phase 7 结转） | 不在本轮解决，但首屏观感会受影响；已在宪章登记，不静默 |

---

## 8. Change Log

| 版本 | 时间 | 变更 | 偏差等级 |
|------|------|------|----------|
| v1.0 | 2026-09-24 | 依宪章 Phase 8 建立首版。起点是本轮刚修复的 Tailwind 源扫描缺陷——修复改变了前提，故明确「此前观感结论作废、在新基线重做」 | — |
| v1.8 | 2026-09-24 | **从零复核**（因本轮三次栽在「测的是改动前的世界」，这次先 `pnpm install --frozen-lockfile` + `rm -rf dist` 全新构建再验）：install 0、build 0、`pnpm gates` 0（editor-core 130 / web 78 / core 49 / axs 20）、**backend pytest 42 passed 退出码 0**（此前几轮只跑前端门禁，后端套件其实一直是绿的但没取数）、E2E 13/13、四道棘轮 0 越线 | L1 自动 |
| v1.8 | 2026-09-24 | 决定**不在本轮做** discover 三 tab 的四态原语改造：错误态已在上一轮修好并停机验证，剩下的只是把已正确的三段并列 `&&` 换成面板——纯观感收益，而 JSX 切片一旦失配会留下编译不过的仓库且剩余预算不足以修复。留作下一轮独立一刀，比夹带进来更负责 | L2 记录 |
| v1.7 | 2026-09-24 | 逐屏巡检在公开发现页查出一个真实缺陷并修好：三个 tab 的取数只有 `try/finally` 没有 `catch`，后端失败时 items 停在 `[]`，页面照样显示「还没有公开作品」——把「我没取到」说成「这里没有内容」。现显式记 error、渲染错误态并给可用重试（重试要进 effect 依赖，否则按钮是死的）。**用真实停机验证**：修复前截图显示空态，修复后显示「剧本清单加载失败」+ 重试 | L1 自动 |
| v1.7 | 2026-09-24 | 第一次停机验证得出「修复没生效」的结论是**错的**，原因是 `vite preview` 服务的是改动前构建的 `dist/`（`pnpm gates` 不含 build）。重新构建后同一测试立即通过。教训：验证前端改动前必须确认产物是新的——这与之前「比较的两次构建都在改动之后」是同一类失效，第三次踩到，说明「产物新鲜度」要当成前置检查而不是事后反思 | L2 记录 |
| v1.6 | 2026-09-24 | 四态收敛推进两页（道具、场景）。过程中撞到一个primitive 性质的认知点：删掉 `{scenes && scenes.length > 0 && (` 这层守卫后 typecheck 立即报 possibly-undefined——**面板保证的是「只在 ready 态渲染到 children」，这是语义保证而非类型保证**，类型层面它不知道。故 children 内仍保留可选链，不假装类型系统能替我们记住这件事 | L1 自动 |
| v1.5 | 2026-09-24 | 逐屏巡检发现门禁的作用域判错：玩家页是沉浸式黑底，白色半透明本就是它的正确语汇，把 player 塞进硬编码色的扫描根会一次报出约 150 处误报——常红的门禁等于没有门禁。改为两条规则各用一套作用域：硬规则只管走令牌的界面，玩家页交给「低透明度文字棘轮」管（边框底色可以白，10% 白度的正文读不出来是真缺陷） | L1 自动 |
| v1.5 | 2026-09-24 | 新棘轮量化出玩家页 62 处 ≤39% 白度文字，其中确有必须读到的信息：「空格继续」召唤在 10% 白度（约 1.2:1）、「该剧本还没有可播放的演出」「暂无对话记录」等空态说明在 10-20%。已提亮 15 处纯信息性文字，棘轮 62 → 47。**刻意未动**禁用态选项（本就该暗）与悬停才现的图标按钮（另一类，留待逐屏判断） | L1 自动 |
| v1.4 | 2026-09-24 | 动效收口后补做暗色核验：本轮改过暗色令牌（ink-faint 提亮、新增 on-brand），只看亮色等于没验。截图确认主题**确实生效**（切换图标显示为「日」＝当前暗色）再判读，避免「以为在看暗色其实还是亮色」这种假验证 | L1 自动 |
| v1.4 | 2026-09-24 | 逐屏巡检保持未勾并写明覆盖面：三屏 × 两套主题已看，角色详情/发现各 tab/玩家页/admin 未看。基线目录 README 同步列出「尚未覆盖」清单，防止几张截图被当成全站已巡检 | L2 记录 |
| v1.3 | 2026-09-24 | 动效收口完成，全仓 `transition-all` 归零。每处的属性表是从同一串里实际存在的 hover/active/内联样式**推导**而非套模板：进度条的宽度由 `style={{width}}` 驱动，若按「按钮类就用 transition-colors」的直觉去改，那条动画会直接消失。产物 CSS 复核到 `transition-property:width,background-color` 等五条真实存在 | L1 自动 |
| v1.3 | 2026-09-24 | 证据边界如实标注：静态截图证明不了「过渡本身正确」，本项只能证明**意图已被正确编码进 CSS**、且功能未回归（gates + E2E 全绿）。真正的观感核验（悬停是否仍顺滑、有无该动没动）需要录屏或人眼，仍留在逐屏巡检里未打勾 | L2 记录 |
| v1.2 | 2026-09-24 | 字号收口达成 apps/web 与 packages/ui 内 **9px 与 8px 全清零**（共 45 处）。逐屏核验：Outliner 与时间轴改前/改后截图版式一致、无换行溢出，故未触发 fallback（不需要靠减标签来腾位）。棘轮 73 → 29 | L1 自动 |
| v1.2 | 2026-09-24 | 一处计数口径的自我纠正：我先用 `grep apps/web/src packages/ui/src --include=*.tsx` 得到「剩 14 处」，与门禁报的 34 处不符。按门禁自身口径复算才对上——差额的 21 处在 **apps/admin**（我的 grep 根本没扫那个 app）。报数字前先对齐口径，别拿自己顺手写的 grep 当门禁的数 | L1 自动 |
| v1.1 | 2026-09-24 | 首个里程碑交付即回改本文件的判据：C2 原写「逐对算比值」，实际还须查**桥接令牌在明暗两套里是否都存在**——上线前就发现 `--ax-ink-on-scrim` 只写在暗色块，亮色主题下是悬空引用（文字会掉回继承色）。这类缺陷肉眼只会看成「设计本来就这样」 | L1 自动 |
| v1.1 | 2026-09-24 | 门禁查出 9 项真实不达标并全部修好：亮色次级文字 4.17→达线、占位提示 2.54/2.19→3.67/3.74、强调色 2.73/2.55→达线、暗色占位 2.66/2.71→达线。另修正门禁自身一处建模错误——「主色块上的文字」不该拿 `ink` 去配（那是 1.35:1 的假阳性），改用新增的 `--ax-on-brand` | L1 自动 |
| v1.1 | 2026-09-24 | 门禁反向验证通过：把某令牌改浅一档 → 退出码 1；还原 → 0。并已接入 `pnpm gates`（现含 typecheck/unit/lint/purity/circular/size/contrast 七道） | L1 自动 |
| v1.0 | 2026-09-24 | 我一度把任务 ID 前缀改成自造形态，理由是「避开与上一份执行权威的重复判定相撞」——那是**误记**：门禁是逐文件跑的，两份 Blueprint 之间不存在碰撞。改回规范形态，并把真正的约束（引用任务只能用标题词）写进任务清单下方 | L1 自动 |

---

## 9. 会话交接（预算将尽，未完成项的精确入口）

**下一步第一刀（明确、低风险、已定位）**：把 discover 三个 tab 的三段并列 `&&` 换成
`QueryStatePanel`。三处形状完全一致，判据写法已确定：

```
state={resolveQueryState({ isLoading: loading && page === 0, error, count: items.length })}
```

`page === 0` 这个限定不能丢——分页加载更多走的是 `loadingMore`，
若直接用 `loading` 会把「翻页中」误判成整页重载。
children 内保留可选链：面板给的是语义保证，不是类型收窄（道具页实测过这一点）。

**【已结案 2026-09-24 · commit 9900874】工程元数据写入面三支分叉**：
`updateProjectMeta` 三支实现口径不一致，且存在契约里没有的字段——
① `packages/editor-core/src/storage/types.ts` 的 `ProjectMetaPatch` 只有
`title/axsSource/description/coverImage/themeTags/mechanism/genre/isMeta`；
② `apps/web/src/shared/storage/httpStorageProvider.ts` 只转发 `title`/`axs_source`，
其余六项在 web 支**静默丢弃**（桌面支的 SQLite 全转发，两支行为分叉）；
③ `apps/web/src/features/studio/hooks/useProjectEditor.ts` 的 `patchProjectMeta`
入参类型写着 `world_setting`/`rules`，这两个字段**契约根本不存在**，两支都不落库，
而 UI 照样弹「已保存项目信息」（调用口：`CutWorkspace.tsx` 的 `onProjectPatch`）。
tsc 放过它是因为传的是非字面量变量，excess-property 检查不生效。

裁决依据是取证而非偏好：后端 `narrative/models.py` 与 `schemas.py` 里 `world_setting`/`rules`
是 projects 的一等列，且 `compiler.py` 会把 `world_setting` 编进 IR、玩家页设定面板消费它——
所以走「补齐契约」而不是「删 UI 入参」。落地：`ProjectMeta`/`ProjectMetaPatch` 补两字段、
SQLite `COLUMN_PATCHES` 加两列（幂等）、HTTP 侧 body 构造外提为 `httpDomains::metaPatchToUpdateBody`
（顺带解掉自己撞上的 G1 棘轮越线）、UI 改用契约键 `worldSetting` 而不加翻译层、
`ProjectUpdate.axs_source` 按后端 schema 放宽为可空（此前靠 `as ProjectUpdate` 掩盖）。
证据：`pnpm gates` 退出码 0、`pnpm e2e` 13/13、新增用例对旧实现实测为红。

**该刀的残留（下一个入口，属功能新增不是缺陷）**：`theme_tags`/`mechanism`/`genre`/`cover_image`
四栏契约与本地库都已支持写入，但编辑器只给了简介/世界观/规则三个输入口——
「标签与机制在本地无数据可筛」因此仍然成立，缺的是入口而非通路。做时注意：
标签是数组、封面是素材引用（要经 `saveAsset` 拿 ref，不要塞裸路径），两者都不该另立第二套上传口。

**其余入口按性价比排序**：
1. 作者页 / 创作者概览 / 角色详情 / admin 端四态与观感巡检（未看过）
2. v0.8 结转：`PlayerPage` 播放内核安全网 → 再分层（顺序不可颠倒，该文件零单测且已 1393 行）
3. v0.8 结转：`useProjectEditor` 的 persistence 与 node-inspector 两域（9 个函数交错在 197–932 行）
4. `packages/core` 覆盖率 83.47% 语句 / 72.02% 分支 → ≥90%（门禁标准不下调迁就现状）
5. 随包 `.axsp` 元数据：重建会造出第二个真相源，**方案未定，不要贸然做**

**等价性判据（拆巨石时必用，均已机械化）**：
`node scripts/export-hook-surface.mjs <file>` 比对公开符号集 + E2E 13 条 + `pnpm gates`。

**验证前置检查（本轮三次栽过，务必执行）**：
先 `rm -rf apps/web/dist && pnpm --filter @axiforge/web build` 再看界面；
`pnpm gates` 不含 build；退出码单独取；后端套件是 `cd backend && uv run pytest -q`。
