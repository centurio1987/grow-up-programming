/**
 * L9 — 가이드가 싣는 코드가 **기존 테스트의 입출력 케이스**를 통과하는가.
 *
 * 원본 `src/algorithms/graph/directedCycleDetection/directedCycleDetection.test.ts` 는 학습자
 * 스텁을 가져오므로 그대로 재사용할 수 없다. **케이스만** 옮겨 정본에 다시 건다.
 *
 * 벽시계를 재는 케이스 둘(`V=10^5` 사슬과 사이클을 100ms 안에)은 그대로 옮기지 않았다 —
 * 실행마다 값이 달라 판정이 안 된다. 그 케이스가 실제로 지키던 것은 **정점 100,000 이 한 줄로
 * 이어져도 결과가 나온다**(재귀 깊이로 실패하지 않는다)는 것이라, 아래에서 반환값으로 다시
 * 건다. 같은 규모의 비용은 「최악을 만드는 입력」이 배열 칸 접근 수로 진다.
 */
import { expect, test } from "bun:test";
import { directedCycleDetection } from "./directedCycleDetection-guide.ref.ts";

type Edge = [number, number];

const CYCLIC: [string, number, Edge[]][] = [
  [
    "단순 유향 사이클 0→1→2→0",
    3,
    [
      [0, 1],
      [1, 2],
      [2, 0],
    ],
  ],
  ["자기 루프", 1, [[0, 0]]],
  [
    "이중 간선 0→1, 1→0",
    2,
    [
      [0, 1],
      [1, 0],
    ],
  ],
  [
    "DAG 안에 작은 사이클 포함",
    4,
    [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 1],
    ],
  ],
  [
    "분리된 두 성분 — 한쪽에만 사이클",
    5,
    [
      [0, 1],
      [1, 2],
      [2, 0],
      [3, 4],
    ],
  ],
];

for (const [name, n, edges] of CYCLIC) {
  test(`정본 — ${name} → true`, () => {
    expect(directedCycleDetection(n, edges)).toBe(true);
  });
}

const ACYCLIC: [string, number, Edge[]][] = [
  [
    "DAG: 선형 체인",
    4,
    [
      [0, 1],
      [1, 2],
      [2, 3],
    ],
  ],
  [
    "DAG: 다이아몬드",
    4,
    [
      [0, 1],
      [0, 2],
      [1, 3],
      [2, 3],
    ],
  ],
  [
    "DAG: 별 모양(out-star)",
    4,
    [
      [0, 1],
      [0, 2],
      [0, 3],
    ],
  ],
  ["간선이 없는 그래프", 5, []],
  [
    "교차 간선은 사이클이 아니다",
    3,
    [
      [0, 1],
      [0, 2],
      [1, 2],
    ],
  ],
  ["V=1, 간선 없음", 1, []],
  ["V=2, 간선 1개", 2, [[0, 1]]],
];

for (const [name, n, edges] of ACYCLIC) {
  test(`정본 — ${name} → false`, () => {
    expect(directedCycleDetection(n, edges)).toBe(false);
  });
}

test("본문 전개가 쓰는 고정 입력", () => {
  expect(
    directedCycleDetection(6, [
      [0, 1],
      [1, 3],
      [3, 4],
      [0, 4],
      [0, 2],
      [2, 3],
      [2, 5],
      [5, 0],
    ]),
  ).toBe(true);
});

test("순방향 간선만 있으면 사이클이 아니다", () => {
  // 0→1→2 를 이어 두고 0→2 를 더한 것. 2 는 0 의 자손이라 순방향 간선이다.
  expect(
    directedCycleDetection(3, [
      [0, 1],
      [1, 2],
      [0, 2],
    ]),
  ).toBe(false);
});

test("입력 edges 배열을 변형하지 않는다", () => {
  const edges: Edge[] = [
    [0, 1],
    [1, 2],
    [2, 0],
  ];
  const snapshot = JSON.stringify(edges);
  directedCycleDetection(3, edges);
  expect(JSON.stringify(edges)).toBe(snapshot);
});

test("정점 100,000 이 한 줄로 이어져도 결과가 나온다", () => {
  // 원본의 벽시계 케이스가 지키던 것 — 호출 깊이가 아니라 배열 길이로 깊이를 잡는다.
  const V = 100_000;
  const edges: Edge[] = [];
  for (let i = 0; i < V - 1; i++) edges.push([i, i + 1]);
  expect(directedCycleDetection(V, edges)).toBe(false);
});

test("정점 100,000 짜리 사슬이 닫히면 사이클이다", () => {
  const V = 100_000;
  const edges: Edge[] = [];
  for (let i = 0; i < V - 1; i++) edges.push([i, i + 1]);
  edges.push([V - 1, 0]);
  expect(directedCycleDetection(V, edges)).toBe(true);
});

test("다이아몬드를 16 개 이어도 사이클이 아니다", () => {
  // 경로 수가 2^16 = 65,536 개인 그래프. 검은색 표시가 없으면 그만큼을 다 따라간다.
  const edges: Edge[] = [];
  for (let i = 0; i < 16; i++) {
    const a = 3 * i;
    edges.push([a, a + 1], [a, a + 2], [a + 1, a + 3], [a + 2, a + 3]);
  }
  expect(directedCycleDetection(49, edges)).toBe(false);
});
