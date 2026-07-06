import { useState } from "react";
import { Check, Copy, Download } from "lucide-react";
import type { CharacterData } from "@/types/character";
import { renderCharacterPrompt, renderSystemPrompt } from "@/lib/promptRenderer";
import { characterApi } from "@/api/characters";
import { Button } from "@/components/ui";

interface PromptExportProps {
  characterData: CharacterData;
  characterName: string;
  characterId?: string;
  tags?: { name: string }[];
}

type ExportMode = "system" | "full-plain" | "full-markdown" | "json";

export default function PromptExport({
  characterData,
  characterName,
  characterId,
}: PromptExportProps) {
  const [mode, setMode] = useState<ExportMode>("system");
  const [includeStories, setIncludeStories] = useState(false);
  const [includeRelations, setIncludeRelations] = useState(false);
  const [copied, setCopied] = useState(false);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    if (!characterId) return;
    setLoading(true);
    try {
      const data = await characterApi.export(characterId, {
        format:
          mode === "system"
            ? "system"
            : mode === "json"
              ? "json"
              : mode === "full-markdown"
                ? "markdown"
                : "plain",
        include_stories: includeStories,
        include_relations: includeRelations,
      });

      // 根据格式生成内容
      if (mode === "json") {
        setContent(JSON.stringify(data, null, 2));
      } else if (mode === "system") {
        setContent(renderSystemPrompt(characterData));
      } else {
        let text = renderCharacterPrompt(
          characterData,
          mode === "full-markdown" ? "markdown" : "plain",
        );
        if (data.stories) {
          text += "\n\n## 传记\n\n";
          data.stories.forEach((s: any) => {
            text += `### ${s.title}\n\n${s.content}\n\n`;
          });
        }
        if (data.relations) {
          text += "\n## 关系\n\n";
          data.relations.forEach((r: any) => {
            text += `- ${r.relation_name}: ${r.target_name}\n`;
          });
        }
        setContent(text);
      }
    } catch (e) {
      setContent("导出失败");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!content) return;
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!content) return;
    const ext =
      mode === "json" ? "json" : mode === "full-markdown" ? "md" : "txt";
    const blob = new Blob([content], { type: "text/plain" });
    const link = document.createElement("a");
    link.download = `${characterName || "character"}.${ext}`;
    link.href = URL.createObjectURL(blob);
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <div className="space-y-4">
      {/* 格式选择 */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: "system" as const, label: "System", desc: "注入LLM" },
          { key: "full-plain" as const, label: "纯文本", desc: "阅读" },
          { key: "full-markdown" as const, label: "Markdown", desc: "文档" },
          { key: "json" as const, label: "JSON", desc: "结构化" },
        ].map(({ key, label, desc }) => (
          <button
            key={key}
            onClick={() => {
              setMode(key);
              setContent("");
            }}
            className={`px-4 py-2 rounded-xl border-2 text-sm transition-all ${
              mode === key
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <span className="font-medium">{label}</span>
            <span className="text-xs text-gray-400 ml-1">{desc}</span>
          </button>
        ))}
      </div>

      {/* 包含选项 */}
      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            checked={includeStories}
            onChange={(e) => {
              setIncludeStories(e.target.checked);
              setContent("");
            }}
            className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
          />
          包含传记
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            checked={includeRelations}
            onChange={(e) => {
              setIncludeRelations(e.target.checked);
              setContent("");
            }}
            className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
          />
          包含关系
        </label>
        <Button
          size="sm"
          variant="secondary"
          onClick={handleExport}
          loading={loading}
        >
          生成预览
        </Button>
      </div>

      {/* 预览 */}
      {content && (
        <>
          <pre className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-700 whitespace-pre-wrap max-h-64 overflow-y-auto leading-relaxed">
            {content}
          </pre>
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>{content.split("\n").length} 行</span>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={handleDownload}>
                <Download className="h-3.5 w-3.5" strokeWidth={1.75} />
                下载
              </Button>
              <Button
                size="sm"
                onClick={handleCopy}
                icon={
                  copied ? (
                    <Check className="h-3.5 w-3.5" strokeWidth={1.75} />
                  ) : (
                    <Copy className="h-3.5 w-3.5" strokeWidth={1.75} />
                  )
                }
              >
                {copied ? "已复制" : "复制"}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
