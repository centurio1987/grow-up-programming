/**
 * L9 — 가이드가 싣는 코드가 **기존 테스트의 입출력 케이스**를 통과하는가.
 *
 * 원본 `src/algorithms/shortest-path/dijkstra/dijkstra.test.ts` 는 학습자 스텁을 가져오므로
 * 그대로 재사용할 수 없다. **케이스만** 옮겨 정본(`dijkstra-guide.ref.ts`)에 다시 건다.
 * 벽시계를 재는 케이스(`V=10^4` 그래프를 100ms 안에)는 옮기지 않았다 — 실행마다 값이 달라
 * 판정이 안 된다. 같은 규모를 **연산 수**로 재는 자리는 「최악을 만드는 입력」이 진다.
 */
import { expect, test } from "bun:test";
import { dijkstra, type Edge } from "./dijkstra-guide.ref.ts";

const INF = Number.POSITIVE_INFINITY;

const CASES: [string, number, Edge[], number, number[]][] = [
  ["단일 정점, 자기 자신까지의 거리는 0", 1, [], 0, [0]],
  [
    "선형 그래프 0→1→2→3, 가중치 1",
    4,
    [
      [0, 1, 1],
      [1, 2, 1],
      [2, 3, 1],
    ],
    0,
    [0, 1, 2, 3],
  ],
  [
    "여러 경로 중 최단 경로를 고른다",
    3,
    [
      [0, 1, 1],
      [0, 2, 4],
      [1, 2, 2],
    ],
    0,
    [0, 1, 3],
  ],
  [
    "방향 그래프 — 역방향 간선은 쓸 수 없다",
    2,
    [
      [0, 1, 5],
      [1, 0, 2],
    ],
    0,
    [0, 5],
  ],
  ["도달할 수 없는 정점은 Infinity", 3, [[0, 1, 3]], 0, [0, 3, INF]],
  ["간선이 전혀 없으면 시작점만 0", 3, [], 1, [INF, 0, INF]],
  [
    "같은 두 정점 사이의 다중 간선 — 가중치가 더 작은 쪽을 고른다",
    2,
    [
      [0, 1, 10],
      [0, 1, 3],
      [0, 1, 7],
    ],
    0,
    [0, 3],
  ],
  [
    "가중치 0 인 간선",
    3,
    [
      [0, 1, 0],
      [1, 2, 0],
    ],
    0,
    [0, 0, 0],
  ],
  [
    "자기 자신을 가리키는 간선은 거리에 영향이 없다",
    2,
    [
      [0, 0, 5],
      [0, 1, 2],
    ],
    0,
    [0, 2],
  ],
  [
    "큰 가중치(10^9)도 그대로 더한다",
    3,
    [
      [0, 1, 1_000_000_000],
      [1, 2, 1_000_000_000],
    ],
    0,
    [0, 1_000_000_000, 2_000_000_000],
  ],
  [
    "시작점이 마지막 정점",
    3,
    [
      [0, 1, 1],
      [1, 2, 1],
      [2, 0, 1],
    ],
    2,
    [1, 2, 0],
  ],
];

for (const [name, n, edges, src, want] of CASES) {
  test(`정본 — ${name}`, () => {
    expect(dijkstra(n, edges, src)).toEqual(want);
  });
}

test("완전 그래프 (V=5)", () => {
  const n = 5;
  const edges: Edge[] = [];
  for (let u = 0; u < n; u++) {
    for (let v = 0; v < n; v++) if (u !== v) edges.push([u, v, 1]);
  }
  expect(dijkstra(n, edges, 0)).toEqual([0, 1, 1, 1, 1]);
});

test("본문 전개가 쓰는 고정 입력", () => {
  expect(
    dijkstra(
      6,
      [
        [0, 1, 4],
        [0, 2, 1],
        [2, 1, 2],
        [1, 3, 1],
        [2, 3, 5],
        [3, 4, 3],
        [4, 1, 7],
      ],
      0,
    ),
  ).toEqual([0, 3, 1, 4, 7, INF]);
});

test("최악을 만드는 입력도 거리는 정확하다", () => {
  // 완전 DAG — 간선 하나하나가 반드시 값을 고쳐 큐에 들어가는 항목이 E+1 로 가장 많아진다.
  const V = 200;
  const layered: Edge[] = [];
  for (let u = 0; u < V; u++) {
    for (let v = u + 1; v < V; v++) layered.push([u, v, 2 * (v - u) - 1]);
  }
  const got = dijkstra(V, layered, 0);
  expect(got[0]).toBe(0);
  expect(got[1]).toBe(1);
  // 정점 v 까지는 가중치 1 짜리 간선을 v 번 지나는 것이 가장 작다.
  expect(got[V - 1]).toBe(V - 1);

  // 사슬 — 최대 거리가 가장 커지는 입력.
  const chain: Edge[] = [];
  for (let i = 0; i + 1 < V; i++) chain.push([i, i + 1, 1_000_000_000]);
  expect(dijkstra(V, chain, 0)[V - 1]).toBe(199_000_000_000);
});
