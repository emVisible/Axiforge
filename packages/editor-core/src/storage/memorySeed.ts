/**
 * MemoryStorageProvider 的新建工程引导数据（主场景 + 开始/结束两节点 + 一条边）。
 *
 * 与 SQLite 侧 `SqliteProjectStore.createProject` 的引导行同构——两端各自写一遍
 * 是因为一份是 Map 一份是 SQL 行，抽成公共常量反而要多一层适配。
 * 外提成模块的直接原因是 G1：memory.ts 已经贴着 400 行棘轮。
 */

import type { StoredEdge, StoredNode, StoredScene } from "./types";

export function bootstrapScenesAndNodes(): {
  scenes: StoredScene[];
  nodes: StoredNode[];
  edges: StoredEdge[];
} {
  const scenes: StoredScene[] = [{ id: "scene-main", title: "主场景" }];
  const nodes: StoredNode[] = [
    {
      id: "node-start",
      stageId: "scene-main",
      editorData: { position: { x: 120, y: 80 } },
      narrativeData: { title: "开始", narration: "故事从这里开始...", is_anchor: true },
      sortOrder: 0,
    },
    {
      id: "node-end",
      stageId: "scene-main",
      editorData: { position: { x: 420, y: 80 } },
      narrativeData: { title: "结束", script: [] },
      sortOrder: 1,
    },
  ];
  const edges: StoredEdge[] = [
    { id: "node-start-node-end", source: "node-start", target: "node-end", label: "开始" },
  ];
  return { scenes, nodes, edges };
}
