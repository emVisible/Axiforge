/**
 * .axsp 工程容器 v2（ADR-024 决策 4；ADR-026 记容器格式变更）。
 *
 * 形态：zip = `manifest.json` + `project.json` + `characters.json` + `assets/<ref>`。
 * v0/v1 是纯 JSON 信封，只装工程束——两个致命缺口：素材只有引用清单没有字节，
 * 角色只有 `characterRefId` 没有数据本体，换台机器导入即丢图丢人物。v2 把
 * 「演员表 + 素材字节」一起装进去，工程包才真的可分发。
 *
 * zip 内路径直接等于 ref（`assets/<摘要>.<ext>`），故不需要额外的映射表；
 * 摘要即文件名，导入端天然幂等。v1 文本信封保留只读解析（历史包仍可打开）。
 */

import { unzipSync, zipSync } from "fflate";
import type { ProjectBundle, StoredCharacter } from "./storage/types";
import { err, ok, type StorageResult } from "./storage/types";
import { classifyAssetRef } from "./storage/assets";
import { uuid } from "./storage/sqlite/rows";

export const AXSP_FORMAT = "axsp";
export const AXSP_VERSION = 2;
const AXSP_V1_VERSION = 1;

const MANIFEST_ENTRY = "manifest.json";
const PROJECT_ENTRY = "project.json";
const CHARACTERS_ENTRY = "characters.json";

export interface AxspManifest {
  readonly format: typeof AXSP_FORMAT;
  readonly version: typeof AXSP_VERSION;
  /** 工程标题（容器外可读） */
  readonly name: string;
  /** ISO 导出时间 */
  readonly exportedAt: string;
  /** 包内素材清单（zip 路径 = ref） */
  readonly assets: readonly string[];
  /** 包内角色清单（character id） */
  readonly characters: readonly string[];
}

export interface AxspBundle {
  readonly manifest: AxspManifest;
  readonly project: ProjectBundle;
  readonly characters: readonly StoredCharacter[];
  readonly assets: Readonly<Record<string, Uint8Array>>;
}

export interface AxspInput {
  readonly project: ProjectBundle;
  readonly characters?: readonly StoredCharacter[];
  readonly assets?: Readonly<Record<string, Uint8Array>>;
}

const JSON_ENCODE = (text: string): Uint8Array => {
  const bytes = new TextEncoder().encode(text);
  return bytes;
};

const JSON_DECODE = (bytes: Uint8Array): string => new TextDecoder().decode(bytes);

/** 打包 .axsp v2（zip 字节；序列化失败=io） */
export function packAxsp(input: AxspInput): StorageResult<Uint8Array> {
  const project = input.project;
  if (!project?.meta?.id) {
    return err({ code: "io", detail: "工程束缺 meta.id，拒绝打包" });
  }
  const characters = input.characters ?? [];
  const assets = input.assets ?? {};
  const refs = Object.keys(assets).filter(
    (ref) => classifyAssetRef(ref) === "local",
  );
  const manifest: AxspManifest = {
    format: AXSP_FORMAT,
    version: AXSP_VERSION,
    name: project.meta.title,
    exportedAt: new Date().toISOString(),
    assets: refs,
    characters: characters.map((c) => c.id),
  };
  try {
    const entries: Record<string, Uint8Array> = {
      [MANIFEST_ENTRY]: JSON_ENCODE(JSON.stringify(manifest, null, 2)),
      [PROJECT_ENTRY]: JSON_ENCODE(JSON.stringify(project, null, 2)),
      [CHARACTERS_ENTRY]: JSON_ENCODE(JSON.stringify(characters, null, 2)),
    };
    for (const ref of refs) entries[ref] = assets[ref]!;
    return ok(zipSync(entries, { level: 6 }));
  } catch (cause) {
    return err({ code: "io", detail: "容器序列化失败", cause });
  }
}

/** 解析 .axsp（zip=v2；JSON 文本=v1 只读；结构不符=corrupted，绝不静默兜底） */
export function unpackAxsp(bytes: Uint8Array | string): StorageResult<AxspBundle> {
  if (typeof bytes === "string") return unpackAxspV1(bytes);
  if (bytes.byteLength < 4) {
    return err({ code: "corrupted", entity: "axsp", detail: "包体过短" });
  }
  const isZip =
    bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04;
  if (!isZip) return unpackAxspV1(JSON_DECODE(bytes));
  let entries: Record<string, Uint8Array>;
  try {
    entries = unzipSync(bytes);
  } catch (cause) {
    return err({ code: "corrupted", entity: "axsp", detail: "zip 解包失败", cause });
  }
  const manifest = readJson<AxspManifest>(entries, MANIFEST_ENTRY);
  if (!manifest.ok) return manifest;
  if (manifest.data.format !== AXSP_FORMAT) {
    return err({ code: "corrupted", entity: "axsp", detail: "manifest.format 不符" });
  }
  if (manifest.data.version !== AXSP_VERSION) {
    return err({
      code: "corrupted",
      entity: "axsp",
      detail: `不支持的容器版本: ${String(manifest.data.version)}`,
    });
  }
  const project = readJson<ProjectBundle>(entries, PROJECT_ENTRY);
  if (!project.ok) return project;
  // 形状校验必须**在使用之前**：解出来的 JSON 是外部输入，而 `readJson` 只保证「能 parse」。
  // 2026-10-01 复审补的：原实现直接 `project.data.meta?.id` 与 `for (… of manifest.data.assets)`，
  // 于是结构不合的包（`assets` 缺席/null/数字、`project.json` 是 null）抛 `TypeError` 穿越内核边界
  // ——而 `storage/types.ts` 的头一条设计裁决就是「禁止异常穿越内核边界」，
  // 本模块开头也写着「结构不符=corrupted，绝不静默兜底」。实测 6 个畸形形状里 4 个抛异常。
  // 顺带修掉一个误导：`assets` 是字符串时 `for…of` 会**逐字符迭代**，
  // 于是报「清单缺素材 a」（字符串的第一个字符）而不是「清单结构不对」。
  if (!project.data || typeof project.data !== "object") {
    return err({ code: "corrupted", entity: "axsp", detail: "project 束不是对象" });
  }
  if (!project.data.meta?.id) {
    return err({ code: "corrupted", entity: "axsp", detail: "project 束缺 meta.id" });
  }
  const characters = readJson<StoredCharacter[]>(entries, CHARACTERS_ENTRY);
  if (!characters.ok) return characters;
  if (!Array.isArray(characters.data)) {
    return err({ code: "corrupted", entity: "axsp", detail: "characters 不是数组" });
  }
  if (!Array.isArray(manifest.data.assets)) {
    return err({ code: "corrupted", entity: "axsp", detail: "manifest.assets 不是数组" });
  }
  const assets: Record<string, Uint8Array> = {};
  for (const ref of manifest.data.assets) {
    const raw = entries[ref];
    if (!raw) {
      return err({ code: "corrupted", entity: "axsp", detail: `清单缺素材 ${ref}` });
    }
    assets[ref] = raw;
  }
  const normalized = normalizeBundle(project.data);
  if (!normalized.ok) return normalized;
  return ok({ manifest: manifest.data, project: normalized.data, characters: characters.data, assets });
}

/** v1 纯 JSON 信封只读解析（归一化为 v2 束形态：无角色、无内嵌素材） */
export function unpackAxspV1(text: string): StorageResult<AxspBundle> {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch (cause) {
    return err({ code: "corrupted", entity: "axsp", detail: "非合法 JSON 或 zip", cause });
  }
  if (typeof raw !== "object" || raw === null) {
    return err({ code: "corrupted", entity: "axsp", detail: "根不是对象" });
  }
  const obj = raw as { manifest?: AxspManifestV1; project?: ProjectBundle };
  const manifest = obj.manifest;
  if (!manifest || manifest.format !== AXSP_FORMAT) {
    return err({ code: "corrupted", entity: "axsp", detail: "manifest.format 缺失或不符" });
  }
  if (manifest.version !== AXSP_V1_VERSION) {
    return err({
      code: "corrupted",
      entity: "axsp",
      detail: `不支持的容器版本: ${String(manifest.version)}`,
    });
  }
  if (!obj.project || typeof obj.project !== "object" || !obj.project.meta?.id) {
    return err({ code: "corrupted", entity: "axsp", detail: "project 束缺失或无 meta.id" });
  }
  // v1 出口同样走 `normalizeBundle`：它同样是"外部 JSON"，同样要把缺键与形状错分开
  const normalized = normalizeBundle(obj.project);
  if (!normalized.ok) return normalized;
  return ok({
    manifest: {
      format: AXSP_FORMAT,
      version: AXSP_VERSION,
      name: manifest.name ?? obj.project.meta.title,
      exportedAt: manifest.exportedAt ?? "",
      assets: manifest.assets ?? [],
      characters: [],
    },
    project: normalized.data,
    characters: [],
    assets: {},
  });
}

interface AxspManifestV1 {
  readonly format: string;
  readonly version: number;
  readonly name?: string;
  readonly exportedAt?: string;
  readonly assets?: readonly string[];
}

/**
 * 角色 id 重映射（导入端把包内角色落到新库、拿到新 id 后改写全部引用）。
 *
 * 工程数据里指向角色的位置：指令的 `characterId`（say/show/hide/move）、
 * 条件与效果 `key` 的**每一个点号分段**、项目级 `codexScope` 与 `actors` 两个列表、
 * 以及 `roles[].characterRefId`。逐处硬编码会随指令集演进而漏改，故对 JSON 结构做一次遍历按字段名改写。
 *
 * **2026-10-01 复审补上两处（改前实测两处都漏，且都是静默的）**：
 * ① `key` 原先只重映射**第一个**点号分段。而 `relationship` 的键是**三段**的
 *    `charA.charB.field`——条件侧 `conditions.ts` 与效果侧 `applyEffects` 都按 `split(".")` 取
 *    `[charA, charB, field]`，于是 `charB` 保留**导出方机器上**的角色 id：
 *    导入后关系账本挂在一个不存在的角色下，而那条关系从此读写不到。
 *    实测：`char-1.char-2.trust` → `NEW1.char-2.trust`。
 * ② `actors`（`compiler.ts::extractActors` 里 `explicit` 优先，是作者可写的覆盖值）
 *    是存在 `narrativeData` 里的角色 id 列表，与已被重映射的 `codexScope` 完全同类，却没有分支。
 *    实测：`["char-1","char-2"]` 原样穿过。
 * 改法：分段**逐段**查表（`map` 里没有的分段原样保留）——
 * `flag`/`memory`/`state`/`codex` 的首段是命名空间而不是角色 id，
 * 而角色 id 是 UUID 或 slug，不会正好等于那些命名空间，所以逐段查表是安全的。
 */
export function remapCharacterIds(
  project: ProjectBundle,
  map: Readonly<Record<string, string>>,
): ProjectBundle {
  if (Object.keys(map).length === 0) return project;

  const idOf = (id: string): string => map[id] ?? id;
  /** 逐个点号分段查表重映射（`relationship` 的键有三段，见文件头） */
  const keyOf = (key: string): string =>
    key
      .split(".")
      .map((seg) => map[seg] ?? seg)
      .join(".");
  const walk = (value: unknown): unknown => {
    if (Array.isArray(value)) {
      return value.map((item) => (typeof item === "string" ? item : walk(item)));
    }
    if (!value || typeof value !== "object") return value;
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (k === "characterId" && typeof v === "string") out[k] = idOf(v);
      else if (k === "key" && typeof v === "string") out[k] = keyOf(v);
      // `codexScope` 与 `actors` 都是角色 id 列表，语义完全相同，必须同一分支
      else if ((k === "codexScope" || k === "actors") && Array.isArray(v))
        out[k] = v.map((x) => (typeof x === "string" ? idOf(x) : x));
      else out[k] = walk(v);
    }
    return out;
  };

  return {
    ...project,
    nodes: project.nodes.map((n) => ({
      ...n,
      narrativeData: walk(n.narrativeData) as Record<string, unknown>,
    })),
    roles: project.roles.map((r) => ({ ...r, characterRefId: idOf(r.characterRefId) })),
  };
}

/**
 * 节点与边的 id 重映射（导入端把包内的图落到**另一个工程**时必须换身份）。
 *
 * 为什么需要它：`project_nodes.id` 与 `project_edges.id` 在 DDL 里都是**全局**
 * `TEXT PRIMARY KEY`（不是 `(project_id, id)` 复合键）。`remapCharacterIds` 只换角色身份，
 * 节点与边原样插入 ⇒ 同一个 `.axsp` 在这台机器上导第二次时，第二条 INSERT 撞主键，
 * `saveNarrative` 的整批事务回滚，用户看到的是"导入失败"，而不是"导入了两份"。
 * （`MemoryStorageProvider` 只查同一次 payload 内的重复 id、跨工程不查，
 * 所以这条缺陷与它的判据都必须落在真 SQLite 上，否则内存宿主给的是假的绿。）
 *
 * 只动身份，不动内容：`editorData` / `narrativeData` 一字不改——图内部的跳转按 **Beat 标题**寻址
 * （ADR-016），节点 id 只存在于 `edges` 的两端，所以重映射必须**同时**改写边的
 * `source`/`target`；漏掉那一半就把"撞主键"换成了"边悬空"，而那比失败更安静。
 * id 取自存储行 id 的唯一权威 `rows.ts::uuid`，不在这里另造第二个生成器。
 */
export function remapNodeIds(project: ProjectBundle): ProjectBundle {
  const nodeIdMap = new Map<string, string>();
  const nodes = project.nodes.map((n) => {
    const next = { ...n, id: uuid() };
    nodeIdMap.set(n.id, next.id);
    return next;
  });
  const edges = project.edges.map((e) => ({
    ...e,
    id: uuid(),
    source: nodeIdMap.get(e.source) ?? e.source,
    target: nodeIdMap.get(e.target) ?? e.target,
  }));
  return { ...project, nodes, edges };
}

function readJson<T>(
  entries: Record<string, Uint8Array>,
  name: string,
): StorageResult<T> {
  const raw = entries[name];
  if (!raw) return err({ code: "corrupted", entity: "axsp", detail: `缺 ${name}` });
  try {
    return ok(JSON.parse(JSON_DECODE(raw)) as T);
  } catch (cause) {
    return err({ code: "corrupted", entity: "axsp", detail: `${name} 非法 JSON`, cause });
  }
}

/**
 * 包内工程束是外部 JSON，键的有无取决于导出它的那一版代码。
 * S13-2c 之前的容器没有 `assetRefs`——**缺键**是旧版本而不是坏输入，按「包内没有引用」补齐，
 * 且只在这一处补：让每个调用方各自 `?? []` 早晚会有一个漏掉，漏掉的那处直接抛异常。
 *
 * **2026-10-01 复审把「缺键」与「键存在但类型错」分开**：原实现是
 * `Array.isArray(project.assetRefs) ? project : { ...project, assetRefs: [] }`，
 * 于是 `assetRefs` 是对象 / `null` / 字符串时**一律被归一成 `[]` 并返回 `ok:true`**，
 * 与合法的旧版本缺键**不可区分**（实测四种形状读回来都是 `[]`）。
 * 代价不是"看起来干净"：这个字段**有消费者**——`axspImport.ts` 逐条 `addAssetRef`，
 * 所以归一等于**道具引用静默消失且零信号**。
 * 现在只把**真的缺键**当旧版本；键在而形状不对一律 `corrupted`。
 *
 * **与 `manifest.characters` 那条的区别要写清楚**（同一天审出来的两条，结论相反）：
 * 那条**没有任何消费者**，在它上面加拒绝只会让书写松散的外部包导不进来 ⇒ 不改；
 * 这条有消费者、且「缺键」与「形状错」本来就分得开 ⇒ 改。
 * **判据是「字段有没有消费者」，不是「看起来严不严」。**
 */
function normalizeBundle(project: ProjectBundle): StorageResult<ProjectBundle> {
  if (project.assetRefs === undefined) return ok({ ...project, assetRefs: [] });
  if (!Array.isArray(project.assetRefs)) {
    return err({
      code: "corrupted",
      entity: "axsp",
      detail: "project.assetRefs 存在但不是数组（键缺失才是旧版本；键在而形状错是坏输入）",
    });
  }
  return ok(project);
}

/**
 * 收集工程束引用的素材路径：节点指令里的 bg/bgm/se、`meta.coverImage`，
 * 以及角色立绘（`imagePath` + `character_data.sprites` 全值）。
 *
 * **2026-10-01 复审补上 `meta.coverImage`**：它此前完全不在这个函数里，
 * 于是封面图那条 ref 被序列化进 `project.json`、导入时又被原样写回
 * （`axspImport.ts` 的 `metaPatch.coverImage`），但**字节从来没进过包**——
 * 导出侧压根没对它调过 `readAsset`。收件机上 `resolveAssetUrl` 找不到文件 ⇒ 封面空白，
 * 而 `ok: true` 走完全程，零诊断。这与本模块已有的那条不变量正好是镜像：
 * 已声明的素材必须真在包里，而这一条是**ref 已声明、字节没跟**。
 * 分母：随包三份 `.axsp` 的封面都是空，所以今天没有作品因此坏掉。
 */
export function collectAssetRefs(
  project: ProjectBundle,
  characters: readonly StoredCharacter[] = [],
): string[] {
  const refs = new Set<string>();
  const addLocal = (value: unknown) => {
    if (typeof value === "string" && classifyAssetRef(value) === "local") refs.add(value);
  };
  addLocal(project.meta?.coverImage);
  for (const node of project.nodes) {
    const nd = node.narrativeData as Record<string, unknown> | null;
    if (!nd) continue;
    for (const inst of (nd.script as { op?: string }[]) || []) {
      if (inst?.op === "bg" && typeof (inst as { image?: unknown }).image === "string") {
        refs.add((inst as { image: string }).image);
      }
      if (inst?.op === "bgm" && typeof (inst as { track?: unknown }).track === "string") {
        refs.add((inst as { track: string }).track);
      }
      if (inst?.op === "se" && typeof (inst as { sound?: unknown }).sound === "string") {
        refs.add((inst as { sound: string }).sound);
      }
    }
  }
  for (const c of characters) {
    if (classifyAssetRef(c.imagePath) === "local") refs.add(c.imagePath!);
    const sprites = (c.characterData as { sprites?: unknown } | undefined)?.sprites;
    if (sprites && typeof sprites === "object") {
      for (const url of Object.values(sprites as Record<string, unknown>)) {
        if (typeof url === "string" && classifyAssetRef(url) === "local") refs.add(url);
      }
    }
  }
  return [...refs];
}
