import "reactflow/dist/style.css";
import type { Connection, Edge, Node } from "reactflow";
import FlowCanvas from "../flow/FlowCanvas";
import FlowNodePalette from "../flow/FlowNodePalette";
import StageLegend from "../flow/StageLegend";
import NodeInspectorPanel, { type PanelTab } from "../flow/NodeInspectorPanel";
import type { StageLane } from "../flow/stageLayout";
import type {
  ConditionItem,
  EffectItem,
  NodeFormState,
  ProjectRoleOption,
} from "../flow/types";
import type { Instruction } from "@axiforge/core";
import type { ProjectSceneResponse } from "@/shared/types/project";
import type { SimTarget } from "../components/ConditionSimulator";

export interface FlowStudioViewProps {
  wrapperRef: React.RefObject<HTMLDivElement | null>;
  viewMode: "full" | "stage";
  projectScenes?: ProjectSceneResponse[];
  displayNodes: Node[];
  edges: Edge[];
  hoveredEdge: string | null;
  selectedNode: Node | null;
  selectedEdge: Edge | null;
  activeStageId: string | null;
  filteredStageId: string | null;
  stageCounts: Record<string, number>;
  stageLanes: StageLane[];
  stageFocusBounds: { cx: number; cy: number } | null;
  stageFocusTrigger: number;
  fitViewTrigger: number;
  activePanel: PanelTab;
  nodeForm: NodeFormState;
  conditions: ConditionItem[];
  effects: EffectItem[];
  nodeProps: string[];
  script: Instruction[];
  itemOptions: { id: string; name: string }[];
  projectRoles: ProjectRoleOption[];
  nodes: Node[];
  simTargets: SimTarget[];
  highlightScriptIndex?: number | null;
  onActivePanelChange: (tab: PanelTab) => void;
  onNodesChange: ReturnType<typeof import("reactflow").useNodesState>[2];
  onNodeDragStop?: import("reactflow").NodeMouseHandler;
  onEdgesChange: ReturnType<typeof import("reactflow").useEdgesState>[2];
  onConnect: (params: Connection) => void;
  onNodeClick: (event: React.MouseEvent, node: Node) => void;
  onEdgeClick: (event: React.MouseEvent, edge: Edge) => void;
  onPaneClick: () => void;
  onEdgeMouseEnter: (event: React.MouseEvent, edge: Edge) => void;
  onEdgeMouseLeave: () => void;
  onDrop: (event: React.DragEvent) => void;
  onNodeFormChange: (data: Partial<NodeFormState>) => void;
  onConditionsChange: (c: ConditionItem[]) => void;
  onEffectsChange: (e: EffectItem[]) => void;
  onPropsChange: (ids: string[]) => void;
  onScriptChange: (s: Instruction[]) => void;
  onStageChange: (stageId: string) => void;
  onPreviewScript: () => void;
  onDeleteNode: () => void;
  onEdgeLabelChange: (edgeId: string, label: string) => void;
  onDeleteEdge: (edgeId: string) => void;
  onSelectStage: (id: string) => void;
  onFocusStage: (id: string) => void;
  onToggleStageFilter: (id: string) => void;
}

export default function FlowStudioView({
  wrapperRef,
  viewMode,
  projectScenes,
  displayNodes,
  edges,
  hoveredEdge,
  selectedNode,
  selectedEdge,
  activeStageId,
  filteredStageId,
  stageCounts,
  stageLanes,
  stageFocusBounds,
  stageFocusTrigger,
  fitViewTrigger,
  activePanel,
  nodeForm,
  conditions,
  effects,
  nodeProps,
  script,
  itemOptions,
  projectRoles,
  nodes,
  simTargets,
  highlightScriptIndex,
  onActivePanelChange,
  onNodesChange,
  onNodeDragStop,
  onEdgesChange,
  onConnect,
  onNodeClick,
  onEdgeClick,
  onPaneClick,
  onEdgeMouseEnter,
  onEdgeMouseLeave,
  onDrop,
  onNodeFormChange,
  onConditionsChange,
  onEffectsChange,
  onPropsChange,
  onScriptChange,
  onStageChange,
  onPreviewScript,
  onDeleteNode,
  onEdgeLabelChange,
  onDeleteEdge,
  onSelectStage,
  onFocusStage,
  onToggleStageFilter,
}: FlowStudioViewProps) {
  return (
    <div className="flex min-h-0 flex-1 gap-4 overflow-hidden p-4">
      <div className="flex w-44 shrink-0 flex-col gap-3">
        <FlowNodePalette />
        {viewMode === "full" && projectScenes && (
          <StageLegend
            scenes={projectScenes}
            activeStageId={activeStageId}
            filteredStageId={filteredStageId}
            nodeCounts={stageCounts}
            onSelectStage={onSelectStage}
            onFocusStage={onFocusStage}
            onToggleFilter={onToggleStageFilter}
          />
        )}
      </div>

      <FlowCanvas
        wrapperRef={wrapperRef}
        nodes={displayNodes}
        edges={edges}
        hoveredEdge={hoveredEdge}
        focusNodeId={selectedNode?.id}
        focusStageBounds={stageFocusBounds}
        focusStageTrigger={stageFocusTrigger}
        showSwimlanes={viewMode === "full"}
        stageLanes={stageLanes}
        highlightedStageId={filteredStageId}
        fitViewTrigger={fitViewTrigger}
        onNodesChange={onNodesChange}
        onNodeDragStop={onNodeDragStop}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        onPaneClick={onPaneClick}
        onEdgeMouseEnter={onEdgeMouseEnter}
        onEdgeMouseLeave={onEdgeMouseLeave}
        onDrop={onDrop}
      />

      <NodeInspectorPanel
        selectedNode={selectedNode}
        selectedEdge={selectedEdge}
        activePanel={activePanel}
        onActivePanelChange={onActivePanelChange}
        nodeForm={nodeForm}
        onNodeFormChange={onNodeFormChange}
        conditions={conditions}
        onConditionsChange={onConditionsChange}
        effects={effects}
        onEffectsChange={onEffectsChange}
        nodeProps={nodeProps}
        onPropsChange={onPropsChange}
        itemOptions={itemOptions}
        script={script}
        onScriptChange={onScriptChange}
        projectRoles={projectRoles}
        scenes={projectScenes || []}
        nodeStageId={(selectedNode?.data.stage_id as string) || null}
        onStageChange={onStageChange}
        nodes={nodes}
        simTargets={simTargets}
        onPreviewScript={onPreviewScript}
        onDeleteNode={onDeleteNode}
        highlightScriptIndex={highlightScriptIndex}
        onEdgeLabelChange={onEdgeLabelChange}
        onDeleteEdge={onDeleteEdge}
      />
    </div>
  );
}
