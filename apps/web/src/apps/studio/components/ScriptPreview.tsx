import { useCallback, useEffect, useMemo, useState } from "react";
import {
  start as engineStart,
  proceed as engineProceed,
  choose as engineChoose,
  type StoryPackage,
  type RuntimeState,
  type StoryView,
} from "@axiforge/core";
import { EMPTY_STAGE, foldStage, type Stage } from "@/apps/player/lib/stage";
import { renderRich } from "@/apps/player/lib/richText";
import FxLayer from "@/apps/player/components/FxLayer";
import { getImageUrl } from "@/lib/imageUrl";
import { expressionLabel } from "@/lib/expressions";
import type { Instruction } from "@axiforge/core";

interface RoleOption {
  characterRefId: string;
  name: string;
  imagePath?: string | null;
}

const POSITION_CLASS: Record<string, string> = {
  left: "left-[16%] -translate-x-1/2",
  center: "left-1/2 -translate-x-1/2",
  right: "right-[16%] translate-x-1/2",
};

/**
 * 节点演出实时预览（v1.3）：把当前节点的 script 包成单 Beat StoryPackage，
 * 用 @axiforge/core 引擎当场播放——编辑侧即时验证演出，无需跳转 Player（对标竞品弱点 M1）。
 */
export default function ScriptPreview({
  script,
  roles,
  onClose,
}: {
  script: Instruction[];
  roles: RoleOption[];
  onClose: () => void;
}) {
  const pkg = useMemo<StoryPackage>(
    () => ({
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
    }),
    [script, roles],
  );

  const [rtState, setRtState] = useState<RuntimeState | null>(null);
  const [view, setView] = useState<StoryView | null>(null);
  const [stage, setStage] = useState<Stage>(EMPTY_STAGE);

  const restart = useCallback(() => {
    const { state, view: v } = engineStart(pkg);
    setRtState(state);
    setStage(foldStage(EMPTY_STAGE, v.directives));
    setView(v);
  }, [pkg]);

  useEffect(() => {
    restart();
  }, [restart]);

  const advance = useCallback(() => {
    if (!rtState || !view || view.waiting === "end") return;
    const { state, view: v } = engineProceed(pkg, rtState);
    setRtState(state);
    setStage((prev) => foldStage(prev, v.directives));
    setView(v);
  }, [pkg, rtState, view]);

  const pick = useCallback(
    (i: number) => {
      if (!rtState || view?.waiting !== "choice") return;
      const { state, view: v } = engineChoose(pkg, rtState, i);
      setRtState(state);
      setStage((prev) => foldStage(prev, v.directives));
      setView(v);
    },
    [pkg, rtState, view],
  );

  // wait 指令自动推进
  useEffect(() => {
    if (view?.waiting === "wait") {
      const t = setTimeout(advance, view.waitMs ?? 500);
      return () => clearTimeout(t);
    }
  }, [view, advance]);

  const charById = useMemo(() => {
    const m: Record<string, RoleOption> = {};
    for (const r of roles) m[r.characterRefId] = r;
    return m;
  }, [roles]);

  const line = view?.waiting === "say" ? view.line : undefined;
  const speakerId = line?.characterId ?? null;
  const isEnd = view?.waiting === "end";
  const bgUrl = getImageUrl(stage.background || undefined);

  const cameraStyle = {
    transform: `scale(${stage.camera.scale}) translate(${stage.camera.x}%, ${stage.camera.y}%)`,
    transition: "transform 300ms ease-out",
  } as const;

  const sprites = Object.entries(stage.sprites);
  const displaySprites = speakerId && !stage.sprites[speakerId]
    ? [...sprites, [speakerId, { position: "center", expression: undefined }] as const]
    : sprites;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a14] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 舞台 */}
        <div
          className="relative aspect-video w-full cursor-pointer select-none overflow-hidden bg-[#0a0a14]"
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
                        backgroundImage: `linear-gradient(180deg, rgba(10,10,20,0.5), rgba(20,20,40,0.9)), url(${bgUrl})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }
                    : {
                        backgroundImage:
                          "linear-gradient(180deg,#0a0a14,#141428)",
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
                      <img src={img} alt={role?.name || ""} className="max-h-[46vh] w-auto object-contain drop-shadow-2xl" />
                    ) : (
                      <div className="flex h-24 w-20 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-center text-[10px] text-white/50">
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

          {/* 文本 / 结束 */}
          {line && (
            <div className="absolute inset-x-0 bottom-0 z-50 p-4">
              <div className="rounded-xl border border-white/5 bg-black/70 p-4 backdrop-blur-md">
                {line.speaker && (
                  <div className="mb-1 text-xs font-medium tracking-wider text-white/50">
                    {line.speaker}
                  </div>
                )}
                <p className="text-sm leading-relaxed text-white/85">
                  {renderRich(line.text, !!line.rich)}
                </p>
              </div>
            </div>
          )}

          {isEnd && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60">
              <span className="text-sm tracking-[0.3em] text-white/60">演出结束</span>
            </div>
          )}
        </div>

        {/* 控制条 */}
        <div className="flex items-center justify-between gap-2 border-t border-white/5 bg-black/40 px-4 py-2.5">
          <div className="flex flex-wrap gap-1.5">
            {view?.waiting === "choice" &&
              view.choices?.map((c) => (
                <button
                  key={c.index}
                  onClick={() => pick(c.index)}
                  disabled={c.disabled}
                  className={`rounded-lg border px-3 py-1 text-xs ${c.disabled ? "border-white/5 text-white/20" : "border-white/15 text-white/70 hover:border-white/40 hover:text-white"}`}
                >
                  {c.index + 1}. {c.label}
                </button>
              ))}
            {view?.waiting === "say" && (
              <span className="text-[11px] text-white/30">点击舞台继续</span>
            )}
            {view?.waiting === "wait" && (
              <span className="text-[11px] text-white/30">等待中…</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={restart}
              className="rounded-lg border border-white/10 px-3 py-1 text-xs text-white/50 hover:text-white/80"
            >
              重播
            </button>
            <button
              onClick={onClose}
              className="rounded-lg bg-white/10 px-3 py-1 text-xs text-white/70 hover:bg-white/20"
            >
              关闭
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
