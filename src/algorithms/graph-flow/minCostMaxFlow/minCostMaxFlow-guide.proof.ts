/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run ../../../../tools/check-proof.ts minCostMaxFlow-guide.md
 *
 * **변이가 아무것도 안 바꾸는지를 검사하는 자리는 중화 실행을 피해 간다.** `check-proof` 가
 * 이 파일을 한 번 더 부를 때는 `loadMutant` 이 정본을 그대로 돌려주므로(중화), 그 상태에서
 * 「변이가 답을 안 바꿨다」로 던지면 중화 대조 자체가 실행되지 않는다. 중화 여부는 변이
 * 모듈의 함수가 정본과 **같은 객체인가**로 값에서 알아낸다.
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { type FlowEdge, minCostMaxFlow } from "./minCostMaxFlow-guide.ref.ts";

/* ────────────────────────── 표 그리기 ────────────────────────── */

/**
 * 화면에 찍히는 폭. **CJK 를 2 칸으로 센다.**
 *
 * `tools/check-v2.ts` 의 `displayWidth` 와 같은 규칙이다 — 다른 규칙으로 그리면 그 스캐너의
 * 열 정렬 판정(P15)과 이 파일이 어긋난다.
 */
const width = (s: string): number => {
  let n = 0;
  for (const ch of s) {
    const c = ch.codePointAt(0) ?? 0;
    n +=
      (c >= 0x1100 && c <= 0x115f) ||
      (c >= 0x2e80 && c <= 0xa4cf && c !== 0x303f) ||
      (c >= 0xac00 && c <= 0xd7a3) ||
      (c >= 0xf900 && c <= 0xfaff) ||
      (c >= 0xfe30 && c <= 0xfe6f) ||
      (c >= 0xff00 && c <= 0xff60) ||
      (c >= 0xffe0 && c <= 0xffe6) ||
      (c >= 0x20000 && c <= 0x3fffd)
        ? 2
        : 1;
  }
  return n;
};

const padRight = (s: string, to: number): string =>
  s + " ".repeat(Math.max(0, to - width(s)));

const padLeft = (s: string, to: number): string =>
  " ".repeat(Math.max(0, to - width(s))) + s;

/** 천 단위 구분. 본문 표기와 같다. */
const num = (n: number): string =>
  n === Number.POSITIVE_INFINITY ? "∞" : (n + 0).toLocaleString("en-US");

/**
 * 조사를 값에서 고른다. **앞 공백을 포함해 돌려준다** — 이 저장소의 표기는 `9 를` 이지
 * `9를` 이 아니다. 손으로 적으면 값이 바뀔 때 조사만 남아 어긋난다.
 */
const withBatchim = (text: string): boolean =>
  "013678".includes(text.replace(/[^0-9]/g, "").slice(-1));

/** 「…을」과 「…를」. 마지막 숫자의 우리말 읽기에 받침이 있으면 「을」이다. */
const eul = (text: string): string =>
  `${text} ${withBatchim(text) ? "을" : "를"}`;

/** 「…이」와 「…가」. */
const iga = (text: string): string =>
  `${text} ${withBatchim(text) ? "이" : "가"}`;

/** 「…이다」와 「…다」. */
const ida = (text: string): string =>
  `${text} ${withBatchim(text) ? "이다" : "다"}`;

/** 「…과」와 「…와」. */
const wa = (text: string): string =>
  `${text} ${withBatchim(text) ? "과" : "와"}`;

/**
 * 「…으로」와 「…로」.
 *
 * 받침이 없거나 받침이 `ㄹ` 이면 「로」다 — 1 일 · 7 칠 · 8 팔이 `ㄹ` 로 끝나므로 「으로」 쪽은
 * 0 영 · 3 삼 · 6 육 셋뿐이다.
 */
const ro = (text: string): string => {
  const last = text.replace(/[^0-9]/g, "").slice(-1);
  return `${text} ${"036".includes(last) ? "으로" : "로"}`;
};

/**
 * 열 폭을 값에서 계산해 표를 그린다. 폭을 리터럴로 박으면 값이 바뀌어도 표가 그대로라
 * 어긋난 자리를 아무도 못 본다.
 */
function table(head: string[], rows: string[][], align: ("l" | "r")[]): string {
  const cols = head.length;
  const w = Array.from({ length: cols }, (_, c) =>
    Math.max(width(head[c] ?? ""), ...rows.map((r) => width(r[c] ?? ""))),
  );
  const line = (cells: string[]): string =>
    cells
      .map((cell, c) =>
        align[c] === "r" ? padLeft(cell, w[c] ?? 0) : padRight(cell, w[c] ?? 0),
      )
      .join("  ")
      .replace(/\s+$/, "");
  return [line(head), ...rows.map(line)].join("\n");
}

/* ────────────────────────── 고정 입력 ────────────────────────── */

const INF = Number.POSITIVE_INFINITY;

/**
 * 본문 전개가 쓰는 네트워크 — 정점 넷 · 방향 간선 다섯.
 *
 * 이 다섯이면 코드의 갈래 여섯이 한 번씩 다 실행된다. 병목이 2 인 라운드와 1 인 라운드가
 * 둘씩 있고, **역방향 항목을 지나는 라운드가 하나** 있으며, 마지막 라운드가 경로를 못 찾아
 * 반복을 끝낸다. 최대 유량 6 을 만드는 유량 함수가 둘이라 「최대 유량이 같은데 총비용이
 * 갈린다」도 이 입력 하나에서 보인다.
 */
const WALK: FlowEdge[] = [
  [0, 1, 3, 1],
  [0, 2, 3, 4],
  [1, 2, 2, 1],
  [1, 3, 3, 6],
  [2, 3, 4, 1],
];
const WALK_N = 4;
const WALK_SOURCE = 0;
const WALK_SINK = 3;

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

/** 소스와 싱크를 잇는 간선 하나. */
const SINGLE: FlowEdge[] = [[0, 1, 7, 3]];

/** 단위 비용이 작은 좁은 경로와 큰 넓은 경로. */
const TWO_WAY: FlowEdge[] = [
  [0, 1, 1, 1],
  [1, 3, 1, 1],
  [0, 2, 2, 5],
  [2, 3, 2, 5],
];

/** 직렬로 이어진 두 간선. */
const SERIAL: FlowEdge[] = [
  [0, 1, 5, 2],
  [1, 2, 5, 3],
];

interface Case {
  label: string;
  n: number;
  edges: FlowEdge[];
  source: number;
  sink: number;
}

const WALK_CASE: Case = {
  label: "전개 입력",
  n: WALK_N,
  edges: WALK,
  source: WALK_SOURCE,
  sink: WALK_SINK,
};
const DETOUR_CASE: Case = {
  label: "역방향 항목이 꼭 필요한 넷",
  n: 4,
  edges: DETOUR,
  source: 0,
  sink: 3,
};
const TRAP_CASE: Case = {
  label: "정점 다섯 · 용량이 전부 1",
  n: 5,
  edges: DIJKSTRA_TRAP,
  source: 0,
  sink: 4,
};
const SINGLE_CASE: Case = {
  label: "간선 하나",
  n: 2,
  edges: SINGLE,
  source: 0,
  sink: 1,
};
const TWO_WAY_CASE: Case = {
  label: "좁고 단위 비용이 작은 경로와 넓고 큰 경로",
  n: 4,
  edges: TWO_WAY,
  source: 0,
  sink: 3,
};
const SERIAL_CASE: Case = {
  label: "직렬 경로 둘",
  n: 3,
  edges: SERIAL,
  source: 0,
  sink: 2,
};

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

/** 왼쪽 `L` 명과 오른쪽 `R` 자리를 잇는 배정 네트워크. */
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

/* ────────────────────────── 계측 ────────────────────────── */

interface Arc {
  to: number;
  cap: number;
  cost: number;
  rev: number;
}

interface Step {
  t: string;
  kind: string;
  dist: string;
  path: string;
  unit: string;
  delta: string;
  resid: string;
  total: string;
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
}

type Engine = "relax" | "dijkstra";
type Order = "cheapest" | "any";

/**
 * 잔여 그래프를 만든다. 정본과 같은 모양이다.
 *
 * `sameSign` 이 참이면 역방향 항목의 단위 비용을 원래 비용과 **같은 부호**로 둔다 — 그 판이
 * 어느 라운드에서 갈리는지를 보이는 자리에서만 쓴다.
 */
function residual(n: number, edges: FlowEdge[], sameSign = false): Arc[][] {
  const graph: Arc[][] = Array.from({ length: n }, () => []);
  for (const [u, v, cap, cost] of edges) {
    const from = graph[u] as Arc[];
    const to = graph[v] as Arc[];
    from.push({ to: v, cap, cost, rev: to.length });
    to.push({
      to: u,
      cap: 0,
      cost: sameSign ? cost : -cost,
      rev: from.length - 1,
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
 * 정본과 같은 절차를 걸음마다 기록하며 실행한다.
 *
 * **불변식을 표에 손으로 적지 않는다** — `negCycleRounds` 가 「잔여 그래프에 음수 사이클이
 * 있던 라운드 수」이고 `badReduced` 가 「증가시킨 뒤 환산 비용이 음수인 항목 수」다. 둘 다
 * 실행이 세서 돌려준다.
 *
 * `opt` 셋은 변이·다른 설계를 **같은 자료구조로** 재기 위한 것이다.
 *
 * - `engine: "dijkstra"` — 값이 가장 작은 정점을 꺼내고 한 번 꺼낸 정점은 다시 안 보는 판
 * - `order: "any"` — 단위 비용을 안 보고 잔여 용량이 있는 아무 경로나 고르는 판
 * - `unitPush` — 병목을 그대로 안 쓰고 한 단위씩만 보내는 판
 */
function runCounted(
  n: number,
  edges: FlowEdge[],
  source: number,
  sink: number,
  keep: Step[] | null = null,
  opt: {
    engine?: Engine;
    order?: Order;
    unitPush?: boolean;
    sameSign?: boolean;
  } = {},
): Counted {
  const graph = residual(n, edges, opt.sameSign === true);
  const slot = forwardSlots(n, edges);
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
  };
  const residStr = (): string =>
    slot.map(([u, i]) => (graph[u] as Arc[])[i]?.cap ?? 0).join(" ");
  if (keep !== null) {
    keep.push({
      t: `T${keep.length + 1}`,
      kind: "잔여 그래프를 만든다",
      dist: "—",
      path: "—",
      unit: "—",
      delta: "—",
      resid: residStr(),
      total: `${c.flow} / ${c.cost}`,
    });
  }

  for (;;) {
    if (hasNegativeCycle(n, graph)) c.negCycleRounds++;
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
            dist[arc.to] = 0;
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

    c.rounds++;
    let push = INF;
    let unit = 0;
    let reverse = false;
    const names: string[] = [];
    for (let v = sink; v !== source; v = fromV[v] as number) {
      const arcs = graph[fromV[v] as number] as Arc[];
      const arc = arcs[fromE[v] as number] as Arc;
      c.ops++;
      push = Math.min(push, arc.cap);
      unit += arc.cost;
      if (arc.cost < 0) reverse = true;
      names.unshift(`${fromV[v]}→${v}`);
    }
    if (opt.unitPush === true) push = Math.min(push, 1);
    if (reverse) c.usedReverse++;
    const distStr = `[${dist
      .map((d) => (d === INF ? "∞" : String(d)))
      .join(", ")}]`;
    if (keep !== null) {
      keep.push({
        t: `T${keep.length + 1}`,
        kind: `라운드 ${c.rounds} 경로를 찾는다`,
        dist: distStr,
        path: names.join(" "),
        unit: String(unit),
        delta: "—",
        resid: residStr(),
        total: `${c.flow} / ${c.cost}`,
      });
    }
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
    c.paths.push(names.join(" "));

    if (opt.engine === undefined && opt.order === undefined) {
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

    if (keep !== null) {
      keep.push({
        t: `T${keep.length + 1}`,
        kind: `라운드 ${c.rounds} 병목만큼 보낸다`,
        dist: distStr,
        path: names.join(" "),
        unit: String(unit),
        delta: String(push),
        resid: residStr(),
        total: `${c.flow} / ${c.cost}`,
      });
    }
    if (c.rounds > 20000) break;
  }

  if (keep !== null) {
    const dead = Array.from({ length: n }, (_, v) =>
      v === source ? "0" : "∞",
    );
    keep.push({
      t: `T${keep.length + 1}`,
      kind: `라운드 ${c.rounds + 1} 경로가 없어 끝낸다`,
      dist: `[${dead.join(", ")}]`,
      path: "없음",
      unit: "—",
      delta: "—",
      resid: residStr(),
      total: `${c.flow} / ${c.cost}`,
    });
  }
  return c;
}

/** 정방향 항목이 놓인 자리. */
function forwardSlots(n: number, edges: FlowEdge[]): [number, number][] {
  const used = Array.from({ length: n }, () => 0);
  const slot: [number, number][] = [];
  for (const [u, v] of edges) {
    slot.push([u, used[u] as number]);
    used[u] = (used[u] as number) + 1;
    used[v] = (used[v] as number) + 1;
  }
  return slot;
}

/** 계측본이 정본과 같은 답을 내는지 확인하고 계수를 돌려준다. */
function measure(
  n: number,
  edges: FlowEdge[],
  source: number,
  sink: number,
  keep: Step[] | null = null,
): Counted {
  const got = runCounted(n, edges, source, sink, keep);
  const want = minCostMaxFlow(n, edges, source, sink);
  if (got.flow !== want.flow || got.cost !== want.cost) {
    throw new Error(
      `계측본이 정본과 다른 답을 냈다 — { flow: ${got.flow}, cost: ${got.cost} } vs { flow: ${want.flow}, cost: ${want.cost} }`,
    );
  }
  return got;
}

/* ────────────────────── 유량 함수 전수 열거 ────────────────────── */

interface Enumerated {
  total: number;
  maxValue: number;
  byValue: Map<number, number[]>;
}

/**
 * 보존 조건을 지키는 정수 유량을 **전부** 만든다.
 *
 * 손으로 적은 전수 열거는 원소를 빠뜨린다(2026-09-03 `palindromePartitioningMinCut` 실측).
 * 그래서 세는 일을 실행에 맡긴다. 간선마다 0 부터 용량까지를 다 넣어 보므로 작은 입력에만
 * 쓴다.
 */
function enumerateFlows(
  n: number,
  edges: FlowEdge[],
  source: number,
  sink: number,
): Enumerated {
  const f = Array.from({ length: edges.length }, () => 0);
  const byValue = new Map<number, number[]>();
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
      return;
    }
    for (let x = 0; x <= (edges[i] as FlowEdge)[2]; x++) {
      f[i] = x;
      walk(i + 1);
    }
    f[i] = 0;
  };
  walk(0);
  return { total, maxValue, byValue };
}

/** 유량 값마다의 최소 총비용. 값이 안 나오는 자리는 없다. */
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
const samSign = await loadMutant<Impl>(REF, {
  swap: [
    REVERSE_LINE,
    "    to.push({ to: u, cap: 0, cost: cost, rev: from.length - 1 });",
  ],
});

/** 병목을 그대로 안 쓰고 한 단위씩만 보내는 사본. */
const unitPush = await loadMutant<Impl>(REF, {
  swap: [PUSH_LINE, "    let push = 1;"],
});

/** 누적 총비용에 병목을 안 곱하는 사본. 라운드마다 한 단위 값만 더한다. */
const noTimes = await loadMutant<Impl>(REF, {
  swap: [COST_LINE, "    cost += (dist[sink] as number);"],
});

/**
 * 중화 실행인가 — `loadMutant` 이 변이를 적용하지 않고 정본 모듈을 그대로 돌려주면 두
 * 함수가 **같은 객체**다. 중화 상태에서 아래 검사를 실행하면 언제나 던지게 되고, 그러면
 * `check-proof` 의 중화 대조가 이 편에서는 실행되지 않는다.
 */
const 중화됨 = samSign.minCostMaxFlow === minCostMaxFlow;

if (!중화됨) {
  const breaking: [string, Impl, Case[]][] = [
    ["역방향 항목을 같은 부호로 둔", samSign, [WALK_CASE, DETOUR_CASE]],
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

/** 정본과 변이의 답을 나란히 놓은 표. */
function contrast(cases: Case[], impl: Impl, head: string): string {
  const rows = cases.map((c) => {
    const want = minCostMaxFlow(c.n, c.edges, c.source, c.sink);
    const got = impl.minCostMaxFlow(c.n, c.edges, c.source, c.sink);
    return [
      c.label,
      num(c.n),
      `${want.flow} / ${want.cost}`,
      `${got.flow} / ${got.cost}`,
      want.flow === got.flow && want.cost === got.cost ? "같다" : "어긋난다",
    ];
  });
  return table(["배치", "정점", "정본 유량 / 총비용", head, "대조"], rows, [
    "l",
    "r",
    "r",
    "r",
    "l",
  ]);
}

/* ────────────────────────── 블록 ────────────────────────── */

const WALK_STEPS: Step[] = [];
const WALK_COUNT = measure(WALK_N, WALK, WALK_SOURCE, WALK_SINK, WALK_STEPS);
const WALK_ENUM = enumerateFlows(WALK_N, WALK, WALK_SOURCE, WALK_SINK);
const WALK_BEST = bestByValue(WALK_ENUM);

const ALL_CASES: Case[] = [
  WALK_CASE,
  DETOUR_CASE,
  TRAP_CASE,
  TWO_WAY_CASE,
  SERIAL_CASE,
  SINGLE_CASE,
];

export const PROOFS: Record<string, () => string> = {
  /** `concept` — 최대 유량이 같아도 총비용이 갈린다. */
  "concept-split": () => {
    const best = Math.min(...(WALK_ENUM.byValue.get(WALK_ENUM.maxValue) ?? []));
    const worst = Math.max(
      ...(WALK_ENUM.byValue.get(WALK_ENUM.maxValue) ?? []),
    );
    const rows = [...WALK_ENUM.byValue.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([value, costs]) => [
        num(value),
        num(costs.length),
        num(Math.min(...costs)),
        num(Math.max(...costs)),
      ]);
    const answer = minCostMaxFlow(WALK_N, WALK, WALK_SOURCE, WALK_SINK);
    return [
      table(
        [
          "유량 값",
          "그 값을 만드는 유량 함수",
          "총비용의 최솟값",
          "총비용의 최댓값",
        ],
        rows,
        ["r", "r", "r", "r"],
      ),
      "",
      `보존 조건을 지키는 유량 함수가 모두 ${num(WALK_ENUM.total)} 개이고 최대 유량은 ${ida(num(WALK_ENUM.maxValue))}`,
      `└ 최대 유량을 만드는 유량 함수는 ${num((WALK_ENUM.byValue.get(WALK_ENUM.maxValue) ?? []).length)} 개인데 총비용이 ${wa(num(best))} ${ro(num(worst))} 갈린다`,
      `└ 정본이 내는 답은 { flow: ${answer.flow}, cost: ${answer.cost} } 로 그중 작은 쪽이다`,
    ].join("\n");
  },

  /** `concept` — 경로를 고르는 순서만 바꿔도 총비용이 갈린다. */
  "concept-order": () => {
    const rows = ALL_CASES.map((c) => {
      const mine = measure(c.n, c.edges, c.source, c.sink);
      const any = runCounted(c.n, c.edges, c.source, c.sink, null, {
        order: "any",
      });
      return [
        c.label,
        num(c.n),
        num(mine.flow),
        num(mine.cost),
        num(any.cost),
        mine.cost === any.cost ? "같다" : "어긋난다",
      ];
    });
    const split = rows.filter((r) => r[5] === "어긋난다").length;
    return [
      table(
        [
          "배치",
          "정점",
          "최대 유량",
          "단위 비용이 작은 경로부터",
          "아무 경로나",
          "대조",
        ],
        rows,
        ["l", "r", "r", "r", "r", "l"],
      ),
      "",
      `배치 ${num(rows.length)} 개 모두 최대 유량은 같고, 총비용이 갈리는 배치가 ${num(split)} 개다`,
      `└ 「아무 경로나」는 단위 비용을 안 보고 잔여 용량이 있는 경로를 너비 우선 탐색으로 고른 판이다`,
      `└ 최대 유량이 같아도 어느 경로 조합으로 만드는가에 따라 총비용이 달라진다`,
    ].join("\n");
  },

  /** `deep.build` ② — 유량 함수를 전부 만들어 보는 방법의 크기. */
  "build-brute": () => {
    const rows: string[][] = [];
    for (const [label, c] of [
      ["간선 하나", SINGLE_CASE],
      ["직렬 경로 둘", SERIAL_CASE],
      ["전개 입력", WALK_CASE],
      ["좁은 경로와 넓은 경로", TWO_WAY_CASE],
    ] as [string, Case][]) {
      const e = enumerateFlows(c.n, c.edges, c.source, c.sink);
      const combos = c.edges.reduce((a, [, , cap]) => a * (cap + 1), 1);
      rows.push([
        label,
        num(c.n),
        num(c.edges.length),
        num(combos),
        num(e.total),
      ]);
    }
    const cap = 10_000;
    const at = 20;
    const huge = BigInt(cap + 1) ** BigInt(at);
    return [
      table(
        [
          "배치",
          "정점",
          "간선",
          "넣어 봐야 하는 조합",
          "보존 조건을 지키는 것",
        ],
        rows,
        ["l", "r", "r", "r", "r"],
      ),
      "",
      `조합 수는 간선마다 (그 간선의 용량 + 1) 을 곱한 값이다 — 0 부터 용량까지를 다 넣어 보기 때문이다`,
      `└ 제약 상한의 용량 ${num(cap)} 에서는 간선 ${num(at)} 개만 있어도 조합의 자릿수가 ${ida(num(huge.toString().length))}`,
      `└ 간선 상한은 ${num(2000)} 개이므로 전부 만들어 보는 방법은 이 문제의 규모에서 끝나지 않는다`,
    ].join("\n");
  },

  /** `deep.build` ④ — 같은 입력을 두 방식으로 처리한 계수. */
  "build-two": () => {
    const mine = measure(WALK_N, WALK, WALK_SOURCE, WALK_SINK);
    const any = runCounted(WALK_N, WALK, WALK_SOURCE, WALK_SINK, null, {
      order: "any",
    });
    const rows = [
      ["최대 유량", num(mine.flow), num(any.flow)],
      ["총비용", num(mine.cost), num(any.cost)],
      ["라운드 수", num(mine.rounds), num(any.rounds)],
      ["잔여 항목을 견준 횟수", num(mine.ops), num(any.ops)],
      [
        "역방향 항목을 지난 라운드",
        num(mine.usedReverse),
        num(any.usedReverse),
      ],
    ];
    return [
      table(["무엇", "단위 비용이 작은 경로부터", "아무 경로나"], rows, [
        "l",
        "r",
        "r",
      ]),
      "",
      table(
        ["방식", "라운드마다의 한 단위 비용"],
        [
          ["단위 비용이 작은 경로부터", mine.unitCosts.join(" ")],
          ["아무 경로나", any.unitCosts.join(" ")],
        ],
        ["l", "l"],
      ),
      "",
      `최대 유량은 두 방식이 ${ro(num(mine.flow))} 같은데 총비용이 ${wa(num(mine.cost))} ${ro(num(any.cost))} 갈린다`,
      `└ 라운드 수도 ${wa(num(mine.rounds))} ${ida(num(any.rounds))}`,
      `└ 앞엣것의 한 단위 비용은 라운드를 지날수록 커지고, 뒤엣것은 그렇지 않다`,
    ].join("\n");
  },

  /** `deep.build` ⑤ — 역방향 항목의 단위 비용을 같은 부호로 두면. */
  "build-sign": () => {
    const cases = [WALK_CASE, DETOUR_CASE, TWO_WAY_CASE, SERIAL_CASE];
    const wrong = cases.filter((c) => {
      const want = minCostMaxFlow(c.n, c.edges, c.source, c.sink);
      const got = samSign.minCostMaxFlow(c.n, c.edges, c.source, c.sink);
      return want.cost !== got.cost || want.flow !== got.flow;
    }).length;
    return [
      contrast(cases, samSign, "같은 부호로 둔 판"),
      "",
      `배치 ${num(cases.length)} 개 중 답이 갈리는 것이 ${num(wrong)} 개다`,
      `└ 되돌리는 항목의 단위 비용이 원래 비용과 같은 부호면 되돌리는 데 다시 값을 치르는 셈이 된다`,
    ].join("\n");
  },

  /** `deep.build` ⑤ — 같은 부호로 둔 판이 어느 라운드에서 갈리는가. */
  "build-sign-why": () => {
    const mine = measure(WALK_N, WALK, WALK_SOURCE, WALK_SINK);
    const bent = runCounted(WALK_N, WALK, WALK_SOURCE, WALK_SINK, null, {
      sameSign: true,
    });
    const rows: string[][] = [];
    const n = Math.max(mine.rounds, bent.rounds);
    for (let i = 0; i < n; i++) {
      rows.push([
        num(i + 1),
        mine.paths[i] ?? "—",
        num(mine.unitCosts[i] ?? 0),
        bent.paths[i] ?? "—",
        num(bent.unitCosts[i] ?? 0),
      ]);
    }
    const off = rows.filter((r) => r[2] !== r[4]).length;
    const gap = bent.cost - mine.cost;
    return [
      table(
        [
          "라운드",
          "정본이 고른 경로",
          "한 단위",
          "같은 부호 판이 고른 경로",
          "한 단위",
        ],
        rows,
        ["r", "l", "r", "l", "r"],
      ),
      "",
      `라운드 ${num(rows.length)} 번 중 한 단위 값이 벌어지는 라운드가 ${num(off)} 번이다`,
      `└ 두 판이 라운드마다 고른 경로는 처음부터 끝까지 한 벌이다`,
      `└ 벌어진 값 ${iga(num(gap))} 총비용 ${wa(num(mine.cost))} ${num(bent.cost)} 의 차이가 된다`,
    ].join("\n");
  },

  /** `deep.build` ⑥ — 유량 값마다의 최소 총비용과 라운드 비용의 대응. */
  "build-marginal": () => {
    const rows: string[][] = [];
    for (let v = 0; v <= WALK_ENUM.maxValue; v++) {
      const now = WALK_BEST[v] as number;
      const before = v === 0 ? 0 : (WALK_BEST[v - 1] as number);
      rows.push([num(v), num(now), v === 0 ? "—" : num(now - before)]);
    }
    const diffs = rows.slice(1).map((r) => r[2] as string);
    const expanded: string[] = [];
    WALK_COUNT.unitCosts.forEach((u, i) => {
      for (let k = 0; k < (WALK_COUNT.bottlenecks[i] as number); k++) {
        expanded.push(num(u));
      }
    });
    return [
      table(
        ["유량 값", "그 값에서의 최소 총비용", "한 단위 더 보내는 값"],
        rows,
        ["r", "r", "r"],
      ),
      "",
      table(
        ["무엇", "값"],
        [
          ["전수 열거가 낸 한 단위씩의 값", diffs.join(" ")],
          ["라운드마다의 한 단위 비용", WALK_COUNT.unitCosts.join(" ")],
          ["라운드마다의 병목", WALK_COUNT.bottlenecks.join(" ")],
          ["병목만큼 펼친 라운드 비용", expanded.join(" ")],
        ],
        ["l", "l"],
      ),
      "",
      `한 단위 더 보내는 값이 ${diffs.join(" ")} 로 한 번도 안 줄어든다`,
      `└ 라운드마다의 한 단위 비용을 병목만큼 펼치면 ${expanded.join(" ")} 로 같은 줄이 된다`,
      `└ 라운드 ${WALK_COUNT.rounds} 번이 유량 ${eul(num(WALK_COUNT.flow))} 만들고 총비용은 ${ida(num(WALK_COUNT.cost))}`,
    ].join("\n");
  },

  /** `deep.walk` 1 — 잔여 그래프를 만든 직후. */
  "walk-init": () => {
    const graph = residual(WALK_N, WALK);
    const rows: string[][] = [];
    for (let u = 0; u < WALK_N; u++) {
      for (const arc of graph[u] as Arc[]) {
        rows.push([
          `${u}→${arc.to}`,
          arc.cost >= 0 ? "정방향" : "역방향",
          num(arc.cap),
          String(arc.cost),
        ]);
      }
    }
    const forward = rows.filter((r) => r[1] === "정방향").length;
    return [
      table(["항목", "어느 쪽", "잔여 용량", "단위 비용"], rows, [
        "l",
        "l",
        "r",
        "r",
      ]),
      "",
      `간선 ${num(WALK.length)} 개가 항목 ${num(rows.length)} 개가 된다 — 정방향 ${forward} 개와 역방향 ${rows.length - forward} 개다`,
      `└ 역방향 항목의 잔여 용량은 처음에 전부 0 이라 어느 경로에도 안 쓰인다`,
      `└ 역방향 항목의 단위 비용은 짝이 되는 정방향 항목의 부호를 바꾼 값이다`,
    ].join("\n");
  },

  /** `deep.walk` 2 — 라운드 1 의 완화 결과. */
  "walk-first": () => {
    const find = WALK_STEPS[1] as Step;
    const send = WALK_STEPS[2] as Step;
    const values = find.dist.slice(1, -1).split(", ");
    return [
      table(
        ["정점", "dist"],
        values.map((d, i) => [num(i), d]),
        ["r", "r"],
      ),
      "",
      table(
        ["무엇", "값"],
        [
          ["고른 경로", find.path],
          ["한 단위의 비용", find.unit],
          ["병목", send.delta],
          ["누적 유량 / 누적 총비용", send.total],
        ],
        ["l", "l"],
      ),
      "",
      `정점 2 의 값이 ${ida(values[2] as string)} — 0→2 로 바로 가면 4 인데 0→1→2 로 가면 그보다 작다`,
      `└ 싱크의 값 ${iga(find.unit)} 이 경로로 한 단위를 보낼 때의 비용이다`,
      `└ 병목은 경로 위 항목의 잔여 용량 중 가장 작은 값이라 ${ida(send.delta)}`,
    ].join("\n");
  },

  /** `deep.walk.pause` — 다익스트라로 바꾸면. */
  "pause-dijkstra": () => {
    const rows = ALL_CASES.map((c) => {
      const mine = measure(c.n, c.edges, c.source, c.sink);
      const dij = runCounted(c.n, c.edges, c.source, c.sink, null, {
        engine: "dijkstra",
      });
      return [
        c.label,
        num(c.n),
        `${mine.flow} / ${mine.cost}`,
        `${dij.flow} / ${dij.cost}`,
        mine.flow === dij.flow && mine.cost === dij.cost ? "같다" : "어긋난다",
      ];
    });
    const off = rows.filter((r) => r[4] === "어긋난다").length;
    return [
      table(
        ["배치", "정점", "정본 유량 / 총비용", "다익스트라로 바꾼 판", "대조"],
        rows,
        ["l", "r", "r", "r", "l"],
      ),
      "",
      `배치 ${num(rows.length)} 개 중 답이 갈리는 것이 ${num(off)} 개다`,
      `└ 갈리는 배치는 하나뿐이고 나머지 ${num(rows.length - off)} 개는 답이 그대로다`,
      `└ 전개 입력도 답이 그대로라, 전개만 따라가면 이 자리를 그냥 지나간다`,
    ].join("\n");
  },

  /** `deep.walk.pause` — 다익스트라가 갈리는 배치에서 무슨 일이 있는가. */
  "pause-dijkstra-why": () => {
    const mine = measure(
      TRAP_CASE.n,
      TRAP_CASE.edges,
      TRAP_CASE.source,
      TRAP_CASE.sink,
    );
    const dij = runCounted(
      TRAP_CASE.n,
      TRAP_CASE.edges,
      TRAP_CASE.source,
      TRAP_CASE.sink,
      null,
      { engine: "dijkstra" },
    );
    const rows = TRAP_CASE.edges.map(([u, v, cap, a]) => [
      `${u}→${v}`,
      num(cap),
      num(a),
    ]);
    return [
      table(["간선", "용량", "단위 비용"], rows, ["l", "r", "r"]),
      "",
      table(
        ["무엇", "정본", "다익스트라로 바꾼 판"],
        [
          ["최대 유량", num(mine.flow), num(dij.flow)],
          ["총비용", num(mine.cost), num(dij.cost)],
          ["라운드 수", num(mine.rounds), num(dij.rounds)],
          [
            "라운드마다의 한 단위 비용",
            mine.unitCosts.join(" "),
            dij.unitCosts.join(" "),
          ],
        ],
        ["l", "r", "r"],
      ),
      "",
      `최대 유량은 두 판이 ${ro(num(mine.flow))} 같은데 총비용이 ${wa(num(mine.cost))} ${ro(num(dij.cost))} 갈린다`,
      `└ 정점 ${num(TRAP_CASE.n)} 개 · 간선 ${num(TRAP_CASE.edges.length)} 개이고 용량이 전부 1 이다`,
      `└ 한 번 꺼낸 정점을 다시 안 보는 것이 갈림의 자리다`,
    ].join("\n");
  },

  /** `deep.walk` 3 — 라운드마다 잔여 용량이 어떻게 바뀌는가. */
  "walk-residual": () => {
    const rows = WALK_STEPS.map((s) => [
      s.t,
      s.path,
      s.delta,
      s.resid,
      s.total.split(" / ")[0] ?? "",
      s.total.split(" / ")[1] ?? "",
    ]);
    return [
      table(
        [
          "걸음",
          "고른 경로",
          "병목",
          "잔여 용량 (0→1,0→2,1→2,1→3,2→3)",
          "누적 유량",
          "누적 총비용",
        ],
        rows,
        ["l", "l", "r", "l", "r", "r"],
      ),
      "",
      `걸음 ${num(rows.length)} 개 · 라운드 ${num(WALK_COUNT.rounds)} 번 · 역방향 항목을 지난 라운드 ${num(WALK_COUNT.usedReverse)} 번`,
      `└ 1→2 의 잔여 용량이 2 에서 0 으로 줄었다가 마지막 라운드에 1 로 늘어난다`,
      `└ 마지막 걸음은 소스에서 나가는 정방향 항목이 다 차서 경로를 못 찾은 자리다`,
    ].join("\n");
  },

  /** `deep.walk.pause` — 최단이 아닌 경로를 고르면 음수 사이클이 생긴다. */
  "pause-any": () => {
    const rows = ALL_CASES.map((c) => {
      const mine = measure(c.n, c.edges, c.source, c.sink);
      const any = runCounted(c.n, c.edges, c.source, c.sink, null, {
        order: "any",
      });
      return [
        c.label,
        num(mine.cost),
        num(any.cost),
        num(mine.negCycleRounds),
        num(any.negCycleRounds),
        mine.cost === any.cost ? "같다" : "어긋난다",
      ];
    });
    const withCycle = rows.filter((r) => r[4] !== "0").length;
    return [
      table(
        [
          "배치",
          "정본 총비용",
          "아무 경로나",
          "정본에서 음수 사이클이 있던 라운드",
          "아무 경로나 판에서",
          "대조",
        ],
        rows,
        ["l", "r", "r", "r", "r", "l"],
      ),
      "",
      `정본은 어느 배치에서도 음수 사이클이 있던 라운드가 0 이고, 아무 경로나 고른 판은 ${num(withCycle)} 개 배치에서 0 이 아니다`,
      `└ 음수 사이클이 남아 있다는 것은 그 사이클을 따라 유량을 보내면 총비용이 더 줄어든다는 뜻이다`,
      `└ 그래서 그 시점의 유량은 그 유량 값에서 최소 비용이 아니다`,
    ].join("\n");
  },

  /** `deep.walk` 4 — 열 걸음 전체. */
  "walk-trace": () => {
    const rows = WALK_STEPS.map((s) => [
      s.t,
      s.kind,
      s.dist,
      s.path,
      s.unit,
      s.delta,
      s.total,
    ]);
    return [
      table(
        [
          "걸음",
          "무엇",
          "dist",
          "고른 경로",
          "한 단위의 비용",
          "병목",
          "누적 유량 / 누적 총비용",
        ],
        rows,
        ["l", "l", "l", "l", "r", "r", "r"],
      ),
      "",
      `걸음 ${num(rows.length)} 개 · 라운드 ${num(WALK_COUNT.rounds)} 번 · 답 { flow: ${WALK_COUNT.flow}, cost: ${WALK_COUNT.cost} }`,
      `└ dist 는 정점 0 부터 3 까지 차례로 적은 것이다`,
      `└ 라운드마다의 한 단위 비용이 ${WALK_COUNT.unitCosts.join(" ")} 로 한 번도 안 줄어든다`,
    ].join("\n");
  },

  /** `deep.walk.pause` — 병목만큼 한 번에 안 보내고 한 단위씩 보내면. */
  "pause-unit": () => {
    const cases = [
      WALK_CASE,
      DETOUR_CASE,
      TWO_WAY_CASE,
      SERIAL_CASE,
      SINGLE_CASE,
    ];
    return [
      contrast(cases, unitPush, "한 단위씩만 보내는 판"),
      "",
      `배치 ${num(cases.length)} 개 모두 답이 같다`,
      `└ 경로 위의 모든 단위가 같은 한 단위 비용을 치르므로 나눠 보내도 총비용이 안 바뀐다`,
    ].join("\n");
  },

  /** `deep.walk.pause` — 한 단위씩 보내면 라운드가 몇 배가 되는가. */
  "pause-unit-work": () => {
    const cases: Case[] = [
      WALK_CASE,
      SINGLE_CASE,
      TWO_WAY_CASE,
      { ...SERIAL_CASE, label: "직렬 경로 둘" },
      chains(4, 2, 1000),
    ];
    const rows = cases.map((c) => {
      const mine = measure(c.n, c.edges, c.source, c.sink);
      const unit = runCounted(c.n, c.edges, c.source, c.sink, null, {
        unitPush: true,
      });
      return [
        c.label,
        num(mine.flow),
        num(mine.rounds),
        num(unit.rounds),
        num(mine.ops),
        num(unit.ops),
      ];
    });
    const worst = rows.reduce((a, b) =>
      Number((b[3] as string).replace(/,/g, "")) >
      Number((a[3] as string).replace(/,/g, ""))
        ? b
        : a,
    );
    return [
      table(
        [
          "배치",
          "최대 유량",
          "정본 라운드",
          "한 단위씩 보내는 판의 라운드",
          "정본이 견준 항목",
          "한 단위씩 판이 견준 항목",
        ],
        rows,
        ["l", "r", "r", "r", "r", "r"],
      ),
      "",
      `라운드 수가 가장 많이 늘어나는 배치는 ${worst[0]} 이고 ${worst[2]} 에서 ${worst[3]} 이 된다`,
      `└ 한 단위씩 보내는 판의 라운드 수는 최대 유량과 같다`,
      `└ 병목을 한 번에 보내는 것이 답을 지키는 자리가 아니라 라운드 수를 줄이는 자리다`,
    ].join("\n");
  },

  /** `related` — 유량 값마다의 최소 총비용이 그리는 곡선. */
  "related-convex": () => {
    const rows: string[][] = [];
    for (let v = 1; v <= WALK_ENUM.maxValue; v++) {
      const now = WALK_BEST[v] as number;
      const before = WALK_BEST[v - 1] as number;
      rows.push([num(v), num(now), num(now - before)]);
    }
    const marks = rows.map((r) => Number((r[2] as string).replace(/,/g, "")));
    let drops = 0;
    for (let i = 1; i < marks.length; i++) {
      if ((marks[i] as number) < (marks[i - 1] as number)) drops++;
    }
    const others: Case[] = [
      DETOUR_CASE,
      TWO_WAY_CASE,
      TRAP_CASE,
      SERIAL_CASE,
      assignment(4, 4, 3, 987654321n),
    ];
    const otherRows = others.map((c) => {
      const got = measure(c.n, c.edges, c.source, c.sink);
      let bad = 0;
      for (let i = 1; i < got.unitCosts.length; i++) {
        if ((got.unitCosts[i] as number) < (got.unitCosts[i - 1] as number)) {
          bad++;
        }
      }
      return [c.label, num(got.rounds), got.unitCosts.join(" "), num(bad)];
    });
    return [
      table(["유량 값", "그 값에서의 최소 총비용", "직전 값과의 차이"], rows, [
        "r",
        "r",
        "r",
      ]),
      "",
      table(
        ["배치", "라운드", "라운드마다의 한 단위 비용", "줄어든 자리"],
        otherRows,
        ["l", "r", "l", "r"],
      ),
      "",
      `전개 입력의 차이가 ${marks.join(" ")} 로 줄어든 자리가 ${num(drops)} 개다`,
      `└ 배치 ${num(otherRows.length)} 개에서도 라운드마다의 한 단위 비용이 줄어든 자리가 없다`,
      `└ 유량이 커질수록 한 단위 더 보내는 값이 안 줄어드는 곡선을 볼록하다고 부른다`,
    ].join("\n");
  },

  /** `deep.math` — 전개 입력에서 잠재값으로 다시 매긴 단위 비용. */
  "math-reweight": () => {
    const graph = residual(WALK_N, WALK);
    const dist = Array.from({ length: WALK_N }, () => INF);
    dist[WALK_SOURCE] = 0;
    const fromV = Array.from({ length: WALK_N }, () => -1);
    const fromE = Array.from({ length: WALK_N }, () => -1);
    const waiting = Array.from({ length: WALK_N }, () => false);
    const queue: number[] = [WALK_SOURCE];
    waiting[WALK_SOURCE] = true;
    while (queue.length > 0) {
      const u = queue.shift() as number;
      waiting[u] = false;
      const arcs = graph[u] as Arc[];
      for (let i = 0; i < arcs.length; i++) {
        const arc = arcs[i] as Arc;
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
    let push = INF;
    for (let v = WALK_SINK; v !== WALK_SOURCE; v = fromV[v] as number) {
      const arcs = graph[fromV[v] as number] as Arc[];
      push = Math.min(push, (arcs[fromE[v] as number] as Arc).cap);
    }
    for (let v = WALK_SINK; v !== WALK_SOURCE; v = fromV[v] as number) {
      const arcs = graph[fromV[v] as number] as Arc[];
      const arc = arcs[fromE[v] as number] as Arc;
      arc.cap -= push;
      ((graph[v] as Arc[])[arc.rev] as Arc).cap += push;
    }
    const rows: string[][] = [];
    for (let u = 0; u < WALK_N; u++) {
      for (const arc of graph[u] as Arc[]) {
        if (arc.cap <= 0) continue;
        const reduced =
          arc.cost + (dist[u] as number) - (dist[arc.to] as number);
        rows.push([
          `${u}→${arc.to}`,
          String(arc.cost),
          String(dist[u]),
          String(dist[arc.to]),
          String(reduced),
          reduced >= 0 ? "0 이상" : "음수",
        ]);
      }
    }
    const bad = rows.filter((r) => r[5] === "음수").length;
    const zero = rows.filter((r) => r[4] === "0").length;
    return [
      table(
        ["항목", "단위 비용", "π(u)", "π(v)", "다시 매긴 값", "부호"],
        rows,
        ["l", "r", "r", "r", "r", "l"],
      ),
      "",
      `라운드 1 을 끝낸 잔여 그래프의 항목 ${num(rows.length)} 개 중 다시 매긴 값이 음수인 것이 ${num(bad)} 개다`,
      `└ 잠재값 π 는 그 라운드가 잰 최단 거리 [${dist.join(", ")}] 를 그대로 쓴 것이다`,
      `└ 다시 매긴 값이 정확히 0 인 항목이 ${num(zero)} 개이고, 그중에 방금 생긴 역방향 항목이 들어 있다`,
    ].join("\n");
  },

  /** `deep.math` — 무작위 네트워크에서 다시 매긴 값이 음수인 자리. */
  "math-nonneg": () => {
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
      const got = measure(n, edges, 0, n - 1);
      rounds += got.rounds;
      checked += got.checkedArcs;
      bad += got.badReduced;
      newBack += got.newReverse;
      tight += got.tightNewReverse;
      negCycle += got.negCycleRounds;
      for (let i = 1; i < got.unitCosts.length; i++) {
        if ((got.unitCosts[i] as number) < (got.unitCosts[i - 1] as number)) {
          drops++;
        }
      }
    }
    return [
      table(
        ["무엇", "값"],
        [
          ["무작위 네트워크", num(networks)],
          ["라운드 합", num(rounds)],
          ["증가시킨 뒤 견준 잔여 항목", num(checked)],
          ["그중 다시 매긴 값이 음수인 것", num(bad)],
          ["새로 생긴 역방향 항목", num(newBack)],
          ["그중 다시 매긴 값이 정확히 0 인 것", num(tight)],
          ["잔여 그래프에 음수 사이클이 있던 라운드", num(negCycle)],
          ["라운드 비용이 줄어든 자리", num(drops)],
        ],
        ["l", "r"],
      ),
      "",
      `정점 4~11 · 간선 3~23 인 네트워크 ${num(networks)} 개를 만들어 라운드마다 견줬다`,
      `└ 다시 매긴 값이 음수인 항목이 ${num(bad)} 개이고 음수 사이클이 있던 라운드가 ${num(negCycle)} 번이다`,
      `└ 새로 생긴 역방향 항목은 ${num(newBack)} 개가 전부 다시 매긴 값 0 이다`,
    ].join("\n");
  },

  /** `deep.math` — 제약 규모를 넣은 값과 정수 한계. */
  "math-scale": () => {
    const V = 200;
    const E = 2000;
    const capMax = 10_000;
    const costMax = 10_000;
    const flowMax = E * capMax;
    const unitMax = (V - 1) * costMax;
    const product = flowMax * unitMax;
    const tight = E * capMax * costMax;
    const safe = Number.MAX_SAFE_INTEGER;
    return [
      table(
        ["무엇", "닫힌 형태", "제약 상한에서의 값"],
        [
          ["정점 수", "V", num(V)],
          ["간선 수", "E", num(E)],
          ["최대 유량", "E · c_max", num(flowMax)],
          ["한 단위의 비용", "(V−1) · a_max", num(unitMax)],
          ["둘의 곱", "E · c_max · (V−1) · a_max", num(product)],
          [
            "간선마다 용량과 단위 비용을 곱해 더한 값",
            "E · c_max · a_max",
            num(tight),
          ],
          ["정수가 정확한 한계", "2^53 − 1", num(safe)],
        ],
        ["l", "l", "r"],
      ),
      "",
      table(
        ["어느 상한을 쓰는가", "2^53 − 1 과의 비"],
        [
          ["둘의 곱", (safe / product).toFixed(2)],
          ["간선마다 곱해 더한 값", num(Math.floor(safe / tight))],
        ],
        ["l", "r"],
      ),
      "",
      `총비용은 어느 상한으로 재도 ${num(safe)} 안쪽이다`,
      `└ 헐거운 쪽으로 잡아도 ${(safe / product).toFixed(2)} 배 여유가 있다`,
      `└ 조인 쪽으로 잡으면 총비용이 ${eul(num(tight))} 못 넘어 ${num(Math.floor(safe / tight))} 배 여유다`,
    ].join("\n");
  },

  /** `invariant` — 라운드가 끝날 때마다 그 유량 값에서 최소 비용인가. */
  "invariant-rounds": () => {
    const cases: Case[] = [
      WALK_CASE,
      DETOUR_CASE,
      TWO_WAY_CASE,
      SERIAL_CASE,
      SINGLE_CASE,
    ];
    const rows = cases.map((c) => {
      const e = enumerateFlows(c.n, c.edges, c.source, c.sink);
      const best = bestByValue(e);
      const got = measure(c.n, c.edges, c.source, c.sink);
      let value = 0;
      let cost = 0;
      let off = 0;
      got.unitCosts.forEach((u, i) => {
        value += got.bottlenecks[i] as number;
        cost += u * (got.bottlenecks[i] as number);
        if (cost !== (best[value] as number)) off++;
      });
      return [
        c.label,
        num(got.rounds),
        num(got.flow),
        num(got.cost),
        num(off),
        num(got.negCycleRounds),
      ];
    });
    const off = rows.reduce((a, r) => a + Number(r[4]), 0);
    const cyc = rows.reduce((a, r) => a + Number(r[5]), 0);
    return [
      table(
        [
          "배치",
          "라운드",
          "최대 유량",
          "총비용",
          "최소가 아니었던 라운드",
          "음수 사이클이 있던 라운드",
        ],
        rows,
        ["l", "r", "r", "r", "r", "r"],
      ),
      "",
      `배치 ${num(rows.length)} 개를 라운드마다 전수 열거와 견줘 최소가 아니었던 라운드가 ${num(off)} 번이다`,
      `└ 같은 라운드에서 잔여 그래프에 음수 사이클이 있던 횟수도 ${num(cyc)} 번이다`,
      `└ 전수 열거는 간선마다 0 부터 용량까지를 다 넣어 본 결과이고 실행이 낸 값이다`,
    ].join("\n");
  },

  /** `invariant` — 엣지 케이스. */
  "invariant-edges": () => {
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
        "용량과 단위 비용이 제약 상한",
        3,
        [
          [0, 1, 10_000, 10_000],
          [1, 2, 10_000, 10_000],
        ],
        0,
        2,
      ],
    ];
    const rows = cases.map(([label, n, edges, source, sink]) => {
      const got = measure(n, edges, source, sink);
      return [
        label,
        num(n),
        num(edges.length),
        num(got.flow),
        num(got.cost),
        num(got.negCycleRounds),
      ];
    });
    const cyc = rows.reduce(
      (a, r) => a + Number((r[5] as string).replace(/,/g, "")),
      0,
    );
    return [
      table(
        ["배치", "정점", "간선", "유량", "총비용", "음수 사이클이 있던 라운드"],
        rows,
        ["l", "r", "r", "r", "r", "r"],
      ),
      "",
      `배치 ${num(rows.length)} 개 모두 답이 나오고 음수 사이클이 있던 라운드가 ${num(cyc)} 번이다`,
      `└ 경로가 없는 배치는 첫 라운드가 싱크의 값을 못 고쳐 { flow: 0, cost: 0 } 으로 끝난다`,
      `└ 자기 자신으로 가는 간선은 완화 조건이 값을 못 줄여 그대로 지나간다`,
    ].join("\n");
  },

  /** `invariant` ③ — 누적 총비용에 병목을 안 곱하면. */
  "mutant-cost": () => {
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
      const counted = measure(c.n, c.edges, c.source, c.sink);
      return [
        c.label,
        counted.bottlenecks.join(" "),
        num(want.cost),
        num(got.cost),
        want.cost === got.cost ? "같다" : "어긋난다",
      ];
    });
    const off = rows.filter((r) => r[4] === "어긋난다").length;
    return [
      table(
        ["배치", "라운드마다의 병목", "정본 총비용", "안 곱하는 판", "대조"],
        rows,
        ["l", "l", "r", "r", "l"],
      ),
      "",
      `배치 ${num(rows.length)} 개 중 총비용이 갈리는 것이 ${num(off)} 개다`,
      `└ 병목이 라운드마다 1 인 배치에서는 곱하나 안 곱하나 같은 값이 나온다`,
      `└ 그래서 용량이 전부 1 인 입력만 시험하면 이 자리를 못 잡는다`,
    ].join("\n");
  },

  /** `perf.derive` — 전개 입력의 계수. */
  "perf-count": () => {
    const c = WALK_COUNT;
    return [
      table(
        ["무엇", "값"],
        [
          ["라운드 수", num(c.rounds)],
          ["큐에서 꺼낸 정점 수", num(c.pops)],
          ["잔여 항목을 견준 횟수", num(c.ops)],
          ["값을 줄인 횟수", num(c.relaxHits)],
          ["완화 큐가 가장 길어졌을 때", num(c.peakQueue)],
          ["역방향 항목을 지난 라운드", num(c.usedReverse)],
          ["최대 유량", num(c.flow)],
          ["총비용", num(c.cost)],
        ],
        ["l", "r"],
      ),
      "",
      table(
        ["라운드", "한 단위의 비용", "병목", "그 라운드가 더한 값"],
        c.unitCosts.map((u, i) => [
          num(i + 1),
          num(u),
          num(c.bottlenecks[i] as number),
          num(u * (c.bottlenecks[i] as number)),
        ]),
        ["r", "r", "r", "r"],
      ),
      "",
      `정점 ${num(WALK_N)} · 간선 ${num(WALK.length)} 에서 잰 값이다`,
      `└ 라운드 ${num(c.rounds)} 번이 더한 값을 합치면 총비용 ${ida(num(c.cost))}`,
      `└ 잔여 항목이 ${num(WALK.length * 2)} 개이고 라운드마다 그 일부를 여러 번 견준다`,
    ].join("\n");
  },

  /** `perf.derive` — 규모를 키우며 같은 계수를 다시 잰다. */
  "perf-growth": () => {
    const rows = [4, 8, 16, 32].map((k) => {
      const c = assignment(k, k, 4, 987654321n);
      const got = measure(c.n, c.edges, c.source, c.sink);
      return [
        `배정 ${k}×${k}`,
        num(c.n),
        num(c.edges.length),
        num(got.rounds),
        num(got.pops),
        num(got.ops),
      ];
    });
    const growth: string[][] = [];
    for (let i = 1; i < rows.length; i++) {
      const before = rows[i - 1] as string[];
      const now = rows[i] as string[];
      const ratio = (a: string, b: string): string =>
        (Number(b.replace(/,/g, "")) / Number(a.replace(/,/g, ""))).toFixed(2);
      growth.push([
        `${(before[0] as string).replace("배정 ", "")} → ${(now[0] as string).replace("배정 ", "")}`,
        ratio(before[1] as string, now[1] as string),
        ratio(before[3] as string, now[3] as string),
        ratio(before[5] as string, now[5] as string),
      ]);
    }
    return [
      table(
        ["배치", "정점", "간선", "라운드", "꺼낸 정점", "견준 항목"],
        rows,
        ["l", "r", "r", "r", "r", "r"],
      ),
      "",
      table(
        ["한 변을 2 배로", "정점 성장률", "라운드 성장률", "견준 항목 성장률"],
        growth,
        ["l", "r", "r", "r"],
      ),
      "",
      `왼쪽 정점 수를 2 배로 하면 라운드 수도 2 배 언저리로 늘어난다`,
      `└ 이 모양에서는 라운드 수가 최대 유량과 같다 — 간선 용량이 전부 1 이라 병목이 늘 1 이다`,
      `└ 견준 항목은 라운드 수와 간선 수가 함께 늘어 4 배 언저리가 된다`,
    ].join("\n");
  },

  /** `perf.worst` — 제약 상한을 꽉 채운 입력. */
  "worst-limit": () => {
    const rows: string[][] = [];
    for (const [k, cross] of [
      [16, 1952],
      [32, 1904],
      [64, 1808],
      [80, 1760],
      [99, 1703],
    ] as [number, number][]) {
      const c = crossed(k, 10_000, 10_000, cross, 20250907n);
      if (c.n > 200 || c.edges.length > 2000) continue;
      const got = measure(c.n, c.edges, c.source, c.sink);
      rows.push([
        `병렬 ${k}`,
        num(c.n),
        num(c.edges.length),
        num(got.flow),
        num(got.rounds),
        num(got.ops),
        (got.ops / got.rounds).toFixed(1),
      ]);
    }
    const most = rows.reduce((a, b) =>
      Number((b[4] as string).replace(/,/g, "")) >
      Number((a[4] as string).replace(/,/g, ""))
        ? b
        : a,
    );
    const heaviest = rows.reduce((a, b) =>
      Number((b[5] as string).replace(/,/g, "")) >
      Number((a[5] as string).replace(/,/g, ""))
        ? b
        : a,
    );
    return [
      table(
        [
          "배치",
          "정점",
          "간선",
          "최대 유량",
          "라운드",
          "견준 항목",
          "라운드당 견준 항목",
        ],
        rows,
        ["l", "r", "r", "r", "r", "r", "r"],
      ),
      "",
      `정점 상한 200 · 간선 상한 2,000 · 용량과 단위 비용 상한 10,000 을 꽉 채운 배치 ${num(rows.length)} 개다`,
      `└ 라운드가 가장 많은 배치는 ${most[0]} 이고 ${most[4]} 번이다 — 최대 유량 ${most[3]} 의 0.2 % 도 안 된다`,
      `└ 견준 항목이 가장 많은 배치는 ${heaviest[0]} 이고 ${heaviest[5]} 다`,
    ].join("\n");
  },

  /** `perf.worst` — 최악을 만드는 입력. */
  "worst-shape": () => {
    const cases: Case[] = [
      { ...crossed(16, 64, 20, 0, 20250907n), label: "병렬 16 · 가로 0" },
      { ...crossed(16, 64, 20, 64, 20250907n), label: "병렬 16 · 가로 64" },
      { ...crossed(16, 64, 20, 180, 20250907n), label: "병렬 16 · 가로 180" },
      { ...assignment(32, 32, 4, 987654321n), label: "배정 32×32" },
      { ...chains(8, 4, 1), label: "사슬 8×4 · 용량 1" },
      { ...chains(8, 4, 10_000), label: "사슬 8×4 · 용량 10000" },
    ];
    const rows = cases.map((c) => {
      const got = measure(c.n, c.edges, c.source, c.sink);
      return [
        c.label,
        num(c.n),
        num(c.edges.length),
        num(got.flow),
        num(got.rounds),
        num(got.ops),
      ];
    });
    const most = rows.reduce((a, b) =>
      Number((b[5] as string).replace(/,/g, "")) >
      Number((a[5] as string).replace(/,/g, ""))
        ? b
        : a,
    );
    const mostRounds = rows.reduce((a, b) =>
      Number((b[4] as string).replace(/,/g, "")) >
      Number((a[4] as string).replace(/,/g, ""))
        ? b
        : a,
    );
    return [
      table(
        ["배치", "정점", "간선", "최대 유량", "라운드", "견준 항목"],
        rows,
        ["l", "r", "r", "r", "r", "r"],
      ),
      "",
      `견준 항목이 가장 많은 배치는 ${most[0]} 이고 ${most[5]} 다`,
      `└ 라운드가 가장 많은 배치도 ${mostRounds[0]} 이고 ${mostRounds[4]} 번이다`,
      `└ 용량을 1 에서 10000 으로 키운 사슬은 라운드가 안 늘어난다 — 병목이 함께 커지기 때문이다`,
    ].join("\n");
  },
};
