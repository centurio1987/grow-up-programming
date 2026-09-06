/**
 * L9 — 가이드가 싣는 코드가 **기존 테스트의 입출력 케이스**를 통과하는가.
 *
 * 원본 `src/algorithms/tree/subtreeSumQuery/subtreeSumQuery.test.ts` 는 학습자 스텁을
 * 가져오므로 그대로 재사용할 수 없다. **케이스만** 옮겨 정본(`subtreeSumQuery-guide.ref.ts`)에
 * 다시 건다.
 *
 * 벽시계를 재는 케이스(정점 100,000 을 100ms 안에)는 옮기지 않았다 — 실행마다 값이 달라
 * 판정이 안 된다. 같은 규모를 **기본 연산 수**로 재는 자리는 「최악을 만드는 입력」이 진다.
 * 대신 그 규모에서 **답이 맞는지**와 **호출 스택 한계를 안 넘는지**는 여기서 본다.
 */
import { expect, test } from "bun:test";
import { SubtreeSumQuery } from "./subtreeSumQuery-guide.ref.ts";

type Edges = [number, number][];

/** 갱신 없이 질의만 하는 케이스. `[이름, n, 간선, 뿌리, 값, [정점, 기대값][]]` */
const QUERY_CASES: [
  string,
  number,
  Edges,
  number,
  number[],
  [number, number][],
][] = [
  ["단일 노드 트리, 뿌리의 부분 트리 합은 뿌리 값", 1, [], 0, [42], [[0, 42]]],
  [
    "두 노드 트리",
    2,
    [[0, 1]],
    0,
    [1, 2],
    [
      [0, 3],
      [1, 2],
    ],
  ],
  [
    "작은 트리에서 부분 트리 합",
    4,
    [
      [0, 1],
      [0, 2],
      [1, 3],
    ],
    0,
    [1, 2, 3, 4],
    [
      [0, 10],
      [1, 6],
      [2, 3],
      [3, 4],
    ],
  ],
  [
    "사슬 트리에서 각 정점의 부분 트리 합",
    5,
    [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
    ],
    0,
    [1, 2, 3, 4, 5],
    [
      [0, 15],
      [1, 14],
      [2, 12],
      [3, 9],
      [4, 5],
    ],
  ],
  [
    "별 트리에서 부분 트리 합",
    5,
    [
      [0, 1],
      [0, 2],
      [0, 3],
      [0, 4],
    ],
    0,
    [10, 1, 2, 3, 4],
    [
      [0, 20],
      [1, 1],
      [4, 4],
    ],
  ],
  [
    "값이 음수인 경우",
    3,
    [
      [0, 1],
      [0, 2],
    ],
    0,
    [-1, -2, -3],
    [[0, -6]],
  ],
  [
    "문제 예시의 여섯 정점 트리 — 본문 전개가 쓰는 입력",
    6,
    [
      [0, 1],
      [0, 2],
      [1, 3],
      [1, 4],
      [2, 5],
    ],
    0,
    [1, 2, 3, 4, 5, 6],
    [
      [0, 21],
      [1, 11],
      [2, 9],
      [3, 4],
    ],
  ],
];

for (const [name, n, edges, root, values, asks] of QUERY_CASES) {
  test(`정본 — ${name}`, () => {
    const sst = new SubtreeSumQuery(n, edges, root, values);
    for (const [node, want] of asks) {
      expect(sst.querySubtree(node)).toBe(want);
    }
  });
}

test("정본 — update 후 query 결과가 갱신된다", () => {
  const sst = new SubtreeSumQuery(
    3,
    [
      [0, 1],
      [0, 2],
    ],
    0,
    [1, 2, 3],
  );
  expect(sst.querySubtree(0)).toBe(6);
  sst.update(1, 10);
  expect(sst.querySubtree(0)).toBe(14);
  expect(sst.querySubtree(1)).toBe(10);
});

test("정본 — update 로 음수 값을 설정", () => {
  const sst = new SubtreeSumQuery(2, [[0, 1]], 0, [5, 5]);
  sst.update(1, -10);
  expect(sst.querySubtree(0)).toBe(-5);
});

test("정본 — n=1 단일 노드에서 update 와 query", () => {
  const sst = new SubtreeSumQuery(1, [], 0, [0]);
  expect(sst.querySubtree(0)).toBe(0);
  sst.update(0, 100);
  expect(sst.querySubtree(0)).toBe(100);
});

test("정본 — 같은 정점에 update 를 여러 번", () => {
  const sst = new SubtreeSumQuery(2, [[0, 1]], 0, [1, 1]);
  sst.update(1, 5);
  sst.update(1, 7);
  expect(sst.querySubtree(0)).toBe(8);
});

test("정본 — 문제 예시의 갱신 뒤 값", () => {
  const sst = new SubtreeSumQuery(
    6,
    [
      [0, 1],
      [0, 2],
      [1, 3],
      [1, 4],
      [2, 5],
    ],
    0,
    [1, 2, 3, 4, 5, 6],
  );
  sst.update(4, 10);
  expect(sst.querySubtree(1)).toBe(16);
  expect(sst.querySubtree(0)).toBe(26);
});

/** 뿌리를 정해 놓고 부분 트리를 정의 그대로 훑어 더한다. */
function bruteForce(
  n: number,
  edges: Edges,
  root: number,
  values: number[],
  node: number,
): number {
  const near: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    (near[u] as number[]).push(v);
    (near[v] as number[]).push(u);
  }
  const seen: boolean[] = Array.from({ length: n }, () => false);
  const parent: number[] = Array.from({ length: n }, () => -1);
  const stack = [root];
  seen[root] = true;
  while (stack.length > 0) {
    const u = stack.pop() as number;
    for (const w of near[u] as number[]) {
      if (seen[w] === true) continue;
      seen[w] = true;
      parent[w] = u;
      stack.push(w);
    }
  }
  let sum = 0;
  for (let x = 0; x < n; x++) {
    let c = x;
    while (c !== -1) {
      if (c === node) {
        sum += values[x] as number;
        break;
      }
      c = parent[c] as number;
    }
  }
  return sum;
}

test("정본 — 생성식으로 만든 트리 200 벌에서 정의 그대로 센 값과 같다", () => {
  let seed = 20260906;
  const next = (): number => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed;
  };
  for (let round = 0; round < 200; round++) {
    const n = 1 + (next() % 30);
    const edges: Edges = [];
    for (let v = 1; v < n; v++) edges.push([next() % v, v]);
    const root = next() % n;
    const values = Array.from({ length: n }, () => (next() % 41) - 20);
    const sst = new SubtreeSumQuery(n, edges, root, values);

    for (let step = 0; step < 8; step++) {
      const node = next() % n;
      const fresh = (next() % 41) - 20;
      sst.update(node, fresh);
      values[node] = fresh;
      const ask = next() % n;
      expect(sst.querySubtree(ask)).toBe(
        bruteForce(n, edges, root, values, ask),
      );
    }
  }
});

test("정본 — 정점 100,000 짜리 사슬에서 답이 맞고 호출 스택 한계를 안 넘는다", () => {
  const n = 100_000;
  const edges: Edges = [];
  for (let i = 0; i + 1 < n; i++) edges.push([i, i + 1]);
  const values = Array.from({ length: n }, () => 1);

  // 재귀로 적었으면 이 깊이에서 호출 스택 한계를 넘는다. 배열 스택이라 넘지 않는다.
  const sst = new SubtreeSumQuery(n, edges, 0, values);
  expect(sst.querySubtree(0)).toBe(n);
  expect(sst.querySubtree(1)).toBe(n - 1);
  expect(sst.querySubtree(n - 1)).toBe(1);

  sst.update(n - 1, 1_000);
  expect(sst.querySubtree(0)).toBe(n - 1 + 1_000);
  expect(sst.querySubtree(n - 1)).toBe(1_000);
});

test("정본 — 정점 100,000 짜리 별에서 가운데와 잎이 갈린다", () => {
  const n = 100_000;
  const edges: Edges = [];
  for (let i = 1; i < n; i++) edges.push([0, i]);
  const values = Array.from({ length: n }, () => 1);

  const sst = new SubtreeSumQuery(n, edges, 0, values);
  expect(sst.querySubtree(0)).toBe(n);
  for (let i = 0; i < 500; i++) sst.update(1 + (i % (n - 1)), 2);
  expect(sst.querySubtree(0)).toBe(n + 500);
  expect(sst.querySubtree(1)).toBe(2);
});

test("정본 — 뿌리가 0 이 아니어도 부분 트리가 그 뿌리 기준으로 정해진다", () => {
  const edges: Edges = [
    [0, 1],
    [0, 2],
    [1, 3],
    [1, 4],
    [2, 5],
  ];
  const sst = new SubtreeSumQuery(6, edges, 3, [1, 2, 3, 4, 5, 6]);
  // 뿌리가 3 이면 1 이 3 의 자식이고 0 이 1 의 자식이다.
  expect(sst.querySubtree(3)).toBe(21);
  expect(sst.querySubtree(1)).toBe(17);
  expect(sst.querySubtree(0)).toBe(10);
  expect(sst.querySubtree(4)).toBe(5);
});
