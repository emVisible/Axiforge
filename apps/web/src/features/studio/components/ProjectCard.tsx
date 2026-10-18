import { Badge, EntityCard } from "@/shared/components/ui";
import type { ProjectResponse } from "@/shared/types/project";

/**
 * 剧本列表的卡片：纯展示，字段口径与传输态 `ProjectResponse` 一致。
 *
 * 从 `ProjectListPage` 外提是行数棘轮（G1）的处方——该页越过基线时不在文件内继续堆，
 * 按域把展示件提成协作模块。这里没有任何行为改变，只是把「怎么显示一个工程」
 * 从「工程列表页的状态机」里分出去。
 */
export default function ProjectCard({
  project,
  onDelete,
}: {
  project: ProjectResponse;
  onDelete: () => void;
}) {
  return (
    <EntityCard
      to={`/studio/projects/${project.id}`}
      title={project.title}
      description={project.description || "暂无描述"}
      onDelete={onDelete}
      badges={
        <>
          {project.is_meta && (
            <Badge variant="amber" size="sm">
              元剧本
            </Badge>
          )}
          <Badge variant={project.is_public ? "emerald" : "default"} size="sm">
            {project.is_public ? "公开" : "私有"}
          </Badge>
          {project.mechanism && (
            <Badge variant="default" size="sm">
              {project.mechanism}
            </Badge>
          )}
          {project.genre && (
            <Badge variant="default" size="sm">
              {project.genre}
            </Badge>
          )}
          {project.theme_tags.slice(0, 3).map((t) => (
            <Badge key={t} variant="brand" size="sm">
              {t}
            </Badge>
          ))}
        </>
      }
      meta={
        [
          project.scenes?.length ? `${project.scenes.length} 章节` : "",
          project.roles?.length ? `${project.roles.length} 角色` : "",
        ]
          .filter(Boolean)
          .join(" · ") || undefined
      }
    />
  );
}
