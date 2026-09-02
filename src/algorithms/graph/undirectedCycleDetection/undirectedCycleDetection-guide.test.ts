/**
 * L9 — 가이드가 싣는 코드가 **기존 테스트의 입출력 케이스**를 통과하는가.
 *
 * 원본 `src/algorithms/graph/undirectedCycleDetection/undirectedCycleDetection.test.ts` 는
 * 학습자 스텁을 가져오므로 그대로 재사용할 수 없다. **케이스만** 옮겨 정본에 다시 건다.
 *
 * 벽시계를 재는 케이스 둘(`V=10^5` 한 줄과 고리를 100ms 안에)은 그대로 옮기지 않았다 —
 * 실행마다 값이 달라 판정이 안 된다. 그 케이스가 실제로 지키던 것은 **정점 100,000 이 한
 * 줄로 이어져도 결과가 나온다**(재귀 깊이로 실패하지 않는다)는 것이라, 아래에서 반환값으로
 * 다시 건다. 같은 규모의 비용은 「최악을 만드는 입력」이 배열 칸 접근 수로 진다.
 */
import { expect, test } from "bun:test";
import { undirectedCycleDetection } from "./undirectedCycleDetection-guide.ref.ts";

type Edge = [number, number];

const CYCLIC: [string, number, Edge[]][] = [
  [
    "삼각형 (3-사이클)",
    3,
    [
      [0, 1],
      [1, 2],
      [2, 0],
    ],
  ],
  [
    "사각형 (4-사이클)",
    4,
    [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 0],
    ],
  ],
  [
    "분리된 두 덩어리 중 하나에만 사이클",
    5,
    [
      [0, 1],
      [1, 2],
      [2, 0],
      [3, 4],
    ],
  ],
  ["자기 자신을 잇는 간선", 2, [[0, 0]]],
  [
    "같은 쌍을 두 번 이은 간선",
    2,
    [
      [0, 1],
      [0, 1],
    ],
  ],
];

for (const [name, n, edges] of CYCLIC) {
  test(`정본 — ${name} → true`, () => {
    expect(undirectedCycleDetection(n, edges)).toBe(true);
  });
}

const ACYCLIC: [string, number, Edge[]][] = [
  [
    "한 줄로 이은 네 정점",
    4,
    [
      [0, 1],
      [1, 2],
      [2, 3],
    ],
  ],
  [
    "별 모양 네 정점",
    4,
    [
      [0, 1],
      [0, 2],
      [0, 3],
    ],
  ],
  [
    "한 줄 둘로 나뉜 숲",
    6,
    [
      [0, 1],
      [1, 2],
      [3, 4],
      [4, 5],
    ],
  ],
  ["간선이 없는 그래프", 5, []],
  ["V=1, 간선 없음", 1, []],
  ["V=2, 간선 1개", 2, [[0, 1]]],
];

for (const [name, n, edges] of ACYCLIC) {
  test(`정본 — ${name} → false`, () => {
    expect(undirectedCycleDetection(n, edges)).toBe(false);
  });
}

test("본문 전개가 쓰는 고정 입력", () => {
  expect(
    undirectedCycleDetection(6, [
      [0, 1],
      [1, 2],
      [3, 4],
      [4, 5],
      [5, 3],
    ]),
  ).toBe(true);
});

test("간선을 어느 끝부터 적어도 답이 같다", () => {
  // 무향이므로 [1,0] 과 [0,1] 은 같은 간선이다. 한쪽 목록에만 넣으면 여기서 갈린다.
  expect(
    undirectedCycleDetection(3, [
      [1, 0],
      [2, 1],
    ]),
  ).toBe(false);
  expect(
    undirectedCycleDetection(3, [
      [1, 0],
      [2, 1],
      [0, 2],
    ]),
  ).toBe(true);
});

test("입력 edges 배열을 변형하지 않는다", () => {
  const edges: Edge[] = [
    [0, 1],
    [1, 2],
    [2, 0],
  ];
  const snapshot = JSON.stringify(edges);
  undirectedCycleDetection(3, edges);
  expect(JSON.stringify(edges)).toBe(snapshot);
});

test("정점 100,000 이 한 줄로 이어져도 결과가 나온다", () => {
  // 원본의 벽시계 케이스가 지키던 것 — 호출 깊이가 아니라 배열 길이로 깊이를 잡는다.
  const V = 100_000;
  const edges: Edge[] = [];
  for (let i = 0; i < V - 1; i++) edges.push([i, i + 1]);
  expect(undirectedCycleDetection(V, edges)).toBe(false);
});

test("정점 100,000 짜리 한 줄의 양 끝을 이으면 사이클이다", () => {
  const V = 100_000;
  const edges: Edge[] = [];
  for (let i = 0; i < V - 1; i++) edges.push([i, i + 1]);
  edges.push([V - 1, 0]);
  expect(undirectedCycleDetection(V, edges)).toBe(true);
});

test("정점 100,000 짜리 별 모양은 사이클이 아니다", () => {
  // 목록 하나가 99,999 칸이라 한 정점의 이웃 목록이 가장 길어지는 입력이다.
  const V = 100_000;
  const edges: Edge[] = [];
  for (let i = 1; i < V; i++) edges.push([0, i]);
  expect(undirectedCycleDetection(V, edges)).toBe(false);
});
