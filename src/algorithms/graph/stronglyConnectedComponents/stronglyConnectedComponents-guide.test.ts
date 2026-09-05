/**
 * L9 — 가이드가 싣는 코드가 **기존 테스트의 입출력 케이스**를 통과하는가.
 *
 * 원본 `src/algorithms/graph/stronglyConnectedComponents/stronglyConnectedComponents.test.ts`
 * 는 학습자 스텁을 가져오므로 그대로 재사용할 수 없다. **케이스만** 옮겨 정본
 * (`stronglyConnectedComponents-guide.ref.ts`)에 다시 건다.
 *
 * **벽시계를 재는 단언은 옮기지 않았다** — 실행마다 값이 달라 판정이 안 된다. 같은 규모
 * (`V = 10^5`)는 그대로 돌리되 **무리의 개수와 크기**로 판정한다. 재귀로 적었으면 이 두
 * 케이스가 호출 스택을 넘겨 실패하는 자리이기도 하다.
 */
import { expect, test } from "bun:test";
import { stronglyConnectedComponents } from "./stronglyConnectedComponents-guide.ref.ts";

/** 반환 형식 — 무리 안은 오름차순, 무리 사이는 첫 원소 기준 오름차순, 모든 정점이 정확히 한 번. */
function wellFormed(groups: number[][], n: number): boolean {
  const seen = new Set<number>();
  let prevHead = Number.NEGATIVE_INFINITY;
  for (const group of groups) {
    if (group.length === 0) return false;
    for (let i = 1; i < group.length; i++) {
      if ((group[i - 1] as number) >= (group[i] as number)) return false;
    }
    if ((group[0] as number) <= prevHead) return false;
    prevHead = group[0] as number;
    for (const v of group) {
      if (seen.has(v)) return false;
      seen.add(v);
    }
  }
  return seen.size === n;
}

const CASES: [string, number, [number, number][], number[][]][] = [
  [
    "사이클 0→1→2→0 — 셋이 한 무리",
    3,
    [
      [0, 1],
      [1, 2],
      [2, 0],
    ],
    [[0, 1, 2]],
  ],
  [
    "두 무리를 한 방향 간선이 잇는다",
    5,
    [
      [0, 1],
      [1, 2],
      [2, 0],
      [2, 3],
      [3, 4],
      [4, 3],
    ],
    [
      [0, 1, 2],
      [3, 4],
    ],
  ],
  [
    "되돌아가는 간선이 없는 사슬 — 정점마다 혼자 무리",
    4,
    [
      [0, 1],
      [1, 2],
      [2, 3],
    ],
    [[0], [1], [2], [3]],
  ],
  [
    "두 무리가 양쪽으로 이어져 하나가 된다",
    3,
    [
      [0, 1],
      [1, 0],
      [1, 2],
      [2, 1],
    ],
    [[0, 1, 2]],
  ],
  ["간선이 없는 그래프", 4, [], [[0], [1], [2], [3]]],
  [
    "자기 자신을 가리키는 간선만",
    3,
    [
      [0, 0],
      [1, 1],
    ],
    [[0], [1], [2]],
  ],
  [
    "떨어진 두 무리",
    4,
    [
      [0, 1],
      [1, 0],
      [2, 3],
      [3, 2],
    ],
    [
      [0, 1],
      [2, 3],
    ],
  ],
  ["정점 하나, 간선 없음", 1, [], [[0]]],
  ["정점 하나, 자기 자신을 가리키는 간선", 1, [[0, 0]], [[0]]],
  [
    "본문 전개가 쓰는 고정 입력",
    6,
    [
      [0, 1],
      [1, 2],
      [2, 0],
      [2, 3],
      [3, 4],
      [4, 3],
      [5, 3],
    ],
    [[0, 1, 2], [3, 4], [5]],
  ],
  [
    "무리가 먼저 확정된 뒤 그 안으로 들어가는 간선",
    4,
    [
      [0, 1],
      [1, 0],
      [2, 3],
      [3, 0],
    ],
    [[0, 1], [2], [3]],
  ],
  [
    "가지가 둘인 사이클",
    5,
    [
      [0, 1],
      [1, 2],
      [2, 0],
      [0, 3],
      [3, 2],
      [3, 4],
    ],
    [[0, 1, 2, 3], [4]],
  ],
  [
    "되돌아가는 간선이 있어도 그 위 정점은 다른 무리",
    3,
    [
      [0, 1],
      [1, 2],
      [2, 1],
    ],
    [[0], [1, 2]],
  ],
  [
    "같은 두 정점 사이의 겹친 간선",
    2,
    [
      [0, 1],
      [0, 1],
      [1, 0],
    ],
    [[0, 1]],
  ],
];

for (const [name, n, edges, want] of CASES) {
  test(`정본 — ${name}`, () => {
    const got = stronglyConnectedComponents(n, edges);
    expect(wellFormed(got, n)).toBe(true);
    expect(got).toEqual(want);
  });
}

test("V=10^5 사이클 하나 — 무리 하나에 정점 10 만 개", () => {
  const V = 100_000;
  const edges: [number, number][] = [];
  for (let i = 0; i < V - 1; i++) edges.push([i, i + 1]);
  edges.push([V - 1, 0]);

  const got = stronglyConnectedComponents(V, edges);
  expect(got.length).toBe(1);
  expect((got[0] as number[]).length).toBe(V);
  expect(wellFormed(got, V)).toBe(true);
});

test("V=10^5 사슬 — 무리가 10 만 개", () => {
  const V = 100_000;
  const edges: [number, number][] = [];
  for (let i = 0; i < V - 1; i++) edges.push([i, i + 1]);

  const got = stronglyConnectedComponents(V, edges);
  expect(got.length).toBe(V);
  expect(wellFormed(got, V)).toBe(true);
});

test("정점 200 개 무작위 그래프에서 정점 쌍마다 재는 방법과 답이 같다", () => {
  const V = 200;
  let seed = 20260905 | 0;
  const next = (): number => {
    seed ^= seed << 13;
    seed |= 0;
    seed ^= seed >>> 17;
    seed ^= seed << 5;
    seed |= 0;
    return (seed >>> 0) % V;
  };
  const edges: [number, number][] = [];
  for (let i = 0; i < V * 2; i++) edges.push([next(), next()]);

  // 정의를 그대로 옮긴 절차 — u 에서 v 로 가는 길과 v 에서 u 로 오는 길이 둘 다 있으면 한 무리다.
  const adj: number[][] = Array.from({ length: V }, () => []);
  for (const [u, v] of edges) (adj[u] as number[]).push(v);
  const canReach = (src: number, dst: number): boolean => {
    const seenIt: boolean[] = Array.from({ length: V }, () => false);
    seenIt[src] = true;
    const queue = [src];
    let head = 0;
    while (head < queue.length) {
      const v = queue[head++] as number;
      if (v === dst) return true;
      for (const w of adj[v] as number[]) {
        if (!seenIt[w]) {
          seenIt[w] = true;
          queue.push(w);
        }
      }
    }
    return src === dst;
  };
  const assigned: number[] = Array.from({ length: V }, () => -1);
  const want: number[][] = [];
  for (let u = 0; u < V; u++) {
    if (assigned[u] !== -1) continue;
    const group = [u];
    assigned[u] = want.length;
    for (let v = u + 1; v < V; v++) {
      if (assigned[v] !== -1) continue;
      if (canReach(u, v) && canReach(v, u)) {
        group.push(v);
        assigned[v] = want.length;
      }
    }
    want.push(group);
  }

  const got = stronglyConnectedComponents(V, edges);
  expect(wellFormed(got, V)).toBe(true);
  expect(got).toEqual(want);
});

test("모든 정점이 정확히 하나의 무리에 속한다 — 무작위 그래프 스무 벌", () => {
  let seed = 424242 | 0;
  const next = (): number => {
    seed ^= seed << 13;
    seed |= 0;
    seed ^= seed >>> 17;
    seed ^= seed << 5;
    seed |= 0;
    return seed >>> 0;
  };
  for (let round = 0; round < 20; round++) {
    const V = (next() % 40) + 1;
    const E = next() % (2 * V + 1);
    const edges: [number, number][] = [];
    for (let i = 0; i < E; i++) edges.push([next() % V, next() % V]);
    const got = stronglyConnectedComponents(V, edges);
    expect(wellFormed(got, V)).toBe(true);
  }
});
