import { useLlmHealth } from "@/shared/hooks/useLlmHealth";
import { isLocalOnlyDeployment } from "@/shared/lib/deployment";
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

  if (isLocalOnlyDeployment()) {
    // 本地态没问过健康端点，data 恒空；此时算出的 degraded 会把「不知道」演成「已降级」。
    // 桌面的模型提供方就是本地规则引擎，除非某次草稿真的由模型返回过来源。
    return (
      <Badge variant="default">AI · {lastSource ? LABELS[lastSource] || lastSource : "本地规则引擎"}</Badge>
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
