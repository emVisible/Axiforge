import type { NexusNote } from "@/services/api";

/** 导出笔记为 Markdown（含标签与关联链接） */
export function exportNotesMarkdown(notes: NexusNote[], title = "Nexus 笔记导出"): string {
  const lines: string[] = [
    `# ${title}`,
    "",
    `> 导出时间：${new Date().toLocaleString()}`,
    `> 共 ${notes.length} 条`,
    "",
  ];

  const byTag = new Map<string, NexusNote[]>();
  const untagged: NexusNote[] = [];

  for (const note of notes) {
    const tags = note.tags?.length ? note.tags : [];
    if (!tags.length) {
      untagged.push(note);
      continue;
    }
    for (const t of tags) {
      if (!byTag.has(t)) byTag.set(t, []);
      byTag.get(t)!.push(note);
    }
  }

  const seen = new Set<string>();
  const emitNote = (note: NexusNote) => {
    if (seen.has(note.id)) return;
    seen.add(note.id);
    lines.push(`## ${note.title || "无标题"}`, "");
    if (note.tags?.length) {
      lines.push(`标签：${note.tags.map((t) => `#${t}`).join(" ")}`, "");
    }
    if (note.related_projects?.length) {
      lines.push(`关联作品：${note.related_projects.map((id) => `[[project:${id}]]`).join(" ")}`, "");
    }
    if (note.related_characters?.length) {
      lines.push(`关联角色：${note.related_characters.map((id) => `[[character:${id}]]`).join(" ")}`, "");
    }
    lines.push(note.body.trim() || "（空）", "");
    lines.push(`---`, "");
  };

  for (const [tag, tagged] of [...byTag.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    lines.push(`# 主题 #${tag}`, "");
    for (const note of tagged) emitNote(note);
  }

  if (untagged.length) {
    lines.push(`# 未分类`, "");
    for (const note of untagged) emitNote(note);
  }

  return lines.join("\n");
}

export function downloadMarkdown(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
