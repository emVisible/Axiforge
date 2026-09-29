import type { APIRequestContext } from "@playwright/test";

/**
 * E2E API 夹具工厂——数据全部经后端 API 造出，测试只负责 UI 行为断言。
 * 所有工程标题带 [e2e] 前缀，便于识别与清理。
 */

const API = "http://localhost:8000/api/v1";
export const E2E_TAG = "[e2e]";

/* eslint-disable @typescript-eslint/no-explicit-any */

export async function createProject(
  request: APIRequestContext,
  title: string,
): Promise<any> {
  // is_public：播放端点拒绝私有工程（Project is private），基线需要试玩链路
  const res = await request.post(`${API}/editor/projects/`, {
    data: { title: `${E2E_TAG} ${title}`, is_public: true },
  });
  if (!res.ok()) throw new Error(`createProject: ${res.status()} ${await res.text()}`);
  return res.json();
}

export async function getProject(
  request: APIRequestContext,
  projectId: string,
): Promise<any> {
  const res = await request.get(`${API}/editor/projects/${projectId}`);
  if (!res.ok()) throw new Error(`getProject: ${res.status()}`);
  return res.json();
}

/** 在工程首个舞台下新建节点（narrative_data 直传） */
export async function addNode(
  request: APIRequestContext,
  projectId: string,
  sceneId: string,
  narrative: Record<string, unknown>,
): Promise<any> {
  const res = await request.post(
    `${API}/editor/projects/${projectId}/scenes/${sceneId}/nodes`,
    { data: { narrative_data: narrative } },
  );
  if (!res.ok()) throw new Error(`addNode: ${res.status()} ${await res.text()}`);
  return res.json();
}

export async function updateNode(
  request: APIRequestContext,
  projectId: string,
  sceneId: string,
  nodeId: string,
  narrative: Record<string, unknown>,
  editorData?: Record<string, unknown>,
): Promise<any> {
  const res = await request.put(
    `${API}/editor/projects/${projectId}/scenes/${sceneId}/nodes/${nodeId}`,
    { data: { narrative_data: narrative, ...(editorData ? { editor_data: editorData } : {}) } },
  );
  if (!res.ok()) throw new Error(`updateNode: ${res.status()} ${await res.text()}`);
  return res.json();
}

export async function replaceEdges(
  request: APIRequestContext,
  projectId: string,
  edges: { source_node_id: string; target_node_id: string; label?: string | null }[],
): Promise<any> {
  const res = await request.post(`${API}/editor/projects/${projectId}/edges`, {
    data: edges,
  });
  if (!res.ok()) throw new Error(`replaceEdges: ${res.status()} ${await res.text()}`);
  return res.json();
}

export async function createCharacter(
  request: APIRequestContext,
  name: string,
): Promise<any> {
  const res = await request.post(`${API}/characters/`, {
    data: { character_data: { anchor: { name } }, is_public: false },
  });
  if (!res.ok()) throw new Error(`createCharacter: ${res.status()} ${await res.text()}`);
  return res.json();
}

export async function addRole(
  request: APIRequestContext,
  projectId: string,
  characterRefId: string,
): Promise<any> {
  const res = await request.post(`${API}/editor/projects/${projectId}/roles`, {
    data: { character_ref_id: characterRefId },
  });
  if (!res.ok()) throw new Error(`addRole: ${res.status()} ${await res.text()}`);
  return res.json();
}
