# AXS 语法参考

AXS 是 Axiforge 的类 Markdown 剧本语言，用于在 **Studio → 剧本模式** 中高效编写视觉小说式叙事。本文描述的内容与 `packages/axs` 解析器行为一致。

## 什么是 AXS

- **对等双视图（ADR-025）**：**剪辑台与 AXS 文本是同一 Draft 的对等视图**，均可直接编辑。`axs_source` 为可版本化的文本投影快照，不再是全局真相源。
- **三轨投影**：同一作品可在 **剪辑 / 剧本 / 结构（Flow）** 三种视图间切换；任一视图保存后其余视图按需同步。
- **冲突策略**：以 **最后编辑者权威（last-editor-wins）** 为准；剪辑台保存时若剧本文本有独立未保存编辑，则保留文本不覆盖。解析器为每条指令记录源行号（`lineMap`），支持片段 ⇄ AXS 行号双向定位与最小 diff 构想。
- **迷你精修器**：剪辑台 Inspector「演出」面板内嵌 **AXS 片段** 迷你编辑器，选中时间轴片段即高亮对应 AXS 行，光标所在行反向高亮片段。

## Beat（桥段）

每个 Beat 由标题行开启，使用一级或二级标题：

```axs
# 开场
## 子场景（同样视为 Beat）
```

### 标题行注解

标题行可附带舞台、锚点、结局与进入条件（顺序不限，可组合）：

```axs
# 雨夜 @stage(公寓) [key: intro] [ending: 真结局] [if: flag.done == true]
```

| 注解 | 含义 |
|------|------|
| `@stage(舞台名)` | 归属舞台/场景，用于分场与布局 |
| `[key]` 或 `[key: 名称]` | 锚点 Beat，便于跳转或引用 |
| `[ending: 结局名]` | 标记为结局桥段 |
| `[if: 条件表达式]` | 进入该 Beat 的前置条件（见下文「条件表达式」） |

> **写法提醒**：键名要写在冒号右边——`[key: intro]` 才是给这一拍起名。
> 只把名字塞进方括号（如 `[intro]`）不会生效，编辑器会在诊断里提示可用的三种形式（提示不阻止保存）。

## 对白与旁白

> **冒号必须是半角 `:`**——`堰纱: 你来了。` 才会生成对白（说话人 = 堰纱）。
> 写成全角 `堰纱：你来了。` 时这一行**整行按旁白处理**：说话人不会被猜出来，冒号与前缀会原样出现在玩家端文本里。
> 因此 `旁白：她转身离开。` 这类写法是合法的——它就是"整行文本的旁白"，`旁白：` 是正文的一部分，不是指令。

### 角色台词

```axs
堰纱: 你好。
堰纱(smile): 谢谢你的帮助。
```

带括号的写法会先 `@show` 对应表情，再输出对白。

### 旁白

不含 `角色名:` 格式的**纯文本行**视为旁白（叙述）：

```axs
雨打在窗上，夜色很深。
```

## 选项与跳转

### 选项

以 `>` 开头的行表示玩家选项：

```axs
> 帮忙 -> 信任
> 离开
```

- `-> 目标Beat标题` 指定跳转目标（按 Beat **标题** 匹配，非内部 id）
- **同名 Beat**：标题按出现顺序编号——第一个沿用裸标题，之后的依次写作 `标题-2`、`标题-3`。
  因此 `-> 开场` 在同名多个时指向**第一个**；要指向第二个，写 `-> 开场-2`。
  这条规则是确定的，不是随机——但编辑器会在这一行给一条黄色提示，告诉你「这里指的是第 1 个，想指第 2 个请写 `开场-2`」（提示不阻止保存）。
  桌面端保存剧本时会自动采用这个消歧写法，不会把分支悄悄指到同名的另一桥段。
- 省略 `->` 时，选项仍会与**下一个顺序相邻的 Beat** 连边（见下方自动连边）
- **一拍只印得出第一组选项**：同一桥段里若有两组选项（在剪辑台「演出」面板点两次「+ 分支」就是这样），
  导出的 AXS 文本只写第一组，第二组连同它的选项不进文本。结构视图与播放都不受影响——它们在图里还在，
  但**从文本读不回来**。界面不会静默：演出段的「AXS 片段」那一栏会给出这条说明，
  保存之后剧本页顶部也挂一条不会自己消失的常驻提示，写清哪一拍、总共几组、丢了几个选项、落在第几行。
  还没保存就切到「剧本」页也同样会挂这条提示——那一页显示的就是当前画布摊平的文本，少了什么只能在那里说。
  想让它读得回来，只有两条路：把后面的选项**并进第一组**，或把这一拍**拆成两拍**。

### 显式跳转

单独一行的 `->` 表示无条件跳转到指定 Beat：

```axs
-> 结局
```

显式跳转会**覆盖**与下一 Beat 的默认顺序连边。

### 自动连边规则

- 两个 Beat 在文档中**相邻排列**，且前一个 Beat 末尾没有显式 `->` 时，会自动添加默认边。
- 含选项的 Beat：每个选项可指向不同目标；未写 `->` 的选项默认连到**下一个 Beat**。

## 演出指令

以 `@` 开头的行是指令（directive），在播放时控制画面与声音。

| 指令 | 示例 | 说明 |
|------|------|------|
| `@bg` | `@bg apartment` | 切换背景图 |
| `@bgm` | `@bgm rain loop` | 背景音乐；加 `loop` 循环播放 |
| `@se` | `@se door_open` | 音效 |
| `@voice` | `@voice line_01` | 语音资源 |
| `@wait` | `@wait 500` | 等待毫秒数 |
| `@transition` | `@transition fade 400` | 转场；种类限 `fade` / `dissolve` / `wipe` / `cut`，时长为毫秒数 |
| `@fx` | `@fx rain` | 全屏特效；限 `flash` / `rain` / `snow` / `sakura` / `none` |
| `@camera` | `@camera zoom 1.2` | 镜头；动作限 `zoom` / `pan` / `shake` / `reset`，`zoom` 后跟数字缩放比 |
| `@show` | `@show 堰纱 smile left` | 显示角色立绘（角色、表情、位置） |
| `@hide` | `@hide 堰纱` | 隐藏角色 |
| `@move` | `@move 堰纱 center` | 移动立绘位置 |

## 状态效果

在 Beat 内写入状态变更，格式为 `key = value`：

```axs
@flag met = true
@memory score = 10
@state 堰纱.mood = calm
@relation 堰纱.玩家.trust = high
@codex 堰纱.trust = high
```

| 指令 | 作用 |
|------|------|
| `@flag` | 剧本旗标（分支条件常用） |
| `@memory` | 玩家记忆变量 |
| `@state` | 角色运行时状态（`角色.key`） |
| `@relation` | 关系变化（`A.B.关系=值`，如 `@relation 堰纱.玩家.trust = high`） |
| `@codex` | 写入角色图鉴/Codex 字段 |

值支持布尔、数字、引号字符串与裸词（见「字面量」）。

## 条件表达式

用于 Beat 标题行的 `[if: ...]`：

```axs
[if: flag.trust == true]
[if: memory.score >= 10 && flag.met == true]
```

### 前缀与含义

| 前缀 | 示例 |
|------|------|
| `flag.` | `flag.intro_seen == true` |
| `memory.` | `memory.chapter != 2` |
| `state.` | `state.堰纱.mood == calm` |
| `codex.` | `codex.堰纱.trust contains high` |
| `relation.` | `relation.堰纱.玩家.trust == high` |

### 运算符

`==`、`!=`、`>`、`<`、`>=`、`<=`、`contains`

`>=` 与 `<=` 含边界值本身（`memory.score >= 10` 在分数正好是 10 时成立）。

多个条件用 `&&` 连接，表示**全部满足**（逻辑与）。

### 字面量

- 布尔：`true` / `false`
- 数字：`42`、`3.14`
- 字符串：`"带空格的值"` 或 `'单引号'`
- 裸词：`calm`（无空格时）

## 完整示例

### 示例一：开场与选项

```axs
# 开始 @stage(街道)
@bg street_day
@bgm theme loop
路人: 需要帮忙吗？
> 点头 -> 信任
> 摇头

# 信任
堰纱: 多谢。
@flag helped = true
```

### 示例二：结局与条件

```axs
# 雨夜 @stage(公寓) [key: intro] [ending: 真结局] [if: flag.done == true]
@bg apartment_night
堰纱: 终于结束了。
```

### 示例三：演出与状态

```axs
# 开场
@bg apartment
@bgm rain loop
@wait 500
@flag met = true
堰纱(smile): 欢迎回来。
@hide 堰纱
旁白：她转身离开。
```

## 综合示例：全功能一览

以下示例在一篇短剧本中串联 **场景、角色、对白、选项、跳转、演出、特效、状态与条件结局**。角色名需与作品中已绑定的演员一致；背景/音效/立绘资源 id 需与资产库对应。

```axs
# 序章·雨夜相遇 @stage(旧城区街道) [key: prologue]
@transition fade 600
@bg old_street_rain
@bgm city_rain loop
@fx rain
@camera zoom 1.05
@wait 800

旁白：便利店霓虹在积水里碎成一片片冷光。
店主: 这么晚还在外面？

@show 堰纱 neutral left
@se door_chime
堰纱: 只是路过。
堰纱(serious): ……不对，我在找一样东西。

@flag met_yansha = true
@memory chapter = 1
@state 堰纱.mood = wary
@codex 堰纱.trust = low

> 追问信物 -> 巷口密谈
> 递上旧地图 -> 信任开端
> 沉默离开

# 巷口密谈 @stage(后巷) [if: flag.met_yansha == true]
@transition dissolve 500
@bg alley_night
@bgm tension
@hide 店主
@move 堰纱 center

堰纱(whisper): 你见过这枚徽章吗？
旁白：她摊开掌心，一枚生锈的齿轮徽章闪着微光。
@memory saw_badge = true
@flag quest_active = true

> 接过徽章 -> 信任开端
> 拒绝卷入 -> 冷淡结局

# 信任开端 @stage(后巷) [key: trust_route]
@bgm hope_theme loop
@fx none
堰纱(smile): 谢谢你愿意听我说。
@state 堰纱.mood = calm
@codex 堰纱.trust = medium
@memory score = 10
@flag trust_path = true

旁白：远处传来警笛，道具「旧地图」在背包中微微发烫——你决定明天去码头一探究竟。
-> 章节间幕

# 冷淡结局 @stage(后巷) [ending: 擦肩而过]
@bgm wind
堰纱: ……明白了。
@hide 堰纱
@flag trust_path = false
旁白：她消失在雨幕里，徽章的故事就此封存。

# 章节间幕 @stage(公寓窗前) [if: flag.trust_path == true && memory.score >= 10]
@transition fade 800
@bg apartment_window
@bgm quiet_night
@wait 1200
@camera zoom 1.0

旁白：雨停了。你望向码头方向，知道真正的故事才刚刚开始。
@flag chapter1_clear = true

# 真结局 @stage(码头黎明) [ending: 黎明之约] [if: flag.chapter1_clear == true && codex.堰纱.trust contains medium]
@transition fade 1000
@bg dock_sunrise
@bgm ending_theme loop
@show 堰纱 smile center
@voice ending_line_01

堰纱: 下次，请让我把完整的故事讲给你听。
@memory ending_seen = true
@flag game_clear = true
```

**示例涵盖能力对照：**

| 类别 | 文中用法 |
|------|----------|
| 场景 / 舞台 | `@stage(旧城区街道)`、`@stage(后巷)` 等切换分场 |
| 角色 / 对白 | `店主:`、`堰纱(smile):` 台词与表情 |
| 旁白 | 纯文本叙述行 |
| 选项 / 分支 | `> … -> 目标Beat` |
| 显式跳转 | `-> 章节间幕` |
| 条件进入 | `[if: flag.met_yansha == true]` |
| 结局 | `[ending: 擦肩而过]`、`[ending: 黎明之约]` |
| 背景 / 音乐 / 音效 | `@bg`、`@bgm … loop`、`@se` |
| 立绘 | `@show`、`@hide`、`@move` |
| 镜头 / 转场 / 特效 | `@camera`、`@transition`、`@fx` |
| 等待 | `@wait` |
| 语音 | `@voice` |
| 旗标 / 记忆 / 状态 / 图鉴 | `@flag`、`@memory`、`@state`、`@codex` |
| 道具（叙事层） | 旁白中提及「旧地图」；用 `@memory` / `@flag` 记录是否获得 |

> **说明**：AXS 当前不单独提供 `@item` 指令；道具获得与使用通常通过 **旁白 + `@flag` / `@memory`** 表达，演出层资源以 `@bg` / `@se` / 立绘 id 为准。

## 诊断与容错

保存或编辑时，解析器会产生诊断信息：

- **未知 `@指令`**：记为 warning，该行**原样保留**在 `passthrough` 中，不会丢失内容。
- **重名 Beat 标题**：自动为内部 id 添加 `-2`、`-3` 等后缀以区分。
- **无法解析的条件**：warning，Beat 仍会创建，但 `if` 条件可能为空。
- **认不出的方括号标记**：warning，列出 `[key: 名称]`、`[ending: 名称]`、`[if: 条件]` 三种可用形式；标题照常保留。
- **取值不在列表里的演出指令**（如 `@transition slide`、`@fx disco`、`@camera wiggle`）：warning 给出该族的可用值；这一行照常保留，但播放端不会有对应效果。
- **数字参数不是数字**（如 `@wait soon`、`@camera zoom big`）：warning 说明按 `0` 处理或已忽略该参数。

在剧本模式右侧可查看 Beat 列表与诊断条数。

## 相关入口

- **Studio**：打开作品 → 顶部切换到 **剧本** 模式
- **保存**：剧本模式点击「保存剧本」，将 `{ axs_source, nodes, edges }` 提交到服务端同步
- **双向定位**：在剧本与剪辑/Flow 间可跳转到对应 Beat

## 延伸阅读

- 工程决策：`docs/ADR/025-axs-peer-dual-view.md`（对等双视图，替代 ADR-016）、`docs/ADR/016-axs-narrative-language.md`（历史背景）
