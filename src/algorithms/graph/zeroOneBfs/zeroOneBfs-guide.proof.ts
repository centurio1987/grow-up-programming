/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run tools/check-proof.ts src/algorithms/graph/zeroOneBfs/zeroOneBfs-guide.md
 *
 * **계수를 세는 사본이 넷 있다**(`levelSweep`·`orderRun`·`shiftMoves`·`walkRows`). 정본은 몇
 * 번 셌는지를 내보내지 않으므로, 세는 자리만 덧붙인 사본이 아니면 계수를 낼 방법이 없다.
 * **답이 맞는지는 사본이 아니라 정본이 진다** — 사본을 쓰는 자리마다 정본과 답을 대조하고
 * 어긋나면 그 자리에서 던진다.
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { type Edge, zeroOneBfs } from "./zeroOneBfs-guide.ref.ts";

/* ────────────────────────── 고정 입력 ────────────────────────── */

/** 본문 전개가 쓰는 그래프. 정점 여섯 · 방향 간선 여섯 · 정점 5 는 들어오는 간선이 없다. */
const WALK_N = 6;
const WALK_EDGES: Edge[] = [
  [0, 1, 1],
  [0, 2, 0],
  [2, 1, 0],
  [2, 3, 1],
  [1, 3, 1],
  [3, 4, 0],
];

/**
 * 격자 — `k × k` 칸에서 오른쪽과 아래로만 가는 간선을 둔다. 가로 간선의 가중치는
 * `(i + j) % 3 === 0` 이면 0 이고 아니면 1, 세로 간선은 `(2i + j) % 3 === 0` 이면 0 이고
 * 아니면 1 이다. 정점 `k²` 개, 간선 `2k(k−1)` 개.
 */
function grid(k: number): { n: number; edges: Edge[] } {
  const id = (i: number, j: number): number => i * k + j;
  const edges: Edge[] = [];
  for (let i = 0; i < k; i++) {
    for (let j = 0; j < k; j++) {
      if (j + 1 < k) {
        edges.push([id(i, j), id(i, j + 1), (i + j) % 3 === 0 ? 0 : 1]);
      }
      if (i + 1 < k) {
        edges.push([id(i, j), id(i + 1, j), (i * 2 + j) % 3 === 0 ? 0 : 1]);
      }
    }
  }
  return { n: k * k, edges };
}

/**
 * 늦은 지름길 — 가중치 1 사슬 `a₁ … a_m` 과 가중치 0 사슬 `b₁ … b_m` 을 나란히 두고,
 * `bᵢ → aᵢ` 를 가중치 0 으로 잇는다. `aᵢ` 는 먼저 1 로 적혔다가 나중에 0 으로 고쳐진다.
 * 정점 `2m + 1` 개, 간선 `3m` 개.
 */
function lateShortcut(m: number): { n: number; edges: Edge[] } {
  const a = (i: number): number => i;
  const b = (i: number): number => m + i;
  const edges: Edge[] = [[0, a(1), 1]];
  for (let i = 1; i < m; i++) edges.push([a(i), a(i + 1), 1]);
  edges.push([0, b(1), 0]);
  for (let i = 1; i < m; i++) edges.push([b(i), b(i + 1), 0]);
  for (let i = 1; i <= m; i++) edges.push([b(i), a(i), 0]);
  return { n: 2 * m + 1, edges };
}

/**
 * 두 번 그래프 — `0` 에서 가중치 1 간선으로 `a₁ … a_k` 를 먼저 1 로 적고, 가중치 0 간선으로
 * 들른 `b` 가 그 `k` 개를 전부 0 으로 고친다. 그래서 `aᵢ` 가 전부 덱에 두 번 들어간다.
 * 정점 `k + 3` 개, 간선 `3k + 1` 개.
 */
function twiceGraph(k: number): { n: number; edges: Edge[] } {
  const b = k + 1;
  const c = k + 2;
  const edges: Edge[] = [];
  for (let i = 1; i <= k; i++) edges.push([0, i, 1]);
  edges.push([0, b, 0]);
  for (let i = 1; i <= k; i++) edges.push([b, i, 0]);
  for (let i = 1; i <= k; i++) edges.push([i, c, 1]);
  return { n: k + 3, edges };
}

/**
 * 두 번 그래프에 가지를 단 것 — `aᵢ` 마다 나가는 간선을 `d` 개 둔다. `aᵢ` 가 두 번 꺼내지므로
 * 그 `k·d` 개가 **두 번씩** 읽히고, 그래서 간선 검사가 `2E` 에 가장 가까워진다.
 * 정점 `k + d + 2` 개, 간선 `2k + 1 + k·d` 개.
 */
function twiceFan(k: number, d: number): { n: number; edges: Edge[] } {
  const b = k + 1;
  const edges: Edge[] = [];
  for (let i = 1; i <= k; i++) edges.push([0, i, 1]);
  edges.push([0, b, 0]);
  for (let i = 1; i <= k; i++) edges.push([b, i, 0]);
  for (let i = 1; i <= k; i++) {
    for (let j = 1; j <= d; j++) edges.push([i, k + 1 + j, 1]);
  }
  return { n: k + d + 2, edges };
}

/** 가중치 1 사슬. 최대 거리가 가장 커지는 모양. */
function chain(v: number): { n: number; edges: Edge[] } {
  const edges: Edge[] = [];
  for (let i = 0; i + 1 < v; i++) edges.push([i, i + 1, 1]);
  return { n: v, edges };
}

/** 별 — 시작 정점에서 나머지 전부로 가중치 1 간선. 덱이 한 번에 가장 커지는 모양. */
function star(v: number): { n: number; edges: Edge[] } {
  const edges: Edge[] = [];
  for (let i = 1; i < v; i++) edges.push([0, i, 1]);
  return { n: v, edges };
}

/** 0 과 1 이 번갈아 나오는 사슬. 거리 층이 두 정점마다 하나씩 늘어난다. */
function zigzag(v: number): { n: number; edges: Edge[] } {
  const edges: Edge[] = [];
  for (let i = 0; i + 1 < v; i++) edges.push([i, i + 1, i % 2]);
  return { n: v, edges };
}

/* ────────────────────────── 칸 맞춤 ────────────────────────── */

/** 한글은 고정폭 화면에서 두 칸을 먹는다. 한글·가나·한자 구간을 두 칸으로 센다. */
const width = (s: string): number =>
  [...s].reduce((n, c) => n + (/[ᄀ-ᇿ　-〿㄰-㆏가-힯一-鿿]/.test(c) ? 2 : 1), 0);

const pad = (s: string, to: number): string =>
  s + " ".repeat(Math.max(0, to - width(s)));

const padLeft = (s: string, to: number): string =>
  " ".repeat(Math.max(0, to - width(s))) + s;

/** 표 한 벌을 칸에 맞춰 찍는다. 첫 행이 머리줄이다. */
function table(rows: string[][], alignRight: number[] = []): string {
  const cols = rows[0]?.length ?? 0;
  const widths: number[] = [];
  for (let c = 0; c < cols; c++) {
    widths.push(Math.max(...rows.map((r) => width(r[c] ?? ""))));
  }
  return rows
    .map((r) =>
      r
        .map((cell, c) =>
          alignRight.includes(c)
            ? padLeft(cell, widths[c] ?? 0)
            : pad(cell, widths[c] ?? 0),
        )
        .join("   ")
        .replace(/\s+$/, ""),
    )
    .join("\n");
}

/** `[0, 0, 0, 1, 1, -1]` 꼴 — 본문 표기와 같다. */
const show = (xs: number[]): string => `[${xs.join(", ")}]`;

/** `19,999,600,002` 꼴 — 본문 표기와 같다. */
const comma = (n: number): string => n.toLocaleString("en-US");

/** `dist` 를 `∞` 를 살려 적는다 — 반환 직전의 배열이라 `-1` 로 바꾸기 전이다. */
const showDist = (xs: number[]): string =>
  `[${xs.map((d) => (d === Number.POSITIVE_INFINITY ? "∞" : String(d))).join(", ")}]`;

/* ────────────────────── 계수를 세는 사본 넷 ────────────────────── */

function adjacency(n: number, edges: Edge[]): [number, number][][] {
  const adj: [number, number][][] = Array.from({ length: n }, () => []);
  for (const [u, v, w] of edges) (adj[u] as [number, number][]).push([v, w]);
  return adj;
}

const answer = (dist: number[]): number[] =>
  dist.map((d) => (d === Number.POSITIVE_INFINITY ? -1 : d));

/**
 * 가장 단순한 방법 — 거리 `level` 인 무리를 `level = 0, 1, 2, …` 순서로 만든다. 무리마다
 * ⓐ 가중치 0 간선으로 더 채울 곳이 없을 때까지 간선 목록을 되풀이해 읽고 ⓑ 가중치 1 간선으로
 * 한 걸음 나간다. `scans` 는 간선 하나를 읽고 값을 견준 횟수다.
 */
function levelSweep(n: number, edges: Edge[], source: number) {
  const dist = Array.from({ length: n }, () => Number.POSITIVE_INFINITY);
  dist[source] = 0;
  let scans = 0;
  let level = 0;
  let sweeps = 0;
  for (;;) {
    for (;;) {
      sweeps++;
      let changed = false;
      for (const [u, v, w] of edges) {
        scans++;
        if (w === 0 && dist[u] === level && (dist[v] as number) > level) {
          dist[v] = level;
          changed = true;
        }
      }
      if (!changed) break;
    }
    sweeps++;
    let stepped = false;
    for (const [u, v, w] of edges) {
      scans++;
      if (w === 1 && dist[u] === level && (dist[v] as number) > level + 1) {
        dist[v] = level + 1;
        stepped = true;
      }
    }
    if (!stepped) break;
    level++;
  }
  return { dist: answer(dist), scans, sweeps, levels: level + 1 };
}

type Rule = "deque" | "backOnly" | "frontOnly";

/**
 * 넣는 자리를 규칙 셋으로 갈아 끼운 사본. `deque` 가 정본과 같은 규칙이다.
 * `pops` 는 덱에서 정점을 꺼낸 횟수, `scans` 는 간선을 읽고 값을 견준 횟수,
 * `peak` 는 덱이 한 번에 가장 많이 담은 항목 수, `pushes[v]` 는 `v` 가 들어간 횟수다.
 */
function orderRun(n: number, edges: Edge[], source: number, rule: Rule) {
  const adj = adjacency(n, edges);
  const dist = Array.from({ length: n }, () => Number.POSITIVE_INFINITY);
  dist[source] = 0;
  const dq: number[] = [source];
  const pushes = Array.from({ length: n }, () => 0);
  pushes[source] = 1;
  let pops = 0;
  let scans = 0;
  let peak = 1;
  while (dq.length > 0) {
    const u = dq.shift() as number;
    pops++;
    for (const [v, w] of adj[u] as [number, number][]) {
      scans++;
      const nd = (dist[u] as number) + w;
      if (nd >= (dist[v] as number)) continue;
      dist[v] = nd;
      pushes[v] = (pushes[v] as number) + 1;
      if (rule === "backOnly") dq.push(v);
      else if (rule === "frontOnly") dq.unshift(v);
      else if (w === 0) dq.unshift(v);
      else dq.push(v);
      peak = Math.max(peak, dq.length);
    }
  }
  return { dist: answer(dist), pops, scans, peak, pushes };
}

/**
 * 덱을 **배열 하나**로 흉내 낸 사본. 앞에 넣을 때마다 뒤에 있던 원소를 한 칸씩 밀고, 앞에서
 * 꺼낼 때마다 한 칸씩 당긴다. `moves` 가 그렇게 옮긴 원소를 전부 더한 값이다.
 * 두 배열 덱은 `back` 이 비었을 때 뒤집어 옮기는 원소만 센다.
 */
function shiftMoves(n: number, edges: Edge[], source: number) {
  const adj = adjacency(n, edges);
  const dist = Array.from({ length: n }, () => Number.POSITIVE_INFINITY);
  dist[source] = 0;
  const one: number[] = [source];
  let oneMoves = 0;
  const front: number[] = [];
  const back: number[] = [source];
  let twoMoves = 0;
  while (one.length > 0) {
    oneMoves += one.length - 1;
    const u = one.shift() as number;
    if (front.length === 0) {
      twoMoves += back.length;
      while (back.length > 0) front.push(back.pop() as number);
    }
    front.pop();
    for (const [v, w] of adj[u] as [number, number][]) {
      const nd = (dist[u] as number) + w;
      if (nd >= (dist[v] as number)) continue;
      dist[v] = nd;
      if (w === 0) {
        oneMoves += one.length;
        one.unshift(v);
        front.push(v);
      } else {
        one.push(v);
        back.push(v);
      }
    }
  }
  return { dist: answer(dist), oneMoves, twoMoves };
}

/** 전개 한 걸음. 간선 하나를 읽는 것이 한 걸음이고, 이웃이 없으면 꺼낸 것만으로 한 걸음이다. */
interface WalkRow {
  step: string;
  popped: string;
  edge: string;
  branch: string;
  dist: string;
  deque: string;
}

function walkRows(n: number, edges: Edge[], source: number): WalkRow[] {
  const adj = adjacency(n, edges);
  const dist = Array.from({ length: n }, () => Number.POSITIVE_INFINITY);
  dist[source] = 0;
  const dq: number[] = [source];
  const rows: WalkRow[] = [
    {
      step: "T1",
      popped: "—",
      edge: "—",
      branch: `dist[${source}] ← 0`,
      dist: showDist(dist),
      deque: show(dq),
    },
  ];
  let t = 1;
  while (dq.length > 0) {
    const u = dq.shift() as number;
    const list = adj[u] as [number, number][];
    if (list.length === 0) {
      t++;
      rows.push({
        step: `T${t}`,
        popped: String(u),
        edge: "없음",
        branch: "볼 간선이 없다",
        dist: showDist(dist),
        deque: show(dq),
      });
      continue;
    }
    for (const [v, w] of list) {
      t++;
      const nd = (dist[u] as number) + w;
      if (nd >= (dist[v] as number)) {
        rows.push({
          step: `T${t}`,
          popped: String(u),
          edge: `${u}→${v} (w${w})`,
          branch: `① ${nd} ≥ ${dist[v]}`,
          dist: showDist(dist),
          deque: show(dq),
        });
        continue;
      }
      dist[v] = nd;
      if (w === 0) dq.unshift(v);
      else dq.push(v);
      rows.push({
        step: `T${t}`,
        popped: String(u),
        edge: `${u}→${v} (w${w})`,
        branch: w === 0 ? `② 앞에 넣는다` : `③ 뒤에 넣는다`,
        dist: showDist(dist),
        deque: show(dq),
      });
    }
  }
  t++;
  rows.push({
    step: `T${t}`,
    popped: "—",
    edge: "—",
    branch: "④ ∞ 를 -1 로 적는다",
    dist: show(answer(dist)),
    deque: show(dq),
  });
  return rows;
}

/* ────────────────── 사본이 정본과 같은 답을 내는가 ────────────────── */

/** 결정론적 난수 — 선형 합동. 사본 검증 입력을 만든다. */
function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1_664_525 + 1_013_904_223) >>> 0;
    return s / 4_294_967_296;
  };
}

function randomGraph(seed: number): { n: number; edges: Edge[] } {
  const r = rng(seed);
  const n = 3 + Math.floor(r() * 24);
  const m = Math.floor(r() * n * 3);
  const edges: Edge[] = [];
  for (let i = 0; i < m; i++) {
    edges.push([Math.floor(r() * n), Math.floor(r() * n), r() < 0.5 ? 0 : 1]);
  }
  return { n, edges };
}

/** 난수 그래프 300 벌에서 사본 넷이 전부 정본과 같은 답을 내는지 본다. */
const PUSH_LIMIT = (() => {
  let worst = 0;
  for (let seed = 1; seed <= 300; seed++) {
    const g = randomGraph(seed);
    const want = show(zeroOneBfs(g.n, g.edges, 0));
    const level = levelSweep(g.n, g.edges, 0);
    const deque = orderRun(g.n, g.edges, 0, "deque");
    const back = orderRun(g.n, g.edges, 0, "backOnly");
    const front = orderRun(g.n, g.edges, 0, "frontOnly");
    const moves = shiftMoves(g.n, g.edges, 0);
    for (const [name, got] of [
      ["levelSweep", level.dist],
      ["orderRun deque", deque.dist],
      ["orderRun backOnly", back.dist],
      ["orderRun frontOnly", front.dist],
      ["shiftMoves", moves.dist],
    ] as [string, number[]][]) {
      if (show(got) !== want) {
        throw new Error(
          `${name} 이 정본과 다른 답을 냈다(seed=${seed}) — ${show(got)} vs ${want}`,
        );
      }
    }
    worst = Math.max(worst, ...deque.pushes);
  }
  return worst;
})();

/* ────────────────────────── 변이 둘 ────────────────────────── */

/**
 * `deque.pushFront(v);` **한 줄만** 지운 사본. 정본 소스에서 기계로 만든다 — 맞는 줄이
 * 정확히 하나가 아니면 `loadMutant` 가 던진다. 불변식을 지키던 줄이 그것이다.
 */
const noFront = await loadMutant<{
  zeroOneBfs(n: number, edges: Edge[], source: number): number[];
}>(new URL("./zeroOneBfs-guide.ref.ts", import.meta.url).pathname, {
  drop: /deque\.pushFront\(v\)/,
});

/** 시작값을 `Infinity` 대신 `-1` 로 둔 사본. 한 줄의 값 하나만 바뀐다. */
const initMinusOne = await loadMutant<{
  zeroOneBfs(n: number, edges: Edge[], source: number): number[];
}>(new URL("./zeroOneBfs-guide.ref.ts", import.meta.url).pathname, {
  swap: [/\(\) => Number\.POSITIVE_INFINITY/, "() => -1"],
});

const MUTANT_CASES: { label: string; n: number; edges: Edge[] }[] = [
  { label: "전개 입력", n: WALK_N, edges: WALK_EDGES },
  {
    label: "0 사슬 0→1→2 (전부 w0)",
    n: 3,
    edges: [
      [0, 1, 0],
      [1, 2, 0],
    ],
  },
  {
    label: "1 사슬 0→1→2→3 (전부 w1)",
    n: 4,
    edges: [
      [0, 1, 1],
      [1, 2, 1],
      [2, 3, 1],
    ],
  },
];

// 변이 둘이 어느 입력에서도 결과를 안 바꾸면 그 절의 주장이 성립하지 않는다.
for (const [name, mod] of [
  ["pushFront 줄 삭제", noFront],
  ["시작값 -1", initMinusOne],
] as [string, { zeroOneBfs(n: number, e: Edge[], s: number): number[] }][]) {
  const changed = MUTANT_CASES.some(
    (c) =>
      show(zeroOneBfs(c.n, c.edges, 0)) !==
      show(mod.zeroOneBfs(c.n, c.edges, 0)),
  );
  if (!changed) {
    throw new Error(`${name} 변이가 어느 입력에서도 결과를 안 바꿨다`);
  }
}

/* ────────────────────────── 블록 ────────────────────────── */

export const PROOFS: Record<string, () => string> = {
  /** 가장 단순한 방법이 제약 규모에서 몇 번을 세는가 — 수치 반박의 근거. */
  naiveScale: () => {
    // 0/1 사슬에서는 거리 층이 `⌊(V−1)/2⌋ + 1` 개이고 층마다 간선 목록을 세 번 읽는다.
    // 아래 넷은 실제로 돌려서 이 식과 대조하고, 큰 둘은 그 식으로 잇는다.
    const levelsOf = (v: number): number => Math.floor((v - 1) / 2) + 1;
    const sweepsOf = (v: number): number => 3 * levelsOf(v);
    const scansOf = (v: number): number => sweepsOf(v) * (v - 1);
    const rows: string[][] = [
      [
        "정점 V",
        "간선 E",
        "거리 층",
        "간선 목록 읽기",
        "간선 검사",
        "초당 1억 번 기준",
      ],
    ];
    for (const v of [10, 100, 1_000, 2_000]) {
      const g = zigzag(v);
      const got = levelSweep(g.n, g.edges, 0);
      if (got.levels !== levelsOf(v) || got.sweeps !== sweepsOf(v)) {
        throw new Error(
          `0/1 사슬의 식이 실측과 다르다(V=${v}) — 층 ${got.levels}/${levelsOf(v)} · 읽기 ${got.sweeps}/${sweepsOf(v)}`,
        );
      }
      rows.push([
        comma(v),
        comma(g.edges.length),
        comma(got.levels),
        comma(got.sweeps),
        comma(got.scans),
        `${(got.scans / 1e8).toFixed(3)}초`,
      ]);
    }
    for (const v of [10_000, 100_000]) {
      rows.push([
        comma(v),
        comma(v - 1),
        comma(levelsOf(v)),
        comma(sweepsOf(v)),
        comma(scansOf(v)),
        `${(scansOf(v) / 1e8).toFixed(3)}초`,
      ]);
    }
    return table(rows, [0, 1, 2, 3, 4, 5]);
  },

  /** 같은 그래프를 두 방식으로 처리해 간선 검사 횟수를 나란히 센다. */
  sweepVsDeque: () => {
    const s = levelSweep(WALK_N, WALK_EDGES, 0);
    const d = orderRun(WALK_N, WALK_EDGES, 0, "deque");
    return table([
      ["", "간선 검사", "되풀이한 횟수", "결과"],
      [
        "거리 층마다 간선 목록을 다시 읽는다",
        comma(s.scans),
        `간선 목록 읽기 ${s.sweeps}`,
        show(s.dist),
      ],
      [
        "덱에서 하나씩 꺼낸다",
        comma(d.scans),
        `꺼낸 정점 ${d.pops}`,
        show(d.dist),
      ],
    ]);
  },

  /** 넣는 자리 규칙 셋을 같은 입력들에 걸어 결과와 계수를 함께 낸다. */
  orderCandidates: () => {
    const inputs: [string, { n: number; edges: Edge[] }][] = [
      ["전개 입력", { n: WALK_N, edges: WALK_EDGES }],
      ["격자 8×8", grid(8)],
      ["늦은 지름길 m=64", lateShortcut(64)],
    ];
    const rows: string[][] = [
      [
        "넣는 자리",
        "전개 입력",
        "격자 8×8",
        "늦은 지름길 m=64",
        "세 입력의 답",
      ],
    ];
    for (const [label, rule] of [
      ["전부 뒤에 넣는다", "backOnly"],
      ["전부 앞에 넣는다", "frontOnly"],
      ["가중치로 갈라 넣는다", "deque"],
    ] as [string, Rule][]) {
      const cells = inputs.map(([, g]) => {
        const got = orderRun(g.n, g.edges, 0, rule);
        return `${comma(got.pops)} / ${comma(got.scans)}`;
      });
      const same = inputs.every(
        ([, g]) =>
          show(orderRun(g.n, g.edges, 0, rule).dist) ===
          show(zeroOneBfs(g.n, g.edges, 0)),
      );
      rows.push([label, ...cells, same ? "정본과 같다" : "정본과 다르다"]);
    }
    rows.push([
      "정점 V / 간선 E",
      ...inputs.map(([, g]) => `${comma(g.n)} / ${comma(g.edges.length)}`),
      "",
    ]);
    return `${table(rows)}\n\n왼쪽 수가 꺼낸 정점 수, 오른쪽 수가 간선 검사 횟수다`;
  },

  /** 정점 하나가 덱에 들어가는 횟수의 상한을 여러 모양에서 실측한다. */
  pushBound: () => {
    const shapes: [string, { n: number; edges: Edge[] }][] = [
      ["전개 입력", { n: WALK_N, edges: WALK_EDGES }],
      ["격자 32×32", grid(32)],
      ["늦은 지름길 m=64", lateShortcut(64)],
      ["두 번 그래프 k=50", twiceGraph(50)],
      ["가중치 1 사슬 V=1,000", chain(1000)],
      ["별 V=1,000", star(1000)],
    ];
    const rows: string[][] = [
      ["모양", "정점 V", "간선 E", "덱에 넣은 항목", "정점당 최대", "2V"],
    ];
    for (const [label, g] of shapes) {
      const got = orderRun(g.n, g.edges, 0, "deque");
      const total = got.pushes.reduce((a, b) => a + b, 0);
      rows.push([
        label,
        comma(g.n),
        comma(g.edges.length),
        comma(total),
        String(Math.max(...got.pushes)),
        comma(2 * g.n),
      ]);
    }
    return `${table(rows, [1, 2, 3, 4, 5])}\n\n난수 그래프 300 벌에서도 정점당 최대가 ${PUSH_LIMIT} 를 넘지 않았다`;
  },

  /** 배열 하나로 흉내 낸 덱과 배열 두 개짜리 덱의 원소 이동 수. */
  pauseMoves: () => {
    const shapes: [string, { n: number; edges: Edge[] }][] = [
      ["전개 입력", { n: WALK_N, edges: WALK_EDGES }],
      ["격자 8×8", grid(8)],
      ["격자 32×32", grid(32)],
      ["별 V=1,000", star(1000)],
    ];
    const rows: string[][] = [
      ["모양", "정점 V", "간선 E", "배열 하나", "배열 두 개", "몇 배"],
    ];
    for (const [label, g] of shapes) {
      const got = shiftMoves(g.n, g.edges, 0);
      rows.push([
        label,
        comma(g.n),
        comma(g.edges.length),
        comma(got.oneMoves),
        comma(got.twoMoves),
        `${(got.oneMoves / Math.max(1, got.twoMoves)).toFixed(1)} 배`,
      ]);
    }
    return `${table(rows, [1, 2, 3, 4, 5])}\n\n옮긴 원소를 전부 더한 값이다. 답은 네 모양 모두 같다`;
  },

  /** 전개 입력에서 정점별 덱 진입·꺼냄 횟수. */
  pauseTwice: () => {
    const got = orderRun(WALK_N, WALK_EDGES, 0, "deque");
    const adj = adjacency(WALK_N, WALK_EDGES);
    const rows: string[][] = [["정점", "0", "1", "2", "3", "4", "5", "합"]];
    rows.push([
      "덱에 들어간 횟수",
      ...got.pushes.map(String),
      String(got.pushes.reduce((a, b) => a + b, 0)),
    ]);
    rows.push([
      "이웃 목록 길이",
      ...adj.map((l) => String(l.length)),
      String(adj.reduce((a, l) => a + l.length, 0)),
    ]);
    return `${table(rows, [1, 2, 3, 4, 5, 6, 7])}\n\n꺼낸 정점 ${got.pops} · 간선 검사 ${got.scans} · 정점 수 ${WALK_N}`;
  },

  /** 시작값을 -1 로 두면 나오는 답. */
  pauseInitMinusOne: () =>
    table([
      ["입력", "시작값이 Infinity 일 때", "시작값이 -1 일 때"],
      ...MUTANT_CASES.map((c) => [
        c.label,
        show(zeroOneBfs(c.n, c.edges, 0)),
        show(initMinusOne.zeroOneBfs(c.n, c.edges, 0)),
      ]),
    ]),

  /** 전개 열 걸음을 그대로 펼친다. */
  walkTrace: () => {
    const rows = walkRows(WALK_N, WALK_EDGES, 0);
    return table([
      ["걸음", "꺼낸 정점", "보는 간선", "갈래", "dist", "덱(앞→뒤)"],
      ...rows.map((r) => [r.step, r.popped, r.edge, r.branch, r.dist, r.deque]),
    ]);
  },

  /** 전체 코드를 여러 입력에 실행한 결과. */
  finalCases: () => {
    const cases: [string, number, Edge[], number][] = [
      [
        "zeroOneBfs(6, [[0,1,1],[0,2,0],[2,1,0],[2,3,1],[1,3,1],[3,4,0]], 0)",
        WALK_N,
        WALK_EDGES,
        0,
      ],
      [
        "zeroOneBfs(4, [[0,1,1],[1,2,1],[2,3,1]], 0)",
        4,
        [
          [0, 1, 1],
          [1, 2, 1],
          [2, 3, 1],
        ],
        0,
      ],
      [
        "zeroOneBfs(4, [[0,1,0],[1,2,0],[2,3,0]], 0)",
        4,
        [
          [0, 1, 0],
          [1, 2, 0],
          [2, 3, 0],
        ],
        0,
      ],
      [
        "zeroOneBfs(4, [[0,1,1],[2,3,0]], 0)",
        4,
        [
          [0, 1, 1],
          [2, 3, 0],
        ],
        0,
      ],
      [
        "zeroOneBfs(3, [[0,1,0],[1,2,0],[2,0,0]], 0)",
        3,
        [
          [0, 1, 0],
          [1, 2, 0],
          [2, 0, 0],
        ],
        0,
      ],
      ["zeroOneBfs(3, [], 1)", 3, [], 1],
      ["zeroOneBfs(1, [], 0)", 1, [], 0],
    ];
    return table(
      cases.map(([call, n, edges, s]) => [
        call,
        "→",
        show(zeroOneBfs(n, edges, s)),
      ]),
    );
  },

  /** 경계 입력이 어떤 답을 내는가. */
  edgeCases: () => {
    const cases: [string, string, number, Edge[], number][] = [
      ["정점 하나", "zeroOneBfs(1, [], 0)", 1, [], 0],
      ["간선 없음", "zeroOneBfs(3, [], 1)", 3, [], 1],
      [
        "도달 못 하는 정점",
        "zeroOneBfs(4, [[0,1,1],[2,3,0]], 0)",
        4,
        [
          [0, 1, 1],
          [2, 3, 0],
        ],
        0,
      ],
      [
        "가중치 0 사이클",
        "zeroOneBfs(3, [[0,1,0],[1,2,0],[2,0,0]], 0)",
        3,
        [
          [0, 1, 0],
          [1, 2, 0],
          [2, 0, 0],
        ],
        0,
      ],
      [
        "자기 자신으로 가는 간선",
        "zeroOneBfs(2, [[0,0,0],[0,0,1],[0,1,1]], 0)",
        2,
        [
          [0, 0, 0],
          [0, 0, 1],
          [0, 1, 1],
        ],
        0,
      ],
      [
        "같은 두 정점에 간선이 둘",
        "zeroOneBfs(2, [[0,1,1],[0,1,0]], 0)",
        2,
        [
          [0, 1, 1],
          [0, 1, 0],
        ],
        0,
      ],
      [
        "역방향으로는 못 간다",
        "zeroOneBfs(2, [[1,0,1],[0,1,0]], 1)",
        2,
        [
          [1, 0, 1],
          [0, 1, 0],
        ],
        1,
      ],
    ];
    return table(
      cases.map(([label, call, n, edges, s]) => [
        label,
        call,
        "→",
        show(zeroOneBfs(n, edges, s)),
      ]),
    );
  },

  /** 불변식을 지키던 줄을 지운 사본과 정본의 결과. */
  mutantNoFront: () =>
    table([
      ["입력", "정본", "앞에 넣는 줄을 지운 판"],
      ...MUTANT_CASES.map((c) => [
        c.label,
        show(zeroOneBfs(c.n, c.edges, 0)),
        show(noFront.zeroOneBfs(c.n, c.edges, 0)),
      ]),
    ]),

  /** 전개 입력의 비용을 무리별로 센다. */
  perfCount: () => {
    const got = orderRun(WALK_N, WALK_EDGES, 0, "deque");
    const moves = shiftMoves(WALK_N, WALK_EDGES, 0);
    return table(
      [
        ["무리", "무엇을 세는가", "횟수"],
        ["이웃 목록 만들기", "간선마다 한 번 넣는다", comma(WALK_EDGES.length)],
        [
          "덱에 넣기",
          "시작 항목 하나 + 값을 고친 횟수",
          comma(got.pushes.reduce((a, b) => a + b, 0)),
        ],
        ["덱에서 꺼내기", "넣은 만큼", comma(got.pops)],
        ["뒤집어 옮기기", "back 이 비었을 때 옮긴 원소", comma(moves.twoMoves)],
        ["간선 검사", "꺼낸 정점의 이웃 목록을 한 번씩", comma(got.scans)],
      ],
      [2],
    );
  },

  /** 최악을 만드는 입력 — 축마다 다른 모양이다. */
  worstShapes: () => {
    const shapes: [string, { n: number; edges: Edge[] }][] = [
      ["가중치 1 사슬 V=1,000", chain(1000)],
      ["별 V=1,000", star(1000)],
      ["가지 달린 두 번 그래프 k=20 d=48", twiceFan(20, 48)],
      ["두 번 그래프 k=332", twiceGraph(332)],
    ];
    const rows: string[][] = [
      [
        "모양",
        "정점 V",
        "간선 E",
        "간선 검사",
        "2E",
        "덱 동시 최대",
        "2V",
        "최대 거리",
      ],
    ];
    for (const [label, g] of shapes) {
      const got = orderRun(g.n, g.edges, 0, "deque");
      rows.push([
        label,
        comma(g.n),
        comma(g.edges.length),
        comma(got.scans),
        comma(2 * g.edges.length),
        comma(got.peak),
        comma(2 * g.n),
        comma(Math.max(...got.dist)),
      ]);
    }
    return table(rows, [1, 2, 3, 4, 5, 6, 7]);
  },

  /** 상한 2V 가 타이트한가 — 두 번 그래프의 실측과 식. */
  mathScale: () => {
    const rows: string[][] = [
      ["두 번 그래프 k", "정점 V", "간선 E", "덱에 넣은 항목", "2V − 3", "2V"],
    ];
    for (const k of [2, 5, 50, 500, 33_333]) {
      const g = twiceGraph(k);
      const got = orderRun(g.n, g.edges, 0, "deque");
      rows.push([
        comma(k),
        comma(g.n),
        comma(g.edges.length),
        comma(got.pushes.reduce((a, b) => a + b, 0)),
        comma(2 * g.n - 3),
        comma(2 * g.n),
      ]);
    }
    return table(rows, [0, 1, 2, 3, 4, 5]);
  },
};
