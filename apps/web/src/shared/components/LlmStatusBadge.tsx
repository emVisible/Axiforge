import { useState } from "react";
import { useLlmHealth } from "@/shared/hooks/useLlmHealth";
import { isLocalOnlyDeployment } from "@/shared/lib/deployment";
import { loadLlmSettings, type LlmSettings } from "@/shared/lib/llmSettings";
import LlmEndpointDialog from "./LlmEndpointDialog";
import { Badge } from "@/shared/components/ui";

const LABELS: Record<string, string> = {
  xinference: "Xinference",
  ollama: "Ollama",
  rules: "规则引擎",
  openai: "OpenAI",
  deepseek: "DeepSeek",
};

interface LlmStatusBadgeProps {
  lastSource?: string;
  /**
   * 桌面态：配了本机模型但这次没走上（退回规则引擎的原因）。
   * 必须显面——否则用户只看到「AI · 规则引擎」，分不清"我没配"和"配了但端点挂了/CORS 被挡"。
   * 静默降级比失败更难排查。
   */
  degradedFrom?: string;
}

export default function LlmStatusBadge({ lastSource, degradedFrom }: LlmStatusBadgeProps) {
  const desktop = isLocalOnlyDeployment();
  const [configOpen, setConfigOpen] = useState(false);
  const [configured, setConfigured] = useState<LlmSettings | null>(() =>
    desktop ? loadLlmSettings() : null,
  );
  const { data } = useLlmHealth();

  if (desktop) {
    // 本地态没问过健康端点，data 恒空；拿它算降级会把「不知道」演成「已降级」。
    // 桌面的降级只有一个判据：某次草稿真的配了模型却没走上，由调用方把原因传进来。
    const active = lastSource || (configured ? configured.kind : "rules");
    return (
      <>
        <button
          type="button"
          onClick={() => setConfigOpen(true)}
          title={degradedFrom ?? "配置本机模型端点（留空则用内置规则引擎）"}
          className="rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          <Badge variant={degradedFrom ? "amber" : "default"}>
            AI · {LABELS[active] || active}
            {degradedFrom ? "（模型不可用）" : ""}
          </Badge>
        </button>
        {configOpen && (
          <LlmEndpointDialog
            open={configOpen}
            onClose={() => setConfigOpen(false)}
            onSaved={setConfigured}
          />
        )}
      </>
    );
  }

  const active = lastSource || data?.active_provider || "rules";
  const label = LABELS[active] || active;
  const degraded = active === "rules" && data?.mode !== "rules";

  return (
    <Badge variant={degraded ? "amber" : "default"}>
      AI · {label}
      {degraded ? "（降级）" : ""}
    </Badge>
  );
}
