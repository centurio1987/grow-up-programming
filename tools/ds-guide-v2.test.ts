/**
 * 자료구조 골격(`sandbox/ds-guide-v2/SPEC.md`)을 판정 장치가 실제로 아는가.
 *
 * 이 파일이 재는 것은 **갈래가 실제로 갈리는가**다. algo 골격은 111편이 매일 돌려 확인되지만
 * ds 골격은 아직 산출이 0 편이라, 배선이 끊겨 있어도 아무도 모른다 — 첫 편을 쓰는 세션이
 * 그 사실을 발견하게 되고 그때는 원인이 멀리 있다.
 *
 * **「안 잰 것이 통과로 읽히면 안 된다」가 이 파일의 주제다.** 특히 P16 — algo 는 정본
 * 사이드카가 없으면 「미실행」으로 넘어가는데, ds 는 정본이 이미 서 있어야 하는 트랙이라
 * 부재가 **위반**이다.
 */

import { expect, test } from "bun:test";
import {
  check,
  dsReferenceCode,
  escalationSection,
  finalCodeMatchesRef,
  noContractTableCopy,
  operationCoverage,
} from "./check-v2.ts";
import { headerDoc, parseContract } from "./contract-header.ts";
import { kindOf, kindOfOr } from "./guide-v2-targets.ts";
import { parseSections } from "./section.ts";

/* ─────────────── 갈래 판정 ─────────────── */

test("kindOf — 트랙이 골격을 정한다", () => {
  expect(kindOf("src/algorithms/sorting/quicksort/quicksort-guide.md")).toBe(
    "algo",
  );
  expect(kindOf("src/data-structures/linear/deque/deque-guide.md")).toBe("ds");
  // 절대 경로로도 불린다 — `build-html --all` 이 그렇다.
  expect(kindOf("/x/y/src/data-structures/tree/avlTree/avlTree-guide.md")).toBe(
    "ds",
  );
});

test("kindOf — 두 트랙 밖은 던진다", () => {
  expect(() => kindOf("docs/x-guide.md")).toThrow();
  // 폴백은 부르는 쪽이 명시할 때만.
  expect(kindOfOr("docs/x-guide.md", "algo")).toBe("algo");
  // **폴백이 자료구조 편을 삼키지 않는다** — 트랙 안이면 폴백이 발동하지 않는다.
  expect(
    kindOfOr("src/data-structures/linear/deque/deque-guide.md", "algo"),
  ).toBe("ds");
});

/* ─────────────── 매핑 갈래 ─────────────── */

const DS_HEADINGS = [
  "# 덱 — 양 끝만 여는 수열",
  "## 파트 1 — 계약에서 동작하는 구현까지",
  "### 전체 컨셉",
  "### 설계 상세 — 덱에 이르는 과정",
  "### 수행으로 알아보는 자료구조 — 양 끝을 번갈아 민다",
  "#### 1. 뒤 끝에 넣는다",
  "#### 멈춤 — 빈 덱에서 pop 은 던지지 않는다",
  "#### 2. 전체 코드",
  "## 파트 2 — 적용 조건 · 보장 · 비용",
  "### 이 구조가 최적의 선택인 경우",
  "#### 최적인 요구의 모양",
  "#### 이 구조를 떠올리게 하는 연산 조합",
  "#### 실제로 쓰이는 곳",
  "### 불변식 — 앞뒤가 같은 수열의 두 끝이다",
  "### 비용 계산",
  "#### 비용을 세는 과정",
  "#### 케이스별 비용과 그 경계",
  "#### 최악을 만드는 입력",
  "#### TypeScript 의 한계와 대체 언어",
  "### 스스로 점검하기",
].join("\n\n본문\n\n");

test("ds 헤딩이 ds 매핑에서 전부 해소된다", () => {
  const { sections, unresolved } = parseSections(DS_HEADINGS, "ds");
  expect(unresolved).toEqual([]);
  const ids = sections.map((s) => s.id);
  expect(ids).toContain("deep.build");
  expect(ids).toContain("deep.walk");
  expect(ids).toContain("deep.walk.step");
  expect(ids).toContain("purpose.cue");
  expect(ids).toContain("perf.escalation");
});

test("같은 문서를 algo 매핑으로 읽으면 미해소가 난다 — 갈래가 실제로 갈린다", () => {
  const { unresolved } = parseSections(DS_HEADINGS, "algo");
  const headings = unresolved.map((u) => u.heading);
  // ds 고유 문구 다섯이 algo 매핑에는 없다.
  expect(headings).toContain("### 설계 상세 — 덱에 이르는 과정");
  expect(headings).toContain("### 이 구조가 최적의 선택인 경우");
  expect(headings).toContain("#### 이 구조를 떠올리게 하는 연산 조합");
  expect(headings).toContain("#### TypeScript 의 한계와 대체 언어");
});

test("algo 헤딩은 algo 매핑에서 그대로 해소된다 — 회귀가 없다", () => {
  const algo = [
    "# 퀵 정렬 — 축을 하나 골라 가르면 끝난다",
    "## 파트 1 — 아이디어에서 동작하는 코드까지",
    "### 전체 컨셉",
    "### 아이디어 상세 — 분할을 떠올리는 과정",
    "### 수행으로 알아보는 알고리즘 — 축 하나로 가른다",
    "#### 1. 축을 고른다",
    "## 파트 2 — 적용 조건 · 보장 · 비용",
    "### 이 알고리즘이 최적의 솔루션인 경우",
    "#### 최적인 문제의 모양",
    "#### 문제에서 이것을 떠올리게 하는 단서",
  ].join("\n\n본문\n\n");
  expect(parseSections(algo, "algo").unresolved).toEqual([]);
});

/* ─────────────── P17 · P18 · P19 ─────────────── */

const OPS = [
  "pushFront",
  "pushBack",
  "popFront",
  "popBack",
  "peekFront",
  "size",
];

function dsSections(walkBody: string, extra = "") {
  return parseSections(
    [
      "# x — y",
      "## 파트 1 — a",
      "### 수행으로 알아보는 자료구조 — b",
      "#### 1. 넣고 뺀다",
      walkBody,
      "## 파트 2 — c",
      "### 비용 계산",
      extra,
    ].join("\n\n"),
    "ds",
  ).sections;
}

test("P17 — 계약 연산이 전개에 안 나오면 걸린다", () => {
  const partial = dsSections("`pushFront` 와 `pushBack` 만 다룬다.");
  const found = operationCoverage(partial, OPS);
  expect(found.map((f) => f.code)).toEqual(["P17"]);
  expect(found[0]?.detail).toContain("popFront");
});

test("P17 — 전수 피복이면 안 걸린다", () => {
  const full = dsSections(OPS.map((o) => `\`${o}\` 를 굴린다.`).join(" "));
  expect(operationCoverage(full, OPS)).toEqual([]);
});

test("P18 — 계약 표를 옮겨 적으면 걸린다", () => {
  const copied = dsSections(
    [
      "| 연산 | 상한 |",
      "| --- | --- |",
      "| `pushFront` | O(1) |",
      "| `pushBack` | O(1) |",
      "| `popFront` | O(1) |",
      "| `popBack` | O(1) |",
    ].join("\n"),
  );
  expect(noContractTableCopy(copied, OPS).map((f) => f.code)).toEqual(["P18"]);
});

test("P18 — 연산 하나의 비용을 표로 따지는 것은 정당하다 (오탐 시험)", () => {
  const bounds = dsSections(
    ["| 케이스 | 경계 |", "| --- | --- |", "| `pushBack` 상각 | O(1) |"].join(
      "\n",
    ),
  );
  expect(noContractTableCopy(bounds, OPS)).toEqual([]);
});

test("P19 — 등급이 (나)인데 절이 없으면 걸린다", () => {
  expect(
    escalationSection(dsSections("본문"), "opt").map((f) => f.code),
  ).toEqual(["P19"]);
});

test("P19 — 등급이 (-)인데 절이 있으면 걸린다", () => {
  const withSec = dsSections(
    "본문",
    "#### TypeScript 의 한계와 대체 언어\n\n본문",
  );
  expect(escalationSection(withSec, "-").map((f) => f.code)).toEqual(["P19"]);
});

test("P19 — 등급과 절이 맞으면 안 걸린다 (양방향)", () => {
  const withSec = dsSections(
    "본문",
    "#### TypeScript 의 한계와 대체 언어\n\n본문",
  );
  expect(escalationSection(withSec, "opt")).toEqual([]);
  expect(escalationSection(dsSections("본문"), "-")).toEqual([]);
});

/* ─────────────── 계약 헤더 파서 재사용 ─────────────── */

test("계약 헤더에서 연산을 뽑는 파서가 하나다", () => {
  const stub = [
    "/**",
    " * Deque — 설명.",
    " *",
    " * **연산 계약.**",
    " *",
    " * | 연산 | 의미 | 상한 | 한정자 |",
    " * |---|---|---|---|",
    " * | `pushFront(item)` | 앞에 놓는다 | O(1) | amortized |",
    " * | `size()` | 원소 수 | O(1) | worst |",
    " */",
    "export class Deque {}",
  ].join("\n");
  const doc = headerDoc(stub);
  expect(doc).not.toBeNull();
  expect(parseContract(doc ?? "").ops).toEqual(["pushFront", "size"]);
});

/* ─────────────── check() 배선 ─────────────── */

test("check 는 kind 를 기본 algo 로 둔다 — 시험 72벌이 갈래를 안 적는 근거", () => {
  const algoText = ["# a — b", "## 파트 1 — c", "### 전체 컨셉", "본문"].join(
    "\n\n",
  );
  const withKind = check({ text: algoText, kind: "algo" }).map((f) => f.code);
  const without = check({ text: algoText }).map((f) => f.code);
  expect(without).toEqual(withKind);
});

test("ds 조항은 입력이 없으면 안 돈다 — 미실행과 통과를 가른다", () => {
  const text = [
    "# x — y",
    "## 파트 1 — a",
    "### 수행으로 알아보는 자료구조 — b",
    "#### 1. 넣는다",
    "본문",
  ].join("\n\n");
  const codes = check({ text, kind: "ds" }).map((f) => f.code);
  // contractOps·escalation 을 안 넘겼으므로 P17·P18·P19 는 하나도 안 나온다.
  expect(codes.filter((c) => ["P17", "P18", "P19"].includes(c))).toEqual([]);
});

/* ─────────────── P16 ds 경로 — 구간 이름을 고르지 않는다 ─────────────── */

/** 전체 코드 절 하나만 가진 최소 원고. 펜스 본문을 넣는다. */
function finalOnly(code: string): string {
  return [
    "# x — y",
    "## 파트 1 — a",
    "### 수행으로 알아보는 자료구조 — b",
    "#### 1. 전체 코드",
    "```ts guide-core=src/data-structures/linear/x/_reference/x.ts",
    code,
    "```",
  ].join("\n");
}

const UNNAMED = [
  "// #region guide:core",
  "const START = 8;",
  "export class X {",
  "  __cost = 0;",
  "  size(): number {",
  "    this.__cost += 1;",
  "    return START;",
  "  }",
  "}",
  "// #endregion",
].join("\n");

const TYPES_AND_CLASS = [
  "// #region guide:core/types",
  "interface Node { v: number }",
  "// #endregion",
  "// #region guide:core/class",
  "export class Y {",
  "  root: Node | null = null;",
  "}",
  "// #endregion",
].join("\n");

test("P16 ds — 이름 없는 구간만 가진 정본도 추출된다 (linear/deque 가 이 모양이다)", () => {
  const ref = dsReferenceCode(UNNAMED, "x.ts");
  expect(ref).toContain("const START = 8;");
  expect(ref).not.toContain("__cost");
  const sections = parseSections(finalOnly(ref), "ds").sections;
  expect(finalCodeMatchesRef(sections, ref)).toEqual([]);
});

test("P16 ds — types 구간과 class 구간을 둘 다 대조한다", () => {
  const ref = dsReferenceCode(TYPES_AND_CLASS, "y.ts");
  expect(ref).toContain("interface Node");
  expect(ref).toContain("export class Y");
  // 원고가 class 구간만 실으면 타입 선언이 빠진 것으로 걸린다.
  const classOnly = [
    "export class Y {",
    "  root: Node | null = null;",
    "}",
  ].join("\n");
  const sections = parseSections(finalOnly(classOnly), "ds").sections;
  const found = finalCodeMatchesRef(sections, ref);
  expect(found.map((f) => f.code)).toEqual(["P16"]);
  // 펜스를 못 읽어서가 아니라 **정본과 달라서** 걸려야 한다. `ts guide-core=…` 정보
  // 문자열을 언어로 못 읽던 때는 여기가 「펜스가 없다」로 걸려 엉뚱한 이유로 통과했다.
  expect(found[0]?.detail).toContain("정본");
  expect(found[0]?.detail).not.toContain("펜스가 없다");
});
