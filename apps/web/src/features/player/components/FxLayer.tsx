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
}

/** 全屏氛围特效 + 画面转场层（pointer-events 透明，不拦截点击） */
export default function FxLayer({ stage }: { stage: Stage }) {
  const effect = stage.fx.effect;
  const isParticle = effect === "rain" || effect === "snow" || effect === "sakura";
  const lastSeq = useRef(0);
  const [activeTransition, setActiveTransition] = useState<ActiveTransition | null>(
    null,
  );

  useEffect(() => {
    if (stage.transitionSeq > lastSeq.current) {
      lastSeq.current = stage.transitionSeq;
      const ms = Number.isFinite(stage.transitionMs) && stage.transitionMs > 0
        ? stage.transitionMs
        : 400;
      setActiveTransition({ seq: stage.transitionSeq, ms });
    }
  }, [stage.transitionSeq, stage.transitionMs]);

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
  }, [effect, isParticle]);

  return (
    <div className="pointer-events-none absolute inset-0 z-40 overflow-hidden">
      {/* 转场：仅在动画期间挂载，结束后卸载，避免黑场残留 */}
      {activeTransition && (
        <div
          key={`t-${activeTransition.seq}`}
          className="fx-transition absolute inset-0"
          style={{
            animation: `fxTransition ${activeTransition.ms}ms ease-in-out forwards`,
          }}
          onAnimationEnd={() => setActiveTransition(null)}
        />
      )}

      {effect === "flash" && (
        <div
          key={`f-${stage.fx.seq}`}
          className="fx-flash absolute inset-0"
          style={{ animationDuration: `${stage.fx.ms}ms` }}
        />
      )}

      {isParticle &&
        particles.map((p) => (
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
  );
}
