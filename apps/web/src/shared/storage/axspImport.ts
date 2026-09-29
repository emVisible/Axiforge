import { remapCharacterIds, unpackAxsp } from "@axiforge/editor-core";
import type {
  ProjectMeta,
  StorageProvider,
  StorageResult,
} from "@axiforge/editor-core";
import { getCreatorId } from "@/shared/lib/creatorId";

/**
 * `.axsp` 导入（从 `shared/storage/index.ts` 外提，G1 行数预算）。
 *
 * 导入 = 现有契约的组合，不新增接口方法。每一步失败都回滚已建的工程，
 * 让调用方拿到一次干净的失败，而不是留下半套内容。
 *
 * 两处曾经真的丢东西，都在这里补上（判据见 `axspRoundTrip.test.ts`）：
 * - **工程元信息**：`createProject` 只吃 title，描述/世界观/规则/机制/题材/标签
 *   必须显式补写。早先这里没补，于是导回来的工程没有世界观——
 *   试玩设定面板整栏空白、卡片"暂无描述"，而"能建能显示"把这个洞盖住了（#21 补齐本地列之后尤其如此）。
 * - **舞台**：契约的 `saveNarrative` 只管 nodes/edges/axsSource，舞台得逐个 `addProjectScene`
 *   并回传新 id，再把节点的 `stageId` 重映射过去。早先整段没做，
 *   所以「从舞台库导入」得来的那些舞台（S13-2a/2b）在跨机分发时全部消失。
 */
export async function importProjectFromAxsp(
  provider: StorageProvider,
  bytes: Uint8Array | string,
): Promise<StorageResult<ProjectMeta>> {
  const unpacked = unpackAxsp(bytes);
  if (!unpacked.ok) return unpacked;
  const { project, characters, assets } = unpacked.data;

  for (const [ref, raw] of Object.entries(assets)) {
    const saved = await provider.saveAsset({
      name: ref.split("/").pop() ?? ref,
      mime: "application/octet-stream",
      bytes: raw,
    });
    if (!saved.ok) return saved;
  }

  const idMap: Record<string, string> = {};
  const owner = getCreatorId();
  for (const c of characters) {
    // 归属改判给接收方、公开位不继承：否则导入的角色在「我的角色」里查不到，
    // 也不该由导出者决定它在别人机器上是否公开。
    const created = await provider.saveCharacter({
      ...c,
      id: "",
      authorId: owner,
      isPublic: false,
    });
    if (!created.ok) return created;
    idMap[c.id] = created.data.id;
  }
  const remapped = remapCharacterIds(project, idMap);

  const created = await provider.createProject({ title: remapped.meta.title });
  if (!created.ok) return created;
  const newId = created.data.id;
  const rollback = async <T>(r: StorageResult<T>) => {
    await provider.deleteProject(newId);
    return r;
  };

  const metaPatch = {
    description: remapped.meta.description,
    coverImage: remapped.meta.coverImage,
    themeTags: remapped.meta.themeTags,
    mechanism: remapped.meta.mechanism,
    genre: remapped.meta.genre,
    isMeta: remapped.meta.isMeta,
    worldSetting: remapped.meta.worldSetting,
    rules: remapped.meta.rules,
  };
  const metaSaved = await provider.updateProjectMeta(newId, metaPatch);
  if (!metaSaved.ok) return rollback(metaSaved);

  // createProject 自带的 bootstrap 主场景要先删掉，否则导入后多一个没用的空舞台
  const fresh = await provider.loadProject(newId);
  if (!fresh.ok) return rollback(fresh);
  for (const s of fresh.data.scenes) {
    const removed = await provider.removeProjectScene(newId, s.id);
    if (!removed.ok) return rollback(removed);
  }

  const sceneMap: Record<string, string> = {};
  for (const s of remapped.scenes) {
    const added = await provider.addProjectScene(newId, {
      title: s.title,
      description: s.description,
      location: s.location,
      atmosphere: s.atmosphere,
      sceneRefId: s.sceneRefId,
      source: s.source,
      sortOrder: s.sortOrder,
    });
    if (!added.ok) return rollback(added);
    sceneMap[s.id] = added.data.id;
  }
  const nodes = remapped.nodes.map((n) =>
    n.stageId && sceneMap[n.stageId] ? { ...n, stageId: sceneMap[n.stageId] } : n,
  );

  const saved = await provider.saveNarrative(newId, {
    axsSource: remapped.axsSource,
    nodes,
    edges: remapped.edges,
  });
  if (!saved.ok) return rollback(saved);

  for (const role of remapped.roles) {
    const r = await provider.addRole(newId, { characterRefId: role.characterRefId });
    if (!r.ok) return rollback(r);
  }
  // 道具引用原样带过去：容器不装道具本体（只装演员表和素材字节），
  // 同机导入即解析得到名字，跨机导入留成悬空引用——编排台按 `道具 <id前缀>` 显示、可手动移除。
  // 静默丢掉才是问题：导出者明明在这份工程里挂了三件道具。
  for (const ref of remapped.assetRefs) {
    const r = await provider.addAssetRef(newId, {
      assetType: ref.assetType,
      assetId: ref.assetId,
    });
    if (!r.ok) return rollback(r);
  }
  // 回一份补写之后的元信息：`created.data` 是 createProject 的产物，只有 title 是真的
  return { ok: true, data: { ...created.data, ...metaPatch } };
}
