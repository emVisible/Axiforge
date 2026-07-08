export type SurfaceTheme = "light" | "dark";

/** Search field shells — semantic tokens only (light/dark still differ in elevation). */
export const searchTheme = {
  light: {
    shell:
      "border-border/70 bg-canvas/60 hover:border-border hover:bg-surface " +
      "focus-within:border-brand/40 focus-within:bg-surface focus-within:ring-2 focus-within:ring-brand/10",
    icon: "text-ink-faint",
    input: "text-ink placeholder:text-ink-faint",
    clear: "text-ink-faint hover:bg-canvas hover:text-ink",
  },
  dark: {
    shell:
      "border-border bg-panel hover:border-border-strong hover:bg-panel-raised " +
      "focus-within:border-brand/40 focus-within:bg-surface-raised focus-within:ring-2 focus-within:ring-brand/15",
    icon: "text-ink-faint",
    input: "text-ink placeholder:text-ink-faint",
    clear: "text-ink-faint hover:bg-panel-raised hover:text-ink",
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
