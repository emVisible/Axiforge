import { useParams, Link } from "react-router";
import { useStory } from "@/shared/hooks/useStories";
import { useCharacter } from "@/shared/hooks/useCharacters";
import { BackLink, ErrorDisplay, LoadingSpinner } from "@/shared/components/ui";
import Shell from "@/shared/components/Shell";
import ReactMarkdown from "react-markdown";
import { routes } from "@/shared/lib/routes";

export default function StoryReadPage() {
  const { id: characterId, storyId } = useParams<{
    id: string;
    storyId: string;
  }>();
  const { data: story, isLoading, error } = useStory(characterId!, storyId!);
  const { data: character } = useCharacter(characterId!);

  if (isLoading) {
    return (
      <Shell narrow>
        <LoadingSpinner />
      </Shell>
    );
  }
  if (error) return <ErrorDisplay message="加载失败" />;
  if (!story) return <ErrorDisplay message="篇章不存在" />;

  return (
    <Shell narrow>
      <BackLink to={routes.characters.detail(characterId!)}>
        {character?.name || "返回角色详情"}
      </BackLink>

      {/* 文章卡片 */}
      <article className="bg-surface rounded-2xl border border-border shadow-sm">
        {/* 标题区 */}
        <div className="px-10 pt-10 pb-6 border-b border-border">
          <p className="text-xs font-medium text-ink-muted/40 uppercase tracking-widest mb-3">
            篇章
          </p>
          <h1 className="text-2xl font-bold text-ink leading-tight mb-3">
            {story.title}
          </h1>
          <div className="flex items-center gap-3 text-sm text-ink-muted">
            <span>{story.word_count} 字</span>
            <span className="text-border">·</span>
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
                  <h1 className="text-2xl font-bold text-ink mt-10 mb-4 pb-2 border-b border-border">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-xl font-semibold text-ink mt-8 mb-3">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-lg font-medium text-ink mt-6 mb-2">
                    {children}
                  </h3>
                ),
                p: ({ children }) => (
                  <p className="text-[16px] text-ink-muted leading-relaxed mb-5 text-justify">
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
                  <blockquote className="border-l-[3px] border-amber-300 pl-6 py-2 my-6 italic text-ink-muted bg-amber-50/40 rounded-r-lg">
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
                  <li className="text-[16px] text-ink-muted leading-relaxed pl-6 relative before:content-['—'] before:absolute before:left-0 before:text-amber-400">
                    {children}
                  </li>
                ),
                code: ({ children }) => (
                  <code className="bg-canvas text-ink px-1.5 py-0.5 rounded text-[13px] font-mono">
                    {children}
                  </code>
                ),
                pre: ({ children }) => (
                  <pre className="bg-canvas border border-border rounded-xl p-5 my-5 text-[13px] leading-relaxed font-mono text-ink-muted overflow-x-auto">
                    {children}
                  </pre>
                ),
                a: ({ href, children }) => (
                  <a
                    href={href}
                    className="text-brand underline underline-offset-2 transition-colors hover:opacity-80"
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
          className="text-sm text-ink-muted hover:text-ink-muted transition-colors"
        >
          ← 返回角色详情
        </Link>
        <Link
          to={routes.characters.storyEdit(characterId!, story.id)}
          className="text-sm text-brand transition-colors hover:opacity-80"
        >
          编辑此篇章
        </Link>
      </div>
    </Shell>
  );
}
