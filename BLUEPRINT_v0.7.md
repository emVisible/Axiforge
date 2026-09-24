# Build Blueprint v1.1 | Status: confirmed v1.0 → executing v1.1
> 日期 2026-09-24 · 分支 `desktop` · 基线 `e123f1a`（tag `desktop-v0.6`）· 关联 [ADR-024](docs/ADR/024-desktop-local-first.md) 决策 3/4、[KERNEL_DESIGN.md](docs/KERNEL_DESIGN.md) §2.5、[REFACTOR_DESKTOP.md](docs/REFACTOR_DESKTOP.md)（新增 Phase 6）

## 1. Goals & Non-Goals

**Goal**：把桌面端从「地基已铺好」推到「打包产物真的能用、作品真的能给人」。

取证结论（本轮范围的事实依据，2026-09-24 实测 + 代码核对）：

1. **打包离线实测**：`tauri build` 出 `Axiforge.app`（release，13:32），:8000/:5174 均无监听时启动 → 角色页红字「加载角色失败 / 重试」，**同屏又渲染「你还没有创建角色」空态**（错误态未抑制空态）；本地库 `~/Library/Application Support/com.axiforge.desktop/axiforge.db` 实测 0 projects / 0 characters（首启无播种）。
2. **首屏即云端页**：`apps/web/src/app/App.tsx:135` 把 `/` 与 `*` 都指向 `/discover`；`/studio` index = `CreatorDashboardPage`（`useCreatorDashboard` HTTP）。
3. **素材仍全在服务器上**：`packages/ui/src/components/ImageUpload.tsx:31-33` POST `/api/v1/upload` → 文件进 `backend/uploads/`，DB 存 `/uploads/<digest>` 绝对路径；`packages/editor-core/src/storage/sqlite/backend.ts` 只建 6 张表，无 asset 落点；`capabilities/default.json` 只授文本读写（`fs:allow-write-text-file`），二进制落盘在权限层即被堵。
4. **`.axsp` 不含媒体**：`packages/editor-core/src/axsp.ts:4-6,22-23` v0 只存素材引用清单 → 换机导入丢图。
5. **示范作零素材**：`backend/app/domains/narrative/seed_showcase.py` 无任何 image/sprite 路径引用——「演出上限证明」这个北极星目前无载体。

**Non-Goals**（显式不做，越界即 L3 冻结上报）：
- 不拆 `PlayerPage.tsx`（1370 行）/ `useProjectEditor.ts`（1163 行）——铁律 3 单维度变更：本轮加能力，不动巨石；两者登记为 Phase 7 清零点。
- 不做音频/视频素材**入口**（契约按字节通用，UI 只实装图片）。
- 不做角色版本/关系/传记的本地化、不做场景与道具资产域、不做 AI 离线。
- 不做签名公证、自动更新、多窗口。
- 不动 web 冻结线行为（`main` 与浏览器态零变更）。
- 不碰 `backend/uv.lock` 与 `backend/app/domains/llm/providers/__init__.py` 两个脏文件；不 push。

## 2. Success Criteria (checkable)

- C1 打包 `.app`（非 dev、无后端、无 Vite 代理）离线走通：新建角色 → 导入本机 PNG → 立绘显示 → 时间轴 `show` 引用 → 断网试玩看到图。截图/录屏为证。
- C2 全新环境条件（删 `~/Library/Application Support/com.axiforge.desktop` 与 `$HOME/Documents/Axiforge`）首启：工程列表非空、无红字错误态、角色页可打开。
- C3 `.axsp` v2 导出 → 删除本地素材目录 → 导入 → 图片仍显示；`pnpm e2e` E12 断言绿，基线由 11 条增至 12 条。
- C4 桌面可达路由的同源 HTTP 依赖清零或全部落在显式降级态：`grep` 断言桌面路由不再直连 `@/shared/api` 取角色/工程，且打包态走查无「沉默失败」。
- C5 CI 新增前端门禁并绿：`tsc --noEmit`、`vitest run`、`oxlint`、dpdm 循环依赖=0、`packages/*` 禁 import react/dom 断言、`packages/core` 覆盖率可跑（G2/G4/Q9 从承诺变事实）。
- C6 三层文档一致：ADR-026 落盘、`KERNEL_DESIGN.md` §2.5 方法表含 `saveAsset`/`resolveAssetUrl`、宪章新增 Phase 6 并回写、Phase 2「素材落工程目录」虚假勾选纠偏、`BACKLOG_V1.md` 与 `.axsp` 矛盾清除、README 结构段路径修正、e2e 头注释 E1–E11。
- C7 `git tag desktop-v0.7` 存在且可 `git show`。

## 3. Technical Approach (primary + fallback + one-line reason)

- **素材寻址**：主 = 本地相对路径 `assets/<sha256>.<ext>`（落 `$HOME/Documents/Axiforge/`）+ Tauri asset protocol（`convertFileSrc`）——流式读盘不进内存，正是 ADR-024「素材落本地工程目录、DB 存相对路径」的原意；fallback = `plugin-fs readFile` → `URL.createObjectURL(Blob)`，不依赖 protocol feature，但内存与生命周期成本随素材数线性上升。
- **写盘端口**：主 = 给 `SqliteStorageProvider` 注入单方法 `FsBridge{writeBytes}`，与既有 `SqlBackend` 注入完全同构（不新增抽象层）；fallback = 在 `apps/web` 层直接写盘、Provider 只存路径——会让「素材在哪」出现第二真相源，仅当注入通道受阻时采用。
- **容器 v2**：主 = zip + `fflate`（G7 三问：五十行自写不可行；fflate 无依赖、活跃维护、~8KB；实际只用 `zipSync/unzipSync`）；fallback = JSON 信封内 base64 内嵌，零新依赖但体积 +33%、大立绘内存峰值高。`AXSP_VERSION` 1→2，unpacker 保留 v1 只读（格式版本演进，非兼容垫片）。
- **首启播种**：主 = 官方示范作以 `.axsp` v2 随包分发、首启走导入路径——与「分发」共用同一机制，零新概念；fallback = TS 侧移植 `seed_showcase.py`，会制造示范作双真相源，明确不取。
- **显示解析**：主 = 单一 `resolveAssetUrl(ref)`（`/uploads/...` 原样透传、`assets/...` 桌面转协议）——一处权威，浏览器态零变更。
- **降级可见性**：判据源自「当前 Provider 是否本地」这一可直接检查的状态，不为每种组合预计算布尔标记。

## 4. Milestones

- **M1 素材本地闭环**：契约 + 壳权限 + 落盘 + 显示。退出准则 = C1 在打包 `.app` 内走通（dev 代理不算）。
- **M2 容器 v2 与首启有内容**：媒体内嵌 + 导入路径重写 + 示范作播种。退出准则 = C2 + C3。
- **M3 桌面可达域收口**：角色域 Provider 化 + 缺席域显式降级 + 首屏路由。退出准则 = C4，且实测复现的「错误态与空态同屏」缺陷消失。
- **M4 门禁固定税与收口**：CI 断言 + 三层文档 + tag。退出准则 = C5 + C6 + C7。

## 5. Task List

- [x] S1-T1 L4 契约扩展：`StorageProvider.saveAsset(bytes,name,mime)→relPath` 与 `resolveAssetUrl(ref)→displayUrl`，失败语义沿用判别联合；Memory/HTTP/SQLite 三实现补齐 | Acceptance: `storage/contract.ts` 新增 saveAsset 用例三实现全绿；`resolveAssetUrl` 单测覆盖 `/uploads/...` 透传、`assets/...` 桌面转换、空/非法输入 | M1
- [x] S1-T2 壳能力开通：`capabilities/default.json` 增二进制读写（`fs:allow-read-file`/`fs:allow-write-file`，scope 保持 `$HOME/Documents/Axiforge/**`）；`tauri.conf.json` 开 `app.security.assetProtocol{enable,scope}`；`Cargo.toml` tauri features 加 `protocol-asset` | Acceptance: `pnpm --filter @axiforge/desktop build` 成功；**出图证据双轨**——壳内冒烟以真实可解码 PNG 的 `img.onload` 持续回归（dev 壳），release `.app` 手动截图在 M1 收尾统一做一次 | M1
- [x] S1-T3 素材目录与去重：`FsBridge` 注入 `SqliteStorageProvider`；落 `assets/<sha256>.<ext>`，同内容复用一份，DB 只存相对路径 | Acceptance: 同一文件导入两次 → 磁盘仅 1 个文件、两处引用同路径；单测用内存 stub 断言 | M1
- [x] S1-T4 上传入口平台分派：`ImageUpload` 增可选 `upload?: (file)=>Promise<string>` 注入点（默认保持现 HTTP 行为）；web 侧桌面态传 Provider 版 uploader；显示统一走 `resolveAssetUrl` | Acceptance: 未注入时行为逐字段不变（单测）；打包态新角色立绘可显示并保存后重开仍在 | M1
- [ ] S2-T1 `.axsp` v2 容器：zip 布局（`manifest.json` / `project.json` / `assets/*`）+ pack/unpack + v1 只读兼容 | Acceptance: axsp.test.ts 新增 v2 往返逐字段等价、v1 文件仍可读、损坏包 → `corrupted` 三组用例全绿 | M2
- [ ] S2-T2 导出/导入接真实字节：导出按 `manifest.assets` 收集本地文件入包；导入落盘并重写相对路径（新工程 id 与素材路径同时重映射） | Acceptance: `pnpm e2e` 新增 E12「导出→清空素材→导入→引用可解析」断言绿（12 条基线） | M2
- [ ] S2-T3 首启播种：示范作 `.axsp` v2 随包资源分发，`listProjects` 为空时自动导入一次 | Acceptance: 删本地库与素材目录后启动 .app → 工程列表出现示范作且可断网试玩；重复启动不二次播种（单测 + 手动） | M2
- [ ] S3-T1 角色域 Provider 化：`MyCharactersPage`/`CharacterDetailPage`/`CharacterSearchSelect`/`useProjectDirectory` 在桌面态经 `listCharacters/getCharacter/saveCharacter`（契约已存在，属接线非新增） | Acceptance: 打包离线态角色列表与详情不再出现「加载角色失败」；web 态行为零变更 | M3
- [ ] S3-T2 缺席域显式降级：版本/关系/传记/发现/全局搜索/概览在本地态给「需后端」可读态；**错误态必须抑制空态**（实测缺陷） | Acceptance: 断网打包态走查无「沉默失败」；错误/空态互斥有单测或组件用例 | M3
- [ ] S3-T3 首屏路由收口：桌面态 `/` 与 `*` 落 `/studio/projects`，`/studio` index 不再落云端概览 | Acceptance: 打包 .app 冷启动首屏即本地工程列表（截图）；浏览器态仍默认 `/discover`（回归断言） | M3
- [ ] S4-T1 CI 前端门禁：新增 job 跑 `tsc --noEmit` + `vitest run`（core/axs/editor-core/web）+ `oxlint` + dpdm 循环依赖 + `packages/*` 禁 react/dom 的 lint 断言；补 `@vitest/coverage-v8` 使 core 覆盖率可跑 | Acceptance: CI 上上述步骤可见且绿；宪章 G2/G4/Q9 的「CI 断言」指向真实步骤 | M4
- [ ] S4-T2 决策落文：新建 ADR-026（素材本地化与 `.axsp` v2 容器），回写 `KERNEL_DESIGN.md` §2.5 方法表与 §一 依赖铁律的 CI 事实 | Acceptance: ADR-026 状态「已采纳」含备选与否决理由；KERNEL 方法表含 saveAsset/resolveAssetUrl | M4
- [ ] S4-T3 文档对账：宪章新增 Phase 6 段并回写勾选；Phase 2「素材落工程目录 + DB 存相对路径」虚假勾选纠偏；`BACKLOG_V1.md` 清除「`.axsp` 导出=明确不做」矛盾；README 结构段路径修正；e2e 头注释 E1–E11 | Acceptance: 逐文件 diff 可指认，且不再有文档声称已交付而代码未交付的项 | M4
- [ ] S4-T4 收尾：G1–G9 门禁证据 + 附录检查单全勾 + 手动验收路径写入 §6 + 打 tag `desktop-v0.7` | Acceptance: `git tag --list desktop-v0.7` 非空且 `git show` 可见；门禁关键输出粘进宪章 Phase 6 | M4

## 6. Acceptance Criteria（手动验收路径）

打包态（`open Axiforge.app`，先 `./dev.bash stop` 或确认 :8000/:5174 无监听）：

1. 冷启动 → 首屏为本地工程列表且已含示范作（验 C2）；
2. 打开示范作 → 剪辑台 FX/角色轨正常 → 角色面板选一个角色 → 「导入立绘」选本机 PNG → 立绘缩略图出现（验 C1）；
3. 拖该表情进时间轴生成 `show` 指令 → 预览监视器与断网试玩均显示该立绘（验 C1）；
4. 保存 → 完全退出应用 → 重开 → 立绘仍在（相对路径持久化）；
5. 工程列表「导出」→ 得 `.axsp` → 删除 `$HOME/Documents/Axiforge/assets` → 「导入 .axsp」→ 立绘重新出现（验 C3）；
6. 全程无红字沉默失败；需要后端的入口显示「需后端」而非空页（验 C4）。

每步截图或命令输出留痕，任一失败即停并按 L 级偏差上报。

## 7. Risks & Assumptions

- **假设**：`desktop` 头即交付基线，web 冻结线不受本轮影响。
- **R1 未验证**：`crypto.subtle` 在 `tauri://localhost` 是否可用（secure context 判定）。若不可用 → 改由 Rust 侧算摘要或退化为 `name+size+mtime` 命名（L2 偏差，记录）。
- **R2**：启用 assetProtocol 时 Tauri 会自动注入 `img-src asset:` 相关 CSP；当前 `csp: null`，若自动改写导致其它资源被拦，则显式配置 CSP 并在打包态复验（L2 候选）。
- **R3 验收边界（诚实交代）**：Playwright 驱动不了 WKWebView，M1/M2 的壳内路径无法进 e2e。自动化只覆盖纯函数与契约层（单测 + E12），壳内以打包手动走查为准——不假装能自动化。
- **R4**：示范作当前零素材引用（`seed_showcase.py` 无 image/sprite），故播种成功**不能**证明素材显示，C1 必须人工导入一张图才算过。
- **R5**：`.axsp` v2 改格式是对外契约变更，须同 PR 落 ADR-026 + 用户文档（铁律 9）；v1 只读兼容若被跳过即 L3。
- **止损**：M1 若卡在壳权限/协议（>2 天），M2/M3/M4 仍可独立交付（播种可退化为空库首屏 + 明确提示，容器 v2 与素材解耦），主线不动。

## 8. Change Log

- v1.0 draft（2026-09-24）：范围锁定「桌面素材与分发闭环」（用户在 A/B/C 三选中 A）；取证方式=打包态断网实测 + 配置/代码核对，结论已写入 §1。B（门禁清偿）压缩为 M4 固定税随轮走；C（演出与音频加厚）明确后置。待人类确认后转 confirmed 再进 Forge。
- v1.0 confirmed（2026-09-24）：人类确认从 M1 首条任务起进 Forge；check-ids.sh PASS（14 IDs）。
- v1.0 L1（2026-09-24）首条任务：`extensionFor` 补 name.trim()（尾随空格文件名会误判后缀，单测暴露）；HTTP 实现的素材口另加 fetch 桩用例 3 条（契约套件历史上只跑 Memory/SQLite，此处补齐第三实现的断言而非改范围）。
- v1.1 L2（2026-09-24）壳能力开通·验收措辞：原写「打包 .app 截图出图」，实测改用壳内 DEV 冒烟以真实可解码 PNG 的 `img.onload` 断言（更强的持续回归形式，可 grep 落盘），release 截图并入 M1 收尾。首轮探针误用不可解码的假 PNG 造成 `display=false` 假阴性，纠正后四段全通（dedup/roundtrip/protocol/PASS）。
- v1.1 L2（2026-09-24）素材落盘·端口命名：§3 的 `FsBridge{writeBytes}` 落地为 `AssetStore{write,read}`——多出的 `read` 是 M2 容器打包（收集真实字节）的既有需求，同批改签名比二次破坏契约更省；`AssetStore` 与 `SqlBackend` 同构，仍是方法级端口而非新抽象层。
- 格式约束（本轮踩到两次）：§8 与 §3 不得出现裸任务 ID，否则 check-ids 判为重复条目；引用任务一律用标题词。
