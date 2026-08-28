/**
 * `algo-wbs.ts` 자기시험 — 게이트 셋과 목록 파싱.
 *
 * **게이트가 조용히 꺼져도 화면에는 후보가 뜬다.** 그 상태가 곧 「중요도 순을 지킨다」고
 * 적어 두고 안 지키는 것이라, 게이트마다 **막히는 표본과 안 막히는 표본**을 함께 둔다.
 */

import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  parseIndex,
  plan,
  type Status,
  type Unit,
  viewsIn,
} from "./algo-wbs.ts";

const INDEX = `# 문제 가이드 목록 (중요도순)

## ★★★ 상 — 필수

- **이진 탐색** — [binarySearch](./src/algorithms/binary-search/binarySearch/binarySearch-guide.mdx) · [ternarySearch](./src/algorithms/binary-search/ternarySearch/ternarySearch-guide.mdx)(변형)
- **스택·큐·덱** — [stack](./src/data-structures/linear/stack/stack-guide.mdx)
- **정렬** — [quicksort](./src/algorithms/sorting/quicksort/quicksort-guide.md)

## ★★ 중 — 빈출

- **Dijkstra** — [dijkstra](./src/algorithms/shortest-path/dijkstra/dijkstra-guide.mdx)

## ★ 하 — 특정 분야·고급

- **기하** — [convexHull](./src/algorithms/geometry/convexHull/convexHull-guide.mdx)

## 중요도 미분류 — 기본기

- **기타** — [bubbleSort](./src/algorithms/sorting/bubbleSort/bubbleSort-guide.mdx)
`;

test("목록 파싱 — 등급 절이 웨이브가 되고 절 안의 순서가 곧 집필 순서다", () => {
  const units = parseIndex(INDEX);
  expect(units.map((u) => `${u.wave}:${u.name}`)).toEqual([
    "W1:binarySearch",
    "W1:ternarySearch",
    "W1:quicksort",
    "W2:dijkstra",
    "W3:convexHull",
  ]);
  expect(units.map((u) => u.order)).toEqual([0, 1, 2, 3, 4]);
});

test("목록 파싱 — 자료구조 편은 분모가 아니다", () => {
  // 같은 줄이 `src/data-structures/` 를 가리키는 일이 흔하다. 그쪽은 ORD-006 의 일이다.
  expect(parseIndex(INDEX).some((u) => u.name === "stack")).toBe(false);
});

test("목록 파싱 — 등급이 아닌 절은 웨이브가 없다", () => {
  expect(parseIndex(INDEX).some((u) => u.name === "bubbleSort")).toBe(false);
});

test("목록 파싱 — 한 편이 두 줄에 나와도 한 번만 센다", () => {
  const twice = INDEX.replace(
    "## ★★ 중 — 빈출",
    "- **재등장** — [binarySearch](./src/algorithms/binary-search/binarySearch/binarySearch-guide.mdx)\n\n## ★★ 중 — 빈출",
  );
  expect(
    parseIndex(twice).filter((u) => u.name === "binarySearch"),
  ).toHaveLength(1);
});

test("뷰 추출 — `.mdx` 의 속성과 `.sim.ts` 의 배열을 둘 다 읽는다", () => {
  expect(viewsIn(`<Sim view="array" />`)).toEqual(["array"]);
  expect(viewsIn(`view={["matrix", "keyValue"]}`)).toEqual([
    "keyValue",
    "matrix",
  ]);
  expect(viewsIn(`  view: ["matrix", "array"],`)).toEqual(["array", "matrix"]);
  expect(viewsIn("뷰가 없다")).toEqual([]);
});

/** 시험용 유닛. 순서는 인자 순이다. */
function status(
  wave: string,
  category: string,
  name: string,
  views: string[],
  done = false,
  order = 0,
): Status {
  const unit: Unit = {
    wave,
    order,
    category,
    name,
    href: `${category}/${name}`,
  };
  return { unit, done, views };
}

test("웨이브 배리어 — 앞 웨이브가 안 비면 다음 웨이브 후보를 내지 않는다", () => {
  const { active, claims, blocked } = plan([
    status("W1", "graph", "bfs", ["graph"], false, 0),
    status("W2", "string", "kmp", ["array"], false, 1),
  ]);
  expect(active).toBe("W1");
  expect(claims.map((c) => c.unit.name)).toEqual(["bfs"]);
  expect(blocked.map((b) => [b.unit.name, b.block.reason])).toEqual([
    ["kmp", "wave"],
  ]);
});

test("웨이브 배리어 — 앞 웨이브가 비면 다음 웨이브가 열린다", () => {
  const { active, claims } = plan([
    status("W1", "graph", "bfs", ["graph"], true, 0),
    status("W2", "string", "kmp", ["array"], false, 1),
  ]);
  expect(active).toBe("W2");
  expect(claims.map((c) => c.unit.name)).toEqual(["kmp"]);
});

test("카테고리 선례 — 같은 카테고리의 후속은 앞 편이 설 때까지 막힌다", () => {
  const { claims, blocked } = plan([
    status("W1", "graph", "bfs", ["graph"], false, 0),
    status("W1", "graph", "dfs", ["graph"], false, 1),
  ]);
  expect(claims.map((c) => c.unit.name)).toEqual(["bfs"]);
  expect(blocked.map((b) => [b.unit.name, b.block.reason])).toEqual([
    ["dfs", "category"],
  ]);
});

test("카테고리 선례 — 전역 정지가 아니다. 다른 카테고리는 진행한다", () => {
  const { claims } = plan([
    status("W1", "graph", "bfs", ["graph"], false, 0),
    status("W1", "graph", "dfs", ["graph"], false, 1),
    status("W1", "dp", "coin", ["keyValue"], false, 2),
  ]);
  expect(claims.map((c) => c.unit.name)).toEqual(["bfs", "coin"]);
});

test("뷰 조합 선례 — 선 적 없는 조합은 첫 편만 열고 후속을 막는다", () => {
  // `matrix` 는 카테고리가 아니라 뷰라, 카테고리 게이트만으로는 안 걸린다.
  const { claims, blocked } = plan([
    status("W1", "advanced", "nQueens", ["matrix"], false, 0),
    status("W1", "etc", "spiral", ["matrix"], false, 1),
  ]);
  expect(claims.map((c) => c.unit.name)).toEqual(["nQueens"]);
  expect(claims[0]?.solo).toBe(true);
  expect(blocked.map((b) => [b.unit.name, b.block.reason])).toEqual([
    ["spiral", "view"],
  ]);
});

test("뷰 조합 선례 — 이미 선 조합은 여럿이 함께 돈다", () => {
  const { claims } = plan([
    status("W1", "sorting", "quick", ["matrix"], true, 0),
    status("W1", "advanced", "nQueens", ["matrix"], false, 1),
    status("W1", "etc", "spiral", ["matrix"], false, 2),
  ]);
  expect(claims.map((c) => c.unit.name)).toEqual(["nQueens", "spiral"]);
  expect(claims.every((c) => !c.solo)).toBe(true);
});

test("웨이브 집계 — 남은 편이 웨이브마다 따로 나온다", () => {
  const { waves } = plan([
    status("W1", "graph", "bfs", ["graph"], true, 0),
    status("W1", "graph", "dfs", ["graph"], false, 1),
    status("W3", "geometry", "hull", ["array"], false, 2),
  ]);
  expect(waves).toEqual([
    { id: "W1", total: 2, done: 1, open: 1 },
    { id: "W2", total: 0, done: 0, open: 0 },
    { id: "W3", total: 1, done: 0, open: 1 },
  ]);
});

test("전개가 끝나면 활성 웨이브가 없다", () => {
  const { active, claims } = plan([
    status("W1", "graph", "bfs", ["graph"], true, 0),
  ]);
  expect(active).toBeNull();
  expect(claims).toEqual([]);
});

test("실물 목록 — 알고리즘 편 111 이고 웨이브가 26·41·44 로 갈린다", () => {
  // 편수가 바뀌면 이 시험이 먼저 말한다. 카드 전략표(111 = 26+41+44)가 그 근거다.
  const units = parseIndex(
    readFileSync(join(import.meta.dir, "..", "문제_가이드_목록.md"), "utf8"),
  );
  expect(units).toHaveLength(111);
  const count = (w: string) => units.filter((u) => u.wave === w).length;
  expect([count("W1"), count("W2"), count("W3")]).toEqual([26, 41, 44]);
});
