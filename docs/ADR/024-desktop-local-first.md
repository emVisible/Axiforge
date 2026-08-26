# ADR-024：桌面优先战略（Tauri 壳 + Local-First）

**状态**：已采纳
**日期**：2026-08-26
**关联**：ADR-008、ADR-016、ADR-022、VISION_AND_BRIDGES §5、ROADMAP_FINAL v2.0+

## 背景

产品重心已从「Web UI 应用」漂移到「NLE 式创作工作台」（ADR-022 将剪辑台定为默认主视图）。NLE 类交互对浏览器的三大结构性不适配：

1. 本地大素材文件访问（立绘/音频/视频工程资产）
2. 键盘密集操作与全局快捷键
3. 长会话大数据量的内存与性能

代码调查确认现有架构已天然分层，桌面化无需推翻地基：

| 层 | 现状 | 桌面化 |
|---|---|---|
| IR + 引擎（`packages/core`） | 纯 TS，零 UI 依赖 | 不动 |
| AXS 语言（`packages/axs`） | 纯 TS，零 UI 依赖 | 不动 |
| 编辑器 UI（React） | 平台无关 | 复用 |
| 存储（HTTP → FastAPI → PG） | 强依赖服务器 | **唯一要换的层** |

补充事实：剪辑台编辑/保存全程只依赖结构化 `Instruction[]`；`axs_source` 为可选镜像；运行时编译器直读 DB。

## 决策

1. **全力转向桌面**：web 版冻结于当前功能水平，仅接受数据/安全修复；新功能全部落在桌面应用。
2. **壳选型 Tauri v2**（否决 Electron）：复用现有 React 前端与 `packages/*`；系统 WebView 降低内存占用；Rust 侧提供本地 FS 能力。
3. **Local-first 存储**：
   - 新增 `StorageProvider` 接口抽象（loadProject / saveNarrative / saveCharacters / …）
   - 桌面实现 = SQLite，schema 沿用现 PG 关系模型（projects / nodes / edges / project_roles / characters）；`narrative_data` 保持 JSON 列，不做关系化展开
   - 素材落本地工程目录，DB 仅存相对路径
   - 云同步退化为可选插件：FastAPI 后端转为「协作/发布服务」，非运行必需
4. **工程容器 `.axsp` 提前**（原 v2.5 规划前置）：桌面工程的保存/打开即 `.axsp`（叙事 JSON + 素材引用清单打包），SQLite 为工作缓存。
5. **StoryCompiler 移植 TS 进 `packages/core`**（否决 Tauri sidecar 跑 Python）：引擎本就在 TS 侧，移植避免用户安装运行时与双端漂移；Python 编译器降级为 golden-test 对照基准。

## 分支策略

- `main` = web 冻结线，只收 hotfix，始终可发布
- `desktop` = 桌面化长期集成分支，短命特性分支完成即合回，每阶段打 tag（`desktop-v0.x`）

## 非目标

- 移动端（远期再议）
- 实时多人协作（云同步后期 opt-in）
- web 版新增功能

## 后果

- ✅ NLE 三大痛点全部解锁；IR/AXS/UI 层零改动复用
- ✅ `.axsp` 从远期规划变为近期可交付的工程格式
- ⚠️ StoryCompiler TS 移植是最大单项工作量（以 Python 输出建 golden test 兜底）
- ⚠️ 需维护 SQLite 与 PG 行为对齐清单
