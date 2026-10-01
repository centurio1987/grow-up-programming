/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run tools/check-proof.ts src/algorithms/tree/treeDiameter/treeDiameter-guide.md
 *
 * **세는 사본이 셋 있다.** 정본은 칸을 몇 번 읽었는지도, 걸음마다의 상태도 내보내지 않으므로
 * 그 자리를 덧붙인 사본이 아니면 계수와 걸음을 낼 방법이 없다.
 *
 * - `traced` — 정본과 같은 절차에 걸음 기록을 덧붙인 판. 전개 입력처럼 작은 입력에만 쓴다. 걸음마다
 *   `dist` · 스택 · 부모 전체를 베끼므로 큰 입력에 쓰면 메모리가 모자란다.
 * - `sweep` — 탐색 한 번에서 칸 접근만 세는 가벼운 판. 정점 20,000 개 같은 큰 입력은 이것만 쓴다.
 * - `doubleFrom` — 첫 탐색의 시작 정점을 바꿀 수 있게 한 두 번 탐색(설계 선택).
 *
 * **답이 맞는지는 사본이 아니라 정본이 진다** — 사본은 부를 때마다 자기 답을 정본과 맞대고, 어긋나면 던진다.
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { josa, 과와, 으로, 은는, 을를, 이가 } from "../../../../tools/josa.ts";
import { treeDiameter } from "./treeDiameter-guide.ref.ts";

export type Edge = [number, number, number];

const REF = new URL("./treeDiameter-guide.ref.ts", import.meta.url).pathname;

/**
 * 본문 전개가 쓰는 고정 입력. 정점 0 이 지름의 끝점이 **아니라서** 첫 탐색의 최댓값과 지름이
 * 갈리고, 갈래가 둘씩 있는 정점이 있어 「이미 거리를 정한 정점」 검사가 실제로 실행된다.
 */
export const WALK_N = 7;
export const WALK_EDGES: Edge[] = [
  [0, 1, 2],
  [0, 2, 3],
  [1, 3, 4],
  [1, 4, 1],
  [2, 5, 5],
  [5, 6, 2],
];

const STAR: Edge[] = [
  [0, 1, 1],
  [0, 2, 2],
  [0, 3, 3],
  [0, 4, 4],
];

const LINE: Edge[] = [
  [0, 1, 2],
  [1, 2, 2],
  [2, 3, 2],
  [3, 4, 2],
];

/** 가장 작은 비자명 트리 넷. 표에 나란히 놓는다. */
const FOUR: [string, number, Edge[]][] = [
  ["전개 입력(정점 일곱)", WALK_N, WALK_EDGES],
  ["별 모양 다섯 정점", 5, STAR],
  ["한 줄로 이은 다섯 정점", 5, LINE],
  ["정점 하나", 1, []],
];

/** 정점 `v` 개를 한 줄로 이은 트리. 가중치는 자리 번호를 9 로 나눈 나머지 + 1 이다. */
function chain(v: number): Edge[] {
  const out: Edge[] = [];
  for (let i = 0; i + 1 < v; i++) out.push([i, i + 1, (i % 9) + 1]);
  return out;
}

/** 정점 0 이 나머지 전부와 이어진 트리. */
function star(v: number): Edge[] {
  const out: Edge[] = [];
  for (let i = 1; i < v; i++) out.push([0, i, (i % 9) + 1]);
  return out;
}

/** 완전 이진 트리 모양. 정점 `i` 의 부모가 `(i-1) >> 1` 이다. */
function binary(v: number): Edge[] {
  const out: Edge[] = [];
  for (let i = 1; i < v; i++) out.push([(i - 1) >> 1, i, (i % 9) + 1]);
  return out;
}

/** 애벌레 — 절반은 한 줄로 잇고 나머지 절반을 그 줄에 하나씩 매단다. */
function caterpillar(v: number): Edge[] {
  const spine = Math.floor(v / 2);
  const out: Edge[] = [];
  for (let i = 0; i + 1 < spine; i++) out.push([i, i + 1, (i % 9) + 1]);
  for (let i = spine; i < v; i++) out.push([i - spine, i, (i % 9) + 1]);
  return out;
}

/** 간선 가중치를 전부 1 로 — 경로의 간선 수를 잴 때 쓴다. */
const unit = (edges: Edge[]): Edge[] => edges.map(([u, v]) => [u, v, 1]);

/* ────────────────────────── 칸 맞춤 ────────────────────────── */

const width = (s: string): number =>
  [...s].reduce((n, c) => n + (/[ᄀ-ᇿ　-〿㄰-㆏가-힯一-鿿]/.test(c) ? 2 : 1), 0);

const pad = (s: string, to: number): string =>
  s + " ".repeat(Math.max(0, to - width(s)));

export const comma = (n: number): string => n.toLocaleString("en-US");

/** 등폭 글자 줄 — 열마다 가장 긴 칸에 맞춘다. */
function columns(rows: string[][], gap = "   "): string[] {
  const cols = Math.max(...rows.map((r) => r.length));
  const widths: number[] = [];
  for (let c = 0; c < cols; c++) {
    widths.push(Math.max(...rows.map((r) => width(r[c] ?? ""))));
  }
  return rows.map((r) =>
    r
      .map((cell, c) => pad(cell, widths[c] ?? 0))
      .join(gap)
      .replace(/\s+$/, ""),
  );
}

/** 마크다운 표. `right` 에 든 열은 오른쪽 정렬이다. */
function md(
  head: string[],
  rows: string[][],
  right: readonly number[] = [],
): string {
  const rule = head.map((_, c) => (right.includes(c) ? "---:" : "---"));
  const line = (cells: string[]) => `| ${cells.join(" | ")} |`;
  return [line(head), line(rule), ...rows.map(line)].join("\n");
}

export const listOf = (xs: readonly number[]): string => `[${xs.join(", ")}]`;

/* ────────────────────── 세는 사본과 다른 절차 ────────────────────── */

/** 정점마다의 이웃 목록. 정본과 같은 모양이다. */
export function neighbours(n: number, edges: Edge[]): [number, number][][] {
  const near: [number, number][][] = Array.from({ length: n }, () => []);
  for (const [u, v, w] of edges) {
    (near[u] as [number, number][]).push([v, w]);
    (near[v] as [number, number][]).push([u, w]);
  }
  return near;
}

/**
 * 탐색 한 번 — 가벼운 판. 칸 접근을 함께 센다. `dist` 초기화의 칸마다 하나, 시작점 표시에
 * 둘(거리 0 적기 · 스택에 넣기), 꺼내기마다 하나, 이웃 목록 항목 하나를 읽을 때 둘(이웃 번호 ·
 * 가중치), 거리를 적고 넣을 때 셋(`dist[u]` 읽기 · `dist[v]` 쓰기 · 넣기)이다.
 */
export function sweep(
  n: number,
  near: [number, number][][],
  start: number,
): { far: number; dist: number; cells: number; all: number[] } {
  const d: number[] = Array.from({ length: n }, () => -1);
  let cells = n;
  const stack: number[] = [start];
  d[start] = 0;
  cells += 2;
  let best = start;
  while (stack.length > 0) {
    const u = stack.pop() as number;
    cells += 1;
    for (const [v, w] of near[u] as [number, number][]) {
      cells += 2;
      if ((d[v] as number) >= 0) continue;
      d[v] = (d[u] as number) + w;
      stack.push(v);
      cells += 3;
      if ((d[v] as number) > (d[best] as number)) best = v;
    }
  }
  return { far: best, dist: d[best] as number, cells, all: d };
}

/** 첫 탐색을 `s` 에서 시작하는 두 번 탐색. `s = 0` 이면 정본과 같은 절차다. */
function doubleFrom(
  n: number,
  edges: Edge[],
  s: number,
): { a: number; answer: number; cells: number; first: number } {
  const near = neighbours(n, edges);
  const one = sweep(n, near, s);
  const two = sweep(n, near, one.far);
  return {
    a: one.far,
    answer: two.dist,
    cells: one.cells + two.cells + 2 * edges.length,
    first: one.dist,
  };
}

/** 두 번 탐색 — 정본과 같은 절차를 세는 사본. 답을 정본과 맞댄다. */
export function twoSweeps(
  n: number,
  edges: Edge[],
): { answer: number; cells: number } {
  const got = doubleFrom(n, edges, 0);
  if (got.answer !== treeDiameter(n, edges)) {
    throw new Error("세는 사본의 답이 정본과 다르다");
  }
  return { answer: got.answer, cells: got.cells };
}

/** 정점마다 한 번씩 재는 방법 — 기법이 하나도 안 들어간 풀이다. */
function everyStart(
  n: number,
  edges: Edge[],
): { answer: number; cells: number; perSweep: Set<number> } {
  const near = neighbours(n, edges);
  let cells = 2 * edges.length;
  let best = 0;
  const perSweep = new Set<number>();
  for (let s = 0; s < n; s++) {
    const got = sweep(n, near, s);
    cells += got.cells;
    perSweep.add(got.cells);
    if (got.dist > best) best = got.dist;
  }
  return { answer: best, cells, perSweep };
}

/** 모든 정점 쌍 거리 표. 트리에서는 유일 경로의 길이다. */
export function distanceTable(n: number, edges: Edge[]): number[][] {
  const near = neighbours(n, edges);
  return Array.from({ length: n }, (_, s) => sweep(n, near, s).all);
}

/** 트리에서 같은 정점 쌍(거리 0)까지 넣은 모든 쌍 거리의 최댓값. */
function allPairsMax(n: number, edges: Edge[]): number {
  let best = 0;
  for (const row of distanceTable(n, edges)) {
    for (const d of row) if (d > best) best = d;
  }
  return best;
}

/** 모든 정점 쌍 거리. 트리가 아닌 그래프에서는 최단 경로를 낸다(플로이드-워셜). */
function allPairsShortest(n: number, edges: Edge[]): number {
  const INF = Number.POSITIVE_INFINITY;
  const d: number[] = Array.from({ length: n * n }, () => INF);
  for (let i = 0; i < n; i++) d[i * n + i] = 0;
  for (const [u, v, w] of edges) {
    if (w < (d[u * n + v] as number)) {
      d[u * n + v] = w;
      d[v * n + u] = w;
    }
  }
  for (let k = 0; k < n; k++) {
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const viaK = (d[i * n + k] as number) + (d[k * n + j] as number);
        if (viaK < (d[i * n + j] as number)) d[i * n + j] = viaK;
      }
    }
  }
  let best = 0;
  for (const value of d) if (value !== INF && value > best) best = value;
  return best;
}

/** 트리에서 세 정점의 중앙점 — 세 쌍의 경로가 모두 지나는 유일한 정점. */
export function median(
  dist: number[][],
  u: number,
  v: number,
  x: number,
): number | null {
  for (let m = 0; m < dist.length; m++) {
    const du = (dist[u] as number[])[m] as number;
    const dv = (dist[v] as number[])[m] as number;
    const dx = (dist[x] as number[])[m] as number;
    if (
      du + dv === ((dist[u] as number[])[v] as number) &&
      dv + dx === ((dist[v] as number[])[x] as number) &&
      du + dx === ((dist[u] as number[])[x] as number)
    ) {
      return m;
    }
  }
  return null;
}

/* ────────────────────── 걸음 기록 — 정본과 같은 절차 ────────────────────── */

/** 꺼낸 정점의 이웃 항목 하나를 본 결과. */
export interface Check {
  readonly v: number;
  readonly w: number;
  /** `skip` 거리를 이미 정해 건너뛰었다 · `write` 거리를 적고 넣었다. */
  readonly kind: "skip" | "write";
  /** 본 순간의 `dist[v]`(건너뛸 때) 또는 새로 적은 값(적을 때). */
  readonly value: number;
  /** 비교 직전의 기록. `write` 일 때만 뜻이 있다. */
  readonly bestBefore: number;
  readonly bestDistBefore: number;
  /** `dist[v] > dist[best]` 가 참이었는가. */
  readonly moved: boolean;
}

/** 걸음 하나가 끝난 뒤의 상태 전체. */
export interface Step {
  readonly kind: "build" | "start" | "pop";
  /** 0 은 이웃 목록 만들기, 1 · 2 는 몇 번째 탐색인가. */
  readonly sweep: 0 | 1 | 2;
  /** 탐색의 시작 정점. 이웃 목록 만들기에서는 -1. */
  readonly start: number;
  /** 꺼낸 정점. 꺼내는 걸음이 아니면 -1. */
  readonly u: number;
  readonly checks: readonly Check[];
  readonly dist: readonly number[];
  /** 정점마다 부모 — `null` 은 거리를 아직 안 정했다, -1 은 시작 정점. */
  readonly par: readonly (number | null)[];
  readonly popped: readonly boolean[];
  readonly stack: readonly number[];
  /** 지금까지 가장 먼 정점. 이웃 목록 만들기에서는 -1. */
  readonly best: number;
  /** 이 걸음으로 탐색이 끝났는가. */
  readonly last: boolean;
}

export interface Trace {
  readonly near: [number, number][][];
  readonly steps: Step[];
  /** 첫 탐색이 찾은 가장 먼 정점. */
  readonly a: number;
  readonly answer: number;
}

/**
 * 정본과 같은 절차에 걸음 기록만 덧붙인 판. 작은 입력 전용이다 — 걸음마다 상태 전체를 베낀다.
 * 답을 정본과 맞대고, 어긋나면 던진다.
 */
export function traced(n: number, edges: Edge[]): Trace {
  const near = neighbours(n, edges);
  const steps: Step[] = [
    {
      kind: "build",
      sweep: 0,
      start: -1,
      u: -1,
      checks: [],
      dist: Array.from({ length: n }, () => -1),
      par: Array.from({ length: n }, () => null),
      popped: Array.from({ length: n }, () => false),
      stack: [],
      best: -1,
      last: false,
    },
  ];
  const run = (which: 1 | 2, start: number): [number, number] => {
    const dist: number[] = Array.from({ length: n }, () => -1);
    const par: (number | null)[] = Array.from({ length: n }, () => null);
    const popped: boolean[] = Array.from({ length: n }, () => false);
    const stack: number[] = [start];
    dist[start] = 0;
    par[start] = -1;
    let best = start;
    const snap = (
      kind: Step["kind"],
      u: number,
      checks: Check[],
      last: boolean,
    ): Step => ({
      kind,
      sweep: which,
      start,
      u,
      checks,
      dist: [...dist],
      par: [...par],
      popped: [...popped],
      stack: [...stack],
      best,
      last,
    });
    steps.push(snap("start", -1, [], false));
    while (stack.length > 0) {
      const u = stack.pop() as number;
      popped[u] = true;
      const checks: Check[] = [];
      for (const [v, w] of near[u] as [number, number][]) {
        if ((dist[v] as number) >= 0) {
          checks.push({
            v,
            w,
            kind: "skip",
            value: dist[v] as number,
            bestBefore: best,
            bestDistBefore: dist[best] as number,
            moved: false,
          });
          continue;
        }
        dist[v] = (dist[u] as number) + w;
        par[v] = u;
        stack.push(v);
        const bestBefore = best;
        const bestDistBefore = dist[best] as number;
        const moved = (dist[v] as number) > (dist[best] as number);
        if (moved) best = v;
        checks.push({
          v,
          w,
          kind: "write",
          value: dist[v] as number,
          bestBefore,
          bestDistBefore,
          moved,
        });
      }
      steps.push(snap("pop", u, checks, stack.length === 0));
    }
    return [best, dist[best] as number];
  };
  const [a] = run(1, 0);
  const [, answer] = run(2, a);
  if (answer !== treeDiameter(n, edges)) {
    throw new Error("걸음 기록 사본의 답이 정본과 다르다");
  }
  return { near, steps, a, answer };
}

/** 전개 입력의 걸음 기록. 걸음 `k` 가 원고의 `T{k+1}` 이다. */
export const WALK = traced(WALK_N, WALK_EDGES);

export const stepOf = (k: number): string => `T${k + 1}`;

/** 탐색 `which` 의 시작 걸음 · 마지막 걸음 차례. */
export function sweepBounds(which: 1 | 2): { from: number; to: number } {
  const ks = WALK.steps.flatMap((s, k) => (s.sweep === which ? [k] : []));
  return { from: ks[0] as number, to: ks.at(-1) as number };
}

/** 정점 번호로 부른 이웃 항목. */
const pair = (v: number, w: number): string => `(${v},${w})`;
const nearText = (near: [number, number][][], u: number): string =>
  `[${(near[u] as [number, number][]).map(([v, w]) => pair(v, w)).join(", ")}]`;

const distText = (dist: readonly number[]): string =>
  dist.map((d, v) => `${v}:${d < 0 ? "-" : d}`).join(" ");

/** 시작 정점에서 `v` 까지 부모를 따라 거꾸로 올라간 길(시작 정점부터). */
function pathFrom(par: readonly (number | null)[], v: number): number[] {
  const out: number[] = [v];
  let cur = v;
  while ((par[cur] ?? -1) !== -1) {
    cur = par[cur] as number;
    out.push(cur);
  }
  return out.reverse();
}

/** `s` 에서 매단 탐색 트리의 부모 — 정본과 같은 탐색을 한 번 돌려 받는다. */
export function parentsFrom(
  n: number,
  edges: Edge[],
  s: number,
): (number | null)[] {
  const near = neighbours(n, edges);
  const par: (number | null)[] = Array.from({ length: n }, () => null);
  const dist: number[] = Array.from({ length: n }, () => -1);
  const stack = [s];
  dist[s] = 0;
  par[s] = -1;
  while (stack.length > 0) {
    const u = stack.pop() as number;
    for (const [v, w] of near[u] as [number, number][]) {
      if ((dist[v] as number) >= 0) continue;
      dist[v] = (dist[u] as number) + w;
      par[v] = u;
      stack.push(v);
    }
  }
  return par;
}

/** 첫 탐색 · 둘째 탐색이 끝난 걸음. */
export const END1 = sweepBounds(1).to;
export const END2 = sweepBounds(2).to;

/* ────────────────────────── 변이 ────────────────────────── */

type Ref = { treeDiameter: (n: number, edges: Edge[]) => number };

/** 둘째 탐색의 출발점을 0 으로 되돌린 판. 첫 탐색의 최댓값이 그대로 답이 된다. */
const singleSweep = (): Promise<Ref> =>
  loadMutant<Ref>(REF, {
    swap: [
      /const \[, diameter\] = farthest\(a\);/,
      "const [, diameter] = farthest(0);",
    ],
  });

/** 거리를 누적하지 않고 간선 가중치만 적는 판. dist 가 「경로 길이」가 아니게 된다. */
const edgeOnly = (): Promise<Ref> =>
  loadMutant<Ref>(REF, {
    swap: [/dist\[v\] = \(dist\[u\] as number\) \+ w;/, "dist[v] = w;"],
  });

const SINGLE_MOD = await singleSweep();
const EDGE_MOD = await edgeOnly();

/* ────────────────────── 원고가 여러 번 쓰는 값 ────────────────────── */

export const WALK_TABLE = distanceTable(WALK_N, WALK_EDGES);

/** 지름과 그 쌍 — 모든 쌍을 재서 낸다. */
function diameterPairs(
  n: number,
  edges: Edge[],
): { D: number; pairs: [number, number][] } {
  const t = distanceTable(n, edges);
  let D = 0;
  for (const row of t) for (const d of row) if (d > D) D = d;
  const pairs: [number, number][] = [];
  for (let u = 0; u < n; u++) {
    for (let v = u + 1; v < n; v++) {
      if (((t[u] as number[])[v] as number) === D) pairs.push([u, v]);
    }
  }
  return { D, pairs };
}

export const WALK_DIAMETER = diameterPairs(WALK_N, WALK_EDGES);

/** 지름 쌍 하나의 경로 — 첫 정점에서 매단 트리로 부모를 따라간다. */
export function diameterPath(): number[] {
  const [x, y] = WALK_DIAMETER.pairs[0] as [number, number];
  return pathFrom(parentsFrom(WALK_N, WALK_EDGES, x), y);
}

/** 이심률 — 정점마다 가장 먼 정점까지의 거리. */
export function eccentricities(n: number, edges: Edge[]): number[] {
  return distanceTable(n, edges).map((row) => Math.max(...row));
}

/** 시도 사다리(`origin-approaches`)가 싣는 수. */
export function ladderNumbers() {
  const v = 10_000;
  const e = chain(v);
  const every = everyStart(v, e);
  const two = twoSweeps(v, e);
  const firsts = WALK_TABLE.map((row) => Math.max(...row));
  const worst = Math.min(...firsts);
  return {
    v,
    everyCells: every.cells,
    everySeconds: every.cells / 1e8,
    twoCells: two.cells,
    worstStart: firsts.indexOf(worst),
    worstFirst: worst,
    D: WALK_DIAMETER.D,
  };
}

/* ────────────────────────── 증명 블록 ────────────────────────── */

/** `concept` — 거리 몇 개와 지름. */
function conceptDistances(): string {
  const rows = (
    [
      [3, 4],
      [0, 6],
      [3, 6],
    ] as [number, number][]
  ).map(([u, v]) => {
    const path = pathFrom(parentsFrom(WALK_N, WALK_EDGES, u), v);
    return [
      `(${u}, ${v})`,
      path.join(" → "),
      comma((WALK_TABLE[u] as number[])[v] as number),
    ];
  });
  const pairCount = (WALK_N * (WALK_N - 1)) / 2;
  const { D, pairs } = WALK_DIAMETER;
  return [
    md(["정점 쌍", "지나는 정점", "거리"], rows, [2]),
    "",
    `정점 쌍 ${pairCount} 개의 거리를 모두 재면 가장 큰 값은 ${D} 이고, 그 값이 나오는 쌍은 ${pairs.map(([u, v]) => `(${u}, ${v})`).join(" · ")} ${pairs.length} 개입니다.`,
  ].join("\n");
}

/** `deep.origin` ② — 정점마다 한 번씩 재면 규모를 키울 때 얼마가 되는가. */
function naiveScale(): string {
  const rows: string[][] = [];
  const same: boolean[] = [];
  for (const v of [7, 100, 1_000, 10_000]) {
    const edges = chain(v);
    const every = everyStart(v, edges);
    const two = twoSweeps(v, edges);
    same.push(every.perSweep.size === 1);
    rows.push([
      comma(v),
      comma(every.cells),
      comma(two.cells),
      `${(every.cells / two.cells).toFixed(1)}배`,
      `${(every.cells / 1e8).toFixed(3)} 초`,
    ]);
  }
  // 규모 상한은 실제로 돌리기에 너무 커서 탐색 한 번의 칸 수에 정점 수를 곱한다.
  const v = 100_000;
  const e = chain(v);
  const one = sweep(v, neighbours(v, e), 0).cells;
  const every = one * v + 2 * e.length;
  const two = twoSweeps(v, e);
  rows.push([
    comma(v),
    comma(every),
    comma(two.cells),
    `${(every / two.cells).toFixed(1)}배`,
    `${(every / 1e8).toFixed(3)} 초`,
  ]);
  return [
    md(
      [
        "정점 V",
        "정점마다 한 번씩 재기",
        "두 번 탐색",
        "몇 배",
        "정점마다 한 번씩 재기의 시간(초당 1 억 칸)",
      ],
      rows,
      [0, 1, 2, 3, 4],
    ),
    "",
    `위 네 줄은 한 줄로 이은 트리에서 실제로 센 칸 접근이고, 네 규모 ${same.every(Boolean) ? "모두" : "모두는 아니게"} 탐색 한 번의 칸 수가 시작 정점과 상관없이 같았습니다. 마지막 줄의 왼쪽 값은 그 한 번의 칸 수 ${comma(one)}${을를(comma(one))} 정점 수만큼 곱하고 이웃 목록을 만드는 ${comma(2 * e.length)} 칸을 더해 냈습니다.`,
  ].join("\n");
}

/** `deep.origin` ③ — 시작 정점마다 첫 탐색이 내는 값. */
function firstSweeps(): string {
  const near = neighbours(WALK_N, WALK_EDGES);
  const got = Array.from({ length: WALK_N }, (_, s) => sweep(WALK_N, near, s));
  const cells = new Set(got.map((g) => g.cells));
  const fars = [...new Set(got.map((g) => g.far))].sort((x, y) => x - y);
  const maxes = got.map((g) => g.dist);
  return [
    md(
      [
        "시작 정점 s",
        "가장 먼 정점",
        "그 거리(첫 탐색의 최댓값)",
        "칸 접근",
      ],
      got.map((g, s) => [
        comma(s),
        comma(g.far),
        comma(g.dist),
        comma(g.cells),
      ]),
      [0, 1, 2, 3],
    ),
    "",
    `탐색 한 번이 읽고 쓴 칸은 ${cells.size === 1 ? `일곱 번 모두 ${comma(got[0]?.cells ?? 0)} 개` : "시작 정점마다 달랐습니다"}입니다. 최댓값은 ${Math.min(...maxes)} 부터 ${Math.max(...maxes)} 까지 갈리고, 가장 먼 정점으로 나온 것은 ${fars.join(" · ")} 뿐입니다.`,
  ].join("\n");
}

/** `deep.origin` ④ — 가장 먼 정점에서 한 번 더 재면. */
function secondSweeps(): string {
  const near = neighbours(WALK_N, WALK_EDGES);
  const rows: string[][] = [];
  const seconds: number[] = [];
  for (let s = 0; s < WALK_N; s++) {
    const one = sweep(WALK_N, near, s);
    const two = sweep(WALK_N, near, one.far);
    seconds.push(two.dist);
    rows.push([comma(s), comma(one.far), comma(two.far), comma(two.dist)]);
  }
  const all = seconds.every((x) => x === WALK_DIAMETER.D);
  return [
    md(
      [
        "시작 정점 s",
        "가장 먼 정점 a",
        "a 에서 가장 먼 정점",
        "a 에서 다시 잰 최댓값",
      ],
      rows,
      [0, 1, 2, 3],
    ),
    "",
    `오른쪽 끝 칸이 ${all ? `일곱 줄 모두 ${WALK_DIAMETER.D}${josa(WALK_DIAMETER.D, "이고", "고")}` : "줄마다 다르고"}, 정점 쌍을 모두 잰 지름 ${WALK_DIAMETER.D}${과와(WALK_DIAMETER.D)} ${all ? "같습니다" : "다릅니다"}.`,
  ].join("\n");
}

/** `deep.origin` ④ — 같은 입력을 두 방식으로 처리한 계수. */
function bruteWalk(): string {
  const every = everyStart(WALK_N, WALK_EDGES);
  const two = twoSweeps(WALK_N, WALK_EDGES);
  if (every.answer !== two.answer) throw new Error("두 방법의 답이 갈린다");
  return [
    md(
      ["방법", "탐색 횟수", "칸 접근", "답"],
      [
        [
          "정점마다 한 번씩 재기",
          comma(WALK_N),
          comma(every.cells),
          comma(every.answer),
        ],
        ["두 번 탐색", "2", comma(two.cells), comma(two.answer)],
      ],
      [1, 2, 3],
    ),
    "",
    `두 방법의 답은 둘 다 ${two.answer} 이고, 칸 접근은 ${comma(every.cells)} 대 ${comma(two.cells)} 입니다. 두 값 모두 이웃 목록을 만드는 ${comma(2 * WALK_EDGES.length)} 칸을 포함합니다.`,
  ].join("\n");
}

/** 두 정점을 잇는 간선의 가중치. */
const weightOf = (p: number, v: number): number =>
  (
    (WALK.near[p] as [number, number][]).find(([x]) => x === v) as [
      number,
      number,
    ]
  )[1];

/** `deep.build` 낯선 개념 (c) — 첫 탐색이 끝난 뒤 정점 하나씩 읽기. */
function treeRead(): string {
  const s = WALK.steps[END1] as Step;
  let ok = 0;
  const rows = s.dist.map((d, v) => {
    const p = s.par[v] as number;
    if (p === -1) return [comma(v), "없음 (시작 정점)", "—", "—", comma(d)];
    const sum = (s.dist[p] as number) + weightOf(p, v);
    if (sum === d) ok++;
    return [
      comma(v),
      comma(p),
      comma(weightOf(p, v)),
      `${s.dist[p]} + ${weightOf(p, v)} = ${sum}`,
      comma(d),
    ];
  });
  return [
    md(
      [
        "정점 v",
        "부모",
        "부모와 잇는 간선의 가중치",
        "dist[부모] + 가중치",
        "dist[v]",
      ],
      rows,
      [0, 2, 4],
    ),
    "",
    `시작 정점 ${s.start}${을를(s.start)} 뺀 정점 ${WALK_N - 1} 개 가운데 dist[v] 가 dist[부모] + 가중치와 같은 정점은 ${ok} 개입니다.`,
  ].join("\n");
}

/** `deep.build` 낯선 개념 (d) — 두 탐색의 걸음 전부에서 관계 넷을 잰다. */
function treeRelation(): string {
  const rel = [0, 0, 0, 0];
  const bad = [0, 0, 0, 0];
  const count = (i: number, good: boolean) => {
    rel[i] = (rel[i] as number) + 1;
    if (!good) bad[i] = (bad[i] as number) + 1;
  };
  for (const which of [1, 2] as const) {
    const end = WALK.steps[sweepBounds(which).to] as Step;
    for (let v = 0; v < WALK_N; v++) {
      const p = end.par[v] as number;
      if (p !== -1) {
        count(0, end.dist[v] === (end.dist[p] as number) + weightOf(p, v));
      }
      count(1, pathFrom(end.par, v)[0] === end.start);
    }
  }
  for (let k = 1; k < WALK.steps.length; k++) {
    const prev = WALK.steps[k - 1] as Step;
    const cur = WALK.steps[k] as Step;
    if (cur.kind !== "pop" || prev.sweep !== cur.sweep) continue;
    for (let v = 0; v < WALK_N; v++) {
      if ((prev.dist[v] as number) >= 0) {
        count(2, prev.dist[v] === cur.dist[v]);
      }
    }
    const seen = cur.checks.filter((c) => c.kind === "skip").map((c) => c.v);
    const parent = cur.par[cur.u] as number;
    count(
      3,
      parent === -1
        ? seen.length === 0
        : seen.length === 1 && seen[0] === parent,
    );
  }
  const rows = [
    "dist[v] = dist[부모] + 부모와 잇는 간선의 가중치",
    "부모를 따라 올라가면 시작 정점에 이른다",
    "한 번 적은 dist 는 그 탐색이 끝날 때까지 안 바뀐다",
    "꺼낸 정점의 이웃 가운데 dist 가 이미 있는 것은 부모 하나뿐이다(시작 정점은 없다)",
  ].map((name, i) => [name, comma(rel[i] as number), comma(bad[i] as number)]);
  const total = bad.reduce((x, y) => x + y, 0);
  return [
    md(["관계", "확인한 자리", "어긋난 자리"], rows, [1, 2]),
    "",
    `두 탐색의 걸음 전부에서 관계 4 개를 쟀고, 어긋난 자리는 ${total} 개입니다.`,
  ].join("\n");
}

/** 탐색 트리에서 정점의 깊이(간선 수). */
const depthIn = (par: readonly (number | null)[], v: number): number =>
  pathFrom(par, v).length - 1;

/** `deep.build` 낯선 개념 (e) — 같은 트리를 0 과 a 에서 매단 두 탐색 트리. */
function rerootCompare(): string {
  const other = WALK.a;
  const p0 = parentsFrom(WALK_N, WALK_EDGES, 0);
  const p6 = parentsFrom(WALK_N, WALK_EDGES, other);
  const show = (p: number | null) => (p === -1 ? "없음" : String(p));
  let samePar = 0;
  let sameDepth = 0;
  const rows = Array.from({ length: WALK_N }, (_, v) => {
    if (p0[v] === p6[v]) samePar++;
    if (depthIn(p0, v) === depthIn(p6, v)) sameDepth++;
    return [
      comma(v),
      show(p0[v] ?? null),
      comma(depthIn(p0, v)),
      show(p6[v] ?? null),
      comma(depthIn(p6, v)),
    ];
  });
  const all = Array.from({ length: WALK_N }, (_, v) => v);
  const h0 = Math.max(...all.map((v) => depthIn(p0, v)));
  const h6 = Math.max(...all.map((v) => depthIn(p6, v)));
  return [
    md(
      [
        "정점",
        "0 에서 매단 트리의 부모",
        "깊이(간선 수)",
        `${other} 에서 매단 트리의 부모`,
        "깊이(간선 수)",
      ],
      rows,
      [0, 2, 4],
    ),
    "",
    `두 탐색 트리에서 부모가 같은 정점은 ${samePar} 개, 깊이가 같은 정점은 ${sameDepth} 개입니다. 가장 깊은 정점의 깊이는 0 에서 매단 트리가 ${h0}, ${other} 에서 매단 트리가 ${h6} 입니다.`,
  ].join("\n");
}

/** `deep.build` 1단계 — 전개 입력의 이웃 목록. */
function buildLists(): string {
  const rows = WALK.near.map((list, u) => [
    comma(u),
    nearText(WALK.near, u),
    comma(list.length),
  ]);
  const total = WALK.near.reduce((s, l) => s + l.length, 0);
  return [
    md(["정점 u", "near[u] — (이웃, 가중치)", "길이"], rows, [0, 2]),
    "",
    `길이를 모두 더하면 ${total} 이고, 간선 ${WALK_EDGES.length} 개의 두 배입니다.`,
  ].join("\n");
}

/** `deep.build` 2단계 — 첫 탐색의 이웃 항목 전부. */
function buildSweep(): string {
  const { from, to } = sweepBounds(1);
  const rows: string[][] = [];
  let writes = 0;
  let skips = 0;
  let parentSkips = 0;
  for (let k = from + 1; k <= to; k++) {
    const s = WALK.steps[k] as Step;
    const stackNow = [...(WALK.steps[k - 1] as Step).stack];
    stackNow.pop();
    for (const c of s.checks) {
      if (c.kind === "skip") {
        skips++;
        if (s.par[s.u] === c.v) parentSkips++;
        rows.push([
          comma(s.u),
          comma(c.v),
          comma(c.value),
          "건너뛴다",
          listOf(stackNow),
        ]);
      } else {
        writes++;
        stackNow.push(c.v);
        rows.push([
          comma(s.u),
          comma(c.v),
          "-1",
          `dist[${c.v}] = ${s.dist[s.u]} + ${c.w} = ${c.value}${으로(c.value)} 적고 넣는다`,
          listOf(stackNow),
        ]);
      }
    }
  }
  return [
    md(
      ["꺼낸 정점 u", "이웃 v", "그때의 dist[v]", "한 일", "그 뒤 stack"],
      rows,
      [0, 1, 2],
    ),
    "",
    `이웃 항목 ${writes + skips} 개 가운데 dist 를 적은 것이 ${writes} 개, 건너뛴 것이 ${skips} 개이고, 건너뛴 ${skips} 개 가운데 꺼낸 정점의 부모인 것은 ${parentSkips} 개입니다. 스택은 ${to - from} 번 꺼낸 뒤 비었습니다.`,
  ].join("\n");
}

/** `deep.build` 3단계 — 첫 탐색에서 best 를 옮기는 비교. */
function buildBest(): string {
  const { from, to } = sweepBounds(1);
  const rows: string[][] = [];
  let yes = 0;
  let all = 0;
  for (let k = from + 1; k <= to; k++) {
    for (const c of (WALK.steps[k] as Step).checks) {
      if (c.kind !== "write") continue;
      all++;
      if (c.moved) yes++;
      rows.push([
        comma(c.v),
        comma(c.value),
        comma(c.bestBefore),
        comma(c.bestDistBefore),
        `${c.value} > ${c.bestDistBefore} ${c.moved ? "참" : "거짓"}`,
        comma(c.moved ? c.v : c.bestBefore),
      ]);
    }
  }
  const end = WALK.steps[to] as Step;
  return [
    md(
      [
        "새로 적은 정점 v",
        "dist[v]",
        "그때의 best",
        "dist[best]",
        "비교",
        "그 뒤 best",
      ],
      rows,
      [0, 1, 2, 3, 5],
    ),
    "",
    `비교 ${all} 번 가운데 참이 ${yes} 번이라 best 가 ${yes} 번 옮겨 갔고, 탐색이 끝났을 때 best 는 ${end.best}, dist[${end.best}] = ${end.dist[end.best]} 입니다.`,
  ].join("\n");
}

/** `deep.build` 4단계 — 두 탐색의 dist 를 나란히. */
function buildSecond(): string {
  const e1 = WALK.steps[END1] as Step;
  const e2 = WALK.steps[END2] as Step;
  let same = 0;
  const rows = e1.dist.map((d, v) => {
    if (d === e2.dist[v]) same++;
    return [comma(v), comma(d), comma(e2.dist[v] as number)];
  });
  return [
    md(
      [
        "정점",
        `첫 탐색의 dist (${e1.start} 에서)`,
        `둘째 탐색의 dist (${e2.start} 에서)`,
      ],
      rows,
      [0, 1, 2],
    ),
    "",
    `두 탐색에서 dist 가 같은 정점은 ${same} 개입니다. 둘째 탐색의 best 는 ${e2.best}${이가(e2.best)} 되었고 dist[${e2.best}] = ${e2.dist[e2.best]} 입니다.`,
  ].join("\n");
}

/** 정점 넷의 트리를 전부 — 간선 셋을 고르는 경우 가운데 사이클이 없는 것. */
function treesOnFour(): [number, number][][] {
  const all: [number, number][] = [];
  for (let u = 0; u < 4; u++) for (let v = u + 1; v < 4; v++) all.push([u, v]);
  const out: [number, number][][] = [];
  for (let a = 0; a < all.length; a++) {
    for (let b = a + 1; b < all.length; b++) {
      for (let c = b + 1; c < all.length; c++) {
        const es = [all[a], all[b], all[c]] as [number, number][];
        const root = [0, 1, 2, 3];
        const find = (x: number): number => {
          let cur = x;
          while (root[cur] !== cur) cur = root[cur] as number;
          return cur;
        };
        let ok = true;
        for (const [u, v] of es) {
          const ru = find(u);
          const rv = find(v);
          if (ru === rv) ok = false;
          else root[ru] = rv;
        }
        if (ok) out.push(es);
      }
    }
  }
  return out;
}

/** 정점 넷의 트리마다 가중치 -2 ~ 2 를 모두 넣은 입력. 차례가 정해져 있다. */
function weightedFours(): Edge[][] {
  const ws = [-2, -1, 0, 1, 2];
  const out: Edge[][] = [];
  for (const t of treesOnFour()) {
    for (const w0 of ws) {
      for (const w1 of ws) {
        for (const w2 of ws) {
          const w = [w0, w1, w2];
          out.push(t.map(([u, v], i) => [u, v, w[i] as number]));
        }
      }
    }
  }
  return out;
}

/**
 * 표시를 `dist` 의 -1 대신 따로 둔 탐색 한 번. 정본은 `dist[v] = -1` 을 「아직 안 정했다」로 읽으므로
 * 가중치가 음수면 표시부터 뜻을 잃는다 — 그래서 음수 가중치에서는 정본을 부르지 않고, 표시만 따로 둔
 * 이 판으로 「가장 먼 정점에서 한 번 더 잰다」는 생각 자체를 잰다.
 */
function sweepMarked(
  n: number,
  near: [number, number][][],
  start: number,
): { far: number; dist: number; all: number[] } {
  const d: number[] = Array.from({ length: n }, () => 0);
  const seen: boolean[] = Array.from({ length: n }, () => false);
  const stack: number[] = [start];
  seen[start] = true;
  let best = start;
  while (stack.length > 0) {
    const u = stack.pop() as number;
    for (const [v, w] of near[u] as [number, number][]) {
      if (seen[v]) continue;
      seen[v] = true;
      d[v] = (d[u] as number) + w;
      stack.push(v);
      if ((d[v] as number) > (d[best] as number)) best = v;
    }
  }
  return { far: best, dist: d[best] as number, all: d };
}

/** 표시를 따로 둔 두 번 탐색과, 같은 판으로 잰 모든 쌍 거리의 최댓값. */
function markedPair(
  n: number,
  edges: Edge[],
): { two: number; all: number; table: number[][] } {
  const near = neighbours(n, edges);
  const one = sweepMarked(n, near, 0);
  const two = sweepMarked(n, near, one.far).dist;
  const table = Array.from(
    { length: n },
    (_, s) => sweepMarked(n, near, s).all,
  );
  let all = 0;
  for (const row of table) for (const d of row) if (d > all) all = d;
  return { two, all, table };
}

/** 두 번 탐색이 지름을 놓치는 첫 입력. */
function firstNegativeMiss(): Edge[] {
  const hit = weightedFours().find((e) => {
    const got = markedPair(4, e);
    return got.two !== got.all;
  });
  if (hit === undefined) throw new Error("반례가 없다");
  return hit;
}

/** `deep.build` 전제 — 음수 가중치에서 두 번 탐색이 지름을 놓치는가. */
function negativeWeight(): string {
  const all = weightedFours();
  let wrong = 0;
  let nonNeg = 0;
  let nonNegWrong = 0;
  for (const e of all) {
    const neg = e.some(([, , w]) => w < 0);
    const got = markedPair(4, e);
    if (!neg) {
      nonNeg++;
      // 음이 아닌 가중치에서는 표시를 따로 둔 판이 정본과 같은 답을 내야 한다.
      if (got.two !== treeDiameter(4, e))
        throw new Error("표시를 둔 판이 정본과 다르다");
    }
    if (got.two !== got.all) {
      wrong++;
      if (!neg) nonNegWrong++;
    }
  }
  const ex = firstNegativeMiss();
  const exText = ex.map(([u, v, w]) => `[${u},${v},${w}]`).join(" ");
  const got = markedPair(4, ex);
  return [
    md(
      ["입력", "두 번 탐색의 답", "모든 쌍 거리의 최댓값"],
      [[exText, comma(got.two), comma(got.all)]],
      [1, 2],
    ),
    "",
    `정점 넷의 트리 ${treesOnFour().length} 가지에 가중치 -2 부터 2 까지를 모두 넣은 ${comma(all.length)} 가지 가운데 두 답이 갈린 것은 ${comma(wrong)} 가지이고, 그중 가중치가 모두 0 이상인 ${comma(nonNeg)} 가지에서 갈린 것은 ${nonNegWrong} 가지입니다. 두 값 모두 표시를 dist 와 따로 둔 판으로 쟀고, 가중치가 모두 0 이상인 입력에서는 그 판의 답이 정본과 같습니다. 모든 쌍 거리의 최댓값에는 같은 정점끼리의 거리 0 도 넣었습니다.`,
  ].join("\n");
}

/** 음수도 값인 거리 줄 — 표시를 따로 둔 판이라 -1 이 「아직」이 아니다. */
const signedText = (dist: readonly number[]): string =>
  dist.map((d, v) => `${v}:${d}`).join(" ");

/** `deep.build` 음수 가중치 반례의 자취. */
function negativeTrace(): string {
  const edges = firstNegativeMiss();
  const near = neighbours(4, edges);
  const one = sweepMarked(4, near, 0);
  const two = sweepMarked(4, near, one.far);
  const { table } = markedPair(4, edges);
  let bu = 0;
  let bv = 0;
  for (let u = 0; u < 4; u++) {
    for (let v = 0; v < 4; v++) {
      if (
        ((table[u] as number[])[v] as number) >
        ((table[bu] as number[])[bv] as number)
      ) {
        bu = u;
        bv = v;
      }
    }
  }
  const far = (table[bu] as number[])[bv] as number;
  return columns([
    [
      "첫 탐색 (0 에서)",
      `dist ${signedText(one.all)}`,
      `best ${one.far} (거리 ${one.dist})`,
    ],
    [
      `둘째 탐색 (${one.far} 에서)`,
      `dist ${signedText(two.all)}`,
      `best ${two.far} (거리 ${two.dist})`,
    ],
    [
      "가장 먼 쌍",
      `d(${bu},${bv}) = ${far}`,
      `두 번 탐색이 ${far - two.dist} 만큼 모자라다`,
    ],
  ]).join("\n");
}

/** `deep.build` 설계 선택 — 첫 탐색을 어느 정점에서 시작해도 되는가. */
function startChoice(): string {
  const shapes: [string, number, Edge[]][] = [
    ["전개 입력", WALK_N, WALK_EDGES],
    ["별 모양 다섯 정점", 5, STAR],
    ["한 줄로 이은 다섯 정점", 5, LINE],
    ["완전 이진 트리 15 정점", 15, binary(15)],
    ["애벌레 12 정점", 12, caterpillar(12)],
    ["한 줄로 이은 30 정점", 30, chain(30)],
  ];
  let starts = 0;
  let off = 0;
  const rows = shapes.map(([name, n, edges]) => {
    const D = allPairsMax(n, edges);
    if (doubleFrom(n, edges, 0).answer !== treeDiameter(n, edges)) {
      throw new Error("시작 정점 0 의 사본이 정본과 다르다");
    }
    let bad = 0;
    const firsts = new Set<number>();
    for (let s = 0; s < n; s++) {
      const got = doubleFrom(n, edges, s);
      firsts.add(got.first);
      if (got.answer !== D) bad++;
    }
    starts += n;
    off += bad;
    return [name, comma(n), comma(firsts.size), comma(D), comma(bad)];
  });
  return [
    md(
      [
        "트리",
        "시작 정점 가짓수",
        "첫 탐색의 최댓값 가짓수",
        "지름",
        "둘째 탐색이 지름과 다른 가짓수",
      ],
      rows,
      [1, 2, 3, 4],
    ),
    "",
    `시작 정점 ${starts} 가지 가운데 둘째 탐색의 값이 지름과 다른 것은 ${off} 가지입니다.`,
  ].join("\n");
}

/** `deep.walk` 도입 — 끝까지 쓸 고정 입력. */
function walkInput(): string {
  const ans = treeDiameter(WALK_N, WALK_EDGES);
  return [
    `const n = ${WALK_N};`,
    "const edges: [number, number, number][] = [",
    `  ${WALK_EDGES.map(([u, v, w]) => `[${u}, ${v}, ${w}]`).join(", ")},`,
    "];",
    `// 이 절이 끝나면 ${ans}${이가(ans)} 나와야 한다`,
  ].join("\n");
}

/** `deep.walk` 1 — 이웃 목록을 만든 뒤의 상태. */
function walkLists(): string {
  const rows: string[][] = WALK.near.map((list, u) => [
    `near[${u}] = ${nearText(WALK.near, u)}`,
    list.length === 1
      ? "잎이라 이웃이 하나"
      : `이웃 ${list.map(([v]) => v).join(" · ")}`,
  ]);
  const total = WALK.near.reduce((s, l) => s + l.length, 0);
  rows.push([`목록 길이의 합 ${total}`, `= 2E (간선 ${WALK_EDGES.length} 개)`]);
  return columns(rows).join("\n");
}

/** 걸음 하나에서 이웃 항목 하나를 본 일을 한 줄로. */
function checkText(s: Step, c: Check): string {
  if (c.kind === "skip") {
    return `dist[${c.v}] = ${c.value} ≥ 0 참 → 건너뛴다 ①`;
  }
  const cmp = c.moved
    ? `${c.value} > ${c.bestDistBefore} 참 → best = ${c.v} ②`
    : `${c.value} > ${c.bestDistBefore} 거짓`;
  return `dist[${c.v}] = -1 → ${s.dist[s.u]} + ${c.w} = ${c.value} · ${cmp}`;
}

/** `deep.walk` 2 — 첫 탐색의 처음 세 번 꺼내기. */
function walkFirstPops(): string {
  const { from } = sweepBounds(1);
  const rows: string[][] = [];
  for (let k = from + 1; k <= from + 3; k++) {
    const s = WALK.steps[k] as Step;
    rows.push([
      stepOf(k),
      `${s.u}${을를(s.u)} 꺼낸다`,
      `near[${s.u}] = ${nearText(WALK.near, s.u)}`,
    ]);
    for (const c of s.checks) rows.push(["", `v = ${c.v}`, checkText(s, c)]);
    rows.push([
      "",
      "그 뒤",
      `dist ${distText(s.dist)} · stack ${listOf(s.stack)} · best ${s.best}`,
    ]);
  }
  return columns(rows).join("\n");
}

/** `deep.walk.pause` — 한 번만 재는 변이. */
function mutantSingle(): string {
  const neutral = SINGLE_MOD.treeDiameter === treeDiameter;
  const rows = FOUR.map(([name, n, e]) => {
    const a = treeDiameter(n, e);
    const b = SINGLE_MOD.treeDiameter(n, e);
    return [name, comma(a), comma(b), a === b ? "같다" : "어긋난다"];
  });
  const diff = rows.filter((r) => r[3] === "어긋난다").length;
  if (!neutral && diff === 0) throw new Error("변이가 답을 안 바꿨다");
  return md(
    ["입력", "정본", "둘째 탐색도 0 에서 하는 판", "두 답"],
    rows,
    [1, 2],
  );
}

/** `deep.walk.pause` — 별 모양에서 두 판이 무엇을 하는가. */
function starTrace(): string {
  const near = neighbours(5, STAR);
  const one = sweep(5, near, 0);
  const two = sweep(5, near, one.far);
  const again = sweep(5, near, 0);
  if (two.dist !== treeDiameter(5, STAR))
    throw new Error("사본이 정본과 다르다");
  return columns([
    ["0 에서 잰다", `가장 먼 정점 ${one.far}, 거리 ${one.dist}`, "첫 탐색"],
    [
      `${one.far} 에서 다시 잰다`,
      `가장 먼 정점 ${two.far}, 거리 ${two.dist}`,
      `정본의 답 ${two.dist}`,
    ],
    [
      "0 에서 다시 잰다",
      `가장 먼 정점 ${again.far}, 거리 ${again.dist}`,
      `변이의 답 ${again.dist} — ${two.dist - again.dist} 만큼 모자라다`,
    ],
  ]).join("\n");
}

/** `deep.walk` 3 — 두 탐색이 끝났을 때. */
function walkTwoSweeps(): string {
  const e1 = WALK.steps[END1] as Step;
  const e2 = WALK.steps[END2] as Step;
  return columns([
    [
      `첫 탐색 start = ${e1.start}`,
      `dist ${distText(e1.dist)}`,
      `best ${e1.best} (거리 ${e1.dist[e1.best]})`,
      `③ a = ${WALK.a}`,
    ],
    [
      `둘째 탐색 start = ${e2.start}`,
      `dist ${distText(e2.dist)}`,
      `best ${e2.best} (거리 ${e2.dist[e2.best]})`,
      `④ 답 ${WALK.answer}`,
    ],
  ]).join("\n");
}

/** 걸음 하나를 표 한 줄로 — 하는 일 · 조건 판정 · 갈래. */
export function stepSummary(k: number): {
  what: string;
  cond: string;
  marks: string[];
} {
  const s = WALK.steps[k] as Step;
  if (s.kind === "build") {
    return { what: "간선 목록을 이웃 목록으로 옮긴다", cond: "—", marks: [] };
  }
  if (s.kind === "start") {
    return s.sweep === 1
      ? {
          what: `첫 탐색 · 정점 ${s.start} 에서 시작`,
          cond: `dist[${s.start}] = 0 · best = ${s.start}`,
          marks: [],
        }
      : {
          what: "둘째 탐색 · 첫 탐색의 best 에서 시작",
          cond: `a = ${s.start} · dist 를 새로 만든다`,
          marks: ["③"],
        };
  }
  const parts = s.checks.map((c) =>
    c.kind === "skip"
      ? `dist[${c.v}] ≥ 0 참`
      : `dist[${c.v}] ≥ 0 거짓 → ${c.value} · ${c.value} > ${c.bestDistBefore} ${c.moved ? "참" : "거짓"}`,
  );
  const marks = s.checks.flatMap((c) =>
    c.kind === "skip" ? ["①"] : c.moved ? ["②"] : [],
  );
  if (s.last && s.sweep === 2) marks.push("④");
  return {
    what: `${s.u}${을를(s.u)} 꺼낸다`,
    cond: parts.join(" / "),
    marks,
  };
}

/** `deep.walk` 4 — 걸음 전부의 상태와 분기 판정. */
function walkTrace(): string {
  const rows = WALK.steps.map((s, k) => {
    const sum = stepSummary(k);
    return [
      stepOf(k),
      sum.what,
      sum.cond,
      sum.marks.length === 0 ? "—" : sum.marks.join(" "),
      listOf(s.stack),
      s.best < 0 ? "—" : `${s.best} (${s.dist[s.best]})`,
    ];
  });
  const count = (m: string) =>
    WALK.steps.reduce(
      (acc, _, k) => acc + stepSummary(k).marks.filter((x) => x === m).length,
      0,
    );
  const at = (m: string) =>
    WALK.steps
      .flatMap((_, k) => (stepSummary(k).marks.includes(m) ? [stepOf(k)] : []))
      .join(" · ");
  const noMove = WALK.steps.flatMap((s, k) =>
    s.checks.some((c) => c.kind === "write" && !c.moved) ? [stepOf(k)] : [],
  );
  return [
    md(
      [
        "걸음",
        "하는 일",
        "조건 판정",
        "갈래",
        "그 뒤 stack",
        "그 뒤 best (거리)",
      ],
      rows,
    ),
    "",
    `① 은 ${at("①")} 에서 ${count("①")} 번, ② 는 ${at("②")} 에서 ${count("②")} 번, ③ 은 ${at("③")}, ④ 는 ${at("④")} 에서 실행됐습니다. 새로 적은 거리가 dist[best] 보다 크지 않아 best 가 그대로 남은 걸음은 ${noMove.join(" · ")} 입니다. 반환값은 ${WALK.answer} 입니다.`,
  ].join("\n");
}

const CYCLE: Edge[] = [
  [0, 1, 10],
  [0, 2, 1],
  [0, 3, 1],
  [1, 2, 1],
];

/** `deep.walk.pause` — 트리가 아닌 그래프에 그대로 쓰면. */
function notATree(): string {
  const rows: string[][] = [];
  for (const [name, n, edges] of [
    ["0-1-2 가 고리를 이루고 3 이 0 에 매달렸다", 4, CYCLE],
    [
      "같은 고리에 가중치만 다르다",
      4,
      [
        [0, 1, 3],
        [0, 2, 1],
        [0, 3, 4],
        [1, 2, 1],
      ],
    ],
    ["그 고리에서 간선 [1,2] 를 빼 트리로 만들었다", 4, CYCLE.slice(0, 3)],
  ] as [string, number, Edge[]][]) {
    rows.push([
      name,
      comma(treeDiameter(n, edges)),
      comma(allPairsShortest(n, edges)),
    ]);
  }
  return md(["입력", "이 코드가 낸 값", "최단 거리의 최댓값"], rows, [1, 2]);
}

/** `deep.walk.pause` — 고리가 있으면 거리를 어디서 잘못 적는가. */
function notATreeTrace(): string {
  const t = traced(4, CYCLE);
  const pops = t.steps.filter((s) => s.kind === "pop" && s.sweep === 1);
  const first = pops[0] as Step;
  const skipper = pops.find((s) =>
    s.checks.some((c) => c.kind === "skip" && c.v === 1),
  ) as Step;
  const w01 = (CYCLE[0] as Edge)[2];
  const via = (CYCLE[1] as Edge)[2] + (CYCLE[3] as Edge)[2];
  const end1 = t.steps.filter((s) => s.sweep === 1).at(-1) as Step;
  return columns([
    [
      "실제 최단 거리",
      `d(0,1) = ${via}`,
      `0 → 2 → 1 이 0 → 1 (${w01}) 보다 짧다`,
    ],
    [
      `${first.u}${을를(first.u)} 꺼낸다`,
      `near[0] = ${nearText(t.near, 0)}`,
      `1 에 ${first.dist[1]}${을를(first.dist[1] as number)} 적는다`,
    ],
    [
      `${skipper.u}${을를(skipper.u)} 꺼낸다`,
      `이웃 1 의 dist 가 이미 ${skipper.dist[1]} 이다`,
      "건너뛴다 — 짧은 길을 볼 기회가 없다",
    ],
    [
      "첫 탐색이 끝났을 때",
      `dist ${distText(end1.dist)}`,
      `best ${end1.best} (거리 ${end1.dist[end1.best]})`,
    ],
    ["답", `${t.answer}`, `최단 거리의 최댓값 ${allPairsShortest(4, CYCLE)}`],
  ]).join("\n");
}

/** `deep.walk.final` — 전체 코드를 네 입력에 실행한 값. */
function walkResult(): string {
  return columns(
    FOUR.map(([, n, e]) => [
      `treeDiameter(${n}, [${e.map(([u, v, w]) => `[${u},${v},${w}]`).join(",")}])`,
      `→   ${treeDiameter(n, e)}`,
    ]),
  ).join("\n");
}

/** `related` — 이심률 표. */
function relatedEcc(): string {
  const ecc = eccentricities(WALK_N, WALK_EDGES);
  const R = Math.min(...ecc);
  const D = Math.max(...ecc);
  const centers = ecc.flatMap((e, v) => (e === R ? [v] : []));
  const ends = ecc.flatMap((e, v) => (e === D ? [v] : []));
  const path = diameterPath();
  const c = centers[0] as number;
  const x = path[0] as number;
  const y = path.at(-1) as number;
  const dx = (WALK_TABLE[x] as number[])[c] as number;
  const dy = (WALK_TABLE[c] as number[])[y] as number;
  return [
    md(
      ["정점 s", ...ecc.map((_, v) => String(v))],
      [["ecc(s)", ...ecc.map((e) => comma(e))]],
      ecc.map((_, v) => v + 1),
    ),
    "",
    `이심률의 최댓값 ${D}${이가(D)} 나오는 정점은 ${ends.join(" · ")} 이고, 최솟값 ${R}${이가(R)} 나오는 정점은 ${centers.join(" · ")} 입니다. 정점 ${c}${은는(c)} 지름 경로 ${path.join(" → ")} 위에 있고, ${x} 에서 ${c} 까지가 ${dx}, ${c} 에서 ${y} 까지가 ${dy} 입니다.`,
  ].join("\n");
}

/** `related` — 두 번 탐색이 남긴 거리 두 벌로 이심률을 낸다. */
function relatedByproduct(): string {
  const [x, y] = WALK_DIAMETER.pairs[0] as [number, number];
  const ecc = eccentricities(WALK_N, WALK_EDGES);
  const by = Array.from({ length: WALK_N }, (_, v) =>
    Math.max(
      (WALK_TABLE[v] as number[])[x] as number,
      (WALK_TABLE[v] as number[])[y] as number,
    ),
  );
  const same = by.filter((b, v) => b === ecc[v]).length;
  return `max(d(v,${x}), d(v,${y})) 가 ecc(v) 와 같은 정점   ${same} / ${WALK_N}`;
}

/** `deep.math` — 중앙점 보조정리를 전개 입력에서 값으로 확인한다. */
function medianCheck(): string {
  const rows: string[][] = [];
  const tris: [number, number, number][] = [
    [4, 3, 6],
    [0, 3, 6],
    [3, 4, 5],
    [6, 4, 2],
  ];
  let ok = 0;
  const d = (p: number, q: number) => (WALK_TABLE[p] as number[])[q] as number;
  for (const [u, v, x] of tris) {
    const m = median(WALK_TABLE, u, v, x);
    if (m === null) throw new Error(`중앙점이 없다 — ${u} ${v} ${x}`);
    const l1 = d(u, m) + d(m, v);
    const l2 = d(v, m) + d(m, x);
    if (l1 === d(u, v) && l2 === d(v, x)) ok++;
    rows.push([
      `${u} · ${v} · ${x}`,
      comma(m),
      comma(l1),
      comma(d(u, v)),
      comma(l2),
      comma(d(v, x)),
    ]);
  }
  return [
    md(
      [
        "세 정점 u · v · x",
        "중앙점 m",
        "d(u,m) + d(m,v)",
        "d(u,v)",
        "d(v,m) + d(m,x)",
        "d(v,x)",
      ],
      rows,
      [1, 2, 3, 4, 5],
    ),
    "",
    `세 정점 ${tris.length} 벌 가운데 두 쌍의 값이 모두 같은 것은 ${ok} 벌입니다.`,
  ].join("\n");
}

/** `deep.math` — s = 4 로 둔 첫째 중앙점의 세 등식. */
function mathK(): string {
  const [x, y] = WALK_DIAMETER.pairs[0] as [number, number];
  const s = 4;
  const k = median(WALK_TABLE, s, x, y) as number;
  const d = (p: number, q: number) => (WALK_TABLE[p] as number[])[q] as number;
  return columns([
    [`s = ${s} · (x, y) = (${x}, ${y})`, `k = m(${s}, ${x}, ${y}) = ${k}`, ""],
    [
      `d(${s},${x}) = ${d(s, x)}`,
      `= d(${s},${k}) + d(${k},${x}) = ${d(s, k)} + ${d(k, x)}`,
      "첫째 등식",
    ],
    [
      `d(${s},${y}) = ${d(s, y)}`,
      `= d(${s},${k}) + d(${k},${y}) = ${d(s, k)} + ${d(k, y)}`,
      "둘째 등식",
    ],
    [
      `D = ${d(x, y)}`,
      `= d(${k},${x}) + d(${k},${y}) = ${d(k, x)} + ${d(k, y)}`,
      "셋째 등식",
    ],
  ]).join("\n");
}

/** `deep.math` — s = 4 에서 둘째 중앙점과 부등식. */
function mathIneq(): string {
  const [x, y] = WALK_DIAMETER.pairs[0] as [number, number];
  const s = 4;
  const near = neighbours(WALK_N, WALK_EDGES);
  const a = sweep(WALK_N, near, s).far;
  const k = median(WALK_TABLE, s, x, y) as number;
  const j = median(WALK_TABLE, s, a, k) as number;
  const d = (p: number, q: number) => (WALK_TABLE[p] as number[])[q] as number;
  const right = d(j, k) + d(k, y);
  return columns([
    [`a = ${a}`, `j = m(${s}, ${a}, ${k}) = ${j}`, ""],
    ["왼쪽", `d(j,a) = d(${j},${a}) = ${d(j, a)}`, ""],
    [
      "오른쪽",
      `d(j,k) + d(k,y) = d(${j},${k}) + d(${k},${y}) = ${d(j, k)} + ${d(k, y)} = ${right}`,
      d(j, a) === right ? "등호로 성립한다" : "부등호로 성립한다",
    ],
  ]).join("\n");
}

/** `deep.math` — 유도의 부등식 사슬을 트리 둘의 시작 정점 전부에서 값으로 확인한다. */
function theoremCheck(): string {
  const rows: string[][] = [];
  let all = 0;
  let zero = 0;
  let equal = 0;
  for (const [label, n, edges, x, y] of [
    ["전개 입력", WALK_N, WALK_EDGES, 3, 6],
    ["별 모양 다섯", 5, STAR, 4, 3],
  ] as [string, number, Edge[], number, number][]) {
    const dist = distanceTable(n, edges);
    const near = neighbours(n, edges);
    const d = (p: number, q: number): number =>
      (dist[p] as number[])[q] as number;
    if (d(x, y) !== allPairsMax(n, edges)) throw new Error("지름 쌍이 틀렸다");
    for (let s = 0; s < n; s++) {
      const a = sweep(n, near, s).far;
      const k = median(dist, s, x, y);
      if (k === null) throw new Error("k 가 없다");
      const j = median(dist, s, a, k);
      if (j === null) throw new Error("j 가 없다");
      const target = a === x ? y : x;
      all++;
      if (d(j, k) === 0) zero++;
      if (d(a, target) === d(x, y) + 2 * d(j, k)) equal++;
      rows.push([
        label,
        comma(s),
        comma(a),
        comma(k),
        comma(j),
        comma(d(j, k)),
        comma(d(a, target)),
        comma(d(x, y) + 2 * d(j, k)),
      ]);
    }
  }
  return [
    md(
      [
        "트리",
        "시작 s",
        "a",
        "k",
        "j",
        "d(j,k)",
        "d(a, 반대쪽 끝)",
        "D + 2d(j,k)",
      ],
      rows,
      [1, 2, 3, 4, 5, 6, 7],
    ),
    "",
    `지름 쌍은 전개 입력이 (3, 6), 별 모양이 (4, 3) 입니다. 반대쪽 끝은 a 가 x 면 y 를, 아니면 x 를 잡았습니다. ${all} 줄 가운데 d(j,k) = 0 인 줄이 ${zero} 개, 오른쪽 두 칸이 같은 줄이 ${equal} 개입니다.`,
  ].join("\n");
}

/** `invariant` ② — 걸음마다 적힌 dist 가 실제 경로 길이와 같은가. */
function invariantCheck(): string {
  let steps = 0;
  let cells = 0;
  let bad = 0;
  let bestBad = 0;
  for (const s of WALK.steps) {
    if (s.sweep === 0) continue;
    steps++;
    for (let v = 0; v < WALK_N; v++) {
      const d = s.dist[v] as number;
      if (d < 0) continue;
      cells++;
      if (d !== ((WALK_TABLE[s.start] as number[])[v] as number)) bad++;
    }
    const set = s.dist.filter((d) => d >= 0);
    if (s.dist[s.best] !== Math.max(...set)) bestBad++;
  }
  return [
    md(
      ["확인한 것", "확인한 자리", "어긋난 자리"],
      [
        [
          "적힌 dist[v] 가 시작 정점에서 v 까지의 유일한 경로 길이와 같다",
          comma(cells),
          comma(bad),
        ],
        [
          "dist[best] 가 적힌 dist 가운데 가장 크다",
          comma(steps),
          comma(bestBad),
        ],
      ],
      [1, 2],
    ),
    "",
    `두 탐색의 걸음 ${steps} 개가 끝날 때마다 쟀고, 어긋난 자리는 ${bad + bestBad} 개입니다. 경로 길이는 정점마다 따로 탐색해 만든 거리 표에서 받았습니다.`,
  ].join("\n");
}

/** `invariant` ② — 경계에 있는 입력. */
function invariantEdges(): string {
  const cases: [string, string, number, Edge[]][] = [
    [
      "정점 하나 `treeDiameter(1, [])`",
      "0 을 넣고 꺼내면 이웃이 없어 끝난다",
      1,
      [],
    ],
    [
      "정점 둘 `treeDiameter(2, [[0,1,5]])`",
      "첫 탐색이 1 을 찾고 둘째 탐색이 0 을 찾는다",
      2,
      [[0, 1, 5]],
    ],
    [
      "가중치가 전부 0 `treeDiameter(3, [[0,1,0],[1,2,0]])`",
      "`dist[v] > dist[best]` 가 한 번도 참이 안 되어 best 가 시작 정점에 머문다",
      3,
      [
        [0, 1, 0],
        [1, 2, 0],
      ],
    ],
    [
      "별 모양 다섯 정점",
      "첫 탐색이 잎 하나를 찾고 둘째 탐색이 다른 잎을 찾는다",
      5,
      STAR,
    ],
    [
      "한 줄로 이은 다섯 정점",
      "정점 0 이 이미 한쪽 끝이라 첫 탐색이 곧바로 지름을 낸다",
      5,
      LINE,
    ],
  ];
  return md(
    ["입력", "처리되는 자리", "정본의 답"],
    cases.map(([name, where, n, e]) => [
      name,
      where,
      comma(treeDiameter(n, e)),
    ]),
    [2],
  );
}

/** `invariant` ③ — 거리를 누적하지 않는 변이. */
function mutantEdgeOnly(): string {
  const neutral = EDGE_MOD.treeDiameter === treeDiameter;
  const rows = FOUR.map(([name, n, e]) => {
    const a = treeDiameter(n, e);
    const b = EDGE_MOD.treeDiameter(n, e);
    return [name, comma(a), comma(b), a === b ? "같다" : "어긋난다"];
  });
  if (!neutral && rows.every((r) => r[3] === "같다")) {
    throw new Error("변이가 답을 안 바꿨다");
  }
  return md(["입력", "정본", "간선 가중치만 적는 판", "두 답"], rows, [1, 2]);
}

/**
 * `invariant` ③ — 변이가 전개 입력에서 적는 dist. 변이와 같은 줄을 바꾼 사본으로 내고, 답을 변이와
 * 맞댄다(중화 실행에서는 변이가 정본이라 맞대기를 건너뛴다).
 */
function edgeOnlyTrace(): string {
  const near = neighbours(WALK_N, WALK_EDGES);
  const run = (start: number) => {
    const d: number[] = Array.from({ length: WALK_N }, () => -1);
    const stack = [start];
    d[start] = 0;
    let best = start;
    while (stack.length > 0) {
      const u = stack.pop() as number;
      for (const [v, w] of near[u] as [number, number][]) {
        if ((d[v] as number) >= 0) continue;
        d[v] = w;
        stack.push(v);
        if ((d[v] as number) > (d[best] as number)) best = v;
      }
    }
    return { best, d };
  };
  const one = run(0);
  const two = run(one.best);
  const answer = two.d[two.best] as number;
  const neutral = EDGE_MOD.treeDiameter === treeDiameter;
  if (!neutral && answer !== EDGE_MOD.treeDiameter(WALK_N, WALK_EDGES)) {
    throw new Error("사본이 변이와 다르다");
  }
  const heavy = WALK_EDGES.reduce((m, e) => (e[2] > m[2] ? e : m));
  return columns([
    [
      "첫 탐색 (0 에서)",
      `dist ${distText(one.d)}`,
      `best ${one.best} (값 ${one.d[one.best]})`,
    ],
    [
      `둘째 탐색 (${one.best} 에서)`,
      `dist ${distText(two.d)}`,
      `best ${two.best} (값 ${answer})`,
    ],
    ["가장 무거운 간선", `[${heavy.join(",")}]`, `가중치 ${heavy[2]}`],
    [
      "답",
      `${answer}`,
      `지름 ${WALK.answer}${과와(WALK.answer)} ${WALK.answer - answer} 만큼 다르다`,
    ],
  ]).join("\n");
}

/** `perf.derive` — 첫 탐색이 실제로 한 일을 항목별로. */
function perfDeriveFirst(): string {
  const { from, to } = sweepBounds(1);
  let reads = 0;
  let writes = 0;
  for (let k = from + 1; k <= to; k++) {
    for (const c of (WALK.steps[k] as Step).checks) {
      reads++;
      if (c.kind === "write") writes++;
    }
  }
  const measured = sweep(WALK_N, neighbours(WALK_N, WALK_EDGES), 0).cells;
  const rows: [string, number, string][] = [
    ["dist 배열 만들기", WALK_N, "정점마다 -1 을 적는다"],
    ["시작 정점 표시", 2, `${stepOf(from)} 의 dist[0] = 0 과 스택에 넣기`],
    [
      "정점 꺼내기",
      to - from,
      `${stepOf(from + 1)}~${stepOf(to)} 에서 한 번씩`,
    ],
    [
      "이웃 목록 항목 읽기",
      2 * reads,
      `항목 ${reads} 개 × 이웃 번호와 가중치 둘`,
    ],
    [
      "거리 적고 스택에 넣기",
      3 * writes,
      `정점 ${writes} 개 × 세 칸(dist[u] 읽기 · dist[v] 쓰기 · 넣기)`,
    ],
  ];
  const sum = rows.reduce((s, r) => s + r[1], 0);
  if (sum !== measured) throw new Error("항목별 합이 세는 사본과 다르다");
  return [
    md(
      ["항목", "칸 수", "근거"],
      rows.map(([a, b, c]) => [a, comma(b), c]),
      [1],
    ),
    "",
    `다섯 항목의 합은 ${sum} 칸이고, 세는 사본이 첫 탐색에서 센 값도 ${measured} 칸입니다.`,
  ].join("\n");
}

/** `perf.derive` — 두 번 탐색의 칸 접근을 닫힌 형태와 대조한다. */
function costClosedForm(): string {
  const rows: string[][] = [];
  let off = 0;
  for (const [name, v, edges] of [
    ["전개 입력", WALK_N, WALK_EDGES],
    ["한 줄 100 정점", 100, chain(100)],
    ["별 모양 1,000 정점", 1_000, star(1_000)],
    ["완전 이진 트리 20,000 정점", 20_000, binary(20_000)],
  ] as [string, number, Edge[]][]) {
    const got = twoSweeps(v, edges).cells;
    const closed = 10 * v + 10 * edges.length - 2;
    off += Math.abs(got - closed);
    rows.push([name, comma(v), comma(edges.length), comma(got), comma(closed)]);
  }
  return [
    md(
      ["입력", "정점 V", "간선 E", "센 값", "10V + 10E − 2"],
      rows,
      [1, 2, 3, 4],
    ),
    "",
    `네 입력에서 센 값과 닫힌 형태의 차이를 모두 더하면 ${off} 입니다. 정점 ${comma(100_000)} 개에 넣으면 20V − 12 = ${comma(20 * 100_000 - 12)} 칸입니다.`,
  ].join("\n");
}

/** `perf.worst` — 모양을 바꿔 가며 실제로 재 본다. 큰 입력이라 세는 사본만 쓴다. */
function shapeValues(): string {
  const v = 20_000;
  const rows: string[][] = [];
  const cells = new Set<number>();
  for (const [name, rule, edges] of [
    ["한 줄", "정점 i 와 i+1 을 잇는다", chain(v)],
    ["별 모양", "정점 0 이 나머지 전부와 이어진다", star(v)],
    ["완전 이진 트리", "정점 i 의 부모가 ⌊(i−1)/2⌋", binary(v)],
    [
      "애벌레",
      "앞 절반을 한 줄로 잇고 뒤 절반을 하나씩 매단다",
      caterpillar(v),
    ],
  ] as [string, string, Edge[]][]) {
    const c = twoSweeps(v, edges).cells;
    cells.add(c);
    rows.push([
      name,
      rule,
      comma(edges.length),
      comma(twoSweeps(v, unit(edges)).answer),
      comma(c),
      comma(treeDiameter(v, edges)),
    ]);
  }
  return [
    md(
      [
        "모양",
        "만드는 규칙",
        "간선 수",
        "가장 긴 경로의 간선 수",
        "칸 접근",
        "지름",
      ],
      rows,
      [2, 3, 4, 5],
    ),
    "",
    `정점 ${comma(v)} 개짜리 네 모양에서 칸 접근은 ${cells.size === 1 ? `모두 ${comma([...cells][0] as number)} 칸으로 같습니다` : "모양마다 다릅니다"}. 가중치는 자리 번호를 9 로 나눈 나머지 + 1 이고, 가장 긴 경로의 간선 수는 가중치를 모두 1 로 바꿔 두 번 탐색으로 쟀습니다.`,
  ].join("\n");
}

/** `perf.worst` — 가장 적은 일을 하는 입력. */
function perfSmallest(): string {
  const got = twoSweeps(1, []);
  return `treeDiameter(1, [])   칸 접근 ${got.cells}   답 ${got.answer}`;
}

/** `selfcheck` — 물음에 붙는 상태. */
function selfcheckState(): string {
  const e1 = WALK.steps[END1] as Step;
  return `${stepOf(END1)} 끝   dist ${distText(e1.dist)}   best ${e1.best} (거리 ${e1.dist[e1.best]})`;
}

/** `selfcheck` — 첫 탐색을 3 에서 시작했다면. */
function selfcheckStart3(): string {
  const near = neighbours(WALK_N, WALK_EDGES);
  const one = sweep(WALK_N, near, 3);
  const two = sweep(WALK_N, near, one.far);
  return columns([
    [
      "첫 탐색 (3 에서)",
      `dist ${distText(one.all)}`,
      `best ${one.far} (거리 ${one.dist})`,
    ],
    [
      `둘째 탐색 (${one.far} 에서)`,
      `dist ${distText(two.all)}`,
      `best ${two.far} (거리 ${two.dist})`,
    ],
  ]).join("\n");
}

export const PROOFS: Record<string, () => string> = {
  "concept-distances": conceptDistances,
  "naive-scale": naiveScale,
  "first-sweeps": firstSweeps,
  "second-sweeps": secondSweeps,
  "brute-walk": bruteWalk,
  "tree-read": treeRead,
  "tree-relation": treeRelation,
  "reroot-compare": rerootCompare,
  "build-lists": buildLists,
  "build-sweep": buildSweep,
  "build-best": buildBest,
  "build-second": buildSecond,
  "negative-weight": negativeWeight,
  "negative-trace": negativeTrace,
  "start-choice": startChoice,
  "walk-input": walkInput,
  "walk-lists": walkLists,
  "walk-first-pops": walkFirstPops,
  "mutant-single-sweep": mutantSingle,
  "star-trace": starTrace,
  "walk-two-sweeps": walkTwoSweeps,
  "walk-trace": walkTrace,
  "not-a-tree": notATree,
  "not-a-tree-trace": notATreeTrace,
  "walk-result": walkResult,
  "related-ecc": relatedEcc,
  "related-byproduct": relatedByproduct,
  "median-check": medianCheck,
  "math-k": mathK,
  "math-ineq": mathIneq,
  "theorem-check": theoremCheck,
  "invariant-check": invariantCheck,
  "invariant-edges": invariantEdges,
  "mutant-edge-only": mutantEdgeOnly,
  "edge-only-trace": edgeOnlyTrace,
  "perf-derive-first": perfDeriveFirst,
  "cost-closed-form": costClosedForm,
  "shape-values": shapeValues,
  "perf-smallest": perfSmallest,
  "selfcheck-state": selfcheckState,
  "selfcheck-start3": selfcheckStart3,
};
