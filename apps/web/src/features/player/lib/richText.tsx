import { Fragment, type ReactNode } from "react";

/**
 * 富文本 / ruby 注音 / 术语标注（v1.3–v1.4）
 *
 * 语法：
 *   [ruby:汉字|かんじ]   → <ruby>汉字<rt>かんじ</rt></ruby>
 *   **加粗**             → <strong>
 *   [[术语]]             → 可点击术语（需传入 onTermClick）
 *   换行 \n              → <br/>
 */
const TOKEN =
  /\[ruby:([^|\]]+)\|([^\]]+)\]|\*\*([^*]+)\*\*|\[\[([^\]]+)\]\]/g;

export function renderRich(
  text: string,
  rich: boolean,
  opts?: { onTermClick?: (term: string) => void },
): ReactNode {
  if (!rich) return renderPlain(text, 0, opts);

  const nodes: ReactNode[] = [];
  let last = 0;
  let key = 0;
  let m: RegExpExecArray | null;
  TOKEN.lastIndex = 0;
  while ((m = TOKEN.exec(text)) !== null) {
    if (m.index > last)
      nodes.push(renderPlain(text.slice(last, m.index), key++, opts));
    if (m[1] !== undefined) {
      nodes.push(
        <ruby key={key++}>
          {m[1]}
          <rt>{m[2]}</rt>
        </ruby>,
      );
    } else if (m[3] !== undefined) {
      nodes.push(<strong key={key++}>{m[3]}</strong>);
    } else if (m[4] !== undefined) {
      const term = m[4];
      if (opts?.onTermClick) {
        nodes.push(
          <button
            key={key++}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              opts.onTermClick!(term);
            }}
            className="mx-0.5 border-b border-dotted border-amber-400/50 text-amber-300/90 hover:text-amber-200"
          >
            {term}
          </button>,
        );
      } else {
        nodes.push(
          <span key={key++} className="text-amber-300/80">
            {term}
          </span>,
        );
      }
    }
    last = TOKEN.lastIndex;
  }
  if (last < text.length) nodes.push(renderPlain(text.slice(last), key++, opts));
  return <>{nodes}</>;
}

function renderPlain(
  text: string,
  key = 0,
  opts?: { onTermClick?: (term: string) => void },
): ReactNode {
  // 非 rich 模式也支持 [[术语]] 点击
  if (opts?.onTermClick && text.includes("[[")) {
    const parts = text.split(/(\[\[[^\]]+\]\])/g);
    return (
      <Fragment key={key}>
        {parts.map((part, i) => {
          const match = part.match(/^\[\[([^\]]+)\]\]$/);
          if (match) {
            return (
              <button
                key={i}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  opts.onTermClick!(match[1]);
                }}
                className="mx-0.5 border-b border-dotted border-amber-400/50 text-amber-300/90"
              >
                {match[1]}
              </button>
            );
          }
          return <Fragment key={i}>{renderPlainLines(part, i)}</Fragment>;
        })}
      </Fragment>
    );
  }
  return renderPlainLines(text, key);
}

function renderPlainLines(text: string, key: number): ReactNode {
  const parts = text.split("\n");
  if (parts.length === 1) return <Fragment key={key}>{text}</Fragment>;
  return (
    <Fragment key={key}>
      {parts.map((p, i) => (
        <Fragment key={i}>
          {i > 0 && <br />}
          {p}
        </Fragment>
      ))}
    </Fragment>
  );
}

/** 去掉富文本标记，得到纯文本（打字机/回顾用） */
export function stripRich(text: string): string {
  return text
    .replace(/\[ruby:([^|\]]+)\|[^\]]+\]/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\[\[([^\]]+)\]\]/g, "$1");
}
