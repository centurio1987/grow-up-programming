/**
 * L9 — 가이드가 싣는 코드가 **기존 테스트의 입출력 케이스**를 통과하는가.
 *
 * 원본 `src/algorithms/shortest-path/spfa/spfa.test.ts` 는 학습자 스텁을 가져오므로 그대로
 * 재사용할 수 없다. **케이스만** 옮겨 정본(`spfa-guide.ref.ts`)에 다시 건다. 벽시계를 재는
 * 케이스(`V=10^4` 그래프를 100ms 안에)는 옮기지 않았다 — 실행마다 값이 달라 판정이 안 된다.
 * 같은 규모를 **간선 읽기 횟수**로 재는 자리는 「최악을 만드는 입력」이 진다.
 */
import { expect, test } from "bun:test";
import { type Edge, spfa } from "./spfa-guide.ref.ts";

const INF = Number.POSITIVE_INFINITY;

const CASES: [string, number, Edge[], number, number[]][] = [
  ["단일 정점, 자기 자신까지의 거리는 0", 1, [], 0, [0]],
  [
    "선형 그래프, 양수 가중치만",
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
    "음수 간선이 있고 음수 사이클은 없다",
    3,
    [
      [0, 1, 4],
      [0, 2, 5],
      [1, 2, -3],
    ],
    0,
    [0, 4, 1],
  ],
  [
    "늦게 찾은 짧은 경로가 앞서 적은 값을 줄인다",
    3,
    [
      [0, 1, 10],
      [0, 2, 1],
      [2, 1, 1],
    ],
    0,
    [0, 2, 1],
  ],
  ["도달할 수 없는 정점은 Infinity", 3, [[0, 1, 2]], 0, [0, 2, INF]],
  ["간선이 하나도 없으면 시작점만 0", 3, [], 2, [INF, INF, 0]],
  [
    "같은 두 정점 사이의 다중 간선 — 가중치가 가장 작은 쪽이 남는다",
    2,
    [
      [0, 1, 5],
      [0, 1, -2],
      [0, 1, 3],
    ],
    0,
    [0, -2],
  ],
  [
    "가중치가 0 인 간선",
    3,
    [
      [0, 1, 0],
      [1, 2, 0],
    ],
    0,
    [0, 0, 0],
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
    "가장 작은 가중치(−10^9)도 그대로 더한다",
    3,
    [
      [0, 1, 1_000_000_000],
      [1, 2, -1_000_000_000],
    ],
    0,
    [0, 1_000_000_000, 0],
  ],
  [
    "시작점이 중간 정점",
    4,
    [
      [0, 1, 1],
      [1, 2, 1],
      [2, 3, 1],
    ],
    1,
    [INF, 0, 1, 2],
  ],
  [
    "가중치 합이 0 인 사이클은 값을 더 줄이지 못한다",
    3,
    [
      [0, 1, 2],
      [1, 2, -1],
      [2, 1, 1],
    ],
    0,
    [0, 2, 1],
  ],
  [
    "자기 자신을 가리키는 양수 간선은 거리에 영향이 없다",
    2,
    [
      [0, 0, 5],
      [0, 1, 2],
    ],
    0,
    [0, 2],
  ],
  [
    "본문 전개가 쓰는 고정 입력",
    6,
    [
      [0, 1, 6],
      [0, 2, 1],
      [0, 3, 20],
      [1, 3, 4],
      [2, 1, -3],
      [2, 3, 9],
      [3, 4, 2],
      [5, 4, 1],
    ],
    0,
    [0, -2, 1, 2, 4, INF],
  ],
];

for (const [name, n, edges, src, want] of CASES) {
  test(`정본 — ${name}`, () => {
    expect(spfa(n, edges, src)).toEqual(want);
  });
}

test("한 정점이 여러 번 꺼내지는 그래프에서도 거리는 정확하다", () => {
  // 사슬이 허브로 들어가면 허브의 값이 사슬을 지날 때마다 작아진다.
  const M = 16;
  const H = M + 1;
  const edges: Edge[] = [[0, 1, 100]];
  for (let i = 1; i < M; i++) edges.push([i, i + 1, 1]);
  for (let i = 1; i <= M; i++) edges.push([i, H, 2 * (M - i)]);
  edges.push([H, H + 1, 1]);

  const got = spfa(H + 2, edges, 0);
  // 사슬 끝(정점 16)까지 100 + 15 = 115, 거기서 허브까지 가중치 0 이다.
  expect(got[M]).toBe(115);
  expect(got[H]).toBe(115);
  expect(got[H + 1]).toBe(116);
});

test("정점 200 개 · 간선 600 개 그래프에서 결과가 바퀴 방식과 같다", () => {
  const V = 200;
  const edges: Edge[] = [];
  for (let i = 0; i + 1 < V; i++) edges.push([i, i + 1, 1]);
  let seed = 42;
  const next = (): number => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed;
  };
  for (let i = 0; i < V * 2; i++) {
    const u = next() % V;
    const v = next() % V;
    const w = (next() % 100) + 1;
    edges.push([u, v, w]);
  }

  // 바퀴 방식을 그 자리에서 세워 답을 대조한다. 두 절차는 같은 답을 내야 한다.
  const dist = Array.from({ length: V }, () => INF);
  dist[0] = 0;
  for (let round = 1; round < V; round++) {
    let changed = false;
    for (const [u, v, w] of edges) {
      if (dist[u] === INF) continue;
      const nd = (dist[u] as number) + w;
      if (nd < (dist[v] as number)) {
        dist[v] = nd;
        changed = true;
      }
    }
    if (!changed) break;
  }

  expect(spfa(V, edges, 0)).toEqual(dist);
});

test("음수 간선이 섞인 큰 그래프에서도 바퀴 방식과 같은 답을 낸다", () => {
  const V = 500;
  const edges: Edge[] = [];
  let seed = 20260905;
  const next = (): number => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed;
  };
  // 앞으로만 가는 간선이라 음수 사이클이 생기지 않는다.
  for (let i = 0; i + 1 < V; i++) edges.push([i, i + 1, (next() % 100) + 1]);
  for (let i = 0; i < V * 3; i++) {
    const u = next() % V;
    const v = next() % V;
    if (u >= v) continue;
    edges.push([u, v, (next() % 200) - 50]);
  }

  const dist = Array.from({ length: V }, () => INF);
  dist[0] = 0;
  for (let round = 1; round < V; round++) {
    let changed = false;
    for (const [u, v, w] of edges) {
      if (dist[u] === INF) continue;
      const nd = (dist[u] as number) + w;
      if (nd < (dist[v] as number)) {
        dist[v] = nd;
        changed = true;
      }
    }
    if (!changed) break;
  }

  expect(spfa(V, edges, 0)).toEqual(dist);
});
