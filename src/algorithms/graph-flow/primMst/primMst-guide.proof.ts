/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run tools/check-proof.ts src/algorithms/graph-flow/primMst/primMst-guide.md
 *
 * **걸음을 기록하는 사본이 하나 있다**(`traced`). 정본은 항목 하나를 꺼낼 때 무엇을 읽고 썼는지
 * 내보내지 않으므로, 정본과 같은 절차에 기록과 계수만 덧붙인 사본이 아니면 걸음별 상태를 낼 방법이
 * 없다. 사본의 이진 힙(`Heap`)은 정본의 `MinHeap` 과 같은 비교 · 같은 맞바꿈이라 배열에 놓이는
 * 순서까지 같다. 항목에 「그 항목을 넣은 정점」 한 칸을 덧붙였는데, 비교는 키만 보므로 순서에 섞이지
 * 않는다. 계수만 세는 사본 셋(`byRescan`·`byRound`·`bySortedList`)도 답을 정본과 맞댄 뒤에만 표에
 * 오른다. **답이 맞는지는 사본이 아니라 정본이 진다.**
 *
 * 걸음 재생 패널(`.sim.ts`)과 그림(`.fig.tsx`)도 `traced` 의 기록에서 만든다.
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { josa, 을를, 이가 } from "../../../../tools/josa.ts";
import benchJson from "./primMst-guide.bench.json";
import { type Edge, primMst } from "./primMst-guide.ref.ts";

export type { Edge };

const REF = new URL("./primMst-guide.ref.ts", import.meta.url).pathname;

const 과와 = (x: string): string => josa(x, "과", "와");
const 은는 = (x: string): string => josa(x, "은", "는");

/* ────────────────────────── 입력 ────────────────────────── */

/**
 * 본문 전개가 쓰는 고정 입력. `kruskalMst` 편이 쓰는 그래프와 같은 것이라 두 절차가 같은 트리를
 * 다른 순서로 만드는 것을 같은 값으로 대조할 수 있다. 간선 일곱의 가중치가 전부 달라 최소 신장
 * 트리가 하나로 정해진다. 정점 3 이 간선 둘로 두 번 후보에 오르고, 마지막 정점을 넣을 때 큐에
 * 항목이 남는다.
 */
export const WALK_N = 6;
export const WALK_EDGES: Edge[] = [
  [0, 1, 1],
  [0, 3, 4],
  [0, 5, 7],
  [1, 2, 3],
  [2, 3, 2],
  [3, 4, 6],
  [4, 5, 5],
];

/** 삼각형. 가장 무거운 간선 하나가 빠지는 최소 사례다. */
const TRI_N = 3;
const TRI_EDGES: Edge[] = [
  [0, 1, 1],
  [1, 2, 2],
  [0, 2, 3],
];

/** 정점 넷이 사각형을 이루고 가중치가 전부 같다. 어느 셋을 골라도 합계가 같다. */
const SQUARE_N = 4;
const SQUARE_EDGES: Edge[] = [
  [0, 1, 1],
  [1, 2, 1],
  [2, 3, 1],
  [0, 3, 1],
];

/** 정점 셋인데 간선이 하나뿐이다. 정점 2 가 어디에도 안 이어져 신장 트리가 없다. */
const SPLIT_N = 3;
const SPLIT_EDGES: Edge[] = [[0, 1, 5]];

/** 정점 넷이 둘씩만 이어져 있다. 시작 정점의 덩어리를 다 넣으면 큐가 빈다. */
export const PAIRS_N = 4;
export const PAIRS_EDGES: Edge[] = [
  [0, 1, 3],
  [2, 3, 4],
];

/** 최소 신장 트리와 최단 경로가 갈리는 가장 작은 그래프. */
const SPLITPATH_N = 3;
const SPLITPATH_EDGES: Edge[] = [
  [0, 1, 2],
  [1, 2, 2],
  [0, 2, 3],
];

/** 결정론적 가중치. `1 ≤ w ≤ 997` 을 지킨다. */
const weight = (i: number, j: number): number => ((i * 31 + j * 17) % 997) + 1;

/**
 * 정점 `v` 개에 간선이 `e` 개인 그래프. 먼저 `0—1—…—(v-1)` 을 깔아 연결을 보장하고, 그 뒤
 * 남은 자리를 정점 번호 순으로 채운다. **`primMst-guide.alt.ts` 와 같은 생성식이다** — 두
 * 파일이 같은 그래프를 재야 본문의 값이 서로 어긋나지 않는다.
 */
function graphOf(v: number, e: number): Edge[] {
  const out: Edge[] = [];
  for (let i = 0; i + 1 < v; i++) out.push([i, i + 1, weight(i, i + 1)]);
  outer: for (let i = 0; i < v; i++) {
    for (let j = i + 1; j < v; j++) {
      if (j === i + 1) continue;
      if (out.length >= e) break outer;
      out.push([i, j, weight(i, j)]);
    }
  }
  return out;
}

/** 정점 `v` 개를 한 줄로 이은 그래프. 간선이 `v-1` 개로 가장 적다. */
const path = (v: number): Edge[] => graphOf(v, v - 1);

/** 정점 `v` 개짜리 완전 그래프. 간선이 `v(v-1)/2` 개로 가장 많다. */
const complete = (v: number): Edge[] => graphOf(v, (v * (v - 1)) / 2);

/** 정점 0 이 나머지 전부와 이어진 그래프. 간선 수는 한 줄로 이은 것과 같다. */
function star(v: number): Edge[] {
  const out: Edge[] = [];
  for (let i = 1; i < v; i++) out.push([0, i, weight(0, i)]);
  return out;
}

/** 한 줄로 잇고 같은 간선을 한 벌 더 얹은 그래프. 간선 수만 두 배가 된다. */
function doubled(v: number): Edge[] {
  return [...path(v), ...path(v)];
}

/** 한 줄로 잇고 **가장 무거운** 간선을 한 벌 더 얹은 그래프. */
function heavy(v: number): Edge[] {
  const out: Edge[] = path(v);
  for (let i = 0; i < v; i++) out.push([i, (i + 7) % v, 1_000_000_000]);
  return out;
}

/* ────────────────────────── 표기 ────────────────────────── */

/** `1,299,994` 꼴 — 본문 표기와 같다. */
export const comma = (n: number): string => n.toLocaleString("en-US");

/** 간선 이름 `(0,1)=1` — 작은 끝점을 앞에 둔다. 본문 표기와 같다. */
export const edgeText = (u: number, v: number, w: number): string =>
  `(${Math.min(u, v)},${Math.max(u, v)})=${w}`;

const edgeAt = (i: number): string => {
  const [u, v, w] = WALK_EDGES[i] as Edge;
  return edgeText(u, v, w);
};

/** 우선순위 큐 항목 `3(4)` — 정점(키). 본문 표기와 같다. */
export const itemText = (x: Item): string => `${x[0]}(${x[1]})`;

export const setText = (xs: readonly number[]): string => `{${xs.join(", ")}}`;

export const members = (inTree: readonly boolean[]): number[] =>
  inTree.flatMap((f, i) => (f ? [i] : []));

/** 마크다운 표 한 벌. `right` 는 오른쪽 정렬할 열 번호. */
function md(
  head: readonly string[],
  rows: readonly (readonly string[])[],
  right: readonly number[] = [],
): string {
  const sep = head.map((_, i) => (right.includes(i) ? "---:" : "---"));
  return [head, sep, ...rows].map((r) => `| ${r.join(" | ")} |`).join("\n");
}

/** 한글은 고정폭 화면에서 두 칸을 먹는다(코드 옆 짧은 결과 블록의 칸 맞춤). */
const width = (s: string): number =>
  [...s].reduce((n, c) => n + (/[ᄀ-ᇿ　-〿㄰-㆏가-힯一-鿿]/.test(c) ? 2 : 1), 0);
const pad = (s: string, to: number): string =>
  s + " ".repeat(Math.max(0, to - width(s)));

/** 등폭 두 열 — 이름과 값. 코드 조각 바로 아래의 짧은 실행 결과에 쓴다. */
function pairs(rows: readonly [string, string][], indent = ""): string[] {
  const w = Math.max(...rows.map(([a]) => width(a)));
  return rows.map(([a, b]) =>
    `${indent}${pad(a, w)}  ${b}`.replace(/\s+$/, ""),
  );
}

/** 초를 사람이 읽는 단위로 바꾼다. */
function duration(seconds: number): string {
  if (seconds < 1) return `${seconds.toFixed(3)} 초`;
  if (seconds < 60) return `${seconds.toFixed(1)} 초`;
  if (seconds < 3_600) return `${(seconds / 60).toFixed(1)} 분`;
  if (seconds < 86_400) return `${(seconds / 3_600).toFixed(1)} 시간`;
  if (seconds < 86_400 * 365) return `${(seconds / 86_400).toFixed(1)} 일`;
  return `${comma(Math.round(seconds / (86_400 * 365)))} 년`;
}

/* ────────────────────── 걸음을 기록하는 사본 ────────────────────── */

/** 우선순위 큐의 항목 — `[정점, 키, 그 항목을 넣은 정점]`. 시작 항목은 넣은 정점이 `-1` 이다. */
export type Item = readonly [number, number, number];

/**
 * 정본의 `MinHeap` 과 같은 이진 힙. 비교는 키(둘째 칸)만 보고, 계수는 비교 한 번과 칸을 옮긴 한 번을
 * 각각 하나로 센다(맞바꿈 한 번은 둘).
 */
export class Heap {
  items: Item[] = [];
  ops = 0;
  max = 0;

  size(): number {
    return this.items.length;
  }

  private key(i: number): number {
    return (this.items[i] as Item)[1];
  }

  private swap(a: number, b: number): void {
    const t = this.items[a] as Item;
    this.items[a] = this.items[b] as Item;
    this.items[b] = t;
    this.ops += 2;
  }

  push(x: Item): void {
    this.items.push(x);
    if (this.items.length > this.max) this.max = this.items.length;
    let i = this.items.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      this.ops += 1;
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
      this.ops += 1;
      let i = 0;
      for (;;) {
        const left = 2 * i + 1;
        const right = 2 * i + 2;
        let small = i;
        if (left < this.items.length) {
          this.ops += 1;
          if (this.key(left) < this.key(small)) small = left;
        }
        if (right < this.items.length) {
          this.ops += 1;
          if (this.key(right) < this.key(small)) small = right;
        }
        if (small === i) break;
        this.swap(i, small);
        i = small;
      }
    }
    return top;
  }
}

/** 힙 사본 하나를 떠서 비울 때까지 꺼낸 차례 — 다음에 무엇이 나오는가를 그대로 보인다. */
export function drainOrder(heap: readonly Item[]): Item[] {
  const h = new Heap();
  h.items = [...heap];
  const out: Item[] = [];
  while (h.size() > 0) out.push(h.pop());
  return out;
}

export interface Look {
  readonly v: number;
  readonly w: number;
  /** 그때 `v` 가 트리 밖이었는가 — 참이면 후보로 넣었다. */
  readonly outside: boolean;
}

export interface Step {
  /** 걸음 번호 `T1` … */
  readonly t: string;
  readonly kind: "start" | "join" | "stale";
  readonly popped: Item | null;
  /** 이 걸음이 끝난 뒤. */
  readonly inTree: readonly boolean[];
  readonly total: number;
  readonly joined: number;
  /** 이 걸음이 끝난 뒤 힙 배열 — 배열에 놓인 순서 그대로. */
  readonly heap: readonly Item[];
  readonly pushed: readonly Item[];
  readonly looks: readonly Look[];
  /** 정점이 다 차 반복 안에서 돌려준 걸음(⑤). */
  readonly done: boolean;
}

export interface Run {
  readonly answer: number;
  readonly steps: readonly Step[];
  /** 트리에 넣은 간선을 넣은 차례대로 — 가중치 칸은 비워 둔다(`withWeights`). */
  readonly chosen: readonly Edge[];
  readonly ops: number;
  readonly pushes: number;
  readonly pops: number;
  readonly maxItems: number;
  readonly neighborChecks: number;
}

interface TraceOptions {
  /** 시작 정점. 기본 0. */
  readonly start?: number;
  /** 키를 꺼낸 항목의 키 + 간선 가중치로 넣는다(불변식을 깨뜨리는 변이의 사본). */
  readonly cumulative?: boolean;
  /** 이미 트리에 든 정점을 거르지 않는다(짚고 가기 변이의 사본). */
  readonly noSkip?: boolean;
  /** 걸음을 기록한다. 큰 입력에서는 끄고 계수만 낸다. */
  readonly record?: boolean;
}

/** 정본과 같은 절차에 기록과 계수를 덧붙인 사본. */
export function traced(n: number, edges: Edge[], opts: TraceOptions = {}): Run {
  const start = opts.start ?? 0;
  const record = opts.record ?? true;
  const adj: [number, number][][] = Array.from({ length: n }, () => []);
  let outerOps = 0;
  for (const [u, v, w] of edges) {
    (adj[u] as [number, number][]).push([v, w]);
    (adj[v] as [number, number][]).push([u, w]);
    outerOps += 2;
  }
  const inTree: boolean[] = Array.from({ length: n }, () => false);
  const pq = new Heap();
  const steps: Step[] = [];
  const chosen: Edge[] = [];
  let pushes = 0;
  let pops = 0;
  let neighborChecks = 0;
  let total = 0;
  let joined = 0;

  const put = (x: Item): void => {
    pq.push(x);
    pushes++;
  };
  const snap = (
    kind: Step["kind"],
    popped: Item | null,
    pushed: Item[],
    looks: Look[],
    done: boolean,
  ): void => {
    if (!record) return;
    steps.push({
      t: `T${steps.length + 1}`,
      kind,
      popped,
      inTree: [...inTree],
      total,
      joined,
      heap: [...pq.items],
      pushed,
      looks,
      done,
    });
  };
  const finish = (answer: number): Run => ({
    answer,
    steps,
    chosen,
    ops: outerOps + pq.ops,
    pushes,
    pops,
    maxItems: pq.max,
    neighborChecks,
  });

  put([start, 0, -1]);
  snap("start", null, [[start, 0, -1]], [], false);
  while (pq.size() > 0) {
    const x = pq.pop();
    pops++;
    outerOps += 1;
    const [u, w, from] = x;
    if (!opts.noSkip && inTree[u] === true) {
      snap("stale", x, [], [], false);
      continue;
    }
    inTree[u] = true;
    total += w;
    joined++;
    outerOps += 1;
    if (from >= 0) chosen.push([Math.min(from, u), Math.max(from, u), 0]);
    if (joined === n) {
      snap("join", x, [], [], true);
      return finish(total);
    }
    const pushed: Item[] = [];
    const looks: Look[] = [];
    for (const [v, ew] of adj[u] as [number, number][]) {
      outerOps += 1;
      neighborChecks++;
      const outside = inTree[v] !== true;
      looks.push({ v, w: ew, outside });
      if (outside) {
        const it: Item = [v, opts.cumulative ? w + ew : ew, u];
        put(it);
        pushed.push(it);
      }
    }
    snap("join", x, pushed, looks, false);
  }
  return finish(joined === n ? total : -1);
}

/** 기록 사본으로 고른 간선에 가중치를 붙인다 — 같은 두 끝점 중 가장 가벼운 간선. */
function withWeights(chosen: readonly Edge[], edges: Edge[]): Edge[] {
  return chosen.map(([a, b]) => {
    let best = Number.POSITIVE_INFINITY;
    for (const [u, v, w] of edges) {
      if (Math.min(u, v) === a && Math.max(u, v) === b && w < best) best = w;
    }
    return [a, b, best];
  });
}

/** 사본이 정본과 같은 답을 내는지 확인하고 돌려준다. */
function checkedRun(n: number, edges: Edge[], opts: TraceOptions = {}): Run {
  const run = traced(n, edges, opts);
  const want = primMst(n, edges);
  if (run.answer !== want) {
    throw new Error(`기록 사본의 답이 정본과 다르다 — ${run.answer} ≠ ${want}`);
  }
  return run;
}

export const WALK: Run = checkedRun(WALK_N, WALK_EDGES);
export const PAIRS: Run = checkedRun(PAIRS_N, PAIRS_EDGES);

/** 전개 입력에서 고른 간선 — 고른 차례대로, 가중치를 붙여. */
export const MST: Edge[] = withWeights(WALK.chosen, WALK_EDGES);

/** 걸음 번호로 걸음을 찾는다. */
export const stepAt = (t: string): Step => {
  const s = WALK.steps.find((x) => x.t === t);
  if (!s) throw new Error(`걸음 ${t} 가 없다`);
  return s;
};

/** 걸음 바로 앞의 걸음. */
const before = (s: Step, run: Run = WALK): Step =>
  run.steps[run.steps.indexOf(s) - 1] as Step;

/** 꺼낸 항목이 온 간선의 번호 — 간선 목록에서 두 끝점과 가중치가 맞는 것. 시작 항목이면 -1. */
export function edgeOf(x: Item, edges: readonly Edge[] = WALK_EDGES): number {
  if (x[2] < 0) return -1;
  return edges.findIndex(
    ([u, v, w]) =>
      w === x[1] && ((u === x[0] && v === x[2]) || (v === x[0] && u === x[2])),
  );
}

/** 걸음이 끝난 뒤 트리에 든 간선의 번호 — `WALK_EDGES` 의 차례. */
export function treeEdgesAfter(t: string): Set<number> {
  const out = new Set<number>();
  for (const s of WALK.steps) {
    if (s.kind === "join" && s.popped) {
      const e = edgeOf(s.popped);
      if (e >= 0) out.add(e);
    }
    if (s.t === t) break;
  }
  return out;
}

/** 걸음이 끝난 뒤까지 지나간 후보로 버린 항목이 온 간선의 번호. */
export function staleEdgesAfter(t: string): Set<number> {
  const out = new Set<number>();
  for (const s of WALK.steps) {
    if (s.kind === "stale" && s.popped) out.add(edgeOf(s.popped));
    if (s.t === t) break;
  }
  return out;
}

/** 지금 트리 안과 밖을 잇는 간선의 번호 — 정의에서 직접 센다. */
export function crossingOf(
  inTree: readonly boolean[],
  edges: readonly Edge[] = WALK_EDGES,
): number[] {
  const out: number[] = [];
  edges.forEach(([u, v], i) => {
    if (u !== v && (inTree[u] === true) !== (inTree[v] === true)) out.push(i);
  });
  return out;
}

/** 간선 번호 목록 중 가장 가벼운 것. */
const lightest = (xs: readonly number[]): number =>
  xs.reduce((a, b) =>
    (WALK_EDGES[b] as Edge)[2] < (WALK_EDGES[a] as Edge)[2] ? b : a,
  );

/** 큐 항목이 지나간 후보인가 — 가리키는 정점이 이미 트리 안이다. */
export const isStale = (s: Step, x: Item): boolean => s.inTree[x[0]] === true;

/* ────────────────────── 세는 사본과 다른 절차 ────────────────────── */

interface Counted {
  answer: number;
  ops: number;
}

/**
 * 가장 단순한 방법 — 간선 목록에서 **크기 `n-1` 인 부분집합을 전부** 만들어, 그것이 사이클 없이
 * 모든 정점을 잇는지 검사하고 가중치 합이 가장 작은 것을 남긴다. `must` 를 주면 그 간선을 모두
 * 담는 부분집합만 본다(불변식 검사).
 */
function allSpanningTrees(
  n: number,
  edges: Edge[],
  must: readonly number[] = [],
): { trees: number; min: number; max: number; reads: number } {
  const pickCount = n - 1;
  const chosen: number[] = [];
  let trees = 0;
  let min = Number.POSITIVE_INFINITY;
  let max = 0;
  let reads = 0;

  function spans(): boolean {
    const seen: number[] = Array.from({ length: n }, (_, i) => i);
    const root = (x: number): number => {
      let r = x;
      while (seen[r] !== r) r = seen[r] as number;
      return r;
    };
    let joined = 0;
    for (const idx of chosen) {
      const [u, v] = edges[idx] as Edge;
      reads += 2;
      const ru = root(u);
      const rv = root(v);
      if (ru === rv) return false;
      seen[ru] = rv;
      joined++;
    }
    return joined === pickCount;
  }

  function walk(from: number): void {
    if (chosen.length === pickCount) {
      if (must.some((m) => !chosen.includes(m))) return;
      if (spans()) {
        trees++;
        let sum = 0;
        for (const idx of chosen) sum += (edges[idx] as Edge)[2];
        if (sum < min) min = sum;
        if (sum > max) max = sum;
      }
      return;
    }
    for (let i = from; i < edges.length; i++) {
      chosen.push(i);
      walk(i + 1);
      chosen.pop();
    }
  }

  if (pickCount === 0) return { trees: 1, min: 0, max: 0, reads: 0 };
  walk(0);
  return { trees, min, max, reads };
}

/**
 * 경계 간선을 매번 다시 찾기 — 정점을 하나씩 붙이되, 붙일 때마다 **경계 간선을 간선 목록에서 전부
 * 다시 찾는다.** 후보를 하나도 들고 있지 않는 판이다. 기본 연산은 비교 한 번과 배열 칸을 읽거나 쓴
 * 한 번을 각각 하나로 센다 — 아래 둘과 `traced` 가 같은 정의를 쓴다.
 */
function byRescan(n: number, edges: Edge[]): Counted {
  const inTree: boolean[] = Array.from({ length: n }, () => false);
  let ops = 0;
  let total = 0;
  let joined = 1;
  inTree[0] = true;
  while (joined < n) {
    let best = -1;
    let target = -1;
    for (const [u, v, w] of edges) {
      ops += 2;
      const a = inTree[u] === true;
      const b = inTree[v] === true;
      if (a === b) continue;
      ops += 1;
      if (best < 0 || w < best) {
        best = w;
        target = a ? v : u;
      }
    }
    if (best < 0) return { answer: -1, ops };
    inTree[target] = true;
    ops += 1;
    total += best;
    joined++;
  }
  return { answer: total, ops };
}

/**
 * 정점마다 가장 가벼운 간선 하나 — 정점마다 **트리와 잇는 가장 가벼운 간선 하나**를 배열에 적어
 * 두고, 걸음마다 트리 밖 정점을 전수로 보아 그중 가장 작은 것을 고른다. 간선은 한 번씩만 본다.
 */
function byRound(n: number, edges: Edge[]): Counted {
  const adj: [number, number][][] = Array.from({ length: n }, () => []);
  let ops = 0;
  for (const [u, v, w] of edges) {
    (adj[u] as [number, number][]).push([v, w]);
    (adj[v] as [number, number][]).push([u, w]);
    ops += 2;
  }
  const inTree: boolean[] = Array.from({ length: n }, () => false);
  const best: number[] = Array.from(
    { length: n },
    () => Number.POSITIVE_INFINITY,
  );
  best[0] = 0;
  let total = 0;
  let joined = 0;
  for (let round = 0; round < n; round++) {
    let u = -1;
    for (let x = 0; x < n; x++) {
      ops += 2;
      if (
        inTree[x] !== true &&
        (u < 0 || (best[x] as number) < (best[u] as number))
      ) {
        u = x;
      }
    }
    if (u < 0 || best[u] === Number.POSITIVE_INFINITY)
      return { answer: -1, ops };
    inTree[u] = true;
    total += best[u] as number;
    joined++;
    ops += 1;
    for (const [v, w] of adj[u] as [number, number][]) {
      ops += 1;
      if (inTree[v] !== true && w < (best[v] as number)) {
        best[v] = w;
        ops += 1;
      }
    }
  }
  return { answer: joined === n ? total : -1, ops };
}

/**
 * 정렬 배열로 만든 우선순위 큐 — 후보를 키 오름차순으로 늘어놓는다. 가장 작은 것은 늘 맨 앞이라
 * 꺼내기가 한 번이지만, 넣을 때 자리를 찾아 뒤쪽을 한 칸씩 옮겨야 한다.
 */
function bySortedList(n: number, edges: Edge[]): Counted & { shifts: number } {
  const adj: [number, number][][] = Array.from({ length: n }, () => []);
  let ops = 0;
  let shifts = 0;
  for (const [u, v, w] of edges) {
    (adj[u] as [number, number][]).push([v, w]);
    (adj[v] as [number, number][]).push([u, w]);
    ops += 2;
  }
  const inTree: boolean[] = Array.from({ length: n }, () => false);
  const list: [number, number][] = [];
  const insert = (node: number, key: number): void => {
    let i = list.length;
    while (i > 0) {
      ops += 1;
      if ((list[i - 1] as [number, number])[1] <= key) break;
      i--;
      shifts++;
    }
    list.splice(i, 0, [node, key]);
    ops += list.length - i;
  };
  insert(0, 0);
  let total = 0;
  let joined = 0;
  while (list.length > 0) {
    const [u, w] = list.shift() as [number, number];
    ops += list.length + 1;
    if (inTree[u] === true) continue;
    inTree[u] = true;
    total += w;
    joined++;
    ops += 1;
    if (joined === n) return { answer: total, ops, shifts };
    for (const [v, ew] of adj[u] as [number, number][]) {
      ops += 1;
      if (inTree[v] !== true) insert(v, ew);
    }
  }
  return { answer: joined === n ? total : -1, ops, shifts };
}

/** 사본이 정본과 같은 답을 내는지 확인하고 계수를 돌려준다. */
function checked(name: string, n: number, edges: Edge[], got: Counted): number {
  const want = primMst(n, edges);
  if (got.answer !== want) {
    throw new Error(`${name} 의 답이 정본과 다르다 — ${got.answer} ≠ ${want}`);
  }
  return got.ops;
}

/** 이진 힙으로 만든 우선순위 큐 — 정본과 같은 절차의 계수. 답은 정본과 맞댄다. */
const heapRun = (n: number, edges: Edge[]): Run =>
  checkedRun(n, edges, { record: false });

/* ────────────────────────── 변이 ────────────────────────── */

type Ref = { primMst: (n: number, edges: Edge[]) => number };

/** 시작 정점만 바꾼 판. 나머지는 정본 그대로다. */
const startAt = (v: number): Promise<Ref> =>
  loadMutant<Ref>(REF, { swap: [/pq\.push\(0, 0\);/, `pq.push(${v}, 0);`] });

/** 이미 트리에 든 정점을 걸러 내는 줄을 지운 판. */
const NO_SKIP = await loadMutant<Ref>(REF, {
  drop: /^\s*if \(inTree\[u\] === true\) continue;$/,
});

/** 마지막 줄의 삼항식을 합계로 바꾼 판. 못 이은 정점이 있어도 그냥 더한 값을 답한다. */
const NO_CHECK = await loadMutant<Ref>(REF, {
  swap: [/return joined === n \? total : -1;/, "return total;"],
});

/**
 * 큐에 넣는 키를 **간선 하나의 가중치**에서 **꺼낸 항목의 키 + 간선 가중치**, 곧 시작 정점부터의
 * 누적 합으로 바꾼 판. 불변식을 지키던 바로 그 줄이다 — 키가 간선 가중치라야 꺼낸 최소가 경계 간선의
 * 최소가 된다.
 */
const CUMULATIVE = await loadMutant<Ref>(REF, {
  swap: [
    /if \(inTree\[v\] !== true\) pq\.push\(v, ew\);/,
    "if (inTree[v] !== true) pq.push(v, w + ew);",
  ],
});

/**
 * 변이가 걸린 판인가 — `check-proof` 가 변이를 만들되 적용하지 않는 중화 실행에서는 변이 모듈이 정본
 * 모듈 그 자체다. 기록 사본과 변이의 답을 맞대는 자기검사는 변이가 실제로 걸렸을 때만 한다(SPEC §0
 * 「자기검사를 중화 실행에서 건너뛰게 쓴다」).
 */
const applied = (mod: Ref): boolean => mod.primMst !== primMst;

/** 사본이 낸 값과 변이가 낸 값이 같은지 — 변이가 걸렸을 때만 잰다. */
function agree(mod: Ref, n: number, edges: Edge[], got: number): void {
  if (!applied(mod)) return;
  const want = mod.primMst(n, edges);
  if (want !== got) {
    throw new Error(`변이 사본의 답이 변이와 다르다 — ${got} ≠ ${want}`);
  }
}

/** 표에 나란히 놓는 네 입력. 이름은 본문 표기와 같다. */
const FOUR: [string, number, Edge[]][] = [
  ["전개 입력", WALK_N, WALK_EDGES],
  ["삼각형", TRI_N, TRI_EDGES],
  ["가중치가 같은 사각형", SQUARE_N, SQUARE_EDGES],
  ["정점 셋에 간선 하나", SPLIT_N, SPLIT_EDGES],
];

function mutantTable(
  label: string,
  mod: Ref,
  inputs: [string, number, Edge[]][],
): string {
  return md(
    ["입력", "정본", label],
    inputs.map(([name, v, e]) => [
      name,
      comma(primMst(v, e)),
      comma(mod.primMst(v, e)),
    ]),
    [1, 2],
  );
}

/* ────────────────────────── 블록 — 전체 컨셉 ────────────────────────── */

function conceptCount(): string {
  const sum = MST.reduce((s, e) => s + e[2], 0);
  const answer = primMst(WALK_N, WALK_EDGES);
  if (sum !== answer) throw new Error("고른 간선의 합이 답과 다르다");
  return [
    md(
      ["센 것", "전개 입력"],
      [
        ["정점", comma(WALK_N)],
        ["간선", comma(WALK_EDGES.length)],
        ["최소 신장 트리의 간선", comma(MST.length)],
        ["최소 신장 트리의 가중치 합", comma(sum)],
      ],
      [1],
    ),
    "",
    `이 글의 절차는 간선을 ${MST.map(([u, v, w]) => edgeText(u, v, w)).join(" · ")} 차례로 골랐고, 전체 코드가 낸 답도 ${comma(answer)} 입니다.`,
  ].join("\n");
}

/** 전체 컨셉에서 경계 간선을 처음 보이는 자리 — 정점 둘이 트리에 든 뒤. */
export const CONCEPT_T = "T3";

function conceptCut(): string {
  const s = stepAt(CONCEPT_T);
  const cross = crossingOf(s.inTree);
  const best = lightest(cross);
  const [bu, bv] = WALK_EDGES[best] as Edge;
  const next = s.inTree[bu] === true ? bv : bu;
  const after = WALK.steps[WALK.steps.indexOf(s) + 1] as Step;
  if (after.popped?.[0] !== next) {
    throw new Error("경계 간선의 최소가 절차가 다음에 넣은 정점과 다르다");
  }
  const rows = WALK_EDGES.map(([u, v, w]) => {
    const a = s.inTree[u] === true ? "안" : "밖";
    const b = s.inTree[v] === true ? "안" : "밖";
    return [edgeText(u, v, w), `${a} · ${b}`, a === b ? "아니다" : "경계 간선"];
  });
  return [
    md(["간선", "두 끝점 — 트리 안 · 밖", "판정"], rows),
    "",
    `트리 안 정점이 ${setText(members(s.inTree))} 일 때 경계 간선은 ${cross.length} 개이고, 그중 가장 가벼운 것은 ${edgeAt(best)} 입니다. 이 간선의 트리 밖 끝점 ${next}${이가(String(next))} 다음에 트리에 들어갑니다.`,
  ].join("\n");
}

/* ────────────────────────── 블록 — 아이디어를 떠올리는 과정 ────────────────────────── */

function bruteWalk(): string {
  const b = allSpanningTrees(WALK_N, WALK_EDGES);
  const answer = primMst(WALK_N, WALK_EDGES);
  if (b.min !== answer) throw new Error("전수 열거의 최솟값이 정본과 다르다");
  let subsets = 1;
  for (let k = 0; k < WALK_N - 1; k++) {
    subsets = (subsets * (WALK_EDGES.length - k)) / (k + 1);
  }
  return [
    md(
      ["센 것", "전개 입력"],
      [
        [`크기 ${WALK_N - 1} 인 간선 부분집합`, comma(Math.round(subsets))],
        ["그중 신장 트리인 것", comma(b.trees)],
        ["검사하며 읽은 간선 끝점", comma(b.reads)],
        ["가장 작은 가중치 합", comma(b.min)],
        ["가장 큰 가중치 합", comma(b.max)],
      ],
      [1],
    ),
    "",
    `가장 작은 합 ${comma(b.min)}${이가(comma(b.min))} 전체 코드가 낸 답 ${comma(answer)}${과와(comma(answer))} 같습니다.`,
  ].join("\n");
}

/** 완전 그래프의 신장 트리 수를 실행으로 센 규모 — 식 `V^(V-2)` 를 작은 규모에서 확인한다. */
const COUNTED_V: readonly number[] = [3, 4, 5, 6];

function naiveScale(): string {
  for (const v of COUNTED_V) {
    const counted = allSpanningTrees(v, complete(v)).trees;
    if (counted !== v ** (v - 2)) {
      throw new Error(`V=${v} 에서 센 신장 트리 수가 V^(V-2) 와 다르다`);
    }
  }
  const rows = [6, 10, 15, 20].map((v) => {
    const value = 10 ** ((v - 2) * Math.log10(v));
    return [
      comma(v),
      comma((v * (v - 1)) / 2),
      value > 1e15 ? value.toExponential(3) : comma(Math.round(value)),
      duration(value / 1e8),
      COUNTED_V.includes(v) ? "실행" : "식",
    ];
  });
  const big = 10_000;
  const bigDigits = Math.floor((big - 2) * Math.log10(big)) + 1;
  return [
    md(
      [
        "정점 V",
        "간선 E",
        "신장 트리 수 V^(V−2)",
        "초당 1 억 개를 검사할 때",
        "센 방법",
      ],
      rows,
      [0, 1, 2, 3],
    ),
    "",
    `정점 ${COUNTED_V.join(" · ")} 개짜리 완전 그래프에서 신장 트리를 전부 세어 V^(V−2) 와 일치하는 것을 확인했고, 「식」 줄은 그 식으로 낸 값입니다. 정점 ${comma(big)} 개짜리 완전 그래프면 신장 트리 수를 적는 데만 ${comma(bigDigits)} 자리가 듭니다.`,
  ].join("\n");
}

function subsetCount(): string {
  let fixed = 1;
  for (let k = 0; k < WALK_N - 1; k++) {
    fixed = (fixed * (WALK_EDGES.length - k)) / (k + 1);
  }
  return md(
    ["부분집합을 고르는 법", "전개 입력에서 만드는 부분집합"],
    [
      ["크기를 정하지 않는다 — 2^E", comma(2 ** WALK_EDGES.length)],
      ["크기를 V − 1 로 고정한다 — C(E, V − 1)", comma(Math.round(fixed))],
    ],
    [1],
  );
}

function greedyWalk(): string {
  const rows: string[][] = [];
  for (const s of WALK.steps) {
    if (s.kind !== "join" || !s.popped || s.popped[2] < 0) continue;
    const prev = before(s);
    const cross = crossingOf(prev.inTree);
    const best = lightest(cross);
    if (edgeOf(s.popped) !== best) {
      throw new Error(
        `${s.t} 에서 절차가 고른 간선이 경계 간선의 최소가 아니다`,
      );
    }
    rows.push([
      comma(rows.length + 1),
      setText(members(prev.inTree)),
      cross.map(edgeAt).join(" · "),
      edgeAt(best),
      String(s.popped[0]),
    ]);
  }
  const sum = MST.reduce((a, e) => a + e[2], 0);
  return [
    md(
      [
        "차례",
        "트리 안 정점 S",
        "경계 간선",
        "그중 가장 가벼운 것",
        "새로 넣은 정점",
      ],
      rows,
      [0],
    ),
    "",
    `고른 간선 ${rows.length} 개의 가중치 합은 ${MST.map((e) => e[2]).join(" + ")} = ${comma(sum)} 입니다.`,
  ].join("\n");
}

const FRONTIER_INPUTS: [string, number, Edge[]][] = [
  ["전개 입력", WALK_N, WALK_EDGES],
  ["한 줄로 이은 100 정점", 100, path(100)],
  ["별 모양 100 정점", 100, star(100)],
  ["완전 그래프 40 정점", 40, complete(40)],
];

function frontierCost(): string {
  const rows = FRONTIER_INPUTS.map(([name, v, e]) => {
    const a = checked(`다시 찾기 · ${name}`, v, e, byRescan(v, e));
    const b = checked(`정점마다 하나 · ${name}`, v, e, byRound(v, e));
    return [name, comma(v), comma(e.length), comma(a), comma(b)];
  });
  return [
    md(
      [
        "입력",
        "V",
        "E",
        "경계 간선을 매번 다시 찾기",
        "정점마다 가장 가벼운 간선 하나",
      ],
      rows,
      [1, 2, 3, 4],
    ),
    "",
    "두 방식 모두 네 입력에서 정본과 같은 합계를 냈습니다.",
  ].join("\n");
}

function frontierQueue(): string {
  const rows = FRONTIER_INPUTS.map(([name, v, e]) => {
    const b = checked(`정점마다 하나 · ${name}`, v, e, byRound(v, e));
    const q = heapRun(v, e).ops;
    return [name, comma(v), comma(e.length), comma(b), comma(q)];
  });
  return [
    md(
      [
        "입력",
        "V",
        "E",
        "정점마다 가장 가벼운 간선 하나",
        "후보를 우선순위 큐에 담기",
      ],
      rows,
      [1, 2, 3, 4],
    ),
    "",
    "우선순위 큐는 이진 힙으로 만들었고, 네 입력에서 정본과 같은 합계를 냈습니다.",
  ].join("\n");
}

/** 「아이디어를 떠올리는 과정」의 시도 사다리가 쓰는 수. */
export function originNumbers(): {
  treeV: number;
  treeCount: string;
  treeTime: string;
  aComplete: number;
  bComplete: number;
  bPath: number;
  qPath: number;
  qComplete: number;
} {
  const treeV = 20;
  const trees = 10 ** ((treeV - 2) * Math.log10(treeV));
  const ce = complete(40);
  const pe = path(100);
  return {
    treeV,
    treeCount: trees.toExponential(3),
    treeTime: duration(trees / 1e8),
    aComplete: checked("다시 찾기", 40, ce, byRescan(40, ce)),
    bComplete: checked("정점마다 하나", 40, ce, byRound(40, ce)),
    bPath: checked("정점마다 하나", 100, pe, byRound(100, pe)),
    qPath: heapRun(100, pe).ops,
    qComplete: heapRun(40, ce).ops,
  };
}

/* ────────────────────────── 블록 — 아이디어 상세 ────────────────────────── */

/** 경계 간선을 입력 위에 보이는 자리 — 정점 셋이 트리에 든 뒤. */
export const CUT_READ_T = "T4";

function cutRead(): string {
  const s = stepAt(CUT_READ_T);
  const rows = WALK_EDGES.map(([u, v, w]) => [
    edgeText(u, v, w),
    s.inTree[u] === true ? "참" : "거짓",
    s.inTree[v] === true ? "참" : "거짓",
    (s.inTree[u] === true) !== (s.inTree[v] === true) ? "경계 간선" : "아니다",
  ]);
  const cross = crossingOf(s.inTree);
  return [
    md(["간선 (u,v)=w", "inTree[u]", "inTree[v]", "판정"], rows),
    "",
    `${s.t} 가 끝난 뒤 S = ${setText(members(s.inTree))} 에서 경계 간선은 ${cross.map(edgeAt).join(" · ")} 의 ${cross.length} 개입니다.`,
  ].join("\n");
}

function cutGrow(): string {
  const rows: string[][] = [];
  let off = 0;
  for (const s of WALK.steps) {
    if (s.kind !== "join" || !s.popped || s.done) continue;
    const prev = before(s);
    const was = new Set(crossingOf(prev.inTree));
    const now = new Set(crossingOf(s.inTree));
    const gone = [...was].filter((e) => !now.has(e));
    const came = [...now].filter((e) => !was.has(e));
    const x = s.popped[0];
    for (const e of [...gone, ...came]) {
      const [u, v] = WALK_EDGES[e] as Edge;
      if (u !== x && v !== x) off++;
    }
    const show = (xs: number[]): string =>
      xs.length === 0 ? "없음" : xs.map(edgeAt).join(" · ");
    rows.push([s.t, String(x), show(gone), show(came), comma(now.size)]);
  }
  return [
    md(
      [
        "걸음",
        "새로 넣은 정점",
        "빠진 경계 간선",
        "들어온 경계 간선",
        "그 뒤 경계 간선 수",
      ],
      rows,
      [4],
    ),
    "",
    `빠지거나 들어온 간선 가운데 새로 넣은 정점을 끝점으로 갖지 않는 간선은 ${off} 개입니다.`,
  ].join("\n");
}

function cutVsTouch(): string {
  const rows: string[][] = [];
  let fails = 0;
  for (const s of WALK.steps) {
    if (s.kind !== "join" || !s.popped || s.popped[2] < 0) continue;
    const prev = before(s);
    const touch = WALK_EDGES.map((_, k) => k).filter((k) => {
      const [u, v] = WALK_EDGES[k] as Edge;
      return prev.inTree[u] === true || prev.inTree[v] === true;
    });
    const t = lightest(touch);
    const [tu, tv] = WALK_EDGES[t] as Edge;
    const adds = (prev.inTree[tu] === true) !== (prev.inTree[tv] === true);
    if (!adds) fails++;
    rows.push([
      setText(members(prev.inTree)),
      edgeAt(t),
      adds
        ? String(prev.inTree[tu] === true ? tv : tu)
        : "없다 — 두 끝이 다 트리 안",
      edgeAt(lightest(crossingOf(prev.inTree))),
    ]);
  }
  return [
    md(
      [
        "트리 안 정점 S",
        "끝점이 S 안에 있는 간선 중 가장 가벼운 것",
        "붙는 새 정점",
        "경계 간선 중 가장 가벼운 것",
      ],
      rows,
    ),
    "",
    `걸음 ${rows.length} 개 가운데 「끝점이 S 안에 있는 간선 중 가장 가벼운 것」으로는 새 정점이 안 붙는 걸음이 ${fails} 번입니다.`,
  ].join("\n");
}

/** 이웃 목록을 `이웃(가중치)` 꼴로. */
function adjText(n: number, edges: Edge[]): string[][] {
  const adj: string[][] = Array.from({ length: n }, () => []);
  for (const [u, v, w] of edges) {
    (adj[u] as string[]).push(`${v}(${w})`);
    (adj[v] as string[]).push(`${u}(${w})`);
  }
  return adj;
}

function stageStart(): string {
  const s = stepAt("T1");
  const adj = adjText(WALK_N, WALK_EDGES);
  const cells = adj.reduce((a, x) => a + x.length, 0);
  return [
    md(
      ["정점 x", "adj[x] — 이웃(가중치)", "inTree[x]"],
      adj.map((xs, x) => [
        String(x),
        xs.join(" "),
        s.inTree[x] === true ? "참" : "거짓",
      ]),
    ),
    "",
    `이웃 목록의 칸은 모두 ${cells} 개로 간선 수 ${WALK_EDGES.length} 의 두 배이고, 우선순위 큐에는 항목 ${s.heap.map(itemText).join(" ")} 하나가 들어 있습니다.`,
  ].join("\n");
}

function stagePop(): string {
  const rows: string[][] = [];
  for (const s of WALK.steps) {
    if (s.kind === "start") continue;
    const x = s.popped as Item;
    rows.push([
      s.t,
      itemText(x),
      before(s).inTree[x[0]] === true ? "참" : "거짓",
      s.kind === "stale" ? "지나간 후보 — 버린다" : "트리에 넣는다",
      comma(s.total),
      comma(s.joined),
    ]);
  }
  const joins = WALK.steps.filter((s) => s.kind === "join").length;
  const stale = WALK.steps.filter((s) => s.kind === "stale").length;
  const left = (WALK.steps.at(-1) as Step).heap;
  return [
    md(
      ["걸음", "꺼낸 항목", "inTree[u]", "판정", "그 뒤 total", "그 뒤 joined"],
      rows,
      [4, 5],
    ),
    "",
    `꺼낸 항목 ${rows.length} 개 가운데 트리에 넣은 것이 ${joins} 개, 버린 것이 ${stale} 개이고, 꺼내지 않은 채 남은 항목은 ${left.map(itemText).join(" ")} 입니다.`,
  ].join("\n");
}

function stagePush(): string {
  const rows = WALK.steps.map((s) => {
    const order = drainOrder(s.heap);
    const stale = order.filter((x) => isStale(s, x));
    return [
      s.t,
      s.pushed.length === 0 ? "없음" : s.pushed.map(itemText).join(" "),
      order.length === 0 ? "비어 있음" : order.map(itemText).join(" "),
      stale.length === 0 ? "없음" : stale.map(itemText).join(" "),
    ];
  });
  return [
    md(
      [
        "걸음",
        "넣은 항목",
        "걸음이 끝난 뒤 큐 — 꺼낼 차례",
        "그중 지나간 후보",
      ],
      rows,
    ),
    "",
    `넣은 항목은 모두 ${WALK.pushes} 개이고 간선은 ${WALK_EDGES.length} 개입니다. 큐에 한 번에 담긴 항목은 가장 많을 때 ${WALK.maxItems} 개였습니다.`,
  ].join("\n");
}

/** 큐에서 지나간 후보를 걷어 낸 것이 경계 간선과 같은가 — 걸음마다 정의에서 센 것과 맞댄다. */
function queueVsCut(): string {
  let measured = 0;
  let matched = 0;
  const rows: string[][] = [];
  for (const s of WALK.steps) {
    if (s.kind === "start" || s.done) continue;
    const live = drainOrder(s.heap)
      .filter((x) => !isStale(s, x))
      .map((x) => edgeOf(x))
      .sort((a, b) => a - b);
    const cross = [...crossingOf(s.inTree)].sort((a, b) => a - b);
    const ok = JSON.stringify(live) === JSON.stringify(cross);
    measured++;
    if (ok) matched++;
    const show = (xs: number[]): string =>
      xs.length === 0 ? "없음" : xs.map(edgeAt).join(" · ");
    rows.push([s.t, show(live), show(cross), ok ? "일치" : "불일치"]);
  }
  return [
    md(
      [
        "걸음",
        "지나간 후보를 뺀 큐 항목이 온 간선",
        "정의에서 센 경계 간선",
        "대조",
      ],
      rows,
    ),
    "",
    `정점을 다 채우기 전의 반복 걸음 ${measured} 개 가운데 두 목록이 일치한 걸음이 ${matched} 개입니다.`,
  ].join("\n");
}

function stageStop(): string {
  const rows: string[][] = [];
  for (const [name, run] of [
    ["전개 입력", WALK],
    ["둘씩 이어진 정점 넷", PAIRS],
  ] as [string, Run][]) {
    for (const s of run.steps) {
      if (s.kind === "start") continue;
      const last = s === run.steps.at(-1);
      rows.push([
        name,
        s.t,
        comma(s.joined),
        comma(s.heap.length),
        s.done
          ? "joined === n — total 을 돌려준다"
          : last
            ? "큐가 비었다 — joined < n 이라 -1"
            : "다음 항목",
      ]);
    }
  }
  const wl = WALK.steps.at(-1) as Step;
  const pl = PAIRS.steps.at(-1) as Step;
  return [
    md(["입력", "걸음", "joined", "그 뒤 큐 항목 수", "그 뒤"], rows, [2, 3]),
    "",
    `전개 입력은 joined 이 ${wl.joined}${이가(String(wl.joined))} 된 ${wl.t} 에서 ${WALK.answer}${을를(String(WALK.answer))} 돌려주고, 둘씩 이어진 정점 넷은 큐가 빌 때 joined 이 ${pl.joined}${josa(String(pl.joined), "이라", "라")} ${PAIRS.answer}${을를(String(PAIRS.answer))} 돌려줍니다.`,
  ].join("\n");
}

function storeSorted(): string {
  const rows = (
    [
      ["전개 입력", WALK_N, WALK_EDGES],
      ["한 줄로 이은 200 정점", 200, path(200)],
      ["별 모양 200 정점", 200, star(200)],
      ["완전 그래프 100 정점", 100, complete(100)],
    ] as [string, number, Edge[]][]
  ).map(([name, v, e]) => {
    const s = bySortedList(v, e);
    checked(`정렬 배열 · ${name}`, v, e, s);
    const h = heapRun(v, e);
    return [
      name,
      comma(v),
      comma(e.length),
      comma(s.ops),
      comma(s.shifts),
      comma(h.ops),
    ];
  });
  return [
    md(
      [
        "입력",
        "V",
        "E",
        "정렬 배열로 만든 우선순위 큐",
        "그중 뒤로 옮긴 칸",
        "이진 힙으로 만든 우선순위 큐",
      ],
      rows,
      [1, 2, 3, 4, 5],
    ),
    "",
    "두 방식 모두 네 입력에서 정본과 같은 합계를 냈습니다.",
  ].join("\n");
}

function storeChoice(): string {
  const rows: string[][] = [];
  for (const v of [50, 200, 400]) {
    for (const [shape, edges] of [
      ["한 줄로 이었다", path(v)],
      ["완전 그래프다", complete(v)],
    ] as [string, Edge[]][]) {
      const b = checked(
        `정점마다 하나 · ${shape} ${v}`,
        v,
        edges,
        byRound(v, edges),
      );
      const q = heapRun(v, edges).ops;
      rows.push([
        `${shape} V=${comma(v)}`,
        comma(edges.length),
        comma(b),
        comma(q),
        b < q ? "정점마다 하나" : "이진 힙",
      ]);
    }
  }
  return md(
    [
      "입력",
      "E",
      "정점마다 가장 가벼운 간선 하나",
      "이진 힙으로 만든 우선순위 큐",
      "적은 쪽",
    ],
    rows,
    [1, 2, 3],
  );
}

/* ────────────────────────── 블록 — 수행으로 알아보는 알고리즘 ────────────────────────── */

function walkT1(): string {
  const s = stepAt("T1");
  const adj = adjText(WALK_N, WALK_EDGES);
  const line = (from: number, to: number): string =>
    adj
      .slice(from, to)
      .map((xs, i) => `${from + i} -> ${xs.join(" ")}`)
      .join("   ");
  return [
    "T1 이 끝난 시점",
    ...pairs(
      [
        ["adj", line(0, 3)],
        ["", line(3, 6)],
        ["inTree", `[${s.inTree.join(", ")}]`],
        ["pq", s.heap.map(itemText).join(" ")],
        ["total · joined", `${s.total} · ${s.joined}`],
      ],
      "  ",
    ),
  ].join("\n");
}

async function mutantStart(): Promise<string> {
  const rows: string[][] = [];
  const sets = new Set<string>();
  const answers = new Set<number>();
  for (let v = 0; v < WALK_N; v++) {
    const mod = await startAt(v);
    const run = traced(WALK_N, WALK_EDGES, { start: v });
    agree(mod, WALK_N, WALK_EDGES, run.answer);
    const got = mod.primMst(WALK_N, WALK_EDGES);
    answers.add(got);
    const chosen = withWeights(run.chosen, WALK_EDGES);
    sets.add(
      JSON.stringify([...chosen].sort((a, b) => a[0] - b[0] || a[1] - b[1])),
    );
    rows.push([
      String(v),
      comma(got),
      chosen.map(([a, b, w]) => edgeText(a, b, w)).join(" "),
    ]);
  }
  return [
    md(["시작 정점", "반환값", "고른 간선을 고른 차례"], rows, [1]),
    "",
    `여섯 판의 반환값은 ${answers.size} 가지이고, 고른 간선의 모임도 ${sets.size} 가지입니다.`,
  ].join("\n");
}

function walkHeap(): string {
  const t2 = stepAt("T2");
  const h = new Heap();
  const lines: [string, string][] = [["넣기 전", "[]"]];
  for (const x of t2.pushed) {
    h.push(x);
    lines.push([
      `${itemText(x)}${을를(itemText(x))} 넣은 뒤`,
      `[${h.items.map(itemText).join(" ")}]`,
    ]);
  }
  if (JSON.stringify(h.items) !== JSON.stringify(t2.heap)) {
    throw new Error("힙 사본의 배열이 T2 뒤의 배열과 다르다");
  }
  const top = h.pop();
  lines.push([
    "한 번 꺼낸 뒤",
    `[${h.items.map(itemText).join(" ")}]  꺼낸 항목 ${itemText(top)}`,
  ]);
  let ok = 0;
  for (let i = 1; i < h.items.length; i++) {
    if ((h.items[(i - 1) >> 1] as Item)[1] <= (h.items[i] as Item)[1]) ok++;
  }
  return [
    `T2 가 넣는 항목 ${t2.pushed.map(itemText).join(" · ")} — 배열에 놓인 순서 그대로`,
    ...pairs(lines, "  "),
    "",
    `꺼낸 뒤 부모의 키가 자식 이하인 자리 ${ok} / ${Math.max(0, h.items.length - 1)}`,
  ].join("\n");
}

function lookLines(s: Step): string[] {
  const x = s.popped as Item;
  const out: [string, string][] = [
    [
      `${s.t}  꺼낸 항목 ${itemText(x)}`,
      s.kind === "stale"
        ? "이미 트리 안이다 -> 버린다"
        : `트리 밖이다 -> 넣는다. total = ${s.total - x[1]} + ${x[1]} = ${s.total}`,
    ],
  ];
  for (const l of s.looks) {
    out.push([
      `    이웃 ${l.v}(${l.w})`,
      l.outside
        ? `트리 밖이라 항목 ${l.v}(${l.w})${을를(`${l.v}(${l.w})`)} 넣는다`
        : "이미 트리 안이라 안 넣는다",
    ]);
  }
  out.push(["    큐 — 꺼낼 차례", drainOrder(s.heap).map(itemText).join(" ")]);
  return pairs(out);
}

function walkT3T4(): string {
  const t4 = stepAt("T4");
  const same = drainOrder(t4.heap).filter((x) => x[0] === 3);
  return [
    ...lookLines(stepAt("T3")),
    ...lookLines(t4),
    "",
    `T4 가 끝난 뒤 정점 3 짜리 항목 ${same.length} 개 — ${same.map(itemText).join(" · ")}`,
  ].join("\n");
}

function noSkipTrace(): string {
  const run = traced(WALK_N, WALK_EDGES, { noSkip: true });
  agree(NO_SKIP, WALK_N, WALK_EDGES, run.answer);
  const firstStale = WALK.steps.find((s) => s.kind === "stale") as Step;
  const from = WALK.steps.indexOf(firstStale);
  const rows = run.steps.slice(from).map((s, k) => {
    const x = s.popped as Item;
    const again = run.steps
      .slice(0, from + k)
      .some((p) => p.kind === "join" && p.popped?.[0] === x[0]);
    return [
      s.t,
      itemText(x),
      again
        ? `정점 ${x[0]}${은는(String(x[0]))} 이미 트리 안인데 또 넣는다`
        : `정점 ${x[0]}${을를(String(x[0]))} 넣는다`,
      comma(s.total),
      comma(s.joined),
      setText(members(s.inTree)),
    ];
  });
  const lastIn = (run.steps.at(-1) as Step).inTree;
  const missing = lastIn.flatMap((f, i) => (f ? [] : [i]));
  return [
    md(
      ["걸음", "꺼낸 항목", "한 일", "total", "joined", "트리 안 정점"],
      rows,
      [3, 4],
    ),
    "",
    `${firstStale.t} 앞까지는 정본과 같습니다. joined 이 ${WALK_N}${이가(String(WALK_N))} 되어 끝났을 때 트리 밖에 남은 정점은 ${missing.join(" · ")} 이고, 이 판은 ${run.answer}${을를(String(run.answer))} 돌려줍니다.`,
  ].join("\n");
}

/** 걸음마다 분기 조건의 참 · 거짓과 상태. */
function walkTrace(): string {
  const rows = WALK.steps.map((s) => {
    const queue =
      s.heap.length === 0
        ? "비어 있음"
        : drainOrder(s.heap).map(itemText).join(" ");
    if (s.kind === "start") {
      return [
        s.t,
        "-",
        "-",
        "-",
        `① 큐에 ${itemText(s.pushed[0] as Item)}`,
        `${s.total} · ${s.joined}`,
        queue,
      ];
    }
    const x = s.popped as Item;
    const stale = s.kind === "stale";
    const act = stale
      ? "②③ 버린다"
      : s.done
        ? "②⑤ 넣고 total 을 돌려준다"
        : `②④ 넣고 후보 ${s.pushed.length === 0 ? "없음" : s.pushed.map(itemText).join(" ")}`;
    return [
      s.t,
      itemText(x),
      stale ? "참" : "거짓",
      stale ? "-" : s.done ? "참" : "거짓",
      act,
      `${s.total} · ${s.joined}`,
      queue,
    ];
  });
  const last = WALK.steps.at(-1) as Step;
  const left = last.heap.map(itemText).join(" ");
  return [
    md(
      [
        "걸음",
        "꺼낸 항목",
        "inTree[u] === true",
        "joined === n",
        "갈래 · 한 일",
        "total · joined",
        "큐 — 꺼낼 차례",
      ],
      rows,
    ),
    "",
    `${last.t} 에서 정점 ${WALK_N} 개가 다 차 ${last.total}${을를(String(last.total))} 돌려주고, 큐에 남은 ${left}${은는(left)} 꺼내지 않습니다.`,
  ].join("\n");
}

function branchCoverage(): string {
  const count = (run: Run) => {
    const c = { s: 0, loop: 0, stale: 0, push: 0, done: 0, fail: 0 };
    for (const st of run.steps) {
      if (st.kind === "start") c.s++;
      else c.loop++;
      if (st.kind === "stale") c.stale++;
      if (st.kind === "join" && !st.done) c.push++;
      if (st.done) c.done++;
    }
    if (run.answer === -1) c.fail++;
    return c;
  };
  const a = count(WALK);
  const b = count(PAIRS);
  const rows: [string, string, keyof typeof a][] = [
    ["①", "시작 항목을 큐에 넣는다", "s"],
    ["②", "큐에 항목이 남아 한 번 더 반복한다", "loop"],
    ["③", "이미 트리 안이라 버린다", "stale"],
    ["④", "트리에 넣고 트리 밖 이웃을 후보로 넣는다", "push"],
    ["⑤", "정점이 다 차 total 을 돌려준다", "done"],
    ["⑥", "큐가 비어 끝나고 -1 을 돌려준다", "fail"],
  ];
  return md(
    ["라벨", "하는 일", "전개 입력", "둘씩 이어진 정점 넷"],
    rows.map(([l, d, k]) => [l, d, comma(a[k]), comma(b[k])]),
    [2, 3],
  );
}

function noCheckTrace(): string {
  const rows = PAIRS.steps.map((s) => [
    s.t,
    s.popped ? itemText(s.popped) : "-",
    s.kind === "start"
      ? `큐에 ${itemText(s.pushed[0] as Item)}`
      : s.pushed.length === 0
        ? "정점을 넣는다 · 넣을 후보 없음"
        : `정점을 넣는다 · 후보 ${s.pushed.map(itemText).join(" ")}`,
    comma(s.joined),
    comma(s.total),
    s.heap.length === 0 ? "비어 있음" : s.heap.map(itemText).join(" "),
  ]);
  const last = PAIRS.steps.at(-1) as Step;
  const got = NO_CHECK.primMst(PAIRS_N, PAIRS_EDGES);
  return [
    md(
      ["걸음", "꺼낸 항목", "한 일", "joined", "total", "그 뒤 큐"],
      rows,
      [3, 4],
    ),
    "",
    `큐가 빈 뒤 joined 은 ${last.joined}, n 은 ${PAIRS_N} 입니다. 정본은 ${PAIRS.answer}${을를(String(PAIRS.answer))}, 개수를 안 보는 판은 ${got}${을를(String(got))} 돌려줍니다.`,
  ].join("\n");
}

function walkResult(): string {
  const cases: [number, Edge[]][] = [
    [WALK_N, WALK_EDGES],
    [TRI_N, TRI_EDGES],
    [SQUARE_N, SQUARE_EDGES],
    [SPLIT_N, SPLIT_EDGES],
    [1, []],
  ];
  const calls = cases.map(([n, e]) => `primMst(${n}, ${JSON.stringify(e)})`);
  const w = Math.max(...calls.map((c) => c.length));
  return cases
    .map(
      ([n, e], i) => `${(calls[i] as string).padEnd(w)}  -> ${primMst(n, e)}`,
    )
    .join("\n");
}

/* ────────────────────────── 블록 — 파트 2 ────────────────────────── */

/** 두 정점 사이의 최단 거리 — 작은 그래프에서 단순 경로를 전부 늘어놓아 잰다. */
function dist(edges: Edge[], from: number, to: number): number {
  let best = Number.POSITIVE_INFINITY;
  const seen = new Set<number>([from]);
  const go = (x: number, d: number): void => {
    if (x === to) {
      if (d < best) best = d;
      return;
    }
    for (const [u, v, w] of edges) {
      const y = u === x ? v : v === x ? u : -1;
      if (y < 0 || seen.has(y)) continue;
      seen.add(y);
      go(y, d + w);
      seen.delete(y);
    }
  };
  go(from, 0);
  return best;
}

function mstVsPath(): string {
  const run = checkedRun(SPLITPATH_N, SPLITPATH_EDGES);
  const tree = withWeights(run.chosen, SPLITPATH_EDGES);
  const treeDist = dist(tree, 0, 2);
  const short = dist(SPLITPATH_EDGES, 0, 2);
  const direct = SPLITPATH_EDGES.find(([u, v]) => u === 0 && v === 2) as Edge;
  const held = tree.some(([a, b]) => a === 0 && b === 2);
  return [
    md(
      ["구조", "담은 간선", "가중치 합", "0 에서 2 까지의 길이"],
      [
        [
          "최소 신장 트리",
          tree.map(([a, b, w]) => edgeText(a, b, w)).join(" · "),
          comma(run.answer),
          comma(treeDist),
        ],
        ["그래프 전체의 최단 경로", edgeText(...direct), "-", comma(short)],
      ],
      [2, 3],
    ),
    "",
    `최소 신장 트리는 ${edgeText(...direct)}${을를(edgeText(...direct))} ${held ? "담고" : "담지 않아서"}, 트리 안에서 0 에서 2 로 가는 길이 ${comma(treeDist)} 로 가장 짧은 길 ${comma(short)} 보다 깁니다.`,
  ].join("\n");
}

const BENCH = benchJson as Record<string, number>;
const bench = (key: string): number => {
  const v = BENCH[key];
  if (v === undefined) throw new Error(`bench 에 ${key} 가 없다`);
  return v;
};
const PRIM = "후보를 우선순위 큐에 담아 하나씩 붙인다";
const KRUSKAL = "간선을 정렬하고 유니온 파인드로 판정";
const DENSITIES = [199, 280, 281, 4_322, 4_323, 19_900] as const;

function altOps(): string {
  let flips = 0;
  let prev = "";
  const rows = DENSITIES.map((e) => {
    const p = bench(`${PRIM} · E=${e} 기본 연산`);
    const k = bench(`${KRUSKAL} · E=${e} 기본 연산`);
    const less = p < k ? "프림" : "크러스컬";
    if (prev !== "" && prev !== less) flips++;
    prev = less;
    return [
      `E = ${comma(e)}`,
      comma(p),
      comma(k),
      less,
      `${(Math.max(k, p) / Math.min(k, p)).toFixed(2)} 배`,
    ];
  });
  return [
    md(
      [
        "정점 200 · 간선 수",
        "프림 기본 연산",
        "크러스컬 기본 연산",
        "적은 쪽",
        "차이",
      ],
      rows,
      [1, 2, 4],
    ),
    "",
    `표의 여섯 줄에서 적은 쪽이 ${flips} 번 바뀝니다.`,
  ].join("\n");
}

function altPops(): string {
  return md(
    [
      "정점 200 · 간선 수",
      "프림이 우선순위 큐에서 꺼낸 항목",
      "그때의 프림 기본 연산",
    ],
    [199, 4_322, 19_900].map((e) => [
      `E = ${comma(e)}`,
      comma(bench(`${PRIM} · E=${e} 꺼낸 항목`)),
      comma(bench(`${PRIM} · E=${e} 기본 연산`)),
    ]),
    [1, 2],
  );
}

function altCells(): string {
  return md(
    ["정점 200 · 간선 수", "프림 저장 칸", "크러스컬 저장 칸", "적은 쪽"],
    [199, 19_900].map((e) => {
      const p = bench(`${PRIM} · E=${e} 저장 칸`);
      const k = bench(`${KRUSKAL} · E=${e} 저장 칸`);
      return [
        `E = ${comma(e)}`,
        comma(p),
        comma(k),
        p < k ? "프림" : "크러스컬",
      ];
    }),
    [1, 2],
  );
}

function queueItems(): string {
  const rows = WALK.steps.map((s) => [
    s.t,
    setText(members(s.inTree)),
    comma(crossingOf(s.inTree).length),
    comma(s.heap.length),
    comma(s.heap.filter((x) => isStale(s, x)).length),
  ]);
  return [
    md(
      [
        "걸음",
        "트리 안 정점 S",
        "C(S) 의 간선 수",
        "큐에 남은 항목",
        "그중 지나간 후보",
      ],
      rows,
      [2, 3, 4],
    ),
    "",
    `큐에 넣은 항목은 모두 ${WALK.pushes} 개이고 간선은 ${WALK_EDGES.length} 개입니다. 한 번에 담긴 항목이 가장 많았던 때가 ${WALK.maxItems} 개입니다.`,
  ].join("\n");
}

function crossingScale(): string {
  const rows = [6, 100, 10_000].map((v) => {
    const e = v === 6 ? WALK_EDGES.length : (v * (v - 1)) / 2;
    const rescan = (v - 1) * e;
    const items = e + 1;
    return [
      comma(v),
      comma(e),
      comma(rescan),
      comma(items),
      `${(rescan / items).toLocaleString("en-US", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      })} 배`,
    ];
  });
  const bigE = (10_000 * 9_999) / 2;
  const bound = 4 * bigE + 3 * (bigE + 1) * Math.ceil(Math.log2(bigE + 1));
  return [
    md(
      [
        "정점 V",
        "간선 E",
        "경계 간선을 매번 다시 찾을 때 (V−1)E",
        "큐에 넣는 항목 E+1",
        "몇 배",
      ],
      rows,
      [0, 1, 2, 3, 4],
    ),
    "",
    `첫 줄은 전개 입력이고 뒤 두 줄은 완전 그래프입니다. 규모 상한 V = 10,000 · E = ${comma(bigE)} 에서 총식 4E + 3(E+1)⌈log₂(E+1)⌉ 은 ${comma(bound)} 입니다.`,
  ].join("\n");
}

/** 정점을 넣은 걸음마다 지금까지 넣은 간선 F 를 품은 최소 신장 트리가 있는가 — 전수 검사로 잰다. */
function invariantWatch(): string {
  const best = primMst(WALK_N, WALK_EDGES);
  const rows: string[][] = [];
  for (const s of WALK.steps) {
    if (s.kind !== "join") continue;
    const f = [...treeEdgesAfter(s.t)].sort((a, b) => a - b);
    const b = allSpanningTrees(WALK_N, WALK_EDGES, f);
    const touched = new Set<number>(members(s.inTree).slice(0, 1));
    for (const e of f) {
      const [u, v] = WALK_EDGES[e] as Edge;
      touched.add(u);
      touched.add(v);
    }
    const sTree = members(s.inTree);
    const same =
      JSON.stringify([...touched].sort((x, y) => x - y)) ===
      JSON.stringify(sTree);
    rows.push([
      s.t,
      f.length === 0 ? "없음" : f.map(edgeAt).join(" "),
      comma(b.min),
      b.min === best ? "있다" : "없다",
      setText(sTree),
      same ? "일치" : "불일치",
    ]);
  }
  return [
    md(
      [
        "걸음",
        "넣은 간선 F",
        "F 를 품은 신장 트리의 최소 합",
        "F 를 품은 최소 신장 트리",
        "inTree 가 참인 정점 S",
        "F 가 잇는 정점과 대조",
      ],
      rows,
      [2],
    ),
    "",
    `최소 신장 트리의 합은 ${comma(best)}${josa(comma(best), "이고", "고")} 셋째 열은 걸음마다 F 를 모두 담는 크기 ${WALK_N - 1} 간선 부분집합을 전부 검사해 낸 값입니다.`,
  ].join("\n");
}

/** 불변식 논증이 쓰는 걸음 — 끝에서 두 번째로 정점을 넣는 걸음. */
export const INV_T: string = (() => {
  const joins = WALK.steps.filter(
    (s) => s.kind === "join" && s.popped && s.popped[2] >= 0,
  );
  return (joins.at(-2) as Step).t;
})();

function invariantCut(): string {
  const s = stepAt(INV_T);
  const prev = before(s);
  const cross = crossingOf(prev.inTree);
  const picked = edgeOf(s.popped as Item);
  if (picked !== lightest(cross)) {
    throw new Error("꺼낸 간선이 경계 간선의 최소가 아니다");
  }
  const outside = prev.inTree.flatMap((f, i) => (f ? [] : [i]));
  const item = itemText(s.popped as Item);
  return [
    md(
      ["걸음", "S", "바깥", "경계 간선", "꺼낸 항목이 온 간선"],
      [
        [
          s.t,
          setText(members(prev.inTree)),
          setText(outside),
          cross.map(edgeAt).join(" · "),
          edgeAt(picked),
        ],
      ],
    ),
    "",
    `꺼낸 항목 ${item}${이가(item)} 온 간선이 경계 간선 ${cross.length} 개 가운데 가장 가볍습니다.`,
  ].join("\n");
}

function invariantEdges(): string {
  const cases: [string, number, Edge[]][] = [
    ["정점 하나 · 간선 없음", 1, []],
    ["정점 넷 · 간선 없음", 4, []],
    [
      "자기 자신을 잇는 간선이 섞인 정점 둘",
      2,
      [
        [0, 0, 100],
        [0, 1, 5],
      ],
    ],
    [
      "평행 간선 100 과 1",
      2,
      [
        [0, 1, 100],
        [0, 1, 1],
      ],
    ],
    [
      "가중치 0 이 섞인 정점 셋",
      3,
      [
        [0, 1, 0],
        [1, 2, 5],
      ],
    ],
    ["가중치가 같은 사각형", SQUARE_N, SQUARE_EDGES],
  ];
  return md(
    [
      "입력",
      "넣은 항목",
      "꺼낸 항목",
      "그중 버린 것",
      "끝에 남은 항목",
      "반환값",
    ],
    cases.map(([name, n, e]) => {
      const run = checkedRun(n, e);
      return [
        name,
        comma(run.pushes),
        comma(run.pops),
        comma(run.steps.filter((s) => s.kind === "stale").length),
        comma((run.steps.at(-1) as Step).heap.length),
        comma(run.answer),
      ];
    }),
    [1, 2, 3, 4, 5],
  );
}

function cumulativeTrees(): string {
  const run = traced(WALK_N, WALK_EDGES, { cumulative: true });
  agree(CUMULATIVE, WALK_N, WALK_EDGES, run.answer);
  const mine = withWeights(run.chosen, WALK_EDGES);
  const key = (e: Edge) => `${e[0]}-${e[1]}`;
  const base = new Set(MST.map(key));
  const moved = mine.filter((e) => !base.has(key(e))).length;
  const sum = (xs: Edge[]) => xs.reduce((a, e) => a + e[2], 0);
  return [
    md(
      [
        "큐에 넣는 키",
        "고른 간선을 고른 차례",
        "고른 간선의 가중치 합",
        "반환값",
      ],
      [
        [
          "간선 하나의 가중치 — 정본",
          MST.map(([a, b, w]) => edgeText(a, b, w)).join(" "),
          comma(sum(MST)),
          comma(primMst(WALK_N, WALK_EDGES)),
        ],
        [
          "꺼낸 항목의 키 + 간선 가중치",
          mine.map(([a, b, w]) => edgeText(a, b, w)).join(" "),
          comma(sum(mine)),
          comma(run.answer),
        ],
      ],
      [2, 3],
    ),
    "",
    `두 판이 고른 간선 ${MST.length} 개 가운데 ${moved} 개가 서로 다릅니다.`,
  ].join("\n");
}

function perfCount(): string {
  let cum = 0;
  const rows = WALK.steps.map((s) => {
    cum += s.pushed.length;
    return [
      s.t,
      s.kind === "start"
        ? "이웃 목록 만들기 · 시작 항목"
        : s.kind === "stale"
          ? "지나간 후보를 버린다"
          : s.done
            ? "정점을 넣고 끝낸다"
            : "정점을 넣고 이웃을 본다",
      comma(s.kind === "start" ? 0 : 1),
      comma(s.pushed.length),
      comma(s.looks.length),
      comma(cum),
    ];
  });
  return [
    md(
      ["걸음", "한 일", "꺼낸 항목", "넣은 항목", "본 이웃", "넣은 항목 누적"],
      rows,
      [2, 3, 4, 5],
    ),
    "",
    `이웃 목록에 간선 ${WALK_EDGES.length} 개를 ${WALK_EDGES.length * 2} 번 적었고, 꺼낸 항목이 모두 ${WALK.pops} 개, 넣은 항목이 ${WALK.pushes} 개, 본 이웃이 ${WALK.neighborChecks} 개입니다.`,
  ].join("\n");
}

function pathVsStar(): string {
  const v = 200;
  return md(
    ["입력", "V", "E", "큐에 한 번에 담긴 항목 최대", "기본 연산"],
    (
      [
        ["한 줄로 이은 200 정점", path(v)],
        ["별 모양 200 정점", star(v)],
      ] as [string, Edge[]][]
    ).map(([name, e]) => {
      const run = heapRun(v, e);
      return [
        name,
        comma(v),
        comma(e.length),
        comma(run.maxItems),
        comma(run.ops),
      ];
    }),
    [1, 2, 3, 4],
  );
}

function shapeValues(): string {
  const v = 20_000;
  return md(
    [
      "입력 모양",
      "V",
      "E",
      "큐에 한 번에 담긴 항목 최대",
      "넣은 항목",
      "기본 연산",
      "반환값",
    ],
    (
      [
        ["한 줄로 이었다", path(v)],
        ["별 모양이다", star(v)],
        ["한 줄로 잇고 같은 간선을 한 벌 더", doubled(v)],
        ["한 줄로 잇고 가장 무거운 간선을 한 벌 더", heavy(v)],
        ["앞의 절반만 잇는다", path(v / 2)],
      ] as [string, Edge[]][]
    ).map(([name, edges]) => {
      const run = heapRun(v, edges);
      return [
        name,
        comma(v),
        comma(edges.length),
        comma(run.maxItems),
        comma(run.pushes),
        comma(run.ops),
        run.answer === -1 ? "-1" : comma(run.answer),
      ];
    }),
    [1, 2, 3, 4, 5, 6],
  );
}

/** 스스로 점검하기 — 간선 (0,3) 의 가중치를 1 로 바꾼 입력. */
function selfcheckStale(): string {
  const edges: Edge[] = WALK_EDGES.map(([u, v, w]) =>
    u === 0 && v === 3 ? [u, v, 1] : [u, v, w],
  );
  const run = checkedRun(WALK_N, edges);
  const rows = run.steps.map((s) => {
    const x = s.popped;
    const who = x ? `정점 ${x[0]}${을를(String(x[0]))} 넣는다` : "";
    return [
      s.t,
      x ? itemText(x) : "-",
      s.kind === "start"
        ? `큐에 ${itemText(s.pushed[0] as Item)}`
        : s.kind === "stale"
          ? "이미 트리 안이라 버린다"
          : s.pushed.length === 0
            ? who
            : `${who} · 후보 ${s.pushed.map(itemText).join(" ")}`,
      comma(s.total),
    ];
  });
  const chosen = withWeights(run.chosen, edges);
  const stale = run.steps.filter((s) => s.kind === "stale");
  const left = (run.steps.at(-1) as Step).heap;
  return [
    md(["걸음", "꺼낸 항목", "한 일", "total"], rows, [3]),
    "",
    `고른 간선은 ${chosen.map(([a, b, w]) => edgeText(a, b, w)).join(" ")} 이고 합계는 ${comma(run.answer)} 입니다. 넣은 항목 ${run.pushes} 개 가운데 버린 항목은 ${stale.map((s) => itemText(s.popped as Item)).join(" · ")} 이고, 꺼내지 않고 남은 항목은 ${left.map(itemText).join(" ")} 입니다.`,
  ].join("\n");
}

/* ────────────────────────── 증명 블록 ────────────────────────── */

const START_BLOCK = await mutantStart();

export const PROOFS: Record<string, () => string> = {
  conceptCount,
  conceptCut,
  bruteWalk,
  subsetCount,
  naiveScale,
  greedyWalk,
  frontierCost,
  frontierQueue,
  cutRead,
  cutGrow,
  cutVsTouch,
  stageStart,
  stagePop,
  stagePush,
  queueVsCut,
  stageStop,
  storeSorted,
  storeChoice,
  walkT1,
  mutantStart: () => START_BLOCK,
  walkHeap,
  walkT3T4,
  mutantNoSkip: () => mutantTable("걸러 내지 않는 판", NO_SKIP, FOUR),
  noSkipTrace,
  walkTrace,
  branchCoverage,
  mutantNoCheck: () =>
    mutantTable("개수를 안 보는 판", NO_CHECK, [
      ["정점 셋에 간선 하나", SPLIT_N, SPLIT_EDGES],
      ["정점 넷 · 간선 없음", 4, []],
      ["둘씩 이어진 정점 넷", PAIRS_N, PAIRS_EDGES],
      ["전개 입력", WALK_N, WALK_EDGES],
    ]),
  noCheckTrace,
  walkResult,
  mstVsPath,
  altOps,
  altPops,
  altCells,
  queueItems,
  crossingScale,
  invariantWatch,
  invariantCut,
  invariantEdges,
  mutantCumulative: () =>
    mutantTable("누적 합을 키로 쓰는 판", CUMULATIVE, FOUR),
  cumulativeTrees,
  perfCount,
  pathVsStar,
  shapeValues,
  selfcheckStale,
};
