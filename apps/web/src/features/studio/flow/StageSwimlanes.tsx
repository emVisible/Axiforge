import { useStore } from "reactflow";

import type { StageLane } from "./stageLayout";

interface StageSwimlanesProps {
  lanes: StageLane[];
  highlightedStageId?: string | null;
}

export default function StageSwimlanes({
  lanes,
  highlightedStageId,
}: StageSwimlanesProps) {
  const transform = useStore((s) => s.transform);
  const [tx, ty, zoom] = transform;

  if (!lanes.length) return null;

  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      style={{ zIndex: 0 }}
    >
      <g transform={`translate(${tx},${ty}) scale(${zoom})`}>
        {lanes.map((lane) => {
          const dimmed =
            highlightedStageId && highlightedStageId !== lane.stageId;
          return (
            <g key={lane.stageId} opacity={dimmed ? 0.35 : 1}>
              <rect
                x={lane.x}
                y={lane.y}
                width={lane.width}
                height={lane.height}
                rx={16}
                fill={lane.fill}
                stroke={lane.stroke}
                strokeWidth={1.5}
                strokeDasharray={dimmed ? "6 4" : undefined}
              />
              <text
                x={lane.x + 14}
                y={lane.y + 22}
                fill={lane.stroke.replace("30", "cc")}
                fontSize={13}
                fontWeight={600}
              >
                {lane.title}
              </text>
            </g>
          );
        })}
      </g>
    </svg>
  );
}
