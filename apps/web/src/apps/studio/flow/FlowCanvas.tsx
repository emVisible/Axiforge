import { useCallback } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
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

interface FlowCanvasProps {
  wrapperRef: React.RefObject<HTMLDivElement | null>;
  nodes: Node[];
  edges: Edge[];
  hoveredEdge: string | null;
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

export default function FlowCanvas({
  wrapperRef,
  nodes,
  edges,
  hoveredEdge,
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
        fitView
        snapToGrid
        snapGrid={[16, 16]}
        deleteKeyCode={["Backspace", "Delete"]}
        multiSelectionKeyCode={["Shift"]}
        selectionOnDrag
        panOnDrag={[1, 2]}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color={tokens.border}
        />
        <Controls className="!rounded-xl !border-border !bg-surface/90 !shadow-sm !backdrop-blur-sm" />
        <MiniMap
          style={{ background: tokens.canvas }}
          nodeColor={(n) => (n.data?.is_anchor ? "#d97706" : flowEdgeStroke)}
          maskColor="rgba(0,0,0,0.05)"
          className="!rounded-xl !border-border !shadow-sm"
        />
      </ReactFlow>
    </div>
  );
}

export { addEdge, MarkerType };
