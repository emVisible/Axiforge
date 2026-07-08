import { create } from "zustand";

interface UIState {
  isPreviewOpen: boolean;
  isSidebarOpen: boolean;
  theme: "light" | "dark";
  togglePreview: () => void;
  setPreviewOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setTheme: (theme: "light" | "dark") => void;
}

export const useUIStore = create<UIState>((set) => ({
  isPreviewOpen: false,
  isSidebarOpen: true,
  theme: "light",
  togglePreview: () => set((state) => ({ isPreviewOpen: !state.isPreviewOpen })),
  setPreviewOpen: (open) => set({ isPreviewOpen: open }),
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setTheme: (theme) => set({ theme }),
}));
