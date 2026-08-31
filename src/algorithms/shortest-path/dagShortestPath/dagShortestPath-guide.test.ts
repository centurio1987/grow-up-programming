/**
 * L9 — 가이드가 싣는 코드가 **기존 테스트의 입출력 케이스**를 통과하는가.
 *
 * 원본 `src/algorithms/shortest-path/dagShortestPath/dagShortestPath.test.ts` 는 학습자
 * 스텁을 가져오므로 그대로 재사용할 수 없다. **케이스만** 옮겨 정본
 * (`dagShortestPath-guide.ref.ts`)에 다시 건다.
 *
 * 벽시계를 재는 케이스(`V=10^4` 그래프를 100ms 안에)는 옮기지 않았다 — 실행마다 값이 달라
 * 판정이 안 된다. 그 케이스가 실제로 지키던 것은 **정점 만 개 규모의 DAG 에서 결과가
 * 나온다**는 것이라, 아래에서 같은 그래프의 반환값으로 다시 건다. 같은 규모의 비용은
 * 「최악을 만드는 입력」이 배열 칸 접근 수로 진다.
 */
import { expect, test } from "bun:test";
import { dagShortestPath, type Edge } from "./dagShortestPath-guide.ref.ts";

const INF = Number.POSITIVE_INFINITY;

const CASES: [string, number, Edge[], number, number[]][] = [
  ["단일 정점", 1, [], 0, [0]],
  [
    "선형 DAG",
    4,
    [
      [0, 1, 1],
      [1, 2, 2],
      [2, 3, 3],
    ],
    0,
    [0, 1, 3, 6],
  ],
  [
    "음수 간선 포함 DAG",
    4,
    [
      [0, 1, 5],
      [0, 2, 3],
      [1, 3, -2],
      [2, 3, 1],
    ],
    0,
    [0, 5, 3, 3],
  ],
  [
    "위상 순서가 입력 순서와 다른 경우",
    4,
    [
      [2, 3, 1],
      [1, 2, 1],
      [0, 1, 1],
    ],
    0,
    [0, 1, 2, 3],
  ],
  [
    "여러 진입 경로 — 더 짧은 쪽을 고른다",
    3,
    [
      [0, 1, 1],
      [0, 2, 100],
      [1, 2, 1],
    ],
    0,
    [0, 1, 2],
  ],
  [
    "도달할 수 없는 정점은 Infinity",
    4,
    [
      [0, 1, 1],
      [2, 3, 1],
    ],
    0,
    [0, 1, INF, INF],
  ],
  ["간선이 없는 그래프", 3, [], 1, [INF, 0, INF]],
  [
    "시작 정점에서 나가는 간선이 없다",
    3,
    [
      [0, 2, 1],
      [1, 2, 1],
    ],
    2,
    [INF, INF, 0],
  ],
  [
    "가중치 0",
    3,
    [
      [0, 1, 0],
      [1, 2, 0],
    ],
    0,
    [0, 0, 0],
  ],
  [
    "같은 두 정점 사이의 간선이 둘 — 작은 가중치를 고른다",
    2,
    [
      [0, 1, 10],
      [0, 1, -3],
    ],
    0,
    [0, -3],
  ],
  [
    "큰 양수 가중치 10^9",
    3,
    [
      [0, 1, 1_000_000_000],
      [1, 2, 1_000_000_000],
    ],
    0,
    [0, 1_000_000_000, 2_000_000_000],
  ],
  [
    "음수 가중치 -10^9",
    3,
    [
      [0, 1, -1_000_000_000],
      [1, 2, -1_000_000_000],
    ],
    0,
    [0, -1_000_000_000, -2_000_000_000],
  ],
  [
    "본문 전개가 쓰는 고정 입력",
    6,
    [
      [2, 3, 2],
      [0, 1, 3],
      [1, 2, -4],
      [0, 2, 5],
      [1, 3, 6],
      [4, 0, 2],
      [0, 3, 7],
    ],
    0,
    [0, 3, -1, 1, INF, INF],
  ],
];

for (const [name, n, edges, src, want] of CASES) {
  test(`정본 — ${name}`, () => {
    expect(dagShortestPath(n, edges, src)).toEqual(want);
  });
}

test("입력 edges 배열을 바꾸지 않는다", () => {
  const edges: Edge[] = [
    [2, 3, 2],
    [0, 1, 3],
    [1, 2, -4],
  ];
  const snapshot = JSON.stringify(edges);
  dagShortestPath(4, edges, 0);
  expect(JSON.stringify(edges)).toBe(snapshot);
});

test("정점 100,000 이 한 줄로 이어져도 결과가 나온다", () => {
  // 원본의 벽시계 케이스가 지키던 것 — 호출 깊이가 아니라 배열 길이로 깊이를 잡는다.
  const V = 100_000;
  const edges: Edge[] = [];
  for (let i = 0; i + 1 < V; i++) edges.push([i, i + 1, 1]);
  const dist = dagShortestPath(V, edges, 0);
  expect(dist.length).toBe(V);
  expect(dist[0]).toBe(0);
  expect(dist[V - 1]).toBe(V - 1);
});

test("정점 만 개짜리 DAG — 원본 성능 케이스와 같은 그래프", () => {
  const V = 10_000;
  const edges: Edge[] = [];
  for (let i = 0; i + 1 < V; i++) edges.push([i, i + 1, 1]);
  let seed = 246_810;
  const rand = (): number => {
    seed = (seed * 1_103_515_245 + 12_345) & 0x7fff_ffff;
    return seed;
  };
  for (let i = 0; i < V * 4; i++) {
    const a = rand() % V;
    const b = rand() % V;
    if (a < b) edges.push([a, b, (rand() % 1000) + 1]);
  }
  const dist = dagShortestPath(V, edges, 0);
  expect(dist.length).toBe(V);
  expect(dist[0]).toBe(0);
  // 사슬 간선이 모두 있으므로 어느 정점도 도달하지 못하는 일이 없다.
  expect(dist.every((d) => d !== INF)).toBe(true);
});
