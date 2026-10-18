# web 功能 → 桌面 的去留清单

> 2026-09-26 · 服务于「去掉 web、只保留桌面端」。这份文件回答一个问题：
> **每一条云端能力，桌面上现在是「已本地化」「按缺席处理」还是「仍然直连 HTTP、删掉后端就坏」。**
> 恢复锚点见 [WEB_SUNSET_RESTORE](../WEB_SUNSET_RESTORE.md)。

## 方法与它的限度（先说清，免得把噪声当结论）

取证脚本：`node scripts/desktop-disposition-inventory.mjs`。扫描面 = `apps/web/src/**/*.ts(x)`（排除 `*.test.ts`），
单趟解析 `@/shared/api/X`、`../api/X`、`./api/X` 三种导入写法。

分类靠**文件级**启发式判"有没有本地判据"（`isLocalOnlyDeployment` / `isTauriEnvironment` / 引 `shared/storage` 分派口）。
它有三个已知限度，逐条人工核对过：

- **假阳**：`httpDomains.ts` 本身就是 L4 契约的 HTTP 实现、`draftDispatch.ts` 就是分派口，它们"无判据"是定义如此。
- **看不见页面级缺席**：`discover/**` 十几个文件无判据，但 `DiscoverPage` 在 `isLocalOnlyDeployment()` 时**在任何查询之前**直接 return 缺席说明——E14 实测 `/discover` 零 `/api/v1`，证明这些文件在桌面根本不被挂载。
- **看不见"有数据才挂载"的组件**：E14/E15 用的是不存在的 id，页面早早 bail。真项目下的组件（下表 C 类三条中的两条就是这么来的）**测不到**，这是当前验收的真实盲区。

## 分类

`A` 已本地化（走 L4 契约 + 分派口）· `B` 云本质，桌面按缺席处理 · `C` **桌面可达但仍打云端 = 缺口** · `D` 判据噪声，无需处理

| 云端模块 | 消费者 | 桌面现状 | 类 |
|---|---|---|---|
| `stories`（角色传记） | 5 个页面/组件 | **S13-1 已本地化 2026-09-26**：进 L4 契约 + SQLite schema v4 `character_stories`，`useStories` 改走 `storySaves` 分派口 | **A** |
| `search` | OutlinerPanel、GlobalSearch | **舞台侧已本地化（S13-2b 2026-09-26）**：`searchImportScenes` 桌面走本地池、导入通路两端字段口径已对齐。**道具侧已本地化（S13-2c 2026-09-29）**：`project_asset_refs` 随 schema v5 建表、读写与 `searchImportItems` 同批接通，`OutlinerPanel` 不再打 `/search/items`。`GlobalSearch` 是云语义（搜别人的作品），按 B 处理 | **C→已修** |
| `llm` | LlmStatusBadge | 桌面每次开编辑器发一次必败 `/llm/health`，且把"没问到"渲染成"已降级" | **C→已修** |
| `editor`（道具/场景/工程） | 19 处 | 主链路已分派；本轮修好 `ItemDetailPage`、`useProjectDirectory`、`useProjectOutliner` 三处绕开 `readItem()` 的直连 | **C→已修** |
| `creator`（创作数据面板） | 6 处 | `/studio/dashboard` 直达路由仍起查询；判据已下沉到 hook 的 `enabled` | **C→已修** |
| `user`（会话/资料） | UserContext、identityLink | 全局 `UserProvider` 每次挂载打必败 `/users/session`，失败被 `catch` 静默吞；已改为本地不发 | **C→已修** |
| `player`（试玩） | SaveSlotPanel、usePlayer | 存档/成就主链路走 `playerSaves` 分派；这两处**是否仍有直连待核**（见下） | C? 待核 |
| `nexus` / `ai`（建档建议） | OutlinerPanel、CreateCharacterPage | 待核：是否在有数据时才挂载 | C? 待核 |
| `characters` | 8 处 | 列表/详情已分派；`PromptExport` 待核 | A + C? |
| `versions`（版本历史） | VersionPanel | 云本质；角色详情页有 `localOnly` 判据，**触发按钮是否全受控待逐 tab 核对** | B（待复核） |
| `comments` / `tags` / `report` / `identity` / `relations` | 各 1 hook | 消费者全在 discover 或云语义位置，页面级缺席挡住 | B |
| `ginkgo` / `httpDomains` / `draftDispatch` / `client` | — | 实现体本身 / 分派口 | D |

## 三条 C 类缺口的建议（含"为什么不是隐藏入口就行"）

1. **角色传记（`stories`）——最大的一块，且是本轮自己暴露的**。
   我今天刚把「传记 → AXS」的转换接上本地内核，然后发现**传记正文在桌面根本读不出来**：
   `useStories` / `useStory` / 更新与新建全部无条件走 `storyApi`，涉及 `StoryEditPage`、`StoryReadPage`、
   `StoryList`、`CreateStoryDialog`、`StageSwimlanes` 五个文件。转换器本地化了、数据源没本地化，等于半条腿。
   建议：进 L4 契约（`listStories/getStory/saveStory/deleteStory`，挂在角色之下），SQLite 加 `character_stories` 表，
   复用 `assetRecords`/`httpDomains` 那套"一份契约两个实现 + 契约套件同源自证"的既有形状。
   **这不是"隐藏入口"能交差的**——传记是创作主数据，不是云端社交功能。

2. **编排台的资产导入/搜索（`search`）**。
   本地资产池（道具/场景）v0.8 就建好了，"从池子里挑一个道具挂进这一拍"在桌面是**有意义且应该可用**的操作。
   ~~建议：把 `EntitySearchSelect` 的 `fetcher` 换成分派口~~ —— **这条建议在 S13-2a 实测中被推翻，别再照做**：
   只换 `fetcher` 得到的是"搜得到候选、点下去必败"，比原来"输入即永久转圈"并不更好。真正的阻塞在**导入的落点**：
   本地 `project_scenes` 只有 `(id,project_id,title,sort_order)`，`location/atmosphere/scene_ref_id` 无处存也读不回，
   而道具引用的 `project_asset_refs` 表压根不存在（bundle 读回恒为 `asset_refs: []`）。
   顺序必须是：**补列/建表 → 打通读路径 → 改写入调用 → 最后才换 fetcher**。已按此拆成宪章 S13-2b / S13-2c。
   S13-2c 于 2026-09-29 按同序收口，并顺带把两端真正对齐：后端 `remove_asset_ref` 此前只按 `ref_id` 删、丢掉路径里的 `project_id`，
   `add_asset_ref` 不校验工程是否存在（实测顶出 FK 500）；本地契约要求跨工程删不动、无主工程 404，故改的是服务端。
   顺带一处反直觉的收获：编排台的角色加入/移出**根本不用写本地实现**——L4 契约里 `addRole/removeRole`
   两端早就齐了，缺的只是调用方绕开了 provider。本地化有时只是改一行调用。

3. **`player` / `PromptExport` 等待核项**。
   它们的共同点是"有真实数据时才挂载"，E14/E15 结构上测不到。**先把可测性补上**（给编辑器数据链路开注入点、
   在测试里注入 sql.js 内存库），再逐条判定——否则我们是在猜它们没问题。

## 已定案（2026-09-26）：只要桌面端

人类决议「我只要桌面端的」。本文件上面那张表因此从"待决清单"变成**执行依据**，逐行处置已写入宪章
[REFACTOR](../REFACTOR.md) 的 Phase 13（S13-1…S13-8），此处只保留结论口径：

- **C 类里属于创作主数据的 → 本地化**，不给"隐藏入口"这条退路：`stories`（传记正文）、资产池检索/导入（`search` 在编排台那一处）、AI 建档建议。
- **B 类里属于多人语义的 → 判死并摘除**，UI 入口、api 模块、后端路由三段一起走：`comments`、`report`、`identity`、`user` 档案与鉴权、`tags`、`discover` 发布与发现、`relations`、`versions`、跨设备同步。留半截就是留"点进去报网络错误"的残口。
- **`llm` / `ai` 不是云功能**：模型接入落到 TS provider 直连本机 Ollama 与兼容 API，Python provider 链随 `backend/` 一起退场；离线由 TS 规则引擎兜底（v1.0「演绎内核」已把内核与规则通路搬到 TS，正是为此铺的路）。

**两件必须先于删除成立的事**：一是验收基线搬家——13 条 e2e 与 CI 现在跑在浏览器态，它是这一路唯一的回归安全网，浏览器 run mode 在基线重建之前只是**测试宿主**，不是产品；二是 `apps/web` 删不掉，它就是桌面渲染层。
