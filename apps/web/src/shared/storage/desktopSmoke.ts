/**
 * 桌面存储冒烟（仅 DEV + Tauri 环境自动运行）。
 * 验证链路：plugin-sql → TauriSqlBackend → SqliteStorageProvider → 契约关键语义。
 * 输出可 grep 标记：AXIFORGE-DESKTOP-STORAGE: PASS / FAIL <步骤>
 */
import { bundleToCompilerInput, createStorageProvider } from "./index";
import { compileStory } from "@axiforge/core";

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
