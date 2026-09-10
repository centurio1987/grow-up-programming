/**
 * L9 — 가이드가 싣는 코드가 **기존 테스트의 입출력 케이스**를 통과하는가.
 *
 * 원본 `src/algorithms/graph/topologicalSort/topologicalSort.test.ts` 는 학습자 스텁을
 * 가져오므로 그대로 재사용할 수 없다. **케이스만** 옮겨 정본에 다시 건다. 판정 함수
 * `isValidTopologicalOrder` 도 원본의 것을 그대로 옮겼다 — 이 문제는 유효한 순열이 여럿이라
 * 특정 배열과 대조하는 것이 아니라 **유효성**을 봐야 한다.
 *
 * 벽시계를 재는 케이스(`V=10^5` 체인을 100ms 안에)는 그대로 옮기지 않았다 — 실행마다 값이
 * 달라 판정이 안 된다. 그 케이스가 실제로 지키던 것은 **정점 100,000 이 한 줄로 이어져도
 * 결과가 나온다**는 것이라, 아래에서 순열 유효성과 양 끝 값으로 다시 건다. 같은 규모의
 * 비용은 「최악을 만드는 입력」이 배열 칸 접근 수로 진다.
 */
import { expect, test } from "bun:test";
import { topologicalSort } from "./topologicalSort-guide.ref.ts";

/**
 * 유효한 위상 정렬인지 검증한다.
 * - 모든 정점이 정확히 한 번씩 등장하는 순열인지
 * - 모든 간선 `[u, v]` 에 대해 `u` 가 `v` 보다 앞에 오는지
 */
function isValidTopologicalOrder(
  order: number[],
  n: number,
  edges: [number, number][],
): boolean {
  if (order.length !== n) return false;

  const position = new Array<number>(n).fill(-1);
  for (let i = 0; i < order.length; i++) {
    const v = order[i] as number;
    if (v < 0 || v >= n) return false;
    if (position[v] !== -1) return false;
    position[v] = i;
  }
  for (let i = 0; i < n; i++) if (position[i] === -1) return false;

  for (const [u, v] of edges) {
    if ((position[u] as number) >= (position[v] as number)) return false;
  }
  return true;
}

const VALID: [string, number, [number, number][]][] = [
  [
    "선형 체인 DAG",
    4,
    [
      [0, 1],
      [1, 2],
      [2, 3],
    ],
  ],
  [
    "다이아몬드 DAG",
    4,
    [
      [0, 1],
      [0, 2],
      [1, 3],
      [2, 3],
    ],
  ],
  [
    "분리된 두 DAG",
    4,
    [
      [0, 1],
      [2, 3],
    ],
  ],
  [
    "복잡한 DAG",
    6,
    [
      [5, 2],
      [5, 0],
      [4, 0],
      [4, 1],
      [2, 3],
      [3, 1],
    ],
  ],
  ["간선이 없는 그래프 — 모든 순열이 유효", 4, []],
];

for (const [name, n, edges] of VALID) {
  test(`정본 — ${name}`, () => {
    const result = topologicalSort(n, edges);
    expect(result).not.toBeNull();
    expect(isValidTopologicalOrder(result as number[], n, edges)).toBe(true);
  });
}

const CYCLIC: [string, number, [number, number][]][] = [
  [
    "단순 사이클",
    3,
    [
      [0, 1],
      [1, 2],
      [2, 0],
    ],
  ],
  ["자기 루프", 1, [[0, 0]]],
  [
    "부분적으로 사이클을 포함한 그래프",
    4,
    [
      [0, 1],
      [1, 2],
      [2, 1],
    ],
  ],
];

for (const [name, n, edges] of CYCLIC) {
  test(`정본 — ${name} → null`, () => {
    expect(topologicalSort(n, edges)).toBeNull();
  });
}

test("정본 — V=1, 간선 없음", () => {
  expect(topologicalSort(1, [])).toEqual([0]);
});

test("정본 — V=2, 간선 1개", () => {
  expect(topologicalSort(2, [[0, 1]])).toEqual([0, 1]);
});

test("입력 edges 배열을 변형하지 않는다", () => {
  const edges: [number, number][] = [
    [5, 2],
    [5, 0],
    [4, 0],
  ];
  const snapshot = JSON.stringify(edges);
  topologicalSort(6, edges);
  expect(JSON.stringify(edges)).toBe(snapshot);
});

test("본문 전개가 쓰는 고정 입력", () => {
  expect(
    topologicalSort(6, [
      [5, 2],
      [5, 0],
      [4, 0],
      [4, 1],
      [2, 3],
      [3, 1],
    ]),
  ).toEqual([4, 5, 2, 0, 3, 1]);
});

test("정점 100,000 이 한 줄로 이어져도 결과가 나온다", () => {
  // 원본의 벽시계 케이스가 지키던 것 — 호출 깊이가 아니라 배열 길이로 깊이를 잡는다.
  const V = 100_000;
  const edges: [number, number][] = [];
  for (let i = 0; i < V - 1; i++) edges.push([i, i + 1]);
  const got = topologicalSort(V, edges);
  expect(got).not.toBeNull();
  expect((got as number[]).length).toBe(V);
  expect((got as number[])[0]).toBe(0);
  expect((got as number[])[V - 1]).toBe(V - 1);
});

test("최악을 만드는 입력도 순열이 유효하다", () => {
  // 별 모양 — 정점 0 을 꺼내는 한 번에 99,999 개가 한꺼번에 큐에 담긴다.
  const V = 1_000;
  const edges: [number, number][] = [];
  for (let i = 1; i < V; i++) edges.push([0, i]);
  const got = topologicalSort(V, edges);
  expect(got).not.toBeNull();
  expect(isValidTopologicalOrder(got as number[], V, edges)).toBe(true);
});
