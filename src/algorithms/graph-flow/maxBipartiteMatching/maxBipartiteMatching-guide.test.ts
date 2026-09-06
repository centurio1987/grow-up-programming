/**
 * L9 — 가이드가 싣는 코드가 **기존 테스트의 입출력 케이스**를 통과하는가.
 *
 * 원본 `src/algorithms/graph-flow/maxBipartiteMatching/maxBipartiteMatching.test.ts` 는
 * 학습자 스텁을 가져오므로 그대로 재사용할 수 없다. **케이스만** 옮겨 정본
 * (`maxBipartiteMatching-guide.ref.ts`)에 다시 건다.
 *
 * **벽시계를 재는 단언은 옮기지 않았다** — 실행마다 값이 달라 판정이 안 된다. 같은 규모
 * (왼쪽 500 · 오른쪽 500 · 간선 10,000)는 그대로 쓰되, **다른 설계(홉크로프트-카프)가 낸
 * 매칭 크기와 같은지**로 판정한다. 재귀 깊이가 제약 상한에서 감당되는지도 같은 자리에서 본다.
 */
import { expect, test } from "bun:test";
import { maxBipartiteMatching } from "./maxBipartiteMatching-guide.ref.ts";

type Edge = [number, number];

/**
 * 홉크로프트-카프 — 같은 문제를 다른 절차로 푼다.
 *
 * 정본과 답이 같은지 대조하는 데만 쓴다. 층을 매기는 너비 우선 탐색과 그 층을 지키는 깊이
 * 우선 탐색으로 짧은 증대 경로를 한 라운드에 여럿 뒤집는다.
 */
function hopcroftKarp(left: number, right: number, edges: Edge[]): number {
  const adj: number[][] = Array.from({ length: left }, () => []);
  for (const [u, v] of edges) (adj[u] as number[]).push(v);
  const matchL: number[] = Array.from({ length: left }, () => -1);
  const matchR: number[] = Array.from({ length: right }, () => -1);
  const dist: number[] = Array.from({ length: left }, () => -1);

  const bfs = (): boolean => {
    const queue: number[] = [];
    for (let u = 0; u < left; u++) {
      if (matchL[u] === -1) {
        dist[u] = 0;
        queue.push(u);
      } else dist[u] = -1;
    }
    let found = false;
    let qi = 0;
    while (qi < queue.length) {
      const u = queue[qi++] as number;
      for (const v of adj[u] as number[]) {
        const w = matchR[v] as number;
        if (w === -1) found = true;
        else if (dist[w] === -1) {
          dist[w] = (dist[u] as number) + 1;
          queue.push(w);
        }
      }
    }
    return found;
  };

  const dfs = (u: number): boolean => {
    for (const v of adj[u] as number[]) {
      const w = matchR[v] as number;
      if (w === -1 || (dist[w] === (dist[u] as number) + 1 && dfs(w))) {
        matchL[u] = v;
        matchR[v] = u;
        return true;
      }
    }
    dist[u] = -1;
    return false;
  };

  let size = 0;
  while (bfs()) {
    for (let u = 0; u < left; u++) if (matchL[u] === -1 && dfs(u)) size++;
  }
  return size;
}

/** 정의를 그대로 옮긴 방법 — 간선 부분집합을 전부 만들어 가장 큰 매칭을 고른다. */
function bruteForce(left: number, right: number, edges: Edge[]): number {
  const E = edges.length;
  let best = 0;
  for (let mask = 0; mask < 1 << E; mask++) {
    const usedL: boolean[] = Array.from({ length: left }, () => false);
    const usedR: boolean[] = Array.from({ length: right }, () => false);
    let ok = true;
    let n = 0;
    for (let i = 0; i < E; i++) {
      if ((mask & (1 << i)) === 0) continue;
      const [u, v] = edges[i] as Edge;
      if (usedL[u] === true || usedR[v] === true) {
        ok = false;
        break;
      }
      usedL[u] = true;
      usedR[v] = true;
      n++;
    }
    if (ok && n > best) best = n;
  }
  return best;
}

const CASES: [string, number, number, Edge[], number][] = [
  [
    "완전 매칭이 있는 3 × 3 부분 그래프",
    3,
    3,
    [
      [0, 0],
      [0, 1],
      [1, 0],
      [1, 1],
      [1, 2],
      [2, 2],
    ],
    3,
  ],
  [
    "본문 전개가 쓰는 고정 입력 — 재배정을 해도 2 가 한계다",
    3,
    3,
    [
      [0, 0],
      [0, 1],
      [1, 0],
      [2, 0],
    ],
    2,
  ],
  [
    "홀의 결혼 정리 예시 — 완전 매칭이 있다",
    4,
    4,
    [
      [0, 0],
      [0, 1],
      [1, 0],
      [1, 2],
      [2, 1],
      [2, 3],
      [3, 2],
      [3, 3],
    ],
    4,
  ],
  ["간선이 없다", 5, 5, [], 0],
  ["왼쪽 하나 · 오른쪽 하나 · 간선 하나", 1, 1, [[0, 0]], 1],
  ["왼쪽 하나 · 오른쪽 하나 · 간선 없음", 1, 1, [], 0],
  [
    "왼쪽 넷이 오른쪽 하나만 본다",
    4,
    1,
    [
      [0, 0],
      [1, 0],
      [2, 0],
      [3, 0],
    ],
    1,
  ],
  [
    "같은 간선이 두 번 들어온다",
    2,
    2,
    [
      [0, 0],
      [0, 0],
      [1, 1],
    ],
    2,
  ],
  [
    "왼쪽이 오른쪽보다 많다 — 답은 min(L, R) 이하다",
    5,
    2,
    [
      [0, 0],
      [0, 1],
      [1, 0],
      [1, 1],
      [2, 0],
      [2, 1],
      [3, 0],
      [3, 1],
      [4, 0],
      [4, 1],
    ],
    2,
  ],
  [
    "왼쪽 셋이 오른쪽 하나만 본다",
    3,
    3,
    [
      [0, 0],
      [1, 0],
      [2, 0],
    ],
    1,
  ],
  ["왼쪽도 오른쪽도 없다", 0, 0, [], 0],
  [
    "재배정 사슬이 두 칸 필요하다",
    3,
    3,
    [
      [0, 0],
      [0, 1],
      [1, 0],
      [2, 1],
      [2, 2],
    ],
    3,
  ],
];

for (const [name, left, right, edges, want] of CASES) {
  test(`정본 — ${name}`, () => {
    const got = maxBipartiteMatching(left, right, edges);
    expect(got).toBe(want);
    expect(got).toBeLessThanOrEqual(Math.min(left, right));
    expect(got).toBe(hopcroftKarp(left, right, edges));
    expect(got).toBe(bruteForce(left, right, edges));
  });
}

test("왼쪽 500 · 오른쪽 500 · 간선 10,000 — 홉크로프트-카프와 답이 같다", () => {
  const L = 500;
  const R = 500;
  const edges: Edge[] = [];
  let seed = 42;
  for (let u = 0; u < L; u++) {
    for (let k = 0; k < 20; k++) {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      edges.push([u, seed % R]);
    }
  }
  const got = maxBipartiteMatching(L, R, edges);
  expect(got).toBe(hopcroftKarp(L, R, edges));
  expect(got).toBeLessThanOrEqual(Math.min(L, R));
});

test("제약 상한 규모의 재배정 사슬 — 왼쪽 1,000 이 한 줄로 이어져도 답이 나온다", () => {
  // 왼쪽 u 가 오른쪽 0 부터 u 까지를 본다. 마지막 탐색이 앞의 정점을 전부 거쳐 내려간다.
  const n = 1000;
  const edges: Edge[] = [];
  for (let u = 0; u < n; u++) for (let v = 0; v <= u; v++) edges.push([u, v]);
  expect(maxBipartiteMatching(n, n, edges)).toBe(n);
});

test("완전 이분 300 × 300 — 재배정 사슬이 300 칸 깊어져도 답이 나온다", () => {
  const n = 300;
  const edges: Edge[] = [];
  for (let u = 0; u < n; u++) for (let v = 0; v < n; v++) edges.push([u, v]);
  expect(maxBipartiteMatching(n, n, edges)).toBe(n);
});

test("작은 무작위 그래프 500 벌에서 간선 부분집합 전수와 답이 같다", () => {
  let seed = 20260907 | 0;
  const next = (): number => {
    seed ^= seed << 13;
    seed |= 0;
    seed ^= seed >>> 17;
    seed ^= seed << 5;
    seed |= 0;
    return seed >>> 0;
  };
  for (let round = 0; round < 500; round++) {
    const L = (next() % 4) + 1;
    const R = (next() % 4) + 1;
    const E = next() % (L * R + 1);
    const edges: Edge[] = [];
    for (let i = 0; i < E; i++) edges.push([next() % L, next() % R]);
    const got = maxBipartiteMatching(L, R, edges);
    expect(got).toBe(bruteForce(L, R, edges));
    expect(got).toBe(hopcroftKarp(L, R, edges));
  }
});
