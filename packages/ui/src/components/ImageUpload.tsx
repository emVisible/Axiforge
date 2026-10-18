import { useEffect, useRef, useState } from "react";
import { ImagePlus } from "lucide-react";
import { cn } from "./formStyles";

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  /** Fill parent instead of fixed 128px box */
  fill?: boolean;
  className?: string;
  /**
   * 字节落地方式；缺省 = POST /api/v1/upload（服务端行为，逐字段不变）。
   * 桌面宿主注入本地实现，组件不判断平台。
   */
  upload?: (file: File) => Promise<string>;
  /** 引用 → 可显示 URL；缺省 = 原样（宿主素材根目录解析由注入方负责） */
  resolve?: (ref: string) => string;
}

/** 服务端上传口（组件默认行为） */
export async function uploadToServer(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/v1/upload", { method: "POST", body: form });
  const data = await res.json();
  return data.url as string;
}

export default function ImageUpload({
  value,
  onChange,
  fill = false,
  className,
  upload,
  resolve,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(value || "");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPreview(value || "");
  }, [value]);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setUploading(true);
    try {
      const url = await (upload ?? uploadToServer)(file);
      setPreview(url);
      onChange(url);
    } catch (e) {
      console.error("上传失败", e);
    } finally {
      setUploading(false);
    }
  };

  const shown = preview ? (resolve ? resolve(preview) : preview) : "";

  return (
    <div className={cn("space-y-2", fill && "h-full w-full", className)}>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const f = e.dataTransfer.files[0];
          if (f) void handleFile(f);
        }}
        className={cn(
          "relative flex cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-border bg-panel transition-colors hover:border-brand/40 group",
          fill ? "h-full min-h-[7.5rem] w-full" : "h-32 w-32",
        )}
      >
        {shown ? (
          <>
            <img src={shown} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center bg-ink/40 text-xs text-surface opacity-0 transition-opacity group-hover:opacity-100">
              更换图片
            </div>
          </>
        ) : (
          <div className="px-3 text-center text-ink-faint">
            <ImagePlus className="mx-auto mb-1 h-6 w-6" strokeWidth={1.75} />
            <div className="text-xs">{uploading ? "上传中..." : "拖拽或点击"}</div>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleFile(f);
          }}
        />
      </div>
      {preview && (
        <button
          type="button"
          onClick={() => {
            setPreview("");
            onChange("");
          }}
          className="text-xs text-ink-faint hover:text-danger"
        >
          移除图片
        </button>
      )}
    </div>
  );
}
