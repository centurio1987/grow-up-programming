/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run tools/check-proof.ts src/algorithms/shortest-path/bellmanFord/bellmanFord-guide.md
 *
 * **계수를 세는 사본이 여럿 있다.** 정본은 몇 번 셌는지를 내보내지 않으므로, 세는 자리만
 * 덧붙인 사본이 아니면 계수를 낼 방법이 없다. **답이 맞는지는 사본이 아니라 정본이 진다** —
 * 아래 표의 「답」 칸은 전부 정본이나 정본에서 기계로 만든 변이가 낸 값이고, 사본은 계수만
 * 낸다. 사본이 정본과 같은 답을 내는지는 `자기대조()` 가 이 파일을 읽을 때 확인한다.
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { bellmanFord, type Edge } from "./bellmanFord-guide.ref.ts";

const INF = Number.POSITIVE_INFINITY;

/* ────────────────────────── 고정 입력 ────────────────────────── */

/**
 * 본문 전개가 쓰는 그래프. 정점 일곱 · 방향 간선 여덟이고 정점 6 은 들어오는 간선이 없다.
 *
 * 여섯 갈래 중 다섯을 한 입력에서 실행한다 — 시작값 · 바퀴 · 값이 없는 정점 건너뛰기 ·
 * 완화 · 조기 종료. 남은 하나(음수 사이클)는 `NEG_EDGES` 가 맡는다.
 */
export const WALK_N = 7;
export const WALK_EDGES: Edge[] = [
  [4, 5, 1],
  [3, 4, 2],
  [2, 3, -3],
  [1, 2, 3],
  [0, 1, 4],
  [0, 2, 9],
  [6, 5, 2],
  [5, 1, 7],
];
export const WALK_SRC = 0;

/** 출발점에서 도달할 수 있는 음수 사이클. `0 → 1 → 2 → 0` 의 가중치 합이 −1 이다. */
export const NEG_N = 3;
export const NEG_EDGES: Edge[] = [
  [0, 1, 1],
  [1, 2, -1],
  [2, 0, -1],
];

/** 출발점에서 도달할 수 없는 음수 사이클. `1 ↔ 2` 는 정점 0 에서 갈 수 없다. */
export const FAR_N = 3;
export const FAR_EDGES: Edge[] = [
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
 * 내림차순 사슬에 나머지 간선을 전부 채운 그래프. 채운 간선의 가중치가 `10^9` 이라 값을
 * 한 번도 못 고치고, 그래서 바퀴 수는 사슬이 정하고 간선 수는 최댓값이 된다.
 */
export function chainPlusFiller(v: number): Edge[] {
  const edges: Edge[] = chain(v, true);
  for (let u = 0; u < v; u++) {
    for (let x = 0; x < v; x++) {
      if (u === x || x === u + 1) continue;
      edges.push([u, x, 1_000_000_000]);
    }
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

/** `[0, 4, 7, 4, 6, 7, Infinity]` 꼴 — 본문 표기와 같다. */
const show = (xs: number[]): string => `[${xs.join(", ")}]`;

/** `124,750,000` 꼴 — 본문 표기와 같다. */
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
  hasNegativeCycle: boolean;
  /** 실제로 실행한 바퀴 수. */
  rounds: number;
  /** 간선 하나를 목록에서 읽은 총 횟수. */
  reads: number;
  /** ③ 이 참이 되어 그 자리에서 넘어간 횟수. */
  skips: number;
  /** ④ 가 참이 되어 값을 고친 횟수. */
  writes: number;
  /** 바퀴마다의 `dist`. 첫 원소가 바퀴 0(시작값)이다. */
  frames: number[][];
  /** 바퀴마다 고친 것의 서술. */
  notes: string[];
}

/** 정본과 같은 절차에 세는 자리만 덧붙인 사본. */
export function counted(n: number, edges: Edge[], src: number): Counts {
  const dist = Array.from({ length: n }, () => INF);
  dist[src] = 0;
  const frames: number[][] = [dist.slice()];
  const notes: string[] = [];
  let rounds = 0;
  let reads = 0;
  let skips = 0;
  let writes = 0;

  for (let round = 1; round <= n; round++) {
    rounds++;
    let changed = false;
    const done: string[] = [];
    for (const [u, v, w] of edges) {
      reads++;
      if (dist[u] === INF) {
        skips++;
        continue;
      }
      const nd = (dist[u] as number) + w;
      if (nd < (dist[v] as number)) {
        done.push(
          `dist[${v}] ${dist[v] === INF ? "Infinity" : dist[v]} -> ${nd}`,
        );
        dist[v] = nd;
        writes++;
        changed = true;
      }
    }
    frames.push(dist.slice());
    notes.push(done.length === 0 ? "고친 것이 없다" : done.join(" · "));
    if (!changed) {
      return {
        dist,
        hasNegativeCycle: false,
        rounds,
        reads,
        skips,
        writes,
        frames,
        notes,
      };
    }
    if (round === n) {
      return {
        dist,
        hasNegativeCycle: true,
        rounds,
        reads,
        skips,
        writes,
        frames,
        notes,
      };
    }
  }
  return {
    dist,
    hasNegativeCycle: false,
    rounds,
    reads,
    skips,
    writes,
    frames,
    notes,
  };
}

/** 사본이 정본과 같은 답을 내는지 이 파일을 읽을 때 한 번 확인한다. */
function 자기대조(): void {
  const inputs: [number, Edge[]][] = [
    [WALK_N, WALK_EDGES],
    [NEG_N, NEG_EDGES],
    [FAR_N, FAR_EDGES],
    [12, complete(12)],
    [64, chain(64, true)],
  ];
  for (const [n, edges] of inputs) {
    const ref = bellmanFord(n, edges, 0);
    const mine = counted(n, edges, 0);
    if (
      ref.hasNegativeCycle !== mine.hasNegativeCycle ||
      show(ref.dist) !== show(mine.dist)
    ) {
      throw new Error("세는 사본이 정본과 다른 답을 낸다");
    }
  }
}
자기대조();

/** 바퀴 수를 `cap` 으로 잘라서 실행한다. 조기 종료도 음수 사이클 판정도 하지 않는다. */
export function capped(
  n: number,
  edges: Edge[],
  src: number,
  cap: number,
): number[] {
  const dist = Array.from({ length: n }, () => INF);
  dist[src] = 0;
  for (let round = 1; round <= cap; round++) {
    for (const [u, v, w] of edges) {
      if (dist[u] === INF) continue;
      const nd = (dist[u] as number) + w;
      if (nd < (dist[v] as number)) dist[v] = nd;
    }
  }
  return dist;
}

/**
 * 간선을 `k` 개 이하로 쓰는 경로의 최소 비용. 이 절차와 **다른 방법**으로 낸다 — 바퀴를
 * 쓰지 않고, 간선 수 `t` 인 층에서 `t+1` 인 층을 만드는 계산이다.
 */
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

/** 출발점에서 나가는 단순 경로를 전부 만들어 개수와 정점별 최소 비용을 낸다. */
export function everySimplePath(
  n: number,
  edges: Edge[],
  src: number,
): { paths: number; best: number[]; byLength: Map<number, number[]> } {
  const adj: [number, number][][] = Array.from({ length: n }, () => []);
  for (const [u, v, w] of edges) (adj[u] as [number, number][]).push([v, w]);
  const best = Array.from({ length: n }, () => INF);
  const byLength = new Map<number, number[]>();
  const onPath = Array.from({ length: n }, () => false);
  let paths = 0;

  const record = (v: number, len: number, cost: number): void => {
    if (cost < (best[v] as number)) best[v] = cost;
    let row = byLength.get(len);
    if (row === undefined) {
      row = Array.from({ length: n }, () => INF);
      byLength.set(len, row);
    }
    if (cost < (row[v] as number)) row[v] = cost;
  };

  const walk = (u: number, len: number, cost: number): void => {
    record(u, len, cost);
    onPath[u] = true;
    for (const [v, w] of adj[u] as [number, number][]) {
      if (onPath[v]) continue;
      paths++;
      walk(v, len + 1, cost + w);
    }
    onPath[u] = false;
  };
  walk(src, 0, 0);
  return { paths, best, byLength };
}

/** 「아직 값이 없다」를 `Infinity` 대신 큰 수로 적고 건너뛰기도 뺀 사본. */
export function sentinelNoGuard(
  n: number,
  edges: Edge[],
  src: number,
  sentinel: number,
): { dist: number[]; hasNegativeCycle: boolean } {
  const dist = Array.from({ length: n }, () => sentinel);
  dist[src] = 0;
  for (let round = 1; round <= n; round++) {
    let changed = false;
    for (const [u, v, w] of edges) {
      const nd = (dist[u] as number) + w;
      if (nd < (dist[v] as number)) {
        dist[v] = nd;
        changed = true;
      }
    }
    if (!changed) return { dist, hasNegativeCycle: false };
    if (round === n) return { dist, hasNegativeCycle: true };
  }
  return { dist, hasNegativeCycle: false };
}

/* ────────────────────── 간선 순서 전수 ────────────────────── */

function permutations<T>(xs: T[]): T[][] {
  if (xs.length <= 1) return [xs];
  const out: T[][] = [];
  for (let i = 0; i < xs.length; i++) {
    const rest = [...xs.slice(0, i), ...xs.slice(i + 1)];
    for (const p of permutations(rest)) out.push([xs[i] as T, ...p]);
  }
  return out;
}

interface OrderSweep {
  total: number;
  /** 바퀴 수 → 그 바퀴 수가 나온 순서의 개수. */
  rounds: Map<number, number>;
  /** 답이 정본과 다른 순서의 개수. */
  wrong: number;
  /** 바퀴 상한 `k` → `k` 바퀴로 정답에 이른 순서의 개수. */
  correctAt: Map<number, number>;
}

let SWEEP: OrderSweep | null = null;

export function orderSweep(): OrderSweep {
  if (SWEEP !== null) return SWEEP;
  const answer = show(bellmanFord(WALK_N, WALK_EDGES, WALK_SRC).dist);
  const rounds = new Map<number, number>();
  const correctAt = new Map<number, number>();
  let wrong = 0;
  const orders = permutations(WALK_EDGES);
  for (const order of orders) {
    const c = counted(WALK_N, order, WALK_SRC);
    if (show(c.dist) !== answer) wrong++;
    rounds.set(c.rounds, (rounds.get(c.rounds) ?? 0) + 1);
    for (let k = 0; k <= WALK_N - 1; k++) {
      if (show(capped(WALK_N, order, WALK_SRC, k)) === answer) {
        correctAt.set(k, (correctAt.get(k) ?? 0) + 1);
      }
    }
  }
  SWEEP = { total: orders.length, rounds, wrong, correctAt };
  return SWEEP;
}

/* ────────────────────────── 변이 ────────────────────────── */

const REF = new URL("./bellmanFord-guide.ref.ts", import.meta.url).pathname;

interface Impl {
  bellmanFord(
    n: number,
    edges: Edge[],
    src: number,
  ): { dist: number[]; hasNegativeCycle: boolean };
}

/** ③ 을 통째로 뺀 사본. 답이 갈리는지를 실행이 판정한다. */
const noGuard = await loadMutant<Impl>(REF, {
  drop: /if \(dist\[u\] === Number\.POSITIVE_INFINITY\) continue;/,
});

/** 바퀴를 `n−1` 번만 실행하는 사본. */
const shortLoop = await loadMutant<Impl>(REF, {
  swap: [/round <= n; round\+\+/, "round < n; round++"],
});

/** 조기 종료를 못 하게 막은 사본. */
const noEarlyExit = await loadMutant<Impl>(REF, {
  swap: [/if \(!changed\) return/, "if (false) return"],
});

/** **불변식을 지키던 줄** 하나에서 부등호 방향만 뒤집은 사본. */
const wrongDirection = await loadMutant<Impl>(REF, {
  swap: [
    /if \(nd < \(dist\[v\] as number\)\)/,
    "if (nd > (dist[v] as number))",
  ],
});

const MUTANT_CASES: { label: string; n: number; edges: Edge[] }[] = [
  { label: "전개 입력", n: WALK_N, edges: WALK_EDGES },
  { label: "음수 사이클 0->1->2->0", n: NEG_N, edges: NEG_EDGES },
  { label: "도달할 수 없는 음수 사이클", n: FAR_N, edges: FAR_EDGES },
];

const answer = (r: { dist: number[]; hasNegativeCycle: boolean }): string =>
  `${show(r.dist)} · ${r.hasNegativeCycle}`;

// 하나도 안 갈리면 그 절의 주장이 성립하지 않는다. 실행이 그것을 판정한다.
for (const [label, impl] of [
  ["바퀴를 n−1 번만", shortLoop],
  ["조기 종료를 막은 판", noEarlyExit],
  ["부등호를 뒤집은 판", wrongDirection],
] as [string, Impl][]) {
  if (
    MUTANT_CASES.every(
      (c) =>
        answer(bellmanFord(c.n, c.edges, 0)) ===
        answer(impl.bellmanFord(c.n, c.edges, 0)),
    )
  ) {
    throw new Error(`${label} 변이가 어느 입력에서도 답을 바꾸지 못했다`);
  }
}

/* ────────────────────────── 수치 ────────────────────────── */

/** `m!` 의 자릿수. 경로 수가 배열에 안 들어가는 규모에서는 자릿수만 낸다. */
function factorialDigits(m: number): number {
  let log10 = 0;
  for (let k = 2; k <= m; k++) log10 += Math.log10(k);
  return Math.floor(log10) + 1;
}

const V_LIMIT = 500;
const E_LIMIT = V_LIMIT * (V_LIMIT - 1);
const W_LIMIT = 1_000_000_000;

const LABELS: [string, string][] = [
  ["①", "시작값"],
  ["②", "바퀴를 시작한다"],
  ["③", "값이 없는 정점이라 넘어간다"],
  ["④", "완화가 값을 고친다"],
  ["⑤", "조기 종료"],
  ["⑥", "음수 사이클"],
];

function branchCounts(n: number, edges: Edge[], src: number): number[] {
  const c = counted(n, edges, src);
  return [
    1,
    c.rounds,
    c.skips,
    c.writes,
    c.hasNegativeCycle ? 0 : 1,
    c.hasNegativeCycle ? 1 : 0,
  ];
}

export const PROOFS: Record<string, () => string> = {
  /** deep.build ② — 경로를 전부 만드는 방법이 규모에서 몇 번이 되는가. */
  naiveScale: () => {
    const rows = [4, 6, 8, 10].map((v) => {
      const edges = complete(v);
      const paths = everySimplePath(v, edges, 0).paths;
      const c = counted(v, edges, 0);
      return [
        String(v),
        comma(edges.length),
        comma(paths),
        String(c.rounds),
        comma(c.reads),
      ];
    });
    return [
      ...table(
        [
          ["정점 V", "간선 E", "단순 경로 수", "바퀴", "간선을 읽은 횟수"],
          ...rows,
        ],
        [0, 1, 2, 3, 4],
      ),
      "",
      `제약 규모 V = ${comma(V_LIMIT)} · E = ${comma(E_LIMIT)} 이면`,
      `  단순 경로 수      ${V_LIMIT - 1}! 보다 크고, ${V_LIMIT - 1}! 은 ${comma(factorialDigits(V_LIMIT - 1))} 자리 수다`,
      `  간선을 읽는 횟수  V x E = ${comma(V_LIMIT * E_LIMIT)} 번 이하`,
    ].join("\n");
  },

  /** deep.build ④ — 같은 그래프, 간선 목록의 순서만 바꿔 계수를 나란히 잰다. */
  orderRounds: () => {
    const given = counted(WALK_N, WALK_EDGES, WALK_SRC);
    const flipped = counted(WALK_N, [...WALK_EDGES].reverse(), WALK_SRC);
    return table(
      [
        [
          "간선 목록의 순서",
          "바퀴",
          "간선을 읽은 횟수",
          "값을 고친 횟수",
          "결과 dist",
        ],
        [
          "문제가 준 순서",
          String(given.rounds),
          comma(given.reads),
          String(given.writes),
          show(given.dist),
        ],
        [
          "그 순서를 뒤집은 것",
          String(flipped.rounds),
          comma(flipped.reads),
          String(flipped.writes),
          show(flipped.dist),
        ],
      ],
      [1, 2, 3],
    ).join("\n");
  },

  /** deep.build ⑤ — 간선 목록의 순서 8! 가지를 전부 시험한다. */
  orderSweepBlock: () => {
    const s = orderSweep();
    const keys = [...s.rounds.keys()].sort((a, b) => a - b);
    const rows = keys.map((k) => [
      String(k),
      comma(s.rounds.get(k) ?? 0),
      `${(((s.rounds.get(k) ?? 0) / s.total) * 100).toFixed(1)} %`,
    ]);
    return [
      `간선 여덟 개의 순서 ${comma(s.total)} 가지를 전부 실행했다`,
      "",
      ...table(
        [["바퀴 수", "그 바퀴 수가 나온 순서", "비율"], ...rows],
        [0, 1, 2],
      ),
      "",
      `답이 정본과 다른 순서  ${s.wrong} 개`,
      `바퀴 수의 최솟값       ${keys[0]}`,
      `바퀴 수의 최댓값       ${keys[keys.length - 1]}`,
    ].join("\n");
  },

  /** deep.build ⑥ — 바퀴 수를 몇으로 잘라야 답이 나오는가. */
  capSweep: () => {
    const s = orderSweep();
    const target = show(bellmanFord(WALK_N, WALK_EDGES, WALK_SRC).dist);
    const rows: string[][] = [];
    for (let k = 0; k <= WALK_N - 1; k++) {
      const got = show(capped(WALK_N, WALK_EDGES, WALK_SRC, k));
      rows.push([
        String(k),
        got,
        got === target ? "같다" : "다르다",
        comma(s.correctAt.get(k) ?? 0),
      ]);
    }
    return [
      ...table(
        [
          [
            "바퀴 상한 k",
            "문제가 준 순서의 dist",
            "정답과 같은가",
            `${comma(s.total)} 가지 중 정답인 순서`,
          ],
          ...rows,
        ],
        [0, 3],
      ),
      "",
      `정점 V = ${WALK_N} 이므로 V−1 = ${WALK_N - 1} 이다`,
    ].join("\n");
  },

  /** deep.walk — 고정 입력을 끝까지 실행한 걸음별 상태. */
  walkTrace: () => {
    const c = counted(WALK_N, WALK_EDGES, WALK_SRC);
    const rows: string[][] = [
      ["T1", "-", "①", show(c.frames[0] as number[]), "거리 배열을 만든다"],
    ];
    for (let r = 0; r < c.rounds; r++) {
      const last = r === c.rounds - 1;
      rows.push([
        `T${r + 2}`,
        String(r + 1),
        last ? "②⑤" : "②④",
        show(c.frames[r + 1] as number[]),
        c.notes[r] as string,
      ]);
    }
    rows.push([
      `T${c.rounds + 2}`,
      "-",
      "-",
      show(c.dist),
      `hasNegativeCycle = ${c.hasNegativeCycle}`,
    ]);
    return [
      ...table(
        [["걸음", "바퀴", "라벨", "dist", "이 걸음이 한 일"], ...rows],
        [1],
      ),
      "",
      `간선을 읽은 횟수 ${c.reads} · 그중 ③ 이 ${c.skips} · 값을 고친 횟수 ${c.writes}`,
    ].join("\n");
  },

  /** deep.walk — 여섯 갈래가 어느 입력에서 몇 번 참이 됐는가. */
  branchCoverage: () => {
    const a = branchCounts(WALK_N, WALK_EDGES, WALK_SRC);
    const b = branchCounts(NEG_N, NEG_EDGES, 0);
    const rows = LABELS.map(([mark, what], i) => [
      mark,
      what,
      comma(a[i] as number),
      comma(b[i] as number),
    ]);
    return table(
      [["라벨", "무엇", "전개 입력", "음수 사이클 입력"], ...rows],
      [2, 3],
    ).join("\n");
  },

  /** 멈춤 1 — ③ 을 빼도 답이 갈리는가. */
  pauseGuard: () => {
    const rows = MUTANT_CASES.map((c) => [
      c.label,
      answer(bellmanFord(c.n, c.edges, 0)),
      answer(noGuard.bellmanFord(c.n, c.edges, 0)),
      answer(bellmanFord(c.n, c.edges, 0)) ===
      answer(noGuard.bellmanFord(c.n, c.edges, 0))
        ? "같다"
        : "다르다",
    ]);
    const w = counted(WALK_N, WALK_EDGES, WALK_SRC);
    return [
      ...table([["입력", "정본", "③ 을 뺀 판", "판정"], ...rows]),
      "",
      "「아직 값이 없다」를 Infinity 대신 10^15 로 적고 ③ 도 뺀 판",
      ...table([
        ["입력", "정본", "10^15 을 쓰고 ③ 을 뺀 판", "판정"],
        ...MUTANT_CASES.map((c) => {
          const ref = bellmanFord(c.n, c.edges, 0);
          const got = sentinelNoGuard(c.n, c.edges, 0, 1e15);
          return [
            c.label,
            String(ref.hasNegativeCycle),
            String(got.hasNegativeCycle),
            ref.hasNegativeCycle === got.hasNegativeCycle ? "같다" : "다르다",
          ];
        }),
      ]),
      "",
      `전개 입력에서 ③ 이 참이 된 횟수  ${w.skips} 번 (간선을 읽은 ${w.reads} 번 중)`,
    ].join("\n");
  },

  /** 멈춤 2 — 바퀴를 n−1 번만 실행하면. */
  pauseShortLoop: () => {
    const rows = MUTANT_CASES.map((c) => [
      c.label,
      answer(bellmanFord(c.n, c.edges, 0)),
      answer(shortLoop.bellmanFord(c.n, c.edges, 0)),
      answer(bellmanFord(c.n, c.edges, 0)) ===
      answer(shortLoop.bellmanFord(c.n, c.edges, 0))
        ? "같다"
        : "다르다",
    ]);
    return table([
      ["입력", "정본", "바퀴를 n−1 번만 실행한 판", "판정"],
      ...rows,
    ]).join("\n");
  },

  /** 멈춤 3 — 조기 종료를 막으면. */
  pauseEarlyExit: () => {
    const rows = MUTANT_CASES.map((c) => [
      c.label,
      answer(bellmanFord(c.n, c.edges, 0)),
      answer(noEarlyExit.bellmanFord(c.n, c.edges, 0)),
      answer(bellmanFord(c.n, c.edges, 0)) ===
      answer(noEarlyExit.bellmanFord(c.n, c.edges, 0))
        ? "같다"
        : "다르다",
    ]);
    return table([["입력", "정본", "⑤ 를 막은 판", "판정"], ...rows]).join(
      "\n",
    );
  },

  /** deep.math ② — 정의를 전개 입력의 값에 넣어 확인한다. */
  mathCheck: () => {
    const paths = everySimplePath(WALK_N, WALK_EDGES, WALK_SRC);
    const rows: string[][] = [];
    for (let k = 0; k <= WALK_N - 1; k++) {
      const byEnum = Array.from({ length: WALK_N }, () => INF);
      for (const [len, row] of paths.byLength) {
        if (len > k) continue;
        for (let v = 0; v < WALK_N; v++) {
          if ((row[v] as number) < (byEnum[v] as number)) {
            byEnum[v] = row[v] as number;
          }
        }
      }
      const byLayer = optAtMost(WALK_N, WALK_EDGES, WALK_SRC, k);
      rows.push([
        String(k),
        show(byEnum),
        show(byLayer),
        show(byEnum) === show(byLayer) ? "같다" : "다르다",
      ]);
    }
    return [
      `출발점 0 에서 나가는 단순 경로가 ${paths.paths} 개다`,
      "",
      ...table(
        [
          ["k", "경로를 전부 만들어 고른 최솟값", "층 계산이 낸 값", "판정"],
          ...rows,
        ],
        [0],
      ),
    ].join("\n");
  },

  /** deep.math ④ — 결과식에 제약 규모를 넣는다. */
  mathScale: () => {
    const rows = [10, 100, V_LIMIT].map((v) => {
      const e = v * (v - 1);
      return [comma(v), comma(e), comma((v - 1) * e), comma(v * e)];
    });
    return [
      ...table(
        [["정점 V", "간선 E = V(V−1)", "(V−1)E", "V x E"], ...rows],
        [0, 1, 2, 3],
      ),
      "",
      `제약 상한에서`,
      `  값을 고칠 수 있는 바퀴  V−1 = ${V_LIMIT - 1} 번 이하`,
      `  간선을 읽는 횟수        V x E = ${comma(V_LIMIT * E_LIMIT)} 번 이하`,
      `  거리 값의 크기          (V−1) x ${comma(W_LIMIT)} = ${comma((V_LIMIT - 1) * W_LIMIT)} 까지`,
    ].join("\n");
  },

  /** 불변식 ② — 바퀴마다 dist 와 「간선 k 개 이하」의 최소 비용을 나란히 놓는다. */
  invariantRounds: () => {
    const given = counted(WALK_N, WALK_EDGES, WALK_SRC);
    const flippedOrder = [...WALK_EDGES].reverse();
    const flipped = counted(WALK_N, flippedOrder, WALK_SRC);
    const rows: string[][] = [];
    for (let k = 0; k < given.frames.length; k++) {
      const opt = optAtMost(WALK_N, WALK_EDGES, WALK_SRC, k);
      const cur = given.frames[k] as number[];
      const ok = cur.every((x, i) => x <= (opt[i] as number));
      rows.push([
        String(k),
        show(cur),
        show(opt),
        ok ? "크지 않다" : "어긋난다",
      ]);
    }
    const rows2: string[][] = [];
    for (let k = 0; k < flipped.frames.length; k++) {
      const opt = optAtMost(WALK_N, flippedOrder, WALK_SRC, k);
      const cur = flipped.frames[k] as number[];
      const ok = cur.every((x, i) => x <= (opt[i] as number));
      const strict = cur.some((x, i) => x < (opt[i] as number));
      rows2.push([
        String(k),
        show(cur),
        show(opt),
        ok ? (strict ? "더 작다" : "같다") : "어긋난다",
      ]);
    }
    return [
      "문제가 준 순서",
      ...table(
        [
          ["k", "k 번째 바퀴 뒤의 dist", "간선 k 개 이하의 최소 비용", "판정"],
          ...rows,
        ],
        [0],
      ),
      "",
      "그 순서를 뒤집은 것",
      ...table(
        [
          ["k", "k 번째 바퀴 뒤의 dist", "간선 k 개 이하의 최소 비용", "판정"],
          ...rows2,
        ],
        [0],
      ),
    ].join("\n");
  },

  /** 불변식 ③ — 부등호 방향을 뒤집은 변이. */
  mutantDirection: () => {
    const rows = MUTANT_CASES.map((c) => [
      c.label,
      answer(bellmanFord(c.n, c.edges, 0)),
      answer(wrongDirection.bellmanFord(c.n, c.edges, 0)),
    ]);
    return table([["입력", "정본", "부등호를 뒤집은 판"], ...rows]).join("\n");
  },

  /** perf.derive — 전개의 걸음마다 무엇을 몇 번 셌는가. */
  perfCount: () => {
    const c = counted(WALK_N, WALK_EDGES, WALK_SRC);
    const rows: string[][] = [];
    let readSoFar = 0;
    for (let r = 0; r < c.rounds; r++) {
      readSoFar += WALK_EDGES.length;
      rows.push([
        `T${r + 2}`,
        String(r + 1),
        String(WALK_EDGES.length),
        comma(readSoFar),
      ]);
    }
    return [
      ...table(
        [["걸음", "바퀴", "읽은 간선", "여기까지 누적"], ...rows],
        [1, 2, 3],
      ),
      "",
      `바퀴 ${c.rounds} x 간선 ${WALK_EDGES.length} = ${c.reads}`,
      `그중 ③ 이 ${c.skips} 번 · ④ 가 값을 고친 것이 ${c.writes} 번`,
    ].join("\n");
  },

  /** perf.worst — 모양마다 바퀴 수와 읽은 간선 수를 실제로 잰다. */
  worstShape: () => {
    const V = 64;
    const shapes: [string, number, Edge[]][] = [
      ["사슬, 오름차순으로 적음", V, chain(V, false)],
      ["사슬, 내림차순으로 적음", V, chain(V, true)],
      ["완전 그래프", V, complete(V)],
      ["내림차순 사슬 + 나머지 간선", V, chainPlusFiller(V)],
      [
        "음수 사이클이 있는 사슬",
        V,
        [...chain(V, true), [V - 1, 0, -1_000_000] as Edge],
      ],
    ];
    const rows = shapes.map(([label, n, edges]) => {
      const c = counted(n, edges, 0);
      return [
        label,
        comma(edges.length),
        String(c.rounds),
        comma(c.reads),
        String(c.hasNegativeCycle),
      ];
    });
    return [
      ...table(
        [
          [
            "모양 (V = 64)",
            "간선 E",
            "바퀴",
            "간선을 읽은 횟수",
            "음수 사이클",
          ],
          ...rows,
        ],
        [1, 2, 3],
      ),
      "",
      `바퀴 수의 최댓값은 V = ${V} 이고, 간선을 읽은 횟수의 최댓값은 V x E 다`,
    ].join("\n");
  },

  /** perf.worst — 축마다 최악을 만드는 입력이 다르다. */
  worstAxes: () => {
    const V = 64;
    const a = counted(V, chain(V, true), 0);
    const b = counted(V, chainPlusFiller(V), 0);
    const heavy: Edge[] = [];
    for (let i = 0; i + 1 < V; i++) heavy.push([i, i + 1, W_LIMIT]);
    const c = counted(V, heavy, 0);
    return [
      ...table([
        [
          "최악으로 만들 축",
          "그 축을 최대로 만드는 입력 (V = 64)",
          "그 축의 값",
          "다른 축의 값",
        ],
        [
          "바퀴 수",
          "내림차순 사슬 (E = 63)",
          `바퀴 ${a.rounds}`,
          `읽은 간선 ${comma(a.reads)}`,
        ],
        [
          "간선을 읽은 횟수",
          "내림차순 사슬 + 나머지 간선 (E = 4,032)",
          `읽은 간선 ${comma(b.reads)}`,
          `바퀴 ${b.rounds}`,
        ],
        [
          "거리 값의 크기",
          "가중치 10^9 짜리 오름차순 사슬",
          `dist[63] = ${comma(c.dist[V - 1] as number)}`,
          `바퀴 ${c.rounds}`,
        ],
      ]),
      "",
      "세 입력이 서로 다르다 — 한 입력이 세 축을 함께 최대로 만들지 않는다",
    ].join("\n");
  },
};
