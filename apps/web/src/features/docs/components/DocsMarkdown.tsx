import { type ReactNode, isValidElement } from "react";
import { Link } from "react-router";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { routes } from "@/shared/lib/routes";

function slugifyHeading(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\u4e00-\u9fff-]/g, "");
}

function headingText(children: ReactNode): string {
  if (typeof children === "string") return children;
  if (Array.isArray(children)) return children.map(headingText).join("");
  if (isValidElement<{ children?: ReactNode }>(children)) {
    return headingText(children.props.children);
  }
  return "";
}

interface DocsMarkdownProps {
  source: string;
}

export default function DocsMarkdown({ source }: DocsMarkdownProps) {
  return (
    <article className="docs-prose max-w-none text-ink">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => {
            const id = slugifyHeading(headingText(children));
            return (
              <h1 id={id} className="mb-6 text-2xl font-bold tracking-tight text-ink">
                {children}
              </h1>
            );
          },
          h2: ({ children }) => {
            const id = slugifyHeading(headingText(children));
            return (
              <h2
                id={id}
                className="mb-3 mt-10 border-b border-border pb-2 text-lg font-semibold text-ink"
              >
                {children}
              </h2>
            );
          },
          h3: ({ children }) => {
            const id = slugifyHeading(headingText(children));
            return (
              <h3 id={id} className="mb-2 mt-6 text-base font-semibold text-ink">
                {children}
              </h3>
            );
          },
          p: ({ children }) => (
            <p className="mb-4 leading-relaxed text-ink-muted">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="mb-4 list-disc space-y-1 pl-6 text-ink-muted">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-4 list-decimal space-y-1 pl-6 text-ink-muted">{children}</ol>
          ),
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          a: ({ href, children }) => {
            if (href?.startsWith("http")) {
              return (
                <a
                  href={href}
                  className="text-brand underline-offset-2 hover:underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  {children}
                </a>
              );
            }
            if (href && !href.startsWith("#")) {
              const slug = href.replace(/^\//, "").replace(/^docs\//, "");
              return (
                <Link
                  to={routes.doc(slug)}
                  className="text-brand underline-offset-2 hover:underline"
                >
                  {children}
                </Link>
              );
            }
            return (
              <a href={href} className="text-brand underline-offset-2 hover:underline">
                {children}
              </a>
            );
          },
          tbody: ({ children }) => <tbody>{children}</tbody>,
          tr: ({ children }) => (
            <tr className="even:bg-canvas/40">{children}</tr>
          ),
          table: ({ children }) => (
            <div className="mb-4 overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-left text-sm">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="border-b border-border bg-canvas text-ink">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="px-3 py-2 font-medium text-ink-muted">{children}</th>
          ),
          td: ({ children }) => (
            <td className="border-t border-border px-3 py-2 text-ink-muted">{children}</td>
          ),
          code: ({ className, children, ...props }) => {
            const isBlock = className?.includes("language-");
            if (isBlock) {
              return (
                <code
                  className={`font-mono text-xs leading-relaxed text-ink ${className ?? ""}`}
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <code className="rounded bg-canvas px-1.5 py-0.5 font-mono text-xs text-ink">
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre className="mb-4 overflow-x-auto rounded-lg border border-border bg-canvas p-4">
              {children}
            </pre>
          ),
          blockquote: ({ children }) => (
            <blockquote className="mb-4 border-l-4 border-brand/40 pl-4 text-ink-muted">
              {children}
            </blockquote>
          ),
        }}
      >
        {source}
      </ReactMarkdown>
    </article>
  );
}
