/**
 * `purpose.alt` 가 인용하는 수치의 출처 — L13. 세는 사본들이 여기 모여 있고
 * `<name>-guide.proof.ts` 도 이 파일을 가져다 쓴다 — 계수 모델이 두 벌이면 갈라진다.
 *
 * **같은 트리·같은 질의 목록**에 두 설계를 걸고 **결정론적 계수**만 센다. 세는 것은 **배열 칸
 * 접근**(배열의 한 칸을 읽거나 쓰는 것 하나)과 **저장 칸**이다. 벽시계·처리량은 실행마다 달라
 * "본문의 수치가 실측과 일치하는가"(P10)를 정의할 수 없다.
 *
 *   bun run ../../../../tools/bench-alt.ts lowestCommonAncestor-guide.alt.ts
 *
 * **두 사본 다 매 실행마다 정본과 답을 대조한다.** 어긋나면 그 자리에서 던진다 — 계수만 세고
 * 답을 안 보면 「더 적은 일을 하고 틀린 답을 내는 설계」가 이겨 버린다.
 *
 * **전개 입력을 그대로 못 쓰는 이유**(L20). 전개는 정점 아홉 개를 쓰는데, 그 크기에서는 두
 * 설계의 전처리가 상수에 묻혀 뒤집히는 자리가 안 나온다. 그래서 제약 상한인 정점 100,000 개를
 * 그대로 쓴다. **난수를 쓰지 않으므로 시드가 없다** — 아래 생성식이 입력의 전부이고, 그 식을
 * 본문에도 적는다.
 */
import { lowestCommonAncestor } from "./lowestCommonAncestor-guide.ref.ts";

export type Edge = [number, number];
export type Query = [number, number];

/* ────────────────────────── 트리 모양과 질의 ────────────────────────── */

/** 정점 `v` 개를 한 줄로 이은 트리. */
export function chain(v: number): Edge[] {
  const out: Edge[] = [];
  for (let i = 0; i + 1 < v; i++) out.push([i, i + 1]);
  return out;
}

/** 정점 0 이 나머지 전부와 이어진 트리. */
export function star(v: number): Edge[] {
  const out: Edge[] = [];
  for (let i = 1; i < v; i++) out.push([0, i]);
  return out;
}

/** 완전 이진 트리 모양. 정점 `i` 의 부모가 `(i-1) >> 1` 이다. */
export function binary(v: number): Edge[] {
  const out: Edge[] = [];
  for (let i = 1; i < v; i++) out.push([(i - 1) >> 1, i]);
  return out;
}

/** 애벌레 — 절반은 한 줄로 잇고 나머지 절반을 그 줄에 하나씩 매단다. */
export function caterpillar(v: number): Edge[] {
  const spine = Math.floor(v / 2);
  const out: Edge[] = [];
  for (let i = 0; i + 1 < spine; i++) out.push([i, i + 1]);
  for (let i = spine; i < v; i++) out.push([i - spine, i]);
  return out;
}

/** 뿌리에서 두 갈래 사슬이 뻗은 트리. 한쪽 정점은 다른 쪽 정점의 조상이 아니다. */
export function twoChains(v: number): Edge[] {
  const half = Math.floor((v - 1) / 2);
  const out: Edge[] = [];
  for (let i = 1; i <= half; i++) out.push([i === 1 ? 0 : i - 1, i]);
  for (let i = half + 1; i < v; i++) out.push([i === half + 1 ? 0 : i - 1, i]);
  return out;
}

/** 질의 `q` 개. 난수를 쓰지 않고 두 자리를 서로 다른 배수로 정해 골고루 나오게 한다. */
export function queries(v: number, q: number): Query[] {
  const out: Query[] = [];
  for (let i = 0; i < q; i++) out.push([i % v, (i * 37) % v]);
  return out;
}

/** 표의 열 수. 정본과 같은 식이다. */
export const columns = (n: number): number =>
  Math.floor(Math.log2(Math.max(n, 1))) + 1;

/** 뿌리에서 한 번 따라가 깊이와 부모를 정한다. */
export function rootTree(
  n: number,
  edges: Edge[],
  root: number,
): { depth: number[]; parent: number[] } {
  const near: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    (near[u] as number[]).push(v);
    (near[v] as number[]).push(u);
  }
  const depth: number[] = Array.from({ length: n }, () => 0);
  const parent: number[] = Array.from({ length: n }, () => root);
  const seen: boolean[] = Array.from({ length: n }, () => false);
  const stack: number[] = [root];
  seen[root] = true;
  while (stack.length > 0) {
    const u = stack.pop() as number;
    for (const v of near[u] as number[]) {
      if (seen[v]) continue;
      seen[v] = true;
      depth[v] = (depth[u] as number) + 1;
      parent[v] = u;
      stack.push(v);
    }
  }
  return { depth, parent };
}

/** 답이 정본과 같은지 그 자리에서 대조한다. */
function assertSame(
  got: number[],
  n: number,
  edges: Edge[],
  root: number,
  qs: Query[],
  who: string,
): void {
  const want = lowestCommonAncestor(n, edges, root, qs);
  if (got.length !== want.length || got.some((x, i) => x !== want[i])) {
    throw new Error(`${who} 의 답이 정본과 어긋난다`);
  }
}

/* ────────────────────── 이 가이드가 가르치는 절차 ────────────────────── */

/**
 * 정본과 같은 절차에 **배열 칸 접근**과 **정점을 위로 옮긴 횟수**만 덧붙인 사본.
 *
 * 세는 것은 `near`·`depth`·`anc`·`seen`·`stack` 의 한 칸을 읽거나 쓰는 것 하나다.
 */
export function liftCounted(
  n: number,
  edges: Edge[],
  root: number,
  qs: Query[],
): {
  answer: number[];
  setup: number;
  query: number;
  jumps: number;
  cells: number;
} {
  const LOG = columns(n);
  let setup = 0;
  let query = 0;
  let jumps = 0;

  const near: number[][] = Array.from({ length: n }, () => []);
  setup += n;
  for (const [u, v] of edges) {
    (near[u] as number[]).push(v);
    (near[v] as number[]).push(u);
    setup += 2;
  }

  const depth: number[] = Array.from({ length: n }, () => 0);
  setup += n;
  const anc: number[][] = Array.from({ length: n }, () =>
    Array.from({ length: LOG }, () => root),
  );
  setup += n * LOG;
  const seen: boolean[] = Array.from({ length: n }, () => false);
  setup += n;

  const stack: number[] = [root];
  seen[root] = true;
  setup += 2;
  while (stack.length > 0) {
    const u = stack.pop() as number;
    setup += 1;
    for (const v of near[u] as number[]) {
      setup += 2; // 이웃 항목 읽기와 `seen` 읽기
      if (seen[v]) continue;
      seen[v] = true;
      depth[v] = (depth[u] as number) + 1;
      (anc[v] as number[])[0] = u;
      stack.push(v);
      setup += 5; // `seen` 쓰기 · `depth` 읽기와 쓰기 · `anc` 쓰기 · 스택 넣기
    }
  }

  for (let k = 1; k < LOG; k++) {
    for (let v = 0; v < n; v++) {
      const mid = (anc[v] as number[])[k - 1] as number;
      (anc[v] as number[])[k] = (anc[mid] as number[])[k - 1] as number;
      setup += 3; // 읽기 둘과 쓰기 하나
    }
  }

  const answer = qs.map(([a, b]) => {
    let u = a;
    let v = b;
    query += 2;
    if ((depth[u] as number) < (depth[v] as number)) {
      const swap = u;
      u = v;
      v = swap;
    }
    const gap = (depth[u] as number) - (depth[v] as number);
    query += 2;
    for (let k = 0; k < LOG; k++) {
      if (((gap >> k) & 1) === 1) {
        u = (anc[u] as number[])[k] as number;
        query += 1;
        jumps += 1;
      }
    }
    if (u === v) return u;
    for (let k = LOG - 1; k >= 0; k--) {
      const up = (anc[u] as number[])[k] as number;
      const vp = (anc[v] as number[])[k] as number;
      query += 2;
      if (up !== vp) {
        u = up;
        v = vp;
        jumps += 2;
      }
    }
    query += 1;
    jumps += 1;
    return (anc[u] as number[])[0] as number;
  });

  assertSame(answer, n, edges, root, qs, "조상 표");
  return { answer, setup, query, jumps, cells: n * LOG + n };
}

/** 한 칸씩 부모로 오르는 방법. 위로 옮긴 횟수를 함께 센다. */
export function naiveClimb(
  n: number,
  edges: Edge[],
  root: number,
  qs: Query[],
): { answer: number[]; moves: number } {
  const { depth, parent } = rootTree(n, edges, root);
  let moves = 0;
  const answer = qs.map(([a, b]) => {
    let u = a;
    let v = b;
    while (u !== v) {
      if ((depth[u] as number) > (depth[v] as number)) u = parent[u] as number;
      else v = parent[v] as number;
      moves += 1;
    }
    return u;
  });
  assertSame(answer, n, edges, root, qs, "한 칸씩 오르는 방법");
  return { answer, moves };
}

/* ────────────────────── 경쟁 설계 — 오일러 투어와 희소 표 ────────────────────── */

/**
 * 트리를 한 줄로 편 뒤 구간 최솟값으로 답한다.
 *
 * 뿌리에서 따라가며 지나는 정점을 순서대로 적으면 길이 `2V-1` 짜리 줄이 되고, 두 정점이 처음
 * 나온 자리 사이에서 깊이가 가장 작은 정점이 답이다. 그 구간 최솟값을 희소 표로 미리 만들어
 * 두면 질의 하나가 표 두 칸을 읽는 것으로 끝난다 — 질의 비용이 트리 크기와 무관해진다.
 */
export function eulerSparse(
  n: number,
  edges: Edge[],
  root: number,
  qs: Query[],
): { answer: number[]; setup: number; query: number; cells: number } {
  let setup = 0;
  let query = 0;

  const near: number[][] = Array.from({ length: n }, () => []);
  setup += n;
  for (const [u, v] of edges) {
    (near[u] as number[]).push(v);
    (near[v] as number[]).push(u);
    setup += 2;
  }

  const tour: number[] = [];
  const tourDepth: number[] = [];
  const first: number[] = Array.from({ length: n }, () => -1);
  setup += n;
  const depth: number[] = Array.from({ length: n }, () => 0);
  setup += n;
  const parent: number[] = Array.from({ length: n }, () => root);
  setup += n;
  const at: number[] = Array.from({ length: n }, () => 0);
  setup += n;

  let cur = root;
  setup += 2;
  for (;;) {
    if (first[cur] === -1) {
      first[cur] = tour.length;
      setup += 1;
    }
    tour.push(cur);
    tourDepth.push(depth[cur] as number);
    setup += 3;
    const list = near[cur] as number[];
    let moved = false;
    while ((at[cur] as number) < list.length) {
      const next = list[at[cur] as number] as number;
      at[cur] = (at[cur] as number) + 1;
      setup += 3;
      if (first[next] !== -1) continue;
      parent[next] = cur;
      depth[next] = (depth[cur] as number) + 1;
      setup += 3;
      cur = next;
      moved = true;
      break;
    }
    if (moved) continue;
    if (cur === root) break;
    cur = parent[cur] as number;
    setup += 1;
  }

  const m = tour.length;
  const K = Math.floor(Math.log2(Math.max(m, 1))) + 1;
  const sparse: number[][] = Array.from({ length: K }, () =>
    Array.from({ length: m }, () => 0),
  );
  setup += K * m;
  for (let i = 0; i < m; i++) {
    (sparse[0] as number[])[i] = i;
    setup += 1;
  }
  for (let k = 1; k < K; k++) {
    const half = 1 << (k - 1);
    for (let i = 0; i + (1 << k) <= m; i++) {
      const a = (sparse[k - 1] as number[])[i] as number;
      const b = (sparse[k - 1] as number[])[i + half] as number;
      (sparse[k] as number[])[i] =
        (tourDepth[a] as number) <= (tourDepth[b] as number) ? a : b;
      setup += 5; // 표 읽기 둘 · 깊이 읽기 둘 · 표 쓰기 하나
    }
  }

  const answer = qs.map(([a, b]) => {
    let l = first[a] as number;
    let r = first[b] as number;
    query += 2;
    if (l > r) {
      const swap = l;
      l = r;
      r = swap;
    }
    const k = Math.floor(Math.log2(r - l + 1));
    const x = (sparse[k] as number[])[l] as number;
    const y = (sparse[k] as number[])[r - (1 << k) + 1] as number;
    query += 4; // 표 읽기 둘과 깊이 읽기 둘
    const best = (tourDepth[x] as number) <= (tourDepth[y] as number) ? x : y;
    query += 1;
    return tour[best] as number;
  });

  assertSame(answer, n, edges, root, qs, "희소 표");
  return { answer, setup, query, cells: K * m + m + m + n + n };
}

/* ────────────────────────── 작업 목록 ────────────────────────── */

/** 대조가 쓰는 트리 — 제약 상한인 정점 100,000 개짜리 완전 이진 트리다. */
export const BENCH_N = 100_000;
export const BENCH_EDGES: Edge[] = binary(BENCH_N);

/** 뒤집히는 자리를 사이에 두고 고른 질의 수 셋. */
export const BENCH_QUERY_COUNTS = [0, 100_000, 430_000] as const;

export const cases = {
  "2^k 조상 표": () => {
    const out: Record<string, number> = {};
    for (const q of BENCH_QUERY_COUNTS) {
      const got = liftCounted(BENCH_N, BENCH_EDGES, 0, queries(BENCH_N, q));
      out[`질의 ${q.toLocaleString("en-US")} 회 · 배열 칸`] =
        got.setup + got.query;
      if (q === 0) out["저장 칸"] = got.cells;
    }
    return out;
  },
  "오일러 투어와 희소 표": () => {
    const out: Record<string, number> = {};
    for (const q of BENCH_QUERY_COUNTS) {
      const got = eulerSparse(BENCH_N, BENCH_EDGES, 0, queries(BENCH_N, q));
      out[`질의 ${q.toLocaleString("en-US")} 회 · 배열 칸`] =
        got.setup + got.query;
      if (q === 0) out["저장 칸"] = got.cells;
    }
    return out;
  },
};
