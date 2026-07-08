/** Discover 暗色背景氛围层：纹理 + 光斑 + VN 语义线框 */

export default function DiscoverAtmosphere() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden
    >
      {/* 噪点纹理 */}
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E")`,
          backgroundSize: "128px 128px",
        }}
      />

      {/* 品牌光斑 */}
      <div className="absolute -left-32 top-20 h-96 w-96 rounded-full bg-brand/10 blur-3xl" />
      <div className="absolute -right-24 top-1/3 h-80 w-80 rounded-full bg-accent/5 blur-3xl" />
      <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-brand/5 blur-3xl" />

      {/* VN 对话框线框 */}
      <svg
        className="absolute right-[8%] top-[18%] h-24 w-32 opacity-[0.04]"
        viewBox="0 0 128 96"
        fill="none"
      >
        <rect
          x="4"
          y="4"
          width="120"
          height="72"
          rx="12"
          stroke="white"
          strokeWidth="2"
        />
        <path d="M20 76 L32 88 L44 76" stroke="white" strokeWidth="2" />
      </svg>

      {/* 分支线 */}
      <svg
        className="absolute bottom-[22%] left-[6%] h-28 w-28 opacity-[0.05]"
        viewBox="0 0 112 112"
        fill="none"
      >
        <path
          d="M56 8 L56 48 M56 48 L28 88 M56 48 L84 88"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
