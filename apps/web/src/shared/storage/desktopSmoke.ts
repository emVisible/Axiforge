/**
 * 桌面存储冒烟（仅 DEV + Tauri 环境自动运行）。
 * 验证链路：plugin-sql → TauriSqlBackend → SqliteStorageProvider → 契约关键语义。
 * 输出可 grep 标记：AXIFORGE-DESKTOP-STORAGE: PASS / FAIL <步骤>
 */
import { createStorageProvider, exportProjectAsAxsp, getSeedOutcome } from "./index";
import { bundleToCompilerInput } from "./compilerInput";
import { assetDisplayUrl, getLocalAssetRoot } from "./assetContext";
import { localAssetPath, unpackAxsp, type StorageProvider } from "@axiforge/editor-core";
import { compileStory } from "@axiforge/core";

/** 真实可解码的 1x1 透明 PNG（68 字节）——素材出图断言的固定样本 */
const PNG_1X1 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==";

/** 图片是否真正加载并解码成功 */
function probeImageLoad(src: string, timeoutMs = 4000): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    const timer = setTimeout(() => resolve(false), timeoutMs);
    img.onload = () => {
      clearTimeout(timer);
      resolve(true);
    };
    img.onerror = () => {
      clearTimeout(timer);
      resolve(false);
    };
    img.src = src;
  });
}

async function writeResultFile(text: string): Promise<void> {
  try {
    const fs = await import("@tauri-apps/plugin-fs");
    await fs.mkdir("Axiforge", { baseDir: fs.BaseDirectory.Document, recursive: true });
    await fs.writeTextFile("Axiforge/storage-smoke.txt", text, {
      baseDir: fs.BaseDirectory.Document,
    });
  } catch (e) {
    console.error("AXIFORGE-DESKTOP-STORAGE: 结果文件写入失败", e);
  }
}

/** 造一个「角色 + 立绘 + 引用该角色」的工程，供容器断言使用 */
async function createProjectWithAsset(
  p: StorageProvider,
): Promise<{ projectId: string; ref: string; png: Uint8Array }> {
  const created = await p.createProject({ title: "容器冒烟" });
  if (!created.ok) throw new Error("容器冒烟：建工程失败");
  const png = Uint8Array.from(atob(PNG_1X1), (c) => c.charCodeAt(0));
  const asset = await p.saveAsset({ name: "seed.png", mime: "image/png", bytes: png });
  if (!asset.ok) throw new Error("容器冒烟：素材落盘失败");
  const ref = asset.data.ref;
  const char = await p.saveCharacter({
    id: "",
    name: "容器角色",
    characterData: {},
    imagePath: ref,
    isPublic: false,
    authorId: "desktop-smoke",
  });
  if (!char.ok) throw new Error("容器冒烟：角色建档失败");
  await p.addRole(created.data.id, { characterRefId: char.data.id });
  return { projectId: created.data.id, ref, png };
}

export async function smokeDesktopStorage(): Promise<boolean> {
  let cleanup: (() => Promise<void>) | null = null;
  const mark = (ok: boolean, step: string) => {
    console.log(`AXIFORGE-DESKTOP-STORAGE: ${ok ? "OK" : "FAIL"} ${step}`);
    if (!ok) void writeResultFile(`FAIL ${step}`);
  };
  try {
    const p = await createStorageProvider();
    mark(true, "provider-init");

    // 首启播种（C2）：新库应灌入示范作；已有内容或已标记则跳过——失败不可接受
    const seed = getSeedOutcome();
    const seedOk = seed !== null && seed.status !== "failed";
    mark(seedOk, `seed ${JSON.stringify(seed)}`);
    if (!seedOk) {
      await writeResultFile(`FAIL seed: ${JSON.stringify(seed)}`);
      return false;
    }

    const created = await p.createProject({ title: "壳内冒烟" });
    mark(created.ok, "createProject");
    if (!created.ok) return false;
    const id = created.data.id;
    cleanup = async () => {
      try { await p.deleteProject(id); } catch { /* 尽力清理 */ }
    };

    const load1 = await p.loadProject(id);
    mark(load1.ok && load1.data.nodes.length >= 2, "bootstrap-load");
    if (!load1.ok) return false;

    const saved = await p.saveNarrative(id, {
      axsSource: "# 冒烟\n",
      nodes: [
        { id: "smoke-1", stageId: null, editorData: { position: { x: 1, y: 1 } }, narrativeData: { title: "冒烟拍", script: [{ op: "narration", text: "冒烟拍" }] }, sortOrder: 0 },
      ],
      edges: [],
    });
    if (!saved.ok) {
      await writeResultFile(`FAIL saveNarrative-io: ${JSON.stringify(saved.error)}`);
      return false;
    }
    const load2 = await p.loadProject(id);
    if (!load2.ok) {
      await writeResultFile(`FAIL load2: ${JSON.stringify(load2.error)}`);
      return false;
    }
    if (load2.data.nodes.length !== 1 || load2.data.axsSource !== "# 冒烟\n") {
      await writeResultFile(
        `FAIL saveNarrative-overwrite: nodes=${load2.data.nodes.length} axs=${JSON.stringify(load2.data.axsSource)}`,
      );
      return false;
    }
    mark(true, "saveNarrative-overwrite");

    const dup = { id: "dup", stageId: null, editorData: {}, narrativeData: {}, sortOrder: 0 };
    const bad = await p.saveNarrative(id, {
      axsSource: null,
      nodes: [dup, { ...dup, sortOrder: 1 }],
      edges: [],
    });
    const load3 = await p.loadProject(id);
    const rolledBack = !bad.ok && load3.ok && load3.data.nodes.length === 1;
    mark(rolledBack, "transaction-rollback");
    if (!rolledBack) {
      await writeResultFile(
        `FAIL transaction-rollback: badOk=${bad.ok} nodes=${load3.ok ? load3.data.nodes.length : "err"}`,
      );
      return false;
    }

    // 离线试玩链路：Provider 数据 → 本地编译 → 引擎可启动（不触网）
    const chars = await p.listCharacters();
    const pkg = compileStory(
      bundleToCompilerInput(load3.data, chars.ok ? chars.data : []),
    );
    const playable =
      pkg.beats.length === 1 &&
      Boolean(pkg.startBeatId) &&
      (pkg.beats[0]!.script[0] as { text?: string })?.text === "冒烟拍";
    mark(playable, "offline-play-compile");
    if (!playable) {
      await writeResultFile(
        `FAIL offline-play-compile: beats=${pkg.beats.length} start=${pkg.startBeatId}`,
      );
      return false;
    }

    await p.addRole(id, { characterRefId: "smoke-char" });
    const dupRole = await p.addRole(id, { characterRefId: "smoke-char" });
    mark(!dupRole.ok, "role-duplicate-reject");

    // 素材本地闭环：字节 → 落盘 ref → 同内容去重 → 读回等价 → asset 协议可出图
    // 用真实可解码的 1x1 PNG：img.onload 触发才算「字节到达且能解码」
    const png = Uint8Array.from(atob(PNG_1X1), (c) => c.charCodeAt(0));
    const asset = await p.saveAsset({ name: "冒烟.png", mime: "image/png", bytes: png });
    if (!asset.ok) {
      await writeResultFile(`FAIL asset-save: ${JSON.stringify(asset.error)}`);
      return false;
    }
    const ref = asset.data.ref;
    const again = await p.saveAsset({ name: "改名.png", mime: "image/png", bytes: png });
    const dedup = again.ok && again.data.ref === ref;
    mark(dedup, `asset-dedup ${ref}`);
    const back = await p.readAsset(ref);
    const equalBytes =
      back.ok &&
      back.data.length === png.length &&
      back.data.every((v, i) => v === png[i]);
    mark(equalBytes, "asset-roundtrip");
    const url = assetDisplayUrl(ref);
    const protocolLoads = url !== "" && (await probeImageLoad(url));
    mark(protocolLoads, `asset-protocol-display ${url}`);
    if (!dedup || !equalBytes || !protocolLoads) {
      const abs = localAssetPath(getLocalAssetRoot(), ref);
      let blobLoads = false;
      try {
        const fs = await import("@tauri-apps/plugin-fs");
        const raw = await fs.readFile(abs!);
        blobLoads = await probeImageLoad(
          URL.createObjectURL(new Blob([raw as unknown as BlobPart], { type: "image/png" })),
        );
      } catch { /* 备选路径本身不可用 */ }
      await writeResultFile(
        `FAIL asset-chain: dedup=${dedup} roundtrip=${equalBytes} protocol=${protocolLoads} blob=${blobLoads} url=${url}`,
      );
      return false;
    }

    const del = await p.deleteProject(id);
    const gone = del.ok && !(await p.loadProject(id)).ok;
    mark(gone, "delete-cleanup");
    cleanup = null;

    // .axsp v2 桌面态实证：素材字节与演员表真的进包（内容寻址 → 包内路径即 ref）
    const seeded = await createProjectWithAsset(p);
    const packed = await exportProjectAsAxsp(p, seeded.projectId);
    if (!packed.ok) {
      await writeResultFile(`FAIL axsp-pack: ${JSON.stringify(packed.error)}`);
      return false;
    }
    const unpacked = unpackAxsp(packed.data);
    const carried =
      unpacked.ok &&
      Object.keys(unpacked.data.assets).includes(seeded.ref) &&
      Array.from(unpacked.data.assets[seeded.ref]!).every((v, i) => v === seeded.png[i]) &&
      unpacked.data.characters.some((c) => c.imagePath === seeded.ref);
    mark(carried, `axsp-v2-carries-media bytes=${packed.data.byteLength}`);
    if (!carried) {
      await writeResultFile(
        `FAIL axsp-v2-carries-media: ok=${unpacked.ok} refs=${unpacked.ok ? Object.keys(unpacked.data.assets).join(",") : "err"}`,
      );
      return false;
    }
    await p.deleteProject(seeded.projectId);

    // 角色域本地可用：M3 的 hooks 接线走的就是这条 Provider 路径（含归属范围隔离）
    const authorId = "smoke-author";
    const madeChar = await p.saveCharacter({
      id: "",
      name: "冒烟角色",
      characterData: { anchor: { name: "冒烟角色" } },
      imagePath: null,
      isPublic: false,
      authorId,
    });
    const mine = await p.listCharacters({ authorId });
    const others = await p.listCharacters({ authorId: "someone-else" });
    const charOk =
      madeChar.ok &&
      mine.ok &&
      mine.data.some((c) => c.id === madeChar.data.id) &&
      others.ok &&
      !others.data.some((c) => c.id === madeChar.data.id);
    mark(charOk, `character-domain mine=${mine.ok ? mine.data.length : "err"}`);
    if (!charOk) {
      await writeResultFile(
        `FAIL character-domain: made=${madeChar.ok} mine=${mine.ok ? mine.data.length : "err"}`,
      );
      return false;
    }

    console.log(`AXIFORGE-DESKTOP-STORAGE: PASS`);
    await writeResultFile(
      `PASS seed=${seed.status}${"imported" in seed ? `:${seed.imported}` : "reason" in seed ? `:${seed.reason}` : ""}`,
    );
    return true;
  } catch (e) {
    console.error("AXIFORGE-DESKTOP-STORAGE: FAIL exception", e);
    await writeResultFile(`FAIL exception: ${e instanceof Error ? e.message : String(e)}`);
    return false;
  } finally {
    if (cleanup) await cleanup();
  }
}
