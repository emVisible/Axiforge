export type BrandIconVariant = "light" | "dark";

/** 主色：品牌紫灰 */
export const MARK_COLOR: Record<BrandIconVariant, string> = {
  light: "#3b3473",
  dark: "#d4d0e8",
};

/** 同色系浅层（翼面/体积，非跳色） */
export const MARK_SOFT: Record<BrandIconVariant, number> = {
  light: 0.38,
  dark: 0.32,
};

export type BrandIconDirection = "conure" | "axis" | "mono";
