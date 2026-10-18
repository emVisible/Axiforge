import { describe, expect, it } from "vitest";
import { COND_OP_RE, parseCondition, parseLiteral, printLiteral } from "./condition";
import { parseAxs } from "./parse";
import { printCondition } from "./print";

describe("parseLiteral / printLiteral", () => {
  it("round-trips primitives", () => {
    for (const v of [true, false, 42, 3.14, "hello", "bare_word"]) {
      expect(printLiteral(parseLiteral(printLiteral(v)))).toBe(printLiteral(v));
    }
  });
});

describe("parseCondition", () => {
  it("parses atom and group", () => {
    const atom = parseCondition("flag.trust == true");
    expect(atom).toEqual({
      type: "flag",
      key: "trust",
      operator: "eq",
      value: true,
    });

    const group = parseCondition("flag.a == 1 && memory.b != 2");
    expect(group).toEqual({
      type: "all",
      conditions: [
        { type: "flag", key: "a", operator: "eq", value: 1 },
        { type: "memory", key: "b", operator: "ne", value: 2 },
      ],
    });
  });

  it("parses relation condition and effect alias", () => {
    expect(parseCondition("relation.堰纱.玩家.trust == high")).toEqual({
      type: "relationship",
      key: "堰纱.玩家.trust",
      operator: "eq",
      value: "high",
    });
    expect(parseCondition("relationship.堰纱.玩家.trust contains high")).toEqual({
      type: "relationship",
      key: "堰纱.玩家.trust",
      operator: "contains",
      value: "high",
    });
    const doc = parseAxs(`# 开场
@relationship 堰纱.玩家.trust = 10`);
    expect(doc.beats[0]!.effects).toEqual([
      { type: "relationship", key: "堰纱.玩家.trust", value: 10 },
    ]);
  });
});

describe("条件运算符集合与文档/求值三方对齐（#82）", () => {
  it("文档承诺的 >= 与 <= 必须映射成独立语义，不能被静默降成 eq", () => {
    expect(parseCondition("memory.score >= 10")).toEqual({
      type: "memory",
      key: "score",
      operator: "gte",
      value: 10,
    });
    expect(parseCondition("memory.score <= 10")).toEqual({
      type: "memory",
      key: "score",
      operator: "lte",
      value: 10,
    });
  });

  it("打印侧原样回到 >=，回写不改作者语义", () => {
    expect(printCondition(parseCondition("memory.score >= 10")!)).toBe(
      "memory.score >= 10",
    );
    expect(printCondition(parseCondition("flag.trust <= 3 && memory.x > 1")!)).toBe(
      "flag.trust <= 3 && memory.x > 1",
    );
  });
});

describe("词法记号表与映射表不许各自漂移（把 #82 的成因做成不变量）", () => {
  const lexed = COND_OP_RE.source.match(/^\((.*?)\)/)![1]!.split("|");
  const parsed = lexed.map((op) => {
    const cond = parseCondition(`flag.a ${op} 1`);
    return cond && "operator" in cond ? cond.operator : null;
  });

  it("每个被词法认得的记号都必须在映射表、两端求值与文档里有落点", () => {
    // 这两行 toEqual 是真正的那根绊线：往 COND_OP_RE 加记号而没同步 OP_MAP / core+Python 求值 / OP_PRINT / 用户文档，
    // 这里就会红并点名缺位。旧版 `?? "eq"` 兜底下同样的漂移会静默通过（`>=` 就是这么变成 `==` 的）。
    expect(lexed).toEqual(["==", "!=", ">=", "<=", ">", "<", "contains"]);
    expect(parsed).toEqual(["eq", "ne", "gte", "lte", "gt", "lt", "contains"]);
  });
});
