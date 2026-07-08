/** Semantic color names for non-Tailwind consumers (canvas libs, inline styles).
 *  Prefer CSS vars at runtime so values track the active data-theme. */
export const tokens = {
  brand: "var(--ax-brand)",
  brandHover: "var(--ax-brand-hover)",
  brandMuted: "var(--ax-brand-muted)",
  canvas: "var(--ax-canvas)",
  surface: "var(--ax-surface)",
  surfaceRaised: "var(--ax-surface-raised)",
  panel: "var(--ax-panel)",
  panelRaised: "var(--ax-panel-raised)",
  ink: "var(--ax-ink)",
  inkMuted: "var(--ax-ink-muted)",
  inkFaint: "var(--ax-ink-faint)",
  border: "var(--ax-border)",
  borderStrong: "var(--ax-border-strong)",
  accent: "var(--ax-accent)",
  accentSoft: "var(--ax-accent-soft)",
  danger: "var(--ax-danger)",
} as const;

export type ThemeMode = "light" | "dark";
