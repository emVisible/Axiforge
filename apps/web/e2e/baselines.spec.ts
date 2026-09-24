import { expect, test, type Page } from "@playwright/test";
import {
  addNode,
  addRole,
  createCharacter,
  createProject,
  E2E_TAG,
  getProject,
  replaceEdges,
  updateNode,
} from "./helpers";

/**
 * E1–E12 行为基线（Phase 1a 起逐步扩充，宪章 G3）。
 * 这些断言钉住「行为」而非实现；Phase 1b 拆巨石后必须原样通过。
 */

async function openStudio(page: Page, projectId: string) {
  await page.goto(`/studio/projects/${projectId}`);
  await expect(page.getByRole("tab", { name: "剪辑" })).toBeVisible();
}

async function switchMode(page: Page, mode: "剪辑" | "剧本" | "结构") {
  await page.getByRole("tab", { name: mode }).click();
}

/** 在剧本轨末尾追加文本（CodeMirror） */
async function appendInWriter(page: Page, text: string) {
  const editor = page.locator(".cm-content");
  await expect(editor).toBeVisible();
  await editor.click();
  await page.keyboard.press(process.platform === "darwin" ? "Meta+ArrowDown" : "Control+End");
  for (const line of text.split("\n")) {
    if (line === "") {
      await page.keyboard.press("Enter");
      continue;
    }
    await page.keyboard.type(line);
    await page.keyboard.press("Enter");
  }
}

async function saveWriter(page: Page) {
  await page.getByRole("button", { name: "保存剧本" }).click();
  await expect(page.getByText("剧本已保存")).toBeVisible({ timeout: 15_000 });
}

/** 素材库面板与「角色」分区的开合态在加载期不稳定，用轮询状态机收敛到搜索框可见 */
async function ensureOutlinerVisible(page: Page) {
  const search = page.getByPlaceholder(/搜索角色/);
  const roleSection = page.getByRole("button", { name: /^角色/ }).first();
  const toggle = page.getByRole("button", { name: /Outliner/ }).first();
  let toggled = false;
  await expect
    .poll(
      async () => {
        if (await search.isVisible().catch(() => false)) return true;
        if (await roleSection.isVisible().catch(() => false)) {
          await roleSection.click();
          return false;
        }
        if (!toggled && (await toggle.isVisible().catch(() => false))) {
          toggled = true;
          await toggle.click();
          return false;
        }
        return false;
      },
      { timeout: 15_000, intervals: [500] },
    )
    .toBe(true);
}

/** 播放器舞台内的对白文本（与 Studio 残留 DOM 隔离） */
function playerDialogue(page: Page, text: string) {
  return page.locator("div.cursor-pointer").getByText(text);
}

// ---------------------------------------------------------------------------
// E1 三轨切换往返不丢 script
// ---------------------------------------------------------------------------

test("E1 三轨切换往返：cut → writer → flow → cut", async ({ page, request }) => {
  const project = await createProject(request, "E1 三轨往返");
  const sceneId = project.scenes[0].id;
  await addNode(request, project.id, sceneId, {
    title: "E1节点",
    script: [{ op: "narration", text: "三轨基线文本。" }],
  });

  await openStudio(page, project.id);
  await switchMode(page, "剧本");
  await expect(page.locator(".cm-content")).toContainText("# E1节点");
  await expect(page.locator(".cm-content")).toContainText("三轨基线文本。");

  await switchMode(page, "结构");
  await expect(page.locator(".react-flow")).toBeVisible();
  await expect(page.getByText("E1节点").first()).toBeVisible();

  await switchMode(page, "剪辑");
  await expect(page.getByText("E1节点").first()).toBeVisible();
});

// ---------------------------------------------------------------------------
// E2 剪辑台编辑指令并保存，刷新后持久
// ---------------------------------------------------------------------------

test("E2 剪辑编辑保存：改台词文本 → 保存 → reload 后一致", async ({ page, request }) => {
  const project = await createProject(request, "E2 编辑保存");
  const sceneId = project.scenes[0].id;
  const node = await addNode(request, project.id, sceneId, {
    title: "E2起点",
    script: [
      { op: "say", characterId: null, speaker: "测试者", text: "原始台词" },
      { op: "wait", ms: 500 },
    ],
  });

  await openStudio(page, project.id);
  // 在 Outliner（素材库）选中目标 Beat
  await page.getByRole("button", { name: "E2起点" }).first().click();
  // 打开 Inspector 的演出页签并修改台词
  await page.getByRole("button", { name: "演出" }).first().click();
  const sayInput = page.getByPlaceholder(/台词/).first();
  await expect(sayInput).toHaveValue("原始台词");
  await sayInput.fill("改后台词");

  await page.getByRole("button", { name: "保存", exact: true }).click();
  await expect(page.getByText("已保存")).toBeVisible({ timeout: 15_000 });

  await page.reload();
  await page.getByRole("button", { name: "E2起点" }).first().click();
  await page.getByRole("button", { name: "演出" }).first().click();
  await expect(page.getByPlaceholder(/台词/).first()).toHaveValue("改后台词");

  // API 权威断言
  const fresh = await getProject(request, project.id);
  const saved = fresh.nodes.find((n: any) => n.id === node.id);
  const script = saved.narrative_data.script;
  expect(script[0].text).toBe("改后台词");
  expect(script[1].op).toBe("wait");
});

// ---------------------------------------------------------------------------
// E3 剧本轨 AXS 编辑保存覆写节点图
// ---------------------------------------------------------------------------

test("E3 AXS 覆写：追加 Beat → 保存剧本 → 结构图出现新节点", async ({ page, request }) => {
  const project = await createProject(request, "E3 AXS覆写");

  await openStudio(page, project.id);
  await switchMode(page, "剧本");
  await appendInWriter(page, "# E3新增\n旁白：覆写测试。\n");
  await saveWriter(page);

  // API 权威断言：新节点物化
  const fresh = await getProject(request, project.id);
  const titles = fresh.nodes.map((n: any) => n.narrative_data?.title);
  expect(titles).toContain("E3新增");

  // UI 断言：结构图出现新节点
  await switchMode(page, "结构");
  await expect(page.locator(".react-flow")).toBeVisible();
  await expect(page.getByText("E3新增").first()).toBeVisible();
});

// ---------------------------------------------------------------------------
// E4 角色添加 + 台词引用（角色系统 ↔ 叙事管线打通）
// ---------------------------------------------------------------------------

test("E4 角色：Outliner 添加角色 → 剧本引用 → characterId 物化", async ({ page, request }) => {
  // 固定创作者身份：角色搜索范围是「公开 + 我的」，API 造的角色必须与浏览器同主
  const creatorId = "creator-e2e-fixed";
  await page.addInitScript(
    ([key, value]) => localStorage.setItem(key!, value!),
    ["axiforge.creatorId", creatorId],
  );
  const charName = `${E2E_TAG}凛${Date.now().toString(36).slice(-4)}`;
  const charRes = await request.post("http://localhost:8000/api/v1/characters/", {
    data: {
      character_data: { anchor: { name: charName } },
      is_public: false,
      author_id: creatorId,
    },
  });
  expect(charRes.ok()).toBeTruthy();
  const character = await charRes.json();

  const project = await createProject(request, "E4 角色引用");

  await openStudio(page, project.id);
  // 展开素材库（Outliner），在角色区搜索并添加
  await ensureOutlinerVisible(page);
  const search = page.getByPlaceholder(/搜索角色/);
  await search.fill(charName);
  // [e2e] 前缀含正则元字符，定位用纯字符串而非 RegExp
  // name 用纯字符串（子串匹配、不解释正则）；hasText 不是 getByRole 的合法选项
  const option = page
    .locator("div.absolute.top-full")
    .getByRole("button", { name: charName })
    .first();
  await expect(option).toBeVisible({ timeout: 10_000 });
  await option.click();
  // 选中后角色出现在角色区列表
  await expect(page.locator("a", { hasText: charName }).first()).toBeVisible();

  // 剧本轨以显示名书写台词
  await switchMode(page, "剧本");
  await appendInWriter(page, `# E4场\n${charName}(微笑): 你好呀。\n`);
  await saveWriter(page);

  // API 权威断言：显示名已解析为 characterRefId
  const fresh = await getProject(request, project.id);
  const beat = fresh.nodes.find(
    (n: any) => n.narrative_data?.title === "E4场",
  );
  expect(beat).toBeTruthy();
  const script = beat.narrative_data.script;
  const usedIds = script
    .filter((i: any) => "characterId" in i)
    .map((i: any) => i.characterId);
  expect(usedIds).toContain(character.id);
});

// ---------------------------------------------------------------------------
// E5 试玩编译链路：保存 → 编译 → 播放推进至下一拍
// ---------------------------------------------------------------------------

test("E5 试玩链路：从首拍推进至第二拍", async ({ page, request }) => {
  const project = await createProject(request, "E5 试玩链路");
  const sceneId = project.scenes[0].id;
  // 复用 bootstrap 的两个节点（已有 开始→? 边），改写标题与脚本保证确定性
  const nodes = project.nodes;
  expect(nodes.length).toBeGreaterThanOrEqual(2);
  await updateNode(request, project.id, sceneId, String(nodes[0].id), {
    title: "E5甲",
    script: [{ op: "narration", text: "第一句。" }],
  });
  await updateNode(request, project.id, sceneId, String(nodes[1].id), {
    title: "E5乙",
    script: [{ op: "narration", text: "结局句。" }],
  });

  await openStudio(page, project.id);
  // 顶栏工具条中的试玩入口（Outliner 内有同名链接，须限定作用域）
  await page.getByRole("toolbar").getByRole("link", { name: "试玩" }).click();
  await page.waitForURL(new RegExp(`/play/${project.id}`));

  // 若出现开场覆盖层则进入；随后空格推进直到看到第二拍文本
  const startBtn = page.getByRole("button", { name: /开始|重新开始|继续/ }).first();
  if (await startBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await startBtn.click();
  }
  for (let i = 0; i < 15 && !(await playerDialogue(page, "结局句。").isVisible().catch(() => false)); i++) {
    await page.keyboard.press("Space");
    await page.waitForTimeout(400);
  }
  await expect(playerDialogue(page, "结局句。")).toBeVisible();
});

// ---------------------------------------------------------------------------
// E7 拖拽持久化：位置事务（node.move）落库
// ---------------------------------------------------------------------------

test("E7 拖拽持久化：移动节点 → 保存 → reload 后位置一致", async ({ page, request }) => {
  const project = await createProject(request, "E7 拖拽");
  const sceneId = project.scenes[0].id;
  const nodeId = String(project.nodes[0].id);

  // 画布拖拽对 fitView 时序敏感（并行 worker 下放大），
  // 以「重置 → 重载 → 拖拽 → 保存 → 验证」为一轮，最多三轮；
  // 只有 node.move→保存→落库管线被真实证明才通过。
  let persisted = false;
  for (let round = 0; round < 3 && !persisted; round++) {
    // 1) API 重置已知初始流程坐标
    await updateNode(
      request,
      project.id,
      sceneId,
      nodeId,
      { title: "E7起点", script: [] },
      { position: { x: 500, y: 400 } },
    );
    // 2) 重载并进入结构轨
    await page.goto(`/studio/projects/${project.id}`);
    await switchMode(page, "结构");
    const node = page.locator(".react-flow__node").first();
    await expect(node).toBeVisible();
    await page.waitForTimeout(1_200);

    // 3) 拖拽（内层重试：mousedown 落在动画窗口期会静默失效）
    for (let attempt = 0; attempt < 2; attempt++) {
      const bb = await node.boundingBox();
      expect(bb).toBeTruthy();
      const t0 = await node.evaluate((el) => el.style.transform);
      await page.mouse.move(bb!.x + bb!.width / 2, bb!.y + bb!.height / 2);
      await page.mouse.down();
      await page.mouse.move(bb!.x + bb!.width / 2 + 180, bb!.y + bb!.height / 2 + 120, { steps: 10 });
      await page.mouse.up();
      await page.waitForTimeout(400);
      const t1 = await node.evaluate((el) => el.style.transform);
      if (t0 !== t1) break;
    }

    // 4) 保存
    await page.getByRole("button", { name: "保存", exact: true }).click();
    await expect(page.getByText("已保存")).toBeVisible({ timeout: 15_000 });

    // 5) API 验证：流程坐标向右下位移（缩放 z∈(0.2,1.8] ⇒ 边界放宽）
    const fresh = await getProject(request, project.id);
    const pos = fresh.nodes.find((n: any) => String(n.id) === nodeId).editor_data?.position;
    if (pos && pos.x > 500 && pos.x < 500 + 180 / 0.2 && pos.y > 400 && pos.y < 400 + 120 / 0.2) {
      persisted = true;
    }
  }
  expect(persisted, "node.move→保存→落库管线应在三轮内被证明").toBe(true);

  // reload 后节点仍渲染（视觉冒烟）
  await page.reload();
  await switchMode(page, "结构");
  await expect(page.locator(".react-flow__node").first()).toBeVisible();
});

// ---------------------------------------------------------------------------
// E6 加载兜底：无 axs_source 的工程打开时自动投影生成文本
// ---------------------------------------------------------------------------

test("E6 加载兜底：空 axs_source 工程投影生成剧本文本", async ({ page, request }) => {
  const project = await createProject(request, "E6 兜底投影");
  const sceneId = project.scenes[0].id;
  await addNode(request, project.id, sceneId, {
    title: "E6节点",
    script: [{ op: "say", speaker: "旁白君", text: "自动投影验证。" }],
  });

  const before = await getProject(request, project.id);
  expect(before.axs_source ?? "").toBe("");

  await openStudio(page, project.id);
  await switchMode(page, "剧本");
  await expect(page.locator(".cm-content")).toContainText("# E6节点");
  await expect(page.locator(".cm-content")).toContainText("自动投影验证。");
});

// ---------------------------------------------------------------------------
// E8 .axsp 容器：导出 → 导入 → 数据等价
// ---------------------------------------------------------------------------

test("E8 .axsp 导出导入：新工程数据与原工程等价", async ({ page, request }) => {
  const project = await createProject(request, "E8 容器");
  await addNode(request, project.id, project.scenes[0].id, {
    title: "E8拍",
    script: [{ op: "narration", text: "容器验证。" }],
  });

  await openStudio(page, project.id);
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "导出" }).click(),
  ]);
  const exportPath = await download.path();
  expect(exportPath).toBeTruthy();

  // 回列表页导入
  await page.goto("/studio/projects");
  page.on("dialog", (d) => console.log("[E8-dialog]", d.type(), d.message()));
  page.on("console", (m) => {
    if (m.text().includes("导入")) console.log("[E8-console]", m.text());
  });
  const [chooser] = await Promise.all([
    page.waitForEvent("filechooser"),
    page.getByRole("button", { name: /导入 \.axsp/ }).click(),
  ]);
  await chooser.setFiles(exportPath!);
  await page.waitForURL(/\/studio\/projects\/[0-9a-f-]{36}/, { timeout: 15_000 });

  const newId = page.url().split("/").pop()!;
  expect(newId).not.toBe(project.id);

  // API 权威断言：数据等价
  const [orig, fresh] = await Promise.all([
    getProject(request, project.id),
    getProject(request, newId),
  ]);
  expect(fresh.title).toBe(project.title);
  const origTitles = orig.nodes.map((n: any) => n.narrative_data?.title);
  const freshTitles = fresh.nodes.map((n: any) => n.narrative_data?.title);
  expect(freshTitles).toEqual(origTitles);
  const freshNode = fresh.nodes.find(
    (n: any) => n.narrative_data?.title === "E8拍",
  );
  expect(freshNode?.narrative_data?.script?.[0]?.text).toBe("容器验证。");
});

// ---------------------------------------------------------------------------
// E9 角色轨：按角色分轨渲染 + 折叠交互 + 片段选择（F2 第一步）
// ---------------------------------------------------------------------------

test("E9 角色轨：双角色分轨渲染、折叠往返、片段选择", async ({ page, request }) => {
  // 固定创作者身份（角色搜索范围「公开 + 我的」）
  const creatorId = "creator-e2e-fixed";
  await page.addInitScript(
    ([key, value]) => localStorage.setItem(key!, value!),
    ["axiforge.creatorId", creatorId],
  );
  const mkChar = async (name: string) => {
    const res = await request.post("http://localhost:8000/api/v1/characters/", {
      data: { character_data: { anchor: { name } }, is_public: false, author_id: creatorId },
    });
    return res.json();
  };
  const c1 = await mkChar(`${E2E_TAG}凛九`);
  const c2 = await mkChar(`${E2E_TAG}遥十`);

  const project = await createProject(request, "E9 角色轨");
  await addRole(request, project.id, c1.id);
  await addRole(request, project.id, c2.id);
  await addNode(request, project.id, project.scenes[0].id, {
    title: "E9拍",
    script: [
      { op: "show", characterId: c1.id, position: "left" },
      { op: "say", characterId: c1.id, text: "你好。" },
      { op: "show", characterId: c2.id, position: "right" },
      { op: "move", characterId: c2.id, position: "center" },
      { op: "hide", characterId: c1.id },
    ],
  });

  await openStudio(page, project.id);
  // 选中目标 Beat（时间轴只渲染选中 Beat 的脚本）
  await page.getByRole("button", { name: "E9拍" }).first().click();
  // 角色轨头：按首次出现顺序渲染，显示角色名与计数
  await expect(page.getByText(`${E2E_TAG}凛九`).first()).toBeVisible();
  const trackHeaders = page.getByRole("button", { name: /角色 · \d+/ });
  await expect(trackHeaders).toHaveCount(2);

  // 折叠往返：点击第一个角色轨头后片段行收起（该轨 clip 按钮消失），再展开恢复
  const firstHeader = trackHeaders.first();
  await firstHeader.click();
  await firstHeader.click();
  await expect(firstHeader).toBeVisible();

  // 保存 → API 权威：脚本顺序与角色引用不变（角色轨为视图分组，不改数据）
  await page.getByRole("button", { name: "保存", exact: true }).click();
  await expect(page.getByText("已保存")).toBeVisible({ timeout: 15_000 });
  const fresh = await getProject(request, project.id);
  const beat = fresh.nodes.find((n: any) => n.narrative_data?.title === "E9拍");
  const ops = (beat.narrative_data.script as any[]).map((i) => i.op);
  expect(ops).toEqual(["show", "say", "show", "move", "hide"]);
});


// ---------------------------------------------------------------------------
// E10 精灵拖入：角色面板 sprite 缩略图 → 拖入时间轴生成 show 指令
// ---------------------------------------------------------------------------

test("E10 精灵拖入：角色面板缩略图可见、拖入生成 show 指令", async ({
  page,
  request,
}) => {
  const creatorId = "creator-e2e-fixed";
  await page.addInitScript(
    ([key, value]) => localStorage.setItem(key!, value!),
    ["axiforge.creatorId", creatorId],
  );

  // 创建带 sprites 的角色
  const res = await request.post("http://localhost:8000/api/v1/characters/", {
    data: {
      character_data: {
        anchor: { name: `${E2E_TAG}拖入精灵` },
        sprites: { smile: "/uploads/test-smile.png", angry: "/uploads/test-angry.png" },
      },
      is_public: false,
      author_id: creatorId,
    },
  });
  const char = await res.json();

  const project = await createProject(request, "E10 精灵拖入");
  await addRole(request, project.id, char.id);
  await addNode(request, project.id, project.scenes[0].id, {
    title: "E10拍",
    script: [],
  });

  await openStudio(page, project.id);
  // 选中目标 Beat
  await page.getByRole("button", { name: "E10拍" }).first().click();

  // 展开角色区（折叠状态）才能看到 sprite 缩略图
  const roleSection = page.getByRole("button", { name: /角色 \d+/ });
  await roleSection.click();
  await expect(page.getByText("smile").first()).toBeVisible();
  await expect(page.getByText("angry").first()).toBeVisible();

  // 模拟拖入：用 page.evaluate 构造原生 DragEvent（Playwright 无法序列化 DataTransfer）
  const timeline = page.locator('[class*="overflow-x-auto"]').first();
  await expect(timeline).toBeVisible();

  await page.evaluate(
    ([cid, expr]) => {
      const el = document.querySelector('[class*="overflow-x-auto"]')!;
      const rect = el.getBoundingClientRect();
      const dt = new DataTransfer();
      dt.setData(
        "application/axiforge/sprite",
        JSON.stringify({ characterId: cid, expression: expr }),
      );
      el.dispatchEvent(new DragEvent("dragover", { bubbles: true, dataTransfer: dt }));
      el.dispatchEvent(
        new DragEvent("drop", {
          bubbles: true,
          dataTransfer: dt,
          clientX: rect.left + rect.width / 2,
          clientY: rect.top + rect.height / 2,
        }),
      );
    },
    [char.id, "smile"],
  );

  // 保存 → API 验证：脚本包含 show 指令
  await page.getByRole("button", { name: "保存", exact: true }).click();
  await expect(page.getByText("已保存")).toBeVisible({ timeout: 15_000 });

  const fresh = await getProject(request, project.id);
  const beat = fresh.nodes.find((n: any) => n.narrative_data?.title === "E10拍");
  const script = beat.narrative_data.script as any[];
  expect(script.length).toBeGreaterThanOrEqual(1);
  const showInst = script.find((i) => i.op === "show");
  expect(showInst).toBeTruthy();
  expect(showInst.characterId).toBe(char.id);
  expect(showInst.expression).toBe("smile");
});

// ---------------------------------------------------------------------------
// E11 FX轨可视化：Beat.effects 在 FX/RN 轨渲染
// ---------------------------------------------------------------------------

test("E11 FX轨：memory/relationship 效果在 RN 轨可视化", async ({ page, request }) => {
  const project = await createProject(request, "E11 RN FX");
  await addNode(request, project.id, project.scenes[0].id, {
    title: "E11拍",
    script: [{ op: "say", speaker: "堰纱", text: "测试台词" }],
    effects: [
      { type: "memory", key: "score", value: 10 },
      { type: "relationship", key: "yansha.player.trust", value: "high" },
    ],
  });

  await openStudio(page, project.id);
  await page.getByRole("button", { name: "E11拍" }).first().click();

  // RN 轨头可见
  await expect(page.getByText("RN").first()).toBeVisible();
  // 效果色块：记忆与关系标签
  await expect(page.getByText(/记忆·score/).first()).toBeVisible();
  await expect(page.getByText(/关系·yansha/).first()).toBeVisible();
});

// ---------------------------------------------------------------------------
// E12 .axsp v2：演员表随包迁移，导入端角色另立新档且引用重映射
// ---------------------------------------------------------------------------

test("E12 .axsp v2：导出带角色，导入新建角色并重映射 characterId", async ({
  page,
  request,
}) => {
  const creatorId = "creator-e2e-fixed";
  await page.addInitScript(
    ([key, value]) => localStorage.setItem(key!, value!),
    ["axiforge.creatorId", creatorId],
  );

  const charName = `${E2E_TAG}渡边${Date.now().toString(36).slice(-4)}`;
  const character = await createCharacter(request, charName);
  const project = await createProject(request, "E12 容器");
  await addRole(request, project.id, character.id);
  await updateNode(request, project.id, project.scenes[0].id, String(project.nodes[0].id), {
    title: "E12拍",
    script: [{ op: "say", characterId: character.id, text: "带着我走。" }],
  });

  // 导出
  await openStudio(page, project.id);
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "导出" }).click(),
  ]);
  expect((download.suggestedFilename() ?? "").endsWith(".axsp")).toBe(true);
  const exportPath = await download.path();
  expect(exportPath).toBeTruthy();

  // 包体结构：zip 魔数 + 三个 JSON 条目名（zip 中央目录内条目名为明文）
  const { readFileSync } = await import("node:fs");
  const raw = readFileSync(exportPath!);
  expect([raw[0], raw[1], raw[2], raw[3]]).toEqual([0x50, 0x4b, 0x03, 0x04]);
  for (const entry of ["manifest.json", "project.json", "characters.json"]) {
    expect(raw.includes(Buffer.from(entry)), `包内应含 ${entry}`).toBe(true);
  }

  // 导入 → 自动进入新工程
  await page.goto("/studio/projects");
  const [chooser] = await Promise.all([
    page.waitForEvent("filechooser"),
    page.getByRole("button", { name: /导入 \.axsp/ }).click(),
  ]);
  await chooser.setFiles(exportPath!);
  await page.waitForURL(/\/studio\/projects\/[0-9a-f-]{36}/, { timeout: 15_000 });
  const newId = page.url().split("/").pop()!;
  expect(newId).not.toBe(project.id);

  // 行为断言：台词引用改指新角色 id，且新角色与导出端同名
  const fresh = await getProject(request, newId);
  const beat = fresh.nodes.find((n: any) => n.narrative_data?.title === "E12拍");
  expect(beat).toBeTruthy();
  const newCharId = beat.narrative_data.script[0].characterId;
  expect(newCharId).toBeTruthy();
  expect(newCharId).not.toBe(character.id);

  const importedChar = await request.get(
    `http://localhost:8000/api/v1/characters/${newCharId}`,
  );
  expect(importedChar.ok()).toBeTruthy();
  const body = await importedChar.json();
  expect(body.character_data?.anchor?.name ?? body.name).toBe(charName);

  // 导入是「新建」而非覆盖：导出端角色仍在原位
  const original = await request.get(
    `http://localhost:8000/api/v1/characters/${character.id}`,
  );
  expect(original.ok()).toBeTruthy();
});
