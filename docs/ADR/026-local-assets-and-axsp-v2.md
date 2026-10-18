# ADR-026：素材本地化与 `.axsp` v2 容器

**状态**：已采纳
**日期**：2026-09-24
**关联**：[ADR-024](./024-desktop-local-first.md)（决策 3 本地优先存储、决策 4 工程容器）、[ADR-025](./025-axs-peer-dual-view.md)、[KERNEL_DESIGN.md](../KERNEL_DESIGN.md) §2.5、[REFACTOR](../REFACTOR.md) Phase 6、执行件 `BLUEPRINT_v0.7.md`

## 背景

ADR-024 承诺了两件当时未兑现的事：「素材落本地工程目录，DB 仅存相对路径」与「`.axsp` = 叙事 JSON + 素材打包」。2026-09-24 的打包态实测（`tauri build` 出 `.app`，:8000/:5174 均无监听）暴露出桌面端作品**既看不见素材、也送不出去**：

| 事实 | 证据 |
|---|---|
| 素材上传仍打服务端 | `packages/ui/src/components/ImageUpload.tsx` POST `/api/v1/upload`，文件落 `backend/uploads/`，数据里存 `/uploads/<digest>` 绝对路径 |
| 打包态没有同源反代 | `apps/web/src/shared/api/client.ts` 基址是相对路径，代理只存在于 Vite dev；`tauri.conf.json` 无 `assetProtocol`、无 sidecar |
| 壳权限没开二进制读写 | `capabilities/default.json` 只授 `fs:allow-write-text-file` / `read-text-file` |
| 容器不含媒体也不含角色 | `axsp.ts` v0 只存素材引用清单；`ProjectBundle.roles` 只有 `characterRefId`，换机导入后引用指向不存在的角色 |
| 本地库无素材落点 | SQLite schema 仅 6 张表，PG 侧的 `asset_scenes`/`asset_items`/`project_asset_refs` 无对应 |

dev 走查看不到这些问题，因为 Vite 代理与本机后端一直在跑——**代理会替产品撒谎**。

## 决策

1. **素材进 L4 契约**：`StorageProvider` 增 `saveAsset(input) → {ref}` 与 `readAsset(ref) → bytes`。文件系统与摘要算法是平台能力，经 `AssetStore{write,read}` 端口注入（与既有 `SqlBackend` 同构），内核保持零平台依赖；ref→显示 URL 的规则集中在 `storage/assets.ts::resolveAssetUrl` 一处。
2. **落盘约定**：`$HOME/Documents/Axiforge/assets/<sha256>.<ext>`，工程数据与 DB 只存相对 ref。内容寻址带来三个免费性质：同内容天然去重、跨机导入 ref 不变、导出清单与包内路径一一对应。显示走 Tauri asset 协议（`assetProtocol` + `convertFileSrc`），而非把字节读进内存。
3. **`.axsp` v2 = zip**：`manifest.json` + `project.json` + `characters.json` + `assets/<ref>`。zip 内路径直接等于 ref，不需要映射表。v1 文本信封保留**只读**解析并归一化为 v2 束形态。
4. **导入语义**：素材先落盘 → 角色一律**新建**（归属改判接收方、公开位不继承导出者）→ 按新 id 重映射全部引用（`characterId` 直引、条件/效果 `key` 点号前缀、`codexScope`、`roles`）→ 再建工程。导入绝不覆盖接收方已有角色。
5. **云端缺席域在桌面不给入口**：概览、发现、全局搜索、标签/机制筛选、角色版本·关系·传记·Fork·删除，按部署形态一处判定（`shared/lib/deployment.ts`）后隐藏；直接输 URL 进来时给可读说明而非网络错误。
6. **（2026-09-29 S13-2c 追加）道具引用随包走、但不随本体走**：`ProjectBundle` 有了 `assetRefs`，`project.json` 就把工程内的道具引用一起带走；导入按原样重建引用行——`asset_id` 逐字保留，引用行自身的 id 由目标库另分配（把导出者的行 id 抄进别人库里没有意义）。
   容器不装道具本体，跨机导入因此留下悬空引用，编排台显示 `道具 <id前缀>` 并可手动移除。**取舍是"带着悬空"而不是静默丢掉**：导出者明明在这份工程里挂了三件道具，导入后一条都不显示等于替用户改写了他的作品。
   早于 S13-2c 的容器根本没有这个键；缺键由 `axsp.ts::normalizeBundle` 在解包出口一处补 `[]`（v2 与 v1 两个出口共用），不让每个调用方各自兜底。

## 备选与否决

| 备选 | 否决理由 |
|---|---|
| 素材读进内存转 Blob URL | 立绘/背景体积大，内存与生命周期成本随素材数线性上升；而桌面化的动因正是长会话内存（ADR-024 背景） |
| `.axsp` 用 JSON 信封 + base64 内嵌 | 零新依赖，但体积 +33%、大素材内存峰值高；zip 是同类工程容器（.docx/.blend）的通行形态 |
| 在 Provider 之外另建素材服务 | 「素材在哪」出现第二个真相源，违反铁律 4 |
| web 也统一走 Provider | 传输态的 `tags`/`view_count`/`fork_from`/时间戳本地不存在，统一等于给冻结线填假值；故分派放在 hook 层 |
| 播种走 discover 列表 | 实测会把库里历史 `is_public` 测试工程一起灌进新用户首启；改以播种端点自身返回的清单为唯一来源 |

## 后果

- ✅ ADR-024 决策 3/4 兑现；桌面作品首次可以「带着立绘交给别人并在另一台机器打开」
- ✅ 全新环境首启有内容：示范作以 `.axsp` v2 随前端资源分发，空库自动导入一次（播种与分发共用同一机制，不新增"种子数据"概念）
- ⚠️ 本地 schema 欠账显性化：`projects` 缺 `description`/`theme_tags`/`mechanism` 等列，`asset_items`/`asset_scenes` 未落地 → 桌面卡片一律「暂无描述」、道具与场景页离线不可用。适配层填**空值而非编造**，差额登记为 Phase 7
- ⚠️ 攻击面扩大：二进制文件写权限 + asset 协议可读本地文件，二者都限定在 `$HOME/Documents/Axiforge` scope 内；Tauri fs scope 默认不匹配隐藏文件（实测 `.seeded` 被拒），标记文件因此必须非点开头
- ⚠️ 摘要依赖 `crypto.subtle`；非安全上下文退化为 FNV 内容键，仅用于去重不承担安全语义（代码内已写明）
- ⚠️ 验收边界：Playwright 驱动不了 WKWebView，壳内素材链路以 DEV 冒烟（`img.onload` 断言 + 落盘可 grep）+ 打包手动走查双轨证明，不假装能全自动化

## 补记（2026-10-01）：上面「非安全上下文退化为 FNV 内容键」那条已撤销

历史行原样保留（不改写已发布的决策记录），这里是撤销它的那条改判。

- **改判依据是两条在册契约相撞，不是观感**：`contentKey` 在 `packages/editor-core/src/storage/assets.ts` 的自己的注释里写明
  「仅供内存实现与测试做同内容去重；桌面/服务端落盘用 sha256」；而本 ADR 要兑现的用户承诺是
  「素材文件名是它内容的 SHA-256 摘要……工程包在别的电脑上打开时能认得同一个文件」（见 `docs/user/desktop/desktop-and-axsp.md`）。
  用 FNV 落盘的文件名在另一台电脑上算不出来 ⇒ 同一张图存两份、包的可携带性失效，**而写入照样返回成功**——静默失效，不是降级。
  原行那句「代码内已写明（须留痕）」也不实：实现里没有任何留痕。
- **现在的行为**：`contentDigest` 缺 `crypto.subtle` 就抛；`TauriAssetStore.write` 把这次抛收成语义明确的
  `err(io, 「素材摘要不可用（缺 SHA-256），已拒绝落盘」)`，**一个字节都不写盘**。上传在这种环境里会失败并可读地失败。
- **首批判据**（此前这个生产模块零判据；契约套件只跑 Memory/sql.js）：`apps/web/src/shared/storage/tauriAssetStore.test.ts` 共 7 条——
  已知向量钉死 ref 就是 SHA-256（`sha256("abc")`）、无 subtle 时不降级且 `writeFile` 一次都不发、同内容第二次写不重复落盘、
  空字节直接 io、外部 URL 形态的 ref 不去拼路径、文件缺席给 not_found 而读失败给 io。
- **牙＝三次成对变异**：恢复兜底 ⇒ 1 红；把摘要换成非加密键 ⇒ 2 红（向量条 + ref 形状条）；去掉 `exists` 守卫 ⇒ 1 红（幂等条）。全部还原后 7 passed。
- **留给用户的替代修法**（我选了 fail-closed，这一条是可退的）：若优先级其实是「任何环境都得能存」，那么应保留兜底但**把降级显性化**——
  给非加密键加可见标记（例如 ref 前缀）并一次性告警。代价是素材 ref 的命名契约改变（老文件仍是裸摘要串，新文件带标记），
  本 ADR 与用户文档都得跟着重写这一段，所以我没走这条路。改动局限在 `contentDigest` 的一个分支加 `write` 的一个 try，回退成本低。

## 补记（2026-10-01，复审）：fail-closed 的代价在 Windows 壳里可能变成"一张图都存不进来"

这一条是上面那个改判的**未验证后果**，登记出来是因为它落在产品口径上（用户在某个平台上完全不能存素材），
而本机只有 macOS、验不了。**下面标「未验证」的部分我没有测过，不要当读数引用。**

- **机制**：`crypto.subtle` 只在**安全上下文**里存在。Tauri v2 的生产环境 origin 在 macOS / Linux 上是
  `tauri://localhost`（自定义 scheme，`tauri.conf.json` 的 `frontendDist` 走这条），
  而在 **Windows 上是 `http://tauri.localhost`**——它是不是"potentially trustworthy origin"
  （`localhost` 与其子域、以及 127.0.0.0/8 按规范算可信）取决于该子域在公开后缀列表里的处置，
  **本机无法验证，未验证**。DEV 态不受影响：`devUrl` 是 `http://localhost:5174`，是回环。
- **如果结论是"不算安全上下文"**，那么上面那条 fail-closed 在 Windows 生产构建里的行为是
  `saveAsset` 每次都返回 `io「素材摘要不可用（缺 SHA-256），已拒绝落盘」`，
  即**整条素材链路在那一个平台上不可用**。改判之前（FNV 兜底）那些写入是成功的——
  也就是说这一刀把"静默降级"换成了"在该平台上整体拒绝"，后者更正确但用户可见。
- **怎么验**（需要一台 Windows 机器或一台装了 Windows 壳的 CI）：跑 DEV 冒烟不行（DEV 是回环），
  要**打包后的生产构建**；`apps/web/src/shared/storage/desktopSmoke.ts` 的 `asset-save` 一支
  会报 `FAIL asset-save`，那是现成的观测点。
- **与决策的关系**：不改变上面那个改判的结论（"静默降级伪装成合法"仍然更坏），
  但它是选型时应当知道的第三种可能：**显性化兜底**（ref 前缀 + 一次性告警）在这一种读数下反而更合适，
  因为它既不静默、也不让平台不可用。这条留给定档，不在这里自行改。
