/**
 * L9 — 가이드가 싣는 코드가 **기존 테스트의 입출력 케이스**를 통과하는가.
 *
 * 원본 `src/algorithms/tree/heavyLightDecomposition/heavyLightDecomposition.test.ts` 는 학습자
 * 스텁을 가져오므로 그대로 재사용할 수 없다. **케이스만** 옮겨 정본에 다시 건다.
 *
 * 벽시계를 재는 케이스 둘(사슬 10,000 개에 연산 5,000 회, 별 모양 100,000 개에 연산 1,000 회를
 * 100ms 안에)은 그대로 옮기지 않았다 — 실행마다 값이 달라 판정이 안 된다. 그 케이스들이 실제로
 * 지키던 것은 **제약 규모에서 호출 깊이에 걸리지 않고 답이 나온다**는 것이라, 아래에서 같은 두
 * 모양의 반환값으로 다시 건다. 같은 규모의 비용은 「최악을 만드는 입력」이 배열 칸 접근 수로 진다.
 *
 * **원본에 없던 케이스 다섯을 더 걸었다.** ① 입력 배열을 변형하지 않는가 ② `queryPath(u, v)` 와
 * `queryPath(v, u)` 가 같은가 ③ 작은 트리 전수에서 경로 합이 실제 경로 위 값의 합인가
 * ④ 뿌리를 바꾸면 경로가 그대로여도 사슬이 달라지는데 답은 같은가 ⑤ 갱신을 섞어도 어긋나지 않는가.
 */
import { expect, test } from "bun:test";
import { HeavyLightDecomposition } from "./heavyLightDecomposition-guide.ref.ts";

type Edge = [number, number];

/** 문제 예시와 원본 테스트가 함께 쓰는 정점 여섯 개짜리 트리. */
const SMALL: Edge[] = [
  [0, 1],
  [0, 2],
  [1, 3],
  [1, 4],
  [2, 5],
];

/* ────────────────────── 원본 테스트에서 옮긴 케이스 ────────────────────── */

test("단일 노드 트리에서 경로 합 = 자기 자신", () => {
  const hld = new HeavyLightDecomposition(1, [], 0, [7]);
  expect(hld.queryPath(0, 0)).toBe(7);
});

test("두 노드 트리에서 경로 합", () => {
  const hld = new HeavyLightDecomposition(2, [[0, 1]], 0, [3, 4]);
  expect(hld.queryPath(0, 1)).toBe(7);
  expect(hld.queryPath(0, 0)).toBe(3);
});

test("작은 트리에서 경로 합", () => {
  const hld = new HeavyLightDecomposition(6, SMALL, 0, [1, 2, 3, 4, 5, 6]);
  expect(hld.queryPath(3, 4)).toBe(4 + 2 + 5);
  expect(hld.queryPath(3, 5)).toBe(4 + 2 + 1 + 3 + 6);
  expect(hld.queryPath(0, 5)).toBe(1 + 3 + 6);
});

test("update 후 경로 합이 갱신된다", () => {
  const hld = new HeavyLightDecomposition(
    3,
    [
      [0, 1],
      [1, 2],
    ],
    0,
    [1, 2, 3],
  );
  expect(hld.queryPath(0, 2)).toBe(6);
  hld.update(1, 10);
  expect(hld.queryPath(0, 2)).toBe(14);
});

test("같은 정점 두 번 입력 시 해당 정점 값만 반환", () => {
  const hld = new HeavyLightDecomposition(
    3,
    [
      [0, 1],
      [1, 2],
    ],
    0,
    [5, 10, 15],
  );
  expect(hld.queryPath(1, 1)).toBe(10);
});

test("체인 트리에서 양 끝점 경로 합 = 전체 합", () => {
  const n = 5;
  const edges: Edge[] = [];
  for (let i = 0; i < n - 1; i++) edges.push([i, i + 1]);
  const hld = new HeavyLightDecomposition(n, edges, 0, [1, 2, 3, 4, 5]);
  expect(hld.queryPath(0, n - 1)).toBe(15);
  expect(hld.queryPath(1, 3)).toBe(2 + 3 + 4);
});

test("스타 트리에서 잎-잎 경로는 중심을 거친다", () => {
  const hld = new HeavyLightDecomposition(
    5,
    [
      [0, 1],
      [0, 2],
      [0, 3],
      [0, 4],
    ],
    0,
    [10, 1, 2, 3, 4],
  );
  expect(hld.queryPath(1, 2)).toBe(1 + 10 + 2);
  expect(hld.queryPath(3, 4)).toBe(3 + 10 + 4);
});

test("음수 값이 포함된 경로", () => {
  const hld = new HeavyLightDecomposition(
    3,
    [
      [0, 1],
      [1, 2],
    ],
    0,
    [-1, -2, -3],
  );
  expect(hld.queryPath(0, 2)).toBe(-6);
});

test("update로 같은 정점 여러 번 갱신", () => {
  const hld = new HeavyLightDecomposition(2, [[0, 1]], 0, [0, 0]);
  hld.update(0, 5);
  hld.update(0, 7);
  expect(hld.queryPath(0, 1)).toBe(7);
});

test("n=1, 자기 자신 경로", () => {
  const hld = new HeavyLightDecomposition(1, [], 0, [100]);
  expect(hld.queryPath(0, 0)).toBe(100);
  hld.update(0, 200);
  expect(hld.queryPath(0, 0)).toBe(200);
});

test("n=2 최소 트리 경로", () => {
  const hld = new HeavyLightDecomposition(2, [[0, 1]], 0, [1, 1]);
  expect(hld.queryPath(1, 0)).toBe(2);
});

test("문제 예시가 그대로 나온다", () => {
  const hld = new HeavyLightDecomposition(6, SMALL, 0, [1, 2, 3, 4, 5, 6]);
  expect(hld.queryPath(3, 4)).toBe(11);
  expect(hld.queryPath(3, 5)).toBe(16);
  expect(hld.queryPath(5, 5)).toBe(6);
  expect(hld.queryPath(0, 5)).toBe(10);
  hld.update(1, 10);
  expect(hld.queryPath(3, 4)).toBe(19);
  expect(hld.queryPath(3, 5)).toBe(24);
});

/* ────────────── 벽시계 케이스를 대신하는 규모 케이스 ────────────── */

test("사슬 10,000 개에서 호출 깊이에 걸리지 않고 답이 나온다", () => {
  const n = 10_000;
  const edges: Edge[] = [];
  for (let i = 0; i < n - 1; i++) edges.push([i, i + 1]);
  const hld = new HeavyLightDecomposition(
    n,
    edges,
    0,
    new Array(n).fill(1) as number[],
  );
  expect(hld.queryPath(0, n - 1)).toBe(n);
  hld.update(5_000, 3);
  expect(hld.queryPath(0, n - 1)).toBe(n + 2);
  expect(hld.queryPath(4_999, 5_001)).toBe(5);
});

test("별 모양 100,000 개에서 답이 나온다", () => {
  const n = 100_000;
  const edges: Edge[] = [];
  for (let i = 1; i < n; i++) edges.push([0, i]);
  const hld = new HeavyLightDecomposition(
    n,
    edges,
    0,
    new Array(n).fill(1) as number[],
  );
  expect(hld.queryPath(1, 2)).toBe(3);
  hld.update(0, 5);
  expect(hld.queryPath(1, 2)).toBe(7);
  expect(hld.queryPath(0, 99_999)).toBe(6);
});

/* ────────────────────────── 더 건 케이스 ────────────────────────── */

test("입력 배열을 변형하지 않는다", () => {
  const edges: Edge[] = [
    [0, 1],
    [0, 2],
    [1, 3],
    [1, 4],
    [2, 5],
  ];
  const values = [1, 2, 3, 4, 5, 6];
  const edgesCopy = edges.map((e) => [...e]);
  const valuesCopy = [...values];
  const hld = new HeavyLightDecomposition(6, edges, 0, values);
  hld.update(2, 99);
  hld.queryPath(3, 5);
  expect(edges).toEqual(edgesCopy as Edge[]);
  expect(values).toEqual(valuesCopy);
});

test("경로는 방향과 무관하다", () => {
  const hld = new HeavyLightDecomposition(6, SMALL, 0, [1, 2, 3, 4, 5, 6]);
  for (let u = 0; u < 6; u++) {
    for (let v = 0; v < 6; v++) {
      expect(hld.queryPath(u, v)).toBe(hld.queryPath(v, u));
    }
  }
});

/** 부모를 한 칸씩 따라 올라가 경로 합을 그대로 세는 대조본. */
function walkSum(
  n: number,
  edges: Edge[],
  root: number,
  values: number[],
  u0: number,
  v0: number,
): number {
  const near: number[][] = Array.from({ length: n }, () => []);
  for (const [a, b] of edges) {
    (near[a] as number[]).push(b);
    (near[b] as number[]).push(a);
  }
  const parent: number[] = Array.from({ length: n }, () => root);
  const depth: number[] = Array.from({ length: n }, () => 0);
  const seen: boolean[] = Array.from({ length: n }, () => false);
  const stack: number[] = [root];
  seen[root] = true;
  while (stack.length > 0) {
    const x = stack.pop() as number;
    for (const y of near[x] as number[]) {
      if (seen[y]) continue;
      seen[y] = true;
      parent[y] = x;
      depth[y] = (depth[x] as number) + 1;
      stack.push(y);
    }
  }
  let u = u0;
  let v = v0;
  let sum = 0;
  while (u !== v) {
    if ((depth[u] as number) >= (depth[v] as number)) {
      sum += values[u] as number;
      u = parent[u] as number;
    } else {
      sum += values[v] as number;
      v = parent[v] as number;
    }
  }
  return sum + (values[u] as number);
}

test("작은 트리 전수에서 경로를 실제로 걸어 센 값과 같다", () => {
  const shapes: [number, Edge[]][] = [
    [
      7,
      [
        [0, 1],
        [0, 2],
        [1, 3],
        [1, 4],
        [2, 5],
        [5, 6],
      ],
    ],
    [
      8,
      [
        [0, 1],
        [1, 2],
        [2, 3],
        [3, 4],
        [4, 5],
        [5, 6],
        [6, 7],
      ],
    ],
    [
      9,
      [
        [0, 1],
        [0, 2],
        [1, 5],
        [5, 6],
        [2, 3],
        [2, 4],
        [4, 7],
        [7, 8],
      ],
    ],
  ];
  for (const [n, edges] of shapes) {
    for (let root = 0; root < n; root++) {
      const values = Array.from({ length: n }, (_, i) => i * 3 - 5);
      const hld = new HeavyLightDecomposition(n, edges, root, values.slice());
      for (let u = 0; u < n; u++) {
        for (let v = 0; v < n; v++) {
          expect(hld.queryPath(u, v)).toBe(
            walkSum(n, edges, root, values, u, v),
          );
        }
      }
    }
  }
});

test("갱신을 섞어도 걸어 센 값과 같다", () => {
  const n = 9;
  const edges: Edge[] = [
    [0, 1],
    [0, 2],
    [1, 5],
    [5, 6],
    [2, 3],
    [2, 4],
    [4, 7],
    [7, 8],
  ];
  const values = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const hld = new HeavyLightDecomposition(n, edges, 0, values.slice());
  const cur = values.slice();
  for (let i = 0; i < 60; i++) {
    const node = (i * 5) % n;
    const next = ((i * 13) % 41) - 20;
    hld.update(node, next);
    cur[node] = next;
    const u = (i * 7) % n;
    const v = (i * 11) % n;
    expect(hld.queryPath(u, v)).toBe(walkSum(n, edges, 0, cur, u, v));
  }
});

test("뿌리를 바꿔도 같은 두 정점의 경로 합은 같다", () => {
  const n = 9;
  const edges: Edge[] = [
    [0, 1],
    [0, 2],
    [1, 5],
    [5, 6],
    [2, 3],
    [2, 4],
    [4, 7],
    [7, 8],
  ];
  const values = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const base = new HeavyLightDecomposition(n, edges, 0, values.slice());
  for (let root = 1; root < n; root++) {
    const other = new HeavyLightDecomposition(n, edges, root, values.slice());
    for (let u = 0; u < n; u++) {
      for (let v = 0; v < n; v++) {
        expect(other.queryPath(u, v)).toBe(base.queryPath(u, v));
      }
    }
  }
});
