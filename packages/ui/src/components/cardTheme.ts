export type SurfaceTheme = "light" | "dark";

/** Semantic card surfaces — theme via CSS tokens, not parallel hex palettes. */
export const cardTheme = {
  light: {
    surface:
      "border-border bg-surface shadow-sm hover:border-ink-muted/30 hover:shadow-md",
    surfaceStatic: "border-border bg-surface shadow-sm",
    muted: "border-border/80 bg-canvas",
    title: "text-ink group-hover:text-brand",
    subtitle: "text-ink-muted",
    description: "text-ink-muted",
    meta: "text-ink-faint",
    iconBox: "bg-brand-muted text-brand",
    cover: "bg-gradient-to-br from-canvas to-border",
    coverPlaceholder: "text-ink-faint/50",
    deleteBtn: "text-ink-faint hover:bg-danger/10 hover:text-danger",
  },
  dark: {
    surface:
      "border-border bg-surface-raised shadow-none hover:border-border-strong hover:bg-panel-raised",
    surfaceStatic: "border-border bg-surface-raised",
    muted: "border-border bg-panel",
    title: "text-ink group-hover:text-brand",
    subtitle: "text-ink-muted",
    description: "text-ink-muted",
    meta: "text-ink-faint",
    iconBox: "bg-brand-muted text-brand",
    cover: "bg-gradient-to-br from-panel to-surface",
    coverPlaceholder: "text-ink-faint/40",
    deleteBtn: "text-ink-faint hover:bg-danger/10 hover:text-danger",
  },
} as const;
