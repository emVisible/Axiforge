import { Suspense, lazy } from "react";
import StudioModeFallback from "../../components/StudioModeFallback";
import type { ProjectEditor } from "../../hooks/useProjectEditor";

const LazyFlowStudioView = lazy(() => import("../../flow/FlowStudioView"));

export default function FlowWorkspace({ editor }: { editor: ProjectEditor }) {
  const {
    wrapperRef,
    viewMode,
    project,
    rfNodes,
    rfEdges,
    hoveredEdge,
    setHoveredEdge,
    selectedNode,
    selectedEdge,
    activeStageId,
    filteredStageId,
    stageCounts,
    stageLanes,
    stageFocusBounds,
    stageFocusTrigger,
    fitViewTrigger,
    handleNodesChange,
    handleNodeDragStop,
    handleEdgesChange,
    onConnect,
    onNodeClick,
    onEdgeClick,
    onPaneClick,
    onDrop,
    updateSelectedNode,
    updateConditions,
    updateEffects,
    updateNodeProps,
    updateScript,
    assignNodeStage,
    setShowPreview,
    deleteSelectedNode,
    handleEdgeLabelChange,
    handleDeleteEdge,
    setActiveStageId,
    handleFocusStage,
    handleToggleStageFilter,
    activePanel,
    setActivePanel,
    nodeForm,
    conditions,
    effects,
    nodeProps,
    script,
    itemOptions,
    projectRoles,
    simTargets,
  } = editor;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <Suspense fallback={<StudioModeFallback />}>
<LazyFlowStudioView
          wrapperRef={wrapperRef}
          viewMode={viewMode}
          projectScenes={project?.scenes}
          displayNodes={rfNodes}
          edges={rfEdges}
          hoveredEdge={hoveredEdge}
          selectedNode={selectedNode}
          selectedEdge={selectedEdge}
          activeStageId={activeStageId}
          filteredStageId={filteredStageId}
          stageCounts={stageCounts}
          stageLanes={stageLanes}
          stageFocusBounds={stageFocusBounds}
          stageFocusTrigger={stageFocusTrigger}
          fitViewTrigger={fitViewTrigger}
          activePanel={activePanel}
          nodeForm={nodeForm}
          conditions={conditions}
          effects={effects}
          nodeProps={nodeProps}
          script={script}
          itemOptions={itemOptions}
          projectRoles={projectRoles}
          nodes={rfNodes}
          simTargets={simTargets}
          onActivePanelChange={setActivePanel}
          onNodesChange={handleNodesChange}
          onNodeDragStop={handleNodeDragStop}
          onEdgesChange={handleEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onEdgeClick={onEdgeClick}
          onPaneClick={onPaneClick}
          onEdgeMouseEnter={(_, e) => setHoveredEdge(e.id)}
          onEdgeMouseLeave={() => setHoveredEdge(null)}
          onDrop={onDrop}
          onNodeFormChange={updateSelectedNode}
          onConditionsChange={updateConditions}
          onEffectsChange={updateEffects}
          onPropsChange={updateNodeProps}
          onScriptChange={updateScript}
          onStageChange={assignNodeStage}
          onPreviewScript={() => setShowPreview(true)}
          onDeleteNode={deleteSelectedNode}
          onEdgeLabelChange={handleEdgeLabelChange}
          onDeleteEdge={handleDeleteEdge}
          onSelectStage={setActiveStageId}
          onFocusStage={handleFocusStage}
          onToggleStageFilter={handleToggleStageFilter}
        />
      </Suspense>
    </div>
  );
}
