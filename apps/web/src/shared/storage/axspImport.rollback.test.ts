// @vitest-environment node
import { readFileSync } from "node:fs";
import {
  MemoryStorageProvider,
  err,
  type StorageProvider,
} from "@axiforge/editor-core";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { exportProjectAsAxsp, importProjectFromAxsp } from "./index";

/**
 * `getCreatorId()` 在没有 localStorage 的宿主里每次调用都返回**新的随机 id**（它自己的兜底分支）。
 * 桌面壳里 localStorage 存在、id 稳定，所以这不是产品缺陷；但不桩定它，按 authorId 过滤的断言
 * 就会因为"两次调用拿到两个 id"而红在测试宿主上。桩成常量，让残留判据量的是产品语义而不是宿主。
 */
const TEST_CREATOR = "creator-test";
vi.mock("@/shared/lib/creatorId", () => ({ getCreatorId: () => TEST_CREATOR }));

/**
 * `.axsp` 导入的回滚契约。
 *
 * `importProjectFromAxsp` 在工程建好之后有 **9 个失败出口**（2026-10-01 复审从 7 补到 9），
 * 每个都调 `rollback` 删掉半建的工程，函数头还写着「让调用方拿到一次干净的失败，而不是留下半套内容」——
 * 而这条承诺此前**一条判据都没有**：既有的 `axspRoundTrip.test.ts` 走的全是成功路径。
 * 少守一次的后果是用户库里的孤儿工程（标题同名、内容半套，只能手动删），
 * 而"回滚"这行代码被谁删掉或漏掉一处，测试不会红。
 *
 * **出口数为什么从 7 变 9（复审实测）**：`saveAsset` 与 `saveCharacter` 原本排在 `createProject` 之前，
 * 它们失败时 `rollback` 还没被定义 ⇒ 那两个出口**根本没有回滚**，`createProject` 失败还会把
 * 前面建好的角色全留在库里。现已把 `createProject` 提到最前，两个出口都改成走 `rollback`，
 * 所以枚举从 7 补到 9。**判据的覆盖面必须跟着代码的覆盖面走**：
 * 旧枚举配新代码会漏（那正是"新加失败点忘配回滚"的形状），新枚举配旧代码也会红——
 * 两种失配都说明这份枚举是手抄的，所以它在下面与 `rollback` 的调用点一一对照。
 *
 * 这里同时**如实钉住一处守不了的**：失败时本次新建的角色会留下——
 * L4 契约里根本没有删除角色的方法（只有 `saveCharacter`），所以导入无法自我撤销那一半。
 * 那条不是本文件的修法，是待决（见 docs/HANDOFF_DESKTOP.md §6 待你定档清单）。
 */

type Failable =
  | "saveAsset"
  | "saveCharacter"
  | "createProject"
  | "updateProjectMeta"
  | "loadProject"
  | "removeProjectScene"
  | "addProjectScene"
  | "saveNarrative"
  | "addRole"
  | "addAssetRef";

const FAILABLE: readonly Failable[] = [
  "saveAsset",
  "saveCharacter",
  "updateProjectMeta",
  "loadProject",
  "removeProjectScene",
  "addProjectScene",
  "saveNarrative",
  "addRole",
  "addAssetRef",
];

/**
 * 只让指定方法在**第 `nth` 次**调用时失败（默认第一次）；其余方法绑回真 provider
 * （否则 this 上的内部状态会丢）。
 * `nth` 是必需的旋钮而不是可选装饰：角色落地是循环体，"第 N 个失败留下前 N-1 个"只在 N>1 时量得到，
 * 用"每次都失败"去测残留会得到 0 个，然后被读成"没有残留"。
 */
function failingOn(base: StorageProvider, method: Failable, nth = 1): StorageProvider {
  let seen = 0;
  return new Proxy(base, {
    get(target, prop, receiver) {
      if (prop === method) {
        // 未轮到的那几次要**原样转发参数**——`saveCharacter` 少了入参会读不到 `id`
        return (...args: unknown[]) => {
          seen += 1;
          if (seen === nth) return err({ code: "io", detail: `注入失败：${String(prop)}` });
          return (target[prop as keyof StorageProvider] as (...a: unknown[]) => unknown)(...args);
        };
      }
      const value = Reflect.get(target, prop, receiver) as unknown;
      return typeof value === "function"
        ? (value as (...args: unknown[]) => unknown).bind(target)
        : value;
    },
  });
}

let bundle: Uint8Array;

beforeEach(async () => {
  const src = new MemoryStorageProvider();
  const created = await src.createProject({ title: "会被反复导入的那部" });
  if (!created.ok) throw new Error("夹具建工程失败");
  const id = created.data.id;
  // 素材字节要先落盘并把 ref 挂到角色 imagePath 上，`exportProjectAsAxsp` 才收进包里
  // （它走 `collectAssetRefs`）；没有它的话 `saveAsset` 那个失败出口在夹具里根本不可达，
  // 枚举里留着它就是一条永不点火的判据。
  const asset = await src.saveAsset({
    name: "tower.png",
    mime: "image/png",
    bytes: new Uint8Array([137, 80, 78, 71]),
  });
  if (!asset.ok) throw new Error("夹具建素材失败");
  const char = await src.saveCharacter({
    id: "",
    name: "塔下的人",
    characterData: {},
    imagePath: asset.data.ref,
    authorId: "creator-a",
    isPublic: false,
  });
  if (!char.ok) throw new Error("夹具建角色失败");
  // 两个角色而不是一个：`saveCharacter` 是循环体，"第 N 个失败留下前 N-1 个"要两个才量得到。
  // 一个角色时首次调用就失败、库里 0 个残留，那条残留形状会被读成"没有残留"。
  const char2 = await src.saveCharacter({
    id: "",
    name: "塔顶的人",
    characterData: {},
    imagePath: null,
    authorId: "creator-a",
    isPublic: false,
  });
  if (!char2.ok) throw new Error("夹具建第二个角色失败");
  const scene = await src.addProjectScene(id, { title: "塔基", location: "塔基平台" });
  if (!scene.ok) throw new Error("夹具建舞台失败");
  const saved = await src.saveNarrative(id, {
    axsSource: "# 塔基\n塔下的人: 你来过。\n> 上去 -> 塔顶\n\n# 塔顶\n风很大。\n",
    nodes: [
      { id: "n1", stageId: scene.data.id, editorData: {}, narrativeData: {}, sortOrder: 0 },
      { id: "n2", stageId: null, editorData: {}, narrativeData: {}, sortOrder: 1 },
    ],
    edges: [],
  });
  if (!saved.ok) throw new Error("夹具存稿失败");
  const role = await src.addRole(id, { characterRefId: char.data.id });
  if (!role.ok) throw new Error("夹具挂角失败");
  const role2 = await src.addRole(id, { characterRefId: char2.data.id });
  if (!role2.ok) throw new Error("夹具挂第二个角失败");
  const ref = await src.addAssetRef(id, { assetType: "item", assetId: "pool-item-1" });
  if (!ref.ok) throw new Error("夹具挂道具失败");
  const exported = await exportProjectAsAxsp(src, id);
  if (!exported.ok) throw new Error("夹具导出失败");
  bundle = exported.data;
});

describe(".axsp 导入失败时不留半套工程", () => {
  it("对照组：不注入失败时导入成功，建出 1 个工程与 2 个角色", async () => {
    const target = new MemoryStorageProvider();
    const r = await importProjectFromAxsp(target, bundle);

    expect(r.ok).toBe(true);
    const projects = await target.listProjects();
    const chars = await target.listCharacters({ authorId: TEST_CREATOR });
    expect(projects.ok && projects.data.length).toBe(1);
    expect(chars.ok && chars.data.length).toBe(2);
  });

  it.each(FAILABLE)("失败在 %s 时，半建的工程被删掉，工程列表回到空", async (method) => {
    const target = new MemoryStorageProvider();
    const r = await importProjectFromAxsp(failingOn(target, method), bundle);

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe("io");
    const projects = await target.listProjects();
    expect(projects.ok && projects.data.length).toBe(0);
  });

  /**
   * 复审补的一条：出口的枚举是手抄的，所以要钉住"代码里 rollback 的调用点数 = 枚举里的出口数"。
   * 少配一处（"新加失败点忘配回滚"）会让 `FAILABLE` 少一项——而少的那一项在 `it.each` 里根本看不见，
   * 测试照样全绿。这条把两个数字对起来，枚举与代码不再能各走各的。
   * 牙：把 `axspImport.ts` 里任意一个 `rollback(...)` 去掉 ⇒ 这里立刻红（差 1）。
   */
  it("枚举的失败出口数与实现里 rollback 的调用点数一致", async () => {
    const src = readFileSync(new URL("./axspImport.ts", import.meta.url), "utf8");
    const callSites = (src.match(/return rollback\(/g) ?? []).length;
    // 成功路径最后一行不是失败出口，不该计入
    expect(callSites).toBe(FAILABLE.length);
  });

  /**
   * 复审补的一条：`createProject` 排在最前，所以它失败时**什么也没建**，回滚无从谈起也不需要。
   * 这条钉的是那个顺序决策本身——把 `createProject` 挪回角色循环之后（即旧顺序），
   * 本条仍绿，而「createProject 失败留下整组孤儿角色」那条洞会重新打开。
   * 所以顺序的牙齿在下面那条 `saveCharacter` 用例上，不在本条。
   */
  it("createProject 失败时库里一个角色都不留（工程先建 ⇒ 它失败时还没有任何东西落地）", async () => {
    const target = new MemoryStorageProvider();
    const r = await importProjectFromAxsp(failingOn(target, "createProject"), bundle);

    expect(r.ok).toBe(false);
    const projects = await target.listProjects();
    const mine = await target.listCharacters({ authorId: TEST_CREATOR });
    expect(projects.ok && projects.data.length).toBe(0);
    expect(mine.ok && mine.data.length).toBe(0);
  });

  /**
   * 复审补的一条牙齿：`saveCharacter` 是角色落地的唯一一步，它失败时工程能被删掉、角色删不掉。
   * 旧顺序下这个出口**根本没有 rollback**（那时 `createProject` 还没执行），工程会整个留在库里。
   * 这条同时钉住两件事：工程列表回到 0（回滚真的调到了），以及角色残留仍在（待决 ⑬ 未被偷偷"修好"）。
   */
  it("saveCharacter 失败：工程被删掉，先落地的角色留在原地（残留那半是待决 ⑬，不许被顺手抹掉）", async () => {
    // 第 2 个角色失败 ⇒ 第 1 个已经落库且删不掉（契约里没有 deleteCharacter）
    const target = new MemoryStorageProvider();
    const r = await importProjectFromAxsp(failingOn(target, "saveCharacter", 2), bundle);

    expect(r.ok).toBe(false);
    const projects = await target.listProjects();
    expect(projects.ok && projects.data.length).toBe(0);
    const mine = await target.listCharacters({ authorId: TEST_CREATOR });
    expect(mine.ok && mine.data.length).toBe(1);
  });

  /**
   * 与上面那条配对的一条：**第 1 个**角色就失败时库里一个角色都不留。
   * 两条一起把"留下的是已经落地的那几个"这件事钉死——只写"留下 1 个"的话，
   * 有人把 `saveCharacter` 挪到 `createProject` 之后又调了顺序，测试可能照样绿。
   */
  it("saveCharacter 第一次就失败：一个角色都不留（残留的是已落地的那几个，不是固定的 1 个）", async () => {
    const target = new MemoryStorageProvider();
    const r = await importProjectFromAxsp(failingOn(target, "saveCharacter", 1), bundle);

    expect(r.ok).toBe(false);
    const mine = await target.listCharacters({ authorId: TEST_CREATOR });
    expect(mine.ok && mine.data.length).toBe(0);
  });

  /**
   * 回滚自己失败时不能把原错误原样递出去：那条消息写着"已回滚"，而半套工程还在库里，
   * 用户照着这句话去找会找不到。合并成一条说清两件事的 `io`。
   * 牙：把 `rollback` 里的 `if (!removed.ok)` 分支去掉 ⇒ 下面 `detail` 不含"回滚也失败" ⇒ 红。
   */
  it("回滚也失败时，报错要说出「回滚也失败」，不能只递原错误", async () => {
    const target = failingOn(new MemoryStorageProvider(), "saveNarrative");
    const bothFailing = new Proxy(target, {
      get(t, prop, receiver) {
        if (prop === "deleteProject") {
          return () => err({ code: "io", detail: "注入失败：deleteProject" });
        }
        const value = Reflect.get(t, prop, receiver) as unknown;
        return typeof value === "function"
          ? (value as (...args: unknown[]) => unknown).bind(t)
          : value;
      },
    });

    const r = await importProjectFromAxsp(bothFailing, bundle);

    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe("io");
    const detail = r.error.code === "io" ? r.error.detail : "";
    expect(detail).toContain("回滚也失败");
    expect(detail).toContain("注入失败：deleteProject");
  });

  /**
   * 如实记录守不了的那一半（特征化断言，不是愿望）：
   * 失败路径把工程删了，但**本次新建的角色留在库里**——L4 契约没有删除角色的方法，
   * 导入方无法撤销 `saveCharacter` 那一步。用户每重试一次就多一组孤儿角色。
   * 读它必须带 `authorId` 范围：不带范围只回公开角色，而导入的角色一律不继承公开位，
   * 于是"没有残留"会被一次读错范围的查询伪装出来。
   * 补上 `deleteCharacter` 之后要**改写**这条断言（改成"也回滚角色"），不要删掉它。
   */
  it("已知残留：失败导入把新建的角色留在原地（契约里没有删角色的方法）", async () => {
    const target = new MemoryStorageProvider();
    const r = await importProjectFromAxsp(failingOn(target, "saveNarrative"), bundle);

    expect(r.ok).toBe(false);
    const projects = await target.listProjects();
    expect(projects.ok && projects.data.length).toBe(0);
    const mine = await target.listCharacters({ authorId: TEST_CREATOR });
    expect(mine.ok && mine.data.length).toBe(2);
    const publicList = await target.listCharacters();
    expect(publicList.ok && publicList.data.length).toBe(0);
  });
});
