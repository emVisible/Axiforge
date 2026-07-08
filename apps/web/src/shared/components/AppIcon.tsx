import { cn } from "@/shared/components/ui";
import { BrandIconGlyph, type BrandIconDirection } from "@/shared/components/brand-icons";

type AppIconSize = "sm" | "md" | "lg";
type AppIconVariant = "light" | "dark";

const sizeClasses: Record<AppIconSize, string> = {
  sm: "h-7 w-7",
  md: "h-8 w-8",
  lg: "h-10 w-10",
};

interface AppIconProps {
  size?: AppIconSize;
  variant?: AppIconVariant;
/** 品牌标：紫灰鹦鹉剪影（透明底） */
  direction?: BrandIconDirection;
  className?: string;
}

export default function AppIcon({
  size = "md",
  variant = "light",
  direction = "conure",
  className = "",
}: AppIconProps) {
  return (
    <span
      className={cn("inline-flex shrink-0 items-center justify-center", sizeClasses[size], className)}
      aria-hidden
    >
      <svg viewBox="0 0 32 32" fill="none" className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
        <BrandIconGlyph direction={direction} variant={variant} />
      </svg>
    </span>
  );
}
