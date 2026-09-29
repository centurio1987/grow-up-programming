/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run tools/check-proof.ts src/algorithms/shortest-path/dagShortestPath/dagShortestPath-guide.md
 *
 * **계수를 세는 사본이 여럿 있다**(`enumeratePaths`·`byOrder`·`rounds`·`greedy`·`countCells`·
 * `relaxTrace`). 정본은 몇 칸을 읽었는지를 내보내지 않으므로, 세는 자리만 덧붙인 사본이 아니면
 * 계수를 낼 방법이 없다. **답이 맞는지는 사본이 아니라 정본이 진다** — 정본과 같은 절차를 따르는
 * 사본은 부를 때마다 자기 답을 정본과 맞대고(`checked`), 어긋나면 던진다.
 *
 * **변이가 아무것도 안 바꾸는지를 검사하는 자리는 중화 실행을 피해 간다.** `check-proof` 가 이
 * 파일을 한 번 더 부를 때는 `loadMutant` 가 정본을 그대로 돌려주므로(중화), 그 상태에서 「변이가
 * 답을 안 바꿨다」로 던지면 중화 대조 자체가 실행되지 않는다. 중화 여부는 변이 모듈의 함수가 정본과
 * 같은 객체인가로 값에서 알아낸다(`중화됨`).
 *
 * 걸음 기록(`record`)은 그림 사이드카(`-guide.fig.tsx`)가 걸음 재생 패널과 정적 그림을 만드는 데도
 * 쓴다 — 본문의 표와 그림이 한 실행에서 나온다. 「경쟁 설계와의 대조」의 수는 `bench-alt` 가 낸
 * `.bench.json` 에서 받는다.
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { josa, 으로, 은는, 을를, 이가 } from "../../../../tools/josa.ts";
import benchJson from "./dagShortestPath-guide.bench.json";
import { dagShortestPath, type Edge } from "./dagShortestPath-guide.ref.ts";

const INF = Number.POSITIVE_INFINITY;

/* ────────────────────────── 고정 입력 ────────────────────────── */

/**
 * 본문 전개가 쓰는 고정 입력. 간선 목록이 위상 순서로 적혀 있지 않고, 정점 4 는 시작 정점에서
 * 갈 수 없는데 나가는 간선을 갖고 있으며, 정점 5 는 간선이 하나도 없다.
 */
export const WALK_N = 6;
export const WALK_SRC = 0;
export const WALK_EDGES: Edge[] = [
  [2, 3, 2],
  [0, 1, 3],
  [1, 2, -4],
  [0, 2, 5],
  [1, 3, 6],
  [4, 0, 2],
  [0, 3, 7],
];

/** 번호가 큰 정점을 거쳐 번호가 작은 정점으로 가는 간선이 있는 그래프. */
const BACK_N = 4;
const BACK_EDGES: Edge[] = [
  [0, 2, 1],
  [2, 1, 1],
  [1, 3, 1],
];

/** 정점 `v` 개를 한 줄로 이은 그래프 — `0 → 1 → … → v-1`, 가중치는 전부 1 이다. */
export function chain(v: number): Edge[] {
  const out: Edge[] = [];
  for (let i = 0; i + 1 < v; i++) out.push([i, i + 1, 1]);
  return out;
}

/**
 * 다이아몬드 `k` 개를 이은 그래프. 정점은 `3k + 1` 개, 간선은 `4k` 개다.
 * 가운데 정점 `3i` 에서 위·아래 두 갈래로 갈렸다가 `3(i+1)` 에서 다시 만난다.
 */
function diamonds(k: number): { n: number; edges: Edge[]; last: number } {
  const edges: Edge[] = [];
  for (let i = 0; i < k; i++) {
    const hub = 3 * i;
    edges.push([hub, hub + 1, 1]);
    edges.push([hub, hub + 2, 2]);
    edges.push([hub + 1, hub + 3, 1]);
    edges.push([hub + 2, hub + 3, 2]);
  }
  return { n: 3 * k + 1, edges, last: 3 * k };
}

/** 규모 상한. */
const V_LIMIT = 100_000;
const E_LIMIT = 200_000;

/* ────────────────────────── 표기 ────────────────────────── */

/** `[0, 3, -1, 1, Infinity, Infinity]` 꼴 — 본문 표기와 같다. */
export const show = (xs: readonly number[]): string =>
  `[${xs.map((x) => num(x)).join(", ")}]`;

/** `1,299,994` 꼴 — 본문 표기와 같다. */
export const comma = (n: number): string => n.toLocaleString("en-US");

/** 수 하나. `Infinity` 는 그대로 적는다. */
export const num = (x: number): string => (x === INF ? "Infinity" : String(x));

/** 가중치를 더하는 식 — 음수면 괄호를 친다(`3 + (-4)`). */
export const plus = (d: number, w: number): string =>
  `${num(d)} + ${w < 0 ? `(${w})` : w}`;

/** 간선 `u→v`. */
const arrow = (u: number, v: number): string => `${u}→${v}`;

/** 정점 목록을 「4 · 5」 꼴로. */
export const dots = (xs: readonly (number | string)[]): string =>
  xs.join(" · ");

/** 마크다운 표 — `right` 에 든 열은 오른쪽으로 붙인다. */
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

/** 「이름   값」 두 열짜리 줄들 — 이름 열의 폭을 값에서 잰다. */
function lines(rows: [string, string][], indent = ""): string[] {
  const w = Math.max(...rows.map(([a]) => width(a)));
  return rows.map(([a, b]) => `${indent}${pad(a, w)}   ${b}`.trimEnd());
}

const sameArr = (a: readonly number[], b: readonly number[]): boolean =>
  a.length === b.length && a.every((x, i) => x === b[i]);

/* ────────────────────── 세는 사본과 다른 절차 ────────────────────── */

function adjacency(n: number, edges: Edge[]): [number, number][][] {
  const adj: [number, number][][] = Array.from({ length: n }, () => []);
  for (const [u, v, w] of edges) (adj[u] as [number, number][]).push([v, w]);
  return adj;
}

/** 정본과 같은 절차를 따르는 사본의 답을 정본과 맞댄다. 어긋나면 던진다. */
function checked(n: number, edges: Edge[], src: number, got: number[]): void {
  const want = dagShortestPath(n, edges, src);
  if (!sameArr(got, want)) {
    throw new Error(`사본의 답 ${show(got)} 이 정본 ${show(want)} 과 다르다`);
  }
}

/**
 * 가장 단순한 방법 — **시작 정점에서 나가는 모든 경로를 실제로 만들어** 끝점마다 최솟값을
 * 남긴다. 기법이 하나도 안 들어간 풀이다. `calls` 는 만든 경로 조각의 수이고, `arrive[v]` 는
 * 정점 `v` 에 도착한 조각의 수다.
 */
function enumeratePaths(
  n: number,
  edges: Edge[],
  src: number,
): { dist: number[]; calls: number; arrive: number[] } {
  const adj = adjacency(n, edges);
  const dist: number[] = Array.from({ length: n }, () => INF);
  const arrive: number[] = Array.from({ length: n }, () => 0);
  let calls = 0;
  const walk = (u: number, cost: number): void => {
    calls++;
    arrive[u] = (arrive[u] as number) + 1;
    if (cost < (dist[u] as number)) dist[u] = cost;
    for (const [v, w] of adj[u] as [number, number][]) walk(v, cost + w);
  };
  walk(src, 0);
  return { dist, calls, arrive };
}

/** `src` 에서 `to` 로 가는 경로 전부 — 정점 나열과 비용. 작은 그래프에서만 쓴다. */
function pathsTo(
  n: number,
  edges: Edge[],
  src: number,
  to: number,
): { path: number[]; cost: number }[] {
  const adj = adjacency(n, edges);
  const out: { path: number[]; cost: number }[] = [];
  const walk = (u: number, path: number[], cost: number): void => {
    if (u === to) out.push({ path, cost });
    for (const [v, w] of adj[u] as [number, number][]) {
      walk(v, [...path, v], cost + w);
    }
  };
  walk(src, [src], 0);
  return out;
}

/** 끝점이 `target` 인 경로가 몇 개인가. 다이아몬드 사슬의 경로 수를 세는 데 쓴다. */
function countPaths(
  n: number,
  edges: Edge[],
  src: number,
  target: number,
): number {
  const adj = adjacency(n, edges);
  const memo: (number | undefined)[] = Array.from(
    { length: n },
    () => undefined,
  );
  const go = (u: number): number => {
    if (u === target) return 1;
    const seen = memo[u];
    if (seen !== undefined) return seen;
    let total = 0;
    for (const [v] of adj[u] as [number, number][]) total += go(v);
    memo[u] = total;
    return total;
  };
  return go(src);
}

/** 한 번의 완화 기록. */
export interface Relax {
  readonly u: number;
  readonly v: number;
  readonly w: number;
  /** 그때의 `dist[u]`. */
  readonly d: number;
  readonly nd: number;
  /** 완화 직전의 `dist[v]`. */
  readonly before: number;
  readonly improved: boolean;
}

/**
 * 정점을 **주어진 순서대로 한 번씩** 처리하며 나가는 간선을 완화한다. 순서를 갈아 끼워 무엇이
 * 답을 정하는지 보는 자리다. `visits` 는 처리한 정점마다 그때의 `dist[u]` 와 완화 기록이다.
 */
function byOrder(
  n: number,
  edges: Edge[],
  src: number,
  order: number[],
): {
  dist: number[];
  tries: number;
  visits: { u: number; d: number; relax: Relax[] }[];
} {
  const adj = adjacency(n, edges);
  const dist: number[] = Array.from({ length: n }, () => INF);
  dist[src] = 0;
  let tries = 0;
  const visits: { u: number; d: number; relax: Relax[] }[] = [];
  for (const u of order) {
    const d = dist[u] as number;
    const relax: Relax[] = [];
    visits.push({ u, d, relax });
    if (d === INF) continue;
    for (const [v, w] of adj[u] as [number, number][]) {
      tries++;
      const nd = d + w;
      const before = dist[v] as number;
      const improved = nd < before;
      if (improved) dist[v] = nd;
      relax.push({ u, v, w, d, nd, before, improved });
    }
  }
  return { dist, tries, visits };
}

/** 위상 순서 — 정본과 같은 절차로 만든다. */
function topoOrder(n: number, edges: Edge[]): number[] {
  const adj = adjacency(n, edges);
  const indegree: number[] = Array.from({ length: n }, () => 0);
  for (const [, v] of edges) indegree[v] = (indegree[v] as number) + 1;
  const order: number[] = [];
  for (let v = 0; v < n; v++) if (indegree[v] === 0) order.push(v);
  for (let i = 0; i < order.length; i++) {
    const u = order[i] as number;
    for (const [v] of adj[u] as [number, number][]) {
      indegree[v] = (indegree[v] as number) - 1;
      if (indegree[v] === 0) order.push(v);
    }
  }
  return order;
}

/** 간선 목록에 처음 나온 정점부터의 순서. */
function firstSeenOrder(n: number, edges: Edge[]): number[] {
  const order: number[] = [];
  const seen: boolean[] = Array.from({ length: n }, () => false);
  for (const [u, v] of edges) {
    for (const x of [u, v]) {
      if (seen[x] === true) continue;
      seen[x] = true;
      order.push(x);
    }
  }
  for (let v = 0; v < n; v++) if (seen[v] === false) order.push(v);
  return order;
}

/**
 * 간선 목록 전체를 **고칠 것이 없을 때까지** 라운드마다 다시 읽는 방식. `tries` 는 간선을 읽은
 * 횟수이고 `rounds` 는 마지막 확인 라운드까지 센 라운드 수다. `first` 는 라운드 1 의 기록이다.
 */
function rounds(
  n: number,
  edges: Edge[],
  src: number,
): { dist: number[]; tries: number; rounds: number; first: Relax[] } {
  const dist: number[] = Array.from({ length: n }, () => INF);
  dist[src] = 0;
  let tries = 0;
  let used = 0;
  const first: Relax[] = [];
  for (let round = 0; round < n; round++) {
    used++;
    let changed = false;
    for (const [u, v, w] of edges) {
      tries++;
      const d = dist[u] as number;
      const before = dist[v] as number;
      const nd = d + w;
      const improved = d !== INF && nd < before;
      if (round === 0) first.push({ u, v, w, d, nd, before, improved });
      if (improved) {
        dist[v] = nd;
        changed = true;
      }
    }
    if (!changed) break;
  }
  return { dist, tries, rounds: used, first };
}

/**
 * 「아직 확정 안 된 정점 중 지금 값이 가장 작은 것을 확정하고 다시 고치지 않는다」는 방식.
 * 가중치가 0 이상이면 이것이 답을 내지만, 음수 간선이 섞이면 갈리는 자리가 생긴다.
 * `picks` 는 확정한 차례대로 그 정점과 그때의 `dist` 사본이다.
 */
function greedy(
  n: number,
  edges: Edge[],
  src: number,
): {
  dist: number[];
  picks: { u: number; dist: number[]; blocked: Relax[] }[];
} {
  const adj = adjacency(n, edges);
  const dist: number[] = Array.from({ length: n }, () => INF);
  dist[src] = 0;
  const done: boolean[] = Array.from({ length: n }, () => false);
  const picks: { u: number; dist: number[]; blocked: Relax[] }[] = [];
  for (let step = 0; step < n; step++) {
    let pick = -1;
    for (let v = 0; v < n; v++) {
      if (done[v] === true) continue;
      if (pick < 0 || (dist[v] as number) < (dist[pick] as number)) pick = v;
    }
    if (pick < 0) break;
    done[pick] = true;
    const blocked: Relax[] = [];
    const d = dist[pick] as number;
    if (d !== INF) {
      for (const [v, w] of adj[pick] as [number, number][]) {
        const nd = d + w;
        const before = dist[v] as number;
        if (done[v] === true) {
          if (nd < before) {
            blocked.push({ u: pick, v, w, d, nd, before, improved: false });
          }
          continue;
        }
        if (nd < before) dist[v] = nd;
      }
    }
    picks.push({ u: pick, dist: [...dist], blocked });
  }
  return { dist, picks };
}

/** 정본과 같은 절차. 읽고 쓴 배열 칸만 덧붙여 센다 — 「비용을 세는 과정」의 닫힌 형태와 맞춘다. */
function countCells(
  n: number,
  edges: Edge[],
  src: number,
): { cells: number; reached: number; edgesFromReached: number; fixes: number } {
  let cells = 0;
  const adj: [number, number][][] = Array.from({ length: n }, () => []);
  cells += n;
  const indegree: number[] = Array.from({ length: n }, () => 0);
  cells += n;
  for (const [u, v, w] of edges) {
    cells += 4;
    (adj[u] as [number, number][]).push([v, w]);
    indegree[v] = (indegree[v] as number) + 1;
  }

  const order: number[] = [];
  for (let v = 0; v < n; v++) {
    cells++;
    if (indegree[v] === 0) {
      order.push(v);
      cells++;
    }
  }
  for (let i = 0; i < order.length; i++) {
    cells += 2;
    const u = order[i] as number;
    for (const [v] of adj[u] as [number, number][]) {
      cells += 2;
      indegree[v] = (indegree[v] as number) - 1;
      if (indegree[v] === 0) {
        order.push(v);
        cells++;
      }
    }
  }

  const dist: number[] = Array.from({ length: n }, () => INF);
  cells += n;
  dist[src] = 0;
  cells++;

  let reached = 0;
  let edgesFromReached = 0;
  let fixes = 0;
  for (const u of order) {
    cells++;
    if (dist[u] === INF) continue;
    reached++;
    cells++;
    for (const [v, w] of adj[u] as [number, number][]) {
      edgesFromReached++;
      cells += 2;
      const nd = (dist[u] as number) + w;
      if (nd < (dist[v] as number)) {
        dist[v] = nd;
        fixes++;
        cells++;
      }
    }
  }
  checked(n, edges, src, dist);
  return { cells, reached, edgesFromReached, fixes };
}

/** 닫힌 형태 — 본문이 유도한 식 그대로다. */
const closedForm = (
  n: number,
  e: number,
  reached: number,
  edgesFromReached: number,
  fixes: number,
): number => 8 * n + 6 * e + reached + 2 * edgesFromReached + fixes + 1;

/**
 * 정본과 같은 절차에서 건너뛰는 줄(④)만 켜고 끌 수 있게 한 사본. 완화 시도를 센다 — 그 줄을
 * 지운 변이는 세는 자리가 없어서, 계수는 이 사본이 내고 답은 변이가 낸다.
 */
function countTries(
  n: number,
  edges: Edge[],
  src: number,
  skip: boolean,
): number {
  const adj = adjacency(n, edges);
  const order = topoOrder(n, edges);
  const dist: number[] = Array.from({ length: n }, () => INF);
  dist[src] = 0;
  let tries = 0;
  for (const u of order) {
    if (skip && dist[u] === INF) continue;
    for (const [v, w] of adj[u] as [number, number][]) {
      tries++;
      const nd = (dist[u] as number) + w;
      if (nd < (dist[v] as number)) dist[v] = nd;
    }
  }
  checked(n, edges, src, dist);
  return tries;
}

/**
 * 위상 순서대로 완화하되 비교를 켜고 끌 수 있게 한 사본 — 정점 `watch` 의 값이 완화마다 어떻게
 * 바뀌는지 적는다. 비교를 끈 판의 답은 변이의 답과 맞대어 본다.
 */
function watchWrites(
  n: number,
  edges: Edge[],
  src: number,
  compare: boolean,
  watch: number,
): { dist: number[]; rows: { relax: Relax; after: number }[] } {
  const adj = adjacency(n, edges);
  const order = topoOrder(n, edges);
  const dist: number[] = Array.from({ length: n }, () => INF);
  dist[src] = 0;
  const rows: { relax: Relax; after: number }[] = [];
  for (const u of order) {
    const d = dist[u] as number;
    if (d === INF) continue;
    for (const [v, w] of adj[u] as [number, number][]) {
      const nd = d + w;
      const before = dist[v] as number;
      const improved = nd < before;
      if (!compare || improved) dist[v] = nd;
      if (v === watch) {
        rows.push({
          relax: { u, v, w, d, nd, before, improved },
          after: dist[v] as number,
        });
      }
    }
  }
  return { dist, rows };
}

/* ────────────────────────── 걸음 기록 ────────────────────────── */

/** 위상 순서를 만드는 반복에서 정점 하나를 꺼낸 기록. */
export interface Pop {
  readonly u: number;
  readonly decs: {
    readonly v: number;
    readonly after: number;
    readonly pushed: boolean;
  }[];
}

export type Kind = "build" | "seeds" | "order" | "start" | "skip" | "visit";

/** 전개의 걸음 하나가 끝난 시점. */
export interface Step {
  readonly t: string;
  readonly kind: Kind;
  /** 이 걸음이 끝난 뒤의 진입 차수. */
  readonly indegree: readonly number[];
  /** 이 걸음이 끝난 뒤의 위상 순서. */
  readonly order: readonly number[];
  /** 이 걸음이 끝난 뒤의 거리. 시작값을 적기 전이면 `null`. */
  readonly dist: readonly number[] | null;
  /** 정점마다 지금 거리를 낸 간선의 번호(간선 목록의 자리). 없으면 −1. */
  readonly pred: readonly number[];
  /** 이 걸음이 처리한 정점(건너뛰기 · 완화). */
  readonly u: number | null;
  readonly relax: readonly Relax[];
  /** 이 걸음에 위상 순서 뒤에 붙은 정점. */
  readonly pushed: readonly number[];
  /** 위상 순서를 채우는 걸음(T3)에서 꺼낸 차례. */
  readonly pops: readonly Pop[];
}

/**
 * 정본과 같은 절차를 따르며 걸음마다 상태를 적는다. T1 이 간선 옮기기, T2 가 앞자리 놓기, T3 이
 * 위상 순서 채우기, T4 가 시작값, T5 부터 위상 순서의 정점 하나가 걸음 하나다. 끝에서 답을 정본과
 * 맞댄다.
 */
export function record(n: number, edges: Edge[], src: number): Step[] {
  const steps: Step[] = [];
  let t = 1;
  const next = () => `T${t++}`;
  const adj = adjacency(n, edges);
  const withIndex: [number, number, number][][] = Array.from(
    { length: n },
    () => [],
  );
  edges.forEach(([u, v, w], i) => {
    (withIndex[u] as [number, number, number][]).push([v, w, i]);
  });
  const indegree: number[] = Array.from({ length: n }, () => 0);
  for (const [, v] of edges) indegree[v] = (indegree[v] as number) + 1;
  const pred: number[] = Array.from({ length: n }, () => -1);
  const base = {
    dist: null,
    u: null,
    relax: [],
    pushed: [],
    pops: [],
  };
  steps.push({
    ...base,
    t: next(),
    kind: "build",
    indegree: [...indegree],
    order: [],
    pred: [...pred],
  });

  const order: number[] = [];
  for (let v = 0; v < n; v++) if (indegree[v] === 0) order.push(v);
  steps.push({
    ...base,
    t: next(),
    kind: "seeds",
    indegree: [...indegree],
    order: [...order],
    pred: [...pred],
    pushed: [...order],
  });

  const pops: Pop[] = [];
  const seeds = order.length;
  for (let i = 0; i < order.length; i++) {
    const u = order[i] as number;
    const decs: { v: number; after: number; pushed: boolean }[] = [];
    for (const [v] of adj[u] as [number, number][]) {
      indegree[v] = (indegree[v] as number) - 1;
      const pushed = indegree[v] === 0;
      if (pushed) order.push(v);
      decs.push({ v, after: indegree[v] as number, pushed });
    }
    pops.push({ u, decs });
  }
  steps.push({
    ...base,
    t: next(),
    kind: "order",
    indegree: [...indegree],
    order: [...order],
    pred: [...pred],
    pushed: order.slice(seeds),
    pops,
  });

  const dist: number[] = Array.from({ length: n }, () => INF);
  dist[src] = 0;
  steps.push({
    ...base,
    t: next(),
    kind: "start",
    indegree: [...indegree],
    order: [...order],
    dist: [...dist],
    pred: [...pred],
  });

  for (const u of order) {
    const d = dist[u] as number;
    if (d === INF) {
      steps.push({
        ...base,
        t: next(),
        kind: "skip",
        indegree: [...indegree],
        order: [...order],
        dist: [...dist],
        pred: [...pred],
        u,
      });
      continue;
    }
    const relax: Relax[] = [];
    for (const [v, w, i] of withIndex[u] as [number, number, number][]) {
      const nd = d + w;
      const before = dist[v] as number;
      const improved = nd < before;
      if (improved) {
        dist[v] = nd;
        pred[v] = i;
      }
      relax.push({ u, v, w, d, nd, before, improved });
    }
    steps.push({
      ...base,
      t: next(),
      kind: "visit",
      indegree: [...indegree],
      order: [...order],
      dist: [...dist],
      pred: [...pred],
      u,
      relax,
    });
  }
  checked(n, edges, src, dist);
  return steps;
}

export const WALK = record(WALK_N, WALK_EDGES, WALK_SRC);
export const WALK_ORDER = (WALK.at(-1) as Step).order;
export const WALK_DIST = (WALK.at(-1) as Step).dist as readonly number[];

/** 정점 `v` 의 차례가 온 걸음. */
export const turnOf = (v: number): Step => WALK.find((s) => s.u === v) as Step;

/** 걸음들의 이름을 「T5 · T6」 꼴로. */
const ts = (xs: readonly Step[]): string => dots(xs.map((s) => s.t));

/** 간선 번호 `i` 를 완화한 걸음. 완화하지 않았으면 `undefined`. */
function relaxedAt(i: number): Step | undefined {
  const [u, v, w] = WALK_EDGES[i] as Edge;
  return WALK.find((s) =>
    s.relax.some((r) => r.u === u && r.v === v && r.w === w),
  );
}

/* ────────────────────────── 변이 ────────────────────────── */

interface Ref {
  dagShortestPath(n: number, edges: Edge[], src: number): number[];
}

const REF_PATH = new URL("./dagShortestPath-guide.ref.ts", import.meta.url)
  .pathname;

/**
 * 완화의 비교를 지운 사본 — `if (nd < (dist[v] as number)) dist[v] = nd;` 를 `dist[v] = nd;` 로
 * 바꿨다. 한 번 적힌 값이 뒤에 오는 간선 때문에 **커질 수 있게** 된다.
 */
const alwaysWrite = await loadMutant<Ref>(REF_PATH, {
  swap: [
    /^\s+if \(nd < \(dist\[v\] as number\)\) dist\[v\] = nd;/,
    "      dist[v] = nd;",
  ],
});

/** 위상 순서의 길이를 반복에 들어가기 전에 붙잡아 둔 사본. 도중에 붙는 정점을 못 본다. */
const frozenLength = await loadMutant<Ref>(REF_PATH, {
  swap: [
    /for \(let i = 0; i < order\.length; i\+\+\) \{/,
    "for (let i = 0, len = order.length; i < len; i++) {",
  ],
});

/** 갈 길을 못 찾은 정점을 건너뛰는 줄을 통째로 지운 사본. */
const noSkip = await loadMutant<Ref>(REF_PATH, {
  drop: /if \(dist\[u\] === Number\.POSITIVE_INFINITY\) continue;/,
});

/** `check-proof` 의 중화 실행인가 — 변이 모듈의 함수가 정본과 같은 객체다. */
const 중화됨 = alwaysWrite.dagShortestPath === dagShortestPath;

/* ────────────────────────── 블록 — 전체 컨셉 ────────────────────────── */

/** 정점 2 · 3 으로 가는 경로 전부와 비용. */
function conceptPaths(): string {
  const rows: string[][] = [];
  for (const to of [2, 3]) {
    const ps = pathsTo(WALK_N, WALK_EDGES, WALK_SRC, to);
    const best = Math.min(...ps.map((p) => p.cost));
    for (const p of ps) {
      rows.push([
        String(to),
        p.path.join("→"),
        String(p.path.length - 1),
        String(p.cost),
        p.cost === best ? "가장 작다" : "",
      ]);
    }
  }
  const direct = pathsTo(WALK_N, WALK_EDGES, WALK_SRC, 2).find(
    (p) => p.path.length === 2,
  ) as { cost: number };
  return [
    md(["도착 정점", "경로", "간선 수", "비용", "비용이"], rows, [2, 3]),
    "",
    `정점 2 까지는 곧장 가는 간선의 비용이 ${direct.cost} 이고 가장 작은 비용은 ${WALK_DIST[2]} 입니다. 정본이 낸 거리는 dist[2] = ${WALK_DIST[2]} · dist[3] = ${WALK_DIST[3]} 입니다.`,
  ].join("\n");
}

/** 위상 순서에서 간선마다 두 끝의 자리. */
function conceptOrder(): string {
  const at = (v: number) => WALK_ORDER.indexOf(v);
  const rows = WALK_EDGES.map(([u, v]) => [
    arrow(u, v),
    String(at(u)),
    String(at(v)),
    at(u) < at(v) ? "왼쪽에서 오른쪽" : "오른쪽에서 왼쪽",
  ]);
  const ok = WALK_EDGES.filter(([u, v]) => at(u) < at(v)).length;
  return [
    md(["간선 u→v", "u 의 자리", "v 의 자리", "방향"], rows, [1, 2]),
    "",
    `위상 순서 ${show(WALK_ORDER)} 에서 간선 ${WALK_EDGES.length} 개 가운데 ${ok} 개가 왼쪽에서 오른쪽으로 갑니다.`,
  ].join("\n");
}

/** 정점 3 의 차례가 왔을 때 들어오는 간선의 후보. */
function conceptTurn(): string {
  const turn = turnOf(3);
  const prev = WALK[WALK.indexOf(turn) - 1] as Step;
  const dist = prev.dist as readonly number[];
  const inc = WALK_EDGES.filter(([, v]) => v === 3);
  const rows = inc.map(([u, , w]) => [
    `${arrow(u, 3)} (가중치 ${w})`,
    String(WALK_ORDER.indexOf(u)),
    num(dist[u] as number),
    `${plus(dist[u] as number, w)} = ${num((dist[u] as number) + w)}`,
  ]);
  const best = Math.min(...inc.map(([u, , w]) => (dist[u] as number) + w));
  const before = inc.every(
    ([u]) => WALK_ORDER.indexOf(u) < WALK_ORDER.indexOf(3),
  );
  return [
    md(
      [
        "들어오는 간선",
        "꼬리의 자리",
        "그때 dist[꼬리]",
        "후보 dist[꼬리] + w",
      ],
      rows,
      [1],
    ),
    "",
    `간선 ${inc.length} 개의 꼬리가 ${before ? "모두" : "모두는 아니게"} 정점 3 의 자리 ${WALK_ORDER.indexOf(3)} 보다 앞이고, 가장 작은 후보 ${best}${이가(best)} 정본의 dist[3] = ${WALK_DIST[3]} 과 같습니다.`,
  ].join("\n");
}

/* ────────────────────────── 블록 — 아이디어를 떠올리는 과정 ────────────────────────── */

const BIG_K = Math.floor((V_LIMIT - 1) / 3);
const pow2Digits = (k: number): number => Math.floor(k * Math.log10(2)) + 1;
const sec = (ops: number): string => `${comma(Math.round(ops / 1e8))} 초`;

/** 규모 안에서 거꾸로 놓은 사슬을 라운드 방식이 읽는 간선 수 — 작은 규모의 실행과 맞춘 식 V × (V − 1). */
const roundReads = (v: number): number => v * (v - 1);

/** 「아이디어를 떠올리는 과정」과 그 시도 사다리가 쓰는 수. */
export function originNumbers() {
  const back = byOrder(
    BACK_N,
    BACK_EDGES,
    0,
    Array.from({ length: BACK_N }, (_, i) => i),
  );
  return {
    bigV: V_LIMIT,
    bigE: E_LIMIT,
    bigKV: 3 * BIG_K + 1,
    fragDigits: pow2Digits(BIG_K + 2),
    roundReads: roundReads(V_LIMIT),
    roundSec: sec(roundReads(V_LIMIT)),
    numberBack: show(back.dist),
    backAnswer: show(dagShortestPath(BACK_N, BACK_EDGES, 0)),
    walkTries: byOrder(WALK_N, WALK_EDGES, 0, topoOrder(WALK_N, WALK_EDGES))
      .tries,
  };
}

/** 경로 나열과 라운드 방식을 규모를 키워 가며 잰다. */
function naiveScale(): string {
  const rows: string[][] = [];
  for (const k of [2, 4, 8, 16]) {
    const d = diamonds(k);
    const r = enumeratePaths(d.n, d.edges, 0);
    if (r.calls !== 2 ** (k + 2) - 3) {
      throw new Error(`다이아몬드 ${k} 의 조각 ${r.calls} 가 식과 다르다`);
    }
    checked(d.n, d.edges, 0, r.dist);
    rows.push([
      "다이아몬드 사슬",
      comma(d.n),
      comma(d.edges.length),
      `경로 조각 ${comma(r.calls)} 개`,
      "실행",
    ]);
  }
  for (const v of [10, 100, 1_000]) {
    const edges = [...chain(v)].reverse();
    const r = rounds(v, edges, 0);
    if (r.tries !== roundReads(v)) {
      throw new Error(
        `거꾸로 놓은 사슬 ${v} 의 읽기 ${r.tries} 가 식과 다르다`,
      );
    }
    checked(v, edges, 0, r.dist);
    rows.push([
      "거꾸로 놓은 사슬",
      comma(v),
      comma(edges.length),
      `라운드 ${comma(r.rounds)} 번 · 간선 읽기 ${comma(r.tries)} 번`,
      "실행",
    ]);
  }
  const o = originNumbers();
  rows.push([
    "다이아몬드 사슬",
    comma(o.bigKV),
    comma(4 * BIG_K),
    `경로 조각 2^${comma(BIG_K + 2)} − 3 개 — ${comma(o.fragDigits)} 자리 수`,
    "식",
  ]);
  rows.push([
    "거꾸로 놓은 사슬",
    comma(V_LIMIT),
    comma(V_LIMIT - 1),
    `라운드 ${comma(V_LIMIT)} 번 · 간선 읽기 ${comma(o.roundReads)} 번`,
    "식",
  ]);
  return [
    md(["입력", "정점 V", "간선 E", "센 값", "센 방법"], rows, [1, 2]),
    "",
    `실행한 줄은 경로 조각이 모두 2^(k+2) − 3 개(k 는 다이아몬드 수), 간선 읽기가 모두 V × (V − 1) 번과 일치했고, 마지막 두 줄은 그 식으로 낸 값입니다. 간선 읽기 ${comma(o.roundReads)} 번은 1 초에 1 억 번 기준 ${o.roundSec}입니다.`,
  ].join("\n");
}

/** 경로 나열이 같은 계산을 몇 번 되풀이하는가 — 다이아몬드 둘. */
function naiveRepeat(): string {
  const d = diamonds(2);
  const r = enumeratePaths(d.n, d.edges, 0);
  const rows = r.arrive.map((c, v) => [String(v), String(c)]);
  const after = r.arrive.slice(4).reduce((a, b) => a + b, 0);
  return [
    md(["정점", "도착한 경로 조각"], rows, [1]),
    "",
    `조각 ${r.calls} 개 가운데 정점 3 에 ${r.arrive[3]} 개가 도착했고, 정점 3 뒤의 정점 4 · 5 · 6 에는 ${after} 개가 도착했습니다.`,
  ].join("\n");
}

/** 라운드 방식의 첫 라운드 — 전개 입력의 간선 목록 차례대로. */
function roundTrace(): string {
  const r = rounds(WALK_N, WALK_EDGES, 0);
  const rows = r.first.map((x) => [
    arrow(x.u, x.v),
    x.d === INF ? `dist[${x.u}] 가 Infinity` : `${plus(x.d, x.w)} = ${x.nd}`,
    num(x.before),
    x.improved
      ? `dist[${x.v}] = ${x.nd}`
      : x.d === INF
        ? "못 고친다"
        : "그대로",
  ]);
  const fixed = r.first.filter((x) => x.improved).length;
  const late = r.first.find((x) => x.u === 2 && x.v === 3) as Relax;
  return [
    md(["간선 u→v", "dist[u] + w", "그때 dist[v]", "한 일"], rows),
    "",
    `라운드 1 에서 간선 ${r.first.length} 개를 읽어 ${fixed} 번 고쳤습니다. 2→3 을 읽던 때 dist[2] 는 ${num(late.d)} 였고, 이 입력은 라운드 ${r.rounds} 번에서 끝납니다.`,
  ].join("\n");
}

/** 라운드마다 간선 목록을 다시 읽는 방식과 정점 순서를 정해 한 번씩 보는 방식. */
function roundVsOrder(): string {
  const chain1000 = chain(1_000);
  const cases: { label: string; n: number; edges: Edge[] }[] = [
    { label: "전개 입력 (정점 6 · 간선 7)", n: WALK_N, edges: WALK_EDGES },
    {
      label: "사슬 1,000 을 위상 순서로 적은 목록",
      n: 1_000,
      edges: chain1000,
    },
    {
      label: "같은 사슬을 거꾸로 적은 목록",
      n: 1_000,
      edges: [...chain1000].reverse(),
    },
  ];
  const got = cases.map((c) => ({
    c,
    r: rounds(c.n, c.edges, 0),
    o: byOrder(c.n, c.edges, 0, topoOrder(c.n, c.edges)),
  }));
  for (const g of got) {
    checked(g.c.n, g.c.edges, 0, g.r.dist);
    checked(g.c.n, g.c.edges, 0, g.o.dist);
  }
  return [
    md(
      [
        "입력",
        "라운드 수",
        "라운드 방식의 완화 시도",
        "위상 순서로 한 번씩 보는 방식의 완화 시도",
      ],
      got.map((g) => [
        g.c.label,
        comma(g.r.rounds),
        comma(g.r.tries),
        comma(g.o.tries),
      ]),
      [1, 2, 3],
    ),
    "",
    `세 입력의 간선 수는 ${dots(cases.map((c) => comma(c.edges.length)))} 개이고, 위상 순서로 한 번씩 보는 방식의 완화 시도는 ${dots(got.map((g) => comma(g.o.tries)))} 번입니다. 세 방식 모두 정본과 같은 답을 냈습니다.`,
  ].join("\n");
}

/** 순서 후보 넷을 같은 두 입력에 걸어 결과를 나란히 놓는다. */
function orderCandidates(): string {
  const walkTopo = topoOrder(WALK_N, WALK_EDGES);
  const backTopo = topoOrder(BACK_N, BACK_EDGES);
  const answerWalk = show(dagShortestPath(WALK_N, WALK_EDGES, 0));
  const answerBack = show(dagShortestPath(BACK_N, BACK_EDGES, 0));
  const numbers = (n: number): number[] =>
    Array.from({ length: n }, (_, i) => i);
  const candidates: { label: string; walk: number[]; back: number[] }[] = [
    {
      label: "번호가 작은 정점부터",
      walk: numbers(WALK_N),
      back: numbers(BACK_N),
    },
    {
      label: "간선 목록에 처음 나온 정점부터",
      walk: firstSeenOrder(WALK_N, WALK_EDGES),
      back: firstSeenOrder(BACK_N, BACK_EDGES),
    },
    {
      label: "위상 순서를 거꾸로",
      walk: [...walkTopo].reverse(),
      back: [...backTopo].reverse(),
    },
    { label: "위상 순서", walk: walkTopo, back: backTopo },
  ];
  let both = 0;
  const rows = candidates.map((c) => {
    const w = show(byOrder(WALK_N, WALK_EDGES, 0, c.walk).dist);
    const b = show(byOrder(BACK_N, BACK_EDGES, 0, c.back).dist);
    if (w === answerWalk && b === answerBack) both++;
    return [
      c.label,
      w,
      w === answerWalk ? "맞다" : "틀리다",
      b,
      b === answerBack ? "맞다" : "틀리다",
    ];
  });
  rows.push(["정본이 낸 답", answerWalk, "", answerBack, ""]);
  return [
    md(
      [
        "정점을 처리하는 순서",
        "전개 입력의 결과",
        "전개 입력",
        "번호를 거스르는 넷의 결과",
        "번호를 거스르는 넷",
      ],
      rows,
    ),
    "",
    `네 순서 가운데 두 입력에서 모두 정본과 같은 답을 낸 것은 ${both} 개입니다.`,
  ].join("\n");
}

/** 번호 순서로 처리하면 번호를 거스르는 넷에서 어디가 막히는가. */
function orderNumberTrace(): string {
  const order = Array.from({ length: BACK_N }, (_, i) => i);
  const r = byOrder(BACK_N, BACK_EDGES, 0, order);
  const rows = r.visits.map((x, i) => [
    String(i + 1),
    String(x.u),
    num(x.d),
    x.d === INF
      ? "건너뛴다"
      : x.relax.length === 0
        ? "나가는 간선이 없다"
        : x.relax
            .map(
              (y) =>
                `${arrow(y.u, y.v)} ${plus(y.d, y.w)} = ${y.nd}${y.improved ? " 고친다" : " 그대로"}`,
            )
            .join(" · "),
  ]);
  const topo = topoOrder(BACK_N, BACK_EDGES);
  const late = r.visits.find((x) => x.u === 1) as { d: number };
  return [
    md(["차례", "정점", "그때 dist[정점]", "한 일"], rows, [0]),
    "",
    `번호 순서로는 정점 1 의 차례에 dist[1] 이 아직 ${num(late.d)} 라서 1→3 을 완화하지 못했고, 답이 ${show(r.dist)} 로 나왔습니다. 위상 순서를 따라 ${dots(topo)} 차례로 보면 답이 ${show(dagShortestPath(BACK_N, BACK_EDGES, 0))} 입니다.`,
  ].join("\n");
}

/* ────────────────────────── 블록 — 아이디어 상세 ────────────────────────── */

const adjText = (v: number): string => {
  const out = adjacency(WALK_N, WALK_EDGES)[v] as [number, number][];
  return out.length === 0
    ? "없음"
    : out.map(([to, w]) => `(${to}, ${w})`).join(" ");
};

/** 1단계 — 이웃 목록과 진입 차수. */
function stageBuild(): string {
  const t1 = WALK[0] as Step;
  const rows = Array.from({ length: WALK_N }, (_, v) => [
    String(v),
    adjText(v),
    String(t1.indegree[v]),
  ]);
  const cells = adjacency(WALK_N, WALK_EDGES).reduce((a, x) => a + x.length, 0);
  const sum = t1.indegree.reduce((a, b) => a + b, 0);
  const zero = t1.indegree.flatMap((d, v) => (d === 0 ? [v] : []));
  return [
    md(["정점", "adj — (이웃, 가중치)", "indegree — 진입 차수"], rows, [2]),
    "",
    `이웃 목록의 칸은 모두 ${cells} 개이고 진입 차수의 합도 ${sum} 로 간선 수와 같습니다. 진입 차수가 0 인 정점은 ${dots(zero)} 입니다.`,
  ].join("\n");
}

/** 2단계 — 위상 순서가 자라는 모습. */
function stageOrder(): string {
  const t2 = WALK[1] as Step;
  const t3 = WALK[2] as Step;
  const rows: string[][] = [["—", "—", dots(t2.pushed), show(t2.order)]];
  let grown = [...t2.order];
  for (const p of t3.pops) {
    const pushed = p.decs.filter((d) => d.pushed).map((d) => d.v);
    grown = [...grown, ...pushed];
    rows.push([
      String(p.u),
      p.decs.length === 0
        ? "없음"
        : p.decs.map((d) => `${d.v}:${d.after}`).join(" "),
      pushed.length === 0 ? "없음" : dots(pushed),
      show(grown),
    ]);
  }
  return [
    md(
      [
        "꺼낸 정점",
        "줄인 진입 차수 — 정점:값",
        "0 이 되어 붙은 정점",
        "위상 순서",
      ],
      rows,
    ),
    "",
    `정점 ${t3.pops.length} 개를 한 번씩 꺼냈고, 위상 순서의 길이가 ${t3.order.length}${으로(t3.order.length)} 정점 수와 같습니다.`,
  ].join("\n");
}

/** 3단계 — 위상 순서대로 한 모든 완화. */
function stageRelax(): string {
  const rows: string[][] = [];
  let first = 0;
  let better = 0;
  let same = 0;
  for (const s of WALK) {
    for (const r of s.relax) {
      const what = !r.improved
        ? "그대로 둔다"
        : r.before === INF
          ? "처음 적는다"
          : "더 작게 고친다";
      if (what === "처음 적는다") first++;
      else if (what === "더 작게 고친다") better++;
      else same++;
      rows.push([
        s.t,
        arrow(r.u, r.v),
        `${plus(r.d, r.w)} = ${r.nd}`,
        num(r.before),
        what,
        num(r.improved ? r.nd : r.before),
      ]);
    }
  }
  const skipped = WALK.filter((s) => s.kind === "skip");
  const skippedEdges = skipped.reduce(
    (a, s) => a + WALK_EDGES.filter(([u]) => u === s.u).length,
    0,
  );
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
    `완화 ${rows.length} 번 가운데 처음 적은 것이 ${first} 번, 더 작게 고친 것이 ${better} 번, 그대로 둔 것이 ${same} 번입니다. 건너뛴 정점 ${dots(skipped.map((s) => s.u as number))} 에서 나가는 간선 ${skippedEdges} 개는 완화하지 않았습니다.`,
  ].join("\n");
}

/** 3단계의 핵심 성질 — 차례가 오기 전에 들어오는 간선을 다 봤는가. */
function stageTurn(): string {
  const rows: string[][] = [];
  let withIn = 0;
  let ok = 0;
  let changedAfter = 0;
  for (const v of WALK_ORDER) {
    const turn = turnOf(v);
    const at = WALK.indexOf(turn);
    const inc = WALK_EDGES.flatMap((e, i) => (e[1] === v ? [i] : []));
    const seen = inc.map((i) => {
      const [u] = WALK_EDGES[i] as Edge;
      const s = relaxedAt(i);
      const tail = turnOf(u);
      return {
        text: s ? `${arrow(u, v)} ${s.t}` : `${arrow(u, v)} ${tail.t} 건너뜀`,
        before: WALK.indexOf(s ?? tail) < at,
      };
    });
    if (inc.length > 0) withIn++;
    if (inc.length > 0 && seen.every((x) => x.before)) ok++;
    const after = WALK.slice(at + 1).filter((s) =>
      s.relax.some((r) => r.v === v && r.improved),
    ).length;
    changedAfter += after;
    rows.push([
      String(v),
      String(WALK_ORDER.indexOf(v)),
      seen.length === 0 ? "없음" : seen.map((x) => x.text).join(" · "),
      turn.t,
      String(after),
    ]);
  }
  return [
    md(
      [
        "정점",
        "위상 순서의 자리",
        "들어오는 간선과 그 간선을 본 걸음",
        "차례가 온 걸음",
        "차례 뒤에 dist 가 바뀐 횟수",
      ],
      rows,
      [1, 4],
    ),
    "",
    `들어오는 간선이 있는 정점 ${withIn} 개 가운데 ${ok} 개가 그 간선을 모두 차례보다 앞선 걸음에서 봤고, 차례가 온 뒤 dist 가 바뀐 횟수는 모두 합해 ${changedAfter} 번입니다.`,
  ].join("\n");
}

/** 크기 — 위상 순서로 처리하면 완화 시도가 무엇과 같아지는가. */
function relaxCount(): string {
  const cases: { label: string; n: number; edges: Edge[]; src: number }[] = [
    { label: "전개 입력", n: WALK_N, edges: WALK_EDGES, src: 0 },
    { label: "번호를 거스르는 넷", n: BACK_N, edges: BACK_EDGES, src: 0 },
    {
      label: "다이아몬드 16 개",
      n: diamonds(16).n,
      edges: diamonds(16).edges,
      src: 0,
    },
    { label: "사슬 1,000", n: 1_000, edges: chain(1_000), src: 0 },
  ];
  const rows = cases.map((c) => {
    const m = countCells(c.n, c.edges, c.src);
    return [
      c.label,
      comma(c.edges.length),
      comma(m.edgesFromReached),
      `${comma(m.reached)} / ${comma(c.n)}`,
    ];
  });
  const eq = cases.filter(
    (c) => countCells(c.n, c.edges, c.src).edgesFromReached === c.edges.length,
  ).length;
  return [
    md(
      ["입력", "간선 E", "완화 시도", "시작 정점에서 갈 수 있는 정점"],
      rows,
      [1, 2, 3],
    ),
    "",
    `네 입력 모두 완화 시도가 간선 수 이하이고, 그중 ${eq} 개는 간선 수와 같습니다.`,
  ].join("\n");
}

/** 전제 — 사이클이 있으면 위상 순서에 못 드는 정점이 생긴다. */
function premiseCycle(): string {
  const cases: { label: string; n: number; edges: Edge[] }[] = [
    {
      label: "0→1(1) 1→2(1) 2→1(1) 2→3(1)",
      n: 4,
      edges: [
        [0, 1, 1],
        [1, 2, 1],
        [2, 1, 1],
        [2, 3, 1],
      ],
    },
    {
      label: "0→0(1) 0→1(1)",
      n: 2,
      edges: [
        [0, 0, 1],
        [0, 1, 1],
      ],
    },
  ];
  const rows = cases.map((c) => {
    const a = show(dagShortestPath(c.n, c.edges, 0));
    const b = show(rounds(c.n, c.edges, 0).dist);
    return [
      c.label,
      show(topoOrder(c.n, c.edges)),
      a,
      b,
      a === b ? "같다" : "다르다",
    ];
  });
  const lens = cases.map((c) => topoOrder(c.n, c.edges).length);
  const wrong = cases.map((c) => {
    const a = dagShortestPath(c.n, c.edges, 0);
    const b = rounds(c.n, c.edges, 0).dist;
    return a.filter((x, v) => x !== b[v]).length;
  });
  return [
    md(["입력", "위상 순서", "정본의 답", "라운드 방식의 답", "두 답"], rows),
    "",
    `위상 순서의 길이가 ${dots(lens)}${으로(lens.at(-1) ?? 0)} 정점 수 ${dots(cases.map((c) => c.n))} 보다 짧고, 두 답이 어긋난 정점은 ${dots(wrong)} 개입니다.`,
  ].join("\n");
}

/* ────────────────────────── 블록 — 수행으로 알아보는 알고리즘 ────────────────────────── */

/** 고정 입력과 나와야 하는 값. */
function walkInput(): string {
  const body = WALK_EDGES.map(([u, v, w]) => `[${u}, ${v}, ${w}]`).join(", ");
  return [
    `const n = ${WALK_N};`,
    "const edges: [number, number, number][] = [",
    `  ${body},`,
    "];",
    `const src = ${WALK_SRC};`,
    `// 이 절이 끝나면 나와야 하는 값: ${show(dagShortestPath(WALK_N, WALK_EDGES, WALK_SRC))}`,
  ].join("\n");
}

/** T1 이 끝난 시점. */
function walkT1(): string {
  const t1 = WALK[0] as Step;
  const adj = Array.from({ length: WALK_N }, (_, v) => {
    const out = adjacency(WALK_N, WALK_EDGES)[v] as [number, number][];
    return `${v}:[${out.map(([to, w]) => `(${to}, ${w})`).join(" ")}]`;
  }).join(" ");
  return [
    "T1 이 끝난 시점",
    ...lines(
      [
        ["adj", adj],
        ["indegree", show(t1.indegree)],
      ],
      "  ",
    ),
  ].join("\n");
}

/** T2 · T3 이 끝난 시점. */
function walkT2T3(): string {
  const t2 = WALK[1] as Step;
  const t3 = WALK[2] as Step;
  return [
    ...lines([
      [`${t2.t} 이 끝난 시점`, `order ${show(t2.order)}`],
      [
        `${t3.t} 이 끝난 시점`,
        `order ${show(t3.order)} · indegree ${show(t3.indegree)}`,
      ],
    ]),
  ].join("\n");
}

const MUTANT_CASES: { label: string; n: number; edges: Edge[]; src: number }[] =
  [
    { label: "전개 입력", n: WALK_N, edges: WALK_EDGES, src: 0 },
    { label: "사슬 0→1→2→3", n: 4, edges: chain(4), src: 0 },
    { label: "번호를 거스르는 넷", n: BACK_N, edges: BACK_EDGES, src: 0 },
    { label: "간선이 없는 네 정점", n: 4, edges: [], src: 0 },
  ];

/** 위상 순서의 길이를 미리 붙잡으면 어디서 갈리는가. */
function mutantFrozenLength(): string {
  const rows = MUTANT_CASES.map((c) => {
    const a = show(dagShortestPath(c.n, c.edges, c.src));
    const b = show(frozenLength.dagShortestPath(c.n, c.edges, c.src));
    return [c.label, a, b, a === b ? "같다" : "어긋난다"];
  });
  if (!중화됨 && rows.every((r) => r[3] === "같다")) {
    throw new Error("길이를 붙잡은 변이가 어느 입력에서도 답을 안 바꿨다");
  }
  const seeds = (WALK[1] as Step).order;
  const frozen = frozenOrder(WALK_N, WALK_EDGES);
  const missed = WALK_ORDER.filter((v) => !frozen.includes(v));
  return [
    md(
      ["입력", "길이를 그때그때 읽는 답", "길이를 미리 붙잡은 답", "두 답"],
      rows,
    ),
    "",
    `전개 입력에서 미리 붙잡은 길이는 ${seeds.length}${josa(seeds.length, "이라", "라")}, 반복이 앞자리 ${dots(seeds)} 만 꺼내고 끝납니다. 그때 order 는 ${show(frozen)} 이고 정점 ${dots(missed)}${은는(missed.at(-1) ?? 0)} 위상 순서에 들지 못합니다.`,
  ].join("\n");
}

/** 길이를 미리 붙잡은 판이 만드는 order — 변이와 같은 절차를 order 까지 돌려주게 옮긴 사본. */
function frozenOrder(n: number, edges: Edge[]): number[] {
  const adj = adjacency(n, edges);
  const indegree: number[] = Array.from({ length: n }, () => 0);
  for (const [, v] of edges) indegree[v] = (indegree[v] as number) + 1;
  const order: number[] = [];
  for (let v = 0; v < n; v++) if (indegree[v] === 0) order.push(v);
  for (let i = 0, len = order.length; i < len; i++) {
    const u = order[i] as number;
    for (const [v] of adj[u] as [number, number][]) {
      indegree[v] = (indegree[v] as number) - 1;
      if (indegree[v] === 0) order.push(v);
    }
  }
  return order;
}

/** 반복이 끝나는 자리 — i 가 order.length 를 따라잡는 순간. */
function frozenCount(): string {
  const t2 = WALK[1] as Step;
  const t3 = WALK[2] as Step;
  const rows: string[][] = [];
  let len = t2.order.length;
  t3.pops.forEach((p, i) => {
    const before = len;
    len += p.decs.filter((d) => d.pushed).length;
    rows.push([String(i), String(before), String(p.u), String(len)]);
  });
  const times = Array.from(
    { length: WALK_N },
    (_, v) => t3.order.filter((x) => x === v).length,
  );
  return [
    md(
      [
        "i",
        "읽기 전 order.length",
        "읽은 정점 order[i]",
        "읽은 뒤 order.length",
      ],
      rows,
      [0, 1, 3],
    ),
    "",
    `i 가 ${t3.pops.length} 이 되는 순간 order.length 도 ${len} 이라 반복이 끝납니다. 정점마다 위상 순서에 붙은 횟수는 ${dots([...new Set(times)])} 번입니다.`,
  ].join("\n");
}

/** T4 ~ T7 — 시작값과 앞 세 정점. */
function walkT4T7(): string {
  const rows: [string, string][] = [];
  for (const s of WALK.slice(3, 7)) {
    if (s.kind === "start") {
      rows.push([s.t, `dist ${show(s.dist as number[])}`]);
      continue;
    }
    const u = s.u as number;
    if (s.kind === "skip") {
      rows.push([
        `${s.t}  정점 ${u}`,
        `dist[${u}] === Infinity 가 참 → 건너뛴다`,
      ]);
      continue;
    }
    rows.push([
      `${s.t}  정점 ${u}`,
      `${s.relax.map((r) => `${arrow(r.u, r.v)} ${plus(r.d, r.w)} = ${r.nd}`).join(" · ")} → ${s.relax.filter((r) => r.improved).length} 개를 고친다`,
    ]);
    rows.push(["", `dist ${show(s.dist as number[])}`]);
  }
  return lines(rows).join("\n");
}

const GREEDY_CASES: { label: string; n: number; edges: Edge[] }[] = [
  { label: "전개 입력", n: WALK_N, edges: WALK_EDGES },
  { label: "사슬 0→1→2→3 (가중치 전부 1)", n: 4, edges: chain(4) },
  {
    label: "0→1(5) 0→2(1) 1→2(-10)",
    n: 3,
    edges: [
      [0, 1, 5],
      [0, 2, 1],
      [1, 2, -10],
    ],
  },
  {
    label: "0→1(5) 0→2(1) 1→2(-10) 2→3(2)",
    n: 4,
    edges: [
      [0, 1, 5],
      [0, 2, 1],
      [1, 2, -10],
      [2, 3, 2],
    ],
  },
];

/** 「지금 가장 작은 값부터 확정한다」로 바꾸면 어디서 갈리는가. */
function pauseGreedy(): string {
  const rows = GREEDY_CASES.map((c) => {
    const a = show(dagShortestPath(c.n, c.edges, 0));
    const b = show(greedy(c.n, c.edges, 0).dist);
    return [c.label, a, b, a === b ? "같다" : "다르다"];
  });
  const diff = rows.filter((r) => r[3] === "다르다").length;
  return [
    md(
      ["입력", "위상 순서로 완화한 답", "가장 작은 값부터 확정한 답", "두 답"],
      rows,
    ),
    "",
    `네 입력 가운데 두 답이 다른 것은 ${diff} 개이고, 둘 다 음수 간선이 있는 입력입니다.`,
  ].join("\n");
}

/** 두 판이 갈리는 자리 — 0→1(5) 0→2(1) 1→2(-10). */
function pauseGreedyWhere(): string {
  const c = GREEDY_CASES[2] as { n: number; edges: Edge[] };
  const g = greedy(c.n, c.edges, 0);
  const rows = g.picks.map((p, i) => [
    String(i + 1),
    String(p.u),
    show(p.dist),
    p.blocked.length === 0
      ? "—"
      : p.blocked
          .map(
            (b) =>
              `${arrow(b.u, b.v)} 가 ${plus(b.d, b.w)} = ${b.nd} 를 만들었지만 ${b.v} 는 이미 확정이라 못 받는다`,
          )
          .join(" · "),
  ]);
  const topo = topoOrder(c.n, c.edges);
  return [
    md(["확정한 차례", "확정한 정점", "확정한 뒤 dist", "버린 값"], rows, [0]),
    "",
    `가장 작은 값부터 확정한 답은 ${show(g.dist)} 입니다. 위상 순서는 ${dots(topo)} 차례라 정점 1 이 정점 2 보다 앞이고, 그 차례로 완화한 답은 ${show(dagShortestPath(c.n, c.edges, 0))} 입니다.`,
  ].join("\n");
}

/** 열 걸음을 끝까지 — 조건 판정과 한 일. */
function walkTrace(): string {
  const rows: string[][] = [];
  for (const s of WALK) {
    let cond = "—";
    let did = "";
    if (s.kind === "build") {
      did = `간선 ${WALK_EDGES.length} 개를 adj 와 indegree 로 옮긴다`;
    } else if (s.kind === "seeds") {
      cond = `① indegree[v] === 0 이 참인 v — ${dots(s.pushed)}`;
      did = `${dots(s.pushed)}${을를(s.pushed.at(-1) ?? 0)} 위상 순서의 앞자리에 놓는다`;
    } else if (s.kind === "order") {
      const decs = s.pops.flatMap((p) => p.decs);
      cond = `② indegree[v] === 0 이 ${decs.length} 번 판정되어 ${decs.filter((d) => d.pushed).length} 번 참`;
      did = `${s.pops
        .flatMap((p) =>
          p.decs.filter((d) => d.pushed).map((d) => `${p.u} 뒤에 ${d.v}`),
        )
        .join(" · ")}${을를(s.pushed.at(-1) ?? 0)} 붙인다`;
    } else if (s.kind === "start") {
      did = `③ dist[${WALK_SRC}] = 0 · 나머지 Infinity`;
    } else {
      const u = s.u as number;
      const d = (WALK[WALK.indexOf(s) - 1] as Step).dist?.[u] as number;
      cond = `④ dist[${u}] === Infinity 가 **${s.kind === "skip" ? "참" : "거짓"}** (dist[${u}] = ${num(d)})`;
      did =
        s.kind === "skip"
          ? "건너뛴다"
          : s.relax.length === 0
            ? "나가는 간선이 없다"
            : `⑤ ${s.relax
                .map(
                  (r) =>
                    `${arrow(r.u, r.v)} ${r.nd} < ${num(r.before)} ${r.improved ? "참 · 고친다" : "거짓 · 그대로"}`,
                )
                .join(" / ")}`;
    }
    rows.push([
      s.t,
      s.u === null ? "—" : String(s.u),
      cond,
      did,
      show(s.order),
      s.dist === null ? "—" : show(s.dist),
    ]);
  }
  const visits = WALK.filter((s) => s.kind === "visit");
  const relaxes = visits.flatMap((s) => s.relax);
  const withRelax = visits.filter((s) => s.relax.length > 0);
  return [
    md(["걸음", "정점", "조건 판정", "한 일", "order", "dist"], rows),
    "",
    `① 은 ${(WALK[1] as Step).t} 에서 정점 ${(WALK[1] as Step).pushed.length} 개를 놓았고, ② 는 ${(WALK[2] as Step).t} 에서 참 ${(WALK[2] as Step).pushed.length} 번 · 거짓 ${
      (WALK[2] as Step).pops.flatMap((p) => p.decs).filter((d) => !d.pushed)
        .length
    } 번, ③ 은 ${(WALK[3] as Step).t} 에서 한 번 실행됐습니다. ④ 는 ${ts(WALK.filter((s) => s.kind === "skip"))} 에서 참이고 ${ts(visits)} 에서 거짓입니다. ⑤ 의 비교는 ${ts(withRelax)} 에서 ${relaxes.length} 번 일어나 참 ${relaxes.filter((r) => r.improved).length} 번 · 거짓 ${relaxes.filter((r) => !r.improved).length} 번입니다. 반환값은 ${show(WALK_DIST)} 입니다.`,
  ].join("\n");
}

/** 건너뛰는 줄을 지우면 답과 완화 시도가 각각 어떻게 되는가. */
function pauseNoSkip(): string {
  const cases: { label: string; n: number; edges: Edge[]; src: number }[] = [
    { label: "전개 입력", n: WALK_N, edges: WALK_EDGES, src: 0 },
    {
      label: "사슬 1,000 · 시작 정점이 한가운데 (정점 500)",
      n: 1_000,
      edges: chain(1_000),
      src: 500,
    },
    {
      label: "사슬 1,000 · 시작 정점이 끝 (정점 999)",
      n: 1_000,
      edges: chain(1_000),
      src: 999,
    },
  ];
  const rows = cases.map((c) => {
    const a = show(dagShortestPath(c.n, c.edges, c.src));
    const b = show(noSkip.dagShortestPath(c.n, c.edges, c.src));
    if (!중화됨 && a !== b) {
      throw new Error(`건너뛰는 줄을 지웠더니 답이 갈렸다 — ${c.label}`);
    }
    const m = countCells(c.n, c.edges, c.src);
    return [
      c.label,
      `${comma(m.reached)} / ${comma(c.n)}`,
      comma(countTries(c.n, c.edges, c.src, true)),
      comma(countTries(c.n, c.edges, c.src, false)),
      a === b ? "칸마다 같다" : "어긋난다",
    ];
  });
  return md(
    [
      "입력",
      "갈 수 있는 정점",
      "줄이 있을 때 완화 시도",
      "줄을 지웠을 때 완화 시도",
      "두 답",
    ],
    rows,
    [1, 2, 3],
  );
}

/** 그 줄이 없을 때 정점 4 에서 일어나는 일 — 수의 연산을 실제로 한다. */
function pauseNoSkipWhere(): string {
  const d4 = (turnOf(4).dist as readonly number[])[4] as number;
  const [, , w] = WALK_EDGES.find(([u, v]) => u === 4 && v === 0) as Edge;
  const nd = d4 + w;
  const d0 = (turnOf(4).dist as readonly number[])[0] as number;
  return [
    ...lines([
      ["dist[4]", num(d4)],
      ["4→0 이 만드는 값", `${plus(d4, w)} = ${num(nd)}`],
      [`${num(nd)} < dist[0]`, `${num(nd)} < ${num(d0)} → ${String(nd < d0)}`],
    ]),
  ].join("\n");
}

/** 전체 코드를 여러 입력에 실행한 결과. */
function walkResult(): string {
  const cases: { n: number; edges: Edge[]; src: number }[] = [
    { n: WALK_N, edges: WALK_EDGES, src: 0 },
    {
      n: 4,
      edges: [
        [0, 1, 5],
        [0, 2, 3],
        [1, 3, -2],
        [2, 3, 1],
      ],
      src: 0,
    },
    {
      n: 4,
      edges: [
        [2, 3, 1],
        [1, 2, 1],
        [0, 1, 1],
      ],
      src: 0,
    },
    {
      n: 3,
      edges: [
        [0, 2, 1],
        [1, 2, 1],
      ],
      src: 2,
    },
    { n: 3, edges: [], src: 1 },
    { n: 1, edges: [], src: 0 },
  ];
  const calls = cases.map(
    (c) =>
      `dagShortestPath(${c.n}, [${c.edges.map((e) => `[${e.join(",")}]`).join(",")}], ${c.src})`,
  );
  const w = Math.max(...calls.map((c) => c.length));
  return [
    ...cases.map(
      (c, i) =>
        `${pad(calls[i] as string, w)}  -> ${show(dagShortestPath(c.n, c.edges, c.src))}`,
    ),
  ].join("\n");
}

/* ────────────────────────── 블록 — 알아 두면 좋은 개념 ────────────────────────── */

/** 값마다 기대는 값 — 간선의 방향이 곧 그 관계다. */
function relatedDeps(): string {
  const heads = [...new Set(WALK_EDGES.map(([, v]) => v))].sort(
    (a, b) => WALK_ORDER.indexOf(a) - WALK_ORDER.indexOf(b),
  );
  const rows = heads.map((v) => {
    const inc = WALK_EDGES.filter(([, h]) => h === v);
    return [
      `dist[${v}]`,
      dots(inc.map(([u]) => `dist[${u}]`)),
      dots(inc.map(([u]) => arrow(u, v))),
      turnOf(v).t,
    ];
  });
  const pairs = heads.reduce(
    (a, v) => a + WALK_EDGES.filter(([, h]) => h === v).length,
    0,
  );
  return [
    md(["값", "기대는 값", "그 관계를 만든 간선", "값이 정해진 걸음"], rows),
    "",
    `기대는 관계 ${pairs} 개가 간선 ${WALK_EDGES.length} 개와 하나씩 짝이 맞고, 값이 정해진 걸음은 위상 순서를 따릅니다.`,
  ].join("\n");
}

/* ────────────────────────── 블록 — 경쟁 설계와의 대조 ────────────────────────── */

const BENCH = benchJson as Record<string, number>;
const bench = (key: string): number => {
  const v = BENCH[key];
  if (v === undefined) throw new Error(`bench 에 ${key} 가 없다`);
  return v;
};

/** 두 설계를 같은 간선 목록들에 걸어 센 기본 연산. */
function altTable(): string {
  const rows = [
    ["전개 입력 (정점 6 · 간선 7)", "전개 입력"],
    ["조각 1 개 (위상 순서 그대로)", "조각 1"],
    ["조각 3 개", "조각 3"],
    ["조각 4 개", "조각 4"],
    ["조각 1,000 개 (간선마다 거꾸로)", "조각 1000"],
  ].map(([label, key]) => {
    const a = bench(`이 가이드의 절차 · ${key} · 기본 연산`);
    const b = bench(`벨만-포드 · ${key} · 기본 연산`);
    return [
      label as string,
      comma(a),
      comma(b),
      a < b ? "이 가이드의 절차" : "벨만-포드",
      `${(Math.max(a, b) / Math.min(a, b)).toFixed(1)} 배`,
    ];
  });
  return [
    md(
      ["간선 목록", "이 가이드의 절차", "벨만-포드", "적은 쪽", "차이"],
      rows,
      [1, 2, 4],
    ),
    "",
    `저장 칸은 이 가이드의 절차가 ${comma(bench("이 가이드의 절차 · 저장 칸"))} 개, 벨만-포드가 ${comma(bench("벨만-포드 · 저장 칸"))} 개입니다.`,
  ].join("\n");
}

/** 경계가 조각 4 개인 까닭 — 라운드 수로 푼다. */
function altBoundary(): string {
  // 벨만-포드의 저장 칸은 거리 배열 하나라 정점 수 V 와 같다(`.alt.ts` 의 `cells: n`).
  const ALT_V = bench("벨만-포드 · 저장 칸");
  const mine = bench("이 가이드의 절차 · 조각 1 · 기본 연산");
  const e = bench("경계 · 간선");
  const r3 = bench("경계 · 조각 3 의 라운드");
  const r4 = bench("경계 · 조각 4 의 라운드");
  const f3 = ALT_V + r3 * e;
  const f4 = ALT_V + r4 * e;
  if (f3 !== bench("벨만-포드 · 조각 3 · 기본 연산")) {
    throw new Error(`식 ${f3} 이 실측과 다르다`);
  }
  if (f4 !== bench("벨만-포드 · 조각 4 · 기본 연산")) {
    throw new Error(`식 ${f4} 이 실측과 다르다`);
  }
  const flip = bench("경계 · 순서가 뒤집히는 조각 수");
  return [
    md(
      ["항목", "값", "근거"],
      [
        [
          "이 가이드의 절차의 기본 연산",
          comma(mine),
          "간선 목록의 순서와 무관하게 같다",
        ],
        [
          "벨만-포드의 시작값",
          comma(ALT_V),
          `거리 배열 V = ${comma(ALT_V)} 칸을 만든다`,
        ],
        ["벨만-포드의 한 라운드", comma(e), "간선을 E 개 읽는다"],
        [
          "조각 3 개일 때",
          `라운드 ${r3}`,
          `${comma(ALT_V)} + ${r3} × ${comma(e)} = ${comma(f3)}`,
        ],
        [
          "조각 4 개일 때",
          `라운드 ${r4}`,
          `${comma(ALT_V)} + ${r4} × ${comma(e)} = ${comma(f4)}`,
        ],
      ],
    ),
    "",
    `라운드가 ${r4} 번이 되는 조각 ${flip} 개에서 벨만-포드의 ${comma(f4)} 이 이 가이드의 절차의 ${comma(mine)} 을 넘습니다.`,
  ].join("\n");
}

/* ────────────────────────── 블록 — 수식 정의와 유도 ────────────────────────── */

/** 정의를 값에 넣어 본다 — P(2) · P(3) · P(4). */
function mathPaths(): string {
  const rows: [string, string][] = [];
  for (const v of [2, 3, 4]) {
    const ps = pathsTo(WALK_N, WALK_EDGES, WALK_SRC, v);
    rows.push([
      `P(${v})`,
      ps.length === 0
        ? "원소가 하나도 없다 — 공집합"
        : ps.map((p) => `${p.path.join("→")} (cost ${p.cost})`).join(" · "),
    ]);
    rows.push([
      `opt(${v})`,
      ps.length === 0
        ? "공집합의 최솟값 = Infinity"
        : `min{${ps.map((p) => p.cost).join(", ")}} = ${Math.min(...ps.map((p) => p.cost))}`,
    ]);
  }
  return lines(rows).join("\n");
}

/** 정의를 전개 입력 전체에 넣어 검산한다. */
function mathCheck(): string {
  const enumerated = enumeratePaths(WALK_N, WALK_EDGES, WALK_SRC);
  const got = dagShortestPath(WALK_N, WALK_EDGES, WALK_SRC);
  return md(
    ["정점 v", "경로를 전부 만들어 고른 최솟값", "이 절차의 dist[v]", "두 값"],
    Array.from({ length: WALK_N }, (_, v) => {
      const a = enumerated.dist[v] as number;
      const b = got[v] as number;
      return [String(v), num(a), num(b), a === b ? "같다" : "다르다"];
    }),
    [1, 2],
  );
}

/** P(3) 을 마지막 간선으로 가른다. */
function mathSplit(): string {
  const inc = WALK_EDGES.filter(([, v]) => v === 3);
  const rows = inc.map(([u, , w]) => {
    const ps = pathsTo(WALK_N, WALK_EDGES, WALK_SRC, u);
    const best = Math.min(...ps.map((p) => p.cost));
    return [
      `${arrow(u, 3)} (가중치 ${w})`,
      `P(${u}) — ${ps.map((p) => p.path.join("→")).join(" · ")}`,
      String(best),
      `${plus(best, w)} = ${best + w}`,
    ];
  });
  const opt = Math.min(
    ...inc.map(([u, , w]) => {
      const ps = pathsTo(WALK_N, WALK_EDGES, WALK_SRC, u);
      return Math.min(...ps.map((p) => p.cost)) + w;
    }),
  );
  return [
    md(
      [
        "마지막 간선",
        "앞부분의 집합",
        "앞부분의 최솟값",
        "마지막 간선을 더한 값",
      ],
      rows,
      [2],
    ),
    "",
    `셋 가운데 가장 작은 ${opt}${이가(opt)} opt(3) 이고, 정본의 dist[3] 도 ${WALK_DIST[3]} 입니다.`,
  ].join("\n");
}

/** 닫힌 형태 2^k 를 실제로 센 경로 수와 맞대고 규모를 넣는다. */
function mathScale(): string {
  const rows: string[][] = [];
  for (const k of [1, 2, 3, 4, 8, 16, 20]) {
    const d = diamonds(k);
    rows.push([
      comma(k),
      comma(2 ** k),
      comma(countPaths(d.n, d.edges, 0, d.last)),
      comma(d.edges.length),
    ]);
  }
  const same = rows.filter((r) => r[1] === r[2]).length;
  return [
    md(
      ["다이아몬드 k", "닫힌 형태 2^k", "실제로 센 경로 수", "간선 E = 4k"],
      rows,
      [0, 1, 2, 3],
    ),
    "",
    `닫힌 형태가 실제로 센 값과 ${rows.length} 줄 가운데 ${same} 줄에서 같습니다. 규모의 상한 V = ${comma(V_LIMIT)} 에서 다이아몬드 수는 k = ${comma(BIG_K)} 이고 경로 수 2^k 는 ${comma(pow2Digits(BIG_K))} 자리 수인데, 간선을 한 번씩 읽으면 E = 4k = ${comma(4 * BIG_K)} 번입니다.`,
  ].join("\n");
}

/* ────────────────────────── 블록 — 불변식 ────────────────────────── */

/** 정점 2 의 차례가 지난 시점. */
function invariantT9(): string {
  const t = turnOf(2);
  const at = WALK_ORDER.indexOf(2);
  const inc = WALK_EDGES.filter(([, v]) => v === 2);
  const dist = t.dist as readonly number[];
  return [
    md(
      ["항목", "값"],
      [
        ["지난 걸음", `${t.t} — 위상 순서의 앞에서 ${at + 1} 개를 봤다`],
        [
          "2 로 들어오는 간선",
          dots(inc.map(([u, , w]) => `${arrow(u, 2)}(${w})`)),
        ],
        [
          "그 꼬리의 자리",
          dots(inc.map(([u]) => `정점 ${u} 은 자리 ${WALK_ORDER.indexOf(u)}`)),
        ],
        [
          "dist[2]",
          `min(${inc.map(([u, , w]) => plus(WALK_DIST[u] as number, w)).join(", ")}) = ${dist[2]}`,
        ],
      ],
    ),
    "",
    `정점 2 의 자리는 ${at} 이고 들어오는 간선의 꼬리가 모두 그보다 앞입니다. 그 뒤 걸음에서 dist[2] 가 바뀐 횟수는 ${WALK.slice(WALK.indexOf(t) + 1).filter((s) => s.relax.some((r) => r.v === 2 && r.improved)).length} 번입니다.`,
  ].join("\n");
}

/** 경계 입력들 — 정본의 답과 경로를 전부 만든 답, 완화 계수. */
function invariantEdges(): string {
  const cases: { label: string; n: number; edges: Edge[]; src: number }[] = [
    { label: "정점이 하나뿐이다 (1, [], 0)", n: 1, edges: [], src: 0 },
    { label: "간선이 하나도 없다 (3, [], 1)", n: 3, edges: [], src: 1 },
    {
      label: "시작 정점에서 나가는 간선이 없다 (3, [[0,2,1],[1,2,1]], 2)",
      n: 3,
      edges: [
        [0, 2, 1],
        [1, 2, 1],
      ],
      src: 2,
    },
    {
      label: "갈 수 없는 정점이 있다 (전개 입력)",
      n: WALK_N,
      edges: WALK_EDGES,
      src: 0,
    },
    {
      label: "가중치가 0 이다 (3, [[0,1,0],[1,2,0]], 0)",
      n: 3,
      edges: [
        [0, 1, 0],
        [1, 2, 0],
      ],
      src: 0,
    },
    {
      label: "같은 두 정점에 간선이 여럿이다 (2, [[0,1,10],[0,1,-3]], 0)",
      n: 2,
      edges: [
        [0, 1, 10],
        [0, 1, -3],
      ],
      src: 0,
    },
  ];
  let same = 0;
  const rows = cases.map((c) => {
    const got = dagShortestPath(c.n, c.edges, c.src);
    const brute = enumeratePaths(c.n, c.edges, c.src).dist;
    if (sameArr(got, brute)) same++;
    const m = countCells(c.n, c.edges, c.src);
    return [
      c.label,
      show(topoOrder(c.n, c.edges)),
      show(got),
      String(m.edgesFromReached),
      String(m.fixes),
    ];
  });
  return [
    md(
      ["경계 입력", "위상 순서", "결과", "완화 시도", "값을 고친 완화"],
      rows,
      [3, 4],
    ),
    "",
    `여섯 입력 가운데 ${same} 개에서 정본의 답이 경로를 전부 만들어 고른 답과 같습니다.`,
  ].join("\n");
}

const WRITE_CASES: { label: string; n: number; edges: Edge[] }[] = [
  { label: "전개 입력", n: WALK_N, edges: WALK_EDGES },
  { label: "사슬 0→1→2→3", n: 4, edges: chain(4) },
  {
    label: "0→1(1) 0→2(2) 1→3(1) 2→3(2)",
    n: 4,
    edges: [
      [0, 1, 1],
      [0, 2, 2],
      [1, 3, 1],
      [2, 3, 2],
    ],
  },
  {
    label: "0→1(5) 0→2(1) 1→3(-10) 2→3(1)",
    n: 4,
    edges: [
      [0, 1, 5],
      [0, 2, 1],
      [1, 3, -10],
      [2, 3, 1],
    ],
  },
];

/** 비교를 지우고 언제나 고쳐 적으면 어디서 갈리는가. */
function mutantAlwaysWrite(): string {
  const rows = WRITE_CASES.map((c) => {
    const a = show(dagShortestPath(c.n, c.edges, 0));
    const b = show(alwaysWrite.dagShortestPath(c.n, c.edges, 0));
    return [c.label, a, b, a === b ? "같다" : "어긋난다"];
  });
  if (!중화됨 && rows.every((r) => r[3] === "같다")) {
    throw new Error("비교를 지운 변이가 어느 입력에서도 답을 안 바꿨다");
  }
  return md(
    ["입력", "작을 때만 고쳐 적는 답", "언제나 고쳐 적는 답", "두 답"],
    rows,
  );
}

/** 두 판이 갈리는 자리 — 정점 3 의 값을 완화마다 따라간다. */
function mutantAlwaysWriteWhere(): string {
  const c = WRITE_CASES[2] as { n: number; edges: Edge[] };
  const keep = watchWrites(c.n, c.edges, 0, true, 3);
  const over = watchWrites(c.n, c.edges, 0, false, 3);
  checked(c.n, c.edges, 0, keep.dist);
  if (!중화됨) {
    const m = alwaysWrite.dagShortestPath(c.n, c.edges, 0);
    if (!sameArr(m, over.dist)) {
      throw new Error("비교를 끈 사본이 변이와 다른 답을 냈다");
    }
  }
  const rows = keep.rows.map((k, i) => {
    const o = over.rows[i] as { relax: Relax; after: number };
    return [
      arrow(k.relax.u, k.relax.v),
      `${plus(k.relax.d, k.relax.w)} = ${k.relax.nd}`,
      num(k.after),
      num(o.after),
    ];
  });
  return [
    md(
      [
        "정점 3 으로 들어오는 간선",
        "후보",
        "비교하는 판의 dist[3]",
        "언제나 적는 판의 dist[3]",
      ],
      rows,
    ),
    "",
    `위상 순서는 ${show(topoOrder(c.n, c.edges))} 이고, 끝난 뒤 dist[3] 은 비교하는 판이 ${num(keep.dist[3] as number)}, 언제나 적는 판이 ${num(over.dist[3] as number)} 입니다.`,
  ].join("\n");
}

/* ────────────────────────── 블록 — 비용 계산 ────────────────────────── */

/** 전개의 걸음으로 센 무리. */
function perfCount(): string {
  const t1 = WALK[0] as Step;
  const t3 = WALK[2] as Step;
  const visits = WALK.filter((s) => s.kind === "visit");
  const skips = WALK.filter((s) => s.kind === "skip");
  const relaxes = visits.flatMap((s) => s.relax);
  const decs = t3.pops.flatMap((p) => p.decs).length;
  return [
    md(
      ["무리", "걸음", "횟수"],
      [
        ["간선을 adj 와 indegree 로 옮기기", t1.t, String(WALK_EDGES.length)],
        [
          "위상 순서에 붙이기",
          `${(WALK[1] as Step).t} · ${t3.t}`,
          String(t3.order.length),
        ],
        ["진입 차수 줄이기", t3.t, String(decs)],
        ["건너뛴 정점", ts(skips), String(skips.length)],
        ["완화한 정점 R", ts(visits), String(visits.length)],
        [
          "완화 시도 E_R",
          ts(visits.filter((s) => s.relax.length > 0)),
          String(relaxes.length),
        ],
        [
          "값을 고친 완화 c",
          ts(visits.filter((s) => s.relax.some((r) => r.improved))),
          String(relaxes.filter((r) => r.improved).length),
        ],
      ],
      [2],
    ),
    "",
    `정점 V = ${WALK_N} · 간선 E = ${WALK_EDGES.length} 인 입력에서 R = ${visits.length}, E_R = ${relaxes.length}, c = ${relaxes.filter((r) => r.improved).length} 입니다.`,
  ].join("\n");
}

/** 닫힌 형태가 실제 계수와 같은지 대조한다. */
function costClosedForm(): string {
  const cases: { label: string; n: number; edges: Edge[]; src: number }[] = [
    { label: "전개 입력", n: WALK_N, edges: WALK_EDGES, src: 0 },
    { label: "번호를 거스르는 넷", n: BACK_N, edges: BACK_EDGES, src: 0 },
    {
      label: "다이아몬드 16 개",
      n: diamonds(16).n,
      edges: diamonds(16).edges,
      src: 0,
    },
    { label: "사슬 1,000", n: 1_000, edges: chain(1_000), src: 0 },
    { label: "사슬 100,000", n: 100_000, edges: chain(100_000), src: 0 },
  ];
  let same = 0;
  const rows = cases.map((c) => {
    const m = countCells(c.n, c.edges, c.src);
    const f = closedForm(
      c.n,
      c.edges.length,
      m.reached,
      m.edgesFromReached,
      m.fixes,
    );
    if (f === m.cells) same++;
    return [
      c.label,
      comma(c.n),
      comma(c.edges.length),
      comma(m.reached),
      comma(m.edgesFromReached),
      comma(m.fixes),
      comma(m.cells),
      comma(f),
    ];
  });
  return [
    md(
      [
        "입력",
        "V",
        "E",
        "R",
        "E_R",
        "c",
        "실제 배열 칸 접근",
        "8V+6E+R+2E_R+c+1",
      ],
      rows,
      [1, 2, 3, 4, 5, 6, 7],
    ),
    "",
    `다섯 입력 가운데 ${same} 개에서 실제 배열 칸 접근과 식의 값이 같습니다.`,
  ].join("\n");
}

/** 규모의 상한을 채운 그래프 — 사슬 둘 겹과 i→i+3 셋. */
function limitGraph(
  w1: (i: number) => number,
  w2: (i: number) => number,
  w3: number,
): Edge[] {
  const edges: Edge[] = [];
  for (let i = 0; i + 1 < V_LIMIT; i++) edges.push([i, i + 1, w1(i)]);
  for (let i = 0; i + 2 < V_LIMIT; i++) edges.push([i, i + 2, w2(i)]);
  for (let i = 0; i < 3; i++) edges.push([i, i + 3, w3]);
  if (edges.length !== E_LIMIT) throw new Error(`간선 ${edges.length} 개`);
  return edges;
}

const SHAPE = limitGraph(
  (i) => (i % 9) + 1,
  (i) => ((i * 7) % 13) - 6,
  1,
);

/** 케이스가 갈리는 것은 상수배다. */
function perfCases(): string {
  const all = countCells(V_LIMIT, SHAPE, 0);
  const self = countCells(V_LIMIT, SHAPE, V_LIMIT - 1);
  return [
    md(
      ["입력 (V = 100,000 · E = 200,000)", "R", "E_R", "c", "배열 칸 접근"],
      [
        [
          "시작 정점에서 전부 갈 수 있다",
          comma(all.reached),
          comma(all.edgesFromReached),
          comma(all.fixes),
          comma(all.cells),
        ],
        [
          "시작 정점 자신뿐이다",
          comma(self.reached),
          comma(self.edgesFromReached),
          comma(self.fixes),
          comma(self.cells),
        ],
      ],
      [1, 2, 3, 4],
    ),
    "",
    `두 입력의 배열 칸 접근은 ${(all.cells / self.cells).toFixed(2)} 배 차이이고, 둘 다 8V + 6E + 1 = ${comma(8 * V_LIMIT + 6 * E_LIMIT + 1)} 이상 9V + 9E + 1 = ${comma(9 * V_LIMIT + 9 * E_LIMIT + 1)} 이하입니다.`,
  ].join("\n");
}

/** 갈 수 있는 정점 수를 바꾸면 계수가 얼마나 갈리는가. */
function shapeValues(): string {
  const cases: { label: string; src: number }[] = [
    { label: "시작 정점이 맨 앞 — 전부 갈 수 있다", src: 0 },
    { label: "시작 정점이 한가운데 — 절반만 갈 수 있다", src: V_LIMIT / 2 },
    { label: "시작 정점이 맨 뒤 — 자기 자신뿐이다", src: V_LIMIT - 1 },
  ];
  const ms = cases.map((c) => countCells(V_LIMIT, SHAPE, c.src));
  const first = ms[0] as ReturnType<typeof countCells>;
  const last = ms[2] as ReturnType<typeof countCells>;
  return [
    md(
      [
        "입력",
        "V",
        "E",
        "갈 수 있는 정점 R",
        "완화 시도 E_R",
        "고쳐 적기 c",
        "배열 칸 접근",
      ],
      cases.map((c, i) => {
        const m = ms[i] as ReturnType<typeof countCells>;
        return [
          c.label,
          comma(V_LIMIT),
          comma(SHAPE.length),
          comma(m.reached),
          comma(m.edgesFromReached),
          comma(m.fixes),
          comma(m.cells),
        ];
      }),
      [1, 2, 3, 4, 5, 6],
    ),
    "",
    `완화 시도는 ${comma(first.edgesFromReached)} 에서 ${comma(last.edgesFromReached)} 이 되는데 배열 칸 접근은 ${comma(first.cells)} 에서 ${comma(last.cells)} 로 ${Math.round((1 - last.cells / first.cells) * 100)} 퍼센트 줄었습니다. 맨 앞에서 시작한 입력의 고쳐 적기 ${comma(first.fixes)} 번은 완화 시도의 ${Math.round((first.fixes / first.edgesFromReached) * 100)} 퍼센트입니다.`,
  ].join("\n");
}

/**
 * 최악 — 간선마다 값을 고치게 만든 그래프. 정점 `j` 로 들어오는 간선의 가중치를 `2(j−i)−1` 로 두면
 * 앞 정점의 거리가 `i` 라 후보가 `2j − i − 1` 이 되고, 위상 순서에서 뒤에 보는 꼬리일수록 후보가
 * 작아진다.
 */
const WORST = limitGraph(
  () => 1,
  () => 3,
  5,
);

function worstMax(): string {
  const m = countCells(V_LIMIT, WORST, 0);
  const cap = 9 * V_LIMIT + 9 * E_LIMIT + 1;
  return [
    md(
      ["입력", "V", "E", "R", "E_R", "c", "배열 칸 접근", "9V + 9E + 1"],
      [
        [
          "i→i+1(1) · i→i+2(3) · i→i+3(5)",
          comma(V_LIMIT),
          comma(WORST.length),
          comma(m.reached),
          comma(m.edgesFromReached),
          comma(m.fixes),
          comma(m.cells),
          comma(cap),
        ],
      ],
      [1, 2, 3, 4, 5, 6, 7],
    ),
    "",
    `R = V, E_R = E, c = E_R 가 모두 차서 배열 칸 접근이 ${m.cells === cap ? "상한과 같습니다" : "상한에 못 미칩니다"}.`,
  ].join("\n");
}

/* ────────────────────────── 블록 — 스스로 점검하기 ────────────────────────── */

const CHANGED: Edge[] = WALK_EDGES.map(([u, v, w]) =>
  u === 1 && v === 2 ? [u, v, -20] : [u, v, w],
);
const CHANGED_WALK = record(WALK_N, CHANGED, WALK_SRC);

/** 바꾼 입력 — 가중치 하나. */
function selfcheckInput(): string {
  return [
    ...lines([
      ["바뀐 간선", "1→2 의 가중치 -4 → -20"],
      ["바꾸기 전 위상 순서", show(WALK_ORDER)],
      ["바꾸기 전 반환값", show(WALK_DIST)],
    ]),
  ].join("\n");
}

/** 답 — 같은 위상 순서를 따라 값만 내려간다. */
function selfcheckAnswer(): string {
  const order = (CHANGED_WALK.at(-1) as Step).order;
  const rows = CHANGED_WALK.filter(
    (s) => s.kind === "visit" && s.relax.length > 0,
  ).map((s) => [
    s.t,
    String(s.u),
    s.relax
      .map(
        (r) =>
          `${arrow(r.u, r.v)} ${plus(r.d, r.w)} = ${r.nd} ${r.improved ? "고친다" : "그대로"}`,
      )
      .join(" · "),
    show(s.dist as number[]),
  ]);
  const answer = dagShortestPath(WALK_N, CHANGED, WALK_SRC);
  return [
    md(["걸음", "정점", "완화", "dist"], rows),
    "",
    `위상 순서는 ${sameArr(order, WALK_ORDER) ? "바꾸기 전과 같은" : "바꾸기 전과 다른"} ${show(order)} 이고, 반환값은 ${show(answer)} 입니다.`,
  ].join("\n");
}

/* ────────────────────────── 블록 목록 ────────────────────────── */

export const PROOFS: Record<string, () => string> = {
  "concept-paths": conceptPaths,
  "concept-order": conceptOrder,
  "concept-turn": conceptTurn,
  "naive-scale": naiveScale,
  "naive-repeat": naiveRepeat,
  "round-trace": roundTrace,
  "round-vs-order": roundVsOrder,
  "order-candidates": orderCandidates,
  "order-number-trace": orderNumberTrace,
  "stage-build": stageBuild,
  "stage-order": stageOrder,
  "stage-relax": stageRelax,
  "stage-turn": stageTurn,
  "relax-count": relaxCount,
  "premise-cycle": premiseCycle,
  "walk-input": walkInput,
  "walk-t1": walkT1,
  "walk-t2t3": walkT2T3,
  "mutant-frozen-length": mutantFrozenLength,
  "frozen-count": frozenCount,
  "walk-t4t7": walkT4T7,
  "pause-greedy": pauseGreedy,
  "pause-greedy-where": pauseGreedyWhere,
  "walk-trace": walkTrace,
  "pause-noskip": pauseNoSkip,
  "pause-noskip-where": pauseNoSkipWhere,
  "walk-result": walkResult,
  "related-deps": relatedDeps,
  "alt-table": altTable,
  "alt-boundary": altBoundary,
  "math-paths": mathPaths,
  "math-check": mathCheck,
  "math-split": mathSplit,
  "math-scale": mathScale,
  "invariant-t9": invariantT9,
  "invariant-edges": invariantEdges,
  "mutant-always-write": mutantAlwaysWrite,
  "mutant-always-write-where": mutantAlwaysWriteWhere,
  "perf-count": perfCount,
  "cost-closed-form": costClosedForm,
  "perf-cases": perfCases,
  "shape-values": shapeValues,
  "worst-max": worstMax,
  "selfcheck-input": selfcheckInput,
  "selfcheck-answer": selfcheckAnswer,
};
