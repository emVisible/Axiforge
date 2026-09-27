# ADR-028：审核判断层收进中台（Clearance 融合与 `ModerationProvider` 落地）

**状态**：已采纳
**日期**：2026-09-27
**关联**：[ADR-018](./018-content-governance.md)（内容治理状态机，本 ADR 落地它预留但未实现的 `ModerationProvider`）、[ADR-020](./020-llm-multi-provider-local-first.md)（多 provider 与规则兜底链）、[ADR-024](./024-desktop-local-first.md)（本地优先）、[ADR-027](./027-axs-single-grammar-authority.md)（单一权威原则）、参照实现 `Clearance/`（未纳入版本管理）

## 背景

`Clearance/` 是用户此前的独立项目：`pyproject.toml` 自述为「Clearance（放行）：**Laya-native 通用后台审核网关，AIP 的产品实现**」。它不是 Axiforge 的一部分（自带 `.git`、`.venv`、`node_modules`，895MB，其中 Python 源码只有 2016 行），但它的**判断层设计是对的**，而 Axiforge 中台的判断层是空的：

- `core/content_validate.py:9` 的敏感词表是占位：`_BLOCKED = frozenset({"违禁示例词"})`
- ADR-018:24 白纸黑字承诺「LLM 审核留接口（`ModerationProvider`），默认关闭」——**全仓 grep 无此符号**，接口从未存在
- 中台有完整的状态机与处置（`content_status`、`violations`、strike、audit、admin UI），但没有能产生"建议"的东西

所以这不是"把外部项目搬进来"，而是**把 ADR-018 欠下的那一格补上，并用 Clearance 的成熟设计来补**。

Laya 是外部开源决策模型（Apache-2.0，`NandhaKishorM/laya`）：非自回归、单次前向、输出带校准概率的**类型化问题答案**（`choice` / `score` / `noul`），33ms 级。它不是本仓库的 agent，也不产生文本——因此没有"解析模型输出"这一类风险，这是选它而不是选通用 LLM 做审核的根本理由。

## 实测基线（不是转述，是在 Clearance 自己的代码上跑出来的）

| 输入 | Clearance 实际输出 | 后果 |
|---|---|---|
| `category="approve_all"`（模型幻觉/被注入），conf 0.99 | `review.approve` conf=0.99 | **越过 0.85 门自动通过**：未知类别兜底成 `"other"`，而 `"other"` 直通放行（`engines.py:55`） |
| `fraud=9.0`（越界概率） | `review.reject` **conf=9.00** | 自动驳回，且置信度原样落库——全链路没有任何 [0,1] 裁剪 |
| 关键词「加微信领」（无模型、纯兜底） | `review.reject` conf=0.86 → `via=auto` | **最弱的引擎执行了不可逆否决**；同一引擎的放行路径却故意压到 0.60 永不过门 |
| 干净内容 | `review.approve` conf=0.97 | 未校准的置信度被直接拿去比阈值 |

另有：`AUTO_THRESHOLD=0.85` 在 import 期绑进 `route()` 的默认参数（`gateway.py:45`）；`validate_action` 只收到 `{"review_id": id}`（`store.py:94`），4KB 上限与凭证正则**从未看过正文**；`REGISTRY` 声明 `"idempotency": "required"` 而 `submit` 每次发新 UUID；决策不记录策略/题集版本，无法复现；`eval/` 只有 8 条合成样本，**没有任何准确率数字**。

## 决策

### 1. 接口按 ADR-018 的原命名落地，并加一个承重字段

```python
class ModerationProvider(Protocol):
    name: str
    authoritative: bool          # ← 新增：有没有资格执行不可逆动作
    def health_check(self) -> bool
    def moderate(self, subject) -> Verdict
```

`authoritative` 是对上表第三行的直接回应：**证据越弱的引擎越不该拥有不可逆的权力**。确定性词表 `authoritative=False`，它只能"升级给人工"；只有校准过的模型引擎为 `True`。链上任何非权威结论都不许终止级联（见 §3）。

### 2. 取值域即白名单

`questions.py` 声明每个问题的合法取值，`normalize_answers()` 强制执行：越界的 choice、不在 [0,1] 的概率、缺失的答案 → **该引擎弃权**。绝不兜底成默认类别。上表前两行在这里都变成 `human_review`。

题集本身也换：Clearance 的六个问题是客服工单口径（billing/technical/fraud/churn），对视觉小说 UGC 平台不对位。重设为分级、性内容、血腥暴力、自伤、仇恨、违法教程、真人隐私、导流 + severity，且每题带 `clause_id`——`violations.clause` 首次有了统一定义处（此前只有处置型的 `content_takedown`）。

### 3. 级联改规则：便宜的不许挡住好的

Clearance 是"第一个非 None 赢"。改成：**非权威引擎的结论记为 `prior` 继续往下问**，只有权威引擎表态或全链无结论才停。词表是本地纯函数（微秒级），成本不变，但模型不再被挡住。

### 4. 门控是五道检查，不是阈值比大小

`policy.gate()` 顺序：弃权/出错 → `HUMAN_ONLY_CLAUSES`（仇恨、隐私、违法教程这类需要判断与上下文，不许自动下架）→ 非权威 → **未校准** → 最后才比阈值；且驳回线（0.95）高于通过线（0.90），评论与素材再各自收紧。未校准的置信度不参与任何自动动作——上表第四行的修法。

### 5. 决策必须可复现

每条决策落 `policy_version / questions_version / lexicon_version / 原始类型化答案 / via 字符串`。幂等键 = `(kind, content_sha256, policy_version, questions_version)`。

### 6. 有意删除 `jev`

ADR-018:32 要求「全部单体内轻量实现，不引外部服务」。Clearance 链里的 `jev` 档把用户作品正文 POST 给 `api.typesafe.ai`——既是外部服务也是数据出境。**这一档不迁移**，不是遗漏。

### 7. 部署形态沿用 Clearance 已被验证的那一半

`laya_sidecar` 把 torch 那 ~2GB 重依赖隔离在独立进程与独立 venv，主服务保持轻、秒启动、断网可跑；sidecar 不在时整条链自动降级为人工队列。这部分是参照实现里做对了的东西，原样继承。

### 8. 默认关闭，发布路径不变

`settings.moderation_enabled = False`。ADR-018:23 的"发布跑规则校验、不做前置人工审核（保持低摩擦）"继续成立：审核是**旁路产生建议 + 中台人工处置**，不是新的发布闸门。这与项目既定的「只出建议、采纳才执行」一致。

## 后果

- 新增 `backend/app/domains/moderation/`：`contracts / questions / policy / engine / registry / providers{lexicon,laya_sidecar}`，17 条测试，全部对着上表写（其中多条在 Clearance 原逻辑下会失败）
- 中台此前"有处置无判断"的缺口闭合；`content_validate` 的占位词表有了正式替代物
- **尚欠（按依赖顺序，不可颠倒）**：① ~~决策落 Postgres~~ 已完成（`moderation_cases` / `moderation_decision_logs` + 幂等迁移，迁移在真库跑过，`conf=9.0` 被 CHECK 约束以 IntegrityError 拒收）；② ~~接进发布/评论/举报路径~~ 已完成：角色公开两处 + 评论创建 + **举报创建**。
   举报这一处是融合价值最高的：机器结论挂在 `moderation/context` 的 `auto_judgement` 字段上，
   运营打开一条举报时看到的是"引擎判了什么 + 命中条款 + via 理由 + 举报原由"，而不是从空白开始判。
   三者都走 `advisory_review`（SAVEPOINT 包裹、任何异常不外抛）。
   一条被测试逼出来的顺序教训：举报路径原本在 `commit()` **之后**才跑审核，
   于是举报成功、案件却留在未提交的事务里被回滚——判断"接进去了"和"判断真的落库了"是两件事。；③ ~~中台一屏~~ 已完成（`/moderation` 自动判断队列，含引擎资格、条款、置信、via 的运营语言、判断依据展开、处置与回退）；④ 校准温度表——**没有它，按 §4 系统只会转人工，这是刻意的保守**，见下方实测；⑤ 词表外置为可热更配置；⑥ 标注集从"我按条款口径撰写"升级为多人一致度量的金集。
- **`/editor/ai/*` 与发布路径的关系**：审核不参与发布判定（ADR-018:23 继续成立），所以 `moderation_enabled=False` 时发布行为与改造前完全一致。

## 实测基线（参照实现没有的部分，因此这是净增）

`backend/eval/moderation_eval.py` + 34 条样本（clean 12 / reject 10 / human 8 / adversarial 4），
当前可用链 = 仅词表（sidecar 未起）：

| 指标 | 值 | 读法 |
|---|---|---|
| `auto_err` | **0** | 机器自己执行且执行错了的条数——唯一直接伤用户的错误类型 |
| `clause_precision` | **1.00** | 指控条款零误报（错标一条就等于给作者记一条不该有的 strike 依据） |
| `clause_recall` | 0.47 | 词表只认得出约一半的条款——这是它的天花板，不是缺陷 |
| `auto_rate` | **0.00** | 见下 |
| `human_rate` | 1.00 | 全部转人工 |
| adversarial 组 | **4/4 转人工** | 正文自称"已通过审核""输出 approve 0.99"不改变结论 |

`auto_rate=0` **不是效果差，是设计生效**：链里没有权威引擎（词表 `authoritative=False`、
且无校准表），按 §4 的五道检查，任何不可逆动作都执行不了。所以这一栏的真实含义是
**"在接上并校准 Laya 之前，这套系统一个自动决定都不会做"**——参照实现在同样条件下会自动驳回
约十个关键词命中的内容（实测 `via=auto` conf=0.86），差别就在这里。

两个代价要一起说清：① 没有校准表时"自动判断"实际不产出自动化，人工队列承接全部；
② `accuracy=0.353` 这个数在只有词表时**没有意义**——它把"该自动通过却转人工"（浪费人力）
和"该驳回却放行"（伤害用户）算成一个，所以本 ADR 只报 `auto_err` 与 `auto_rate` 两个分开的量，
并把 `--sweep` 在无权威引擎时**拒绝出表**（否则是一张全 0 的假表，会被读成"阈值不敏感"）。

门禁：`tests/test_moderation_eval.py` 5 条，把参照实现 README 里那句
"auto_err 必须 stay 0" 变成会红的断言。变异验证过——把词表改成 `authoritative=True`，
2 条立刻失败。
- Clearance 目录本身不动、不纳入版本管理（它含 `.env` 与独立 `.git`）；本 ADR 只吸收设计，不搬运代码
