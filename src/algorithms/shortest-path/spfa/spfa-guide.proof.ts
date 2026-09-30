/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run tools/check-proof.ts src/algorithms/shortest-path/spfa/spfa-guide.md
 *
 * **기록을 남기는 사본이 둘 있다.** 정본은 몇 번 셌는지와 걸음마다 무엇을 고쳤는지를 내보내지
 * 않으므로, 그 자리만 덧붙인 사본이 아니면 계수와 걸음을 낼 방법이 없다.
 *
 * - `record` — 정점을 꺼낼 때마다 무엇을 읽고 고쳤는지, 큐가 어떻게 됐는지 남긴다. 작은 입력(전개
 *   입력 · 음수 사이클 입력)에만 쓴다.
 * - `counted` — 꺼낸 횟수 · 간선 읽기 · 넣은 횟수만 센다. 정점 수백 개짜리 입력에는 이쪽을 쓴다 —
 *   걸음마다 기록을 베끼면 메모리가 모자라 출력 없이 죽는다.
 *
 * **답이 맞는지는 사본이 아니라 정본이 진다** — 두 사본의 답은 이 파일을 읽을 때 정본과
 * 맞댄다(`자기대조()`). 표의 「답」 칸은 정본이나 정본에서 기계로 만든 변이가 낸 값이다.
 *
 * **비용을 세는 기준은 하나다** — 간선 하나를 읽고 완화를 시도한 한 번(`간선 읽기`). `bellmanFord`
 * 편과 같은 기준이다. 경쟁 설계와 나란히 잴 때만 큐에 넣고 꺼낸 횟수를 더한다(`.alt.ts` 의 기본
 * 연산). 추가 칸도 `.alt.ts` 와 같은 기준 하나로 센다.
 *
 * **변이가 아무것도 안 바꾸는지를 검사하는 자리는 중화 실행을 피해 간다.** `check-proof` 가
 * 이 파일을 한 번 더 부를 때는 `loadMutant` 이 정본을 그대로 돌려주므로(중화), 그 상태에서
 * 「변이가 답을 안 바꿨다」로 던지면 중화 대조 자체가 실행되지 않는다. 중화 여부는 변이
 * 모듈의 함수가 정본과 **같은 객체인가**로 알아낸다. 변이의 걸음을 펼치는 기록 사본도 같은
 * 판정을 따라 중화 실행에서는 정본의 걸음을 낸다.
 */

import { loadMutant } from "../../../../tools/check-proof.ts";
import { josa, 과와, 으로, 은는, 을를, 이가 } from "../../../../tools/josa.ts";
import {
  cases as altCases,
  crossing,
  hub,
  라운드로읽는설계,
  큐에담는설계,
} from "./spfa-guide.alt.ts";
import { type Edge, spfa } from "./spfa-guide.ref.ts";

const INF = Number.POSITIVE_INFINITY;

/* ────────────────────────── 고정 입력 ────────────────────────── */

/**
 * 본문 전개가 쓰는 그래프. 정점 여섯 · 방향 간선 여덟이고 정점 5 는 들어오는 간선이 없다.
 *
 * 여섯 갈래를 한 입력에서 전부 실행한다 — 이웃 목록 · 시작값 · 큐 · 꺼내기 · 완화 · 다시 넣기.
 * 「이미 큐에 있어 다시 넣지 않는다」와 「이미 꺼낸 정점의 값이 다시 줄어든다」가 둘 다 나오도록
 * `0 → 3` 과 `2 → 1` 을 넣었다.
 */
export const WALK_N = 6;
export const WALK_EDGES: Edge[] = [
  [0, 1, 6],
  [0, 2, 1],
  [0, 3, 20],
  [1, 3, 4],
  [2, 1, -3],
  [2, 3, 9],
  [3, 4, 2],
  [5, 4, 1],
];
export const WALK_SRC = 0;

/** 늦게 찾은 짧은 경로가 앞서 적은 값을 줄이는 그래프. */
export const LATE_N = 3;
export const LATE_EDGES: Edge[] = [
  [0, 1, 10],
  [0, 2, 1],
  [2, 1, 1],
];

/** 도달할 수 없는 정점이 있는 그래프. 정점 3 으로 들어오는 간선이 없다. */
export const FAR_N = 4;
export const FAR_EDGES: Edge[] = [
  [0, 1, 4],
  [0, 2, 5],
  [1, 2, -3],
];

/** 음수 사이클 `0 → 1 → 2 → 0`. 가중치 합이 −1 이라 값이 끝없이 줄어든다. */
export const CYCLE_N = 3;
export const CYCLE_EDGES: Edge[] = [
  [0, 1, 1],
  [1, 2, -1],
  [2, 0, -1],
];

/** 시작 정점에서 갈 수 없는 음수 사이클 `1 → 2 → 1`. */
export const AWAY_N = 3;
export const AWAY_EDGES: Edge[] = [
  [1, 2, 1],
  [2, 1, -5],
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
 * 사슬이 허브 하나로 들어가고 허브에서 잎으로 나가는 모양. 정점 수 `v` 를 사슬과 잎이
 * 절반씩 나눠 갖는다.
 *
 * 사슬 `i` 에서 허브로 가는 간선의 가중치가 `2(m − i)` 라 사슬을 더 깊이 지날수록 허브까지의
 * 값이 1 씩 작아지고, 그때마다 허브가 큐에 다시 들어간다. 허브의 나가는 간선이 잎 수만큼
 * 이므로 「여러 번 꺼내지는 정점 × 나가는 간선이 많은 정점」이 겹친다.
 */
export function hubShape(v: number): { n: number; edges: Edge[] } {
  const m = Math.floor((v - 2) / 2);
  const p = v - 2 - m;
  const H = m + 1;
  const edges: Edge[] = [[0, 1, 1_000_000]];
  for (let i = 1; i < m; i++) edges.push([i, i + 1, 1]);
  for (let i = 1; i <= m; i++) edges.push([i, H, 2 * (m - i)]);
  for (let j = 0; j < p; j++) edges.push([H, m + 2 + j, 1]);
  return { n: m + 2 + p, edges };
}

/**
 * 앞 번호에서 뒤 번호로 가는 간선을 전부 두고 가중치를 번호 차의 제곱으로 둔 그래프. 사이클이
 * 없고, 간선을 잘게 나눠 갈수록 비용이 작아진다(`(a+b)² > a² + b²`). 먼저 넣은 것을 먼저 꺼내면
 * 정점마다 한 번씩만 꺼내지만, 나중에 넣은 것을 먼저 꺼내면 같은 정점을 여러 번 꺼낸다.
 */
export function squareDag(v: number): Edge[] {
  const edges: Edge[] = [];
  for (let i = 0; i < v; i++) {
    for (let j = i + 1; j < v; j++) edges.push([i, j, (j - i) * (j - i)]);
  }
  return edges;
}

/** 무작위 희소 그래프. 사슬 하나에 앞으로만 가는 간선을 덧붙여 음수 사이클을 막는다. */
export function randomSparse(v: number, seed0: number): Edge[] {
  let seed = seed0;
  const next = (): number => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed;
  };
  const edges: Edge[] = [];
  for (let i = 0; i + 1 < v; i++) edges.push([i, i + 1, (next() % 100) + 1]);
  for (let i = 0; i < v * 2; i++) {
    const u = next() % v;
    const x = next() % v;
    const w = (next() % 200) - 50;
    if (u < x) edges.push([u, x, w]);
  }
  return edges;
}

/** 무작위 생성식의 시드. 본문 관측 표가 같은 값을 적는다. */
export const SEED = 987_654_321;

/* ────────────────────────── 표기 ────────────────────────── */

/** `[0, -2, 1, 2, 4, Infinity]` 꼴 — 본문 표기와 같다. */
export const show = (xs: readonly number[]): string => `[${xs.join(", ")}]`;

/** `124,500,500` 꼴 — 본문 표기와 같다. */
export const comma = (n: number): string => n.toLocaleString("en-US");

/** 거리 하나 — 무한대는 `Infinity` 로 적는다. */
export const num = (d: number): string => (d === INF ? "Infinity" : comma(d));

/** 간선 하나 — `2→3`. */
export const arrow = ([u, v]: readonly [number, number, number]): string =>
  `${u}→${v}`;

/** 더하는 가중치 — 음수면 괄호로 싼다(`1 + (-3)`). */
export const plusW = (w: number): string => (w < 0 ? `(${w})` : String(w));

/** 큐 내용 — `[1, 2, 3]`. */
export const qshow = (xs: readonly number[]): string => `[${xs.join(", ")}]`;

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

/** 꺼낸 정점의 간선 하나를 읽은 기록. */
export interface EdgeRead {
  /** 간선 목록에서의 번호. */
  readonly at: number;
  readonly u: number;
  readonly v: number;
  readonly w: number;
  /** 그 간선을 읽을 때의 `dist[u]`. */
  readonly du: number;
  /** 그 간선을 읽을 때의 `dist[v]`. */
  readonly before: number;
  /** `dist[u] + w`. */
  readonly cand: number;
  /** ⑤ 가 참이라 값을 고쳤는가. */
  readonly improved: boolean;
  /** 값을 고치고 ⑥ 이 참이라 큐에 넣었는가. */
  readonly pushed: boolean;
  /** 값을 고쳤지만 이미 큐에 있어 넣지 않았는가. */
  readonly held: boolean;
}

/** 정점 하나를 꺼내 처리한 걸음. */
export interface Pop {
  /** 꺼낸 차례 — 1 부터. 걸음 번호는 `T(t + 1)` 이다. */
  readonly t: number;
  readonly u: number;
  /** 꺼낸 정점이 든 묶음. */
  readonly wave: number;
  /** 꺼내기 전의 `head` 와 `queue.length`. */
  readonly headBefore: number;
  readonly lenBefore: number;
  readonly reads: readonly EdgeRead[];
  /** 걸음이 끝난 뒤의 `dist`. */
  readonly dist: readonly number[];
  /** 걸음이 끝난 뒤 큐에 남은 정점 — 꺼낼 차례대로. */
  readonly queue: readonly number[];
  /** 걸음이 끝난 뒤, 정점마다 그 값을 마지막으로 적은 간선의 번호. 없으면 −1. */
  readonly pred: readonly number[];
  /**
   * 걸음이 끝난 뒤, 정점마다 지금 적힌 값을 **적던 순간에** 이어 붙인 경로. `pred` 를 거꾸로 따라간
   * 경로와 다를 수 있다 — 적은 뒤에 앞 정점의 값이 또 줄면 `pred` 사슬은 새 경로를 가리킨다.
   */
  readonly paths: readonly (readonly number[])[];
}

export interface Rec {
  readonly n: number;
  readonly edges: readonly Edge[];
  readonly src: number;
  readonly start: readonly number[];
  readonly pops: readonly Pop[];
  readonly dist: readonly number[];
  /** 정점마다 큐에 넣은 횟수. 처음 넣은 시작 정점도 센다. */
  readonly c: readonly number[];
  /** 큐가 가장 길었을 때의 항목 수 — 넣은 직후마다 잰다. */
  readonly peak: number;
  /** 묶음마다 그 묶음에서 꺼낸 정점. */
  readonly waves: readonly (readonly number[])[];
  /** 묶음마다 그 묶음을 다 꺼낸 뒤의 `dist`. */
  readonly waveDist: readonly (readonly number[])[];
}

/** 기록 사본이 정본의 어느 줄을 뺄지 — 변이의 걸음을 펼칠 때만 쓴다. */
export interface Variant {
  /** ④ 의 `inQueue[u] = false` 를 실행하는가. */
  readonly flagDown?: boolean;
  /** ⑥ 의 `if (!inQueue[v])` 검사를 하는가. 안 하면 늘 넣는다. */
  readonly dedup?: boolean;
  /** ⑥ 의 `queue.push(v)` 를 실행하는가. */
  readonly push?: boolean;
}

/** 정본과 같은 절차에 걸음마다 기록만 덧붙인 사본. 작은 입력에만 쓴다. */
export function record(
  n: number,
  edges: readonly Edge[],
  src: number,
  variant: Variant = {},
): Rec {
  const flagDown = variant.flagDown ?? true;
  const dedup = variant.dedup ?? true;
  const doPush = variant.push ?? true;
  const adj: [number, number, number][][] = Array.from({ length: n }, () => []);
  edges.forEach(([u, v, w], at) => {
    (adj[u] as [number, number, number][]).push([v, w, at]);
  });

  const dist = Array.from({ length: n }, () => INF);
  dist[src] = 0;
  const start = dist.slice();
  const pred = Array.from({ length: n }, () => -1);
  const paths: number[][] = Array.from({ length: n }, (_, v) =>
    v === src ? [src] : [],
  );
  const inQueue = Array.from({ length: n }, () => false);
  const queue: number[] = [src];
  const entryWave: number[] = [0];
  inQueue[src] = true;
  let head = 0;
  const c = Array.from({ length: n }, () => 0);
  c[src] = 1;
  let peak = 1;
  const pops: Pop[] = [];
  const waves: number[][] = [];
  const waveDist: number[][] = [];

  while (head < queue.length) {
    const headBefore = head;
    const lenBefore = queue.length;
    const wave = entryWave[head] as number;
    const u = queue[head++] as number;
    if (flagDown) inQueue[u] = false;
    if (waves.length <= wave) waves.push([]);
    (waves[wave] as number[]).push(u);

    const reads: EdgeRead[] = [];
    for (const [v, w, at] of adj[u] as [number, number, number][]) {
      const du = dist[u] as number;
      const before = dist[v] as number;
      const cand = du + w;
      const improved = cand < before;
      let pushed = false;
      let held = false;
      if (improved) {
        dist[v] = cand;
        pred[v] = at;
        paths[v] = [...(paths[u] as number[]), v];
        if (!dedup || !inQueue[v]) {
          inQueue[v] = true;
          if (doPush) {
            queue.push(v);
            entryWave.push(wave + 1);
            c[v] = (c[v] as number) + 1;
            peak = Math.max(peak, queue.length - head);
            pushed = true;
          }
        } else {
          held = true;
        }
      }
      reads.push({ at, u, v, w, du, before, cand, improved, pushed, held });
    }
    pops.push({
      t: pops.length + 1,
      u,
      wave,
      headBefore,
      lenBefore,
      reads,
      dist: dist.slice(),
      queue: queue.slice(head),
      pred: pred.slice(),
      paths: paths.map((x) => x.slice()),
    });
    const nextWave = entryWave[head];
    if (nextWave === undefined || nextWave !== wave)
      waveDist.push(dist.slice());
    if (pops.length > 10_000) throw new Error("기록 사본이 끝나지 않는다");
  }
  return {
    n,
    edges,
    src,
    start,
    pops,
    dist: dist.slice(),
    c,
    peak,
    waves,
    waveDist,
  };
}

export interface Counts {
  dist: number[];
  /** 큐에서 정점을 꺼낸 총 횟수. */
  pops: number;
  /** 간선 하나를 읽고 완화를 시도한 총 횟수. */
  reads: number;
  /** 값을 실제로 고친 횟수. */
  writes: number;
  /** 큐에 넣은 총 횟수. 처음 넣는 한 번을 포함한다. */
  pushes: number;
  /** 큐가 가장 길었을 때의 항목 수. */
  peak: number;
  /** 정점마다 큐에 넣은 횟수. */
  c: number[];
}

/**
 * 걸음마다의 기록을 남기지 않는 계수 사본. `lifo` 가 참이면 나중에 넣은 것을 먼저 꺼내고,
 * `dedup` 이 거짓이면 이미 큐에 있어도 넣는다. 둘 다 기본값이면 정본과 같은 절차다.
 */
export function counted(
  n: number,
  edges: readonly Edge[],
  src: number,
  opts: { lifo?: boolean; dedup?: boolean } = {},
): Counts {
  const lifo = opts.lifo ?? false;
  const dedup = opts.dedup ?? true;
  const adj: [number, number][][] = Array.from({ length: n }, () => []);
  for (const [u, v, w] of edges) (adj[u] as [number, number][]).push([v, w]);

  const dist = Array.from({ length: n }, () => INF);
  dist[src] = 0;
  const inQueue = Array.from({ length: n }, () => false);
  const queue: number[] = [src];
  inQueue[src] = true;
  let head = 0;
  const c = Array.from({ length: n }, () => 0);
  c[src] = 1;
  let pops = 0;
  let reads = 0;
  let writes = 0;
  let pushes = 1;
  let peak = 1;

  while (head < queue.length) {
    const u = (lifo ? queue.pop() : queue[head++]) as number;
    inQueue[u] = false;
    pops++;
    for (const [v, w] of adj[u] as [number, number][]) {
      reads++;
      const nd = (dist[u] as number) + w;
      if (nd < (dist[v] as number)) {
        dist[v] = nd;
        writes++;
        if (!dedup || !inQueue[v]) {
          inQueue[v] = true;
          queue.push(v);
          pushes++;
          c[v] = (c[v] as number) + 1;
          peak = Math.max(peak, queue.length - head);
        }
      }
    }
  }
  return { dist, pops, reads, writes, pushes, peak, c };
}

/** 라운드 한 번의 기록 — 벨만-포드. */
export interface RoundRow {
  readonly k: number;
  readonly reads: number;
  readonly writes: number;
  readonly dist: readonly number[];
  /** 간선마다 한 일 — 작은 입력에서만 채운다. */
  readonly each: readonly {
    readonly e: Edge;
    readonly du: number;
    readonly before: number;
    readonly improved: boolean;
  }[];
}

/**
 * 벨만-포드 — 간선 목록 전체를 라운드마다 읽는다. `earlyExit` 가 참이면 한 라운드가 한 칸도 못
 * 고쳤을 때 거기서 끝내고, 거짓이면 `V − 1` 라운드를 다 읽는다. `keep` 이 참이면 간선마다 기록한다.
 */
export function rounds(
  n: number,
  edges: readonly Edge[],
  src: number,
  earlyExit: boolean,
  keep = false,
): { dist: number[]; rows: RoundRow[]; reads: number; writes: number } {
  const dist = Array.from({ length: n }, () => INF);
  dist[src] = 0;
  const rows: RoundRow[] = [];
  let reads = 0;
  let writes = 0;
  for (let k = 1; k <= Math.max(1, n - 1); k++) {
    let r = 0;
    let wr = 0;
    const each: RoundRow["each"][number][] = [];
    for (const e of edges) {
      const [u, v, w] = e;
      r++;
      const du = dist[u] as number;
      const before = dist[v] as number;
      let improved = false;
      if (du !== INF && du + w < before) {
        dist[v] = du + w;
        wr++;
        improved = true;
      }
      if (keep) each.push({ e, du, before, improved });
    }
    reads += r;
    writes += wr;
    rows.push({
      k,
      reads: r,
      writes: wr,
      dist: keep ? dist.slice() : [],
      each,
    });
    if (earlyExit && wr === 0) break;
  }
  return { dist, rows, reads, writes };
}

/** 사본이 정본과 같은 답을 내는지 이 파일을 읽을 때 한 번 확인한다. */
function 자기대조(): void {
  const inputs: [number, Edge[]][] = [
    [WALK_N, WALK_EDGES],
    [LATE_N, LATE_EDGES],
    [FAR_N, FAR_EDGES],
    [12, complete(12)],
    [64, chain(64, true)],
    [hubShape(64).n, hubShape(64).edges],
    [16, squareDag(16)],
  ];
  for (const [n, edges] of inputs) {
    const ref = show(spfa(n, edges, 0));
    if (show(counted(n, edges, 0).dist) !== ref) {
      throw new Error("세는 사본이 정본과 다른 답을 낸다");
    }
    if (n <= 64 && show(record(n, edges, 0).dist) !== ref) {
      throw new Error("기록 사본이 정본과 다른 답을 낸다");
    }
    if (show(rounds(n, edges, 0, true).dist) !== ref) {
      throw new Error("라운드 사본이 정본과 다른 답을 낸다");
    }
  }
}
자기대조();

/** 전개 입력의 기록. 본문 · 그림 · 걸음 재생 패널이 함께 쓴다. */
export const WALK = record(WALK_N, WALK_EDGES, WALK_SRC);

/** 간선을 `k` 개 이하로 쓰는 경로의 최소 비용. 층을 하나씩 올리며 계산한다. */
export function optAtMost(
  n: number,
  edges: readonly Edge[],
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

/** 출발점에서 `to` 로 가는 단순 경로를 전부 늘어놓는다. */
export function simplePathsTo(
  n: number,
  edges: readonly Edge[],
  src: number,
  to: number,
): { path: number[]; cost: number }[] {
  const adj: [number, number][][] = Array.from({ length: n }, () => []);
  for (const [u, v, w] of edges) (adj[u] as [number, number][]).push([v, w]);
  const onPath = Array.from({ length: n }, () => false);
  const out: { path: number[]; cost: number }[] = [];
  const path: number[] = [src];
  const walk = (u: number, cost: number): void => {
    if (u === to && path.length > 1) out.push({ path: path.slice(), cost });
    onPath[u] = true;
    for (const [v, w] of adj[u] as [number, number][]) {
      if (onPath[v]) continue;
      path.push(v);
      walk(v, cost + w);
      path.pop();
    }
    onPath[u] = false;
  };
  walk(src, 0);
  return out;
}

/** 출발점에서 나가는 단순 경로의 개수. */
export function countSimplePaths(
  n: number,
  edges: readonly Edge[],
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

/**
 * 꺼낸 횟수에 상한을 두고 실행한다. 음수 사이클이 있으면 큐가 비지 않으므로, 값이 어디까지
 * 내려가는지를 보려면 상한이 있어야 한다.
 */
export function cappedPops(
  n: number,
  edges: readonly Edge[],
  src: number,
  cap: number,
): { dist: number[]; drained: boolean; c: number[] } {
  const adj: [number, number][][] = Array.from({ length: n }, () => []);
  for (const [u, v, w] of edges) (adj[u] as [number, number][]).push([v, w]);
  const dist = Array.from({ length: n }, () => INF);
  dist[src] = 0;
  const inQueue = Array.from({ length: n }, () => false);
  const queue: number[] = [src];
  inQueue[src] = true;
  const c = Array.from({ length: n }, () => 0);
  c[src] = 1;
  let head = 0;
  let used = 0;
  while (head < queue.length && used < cap) {
    const u = queue[head++] as number;
    inQueue[u] = false;
    used++;
    for (const [v, w] of adj[u] as [number, number][]) {
      const nd = (dist[u] as number) + w;
      if (nd < (dist[v] as number)) {
        dist[v] = nd;
        if (!inQueue[v]) {
          inQueue[v] = true;
          queue.push(v);
          c[v] = (c[v] as number) + 1;
        }
      }
    }
  }
  return { dist, drained: head >= queue.length, c };
}

/**
 * 넣은 횟수로 음수 사이클을 판정하는 변형. 정본에 판정 두 줄만 더했다 — 정점을 큐에 넣을 때마다
 * 그 정점의 넣은 횟수를 하나 올리고, 그것이 정점 수 `n` 에 이르면 음수 사이클로 판정해 멈춘다.
 * 정본은 이 판정을 하지 않는다(과제가 음수 사이클이 없다고 전제한다).
 */
export function detectByCount(
  n: number,
  edges: readonly Edge[],
  src: number,
): {
  dist: number[];
  hasNegativeCycle: boolean;
  pops: number;
  at: number;
  c: number[];
} {
  const adj: [number, number][][] = Array.from({ length: n }, () => []);
  for (const [u, v, w] of edges) (adj[u] as [number, number][]).push([v, w]);
  const dist = Array.from({ length: n }, () => INF);
  dist[src] = 0;
  const inQueue = Array.from({ length: n }, () => false);
  const cnt = Array.from({ length: n }, () => 0);
  const queue: number[] = [src];
  inQueue[src] = true;
  cnt[src] = 1;
  let head = 0;
  let pops = 0;
  while (head < queue.length) {
    const u = queue[head++] as number;
    inQueue[u] = false;
    pops++;
    for (const [v, w] of adj[u] as [number, number][]) {
      const nd = (dist[u] as number) + w;
      if (nd < (dist[v] as number)) {
        dist[v] = nd;
        if (!inQueue[v]) {
          cnt[v] = (cnt[v] as number) + 1;
          if ((cnt[v] as number) >= n) {
            return { dist, hasNegativeCycle: true, pops, at: v, c: cnt };
          }
          inQueue[v] = true;
          queue.push(v);
        }
      }
    }
  }
  return { dist, hasNegativeCycle: false, pops, at: -1, c: cnt };
}

/**
 * `while` 조건을 검사하는 시점마다 두 문장을 확인한다.
 *
 * 앞 문장 — `dist[v]` 가 유한하면 그 값이 실재하는 경로의 비용이다. 실재하지 않는 값은
 * 진짜 최단 비용보다 작아지므로, `dist[v] < opt(v)` 인 자리를 찾는 것으로 확인한다.
 * 뒤 문장 — 완화할 수 있는 간선의 꼬리 정점이 그 시점에 큐 안에 있다.
 */
export function invariantWatch(
  n: number,
  edges: readonly Edge[],
  src: number,
): { step: number; queue: number[]; relaxable: string[]; ok: boolean }[] {
  const truth = spfa(n, [...edges], src);
  const adj: [number, number][][] = Array.from({ length: n }, () => []);
  for (const [u, v, w] of edges) (adj[u] as [number, number][]).push([v, w]);
  const dist = Array.from({ length: n }, () => INF);
  dist[src] = 0;
  const inQueue = Array.from({ length: n }, () => false);
  const queue: number[] = [src];
  inQueue[src] = true;
  let head = 0;

  const out: {
    step: number;
    queue: number[];
    relaxable: string[];
    ok: boolean;
  }[] = [];
  let step = 0;
  for (;;) {
    const relaxable: string[] = [];
    let ok = true;
    for (const e of edges) {
      const [u, v, w] = e;
      if (dist[u] === INF) continue;
      if ((dist[u] as number) + w < (dist[v] as number)) {
        relaxable.push(arrow(e));
        if (!inQueue[u]) ok = false;
      }
    }
    for (let v = 0; v < n; v++) {
      if ((dist[v] as number) < (truth[v] as number)) ok = false;
    }
    out.push({ step, queue: queue.slice(head), relaxable, ok });
    if (head >= queue.length) break;
    step++;
    const u = queue[head++] as number;
    inQueue[u] = false;
    for (const [v, w] of adj[u] as [number, number][]) {
      const nd = (dist[u] as number) + w;
      if (nd < (dist[v] as number)) {
        dist[v] = nd;
        if (!inQueue[v]) {
          inQueue[v] = true;
          queue.push(v);
        }
      }
    }
  }
  return out;
}

/* ────────────────────────── 변이 ────────────────────────── */

const REF = new URL("./spfa-guide.ref.ts", import.meta.url).pathname;

interface Impl {
  spfa(n: number, edges: Edge[], src: number): number[];
}

/** 꺼낸 정점의 표시를 내리는 줄을 통째로 뺀 사본. */
const noFlagDown = await loadMutant<Impl>(REF, {
  drop: /inQueue\[u\] = false;/,
});

/** 큐 중복을 막는 검사를 늘 참으로 둔 사본. 같은 정점이 여러 벌 들어간다. */
const noDedup = await loadMutant<Impl>(REF, {
  swap: [/if \(!inQueue\[v\]\) \{/, "if (true) {"],
});

/** **불변식을 지키던 줄** 하나 — 값이 줄어든 정점을 큐에 넣는 줄을 뺀 사본. */
const noPush = await loadMutant<Impl>(REF, {
  drop: /queue\.push\(v\);/,
});

const MUTANT_CASES: { label: string; n: number; edges: Edge[] }[] = [
  { label: "전개 입력", n: WALK_N, edges: WALK_EDGES },
  { label: "늦게 찾은 짧은 경로", n: LATE_N, edges: LATE_EDGES },
  { label: "도달할 수 없는 정점", n: FAR_N, edges: FAR_EDGES },
];

/**
 * 중화 실행인가 — `loadMutant` 이 변이를 적용하지 않고 정본 모듈을 그대로 돌려주면 두
 * 함수가 **같은 객체**다. 중화 상태에서 아래 검사를 돌리면 언제나 던지게 되고, 그러면
 * `check-proof` 의 중화 대조가 이 편에서는 실행되지 않는다.
 */
const 중화됨 = noFlagDown.spfa === spfa;

/** 변이의 걸음을 펼치는 기록 사본의 설정. 중화 실행에서는 정본과 같은 절차가 된다. */
const FLAG_KEPT: Variant = 중화됨 ? {} : { flagDown: false };
const PUSH_DROPPED: Variant = 중화됨 ? {} : { push: false };
const DEDUP_OFF = !중화됨;

// 하나도 안 갈리면 그 절의 주장이 성립하지 않는다. 실행이 그것을 판정한다.
if (!중화됨) {
  for (const [label, impl] of [
    ["표시를 안 내린 판", noFlagDown],
    ["큐에 안 넣는 판", noPush],
  ] as [string, Impl][]) {
    if (
      MUTANT_CASES.every(
        (c) => show(spfa(c.n, c.edges, 0)) === show(impl.spfa(c.n, c.edges, 0)),
      )
    ) {
      throw new Error(`${label} 변이가 어느 입력에서도 답을 바꾸지 못했다`);
    }
  }
  // 기록 사본이 변이 모듈과 같은 답을 내는지 — 펼친 걸음이 그 변이의 걸음인지 확인한다.
  for (const c of MUTANT_CASES) {
    if (
      show(record(c.n, c.edges, 0, FLAG_KEPT).dist) !==
      show(noFlagDown.spfa(c.n, c.edges, 0))
    ) {
      throw new Error("표시를 안 내린 기록 사본이 변이와 다른 답을 낸다");
    }
    if (
      show(record(c.n, c.edges, 0, PUSH_DROPPED).dist) !==
      show(noPush.spfa(c.n, c.edges, 0))
    ) {
      throw new Error("큐에 안 넣는 기록 사본이 변이와 다른 답을 낸다");
    }
    if (
      show(counted(c.n, c.edges, 0, { dedup: false }).dist) !==
      show(noDedup.spfa(c.n, c.edges, 0))
    ) {
      throw new Error("중복 검사를 뺀 세는 사본이 변이와 다른 답을 낸다");
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
  ["①", "이웃 목록을 만든다"],
  ["②", "시작값을 적는다"],
  ["③", "큐를 만든다"],
  ["④", "정점을 하나 꺼낸다"],
  ["⑤", "완화가 값을 고친다"],
  ["⑥", "값이 줄어 큐에 다시 넣는다"],
];

function branchCounts(rec: Rec): number[] {
  const reads = rec.pops.flatMap((p) => p.reads);
  return [
    1,
    1,
    1,
    rec.pops.length,
    reads.filter((r) => r.improved).length,
    reads.filter((r) => r.pushed).length,
  ];
}

const outDegree = (n: number, edges: readonly Edge[]): number[] => {
  const d = Array.from({ length: n }, () => 0);
  for (const [u] of edges) d[u] = (d[u] as number) + 1;
  return d;
};

/** 한 번 읽은 간선의 계산 — `0 + 6 = 6`. */
const calcOf = (r: EdgeRead): string =>
  `${num(r.du)} + ${plusW(r.w)} = ${num(r.cand)}`;

/** 걸음 하나에서 고친 자리들 — `dist[1] 6 → -2`. */
const fixesOf = (p: Pop): string[] =>
  p.reads
    .filter((r) => r.improved)
    .map((r) => `dist[${r.v}] ${num(r.before)} → ${num(r.cand)}`);

/* ────────────────────────── 블록 ────────────────────────── */

/** concept — 정점 1 · 3 으로 가는 경로를 전부 늘어놓는다. */
function conceptPaths(): string {
  const rows: string[][] = [];
  for (const to of [1, 3]) {
    const paths = simplePathsTo(WALK_N, WALK_EDGES, WALK_SRC, to);
    const best = Math.min(...paths.map((p) => p.cost));
    for (const p of paths) {
      rows.push([
        String(to),
        p.path.join("→"),
        String(p.path.length - 1),
        comma(p.cost),
        p.cost === best ? "가장 작다" : "",
      ]);
    }
  }
  return [
    md(["도착 정점", "경로", "간선 수", "비용", "최소"], rows, [2, 3]),
    "",
    `정본이 낸 거리는 dist[1] = ${num(WALK.dist[1] as number)} · dist[3] = ${num(WALK.dist[3] as number)} 입니다.`,
  ].join("\n");
}

/** concept — 벨만-포드를 이 그래프에 실행한 라운드마다의 값. */
function conceptRounds(): string {
  const r = rounds(WALK_N, WALK_EDGES, WALK_SRC, true, true);
  const rows = r.rows.map((x) => [
    String(x.k),
    String(x.reads),
    String(x.writes),
    String(x.reads - x.writes),
    show(x.dist),
  ]);
  return [
    md(
      [
        "라운드",
        "간선 읽기",
        "값을 고친 읽기",
        "아무것도 안 고친 읽기",
        "라운드가 끝난 dist",
      ],
      rows,
      [0, 1, 2, 3],
    ),
    "",
    `라운드 ${r.rows.length} 번에 간선 읽기 ${r.reads} 번이고, 그중 값을 고친 읽기가 ${r.writes} 번, 아무것도 안 고친 읽기가 ${r.reads - r.writes} 번입니다.`,
  ].join("\n");
}

/** concept — 같은 그래프에서 큐에 든 정점의 간선만 읽는다. */
function conceptQueue(): string {
  const rows = WALK.pops.map((p) => [
    String(p.t),
    String(p.u),
    p.reads.length === 0
      ? "없다"
      : p.reads.map((r) => arrow([r.u, r.v, r.w])).join(" · "),
    p.reads.filter((r) => r.improved).length === 0
      ? "없다"
      : p.reads
          .filter((r) => r.improved)
          .map((r) => arrow([r.u, r.v, r.w]))
          .join(" · "),
    qshow(p.queue),
  ]);
  const reads = WALK.pops.reduce((a, p) => a + p.reads.length, 0);
  const writes = WALK.pops.reduce(
    (a, p) => a + p.reads.filter((r) => r.improved).length,
    0,
  );
  return [
    md(
      ["꺼낸 차례", "정점", "읽은 간선", "값을 고친 간선", "꺼낸 뒤 큐"],
      rows,
      [0],
    ),
    "",
    `꺼내기 ${WALK.pops.length} 번에 간선 읽기 ${reads} 번이고, 그중 값을 고친 읽기가 ${writes} 번입니다. 결과 dist 는 ${show(WALK.dist)} 입니다.`,
  ].join("\n");
}

/** deep.origin ② — 경로를 전부 만드는 방법이 규모에서 몇 개가 되는가. */
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
    String(V_LIMIT),
    comma(E_LIMIT),
    `${V_LIMIT - 1}! 이상 — ${comma(factorialDigits(V_LIMIT - 1))} 자리 수`,
    "식",
  ]);
  const ten = countSimplePaths(10, complete(10), 0);
  return [
    md(["정점 V", "간선 E", "단순 경로 수", "센 방법"], rows, [0, 1]),
    "",
    `정점 10 개 완전 그래프에서 단순 경로가 ${comma(ten)} 개입니다. 정점이 V 개인 완전 그래프는 출발점을 뺀 V−1 개를 모두 지나는 경로만 해도 (V−1)! 개라, 마지막 줄은 V = ${V_LIMIT}${을를(V_LIMIT)} 그 식에 넣은 값입니다.`,
  ].join("\n");
}

/** deep.origin ③ — 벨만-포드의 세 번째 라운드가 간선마다 한 일. */
function originRound3(): string {
  const r = rounds(WALK_N, WALK_EDGES, WALK_SRC, true, true);
  const last = r.rows.at(-1) as RoundRow;
  const rows = last.each.map(({ e, du, before, improved }) => {
    const [, , w] = e;
    const calc =
      du === INF
        ? `dist[${e[0]}] 가 Infinity`
        : `${num(du)} + ${plusW(w)} = ${num(du + w)}`;
    const rel =
      du === INF
        ? "이을 경로가 없다"
        : du + w < before
          ? "작다"
          : du + w === before
            ? "같다"
            : "크다";
    return [arrow(e), calc, num(before), rel, improved ? "고친다" : "그대로"];
  });
  const idle = last.each.filter((x) => !x.improved).length;
  return [
    md(["간선", "dist[u] + w", "그때 dist[v]", "비교", "한 일"], rows),
    "",
    `라운드 ${last.k}${은는(last.k)} 간선 ${last.each.length} 개를 읽었고 그중 값을 고치지 못한 읽기가 ${idle} 개입니다.`,
  ].join("\n");
}

/** deep.origin ④ — 같은 입력을 세 방식으로 처리하고 헛읽기를 나란히 놓는다. */
function originWaste(): string {
  const fixed = rounds(WALK_N, WALK_EDGES, WALK_SRC, false);
  const early = rounds(WALK_N, WALK_EDGES, WALK_SRC, true);
  const c = counted(WALK_N, WALK_EDGES, WALK_SRC);
  const rows = [
    [
      `라운드를 V−1 = ${WALK_N - 1} 번 다 읽는다`,
      fixed.reads,
      fixed.writes,
      show(fixed.dist),
    ],
    [
      "못 고친 라운드가 나오면 멈춘다(벨만-포드)",
      early.reads,
      early.writes,
      show(early.dist),
    ],
    ["값이 바뀐 정점의 간선만 다시 읽는다", c.reads, c.writes, show(c.dist)],
  ].map(([a, r, w, d]) => [
    a as string,
    comma(r as number),
    comma(w as number),
    comma((r as number) - (w as number)),
    d as string,
  ]);
  const same =
    sameArr(fixed.dist, early.dist) && sameArr(early.dist, c.dist)
      ? "같고"
      : "다르고";
  return [
    md(
      [
        "방식",
        "간선 읽기",
        "값을 고친 읽기",
        "아무것도 안 고친 읽기",
        "결과 dist",
      ],
      rows,
      [1, 2, 3],
    ),
    "",
    `세 방식의 결과 dist 는 서로 ${same}, 값을 고친 읽기는 셋 다 ${c.writes} 번입니다.`,
  ].join("\n");
}

/** deep.origin ④ — 「고쳤다」만 남기는 벨만-포드와 정점을 남기는 방법을 여러 모양에서. */
function originFlag(): string {
  const inputs: [string, number, Edge[]][] = [
    ["전개 입력", WALK_N, WALK_EDGES],
    ["사슬 V = 64, 목록을 내림차순으로", 64, chain(64, true)],
    ["완전 그래프 V = 64", 64, complete(64)],
  ];
  const rows = inputs.map(([label, n, edges]) => {
    const early = rounds(n, edges, 0, true);
    const c = counted(n, edges, 0);
    return [
      label,
      comma(edges.length),
      comma(early.rows.length),
      comma(early.reads),
      comma(c.reads),
    ];
  });
  return md(
    [
      "입력",
      "간선 E",
      "라운드",
      "벨만-포드의 간선 읽기",
      "정점을 남긴 방법의 간선 읽기",
    ],
    rows,
    [1, 2, 3, 4],
  );
}

/** deep.build 묶음 — 전개 입력을 묶음으로 가른다. */
function waveTable(): string {
  const rows = WALK.waves.map((members, k) => {
    const steps = WALK.pops
      .filter((p) => p.wave === k)
      .map((p) => `T${p.t + 1}`);
    const pushed = WALK.pops
      .filter((p) => p.wave === k)
      .flatMap((p) => p.reads.filter((r) => r.pushed).map((r) => r.v));
    return [
      String(k),
      members.join(" · "),
      steps.join(" · "),
      pushed.length === 0 ? "없다" : pushed.join(" · "),
      show(WALK.waveDist[k] as number[]),
    ];
  });
  return [
    md(
      [
        "묶음 k",
        "꺼낸 정점",
        "걸음",
        "이 묶음이 큐에 넣은 정점",
        "묶음을 다 꺼낸 뒤 dist",
      ],
      rows,
      [0],
    ),
    "",
    `묶음이 ${WALK.waves.length} 개이고, 꺼내기 ${WALK.pops.length} 번이 그 묶음들에 빠짐없이 나뉘었습니다.`,
  ].join("\n");
}

/** deep.build 묶음 — 묶음 2 가 어떻게 생겼는지 따라간다. */
function waveRead(): string {
  const k = 2;
  const members = WALK.waves[k] as number[];
  const rows = members.map((v) => {
    const by = WALK.pops.find(
      (p) => p.wave === k - 1 && p.reads.some((r) => r.v === v && r.pushed),
    ) as Pop;
    const r = by.reads.find((x) => x.v === v && x.pushed) as EdgeRead;
    const popped = WALK.pops.some((p) => p.t < by.t && p.u === v);
    return [
      String(v),
      `T${by.t + 1}`,
      `${arrow([r.u, r.v, r.w])}${이가(r.v)} ${calcOf(r)}`,
      `${num(r.before)} → ${num(r.cand)}`,
      popped ? "이미 꺼냈다" : "처음 넣는다",
    ];
  });
  return [
    md(["정점", "넣은 걸음", "넣게 한 완화", "dist 의 변화", "그 전에"], rows),
    "",
    `묶음 ${k} 의 정점 ${members.length} 개는 모두 묶음 ${k - 1} 의 정점을 꺼내는 동안 값이 줄어 들어왔습니다.`,
  ].join("\n");
}

/** deep.build 묶음 — 정점마다 든 묶음과 넣은 횟수. */
function waveMembers(): string {
  const rows = Array.from({ length: WALK_N }, (_, v) => {
    const ks = WALK.waves.flatMap((m, k) => (m.includes(v) ? [k] : []));
    return [
      String(v),
      ks.length === 0 ? "없다" : ks.join(" · "),
      String(WALK.c[v]),
    ];
  });
  const twice = WALK.waves.some((m) => new Set(m).size !== m.length);
  return [
    md(["정점", "든 묶음", "넣은 횟수 c(v)"], rows, [2]),
    "",
    `한 묶음 안에 같은 정점이 두 번 든 자리는 ${twice ? "있습니다" : "없고"}, 넣은 횟수가 가장 큰 정점도 ${Math.max(...WALK.c)} 번입니다.`,
  ].join("\n");
}

/** deep.build 묶음 — 묶음 k 를 다 꺼낸 dist 와 층 k+1 을 나란히. */
function waveVsLayer(): string {
  const rows = WALK.waves.map((_, k) => {
    const d = WALK.waveDist[k] as number[];
    const layer = optAtMost(WALK_N, WALK_EDGES, WALK_SRC, k + 1);
    const le = d.every((x, i) => x <= (layer[i] as number));
    const eq = sameArr(d, layer);
    return [
      String(k),
      show(d),
      show(layer),
      eq ? "칸마다 같다" : le ? "더 작은 칸이 있다" : "더 큰 칸이 있다",
    ];
  });
  const d1 = WALK.waveDist[1] as number[];
  const l2 = optAtMost(WALK_N, WALK_EDGES, WALK_SRC, 2);
  const v = d1.findIndex((x, i) => x < (l2[i] as number));
  return [
    md(
      ["묶음 k", "묶음 k 를 다 꺼낸 뒤 dist", "층 k+1 의 opt", "층과의 관계"],
      rows,
      [0],
    ),
    "",
    `묶음 1 을 다 꺼낸 뒤 dist[${v}]${은는(v)} ${num(d1[v] as number)}, opt_2(${v})${은는(v)} ${num(l2[v] as number)} 입니다.`,
  ].join("\n");
}

/** deep.build 묶음 — 묶음 수와 넣은 횟수의 최댓값을 여러 입력에서. */
function waveStop(): string {
  const inputs: [string, number, Edge[]][] = [
    ["전개 입력", WALK_N, WALK_EDGES],
    ["사슬 V = 64, 목록을 내림차순으로", 64, chain(64, true)],
    ["완전 그래프 V = 64", 64, complete(64)],
    ["사슬이 허브로 들어가는 모양 V = 64", hubShape(64).n, hubShape(64).edges],
  ];
  const rows = inputs.map(([label, n, edges]) => {
    const r = record(n, edges, 0);
    return [
      label,
      String(n),
      String(r.waves.length),
      String(Math.max(...r.c)),
      Math.max(...r.c) <= n - 1 ? "넘지 않는다" : "넘는다",
    ];
  });
  return [
    md(
      ["입력", "정점 V", "묶음 수", "넣은 횟수의 최댓값", "V − 1 과의 관계"],
      rows,
      [1, 2, 3],
    ),
    "",
    "네 입력 모두 음수 사이클이 없고, 묶음 수가 정점 수 V 를 넘지 않았습니다.",
  ].join("\n");
}

/** 1단계 — 이웃 목록. */
function stageAdj(): string {
  const deg = outDegree(WALK_N, WALK_EDGES);
  const rows = Array.from({ length: WALK_N }, (_, u) => {
    const out = WALK_EDGES.flatMap((e, at) =>
      e[0] === u ? [[e, at] as const] : [],
    );
    return [
      String(u),
      out.length === 0
        ? "없다"
        : out.map(([[, v, w]]) => `(${v}, ${w})`).join(" "),
      out.length === 0 ? "—" : out.map(([, at]) => String(at + 1)).join(" · "),
      String(deg[u]),
    ];
  });
  const scan = WALK.pops.length * WALK_EDGES.length;
  const reads = WALK.pops.reduce((a, p) => a + p.reads.length, 0);
  return [
    md(
      [
        "정점",
        "adj — (머리, 가중치)",
        "간선 목록에서의 차례",
        "나가는 간선 수",
      ],
      rows,
      [3],
    ),
    "",
    `이웃 목록이 없으면 정점을 꺼낼 때마다 간선 ${WALK_EDGES.length} 개를 모두 읽어야 해서 꺼내기 ${WALK.pops.length} 번에 ${scan} 번을 읽고, 있으면 ${reads} 번을 읽습니다.`,
  ].join("\n");
}

/** 2단계 — 시작값과 큐. */
function stageStart(): string {
  const rows = WALK.start.map((d, v) => [
    String(v),
    num(d),
    v === WALK_SRC ? "true" : "false",
  ]);
  return [
    md(["정점", "dist", "inQueue"], rows, [0]),
    "",
    `큐는 ${qshow([WALK_SRC])}${josa(qshow([WALK_SRC]), "이고", "고")} head = 0 입니다. 값이 있는 칸은 dist[${WALK_SRC}] = 0 하나입니다.`,
  ].join("\n");
}

/** 3단계 — 정점 0 을 꺼내 그 간선만 완화한다. */
function stagePop(): string {
  const p = WALK.pops[0] as Pop;
  const readSet = new Set(p.reads.map((r) => r.at));
  const rows = WALK_EDGES.map((e, at) => {
    const r = p.reads.find((x) => x.at === at);
    return [
      String(at + 1),
      arrow(e),
      r ? "읽는다" : "읽지 않는다",
      r ? calcOf(r) : "—",
      r ? (r.improved ? `dist[${r.v}] = ${num(r.cand)}` : "그대로") : "—",
    ];
  });
  return [
    md(
      ["차례", "간선", "정점 0 을 꺼낸 걸음에서", "dist[u] + w", "한 일"],
      rows,
      [0],
    ),
    "",
    `간선 ${WALK_EDGES.length} 개 중 ${readSet.size} 개를 읽었고, 걸음이 끝난 dist 는 ${show(p.dist)} · 큐는 ${qshow(p.queue)} 입니다.`,
  ].join("\n");
}

/** 4단계 — 값이 줄어든 정점을 넣는 두 경우. */
function stageReentry(): string {
  const rows: string[][] = [];
  for (const p of WALK.pops) {
    for (const r of p.reads) {
      if (!r.improved) continue;
      const poppedBefore = WALK.pops.some((q) => q.t < p.t && q.u === r.v);
      rows.push([
        `T${p.t + 1}`,
        String(p.u),
        `dist[${r.v}] ${num(r.before)} → ${num(r.cand)}`,
        r.held
          ? "큐 안에 있다"
          : poppedBefore
            ? "꺼낸 적이 있고 큐 밖이다"
            : "넣은 적이 없다",
        r.pushed ? "넣는다" : "안 넣는다",
        qshow(p.queue),
      ]);
    }
  }
  const held = WALK.pops.flatMap((p) => p.reads).filter((r) => r.held).length;
  const again = WALK.c.reduce((a, k) => a + Math.max(0, k - 1), 0);
  return [
    md(
      ["걸음", "꺼낸 정점", "고친 칸", "그 정점의 자리", "⑥", "걸음이 끝난 큐"],
      rows,
    ),
    "",
    `값을 고친 ${rows.length} 번 가운데 이미 큐 안에 있어 넣지 않은 것이 ${held} 번이고, 꺼낸 적이 있는 정점을 다시 넣은 것이 ${again} 번입니다. 큐가 가장 길었을 때는 ${WALK.peak} 개입니다.`,
  ].join("\n");
}

/** 5단계 — 큐가 빈 뒤 모든 간선이 더 줄일 것이 없는가. */
function stageEnd(): string {
  const d = WALK.dist;
  const rows = WALK_EDGES.map((e) => {
    const [u, v, w] = e;
    const du = d[u] as number;
    const cand = du + w;
    const rel =
      du === INF
        ? "이을 경로가 없다"
        : cand > (d[v] as number)
          ? "크다"
          : cand === d[v]
            ? "같다"
            : "작다";
    return [
      arrow(e),
      du === INF
        ? `dist[${u}] 가 Infinity`
        : `${num(du)} + ${plusW(w)} = ${num(cand)}`,
      num(d[v] as number),
      rel,
    ];
  });
  const bad = WALK_EDGES.filter(
    ([u, v, w]) => (d[u] as number) + w < (d[v] as number),
  ).length;
  return [
    md(["간선", "dist[u] + w", "dist[v]", "비교"], rows),
    "",
    `큐가 빈 뒤 dist[u] + w 가 dist[v] 보다 작은 간선은 ${bad} 개입니다.`,
  ].join("\n");
}

/** 전제 — 음수 사이클이 있으면 큐가 비지 않는다. */
function premiseCycle(): string {
  const rows = [3, 6, 30, 300, 3000].map((cap) => {
    const r = cappedPops(CYCLE_N, CYCLE_EDGES, 0, cap);
    return [
      comma(cap),
      show(r.dist),
      r.drained ? "비었다" : "남아 있다",
      String(Math.max(...r.c)),
    ];
  });
  return [
    md(
      ["꺼낸 횟수 상한", "그때의 dist", "큐", "넣은 횟수의 최댓값"],
      rows,
      [0, 3],
    ),
    "",
    "음수 사이클 0→1→2→0 을 넣고 꺼낸 횟수에 상한을 두고 멈췄습니다. 상한을 늘릴수록 dist 가 더 내려가고, 큐는 한 번도 비지 않았습니다.",
  ].join("\n");
}

/** 전제 — 넣은 횟수로 판정하는 변형을 세 입력에. */
function premiseDetect(): string {
  const inputs: [string, number, Edge[]][] = [
    ["전개 입력", WALK_N, WALK_EDGES],
    ["음수 사이클 0→1→2→0", CYCLE_N, CYCLE_EDGES],
    ["도달할 수 없는 음수 사이클 1→2→1", AWAY_N, AWAY_EDGES],
  ];
  const rows = inputs.map(([label, n, edges]) => {
    const r = detectByCount(n, edges, 0);
    return [
      label,
      String(n),
      String(Math.max(...r.c)),
      String(r.pops),
      r.hasNegativeCycle
        ? `정점 ${r.at}${을를(r.at)} ${n} 번째로 넣으려 할 때`
        : "끝까지 비었다",
      String(r.hasNegativeCycle),
    ];
  });
  return md(
    [
      "입력",
      "정점 V",
      "넣은 횟수의 최댓값",
      "꺼낸 횟수",
      "멈춘 자리",
      "hasNegativeCycle",
    ],
    rows,
    [1, 2, 3],
  );
}

/** 설계 선택 — 먼저 넣은 것부터 꺼내는가, 나중에 넣은 것부터 꺼내는가. */
function designOrder(): string {
  const inputs: [string, number, Edge[]][] = [
    ["전개 입력", WALK_N, WALK_EDGES],
    ["완전 그래프 V = 64", 64, complete(64)],
    ["번호 차의 제곱 그래프 V = 12", 12, squareDag(12)],
    ["번호 차의 제곱 그래프 V = 20", 20, squareDag(20)],
  ];
  const rows = inputs.map(([label, n, edges]) => {
    const f = counted(n, edges, 0);
    const l = counted(n, edges, 0, { lifo: true });
    if (!sameArr(f.dist, l.dist))
      throw new Error("두 꺼내는 차례가 다른 답을 낸다");
    return [
      label,
      comma(edges.length),
      `${comma(f.reads)} · ${Math.max(...f.c)}`,
      `${comma(l.reads)} · ${Math.max(...l.c)}`,
      String(n - 1),
    ];
  });
  return [
    md(
      [
        "입력",
        "간선 E",
        "큐 — 간선 읽기 · 넣은 횟수 최댓값",
        "스택 — 간선 읽기 · 넣은 횟수 최댓값",
        "V − 1",
      ],
      rows,
      [1, 4],
    ),
    "",
    "네 입력 모두 두 차례의 답 dist 가 같았습니다.",
  ].join("\n");
}

/** deep.walk 도입 — 고정 입력. */
function walkInput(): string {
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
    `// 이 절이 끝나면 나와야 하는 값: ${show(spfa(WALK_N, WALK_EDGES, WALK_SRC))}`,
  ].join("\n");
}

/** deep.walk 1 — T1 이 끝난 시점. */
function walkT1(): string {
  const adj = Array.from(
    { length: WALK_N },
    (_, u) =>
      `${u}:[${WALK_EDGES.filter((e) => e[0] === u)
        .map(([, v, w]) => `(${v},${w})`)
        .join(",")}]`,
  );
  return [
    "T1 이 끝난 시점",
    ...table(
      [
        ["adj", adj.join("  ")],
        ["dist", show(WALK.start)],
        ["queue", `${qshow([WALK_SRC])}  head = 0`],
        [
          "inQueue",
          `[${WALK.start.map((_, v) => String(v === WALK_SRC)).join(", ")}]`,
        ],
      ],
      "  ",
    ),
  ].join("\n");
}

/** deep.walk 2 — 첫 꺼내기 전후의 head 와 큐. */
function walkPop(): string {
  const p = WALK.pops[0] as Pop;
  const all = [WALK_SRC, ...p.queue];
  return table([
    [
      "T2 가 시작하는 시점",
      `queue ${qshow([WALK_SRC])}`,
      `head = ${p.headBefore}`,
      `꺼낼 것이 ${p.lenBefore - p.headBefore} 개`,
    ],
    [
      "꺼낸 직후",
      `queue ${qshow([WALK_SRC])}`,
      `head = ${p.headBefore + 1}`,
      `꺼낼 것이 ${p.lenBefore - p.headBefore - 1} 개 · inQueue[${p.u}] = false`,
    ],
    [
      "T2 가 끝난 시점",
      `queue ${qshow(all)}`,
      `head = ${p.headBefore + 1}`,
      `꺼낼 것이 ${p.queue.length} 개`,
    ],
  ]).join("\n");
}

/** 짚고 가기 1 — 꺼낸 정점의 표시를 안 내리면. */
function pauseFlagDown(): string {
  const rows = MUTANT_CASES.map((c) => {
    const a = show(spfa(c.n, c.edges, 0));
    const b = show(noFlagDown.spfa(c.n, c.edges, 0));
    return [c.label, a, b, a === b ? "같다" : "다르다"];
  });
  return table([["입력", "정본", "표시를 안 내린 판", "판정"], ...rows]).join(
    "\n",
  );
}

/** 짚고 가기 1 — 전개 입력에서 두 판이 처음 갈리는 걸음. */
function pauseFlagDownWhere(): string {
  const mut = record(WALK_N, WALK_EDGES, WALK_SRC, FLAG_KEPT);
  let at = -1;
  for (let i = 0; i < WALK.pops.length; i++) {
    const a = WALK.pops[i] as Pop;
    const b = mut.pops[i];
    if (!b || !sameArr(a.queue, b.queue) || !sameArr(a.dist, b.dist)) {
      at = i;
      break;
    }
  }
  const lines: string[] = [];
  if (at < 0) {
    lines.push("두 판의 걸음이 끝까지 같다");
  } else {
    const a = WALK.pops[at] as Pop;
    const b = mut.pops[at] as Pop;
    lines.push(
      `두 판이 처음 갈리는 걸음 — T${a.t + 1} (정점 ${a.u}${을를(a.u)} 꺼낸다)`,
    );
    lines.push(
      ...table(
        [
          ["정본", fixesOf(a).join(" · "), `큐 ${qshow(a.queue)}`],
          ["표시를 안 내린 판", fixesOf(b).join(" · "), `큐 ${qshow(b.queue)}`],
        ],
        "  ",
      ),
    );
  }
  lines.push("");
  lines.push(
    ...table(
      [
        [
          "정본이 돌려준 dist",
          show(WALK.dist),
          `꺼내기 ${WALK.pops.length} 번`,
        ],
        ["표시를 안 내린 판", show(mut.dist), `꺼내기 ${mut.pops.length} 번`],
      ],
      "  ",
    ),
  );
  return lines.join("\n");
}

/** deep.walk 3 — T2 에서 꺼낸 정점 0 의 간선 셋. */
function walkT2(): string {
  const p = WALK.pops[0] as Pop;
  return [
    `T2 — 정점 ${p.u}${을를(p.u)} 꺼내고 나가는 간선 ${p.reads.length} 개를 읽는다`,
    ...table(
      p.reads.map((r) => [
        `(${r.v}, ${r.w})`,
        `${calcOf(r)} < ${num(r.before)}`,
        r.improved ? `⑤ dist[${r.v}] = ${num(r.cand)}` : "⑤ 거짓",
        r.pushed ? "⑥ 넣는다" : r.held ? "⑥ 거짓 — 이미 큐에 있다" : "",
      ]),
      "  ",
    ),
    "",
    ...table(
      [
        ["걸음이 끝난 dist", show(p.dist)],
        ["걸음이 끝난 queue", qshow(p.queue)],
      ],
      "  ",
    ),
  ].join("\n");
}

/** 짚고 가기 2 — 중복 검사를 빼도 답은 안 갈린다. */
function pauseDedupAnswer(): string {
  const rows = MUTANT_CASES.map((c) => {
    const a = show(spfa(c.n, c.edges, 0));
    const b = show(noDedup.spfa(c.n, c.edges, 0));
    return [c.label, a, b, a === b ? "같다" : "다르다"];
  });
  return table([["입력", "정본", "중복 검사를 뺀 판", "판정"], ...rows]).join(
    "\n",
  );
}

/** 짚고 가기 2 — 답은 같은데 계수가 갈리는 자리. */
function pauseDedupCost(): string {
  const h = hubShape(256);
  const inputs: [string, number, Edge[]][] = [
    ["전개 입력 (V = 6)", WALK_N, WALK_EDGES],
    ["완전 그래프 (V = 64)", 64, complete(64)],
    ["사슬이 허브로 들어가는 모양 (V = 256)", h.n, h.edges],
  ];
  const rows = inputs.flatMap(([label, n, edges]) => {
    const a = counted(n, edges, 0);
    const b = counted(n, edges, 0, { dedup: !DEDUP_OFF });
    return [
      [
        label,
        "정본",
        comma(a.pops),
        comma(a.reads),
        comma(a.pushes),
        comma(a.peak),
      ],
      [
        label,
        "중복 검사를 뺀 판",
        comma(b.pops),
        comma(b.reads),
        comma(b.pushes),
        comma(b.peak),
      ],
    ];
  });
  const a = counted(h.n, h.edges, 0);
  const b = counted(h.n, h.edges, 0, { dedup: !DEDUP_OFF });
  return [
    md(
      [
        "입력",
        "판",
        "꺼낸 횟수",
        "간선 읽기",
        "큐에 넣은 횟수",
        "큐가 가장 길 때",
      ],
      rows,
      [2, 3, 4, 5],
    ),
    "",
    `허브 모양에서 큐에 넣은 횟수가 ${comma(a.pushes)} 번에서 ${comma(b.pushes)} 번으로, 큐가 가장 길 때가 ${comma(a.peak)} 개에서 ${comma(b.peak)} 개로 바뀌었습니다.`,
  ].join("\n");
}

/** deep.walk 4 — 걸음마다 조건 판정. */
function walkTrace(): string {
  const rows: string[][] = [
    ["T1", "①②③ 준비", "—", "—", show(WALK.start), qshow([WALK_SRC])],
  ];
  for (const p of WALK.pops) {
    const relax =
      p.reads.length === 0
        ? "나가는 간선이 없다"
        : p.reads
            .map(
              (r) =>
                `${arrow([r.u, r.v, r.w])}: ${calcOf(r)} < ${num(r.before)} → **${r.improved ? "참" : "거짓"}**`,
            )
            .join(" · ");
    const pushes = p.reads.filter((r) => r.improved);
    const push =
      pushes.length === 0
        ? "—"
        : pushes
            .map((r) => `${r.v}: **${r.pushed ? "참" : "거짓"}**`)
            .join(" · ");
    rows.push([
      `T${p.t + 1}`,
      `④ \`${p.headBefore} < ${p.lenBefore}\` → **참** · 정점 ${p.u}`,
      relax,
      push,
      show(p.dist),
      qshow(p.queue),
    ]);
  }
  const endHead = WALK.pops.length;
  rows.push([
    `T${WALK.pops.length + 2}`,
    `\`${endHead} < ${endHead}\` → **거짓** · 반환`,
    "—",
    "—",
    show(WALK.dist),
    qshow([]),
  ]);
  const reads = WALK.pops.flatMap((p) => p.reads);
  return [
    md(
      [
        "걸음",
        "④ `head < queue.length`",
        "⑤ `nd < dist[v]`",
        "⑥ `!inQueue[v]`",
        "dist",
        "큐 — 꺼낼 차례",
      ],
      rows,
    ),
    "",
    `꺼내기 ${WALK.pops.length} 번 · 간선 읽기 ${reads.length} 번 · 값을 고친 것 ${reads.filter((r) => r.improved).length} 번 · 큐에 다시 넣은 것 ${reads.filter((r) => r.pushed).length} 번입니다. 반환값은 ${show(WALK.dist)} 입니다.`,
  ].join("\n");
}

/** deep.walk 4 — 낡은 값이 고쳐지는 경로. */
function walkStale(): string {
  // dist[4] 를 두 번 고친 걸음과 그 사이에 dist[3] 을 줄인 걸음을 찾는다.
  const writes4 = WALK.pops.filter((p) =>
    p.reads.some((r) => r.v === 4 && r.improved),
  );
  const first = writes4[0] as Pop;
  const second = writes4[1] as Pop;
  const mid = WALK.pops.find(
    (p) =>
      p.t > first.t &&
      p.t < second.t &&
      p.reads.some((r) => r.v === 3 && r.improved),
  ) as Pop;
  const r1 = first.reads.find((r) => r.v === 4) as EdgeRead;
  const rm = mid.reads.find((r) => r.v === 3) as EdgeRead;
  const r2 = second.reads.find((r) => r.v === 4) as EdgeRead;
  return table([
    [
      `T${first.t + 1}`,
      `dist[3] = ${num(r1.du)}${으로(num(r1.du))} 3→4 를 읽는다`,
      `dist[4] = ${num(r1.cand)}`,
    ],
    [
      `T${mid.t + 1}`,
      `dist[3] 이 ${num(rm.before)} 에서 ${num(rm.cand)}${으로(num(rm.cand))} 준다`,
      rm.pushed ? "정점 3 을 다시 넣는다" : "정점 3 은 이미 큐에 있다",
    ],
    [
      `T${second.t + 1}`,
      `정점 3 을 꺼내 3→4 를 다시 읽는다 — ${calcOf(r2)} < ${num(r2.before)}`,
      `dist[4] = ${num(r2.cand)}`,
    ],
  ]).join("\n");
}

/** deep.walk 4 — 여섯 갈래가 어느 입력에서 몇 번 실행됐는가. */
function branchCoverage(): string {
  const a = branchCounts(WALK);
  const b = branchCounts(record(LATE_N, LATE_EDGES, 0));
  const rows = LABELS.map(([mark, what], i) => [
    mark,
    what,
    comma(a[i] as number),
    comma(b[i] as number),
  ]);
  return [
    md(["라벨", "갈래", "전개 입력", "늦게 찾은 짧은 경로 입력"], rows, [2, 3]),
    "",
    `전개 입력에서 ⑤ 가 ${a[4]} 번 참이고 ⑥ 이 ${a[5]} 번 참이라, 값을 고치고도 큐에 넣지 않은 것이 ${(a[4] as number) - (a[5] as number)} 번입니다.`,
  ].join("\n");
}

/** deep.walk 5 — 전체 코드를 여러 입력에 실행한다. */
function walkResult(): string {
  const calls: [string, number, Edge[], number][] = [
    [
      `spfa(${WALK_N}, ${JSON.stringify(WALK_EDGES)}, ${WALK_SRC})`,
      WALK_N,
      WALK_EDGES,
      WALK_SRC,
    ],
    [
      `spfa(${LATE_N}, ${JSON.stringify(LATE_EDGES)}, 0)`,
      LATE_N,
      LATE_EDGES,
      0,
    ],
    [`spfa(${FAR_N}, ${JSON.stringify(FAR_EDGES)}, 0)`, FAR_N, FAR_EDGES, 0],
    ["spfa(3, [], 2)", 3, [], 2],
    ["spfa(1, [], 0)", 1, [], 0],
  ];
  return table(
    calls.map(([label, n, e, s]) => [label, `-> ${show(spfa(n, e, s))}`]),
  ).join("\n");
}

/** related — 이 편의 어느 값이 워크리스트였는가. */
function relatedWorklist(): string {
  const last = WALK.pops.at(-1) as Pop;
  const held = WALK.pops.find((p) => p.reads.some((r) => r.held)) as Pop;
  const heldR = held.reads.find((r) => r.held) as EdgeRead;
  const again = WALK.pops.find((p) =>
    p.reads.some(
      (r) => r.pushed && WALK.pops.some((q) => q.t < p.t && q.u === r.v),
    ),
  ) as Pop;
  const againR = again.reads.find(
    (r) => r.pushed && WALK.pops.some((q) => q.t < again.t && q.u === r.v),
  ) as EdgeRead;
  return table([
    ["워크리스트의 말", "이 편에서", "전개 입력의 자리"],
    ["항목", "정점", `정점 ${WALK_N} 개`],
    ["목록", "큐", `가장 길 때 ${WALK.peak} 개`],
    ["항목에 딸린 값", "dist[v]", "줄어드는 쪽으로만 바뀐다"],
    [
      "다시 계산하는 범위",
      "v 에서 나가는 간선",
      `간선 읽기 ${WALK.pops.reduce((a, p) => a + p.reads.length, 0)} 번`,
    ],
    [
      "이미 든 항목은 또 넣지 않는다",
      "inQueue",
      `T${held.t + 1} 의 정점 ${heldR.v}`,
    ],
    [
      "처리한 항목도 값이 바뀌면 다시 넣는다",
      "⑥",
      `T${again.t + 1} 의 정점 ${againR.v}`,
    ],
    [
      "목록이 비면 끝난다",
      "head === queue.length",
      `T${last.t + 1} 뒤 큐가 ${qshow(last.queue)}`,
    ],
  ]).join("\n");
}

/** purpose.alt — 두 설계의 기본 연산과 추가 칸. */
function altTable(): string {
  const mine = altCases["이 가이드의 절차"]();
  const bf = altCases["벨만-포드"]();
  const cross = crossing();
  const leaves = [1, cross.tie - 1, cross.tie, cross.ahead, 4096];
  const rows = leaves.map((p) => {
    const key = `잎 ${p} 개 · 기본 연산`;
    const a = mine[key] as number;
    const b = bf[key] as number;
    const which = a < b ? "이 가이드의 절차" : a > b ? "벨만-포드" : "같다";
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
      ["잎 p", "이 가이드의 절차", "벨만-포드", "적은 쪽", "차이"],
      rows,
      [1, 2, 4],
    ),
    "",
    `추가 칸은 잎 4,096 개에서 이 가이드의 절차가 ${comma(mine["잎 4096 개 · 추가 칸"] as number)} 개, 벨만-포드가 ${comma(bf["잎 4096 개 · 추가 칸"] as number)} 개입니다. 전개 입력에서는 기본 연산이 ${mine["전개 입력 · 기본 연산"]} 번 대 ${bf["전개 입력 · 기본 연산"]} 번, 추가 칸이 ${mine["전개 입력 · 추가 칸"]} 개 대 ${bf["전개 입력 · 추가 칸"]} 개입니다. 두 계수는 잎 ${cross.tie} 개에서 같아지고 ${cross.ahead} 개부터 벨만-포드가 적습니다.`,
  ].join("\n");
}

/** purpose.alt — 경계가 그 자리인 까닭. 잎 하나를 더할 때 두 계수가 늘어나는 값. */
function altBoundary(): string {
  const cross = crossing();
  const one = hub(1);
  const two = hub(2);
  const a1 = 큐에담는설계(one.n, one.edges, 0);
  const a2 = 큐에담는설계(two.n, two.edges, 0);
  const b1 = 라운드로읽는설계(one.n, one.edges, 0);
  const b2 = 라운드로읽는설계(two.n, two.edges, 0);
  const hubPops = counted(one.n, one.edges, 0).c[one.n - 2] as number;
  const roundsUsed = rounds(one.n, one.edges, 0, true).rows.length;
  const da = a2.ops - a1.ops;
  const db = b2.ops - b1.ops;
  const gap = b1.ops - a1.ops;
  return [
    "잎을 하나 더할 때 두 설계가 늘어나는 기본 연산",
    ...table(
      [
        [
          "이 절차",
          `허브를 ${hubPops} 번 꺼낼 때마다 그 잎의 간선을 읽고, 잎을 넣고 꺼낸다`,
          `+${da}`,
        ],
        [
          "벨만-포드",
          `라운드 ${roundsUsed} 번이 그 잎의 간선 1 개를 한 번씩 읽는다`,
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
          `${comma(b1.ops)} − ${comma(a1.ops)} = ${comma(gap)}`,
        ],
        ["잎 하나마다 줄어드는 차", `${da} − ${db} = ${da - db}`],
        [
          "차가 0 이 되는 잎",
          `1 + ${comma(gap)} ÷ ${da - db} = ${1 + gap / (da - db)}`,
        ],
        [
          "실측한 경계",
          `잎 ${cross.tie} 개에서 같아지고 ${cross.ahead} 개부터 벨만-포드가 적다`,
        ],
      ],
      "  ",
    ),
  ].join("\n");
}

/** deep.math ② — 정의를 전개 입력의 값에 넣어 확인한다. */
function mathCheck(): string {
  const deg = outDegree(WALK_N, WALK_EDGES);
  const rows = Array.from({ length: WALK_N }, (_, v) => [
    String(v),
    String(WALK.c[v]),
    String(deg[v]),
    String((WALK.c[v] as number) * (deg[v] as number)),
  ]);
  const sum = WALK.c.reduce((t, k, v) => t + k * (deg[v] as number), 0);
  const reads = WALK.pops.reduce((a, p) => a + p.reads.length, 0);
  return [
    ...table([["정점 v", "c(v)", "d+(v)", "c(v) x d+(v)"], ...rows]),
    "",
    `합계 ${sum} · 실행이 센 간선 읽기 ${reads}`,
    `묶음 수 ${WALK.waves.length} · V = ${WALK_N} · c(v) 의 최댓값 ${Math.max(...WALK.c)}`,
  ].join("\n");
}

/** deep.math ④ — 결과식에 규모를 넣는다. */
function mathScale(): string {
  const rows = [10, 100, V_LIMIT].map((v) => {
    const e = v * (v - 1);
    return [comma(v), comma(e), comma(v - 1), comma((v - 1) * e)];
  });
  return [
    ...table([
      [
        "정점 V",
        "간선 E = V(V−1)",
        "c(v) 상한 V−1",
        "간선 읽기 상한 (V−1) x E",
      ],
      ...rows,
    ]),
    "",
    "규모의 상한에서",
    ...table(
      [
        [
          "거리 값의 절댓값",
          `(V−1) x ${comma(W_LIMIT)} = ${comma((V_LIMIT - 1) * W_LIMIT)} 까지`,
        ],
        [
          "정수를 정확히 담는 한계",
          `2^53 − 1 = ${comma(Number.MAX_SAFE_INTEGER)}`,
        ],
        [
          "둘의 비",
          `${comma(Math.floor(Number.MAX_SAFE_INTEGER / ((V_LIMIT - 1) * W_LIMIT)))} 배 넘게 남는다`,
        ],
      ],
      "  ",
    ),
  ].join("\n");
}

/** 불변식 ② — `while` 조건을 검사하는 시점마다 두 문장을 확인한다. */
function invariantWatchBlock(): string {
  const w = invariantWatch(WALK_N, WALK_EDGES, WALK_SRC);
  const rows = w.map((r) => [
    `T${r.step + 1}`,
    qshow(r.queue),
    r.relaxable.length === 0 ? "없다" : r.relaxable.join(" · "),
    r.ok ? "지킨다" : "어긋난다",
  ]);
  const ok = w.filter((r) => r.ok).length;
  return [
    md(["검사 시점", "큐", "완화할 수 있는 간선", "두 문장"], rows),
    "",
    `검사 시점 ${w.length} 곳 가운데 두 문장을 지킨 곳이 ${ok} 곳입니다.`,
  ].join("\n");
}

/** 불변식 ② — 경계 입력을 정본에 그대로 걸어 본다. */
function invariantEdges(): string {
  const cases: [string, number, Edge[], number][] = [
    ["정점 하나, 간선 없음", 1, [], 0],
    ["정점 셋, 간선 없음", 3, [], 2],
    ["도달할 수 없는 정점", FAR_N, FAR_EDGES, 0],
    [
      "같은 두 정점 사이의 다중 간선",
      2,
      [
        [0, 1, 5],
        [0, 1, -2],
        [0, 1, 3],
      ],
      0,
    ],
    [
      "가중치가 0 인 간선",
      3,
      [
        [0, 1, 0],
        [1, 2, 0],
      ],
      0,
    ],
    [
      "가중치 합이 0 인 사이클",
      3,
      [
        [0, 1, 2],
        [1, 2, -1],
        [2, 1, 1],
      ],
      0,
    ],
    [
      "가중치의 절댓값이 10^9",
      3,
      [
        [0, 1, W_LIMIT],
        [1, 2, -W_LIMIT],
      ],
      0,
    ],
    [
      "자기 자신을 가리키는 양수 간선",
      2,
      [
        [0, 0, 5],
        [0, 1, 2],
      ],
      0,
    ],
  ];
  const rows = cases.map(([label, n, edges, src]) => {
    const ref = spfa(n, edges, src);
    const c = counted(n, edges, src);
    return [label, String(src), show(ref), comma(c.pops), comma(c.reads)];
  });
  return md(
    ["경계 입력", "src", "dist", "꺼낸 횟수", "간선 읽기"],
    rows,
    [1, 3, 4],
  );
}

/** 불변식 ③ — 값이 줄어든 정점을 큐에 넣는 줄을 뺀 변이. */
function mutantNoPush(): string {
  const rows = MUTANT_CASES.map((c) => {
    const a = show(spfa(c.n, c.edges, 0));
    const b = show(noPush.spfa(c.n, c.edges, 0));
    return [c.label, a, b, a === b ? "같다" : "다르다"];
  });
  return table([["입력", "정본", "큐에 안 넣는 판", "판정"], ...rows]).join(
    "\n",
  );
}

/** 불변식 ③ — 뒤 문장이 어디서 깨지는가. */
function mutantNoPushWhere(): string {
  const mut = record(WALK_N, WALK_EDGES, WALK_SRC, PUSH_DROPPED);
  const p = mut.pops[0] as Pop;
  const d = p.dist;
  const relaxable = WALK_EDGES.filter(
    ([u, v, w]) => d[u] !== INF && (d[u] as number) + w < (d[v] as number),
  );
  const tails = [...new Set(relaxable.map(([u]) => u))];
  const outside = tails.filter((u) => !p.queue.includes(u));
  return [
    `정점 ${p.u}${을를(p.u)} 꺼낸 걸음이 끝난 시점`,
    ...table(
      [
        ["dist", show(d)],
        [
          "완화할 수 있는 간선",
          relaxable.length === 0 ? "없다" : relaxable.map(arrow).join(" · "),
        ],
        ["큐", qshow(p.queue)],
        [
          "큐 밖에 있는 꼬리 정점",
          outside.length === 0 ? "없다" : outside.join(" · "),
        ],
      ],
      "  ",
    ),
    "",
    `큐에 안 넣는 판은 꺼내기 ${mut.pops.length} 번 만에 ${show(mut.dist)}${을를(show(mut.dist))} 돌려준다`,
  ].join("\n");
}

/** perf.derive — 전개의 걸음마다 간선 읽기를 센다. */
function perfCount(): string {
  const rows: string[][] = [];
  let acc = 0;
  for (const p of WALK.pops) {
    acc += p.reads.length;
    rows.push([
      `T${p.t + 1}`,
      String(p.u),
      String(p.reads.length),
      String(acc),
    ]);
  }
  const never = Array.from({ length: WALK_N }, (_, v) => v).filter(
    (v) => WALK.c[v] === 0,
  );
  return [
    md(["걸음", "꺼낸 정점", "간선 읽기", "여기까지 누적"], rows, [2, 3]),
    "",
    `꺼내기 ${WALK.pops.length} 번에 간선 읽기가 ${acc} 번이고, 한 번도 큐에 들지 않은 정점 ${never.join(" · ")}${이가(never.join(" · "))} 나가는 간선은 한 번도 읽지 않았습니다.`,
  ].join("\n");
}

/** perf.derive — 총식에 전개 입력과 규모의 상한을 넣는다. */
function perfTotal(): string {
  const reads = WALK.pops.reduce((a, p) => a + p.reads.length, 0);
  const pops = WALK.pops.length;
  const E = WALK_EDGES.length;
  const total = 2 * WALK_N + E + pops + reads;
  const V = V_LIMIT;
  const bigTotal = 2 * V + E_LIMIT + (V - 1) * V + (V - 1) * E_LIMIT;
  return table(
    [
      [
        `V = ${WALK_N} · E = ${E}`,
        `2 x ${WALK_N} + ${E} + ${pops} + ${reads} = ${total}`,
      ],
      [
        `V = ${V} · E = ${comma(E_LIMIT)}`,
        `2 x ${V} + ${comma(E_LIMIT)} + ${V - 1} x ${V} + ${V - 1} x ${comma(E_LIMIT)} = ${comma(bigTotal)} 이하`,
      ],
    ],
    "  ",
  ).join("\n");
}

/** perf.derive — 추가 칸을 전개 입력에서 센다. `.alt.ts` 와 같은 기준이다. */
function perfMemory(): string {
  const cells = 큐에담는설계(WALK_N, WALK_EDGES, WALK_SRC).cells;
  const pushes = WALK.c.reduce((a, k) => a + k, 0);
  if (cells !== 3 * WALK_N + WALK.peak) {
    throw new Error("추가 칸이 경쟁 설계 사이드카의 값과 다르다");
  }
  return [
    md(
      ["저장하는 것", "칸 수"],
      [
        ["거리 배열 dist", String(WALK_N)],
        ["큐 표시 inQueue", String(WALK_N)],
        ["이웃 목록의 정점별 칸 adj", String(WALK_N)],
        ["큐에 함께 든 항목이 가장 많을 때", String(WALK.peak)],
        ["추가 칸", String(cells)],
      ],
      [1],
    ),
    "",
    `이웃 목록이 옮겨 담은 간선 ${WALK_EDGES.length} 개와, 꺼낸 칸을 지우지 않는 정본의 queue 배열이 끝까지 자란 길이 ${pushes} 칸은 추가 칸에 넣지 않았습니다.`,
  ].join("\n");
}

/** perf.bounds — 관측된 계수는 생성식에 딸린 값이다. */
function perfObserved(): string {
  const rows: string[][] = [];
  for (const v of [125, 250, V_LIMIT]) {
    const edges = randomSparse(v, SEED);
    const c = counted(v, edges, 0);
    rows.push([
      "무작위",
      comma(v),
      comma(edges.length),
      comma(c.reads),
      (c.reads / edges.length).toFixed(2),
      String(Math.max(...c.c)),
    ]);
  }
  for (const v of [125, 250, V_LIMIT]) {
    const { n, edges } = hubShape(v);
    const c = counted(n, edges, 0);
    rows.push([
      "허브",
      comma(n),
      comma(edges.length),
      comma(c.reads),
      (c.reads / edges.length).toFixed(2),
      String(Math.max(...c.c)),
    ]);
  }
  return [
    md(
      [
        "생성식",
        "정점 V",
        "간선 E",
        "간선 읽기",
        "간선 읽기 / E",
        "넣은 횟수의 최댓값",
      ],
      rows,
      [1, 2, 3, 4, 5],
    ),
    "",
    `무작위 줄은 사슬 하나에 앞으로만 가는 간선을 덧붙인 생성식(시드 ${SEED})이고, 허브 줄은 사슬이 허브로 들어가는 모양입니다.`,
  ].join("\n");
}

/** perf.worst — 모양마다 간선 읽기를 실제로 잰다. */
function worstShape(): string {
  const V = 64;
  const h = hubShape(V);
  const shapes: [string, number, Edge[]][] = [
    ["사슬, 오름차순으로 적음", V, chain(V, false)],
    ["사슬, 내림차순으로 적음", V, chain(V, true)],
    ["완전 그래프", V, complete(V)],
    ["사슬이 허브로 들어가는 모양", h.n, h.edges],
  ];
  const rows = shapes.map(([label, n, edges]) => {
    const c = counted(n, edges, 0);
    const flipped = counted(n, [...edges].reverse(), 0);
    const r = rounds(n, edges, 0, true);
    return [
      label,
      comma(edges.length),
      comma(c.reads),
      comma(flipped.reads),
      String(Math.max(...c.c)),
      comma(r.reads),
    ];
  });
  return [
    md(
      [
        "모양 (V = 64)",
        "간선 E",
        "간선 읽기",
        "목록을 뒤집은 간선 읽기",
        "넣은 횟수의 최댓값",
        "벨만-포드의 간선 읽기",
      ],
      rows,
      [1, 2, 3, 4, 5],
    ),
    "",
    `간선이 가장 많은 완전 그래프에서 넣은 횟수의 최댓값이 ${Math.max(...counted(V, complete(V), 0).c)} 입니다.`,
  ].join("\n");
}

/** perf.worst — 허브 모양을 키우며 (V−1)E 에 대한 비를 잰다. */
function worstGrowth(): string {
  const rows = [32, 64, 128, 256, V_LIMIT].map((v) => {
    const { n, edges } = hubShape(v);
    const c = counted(n, edges, 0);
    const bound = (n - 1) * edges.length;
    return [
      comma(n),
      comma(edges.length),
      comma(c.reads),
      comma(bound),
      (c.reads / bound).toFixed(3),
    ];
  });
  return [
    md(
      ["정점 V", "간선 E", "간선 읽기", "(V−1) x E", "그 비"],
      rows,
      [0, 1, 2, 3, 4],
    ),
    "",
    `마지막 줄이 규모의 상한 V = ${V_LIMIT} 입니다.`,
  ].join("\n");
}

/** perf.worst — 축마다 최악으로 만든 입력과 그 값. */
function worstAxes(): string {
  const small = hubShape(64);
  const big = hubShape(V_LIMIT);
  const a = counted(small.n, small.edges, 0);
  const b = counted(big.n, big.edges, 0);
  const ratio = (c: Counts, n: number, e: number) =>
    (c.reads / ((n - 1) * e)).toFixed(3);
  return [
    md(
      [
        "최악으로 만들 축",
        "그 축을 크게 만드는 입력",
        `V = 64`,
        `V = ${V_LIMIT}`,
      ],
      [
        [
          "한 정점의 넣은 횟수",
          "사슬 V/2 개가 허브로 들어간다",
          String(Math.max(...a.c)),
          String(Math.max(...b.c)),
        ],
        [
          "간선 읽기 ÷ ((V − 1) × E)",
          "그 허브에서 잎 V/2 개로 나간다",
          ratio(a, small.n, small.edges.length),
          ratio(b, big.n, big.edges.length),
        ],
      ],
      [2, 3],
    ),
    "",
    `넣은 횟수의 최댓값은 V = 64 에서 64 ÷ 4 = ${64 / 4}${과와(64 / 4)} ${Math.max(...a.c) === 64 / 4 ? "같고" : "다르고"}, V = ${V_LIMIT} 에서 ${V_LIMIT} ÷ 4 = ${V_LIMIT / 4}${과와(V_LIMIT / 4)} ${Math.max(...b.c) === V_LIMIT / 4 ? "같습니다" : "다릅니다"}.`,
  ].join("\n");
}

/** selfcheck — T5 와 T8 의 dist. */
function selfcheckStale(): string {
  const writes4 = WALK.pops.filter((p) =>
    p.reads.some((r) => r.v === 4 && r.improved),
  );
  const a = writes4[0] as Pop;
  const b = writes4[1] as Pop;
  return table([
    [`T${a.t + 1} 의 dist`, show(a.dist)],
    [`T${b.t + 1} 의 dist`, show(b.dist)],
    [
      "값이 있다가 바뀐 자리",
      `dist[4] 가 ${num(a.dist[4] as number)} 에서 ${num(b.dist[4] as number)}${으로(num(b.dist[4] as number))}`,
    ],
  ]).join("\n");
}

/** 경로의 비용. */
function costOf(path: readonly number[]): number {
  let c = 0;
  for (let i = 0; i + 1 < path.length; i++) {
    const e = WALK_EDGES.find(
      ([u, v]) => u === path[i] && v === path[i + 1],
    ) as Edge;
    c += e[2];
  }
  return c;
}

/** selfcheck 답 — dist[4] 에 붙은 두 값이 각각 어느 경로의 비용인가. */
function selfcheckPaths(): string {
  const writes4 = WALK.pops.filter((p) =>
    p.reads.some((r) => r.v === 4 && r.improved),
  );
  const rows = writes4.map((p) => {
    const val = (p.reads.find((r) => r.v === 4) as EdgeRead).cand;
    const path = p.paths[4] as number[];
    if (costOf(path) !== val)
      throw new Error("적어 둔 경로의 비용이 값과 다르다");
    return [`T${p.t + 1}`, num(val), path.join("→"), String(path.length - 1)];
  });
  const paths = simplePathsTo(WALK_N, WALK_EDGES, WALK_SRC, 4);
  return [
    md(
      ["걸음", "dist[4] 에 적힌 값", "경로의 정점 차례", "간선 수"],
      rows,
      [3],
    ),
    "",
    `두 값 모두 실재하는 경로의 비용이고, 정점 4 로 가는 단순 경로 ${paths.length} 개 가운데 가장 작은 비용은 ${num(Math.min(...paths.map((x) => x.cost)))} 입니다.`,
  ].join("\n");
}

export const PROOFS: { [id: string]: () => string } = {
  conceptPaths,
  conceptRounds,
  conceptQueue,
  naiveScale,
  originRound3,
  originWaste,
  originFlag,
  waveTable,
  waveRead,
  waveMembers,
  waveVsLayer,
  waveStop,
  stageAdj,
  stageStart,
  stagePop,
  stageReentry,
  stageEnd,
  premiseCycle,
  premiseDetect,
  designOrder,
  walkInput,
  walkT1,
  walkPop,
  pauseFlagDown,
  pauseFlagDownWhere,
  walkT2,
  pauseDedupAnswer,
  pauseDedupCost,
  walkTrace,
  walkStale,
  branchCoverage,
  walkResult,
  relatedWorklist,
  altTable,
  altBoundary,
  mathCheck,
  mathScale,
  invariantWatch: invariantWatchBlock,
  invariantEdges,
  mutantNoPush,
  mutantNoPushWhere,
  perfCount,
  perfTotal,
  perfMemory,
  perfObserved,
  worstShape,
  worstGrowth,
  worstAxes,
  selfcheckStale,
  selfcheckPaths,
};

// 조사 헬퍼를 블록 밖에서도 쓰려면 여기서 다시 내보낸다(그림 사이드카가 같은 헬퍼를 쓴다).
export { 으로, 은는, 을를, 이가 };
