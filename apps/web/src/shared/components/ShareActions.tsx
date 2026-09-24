import { useCallback, useMemo, useState } from "react";
import { Check, Copy, Link2, QrCode } from "lucide-react";
import { Button, cn } from "@/shared/components/ui";

interface ShareActionsProps {
  url: string;
  title?: string;
  className?: string;
}

export default function ShareActions({ url, title, className }: ShareActionsProps) {
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);

  const qrSrc = useMemo(() => {
    const encoded = encodeURIComponent(url);
    return `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encoded}`;
  }, [url]);

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("复制链接", url);
    }
  }, [url]);

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <Button
        variant="secondary"
        size="sm"
        icon={copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        onClick={() => void copyLink()}
      >
        {copied ? "已复制" : "复制链接"}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        icon={<QrCode className="h-3.5 w-3.5" />}
        onClick={() => setShowQr((v) => !v)}
      >
        二维码
      </Button>
      <a
        href={url}
        className="inline-flex items-center gap-1 text-xs text-ink-muted hover:text-brand"
        title={title}
      >
        <Link2 className="h-3 w-3" />
        <span className="max-w-[200px] truncate">{url.replace(/^https?:\/\//, "")}</span>
      </a>
      {showQr && (
        <div className="w-full rounded-xl border border-border bg-surface p-3">
          <img src={qrSrc} alt="分享二维码" className="mx-auto h-40 w-40 rounded-lg" />
          <p className="mt-2 text-center text-3xs text-ink-faint">扫码打开分享页</p>
        </div>
      )}
    </div>
  );
}
