/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run tools/check-proof.ts src/algorithms/graph/dfsTraversal/dfsTraversal-guide.md
 *
 * **세는 자리를 덧붙인 사본이 몇 있다**(`traced` · `sweepTrace` · `pickMinCounts` · `sortedCounts`).
 * 정본은 몇 번 읽었는지, 스택의 원소를 누가 넣었는지를 내보내지 않으므로, 기록만 덧붙인 사본이 아니면
 * 그 값을 낼 방법이 없다. **답이 맞는지는 사본이 아니라 정본이 진다** — 정본과 같은 답을 내야 하는
 * 사본은 부를 때마다 자기 답을 정본과 맞대고, 다르면 던진다. 그림 사이드카(`-guide.fig.tsx`)와 걸음
 * 재생 패널도 여기의 `traced` 가 낸 기록을 쓴다. `markOnPush` · `recursive` · `queueOrder` 는 **다른
 * 절차**라 정본과 맞대지 않는다.
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { 과와, 을를, 이가 } from "../../../../tools/josa.ts";
import { bfsShortestPath } from "../bfsShortestPath/bfsShortestPath-guide.ref.ts";
import { dfsTraversal } from "./dfsTraversal-guide.ref.ts";

export type Edge = [number, number];

/** 본문 전개가 쓰는 고정 입력 — 정점 0 에서 두 갈래가 갈리고, 정점 5 는 간선이 없다. */
export const WALK_N = 6;
export const WALK_EDGES: Edge[] = [
  [0, 2],
  [0, 1],
  [1, 3],
  [2, 4],
];
export const START = 0;

/** 전개 입력과 같은 간선을 번호 차례로 적은 것. 정렬을 빼도 답이 안 틀리는 입력이다. */
const WALK_EDGES_SORTED: Edge[] = [
  [0, 1],
  [0, 2],
  [1, 3],
  [2, 4],
];

/**
 * 네 정점 그래프. 정점 0 이 셋과 이어져 있고 1 과 3 이 또 이어져 있다. 전개 입력에서는 갈리지
 * 않는 갈래가 여기서 갈린다.
 */
export const FOUR_N = 4;
export const FOUR_EDGES: Edge[] = [
  [0, 3],
  [0, 1],
  [0, 2],
  [1, 3],
];

/* ────────────────────────── 표기 ────────────────────────── */

/** `[0, 1, 3, 2, 4]` 꼴 — 본문 표기와 같다. */
export const show = (xs: readonly number[]): string => `[${xs.join(", ")}]`;

/** `39,999,600,002` 꼴 — 본문 표기와 같다. */
export const comma = (n: number): string => n.toLocaleString("en-US");

/** 마크다운 표. `right` 에 든 열만 오른쪽 정렬이다. */
function md(
  head: string[],
  rows: string[][],
  right: readonly number[] = [],
): string {
  const rule = head.map((_, c) => (right.includes(c) ? "---:" : "---"));
  const line = (cells: string[]) => `| ${cells.join(" | ")} |`;
  return [line(head), line(rule), ...rows.map(line)].join("\n");
}

/** 표 아래 문장까지 한 블록으로 — 본문은 `<!--/proof-->` 로 닫는다. */
const withSentence = (table: string, sentence: string): string =>
  [table, "", sentence].join("\n");

/** 한글은 고정폭 화면에서 두 칸을 먹는다 — 등폭 블록의 칸 맞춤. */
const width = (s: string): number =>
  [...s].reduce((n, c) => n + (/[ᄀ-ᇿ　-〿㄰-㆏가-힯一-鿿]/.test(c) ? 2 : 1), 0);
const pad = (s: string, to: number): string =>
  s + " ".repeat(Math.max(0, to - width(s)));

/** 등폭 블록의 열 맞춤 — 열마다 가장 넓은 칸에 맞춘다. */
function columns(rows: string[][], gap = "   "): string {
  const cols = Math.max(...rows.map((r) => r.length));
  const w = Array.from({ length: cols }, (_, c) =>
    Math.max(...rows.map((r) => width(r[c] ?? ""))),
  );
  return rows
    .map((r) =>
      r
        .map((cell, c) => pad(cell, w[c] ?? 0))
        .join(gap)
        .trimEnd(),
    )
    .join("\n");
}

/** 조사를 고를 때 읽는 앞말 — 닫는 괄호는 소리가 없으니 떼고 마지막 수를 읽는다. */
const said = (s: string): string => s.replace(/[\]})]+$/, "");

export const same = (a: readonly number[], b: readonly number[]): boolean =>
  a.length === b.length && a.every((x, i) => x === b[i]);

const SEC = (ops: number): string => `${(ops / 1e8).toFixed(3)} 초`;

/* ────────────────────────── 입력 ────────────────────────── */

/** 간선 목록에서 이웃 목록을 만든다. `sorted` 면 목록마다 오름차순으로 정렬한다. */
export function adjacency(
  n: number,
  edges: readonly Edge[],
  sorted: boolean,
): number[][] {
  const adj: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    (adj[u] as number[]).push(v);
    (adj[v] as number[]).push(u);
  }
  if (sorted) for (const list of adj) list.sort((a, b) => a - b);
  return adj;
}

/** 정점 `v` 개를 한 줄로 이은 그래프. */
export function chain(v: number): Edge[] {
  const edges: Edge[] = [];
  for (let i = 0; i < v - 1; i++) edges.push([i, i + 1]);
  return edges;
}

/** 정점 0 이 나머지 전부와 이어진 그래프. */
export function star(v: number): Edge[] {
  const edges: Edge[] = [];
  for (let i = 1; i < v; i++) edges.push([0, i]);
  return edges;
}

/** 시드가 같으면 같은 수열을 내는 난수(mulberry32). 무작위 입력을 다시 만들 수 있게 한다. */
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randomGraph(v: number, e: number, seed: number): Edge[] {
  const r = rng(seed);
  const edges: Edge[] = [];
  for (let i = 0; i < e; i++) {
    edges.push([Math.floor(r() * v), Math.floor(r() * v)]);
  }
  return edges;
}

/* ───────────────────── 정본과 같은 절차의 기록 ───────────────────── */

/** 스택의 원소 하나 — 값과, 그 값을 넣은 정점(시작 정점이면 −1). */
export interface Item {
  readonly v: number;
  readonly owner: number;
}

/** 꺼내기 한 번 — 그 걸음이 끝난 뒤의 상태. */
export interface Pop {
  /** 꺼낸 정점. */
  readonly node: number;
  /** 그 원소를 넣은 정점. 시작 정점이면 −1. */
  readonly owner: number;
  /** ① 처음 꺼냈는가. 거짓이면 ② 이미 결과에 있다. */
  readonly fresh: boolean;
  /** 이번 걸음에 넣은 값 — 넣은 차례대로. */
  readonly pushed: readonly number[];
  /** 걸음 뒤의 스택 — 아래에서 위로. */
  readonly stack: readonly Item[];
  readonly order: readonly number[];
}

export interface Run {
  /** 간선 목록에서 만든 직후의 이웃 목록. */
  readonly raw: readonly (readonly number[])[];
  /** 절차가 실제로 쓴 이웃 목록(정렬했으면 정렬 뒤). */
  readonly adj: readonly (readonly number[])[];
  readonly pops: readonly Pop[];
  readonly order: readonly number[];
  /** 스택에 들어간 원소의 총수(시작 정점 포함). */
  readonly pushes: number;
  /** 스택에 한꺼번에 남은 원소 수의 최대. */
  readonly maxStack: number;
  /** 정점마다 결과에 넣을 때의 깊이 — 넣은 정점의 깊이 + 1. 안 넣었으면 −1. */
  readonly depth: readonly number[];
}

export interface Options {
  readonly sorted: boolean;
  readonly descending: boolean;
  /** 거짓이면 걸음마다의 스택·결과 사본을 남기지 않는다 — 정점 10 만 개 규모에서 쓴다. */
  readonly record?: boolean;
}

const REF_OPTIONS: Options = { sorted: true, descending: true };
/** 정본과 같은 조합 — 걸음 기록 없이. */
const LARGE: Options = { sorted: true, descending: true, record: false };

/**
 * 정본과 같은 절차에 기록만 덧붙인 사본. 두 갈림(목록을 정렬하는가 · 스택에 큰 번호부터 넣는가)을
 * 매개변수로 뺐고, 정본과 같은 조합으로 부르면 답을 정본과 맞댄다 — 다르면 이 기록은 다른 절차의
 * 것이다.
 */
export function traced(
  n: number,
  edges: readonly Edge[],
  start: number,
  opt: Options = REF_OPTIONS,
): Run {
  const record = opt.record !== false;
  const raw = adjacency(n, edges, false);
  const adj = opt.sorted ? adjacency(n, edges, true) : raw.map((l) => [...l]);
  const visited: boolean[] = Array.from({ length: n }, () => false);
  const depth: number[] = Array.from({ length: n }, () => -1);
  const order: number[] = [];
  const stack: Item[] = [{ v: start, owner: -1 }];
  const pops: Pop[] = [];
  let pushes = 1;
  let maxStack = 1;
  while (stack.length > 0) {
    const item = stack.pop() as Item;
    const node = item.v;
    if (visited[node] === true) {
      if (record)
        pops.push({
          node,
          owner: item.owner,
          fresh: false,
          pushed: [],
          stack: stack.slice(),
          order: order.slice(),
        });
      continue;
    }
    visited[node] = true;
    order.push(node);
    depth[node] = item.owner < 0 ? 0 : (depth[item.owner] as number) + 1;
    const list = adj[node] as number[];
    const pushed: number[] = [];
    if (opt.descending) {
      for (let i = list.length - 1; i >= 0; i--) pushed.push(list[i] as number);
    } else {
      for (const w of list) pushed.push(w);
    }
    for (const w of pushed) stack.push({ v: w, owner: node });
    pushes += pushed.length;
    maxStack = Math.max(maxStack, stack.length);
    if (record)
      pops.push({
        node,
        owner: item.owner,
        fresh: true,
        pushed,
        stack: stack.slice(),
        order: order.slice(),
      });
  }
  if (opt.sorted && opt.descending) {
    const want = dfsTraversal(n, edges as Edge[], start);
    if (!same(order, want)) {
      throw new Error(
        `기록 사본이 정본과 다른 답을 냈다 — ${show(order)} ≠ ${show(want)}`,
      );
    }
  }
  return { raw, adj, pops, order, pushes, maxStack, depth };
}

/** 본문 전개의 기록. 걸음 번호는 T1 = 시작, T2… = 꺼내기, 마지막 = 종료다. */
export const WALK = traced(WALK_N, WALK_EDGES, START);
/** 꺼내기 k(0 부터)의 걸음 번호. */
export const stepOf = (k: number): string => `T${k + 2}`;
export const END_STEP = `T${WALK.pops.length + 2}`;
export const FOUR = traced(FOUR_N, FOUR_EDGES, START);

/** 스택을 구간으로 끊는다 — 같은 정점이 넣은 원소가 이어진 덩어리 하나가 구간 하나다. */
export function segments(
  stack: readonly Item[],
): { owner: number; values: number[] }[] {
  const out: { owner: number; values: number[] }[] = [];
  for (const it of stack) {
    const last = out.at(-1);
    if (last && last.owner === it.owner) last.values.push(it.v);
    else out.push({ owner: it.owner, values: [it.v] });
  }
  return out;
}

export const ownerName = (o: number): string => (o < 0 ? "시작" : `정점 ${o}`);

/** 구간 목록을 한 칸에 — 「정점 0 [2] · 정점 1 [3, 0]」. */
export const showSegments = (stack: readonly Item[]): string => {
  const segs = segments(stack);
  return segs.length === 0
    ? "비었다"
    : segs.map((s) => `${ownerName(s.owner)} ${show(s.values)}`).join(" · ");
};

/** 스택 값만 — 아래에서 위로. */
export const showStack = (stack: readonly Item[]): string =>
  show(stack.map((it) => it.v));

/* ───────────────────── 비교할 절차들 — 세는 사본 ───────────────────── */

/**
 * 가장 단순한 방법 — 이웃 목록을 만들지 않고, 다음에 갈 정점을 고를 때마다 **간선 목록 전체**를
 * 처음부터 다시 읽어 아직 방문하지 않은 가장 작은 이웃을 찾는다. 갈 곳이 없으면 지나온 정점으로
 * 하나씩 되돌아가며 같은 검사를 되풀이한다.
 */
function sweepTrace(n: number, edges: readonly Edge[], start: number) {
  const visited: boolean[] = Array.from({ length: n }, () => false);
  const order: number[] = [start];
  const path: number[] = [start];
  visited[start] = true;
  let reads = 0;
  const picks: { at: number; found: number }[] = [];
  while (path.length > 0) {
    const cur = path[path.length - 1] as number;
    let best = -1;
    for (const [u, v] of edges) {
      reads += 2;
      if (u === cur && visited[v] === false && (best < 0 || v < best)) best = v;
      if (v === cur && visited[u] === false && (best < 0 || u < best)) best = u;
    }
    picks.push({ at: cur, found: best });
    if (best < 0) {
      path.pop();
      continue;
    }
    visited[best] = true;
    order.push(best);
    path.push(best);
  }
  const want = dfsTraversal(n, edges as Edge[], start);
  if (!same(order, want))
    throw new Error("간선 목록 방식이 정본과 다른 답을 냈다");
  return { order, reads, picks };
}

/**
 * 이웃 목록은 만들어 두되 **정렬하지 않고**, 다음에 갈 정점을 고를 때마다 그 목록을 처음부터
 * 읽어 아직 방문하지 않은 최솟값을 찾는다.
 */
function pickMinCounts(n: number, edges: readonly Edge[], start: number) {
  const adj = adjacency(n, edges, false);
  const visited: boolean[] = Array.from({ length: n }, () => false);
  const order: number[] = [start];
  const path: number[] = [start];
  visited[start] = true;
  let reads = 0;
  while (path.length > 0) {
    const cur = path[path.length - 1] as number;
    let best = -1;
    for (const w of adj[cur] as number[]) {
      reads++;
      if (visited[w] === false && (best < 0 || w < best)) best = w;
    }
    if (best < 0) {
      path.pop();
      continue;
    }
    visited[best] = true;
    order.push(best);
    path.push(best);
  }
  const want = dfsTraversal(n, edges as Edge[], start);
  if (!same(order, want))
    throw new Error("최솟값 방식이 정본과 다른 답을 냈다");
  return { order, reads };
}

/** 정본과 같은 절차에서 목록 읽기와 정렬 비교를 센다. 비교는 정렬 함수가 비교 함수를 부른 횟수다. */
function sortedCounts(n: number, edges: readonly Edge[], start: number) {
  const adj = adjacency(n, edges, false);
  let compares = 0;
  for (const list of adj)
    list.sort((a, b) => {
      compares++;
      return a - b;
    });
  const run = traced(n, edges, start, LARGE);
  let reads = 0;
  for (const v of run.order) reads += (adj[v] as number[]).length;
  return { reads, compares, order: run.order };
}

/**
 * **다른 절차** — 방문 표시를 스택에 **넣을 때** 한다. 같은 정점이 스택에 두 번 들어가지
 * 않는 대신, 꺼내는 순서가 깊이 우선이 아니게 된다.
 */
function markOnPush(n: number, edges: readonly Edge[], start: number) {
  const adj = adjacency(n, edges, true);
  const visited: boolean[] = Array.from({ length: n }, () => false);
  const order: number[] = [];
  const stack: number[] = [start];
  visited[start] = true;
  const steps: { node: number; marked: number[]; stack: number[] }[] = [];
  let pushes = 1;
  while (stack.length > 0) {
    const node = stack.pop() as number;
    order.push(node);
    const list = adj[node] as number[];
    const marked: number[] = [];
    for (let i = list.length - 1; i >= 0; i--) {
      const w = list[i] as number;
      if (visited[w] === true) continue;
      visited[w] = true;
      stack.push(w);
      marked.push(w);
    }
    pushes += marked.length;
    steps.push({ node, marked, stack: stack.slice() });
  }
  return { order, steps, pushes };
}

/** **다른 절차** — 스택 배열 대신 함수 호출로 깊이를 잡는다. */
function recursive(n: number, edges: readonly Edge[], start: number): number[] {
  const adj = adjacency(n, edges, true);
  const visited: boolean[] = Array.from({ length: n }, () => false);
  const order: number[] = [];
  const go = (v: number): void => {
    visited[v] = true;
    order.push(v);
    for (const w of adj[v] as number[]) {
      if (visited[w] === false) go(w);
    }
  };
  go(start);
  return order;
}

/** **다른 절차** — 스택 대신 큐로, 먼저 넣은 것을 먼저 꺼낸다. 이웃은 작은 번호부터 넣는다. */
function queueOrder(n: number, edges: readonly Edge[], start: number) {
  const adj = adjacency(n, edges, true);
  const visited: boolean[] = Array.from({ length: n }, () => false);
  const order: number[] = [];
  const queue: number[] = [start];
  let head = 0;
  while (head < queue.length) {
    const node = queue[head++] as number;
    if (visited[node] === true) continue;
    visited[node] = true;
    order.push(node);
    for (const w of adj[node] as number[]) queue.push(w);
  }
  return order;
}

/** 재귀라면 정점을 결과에 넣는 순간의 호출 스택 — 시작 정점에서 그 정점까지의 경로. */
function pathAt(run: Run, k: number): number[] {
  const parent = new Map<number, number>();
  for (const p of run.pops.slice(0, k + 1)) {
    if (p.fresh) parent.set(p.node, p.owner);
  }
  const path: number[] = [];
  let v = (run.pops[k] as Pop).node;
  while (v >= 0) {
    path.unshift(v);
    v = parent.get(v) ?? -1;
  }
  return path;
}

/** 정렬 항 S = Σ deg(v) · log₂ deg(v). 목록이 비었거나 한 칸이면 0 이다. */
function sortTerm(adj: readonly (readonly number[])[]): number {
  let s = 0;
  for (const l of adj) if (l.length > 1) s += l.length * Math.log2(l.length);
  return s;
}

/* ────────────────────────── 변이 ────────────────────────── */

type Mod = {
  dfsTraversal(n: number, edges: Edge[], start: number): number[];
};
const REF = new URL("./dfsTraversal-guide.ref.ts", import.meta.url).pathname;

/**
 * 스택에 **큰 번호부터 넣던 줄** 하나를 작은 번호부터 넣도록 바꾼 사본. **정본 소스에서 기계로
 * 만든다** — 맞는 줄이 정확히 하나가 아니면 `loadMutant` 가 던진다.
 */
const ascendingPush = await loadMutant<Mod>(REF, {
  swap: [
    /for \(let i = list\.length - 1; i >= 0; i--\)/,
    "for (let i = 0; i < list.length; i++)",
  ],
});

/** 이웃 목록을 **정렬하던 줄** 하나를 지운 사본. 목록이 입력 순서 그대로 남는다. */
const unsorted = await loadMutant<Mod>(REF, {
  drop: /for \(const list of adj\) list\.sort/,
});

/**
 * 중화 실행(`check-proof` 가 변이를 만들되 적용하지 않는 실행)에서는 두 사본이 정본 그 자체다.
 * 「변이가 답을 바꿨다」 자기검사와 사본끼리의 맞대기는 그때 건너뛴다 — 값에서 알아낸다(SPEC §0).
 */
const live = (m: Mod): boolean => m.dfsTraversal !== dfsTraversal;

const MUTANT_CASES: { label: string; n: number; edges: Edge[] }[] = [
  { label: "전개가 쓰는 여섯 정점", n: WALK_N, edges: WALK_EDGES },
  { label: "네 정점 그래프", n: FOUR_N, edges: FOUR_EDGES },
  { label: "한 줄로 이은 네 정점", n: 4, edges: chain(4) },
];

const mutantRows = MUTANT_CASES.map((c) => ({
  label: c.label,
  correct: dfsTraversal(c.n, c.edges, START),
  broken: ascendingPush.dfsTraversal(c.n, c.edges, START),
}));

if (live(ascendingPush) && mutantRows.every((r) => same(r.correct, r.broken))) {
  throw new Error(
    "변이가 어느 입력에서도 결과를 바꾸지 못했다 — 「방문 순서가 갈린다」가 거짓이다",
  );
}

const edgeList = (edges: readonly Edge[]): string =>
  `[${edges.map(([u, v]) => `[${u},${v}]`).join(",")}]`;

/* ─────────────────── 「전체 컨셉」 ─────────────────── */

/** 간선을 적은 차례만 다른 두 입력 — 정렬한 이웃 목록이 같아 결과도 같다. */
function conceptRule(): string {
  const inputs = [WALK_EDGES, WALK_EDGES_SORTED];
  const rows = inputs.map((edges) => {
    const adj = adjacency(WALK_N, edges, true);
    return [
      edgeList(edges),
      show(adj[START] as number[]),
      show(dfsTraversal(WALK_N, edges, START)),
    ];
  });
  const a = dfsTraversal(WALK_N, WALK_EDGES, START);
  const b = dfsTraversal(WALK_N, WALK_EDGES_SORTED, START);
  return withSentence(
    md(["간선 목록", `정점 ${START} 의 이웃(번호 차례)`, "결과"], rows),
    `두 입력의 결과는 ${same(a, b) ? "같습니다" : "다릅니다"}.`,
  );
}

/** 이웃 [1, 2] 를 두 차례로 넣었을 때 스택과 먼저 나오는 값. */
function conceptPush(): string {
  const list = WALK.adj[START] as number[];
  const ways: { name: string; seq: number[] }[] = [
    { name: "작은 번호부터 넣는다", seq: [...list] },
    { name: "큰 번호부터 넣는다", seq: [...list].reverse() },
  ];
  const rows = ways.map((w) => {
    const stack: number[] = [];
    for (const x of w.seq) stack.push(x);
    const first = stack.pop() as number;
    return [w.name, w.seq.join(" · "), show([...stack, first]), String(first)];
  });
  return md(
    ["넣는 차례", "넣은 값", "스택(아래 → 위)", "먼저 나오는 값"],
    rows,
  );
}

/* ─────────────────── 「아이디어를 떠올리는 과정」 ─────────────────── */

const BIG = 100_000;

/** 사슬에서 간선 목록 방식의 계수 — 작은 셋은 실행하고, 큰 하나는 실행으로 확인한 식으로 낸다. */
function naiveScale(): string {
  const formula = (v: number) => (2 * v - 1) * 2 * (v - 1);
  const rows: string[][] = [];
  let matched = 0;
  for (const v of [10, 100, 1_000]) {
    const s = sweepTrace(v, chain(v), 0);
    if (s.reads !== formula(v)) {
      throw new Error(`사슬 ${v} 의 실행값 ${s.reads} 이 식과 다르다`);
    }
    matched++;
    rows.push([
      comma(v),
      comma(v - 1),
      comma(s.picks.length),
      comma(s.reads),
      SEC(s.reads),
      "실행",
    ]);
  }
  rows.push([
    comma(BIG),
    comma(BIG - 1),
    comma(2 * BIG - 1),
    comma(formula(BIG)),
    SEC(formula(BIG)),
    "식",
  ]);
  return withSentence(
    md(
      [
        "정점 V",
        "간선 E",
        "고르기",
        "간선 끝점 읽기",
        "초당 1 억 번 기준",
        "센 방법",
      ],
      rows,
      [0, 1, 2, 3, 4],
    ),
    `실행한 ${matched} 줄이 모두 식 (2V − 1) × 2(V − 1) 과 일치했고, 정점 ${comma(BIG)} 개 줄은 그 식으로 낸 값입니다.`,
  );
}

/** 전개 입력에서 정점 0 의 첫 고르기 — 간선 넷을 차례로 읽는다. */
function sweepFirstPick(): string {
  const visited = new Set([START]);
  let best = -1;
  const rows = WALK_EDGES.map(([u, v]) => {
    const touches = u === START || v === START;
    const other = u === START ? v : v === START ? u : -1;
    if (touches && !visited.has(other) && (best < 0 || other < best))
      best = other;
    return [
      `[${u},${v}]`,
      touches ? "예" : "아니오",
      touches ? String(other) : "—",
      best < 0 ? "없음" : String(best),
    ];
  });
  const first = sweepTrace(WALK_N, WALK_EDGES, START).picks[0];
  if (first?.found !== best) throw new Error("첫 고르기 재현이 사본과 다르다");
  return withSentence(
    md(
      ["읽은 간선", `끝점에 정점 ${START}`, "다른 끝점", "읽은 뒤의 후보"],
      rows,
    ),
    `간선 ${WALK_EDGES.length} 개의 끝점 ${2 * WALK_EDGES.length} 개를 다 읽고 나서야 후보 ${best}${이가(best)} 정해집니다.`,
  );
}

/** 전개 입력의 고르기 전부. */
function sweepPicks(): string {
  const s = sweepTrace(WALK_N, WALK_EDGES, START);
  const rows = s.picks.map((p, i) => [
    String(i + 1),
    String(p.at),
    p.found < 0 ? "없음 — 되돌아간다" : String(p.found),
    String(2 * WALK_EDGES.length),
  ]);
  const found = s.picks.filter((p) => p.found >= 0).length;
  return withSentence(
    md(["고르기", "선 정점", "찾은 후보", "읽은 끝점"], rows, [0, 3]),
    `고르기 ${s.picks.length} 번 가운데 새 정점을 찾은 것은 ${found} 번이고, 읽은 끝점은 모두 ${s.reads} 개입니다.`,
  );
}

/** 같은 그래프에 두 방식을 적용해 읽은 원소 수를 나란히 센다. */
function sweepVsList(): string {
  const s = sweepTrace(WALK_N, WALK_EDGES, START);
  const build = 2 * WALK_EDGES.length;
  let listReads = 0;
  for (const v of WALK.order) listReads += (WALK.adj[v] as number[]).length;
  const l = build + listReads;
  return withSentence(
    md(
      ["방법", "읽은 원소", "되풀이한 단위", "결과"],
      [
        [
          "간선 목록을 고를 때마다 다시 읽는다",
          String(s.reads),
          `고르기 ${s.picks.length} 번`,
          show(s.order),
        ],
        [
          "이웃 목록을 한 번 만들어 둔다",
          String(l),
          `꺼내기 ${WALK.pops.length} 번`,
          show(WALK.order),
        ],
      ],
      [1],
    ),
    `두 결과가 ${same(s.order, WALK.order) ? "일치하고" : "다르고"}, 읽은 원소는 ${s.reads} 개와 ${l} 개입니다. ${l} 개는 이웃 목록을 만들 때 읽은 간선 끝점 ${build} 개와, 결과에 넣은 정점들의 이웃 목록에서 읽은 ${listReads} 개입니다.`,
  );
}

/** 별 모양에서 「고를 때마다 최솟값」과 「미리 정렬」 — 작은 셋은 둘 다 실행, 큰 하나는 최솟값 쪽만 식. */
function pickMinScale(): string {
  const formula = (v: number) => v * v - 1;
  const rows: string[][] = [];
  let matched = 0;
  for (const v of [10, 100, 1_000]) {
    const p = pickMinCounts(v, star(v), 0);
    const q = sortedCounts(v, star(v), 0);
    if (p.reads !== formula(v)) throw new Error("최솟값 방식의 식이 틀렸다");
    matched++;
    rows.push([comma(v), comma(p.reads), comma(q.reads + q.compares), "실행"]);
  }
  const q = sortedCounts(BIG, star(BIG), 0);
  rows.push([
    comma(BIG),
    comma(formula(BIG)),
    comma(q.reads + q.compares),
    "최솟값 쪽은 식, 정렬 쪽은 실행",
  ]);
  return withSentence(
    md(
      [
        "정점 V",
        "고를 때마다 최솟값 찾기",
        "정렬해 두고 앞에서 읽기",
        "센 방법",
      ],
      rows,
      [0, 1, 2],
    ),
    `두 열 모두 이웃 목록에서 읽은 원소 수이고, 정렬 쪽에는 정렬 함수가 비교한 횟수를 더했습니다. 실행한 ${matched} 줄에서 최솟값 쪽이 식 V² − 1 과 일치했고, 정점 ${comma(BIG)} 개의 최솟값 쪽은 그 식으로 낸 값입니다.`,
  );
}

/** 두 갈림의 네 조합을 두 입력에 적용해 결과를 낸다. */
function comboValues(): string {
  const rows: string[][] = [];
  let good = 0;
  let goodName = "";
  const wantA = dfsTraversal(WALK_N, WALK_EDGES, START);
  const wantB = dfsTraversal(FOUR_N, FOUR_EDGES, START);
  for (const sorted of [false, true]) {
    for (const descending of [false, true]) {
      const a = traced(WALK_N, WALK_EDGES, START, { sorted, descending }).order;
      const b = traced(FOUR_N, FOUR_EDGES, START, { sorted, descending }).order;
      const list = sorted ? "오름차순 정렬" : "입력 순서 그대로";
      const push = descending ? "큰 번호부터" : "작은 번호부터";
      if (same(a, wantA) && same(b, wantB)) {
        good++;
        goodName = `${list} · ${push}`;
      }
      rows.push([
        list,
        push,
        `${show(a)}${same(a, wantA) ? "" : " (다름)"}`,
        `${show(b)}${same(b, wantB) ? "" : " (다름)"}`,
      ]);
    }
  }
  return withSentence(
    md(["이웃 목록", "스택에 넣는 차례", "여섯 정점", "네 정점"], rows),
    `정본의 답은 여섯 정점이 ${show(wantA)}, 네 정점이 ${show(wantB)} 이고, 「(다름)」은 그와 다른 결과입니다. 두 입력에서 모두 정본과 같은 조합은 ${good} 개(${goodName})입니다.`,
  );
}

/** 여섯 정점에서 「정렬 안 함 + 작은 번호부터」가 우연히 맞은 까닭. */
function comboCoincide(): string {
  const raw = WALK.raw[START] as number[];
  const sorted = WALK.adj[START] as number[];
  const pushedA = [...raw];
  const pushedB = [...sorted].reverse();
  return columns([
    [
      "정렬 안 함 + 작은 번호부터",
      `adj[${START}] = ${show(raw)}`,
      `넣는 차례 ${pushedA.join(" · ")}`,
      `스택 ${show(pushedA)}`,
    ],
    [
      "정렬 + 큰 번호부터",
      `adj[${START}] = ${show(sorted)}`,
      `넣는 차례 ${pushedB.join(" · ")}`,
      `스택 ${show(pushedB)}`,
    ],
  ]);
}

/* ─────────────────── 「아이디어 상세」 ─────────────────── */

/** 먼저 알아 둘 개념 — 구간이 둘 이상 쌓인 첫 걸음. 그림과 (c) 가 이 걸음을 읽는다. */
export const SEG_STEP = WALK.pops.findIndex(
  (p) => segments(p.stack).length >= 2,
);

/** 먼저 알아 둘 개념 (c) — 한 시점의 구간을 하나씩 읽는다. */
function segRead(): string {
  const p = WALK.pops[SEG_STEP] as Pop;
  const rows = segments(p.stack).map((s) => {
    const adj = WALK.adj[s.owner] as number[];
    const pushed = [...adj].reverse();
    return [
      ownerName(s.owner),
      show(adj),
      pushed.join(" · "),
      show(s.values),
      String(s.values.at(-1)),
    ];
  });
  return withSentence(
    md(
      [
        "구간의 주인",
        "주인의 이웃 목록",
        "넣은 차례",
        "남은 것(아래 → 위)",
        "맨 위",
      ],
      rows,
    ),
    `${stepOf(SEG_STEP)} 직후의 스택 ${showStack(p.stack)}${을를(said(showStack(p.stack)))} 넣은 정점별로 끊은 것입니다.`,
  );
}

/** 먼저 알아 둘 개념 (d) — 걸음마다 구간과 그 주인. */
function segSteps(): string {
  const rows: string[][] = [
    ["T1", "—", showSegments([{ v: START, owner: -1 }]), "시작"],
  ];
  let ordered = 0;
  WALK.pops.forEach((p, k) => {
    const segs = segments(p.stack);
    const ranks = segs
      .map((s) => s.owner)
      .filter((o) => o >= 0)
      .map((o) => p.order.indexOf(o));
    if (ranks.every((r, i) => i === 0 || r > (ranks[i - 1] as number)))
      ordered++;
    const top = segs.at(-1);
    rows.push([
      stepOf(k),
      String(p.node),
      showSegments(p.stack),
      top ? ownerName(top.owner) : "—",
    ]);
  });
  return withSentence(
    md(["걸음", "꺼낸 정점", "구간(아래 → 위)", "맨 위 구간의 주인"], rows),
    `꺼내기 ${WALK.pops.length} 번 가운데 구간의 주인이 아래에서 위로 방문 차례대로 놓인 걸음은 ${ordered} 번입니다.`,
  );
}

/** 먼저 알아 둘 개념 (e) — 재귀의 호출 스택(지금 경로)과 이 스택. */
function segVsPath(): string {
  const rows: string[][] = [];
  let equal = 0;
  let count = 0;
  WALK.pops.forEach((p, k) => {
    if (!p.fresh) return;
    const path = pathAt(WALK, k);
    const st = p.stack.map((it) => it.v);
    count++;
    if (same(path, st)) equal++;
    rows.push([stepOf(k), String(p.node), show(path), show(st)]);
  });
  return withSentence(
    md(
      ["걸음", "결과에 넣은 정점", "지금 경로", "이 절차의 스택(아래 → 위)"],
      rows,
    ),
    `정점을 결과에 넣은 ${count} 개 시점에서 두 줄이 같은 시점은 ${equal} 개입니다.`,
  );
}

/** 1단계 — 이웃 목록을 만들고 정렬한다. */
function buildSort(): string {
  const rows = WALK.raw.map((l, v) => [
    String(v),
    show(l),
    show(WALK.adj[v] as number[]),
    String(l.length),
  ]);
  const total = WALK.raw.reduce((a, l) => a + l.length, 0);
  const changed = WALK.raw
    .map((l, v) => ({ v, moved: !same(l, WALK.adj[v] as number[]) }))
    .filter((x) => x.moved)
    .map((x) => x.v);
  return withSentence(
    md(["정점 v", "만든 직후", "정렬 뒤", "길이"], rows, [0, 3]),
    `길이를 모두 더하면 ${total} 이고, 간선 ${WALK_EDGES.length} 개의 두 배입니다. 정렬로 차례가 바뀐 목록은 정점 ${changed.join(" · ")} 의 것 ${changed.length} 개입니다.`,
  );
}

/** 2단계 — 결과에 넣은 정점마다 새로 쌓인 구간. */
function buildPush(): string {
  const rows: string[][] = [];
  let desc = 0;
  let fresh = 0;
  WALK.pops.forEach((p, k) => {
    if (!p.fresh) return;
    fresh++;
    const adj = WALK.adj[p.node] as number[];
    const ok =
      p.pushed.every((x, i) => i === 0 || x < (p.pushed[i - 1] as number)) &&
      (p.pushed.length === 0 || p.pushed.at(-1) === adj[0]);
    if (ok) desc++;
    rows.push([
      stepOf(k),
      String(p.node),
      show(adj),
      p.pushed.length === 0 ? "—" : show(p.pushed),
      p.pushed.length === 0 ? "—" : String(p.pushed.at(-1)),
    ]);
  });
  return withSentence(
    md(
      [
        "걸음",
        "결과에 넣은 정점",
        "이웃 목록",
        "새 구간(아래 → 위)",
        "구간의 맨 위",
      ],
      rows,
    ),
    `새 구간 ${fresh} 개 가운데 아래에서 위로 번호가 줄고 맨 위가 목록의 첫 칸인 것은 ${desc} 개입니다.`,
  );
}

/** 3단계 — 같은 정점이 스택에 두 번 들어가는 네 정점 그래프를 끝까지. */
function buildDup(): string {
  const rows: string[][] = [["T1", "—", "—", "시작", "[]", show([START])]];
  FOUR.pops.forEach((p, k) => {
    rows.push([
      stepOf(k),
      String(p.node),
      p.fresh ? "거짓" : "참",
      p.fresh ? "① 결과에 넣고 이웃을 넣는다" : "② 버린다",
      show(p.order),
      showStack(p.stack),
    ]);
  });
  const counts = new Map<number, number>([[START, 1]]);
  for (const p of FOUR.pops) {
    for (const w of p.pushed) counts.set(w, (counts.get(w) ?? 0) + 1);
  }
  const twice = [...counts.entries()]
    .filter(([, c]) => c >= 2)
    .map(([v]) => v)
    .sort((a, b) => a - b);
  const dropped = FOUR.pops.filter((p) => !p.fresh).length;
  return withSentence(
    md(
      [
        "걸음",
        "꺼낸 정점",
        "꺼낸 순간의 visited",
        "한 일",
        "order",
        "스택(아래 → 위)",
      ],
      rows,
    ),
    `스택에 들어간 원소 ${FOUR.pushes} 개 가운데 꺼내자마자 버린 것은 ${dropped} 개입니다. 두 번 이상 들어간 정점은 ${twice.join(" · ")} 이고, 결과 ${show(FOUR.order)} 에는 정점마다 한 번씩만 들어 있습니다.`,
  );
}

/** 이 방법이 기대는 전제 — 맨 위(나중에 넣은 것)에서 꺼낸다. */
function premiseQueue(): string {
  const cases: { label: string; n: number; edges: Edge[] }[] = [
    { label: "여섯 정점", n: WALK_N, edges: WALK_EDGES },
    { label: "네 정점", n: FOUR_N, edges: FOUR_EDGES },
  ];
  const rows = cases.map((c) => {
    const a = dfsTraversal(c.n, c.edges, START);
    const b = queueOrder(c.n, c.edges, START);
    return [c.label, show(a), show(b), same(a, b) ? "같다" : "다르다"];
  });
  const diff = rows.filter((r) => r[3] === "다르다").length;
  return withSentence(
    md(["입력", "맨 위에서 꺼내기(정본)", "맨 앞에서 꺼내기", "두 결과"], rows),
    `두 입력 가운데 결과가 다른 입력은 ${diff} 개입니다.`,
  );
}

/** 설계 선택 — 재귀로 적으면 호출 깊이가 그대로 사슬 길이가 된다. */
function designRecursion(): string {
  const rows: string[][] = [];
  for (const v of [1_000, BIG]) {
    const edges = chain(v);
    let byRecursion: string;
    try {
      byRecursion = `길이 ${comma(recursive(v, edges, 0).length)} 배열`;
    } catch (e) {
      byRecursion = `${(e as Error).constructor.name} 로 멈춘다`;
    }
    rows.push([
      comma(v),
      byRecursion,
      `길이 ${comma(dfsTraversal(v, edges, 0).length)} 배열`,
    ]);
  }
  return md(["사슬 길이", "재귀", "스택 배열"], rows, [0]);
}

/* ─────────────────── 「수행으로 알아보는 알고리즘」 ─────────────────── */

function walkInput(): string {
  const want = show(dfsTraversal(WALK_N, WALK_EDGES, START));
  return [
    `const n = ${WALK_N};`,
    `const edges: [number, number][] = [${WALK_EDGES.map(([u, v]) => `[${u}, ${v}]`).join(", ")}];`,
    `const start = ${START};`,
    `// 이 절이 끝나면 ${want}${이가(said(want))} 나와야 한다`,
  ].join("\n");
}

function walkAdj(): string {
  const rows: string[][] = [["정렬 전", "정렬 후"]];
  WALK.raw.forEach((l, v) => {
    rows.push([
      `adj[${v}] = ${show(l)}`,
      `adj[${v}] = ${show(WALK.adj[v] as number[])}`,
    ]);
  });
  return columns(rows, "      ");
}

/** 짚고 가기 — 정렬하던 줄을 지우면 결과가 간선을 적은 차례에 좌우된다. */
function mutantUnsorted(): string {
  const cases = [WALK_EDGES, WALK_EDGES_SORTED];
  const rows = cases.map((edges) => {
    const good = dfsTraversal(WALK_N, edges, START);
    const bad = unsorted.dfsTraversal(WALK_N, edges, START);
    return [
      edgeList(edges),
      show(good),
      show(bad),
      same(good, bad) ? "같다" : "어긋난다",
    ];
  });
  return md(["입력 간선 목록", "정렬함", "정렬 안 함", "두 답"], rows);
}

/** 짚고 가기 — 정렬 없이 첫 걸음에서 무엇이 나오는가. 사본을 변이의 답과 맞댄다. */
function mutantUnsortedTrace(): string {
  const run = traced(WALK_N, WALK_EDGES, START, {
    sorted: false,
    descending: true,
  });
  if (live(unsorted)) {
    const bad = unsorted.dfsTraversal(WALK_N, WALK_EDGES, START);
    if (!same(run.order, bad))
      throw new Error("정렬을 뺀 사본이 변이와 다른 답을 냈다");
  }
  const first = run.pops[0] as Pop;
  const second = run.pops[1] as Pop;
  return columns([
    [
      `adj[${START}] = ${show(run.adj[START] as number[])}`,
      "만들어진 차례 그대로다",
    ],
    [
      "큰 번호부터 넣는다",
      `뒤에서 앞으로 ${first.pushed.join(" · ")} 순으로 넣는다`,
      `스택 ${showStack(first.stack)}`,
    ],
    [
      "맨 위를 꺼낸다",
      `${second.node}${이가(second.node)} 나온다`,
      `order ${show(second.order)}`,
    ],
  ]);
}

function walkInit(): string {
  const visited = Array.from({ length: WALK_N }, () => false);
  return [
    `visited = [${visited.join(", ")}]`,
    "order   = []",
    `stack   = ${show([START])}`,
    "           ↑ 맨 위",
  ].join("\n");
}

/** 3 — 정렬한 이웃 목록을 두 방향으로 넣었을 때 맨 위. */
function walkPushDir(): string {
  const list = WALK.adj[START] as number[];
  const back = [...list].reverse();
  const front = [...list];
  return columns([
    [
      "뒤에서 앞으로",
      `넣는 차례 ${back.join(" · ")}`,
      `스택 ${show(back)}`,
      `맨 위 ${back.at(-1)}`,
    ],
    [
      "앞에서 뒤로",
      `넣는 차례 ${front.join(" · ")}`,
      `스택 ${show(front)}`,
      `맨 위 ${front.at(-1)}`,
    ],
  ]);
}

/** 짚고 가기 — 방문 표시를 넣을 때 하면 어디서 갈리는가. */
function pauseMark(): string {
  const cases: { label: string; n: number; edges: Edge[] }[] = [
    { label: "전개가 쓰는 여섯 정점", n: WALK_N, edges: WALK_EDGES },
    { label: "네 정점 그래프", n: FOUR_N, edges: FOUR_EDGES },
  ];
  const rows = cases.map((c) => {
    const a = traced(c.n, c.edges, START);
    const b = markOnPush(c.n, c.edges, START);
    return [
      c.label,
      show(a.order),
      show(b.order),
      same(a.order, b.order) ? "같다" : "다르다",
      String(a.pushes),
      String(b.pushes),
    ];
  });
  return md(
    [
      "입력",
      "꺼낼 때 표시(정본)",
      "넣을 때 표시",
      "두 결과",
      "스택에 넣은 원소(꺼낼 때 표시)",
      "스택에 넣은 원소(넣을 때 표시)",
    ],
    rows,
    [4, 5],
  );
}

/** 짚고 가기 — 네 정점 그래프를 넣을 때 표시하면. */
function pauseMarkTrace(): string {
  const b = markOnPush(FOUR_N, FOUR_EDGES, START);
  const rows = b.steps.map((s, i) => [
    String(s.node),
    s.marked.length === 0 ? "없음" : s.marked.join(" · "),
    show(s.stack),
    show(b.order.slice(0, i + 1)),
  ]);
  const want = dfsTraversal(FOUR_N, FOUR_EDGES, START);
  const at = b.order.findIndex((v, i) => v !== want[i]);
  return withSentence(
    md(["꺼낸 정점", "표시하며 넣은 정점", "스택(아래 → 위)", "order"], rows),
    `처음 갈리는 자리는 결과의 ${at + 1} 번째 칸입니다. 넣을 때 표시하면 정점 ${b.order[at]}, 정본은 정점 ${want[at]} 입니다.`,
  );
}

/** 4 — 걸음 전부의 조건 판정. */
function walkTrace(): string {
  const rows: string[][] = [
    [
      "T1",
      "—",
      "스택에 `start` 를 넣는다",
      "[]",
      showStack([{ v: START, owner: -1 }]),
    ],
  ];
  const one: string[] = [];
  const two: string[] = [];
  WALK.pops.forEach((p, k) => {
    (p.fresh ? one : two).push(stepOf(k));
    rows.push([
      stepOf(k),
      String(p.node),
      `\`visited[${p.node}]\`${이가(p.node)} **${p.fresh ? "거짓" : "참"}** → ${p.fresh ? "①" : "②"}`,
      show(p.order),
      showStack(p.stack),
    ]);
  });
  rows.push([
    END_STEP,
    "—",
    "`stack.length > 0` 이 **거짓**",
    show(WALK.order),
    "[]",
  ]);
  const degSum = WALK.order.reduce(
    (a, v) => a + (WALK.adj[v] as number[]).length,
    0,
  );
  return withSentence(
    md(["걸음", "꺼낸 정점", "조건 판정", "order", "스택(아래 → 위)"], rows),
    `① 은 ${one.join(" · ")} 에서 ${one.length} 번, ② 는 ${two.join(" · ")} 에서 ${two.length} 번 실행됐습니다. 꺼내기 ${WALK.pops.length} 번은 시작 정점 1 개에 결과에 넣은 정점들의 이웃 목록 길이의 합 ${degSum}${을를(degSum)} 더한 값이고, 반환값은 ${show(WALK.order)} 입니다.`,
  );
}

function walkResult(): string {
  const cases: { call: string; run: () => number[] }[] = [
    {
      call: "dfsTraversal(6, [[0,2],[0,1],[1,3],[2,4]], 0)",
      run: () => dfsTraversal(WALK_N, WALK_EDGES, START),
    },
    {
      call: "dfsTraversal(4, [[0,1],[1,2],[2,3]], 2)",
      run: () => dfsTraversal(4, chain(4), 2),
    },
    {
      call: "dfsTraversal(5, [[0,1],[2,3]], 0)",
      run: () =>
        dfsTraversal(
          5,
          [
            [0, 1],
            [2, 3],
          ],
          0,
        ),
    },
    {
      call: "dfsTraversal(3, [[0,0],[0,1],[0,1]], 0)",
      run: () =>
        dfsTraversal(
          3,
          [
            [0, 0],
            [0, 1],
            [0, 1],
          ],
          0,
        ),
    },
    {
      call: "dfsTraversal(3, [[0,1]], 2)",
      run: () => dfsTraversal(3, [[0, 1]], 2),
    },
    { call: "dfsTraversal(1, [], 0)", run: () => dfsTraversal(1, [], 0) },
  ];
  return columns(cases.map((c) => [c.call, "→", show(c.run())]));
}

/* ─────────────────── 「알아 두면 좋은 개념」 ─────────────────── */

/** 되돌아간 걸음 — 꺼낸 원소의 주인이 직전에 결과에 넣은 정점이 아닌 걸음. */
function relatedBacktrack(): string {
  const rows: string[][] = [];
  let back = 0;
  WALK.pops.forEach((p, k) => {
    if (k === 0) return;
    const latest = (WALK.pops[k - 1] as Pop).order.at(-1) as number;
    const isBack = p.owner !== latest;
    if (isBack) back++;
    rows.push([
      stepOf(k),
      String(p.node),
      ownerName(p.owner),
      `정점 ${latest}`,
      isBack ? "예" : "아니오",
    ]);
  });
  return withSentence(
    md(
      [
        "걸음",
        "꺼낸 정점",
        "그 원소를 넣은 정점",
        "지금까지 마지막으로 결과에 넣은 정점",
        "되돌아감",
      ],
      rows,
    ),
    `첫 꺼내기를 뺀 ${rows.length} 번 가운데 되돌아간 걸음은 ${back} 번입니다.`,
  );
}

/* ─────────────────── 「최적인 문제의 모양」 ─────────────────── */

function fitVsDistance(): string {
  const dist = bfsShortestPath(WALK_N, WALK_EDGES, START);
  const rows = Array.from({ length: WALK_N }, (_, v) => {
    const at = WALK.order.indexOf(v);
    return [
      String(v),
      at < 0 ? "결과에 없다" : `${at + 1} 번째`,
      String(dist[v]),
    ];
  });
  return md(
    ["정점", "처음 방문한 차례", `정점 ${START} 에서의 최단 간선 수`],
    rows,
    [0, 2],
  );
}

/* ─────────────────── 「수식 정의와 유도」 ─────────────────── */

const reach = (run: Run): number[] => [...run.order].sort((a, b) => a - b);

function mathCheck(): string {
  const r = reach(WALK);
  const degs = r.map((v) => (WALK.adj[v] as number[]).length);
  const q = 1 + degs.reduce((a, b) => a + b, 0);
  const outside = Array.from({ length: WALK_N }, (_, v) => v).filter(
    (v) => !r.includes(v),
  );
  return columns([
    [`R(${START}) = {${r.join(", ")}}`, `deg = ${degs.join(" · ")}`],
    [`Q(${START}) = 1 + (${degs.join(" + ")}) = ${q}`],
    [
      "전개에서 실제로 꺼낸 횟수",
      `${stepOf(0)} 부터 ${stepOf(WALK.pops.length - 1)} 까지 ${WALK.pops.length} 번`,
    ],
    ...outside.map((v) => [
      `정점 ${v} 는 R(${START}) 밖`,
      `deg(${v}) = ${(WALK.adj[v] as number[]).length}`,
    ]),
  ]);
}

function mathCode(): string {
  const r = reach(WALK);
  let inserts = 1;
  for (const v of r) inserts += (WALK.adj[v] as number[]).length;
  return [
    "let inserts = 1;",
    "for (const v of reachable) inserts += (adj[v] as number[]).length;",
    `inserts; // → ${inserts} (전개에서 센 꺼내기 횟수와 같다)`,
  ].join("\n");
}

function mathEquality(): string {
  const other: Edge[] = [
    [0, 1],
    [2, 3],
  ];
  const run = traced(5, other, 0);
  const outside = Array.from({ length: WALK_N }, (_, v) => v).filter(
    (v) => !WALK.order.includes(v),
  );
  return columns([
    [
      "전개 입력",
      `R(${START}) 밖 정점의 deg 합 ${outside.reduce((a, v) => a + (WALK.adj[v] as number[]).length, 0)}`,
      `Q(${START}) = ${WALK.pushes}`,
      `1 + 2E = ${1 + 2 * WALK_EDGES.length}`,
    ],
    [
      edgeList(other),
      `R(0) = {${reach(run).join(", ")}}`,
      `Q(0) = ${run.pushes}`,
      `1 + 2E = ${1 + 2 * other.length}`,
    ],
  ]);
}

function mathSort(): string {
  const byDeg = new Map<number, number>();
  for (const l of WALK.adj) byDeg.set(l.length, (byDeg.get(l.length) ?? 0) + 1);
  const rows = [...byDeg.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([d, c]) => {
      const term = d > 1 ? d * Math.log2(d) : 0;
      return [
        `deg ${d} 인 정점 ${c} 개`,
        d > 1
          ? `${d} × log₂ ${d} = ${term}`
          : d === 1
            ? "1 × log₂ 1 = 0"
            : "목록이 비었다",
        `합 ${term * c}`,
      ];
    });
  return [columns(rows), "", `S = ${sortTerm(WALK.adj)}`].join("\n");
}

function mathBound(): string {
  const v = 1_000;
  const cases: { label: string; n: number; edges: Edge[] }[] = [
    { label: `별 모양 V = ${comma(v)}`, n: v, edges: star(v) },
    { label: `사슬 V = ${comma(v)}`, n: v, edges: chain(v) },
    { label: "전개 입력", n: WALK_N, edges: WALK_EDGES },
  ];
  const rows = cases.map((c) => {
    const adj = adjacency(c.n, c.edges, true);
    const delta = Math.max(...adj.map((l) => l.length));
    const s = sortTerm(adj);
    const bound = 2 * c.edges.length * Math.log2(delta);
    return [
      c.label,
      comma(c.edges.length),
      comma(delta),
      comma(Math.round(s)),
      comma(Math.round(bound)),
    ];
  });
  return withSentence(
    md(["그래프", "E", "Δ", "S", "2E log₂ Δ"], rows, [1, 2, 3, 4]),
    "S 와 상한은 소수점 아래를 반올림했습니다.",
  );
}

function mathScale(): string {
  const edges = star(BIG);
  edges.push([1, 2]);
  const adj = adjacency(BIG, edges, true);
  const delta = Math.max(...adj.map((l) => l.length));
  const run = traced(BIG, edges, 0, LARGE);
  const s = sortTerm(adj);
  const bound = 2 * edges.length * Math.log2(delta);
  return withSentence(
    md(
      ["항", "세는 것", `V = E = ${comma(BIG)} 에서`],
      [
        ["배열 만들기", "정점마다 `visited` 한 칸", comma(BIG)],
        ["이웃 목록 만들기", "간선마다 두 번 넣는다", comma(2 * edges.length)],
        ["목록 정렬", "S = Σ deg(v) log₂ deg(v)", comma(Math.round(s))],
        ["스택에 넣기", "Q(s) = 1 + Σ deg(v)", comma(run.pushes)],
      ],
      [2],
    ),
    `입력은 정점 0 에 나머지를 모두 잇고 간선 [1,2] 하나를 더한 것이라 Δ = ${comma(delta)} 입니다. 정렬 항의 상한 2E log₂ Δ 는 ${comma(Math.round(bound))} 이고, 네 항 가운데 가장 큰 것은 정렬 항입니다. S 와 상한은 소수점 아래를 반올림했습니다.`,
  );
}

/* ─────────────────── 「불변식」 ─────────────────── */

/** 스택이 구간으로 끊겼을 때 두 성질 — 주인이 방문 차례대로 · 구간 안이 내림차순 — 을 잰다. */
function checkInvariant(run: Run): {
  points: number;
  badOrder: number;
  badDesc: number;
} {
  let points = 0;
  let badOrder = 0;
  let badDesc = 0;
  for (const p of run.pops) {
    points++;
    const segs = segments(p.stack);
    const ranks = segs
      .map((s) => s.owner)
      .filter((o) => o >= 0)
      .map((o) => p.order.indexOf(o));
    if (!ranks.every((r, i) => i === 0 || r > (ranks[i - 1] as number)))
      badOrder++;
    if (
      !segs.every((s) =>
        s.values.every((x, i) => i === 0 || x <= (s.values[i - 1] as number)),
      )
    )
      badDesc++;
  }
  return { points, badOrder, badDesc };
}

function invariantCheck(): string {
  const seed = 20260930;
  const cases: { label: string; n: number; edges: Edge[] }[] = [
    { label: "전개가 쓰는 여섯 정점", n: WALK_N, edges: WALK_EDGES },
    { label: "네 정점 그래프", n: FOUR_N, edges: FOUR_EDGES },
    { label: "별 모양 V = 50", n: 50, edges: star(50) },
    {
      label: `무작위 V = 60 · E = 120 (시드 ${seed})`,
      n: 60,
      edges: randomGraph(60, 120, seed),
    },
  ];
  let total = 0;
  let broken = 0;
  const rows = cases.map((c) => {
    const r = checkInvariant(traced(c.n, c.edges, START));
    total += r.points;
    broken += r.badOrder + r.badDesc;
    return [c.label, String(r.points), String(r.badOrder), String(r.badDesc)];
  });
  return withSentence(
    md(
      [
        "입력",
        "확인한 시점(꺼내기 수)",
        "주인이 방문 차례가 아닌 시점",
        "구간 안이 내림차순이 아닌 시점",
      ],
      rows,
      [1, 2, 3],
    ),
    `네 입력의 ${total} 개 시점에서 두 성질이 깨진 시점은 ${broken} 개입니다.`,
  );
}

function invariantEdges(): string {
  const cases: {
    label: string;
    n: number;
    edges: Edge[];
    s: number;
  }[] = [
    { label: "정점 하나", n: 1, edges: [], s: 0 },
    { label: "간선 없음", n: 2, edges: [], s: 1 },
    { label: "고립된 시작 정점", n: 3, edges: [[0, 1]], s: 2 },
    {
      label: "떨어진 두 조각",
      n: 5,
      edges: [
        [0, 1],
        [2, 3],
      ],
      s: 0,
    },
    {
      label: "자기 루프",
      n: 2,
      edges: [
        [0, 0],
        [0, 1],
      ],
      s: 0,
    },
    {
      label: "중복 간선",
      n: 2,
      edges: [
        [0, 1],
        [0, 1],
      ],
      s: 0,
    },
  ];
  const rows = cases.map((c) => {
    const run = traced(c.n, c.edges, c.s);
    const got = dfsTraversal(c.n, c.edges, c.s);
    const dropped = run.pops.filter((p) => !p.fresh).length;
    return [
      c.label,
      `\`dfsTraversal(${c.n}, ${edgeList(c.edges)}, ${c.s})\``,
      show(got),
      String(run.pushes),
      String(dropped),
    ];
  });
  return md(
    ["입력", "호출", "결과", "스택에 넣은 원소", "꺼내자마자 버린 원소"],
    rows,
    [3, 4],
  );
}

function mutantPushOrder(): string {
  return md(
    ["입력", "큰 번호부터 넣는 코드", "작은 번호부터 넣는 코드", "두 답"],
    mutantRows.map((r) => [
      r.label,
      show(r.correct),
      show(r.broken),
      same(r.correct, r.broken) ? "같다" : "어긋난다",
    ]),
  );
}

/* ─────────────────── 「비용 계산」 ─────────────────── */

function perfDerive(): string {
  const rows: string[][] = [];
  WALK.pops.forEach((p, k) => {
    rows.push([
      stepOf(k),
      String(p.node),
      p.fresh ? "①" : "②",
      p.fresh ? String((WALK.adj[p.node] as number[]).length) : "읽지 않는다",
    ]);
  });
  const unreached = Array.from({ length: WALK_N }, (_, v) => v).filter(
    (v) => !WALK.order.includes(v),
  );
  const sum = WALK.pops.reduce((a, p) => a + p.pushed.length, 0);
  return withSentence(
    md(["걸음", "꺼낸 정점", "갈래", "읽은 이웃 목록 길이"], rows),
    `① 에서 읽은 목록 길이를 더하면 ${sum} 이고, 시작 정점 1 개를 더한 ${sum + 1}${이가(sum + 1)} 꺼내기 ${WALK.pops.length} 번과 일치합니다. 정점 ${unreached.join(" · ")} 는 스택에 한 번도 안 들어가 목록을 읽지 않습니다.`,
  );
}

function perfSpread(): string {
  const cases: { label: string; edges: Edge[] }[] = [
    { label: "별 모양", edges: star(BIG) },
    { label: "사슬", edges: chain(BIG) },
  ];
  const vals = cases.map((c) => {
    const adj = adjacency(BIG, c.edges, true);
    return {
      label: c.label,
      e: c.edges.length,
      longest: Math.max(...adj.map((l) => l.length)),
      s: Math.round(sortTerm(adj)),
    };
  });
  const a = vals[0] as (typeof vals)[number];
  const b = vals[1] as (typeof vals)[number];
  return withSentence(
    md(
      ["모양", "간선", "가장 긴 목록", "정렬 항 S"],
      vals.map((v) => [v.label, comma(v.e), comma(v.longest), comma(v.s)]),
      [1, 2, 3],
    ),
    `두 모양 모두 정점 ${comma(BIG)} 개를 간선 ${comma(a.e)} 개로 이었고, 정렬 항은 ${(a.s / b.s).toFixed(1)} 배 차이가 납니다. S 는 소수점 아래를 반올림했습니다.`,
  );
}

function perfWorst(): string {
  const cases: { label: string; edges: Edge[] }[] = [
    { label: "별 모양", edges: star(BIG) },
    { label: "사슬", edges: chain(BIG) },
  ];
  const rows = cases.map((c) => {
    const run = traced(BIG, c.edges, 0, LARGE);
    return [
      c.label,
      comma(c.edges.length),
      comma(Math.max(...run.adj.map((l) => l.length))),
      comma(Math.round(sortTerm(run.adj))),
      comma(run.maxStack),
      comma(Math.max(...run.depth)),
    ];
  });
  return withSentence(
    md(
      [
        "입력",
        "간선",
        "가장 긴 목록",
        "정렬 항 S",
        "스택에 한꺼번에 남은 원소의 최대",
        "가장 깊은 정점의 깊이",
      ],
      rows,
      [1, 2, 3, 4, 5],
    ),
    `두 입력 다 정점 ${comma(BIG)} 개를 간선 ${comma(BIG - 1)} 개로 이은 것입니다. 깊이는 결과에 넣을 때 그 원소를 넣은 정점의 깊이에 1 을 더한 값이고, 시작 정점이 0 입니다.`,
  );
}

/* ─────────────────── 「스스로 점검하기」 ─────────────────── */

/** 물음 — T3 한 줄. */
const SELF_K = 1;

function selfcheckT3(): string {
  const p = WALK.pops[SELF_K] as Pop;
  const skip = p.pushed.at(-1) as number;
  return columns([
    [
      stepOf(SELF_K),
      `${p.node}${을를(p.node)} 꺼낸다`,
      `① order 에 ${p.node}`,
      `넣은 차례 ${p.pushed.join(" · ")}`,
      `스택 ${showStack(p.stack)}`,
    ],
    ["", "", "", `← 여기서 ${skip}${을를(skip)} 안 넣으면?`],
  ]);
}

/** 답 — T3 에서 이미 결과에 있는 이웃을 넣지 않으면. */
function selfcheckSkip(): string {
  const adj = WALK.adj;
  const visited = Array.from({ length: WALK_N }, () => false);
  const order: number[] = [];
  const stack: number[] = [START];
  const rows: string[][] = [];
  let pops = 0;
  const skip = (WALK.pops[SELF_K] as Pop).pushed.at(-1) as number;
  while (stack.length > 0) {
    const node = stack.pop() as number;
    pops++;
    if (visited[node] === true) {
      rows.push([String(node), "② 버린다", show(order), show(stack)]);
      continue;
    }
    visited[node] = true;
    order.push(node);
    const list = adj[node] as number[];
    for (let i = list.length - 1; i >= 0; i--) {
      const w = list[i] as number;
      if (pops === SELF_K + 1 && w === skip) continue;
      stack.push(w);
    }
    rows.push([String(node), "① 결과에 넣는다", show(order), show(stack)]);
  }
  return withSentence(
    md(["꺼낸 정점", "한 일", "order", "스택(아래 → 위)"], rows),
    `결과는 ${show(order)} 이고 정본의 답 ${show(WALK.order)}${과와(said(show(WALK.order)))} ${same(order, WALK.order) ? "같습니다" : "다릅니다"}. 꺼내기는 ${WALK.pops.length} 번에서 ${pops} 번이 됩니다.`,
  );
}

/* ───────────────── 그림 사이드카가 쓰는 수 — 시도 사다리 ───────────────── */

/**
 * 「아이디어를 떠올리는 과정」의 시도 넷에 붙는 수. 규모 V = 100,000 의 두 값은 위 표와 같은
 * 식이고, 그 식은 작은 규모의 실행과 맞대어 확인했다(`naiveScale` · `pickMinScale`).
 */
export function ladderNumbers() {
  const ascending = traced(FOUR_N, FOUR_EDGES, START, {
    sorted: true,
    descending: false,
  });
  const q = sortedCounts(BIG, star(BIG), 0);
  return {
    big: BIG,
    sweepReads: (2 * BIG - 1) * 2 * (BIG - 1),
    minReads: BIG * BIG - 1,
    sortedReads: q.reads + q.compares,
    wrongGot: show(ascending.order),
    wrongWant: show(dfsTraversal(FOUR_N, FOUR_EDGES, START)),
    seconds: SEC,
  };
}
naiveScale();
pickMinScale();

/* ────────────────────────── 블록 ────────────────────────── */

export const PROOFS: Record<string, () => string> = {
  /** `concept` — 간선을 적은 차례와 상관없이 결과가 하나다. */
  "concept-rule": conceptRule,
  /** `concept` — 두 차례로 넣었을 때 먼저 나오는 값. */
  "concept-push": conceptPush,
  /** `deep.origin` ② — 가장 단순한 방법이 제약 규모에서 몇 번 읽는가. */
  "naive-scale": naiveScale,
  /** `deep.origin` ③ — 첫 고르기. */
  "sweep-first-pick": sweepFirstPick,
  /** `deep.origin` ③ — 고르기 전부. */
  "sweep-picks": sweepPicks,
  /** `deep.origin` ④ — 두 방식의 읽은 원소. */
  "sweep-vs-list": sweepVsList,
  /** `deep.origin` ⑤ — 최솟값 찾기와 미리 정렬. */
  "pick-min-scale": pickMinScale,
  /** `deep.origin` ⑤ — 네 조합. */
  "combo-values": comboValues,
  /** `deep.origin` ⑤ — 우연히 맞은 까닭. */
  "combo-coincide": comboCoincide,
  /** `deep.build` 개념 (c). */
  "seg-read": segRead,
  /** `deep.build` 개념 (d). */
  "seg-steps": segSteps,
  /** `deep.build` 개념 (e). */
  "seg-vs-path": segVsPath,
  /** `deep.build` 1단계. */
  "build-sort": buildSort,
  /** `deep.build` 2단계. */
  "build-push": buildPush,
  /** `deep.build` 3단계. */
  "build-dup": buildDup,
  /** `deep.build` 전제. */
  "premise-queue": premiseQueue,
  /** `deep.build` 설계 선택. */
  "design-recursion": designRecursion,
  /** `deep.walk` 도입. */
  "walk-input": walkInput,
  /** `deep.walk` 1. */
  "walk-adj": walkAdj,
  /** `deep.walk.pause` — 정렬을 빼면. */
  "mutant-unsorted": mutantUnsorted,
  /** `deep.walk.pause` — 정렬을 뺀 첫 걸음. */
  "mutant-unsorted-trace": mutantUnsortedTrace,
  /** `deep.walk` 2. */
  "walk-init": walkInit,
  /** `deep.walk` 3. */
  "walk-push-dir": walkPushDir,
  /** `deep.walk.pause` — 넣을 때 표시하면. */
  "pause-mark": pauseMark,
  /** `deep.walk.pause` — 넣을 때 표시한 자취. */
  "pause-mark-trace": pauseMarkTrace,
  /** `deep.walk` 4 — 걸음 전부. */
  "walk-trace": walkTrace,
  /** `deep.walk.final`. */
  "walk-result": walkResult,
  /** `related` — 되돌아간 걸음. */
  "related-backtrack": relatedBacktrack,
  /** `purpose.fit` — 방문 차례와 거리. */
  "fit-vs-distance": fitVsDistance,
  /** `deep.math` ② — 정의 검산. */
  "math-check": mathCheck,
  /** `deep.math` — 식을 옮긴 코드. */
  "math-code": mathCode,
  /** `deep.math` — 등호가 되는 자리. */
  "math-equality": mathEquality,
  /** `deep.math` — 정렬 항 검산. */
  "math-sort": mathSort,
  /** `deep.math` — 정렬 항과 상한. */
  "math-bound": mathBound,
  /** `deep.math` ④ — 계수. */
  "math-scale": mathScale,
  /** `invariant` ② — 여러 입력에서. */
  "invariant-check": invariantCheck,
  /** `invariant` ② — 경계 입력. */
  "invariant-edges": invariantEdges,
  /** `invariant` ③ — 변이. */
  "mutant-push-order": mutantPushOrder,
  /** `perf.derive`. */
  "perf-derive": perfDerive,
  /** `perf.bounds` — 같은 E 에서 갈리는 정렬 항. */
  "perf-spread": perfSpread,
  /** `perf.worst`. */
  "perf-worst": perfWorst,
  /** `selfcheck` — 물음. */
  "selfcheck-t3": selfcheckT3,
  /** `selfcheck` — 답. */
  "selfcheck-skip": selfcheckSkip,
};
