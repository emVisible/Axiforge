import { useSyncExternalStore } from "react";

import { cardTheme, type SurfaceTheme } from "../components/cardTheme";

function readTheme(): SurfaceTheme {
  if (typeof document === "undefined") return "light";
  return document.documentElement.getAttribute("data-theme") === "dark"
    ? "dark"
    : "light";
}

function subscribe(onStoreChange: () => void) {
  const observer = new MutationObserver(onStoreChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  return () => observer.disconnect();
}

/** Resolves light/dark from `document.documentElement[data-theme]`. */
export function useSurfaceTheme(): SurfaceTheme {
  return useSyncExternalStore(subscribe, readTheme, () => "light");
}

/** Optional override for legacy call sites; omit to read runtime theme. */
export function useResolvedSurfaceTheme(
  override?: SurfaceTheme,
): SurfaceTheme {
  const runtime = useSurfaceTheme();
  return override ?? runtime;
}

export function useCardTheme(override?: SurfaceTheme) {
  const theme = useResolvedSurfaceTheme(override);
  return cardTheme[theme];
}
