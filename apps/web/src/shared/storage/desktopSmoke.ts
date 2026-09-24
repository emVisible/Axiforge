/**
 * 桌面存储冒烟（仅 DEV + Tauri 环境自动运行）。
 * 验证链路：plugin-sql → TauriSqlBackend → SqliteStorageProvider → 契约关键语义。
 * 输出可 grep 标记：AXIFORGE-DESKTOP-STORAGE: PASS / FAIL <步骤>
 */
import { bundleToCompilerInput, createStorageProvider } from "./index";
import { assetDisplayUrl, getLocalAssetRoot } from "./assetContext";
import { localAssetPath } from "@axiforge/editor-core";
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

export async function smokeDesktopStorage(): Promise<boolean> {
  let cleanup: (() => Promise<void>) | null = null;
  const mark = (ok: boolean, step: string) => {
    console.log(`AXIFORGE-DESKTOP-STORAGE: ${ok ? "OK" : "FAIL"} ${step}`);
    if (!ok) void writeResultFile(`FAIL ${step}`);
  };
  try {
    const p = await createStorageProvider();
    mark(true, "provider-init");

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

    console.log(`AXIFORGE-DESKTOP-STORAGE: PASS`);
    await writeResultFile("PASS");
    return true;
  } catch (e) {
    console.error("AXIFORGE-DESKTOP-STORAGE: FAIL exception", e);
    await writeResultFile(`FAIL exception: ${e instanceof Error ? e.message : String(e)}`);
    return false;
  } finally {
    if (cleanup) await cleanup();
  }
}
