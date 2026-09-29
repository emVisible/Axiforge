import { useState } from "react";
import { Inbox } from "lucide-react";
import { nexusApi } from "@/shared/api/nexus";
import { getCreatorId } from "@/shared/lib/creatorId";
import { isLocalOnlyDeployment } from "@/shared/lib/deployment";
import type { ProjectResponse } from "@/shared/types/project";

/**
 * 编排台「项目」栏里的「发送到 Nexus」。
 *
 * 这一条是**服务端本质**的：收件箱在库里跨工程存在，本地没有对应语义
 * （代码去留等 S13-7 判，不在本轮）。桌面无后端，按钮必然失败，
 * 而它的失败文案是「发送失败，请确认后端已启动」——产品已经不再发布后端了，
 * 那是把人往一个不存在的修复方向上指。所以桌面**不给入口**，
 * 与 E18（云端专属工具条在桌面隐藏）同一条口径；判据是 e2e 的 E20。
 */
export default function NexusSendAction({ project }: { project: ProjectResponse }) {
  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState<string | null>(null);

  if (isLocalOnlyDeployment()) return null;

  const send = async () => {
    setBusy(true);
    setHint(null);
    try {
      const excerpt = (project.description || project.world_setting || "").slice(0, 500);
      await nexusApi.sendToInbox({
        author_id: getCreatorId(),
        title: project.title,
        body: `# ${project.title}\n\n[[project:${project.id}]]\n\n${excerpt}`,
        related_projects: [project.id],
      });
      setHint("已发送到 Nexus 收件箱");
    } catch {
      setHint("发送失败，请确认后端已启动");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        disabled={busy}
        onClick={() => void send()}
        className="rounded py-1 text-left text-3xs text-ink-muted hover:bg-surface-raised hover:text-ink disabled:opacity-50"
      >
        <Inbox className="mr-1 inline h-3 w-3" />
        {busy ? "发送中…" : "发送到 Nexus"}
      </button>
      {hint && <p className="px-1 text-3xs text-brand">{hint}</p>}
    </>
  );
}
