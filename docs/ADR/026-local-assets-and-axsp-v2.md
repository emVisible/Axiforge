# ADR-026：素材本地化与 `.axsp` v2 容器

**状态**：已采纳
**日期**：2026-09-24
**关联**：[ADR-024](./024-desktop-local-first.md)（决策 3 本地优先存储、决策 4 工程容器）、[ADR-025](./025-axs-peer-dual-view.md)、[KERNEL_DESIGN.md](../KERNEL_DESIGN.md) §2.5、[REFACTOR_DESKTOP](../REFACTOR_DESKTOP.md) Phase 6、执行件 `BLUEPRINT_v0.7.md`

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
