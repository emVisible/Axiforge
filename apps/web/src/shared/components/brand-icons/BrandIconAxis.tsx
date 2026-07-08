import { MARK_COLOR, MARK_SOFT, type BrandIconVariant } from "./types";

/**
 * 方向 A（Cursor 式）：纯几何字标 — 锻造轴 + 大写 A
 * 零 IP、零 accent，工具/工作台气质
 */
export default function BrandIconAxis({ variant = "light" }: { variant?: BrandIconVariant }) {
  const mark = MARK_COLOR[variant];

  return (
    <>
      <path d="M15.1 4.5h1.8v23h-1.8z" fill={mark} fillOpacity={MARK_SOFT[variant]} />
      <path
        fill={mark}
        fillRule="evenodd"
        clipRule="evenodd"
        d="M16 6.5 23.5 23.5H20.6l-1.6-3.8H12.9l-1.6 3.8H8.5L16 6.5Zm0 4.2-2.8 6.6h5.6L16 10.7Z"
      />
    </>
  );
}
