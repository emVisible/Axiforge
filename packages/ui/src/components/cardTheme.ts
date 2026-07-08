export type SurfaceTheme = "light" | "dark";

export const cardTheme = {
  light: {
    surface:
      "border-border bg-surface shadow-sm hover:border-ink-muted/30 hover:shadow-md",
    surfaceStatic: "border-border bg-surface shadow-sm",
    muted: "border-border/80 bg-canvas",
    title: "text-ink group-hover:text-brand",
    subtitle: "text-ink-muted",
    description: "text-ink-muted",
    meta: "text-ink-muted/60",
    iconBox: "bg-brand-muted text-brand",
    cover: "bg-gradient-to-br from-canvas to-border/40",
    coverPlaceholder: "text-ink-muted/30",
    deleteBtn:
      "text-ink-muted/30 hover:bg-red-50 hover:text-red-500",
  },
  dark: {
    surface:
      "border-white/5 bg-white/[0.03] shadow-none hover:border-white/15 hover:bg-white/[0.06]",
    surfaceStatic: "border-white/5 bg-white/[0.03]",
    muted: "border-white/5 bg-white/[0.02]",
    title: "text-white/85 group-hover:text-white",
    subtitle: "text-white/40",
    description: "text-white/40",
    meta: "text-white/25",
    iconBox: "bg-white/5 text-white/30",
    cover: "bg-gradient-to-br from-white/5 to-white/[0.02]",
    coverPlaceholder: "text-white/10",
    deleteBtn:
      "text-white/20 hover:bg-white/10 hover:text-red-400",
  },
} as const;
