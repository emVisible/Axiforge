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
  if (!project.data.meta?.id) {
    return err({ code: "corrupted", entity: "axsp", detail: "project 束缺 meta.id" });
  }
  const characters = readJson<StoredCharacter[]>(entries, CHARACTERS_ENTRY);
  if (!characters.ok) return characters;
  if (!Array.isArray(characters.data)) {
    return err({ code: "corrupted", entity: "axsp", detail: "characters 不是数组" });
  }
  const assets: Record<string, Uint8Array> = {};
  for (const ref of manifest.data.assets) {
    const raw = entries[ref];
    if (!raw) {
      return err({ code: "corrupted", entity: "axsp", detail: `清单缺素材 ${ref}` });
    }
    assets[ref] = raw;
  }
  return ok({ manifest: manifest.data, project: project.data, characters: characters.data, assets });
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
  return ok({
    manifest: {
      format: AXSP_FORMAT,
      version: AXSP_VERSION,
      name: manifest.name ?? obj.project.meta.title,
      exportedAt: manifest.exportedAt ?? "",
      assets: manifest.assets ?? [],
      characters: [],
    },
    project: obj.project,
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
 * 工程数据里指向角色的位置有四处：指令的 `characterId`（say/show/hide/move）、
 * 条件与效果 `key` 的点号前缀（`characterId.field` / `refId.memoryKey`）、
 * 项目级 `codexScope` 列表、以及 `roles[].characterRefId`。
 * 逐处硬编码会随指令集演进而漏改，故对 JSON 结构做一次遍历按字段名改写。
 */
export function remapCharacterIds(
  project: ProjectBundle,
  map: Readonly<Record<string, string>>,
): ProjectBundle {
  if (Object.keys(map).length === 0) return project;

  const idOf = (id: string): string => map[id] ?? id;
  const keyOf = (key: string): string => {
    const dot = key.indexOf(".");
    const head = dot < 0 ? key : key.slice(0, dot);
    const next = map[head];
    if (!next) return key;
    return dot < 0 ? next : `${next}${key.slice(dot)}`;
  };
  const walk = (value: unknown): unknown => {
    if (Array.isArray(value)) {
      return value.map((item) => (typeof item === "string" ? item : walk(item)));
    }
    if (!value || typeof value !== "object") return value;
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (k === "characterId" && typeof v === "string") out[k] = idOf(v);
      else if (k === "key" && typeof v === "string") out[k] = keyOf(v);
      else if (k === "codexScope" && Array.isArray(v))
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
 * 收集工程束引用的素材路径：节点指令里的 bg/bgm/se，
 * 以及角色立绘（`imagePath` + `character_data.sprites` 全值）。
 */
export function collectAssetRefs(
  project: ProjectBundle,
  characters: readonly StoredCharacter[] = [],
): string[] {
  const refs = new Set<string>();
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
