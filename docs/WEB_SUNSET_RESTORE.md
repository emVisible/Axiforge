# web 端退役：恢复锚点与还原手册

> 2026-09-26 · 服务于「去掉 web 端、只保留桌面端」这一步及后续所有删除动作。
> 配套：[WEB_FEATURE_DISPOSITION](./WEB_FEATURE_DISPOSITION.md)（逐功能去留清单——删之前先看那份）。
> 规则：**任何删除 web 路径或后端的提交，都必须能在本文件的锚点上回滚**；锚点若失效，先修锚点再动手。

## 为什么先立这份文件

`desktop` 分支接下来要做的不是加功能，而是**删**：删浏览器部署目标、可能删 FastAPI 后端与 Postgres、
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
