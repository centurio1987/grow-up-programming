/**
 * `purpose.alt`(경쟁 설계와의 대조)의 수치를 실측하는 하네스 — L13.
 *
 * ```bash
 * bun run ../../../../tools/bench-alt.ts primMst-guide.alt.ts
 * bun run ../../../../tools/bench-alt.ts --check primMst-guide.alt.ts
 * ```
 *
 * ## 입력을 왜 전개 입력으로 안 쓰는가
 *
 * 두 설계가 갈리는 축은 **간선 밀도**다. 전개 입력은 정점 6 · 간선 7 이라 밀도를 바꿀 자리가
 * 없다 — 정점을 고정하고 간선 수만 늘려야 순서가 뒤집히는 지점이 나온다. 그래서 정점을 제약
 * 안쪽인 200 으로 고정하고 간선 수만 199(한 줄로 이은 최소)에서 19,900(완전 그래프)까지
 * 바꾼다. 가중치는 `(i × 31 + j × 17) mod 997 + 1` 이라 난수가 아니고, 간선을 채우는 순서도
 * 정점 번호 순이라 같은 `E` 면 언제나 같은 그래프다.
 *
 * **`kruskalMst` 편의 `.alt.ts` 와 같은 생성식이다.** 그 편은 경쟁 설계로 **인접 행렬을 두고
 * 라운드마다 정점을 전수로 보는** 프림을 세웠고, 이 편이 가르치는 것은 **최소 힙을 쓰는**
 * 프림이라 같은 그래프에서도 계수가 다르다. 그래서 두 편의 표를 나란히 놓을 수 없고, 이
 * 파일은 이 편의 절차를 다시 잰다. `primMst-guide.proof.ts` 도 같은 생성식을 쓴다.
 *
 * ## 무엇을 세는가
 *
 * **비교 한 번, 그리고 배열 칸을 읽거나 쓴 한 번**을 각각 기본 연산 하나로 센다 — `perf` 절과
 * 같은 정의다. 크러스컬 쪽은 정렬까지 포함한다. `Array.prototype.sort` 의 비교 횟수는 엔진이
 * 정하므로 셀 수 없어, 정렬을 병합 정렬로 직접 적어 비교와 옮긴 횟수를 센다.
 *
 * 저장 칸은 두 설계가 각각 들고 있는 수의 개수다 — 힙판 프림은 이웃 목록 `4E` 와 큐에 한 번에
 * 담긴 항목의 최대치 `2M` 와 표시 배열 `V`, 크러스컬은 간선 사본 `3E` 와 배열 둘 `2V` 다.
 */

import { primMst } from "./primMst-guide.ref.ts";

type Edge = [number, number, number];

/** 제약 안쪽에서 고른 정점 수. 이 값을 고정하고 간선 수만 바꾼다. */
const V = 200;

/** 결정론적 가중치. `1 ≤ w ≤ 997` 을 지킨다. */
const weight = (i: number, j: number): number => ((i * 31 + j * 17) % 997) + 1;

/**
 * 간선이 `e` 개인 그래프. 먼저 `0—1—…—199` 를 깔아 연결을 보장하고, 그 뒤 남은 자리를 정점
 * 번호 순으로 채운다. `e = 19,900` 이면 완전 그래프다.
 */
function graphOf(e: number): Edge[] {
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
 * 본문 표가 싣는 간선 수 여섯. 순서가 두 번 뒤집히고, 뒤집히는 자리마다 앞뒤 한 칸씩을 함께
 * 싣는다 — 199 부터 하나씩 올려 가며 재서 찾은 자리가 281 과 4,323 이다.
 */
const DENSITIES = [199, 280, 281, 4_322, 4_323, 19_900] as const;

interface Counted {
  answer: number;
  ops: number;
  cells: number;
  /** 큐에서 항목을 꺼낸 횟수. 프림 쪽에서만 뜻이 있다. */
  pops: number;
}

/**
 * 이 가이드가 가르치는 절차 — 후보를 최소 힙에 담고 트리 밖에서 가장 가까운 정점을 꺼낸다.
 * 계수를 세는 자리만 덧붙였고 절차는 `primMst-guide.ref.ts` 와 같다.
 */
function byHeapPrim(edges: Edge[]): Counted {
  let ops = 0;
  const adj: [number, number][][] = Array.from({ length: V }, () => []);
  for (const [u, v, w] of edges) {
    (adj[u] as [number, number][]).push([v, w]);
    (adj[v] as [number, number][]).push([u, w]);
    ops += 2;
  }

  const inTree: boolean[] = Array.from({ length: V }, () => false);
  const items: [number, number][] = [];
  let maxItems = 0;

  const key = (i: number): number => (items[i] as [number, number])[1];
  const swap = (a: number, b: number): void => {
    const t = items[a] as [number, number];
    items[a] = items[b] as [number, number];
    items[b] = t;
    ops += 2;
  };
  const push = (node: number, k: number): void => {
    items.push([node, k]);
    if (items.length > maxItems) maxItems = items.length;
    let i = items.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      ops += 1;
      if (key(i) >= key(parent)) break;
      swap(i, parent);
      i = parent;
    }
  };
  const pop = (): [number, number] => {
    const top = items[0] as [number, number];
    const last = items.pop() as [number, number];
    if (items.length > 0) {
      items[0] = last;
      ops += 1;
      let i = 0;
      for (;;) {
        const left = 2 * i + 1;
        const right = 2 * i + 2;
        let small = i;
        if (left < items.length) {
          ops += 1;
          if (key(left) < key(small)) small = left;
        }
        if (right < items.length) {
          ops += 1;
          if (key(right) < key(small)) small = right;
        }
        if (small === i) break;
        swap(i, small);
        i = small;
      }
    }
    return top;
  };

  push(0, 0);
  let total = 0;
  let joined = 0;
  let answer = -1;
  let pops = 0;
  while (items.length > 0) {
    const [u, w] = pop();
    pops++;
    ops += 1;
    if (inTree[u] === true) continue;
    inTree[u] = true;
    total += w;
    joined++;
    ops += 1;
    if (joined === V) {
      answer = total;
      break;
    }
    for (const [v, ew] of adj[u] as [number, number][]) {
      ops += 1;
      if (inTree[v] !== true) push(v, ew);
    }
  }
  return {
    answer: joined === V ? answer : -1,
    ops,
    cells: 4 * edges.length + 2 * maxItems + V,
    pops,
  };
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

/**
 * 경쟁 설계 — 크러스컬(Kruskal). 간선을 가중치 오름차순으로 놓고 하나씩 보면서, 두 끝점이
 * 서로 다른 덩어리일 때만 고른다. 덩어리는 정점마다 대표를 가리키는 배열로 들고 있고, 붙이는
 * 방향과 경로 압축을 둘 다 쓴다 — `kruskalMst` 편의 정본과 같은 절차다.
 */
function byKruskal(edges: Edge[]): Counted {
  const { sorted, ops: sortOps } = mergeSort([...edges]);
  const parent: number[] = Array.from({ length: V }, (_, i) => i);
  const rank: number[] = Array.from({ length: V }, () => 0);
  let ops = sortOps;
  let total = 0;
  let picked = 0;

  const find = (x: number): number => {
    let root = x;
    for (;;) {
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
    pops: 0,
  };
}

/** 두 설계가 같은 답을 내는지 먼저 확인한다. 안 같으면 대조가 아니라 다른 문제를 잰 것이다. */
function measure(e: number): { prim: Counted; kruskal: Counted } {
  const edges = graphOf(e);
  const prim = byHeapPrim(edges);
  const kruskal = byKruskal(edges);
  const want = primMst(V, edges);
  if (prim.answer !== want || kruskal.answer !== want) {
    throw new Error(
      `두 설계의 답이 갈린다 — 프림 ${prim.answer} · 크러스컬 ${kruskal.answer} · 정본 ${want}`,
    );
  }
  return { prim, kruskal };
}

export const cases = {
  "후보를 최소 힙에 담아 하나씩 붙인다": () => {
    const out: Record<string, number> = {};
    for (const e of DENSITIES) out[`E=${e} 기본 연산`] = measure(e).prim.ops;
    out["E=199 저장 칸"] = byHeapPrim(graphOf(199)).cells;
    out["E=19900 저장 칸"] = byHeapPrim(graphOf(19_900)).cells;
    for (const e of [199, 4_322, 19_900]) {
      out[`E=${e} 꺼낸 항목`] = byHeapPrim(graphOf(e)).pops;
    }
    return out;
  },
  "간선을 정렬하고 대표 배열로 판정한다": () => {
    const out: Record<string, number> = {};
    for (const e of DENSITIES) out[`E=${e} 기본 연산`] = measure(e).kruskal.ops;
    out["E=199 저장 칸"] = byKruskal(graphOf(199)).cells;
    out["E=19900 저장 칸"] = byKruskal(graphOf(19_900)).cells;
    return out;
  },
};
