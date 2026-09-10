/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run tools/check-proof.ts src/algorithms/shortest-path/dagShortestPath/dagShortestPath-guide.md
 *
 * **세는 사본이 다섯 있다**(`enumeratePaths`·`byOrder`·`rounds`·`greedy`·`countCells`).
 * 정본은 몇 칸을 읽었는지를 내보내지 않으므로, 세는 자리만 덧붙인 사본이 아니면 계수를 낼
 * 방법이 없다. **답이 맞는지는 사본이 아니라 정본이 진다** — 아래 표의 「옳은 쪽」 값은 전부
 * 정본이나 정본에서 기계로 만든 변이가 낸 것이다.
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { dagShortestPath, type Edge } from "./dagShortestPath-guide.ref.ts";

/**
 * 본문 전개가 쓰는 고정 입력. 간선 목록이 위상 순서로 적혀 있지 않고, 정점 4 는 시작 정점에서
 * 갈 수 없는데 나가는 간선을 갖고 있으며, 정점 5 는 간선이 하나도 없다.
 */
const WALK_N = 6;
const WALK_SRC = 0;
const WALK_EDGES: Edge[] = [
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
function chain(v: number): Edge[] {
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

/* ────────────────────────── 칸 맞춤 ────────────────────────── */

/**
 * 한글은 고정폭 화면에서 두 칸을 먹는다. 칸 맞춤을 글자 수로 하면 한글이 섞인 머리줄만
 * 어긋난다. 한글·가나·한자 구간을 두 칸으로 센다.
 */
const width = (s: string): number =>
  [...s].reduce((n, c) => n + (/[ᄀ-ᇿ　-〿㄰-㆏가-힯一-鿿]/.test(c) ? 2 : 1), 0);

const pad = (s: string, to: number): string =>
  s + " ".repeat(Math.max(0, to - width(s)));

const padLeft = (s: string, to: number): string =>
  " ".repeat(Math.max(0, to - width(s))) + s;

/** `[0, 3, -1, 1, Infinity, Infinity]` 꼴 — 본문 표기와 같다. */
const show = (xs: number[]): string =>
  `[${xs.map((x) => (x === Number.POSITIVE_INFINITY ? "Infinity" : String(x))).join(", ")}]`;

/** `1,299,994` 꼴 — 본문 표기와 같다. */
const comma = (n: number): string => n.toLocaleString("en-US");

/** 표 한 벌을 칸에 맞춰 찍는다. 첫 행이 머리줄이다. */
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
      .join("   ")
      .replace(/\s+$/, ""),
  );
}

/* ────────────────────── 세는 사본과 다른 절차 ────────────────────── */

function adjacency(n: number, edges: Edge[]): [number, number][][] {
  const adj: [number, number][][] = Array.from({ length: n }, () => []);
  for (const [u, v, w] of edges) (adj[u] as [number, number][]).push([v, w]);
  return adj;
}

/**
 * 가장 단순한 방법 — **시작 정점에서 나가는 모든 경로를 실제로 만들어** 끝점마다 최솟값을
 * 남긴다. 기법이 하나도 안 들어간 풀이다. `calls` 는 만든 경로 조각의 수다.
 */
function enumeratePaths(
  n: number,
  edges: Edge[],
  src: number,
): { dist: number[]; calls: number; paths: number } {
  const adj = adjacency(n, edges);
  const dist: number[] = Array.from(
    { length: n },
    () => Number.POSITIVE_INFINITY,
  );
  let calls = 0;
  let paths = 0;

  const walk = (u: number, cost: number): void => {
    calls++;
    if (cost < (dist[u] as number)) dist[u] = cost;
    const out = adj[u] as [number, number][];
    if (out.length === 0) paths++;
    for (const [v, w] of out) walk(v, cost + w);
  };
  walk(src, 0);
  return { dist, calls, paths };
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

/**
 * 정점을 **주어진 순서대로 한 번씩** 처리하며 나가는 간선을 완화한다. 순서를 갈아 끼워
 * 무엇이 답을 정하는지 보는 자리다. `tries` 는 완화 시도 수다.
 */
function byOrder(
  n: number,
  edges: Edge[],
  src: number,
  order: number[],
): { dist: number[]; tries: number } {
  const adj = adjacency(n, edges);
  const dist: number[] = Array.from(
    { length: n },
    () => Number.POSITIVE_INFINITY,
  );
  dist[src] = 0;
  let tries = 0;
  for (const u of order) {
    if (dist[u] === Number.POSITIVE_INFINITY) continue;
    for (const [v, w] of adj[u] as [number, number][]) {
      tries++;
      const nd = (dist[u] as number) + w;
      if (nd < (dist[v] as number)) dist[v] = nd;
    }
  }
  return { dist, tries };
}

/** 위상 순서 — 정본과 같은 절차로 만든다. */
function topoOrder(n: number, edges: Edge[]): number[] {
  const adj = adjacency(n, edges);
  const remaining: number[] = Array.from({ length: n }, () => 0);
  for (const [, v] of edges) remaining[v] = (remaining[v] as number) + 1;
  const order: number[] = [];
  for (let v = 0; v < n; v++) if (remaining[v] === 0) order.push(v);
  for (let i = 0; i < order.length; i++) {
    const u = order[i] as number;
    for (const [v] of adj[u] as [number, number][]) {
      remaining[v] = (remaining[v] as number) - 1;
      if (remaining[v] === 0) order.push(v);
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
 * 간선 목록 전체를 **고칠 것이 없을 때까지** 라운드마다 다시 읽는 방식. `tries` 는 완화
 * 시도 수이고 `rounds` 는 마지막 확인 라운드까지 센 라운드 수다.
 */
function rounds(
  n: number,
  edges: Edge[],
  src: number,
): { dist: number[]; tries: number; rounds: number } {
  const dist: number[] = Array.from(
    { length: n },
    () => Number.POSITIVE_INFINITY,
  );
  dist[src] = 0;
  let tries = 0;
  let used = 0;
  for (let round = 0; round < n; round++) {
    used++;
    let changed = false;
    for (const [u, v, w] of edges) {
      tries++;
      if (dist[u] === Number.POSITIVE_INFINITY) continue;
      const nd = (dist[u] as number) + w;
      if (nd < (dist[v] as number)) {
        dist[v] = nd;
        changed = true;
      }
    }
    if (!changed) break;
  }
  return { dist, tries, rounds: used };
}

/**
 * 「아직 확정 안 된 정점 중 지금 값이 가장 작은 것을 확정하고 다시 고치지 않는다」는 방식.
 * 가중치가 0 이상이면 이것이 답을 내지만, 음수 간선이 섞이면 갈리는 자리가 생긴다.
 */
function greedy(n: number, edges: Edge[], src: number): number[] {
  const adj = adjacency(n, edges);
  const dist: number[] = Array.from(
    { length: n },
    () => Number.POSITIVE_INFINITY,
  );
  dist[src] = 0;
  const done: boolean[] = Array.from({ length: n }, () => false);
  for (let step = 0; step < n; step++) {
    let pick = -1;
    for (let v = 0; v < n; v++) {
      if (done[v] === true) continue;
      if (pick < 0 || (dist[v] as number) < (dist[pick] as number)) pick = v;
    }
    if (pick < 0) break;
    done[pick] = true;
    if (dist[pick] === Number.POSITIVE_INFINITY) continue;
    for (const [v, w] of adj[pick] as [number, number][]) {
      if (done[v] === true) continue;
      const nd = (dist[pick] as number) + w;
      if (nd < (dist[v] as number)) dist[v] = nd;
    }
  }
  return dist;
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
  const remaining: number[] = Array.from({ length: n }, () => 0);
  cells += n;
  for (const [u, v, w] of edges) {
    cells += 4;
    (adj[u] as [number, number][]).push([v, w]);
    remaining[v] = (remaining[v] as number) + 1;
  }

  const order: number[] = [];
  for (let v = 0; v < n; v++) {
    cells++;
    if (remaining[v] === 0) {
      order.push(v);
      cells++;
    }
  }
  for (let i = 0; i < order.length; i++) {
    cells += 2;
    const u = order[i] as number;
    for (const [v] of adj[u] as [number, number][]) {
      cells += 2;
      remaining[v] = (remaining[v] as number) - 1;
      if (remaining[v] === 0) {
        order.push(v);
        cells++;
      }
    }
  }

  const dist: number[] = Array.from(
    { length: n },
    () => Number.POSITIVE_INFINITY,
  );
  cells += n;
  dist[src] = 0;
  cells++;

  let reached = 0;
  let edgesFromReached = 0;
  let fixes = 0;
  for (const u of order) {
    cells++;
    if (dist[u] === Number.POSITIVE_INFINITY) continue;
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

/* ────────────────────────── 변이 ────────────────────────── */

interface Ref {
  dagShortestPath(n: number, edges: Edge[], src: number): number[];
}

const REF_PATH = new URL("./dagShortestPath-guide.ref.ts", import.meta.url)
  .pathname;

/**
 * 완화의 견주기를 지운 사본 — `if (nd < dist[v]) dist[v] = nd;` 를 `dist[v] = nd;` 로 바꿨다.
 * 한 번 적힌 값이 뒤에 오는 간선 때문에 **커질 수 있게** 된다.
 */
const alwaysWrite = await loadMutant<Ref>(REF_PATH, {
  swap: [
    /^\s+if \(nd < \(dist\[v\] as number\)\) dist\[v\] = nd;/,
    "      dist[v] = nd;",
  ],
});

/** 줄의 길이를 반복에 들어가기 전에 붙잡아 둔 사본. 도중에 붙는 정점을 못 본다. */
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

const MUTANT_CASES: {
  label: string;
  n: number;
  edges: Edge[];
  src: number;
}[] = [
  { label: "전개가 쓰는 여섯 정점", n: WALK_N, edges: WALK_EDGES, src: 0 },
  { label: "사슬 0→1→2→3", n: 4, edges: chain(4), src: 0 },
  {
    label: "번호를 거스르는 간선이 있는 넷",
    n: BACK_N,
    edges: BACK_EDGES,
    src: 0,
  },
  { label: "간선이 없는 네 정점", n: 4, edges: [], src: 0 },
];

/** 견주기를 지운 사본을 걸 입력. 갈리는 자리와 안 갈리는 자리를 함께 보인다. */
const WRITE_CASES: { label: string; n: number; edges: Edge[] }[] = [
  { label: "전개가 쓰는 여섯 정점", n: WALK_N, edges: WALK_EDGES },
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

const writeRows = WRITE_CASES.map((c) => ({
  label: c.label,
  correct: show(dagShortestPath(c.n, c.edges, 0)),
  broken: show(alwaysWrite.dagShortestPath(c.n, c.edges, 0)),
}));

// 하나도 안 갈리면 이 절의 주장이 성립하지 않는다. 실행이 그것을 판정한다.
if (writeRows.every((r) => r.correct === r.broken)) {
  throw new Error(
    "변이가 어느 입력에서도 결과를 바꾸지 못했다 — 「견주기를 지우면 어긋난다」가 거짓이다",
  );
}

// 건너뛰는 줄을 지운 사본은 **어느 입력에서도 답이 같아야** 이 멈춤의 주장이 성립한다.
for (const c of MUTANT_CASES) {
  const a = show(dagShortestPath(c.n, c.edges, c.src));
  const b = show(noSkip.dagShortestPath(c.n, c.edges, c.src));
  if (a !== b) {
    throw new Error(
      `건너뛰는 줄을 지웠더니 답이 갈렸다 — ${c.label}: ${a} vs ${b}`,
    );
  }
}

/* ────────────────────────── 블록 ────────────────────────── */

export const PROOFS: Record<string, () => string> = {
  /** 경로를 전부 만드는 방법을 전개 입력에 실행한 값. */
  "naive-paths": () => {
    const r = enumeratePaths(WALK_N, WALK_EDGES, WALK_SRC);
    return table(
      [
        ["", "값"],
        ["만든 경로 조각 수", comma(r.calls)],
        ["끝까지 간 경로 수", comma(r.paths)],
        ["나온 거리 배열", show(r.dist)],
        [
          "정본이 낸 거리 배열",
          show(dagShortestPath(WALK_N, WALK_EDGES, WALK_SRC)),
        ],
      ],
      [1],
    ).join("\n");
  },

  /** 다이아몬드를 이어 붙이면 경로 수가 어떻게 늘어나는가. */
  "naive-scale": () => {
    const rows: string[][] = [
      [
        "다이아몬드 k",
        "정점 V",
        "간선 E",
        "만든 경로 조각 수",
        "초당 1억 개 기준",
      ],
    ];
    for (const k of [1, 2, 4, 8, 16, 24]) {
      const d = diamonds(k);
      const r = enumeratePaths(d.n, d.edges, 0);
      const seconds = r.calls / 1e8;
      rows.push([
        comma(k),
        comma(d.n),
        comma(d.edges.length),
        comma(r.calls),
        seconds < 60
          ? `${seconds.toFixed(3)}초`
          : `${(seconds / 60).toFixed(1)}분`,
      ]);
    }
    const k = Math.floor((100_000 - 1) / 3);
    const digits = Math.floor(k * Math.log10(2)) + 1;
    return `${table(rows, [0, 1, 2, 3, 4]).join("\n")}
        └ 정점을 제약 상한 100,000 까지 채우면 k = ${comma(k)} 이고 조각 수는 ${comma(digits)} 자리다`;
  },

  /** 라운드마다 간선 목록을 다시 읽는 방식과 정점 순서를 정해 한 번씩 보는 방식. */
  "round-vs-order": () => {
    const chain1000 = chain(1_000);
    const reversed = [...chain1000].reverse();
    const cases: { label: string; n: number; edges: Edge[] }[] = [
      { label: "전개 입력 (정점 6 · 간선 7)", n: WALK_N, edges: WALK_EDGES },
      {
        label: "사슬 1,000 을 위상 순서로 적은 목록",
        n: 1_000,
        edges: chain1000,
      },
      { label: "같은 사슬을 거꾸로 적은 목록", n: 1_000, edges: reversed },
    ];
    return table(
      [
        [
          "입력",
          "라운드 수",
          "라운드 방식의 완화 시도",
          "정점 순서를 정한 방식의 완화 시도",
        ],
        ...cases.map((c) => {
          const r = rounds(c.n, c.edges, 0);
          const o = byOrder(c.n, c.edges, 0, topoOrder(c.n, c.edges));
          return [c.label, comma(r.rounds), comma(r.tries), comma(o.tries)];
        }),
      ],
      [1, 2, 3],
    ).join("\n");
  },

  /** 순서 후보 넷을 같은 두 입력에 걸어 결과를 나란히 놓는다. */
  "order-candidates": () => {
    const walkTopo = topoOrder(WALK_N, WALK_EDGES);
    const backTopo = topoOrder(BACK_N, BACK_EDGES);
    const answerWalk = show(dagShortestPath(WALK_N, WALK_EDGES, 0));
    const answerBack = show(dagShortestPath(BACK_N, BACK_EDGES, 0));
    const numbers = (n: number): number[] =>
      Array.from({ length: n }, (_, i) => i);

    const candidates: {
      label: string;
      walk: number[];
      back: number[];
    }[] = [
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

    const rows: string[][] = [
      [
        "정점을 처리하는 순서",
        "전개 입력의 결과",
        "맞는가",
        "번호를 거스르는 넷",
        "맞는가",
      ],
    ];
    for (const c of candidates) {
      const w = byOrder(WALK_N, WALK_EDGES, 0, c.walk);
      const b = byOrder(BACK_N, BACK_EDGES, 0, c.back);
      rows.push([
        c.label,
        show(w.dist),
        show(w.dist) === answerWalk ? "예" : "아니오",
        show(b.dist),
        show(b.dist) === answerBack ? "예" : "아니오",
      ]);
    }
    rows.push(["정본이 낸 답", answerWalk, "예", answerBack, "예"]);
    return table(rows).join("\n");
  },

  /** 위상 순서로 처리하면 완화 시도가 무엇과 같아지는가. */
  "relax-count": () => {
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
    return table(
      [
        ["입력", "간선 E", "완화 시도", "시작 정점에서 갈 수 있는 정점"],
        ...cases.map((c) => {
          const o = byOrder(c.n, c.edges, c.src, topoOrder(c.n, c.edges));
          const reached = o.dist.filter(
            (d) => d !== Number.POSITIVE_INFINITY,
          ).length;
          return [
            c.label,
            comma(c.edges.length),
            comma(o.tries),
            `${comma(reached)} / ${comma(c.n)}`,
          ];
        }),
      ],
      [1, 2, 3],
    ).join("\n");
  },

  /** 전개 1 단계 — 간선 목록을 두 자료로 옮긴 결과. */
  "walk-two": () => {
    const adj = adjacency(WALK_N, WALK_EDGES);
    const remaining: number[] = Array.from({ length: WALK_N }, () => 0);
    for (const [, v] of WALK_EDGES) remaining[v] = (remaining[v] as number) + 1;
    const rows: string[][] = [];
    for (let v = 0; v < WALK_N; v++) {
      const out = (adj[v] as [number, number][])
        .map(([to, w]) => `${to}(${w})`)
        .join(" ");
      rows.push([
        `adj[${v}] = ${out === "" ? "없음" : out}`,
        `remaining[${v}] = ${remaining[v]}`,
      ]);
    }
    const total = (remaining as number[]).reduce((a, b) => a + b, 0);
    return `${table(rows).join("\n")}
${" ".repeat(width(rows[0]?.[0] ?? ""))}   └ 나가는 간선 수의 합 ${WALK_EDGES.length} = E, remaining 의 합 ${total} = E`;
  },

  /** 전개 2 단계 — 줄이 만들어지는 과정. */
  "walk-order": () => {
    const adj = adjacency(WALK_N, WALK_EDGES);
    const remaining: number[] = Array.from({ length: WALK_N }, () => 0);
    for (const [, v] of WALK_EDGES) remaining[v] = (remaining[v] as number) + 1;
    const fmt = (xs: number[]): string =>
      xs.map((x, i) => `${i}:${x}`).join(" ");

    const order: number[] = [];
    for (let v = 0; v < WALK_N; v++) if (remaining[v] === 0) order.push(v);
    const rows: string[][] = [
      ["처리한 정점", "줄인 칸", "남은 선행 정점 수", "줄"],
      ["—", "—", fmt(remaining), `[${order.join(", ")}]`],
    ];
    for (let i = 0; i < order.length; i++) {
      const u = order[i] as number;
      const touched: string[] = [];
      for (const [v] of adj[u] as [number, number][]) {
        remaining[v] = (remaining[v] as number) - 1;
        touched.push(`${v}:${remaining[v]}`);
        if (remaining[v] === 0) order.push(v);
      }
      rows.push([
        String(u),
        touched.length === 0 ? "없음" : touched.join(" "),
        fmt(remaining),
        `[${order.join(", ")}]`,
      ]);
    }
    return table(rows).join("\n");
  },

  /** 전개 4 단계 — 열 걸음을 끝까지 실행한 값. */
  "walk-trace": () => {
    const adj = adjacency(WALK_N, WALK_EDGES);
    const remaining: number[] = Array.from({ length: WALK_N }, () => 0);
    for (const [, v] of WALK_EDGES) remaining[v] = (remaining[v] as number) + 1;
    const fmt = (xs: number[]): string =>
      xs.map((x, i) => `${i}:${x}`).join(" ");

    const rows: string[][] = [["걸음", "갈래", "하는 일", "줄", "dist"]];
    rows.push([
      "T1",
      "—",
      `간선 일곱을 두 자료로 옮긴다. 남은 선행 정점 수는 ${fmt(remaining)}`,
      "[]",
      "—",
    ]);

    const order: number[] = [];
    for (let v = 0; v < WALK_N; v++) if (remaining[v] === 0) order.push(v);
    rows.push([
      "T2",
      "①",
      "남은 수가 0 인 정점 4 와 5 를 줄에 놓는다",
      `[${order.join(", ")}]`,
      "—",
    ]);

    const pushed: string[] = [];
    for (let i = 0; i < order.length; i++) {
      const u = order[i] as number;
      for (const [v] of adj[u] as [number, number][]) {
        remaining[v] = (remaining[v] as number) - 1;
        if (remaining[v] === 0) {
          order.push(v);
          pushed.push(`${u} 뒤에 ${v}`);
        }
      }
    }
    rows.push([
      "T3",
      "②",
      `줄을 끝까지 채운다 — ${pushed.join(" · ")}`,
      `[${order.join(", ")}]`,
      "—",
    ]);

    const dist: number[] = Array.from(
      { length: WALK_N },
      () => Number.POSITIVE_INFINITY,
    );
    dist[WALK_SRC] = 0;
    rows.push([
      "T4",
      "③",
      `dist[${WALK_SRC}] 만 0 으로 두고 나머지는 Infinity 로 둔다`,
      `[${order.join(", ")}]`,
      show(dist),
    ]);

    let step = 5;
    for (const u of order) {
      const label = `T${step}`;
      step++;
      if (dist[u] === Number.POSITIVE_INFINITY) {
        rows.push([
          label,
          "④",
          `정점 ${u} — 갈 길이 없어 건너뛴다`,
          `[${order.join(", ")}]`,
          show(dist),
        ]);
        continue;
      }
      const notes: string[] = [];
      for (const [v, w] of adj[u] as [number, number][]) {
        const nd = (dist[u] as number) + w;
        if (nd < (dist[v] as number)) {
          notes.push(`${u}→${v} ${nd} 로 고친다`);
          dist[v] = nd;
        } else {
          notes.push(`${u}→${v} ${nd} 은 그대로`);
        }
      }
      rows.push([
        label,
        notes.length === 0 ? "—" : "⑤",
        notes.length === 0
          ? `정점 ${u} — 나가는 간선이 없다`
          : `정점 ${u} — ${notes.join(" · ")}`,
        `[${order.join(", ")}]`,
        show(dist),
      ]);
    }
    return `${table(rows).join("\n")}

반환값 ${show(dist)}`;
  },

  /** 줄의 길이를 미리 붙잡으면 어디서 갈리는가. */
  "mutant-frozen-length": () =>
    table([
      ["", "줄 길이를 그때그때 읽는다", "길이를 미리 붙잡는다"],
      ...MUTANT_CASES.map((c) => [
        c.label,
        show(dagShortestPath(c.n, c.edges, c.src)),
        show(frozenLength.dagShortestPath(c.n, c.edges, c.src)),
      ]),
    ]).join("\n"),

  /** 「지금 가장 작은 값부터 확정한다」로 바꾸면 어디서 갈리는가. */
  "pause-greedy": () => {
    const cases: { label: string; n: number; edges: Edge[] }[] = [
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
    return table([
      ["입력", "위상 순서로 완화한 답", "가장 작은 값부터 확정한 답", "판정"],
      ...cases.map((c) => {
        const a = show(dagShortestPath(c.n, c.edges, 0));
        const b = show(greedy(c.n, c.edges, 0));
        return [c.label, a, b, a === b ? "같다" : "다르다"];
      }),
    ]).join("\n");
  },

  /** 건너뛰는 줄을 지우면 답과 완화 시도가 각각 어떻게 되는가. */
  "pause-noskip": () => {
    const cases: { label: string; n: number; edges: Edge[]; src: number }[] = [
      { label: "전개 입력", n: WALK_N, edges: WALK_EDGES, src: 0 },
      {
        label: "시작 정점이 사슬의 한가운데 (정점 500)",
        n: 1_000,
        edges: chain(1_000),
        src: 500,
      },
      {
        label: "시작 정점이 사슬의 끝 (정점 999)",
        n: 1_000,
        edges: chain(1_000),
        src: 999,
      },
    ];
    return table(
      [
        [
          "입력",
          "갈 수 있는 정점",
          "두 답을 견주면",
          "줄이 있을 때 완화 시도",
          "줄을 지웠을 때 완화 시도",
        ],
        ...cases.map((c) => {
          const a = dagShortestPath(c.n, c.edges, c.src);
          const b = noSkip.dagShortestPath(c.n, c.edges, c.src);
          const m = countCells(c.n, c.edges, c.src);
          return [
            c.label,
            `${comma(m.reached)} / ${comma(c.n)}`,
            show(a) === show(b) ? "칸마다 같다" : "갈린다",
            comma(m.edgesFromReached),
            comma(c.edges.length),
          ];
        }),
      ],
      [1, 3, 4],
    ).join("\n");
  },

  /** 전체 코드를 여러 입력에 실행한 결과. */
  "walk-result": () => {
    const cases: { call: string; run: () => number[] }[] = [
      {
        call: "dagShortestPath(6, [[2,3,2],[0,1,3],[1,2,-4],[0,2,5],[1,3,6],[4,0,2],[0,3,7]], 0)",
        run: () => dagShortestPath(WALK_N, WALK_EDGES, 0),
      },
      {
        call: "dagShortestPath(4, [[0,1,5],[0,2,3],[1,3,-2],[2,3,1]], 0)",
        run: () =>
          dagShortestPath(
            4,
            [
              [0, 1, 5],
              [0, 2, 3],
              [1, 3, -2],
              [2, 3, 1],
            ],
            0,
          ),
      },
      {
        call: "dagShortestPath(4, [[2,3,1],[1,2,1],[0,1,1]], 0)",
        run: () =>
          dagShortestPath(
            4,
            [
              [2, 3, 1],
              [1, 2, 1],
              [0, 1, 1],
            ],
            0,
          ),
      },
      {
        call: "dagShortestPath(3, [[0,2,1],[1,2,1]], 2)",
        run: () =>
          dagShortestPath(
            3,
            [
              [0, 2, 1],
              [1, 2, 1],
            ],
            2,
          ),
      },
      {
        call: "dagShortestPath(3, [[0,1,0],[1,2,0]], 0)",
        run: () =>
          dagShortestPath(
            3,
            [
              [0, 1, 0],
              [1, 2, 0],
            ],
            0,
          ),
      },
      {
        call: "dagShortestPath(2, [[0,1,10],[0,1,-3]], 0)",
        run: () =>
          dagShortestPath(
            2,
            [
              [0, 1, 10],
              [0, 1, -3],
            ],
            0,
          ),
      },
      {
        call: "dagShortestPath(3, [], 1)",
        run: () => dagShortestPath(3, [], 1),
      },
      {
        call: "dagShortestPath(1, [], 0)",
        run: () => dagShortestPath(1, [], 0),
      },
    ];
    return table(cases.map((c) => [c.call, "→", show(c.run())])).join("\n");
  },

  /** 정의를 전개 입력에 넣어 검산한다. */
  "math-check": () => {
    const enumerated = enumeratePaths(WALK_N, WALK_EDGES, WALK_SRC);
    const got = dagShortestPath(WALK_N, WALK_EDGES, WALK_SRC);
    return table(
      [
        [
          "정점 v",
          "경로를 전부 만들어 고른 최솟값",
          "이 절차의 dist[v]",
          "판정",
        ],
        ...Array.from({ length: WALK_N }, (_, v) => {
          const a = enumerated.dist[v] as number;
          const b = got[v] as number;
          const fmt = (x: number): string =>
            x === Number.POSITIVE_INFINITY ? "Infinity" : String(x);
          return [String(v), fmt(a), fmt(b), a === b ? "같다" : "다르다"];
        }),
      ],
      [1, 2],
    ).join("\n");
  },

  /** 경로 수와 간선 수를 제약 규모에서 견준다. */
  "math-scale": () => {
    const rows: string[][] = [
      ["다이아몬드 k", "닫힌 형태 2^k", "실제로 센 경로 수", "간선 E = 4k"],
    ];
    for (const k of [1, 2, 3, 4, 8, 16, 20]) {
      const d = diamonds(k);
      rows.push([
        comma(k),
        comma(2 ** k),
        comma(countPaths(d.n, d.edges, 0, d.last)),
        comma(d.edges.length),
      ]);
    }
    const k = Math.floor((100_000 - 1) / 3);
    const digits = Math.floor(k * Math.log10(2)) + 1;
    return `${table(rows, [0, 1, 2, 3]).join("\n")}

제약 상한 V = 100,000 · E = 200,000 에서
  다이아몬드 수 k        ${comma(k)}
  경로 수 2^k            ${comma(digits)} 자리
  간선을 한 번씩 읽으면  ${comma(4 * k)} 번   E = 4k 라 제약 상한 200,000 안쪽이다`;
  },

  /** 견주기를 지우고 언제나 고쳐 적으면 어디서 갈리는가. */
  "mutant-always-write": () =>
    table([
      ["", "작을 때만 고쳐 적는다", "언제나 고쳐 적는다"],
      ...writeRows.map((r) => [r.label, r.correct, r.broken]),
    ]).join("\n"),

  /** 닫힌 형태가 실제 계수와 같은지 대조한다. */
  "cost-closed-form": () => {
    const cases: { label: string; n: number; edges: Edge[]; src: number }[] = [
      { label: "전개가 쓰는 여섯 정점", n: WALK_N, edges: WALK_EDGES, src: 0 },
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
    return table(
      [
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
        ...cases.map((c) => {
          const m = countCells(c.n, c.edges, c.src);
          return [
            c.label,
            comma(c.n),
            comma(c.edges.length),
            comma(m.reached),
            comma(m.edgesFromReached),
            comma(m.fixes),
            comma(m.cells),
            comma(
              closedForm(
                c.n,
                c.edges.length,
                m.reached,
                m.edgesFromReached,
                m.fixes,
              ),
            ),
          ];
        }),
      ],
      [1, 2, 3, 4, 5, 6, 7],
    ).join("\n");
  },

  /** 갈 수 있는 정점 수를 바꾸면 계수가 얼마나 갈리는가. */
  "shape-values": () => {
    const V = 100_000;
    const edges: Edge[] = [];
    for (let i = 0; i + 1 < V; i++) edges.push([i, i + 1, (i % 9) + 1]);
    for (let i = 0; i + 2 < V; i++) edges.push([i, i + 2, ((i * 7) % 13) - 6]);
    for (let i = 0; i < 3; i++) edges.push([i, i + 3, 1]);

    const cases: { label: string; src: number }[] = [
      { label: "시작 정점이 맨 앞 — 전부 갈 수 있다", src: 0 },
      { label: "시작 정점이 한가운데 — 절반만 갈 수 있다", src: V / 2 },
      { label: "시작 정점이 맨 뒤 — 자기 자신뿐이다", src: V - 1 },
    ];
    return table(
      [
        [
          "입력",
          "V",
          "E",
          "갈 수 있는 정점 R",
          "완화 시도 E_R",
          "고쳐 적기 c",
          "배열 칸 접근",
        ],
        ...cases.map((c) => {
          const m = countCells(V, edges, c.src);
          return [
            c.label,
            comma(V),
            comma(edges.length),
            comma(m.reached),
            comma(m.edgesFromReached),
            comma(m.fixes),
            comma(m.cells),
          ];
        }),
      ],
      [1, 2, 3, 4, 5, 6],
    ).join("\n");
  },
};
