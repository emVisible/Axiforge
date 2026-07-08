import { MARK_COLOR, MARK_SOFT, type BrandIconVariant } from "./types";

/**
 * 方向 C（定稿）：统一紫灰剪影
 * 侧脸鹦鹉 + 锻造轴心为一体；同色系层次，无金/绿等跳色
 */
export default function BrandIconConure({ variant = "light" }: { variant?: BrandIconVariant }) {
  const mark = MARK_COLOR[variant];
  const soft = MARK_SOFT[variant];

  return (
    <>
      {/* 主体：头 · 喙 · 轴心柱 一体剪影 */}
      <path
        fill={mark}
        fillRule="evenodd"
        clipRule="evenodd"
        d="M15.4 27.8V20.4H11.5V13.2c0-3.8 3.1-6.9 6.9-7.2 2.8-.2 5.3 1.2 6.6 3.5l2.6 1-2.4 1.7c-.8-1.7-2.5-2.8-4.6-2.6-2.6.2-4.6 2.3-4.6 5.1v8.2h3.9v7.4H15.4ZM16.6 27.8V20.4h1.2v7.4h-1.2Z"
      />
      {/* 翼面：同色相叠，增加体积感 */}
      <path
        fill={mark}
        fillOpacity={soft}
        d="M12.9 17.6V14.9c0-1.2 1-2.2 2.2-2.3 1-.08 1.9.45 2.35 1.3l-1.2.85c-.25-.5-.75-.78-1.3-.74-.7.05-1.25.65-1.25 1.42v3.52H12.9Z"
      />
    </>
  );
}
