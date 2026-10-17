# Axiforge

**桌面互动叙事创作器**：用 AXS 编写剧本，在剪辑视图编排演出、在结构视图检查分支，并即时预览。三种视图编辑同一份叙事工程；作品以 `.axsp` 文件本地保存与交付。

桌面应用是唯一默认产品入口（Tauri + 本地 SQLite + 本地素材）。`apps/web` 是桌面 renderer 与测试宿主；Admin、Nexus 和 API 是显式启动的内部/迁移工具，不属于桌面创作主流程。

> 用户文档（含桌面版与 AXS 语法）：开发时访问 http://localhost:5174/docs ，源码在 `docs/user/`。

## Quick start

**桌面开发依赖：** Node 18+、pnpm、Rust stable，以及 macOS Xcode Command Line Tools。

```bash
pnpm install
pnpm dev      # 启动 Axiforge 桌面应用；Tauri 自动启动 renderer
```

需要调试旧多服务栈时，额外安装 Python 3.11+、uv、PostgreSQL 14+（或 Docker），再显式运行：

```bash
pnpm dev:stack
# 或 ./dev.bash all（tmux）
```

开发时用户文档可访问 http://localhost:5174/docs，源码在 `docs/user/`。

## Scripts

| 命令 | 说明 |
|------|------|
| `pnpm dev` | 默认启动 Axiforge Tauri 桌面应用 |
| `./dev.bash` | tmux 启动桌面应用（`./dev.bash stop` 停止） |
| `pnpm dev:desktop` | 起 Tauri 壳（自动拉起 renderer）；DEV 下会跑壳内存储冒烟 |
| `pnpm dev:stack` / `./dev.bash all` | 显式启动旧 API + Web + Admin + Nexus 调试栈 |
| `pnpm dev:web` / `dev:admin` / `dev:nexus` / `dev:api` | 单独启动内部服务/测试宿主 |
| `pnpm build` | 构建 macOS 桌面应用 `.app` |
| `pnpm build:desktop` | `pnpm build` 的显式别名 |
| `pnpm build:dmg` | 额外打包 `.dmg` 安装盘 |
| `pnpm build:web` / `pnpm build:admin` | 单独构建 renderer / 内部 Admin |
| `pnpm gates` | **一条命令跑完前端门禁（当前 15 道，条数以 `package.json` 的 `gates` 脚本为准，不在这里数）**：`typecheck → test:unit → coverage → lint → check:purity → check:circular → check:size → check:labels → check:dispatch → check:citations → check:publish → check:seams → check:dead-surface → check:contrast → check:ui-source`（2026-10-09 从脚本原文抄出，抄早了就会说谎）。覆盖：tsc、五个包的 vitest、覆盖率阈值（G2：`core` 与 `editor-core` 行+分支 ≥90%）、oxlint+颜色令牌、内核纯净度、循环依赖、行数棘轮、表单标签关联、分派口本地分支、文档引用对账、发布目标棘轮、桌面接缝棘轮、死表面棘轮、双主题对比度、共享组件源扫描 |
| `pnpm typecheck` / `test:unit` / `coverage` / `lint` | 上述门禁的分项 |
| `pnpm check:purity` | 断言 `core`/`axs`/`editor-core` 零 React/DOM/网络/平台依赖 |
| `pnpm check:circular` | dpdm 循环依赖 = 0 |
| `pnpm check:labels` | 表单标签的编程关联棘轮：扫 `apps/web` / `apps/admin` / `packages/ui` 三个界面层（门禁自报：2026-10-09 扫描 **205** 个文件、裸标签 0、基线 0），`htmlFor` / 命名分组（id 须真被 `aria-labelledby` 引用）/ 包裹型之外新增一处即失败（具名豁免在 `scripts/label-association-baseline.json`） |
| `pnpm check:dispatch` | 分派口（`shared/storage/*Saves.ts`）里每个导出 async 函数都必须有本地分支——桌面唯一化后，"只走云端"的新函数就是给桌面留一个静默失败的入口。合法三档：本地那一支真 `await provider`、经兄弟分派口间接走、或带显式 `skipped-offline` 标记；正向 `if (isLocal()) {…}` 的证据只认它自己那个块（"本地空桩 + 块外真调"会红）。**两张面**（2026-10-09 扩）：`shared/storage/` 那族之外，`shared/api/draftDispatch.ts` 也在做本地/云端分派却按命名约定落在面外——本地证据因此多认两种形状：`await 注入的本地能力(…)`（AI 草稿族不走 Provider）与"退回规则保底"，而 **`remote` 被显式排除**（本地窗口里出现云端调用不算证据）。门禁自报：6 个文件（storage 5 + api 1）、导出 async 函数 **32** 个、形状 `after-guard=26 / positive-block=6`。牙齿两条各验过：把本地支改成只 `await draftDeps.remote(` ⇒ FAIL 点名两个函数；面二那个文件消失/改名 ⇒ 报"这张面正在静默消失"并 FAIL（面不会悄悄缩回一半）|
| `pnpm check:publish` | 发布目标棘轮（ADR-029：桌面是唯一构建与发布目标）。命中两族形状：仓根的部署声明文件（vercel / netlify / docker-compose / Dockerfile / railway / fly）与 CI 里那行 `pnpm build:web && pnpm build:admin`。当前 **4 条残差具名登记在 `scripts/publish-target-baseline.json`**——它不判「这些该不该删」（那要产品定档，见 `docs/HANDOFF.md` §6 第②条），只保证**不会悄悄多出第五件**；删掉一件须重跑 `node scripts/check-publish-target.mjs --update` 让基线缩短。牙齿验过：临时放一个 `netlify.toml` ⇒ FAIL 并点名，删掉 ⇒ OK |
| `pnpm check:seams` | 桌面接缝判据棘轮（第 14 道）。命中一条机械特征：**引用了 Tauri / Electron 包，或直接读壳的全局句柄（`__TAURI_INTERNALS__`、`contextBridge`、`ipcRenderer`）的模块只在壳里跑到**；形状匹配只吃剥掉注释后的代码，而壳零 CI 信号、契约套件只跑 Memory/sql.js。三层判据——该模块要有同名测试文件；那个测试**必须真的 import 被测模块**（否则加个空测试就能骗过第一层）；那个测试**必须真下了断言**（数 `expect(...)` / `assert(...)`，先剥注释行，`expect(true)` 这类恒真断言另成一档）。扫描面是 `apps/` + `packages/`（2026-10-01 全仓普查 416 个源文件：`packages/*` 命中 0，但探针验过它会被抓住）。当前 9 个接缝：6 个有判据（真断言合计 **99**，2026-10-09 由门禁自己打印）、3 个具名登记在 `scripts/desktop-seam-baseline.json`（`desktopSmoke.ts` + `apps/nexus/electron/` 那两个，各自写着为什么不补的理由，补上后本表应变短） |
| `pnpm check:citations` | 文档引用对账：`docs/**` 与两份根文档里写的 `路径:行号` 必须**文件存在且行号落在范围内**（条数以门禁自己打印的为准：2026-10-09 16:46 复扫 47 个文档、已判定 **243** 条、越界 5 全部在历史基线内）。今天三次按域外提把 `parse.ts` 从 600 行压到 331 行，文档里的旧坐标会指到文件外面——历史日志类引用冻结在 `scripts/doc-citation-baseline.json`（**5 条**在册，门禁打印数；清偿后应缩短），现状类 9 条已改到真实落点。自报限度：不判"那一行内容是否仍是当初那段代码"；同名/歧义路径与省略号写法跳过，但**各档计数打出来**（歧义 18、省略号 1、只落在被跳目录 4，2026-10-09 16:46 复扫），否则判据退化就是沉默放行 |
| `pnpm check:dead-surface` | 死表面棘轮（第 15 道）。从**真入口** `apps/web/src/main.tsx` 走 import 闭包，闭包外的 `.ts/.tsx` 模块必须逐条在册（基线 `scripts/dead-surface-baseline.json`，10 条）。只用**闭包档**不用名字档：名字判据会被同名本地组件骗过去（实测 `shared/components/ItemCard.tsx` 已死而 `ItemsPage` 里有个同名本地 `function ItemCard` 在渲染）。被测试 import 的模块不算死（机制读者在册）；`*.test.tsx?` 自身不进基线。三条腿：新增死模块 ⇒ FAIL 点名；基线里有而实扫已无 ⇒ 提示跑 `--update` 缩短（具名基线不缩短等于没关）；面或闭包异常小 ⇒ `UNRELIABLE` 退出 1，绝不让"图没建起来"伪装成"没有死模块"。模块图与遮蔽口径来自 `scripts/source-graph.mjs`（与 `cloud:callmap` 同一真相源）。2026-10-09 16:37 实测：面 294 个文件、闭包内 245、闭包外 10（含两个零消费者 barrel：`shared/api/index.ts`、`shared/hooks/index.ts`；以及整条试玩云端通路 `shared/hooks/usePlayer.ts`） |解析 `apps/web/src/shared/api/**` 里每个 `xxxApi.method` 对应的 `动词 + 路径模板`，再扫界面侧的调用点，分六档：**死面**（无任何调用点）/ **仅 HTTP 实现侧**（只有 Provider 的 fallback 实现引用它）/ **绕过（无分派口引用）**（有界面调用点，但没有任何 `*Saves`/`assetPool*`/`achievementDefs` 引用这个函数 ⇒ 桌面态真会打到 `/api/v1` 的那一批）/ **已有分派口引用（云端是 fallback）** / **混合** / **调用者已接本地库**。2026-10-09 实测：端点定义 **95** 个（api 文件 19、消费者扫描 253 文件），六档 **11 / 9 / 34 / 27 / 6 / 8**（相加 = 95 才敢用；同一天早先的读数是 12/9/34/26/6/8，差别出在消费者面：把 `shared/api/` 整目录排除会连该层的分派口 `draftDispatch.ts` 一起排掉，`proseToScript` 因而被误报成死面——现已只排除"定义自身 + `client.ts` + barrel"）。跑不成会自己报 `UNRELIABLE` 并退出 1（api 目录读空或解析出 0 个端点）。表末另附一段**资源词元 → 本地表 / L4 契约方法**的并排事实（13 张表 / 39 个契约方法，词元按 `_` / camelCase 切开后**全等**比较，不做子串包含——包含匹配会把 `play` 匹到 `player_achievements`），只给匹配依据、不下结论：所以"匹配不到"只能当线索、"匹配到了"必须回代码核对（活例：`playerApi.getCharacterStates` 命中 `characters` 词元，但它是试玩会话里的角色状态，不是角色记录）。 **2026-10-09 加第二档＝多余的对外出口（导出级）**：模块在闭包内、但某个**具名值导出**零外部读者——直接证据是 `shared/lib/identityLink.ts` 的三个身份绑定导出全仓没人 import，而模块因为 `reportContent` 活着，所以**模块级判据结构性看不见「活着的面包着死的口」**。基线 `scripts/dead-export-baseline.json` 具名在册（实测 24 条／闭包内 245 个模块的 340 个具名值导出），多一条就红并点名。**口径要说准**：这一档说的是**对外暴露面宽了**，不是函数死了（同一符号在本文件内部完全可能还在用——`linkPlayerEmail` 就调 `linkCreatorEmail`）；参考池按**名字**数读者、保留字符串内容、且比导出面宽（含测试／`e2e/`／`scripts/`／admin／packages），所以它刻意**少判死不判死**（把活代码判成死是图判据最坏的方向）。类型与 `default` 导出不参与。四条腿：面或池异常小／对照组不成立／合成自测不成立 ⇒ `UNRELIABLE`；新增 ⇒ `FAIL` 点名；基线不在 ⇒ `UNRELIABLE`。牙（三次变异各见过红）：给活模块加一个没人 import 的导出 ⇒ 点名 `identityLink.ts :: b82ProbeUnused`；从基线删一条在册项 ⇒ 点名那条；把谓词退化成「什么都算有读者」⇒ 自测 2/4 且对照组失败 ⇒ 退出码 1。
「绕过」那 34 条再按**两轴**归成可定档的三态（末段命中才算"该资源自身有承载"，父段命中记"子资源无专属表"；调用者是否全落在 `features/discover/` 下 = 桌面可达性）：**无本地承载 22 / 仅父资源承载 6 / 无承载·仅 Discover 4 / 自身承载·仅 Discover 1 / 自身承载只差分派 1**（相加 = 34）。
最后一段把壳守卫算到**调用点**而不是文件（扫描面 = 绕过 + 混合，避免某条判据分支永远没有样本）：三种形状 S1 同块 / S2 同句 / S3 早退，**2026-10-09 18:15 复量** 40 条 / 53 处调用点 ⇒ 有守卫 **17**（S1=8 / S2=0 / S3=9）/ 无守卫 **36**（这一档在第五十四批认上"闸门别名"之前是 9 / 44）；**只看绕过**：34 条里 **无本地承载 22** / 调用者只在 Discover（桌面不可达）**4**；调用点级「桌面真会打出」= **20 处**、端点级至少一处走得到 = **24** 条（第四十批那句"分母是 29 不是 34"是当时的读数，已被别名版守卫判据顶替）。判据自带两次变异：关掉 S1 ⇒ 有守卫掉到 2，去掉 S3 的直接子语句限制 ⇒ 涨到 11（过度信任的方向）——**这两次是别名版之前的读数，12:47 没重跑，别当现值用**。**「绕过」不等于缺陷**：`comments` / `report` / `discover` 一类本来就是服务端本质——这张表是 S13-3 逐个定性的候选清单，不是待修清单。
最后一段给「死面」补**判死候选的两侧证据**：读者面 = `apps/`+`packages/`+`e2e/`+`scripts/`（448 个文件，匹配跑在剥掉注释与字符串之后的文本上，排除 `shared/api` 自身），后端 = 解析 `backend/app` 107 个 .py 得 148 条路由（`${…}` 与 `{param}` 都当通配段，忽略 `/api/v1` 前缀与查询串）。2026-10-09 实测：12 条死面**前端读者全部为 0**、后端路由 **11 在 / 1 不在**——那"不在"的一条是新登记的缺陷（`projectApi.updateProjectNode` 指向后端没有的 `PUT /editor/projects/{id}/nodes/{nodeId}`）。正对照三条（`characterApi.create/update/listUser` 读者 2/2/3）证明读者匹配器不是恒零；「测试」列恒 0 也做成了机器前提（调用过任何 `xxxApi.method(` 的测试/e2e 文件数 = 0 ⇒ 判死这批不会碰坏任何测试，反面是 api 层在测试层零覆盖）。
第十段量**宿主可达性**：路由表由 `source-graph.mjs` 的 `parseRoutes` 从 `App.tsx` **解析**（含 `<Route index>`、无 path 的布局包裹层、就地返回 `<Navigate>` 的壳组件），再沿 import 闭包走到叶子。**2026-10-09 18:15 复量** 36 处未守卫调用点 ⇒ 宿主不早退（保守上界）**16** / 只在桌面早退页 **12** / 零引用（模块任何导出除 import 外全仓无引用点）**8** / 不在任何路由闭包 **0**；端点级 29 条（有未守卫调用点的）里 **6** 条所有未守卫点桌面都走不到、**23** 条至少一处走得到；判成整页早退的路由页 **8 个**（2026-10-09 18:03 复量；此前这条是 3 个）。
  3→8 不是世界变了，是**判据修好了**：`earlyReturn` 原先只认直接式 `if (isLocalOnlyDeployment())`，而别名式 `if (localOnly)`
  （`const localOnly = isLocalOnlyDeployment()` 之后）的匹配串把 `if (` 一起吃进匹配，"守卫前面 24 字符"那条检查永远落空
  ⇒ **所有别名式整页早退都被漏判**（`guardShape` 在第五十四批修过同一个洞，当时没回头查第十段）。修法：两种形状各测一次，
  判定范围取这条 if 自己的块。**同一批给这一档补上 `宿主[…]` 点名**——档名要求"人工确认早退覆盖这条路径"，以前却不说是哪条路由页在驱动，等于没法执行；
  一点名就露出**仍待查的残点**：`/discover/projects/:id` 还被判"不早退"，而它页面有深度 0 的早退（成因未找到；方向保守——上界虚高不藏缺陷）。
  **同一天 18:15 复量时这些档位动了**（遮蔽器修好后保守上界 20 → **16**、早退档 9 → **12**、端点级 30=6/24 → **29=6/23**、判成整页早退的路由页 8 → **9**），所以这次改的是"工具为什么不认"，不是"谁可达"。**别名版之前的读数**是 44 处 ⇒ **27** / 9 / 8 / 0、端点级 35 = 6 / 29——差的 7 处不是被修好的，是被抽成变量的闸门 `const localOnly = isLocalOnlyDeployment()` 之前认不出来。**这两个数在第四十七批之前是「不在任何路由闭包 12 / 端点级 12 走不到、23 走得到**——差的 6 条不是被修好的，是被 `lazy\(\(\)` 那条严正则藏着的 5 个真路由页（跨行写法认不出），归一成 `lazyImports()` 后现形；限度：import 闭包 ≠ 渲染可达，消费者级条件渲染（`AppHeader` 那种 `showSearch && !isLocalOnlyDeployment() && <GlobalSearch />`）不认，所以计数偏保守——宁可多列、不许藏缺陷。**守卫形状认字面调用，也认"同一文件内由守卫调用直接初始化、且处在布尔位置"的别名**（`if (localOnly)` / `!localOnly` / `&& localOnly` / `enabled: … !localOnly`）：只认字面的时候，discover 那 6 页 effect 首行的真闸门判不出来（待人工复核虚高到 22）；而只认"标识符出现过"又会把 `[id, localOnly]`、`{ localOnly }` 这种搬值当成守卫（藏缺陷），两头各错过一次。另外 S1/S2 的窗口**跳过声明位**（`const 旗标 = is…()` 里那次出现不算判定）——这条是自测当场抓出来的既存宽松。四条形正成对的合成样本现在跑在 `guardShape` 真路径上，判出的形状会连原文一起打印（`S3、S1、null、null`），不通过就退出码 1。
**第十二段**（编号按内容顺序，**打印位置在第十段之后、第十一段之前**，因为它是第十段那批「桌面真会打出」的下钻）：把那些未守卫调用点按**发出去的时机**切成 装载即发 / 点了才发 / 不明——**2026-10-09 18:15 复量 28 处 = 18 / 2 / 8**（不明**不计入**"装载判据已覆盖"），端点级装载类 **16** 个。再用 `LOADFACE=<check:http-inventory 的输出文件> pnpm cloud:callmap` 与普查的实测路径对账：**3 条普查真见过 / 12 条静态说装载会发但没见到**——**这 12 条才是本段真正要逐条看的**（**2026-10-09 已逐条取证定性：12 条全是 A 类，桌面没有一条真会打出**——机制分布：页面级早退主导 7 条（`/characters/public`、`/comments/*/report`、`/tags/`、`/users/profile`、`/users/resolve`、`/users/export`、`/users/account`）／隐藏入口 3 条（relations 那三条，被 `characterTabs.ts` 的 `cloudOnly` 摘栏）／调用者侧闸门 1 条（`/search/all`，`AppHeader.tsx` 那句 `&& !isLocalOnlyDeployment()`）／查询层闸门 1 条（版本回滚，`VersionPanel.tsx` 的 `enabled: !isLocalOnlyDeployment()`）。两条**复合**情形要记住：`/characters/public` 的搜索那条腿靠的是 `isTauriEnvironment()` **分派早退**而不是部署判定，**S13-7 删分派另一半时它会一起消失**；版本回滚是闸门＋隐藏入口双层。此前只靠早退挡着、没有按名判据的「注销账号」与「用邮箱恢复旧账号」已由 **E56** 补成界面级判据（变异证据：把早退改成 `false && …` ⇒ E36+E47+E56 三条一起红，`3 failed / 61 passed`）。**第十二段那 12 条至此逐条都有界面级判据了**：最后那格 `/comments/*/report` 的举报按钮由 **E58** 补上（2026-10-09 18:28）。它难在浏览器那一半必须**真有一条别人写的评论**才点得亮——`CommentRow` 的条件是 `onReport && !isOwner`，列表为空时屏幕上根本没有那颗键，那时候三个 `count 0` 全是空载。所以三条通路一律 `page.route` 就地应答（工程详情 GET、评论列表 GET、举报 POST），**连 POST 也在浏览器里就答完 ⇒ 一个字节都不出这台机器**（本机 :8000 跑着他的 uvicorn，vite 把 `/api` 代理过去；这不是可选项而是前提）。两头变异各见过红：摘掉 `DiscoverProjectDetailPage` 的整页早退 ⇒ 桌面那半红在缺席说明那句（`1 failed / 1 passed`）；摘掉 `DiscoverCommentSection` 里 `onReport` 的接线 ⇒ 浏览器那半红在那颗键（`1 failed / 1 passed`，桌面那半照样绿——它断言的正是缺席）。`/discover?tab=characters` 那条 tags 装载腿已由 **E57** 补成界面级判据：浏览器态逐 tab 断占位符各归各、桌面态四个参数各访一遍都只给那句缺席说明并逐支断零请求）**（别名版之前是 22 = 对上 7 / 没对上 15；再往前 12:15 更正的那版报 18 条，是匹配器先转义再抠 `${...}` 造的假数——带参数的模板一条都换不掉，读起来却完全像结论）（要么那条路在桌面已被页面早退挡住、要么静态把它判高了；该档只看定义形态、不做调用图，所以 `const load = async () => api.x()` 这类会偏判成装载）。三条控制位：一条都没对上就报 ⚠「这一列不能用」（**第一版就是这么抓出来的**：静态端点路径带前导斜杠而普查剥过 `/api/v1`，口径差一位斜杠 ⇒ 假的 `0/22` 看着像结论）、没给文件就报「运行时列缺失」不当 0 用、临时产物**代码一改就得重取**。匹配器另带**五条内建自测**（模板吃到参数／参数不跨段／末段查询可缺席／不把别的端点认进来／无参模板要全等），不过就退出码 1；变异两头都见过红：把转义顺序改回旧错法 ⇒ 两条自测失败 + 退出码 1，改回来 ⇒ 五条全通过 + 0。
**时机档「不明 8」的收口（2026-10-09 19:13）**：那 8 处「静态既没判成装载即发、也没判成点了才发」的调用点已全部有归属——**1 处有按名界面判据**（`reportApi.create` ⇒ `POST /report/`，入口是 discover 卡片溢出菜单里那条 `role="menuitem"`「举报」，由 **E59** 守：浏览器臂喂一张真卡片把菜单点亮并核对 POST 的 body，桌面臂断整页早退＋零 `/api/v1`；两头变异各见过红——摘菜单项⇒浏览器半红、摘页面早退⇒桌面半红），**5 处活在零外部读者的死出口里**（`identityLink.ts` 那三个身份绑定导出，已由 `check:dead-surface` 第二档具名在册），**1 处是分派口的远端支**（`characterApi.export`，桌面先判 `isLocal()`），**1 处已被 E58/E44 守着**。顺带一条口径警告：`SPEC_URLS` 数的是**引号字面量的出现次数**，所以它会随作者的写法习惯移动（E58 用模板串 ⇒ 不动；E59 两条臂各写一次字面量 ⇒ 66→68），**它不是覆盖面证据**；覆盖面的证据是那两档——`没有字面量导航到的路由` 与 `完全没证据的路由`。

第十三段是**调用者侧闸门审计**（2026-10-09 上线，**只读数、第十段的档位一条都没并**——新判据先原样指过去量误报，逐条证据读得通才谈分档）：有些云调用的闸门不在自己文件里，而在**挂载它的那一句**（`AppHeader.tsx:84` 的 `showSearch && !isLocalOnlyDeployment() && <GlobalSearch />`），import 闭包不知道这件事，所以这条永远留在「桌面真会打出」的保守上界里。谓词两条不许压成一个布尔：闸门与挂载之间**必须有 `&&`**、中间**不许出现 `?:}`**。2026-10-09 18:15 复量：有未守卫调用点的 .tsx 组件模块 5 ⇒ 全部门被挡 **1** / 部分 0 / 一处都没带 4（唯一那条就是 E50 钉过的 `GlobalSearch`——如果这里报出七八条，就是谓词太松的信号）。四条合成样本跑的是真实函数 `gateEvidenceBefore`，判到 `[true,false,false,false]`；两头变异都见过红：删掉挂载点的闸门 ⇒ 那一档 1→0 且控制位 `UNRELIABLE` 退出码 1；删掉 `?:}` 那一行 ⇒ 只有补上"&& 后跨三元"这条样本之后才判得出放宽（第一版没有真样本压着它，放宽照样绿）。**限度**：`?:}` 那一支在当前真语料里没有样本（6 个模块的挂载都是路由 `element` 或裸挂载），今天是防御性的、不是分母性的。

第十四段是**判据台账对账**（2026-10-09 上线，真相源 `scripts/desktop-cloud-judgements.json`）：上面那句「第十二段那 12 条已逐条有界面级判据」原本只活在散文里——改一次测试标题、删一条桌面半断言，它第二天就变假话，而下一个人会当它是真的。台账把每条 B 档端点绑到**证据的标题原文**（不用 E 编号：编号会被重组，E20/E29 就是在册的幽灵编号），四条腿各挡一种失效：台账读不出条目（文件缺失／解析失败／空）⇒ `UNRELIABLE` 退出 1；证据文件或标题找不到、同一端点写两遍 ⇒ `FAIL` 点名；B 档多出一条没判据的 ⇒ `FAIL` 点名；`sameEndpoint` 五条合成样本不成立 ⇒ `UNRELIABLE`（**前缀不算覆盖**——`/comments` 挡不住 `/comments/${commentId}/report`，否则一条判据抵掉一整族）。台账多余（端点掉出 B 档）**只打印不判红**：那可能是量法退化而不是判据建成了。**实测限度（用变异取到的，不是推的）**：覆盖腿只在给了 `LOADFACE` 时才跑——没有它，从台账删掉**任意一条**都不会红，只有写死的那条对照组（E58 守的 `/comments/${commentId}/report`）会红；所以这两条红是分工的，要让覆盖腿真跑必须成对取数（先 `pnpm check:http-inventory > /tmp/x.txt`，再 `LOADFACE=/tmp/x.txt pnpm cloud:callmap`）。七次变异都见过红：删 E58 条目（无 LOADFACE ⇒ 控制位红／有 LOADFACE ⇒ 覆盖腿点名）、删另一条 `/tags/`（点名 `/tags/`）、证据标题加一个字母（幽灵证据=1）、同端点写两遍（重复键=1）、谓词放宽成前缀互含（自测红，而此时"没判据=0"是假的——正是自测抓住它）、台账文件改名（台账=0 条且 `UNRELIABLE`）；每次还原后 `diff -q` 对开工前快照。

第十一段是**死表面普查**：从真入口 `main.tsx` 走 import 闭包，2026-10-09 16:47 复量面 294 个 .ts/.tsx ⇒ 闭包内 245 / 闭包外 **10**（只有测试在读的 = 0），两个零消费者 barrel（`shared/api/index.ts`、`shared/hooks/index.ts`）都在里面；另有一档"闭包内但除 import 外全仓零引用"= 2，**只列名不判死**（名字判据会被同名本地组件骗过去，实测 `shared/components/ItemCard.tsx` 死了而 `ItemsPage` 里的同名本地组件活着；闭包判据不受影响）。脚本内置对照组，不成立就 `UNRELIABLE` 退出 1 |
| `pnpm check:http-inventory` | 桌面态 / 浏览器态的云端调用普查（**不进 `gates`**：它需要一个活着的 web 服务）。路由**从 `App.tsx` 解析得出**（`source-graph.mjs` 的 `parseRoutes`，与 `cloud:callmap` 共读一份；2026-10-09 之前是手抄 9 条——手抄的失效方式是**静默少测**，扩到解析出的 25 条当天就量出 7 个桌面云端调用点）。只导航 `kind==="page"` 的叶子，布局与重定向壳不导航（导航壳只会跳到别处，把同一页算两遍）。参数路由一律填 `inventory-probe`：`?storage=memory` 那支**不播种**，所以这里覆盖的是**未命中支**（本地查不到时会不会偷偷发云端），命中支在 `e2e:desktop` 的点击层里。同一份路由表跑两臂——桌面臂注入 `__TAURI_INTERNALS__` **并带 `?storage=memory`**（要的是一个真可读写的本地库；只注入标记会选到 Tauri 支，在 chromium 里必败，那个 0 就是空载装出来的），浏览器臂走 HTTP 支；**浏览器臂是正对照**（它必须 >0，否则桌面臂那个 0 是恒真读数）。所有 `/api/v1/**` 用 `page.route` **abort 在本地**，所以普查只统计「尝试发了几笔」，一笔都不会打到别人起的后端上。四条腿：路由面为空或不再是旧清单的超集 ⇒ UNRELIABLE（解析器自己退化也报警）、路由未挂载 ⇒ UNRELIABLE、浏览器臂为 0 ⇒ UNRELIABLE、桌面臂非 0 ⇒ REGRESSION，四种都是退出码 1。**第五条腿**拿这张解析出的面对账 `e2e/desktop-http.spec.ts`：三张手抄路由表 + 测试里所有 `goto` 字面量 + 所有 `toHaveURL(/…/)` 正则（**这一档必须有**：`/studio/characters/:id/edit` 是被点进去、URL 用正则验的，只扫字面量会把真测过的页报成没测过；而抠正则不能用正则——`[^/]` 里那个未转义的斜杠会截断提取，`try/catch` 再把半条非法正则咽成"0 条命中"）。三档并出、不互相抵账：`没有字面量导航到的路由` / `其中确有正则证据（贴出命中的正则原文）` / **`完全没证据的路由`**——只有最后一档才是欠账，且**只报不判红**（写不写判据是排期决定）；会判红的只有"三张表一条都解析不出来"这种判据消失。2026-10-09 16:00 实测：**`ROUTES=25`（page 25 / 布局 5 / 重定向 5，Route 标签 35）UNMOUNTED=0**、桌面臂 **0 个唯一调用点**、浏览器臂 **20 个**（正对照）、`SPEC_URLS=68`（E47 前 52 → E55 后 64 → E56/E57 后 66 → **E59 后 68**；19:12 实测。注意这数**不是覆盖面**：它数引号字面量的出现次数，E58 用模板串就不进账）、`toHaveURL 正则 33/33`、没有字面量导航到 **1**（有正则证据）**1**、**完全没证据 0** |
| `pnpm check:apibase` | 验收①「`/api/v1` 只剩测试宿主」的候选判据（**刻意不进 `gates`**，等口径定档）。允许位置只有三类：`*.test.*`、注释行、`shared/api/client.ts` 里带 `apiBase` 的那一行；其余算越界调用点，必须为 0。自带防退化：三类命中数全为 0 时它自己报 FAIL（防止字面量被清空后静默恒真）。2026-10-10 实测 `测试 9、注释 1、基址定义 1、越界 0`。同日**扩了只读面**（`apps/admin/src`／`packages`／`e2e` 按同一规则数，但**只报读数不判红**——定档①没说这条规则管不管那些面），并新增两档自报代价：`其中行尾注释 N`（注释判定只认行首）与 `可疑写法 N`（`` `/api/${v}/x` ``、字符串相加、大小写变体这些绕开严格档的写法）。实测 02:26：只读面疑似调用点 3（`adminClient.ts:20`／`ImageUpload.tsx:24`／`e2e/helpers.ts:10`）、行尾注释 0、可疑写法 0、合计 442 个文件 |
| `pnpm check:desktop` | Tauri 壳的 `cargo check`（Rust 侧类型与权限面）。**刻意不进 `pnpm gates`**：gates 只跑 JS，合并进去会让没有 Rust 工具链的人连门禁都跑不动；实测本地 21s（预热 target），冷缓存需拉 Tauri 依赖树 |
| `pnpm e2e` | Playwright 行为基线（独立库 `axiforge_e2e`，自包含起服务）。**同树互斥**：起跑前抢 `.e2e-lock`，已被占用就退出并打印持有者 PID |
| `pnpm e2e:desktop` | 桌面态基线：**只起 vite、不起后端**（`playwright.desktop.config.ts`，后端基线 `baselines` 不在其中）；与 `pnpm e2e` 共用同一把 `.e2e-lock` |
| `pnpm test:api` | 后端集成测试。**跑在 `<DATABASE_URL 库名>_test` 上**（缺库会自动建，需要 CREATE DATABASE 权限），每个会话把表清成空集，开发库零接触——测试造的审核案件带 `raw`，混进 dev 台账会被 `calibrate --from-answers` 当成真标注（ADR-028 D28） |
| `pnpm setup` | 初始化 PostgreSQL 数据库与表 |
| `pnpm db:up` / `db:down` | 启动 / 停止 Docker PostgreSQL |
| `pnpm check:tracked` | **命令面的可复现锁**（现测**红**，故**不进 `gates`**：它红的原因只有"把那 10 个文件提交进去"能解，而那需要人的授权——一条长期红着又无人能修的链等于没有链）。链从 `package.json` 的 `scripts.gates` 解析出来（不写死道数），抽出每个 `node scripts/*.mjs` 的相对 import 闭包与它们读的基线 JSON，逐个查是否已被 git 跟踪。现测：链 15 道，面 19 个文件，**已跟踪 9 ／ 未跟踪 10**（4 道门禁脚本 `check-dead-surface`／`check-desktop-seams`／`check-doc-citations`／`check-publish-target` ＋ 5 份基线 ＋ 共用的 `source-graph.mjs`）⇒ **干净 clone 上 `check:seams`／`check:citations`／`check:publish`／`check:dead-surface` 四道连文件都找不到**，所以此前那句 "gates 0" 说的其实是这台机器。两条空转告警：解析出的道数 < 10 判 `UNRELIABLE`；某脚本有 JSON 字面量却一个文件都没解到也判 `UNRELIABLE`——第一版正是把 `join(root, "scripts/x.json")` 当成脚本目录相对去解，漏了 4 份基线，靠这条逐脚本的腿照出来（对照实验：退回那个写法就报 6 个未跟踪＋4 个可疑脚本，聚合计数看不出来）。**第二档是清单不是判据**：把全部未跟踪路径按目录形状分桶打印（现测 53 项＝单元测试 23 ／ 门禁与普查脚本 10 ／ 生产模块 6 ／ 基线与台账 6 ／ 非本战场 4 ／ 文档 2 ／ 夹具 2 ／ **未归类 0**），让"该 add 什么"不再靠人翻 `git status`；分桶只看路径不看作者（未跟踪归属本就没有干净机械信号）。它自带一条腿：任何路径落不进桶 ⇒ `UNRELIABLE`（对照实验：摘掉"文档"那一桶就报 2 项未归类并响）。**各条腿独立出结论、全部打印**，不写成 else-if 链——写成链，靠后的腿在今天的树上永远走不到，也就永远不知道自己有没有牙。**第三面是编译缺口**（比链闭包更硬）：**已跟踪源码**里的相对 import 若落点存在却没被跟踪就算缺口，现测 **6 个模块／12 处引用**（`packages/axs/src/{condition,edges,instructions}.ts`、`packages/editor-core/src/axsImport.ts`、`apps/web/src/features/studio/components/ChoiceOptionsEditor.tsx`、`scripts/ports.json`）⇒ 干净 clone 上不是少一道门禁，是 `tsc -b`／`vite build` 直接断，连两个 Playwright config 都加载不了。所以**"要让别人也能跑，该 add 什么"的准数是 16 个文件**（链面 10 ⊕ 编译面 6，实测不相交）。这一面自带对照组（`condition.ts` 必须在册、同样被 import 的 `print.ts` 必须不被报），且只认磁盘上真存在的那个**文件**落点——按 `existsSync` 解会把 `./editor` 这类目录名报成缺口（第一、二版分别给出 225／10 个假缺口，改完才是 6）。牙：从候选扩展里摘掉 `.tsx` ⇒ 恰好丢 `ChoiceOptionsEditor.tsx`（6→5、12→11），装回即复原。**第四面是数据文件引用**：fixture／端口表是字符串路径 + `readFileSync`（一半还在 Python 侧），编译面看不见，树干净但测试一跑就炸；它用 `git check-ignore` 单挡掉 Tauri 生成物（`apps/desktop/src-tauri/gen/schemas/*.json` 不在树里是**正确状态**，报出来就成谁都不服的噪声），并把**已跟踪后端代码引用仓外未纳管目录 `Clearance/`** 那 3 处单列一档、明确不计入"该 add"（那些路径本就不该进树，里面还有 `.env`）——它是 `backend/` 退场决策的证据：后端今天必须有隔壁那个目录才跑得起来。**第五面是判据面**（2026-10-10）：未跟踪的 `*.test.ts*` 单列一档并并入并集——它不是"跑不起来"，是**"绿灯但少测"**：现测 **24 个**测试文件未跟踪 ⇒ 干净 clone 的 `test:unit` 会静默少掉同样多条判据，而两边读起来都是全绿（和"门禁脚本自己没跟踪 ⇒ gates 0 只是一机读数"是同一个教训）。同年同日还修了编译面的一处**多对一别名前缀**：`@/` 同时来自 admin／nexus／web 三份 tsconfig，`find()` 取第一条 ⇒ 别名指向的文件被整条面藏住（改"取全部根再试扩展名"之后，编译面 6→**8**，多出来的是 `clipboard.ts` 与 `shellSmokeGate.ts` 两个**生产模块**）。五面合起来的准数因此是：**要让干净 clone 真能跑并能测，需 add 43 个文件**（链面 10 ⊕ 编译面 8 ⊕ 本仓数据面 2 ⊕ 判据面 24，去重后 43；`scripts/ports.json` 等多面共有故小于相加），命令逐条点名打印，不需要谁去翻 `git status` 猜。**补记 2026-10-10 05:00（两笔提交之后：上面这一整行的计数全部成了历史读数）**：`a92b7d5` 把点名的四十三份补进树，`5b9aa6c` 补进两份条件夹具（`compare.json`／`families.json`——它们是在那四十三份进树、变成「已跟踪源码」之后才第一次被数据面看见的，这类"提交暴露自己的二阶缺口"正是它为什么要现跑）。现测 `pnpm check:tracked` 剩 **1** 项，而那一项是判据把 `familySupport.test.ts:20` **注释里**提到的后端同伴测试路径当成了运行时引用——该文件真正 `readFileSync` 的是已进树的 `families.json`，所以这条不是"干净 clone 跑不起来"，而是**文本扫描型判据被自己的注释喂饱**，与"形状匹配只吃剥注释后的代码"是同一口径的欠账；改它会动其它计数，故本轮不改、只登记。**引用这一行里任何一个数之前，先跑命令。** |

**普查的三档新腿（2026-10-10，都是上面那条 `pnpm check:http-inventory` 打印的读数，不是新命令）**：前两档押在**写法**上（`/api/v1` 前缀、主机名），写法是可以绕的，所以补了三档按**行为**数的：① `DESKTOP_BRANCH`／`BRANCH_EVIDENCE`——路由若问过存储工厂，就必须挂在 `memory` 支上，落到 `shell`／`cloud` 直接 `REGRESSION`；没问过工厂的（现测 13/25）只作**覆盖面事实**打印，不判红。② `EXTERNAL_DESKTOP`——`host` 与 `BASE` 不同源的请求数，非 0 即红。③ `DATA_DESKTOP`／`DATA_BROWSER`——按 `resourceType()` 数 `fetch`／`xhr`，URL 写成什么样都数得到；**浏览器臂为 0 时脚本 `UNRELIABLE` 退出 1**，因为那说明探针在空转，此时 `DATA_DESKTOP=0` 不是证据。现测 `DATA_DESKTOP=0 ／ DATA_BROWSER=20`，且 20 与 `BROWSER_UNIQUE=20` 相等 ⇒ 今天的取数面全在 `/api/v1` 前缀下（这是读数不是定理，所以做成会红的腿）。三档**各自见过红**：摘掉桌面臂的壳标记 ⇒ `DATA_DESKTOP=20`＋退出码 1；退回"只给标记、不给本地库" ⇒ 12 条全变 `shell`＋退出码 1；把同源定义改成一个错主机 ⇒ `EXTERNAL_DESKTOP=379`＋退出码 1，三次都还原 `BYTE_IDENTICAL=true`。另：`SPEC_URLS` 现测 **70**（00:44），比 19:12 那次多的 1 是 E48 那条**故意不存在**的哨兵字面量，不是新覆盖。
## Structure

```
packages/
  core/            L0 叙事 IR + 引擎 + TS StoryCompiler（零 UI 依赖）
  axs/             L1 AXS 文本语言 parser/printer（指令级行锚点）
  editor-core/     L2–L4 内核：Draft/Transaction/Journal、投影、StorageProvider、.axsp 容器
  ui/              设计令牌与共享组件（ImageUpload 等）
apps/
  web/             桌面 renderer 与浏览器测试宿主；云端/发现功能按 S13 收敛退场
  desktop/         Tauri v2 壳（本地 SQLite + 本地素材目录 + asset 协议）
  admin/           内部运营工具，不属于桌面创作产品
  nexus/           独立笔记工具，不属于桌面创作产品
backend/
  app/main.py      迁移期 API 与测试宿主（计划按 S13 退场）
  app/domains/     迁移期服务端域；桌面创作不以其运行作为前置
docs/
  HANDOFF.md   桌面化重构的交接快照：当前边界、待决项按谁能推进分档、禁区
  REFACTOR.md  主线执行宪章与阶段计划
  KERNEL_DESIGN.md     L2–L4 内核构建规约
  ADR/                 架构决策记录
  user/                用户文档（开发时见 http://localhost:5174/docs）
```

分层与依赖方向铁律见 `docs/KERNEL_DESIGN.md`；桌面化战略与阶段验收见 `docs/REFACTOR.md`；
**要接手桌面化剩下的工作，先读 `docs/HANDOFF.md`**（它登记边界与待决形状，不替代上面两份）。

## Legacy Web / API Development

PostgreSQL 与 API 仅供旧栈调试、迁移与回归测试使用，不是桌面创作器的运行依赖（`vercel.json` 那条见下方「Legacy Web Deployment」，它当前构建不起来）。相关实现按 `docs/REFACTOR.md` 的 S13 顺序处置。

## Database

开发环境：`pnpm setup` 会执行 `alembic upgrade head` 建表。应用启动时 `init_db()` 作为幂等兜底（`create_all`）。

生产/演进环境：

```bash
cd backend
uv run alembic upgrade head
```

迁移链：

| Revision | 说明 |
|----------|------|
| `20260706_000` | 全量 baseline（19 张表） |
| `20260706_001` | 删除遗留 `asset_characters` / `asset_plugins` |

已有开发库若曾手动跑过 `001`，可执行 `uv run alembic stamp head` 对齐版本号。

## Legacy Web Deployment (Frozen)

根目录还留着 `vercel.json`（tracked，自 v0.1）：它把 `/api`、`/uploads`、`/health` 指向 `backend/src/main.py`，静态与 SPA 路由指向 `apps/web/dist`。

**但它今天构建不起来**：那份配置声明的入口 `backend/src/main.py` 在仓库里不存在（真实入口是 `backend/app/main.py`，`backend/main.py` 只是兼容 shim，2026-09-30 实测）。
是否曾实际连接过 Vercel 项目，本会话看不到远端集成，不作判断。唯一发行目标是桌面应用（ADR-029），
`vercel.json` 的处置（删 / 修入口 / 留作文物）归 S13 那条线，需要人类定档——在那之前**不要按这份配置去部署**。

## Environment

复制 `backend/.env.example` 为 `backend/.env`，按需修改 `DATABASE_URL`。
