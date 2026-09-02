/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run tools/check-proof.ts src/algorithms/dp/treeMaxIndependentSet/treeMaxIndependentSet-guide.md
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { treeMaxIndependentSet } from "./treeMaxIndependentSet-guide.ref.ts";

/* ────────────────────────── 칸 맞춤 ────────────────────────── */

/** 한글은 고정폭 화면에서 두 칸을 먹는다. 칸 맞춤을 글자 수로 하면 머리줄만 어긋난다. */
const width = (s: string): number =>
  [...s].reduce((n, c) => n + (/[ᄀ-ᇿ　-〿㄰-㆏가-힯一-鿿]/.test(c) ? 2 : 1), 0);

const pad = (s: string, to: number): string =>
  s + " ".repeat(Math.max(0, to - width(s)));

const padL = (s: string, to: number): string =>
  " ".repeat(Math.max(0, to - width(s))) + s;

/** `10011001` → `10,011,001`. `toLocaleString` 은 환경에 따라 갈려서 직접 적는다. */
const comma = (n: number | bigint): string =>
  String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

/** 열 폭을 내용에서 잰 뒤 표를 만든다. 첫 열은 왼쪽, 나머지는 오른쪽 정렬이다. */
function table(head: string[], rows: string[][]): string {
  const w = head.map((h, i) =>
    Math.max(width(h), ...rows.map((r) => width(r[i] ?? ""))),
  );
  const line = (cells: string[]): string =>
    cells
      .map((c, i) =>
        i === 0 ? pad(c, w[0] as number) : padL(c, w[i] as number),
      )
      .join("  ")
      .replace(/\s+$/, "");
  return [line(head), ...rows.map(line)].join("\n");
}

/** 자릿수가 21 을 넘으면 자리 수로 적는다 — `1.26 × 10^30102` 꼴. */
const big = (n: bigint): string => {
  const s = String(n);
  if (s.length <= 21) return comma(n);
  return `${s[0]}.${s.slice(1, 3)} × 10^${s.length - 1}`;
};

/* ────────────────────────── 전개 입력 ────────────────────────── */

/** `deep.walk` 가 끝까지 쓰는 입력. 본문의 다른 자리도 이 값을 가리킨다. */
const N = 7;
const EDGES: [number, number][] = [
  [0, 2],
  [0, 1],
  [1, 3],
  [1, 4],
  [2, 5],
  [5, 6],
];
const W = [9, 8, -2, 5, 1, 7, 4];

/** 무방향 간선 목록을 이웃 목록으로. 정본이 첫 줄에서 하는 것과 같다. */
function adjacency(n: number, edges: [number, number][]): number[][] {
  const adj: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    (adj[u] as number[]).push(v);
    (adj[v] as number[]).push(u);
  }
  return adj;
}

/** 뿌리 0 에서 너비 우선으로 정한 방문 순서와 부모. 정본의 가운데 토막과 같다. */
function bfsOrder(
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

/**
 * 정본과 같은 순서로 접되 **걸음마다 두 값을 기록한다.** 본문 전개 표의 출처다.
 * 마지막 값이 정본과 어긋나면 아래에서 실패한다.
 */
function foldSteps(
  n: number,
  edges: [number, number][],
  weights: number[],
): { k: number; v: number; p: number; dp0: number; dp1: number }[] {
  const adj = adjacency(n, edges);
  const { order, parent } = bfsOrder(n, adj);
  const dp0 = new Array<number>(n).fill(0);
  const dp1 = [...weights];
  const out: { k: number; v: number; p: number; dp0: number; dp1: number }[] =
    [];
  for (let k = n - 1; k >= 1; k--) {
    const v = order[k] as number;
    const p = parent[v] as number;
    dp0[p] = (dp0[p] as number) + Math.max(dp0[v] as number, dp1[v] as number);
    dp1[p] = (dp1[p] as number) + (dp0[v] as number);
    out.push({ k, v, p, dp0: dp0[p] as number, dp1: dp1[p] as number });
  }
  return out;
}

/** 두 값이 확정된 뒤의 표 전체. 검산과 여집합 계산이 함께 쓴다. */
function finalTable(
  n: number,
  edges: [number, number][],
  weights: number[],
): { dp0: number[]; dp1: number[]; order: number[]; parent: number[] } {
  const adj = adjacency(n, edges);
  const { order, parent } = bfsOrder(n, adj);
  const dp0 = new Array<number>(n).fill(0);
  const dp1 = [...weights];
  for (let k = n - 1; k >= 1; k--) {
    const v = order[k] as number;
    const p = parent[v] as number;
    dp0[p] = (dp0[p] as number) + Math.max(dp0[v] as number, dp1[v] as number);
    dp1[p] = (dp1[p] as number) + (dp0[v] as number);
  }
  return { dp0, dp1, order, parent };
}

// 기록판이 정본과 같은 답을 내지 않으면 아래 표들이 아무것도 뜻하지 않는다.
{
  const t = finalTable(N, EDGES, W);
  const mine = Math.max(t.dp0[0] as number, t.dp1[0] as number);
  if (mine !== treeMaxIndependentSet(N, EDGES, W)) {
    throw new Error("기록판의 마지막 값이 정본과 어긋난다");
  }
}

/* ────────────────────── 정의를 그대로 옮긴 전수 계산 ────────────────────── */

/** 뿌리 0 기준의 자식 목록. */
function childrenOf(n: number, edges: [number, number][]): number[][] {
  const adj = adjacency(n, edges);
  const { parent } = bfsOrder(n, adj);
  const kids: number[][] = Array.from({ length: n }, () => []);
  for (let v = 1; v < n; v++) (kids[parent[v] as number] as number[]).push(v);
  return kids;
}

/** 노드 `v` 의 서브트리에 속한 노드 전부. */
function subtree(kids: number[][], v: number): number[] {
  const out = [v];
  for (let i = 0; i < out.length; i++) {
    for (const u of kids[out[i] as number] as number[]) out.push(u);
  }
  return out;
}

/**
 * 정의를 그대로 옮긴 전수 계산 — 서브트리의 부분집합을 **전부** 만들어 독립인 것만 남기고
 * 최댓값을 고른다. `want` 가 참이면 `v` 를 반드시 포함한 것 중에서, 거짓이면 반드시 제외한
 * 것 중에서 고른다. 크기가 작을 때만 쓴다.
 */
function bySets(
  n: number,
  edges: [number, number][],
  weights: number[],
  v: number,
  want: boolean,
): number {
  const kids = childrenOf(n, edges);
  const nodes = subtree(kids, v);
  const idx = new Map(nodes.map((x, i) => [x, i]));
  const inner = edges.filter(([a, b]) => idx.has(a) && idx.has(b));
  let best = Number.NEGATIVE_INFINITY;
  for (let mask = 0; mask < 1 << nodes.length; mask++) {
    const has = (x: number) => ((mask >> (idx.get(x) as number)) & 1) === 1;
    if (has(v) !== want) continue;
    if (inner.some(([a, b]) => has(a) && has(b))) continue;
    let sum = 0;
    for (const x of nodes) if (has(x)) sum += weights[x] as number;
    if (sum > best) best = sum;
  }
  return best;
}

/* ────────────────────── 비교판들 ────────────────────── */

/** 부분집합을 전부 만들어 보는 방법. 간선 검사와 가중치 덧셈을 하나씩 센다. */
function bruteForce(
  n: number,
  edges: [number, number][],
  weights: number[],
): { best: number; checks: number; independent: number } {
  let best = 0;
  let checks = 0;
  let independent = 0;
  for (let mask = 0; mask < 1 << n; mask++) {
    let ok = true;
    for (const [u, v] of edges) {
      checks++;
      if ((mask >> u) & 1 && (mask >> v) & 1) {
        ok = false;
        break;
      }
    }
    if (!ok) continue;
    independent++;
    let sum = 0;
    for (let i = 0; i < n; i++) {
      checks++;
      if ((mask >> i) & 1) sum += weights[i] as number;
    }
    if (sum > best) best = sum;
  }
  return { best, checks, independent };
}

/**
 * **노드마다 값 하나만** 들고 올라가는 판. `best[v]` 는 「v 의 서브트리에서 얻는 최댓값」
 * 하나이고, 부모가 그 값을 그대로 더한다 — 자식이 고른 노드였는지를 부모가 알 수 없다.
 */
function oneValuePerNode(
  n: number,
  edges: [number, number][],
  weights: number[],
): { answer: number; reads: number } {
  const adj = adjacency(n, edges);
  const { order, parent } = bfsOrder(n, adj);
  const best = new Array<number>(n).fill(0);
  let reads = 0;
  for (let k = n - 1; k >= 0; k--) {
    const v = order[k] as number;
    best[v] = (best[v] as number) + Math.max(0, weights[v] as number);
    if (k >= 1) {
      const p = parent[v] as number;
      reads++;
      best[p] = (best[p] as number) + (best[v] as number);
    }
  }
  return { answer: best[0] as number, reads };
}

/**
 * **노드마다 값 하나 · 손자까지 보는 판.** 부모가 자식의 값만 받으면 자식이 고른 노드였는지
 * 알 수 없으므로, 「나를 고른다」 쪽을 손자에게서 직접 받는다. 값은 하나로 끝나는 대신
 * 이웃 목록을 두 단계 걸어야 한다.
 */
function oneValueViaGrandchildren(
  n: number,
  edges: [number, number][],
  weights: number[],
): { answer: number; reads: number } {
  const kids = childrenOf(n, edges);
  const adj = adjacency(n, edges);
  const { order } = bfsOrder(n, adj);
  const best = new Array<number>(n).fill(0);
  let reads = 0;
  for (let k = n - 1; k >= 0; k--) {
    const v = order[k] as number;
    let skip = 0;
    for (const u of kids[v] as number[]) {
      reads++;
      skip += best[u] as number;
    }
    let take = weights[v] as number;
    for (const u of kids[v] as number[]) {
      for (const g of kids[u] as number[]) {
        reads++;
        take += best[g] as number;
      }
    }
    best[v] = Math.max(skip, take);
  }
  return { answer: best[0] as number, reads };
}

/**
 * **노드마다 값 넷**을 두는 판 — 「부모를 골랐는가」와 「나를 고르는가」의 네 조합에 각각 한
 * 칸을 둔다. 부모를 고르고 나도 고르는 칸은 정의상 만들 수 없어 비워 둔다.
 */
function fourStatesPerNode(
  n: number,
  edges: [number, number][],
  weights: number[],
): { answer: number; reads: number } {
  const kids = childrenOf(n, edges);
  const memo = new Map<string, number>();
  let reads = 0;
  const solve = (v: number, parentTaken: boolean, take: boolean): number => {
    if (parentTaken && take) return Number.NEGATIVE_INFINITY;
    const key = `${v}|${parentTaken ? 1 : 0}|${take ? 1 : 0}`;
    const hit = memo.get(key);
    if (hit !== undefined) return hit;
    let sum = take ? (weights[v] as number) : 0;
    for (const u of kids[v] as number[]) {
      reads++;
      sum += Math.max(solve(u, take, false), solve(u, take, true));
    }
    memo.set(key, sum);
    return sum;
  };
  const answer = Math.max(solve(0, false, false), solve(0, false, true));
  return { answer, reads };
}

/**
 * **「부모를 고르면 손자까지 못 고른다」는 오해를 그대로 전개한 판.** 고른 노드의 자식만이
 * 아니라 손자까지 통째로 버린다 — 자식의 서브트리에서 손자 아래만 쓴다.
 */
function grandchildBanned(
  n: number,
  edges: [number, number][],
  weights: number[],
): number {
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
  return best(0);
}

/** 재귀로 적은 판. 최대 호출 깊이를 함께 낸다. */
function recursive(
  n: number,
  edges: [number, number][],
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

/** 정본이 하는 일의 수 — 이웃 목록에 넣기 · 이웃 하나 보기 · 자식 하나 더하기. */
function iterativeOps(n: number, edges: [number, number][]): number {
  const adj = adjacency(n, edges);
  let ops = 2 * edges.length;
  const parent = new Array<number>(n).fill(-1);
  const order = new Array<number>(n).fill(0);
  let tail = 1;
  for (let head = 0; head < tail; head++) {
    const v = order[head] as number;
    for (const u of adj[v] as number[]) {
      ops++;
      if (u === parent[v]) continue;
      parent[u] = v;
      order[tail] = u;
      tail++;
    }
  }
  return ops + (n - 1);
}

/* ────────────────────── 트리 모양 만들기 ────────────────────── */

const pathTree = (n: number): [number, number][] =>
  Array.from({ length: n - 1 }, (_, i) => [i, i + 1] as [number, number]);
const starTree = (n: number): [number, number][] =>
  Array.from({ length: n - 1 }, (_, i) => [0, i + 1] as [number, number]);
const binaryTree = (n: number): [number, number][] =>
  Array.from({ length: n - 1 }, (_, i) => [i >> 1, i + 1] as [number, number]);
/** 등뼈 하나에 잎을 하나씩 매단 모양. */
const caterpillar = (n: number): [number, number][] => {
  const spine = n >> 1;
  const edges: [number, number][] = [];
  for (let i = 1; i < spine; i++) edges.push([i - 1, i]);
  for (let j = spine; j < n; j++) edges.push([j - spine, j]);
  return edges;
};

/* ────────────────────────── 변이 ────────────────────────── */

/**
 * **순서를 뒤집지 않는 사본.** 정본은 방문 순서를 뒤에서부터 읽어 자식이 부모보다 먼저 오게
 * 하는데, 그 방향 하나를 앞에서부터로 바꾼다. 정본 소스에서 기계로 만든다.
 */
const 앞에서부터 = await loadMutant<{
  treeMaxIndependentSet(
    n: number,
    edges: [number, number][],
    weights: number[],
  ): number;
}>(new URL("./treeMaxIndependentSet-guide.ref.ts", import.meta.url).pathname, {
  swap: [/for \(let k = n - 1; k >= 1; k--\)/, "for (let k = 1; k < n; k++)"],
});

/**
 * **불변식의 「고른다」를 지키던 줄을 바꾼 사본.** 부모를 고를 때 자식은 안 고르는 값만
 * 쓸 수 있는데, 그 자리에서 두 값 중 큰 쪽을 쓰게 한다.
 */
const 자식도고르기 = await loadMutant<{
  treeMaxIndependentSet(
    n: number,
    edges: [number, number][],
    weights: number[],
  ): number;
}>(new URL("./treeMaxIndependentSet-guide.ref.ts", import.meta.url).pathname, {
  swap: [
    /dp1\[p\] = \(dp1\[p\] as number\) \+ \(dp0\[v\] as number\);/,
    "dp1[p] = (dp1[p] as number) + Math.max(dp0[v] as number, dp1[v] as number);",
  ],
});

/** 변이 대조에 쓰는 입력 목록. 이름과 값이 한 벌로 다닌다. */
const 변이표: [string, number, [number, number][], number[]][] = [
  ["전개 입력 (노드 7)", N, EDGES, W],
  ["경로 0-1-2, 가중치 5 1 5", 3, pathTree(3), [5, 1, 5]],
  ["경로 0-1-2-3, 가중치 10 1 1 10", 4, pathTree(4), [10, 1, 1, 10]],
  ["별, 중심 10 · 잎 1 넷", 5, starTree(5), [10, 1, 1, 1, 1]],
  ["별, 중심 1 · 잎 5 넷", 5, starTree(5), [1, 5, 5, 5, 5]],
  ["노드 하나, 가중치 -5", 1, [], [-5]],
];

// 어느 입력에서도 답이 안 바뀌면 「달라진다」가 거짓이다. 실행이 그것을 판정한다.
for (const [이름, 사본] of [
  ["앞에서부터", 앞에서부터],
  ["자식도 고르기", 자식도고르기],
] as [string, { treeMaxIndependentSet: typeof treeMaxIndependentSet }][]) {
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

// 「손자까지 배제」 판도 마찬가지다. 오해가 답을 안 바꾸면 반례가 성립하지 않는다.
if (
  변이표.every(
    ([, n, edges, weights]) =>
      treeMaxIndependentSet(n, edges, weights) ===
      grandchildBanned(n, edges, weights),
  )
) {
  throw new Error("「손자까지 배제」 판이 어느 입력에서도 답을 바꾸지 못했다");
}

/**
 * **`invariant` 절이 내미는 주장 하나를 실행이 진다** — 「고른다」 쪽에서 자식의 큰 값을
 * 쓰게 바꾼 사본은 파트 1 의 「값 하나만 두는 판」과 **같은 것을 계산한다.** 본문이 그렇게
 * 적으므로 어긋나면 여기서 실패한다.
 */
for (const [이름, n, edges, weights] of 변이표) {
  if (
    자식도고르기.treeMaxIndependentSet(n, edges, weights) !==
    oneValuePerNode(n, edges, weights).answer
  ) {
    throw new Error(`${이름} 에서 변이판과 값 하나 판의 답이 다르다`);
  }
}

/** 「값 하나 · 손자까지」와 「값 넷」은 정본과 같은 답을 내야 한다. 무작위 트리로 잰다. */
{
  let seed = 20260903;
  const rnd = (): number => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  for (let t = 0; t < 400; t++) {
    const n = 1 + Math.floor(rnd() * 9);
    const edges: [number, number][] = [];
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

/* ────────────────────────── 증명 블록 ────────────────────────── */

export const PROOFS: Record<string, () => string> = {
  /** `deep.build` ② — 부분집합을 전부 만들어 보는 방법이 어디서 끊기는가. */
  naiveSubsets: () => {
    const rows = [4, 8, 12, 16, 20].map((n) => {
      const edges = caterpillar(n);
      const weights = Array.from(
        { length: n },
        (_, i) => 1 + ((i * 7) % 9) - 3,
      );
      const b = bruteForce(n, edges, weights);
      return [
        comma(n),
        big(2n ** BigInt(n)),
        comma(b.independent),
        comma(b.checks),
        comma(iterativeOps(n, edges)),
      ];
    });
    rows.push([
      "100,000",
      big(2n ** 100000n),
      "세지 못했다",
      "세지 못했다",
      comma(iterativeOps(100_000, caterpillar(100_000))),
    ]);
    return table(
      [
        "노드 수 n",
        "부분집합 2^n",
        "그중 독립인 것",
        "검사 횟수",
        "이 글의 일 수",
      ],
      rows,
    );
  },

  /** `deep.build` ⑤ — 노드마다 값을 하나만 들고 올라가면 답이 어떻게 갈리는가. */
  oneValue: () =>
    table(
      ["입력", "정본 (값 둘)", "값 하나만"],
      변이표.map(([이름, n, edges, weights]) => [
        이름,
        comma(treeMaxIndependentSet(n, edges, weights)),
        comma(oneValuePerNode(n, edges, weights).answer),
      ]),
    ),

  /** `deep.build` ⑥ — 상태를 몇 개로 잡을 것인가를 값으로 정한다. */
  stateCount: () => {
    const 입력: [string, number, [number, number][], number[]][] = [
      ["전개 입력 (노드 7)", N, EDGES, W],
      ["별 (중심 1 · 잎 5 넷)", 5, starTree(5), [1, 5, 5, 5, 5]],
    ];
    const rows: string[][] = [];
    for (const [이름, n, edges, weights] of 입력) {
      const one = oneValuePerNode(n, edges, weights);
      const gc = oneValueViaGrandchildren(n, edges, weights);
      const four = fourStatesPerNode(n, edges, weights);
      rows.push([
        `${이름} — 값 하나, 자식만 본다`,
        comma(one.answer),
        comma(n),
        comma(one.reads),
      ]);
      rows.push([
        `${이름} — 값 하나, 손자까지 본다`,
        comma(gc.answer),
        comma(n),
        comma(gc.reads),
      ]);
      rows.push([
        `${이름} — 값 둘, 자식만 본다`,
        comma(treeMaxIndependentSet(n, edges, weights)),
        comma(2 * n),
        comma(foldSteps(n, edges, weights).length),
      ]);
      rows.push([
        `${이름} — 값 넷, 자식만 본다`,
        comma(four.answer),
        comma(4 * n),
        comma(four.reads),
      ]);
    }
    return table(
      [
        "노드마다 몇 값을 두는가",
        "그 판이 낸 답",
        "상태 칸 수",
        "자손을 읽은 횟수",
      ],
      rows,
    );
  },

  /** `deep.walk.step` — 순서를 뒤에서부터 읽어 여섯 번 더한 자취. */
  foldTrace: () => {
    const steps = foldSteps(N, EDGES, W);
    const 이름 = ["T4", "T5", "T6", "T7", "T8", "T9"];
    return table(
      ["단계", "순서 k", "자식 v", "부모 p", "부모의 dp0", "부모의 dp1"],
      steps.map((s, i) => [
        이름[i] as string,
        comma(s.k),
        comma(s.v),
        comma(s.p),
        comma(s.dp0),
        comma(s.dp1),
      ]),
    );
  },

  /** `deep.walk.pause` — 순서를 안 뒤집으면 부모가 시작값만 더한다. */
  orderMutant: () =>
    table(
      ["입력", "정본", "앞에서부터 더한 판"],
      변이표.map(([이름, n, edges, weights]) => [
        이름,
        comma(treeMaxIndependentSet(n, edges, weights)),
        comma(앞에서부터.treeMaxIndependentSet(n, edges, weights)),
      ]),
    ),

  /** `deep.walk.pause` — 「부모를 고르면 손자까지 못 고른다」는 오해가 낸 답. */
  grandchildMyth: () =>
    table(
      ["입력", "정본", "손자까지 배제한 판"],
      변이표.map(([이름, n, edges, weights]) => [
        이름,
        comma(treeMaxIndependentSet(n, edges, weights)),
        comma(grandchildBanned(n, edges, weights)),
      ]),
    ),

  /** `deep.walk.final` — 전체 코드를 그대로 실행한 값. */
  finalRun: () => {
    const 목록: [string, number, [number, number][], number[]][] = [
      ["전개 입력 (노드 7)", N, EDGES, W],
      ["경로 0-1-2-3, 10 1 1 10", 4, pathTree(4), [10, 1, 1, 10]],
      ["경로 0-1-2, 3 10 3", 3, pathTree(3), [3, 10, 3]],
      ["별, 중심 10 · 잎 1 넷", 5, starTree(5), [10, 1, 1, 1, 1]],
      ["별, 중심 1 · 잎 5 넷", 5, starTree(5), [1, 5, 5, 5, 5]],
      ["노드 하나, 42", 1, [], [42]],
      ["노드 하나, -5", 1, [], [-5]],
      ["가중치가 전부 음수", 3, pathTree(3), [-1, -2, -3]],
      ["간선 하나, 5 와 7", 2, pathTree(2), [5, 7]],
      ["경로 다섯, 전부 1", 5, pathTree(5), [1, 1, 1, 1, 1]],
    ];
    const 폭 = Math.max(...목록.map(([이름]) => width(이름)));
    return 목록
      .map(
        ([이름, n, edges, weights]) =>
          `${pad(이름, 폭)}  →  ${comma(treeMaxIndependentSet(n, edges, weights))}`,
      )
      .join("\n");
  },

  /** `deep.math` ② — 정의를 전수 계산으로 옮겨 표의 두 값과 맞춘다. */
  subtreeCheck: () => {
    const t = finalTable(N, EDGES, W);
    const kids = childrenOf(N, EDGES);
    return table(
      [
        "노드 v",
        "서브트리 노드",
        "정의로 센 A(v)",
        "표의 dp0",
        "정의로 센 B(v)",
        "표의 dp1",
      ],
      Array.from({ length: N }, (_, v) => [
        comma(v),
        subtree(kids, v)
          .sort((a, b) => a - b)
          .join(" "),
        comma(bySets(N, EDGES, W, v, false)),
        comma(t.dp0[v] as number),
        comma(bySets(N, EDGES, W, v, true)),
        comma(t.dp1[v] as number),
      ]),
    );
  },

  /** `deep.math` ④ — 닫아 둔 두 경계에 제약 규모를 넣는다. */
  boundValues: () => {
    const 모양: [string, number, (n: number) => [number, number][]][] = [
      ["경로", 100_000, pathTree],
      ["별", 100_000, starTree],
      ["애벌레", 100_000, caterpillar],
      ["완전 이진 트리 (높이 15)", 65_535, binaryTree],
    ];
    return table(
      ["모양 (가중치가 전부 1)", "노드 수 n", "답", "하한 ⌈n/2⌉", "상한 n−1"],
      모양.map(([이름, n, make]) => [
        이름,
        comma(n),
        comma(treeMaxIndependentSet(n, make(n), new Array<number>(n).fill(1))),
        comma(Math.ceil(n / 2)),
        comma(n - 1),
      ]),
    );
  },

  /** `invariant` ③ — 「틀린다」가 아니라 **실제 값**을 내미는 것이 이 블록의 일이다. */
  invariantMutant: () =>
    table(
      ["입력", "바른 코드", "큰 쪽을 더한 코드"],
      변이표.map(([이름, n, edges, weights]) => [
        이름,
        comma(treeMaxIndependentSet(n, edges, weights)),
        comma(자식도고르기.treeMaxIndependentSet(n, edges, weights)),
      ]),
    ),

  /** `related` — 고른 집합과 그 여집합의 가중치 합. */
  vertexCover: () => {
    const 입력: [string, number, [number, number][], number[]][] = [
      ["전개 입력 (노드 7)", N, EDGES, W],
      ["경로 0-1-2-3", 4, pathTree(4), [10, 1, 1, 10]],
      ["별, 중심 10 · 잎 1 넷", 5, starTree(5), [10, 1, 1, 1, 1]],
      ["경로 0-1-2, 3 10 3", 3, pathTree(3), [3, 10, 3]],
    ];
    return table(
      ["입력", "전체 합 W", "고른 쪽 (답)", "남은 쪽 W − 답"],
      입력.map(([이름, n, edges, weights]) => {
        const total = weights.reduce((a, b) => a + b, 0);
        const answer = treeMaxIndependentSet(n, edges, weights);
        return [이름, comma(total), comma(answer), comma(total - answer)];
      }),
    );
  },

  /** `perf.worst` — 모양이 비용을 가르는가. 반복판과 재귀판을 나란히 잰다. */
  shapeCost: () => {
    const n = 20_000;
    const 모양: [string, (n: number) => [number, number][]][] = [
      ["경로", pathTree],
      ["별", starTree],
      ["완전 이진 트리", binaryTree],
      ["애벌레", caterpillar],
    ];
    return table(
      [
        "입력 모양 (n = 20,000)",
        "반복판이 하는 일",
        "재귀판의 최대 깊이",
        "답",
      ],
      모양.map(([이름, make]) => {
        const edges = make(n);
        const weights = new Array<number>(n).fill(1);
        const r = recursive(n, edges, weights);
        return [
          이름,
          comma(iterativeOps(n, edges)),
          comma(r.depth),
          comma(treeMaxIndependentSet(n, edges, weights)),
        ];
      }),
    );
  },

  /** `perf.worst` — 제약 상한에서 두 판이 갈리는 자리. */
  deepInput: () => {
    const n = 100_000;
    const edges = pathTree(n);
    const weights = new Array<number>(n).fill(1);
    let 재귀: string;
    try {
      재귀 = comma(recursive(n, edges, weights).answer);
    } catch (e) {
      재귀 = e instanceof RangeError ? "RangeError 로 멈춘다" : "멈춘다";
    }
    return table(
      ["경로, n = 100,000, 가중치가 전부 1", "결과"],
      [
        [
          "반복판 (이 글의 코드)",
          comma(treeMaxIndependentSet(n, edges, weights)),
        ],
        ["재귀판", 재귀],
        ["재귀판이 쌓았을 호출 깊이", comma(n)],
      ],
    );
  },
};
