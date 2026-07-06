import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useParams, Link } from "react-router";
import { useStory, useUpdateStory } from "@/hooks/useStories";
import { useCharacter } from "@/hooks/useCharacters";
import { LoadingSpinner, ErrorDisplay, Button } from "@/components/ui";
import ReactMarkdown from "react-markdown";
import { routes } from "@/lib/routes";

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

  if (isLoading) return <LoadingSpinner />;
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
    <div className="max-w-7xl mx-auto animate-fadeIn">
      {/* 顶栏 */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-md -mx-4 px-4 py-3 mb-8 border-b border-gray-100">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4 min-w-0">
            <Link
              to={routes.characters.story(characterId!, story.id)}
              className="text-sm text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
            >
              ← 返回
            </Link>
            <span className="text-gray-200">|</span>
            <span className="text-sm text-gray-500 truncate">
              {character?.name}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400">{wordCount} 字</span>
            {saved && (
              <span className="text-xs text-emerald-500">✓ 已保存</span>
            )}
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
          <span className="text-xs font-medium text-gray-300 uppercase tracking-widest flex-shrink-0">
            篇章
          </span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="输入标题…"
            className="flex-1 text-2xl font-bold text-gray-900 border-none focus:outline-none bg-transparent placeholder:text-gray-300 p-0"
          />
        </div>
        <div className="mt-2 ml-[52px] text-xs text-gray-400">
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
        <div className="flex-1 bg-[#fafaf8] rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-2.5 border-b border-gray-100">
            <span className="text-xs text-gray-400 font-medium">预览</span>
          </div>
          <div className="p-6 min-h-[65vh] overflow-y-auto">
            <div className="prose prose-stone max-w-none">
              <ReactMarkdown
                components={{
                  h1: ({ children }) => (
                    <h1 className="text-2xl font-bold text-gray-900 mt-8 mb-3 pb-2 border-b border-gray-100">
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-2">
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-lg font-medium text-gray-700 mt-5 mb-1.5">
                      {children}
                    </h3>
                  ),
                  p: ({ children }) => (
                    <p className="text-[15px] text-gray-600 leading-relaxed mb-3">
                      {children}
                    </p>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-semibold text-gray-800">
                      {children}
                    </strong>
                  ),
                  em: ({ children }) => (
                    <em className="italic text-gray-500">{children}</em>
                  ),
                  del: ({ children }) => (
                    <del className="line-through text-gray-400">{children}</del>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-[3px] border-amber-300 pl-5 py-1 my-4 italic text-gray-500 bg-amber-50/40 rounded-r-lg">
                      {children}
                    </blockquote>
                  ),
                  hr: () => (
                    <div className="my-8 text-center text-amber-300 text-lg">
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
                    <li className="text-[15px] text-gray-600 leading-relaxed pl-5 relative before:content-['—'] before:absolute before:left-0 before:text-amber-400">
                      {children}
                    </li>
                  ),
                  code: ({ children }) => (
                    <code className="bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded text-[13px] font-mono">
                      {children}
                    </code>
                  ),
                  pre: ({ children }) => (
                    <pre className="bg-gray-50 border border-gray-100 rounded-xl p-5 my-4 text-[13px] leading-relaxed font-mono text-gray-600 overflow-x-auto">
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
        <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col relative">
          {/* 工具栏 */}
          <div className="flex items-center justify-between px-5 py-2.5 border-b border-gray-100">
            <span className="text-xs text-gray-400 font-medium">编辑</span>
            <div className="flex items-center gap-1">
              {/* 大纲按钮 */}
              {outline.length > 1 && (
                <div className="relative">
                  <button
                    onClick={() => setOutlineOpen(!outlineOpen)}
                    className={`px-2.5 py-1.5 text-xs rounded-lg transition-colors font-medium ${
                      outlineOpen
                        ? "bg-gray-100 text-gray-700"
                        : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
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
                      <div className="absolute top-full right-0 mt-1 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-64 overflow-y-auto py-1">
                        {outline.map((item, i) => (
                          <button
                            key={i}
                            onClick={() => handleOutlineClick(item.index)}
                            className="block w-full text-left text-xs text-gray-600 hover:bg-gray-50 px-3 py-2 transition-colors truncate"
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
                  className="px-2.5 py-1.5 text-xs text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors font-medium"
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
            className="flex-1 w-full min-h-[60vh] resize-none text-[15px] text-gray-700 leading-relaxed focus:outline-none p-6 font-serif placeholder:text-gray-300"
            style={{
              fontFamily: "'Crimson Text', 'Georgia', 'Noto Serif SC', serif",
            }}
            spellCheck={false}
          />
        </div>
      </div>
    </div>
  );
}
