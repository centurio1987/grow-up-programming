/**
 * `purpose.alt`(경쟁 설계와의 대조) 의 계수를 내는 하네스 — `tools/bench-alt.ts` 가 읽는다.
 *
 * **정본은 계수를 내보내지 않는다.** 그래서 세는 자리만 덧붙인 사본이 필요한데, 그 사본이
 * 정본과 다른 절차가 되어 버리면 계수가 다른 문제의 값이 된다. 그래서 `measure()` 는 매 실행
 * 마다 사본과 정본의 답을 같은 작업 목록으로 대조하고, 한 자리라도 어긋나면 던진다.
 *
 * 세는 단위는 **배열 칸 접근** 하나다 — 배열의 한 칸을 읽거나 쓰는 것 하나. 벽시계는 쓰지
 * 않는다. 두 설계가 같은 방식으로 세도록, 배열을 만드는 것도 칸 수만큼 센다.
 *
 * 여기 있는 도구를 `<name>-guide.proof.ts` 도 함께 쓴다 — 트리 만들기 · 자식 고르는 규칙 ·
 * 구간 수 세기가 본문 여러 절에서 같은 값이어야 하므로 정의를 한 벌만 둔다.
 */

import { HeavyLightDecomposition } from "./heavyLightDecomposition-guide.ref.ts";

export type Edge = [number, number];

/** 배열 칸 접근 계수기. 읽기 한 번과 쓰기 한 번이 각각 1 이다. */
export interface Counter {
  cells: number;
}

/* ────────────────────────── 트리 만들기 ────────────────────────── */

/** 한 줄로 이은 트리. 정점 `i` 의 부모가 `i - 1` 이다. */
export function chain(v: number): Edge[] {
  const out: Edge[] = [];
  for (let i = 1; i < v; i++) out.push([i - 1, i]);
  return out;
}

/** 별 모양. 정점 0 이 나머지 전부와 이어진다. */
export function star(v: number): Edge[] {
  const out: Edge[] = [];
  for (let i = 1; i < v; i++) out.push([0, i]);
  return out;
}

/** 꽉 찬 이진 트리. 정점 `i` 의 부모가 `(i-1) >> 1` 이다. */
export function binary(v: number): Edge[] {
  const out: Edge[] = [];
  for (let i = 1; i < v; i++) out.push([(i - 1) >> 1, i]);
  return out;
}

/** 애벌레. 줄 하나에 잎을 하나씩 매단다. */
export function caterpillar(v: number): Edge[] {
  const out: Edge[] = [];
  let spine = 0;
  for (let i = 1; i < v; i++) {
    if (i % 2 === 1) out.push([spine, i]);
    else {
      out.push([spine, i]);
      spine = i;
    }
  }
  return out;
}

/**
 * 잎이 먼저 나오는 애벌레 — 「처음 만난 자식을 고른다」 규칙이 걸리는 트리.
 *
 * 줄 위의 정점마다 잎이 하나씩 달려 있는 것은 `caterpillar` 와 같고, 간선을 적은 순서만
 * 반대다. 그래서 순회가 잎을 먼저 만나고, 「처음 만난 자식」 규칙이 잎을 무거운 자식으로
 * 삼는다 — 줄로 내려가는 간선이 전부 가벼워진다.
 */
export function leafFirstCaterpillar(v: number): Edge[] {
  const out: Edge[] = [];
  let spine = 0;
  for (let i = 1; i + 1 < v; i += 2) {
    out.push([spine, i]); // 줄의 다음 칸
    out.push([spine, i + 1]); // 잎
    spine = i;
  }
  if (out.length < v - 1) out.push([spine, v - 1]);
  return out;
}

/**
 * 높이 덫 — 「가장 깊은 자식을 고른다」 규칙이 가벼운 간선을 많이 만들게 하는 트리.
 *
 * `i` 층의 뿌리에 정점 `2i` 개짜리 줄 하나와 `i-1` 층 전체를 매단다. 줄 쪽 높이가 `2i` 이고
 * 아래층 쪽 높이가 `2(i-1)+1` 이라 줄 쪽이 언제나 더 높다. 그래서 높이 규칙은 매번 줄을
 * 고르고, 아래층으로 내려가는 간선이 전부 가벼워진다. 크기 규칙은 반대로 아래층을 고른다 —
 * 아래층 전체가 줄 하나보다 크기 때문이다.
 */
export function heightTrap(k: number): { v: number; edges: Edge[] } {
  const edges: Edge[] = [];
  let next = 1;
  let cur = 0; // 지금 층의 뿌리
  for (let i = k; i >= 1; i--) {
    let prev = cur;
    for (let j = 0; j < 2 * i; j++) {
      edges.push([prev, next]);
      prev = next;
      next += 1;
    }
    edges.push([cur, next]); // 다음 층의 뿌리
    cur = next;
    next += 1;
  }
  return { v: next, edges };
}

/* ──────────────────── 자식을 고르는 규칙과 사슬 ──────────────────── */

export type ChildRule = "first" | "deep" | "size";

export interface Decomposition {
  parent: number[];
  depth: number[];
  size: number[];
  height: number[];
  heavy: number[];
  head: number[];
  pos: number[];
  order: number[];
}

/** 뿌리에서 한 번 따라가며 부모·깊이·방문 순서를 정한다. 재귀를 쓰지 않는다. */
function walkOnce(
  v: number,
  edges: Edge[],
  root: number,
): { near: number[][]; parent: number[]; depth: number[]; order: number[] } {
  const near: number[][] = Array.from({ length: v }, () => []);
  for (const [a, b] of edges) {
    (near[a] as number[]).push(b);
    (near[b] as number[]).push(a);
  }
  const parent: number[] = Array.from({ length: v }, () => root);
  const depth: number[] = Array.from({ length: v }, () => 0);
  const order: number[] = [];
  const seen: boolean[] = Array.from({ length: v }, () => false);
  const stack: number[] = [root];
  seen[root] = true;
  while (stack.length > 0) {
    const u = stack.pop() as number;
    order.push(u);
    for (const w of near[u] as number[]) {
      if (seen[w]) continue;
      seen[w] = true;
      parent[w] = u;
      depth[w] = (depth[u] as number) + 1;
      stack.push(w);
    }
  }
  return { near, parent, depth, order };
}

/** 규칙 하나로 사슬을 만든다. `size` 규칙이 정본이 쓰는 것이다. */
export function decompose(
  v: number,
  edges: Edge[],
  root: number,
  rule: ChildRule,
): Decomposition {
  const { near, parent, depth, order } = walkOnce(v, edges, root);
  const size: number[] = Array.from({ length: v }, () => 1);
  const height: number[] = Array.from({ length: v }, () => 0);
  for (let i = order.length - 1; i >= 1; i--) {
    const w = order[i] as number;
    const p = parent[w] as number;
    size[p] = (size[p] as number) + (size[w] as number);
    const lift = (height[w] as number) + 1;
    if (lift > (height[p] as number)) height[p] = lift;
  }

  const heavy: number[] = Array.from({ length: v }, () => -1);
  const best: number[] = Array.from({ length: v }, () => -1);
  for (const w of order) {
    if (w === root) continue;
    const p = parent[w] as number;
    const score =
      rule === "size"
        ? (size[w] as number)
        : rule === "deep"
          ? (height[w] as number)
          : 0;
    if (rule === "first") {
      if ((heavy[p] as number) === -1) heavy[p] = w;
      continue;
    }
    if (score > (best[p] as number)) {
      best[p] = score;
      heavy[p] = w;
    }
  }

  const head: number[] = Array.from({ length: v }, () => root);
  const pos: number[] = Array.from({ length: v }, () => 0);
  let timer = 0;
  const tops: number[] = [root];
  while (tops.length > 0) {
    const top = tops.pop() as number;
    let w = top;
    while (w !== -1) {
      head[w] = top;
      pos[w] = timer;
      timer += 1;
      const pw = parent[w] as number;
      const hw = heavy[w] as number;
      for (const c of near[w] as number[]) {
        if (c === pw || c === hw) continue;
        tops.push(c);
      }
      w = hw;
    }
  }
  return { parent, depth, size, height, heavy, head, pos, order };
}

/** `u`–`w` 경로가 몇 개의 사슬 구간으로 갈리는가. */
export function segmentCount(d: Decomposition, u0: number, w0: number): number {
  let u = u0;
  let w = w0;
  let count = 0;
  while ((d.head[u] as number) !== (d.head[w] as number)) {
    const hu = d.depth[d.head[u] as number] as number;
    const hw = d.depth[d.head[w] as number] as number;
    if (hu < hw) {
      const t = u;
      u = w;
      w = t;
    }
    count += 1;
    u = d.parent[d.head[u] as number] as number;
  }
  return count + 1;
}

/** 뿌리에서 `w` 까지 가벼운 간선이 몇 개인가. */
export function lightEdges(d: Decomposition, w0: number): number {
  let w = w0;
  let count = 0;
  while ((d.head[w] as number) !== w || (d.parent[w] as number) !== w) {
    if ((d.head[w] as number) === w) {
      const p = d.parent[w] as number;
      if (p === w) break;
      count += 1;
      w = p;
      continue;
    }
    w = d.head[w] as number;
  }
  return count;
}

/** `u`–`w` 경로 위 정점 전부. */
export function pathVertices(
  d: Decomposition,
  u0: number,
  w0: number,
): number[] {
  const up: number[] = [];
  const down: number[] = [];
  let u = u0;
  let w = w0;
  while (u !== w) {
    if ((d.depth[u] as number) >= (d.depth[w] as number)) {
      up.push(u);
      u = d.parent[u] as number;
    } else {
      down.push(w);
      w = d.parent[w] as number;
    }
  }
  up.push(u);
  down.reverse();
  return [...up, ...down];
}

/**
 * 자리 번호를 매긴 방식 하나에서, 경로가 **몇 개의 이어진 구간**으로 갈리는가.
 * 사슬 구간 수와 달리 절차를 안 보고 번호만 본다 — 두 방식을 같은 잣대로 재려는 것이다.
 */
export function runCount(
  d: Decomposition,
  pos: number[],
  u: number,
  w: number,
): number {
  const marks = pathVertices(d, u, w)
    .map((x) => pos[x] as number)
    .sort((a, b) => a - b);
  let runs = 1;
  for (let i = 1; i < marks.length; i++) {
    if ((marks[i] as number) !== (marks[i - 1] as number) + 1) runs += 1;
  }
  return runs;
}

/** 이웃 번호가 작은 자식부터 매기는 자리 번호. 정점 순서만 보고 정한다. */
export function plainPos(v: number, edges: Edge[], root: number): number[] {
  const near: number[][] = Array.from({ length: v }, () => []);
  for (const [a, b] of edges) {
    (near[a] as number[]).push(b);
    (near[b] as number[]).push(a);
  }
  for (const list of near) list.sort((a, b) => a - b);
  const pos: number[] = Array.from({ length: v }, () => 0);
  const seen: boolean[] = Array.from({ length: v }, () => false);
  const stack: number[] = [root];
  seen[root] = true;
  let timer = 0;
  while (stack.length > 0) {
    const u = stack.pop() as number;
    pos[u] = timer;
    timer += 1;
    const list = (near[u] as number[]).slice().reverse();
    for (const w of list) {
      if (seen[w]) continue;
      seen[w] = true;
      stack.push(w);
    }
  }
  return pos;
}

/* ─────────────────── 가장 단순한 방법 — 경로를 걷는다 ─────────────────── */

/** 질의마다 경로를 실제로 걸어 값을 더한다. 표도 자료구조도 쓰지 않는다. */
export function naiveWalk(
  v: number,
  edges: Edge[],
  root: number,
  values: number[],
  queries: [number, number][],
): { cells: number; answers: number[] } {
  const c: Counter = { cells: 0 };
  const { parent, depth } = walkOnce(v, edges, root);
  c.cells += 3 * v + 2 * edges.length; // 이웃 목록 · 부모 · 깊이
  const answers: number[] = [];
  for (const [a, b] of queries) {
    let u = a;
    let w = b;
    let sum = 0;
    while (u !== w) {
      c.cells += 2; // depth 두 칸
      if ((depth[u] as number) >= (depth[w] as number)) {
        sum += values[u] as number;
        u = parent[u] as number;
        c.cells += 2; // values 한 칸 · parent 한 칸
      } else {
        sum += values[w] as number;
        w = parent[w] as number;
        c.cells += 2;
      }
    }
    sum += values[u] as number;
    c.cells += 1;
    answers.push(sum);
  }
  return { cells: c.cells, answers };
}

/* ─────────────────── 정본의 계수 사본 — 무거운 경로 분할 ─────────────────── */

export interface CountedStructure {
  pre: number;
  store: number;
  update(node: number, value: number): number;
  query(u: number, w: number): { sum: number; cells: number };
}

/** 정본 `heavyLightDecomposition-guide.ref.ts` 의 접근을 한 줄씩 그대로 세는 사본. */
export function hldCounted(
  v: number,
  edges: Edge[],
  root: number,
  values: number[],
): CountedStructure & { records: number; chains: number } {
  const e = edges.length;
  let pre = 0;

  const near: number[][] = Array.from({ length: v }, () => []);
  pre += v;
  for (const [a, b] of edges) {
    (near[a] as number[]).push(b);
    (near[b] as number[]).push(a);
  }
  pre += 2 * e;

  const parent: number[] = Array.from({ length: v }, () => root);
  const depth: number[] = Array.from({ length: v }, () => 0);
  const size: number[] = Array.from({ length: v }, () => 1);
  const heavy: number[] = Array.from({ length: v }, () => -1);
  pre += 4 * v;

  const order: number[] = [];
  const seen: boolean[] = Array.from({ length: v }, () => false);
  pre += v;
  const stack: number[] = [root];
  seen[root] = true;
  pre += 2;
  while (stack.length > 0) {
    const u = stack.pop() as number;
    order.push(u);
    pre += 2;
    for (const w of near[u] as number[]) {
      pre += 2; // 이웃 항목 한 칸 · seen 한 칸
      if (seen[w]) continue;
      seen[w] = true;
      parent[w] = u;
      depth[w] = (depth[u] as number) + 1;
      stack.push(w);
      pre += 5;
    }
  }

  for (let i = order.length - 1; i >= 1; i--) {
    const w = order[i] as number;
    const p = parent[w] as number;
    size[p] = (size[p] as number) + (size[w] as number);
    pre += 5;
  }

  const best: number[] = Array.from({ length: v }, () => 0);
  pre += v;
  let records = 0;
  for (const w of order) {
    pre += 1; // order 한 칸
    if (w === root) continue;
    const p = parent[w] as number;
    const sw = size[w] as number;
    pre += 3; // parent · size[w] · best[p]
    if (sw > (best[p] as number)) {
      best[p] = sw;
      heavy[p] = w;
      pre += 2;
      records += 1;
    }
  }

  const head: number[] = Array.from({ length: v }, () => root);
  const pos: number[] = Array.from({ length: v }, () => 0);
  pre += 2 * v;
  let timer = 0;
  let chains = 0;
  const tops: number[] = [root];
  pre += 1;
  while (tops.length > 0) {
    const top = tops.pop() as number;
    pre += 1;
    chains += 1;
    let w = top;
    while (w !== -1) {
      head[w] = top;
      pos[w] = timer;
      timer += 1;
      const pw = parent[w] as number;
      const hw = heavy[w] as number;
      pre += 5; // head 쓰기 · pos 쓰기 · parent · heavy · 이웃 목록
      for (const c of near[w] as number[]) {
        pre += 1;
        if (c === pw || c === hw) continue;
        tops.push(c);
        pre += 1;
      }
      w = hw;
    }
  }

  const val: number[] = Array.from({ length: v }, () => 0);
  const bit: number[] = Array.from({ length: v + 1 }, () => 0);
  pre += 2 * v + 1;
  for (let w = 0; w < v; w++) {
    const x = values[w] as number;
    val[w] = x;
    bit[(pos[w] as number) + 1] = x;
    pre += 4;
  }
  for (let i = 1; i <= v; i++) {
    const j = i + (i & -i);
    if (j <= v) {
      bit[j] = (bit[j] as number) + (bit[i] as number);
      pre += 3;
    }
  }

  const c: Counter = { cells: 0 };
  const prefix = (i: number): number => {
    let s = 0;
    for (let k = i; k > 0; k -= k & -k) {
      s += bit[k] as number;
      c.cells += 1;
    }
    return s;
  };
  const range = (l: number, r: number): number => prefix(r + 1) - prefix(l);

  return {
    pre,
    store: 6 * v + 1,
    records,
    chains,
    update(node: number, value: number): number {
      c.cells = 0;
      const delta = value - (val[node] as number);
      val[node] = value;
      c.cells += 2;
      for (let i = (pos[node] as number) + 1; i <= v; i += i & -i) {
        bit[i] = (bit[i] as number) + delta;
        c.cells += 2;
      }
      c.cells += 1; // pos 한 칸
      return c.cells;
    },
    query(u0: number, w0: number): { sum: number; cells: number } {
      c.cells = 0;
      let u = u0;
      let w = w0;
      let total = 0;
      while (true) {
        const hu = head[u] as number;
        const hw = head[w] as number;
        c.cells += 2;
        if (hu === hw) break;
        c.cells += 2; // 머리 둘의 깊이
        if ((depth[hu] as number) < (depth[hw] as number)) {
          const t = u;
          u = w;
          w = t;
        }
        const h = head[u] as number;
        c.cells += 3; // head 한 칸 · pos 두 칸
        total += range(pos[h] as number, pos[u] as number);
        u = parent[h] as number;
        c.cells += 1;
      }
      c.cells += 2; // pos 두 칸
      const lo = Math.min(pos[u] as number, pos[w] as number);
      const hi = Math.max(pos[u] as number, pos[w] as number);
      total += range(lo, hi);
      return { sum: total, cells: c.cells };
    },
  };
}

/* ────────────── 경쟁 설계 — 오일러 구간 갱신과 조상 표 ────────────── */

/**
 * 값을 **뿌리에서 그 정점까지의 합** `S(v)` 로 들고 있는 설계.
 *
 * 정점 `w` 의 값은 `w` 의 부분트리에 있는 모든 정점의 `S` 에 더해지므로, 오일러 구간
 * `[tin(w), tout(w)]` 에 구간 갱신 한 번으로 반영된다. 경로 합은
 * `S(u) + S(v) − 2·S(lca) + value(lca)` 다. 최소 공통 조상은 `2^k` 칸 위 조상 표로 구한다.
 */
export function eulerLiftCounted(
  v: number,
  edges: Edge[],
  root: number,
  values: number[],
): CountedStructure {
  const e = edges.length;
  const LOG = Math.floor(Math.log2(Math.max(v, 1))) + 1;
  let pre = 0;

  const near: number[][] = Array.from({ length: v }, () => []);
  pre += v;
  for (const [a, b] of edges) {
    (near[a] as number[]).push(b);
    (near[b] as number[]).push(a);
  }
  pre += 2 * e;

  const parent: number[] = Array.from({ length: v }, () => root);
  const depth: number[] = Array.from({ length: v }, () => 0);
  const size: number[] = Array.from({ length: v }, () => 1);
  const tin: number[] = Array.from({ length: v }, () => 0);
  pre += 4 * v;

  const order: number[] = [];
  const seen: boolean[] = Array.from({ length: v }, () => false);
  pre += v;
  const stack: number[] = [root];
  seen[root] = true;
  pre += 2;
  while (stack.length > 0) {
    const u = stack.pop() as number;
    order.push(u);
    tin[u] = order.length - 1;
    pre += 3;
    for (const w of near[u] as number[]) {
      pre += 2;
      if (seen[w]) continue;
      seen[w] = true;
      parent[w] = u;
      depth[w] = (depth[u] as number) + 1;
      stack.push(w);
      pre += 5;
    }
  }
  for (let i = order.length - 1; i >= 1; i--) {
    const w = order[i] as number;
    const p = parent[w] as number;
    size[p] = (size[p] as number) + (size[w] as number);
    pre += 5;
  }

  // `2^k` 칸 위 조상 표. 한 줄로 편 배열이라 칸 수가 `v · LOG` 다.
  const anc: number[] = Array.from({ length: v * LOG }, () => root);
  pre += v * LOG;
  for (const w of order) {
    anc[w * LOG] = parent[w] as number;
    pre += 3;
  }
  for (let k = 1; k < LOG; k++) {
    for (let w = 0; w < v; w++) {
      const mid = anc[w * LOG + k - 1] as number;
      anc[w * LOG + k] = anc[mid * LOG + k - 1] as number;
      pre += 3;
    }
  }

  // 차분 배열을 만든 뒤 펜윅 트리를 한 번에 세운다. 구간 갱신 · 점 조회 꼴이다.
  const val: number[] = Array.from({ length: v }, () => 0);
  const bit: number[] = Array.from({ length: v + 2 }, () => 0);
  pre += 2 * v + 2;
  for (let w = 0; w < v; w++) {
    const x = values[w] as number;
    val[w] = x;
    const l = (tin[w] as number) + 1;
    const r = l + (size[w] as number) - 1;
    bit[l] = (bit[l] as number) + x;
    bit[r + 1] = (bit[r + 1] as number) - x;
    pre += 8;
  }
  for (let i = 1; i <= v; i++) {
    const j = i + (i & -i);
    if (j <= v) {
      bit[j] = (bit[j] as number) + (bit[i] as number);
      pre += 3;
    }
  }

  const c: Counter = { cells: 0 };
  const prefix = (i: number): number => {
    let s = 0;
    for (let k = i; k > 0; k -= k & -k) {
      s += bit[k] as number;
      c.cells += 1;
    }
    return s;
  };

  const lca = (a: number, b: number): number => {
    let u = a;
    let w = b;
    c.cells += 2;
    if ((depth[u] as number) < (depth[w] as number)) {
      const t = u;
      u = w;
      w = t;
    }
    c.cells += 2;
    const gap = (depth[u] as number) - (depth[w] as number);
    for (let k = 0; k < LOG; k++) {
      if (((gap >> k) & 1) === 1) {
        u = anc[u * LOG + k] as number;
        c.cells += 1;
      }
    }
    if (u === w) return u;
    for (let k = LOG - 1; k >= 0; k--) {
      const up = anc[u * LOG + k] as number;
      const wp = anc[w * LOG + k] as number;
      c.cells += 2;
      if (up !== wp) {
        u = up;
        w = wp;
      }
    }
    c.cells += 1;
    return anc[u * LOG] as number;
  };

  return {
    pre,
    store: 5 * v + 2 + v * LOG,
    update(node: number, value: number): number {
      c.cells = 0;
      const delta = value - (val[node] as number);
      val[node] = value;
      c.cells += 2;
      const l = (tin[node] as number) + 1;
      const r = l + (size[node] as number) - 1;
      c.cells += 2;
      for (let i = l; i <= v; i += i & -i) {
        bit[i] = (bit[i] as number) + delta;
        c.cells += 2;
      }
      for (let i = r + 1; i <= v; i += i & -i) {
        bit[i] = (bit[i] as number) - delta;
        c.cells += 2;
      }
      return c.cells;
    },
    query(u: number, w: number): { sum: number; cells: number } {
      c.cells = 0;
      const l = lca(u, w);
      c.cells += 3; // tin 세 칸
      const su = prefix((tin[u] as number) + 1);
      const sw = prefix((tin[w] as number) + 1);
      const sl = prefix((tin[l] as number) + 1);
      c.cells += 1; // val 한 칸
      return { sum: su + sw - 2 * sl + (val[l] as number), cells: c.cells };
    },
  };
}

/* ────────────────────────── 대조용 작업 목록 ────────────────────────── */

/** 대조에 쓰는 트리 — 제약 상한 근처의 꽉 찬 이진 트리다. 난수를 쓰지 않는다. */
export const BENCH_V = 100_000;
export const BENCH_EDGES: Edge[] = binary(BENCH_V);
export const BENCH_ROOT = 0;
/** 정점 `i` 의 값은 `(i mod 97) + 1` 이다. */
export const BENCH_VALUES: number[] = Array.from(
  { length: BENCH_V },
  (_, i) => (i % 97) + 1,
);
/** `i` 번째 질의는 `(i mod V, 37i mod V)` 다. */
export function benchQuery(i: number): [number, number] {
  return [i % BENCH_V, (37 * i) % BENCH_V];
}

/** 대조에 쓰는 질의 수 — 뒤집히는 자리를 스윕으로 찾아 고정한 값이다. */
export const BENCH_POINTS = [0, 10_000, 27_610, 27_611, 100_000] as const;

/**
 * 두 설계를 같은 작업 목록에 걸고 계수를 낸다. **매 실행마다 답을 정본과 대조한다** —
 * 답이 다른 구현으로 잰 계수는 저울질이 아니라 다른 문제의 값이다.
 */
export function measure(): {
  hld: Record<number, number>;
  euler: Record<number, number>;
  hldStore: number;
  eulerStore: number;
  hldPre: number;
  eulerPre: number;
} {
  const a = hldCounted(BENCH_V, BENCH_EDGES, BENCH_ROOT, BENCH_VALUES);
  const b = eulerLiftCounted(BENCH_V, BENCH_EDGES, BENCH_ROOT, BENCH_VALUES);
  const ref = new HeavyLightDecomposition(
    BENCH_V,
    BENCH_EDGES,
    BENCH_ROOT,
    BENCH_VALUES.slice(),
  );

  const top = Math.max(...BENCH_POINTS);
  const hld: Record<number, number> = { 0: a.pre };
  const euler: Record<number, number> = { 0: b.pre };
  let ha = a.pre;
  let eb = b.pre;
  for (let i = 0; i < top; i++) {
    const [u, w] = benchQuery(i);
    const ra = a.query(u, w);
    const rb = b.query(u, w);
    const want = ref.queryPath(u, w);
    if (ra.sum !== want || rb.sum !== want) {
      throw new Error(
        `계수 사본의 답이 정본과 다르다 — 질의 ${i} (${u}, ${w}): 정본 ${want} · 분할 ${ra.sum} · 오일러 ${rb.sum}`,
      );
    }
    ha += ra.cells;
    eb += rb.cells;
    const at = i + 1;
    if ((BENCH_POINTS as readonly number[]).includes(at)) {
      hld[at] = ha;
      euler[at] = eb;
    }
  }
  return {
    hld,
    euler,
    hldStore: a.store,
    eulerStore: b.store,
    hldPre: a.pre,
    eulerPre: b.pre,
  };
}

export const cases: Record<string, () => Record<string, number>> = {
  "무거운 경로 분할": () => {
    const m = measure();
    const out: Record<string, number> = { "저장 칸": m.hldStore };
    for (const q of BENCH_POINTS) out[`질의 ${q} 회 · 배열 칸`] = m.hld[q] ?? 0;
    return out;
  },
  "오일러 구간 갱신과 조상 표": () => {
    const m = measure();
    const out: Record<string, number> = { "저장 칸": m.eulerStore };
    for (const q of BENCH_POINTS)
      out[`질의 ${q} 회 · 배열 칸`] = m.euler[q] ?? 0;
    return out;
  },
};

/* ────────────────────── 분기 피복 계수 ────────────────────── */

/** 정본의 원문자 분기 ①~⑥ 이 실제로 몇 번씩 실행되는지 센다. */
export interface BranchCounts {
  /** ① 이미 지나온 정점을 건너뛴다 */
  skip: number;
  /** ② 무거운 자식 자리를 새로 쓴다 */
  record: number;
  /** ③ 사슬 머리와 자리 번호를 붙인다 */
  place: number;
  /** ④ 사슬 머리가 더 깊은 쪽을 골라 구간 하나를 잘라 낸다 — 연산마다 */
  deeper: number[];
  /** ⑤ 남은 한 구간을 더한다 — 연산마다 */
  last: number[];
  /** ⑥ 펜윅 마디를 고친다 */
  fenwick: number;
  /** ⑥ 이 실제로 고친 마디의 번호 */
  fenwickNodes: number[];
}

export function branchCounts(
  v: number,
  edges: Edge[],
  root: number,
  queries: [number, number][],
  updateNode: number,
): BranchCounts {
  const d = decompose(v, edges, root, "size");
  const { near } = ((): { near: number[][] } => {
    const n2: number[][] = Array.from({ length: v }, () => []);
    for (const [a, b] of edges) {
      (n2[a] as number[]).push(b);
      (n2[b] as number[]).push(a);
    }
    return { near: n2 };
  })();

  // ① 이웃 목록이 양방향이라 걸리는 건너뛰기 — 간선마다 반대 방향 한 번씩이다.
  let skip = 0;
  const seen: boolean[] = Array.from({ length: v }, () => false);
  const stack: number[] = [root];
  seen[root] = true;
  while (stack.length > 0) {
    const u = stack.pop() as number;
    for (const w of near[u] as number[]) {
      if (seen[w]) {
        skip += 1;
        continue;
      }
      seen[w] = true;
      stack.push(w);
    }
  }

  // ② 무거운 자식 자리를 새로 쓴 횟수.
  const best: number[] = Array.from({ length: v }, () => 0);
  let record = 0;
  for (const w of d.order) {
    if (w === root) continue;
    const p = d.parent[w] as number;
    if ((d.size[w] as number) > (best[p] as number)) {
      best[p] = d.size[w] as number;
      record += 1;
    }
  }

  // ④⑤ 질의마다의 실행 횟수. 반복 한 바퀴가 ④ 한 번, 마지막 구간이 ⑤ 한 번이다.
  const deeper: number[] = [];
  const last: number[] = [];
  for (const [a, b] of queries) {
    deeper.push(segmentCount(d, a, b) - 1);
    last.push(1);
  }

  // ⑥ 갱신이 고치는 펜윅 마디.
  const fenwickNodes: number[] = [];
  for (let i = (d.pos[updateNode] as number) + 1; i <= v; i += i & -i) {
    fenwickNodes.push(i);
  }

  return {
    skip,
    record,
    place: v,
    deeper,
    last,
    fenwick: fenwickNodes.length,
    fenwickNodes,
  };
}
