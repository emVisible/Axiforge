import type { ComponentType } from "react";
import BrandIconAxis from "./BrandIconAxis";
import BrandIconConure from "./BrandIconConure";
import BrandIconMono from "./BrandIconMono";
import type { BrandIconDirection, BrandIconVariant } from "./types";

export type { BrandIconDirection, BrandIconVariant } from "./types";

const ICONS: Record<
  BrandIconDirection,
  ComponentType<{ variant?: BrandIconVariant }>
> = {
  conure: BrandIconConure,
  axis: BrandIconAxis,
  mono: BrandIconMono,
};

export function BrandIconGlyph({
  direction = "conure",
  variant = "light",
}: {
  direction?: BrandIconDirection;
  variant?: BrandIconVariant;
}) {
  const Icon = ICONS[direction];
  return <Icon variant={variant} />;
}

export { BrandIconAxis, BrandIconConure, BrandIconMono };
