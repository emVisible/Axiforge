import { useEffect } from "react";

interface ToastProps {
  message: string;
  type?: "success" | "error";
  onClose: () => void;
}

export default function Toast({
  message,
  type = "success",
  onClose,
}: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onClose, 2500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      className={`fixed bottom-6 right-6 px-4 py-3 rounded-xl shadow-lg text-sm z-50 animate-slide-up ${
        type === "error"
          ? "bg-red-50 text-red-600 border border-red-200"
          : "bg-emerald-50 text-emerald-600 border border-emerald-200"
      }`}
    >
      {message}
    </div>
  );
}
