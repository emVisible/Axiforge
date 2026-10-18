/**
 * StoryCompiler TS 版（ADR-008 桥1 · ADR-024 决策 5）
 *
 * 与 backend/app/domains/narrative/compiler.py 语义逐条对齐（金样本验收：
 * src/__golden__/ 目录：input.json → compileStory → 逐字段等于 expected.json）。
 * Python 编译器保留为对照基准；本实现使桌面端断网编译/试玩成为可能。
 *
 * 输入为 L4 存储态同构形状（与 StorageProvider 的 ProjectBundle 对齐），
 * 场景/道具资产由调用方预解析后注入（对应 Python 侧的 DB 预取）。
 */

import type {
  Beat,
  CharacterProfile,
  CharacterRef,
  ChoiceOption,
  Condition,
  Effect,
  GlossaryEntry,
  Instruction,
  ItemRef,
  SceneRef,
  StoryPackage,
  Transition,
} from "./ir";

// ============================================================
// 编译器输入（存储态同构；JSON 列以 Record 透传）
// ============================================================

export interface CompilerNodeInput {
  id: string;
  stageId?: string | null;
  editorData?: Record<string, unknown>;
  narrativeData: Record<string, unknown>;
  sortOrder?: number;
}

export interface CompilerEdgeInput {
  sourceNodeId: string;
  targetNodeId: string;
  label?: string | null;
  condition?: unknown;
}

export interface CompilerSceneInput {
  id: string;
  title: string;
  location?: string | null;
  atmosphere?: string | null;
  /** 舞台资产引用（Python 侧 DB 预取后注入；无引用为 null） */
  sceneRef?: { location?: string | null; atmosphere?: string | null; imagePath?: string | null } | null;
  /** 旧版嵌套节点回退（对齐 Python _load_project 的 scenes.nodes 兜底） */
  nodes?: CompilerNodeInput[];
}

export interface CompilerCharacterInput {
  id: string;
  name: string;
  characterData: Record<string, unknown>;
  imagePath?: string | null;
}

export interface CompilerItemInput {
  id: string;
  assetId: string;
  asset?: { id: string; name: string; category?: string | null; imagePath?: string | null } | null;
}

export interface CompilerProjectInput {
  id: string;
  title: string;
  isPublic?: boolean;
  worldSetting?: string | null;
  playMeta?: Record<string, unknown> | null;
  nodes: CompilerNodeInput[];
  edges: CompilerEdgeInput[];
  scenes: CompilerSceneInput[];
  roles: { characterRefId: string }[];
  characters: CompilerCharacterInput[];
  items: CompilerItemInput[];
}

// ============================================================
// 内部工具（与 Python 行为逐条对齐）
// ============================================================

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

interface WorkingNode {
  id: string;
  stageId: string | null;
  narrative: Record<string, unknown>;
  sortOrder: number;
}

/** 指令的宽松读取（Python 侧经 pydantic 校验；输入数据可信时形状一致） */
const opOf = (i: unknown): string | undefined =>
  isRecord(i) ? (i.op as string | undefined) : undefined;
const charIdOf = (i: unknown): string | undefined =>
  isRecord(i) ? ((i.characterId as string | undefined) ?? undefined) : undefined;
const speakerOf = (i: unknown): string | undefined =>
  isRecord(i) ? ((i.speaker as string | undefined) ?? undefined) : undefined;

/**
 * 指令归一化：对齐 Python pydantic 语义——
 * ① 只保留该 op 的已知字段（多余字段被 pydantic 剥离）
 * ② 可选字段缺失时补 null
 * 金样本逐字段一致的根基。
 */
const INSTRUCTION_FIELDS: Record<string, string[]> = {
  say: ["op", "characterId", "speaker", "text", "voice", "rich"],
  narration: ["op", "text", "voice", "rich"],
  show: ["op", "characterId", "expression", "position", "transition"],
  hide: ["op", "characterId", "transition"],
  move: ["op", "characterId", "position", "ms"],
  bg: ["op", "image", "transition"],
  bgm: ["op", "track", "fadeMs", "loop"],
  se: ["op", "sound"],
  voice: ["op", "sound"],
  camera: ["op", "action", "scale", "x", "y", "intensity", "ms"],
  transition: ["op", "kind", "ms"],
  fx: ["op", "effect", "ms"],
  wait: ["op", "ms"],
  choice: ["op", "options"],
};

function normalizeInstruction(raw: unknown): Instruction | null {
  const op = opOf(raw);
  if (!op) return null;
  const fields = INSTRUCTION_FIELDS[op];
  if (!fields) return null;
  const src = isRecord(raw) ? raw : {};
  const out: Record<string, unknown> = {};
  for (const f of fields) {
    out[f] = src[f] ?? null;
  }
  if (op === "choice" && Array.isArray(src.options)) {
    out.options = (src.options as unknown[]).map((o) => {
      const rec = isRecord(o) ? o : {};
      return {
        label: rec.label ?? "继续",
        to: rec.to ?? null,
        condition: rec.condition ?? null,
      };
    });
  }
  return out as unknown as Instruction;
}

function buildScript(
  narrative: Record<string, unknown>,
  outgoingEdges: CompilerEdgeInput[],
  nameToId: Map<string, string>,
): Instruction[] {
  const rawScript = narrative.script;
  if (Array.isArray(rawScript) && rawScript.length > 0) {
    return rawScript
      .map(normalizeInstruction)
      .filter((i): i is Instruction => i !== null);
  }

  const script: Instruction[] = [];
  const narration = narrative.narration;
  if (narration) {
    script.push({
      op: "say", characterId: null, speaker: null,
      text: String(narration), voice: null, rich: null,
    });
  }
  const dialogue = narrative.dialogue;
  if (dialogue) {
    const speaker = (narrative.speaker as string | undefined) ?? null;
    const cid = speaker ? (nameToId.get(speaker) ?? null) : null;
    script.push({ op: "say", characterId: cid, speaker, text: String(dialogue), voice: null, rich: null });
  }

  const manualChoices = (narrative.choices as Record<string, unknown>[] | undefined) ?? [];
  if (manualChoices.length > 0) {
    const options: ChoiceOption[] = manualChoices.map((c) => ({
      label: (c.label as string) || "继续",
      to: (c.target_node_id as string | undefined) ?? null,
      condition: (c.condition as Condition | undefined) ?? null,
    }));
    script.push({ op: "choice", options });
  } else if (outgoingEdges.length >= 2) {
    const options: ChoiceOption[] = outgoingEdges.map((e) => ({
      label: e.label || "继续",
      to: String(e.targetNodeId),
      condition: (e.condition as Condition | undefined) ?? null,
    }));
    script.push({ op: "choice", options });
  }
  return script;
}

function extractActors(
  script: Instruction[],
  narrative: Record<string, unknown>,
  nameToId: Map<string, string>,
): string[] {
  const explicit = narrative.actors;
  if (Array.isArray(explicit) && explicit.length > 0) {
    return explicit.map((a) => String(a));
  }
  const actors = new Set<string>();
  for (const inst of script) {
    const op = opOf(inst);
    const cid = charIdOf(inst);
    if (cid && (op === "say" || op === "show" || op === "hide" || op === "move")) {
      actors.add(String(cid));
    }
    const speaker = speakerOf(inst);
    if (speaker && nameToId.has(speaker)) {
      actors.add(nameToId.get(speaker)!);
    }
  }
  return [...actors].sort();
}

/** 起始拍挑选：零入度 + 无触发条件者中评分（出边>内容>非锚点），平分取 sort_order 小者 */
function pickStartBeat(
  allNodes: Map<string, WorkingNode>,
  nodesWithIncoming: Set<string>,
  edgesBySource: Map<string, CompilerEdgeInput[]>,
): string | null {
  const candidates: WorkingNode[] = [];
  for (const [nodeId, node] of allNodes) {
    const narrative = node.narrative;
    if (!narrative.trigger_condition && !nodesWithIncoming.has(nodeId)) {
      candidates.push(node);
    }
  }
  if (candidates.length === 0) {
    return allNodes.keys().next().value ?? null;
  }
  const score = (n: WorkingNode): number => {
    let value = 0;
    if (edgesBySource.get(n.id)?.length) value += 20;
    const narrative = n.narrative;
    if (narrative.dialogue || narrative.script || narrative.narration) value += 10;
    if (!narrative.is_anchor) value += 5;
    return value;
  };
  let best = candidates[0]!;
  for (const c of candidates.slice(1)) {
    const ds = score(c) - score(best);
    if (ds > 0 || (ds === 0 && (c.sortOrder ?? 0) < (best.sortOrder ?? 0))) {
      best = c;
    }
  }
  return best.id;
}

function buildGlossary(playMeta: Record<string, unknown> | null | undefined): GlossaryEntry[] {
  const raw = isRecord(playMeta) ? playMeta.glossary : undefined;
  const entries: GlossaryEntry[] = [];
  if (!Array.isArray(raw)) return entries;
  raw.forEach((item, i) => {
    if (!isRecord(item)) return;
    const term = String(item.term ?? "").trim();
    const definition = String(item.definition ?? "").trim();
    if (!term) return;
    entries.push({ id: String(item.id ?? `g${i}`), term, definition });
  });
  return entries;
}

// ============================================================
// 主编译入口
// ============================================================

export function compileStory(input: CompilerProjectInput): StoryPackage {
  // --- 角色引用 + 名称→id 映射（按角色引用顺序去重） ---
  const charById = new Map(input.characters.map((c) => [c.id, c]));
  const refs: CharacterRef[] = [];
  const nameToId = new Map<string, string>();
  const seenChar = new Set<string>();
  for (const role of input.roles) {
    const rid = role.characterRefId;
    if (!rid || seenChar.has(rid)) continue;
    seenChar.add(rid);
    const c = charById.get(rid);
    if (!c) continue;
    let expressions: Record<string, string> | undefined;
    const sprites = isRecord(c.characterData) ? c.characterData.sprites : undefined;
    if (isRecord(sprites) && Object.keys(sprites).length > 0) {
      expressions = {};
      for (const [k, v] of Object.entries(sprites)) {
        if (v) expressions[String(k)] = String(v);
      }
    }
    refs.push({ id: c.id, name: c.name, imagePath: c.imagePath ?? null, expressions: expressions ?? null });
    if (c.name) nameToId.set(c.name, c.id);
  }

  // --- 场景引用：舞台自身值优先、资产池兜底；用 `||` 而非 `??`，因为 Python 的 `or` 把空串也当没值。
  const scenes: SceneRef[] = input.scenes.map((s) => ({
    id: s.id,
    title: s.title,
    location: s.location || s.sceneRef?.location || null,
    atmosphere: s.atmosphere || s.sceneRef?.atmosphere || null,
    backgroundImage: s.sceneRef?.imagePath ?? null,
  }));

  // --- 道具引用 ---
  const items: ItemRef[] = [];
  for (const ref of input.items) {
    const asset = ref.asset;
    if (!asset) continue;
    items.push({
      id: asset.id,
      name: asset.name,
      category: asset.category ?? null,
      imagePath: asset.imagePath ?? null,
    });
  }

  // --- 节点查找表（插入序）+ 出边表 + 入边集合 ---
  const allNodes = new Map<string, WorkingNode>();
  const sceneById = new Map(input.scenes.map((s) => [s.id, s]));
  const nodeScene = new Map<string, CompilerSceneInput>();
  for (const n of input.nodes) {
    allNodes.set(n.id, {
      id: n.id,
      stageId: n.stageId ?? null,
      narrative: n.narrativeData ?? {},
      sortOrder: n.sortOrder ?? 0,
    });
    if (n.stageId) {
      const scene = sceneById.get(n.stageId);
      if (scene) nodeScene.set(n.id, scene);
    }
  }
  if (allNodes.size === 0) {
    for (const scene of input.scenes) {
      for (const n of scene.nodes ?? []) {
        allNodes.set(n.id, {
          id: n.id,
          stageId: n.stageId ?? scene.id,
          narrative: n.narrativeData ?? {},
          sortOrder: n.sortOrder ?? 0,
        });
        nodeScene.set(n.id, scene);
      }
    }
  }

  const edgesBySource = new Map<string, CompilerEdgeInput[]>();
  const nodesWithIncoming = new Set<string>();
  const transitions: Transition[] = [];
  for (const e of input.edges) {
    const list = edgesBySource.get(e.sourceNodeId) ?? [];
    list.push(e);
    edgesBySource.set(e.sourceNodeId, list);
    nodesWithIncoming.add(e.targetNodeId);
    transitions.push({ from: e.sourceNodeId, to: e.targetNodeId, label: e.label ?? null });
  }

  // --- 逐节点编译为 Beat ---
  const beats: Beat[] = [];
  for (const [nodeId, node] of allNodes) {
    const scene = nodeScene.get(nodeId);
    const narrative = node.narrative;
    const outgoing = edgesBySource.get(nodeId) ?? [];
    const script = buildScript(narrative, outgoing, nameToId);

    const manualChoices = (narrative.choices as unknown[] | undefined) ?? [];
    const hasChoice = script.some((i) => opOf(i) === "choice");
    const manualEnding = narrative.is_ending;
    const isEnding =
      manualEnding !== null && manualEnding !== undefined
        ? Boolean(manualEnding)
        : outgoing.length === 0 && manualChoices.length === 0 && !hasChoice;

    beats.push({
      id: nodeId,
      sceneId: scene ? scene.id : null,
      sceneTitle: scene ? scene.title : null,
      stage: scene ? scene.id : null,
      actors: extractActors(script, narrative, nameToId),
      props: (narrative.props as string[] | undefined) ?? [],
      trigger: (narrative.trigger_condition as Condition | null) ?? null,
      script,
      effects: (narrative.effects as Effect[] | undefined) ?? [],
      isEnding,
      endingLabel: (narrative.ending_label as string | null) ?? null,
    });
  }

  const startBeatId = pickStartBeat(allNodes, nodesWithIncoming, edgesBySource);

  const glossary = buildGlossary(input.playMeta);

  const profiles: CharacterProfile[] = [];
  const seenProfile = new Set<string>();
  for (const role of input.roles) {
    const rid = role.characterRefId;
    if (!rid || seenProfile.has(rid)) continue;
    seenProfile.add(rid);
    const c = charById.get(rid);
    if (!c) continue;
    const data = isRecord(c.characterData) ? c.characterData : {};
    const anchor = isRecord(data.anchor) ? data.anchor : {};
    const contour = isRecord(data.contour) ? data.contour : {};
    profiles.push({
      id: c.id,
      name: c.name,
      imagePath: c.imagePath ?? null,
      summary: (anchor.summary as string | null) ?? null,
      essence: (anchor.essence as string | null) ?? null,
      identity: (contour.identity as string | null) ?? null,
      appearance: (contour.appearance as string | null) ?? null,
      tags: (anchor.tags as string[] | undefined) ?? [],
    });
  }

  const codexScope = [
    ...new Set(input.roles.map((r) => r.characterRefId).filter((r) => r)),
  ];

  return {
    irVersion: 1,
    projectId: input.id,
    title: input.title,
    startBeatId,
    beats,
    transitions,
    characters: refs,
    scenes,
    items,
    worldSetting: input.worldSetting ?? null,
    glossary,
    characterProfiles: profiles,
    codexScope,
  };
}
