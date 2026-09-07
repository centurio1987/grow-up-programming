/**
 * L9 — 가이드가 싣는 코드가 **기존 테스트의 입출력 케이스**를 통과하는가.
 *
 * 원본 `src/algorithms/graph/bridgesInGraph/bridgesInGraph.test.ts` 는 학습자 스텁을
 * 가져오므로 그대로 재사용할 수 없다. **케이스만** 옮겨 정본
 * (`bridgesInGraph-guide.ref.ts`)에 다시 건다.
 *
 * **벽시계를 재는 단언은 옮기지 않았다** — 실행마다 값이 달라 판정이 안 된다. 같은 규모
 * (`V = 10^5`)는 그대로 실행하되 **다리의 개수와 양 끝 번호**로 판정한다. 재귀로 적었으면
 * 그 케이스가 호출 스택 한계를 넘겨 실패하는 자리이기도 하다.
 */
import { expect, test } from "bun:test";
import { bridgesInGraph } from "./bridgesInGraph-guide.ref.ts";

type Edge = [number, number];

/** 반환 형식 — 각 쌍이 `u < v` 이고 전체가 사전순 오름차순이며 번호가 `0 … n−1` 안에 있다. */
function wellFormed(got: Edge[], n: number): boolean {
  for (const [u, v] of got) {
    if (!(u < v) || u < 0 || v >= n) return false;
  }
  for (let i = 1; i < got.length; i++) {
    const a = got[i - 1] as Edge;
    const b = got[i] as Edge;
    if (a[0] > b[0] || (a[0] === b[0] && a[1] >= b[1])) return false;
  }
  return true;
}

/** 정의를 그대로 옮긴 절차 — 간선을 하나 지우고 연결 성분 수가 늘어나는지 센다. */
function byDeletion(n: number, edges: Edge[]): Edge[] {
  const count = (skip: number): number => {
    const adj: number[][] = Array.from({ length: n }, () => []);
    for (const [i, edge] of edges.entries()) {
      if (i === skip) continue;
      const [u, v] = edge;
      (adj[u] as number[]).push(v);
      (adj[v] as number[]).push(u);
    }
    const seen: boolean[] = Array.from({ length: n }, () => false);
    let parts = 0;
    for (let s = 0; s < n; s++) {
      if (seen[s] === true) continue;
      parts++;
      seen[s] = true;
      const stack = [s];
      while (stack.length > 0) {
        const v = stack.pop() as number;
        for (const w of adj[v] as number[]) {
          if (seen[w] !== true) {
            seen[w] = true;
            stack.push(w);
          }
        }
      }
    }
    return parts;
  };
  const base = count(-1);
  const out: Edge[] = [];
  for (const [i, edge] of edges.entries()) {
    if (count(i) <= base) continue;
    const [u, v] = edge;
    out.push(u < v ? [u, v] : [v, u]);
  }
  out.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  return out;
}

const CASES: [string, number, Edge[], Edge[]][] = [
  [
    "사슬 0-1-2-3 — 모든 간선이 다리",
    4,
    [
      [0, 1],
      [1, 2],
      [2, 3],
    ],
    [
      [0, 1],
      [1, 2],
      [2, 3],
    ],
  ],
  [
    "사이클 — 다리가 없다",
    4,
    [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 0],
    ],
    [],
  ],
  [
    "삼각형 둘을 간선 하나가 잇는다 — 그 간선만 다리",
    6,
    [
      [0, 1],
      [1, 2],
      [2, 0],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 3],
    ],
    [[2, 3]],
  ],
  [
    "별 모양 나무 — 모든 간선이 다리",
    4,
    [
      [0, 1],
      [0, 2],
      [0, 3],
    ],
    [
      [0, 1],
      [0, 2],
      [0, 3],
    ],
  ],
  [
    "삼각형에 꼬리가 붙었다 — 꼬리 간선만 다리",
    4,
    [
      [0, 1],
      [1, 2],
      [2, 0],
      [2, 3],
    ],
    [[2, 3]],
  ],
  ["간선이 없는 그래프 — 다리가 없다", 5, [], []],
  ["간선 하나 — 그 간선이 다리", 2, [[0, 1]], [[0, 1]]],
  [
    "떨어진 두 나무",
    5,
    [
      [0, 1],
      [1, 2],
      [3, 4],
    ],
    [
      [0, 1],
      [1, 2],
      [3, 4],
    ],
  ],
  [
    "같은 두 정점 사이의 겹친 간선 — 다리가 아니다",
    2,
    [
      [0, 1],
      [0, 1],
    ],
    [],
  ],
  ["정점 하나, 간선 없음", 1, [], []],
  ["정점 둘, 간선 하나를 거꾸로 적었다", 2, [[1, 0]], [[0, 1]]],
  [
    "본문 전개가 쓰는 고정 입력",
    6,
    [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 1],
      [3, 4],
      [0, 5],
    ],
    [
      [0, 1],
      [0, 5],
      [3, 4],
    ],
  ],
  [
    "두 끝이 같은 간선이 섞여 있다",
    3,
    [
      [0, 0],
      [0, 1],
      [1, 2],
    ],
    [
      [0, 1],
      [1, 2],
    ],
  ],
  [
    "겹친 간선 한 쌍에 꼬리가 붙었다 — 꼬리만 다리",
    3,
    [
      [0, 1],
      [0, 1],
      [1, 2],
    ],
    [[1, 2]],
  ],
];

for (const [name, n, edges, want] of CASES) {
  test(`정본 — ${name}`, () => {
    const got = bridgesInGraph(n, edges);
    expect(wellFormed(got, n)).toBe(true);
    expect(got).toEqual(want);
    expect(got).toEqual(byDeletion(n, edges));
  });
}

test("V=10^5 사슬 — 간선 전부가 다리", () => {
  const V = 100_000;
  const edges: Edge[] = [];
  for (let i = 0; i < V - 1; i++) edges.push([i, i + 1]);

  const got = bridgesInGraph(V, edges);
  expect(got.length).toBe(V - 1);
  expect(got[0]).toEqual([0, 1]);
  expect(got[got.length - 1]).toEqual([V - 2, V - 1]);
  expect(wellFormed(got, V)).toBe(true);
});

test("V=10^5 사이클 — 다리가 하나도 없다", () => {
  const V = 100_000;
  const edges: Edge[] = [];
  for (let i = 0; i < V - 1; i++) edges.push([i, i + 1]);
  edges.push([V - 1, 0]);

  expect(bridgesInGraph(V, edges)).toEqual([]);
});

test("정점 60 개 무작위 그래프 200 벌에서 간선을 지워 보는 방법과 답이 같다", () => {
  let seed = 20260907 | 0;
  const next = (): number => {
    seed ^= seed << 13;
    seed |= 0;
    seed ^= seed >>> 17;
    seed ^= seed << 5;
    seed |= 0;
    return seed >>> 0;
  };
  for (let round = 0; round < 200; round++) {
    const V = (next() % 60) + 1;
    const E = next() % (2 * V + 1);
    const edges: Edge[] = [];
    for (let i = 0; i < E; i++) edges.push([next() % V, next() % V]);
    const got = bridgesInGraph(V, edges);
    expect(wellFormed(got, V)).toBe(true);
    expect(got).toEqual(byDeletion(V, edges));
  }
});
