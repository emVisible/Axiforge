# ADR-029：桌面是唯一构建与发布目标，web 端与第二套数据通路退场

- 状态：已采纳（决策由用户作出，2026-09-24 起在 `desktop` 分支执行；本 ADR 于 2026-09-29 补记）
- 关联：ADR-024（桌面优先战略）、ADR-008（Narrative IR + Story Compiler）、ADR-016/027（AXS 文本真相源与单一语法权威）、ADR-026（素材本地化与 `.axsp` v2）
- 逐功能去留：[WEB_FEATURE_DISPOSITION](../WEB_FEATURE_DISPOSITION.md)；恢复锚点：[WEB_SUNSET_RESTORE](../WEB_SUNSET_RESTORE.md)（历史标签 `web-archive-20260926`）

## 背景

ADR-024 定的是「桌面优先 + Local-First」，但它没有回答一个问题：**浏览器形态要留多久**。
实际推进时这个含糊变成了成本：

1. `StorageProvider` 有三套实现（Memory / SQLite / HTTP），每加一个能力都要重新问一次
   「桌面这条接了没有」，而回答经常是「没接」——数据通路有两条，功能就长在通路上，不是长在能力上。
2. 同一个缺陷在 2026-09 一个月内复发五次，形状完全一致：**一个域的 get/list/create/update/delete
   五支各自选路，只把读的那支接到本地 Provider**，写的那支留在 `projectApi`/`characterApi` 上，
   再被 `catch {}` 或 `catch { console.error }` 演成「点了没反应」（计数用命令复现：见 S13-2 各刀的提交）。
   五次分别落在：`fetchCodex`（跨作品记忆在桌面恒为空，`10e04d9`）、资产详情页的
   update/delete（清单页已本地化、保存写进够不到的后端，`2026-09-27`）、
   编排台的道具引用（写进去下次刷新凭空消失，`8838218`）、
   **工程域的创建与删除**（桌面首屏 `/studio/projects` 就是这一页，点「新建剧本」发给
   一个不存在的服务端，`eef97ff`）、角色设定的导出与复制（正文本来就在本地渲染，
   却被一句打不到的 POST 整段带走，`cafe63c`）。
3. 两个 Story Compiler（Python 与 TS）为「同一份数据、两种结果」提供了舞台：
   金样本只能证明当前三个示范作两边一致，证明不了每条分支两边都走。
   `sceneRef` 兜底缺失就是被抓出来的第二条真实分叉（舞台库导入的舞台在网页试玩有背景、
   桌面试玩是空白），而金样本对 `items` 至今是 0 覆盖。

## 决策

1. **`apps/desktop` 是唯一构建与发布目标。** `apps/web` 继续存在，但身份从「产品」改为
   「Tauri renderer + 测试宿主」；发布产物只有 `.app` / `.dmg`。
   `apps/admin`（运营中台）不在此列——它是内部工具，不在用户交付面上。
2. **web 创作端浏览器形态退场**，退场前置条件是验收基线先搬家（S13-5）：当前 36 条 e2e（2026-09-29 实测）与 CI
   必须先有桌面侧新家，才允许把浏览器 run mode 降级为纯测试宿主。
3. **后端转为可选协作服务，最终移除**（S13-6）。移除前必核三处依赖：随包 `.axsp` 的播种链路、
   `seed_showcase` 的三份示范作、`docs/user` 与 README 里指向服务端的段落——桌面分支都不受影响。
4. **一个功能只有一条数据通路**（S13-7）：删 `httpStorageProvider` / `httpDomains` /
   各适配层的云端字段映射 / `isTauriEnvironment()` 的另一半。此后不再存在「桌面这条接了没有」这个问题。
5. **TS 内核是唯一运行时真相源**（承 ADR-027）：Python 的 `StoryCompiler` 随 web 一起退场。
   在此之前双端一致性由金样本 + 分支用例守着，且新增分支必须两边各有一条用例，
   不接受「fixture 没覆盖 = 行为没实现」。
  这条纪律在 2026-09-29 第一次付账：补上第四份金样本（`【对照】分支兜底`，专挑示范作零覆盖的分支）
  之后立刻抓出 `codexScope` 在重复选角时两端不一致（Python 给重复项、TS 给去重项），按本决策把 Python 收紧；
  同批补上桌面投影的端到端对照用例，两处已知漂移改为**在册断言**（补好就会红，而不是漂移只活在散文里）。
6. **云端本质功能判死并三段摘除**（S13-3）：`comments`、`report`、`identity`、
   多用户鉴权与用户档案、`tags`、`discover` 发布与发现、`relations` 关系图、
   `versions` 角色版本历史、跨设备同步。摘除 = UI 入口 + api 模块 + 后端路由一起走，
   不留「点进去报网络错误」的残口。缺席的域要显式缺席（`deployment.ts` 的约定：
   入口要么隐藏，要么给可读说明；错误态不得演成空态）。

## 代价（都是实测，不是预估）

- **本地化不是免费的**：S13-2 的六刀（2a/2b/2c/2d/2e/2f）全部是「契约 + 三实现 + 迁移 + 用例」四件同批，
  每刀都伴一次 G1 行数清偿（`PlayerPage` 1393→1331、`CharacterDetailPage` 735→702）。
- **可测面有硬上限**：E14/E15 注入的 `__TAURI_INTERNALS__` 只骗得过 `isTauriEnvironment()` 的判定，
  骗不过 Rust 连接。为此在 DEV 加了 `?storage=memory` 内存库宿主，才第一次能断言点击路径
  （E17 新建→删除、E18 桌面不给云端入口）；生产构建里这段是死代码（构建后 grep `get("storage")` 0 命中）。
  仍测不到的部分：任何走 Tauri dialog/fs 的落盘动作、壳内像素、真壳里的 `tauri://localhost` 来源。
- **桌面壳在 CI 上零信号**：`pnpm check:desktop` 刻意不进 `gates`（没有 Rust 工具链的人连门禁都跑不动），
  而 CI 里没有任何 desktop job。补这道需要 Linux 的 webkit2gtk 依赖或 macOS runner，
  在未于远端真跑过一次之前不声称有效。
- **随包示范作没有干净的重建路径**：在脚本里另写一份元数据去填包等于造第二个真相源，
  正确路径要复用后端的权威定义与产品自身的导出器。
- **放弃的能力要如实记账**：跨设备同步、公开发现、评论、关系图、版本历史随 web 一起退场；
  跨作品 Codex 目前在桌面是「如实说出来地缺席」（`skipped-offline`），不是被悄悄丢掉。

## 退出顺序与门禁

S13-3 判死清单 → S13-4 AI 通路落到 TS provider → S13-5 验收基线搬家（内存宿主已交付）→
S13-6 后端退场 → S13-7 分支消解 → 修订战略文档与本 ADR 的后效。
**验收**：`grep -rn "/api/v1" apps/web/src` 只剩测试宿主所需或为 0；桌面是唯一构建与发布目标；
`pnpm gates` 与新基线全绿；`backend/` 已不存在且桌面功能无回归。

## 未决（需要产品判断，不由工程单方面定）

1. S13-3 的判死清单是否整体成立，还是其中某几项（例如 `versions` 版本历史）要落本地替身。
2. `nexus` 的 `sendToInbox` 与 `aiApi.suggestCharacter` 两条真实云调用：判死还是本地化。
3. 术语表三档：接（补 UI + 本地列 + 容器字段 + 重生成示范包）/ 判死删组件 / 维持现状。
   实测随包 `showcase-*.axsp` 的 `project.json` 里没有 `playMeta`，缺的是写入侧而不是投影侧。
4. dev 库 `axiforge.projects` 的 2638 条测试残留要不要清（清理是删数据，须先 dump 再 restore 比行数）。
5. 是否为桌面壳补一道 CI job（`cargo check`）。
