/**
 * L9 — 가이드가 싣는 코드가 **기존 테스트의 입출력 케이스**를 통과하는가.
 *
 * 원본 `src/algorithms/graph/articulationPoints/articulationPoints.test.ts` 는 학습자 스텁을
 * 가져오므로 그대로 재사용할 수 없다. **케이스만** 옮겨 정본
 * (`articulationPoints-guide.ref.ts`)에 다시 건다.
 *
 * **벽시계를 재는 단언은 옮기지 않았다** — 실행마다 값이 달라 판정이 안 된다. 같은 규모
 * (`V = 10^5`)는 그대로 돌리되 **단절점의 개수와 양 끝 번호**로 판정한다. 재귀로 적었으면
 * 그 케이스가 호출 스택을 넘겨 실패하는 자리이기도 하다.
 */
import { expect, test } from "bun:test";
import { articulationPoints } from "./articulationPoints-guide.ref.ts";

type Edge = [number, number];

/** 반환 형식 — 오름차순이고 중복이 없으며 번호가 `0 … n−1` 안에 있다. */
function wellFormed(got: number[], n: number): boolean {
  for (let i = 1; i < got.length; i++) {
    if ((got[i - 1] as number) >= (got[i] as number)) return false;
  }
  return got.every((v) => v >= 0 && v < n);
}

/** 정의를 그대로 옮긴 절차 — 정점을 하나 지우고 연결 성분 수가 늘어나는지 센다. */
function byDeletion(n: number, edges: Edge[]): number[] {
  const adj: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    if (u === v) continue;
    (adj[u] as number[]).push(v);
    (adj[v] as number[]).push(u);
  }
  const components = (skip: number): number => {
    const seen: boolean[] = Array.from({ length: n }, () => false);
    let count = 0;
    for (let s = 0; s < n; s++) {
      if (s === skip || seen[s] === true) continue;
      count++;
      seen[s] = true;
      const stack = [s];
      while (stack.length > 0) {
        const v = stack.pop() as number;
        for (const w of adj[v] as number[]) {
          if (w !== skip && seen[w] !== true) {
            seen[w] = true;
            stack.push(w);
          }
        }
      }
    }
    return count;
  };
  const base = components(-1);
  const out: number[] = [];
  for (let v = 0; v < n; v++) if (components(v) > base) out.push(v);
  return out;
}

const CASES: [string, number, Edge[], number[]][] = [
  [
    "사슬 0-1-2-3-4 — 양 끝을 뺀 가운데 정점이 단절점",
    5,
    [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
    ],
    [1, 2, 3],
  ],
  [
    "별 모양 나무 — 가운데가 단절점",
    4,
    [
      [0, 1],
      [0, 2],
      [0, 3],
    ],
    [0],
  ],
  [
    "사이클 — 단절점이 없다",
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
    "삼각형 둘이 정점 하나를 공유한다 — 그 정점이 단절점",
    5,
    [
      [0, 1],
      [1, 2],
      [2, 0],
      [2, 3],
      [3, 4],
      [4, 2],
    ],
    [2],
  ],
  [
    "삼각형 둘을 간선 하나가 잇는다 — 그 간선의 두 끝이 단절점",
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
    [2, 3],
  ],
  ["간선이 없는 그래프 — 단절점이 없다", 5, [], []],
  ["정점 둘에 간선 하나 — 단절점이 없다", 2, [[0, 1]], []],
  [
    "떨어진 두 성분 (사슬 셋 + 홀로 있는 정점)",
    4,
    [
      [0, 1],
      [1, 2],
    ],
    [1],
  ],
  [
    "두 끝이 같은 간선이 섞여 있다 — 사이클 위 정점은 단절점이 아니다",
    3,
    [
      [0, 0],
      [0, 1],
      [1, 2],
      [2, 0],
    ],
    [],
  ],
  ["정점 하나, 간선 없음", 1, [], []],
  [
    "정점 셋짜리 나무 — 가운데 정점 1 만 단절점",
    3,
    [
      [0, 1],
      [1, 2],
    ],
    [1],
  ],
  [
    "본문 전개가 쓰는 고정 입력",
    5,
    [
      [0, 1],
      [1, 2],
      [2, 0],
      [0, 3],
      [3, 4],
    ],
    [0, 3],
  ],
  [
    "꼬리가 붙은 삼각형 — 등호가 판정을 가르는 자리",
    4,
    [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 1],
    ],
    [1],
  ],
  [
    "같은 두 정점 사이의 겹친 간선",
    3,
    [
      [0, 1],
      [0, 1],
      [1, 2],
    ],
    [1],
  ],
];

for (const [name, n, edges, want] of CASES) {
  test(`정본 — ${name}`, () => {
    const got = articulationPoints(n, edges);
    expect(wellFormed(got, n)).toBe(true);
    expect(got).toEqual(want);
    expect(got).toEqual(byDeletion(n, edges));
  });
}

test("V=10^5 사슬 — 양 끝을 뺀 정점 전부가 단절점", () => {
  const V = 100_000;
  const edges: Edge[] = [];
  for (let i = 0; i < V - 1; i++) edges.push([i, i + 1]);

  const got = articulationPoints(V, edges);
  expect(got.length).toBe(V - 2);
  expect(got[0]).toBe(1);
  expect(got[got.length - 1]).toBe(V - 2);
  expect(wellFormed(got, V)).toBe(true);
});

test("V=10^5 사이클 — 단절점이 하나도 없다", () => {
  const V = 100_000;
  const edges: Edge[] = [];
  for (let i = 0; i < V - 1; i++) edges.push([i, i + 1]);
  edges.push([V - 1, 0]);

  expect(articulationPoints(V, edges)).toEqual([]);
});

test("정점 60 개 무작위 그래프 200 벌에서 정점을 지워 보는 방법과 답이 같다", () => {
  let seed = 20260906 | 0;
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
    const got = articulationPoints(V, edges);
    expect(wellFormed(got, V)).toBe(true);
    expect(got).toEqual(byDeletion(V, edges));
  }
});
