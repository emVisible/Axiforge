import { useCallback, useEffect, useMemo, useState } from "react";
import {
  start as engineStart,
  proceed as engineProceed,
  choose as engineChoose,
  type StoryPackage,
  type RuntimeState,
  type StoryView,
  type Instruction,
} from "@axiforge/core";
import { EMPTY_STAGE, foldStage, type Stage } from "@/features/player/lib/stage";
import { renderRich } from "@/features/player/lib/richText";
import FxLayer from "@/features/player/components/FxLayer";
import { getImageUrl } from "@/shared/lib/imageUrl";
import { expressionLabel } from "@/shared/lib/expressions";
import { cn } from "@/shared/components/ui";

export interface PreviewRoleOption {
  characterRefId: string;
  name: string;
  imagePath?: string | null;
}

const POSITION_CLASS: Record<string, string> = {
  left: "left-[16%] -translate-x-1/2",
  center: "left-1/2 -translate-x-1/2",
  right: "right-[16%] translate-x-1/2",
};

function buildPackage(
  script: Instruction[],
  roles: PreviewRoleOption[],
): StoryPackage {
  return {
    irVersion: 1,
    projectId: "preview",
    title: "预览",
    startBeatId: "preview",
    characters: roles.map((r) => ({
      id: r.characterRefId,
      name: r.name,
      imagePath: r.imagePath ?? null,
    })),
    scenes: [],
    transitions: [],
    beats: [{ id: "preview", script, isEnding: true }],
  };
}

/** Seek 回放：一次性特效 / 转场不触发动画，避免 scrub 时黑场乱闪。 */
function seekToCursor(
  pkg: StoryPackage,
  targetCursor: number,
): { state: RuntimeState; view: StoryView; stage: Stage } {
  let { state, view } = engineStart(pkg);
  let stage = foldStage(EMPTY_STAGE, view.directives, { animate: false });
  const max = pkg.beats[0]?.script.length ?? 0;
  let guard = 0;
  while (state.cursor < targetCursor && guard++ < max + 8 && state.status !== "ended") {
    if (view.waiting === "choice" || view.waiting === "end") break;
    const next = engineProceed(pkg, state);
    state = next.state;
    stage = foldStage(stage, next.view.directives, { animate: false });
    view = next.view;
  }
  return { state, view, stage };
}

interface PreviewMonitorProps {
  script: Instruction[];
  roles: PreviewRoleOption[];
  seekIndex?: number | null;
  embedded?: boolean;
  className?: string;
  onCursorChange?: (cursor: number) => void;
  onClose?: () => void;
  /** 剪辑台嵌入时隐藏底部控制条（由外部 Transport 驱动） */
  showFooter?: boolean;
  /** 剪辑台监视器顶栏标题 */
  monitorLabel?: string;
}

export default function PreviewMonitor({
  script,
  roles,
  seekIndex = null,
  embedded = true,
  className = "",
  onCursorChange,
  onClose,
  showFooter = true,
  monitorLabel,
}: PreviewMonitorProps) {
  const pkg = useMemo(() => buildPackage(script, roles), [script, roles]);

  const [rtState, setRtState] = useState<RuntimeState | null>(null);
  const [view, setView] = useState<StoryView | null>(null);
  const [stage, setStage] = useState<Stage>(EMPTY_STAGE);

  const applyResult = useCallback(
    (state: RuntimeState, v: StoryView, st: Stage) => {
      setRtState(state);
      setView(v);
      setStage(st);
      onCursorChange?.(state.cursor);
    },
    [onCursorChange],
  );

  const restart = useCallback(() => {
    const { state, view: v } = engineStart(pkg);
    applyResult(state, v, foldStage(EMPTY_STAGE, v.directives));
  }, [pkg, applyResult]);

  useEffect(() => {
    restart();
  }, [restart]);

  useEffect(() => {
    if (seekIndex == null || seekIndex < 0 || !script.length) return;
    const { state, view: v, stage: st } = seekToCursor(pkg, seekIndex);
    applyResult(state, v, st);
  }, [seekIndex, pkg, script.length, applyResult]);

  const advance = useCallback(() => {
    if (!rtState || !view || view.waiting === "end" || view.waiting === "choice") {
      return;
    }
    const { state, view: v } = engineProceed(pkg, rtState);
    applyResult(state, v, foldStage(stage, v.directives));
  }, [pkg, rtState, view, stage, applyResult]);

  const pick = useCallback(
    (i: number) => {
      if (!rtState || view?.waiting !== "choice") return;
      const { state, view: v } = engineChoose(pkg, rtState, i);
      applyResult(state, v, foldStage(stage, v.directives));
    },
    [pkg, rtState, view, stage, applyResult],
  );

  useEffect(() => {
    if (view?.waiting === "wait") {
      const t = setTimeout(advance, view.waitMs ?? 500);
      return () => clearTimeout(t);
    }
  }, [view, advance]);

  const charById = useMemo(() => {
    const m: Record<string, PreviewRoleOption> = {};
    for (const r of roles) m[r.characterRefId] = r;
    return m;
  }, [roles]);

  const line = view?.waiting === "say" ? view.line : undefined;
  const speakerId = line?.characterId ?? null;
  const isEnd = view?.waiting === "end";
  const showingChoices = view?.waiting === "choice";
  const bgUrl = getImageUrl(stage.background || undefined);

  const cameraStyle = {
    transform: `scale(${stage.camera.scale}) translate(${stage.camera.x}%, ${stage.camera.y}%)`,
    transition: "transform 300ms ease-out",
  } as const;

  const sprites = Object.entries(stage.sprites);
  const displaySprites =
    speakerId && !stage.sprites[speakerId]
      ? [...sprites, [speakerId, { position: "center", expression: undefined }] as const]
      : sprites;

  const shellClass = embedded
    ? cn(
        "flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-border bg-surface",
        className,
      )
    : cn(
        "w-full max-w-3xl overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl",
        className,
      );

  const choiceBtnClass = (disabled: boolean) =>
    cn(
      "rounded-lg border px-3 py-1.5 text-xs backdrop-blur-sm",
      disabled
        ? "border-border/50 bg-panel text-ink-faint"
        : "border-border-strong bg-panel-raised text-ink hover:border-brand hover:text-ink",
    );

  const choiceButtons = showingChoices
    ? (view.choices ?? []).map((c) => (
        <button
          key={c.index}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            pick(c.index);
          }}
          disabled={c.disabled}
          className={choiceBtnClass(!!c.disabled)}
        >
          {c.index + 1}. {c.label || "（空选项）"}
        </button>
      ))
    : null;

  return (
    <div className={shellClass}>
      {embedded && monitorLabel && (
        <div className="flex h-7 shrink-0 items-center justify-between border-b border-border bg-panel-raised px-3">
          <span className="text-3xs font-medium tracking-wide text-ink-muted">
            {monitorLabel}
          </span>
          {rtState && script.length > 0 && (
            <span className="font-mono text-3xs text-ink-faint">
              {Math.min(rtState.cursor + 1, script.length)}/{script.length}
            </span>
          )}
        </div>
      )}
      <div
        className="relative min-h-0 flex-1 cursor-pointer select-none overflow-hidden bg-canvas"
        onClick={advance}
      >
        <div className="absolute inset-0" style={cameraStyle}>
          <div
            key={`shake-${stage.shakeSeq}`}
            className={stage.shakeSeq > 0 ? "fx-shake absolute inset-0" : "absolute inset-0"}
            style={{ ["--shake" as string]: `${stage.shakeIntensity}px` }}
          >
            <div
              className="absolute inset-0"
              style={
                bgUrl
                  ? {
                      backgroundImage: `linear-gradient(180deg, color-mix(in srgb, var(--ax-canvas) 50%, transparent), color-mix(in srgb, var(--ax-panel) 90%, transparent)), url(${bgUrl})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }
                  : {
                      backgroundImage:
                        "linear-gradient(180deg, var(--ax-canvas), var(--ax-panel))",
                    }
              }
            />
            {displaySprites.map(([id, sp]) => {
              const role = charById[id];
              const active = id === speakerId;
              const img = getImageUrl(role?.imagePath || undefined);
              return (
                <div
                  key={id}
                  className={`absolute bottom-[64px] flex flex-col items-center transition-all duration-300 ${POSITION_CLASS[sp.position] || POSITION_CLASS.center} ${active ? "opacity-100" : "opacity-50"}`}
                >
                  {img ? (
                    <img
                      src={img}
                      alt={role?.name || ""}
                      className="max-h-[46vh] w-auto object-contain drop-shadow-2xl"
                    />
                  ) : (
                    <div className="flex h-24 w-20 items-center justify-center rounded-xl border border-border bg-panel-raised text-center text-3xs text-ink-faint">
                      {role?.name || id}
                      {sp.expression ? `·${expressionLabel(sp.expression)}` : ""}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <FxLayer stage={stage} />

        {line && (
          <div className="absolute inset-x-0 bottom-0 z-50 p-4">
            <div className="rounded-xl border border-border bg-surface/90 p-4 backdrop-blur-md">
              {line.speaker && (
                <div className="mb-1 text-xs font-medium tracking-wider text-ink-muted">
                  {line.speaker}
                </div>
              )}
              <p className="text-sm leading-relaxed text-ink">
                {renderRich(line.text, !!line.rich)}
              </p>
            </div>
          </div>
        )}

        {showingChoices && (
          <div
            className="absolute inset-x-0 bottom-16 z-50 flex flex-wrap justify-center gap-2 px-4"
            onClick={(e) => e.stopPropagation()}
          >
            {choiceButtons && choiceButtons.length > 0 ? (
              choiceButtons
            ) : (
              <span className="rounded-lg border border-border bg-panel/90 px-3 py-1.5 text-xs text-ink-muted">
                分支无选项 — 请在检查器中添加
              </span>
            )}
          </div>
        )}

        {isEnd && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-canvas/80">
            <span className="text-sm tracking-[0.3em] text-ink-muted">演出结束</span>
          </div>
        )}
      </div>

      {showFooter && (
      <div className="flex shrink-0 items-center justify-between gap-2 border-t border-border bg-panel px-4 py-2">
        <div className="flex flex-wrap gap-1.5">
          {showingChoices && choiceButtons}
          {view?.waiting === "say" && (
            <span className="text-2xs text-ink-faint">点击舞台继续</span>
          )}
          {view?.waiting === "wait" && (
            <span className="text-2xs text-ink-faint">等待中…</span>
          )}
          {rtState && script.length > 0 && (
            <span className="text-2xs text-ink-faint">
              指令 {Math.min(rtState.cursor + 1, script.length)}/{script.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={restart}
            className="rounded-lg border border-border px-3 py-1 text-xs text-ink-muted hover:border-border-strong hover:text-ink"
          >
            重播
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-panel-raised px-3 py-1 text-xs text-ink-muted hover:bg-border hover:text-ink"
            >
              关闭
            </button>
          )}
        </div>
      </div>
      )}
    </div>
  );
}
