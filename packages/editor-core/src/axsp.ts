/**
 * .axsp 工程容器 v0（ADR-024 决策 4：从 v2.5 规划前置）。
 *
 * 形态：JSON 信封 = manifest（格式/版本/导出时间/素材引用清单）+ 完整工程束。
 * v0 为纯 JSON 文本；二进制（zip）与媒体内嵌随素材管线演进，manifest.assets
 * 字段已预留引用清单位。验收：导出→导入数据逐字段等价。
 */

import type { ProjectBundle } from "./storage/types";
import { err, ok, type StorageResult } from "./storage/types";

export const AXSP_FORMAT = "axsp";
export const AXSP_VERSION = 1;

export interface AxspManifest {
  readonly format: typeof AXSP_FORMAT;
  readonly version: typeof AXSP_VERSION;
  /** 工程标题（容器外可读） */
  readonly name: string;
  /** ISO 导出时间 */
  readonly exportedAt: string;
  /** 素材引用清单（v0：引用路径集合；内嵌为后续版本演进） */
  readonly assets: readonly string[];
}

export interface AxspBundle {
  readonly manifest: AxspManifest;
  readonly project: ProjectBundle;
}

/** 序列化 .axsp 文本（JSON；失败=io，由调用方呈现） */
export function packAxsp(bundle: AxspBundle): StorageResult<string> {
  if (bundle.manifest.format !== AXSP_FORMAT) {
    return err({
      code: "io",
      detail: `manifest.format 应为 ${AXSP_FORMAT}`,
    });
  }
  try {
    return ok(JSON.stringify(bundle, null, 2));
  } catch (cause) {
    return err({ code: "io", detail: "序列化失败", cause });
  }
}

/** 解析 .axsp 文本（结构不符=corrupted；字段缺失=corrupted，绝不静默兜底） */
export function unpackAxsp(text: string): StorageResult<AxspBundle> {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch (cause) {
    return err({ code: "corrupted", entity: "axsp", detail: "非合法 JSON", cause });
  }
  if (typeof raw !== "object" || raw === null) {
    return err({ code: "corrupted", entity: "axsp", detail: "根不是对象" });
  }
  const obj = raw as Record<string, unknown>;
  const manifest = obj.manifest as AxspManifest | undefined;
  const project = obj.project as ProjectBundle | undefined;
  if (!manifest || manifest.format !== AXSP_FORMAT) {
    return err({ code: "corrupted", entity: "axsp", detail: "manifest.format 缺失或不符" });
  }
  if (manifest.version !== AXSP_VERSION) {
    return err({
      code: "corrupted",
      entity: "axsp",
      detail: `不支持的容器版本: ${String(manifest.version)}`,
    });
  }
  if (!project || typeof project !== "object" || !project.meta?.id) {
    return err({ code: "corrupted", entity: "axsp", detail: "project 束缺失或无 meta.id" });
  }
  return ok({ manifest, project });
}

/** 从工程束构造容器（assets 由调用方按素材引用计算后传入） */
export function bundleToAxsp(
  project: ProjectBundle,
  assets: readonly string[] = [],
): AxspBundle {
  return {
    manifest: {
      format: AXSP_FORMAT,
      version: AXSP_VERSION,
      name: project.meta.title,
      exportedAt: new Date().toISOString(),
      assets: [...assets],
    },
    project,
  };
}

/** 收集工程束引用的素材路径（v0：立绘/背景/音频等 narrative 字段内的路径值） */
export function collectAssetRefs(project: ProjectBundle): string[] {
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
  return [...refs];
}
