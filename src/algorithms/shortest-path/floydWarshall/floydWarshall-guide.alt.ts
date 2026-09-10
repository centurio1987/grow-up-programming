/**
 * `purpose.alt` 가 인용하는 수치의 출처 — L13.
 *
 * **같은 입력·같은 작업**에 두 설계를 세우고 **결정론적 계수**만 센다. 벽시계·처리량은
 * 실행마다 달라 "본문의 수치가 실측과 일치하는가"(P10)를 정의할 수 없다.
 *
 *   bun run tools/bench-alt.ts src/algorithms/shortest-path/floydWarshall/floydWarshall-guide.alt.ts
 *
 * **두 설계가 매 실행마다 같은 답을 내는지 먼저 확인한다**(`확인()`). 답이 다른 구현으로 잰
 * 계수는 저울질이 아니라 다른 문제의 값이다 — 여기서는 정본(`.ref.ts`)이 낸 거리 행렬을 두
 * 설계 모두와 칸 하나씩 대조한다.
 *
 * **전개 입력도 함께 낸다**(L20). 전개는 정점 다섯 · 간선 일곱이라 두 계수의 순서가 갈리는
 * 자리를 보이기에는 너무 작다. 그래서 정점 수를 200 으로 고정하고 **간선 수만** 바꾼 가족을
 * 함께 쓰고, 전개 입력의 값도 표에 남긴다. 그 사실을 본문 대조 문단에도 적는다.
 *
 * **입력은 생성식으로 고정한다.** 순서쌍을 `t -> (t × 7919) mod 39,800` 순서로 `E` 개 고르고,
 * 가중치는 `((i × 37) mod 100) + 1 + pot(u) - pot(v)` 이며 `pot(v) = (v × 13) mod 50` 이다.
 * 이 꼴이면 **어떤 사이클의 합도 1 이상**이라 음수 간선은 있고 음수 사이클은 없다 — 두 설계가
 * 모두 다룰 수 있는 입력이다. 한 번 정한 입력은 수치가 마음에 안 든다는 이유로 바꾸지 않는다(L20).
 */

import { floydWarshall, INF } from "./floydWarshall-guide.ref.ts";

/* ────────────────────────── 고정 입력 ────────────────────────── */

/** 본문 전개가 쓰는 그래프. */
export const WALK_N = 5;
export const WALK_EDGES: [number, number, number][] = [
  [0, 1, 3],
  [0, 1, 4],
  [1, 2, -2],
  [2, 0, 5],
  [2, 3, 3],
  [3, 1, 1],
  [4, 3, 2],
];

/** 대조에 쓰는 정점 수. 간선 수만 바꾸려고 고정한다. */
export const V = 200;

/** 간선을 가장 많이 둘 수 있는 수 — 순서쌍의 개수다. */
export const E_MAX = V * (V - 1);

const pot = (v: number): number => (v * 13) % 50;

/** 순서쌍 `t` 번째. `t -> (t × 7919) mod E_MAX` 가 자리 바꿈이라 겹치는 간선이 없다. */
function pairAt(t: number): [number, number] {
  const s = (t * 7919) % E_MAX;
  const u = Math.floor(s / (V - 1));
  let v = s % (V - 1);
  if (v >= u) v += 1;
  return [u, v];
}

/** 간선 `e` 개짜리 그래프. */
export function graph(e: number): [number, number, number][] {
  const out: [number, number, number][] = [];
  for (let i = 0; i < e; i++) {
    const [u, v] = pairAt(i);
    out.push([u, v, ((i * 37) % 100) + 1 + pot(u) - pot(v)]);
  }
  return out;
}

/* ────────────────────────── 두 설계 ────────────────────────── */

export interface Run {
  ops: number;
  cells: number;
  dist: number[][];
}

/**
 * 이 가이드의 절차. 정본(`floydWarshall-guide.ref.ts`)과 같고 세는 자리만 덧붙였다.
 *
 * `기본 연산` 은 **두 값을 견준 한 번**을 하나로 센다 — 행렬 칸 하나를 채운 것 · 간선 하나를
 * 옮겨 적으며 견준 것 · 행을 건너뛸지 판정한 것 · 경유 후보 하나를 견준 것이다.
 * `저장 칸` 은 거리 행렬의 칸 수다.
 */
function 플로이드설계(n: number, edges: [number, number, number][]): Run {
  let ops = 0;
  const dist: number[][] = Array.from({ length: n }, (_, u) =>
    Array.from({ length: n }, (_, v) => {
      ops++;
      return u === v ? 0 : INF;
    }),
  );
  for (const [u, v, w] of edges) {
    ops++;
    const row = dist[u] as number[];
    if (w < (row[v] as number)) row[v] = w;
  }
  for (let k = 0; k < n; k++) {
    const viaK = dist[k] as number[];
    for (let u = 0; u < n; u++) {
      ops++;
      const row = dist[u] as number[];
      const toK = row[k] as number;
      if (toK === INF) continue;
      for (let v = 0; v < n; v++) {
        ops++;
        const through = toK + (viaK[v] as number);
        if (through < (row[v] as number)) row[v] = through;
      }
    }
  }
  return { ops, cells: n * n, dist };
}

/**
 * 경쟁 설계 — **존슨 알고리즘**. 벨만-포드로 각 정점의 조정값을 구해 간선 가중치를 0 이상으로
 * 다시 매기고, 출발점마다 다익스트라를 한 번씩 실행한다.
 *
 * 같은 문제를 푼다 — 음수 간선을 허용하고 음수 사이클이 없다고 가정한다. 재가중 없이
 * 다익스트라만 쓰면 음수 간선에서 답이 틀리므로, 그 앞 단계를 뺄 수 없다.
 *
 * `기본 연산` 은 같은 기준이다 — 벨만-포드가 간선 하나를 견준 것 · 재가중이 간선 하나를 만든
 * 것 · 이진 힙이 두 항목을 견준 것 · 힙에서 꺼낸 값이 낡았는지 견준 것 · 다익스트라가 간선
 * 하나를 견준 것 · 답 행렬의 칸 하나를 되돌려 적은 것이다. `저장 칸` 은 답 행렬 · 인접 목록 ·
 * 조정값 배열 · 힙이 가장 컸을 때의 크기를 더한 값이다.
 */
function 존슨설계(n: number, edges: [number, number, number][]): Run {
  let ops = 0;
  const h = new Array<number>(n).fill(0);
  for (let round = 0; round < n; round++) {
    let changed = false;
    for (const [u, v, w] of edges) {
      ops++;
      if ((h[u] as number) + w < (h[v] as number)) {
        h[v] = (h[u] as number) + w;
        changed = true;
      }
    }
    if (!changed) break;
  }

  const head = new Array<number>(n).fill(-1);
  const nextEdge = new Array<number>(edges.length).fill(-1);
  const to = new Array<number>(edges.length).fill(0);
  const weight = new Array<number>(edges.length).fill(0);
  for (const [i, [u, v, w]] of edges.entries()) {
    ops++;
    to[i] = v;
    weight[i] = w + (h[u] as number) - (h[v] as number);
    nextEdge[i] = head[u] as number;
    head[u] = i;
  }

  const dist: number[][] = Array.from({ length: n }, () =>
    new Array<number>(n).fill(INF),
  );
  let heapPeak = 0;
  for (let s = 0; s < n; s++) {
    const d = new Array<number>(n).fill(INF);
    d[s] = 0;
    const node: number[] = [];
    const key: number[] = [];
    const push = (x: number, k: number): void => {
      node.push(x);
      key.push(k);
      let i = node.length - 1;
      while (i > 0) {
        const p = (i - 1) >> 1;
        ops++;
        if ((key[p] as number) <= (key[i] as number)) break;
        [key[p], key[i]] = [key[i] as number, key[p] as number];
        [node[p], node[i]] = [node[i] as number, node[p] as number];
        i = p;
      }
      if (node.length > heapPeak) heapPeak = node.length;
    };
    const pop = (): [number, number] => {
      const topNode = node[0] as number;
      const topKey = key[0] as number;
      const lastNode = node.pop() as number;
      const lastKey = key.pop() as number;
      if (node.length > 0) {
        node[0] = lastNode;
        key[0] = lastKey;
        let i = 0;
        for (;;) {
          const l = 2 * i + 1;
          const r = l + 1;
          let m = i;
          if (l < node.length) {
            ops++;
            if ((key[l] as number) < (key[m] as number)) m = l;
          }
          if (r < node.length) {
            ops++;
            if ((key[r] as number) < (key[m] as number)) m = r;
          }
          if (m === i) break;
          [key[m], key[i]] = [key[i] as number, key[m] as number];
          [node[m], node[i]] = [node[i] as number, node[m] as number];
          i = m;
        }
      }
      return [topNode, topKey];
    };
    push(s, 0);
    while (node.length > 0) {
      const [u, k] = pop();
      ops++;
      if (k > (d[u] as number)) continue;
      for (let e = head[u] as number; e !== -1; e = nextEdge[e] as number) {
        ops++;
        const v = to[e] as number;
        const nd = k + (weight[e] as number);
        if (nd < (d[v] as number)) {
          d[v] = nd;
          push(v, nd);
        }
      }
    }
    const row = dist[s] as number[];
    for (let v = 0; v < n; v++) {
      ops++;
      row[v] =
        (d[v] as number) === INF
          ? INF
          : (d[v] as number) - (h[s] as number) + (h[v] as number);
    }
  }
  return {
    ops,
    cells: n * n + 3 * edges.length + n + heapPeak,
    dist,
  };
}

/* ────────────────────────── 대조 ────────────────────────── */

function 같은가(a: number[][], b: number[][]): boolean {
  return (
    a.length === b.length &&
    a.every((row, i) =>
      row.every((v, j) => v === ((b[i] as number[])[j] as number)),
    )
  );
}

/** 두 설계가 **정본과 같은 답**을 내는지 확인한다. 다르면 대조가 성립하지 않는다. */
function 확인(): void {
  const inputs: [number, [number, number, number][]][] = [
    [WALK_N, WALK_EDGES],
    [V, graph(0)],
    [V, graph(199)],
    [V, graph(400)],
    [V, graph(5_000)],
    [V, graph(E_MAX)],
  ];
  for (const [n, edges] of inputs) {
    const want = floydWarshall(n, edges);
    for (let v = 0; v < n; v++) {
      if ((want[v] as number[])[v] !== 0) {
        throw new Error(`음수 사이클이 있는 입력이다 — dist[${v}][${v}] < 0`);
      }
    }
    if (!같은가(플로이드설계(n, edges).dist, want)) {
      throw new Error("세는 사본이 정본과 다른 답을 낸다");
    }
    if (!같은가(존슨설계(n, edges).dist, want)) {
      throw new Error("경쟁 설계가 정본과 다른 답을 낸다");
    }
  }
}
확인();

/**
 * 간선 수를 늘려 가며 순서가 뒤집히는 자리를 찾는다.
 *
 * `last` 는 존슨 쪽 계수가 아직 적은 마지막 간선 수이고, `first` 는 이 절차 쪽이 처음으로
 * 적어지는 간선 수다. 이분 탐색으로 좁힌 뒤 **두 끝을 다시 재서** 순서가 실제로 그 자리에서
 * 갈리는지 확인하고, 이어져 있지 않으면 던진다.
 */
export function crossing(): { last: number; first: number } {
  const 앞서는가 = (e: number): boolean => {
    const g = graph(e);
    return 플로이드설계(V, g).ops < 존슨설계(V, g).ops;
  };
  let lo = 199;
  let hi = E_MAX;
  if (!앞서는가(hi)) {
    throw new Error("간선을 가장 많이 두어도 순서가 안 뒤집힌다");
  }
  if (앞서는가(lo)) {
    throw new Error("가장 성긴 그래프에서도 이 절차가 앞선다 — 경계가 없다");
  }
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (앞서는가(mid)) hi = mid;
    else lo = mid;
  }
  if (hi !== lo + 1) throw new Error("경계가 이어져 있지 않다");
  if (앞서는가(lo)) throw new Error("경계 앞자리에서 이미 이 절차가 앞선다");
  if (!앞서는가(hi)) throw new Error("경계 뒷자리에서 이 절차가 안 앞선다");
  return { last: lo, first: hi };
}

const CROSS = crossing();

function 재기(
  run: (n: number, edges: [number, number, number][]) => Run,
): Record<string, number> {
  const walk = run(WALK_N, WALK_EDGES);
  const sparse = run(V, graph(400));
  const before = run(V, graph(CROSS.last));
  const after = run(V, graph(CROSS.first));
  const full = run(V, graph(E_MAX));
  return {
    "전개 그래프 · 기본 연산": walk.ops,
    "간선 400 개 · 기본 연산": sparse.ops,
    [`간선 ${CROSS.last} 개 · 기본 연산`]: before.ops,
    [`간선 ${CROSS.first} 개 · 기본 연산`]: after.ops,
    "간선을 가장 많이 둔 그래프 · 기본 연산": full.ops,
    "간선을 가장 많이 둔 그래프 · 저장 칸": full.cells,
    "간선 400 개 · 저장 칸": sparse.cells,
  };
}

const 플로이드 = 재기(플로이드설계);
const 존슨 = 재기(존슨설계);

export const cases = {
  "이 가이드의 절차": () => 플로이드,
  "존슨 알고리즘": () => 존슨,
  경계: () => ({
    "존슨이 앞서는 마지막 간선 수": CROSS.last,
    "이 절차가 앞서는 첫 간선 수": CROSS.first,
  }),
};
