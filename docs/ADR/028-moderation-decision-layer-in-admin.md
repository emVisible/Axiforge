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
（真机接通后成了六道——多出的 `refusal` 见文末「因此新增的决定」§13）

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

`backend/eval/moderation_eval.py` + 34 条样本（clean 12 / reject 10 / human 8 / adversarial 4）。
两列分别是"只有词表"与"接上真 Laya + 拟合温度表"：

| 指标 | 仅词表 | 真 Laya（已标定） | 读法 |
|---|---|---|---|
| `auto_err` | **0** | **0** | 机器自己执行且执行错了的条数——唯一直接伤用户的错误类型 |
| `auto_rate` | 0.00 | 0.00 | 见下："0" 在这里是**测出来的结论**，不是没做完 |
| `human_rate` | 1.00 | 1.00 | 全部转人工 |
| `clause_precision` | **1.00** | 0.11 | 词表指控零误报；Laya 的条款归属在本题集上基本不可用 |
| `clause_recall` | 0.47 | 0.16 | 词表只认得出约一半条款——那是它的天花板 |
| adversarial 组 | 4/4 转人工 | 4/4 转人工 | 正文自称"已通过审核""输出 approve 0.99"不改变结论 |

参照实现在同样条件下会自动驳回约十个关键词命中的内容（实测 `via=auto` conf=0.86），
并且它的 README 只写着 "auto_err must stay 0" 而没有一张能证伪它的表。

两个代价要一起说清：① 人工队列承接全部；② `accuracy` 这个数在两套链上都**没有意义**——
它把"该自动通过却转人工"（浪费人力）和"该驳回却放行"（伤害用户）算成一个，
所以本 ADR 只报 `auto_err` 与 `auto_rate` 两个分开的量。

门禁：`tests/test_moderation_eval.py` 把参照实现那句口号变成会红的断言；
`--sweep` 在无权威引擎时**拒绝出表**（否则是一张全 0 的假表，会被读成"阈值不敏感"），
在有权威引擎但未标定时**改口**（说明是第 4 道门在挡，不是阈值不敏感）。
变异验证过——把词表改成 `authoritative=True`，2 条立刻失败。
- Clearance 目录本身不动、不纳入版本管理（它含 `.env` 与独立 `.git`）；本 ADR 只吸收设计，不搬运代码


## 接通真机之后（2026-09-27 实测）

先前记在这里的三步"不是代码"的清单，前两步在机器上已被证伪：`laya 0.3.7 + torch 2.14.0`
早就装在 `Clearance/vendor/laya_sidecar/.venv`，checkpoint 也在 HF 缓存里——
当时的判断错在只探了系统 Python 和 Clearance 主 venv。真机接通后跑出来的东西比预期有价值：

**路由不是问题。** 中文正文由 `multilingual` 处理，`routing.reason` 直接给出脚本占比
（如 `non-Latin script (han, 83% of letters); the English checkpoint cannot read it`）。
"是不是用英文 checkpoint 读中文才崩"这个怀疑，被这条字符串当场否掉。
**sidecar 已迁入本仓库** `backend/sidecar/`（`server.py` + `calibration.py` + `pyproject.toml`）：
判断层如果只能靠参照项目的目录才能起进程，那它就没有真的融进中台。
参照那份只作为过程主机（提供 venv）被复用。MPS 上单条判定 ~0.7s，双 checkpoint 常驻。

### 三处只有真机能照出来的缺陷（都已修，各有回归测试）

1. **置信度量纲错。** Laya 对 choice/score 自报的 `confidence` 实测是 **1−归一化熵**
   （分布 0.547/0.296/0.156 报 0.1076，算到第四位完全吻合），不是"判对的概率"。
   旧代码把它和 noul 的 `max(p,1−p)` 混进同一个 `min()`——两个量纲取最小值不是"最弱证据"，
   是一个无意义的数。而 approve 这条路径恰好只由 `age_rating` 支撑，
   于是**自动通过在数学上永远够不到任何阈值**。现在 `_event_p()` 一律从概率向量算，
   三种题型统一成"该风险事件的概率"。
2. **把引擎的不确定性丢了。** score 分支原来硬编码 `confidence=1.0` 并丢弃 `probabilities`：
   既伪造满格证据（干净散文以 conf=1.00 走完前四道门），又让温度拟合没有原料。
   现在读引擎自报值，且落库快照带向量——否则 `export_labels.py` 导出的标注
   永远拟不出 choice/score 两题。
3. **发过不存在的条款。** `clause_for("severity") or "severity"` 在 severity 无 `clause_id` 时
   把**问题名**当条款发了出去：中台会显示一个谁也没定义过的标签，还会污染条款精度统计。
   现在 severity 不发条款，`questions.REGISTERED_CLAUSES` 成为唯一注册表，
   并有测试断言"任何规则能发出的条款都必须已注册"。

### 给案件生命周期补测试时，又照出两处（这两处不是模型给的，是测试给的）

4. **缓存命中会丢字段。** `engine.decide` 的缓存快路径是"逐字段重建一个 Outcome"，
   漏掉了 `authoritative` 与 `calibrated` ——它们静默掉回默认 False。
   后果不在那次判定（动作已经算完了），而在**下一次**：服务层把"资格从 True 变 False"
   读成"结论变了"，于是每次重复审同一篇都会写案件、去重统计永远是"没命中"。
   改成 `dataclasses.replace(cached, dedupe_hit=True)`：会漏字段的写法本身就是错的形态。
5. **判定历史不能按 `id` 排序。** `moderation_decision_logs.id` 是 uuid4，
   按它 `ORDER BY` 等于随机——我自己新写的测试先在这里给出过一次"顺序完全颠倒"的假信号。
   表上建的索引是 `(case_id, created_at)`，读历史也必须按 `created_at`。

### 阈值不是保守，是扫出来的

`--sweep` 现在把通过线一路探到会出错为止（同一批模型答案，只换策略层）：

| approve 线 | auto_rate | auto_err | 被误执行的样本 |
|---|---|---|---|
| 0.55 | 0.324 | **4** | reject-05 制毒教程、reject-07 开锁教程、human-05 活体解剖、human-06 吞药美化 |
| 0.65 | 0.147 | 2 | reject-05、human-05 |
| 0.75 | 0.059 | 1 | reject-05 |
| ≥0.80 | 0.000 | 0 | — |

也就是说：**在这套内容上，"既自动化又不误伤"的通过通道是空集**。
把线从 0.90 降到 0.75 换来 2 条稿子自动发布，代价是一篇冰毒合成教程公开。
0.90/0.95 因此保持不动——它现在是有表可依的数，不是一个信仰值。

### 两个仍在的阻断（都不是代码缺口）

- **A｜自动通过**：卡点是 `age_rating` 的分布本身（干净散文上 P(成人) 仍有 0.15–0.35），
  而这题在 34 行自标注集上拟合出的最优温度就是 T=1.0（无改善）。
  要么用真实处置标注重拟，要么改窄 approve 的判据（"分级明确不是成人"→"该结论的证据是什么"）——
  后者是新的产品决策，要另开 ADR，不在这里顺手改。
- **B｜自动驳回**：链里唯一不受 `HUMAN_ONLY_CLAUSES` 一票否决的条款是 `spam_promotion`，
  而 Laya 在导流文本上会把 `illegal_act_instruction` / `pii_real_person` 同时顶到 1.0，
  于是每条垃圾广告都"顺带"命中了需人工条款。这是**题集设计**问题（七条独立 noul 各自饱和），
  下一个实验是把条款改成单选（choice：9 选 1）+ 一条"有无问题"的 noul，
  用同一份 `moderation_eval.py` 量它能不能把 clause 精度从 0.11 抬起来。

### 因此新增的决定

9. **sidecar 归属本仓库**：`backend/sidecar/`，`CALIBRATION_FILE` 默认指向 `backend/eval/calibration.json`。
10. **温度表不入库**（`.gitignore`）。它是产物，真相源是标注集；提交一份 34 行自标注的
    in-sample 拟合，等于把"执行资格"发给一个自己给自己打的分数。
11. **Laya 的 `clause_ids` 只作参考**：不写进 `violations.clause`、不参与 strike。
    实测精度 0.11；条款归属的权威来源仍是词表与人工。这条把此前挂着的那个待决问题结掉了。
12. **幂等键纳入模型状态**（`content_fingerprint(subject, policy, model_versions)`）：
    换 checkpoint 或重拟温度表后，旧结论必须以新模型的名义重算，
    否则"改了标定"这件事在缓存与去重上全都不可见。
    命中已有案件时按新结论**更新案件**（`moderation_decision_logs` 保留每一次的完整记录），
    但人已结案的不覆盖——机器的新意见不重开人的决定。
13. **门控加第六道：显式 `refusal`**。超长正文被拒时，队列原先显示"置信度未校准"，
    运营会去重拟温度表，而真正该做的是分段。"看不全"和"没标定"必须是两个值。
    同理 `via` 现在带上具体条款与规则名（`human_only_clause:doxxing`、
    `suggested_human:high_severity`、`below_approve_line 0.77<0.90`）：
    一队列全都写着"转人工"时，运营无法区分该先处理哪条。

### 现在到"真的自动"之间还差什么

按顺序，且第 2 步之前不要谈自动化率：

1. 起后端与 sidecar（`MODERATION_ENABLED=true`），让判断层以**建议**身份跑一段，攒案件与处置。
2. `eval/export_labels.py` 导出「带类型化答案 + 已人工结案」的标注（现在会顺带报告
   其中多少条带概率向量——不带向量的旧案件只能重拟二元轴），`eval/calibrate.py` 重拟。
   只有 9/9 题都被覆盖，客户端才认为整链已标定；部分标定一律转人工。
3. 把 34 行单人标注集升级成多人一致金集。在那之前，本 ADR 的所有准确率数字
   只能说明"实现与策略自洽、失败时安全"，不能对外宣称模型效果。
4. 词表外置为可热更配置；`report` 队列与本队列的联动。

第 2 步有先有鸡还是先有蛋的性质，而且这一轮把它测准了：**蛋（标注）只能从"纯建议模式"的人工处置里来，
而鸡（温度表）在拿到真实标注之前拟合出来的任何自动化率都是自证的**。
所以"后续我直接通过 Laya 去进行一个自动判断"这句话，工程上此刻成立的是前半句——
通道、契约、留痕、门禁、队列、可复现键全都通了；后半句的开关是标注量，不是代码。

