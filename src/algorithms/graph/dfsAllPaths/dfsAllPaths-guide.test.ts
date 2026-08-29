/**
 * L9 — 가이드가 싣는 코드가 **기존 테스트의 입출력 케이스**를 통과하는가.
 *
 * 원본 `src/algorithms/graph/dfsAllPaths/dfsAllPaths.test.ts` 는 학습자 스텁을 가져오므로
 * 그대로 재사용할 수 없다. **케이스만** 옮겨 정본에 다시 건다.
 *
 * 벽시계를 재는 케이스(7×7 격자를 100ms 안에)는 그대로 옮기지 않았다 — 실행마다 값이 달라
 * 판정이 안 된다. 그 케이스가 실제로 지키던 것은 **정점 64 개에서 경로 3,432 개가 사전식
 * 순서로 다 나온다**는 것이라, 아래에서 경로 수와 첫 경로로 다시 건다. 같은 규모의 비용은
 * 「최악을 만드는 입력」이 진입한 노드 수로 진다.
 */
import { expect, test } from "bun:test";
import { dfsAllPaths } from "./dfsAllPaths-guide.ref.ts";

const CASES: [string, number, [number, number][], number, number, number[][]][] =
  [
    [
      "다이아몬드 DAG — 두 경로",
      4,
      [
        [0, 1],
        [0, 2],
        [1, 3],
        [2, 3],
      ],
      0,
      3,
      [
        [0, 1, 3],
        [0, 2, 3],
      ],
    ],
    [
      "여러 경로 — 사전식 정렬",
      4,
      [
        [0, 1],
        [0, 2],
        [1, 2],
        [1, 3],
        [2, 3],
      ],
      0,
      3,
      [
        [0, 1, 2, 3],
        [0, 1, 3],
        [0, 2, 3],
      ],
    ],
    ["경로가 없으면 빈 배열", 3, [[0, 1]], 0, 2, []],
    ["역방향 간선만 있어 도달 불가", 2, [[1, 0]], 0, 1, []],
    [
      "source === target — 길이 1 경로 하나",
      3,
      [
        [0, 1],
        [1, 2],
      ],
      1,
      1,
      [[1]],
    ],
    [
      "사이클이 있어도 단순 경로만 반환",
      3,
      [
        [0, 1],
        [1, 2],
        [2, 0],
        [0, 2],
      ],
      0,
      2,
      [
        [0, 1, 2],
        [0, 2],
      ],
    ],
    [
      "자기 루프는 무시된다",
      2,
      [
        [0, 0],
        [0, 1],
      ],
      0,
      1,
      [[0, 1]],
    ],
    [
      "중복 간선은 경로를 중복 생성하지 않는다",
      3,
      [
        [0, 1],
        [0, 1],
        [1, 2],
      ],
      0,
      2,
      [[0, 1, 2]],
    ],
    ["최소 입력 n=1, source=target", 1, [], 0, 0, [[0]]],
    ["직접 간선 하나", 2, [[0, 1]], 0, 1, [[0, 1]]],
  ];

for (const [name, n, edges, source, target, want] of CASES) {
  test(`정본 — ${name}`, () => {
    expect(dfsAllPaths(n, edges, source, target)).toEqual(want);
  });
}

test("입력 edges 배열을 변형하지 않는다", () => {
  const edges: [number, number][] = [
    [0, 1],
    [0, 2],
    [1, 3],
    [2, 3],
  ];
  const snapshot = JSON.stringify(edges);
  dfsAllPaths(4, edges, 0, 3);
  expect(JSON.stringify(edges)).toBe(snapshot);
});

test("본문 전개가 쓰는 고정 입력", () => {
  expect(
    dfsAllPaths(
      6,
      [
        [0, 2],
        [0, 1],
        [1, 2],
        [1, 4],
        [2, 0],
        [2, 4],
        [2, 5],
        [5, 5],
      ],
      0,
      4,
    ),
  ).toEqual([
    [0, 1, 2, 4],
    [0, 1, 4],
    [0, 2, 4],
  ]);
});

test("7×7 격자 DAG 에서 경로 3,432 개가 사전식으로 나온다", () => {
  const m = 7;
  const id = (r: number, c: number): number => r * (m + 1) + c;
  const edges: [number, number][] = [];
  for (let r = 0; r <= m; r++) {
    for (let c = 0; c <= m; c++) {
      if (c < m) edges.push([id(r, c), id(r, c + 1)]);
      if (r < m) edges.push([id(r, c), id(r + 1, c)]);
    }
  }
  const got = dfsAllPaths((m + 1) * (m + 1), edges, id(0, 0), id(m, m));
  expect(got.length).toBe(3432); // C(14, 7)
  expect(got[0]).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 15, 23, 31, 39, 47, 55, 63]);
  expect(got[3431]).toEqual([
    0, 8, 16, 24, 32, 40, 48, 56, 57, 58, 59, 60, 61, 62, 63,
  ]);
});

test("정점 1,000 개짜리 사슬에서도 결과가 나온다", () => {
  // 재귀 깊이가 곧 경로 길이다. 제약의 정점 수 상한이 그대로 깊이의 상한이 된다.
  const V = 1_000;
  const edges: [number, number][] = [];
  for (let i = 0; i < V - 1; i++) edges.push([i, i + 1]);
  const got = dfsAllPaths(V, edges, 0, V - 1);
  expect(got.length).toBe(1);
  expect((got[0] as number[]).length).toBe(V);
});
