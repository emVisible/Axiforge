/** Shared form control class names — keep visual language consistent. */

export const inputBase =
  "w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-ink " +
  "placeholder:text-ink-muted/50 transition-all duration-200 outline-none " +
  "hover:border-gray-300 focus:border-brand focus:ring-2 focus:ring-brand/15 " +
  "disabled:cursor-not-allowed disabled:opacity-50";

export const inputSm =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs text-ink " +
  "placeholder:text-ink-muted/50 transition-all duration-200 outline-none " +
  "hover:border-gray-300 focus:border-brand focus:ring-2 focus:ring-brand/15";

export const inputCompact =
  "w-full rounded-lg border border-border bg-surface px-2 py-1.5 text-[11px] text-ink " +
  "placeholder:text-ink-muted/50 transition-all duration-200 outline-none " +
  "hover:border-gray-300 focus:border-brand focus:ring-1 focus:ring-brand/15";

export const inputError =
  "border-red-300 bg-red-50/40 focus:border-red-400 focus:ring-red-200/30";

export const labelBase =
  "block text-xs font-medium text-ink-muted mb-1.5 tracking-wide";

export const labelSm =
  "block text-[11px] font-medium uppercase tracking-wider text-ink-muted/80 mb-1.5";

export const fieldHint = "mt-1.5 text-xs text-ink-muted/70";

export const fieldError = "mt-1.5 text-xs text-red-500";

export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}
