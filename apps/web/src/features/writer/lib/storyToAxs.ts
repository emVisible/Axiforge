/** 传记 Markdown → 适合 prose-to-axs 的纯文本 */
export function biographyToProse(content: string): string {
  return content
    .replace(/^## (.+)$/gm, "【旁白 $1】")
    .replace(/^# (.+)$/gm, "【旁白 $1】")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/^> /gm, "")
    .replace(/^---$/gm, "")
    .trim();
}
