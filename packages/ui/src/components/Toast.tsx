import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { CheckCircle2, Info, X, XCircle } from "lucide-react";

import { cn } from "./formStyles";
import { useResolvedSurfaceTheme } from "../hooks/useSurfaceTheme";

type ToastVariant = "success" | "error" | "info";

interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  showToast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

/**
 * 两套配色，和 Badge 一样按解析后的表面主题选。
 *
 * 以前这里只有一套亮色类名（`bg-emerald-50 text-emerald-800`），后果不是"暗色下不好看"
 * 而是**在暗色主题里画出一块亮色**——而它一直没人看见，因为中台的产物里连这些类名的规则
 * 都没生成（`apps/admin` 的 CSS 少了 `@source "../../../packages/ui/src"`）。
 * 补上扫描就会把它暴露出来，所以两处必须一起改，不能只改配置。
 * 危险色在暗侧用 `rose` 而不是 `red`：与 Badge 的 danger 保持同一族。
 */
const lightVariantStyles: Record<ToastVariant, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  error: "border-red-200 bg-red-50 text-red-800",
  info: "border-border bg-surface text-ink",
};

const darkVariantStyles: Record<ToastVariant, string> = {
  success: "border-emerald-500/20 bg-emerald-500/15 text-emerald-300",
  error: "border-rose-500/20 bg-rose-500/15 text-rose-300",
  info: "border-border bg-panel text-ink",
};

const variantIcons: Record<ToastVariant, typeof Info> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  // 表面主题在 Provider 这一层解析一次：每条 toast 的底色与文字必须同源，
  // 逐条再取一遍会在新老提示共存于切换瞬间时画出两种配色。
  const surfaceTheme = useResolvedSurfaceTheme();

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, variant: ToastVariant = "info") => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, message, variant }]);
      setTimeout(() => dismiss(id), 4000);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2">
        {toasts.map((t) => {
          const Icon = variantIcons[t.variant];
          return (
            <div
              key={t.id}
              className={cn(
                "pointer-events-auto flex items-start gap-2 rounded-xl border px-4 py-3 text-sm shadow-lg animate-fade-in",
                (surfaceTheme === "dark" ? darkVariantStyles : lightVariantStyles)[t.variant],
              )}
            >
              <Icon className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.75} />
              <span className="flex-1">{t.message}</span>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                className="text-current/60 transition-colors hover:text-current"
                aria-label="关闭"
              >
                <X className="h-3.5 w-3.5" strokeWidth={1.75} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}
