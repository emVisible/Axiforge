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
