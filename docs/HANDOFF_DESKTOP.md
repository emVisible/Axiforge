# 桌面化重构 · 交接快照（2026-09-29 收束）

> 用途：让下一个会话（或人）在**不重做普查**的前提下接手。
> 这份文件只登记「边界 + 状态 + 待决形状 + 禁区」，**不复制细节权威**：
> 执行权威是 [REFACTOR_DESKTOP](./REFACTOR_DESKTOP.md) 的 Phase 13 清单与 [ADR-029](./ADR/029-desktop-only-build-target.md)；
> 删除动作的恢复锚点是 [WEB_SUNSET_RESTORE](./WEB_SUNSET_RESTORE.md)；逐模块去留是 [WEB_FEATURE_DISPOSITION](./WEB_FEATURE_DISPOSITION.md)。
> 本文件是**快照**，一旦与上面三份冲突，以上面三份为准，并回来改掉这里。

## 1 · 边界与恢复点

- 分支 `desktop`，HEAD `eddebeb` == `origin/desktop` == tag `desktop-wip-20260929bd`（本快照就是这一颗）。
- 同日三枚 wip 标签：`…bb`=`faa6fa7`（`check:dispatch` 收紧三档合法）、`…bc`=`6819557`（`check:labels` 要求真引用 + README 漂移修正）、`…bd`=`eddebeb`（labels 作用域扩三层）。
- 自证一条命令：`git rev-parse HEAD origin/desktop desktop-wip-20260929bd^{}` 三个 SHA 应相同。
- 更早的 web 冻结线与离线整包锚点在 [WEB_SUNSET_RESTORE](./WEB_SUNSET_RESTORE.md) 的锚点表里，这里不重列。

## 2 · 当前验收状态（四条腿都在上述边界上实测，不是声明）

| 腿 | 命令 | 实测 |
|---|---|---|
| 前端门禁（共十一道） | `pnpm gates` | 退出码 0；单测 core 82 / axs 37 / editor-core 153 / web 181（+1 显式跳过）/ admin 39 = **492 passed + 1 skipped** |
| 桌面态 e2e（**不起后端**） | `pnpm e2e:desktop` | **31 passed**（1.4m） |
| 浏览器态 e2e（起 uvicorn + vite） | `pnpm e2e` | **44 passed**（1.0m） |
| Tauri 壳 Rust 侧 | `pnpm check:desktop` | 退出码 0（刻意不进 `gates`：门禁只跑 JS） |

两道今天新加严的棘轮，读数分别是：`check:labels` 扫 204 个 tsx / 基线豁免 **1 条**、`check:dispatch` 扫 5 个分派口文件 / **30 个导出 async 函数**全合格。

## 3 · Phase 13 清单的机械读法

以 `docs/REFACTOR_DESKTOP.md` 第 500–978 行的 checkbox 为唯一权威（ dated 散文里的汇总语句可能滞后，别拿它当状态）：

- `[x]` 8 项：S13-1 传记、S13-2a 舞台与角色增删、S13-2b 舞台库导入、S13-2c 道具引用、S13-2e 工程域写侧、S13-2f 角色设定导出、S13-2g `.axsp` 往返、S13-8 战略文档（ADR-029）。
- `[~]` 2 项：S13-2d（五处「有数据才挂载、E14/E15 结构上测不到」的待核项——`usePlayer` 由 E28 覆盖、`SaveSlotPanel` 由 E33 覆盖、建档建议由 E19 覆盖、nexus 工具条由 E18 覆盖但**浏览器那一半的「按钮应该在」仍没断言**、`PromptExport` 至今零挂载＝#60）、S13-5（桌面那一半能脱离后端跑，**欠的只是 CI 以桌面为主目标**）。
- `[ ]` 4 项：S13-3 云本质判死与摘除、S13-4 AI 通路本地化（4a 已落，4b 三条未落）、S13-6 后端退场、S13-7 分支消解。

## 4 · 待决项按「谁能推进」分档

这是本快照最需要传达的一点：**剩下的没有一条是缺技术信息的，缺的是判断或一次真机操作。**

### A · 等你一个词（7 条）

| 条目 | 决策形状 | 已量好的输入 |
|---|---|---|
| S13-3 | `/discover`、`/author/:id`、`/profile` 六动作、`nexus sendToInbox`、`versions`、`tags`——整体摘除，还是像 E35–E37 那样收成「显式缺席说明」 | 摘除面已数：云端页面 955 行 / 8 文件（每页其他引用者＝1，只有路由表）、`http*` 实现侧 1030 行；清单在 REFACTOR_DESKTOP 的「S13-3 清单」段 |
| S13-6 + S13-7 | 验收基线搬家走**壳内冒烟**，还是接受**后端只当测试宿主**长期留着 | 前置已满足：`pnpm e2e:desktop` 是那条命令；`check:dispatch` 30/30 说明分派口层无遗留缺口 |
| #68 | 分支只由连线表达（→ 摘掉「+ 分支」按钮），还是 AXS 加 `choice` 行语法（→ 协议改动，动双向映射与 golden） | 根因已查明：`choice` op 在方言里没有行归宿，序列化回来落回 `narrative`；界面不报错。**这一条同时解锁 #65 最后那条豁免** |
| #66 | 自动存档挂在播放器卸载的 600ms 防抖上，进播放器后 600ms 内离开会丢那一拍；`restartFresh` 清的是**全部**槽位不只自动那一格 | 时机与影响面在 E28/E33 的注释与 task #66 |
| #57 | dev 库里 2638 条测试工程残留要不要清 | 一句「清」即可动手；测试库隔离早已落地（#54），dev 库现在只脏在历史残留 |
| #58 | 术语表（glossary）三档：接本地 / 删 / 维持现状 | 实测随包 `.axsp` 里没有 `playMeta`，缺的是**写入侧**不是投影侧 |
| #60 | `PromptExport` 那 192 行零挂载组件：接本地通路还是判死 | 唯一通路是 `characterApi.export`，桌面不可达；角色设定导出本地化已由 S13-2f 另有实现 |

### B · 等人在真壳里点一次（3 条）

- **#16** release 产物的首启播种与播放冒烟（`.app` / `.dmg` 路径已写在该单里）。
- **#27** 壳内 SQLite 支的播放回读与 WKWebView 像素（无头 Playwright 测不到那一层）。
- **#31** `OLLAMA_ORIGINS` 在真壳里仍是纸面推断——浏览器来源是 `localhost` 被默认放行，壳内是 `tauri://localhost`。

### C · 不属于桌面重构（7 条，别混进这条线的分母）

#35 #37 #45 #47 #49 #51 #55 全部是**审核中台 / Clearance** 那条线（approve 判据、判定粒度、sidecar 自愈、色板映射层口径、自动结案语义、第二批对照标注）。它们与 S13 无依赖关系，只是记在同一张任务表上。

## 5 · 禁区与纪律（踩过或差点踩过的）

1. **两个 backend 文件永不卷入提交**：`backend/uv.lock`、`backend/app/domains/llm/providers/__init__.py`。`git status` 里长期显示 ` M` 是**预期状态**，不是待办。只用显式 `git add <路径>`，禁止 `-A` / `.`，禁止把 `git add` 的 stderr 吞掉。
2. **`Clearance/` 未纳管**且位于工作区根，自带 git 目录与 `.env`：不提交、不读那个 `.env`、不删、不改 `.gitignore` 里关于它的行——那是你的决定。
3. **推送纪律**：不 force-push，不动已发布的 tag，推标签必须显式 `git push origin desktop <tag>`；`--follow-tags` 会连带把历史遗留标签推上远端。
4. **两条不变量**（Phase 13 的硬刹车）：① 先替代后删除——能力没被本地顶替前不许摘入口；② 验收基线最后搬家——`e2e` 的 `webServer` 会起 uvicorn:8000，删后端是在启动阶段打掉整条基线，不是让几条变红。
5. **三条 e2e 命令共用 `.e2e-lock`**（`e2e` / `e2e:desktop` / `e2e:ui`）：同一棵树不许并跑两套，被拦就排队，别删锁文件。上一轮那三次「15 分钟幻影挂起」最后证明是我自己并跑导致的，与代码无关。
6. **取本地 Provider 必须走 `getStorageProvider()`**（memo 住的那颗）。绕过它去 `createStorageProvider()` 的调用点在测试宿主里会落进 Tauri 支炸掉剪辑台，历史上这是同一个根因的第三次。
7. **判据纪律**（这一路最贵的几条）：变异要拿走**能力本身**而不是拿走对结果的处理，且必须**见过红**；写入判据要换页真回读，不许拿 toast 当判据（toast 当完成屏障合法、当判据不合法）；`toHaveCount(0)` 必须配同页正控，否则页面没渲染也是 0；断言可访问名用 `role + exact name`，Playwright 默认子串匹配会撞名。
8. **文档不许替门禁代言**：改了门禁必须同轮改 README 的脚本表**和** `pnpm gates` 那一行总链，注释里的基线数字要在改完后重取（这一轮就抓到两处旧的）。

## 6 · 门禁各自的漏检（不是它们管不到，是明确没做）

- `check:dispatch`：证据取自「分派判定之后到函数末尾」，所以「本地分支是空桩 + 同一函数的云端分支真调 provider」这种混合形状仍会过；要收紧得先做块级配对。
- `check:labels`：文本级判据——只确认同文件里出现过指到该 id 的 `aria-labelledby`，不校验它是否真在祖先链上，也不认跨文件引用（那种会被误判成假分组）。它量形状，不量「读屏真的念得出」；后者靠 E17/E25/E27/E30/E31/E32 的 exact 可访问名判据。
- 桌面壳在 CI 上是**零信号**（S13-5 的后半，未做是因为我看不到远端 CI，不写看不见的配置）。

## 7 · 建议的接手顺序

1. 先给 **S13-3** 与 **#68** 两个词——它们能顺掉 #65 的豁免、决定摘除面要不要开工。
2. 再定 **S13-6/S13-7 的基线搬家走法**，那之后 1030 + 955 行的摘除才有验收网。
3. B 档那三条（#16 #27 #31）排一次真机时段，一次能点完。
4. C 档从中台那条线单独排期，不要挂在这份重构的分母上。
