/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run tools/check-proof.ts src/algorithms/shortest-path/bellmanFord/bellmanFord-guide.md
 *
 * **기록을 남기는 사본이 둘 있다.** 정본은 몇 번 셌는지와 라운드마다 무엇을 고쳤는지를 내보내지
 * 않으므로, 그 자리만 덧붙인 사본이 아니면 계수와 걸음을 낼 방법이 없다.
 *
 * - `record` — 간선 하나를 읽을 때마다 무엇을 했는지 남긴다. 작은 입력(전개 입력 · 음수 사이클
 *   입력)에만 쓴다.
 * - `counted` — 라운드 수와 간선 읽기 · 넘김 · 고침만 센다. 정점 64 개 완전 그래프처럼 간선이 많은
 *   입력에는 이쪽을 쓴다 — 간선마다 기록을 베끼면 메모리가 모자라 출력 없이 죽는다.
 *
 * **답이 맞는지는 사본이 아니라 정본이 진다** — 두 사본의 답은 이 파일을 읽을 때 정본과
 * 맞댄다(`자기대조()`). 표의 「답」 칸은 정본이나 정본에서 기계로 만든 변이가 낸 값이다.
 *
 * **비용을 세는 기준은 하나다** — 간선 하나를 목록에서 읽은 한 번(`간선 읽기`). ③ 으로 넘긴
 * 간선도 센다. 경쟁 설계와 나란히 잴 때만 큐에 넣고 꺼낸 횟수를 더한다(`.alt.ts` 의 기본 연산).
 */

import { loadMutant } from "../../../../tools/check-proof.ts";
import { 으로, 은는, 을를, 이가 } from "../../../../tools/josa.ts";
import {
  cases as altCases,
  crossing,
  hub,
  라운드로읽는설계,
  큐에담는설계,
} from "./bellmanFord-guide.alt.ts";
import { bellmanFord, type Edge } from "./bellmanFord-guide.ref.ts";

const INF = Number.POSITIVE_INFINITY;

/* ────────────────────────── 고정 입력 ────────────────────────── */

/**
 * 본문 전개가 쓰는 그래프. 정점 일곱 · 방향 간선 여덟이고 정점 6 은 들어오는 간선이 없다.
 *
 * 여섯 갈래 중 다섯을 한 입력에서 실행한다 — 시작값 · 라운드 · 값이 없는 정점 건너뛰기 ·
 * 완화 · 조기 종료. 남은 하나(음수 사이클)는 `NEG_EDGES` 가 맡는다.
 */
export const WALK_N = 7;
export const WALK_EDGES: Edge[] = [
  [4, 5, 1],
  [3, 4, 2],
  [2, 3, -3],
  [1, 2, 3],
  [0, 1, 4],
  [0, 2, 9],
  [6, 5, 2],
  [5, 1, 7],
];
export const WALK_SRC = 0;

/** 출발점에서 도달할 수 있는 음수 사이클. `0 → 1 → 2 → 0` 의 가중치 합이 −1 이다. */
export const NEG_N = 3;
export const NEG_EDGES: Edge[] = [
  [0, 1, 1],
  [1, 2, -1],
  [2, 0, -1],
];

/** 출발점에서 도달할 수 없는 음수 사이클. `1 ↔ 2` 는 정점 0 에서 갈 수 없다. */
export const FAR_N = 3;
export const FAR_EDGES: Edge[] = [
  [1, 2, 1],
  [2, 1, -5],
];

/**
 * `dijkstra` 가이드의 「이 방법이 기대는 전제」가 쓴 두 입력 — 가중치에 음수가 하나 들어간다.
 * 같은 입력을 여기서 다시 써서 두 가이드가 같은 반례를 가리키게 한다.
 */
export const DIJKSTRA_NEGATIVE: { label: string; n: number; edges: Edge[] }[] =
  [
    {
      label: "0->1(0) 0->2(1) 2->1(-5) 1->3(0)",
      n: 4,
      edges: [
        [0, 1, 0],
        [0, 2, 1],
        [2, 1, -5],
        [1, 3, 0],
      ],
    },
    {
      label: "0->1(2) 0->2(3) 2->1(-2) 1->3(1)",
      n: 4,
      edges: [
        [0, 1, 2],
        [0, 2, 3],
        [2, 1, -2],
        [1, 3, 1],
      ],
    },
  ];

/** 완전 방향 그래프. 가중치는 생성식으로 고정한다. */
export function complete(v: number): Edge[] {
  const edges: Edge[] = [];
  for (let u = 0; u < v; u++) {
    for (let x = 0; x < v; x++) {
      if (u !== x) edges.push([u, x, ((u * 7 + x * 13) % 20) + 1]);
    }
  }
  return edges;
}

/** 사슬 `0 → 1 → … → v−1`. 가중치는 전부 1 이고 간선 목록의 순서만 고른다. */
export function chain(v: number, descending: boolean): Edge[] {
  const edges: Edge[] = [];
  for (let i = 0; i + 1 < v; i++) edges.push([i, i + 1, 1]);
  return descending ? edges.reverse() : edges;
}

/**
 * 내림차순 사슬에 나머지 간선을 전부 채운 그래프. 채운 간선의 가중치가 `10^9` 이라 값을
 * 한 번도 못 고치고, 그래서 라운드 수는 사슬이 정하고 간선 수는 최댓값이 된다.
 */
export function chainPlusFiller(v: number): Edge[] {
  const edges: Edge[] = chain(v, true);
  for (let u = 0; u < v; u++) {
    for (let x = 0; x < v; x++) {
      if (u === x || x === u + 1) continue;
      edges.push([u, x, 1_000_000_000]);
    }
  }
  return edges;
}

/* ────────────────────────── 표기 ────────────────────────── */

/** `[0, 4, 7, 4, 6, 7, Infinity]` 꼴 — 본문 표기와 같다. */
export const show = (xs: readonly number[]): string => `[${xs.join(", ")}]`;

/** `124,750,000` 꼴 — 본문 표기와 같다. */
export const comma = (n: number): string => n.toLocaleString("en-US");

/** 거리 하나 — 무한대는 `Infinity` 로 적는다. */
export const num = (d: number): string => (d === INF ? "Infinity" : comma(d));

/** 간선 하나 — `2→3`. */
export const arrow = ([u, v]: readonly [number, number, number]): string =>
  `${u}→${v}`;

/** 더하는 가중치 — 음수면 괄호로 싼다(`9 + (-3)`). */
export const plusW = (w: number): string => (w < 0 ? `(${w})` : String(w));

/** 마크다운 표. `right` 는 오른쪽 정렬할 열. */
function md(
  head: string[],
  rows: string[][],
  right: readonly number[] = [],
): string {
  const rule = head.map((_, c) => (right.includes(c) ? "---:" : "---"));
  const line = (cells: string[]) => `| ${cells.join(" | ")} |`;
  return [line(head), line(rule), ...rows.map(line)].join("\n");
}

/** 한글은 고정폭 화면에서 두 칸을 먹는다. 칸 맞춤을 글자 수로 하면 머리줄만 어긋난다. */
const width = (s: string): number =>
  [...s].reduce((n, c) => n + (/[ᄀ-ᇿ　-〿㄰-㆏가-힯一-鿿]/.test(c) ? 2 : 1), 0);

const pad = (s: string, to: number): string =>
  s + " ".repeat(Math.max(0, to - width(s)));

/** 등폭 블록 — 칸마다 폭을 값에서 재서 맞춘다. 첫 행이 머리줄이다. */
function table(rows: string[][], indent = ""): string[] {
  const cols = Math.max(...rows.map((r) => r.length));
  const widths: number[] = [];
  for (let c = 0; c < cols; c++) {
    widths.push(Math.max(...rows.map((r) => width(r[c] ?? ""))));
  }
  return rows.map((r) =>
    `${indent}${r.map((cell, c) => pad(cell, widths[c] ?? 0)).join("  ")}`.trimEnd(),
  );
}

const sameArr = (a: readonly number[], b: readonly number[]): boolean =>
  a.length === b.length && a.every((x, i) => x === b[i]);

/* ────────────────────── 기록을 남기는 사본 ────────────────────── */

/** 라운드 안에서 간선 하나를 읽은 기록. */
export interface EdgeRead {
  readonly at: number;
  readonly u: number;
  readonly v: number;
  readonly w: number;
  /** ③ 이 참이라 넘어갔는가. */
  readonly skipped: boolean;
  /** `dist[u] + w`. 넘어갔으면 `null`. */
  readonly cand: number | null;
  /** 그 간선을 읽을 때의 `dist[u]`. */
  readonly du: number;
  /** 그 간선을 읽을 때의 `dist[v]`. */
  readonly before: number;
  /** ④ 가 참이라 값을 고쳤는가. */
  readonly improved: boolean;
}

export interface Round {
  /** 라운드 번호 — 1 부터. */
  readonly k: number;
  readonly reads: readonly EdgeRead[];
  /** 라운드가 끝난 뒤의 `dist`. */
  readonly dist: readonly number[];
  /** 라운드가 끝난 뒤, 정점마다 그 값을 마지막으로 적은 간선의 번호. 없으면 −1. */
  readonly pred: readonly number[];
  readonly changed: boolean;
}

export interface Rec {
  readonly n: number;
  readonly edges: readonly Edge[];
  readonly start: readonly number[];
  readonly rounds: readonly Round[];
  readonly dist: readonly number[];
  readonly hasNegativeCycle: boolean;
}

/** 정본과 같은 절차에 간선마다 기록만 덧붙인 사본. 작은 입력에만 쓴다. */
export function record(n: number, edges: Edge[], src: number): Rec {
  const dist = Array.from({ length: n }, () => INF);
  dist[src] = 0;
  const pred = Array.from({ length: n }, () => -1);
  const start = dist.slice();
  const rounds: Round[] = [];
  const done = (neg: boolean): Rec => ({
    n,
    edges,
    start,
    rounds,
    dist: dist.slice(),
    hasNegativeCycle: neg,
  });
  for (let round = 1; round <= n; round++) {
    let changed = false;
    const reads: EdgeRead[] = [];
    edges.forEach(([u, v, w], at) => {
      const du = dist[u] as number;
      const before = dist[v] as number;
      if (du === INF) {
        reads.push({
          at,
          u,
          v,
          w,
          skipped: true,
          cand: null,
          du,
          before,
          improved: false,
        });
        return;
      }
      const nd = du + w;
      const improved = nd < before;
      if (improved) {
        dist[v] = nd;
        pred[v] = at;
        changed = true;
      }
      reads.push({
        at,
        u,
        v,
        w,
        skipped: false,
        cand: nd,
        du,
        before,
        improved,
      });
    });
    rounds.push({
      k: round,
      reads,
      dist: dist.slice(),
      pred: pred.slice(),
      changed,
    });
    if (!changed) return done(false);
    if (round === n) return done(true);
  }
  return done(false);
}

export interface Counts {
  dist: number[];
  hasNegativeCycle: boolean;
  /** 실제로 실행한 라운드 수. */
  rounds: number;
  /** 간선 하나를 목록에서 읽은 총 횟수. */
  reads: number;
  /** ③ 이 참이 되어 그 자리에서 넘어간 횟수. */
  skips: number;
  /** ④ 가 참이 되어 값을 고친 횟수. */
  writes: number;
}

/** 정본과 같은 절차에 세는 자리만 덧붙인 가벼운 사본. 간선이 많은 입력에 쓴다. */
export function counted(n: number, edges: Edge[], src: number): Counts {
  const dist = Array.from({ length: n }, () => INF);
  dist[src] = 0;
  let rounds = 0;
  let reads = 0;
  let skips = 0;
  let writes = 0;
  const done = (neg: boolean): Counts => ({
    dist,
    hasNegativeCycle: neg,
    rounds,
    reads,
    skips,
    writes,
  });
  for (let round = 1; round <= n; round++) {
    rounds++;
    let changed = false;
    for (const [u, v, w] of edges) {
      reads++;
      if (dist[u] === INF) {
        skips++;
        continue;
      }
      const nd = (dist[u] as number) + w;
      if (nd < (dist[v] as number)) {
        dist[v] = nd;
        writes++;
        changed = true;
      }
    }
    if (!changed) return done(false);
    if (round === n) return done(true);
  }
  return done(false);
}

/** 두 사본이 정본과 같은 답을 내는지 이 파일을 읽을 때 한 번 확인한다. */
function 자기대조(): void {
  const inputs: [number, Edge[]][] = [
    [WALK_N, WALK_EDGES],
    [NEG_N, NEG_EDGES],
    [FAR_N, FAR_EDGES],
    [12, complete(12)],
    [64, chain(64, true)],
  ];
  for (const [n, edges] of inputs) {
    const ref = bellmanFord(n, edges, 0);
    const a = counted(n, edges, 0);
    if (
      ref.hasNegativeCycle !== a.hasNegativeCycle ||
      show(ref.dist) !== show(a.dist)
    ) {
      throw new Error("세는 사본이 정본과 다른 답을 낸다");
    }
    if (n <= 12) {
      const b = record(n, edges, 0);
      if (
        ref.hasNegativeCycle !== b.hasNegativeCycle ||
        show(ref.dist) !== show(b.dist)
      ) {
        throw new Error("기록 사본이 정본과 다른 답을 낸다");
      }
    }
  }
}
자기대조();

/** 전개 입력의 기록 — 그림 사이드카와 본문 블록이 같은 기록을 쓴다. */
export const WALK = record(WALK_N, WALK_EDGES, WALK_SRC);

/** 라운드 수를 `cap` 으로 잘라서 실행한다. 조기 종료도 음수 사이클 판정도 하지 않는다. */
export function capped(
  n: number,
  edges: Edge[],
  src: number,
  cap: number,
): number[] {
  const dist = Array.from({ length: n }, () => INF);
  dist[src] = 0;
  for (let round = 1; round <= cap; round++) {
    for (const [u, v, w] of edges) {
      if (dist[u] === INF) continue;
      const nd = (dist[u] as number) + w;
      if (nd < (dist[v] as number)) dist[v] = nd;
    }
  }
  return dist;
}

/**
 * 간선을 `k` 개 이하로 쓰는 경로의 최소 비용 `opt_k`. 이 절차와 **다른 방법**으로 낸다 — 라운드를
 * 쓰지 않고, 간선 수 `t` 인 층에서 `t+1` 인 층을 만드는 계산이다.
 */
export function optAtMost(
  n: number,
  edges: Edge[],
  src: number,
  k: number,
): number[] {
  let cur = Array.from({ length: n }, () => INF);
  cur[src] = 0;
  for (let t = 1; t <= k; t++) {
    const next = cur.slice();
    for (const [u, v, w] of edges) {
      if (cur[u] === INF) continue;
      const nd = (cur[u] as number) + w;
      if (nd < (next[v] as number)) next[v] = nd;
    }
    cur = next;
  }
  return cur;
}

export interface SimplePath {
  readonly nodes: readonly number[];
  readonly cost: number;
}

/** 출발점에서 나가는 단순 경로를 전부 만든다(길이 0 인 경로는 빼고). */
export function simplePaths(
  n: number,
  edges: Edge[],
  src: number,
): SimplePath[] {
  const adj: [number, number][][] = Array.from({ length: n }, () => []);
  for (const [u, v, w] of edges) (adj[u] as [number, number][]).push([v, w]);
  const onPath = Array.from({ length: n }, () => false);
  const out: SimplePath[] = [];
  const walk = (u: number, path: number[], cost: number): void => {
    onPath[u] = true;
    for (const [v, w] of adj[u] as [number, number][]) {
      if (onPath[v]) continue;
      const next = [...path, v];
      out.push({ nodes: next, cost: cost + w });
      walk(v, next, cost + w);
    }
    onPath[u] = false;
  };
  walk(src, [src], 0);
  return out;
}

/** 단순 경로의 개수만 센다 — 경로를 배열로 안 모은다. */
export function countSimplePaths(
  n: number,
  edges: Edge[],
  src: number,
): number {
  const adj: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) (adj[u] as number[]).push(v);
  const onPath = Array.from({ length: n }, () => false);
  let paths = 0;
  const walk = (u: number): void => {
    onPath[u] = true;
    for (const v of adj[u] as number[]) {
      if (onPath[v]) continue;
      paths++;
      walk(v);
    }
    onPath[u] = false;
  };
  walk(src);
  return paths;
}

/** 단순 경로를 전부 만들어 간선 수 `k` 이하인 것 중 정점마다 가장 작은 비용을 고른다. */
export function bestByEnumeration(
  n: number,
  edges: Edge[],
  src: number,
  k: number = n,
): number[] {
  const best = Array.from({ length: n }, () => INF);
  best[src] = 0;
  for (const p of simplePaths(n, edges, src)) {
    if (p.nodes.length - 1 > k) continue;
    const v = p.nodes.at(-1) as number;
    if (p.cost < (best[v] as number)) best[v] = p.cost;
  }
  return best;
}

/**
 * 거리가 가장 작은 정점부터 **확정하고 다시 보지 않는** 사본 — `dijkstra` 가이드의 확정 규칙을
 * 음수 가중치에 그대로 건 것이다. 꺼낸 차례와 그때의 값을 함께 남긴다.
 */
export function settleOnce(
  n: number,
  edges: Edge[],
  src: number,
): { dist: number[]; settled: [number, number][] } {
  const adj: [number, number][][] = Array.from({ length: n }, () => []);
  for (const [u, v, w] of edges) (adj[u] as [number, number][]).push([v, w]);
  const dist = Array.from({ length: n }, () => INF);
  dist[src] = 0;
  const seen = Array.from({ length: n }, () => false);
  const bag: [number, number][] = [[src, 0]];
  const settled: [number, number][] = [];
  while (bag.length > 0) {
    let at = 0;
    for (let i = 1; i < bag.length; i++) {
      if ((bag[i] as [number, number])[1] < (bag[at] as [number, number])[1])
        at = i;
    }
    const [u, d] = bag.splice(at, 1)[0] as [number, number];
    if (seen[u] === true) continue;
    seen[u] = true;
    settled.push([u, d]);
    for (const [v, w] of adj[u] as [number, number][]) {
      const nd = d + w;
      if (nd < (dist[v] as number)) {
        dist[v] = nd;
        bag.push([v, nd]);
      }
    }
  }
  return { dist, settled };
}

/** 라운드 상한 없이 「고칠 것이 없을 때까지」 되풀이하는 사본. `limit` 라운드에서 끊는다. */
export function untilStable(
  n: number,
  edges: Edge[],
  src: number,
  limit: number,
): { k: number; writes: number; dist: number[] }[] {
  const dist = Array.from({ length: n }, () => INF);
  dist[src] = 0;
  const out: { k: number; writes: number; dist: number[] }[] = [];
  for (let k = 1; k <= limit; k++) {
    let writes = 0;
    for (const [u, v, w] of edges) {
      if (dist[u] === INF) continue;
      const nd = (dist[u] as number) + w;
      if (nd < (dist[v] as number)) {
        dist[v] = nd;
        writes++;
      }
    }
    out.push({ k, writes, dist: dist.slice() });
    if (writes === 0) break;
  }
  return out;
}

/** 「아직 값이 없다」를 `Infinity` 대신 큰 수로 적고 건너뛰기도 뺀 사본. 라운드마다 `dist` 를 남긴다. */
export function sentinelNoGuard(
  n: number,
  edges: Edge[],
  src: number,
  sentinel: number,
): { dist: number[]; hasNegativeCycle: boolean; frames: number[][] } {
  const dist = Array.from({ length: n }, () => sentinel);
  dist[src] = 0;
  const frames: number[][] = [];
  for (let round = 1; round <= n; round++) {
    let changed = false;
    for (const [u, v, w] of edges) {
      const nd = (dist[u] as number) + w;
      if (nd < (dist[v] as number)) {
        dist[v] = nd;
        changed = true;
      }
    }
    frames.push(dist.slice());
    if (!changed) return { dist, hasNegativeCycle: false, frames };
    if (round === n) return { dist, hasNegativeCycle: true, frames };
  }
  return { dist, hasNegativeCycle: false, frames };
}

/* ────────────────────── 간선 순서 전수 ────────────────────── */

function permutations<T>(xs: T[]): T[][] {
  if (xs.length <= 1) return [xs];
  const out: T[][] = [];
  for (let i = 0; i < xs.length; i++) {
    const rest = [...xs.slice(0, i), ...xs.slice(i + 1)];
    for (const p of permutations(rest)) out.push([xs[i] as T, ...p]);
  }
  return out;
}

interface OrderSweep {
  total: number;
  /** 라운드 수 → 그 라운드 수가 나온 순서의 개수. */
  rounds: Map<number, number>;
  /** 답이 정본과 다른 순서의 개수. */
  wrong: number;
  /** 라운드 상한 `k` → `k` 라운드로 정답에 이른 순서의 개수. */
  correctAt: Map<number, number>;
}

let SWEEP: OrderSweep | null = null;

export function orderSweep(): OrderSweep {
  if (SWEEP !== null) return SWEEP;
  const answer = show(bellmanFord(WALK_N, WALK_EDGES, WALK_SRC).dist);
  const rounds = new Map<number, number>();
  const correctAt = new Map<number, number>();
  let wrong = 0;
  const orders = permutations(WALK_EDGES);
  for (const order of orders) {
    const c = counted(WALK_N, order, WALK_SRC);
    if (show(c.dist) !== answer) wrong++;
    rounds.set(c.rounds, (rounds.get(c.rounds) ?? 0) + 1);
    for (let k = 0; k <= WALK_N - 1; k++) {
      if (show(capped(WALK_N, order, WALK_SRC, k)) === answer) {
        correctAt.set(k, (correctAt.get(k) ?? 0) + 1);
      }
    }
  }
  SWEEP = { total: orders.length, rounds, wrong, correctAt };
  return SWEEP;
}

/* ────────────────────────── 변이 ────────────────────────── */

const REF = new URL("./bellmanFord-guide.ref.ts", import.meta.url).pathname;

interface Impl {
  bellmanFord(
    n: number,
    edges: Edge[],
    src: number,
  ): { dist: number[]; hasNegativeCycle: boolean };
}

/** ③ 을 통째로 뺀 사본. 답이 갈리는지를 실행이 판정한다. */
const noGuard = await loadMutant<Impl>(REF, {
  drop: /if \(dist\[u\] === Number\.POSITIVE_INFINITY\) continue;/,
});

/** 라운드를 `n−1` 번만 실행하는 사본. */
const shortLoop = await loadMutant<Impl>(REF, {
  swap: [/round <= n; round\+\+/, "round < n; round++"],
});

/** 조기 종료를 못 하게 막은 사본. */
const noEarlyExit = await loadMutant<Impl>(REF, {
  swap: [/if \(!changed\) return/, "if (false) return"],
});

/** **불변식을 지키던 줄** 하나에서 부등호 방향만 뒤집은 사본. */
const wrongDirection = await loadMutant<Impl>(REF, {
  swap: [
    /if \(nd < \(dist\[v\] as number\)\)/,
    "if (nd > (dist[v] as number))",
  ],
});

/** 중화 실행인가 — 변이 모듈의 함수가 정본과 같은 객체면 변이를 적용하지 않은 것이다. */
const 중화됨 = shortLoop.bellmanFord === bellmanFord;

const MUTANT_CASES: { label: string; n: number; edges: Edge[] }[] = [
  { label: "전개 입력", n: WALK_N, edges: WALK_EDGES },
  { label: "음수 사이클 0->1->2->0", n: NEG_N, edges: NEG_EDGES },
  { label: "도달할 수 없는 음수 사이클", n: FAR_N, edges: FAR_EDGES },
];

const answer = (r: { dist: number[]; hasNegativeCycle: boolean }): string =>
  `${show(r.dist)} · ${r.hasNegativeCycle}`;

if (!중화됨) {
  // 하나도 안 갈리면 그 절의 주장이 성립하지 않는다. 실행이 그것을 판정한다.
  for (const [label, impl] of [
    ["라운드를 n−1 번만", shortLoop],
    ["조기 종료를 막은 판", noEarlyExit],
    ["부등호를 뒤집은 판", wrongDirection],
  ] as [string, Impl][]) {
    if (
      MUTANT_CASES.every(
        (c) =>
          answer(bellmanFord(c.n, c.edges, 0)) ===
          answer(impl.bellmanFord(c.n, c.edges, 0)),
      )
    ) {
      throw new Error(`${label} 변이가 어느 입력에서도 답을 바꾸지 못했다`);
    }
  }
}

/* ────────────────────────── 수치 ────────────────────────── */

/** `m!` 의 자릿수. 경로 수가 배열에 안 들어가는 규모에서는 자릿수만 낸다. */
function factorialDigits(m: number): number {
  let log10 = 0;
  for (let k = 2; k <= m; k++) log10 += Math.log10(k);
  return Math.floor(log10) + 1;
}

export const V_LIMIT = 500;
export const E_LIMIT = V_LIMIT * (V_LIMIT - 1);
export const W_LIMIT = 1_000_000_000;

const LABELS: [string, string][] = [
  ["①", "시작값"],
  ["②", "라운드를 시작한다"],
  ["③", "값이 없는 정점이라 넘어간다"],
  ["④", "완화가 값을 고친다"],
  ["⑤", "조기 종료"],
  ["⑥", "음수 사이클"],
];

function branchCounts(n: number, edges: Edge[], src: number): number[] {
  const c = counted(n, edges, src);
  return [
    1,
    c.rounds,
    c.skips,
    c.writes,
    c.hasNegativeCycle ? 0 : 1,
    c.hasNegativeCycle ? 1 : 0,
  ];
}

/** 라운드 `k` 에 값을 적은 정점 — 적은 차례대로, 같은 정점은 한 번. */
function writtenIn(r: Round): number[] {
  const out: number[] = [];
  for (const e of r.reads) if (e.improved && !out.includes(e.v)) out.push(e.v);
  return out;
}

/** 첫 라운드가 값을 적은 정점 수. */
function firstRoundWrites(edges: Edge[]): number[] {
  const r = record(WALK_N, edges, WALK_SRC).rounds[0] as Round;
  return writtenIn(r);
}

/** 한 라운드의 간선 하나를 한 줄로 — 무엇을 했는가. */
function readText(e: EdgeRead): string {
  if (e.skipped)
    return `dist[${e.u}]${이가(String(e.u))} Infinity — ③ 넘어간다`;
  const calc = `${num(e.du)} + ${plusW(e.w)} = ${num(e.cand as number)}`;
  return e.improved
    ? `${calc} < ${num(e.before)} — ④ dist[${e.v}] = ${num(e.cand as number)}`
    : `${calc} ≥ ${num(e.before)} — 그대로`;
}

/** 최종 거리를 낸 간선을 거슬러 올라가 경로를 만든다. */
export function pathTo(rec: Rec, v: number): number[] {
  const last = rec.rounds.at(-1) as Round;
  const out = [v];
  let at = v;
  for (let guard = 0; guard < rec.n; guard++) {
    const e = last.pred[at] as number;
    if (e < 0) break;
    at = (rec.edges[e] as Edge)[0];
    out.unshift(at);
  }
  return out;
}

/* ────────────────────────── 블록 ────────────────────────── */

/** concept — 정점 2 와 3 으로 가는 단순 경로 전부. */
function conceptPaths(): string {
  const paths = simplePaths(WALK_N, WALK_EDGES, WALK_SRC);
  const ref = bellmanFord(WALK_N, WALK_EDGES, WALK_SRC);
  const rows: string[][] = [];
  for (const to of [2, 3]) {
    const mine = paths
      .filter((p) => p.nodes.at(-1) === to)
      .sort((a, b) => a.nodes.length - b.nodes.length);
    const best = Math.min(...mine.map((p) => p.cost));
    for (const p of mine) {
      rows.push([
        String(to),
        p.nodes.join("→"),
        String(p.nodes.length - 1),
        String(p.cost),
        p.cost === best ? "가장 작다" : "",
      ]);
    }
  }
  const direct = paths.find((p) => p.nodes.length === 2 && p.nodes[1] === 2);
  return [
    md(["도착 정점", "경로", "간선 수", "비용", "최소"], rows, [2, 3]),
    "",
    `정점 2 로 곧장 가는 간선의 비용은 ${direct?.cost} 이고, 정본이 낸 거리는 dist[2] = ${ref.dist[2]} · dist[3] = ${ref.dist[3]} 입니다.`,
  ].join("\n");
}

/** concept — 음수 사이클 하나의 가중치 합. */
function conceptCycle(): string {
  const sum = NEG_EDGES.reduce((a, [, , w]) => a + w, 0);
  const rows = untilStable(NEG_N, NEG_EDGES, 0, 3).map((r) => [
    `${r.k} 번`,
    show(r.dist),
  ]);
  return [
    md(["간선 목록을 읽은 횟수", "dist"], rows),
    "",
    `순환 ${NEG_EDGES.map(([u]) => u).join("→")}→${NEG_EDGES[0]?.[0]} 의 가중치 합은 ${NEG_EDGES.map(([, , w]) => plusW(w)).join(" + ")} = ${sum} 이고, 목록을 한 번 읽을 때마다 세 정점의 값이 모두 ${-sum} 씩 줄었습니다.`,
  ].join("\n");
}

/** deep.origin ② — 경로를 전부 만드는 방법이 규모에서 몇 번이 되는가. */
function naiveScale(): string {
  const rows = [4, 6, 8, 10].map((v) => {
    const edges = complete(v);
    return [
      String(v),
      comma(edges.length),
      comma(countSimplePaths(v, edges, 0)),
      "실행",
    ];
  });
  rows.push([
    comma(V_LIMIT),
    comma(E_LIMIT),
    `${V_LIMIT - 1}! 이상 — ${comma(factorialDigits(V_LIMIT - 1))} 자리 수`,
    "식",
  ]);
  const ten = countSimplePaths(10, complete(10), 0);
  return [
    md(["정점 V", "간선 E", "단순 경로 수", "센 방법"], rows, [0, 1]),
    "",
    `정점 10 개 완전 그래프에서 단순 경로가 ${comma(ten)} 개입니다. 정점이 V 개인 완전 그래프는 출발점을 뺀 V−1 개를 모두 지나는 경로만 해도 (V−1)! 개라, 마지막 줄은 V = ${V_LIMIT} 을 그 식에 넣은 값입니다.`,
  ].join("\n");
}

/** deep.origin ③ — 확정 규칙을 음수 가중치에 건 답과 경로를 전부 만든 답. */
function originSettle(): string {
  const inputs = [
    ...DIJKSTRA_NEGATIVE,
    { label: "전개 입력", n: WALK_N, edges: WALK_EDGES },
  ];
  let wrong = 0;
  const rows = inputs.map((c) => {
    const got = settleOnce(c.n, c.edges, 0).dist;
    const want = bestByEnumeration(c.n, c.edges, 0);
    const bad = got.flatMap((d, v) => (d === want[v] ? [] : [v]));
    if (bad.length > 0) wrong++;
    return [
      c.label,
      show(got),
      show(want),
      bad.length === 0 ? "없음" : bad.join(" · "),
    ];
  });
  return [
    md(
      [
        "입력",
        "확정한 정점을 다시 보지 않는 답",
        "경로를 전부 만든 답",
        "어긋난 정점",
      ],
      rows,
    ),
    "",
    `입력 ${inputs.length} 개 가운데 ${wrong} 개에서 답이 어긋났습니다.`,
  ].join("\n");
}

/** deep.origin ③ — 둘째 입력에서 확정한 차례와 그때의 값. */
function originSettleWhere(): string {
  const c = DIJKSTRA_NEGATIVE[1] as { label: string; n: number; edges: Edge[] };
  const s = settleOnce(c.n, c.edges, 0);
  const want = bestByEnumeration(c.n, c.edges, 0);
  const rows = s.settled.map(([v, d], i) => [
    String(i + 1),
    String(v),
    String(d),
    String(want[v]),
  ]);
  const late = s.settled.filter(([v, d]) => d !== want[v]).map(([v]) => v);
  return [
    md(
      ["확정한 차례", "정점", "확정한 값", "경로를 전부 만든 값"],
      rows,
      [0, 2, 3],
    ),
    "",
    `확정한 값이 경로를 전부 만든 값과 다른 정점은 ${late.join(" · ")} 입니다.`,
  ].join("\n");
}

/** deep.origin ③ — 같은 그래프, 간선 목록의 순서만 바꿔 계수를 나란히 잰다. */
function orderRounds(): string {
  const flippedEdges = [...WALK_EDGES].reverse();
  const given = counted(WALK_N, WALK_EDGES, WALK_SRC);
  const flipped = counted(WALK_N, flippedEdges, WALK_SRC);
  const row = (label: string, c: Counts, edges: Edge[]) => [
    label,
    String(c.rounds),
    comma(c.reads),
    firstRoundWrites(edges).join(" · "),
    show(c.dist),
  ];
  return [
    md(
      [
        "간선 목록의 순서",
        "라운드",
        "간선 읽기",
        "첫 라운드가 값을 적은 정점",
        "결과 dist",
      ],
      [
        row("적힌 순서", given, WALK_EDGES),
        row("그 순서를 뒤집은 것", flipped, flippedEdges),
      ],
      [1, 2],
    ),
    "",
    `두 순서의 결과 dist 가 ${show(given.dist) === show(flipped.dist) ? "같고" : "다르고"}, 라운드는 ${given.rounds} 번과 ${flipped.rounds} 번입니다.`,
  ].join("\n");
}

/** deep.origin ③ — 음수 사이클이 있으면 「고칠 것이 없을 때까지」가 끝나지 않는다. */
function originNoStop(): string {
  const LIMIT = 6;
  const runs = untilStable(NEG_N, NEG_EDGES, 0, LIMIT);
  const rows = runs.map((r) => [String(r.k), String(r.writes), show(r.dist)]);
  const all = runs.every((r) => r.writes > 0);
  return [
    md(["라운드", "고친 칸", "dist"], rows, [0, 1]),
    "",
    `${runs.length} 라운드 ${all ? "모두" : "가운데 일부만"} 고친 칸이 있었고, 마지막 라운드가 끝난 뒤에도 dist[0] 이 ${num(runs.at(-1)?.dist[0] as number)}${으로표(runs.at(-1)?.dist[0] as number)} 줄어 있습니다.`,
  ].join("\n");
}

/** 「-6 으로」 · 「7 로」처럼 수 뒤의 로/으로. */
const 으로표 = (x: number): string => 으로(num(x));

/** deep.origin ⑤ — 간선 목록의 순서 8! 가지를 전부 시험한다. */
function orderSweepBlock(): string {
  const s = orderSweep();
  const keys = [...s.rounds.keys()].sort((a, b) => a - b);
  const rows = keys.map((k) => [
    String(k),
    comma(s.rounds.get(k) ?? 0),
    `${(((s.rounds.get(k) ?? 0) / s.total) * 100).toFixed(1)} %`,
  ]);
  return [
    md(["라운드 수", "그 라운드 수가 나온 순서", "비율"], rows, [0, 1, 2]),
    "",
    `간선 여덟 개의 순서 ${comma(s.total)} 가지를 전부 실행했고, 답이 정본과 다른 순서는 ${s.wrong} 개입니다. 라운드 수는 가장 적을 때 ${keys[0]} 번, 가장 많을 때 ${keys.at(-1)} 번입니다.`,
  ].join("\n");
}

/** deep.origin ⑤ — 라운드 수를 몇으로 잘라야 답이 나오는가. */
function capSweep(): string {
  const s = orderSweep();
  const target = show(bellmanFord(WALK_N, WALK_EDGES, WALK_SRC).dist);
  const rows: string[][] = [];
  let firstAll = -1;
  for (let k = 0; k <= WALK_N - 1; k++) {
    const got = show(capped(WALK_N, WALK_EDGES, WALK_SRC, k));
    const ok = s.correctAt.get(k) ?? 0;
    if (firstAll < 0 && ok === s.total) firstAll = k;
    rows.push([String(k), got, got === target ? "같다" : "다르다", comma(ok)]);
  }
  return [
    md(
      [
        "라운드 상한 k",
        "적힌 순서의 dist",
        "정답과",
        `${comma(s.total)} 가지 중 정답인 순서`,
      ],
      rows,
      [0, 3],
    ),
    "",
    `정점 V = ${WALK_N} 이라 V−1 = ${WALK_N - 1} 입니다. ${comma(s.total)} 가지 순서가 모두 정답이 되는 가장 작은 k 는 ${firstAll} 입니다.`,
  ].join("\n");
}

/** 먼저 알아 둘 개념 — k 마다 정점마다 opt_k. */
function layerTable(): string {
  const rows: string[][] = [];
  let stop = -1;
  let prev = "";
  for (let k = 0; k <= WALK_N - 1; k++) {
    const o = optAtMost(WALK_N, WALK_EDGES, WALK_SRC, k);
    if (stop < 0 && show(o) === prev) stop = k - 1;
    prev = show(o);
    rows.push([String(k), ...o.map(num)]);
  }
  return [
    md(
      ["k", ...Array.from({ length: WALK_N }, (_, v) => `정점 ${v}`)],
      rows,
      Array.from({ length: WALK_N + 1 }, (_, i) => i),
    ),
    "",
    `k = ${stop} 부터 줄이 더 바뀌지 않고, 그 줄이 정본의 답 ${show(bellmanFord(WALK_N, WALK_EDGES, WALK_SRC).dist)} 과 같습니다.`,
  ].join("\n");
}

/** 먼저 알아 둘 개념 — 칸 하나(정점 3, k = 3)를 읽는 법. */
function layerRead(): string {
  const K = 3;
  const V = 3;
  const mine = simplePaths(WALK_N, WALK_EDGES, WALK_SRC)
    .filter((p) => p.nodes.at(-1) === V)
    .sort((a, b) => a.nodes.length - b.nodes.length);
  const rows = mine.map((p) => {
    const len = p.nodes.length - 1;
    return [
      p.nodes.join("→"),
      String(len),
      String(p.cost),
      len <= K ? "든다" : "안 든다",
    ];
  });
  const opt = optAtMost(WALK_N, WALK_EDGES, WALK_SRC, K)[V] as number;
  const byEnum = bestByEnumeration(WALK_N, WALK_EDGES, WALK_SRC, K)[
    V
  ] as number;
  return [
    md(["경로", "간선 수", "비용", `간선 ${K} 개 이하`], rows, [1, 2]),
    "",
    `간선 ${K} 개 이하에 드는 경로의 비용 중 가장 작은 값은 ${num(byEnum)} 이고, 층 계산이 낸 opt_${K}(${V}) 도 ${num(opt)} 입니다.`,
  ].join("\n");
}

/** 먼저 알아 둘 개념 — 층과 층 사이. opt_k(5) 를 opt_{k−1} 에서 만든다. */
function layerStep(): string {
  const K = 5;
  const V = 5;
  const prev = optAtMost(WALK_N, WALK_EDGES, WALK_SRC, K - 1);
  const rows: string[][] = [
    [`간선을 더 쓰지 않는다`, `opt_${K - 1}(${V})`, num(prev[V] as number)],
  ];
  for (const [u, v, w] of WALK_EDGES) {
    if (v !== V) continue;
    const pu = prev[u] as number;
    rows.push([
      `간선 ${u}→${v} 를 끝에 잇는다`,
      `opt_${K - 1}(${u}) + ${plusW(w)}`,
      pu === INF
        ? `Infinity + ${plusW(w)} = Infinity`
        : `${num(pu)} + ${plusW(w)} = ${num(pu + w)}`,
    ]);
  }
  const got = optAtMost(WALK_N, WALK_EDGES, WALK_SRC, K)[V] as number;
  return [
    md(["후보", "식", "값"], rows),
    "",
    `후보 ${rows.length} 개 가운데 가장 작은 값이 ${num(got)} 이고, 층 계산이 낸 opt_${K}(${V}) 와 같습니다.`,
  ].join("\n");
}

/** 먼저 알아 둘 개념 — 라운드 k 뒤의 dist 와 opt_k 는 같은 것이 아니다(뒤집은 순서). */
function layerVsRound(): string {
  const flippedEdges = [...WALK_EDGES].reverse();
  const rec = record(WALK_N, flippedEdges, WALK_SRC);
  const frames = [rec.start, ...rec.rounds.map((r) => r.dist)];
  const rows = frames.map((d, k) => {
    const opt = optAtMost(WALK_N, flippedEdges, WALK_SRC, k);
    const le = d.every((x, i) => x <= (opt[i] as number));
    const lt = d.some((x, i) => x < (opt[i] as number));
    return [
      String(k),
      show(d),
      show(opt),
      le ? (lt ? "더 작은 칸이 있다" : "칸마다 같다") : "더 큰 칸이 있다",
    ];
  });
  return [
    md(["k", "라운드 k 뒤의 dist", "opt_k", "opt_k 와의 관계"], rows, [0]),
    "",
    `간선 목록을 뒤집은 순서로 실행했고, 라운드는 ${rec.rounds.length} 번에서 끝났습니다.`,
  ].join("\n");
}

/** 먼저 알아 둘 개념 — 층이 멈추는가. 음수 사이클이 있으면 멈추지 않는다. */
function layerStop(): string {
  const rows: string[][] = [];
  for (let k = 0; k <= WALK_N - 1; k++) {
    rows.push([
      String(k),
      show(optAtMost(WALK_N, WALK_EDGES, WALK_SRC, k)),
      show(optAtMost(NEG_N, NEG_EDGES, 0, k)),
    ]);
  }
  return [
    md(["k", "전개 입력의 opt_k", "음수 사이클 입력의 opt_k"], rows, [0]),
    "",
    `전개 입력은 정점 ${WALK_N} 개라 V−1 = ${WALK_N - 1} 이고, 음수 사이클 입력은 정점 ${NEG_N} 개라 V−1 = ${NEG_N - 1} 입니다.`,
  ].join("\n");
}

/** 1단계 — 시작값. */
function stageStart(): string {
  const rows = WALK.start.map((d, v) => [String(v), num(d)]);
  return [
    md(["정점", "dist"], rows, [0]),
    "",
    `값이 있는 칸은 dist[${WALK_SRC}] = 0 하나이고, 나머지 ${WALK_N - 1} 칸은 Infinity 입니다.`,
  ].join("\n");
}

/** 2단계 — 둘째 라운드의 간선 여덟 개를 적힌 차례대로. */
function stageRound(): string {
  const r = WALK.rounds[1] as Round;
  const rows = r.reads.map((e) => [
    String(e.at + 1),
    arrow([e.u, e.v, e.w]),
    e.skipped
      ? `dist[${e.u}]${이가(String(e.u))} Infinity`
      : `${num(e.du)} + ${plusW(e.w)} = ${num(e.cand as number)}`,
    num(e.before),
    e.skipped
      ? "넘어간다"
      : e.improved
        ? `dist[${e.v}] = ${num(e.cand as number)}`
        : "그대로",
  ]);
  const late = r.reads.find(
    (e) =>
      e.improved &&
      r.reads.some((f) => f.at < e.at && !f.skipped && f.u === e.v),
  );
  const early = late
    ? r.reads.find((f) => f.at < late.at && !f.skipped && f.u === late.v)
    : undefined;
  return [
    md(["차례", "간선 u→v", "dist[u] + w", "그때 dist[v]", "한 일"], rows, [0]),
    "",
    early && late
      ? `라운드 ${r.k} 에서 ${arrow([early.u, early.v, early.w])}${이가(String(early.v))} dist[${early.u}] = ${num(early.du)} 로 dist[${early.v}] = ${num(early.cand as number)}${을를(num(early.cand as number))} 적은 뒤, ${late.at + 1} 번째 간선 ${arrow([late.u, late.v, late.w])}${이가(String(late.v))} dist[${late.v}] 를 ${num(late.before)} 에서 ${num(late.cand as number)}${으로표(late.cand as number)} 줄였습니다.`
      : `라운드 ${r.k} 에서 같은 라운드 안에 낡아진 값이 없습니다.`,
  ].join("\n");
}

/** concept — 라운드마다 고친 칸 수와 changed. 3단계가 이 표를 가리킨다. */
function conceptRounds(): string {
  const rows = WALK.rounds.map((r) => [
    String(r.k),
    String(r.reads.filter((e) => e.improved).length),
    String(r.changed),
    show(r.dist),
  ]);
  const last = WALK.rounds.at(-1) as Round;
  const prev = WALK.rounds.at(-2) as Round;
  return [
    md(["라운드", "고친 칸", "changed", "라운드가 끝난 dist"], rows, [0, 1]),
    "",
    `라운드 ${last.k}${은는(String(last.k))} 라운드 ${prev.k}${이가(String(prev.k))} 끝난 dist 를 그대로 받아 같은 간선 ${WALK_EDGES.length} 개를 읽었고, 고친 칸이 ${last.reads.filter((e) => e.improved).length} 개입니다.`,
  ].join("\n");
}

const DETECT_CASES: { label: string; n: number; edges: Edge[] }[] = [
  { label: "전개 입력", n: WALK_N, edges: WALK_EDGES },
  { label: "음수 사이클 0->1->2->0", n: NEG_N, edges: NEG_EDGES },
  { label: "도달할 수 없는 음수 사이클", n: FAR_N, edges: FAR_EDGES },
  {
    label: "시작 정점의 음수 자기 간선 0->0(-1)",
    n: 2,
    edges: [
      [0, 0, -1],
      [0, 1, 1],
    ],
  },
  {
    label: "가중치 합이 0 인 순환 1->2->1",
    n: 3,
    edges: [
      [0, 1, 2],
      [1, 2, -1],
      [2, 1, 1],
    ],
  },
];

/** 4단계 — 마지막 라운드가 고쳤는가로 판정이 갈린다. */
function stageDetect(): string {
  const rows = DETECT_CASES.map((c) => {
    const rec = record(c.n, c.edges, 0);
    const last = rec.rounds.at(-1) as Round;
    const ref = bellmanFord(c.n, c.edges, 0);
    return [
      c.label,
      String(c.n),
      String(rec.rounds.length),
      String(last.reads.filter((e) => e.improved).length),
      String(ref.hasNegativeCycle),
    ];
  });
  return [
    md(
      [
        "입력",
        "정점 V",
        "실행한 라운드",
        "마지막 라운드가 고친 칸",
        "hasNegativeCycle",
      ],
      rows,
      [1, 2, 3],
    ),
    "",
    "hasNegativeCycle 칸은 정본이 낸 값입니다.",
  ].join("\n");
}

/** 이 방법이 기대는 전제 — 음수 사이클이 있으면 돌려준 dist 가 최단 거리가 아니다. */
function premiseCycle(): string {
  const rows = MUTANT_CASES.map((c) => {
    const ref = bellmanFord(c.n, c.edges, 0);
    const more = untilStable(c.n, c.edges, 0, c.n + 1);
    const extra = show(capped(c.n, c.edges, 0, c.n + 1));
    const fixedAt = more.at(-1)?.writes === 0;
    return [
      c.label,
      show(ref.dist),
      String(ref.hasNegativeCycle),
      fixedAt ? "없다" : extra,
    ];
  });
  return [
    md(
      ["입력", "돌려준 dist", "hasNegativeCycle", "한 라운드 더 읽은 dist"],
      rows,
    ),
    "",
    "마지막 열은 정본이 돌려준 뒤 라운드를 하나 더 읽었을 때 값이 바뀌면 그 dist 를, 안 바뀌면 「없다」를 적었습니다.",
  ].join("\n");
}

/** deep.walk — 고정 입력을 코드로. */
function walkInput(): string {
  const want = bellmanFord(WALK_N, WALK_EDGES, WALK_SRC);
  return [
    `const n = ${WALK_N};`,
    "const edges: [number, number, number][] = [",
    `  ${WALK_EDGES.slice(0, 4)
      .map(([u, v, w]) => `[${u}, ${v}, ${w}]`)
      .join(", ")},`,
    `  ${WALK_EDGES.slice(4)
      .map(([u, v, w]) => `[${u}, ${v}, ${w}]`)
      .join(", ")},`,
    "];",
    `const src = ${WALK_SRC};`,
    `// 이 절이 끝나면 나와야 하는 값: { dist: ${show(want.dist)}, hasNegativeCycle: ${want.hasNegativeCycle} }`,
  ].join("\n");
}

/** deep.walk 1 — T1 이 끝난 시점. */
function walkT1(): string {
  return [
    "T1 이 끝난 시점",
    ...table(
      [
        ["dist", show(WALK.start)],
        [
          "간선 목록",
          WALK_EDGES.map(([u, v, w]) => `[${u},${v},${w}]`).join(" "),
        ],
        ["읽은 간선", "0 개"],
      ],
      "  ",
    ),
  ].join("\n");
}

/** deep.walk 2 — 첫 라운드가 간선 여덟 개를 차례로 읽는다. */
function walkT2(): string {
  const r = WALK.rounds[0] as Round;
  return [
    "T2 — 첫 라운드가 간선 여덟 개를 차례로 읽는다",
    ...table(
      r.reads.map((e) => [`[${e.u},${e.v},${e.w}]`, readText(e)]),
      "  ",
    ),
    "",
    ...table(
      [
        ["라운드가 끝난 dist", show(r.dist)],
        ["changed", String(r.changed)],
      ],
      "  ",
    ),
  ].join("\n");
}

/** 짚고 가기 1 — ③ 을 빼도 답이 갈리는가. */
function pauseGuard(): string {
  const rows = MUTANT_CASES.map((c) => {
    const a = answer(bellmanFord(c.n, c.edges, 0));
    const b = answer(noGuard.bellmanFord(c.n, c.edges, 0));
    return [c.label, a, b, a === b ? "같다" : "다르다"];
  });
  const w = counted(WALK_N, WALK_EDGES, WALK_SRC);
  return [
    ...table([["입력", "정본", "③ 을 뺀 판", "판정"], ...rows]),
    "",
    "「아직 값이 없다」를 Infinity 대신 10^15 로 적고 ③ 도 뺀 판",
    ...table([
      ["입력", "정본", "10^15 을 쓰고 ③ 을 뺀 판", "판정"],
      ...MUTANT_CASES.map((c) => {
        const ref = bellmanFord(c.n, c.edges, 0);
        const got = sentinelNoGuard(c.n, c.edges, 0, 1e15);
        return [
          c.label,
          String(ref.hasNegativeCycle),
          String(got.hasNegativeCycle),
          ref.hasNegativeCycle === got.hasNegativeCycle ? "같다" : "다르다",
        ];
      }),
    ]),
    "",
    `전개 입력에서 ③ 이 참이 된 횟수  ${w.skips} 번 (간선 읽기 ${w.reads} 번 중)`,
  ].join("\n");
}

/** 짚고 가기 1 — 10^15 을 쓴 판이 도달할 수 없는 음수 사이클에서 라운드마다 무엇을 적는가. */
function pauseGuardWhere(): string {
  const S = 1e15;
  const got = sentinelNoGuard(FAR_N, FAR_EDGES, 0, S);
  const ref = record(FAR_N, FAR_EDGES, 0);
  const shown = (xs: readonly number[]) =>
    `[${xs.map((x) => (x === S ? "10^15" : comma(x))).join(", ")}]`;
  return [
    `입력  ${FAR_EDGES.map(([u, v, w]) => `${u} -(${w})-> ${v}`).join(" · ")} · src = 0`,
    "",
    ...table(
      [
        ["판", "라운드", "라운드가 끝난 dist"],
        ...ref.rounds.map((r) => ["정본", String(r.k), show(r.dist)]),
        ...got.frames.map((d, i) => [
          "10^15 을 쓴 판",
          String(i + 1),
          shown(d),
        ]),
      ],
      "  ",
    ),
    "",
    `  정본            라운드 ${ref.rounds.length} 에서 끝나 hasNegativeCycle = ${ref.hasNegativeCycle}`,
    `  10^15 을 쓴 판  라운드 ${got.frames.length} = n 까지 고쳐 hasNegativeCycle = ${got.hasNegativeCycle}`,
  ].join("\n");
}

/** deep.walk 3 — 조각을 두 입력에 걸어 어느 return 으로 끝나는지 본다. */
function walkStop(): string {
  const lines: string[][] = [];
  for (const c of [MUTANT_CASES[0], MUTANT_CASES[1]] as {
    label: string;
    n: number;
    edges: Edge[];
  }[]) {
    const rec = record(c.n, c.edges, 0);
    const last = rec.rounds.at(-1) as Round;
    const exit = !last.changed ? "⑤ 조기 종료" : "⑥ 음수 사이클";
    lines.push([
      c.label,
      `n = ${c.n}`,
      `라운드 ${last.k} 에서 changed = ${last.changed} · round === n 이 ${last.k === c.n}`,
      `${exit} -> hasNegativeCycle = ${rec.hasNegativeCycle}`,
    ]);
  }
  return table(lines).join("\n");
}

/** 짚고 가기 2 — 라운드를 n−1 번만 실행하면. */
function pauseShortLoop(): string {
  const rows = MUTANT_CASES.map((c) => {
    const a = answer(bellmanFord(c.n, c.edges, 0));
    const b = answer(shortLoop.bellmanFord(c.n, c.edges, 0));
    return [c.label, a, b, a === b ? "같다" : "다르다"];
  });
  return table([
    ["입력", "정본", "라운드를 n−1 번만 실행한 판", "판정"],
    ...rows,
  ]).join("\n");
}

/** 짚고 가기 2 — 음수 사이클 입력에서 두 판이 라운드마다 고친 것. */
function pauseShortLoopWhere(): string {
  const rec = record(NEG_N, NEG_EDGES, 0);
  const cut = shortLoop.bellmanFord(NEG_N, NEG_EDGES, 0);
  const mark = (r: Round) =>
    `라운드 ${r.k} 고침 ${r.reads.filter((e) => e.improved).length}`;
  const kept = rec.rounds.slice(0, NEG_N - 1);
  return [
    `음수 사이클 0->1->2->0 · n = ${NEG_N}`,
    ...table(
      [
        ["정본", rec.rounds.map(mark).join(" · ")],
        [
          "",
          `라운드 ${NEG_N} 에서 round === n 이 참 -> ⑥ -> ${answer(bellmanFord(NEG_N, NEG_EDGES, 0))}`,
        ],
        ["n−1 번만 실행", kept.map(mark).join(" · ")],
        [
          "",
          `round === n 이 한 번도 참이 안 되고 루프 뒤 return -> ${answer(cut)}`,
        ],
      ],
      "  ",
    ),
  ].join("\n");
}

/** deep.walk 4 — 고정 입력을 끝까지 실행한 걸음별 상태와 조건. */
function walkTrace(): string {
  const rows: string[][] = [
    ["T1", "—", "① 시작값", "—", "—", show(WALK.start)],
  ];
  for (const r of WALK.rounds) {
    const skips = r.reads.filter((e) => e.skipped).length;
    const writes = r.reads
      .filter((e) => e.improved)
      .map((e) => `dist[${e.v}] = ${num(e.cand as number)}`);
    rows.push([
      `T${r.k + 1}`,
      String(r.k),
      `③ ${skips} 번 · ④ ${writes.length === 0 ? "0 번" : writes.join(" · ")}`,
      `changed = ${r.changed} → **${!r.changed ? "참" : "거짓"}**`,
      `\`${r.k} === ${WALK_N}\` → **${r.k === WALK_N ? "참" : "거짓"}**`,
      show(r.dist),
    ]);
  }
  const last = WALK.rounds.at(-1) as Round;
  rows.push([
    `T${last.k + 2}`,
    "—",
    "⑤ 에서 돌려준다",
    "—",
    "—",
    show(WALK.dist),
  ]);
  const c = counted(WALK_N, WALK_EDGES, WALK_SRC);
  return [
    md(
      [
        "걸음",
        "라운드",
        "③ 넘김 · ④ 고침",
        "⑤ `!changed`",
        "⑥ `round === n`",
        "dist",
      ],
      rows,
    ),
    "",
    `간선 읽기 ${c.reads} 번 가운데 ③ 이 ${c.skips} 번, ④ 가 값을 고친 것이 ${c.writes} 번입니다. 반환값은 { dist: ${show(WALK.dist)}, hasNegativeCycle: ${WALK.hasNegativeCycle} } 입니다.`,
  ].join("\n");
}

/** deep.walk 4 — 여섯 갈래가 어느 입력에서 몇 번 참이 됐는가. */
function branchCoverage(): string {
  const a = branchCounts(WALK_N, WALK_EDGES, WALK_SRC);
  const b = branchCounts(NEG_N, NEG_EDGES, 0);
  const rows = LABELS.map(([mark, what], i) => [
    mark,
    what,
    comma(a[i] as number),
    comma(b[i] as number),
  ]);
  const zeroA = LABELS.filter((_, i) => a[i] === 0).map(([m]) => m);
  return [
    md(["라벨", "갈래", "전개 입력", "음수 사이클 입력"], rows, [2, 3]),
    "",
    `전개 입력에서 0 번인 갈래는 ${zeroA.join(" · ")} 이고, 음수 사이클 입력에서 그 갈래가 ${b[5]} 번 참이 됐습니다.`,
  ].join("\n");
}

/** 짚고 가기 3 — 조기 종료를 막으면. */
function pauseEarlyExit(): string {
  const rows = MUTANT_CASES.map((c) => {
    const a = answer(bellmanFord(c.n, c.edges, 0));
    const b = answer(noEarlyExit.bellmanFord(c.n, c.edges, 0));
    return [c.label, a, b, a === b ? "같다" : "다르다"];
  });
  return table([["입력", "정본", "⑤ 를 막은 판", "판정"], ...rows]).join("\n");
}

/** 짚고 가기 3 — 전개 입력에서 두 판이 갈리는 걸음. */
function pauseEarlyExitWhere(): string {
  const last = WALK.rounds.at(-1) as Round;
  const blocked = noEarlyExit.bellmanFord(WALK_N, WALK_EDGES, WALK_SRC);
  return [
    `전개 입력에서 두 판이 갈리는 자리 — T${last.k + 1}`,
    ...table(
      [
        [
          "정본",
          `라운드 ${last.k}${이가(String(last.k))} 고친 칸 0 -> ⑤ 가 참 -> ${WALK.hasNegativeCycle} 로 반환`,
        ],
        [
          "⑤ 를 막은 판",
          `라운드 ${last.k} 도 그대로 지나간다 -> 라운드 ${WALK_N} 에서 round === n -> ${blocked.hasNegativeCycle} 로 반환`,
        ],
      ],
      "  ",
    ),
  ].join("\n");
}

/** deep.walk 5 — 전체 코드를 여러 입력에 실행한다. */
function walkResult(): string {
  const calls: [string, number, Edge[], number][] = [
    [
      `bellmanFord(${WALK_N}, ${JSON.stringify(WALK_EDGES)}, ${WALK_SRC})`,
      WALK_N,
      WALK_EDGES,
      WALK_SRC,
    ],
    [
      `bellmanFord(${NEG_N}, ${JSON.stringify(NEG_EDGES)}, 0)`,
      NEG_N,
      NEG_EDGES,
      0,
    ],
    [
      `bellmanFord(${FAR_N}, ${JSON.stringify(FAR_EDGES)}, 0)`,
      FAR_N,
      FAR_EDGES,
      0,
    ],
    ["bellmanFord(3, [], 1)", 3, [], 1],
    ["bellmanFord(1, [], 0)", 1, [], 0],
  ];
  return table(
    calls.map(([label, n, e, s]) => {
      const r = bellmanFord(n, e, s);
      return [
        label,
        `-> { dist: ${show(r.dist)}, hasNegativeCycle: ${r.hasNegativeCycle} }`,
      ];
    }),
  ).join("\n");
}

/** related — 라운드 하나를 규칙 F 로 보면 T6 · T7 에서 고정점에 닿는다. */
function relatedFixed(): string {
  const frames = [WALK.start, ...WALK.rounds.map((r) => r.dist)];
  const rows: string[][] = [];
  for (let i = 0; i + 1 < frames.length; i++) {
    const a = frames[i] as number[];
    const b = frames[i + 1] as number[];
    rows.push([
      `T${i + 1} 의 dist`,
      show(a),
      sameArr(a, b)
        ? "F 를 적용해도 그대로다"
        : `F 를 적용하면 T${i + 2} 의 dist 가 된다`,
    ]);
  }
  return table(rows, "  ").join("\n");
}

/** purpose.alt — 두 설계의 기본 연산과 추가 칸. */
function altTable(): string {
  const mine = altCases["이 가이드의 절차"]();
  const spfa = altCases["값이 바뀐 정점만 큐에 담는 설계"]();
  const cross = crossing();
  const leaves = [1, cross.tie - 1, cross.tie, cross.ahead, 4096];
  const rows = leaves.map((p) => {
    const key = `잎 ${p} 개 · 기본 연산`;
    const a = mine[key] as number;
    const b = spfa[key] as number;
    const which = a < b ? "이 가이드의 절차" : a > b ? "SPFA" : "같다";
    return [
      `${comma(p)} 개`,
      comma(a),
      comma(b),
      which,
      comma(Math.abs(a - b)),
    ];
  });
  return [
    md(
      ["잎 p", "이 가이드의 절차", "SPFA", "적은 쪽", "차이"],
      rows,
      [1, 2, 4],
    ),
    "",
    `추가 칸은 잎 4,096 개에서 이 가이드의 절차가 ${comma(mine["잎 4096 개 · 추가 칸"] as number)} 개, SPFA 가 ${comma(spfa["잎 4096 개 · 추가 칸"] as number)} 개입니다. 전개 입력에서는 기본 연산이 ${mine["전개 입력 · 기본 연산"]} 번 대 ${spfa["전개 입력 · 기본 연산"]} 번, 추가 칸이 ${mine["전개 입력 · 추가 칸"]} 개 대 ${spfa["전개 입력 · 추가 칸"]} 개입니다. 두 계수는 잎 ${cross.tie} 개에서 같아지고 ${cross.ahead} 개부터 이 절차가 적습니다.`,
  ].join("\n");
}

/** purpose.alt — 경계가 그 자리인 까닭. 잎 하나를 더할 때 두 계수가 늘어나는 값. */
function altBoundary(): string {
  const cross = crossing();
  const one = hub(1);
  const two = hub(2);
  const a1 = 라운드로읽는설계(one.n, one.edges, 0);
  const a2 = 라운드로읽는설계(two.n, two.edges, 0);
  const b1 = 큐에담는설계(one.n, one.edges, 0);
  const b2 = 큐에담는설계(two.n, two.edges, 0);
  const rounds = record(one.n, one.edges, 0).rounds.length;
  const da = a2.ops - a1.ops;
  const db = b2.ops - b1.ops;
  const gap = b1.ops - a1.ops;
  return [
    "잎을 하나 더할 때 두 설계가 늘어나는 기본 연산",
    ...table(
      [
        [
          "이 절차",
          `라운드 ${rounds} 번이 그 잎의 간선 1 개를 한 번씩 읽는다`,
          `+${da}`,
        ],
        [
          "SPFA",
          "허브를 꺼낼 때마다 그 잎의 간선을 읽고, 잎을 넣고 꺼낸다",
          `+${db}`,
        ],
      ],
      "  ",
    ),
    "",
    ...table(
      [
        [
          "잎이 하나일 때의 차",
          `${comma(a1.ops)} − ${comma(b1.ops)} = ${comma(-gap)}`,
        ],
        ["잎 하나마다 줄어드는 차", `${db} − ${da} = ${db - da}`],
        [
          "차가 0 이 되는 잎",
          `1 + ${comma(-gap)} ÷ ${db - da} = ${1 + -gap / (db - da)}`,
        ],
        [
          "실측한 경계",
          `잎 ${cross.tie} 개에서 같아지고 ${cross.ahead} 개부터 이 절차가 적다`,
        ],
      ],
      "  ",
    ),
  ].join("\n");
}

/** deep.math ② — 정의를 전개 입력의 값에 넣어 확인한다. */
function mathCheck(): string {
  const paths = simplePaths(WALK_N, WALK_EDGES, WALK_SRC);
  const rows: string[][] = [];
  for (let k = 0; k <= WALK_N - 1; k++) {
    const byEnum = bestByEnumeration(WALK_N, WALK_EDGES, WALK_SRC, k);
    const byLayer = optAtMost(WALK_N, WALK_EDGES, WALK_SRC, k);
    rows.push([
      String(k),
      show(byEnum),
      show(byLayer),
      show(byEnum) === show(byLayer) ? "같다" : "다르다",
    ]);
  }
  return [
    `출발점 0 에서 나가는 단순 경로가 ${paths.length} 개다`,
    "",
    ...table([
      ["k", "경로를 전부 만들어 고른 최솟값", "점화식이 낸 값", "판정"],
      ...rows,
    ]),
  ].join("\n");
}

/** deep.math ④ — 결과식에 제약 규모를 넣는다. */
function mathScale(): string {
  const rows = [10, 100, V_LIMIT].map((v) => {
    const e = v * (v - 1);
    return [comma(v), comma(e), comma(v - 1), comma(v * e)];
  });
  const maxDist = (V_LIMIT - 1) * W_LIMIT;
  const safe = Number.MAX_SAFE_INTEGER;
  return [
    ...table([
      ["정점 V", "간선 E = V(V−1)", "라운드 상한 V−1", "간선 읽기 상한 V x E"],
      ...rows,
    ]),
    "",
    "제약 상한에서",
    ...table(
      [
        [
          "거리 값의 절댓값",
          `(V−1) x ${comma(W_LIMIT)} = ${comma(maxDist)} 까지`,
        ],
        ["정수를 정확히 담는 한계", `2^53 − 1 = ${comma(safe)}`],
        ["둘의 비", `${comma(Math.floor(safe / maxDist))} 배 넘게 남는다`],
      ],
      "  ",
    ),
  ].join("\n");
}

/** 불변식 ② — 라운드마다 dist 와 「간선 k 개 이하」의 최소 비용을 나란히 놓는다. */
function invariantRounds(): string {
  const frames = [WALK.start, ...WALK.rounds.map((r) => r.dist)];
  const rows = frames.map((d, k) => {
    const opt = optAtMost(WALK_N, WALK_EDGES, WALK_SRC, k);
    const le = d.every((x, i) => x <= (opt[i] as number));
    return [String(k), show(d), show(opt), le ? "크지 않다" : "크다"];
  });
  return md(["k", "라운드 k 뒤의 dist", "opt_k", "opt_k 와의 관계"], rows, [0]);
}

/** 불변식 ② — 경계 입력. */
function invariantEdges(): string {
  const cases: [string, number, Edge[], number][] = [
    ["정점이 하나이고 간선이 없다", 1, [], 0],
    ["정점이 여럿인데 간선이 없다", 3, [], 1],
    ["도달할 수 없는 정점이 있다", 3, [[0, 1, 5]], 0],
    [
      "가중치가 0 이다",
      3,
      [
        [0, 1, 0],
        [1, 2, 0],
      ],
      0,
    ],
    [
      "가중치 합이 0 인 순환",
      3,
      [
        [0, 1, 2],
        [1, 2, -1],
        [2, 1, 1],
      ],
      0,
    ],
    [
      "시작 정점의 음수 자기 간선",
      2,
      [
        [0, 0, -1],
        [0, 1, 1],
      ],
      0,
    ],
  ];
  const rows = cases.map(([label, n, e, s]) => {
    const r = bellmanFord(n, e, s);
    const c = counted(n, e, s);
    return [
      label,
      show(r.dist),
      String(r.hasNegativeCycle),
      String(c.rounds),
      String(c.reads),
    ];
  });
  return md(
    ["경계 입력", "dist", "hasNegativeCycle", "라운드", "간선 읽기"],
    rows,
    [3, 4],
  );
}

/** 불변식 ③ — 부등호 방향을 뒤집은 변이. */
function mutantDirection(): string {
  const rows = MUTANT_CASES.map((c) => [
    c.label,
    answer(bellmanFord(c.n, c.edges, 0)),
    answer(wrongDirection.bellmanFord(c.n, c.edges, 0)),
  ]);
  return table([["입력", "정본", "부등호를 뒤집은 판"], ...rows]).join("\n");
}

/** 불변식 ③ — 뒤집은 판이 첫 라운드에서 불변식의 앞 문장을 깨는 자리. */
function mutantDirectionWhere(): string {
  const opt1 = optAtMost(WALK_N, WALK_EDGES, WALK_SRC, 1);
  const got = wrongDirection.bellmanFord(WALK_N, WALK_EDGES, WALK_SRC);
  const broken = opt1.flatMap((o, v) =>
    (got.dist[v] as number) > o ? [v] : [],
  );
  return [
    "전개 입력의 첫 라운드",
    ...table(
      [
        ["opt_1", show(opt1)],
        ["뒤집은 판이 돌려준 dist", show(got.dist)],
        [
          "dist 가 opt_1 보다 큰 정점",
          broken.length === 0 ? "없음" : broken.join(" · "),
        ],
      ],
      "  ",
    ),
  ].join("\n");
}

/** perf.derive — 전개의 걸음마다 읽은 간선. */
function perfCount(): string {
  let sum = 0;
  const rows = WALK.rounds.map((r) => {
    sum += r.reads.length;
    return [
      `T${r.k + 1}`,
      String(r.k),
      String(r.reads.length),
      String(r.reads.filter((e) => e.skipped).length),
      comma(sum),
    ];
  });
  const c = counted(WALK_N, WALK_EDGES, WALK_SRC);
  return [
    md(
      ["걸음", "라운드", "간선 읽기", "그중 ③", "여기까지 누적"],
      rows,
      [1, 2, 3, 4],
    ),
    "",
    `라운드 ${c.rounds} 번 × 간선 ${WALK_EDGES.length} 개 = ${c.reads} 번이고, 그중 ③ 이 ${c.skips} 번, ④ 가 값을 고친 것이 ${c.writes} 번입니다.`,
  ].join("\n");
}

/** perf.derive — 총식에 두 규모를 넣는다. */
function perfTotal(): string {
  const c = counted(WALK_N, WALK_EDGES, WALK_SRC);
  return table(
    [
      [
        "V = 7 · E = 8",
        `R = ${c.rounds}`,
        `${WALK_N} + ${c.rounds} x ${WALK_EDGES.length} = ${WALK_N + c.reads}`,
      ],
      [
        `V = ${V_LIMIT} · E = ${comma(E_LIMIT)}`,
        `R ≤ ${V_LIMIT}`,
        `${V_LIMIT} + ${V_LIMIT} x ${comma(E_LIMIT)} = ${comma(V_LIMIT + V_LIMIT * E_LIMIT)} 이하`,
      ],
    ],
    "  ",
  ).join("\n");
}

/** perf.worst — 모양마다 라운드 수와 간선 읽기를 실제로 잰다. */
function worstShape(): string {
  const V = 64;
  const shapes: [string, number, Edge[]][] = [
    ["사슬, 오름차순으로 적음", V, chain(V, false)],
    ["사슬, 내림차순으로 적음", V, chain(V, true)],
    ["완전 그래프", V, complete(V)],
    ["내림차순 사슬 + 나머지 간선", V, chainPlusFiller(V)],
    [
      "음수 사이클이 있는 사슬",
      V,
      [...chain(V, true), [V - 1, 0, -1_000_000] as Edge],
    ],
  ];
  const rows = shapes.map(([label, n, edges]) => {
    const c = counted(n, edges, 0);
    return [
      label,
      comma(edges.length),
      String(c.rounds),
      comma(c.reads),
      String(c.hasNegativeCycle),
    ];
  });
  return [
    md(
      ["모양 (V = 64)", "간선 E", "라운드", "간선 읽기", "음수 사이클"],
      rows,
      [1, 2, 3],
    ),
    "",
    `라운드 수는 가장 많을 때 V = ${V} 번이고, 그때 간선 읽기는 V × E 입니다.`,
  ].join("\n");
}

/** perf.worst — 축마다 최악을 만드는 입력이 다르다. */
function worstAxes(): string {
  const V = 64;
  const a = counted(V, chain(V, true), 0);
  const b = counted(V, chainPlusFiller(V), 0);
  const heavy: Edge[] = [];
  for (let i = 0; i + 1 < V; i++) heavy.push([i, i + 1, W_LIMIT]);
  const c = counted(V, heavy, 0);
  return [
    md(
      [
        "최악으로 만들 축",
        "그 축을 최대로 만드는 입력 (V = 64)",
        "그 축의 값",
        "다른 축의 값",
      ],
      [
        [
          "라운드 수",
          `내림차순 사슬 (E = ${V - 1})`,
          `라운드 ${a.rounds}`,
          `간선 읽기 ${comma(a.reads)}`,
        ],
        [
          "간선 읽기",
          `내림차순 사슬 + 나머지 간선 (E = ${comma(chainPlusFiller(V).length)})`,
          `간선 읽기 ${comma(b.reads)}`,
          `라운드 ${b.rounds}`,
        ],
        [
          "거리 값의 크기",
          "가중치 10^9 짜리 오름차순 사슬",
          `dist[${V - 1}] = ${comma(c.dist[V - 1] as number)}`,
          `라운드 ${c.rounds}`,
        ],
      ],
    ),
    "",
    "세 입력이 서로 다르고, 한 입력이 세 축을 함께 최대로 만들지 않습니다.",
  ].join("\n");
}

/** perf.worst — 규모의 상한에서 축마다 최악. */
function worstLimit(): string {
  const a = counted(V_LIMIT, chain(V_LIMIT, true), 0);
  const fill = chainPlusFiller(V_LIMIT);
  const b = counted(V_LIMIT, fill, 0);
  const heavy: Edge[] = [];
  for (let i = 0; i + 1 < V_LIMIT; i++) heavy.push([i, i + 1, W_LIMIT]);
  const c = counted(V_LIMIT, heavy, 0);
  return [
    md(
      ["최악으로 만들 축", "규모의 상한에서의 입력", "값"],
      [
        [
          "라운드 수",
          `정점 ${V_LIMIT} 개 사슬을 내림차순으로 적는다`,
          `라운드 ${a.rounds}`,
        ],
        [
          "간선 읽기",
          `그 사슬에 나머지 간선을 전부 채운다 (E = ${comma(fill.length)})`,
          `${comma(b.reads)} 번`,
        ],
        [
          "거리 값의 크기",
          "가중치 10^9 짜리 오름차순 사슬",
          `dist[${V_LIMIT - 1}] = ${comma(c.dist[V_LIMIT - 1] as number)}`,
        ],
      ],
      [],
    ),
    "",
    `셋 다 실행한 값입니다. 둘째 줄의 ${comma(b.reads)} 번은 V × E = ${V_LIMIT} × ${comma(E_LIMIT)} 과 ${b.reads === V_LIMIT * E_LIMIT ? "같습니다" : "다릅니다"}.`,
  ].join("\n");
}

/** selfcheck — T3 과 T4 의 dist. */
function selfcheckT3T4(): string {
  const r2 = WALK.rounds[1] as Round;
  const r3 = WALK.rounds[2] as Round;
  const moved = r2.dist.flatMap((d, v) =>
    d !== INF && d !== r3.dist[v]
      ? [
          `dist[${v}] 이 ${num(d)} 에서 ${num(r3.dist[v] as number)}${으로표(r3.dist[v] as number)}`,
        ]
      : [],
  );
  return table([
    ["T3 의 dist", show(r2.dist)],
    ["T4 의 dist", show(r3.dist)],
    ["값이 있다가 바뀐 자리", moved.join(" · ")],
  ]).join("\n");
}

export const PROOFS: { [id: string]: () => string } = {
  conceptPaths,
  conceptRounds,
  conceptCycle,
  naiveScale,
  originSettle,
  originSettleWhere,
  orderRounds,
  originNoStop,
  orderSweepBlock,
  capSweep,
  layerTable,
  layerRead,
  layerStep,
  layerVsRound,
  layerStop,
  stageStart,
  stageRound,
  stageDetect,
  premiseCycle,
  walkInput,
  walkT1,
  walkT2,
  pauseGuard,
  pauseGuardWhere,
  walkStop,
  pauseShortLoop,
  pauseShortLoopWhere,
  walkTrace,
  branchCoverage,
  pauseEarlyExit,
  pauseEarlyExitWhere,
  walkResult,
  relatedFixed,
  altTable,
  altBoundary,
  mathCheck,
  mathScale,
  invariantRounds,
  invariantEdges,
  mutantDirection,
  mutantDirectionWhere,
  perfCount,
  perfTotal,
  worstShape,
  worstAxes,
  worstLimit,
  selfcheckT3T4,
};
