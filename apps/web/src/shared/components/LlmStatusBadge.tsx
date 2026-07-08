import { useLlmHealth } from "@/shared/hooks/useLlmHealth";
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
}

export default function LlmStatusBadge({ lastSource }: LlmStatusBadgeProps) {
  const { data } = useLlmHealth();
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
