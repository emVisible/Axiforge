export type SurfaceTheme = "light" | "dark";

export const searchTheme = {
  light: {
    shell:
      "border-border/70 bg-canvas/60 hover:border-border hover:bg-surface " +
      "focus-within:border-brand/40 focus-within:bg-surface focus-within:ring-2 focus-within:ring-brand/10",
    icon: "text-ink-muted/40",
    input: "text-ink placeholder:text-ink-muted/45",
    clear: "text-ink-muted/40 hover:bg-canvas hover:text-ink",
  },
  dark: {
    shell:
      "border-white/10 bg-white/[0.04] hover:border-white/15 hover:bg-white/[0.06] " +
      "focus-within:border-white/20 focus-within:bg-white/[0.06] focus-within:ring-2 focus-within:ring-white/[0.06]",
    icon: "text-white/35",
    input: "text-white/90 placeholder:text-white/30",
    clear: "text-white/35 hover:bg-white/10 hover:text-white/70",
  },
} as const;

export const searchWidthClasses = {
  sm: "w-44",
  md: "w-56",
  lg: "w-72",
  full: "w-full",
} as const;

export type SearchWidth = keyof typeof searchWidthClasses;
export type SearchSize = "sm" | "md";

export const searchSizeClasses: Record<
  SearchSize,
  { shell: string; icon: string; input: string; clear: string }
> = {
  sm: {
    shell: "h-8 gap-1.5 px-2.5",
    icon: "h-3.5 w-3.5",
    input: "text-xs",
    clear: "h-5 w-5",
  },
  md: {
    shell: "h-9 gap-2 px-3",
    icon: "h-4 w-4",
    input: "text-sm",
    clear: "h-6 w-6",
  },
};
