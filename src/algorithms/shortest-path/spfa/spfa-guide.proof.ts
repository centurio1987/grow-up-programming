/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run tools/check-proof.ts src/algorithms/shortest-path/spfa/spfa-guide.md
 *
 * **계수를 세는 사본이 여럿 있다.** 정본은 몇 번 셌는지를 내보내지 않으므로, 세는 자리만
 * 덧붙인 사본이 아니면 계수를 낼 방법이 없다. **답이 맞는지는 사본이 아니라 정본이 진다** —
 * 아래 표의 「답」 칸은 전부 정본이나 정본에서 기계로 만든 변이가 낸 값이고, 사본은 계수만
 * 낸다. 사본이 정본과 같은 답을 내는지는 `자기대조()` 가 이 파일을 읽을 때 확인한다.
 *
 * **변이가 아무것도 안 바꾸는지를 검사하는 자리는 중화 실행을 피해 간다.** `check-proof` 가
 * 이 파일을 한 번 더 부를 때는 `loadMutant` 이 정본을 그대로 돌려주므로(중화), 그 상태에서
 * 「변이가 답을 안 바꿨다」로 던지면 중화 대조 자체가 실행되지 않는다. 중화 여부는 변이
 * 모듈의 함수가 정본과 **같은 객체인가**로 알아낸다.
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { type Edge, spfa } from "./spfa-guide.ref.ts";

const INF = Number.POSITIVE_INFINITY;

/* ────────────────────────── 고정 입력 ────────────────────────── */

/**
 * 본문 전개가 쓰는 그래프. 정점 여섯 · 방향 간선 여덟이고 정점 5 는 들어오는 간선이 없다.
 *
 * 여섯 갈래를 한 입력에서 전부 실행한다 — 이웃 목록 · 시작값 · 대기열 · 꺼내기 · 완화 ·
 * 다시 담기. 「이미 대기열에 있어 다시 담지 않는다」 갈래와 「이미 꺼낸 정점의 값이 다시
 * 줄어든다」 갈래가 둘 다 나오도록 `0 → 3` 과 `2 → 1` 을 넣었다.
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
 * 값이 1 씩 작아지고, 그때마다 허브가 대기열에 다시 담긴다. 허브의 나가는 간선이 잎 수만큼
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

/* ────────────────────────── 칸 맞춤 ────────────────────────── */

/** 한글은 고정폭 화면에서 두 칸을 먹는다. 칸 맞춤을 글자 수로 하면 머리줄만 어긋난다. */
const width = (s: string): number =>
  [...s].reduce((n, c) => n + (/[ᄀ-ᇿ　-〿㄰-㆏가-힯一-鿿]/.test(c) ? 2 : 1), 0);

const pad = (s: string, to: number): string =>
  s + " ".repeat(Math.max(0, to - width(s)));

const padLeft = (s: string, to: number): string =>
  " ".repeat(Math.max(0, to - width(s))) + s;

/** `[0, -2, 1, 2, 4, Infinity]` 꼴 — 본문 표기와 같다. */
const show = (xs: number[]): string => `[${xs.join(", ")}]`;

/** `20,000,000,000` 꼴 — 본문 표기와 같다. */
const comma = (n: number): string => n.toLocaleString("en-US");

/** 표 한 벌을 칸에 맞춰 낸다. 첫 행이 머리줄이다. */
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

export interface Counts {
  dist: number[];
  /** 대기열에서 정점을 꺼낸 총 횟수. */
  pops: number;
  /** 간선 하나를 읽고 완화를 시도한 총 횟수. */
  reads: number;
  /** 값을 실제로 고친 횟수. */
  writes: number;
  /** 대기열에 담은 총 횟수. 처음 담는 한 번을 포함한다. */
  pushes: number;
  /** 값을 고쳤지만 이미 대기열에 있어 다시 담지 않은 횟수. */
  blocked: number;
  /** 대기열이 가장 길었을 때의 항목 수. */
  peak: number;
  /** 정점마다 꺼낸 횟수. */
  pop: number[];
  /** 꺼낸 순서. */
  order: number[];
  /** 걸음마다의 `dist`. 첫 원소가 시작값이다. */
  frames: number[][];
  /** 걸음이 끝난 시점의 대기열 내용. */
  queues: number[][];
  /** 걸음마다 고친 자리의 서술. */
  notes: string[];
  /** 걸음마다 값을 고친 횟수. */
  wrote: number[];
  /** 걸음마다 대기열에 새로 담은 횟수. */
  pushed: number[];
  /** 걸음마다 이미 담겨 있어 다시 안 담은 횟수. */
  held: number[];
}

/** 정본과 같은 절차에 세는 자리만 덧붙인 사본. */
export function counted(n: number, edges: Edge[], src: number): Counts {
  const adj: [number, number][][] = Array.from({ length: n }, () => []);
  for (const [u, v, w] of edges) (adj[u] as [number, number][]).push([v, w]);

  const dist = Array.from({ length: n }, () => INF);
  dist[src] = 0;
  const inQueue = Array.from({ length: n }, () => false);
  const queue: number[] = [src];
  inQueue[src] = true;
  let head = 0;

  const pop = Array.from({ length: n }, () => 0);
  const order: number[] = [];
  const frames: number[][] = [dist.slice()];
  const queues: number[][] = [queue.slice()];
  const notes: string[] = [];
  const wrote: number[] = [];
  const pushed: number[] = [];
  const held: number[] = [];
  let pops = 0;
  let reads = 0;
  let writes = 0;
  let pushes = 1;
  let blocked = 0;
  let peak = 1;

  while (head < queue.length) {
    const u = queue[head++] as number;
    inQueue[u] = false;
    pops++;
    pop[u] = (pop[u] as number) + 1;
    order.push(u);
    peak = Math.max(peak, queue.length - head);

    const done: string[] = [];
    let wroteHere = 0;
    let pushedHere = 0;
    let heldHere = 0;
    for (const [v, w] of adj[u] as [number, number][]) {
      reads++;
      const nd = (dist[u] as number) + w;
      if (nd < (dist[v] as number)) {
        done.push(
          `dist[${v}] ${dist[v] === INF ? "Infinity" : dist[v]} -> ${nd}`,
        );
        dist[v] = nd;
        writes++;
        wroteHere++;
        if (inQueue[v]) {
          blocked++;
          heldHere++;
        } else {
          inQueue[v] = true;
          queue.push(v);
          pushes++;
          pushedHere++;
        }
      }
    }
    frames.push(dist.slice());
    queues.push(queue.slice(head));
    notes.push(done.length === 0 ? "고친 것이 없다" : done.join(" · "));
    wrote.push(wroteHere);
    pushed.push(pushedHere);
    held.push(heldHere);
  }

  return {
    dist,
    pops,
    reads,
    writes,
    pushes,
    blocked,
    peak,
    pop,
    order,
    frames,
    queues,
    notes,
    wrote,
    pushed,
    held,
  };
}

/**
 * 걸음마다의 `dist` 사본을 남기지 않는 계수 사본.
 *
 * `counted` 는 걸음마다 `dist` 를 통째로 복사하므로 정점이 10 만 개인 입력에서 그 복사가
 * 실행의 대부분이 된다. 큰 규모에서 **계수만** 필요한 자리는 이쪽을 쓴다 — 절차는 같고
 * 기록만 뺐다.
 */
export function countedLite(
  n: number,
  edges: Edge[],
  src: number,
): { dist: number[]; pops: number; reads: number; pop: number[] } {
  const adj: [number, number][][] = Array.from({ length: n }, () => []);
  for (const [u, v, w] of edges) (adj[u] as [number, number][]).push([v, w]);

  const dist = Array.from({ length: n }, () => INF);
  dist[src] = 0;
  const inQueue = Array.from({ length: n }, () => false);
  const queue: number[] = [src];
  inQueue[src] = true;
  let head = 0;
  const pop = Array.from({ length: n }, () => 0);
  let pops = 0;
  let reads = 0;

  while (head < queue.length) {
    const u = queue[head++] as number;
    inQueue[u] = false;
    pops++;
    pop[u] = (pop[u] as number) + 1;
    for (const [v, w] of adj[u] as [number, number][]) {
      reads++;
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
  return { dist, pops, reads, pop };
}

/**
 * 바퀴 방식 — 간선 목록 전체를 되풀이해 읽는다. `earlyExit` 가 참이면 한 바퀴가 한 칸도
 * 못 고쳤을 때 거기서 끝낸다.
 */
export function rounds(
  n: number,
  edges: Edge[],
  src: number,
  earlyExit: boolean,
): { dist: number[]; rounds: number; reads: number; writes: number } {
  const dist = Array.from({ length: n }, () => INF);
  dist[src] = 0;
  let reads = 0;
  let writes = 0;
  let used = 0;
  for (let round = 1; round <= Math.max(1, n - 1); round++) {
    used++;
    let changed = false;
    for (const [u, v, w] of edges) {
      reads++;
      if (dist[u] === INF) continue;
      const nd = (dist[u] as number) + w;
      if (nd < (dist[v] as number)) {
        dist[v] = nd;
        writes++;
        changed = true;
      }
    }
    if (earlyExit && !changed) break;
  }
  return { dist, rounds: used, reads, writes };
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
  ];
  for (const [n, edges] of inputs) {
    const ref = show(spfa(n, edges, 0));
    if (show(counted(n, edges, 0).dist) !== ref) {
      throw new Error("세는 사본이 정본과 다른 답을 낸다");
    }
    if (show(countedLite(n, edges, 0).dist) !== ref) {
      throw new Error("기록 없는 사본이 정본과 다른 답을 낸다");
    }
    if (show(rounds(n, edges, 0, true).dist) !== ref) {
      throw new Error("바퀴 방식 사본이 정본과 다른 답을 낸다");
    }
  }
}
자기대조();

/**
 * 대기열을 **물결**로 갈라 센다. 물결 0 은 시작 정점 하나이고, 물결 `k` 를 처리하는 동안
 * 담긴 정점이 물결 `k+1` 이다. 한 물결 안에서 같은 정점은 많아야 한 번 꺼내진다.
 */
export function waves(
  n: number,
  edges: Edge[],
  src: number,
): { members: number[][]; frames: number[][] } {
  const adj: [number, number][][] = Array.from({ length: n }, () => []);
  for (const [u, v, w] of edges) (adj[u] as [number, number][]).push([v, w]);
  const dist = Array.from({ length: n }, () => INF);
  dist[src] = 0;
  const inQueue = Array.from({ length: n }, () => false);
  inQueue[src] = true;

  const members: number[][] = [];
  const frames: number[][] = [dist.slice()];
  let cur = [src];
  while (cur.length > 0) {
    members.push([...cur]);
    const next: number[] = [];
    for (const u of cur) {
      inQueue[u] = false;
      for (const [v, w] of adj[u] as [number, number][]) {
        const nd = (dist[u] as number) + w;
        if (nd < (dist[v] as number)) {
          dist[v] = nd;
          if (!inQueue[v]) {
            inQueue[v] = true;
            next.push(v);
          }
        }
      }
    }
    frames.push(dist.slice());
    cur = next;
  }
  return { members, frames };
}

/** 간선을 `k` 개 이하로 쓰는 경로의 최소 비용. 층을 하나씩 올리며 계산한다. */
export function optAtMost(
  n: number,
  edges: Edge[],
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

/** 출발점에서 나가는 단순 경로의 개수. */
export function simplePaths(n: number, edges: Edge[], src: number): number {
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
 * 꺼낸 횟수에 상한을 두고 실행한다. 음수 사이클이 있으면 대기열이 비지 않으므로, 값이
 * 어디까지 내려가는지를 보려면 상한이 있어야 한다.
 */
export function cappedPops(
  n: number,
  edges: Edge[],
  src: number,
  cap: number,
): { dist: number[]; drained: boolean } {
  const adj: [number, number][][] = Array.from({ length: n }, () => []);
  for (const [u, v, w] of edges) (adj[u] as [number, number][]).push([v, w]);
  const dist = Array.from({ length: n }, () => INF);
  dist[src] = 0;
  const inQueue = Array.from({ length: n }, () => false);
  const queue: number[] = [src];
  inQueue[src] = true;
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
        }
      }
    }
  }
  return { dist, drained: head >= queue.length };
}

/**
 * `while` 조건을 검사하는 시점마다 두 문장을 확인한다.
 *
 * 앞 문장 — `dist[v]` 가 유한하면 그 값이 실재하는 경로의 비용이다. 실재하지 않는 값은
 * 진짜 최단 비용보다 작아지므로, `dist[v] < opt(v)` 인 자리를 찾는 것으로 확인한다.
 * 뒤 문장 — 완화할 수 있는 간선의 꼬리 정점이 그 시점에 대기열 안에 있다.
 */
export function invariantWatch(
  n: number,
  edges: Edge[],
  src: number,
): { step: number; queue: number[]; relaxable: string[]; ok: boolean }[] {
  const truth = spfa(n, edges, src);
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
    for (const [u, v, w] of edges) {
      if (dist[u] === INF) continue;
      if ((dist[u] as number) + w < (dist[v] as number)) {
        relaxable.push(`${u}->${v}`);
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

/** 대기열 중복을 막는 검사를 늘 참으로 둔 사본. 같은 정점이 여러 벌 담긴다. */
const noDedup = await loadMutant<Impl>(REF, {
  swap: [/if \(!inQueue\[v\]\) \{/, "if (true) {"],
});

/** **불변식을 지키던 줄** 하나 — 값이 줄어든 정점을 대기열에 담는 줄을 뺀 사본. */
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

// 하나도 안 갈리면 그 절의 주장이 성립하지 않는다. 실행이 그것을 판정한다.
if (!중화됨) {
  for (const [label, impl] of [
    ["표시를 안 내린 판", noFlagDown],
    ["대기열에 안 담는 판", noPush],
  ] as [string, Impl][]) {
    if (
      MUTANT_CASES.every(
        (c) => show(spfa(c.n, c.edges, 0)) === show(impl.spfa(c.n, c.edges, 0)),
      )
    ) {
      throw new Error(`${label} 변이가 어느 입력에서도 답을 바꾸지 못했다`);
    }
  }
}

/** 중복 검사를 뺀 판의 계수. 정본과 같은 절차에 세는 자리만 덧붙였다. */
export function countedNoDedup(
  n: number,
  edges: Edge[],
  src: number,
): {
  dist: number[];
  pops: number;
  reads: number;
  pushes: number;
  peak: number;
} {
  const adj: [number, number][][] = Array.from({ length: n }, () => []);
  for (const [u, v, w] of edges) (adj[u] as [number, number][]).push([v, w]);
  const dist = Array.from({ length: n }, () => INF);
  dist[src] = 0;
  const queue: number[] = [src];
  let head = 0;
  let pops = 0;
  let reads = 0;
  let pushes = 1;
  let peak = 1;
  while (head < queue.length) {
    const u = queue[head++] as number;
    pops++;
    peak = Math.max(peak, queue.length - head);
    for (const [v, w] of adj[u] as [number, number][]) {
      reads++;
      const nd = (dist[u] as number) + w;
      if (nd < (dist[v] as number)) {
        dist[v] = nd;
        queue.push(v);
        pushes++;
      }
    }
  }
  return { dist, pops, reads, pushes, peak };
}

/* ────────────────────────── 수치 ────────────────────────── */

/** `m!` 의 자릿수. 경로 수가 배열에 안 들어가는 규모에서는 자릿수만 낸다. */
function factorialDigits(m: number): number {
  let log10 = 0;
  for (let k = 2; k <= m; k++) log10 += Math.log10(k);
  return Math.floor(log10) + 1;
}

const V_LIMIT = 100_000;
const E_LIMIT = 200_000;
const W_LIMIT = 1_000_000_000;

const LABELS: [string, string][] = [
  ["①", "이웃 목록을 만든다"],
  ["②", "시작값을 적는다"],
  ["③", "대기열을 만든다"],
  ["④", "정점을 하나 꺼낸다"],
  ["⑤", "완화가 값을 고친다"],
  ["⑥", "값이 줄어 다시 담는다"],
];

function branchCounts(n: number, edges: Edge[], src: number): number[] {
  const c = counted(n, edges, src);
  return [1, 1, 1, c.pops, c.writes, c.pushes - 1];
}

const answer = (xs: number[]): string => show(xs);

export const PROOFS: Record<string, () => string> = {
  /** deep.build ② — 경로를 전부 만드는 방법이 규모에서 몇 번이 되는가. */
  naiveScale: () => {
    const rows = [4, 6, 8, 10].map((v) => {
      const edges = complete(v);
      const c = counted(v, edges, 0);
      return [
        String(v),
        comma(edges.length),
        comma(simplePaths(v, edges, 0)),
        comma(c.pops),
        comma(c.reads),
      ];
    });
    return [
      ...table(
        [
          ["정점 V", "간선 E", "단순 경로 수", "꺼낸 횟수", "간선 읽기"],
          ...rows,
        ],
        [0, 1, 2, 3, 4],
      ),
      "",
      `제약 규모 V = ${comma(V_LIMIT)} · E = ${comma(E_LIMIT)} 이면`,
      `  단순 경로 수  ${comma(V_LIMIT - 1)}! 보다 크고, 그 계승은 ${comma(factorialDigits(V_LIMIT - 1))} 자리 수다`,
      `  간선 읽기     많아야 (V−1) x E = ${comma((V_LIMIT - 1) * E_LIMIT)} 번`,
    ].join("\n");
  },

  /** deep.build ③ — 바퀴 방식을 전개 입력에 실행해 바퀴마다 헛읽기를 센다. */
  roundWaste: () => {
    const fixed = rounds(WALK_N, WALK_EDGES, WALK_SRC, false);
    const early = rounds(WALK_N, WALK_EDGES, WALK_SRC, true);
    const rowsPerRound: string[][] = [];
    const dist = Array.from({ length: WALK_N }, () => INF);
    dist[WALK_SRC] = 0;
    for (let round = 1; round <= WALK_N - 1; round++) {
      let fixedHere = 0;
      for (const [u, v, w] of WALK_EDGES) {
        if (dist[u] === INF) continue;
        const nd = (dist[u] as number) + w;
        if (nd < (dist[v] as number)) {
          dist[v] = nd;
          fixedHere++;
        }
      }
      rowsPerRound.push([
        String(round),
        String(WALK_EDGES.length),
        String(fixedHere),
        String(WALK_EDGES.length - fixedHere),
        show(dist),
      ]);
    }
    return [
      ...table(
        [
          ["바퀴", "읽은 간선", "고친 자리", "아무것도 안 고친 읽기", "dist"],
          ...rowsPerRound,
        ],
        [0, 1, 2, 3],
      ),
      "",
      `바퀴를 V−1 = ${WALK_N - 1} 번 고정으로 실행하면 간선 읽기 ${fixed.reads} 번 · 고친 자리 ${fixed.writes} 번`,
      `한 바퀴가 한 칸도 못 고쳤을 때 끝내면 바퀴 ${early.rounds} 번 · 간선 읽기 ${early.reads} 번`,
    ].join("\n");
  },

  /** deep.build ④ — 같은 입력을 세 방식으로 처리하고 실제 계수를 나란히 놓는다. */
  twoWays: () => {
    const fixed = rounds(WALK_N, WALK_EDGES, WALK_SRC, false);
    const early = rounds(WALK_N, WALK_EDGES, WALK_SRC, true);
    const c = counted(WALK_N, WALK_EDGES, WALK_SRC);
    return [
      ...table(
        [
          [
            "처리 방식",
            "간선 읽기",
            "고친 자리",
            "아무것도 안 고친 읽기",
            "결과 dist",
          ],
          [
            "바퀴를 V−1 번 고정으로",
            comma(fixed.reads),
            String(fixed.writes),
            String(fixed.reads - fixed.writes),
            show(fixed.dist),
          ],
          [
            "못 고친 바퀴가 나오면 끝냄",
            comma(early.reads),
            String(early.writes),
            String(early.reads - early.writes),
            show(early.dist),
          ],
          [
            "값이 줄어든 정점만 다시",
            comma(c.reads),
            String(c.writes),
            String(c.reads - c.writes),
            show(c.dist),
          ],
        ],
        [1, 2, 3],
      ),
      "",
      `세 방식의 결과 dist 가 서로 같은가  ${
        show(fixed.dist) === show(early.dist) &&
        show(early.dist) === show(c.dist)
          ? "예"
          : "아니오"
      }`,
    ].join("\n");
  },

  /** deep.build ⑤ — 「무엇인가 바뀌었다」만 기록하는 후보를 먼저 반박한다. */
  flagCandidate: () => {
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
        comma(early.rounds),
        comma(early.reads),
        comma(c.reads),
      ];
    });
    return table(
      [
        [
          "입력",
          "간선 E",
          "바퀴",
          "플래그만 둔 판의 간선 읽기",
          "정점 목록을 둔 판의 간선 읽기",
        ],
        ...rows,
      ],
      [1, 2, 3, 4],
    ).join("\n");
  },

  /** deep.build ⑤ — 이미 꺼낸 정점의 값이 다시 줄어드는 자리를 걸음마다 편다. */
  reentry: () => {
    const c = counted(WALK_N, WALK_EDGES, WALK_SRC);
    const rows: string[][] = [];
    for (let i = 0; i < c.order.length; i++) {
      if ((c.wrote[i] as number) === 0) continue;
      rows.push([
        `T${i + 2}`,
        String(c.order[i]),
        c.notes[i] as string,
        `[${(c.queues[i + 1] as number[]).join(", ")}]`,
        String(c.pushed[i]),
        String(c.held[i]),
      ]);
    }
    return [
      ...table(
        [
          [
            "걸음",
            "꺼낸 정점",
            "이 걸음이 고친 자리",
            "걸음이 끝난 대기열",
            "새로 담음",
            "이미 담겨 있음",
          ],
          ...rows,
        ],
        [1, 4, 5],
      ),
      "",
      `정점마다 꺼낸 횟수  ${c.pop.map((k, v) => `${v}:${k}`).join(" · ")}`,
      `대기열이 가장 길었을 때  ${c.peak} 개 · 대기열에 담은 총 횟수 ${c.pushes} 번`,
    ].join("\n");
  },

  /** deep.build ⑥ — 모양을 바꿔 가며 두 방식의 간선 읽기를 나란히 잰다. */
  shapeCounts: () => {
    const hub = hubShape(64);
    const inputs: [string, number, Edge[]][] = [
      ["전개 입력 (V = 6)", WALK_N, WALK_EDGES],
      ["사슬, 목록을 오름차순으로 (V = 64)", 64, chain(64, false)],
      ["사슬, 목록을 내림차순으로 (V = 64)", 64, chain(64, true)],
      ["완전 그래프 (V = 64)", 64, complete(64)],
      ["사슬이 허브로 들어가는 모양 (V = 64)", hub.n, hub.edges],
    ];
    const rows = inputs.map(([label, n, edges]) => {
      const early = rounds(n, edges, 0, true);
      const c = counted(n, edges, 0);
      return [
        label,
        comma(edges.length),
        comma(early.reads),
        comma(c.reads),
        String(Math.max(...c.pop)),
        c.reads < early.reads ? "대기열" : "바퀴",
      ];
    });
    return table(
      [
        [
          "입력",
          "간선 E",
          "바퀴 방식",
          "대기열 방식",
          "c(v) 의 최댓값",
          "간선 읽기가 적은 쪽",
        ],
        ...rows,
      ],
      [1, 2, 3, 4],
    ).join("\n");
  },

  /** deep.walk — 고정 입력을 끝까지 실행한 걸음별 상태. */
  walkTrace: () => {
    const c = counted(WALK_N, WALK_EDGES, WALK_SRC);
    const rows: string[][] = [
      [
        "T1",
        "-",
        "①②③",
        show(c.frames[0] as number[]),
        `[${(c.queues[0] as number[]).join(", ")}]`,
        "이웃 목록과 시작값을 만든다",
      ],
    ];
    for (let i = 0; i < c.order.length; i++) {
      const note = c.notes[i] as string;
      const label = `④${(c.wrote[i] as number) > 0 ? "⑤" : ""}${
        (c.pushed[i] as number) > 0 ? "⑥" : ""
      }`;
      rows.push([
        `T${i + 2}`,
        String(c.order[i]),
        label,
        show(c.frames[i + 1] as number[]),
        `[${(c.queues[i + 1] as number[]).join(", ")}]`,
        note,
      ]);
    }
    rows.push([
      `T${c.order.length + 2}`,
      "-",
      "-",
      show(c.dist),
      "[]",
      "대기열이 비어 반환한다",
    ]);
    return [
      ...table(
        [
          [
            "걸음",
            "꺼낸 정점",
            "라벨",
            "dist",
            "남은 대기열",
            "이 걸음이 한 일",
          ],
          ...rows,
        ],
        [1],
      ),
      "",
      `꺼낸 횟수 ${c.pops} · 간선 읽기 ${c.reads} · 고친 자리 ${c.writes} · 대기열에 담은 횟수 ${c.pushes} · 이미 담겨 있어 다시 안 담은 횟수 ${c.blocked}`,
    ].join("\n");
  },

  /** deep.walk — 여섯 갈래가 어느 입력에서 몇 번 실행됐는가. */
  branchCoverage: () => {
    const a = branchCounts(WALK_N, WALK_EDGES, WALK_SRC);
    const b = branchCounts(LATE_N, LATE_EDGES, 0);
    const rows = LABELS.map(([mark, what], i) => [
      mark,
      what,
      comma(a[i] as number),
      comma(b[i] as number),
    ]);
    return table(
      [["라벨", "무엇", "전개 입력", "늦게 찾은 짧은 경로"], ...rows],
      [2, 3],
    ).join("\n");
  },

  /** 멈춤 1 — 꺼낸 정점의 표시를 안 내리면. */
  pauseFlagDown: () => {
    const rows = MUTANT_CASES.map((c) => [
      c.label,
      answer(spfa(c.n, c.edges, 0)),
      answer(noFlagDown.spfa(c.n, c.edges, 0)),
      answer(spfa(c.n, c.edges, 0)) === answer(noFlagDown.spfa(c.n, c.edges, 0))
        ? "같다"
        : "다르다",
    ]);
    return table([["입력", "정본", "표시를 안 내린 판", "판정"], ...rows]).join(
      "\n",
    );
  },

  /** 멈춤 2 — 대기열 중복을 막는 검사를 빼도 답은 갈리지 않는다. */
  pauseDedupAnswer: () => {
    const rows = MUTANT_CASES.map((c) => [
      c.label,
      answer(spfa(c.n, c.edges, 0)),
      answer(noDedup.spfa(c.n, c.edges, 0)),
      answer(spfa(c.n, c.edges, 0)) === answer(noDedup.spfa(c.n, c.edges, 0))
        ? "같다"
        : "다르다",
    ]);
    return table([["입력", "정본", "중복 검사를 뺀 판", "판정"], ...rows]).join(
      "\n",
    );
  },

  /** 멈춤 2 — 답은 같은데 계수가 갈리는 자리. */
  pauseDedupCost: () => {
    const hub = hubShape(256);
    const inputs: [string, number, Edge[]][] = [
      ["전개 입력 (V = 6)", WALK_N, WALK_EDGES],
      ["완전 그래프 (V = 64)", 64, complete(64)],
      ["사슬이 허브로 들어가는 모양 (V = 256)", hub.n, hub.edges],
    ];
    const rows = inputs.flatMap(([label, n, edges]) => {
      const a = counted(n, edges, 0);
      const b = countedNoDedup(n, edges, 0);
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
    return table(
      [
        [
          "입력",
          "판",
          "꺼낸 횟수",
          "간선 읽기",
          "대기열에 담은 횟수",
          "대기열 최대 길이",
        ],
        ...rows,
      ],
      [2, 3, 4, 5],
    ).join("\n");
  },

  /** 멈춤 3 — 음수 사이클이 있으면 대기열이 비지 않는다. */
  pauseNegCycle: () => {
    const rows = [3, 6, 30, 300, 3000].map((cap) => {
      const r = cappedPops(CYCLE_N, CYCLE_EDGES, 0, cap);
      return [
        comma(cap),
        show(r.dist),
        r.drained ? "비었다" : "아직 남아 있다",
      ];
    });
    const ok = cappedPops(WALK_N, WALK_EDGES, WALK_SRC, 10_000);
    return [
      "음수 사이클 0 -> 1 -> 2 -> 0 (가중치 합 −1) · 정점 셋",
      "",
      ...table([["꺼낸 횟수 상한", "그때의 dist", "대기열"], ...rows], [0]),
      "",
      `전개 입력에 같은 상한 ${comma(10_000)} 을 걸면  ${show(ok.dist)} · 대기열 ${ok.drained ? "비었다" : "아직 남아 있다"}`,
    ].join("\n");
  },

  /** deep.math ② — 정의를 전개 입력의 값에 넣어 확인한다. */
  mathCheck: () => {
    const c = counted(WALK_N, WALK_EDGES, WALK_SRC);
    const w = waves(WALK_N, WALK_EDGES, WALK_SRC);
    const outDeg = Array.from({ length: WALK_N }, () => 0);
    for (const [u] of WALK_EDGES) outDeg[u] = (outDeg[u] as number) + 1;
    const rows = Array.from({ length: WALK_N }, (_, v) => [
      String(v),
      String(c.pop[v]),
      String(outDeg[v]),
      String((c.pop[v] as number) * (outDeg[v] as number)),
    ]);
    const sum = c.pop.reduce((t, k, v) => t + k * (outDeg[v] as number), 0);
    const waveRows = w.members.map((m, k) => [
      String(k),
      `{${m.join(", ")}}`,
      show(w.frames[k + 1] as number[]),
      show(optAtMost(WALK_N, WALK_EDGES, WALK_SRC, k + 1)),
      (w.frames[k + 1] as number[]).every(
        (x, i) =>
          x <= (optAtMost(WALK_N, WALK_EDGES, WALK_SRC, k + 1)[i] as number),
      )
        ? "크지 않다"
        : "어긋난다",
    ]);
    return [
      ...table(
        [["정점 v", "c(v)", "d+(v)", "c(v) x d+(v)"], ...rows],
        [0, 1, 2, 3],
      ),
      "",
      `합계 ${sum} · 실행이 센 간선 읽기 ${c.reads}`,
      "",
      ...table(
        [
          [
            "물결 k",
            "그 물결에서 꺼낸 정점",
            "물결이 끝난 dist",
            "간선 k+1 개 이하의 최소 비용",
            "판정",
          ],
          ...waveRows,
        ],
        [0],
      ),
      "",
      `물결 수 ${w.members.length} · V−1 = ${WALK_N - 1} · c(v) 의 최댓값 ${Math.max(...c.pop)}`,
    ].join("\n");
  },

  /** deep.math ④ — 결과식에 제약 규모를 넣는다. */
  mathScale: () => {
    const rows = [
      [1_000, 2_000],
      [10_000, 20_000],
      [V_LIMIT, E_LIMIT],
    ].map(([v, e]) => [
      comma(v as number),
      comma(e as number),
      comma(((v as number) - 1) * (e as number)),
    ]);
    return [
      ...table([["정점 V", "간선 E", "(V−1) x E"], ...rows], [0, 1, 2]),
      "",
      "제약 상한에서",
      `  간선 읽기의 상한    (V−1) x E = ${comma((V_LIMIT - 1) * E_LIMIT)} 번`,
      `  한 정점의 꺼낸 횟수  c(v) ≤ V−1 = ${comma(V_LIMIT - 1)} 번`,
      `  거리 값의 크기       (V−1) x ${comma(W_LIMIT)} = ${comma((V_LIMIT - 1) * W_LIMIT)} 까지`,
    ].join("\n");
  },

  /** 불변식 ② — `while` 조건을 검사하는 시점마다 두 문장을 확인한다. */
  invariantWatch: () => {
    const rows = invariantWatch(WALK_N, WALK_EDGES, WALK_SRC).map((r) => [
      `T${r.step + 1}`,
      `[${r.queue.join(", ")}]`,
      r.relaxable.length === 0 ? "없다" : r.relaxable.join(" · "),
      r.ok ? "지킨다" : "어긋난다",
    ]);
    return table(
      [["걸음", "대기열", "완화할 수 있는 간선", "두 문장"], ...rows],
      [0],
    ).join("\n");
  },

  /** 불변식 ② — 경계 입력을 정본에 그대로 걸어 본다. */
  invariantEdges: () => {
    const cases: [string, number, Edge[], number][] = [
      ["정점 하나, 간선 없음", 1, [], 0],
      ["정점 셋, 간선 없음", 3, [], 2],
      ["도달할 수 없는 정점", 4, FAR_EDGES, 0],
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
      const c = counted(n, edges, src);
      return [label, String(src), show(c.dist), comma(c.pops), comma(c.reads)];
    });
    return table(
      [["입력", "src", "dist", "꺼낸 횟수", "간선 읽기"], ...rows],
      [1, 3, 4],
    ).join("\n");
  },

  /** 불변식 ③ — 값이 줄어든 정점을 대기열에 담는 줄을 뺀 변이. */
  mutantNoPush: () => {
    const rows = MUTANT_CASES.map((c) => [
      c.label,
      answer(spfa(c.n, c.edges, 0)),
      answer(noPush.spfa(c.n, c.edges, 0)),
      answer(spfa(c.n, c.edges, 0)) === answer(noPush.spfa(c.n, c.edges, 0))
        ? "같다"
        : "다르다",
    ]);
    return table([
      ["입력", "정본", "대기열에 안 담는 판", "판정"],
      ...rows,
    ]).join("\n");
  },

  /** perf.derive — 전개의 걸음마다 무엇을 몇 번 셌는가. */
  perfCount: () => {
    const c = counted(WALK_N, WALK_EDGES, WALK_SRC);
    const outDeg = Array.from({ length: WALK_N }, () => 0);
    for (const [u] of WALK_EDGES) outDeg[u] = (outDeg[u] as number) + 1;
    const rows: string[][] = [];
    let acc = 0;
    for (let i = 0; i < c.order.length; i++) {
      const u = c.order[i] as number;
      acc += outDeg[u] as number;
      rows.push([`T${i + 2}`, String(u), String(outDeg[u]), String(acc)]);
    }
    return [
      ...table(
        [
          ["걸음", "꺼낸 정점", "그 정점의 나가는 간선", "여기까지 누적"],
          ...rows,
        ],
        [1, 2, 3],
      ),
      "",
      `이웃 목록을 만드는 데 간선 ${WALK_EDGES.length} 개를 한 번씩 읽는다`,
      `대기열에서 꺼낸 ${c.pops} 번 · 간선 읽기 ${c.reads} 번 · 그중 값을 고친 것이 ${c.writes} 번`,
      `정점 5 에서 나가는 간선은 한 번도 읽지 않는다 — 그 정점이 대기열에 담긴 적이 없다`,
    ].join("\n");
  },

  /** perf.bounds — 관측된 평균은 생성식에 딸린 값이다. */
  perfObserved: () => {
    const rows: string[][] = [];
    for (const v of [1_000, 10_000, 100_000]) {
      const edges = randomSparse(v, 987_654_321);
      const c = countedLite(v, edges, 0);
      rows.push([
        comma(v),
        comma(edges.length),
        comma(c.reads),
        (c.reads / edges.length).toFixed(2),
        String(Math.max(...c.pop)),
      ]);
    }
    for (const v of [64, 256, 1_024]) {
      const { n, edges } = hubShape(v);
      const c = countedLite(n, edges, 0);
      rows.push([
        `${comma(n)} (허브)`,
        comma(edges.length),
        comma(c.reads),
        (c.reads / edges.length).toFixed(2),
        String(Math.max(...c.pop)),
      ]);
    }
    return [
      ...table(
        [
          ["정점 V", "간선 E", "간선 읽기", "간선 읽기 / E", "c(v) 의 최댓값"],
          ...rows,
        ],
        [0, 1, 2, 3, 4],
      ),
      "",
      "위 세 줄은 사슬 하나에 앞으로만 가는 간선을 덧붙인 무작위 생성식(시드 987654321)이고,",
      "아래 세 줄은 사슬이 허브로 들어가는 모양이다. 같은 계수의 이름으로 두 값이 갈린다",
    ].join("\n");
  },

  /** perf.worst — 모양마다 꺼낸 횟수와 간선 읽기를 실제로 잰다. */
  worstShape: () => {
    const V = 64;
    const hub = hubShape(V);
    const shapes: [string, number, Edge[]][] = [
      ["사슬, 목록을 오름차순으로", V, chain(V, false)],
      ["사슬, 목록을 내림차순으로", V, chain(V, true)],
      ["완전 그래프", V, complete(V)],
      ["사슬이 허브로 들어가는 모양", hub.n, hub.edges],
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
        String(Math.max(...c.pop)),
        comma(r.reads),
      ];
    });
    return [
      ...table(
        [
          [
            "모양 (V = 64)",
            "간선 E",
            "간선 읽기",
            "간선 목록을 뒤집으면",
            "c(v) 의 최댓값",
            "바퀴 방식의 간선 읽기",
          ],
          ...rows,
        ],
        [1, 2, 3, 4, 5],
      ),
      "",
      "간선이 가장 많은 완전 그래프에서 c(v) 의 최댓값이 1 이다",
    ].join("\n");
  },

  /** perf.worst — 규모를 4 배씩 늘리며 (V−1)E 에 대한 비를 잰다. */
  worstGrowth: () => {
    const rows = [32, 128, 512, 2_048].map((v) => {
      const { n, edges } = hubShape(v);
      const c = countedLite(n, edges, 0);
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
      ...table(
        [["정점 V", "간선 E", "간선 읽기", "(V−1) x E", "그 비"], ...rows],
        [0, 1, 2, 3, 4],
      ),
      "",
      "규모를 4 배씩 늘려도 마지막 열이 한 값 언저리에 머문다 — 이 모양의 간선 읽기가",
      "(V−1)E 와 같은 차수로 늘어난다는 뜻이다",
    ].join("\n");
  },
};
