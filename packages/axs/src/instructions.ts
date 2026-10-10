/**
 * AXS 的**演出指令取值**（从 `parse.ts` 外提，G1 行数预算下按域切分）。
 *
 * 这一族只管一件事：`@bg` / `@bgm` / `@se` / `@voice` / `@wait` / `@transition` / `@fx` /
 * `@camera` / `@show` / `@hide` / `@move` 这些行的参数怎么切成 `Instruction`。
 * 合法取值的真相源在 `@axiforge/core` 的 `ir.ts`（`TransitionKind` / `FxKind` / `CameraAction`），
 * Python 那一端用 pydantic `Literal` 校验同一组值（`backend/app/domains/narrative/ir.py:93,99,83`）——
 * 也就是说同一份文本在两端的严格程度不一致，这里吃下的非法拼写会在另一端被拒收。
 * 所以本模块对"取值不在集合里"与"数字参数不是数字"各给一条 warning（**语义不变**：值仍照原样带着），
 * 与 `parse.ts` 里 `[if:` / 括号标记 / 同名裸引用那几条同形：只说出来，不改行为。
 */
import type {
  CameraAction,
  FxKind,
  Instruction,
  TransitionKind,
} from "@axiforge/core";
import type { AxsDiagnostic } from "./types";

/** 角色名 → 角色 id：立绘指令与对白行共用（同一个名字在两种行里必须解到同一个人） */
export function resolveRole(name: string, roles?: Record<string, string>): string {
  return roles?.[name] ?? name;
}

const TRANSITION_KINDS: readonly TransitionKind[] = ["fade", "dissolve", "wipe", "cut"];
const FX_KINDS: readonly FxKind[] = ["flash", "rain", "snow", "sakura", "none"];
const CAMERA_ACTIONS: readonly CameraAction[] = ["zoom", "pan", "shake", "reset"];

function warnUnknownToken(
  list: readonly string[],
  value: string,
  label: string,
  lineNo: number,
  diagnostics: AxsDiagnostic[],
): void {
  if (list.includes(value)) return;
  diagnostics.push({
    line: lineNo,
    message: `${label}「${value}」不在可用列表里：${list.join(" / ")}（这一行照常保留，播放端不会有任何对应效果）`,
    severity: "warning",
  });
}

/** 演出指令行 → Instruction；不认识该 `@命令` 时返回 null，由 `parse.ts` 落进"未知指令"那一档 */
export function parseStageInstruction(
  cmd: string,
  args: string,
  roles: Record<string, string> | undefined,
  lineNo: number,
  diagnostics: AxsDiagnostic[],
): { instruction?: Instruction } | null {
  switch (cmd) {
    case "bg": {
      const [image, ...rest] = args.split(/\s+/);
      return {
        instruction: {
          op: "bg",
          image: image ?? "",
          transition: rest.length ? rest.join(" ") : null,
        },
      };
    }
    case "bgm": {
      const tokens = args.split(/\s+/).filter(Boolean);
      const loop = tokens.includes("loop");
      const track = tokens.find((t) => t !== "loop") ?? null;
      return { instruction: { op: "bgm", track, loop } };
    }
    case "se":
      return { instruction: { op: "se", sound: args.trim() } };
    case "voice":
      return {
        instruction: { op: "voice", sound: args.trim() || null },
      };
    case "wait": {
      const raw = args.trim();
      const ms = Number.parseInt(raw, 10);
      if (!raw) {
        diagnostics.push({
          line: lineNo,
          message: "`@wait` 缺少毫秒数，按 0 处理",
          severity: "warning",
        });
      } else if (Number.isNaN(ms)) {
        diagnostics.push({
          line: lineNo,
          message: `@wait 的参数「${raw}」不是毫秒数，按 0 处理`,
          severity: "warning",
        });
      }
      return { instruction: { op: "wait", ms: Number.isNaN(ms) ? 0 : ms } };
    }
    case "transition": {
      const [kind, msStr] = args.split(/\s+/);
      const ms = msStr ? Number.parseInt(msStr, 10) : undefined;
      const token = kind ?? "fade";
      warnUnknownToken(TRANSITION_KINDS, token, "转场种类", lineNo, diagnostics);
      return {
        instruction: {
          op: "transition",
          kind: token as TransitionKind,
          ms: ms && !Number.isNaN(ms) ? ms : undefined,
        },
      };
    }
    case "fx": {
      const [effect, msStr] = args.split(/\s+/);
      const ms = msStr ? Number.parseInt(msStr, 10) : undefined;
      const token = effect ?? "none";
      warnUnknownToken(FX_KINDS, token, "特效", lineNo, diagnostics);
      return {
        instruction: {
          op: "fx",
          effect: token as FxKind,
          ms: ms && !Number.isNaN(ms) ? ms : undefined,
        },
      };
    }
    case "camera": {
      const tokens = args.split(/\s+/);
      const action = tokens[0] ?? "reset";
      warnUnknownToken(CAMERA_ACTIONS, action, "镜头动作", lineNo, diagnostics);
      const instr: Instruction = { op: "camera", action: action as CameraAction };
      if (action === "zoom" && tokens[1]) {
        const scale = Number.parseFloat(tokens[1]);
        if (Number.isNaN(scale)) {
          diagnostics.push({
            line: lineNo,
            message: `@camera zoom 的缩放比「${tokens[1]}」不是数字，已忽略`,
            severity: "warning",
          });
        } else {
          (instr as { scale?: number }).scale = scale;
        }
      }
      return { instruction: instr };
    }
    case "show": {
      const tokens = args.split(/\s+/).filter(Boolean);
      const name = tokens[0] ?? "";
      return {
        instruction: {
          op: "show",
          characterId: resolveRole(name, roles),
          expression: tokens[1],
          position: tokens[2],
        },
      };
    }
    case "hide":
      return {
        instruction: {
          op: "hide",
          characterId: resolveRole(args.trim(), roles),
        },
      };
    case "move": {
      const tokens = args.split(/\s+/).filter(Boolean);
      return {
        instruction: {
          op: "move",
          characterId: resolveRole(tokens[0] ?? "", roles),
          position: tokens[1] ?? "center",
        },
      };
    }
    default:
      return null;
  }
}
