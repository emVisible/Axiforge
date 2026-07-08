import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useParams } from "react-router";
import { useStory, useUpdateStory } from "@/shared/hooks/useStories";
import { useCharacter } from "@/shared/hooks/useCharacters";
import { ErrorDisplay, Button, BackLink, LoadingSpinner } from "@/shared/components/ui";
import Shell from "@/shared/components/Shell";
import ReactMarkdown from "react-markdown";
import { routes } from "@/shared/lib/routes";
import { aiApi } from "@/shared/api/ai";
import LlmStatusBadge from "@/shared/components/LlmStatusBadge";
import { getCreatorId } from "@/shared/lib/creatorId";
import { biographyToProse } from "@/features/writer/lib/storyToAxs";

const tools = [
  { label: "标题", prefix: "## ", suffix: "", icon: "H" },
  { label: "粗体", prefix: "**", suffix: "**", icon: "B" },
  { label: "斜体", prefix: "*", suffix: "*", icon: "I" },
  { label: "分割线", prefix: "\n---\n", suffix: "", icon: "—" },
  { label: "引用", prefix: "> ", suffix: "", icon: "❝" },
  { label: "列表", prefix: "- ", suffix: "", icon: "•" },
];

function extractOutline(content: string): { title: string; index: number }[] {
  const lines = content.split("\n");
  return lines
    .map((line, i) => {
      const match = line.match(/^## (.+)/);
      return match ? { title: match[1], index: i } : null;
    })
    .filter(Boolean) as { title: string; index: number }[];
}

export default function StoryEditPage() {
  const { id: characterId, storyId } = useParams<{
    id: string;
    storyId: string;
  }>();
  const { data: story, isLoading, error } = useStory(characterId!, storyId!);
  const { data: character } = useCharacter(characterId!);
  const updateStory = useUpdateStory(characterId!);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saved, setSaved] = useState(false);
  const [outlineOpen, setOutlineOpen] = useState(false);
  const [axsOpen, setAxsOpen] = useState(false);
  const [axsDraft, setAxsDraft] = useState("");
  const [axsBusy, setAxsBusy] = useState(false);
  const [axsSource, setAxsSource] = useState<string | undefined>();
  const [axsError, setAxsError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const outline = useMemo(() => extractOutline(content), [content]);

  useEffect(() => {
    if (story) {
      setTitle(story.title);
      setContent(story.content);
    }
  }, [story]);

  const autoSave = useCallback(() => {
    if (!story) return;
    updateStory.mutate(
      { storyId: story.id, data: { title, content } },
      {
        onSuccess: () => {
          setSaved(true);
          setTimeout(() => setSaved(false), 2000);
        },
      },
    );
  }, [title, content, story, updateStory]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        autoSave();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [autoSave]);

  const handleTool = (prefix: string, suffix: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = content.substring(start, end);
    const insertText = prefix + selected + suffix;
    const newContent =
      content.substring(0, start) + insertText + content.substring(end);
    setContent(newContent);
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(
        start + prefix.length,
        start + prefix.length + selected.length,
      );
    });
  };

  const handleOutlineClick = (lineIndex: number) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const lines = content.split("\n");
    let pos = 0;
    for (let i = 0; i < Math.min(lineIndex, lines.length); i++) {
      pos += lines[i].length + 1;
    }
    ta.focus();
    ta.setSelectionRange(pos, pos);
    const lineHeight = 24;
    ta.scrollTop = Math.max(0, lineIndex * lineHeight - 100);
    setOutlineOpen(false);
  };

  const convertToAxs = async () => {
    if (!content.trim()) return;
    setAxsBusy(true);
    setAxsError(null);
    try {
      const res = await aiApi.proseToAxs({
        prose: biographyToProse(content),
        title: title || story?.title || "未命名",
        role_names: character?.name ? [character.name] : [],
        default_speaker: character?.name || "旁白",
        author_id: getCreatorId(),
      });
      setAxsSource(res.source);
      setAxsDraft(res.axs);
      setAxsOpen(true);
    } catch {
      setAxsError("转换失败，请稍后重试");
    } finally {
      setAxsBusy(false);
    }
  };

  const copyAxs = async () => {
    await navigator.clipboard.writeText(axsDraft);
  };

  if (isLoading) {
    return (
      <Shell>
        <LoadingSpinner />
      </Shell>
    );
  }
  if (error) return <ErrorDisplay message="加载失败" />;
  if (!story) return <ErrorDisplay message="篇章不存在" />;

  const wordCount = (() => {
    const text = content.trim();
    if (!text) return 0;
    const enWords = (text.match(/[a-zA-Z]+/g) || []).length;
    const cnChars = (text.match(/[\u4e00-\u9fff]/g) || []).length;
    const other = text.replace(/[a-zA-Z\u4e00-\u9fff\s]/g, "").length;
    return enWords + cnChars + other;
  })();

  return (
    <Shell>
      <div className="animate-fadeIn">
      {/* 顶栏 */}
      <div className="sticky top-0 z-10 -mx-4 mb-8 border-b border-border bg-surface/90 px-4 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <BackLink to={routes.characters.story(characterId!, story.id)}>
              返回阅读
            </BackLink>
            <span className="text-border">|</span>
            <span className="truncate text-sm text-ink-muted">
              {character?.name}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-ink-muted">{wordCount} 字</span>
            {saved && (
              <span className="text-xs text-emerald-500">✓ 已保存</span>
            )}
            <LlmStatusBadge lastSource={axsSource} />
            <Button
              size="sm"
              variant="secondary"
              onClick={convertToAxs}
              loading={axsBusy}
            >
              转为 AXS
            </Button>
            <Button
              size="sm"
              onClick={autoSave}
              loading={updateStory.isPending}
            >
              保存
            </Button>
          </div>
        </div>
      </div>

      {/* 标题 */}
      <div className="mb-8">
        <div className="flex items-baseline gap-3">
          <span className="text-xs font-medium text-ink-muted/40 uppercase tracking-widest flex-shrink-0">
            篇章
          </span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="输入标题…"
            className="flex-1 text-2xl font-bold text-ink border-none focus:outline-none bg-transparent placeholder:text-ink-muted/40 p-0"
          />
        </div>
        <div className="mt-2 ml-[52px] text-xs text-ink-muted">
          {new Date(story.updated_at).toLocaleDateString("zh-CN", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </div>
      </div>

      {/* 双列 */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* 预览区 — 左侧 */}
        <div className="flex-1 bg-canvas rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="px-5 py-2.5 border-b border-border">
            <span className="text-xs text-ink-muted font-medium">预览</span>
          </div>
          <div className="p-6 min-h-[65vh] overflow-y-auto">
            <div className="prose prose-stone max-w-none">
              <ReactMarkdown
                components={{
                  h1: ({ children }) => (
                    <h1 className="text-2xl font-bold text-ink mt-8 mb-3 pb-2 border-b border-border">
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-xl font-semibold text-ink mt-6 mb-2">
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-lg font-medium text-ink mt-5 mb-1.5">
                      {children}
                    </h3>
                  ),
                  p: ({ children }) => (
                    <p className="text-[15px] text-ink-muted leading-relaxed mb-3">
                      {children}
                    </p>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-semibold text-ink">
                      {children}
                    </strong>
                  ),
                  em: ({ children }) => (
                    <em className="italic text-ink-muted">{children}</em>
                  ),
                  del: ({ children }) => (
                    <del className="line-through text-ink-muted">{children}</del>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-[3px] border-accent/40 pl-5 py-1 my-4 italic text-ink-muted bg-accent/5 rounded-r-lg">
                      {children}
                    </blockquote>
                  ),
                  hr: () => (
                    <div className="my-8 text-center text-accent/60 text-lg">
                      ❧
                    </div>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-none space-y-1 my-3">{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-none space-y-1 my-3">{children}</ol>
                  ),
                  li: ({ children }) => (
                    <li className="text-[15px] text-ink-muted leading-relaxed pl-5 relative before:content-['—'] before:absolute before:left-0 before:text-amber-400">
                      {children}
                    </li>
                  ),
                  code: ({ children }) => (
                    <code className="bg-canvas text-ink px-1.5 py-0.5 rounded text-[13px] font-mono">
                      {children}
                    </code>
                  ),
                  pre: ({ children }) => (
                    <pre className="bg-canvas border border-border rounded-xl p-5 my-4 text-[13px] leading-relaxed font-mono text-ink-muted overflow-x-auto">
                      {children}
                    </pre>
                  ),
                }}
              >
                {content || " "}
              </ReactMarkdown>
            </div>
          </div>
        </div>

        {/* 编辑区 — 右侧 */}
        <div className="flex-1 bg-surface rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col relative">
          {/* 工具栏 */}
          <div className="flex items-center justify-between px-5 py-2.5 border-b border-border">
            <span className="text-xs text-ink-muted font-medium">编辑</span>
            <div className="flex items-center gap-1">
              {/* 大纲按钮 */}
              {outline.length > 1 && (
                <div className="relative">
                  <button
                    onClick={() => setOutlineOpen(!outlineOpen)}
                    className={`px-2.5 py-1.5 text-xs rounded-lg transition-colors font-medium ${
                      outlineOpen
                        ? "bg-canvas text-ink"
                        : "text-ink-muted hover:text-ink-muted hover:bg-canvas"
                    }`}
                    title="目录"
                  >
                    ☰ 目录
                  </button>
                  {outlineOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setOutlineOpen(false)}
                      />
                      <div className="absolute top-full right-0 mt-1 w-48 bg-surface border border-border rounded-xl shadow-lg z-50 max-h-64 overflow-y-auto py-1">
                        {outline.map((item, i) => (
                          <button
                            key={i}
                            onClick={() => handleOutlineClick(item.index)}
                            className="block w-full text-left text-xs text-ink-muted hover:bg-canvas px-3 py-2 transition-colors truncate"
                          >
                            {item.title}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
              {tools.map((tool) => (
                <button
                  key={tool.label}
                  onClick={() => handleTool(tool.prefix, tool.suffix)}
                  className="px-2.5 py-1.5 text-xs text-ink-muted hover:text-ink hover:bg-canvas rounded-lg transition-colors font-medium"
                  title={tool.label}
                >
                  {tool.icon}
                </button>
              ))}
            </div>
          </div>

          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={
              "开始书写角色的故事…\n\n" +
              "## 章节\n" +
              "**粗体** *斜体*\n" +
              "> 引用\n\n" +
              "---\n\n" +
              "- 列表"
            }
            className="flex-1 w-full min-h-[60vh] resize-none text-[15px] text-ink leading-relaxed focus:outline-none p-6 font-serif placeholder:text-ink-muted/40"
            style={{
              fontFamily: "'Crimson Text', 'Georgia', 'Noto Serif SC', serif",
            }}
            spellCheck={false}
          />
        </div>
      </div>

      {axsError && (
        <p className="mb-4 text-sm text-red-600">{axsError}</p>
      )}

      {axsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-surface shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <h2 className="text-sm font-semibold text-ink">AXS 剧本草稿</h2>
              <button
                type="button"
                onClick={() => setAxsOpen(false)}
                className="text-ink-muted hover:text-ink-muted"
              >
                ✕
              </button>
            </div>
            <pre className="max-h-[50vh] overflow-auto p-5 text-xs leading-relaxed text-ink font-mono whitespace-pre-wrap">
              {axsDraft}
            </pre>
            <div className="flex justify-end gap-2 border-t border-border px-5 py-3">
              <Button size="sm" variant="secondary" onClick={copyAxs}>
                复制到剪贴板
              </Button>
              <Button size="sm" onClick={() => setAxsOpen(false)}>
                关闭
              </Button>
            </div>
          </div>
        </div>
      )}
      </div>
    </Shell>
  );
}
