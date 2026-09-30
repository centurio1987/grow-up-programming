/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run tools/check-proof.ts src/algorithms/dp/treeMaxIndependentSet/treeMaxIndependentSet-guide.md
 *
 * **세는 사본과 기록 사본이 따로 있다.** 정본은 걸음마다의 상태도, 기본 연산 수도 내보내지 않는다.
 *
 * - `traced` — 정본과 같은 절차에 걸음 기록을 덧붙인 판. 걸음마다 DP 테이블 전체를 베끼므로
 *   전개 입력처럼 작은 입력에만 쓴다.
 * - `iterativeOps` — 정본이 하는 기본 연산만 세는 가벼운 판. 정점 100,000 개 같은 큰 입력은 이것만 쓴다.
 *
 * 비용의 기준은 원고 전체에서 하나다 — **기본 연산**. 간선 하나를 확인하는 일 · 정점 하나의 가중치를
 * 보는 일 · 이웃 목록에 항목 하나를 넣거나 읽는 일 · 자손 하나의 칸을 부모의 칸에 더하는 일을 각각
 * 한 번으로 센다. 메모리의 기준은 배열 칸 수다.
 *
 * **답이 맞는지는 사본이 아니라 정본이 진다** — 사본은 자기 답을 정본과 맞대고, 어긋나면 던진다.
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { 과와, 으로, 은는, 을를, 이가 } from "../../../../tools/josa.ts";
import { treeMaxIndependentSet } from "./treeMaxIndependentSet-guide.ref.ts";

export type Edge = [number, number];

const REF = new URL("./treeMaxIndependentSet-guide.ref.ts", import.meta.url)
  .pathname;

/* ────────────────────────── 칸 맞춤 ────────────────────────── */

/** 한글은 고정폭 화면에서 두 칸을 먹는다. 칸 맞춤을 글자 수로 하면 머리줄만 어긋난다. */
const width = (s: string): number =>
  [...s].reduce((n, c) => n + (/[ᄀ-ᇿ　-〿㄰-㆏가-힯一-鿿]/.test(c) ? 2 : 1), 0);

const pad = (s: string, to: number): string =>
  s + " ".repeat(Math.max(0, to - width(s)));

/** `10011001` → `10,011,001`. `toLocaleString` 은 환경에 따라 갈려서 직접 적는다. */
export const comma = (n: number | bigint): string =>
  String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

/** 자릿수가 21 을 넘으면 자리 수로 적는다 — `9.99 × 10^30102` 꼴. */
const big = (n: bigint): string => {
  const s = String(n);
  if (s.length <= 21) return comma(n);
  return `${s[0]}.${s.slice(1, 3)} × 10^${s.length - 1}`;
};

/** 열을 값의 폭에 맞춰 늘어놓는다(등폭 펜스용). */
function columns(rows: string[][], gap = "  "): string {
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

/** 펜스 블록의 속 — 대조는 펜스 줄 안쪽만 한다(`check-proof` 의 `extractBlocks`). 언어 태그는 원고가 단다. */
const fence = (_lang: "text" | "ts", body: string): string => body;

/** 집합 표기 — 원고 전체에서 `{0, 3, 4, 5}` 하나로 쓴다. */
export const setOf = (xs: readonly number[]): string =>
  `{${[...xs].sort((a, b) => a - b).join(", ")}}`;

const listOf = (xs: readonly number[]): string => `[${xs.join(", ")}]`;

/* ────────────────────────── 전개 입력 ────────────────────────── */

/** `deep.walk` 가 끝까지 쓰는 입력. 본문의 다른 자리도 이 값을 가리킨다. */
export const N = 7;
export const EDGES: Edge[] = [
  [0, 2],
  [0, 1],
  [1, 3],
  [1, 4],
  [2, 5],
  [5, 6],
];
export const W = [9, 8, -2, 5, 1, 7, 4];

/** 무방향 간선 목록을 이웃 목록으로. 정본이 첫 줄에서 하는 것과 같다. */
export function adjacency(n: number, edges: Edge[]): number[][] {
  const adj: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    (adj[u] as number[]).push(v);
    (adj[v] as number[]).push(u);
  }
  return adj;
}

/** 뿌리 0 에서 너비 우선으로 정한 방문 순서와 부모. 정본의 가운데 토막과 같다. */
export function bfsOrder(
  n: number,
  adj: number[][],
): { order: number[]; parent: number[] } {
  const order = new Array<number>(n).fill(0);
  const parent = new Array<number>(n).fill(-1);
  let tail = 1;
  for (let head = 0; head < tail; head++) {
    const v = order[head] as number;
    for (const u of adj[v] as number[]) {
      if (u === parent[v]) continue;
      parent[u] = v;
      order[tail] = u;
      tail++;
    }
  }
  return { order, parent };
}

/** 뿌리 0 기준의 자식 목록. 자식은 방문한 차례대로 담는다. */
export function childrenOf(n: number, edges: Edge[]): number[][] {
  const adj = adjacency(n, edges);
  const { order, parent } = bfsOrder(n, adj);
  const kids: number[][] = Array.from({ length: n }, () => []);
  for (let k = 1; k < n; k++) {
    const v = order[k] as number;
    (kids[parent[v] as number] as number[]).push(v);
  }
  return kids;
}

/** 정점 `v` 의 서브트리에 속한 정점 전부. */
export function subtree(kids: number[][], v: number): number[] {
  const out = [v];
  for (let i = 0; i < out.length; i++) {
    for (const u of kids[out[i] as number] as number[]) out.push(u);
  }
  return out;
}

/** 뿌리 0 에서의 깊이. */
export function depths(n: number, edges: Edge[]): number[] {
  const adj = adjacency(n, edges);
  const { order, parent } = bfsOrder(n, adj);
  const d = new Array<number>(n).fill(0);
  for (let k = 1; k < n; k++) {
    const v = order[k] as number;
    d[v] = (d[parent[v] as number] as number) + 1;
  }
  return d;
}

/* ────────────────── 걸음 기록 사본 — 작은 입력에만 쓴다 ────────────────── */

export type SnapKind = "build" | "init" | "bfs" | "fold" | "answer";

/** 걸음 하나가 끝난 뒤의 상태. `null` 은 아직 안 만든 칸이다. */
export interface Snap {
  readonly kind: SnapKind;
  readonly dp0: readonly (number | null)[];
  readonly dp1: readonly (number | null)[];
  readonly order: readonly (number | null)[];
  readonly parent: readonly (number | null)[];
  /** fold 걸음 — 읽은 자리 `k`, 자식 `v`, 부모 `p`, 그 걸음 전 부모의 두 칸. */
  readonly k?: number;
  readonly v?: number;
  readonly p?: number;
  readonly before?: { readonly dp0: number; readonly dp1: number };
  readonly answer?: number;
}

/**
 * 정본과 같은 순서로 실행하되 **걸음마다 DP 테이블 전체를 베껴 둔다.** 걸음 재생 패널과 본문 전개
 * 표의 출처다. 걸음마다 배열 넷을 베끼므로 큰 입력에는 쓰지 않는다. 답이 정본과 어긋나면 던진다.
 */
export function traced(
  n: number,
  edges: Edge[],
  weights: number[],
): { steps: Snap[]; adj: number[][]; answer: number } {
  const steps: Snap[] = [];
  const none = (): (number | null)[] => new Array<number | null>(n).fill(null);
  const adj = adjacency(n, edges);
  steps.push({
    kind: "build",
    dp0: none(),
    dp1: none(),
    order: none(),
    parent: none(),
  });
  const dp0 = new Array<number>(n).fill(0);
  const dp1 = [...weights];
  steps.push({
    kind: "init",
    dp0: [...dp0],
    dp1: [...dp1],
    order: none(),
    parent: none(),
  });
  const { order, parent } = bfsOrder(n, adj);
  steps.push({
    kind: "bfs",
    dp0: [...dp0],
    dp1: [...dp1],
    order: [...order],
    parent: [...parent],
  });
  for (let k = n - 1; k >= 1; k--) {
    const v = order[k] as number;
    const p = parent[v] as number;
    const before = { dp0: dp0[p] as number, dp1: dp1[p] as number };
    dp0[p] = (dp0[p] as number) + Math.max(dp0[v] as number, dp1[v] as number);
    dp1[p] = (dp1[p] as number) + (dp0[v] as number);
    steps.push({
      kind: "fold",
      dp0: [...dp0],
      dp1: [...dp1],
      order: [...order],
      parent: [...parent],
      k,
      v,
      p,
      before,
    });
  }
  const answer = Math.max(dp0[0] as number, dp1[0] as number);
  steps.push({
    kind: "answer",
    dp0: [...dp0],
    dp1: [...dp1],
    order: [...order],
    parent: [...parent],
    answer,
  });
  if (answer !== treeMaxIndependentSet(n, edges, weights)) {
    throw new Error("기록 사본의 답이 정본과 어긋난다");
  }
  return { steps, adj, answer };
}

/** 전개 입력의 기록. 그림 사이드카도 이것을 쓴다. */
export const WALK = traced(N, EDGES, W);

/** 걸음 차례 `i`(0 부터)의 원고 번호. */
export const stepOf = (i: number): string => `T${i + 1}`;

/** 두 칸이 모두 채워진 뒤의 DP 테이블. */
export const FINAL = WALK.steps.at(-1) as Snap;

/** 정점 안에 적는 두 칸 — 앞이 `dp0`, 뒤가 `dp1`. */
export const cellOf = (s: Snap, v: number): string =>
  s.dp0[v] === null ? "" : `${s.dp0[v]} · ${s.dp1[v]}`;

/* ────────────────── 정의를 그대로 옮긴 전수 계산 ────────────────── */

/**
 * 정의를 그대로 옮긴 전수 계산 — 서브트리의 부분집합을 **전부** 만들어 독립인 것만 남기고
 * 합이 가장 큰 것을 고른다. `want` 가 참이면 `v` 를 담은 것 중에서, 거짓이면 안 담은 것 중에서
 * 고른다. 합이 같으면 먼저 만난 집합을 남긴다. 크기가 작을 때만 쓴다.
 */
export function bestSet(
  n: number,
  edges: Edge[],
  weights: number[],
  v: number,
  want: boolean,
): { sum: number; set: number[] } {
  const kids = childrenOf(n, edges);
  const nodes = subtree(kids, v);
  const idx = new Map(nodes.map((x, i) => [x, i]));
  const inner = edges.filter(([a, b]) => idx.has(a) && idx.has(b));
  let best = Number.NEGATIVE_INFINITY;
  let bestPick: number[] = [];
  for (let mask = 0; mask < 1 << nodes.length; mask++) {
    const has = (x: number) => ((mask >> (idx.get(x) as number)) & 1) === 1;
    if (has(v) !== want) continue;
    if (inner.some(([a, b]) => has(a) && has(b))) continue;
    let sum = 0;
    const pick: number[] = [];
    for (const x of nodes) {
      if (has(x)) {
        sum += weights[x] as number;
        pick.push(x);
      }
    }
    if (sum > best) {
      best = sum;
      bestPick = pick;
    }
  }
  return { sum: best, set: bestPick };
}

/** 그래프 전체의 독립집합을 전부 — 합이 큰 차례로. */
function allIndependent(
  n: number,
  edges: Edge[],
  weights: number[],
): { set: number[]; sum: number }[] {
  const out: { set: number[]; sum: number }[] = [];
  for (let mask = 0; mask < 1 << n; mask++) {
    if (edges.some(([a, b]) => (mask >> a) & 1 && (mask >> b) & 1)) continue;
    const set: number[] = [];
    let sum = 0;
    for (let i = 0; i < n; i++) {
      if ((mask >> i) & 1) {
        set.push(i);
        sum += weights[i] as number;
      }
    }
    out.push({ set, sum });
  }
  return out.sort((a, b) => b.sum - a.sum || a.set.length - b.set.length);
}

/* ────────────────────────── 비교판들 ────────────────────────── */

/** 부분집합을 전부 만들어 보는 방법. 간선 확인과 정점 가중치 보기를 기본 연산으로 센다. */
function bruteForce(
  n: number,
  edges: Edge[],
  weights: number[],
): { best: number; ops: number; independent: number } {
  let best = 0;
  let ops = 0;
  let independent = 0;
  for (let mask = 0; mask < 1 << n; mask++) {
    let ok = true;
    for (const [u, v] of edges) {
      ops++;
      if ((mask >> u) & 1 && (mask >> v) & 1) {
        ok = false;
        break;
      }
    }
    if (!ok) continue;
    independent++;
    let sum = 0;
    for (let i = 0; i < n; i++) {
      ops++;
      if ((mask >> i) & 1) sum += weights[i] as number;
    }
    if (sum > best) best = sum;
  }
  if (best !== treeMaxIndependentSet(n, edges, weights)) {
    throw new Error("전부 만들기가 정본과 다른 답을 냈다");
  }
  return { best, ops, independent };
}

/**
 * **정점마다 값 하나만** 들고 올라가는 판. `best[v]` 는 「v 의 서브트리에서 얻는 최댓값」
 * 하나이고, 부모가 그 값을 그대로 더한다 — 자식이 고른 정점이었는지를 부모가 알 수 없다.
 */
function oneValuePerNode(
  n: number,
  edges: Edge[],
  weights: number[],
): { answer: number; adds: number; best: number[] } {
  const adj = adjacency(n, edges);
  const { order, parent } = bfsOrder(n, adj);
  const best = new Array<number>(n).fill(0);
  let adds = 0;
  for (let k = n - 1; k >= 0; k--) {
    const v = order[k] as number;
    best[v] = (best[v] as number) + Math.max(0, weights[v] as number);
    if (k >= 1) {
      const p = parent[v] as number;
      adds++;
      best[p] = (best[p] as number) + (best[v] as number);
    }
  }
  return { answer: best[0] as number, adds, best };
}

/**
 * **정점마다 값 하나 · 손자까지 보는 판.** 부모가 자식의 값만 받으면 자식이 고른 정점이었는지
 * 알 수 없으므로, 「나를 고른다」 쪽을 손자에게서 직접 받는다.
 */
function oneValueViaGrandchildren(
  n: number,
  edges: Edge[],
  weights: number[],
): { answer: number; adds: number } {
  const kids = childrenOf(n, edges);
  const adj = adjacency(n, edges);
  const { order } = bfsOrder(n, adj);
  const best = new Array<number>(n).fill(0);
  let adds = 0;
  for (let k = n - 1; k >= 0; k--) {
    const v = order[k] as number;
    let skip = 0;
    for (const u of kids[v] as number[]) {
      adds++;
      skip += best[u] as number;
    }
    let take = weights[v] as number;
    for (const u of kids[v] as number[]) {
      for (const g of kids[u] as number[]) {
        adds++;
        take += best[g] as number;
      }
    }
    best[v] = Math.max(skip, take);
  }
  return { answer: best[0] as number, adds };
}

/**
 * **정점마다 값 넷**을 두는 판 — 「부모를 골랐는가」와 「나를 고르는가」의 네 조합에 각각 한
 * 칸을 둔다. 부모를 고르고 나도 고르는 칸은 정의상 만들 수 없다.
 */
function fourStatesPerNode(
  n: number,
  edges: Edge[],
  weights: number[],
): { answer: number; adds: number } {
  const kids = childrenOf(n, edges);
  const memo = new Map<string, number>();
  let adds = 0;
  const solve = (v: number, parentTaken: boolean, take: boolean): number => {
    if (parentTaken && take) return Number.NEGATIVE_INFINITY;
    const key = `${v}|${parentTaken ? 1 : 0}|${take ? 1 : 0}`;
    const hit = memo.get(key);
    if (hit !== undefined) return hit;
    let sum = take ? (weights[v] as number) : 0;
    for (const u of kids[v] as number[]) {
      adds++;
      sum += Math.max(solve(u, take, false), solve(u, take, true));
    }
    memo.set(key, sum);
    return sum;
  };
  const answer = Math.max(solve(0, false, false), solve(0, false, true));
  return { answer, adds };
}

/**
 * **「부모를 고르면 손자까지 못 고른다」는 오해를 그대로 전개한 판.** 고른 정점의 자식만이
 * 아니라 손자까지 통째로 버린다 — 자식의 서브트리에서 손자 아래만 쓴다.
 */
function grandchildBanned(
  n: number,
  edges: Edge[],
  weights: number[],
): { answer: number; skip: number[]; take: number[] } {
  const kids = childrenOf(n, edges);
  const skip = new Array<number>(n).fill(0);
  const take = new Array<number>(n).fill(0);
  const best = (v: number): number =>
    Math.max(skip[v] as number, take[v] as number);
  const adj = adjacency(n, edges);
  const { order } = bfsOrder(n, adj);
  for (let k = n - 1; k >= 0; k--) {
    const v = order[k] as number;
    let s = 0;
    for (const u of kids[v] as number[]) s += best(u);
    skip[v] = s;
    let t = weights[v] as number;
    for (const u of kids[v] as number[]) {
      for (const c of kids[u] as number[]) t += skip[c] as number;
    }
    take[v] = t;
  }
  return { answer: best(0), skip, take };
}

/** 재귀로 적은 판. 최대 호출 깊이를 함께 낸다. */
function recursive(
  n: number,
  edges: Edge[],
  weights: number[],
): { answer: number; depth: number } {
  const adj = adjacency(n, edges);
  let deepest = 0;
  const dfs = (v: number, p: number, d: number): [number, number] => {
    if (d > deepest) deepest = d;
    let notTaken = 0;
    let taken = weights[v] as number;
    for (const u of adj[v] as number[]) {
      if (u === p) continue;
      const [a, b] = dfs(u, v, d + 1);
      notTaken += Math.max(a, b);
      taken += a;
    }
    return [notTaken, taken];
  };
  const [a, b] = dfs(0, -1, 1);
  return { answer: Math.max(a, b), depth: deepest };
}

/**
 * 정본이 하는 기본 연산의 수 — 이웃 목록에 넣기 · 이웃 목록 항목 하나 읽기 · 자식 하나를 부모에
 * 더하기. 가벼운 판이라 큰 입력에 쓴다. 갈래마다 따로 센 값도 낸다.
 */
function iterativeOps(
  n: number,
  edges: Edge[],
): { total: number; build: number; look: number; fold: number } {
  const adj = adjacency(n, edges);
  const build = 2 * edges.length;
  let look = 0;
  const parent = new Array<number>(n).fill(-1);
  const order = new Array<number>(n).fill(0);
  let tail = 1;
  for (let head = 0; head < tail; head++) {
    const v = order[head] as number;
    for (const u of adj[v] as number[]) {
      look++;
      if (u === parent[v]) continue;
      parent[u] = v;
      order[tail] = u;
      tail++;
    }
  }
  const fold = n - 1;
  return { total: build + look + fold, build, look, fold };
}

/* ────────────────────── 트리 모양 만들기 ────────────────────── */

const pathTree = (n: number): Edge[] =>
  Array.from({ length: n - 1 }, (_, i) => [i, i + 1] as Edge);
const starTree = (n: number): Edge[] =>
  Array.from({ length: n - 1 }, (_, i) => [0, i + 1] as Edge);
const binaryTree = (n: number): Edge[] =>
  Array.from({ length: n - 1 }, (_, i) => [i >> 1, i + 1] as Edge);
/** 등뼈 하나에 잎을 하나씩 매단 모양. */
const caterpillar = (n: number): Edge[] => {
  const spine = n >> 1;
  const edges: Edge[] = [];
  for (let i = 1; i < spine; i++) edges.push([i - 1, i]);
  for (let j = spine; j < n; j++) edges.push([j - spine, j]);
  return edges;
};

/** 전부 만들기 표가 쓰는 가중치 — 음수와 양수가 섞이게 자리 번호에서 만든다. */
const naiveWeights = (n: number): number[] =>
  Array.from({ length: n }, (_, i) => 1 + ((i * 7) % 9) - 3);

/* ────────────────────────── 변이 ────────────────────────── */

type Mod = {
  treeMaxIndependentSet(n: number, edges: Edge[], weights: number[]): number;
};

/**
 * **순서를 뒤집지 않는 사본.** 정본은 방문 순서를 뒤에서부터 읽어 자식이 부모보다 먼저 오게
 * 하는데, 그 방향 하나를 앞에서부터로 바꾼다. 정본 소스에서 기계로 만든다.
 */
const 앞에서부터 = await loadMutant<Mod>(REF, {
  swap: [/for \(let k = n - 1; k >= 1; k--\)/, "for (let k = 1; k < n; k++)"],
});

/**
 * **불변식의 「고른다」를 지키던 줄을 바꾼 사본.** 부모를 고를 때 자식은 안 고르는 칸만 쓸 수
 * 있는데, 그 자리에서 두 칸 중 큰 쪽을 쓰게 한다.
 */
const 자식도고르기 = await loadMutant<Mod>(REF, {
  swap: [
    /dp1\[p\] = \(dp1\[p\] as number\) \+ \(dp0\[v\] as number\);/,
    "dp1[p] = (dp1[p] as number) + Math.max(dp0[v] as number, dp1[v] as number);",
  ],
});

/** 중화 실행이면 변이 모듈이 정본과 같은 함수를 돌려준다 — 그때는 자기검사를 건너뛴다. */
const 중화 =
  앞에서부터.treeMaxIndependentSet === treeMaxIndependentSet &&
  자식도고르기.treeMaxIndependentSet === treeMaxIndependentSet;

/** 변이 대조에 쓰는 입력 목록. 이름과 값이 한 벌로 다닌다. */
const 변이표: [string, number, Edge[], number[]][] = [
  ["전개 입력(정점 일곱)", N, EDGES, W],
  ["경로 0-1-2, 가중치 5 1 5", 3, pathTree(3), [5, 1, 5]],
  ["경로 0-1-2-3, 가중치 10 1 1 10", 4, pathTree(4), [10, 1, 1, 10]],
  ["별, 가운데 10 · 잎 1 넷", 5, starTree(5), [10, 1, 1, 1, 1]],
  ["별, 가운데 1 · 잎 5 넷", 5, starTree(5), [1, 5, 5, 5, 5]],
  ["정점 하나, 가중치 -5", 1, [], [-5]],
];

const 같다 = (a: number, b: number): string => (a === b ? "같다" : "어긋난다");

if (!중화) {
  // 어느 입력에서도 답이 안 바뀌면 「달라진다」가 거짓이다. 실행이 그것을 판정한다.
  for (const [이름, 사본] of [
    ["앞에서부터", 앞에서부터],
    ["자식도 고르기", 자식도고르기],
  ] as [string, Mod][]) {
    if (
      변이표.every(
        ([, n, edges, weights]) =>
          treeMaxIndependentSet(n, edges, weights) ===
          사본.treeMaxIndependentSet(n, edges, weights),
      )
    ) {
      throw new Error(`${이름} 변이가 어느 입력에서도 답을 바꾸지 못했다`);
    }
  }
  // 본문이 「바꾼 코드는 값 하나 판과 같은 것을 계산한다」고 적으므로, 어긋나면 여기서 실패한다.
  for (const [이름, n, edges, weights] of 변이표) {
    if (
      자식도고르기.treeMaxIndependentSet(n, edges, weights) !==
      oneValuePerNode(n, edges, weights).answer
    ) {
      throw new Error(`${이름} 에서 변이판과 값 하나 판의 답이 다르다`);
    }
  }
}

// 「손자까지 배제」 판도 마찬가지다. 오해가 답을 안 바꾸면 반례가 성립하지 않는다.
if (
  변이표.every(
    ([, n, edges, weights]) =>
      treeMaxIndependentSet(n, edges, weights) ===
      grandchildBanned(n, edges, weights).answer,
  )
) {
  throw new Error("「손자까지 배제」 판이 어느 입력에서도 답을 바꾸지 못했다");
}

/** 「값 하나 · 손자까지」와 「값 넷」은 정본과 같은 답을 내야 한다. 무작위 트리로 잰다. */
const RANDOM_TRIALS = 400;
{
  let seed = 20260903;
  const rnd = (): number => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  for (let t = 0; t < RANDOM_TRIALS; t++) {
    const n = 1 + Math.floor(rnd() * 9);
    const edges: Edge[] = [];
    for (let i = 1; i < n; i++) edges.push([Math.floor(rnd() * i), i]);
    const weights = Array.from(
      { length: n },
      () => Math.floor(rnd() * 21) - 10,
    );
    const want = treeMaxIndependentSet(n, edges, weights);
    if (oneValueViaGrandchildren(n, edges, weights).answer !== want) {
      throw new Error("「값 하나 · 손자까지」 판이 정본과 다른 답을 냈다");
    }
    if (fourStatesPerNode(n, edges, weights).answer !== want) {
      throw new Error("「값 넷」 판이 정본과 다른 답을 냈다");
    }
  }
}

/* ────────────────── 시도 사다리에 싣는 수 — 그림 사이드카가 받는다 ────────────────── */

export function ladderNumbers(): {
  bruteN: number;
  bruteOps: number;
  bigN: number;
  bigOps: number;
  oneValue: number;
  answer: number;
} {
  const bruteN = 20;
  const brute = bruteForce(bruteN, caterpillar(bruteN), naiveWeights(bruteN));
  const bigN = 100_000;
  return {
    bruteN,
    bruteOps: brute.ops,
    bigN,
    bigOps: iterativeOps(bigN, caterpillar(bigN)).total,
    oneValue: oneValuePerNode(N, EDGES, W).answer,
    answer: treeMaxIndependentSet(N, EDGES, W),
  };
}

/* ────────────────────────── 증명 블록 ────────────────────────── */

/** `concept` — 전개 입력의 독립집합 가운데 합이 큰 것. */
function conceptAnswer(): string {
  const all = allIndependent(N, EDGES, W);
  const top = all.slice(0, 3);
  const empty = all.find((s) => s.set.length === 0) as {
    set: number[];
    sum: number;
  };
  const rows = [...top, empty].map((s) => [
    s.set.length === 0 ? "{} (빈 집합)" : setOf(s.set),
    s.set.length === 0 ? "—" : s.set.map((v) => String(W[v])).join(" + "),
    comma(s.sum),
  ]);
  const best = top[0] as { set: number[]; sum: number };
  const ties = all.filter((s) => s.sum === best.sum).length;
  const answer = treeMaxIndependentSet(N, EDGES, W);
  return [
    md(["고른 정점", "가중치", "합"], rows, [2]),
    "",
    `정점 ${N} 개의 부분집합 ${comma(2 ** N)} 개 가운데 독립집합은 ${comma(all.length)} 개이고, 합이 가장 큰 것은 ${setOf(best.set)} 의 ${best.sum}${으로(best.sum)} ${ties} 개뿐입니다. 정본이 낸 값도 ${answer} 입니다.`,
  ].join("\n");
}

/** `concept` — 부분집합 수와 DP 테이블 칸 수. */
function conceptSize(): string {
  const rows = [N, 100_000].map((n) => [
    comma(n),
    big(2n ** BigInt(n)),
    comma(2 * n),
  ]);
  return fence(
    "text",
    columns([["정점 수 n", "부분집합 2^n", "DP 테이블 칸 2n"], ...rows]),
  );
}

/** `deep.origin` ② — 부분집합을 전부 만들어 보는 방법이 어디서 끊기는가. */
function originNaive(): string {
  const rows: string[][] = [];
  const counted: { n: number; ops: number }[] = [];
  for (const n of [4, 8, 12, 16, 20]) {
    const edges = caterpillar(n);
    const b = bruteForce(n, edges, naiveWeights(n));
    counted.push({ n, ops: b.ops });
    rows.push([
      comma(n),
      big(2n ** BigInt(n)),
      comma(b.independent),
      comma(b.ops),
      comma(iterativeOps(n, edges).total),
    ]);
  }
  const bigN = 100_000;
  rows.push([
    comma(bigN),
    big(2n ** BigInt(bigN)),
    "세지 않았다",
    "2^n 이상",
    comma(iterativeOps(bigN, caterpillar(bigN)).total),
  ]);
  const ratios = counted
    .slice(1)
    .map((c, i) => c.ops / (counted[i] as { ops: number }).ops);
  const lo = Math.min(...ratios);
  const hi = Math.max(...ratios);
  const sci = (x: number): string => x.toExponential(2).replace("e+", " × 10^");
  const sixty = 2 ** 60;
  const seconds = sci(sixty / 1e8);
  return [
    md(
      [
        "정점 n",
        "부분집합 2^n",
        "그중 독립집합",
        "전부 만들기의 기본 연산",
        "트리 DP 의 기본 연산",
      ],
      rows,
      [0, 1, 2, 3, 4],
    ),
    "",
    `앞의 다섯 줄은 등뼈에 잎을 하나씩 매단 트리에서 실제로 센 값이고, 정점이 넷 늘 때마다 전부 만들기의 기본 연산이 ${lo.toFixed(1)}배에서 ${hi.toFixed(1)}배로 늘었습니다. 마지막 줄의 전부 만들기는 부분집합마다 간선을 적어도 하나 확인하므로 2^n 번 이상입니다. 정점이 60 개만 돼도 ${sci(sixty)} 번 이상이라 초당 1 억 번으로 ${seconds} 초가 넘습니다.`,
  ].join("\n");
}

/** `deep.origin` ③ — 정점 5 · 6 의 네 조합이 전부 만들기에서 몇 번씩 되풀이되는가. */
function originRepeat(): string {
  const counts = new Map<string, number>();
  for (let mask = 0; mask < 1 << N; mask++) {
    const key = `${(mask >> 5) & 1}${(mask >> 6) & 1}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const combos: [string, number[]][] = [
    ["00", []],
    ["10", [5]],
    ["01", [6]],
    ["11", [5, 6]],
  ];
  const rows = combos.map(([key, set]) => {
    const adjacent = set.length === 2;
    const sum = set.reduce((s, v) => s + (W[v] as number), 0);
    return [
      set.length === 0 ? "{}" : setOf(set),
      adjacent ? "—" : comma(sum),
      adjacent ? "둘이 이웃이라 버린다" : "남긴다",
      comma(counts.get(key) as number),
    ];
  });
  const each = counts.get("00") as number;
  const total = [...counts.values()].reduce((a, b) => a + b, 0);
  return [
    md(
      [
        "정점 5 · 6 의 조합",
        "합",
        "간선 [5, 6]",
        "전부 만들기에서 나오는 횟수",
      ],
      rows,
      [1, 3],
    ),
    "",
    `네 조합이 저마다 ${each} 번씩, 모두 ${total} 번 나옵니다. 정점 ${N} 개의 부분집합 수 2^${N} = ${2 ** N}${과와(2 ** N)} 같습니다.`,
  ].join("\n");
}

/** `deep.origin` ④ — 정점마다 값을 하나만 올리면 답이 어떻게 갈리는가. */
function originOneValue(): string {
  const rows = 변이표.map(([이름, n, edges, weights]) => {
    const a = treeMaxIndependentSet(n, edges, weights);
    const b = oneValuePerNode(n, edges, weights).answer;
    return [이름, comma(a), comma(b), 같다(a, b)];
  });
  return md(["입력", "칸 둘 (정본)", "값 하나만", "두 답"], rows, [1, 2]);
}

/** `deep.origin` ④ — 값 하나만 올렸을 때 정점 1 에서 벌어지는 일. */
function originOneValueTrace(): string {
  const one = oneValuePerNode(N, EDGES, W);
  const kids = childrenOf(N, EDGES)[1] as number[];
  const b = one.best;
  const sumKids = kids.reduce((s, u) => s + (b[u] as number), 0);
  return fence(
    "text",
    columns([
      [
        "자식의 값",
        kids.map((u) => `best[${u}] = ${b[u]}`).join(" · "),
        `합 ${sumKids}`,
      ],
      [
        "정점 1 을 고른 값",
        `${W[1]} + ${sumKids} = ${b[1]}`,
        `best[1] = ${b[1]}`,
      ],
      [
        "그 합에 든 정점",
        setOf([1, ...kids]),
        `간선 ${kids.map((u) => `[1, ${u}]`).join(" · ")} 의 양 끝이 함께 들었다`,
      ],
      [
        "뿌리의 값",
        `best[0] = ${one.answer}`,
        `정본의 답 ${treeMaxIndependentSet(N, EDGES, W)}`,
      ],
    ]),
  );
}

/** `deep.build` (c) — 칸 하나를 읽는 법. 칸마다 그 칸이 뜻하는 집합을 전수로 찾는다. */
function buildReadCell(): string {
  const rows: string[][] = [];
  let same = 0;
  let total = 0;
  const kids = childrenOf(N, EDGES);
  for (const [v, want] of [
    [1, false],
    [1, true],
    [2, false],
    [2, true],
  ] as [number, boolean][]) {
    const b = bestSet(N, EDGES, W, v, want);
    const cell = (want ? FINAL.dp1[v] : FINAL.dp0[v]) as number;
    total++;
    if (cell === b.sum) same++;
    rows.push([
      `${want ? "dp1" : "dp0"}[${v}]`,
      setOf(subtree(kids, v)),
      want ? `${v}${을를(v)} 담는다` : `${v}${을를(v)} 안 담는다`,
      b.set.length === 0 ? "{}" : setOf(b.set),
      comma(b.sum),
      comma(cell),
    ]);
  }
  return [
    md(
      [
        "칸",
        "서브트리의 정점",
        "조건",
        "합이 가장 큰 독립집합",
        "그 합",
        "칸의 값",
      ],
      rows,
      [4, 5],
    ),
    "",
    `서브트리의 부분집합을 전부 만들어 고른 합과 칸의 값이 ${total} 칸 가운데 ${same} 칸에서 같습니다.`,
  ].join("\n");
}

/** `deep.build` (d) — 칸끼리의 관계. 정점마다 자식의 칸에서 부모의 칸이 나오는가. */
function buildRelation(): string {
  const kids = childrenOf(N, EDGES);
  const f = FINAL;
  let ok = 0;
  const rows = Array.from({ length: N }, (_, v) => {
    const cs = kids[v] as number[];
    const s0 = cs.reduce(
      (s, u) => s + Math.max(f.dp0[u] as number, f.dp1[u] as number),
      0,
    );
    const s1 =
      (W[v] as number) + cs.reduce((s, u) => s + (f.dp0[u] as number), 0);
    if (s0 === f.dp0[v] && s1 === f.dp1[v]) ok++;
    const e0 =
      cs.length === 0
        ? "0 (자식 없음)"
        : `${cs.map((u) => `max(${f.dp0[u]}, ${f.dp1[u]})`).join(" + ")} = ${s0}`;
    const e1 =
      cs.length === 0
        ? `${W[v]} (자식 없음)`
        : `${W[v]} + ${cs.map((u) => String(f.dp0[u])).join(" + ")} = ${s1}`;
    return [
      String(v),
      cs.length === 0 ? "없음" : cs.join(" · "),
      e0,
      e1,
      `${f.dp0[v]} · ${f.dp1[v]}`,
    ];
  });
  return [
    md(
      [
        "정점 v",
        "자식",
        "자식 칸으로 만든 dp0[v]",
        "자식 칸으로 만든 dp1[v]",
        "DP 테이블의 두 칸",
      ],
      rows,
    ),
    "",
    `정점 ${N} 개 가운데 자식의 칸으로 만든 두 값이 DP 테이블의 두 칸과 모두 같은 정점은 ${ok} 개입니다.`,
  ].join("\n");
}

/** `deep.build` (e) — 정점 번호 차례로 늘어놓으면 부모가 읽는 칸이 어디 있는가. */
function buildContrast(): string {
  const { parent } = bfsOrder(N, adjacency(N, EDGES));
  let near = 0;
  const rows: string[][] = [];
  for (let c = 1; c < N; c++) {
    const p = parent[c] as number;
    const gap = Math.abs(c - p);
    if (gap === 1) near++;
    rows.push([
      String(p),
      String(c),
      String(gap),
      gap === 1 ? "옆 칸" : "떨어진 칸",
    ]);
  }
  rows.sort(
    (a, b) => Number(a[0]) - Number(b[0]) || Number(a[1]) - Number(b[1]),
  );
  return [
    md(["부모 칸", "읽는 자식 칸", "번호 차이", "번호 줄에서"], rows, [2]),
    "",
    `부모가 읽는 자식 칸 ${N - 1} 개 가운데 번호 줄에서 바로 옆 칸인 것은 ${near} 개입니다.`,
  ].join("\n");
}

/** `deep.build` 1단계 — 이웃 목록. */
function buildLists(): string {
  const rows = WALK.adj.map((l, u) => [String(u), listOf(l), String(l.length)]);
  const total = WALK.adj.reduce((s, l) => s + l.length, 0);
  return [
    md(["정점 u", "adj[u]", "길이"], rows, [2]),
    "",
    `길이를 모두 더한 ${total}${은는(total)} 간선 ${EDGES.length} 개의 두 배입니다.`,
  ].join("\n");
}

/** `deep.build` 2단계 — 칸의 시작값. */
function buildInit(): string {
  const s = WALK.steps[1] as Snap;
  const kids = childrenOf(N, EDGES);
  const leaves: number[] = [];
  const rows = Array.from({ length: N }, (_, v) => {
    const cs = kids[v] as number[];
    if (cs.length === 0) leaves.push(v);
    const last = cs.at(-1) as number;
    return [
      String(v),
      String(W[v]),
      String(s.dp0[v]),
      String(s.dp1[v]),
      cs.length === 0
        ? "없다 — 잎이라 더할 자식이 없다"
        : `자식 ${cs.join(" · ")}${을를(last)} 더해야 한다`,
    ];
  });
  return [
    md(["정점 v", "w[v]", "dp0[v]", "dp1[v]", "남은 일"], rows, [1, 2, 3]),
    "",
    `시작값에서 이미 끝난 정점은 잎 ${leaves.join(" · ")} 의 ${leaves.length} 개입니다.`,
  ].join("\n");
}

interface BfsRow {
  readonly head: number;
  readonly v: number;
  readonly adj: number[];
  readonly skipped: number[];
  readonly added: number[];
  readonly order: number[];
}

/** 너비 우선 순회의 자취 — `head` 마다 꺼낸 정점과 건너뛴 · 붙인 이웃. */
function bfsTrail(): BfsRow[] {
  const adj = WALK.adj;
  const order = new Array<number>(N).fill(0);
  const parent = new Array<number>(N).fill(-1);
  const out: BfsRow[] = [];
  let tail = 1;
  for (let head = 0; head < tail; head++) {
    const v = order[head] as number;
    const skipped: number[] = [];
    const added: number[] = [];
    for (const u of adj[v] as number[]) {
      if (u === parent[v]) {
        skipped.push(u);
        continue;
      }
      parent[u] = v;
      order[tail] = u;
      tail++;
      added.push(u);
    }
    out.push({
      head,
      v,
      adj: [...(adj[v] as number[])],
      skipped,
      added,
      order: order.slice(0, tail),
    });
  }
  const final = WALK.steps[2] as Snap;
  if (listOf(order) !== listOf(final.order as number[])) {
    throw new Error("순회 자취가 기록 사본의 순서와 어긋난다");
  }
  return out;
}

/** `deep.build` 3단계 — 순서와 부모. */
function buildOrder(): string {
  const trail = bfsTrail();
  const rows = trail.map((t) => [
    String(t.head),
    String(t.v),
    listOf(t.adj),
    t.skipped.length === 0 ? "없음 (뿌리)" : t.skipped.join(" · "),
    t.added.length === 0 ? "없음" : t.added.join(" · "),
    listOf(t.order),
  ]);
  const s = WALK.steps[2] as Snap;
  return [
    md(
      [
        "head",
        "꺼낸 정점 v",
        "adj[v]",
        "부모라 건너뛴 이웃",
        "순서 뒤에 붙인 이웃",
        "그 뒤 order",
      ],
      rows,
      [0, 1],
    ),
    "",
    `order 는 ${listOf(s.order as number[])} 이고 parent 는 ${listOf(s.parent as number[])} 입니다. 부모가 -1 인 정점은 뿌리 0 하나입니다.`,
  ].join("\n");
}

/** `deep.build` 3단계 — 뒤집은 순서에서 자식이 부모보다 먼저 오는가. */
function buildReverse(): string {
  const s = WALK.steps[2] as Snap;
  const order = s.order as number[];
  const parent = s.parent as number[];
  const at = new Map(order.map((v, i) => [v, i]));
  let after = 0;
  for (let v = 1; v < N; v++) {
    if ((at.get(v) as number) > (at.get(parent[v] as number) as number)) {
      after++;
    }
  }
  const back = [...order].reverse().slice(0, N - 1);
  return fence(
    "text",
    columns([
      ["너비 우선 order", order.join("  "), "부모가 자식보다 앞"],
      [`뒤에서부터 k = ${N - 1} … 1`, back.join("  "), "자식이 부모보다 앞"],
      ["order 에서 부모보다 뒤에 놓인 자식", `${after} / ${N - 1}`, ""],
    ]),
  );
}

/** `deep.build` 4단계 — 자식이 여럿인 정점 1 의 두 칸이 자라는 자취. */
function buildFoldMany(): string {
  const lines: string[][] = [];
  const s0 = WALK.steps[1] as Snap;
  lines.push(["시작값", `dp0[1] = ${s0.dp0[1]}`, `dp1[1] = ${s0.dp1[1]}`]);
  WALK.steps.forEach((s, i) => {
    if (s.kind === "fold" && s.p === 1) {
      const v = s.v as number;
      const c0 = s.dp0[v] as number;
      const c1 = s.dp1[v] as number;
      lines.push([
        `${stepOf(i)} 자식 ${v}`,
        `dp0[1] = ${s.before?.dp0} + max(${c0}, ${c1}) = ${s.dp0[1]}`,
        `dp1[1] = ${s.before?.dp1} + ${c0} = ${s.dp1[1]}`,
      ]);
    }
  });
  return fence("text", columns(lines));
}

/** `deep.build` 4단계 — 부모에 더할 때 자식의 두 칸은 이미 끝나 있었는가. */
function buildFoldReady(): string {
  const f = FINAL;
  let ready = 0;
  const rows: string[][] = [];
  WALK.steps.forEach((s, i) => {
    if (s.kind !== "fold") return;
    const v = s.v as number;
    const done = s.dp0[v] === f.dp0[v] && s.dp1[v] === f.dp1[v];
    if (done) ready++;
    rows.push([
      stepOf(i),
      `${v} → ${s.p}`,
      `${s.dp0[v]} · ${s.dp1[v]}`,
      `${f.dp0[v]} · ${f.dp1[v]}`,
      done ? "끝난 값" : "덜 된 값",
    ]);
  });
  return [
    md(
      [
        "걸음",
        "자식 → 부모",
        "그때 자식의 두 칸",
        "다 채운 뒤의 두 칸",
        "읽은 값",
      ],
      rows,
    ),
    "",
    `더하기 ${rows.length} 번 가운데 자식의 두 칸이 이미 끝난 값이었던 것은 ${ready} 번입니다.`,
  ].join("\n");
}

/** `deep.build` 5단계 — 뿌리의 두 칸과 그 칸을 내는 집합. */
function buildAnswer(): string {
  const a = bestSet(N, EDGES, W, 0, false);
  const b = bestSet(N, EDGES, W, 0, true);
  const add = (xs: number[]) =>
    [...xs]
      .sort((a, b) => a - b)
      .map((v) => String(W[v]))
      .join(" + ");
  return fence(
    "text",
    columns([
      [`dp0[0] = ${FINAL.dp0[0]}`, `고른 정점 ${setOf(a.set)}`, add(a.set)],
      [`dp1[0] = ${FINAL.dp1[0]}`, `고른 정점 ${setOf(b.set)}`, add(b.set)],
      [`답 max(${FINAL.dp0[0]}, ${FINAL.dp1[0]}) = ${FINAL.answer}`, "", ""],
    ]),
  );
}

/** 사이클이 있는 입력에서 정본과 같은 순회를 돌리되 순서 배열 길이에 상한을 둔 사본. */
function cappedBfs(n: number, edges: Edge[], cap: number): number {
  const adj = adjacency(n, edges);
  const order: number[] = [0];
  const parent = new Array<number>(n).fill(-1);
  for (let head = 0; head < order.length && order.length < cap; head++) {
    const v = order[head] as number;
    for (const u of adj[v] as number[]) {
      if (u === parent[v]) continue;
      parent[u] = v;
      order.push(u);
      if (order.length >= cap) break;
    }
  }
  return order.length;
}

/** `deep.build` 전제 — 입력이 트리가 아닐 때. */
function buildPremise(): string {
  const forestN = 4;
  const forest: Edge[] = [
    [0, 1],
    [2, 3],
  ];
  const forestW = [1, 1, 5, 5];
  const got = treeMaxIndependentSet(forestN, forest, forestW);
  const forestTruth = (
    allIndependent(forestN, forest, forestW)[0] as { sum: number }
  ).sum;
  const cycleN = 3;
  const cycle: Edge[] = [
    [0, 1],
    [1, 2],
    [2, 0],
  ];
  const cycleW = [5, 5, 5];
  const cycleTruth = (
    allIndependent(cycleN, cycle, cycleW)[0] as { sum: number }
  ).sum;
  const cap = 10 * cycleN;
  const grown = cappedBfs(cycleN, cycle, cap);
  return [
    md(
      [
        "입력",
        "간선 수",
        "깨지는 전제",
        "정본 절차가 낸 것",
        "부분집합을 전부 만든 답",
      ],
      [
        [
          `정점 ${forestN} · 간선 [0, 1] [2, 3] · 가중치 ${forestW.join(" ")}`,
          String(forest.length),
          "이어져 있다",
          `답 ${got}`,
          String(forestTruth),
        ],
        [
          `정점 ${cycleN} · 간선 [0, 1] [1, 2] [2, 0] · 가중치 ${cycleW.join(" ")}`,
          String(cycle.length),
          "사이클이 없다",
          `순서 배열이 ${grown} 칸까지 자랐다`,
          String(cycleTruth),
        ],
      ],
      [1, 4],
    ),
    "",
    `첫 줄은 정점 2 · 3 이 뿌리에서 이어지지 않아 한 번도 방문되지 않았습니다. 둘째 줄은 같은 순회를 순서 배열 ${cap} 칸에서 멈추게 한 사본으로 돌렸고, 정점이 ${cycleN} 개인데 ${grown} 칸이 차도록 순회가 끝나지 않았습니다.`,
  ].join("\n");
}

/** `deep.build` 설계 선택 — 정점마다 칸을 몇 개 둘 것인가. */
function buildStateCount(): string {
  const 입력: [string, number, Edge[], number[]][] = [
    ["전개 입력", N, EDGES, W],
    ["별 (가운데 1 · 잎 5 넷)", 5, starTree(5), [1, 5, 5, 5, 5]],
  ];
  const rows: string[][] = [];
  for (const [이름, n, edges, weights] of 입력) {
    const want = treeMaxIndependentSet(n, edges, weights);
    const one = oneValuePerNode(n, edges, weights);
    const gc = oneValueViaGrandchildren(n, edges, weights);
    const four = fourStatesPerNode(n, edges, weights);
    const two = traced(n, edges, weights).steps.filter(
      (s) => s.kind === "fold",
    ).length;
    const mark = (a: number) => (a === want ? "맞다" : "틀린다");
    rows.push([
      이름,
      "하나, 자식만 본다",
      comma(one.answer),
      mark(one.answer),
      comma(n),
      comma(one.adds),
    ]);
    rows.push([
      이름,
      "하나, 손자까지 본다",
      comma(gc.answer),
      mark(gc.answer),
      comma(n),
      comma(gc.adds),
    ]);
    rows.push([
      이름,
      "둘, 자식만 본다",
      comma(want),
      mark(want),
      comma(2 * n),
      comma(two),
    ]);
    rows.push([
      이름,
      "넷, 자식만 본다",
      comma(four.answer),
      mark(four.answer),
      comma(4 * n),
      comma(four.adds),
    ]);
  }
  return [
    md(
      [
        "입력",
        "정점마다 칸",
        "답",
        "답의 옳고 그름",
        "DP 테이블 칸 수",
        "자손 칸을 더한 횟수",
      ],
      rows,
      [2, 4, 5],
    ),
    "",
    `「하나, 손자까지」와 「넷」이 정본과 같은 답을 내는지는 정점 1~9 개짜리 무작위 트리 ${RANDOM_TRIALS} 개에서도 따로 확인했고, 어긋난 트리는 0 개입니다.`,
  ].join("\n");
}

/** `deep.walk` 도입 — 끝까지 쓰는 입력. */
function walkInput(): string {
  const answer = treeMaxIndependentSet(N, EDGES, W);
  const best = bestSet(N, EDGES, W, 0, true);
  return fence(
    "ts",
    [
      `const n = ${N};`,
      `const edges: [number, number][] = [${EDGES.map(([a, b]) => `[${a}, ${b}]`).join(", ")}];`,
      `const weights = [${W.join(", ")}];`,
      `// 이 절이 끝나면 ${answer}${이가(answer)} 나와야 한다 (정점 ${setOf(best.set)})`,
    ].join("\n"),
  );
}

/** `deep.walk` 1 — 이웃 목록 조각의 실행 결과. */
function walkAdj(): string {
  const total = WALK.adj.reduce((s, l) => s + l.length, 0);
  return fence(
    "text",
    [
      columns(
        WALK.adj.map((l, u) => [
          `adj[${u}] = ${listOf(l)}`,
          l.length === 1 ? "잎이라 이웃이 하나" : "",
        ]),
      ),
      `목록 길이의 합 ${total} = 간선 ${EDGES.length} 개의 두 배`,
    ].join("\n"),
  );
}

/** `deep.walk` 2 — 시작값 조각의 실행 결과. */
function walkInit(): string {
  const s = WALK.steps[1] as Snap;
  return fence(
    "text",
    [
      `dp0 = ${listOf(s.dp0 as number[])}`,
      `dp1 = ${listOf(s.dp1 as number[])}`,
    ].join("\n"),
  );
}

/** `deep.walk` 3 — 순회 조각의 실행 결과. */
function walkBfs(): string {
  const s = WALK.steps[2] as Snap;
  return fence(
    "text",
    [
      `order  = ${listOf(s.order as number[])}`,
      `parent = ${listOf(s.parent as number[])}`,
    ].join("\n"),
  );
}

/** `deep.walk.pause` — 순서를 안 뒤집으면 부모가 덜 된 칸을 더한다. */
function walkOrderMutant(): string {
  const rows = 변이표.map(([이름, n, edges, weights]) => {
    const a = treeMaxIndependentSet(n, edges, weights);
    const b = 앞에서부터.treeMaxIndependentSet(n, edges, weights);
    return [이름, comma(a), comma(b), 같다(a, b)];
  });
  return md(["입력", "정본", "앞에서부터 더한 판", "두 답"], rows, [1, 2]);
}

/**
 * 앞에서부터 더하는 판의 자취 — 변이와 같은 줄을 바꾼 기록 사본. 답이 변이 모듈과 같은지는
 * 중화가 아닐 때만 맞댄다(중화면 변이 모듈이 정본이다).
 */
function walkOrderTrace(): string {
  const adj = adjacency(N, EDGES);
  const { order, parent } = bfsOrder(N, adj);
  const dp0 = new Array<number>(N).fill(0);
  const dp1 = [...W];
  const lines: string[][] = [];
  for (let k = 1; k < N; k++) {
    const v = order[k] as number;
    const p = parent[v] as number;
    const read0 = dp0[v] as number;
    const read1 = dp1[v] as number;
    const was = dp0[p] as number;
    dp0[p] = was + Math.max(read0, read1);
    dp1[p] = (dp1[p] as number) + read0;
    if (k <= 3) {
      const f0 = FINAL.dp0[v] as number;
      const f1 = FINAL.dp1[v] as number;
      const stale = read0 !== f0 || read1 !== f1;
      lines.push([
        `k=${k}  v=${v} → 부모 ${p}`,
        `dp0[${p}] = ${was} + max(${read0}, ${read1}) = ${dp0[p]}`,
        stale
          ? `자식 ${v} 의 두 칸이 아직 ${read0} · ${read1} (다 채우면 ${f0} · ${f1})`
          : `자식 ${v} 의 두 칸은 이미 끝난 ${read0} · ${read1}`,
      ]);
    }
  }
  const answer = Math.max(dp0[0] as number, dp1[0] as number);
  if (!중화 && answer !== 앞에서부터.treeMaxIndependentSet(N, EDGES, W)) {
    throw new Error("앞에서부터 더하는 기록 사본이 변이와 다른 답을 냈다");
  }
  lines.push([
    "끝",
    `답 max(${dp0[0]}, ${dp1[0]}) = ${answer}`,
    `정본의 답 ${treeMaxIndependentSet(N, EDGES, W)}`,
  ]);
  return fence("text", columns(lines));
}

/** `deep.walk` 4 — 순서를 뒤에서부터 읽어 여섯 번 더한 자취. */
function walkFold(): string {
  const rows: string[][] = [];
  WALK.steps.forEach((s, i) => {
    if (s.kind !== "fold") return;
    const v = s.v as number;
    const p = s.p as number;
    const c0 = s.dp0[v] as number;
    const c1 = s.dp1[v] as number;
    rows.push([
      stepOf(i),
      String(s.k),
      `${v} → ${p}`,
      `max(${c0}, ${c1}) = ${Math.max(c0, c1)}`,
      `${s.before?.dp0} + ${Math.max(c0, c1)} = ${s.dp0[p]}`,
      `${s.before?.dp1} + ${c0} = ${s.dp1[p]}`,
    ]);
  });
  return md(
    ["걸음", "순서 k", "자식 → 부모", "큰 쪽 고르기", "④ dp0[p]", "⑤ dp1[p]"],
    rows,
    [1],
  );
}

/** `deep.walk` 5 — 반환 조각의 실행 결과. */
function walkAnswer(): string {
  const i = WALK.steps.length - 1;
  return fence(
    "text",
    `${stepOf(i)}  max(dp0[0], dp1[0]) = max(${FINAL.dp0[0]}, ${FINAL.dp1[0]}) = ${FINAL.answer}   ⑥`,
  );
}

/** `deep.walk.pause` — 「부모를 고르면 손자까지 못 고른다」는 오해가 낸 답. */
function walkGrandchild(): string {
  const rows = 변이표.map(([이름, n, edges, weights]) => {
    const a = treeMaxIndependentSet(n, edges, weights);
    const b = grandchildBanned(n, edges, weights).answer;
    return [이름, comma(a), comma(b), 같다(a, b)];
  });
  return md(["입력", "정본", "손자까지 버린 판", "두 답"], rows, [1, 2]);
}

/** `deep.walk.pause` — 전개 입력에서 오해가 뿌리의 「고른다」를 어떻게 줄이는가. */
function walkGrandchildTrace(): string {
  const g = grandchildBanned(N, EDGES, W);
  const kids = childrenOf(N, EDGES);
  const grand = (kids[0] as number[]).flatMap((u) => kids[u] as number[]);
  const deeper = grand.flatMap((u) => kids[u] as number[]);
  const right = bestSet(N, EDGES, W, 0, true);
  return fence(
    "text",
    columns([
      [
        "바른 답",
        `뿌리 0 을 고르고 손자 ${grand.join(" · ")} 도 고른다`,
        `${setOf(right.set)} = ${right.sum}`,
      ],
      [
        "오해대로",
        `뿌리 0 을 고르면 손자 ${grand.join(" · ")} 까지 버린다`,
        `고른다 쪽 = ${W[0]} + ${grand.map((c) => String(g.skip[c])).join(" + ")} = ${g.take[0]}`,
      ],
      [
        "",
        `손자 아래는 증손자 ${deeper.join(" · ")} 뿐이다`,
        `안 고른다 쪽 = ${g.skip[0]}`,
      ],
      ["", "", `답 max(${g.skip[0]}, ${g.take[0]}) = ${g.answer}`],
    ]),
  );
}

/** `deep.walk` 6 — 열 걸음을 끝까지 실행한 자취와 갈래. */
function walkTrace(): string {
  const rows: string[][] = [];
  const hit = new Map<number, string[]>();
  const mark = (label: number, id: string) => {
    hit.set(label, [...(hit.get(label) ?? []), id]);
  };
  const trail = bfsTrail();
  WALK.steps.forEach((s, i) => {
    const id = stepOf(i);
    if (s.kind === "build") {
      rows.push([id, "간선 목록을 이웃 목록으로 옮긴다", "—", "—", "—"]);
    } else if (s.kind === "init") {
      mark(1, id);
      rows.push([
        id,
        "칸의 시작값을 적는다",
        "dp0 ← 0 · dp1 ← w",
        "①",
        `뿌리의 두 칸 ${cellOf(s, 0)}`,
      ]);
    } else if (s.kind === "bfs") {
      const skips = trail.reduce((a, t) => a + t.skipped.length, 0);
      const adds = trail.reduce((a, t) => a + t.added.length, 0);
      mark(2, id);
      mark(3, id);
      rows.push([
        id,
        "뿌리에서 순서와 부모를 정한다",
        `이웃 항목 ${skips + adds} 개 — 부모라 건너뜀 ${skips} · 순서에 붙임 ${adds}`,
        "② ③",
        `order ${listOf(s.order as number[])}`,
      ]);
    } else if (s.kind === "fold") {
      const v = s.v as number;
      const p = s.p as number;
      const c0 = s.dp0[v] as number;
      const c1 = s.dp1[v] as number;
      mark(4, id);
      mark(5, id);
      rows.push([
        id,
        `자식 ${v}${을를(v)} 부모 ${p} 에 더한다`,
        `max(${c0}, ${c1}) — ${c1 > c0 ? "dp1" : "dp0"} 쪽이 크다`,
        "④ ⑤",
        `${p} 의 두 칸 ${cellOf(s, p)}`,
      ]);
    } else {
      mark(6, id);
      const a = s.dp0[0] as number;
      const b = s.dp1[0] as number;
      rows.push([
        id,
        "뿌리의 두 칸 중 큰 쪽을 돌려준다",
        `${b} > ${a} ${b > a ? "참" : "거짓"}`,
        "⑥",
        `답 ${s.answer}`,
      ]);
    }
  });
  const foldSteps = WALK.steps.filter((s) => s.kind === "fold");
  const tookOne = foldSteps.filter(
    (s) => (s.dp1[s.v as number] as number) > (s.dp0[s.v as number] as number),
  ).length;
  const tookZero = foldSteps.length - tookOne;
  const circled = ["", "①", "②", "③", "④", "⑤", "⑥"];
  const where = [1, 2, 3, 4, 5, 6]
    .map((l) => `${circled[l]}${은는(l)} ${(hit.get(l) ?? []).join(" · ")}`)
    .join(", ");
  return [
    md(["걸음", "하는 일", "조건 판정", "갈래", "그 뒤"], rows),
    "",
    `${where} 에서 실행됐습니다. 더하기 ${foldSteps.length} 번 가운데 자식의 dp1 쪽이 커서 그쪽을 dp0[p] 에 더한 것이 ${tookOne} 번, dp0 쪽이 크거나 같아 그쪽을 더한 것이 ${tookZero} 번입니다. 반환값은 ${WALK.answer} 입니다.`,
  ].join("\n");
}

/** `deep.walk.final` — 전체 코드를 여러 입력에 실행한 값. */
function walkResult(): string {
  const 목록: [string, number, Edge[], number[]][] = [
    [`전개 입력(정점 ${N})`, N, EDGES, W],
    ["경로 0-1-2-3, 가중치 10 1 1 10", 4, pathTree(4), [10, 1, 1, 10]],
    ["별, 가운데 1 · 잎 5 넷", 5, starTree(5), [1, 5, 5, 5, 5]],
    ["정점 하나, 가중치 42", 1, [], [42]],
    ["정점 하나, 가중치 -5", 1, [], [-5]],
    ["경로 0-1-2, 가중치 -1 -2 -3", 3, pathTree(3), [-1, -2, -3]],
  ];
  return fence(
    "text",
    columns(
      목록.map(([이름, n, e, w]) => [
        이름,
        "→",
        comma(treeMaxIndependentSet(n, e, w)),
      ]),
    ),
  );
}

/** `related` — 간선마다 남은 쪽 끝점. */
function relatedEdges(): string {
  const chosen = new Set(bestSet(N, EDGES, W, 0, true).set);
  const rest = Array.from({ length: N }, (_, v) => v).filter(
    (v) => !chosen.has(v),
  );
  let covered = 0;
  const rows = EDGES.map(([a, b]) => {
    const ends = [a, b].filter((x) => !chosen.has(x));
    if (ends.length > 0) covered++;
    return [`[${a}, ${b}]`, ends.length === 0 ? "없음" : ends.join(" · ")];
  });
  return [
    md(["간선", `남은 쪽 ${setOf(rest)} 에 든 끝점`], rows),
    "",
    `간선 ${EDGES.length} 개 가운데 끝점 하나 이상이 남은 쪽에 든 간선은 ${covered} 개입니다.`,
  ].join("\n");
}

/** `related` — 고른 집합과 그 여집합의 가중치 합. */
function relatedSum(): string {
  const 입력: [string, number, Edge[], number[]][] = [
    ["전개 입력", N, EDGES, W],
    ["경로 0-1-2-3, 가중치 10 1 1 10", 4, pathTree(4), [10, 1, 1, 10]],
    ["별, 가운데 10 · 잎 1 넷", 5, starTree(5), [10, 1, 1, 1, 1]],
  ];
  let same = 0;
  const rows = 입력.map(([이름, n, edges, weights]) => {
    const total = weights.reduce((a, b) => a + b, 0);
    const answer = treeMaxIndependentSet(n, edges, weights);
    // 정점 덮개를 전부 만들어 가장 작은 합을 직접 센다.
    let cover = Number.POSITIVE_INFINITY;
    for (let mask = 0; mask < 1 << n; mask++) {
      if (!edges.every(([a, b]) => (mask >> a) & 1 || (mask >> b) & 1)) {
        continue;
      }
      let s = 0;
      for (let i = 0; i < n; i++) {
        if ((mask >> i) & 1) s += weights[i] as number;
      }
      if (s < cover) cover = s;
    }
    if (cover === total - answer) same++;
    return [
      이름,
      comma(total),
      comma(answer),
      comma(total - answer),
      comma(cover),
    ];
  });
  return [
    md(
      [
        "입력",
        "가중치 합 S",
        "독립집합의 최대 합",
        "S − 최대 합",
        "정점 덮개의 최소 합",
      ],
      rows,
      [1, 2, 3, 4],
    ),
    "",
    `정점 덮개의 최소 합은 덮개를 전부 만들어 직접 셌고, 세 입력 가운데 S − 최대 합과 같은 것이 ${same} 개입니다.`,
  ].join("\n");
}

/** `deep.math` ② — 정의를 전수 계산으로 옮겨 DP 테이블의 두 칸과 맞춘다. */
function mathCheck(): string {
  const kids = childrenOf(N, EDGES);
  let same = 0;
  const rows = Array.from({ length: N }, (_, v) => {
    const a = bestSet(N, EDGES, W, v, false).sum;
    const b = bestSet(N, EDGES, W, v, true).sum;
    if (a === FINAL.dp0[v] && b === FINAL.dp1[v]) same++;
    return [
      String(v),
      subtree(kids, v)
        .sort((x, y) => x - y)
        .join(" "),
      comma(a),
      comma(FINAL.dp0[v] as number),
      comma(b),
      comma(FINAL.dp1[v] as number),
    ];
  });
  return [
    md(
      [
        "정점 v",
        "서브트리의 정점",
        "정의로 센 A(v)",
        "dp0[v]",
        "정의로 센 B(v)",
        "dp1[v]",
      ],
      rows,
      [2, 3, 4, 5],
    ),
    "",
    `정점 ${N} 개 가운데 정의로 센 두 값이 DP 테이블의 두 칸과 모두 같은 정점은 ${same} 개입니다.`,
  ].join("\n");
}

/** `deep.math` — 식을 옮긴 조각을 정점 1 에서 실행한 값. */
function mathSnippet(): string {
  const kids = childrenOf(N, EDGES);
  const A = (v: number): number =>
    (kids[v] as number[]).reduce((s, u) => s + Math.max(A(u), B(u)), 0);
  const B = (v: number): number =>
    (W[v] as number) + (kids[v] as number[]).reduce((s, u) => s + A(u), 0);
  const cs = kids[1] as number[];
  return fence(
    "text",
    columns([
      [
        `A(1) = ${cs.map((u) => `max(A(${u}), B(${u}))`).join(" + ")}`,
        `= ${cs.map((u) => `max(${A(u)}, ${B(u)})`).join(" + ")}`,
        `= ${A(1)}`,
      ],
      [
        `B(1) = w[1] + ${cs.map((u) => `A(${u})`).join(" + ")}`,
        `= ${W[1]} + ${cs.map((u) => String(A(u))).join(" + ")}`,
        `= ${B(1)}`,
      ],
    ]),
  );
}

/** `deep.math` ④ — 닫아 둔 두 경계에 규모 상한을 넣는다. */
function mathBounds(): string {
  const 모양: [string, number, (n: number) => Edge[]][] = [
    ["경로", 100_000, pathTree],
    ["별", 100_000, starTree],
    ["애벌레", 100_000, caterpillar],
    ["완전 이진 트리 (높이 15)", 65_535, binaryTree],
  ];
  let inside = 0;
  const rows = 모양.map(([이름, n, make]) => {
    const got = treeMaxIndependentSet(n, make(n), new Array<number>(n).fill(1));
    if (got >= Math.ceil(n / 2) && got <= n - 1) inside++;
    return [이름, comma(n), comma(got), comma(Math.ceil(n / 2)), comma(n - 1)];
  });
  return [
    md(
      ["모양 (가중치가 전부 1)", "정점 n", "답", "하한 ⌈n/2⌉", "상한 n−1"],
      rows,
      [1, 2, 3, 4],
    ),
    "",
    `네 모양 가운데 답이 두 경계 사이에 든 것은 ${inside} 개입니다.`,
  ].join("\n");
}

/** `invariant` ② — 정점 1 의 두 칸이 자라는 자취와 확정된 뒤. */
function invariantGrowth(): string {
  const lines: string[][] = [];
  const s0 = WALK.steps[1] as Snap;
  lines.push([
    `${stepOf(1)} 시작값`,
    `dp0[1] = ${s0.dp0[1]}`,
    `dp1[1] = ${s0.dp1[1]}`,
    "",
  ]);
  let last = -1;
  WALK.steps.forEach((s, i) => {
    if (s.kind === "fold" && s.p === 1) {
      lines.push([
        `${stepOf(i)} 자식 ${s.v}`,
        `dp0[1] = ${s.dp0[1]}`,
        `dp1[1] = ${s.dp1[1]}`,
        "",
      ]);
      last = i;
    }
  });
  const reads = WALK.steps.findIndex((s) => s.kind === "fold" && s.v === 1);
  const r = WALK.steps[reads] as Snap;
  const later = WALK.steps
    .slice(last + 1)
    .every((s) => s.dp0[1] === FINAL.dp0[1] && s.dp1[1] === FINAL.dp1[1]);
  (lines.at(-1) as string[])[3] = "자식을 전부 더했다";
  lines.push([
    `${stepOf(reads)} 부모 ${r.p}${이가(r.p as number)} 읽는다`,
    `dp0[1] = ${r.dp0[1]}`,
    `dp1[1] = ${r.dp1[1]}`,
    later ? `${stepOf(last)} 뒤로 두 칸이 안 바뀐다` : "바뀐다",
  ]);
  return fence("text", columns(lines));
}

/** `invariant` ② — 경계 입력. */
function invariantEdges(): string {
  const 목록: [string, string, number, Edge[], number[]][] = [
    [
      "정점 하나, 가중치 42",
      "더하는 반복문이 한 번도 실행되지 않는다 · dp1[0] 쪽이 크다",
      1,
      [],
      [42],
    ],
    [
      "정점 하나, 가중치 -5",
      "더하는 반복문이 한 번도 실행되지 않는다 · dp0[0] 쪽이 크다",
      1,
      [],
      [-5],
    ],
    [
      "경로 0-1-2, 가중치 -1 -2 -3",
      "모든 정점에서 dp0 쪽이 커서 위로 0 만 올라간다",
      3,
      pathTree(3),
      [-1, -2, -3],
    ],
    [
      "간선 하나, 가중치 5 와 7",
      "뿌리의 dp0 이 자식 1 의 dp1 을 받는다",
      2,
      pathTree(2),
      [5, 7],
    ],
    [
      "별, 가운데 1 · 잎 5 넷",
      "뿌리의 dp0 에 잎 넷의 dp1 이 모두 더해진다",
      5,
      starTree(5),
      [1, 5, 5, 5, 5],
    ],
  ];
  const rows = 목록.map(([이름, 자리, n, e, w]) => {
    const t = traced(n, e, w);
    const f = t.steps.at(-1) as Snap;
    return [이름, 자리, `${f.dp0[0]} · ${f.dp1[0]}`, comma(t.answer)];
  });
  return md(["입력", "처리되는 자리", "뿌리의 두 칸", "정본의 답"], rows, [3]);
}

/** `invariant` ③ — 「고른다」를 지키던 줄을 바꾼 코드가 낸 값. */
function invariantMutant(): string {
  const rows = 변이표.map(([이름, n, edges, weights]) => {
    const a = treeMaxIndependentSet(n, edges, weights);
    const b = 자식도고르기.treeMaxIndependentSet(n, edges, weights);
    return [이름, comma(a), comma(b), 같다(a, b)];
  });
  return md(["입력", "바른 코드", "큰 쪽을 더한 코드", "두 답"], rows, [1, 2]);
}

/** `invariant` ③ — 바꾼 코드가 정점 1 에서 무엇을 세는가. 변이와 같은 줄을 바꾼 기록 사본. */
function invariantMutantTrace(): string {
  const adj = adjacency(N, EDGES);
  const { order, parent } = bfsOrder(N, adj);
  const dp0 = new Array<number>(N).fill(0);
  const dp1 = [...W];
  const parts1: string[] = [];
  for (let k = N - 1; k >= 1; k--) {
    const v = order[k] as number;
    const p = parent[v] as number;
    const big1 = Math.max(dp0[v] as number, dp1[v] as number);
    if (p === 1) parts1.unshift(`max(${dp0[v]}, ${dp1[v]})`);
    dp0[p] = (dp0[p] as number) + big1;
    dp1[p] = (dp1[p] as number) + big1;
  }
  const answer = Math.max(dp0[0] as number, dp1[0] as number);
  if (!중화 && answer !== 자식도고르기.treeMaxIndependentSet(N, EDGES, W)) {
    throw new Error("바꾼 줄의 기록 사본이 변이와 다른 답을 냈다");
  }
  const kids = childrenOf(N, EDGES)[1] as number[];
  return fence(
    "text",
    columns([
      ["바꾼 코드의 dp1[1]", `${W[1]} + ${parts1.join(" + ")} = ${dp1[1]}`],
      [
        "그 합에 든 정점",
        `${setOf([1, ...kids])} — 간선 ${kids.map((u) => `[1, ${u}]`).join(" · ")} 의 양 끝이 함께 들었다`,
      ],
      [
        "바른 코드의 dp1[1]",
        `${W[1]} + ${kids.map((u) => String(FINAL.dp0[u])).join(" + ")} = ${FINAL.dp1[1]}`,
      ],
      ["뿌리의 답", `바꾼 코드 ${answer} · 바른 코드 ${FINAL.answer}`],
    ]),
  );
}

/** `perf.derive` — 전개 입력의 기본 연산을 갈래별로. */
function perfDerive(): string {
  const o = iterativeOps(N, EDGES);
  const five = 5 * N - 5;
  return [
    md(
      ["갈래", "기본 연산", "근거"],
      [
        [
          "이웃 목록에 넣기",
          comma(o.build),
          `${stepOf(0)} — 간선 ${EDGES.length} 개를 양쪽 목록에 한 번씩`,
        ],
        [
          "이웃 목록 항목 읽기",
          comma(o.look),
          `${stepOf(2)} — 순회가 목록 ${N} 개를 한 번씩 끝까지`,
        ],
        [
          "자식을 부모에 더하기",
          comma(o.fold),
          `${stepOf(3)}~${stepOf(N + 1)} — 뿌리를 뺀 정점마다 한 번`,
        ],
      ],
      [1],
    ),
    "",
    `세 갈래의 합은 ${comma(o.total)} 번이고, 5n − 5 = ${five}${과와(five)} 같습니다.`,
  ].join("\n");
}

/** `perf.derive` — 닫힌 형태와 센 값의 대조. */
function perfClosedForm(): string {
  const 입력: [string, number, Edge[]][] = [
    ["전개 입력", N, EDGES],
    ["경로 100 정점", 100, pathTree(100)],
    ["별 1,000 정점", 1_000, starTree(1_000)],
    ["완전 이진 트리 20,000 정점", 20_000, binaryTree(20_000)],
  ];
  let off = 0;
  const rows = 입력.map(([이름, n, e]) => {
    const got = iterativeOps(n, e).total;
    off += Math.abs(got - (5 * n - 5));
    return [이름, comma(n), comma(got), comma(5 * n - 5)];
  });
  const bigN = 100_000;
  return [
    md(["입력", "정점 n", "센 기본 연산", "5n − 5"], rows, [1, 2, 3]),
    "",
    `네 입력에서 센 값과 5n − 5 의 차이를 모두 더하면 ${off} 입니다. 정점 ${comma(bigN)} 개에 넣으면 5n − 5 = ${comma(5 * bigN - 5)} 번이고, 메모리는 이웃 목록 2(n − 1) 칸과 배열 넷의 4n 칸을 더한 6n − 2 = ${comma(6 * bigN - 2)} 칸입니다.`,
  ].join("\n");
}

/** `perf.worst` — 모양이 비용을 가르는가. 반복판과 재귀판을 나란히 잰다. */
function perfShape(): string {
  const n = 20_000;
  const 모양: [string, (n: number) => Edge[]][] = [
    ["경로", pathTree],
    ["별", starTree],
    ["완전 이진 트리", binaryTree],
    ["애벌레", caterpillar],
  ];
  const ops = new Set<number>();
  const rows = 모양.map(([이름, make]) => {
    const edges = make(n);
    const weights = new Array<number>(n).fill(1);
    const r = recursive(n, edges, weights);
    const o = iterativeOps(n, edges).total;
    ops.add(o);
    return [
      이름,
      comma(o),
      comma(r.depth),
      comma(treeMaxIndependentSet(n, edges, weights)),
    ];
  });
  return [
    md(
      [
        `모양 (n = ${comma(n)}, 가중치 전부 1)`,
        "정본의 기본 연산",
        "재귀판의 최대 호출 깊이",
        "답",
      ],
      rows,
      [1, 2, 3],
    ),
    "",
    `정본의 기본 연산은 네 모양에서 ${ops.size} 가지 값으로 나왔습니다.`,
  ].join("\n");
}

/** `perf.worst` — 규모 상한에서 두 판이 갈리는 자리. */
function perfDeep(): string {
  const n = 100_000;
  const edges = pathTree(n);
  const weights = new Array<number>(n).fill(1);
  let 재귀: string;
  try {
    재귀 = comma(recursive(n, edges, weights).answer);
  } catch (e) {
    재귀 = e instanceof RangeError ? "RangeError 로 멈춘다" : "멈춘다";
  }
  return md(
    [`경로, n = ${comma(n)}, 가중치 전부 1`, "결과"],
    [
      [
        "반복판 (이 글의 코드)",
        comma(treeMaxIndependentSet(n, edges, weights)),
      ],
      ["재귀판", 재귀],
      ["재귀판이 쌓아야 할 호출 깊이", comma(n)],
    ],
  );
}

/** `selfcheck` — 답이 붙는 문제의 상태. */
function selfcheckState(): string {
  const at = (v: number) =>
    WALK.steps.findIndex((s) => s.kind === "fold" && s.v === v);
  const i6 = at(6);
  const i5 = at(5);
  const s6 = WALK.steps[i6] as Snap;
  const s5 = WALK.steps[i5] as Snap;
  return fence(
    "text",
    columns([
      [
        stepOf(i6),
        `dp0[5] = ${s6.before?.dp0} + max(dp0[6], dp1[6]) = ${s6.before?.dp0} + max(${s6.dp0[6]}, ${s6.dp1[6]}) = ${s6.dp0[5]}`,
      ],
      [
        stepOf(i5),
        `dp1[2] = ${s5.before?.dp1} + dp0[5] = ${s5.before?.dp1} + ${s5.dp0[5]} = ${s5.dp1[2]}`,
      ],
    ]),
  );
}

/** `selfcheck` — 그 두 칸이 뜻하는 집합. */
function selfcheckSets(): string {
  const a = bestSet(N, EDGES, W, 5, false);
  const b = bestSet(N, EDGES, W, 2, true);
  const c = bestSet(N, EDGES, W, 2, false);
  return fence(
    "text",
    columns([
      [`dp0[5] = ${a.sum}`, `고른 정점 ${setOf(a.set)}`],
      [`dp1[2] = ${b.sum}`, `고른 정점 ${setOf(b.set)}`],
      [
        `dp0[2] = ${c.sum}`,
        `고른 정점 ${setOf(c.set)} — 이쪽이 커서 정점 2 는 안 골라진다`,
      ],
    ]),
  );
}

/**
 * `deep.optimal` — 채운 DP 테이블을 뿌리에서 아래로 따라가 고른 정점 목록을 복원한다. 부모를 골랐으면 안
 * 고르고, 아니면 `dp1[v] > dp0[v]` 일 때만 고른다. 전개 입력의 복원 결과와, 무작위 트리에서 복원한 집합이
 * 독립이고 합이 정본의 답과 같은지를 함께 낸다(`traced` 가 답을 정본과 맞댄다).
 */
function reconstruct(
  n: number,
  edges: Edge[],
  weights: number[],
): { pick: number[]; rows: string[][]; answer: number } {
  const t = traced(n, edges, weights);
  const f = t.steps.at(-1) as Snap;
  const taken = new Array<boolean>(n).fill(false);
  const rows: string[][] = [];
  for (const v of f.order as number[]) {
    const p = f.parent[v] as number; // 뿌리의 부모는 -1 이다(`bfsOrder`).
    const a = f.dp1[v] as number;
    const b = f.dp0[v] as number;
    if (p !== -1 && taken[p] === true) {
      rows.push([`정점 ${v}`, `부모 ${p}${을를(p)} 골랐다`, "", "→ 안 고른다"]);
      continue;
    }
    taken[v] = a > b;
    rows.push([
      `정점 ${v}`,
      p === -1 ? "부모 없음" : `부모 ${p}${을를(p)} 안 골랐다`,
      `dp1[${v}] = ${a} ${a > b ? ">" : "≤"} dp0[${v}] = ${b}`,
      a > b ? "→ 고른다" : "→ 안 고른다",
    ]);
  }
  const pick = taken.flatMap((x, v) => (x ? [v] : []));
  return { pick, rows, answer: t.answer };
}

function fitReconstruct(): string {
  const r = reconstruct(N, EDGES, W);
  const sum = r.pick.reduce((acc, v) => acc + (W[v] as number), 0);
  // 무작위 트리 — 정점 v 의 부모를 0 ~ v−1 에서 고른다. 씨앗을 고정해 실행마다 같은 트리가 나온다.
  let seed = 12345;
  const rand = (m: number): number => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed % m;
  };
  const trees = 1000;
  for (let it = 0; it < trees; it++) {
    const n = 1 + rand(10);
    const edges: Edge[] = [];
    for (let v = 1; v < n; v++) edges.push([rand(v), v]);
    const w = Array.from({ length: n }, () => rand(21) - 10);
    const got = reconstruct(n, edges, w);
    const set = new Set(got.pick);
    if (edges.some(([a, b]) => set.has(a) && set.has(b))) {
      throw new Error("복원한 집합이 독립이 아니다");
    }
    const total = got.pick.reduce((acc, v) => acc + (w[v] as number), 0);
    if (total !== got.answer) throw new Error("복원한 집합의 합이 답과 다르다");
  }
  return fence(
    "text",
    [
      columns(r.rows),
      `고른 정점 ${setOf(r.pick)} · 가중치 합 ${sum} = 답 ${r.answer}`,
      `무작위 트리 ${comma(trees)} 개(정점 1~10) — 이렇게 고른 집합이 모두 독립이고 합이 답과 같다`,
    ].join("\n"),
  );
}

export const PROOFS: Record<string, () => string> = {
  "concept-answer": conceptAnswer,
  "concept-size": conceptSize,
  "origin-naive": originNaive,
  "origin-repeat": originRepeat,
  "origin-one-value": originOneValue,
  "origin-one-value-trace": originOneValueTrace,
  "build-read-cell": buildReadCell,
  "build-relation": buildRelation,
  "build-contrast": buildContrast,
  "build-lists": buildLists,
  "build-init": buildInit,
  "build-order": buildOrder,
  "build-reverse": buildReverse,
  "build-fold-many": buildFoldMany,
  "build-fold-ready": buildFoldReady,
  "build-answer": buildAnswer,
  "build-premise": buildPremise,
  "build-state-count": buildStateCount,
  "walk-input": walkInput,
  "walk-adj": walkAdj,
  "walk-init": walkInit,
  "walk-bfs": walkBfs,
  "walk-order-mutant": walkOrderMutant,
  "walk-order-trace": walkOrderTrace,
  "walk-fold": walkFold,
  "walk-answer": walkAnswer,
  "walk-grandchild": walkGrandchild,
  "walk-grandchild-trace": walkGrandchildTrace,
  "walk-trace": walkTrace,
  "walk-result": walkResult,
  "related-edges": relatedEdges,
  "related-sum": relatedSum,
  "math-check": mathCheck,
  "math-snippet": mathSnippet,
  "math-bounds": mathBounds,
  "invariant-growth": invariantGrowth,
  "invariant-edges": invariantEdges,
  "invariant-mutant": invariantMutant,
  "invariant-mutant-trace": invariantMutantTrace,
  "perf-derive": perfDerive,
  "perf-closed-form": perfClosedForm,
  "perf-shape": perfShape,
  "perf-deep": perfDeep,
  "selfcheck-state": selfcheckState,
  "selfcheck-sets": selfcheckSets,
  "fit-reconstruct": fitReconstruct,
};
