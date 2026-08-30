/**
 * `purpose.alt` 가 인용하는 수치의 출처 — L13.
 *
 * **같은 입력·같은 작업 목록**에 두 설계를 걸고 **결정론적 계수**만 센다. 벽시계·처리량은
 * 실행마다 달라 "본문의 수치가 실측과 일치하는가"(P10)를 정의할 수 없다.
 *
 *   bun run tools/bench-alt.ts src/algorithms/shortest-path/dijkstra/dijkstra-guide.alt.ts
 *
 * **전개 입력을 그대로 쓰지 않은 이유**(L20). 전개 그래프는 정점 여섯 · 간선 일곱이라 두
 * 설계의 기본 연산이 14 대 265 로 갈리는데, 출발점을 여섯 개까지밖에 못 늘리므로 우열이
 * 뒤집히는 자리를 만들 수 없다. 전개 입력의 값도 함께 내고(`전개 입력 · …`), 뒤집히는 자리를
 * 보이는 데는 아래 `DENSE` 를 쓴다. 그 사실을 본문 대조 문단에도 적는다.
 *
 * **입력은 생성식으로 고정한다.** 정점 `V = 200`, 정점마다 나가는 간선 `D = 199` 개이고
 * `k` 번째 이웃은 `(i·37 + k·11) mod V`, 가중치는 `((i·29 + k·13) mod 50) + 1` 이다.
 * 자기 자신으로 가는 것을 빼면 간선이 39,604 개인 밀집 그래프다. 한 번 정한 입력은 수치가
 * 마음에 안 든다는 이유로 바꾸지 않는다(L20).
 */

import type { Edge } from "./dijkstra-guide.ref.ts";

/* ────────────────────────── 고정 입력 ────────────────────────── */

/** 본문 전개가 쓰는 그래프. 정점 여섯 · 방향 간선 일곱. */
export const WALK_N = 6;
export const WALK_EDGES: Edge[] = [
  [0, 1, 4],
  [0, 2, 1],
  [2, 1, 2],
  [1, 3, 1],
  [2, 3, 5],
  [3, 4, 3],
  [4, 1, 7],
];

export const V = 200;
export const D = 199;

export function dense(): Edge[] {
  const edges: Edge[] = [];
  for (let i = 0; i < V; i++) {
    for (let k = 1; k <= D; k++) {
      const to = (i * 37 + k * 11) % V;
      if (to === i) continue;
      edges.push([i, to, ((i * 29 + k * 13) % 50) + 1]);
    }
  }
  return edges;
}

const DENSE = dense();

/* ────────────────────────── 두 설계 ────────────────────────── */

function adjacency(n: number, edges: Edge[]): [number, number][][] {
  const adj: [number, number][][] = Array.from({ length: n }, () => []);
  for (const [u, v, w] of edges) (adj[u] as [number, number][]).push([v, w]);
  return adj;
}

/**
 * 이 가이드의 절차. 정본(`dijkstra-guide.ref.ts`)과 같고 세는 자리만 덧붙였다.
 *
 * `기본 연산` 은 완화 시도 한 번과 힙에서 키를 견준 한 번을 각각 하나로 센다.
 * `저장 칸` 은 거리 배열 `V` 칸과 힙이 가장 커졌을 때의 항목 수를 더한 것이다.
 */
function 이가이드의절차(
  n: number,
  edges: Edge[],
  sources: number[],
): { ops: number; cells: number; answer: number } {
  const adj = adjacency(n, edges);
  let ops = 0;
  let peak = 0;
  let answer = 0;

  for (const src of sources) {
    const dist = Array.from({ length: n }, () => Number.POSITIVE_INFINITY);
    dist[src] = 0;
    const items: [number, number][] = [[src, 0]];
    const key = (i: number): number => (items[i] as [number, number])[1];
    const swap = (a: number, b: number): void => {
      const t = items[a] as [number, number];
      items[a] = items[b] as [number, number];
      items[b] = t;
    };
    while (items.length > 0) {
      peak = Math.max(peak, items.length);
      const top = items[0] as [number, number];
      const last = items.pop() as [number, number];
      if (items.length > 0) {
        items[0] = last;
        let i = 0;
        for (;;) {
          const left = 2 * i + 1;
          const right = 2 * i + 2;
          let small = i;
          if (left < items.length) {
            ops++;
            if (key(left) < key(small)) small = left;
          }
          if (right < items.length) {
            ops++;
            if (key(right) < key(small)) small = right;
          }
          if (small === i) break;
          swap(i, small);
          i = small;
        }
      }
      const [u, d] = top;
      if (d > (dist[u] as number)) continue;
      for (const [v, w] of adj[u] as [number, number][]) {
        ops++;
        const nd = d + w;
        if (nd < (dist[v] as number)) {
          dist[v] = nd;
          items.push([v, nd]);
          let i = items.length - 1;
          while (i > 0) {
            const parent = (i - 1) >> 1;
            ops++;
            if (key(i) >= key(parent)) break;
            swap(i, parent);
            i = parent;
          }
        }
      }
    }
    for (const d of dist) if (d !== Number.POSITIVE_INFINITY) answer += d;
  }
  return { ops, cells: n + peak, answer };
}

/**
 * 경쟁 설계 — **플로이드-워셜**. 정점 쌍마다 칸을 하나 두고 「가운데를 정점 `k` 로 지나면
 * 더 작아지는가」를 모든 `(k, i, j)` 에서 한 번씩 물어, 한 번의 실행으로 **모든 출발점**의
 * 답을 함께 만든다. 출발점 하나를 물으면 그 표의 한 줄을 읽으면 된다.
 *
 * `기본 연산` 은 삼중 루프 안의 견주기 한 번과 표를 세우며 칸을 채운 한 번을 각각 하나로
 * 센다. 출발점이 몇 개든 표는 한 번만 만든다 — 그래서 이 설계의 계수는 출발점 수와 무관하다.
 */
function 플로이드워셜(
  n: number,
  edges: Edge[],
  sources: number[],
): { ops: number; cells: number; answer: number } {
  const best: number[][] = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) =>
      i === j ? 0 : Number.POSITIVE_INFINITY,
    ),
  );
  let ops = n * n;
  for (const [u, v, w] of edges) {
    ops++;
    const row = best[u] as number[];
    if (w < (row[v] as number)) row[v] = w;
  }
  for (let k = 0; k < n; k++) {
    const rowK = best[k] as number[];
    for (let i = 0; i < n; i++) {
      const rowI = best[i] as number[];
      const ik = rowI[k] as number;
      if (ik === Number.POSITIVE_INFINITY) {
        ops += n;
        continue;
      }
      for (let j = 0; j < n; j++) {
        ops++;
        const through = ik + (rowK[j] as number);
        if (through < (rowI[j] as number)) rowI[j] = through;
      }
    }
  }
  let answer = 0;
  for (const src of sources) {
    for (const d of best[src] as number[]) {
      ops++;
      if (d !== Number.POSITIVE_INFINITY) answer += d;
    }
  }
  return { ops, cells: n * n, answer };
}

/* ────────────────────────── 계수 ────────────────────────── */

const someSources = (count: number): number[] =>
  Array.from({ length: count }, (_, i) => (i * 7) % V);

/** 두 설계가 **같은 답**을 내는지부터 확인한다. 다르면 대조가 성립하지 않는다. */
function 확인(): void {
  for (const [n, edges] of [
    [WALK_N, WALK_EDGES],
    [V, DENSE],
  ] as [number, Edge[]][]) {
    const all = Array.from({ length: n }, (_, i) => i);
    const a = 이가이드의절차(n, edges, all);
    const b = 플로이드워셜(n, edges, all);
    if (a.answer !== b.answer) {
      throw new Error(`두 설계의 답이 다르다 — ${a.answer} vs ${b.answer}`);
    }
  }
}
확인();

/** 출발점 수를 늘려 가며 순서가 처음 뒤집히는 자리를 찾는다. */
export function flipPoint(): number {
  for (let q = 1; q <= V; q++) {
    const a = 이가이드의절차(V, DENSE, someSources(q));
    const b = 플로이드워셜(V, DENSE, someSources(q));
    if (a.ops > b.ops) return q;
  }
  return -1;
}

const FLIP = flipPoint();
if (FLIP < 2) {
  throw new Error(
    `출발점 수를 ${V} 까지 늘려도 순서가 안 뒤집힌다 — 대조가 성립하지 않는다`,
  );
}

function 재기(
  run: (
    n: number,
    e: Edge[],
    s: number[],
  ) => { ops: number; cells: number; answer: number },
): Record<string, number> {
  const q1 = run(V, DENSE, someSources(1));
  const before = run(V, DENSE, someSources(FLIP - 1));
  const at = run(V, DENSE, someSources(FLIP));
  const full = run(V, DENSE, someSources(V));
  const walk = run(WALK_N, WALK_EDGES, [0]);
  return {
    "전개 입력 · 기본 연산": walk.ops,
    "출발점 1 개 · 기본 연산": q1.ops,
    [`출발점 ${FLIP - 1} 개 · 기본 연산`]: before.ops,
    [`출발점 ${FLIP} 개 · 기본 연산`]: at.ops,
    "출발점 200 개 · 기본 연산": full.ops,
    "저장 칸": full.cells,
  };
}

export const cases = {
  "이 가이드의 절차": () => 재기(이가이드의절차),
  "플로이드-워셜": () => 재기(플로이드워셜),
  경계: () => ({ "순서가 뒤집히는 출발점 수": FLIP }),
};
