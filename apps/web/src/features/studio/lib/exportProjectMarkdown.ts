import type { ProjectResponse } from "@/shared/types/project";

export function exportProjectMarkdown(project: ProjectResponse, roleNames: Record<string, string>) {
  const lines: string[] = [`# ${project.title}`, ""];
  if (project.description) lines.push(project.description, "");
  if (project.world_setting) lines.push("## 世界观", "", project.world_setting, "");
  if (project.rules) lines.push("## 规则", "", project.rules, "");

  const scenes = project.scenes || [];
  if (scenes.length > 0) {
    lines.push("## 舞台", "");
    for (const s of scenes) {
      lines.push(`### ${s.title}`);
      if (s.location) lines.push(`- 地点：${s.location}`);
      if (s.atmosphere) lines.push(`- 氛围：${s.atmosphere}`);
      lines.push("");
    }
  }

  const roles = project.roles || [];
  if (roles.length > 0) {
    lines.push("## 角色", "");
    for (const r of roles) {
      const name = roleNames[r.character_ref_id] || r.character_ref_id.slice(0, 8);
      lines.push(`- 重要度 ${r.importance} · **${name}**`);
    }
    lines.push("");
  }

  const md = lines.join("\n");
  const blob = new Blob([md], { type: "text/markdown" });
  const a = document.createElement("a");
  a.download = `${project.title || "project"}.md`;
  a.href = URL.createObjectURL(blob);
  a.click();
}
