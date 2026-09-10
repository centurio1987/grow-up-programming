/**
 * `purpose.alt`(경쟁 설계와의 대조)의 수치를 실측하는 하네스 — L13.
 *
 * ```bash
 * bun run ../../../../tools/bench-alt.ts kruskalMst-guide.alt.ts
 * bun run ../../../../tools/bench-alt.ts --check kruskalMst-guide.alt.ts
 * ```
 *
 * ## 입력을 왜 전개 입력으로 안 쓰는가
 *
 * 두 설계가 갈리는 축은 **간선 밀도**다. 전개 입력은 정점 6 · 간선 7 이라 밀도를 바꿀 자리가
 * 없다 — 정점을 고정하고 간선 수만 늘려야 우열이 뒤집히는 지점이 나온다. 그래서 정점을
 * 제약 안쪽인 200 으로 고정하고 간선 수만 199(한 줄로 이은 최소)에서 19,900(완전 그래프)까지
 * 바꾼다. 가중치는 `(i × 31 + j × 17) mod 997 + 1` 이라 난수가 아니고, 간선을 채우는 순서도
 * 정점 번호 순이라 같은 `E` 면 언제나 같은 그래프다.
 *
 * ## 무엇을 세는가
 *
 * **비교 한 번, 그리고 배열·행렬 칸을 읽거나 쓴 한 번**을 각각 기본 연산 하나로 센다 —
 * `perf` 절과 같은 정의다. 크러스컬 쪽은 정렬까지 포함한다. `Array.prototype.sort` 의 비교
 * 횟수는 엔진이 정하므로 셀 수 없어, 정렬을 병합 정렬로 직접 적어 비교와 옮긴 횟수를 센다.
 *
 * 저장 칸은 두 설계가 각각 들고 있는 수의 개수다 — 크러스컬은 간선 사본 `3E` 와 배열 둘
 * `2V`, 프림은 인접 행렬 `V²` 와 배열 둘 `2V` 다.
 */

import { kruskalMst } from "./kruskalMst-guide.ref.ts";

type Edge = [number, number, number];

/** 제약 안쪽에서 고른 정점 수. 이 값을 고정하고 간선 수만 바꾼다. */
const V = 200;

/** 결정론적 가중치. `1 ≤ w ≤ 997` 을 지킨다. */
const weight = (i: number, j: number): number => ((i * 31 + j * 17) % 997) + 1;

/**
 * 간선이 `e` 개인 그래프. 먼저 `0—1—…—199` 를 깔아 연결을 보장하고, 그 뒤 남은 자리를
 * 정점 번호 순으로 채운다. `e = 19,900` 이면 완전 그래프다.
 */
function graph(e: number): Edge[] {
  const out: Edge[] = [];
  for (let i = 0; i + 1 < V; i++) out.push([i, i + 1, weight(i, i + 1)]);
  outer: for (let i = 0; i < V; i++) {
    for (let j = i + 1; j < V; j++) {
      if (j === i + 1) continue;
      if (out.length >= e) break outer;
      out.push([i, j, weight(i, j)]);
    }
  }
  return out;
}

/**
 * 본문 표가 싣는 간선 수 다섯. 셋째와 넷째 사이에서 기본 연산의 순서가 뒤집힌다 —
 * 그 자리를 찾으려고 199 부터 하나씩 올려 보며 실측한 값이 9,903 이다.
 */
const DENSITIES = [199, 5_000, 9_902, 9_903, 19_900] as const;

interface Counted {
  answer: number;
  ops: number;
  cells: number;
}

/** 병합 정렬. 비교 한 번과 옮긴 한 번을 각각 기본 연산으로 센다. */
function mergeSort(xs: Edge[]): { sorted: Edge[]; ops: number } {
  let ops = 0;
  const go = (a: Edge[]): Edge[] => {
    if (a.length < 2) return a;
    const mid = a.length >> 1;
    const left = go(a.slice(0, mid));
    const right = go(a.slice(mid));
    const out: Edge[] = [];
    let i = 0;
    let j = 0;
    while (i < left.length && j < right.length) {
      ops += 1;
      if ((left[i] as Edge)[2] <= (right[j] as Edge)[2]) {
        out.push(left[i] as Edge);
        i++;
      } else {
        out.push(right[j] as Edge);
        j++;
      }
      ops += 1;
    }
    while (i < left.length) {
      out.push(left[i] as Edge);
      i++;
      ops += 1;
    }
    while (j < right.length) {
      out.push(right[j] as Edge);
      j++;
      ops += 1;
    }
    return out;
  };
  return { sorted: go(xs), ops };
}

/** 이 가이드가 가르치는 절차 — 간선을 정렬하고 대표 배열로 사이클을 판정한다. */
function byKruskal(edges: Edge[]): Counted {
  const { sorted, ops: sortOps } = mergeSort([...edges]);
  const parent: number[] = Array.from({ length: V }, (_, i) => i);
  const rank: number[] = Array.from({ length: V }, () => 0);
  let ops = sortOps;
  let total = 0;
  let picked = 0;

  const find = (x: number): number => {
    let root = x;
    while (true) {
      ops += 1;
      if (parent[root] === root) break;
      root = parent[root] as number;
    }
    let cur = x;
    while (parent[cur] !== root) {
      ops += 2;
      const next = parent[cur] as number;
      parent[cur] = root;
      cur = next;
    }
    ops += 1;
    return root;
  };

  for (const [u, v, w] of sorted) {
    const ru = find(u);
    const rv = find(v);
    if (ru === rv) continue;
    ops += 2;
    if ((rank[ru] as number) > (rank[rv] as number)) {
      parent[rv] = ru;
      ops += 1;
    } else {
      parent[ru] = rv;
      ops += 1;
      if (rank[ru] === rank[rv]) {
        rank[rv] = (rank[rv] as number) + 1;
        ops += 2;
      }
    }
    total += w;
    picked++;
    if (picked === V - 1) break;
  }
  return {
    answer: picked === V - 1 ? total : -1,
    ops,
    cells: 3 * edges.length + 2 * V,
  };
}

/**
 * 경쟁 설계 — 프림(Prim). 트리를 정점 하나에서 시작해 **트리에 가장 가까운 정점**을 한 번에
 * 하나씩 붙인다. 간선을 정렬하지 않고, 인접 행렬을 두어 라운드마다 미포함 정점을 전수로 본다.
 */
function byPrim(edges: Edge[]): Counted {
  const INF = Number.POSITIVE_INFINITY;
  let ops = 0;

  // 인접 행렬을 한 줄로 편다. `near[u * V + v]` 가 행렬의 (u, v) 칸이다 — 칸 수는 그대로
  // `V²` 이고, 중첩 배열이면 안쪽 배열을 꺼낼 때마다 타입을 좁혀야 해서 한 줄로 뒀다.
  const near: number[] = Array.from({ length: V * V }, () => INF);
  ops += V * V;
  for (const [u, v, w] of edges) {
    ops += 2;
    if (w < (near[u * V + v] as number)) {
      near[u * V + v] = w;
      near[v * V + u] = w;
      ops += 2;
    }
  }

  const dist: number[] = Array.from({ length: V }, () => INF);
  const inTree: boolean[] = Array.from({ length: V }, () => false);
  dist[0] = 0;
  let total = 0;

  for (let round = 0; round < V; round++) {
    let best = -1;
    for (let x = 0; x < V; x++) {
      ops += 2;
      if (
        inTree[x] !== true &&
        (best < 0 || (dist[x] as number) < (dist[best] as number))
      ) {
        best = x;
      }
    }
    if (best < 0 || dist[best] === INF) {
      return { answer: -1, ops, cells: V * V + 2 * V };
    }
    inTree[best] = true;
    total += dist[best] as number;
    ops += 1;
    for (let y = 0; y < V; y++) {
      ops += 2;
      if (
        inTree[y] !== true &&
        (near[best * V + y] as number) < (dist[y] as number)
      ) {
        dist[y] = near[best * V + y] as number;
        ops += 1;
      }
    }
  }
  return { answer: total, ops, cells: V * V + 2 * V };
}

/** 두 설계가 같은 답을 내는지 먼저 확인한다. 안 같으면 대조가 아니라 다른 문제를 잰 것이다. */
function measure(e: number): { kruskal: Counted; prim: Counted } {
  const edges = graph(e);
  const kruskal = byKruskal(edges);
  const prim = byPrim(edges);
  const want = kruskalMst(V, edges);
  if (kruskal.answer !== want || prim.answer !== want) {
    throw new Error(
      `두 설계의 답이 갈린다 — 크러스컬 ${kruskal.answer} · 프림 ${prim.answer} · 정본 ${want}`,
    );
  }
  return { kruskal, prim };
}

export const cases = {
  "간선을 정렬하고 대표 배열로 판정": () => {
    const out: Record<string, number> = {};
    for (const e of DENSITIES) out[`E=${e} 기본 연산`] = measure(e).kruskal.ops;
    out["E=199 저장 칸"] = byKruskal(graph(199)).cells;
    out["E=19900 저장 칸"] = byKruskal(graph(19_900)).cells;
    return out;
  },
  "가장 가까운 정점을 하나씩 붙인다": () => {
    const out: Record<string, number> = {};
    for (const e of DENSITIES) out[`E=${e} 기본 연산`] = measure(e).prim.ops;
    out["E=199 저장 칸"] = byPrim(graph(199)).cells;
    out["E=19900 저장 칸"] = byPrim(graph(19_900)).cells;
    return out;
  },
};
