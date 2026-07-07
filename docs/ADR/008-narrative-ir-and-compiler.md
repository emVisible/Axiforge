# ADR-008：引入 Narrative IR + Story Compiler（桥1·脊椎）

**状态**：已采纳
**日期**：2026-07-07
**决策者**：Axiforge 核心团队
**关联**：`ROADMAP_FINAL.md` v1.1、`VISION_AND_BRIDGES.md` 桥1、ADR-009、ADR-014

## 背景

v1.0 的运行时是"每推进一个节点打一次 API"：`backend/app/services/player.py` 的 `draw` / `complete` 逐节点解释执行，条件评估与效果应用全在 Python 端，前端 `PlayerPage.tsx` 每次点击都要 `POST /complete → draw`。

这带来三个结构性障碍（详见 `VISION_AND_BRIDGES.md` §3.2）：

1. 聊天式网络往返，无法承载连续演出（演出需要客户端连播时间轴，不是一句一请求）。
2. **无法离线 / 打包 / 导出**——发布形态（能力地图 D10）被架构堵死。
3. 未来高保真 Runtime（Unity/桌面端）要复用逻辑必须重写一遍 Python 状态机。

## 决策

**引入与渲染端无关的中间表示 Narrative IR，并把后端从"逐句解释器"改造为"编译器 + 持久化"。**

1. **单一真相源包 `@axiforge/core`（TypeScript）**：定义 IR 类型、条件/效果语义、renderer-agnostic 运行时引擎。前端 Player 与（未来）任何渲染器都消费它。
2. **Story Package**：一个项目编译为一份可移植的 `StoryPackage`（beats + transitions + 起始态 + 资产引用清单）。运行时**加载包后本地推进**，不再每句请求。
3. **后端职责收敛**：`project(DB) → compile → StoryPackage(JSON)`，经 `GET /api/v1/play/story/{project_id}` 下发；会话持久化（存档/记忆）与**服务端裁决条件**（ADR-014）仍在后端。
4. **Python 侧镜像**：后端编译器产出的 JSON 必须与 `@axiforge/core` 的 IR schema 一致；以 pydantic 镜像类型保证不漂移。
5. **兼容迁移**：v1.0 的单句节点（`narrative_data` 的 speaker/dialogue/narration/choices）由编译器**自动包装**为单指令脚本，旧项目零手工迁移可玩。

## 理由

| 因素 | 说明 |
|------|------|
| 复用性 | Lite Player 变成"IR 的第一个渲染器"，其打磨不会因未来 Unity 而作废 |
| 发布 | IR 可序列化 → 离线包 `.axsp` / 导出（v2.5）水到渠成 |
| 性能 | 客户端本地推进，演出连播无网络抖动 |
| 一致性 | 条件/效果语义在 `@axiforge/core` 单点定义，v1.2 删除后端重复实现（ADR-010） |

## 后果

### 正面
- 运行时与后端解耦；后端可无状态化编译。
- 引擎可 100% 单测（纯函数状态机），无需数据库。

### 负面 / 技术债
- 需维护 TS ↔ Python 两处 IR 定义的一致性（以契约测试缓解）。
- 隐藏分支/反作弊类条件不能全放客户端 → 由 ADR-014 的"服务端裁决标记"处理。

## 不采纳的备选
1. **维持逐节点 API** — 无法离线/演出/导出，北极星不可达。
2. **直接上 Unity 引擎** — 重写成本高且消费者（演出/记忆）未就绪。
3. **IR 只放后端** — 前端仍需重实现推进逻辑，重复问题不解。

## 验收（v1.1）
- [ ] `@axiforge/core` 定义 `StoryPackage` / `Instruction` / `Condition` / `Effect` 与引擎，单测通过
- [ ] 后端 `GET /play/story/{project_id}` 返回可被 `@axiforge/core` 引擎播放的包
- [ ] Player 改为 IR 渲染器，本地推进一条分支不再逐句请求
- [ ] 旧项目零手工迁移可玩；`test_player_flow` 等价路径仍绿
