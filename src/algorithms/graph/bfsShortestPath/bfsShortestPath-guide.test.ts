/**
 * L9 — 가이드가 싣는 코드가 **기존 테스트의 입출력 케이스**를 통과하는가.
 *
 * 원본 `src/algorithms/graph/bfsShortestPath/bfsShortestPath.test.ts` 는 학습자 스텁을
 * 가져오므로 그대로 재사용할 수 없다. **케이스만** 옮겨 정본에 다시 건다.
 * 벽시계를 재는 케이스(`V=10^5` 체인을 100ms 안에)는 옮기지 않았다 — 실행마다 값이 달라
 * 판정이 안 된다. 같은 규모를 **연산 수**로 재는 자리는 「최악을 만드는 입력」이 진다.
 */
import { expect, test } from "bun:test";
import { bfsShortestPath } from "./bfsShortestPath-guide.ref.ts";

const CASES: [string, number, [number, number][], number, number[]][] = [
  [
    "직선 그래프 0-1-2-3, source=0",
    4,
    [
      [0, 1],
      [1, 2],
      [2, 3],
    ],
    0,
    [0, 1, 2, 3],
  ],
  [
    "사이클 그래프 — 더 짧은 경로를 고른다",
    4,
    [
      [0, 1],
      [0, 2],
      [1, 3],
      [2, 3],
    ],
    0,
    [0, 1, 1, 2],
  ],
  [
    "source 가 중간 정점인 경우",
    5,
    [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
    ],
    2,
    [2, 1, 0, 1, 2],
  ],
  [
    "도달할 수 없는 정점은 -1",
    4,
    [
      [0, 1],
      [2, 3],
    ],
    0,
    [0, 1, -1, -1],
  ],
  ["간선이 전혀 없으면 source 만 0", 4, [], 1, [-1, 0, -1, -1]],
  [
    "자기 루프는 거리에 영향이 없다",
    2,
    [
      [0, 0],
      [0, 1],
    ],
    0,
    [0, 1],
  ],
  ["V=1, 자기 자신만 source", 1, [], 0, [0]],
  ["V=2, 간선 1개", 2, [[0, 1]], 0, [0, 1]],
];

for (const [name, n, edges, source, want] of CASES) {
  test(`정본 — ${name}`, () => {
    expect(bfsShortestPath(n, edges, source)).toEqual(want);
  });
}

test("본문 전개가 쓰는 고정 입력", () => {
  expect(
    bfsShortestPath(
      6,
      [
        [0, 1],
        [1, 2],
        [2, 3],
        [3, 4],
        [4, 0],
      ],
      0,
    ),
  ).toEqual([0, 1, 2, 2, 1, -1]);
});

test("최악을 만드는 입력도 거리는 정확하다", () => {
  // 별 모양 — 큐 동시 재고가 V-1 로 가장 커지는 입력.
  const V = 1000;
  const star: [number, number][] = [];
  for (let i = 1; i < V; i++) star.push([0, i]);
  const got = bfsShortestPath(V, star, 0);
  expect(got[0]).toBe(0);
  expect(got.slice(1).every((d) => d === 1)).toBe(true);

  // 체인 — 최대 거리가 V-1 로 가장 커지는 입력.
  const chain: [number, number][] = [];
  for (let i = 0; i < V - 1; i++) chain.push([i, i + 1]);
  expect(bfsShortestPath(V, chain, 0)[V - 1]).toBe(V - 1);
});
