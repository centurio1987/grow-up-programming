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
 * 아래 표의 「결과」 칸은 전부 정본이나 정본에서 기계로 만든 변이가 낸 값이고, 사본은 숫자만
 * 낸다. 딱 하나 예외가 `중복을 막은 사본` 인데, 그것은 **줄 하나를 더하는 변이**라
 * `loadMutant`(한 줄 삭제·치환)로 만들 수 없어 여기 손으로 적었다.
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
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

/* ────────────────────────── 칸 맞춤 ────────────────────────── */

/** 한글은 고정폭 화면에서 두 칸을 먹는다. 칸 맞춤을 글자 수로 하면 머리줄만 어긋난다. */
const width = (s: string): number =>
  [...s].reduce((n, c) => n + (/[ᄀ-ᇿ　-〿㄰-㆏가-힯一-鿿]/.test(c) ? 2 : 1), 0);

const pad = (s: string, to: number): string =>
  s + " ".repeat(Math.max(0, to - width(s)));

const padLeft = (s: string, to: number): string =>
  " ".repeat(Math.max(0, to - width(s))) + s;

/** `[0, 3, 1, 4, 7, Infinity]` 꼴 — 본문 표기와 같다. */
const show = (xs: number[]): string => `[${xs.join(", ")}]`;

/** `19,999,600,002` 꼴 — 본문 표기와 같다. */
const comma = (n: number): string => n.toLocaleString("en-US");

/** 표 한 벌을 칸에 맞춰 찍는다. 첫 행이 머리줄이다. */
function table(rows: string[][], alignRight: number[] = []): string[] {
  const cols = rows[0]?.length ?? 0;
  const widths: number[] = [];
  for (let c = 0; c < cols; c++) {
    widths.push(Math.max(...rows.map((r) => width(r[c] ?? ""))));
  }
  return rows.map((r) =>
    r
      .map((cell, c) =>
        alignRight.includes(c)
          ? padLeft(cell, widths[c] ?? 0)
          : pad(cell, widths[c] ?? 0),
      )
      .join("  ")
      .replace(/\s+$/, ""),
  );
}

/* ────────────────────── 계수를 세는 사본 ────────────────────── */

function adjacency(n: number, edges: Edge[]): [number, number][][] {
  const adj: [number, number][][] = Array.from({ length: n }, () => []);
  for (const [u, v, w] of edges) (adj[u] as [number, number][]).push([v, w]);
  return adj;
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
  /** 다음에 꺼낼 항목을 고르느라 키를 견준 횟수. */
  compares: number;
}

export type Order = "fifo" | "lifo" | "number" | "minkey";

/**
 * 꺼내는 순서만 갈아 끼울 수 있는 사본. 넷 다 **같은 완화 규칙**을 쓴다 — 더 짧은 길을
 * 찾으면 고쳐 적고 다시 넣는다. 그래서 넷 다 답은 같고 **완화 시도 수만** 갈린다.
 *
 * 담는 자리는 배열 하나이고 고르는 비용은 여기서 세지 않는다(`compares` 는 0 이다). 고르는
 * 비용은 `containerCounts` 가 따로 잰다 — 두 축을 한 표에 섞으면 무엇이 갈렸는지가 안 보인다.
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
  return { dist, checks, pushes, pops, stale, compares: 0 };
}

/**
 * 가장 단순한 두 번째 후보 — **간선 목록 전체를 라운드마다 다시 읽는다.** 한 라운드가 아무
 * 것도 못 고치면 끝난다. 꺼내는 순서라는 개념 자체가 없는 방식이다.
 */
export function roundCounts(
  n: number,
  edges: Edge[],
  src: number,
): { dist: number[]; checks: number; rounds: number } {
  const dist = Array.from({ length: n }, () => Number.POSITIVE_INFINITY);
  dist[src] = 0;
  let checks = 0;
  let rounds = 0;
  for (;;) {
    rounds++;
    let changed = false;
    for (const [u, v, w] of edges) {
      checks++;
      const du = dist[u] as number;
      if (du === Number.POSITIVE_INFINITY) continue;
      if (du + w < (dist[v] as number)) {
        dist[v] = du + w;
        changed = true;
      }
    }
    if (!changed) break;
  }
  return { dist, checks, rounds };
}

/**
 * 담는 자리를 갈아 끼운 사본. 꺼내는 순서는 **키가 가장 작은 것 먼저**로 고정하고, 그것을
 * ① 배열 선형 탐색 ② 이진 힙 두 방법으로 고른다. 여기서 세는 것은 **고르느라 견준 횟수**다.
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

  const items: [number, number][] = [[src, 0]];
  const key = (i: number): number => (items[i] as [number, number])[1];
  const swap = (a: number, b: number): void => {
    const t = items[a] as [number, number];
    items[a] = items[b] as [number, number];
    items[b] = t;
  };
  const push = (node: number, k: number): void => {
    items.push([node, k]);
    if (kind === "scan") return;
    let i = items.length - 1;
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
      for (let i = 1; i < items.length; i++) {
        compares++;
        if (key(i) < key(at)) at = i;
      }
      return items.splice(at, 1)[0] as [number, number];
    }
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
          compares++;
          if (key(left) < key(small)) small = left;
        }
        if (right < items.length) {
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

  while (items.length > 0) {
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
  return { dist, checks, pushes, pops, stale, compares };
}

/**
 * **줄 하나를 더한 변이** — 이미 큐에 들어 있는 정점은 다시 넣지 않는다. 삭제·치환이 아니라
 * 추가라서 `loadMutant` 로 만들 수 없고, 그래서 여기 손으로 적었다. 다른 줄은 정본과 같다.
 */
export function noDuplicatePush(
  n: number,
  edges: Edge[],
  src: number,
): number[] {
  const adj = adjacency(n, edges);
  const dist = Array.from({ length: n }, () => Number.POSITIVE_INFINITY);
  dist[src] = 0;
  const inBag = Array.from({ length: n }, () => false);
  inBag[src] = true;
  const bag: [number, number][] = [[src, 0]];
  while (bag.length > 0) {
    let at = 0;
    for (let i = 1; i < bag.length; i++) {
      if ((bag[i] as [number, number])[1] < (bag[at] as [number, number])[1]) {
        at = i;
      }
    }
    const [u, d] = bag.splice(at, 1)[0] as [number, number];
    inBag[u] = false;
    if (d > (dist[u] as number)) continue;
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
  return dist;
}

/**
 * 꺼낸 정점을 방문 표시하고 두 번 다시 처리하지 않는 사본. 뒤처진 기록을 키로 거르는 대신
 * 배열 하나로 막는다. 다른 줄은 정본과 같다 — 줄을 더한 변이라 `loadMutant` 로는 못 만든다.
 */
export function visitedOnce(n: number, edges: Edge[], src: number): number[] {
  const adj = adjacency(n, edges);
  const dist = Array.from({ length: n }, () => Number.POSITIVE_INFINITY);
  dist[src] = 0;
  const seen = Array.from({ length: n }, () => false);
  const bag: [number, number][] = [[src, 0]];
  while (bag.length > 0) {
    let at = 0;
    for (let i = 1; i < bag.length; i++) {
      if ((bag[i] as [number, number])[1] < (bag[at] as [number, number])[1]) {
        at = i;
      }
    }
    const [u, d] = bag.splice(at, 1)[0] as [number, number];
    if (seen[u] === true) continue; // ← 갈아 낀 줄. 키가 아니라 표시로 거른다
    seen[u] = true;
    for (const [v, w] of adj[u] as [number, number][]) {
      const nd = d + w;
      if (nd < (dist[v] as number)) {
        dist[v] = nd;
        bag.push([v, nd]);
      }
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

/* ────────────────────── 걸음마다의 상태 ────────────────────── */

export interface Frame {
  t: string;
  popped: string;
  key: string;
  branch: string;
  dist: number[];
  heap: [number, number][];
}

/**
 * 정본과 같은 절차에 **힙 내부를 내다보는 자리**만 덧붙인 사본. `.sim.ts` 의 프레임과
 * 전개 표가 둘 다 이 함수의 출력에서 나온다 — 두 곳을 손으로 맞추면 그 자리에서 어긋난다.
 */
export function trace(n: number, edges: Edge[], src: number): Frame[] {
  const adj = adjacency(n, edges);
  const dist = Array.from({ length: n }, () => Number.POSITIVE_INFINITY);
  dist[src] = 0;
  const items: [number, number][] = [];
  const key = (i: number): number => (items[i] as [number, number])[1];
  const swap = (a: number, b: number): void => {
    const t = items[a] as [number, number];
    items[a] = items[b] as [number, number];
    items[b] = t;
  };
  const push = (node: number, k: number): void => {
    items.push([node, k]);
    let i = items.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
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
      let i = 0;
      for (;;) {
        const left = 2 * i + 1;
        const right = 2 * i + 2;
        let small = i;
        if (left < items.length && key(left) < key(small)) small = left;
        if (right < items.length && key(right) < key(small)) small = right;
        if (small === i) break;
        swap(i, small);
        i = small;
      }
    }
    return top;
  };

  push(src, 0);
  const frames: Frame[] = [
    {
      t: "T1",
      popped: "-",
      key: "-",
      branch: "① 시작값",
      dist: dist.slice(),
      heap: items.map((x) => [x[0], x[1]] as [number, number]),
    },
  ];

  while (items.length > 0) {
    const [u, d] = pop();
    if (d > (dist[u] as number)) {
      frames.push({
        t: `T${frames.length + 1}`,
        popped: String(u),
        key: String(d),
        branch: "③ 뒤처진 기록이라 버린다",
        dist: dist.slice(),
        heap: items.map((x) => [x[0], x[1]] as [number, number]),
      });
      continue;
    }
    const done: string[] = [];
    for (const [v, w] of adj[u] as [number, number][]) {
      const nd = d + w;
      if (nd < (dist[v] as number)) {
        done.push(`${u}→${v} 를 ${nd} 로`);
        dist[v] = nd;
        push(v, nd);
      } else {
        done.push(`${u}→${v} 는 그대로`);
      }
    }
    frames.push({
      t: `T${frames.length + 1}`,
      popped: String(u),
      key: String(d),
      branch:
        done.length === 0 ? "④ 나가는 간선이 없다" : `④ ${done.join(" · ")}`,
      dist: dist.slice(),
      heap: items.map((x) => [x[0], x[1]] as [number, number]),
    });
  }

  frames.push({
    t: `T${frames.length + 1}`,
    popped: "-",
    key: "-",
    branch: "② 큐가 비어 반복이 끝난다",
    dist: dist.slice(),
    heap: [],
  });
  return frames;
}

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

// 하나도 안 갈리면 이 절의 주장이 성립하지 않는다. 실행이 그것을 판정한다.
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

/** `m!` 의 자릿수. 경로 수가 배열에 안 들어가는 규모에서는 자릿수만 낸다. */
function factorialDigits(m: number): number {
  let log10 = 0;
  for (let k = 2; k <= m; k++) log10 += Math.log10(k);
  return Math.floor(log10) + 1;
}

/** 완전 그래프에서 시작 정점에서 나가는 단순 경로의 개수. */
function simplePaths(v: number): number {
  let total = 0;
  let term = 1;
  for (let k = 1; k <= v - 1; k++) {
    term *= v - k;
    total += term;
  }
  return total;
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

export const PROOFS: Record<string, () => string> = {
  /** deep.build ② — 아무 기법 없이 푸는 두 방법이 제약 규모에서 몇 번을 세는가. */
  naiveScale: () =>
    [
      ...table(
        [
          [
            "정점 V",
            "경로를 전부 만든다",
            "간선 목록을 라운드마다 다시 읽는다",
          ],
          ...[5, 8, 10, 12].map((v) => [
            String(v),
            comma(simplePaths(v)),
            comma((v - 1) * v * (v - 1)),
          ]),
        ],
        [0, 1, 2],
      ),
      "",
      `제약 규모 V = ${comma(V_LIMIT)} · E = ${comma(E_LIMIT)} 이면`,
      `  경로를 전부 만든다      (V-1)! 보다 크다. 그 값만 ${comma(factorialDigits(V_LIMIT - 1))} 자리다`,
      `  라운드마다 다시 읽는다  ${comma((V_LIMIT - 1) * E_LIMIT)} 번`,
      `  초당 1억 번 기준        아래 줄만 따져도 ${comma(Math.round(((V_LIMIT - 1) * E_LIMIT) / 1e8))} 초`,
    ].join("\n"),

  /** deep.build ④ — 같은 그래프를 두 방식으로 처리하고 실제 계수를 나란히 적는다. */
  roundVsOrder: () => {
    const r = roundCounts(WALK_N, WALK_EDGES, WALK_SRC);
    const rev = roundCounts(WALK_N, [...WALK_EDGES].reverse(), WALK_SRC);
    const o = orderCounts(WALK_N, WALK_EDGES, WALK_SRC, "minkey");
    return table(
      [
        ["방식", "완화 시도", "되풀이한 횟수", "결과 dist"],
        [
          "간선 목록을 라운드마다 다시 읽는다",
          comma(r.checks),
          `라운드 ${r.rounds}`,
          show(r.dist),
        ],
        [
          "같은 방식, 간선 순서를 거꾸로",
          comma(rev.checks),
          `라운드 ${rev.rounds}`,
          show(rev.dist),
        ],
        [
          "키가 가장 작은 것부터 꺼낸다",
          comma(o.checks),
          `꺼낸 항목 ${o.pops}`,
          show(o.dist),
        ],
      ],
      [1],
    ).join("\n");
  },

  /** deep.build ⑤ — 꺼내는 순서 후보 넷을 같은 그래프 둘에 걸어 완화 시도를 잰다. */
  orderCandidates: () => {
    const orders: Order[] = ["number", "fifo", "lifo", "minkey"];
    const rows = orders.map((o) => {
      const a = orderCounts(WALK_N, WALK_EDGES, WALK_SRC, o);
      const b = orderCounts(SHORTCUT.n, SHORTCUT.edges, 0, o);
      const c = orderCounts(SPARSE_SMALL.n, SPARSE_SMALL.edges, 0, o);
      return [
        ORDER_LABEL[o],
        comma(a.checks),
        comma(b.checks),
        comma(c.checks),
        show(a.dist) === show(dijkstra(WALK_N, WALK_EDGES, WALK_SRC))
          ? "같다"
          : "다르다",
      ];
    });
    return [
      ...table(
        [
          [
            "꺼내는 순서",
            "전개 입력",
            "지름길 64",
            "성긴 64",
            "전개 입력의 답",
          ],
          ...rows,
        ],
        [1, 2, 3],
      ),
      "",
      `간선 수  전개 입력 ${WALK_EDGES.length} · 지름길 64 ${SHORTCUT.edges.length} · 성긴 64 ${SPARSE_SMALL.edges.length}`,
    ].join("\n");
  },

  /** deep.build ⑥ — 최소를 고르는 두 방법의 견주기 횟수를 규모별로 잰다. */
  heapVsScan: () =>
    [
      ...table(
        [
          ["정점 V", "간선 E", "배열에서 찾기", "이진 힙", "몇 배"],
          ...[16, 64, 256, 1024].map((v) => {
            const g = sparse(v);
            const s = containerCounts(g.n, g.edges, 0, "scan");
            const h = containerCounts(g.n, g.edges, 0, "heap");
            return [
              comma(v),
              comma(g.edges.length),
              comma(s.compares),
              comma(h.compares),
              `${(s.compares / h.compares).toFixed(1)} 배`,
            ];
          }),
        ],
        [0, 1, 2, 3, 4],
      ),
      "",
      "두 방법의 완화 시도와 결과는 규모마다 같다 — 갈리는 것은 고르느라 견준 횟수뿐이다",
    ].join("\n"),

  /** deep.walk — 아홉 걸음의 상태값. */
  walkTrace: () => {
    const frames = trace(WALK_N, WALK_EDGES, WALK_SRC);
    return [
      ...table([
        ["걸음", "꺼낸 것", "키", "dist", "큐(배열 순서)", "이 걸음이 한 일"],
        ...frames.map((f) => [
          f.t,
          f.popped,
          f.key,
          show(f.dist),
          f.heap.length === 0
            ? "(비어 있음)"
            : f.heap.map(([node, k]) => `(${node}, ${k})`).join(" "),
          f.branch,
        ]),
      ]),
      "",
      `반환값 ${show(dijkstra(WALK_N, WALK_EDGES, WALK_SRC))}`,
    ].join("\n");
  },

  /** 멈춤 1 — 큐에 이미 있는 정점을 다시 안 넣으면 어떤 답이 나오는가. */
  pauseNoDuplicate: () =>
    table([
      ["입력", "정본이 낸 답", "중복을 막은 답", "판정"],
      ...MUTANT_CASES.map((c) => {
        const good = show(dijkstra(c.n, c.edges, 0));
        const bad = show(noDuplicatePush(c.n, c.edges, 0));
        return [c.label, good, bad, good === bad ? "같다" : "틀리다"];
      }),
    ]).join("\n"),

  /** 멈춤 2 — 뒤처진 기록을 걸러 내는 줄을 빼면 답과 계수가 각각 어떻게 되는가. */
  pauseStaleCheck: () => {
    const graphs: { label: string; n: number; edges: Edge[] }[] = [
      { label: "전개 입력", n: WALK_N, edges: WALK_EDGES },
      { label: "지름길 64", n: SHORTCUT.n, edges: SHORTCUT.edges },
      { label: "성긴 64", n: SPARSE_SMALL.n, edges: SPARSE_SMALL.edges },
    ];
    return [
      ...table([
        ["입력", "정점 V", "간선 E", "정본이 낸 답 vs 줄을 뺀 답"],
        ...graphs.map((g) => {
          const good = show(dijkstra(g.n, g.edges, 0));
          const bad = show(noStaleCheck.dijkstra(g.n, g.edges, 0));
          return [
            g.label,
            comma(g.n),
            comma(g.edges.length),
            good === bad ? "칸마다 같다" : "다르다",
          ];
        }),
      ]),
      "",
      ...table(
        [
          ["입력", "줄이 있을 때 완화 시도", "줄을 뺐을 때 완화 시도"],
          ...graphs.map((g) => {
            const kept = orderCounts(g.n, g.edges, 0, "minkey");
            let checks = 0;
            const adj = adjacency(g.n, g.edges);
            const dist = Array.from(
              { length: g.n },
              () => Number.POSITIVE_INFINITY,
            );
            dist[0] = 0;
            const bag: [number, number][] = [[0, 0]];
            while (bag.length > 0) {
              let at = 0;
              for (let i = 1; i < bag.length; i++) {
                if (
                  (bag[i] as [number, number])[1] <
                  (bag[at] as [number, number])[1]
                ) {
                  at = i;
                }
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
            return [g.label, comma(kept.checks), comma(checks)];
          }),
        ],
        [1, 2],
      ),
    ].join("\n");
  },

  /** 멈춤 3 — 방문 표시 배열로 갈음하면 이 문제에서는 답이 같고, 음수가 들어가면 갈린다. */
  pauseVisited: () => {
    const nonNegative: { label: string; n: number; edges: Edge[] }[] = [
      { label: "전개 입력", n: WALK_N, edges: WALK_EDGES },
      ...MUTANT_CASES.slice(1),
      { label: "지름길 64", n: SHORTCUT.n, edges: SHORTCUT.edges },
      { label: "성긴 64", n: SPARSE_SMALL.n, edges: SPARSE_SMALL.edges },
    ];
    const negative: { label: string; n: number; edges: Edge[] }[] = [
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
    return [
      "가중치가 음수가 아닌 입력 — 이 문제의 제약 안이다",
      ...table([
        ["입력", "정본이 낸 답", "방문 표시로 갈음한 답", "판정"],
        ...nonNegative.map((c) => {
          const good = show(dijkstra(c.n, c.edges, 0));
          const bad = show(visitedOnce(c.n, c.edges, 0));
          return [
            c.label,
            c.n > 8 ? `정점 ${comma(c.n)} 개` : good,
            c.n > 8 ? (good === bad ? "칸마다 같다" : "다르다") : bad,
            good === bad ? "같다" : "틀리다",
          ];
        }),
      ]),
      "",
      "가중치에 음수가 하나 들어간 입력 — 제약 밖이다",
      ...table([
        [
          "입력",
          "정본이 낸 답",
          "방문 표시로 갈음한 답",
          "경로를 전부 만든 답",
        ],
        ...negative.map((c) => [
          c.label,
          show(dijkstra(c.n, c.edges, 0)),
          show(visitedOnce(c.n, c.edges, 0)),
          show(bruteForce(c.n, c.edges, 0)),
        ]),
      ]),
    ].join("\n");
  },

  /** deep.math ② — 정의를 전개 입력에 넣어 검산한다. */
  mathCheck: () => {
    const dist = dijkstra(WALK_N, WALK_EDGES, WALK_SRC);
    const brute = bruteForce(WALK_N, WALK_EDGES, WALK_SRC);
    return table(
      [
        [
          "정점 v",
          "경로를 전부 만들어 고른 최솟값",
          "이 절차의 dist[v]",
          "판정",
        ],
        ...Array.from({ length: WALK_N }, (_, v) => [
          String(v),
          brute[v] === Number.POSITIVE_INFINITY
            ? "Infinity"
            : comma(brute[v] ?? 0),
          dist[v] === Number.POSITIVE_INFINITY
            ? "Infinity"
            : comma(dist[v] ?? 0),
          brute[v] === dist[v] ? "같다" : "다르다",
        ]),
      ],
      [1, 2],
    ).join("\n");
  },

  /** deep.math ④ — 닫힌 형태에 제약 규모를 넣어 수치를 낸다. */
  mathScale: () => {
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
    const eLimit = E_LIMIT;
    return [
      ...table(
        [
          [
            "정점 V",
            "간선 E",
            "힙 연산 수",
            "실측 견주기",
            "4(E+1)⌈log2(E+1)⌉",
          ],
          ...rows,
        ],
        [0, 1, 2, 3, 4],
      ),
      "",
      `제약 규모 V = ${comma(V_LIMIT)} · E = ${comma(eLimit)} 이면`,
      `  큐에 들어가는 항목    E+1 = ${comma(eLimit + 1)} 개 이하`,
      `  힙 연산 수            2(E+1) = ${comma(2 * (eLimit + 1))} 번 이하`,
      `  한 연산의 견주기      2⌈log2(E+1)⌉ = ${2 * Math.ceil(Math.log2(eLimit + 1))} 번 이하`,
      `  곱하면                ${comma(2 * (eLimit + 1) * 2 * Math.ceil(Math.log2(eLimit + 1)))} 번 이하`,
      `  정점 배열을 매번 읽으면  V제곱 = ${comma(V_LIMIT * V_LIMIT)} 번`,
      "",
      `두 식이 뒤집히는 간선 수 — 4(E+1)⌈log2(E+1)⌉ 가 V제곱 이상이 되는 첫 E`,
      `  E = ${comma(flipEdges(V_LIMIT))}`,
      `  제약의 상한 ${comma(eLimit)} 의 ${comma(Math.round(flipEdges(V_LIMIT) / eLimit))} 배이고, 정점 ${comma(V_LIMIT)} 개로 만들 수 있는 간선 수(V(V-1) = ${comma(V_LIMIT * (V_LIMIT - 1))}) 안에 든다`,
    ].join("\n");
  },

  /** invariant ③ — 지나온 비용을 안 더하는 변이가 내는 실제 값. */
  mutantLastEdge: () =>
    table([
      ["입력", "정본이 낸 답", "마지막 간선만 적은 답", "판정"],
      ...MUTANT_CASES.map((c) => {
        const good = show(dijkstra(c.n, c.edges, 0));
        const bad = show(lastEdgeOnly.dijkstra(c.n, c.edges, 0));
        return [c.label, good, bad, good === bad ? "같다" : "틀리다"];
      }),
    ]).join("\n"),

  /** perf.derive — 전개 입력에서 무리별 계수. */
  perfCount: () => {
    const c = containerCounts(WALK_N, WALK_EDGES, WALK_SRC, "heap");
    const frames = trace(WALK_N, WALK_EDGES, WALK_SRC);
    return [
      ...table(
        [
          ["무리", "어느 걸음인가", "횟수"],
          ["이웃 목록 만들기", "T1", comma(WALK_EDGES.length)],
          ["큐에 넣기", "T1 과 완화가 일어난 걸음", comma(c.pushes)],
          [
            "큐에서 꺼내기",
            `T2 부터 T${frames.length - 1} 까지`,
            comma(c.pops),
          ],
          ["뒤처진 기록 버리기", "꺼낸 것 중", comma(c.stale)],
          ["완화 시도", "버리지 않은 걸음에서", comma(c.checks)],
          ["힙에서 견주기", "넣기와 꺼내기 안에서", comma(c.compares)],
        ],
        [2],
      ),
      "",
      `정점 V = ${WALK_N} · 간선 E = ${WALK_EDGES.length} 인 입력이다`,
      `  완화 시도 = E = ${WALK_EDGES.length}`,
      `  큐에 넣기 = 1 + 완화가 값을 고친 횟수 = ${c.pushes}`,
      `  큐에서 꺼내기 = 넣은 횟수 = ${c.pops}`,
    ].join("\n");
  },

  /** perf.worst — 입력의 모양이 계수를 어떻게 가르는가. */
  worstShape: () => {
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
    return [
      ...table(
        [
          ["모양 (V = 64)", "간선 E", "완화 시도", "큐에 넣기", "힙 견주기"],
          ...shapes.map((s) => {
            const c = containerCounts(V, s.edges, 0, "heap");
            return [
              s.label,
              comma(s.edges.length),
              comma(c.checks),
              comma(c.pushes),
              comma(c.compares),
            ];
          }),
        ],
        [1, 2, 3, 4],
      ),
      "",
      "완화 시도는 어느 모양에서도 E 와 같고, 큐에 넣기와 힙 견주기만 모양에 따라 갈린다",
    ].join("\n");
  },
};
