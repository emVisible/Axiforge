import { expect, test, type Page } from "@playwright/test";
import {
  addNode,
  createProject,
  E2E_TAG,
  getProject,
  replaceEdges,
  updateNode,
} from "./helpers";

/**
 * E1–E6 行为基线（Phase 1a，宪章 G3）。
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
