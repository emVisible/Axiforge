import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type StudioChromeContextValue = {
  sidebarRail: boolean;
  setSidebarRail: (v: boolean) => void;
  toggleSidebarRail: () => void;
};

const StudioChromeContext = createContext<StudioChromeContextValue | null>(null);

export function StudioChromeProvider({ children }: { children: ReactNode }) {
  const [sidebarRail, setSidebarRail] = useState(false);
  const toggleSidebarRail = useCallback(
    () => setSidebarRail((v) => !v),
    [],
  );
  const value = useMemo(
    () => ({ sidebarRail, setSidebarRail, toggleSidebarRail }),
    [sidebarRail, toggleSidebarRail],
  );
  return (
    <StudioChromeContext.Provider value={value}>
      {children}
    </StudioChromeContext.Provider>
  );
}

export function useStudioChrome() {
  const ctx = useContext(StudioChromeContext);
  if (!ctx) {
    throw new Error("useStudioChrome must be used within StudioChromeProvider");
  }
  return ctx;
}
