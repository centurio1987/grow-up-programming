/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run tools/check-proof.ts src/algorithms/tree/lowestCommonAncestor/lowestCommonAncestor-guide.md
 *
 * **세는 사본은 두 곳에 있다.** 정본은 칸을 몇 번 읽었는지도, 걸음마다의 상태도 내보내지
 * 않으므로 그 자리를 덧붙인 사본이 아니면 계수와 걸음을 낼 방법이 없다.
 *
 * - `traced`(이 파일) — 정본과 같은 절차에 걸음 기록을 덧붙인 판. 걸음마다 깊이와 2^k 조상 표
 *   전체를 베끼므로 **전개 입력처럼 작은 입력에만** 쓴다. 큰 입력에 쓰면 메모리가 모자란다.
 * - `liftCounted` · `naiveCounted` · `eulerSparse`(`-guide.alt.ts`) — 칸 접근만 세는 가벼운 판.
 *   정점 20,000 개 · 100,000 개 같은 큰 입력은 이것만 쓴다. 대조 하네스와 같은 계수 모델을 한 벌로 쓴다.
 *
 * **답이 맞는지는 사본이 아니라 정본이 진다** — 사본은 부를 때마다 자기 답을 정본과 맞대고, 어긋나면 던진다.
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { 과와, 은는, 이가 } from "../../../../tools/josa.ts";
import {
  BENCH_EDGES,
  BENCH_N,
  BENCH_QUERY_COUNTS,
  binary,
  caterpillar,
  chain,
  columns,
  type Edge,
  eulerSparse,
  liftCounted,
  naiveCounted,
  type Query,
  queries,
  star,
  twoChains,
} from "./lowestCommonAncestor-guide.alt.ts";
import { lowestCommonAncestor } from "./lowestCommonAncestor-guide.ref.ts";

const REF = new URL("./lowestCommonAncestor-guide.ref.ts", import.meta.url)
  .pathname;

/* ────────────────────────── 전개가 쓰는 입력 ────────────────────────── */

/**
 * 본문 전개가 쓰는 고정 입력. 자식이 둘인 정점(0 · 1 · 5)이 있어 「이미 지나온 정점」 검사가
 * 실제로 실행되고, 질의 넷이 갈래를 나눠 맡는다 — 깊이를 맞춘 뒤 부모가 같은 경우 · 두 칸 위에서
 * 갈라지는 경우 · 한쪽이 다른 쪽의 조상인 경우 · 처음부터 부모가 같은 경우.
 */
export const WALK_N = 9;
export const WALK_EDGES: Edge[] = [
  [0, 1],
  [0, 2],
  [1, 3],
  [1, 4],
  [2, 5],
  [3, 6],
  [5, 7],
  [5, 8],
];
export const WALK_ROOT = 0;
export const WALK_QUERIES: Query[] = [
  [6, 4],
  [6, 7],
  [3, 6],
  [8, 7],
];

/** 함께 올리기가 두 번 움직이는 입력 — 완전 이진 트리 정점 31 개. */
const BIN31_N = 31;
const BIN31 = binary(BIN31_N);
const BIN31_Q: Query = [15, 30];

/* ────────────────────────── 글자 맞춤 ────────────────────────── */

const width = (s: string): number =>
  [...s].reduce((n, c) => n + (/[ᄀ-ᇿ　-〿㄰-㆏가-힯一-鿿]/.test(c) ? 2 : 1), 0);

const pad = (s: string, to: number): string =>
  s + " ".repeat(Math.max(0, to - width(s)));

export const comma = (n: number): string => n.toLocaleString("en-US");

/** 등폭 글자 줄 — 열마다 가장 긴 칸에 맞춘다. */
function columnsText(rows: string[][], gap = "   "): string {
  const cols = Math.max(...rows.map((r) => r.length));
  const widths: number[] = [];
  for (let c = 0; c < cols; c++) {
    widths.push(Math.max(...rows.map((r) => width(r[c] ?? ""))));
  }
  return rows
    .map((r) =>
      r
        .map((cell, c) => pad(cell, widths[c] ?? 0))
        .join(gap)
        .replace(/\s+$/, ""),
    )
    .join("\n");
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

export const list = (xs: readonly (number | string)[]): string =>
  `[${xs.join(", ")}]`;
const row = (xs: readonly (number | null)[]): string =>
  xs.map((x) => (x === null ? "·" : String(x))).join(" ");
const popcount = (d: number): number =>
  (d.toString(2).match(/1/g) ?? []).length;
export const lcaText = (q: Query): string => `lca(${q[0]}, ${q[1]})`;

/** `0 ≤ d < V` 에서 이진수의 1 이 가장 많은 개수. */
function maxOnes(V: number): number {
  let m = 0;
  for (let d = 0; d < V; d++) m = Math.max(m, popcount(d));
  return m;
}

/* ────────────────── 정본과 같은 절차 — 2^k 조상 표와 질의 ────────────────── */

export interface Lifted {
  readonly LOG: number;
  readonly near: number[][];
  readonly depth: number[];
  /** `anc[v][k]` — 정본과 같은 모양이다. */
  readonly anc: number[][];
}

/** 정본과 같은 순서로 이웃 목록 · 깊이 · 2^k 조상 표를 만든다. 작은 입력에만 쓴다. */
export function lift(n: number, edges: Edge[], root: number): Lifted {
  const LOG = columns(n);
  const near: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    (near[u] as number[]).push(v);
    (near[v] as number[]).push(u);
  }
  const depth: number[] = Array.from({ length: n }, () => 0);
  const anc: number[][] = Array.from({ length: n }, () =>
    Array.from({ length: LOG }, () => root),
  );
  const seen: boolean[] = Array.from({ length: n }, () => false);
  const stack: number[] = [root];
  seen[root] = true;
  while (stack.length > 0) {
    const u = stack.pop() as number;
    for (const v of near[u] as number[]) {
      if (seen[v]) continue;
      seen[v] = true;
      depth[v] = (depth[u] as number) + 1;
      (anc[v] as number[])[0] = u;
      stack.push(v);
    }
  }
  for (let k = 1; k < LOG; k++) {
    for (let v = 0; v < n; v++) {
      const mid = (anc[v] as number[])[k - 1] as number;
      (anc[v] as number[])[k] = (anc[mid] as number[])[k - 1] as number;
    }
  }
  return { LOG, near, depth, anc };
}

export const at = (t: Lifted, v: number, k: number): number =>
  (t.anc[v] as number[])[k] as number;

/** `v` 에서 부모를 `d` 번 따라간 정점. 뿌리를 넘으면 뿌리에 머문다. */
function upBy(parent: readonly number[], v: number, d: number): number {
  let x = v;
  for (let i = 0; i < d; i++) x = parent[x] as number;
  return x;
}

const parentsOf = (t: Lifted): number[] =>
  Array.from({ length: t.depth.length }, (_, v) => at(t, v, 0));

/* ────────────────────────── 걸음 기록 ────────────────────────── */

export interface Pop {
  readonly u: number;
  readonly near: readonly number[];
  readonly skipped: readonly number[];
  readonly set: readonly number[];
  readonly stackAfter: readonly number[];
}

export interface Jump {
  readonly k: number;
  readonly from: number;
  readonly to: number;
}

export interface WalkStep {
  readonly kind: "lists" | "dfs" | "layer" | "align" | "lift";
  /** 걸음이 끝난 뒤의 깊이. 아직 안 정했으면 `null`. */
  readonly depth: readonly (number | null)[];
  /** 걸음이 끝난 뒤의 2^k 조상 표 — `layers[k][v]`. 아직 안 쌓은 층의 칸은 `null`. */
  readonly layers: readonly (readonly (number | null)[])[];
  /** 걸음이 끝난 뒤까지 낸 답. */
  readonly answers: readonly number[];
  readonly pops?: readonly Pop[];
  /** 쌓는 층 또는 함께 올리기의 자리. */
  readonly k?: number;
  /** 질의 차례(0 부터). */
  readonly q?: number;
  /** 걸음에 들어갈 때의 두 정점 — 깊이 맞추기면 질의 그대로, 함께 올리기면 그 회차의 `u` · `v`. */
  readonly uIn?: number;
  readonly vIn?: number;
  /** 걸음이 끝난 뒤의 두 정점. */
  readonly u?: number;
  readonly v?: number;
  readonly gap?: number;
  readonly jumps?: readonly Jump[];
  readonly up?: number;
  readonly vp?: number;
  readonly moved?: boolean;
  /** 이 걸음이 낸 답. */
  readonly answer?: number;
}

export interface Trace {
  readonly table: Lifted;
  readonly steps: readonly WalkStep[];
  readonly answers: readonly number[];
}

/**
 * 정본과 같은 절차를 걸음마다 기록한다. 걸음은 이웃 목록 하나 · 깊이와 부모 하나 · 층마다 하나 ·
 * 질의마다 깊이 맞추기 하나와 함께 올리기의 `k` 하나하나다. 깊이를 맞춘 자리에서 둘이 같으면
 * 그 질의는 걸음 하나로 끝난다. 부를 때마다 답을 정본과 맞댄다.
 */
export function traced(
  n: number,
  edges: Edge[],
  root: number,
  qs: Query[],
): Trace {
  const t = lift(n, edges, root);
  const steps: WalkStep[] = [];
  const empty = (): (number | null)[] => Array.from({ length: n }, () => null);
  const layersUpTo = (top: number): (number | null)[][] =>
    Array.from({ length: t.LOG }, (_, k) =>
      k <= top ? Array.from({ length: n }, (_, v) => at(t, v, k)) : empty(),
    );

  steps.push({
    kind: "lists",
    depth: empty(),
    layers: layersUpTo(-1),
    answers: [],
  });

  // 깊이와 부모 — 정본과 같은 스택 순서로 꺼낸 기록을 남긴다.
  const seen: boolean[] = Array.from({ length: n }, () => false);
  const stack: number[] = [root];
  seen[root] = true;
  const pops: Pop[] = [];
  while (stack.length > 0) {
    const u = stack.pop() as number;
    const skipped: number[] = [];
    const set: number[] = [];
    for (const v of t.near[u] as number[]) {
      if (seen[v]) {
        skipped.push(v);
        continue;
      }
      seen[v] = true;
      set.push(v);
      stack.push(v);
    }
    pops.push({
      u,
      near: [...(t.near[u] as number[])],
      skipped,
      set,
      stackAfter: [...stack],
    });
  }
  steps.push({
    kind: "dfs",
    depth: [...t.depth],
    layers: layersUpTo(0),
    answers: [],
    pops,
  });
  for (let k = 1; k < t.LOG; k++) {
    steps.push({
      kind: "layer",
      depth: [...t.depth],
      layers: layersUpTo(k),
      answers: [],
      k,
    });
  }

  const full = layersUpTo(t.LOG - 1);
  const answers: number[] = [];
  for (const [q, [a, b]] of qs.entries()) {
    let u = a;
    let v = b;
    if ((t.depth[u] as number) < (t.depth[v] as number)) {
      const swap = u;
      u = v;
      v = swap;
    }
    const gap = (t.depth[u] as number) - (t.depth[v] as number);
    const jumps: Jump[] = [];
    for (let k = 0; k < t.LOG; k++) {
      if (((gap >> k) & 1) === 1) {
        const to = at(t, u, k);
        jumps.push({ k, from: u, to });
        u = to;
      }
    }
    const early = u === v;
    if (early) answers.push(u);
    steps.push({
      kind: "align",
      depth: [...t.depth],
      layers: full,
      answers: [...answers],
      q,
      uIn: a,
      vIn: b,
      u,
      v,
      gap,
      jumps,
      ...(early ? { answer: u } : {}),
    });
    if (early) continue;
    for (let k = t.LOG - 1; k >= 0; k--) {
      const up = at(t, u, k);
      const vp = at(t, v, k);
      const moved = up !== vp;
      const uIn = u;
      const vIn = v;
      if (moved) {
        u = up;
        v = vp;
      }
      const last = k === 0;
      if (last) answers.push(at(t, u, 0));
      steps.push({
        kind: "lift",
        depth: [...t.depth],
        layers: full,
        answers: [...answers],
        q,
        k,
        uIn,
        vIn,
        u,
        v,
        up,
        vp,
        moved,
        ...(last ? { answer: at(t, u, 0) } : {}),
      });
    }
  }

  const want = lowestCommonAncestor(n, edges, root, qs);
  if (want.length !== answers.length || want.some((x, i) => x !== answers[i])) {
    throw new Error("걸음 기록의 답이 정본과 어긋난다");
  }
  return { table: t, steps, answers };
}

export const WALK = traced(WALK_N, WALK_EDGES, WALK_ROOT, WALK_QUERIES);
export const stepOf = (i: number): string => `T${i + 1}`;
export const WALK_TABLE = WALK.table;

/** 질의 `q` 의 걸음 번호 범위. */
export function queryRange(q: number): string {
  const ids = WALK.steps.flatMap((s, i) => (s.q === q ? [stepOf(i)] : []));
  return ids.length === 1 ? (ids[0] as string) : `${ids[0]}~${ids.at(-1)}`;
}

/* ────────────────────────── 변이 ────────────────────────── */

type Ref = {
  lowestCommonAncestor: (
    n: number,
    edges: Edge[],
    root: number,
    qs: Query[],
  ) => number[];
};

/** 깊이를 맞춘 뒤의 같음 검사를 지운 판. 조상·자손 질의에서 답의 부모가 나온다. */
const noEarlyReturn = (): Promise<Ref> =>
  loadMutant<Ref>(REF, { drop: /^\s*if \(u === v\) return u;$/ });

/** 함께 올리기의 `k` 를 작은 쪽에서 큰 쪽으로 올린 판. */
const ascendingK = (): Promise<Ref> =>
  loadMutant<Ref>(REF, {
    swap: [
      /for \(let k = LOG - 1; k >= 0; k--\) \{/,
      "for (let k = 0; k < LOG; k++) {",
    ],
  });

/** 층 수를 30 으로 박은 판. 답은 그대로이고 2^k 조상 표만 커진다. */
const fixedLog = (): Promise<Ref> =>
  loadMutant<Ref>(REF, {
    swap: [
      /const LOG = Math\.floor\(Math\.log2\(Math\.max\(n, 1\)\)\) \+ 1;/,
      "const LOG = 30;",
    ],
  });

const NO_EARLY = await noEarlyReturn();
const ASCENDING = await ascendingK();
const BIG_LOG = await fixedLog();

/** 변이와 정본에 똑같이 걸 입력 넷. */
const FOUR: [string, number, Edge[], number, Query[]][] = [
  ["전개 입력(정점 아홉)", WALK_N, WALK_EDGES, WALK_ROOT, WALK_QUERIES],
  [
    "한 줄로 이은 네 정점 · 조상과 자손만 묻는다",
    4,
    chain(4),
    0,
    [
      [0, 3],
      [1, 3],
      [2, 2],
    ],
  ],
  [
    "완전 이진 트리 정점 15 개",
    15,
    binary(15),
    0,
    [
      [7, 8],
      [7, 14],
      [11, 13],
      [3, 12],
    ],
  ],
  ["정점 하나", 1, [], 0, [[0, 0]]],
];

/** 변이 표 — 입력 넷에 정본과 변이를 나란히 걸고 두 답을 비교한다. */
function mutantTable(mod: Ref, label: string): string {
  const neutral = mod.lowestCommonAncestor === lowestCommonAncestor;
  const rows = FOUR.map(([name, n, e, root, qs]) => {
    const a = lowestCommonAncestor(n, e, root, qs);
    const b = mod.lowestCommonAncestor(n, e, root, qs);
    const same = a.length === b.length && a.every((x, i) => x === b[i]);
    return [name, list(a), list(b), same ? "같다" : "어긋난다"];
  });
  if (!neutral && rows.every((r) => r[3] === "같다")) {
    throw new Error("변이가 답을 안 바꿨다");
  }
  return md(["입력", "정본", label, "두 답"], rows);
}

/* ────────────────────────── 전체 컨셉 ────────────────────────── */

/** 자기 자신부터 뿌리까지의 조상. */
export function ancestorsOf(t: Lifted, v: number): number[] {
  const out = [v];
  let x = v;
  while (x !== WALK_ROOT) {
    x = at(t, x, 0);
    out.push(x);
  }
  return out;
}

function conceptAncestors(): string {
  const [a, b] = WALK_QUERIES[0] as Query;
  const A = ancestorsOf(WALK_TABLE, a);
  const B = ancestorsOf(WALK_TABLE, b);
  const shared = A.filter((x) => B.includes(x));
  const deepest = shared.reduce((p, x) =>
    (WALK_TABLE.depth[x] as number) > (WALK_TABLE.depth[p] as number) ? x : p,
  );
  const ref = lowestCommonAncestor(WALK_N, WALK_EDGES, WALK_ROOT, [[a, b]]);
  if (ref[0] !== deepest) throw new Error("조상 목록의 답이 정본과 다르다");
  return [
    md(
      ["정점", "깊이", "자기부터 뿌리까지의 조상"],
      [
        [String(a), String(WALK_TABLE.depth[a]), A.join(" → ")],
        [String(b), String(WALK_TABLE.depth[b]), B.join(" → ")],
      ],
      [0, 1],
    ),
    "",
    `두 목록에 함께 든 조상은 ${shared.join(" · ")} 이고, 그중 깊이가 가장 큰 정점 ${deepest}${이가(deepest)} lca(${a}, ${b}) 입니다. 정본을 실행한 답도 ${ref[0]} 입니다.`,
  ].join("\n");
}

/* ───────────────────── 아이디어를 떠올리는 과정 ───────────────────── */

/** 한 칸씩 오르기와 2^k 조상 표 — 사슬의 두 끝을 묻는 질의로 잰다. */
function naiveScale(): string {
  const rows: string[][] = [];
  let top = { naive: 0, lift: 0 };
  for (const v of [9, 100, 1_000, 10_000, 100_000]) {
    const edges = chain(v);
    const q: Query[] = [[0, v - 1]];
    const nv = naiveCounted(v, edges, 0, q);
    const lf = liftCounted(v, edges, 0, q);
    // 같은 질의를 V 번 물은 합 — 질의가 모두 같으므로 질의 하나의 칸 수에 V 를 곱한다.
    // 작은 규모에서는 실제로 V 번 물어 그 곱과 같은지 확인한다.
    const naiveAll = nv.setup + nv.query * v;
    const liftAll = lf.setup + lf.query * v;
    if (v <= 1_000) {
      const many: Query[] = Array.from({ length: v }, () => [0, v - 1]);
      const a = naiveCounted(v, edges, 0, many);
      const b = liftCounted(v, edges, 0, many);
      if (a.setup + a.query !== naiveAll || b.setup + b.query !== liftAll) {
        throw new Error("질의 V 번의 합이 곱과 다르다");
      }
    }
    rows.push([
      comma(v),
      comma(nv.query),
      comma(naiveAll),
      `${(naiveAll / 1e8).toFixed(1)} 초`,
      comma(lf.query),
      comma(liftAll),
    ]);
    top = { naive: naiveAll, lift: liftAll };
  }
  return [
    md(
      [
        "사슬 정점 V",
        "한 칸씩 · 질의 하나",
        "한 칸씩 · 질의 V 개",
        "그 시간(초당 1 억 칸)",
        "2^k 조상 표 · 질의 하나",
        "2^k 조상 표 · 질의 V 개",
      ],
      rows,
      [0, 1, 2, 3, 4, 5],
    ),
    "",
    `질의는 사슬의 두 끝 (0, V − 1) 이고, 질의 V 개 칸은 그 질의를 V 번 물은 합에 깊이와 부모를 정하는 준비 칸을 더한 값입니다. 정점 1,000 개까지는 실제로 V 번 물어 같은 값을 얻었고, 그보다 큰 두 줄은 질의 하나의 칸 수에 V 를 곱했습니다. 규모 상한 줄에서 한 칸씩 오르면 ${comma(top.naive)} 칸이고, 2^k 조상 표는 ${comma(top.lift)} 칸입니다.`,
  ].join("\n");
}

/** 사슬 64 개에서 쓰는 2^k 조상 표. */
const CHAIN64 = lift(64, chain(64), 0);

/** 1 · 2 · 4 칸 위를 적어 두었을 때 63 에서 5 칸 오르기. */
function jumpSmall(): string {
  const d = 5;
  const from = 63;
  const rows: string[][] = [["시작", String(from), ""]];
  let x = from;
  for (let k = 0; k < CHAIN64.LOG; k++) {
    if (((d >> k) & 1) === 0) continue;
    const to = at(CHAIN64, x, k);
    rows.push([
      `${2 ** k} 칸 위로`,
      `anc[${x}][${k}] = ${to}`,
      `${d} 의 이진수 ${d.toString(2)} 에서 ${k} 번 자리가 1`,
    ]);
    x = to;
  }
  const check = upBy(parentsOf(CHAIN64), from, d);
  rows.push([
    "도착",
    String(x),
    `부모를 ${d} 번 따라간 정점 ${check}${과와(check)} ${x === check ? "같은 자리" : "다른 자리"} · 읽은 칸 ${popcount(d)} 개`,
  ]);
  return columnsText(rows);
}

/** 거리 `d` 를 두 방식으로 오를 때 읽는 칸 접근. */
function climbCells(d: number): { step: number; jump: number } {
  const parent = parentsOf(CHAIN64);
  let step = 0;
  let x = 63;
  for (let i = 0; i < d; i++) {
    x = parent[x] as number;
    step += 1;
  }
  let y = 63;
  let jump = 0;
  for (let k = 0; k < CHAIN64.LOG; k++) {
    if (((d >> k) & 1) === 1) {
      y = at(CHAIN64, y, k);
      jump += 1;
    }
  }
  if (x !== y) throw new Error("두 방식이 다른 정점에 도착했다");
  return { step, jump };
}

function jumpVsStep(): string {
  const ds = [1, 2, 5, 7, 16, 31, 63];
  const rows = ds.map((d) => {
    const c = climbCells(d);
    return [comma(d), d.toString(2), comma(c.step), comma(c.jump)];
  });
  const same = ds.every((d) => climbCells(d).jump === popcount(d));
  return [
    md(
      [
        "거리 d",
        "d 의 이진수",
        "한 칸씩 오르는 칸 접근",
        "2^k 칸씩 뛰는 칸 접근",
      ],
      rows,
      [0, 2, 3],
    ),
    "",
    `정점 64 개를 한 줄로 이은 사슬의 정점 63 에서 d 칸 위 조상을 찾았고, 두 방식이 도착한 정점은 ${ds.length} 줄 모두 같습니다. 오른쪽 칸은 ${ds.length} 줄 ${same ? "모두" : "모두는 아니게"} d 를 이진수로 적었을 때의 1 의 개수와 같습니다.`,
  ].join("\n");
}

/** 적어 둘 거리를 셋으로 잡아 추가 칸과 읽는 칸을 비교한다. */
function candidates(): string {
  const V = 100_000;
  const LOG = columns(V);
  const cellsIn256 = (256 * 1024 * 1024) / 4;
  const rows: string[][] = [
    ["부모 하나", "1", comma(V), comma(V - 1)],
    ["1 칸부터 V − 1 칸 위까지 전부", comma(V - 1), comma(V * (V - 1)), "1"],
    ["1 · 2 · 4 · 8 … 칸 위", comma(LOG), comma(V * LOG), comma(maxOnes(V))],
  ];
  return [
    md(
      [
        "정점마다 적어 두는 조상",
        "정점마다 추가 칸",
        "V = 100,000 의 추가 칸",
        "d 칸 위를 찾는 칸 접근(가장 많을 때)",
      ],
      rows,
      [1, 2, 3],
    ),
    "",
    `추가 칸 하나를 4 바이트로 치면 256 MB 에는 ${comma(cellsIn256)} 칸이 들어갑니다. 가운데 줄은 그 ${Math.round((V * (V - 1)) / cellsIn256)} 배쯤이고, 셋째 줄은 ${comma(V * LOG)} 칸입니다.`,
  ].join("\n");
}

/* ─────────────────────── 아이디어 상세 — 개념 ─────────────────────── */

/** 칸 읽는 법에 쓰는 칸들. 그림도 같은 칸을 쓴다. */
export const READ_CELLS: [number, number][] = [
  [6, 0],
  [6, 1],
  [7, 1],
  [6, 2],
  [8, 3],
];

function tableRead(): string {
  const parent = parentsOf(WALK_TABLE);
  let ok = 0;
  const rows = READ_CELLS.map(([v, k]) => {
    const steps = 2 ** k;
    const path = [v];
    let x = v;
    let clamped = false;
    for (let i = 0; i < steps; i++) {
      if (x === WALK_ROOT) {
        clamped = true;
        break;
      }
      x = parent[x] as number;
      path.push(x);
    }
    const value = at(WALK_TABLE, v, k);
    if (value === x) ok += 1;
    return [
      `anc[${v}][${k}]`,
      `${k} 층 · ${v} 의 ${steps} 칸 위`,
      `${path.join(" → ")}${clamped ? " (뿌리에서 멈춘다)" : ""}`,
      String(value),
    ];
  });
  return [
    md(["칸", "뜻", "부모를 따라간 길", "적힌 값"], rows, [3]),
    "",
    `칸 ${READ_CELLS.length} 개 가운데 적힌 값이 부모를 따라간 길의 끝과 같은 칸은 ${ok} 개입니다.`,
  ].join("\n");
}

function tableRelation(): string {
  const t = WALK_TABLE;
  const parent = parentsOf(t);
  const count = { def: [0, 0], rec: [0, 0], root: [0, 0], depth: [0, 0] };
  const tick = (c: number[], good: boolean) => {
    c[0] = (c[0] as number) + 1;
    if (good) c[1] = (c[1] as number) + 1;
  };
  for (let k = 0; k < t.LOG; k++) {
    for (let v = 0; v < WALK_N; v++) {
      const value = at(t, v, k);
      tick(count.def, value === upBy(parent, v, 2 ** k));
      if (k >= 1) tick(count.rec, value === at(t, at(t, v, k - 1), k - 1));
      const d = t.depth[v] as number;
      if (d < 2 ** k) tick(count.root, value === WALK_ROOT);
      else tick(count.depth, (t.depth[value] as number) === d - 2 ** k);
    }
  }
  const line = (label: string, c: number[]): string[] => [
    label,
    comma(c[0] as number),
    comma((c[0] as number) - (c[1] as number)),
  ];
  const bad = [count.def, count.rec, count.root, count.depth].reduce(
    (n, c) => n + (c[0] as number) - (c[1] as number),
    0,
  );
  return [
    md(
      ["관계", "확인한 칸", "어긋난 칸"],
      [
        line(
          "k 층의 칸 v 는 v 에서 부모를 2^k 번 따라간 정점이다(뿌리를 넘으면 뿌리)",
          count.def,
        ),
        line(
          "k 층의 칸 v 는 k − 1 층에서 두 번 따라간 값이다 — anc[anc[v][k−1]][k−1]",
          count.rec,
        ),
        line("깊이가 2^k 보다 작은 정점의 k 층 칸은 뿌리다", count.root),
        line(
          "깊이가 2^k 이상인 정점의 k 층 칸은 깊이가 정확히 2^k 작다",
          count.depth,
        ),
      ],
      [1, 2],
    ),
    "",
    `2^k 조상 표 ${t.LOG} 층 · 칸 ${comma(WALK_N * t.LOG)} 개에서 관계 4 개를 쟀고, 어긋난 칸은 ${bad} 개입니다.`,
  ].join("\n");
}

/** 층 수가 같은 두 모양과 모든 거리를 적은 모양을 사슬에서 비교한다. */
function tableVsOthers(): string {
  const rowsFor = (V: number): string[][] => {
    const LOG = columns(V);
    return [
      [
        comma(V),
        "1 · 2 · 4 · … · 2^(LOG−1)",
        comma(LOG),
        comma(V * LOG),
        comma(maxOnes(V)),
      ],
      [
        comma(V),
        `1 · 2 · 3 · … · ${LOG}`,
        comma(LOG),
        comma(V * LOG),
        comma(Math.ceil((V - 1) / LOG)),
      ],
      [
        comma(V),
        `1 · 2 · 3 · … · ${comma(V - 1)}`,
        comma(V - 1),
        comma(V * (V - 1)),
        "1",
      ],
    ];
  };
  // 작은 사슬에서는 층 수가 같은 등차 모양을 실제로 올라가 본다 — 큰 거리부터 되는 대로 뛴다.
  const V = 64;
  const LOG = columns(V);
  let worstArith = 0;
  for (let d = 0; d < V; d++) {
    let left = d;
    let reads = 0;
    for (let s = LOG; s >= 1 && left > 0; s--) {
      while (left >= s) {
        left -= s;
        reads += 1;
      }
    }
    worstArith = Math.max(worstArith, reads);
  }
  if (worstArith !== Math.ceil((V - 1) / LOG)) {
    throw new Error("등차 모양의 가장 많은 읽기가 식과 다르다");
  }
  const big = 100_000;
  return [
    md(
      [
        "사슬 정점 V",
        "층마다 적는 거리(칸 위)",
        "층 수",
        "추가 칸",
        "d 칸 위를 찾는 칸 접근(가장 많을 때)",
      ],
      [...rowsFor(V), ...rowsFor(big)],
      [0, 2, 3, 4],
    ),
    "",
    `둘째 모양은 큰 거리부터 되는 대로 뛰었고, 정점 64 개에서 d = 0 부터 63 까지 실제로 올라가 가장 많이 읽은 칸이 ${worstArith} 개였습니다. 층 수가 같은 두 모양의 추가 칸은 같고, 읽는 칸은 정점 100,000 개에서 ${comma(maxOnes(big))} 대 ${comma(Math.ceil((big - 1) / columns(big)))} 입니다.`,
  ].join("\n");
}

/* ─────────────────────── 아이디어 상세 — 단계 ─────────────────────── */

function buildDfs(): string {
  const s = WALK.steps[1] as WalkStep;
  const pops = s.pops ?? [];
  const rows = pops.map((p) => [
    String(p.u),
    list(p.near),
    p.skipped.length === 0 ? "—" : p.skipped.join(" · "),
    p.set.length === 0
      ? "—"
      : p.set
          .map((v) => `depth[${v}] = ${s.depth[v]} · anc[${v}][0] = ${p.u}`)
          .join(" / "),
    list(p.stackAfter),
  ]);
  const items = pops.reduce((n, p) => n + p.near.length, 0);
  const skipped = pops.reduce((n, p) => n + p.skipped.length, 0);
  const parentSkips = pops.reduce(
    (n, p) => n + p.skipped.filter((v) => at(WALK_TABLE, p.u, 0) === v).length,
    0,
  );
  return [
    md(
      ["꺼낸 정점 u", "near[u]", "건너뛴 이웃", "새로 정한 것", "그 뒤 stack"],
      rows,
    ),
    "",
    `정점 ${pops.length} 개를 한 번씩 꺼냈고, 이웃 항목 ${items} 개 가운데 건너뛴 것이 ${skipped} 개입니다. 건너뛴 ${skipped} 개 가운데 꺼낸 정점의 부모인 것은 ${parentSkips} 개입니다.`,
  ].join("\n");
}

function buildLayers(): string {
  const t = WALK_TABLE;
  const rows: string[][] = [];
  let clampedAll = 0;
  for (let k = 0; k < t.LOG; k++) {
    const vals = Array.from({ length: WALK_N }, (_, v) => at(t, v, k));
    const clamped = Array.from({ length: WALK_N }, (_, v) => v).filter(
      (v) => v !== WALK_ROOT && (t.depth[v] as number) < 2 ** k,
    ).length;
    if (k > 0) clampedAll += clamped;
    rows.push([
      `${k} 층`,
      `${2 ** k} 칸 위`,
      vals.join(" "),
      k === 0 ? "—" : comma(clamped),
    ]);
  }
  return [
    md(
      [
        "층",
        "칸이 적는 조상",
        "정점 0 ~ 8 의 칸",
        "뿌리를 넘어 뿌리로 둔 칸(뿌리 자신 빼고)",
      ],
      rows,
      [3],
    ),
    "",
    `1 층부터 ${t.LOG - 1} 층까지 채운 칸은 ${comma(WALK_N * (t.LOG - 1))} 개이고, 그중 뿌리를 넘어 뿌리로 둔 칸은 ${clampedAll} 개입니다.`,
  ].join("\n");
}

/** 깊이 맞추기를 질의 여섯에 실행한다. */
const ALIGN_QS: Query[] = [...WALK_QUERIES, [6, 0], [7, 1]];

function buildAlign(): string {
  const t = WALK_TABLE;
  const rows = ALIGN_QS.map(([a, b]) => {
    let u = a;
    let v = b;
    if ((t.depth[u] as number) < (t.depth[v] as number)) {
      const swap = u;
      u = v;
      v = swap;
    }
    const deep = u;
    const gap = (t.depth[u] as number) - (t.depth[v] as number);
    const jumps: string[] = [];
    for (let k = 0; k < t.LOG; k++) {
      if (((gap >> k) & 1) === 1) {
        const to = at(t, u, k);
        jumps.push(`anc[${u}][${k}] = ${to}`);
        u = to;
      }
    }
    return [
      lcaText([a, b]),
      `${deep} · ${v}`,
      `${gap} (${gap.toString(2)})`,
      jumps.length === 0 ? "—" : jumps.join(" → "),
      `${u} · ${v}`,
      u === v ? "u = v" : "u ≠ v",
    ];
  });
  const ref = lowestCommonAncestor(WALK_N, WALK_EDGES, WALK_ROOT, ALIGN_QS);
  const early = ALIGN_QS.flatMap((q, i) =>
    rows[i]?.[5] === "u = v" ? [`${lcaText(q)} = ${ref[i]}`] : [],
  );
  return [
    md(
      [
        "질의",
        "깊은 쪽 u · 얕은 쪽 v",
        "gap (이진수)",
        "켜진 자리마다 읽은 칸",
        "맞춘 뒤 u · v",
        "두 정점",
      ],
      rows,
    ),
    "",
    `질의 ${ALIGN_QS.length} 개 가운데 깊이를 맞춘 자리에서 두 정점이 같아진 것은 ${early.length} 개이고, 그 질의의 정본 답은 ${early.join(" · ")} 입니다.`,
  ].join("\n");
}

/** 함께 올리기를 `k` 마다 적는다. */
function liftRows(t: Lifted, q: Query, label: string): string[][] {
  let u = q[0];
  let v = q[1];
  if ((t.depth[u] as number) < (t.depth[v] as number)) {
    const swap = u;
    u = v;
    v = swap;
  }
  const gap = (t.depth[u] as number) - (t.depth[v] as number);
  for (let k = 0; k < t.LOG; k++) {
    if (((gap >> k) & 1) === 1) u = at(t, u, k);
  }
  const rows: string[][] = [];
  for (let k = t.LOG - 1; k >= 0; k--) {
    const up = at(t, u, k);
    const vp = at(t, v, k);
    const moved = up !== vp;
    rows.push([
      label,
      `k = ${k} · ${2 ** k} 칸 위`,
      `anc[${u}][${k}] = ${up} · anc[${v}][${k}] = ${vp}`,
      moved ? "≠ → 둘 다 올린다" : "= → 그대로 둔다",
      moved ? `${up} · ${vp}` : `${u} · ${v}`,
    ]);
    if (moved) {
      u = up;
      v = vp;
    }
  }
  rows.push([label, "끝", `anc[${u}][0] = ${at(t, u, 0)}`, "답", "—"]);
  return rows;
}

export const BIN31_T = lift(BIN31_N, BIN31, 0);

function buildLift(): string {
  const q1 = WALK_QUERIES[1] as Query;
  const rows = [
    ...liftRows(WALK_TABLE, q1, `전개 입력 ${lcaText(q1)}`),
    ...liftRows(BIN31_T, BIN31_Q, `완전 이진 트리 31 ${lcaText(BIN31_Q)}`),
  ];
  const ref1 = lowestCommonAncestor(WALK_N, WALK_EDGES, WALK_ROOT, [
    q1,
  ])[0] as number;
  const ref2 = lowestCommonAncestor(BIN31_N, BIN31, 0, [BIN31_Q])[0] as number;
  const moves = rows.filter((r) => r[3]?.startsWith("≠")).length;
  return [
    md(["질의", "회차", "두 조상", "비교", "그 뒤 u · v"], rows),
    "",
    `두 질의에서 둘 다 올린 회차는 모두 ${moves} 번이고, 끝에서 읽은 부모는 정본의 답 ${ref1} · ${ref2}${과와(ref2)} 같습니다.`,
  ].join("\n");
}

/** 전제 — 이어지지 않은 입력과 뿌리를 바꾼 입력. */
function premise(): string {
  const cases: [string, number, Edge[], number, Query][] = [
    [
      "간선 [0,1] · [2,3] — 둘로 떨어진 그래프",
      4,
      [
        [0, 1],
        [2, 3],
      ],
      0,
      [2, 3],
    ],
    ["한 줄로 이은 네 정점", 4, chain(4), 0, [0, 3]],
    ["한 줄로 이은 네 정점", 4, chain(4), 2, [0, 3]],
  ];
  const rows = cases.map(([name, n, e, root, q]) => {
    const got = lowestCommonAncestor(n, e, root, [q])[0] as number;
    // 조상 목록으로 직접 구한다. 뿌리에서 이어지지 않는 정점은 조상 목록이 없다.
    const near: number[][] = Array.from({ length: n }, () => []);
    for (const [a, b] of e) {
      (near[a] as number[]).push(b);
      (near[b] as number[]).push(a);
    }
    const par: (number | null)[] = Array.from({ length: n }, () => null);
    const reach = new Set([root]);
    const queue = [root];
    while (queue.length > 0) {
      const x = queue.shift() as number;
      for (const y of near[x] as number[]) {
        if (reach.has(y)) continue;
        reach.add(y);
        par[y] = x;
        queue.push(y);
      }
    }
    const chainUp = (v: number): number[] => {
      const out = [v];
      let x = v;
      while (par[x] !== null && par[x] !== undefined) {
        x = par[x] as number;
        out.push(x);
      }
      return out;
    };
    let truth: string;
    if (!reach.has(q[0]) || !reach.has(q[1])) {
      truth = `없음 — 뿌리 ${root} 에서 이어지지 않는다`;
    } else {
      const B = new Set(chainUp(q[1]));
      truth = String(chainUp(q[0]).find((x) => B.has(x)));
    }
    return [name, String(root), lcaText(q), String(got), truth];
  });
  return md(
    ["입력", "뿌리", "질의", "정본의 답", "조상 목록으로 구한 답"],
    rows,
    [1, 3],
  );
}

/* ─────────────────────── 밑 고르기 ─────────────────────── */

/** `0 ≤ d ≤ limit` 을 밑수 `B` 로 적었을 때 자리 수. */
function baseColumns(limit: number, B: number): number {
  let k = 0;
  let p = 1;
  while (p <= limit) {
    p *= B;
    k += 1;
  }
  return Math.max(k, 1);
}

/** `0 ≤ d ≤ limit` 중 밑수 `B` 자릿수 합의 최댓값 — 깊이를 맞출 때 가장 많이 읽는 칸. */
function baseMaxJumps(limit: number, B: number): number {
  let best = 0;
  for (let d = 0; d <= limit; d++) {
    let sum = 0;
    let x = d;
    while (x > 0) {
      sum += x % B;
      x = Math.floor(x / B);
    }
    if (sum > best) best = sum;
  }
  return best;
}

function baseSweep(): string {
  const n = 100_000;
  const rows: string[][] = [];
  const got: [number, number, number][] = [];
  for (const B of [2, 3, 4, 8, 16]) {
    const K = baseColumns(n - 1, B);
    const J = baseMaxJumps(n - 1, B);
    got.push([B, K, J]);
    rows.push([
      `${B} 의 거듭제곱`,
      comma(K),
      comma(J),
      comma(K + J),
      comma(Math.max(K, J)),
    ]);
  }
  const bySum = got.reduce((p, x) => (x[1] + x[2] < p[1] + p[2] ? x : p));
  const byMax = got.reduce((p, x) =>
    Math.max(x[1], x[2]) < Math.max(p[1], p[2]) ? x : p,
  );
  return [
    md(
      [
        "층마다 적는 거리",
        "층 수 K(정점마다 추가 칸)",
        "깊이 맞추기의 가장 많은 읽기 J",
        "K + J",
        "둘 중 큰 쪽",
      ],
      rows,
      [1, 2, 3, 4],
    ),
    "",
    `정점 100,000 개 기준입니다. K + J 가 가장 작은 것은 ${bySum[0]} 의 거듭제곱으로 ${bySum[1] + bySum[2]} 이고, 둘 중 큰 쪽이 가장 작은 것은 ${byMax[0]} 의 거듭제곱으로 ${Math.max(byMax[1], byMax[2])} 입니다.`,
  ].join("\n");
}

/* ───────────────────── 수행으로 알아보는 알고리즘 ───────────────────── */

function walkInput(): string {
  const ans = lowestCommonAncestor(WALK_N, WALK_EDGES, WALK_ROOT, WALK_QUERIES);
  return [
    `const n = ${WALK_N};`,
    "const edges: [number, number][] = [",
    `  ${WALK_EDGES.map(([u, v]) => `[${u}, ${v}]`).join(", ")},`,
    "];",
    `const root = ${WALK_ROOT};`,
    `const queries: [number, number][] = [${WALK_QUERIES.map(([u, v]) => `[${u}, ${v}]`).join(", ")}];`,
    `// 이 절이 끝나면 ${list(ans)}${이가(ans.at(-1) as number)} 나와야 한다`,
  ].join("\n");
}

function walkT1T2(): string {
  const t = WALK_TABLE;
  const s = WALK.steps[1] as WalkStep;
  const total = t.near.reduce((n, l) => n + l.length, 0);
  const lines: string[][] = t.near.map((l, u) => [
    u === 0 ? stepOf(0) : "",
    `near[${u}] = ${list(l)}`,
  ]);
  lines.push([
    "",
    `목록 길이의 합 ${total} = 간선 ${WALK_EDGES.length} 개 × 2`,
  ]);
  lines.push([
    stepOf(1),
    `꺼낸 차례   ${(s.pops ?? []).map((p) => p.u).join(" ")}`,
  ]);
  lines.push(["", `depth[·]    ${row(s.depth)}`]);
  lines.push(["", `anc[·][0]   ${row(s.layers[0] ?? [])}`]);
  return columnsText(lines);
}

function walkLayers(): string {
  const lines: string[][] = [];
  for (const [i, s] of WALK.steps.entries()) {
    if (s.kind !== "layer") continue;
    const k = s.k as number;
    const mid = at(WALK_TABLE, 6, k - 1);
    lines.push([
      stepOf(i),
      `${k} 층(${2 ** k} 칸 위)`,
      `anc[·][${k}] = ${row(s.layers[k] ?? [])}`,
      `anc[6][${k}] = anc[${mid}][${k - 1}] = ${at(WALK_TABLE, 6, k)}`,
    ]);
  }
  return columnsText(lines);
}

function walkAlign(): string {
  const t = WALK_TABLE;
  const lines: string[][] = [];
  for (const [i, s] of WALK.steps.entries()) {
    if (s.kind !== "align") continue;
    const q = WALK_QUERIES[s.q as number] as Query;
    const deep =
      (t.depth[q[0]] as number) >= (t.depth[q[1]] as number) ? q[0] : q[1];
    const shallow = deep === q[0] ? q[1] : q[0];
    const jumps = (s.jumps ?? []).map(
      (j) => `anc[${j.from}][${j.k}] = ${j.to}`,
    );
    lines.push([
      stepOf(i),
      lcaText(q),
      `depth[${deep}] = ${t.depth[deep]} · depth[${shallow}] = ${t.depth[shallow]} → gap = ${s.gap} (${(s.gap as number).toString(2)})`,
      jumps.length === 0 ? "읽은 칸 없음" : jumps.join(" → "),
      `u = ${s.u} · v = ${s.v}${s.answer !== undefined ? ` → u = v 라 답 ${s.answer}` : " → u ≠ v"}`,
    ]);
  }
  return columnsText(lines);
}

function mutantNoEarly(): string {
  return mutantTable(NO_EARLY, "같음 검사를 지운 판");
}

/** 같음 검사가 없을 때 lca(3, 6) 이 지나는 길. 변이가 낸 답과 맞댄다. */
function noEarlyTrace(): string {
  const q = WALK_QUERIES[2] as Query;
  const t = WALK_TABLE;
  let u = (t.depth[q[0]] as number) >= (t.depth[q[1]] as number) ? q[0] : q[1];
  const v = u === q[0] ? q[1] : q[0];
  const gap = (t.depth[u] as number) - (t.depth[v] as number);
  for (let k = 0; k < t.LOG; k++) if (((gap >> k) & 1) === 1) u = at(t, u, k);
  const lines: string[][] = [
    ["깊이를 맞춘 뒤", `u = ${u} · v = ${v}`, "검사가 없어 함께 올리기로 간다"],
  ];
  let uu = u;
  let vv = v;
  for (let k = t.LOG - 1; k >= 0; k--) {
    const up = at(t, uu, k);
    const vp = at(t, vv, k);
    lines.push([
      `k = ${k}`,
      `anc[${uu}][${k}] = ${up} · anc[${vv}][${k}] = ${vp}`,
      up === vp ? "= 이라 그대로" : "≠ 라 올린다",
    ]);
    if (up !== vp) {
      uu = up;
      vv = vp;
    }
  }
  const got = NO_EARLY.lowestCommonAncestor(WALK_N, WALK_EDGES, WALK_ROOT, [
    q,
  ])[0];
  lines.push([
    "끝",
    `anc[${uu}][0] = ${at(t, uu, 0)}`,
    `변이의 답 ${got} · 정본의 답 ${u}`,
  ]);
  return columnsText(lines);
}

function walkLift(): string {
  const lines: string[][] = [];
  for (const [i, s] of WALK.steps.entries()) {
    if (s.q !== 1) continue;
    if (s.kind === "align") {
      lines.push([
        stepOf(i),
        "깊이 맞추기",
        `gap = ${s.gap} → u = ${s.u} · v = ${s.v}`,
        "",
      ]);
      continue;
    }
    const k = s.k as number;
    lines.push([
      stepOf(i),
      `k = ${k} (${2 ** k} 칸 위)`,
      `anc[${s.uIn}][${k}] = ${s.up} · anc[${s.vIn}][${k}] = ${s.vp}`,
      `${s.moved ? `≠ → u = ${s.u} · v = ${s.v} ⑤` : "= → 그대로"}${s.answer !== undefined ? ` · 답 anc[${s.u}][0] = ${s.answer}` : ""}`,
    ]);
  }
  return columnsText(lines);
}

/** 걸음 하나가 하는 일. 걸음 재생 패널의 제목도 이것을 쓴다. */
export function stepDoing(i: number): string {
  const s = WALK.steps[i] as WalkStep;
  if (s.kind === "lists") return "간선 목록을 이웃 목록으로 옮긴다";
  if (s.kind === "dfs") return "뿌리에서 따라가 깊이와 0 층(부모)을 정한다";
  if (s.kind === "layer") {
    const k = s.k as number;
    return `${k} 층(${2 ** k} 칸 위)을 ${k - 1} 층으로 쌓는다`;
  }
  const q = WALK_QUERIES[s.q as number] as Query;
  if (s.kind === "align") return `${lcaText(q)} 깊이를 맞춘다`;
  const k = s.k as number;
  return `${lcaText(q)} k = ${k} · ${2 ** k} 칸 위를 비교한다`;
}

/** 걸음 하나의 조건 판정과 실행된 갈래. */
export function stepJudge(i: number): { judge: string; marks: string[] } {
  const s = WALK.steps[i] as WalkStep;
  if (s.kind === "lists") return { judge: "—", marks: [] };
  if (s.kind === "dfs") {
    const skipped = (s.pops ?? []).reduce((n, p) => n + p.skipped.length, 0);
    return { judge: `이미 본 이웃 ${skipped} 번 건너뜀`, marks: ["①"] };
  }
  if (s.kind === "layer") {
    return { judge: `칸 ${WALK_N} 개를 씀`, marks: ["②"] };
  }
  if (s.kind === "align") {
    const jumps = s.jumps ?? [];
    const marks = ["③"];
    if (s.answer !== undefined) marks.push("④");
    return {
      judge: `gap = ${s.gap}${jumps.length > 0 ? ` · ${jumps.map((j) => `anc[${j.from}][${j.k}] = ${j.to}`).join(" · ")}` : ""} · u ${s.u === s.v ? "=" : "≠"} v`,
      marks,
    };
  }
  const k = s.k as number;
  return {
    judge: `anc[${s.uIn}][${k}] = ${s.up} ${s.moved ? "≠" : "="} anc[${s.vIn}][${k}] = ${s.vp}`,
    marks: s.moved ? ["⑤"] : [],
  };
}

function walkTrace(): string {
  const rows = WALK.steps.map((s, i) => {
    const j = stepJudge(i);
    return [
      stepOf(i),
      stepDoing(i),
      j.judge,
      j.marks.length === 0 ? "—" : j.marks.join(" "),
      s.u === undefined ? "—" : `${s.u} · ${s.v}`,
      list(s.answers),
    ];
  });
  const where = (mark: string): string[] =>
    WALK.steps.flatMap((_, i) =>
      stepJudge(i).marks.includes(mark) ? [stepOf(i)] : [],
    );
  const marks = ["①", "②", "③", "④", "⑤"];
  return [
    md(
      ["걸음", "하는 일", "조건 판정", "갈래", "그 뒤 u · v", "답 목록"],
      rows,
    ),
    "",
    `${marks.map((m) => `${m} 은 ${where(m).join(" · ")}`).join(", ")} 에서 실행됐습니다. 걸음은 모두 ${WALK.steps.length} 개이고 반환값은 ${list(WALK.answers)} 입니다.`,
  ].join("\n");
}

function mutantBigLog(): string {
  const rows = FOUR.map(([name, n, e, root, qs]) => {
    const a = lowestCommonAncestor(n, e, root, qs);
    const b = BIG_LOG.lowestCommonAncestor(n, e, root, qs);
    const same = a.length === b.length && a.every((x, i) => x === b[i]);
    return [
      name,
      list(a),
      list(b),
      same ? "같다" : "어긋난다",
      comma(n * columns(n)),
      comma(n * 30),
    ];
  });
  rows.push([
    "정점 100,000 개",
    "—",
    "—",
    "—",
    comma(100_000 * columns(100_000)),
    comma(100_000 * 30),
  ]);
  return md(
    [
      "입력",
      "정본의 답",
      "층 수를 30 으로 박은 답",
      "두 답",
      "정본의 anc 추가 칸",
      "박았을 때의 anc 추가 칸",
    ],
    rows,
    [4, 5],
  );
}

function shift32(): string {
  const gap = 5;
  const LOG = columns(100_000);
  return columnsText([
    [
      `gap >> 0  = ${gap >> 0}`,
      `gap >> 32 = ${gap >> 32}`,
      "오른쪽 피연산자를 32 로 나눈 나머지 자리만큼 옮긴다",
    ],
    [
      `gap >> 2  = ${gap >> 2}`,
      `gap >> 34 = ${gap >> 34}`,
      "34 를 32 로 나눈 나머지가 2 다",
    ],
    [
      `V = 100,000 의 LOG = ${LOG}`,
      "",
      `k 가 ${LOG - 1} 에서 멈추므로 32 까지 가지 않는다`,
    ],
  ]);
}

function walkResult(): string {
  const got = lowestCommonAncestor(WALK_N, WALK_EDGES, WALK_ROOT, WALK_QUERIES);
  const rows = WALK_QUERIES.map((q, i) => [
    lcaText(q),
    `→ ${got[i]}`,
    queryRange(i),
  ]);
  rows.push([
    `lowestCommonAncestor(${WALK_N}, edges, ${WALK_ROOT}, queries)`,
    `→ ${list(got)}`,
    "",
  ]);
  return columnsText(rows);
}

/* ─────────────────────── 알아 두면 좋은 개념 ─────────────────────── */

function relatedFn(): string {
  const t = WALK_TABLE;
  const vs = [6, 7];
  const parent = parentsOf(t);
  const rows = Array.from({ length: t.LOG }, (_, k) => [
    `${k} 층`,
    `${2 ** k} 번`,
    ...vs.map((v) => String(at(t, v, k))),
  ]);
  const ok = vs.every((v) =>
    Array.from({ length: t.LOG }, (_, k) => k).every(
      (k) => at(t, v, k) === upBy(parent, v, 2 ** k),
    ),
  );
  return [
    md(
      ["층", "f 를 겹쳐 적용한 횟수", ...vs.map((v) => `정점 ${v} 의 칸`)],
      rows,
      [2, 3],
    ),
    "",
    `두 정점의 ${t.LOG} 층 모두에서 2^k 조상 표의 칸이 f 를 그 횟수만큼 직접 적용한 값과 ${ok ? "같습니다" : "다릅니다"}.`,
  ].join("\n");
}

/* ─────────────────────── 경쟁 설계와의 대조 ─────────────────────── */

const total = (q: number): [number, number] => {
  const qs = queries(BENCH_N, q);
  const a = liftCounted(BENCH_N, BENCH_EDGES, 0, qs);
  const b = eulerSparse(BENCH_N, BENCH_EDGES, 0, qs);
  return [a.setup + a.query, b.setup + b.query];
};

/** 뒤집히는 자리를 10,000 개 단위로 재어 찾는다. 두 값이 질의 수에 대해 단조라 첫 자리 하나면 된다. */
function flipAt(): number {
  for (let q = 400_000; q <= 500_000; q += 10_000) {
    const [left, right] = total(q);
    if (right < left) return q;
  }
  throw new Error("뒤집히는 자리를 못 찾았다");
}

function altFlip(): string {
  const flip = flipAt();
  const rows = [0, 100_000, 400_000, flip - 10_000, flip, 1_000_000].map(
    (q) => {
      const [left, right] = total(q);
      return [
        comma(q),
        comma(left),
        comma(right),
        left < right ? "2^k 조상 표" : "오일러 투어와 Sparse Table",
      ];
    },
  );
  return [
    md(
      ["질의 수", "2^k 조상 표", "오일러 투어와 Sparse Table", "적은 쪽"],
      rows,
      [0, 1, 2],
    ),
    "",
    `질의 수를 10,000 개 단위로 늘려 가며 쟀고, 적은 쪽이 처음 뒤집히는 자리는 ${comma(flip)} 개입니다.`,
  ].join("\n");
}

function altBench(): string {
  const qs0 = queries(BENCH_N, 0);
  const a0 = liftCounted(BENCH_N, BENCH_EDGES, 0, qs0);
  const b0 = eulerSparse(BENCH_N, BENCH_EDGES, 0, qs0);
  const rows: string[][] = [];
  for (const q of BENCH_QUERY_COUNTS) {
    const [left, right] = total(q);
    rows.push([
      q === 0 ? "준비만 · 칸 접근" : `질의 ${comma(q)} 개까지 · 칸 접근`,
      comma(left),
      comma(right),
      left < right
        ? `2^k 조상 표 · ${(right / left).toFixed(1)} 배`
        : `오일러 투어와 Sparse Table · ${(left / right).toFixed(2)} 배`,
    ]);
  }
  rows.push([
    "추가 칸",
    comma(a0.cells),
    comma(b0.cells),
    a0.cells < b0.cells
      ? `2^k 조상 표 · ${(b0.cells / a0.cells).toFixed(1)} 배`
      : "오일러 투어와 Sparse Table",
  ]);
  const qs = queries(BENCH_N, 100_000);
  const pa = liftCounted(BENCH_N, BENCH_EDGES, 0, qs).query / 100_000;
  const pb = eulerSparse(BENCH_N, BENCH_EDGES, 0, qs).query / 100_000;
  return [
    md(
      ["항목", "2^k 조상 표", "오일러 투어와 Sparse Table", "적은 쪽"],
      rows,
      [1, 2],
    ),
    "",
    `질의 100,000 개에서 질의 하나가 읽고 쓴 칸 접근은 평균 ${pa.toFixed(2)} 번 대 ${pb.toFixed(2)} 번입니다.`,
  ].join("\n");
}

/* ─────────────────────── 수식 정의와 유도 ─────────────────────── */

function tableCheck(): string {
  const t = WALK_TABLE;
  const parent = parentsOf(t);
  let same = 0;
  const rows = Array.from({ length: WALK_N }, (_, v) => {
    const byDef = Array.from({ length: t.LOG }, (_, k) =>
      upBy(parent, v, 2 ** k),
    );
    const byRec = Array.from({ length: t.LOG }, (_, k) => at(t, v, k));
    if (byDef.every((x, i) => x === byRec[i])) same += 1;
    return [String(v), String(t.depth[v]), byDef.join(" "), byRec.join(" ")];
  });
  return [
    md(
      [
        "정점 v",
        "깊이",
        "정의대로 up(v, 1) · up(v, 2) · up(v, 4) · up(v, 8)",
        "점화식으로 채운 A(v, 0) ~ A(v, 3)",
      ],
      rows,
      [0, 1],
    ),
    "",
    `정점 ${WALK_N} 개 가운데 두 계산이 네 층 모두 같은 정점은 ${same} 개입니다.`,
  ].join("\n");
}

function mathEquiv(): string {
  const q = WALK_QUERIES[1] as Query;
  const t = WALK_TABLE;
  const ans = lowestCommonAncestor(WALK_N, WALK_EDGES, WALK_ROOT, [
    q,
  ])[0] as number;
  const h = (t.depth[q[0]] as number) - (t.depth[ans] as number);
  const lines: string[][] = [
    [`답 ${ans} · u = ${q[0]} · v = ${q[1]}`, `h = ${h}`, "", ""],
  ];
  for (let k = 0; k < t.LOG; k++) {
    const a = at(t, q[0], k);
    const b = at(t, q[1], k);
    lines.push([
      `k = ${k}`,
      `2^k = ${2 ** k} ${2 ** k < h ? "<" : "≥"} ${h}`,
      `A(${q[0]}, ${k}) = ${a} · A(${q[1]}, ${k}) = ${b}`,
      a === b ? "=" : "≠",
    ]);
  }
  return columnsText(lines);
}

function stage2Climb(): string {
  const n = 1_023;
  const edges = binary(n);
  const t = lift(n, edges, 0);
  const qs = queries(n, 4_000);
  const ref = lowestCommonAncestor(n, edges, 0, qs);
  let pairs = 0;
  let same = 0;
  const sample: string[][] = [];
  for (const [i, [a, b]] of qs.entries()) {
    let u = a;
    let v = b;
    if ((t.depth[u] as number) < (t.depth[v] as number)) {
      const swap = u;
      u = v;
      v = swap;
    }
    const gap = (t.depth[u] as number) - (t.depth[v] as number);
    for (let k = 0; k < t.LOG; k++) {
      if (((gap >> k) & 1) === 1) u = at(t, u, k);
    }
    if (u === v) continue;
    const start = t.depth[u] as number;
    for (let k = t.LOG - 1; k >= 0; k--) {
      const uu = at(t, u, k);
      const vv = at(t, v, k);
      if (uu !== vv) {
        u = uu;
        v = vv;
      }
    }
    const answer = at(t, u, 0);
    if (answer !== ref[i]) throw new Error("사본의 답이 정본과 어긋난다");
    const h = start - (t.depth[answer] as number);
    const climbed = start - (t.depth[u] as number);
    pairs += 1;
    if (climbed === h - 1) same += 1;
    if (h >= 4 && sample.length < 5) {
      sample.push([
        lcaText([a, b]),
        comma(t.depth[a] as number),
        comma(t.depth[b] as number),
        comma(h),
        comma(climbed),
        comma(h - 1),
      ]);
    }
  }
  return [
    md(
      [
        "질의",
        "한쪽 깊이",
        "다른 쪽 깊이",
        "답까지 h",
        "함께 올리기가 올린 칸",
        "h − 1",
      ],
      sample,
      [1, 2, 3, 4, 5],
    ),
    "",
    `완전 이진 트리 정점 1,023 개에 질의 4,000 개를 걸었고, 함께 올리기가 실행된 질의 ${comma(pairs)} 개 가운데 「올린 칸 = h − 1」 인 것은 ${comma(same)} 개입니다.`,
  ].join("\n");
}

function mathScale(): string {
  const rows = [9, 1_000, 100_000].map((V) => {
    const L = columns(V);
    const ones = maxOnes(V);
    return [
      comma(V),
      comma(L),
      comma(V * L),
      comma(ones),
      comma(2 * L + 1),
      comma(4 + ones + 2 * L + 1),
    ];
  });
  return md(
    [
      "정점 V",
      "층 수 L",
      "anc 추가 칸 V · L",
      "깊이 맞추기의 가장 많은 읽기",
      "함께 올리기와 마지막 읽기 2L + 1",
      "질의 하나의 가장 많은 칸 접근",
    ],
    rows,
    [0, 1, 2, 3, 4, 5],
  );
}

/* ─────────────────────────── 불변식 ─────────────────────────── */

function invariantRounds(): string {
  const cases: [string, Lifted, Query, number, Edge[], number][] = [
    [
      "전개 입력",
      WALK_TABLE,
      WALK_QUERIES[1] as Query,
      WALK_N,
      WALK_EDGES,
      WALK_ROOT,
    ],
    ["완전 이진 트리 31", BIN31_T, BIN31_Q, BIN31_N, BIN31, 0],
  ];
  const rows: string[][] = [];
  let checked = 0;
  let ok = 0;
  for (const [name, t, q, n, e, root] of cases) {
    const ans = lowestCommonAncestor(n, e, root, [q])[0] as number;
    let u = q[0];
    let v = q[1];
    if ((t.depth[u] as number) < (t.depth[v] as number)) {
      const s = u;
      u = v;
      v = s;
    }
    const gap = (t.depth[u] as number) - (t.depth[v] as number);
    for (let k = 0; k < t.LOG; k++) {
      if (((gap >> k) & 1) === 1) u = at(t, u, k);
    }
    for (let k = t.LOG - 1; k >= 0; k--) {
      const h = (t.depth[u] as number) - (t.depth[ans] as number);
      const holds = u !== v && h <= 2 ** (k + 1);
      checked += 1;
      if (holds) ok += 1;
      rows.push([
        `${name} ${lcaText(q)}`,
        `k = ${k}`,
        `${u} · ${v}`,
        String(h),
        comma(2 ** (k + 1)),
        holds ? "u ≠ v · h ≤ 2^(k+1)" : "깨짐",
      ]);
      const up = at(t, u, k);
      const vp = at(t, v, k);
      if (up !== vp) {
        u = up;
        v = vp;
      }
    }
    const h = (t.depth[u] as number) - (t.depth[ans] as number);
    rows.push([
      `${name} ${lcaText(q)}`,
      "끝",
      `${u} · ${v}`,
      String(h),
      "—",
      `h = ${h} · anc[${u}][0] = ${at(t, u, 0)}`,
    ]);
  }
  return [
    md(
      ["질의", "회차", "들어갈 때 u · v", "답까지 h", "2^(k+1)", "불변식"],
      rows,
      [3, 4],
    ),
    "",
    `회차 ${checked} 번에 들어갈 때마다 쟀고, 불변식이 성립한 회차는 ${ok} 번입니다.`,
  ].join("\n");
}

function invariantEdges(): string {
  const cases: [string, number, Edge[], number, Query[], string][] = [
    [
      "정점 하나 · lca(0, 0)",
      1,
      [],
      0,
      [[0, 0]],
      "LOG 가 1 이고 gap 이 0 이라 깊이를 맞추자마자 u = v",
    ],
    [
      "정점 둘 · lca(0, 1)",
      2,
      [[0, 1]],
      0,
      [[0, 1]],
      "gap 이 1 이라 1 을 0 으로 올리면 u = v",
    ],
    [
      "전개 입력 · lca(5, 5)",
      WALK_N,
      WALK_EDGES,
      0,
      [[5, 5]],
      "gap 이 0 이고 처음부터 u = v",
    ],
    [
      "전개 입력 · 질의 없음",
      WALK_N,
      WALK_EDGES,
      0,
      [],
      "준비만 하고 빈 배열을 낸다",
    ],
    [
      "한 줄로 이은 네 정점 · 뿌리 2 · lca(0, 3)",
      4,
      chain(4),
      2,
      [[0, 3]],
      "깊이와 부모가 뿌리 2 를 기준으로 정해진다",
    ],
  ];
  return md(
    ["입력", "처리되는 자리", "정본의 답"],
    cases.map(([name, n, e, root, qs, where]) => [
      name,
      where,
      list(lowestCommonAncestor(n, e, root, qs)),
    ]),
  );
}

function mutantAscending(): string {
  return mutantTable(ASCENDING, "작은 k 부터 올리는 판");
}

/** 작은 `k` 부터 올리면 lca(6, 7) 이 지나는 길. 변이가 낸 답과 맞댄다. */
function ascendingTrace(): string {
  const q = WALK_QUERIES[1] as Query;
  const t = WALK_TABLE;
  const ans = lowestCommonAncestor(WALK_N, WALK_EDGES, WALK_ROOT, [
    q,
  ])[0] as number;
  let u = q[0];
  let v = q[1];
  const lines: string[][] = [];
  for (let k = 0; k < t.LOG; k++) {
    const up = at(t, u, k);
    const vp = at(t, v, k);
    const hBefore = (t.depth[u] as number) - (t.depth[ans] as number);
    if (up !== vp) {
      u = up;
      v = vp;
    }
    lines.push([
      `k = ${k}`,
      `들어갈 때 h = ${hBefore}`,
      `${2 ** k} 칸 위 두 조상 = ${up} · ${vp}`,
      up === vp ? "= 이라 그대로" : "≠ 라 올린다",
      `u = ${u} · v = ${v}`,
    ]);
  }
  const got = ASCENDING.lowestCommonAncestor(WALK_N, WALK_EDGES, WALK_ROOT, [
    q,
  ])[0];
  lines.push([
    "끝",
    "",
    `anc[${u}][0] = ${at(t, u, 0)}`,
    "",
    `변이의 답 ${got} · 정본의 답 ${ans}`,
  ]);
  return columnsText(lines);
}

/* ─────────────────────────── 비용 계산 ─────────────────────────── */

function perfDerive(): string {
  const V = WALK_N;
  const E = WALK_EDGES.length;
  const LOG = WALK_TABLE.LOG;
  const items: [string, number, string][] = [
    [
      "배열 만들기",
      3 * V + V * LOG,
      `near · depth · seen 이 ${V} 칸씩, anc 가 ${V} × ${LOG} 칸`,
    ],
    ["이웃 목록 채우기", 2 * E, `간선 ${E} 개를 양쪽 목록에 넣는다`],
    ["시작 정점 표시", 2, "스택에 넣고 seen 을 쓴다"],
    ["정점 꺼내기", V, "정점마다 한 번"],
    ["이웃 항목 보기", 4 * E, `항목 ${2 * E} 개 × 항목 읽기와 seen 읽기`],
    ["자식 정하기", 5 * (V - 1), `뿌리를 뺀 정점 ${V - 1} 개 × 다섯 칸`],
    [
      "층 쌓기",
      3 * V * (LOG - 1),
      `칸 ${V * (LOG - 1)} 개 × 읽기 둘과 쓰기 하나`,
    ],
  ];
  const sum = items.reduce((n, [, c]) => n + c, 0);
  const counted = liftCounted(V, WALK_EDGES, WALK_ROOT, []).setup;
  const lastBuild = WALK.steps.findLastIndex((s) => s.kind === "layer");
  return [
    md(
      ["항목", "칸 수", "근거"],
      items.map(([a, c, w]) => [a, comma(c), w]),
      [1],
    ),
    "",
    `일곱 항목의 합은 ${comma(sum)} 칸이고, 세는 사본이 전개 입력의 준비(${stepOf(0)}~${stepOf(lastBuild)})에서 센 값도 ${comma(counted)} 칸입니다.`,
  ].join("\n");
}

function costClosedForm(): string {
  const rows: string[][] = [];
  let diff = 0;
  const cases: [string, number, Edge[]][] = [
    ["전개 입력", WALK_N, WALK_EDGES],
    ["한 줄 100 정점", 100, chain(100)],
    ["별 모양 1,000 정점", 1_000, star(1_000)],
    ["완전 이진 트리 20,000 정점", 20_000, binary(20_000)],
  ];
  for (const [name, v, edges] of cases) {
    const LOG = columns(v);
    const got = liftCounted(v, edges, 0, []).setup;
    const closed = 12 * v + 4 * v * LOG - 9;
    diff += Math.abs(got - closed);
    rows.push([name, comma(v), comma(LOG), comma(got), comma(closed)]);
  }
  const top = 12 * 100_000 + 4 * 100_000 * columns(100_000) - 9;
  return [
    md(
      ["입력", "정점 V", "층 수 LOG", "센 값", "12V + 4V·LOG − 9"],
      rows,
      [1, 2, 3, 4],
    ),
    "",
    `네 입력에서 센 값과 닫힌 형태의 차이를 모두 더하면 ${diff} 입니다. 정점 100,000 개에 넣으면 LOG 가 ${columns(100_000)} 이라 ${comma(top)} 칸입니다.`,
  ].join("\n");
}

function perfQueries(): string {
  const LOG = WALK_TABLE.LOG;
  const rows = WALK_QUERIES.map((q, i) => {
    const one = liftCounted(WALK_N, WALK_EDGES, WALK_ROOT, [q]).query;
    const s = WALK.steps.find(
      (x) => x.q === i && x.kind === "align",
    ) as WalkStep;
    const early = s.answer !== undefined;
    return [
      lcaText(q),
      queryRange(i),
      "4",
      String((s.jumps ?? []).length),
      early ? "—" : String(2 * LOG + 1),
      comma(one),
    ];
  });
  const sum = liftCounted(WALK_N, WALK_EDGES, WALK_ROOT, WALK_QUERIES).query;
  const setup = liftCounted(WALK_N, WALK_EDGES, WALK_ROOT, []).setup;
  return [
    md(
      [
        "질의",
        "걸음",
        "깊이 비교와 gap",
        "깊이 맞추기의 읽기",
        "함께 올리기와 마지막 읽기 2·LOG + 1",
        "합",
      ],
      rows,
      [2, 3, 4, 5],
    ),
    "",
    `LOG 는 ${LOG} 입니다. 질의 넷의 합은 ${sum} 칸이고, 준비 ${setup} 칸과 합치면 ${setup + sum} 칸입니다.`,
  ].join("\n");
}

function perfExtremes(): string {
  const V = 100_000;
  const LOG = columns(V);
  const ones = maxOnes(V);
  const best = liftCounted(3, chain(3), 0, [[1, 1]]).query;
  return columnsText([
    [
      "질의 하나가 가장 적을 때",
      `${best} 칸`,
      "처음부터 같은 정점 — 깊이 비교와 gap 만 읽는다",
    ],
    [
      "질의 하나가 가장 많을 때",
      `4 + ${ones} + ${2 * LOG + 1} = ${4 + ones + 2 * LOG + 1} 칸`,
      `V = 100,000 · LOG = ${LOG} · gap 의 1 이 ${ones} 개이고 함께 올리기까지 간다`,
    ],
  ]);
}

function shapeValues(): string {
  const v = 20_000;
  const q = 20_000;
  const rows: string[][] = [];
  const shapes: [string, string, Edge[]][] = [
    ["한 줄", "정점 i 와 i+1 을 잇는다", chain(v)],
    ["별 모양", "정점 0 이 나머지 전부와 이어진다", star(v)],
    ["완전 이진 트리", "정점 i 의 부모가 ⌊(i−1)/2⌋", binary(v)],
    [
      "애벌레",
      "앞 절반을 한 줄로 잇고 뒤 절반을 하나씩 매단다",
      caterpillar(v),
    ],
    ["두 갈래 사슬", "뿌리에서 사슬 둘이 뻗는다", twoChains(v)],
  ];
  for (const [name, rule, edges] of shapes) {
    const got = liftCounted(v, edges, 0, queries(v, q));
    rows.push([
      name,
      rule,
      "(i mod V, 37i mod V)",
      comma(got.setup),
      comma(got.query),
      comma(got.setup + got.query),
    ]);
  }
  // 두 갈래 사슬에서 깊이 차이의 1 이 가장 많아지는 질의를 골라 다시 잰다.
  const half = Math.floor((v - 1) / 2);
  let gap = 0;
  let ones = 0;
  for (let d = 0; d <= half; d++) {
    const c = popcount(d);
    if (c > ones) {
      ones = c;
      gap = d;
    }
  }
  const worst: Query[] = [];
  for (let i = 0; i < q; i++) worst.push([half, half + 1 + (half - gap) - 1]);
  const got = liftCounted(v, twoChains(v), 0, worst);
  rows.push([
    "두 갈래 사슬",
    "뿌리에서 사슬 둘이 뻗는다",
    `깊이 차이 ${comma(gap)} 인 한 쌍`,
    comma(got.setup),
    comma(got.query),
    comma(got.setup + got.query),
  ]);
  return [
    md(
      ["모양", "만드는 규칙", "질의", "준비 칸", "질의 칸", "합"],
      rows,
      [3, 4, 5],
    ),
    "",
    `정점 20,000 개 · 질의 20,000 개입니다. 마지막 줄의 깊이 차이 ${comma(gap)}${은는(comma(gap))} 이진수로 ${gap.toString(2)} 이라 1 이 ${ones} 개이고, 서로 다른 갈래의 두 정점이라 함께 올리기까지 갑니다.`,
  ].join("\n");
}

function perfSmallest(): string {
  const got = liftCounted(1, [], 0, [[0, 0]]);
  return columnsText([
    [
      "lowestCommonAncestor(1, [], 0, [[0, 0]])",
      `준비 ${got.setup} 칸`,
      `질의 ${got.query} 칸`,
      `답 ${got.answer[0]}`,
    ],
  ]);
}

/* ─────────────────────────── 스스로 점검하기 ─────────────────────────── */

function selfcheckState(): string {
  const s = WALK.steps[1] as WalkStep;
  return columnsText([
    [
      `${stepOf(1)} 끝`,
      `anc[·][0] = ${row(s.layers[0] ?? [])}`,
      `뿌리 ${WALK_ROOT}`,
    ],
  ]);
}

function rootAtFive(): string {
  const root = 5;
  const t = lift(WALK_N, WALK_EDGES, root);
  const q = WALK_QUERIES[1] as Query;
  const got = lowestCommonAncestor(WALK_N, WALK_EDGES, root, [q])[0] as number;
  const was = lowestCommonAncestor(WALK_N, WALK_EDGES, WALK_ROOT, [
    q,
  ])[0] as number;
  const upList = (v: number): number[] => {
    const out = [v];
    let x = v;
    while (x !== root) {
      x = at(t, x, 0);
      out.push(x);
    }
    return out;
  };
  return columnsText([
    [`뿌리 ${root} 의 anc[·][0]`, row(parentsOf(t))],
    [`뿌리 ${root} 의 depth[·]`, row(t.depth)],
    [`${q[0]} 의 조상`, upList(q[0]).join(" → ")],
    [`${q[1]} 의 조상`, upList(q[1]).join(" → ")],
    [lcaText(q), `뿌리 ${root} 에서 ${got} · 뿌리 ${WALK_ROOT} 에서 ${was}`],
  ]);
}

/* ─────────────────────────── 증명 블록 ─────────────────────────── */

export const PROOFS: Record<string, () => string> = {
  "concept-ancestors": conceptAncestors,
  "naive-scale": naiveScale,
  "jump-small": jumpSmall,
  "jump-vs-step": jumpVsStep,
  candidates,
  "table-read": tableRead,
  "table-relation": tableRelation,
  "table-vs-others": tableVsOthers,
  "build-dfs": buildDfs,
  "build-layers": buildLayers,
  "build-align": buildAlign,
  "build-lift": buildLift,
  premise,
  "base-sweep": baseSweep,
  "walk-input": walkInput,
  "walk-t1t2": walkT1T2,
  "walk-layers": walkLayers,
  "walk-align": walkAlign,
  "mutant-no-early": mutantNoEarly,
  "no-early-trace": noEarlyTrace,
  "walk-lift": walkLift,
  "walk-trace": walkTrace,
  "mutant-big-log": mutantBigLog,
  "shift-32": shift32,
  "walk-result": walkResult,
  "related-fn": relatedFn,
  "alt-flip": altFlip,
  "alt-bench": altBench,
  "table-check": tableCheck,
  "math-equiv": mathEquiv,
  "stage2-climb": stage2Climb,
  "math-scale": mathScale,
  "invariant-rounds": invariantRounds,
  "invariant-edges": invariantEdges,
  "mutant-ascending": mutantAscending,
  "ascending-trace": ascendingTrace,
  "perf-derive": perfDerive,
  "cost-closed-form": costClosedForm,
  "perf-queries": perfQueries,
  "perf-extremes": perfExtremes,
  "shape-values": shapeValues,
  "perf-smallest": perfSmallest,
  "selfcheck-state": selfcheckState,
  "root-five": rootAtFive,
};
