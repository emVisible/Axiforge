import { remapCharacterIds, remapNodeIds, unpackAxsp } from "@axiforge/editor-core";
import type {
  ProjectMeta,
  StorageError,
  StorageProvider,
  StorageResult,
} from "@axiforge/editor-core";
import { getCreatorId } from "@/shared/lib/creatorId";

/** `StorageError` 没有统一的 `detail` 字段（`not_found` 只有 entity/id），所以逐类取一句人话 */
function describe(e: StorageError): string {
  return e.code === "io" ? e.detail : `${e.code}（${e.entity} ${e.id}）`;
}

/**
 * `.axsp` 导入（从 `shared/storage/index.ts` 外提，G1 行数预算）。
 *
 * 导入 = 现有契约的组合，不新增接口方法。
 *
 * **回滚边界（2026-10-01 复审改写；原文那版承诺过头了）**：原文写「每一步失败都回滚已建的工程」，
 * 而实测里 `createProject` 与 `saveCharacter` 两个出口**根本没有回滚**——
 * `createProject` 失败时前面建好的角色全部留在库里，而重试一次多一组孤儿。
 * 修法是**把 `createProject` 提到最前面**：它只需要 title（`remapCharacterIds` 只改角色引用，
 * 不碰 `meta.title`），于是从那一刻起每个失败出口都能删掉已建的工程。
 * `createProject` 之前只剩素材字节，而素材是内容寻址的、没有引用，落地了也不可见。
 *
 * **仍回滚不了的一格**：角色。L4 契约里只有 `saveCharacter` / `listCharacters` / `getCharacter`，
 * 没有删除方法，所以"第 3 个角色存失败"会留下前两个（工程能删掉，角色删不掉）。
 * 这是在册待决 ⑬（前置问题与「内核有 `role.remove` 能力、界面没有入口」同一个：
 * 仍在被引用的对象怎么办）。此处**只登记不伪称已解决**——`axspImport.rollback.test.ts`
 * 里那条特征化断言就是这一格的实测形状。
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

  // 工程先建：它是唯一有删除方法的那一半，先建起来后面的每个出口才有得回滚
  // （`remapCharacterIds` 只重映射角色引用，`meta.title` 原样，标题可以直接取）
  const created = await provider.createProject({ title: project.meta.title });
  if (!created.ok) return created;
  const newId = created.data.id;
  const rollback = async <T>(r: StorageResult<T>): Promise<StorageResult<T>> => {
    const removed = await provider.deleteProject(newId);
    // 清理也失败时不能把原错误原样递出去：那句话写着「已回滚」，而半套工程还在库里。
    // 合并成一条说清两件事的 `io`（调用方只读 code，不依赖 detail 的措辞）。
    if (!removed.ok) {
      const before = r.ok ? "未知错误" : describe(r.error);
      return {
        ok: false,
        error: {
          code: "io",
          detail: `${before}；回滚也失败：${describe(removed.error)}（可能留下一个不完整的工程）`,
        },
      };
    }
    return r;
  };

  for (const [ref, raw] of Object.entries(assets)) {
    const saved = await provider.saveAsset({
      name: ref.split("/").pop() ?? ref,
      mime: "application/octet-stream",
      bytes: raw,
    });
    if (!saved.ok) return rollback(saved);
  }

  const idMap: Record<string, string> = {};
  const owner = getCreatorId();
  for (const c of characters) {
    // 归属改判给接收方、公开位不继承：否则导入的角色在「我的角色」里查不到，
    // 也不该由导出者决定它在别人机器上是否公开。
    const made = await provider.saveCharacter({
      ...c,
      id: "",
      authorId: owner,
      isPublic: false,
    });
    if (!made.ok) return rollback(made);
    idMap[c.id] = made.data.id;
  }
  const withNewCharacters = remapCharacterIds(project, idMap);
  /**
   * 节点与边也必须换身份：`project_nodes.id` / `project_edges.id` 是**全局**主键，
   * 而包里的 id 来自导出方那台机器——同机再导一次（哪怕导到另一个工程）第二条 INSERT 就撞主键，
   * `saveNarrative` 整批事务回滚 ⇒ 用户看到"导入失败"。判据与真库复现在
   * `packages/editor-core/src/axspReimport.test.ts`（内存宿主跨工程不查重复，那里只会给假的绿）。
   */
  const remapped = remapNodeIds(withNewCharacters);

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
