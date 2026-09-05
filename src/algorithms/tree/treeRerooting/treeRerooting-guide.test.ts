/**
 * L9 — 가이드가 싣는 코드가 **기존 테스트의 입출력 케이스**를 통과하는가.
 *
 * 원본 `src/algorithms/tree/treeRerooting/treeRerooting.test.ts` 는 학습자 스텁을 가져오므로
 * 그대로 재사용할 수 없다. **케이스만** 옮겨 정본(`treeRerooting-guide.ref.ts`)에 다시 건다.
 * 벽시계를 재는 케이스(정점 100,000 을 100ms 안에)는 옮기지 않았다 — 실행마다 값이 달라
 * 판정이 안 된다. 같은 규모를 **기본 연산 수**로 재는 자리는 「최악을 만드는 입력」이 진다.
 */
import { expect, test } from "bun:test";
import { treeRerooting } from "./treeRerooting-guide.ref.ts";

type Edges = [number, number][];

const CASES: [string, number, Edges, number[]][] = [
  ["단일 노드, 거리 합은 0", 1, [], [0]],
  ["두 노드, 각 정점은 다른 한 정점까지 거리 1", 2, [[0, 1]], [1, 1]],
  [
    "세 정점 경로 0-1-2",
    3,
    [
      [0, 1],
      [1, 2],
    ],
    [3, 2, 3],
  ],
  [
    "작은 분기 트리",
    4,
    [
      [0, 1],
      [0, 2],
      [1, 3],
    ],
    [4, 4, 6, 6],
  ],
  [
    "체인 트리 (정점 5)",
    5,
    [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
    ],
    [10, 7, 6, 7, 10],
  ],
  [
    "스타 트리 (정점 5)",
    5,
    [
      [0, 1],
      [0, 2],
      [0, 3],
      [0, 4],
    ],
    [4, 7, 7, 7, 7],
  ],
  [
    "균형 이진 트리 깊이 2",
    7,
    [
      [0, 1],
      [0, 2],
      [1, 3],
      [1, 4],
      [2, 5],
      [2, 6],
    ],
    [10, 11, 11, 16, 16, 16, 16],
  ],
  [
    "정점 순서가 뒤섞인 간선 입력",
    3,
    [
      [2, 1],
      [1, 0],
    ],
    [3, 2, 3],
  ],
  ["간선이 [1, 0] 으로 들어와도 같다", 2, [[1, 0]], [1, 1]],
  [
    "문제 예시의 다섯 정점 트리",
    5,
    [
      [0, 1],
      [0, 2],
      [1, 3],
      [1, 4],
    ],
    [6, 5, 9, 8, 8],
  ],
  [
    "본문 전개가 쓰는 고정 입력",
    7,
    [
      [0, 1],
      [0, 2],
      [1, 3],
      [1, 4],
      [2, 5],
      [5, 6],
    ],
    [11, 12, 12, 17, 17, 15, 20],
  ],
];

for (const [name, n, edges, want] of CASES) {
  test(`정본 — ${name}`, () => {
    expect(treeRerooting(n, edges)).toEqual(want);
  });
}

/** 정점 하나에서 너비 우선 탐색으로 거리 합을 직접 구한다. */
function bruteForce(n: number, edges: Edges): number[] {
  const near: number[][] = Array.from({ length: n }, () => []);
  for (const [a, b] of edges) {
    (near[a] as number[]).push(b);
    (near[b] as number[]).push(a);
  }
  const out: number[] = [];
  for (let s = 0; s < n; s++) {
    const dist: number[] = Array.from({ length: n }, () => -1);
    dist[s] = 0;
    const queue = [s];
    let sum = 0;
    for (let head = 0; head < queue.length; head++) {
      const u = queue[head] as number;
      sum += dist[u] as number;
      for (const w of near[u] as number[]) {
        if ((dist[w] as number) >= 0) continue;
        dist[w] = (dist[u] as number) + 1;
        queue.push(w);
      }
    }
    out.push(sum);
  }
  return out;
}

test("생성식으로 만든 트리 300 벌에서 정점마다 탐색한 답과 같다", () => {
  let seed = 20260905;
  const next = (): number => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed;
  };
  for (let round = 0; round < 300; round++) {
    const n = 1 + (next() % 40);
    const edges: Edges = [];
    for (let v = 1; v < n; v++) edges.push([next() % v, v]);
    expect(treeRerooting(n, edges)).toEqual(bruteForce(n, edges));
  }
});

test("정점 100,000 짜리 사슬에서 양 끝의 답이 N(N-1)/2 이다", () => {
  const n = 100_000;
  const edges: Edges = [];
  for (let i = 0; i + 1 < n; i++) edges.push([i, i + 1]);

  const got = treeRerooting(n, edges);
  expect(got).toHaveLength(n);
  expect(got[0]).toBe((n * (n - 1)) / 2);
  expect(got[n - 1]).toBe((n * (n - 1)) / 2);
  // 재귀로 적었으면 이 깊이에서 호출 스택 한계를 넘는다. 배열 스택이라 넘지 않는다.
  expect(got[n / 2]).toBe(2_500_000_000);
});

test("정점 100,000 짜리 별에서 가운데와 잎의 답이 갈린다", () => {
  const n = 100_000;
  const edges: Edges = [];
  for (let i = 1; i < n; i++) edges.push([0, i]);

  const got = treeRerooting(n, edges);
  expect(got).toHaveLength(n);
  expect(got[0]).toBe(n - 1);
  expect(got[1]).toBe(1 + (n - 2) * 2);
});

test("답의 합이 간선 분할로 센 값의 두 배와 같다", () => {
  const n = 15;
  const edges: Edges = [];
  for (let i = 1; i < n; i++) edges.push([(i - 1) >> 1, i]);

  const total = treeRerooting(n, edges).reduce((s, x) => s + x, 0);
  // 자리 `i` 의 부분트리 크기는 완전 이진 트리라 손으로 셀 수 있다.
  const size = Array.from({ length: n }, () => 1);
  for (let i = n - 1; i >= 1; i--) {
    const p = (i - 1) >> 1;
    size[p] = (size[p] as number) + (size[i] as number);
  }
  let byEdge = 0;
  for (let i = 1; i < n; i++)
    byEdge += (size[i] as number) * (n - (size[i] as number));
  expect(total).toBe(2 * byEdge);
});
