import { MARK_COLOR, type BrandIconVariant } from "./types";

/**
 * 方向 B（Anthropic 式）：单路径有机曲线
 * 圆角 A 形外轮廓，无轴、无颊斑、无镂空
 */
export default function BrandIconMono({ variant = "light" }: { variant?: BrandIconVariant }) {
  const mark = MARK_COLOR[variant];

  return (
    <path
      fill={mark}
      d="M16 6C21 6 25 10.5 24.5 16L23.5 25H20.5L21 16.5C21.2 12 18.5 9 16 9C13.5 9 10.8 12 11 16.5L11.5 25H8.5L7.5 16C7 10.5 11 6 16 6Z"
    />
  );
}
