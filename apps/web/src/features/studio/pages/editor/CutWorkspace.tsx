import CutStudioView from "../../cut/CutStudioView";
import type { ProjectEditor } from "../../hooks/useProjectEditor";

export default function CutWorkspace({ editor }: { editor: ProjectEditor }) {
  const {
    project,
    rfNodes,
    selectedNode,
    selectFlowNode,
    cutSceneFilter,
    setCutSceneFilter,
    script,
    projectRoles,
    itemOptions,
    activePanel,
    setActivePanel,
    nodeForm,
    conditions,
    effects,
    nodeProps,
    updateSelectedNode,
    updateConditions,
    updateEffects,
    updateNodeProps,
    updateScript,
    assignNodeStage,
    simTargets,
    setShowPreview,
    deleteSelectedNode,
    outliner,
    showToast,
    cutLayoutApiRef,
    openWriterAtSelection,
    handleExportMarkdown,
    handleDeleteProject,
    renameBeat,
    patchProjectMeta,
    refreshProject,
    handleEdgeLabelChange,
    handleDeleteEdge,
    outlinerItemRefs,
    setFilteredStageId,
    setFocusStageId,
    setStageFocusTrigger,
    setEditorMode,
  } = editor;

  return (
project && (
<div className="flex min-h-0 flex-1 flex-col overflow-hidden">
<CutStudioView
  layoutApiRef={cutLayoutApiRef}
  project={project}
  nodes={rfNodes}
  selectedNode={selectedNode}
  onSelectBeat={selectFlowNode}
  sceneFilterId={cutSceneFilter}
  onSceneFilterChange={setCutSceneFilter}
  script={script}
  projectRoles={projectRoles}
  projectRolesRaw={project?.roles || []}
  itemRefs={outlinerItemRefs}
  activePanel={activePanel}
  onActivePanelChange={setActivePanel}
  nodeForm={nodeForm}
  onNodeFormChange={updateSelectedNode}
  conditions={conditions}
  onConditionsChange={updateConditions}
  effects={effects}
  onEffectsChange={updateEffects}
  nodeProps={nodeProps}
  onPropsChange={updateNodeProps}
  itemOptions={itemOptions}
  onScriptChange={updateScript}
  scenes={project?.scenes || []}
  onStageChange={assignNodeStage}
  allNodes={rfNodes}
  simTargets={simTargets}
  onPreviewScript={() => setShowPreview(true)}
  onDeleteNode={deleteSelectedNode}
  onAddScene={async (title) => {
    try {
      await outliner.addScene(title);
      await refreshProject();
      showToast("已添加舞台");
    } catch {
      showToast("添加失败", "error");
    }
  }}
  onImportScene={async (assetId) => {
    try {
      await outliner.importSceneAsset(assetId);
      await refreshProject();
      showToast("已导入舞台");
    } catch {
      showToast("导入失败", "error");
    }
  }}
  onDeleteScene={async (sceneIdToDelete) => {
    try {
      await outliner.deleteScene(sceneIdToDelete);
      if (cutSceneFilter === sceneIdToDelete) setCutSceneFilter(null);
      await refreshProject();
      showToast("已删除舞台");
    } catch {
      showToast("删除失败", "error");
    }
  }}
  onAddRole={async (characterId, name) => {
    try {
      await outliner.addRole(characterId, name);
      await refreshProject();
      showToast(`已添加角色「${name}」`);
    } catch {
      showToast("添加失败", "error");
    }
  }}
  onRemoveRole={async (roleId) => {
    try {
      await outliner.removeRole(roleId);
      await refreshProject();
      showToast("已移除角色");
    } catch {
      showToast("移除失败", "error");
    }
  }}
  onAddItem={async (itemId) => {
    try {
      await outliner.addItemRef(itemId);
      await refreshProject();
      showToast("已添加道具引用");
    } catch {
      showToast("添加失败", "error");
    }
  }}
  onRemoveItemRef={async (refId) => {
    try {
      await outliner.removeItemRef(refId);
      await refreshProject();
      showToast("已移除道具");
    } catch {
      showToast("移除失败", "error");
    }
  }}
  onOpenFlow={() => {
    if (cutSceneFilter) {
      setFilteredStageId(cutSceneFilter);
      setFocusStageId(cutSceneFilter);
      setStageFocusTrigger((t) => t + 1);
    }
    setEditorMode("flow");
  }}
  onOpenWriter={openWriterAtSelection}
  onExportMarkdown={handleExportMarkdown}
  onDeleteProject={handleDeleteProject}
  onBeatRename={renameBeat}
  onProjectPatch={patchProjectMeta}
  selectedEdge={null}
  onEdgeLabelChange={handleEdgeLabelChange}
  onDeleteEdge={handleDeleteEdge}
/>
</div>
)
  );
}
