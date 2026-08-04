/**
 * `tools/guide-core.ts` 자기시험.
 *
 * 보는 것은 "정상 입력이 통과하는가"가 아니라 **어긋난 입력이 실제로 걸리는가**다. 추출기가
 * 조용히 넘어가면 가이드 코드는 다시 무검증으로 남고, 그것이 이 도구가 막으려는 결함이다.
 */

import { expect, test } from "bun:test";
import {
  dedent,
  extract,
  GuideCoreError,
  parseFences,
  parseRegions,
  stripInstrumentation,
} from "./guide-core.ts";

const REFERENCE = [
  "/** 헤더 주석. 구간 밖이므로 추출되지 않는다. */",
  "// #region guide:core/types",
  "type Comparator<T> = (a: T, b: T) => number;",
  "// #endregion",
  "",
  "// #region guide:core/class",
  "export class Box<T> {",
  "  #items: T[] = [];",
  "",
  "  /** 축3 계측(§규약2). 계약이 아니라 정본의 의무다. */",
  "  __cost = 0;",
  "",
  "  put(item: T): void {",
  "    this.__cost += 1;",
  "    this.#items.push(item);",
  "  }",
  "}",
  "// #endregion",
].join("\n");

test("구간 밖은 추출되지 않는다", () => {
  const out = extract(REFERENCE, "ref.ts");
  expect(out).not.toContain("헤더 주석");
});

test("계측은 필드·증가문·붙은 주석까지 함께 걷힌다", () => {
  const out = extract(REFERENCE, "ref.ts", "class");
  expect(out).not.toContain("__cost");
  expect(out).not.toContain("축3 계측");
  expect(out).toContain("this.#items.push(item);");
});

test("이름 없는 추출은 전 구간을 등장 순서로 잇는다", () => {
  const out = extract(REFERENCE, "ref.ts");
  expect(out.indexOf("type Comparator")).toBeLessThan(out.indexOf("class Box"));
});

test("이름을 주면 그 구간만 나온다", () => {
  expect(extract(REFERENCE, "ref.ts", "types")).not.toContain("class Box");
});

test("없는 구간 이름은 오류다", () => {
  expect(() => extract(REFERENCE, "ref.ts", "nope")).toThrow(GuideCoreError);
});

test("구간이 없는 정본은 오류다", () => {
  expect(() => extract("export const x = 1;\n", "ref.ts")).toThrow(
    GuideCoreError,
  );
});

test("닫히지 않은 구간은 오류다", () => {
  expect(() =>
    parseRegions("// #region guide:core\nconst a = 1;\n", "ref.ts"),
  ).toThrow(GuideCoreError);
});

test("중첩된 구간은 오류다", () => {
  const nested = [
    "// #region guide:core/a",
    "// #region guide:core/b",
    "// #endregion",
    "// #endregion",
  ].join("\n");
  expect(() => parseRegions(nested, "ref.ts")).toThrow(GuideCoreError);
});

test("구간 이름이 겹치면 오류다", () => {
  const twice = [
    "// #region guide:core/a",
    "const x = 1;",
    "// #endregion",
    "// #region guide:core/a",
    "const y = 2;",
    "// #endregion",
  ].join("\n");
  expect(() => parseRegions(twice, "ref.ts")).toThrow(GuideCoreError);
});

test("guide:core 가 아닌 #region 은 구간이 아니다", () => {
  const other = ["// #region 접기용", "const x = 1;", "// #endregion"].join(
    "\n",
  );
  expect(parseRegions(other, "ref.ts")).toHaveLength(0);
});

test("공통 들여쓰기만 벗기고 상대 들여쓰기는 지킨다", () => {
  expect(dedent(["    a", "      b", "", "    c"])).toEqual([
    "a",
    "  b",
    "",
    "c",
  ]);
});

test("계측 줄 위의 코드 줄은 지우지 않는다", () => {
  const kept = stripInstrumentation([
    "const before = 1;",
    "this.__cost += 1;",
    "const after = 2;",
  ]);
  expect(kept).toEqual(["const before = 1;", "const after = 2;"]);
});

// ─── 펜스 대조 ──────────────────────────────────────────────────────────────

const GUIDE_OK = [
  "본문 앞.",
  "",
  "```ts guide-core=ref.ts#types",
  "type Comparator<T> = (a: T, b: T) => number;",
  "```",
  "",
  "본문 뒤.",
].join("\n");

test("펜스는 대상·구간이름·본문을 읽어 온다", () => {
  const fences = parseFences(GUIDE_OK, "g.mdx");
  expect(fences).toHaveLength(1);
  expect(fences[0]?.target).toBe("ref.ts");
  expect(fences[0]?.name).toBe("types");
  expect(fences[0]?.body).toBe("type Comparator<T> = (a: T, b: T) => number;");
});

test("일치하는 펜스는 추출본과 같다", () => {
  const fence = parseFences(GUIDE_OK, "g.mdx")[0];
  expect(fence?.body).toBe(extract(REFERENCE, "ref.ts", "types"));
});

test("한 글자만 달라도 추출본과 어긋난다", () => {
  const drifted = GUIDE_OK.replace("Comparator", "Compare");
  const fence = parseFences(drifted, "g.mdx")[0];
  expect(fence?.body).not.toBe(extract(REFERENCE, "ref.ts", "types"));
});

test("계측을 되살려 적은 펜스도 어긋난다", () => {
  const guide = [
    "```ts guide-core=ref.ts#class",
    "export class Box<T> {",
    "  __cost = 0;",
    "}",
    "```",
  ].join("\n");
  const fence = parseFences(guide, "g.mdx")[0];
  expect(fence?.body).not.toBe(extract(REFERENCE, "ref.ts", "class"));
});

test("닫히지 않은 펜스는 오류다", () => {
  expect(() =>
    parseFences("```ts guide-core=ref.ts\nconst a = 1;\n", "g.mdx"),
  ).toThrow(GuideCoreError);
});

test("guide-core 표시가 없는 코드 펜스는 대조 대상이 아니다", () => {
  expect(parseFences("```ts\nconst a = 1;\n```\n", "g.mdx")).toHaveLength(0);
});
