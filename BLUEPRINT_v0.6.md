# Build Blueprint v1.1 | Status: confirmed v1.1
## 1. Goals & Non-Goals
- Goal: v0.6 = G10 收尾闭环，在 desktop@c9e3e56（已含 Phase1-5）之上逐项打勾并打 tag desktop-v0.6。
- Non-Goals: 不加新功能；不动世界 tick / AI 运行时 / 跨作品继承；不动签名公证/自动更新；不碰 backend 两个无关脏文件。
## 2. Success Criteria (checkable)
- G1–G9 逐项有证据（命令输出或偏差记录落宪章）。
- `pnpm e2e` 全绿（当前基线 11 条：E1-E11）。
- 手动验收路径走通，步骤写入交付说明（本文件 §6）。
- 三层文档一致：ADR-024/025 状态正确，本文件 checkbox 全勾，docs/user 与解析器一致。
- `git tag desktop-v0.6` 存在且可 `git show`。
## 3. Technical Approach (one line; expand only if contended)
- 只读核验 + 文档勾选 + 打 tag，不加产品功能代码；仅允许为补验收证据追加断言用例（偏差发现则 L3 冻结并上报，不顺手修功能）。
## 4. Milestones (single M1 with exit criterion)
- M1 G10 closed: 附录 7 项全勾 + desktop-v0.6 tag 存在，退出准则 = `git tag --list desktop-v0.6` 非空且本文件 §6 验收路径可复述。
## 5. Task List
- [ ] S1-T1 G1–G9 门禁逐项核验并记录证据/偏差 | Acceptance: 粘出 tsc/vitest/e2e/dpdm/lint/golden 关键输出行，任一红灯按 L3 冻结上报 | M1
- [ ] S1-T2 E2E 行为基线全绿复核（E1-E11） | Acceptance: `pnpm e2e` 11 passed 输出 | M1
- [ ] S1-T3 手动验收路径走通（RN 闭环：@relation 书写→FX 轨检视→relation 条件分支） | Acceptance: 步骤写入 §6 且本地走通，失败即停 | M1
- [ ] S1-T3a relationship 引擎断言（evaluate+apply） | Acceptance: conditions.test.ts 新增 relationship 用例全绿 | M1
- [ ] S1-T4 三层文档+删除清单+非目标复核+打 tag | Acceptance: `git show desktop-v0.6` 可见 + 附录 7 项全勾 commit | M1
## 6. Acceptance Criteria
- 手动验收路径（RN 闭环）：1) 任一工程 Beat 书写 `@relation 堰纱.玩家.trust = high`；2) 切剪辑台确认 FX/RN 轨出现粉色关系色块（E11 同款）；3) 另一 Beat 标题加 `[if: relation.堰纱.玩家.trust == high]` 后编译/试玩走分支。每步可截图或命令输出佐证。
## 7. Risks & Assumptions (one line; expand only if contended)
- 假设 desktop 头即交付基线；风险：门禁红灯或手动路径失败则停，不扩展范围。
## 8. Change Log
- v1.0 draft: G10 收尾范围锁定（2026-09-24），待人类确认后转 confirmed 再进 Forge.
- v1.0 confirmed: 人类确认进 Forge（2026-09-24），check-ids.sh PASS（4 IDs）。
- v1.1 (L2): S1-T3 执行中发现 relationship 引擎有实现无断言，§3 放宽为“可追加断言用例”，§5 新增 S1-T3a；无产品代码变更。
