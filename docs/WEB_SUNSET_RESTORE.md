# web 端退役：恢复锚点与还原手册

> 2026-09-26 · 服务于「去掉 web 端、只保留桌面端」这一步及后续所有删除动作。
> 配套：[归档盘点 WEB_FEATURE_DISPOSITION](./archive/WEB_FEATURE_DISPOSITION.md)（逐功能去留快照；当前执行清单以 [REFACTOR](./REFACTOR.md) 为准）。
> 规则：**任何删除 web 路径或后端的提交，都必须能在本文件的锚点上回滚**；锚点若失效，先修锚点再动手。

## 为什么先立这份文件

接下来要做的不是加功能，而是**删**：删浏览器部署目标、可能删 FastAPI 后端与 Postgres、
删 HTTP-only 代码路径。删除类工作唯一的保险是事前可回滚，而不是事后靠 reflog 抢救。

## 三个锚点（已交叉验证，非推定）

| 锚点 | 指向 | 作用 |
|---|---|---|
| tag `web-archive-20260926` | `777591f`（原 `main`，v0.4） | web 冻结线的归档点，删除前唯一的 web 独立标记 |
| 分支 `backup/main-web-20260926` | `777591f` | 同点的分支形态，便于 `git diff` 对照 |
| tag `desktop-wip-20260926` | 当时的 `desktop` HEAD | 护住未推送的在制工作（含 v1.0 演绎内核 M1/M2） |
| 离线包 `/Users/young/Code/axiforge-backups/axiforge-full-20260926.bundle` | `--all`，3.0 MB | 不依赖 GitHub、不依赖 reflog 的整机恢复手段 |

## 一个必须记住的事实：web 分支没有独有提交

```
git rev-list --count desktop..main   → 0     # main 没有任何 desktop 缺失的提交
git rev-list --count main..desktop   → 130   # desktop 领先 130 颗
```

`main` 是 `desktop` 的**严格祖先**。所以：

- "备份 web 分支"保住的是 2026-07-09 的 v0.4 快照，不是唯一资产；真正的风险在**本地未推的 desktop 工作**。
- "去掉 web 端"**不是合并问题**，是删部署目标 + 迁移云端功能。不要按"两条线要并一条"去规划。

## 备份有效性的判据

`git bundle verify` 只证明文件自洽，**不证明能还原**。本次做法：从 bundle 真实 `git clone` 到临时目录，
比对 `origin/main`、tag 解引用后的 commit 三者是否都等于 `777591f`，比对完删掉临时目录。以后重做备份要照这一遍。

## 还原步骤

整包还原（远端与本地全丢的情况下）：

```bash
git clone /Users/young/Code/axiforge-backups/axiforge-full-20260926.bundle axiforge-restored
cd axiforge-restored
git checkout desktop          # 或 git checkout web-archive-20260926 回到 web 线快照
```

只回滚某次删除：

```bash
git log --oneline -- apps/web/src/shared/api      # 找到删除提交
git revert <sha>                                   # 用 revert，不要 reset --hard 改历史
```

找回 web 线的原始树：

```bash
git show web-archive-20260926:apps/web/src/... # 按路径取回单个文件
git checkout web-archive-20260926 -- <path>
```

## 删除动作的前置检查（每次都要过）

1. 本文件的锚点仍然可达：`git tag --list | grep web-archive` 非空，且 bundle 文件还在磁盘上。
2. 被删能力已被显式处置三选一：本地已实现 / 明确判死并写进文档 / 保留后端仅供该能力。
   **不允许**留着入口但点进去失败——那是本项目反复清理过的那类"把没做到演成做完了"。
3. `pnpm gates` 与 `pnpm e2e` 在删除后全绿；若某个门禁随被删对象一起消失，要说明它去哪了，
   而不是让覆盖度静默下降。

## 尚未定案的决策点（不阻塞盘点，但阻塞删除）

- `main` 是 web 冻结线、「Web 原生零安装」是对标 Ren'Py 的三大差异之一（见 ADR-024 与 `docs/ROADMAP_FINAL.md`）；
  去掉 web 等于作废这条差异化，需要改写 ADR 与 ROADMAP，而不是静默偏离。
- 多用户鉴权、发布/发现、评论与内容治理、版本历史与协作、跨设备同步**本质上需要服务端**，
  无法靠"同步"搬到本地。每一项要单独决定：重定义成本地语义 / 直接砍掉 / 保留后端只为它。
- FastAPI 后端与 Postgres 的去留。

## 退场前置的体量实测（2026-09-29，全部由命令产出，不是估算）

| 要摘的东西 | 实测 | 命令口径 |
| --- | --- | --- |
| 云端分支层（S13-7 的目标） | 29 个文件、2538 行 | `apps/web/src/shared/storage/http*.ts` + `apps/web/src/shared/api/*.ts` |
| 运行模式分叉点 | 25 个文件、34 处 | `grep -rE "isTauriEnvironment\(|isLocalOnlyDeployment\("` 全 `apps/web/src` + `packages` |
| 后端本体（S13-6 的目标） | 107 个 `.py`、10 个 domain | `find backend/app -name "*.py"` / `ls backend/app/domains` |
| 验收基线 | **2026-09-30 复测**：浏览器态 `Total: 50 tests in 3 files`（`baselines` 13 + `desktop-http` 33 + `llm-endpoint` 4）；桌面态 `pnpm e2e:desktop` **37 tests in 2 files**（`testIgnore: /baselines/`，零后端） | `npx playwright test --list` / `--config playwright.desktop.config.ts --list` |

**由此得到一条不是观点、是配置的结论**：`playwright.config.ts` 的 `webServer` 现在就依赖 uvicorn:8000。
所以「删后端」会在**启动阶段**打掉整条 e2e 基线，而不是只让某几条用例变红——
这正是不变量②「验收基线最后搬家」的实测理由，也是 S13-6 的硬前置：
**S13-6 不可开工的原因不是等一句批准，而是等基线搬家（S13-5 后半）先落地。**

**但这一句在 2026-09-30 需要按实测收窄**（原文写于搬家之前，那份「38 条」也是当日数字，不是估算）：
桌面那一半**已经搬完了**——`pnpm e2e:desktop`（只起 vite、不起 uvicorn）跑 **37 条全绿**，
覆盖 E14/E15/E17 一族（含 E20/E25/E27/E33 那几条嵌套腿）与 E18/E19/E21/E30/E31/E32/E35–E39/E40/E41/E42。
于是删后端真正会打掉的只剩 **`baselines.spec.ts` 的 13 条**（37 条里的一条不多不少都在桌面配置里跑着）。
这条数字变化的意义是把第 1 问从"要不要搬"改成了"**这 13 条归谁**"：
它们要不要也搬成离线可跑（换成 `?storage=memory` 宿主或壳内冒烟），还是让后端只作为**测试宿主**为这 13 条活着。
第 2 问（云本质功能——发现/作者页/Nexus/版本/评论——在桌面要不要留入口，见 `WEB_FEATURE_DISPOSITION` 归档快照与已登记的 4 处导航出口）不受影响，仍是 S13-3 的范围。
第 1 问的答案决定 S13-5/S13-6/S13-7 的次序；两问都不需要新能力，只需要定档。
