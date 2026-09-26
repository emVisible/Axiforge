# web 功能 → 桌面 的去留清单

> 2026-09-26 · 服务于「去掉 web、只保留桌面端」。这份文件回答一个问题：
> **每一条云端能力，桌面上现在是「已本地化」「按缺席处理」还是「仍然直连 HTTP、删掉后端就坏」。**
> 恢复锚点见 [WEB_SUNSET_RESTORE](./WEB_SUNSET_RESTORE.md)。

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
| `stories`（角色传记） | 5 个页面/组件 | **正文读写 100% 走 HTTP**，无本地实现 | **C** |
| `search` | OutlinerPanel、GlobalSearch | 编排台「从舞台库导入 / 搜索道具」仍 `searchApi.*`，而本地资产池早已存在 | **C** |
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
   建议：把 `EntitySearchSelect` 的 `fetcher` 换成分派口（本地走 `p.listItems/listScenes` + `filterByVisibility`，
   浏览器保持 `searchApi`）。同一条改动能顺手把 `nexus`、`ai` 两处待核项一起定掉。

3. **`player` / `PromptExport` 等待核项**。
   它们的共同点是"有真实数据时才挂载"，E14/E15 结构上测不到。**先把可测性补上**（给编辑器数据链路开注入点、
   在测试里注入 sql.js 内存库），再逐条判定——否则我们是在猜它们没问题。

## 需要人类逐行定的（云本质，无法"同步"）

`versions` 版本历史与协作回写、`comments`、`report`/内容治理、`identity`+`user` 多用户鉴权、
`discover` 发布与发现、`relations` 关系图、`search` 的**全局**（非资产池）检索、跨设备同步。
每一行只有三种处置：**本地化重定义语义 / 明确判死并从产品里摘掉 / 保留后端只为它**。
默认建议按此排序，但删与不删是产品决定，不是技术推定。
