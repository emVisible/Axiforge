import { useState } from "react";
import { Button, Input, Modal, ModalActions, Select } from "@/shared/components/ui";
import { loadLlmSettings, saveLlmSettings, type LlmSettings } from "@/shared/lib/llmSettings";
import { proseToAxsSystem, proseToAxsUser } from "@axiforge/axs";
import { generateAxsText } from "@/shared/api/localLlm";

interface LlmEndpointDialogProps {
  open: boolean;
  onClose: () => void;
  /** 保存后回调：让上层把徽标从"规则引擎"刷新成实际在用的引擎 */
  onSaved: (settings: LlmSettings | null) => void;
}

const KIND_OPTIONS = [
  { value: "ollama", label: "Ollama（/api/generate）" },
  { value: "openai", label: "OpenAI 兼容（/chat/completions）" },
];

/**
 * 桌面端本机模型配置。
 *
 * "测试一次"故意做成**一次真实生成**，不是轻量探活：可行的探活要么各厂商端点不统一
 * （`/api/tags` 只有 Ollama 有），要么另写一条请求通路——那就会出现"测试说通了、
 * 草稿还是失败"这种自相矛盾的判据。走同一条链路就只有一种真相，代价是一次生成，
 * 所以按钮叫"测试一次"而不是"测试连接"，且反馈里直接给出生成出来的前 120 字。
 */
export default function LlmEndpointDialog({ open, onClose, onSaved }: LlmEndpointDialogProps) {
  const current = loadLlmSettings();
  const [kind, setKind] = useState<LlmSettings["kind"]>(current?.kind ?? "ollama");
  const [baseUrl, setBaseUrl] = useState(current?.baseUrl ?? "http://localhost:11434");
  const [model, setModel] = useState(current?.model ?? "");
  const [probing, setProbing] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const draft = (): LlmSettings => ({ kind, baseUrl: baseUrl.trim().replace(/\/+$/, ""), model: model.trim() });

  const save = () => {
    if (!draft().baseUrl || !draft().model) {
      setFeedback("端点与模型名都要填，否则保存了也不会启用");
      return;
    }
    saveLlmSettings(draft());
    onSaved(draft());
    onClose();
  };

  /** 用一次最小真实请求验证通路：走的就是草稿那条链路，不留第二套判据 */
  const testConnection = async () => {
    setProbing(true);
    setFeedback(null);
    try {
      const text = await generateAxsText(
        draft(),
        proseToAxsSystem(),
        proseToAxsUser({ prose: "他推门进来。", title: "通路测试", defaultSpeaker: "旁白" }),
      );
      setFeedback(text.slice(0, 120));
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setFeedback(
        msg.includes("llm_unavailable")
          ? `${msg} —— 若 Ollama 就在本机，多半是没设 OLLAMA_ORIGINS（详见 docs/user）`
          : msg,
      );
    } finally {
      setProbing(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="本机模型"
      description="桌面端不连我们的服务器；草稿要模型写就指一个你机器上的端点。留空则用内置规则引擎。"
      footer={
        <ModalActions
          onCancel={onClose}
          cancelLabel="取消"
          onConfirm={save}
          confirmLabel="保存"
        />
      }
    >
      <div className="space-y-3">
        <Select
          label="协议"
          value={kind}
          onChange={(e) => setKind(e.target.value as LlmSettings["kind"])}
        >
          {KIND_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
        <Input
          label="端点"
          value={baseUrl}
          onChange={(e) => setBaseUrl(e.target.value)}
          placeholder={kind === "ollama" ? "http://localhost:11434" : "http://127.0.0.1:8000/v1"}
        />
        <Input
          label="模型名"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          placeholder={kind === "ollama" ? "qwen2.5:7b" : "deepseek-chat"}
        />
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => void testConnection()} disabled={probing}>
            {probing ? "测试中…" : "测试一次"}
          </Button>
          {current && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                saveLlmSettings(null);
                onSaved(null);
                onClose();
              }}
            >
              清除并回到规则引擎
            </Button>
          )}
        </div>
        {feedback && (
          <p className="rounded-lg bg-surface-raised px-3 py-2 text-2xs leading-relaxed text-ink-muted">
            {feedback}
          </p>
        )}
      </div>
    </Modal>
  );
}
