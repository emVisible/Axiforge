import { useParams, Link } from "react-router";
import { useStory } from "@/hooks/useStories";
import { useCharacter } from "@/hooks/useCharacters";
import { LoadingSpinner, ErrorDisplay } from "@/components/ui";
import ReactMarkdown from "react-markdown";
import { routes } from "@/lib/routes";

export default function StoryReadPage() {
  const { id: characterId, storyId } = useParams<{
    id: string;
    storyId: string;
  }>();
  const { data: story, isLoading, error } = useStory(characterId!, storyId!);
  const { data: character } = useCharacter(characterId!);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorDisplay message="加载失败" />;
  if (!story) return <ErrorDisplay message="篇章不存在" />;

  return (
    <div className="mx-auto max-w-3xl animate-fade-in px-4 py-8 sm:px-6">
      {/* 返回导航 */}
      <nav className="mb-10">
        <Link
          to={routes.characters.detail(characterId!)}
          className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          {character?.name || "返回"}
        </Link>
      </nav>

      {/* 文章卡片 */}
      <article className="bg-white rounded-2xl border border-gray-200 shadow-sm">
        {/* 标题区 */}
        <div className="px-10 pt-10 pb-6 border-b border-gray-100">
          <p className="text-xs font-medium text-gray-300 uppercase tracking-widest mb-3">
            篇章
          </p>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight mb-3">
            {story.title}
          </h1>
          <div className="flex items-center gap-3 text-sm text-gray-400">
            <span>{story.word_count} 字</span>
            <span className="text-gray-200">·</span>
            <span>
              {new Date(story.updated_at).toLocaleDateString("zh-CN", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
        </div>

        {/* 正文 */}
        <div className="px-10 py-8">
          <div className="prose prose-stone max-w-none">
            <ReactMarkdown
              components={{
                h1: ({ children }) => (
                  <h1 className="text-2xl font-bold text-gray-900 mt-10 mb-4 pb-2 border-b border-gray-100">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-xl font-semibold text-gray-800 mt-8 mb-3">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-lg font-medium text-gray-700 mt-6 mb-2">
                    {children}
                  </h3>
                ),
                p: ({ children }) => (
                  <p className="text-[16px] text-gray-600 leading-relaxed mb-5 text-justify">
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
                  <blockquote className="border-l-[3px] border-amber-300 pl-6 py-2 my-6 italic text-gray-500 bg-amber-50/40 rounded-r-lg">
                    {children}
                  </blockquote>
                ),
                hr: () => (
                  <div className="my-10 text-center text-amber-300 text-lg">
                    ❧
                  </div>
                ),
                ul: ({ children }) => (
                  <ul className="list-none space-y-2 my-5">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-none space-y-2 my-5">{children}</ol>
                ),
                li: ({ children }) => (
                  <li className="text-[16px] text-gray-600 leading-relaxed pl-6 relative before:content-['—'] before:absolute before:left-0 before:text-amber-400">
                    {children}
                  </li>
                ),
                code: ({ children }) => (
                  <code className="bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded text-[13px] font-mono">
                    {children}
                  </code>
                ),
                pre: ({ children }) => (
                  <pre className="bg-gray-50 border border-gray-100 rounded-xl p-5 my-5 text-[13px] leading-relaxed font-mono text-gray-600 overflow-x-auto">
                    {children}
                  </pre>
                ),
                a: ({ href, children }) => (
                  <a
                    href={href}
                    className="text-blue-500 hover:text-blue-600 underline underline-offset-2 transition-colors"
                  >
                    {children}
                  </a>
                ),
              }}
            >
              {story.content || "*暂无内容*"}
            </ReactMarkdown>
          </div>
        </div>
      </article>

      {/* 底部操作 */}
      <div className="mt-8 flex items-center justify-between">
        <Link
          to={routes.characters.detail(characterId!)}
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          ← 返回角色详情
        </Link>
        <Link
          to={routes.characters.storyEdit(characterId!, story.id)}
          className="text-sm text-blue-500 hover:text-blue-600 transition-colors"
        >
          编辑此篇章
        </Link>
      </div>
    </div>
  );
}
