import { useState, useRef } from "react";
import { ImagePlus } from "lucide-react";

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
}

export default function ImageUpload({ value, onChange }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(value || "");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/v1/upload", { method: "POST", body: form });
      const data = await res.json();
      setPreview(data.url);
      onChange(data.url);
    } catch (e) {
      console.error("上传失败", e);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const f = e.dataTransfer.files[0];
          if (f) handleFile(f);
        }}
        className="relative w-32 h-32 border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center cursor-pointer hover:border-blue-300 transition-colors overflow-hidden group"
      >
        {preview ? (
          <>
            <img src={preview} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs">
              更换图片
            </div>
          </>
        ) : (
          <div className="text-center text-gray-400">
            <ImagePlus className="mx-auto mb-1 h-6 w-6" strokeWidth={1.75} />
            <div className="text-xs">
              {uploading ? "上传中..." : "拖拽或点击"}
            </div>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
      </div>
      {preview && (
        <button
          onClick={() => {
            setPreview("");
            onChange("");
          }}
          className="text-xs text-gray-400 hover:text-red-500"
        >
          移除图片
        </button>
      )}
    </div>
  );
}
