/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run tools/check-proof.ts src/algorithms/shortest-path/aStarSearch/aStarSearch-guide.md
 *
 * **변이가 아무것도 안 바꾸는지를 검사하는 자리는 중화 실행을 피해 간다.** `check-proof` 가
 * 이 파일을 한 번 더 부를 때는 `loadMutant` 이 정본을 그대로 돌려주므로(중화), 그 상태에서
 * 「변이가 답을 안 바꿨다」로 던지면 중화 대조 자체가 실행되지 않는다. 중화 여부는 변이
 * 모듈의 함수가 정본과 **같은 객체인가**로 값에서 알아낸다.
 *
 * ## 계측 사본 둘
 *
 * - `record` — 걸음마다 비용 배열 · 힙 · 부모를 **통째로 떠 두는** 사본. 본문의 걸음 표와 걸음 재생
 *   패널이 이것에서 나온다. 걸음마다 전체를 베끼므로 **전개 입력처럼 작은 입력에만** 쓴다.
 * - `walkRun` — 수만 세는 가벼운 사본. 격자 224×224 처럼 큰 입력은 이쪽으로만 잰다.
 *
 * 둘 다 부를 때마다 자기 답을 정본과 맞댄다.
 *
 * ## 세는 기준 — 원고 전체에서 하나
 *
 * **기본 연산** 은 힙 안에서 키를 한 번 비교한 것 · 간선 하나를 완화해 본 것 · 추정 함수를 한 번
 * 부른 것을 각각 하나로 센 합이다. `purpose.alt` 의 `.alt.ts` 가 같은 기준으로 세고, 전개 입력에서
 * 두 쪽의 값이 같은지 이 파일이 확인한다. **추가 칸** 은 비용 배열 `V` 칸과 힙이 가장 커졌을 때의
 * 항목 수의 합이다. 간선 목록을 이웃 목록으로 옮기는 몫(`E` 칸 · `E` 번)은 두 잣대 어디에도 넣지
 * 않고 따로 적는다.
 */

import { loadMutant } from "../../../../tools/check-proof.ts";
import { josa, 과와, 으로, 을를, 이가 } from "../../../../tools/josa.ts";
import { cases as altCases } from "./aStarSearch-guide.alt.ts";
import { aStarSearch, type Edge } from "./aStarSearch-guide.ref.ts";

/* ────────────────────────── 표기 ────────────────────────── */

const INF = Number.POSITIVE_INFINITY;

/** `19,999,800,000` 꼴 — 본문 표기와 같다. */
export const comma = (n: number): string => (n + 0).toLocaleString("en-US");

/** 비용 하나 — 무한대는 코드가 돌려주는 그대로 `Infinity` 로 적는다. */
export const num = (d: number): string => (d === INF ? "Infinity" : comma(d));

/** 배열 하나 — `[0, 3, 4, Infinity]`. */
export const show = (xs: readonly number[]): string =>
  `[${xs.map(num).join(", ")}]`;

/** 큐 항목 하나 — `(정점, 넣을 때의 비용, 키)`. 정본의 `open.push(v, ng, ng + h(v))` 와 같은 차례다. */
export type Item = [number, number, number];
export const item = ([v, g, f]: readonly [number, number, number]): string =>
  `(${v}, ${num(g)}, ${num(f)})`;

const items = (xs: readonly Item[]): string =>
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

/** 걸음 이름을 이어 적는다 — `T5 · T7`. */
const tList = (ts: readonly string[]): string => ts.join(" · ");

/* ────────────────────────── 고정 입력 ────────────────────────── */

/**
 * 본문 전개가 쓰는 고정 입력 — 정점 여덟 · 방향 간선 여덟.
 *
 * 값이 한 번 줄어드는 정점이 있고(정점 3), 그래서 같은 정점 짜리 항목이 큐에 둘 생겨 하나가
 * 뒤처진 기록으로 버려진다. 목표와 반대쪽에 있는 정점 7 은 키가 커서 한 번도 안 꺼낸다.
 */
export const WALK_EDGES: Edge[] = [
  [0, 1, 3],
  [0, 2, 4],
  [0, 7, 5],
  [1, 4, 2],
  [2, 3, 7],
  [4, 3, 3],
  [3, 5, 2],
  [5, 6, 6],
];
export const WALK_N = 8;
export const WALK_SRC = 0;
export const WALK_GOAL = 6;

/** 전개 입력의 정점 좌표. 추정은 여기서 잰 맨해튼 거리다. */
export const WALK_XY: [number, number][] = [
  [0, 0],
  [2, 1],
  [3, 0],
  [5, 0],
  [4, 1],
  [6, 0],
  [8, 0],
  [0, 5],
];

/** 목표 정점까지의 맨해튼 거리. */
export function walkH(v: number): number {
  const [x, y] = WALK_XY[v] as [number, number];
  const [gx, gy] = WALK_XY[WALK_GOAL] as [number, number];
  return Math.abs(gx - x) + Math.abs(gy - y);
}

/** 추정이 아무것도 안 알려 주는 판. 이 절차가 다익스트라와 같아지는 자리다. */
export const zeroH = (_v: number): number => 0;

/** 실제 값을 넘는 추정을 받는 정점과 그 값 — 정점 1 의 실제 최소 비용 13 을 넘는다. */
export const OVER_AT = 1;
export const OVER_VALUE = 20;

/** 정점 하나에서만 실제 최소 비용을 넘는 추정. 나머지 정점은 맨해튼 거리 그대로다. */
export function overH(v: number): number {
  return v === OVER_AT ? OVER_VALUE : walkH(v);
}

/**
 * 허용 가능하지만 **일관되지 않은** 추정.
 *
 * 정점 3 에 0 을, 정점 4 에 실제 최소 비용인 11 을 준다. 둘 다 실제 값을 안 넘으므로 허용
 * 가능한데, 간선 4→3 에서 `h(4) = 11 > 3 + h(3) = 3` 이라 일관성이 깨진다.
 */
function brokenH(v: number): number {
  return v === 3 ? 0 : v === 4 ? 11 : walkH(v);
}

/** 조기 반환이 답을 바꾸는 배치 — 돌아가는 경로가 더 비용이 작다. */
const DETOUR: Edge[] = [
  [0, 3, 10],
  [0, 1, 1],
  [1, 2, 1],
  [2, 3, 1],
];
const detourH = (v: number): number => [3, 2, 1, 0][v] as number;

/** 추정을 부풀리면 답이 바뀌는 배치 — 두 경로의 비용 차이가 1 이다. */
const NARROW: Edge[] = [
  [0, 1, 1],
  [1, 3, 10],
  [0, 2, 6],
  [2, 3, 6],
];
const narrowH = (v: number): number => [11, 10, 6, 0][v] as number;

/** 음수 가중치가 하나 있는 배치 — 목표로 바로 가는 간선보다 돌아가는 쪽이 작다. */
const NEGATIVE: Edge[] = [
  [0, 2, 1],
  [0, 1, 5],
  [1, 2, -10],
];

/** 사슬 하나. 추정이 정확해도 지날 정점이 정해져 있다. */
function chain(k: number): {
  n: number;
  edges: Edge[];
  h: (v: number) => number;
} {
  const edges: Edge[] = [];
  for (let i = 0; i + 1 < k; i++) edges.push([i, i + 1, 1]);
  return { n: k, edges, h: (v: number) => k - 1 - v };
}

/**
 * 완전 DAG. 앞 정점에서 뒤 정점으로 가는 간선이 전부 있고 가중치가 `2(v−u)−1` 이다.
 *
 * 이 모양에서는 **간선 하나하나가 반드시 값을 줄인다** — 정점 `v` 에 적히는 값이 `u` 가
 * 커질수록 1 씩 작아지기 때문이다. 그래서 큐에 들어가는 항목 수가 가장 커진다. 추정
 * `k−1−v` 는 실제 최소 비용과 같고 일관적이라 재확장은 없다.
 */
function denseDag(k: number): {
  n: number;
  edges: Edge[];
  h: (v: number) => number;
} {
  const edges: Edge[] = [];
  for (let u = 0; u < k; u++) {
    for (let v = u + 1; v < k; v++) edges.push([u, v, 2 * (v - u) - 1]);
  }
  return { n: k, edges, h: (v: number) => k - 1 - v };
}

/** 목표에서 뻗어 나온 별. 시작에서 한 걸음, 거기서 목표까지 한 걸음이다. */
function star(k: number): {
  n: number;
  edges: Edge[];
  h: (v: number) => number;
} {
  const edges: Edge[] = [];
  for (let i = 1; i + 1 < k; i++) {
    edges.push([0, i, 1]);
    edges.push([i, k - 1, 1]);
  }
  return { n: k, edges, h: (v: number) => (v === k - 1 ? 0 : 1) };
}

/** 격자 한 변 `k`. 상하좌우로 오갈 수 있고 모든 간선의 가중치가 1 이다. */
export function grid(k: number): {
  n: number;
  edges: Edge[];
  goal: number;
  man: (v: number) => number;
} {
  const at = (r: number, c: number): number => r * k + c;
  const edges: Edge[] = [];
  for (let r = 0; r < k; r++) {
    for (let c = 0; c < k; c++) {
      if (r + 1 < k) {
        edges.push([at(r, c), at(r + 1, c), 1]);
        edges.push([at(r + 1, c), at(r, c), 1]);
      }
      if (c + 1 < k) {
        edges.push([at(r, c), at(r, c + 1), 1]);
        edges.push([at(r, c + 1), at(r, c), 1]);
      }
    }
  }
  return {
    n: k * k,
    edges,
    goal: k * k - 1,
    man: (v: number) =>
      Math.abs(k - 1 - Math.floor(v / k)) + Math.abs(k - 1 - (v % k)),
  };
}

/** 정점 번호를 섞는 고정 해시. 실행마다 같은 값이 나온다. */
function scatter(v: number): number {
  let x = (v * 2654435761) >>> 0;
  x ^= x >>> 15;
  x = (x * 2246822519) >>> 0;
  x ^= x >>> 13;
  return x >>> 0;
}

/** 정점의 `p` 퍼센트에만 정확한 추정을 주고 나머지에 0 을 주는 판. */
function patchy(man: (v: number) => number, p: number): (v: number) => number {
  return (v: number) => (scatter(v) % 100 < p ? man(v) : 0);
}

/** 규모의 상한 — 이 글이 정한 값이다(다익스트라 편과 같은 규모). */
const V_LIMIT = 100_000;
const E_LIMIT = 200_000;

/**
 * 간선이 규모의 상한 안에 드는 가장 큰 정사각 격자의 한 변. 한 변 `k` 인 격자의 방향 간선은
 * `4k(k−1)` 개다.
 */
const BIG_SIDE = (() => {
  let k = 2;
  while (4 * (k + 1) * k <= E_LIMIT) k++;
  return k;
})();

/* ────────────────────────── 걸음마다의 상태 ────────────────────────── */

/** 완화 한 번 — 간선 `u → v` 를 읽고 무엇을 했는가. */
export interface Relax {
  u: number;
  v: number;
  w: number;
  /** 그때 꺼낸 항목의 비용 — 곧 `g[u]`. */
  gu: number;
  /** 읽기 전의 `g[v]`. */
  before: number;
  ng: number;
  improved: boolean;
  /** 넣은 항목의 키 `ng + h(v)`. 안 넣었으면 `NaN`. */
  key: number;
}

/** 걸음 하나. `heap` 은 걸음이 끝난 뒤 배열에 놓인 순서 그대로다. */
export interface Step {
  t: string;
  kind: "start" | "expand" | "stale" | "goal";
  popped: Item | null;
  relax: Relax[];
  /** 이 걸음에 넣은 항목. */
  pushed: Item[];
  g: number[];
  heap: Item[];
  /** 정점마다 지금 비용을 낸 간선의 꼬리. 없으면 -1. */
  pred: number[];
  /** 한 번이라도 확장한 정점. */
  expanded: boolean[];
}

/** 이진 힙 사본 — 정본의 `MinHeap` 과 같은 규칙이다(넣으면 올리고, 꺼내면 뿌리를 덮고 내린다). */
export class HeapCopy {
  items: Item[] = [];
  compares = 0;
  peak = 0;
  constructor(start: readonly (readonly [number, number, number])[] = []) {
    this.items = start.map((x) => [x[0], x[1], x[2]] as Item);
  }
  private key(i: number): number {
    return (this.items[i] as Item)[2];
  }
  private swap(a: number, b: number): void {
    const t = this.items[a] as Item;
    this.items[a] = this.items[b] as Item;
    this.items[b] = t;
  }
  push(node: number, cost: number, k: number): void {
    this.items.push([node, cost, k]);
    this.peak = Math.max(this.peak, this.items.length);
    let i = this.items.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      this.compares++;
      if (this.key(i) >= this.key(parent)) break;
      this.swap(i, parent);
      i = parent;
    }
  }
  pop(): Item {
    const top = this.items[0] as Item;
    const last = this.items.pop() as Item;
    if (this.items.length > 0) {
      this.items[0] = last;
      let i = 0;
      for (;;) {
        const left = 2 * i + 1;
        const right = 2 * i + 2;
        let small = i;
        if (left < this.items.length) {
          this.compares++;
          if (this.key(left) < this.key(small)) small = left;
        }
        if (right < this.items.length) {
          this.compares++;
          if (this.key(right) < this.key(small)) small = right;
        }
        if (small === i) break;
        this.swap(i, small);
        i = small;
      }
    }
    return top;
  }
  snapshot(): Item[] {
    return this.items.map((x) => [x[0], x[1], x[2]] as Item);
  }
}

/** 지금 큐에 든 항목을 **꺼낼 차례대로** — 힙 사본을 하나 떠서 비울 때까지 꺼낸다. */
export function drainOrder(
  heap: readonly (readonly [number, number, number])[],
): Item[] {
  const copy = new HeapCopy(heap);
  const out: Item[] = [];
  while (copy.items.length > 0) out.push(copy.pop());
  return out;
}

function adjacency(n: number, edges: Edge[]): [number, number][][] {
  const adj: [number, number][][] = Array.from({ length: n }, () => []);
  for (const [u, v, w] of edges) (adj[u] as [number, number][]).push([v, w]);
  return adj;
}

/**
 * 정본과 같은 절차에 **힙 내부를 내다보는 자리**만 덧붙인 사본. 본문의 걸음 표와 걸음 재생
 * 패널이 둘 다 이 함수의 출력에서 나온다 — 두 곳을 손으로 맞추면 그 자리에서 어긋난다.
 * 걸음마다 배열 넷을 통째로 떠 두므로 작은 입력에만 쓴다.
 */
export function record(
  n: number,
  edges: Edge[],
  src: number,
  goal: number,
  h: (v: number) => number,
): Step[] {
  const adj = adjacency(n, edges);
  const g = Array.from({ length: n }, () => INF);
  const pred = Array.from({ length: n }, () => -1);
  const expanded = Array.from({ length: n }, () => false);
  g[src] = 0;
  const heap = new HeapCopy();
  const first: Item = [src, 0, h(src)];
  heap.push(...first);
  const snap = (
    kind: Step["kind"],
    popped: Item | null,
    relax: Relax[],
    pushed: Item[],
  ): Step => ({
    t: `T${steps.length + 1}`,
    kind,
    popped,
    relax,
    pushed,
    g: g.slice(),
    heap: heap.snapshot(),
    pred: pred.slice(),
    expanded: expanded.slice(),
  });
  const steps: Step[] = [];
  steps.push(snap("start", null, [], [first]));
  let answer = INF;
  while (heap.items.length > 0) {
    const top = heap.pop();
    const [u, gu] = top;
    if (u === goal) {
      answer = gu;
      steps.push(snap("goal", top, [], []));
      break;
    }
    if (gu > (g[u] as number)) {
      steps.push(snap("stale", top, [], []));
      continue;
    }
    expanded[u] = true;
    const relax: Relax[] = [];
    const pushed: Item[] = [];
    for (const [v, w] of adj[u] as [number, number][]) {
      const ng = gu + w;
      const before = g[v] as number;
      const improved = ng < before;
      let key = Number.NaN;
      if (improved) {
        g[v] = ng;
        pred[v] = u;
        key = ng + h(v);
        heap.push(v, ng, key);
        pushed.push([v, ng, key]);
      }
      relax.push({ u, v, w, gu, before, ng, improved, key });
    }
    steps.push(snap("expand", top, relax, pushed));
  }
  const want = aStarSearch(n, edges, src, goal, h);
  if (answer !== want) {
    throw new Error(`기록 사본이 정본과 다른 답을 냈다 — ${answer} vs ${want}`);
  }
  return steps;
}

/** 전개 입력의 걸음 전부. */
export const WALK = record(WALK_N, WALK_EDGES, WALK_SRC, WALK_GOAL, walkH);

/** 뒤처진 기록인가 — 넣을 때의 비용이 그 걸음이 끝난 뒤 적힌 비용보다 크다. */
export const isStale = (
  s: Step,
  [v, g]: readonly [number, number, number],
): boolean => g > (s.g[v] as number);

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

/* ────────────────────────── 수만 세는 사본 ────────────────────────── */

export interface Counted {
  answer: number;
  pops: number;
  expands: number;
  pushes: number;
  relaxes: number;
  hcalls: number;
  compares: number;
  stale: number;
  peak: number;
  reexpands: number;
  maxKey: number;
  order: number[];
  expanded: boolean[];
  offKey: number;
}

/** 기본 연산 — 힙 안의 비교 · 완화 시도 · 추정 호출의 합. */
export const basicOps = (c: Counted): number =>
  c.compares + c.relaxes + c.hcalls;

/**
 * 정본과 같은 절차를 수만 세며 실행한다. 걸음마다 무엇을 베끼지 않으므로 큰 입력에도 쓴다.
 *
 * **불변식을 표에 손으로 적지 않는다** — `offKey` 가 「꺼낸 키가 답을 넘은 걸음 수」이고,
 * 그 값을 실행이 세서 돌려준다(답은 추정 없이 따로 구한 실제 최소 비용이다).
 *
 * `opt` 셋은 변이·다른 설계를 **같은 힙으로** 재기 위한 것이다. 힙이 다르면 키가 같은 항목의
 * 앞뒤가 달라지고, 그때 나온 계수는 절차가 아니라 자료구조의 차이를 잰 값이 된다.
 *
 * - `noStale` — 뒤처진 기록을 버리는 줄이 없는 판
 * - `inflate` — 추정을 두 배로 부풀려 키를 만드는 판(시작 항목의 키는 정본과 같다)
 * - `keyOnlyH` — 키를 남은 비용의 추정 하나로 두는 판
 */
function walkRun(
  n: number,
  edges: Edge[],
  src: number,
  goal: number,
  h: (v: number) => number,
  opt: { noStale?: boolean; inflate?: boolean; keyOnlyH?: boolean } = {},
  target: number | null = null,
): Counted {
  const g = Array.from({ length: n }, () => INF);
  const adj = adjacency(n, edges);
  g[src] = 0;
  const heap = new HeapCopy();
  const c: Counted = {
    answer: INF,
    pops: 0,
    expands: 0,
    pushes: 0,
    relaxes: 0,
    hcalls: 0,
    compares: 0,
    stale: 0,
    peak: 0,
    reexpands: 0,
    maxKey: 0,
    order: [],
    expanded: Array.from({ length: n }, () => false),
    offKey: 0,
  };
  const times = Array.from({ length: n }, () => 0);
  c.hcalls++;
  heap.push(src, 0, h(src));
  c.pushes++;
  const best = target ?? (fromDist(n, edges, src)[goal] as number);
  const done = (): Counted => {
    c.compares = heap.compares;
    c.peak = heap.peak;
    return c;
  };
  while (heap.items.length > 0) {
    const [u, gu, f] = heap.pop();
    c.pops++;
    c.maxKey = Math.max(c.maxKey, f);
    if (f > best) c.offKey++;
    if (u === goal) {
      c.answer = gu;
      return done();
    }
    if (opt.noStale !== true && gu > (g[u] as number)) {
      c.stale++;
      continue;
    }
    c.expands++;
    times[u] = (times[u] as number) + 1;
    if ((times[u] as number) > 1) c.reexpands++;
    c.expanded[u] = true;
    c.order.push(u);
    for (const [v, w] of adj[u] as [number, number][]) {
      c.relaxes++;
      const ng = gu + w;
      if (ng < (g[v] as number)) {
        g[v] = ng;
        c.hcalls++;
        const hv = h(v);
        heap.push(
          v,
          ng,
          opt.keyOnlyH === true
            ? hv
            : ng + (opt.inflate === true ? 2 * hv : hv),
        );
        c.pushes++;
      }
    }
  }
  return done();
}

/** 목표 정점까지의 실제 최소 비용을 정점마다 낸다. 간선을 뒤집고 다익스트라를 돌린다. */
function trueDist(n: number, edges: Edge[], goal: number): number[] {
  const rev: [number, number][][] = Array.from({ length: n }, () => []);
  for (const [u, v, w] of edges) (rev[v] as [number, number][]).push([u, w]);
  const dist = Array.from({ length: n }, () => INF);
  dist[goal] = 0;
  const heap = new HeapCopy();
  heap.push(goal, 0, 0);
  while (heap.items.length > 0) {
    const [at, d] = heap.pop();
    if (d > (dist[at] as number)) continue;
    for (const [u, w] of rev[at] as [number, number][]) {
      const nd = d + w;
      if (nd < (dist[u] as number)) {
        dist[u] = nd;
        heap.push(u, nd, nd);
      }
    }
  }
  return dist;
}

/** 시작 정점에서 각 정점까지의 실제 최소 비용. */
function fromDist(n: number, edges: Edge[], src: number): number[] {
  const flipped: Edge[] = edges.map(([u, v, w]) => [v, u, w]);
  return trueDist(n, flipped, src);
}

/** 계측본이 정본과 같은 답을 내는지 확인하고 계수를 돌려준다. */
export function measure(
  n: number,
  edges: Edge[],
  src: number,
  goal: number,
  h: (v: number) => number,
): Counted {
  const got = walkRun(n, edges, src, goal, h);
  const want = aStarSearch(n, edges, src, goal, h);
  if (got.answer !== want) {
    throw new Error(
      `계측본이 정본과 다른 답을 냈다 — ${got.answer} vs ${want}`,
    );
  }
  return got;
}

/* ────────────────────────── 변이 ────────────────────────── */

type Impl = {
  aStarSearch: (
    n: number,
    edges: Edge[],
    src: number,
    goal: number,
    h: (v: number) => number,
  ) => number;
};

const REF = new URL("./aStarSearch-guide.ref.ts", import.meta.url).pathname;

const RELAX_LINE = /^ {8}g\[v\] = ng;$/;
const STALE_LINE = /^ {4}if \(gu > \(g\[u\] as number\)\) continue;$/;
const KEY_LINE = /^ {8}open\.push\(v, ng, ng \+ h\(v\)\);$/;

/** 목표의 값을 줄인 그 자리에서 바로 반환하는 사본. */
const earlyReturn = await loadMutant<Impl>(REF, {
  swap: [RELAX_LINE, "        g[v] = ng;\n        if (v === goal) return ng;"],
});

/** 확장을 마친 정점의 값을 더는 못 고치게 막는 사본. 재확장이 없어진다. */
const noReopen = await loadMutant<Impl>(REF, {
  swap: [
    STALE_LINE,
    "    if (gu > (g[u] as number)) continue;\n    g[u] = Number.NEGATIVE_INFINITY;",
  ],
});

/** 뒤처진 기록을 버리는 줄이 없는 사본. */
const noStale = await loadMutant<Impl>(REF, { drop: STALE_LINE });

/** 추정을 두 배로 부풀려 키를 만드는 사본. */
const inflated = await loadMutant<Impl>(REF, {
  swap: [KEY_LINE, "        open.push(v, ng, ng + 2 * h(v));"],
});

/**
 * 중화 실행인가 — `loadMutant` 이 변이를 적용하지 않고 정본 모듈을 그대로 돌려주면 두
 * 함수가 **같은 객체**다. 중화 상태에서 아래 검사를 실행하면 언제나 던지게 되고, 그러면
 * `check-proof` 의 중화 대조가 이 편에서는 실행되지 않는다.
 */
const 중화됨 = earlyReturn.aStarSearch === aStarSearch;

interface Case {
  label: string;
  n: number;
  edges: Edge[];
  src: number;
  goal: number;
  h: (v: number) => number;
}

const WALK_CASE: Case = {
  label: "전개 입력",
  n: WALK_N,
  edges: WALK_EDGES,
  src: WALK_SRC,
  goal: WALK_GOAL,
  h: walkH,
};
const WALK_ZERO: Case = { ...WALK_CASE, label: "전개 입력 · 추정 0", h: zeroH };
const WALK_BROKEN: Case = {
  ...WALK_CASE,
  label: "전개 입력 · 일관성이 깨진 추정",
  h: brokenH,
};
const DETOUR_CASE: Case = {
  label: "돌아가는 경로가 더 작다",
  n: 4,
  edges: DETOUR,
  src: 0,
  goal: 3,
  h: detourH,
};
const NARROW_CASE: Case = {
  label: "두 경로의 비용 차이가 1",
  n: 4,
  edges: NARROW,
  src: 0,
  goal: 3,
  h: narrowH,
};
const CHAIN_CASE: Case = (() => {
  const c = chain(6);
  return {
    label: "사슬 여섯",
    n: c.n,
    edges: c.edges,
    src: 0,
    goal: 5,
    h: c.h,
  };
})();
const gridCase = (
  k: number,
  label: string,
  h?: (v: number) => number,
): Case => {
  const G = grid(k);
  return {
    label,
    n: G.n,
    edges: G.edges,
    src: 0,
    goal: G.goal,
    h: h ?? G.man,
  };
};
const GRID_CASE = gridCase(8, "격자 8×8");

if (!중화됨) {
  const breaking: [string, Impl, Case[]][] = [
    ["목표를 줄이는 자리에서 반환하는 판", earlyReturn, [DETOUR_CASE]],
    ["확장을 마친 정점을 다시 안 고치는 판", noReopen, [WALK_BROKEN]],
    ["추정을 두 배로 부풀린 판", inflated, [NARROW_CASE]],
  ];
  for (const [label, impl, cs] of breaking) {
    const same = cs.every(
      (c) =>
        aStarSearch(c.n, c.edges, c.src, c.goal, c.h) ===
        impl.aStarSearch(c.n, c.edges, c.src, c.goal, c.h),
    );
    if (same)
      throw new Error(`${label} 변이가 어느 입력에서도 답을 바꾸지 못했다`);
  }
}

const run = (impl: Impl, c: Case): number =>
  impl.aStarSearch(c.n, c.edges, c.src, c.goal, c.h);
const ref = (c: Case): number => aStarSearch(c.n, c.edges, c.src, c.goal, c.h);

/** 정본과 변이의 답을 나란히 놓은 표. */
function contrast(cs: Case[], impl: Impl, head: string): string {
  const rows = cs.map((c) => {
    const want = ref(c);
    const got = run(impl, c);
    return [
      c.label,
      comma(c.n),
      num(want),
      num(got),
      want === got ? "같다" : "어긋난다",
    ];
  });
  return md(["배치", "정점", "정본", head, "두 답"], rows, [1, 2, 3]);
}

/** 뒤처진 기록을 버리지 않는 판의 계수. 중화 실행이 아닐 때는 변이가 낸 답과 대조한다. */
function noStaleRun(c: Case): Counted {
  const got = walkRun(c.n, c.edges, c.src, c.goal, c.h, { noStale: true });
  if (!중화됨 && got.answer !== run(noStale, c)) {
    throw new Error("계측본이 변이와 다른 답을 냈다");
  }
  return got;
}

/** 추정을 두 배로 부풀린 판의 계수. 같은 자리에서 변이와 답을 대조한다. */
function inflatedRun(c: Case): Counted {
  const want = fromDist(c.n, c.edges, c.src)[c.goal] as number;
  const got = walkRun(
    c.n,
    c.edges,
    c.src,
    c.goal,
    c.h,
    { inflate: true },
    want,
  );
  if (!중화됨 && got.answer !== run(inflated, c)) {
    throw new Error("계측본이 변이와 다른 답을 냈다");
  }
  return got;
}

/** 키를 남은 비용의 추정 하나로 둔 판. 변이가 아니라 다른 설계라 대조할 상대가 없다. */
function greedy(c: Case): Counted {
  const want = fromDist(c.n, c.edges, c.src)[c.goal] as number;
  return walkRun(c.n, c.edges, c.src, c.goal, c.h, { keyOnlyH: true }, want);
}

/* ────────────────────────── 공용 값 ────────────────────────── */

const WALK_COUNT = measure(WALK_N, WALK_EDGES, WALK_SRC, WALK_GOAL, walkH);
const WALK_ZERO_COUNT = measure(WALK_N, WALK_EDGES, WALK_SRC, WALK_GOAL, zeroH);
export const WALK_TO_GOAL = trueDist(WALK_N, WALK_EDGES, WALK_GOAL);
const WALK_FROM_SRC = fromDist(WALK_N, WALK_EDGES, WALK_SRC);
const WALK_ANSWER = WALK_COUNT.answer;
const OVER_ANSWER = aStarSearch(WALK_N, WALK_EDGES, WALK_SRC, WALK_GOAL, overH);

/** 전개 입력의 최소 비용 경로 — 기록 사본의 부모를 거슬러 올라간 것. */
const WALK_PATH = pathOf((WALK.at(-1) as Step).pred, WALK_GOAL);

/** 완전 그래프에서 두 정점을 잇는 단순 경로의 수 = Σ_{k=0}^{V-2} (V-2)!/(V-2-k)! */
function completePaths(v: number): number {
  let sum = 0;
  let term = 1;
  for (let k = 0; k <= v - 2; k++) {
    sum += term;
    term *= v - 2 - k;
  }
  return sum;
}

/** 단순 경로의 수를 센다. 작은 입력은 전부 세어도 끝난다. */
function countPaths(
  n: number,
  edges: Edge[],
  src: number,
  goal: number,
): number {
  const adj: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) (adj[u] as number[]).push(v);
  const seen = Array.from({ length: n }, () => false);
  let total = 0;
  const go = (u: number): void => {
    if (u === goal) {
      total++;
      return;
    }
    seen[u] = true;
    for (const v of adj[u] as number[]) if (!seen[v]) go(v);
    seen[u] = false;
  };
  go(src);
  return total;
}

/** 완전 그래프 여섯에서 실제로 세어 식과 맞댄다 — 식이 틀리면 표 전체가 거짓이다. */
for (const v of [3, 4, 5, 6, 7]) {
  const edges: Edge[] = [];
  for (let a = 0; a < v; a++) {
    for (let b = 0; b < v; b++) if (a !== b) edges.push([a, b, 1]);
  }
  if (countPaths(v, edges, 0, v - 1) !== completePaths(v)) {
    throw new Error(`완전 그래프 ${v} 의 경로 수가 식과 다르다`);
  }
}

const PER_SEC = 100_000_000;
const sec = (ops: number): string => `${comma(Math.round(ops / PER_SEC))} 초`;

/** 규모의 상한에 드는 가장 큰 격자에서 두 키를 잰 값. */
const BIG = (() => {
  const G = grid(BIG_SIDE);
  return {
    side: BIG_SIDE,
    n: G.n,
    e: G.edges.length,
    withH: measure(G.n, G.edges, 0, G.goal, G.man),
    zero: measure(G.n, G.edges, 0, G.goal, zeroH),
  };
})();

const GRID16 = gridCase(16, "격자 16×16");

/** 「아이디어를 떠올리는 과정」의 시도 넷이 쓰는 수. 그림 사이드카가 이것을 받는다. */
export function originNumbers() {
  const greedyWalk = greedy(WALK_CASE);
  return {
    bruteV: 15,
    brutePaths: completePaths(15),
    bruteSec: sec(completePaths(15)),
    bigSide: BIG.side,
    bigN: BIG.n,
    bigE: BIG.e,
    zeroExpands: BIG.zero.expands,
    withExpands: BIG.withH.expands,
    greedyAnswer: greedyWalk.answer,
    walkAnswer: WALK_ANSWER,
    vLimit: V_LIMIT,
    eLimit: E_LIMIT,
  };
}

/** 격자 한 변 `k` 에서 두 판이 확장한 정점과 그 차례. 그림 사이드카가 격자 그림에 쓴다. */
export function gridExpansion(k: number): {
  withH: Counted;
  zero: Counted;
  goal: number;
} {
  const G = grid(k);
  return {
    withH: measure(G.n, G.edges, 0, G.goal, G.man),
    zero: measure(G.n, G.edges, 0, G.goal, zeroH),
    goal: G.goal,
  };
}

/* ────────────────────────── 블록 ────────────────────────── */

const RATIOS = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

/** 여러 배치에서 추정을 쓴 판과 안 쓴 판을 나란히 잰다. */
function bothWays(cs: Case[]): string[][] {
  return cs.map((c) => {
    const withH = measure(c.n, c.edges, c.src, c.goal, c.h);
    const without = measure(c.n, c.edges, c.src, c.goal, zeroH);
    return [
      c.label,
      comma(c.n),
      comma(c.edges.length),
      num(withH.answer),
      comma(withH.expands),
      comma(without.expands),
      withH.answer === without.answer ? "같다" : "어긋난다",
    ];
  });
}

function conceptCases(): string {
  const C = chain(64);
  const S = star(64);
  const cs: Case[] = [
    WALK_CASE,
    { label: "사슬 64", n: C.n, edges: C.edges, src: 0, goal: 63, h: C.h },
    { label: "별 64", n: S.n, edges: S.edges, src: 0, goal: 63, h: S.h },
    GRID_CASE,
    GRID16,
  ];
  const rows = bothWays(cs);
  const same = rows.filter((r) => r[6] === "같다").length;
  const gap = rows.reduce((a, r) =>
    Number((r[5] ?? "0").replaceAll(",", "")) -
      Number((r[4] ?? "0").replaceAll(",", "")) >
    Number((a[5] ?? "0").replaceAll(",", "")) -
      Number((a[4] ?? "0").replaceAll(",", ""))
      ? r
      : a,
  );
  const chainRow = rows[1] as string[];
  return [
    md(
      [
        "배치",
        "정점",
        "간선",
        "답",
        "추정을 쓴 판의 확장",
        "추정이 0 인 판의 확장",
        "두 답",
      ],
      rows,
      [1, 2, 3, 4, 5],
    ),
    "",
    `배치 ${comma(rows.length)} 개 가운데 두 판의 답이 같은 배치가 ${comma(same)} 개입니다. 확장한 정점 수의 차이가 가장 큰 배치는 ${gap[0]} 이고 ${gap[4]} 대 ${gap[5]} 입니다. 사슬 64 는 지나갈 길이 하나뿐이라 두 판 모두 ${chainRow[4]} 개를 확장합니다.`,
  ].join("\n");
}

function conceptGrowth(): string {
  const sides = [8, 16, 32, 64];
  const got = sides.map((k) => {
    const G = grid(k);
    return {
      k,
      n: G.n,
      withH: measure(G.n, G.edges, 0, G.goal, G.man).expands,
      without: measure(G.n, G.edges, 0, G.goal, zeroH).expands,
    };
  });
  const rows = got.map((r) => [
    `${r.k}×${r.k}`,
    comma(r.n),
    comma(r.withH),
    comma(r.without),
  ]);
  const grow = got.slice(1).map((r, at) => {
    const prev = got[at] as (typeof got)[number];
    return [
      `${prev.k} → ${r.k}`,
      (r.n / prev.n).toFixed(2),
      (r.withH / prev.withH).toFixed(2),
      (r.without / prev.without).toFixed(2),
    ];
  });
  return [
    md(
      ["격자", "정점", "추정을 쓴 판의 확장", "추정이 0 인 판의 확장"],
      rows,
      [1, 2, 3],
    ),
    "",
    "한 변을 두 배로 늘릴 때마다 몇 배가 되었는지 나누면 이렇습니다.",
    "",
    md(
      ["한 변", "정점", "추정을 쓴 판의 확장", "추정이 0 인 판의 확장"],
      grow,
      [1, 2, 3],
    ),
    "",
    `정점이 ${(got[1] as (typeof got)[number]).n / (got[0] as (typeof got)[number]).n} 배가 될 때 추정이 0 인 판의 확장은 ${grow.map((g) => g[3]).join(" · ")} 배이고, 추정을 쓴 판은 ${grow.map((g) => g[2]).join(" · ")} 배입니다.`,
  ].join("\n");
}

function originBrute(): string {
  const sizes = [5, 8, 10, 12, 15];
  const rows = sizes.map((v) => {
    const p = completePaths(v);
    return [comma(v), comma(p), p >= PER_SEC ? sec(p) : "1 초 안"];
  });
  const walkPaths = countPaths(WALK_N, WALK_EDGES, WALK_SRC, WALK_GOAL);
  const small = [3, 4, 5, 6, 7];
  return [
    md(["정점", "단순 경로의 수", "1 초에 1 억 개를 만들 때"], rows, [0, 1]),
    "",
    `정점 ${small.join(" · ")} 개인 완전 그래프 ${comma(small.length)} 개에서 경로를 하나씩 세어 식과 맞댔고, 모두 일치했습니다. 전개 입력은 간선이 ${comma(WALK_EDGES.length)} 개뿐이라 시작에서 목표까지의 경로가 ${comma(walkPaths)} 개입니다.`,
  ].join("\n");
}

function originDijkstra(): string {
  const far = WALK_FROM_SRC[7] as number;
  const order = (c: Counted): string => c.order.join(" → ");
  const rows = [
    [
      "비용 g",
      order(WALK_ZERO_COUNT),
      comma(WALK_ZERO_COUNT.expands),
      WALK_ZERO_COUNT.expanded[7] ? "확장한다" : "안 한다",
      num(WALK_ZERO_COUNT.answer),
    ],
    [
      "비용 g + 추정 h",
      order(WALK_COUNT),
      comma(WALK_COUNT.expands),
      WALK_COUNT.expanded[7] ? "확장한다" : "안 한다",
      num(WALK_COUNT.answer),
    ],
  ];
  return [
    md(["키", "확장한 차례", "확장한 정점 수", "정점 7", "답"], rows, [2, 4]),
    "",
    `두 판의 답은 ${num(WALK_ANSWER)}${으로(num(WALK_ANSWER))} 같습니다. 정점 7 의 키는 비용 ${far} 에 추정 ${walkH(7)}${을를(walkH(7))} 더한 ${far + walkH(7)} 입니다.`,
  ].join("\n");
}

function originScale(): string {
  const cols = (c: Counted): string[] => [
    comma(c.expands),
    comma(c.pushes),
    comma(basicOps(c)),
    num(c.answer),
  ];
  const rows = [
    ["비용 g", ...cols(BIG.zero)],
    ["비용 g + 추정 h", ...cols(BIG.withH)],
  ];
  const ratio = basicOps(BIG.zero) / basicOps(BIG.withH);
  return [
    md(
      ["키", "확장한 정점", "큐에 넣은 항목", "기본 연산", "답"],
      rows,
      [1, 2, 3, 4],
    ),
    "",
    `격자 ${BIG.side}×${BIG.side} 는 정점 ${comma(BIG.n)} 개 · 방향 간선 ${comma(BIG.e)} 개로, 간선이 규모의 상한 ${comma(E_LIMIT)} 안에 드는 가장 큰 정사각 격자입니다. 키가 비용뿐인 판은 정점 ${comma(BIG.n)} 개 가운데 ${comma(BIG.zero.expands)} 개를 확장했고, 기본 연산이 추정을 더한 판의 ${ratio.toFixed(1)} 배입니다.`,
  ].join("\n");
}

function originKeys(): string {
  const cs: Case[] = [WALK_CASE, GRID16];
  const rows: string[][] = [];
  for (const c of cs) {
    const onlyG = measure(c.n, c.edges, c.src, c.goal, zeroH);
    const onlyH = greedy(c);
    const both = measure(c.n, c.edges, c.src, c.goal, c.h);
    const want = fromDist(c.n, c.edges, c.src)[c.goal] as number;
    for (const [key, x] of [
      ["비용 g", onlyG],
      ["추정 h", onlyH],
      ["비용 g + 추정 h", both],
    ] as const) {
      rows.push([
        c.label,
        key,
        num(x.answer),
        comma(x.expands),
        x.answer === want ? "최소다" : "최소가 아니다",
      ]);
    }
  }
  const wrong = rows.filter((r) => r[4] === "최소가 아니다");
  return [
    md(["배치", "키", "답", "확장한 정점 수", "최소 여부"], rows, [2, 3]),
    "",
    `여섯 줄 가운데 답이 최소가 아닌 줄은 ${comma(wrong.length)} 개이고, 모두 키가 추정 h 하나인 줄입니다.`,
  ].join("\n");
}

function buildAdmissible(): string {
  const rows = Array.from({ length: WALK_N }, (_, v) => {
    const [x, y] = WALK_XY[v] as [number, number];
    const d = WALK_TO_GOAL[v] as number;
    return [
      String(v),
      `(${x}, ${y})`,
      String(walkH(v)),
      num(d),
      walkH(v) <= d ? "넘지 않는다" : "넘는다",
    ];
  });
  const over = rows.filter((r) => r[4] === "넘는다").length;
  return [
    md(
      [
        "정점",
        "좌표",
        "추정 h(v)",
        "실제 최소 비용 d(v, goal)",
        "실제 값과의 비교",
      ],
      rows,
      [2, 3],
    ),
    "",
    `정점 ${comma(WALK_N)} 개 가운데 추정이 실제 최소 비용을 넘는 정점은 ${comma(over)} 개입니다.`,
  ].join("\n");
}

function buildReadOne(): string {
  const v = 4;
  const [x, y] = WALK_XY[v] as [number, number];
  const [gx, gy] = WALK_XY[WALK_GOAL] as [number, number];
  const path = pathOfTo(v);
  const costs = path.slice(1).map((b, i) => {
    const a = path[i] as number;
    return (WALK_EDGES.find(([p, q]) => p === a && q === b) as Edge)[2];
  });
  const d = WALK_TO_GOAL[v] as number;
  const rows = [
    ["정점의 좌표", "xy[4]", `(${x}, ${y})`],
    ["목표의 좌표", "xy[6]", `(${gx}, ${gy})`],
    ["추정", `\\|${gx} − ${x}\\| + \\|${gy} − ${y}\\|`, String(walkH(v))],
    ["비용이 가장 작은 경로", arrow(path), `${costs.join(" + ")} = ${d}`],
    [
      "둘의 관계",
      `${walkH(v)} ≤ ${d}`,
      walkH(v) <= d ? "넘지 않는다" : "넘는다",
    ],
  ];
  return md(["항", "보는 것", "값"], rows);
}

/** 정점 `v` 에서 목표까지 실제로 가장 싼 경로 — 뒤집은 그래프의 최단 경로를 따라간다. */
function pathOfTo(v: number): number[] {
  const out = [v];
  let at = v;
  while (at !== WALK_GOAL) {
    const next = WALK_EDGES.find(
      ([a, b, w]) =>
        a === at &&
        (WALK_TO_GOAL[b] as number) + w === (WALK_TO_GOAL[at] as number),
    );
    if (!next) break;
    at = next[1];
    out.push(at);
  }
  return out;
}

function buildEdge(): string {
  const rows = WALK_EDGES.map(([u, v, w]) => {
    const drop = walkH(u) - walkH(v);
    return [
      `${u}→${v}`,
      String(w),
      String(walkH(u)),
      String(walkH(v)),
      String(drop),
      drop <= w ? "넘지 않는다" : "넘는다",
    ];
  });
  const over = rows.filter((r) => r[5] === "넘는다").length;
  const neg = rows.filter((r) => Number(r[4]) < 0).length;
  return [
    md(
      [
        "간선",
        "가중치 w",
        "h(u)",
        "h(v)",
        "줄어든 추정 h(u) − h(v)",
        "w 와의 비교",
      ],
      rows,
      [1, 2, 3, 4],
    ),
    "",
    `간선 ${comma(rows.length)} 개 가운데 줄어든 추정이 가중치를 넘는 간선은 ${comma(over)} 개입니다. 줄어든 추정이 음수인 간선(목표에서 멀어지는 간선)은 ${comma(neg)} 개입니다.`,
  ].join("\n");
}

function buildOver(): string {
  const plain = record(WALK_N, WALK_EDGES, WALK_SRC, WALK_GOAL, walkH);
  const over = record(WALK_N, WALK_EDGES, WALK_SRC, WALK_GOAL, overH);
  const popped = (s: Step[]): string =>
    s
      .filter((x) => x.popped)
      .map((x) => String((x.popped as Item)[0]))
      .join(" → ");
  const pathOver = pathOf((over.at(-1) as Step).pred, WALK_GOAL);
  const rows = [
    [
      "맨해튼 거리",
      String(walkH(OVER_AT)),
      popped(plain),
      arrow(WALK_PATH),
      num(WALK_ANSWER),
    ],
    [
      `정점 ${OVER_AT} 만 ${OVER_VALUE}`,
      String(overH(OVER_AT)),
      popped(over),
      arrow(pathOver),
      num(OVER_ANSWER),
    ],
  ];
  const d1 = WALK_TO_GOAL[OVER_AT] as number;
  return [
    md(["추정", `h(${OVER_AT})`, "꺼낸 차례", "답의 경로", "답"], rows, [1, 4]),
    "",
    `두 추정은 정점 ${OVER_AT} 하나에서만 다르고, 정점 ${OVER_AT} 의 실제 최소 비용은 ${d1} 입니다. 정점 ${OVER_AT} 의 추정을 ${OVER_VALUE}${으로(OVER_VALUE)} 두면 답이 ${num(WALK_ANSWER)} 에서 ${num(OVER_ANSWER)}${으로(num(OVER_ANSWER))} 바뀝니다.`,
  ].join("\n");
}

function buildWhy(): string {
  const rows = WALK_PATH.map((v) => {
    const g = WALK_FROM_SRC[v] as number;
    return [
      String(v),
      num(g),
      String(walkH(v)),
      num(g + walkH(v)),
      String(overH(v)),
      num(g + overH(v)),
    ];
  });
  const overKey = (WALK_FROM_SRC[OVER_AT] as number) + OVER_VALUE;
  return [
    md(
      [
        "최소 비용 경로의 정점",
        "시작에서의 최소 비용",
        "맨해튼 추정",
        "맨해튼 키",
        "정점 1 만 넘는 추정",
        "그때의 키",
      ],
      rows,
      [1, 2, 3, 4, 5],
    ),
    "",
    `맨해튼 거리에서는 최소 비용 경로 위 정점의 키가 모두 답 ${num(WALK_ANSWER)} 이하입니다. 정점 ${OVER_AT} 만 넘는 추정에서는 정점 ${OVER_AT} 의 키가 ${overKey}${josa(overKey, "이라서", "라서")}, 키 ${num(OVER_ANSWER)}${으로(num(OVER_ANSWER))} 목표를 먼저 꺼냅니다.`,
  ].join("\n");
}

function stageStart(): string {
  const first = WALK[0] as Step;
  const rows = Array.from({ length: WALK_N }, (_, u) => [
    String(u),
    WALK_EDGES.filter(([a]) => a === u)
      .map(([, v, w]) => `(${v}, ${w})`)
      .join(" ") || "없음",
    num(first.g[u] as number),
    String(walkH(u)),
  ]);
  return [
    md(["정점", "adj — (이웃, 가중치)", "g", "h"], rows, [3]),
    "",
    `이웃 목록의 칸은 모두 ${comma(WALK_EDGES.length)} 개로 간선 수와 같고, 우선순위 큐에는 항목 ${item(first.heap[0] as Item)} 하나가 들어 있습니다.`,
  ].join("\n");
}

function stageKey(): string {
  const s = WALK[1] as Step;
  const order = drainOrder(s.heap);
  const rows = s.pushed.map(([v, g, f]) => {
    const w = (WALK_EDGES.find(([a, b]) => a === 0 && b === v) as Edge)[2];
    return [
      String(v),
      String(w),
      String(g),
      String(walkH(v)),
      String(f),
      String(order.findIndex((x) => x[0] === v) + 1),
    ];
  });
  const byCost = [...s.pushed].sort((a, b) => a[1] - b[1])[0] as Item;
  const byKey = order[0] as Item;
  return [
    md(
      ["정점", "간선 가중치", "비용 g", "추정 h", "키 g + h", "꺼낼 차례"],
      rows,
      [1, 2, 3, 4, 5],
    ),
    "",
    `비용이 가장 작은 것은 정점 ${byCost[0]} 이고 키가 가장 작은 것은 정점 ${byKey[0]} 입니다. 큐 맨 앞은 정점 ${byKey[0]} 입니다.`,
  ].join("\n");
}

function stageRelax(): string {
  const at = WALK.slice(2, 5);
  const rows = at.map((s) => {
    const did = s.relax
      .map((r) => `${r.u}→${r.v} g[${r.v}] = ${num(r.before)} → ${num(r.ng)}`)
      .join(" / ");
    const order = drainOrder(s.heap);
    const stale = order.filter((x) => isStale(s, x));
    return [
      s.t,
      item(s.popped as Item),
      did,
      items(order),
      stale.length === 0 ? "없음" : items(stale),
    ];
  });
  const t5 = WALK[4] as Step;
  const two = drainOrder(t5.heap).filter((x) => x[0] === 3);
  return [
    md(
      [
        "걸음",
        "꺼낸 항목",
        "완화",
        "걸음이 끝난 뒤 큐 — 꺼낼 차례",
        "그중 뒤처진 기록",
      ],
      rows,
    ),
    "",
    `${t5.t}${이가(t5.t)} 끝나면 정점 3 짜리 항목이 ${comma(two.length)} 개 들어 있고, 그중 뒤처진 기록은 ${items(two.filter((x) => isStale(t5, x)))} 입니다.`,
  ].join("\n");
}

function premiseNegative(): string {
  const c: Case = {
    label: "0→2(1) 0→1(5) 1→2(-10)",
    n: 3,
    edges: NEGATIVE,
    src: 0,
    goal: 2,
    h: zeroH,
  };
  const got = ref(c);
  const all = allPathsMin(c);
  return [
    md(
      ["입력", "추정", "정본의 답", "경로를 전부 만든 답", "두 답"],
      [
        [
          c.label,
          "전부 0",
          num(got),
          num(all),
          got === all ? "같다" : "어긋난다",
        ],
      ],
      [2, 3],
    ),
    "",
    `정본은 목표 ${c.goal}${을를(c.goal)} 키 ${num(got)}${으로(num(got))} 먼저 꺼내 멈추고, 비용이 ${num(all)} 인 경로를 보지 못합니다.`,
  ].join("\n");
}

/** 단순 경로를 전부 만들어 가장 작은 비용을 고른다 — 음수 가중치의 답을 따로 구하는 데 쓴다. */
function allPathsMin(c: Case): number {
  const adj = adjacency(c.n, c.edges);
  const seen = Array.from({ length: c.n }, () => false);
  let best = INF;
  const go = (u: number, spent: number): void => {
    if (u === c.goal) best = Math.min(best, spent);
    seen[u] = true;
    for (const [v, w] of adj[u] as [number, number][]) {
      if (!seen[v]) go(v, spent + w);
    }
    seen[u] = false;
  };
  go(c.src, 0);
  return best;
}

function buildRatio(): string {
  const G = grid(32);
  const got = RATIOS.map((p) => ({
    p,
    c: measure(G.n, G.edges, 0, G.goal, patchy(G.man, p)),
  }));
  const rows = got.map(({ p, c }) => [
    `${p}%`,
    comma(c.expands),
    comma(c.reexpands),
    comma(basicOps(c)),
    num(c.answer),
  ]);
  const least = got.reduce((a, b) => (b.c.expands < a.c.expands ? b : a));
  const most = got.reduce((a, b) => (b.c.expands > a.c.expands ? b : a));
  const answers = new Set(got.map((x) => x.c.answer));
  const reopened = got.filter((x) => x.c.reexpands > 0).map((x) => `${x.p}%`);
  return [
    md(
      [
        "정확한 추정을 받은 정점",
        "확장한 정점",
        "그중 재확장",
        "기본 연산",
        "답",
      ],
      rows,
      [1, 2, 3, 4],
    ),
    "",
    `격자 32×32 (정점 ${comma(G.n)} · 방향 간선 ${comma(G.edges.length)}) 에서 잰 값이고, 답의 종류는 ${comma(answers.size)} 가지입니다. 확장이 가장 적은 비율은 ${least.p}% (${comma(least.c.expands)} 개), 가장 많은 비율은 ${most.p}% (${comma(most.c.expands)} 개)입니다. 재확장이 0 이 아닌 비율은 ${reopened.join(" · ")} 입니다.`,
  ].join("\n");
}

function walkInput(): string {
  const edges = WALK_EDGES.map((e) => `[${e.join(", ")}]`).join(", ");
  const xy = WALK_XY.map(([x, y]) => `[${x}, ${y}]`).join(", ");
  return [
    `const n = ${WALK_N};`,
    "const edges: [number, number, number][] = [",
    `  ${edges},`,
    "];",
    `const src = ${WALK_SRC};`,
    `const goal = ${WALK_GOAL};`,
    `const xy: [number, number][] = [${xy}];`,
    "const h = (v: number): number =>",
    "  Math.abs(xy[goal][0] - xy[v][0]) + Math.abs(xy[goal][1] - xy[v][1]);",
    `// 이 절이 끝나면 나와야 하는 값: ${num(WALK_ANSWER)}`,
  ].join("\n");
}

function walkT1(): string {
  const s = WALK[0] as Step;
  const adj = Array.from(
    { length: WALK_N },
    (_, u) =>
      `${u}:[${WALK_EDGES.filter(([a]) => a === u)
        .map(([, v, w]) => `(${v}, ${w})`)
        .join(" ")}]`,
  ).join("  ");
  return [
    "T1 이 끝난 시점",
    ...lines([
      ["g", show(s.g)],
      ["adj", adj],
      ["open", items(drainOrder(s.heap))],
    ]),
  ].join("\n");
}

function walkHeap(): string {
  const t2 = WALK[1] as Step;
  const heap = new HeapCopy();
  const rows: [string, string][] = [["넣기 전", "[]"]];
  for (const x of t2.pushed) {
    heap.push(...x);
    rows.push([
      `${item(x)}${을를(x[2])} 넣은 뒤`,
      `[${heap.items.map(item).join(", ")}]`,
    ]);
  }
  const out = heap.pop();
  rows.push([
    "한 번 꺼낸 뒤",
    `[${heap.items.map(item).join(", ")}]  꺼낸 항목 ${item(out)}`,
  ]);
  return [
    "T2 가 넣는 항목 셋을 빈 힙에 차례로 넣고 한 번 꺼낸다 — 배열에 놓인 순서 그대로",
    ...lines(rows),
  ].join("\n");
}

function walkT2(): string {
  const s = WALK[1] as Step;
  const [u, gu, f] = s.popped as Item;
  const before = (WALK[0] as Step).g[u] as number;
  const rows: string[][] = [
    ["꺼낸 항목", item([u, gu, f])],
    ["목표인가", `${u} === ${WALK_GOAL} 이 거짓`],
    ["뒤처진 기록인가", `${gu} > g[${u}] = ${num(before)} 이 거짓`],
    ...s.relax.map((r) => [
      `${r.u}→${r.v} 완화`,
      `${num(r.before)} > ${r.gu} + ${r.w}${josa(r.w, "이라", "라")} g[${r.v}] = ${r.ng} · 키 ${r.ng} + ${walkH(r.v)} = ${r.key} · 큐에 ${item([r.v, r.ng, r.key])}`,
    ]),
    ["큐 — 꺼낼 차례", items(drainOrder(s.heap))],
  ];
  return md([`${s.t} 에서 본 것`, "값"], rows);
}

function pauseEarly(): string {
  const want = ref(DETOUR_CASE);
  const got = run(earlyReturn, DETOUR_CASE);
  return [
    contrast(
      [DETOUR_CASE, WALK_CASE, CHAIN_CASE, GRID_CASE, NARROW_CASE],
      earlyReturn,
      "줄이자마자 반환하는 판",
    ),
    "",
    `돌아가는 경로가 더 작은 배치에서 정본은 ${num(want)}, 줄이자마자 반환하는 판은 ${num(got)}${을를(num(got))} 냅니다.`,
  ].join("\n");
}

function walkT5T8(): string {
  const t5 = WALK[4] as Step;
  const t8 = WALK[7] as Step;
  const r = t5.relax[0] as Relax;
  const [u8, g8, f8] = t8.popped as Item;
  const g8now = (WALK[6] as Step).g[u8] as number;
  const rows: string[][] = [
    [t5.t, "꺼낸 항목", item(t5.popped as Item)],
    [
      t5.t,
      `${r.u}→${r.v} 완화`,
      `${num(r.before)} > ${r.gu} + ${r.w}${josa(r.w, "이라", "라")} g[${r.v}] = ${r.ng} · 큐에 ${item([r.v, r.ng, r.key])}`,
    ],
    [t5.t, "큐 — 꺼낼 차례", items(drainOrder(t5.heap))],
    [t8.t, "꺼낸 항목", item([u8, g8, f8])],
    [
      t8.t,
      "뒤처진 기록인가",
      `${g8} > g[${u8}] = ${num(g8now)} 이 참이라 버린다`,
    ],
    [t8.t, "큐 — 꺼낼 차례", items(drainOrder(t8.heap))],
  ];
  return md(["걸음", "본 것", "값"], rows);
}

const PAUSE_STALE_CASES = [
  WALK_CASE,
  WALK_BROKEN,
  DETOUR_CASE,
  CHAIN_CASE,
  GRID_CASE,
];

function pauseStale(): string {
  return [
    contrast(PAUSE_STALE_CASES, noStale, "버리는 줄이 없는 판"),
    "",
    `배치 ${comma(PAUSE_STALE_CASES.length)} 개 가운데 두 답이 같은 배치는 ${comma(PAUSE_STALE_CASES.filter((c) => ref(c) === run(noStale, c)).length)} 개입니다.`,
  ].join("\n");
}

function pauseStaleWork(): string {
  const D = denseDag(128);
  const cs: Case[] = [
    WALK_CASE,
    WALK_BROKEN,
    gridCase(16, "격자 16×16 · 추정 30%", patchy(grid(16).man, 30)),
    {
      label: "완전 DAG 128 · 추정이 정확",
      n: D.n,
      edges: D.edges,
      src: 0,
      goal: 127,
      h: D.h,
    },
    {
      label: "완전 DAG 128 · 추정이 전부 0",
      n: D.n,
      edges: D.edges,
      src: 0,
      goal: 127,
      h: zeroH,
    },
  ];
  const got = cs.map((c) => ({
    c,
    keep: measure(c.n, c.edges, c.src, c.goal, c.h),
    drop: noStaleRun(c),
  }));
  const rows = got.map((r) => [
    r.c.label,
    comma(r.keep.stale),
    comma(r.keep.expands),
    comma(r.drop.expands),
    comma(r.drop.expands - r.keep.expands),
  ]);
  const worst = got.reduce((a, b) =>
    b.drop.expands - b.keep.expands > a.drop.expands - a.keep.expands ? b : a,
  );
  return [
    md(
      [
        "배치",
        "정본이 버린 항목",
        "정본의 확장",
        "버리는 줄이 없는 판의 확장",
        "늘어난 확장",
      ],
      rows,
      [1, 2, 3, 4],
    ),
    "",
    `늘어난 확장이 가장 많은 배치는 「${worst.c.label}」 이고, 정본이 버린 항목 ${comma(worst.keep.stale)} 개를 그 판은 하나씩 확장합니다.`,
  ].join("\n");
}

/** 전개 표의 조건 칸 — 꺼낸 걸음마다 ③ 과 ④ 를 실제 값으로 판정한다. */
function walkTrace(): string {
  const hit: Record<string, string[]> = {
    start: [],
    loopTrue: [],
    goalTrue: [],
    goalFalse: [],
    staleTrue: [],
    staleFalse: [],
    fixed: [],
    kept: [],
  };
  const rows = WALK.map((s, i) => {
    let cond = "";
    let did = "";
    if (s.kind === "start") {
      cond = `\`g[${WALK_SRC}] = 0\``;
      did = `① 시작값 · 큐에 ${item(s.pushed[0] as Item)}`;
      hit.start?.push(s.t);
    } else {
      const [u, gu] = s.popped as Item;
      hit.loopTrue?.push(s.t);
      const before = (WALK[i - 1] as Step).g[u] as number;
      if (s.kind === "goal") {
        cond = `\`${u} === goal\` 이 **참**`;
        did = `③ ${num(gu)}${을를(num(gu))} 돌려준다`;
        hit.goalTrue?.push(s.t);
      } else {
        hit.goalFalse?.push(s.t);
        if (s.kind === "stale") {
          cond = `\`${u} === goal\` 거짓 · \`${gu} > g[${u}]\` 이 **참** (${gu} > ${num(before)})`;
          did = "④ 뒤처진 기록이라 버린다";
          hit.staleTrue?.push(s.t);
        } else {
          cond = `\`${u} === goal\` 거짓 · \`${gu} > g[${u}]\` 이 **거짓** (${gu} > ${num(before)})`;
          hit.staleFalse?.push(s.t);
          const parts = s.relax.map((r) =>
            r.improved
              ? `${r.u}→${r.v} ${r.ng} < ${num(r.before)} 참 · 키 ${r.key}`
              : `${r.u}→${r.v} ${r.ng} < ${num(r.before)} 거짓 · 그대로`,
          );
          if (s.relax.some((r) => r.improved)) hit.fixed?.push(s.t);
          if (s.relax.some((r) => !r.improved)) hit.kept?.push(s.t);
          did = `⑤ ${parts.join(" / ")}`;
        }
      }
    }
    return [
      s.t,
      s.popped ? item(s.popped) : "—",
      cond,
      did,
      show(s.g),
      items(drainOrder(s.heap)),
    ];
  });
  const t = (k: string) => tList(hit[k] ?? []);
  const end = WALK.at(-1) as Step;
  const left = drainOrder(end.heap);
  return [
    md(
      ["걸음", "꺼낸 항목", "조건 판정", "한 일", "g", "큐 — 꺼낼 차례"],
      rows,
    ),
    "",
    `① 은 ${t("start")} 에서 실행됐습니다. ② 는 ${t("loopTrue")} 에서 참입니다. ③ 은 ${t("goalTrue")} 에서 참이고 ${t("goalFalse")} 에서 거짓, ④ 는 ${t("staleTrue")} 에서 참이고 ${t("staleFalse")} 에서 거짓입니다. ⑤ 가 값을 고친 걸음은 ${t("fixed")} 이고, 고치지 않은 간선이 나온 걸음은 ${hit.kept?.length ? t("kept") : "없습니다"}. 반환값은 ${num((end.popped as Item)[1])} 이고, 큐에 남은 항목은 ${items(left)} 입니다.`,
  ].join("\n");
}

/** 전개 입력에서 거짓 쪽이 안 나온 두 조건을 작은 입력 둘로 실행한다. */
function walkBranches(): string {
  const cs: { label: string; c: Case; which: string }[] = [
    {
      label: "0→1(2), 목표 2",
      c: { label: "", n: 3, edges: [[0, 1, 2]], src: 0, goal: 2, h: zeroH },
      which: "②",
    },
    {
      label: "0→1(3) 0→1(10), 목표 1",
      c: {
        label: "",
        n: 2,
        edges: [
          [0, 1, 3],
          [0, 1, 10],
        ],
        src: 0,
        goal: 1,
        h: zeroH,
      },
      which: "⑤",
    },
  ];
  const rows = cs.map(({ label, c, which }) => {
    const steps = record(c.n, c.edges, c.src, c.goal, c.h);
    const kept = steps.flatMap((s) => s.relax.filter((r) => !r.improved));
    const endEmpty = (steps.at(-1) as Step).kind !== "goal";
    const what =
      which === "②"
        ? endEmpty
          ? "큐가 비어 반복이 끝난다 — `open.size() > 0` 이 거짓"
          : "목표를 꺼냈다"
        : kept.length > 0
          ? kept
              .map(
                (r) => `${r.u}→${r.v} ${r.ng} < ${num(r.before)} 거짓 · 그대로`,
              )
              .join(" / ")
          : "고치지 않은 간선이 없다";
    return [label, which, what, num(ref(c))];
  });
  return md(["입력", "조건", "거짓이 된 자리", "반환값"], rows, [3]);
}

function pauseClosed(): string {
  const cs = [WALK_BROKEN, WALK_CASE, WALK_ZERO, CHAIN_CASE, GRID_CASE];
  const want = ref(WALK_BROKEN);
  const got = run(noReopen, WALK_BROKEN);
  const broken = measure(
    WALK_BROKEN.n,
    WALK_BROKEN.edges,
    WALK_BROKEN.src,
    WALK_BROKEN.goal,
    WALK_BROKEN.h,
  );
  return [
    contrast(cs, noReopen, "다시 안 고치는 판"),
    "",
    `일관성이 깨진 추정에서 정본은 정점을 ${comma(broken.reexpands)} 번 다시 확장해 ${num(want)}${을를(num(want))} 내고, 다시 안 고치는 판은 ${num(got)}${을를(num(got))} 냅니다.`,
  ].join("\n");
}

function pauseClosedWhere(): string {
  const steps = record(
    WALK_BROKEN.n,
    WALK_BROKEN.edges,
    WALK_BROKEN.src,
    WALK_BROKEN.goal,
    WALK_BROKEN.h,
  );
  const threes = steps.filter(
    (s) => s.kind === "expand" && (s.popped as Item)[0] === 3,
  );
  const rows = steps
    .filter((s) => s.popped)
    .map((s, i) => [
      String(i + 1),
      item(s.popped as Item),
      s.kind === "expand"
        ? `확장 · ${s.relax.map((r) => (r.improved ? `g[${r.v}] = ${r.ng}` : `${r.v} 그대로`)).join(" · ") || "나가는 간선 없음"}`
        : s.kind === "stale"
          ? "뒤처진 기록이라 버림"
          : "목표라 반환",
    ]);
  return [
    md(["꺼낸 차례", "꺼낸 항목", "한 일"], rows, [0]),
    "",
    `정본은 정점 3 을 ${comma(threes.length)} 번 확장합니다 — 처음은 비용 ${((threes[0] as Step).popped as Item)[1]}, 다음은 비용 ${((threes[1] as Step).popped as Item)[1]} 입니다.`,
  ].join("\n");
}

function walkResult(): string {
  const calls: [
    string,
    number,
    Edge[],
    number,
    number,
    (v: number) => number,
  ][] = [
    [
      `aStarSearch(8, [${WALK_EDGES.map((e) => `[${e.join(",")}]`).join(",")}], 0, 6, h)`,
      WALK_N,
      WALK_EDGES,
      WALK_SRC,
      WALK_GOAL,
      walkH,
    ],
    [
      "aStarSearch(8, 같은 간선, 0, 6, () => 0)",
      WALK_N,
      WALK_EDGES,
      0,
      6,
      zeroH,
    ],
    ["aStarSearch(3, [[0,1,2]], 0, 2, () => 0)", 3, [[0, 1, 2]], 0, 2, zeroH],
    ["aStarSearch(3, [[0,1,10]], 1, 1, () => 0)", 3, [[0, 1, 10]], 1, 1, zeroH],
    ["aStarSearch(1, [], 0, 0, () => 0)", 1, [], 0, 0, zeroH],
  ];
  const w = Math.max(...calls.map(([s]) => width(s)));
  return [
    ...calls.map(
      ([s, n, e, a, b, h]) =>
        `${pad(s, w)}  -> ${num(aStarSearch(n, e, a, b, h))}`,
    ),
  ].join("\n");
}

/** purpose.alt — 순서가 뒤집히는 자리와 두 배수. 비는 `.alt.ts` 의 기본 연산에서 소수 한 자리로 반올림해 낸다. */
function altFlip(): string {
  const mine = altCases["이 가이드의 절차"]();
  const rival = altCases["양방향 다익스트라"]();
  const edge = altCases.경계();
  const last = edge["양방향이 마지막으로 앞선 비율"];
  const worst = edge["이 절차의 기본 연산이 가장 큰 비율"];
  const at = (who: Record<string, number>, p: number | string): number =>
    who[`격자 · 추정 ${p}% · 기본 연산`] as number;
  const b = at(rival, 100);
  for (const p of [0, worst, last, last + 1]) {
    if (at(rival, p) !== b)
      throw new Error("양방향의 계수가 추정에 따라 달라졌다");
  }
  const x = (a: number, c: number): string => (a / c).toFixed(1);
  const before = at(mine, last);
  const after = at(mine, last + 1);
  const full = at(mine, 100);
  const zero = at(mine, 0);
  const peak = at(mine, worst);
  return (
    `**순서가 뒤집힙니다.** 정확한 추정을 받은 정점이 ${last}% 일 때는 ${comma(before)} 대 ${comma(b)}${으로(comma(b))} 양방향이 적은데, ` +
    `${last + 1}% 가 되면 ${comma(after)} 대 ${comma(b)}${으로(comma(b))} 이 절차가 적고, 100% 에서는 ${comma(full)} 대 ${comma(b)}${으로(comma(b))} ${x(b, full)} 배까지 벌어져요. ` +
    "표에 적은 것은 「처음 뒤집히는 자리」가 아니라 「양방향이 마지막으로 적었던 자리」입니다. 이 절차의 계수가 정보량을 따라 한쪽으로만 움직이지 않기 때문이에요 — " +
    `${worst}% 자리에서 ${comma(peak)}${으로(comma(peak))} 0% 자리의 ${x(peak, zero)} 배가 되는 구간이 있습니다(${last}% 와 ${worst}% 는 \`bench-alt\` 가 0% 부터 100% 까지 1% 씩 재서 고른 자리입니다).`
  );
}

function altAdjacency(): string {
  const mine = altCases["이 가이드의 절차"]();
  const rival = altCases["양방향 다익스트라"]();
  const G = grid(32);
  const rowsFor = (label: string, key: string, e: number): string[] => {
    const a = (mine[key] as number) + e;
    const b = (rival[key] as number) + 2 * e;
    return [
      label,
      comma(e),
      comma(a),
      comma(2 * e),
      comma(b),
      a < b ? "이 절차" : "양방향",
    ];
  };
  const rows = [
    rowsFor("전개 입력", "전개 입력 · 기본 연산", WALK_EDGES.length),
    rowsFor("격자 · 추정 0%", "격자 · 추정 0% · 기본 연산", G.edges.length),
    rowsFor("격자 · 추정 100%", "격자 · 추정 100% · 기본 연산", G.edges.length),
  ];
  return [
    md(
      [
        "입력",
        "이 절차가 만드는 이웃 목록 칸",
        "이 절차 · 합",
        "양방향이 만드는 이웃 목록 칸",
        "양방향 · 합",
        "적은 쪽",
      ],
      rows,
      [1, 2, 3, 4],
    ),
    "",
    "합은 위 표의 기본 연산에 이웃 목록의 칸 수를 한 칸에 한 번씩 더한 값입니다.",
  ].join("\n");
}

function mathConsistent(): string {
  const rowsOf = (h: (v: number) => number) =>
    WALK_EDGES.map(([u, v, w]) => [
      `${u}→${v}`,
      String(w),
      String(h(u)),
      String(h(v)),
      String(w + h(v)),
      h(u) <= w + h(v) ? "성립한다" : "성립하지 않는다",
    ]);
  const head = ["간선", "w", "h(u)", "h(v)", "w + h(v)", "h(u) ≤ w + h(v)"];
  const good = rowsOf(walkH);
  const bad = rowsOf(brokenH);
  const badCount = bad.filter((r) => r[5] === "성립하지 않는다").length;
  const admissible = Array.from({ length: WALK_N }, (_, v) => v).every(
    (v) => brokenH(v) <= (WALK_TO_GOAL[v] as number),
  );
  return [
    "맨해튼 거리입니다.",
    "",
    md(head, good, [1, 2, 3, 4]),
    "",
    "정점 3 에 0, 정점 4 에 11 을 준 추정입니다.",
    "",
    md(head, bad, [1, 2, 3, 4]),
    "",
    `아래 추정에서 조건이 성립하지 않는 간선은 ${comma(badCount)} 개이고, 그 추정도 정점마다 실제 최소 비용을 ${admissible ? "넘지 않습니다" : "넘습니다"}.`,
  ].join("\n");
}

function mathReweight(): string {
  const rows = WALK_EDGES.map(([u, v, w]) => [
    `${u}→${v}`,
    String(w),
    String(walkH(u)),
    String(walkH(v)),
    String(w - walkH(u) + walkH(v)),
  ]);
  let raw = 0;
  let shifted = 0;
  for (let i = 0; i + 1 < WALK_PATH.length; i++) {
    const a = WALK_PATH[i] as number;
    const b = WALK_PATH[i + 1] as number;
    const w = (WALK_EDGES.find(([x, y]) => x === a && y === b) as Edge)[2];
    raw += w;
    shifted += w - walkH(a) + walkH(b);
  }
  const neg = rows.filter((r) => Number(r[4]) < 0).length;
  return [
    md(["간선", "w", "h(u)", "h(v)", "w − h(u) + h(v)"], rows, [1, 2, 3, 4]),
    "",
    `다시 매긴 가중치가 음수인 간선은 ${comma(neg)} 개입니다. 최소 비용 경로 ${arrow(WALK_PATH)} 의 원래 비용은 ${raw}, 다시 매긴 비용은 ${shifted} 이고, 그 차이 ${raw - shifted}${이가(raw - shifted)} h(${WALK_SRC}) − h(${WALK_GOAL}) = ${walkH(WALK_SRC) - walkH(WALK_GOAL)}${과와(walkH(WALK_SRC) - walkH(WALK_GOAL))} 같습니다.`,
  ].join("\n");
}

function mathExpand(): string {
  const cs: Case[] = [WALK_CASE, GRID_CASE, CHAIN_CASE];
  let broken = 0;
  const rows = cs.map((c) => {
    const got = measure(c.n, c.edges, c.src, c.goal, c.h);
    const from = fromDist(c.n, c.edges, c.src);
    let below = 0;
    let atMost = 0;
    let expanded = 0;
    for (let v = 0; v < c.n; v++) {
      const f = (from[v] as number) + c.h(v);
      if (f < got.answer) below++;
      if (f <= got.answer) atMost++;
      if (got.expanded[v]) expanded++;
    }
    const inside = below <= expanded && expanded <= atMost;
    if (!inside) broken++;
    return [
      c.label,
      comma(c.n),
      num(got.answer),
      comma(below),
      comma(expanded),
      comma(atMost),
      inside ? "사이에 든다" : "벗어난다",
    ];
  });
  return [
    md(
      [
        "배치",
        "정점",
        "답 C",
        "F(v) < C 인 정점",
        "확장한 정점",
        "F(v) ≤ C 인 정점",
        "확장한 정점 수의 자리",
      ],
      rows,
      [1, 2, 3, 4, 5],
    ),
    "",
    `배치 ${comma(rows.length)} 개 가운데 확장한 정점 수가 두 수 사이를 벗어난 배치는 ${comma(broken)} 개입니다.`,
  ].join("\n");
}

function mathScale(): string {
  const log = Math.ceil(Math.log2(E_LIMIT + 1));
  const rows = [
    ["확장한 정점", "V", comma(V_LIMIT)],
    ["큐에 들어가는 항목", "E + 1", comma(E_LIMIT + 1)],
    ["완화 시도", "E", comma(E_LIMIT)],
    ["추정 호출", "E + 1", comma(E_LIMIT + 1)],
    ["항목 하나를 넣고 꺼내는 힙 안의 비교", "3⌈log₂(E+1)⌉", comma(3 * log)],
    ["힙 안의 비교 전부", "3(E+1)⌈log₂(E+1)⌉", comma(3 * (E_LIMIT + 1) * log)],
    [
      "기본 연산 전부",
      "E + (E+1) + 3(E+1)⌈log₂(E+1)⌉",
      comma(E_LIMIT + (E_LIMIT + 1) + 3 * (E_LIMIT + 1) * log),
    ],
  ];
  return [
    md(["항", "닫힌 형태", "규모의 상한에서"], rows, [2]),
    "",
    `V = ${comma(V_LIMIT)} · E = ${comma(E_LIMIT)} 을 넣은 값이고, 기본 연산 전부는 1 초에 1 억 번 기준으로 ${((E_LIMIT + (E_LIMIT + 1) + 3 * (E_LIMIT + 1) * log) / PER_SEC).toFixed(3)} 초입니다.`,
  ].join("\n");
}

function invariantSteps(): string {
  const cs: Case[] = [
    WALK_CASE,
    WALK_ZERO,
    WALK_BROKEN,
    DETOUR_CASE,
    CHAIN_CASE,
    GRID_CASE,
    gridCase(16, "격자 16×16 · 추정 30%", patchy(grid(16).man, 30)),
  ];
  let bad = 0;
  let equal = 0;
  const rows = cs.map((c) => {
    const got = measure(c.n, c.edges, c.src, c.goal, c.h);
    bad += got.offKey;
    if (got.maxKey === got.answer) equal++;
    return [
      c.label,
      comma(got.pops),
      num(got.answer),
      num(got.maxKey),
      comma(got.offKey),
    ];
  });
  return [
    md(
      ["배치", "꺼낸 항목", "답", "가장 큰 꺼낸 키", "키가 답을 넘은 꺼내기"],
      rows,
      [1, 2, 3, 4],
    ),
    "",
    `배치 ${comma(rows.length)} 개에서 꺼낼 때마다 비교해 키가 답을 넘은 꺼내기는 모두 ${comma(bad)} 번이고, 가장 큰 꺼낸 키가 답과 같은 배치가 ${comma(equal)} 개입니다.`,
  ].join("\n");
}

function invariantEdges(): string {
  const cs: Case[] = [
    {
      label: "정점 하나 · 시작이 곧 목표",
      n: 1,
      edges: [],
      src: 0,
      goal: 0,
      h: zeroH,
    },
    {
      label: "간선이 없고 목표가 다르다",
      n: 2,
      edges: [],
      src: 0,
      goal: 1,
      h: zeroH,
    },
    {
      label: "목표로 가는 간선이 없다",
      n: 3,
      edges: [[0, 1, 1]],
      src: 0,
      goal: 2,
      h: zeroH,
    },
    {
      label: "가중치가 전부 0",
      n: 3,
      edges: [
        [0, 1, 0],
        [1, 2, 0],
      ],
      src: 0,
      goal: 2,
      h: zeroH,
    },
    {
      label: "같은 두 정점 사이에 간선 셋",
      n: 2,
      edges: [
        [0, 1, 10],
        [0, 1, 3],
        [0, 1, 7],
      ],
      src: 0,
      goal: 1,
      h: zeroH,
    },
    {
      label: "가중치가 10^9",
      n: 3,
      edges: [
        [0, 1, 1_000_000_000],
        [1, 2, 1_000_000_000],
      ],
      src: 0,
      goal: 2,
      h: zeroH,
    },
    {
      label: "자기 자신으로 가는 간선",
      n: 2,
      edges: [
        [0, 0, 5],
        [0, 1, 2],
      ],
      src: 0,
      goal: 1,
      h: zeroH,
    },
  ];
  const rows = cs.map((c) => {
    const got = measure(c.n, c.edges, c.src, c.goal, c.h);
    const all = allPathsMin(c);
    return [
      c.label,
      comma(c.n),
      num(got.answer),
      num(all),
      comma(got.pops),
      got.answer === all ? "같다" : "어긋난다",
    ];
  });
  const same = rows.filter((r) => r[5] === "같다").length;
  return [
    md(
      [
        "배치",
        "정점",
        "정본의 답",
        "경로를 전부 만든 답",
        "꺼낸 항목",
        "두 답",
      ],
      rows,
      [1, 2, 3, 4],
    ),
    "",
    `배치 ${comma(rows.length)} 개 가운데 두 답이 같은 배치는 ${comma(same)} 개입니다.`,
  ].join("\n");
}

function mutantInflate(): string {
  const table1 = contrast(
    [NARROW_CASE, WALK_CASE, DETOUR_CASE, CHAIN_CASE, GRID_CASE],
    inflated,
    "두 배로 부풀린 판",
  );
  const keyRows = [NARROW_CASE, WALK_CASE, GRID_CASE].map((c) => {
    const plain = measure(c.n, c.edges, c.src, c.goal, c.h);
    const twice = inflatedRun(c);
    return [
      c.label,
      num(plain.maxKey),
      num(twice.maxKey),
      num(plain.answer),
      comma(twice.offKey),
    ];
  });
  const want = ref(NARROW_CASE);
  const got = run(inflated, NARROW_CASE);
  return [
    table1,
    "",
    "같은 배치에서 꺼낸 키가 답을 넘은 꺼내기를 세면 이렇습니다.",
    "",
    md(
      [
        "배치",
        "정본의 가장 큰 꺼낸 키",
        "부풀린 판의 가장 큰 꺼낸 키",
        "답",
        "부풀린 판에서 키가 답을 넘은 꺼내기",
      ],
      keyRows,
      [1, 2, 3, 4],
    ),
    "",
    `두 경로의 비용 차이가 1 인 배치에서 정본은 ${num(want)}${을를(num(want))}, 부풀린 판은 ${num(got)}${을를(num(got))} 냅니다.`,
  ].join("\n");
}

function perfCount(): string {
  const c = WALK_COUNT;
  const bench = altCases["이 가이드의 절차"]()[
    "전개 입력 · 기본 연산"
  ] as number;
  if (basicOps(c) !== bench) {
    throw new Error(
      `기본 연산이 대안 비교의 값과 다르다 — ${basicOps(c)} vs ${bench}`,
    );
  }
  const expandT = WALK.filter((s) => s.kind === "expand").map((s) => s.t);
  const staleT = WALK.filter((s) => s.kind === "stale").map((s) => s.t);
  const goalT = WALK.filter((s) => s.kind === "goal").map((s) => s.t);
  const rows = [
    ["이웃 목록 만들기", "T1", comma(WALK_EDGES.length)],
    ["큐에 넣기", "T1 과 값을 고친 걸음", comma(c.pushes)],
    ["큐에서 꺼내기", `T2 ~ ${goalT[0]}`, comma(c.pops)],
    ["그중 확장", tList(expandT), comma(c.expands)],
    ["그중 뒤처진 기록 버리기", tList(staleT), comma(c.stale)],
    ["그중 목표라 돌려주기", tList(goalT), "1"],
    ["완화 시도", tList(expandT), comma(c.relaxes)],
    ["추정 호출", "큐에 넣을 때마다", comma(c.hcalls)],
    ["힙 안의 비교", "넣기와 꺼내기 안에서", comma(c.compares)],
  ];
  return [
    md(["무리", "걸음", "횟수"], rows, [2]),
    "",
    `정점 V = ${WALK_N} · 간선 E = ${WALK_EDGES.length} 인 입력입니다. 기본 연산은 비교 ${c.compares} + 완화 시도 ${c.relaxes} + 추정 호출 ${c.hcalls} = ${basicOps(c)} 번이고, 「경쟁 설계와의 대조」의 전개 입력 값 ${bench}${과와(bench)} 같습니다. 큐가 가장 컸을 때 항목은 ${c.peak} 개입니다.`,
  ].join("\n");
}

function perfGrowth(): string {
  const sides = [8, 16, 32, 64];
  const got = sides.map((k) => {
    const G = grid(k);
    return {
      k,
      n: G.n,
      e: G.edges.length,
      c: measure(G.n, G.edges, 0, G.goal, G.man),
    };
  });
  const rows = got.map((r) => [
    `${r.k}×${r.k}`,
    comma(r.n),
    comma(r.e),
    comma(r.c.pushes),
    comma(r.c.relaxes),
    comma(basicOps(r.c)),
  ]);
  const grow = got.slice(1).map((r, at) => {
    const prev = got[at] as (typeof got)[number];
    return [
      `${prev.k} → ${r.k}`,
      (r.n / prev.n).toFixed(2),
      (r.c.pushes / prev.c.pushes).toFixed(2),
      (basicOps(r.c) / basicOps(prev.c)).toFixed(2),
    ];
  });
  return [
    md(
      ["격자", "정점", "간선", "넣은 항목", "완화 시도", "기본 연산"],
      rows,
      [1, 2, 3, 4, 5],
    ),
    "",
    "한 변을 두 배로 늘릴 때마다 몇 배가 되었는지 나누면 이렇습니다.",
    "",
    md(["한 변", "정점", "넣은 항목", "기본 연산"], grow, [1, 2, 3]),
  ].join("\n");
}

function worstShape(): string {
  const SIZE = 256;
  const G = grid(16);
  const C = chain(SIZE);
  const S = star(SIZE);
  const D = denseDag(SIZE);
  const cs: Case[] = [
    gridCase(16, "격자 16×16 · 추정이 정확"),
    gridCase(16, "격자 16×16 · 추정이 전부 0", zeroH),
    gridCase(16, "격자 16×16 · 추정 30%", patchy(G.man, 30)),
    {
      label: "사슬 256 · 추정이 정확",
      n: C.n,
      edges: C.edges,
      src: 0,
      goal: SIZE - 1,
      h: C.h,
    },
    {
      label: "별 256 · 추정이 정확",
      n: S.n,
      edges: S.edges,
      src: 0,
      goal: SIZE - 1,
      h: S.h,
    },
    {
      label: "완전 DAG 256 · 추정이 정확",
      n: D.n,
      edges: D.edges,
      src: 0,
      goal: SIZE - 1,
      h: D.h,
    },
  ];
  const got = cs.map((c) => ({
    c,
    count: measure(c.n, c.edges, c.src, c.goal, c.h),
  }));
  const rows = got.map((r) => [
    r.c.label,
    comma(r.c.edges.length),
    comma(r.count.expands),
    comma(r.count.reexpands),
    comma(r.count.pushes),
    comma(r.count.peak),
    comma(basicOps(r.count)),
  ]);
  const top = (f: (c: Counted) => number) =>
    got.reduce((a, b) => (f(b.count) > f(a.count) ? b : a));
  const byExpand = top((c) => c.expands);
  const byPush = top((c) => c.pushes);
  const byPeak = top((c) => c.peak);
  const byOps = top(basicOps);
  return [
    md(
      [
        "배치",
        "간선",
        "확장",
        "그중 재확장",
        "넣은 항목",
        "큐가 가장 컸을 때",
        "기본 연산",
      ],
      rows,
      [1, 2, 3, 4, 5, 6],
    ),
    "",
    `정점이 ${SIZE} 개인 모양 ${comma(rows.length)} 개입니다. 확장이 가장 많은 것은 「${byExpand.c.label}」 로 ${comma(byExpand.count.expands)} 개이고 그중 ${comma(byExpand.count.reexpands)} 개가 재확장입니다. 넣은 항목이 가장 많은 것은 「${byPush.c.label}」 로 ${comma(byPush.count.pushes)} 개 — 간선 수 ${comma(byPush.c.edges.length)} 에 1 을 더한 값 — 이고, 큐가 가장 커지는 것도 「${byPeak.c.label}」 로 ${comma(byPeak.count.peak)} 개입니다. 기본 연산이 가장 많은 것은 「${byOps.c.label}」 입니다.`,
  ].join("\n");
}

function worstReopen(): string {
  const sides = [8, 16, 32, 64];
  const got = sides.map((k) => {
    const G = grid(k);
    let worst = { p: -1, expands: 0, re: 0 };
    for (const p of RATIOS) {
      const c = measure(G.n, G.edges, 0, G.goal, patchy(G.man, p));
      if (c.expands > worst.expands)
        worst = { p, expands: c.expands, re: c.reexpands };
    }
    return { k, n: G.n, worst };
  });
  const rows = got.map((r) => [
    `${r.k}×${r.k}`,
    comma(r.n),
    `${r.worst.p}%`,
    comma(r.worst.expands),
    comma(r.worst.re),
    (r.worst.expands / r.n).toFixed(2),
  ]);
  const top = got.reduce((a, b) =>
    b.worst.expands / b.n > a.worst.expands / a.n ? b : a,
  );
  const over = got.filter((r) => r.worst.expands > r.n).length;
  return [
    md(
      [
        "격자",
        "정점",
        "확장이 가장 많은 비율",
        "확장",
        "그중 재확장",
        "확장 ÷ 정점",
      ],
      rows,
      [1, 3, 4, 5],
    ),
    "",
    `비율 ${comma(RATIOS.length)} 가지를 재고 확장이 가장 많은 자리를 골랐습니다. 확장이 정점 수를 넘는 격자가 ${comma(over)} 개이고, 가장 큰 배수는 ${top.k}×${top.k} 격자의 ${(top.worst.expands / top.n).toFixed(2)} 입니다.`,
  ].join("\n");
}

function selfcheckT7(): string {
  const t7 = WALK[6] as Step;
  const order = drainOrder(t7.heap);
  return [
    ...lines(
      [
        [`${t7.t}${이가(t7.t)} 끝난 뒤 큐(꺼낼 차례)`, items(order)],
        ["그때의 g[6]", num(t7.g[6] as number)],
        ["그때의 g[3]", num(t7.g[3] as number)],
      ],
      "",
    ),
  ].join("\n");
}

export const PROOFS: Record<string, () => string> = {
  "concept-cases": conceptCases,
  "concept-growth": conceptGrowth,
  "origin-brute": originBrute,
  "origin-dijkstra": originDijkstra,
  "origin-scale": originScale,
  "origin-keys": originKeys,
  "build-admissible": buildAdmissible,
  "build-read-one": buildReadOne,
  "build-edge": buildEdge,
  "build-over": buildOver,
  "build-why": buildWhy,
  "stage-start": stageStart,
  "stage-key": stageKey,
  "stage-relax": stageRelax,
  "premise-negative": premiseNegative,
  "build-ratio": buildRatio,
  "walk-input": walkInput,
  "walk-t1": walkT1,
  "walk-heap": walkHeap,
  "walk-t2": walkT2,
  "pause-early": pauseEarly,
  "walk-t5t8": walkT5T8,
  "pause-stale": pauseStale,
  "pause-stale-work": pauseStaleWork,
  "walk-trace": walkTrace,
  "walk-branches": walkBranches,
  "pause-closed": pauseClosed,
  "pause-closed-where": pauseClosedWhere,
  "walk-result": walkResult,
  "alt-flip": altFlip,
  "alt-adjacency": altAdjacency,
  "math-consistent": mathConsistent,
  "math-reweight": mathReweight,
  "math-expand": mathExpand,
  "math-scale": mathScale,
  "invariant-steps": invariantSteps,
  "invariant-edges": invariantEdges,
  "mutant-inflate": mutantInflate,
  "perf-count": perfCount,
  "perf-growth": perfGrowth,
  "worst-shape": worstShape,
  "worst-reopen": worstReopen,
  "selfcheck-t7": selfcheckT7,
};
