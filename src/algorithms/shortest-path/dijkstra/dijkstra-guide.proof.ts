/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run tools/check-proof.ts src/algorithms/shortest-path/dijkstra/dijkstra-guide.md
 *
 * **계수를 세는 사본이 여럿 있다.** 정본은 몇 번 셌는지를 내보내지 않으므로, 세는 자리만
 * 덧붙인 사본이 아니면 계수를 낼 방법이 없다. **답이 맞는지는 사본이 아니라 정본이 진다** —
 * 사본은 부를 때마다 자기 답을 정본과 맞대고(`checked`), 어긋나면 던진다. 줄을 더하는 변이
 * (`noDuplicatePush` · `visitedOnce`)는 `loadMutant`(한 줄 삭제·치환)로 만들 수 없어 여기 손으로
 * 적었다 — 다른 줄은 정본과 같다.
 *
 * **변이가 아무것도 안 바꾸는지를 검사하는 자리는 중화 실행을 피해 간다.** `check-proof` 가
 * 이 파일을 한 번 더 부를 때는 `loadMutant` 이 정본을 그대로 돌려주므로(중화), 그 상태에서
 * 「변이가 답을 안 바꿨다」로 던지면 중화 대조 자체가 실행되지 않는다. 중화 여부는 변이 모듈의
 * 함수가 정본과 같은 객체인가로 값에서 알아낸다(`중화됨`).
 *
 * 걸음 기록(`record`)은 그림 사이드카(`-guide.fig.tsx`)가 걸음 재생 패널과 정적 그림을 만드는 데도
 * 쓴다 — 본문의 표와 그림이 한 실행에서 나온다. 「경쟁 설계와의 대조」의 수는 `bench-alt` 가 낸
 * `.bench.json` 에서 받는다.
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { 으로, 은는, 을를, 이가 } from "../../../../tools/josa.ts";
import benchJson from "./dijkstra-guide.bench.json";
import { dijkstra, type Edge } from "./dijkstra-guide.ref.ts";

/* ────────────────────────── 고정 입력 ────────────────────────── */

/**
 * 본문 전개가 쓰는 그래프. 정점 여섯 · 방향 간선 일곱이고 정점 5 는 간선이 하나도 없다.
 *
 * 네 갈래를 한 입력에서 전부 실행한다 — 처음 찾는 완화(0→1·0→2) · 더 짧은 길로 고치는
 * 완화(2→1) · 고칠 것이 없는 간선(4→1) · 뒤처진 기록 버리기(정점 1 과 3 을 두 번째로 꺼낼 때).
 */
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
export const WALK_SRC = 0;

/**
 * 「지름길이 나중에 나오는」 그래프. 정점 0 이 나머지 전부로 가중치 `k` 짜리 간선을 갖고,
 * 사슬 `i → i+1` 은 가중치 1 이다. 먼저 찾은 큰 값이 나중에 작은 값으로 고쳐지는 자리가
 * 정점마다 하나씩 생겨서 **꺼내는 순서**가 완화 시도 수를 가른다.
 */
export function shortcut(k: number): { n: number; edges: Edge[] } {
  const edges: Edge[] = [];
  for (let i = 2; i < k; i++) edges.push([0, i, k]);
  for (let i = 0; i + 1 < k; i++) edges.push([i, i + 1, 1]);
  return { n: k, edges };
}

/** 값이 재현되도록 생성식을 고정한 성긴 그래프. 정점마다 나가는 간선이 셋이다. */
export function sparse(v: number): { n: number; edges: Edge[] } {
  const edges: Edge[] = [];
  for (let i = 0; i < v; i++) {
    for (let j = 1; j <= 3; j++) {
      const to = (i * 7 + j * 13) % v;
      if (to === i) continue;
      edges.push([i, to, ((i * 31 + j * 17) % 20) + 1]);
    }
  }
  return { n: v, edges };
}

/**
 * 다이아몬드 사슬 — 다이아몬드 `k` 개를 한 줄로 이은 그래프. 다이아몬드 하나는 `a→b` · `a→c` ·
 * `b→d` · `c→d` 넷이고, 뒤 다이아몬드의 `a` 가 앞의 `d` 다. 정점 `3k + 1` · 간선 `4k` 인 성긴
 * 그래프인데 처음에서 끝까지의 경로가 다이아몬드마다 두 배가 된다.
 */
export function diamonds(k: number): { n: number; edges: Edge[] } {
  const edges: Edge[] = [];
  for (let i = 0; i < k; i++) {
    const a = 3 * i;
    edges.push(
      [a, a + 1, 1],
      [a, a + 2, 2],
      [a + 1, a + 3, 2],
      [a + 2, a + 3, 1],
    );
  }
  return { n: 3 * k + 1, edges };
}

/**
 * 거꾸로 놓은 사슬 — 사슬 `0 → 1 → … → V−1` 을 간선 목록 **뒤에서부터** 적고, 값을 못 줄이는
 * 되돌아가는 간선 `i+1 → i`(가중치 1)를 섞는다. 라운드마다 정점이 하나씩만 정해져 라운드가 `V`
 * 번이 된다.
 */
export function reversedChain(v: number): { n: number; edges: Edge[] } {
  const edges: Edge[] = [];
  for (let i = v - 2; i >= 0; i--) {
    edges.push([i, i + 1, 1]);
    edges.push([i + 1, i, 1]);
  }
  return { n: v, edges };
}

/* ────────────────────────── 표기 ────────────────────────── */

/** `[0, 3, 1, 4, 7, Infinity]` 꼴 — 본문 표기와 같다. */
export const show = (xs: readonly number[]): string => `[${xs.join(", ")}]`;

/** `19,999,800,000` 꼴 — 본문 표기와 같다. */
export const comma = (n: number): string => n.toLocaleString("en-US");

/** 거리 하나 — 무한대는 `Infinity` 로 적는다. */
export const num = (d: number): string =>
  d === Number.POSITIVE_INFINITY ? "Infinity" : comma(d);

/** 큐 항목 하나 — `(정점, 키)`. */
export const item = ([v, k]: readonly [number, number]): string =>
  `(${v}, ${k})`;

const items = (xs: readonly (readonly [number, number])[]): string =>
  xs.length === 0 ? "비어 있음" : xs.map(item).join(" ");

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

/** 등폭 블록 두 칸 — 앞 칸 폭을 값에서 재서 맞춘다. */
function lines(rows: [string, string][], indent = "  "): string[] {
  const w = Math.max(...rows.map(([a]) => width(a)));
  return rows.map(([a, b]) => `${indent}${pad(a, w)}  ${b}`.trimEnd());
}

const sameArr = (a: readonly number[], b: readonly number[]): boolean =>
  a.length === b.length && a.every((x, i) => x === b[i]);

/* ────────────────────── 계수를 세는 사본 ────────────────────── */

function adjacency(n: number, edges: Edge[]): [number, number][][] {
  const adj: [number, number][][] = Array.from({ length: n }, () => []);
  for (const [u, v, w] of edges) (adj[u] as [number, number][]).push([v, w]);
  return adj;
}

/** 사본의 답을 정본과 맞댄다. 가중치가 음수인 입력은 정본의 보장 밖이라 맞춰 보지 않는다. */
function checked(n: number, edges: Edge[], src: number, got: number[]): void {
  if (edges.some(([, , w]) => w < 0)) return;
  const want = dijkstra(n, edges, src);
  if (!sameArr(want, got)) {
    throw new Error(`사본의 답 ${show(got)} 이 정본 ${show(want)} 과 다르다`);
  }
}

export interface Counts {
  dist: number[];
  /** 이웃 목록에서 간선 하나를 읽고 완화를 시도한 횟수. */
  checks: number;
  /** 큐에 항목을 넣은 횟수. 시작 항목 하나를 포함한다. */
  pushes: number;
  /** 큐에서 항목을 꺼낸 횟수. */
  pops: number;
  /** 꺼낸 항목이 뒤처진 기록이라 그대로 버린 횟수. */
  stale: number;
  /** 다음에 꺼낼 항목을 고르느라 키를 비교한 횟수. */
  compares: number;
}

export type Order = "fifo" | "lifo" | "number" | "minkey";

/**
 * 꺼내는 순서만 갈아 끼울 수 있는 사본. 넷 다 **같은 완화 규칙**을 쓴다 — 더 짧은 길을
 * 찾으면 고쳐 적고 다시 넣는다. 그래서 넷 다 답은 같고 **완화 시도 수만** 갈린다.
 */
export function orderCounts(
  n: number,
  edges: Edge[],
  src: number,
  order: Order,
): Counts {
  const adj = adjacency(n, edges);
  const dist = Array.from({ length: n }, () => Number.POSITIVE_INFINITY);
  dist[src] = 0;
  const bag: [number, number][] = [[src, 0]];
  let checks = 0;
  let pushes = 1;
  let pops = 0;
  let stale = 0;

  while (bag.length > 0) {
    let at = 0;
    if (order === "lifo") at = bag.length - 1;
    else if (order === "number" || order === "minkey") {
      for (let i = 1; i < bag.length; i++) {
        const a = bag[i] as [number, number];
        const b = bag[at] as [number, number];
        const better = order === "number" ? a[0] < b[0] : a[1] < b[1];
        if (better) at = i;
      }
    }
    const [u, d] = bag.splice(at, 1)[0] as [number, number];
    pops++;
    if (d > (dist[u] as number)) {
      stale++;
      continue;
    }
    for (const [v, w] of adj[u] as [number, number][]) {
      checks++;
      const nd = d + w;
      if (nd < (dist[v] as number)) {
        dist[v] = nd;
        bag.push([v, nd]);
        pushes++;
      }
    }
  }
  checked(n, edges, src, dist);
  return { dist, checks, pushes, pops, stale, compares: 0 };
}

/** 라운드 방식이 간선 하나를 읽고 한 일. */
export interface RoundRead {
  round: number;
  edge: Edge;
  du: number;
  before: number;
  changed: boolean;
}

/**
 * 가장 단순한 두 번째 후보 — **간선 목록 전체를 라운드마다 다시 읽는다.** 한 라운드가 아무
 * 것도 못 고치면 끝난다. 꺼내는 순서라는 개념 자체가 없는 방식이다.
 */
export function roundCounts(
  n: number,
  edges: Edge[],
  src: number,
): { dist: number[]; checks: number; rounds: number; reads: RoundRead[] } {
  const dist = Array.from({ length: n }, () => Number.POSITIVE_INFINITY);
  dist[src] = 0;
  let checks = 0;
  let rounds = 0;
  const reads: RoundRead[] = [];
  for (;;) {
    rounds++;
    let changed = false;
    for (const e of edges) {
      const [u, v, w] = e;
      checks++;
      const du = dist[u] as number;
      const before = dist[v] as number;
      let did = false;
      if (du !== Number.POSITIVE_INFINITY && du + w < before) {
        dist[v] = du + w;
        changed = true;
        did = true;
      }
      if (n <= 16) {
        reads.push({ round: rounds, edge: e, du, before, changed: did });
      }
    }
    if (!changed) break;
  }
  checked(n, edges, src, dist);
  return { dist, checks, rounds, reads };
}

/**
 * 담는 자리를 갈아 끼운 사본. 꺼내는 순서는 **키가 가장 작은 것 먼저**로 고정하고, 그것을
 * 배열 선형 탐색과 이진 힙 두 방법으로 고른다. 여기서 세는 것은 **고르느라 비교한 횟수**다.
 */
export function containerCounts(
  n: number,
  edges: Edge[],
  src: number,
  kind: "scan" | "heap",
): Counts {
  const adj = adjacency(n, edges);
  const dist = Array.from({ length: n }, () => Number.POSITIVE_INFINITY);
  dist[src] = 0;
  let checks = 0;
  let pushes = 1;
  let pops = 0;
  let stale = 0;
  let compares = 0;

  const heap: [number, number][] = [[src, 0]];
  const key = (i: number): number => (heap[i] as [number, number])[1];
  const swap = (a: number, b: number): void => {
    const t = heap[a] as [number, number];
    heap[a] = heap[b] as [number, number];
    heap[b] = t;
  };
  const push = (node: number, k: number): void => {
    heap.push([node, k]);
    if (kind === "scan") return;
    let i = heap.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      compares++;
      if (key(i) >= key(parent)) break;
      swap(i, parent);
      i = parent;
    }
  };
  const take = (): [number, number] => {
    if (kind === "scan") {
      let at = 0;
      for (let i = 1; i < heap.length; i++) {
        compares++;
        if (key(i) < key(at)) at = i;
      }
      return heap.splice(at, 1)[0] as [number, number];
    }
    const top = heap[0] as [number, number];
    const last = heap.pop() as [number, number];
    if (heap.length > 0) {
      heap[0] = last;
      let i = 0;
      for (;;) {
        const left = 2 * i + 1;
        const right = 2 * i + 2;
        let small = i;
        if (left < heap.length) {
          compares++;
          if (key(left) < key(small)) small = left;
        }
        if (right < heap.length) {
          compares++;
          if (key(right) < key(small)) small = right;
        }
        if (small === i) break;
        swap(i, small);
        i = small;
      }
    }
    return top;
  };

  while (heap.length > 0) {
    const [u, d] = take();
    pops++;
    if (d > (dist[u] as number)) {
      stale++;
      continue;
    }
    for (const [v, w] of adj[u] as [number, number][]) {
      checks++;
      const nd = d + w;
      if (nd < (dist[v] as number)) {
        dist[v] = nd;
        push(v, nd);
        pushes++;
      }
    }
  }
  checked(n, edges, src, dist);
  return { dist, checks, pushes, pops, stale, compares };
}

/** 사본이 꺼낸 항목 하나와 그것을 처리했는가. */
export interface Pop {
  item: [number, number];
  settled: boolean;
}

/**
 * **줄 하나를 더한 변이** — 이미 큐에 들어 있는 정점은 다시 넣지 않는다. 삭제·치환이 아니라
 * 추가라서 `loadMutant` 로 만들 수 없고, 그래서 여기 손으로 적었다. 다른 줄은 정본과 같다.
 */
export function noDuplicatePush(
  n: number,
  edges: Edge[],
  src: number,
): { dist: number[]; pops: Pop[] } {
  const adj = adjacency(n, edges);
  const dist = Array.from({ length: n }, () => Number.POSITIVE_INFINITY);
  dist[src] = 0;
  const inBag = Array.from({ length: n }, () => false);
  inBag[src] = true;
  const bag: [number, number][] = [[src, 0]];
  const pops: Pop[] = [];
  while (bag.length > 0) {
    let at = 0;
    for (let i = 1; i < bag.length; i++) {
      if ((bag[i] as [number, number])[1] < (bag[at] as [number, number])[1]) {
        at = i;
      }
    }
    const [u, d] = bag.splice(at, 1)[0] as [number, number];
    inBag[u] = false;
    const stale = d > (dist[u] as number);
    pops.push({ item: [u, d], settled: !stale });
    if (stale) continue;
    for (const [v, w] of adj[u] as [number, number][]) {
      const nd = d + w;
      if (nd < (dist[v] as number)) {
        dist[v] = nd;
        if (inBag[v] === true) continue; // ← 더한 줄. 이미 큐에 있으면 안 넣는다
        inBag[v] = true;
        bag.push([v, nd]);
      }
    }
  }
  return { dist, pops };
}

/**
 * 꺼낸 정점을 방문 표시하고 두 번 다시 처리하지 않는 사본. 뒤처진 기록을 키로 거르는 대신
 * 배열 하나로 막는다. 다른 줄은 정본과 같다 — 줄을 더한 변이라 `loadMutant` 로는 못 만든다.
 */
export function visitedOnce(
  n: number,
  edges: Edge[],
  src: number,
): { dist: number[]; pops: Pop[] } {
  const adj = adjacency(n, edges);
  const dist = Array.from({ length: n }, () => Number.POSITIVE_INFINITY);
  dist[src] = 0;
  const seen = Array.from({ length: n }, () => false);
  const bag: [number, number][] = [[src, 0]];
  const pops: Pop[] = [];
  while (bag.length > 0) {
    let at = 0;
    for (let i = 1; i < bag.length; i++) {
      if ((bag[i] as [number, number])[1] < (bag[at] as [number, number])[1]) {
        at = i;
      }
    }
    const [u, d] = bag.splice(at, 1)[0] as [number, number];
    const skip = seen[u] === true;
    pops.push({ item: [u, d], settled: !skip });
    if (skip) continue; // ← 갈아 낀 줄. 키가 아니라 표시로 거른다
    seen[u] = true;
    for (const [v, w] of adj[u] as [number, number][]) {
      const nd = d + w;
      if (nd < (dist[v] as number)) {
        dist[v] = nd;
        bag.push([v, nd]);
      }
    }
  }
  return { dist, pops };
}

/**
 * 너비 우선 탐색처럼 **처음 적은 값으로 굳히는** 사본 — 먼저 넣은 것을 먼저 꺼내고, 이웃의
 * 거리가 아직 없을 때만 「꺼낸 정점의 거리 + 가중치」를 적는다. 한 번 적은 거리는 고치지 않는다.
 */
export function firstWriteWins(
  n: number,
  edges: Edge[],
  src: number,
): number[] {
  const adj = adjacency(n, edges);
  const dist = Array.from({ length: n }, () => Number.POSITIVE_INFINITY);
  dist[src] = 0;
  const queue = [src];
  for (let head = 0; head < queue.length; head++) {
    const u = queue[head] as number;
    for (const [v, w] of adj[u] as [number, number][]) {
      if (dist[v] !== Number.POSITIVE_INFINITY) continue;
      dist[v] = (dist[u] as number) + w;
      queue.push(v);
    }
  }
  return dist;
}

/** 모든 단순 경로를 만들어 최솟값을 고른다. 음수 가중치에서도 정답을 낸다. */
export function bruteForce(n: number, edges: Edge[], src: number): number[] {
  const adj = adjacency(n, edges);
  const best = Array.from({ length: n }, () => Number.POSITIVE_INFINITY);
  const onPath = Array.from({ length: n }, () => false);
  const walk = (u: number, cost: number): void => {
    if (cost < (best[u] as number)) best[u] = cost;
    onPath[u] = true;
    for (const [v, w] of adj[u] as [number, number][]) {
      if (onPath[v] === true) continue;
      walk(v, cost + w);
    }
    onPath[u] = false;
  };
  walk(src, 0);
  return best;
}

/** `src` 에서 `to` 로 가는 단순 경로 전부와 그 비용. */
export function simplePathsTo(
  n: number,
  edges: Edge[],
  src: number,
  to: number,
): { path: number[]; cost: number }[] {
  const adj = adjacency(n, edges);
  const out: { path: number[]; cost: number }[] = [];
  const onPath = Array.from({ length: n }, () => false);
  const stack: number[] = [];
  const walk = (u: number, cost: number): void => {
    stack.push(u);
    onPath[u] = true;
    if (u === to) out.push({ path: stack.slice(), cost });
    else {
      for (const [v, w] of adj[u] as [number, number][]) {
        if (onPath[v] === true) continue;
        walk(v, cost + w);
      }
    }
    onPath[u] = false;
    stack.pop();
  };
  walk(src, 0);
  return out;
}

/** 사이클이 없는 그래프에서 처음부터 끝 정점까지의 경로를 하나씩 세어 본다. */
function countPaths(n: number, edges: Edge[], src: number, to: number): number {
  const adj = adjacency(n, edges);
  let count = 0;
  const walk = (u: number): void => {
    if (u === to) {
      count++;
      return;
    }
    for (const [v] of adj[u] as [number, number][]) walk(v);
  };
  walk(src);
  return count;
}

/* ────────────────────── 걸음마다의 상태 ────────────────────── */

/** 완화 한 번 — 간선 `u → v` 를 읽고 무엇을 했는가. */
export interface Relax {
  u: number;
  v: number;
  w: number;
  /** 그때 꺼낸 키 — 곧 `dist[u]`. */
  d: number;
  /** 읽기 전의 `dist[v]`. */
  before: number;
  nd: number;
  improved: boolean;
}

/** 걸음 하나. `heap` 은 배열에 놓인 순서 그대로다. */
export interface Step {
  t: string;
  kind: "start" | "settle" | "stale" | "end";
  popped: [number, number] | null;
  relax: Relax[];
  /** 이 걸음에 넣은 항목. */
  pushed: [number, number][];
  dist: number[];
  heap: [number, number][];
  /** 정점마다 지금 거리를 낸 간선의 꼬리. 없으면 -1. */
  pred: number[];
  /** 확정한 정점. */
  settled: boolean[];
}

/** 이진 힙 사본 — 정본의 `MinHeap` 과 같은 규칙이다(넣으면 올리고, 꺼내면 뿌리를 덮고 내린다). */
export class HeapCopy {
  items: [number, number][] = [];
  constructor(start: readonly (readonly [number, number])[] = []) {
    this.items = start.map((x) => [x[0], x[1]] as [number, number]);
  }
  private key(i: number): number {
    return (this.items[i] as [number, number])[1];
  }
  private swap(a: number, b: number): void {
    const t = this.items[a] as [number, number];
    this.items[a] = this.items[b] as [number, number];
    this.items[b] = t;
  }
  push(node: number, k: number): void {
    this.items.push([node, k]);
    let i = this.items.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this.key(i) >= this.key(parent)) break;
      this.swap(i, parent);
      i = parent;
    }
  }
  pop(): [number, number] {
    const top = this.items[0] as [number, number];
    const last = this.items.pop() as [number, number];
    if (this.items.length > 0) {
      this.items[0] = last;
      let i = 0;
      for (;;) {
        const left = 2 * i + 1;
        const right = 2 * i + 2;
        let small = i;
        if (left < this.items.length && this.key(left) < this.key(small)) {
          small = left;
        }
        if (right < this.items.length && this.key(right) < this.key(small)) {
          small = right;
        }
        if (small === i) break;
        this.swap(i, small);
        i = small;
      }
    }
    return top;
  }
  snapshot(): [number, number][] {
    return this.items.map((x) => [x[0], x[1]] as [number, number]);
  }
}

/** 지금 큐에 든 항목을 **꺼낼 차례대로** — 힙 사본을 하나 떠서 비울 때까지 꺼낸다. */
export function drainOrder(
  heap: readonly (readonly [number, number])[],
): [number, number][] {
  const copy = new HeapCopy(heap);
  const out: [number, number][] = [];
  while (copy.items.length > 0) out.push(copy.pop());
  return out;
}

/**
 * 정본과 같은 절차에 **힙 내부를 내다보는 자리**만 덧붙인 사본. 본문의 걸음 표와 걸음 재생
 * 패널이 둘 다 이 함수의 출력에서 나온다 — 두 곳을 손으로 맞추면 그 자리에서 어긋난다.
 */
export function record(n: number, edges: Edge[], src: number): Step[] {
  const adj = adjacency(n, edges);
  const dist = Array.from({ length: n }, () => Number.POSITIVE_INFINITY);
  const pred = Array.from({ length: n }, () => -1);
  const settled = Array.from({ length: n }, () => false);
  dist[src] = 0;
  const heap = new HeapCopy();
  heap.push(src, 0);
  const snap = (
    t: string,
    kind: Step["kind"],
    popped: [number, number] | null,
    relax: Relax[],
    pushed: [number, number][],
  ): Step => ({
    t,
    kind,
    popped,
    relax,
    pushed,
    dist: dist.slice(),
    heap: kind === "end" ? [] : heap.snapshot(),
    pred: pred.slice(),
    settled: settled.slice(),
  });
  const steps: Step[] = [snap("T1", "start", null, [], [[src, 0]])];
  while (heap.items.length > 0) {
    const [u, d] = heap.pop();
    const t = `T${steps.length + 1}`;
    if (d > (dist[u] as number)) {
      steps.push(snap(t, "stale", [u, d], [], []));
      continue;
    }
    settled[u] = true;
    const relax: Relax[] = [];
    const pushed: [number, number][] = [];
    for (const [v, w] of adj[u] as [number, number][]) {
      const nd = d + w;
      const before = dist[v] as number;
      const improved = nd < before;
      relax.push({ u, v, w, d, before, nd, improved });
      if (improved) {
        dist[v] = nd;
        pred[v] = u;
        heap.push(v, nd);
        pushed.push([v, nd]);
      }
    }
    steps.push(snap(t, "settle", [u, d], relax, pushed));
  }
  steps.push(snap(`T${steps.length + 1}`, "end", null, [], []));
  checked(n, edges, src, dist);
  return steps;
}

/** 전개 입력의 걸음 전부. */
export const WALK = record(WALK_N, WALK_EDGES, WALK_SRC);

/** 걸음 이름을 이어 적는다 — `T5 · T7`. */
const tList = (ts: string[]): string => ts.join(" · ");

/** 뒤처진 기록인가 — 키가 그 걸음이 끝난 뒤 적힌 거리보다 크다. */
export const isStale = (s: Step, [v, k]: readonly [number, number]): boolean =>
  k > (s.dist[v] as number);

/** `pred` 를 따라 `src` 까지 거슬러 올라간 경로. */
export function pathOf(pred: readonly number[], v: number): number[] {
  const out = [v];
  let at = v;
  while ((pred[at] as number) !== -1) {
    at = pred[at] as number;
    out.unshift(at);
  }
  return out;
}

const arrow = (p: readonly number[]): string => p.join("→");

/** 경로의 비용 — 같은 두 정점 사이 간선이 여럿이면 가장 가벼운 것을 쓴다. */
const costOf = (p: readonly number[], edges: Edge[]): number => {
  let c = 0;
  for (let i = 0; i + 1 < p.length; i++) {
    const a = p[i] as number;
    const b = p[i + 1] as number;
    const ws = edges.filter(([x, y]) => x === a && y === b).map(([, , w]) => w);
    c += Math.min(...ws);
  }
  return c;
};

/* ────────────────────────── 변이 ────────────────────────── */

const REF = new URL("./dijkstra-guide.ref.ts", import.meta.url).pathname;

interface Impl {
  dijkstra(n: number, edges: Edge[], src: number): number[];
}

/**
 * **불변식을 지키던 줄** 하나를 바꾼 사본 — 지나온 비용을 더하지 않고 마지막 간선의
 * 가중치만 적는다. 정본 소스에서 기계로 만든다(맞는 줄이 하나가 아니면 `loadMutant` 가 던진다).
 */
const lastEdgeOnly = await loadMutant<Impl>(REF, {
  swap: [/const nd = d \+ w;/, "const nd = w;"],
});

/** 뒤처진 기록을 걸러 내는 줄을 통째로 뺀 사본. 답이 갈리는지를 실행이 판정한다. */
const noStaleCheck = await loadMutant<Impl>(REF, {
  drop: /if \(d > \(dist\[u\] as number\)\) continue;/,
});

/** 중화 실행인가 — 변이 모듈의 함수가 정본과 같은 객체면 변이를 적용하지 않은 것이다. */
const 중화됨 = lastEdgeOnly.dijkstra === dijkstra;

const MUTANT_CASES: { label: string; n: number; edges: Edge[] }[] = [
  { label: "전개 입력", n: WALK_N, edges: WALK_EDGES },
  {
    label: "삼각형 0->1->2, 0->2",
    n: 3,
    edges: [
      [0, 1, 2],
      [1, 2, 3],
      [0, 2, 9],
    ],
  },
  {
    label: "사슬 0->1->2->3 (가중치 2)",
    n: 4,
    edges: [
      [0, 1, 2],
      [1, 2, 2],
      [2, 3, 2],
    ],
  },
];

if (!중화됨) {
  // 하나도 안 갈리면 불변식 절의 주장이 성립하지 않는다. 실행이 그것을 판정한다.
  if (
    MUTANT_CASES.every(
      (c) =>
        show(dijkstra(c.n, c.edges, 0)) ===
        show(lastEdgeOnly.dijkstra(c.n, c.edges, 0)),
    )
  ) {
    throw new Error(
      "변이가 어느 입력에서도 결과를 바꾸지 못했다 — 「거리가 틀린다」가 거짓이다",
    );
  }
}

/** 가중치에 음수가 하나 들어간 입력 — 이 알고리즘이 기대는 전제 밖이다. */
const NEGATIVE: { label: string; n: number; edges: Edge[] }[] = [
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

/* ────────────────────────── 수치 ────────────────────────── */

/** 힙 방식의 상한이 배열 방식의 `V제곱` 이상이 되는 첫 간선 수. */
function flipEdges(v: number): number {
  const target = v * v;
  let lo = 1;
  let hi = v * (v - 1);
  const cost = (e: number): number => 4 * (e + 1) * Math.ceil(Math.log2(e + 1));
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (cost(mid) >= target) hi = mid;
    else lo = mid + 1;
  }
  return lo;
}

const SHORTCUT = shortcut(64);
const SPARSE_SMALL = sparse(64);

const ORDER_LABEL: Record<Order, string> = {
  number: "번호가 가장 작은 것 먼저",
  fifo: "먼저 넣은 것 먼저",
  lifo: "나중에 넣은 것 먼저",
  minkey: "키가 가장 작은 것 먼저",
};

const V_LIMIT = 100_000;
const E_LIMIT = 200_000;
const W_LIMIT = 1_000_000_000;

/** 단순 연산을 1 초에 1 억 번 한다고 칠 때의 초. */
const sec = (ops: number): string => `${comma(Math.round(ops / 1e8))} 초`;

/** 다이아몬드 사슬을 규모 안에서 가장 길게 — 정점이 `V_LIMIT` 을 넘지 않는 가장 큰 `k`. */
const BIG_K = Math.floor((V_LIMIT - 1) / 3);

/** `2^k` 의 자릿수. */
const pow2Digits = (k: number): number => Math.floor(k * Math.log10(2)) + 1;

/** 「아이디어를 떠올리는 과정」의 사다리와 본문이 함께 쓰는 수. */
export function originNumbers() {
  const rc = reversedChain(V_LIMIT);
  const reads = V_LIMIT * rc.edges.length;
  const fifoShort = orderCounts(SHORTCUT.n, SHORTCUT.edges, 0, "fifo");
  return {
    bigV: V_LIMIT,
    bigK: BIG_K,
    bigKV: 3 * BIG_K + 1,
    bigKE: 4 * BIG_K,
    pathDigits: pow2Digits(BIG_K),
    roundReads: reads,
    roundSec: sec(reads),
    roundE: rc.edges.length,
    fifoChecks: fifoShort.checks,
    shortcutE: SHORTCUT.edges.length,
  };
}

/* ────────────────────────── 블록 ────────────────────────── */

/** concept — 정점 1 · 4 로 가는 단순 경로 전부와 비용. */
function conceptPaths(): string {
  const want = dijkstra(WALK_N, WALK_EDGES, WALK_SRC);
  const rows: string[][] = [];
  for (const to of [1, 4]) {
    for (const p of simplePathsTo(WALK_N, WALK_EDGES, WALK_SRC, to)) {
      rows.push([
        String(to),
        arrow(p.path),
        String(p.path.length - 1),
        comma(p.cost),
        p.cost === want[to] ? "가장 작다" : "",
      ]);
    }
  }
  const one = simplePathsTo(WALK_N, WALK_EDGES, WALK_SRC, 1);
  const direct = one.find((p) => p.path.length === 2) as { cost: number };
  return [
    md(["도착 정점", "경로", "간선 수", "비용", "비용이"], rows, [2, 3]),
    "",
    `정점 1 까지는 간선 하나짜리 경로의 비용이 ${direct.cost} 이고 가장 작은 비용은 ${want[1]} 입니다. 정본이 낸 거리는 dist[1] = ${want[1]} · dist[4] = ${want[4]} 입니다.`,
  ].join("\n");
}

/** deep.origin ② — 아무 기법 없이 푸는 두 방법이 규모에 따라 몇 번을 세는가. */
function naiveScale(): string {
  const rows: string[][] = [];
  for (const k of [2, 4, 8, 12]) {
    const g = diamonds(k);
    const got = countPaths(g.n, g.edges, 0, g.n - 1);
    if (got !== 2 ** k) throw new Error(`경로 수 ${got} 가 2^${k} 가 아니다`);
    rows.push([
      "다이아몬드 사슬",
      comma(g.n),
      comma(g.edges.length),
      `끝 정점까지의 경로 ${comma(got)} 개`,
      "실행",
    ]);
  }
  for (const v of [10, 100, 1000]) {
    const g = reversedChain(v);
    const r = roundCounts(g.n, g.edges, 0);
    if (r.rounds !== v || r.checks !== v * g.edges.length) {
      throw new Error(`라운드 ${r.rounds} · 읽기 ${r.checks} 가 식과 다르다`);
    }
    rows.push([
      "거꾸로 놓은 사슬",
      comma(v),
      comma(g.edges.length),
      `라운드 ${comma(r.rounds)} 번 · 간선 읽기 ${comma(r.checks)} 번`,
      "실행",
    ]);
  }
  const o = originNumbers();
  rows.push([
    "다이아몬드 사슬",
    comma(o.bigKV),
    comma(o.bigKE),
    `끝 정점까지의 경로 2^${comma(o.bigK)} 개 — ${comma(o.pathDigits)} 자리 수`,
    "식",
  ]);
  rows.push([
    "거꾸로 놓은 사슬",
    comma(o.bigV),
    comma(o.roundE),
    `라운드 ${comma(o.bigV)} 번 · 간선 읽기 ${comma(o.roundReads)} 번`,
    "식",
  ]);
  return [
    md(["입력", "정점 V", "간선 E", "센 값", "센 방법"], rows, [1, 2]),
    "",
    `실행한 줄은 경로 수가 모두 2^k(k 는 다이아몬드 수), 간선 읽기가 모두 V × E 와 일치했고, 마지막 두 줄은 그 식으로 낸 값입니다. 간선 읽기 ${comma(o.roundReads)} 번은 1 초에 1 억 번 기준 ${o.roundSec}입니다.`,
  ].join("\n");
}

/** deep.origin ③ — 전개 입력을 라운드 방식으로 처리하면 간선마다 무엇을 했는가. */
function roundTrace(): string {
  const r = roundCounts(WALK_N, WALK_EDGES, WALK_SRC);
  const rows = r.reads.map((x) => {
    const [u, v, w] = x.edge;
    const calc =
      x.du === Number.POSITIVE_INFINITY
        ? `dist[${u}] 가 아직 Infinity`
        : `${num(x.du)} + ${w} = ${num(x.du + w)}`;
    return [
      String(x.round),
      `${u}→${v}`,
      calc,
      num(x.before),
      x.changed ? `dist[${v}] = ${num(x.du + w)}` : "그대로",
    ];
  });
  const last = r.reads.filter((x) => x.round === r.rounds);
  return [
    md(["라운드", "간선 u→v", "dist[u] + w", "그때 dist[v]", "한 일"], rows),
    "",
    `라운드 ${r.rounds} 번 동안 간선을 ${r.checks} 번 읽었고, 마지막 라운드는 ${last.length} 번 읽어 ${last.filter((x) => x.changed).length} 번 고쳤습니다.`,
  ].join("\n");
}

/** deep.origin ④ — 같은 그래프를 두 방식으로 처리하고 실제 계수를 나란히 적는다. */
function roundVsOrder(): string {
  const r = roundCounts(WALK_N, WALK_EDGES, WALK_SRC);
  const rev = roundCounts(WALK_N, [...WALK_EDGES].reverse(), WALK_SRC);
  const o = orderCounts(WALK_N, WALK_EDGES, WALK_SRC, "minkey");
  return [
    md(
      ["방식", "완화 시도", "되풀이한 단위", "결과 dist"],
      [
        [
          "간선 목록을 라운드마다 다시 읽는다",
          comma(r.checks),
          `라운드 ${r.rounds} 번`,
          show(r.dist),
        ],
        [
          "같은 방식, 간선 순서를 거꾸로",
          comma(rev.checks),
          `라운드 ${rev.rounds} 번`,
          show(rev.dist),
        ],
        [
          "정점을 한 번씩 확정하며 그 정점의 간선만 읽는다",
          comma(o.checks),
          `꺼낸 항목 ${o.pops} 개`,
          show(o.dist),
        ],
      ],
      [1],
    ),
    "",
    `세 결과가 모두 일치하고, 완화 시도는 ${r.checks} · ${rev.checks} · ${o.checks} 번입니다. 간선은 ${WALK_EDGES.length} 개입니다.`,
  ].join("\n");
}

/** deep.origin ⑤ — 꺼내는 순서 후보 넷을 같은 그래프 셋에 걸어 완화 시도를 잰다. */
function orderCandidates(): string {
  const orders: Order[] = ["number", "fifo", "lifo", "minkey"];
  const graphs = [{ n: WALK_N, edges: WALK_EDGES }, SHORTCUT, SPARSE_SMALL];
  const rows = orders.map((o) => {
    const c = graphs.map((g) => orderCounts(g.n, g.edges, 0, o).checks);
    const equal = c.every((x, i) => x === graphs[i]?.edges.length);
    return [
      ORDER_LABEL[o],
      ...c.map(comma),
      equal ? "셋 다 E 와 같음" : "E 보다 큰 곳이 있음",
    ];
  });
  return [
    md(
      ["꺼내는 순서", "전개 입력", "지름길 64", "성긴 64", "간선 수 E 와"],
      [...rows, ["간선 수 E", ...graphs.map((g) => comma(g.edges.length)), ""]],
      [1, 2, 3],
    ),
    "",
    "네 순서 모두 세 그래프에서 정본과 같은 답을 냈습니다. 완화 시도가 세 그래프 모두에서 간선 수와 같은 순서는 「키가 가장 작은 것 먼저」 하나입니다.",
  ].join("\n");
}

/** deep.build 개념 — 전개에서 일어난 완화 전부. */
function relaxAll(): string {
  const rows: string[][] = [];
  let first = 0;
  let fixed = 0;
  let kept = 0;
  for (const s of WALK) {
    for (const r of s.relax) {
      const what = !r.improved
        ? "그대로 둔다"
        : r.before === Number.POSITIVE_INFINITY
          ? "처음 적는다"
          : "더 작게 고친다";
      if (what === "처음 적는다") first++;
      else if (what === "더 작게 고친다") fixed++;
      else kept++;
      rows.push([
        s.t,
        `${r.u}→${r.v}`,
        `${num(r.d)} + ${r.w} = ${num(r.nd)}`,
        num(r.before),
        what,
        num(Math.min(r.before, r.nd)),
      ]);
    }
  }
  return [
    md(
      [
        "걸음",
        "간선 u→v",
        "dist[u] + w",
        "그때 dist[v]",
        "한 일",
        "남은 dist[v]",
      ],
      rows,
    ),
    "",
    `완화 ${rows.length} 번 가운데 처음 적은 것이 ${first} 번, 더 작게 고친 것이 ${fixed} 번, 그대로 둔 것이 ${kept} 번입니다.`,
  ].join("\n");
}

/** deep.build 개념 — 완화 하나를 읽는 법. */
function relaxOne(): string {
  const s = WALK.find((x) =>
    x.relax.some((r) => r.improved && r.before !== Number.POSITIVE_INFINITY),
  ) as Step;
  const r = s.relax.find(
    (x) => x.improved && x.before !== Number.POSITIVE_INFINITY,
  ) as Relax;
  const keep = num(Math.min(r.before, r.nd));
  return [
    md(
      ["항", "보는 것", "값"],
      [
        ["꼬리의 거리", `dist[${r.u}]`, num(r.d)],
        ["간선의 가중치", `w(${r.u}→${r.v})`, String(r.w)],
        ["간선을 이은 후보", `dist[${r.u}] + w`, num(r.nd)],
        ["머리에 적혀 있던 값", `dist[${r.v}]`, num(r.before)],
        ["남는 값", `min(${num(r.before)}, ${num(r.nd)})`, keep],
      ],
      [2],
    ),
    "",
    `${s.t} 의 간선 ${r.u}→${r.v} 입니다. 후보 ${num(r.nd)}${이가(num(r.nd))} 적혀 있던 ${num(r.before)} 보다 작아서 dist[${r.v}] 의 값을 ${keep}${으로(keep)} 고칩니다.`,
  ].join("\n");
}

/** deep.build 개념 — 정점마다 적힌 값의 차례와 그 값을 낸 경로. */
function relaxHistory(): string {
  const hist: { v: number; value: number; path: number[] }[] = [];
  let pred = Array.from({ length: WALK_N }, () => -1);
  for (const s of WALK) {
    for (const r of s.relax) {
      if (!r.improved) continue;
      pred = pred.slice();
      pred[r.v] = r.u;
      hist.push({ v: r.v, value: r.nd, path: pathOf(pred, r.v) });
    }
  }
  let bad = 0;
  let rises = 0;
  const rows: string[][] = [];
  for (let v = 0; v < WALK_N; v++) {
    if (v === WALK_SRC) continue;
    const mine = hist.filter((h) => h.v === v);
    for (const [i, h] of mine.entries()) {
      if (costOf(h.path, WALK_EDGES) !== h.value) bad++;
      if (i > 0 && h.value >= (mine[i - 1] as { value: number }).value) {
        rises++;
      }
    }
    rows.push([
      String(v),
      ["Infinity", ...mine.map((h) => num(h.value))].join(" → "),
      mine.length === 0
        ? "없음"
        : mine.map((h) => `${num(h.value)} = ${arrow(h.path)}`).join(" · "),
    ]);
  }
  return [
    md(["정점", "적힌 값의 차례", "경로와 그 비용"], rows),
    "",
    `적힌 값 ${hist.length} 개 가운데 그 경로의 비용과 다른 값은 ${bad} 개이고, 앞에 적힌 값보다 작지 않은 값이 뒤에 적힌 경우는 ${rises} 번입니다.`,
  ].join("\n");
}

/** deep.build 개념 — 너비 우선 탐색처럼 처음 적은 값으로 굳히면. */
function firstWrite(): string {
  const good = dijkstra(WALK_N, WALK_EDGES, WALK_SRC);
  const bad = firstWriteWins(WALK_N, WALK_EDGES, WALK_SRC);
  const rows = good.map((g, v) => [
    String(v),
    num(bad[v] as number),
    num(g),
    bad[v] === g ? "같다" : "어긋난다",
  ]);
  const off = good.filter((g, v) => bad[v] !== g).length;
  return [
    md(
      ["정점", "처음 적은 값으로 굳힌 답", "완화로 고친 답(정본)", "두 답"],
      rows,
      [1, 2],
    ),
    "",
    `여섯 정점 가운데 두 답이 어긋나는 정점은 ${off} 개입니다.`,
  ].join("\n");
}

/** deep.build 1단계 — 시작값. */
function stageStart(): string {
  const s = WALK[0] as Step;
  const adj = adjacency(WALK_N, WALK_EDGES);
  return [
    md(
      ["정점", "adj — (이웃, 가중치)", "dist"],
      adj.map((l, v) => [
        String(v),
        l.length === 0 ? "없음" : l.map(([x, w]) => `(${x}, ${w})`).join(" "),
        num(s.dist[v] as number),
      ]),
    ),
    "",
    `이웃 목록의 칸은 모두 ${adj.reduce((a, l) => a + l.length, 0)} 개로 간선 수와 같고, 우선순위 큐에는 항목 ${items(s.heap)} 하나가 들어 있습니다.`,
  ].join("\n");
}

/** deep.build 2단계 — 꺼낼 때마다의 판정. */
function stagePop(): string {
  const rows: string[][] = [];
  const keys: number[] = [];
  const settledDist: number[] = [];
  for (const [i, s] of WALK.entries()) {
    if (s.popped === null) continue;
    const [u, d] = s.popped;
    const before = WALK[i - 1] as Step;
    keys.push(d);
    if (s.kind === "settle") settledDist.push(d);
    const rest = drainOrder(before.heap).slice(1);
    rows.push([
      s.t,
      item(s.popped),
      num(before.dist[u] as number),
      s.kind === "settle"
        ? "키 = dist[u] — 확정"
        : "키 > dist[u] — 뒤처진 기록",
      rest.length === 0 ? "없음" : rest.map(([, k]) => String(k)).join(" "),
    ]);
  }
  const final = (WALK.at(-1) as Step).dist;
  let moved = 0;
  for (const s of WALK) {
    if (s.kind !== "settle" || s.popped === null) continue;
    if (final[s.popped[0]] !== s.popped[1]) moved++;
  }
  let falls = 0;
  for (let i = 1; i < keys.length; i++) {
    if ((keys[i] as number) < (keys[i - 1] as number)) falls++;
  }
  return [
    md(
      ["걸음", "꺼낸 항목", "그때 dist[u]", "판정", "꺼낸 뒤 큐에 남은 키"],
      rows,
    ),
    "",
    `꺼낸 키는 차례로 ${keys.join(" ")} 이고 앞보다 작아진 적이 ${falls} 번입니다. 확정한 거리는 차례로 ${settledDist.join(" ")} 이고, 확정한 뒤 거리가 다시 바뀐 정점은 ${moved} 개입니다.`,
  ].join("\n");
}

/** deep.build 3단계 — 걸음마다 넣은 항목과 큐. */
function stageQueue(): string {
  const rows: string[][] = [];
  let maxStale = 0;
  let pushed = 0;
  let popped = 0;
  for (const s of WALK) {
    if (s.kind === "end") continue;
    pushed += s.pushed.length;
    if (s.popped) popped++;
    const order = drainOrder(s.heap);
    const stale = order.filter((x) => isStale(s, x));
    maxStale = Math.max(maxStale, stale.length);
    rows.push([
      s.t,
      s.pushed.length === 0 ? "없음" : s.pushed.map(item).join(" "),
      items(order),
      stale.length === 0 ? "없음" : stale.map(item).join(" "),
    ]);
  }
  const end = WALK.at(-1) as Step;
  const never = end.dist
    .map((d, v) => ({ d, v }))
    .filter((x) => x.d === Number.POSITIVE_INFINITY)
    .map((x) => x.v);
  const settled = end.settled.filter(Boolean).length;
  return [
    md(
      [
        "걸음",
        "넣은 항목",
        "걸음이 끝난 뒤 큐 — 꺼낼 차례",
        "그중 뒤처진 기록",
      ],
      rows,
    ),
    "",
    `넣은 항목은 ${pushed} 개이고 꺼낸 항목도 ${popped} 개라 큐가 비었습니다. 뒤처진 기록은 가장 많을 때 ${maxStale} 개가 함께 있었습니다. 확정한 정점은 ${settled} 개이고, 한 번도 큐에 안 들어간 정점 ${never.join(" · ")} 의 거리는 Infinity 로 남았습니다.`,
  ].join("\n");
}

/** deep.build 전제 — 가중치가 음수이면 확정이 확정이 아니다. */
function premiseNegative(): string {
  const rows = NEGATIVE.map((c) => {
    const steps = record(c.n, c.edges, 0);
    const again: number[] = [];
    const seen = new Set<number>();
    let checks = 0;
    for (const s of steps) {
      if (s.kind !== "settle" || s.popped === null) continue;
      const u = s.popped[0];
      if (seen.has(u) && !again.includes(u)) again.push(u);
      seen.add(u);
      checks += s.relax.length;
    }
    const end = steps.at(-1) as Step;
    return [
      c.label,
      again.length === 0 ? "없음" : again.join(" · "),
      String(checks),
      String(c.edges.length),
      show(end.dist),
      show(bruteForce(c.n, c.edges, 0)),
    ];
  });
  return [
    md(
      [
        "입력",
        "두 번 확정한 정점",
        "완화 시도",
        "간선 수",
        "정본의 답",
        "경로를 전부 만든 답",
      ],
      rows,
      [2, 3],
    ),
    "",
    "두 입력 모두 한 번 확정한 정점을 뒤에서 더 작은 키로 다시 꺼내 확정했고, 완화 시도가 간선 수보다 많습니다.",
  ].join("\n");
}

/** deep.build 설계 선택 — 최소를 고르는 두 방법의 비교 횟수를 규모별로 잰다. */
function heapVsScan(): string {
  const rows = [16, 64, 256, 1024].map((v) => {
    const g = sparse(v);
    const s = containerCounts(g.n, g.edges, 0, "scan");
    const h = containerCounts(g.n, g.edges, 0, "heap");
    if (s.checks !== h.checks || !sameArr(s.dist, h.dist)) {
      throw new Error("두 방법의 완화 시도나 답이 다르다");
    }
    return [
      comma(v),
      comma(g.edges.length),
      comma(s.checks),
      comma(s.compares),
      comma(h.compares),
      `${(s.compares / h.compares).toFixed(1)} 배`,
    ];
  });
  return [
    md(
      ["정점 V", "간선 E", "완화 시도", "배열에서 찾기", "이진 힙", "몇 배"],
      rows,
      [0, 1, 2, 3, 4, 5],
    ),
    "",
    "네 규모 모두 두 방법의 완화 시도와 답이 일치했고, 갈린 것은 고르느라 비교한 횟수뿐입니다.",
  ].join("\n");
}

/** deep.walk 도입 — 고정 입력. */
function walkInput(): string {
  const want = show(dijkstra(WALK_N, WALK_EDGES, WALK_SRC));
  return [
    `const n = ${WALK_N};`,
    "const edges: [number, number, number][] = [",
    `  ${WALK_EDGES.map(([u, v, w]) => `[${u}, ${v}, ${w}]`).join(", ")},`,
    "];",
    `const src = ${WALK_SRC};`,
    `// 이 절이 끝나면 나와야 하는 값: ${want}`,
  ].join("\n");
}

/** deep.walk 1 — T1 이 끝난 시점. */
function walkT1(): string {
  const s = WALK[0] as Step;
  const adj = adjacency(WALK_N, WALK_EDGES);
  const adjText = adj
    .map(
      (l, v) =>
        `${v}:${l.length === 0 ? "[]" : `[${l.map(([x, w]) => `(${x}, ${w})`).join(" ")}]`}`,
    )
    .join("  ");
  return [
    `${s.t}${이가(s.t)} 끝난 시점`,
    ...lines([
      ["dist", show(s.dist)],
      ["adj", adjText],
      ["pq", items(s.heap)],
    ]),
  ].join("\n");
}

/** 짚고 가기 — 큐에 이미 있는 정점을 다시 안 넣으면 어떤 답이 나오는가. */
function pauseNoDuplicate(): string {
  return md(
    ["입력", "정본이 낸 답", "중복을 막은 답", "두 답"],
    MUTANT_CASES.map((c) => {
      const good = show(dijkstra(c.n, c.edges, 0));
      const bad = show(noDuplicatePush(c.n, c.edges, 0).dist);
      return [c.label, good, bad, good === bad ? "같다" : "어긋난다"];
    }),
  );
}

/** 짚고 가기 — 두 판이 꺼낸 항목을 차례로. */
function pauseNoDuplicateWhere(): string {
  const good = WALK.filter((s) => s.popped !== null);
  const bad = noDuplicatePush(WALK_N, WALK_EDGES, WALK_SRC).pops;
  const rows: string[][] = [];
  for (let i = 0; i < Math.max(good.length, bad.length); i++) {
    const g = good[i];
    const b = bad[i];
    rows.push([
      String(i + 1),
      g?.popped
        ? `${item(g.popped)} ${g.kind === "settle" ? "확정" : "버림"}`
        : "—",
      b ? `${item(b.item)} ${b.settled ? "확정" : "버림"}` : "—",
    ]);
  }
  const goodOnes = good.filter(
    (s) => s.kind === "settle" && (s.popped as [number, number])[0] === 1,
  ).length;
  const badOnes = bad.filter((p) => p.settled && p.item[0] === 1).length;
  return [
    md(["꺼낸 차례", "정본", "중복을 막은 판"], rows),
    "",
    `정점 1 을 확정한 횟수는 정본이 ${goodOnes} 번, 중복을 막은 판이 ${badOnes} 번입니다.`,
  ].join("\n");
}

/** deep.walk 2 — 키 넷을 넣고 한 번 꺼낼 때 힙 배열. */
function walkHeap(): string {
  const keys = [4, 3, 6, 1];
  const h = new HeapCopy();
  const out: [string, string][] = [["넣기 전", "[]"]];
  for (const k of keys) {
    h.push(k, k);
    out.push([
      `${k}${을를(String(k))} 넣은 뒤`,
      `[${h.items.map(([, x]) => x).join(", ")}]`,
    ]);
  }
  const top = h.pop();
  out.push([
    "한 번 꺼낸 뒤",
    `[${h.items.map(([, x]) => x).join(", ")}]  꺼낸 키 ${top[1]}`,
  ]);
  let ok = 0;
  for (let i = 1; i < h.items.length; i++) {
    const parent = (i - 1) >> 1;
    const p = (h.items[parent] as [number, number])[1];
    if (p <= (h.items[i] as [number, number])[1]) ok++;
  }
  return [
    `키 ${keys.join(" · ")}${을를(String(keys.at(-1)))} 차례로 넣고 한 번 꺼낸다 — 배열에 놓인 순서 그대로`,
    ...lines(out),
    "",
    `꺼낸 뒤 부모가 자식 이하인 자리 ${ok} / ${h.items.length - 1}`,
  ].join("\n");
}

/** deep.walk 3 — T2 와 T3 만. */
function walkT2T3(): string {
  const out: string[] = [];
  for (const s of WALK.slice(1, 3)) {
    const [u, d] = s.popped as [number, number];
    out.push(`${s.t}  꺼낸 항목 ${item([u, d])}  ${d} = dist[${u}] 이라 확정`);
    const rows: [string, string][] = s.relax.map((r) => [
      `${r.u}→${r.v} 완화`,
      `${num(r.before)} > ${r.d}+${r.w} -> dist[${r.v}] = ${num(r.nd)} · 큐에 ${item([r.v, r.nd])}`,
    ]);
    rows.push(["큐(꺼낼 차례)", items(drainOrder(s.heap))]);
    out.push(...lines(rows, "    "));
  }
  return out.join("\n");
}

/** 짚고 가기 — 뒤처진 기록을 걸러 내는 줄을 빼면 답과 계수가 각각 어떻게 되는가. */
function pauseStaleCheck(): string {
  const graphs: { label: string; n: number; edges: Edge[] }[] = [
    { label: "전개 입력", n: WALK_N, edges: WALK_EDGES },
    { label: "지름길 64", n: SHORTCUT.n, edges: SHORTCUT.edges },
    { label: "성긴 64", n: SPARSE_SMALL.n, edges: SPARSE_SMALL.edges },
  ];
  const rows = graphs.map((g) => {
    const good = show(dijkstra(g.n, g.edges, 0));
    const bad = show(noStaleCheck.dijkstra(g.n, g.edges, 0));
    const kept = orderCounts(g.n, g.edges, 0, "minkey");
    // 줄을 뺀 판의 완화 시도 — 꺼낸 항목마다 이웃을 전부 읽는다.
    const adj = adjacency(g.n, g.edges);
    const dist = Array.from({ length: g.n }, () => Number.POSITIVE_INFINITY);
    dist[0] = 0;
    const bag: [number, number][] = [[0, 0]];
    let checks = 0;
    while (bag.length > 0) {
      let at = 0;
      for (let i = 1; i < bag.length; i++) {
        const a = (bag[i] as [number, number])[1];
        if (a < (bag[at] as [number, number])[1]) at = i;
      }
      const [u, d] = bag.splice(at, 1)[0] as [number, number];
      for (const [v, w] of adj[u] as [number, number][]) {
        checks++;
        const nd = d + w;
        if (nd < (dist[v] as number)) {
          dist[v] = nd;
          bag.push([v, nd]);
        }
      }
    }
    return [
      g.label,
      comma(g.edges.length),
      comma(kept.checks),
      comma(checks),
      good === bad ? "칸마다 같다" : "어긋난다",
    ];
  });
  const adj = adjacency(WALK_N, WALK_EDGES);
  const stale = WALK.filter((s) => s.kind === "stale");
  const extra = stale.reduce(
    (a, s) => a + (adj[(s.popped as [number, number])[0]] as unknown[]).length,
    0,
  );
  return [
    md(
      [
        "입력",
        "간선 E",
        "줄이 있을 때 완화 시도",
        "줄을 뺐을 때 완화 시도",
        "두 답",
      ],
      rows,
      [1, 2, 3],
    ),
    "",
    `전개 입력에서 늘어난 완화 시도 ${extra} 번은 뒤처진 기록을 꺼낸 ${tList(stale.map((s) => s.t))} 에서 그 정점의 이웃을 다시 읽은 수를 더한 것입니다.`,
  ].join("\n");
}

/** deep.walk 4 — 아홉 걸음의 상태값과 조건 판정. */
function walkTrace(): string {
  const rows: string[][] = [];
  const hit: Record<string, string[]> = {
    start: [],
    loopTrue: [],
    loopFalse: [],
    staleTrue: [],
    staleFalse: [],
    fixed: [],
    kept: [],
  };
  for (const [i, s] of WALK.entries()) {
    let cond = "";
    let did = "";
    if (s.kind === "start") {
      cond = `\`dist[${WALK_SRC}] = 0\``;
      did = `① 시작값 · 큐에 ${item([WALK_SRC, 0])}`;
      hit.start?.push(s.t);
    } else if (s.kind === "end") {
      cond = "`pq.size() > 0` 이 **거짓** (0 > 0)";
      did = "② 반복이 끝난다";
      hit.loopFalse?.push(s.t);
    } else {
      const [u, d] = s.popped as [number, number];
      hit.loopTrue?.push(s.t);
      const du = (WALK[i - 1] as Step).dist[u] as number;
      if (s.kind === "stale") {
        cond = `\`${d} > dist[${u}]\` 이 **참** (${d} > ${num(du)})`;
        did = "③ 뒤처진 기록이라 버린다";
        hit.staleTrue?.push(s.t);
      } else {
        cond = `\`${d} > dist[${u}]\` 이 **거짓** (${d} > ${num(du)})`;
        hit.staleFalse?.push(s.t);
        const parts = s.relax.map((r) =>
          r.improved
            ? `${r.u}→${r.v} ${r.nd} < ${num(r.before)} 참 · 고친다`
            : `${r.u}→${r.v} ${r.nd} < ${num(r.before)} 거짓 · 그대로`,
        );
        if (s.relax.some((r) => r.improved)) hit.fixed?.push(s.t);
        if (s.relax.some((r) => !r.improved)) hit.kept?.push(s.t);
        did =
          parts.length === 0 ? "나가는 간선이 없다" : `④ ${parts.join(" / ")}`;
      }
    }
    rows.push([
      s.t,
      s.popped ? item(s.popped) : "—",
      cond,
      did,
      show(s.dist),
      items(drainOrder(s.heap)),
    ]);
  }
  const end = WALK.at(-1) as Step;
  const t = (k: string) => tList(hit[k] ?? []);
  return [
    md(
      ["걸음", "꺼낸 항목", "조건 판정", "한 일", "dist", "큐 — 꺼낼 차례"],
      rows,
    ),
    "",
    `① 은 ${t("start")} 에서 실행됐습니다. ② 는 ${t("loopTrue")} 에서 참이고 ${t("loopFalse")} 에서 거짓, ③ 은 ${t("staleTrue")} 에서 참이고 ${t("staleFalse")} 에서 거짓입니다. ④ 가 값을 고친 걸음은 ${t("fixed")}, 고치지 않은 간선이 나온 걸음은 ${t("kept")} 입니다. 반환값은 ${show(end.dist)} 입니다.`,
  ].join("\n");
}

/** 짚고 가기 — 방문 표시로 갈음하면 가중치 0 이상에서는 답이 같고, 음수가 들어가면 갈린다. */
function pauseVisited(): string {
  const nonNegative: { label: string; n: number; edges: Edge[] }[] = [
    { label: "전개 입력", n: WALK_N, edges: WALK_EDGES },
    ...MUTANT_CASES.slice(1),
    { label: "지름길 64", n: SHORTCUT.n, edges: SHORTCUT.edges },
    { label: "성긴 64", n: SPARSE_SMALL.n, edges: SPARSE_SMALL.edges },
  ];
  return [
    "가중치가 모두 0 이상인 입력입니다.",
    "",
    md(
      ["입력", "정점 V", "정본의 답과 방문 표시로 갈음한 답"],
      nonNegative.map((c) => {
        const good = show(dijkstra(c.n, c.edges, 0));
        const bad = show(visitedOnce(c.n, c.edges, 0).dist);
        return [c.label, comma(c.n), good === bad ? "칸마다 같다" : "어긋난다"];
      }),
      [1],
    ),
    "",
    "가중치에 음수가 하나 들어간 입력입니다.",
    "",
    md(
      ["입력", "정본이 낸 답", "방문 표시로 갈음한 답", "경로를 전부 만든 답"],
      NEGATIVE.map((c) => [
        c.label,
        show(dijkstra(c.n, c.edges, 0)),
        show(visitedOnce(c.n, c.edges, 0).dist),
        show(bruteForce(c.n, c.edges, 0)),
      ]),
    ),
  ].join("\n");
}

/** 짚고 가기 — 음수 입력에서 두 판이 꺼낸 항목을 차례로. */
function pauseVisitedWhere(): string {
  const c = NEGATIVE[0] as { n: number; edges: Edge[] };
  const good = record(c.n, c.edges, 0).filter((s) => s.popped !== null);
  const bad = visitedOnce(c.n, c.edges, 0).pops;
  const rows: string[][] = [];
  for (let i = 0; i < Math.max(good.length, bad.length); i++) {
    const g = good[i];
    const b = bad[i];
    rows.push([
      String(i + 1),
      g?.popped
        ? `${item(g.popped)} ${g.kind === "settle" ? "이웃을 본다" : "버림"}`
        : "—",
      b ? `${item(b.item)} ${b.settled ? "이웃을 본다" : "버림"}` : "—",
    ]);
  }
  return md(["꺼낸 차례", "키로 거르는 판(정본)", "표시로 거르는 판"], rows);
}

/** deep.walk.final — 전체 코드를 여러 입력에. */
function walkResult(): string {
  const calls: [number, Edge[], number][] = [
    [WALK_N, WALK_EDGES, WALK_SRC],
    [
      4,
      [
        [0, 1, 1],
        [1, 2, 1],
        [2, 3, 1],
      ],
      0,
    ],
    [
      3,
      [
        [0, 1, 1],
        [0, 2, 4],
        [1, 2, 2],
      ],
      0,
    ],
    [3, [], 1],
    [1, [], 0],
  ];
  const rows: [string, string][] = calls.map(([n, e, s]) => [
    `dijkstra(${n}, [${e.map((x) => `[${x.join(",")}]`).join(",")}], ${s})`,
    `-> ${show(dijkstra(n, e, s))}`,
  ]);
  return lines(rows, "").join("\n");
}

/** related — 정점 4 까지의 최단 경로의 앞부분. */
function relatedPrefix(): string {
  const end = WALK.at(-1) as Step;
  const path = pathOf(end.pred, 4);
  const rows: string[][] = [];
  let same = 0;
  for (let i = path.length; i >= 2; i--) {
    const p = path.slice(0, i);
    const last = p.at(-1) as number;
    const c = costOf(p, WALK_EDGES);
    if (c === end.dist[last]) same++;
    rows.push([
      String(last),
      arrow(p),
      comma(c),
      num(end.dist[last] as number),
    ]);
  }
  return [
    md(
      ["앞부분의 끝 정점", "앞부분", "앞부분의 비용", "그 정점의 dist"],
      rows,
      [2, 3],
    ),
    "",
    `앞부분 ${rows.length} 개 가운데 비용이 그 끝 정점의 dist 와 일치하는 것은 ${same} 개입니다.`,
  ].join("\n");
}

const BENCH = benchJson as Record<string, number>;
const bench = (key: string): number => {
  const v = BENCH[key];
  if (v === undefined) throw new Error(`bench 에 ${key} 가 없다`);
  return v;
};

/** purpose.alt — `bench-alt` 가 낸 계수로 두 설계를 나란히. */
function altTable(): string {
  const flip = bench("경계 · 순서가 뒤집히는 출발점 수");
  const rows = [1, flip - 1, flip, 200].map((q) => {
    const a = bench(`이 가이드의 절차 · 출발점 ${q} 개 · 기본 연산`);
    const f = bench(`플로이드-워셜 · 출발점 ${q} 개 · 기본 연산`);
    return [
      `${q} 개`,
      comma(a),
      comma(f),
      a < f ? "이 가이드의 절차" : "플로이드-워셜",
      `${(Math.max(a, f) / Math.min(a, f)).toFixed(3)} 배`,
    ];
  });
  return [
    md(
      ["출발점 수", "이 가이드의 절차", "플로이드-워셜", "적은 쪽", "차이"],
      rows,
      [1, 2, 4],
    ),
    "",
    `저장 칸은 이 가이드의 절차가 ${comma(bench("이 가이드의 절차 · 저장 칸"))} 개, 플로이드-워셜이 ${comma(bench("플로이드-워셜 · 저장 칸"))} 개입니다. 전개 입력에서는 기본 연산이 ${bench("이 가이드의 절차 · 전개 입력 · 기본 연산")} 번 대 ${bench("플로이드-워셜 · 전개 입력 · 기본 연산")} 번입니다.`,
  ].join("\n");
}

/** purpose.alt — 경계가 그 자리인 까닭. */
function altBoundary(): string {
  const flip = bench("경계 · 순서가 뒤집히는 출발점 수");
  const all = bench("이 가이드의 절차 · 출발점 200 개 · 기본 연산");
  const perSource = Math.round(all / 200);
  const f1 = bench("플로이드-워셜 · 출발점 1 개 · 기본 연산");
  const f200 = bench("플로이드-워셜 · 출발점 200 개 · 기본 연산");
  const perRow = Math.round((f200 - f1) / 199);
  const fixed = f1 - perRow;
  const gap = perSource - perRow;
  const ratio = fixed / gap;
  if (Math.ceil(ratio) !== flip) {
    throw new Error(
      `식이 낸 경계 ${Math.ceil(ratio)} 가 실측 ${flip} 와 다르다`,
    );
  }
  return [
    ...lines(
      [
        [
          "출발점 하나를 더할 때 이 절차",
          `${comma(perSource)} 언저리 — 출발점 200 개의 ${comma(all)} 을 200 으로 나눈 값`,
        ],
        [
          "출발점 하나를 더할 때 표 방식",
          `${comma(perRow)} — 표의 한 줄을 읽는다`,
        ],
        [
          "표 방식이 처음 한 번 내는 연산",
          `${comma(fixed)} — 표 세우기와 간선 넣기`,
        ],
        [
          "처음 낸 연산 / 두 증가분의 차",
          `${comma(fixed)} / ${comma(gap)} = ${ratio.toFixed(1)}`,
        ],
      ],
      "",
    ),
    "",
    `그다음 정수 ${Math.ceil(ratio)} 가 실측한 경계 ${flip} 와 일치한다`,
  ].join("\n");
}

/** deep.math ② — 정의를 전개 입력에 넣어 본다. */
function mathPaths(): string {
  const rows: [string, string][] = [];
  for (const to of [1, 4, 5]) {
    const ps = simplePathsTo(WALK_N, WALK_EDGES, WALK_SRC, to);
    if (ps.length === 0) {
      rows.push([`P(${to})`, "원소가 하나도 없다 — 공집합"]);
      rows.push([`opt(${to})`, "공집합의 최솟값 = Infinity"]);
      continue;
    }
    const costs = ps.map((p) => p.cost);
    rows.push([
      `P(${to})`,
      ps.map((p) => `${arrow(p.path)} (cost ${p.cost})`).join(" · "),
    ]);
    rows.push([
      `opt(${to})`,
      `min{${costs.join(", ")}} = ${Math.min(...costs)}`,
    ]);
  }
  return lines(rows, "").join("\n");
}

/** deep.math ② — 정의를 전개 입력 전체에 넣어 검산한다. */
function mathCheck(): string {
  const dist = dijkstra(WALK_N, WALK_EDGES, WALK_SRC);
  const brute = bruteForce(WALK_N, WALK_EDGES, WALK_SRC);
  return md(
    ["정점 v", "경로를 전부 만들어 고른 최솟값", "이 절차의 dist[v]", "두 값"],
    Array.from({ length: WALK_N }, (_, v) => [
      String(v),
      num(brute[v] as number),
      num(dist[v] as number),
      brute[v] === dist[v] ? "같다" : "어긋난다",
    ]),
    [1, 2],
  );
}

/** deep.math ④ — 닫힌 형태에 규모를 넣어 수치를 낸다. */
function mathScale(): string {
  const rows = [16, 64, 256, 1024].map((v) => {
    const g = sparse(v);
    const h = containerCounts(g.n, g.edges, 0, "heap");
    const bound =
      4 * (g.edges.length + 1) * Math.ceil(Math.log2(g.edges.length + 1));
    return [
      comma(v),
      comma(g.edges.length),
      comma(h.pushes + h.pops),
      comma(h.compares),
      comma(bound),
    ];
  });
  const e = E_LIMIT;
  const lg = Math.ceil(Math.log2(e + 1));
  const flip = flipEdges(V_LIMIT);
  return [
    md(
      ["정점 V", "간선 E", "힙 연산 수", "실측 비교", "4(E+1)⌈log2(E+1)⌉"],
      rows,
      [0, 1, 2, 3, 4],
    ),
    "",
    `규모 V = ${comma(V_LIMIT)} · E = ${comma(e)} 에 넣으면 이렇습니다.`,
    "",
    md(
      ["항", "식", "값"],
      [
        ["큐에 들어가는 항목", "E + 1", `${comma(e + 1)} 개 이하`],
        ["힙 연산 수", "2(E + 1)", `${comma(2 * (e + 1))} 번 이하`],
        ["한 연산의 비교", "2⌈log2(E+1)⌉", `${2 * lg} 번 이하`],
        ["곱한 값", "4(E+1)⌈log2(E+1)⌉", `${comma(4 * (e + 1) * lg)} 번 이하`],
        ["정점 배열을 매번 읽는 방식", "V²", `${comma(V_LIMIT * V_LIMIT)} 번`],
      ],
      [2],
    ),
    "",
    `두 식이 뒤집히는 첫 간선 수는 E = ${comma(flip)} 입니다. 규모의 상한 ${comma(e)} 의 ${comma(Math.round(flip / e))} 배이고, 정점 ${comma(V_LIMIT)} 개로 만들 수 있는 간선 수 V(V−1) = ${comma(V_LIMIT * (V_LIMIT - 1))} 안에 듭니다.`,
  ].join("\n");
}

/** invariant ② — 경계 입력. */
function invariantEdges(): string {
  const cases: { label: string; n: number; edges: Edge[]; src: number }[] = [
    { label: "정점이 하나뿐이다", n: 1, edges: [], src: 0 },
    { label: "간선이 하나도 없다", n: 3, edges: [], src: 1 },
    { label: "도달할 수 없는 정점이 있다", n: 3, edges: [[0, 1, 3]], src: 0 },
    {
      label: "가중치가 0 이다",
      n: 3,
      edges: [
        [0, 1, 0],
        [1, 2, 0],
      ],
      src: 0,
    },
    {
      label: "같은 두 정점에 간선이 여럿이다",
      n: 2,
      edges: [
        [0, 1, 10],
        [0, 1, 3],
        [0, 1, 7],
      ],
      src: 0,
    },
    {
      label: "자기 자신을 가리키는 간선이 있다",
      n: 2,
      edges: [
        [0, 0, 5],
        [0, 1, 2],
      ],
      src: 0,
    },
  ];
  return md(
    ["경계 입력", "간선", "결과", "넣은 항목", "완화 시도", "값을 고친 완화"],
    cases.map((c) => {
      const steps = record(c.n, c.edges, c.src);
      const pushes = steps.reduce((a, s) => a + s.pushed.length, 0);
      const relax = steps.reduce((a, s) => a + s.relax.length, 0);
      const improved = steps.reduce(
        (a, s) => a + s.relax.filter((r) => r.improved).length,
        0,
      );
      return [
        c.label,
        c.edges.length === 0
          ? "없음"
          : c.edges.map(([u, v, w]) => `${u}→${v}(${w})`).join(" "),
        show(dijkstra(c.n, c.edges, c.src)),
        String(pushes),
        String(relax),
        String(improved),
      ];
    }),
    [3, 4, 5],
  );
}

/** invariant ③ — 지나온 비용을 안 더하는 변이가 내는 실제 값. */
function mutantLastEdge(): string {
  const good = dijkstra(WALK_N, WALK_EDGES, WALK_SRC);
  const bad = lastEdgeOnly.dijkstra(WALK_N, WALK_EDGES, WALK_SRC);
  const into = (v: number) =>
    Math.min(...WALK_EDGES.filter(([, y]) => y === v).map(([, , w]) => w));
  const v3 = 3;
  return [
    md(
      ["입력", "정본이 낸 답", "마지막 간선만 적은 답", "두 답"],
      MUTANT_CASES.map((c) => {
        const g = show(dijkstra(c.n, c.edges, 0));
        const b = show(lastEdgeOnly.dijkstra(c.n, c.edges, 0));
        return [c.label, g, b, g === b ? "같다" : "어긋난다"];
      }),
    ),
    "",
    `전개 입력에서 변이가 적은 dist[${v3}] 는 ${num(bad[v3] as number)} 이고, 정점 ${v3} 으로 들어오는 간선 중 가장 작은 가중치는 ${into(v3)} 입니다. 정본의 dist[${v3}] 는 ${num(good[v3] as number)} 입니다.`,
  ].join("\n");
}

/** perf.derive — 전개 입력에서 무리별 계수. */
function perfCount(): string {
  const c = containerCounts(WALK_N, WALK_EDGES, WALK_SRC, "heap");
  const pops = WALK.filter((s) => s.popped !== null);
  const stale = WALK.filter((s) => s.kind === "stale");
  const settle = WALK.filter((s) => s.kind === "settle");
  const improved = WALK.reduce(
    (a, s) => a + s.relax.filter((r) => r.improved).length,
    0,
  );
  return [
    md(
      ["무리", "걸음", "횟수"],
      [
        ["이웃 목록 만들기", "T1", comma(WALK_EDGES.length)],
        ["큐에 넣기", "T1 과 값을 고친 걸음", comma(c.pushes)],
        [
          "큐에서 꺼내기",
          `${(pops[0] as Step).t} ~ ${(pops.at(-1) as Step).t}`,
          comma(c.pops),
        ],
        ["뒤처진 기록 버리기", tList(stale.map((s) => s.t)), comma(c.stale)],
        ["완화 시도", tList(settle.map((s) => s.t)), comma(c.checks)],
        ["힙 안의 비교", "넣기와 꺼내기 안에서", comma(c.compares)],
      ],
      [2],
    ),
    "",
    `정점 V = ${WALK_N} · 간선 E = ${WALK_EDGES.length} 인 입력입니다. 완화 시도 ${c.checks} 번은 E 와 같고, 큐에 넣기 ${c.pushes} 번은 시작 항목 1 개에 값을 고친 완화 ${improved} 번을 더한 것이며, 큐에서 꺼내기 ${c.pops} 번은 넣은 수와 같습니다.`,
  ].join("\n");
}

/** perf.worst — 입력의 모양이 계수를 어떻게 가르는가. */
function worstShape(): string {
  const V = 64;
  const chain: Edge[] = [];
  for (let i = 0; i + 1 < V; i++) chain.push([i, i + 1, 1]);
  const star: Edge[] = [];
  for (let i = 1; i < V; i++) star.push([0, i, 1]);
  const complete: Edge[] = [];
  for (let u = 0; u < V; u++) {
    for (let v = 0; v < V; v++) if (u !== v) complete.push([u, v, 1]);
  }
  // 간선 하나하나가 반드시 값을 고치도록 만든 완전 DAG — `i → j` 의 가중치를 `2(j-i)-1`
  // 로 두면 앞의 정점이 확정될 때마다 뒤의 값이 1 씩 줄어든다.
  const layered: Edge[] = [];
  for (let u = 0; u < V; u++) {
    for (let v = u + 1; v < V; v++) layered.push([u, v, 2 * (v - u) - 1]);
  }
  const shapes: { label: string; edges: Edge[] }[] = [
    { label: "사슬", edges: chain },
    { label: "별", edges: star },
    { label: "지름길", edges: shortcut(V).edges },
    { label: "완전 그래프 (가중치 전부 1)", edges: complete },
    { label: "완전 DAG (가중치 2(j-i)-1)", edges: layered },
  ];
  let allEqual = true;
  const rows = shapes.map((s) => {
    const c = containerCounts(V, s.edges, 0, "heap");
    if (c.checks !== s.edges.length) allEqual = false;
    return [
      s.label,
      comma(s.edges.length),
      comma(c.checks),
      comma(c.pushes),
      comma(c.compares),
    ];
  });
  if (!allEqual) throw new Error("완화 시도가 간선 수와 다른 모양이 있다");
  return [
    md(
      ["모양 (V = 64)", "간선 E", "완화 시도", "큐에 넣기", "힙 안의 비교"],
      rows,
      [1, 2, 3, 4],
    ),
    "",
    "다섯 모양 모두 완화 시도가 간선 수와 같았고, 큐에 넣기와 힙 안의 비교만 모양에 따라 갈렸습니다.",
  ].join("\n");
}

/** perf.worst — 축마다의 최악. */
function worstAxes(): string {
  const small = 1000;
  const chain: Edge[] = [];
  for (let i = 0; i + 1 < small; i++) chain.push([i, i + 1, W_LIMIT]);
  const got = dijkstra(small, chain, 0).at(-1) as number;
  if (got !== (small - 1) * W_LIMIT) {
    throw new Error("사슬의 끝 거리가 식과 다르다");
  }
  const worstDist = (V_LIMIT - 1) * W_LIMIT;
  return [
    md(
      ["최악으로 만들 축", "입력", "값"],
      [
        [
          "완화 시도",
          `간선 E = ${comma(E_LIMIT)}, 모양은 무엇이든`,
          comma(E_LIMIT),
        ],
        [
          "큐에 넣기",
          "간선 하나하나가 값을 고치는 완전 DAG",
          `E + 1 = ${comma(E_LIMIT + 1)}`,
        ],
        [
          "거리 값",
          `가중치 ${comma(W_LIMIT)} 짜리 사슬 V = ${comma(V_LIMIT)}`,
          `(V − 1) × ${comma(W_LIMIT)} = ${comma(worstDist)}`,
        ],
      ],
      [2],
    ),
    "",
    `정점 ${comma(small)} 개 사슬을 실행하면 끝 정점의 거리가 ${comma(got)}${으로(comma(got))} 식과 일치합니다. 거리 값의 최악 ${comma(worstDist)}${은는(comma(worstDist))} 자바스크립트 수가 정수를 정확히 담는 한계 ${comma(Number.MAX_SAFE_INTEGER)} 보다 ${worstDist < Number.MAX_SAFE_INTEGER ? "작습니다" : "큽니다"}.`,
  ].join("\n");
}

/** selfcheck — T4 에서 큐에 남은 것. */
function selfcheckT4(): string {
  const t4 = WALK[3] as Step;
  const t5 = WALK[4] as Step;
  const [u] = t5.popped as [number, number];
  return lines(
    [
      [
        `${t4.t}${이가(t4.t)} 끝난 뒤 큐(꺼낼 차례)`,
        items(drainOrder(t4.heap)),
      ],
      [`${t5.t} 가 꺼내는 것`, item(t5.popped as [number, number])],
      [`그때의 dist[${u}]`, num(t4.dist[u] as number)],
    ],
    "",
  ).join("\n");
}

export const PROOFS: Record<string, () => string> = {
  conceptPaths,
  naiveScale,
  roundTrace,
  roundVsOrder,
  orderCandidates,
  relaxAll,
  relaxOne,
  relaxHistory,
  firstWrite,
  stageStart,
  stagePop,
  stageQueue,
  premiseNegative,
  heapVsScan,
  walkInput,
  walkT1,
  pauseNoDuplicate,
  pauseNoDuplicateWhere,
  walkHeap,
  walkT2T3,
  pauseStaleCheck,
  walkTrace,
  pauseVisited,
  pauseVisitedWhere,
  walkResult,
  relatedPrefix,
  altTable,
  altBoundary,
  mathPaths,
  mathCheck,
  mathScale,
  invariantEdges,
  mutantLastEdge,
  perfCount,
  worstShape,
  worstAxes,
  selfcheckT4,
};
