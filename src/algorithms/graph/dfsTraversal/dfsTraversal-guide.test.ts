/**
 * L9 — 가이드가 싣는 코드가 **기존 테스트의 입출력 케이스**를 통과하는가.
 *
 * 원본 `src/algorithms/graph/dfsTraversal/dfsTraversal.test.ts` 는 학습자 스텁을 가져오므로
 * 그대로 재사용할 수 없다. **케이스만** 옮겨 정본에 다시 건다.
 *
 * 벽시계를 재는 케이스(`n=10^5` 체인을 100ms 안에)는 그대로 옮기지 않았다 — 실행마다 값이
 * 달라 판정이 안 된다. 그 케이스가 실제로 지키던 것은 **깊이 100,000 에서도 결과가 나온다**는
 * 것이라, 아래에서 결과 길이와 양 끝 값으로 다시 건다. 같은 규모의 비용은 「최악을 만드는
 * 입력」이 연산 수로 진다.
 */
import { expect, test } from "bun:test";
import { dfsTraversal } from "./dfsTraversal-guide.ref.ts";

const CASES: [string, number, [number, number][], number, number[]][] = [
  [
    "분기 그래프 — 작은 이웃 먼저 깊이 우선",
    5,
    [
      [0, 1],
      [0, 2],
      [1, 3],
      [2, 4],
    ],
    0,
    [0, 1, 3, 2, 4],
  ],
  [
    "이웃 방문 순서는 입력 순서가 아니라 오름차순",
    4,
    [
      [0, 2],
      [0, 1],
      [1, 3],
    ],
    0,
    [0, 1, 3, 2],
  ],
  [
    "시작 정점이 0 이 아닌 경우",
    4,
    [
      [0, 1],
      [1, 2],
      [2, 3],
    ],
    2,
    [2, 1, 0, 3],
  ],
  [
    "도달할 수 없는 정점은 제외한다",
    5,
    [
      [0, 1],
      [2, 3],
    ],
    0,
    [0, 1],
  ],
  [
    "자기 루프와 중복 간선은 결과에 영향이 없다",
    3,
    [
      [0, 0],
      [0, 1],
      [0, 1],
    ],
    0,
    [0, 1],
  ],
  ["고립된 시작 정점", 3, [[0, 1]], 2, [2]],
  ["최소 입력 n=1", 1, [], 0, [0]],
  ["n=2, 간선 1개", 2, [[0, 1]], 0, [0, 1]],
  ["n=2, 간선 없음 — 시작만 반환", 2, [], 1, [1]],
];

for (const [name, n, edges, start, want] of CASES) {
  test(`정본 — ${name}`, () => {
    expect(dfsTraversal(n, edges, start)).toEqual(want);
  });
}

test("입력 edges 배열을 변형하지 않는다", () => {
  const edges: [number, number][] = [
    [0, 2],
    [0, 1],
    [1, 3],
  ];
  const snapshot = JSON.stringify(edges);
  dfsTraversal(4, edges, 0);
  expect(JSON.stringify(edges)).toBe(snapshot);
});

test("본문 전개가 쓰는 고정 입력", () => {
  expect(
    dfsTraversal(
      6,
      [
        [0, 2],
        [0, 1],
        [1, 3],
        [2, 4],
      ],
      0,
    ),
  ).toEqual([0, 1, 3, 2, 4]);
});

test("깊이 100,000 인 체인에서도 결과가 나온다", () => {
  // 원본의 벽시계 케이스가 지키던 것 — 호출 깊이가 아니라 배열 길이로 깊이를 잡는다.
  const V = 100_000;
  const edges: [number, number][] = [];
  for (let i = 0; i < V - 1; i++) edges.push([i, i + 1]);
  const got = dfsTraversal(V, edges, 0);
  expect(got.length).toBe(V);
  expect(got[0]).toBe(0);
  expect(got[V - 1]).toBe(V - 1);
});

test("최악을 만드는 입력도 방문 순서는 정확하다", () => {
  // 별 모양 — 스택 동시 재고가 V-1 로 가장 커지는 입력.
  const V = 1_000;
  const edges: [number, number][] = [];
  for (let i = 1; i < V; i++) edges.push([0, i]);
  const got = dfsTraversal(V, edges, 0);
  expect(got.length).toBe(V);
  expect(got.slice(0, 4)).toEqual([0, 1, 2, 3]);
});
