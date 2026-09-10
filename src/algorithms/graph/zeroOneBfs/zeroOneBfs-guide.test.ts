/**
 * L9 — 가이드가 싣는 코드가 **기존 테스트의 입출력 케이스**를 통과하는가.
 *
 * 원본 `src/algorithms/graph/zeroOneBfs/zeroOneBfs.test.ts` 는 학습자 스텁을 가져오므로
 * 그대로 재사용할 수 없다. **케이스만** 옮겨 정본(`zeroOneBfs-guide.ref.ts`)에 다시 건다.
 * 벽시계를 재는 케이스(`V=10^5` 사슬을 100ms 안에)는 옮기지 않았다 — 실행마다 값이 달라
 * 판정이 안 된다. 같은 규모를 **연산 수**로 재는 자리는 「최악을 만드는 입력」이 진다.
 */
import { expect, test } from "bun:test";
import { type Edge, zeroOneBfs } from "./zeroOneBfs-guide.ref.ts";

const CASES: [string, number, Edge[], number, number[]][] = [
  [
    "모든 간선 가중치 1 — 간선 수가 곧 거리다",
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
    "모든 간선 가중치 0 — 모두 거리 0",
    4,
    [
      [0, 1, 0],
      [1, 2, 0],
      [2, 3, 0],
    ],
    0,
    [0, 0, 0, 0],
  ],
  [
    "0 과 1 이 섞인 그래프 — 비용 0 쪽이 이긴다고 적지 않고 값으로 확인한다",
    4,
    [
      [0, 1, 1],
      [1, 2, 1],
      [0, 3, 0],
      [3, 2, 0],
    ],
    0,
    [0, 1, 0, 0],
  ],
  [
    "가중치 0 간선을 거쳐도 1 인 정점",
    3,
    [
      [0, 1, 1],
      [0, 2, 0],
      [2, 1, 1],
    ],
    0,
    [0, 1, 0],
  ],
  [
    "도달할 수 없는 정점은 -1",
    4,
    [
      [0, 1, 1],
      [2, 3, 0],
    ],
    0,
    [0, 1, -1, -1],
  ],
  ["시작 정점만 있는 경우 — 자기 자신은 0", 3, [], 1, [-1, 0, -1]],
  [
    "가중치 0 사이클 — 반복이 끝난다",
    3,
    [
      [0, 1, 0],
      [1, 2, 0],
      [2, 0, 0],
    ],
    0,
    [0, 0, 0],
  ],
  ["정점 하나", 1, [], 0, [0]],
  ["정점 둘, 가중치 1 간선 하나", 2, [[0, 1, 1]], 0, [0, 1]],
  ["정점 둘, 가중치 0 간선 하나", 2, [[0, 1, 0]], 0, [0, 0]],
  [
    "방향 그래프 — 역방향 간선은 쓸 수 없다",
    2,
    [
      [1, 0, 1],
      [0, 1, 0],
    ],
    1,
    [1, 0],
  ],
  [
    "같은 두 정점에 간선이 둘 — 작은 쪽이 남는다",
    2,
    [
      [0, 1, 1],
      [0, 1, 0],
    ],
    0,
    [0, 0],
  ],
  [
    "자기 자신을 가리키는 간선은 거리에 영향이 없다",
    2,
    [
      [0, 0, 0],
      [0, 0, 1],
      [0, 1, 1],
    ],
    0,
    [0, 1],
  ],
  [
    "본문 전개가 쓰는 고정 입력",
    6,
    [
      [0, 1, 1],
      [0, 2, 0],
      [2, 1, 0],
      [2, 3, 1],
      [1, 3, 1],
      [3, 4, 0],
    ],
    0,
    [0, 0, 0, 1, 1, -1],
  ],
];

for (const [name, n, edges, source, want] of CASES) {
  test(`정본 — ${name}`, () => {
    expect(zeroOneBfs(n, edges, source)).toEqual(want);
  });
}

test("0/1 사슬 10^5 — 거리가 정확하다", () => {
  const V = 100_000;
  const edges: Edge[] = [];
  for (let i = 0; i + 1 < V; i++) edges.push([i, i + 1, i % 2]);

  const got = zeroOneBfs(V, edges, 0);
  expect(got[0]).toBe(0);
  // 간선 가중치가 0 1 0 1 … 이므로 정점 `i` 까지의 거리는 `⌊i / 2⌋` 다.
  expect(got[1]).toBe(0);
  expect(got[2]).toBe(1);
  expect(got[V - 1]).toBe(Math.floor((V - 1) / 2));
});

test("최악을 만드는 입력도 거리는 정확하다", () => {
  // 별 — 덱이 한 번에 가장 많은 항목을 담는 모양.
  const V = 1_000;
  const star: Edge[] = [];
  for (let i = 1; i < V; i++) star.push([0, i, 1]);
  const fromStar = zeroOneBfs(V, star, 0);
  expect(fromStar[0]).toBe(0);
  expect(fromStar.slice(1).every((d) => d === 1)).toBe(true);

  // 두 번 그래프 — 모든 `aᵢ` 가 1 로 적혔다가 0 으로 고쳐진다.
  const k = 300;
  const twice: Edge[] = [];
  for (let i = 1; i <= k; i++) twice.push([0, i, 1]);
  twice.push([0, k + 1, 0]);
  for (let i = 1; i <= k; i++) twice.push([k + 1, i, 0]);
  for (let i = 1; i <= k; i++) twice.push([i, k + 2, 1]);
  const fromTwice = zeroOneBfs(k + 3, twice, 0);
  expect(fromTwice.slice(1, k + 1).every((d) => d === 0)).toBe(true);
  expect(fromTwice[k + 1]).toBe(0);
  expect(fromTwice[k + 2]).toBe(1);
});
