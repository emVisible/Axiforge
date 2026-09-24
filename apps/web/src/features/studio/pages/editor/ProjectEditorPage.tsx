import { useParams } from "react-router";
import { CanvasWorkspace } from "@/shared/components/Shell";
import Toast from "@/shared/components/Toast";
import { BackLink, Button, SegmentedControl, WorkspaceHeader, WorkspaceToolbar } from "@/shared/components/ui";
import ScriptPreview from "../../components/ScriptPreview";
import AchievementPanel from "../../components/AchievementPanel";
import CutLayoutToolbar from "../../cut/CutLayoutToolbar";
import { routes } from "@/shared/lib/routes";
import { Download, Play, Star } from "lucide-react";
import { useProjectEditor, type EditorMode } from "../../hooks/useProjectEditor";
import CutWorkspace from "./CutWorkspace";
import WriterWorkspace from "./WriterWorkspace";
import FlowWorkspace from "./FlowWorkspace";

function prefetchStudioModes() {
  void import("./FlowWorkspace");
  void import("./WriterWorkspace");
}

/** Studio 编辑器宿主：路由参数 + 模式头 + 三工作台切换（原 ProjectFlowPage 薄壳） */
export default function ProjectEditorPage() {
  const { id } = useParams<{ id: string }>();
  const editor = useProjectEditor(id!);
  const {
    project,
    projectLoading,
    toast,
    setToast,
    showPreview,
    setShowPreview,
    script,
    projectRoles,
    editorMode,
    setEditorMode,
    showAchievements,
    setShowAchievements,
    viewMode,
    switchViewMode,
    currentScene,
    switchScene,
    rfNodes,
    cutLayoutApiRef,
    autoLayoutByStage,
    selectedNode,
    openWriterAtSelection,
    undo,
    saving,
    saveAll,
    exportProjectAxsp,
  } = editor;

  return (
<CanvasWorkspace immersive className={editorMode === "cut" ? "bg-canvas" : ""}>
      {projectLoading && !project && (
        <p className="py-20 text-center text-sm text-ink-muted">加载中...</p>
      )}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      {showPreview && (
        <ScriptPreview
          script={script}
          roles={projectRoles}
          onClose={() => setShowPreview(false)}
        />
      )}
      <WorkspaceHeader
        variant="dense"
        leading={
          <BackLink to={routes.projects}>剧本列表</BackLink>
        }
        title={
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span className="max-w-[200px] truncate text-sm font-medium text-ink">
              {project?.title || "加载中..."}
            </span>
            {editorMode !== "cut" && viewMode === "stage" && project?.scenes && project.scenes.length > 0 && (
              <>
                <select
                  value={currentScene?.id ?? project.scenes[0]?.id ?? ""}
                  onChange={(e) => {
                    const scene = project.scenes?.find((s) => s.id === e.target.value);
                    if (scene) switchScene(scene);
                  }}
                  className="max-w-[140px] truncate rounded-md border border-border bg-surface px-2 py-1 text-xs text-ink"
                >
                  {project.scenes.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title}
                    </option>
                  ))}
                </select>
                <span className="text-3xs text-ink-muted/60">{rfNodes.length} 节点</span>
              </>
            )}
            {editorMode !== "cut" && viewMode === "full" && (
              <span className="text-3xs text-ink-muted/60">
                全剧本 · {rfNodes.length} 节点
              </span>
            )}
            {editorMode !== "cut" && (
            <SegmentedControl
              size="sm"
              value={viewMode}
              onChange={switchViewMode}
              options={[
                { value: "full", label: "全剧本" },
                { value: "stage", label: "单舞台" },
              ]}
            />
            )}
            <div onMouseEnter={prefetchStudioModes}>
            <SegmentedControl
              size="sm"
              value={editorMode}
              onChange={(mode) => {
                if (mode === "writer") openWriterAtSelection();
                else setEditorMode(mode as EditorMode);
              }}
              options={[
                { value: "cut", label: "剪辑" },
                { value: "writer", label: "剧本" },
                { value: "flow", label: "结构" },
              ]}
            />
            </div>
          </div>
        }
        actions={
          <WorkspaceToolbar>
            {editorMode === "cut" && (
              <CutLayoutToolbar layoutApiRef={cutLayoutApiRef} />
            )}
            {editorMode === "flow" && viewMode === "full" && (
              <Button variant="ghost" size="toolbar" onClick={autoLayoutByStage}>
                整理布局
              </Button>
            )}
            {editorMode === "flow" && selectedNode && (
              <Button variant="ghost" size="toolbar" onClick={openWriterAtSelection}>
                剧本定位
              </Button>
            )}
            {editorMode === "flow" && (
              <Button variant="ghost" size="toolbar" onClick={undo}>
                ↩ 撤销
              </Button>
            )}
            {id && (
              <Button
                variant="ghost"
                size="toolbar"
                icon={<Star className="h-3.5 w-3.5" />}
                onClick={() => setShowAchievements(true)}
              >
                成就
              </Button>
            )}
            {id && (
              <Button
                as="link"
                to={routes.play(id)}
                variant="secondary"
                size="toolbar"
                icon={<Play className="h-3.5 w-3.5" />}
              >
                试玩
              </Button>
            )}
            <Button
              variant="ghost"
              size="toolbar"
              icon={<Download className="h-3.5 w-3.5" />}
              onClick={exportProjectAxsp}
            >
              导出
            </Button>
            {(editorMode === "flow" || editorMode === "cut") && (
              <Button size="sm" onClick={saveAll} loading={saving} disabled={saving}>
                {saving ? "保存中..." : "保存"}
              </Button>
            )}
          </WorkspaceToolbar>
        }
      />

      
{editorMode === "writer" ? (
          <WriterWorkspace editor={editor} />
        ) : editorMode === "cut" ? (
          <CutWorkspace editor={editor} />
        ) : (
          <FlowWorkspace editor={editor} />
        )
      }
{showAchievements && id && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowAchievements(false)}
        >
          <div
            className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-panel shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h2 className="text-sm font-semibold text-ink">项目成就</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowAchievements(false)}>
                关闭
              </Button>
            </div>
            <AchievementPanel projectId={id} />
          </div>
        </div>
      )}
    </CanvasWorkspace>
  );
}
