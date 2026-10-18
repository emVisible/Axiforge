import { describe, it, expect } from "vitest";
import { start, proceed, choose, restore, StoryRuntime } from "./engine";
import type { StoryPackage } from "./ir";

/** 显式 to 分支 + 演出指令 + 效果 的样例包 */
function explicitBranchPackage(): StoryPackage {
  return {
    irVersion: 1,
    projectId: "p1",
    title: "样例",
    startBeatId: "intro",
    characters: [{ id: "c1", name: "爱丽丝" }],
    scenes: [{ id: "s1", title: "房间" }],
    beats: [
      {
        id: "intro",
        sceneId: "s1",
        script: [
          { op: "bg", image: "room.png" },
          { op: "show", characterId: "c1", expression: "smile", position: "center" },
          { op: "say", characterId: "c1", text: "你好，旅行者。" },
          { op: "say", text: "（她微笑着看向你。）" },
          {
            op: "choice",
            options: [
              { label: "接受", to: "good" },
              { label: "拒绝", to: "bad" },
            ],
          },
        ],
        effects: [{ type: "flag", key: "met_alice", value: true }],
      },
      {
        id: "good",
        script: [{ op: "say", characterId: "c1", text: "太好了！" }],
        effects: [{ type: "memory", key: "ending", value: "good" }],
        isEnding: true,
      },
      {
        id: "bad",
        script: [{ op: "say", characterId: "c1", text: "真遗憾……" }],
        isEnding: true,
      },
    ],
    transitions: [],
  };
}

describe("engine — 演出与显式分支", () => {
  it("start 累积演出指令直到第一个 say", () => {
    const { view } = start(explicitBranchPackage());
    expect(view.waiting).toBe("say");
    expect(view.beatId).toBe("intro");
    expect(view.directives.map((d) => d.op)).toEqual(["bg", "show"]);
    expect(view.line?.speaker).toBe("爱丽丝");
    expect(view.line?.text).toBe("你好，旅行者。");
  });

  it("proceed 推进到旁白（无 speaker）", () => {
    const pkg = explicitBranchPackage();
    let r = start(pkg);
    r = proceed(pkg, r.state);
    expect(r.view.waiting).toBe("say");
    expect(r.view.line?.speaker).toBeNull();
    expect(r.view.line?.text).toContain("微笑");
    expect(r.view.directives).toHaveLength(0);
  });

  it("proceed 到 choice 暂停点", () => {
    const pkg = explicitBranchPackage();
    let r = start(pkg);
    r = proceed(pkg, r.state); // 旁白
    r = proceed(pkg, r.state); // choice
    expect(r.view.waiting).toBe("choice");
    expect(r.view.choices?.map((c) => c.label)).toEqual(["接受", "拒绝"]);
    expect(r.view.choices?.every((c) => !c.disabled)).toBe(true);
  });

  it("choose 显式 to：进入 good，并在完成 intro 时应用效果", () => {
    const pkg = explicitBranchPackage();
    let r = start(pkg);
    r = proceed(pkg, r.state);
    r = proceed(pkg, r.state);
    r = choose(pkg, r.state, 0); // 接受 → good
    expect(r.view.beatId).toBe("good");
    expect(r.view.waiting).toBe("say");
    expect(r.view.line?.text).toBe("太好了！");
    // intro 完成 → flag 生效
    expect(r.state.vars.flags.met_alice).toBe(true);
    expect(r.state.completedBeats).toContain("intro");
  });

  it("走到结局：状态 ended，记忆效果生效", () => {
    const pkg = explicitBranchPackage();
    let r = start(pkg);
    r = proceed(pkg, r.state);
    r = proceed(pkg, r.state);
    r = choose(pkg, r.state, 0);
    r = proceed(pkg, r.state); // 完成 good
    expect(r.view.waiting).toBe("end");
    expect(r.view.isEnding).toBe(true);
    expect(r.state.status).toBe("ended");
    expect(r.state.vars.memory.ending).toBe("good");
  });
});

/** 基于 label 的转场（不带显式 to）+ trigger 条件 */
function labelTransitionPackage(): StoryPackage {
  return {
    irVersion: 1,
    projectId: "p2",
    title: "标签转场",
    startBeatId: "a",
    characters: [],
    scenes: [],
    beats: [
      {
        id: "a",
        script: [
          { op: "say", text: "选择方向" },
          { op: "choice", options: [{ label: "左" }, { label: "右" }] },
        ],
      },
      { id: "L", script: [{ op: "say", text: "向左" }], isEnding: true },
      { id: "R", script: [{ op: "say", text: "向右" }], isEnding: true },
    ],
    transitions: [
      { from: "a", to: "L", label: "左" },
      { from: "a", to: "R", label: "右" },
    ],
  };
}

describe("engine — label 转场", () => {
  it("choose 按 label 匹配转场", () => {
    const pkg = labelTransitionPackage();
    let r = start(pkg);
    r = proceed(pkg, r.state); // choice
    r = choose(pkg, r.state, 1); // 右
    expect(r.view.beatId).toBe("R");
    expect(r.view.line?.text).toBe("向右");
  });
});

describe("engine — trigger 条件门控转场", () => {
  it("目标 Beat trigger 不满足则跳过，取下一个可行转场", () => {
    const pkg: StoryPackage = {
      irVersion: 1,
      projectId: "p3",
      title: "门控",
      startBeatId: "a",
      characters: [],
      scenes: [],
      beats: [
        { id: "a", script: [{ op: "say", text: "start" }] },
        {
          id: "locked",
          script: [{ op: "say", text: "锁住的" }],
          trigger: { type: "flag", key: "key", operator: "eq", value: true },
          isEnding: true,
        },
        { id: "open", script: [{ op: "say", text: "开放的" }], isEnding: true },
      ],
      // locked 在前，但 trigger 不满足 → 应落到 open
      transitions: [
        { from: "a", to: "locked" },
        { from: "a", to: "open" },
      ],
    };
    let r = start(pkg);
    r = proceed(pkg, r.state); // 完成 a → 转场
    expect(r.view.beatId).toBe("open");
  });
});

describe("engine — restore 存档续玩（v1.2 桥4）", () => {
  it("从暂停点恢复：同一帧 + 回放当前 Beat 的演出指令 + 变量保留", () => {
    const pkg = explicitBranchPackage();
    // 推进到旁白暂停点并"存档"
    let r = start(pkg);
    r = proceed(pkg, r.state); // 旁白（cursor 指向 index 3，之前有 bg/show）
    const saved = JSON.parse(JSON.stringify(r.state)); // 模拟序列化落库再读回

    const restored = restore(pkg, saved);
    expect(restored.view.waiting).toBe("say");
    expect(restored.view.beatId).toBe("intro");
    expect(restored.view.line?.text).toContain("微笑");
    // 回放当前 Beat 游标之前的 bg/show，恢复画面
    expect(restored.view.directives.map((d) => d.op)).toEqual(["bg", "show"]);
  });

  it("续玩后能正常走到结局并保留累积效果", () => {
    const pkg = explicitBranchPackage();
    let r = start(pkg);
    r = proceed(pkg, r.state);
    r = proceed(pkg, r.state); // choice
    const saved = JSON.parse(JSON.stringify(r.state));

    let cont = restore(pkg, saved);
    expect(cont.view.waiting).toBe("choice");
    cont = choose(pkg, cont.state, 0); // 接受 → good（完成 intro，flag 生效）
    expect(cont.state.vars.flags.met_alice).toBe(true);
    cont = proceed(pkg, cont.state);
    expect(cont.state.status).toBe("ended");
    expect(cont.state.vars.memory.ending).toBe("good");
  });

  it("存档已结束：携带既有变量从头开始（角色仍记得你）", () => {
    const pkg = explicitBranchPackage();
    const saved = {
      currentBeatId: null,
      cursor: 0,
      vars: { memory: {}, flags: { met_alice: true }, characters: { c1: { affection: 30 } }, relationships: {} },
      codex: {},
      completedBeats: ["intro", "good"],
      unlockedAchievements: [],
      status: "ended" as const,
      pendingChoiceLabel: null,
      pendingChoiceTarget: null,
    };
    const restored = restore(pkg, saved);
    expect(restored.view.beatId).toBe("intro");
    expect(restored.state.vars.flags.met_alice).toBe(true);
    expect(restored.state.vars.characters.c1.affection).toBe(30);
    expect(restored.state.completedBeats).toEqual([]);
  });
});

describe("engine — 指令集 v1（演出加宽，桥2）", () => {
  const pkg: StoryPackage = {
    irVersion: 1,
    projectId: "pv1",
    title: "演出v1",
    startBeatId: "b",
    characters: [{ id: "c1", name: "阿米娅" }],
    scenes: [],
    beats: [
      {
        id: "b",
        script: [
          { op: "bg", image: "bg.png" },
          { op: "transition", kind: "fade", ms: 400 },
          { op: "show", characterId: "c1", expression: "smile", position: "left" },
          { op: "camera", action: "zoom", scale: 1.2, ms: 300 },
          { op: "fx", effect: "rain", ms: 1000 },
          { op: "voice", sound: "v001.ogg" },
          { op: "narration", text: "雨落下来了。", rich: true },
          { op: "move", characterId: "c1", position: "center", ms: 250 },
          { op: "say", characterId: "c1", text: "博士，好久不见。" },
        ],
        isEnding: true,
      },
    ],
    transitions: [],
  };

  it("start 累积所有 presentation 指令直到 narration 暂停", () => {
    const { view } = start(pkg);
    expect(view.waiting).toBe("say");
    expect(view.directives.map((d) => d.op)).toEqual([
      "bg",
      "transition",
      "show",
      "camera",
      "fx",
      "voice",
    ]);
    // narration 作为暂停点，speaker 为空、rich 透传
    expect(view.line?.speaker).toBeNull();
    expect(view.line?.text).toBe("雨落下来了。");
    expect(view.line?.rich).toBe(true);
  });

  it("narration 之后 proceed：move 累积，停在角色 say", () => {
    let r = start(pkg);
    r = proceed(pkg, r.state);
    expect(r.view.directives.map((d) => d.op)).toEqual(["move"]);
    expect(r.view.waiting).toBe("say");
    expect(r.view.line?.speaker).toBe("阿米娅");
    expect(r.view.line?.text).toContain("好久不见");
  });
});

describe("StoryRuntime 类封装", () => {
  it("提供有状态的 proceed / choose", () => {
    const rt = new StoryRuntime(explicitBranchPackage());
    expect(rt.view.waiting).toBe("say");
    rt.proceed();
    rt.proceed();
    expect(rt.view.waiting).toBe("choice");
    rt.choose(1); // 拒绝 → bad
    expect(rt.view.beatId).toBe("bad");
    rt.proceed();
    expect(rt.ended).toBe(true);
  });
});

/**
 * 下面三组此前一条都没走到（实测 engine.ts 语句覆盖 77.44%，未覆盖行正是这些）。
 * 「引擎不是业务代码」要求的是分支被证明过，而不是 happy path 跑通。
 */
describe("engine — wait 与未知指令", () => {
  const pkgWith = (script: StoryPackage["beats"][number]["script"]): StoryPackage => ({
    irVersion: 1,
    projectId: "p1",
    title: "T",
    startBeatId: "b1",
    characters: [],
    scenes: [],
    beats: [{ id: "b1", script }],
    transitions: [],
  });

  it("wait 停在 waiting:wait 并带上毫秒；proceed 之后走到下一个 say", () => {
    const pkg = pkgWith([{ op: "wait", ms: 800 }, { op: "say", text: "稍后" }]);
    const first = start(pkg);
    expect(first.view.waiting).toBe("wait");
    expect(first.view.waitMs).toBe(800);
    const next = proceed(pkg, first.state);
    expect(next.view.waiting).toBe("say");
    expect(next.view.line?.text).toBe("稍后");
  });

  it("未知指令被跳过而不是崩——新 op 要能被旧渲染器忽略", () => {
    const pkg = pkgWith([
      { op: "shake" } as unknown as StoryPackage["beats"][number]["script"][number],
      { op: "say", text: "照旧" },
    ]);
    const r = start(pkg);
    expect(r.view.waiting).toBe("say");
    expect(r.view.line?.text).toBe("照旧");
    expect(r.view.directives).toEqual([]);
  });

  it("脚本走完后没有出边 → ended；proceed 再点一次不越界、不重复推进", () => {
    const pkg = pkgWith([{ op: "say", text: "最后一句" }]);
    const r1 = start(pkg);
    const r2 = proceed(pkg, r1.state);
    expect(r2.view.waiting).toBe("end");
    expect(r2.state.status).toBe("ended");
    const r3 = proceed(pkg, r2.state);
    expect(r3.state.cursor).toBe(r2.state.cursor);
    expect(r3.view.directives).toEqual([]);
  });
});

describe("engine — 起始 Beat 的回退", () => {
  it("startBeatId 缺失时优先「无入边、无 trigger 且含 say」的 Beat", () => {
    const pkg: StoryPackage = {
      irVersion: 1, projectId: "p1", title: "T", startBeatId: null,
      characters: [], scenes: [],
      beats: [
        { id: "a", script: [{ op: "bg", image: "x.png" }], transitionsTo: undefined },
        { id: "b", script: [{ op: "say", text: "开场白" }] },
        { id: "c", script: [{ op: "say", text: "有入边" }], trigger: { type: "flag", key: "k" } },
      ],
      transitions: [{ from: "a", to: "c" }],
    } as unknown as StoryPackage;
    expect(start(pkg).view.beatId).toBe("b");
  });

  it("每个 Beat 都有入边时退回第一个；空 beats 不抛错而是 ended", () => {
    const cyclic = {
      irVersion: 1, projectId: "p1", title: "T", startBeatId: null,
      characters: [], scenes: [],
      beats: [
        { id: "a", script: [{ op: "say", text: "A" }] },
        { id: "b", script: [{ op: "say", text: "B" }] },
      ],
      transitions: [{ from: "a", to: "b" }, { from: "b", to: "a" }],
    } as unknown as StoryPackage;
    expect(start(cyclic).view.beatId).toBe("a");

    const empty = {
      irVersion: 1, projectId: "p1", title: "T", startBeatId: null,
      characters: [], scenes: [], beats: [], transitions: [],
    } as StoryPackage;
    const r = start(empty);
    expect(r.view.waiting).toBe("end");
    expect(r.state.status).toBe("ended");
  });

  it("存档指向本包没有的 Beat（拿错工程的档）→ 从头开始而不是崩或空白", () => {
    const pkg = {
      irVersion: 1, projectId: "p1", title: "T", startBeatId: "a",
      characters: [], scenes: [],
      beats: [{ id: "a", script: [{ op: "say", text: "A" }] }],
      transitions: [],
    } as StoryPackage;
    const foreign = restore(pkg, {
      currentBeatId: "别的工程的拍", cursor: 0,
      vars: { memory: { flag: true }, flags: {}, characters: {}, relationships: {} },
      completedBeats: [], codex: {}, unlockedAchievements: [], status: "playing",
    } as never);
    expect(foreign.view.beatId).toBe("a");
    // 进度变量要留住：从头开始 ≠ 把玩家已经攒的东西清光
    expect(foreign.state.vars.memory).toEqual({ flag: true });
  });

  it("旧版存档缺 characters/relationships 子表 → 补齐空表，不再白屏", () => {
    const pkg = {
      irVersion: 1, projectId: "p1", title: "T", startBeatId: "a",
      characters: [], scenes: [],
      beats: [{ id: "a", script: [{ op: "say", text: "A" }] }],
      transitions: [],
    } as StoryPackage;
    const legacy = restore(pkg, {
      currentBeatId: "a", cursor: 0,
      vars: { memory: {}, flags: { old: true } },
      completedBeats: [], codex: null, unlockedAchievements: null, status: "playing",
    } as never);
    expect(legacy.view.line?.text).toBe("A");
    expect(legacy.state.vars.flags).toEqual({ old: true });
    expect(legacy.state.vars.characters).toEqual({});
    expect(legacy.state.vars.relationships).toEqual({});
  });
});

describe("engine — 成就门槛与播报", () => {
  const achievementPkg = (): StoryPackage => ({
    irVersion: 1,
    projectId: "p1",
    title: "T",
    startBeatId: "a",
    characters: [],
    scenes: [],
    beats: [
      {
        id: "a",
        script: [{ op: "say", text: "第一句" }],
        effects: [{ type: "flag", key: "seen", value: true }],
        transitionsTo: "b",
      },
      {
        id: "b",
        script: [
          {
            op: "choice",
            options: [
              { label: " gated", requiresAchievement: "first_look" },
              { label: "普通" },
            ],
          },
        ],
      },
    ],
    transitions: [{ from: "a", to: "b" }],
    achievements: [
      { id: "d1", key: "first_look", title: "初见", condition: { type: "flag", key: "seen", operator: "eq", value: true } },
    ],
  } as unknown as StoryPackage);

  it("Beat 完成后条件成立 → 下一个暂停点带 newlyUnlockedAchievements，且只播一次", () => {
    const pkg = achievementPkg();
    const first = start(pkg);
    expect(first.state.unlockedAchievements).toEqual([]);
    const second = proceed(pkg, first.state);
    // 越过 a 的最后一句 → 完成 a、解锁 first_look、走到 b 的 choice
    expect(second.view.waiting).toBe("choice");
    expect(second.view.newlyUnlockedAchievements?.map((a) => a.key)).toEqual(["first_look"]);
    expect(second.state.unlockedAchievements).toEqual(["first_look"]);
  });

  it("requiresAchievement 未解锁时禁用并给出原因；解锁后同一条可选", () => {
    const pkg = achievementPkg();
    const atChoice = proceed(pkg, start(pkg).state);
    const gated = atChoice.view.choices?.[0];
    // 上一行刚解锁，所以这条此刻应可选——先用未解锁的存档验证禁用
    const locked = restore(pkg, {
      ...atChoice.state, unlockedAchievements: [], newlyUnlockedAchievements: undefined,
    } as never);
    expect(locked.view.choices?.[0]?.disabled).toBe(true);
    expect(locked.view.choices?.[0]?.disabledReason).toContain("成就");
    expect(gated?.disabled).toBe(false);
  });
});

/**
 * `choose` 的两条退化路（此前未覆盖）：不在选项暂停点上点、点了不存在的序号。
 * 两者都退化为「继续」而不是抛错——渲染器在异步点击里完全可能带着过期状态进来。
 */
describe("engine — choose 的退化路", () => {
  const pkg = (): StoryPackage => {
    const src = explicitBranchPackage();
    return src;
  };

  it("停在 say 时点选项 = 等同继续，不抛错也不越界", () => {
    const p = pkg();
    const atSay = start(p);
    const r = choose(p, atSay.state, 0);
    expect(r.state.cursor).toBe(atSay.state.cursor + 1);
  });

  it("序号越界与「当前拍不存在」都退化为继续，不抛错", () => {
    // 专造一个「只有一个选项、且没有出边」的拍，好让退化后的行为可判：
    // 越过选项 → 脚本走完 → 没有出边 → ended
    const oneOption: StoryPackage = {
      irVersion: 1, projectId: "p1", title: "T", startBeatId: "a",
      characters: [], scenes: [],
      beats: [{ id: "a", script: [{ op: "choice", options: [{ label: "唯" }] }] }],
      transitions: [],
    } as unknown as StoryPackage;
    const atChoice = start(oneOption);
    expect(atChoice.view.waiting).toBe("choice");
    const oob = choose(oneOption, atChoice.state, 99);
    expect(oob.state.cursor).toBe(atChoice.state.cursor + 1);
    expect(oob.view.waiting).toBe("end");

    const gone = choose(oneOption, { ...atChoice.state, currentBeatId: "已被删掉的拍" }, 0);
    expect(gone.state.cursor).toBe(atChoice.state.cursor + 1);
  });
});
