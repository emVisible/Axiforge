import { readdirSync, readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { CREATOR_ID_KEY } from "./creatorId";
import { PLAYER_TOKEN_KEY } from "./playerToken";

/**
 * 身份键的字面量只许活在权威模块里（第七十二批：`identityLink` 四处 + `UserContext` 四处手抄已收拢）。
 * 这条不是形式主义：谁再把字符串抄回调用方，改名时就会只改一处——
 * 后果是登录/恢复身份写进孤儿 key，而 `getCreatorId()` 读新 key 铸出一个全新身份，
 * 整个本地作品库按 `author_id` 变得不可见，且界面上没有任何错误。
 *
 * 判据的**模式从真相源取**（运行时 import 那两个常量），所以这个文件自己不含那两串字面量，
 * 也就不会被自己的注释或字符串喂饱；权威模块自身与 `*.test.*` 除外。
 * 面：`apps/web/src`（`packages/*` 与 `backend` 此前按 grep 量过＝0 命中，不在这条的管辖面内）。
 */
const SRC_DIR = fileURLToPath(new URL("../..", import.meta.url)).replace(/\/$/, "");
/** 按**整路径**豁免，不按 basename——同名文件遍布界面层时 basename 会误配（在册教训）。 */
const AUTHORITY_FILES = new Set([
  `${SRC_DIR}/shared/lib/creatorId.ts`,
  `${SRC_DIR}/shared/lib/playerToken.ts`,
]);

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = `${dir}/${name}`;
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(ts|tsx)$/.test(name) && !/\.(test)\.(ts|tsx)$/.test(name)) out.push(full);
  }
  return out;
}

describe("身份键字面量的唯一权威", () => {
  it("除权威模块外，`apps/web/src` 里不许再出现这两串键名", () => {
    const offenders: string[] = [];
    for (const file of walk(SRC_DIR)) {
      if (AUTHORITY_FILES.has(file)) continue;
      const text = readFileSync(file, "utf8");
      if (text.includes(CREATOR_ID_KEY) || text.includes(PLAYER_TOKEN_KEY)) {
        offenders.push(file.split("/src/")[1]);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("对照位：扫描面本身非空（路径断了 walk 会返回 0 个文件，上面那条就退化成恒真）", () => {
    // 实测 `apps/web/src` 下非测试的 .ts/.tsx 为 255 个；这里取 200 作地板，
    // 只挡"面塌陷"，不挡正常增删文件。
    expect(walk(SRC_DIR).length).toBeGreaterThanOrEqual(200);
  });

  it("对照位：权威模块自己确实带着这两串（否则上面那条会退化成恒真）", () => {
    const creator = readFileSync(`${SRC_DIR}/shared/lib/creatorId.ts`, "utf8");
    const token = readFileSync(`${SRC_DIR}/shared/lib/playerToken.ts`, "utf8");
    expect(creator.includes(CREATOR_ID_KEY)).toBe(true);
    expect(token.includes(PLAYER_TOKEN_KEY)).toBe(true);
  });
});
