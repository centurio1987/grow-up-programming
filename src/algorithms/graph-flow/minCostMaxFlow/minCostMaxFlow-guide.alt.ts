/**
 * `purpose.alt` 가 인용하는 수치의 출처 — L13.
 *
 * **같은 입력·같은 잣대**에 두 설계를 걸고 **결정론적 계수**만 센다. 벽시계·처리량은 실행마다
 * 달라 "본문의 수치가 실측과 일치하는가"(P10)를 정의할 수 없다.
 *
 *   bun run tools/bench-alt.ts src/algorithms/graph-flow/minCostMaxFlow/minCostMaxFlow-guide.alt.ts
 *
 * **두 설계가 같은 자료구조를 쓴다.** 둘 다 잔여 그래프를 `Arc` 인접 목록 하나로 담고, 둘 다
 * 우선순위 큐를 안 쓴다. 자료구조가 다르면 계수가 절차가 아니라 자료구조를 재게 된다
 * (2026-09-06 배치8 실측이 세운 규칙).
 *
 * **전개 입력을 그대로 쓰지 않은 이유**(L20). 전개 그래프는 정점 넷 · 간선 다섯이라 두 설계의
 * 기본 연산이 62 대 113 으로 갈리는데, **가로지르는 간선을 넣을 자리가 없어** 우열이 뒤집히는
 * 자리를 만들 수 없다. 전개 입력의 값도 함께 내고(`전개 입력 · …`), 뒤집히는 자리를 보이는
 * 데는 아래 `shape` 를 쓴다. 그 사유를 본문 대조 문단에도 적는다.
 *
 * **입력은 생성식으로 고정한다.** 소스에서 갈라지는 병렬 경로 `PATHS` = 16 개
 * (`소스 → A_i → B_i → 싱크`)를 세우고, 본 경로의 용량을 `CAP` = 64 · 단위 비용을
 * `0 ≤ a ≤ COST_MAX`(= 20)의 정수로 둔다. 여기에 **가로지르는 간선** `A_i → B_j`(`i ≠ j`)를
 * 용량 1 로 `cross` 개 넣는다. 어느 짝을 넣을지는 고정 난수열이 정하고, 씨앗은 `SEED` 다.
 * 한 번 정한 입력은 수치가 마음에 안 든다는 이유로 바꾸지 않는다(L20).
 *
 * **`cross` 가 갈림의 축이다.** 0 이면 경로끼리 아무 관계가 없어 어느 설계든 할 일이 정해져
 * 있고, 늘릴수록 ① 이 가이드의 절차는 라운드가 늘고 ② 경쟁 설계는 처음 만든 최대 유량이
 * 최소 비용에서 멀어져 소거 라운드가 늘어난다. 둘이 서로 다른 속도로 늘어서 순서가 두 번
 * 뒤집힌다.
 */

import { type FlowEdge, minCostMaxFlow } from "./minCostMaxFlow-guide.ref.ts";

/* ────────────────────────── 고정 입력 ────────────────────────── */

/** 본문 전개가 쓰는 네트워크. 정점 넷 · 간선 다섯. */
export const WALK_N = 4;
export const WALK_SOURCE = 0;
export const WALK_SINK = 3;
export const WALK_EDGES: FlowEdge[] = [
  [0, 1, 3, 1],
  [0, 2, 3, 4],
  [1, 2, 2, 1],
  [1, 3, 3, 6],
  [2, 3, 4, 1],
];

/** 대조용 네트워크의 상수. */
export const PATHS = 16;
export const CAP = 64;
export const COST_MAX = 20;
export const SEED = 20250907n;

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

/**
 * 병렬 경로 `PATHS` 개에 가로지르는 간선 `cross` 개를 얹은 네트워크.
 *
 * 정점 번호는 소스 0 · 싱크 1 · `A_i` 는 `2 + i` · `B_i` 는 `2 + PATHS + i` 다.
 */
export function shape(cross: number): {
  n: number;
  edges: FlowEdge[];
  source: number;
  sink: number;
} {
  const next = stream(SEED);
  const n = 2 + 2 * PATHS;
  const A = (i: number): number => 2 + i;
  const B = (i: number): number => 2 + PATHS + i;
  const edges: FlowEdge[] = [];
  for (let i = 0; i < PATHS; i++) {
    edges.push([0, A(i), CAP, 0]);
    edges.push([A(i), B(i), CAP, next() % (COST_MAX + 1)]);
    edges.push([B(i), 1, CAP, 0]);
  }
  const taken = new Set<string>();
  let made = 0;
  for (let tries = 0; tries < 50 * cross && made < cross; tries++) {
    const i = next() % PATHS;
    const j = next() % PATHS;
    if (i === j) continue;
    const key = `${i},${j}`;
    if (taken.has(key)) continue;
    taken.add(key);
    edges.push([A(i), B(j), 1, next() % (COST_MAX + 1)]);
    made++;
  }
  return { n, edges, source: 0, sink: 1 };
}

/* ────────────────────────── 잣대 ────────────────────────── */

interface Arc {
  to: number;
  cap: number;
  cost: number;
  rev: number;
}

interface Count {
  flow: number;
  cost: number;
  ops: number;
  cells: number;
  rounds: number;
  /** 유량을 늘린 라운드. 소거 설계는 여기에 사이클을 없앤 라운드가 따로 붙는다. */
  augments: number;
  /** 사이클을 없앤 라운드. 이 가이드의 절차에는 그런 라운드가 없어 늘 0 이다. */
  cancels: number;
}

const INF = Number.POSITIVE_INFINITY;

/** 잔여 그래프를 만든다. 두 설계가 같은 것을 쓴다. */
function residual(n: number, edges: FlowEdge[]): Arc[][] {
  const graph: Arc[][] = Array.from({ length: n }, () => []);
  for (const [u, v, cap, cost] of edges) {
    const from = graph[u] as Arc[];
    const to = graph[v] as Arc[];
    from.push({ to: v, cap, cost, rev: to.length });
    to.push({ to: u, cap: 0, cost: -cost, rev: from.length - 1 });
  }
  return graph;
}

/** 정방향 항목이 놓인 자리. 총비용을 되세는 데 쓴다. */
function forwardSlots(n: number, edges: FlowEdge[]): number[] {
  const used = Array.from({ length: n }, () => 0);
  const slot: number[] = [];
  for (const [u, v] of edges) {
    slot.push(used[u] as number);
    used[u] = (used[u] as number) + 1;
    used[v] = (used[v] as number) + 1;
  }
  return slot;
}

/** 잔여 그래프에서 총비용을 되센다. (처음 용량 − 지금 잔여) × 단위 비용의 합이다. */
function totalCost(n: number, edges: FlowEdge[], graph: Arc[][]): number {
  const slot = forwardSlots(n, edges);
  let sum = 0;
  edges.forEach(([u, , cap, cost], k) => {
    const arcs = graph[u] as Arc[];
    sum += (cap - (arcs[slot[k] as number] as Arc).cap) * cost;
  });
  return sum;
}

/**
 * 이 가이드의 절차. 정본(`minCostMaxFlow-guide.ref.ts`)과 같고 세는 자리만 덧붙였다.
 *
 * `기본 연산` 은 **잔여 항목 하나를 견준 것**과 **경로를 따라 항목 하나를 읽거나 고친 것**을
 * 각각 하나로 센다. `저장 칸` 은 라운드가 쓰는 배열 넷(`dist`·`waiting`·`fromV`·`fromE`)의
 * `4V` 칸과 완화 큐가 가장 길어졌을 때의 길이를 더한 것이다.
 */
function 이가이드의절차(
  n: number,
  edges: FlowEdge[],
  s: number,
  t: number,
): Count {
  const graph = residual(n, edges);
  let flow = 0;
  let cost = 0;
  let ops = 0;
  let cells = 0;
  let rounds = 0;
  for (;;) {
    const dist = Array.from({ length: n }, () => INF);
    const waiting = Array.from({ length: n }, () => false);
    const fromV = Array.from({ length: n }, () => -1);
    const fromE = Array.from({ length: n }, () => -1);
    dist[s] = 0;
    const queue: number[] = [s];
    waiting[s] = true;
    let peak = 1;
    while (queue.length > 0) {
      peak = Math.max(peak, queue.length);
      const u = queue.shift() as number;
      waiting[u] = false;
      const arcs = graph[u] as Arc[];
      for (let i = 0; i < arcs.length; i++) {
        const arc = arcs[i] as Arc;
        ops++;
        if (
          arc.cap > 0 &&
          (dist[u] as number) + arc.cost < (dist[arc.to] as number)
        ) {
          dist[arc.to] = (dist[u] as number) + arc.cost;
          fromV[arc.to] = u;
          fromE[arc.to] = i;
          if (!waiting[arc.to]) {
            queue.push(arc.to);
            waiting[arc.to] = true;
          }
        }
      }
    }
    cells = Math.max(cells, 4 * n + peak);
    if ((dist[t] as number) === INF) break;
    rounds++;
    let push = INF;
    for (let v = t; v !== s; v = fromV[v] as number) {
      ops++;
      const arcs = graph[fromV[v] as number] as Arc[];
      push = Math.min(push, (arcs[fromE[v] as number] as Arc).cap);
    }
    for (let v = t; v !== s; v = fromV[v] as number) {
      ops++;
      const arcs = graph[fromV[v] as number] as Arc[];
      const arc = arcs[fromE[v] as number] as Arc;
      arc.cap -= push;
      ((graph[v] as Arc[])[arc.rev] as Arc).cap += push;
    }
    flow += push;
    cost += push * (dist[t] as number);
  }
  return { flow, cost, ops, cells, rounds, augments: rounds, cancels: 0 };
}

/**
 * 경쟁 설계 — **음수 사이클 소거**(클라인). 두 단계로 나뉜다.
 *
 * ① 단위 비용을 아예 안 보고 너비 우선 탐색으로 최대 유량을 만든다. ② 그다음 잔여 그래프에서
 * **단위 비용 합이 음수인 사이클**을 찾아 그 사이클로 병목만큼 보낸다. 사이클 하나를 없앨
 * 때마다 총비용이 그 사이클의 비용 합만큼 줄고, 음수 사이클이 하나도 없으면 그 유량은 그
 * 값에서 최소 비용이다.
 *
 * 잣대는 위와 같다 — 잔여 항목 하나를 견준 것과 경로·사이클을 따라 항목 하나를 읽거나 고친
 * 것을 각각 하나로 센다. `저장 칸` 은 배열 셋(`fromV`·`fromE`·`seen` 또는 `dist`)의 `3V` 칸과
 * 큐가 가장 길어졌을 때의 길이를 더한 것이다.
 */
function 음수사이클소거(
  n: number,
  edges: FlowEdge[],
  s: number,
  t: number,
): Count {
  const graph = residual(n, edges);
  let flow = 0;
  let ops = 0;
  let cells = 0;
  let rounds = 0;
  let augments = 0;
  let cancels = 0;

  for (;;) {
    const fromV = Array.from({ length: n }, () => -1);
    const fromE = Array.from({ length: n }, () => -1);
    const seen = Array.from({ length: n }, () => false);
    seen[s] = true;
    const queue: number[] = [s];
    let peak = 1;
    while (queue.length > 0) {
      peak = Math.max(peak, queue.length);
      const u = queue.shift() as number;
      const arcs = graph[u] as Arc[];
      for (let i = 0; i < arcs.length; i++) {
        const arc = arcs[i] as Arc;
        ops++;
        if (arc.cap > 0 && !seen[arc.to]) {
          seen[arc.to] = true;
          fromV[arc.to] = u;
          fromE[arc.to] = i;
          queue.push(arc.to);
        }
      }
    }
    cells = Math.max(cells, 3 * n + peak);
    if (!seen[t]) break;
    rounds++;
    augments++;
    let push = INF;
    for (let v = t; v !== s; v = fromV[v] as number) {
      ops++;
      const arcs = graph[fromV[v] as number] as Arc[];
      push = Math.min(push, (arcs[fromE[v] as number] as Arc).cap);
    }
    for (let v = t; v !== s; v = fromV[v] as number) {
      ops++;
      const arcs = graph[fromV[v] as number] as Arc[];
      const arc = arcs[fromE[v] as number] as Arc;
      arc.cap -= push;
      ((graph[v] as Arc[])[arc.rev] as Arc).cap += push;
    }
    flow += push;
  }

  for (;;) {
    const dist = Array.from({ length: n }, () => 0);
    const fromV = Array.from({ length: n }, () => -1);
    const fromE = Array.from({ length: n }, () => -1);
    let touched = -1;
    for (let pass = 0; pass < n; pass++) {
      touched = -1;
      for (let u = 0; u < n; u++) {
        const arcs = graph[u] as Arc[];
        for (let i = 0; i < arcs.length; i++) {
          const arc = arcs[i] as Arc;
          ops++;
          if (
            arc.cap > 0 &&
            (dist[u] as number) + arc.cost < (dist[arc.to] as number)
          ) {
            dist[arc.to] = (dist[u] as number) + arc.cost;
            fromV[arc.to] = u;
            fromE[arc.to] = i;
            touched = arc.to;
          }
        }
      }
      if (touched < 0) break;
    }
    cells = Math.max(cells, 3 * n);
    if (touched < 0) break;
    rounds++;
    cancels++;
    let at = touched;
    for (let step = 0; step < n; step++) {
      ops++;
      at = fromV[at] as number;
    }
    const cycle: number[] = [];
    let walk = at;
    do {
      ops++;
      cycle.push(walk);
      walk = fromV[walk] as number;
    } while (walk !== at);
    let push = INF;
    for (const v of cycle) {
      ops++;
      const arcs = graph[fromV[v] as number] as Arc[];
      push = Math.min(push, (arcs[fromE[v] as number] as Arc).cap);
    }
    for (const v of cycle) {
      ops++;
      const arcs = graph[fromV[v] as number] as Arc[];
      const arc = arcs[fromE[v] as number] as Arc;
      arc.cap -= push;
      ((graph[v] as Arc[])[arc.rev] as Arc).cap += push;
    }
  }

  return {
    flow,
    cost: totalCost(n, edges, graph),
    ops,
    cells,
    rounds,
    augments,
    cancels,
  };
}

/**
 * 두 설계가 **정본과 같은 답**을 내는지 매번 확인한다.
 *
 * 답이 다른 구현으로 잰 계수는 저울질이 아니라 다른 문제의 값이다(2026-09-03 `digitDp` 실측이
 * 세운 규칙). 그래서 계수를 낼 때마다 정본을 함께 돌려 견준다.
 */
function measure(
  run: (n: number, e: FlowEdge[], s: number, t: number) => Count,
  n: number,
  edges: FlowEdge[],
  source: number,
  sink: number,
): Count {
  const got = run(n, edges, source, sink);
  const want = minCostMaxFlow(n, edges, source, sink);
  if (got.flow !== want.flow || got.cost !== want.cost) {
    throw new Error(
      `정본과 다른 답을 냈다 — { flow: ${got.flow}, cost: ${got.cost} } vs { flow: ${want.flow}, cost: ${want.cost} }`,
    );
  }
  return got;
}

/* ────────────────────────── 경계 ────────────────────────── */

/** 훑는 범위. `cross` 를 0 부터 이 값까지 하나씩 올려 본다. */
export const SWEEP_TO = 40;

function opsAt(cross: number): [number, number] {
  const { n, edges, source, sink } = shape(cross);
  return [
    measure(이가이드의절차, n, edges, source, sink).ops,
    measure(음수사이클소거, n, edges, source, sink).ops,
  ];
}

/** 소거가 **처음 앞서는** 가로 간선 수. */
export function firstFlip(): number {
  for (let cross = 0; cross <= SWEEP_TO; cross++) {
    const [mine, rival] = opsAt(cross);
    if (rival < mine) return cross;
  }
  return -1;
}

/** 소거가 **마지막으로 앞서는** 가로 간선 수. 그다음 자리에서 순서가 되돌아온다. */
export function lastFlip(): number {
  let last = -1;
  for (let cross = 0; cross <= SWEEP_TO; cross++) {
    const [mine, rival] = opsAt(cross);
    if (rival < mine) last = cross;
  }
  return last;
}

const FIRST = firstFlip();
const LAST = lastFlip();
if (FIRST < 0 || LAST < 0 || LAST >= SWEEP_TO) {
  throw new Error(
    `가로 간선 0~${SWEEP_TO} 를 훑어도 순서가 두 번 뒤집히지 않는다 — 대조가 성립하지 않는다`,
  );
}

/** 대조 문단이 인용하는 자리들. 경계 둘은 실측이 정하고 나머지는 양 끝이다. */
const SPOTS = [0, FIRST - 1, FIRST, LAST, LAST + 1, 180];

function 재기(
  run: (n: number, e: FlowEdge[], s: number, t: number) => Count,
): Record<string, number> {
  const walk = measure(run, WALK_N, WALK_EDGES, WALK_SOURCE, WALK_SINK);
  const out: Record<string, number> = {
    "전개 입력 · 기본 연산": walk.ops,
    "전개 입력 · 저장 칸": walk.cells,
  };
  for (const cross of SPOTS) {
    const { n, edges, source, sink } = shape(cross);
    const got = measure(run, n, edges, source, sink);
    out[`가로 간선 ${cross} · 기본 연산`] = got.ops;
    out[`가로 간선 ${cross} · 라운드`] = got.rounds;
    out[`가로 간선 ${cross} · 사이클을 없앤 라운드`] = got.cancels;
  }
  const big = shape(180);
  out["가로 간선 180 · 저장 칸"] = measure(
    run,
    big.n,
    big.edges,
    big.source,
    big.sink,
  ).cells;
  return out;
}

export const cases = {
  "이 가이드의 절차": () => 재기(이가이드의절차),
  "음수 사이클 소거": () => 재기(음수사이클소거),
  경계: () => ({
    "소거가 처음 앞서는 가로 간선 수": FIRST,
    "소거가 마지막으로 앞서는 가로 간선 수": LAST,
  }),
};
