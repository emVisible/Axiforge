
interface RadarChartProps {
  data: {
    courage: number; // 勇气
    wisdom: number; // 智慧
    charm: number; // 魅力
    kindness: number; // 善良
    composure: number; // 沉着
    creativity: number; // 创造力
  };
  size?: number;
  className?: string;
}

const LABELS = ["勇气", "智慧", "魅力", "善良", "沉着", "创造力"];
const KEYS = [
  "courage",
  "wisdom",
  "charm",
  "kindness",
  "composure",
  "creativity",
];

const BRAND = "var(--color-brand)";
const BORDER = "var(--color-border)";
const BRAND_FILL = "color-mix(in srgb, var(--color-brand) 15%, transparent)";

// 六边形六个顶点的角度（从顶部开始，顺时针）
function getHexagonPoints(cx: number, cy: number, radius: number): string {
  return Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 3) * i - Math.PI / 2; // 从顶部开始
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);
    return `${x},${y}`;
  }).join(" ");
}

export default function RadarChart({
  data,
  size = 200,
  className = "",
}: RadarChartProps) {
  const cx = size / 2;
  const cy = size / 2;
  const maxRadius = size * 0.38;

  // 背景网格（4 层：25%, 50%, 75%, 100%）
  const gridLevels = [0.25, 0.5, 0.75, 1.0];

  // 数据点坐标
  const dataPoints = KEYS.map((key, i) => {
    const value =
      Math.max(0, Math.min(100, data[key as keyof typeof data] || 0)) / 100;
    const angle = (Math.PI / 3) * i - Math.PI / 2;
    return {
      x: cx + maxRadius * value * Math.cos(angle),
      y: cy + maxRadius * value * Math.sin(angle),
      value: data[key as keyof typeof data] || 0,
    };
  });

  const dataPolygon = dataPoints.map((p) => `${p.x},${p.y}`).join(" ");
  const labelRadius = maxRadius + 22;

  return (
    <div className={`inline-flex flex-col items-center ${className}`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* 背景网格 */}
        {gridLevels.map((level) => (
          <polygon
            key={level}
            points={getHexagonPoints(cx, cy, maxRadius * level)}
            fill="none"
            stroke={BORDER}
            strokeWidth={level === 1 ? 1.5 : 0.5}
            strokeDasharray={level === 1 ? "none" : "3 3"}
          />
        ))}

        {/* 轴线 */}
        {KEYS.map((_, i) => {
          const angle = (Math.PI / 3) * i - Math.PI / 2;
          const x = cx + maxRadius * Math.cos(angle);
          const y = cy + maxRadius * Math.sin(angle);
          return (
            <line
              key={i}
              x1={cx}
              y1={cy}
              x2={x}
              y2={y}
              stroke={BORDER}
              strokeWidth={0.5}
            />
          );
        })}

        {/* 数据区域 */}
        <polygon
          points={dataPolygon}
          fill={BRAND_FILL}
          stroke={BRAND}
          strokeWidth={2}
          strokeLinejoin="round"
        />

        {/* 数据点 */}
        {dataPoints.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={4}
            fill={BRAND}
            stroke="var(--color-surface)"
            strokeWidth={2}
          />
        ))}

        {/* 标签 */}
        {KEYS.map((_, i) => {
          const angle = (Math.PI / 3) * i - Math.PI / 2;
          const lx = cx + labelRadius * Math.cos(angle);
          const ly = cy + labelRadius * Math.sin(angle);
          const isLeft = lx < cx - 5;
          const isRight = lx > cx + 5;
          return (
            <text
              key={i}
              x={lx}
              y={ly}
              textAnchor={isLeft ? "end" : isRight ? "start" : "middle"}
              dominantBaseline="middle"
              className="fill-ink-muted text-[10px]"
              style={{ fontSize: "11px", fontFamily: "Inter, sans-serif" }}
            >
              {LABELS[i]}
            </text>
          );
        })}
      </svg>

      {/* 数值列表 */}
      <div className="mt-2 grid grid-cols-3 gap-x-4 gap-y-1">
        {KEYS.map((key, i) => (
          <div key={key} className="flex items-center gap-1.5 text-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-brand" />
            <span className="text-ink-muted">{LABELS[i]}</span>
            <span className="font-medium text-ink">
              {data[key as keyof typeof data] || 0}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
