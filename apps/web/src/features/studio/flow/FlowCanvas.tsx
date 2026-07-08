import { useCallback, useEffect } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  useReactFlow,
  addEdge,
  type Connection,
  type Edge,
  type Node,
  BackgroundVariant,
  MarkerType,
} from "reactflow";
import { tokens } from "@axiforge/ui";

import { flowEdgeStroke, flowEdgeStrokeHover } from "./types";
import { flowNodeTypes } from "./StoryNode";
import StageSwimlanes from "./StageSwimlanes";
import type { StageLane } from "./stageLayout";

const NODE_W = 240;
const NODE_H = 72;

interface FlowCanvasProps {
  wrapperRef: React.RefObject<HTMLDivElement | null>;
  nodes: Node[];
  edges: Edge[];
  hoveredEdge: string | null;
  focusNodeId?: string | null;
  focusStageBounds?: { cx: number; cy: number } | null;
  focusStageTrigger?: number;
  showSwimlanes?: boolean;
  stageLanes?: StageLane[];
  highlightedStageId?: string | null;
  fitViewTrigger?: number;
  onNodesChange: ReturnType<typeof import("reactflow").useNodesState>[2];
  onEdgesChange: ReturnType<typeof import("reactflow").useEdgesState>[2];
  onConnect: (params: Connection) => void;
  onNodeClick: (event: React.MouseEvent, node: Node) => void;
  onEdgeClick: (event: React.MouseEvent, edge: Edge) => void;
  onPaneClick: () => void;
  onEdgeMouseEnter: (event: React.MouseEvent, edge: Edge) => void;
  onEdgeMouseLeave: () => void;
  onDrop: (event: React.DragEvent) => void;
}

function FocusOnNode({
  nodeId,
  nodes,
}: {
  nodeId: string | null | undefined;
  nodes: Node[];
}) {
  const { setCenter, getZoom } = useReactFlow();

  useEffect(() => {
    if (!nodeId) return;
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;
    setCenter(node.position.x + NODE_W / 2, node.position.y + NODE_H / 2, {
      zoom: Math.max(getZoom(), 0.85),
      duration: 350,
    });
  }, [nodeId, nodes, setCenter, getZoom]);

  return null;
}

function FocusOnStage({
  bounds,
  trigger,
}: {
  bounds: { cx: number; cy: number } | null | undefined;
  trigger: number;
}) {
  const { setCenter } = useReactFlow();

  useEffect(() => {
    if (!bounds || trigger <= 0) return;
    setCenter(bounds.cx, bounds.cy, { zoom: 0.9, duration: 400 });
  }, [bounds, trigger, setCenter]);

  return null;
}

function FitViewOnTrigger({ trigger }: { trigger: number }) {
  const { fitView } = useReactFlow();

  useEffect(() => {
    if (trigger > 0) {
      fitView({ padding: 0.12, duration: 320 });
    }
  }, [trigger, fitView]);

  return null;
}

function FlowCanvasInner({
  wrapperRef,
  nodes,
  edges,
  hoveredEdge,
  focusNodeId,
  focusStageBounds,
  focusStageTrigger = 0,
  showSwimlanes,
  stageLanes = [],
  highlightedStageId,
  fitViewTrigger = 0,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onNodeClick,
  onEdgeClick,
  onPaneClick,
  onEdgeMouseEnter,
  onEdgeMouseLeave,
  onDrop,
}: FlowCanvasProps) {
  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  return (
    <div
      className="flex-1 overflow-hidden rounded-2xl border border-border bg-surface shadow-sm"
      ref={wrapperRef}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges.map((e) => ({
          ...e,
          style: {
            ...e.style,
            strokeWidth: e.id === hoveredEdge ? 4 : 2,
            stroke: e.id === hoveredEdge ? flowEdgeStrokeHover : flowEdgeStroke,
          },
        }))}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        onPaneClick={onPaneClick}
        onEdgeMouseEnter={onEdgeMouseEnter}
        onEdgeMouseLeave={onEdgeMouseLeave}
        onDragOver={onDragOver}
        onDrop={onDrop}
        nodeTypes={flowNodeTypes}
        snapToGrid
        snapGrid={[16, 16]}
        deleteKeyCode={["Backspace", "Delete"]}
        multiSelectionKeyCode={["Shift"]}
        selectionOnDrag
        panOnDrag={[1, 2]}
        minZoom={0.2}
        maxZoom={1.8}
      >
        {showSwimlanes && (
          <StageSwimlanes
            lanes={stageLanes}
            highlightedStageId={highlightedStageId}
          />
        )}
        <FocusOnNode nodeId={focusNodeId} nodes={nodes} />
        <FocusOnStage bounds={focusStageBounds} trigger={focusStageTrigger} />
        <FitViewOnTrigger trigger={fitViewTrigger} />
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color={tokens.border}
        />
        <Controls className="!rounded-xl !border-border !bg-surface/90 !shadow-sm !backdrop-blur-sm" />
        <MiniMap
          style={{ background: tokens.canvas }}
          nodeColor={(n) => {
            if (n.data?.is_anchor) return "#d97706";
            const dot = n.data?.stage_dot as string | undefined;
            return dot || flowEdgeStroke;
          }}
          maskColor="rgba(0,0,0,0.05)"
          className="!rounded-xl !border-border !shadow-sm"
        />
      </ReactFlow>
    </div>
  );
}

export default function FlowCanvas(props: FlowCanvasProps) {
  return (
    <ReactFlowProvider>
      <FlowCanvasInner {...props} />
    </ReactFlowProvider>
  );
}

export { addEdge, MarkerType };
