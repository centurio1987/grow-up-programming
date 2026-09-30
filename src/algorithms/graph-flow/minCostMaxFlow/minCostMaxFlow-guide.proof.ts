/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run tools/check-proof.ts src/algorithms/graph-flow/minCostMaxFlow/minCostMaxFlow-guide.md
 *
 * **사본이 둘이다.** `traceWalk` 는 전개 입력 하나를 걸음마다 통째로 적는 사본이고(무대 그림과 걸음
 * 재생 패널이 이것을 쓴다), `runCounted` 는 값만 세는 가벼운 사본이다. 큰 입력(규모의 상한을 채운
 * 배치)에 걸음마다 잔여 그래프 전체를 베끼는 사본을 걸면 메모리가 모자라 출력 없이 죽으므로, 큰
 * 입력에는 `runCounted` 만 쓴다. 두 사본 모두 답을 낼 때마다 정본과 맞대고, 다르면 던진다.
 *
 * **변이가 아무것도 안 바꾸는지를 검사하는 자리는 중화 실행을 피해 간다.** `check-proof` 가
 * 이 파일을 한 번 더 부를 때는 `loadMutant` 이 정본을 그대로 돌려주므로(중화), 그 상태에서
 * 「변이가 답을 안 바꿨다」로 던지면 중화 대조 자체가 실행되지 않는다. 중화 여부는 변이
 * 모듈의 함수가 정본과 **같은 객체인가**로 값에서 알아낸다.
 *
 * **항목 번호.** 원래 간선 `k` 의 정방향 항목이 `k`, 역방향 항목이 `E + k` 다(`maxFlow` 편과 같은 약속).
 */

import { loadMutant } from "../../../../tools/check-proof.ts";
import { josa, 과와, 으로, 은는, 을를, 이가 } from "../../../../tools/josa.ts";
import { type FlowEdge, minCostMaxFlow } from "./minCostMaxFlow-guide.ref.ts";

/* ────────────────────────── 표기 ────────────────────────── */

const INF = Number.POSITIVE_INFINITY;

/** 천 단위 구분. 무한대는 `∞`. */
export const num = (n: number): string =>
  n === INF ? "∞" : (n + 0).toLocaleString("en-US");

/** `[0, 1, ∞]` 꼴 — 정점마다의 값. */
export const list = (xs: readonly number[]): string =>
  `[${xs.map(num).join(", ")}]`;

/** `0 → 1 → 2` 꼴 — 경로. */
export const route = (xs: readonly number[]): string => xs.join(" → ");

/** 마크다운 표 한 벌. `right` 는 오른쪽 정렬할 열 번호. */
export function md(
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

/** 등폭 열 맞춤 — 코드 조각 바로 아래의 짧은 실행 결과에 쓴다. */
function columns(rows: readonly (readonly string[])[]): string[] {
  const cols = Math.max(...rows.map((r) => r.length));
  const ws: number[] = [];
  for (let c = 0; c < cols; c++)
    ws.push(Math.max(...rows.map((r) => width(r[c] ?? ""))));
  return rows.map((r) =>
    r
      .map((cell, c) => (c === r.length - 1 ? cell : pad(cell, ws[c] ?? 0)))
      .join("   ")
      .replace(/\s+$/, ""),
  );
}

const verdict = (same: boolean): string => (same ? "같다" : "어긋난다");

/** 「3 이고」·「0 이고」 — 계사 「이고/고」. */
const 이고 = (x: string): string => josa(x, "이고", "고");

/* ────────────────────────── 고정 입력 ────────────────────────── */

/** 입력 이름 — 본문 · 그림 · 표가 같은 이름을 쓴다. */
export const NAME = {
  walk: "전개 입력",
  detour: "역방향 항목이 꼭 필요한 넷",
  trap: "정점 다섯 · 용량이 전부 1",
  twoWay: "비용이 작은 좁은 경로와 큰 넓은 경로",
  serial: "직렬 경로 둘",
  single: "간선 하나",
} as const;

/**
 * 본문 전개가 쓰는 네트워크 — 정점 넷 · 방향 간선 다섯.
 *
 * 이 다섯이면 코드의 갈래 여섯이 한 번씩 다 실행된다. 병목이 2 인 라운드와 1 인 라운드가
 * 둘씩 있고, **역방향 항목을 지나는 라운드가 하나** 있으며, 마지막 라운드가 경로를 못 찾아
 * 반복을 끝낸다. 최대 유량 6 을 만드는 배정이 둘이라 「최대 유량이 같은데 총비용이 갈린다」도
 * 이 입력 하나에서 보인다.
 */
export const WALK: FlowEdge[] = [
  [0, 1, 3, 1],
  [0, 2, 3, 4],
  [1, 2, 2, 1],
  [1, 3, 3, 6],
  [2, 3, 4, 1],
];
export const WALK_N = 4;
export const WALK_SOURCE = 0;
export const WALK_SINK = 3;

/** 역방향 항목을 지나야만 최소 비용이 나오는 가장 작은 네트워크. */
const DETOUR: FlowEdge[] = [
  [0, 1, 1, 1],
  [0, 2, 1, 6],
  [1, 2, 1, 1],
  [1, 3, 1, 6],
  [2, 3, 1, 1],
];

/** 다익스트라로 바꾸면 답이 갈리는 배치. 무작위 탐색으로 찾아 최소화한 것이다. */
const DIJKSTRA_TRAP: FlowEdge[] = [
  [2, 3, 1, 1],
  [3, 4, 1, 0],
  [0, 2, 1, 0],
  [1, 2, 1, 4],
  [1, 3, 1, 4],
  [2, 4, 1, 2],
  [0, 1, 1, 0],
];

interface Case {
  label: string;
  n: number;
  edges: FlowEdge[];
  source: number;
  sink: number;
}

const WALK_CASE: Case = {
  label: NAME.walk,
  n: WALK_N,
  edges: WALK,
  source: WALK_SOURCE,
  sink: WALK_SINK,
};
const DETOUR_CASE: Case = {
  label: NAME.detour,
  n: 4,
  edges: DETOUR,
  source: 0,
  sink: 3,
};
const TRAP_CASE: Case = {
  label: NAME.trap,
  n: 5,
  edges: DIJKSTRA_TRAP,
  source: 0,
  sink: 4,
};
const SINGLE_CASE: Case = {
  label: NAME.single,
  n: 2,
  edges: [[0, 1, 7, 3]],
  source: 0,
  sink: 1,
};
const TWO_WAY_CASE: Case = {
  label: NAME.twoWay,
  n: 4,
  edges: [
    [0, 1, 1, 1],
    [1, 3, 1, 1],
    [0, 2, 2, 5],
    [2, 3, 2, 5],
  ],
  source: 0,
  sink: 3,
};
const SERIAL_CASE: Case = {
  label: NAME.serial,
  n: 3,
  edges: [
    [0, 1, 5, 2],
    [1, 2, 5, 3],
  ],
  source: 0,
  sink: 2,
};

const ALL_CASES: Case[] = [
  WALK_CASE,
  DETOUR_CASE,
  TRAP_CASE,
  TWO_WAY_CASE,
  SERIAL_CASE,
  SINGLE_CASE,
];

/** 과제의 규모 — 「아이디어를 떠올리는 과정」이 정한 값. */
export const V_MAX = 200;
export const E_MAX = 2000;
export const C_MAX = 10_000;
export const A_MAX = 10_000;

/** 고정 난수열. 실행마다 같은 값이 나온다. */
function stream(seed0: bigint): () => number {
  let s = seed0;
  return () => {
    s ^= s << 13n;
    s &= 0xffffffffffffffffn;
    s ^= s >> 7n;
    s ^= s << 17n;
    s &= 0xffffffffffffffffn;
    return Number(s % 1000000007n);
  };
}

/** 병렬 경로 `k` 개에 가로지르는 간선 `cross` 개를 얹은 네트워크. */
function crossed(
  k: number,
  cap: number,
  costMax: number,
  cross: number,
  seed: bigint,
): Case {
  const next = stream(seed);
  const A = (i: number): number => 2 + i;
  const B = (i: number): number => 2 + k + i;
  const edges: FlowEdge[] = [];
  for (let i = 0; i < k; i++) {
    edges.push([0, A(i), cap, 0]);
    edges.push([A(i), B(i), cap, next() % (costMax + 1)]);
    edges.push([B(i), 1, cap, 0]);
  }
  const taken = new Set<string>();
  let made = 0;
  for (let tries = 0; tries < 50 * cross && made < cross; tries++) {
    const i = next() % k;
    const j = next() % k;
    if (i === j) continue;
    const key = `${i},${j}`;
    if (taken.has(key)) continue;
    taken.add(key);
    edges.push([A(i), B(j), 1, next() % (costMax + 1)]);
    made++;
  }
  return {
    label: `병렬 ${k} · 가로 ${made}`,
    n: 2 + 2 * k,
    edges,
    source: 0,
    sink: 1,
  };
}

/** 왼쪽 `L` 개와 오른쪽 `R` 자리를 잇는 배정 네트워크. */
function assignment(L: number, R: number, deg: number, seed: bigint): Case {
  const next = stream(seed);
  const edges: FlowEdge[] = [];
  for (let i = 0; i < L; i++) edges.push([0, 2 + i, 1, 0]);
  for (let j = 0; j < R; j++) edges.push([2 + L + j, 1, 1, 0]);
  const taken = new Set<string>();
  for (let i = 0; i < L; i++) {
    for (let d = 0; d < deg; d++) {
      const j = next() % R;
      const key = `${i},${j}`;
      if (taken.has(key)) continue;
      taken.add(key);
      edges.push([2 + i, 2 + L + j, 1, 1 + (next() % 20)]);
    }
  }
  return { label: `배정 ${L}×${R}`, n: 2 + L + R, edges, source: 0, sink: 1 };
}

/** 소스에서 갈라져 싱크로 모이는 사슬 `k` 개. */
function chains(k: number, len: number, cap: number): Case {
  const edges: FlowEdge[] = [];
  let id = 2;
  for (let i = 0; i < k; i++) {
    let prev = 0;
    for (let j = 0; j < len; j++) {
      edges.push([prev, id, cap, j === 0 ? i + 1 : 1]);
      prev = id;
      id++;
    }
    edges.push([prev, 1, cap, 0]);
  }
  return { label: `사슬 ${k}×${len}`, n: id, edges, source: 0, sink: 1 };
}

/* ────────────────────────── 항목 번호 ────────────────────────── */

/** 항목 `id` 의 꼬리 정점. */
export const tailOf = (edges: FlowEdge[], id: number): number =>
  id < edges.length
    ? (edges[id] as FlowEdge)[0]
    : (edges[id - edges.length] as FlowEdge)[1];

/** 항목 `id` 의 머리 정점. */
export const headOf = (edges: FlowEdge[], id: number): number =>
  id < edges.length
    ? (edges[id] as FlowEdge)[1]
    : (edges[id - edges.length] as FlowEdge)[0];

export const isBack = (edges: FlowEdge[], id: number): boolean =>
  id >= edges.length;

/** 항목 `id` 의 단위 비용 — 역방향 항목은 짝의 부호를 바꾼 값. */
export const costOf = (edges: FlowEdge[], id: number): number =>
  id < edges.length
    ? (edges[id] as FlowEdge)[3]
    : -(edges[id - edges.length] as FlowEdge)[3];

export const pairOf = (edges: FlowEdge[], id: number): number =>
  id < edges.length ? id + edges.length : id - edges.length;

export const arcName = (edges: FlowEdge[], id: number): string =>
  `${tailOf(edges, id)}→${headOf(edges, id)}`;

/* ─────────────── 걸음을 통째로 적는 사본 (전개 입력 전용) ─────────────── */

/** 정본 주석의 갈래 라벨. */
export type Label = "①" | "②" | "③" | "④" | "⑤" | "⑥";
export const LABELS: readonly Label[] = ["①", "②", "③", "④", "⑤", "⑥"];

/** 갈래마다 하는 일 — 정본 주석을 줄인 말. */
export const LABEL_TEXT: Record<Label, string> = {
  "①": "간선 하나를 비용이 반대 부호인 항목 둘로 담는다",
  "②": "라운드를 하나 연다",
  "③": "SPFA 가 정점의 값을 줄인다",
  "④": "싱크의 값이 그대로라 반복을 끝낸다",
  "⑤": "경로를 거슬러 올라가며 병목을 잰다",
  "⑥": "정방향에서 덜고 짝이 되는 항목에 더한다",
};

/** SPFA 가 정점 하나를 꺼내 한 일. */
export interface Pop {
  readonly u: number;
  /** 값을 줄인 자리 — `[정점, 새 값, 지난 항목]`. */
  readonly wrote: readonly [number, number, number][];
  /** 값을 줄였는데 이미 큐에 있어서 다시 안 넣은 정점. */
  readonly waited: readonly number[];
  readonly queue: readonly number[];
}

export type StepKind = "build" | "find" | "push" | "end";

/** 걸음 하나가 끝난 뒤의 상태. */
export interface Step {
  readonly kind: StepKind;
  readonly round: number;
  /** 이 라운드의 `dist`. 만드는 걸음은 전부 ∞. */
  readonly dist: readonly number[];
  /** 항목마다의 잔여 용량 — 번호는 머리 주석의 약속. */
  readonly res: readonly number[];
  /** 증가 경로의 정점과 항목. 없으면 빈 목록. */
  readonly path: readonly number[];
  readonly arcs: readonly number[];
  readonly pathCost: number;
  readonly push: number;
  readonly flow: number;
  readonly cost: number;
  readonly pops: readonly Pop[];
  /** 갈래마다 이 걸음에서 실행한 횟수. */
  readonly hits: Readonly<Record<Label, number>>;
  /** 이 걸음에서 항목을 읽은 횟수. */
  readonly reads: number;
}

interface IdArc {
  to: number;
  cap: number;
  cost: number;
  rev: number;
  id: number;
}

const noHits = (): Record<Label, number> => ({
  "①": 0,
  "②": 0,
  "③": 0,
  "④": 0,
  "⑤": 0,
  "⑥": 0,
});

/**
 * 전개 입력을 정본과 같은 절차로 실행하며 걸음마다 상태를 통째로 적는다. 걸음은 잔여 그래프를
 * 만드는 걸음 하나, 라운드마다 경로를 찾는 걸음과 보내는 걸음 둘, 경로를 못 찾는 마지막 걸음 하나다.
 */
export function traceWalk(
  n: number,
  edges: FlowEdge[],
  source: number,
  sink: number,
): { steps: Step[]; lists: number[][] } {
  const E = edges.length;
  const graph: IdArc[][] = Array.from({ length: n }, () => []);
  const lists: number[][] = Array.from({ length: n }, () => []);
  const hitsBuild = noHits();
  edges.forEach(([u, v, cap, cost], k) => {
    const from = graph[u] as IdArc[];
    const to = graph[v] as IdArc[];
    from.push({ to: v, cap, cost, rev: to.length, id: k });
    to.push({ to: u, cap: 0, cost: -cost, rev: from.length - 1, id: E + k });
    (lists[u] as number[]).push(k);
    (lists[v] as number[]).push(E + k);
    hitsBuild["①"]++;
  });
  const snapshot = (): number[] => {
    const res = Array.from({ length: 2 * E }, () => 0);
    for (const arcs of graph) for (const a of arcs) res[a.id] = a.cap;
    return res;
  };
  const steps: Step[] = [];
  let flow = 0;
  let cost = 0;
  steps.push({
    kind: "build",
    round: 0,
    dist: Array.from({ length: n }, () => INF),
    res: snapshot(),
    path: [],
    arcs: [],
    pathCost: 0,
    push: 0,
    flow,
    cost,
    pops: [],
    hits: hitsBuild,
    reads: 0,
  });
  for (let round = 1; ; round++) {
    const hits = noHits();
    hits["②"]++;
    const dist = Array.from({ length: n }, () => INF);
    const waiting = Array.from({ length: n }, () => false);
    const fromV = Array.from({ length: n }, () => -1);
    const fromE = Array.from({ length: n }, () => -1);
    dist[source] = 0;
    const queue: number[] = [source];
    waiting[source] = true;
    const pops: Pop[] = [];
    let reads = 0;
    while (queue.length > 0) {
      const u = queue.shift() as number;
      waiting[u] = false;
      const wrote: [number, number, number][] = [];
      const waited: number[] = [];
      const arcs = graph[u] as IdArc[];
      for (let i = 0; i < arcs.length; i++) {
        const arc = arcs[i] as IdArc;
        reads++;
        const next = (dist[u] as number) + arc.cost;
        if (arc.cap > 0 && next < (dist[arc.to] as number)) {
          dist[arc.to] = next;
          fromV[arc.to] = u;
          fromE[arc.to] = i;
          hits["③"]++;
          wrote.push([arc.to, next, arc.id]);
          if (!waiting[arc.to]) {
            queue.push(arc.to);
            waiting[arc.to] = true;
          } else waited.push(arc.to);
        }
      }
      pops.push({ u, wrote, waited, queue: [...queue] });
    }
    if ((dist[sink] as number) === INF) {
      hits["④"]++;
      steps.push({
        kind: "end",
        round,
        dist,
        res: snapshot(),
        path: [],
        arcs: [],
        pathCost: 0,
        push: 0,
        flow,
        cost,
        pops,
        hits,
        reads,
      });
      break;
    }
    const path: number[] = [sink];
    const ids: number[] = [];
    let push = INF;
    const hitsPush = noHits();
    let pushReads = 0;
    for (let v = sink; v !== source; v = fromV[v] as number) {
      const arc = (graph[fromV[v] as number] as IdArc[])[
        fromE[v] as number
      ] as IdArc;
      push = Math.min(push, arc.cap);
      ids.unshift(arc.id);
      path.unshift(fromV[v] as number);
      hitsPush["⑤"]++;
      pushReads++;
    }
    steps.push({
      kind: "find",
      round,
      dist: [...dist],
      res: snapshot(),
      path,
      arcs: ids,
      pathCost: dist[sink] as number,
      push: 0,
      flow,
      cost,
      pops,
      hits,
      reads,
    });
    for (let v = sink; v !== source; v = fromV[v] as number) {
      const arc = (graph[fromV[v] as number] as IdArc[])[
        fromE[v] as number
      ] as IdArc;
      arc.cap -= push;
      ((graph[v] as IdArc[])[arc.rev] as IdArc).cap += push;
      hitsPush["⑥"]++;
      pushReads++;
    }
    flow += push;
    cost += push * (dist[sink] as number);
    steps.push({
      kind: "push",
      round,
      dist: [...dist],
      res: snapshot(),
      path,
      arcs: ids,
      pathCost: dist[sink] as number,
      push,
      flow,
      cost,
      pops: [],
      hits: hitsPush,
      reads: pushReads,
    });
  }
  const want = minCostMaxFlow(n, edges, source, sink);
  const last = steps.at(-1) as Step;
  if (last.flow !== want.flow || last.cost !== want.cost) {
    throw new Error(
      `걸음 사본이 정본과 다른 답을 냈다 — { flow: ${last.flow}, cost: ${last.cost} } vs { flow: ${want.flow}, cost: ${want.cost} }`,
    );
  }
  return { steps, lists };
}

export const WALK_TRACE = traceWalk(WALK_N, WALK, WALK_SOURCE, WALK_SINK);
const S = WALK_TRACE.steps;
/** 걸음 번호 — 원고의 `T#`. */
export const tOf = (i: number): string => `T${i + 1}`;
/** 라운드 `r` 에서 보내는 걸음의 자리. */
export const pushIndex = (r: number): number =>
  S.findIndex((s) => s.kind === "push" && s.round === r);
export const findIndex = (r: number): number =>
  S.findIndex((s) => s.kind === "find" && s.round === r);
const LAST = S.at(-1) as Step;
/** 라운드 3 을 보낸 직후 — 역방향 항목이 셋 열리고 라운드 4 가 그중 하나를 지나기 직전이다. */
export const BEFORE_BACK = pushIndex(3);

/** 걸음의 유량 — 간선 `k` 의 유량은 역방향 항목의 잔여 용량이다. */
export const flowOf = (s: Step, k: number): number =>
  s.res[WALK.length + k] as number;

/* ─────────────────────── 값만 세는 사본 ─────────────────────── */

interface Arc {
  to: number;
  cap: number;
  cost: number;
  rev: number;
  back: boolean;
}

interface Counted {
  paths: string[];
  flow: number;
  cost: number;
  rounds: number;
  ops: number;
  relaxHits: number;
  pops: number;
  peakQueue: number;
  unitCosts: number[];
  bottlenecks: number[];
  usedReverse: number;
  negCycleRounds: number;
  badReduced: number;
  checkedArcs: number;
  newReverse: number;
  tightNewReverse: number;
  dists: number[][];
}

type Engine = "relax" | "dijkstra";
type Order = "cheapest" | "any";

/**
 * 잔여 그래프를 만든다. 정본과 같은 모양이다. `sameSign` 이 참이면 역방향 항목의 단위 비용을 원래
 * 비용과 **같은 부호**로 둔다 — 그 판이 어느 라운드에서 갈리는지를 보이는 자리에서만 쓴다.
 */
function residual(n: number, edges: FlowEdge[], sameSign = false): Arc[][] {
  const graph: Arc[][] = Array.from({ length: n }, () => []);
  for (const [u, v, cap, cost] of edges) {
    const from = graph[u] as Arc[];
    const to = graph[v] as Arc[];
    from.push({ to: v, cap, cost, rev: to.length, back: false });
    to.push({
      to: u,
      cap: 0,
      cost: sameSign ? cost : -cost,
      rev: from.length - 1,
      back: true,
    });
  }
  return graph;
}

/** 잔여 그래프에 단위 비용 합이 음수인 사이클이 있는가. */
function hasNegativeCycle(n: number, graph: Arc[][]): boolean {
  const d = Array.from({ length: n }, () => 0);
  let moved = false;
  for (let pass = 0; pass <= n; pass++) {
    moved = false;
    for (let u = 0; u < n; u++) {
      for (const arc of graph[u] as Arc[]) {
        if (
          arc.cap > 0 &&
          (d[u] as number) + arc.cost < (d[arc.to] as number)
        ) {
          d[arc.to] = (d[u] as number) + arc.cost;
          moved = true;
        }
      }
    }
    if (!moved) break;
  }
  return moved;
}

/**
 * 정본과 같은 절차를 **값만 세며** 실행한다. 잔여 그래프를 걸음마다 베끼지 않는다.
 *
 * `negCycleRounds` 가 「잔여 그래프에 음수 사이클이 있던 라운드 수」이고 `badReduced` 가 「보낸 뒤
 * 다시 매긴 값이 음수인 항목 수」다. 둘 다 실행이 세서 돌려준다(`trackCycles` 가 참일 때만 — 큰
 * 입력에서 라운드마다 음수 사이클을 찾으면 그것만으로 오래 걸린다).
 *
 * - `engine: "dijkstra"` — 값이 가장 작은 정점을 꺼내고 한 번 꺼낸 정점은 다시 안 보는 판
 * - `order: "any"` — 단위 비용을 안 보고 잔여 용량이 있는 아무 경로나 너비 우선으로 고르는 판
 * - `forwardOnly` — 역방향 항목을 안 지나는 판
 * - `unitPush` — 병목을 그대로 안 쓰고 한 단위씩만 보내는 판
 */
function runCounted(
  n: number,
  edges: FlowEdge[],
  source: number,
  sink: number,
  opt: {
    engine?: Engine;
    order?: Order;
    unitPush?: boolean;
    sameSign?: boolean;
    forwardOnly?: boolean;
    trackCycles?: boolean;
  } = {},
): Counted {
  const graph = residual(n, edges, opt.sameSign === true);
  const track = opt.trackCycles !== false;
  const c: Counted = {
    paths: [],
    flow: 0,
    cost: 0,
    rounds: 0,
    ops: 0,
    relaxHits: 0,
    pops: 0,
    peakQueue: 0,
    unitCosts: [],
    bottlenecks: [],
    usedReverse: 0,
    negCycleRounds: 0,
    badReduced: 0,
    checkedArcs: 0,
    newReverse: 0,
    tightNewReverse: 0,
    dists: [],
  };

  for (;;) {
    if (track && hasNegativeCycle(n, graph)) c.negCycleRounds++;
    const dist = Array.from({ length: n }, () => INF);
    const fromV = Array.from({ length: n }, () => -1);
    const fromE = Array.from({ length: n }, () => -1);
    dist[source] = 0;

    if (opt.order === "any") {
      const seen = Array.from({ length: n }, () => false);
      seen[source] = true;
      const queue: number[] = [source];
      while (queue.length > 0) {
        const u = queue.shift() as number;
        c.pops++;
        const arcs = graph[u] as Arc[];
        for (let i = 0; i < arcs.length; i++) {
          const arc = arcs[i] as Arc;
          c.ops++;
          if (arc.cap > 0 && !seen[arc.to]) {
            seen[arc.to] = true;
            fromV[arc.to] = u;
            fromE[arc.to] = i;
            dist[arc.to] = (dist[u] as number) + arc.cost;
            queue.push(arc.to);
          }
        }
      }
      if (!seen[sink]) break;
    } else if (opt.engine === "dijkstra") {
      const done = Array.from({ length: n }, () => false);
      for (;;) {
        let at = -1;
        for (let v = 0; v < n; v++) {
          if (done[v] || (dist[v] as number) === INF) continue;
          if (at < 0 || (dist[v] as number) < (dist[at] as number)) at = v;
        }
        if (at < 0) break;
        done[at] = true;
        c.pops++;
        const arcs = graph[at] as Arc[];
        for (let i = 0; i < arcs.length; i++) {
          const arc = arcs[i] as Arc;
          c.ops++;
          if (
            arc.cap > 0 &&
            !done[arc.to] &&
            (dist[at] as number) + arc.cost < (dist[arc.to] as number)
          ) {
            dist[arc.to] = (dist[at] as number) + arc.cost;
            fromV[arc.to] = at;
            fromE[arc.to] = i;
            c.relaxHits++;
          }
        }
      }
      if ((dist[sink] as number) === INF) break;
    } else {
      const waiting = Array.from({ length: n }, () => false);
      const queue: number[] = [source];
      waiting[source] = true;
      while (queue.length > 0) {
        c.peakQueue = Math.max(c.peakQueue, queue.length);
        const u = queue.shift() as number;
        c.pops++;
        waiting[u] = false;
        const arcs = graph[u] as Arc[];
        for (let i = 0; i < arcs.length; i++) {
          const arc = arcs[i] as Arc;
          c.ops++;
          if (opt.forwardOnly === true && arc.back) continue;
          if (
            arc.cap > 0 &&
            (dist[u] as number) + arc.cost < (dist[arc.to] as number)
          ) {
            dist[arc.to] = (dist[u] as number) + arc.cost;
            fromV[arc.to] = u;
            fromE[arc.to] = i;
            c.relaxHits++;
            if (!waiting[arc.to]) {
              queue.push(arc.to);
              waiting[arc.to] = true;
            }
          }
        }
      }
      if ((dist[sink] as number) === INF) break;
    }
    c.dists.push([...dist]);

    c.rounds++;
    let push = INF;
    let unit = 0;
    let reverse = false;
    const names: string[] = [String(sink)];
    for (let v = sink; v !== source; v = fromV[v] as number) {
      const arcs = graph[fromV[v] as number] as Arc[];
      const arc = arcs[fromE[v] as number] as Arc;
      c.ops++;
      push = Math.min(push, arc.cap);
      unit += arc.cost;
      if (arc.back) reverse = true;
      names.unshift(String(fromV[v]));
    }
    if (opt.unitPush === true) push = Math.min(push, 1);
    if (reverse) c.usedReverse++;
    const pathArcs: [number, number][] = [];
    for (let v = sink; v !== source; v = fromV[v] as number) {
      const arcs = graph[fromV[v] as number] as Arc[];
      const arc = arcs[fromE[v] as number] as Arc;
      c.ops++;
      pathArcs.push([fromV[v] as number, fromE[v] as number]);
      arc.cap -= push;
      ((graph[v] as Arc[])[arc.rev] as Arc).cap += push;
    }
    c.flow += push;
    c.cost += push * unit;
    c.unitCosts.push(unit);
    c.bottlenecks.push(push);
    c.paths.push(names.join(" → "));

    if (track && opt.engine === undefined && opt.order === undefined) {
      for (let u = 0; u < n; u++) {
        for (const arc of graph[u] as Arc[]) {
          if (arc.cap <= 0) continue;
          if ((dist[u] as number) === INF) continue;
          if ((dist[arc.to] as number) === INF) continue;
          c.checkedArcs++;
          if (arc.cost + (dist[u] as number) - (dist[arc.to] as number) < 0) {
            c.badReduced++;
          }
        }
      }
      for (const [u, i] of pathArcs) {
        const arc = (graph[u] as Arc[])[i] as Arc;
        const back = (graph[arc.to] as Arc[])[arc.rev] as Arc;
        if (back.cap <= 0) continue;
        if ((dist[u] as number) === INF) continue;
        if ((dist[arc.to] as number) === INF) continue;
        c.newReverse++;
        if (back.cost + (dist[arc.to] as number) - (dist[u] as number) === 0) {
          c.tightNewReverse++;
        }
      }
    }
    if (c.rounds > 20000) break;
  }
  return c;
}

/** 계측본이 정본과 같은 답을 내는지 확인하고 계수를 돌려준다. */
function measure(c: Case, trackCycles = true): Counted {
  const got = runCounted(c.n, c.edges, c.source, c.sink, { trackCycles });
  const want = minCostMaxFlow(c.n, c.edges, c.source, c.sink);
  if (got.flow !== want.flow || got.cost !== want.cost) {
    throw new Error(
      `계측본이 정본과 다른 답을 냈다 — { flow: ${got.flow}, cost: ${got.cost} } vs { flow: ${want.flow}, cost: ${want.cost} }`,
    );
  }
  return got;
}

/* ────────────────────── 유량 배정 전수 조사 ────────────────────── */

interface Enumerated {
  total: number;
  maxValue: number;
  byValue: Map<number, number[]>;
  /** 최대 유량을 만드는 배정과 그 총비용 — 총비용 오름차순. */
  maxFlows: { f: number[]; cost: number }[];
}

/**
 * 용량 제한과 보존을 지키는 정수 배정을 **전부** 만든다. 손으로 적은 전수 조사는 원소를 빠뜨리므로
 * 세는 일을 실행에 맡긴다. 간선마다 0 부터 용량까지를 다 넣어 보므로 작은 입력에만 쓴다.
 */
function enumerateFlows(c: Case): Enumerated {
  const { n, edges, source, sink } = c;
  const f = Array.from({ length: edges.length }, () => 0);
  const byValue = new Map<number, number[]>();
  const tops: { f: number[]; cost: number; value: number }[] = [];
  let total = 0;
  let maxValue = 0;
  const walk = (i: number): void => {
    if (i === edges.length) {
      const balance = Array.from({ length: n }, () => 0);
      edges.forEach(([u, v], k) => {
        balance[u] = (balance[u] as number) - (f[k] as number);
        balance[v] = (balance[v] as number) + (f[k] as number);
      });
      for (let v = 0; v < n; v++) {
        if (v !== source && v !== sink && balance[v] !== 0) return;
      }
      if ((balance[source] as number) !== -(balance[sink] as number)) return;
      const value = balance[sink] as number;
      let cost = 0;
      edges.forEach(([, , , a], k) => {
        cost += a * (f[k] as number);
      });
      total++;
      maxValue = Math.max(maxValue, value);
      const bucket = byValue.get(value) ?? [];
      bucket.push(cost);
      byValue.set(value, bucket);
      tops.push({ f: [...f], cost, value });
      return;
    }
    for (let x = 0; x <= (edges[i] as FlowEdge)[2]; x++) {
      f[i] = x;
      walk(i + 1);
    }
    f[i] = 0;
  };
  walk(0);
  const maxFlows = tops
    .filter((x) => x.value === maxValue)
    .map(({ f, cost }) => ({ f, cost }))
    .sort((a, b) => a.cost - b.cost);
  return { total, maxValue, byValue, maxFlows };
}

/** 유량 값마다의 최소 총비용. */
function bestByValue(e: Enumerated): number[] {
  const out: number[] = [];
  for (let v = 0; v <= e.maxValue; v++) {
    const bucket = e.byValue.get(v) ?? [];
    out.push(bucket.length === 0 ? Number.NaN : Math.min(...bucket));
  }
  return out;
}

/* ────────────────────────── 변이 ────────────────────────── */

type Impl = {
  minCostMaxFlow: (
    n: number,
    edges: FlowEdge[],
    source: number,
    sink: number,
  ) => { flow: number; cost: number };
};

const REF = new URL("./minCostMaxFlow-guide.ref.ts", import.meta.url).pathname;

const REVERSE_LINE =
  /^ {4}to\.push\(\{ to: u, cap: 0, cost: -cost, rev: from\.length - 1 \}\);$/;
const PUSH_LINE = /^ {4}let push = Number\.POSITIVE_INFINITY;$/;
const COST_LINE = /^ {4}cost \+= push \* \(dist\[sink\] as number\);$/;

/** 역방향 항목의 단위 비용을 원래 비용과 **같은 부호**로 둔 사본. */
const sameSignMutant = await loadMutant<Impl>(REF, {
  swap: [
    REVERSE_LINE,
    "    to.push({ to: u, cap: 0, cost: cost, rev: from.length - 1 });",
  ],
});

/** 병목을 그대로 안 쓰고 한 단위씩만 보내는 사본. */
const unitPush = await loadMutant<Impl>(REF, {
  swap: [PUSH_LINE, "    let push = 1;"],
});

/** 누적 총비용에 병목을 안 곱하는 사본. 라운드마다 경로 비용만 더한다. */
const noTimes = await loadMutant<Impl>(REF, {
  swap: [COST_LINE, "    cost += (dist[sink] as number);"],
});

/**
 * 중화 실행인가 — `loadMutant` 이 변이를 적용하지 않고 정본 모듈을 그대로 돌려주면 두 함수가
 * **같은 객체**다. 중화 상태에서 아래 검사를 실행하면 언제나 던지게 되고, 그러면 `check-proof` 의
 * 중화 대조가 이 편에서는 실행되지 않는다.
 */
const 중화됨 = sameSignMutant.minCostMaxFlow === minCostMaxFlow;

if (!중화됨) {
  const breaking: [string, Impl, Case[]][] = [
    ["역방향 항목을 같은 부호로 둔", sameSignMutant, [WALK_CASE, DETOUR_CASE]],
    ["누적 총비용에 병목을 안 곱하는", noTimes, [WALK_CASE, SINGLE_CASE]],
  ];
  for (const [label, impl, cases] of breaking) {
    const changed = cases.some((c) => {
      const want = minCostMaxFlow(c.n, c.edges, c.source, c.sink);
      const got = impl.minCostMaxFlow(c.n, c.edges, c.source, c.sink);
      return want.flow !== got.flow || want.cost !== got.cost;
    });
    if (!changed) {
      throw new Error(`${label} 변이가 어느 입력에서도 답을 바꾸지 못했다`);
    }
  }
}

/** 정본과 변이의 답을 나란히 놓은 표의 행. */
function contrastRows(cases: Case[], impl: Impl): string[][] {
  return cases.map((c) => {
    const want = minCostMaxFlow(c.n, c.edges, c.source, c.sink);
    const got = impl.minCostMaxFlow(c.n, c.edges, c.source, c.sink);
    return [
      c.label,
      `${want.flow} / ${want.cost}`,
      `${got.flow} / ${got.cost}`,
      verdict(want.flow === got.flow && want.cost === got.cost),
    ];
  });
}

/* ────────────────────────── 공용 값 ────────────────────────── */

const WALK_COUNT = measure(WALK_CASE);
const WALK_ENUM = enumerateFlows(WALK_CASE);
const WALK_BEST = bestByValue(WALK_ENUM);
const WALK_ANY = runCounted(WALK_N, WALK, WALK_SOURCE, WALK_SINK, {
  order: "any",
});
const WALK_FWD = runCounted(WALK_N, WALK, WALK_SOURCE, WALK_SINK, {
  forwardOnly: true,
});
const WALK_SAME = runCounted(WALK_N, WALK, WALK_SOURCE, WALK_SINK, {
  sameSign: true,
});

/** 최대 유량을 만드는 배정 — 그림 사이드카가 두 배정을 나란히 그린다. */
export const MAX_FLOWS = WALK_ENUM.maxFlows;

/** 한 단위씩 펼친 라운드 비용 — 병목만큼 경로 비용을 되풀이한다. */
function expand(c: Counted): number[] {
  const out: number[] = [];
  c.unitCosts.forEach((u, i) => {
    for (let k = 0; k < (c.bottlenecks[i] as number); k++) out.push(u);
  });
  return out;
}

/** 전수 조사가 낸 유량 값마다의 최소 총비용 — 그림 사이드카가 곡선으로 그린다. */
export const BEST_BY_VALUE: readonly number[] = WALK_BEST;

/** 전수 조사가 낸 「한 단위 더 보내는 데 드는 최소값」. */
const MARGINAL = WALK_BEST.slice(1).map(
  (b, v) => (b as number) - (WALK_BEST[v] as number),
);

/** 규모의 상한에서 전수 조사의 가짓수 자릿수. */
const BRUTE_DIGITS = (BigInt(C_MAX + 1) ** BigInt(E_MAX)).toString().length;

/** 「아이디어를 떠올리는 과정」의 사다리 그림이 쓰는 값. */
export function ladderNumbers() {
  const answer = minCostMaxFlow(WALK_N, WALK, WALK_SOURCE, WALK_SINK);
  return {
    bruteDigits: BRUTE_DIGITS,
    anyCost: WALK_ANY.cost,
    anyFlow: WALK_ANY.flow,
    fwdFlow: WALK_FWD.flow,
    sameCost: WALK_SAME.cost,
    best: WALK_BEST[WALK_ENUM.maxValue] as number,
    maxValue: WALK_ENUM.maxValue,
    answer,
  };
}

/** 라운드마다 한 줄 — 라운드 · 경로 · 경로 비용 · 병목 · 누적. */
function roundRows(c: Counted, withEnd: boolean): string[][] {
  let f = 0;
  let cost = 0;
  const rows = c.paths.map((p, i) => {
    const b = c.bottlenecks[i] as number;
    const u = c.unitCosts[i] as number;
    f += b;
    cost += b * u;
    return [`라운드 ${i + 1}`, p, num(u), num(b), num(f), num(cost)];
  });
  if (withEnd)
    rows.push([`라운드 ${c.rounds + 1}`, "없음", "-", "-", num(f), num(cost)]);
  return rows;
}

const ROUND_HEAD = [
  "라운드",
  "증가 경로",
  "경로 비용",
  "병목",
  "누적 유량",
  "누적 총비용",
];

/* ────────────────────────── 블록 ────────────────────────── */

export const PROOFS: Record<string, () => string> = {
  /** `concept` — 최대 유량이 같아도 총비용이 갈린다. */
  conceptSplit: () => {
    const rows = [...WALK_ENUM.byValue.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([value, costs]) => [
        num(value),
        num(costs.length),
        num(Math.min(...costs)),
        num(Math.max(...costs)),
      ]);
    const top = WALK_ENUM.maxFlows;
    const best = (top[0] as { cost: number }).cost;
    const worst = (top.at(-1) as { cost: number }).cost;
    const answer = minCostMaxFlow(WALK_N, WALK, WALK_SOURCE, WALK_SINK);
    const mv = num(WALK_ENUM.maxValue);
    return [
      md(
        [
          "유량 값",
          "그 값을 만드는 배정",
          "총비용의 최솟값",
          "총비용의 최댓값",
        ],
        rows,
        [0, 1, 2, 3],
      ),
      "",
      `두 조건을 지키는 배정이 모두 ${num(WALK_ENUM.total)} 개이고 최대 유량은 ${mv} 입니다. 유량 ${mv}${을를(mv)} 만드는 배정은 ${num(top.length)} 개인데 총비용이 ${num(best)}${과와(num(best))} ${num(worst)}${으로(num(worst))} 갈립니다. 정본이 낸 답은 { flow: ${answer.flow}, cost: ${answer.cost} } 입니다.`,
    ].join("\n");
  },

  /** `concept` — 라운드마다 한 일. */
  conceptRounds: () => {
    const c = WALK_COUNT;
    const lastU = String(c.unitCosts.at(-1));
    return [
      md(ROUND_HEAD, roundRows(c, true), [2, 3, 4, 5]),
      "",
      `경로 비용이 라운드마다 ${c.unitCosts.join(" → ")}${으로(lastU)} 커지고, 라운드 ${c.rounds + 1} 에서 증가 경로가 없어 끝납니다. 답은 { flow: ${c.flow}, cost: ${c.cost} } 입니다.`,
    ].join("\n");
  },

  /** `deep.origin` ② — 배정을 전부 만들어 보는 방법의 크기. */
  bruteScale: () => {
    const rows: string[][] = [];
    for (const c of [SINGLE_CASE, SERIAL_CASE, TWO_WAY_CASE, WALK_CASE]) {
      const e = enumerateFlows(c);
      const combos = c.edges.reduce((a, [, , cap]) => a * (cap + 1), 1);
      rows.push([c.label, num(c.edges.length), num(combos), num(e.total)]);
    }
    rows.push([
      "규모의 상한",
      num(E_MAX),
      `${num(C_MAX + 1)}^${num(E_MAX)}`,
      "-",
    ]);
    const perSecond = 9;
    return [
      md(
        ["입력", "간선 E", "배정의 가짓수 (c+1)^E", "두 조건을 지키는 배정"],
        rows,
        [1, 2, 3],
      ),
      "",
      `규모의 상한에서 배정의 가짓수가 ${num(BRUTE_DIGITS)} 자리입니다. 1 초에 10 억 개씩 본다고 해도 자릿수가 아홉만 줄어 ${num(BRUTE_DIGITS - perSecond)} 자리 초가 걸립니다.`,
    ].join("\n");
  },

  /** `deep.origin` ③ — 최대 유량 절차로 아무 증가 경로나 보낸다. */
  anyPath: () => {
    const c = WALK_ANY;
    const best = WALK_BEST[WALK_ENUM.maxValue] as number;
    return [
      md(ROUND_HEAD, roundRows(c, true), [2, 3, 4, 5]),
      "",
      `최대 유량 ${num(c.flow)}${은는(num(c.flow))} 맞지만 총비용이 ${num(c.cost)}${josa(num(c.cost), "이라", "라")}, 전수 조사가 낸 최솟값 ${num(best)} 보다 ${num(c.cost - best)} 큽니다.`,
    ].join("\n");
  },

  /** `deep.origin` ④ — 같은 입력을 두 방식으로 처리한 계수. */
  twoWays: () => {
    const mine = WALK_COUNT;
    const any = WALK_ANY;
    const lastAny = String(any.unitCosts.at(-1));
    return [
      md(
        ["계수", "경로 비용이 가장 작은 경로 먼저", "아무 증가 경로 먼저"],
        [
          ["최대 유량", num(mine.flow), num(any.flow)],
          ["총비용", num(mine.cost), num(any.cost)],
          ["라운드 수", num(mine.rounds), num(any.rounds)],
          ["항목 검사", num(mine.ops), num(any.ops)],
          [
            "라운드마다의 경로 비용",
            mine.unitCosts.join(" · "),
            any.unitCosts.join(" · "),
          ],
        ],
        [1, 2],
      ),
      "",
      `최대 유량은 두 방식이 ${num(mine.flow)}${으로(num(mine.flow))} 같고 총비용은 ${num(mine.cost)}${과와(num(mine.cost))} ${num(any.cost)}${으로(num(any.cost))} 갈립니다. 경로 비용이 가장 작은 쪽은 라운드마다의 경로 비용이 한 번도 줄지 않고, 아무 증가 경로 쪽은 ${any.unitCosts.join(" 에서 ")}${으로(lastAny)} 줄어듭니다.`,
    ].join("\n");
  },

  /** `deep.origin` ⑤ — 정방향 항목만 따라 비용이 가장 작은 경로를 고르면. */
  forwardOnly: () => {
    const c = WALK_FWD;
    return [
      md(ROUND_HEAD, roundRows(c, true), [2, 3, 4, 5]),
      "",
      `정방향 항목만 따라가면 라운드 ${c.rounds + 1} 에서 증가 경로가 없어 유량 ${num(c.flow)}${으로(num(c.flow))} 멈춥니다. 최대 유량은 ${num(WALK_ENUM.maxValue)} 입니다.`,
    ].join("\n");
  },

  /** `deep.origin` ⑤ — 역방향 항목의 단위 비용을 같은 부호로 두면. */
  sameSign: () => {
    const cases = [WALK_CASE, DETOUR_CASE, TWO_WAY_CASE, SERIAL_CASE];
    return md(
      ["입력", "정본 유량 / 총비용", "같은 부호로 둔 판", "대조"],
      contrastRows(cases, sameSignMutant),
      [1, 2],
    );
  },

  /** `deep.build` 낯선 개념 (c) — 간선 1→2 의 두 항목을 읽는다. */
  residualReadOne: () => {
    const s = S[BEFORE_BACK] as Step;
    const k = 2;
    const [u, v, c, a] = WALK[k] as FlowEdge;
    const fwd = s.res[k] as number;
    const back = s.res[WALK.length + k] as number;
    return [
      md(
        ["읽는 것", "자리", "잔여 용량", "단위 비용"],
        [
          [
            "간선의 용량과 단위 비용",
            `c(${u},${v}) · a(${u},${v})`,
            num(c),
            num(a),
          ],
          ["정방향 항목", `${u}→${v}`, num(fwd), num(a)],
          ["역방향 항목", `${v}→${u}`, num(back), num(-a)],
        ],
        [2, 3],
      ),
      "",
      `${u} 에서 ${v} 로 더 보낼 수 있는 양이 ${num(fwd)}${이고(num(fwd))}, 앞서 보낸 ${num(c - fwd)} 가운데 되돌릴 수 있는 양이 ${num(back)} 입니다. 되돌리면 한 단위마다 ${num(-a)}${이가(num(-a))} 더해져 앞서 치른 ${num(a)}${을를(num(a))} 되돌려 받습니다.`,
    ].join("\n");
  },

  /** `deep.build` 낯선 개념 (d) — 다섯 쌍의 잔여와 비용. */
  residualPairs: () => {
    const s = S[BEFORE_BACK] as Step;
    let okCap = 0;
    let okCost = 0;
    const rows = WALK.map(([u, v, c, a], k) => {
      const fwd = s.res[k] as number;
      const back = s.res[WALK.length + k] as number;
      const b = costOf(WALK, WALK.length + k);
      if (fwd + back === c) okCap++;
      if (a + b === 0) okCost++;
      return [
        `${u}→${v}`,
        num(c),
        `${num(fwd)} · ${num(a)}`,
        `${num(back)} · ${num(b)}`,
        num(fwd + back),
        num(a + b),
      ];
    });
    return [
      md(
        [
          "간선",
          "용량",
          "정방향 잔여 · 비용",
          "역방향 잔여 · 비용",
          "두 잔여의 합",
          "두 비용의 합",
        ],
        rows,
        [1, 4, 5],
      ),
      "",
      `${num(WALK.length)} 쌍 중 ${num(okCap)} 쌍에서 두 잔여의 합이 용량과 같고, ${num(okCost)} 쌍에서 두 비용의 합이 0 입니다.`,
    ].join("\n");
  },

  /** `deep.build` 낯선 개념 (d) — 역방향 항목을 지나는 경로의 비용. */
  roundFourCost: () => {
    const s = S[findIndex(4)] as Step;
    const rows = s.arcs.map((id) => [
      arcName(WALK, id),
      isBack(WALK, id) ? "역방향" : "정방향",
      num(costOf(WALK, id)),
    ]);
    const sum = s.arcs.reduce((a, id) => a + costOf(WALK, id), 0);
    const d = num(s.dist[WALK_SINK] as number);
    return [
      md(["지난 항목", "방향", "단위 비용"], rows, [2]),
      "",
      `세 항목의 단위 비용을 더한 경로 비용은 ${num(sum)}${으로(num(sum))} SPFA 가 싱크에 적은 값 d(${WALK_SINK}) = ${d}${과와(d)} 같습니다.`,
    ].join("\n");
  },

  /** `deep.build` 낯선 개념 (d) — 끝난 뒤의 배정과 총비용. */
  finalCost: () => {
    let sum = 0;
    const rows = WALK.map(([u, v, c, a], k) => {
      const f = flowOf(LAST, k);
      sum += f * a;
      return [`${u}→${v}`, num(c), num(a), num(f), num(f * a)];
    });
    const sent = (S[pushIndex(1)] as Step).push;
    const left = num(flowOf(LAST, 2));
    return [
      md(
        ["간선", "용량", "단위 비용", "유량", "유량 × 단위 비용"],
        rows,
        [1, 2, 3, 4],
      ),
      "",
      `간선마다의 곱을 더하면 ${num(sum)} 이고, 라운드마다 병목 × 경로 비용을 더해 온 변수 cost 도 ${num(LAST.cost)} 입니다. 간선 1→2 에는 라운드 1 이 보낸 ${num(sent)} 가운데 라운드 4 가 되돌리고 남은 ${left}${이가(left)} 실려 있습니다.`,
    ].join("\n");
  },

  /** `deep.build` 낯선 개념 (e) — 같은 부호로 둔 판과 라운드마다 비교한다. */
  signRounds: () => {
    const mine = WALK_COUNT;
    const bent = WALK_SAME;
    const n = Math.max(mine.rounds, bent.rounds);
    const rows: string[][] = [];
    let off = 0;
    let samePath = 0;
    for (let i = 0; i < n; i++) {
      const a = mine.unitCosts[i] as number;
      const b = bent.unitCosts[i] as number;
      if (a !== b) off++;
      if (mine.paths[i] === bent.paths[i]) samePath++;
      rows.push([
        `라운드 ${i + 1}`,
        mine.paths[i] ?? "-",
        num(a),
        num(b),
        num(b - a),
      ]);
    }
    return [
      md(
        [
          "라운드",
          "증가 경로",
          "반대 부호의 경로 비용",
          "같은 부호의 경로 비용",
          "차이",
        ],
        rows,
        [2, 3, 4],
      ),
      "",
      `두 판이 고른 증가 경로는 ${num(n)} 라운드 중 ${num(samePath)} 라운드에서 같고, 경로 비용이 갈리는 라운드는 ${num(off)} 개입니다. 총비용은 ${num(mine.cost)}${과와(num(mine.cost))} ${num(bent.cost)}${으로(num(bent.cost))} ${num(bent.cost - mine.cost)} 차이가 납니다.`,
    ].join("\n");
  },

  /** 1단계 — 정점마다의 목록. */
  stageBuild: () => {
    const s0 = S[0] as Step;
    const rows = WALK_TRACE.lists.map((ids, v) => {
      const show = (back: boolean) =>
        ids
          .filter((id) => isBack(WALK, id) === back)
          .map(
            (id) =>
              `${arcName(WALK, id)} 잔여 ${num(s0.res[id] as number)} · 비용 ${num(costOf(WALK, id))}`,
          )
          .join(" · ") || "없음";
      return [String(v), show(false), show(true), num(ids.length)];
    });
    const total = num(WALK_TRACE.lists.reduce((a, l) => a + l.length, 0));
    return [
      md(["정점", "정방향 항목", "역방향 항목", "목록 길이"], rows, [3]),
      "",
      `목록 길이의 합은 ${total}${이고(total)} 간선 ${num(WALK.length)} 개의 두 배입니다. 역방향 항목 ${num(WALK.length)} 개는 모두 잔여 0 으로 시작하고, 단위 비용은 짝의 부호를 바꾼 값입니다.`,
    ].join("\n");
  },

  /** 2단계 — 라운드마다 SPFA 가 낸 값. */
  stageSpfa: () => {
    const rows: string[][] = [];
    for (const s of S) {
      if (s.kind !== "find" && s.kind !== "end") continue;
      const back = s.arcs.filter((id) => isBack(WALK, id));
      rows.push([
        `라운드 ${s.round}`,
        list(s.dist),
        s.kind === "end" ? "없음" : route(s.path),
        s.kind === "end" ? "-" : num(s.pathCost),
        s.kind === "end"
          ? "-"
          : back.length === 0
            ? "안 지난다"
            : back.map((id) => arcName(WALK, id)).join(" · "),
      ]);
    }
    const four = S[findIndex(4)] as Step;
    return [
      md(
        ["라운드", "dist", "증가 경로", "경로 비용", "지난 역방향 항목"],
        rows,
        [3],
      ),
      "",
      `역방향 항목을 지난 라운드는 라운드 ${four.round} 하나이고, 그 라운드에서 정점 1 의 값이 ${num(four.dist[1] as number)} 입니다. 마지막 라운드는 싱크의 값이 ∞ 로 남습니다.`,
    ].join("\n");
  },

  /** 2단계 — 라운드 4 의 SPFA 를 꺼낸 차례대로. */
  stageSpfaFour: () => {
    const s = S[findIndex(4)] as Step;
    const rows = s.pops.map((p) => [
      String(p.u),
      p.wrote.length === 0
        ? "없음"
        : p.wrote
            .map(
              ([v, d, id]) =>
                `${v} 에 ${num(d)} (${arcName(WALK, id)}${isBack(WALK, id) ? " 역방향" : ""})`,
            )
            .join(" · "),
      list(p.queue),
    ]);
    const d1 = num(s.dist[1] as number);
    return [
      md(["꺼낸 정점", "값을 줄인 정점 (지난 항목)", "꺼낸 뒤 큐"], rows),
      "",
      `라운드 ${s.round} 에서 정점 1 은 역방향 항목 2→1 을 지나 값 ${d1}${을를(d1)} 받습니다. 정방향 항목 0→1 은 잔여가 ${num(s.res[0] as number)}${josa(num(s.res[0] as number), "이라", "라")} 지날 수 없습니다.`,
    ].join("\n");
  },

  /** 3단계 — 라운드 1 이 보낸 뒤 항목마다 바뀐 잔여. */
  stagePush: () => {
    const i = pushIndex(1);
    const s = S[i] as Step;
    const b = S[i - 1] as Step;
    const rows = s.arcs.map((id) => {
      const pr = pairOf(WALK, id);
      return [
        arcName(WALK, id),
        `${num(b.res[id] as number)} → ${num(s.res[id] as number)}`,
        `${arcName(WALK, pr)} ${num(b.res[pr] as number)} → ${num(s.res[pr] as number)}`,
      ];
    });
    const caps = s.arcs.map((id) => num(b.res[id] as number));
    const add = num(s.push * s.pathCost);
    const total = num(s.cost);
    return [
      md(["지난 항목", "그 항목의 잔여", "짝 항목의 잔여"], rows),
      "",
      `병목은 min(${caps.join(", ")}) = ${num(s.push)} 이고 경로 비용은 ${num(s.pathCost)} 입니다. 총비용에 ${num(s.push)} × ${num(s.pathCost)} = ${add}${이가(add)} 더해져 누적 총비용이 ${total}${이가(total)} 됩니다.`,
    ].join("\n");
  },

  /** 3단계 — 핵심 성질: 흐른 양마다 최소 비용. */
  marginal: () => {
    const reached = new Map<number, [number, number]>();
    for (const s of S)
      if (s.kind === "push") reached.set(s.flow, [s.round, s.cost]);
    const rows: string[][] = [];
    for (let v = 0; v <= WALK_ENUM.maxValue; v++) {
      const hit = reached.get(v);
      rows.push([
        num(v),
        num(WALK_BEST[v] as number),
        v === 0 ? "-" : num(MARGINAL[v - 1] as number),
        v === 0 ? "시작" : hit ? `라운드 ${hit[0]}` : "지나간다",
        v === 0 ? "0" : hit ? num(hit[1]) : "-",
      ]);
    }
    let same = 0;
    for (const [v, [, c]] of reached) if (WALK_BEST[v] === c) same++;
    const spread = expand(WALK_COUNT);
    const m = MARGINAL.join(" ");
    return [
      md(
        [
          "유량 값",
          "전수 조사의 최소 총비용",
          "한 단위 더 보내는 값",
          "그 유량 값에 이른 라운드",
          "그때의 누적 총비용",
        ],
        rows,
        [0, 1, 2, 4],
      ),
      "",
      `라운드가 끝난 ${num(reached.size)} 자리 중 ${num(same)} 자리에서 누적 총비용이 전수 조사의 최솟값과 같습니다. 한 단위 더 보내는 값 ${m}${은는(m)} 라운드마다의 경로 비용 ${WALK_COUNT.unitCosts.join(" ")}${을를(String(WALK_COUNT.unitCosts.at(-1)))} 병목 ${WALK_COUNT.bottlenecks.join(" ")} 만큼 펼친 ${spread.join(" ")}${과와(String(spread.at(-1)))} 같습니다.`,
    ].join("\n");
  },

  /** 4단계 — 끝내는 자리. */
  stageStop: () => {
    const end = LAST;
    const out = (WALK_TRACE.lists[WALK_SOURCE] as number[]).filter(
      (id) => !isBack(WALK, id),
    );
    const rows = out.map((id) => [
      arcName(WALK, id),
      num(end.res[id] as number),
      num(end.res[pairOf(WALK, id)] as number),
    ]);
    return [
      md(
        ["소스에서 나가는 정방향 항목", "잔여 용량", "실린 유량"],
        rows,
        [1, 2],
      ),
      "",
      `라운드 ${end.round} 의 dist 는 ${list(end.dist)} 입니다. 소스에서 나가는 정방향 항목의 잔여가 모두 0 이라 SPFA 가 소스 하나만 꺼내고 끝나고, d(${WALK_SINK}) = ∞ 라 반복을 끝냅니다.`,
    ].join("\n");
  },

  /** 전제 — 아무 증가 경로나 보내면 음수 사이클이 남는다. */
  premiseAny: () => {
    const rows = ALL_CASES.map((c) => {
      const mine = measure(c);
      const any = runCounted(c.n, c.edges, c.source, c.sink, { order: "any" });
      return [
        c.label,
        num(mine.cost),
        num(any.cost),
        num(mine.negCycleRounds),
        num(any.negCycleRounds),
      ];
    });
    const withCycle = rows.filter((r) => r[4] !== "0").length;
    return [
      md(
        [
          "입력",
          "정본 총비용",
          "아무 증가 경로의 총비용",
          "정본에서 음수 사이클이 있던 라운드",
          "아무 증가 경로에서 음수 사이클이 있던 라운드",
        ],
        rows,
        [1, 2, 3, 4],
      ),
      "",
      `정본은 입력 ${num(rows.length)} 개 모두 음수 사이클이 있던 라운드가 0 이고, 아무 증가 경로를 고른 판은 ${num(withCycle)} 개 입력에서 0 이 아닙니다.`,
    ].join("\n");
  },

  /** `deep.walk` 1 — 잔여 그래프를 만든 직후. */
  walkInit: () => {
    const s0 = S[0] as Step;
    const lines = WALK_TRACE.lists.map((ids, v) => {
      const items = ids.map((id) => {
        const k = id % WALK.length;
        const rev = isBack(WALK, id)
          ? (WALK_TRACE.lists[tailOf(WALK, k)] as number[]).indexOf(k)
          : (WALK_TRACE.lists[headOf(WALK, k)] as number[]).indexOf(
              WALK.length + k,
            );
        return `{to:${headOf(WALK, id)}, cap:${s0.res[id]}, cost:${costOf(WALK, id)}, rev:${rev}}`;
      });
      return `graph[${v}] = [ ${items.join(", ")} ]`;
    });
    const total = WALK_TRACE.lists.reduce((a, l) => a + l.length, 0);
    return [...lines, `항목 ${total} 개 = 간선 ${WALK.length} 개 × 2`].join(
      "\n",
    );
  },

  /** `deep.walk` 2 — 라운드 1 의 SPFA 를 꺼낸 차례대로. */
  walkFirst: () => {
    const s = S[findIndex(1)] as Step;
    const rows = s.pops.map((p) => {
      const wrote = p.wrote.map(
        ([v, d]) => `${v}${을를(String(v))} ${num(d)}${으로(num(d))}`,
      );
      const waited = p.waited.map((v) => `${v}${은는(String(v))} 이미 큐에`);
      return [
        `${p.u}${을를(String(p.u))} 꺼낸다`,
        [...wrote, ...waited].join(" · ") || "줄인 값이 없다",
        `큐 ${list(p.queue)}`,
      ];
    });
    return [...columns(rows), `dist = ${list(s.dist)}`].join("\n");
  },

  /** 짚고 가기 — 다익스트라로 바꾸면. */
  pauseDijkstra: () => {
    const rows = ALL_CASES.map((c) => {
      const mine = measure(c);
      const dij = runCounted(c.n, c.edges, c.source, c.sink, {
        engine: "dijkstra",
      });
      return [
        c.label,
        `${mine.flow} / ${mine.cost}`,
        `${dij.flow} / ${dij.cost}`,
        verdict(mine.flow === dij.flow && mine.cost === dij.cost),
      ];
    });
    const off = rows.filter((r) => r[3] === "어긋난다").length;
    return [
      md(
        ["입력", "정본 유량 / 총비용", "다익스트라로 바꾼 판", "대조"],
        rows,
        [1, 2],
      ),
      "",
      `입력 ${num(rows.length)} 개 중 답이 갈리는 것이 ${num(off)} 개이고, ${NAME.walk}을 포함한 나머지 ${num(rows.length - off)} 개는 답이 같습니다.`,
    ].join("\n");
  },

  /** 짚고 가기 — 다익스트라가 갈리는 입력에서 라운드마다. */
  pauseDijkstraWhy: () => {
    const c = TRAP_CASE;
    const mine = measure(c);
    const dij = runCounted(c.n, c.edges, c.source, c.sink, {
      engine: "dijkstra",
    });
    const edgeRows = c.edges.map(([u, v, cap, a]) => [
      `${u}→${v}`,
      num(cap),
      num(a),
    ]);
    const n = Math.max(mine.rounds, dij.rounds);
    const rows: string[][] = [];
    let first = -1;
    for (let i = 0; i < n; i++) {
      const a = mine.dists[i] ?? [];
      const b = dij.dists[i] ?? [];
      if (first < 0 && list(a) !== list(b)) first = i + 1;
      rows.push([
        `라운드 ${i + 1}`,
        list(a),
        list(b),
        `${mine.paths[i]} · ${num(mine.unitCosts[i] as number)}`,
        `${dij.paths[i]} · ${num(dij.unitCosts[i] as number)}`,
      ]);
    }
    return [
      md(["간선", "용량", "단위 비용"], edgeRows, [1, 2]),
      "",
      "두 판을 라운드마다 나란히 놓으면 이렇습니다.",
      "",
      md(
        [
          "라운드",
          "정본 dist",
          "다익스트라 판 dist",
          "정본 경로 · 경로 비용",
          "다익스트라 판 경로 · 경로 비용",
        ],
        rows,
      ),
      "",
      `처음 갈리는 라운드는 라운드 ${first} 입니다. 최대 유량은 두 판이 ${num(mine.flow)}${으로(num(mine.flow))} 같고 총비용은 ${num(mine.cost)}${과와(num(mine.cost))} ${num(dij.cost)}${으로(num(dij.cost))} 갈립니다.`,
    ].join("\n");
  },

  /** `deep.walk` 3 — 라운드 1 에서 병목을 재고 두 잔여를 고친다. */
  walkPush: () => {
    const i = pushIndex(1);
    const s = S[i] as Step;
    const b = S[i - 1] as Step;
    const caps = s.arcs.map((id) => num(b.res[id] as number));
    const rows = s.arcs.map((id) => {
      const pr = pairOf(WALK, id);
      return [
        arcName(WALK, id),
        `cap ${b.res[id]} → ${s.res[id]}`,
        `${arcName(WALK, pr)} cap ${b.res[pr]} → ${s.res[pr]}`,
      ];
    });
    return [
      `push = min(${caps.join(", ")}) = ${s.push}`,
      ...columns(rows),
      `flow = ${s.flow} · cost = 0 + ${s.push} × ${s.pathCost} = ${s.cost}`,
    ].join("\n");
  },

  /** `deep.walk` 4 — 열 걸음 전체. */
  walkTrace: () => {
    const rows = S.map((s, i) => {
      const hits = LABELS.filter((l) => s.hits[l] > 0)
        .map((l) => `${l} ${s.hits[l]}`)
        .join(" · ");
      const what =
        s.kind === "build"
          ? "잔여 그래프를 만든다"
          : s.kind === "find"
            ? `라운드 ${s.round} · 증가 경로를 찾는다`
            : s.kind === "push"
              ? `라운드 ${s.round} · 병목만큼 보낸다`
              : `라운드 ${s.round} · 증가 경로가 없다`;
      return [
        tOf(i),
        what,
        hits,
        s.kind === "build" ? "-" : list(s.dist),
        s.kind === "find" || s.kind === "push"
          ? `${route(s.path)} · ${num(s.pathCost)}`
          : "-",
        s.kind === "push" ? num(s.push) : "-",
        WALK.map((_, k) => num(s.res[k] as number)).join(", "),
        `${num(s.flow)} / ${num(s.cost)}`,
      ];
    });
    const reads = num(S.reduce((a, s) => a + s.reads, 0));
    const ops = num(WALK_COUNT.ops);
    return [
      md(
        [
          "걸음",
          "하는 일",
          "실행한 갈래와 횟수",
          "dist",
          "증가 경로 · 경로 비용",
          "병목",
          "정방향 잔여 (0→1, 0→2, 1→2, 1→3, 2→3)",
          "누적 유량 / 누적 총비용",
        ],
        rows,
        [5],
      ),
      "",
      `걸음 ${num(S.length)} 개에서 항목을 읽은 횟수는 모두 ${reads} 번이고, 값만 세는 사본이 낸 항목 검사 ${ops}${과와(ops)} 같습니다. 반환값은 { flow: ${LAST.flow}, cost: ${LAST.cost} } 입니다.`,
    ].join("\n");
  },

  /** `deep.walk` 4 — 갈래 여섯의 실행 횟수. */
  branchCoverage: () => {
    const rows = LABELS.map((l) => {
      const at = S.flatMap((s, i) => (s.hits[l] > 0 ? [tOf(i)] : []));
      const total = S.reduce((a, s) => a + s.hits[l], 0);
      return [l, LABEL_TEXT[l], num(total), at.join(" · ")];
    });
    const covered = rows.filter((r) => r[2] !== "0").length;
    const back = S.flatMap((s, i) =>
      s.kind === "push" && s.arcs.some((id) => isBack(WALK, id))
        ? [tOf(i)]
        : [],
    );
    return [
      md(["라벨", "하는 일", "실행 횟수", "실행한 걸음"], rows, [2]),
      "",
      `갈래 ${num(LABELS.length)} 개 중 ${num(covered)} 개가 한 번 이상 실행됐습니다. 역방향 항목으로 유량을 보낸 걸음은 ${back.join(" · ")} 입니다.`,
    ].join("\n");
  },

  /** 짚고 가기 — 병목만큼 한 번에 안 보내고 한 단위씩 보내면. */
  pauseUnit: () => {
    const cases = [
      WALK_CASE,
      DETOUR_CASE,
      TWO_WAY_CASE,
      SERIAL_CASE,
      SINGLE_CASE,
    ];
    return md(
      ["입력", "정본 유량 / 총비용", "한 단위씩만 보내는 판", "대조"],
      contrastRows(cases, unitPush),
      [1, 2],
    );
  },

  /** 짚고 가기 — 한 단위씩 보내면 라운드가 몇 배가 되는가. */
  pauseUnitWork: () => {
    const cases: Case[] = [
      WALK_CASE,
      SINGLE_CASE,
      TWO_WAY_CASE,
      SERIAL_CASE,
      chains(4, 2, 1000),
    ];
    const got = cases.map((c) => ({
      c,
      mine: measure(c),
      unit: runCounted(c.n, c.edges, c.source, c.sink, { unitPush: true }),
    }));
    const rows = got.map(({ c, mine, unit }) => [
      c.label,
      num(mine.flow),
      num(mine.rounds),
      num(unit.rounds),
      num(mine.ops),
      num(unit.ops),
    ]);
    const worst = got.reduce((a, b) => (b.unit.rounds > a.unit.rounds ? b : a));
    const eq = got.filter(({ mine, unit }) => unit.rounds === mine.flow).length;
    return [
      md(
        [
          "입력",
          "최대 유량",
          "정본 라운드",
          "한 단위씩 보내는 판의 라운드",
          "정본 항목 검사",
          "한 단위씩 보내는 판의 항목 검사",
        ],
        rows,
        [1, 2, 3, 4, 5],
      ),
      "",
      `라운드가 가장 많이 늘어나는 입력인 ${worst.c.label} 에서 라운드가 ${num(worst.mine.rounds)} 번에서 ${num(worst.unit.rounds)} 번이 됩니다. 한 단위씩 보내는 판의 라운드 수는 입력 ${num(got.length)} 개 중 ${num(eq)} 개에서 최대 유량과 같습니다.`,
    ].join("\n");
  },

  /** `deep.walk.final` 뒤 — 입력 여럿에 정본을 부른 결과. */
  walkResult: () => {
    const calls: [number, FlowEdge[], number, number][] = [
      [WALK_N, WALK, WALK_SOURCE, WALK_SINK],
      [2, [[0, 1, 5, 2]], 0, 1],
      [
        3,
        [
          [0, 1, 5, 2],
          [1, 2, 5, 3],
        ],
        0,
        2,
      ],
      [4, TWO_WAY_CASE.edges, 0, 3],
      [3, [[0, 1, 10, 5]], 0, 2],
      [2, [], 0, 1],
      [
        2,
        [
          [0, 1, 2, 5],
          [0, 1, 3, 1],
        ],
        0,
        1,
      ],
    ];
    const rows = calls.map(([n, e, s, t]) => {
      const r = minCostMaxFlow(n, e, s, t);
      return [
        `minCostMaxFlow(${n}, ${JSON.stringify(e)}, ${s}, ${t})`,
        "→",
        `{ flow: ${r.flow}, cost: ${r.cost} }`,
      ];
    });
    return columns(rows).join("\n");
  },

  /** `related` — 유량 값마다의 최소 총비용이 그리는 곡선. */
  relatedConvex: () => {
    const rows: string[][] = [];
    for (let v = 0; v <= WALK_ENUM.maxValue; v++) {
      rows.push([
        num(v),
        num(WALK_BEST[v] as number),
        v === 0 ? "-" : num(MARGINAL[v - 1] as number),
      ]);
    }
    let drops = 0;
    for (let i = 1; i < MARGINAL.length; i++)
      if ((MARGINAL[i] as number) < (MARGINAL[i - 1] as number)) drops++;
    const others: Case[] = [
      DETOUR_CASE,
      TWO_WAY_CASE,
      TRAP_CASE,
      SERIAL_CASE,
      assignment(4, 4, 3, 987654321n),
    ];
    let otherDrops = 0;
    const otherRows = others.map((c) => {
      const got = measure(c);
      let bad = 0;
      for (let i = 1; i < got.unitCosts.length; i++)
        if ((got.unitCosts[i] as number) < (got.unitCosts[i - 1] as number))
          bad++;
      otherDrops += bad;
      return [c.label, num(got.rounds), got.unitCosts.join(" · "), num(bad)];
    });
    return [
      md(
        ["유량 값", "그 값에서의 최소 총비용", "직전 유량 값과의 차이"],
        rows,
        [0, 1, 2],
      ),
      "",
      "다른 입력에서도 라운드마다의 경로 비용을 차례로 놓아 보면 이렇습니다.",
      "",
      md(
        [
          "입력",
          "라운드",
          "라운드마다의 경로 비용",
          "앞 라운드보다 줄어든 자리",
        ],
        otherRows,
        [1, 3],
      ),
      "",
      `${NAME.walk}의 차이 ${MARGINAL.join(" ")} 에서 앞보다 줄어든 자리가 ${num(drops)} 개이고, 다른 입력 ${num(otherRows.length)} 개에서도 줄어든 자리가 모두 ${num(otherDrops)} 개입니다.`,
    ].join("\n");
  },

  /** `deep.math` — 라운드 1 을 끝낸 잔여 그래프를 잠재값으로 다시 매긴다. */
  mathReweight: () => {
    const find = S[findIndex(1)] as Step;
    const after = S[pushIndex(1)] as Step;
    const pi = find.dist;
    const rows: string[][] = [];
    let bad = 0;
    let zero = 0;
    for (let id = 0; id < 2 * WALK.length; id++) {
      if ((after.res[id] as number) <= 0) continue;
      const u = tailOf(WALK, id);
      const v = headOf(WALK, id);
      const a = costOf(WALK, id);
      const r = a + (pi[u] as number) - (pi[v] as number);
      if (r < 0) bad++;
      if (r === 0) zero++;
      rows.push([
        arcName(WALK, id),
        num(a),
        num(pi[u] as number),
        num(pi[v] as number),
        num(r),
      ]);
    }
    const fresh = after.arcs
      .map((id) => pairOf(WALK, id))
      .map((id) => arcName(WALK, id));
    const lastFresh = fresh.at(-1) as string;
    return [
      md(["항목", "a", "π(u)", "π(v)", "a + π(u) − π(v)"], rows, [1, 2, 3, 4]),
      "",
      `잔여가 양수인 항목 ${num(rows.length)} 개 중 다시 매긴 값이 음수인 것이 ${num(bad)} 개이고, 정확히 0 인 것이 ${num(zero)} 개입니다. 잠재값 π 는 라운드 1 의 dist ${list(pi)}${을를(num(pi.at(-1) as number))} 그대로 쓴 것이고, 이번 라운드에 새로 열린 역방향 항목 ${fresh.join(" · ")}${은는(lastFresh)} 모두 0 입니다.`,
    ].join("\n");
  },

  /** `deep.math` — 무작위 네트워크에서 다시 매긴 값이 음수인 자리. */
  mathNonneg: () => {
    const next = stream(31415926535n);
    let networks = 0;
    let rounds = 0;
    let checked = 0;
    let bad = 0;
    let newBack = 0;
    let tight = 0;
    let negCycle = 0;
    let drops = 0;
    while (networks < 2000) {
      const n = 4 + (next() % 8);
      const m = 4 + (next() % 20);
      const edges: FlowEdge[] = [];
      const taken = new Set<string>();
      for (let i = 0; i < m; i++) {
        const u = next() % n;
        const v = next() % n;
        if (u === v || v === 0 || u === n - 1) continue;
        const key = `${u},${v}`;
        if (taken.has(key)) continue;
        taken.add(key);
        edges.push([u, v, 1 + (next() % 6), next() % 12]);
      }
      if (edges.length < 3) continue;
      networks++;
      const got = measure({ label: "", n, edges, source: 0, sink: n - 1 });
      rounds += got.rounds;
      checked += got.checkedArcs;
      bad += got.badReduced;
      newBack += got.newReverse;
      tight += got.tightNewReverse;
      negCycle += got.negCycleRounds;
      for (let i = 1; i < got.unitCosts.length; i++)
        if ((got.unitCosts[i] as number) < (got.unitCosts[i - 1] as number))
          drops++;
    }
    return [
      md(
        ["센 것", "값"],
        [
          ["무작위 네트워크", num(networks)],
          ["라운드 합", num(rounds)],
          ["보낸 뒤 다시 매긴 잔여 항목", num(checked)],
          ["그중 다시 매긴 값이 음수인 것", num(bad)],
          ["새로 열린 역방향 항목", num(newBack)],
          ["그중 다시 매긴 값이 정확히 0 인 것", num(tight)],
          ["잔여 그래프에 음수 사이클이 있던 라운드", num(negCycle)],
          ["경로 비용이 앞 라운드보다 줄어든 자리", num(drops)],
        ],
        [1],
      ),
      "",
      `정점 4 개에서 11 개 · 간선 3 개에서 23 개인 네트워크 ${num(networks)} 개를 만들어 라운드마다 쟀습니다. 다시 매긴 값이 음수인 항목이 ${num(bad)} 개, 음수 사이클이 있던 라운드가 ${num(negCycle)} 번이고, 새로 열린 역방향 항목 ${num(newBack)} 개 중 ${num(tight)} 개가 다시 매긴 값 0 입니다.`,
    ].join("\n");
  },

  /** `deep.math` — 규모의 상한을 넣은 값과 정수 한계. */
  mathScale: () => {
    const flowMax = E_MAX * C_MAX;
    const unitMax = (V_MAX - 1) * A_MAX;
    const product = flowMax * unitMax;
    const tight = E_MAX * C_MAX * A_MAX;
    const safe = Number.MAX_SAFE_INTEGER;
    return [
      md(
        [
          "식",
          `V = ${num(V_MAX)} · E = ${num(E_MAX)} · c, a ≤ ${num(C_MAX)} 에서`,
        ],
        [
          ["최대 유량의 상한 E · c_max", num(flowMax)],
          ["경로 비용의 상한 (V − 1) · a_max", num(unitMax)],
          ["둘의 곱", num(product)],
          [
            "간선마다 용량 × 단위 비용을 더한 상한 E · c_max · a_max",
            num(tight),
          ],
          ["배정밀도 수가 정수를 정확히 담는 한계 2^53 − 1", num(safe)],
        ],
        [1],
      ),
      "",
      `총비용은 두 상한 모두 ${num(safe)} 안쪽입니다. 헐거운 쪽으로 잡아도 ${(safe / product).toFixed(2)} 배 여유가 있고, 조인 쪽으로 잡으면 ${num(Math.floor(safe / tight))} 배 여유입니다.`,
    ].join("\n");
  },

  /** `invariant` — 라운드가 끝날 때마다 그 유량 값에서 최소 비용인가. */
  invariantRounds: () => {
    const cases: Case[] = [
      WALK_CASE,
      DETOUR_CASE,
      TWO_WAY_CASE,
      SERIAL_CASE,
      SINGLE_CASE,
    ];
    let offAll = 0;
    let cycAll = 0;
    const rows = cases.map((c) => {
      const best = bestByValue(enumerateFlows(c));
      const got = measure(c);
      let value = 0;
      let cost = 0;
      let off = 0;
      got.unitCosts.forEach((u, i) => {
        value += got.bottlenecks[i] as number;
        cost += u * (got.bottlenecks[i] as number);
        if (cost !== (best[value] as number)) off++;
      });
      offAll += off;
      cycAll += got.negCycleRounds;
      return [
        c.label,
        num(got.rounds),
        num(got.flow),
        num(got.cost),
        num(off),
        num(got.negCycleRounds),
      ];
    });
    return [
      md(
        [
          "입력",
          "라운드",
          "최대 유량",
          "총비용",
          "최소가 아니었던 라운드",
          "음수 사이클이 있던 라운드",
        ],
        rows,
        [1, 2, 3, 4, 5],
      ),
      "",
      `입력 ${num(rows.length)} 개를 라운드마다 전수 조사와 맞대 보니 최소가 아니었던 라운드가 ${num(offAll)} 번이고, 같은 자리에서 잔여 그래프에 음수 사이클이 있던 라운드도 ${num(cycAll)} 번입니다.`,
    ].join("\n");
  },

  /** `invariant` — 경계의 입력. */
  invariantEdges: () => {
    const cases: [string, number, FlowEdge[], number, number][] = [
      ["간선이 하나도 없다", 2, [], 0, 1],
      ["싱크로 가는 경로가 없다", 3, [[0, 1, 10, 5]], 0, 2],
      ["용량이 0 인 간선뿐", 2, [[0, 1, 0, 5]], 0, 1],
      [
        "단위 비용이 전부 0",
        3,
        [
          [0, 1, 5, 0],
          [1, 2, 5, 0],
        ],
        0,
        2,
      ],
      ["소스에서 싱크로 바로", 2, [[0, 1, 7, 3]], 0, 1],
      [
        "같은 두 정점 사이에 간선 둘",
        2,
        [
          [0, 1, 2, 5],
          [0, 1, 3, 1],
        ],
        0,
        1,
      ],
      [
        "자기 자신으로 가는 간선",
        3,
        [
          [1, 1, 4, 1],
          [0, 1, 2, 1],
          [1, 2, 2, 1],
        ],
        0,
        2,
      ],
      [
        "용량과 단위 비용이 규모의 상한",
        3,
        [
          [0, 1, C_MAX, A_MAX],
          [1, 2, C_MAX, A_MAX],
        ],
        0,
        2,
      ],
    ];
    let cyc = 0;
    const rows = cases.map(([label, n, edges, source, sink]) => {
      const got = measure({ label, n, edges, source, sink });
      cyc += got.negCycleRounds;
      return [
        label,
        JSON.stringify(edges),
        `{ flow: ${num(got.flow)}, cost: ${num(got.cost)} }`,
        num(got.negCycleRounds),
      ];
    });
    return [
      md(
        ["입력", "간선 목록", "정본의 답", "음수 사이클이 있던 라운드"],
        rows,
        [3],
      ),
      "",
      `입력 ${num(rows.length)} 개 모두 답이 나오고, 음수 사이클이 있던 라운드는 모두 ${num(cyc)} 번입니다.`,
    ].join("\n");
  },

  /** `invariant` 깨뜨리기 — 누적 총비용에 병목을 안 곱하면. */
  mutantCost: () => {
    const cases = [
      WALK_CASE,
      SINGLE_CASE,
      SERIAL_CASE,
      TWO_WAY_CASE,
      DETOUR_CASE,
      TRAP_CASE,
    ];
    const rows = cases.map((c) => {
      const want = minCostMaxFlow(c.n, c.edges, c.source, c.sink);
      const got = noTimes.minCostMaxFlow(c.n, c.edges, c.source, c.sink);
      const counted = measure(c);
      return [
        c.label,
        counted.bottlenecks.join(" · "),
        num(want.cost),
        num(got.cost),
        verdict(want.cost === got.cost),
      ];
    });
    return md(
      [
        "입력",
        "라운드마다의 병목",
        "정본 총비용",
        "병목을 안 곱하는 판",
        "대조",
      ],
      rows,
      [2, 3],
    );
  },

  /** `perf.derive` — 전개 입력의 계수. */
  perfCount: () => {
    const c = WALK_COUNT;
    return [
      md(
        ["센 것", "값"],
        [
          ["라운드 수", num(c.rounds)],
          ["SPFA 가 큐에서 꺼낸 정점 수", num(c.pops)],
          ["값을 줄인 횟수", num(c.relaxHits)],
          ["큐가 가장 길어졌을 때의 길이", num(c.peakQueue)],
          ["항목 검사", num(c.ops)],
        ],
        [1],
      ),
      "",
      "라운드마다 보낸 양과 더한 총비용은 이렇습니다.",
      "",
      md(
        ["라운드", "경로 비용", "병목", "그 라운드가 더한 총비용"],
        c.unitCosts.map((u, i) => [
          `라운드 ${i + 1}`,
          num(u),
          num(c.bottlenecks[i] as number),
          num(u * (c.bottlenecks[i] as number)),
        ]),
        [1, 2, 3],
      ),
      "",
      `정점 ${num(WALK_N)} · 간선 ${num(WALK.length)} 에서 잰 값입니다. 라운드 ${num(c.rounds)} 번이 더한 총비용을 합치면 ${num(c.cost)} 입니다.`,
    ].join("\n");
  },

  /** `perf.derive` — 규모를 키우며 같은 계수를 다시 잰다. */
  perfGrowth: () => {
    const got = [4, 8, 16, 32].map((k) => {
      const c = assignment(k, k, 4, 987654321n);
      return { k, c, m: measure(c) };
    });
    const rows = got.map(({ c, m }) => [
      c.label,
      num(c.n),
      num(c.edges.length),
      num(m.flow),
      num(m.rounds),
      num(m.pops),
      num(m.ops),
    ]);
    const growth: string[][] = [];
    for (let i = 1; i < got.length; i++) {
      const a = got[i - 1] as (typeof got)[number];
      const b = got[i] as (typeof got)[number];
      growth.push([
        `${a.k}×${a.k} → ${b.k}×${b.k}`,
        (b.c.n / a.c.n).toFixed(2),
        (b.m.rounds / a.m.rounds).toFixed(2),
        (b.m.ops / a.m.ops).toFixed(2),
      ]);
    }
    const eq = got.filter(({ m }) => m.rounds === m.flow).length;
    return [
      md(
        [
          "입력",
          "정점",
          "간선",
          "최대 유량",
          "라운드",
          "꺼낸 정점",
          "항목 검사",
        ],
        rows,
        [1, 2, 3, 4, 5, 6],
      ),
      "",
      "한 변을 두 배로 늘릴 때마다의 비는 이렇습니다.",
      "",
      md(
        ["늘린 구간", "정점의 비", "라운드의 비", "항목 검사의 비"],
        growth,
        [1, 2, 3],
      ),
      "",
      `네 입력 모두 간선 용량이 1 이라 병목이 늘 1 이고, 라운드 수가 최대 유량과 같은 입력이 ${num(got.length)} 개 중 ${num(eq)} 개입니다.`,
    ].join("\n");
  },

  /** `perf.worst` — 모양이 다른 여섯. */
  worstShape: () => {
    const cases: Case[] = [
      { ...crossed(16, 64, 20, 0, 20250907n), label: "병렬 16 · 가로 0" },
      { ...crossed(16, 64, 20, 64, 20250907n), label: "병렬 16 · 가로 64" },
      { ...crossed(16, 64, 20, 180, 20250907n), label: "병렬 16 · 가로 180" },
      { ...assignment(32, 32, 4, 987654321n), label: "배정 32×32" },
      { ...chains(8, 4, 1), label: "사슬 8×4 · 용량 1" },
      { ...chains(8, 4, C_MAX), label: `사슬 8×4 · 용량 ${num(C_MAX)}` },
    ];
    const got = cases.map((c) => ({ c, m: measure(c) }));
    const rows = got.map(({ c, m }) => [
      c.label,
      num(c.n),
      num(c.edges.length),
      num(m.flow),
      num(m.rounds),
      num(m.ops),
    ]);
    const most = got.reduce((a, b) => (b.m.ops > a.m.ops ? b : a));
    const mostR = got.reduce((a, b) => (b.m.rounds > a.m.rounds ? b : a));
    return [
      md(
        ["입력", "정점", "간선", "최대 유량", "라운드", "항목 검사"],
        rows,
        [1, 2, 3, 4, 5],
      ),
      "",
      `항목 검사가 가장 많은 입력은 ${most.c.label}${이고(most.c.label)} ${num(most.m.ops)} 번이며, 라운드가 가장 많은 입력도 ${mostR.c.label}${이고(mostR.c.label)} ${num(mostR.m.rounds)} 번입니다.`,
    ].join("\n");
  },

  /** `perf.worst` — 규모의 상한을 꽉 채운 입력. */
  worstLimit: () => {
    const got: { k: number; c: Case; m: Counted }[] = [];
    for (const [k, cross] of [
      [16, 1952],
      [32, 1904],
      [64, 1808],
      [80, 1760],
      [99, 1703],
    ] as [number, number][]) {
      const c = crossed(k, C_MAX, A_MAX, cross, 20250907n);
      if (c.n > V_MAX || c.edges.length > E_MAX) continue;
      got.push({ k, c, m: measure(c, false) });
    }
    const rows = got.map(({ k, c, m }) => [
      `병렬 ${k}`,
      num(c.n),
      num(c.edges.length),
      num(m.flow),
      num(m.rounds),
      num(m.ops),
      (m.ops / m.rounds).toFixed(1),
    ]);
    const most = got.reduce((a, b) => (b.m.rounds > a.m.rounds ? b : a));
    const heavy = got.reduce((a, b) => (b.m.ops > a.m.ops ? b : a));
    const pct = ((100 * most.m.rounds) / most.m.flow).toFixed(2);
    return [
      md(
        [
          "입력",
          "정점",
          "간선",
          "최대 유량",
          "라운드",
          "항목 검사",
          "라운드당 항목 검사",
        ],
        rows,
        [1, 2, 3, 4, 5, 6],
      ),
      "",
      `라운드가 가장 많은 입력은 병렬 ${most.k} 이고 ${num(most.m.rounds)} 번이라, 그 입력의 최대 유량 ${num(most.m.flow)} 의 ${pct} % 입니다. 항목 검사가 가장 많은 입력은 병렬 ${heavy.k} 이고 ${num(heavy.m.ops)} 번입니다.`,
    ].join("\n");
  },

  /** `selfcheck` — T7 이 끝난 시점의 잔여와 T8 의 경로. */
  selfcheckNine: () => {
    const i = pushIndex(3);
    const s = S[i] as Step;
    const f = S[i + 1] as Step;
    const rows = WALK.map(([u, v], k) => [
      `${u}→${v}`,
      num(s.res[k] as number),
      `${v}→${u} ${num(s.res[WALK.length + k] as number)}`,
    ]);
    const parts = f.arcs.map(
      (id) => `${arcName(WALK, id)} ${num(costOf(WALK, id))}`,
    );
    const lastPart = num(costOf(WALK, f.arcs.at(-1) as number));
    const t = tOf(i + 1);
    return [
      md(["간선", "정방향 잔여", "역방향 잔여"], rows, [1]),
      "",
      `${t}${이가(t)} 고른 증가 경로는 ${route(f.path)} 이고 항목마다 ${parts.join(" · ")}${josa(lastPart, "이라", "라")} 경로 비용이 ${num(f.pathCost)} 입니다.`,
    ].join("\n");
  },
};
