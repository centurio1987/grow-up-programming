/**
 * L9 — 가이드가 싣는 코드가 **기존 테스트의 입출력 케이스**를 통과하는가.
 *
 * 원본 `src/algorithms/graph-flow/minCostMaxFlow/minCostMaxFlow.test.ts` 는 학습자 스텁을
 * 가져오므로 그대로 재사용할 수 없다. **케이스만** 옮겨 정본(`minCostMaxFlow-guide.ref.ts`)에
 * 다시 건다. 벽시계를 재는 케이스(`V=102` 네트워크를 500ms 안에)는 옮기지 않았다 — 실행마다
 * 값이 달라 판정이 안 된다. 같은 규모를 **연산 수**로 재는 자리는 「최악을 만드는 입력」이 진다.
 *
 * 마지막 두 벌은 원본에 없는 것이다 — 원고가 값을 내미는 자리(전개 입력과 다익스트라 반례)를
 * 테스트로도 묶어 둔다.
 */
import { expect, test } from "bun:test";
import { type FlowEdge, minCostMaxFlow } from "./minCostMaxFlow-guide.ref.ts";

const CASES: [string, number, FlowEdge[], number, number, number, number][] = [
  [
    "두 경로 — 단위 비용이 작고 좁은 쪽과 크고 넓은 쪽을 합친다",
    4,
    [
      [0, 1, 1, 1],
      [1, 3, 1, 1],
      [0, 2, 2, 5],
      [2, 3, 2, 5],
    ],
    0,
    3,
    3,
    22,
  ],
  [
    "직렬 경로 — 단위 비용의 합에 유량을 곱한다",
    3,
    [
      [0, 1, 5, 2],
      [1, 2, 5, 3],
    ],
    0,
    2,
    5,
    25,
  ],
  [
    "두 정점을 각각 거치는 경로를 견주고 합친다",
    4,
    [
      [0, 1, 2, 1],
      [1, 3, 2, 1],
      [0, 2, 3, 10],
      [2, 3, 3, 10],
    ],
    0,
    3,
    5,
    64,
  ],
  ["싱크로 가는 경로가 없다", 3, [[0, 1, 10, 5]], 0, 2, 0, 0],
  ["간선이 하나도 없다", 2, [], 0, 1, 0, 0],
  ["소스와 싱크를 잇는 간선 하나", 2, [[0, 1, 7, 3]], 0, 1, 7, 21],
  [
    "단위 비용이 0 이면 총비용도 0",
    3,
    [
      [0, 1, 5, 0],
      [1, 2, 5, 0],
    ],
    0,
    2,
    5,
    0,
  ],
  [
    "용량이 0 인 간선은 쓰지 못한다",
    3,
    [
      [0, 1, 0, 100],
      [0, 2, 3, 1],
      [2, 1, 3, 1],
    ],
    0,
    1,
    3,
    6,
  ],
  [
    "단위 비용이 작은 경로를 다 쓴 뒤에 큰 경로를 쓴다",
    3,
    [
      [0, 1, 1, 1],
      [1, 2, 1, 1],
      [0, 2, 10, 100],
    ],
    0,
    2,
    11,
    1002,
  ],
  ["정점 둘 · 단위 비용 0", 2, [[0, 1, 1, 0]], 0, 1, 1, 0],
  [
    "용량과 단위 비용이 둘 다 제약 상한",
    3,
    [
      [0, 1, 10_000, 10_000],
      [1, 2, 10_000, 10_000],
    ],
    0,
    2,
    10_000,
    200_000_000,
  ],
  [
    "전개 입력 — 역방향 항목을 지나는 라운드가 있다",
    4,
    [
      [0, 1, 3, 1],
      [0, 2, 3, 4],
      [1, 2, 2, 1],
      [1, 3, 3, 6],
      [2, 3, 4, 1],
    ],
    0,
    3,
    6,
    32,
  ],
  [
    "다익스트라로 바꾸면 갈리는 배치",
    5,
    [
      [2, 3, 1, 1],
      [3, 4, 1, 0],
      [0, 2, 1, 0],
      [1, 2, 1, 4],
      [1, 3, 1, 4],
      [2, 4, 1, 2],
      [0, 1, 1, 0],
    ],
    0,
    4,
    2,
    6,
  ],
];

for (const [label, n, edges, source, sink, flow, cost] of CASES) {
  test(label, () => {
    expect(minCostMaxFlow(n, edges, source, sink)).toEqual({ flow, cost });
  });
}

test("같은 목록을 두 번 넘겨도 결과가 같다 — 입력을 고치지 않는다", () => {
  const edges: FlowEdge[] = [
    [0, 1, 3, 1],
    [0, 2, 3, 4],
    [1, 2, 2, 1],
    [1, 3, 3, 6],
    [2, 3, 4, 1],
  ];
  const first = minCostMaxFlow(4, edges, 0, 3);
  const second = minCostMaxFlow(4, edges, 0, 3);
  expect(second).toEqual(first);
});

test("이분 배정 모양 — 정점 102 · 간선 600 에서 답이 정해진다", () => {
  const L = 50;
  const R = 50;
  const left = (i: number): number => 2 + i;
  const right = (j: number): number => 2 + L + j;
  const edges: FlowEdge[] = [];
  for (let i = 0; i < L; i++) edges.push([0, left(i), 1, 0]);
  for (let j = 0; j < R; j++) edges.push([right(j), 1, 1, 0]);
  let seed = 12345;
  for (let i = 0; i < L; i++) {
    for (let k = 0; k < 10; k++) {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      const j = seed % R;
      edges.push([left(i), right(j), 1, (seed % 100) + 1]);
    }
  }
  expect(minCostMaxFlow(2 + L + R, edges, 0, 1)).toEqual({
    flow: 25,
    cost: 1175,
  });
});
