import { useEffect, useMemo, useRef, useState } from "react";
import type { Stage } from "../lib/stage";

const PARTICLE_CHAR: Record<string, string> = {
  rain: "│",
  snow: "❄",
  sakura: "🌸",
};

interface ActiveTransition {
  seq: number;
  ms: number;
  kind: string;
}

function transitionClass(kind: string): string {
  switch (kind) {
    case "dissolve":
      return "fx-transition fx-transition-dissolve";
    case "wipe":
      return "fx-transition fx-transition-wipe";
    case "cut":
      return "";
    default:
      return "fx-transition";
  }
}

/** 全屏氛围特效 + 画面转场层（pointer-events 透明，不拦截点击） */
export default function FxLayer({ stage }: { stage: Stage }) {
  const effect = stage.fx.effect;
  const isParticle =
    effect !== "none" &&
    (effect === "rain" || effect === "snow" || effect === "sakura");
  const lastSeq = useRef(0);
  const [activeTransition, setActiveTransition] = useState<ActiveTransition | null>(
    null,
  );

  useEffect(() => {
    if (stage.transitionSeq <= lastSeq.current) return;
    lastSeq.current = stage.transitionSeq;
    const kind = stage.transitionKind || "fade";
    if (kind === "cut") {
      setActiveTransition(null);
      return;
    }
    const ms =
      Number.isFinite(stage.transitionMs) && stage.transitionMs > 0
        ? stage.transitionMs
        : 400;
    setActiveTransition({ seq: stage.transitionSeq, ms, kind });
  }, [stage.transitionSeq, stage.transitionMs, stage.transitionKind]);

  const particles = useMemo(() => {
    if (!isParticle) return [];
    const count = effect === "rain" ? 60 : 40;
    const speed = effect === "rain" ? 0.7 : effect === "snow" ? 3.5 : 4.5;
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * speed,
      duration: speed * (0.6 + Math.random() * 0.8),
      size: effect === "rain" ? 14 : 10 + Math.random() * 10,
      opacity: 0.3 + Math.random() * 0.6,
    }));
  }, [effect, isParticle, stage.fx.seq]);

  const flashMs = stage.fx.ms > 0 ? stage.fx.ms : 600;
  const lastFlashSeq = useRef(0);
  const [activeFlash, setActiveFlash] = useState<{ seq: number; ms: number } | null>(
    null,
  );

  useEffect(() => {
    if (effect !== "flash" || stage.fx.seq <= lastFlashSeq.current) return;
    lastFlashSeq.current = stage.fx.seq;
    setActiveFlash({ seq: stage.fx.seq, ms: flashMs });
  }, [effect, stage.fx.seq, flashMs]);

  useEffect(() => {
    if (effect !== "flash") setActiveFlash(null);
  }, [effect]);

  useEffect(() => {
    if (!activeFlash) return;
    const t = setTimeout(() => setActiveFlash(null), activeFlash.ms + 80);
    return () => clearTimeout(t);
  }, [activeFlash]);

  const transitionAnim =
    activeTransition == null
      ? undefined
      : activeTransition.kind === "dissolve"
        ? `fxTransitionSoft ${activeTransition.ms}ms ease-in-out forwards`
        : activeTransition.kind === "wipe"
          ? `fxTransitionWipe ${activeTransition.ms}ms ease-in-out forwards`
          : `fxTransition ${activeTransition.ms}ms ease-in-out forwards`;

  return (
    <div className="pointer-events-none absolute inset-0 z-40 overflow-hidden">
      {activeTransition && activeTransition.kind !== "cut" && (
        <div
          key={`t-${activeTransition.seq}`}
          className={transitionClass(activeTransition.kind)}
          style={{ animation: transitionAnim }}
          onAnimationEnd={() => setActiveTransition(null)}
        />
      )}

      {activeFlash && (
        <div
          key={`f-${activeFlash.seq}`}
          className="fx-flash absolute inset-0"
          style={{
            animation: `fxFlash ${activeFlash.ms}ms ease-out forwards`,
          }}
          onAnimationEnd={() => setActiveFlash(null)}
        />
      )}

      {isParticle && (
        <div key={`particles-${stage.fx.seq}`} className="absolute inset-0">
          {particles.map((p) => (
            <span
              key={p.id}
              className="fx-particle text-white"
              style={{
                left: `${p.left}%`,
                fontSize: `${p.size}px`,
                opacity: p.opacity,
                animationDelay: `${p.delay}s`,
                animationDuration: `${p.duration}s`,
              }}
            >
              {PARTICLE_CHAR[effect]}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
