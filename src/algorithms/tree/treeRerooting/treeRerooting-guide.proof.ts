/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run tools/check-proof.ts src/algorithms/tree/treeRerooting/treeRerooting-guide.md
 *
 * **계수를 세는 사본이 여럿 있다.** 정본은 몇 번 셌는지를 내보내지 않으므로, 세는 자리만
 * 덧붙인 사본이 아니면 계수를 낼 방법이 없다. **답이 맞는지는 사본이 아니라 정본이 진다** —
 * 아래 표의 「답」 칸은 전부 정본이나 정본에서 기계로 만든 변이가 낸 값이고, 사본은 계수와
 * 중간 상태만 낸다. 사본이 정본과 같은 답을 내는지는 `자기대조()` 가 이 파일을 읽을 때
 * 확인한다.
 *
 * **변이가 아무것도 안 바꾸는지를 검사하는 자리는 중화 실행을 피해 간다.** `check-proof` 가
 * 이 파일을 한 번 더 부를 때는 `loadMutant` 이 정본을 그대로 돌려주므로(중화), 그 상태에서
 * 「변이가 답을 안 바꿨다」로 던지면 중화 대조 자체가 실행되지 않는다. 중화 여부는 변이
 * 모듈의 함수가 정본과 **같은 객체인가**로 알아낸다.
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { treeRerooting } from "./treeRerooting-guide.ref.ts";

type Edges = [number, number][];

/* ────────────────────────── 고정 입력 ────────────────────────── */

/**
 * 본문 전개가 쓰는 트리. 정점 일곱 · 간선 여섯이다.
 *
 * 갈래를 한 입력에서 전부 실행하려고 이 모양을 골랐다 — 뿌리에 자식이 둘이고, 한쪽은 잎
 * 둘을 단 깊이 2 이며, 다른 쪽은 깊이 3 까지 한 줄로 이어진다. 그래서 첫 순회에서 스택이
 * 두 갈래를 담는 자리와 한 갈래를 끝까지 내려가는 자리가 둘 다 나오고, 부분트리 크기가
 * 1 · 2 · 3 · 7 로 갈린다.
 */
export const WALK_N = 7;
export const WALK_EDGES: Edges = [
  [0, 1],
  [0, 2],
  [1, 3],
  [1, 4],
  [2, 5],
  [5, 6],
];

/** 문제 예시의 작은 트리. 정점 다섯. */
export const SMALL_N = 5;
export const SMALL_EDGES: Edges = [
  [0, 1],
  [0, 2],
  [1, 3],
  [1, 4],
];

/** 한 줄로 이어진 트리 `0-1-…-(v−1)`. */
export function chain(v: number): Edges {
  const edges: Edges = [];
  for (let i = 0; i + 1 < v; i++) edges.push([i, i + 1]);
  return edges;
}

/** 가운데 정점 0 에 나머지 전부가 붙은 트리. */
export function star(v: number): Edges {
  const edges: Edges = [];
  for (let i = 1; i < v; i++) edges.push([0, i]);
  return edges;
}

/** 자리 `i` 의 부모가 `⌊(i−1)/2⌋` 인 완전 이진 트리. */
export function balanced(v: number): Edges {
  const edges: Edges = [];
  for (let i = 1; i < v; i++) edges.push([(i - 1) >> 1, i]);
  return edges;
}

/** 등뼈 하나에 잎을 고르게 붙인 트리. */
export function caterpillar(v: number): Edges {
  const edges: Edges = [];
  const spine = Math.max(1, v >> 1);
  for (let i = 1; i < spine; i++) edges.push([i - 1, i]);
  for (let i = spine; i < v; i++) edges.push([(i - spine) % spine, i]);
  return edges;
}

/** 정점 `i` 의 부모를 생성식으로 고른 트리. 시드를 고정해 실행마다 같은 모양이 나온다. */
export function randomTree(v: number, seed0: number): Edges {
  let seed = seed0;
  const next = (): number => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed;
  };
  const edges: Edges = [];
  for (let i = 1; i < v; i++) edges.push([next() % i, i]);
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

/** `[11, 12, 12, 17, 17, 15, 20]` 꼴 — 본문 표기와 같다. */
const show = (xs: number[]): string => `[${xs.join(", ")}]`;

/** 공백으로 벌린 배열 — 자리 번호를 세기 좋은 자리에 쓴다. */
const bare = (xs: number[]): string => xs.join(" ");

/** `4,999,950,000` 꼴 — 본문 표기와 같다. */
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

/* ────────────────────── 계수와 상태를 세는 사본 ────────────────────── */

export interface Counts {
  answer: number[];
  order: number[];
  parent: number[];
  depth: number[];
  size: number[];
  /** 이웃 목록 항목을 읽은 횟수. */
  reads: number;
  /** 스택에서 꺼낸 횟수. */
  pops: number;
  /** 스택에 담은 횟수. */
  pushes: number;
  /** 부분트리 크기를 더한 횟수. */
  adds: number;
  /** 답을 적은 횟수. 기준 뿌리의 한 번을 포함한다. */
  writes: number;
  /** 스택이 가장 길었을 때의 항목 수. */
  peak: number;
  /** 걸음마다의 `size` 배열. 첫 원소가 시작값이다. */
  sizeFrames: number[][];
  /** 걸음마다의 `answer` 배열. 첫 원소가 시작값이다. */
  answerFrames: number[][];
}

/** 정본과 같은 절차에 세는 자리와 걸음 기록만 덧붙인 사본. */
export function counted(n: number, edges: Edges): Counts {
  const near: number[][] = Array.from({ length: n }, () => []);
  let reads = 0;
  for (const [a, b] of edges) {
    (near[a] as number[]).push(b);
    (near[b] as number[]).push(a);
  }
  const parent: number[] = Array.from({ length: n }, () => -1);
  const depth: number[] = Array.from({ length: n }, () => 0);
  const size: number[] = Array.from({ length: n }, () => 1);
  const order: number[] = [];
  const seen: boolean[] = Array.from({ length: n }, () => false);
  const stack: number[] = [0];
  seen[0] = true;
  let pops = 0;
  let pushes = 1;
  let peak = 1;
  while (stack.length > 0) {
    const u = stack.pop() as number;
    pops++;
    order.push(u);
    for (const w of near[u] as number[]) {
      reads++;
      if (seen[w]) continue;
      seen[w] = true;
      parent[w] = u;
      depth[w] = (depth[u] as number) + 1;
      stack.push(w);
      pushes++;
      peak = Math.max(peak, stack.length);
    }
  }
  const sizeFrames: number[][] = [size.slice()];
  let adds = 0;
  for (let i = order.length - 1; i >= 1; i--) {
    const w = order[i] as number;
    const p = parent[w] as number;
    size[p] = (size[p] as number) + (size[w] as number);
    adds++;
    sizeFrames.push(size.slice());
  }
  const answer: number[] = Array.from({ length: n }, () => 0);
  let atRoot = 0;
  for (let v = 0; v < n; v++) atRoot += depth[v] as number;
  answer[0] = atRoot;
  let writes = 1;
  const answerFrames: number[][] = [answer.slice()];
  for (let i = 1; i < order.length; i++) {
    const w = order[i] as number;
    const p = parent[w] as number;
    answer[w] = (answer[p] as number) + n - 2 * (size[w] as number);
    writes++;
    answerFrames.push(answer.slice());
  }
  return {
    answer,
    order,
    parent,
    depth,
    size,
    reads,
    pops,
    pushes,
    adds,
    writes,
    peak,
    sizeFrames,
    answerFrames,
  };
}

/**
 * 걸음 기록 없이 계수만 내는 사본. 정점 100,000 짜리 입력을 여러 벌 다루는 블록이 이것을
 * 쓴다 — 걸음마다 배열을 복사하면 그 규모에서 `check-proof` 가 분 단위로 느려진다.
 */
export function countedLite(
  n: number,
  edges: Edges,
): { ops: number; peak: number; max: number; total: number } {
  const near: number[][] = Array.from({ length: n }, () => []);
  let ops = 0;
  for (const [a, b] of edges) {
    (near[a] as number[]).push(b);
    (near[b] as number[]).push(a);
    ops += 2;
  }
  const parent: number[] = Array.from({ length: n }, () => -1);
  const depth: number[] = Array.from({ length: n }, () => 0);
  const size: number[] = Array.from({ length: n }, () => 1);
  const order: number[] = [];
  const seen: boolean[] = Array.from({ length: n }, () => false);
  const stack: number[] = [0];
  seen[0] = true;
  let peak = 1;
  while (stack.length > 0) {
    const u = stack.pop() as number;
    ops++;
    order.push(u);
    for (const w of near[u] as number[]) {
      ops++;
      if (seen[w]) continue;
      seen[w] = true;
      parent[w] = u;
      depth[w] = (depth[u] as number) + 1;
      stack.push(w);
      ops++;
      peak = Math.max(peak, stack.length);
    }
  }
  for (let i = order.length - 1; i >= 1; i--) {
    const w = order[i] as number;
    const p = parent[w] as number;
    size[p] = (size[p] as number) + (size[w] as number);
    ops++;
  }
  const answer: number[] = Array.from({ length: n }, () => 0);
  let atRoot = 0;
  for (let v = 0; v < n; v++) {
    atRoot += depth[v] as number;
    ops++;
  }
  answer[0] = atRoot;
  let max = atRoot;
  let total = atRoot;
  for (let i = 1; i < order.length; i++) {
    const w = order[i] as number;
    const p = parent[w] as number;
    answer[w] = (answer[p] as number) + n - 2 * (size[w] as number);
    ops++;
    max = Math.max(max, answer[w] as number);
    total += answer[w] as number;
  }
  return { ops, peak, max, total };
}

/** 정점 하나에서 너비 우선 탐색을 한 번 실행해 거리와 그 합을 낸다. */
export function bfsFrom(
  n: number,
  edges: Edges,
  src: number,
): { dist: number[]; sum: number; ops: number } {
  const near: number[][] = Array.from({ length: n }, () => []);
  for (const [a, b] of edges) {
    (near[a] as number[]).push(b);
    (near[b] as number[]).push(a);
  }
  const dist: number[] = Array.from({ length: n }, () => -1);
  dist[src] = 0;
  const queue: number[] = [src];
  let ops = 0;
  let sum = 0;
  for (let head = 0; head < queue.length; head++) {
    const u = queue[head] as number;
    ops++;
    sum += dist[u] as number;
    for (const w of near[u] as number[]) {
      ops++;
      if ((dist[w] as number) >= 0) continue;
      dist[w] = (dist[u] as number) + 1;
      queue.push(w);
      ops++;
    }
  }
  return { dist, sum, ops };
}

/** 정점마다 너비 우선 탐색을 한 번씩 실행하는 방법. 가장 단순한 방법이다. */
export function naive(
  n: number,
  edges: Edges,
): { answer: number[]; ops: number } {
  const answer: number[] = [];
  let ops = 2 * edges.length;
  for (let s = 0; s < n; s++) {
    const r = bfsFrom(n, edges, s);
    answer.push(r.sum);
    ops += r.ops;
  }
  return { answer, ops };
}

/** 스택 대신 큐로 꺼내는 사본. 변이 모듈이 못 내보내는 방문 순서를 이것이 낸다. */
export function queueOrder(n: number, edges: Edges): number[] {
  const near: number[][] = Array.from({ length: n }, () => []);
  for (const [a, b] of edges) {
    (near[a] as number[]).push(b);
    (near[b] as number[]).push(a);
  }
  const order: number[] = [];
  const seen: boolean[] = Array.from({ length: n }, () => false);
  const queue: number[] = [0];
  seen[0] = true;
  for (let head = 0; head < queue.length; head++) {
    const u = queue[head] as number;
    order.push(u);
    for (const w of near[u] as number[]) {
      if (seen[w]) continue;
      seen[w] = true;
      queue.push(w);
    }
  }
  return order;
}

/** 재귀로 적은 사본. 사슬 트리에서 호출 깊이가 정점 수와 같아진다. */
export function recursive(n: number, edges: Edges): number[] {
  const near: number[][] = Array.from({ length: n }, () => []);
  for (const [a, b] of edges) {
    (near[a] as number[]).push(b);
    (near[b] as number[]).push(a);
  }
  const size: number[] = Array.from({ length: n }, () => 1);
  const depth: number[] = Array.from({ length: n }, () => 0);
  const answer: number[] = Array.from({ length: n }, () => 0);
  const down = (v: number, p: number): void => {
    for (const c of near[v] as number[]) {
      if (c === p) continue;
      depth[c] = (depth[v] as number) + 1;
      down(c, v);
      size[v] = (size[v] as number) + (size[c] as number);
    }
  };
  const up = (v: number, p: number): void => {
    for (const c of near[v] as number[]) {
      if (c === p) continue;
      answer[c] = (answer[v] as number) + n - 2 * (size[c] as number);
      up(c, v);
    }
  };
  down(0, -1);
  let atRoot = 0;
  for (let v = 0; v < n; v++) atRoot += depth[v] as number;
  answer[0] = atRoot;
  up(0, -1);
  return answer;
}

/** 재귀 사본이 그 크기의 사슬에서 끝까지 실행되는가. */
export function recursionVerdict(v: number): string {
  try {
    recursive(v, chain(v));
    return "끝까지 실행된다";
  } catch (e) {
    return e instanceof RangeError ? "RangeError" : "다른 예외";
  }
}

/** 사본이 정본과 같은 답을 내는지 이 파일을 읽을 때 한 번 확인한다. */
function 자기대조(): void {
  const inputs: [number, Edges][] = [
    [WALK_N, WALK_EDGES],
    [SMALL_N, SMALL_EDGES],
    [1, []],
    [2, [[0, 1]]],
    [5, chain(5)],
    [5, star(5)],
    [64, balanced(64)],
    [64, caterpillar(64)],
    [64, randomTree(64, 20260905)],
  ];
  for (const [n, edges] of inputs) {
    const ref = show(treeRerooting(n, edges));
    if (show(counted(n, edges).answer) !== ref) {
      throw new Error("세는 사본이 정본과 다른 답을 낸다");
    }
    if (show(naive(n, edges).answer) !== ref) {
      throw new Error("정점마다 탐색하는 사본이 정본과 다른 답을 낸다");
    }
    if (show(recursive(n, edges)) !== ref) {
      throw new Error("재귀 사본이 정본과 다른 답을 낸다");
    }
  }
}
자기대조();

/* ────────────────────────── 변이 ────────────────────────── */

const REF = new URL("./treeRerooting-guide.ref.ts", import.meta.url).pathname;

interface Impl {
  treeRerooting(n: number, edges: Edges): number[];
}

/** 답을 전파하는 반복문을 방문 순서의 뒤에서 앞으로 바꾼 사본. */
const backward = await loadMutant<Impl>(REF, {
  swap: [
    /for \(let i = 1; i < order\.length; i\+\+\) \{/,
    "for (let i = order.length - 1; i >= 1; i--) {",
  ],
});

/** **불변식을 지키던 줄** 하나 — 가까워지는 정점을 빼지 않고 멀어지는 정점만 더한 사본. */
const halfDelta = await loadMutant<Impl>(REF, {
  swap: [
    /answer\[w\] = \(answer\[p\] as number\) \+ n - 2 \* \(size\[w\] as number\);/,
    "answer[w] = (answer[p] as number) + n - (size[w] as number);",
  ],
});

/** 첫 순회를 스택 대신 큐로 바꾼 사본. 방문 순서가 달라지고 **답은 그대로다.** */
const asQueue = await loadMutant<Impl>(REF, {
  swap: [
    /const u = stack\.pop\(\) as number;/,
    "const u = stack.shift() as number;",
  ],
});

const MUTANT_CASES: { label: string; n: number; edges: Edges }[] = [
  { label: "전개 입력 (정점 7)", n: WALK_N, edges: WALK_EDGES },
  { label: "사슬 (정점 5)", n: 5, edges: chain(5) },
  { label: "별 (정점 5)", n: 5, edges: star(5) },
];

/**
 * 중화 실행인가 — `loadMutant` 이 변이를 적용하지 않고 정본 모듈을 그대로 돌려주면 두
 * 함수가 **같은 객체**다. 중화 상태에서 아래 검사를 돌리면 언제나 던지게 되고, 그러면
 * `check-proof` 의 중화 대조가 이 편에서는 실행되지 않는다.
 */
const 중화됨 = backward.treeRerooting === treeRerooting;

// 답을 바꾸는 변이 둘이 어느 입력에서도 안 갈리면 그 절의 주장이 성립하지 않는다.
if (!중화됨) {
  for (const [label, impl] of [
    ["전파를 거꾸로 한 판", backward],
    ["가까워지는 정점을 뺀 판", halfDelta],
  ] as [string, Impl][]) {
    if (
      MUTANT_CASES.every(
        (c) =>
          show(treeRerooting(c.n, c.edges)) ===
          show(impl.treeRerooting(c.n, c.edges)),
      )
    ) {
      throw new Error(`${label} 변이가 어느 입력에서도 답을 바꾸지 못했다`);
    }
  }
  // 큐 변이는 반대로 **답을 바꾸면 안 된다.** 바꾸면 그 멈춤의 전제가 거짓이다.
  for (const c of MUTANT_CASES) {
    if (
      show(treeRerooting(c.n, c.edges)) !==
      show(asQueue.treeRerooting(c.n, c.edges))
    ) {
      throw new Error("큐로 바꾼 판이 답을 바꿨다 — 멈춤의 전제가 거짓이다");
    }
  }
}

/* ────────────────────────── 수치 ────────────────────────── */

const N_LIMIT = 100_000;

const LABELS: [string, string][] = [
  ["①", "이웃 목록을 만든다"],
  ["②", "첫 순회로 방문 순서·부모·깊이를 정한다"],
  ["③", "부분트리 크기를 부모에 더한다"],
  ["④", "기준 뿌리의 답을 깊이의 합으로 구한다"],
  ["⑤", "부모의 답에서 자식의 답을 낸다"],
];

const SHAPES: [string, (v: number) => Edges][] = [
  ["사슬", chain],
  ["별", star],
  ["완전 이진", balanced],
  ["애벌레", caterpillar],
  ["생성식 무작위", (v) => randomTree(v, 20260905)],
];

/** `S(v)` 가 가장 작은 정점 목록. */
function minimizers(answer: number[]): number[] {
  const best = Math.min(...answer);
  const out: number[] = [];
  for (const [i, x] of answer.entries()) if (x === best) out.push(i);
  return out;
}

/** 정점 `v` 를 떼면 남는 조각 중 가장 큰 것의 정점 수. */
function largestPiece(n: number, edges: Edges, v: number): number {
  const near: number[][] = Array.from({ length: n }, () => []);
  for (const [a, b] of edges) {
    (near[a] as number[]).push(b);
    (near[b] as number[]).push(a);
  }
  const seen: boolean[] = Array.from({ length: n }, () => false);
  seen[v] = true;
  let best = 0;
  for (const s of near[v] as number[]) {
    if (seen[s]) continue;
    let count = 0;
    const stack = [s];
    seen[s] = true;
    while (stack.length > 0) {
      const u = stack.pop() as number;
      count++;
      for (const w of near[u] as number[]) {
        if (seen[w]) continue;
        seen[w] = true;
        stack.push(w);
      }
    }
    best = Math.max(best, count);
  }
  return best;
}

/** 간선 하나를 지웠을 때 갈라지는 두 조각의 정점 수. */
function edgeSplit(n: number, edges: Edges): { a: number; b: number }[] {
  const c = counted(n, edges);
  const out: { a: number; b: number }[] = [];
  for (const [i, w] of c.order.entries()) {
    if (i === 0) continue;
    const a = c.size[w] as number;
    out.push({ a, b: n - a });
  }
  return out;
}

export const PROOFS: Record<string, () => string> = {
  /** deep.build ② — 정점마다 탐색하는 방법이 제약 규모에서 몇 번이 되는가. */
  naiveScale: () => {
    const rows = [8, 64, 512, 4096].map((v) => {
      const edges = caterpillar(v);
      const one = bfsFrom(v, edges, 0);
      const all = naive(v, edges);
      return [
        comma(v),
        comma(edges.length),
        comma(one.ops),
        comma(all.ops),
        comma(countedLite(v, edges).ops),
      ];
    });
    return [
      ...table(
        [
          [
            "정점 N",
            "간선",
            "탐색 한 번",
            "정점마다 탐색",
            "이 글이 세울 절차",
          ],
          ...rows,
        ],
        [0, 1, 2, 3, 4],
      ),
      "",
      `트리는 간선이 E = N - 1 이라 탐색 한 번이 4N - 3 번이고 그것을 N 번 한다`,
      `  N = 8 에서 2(N-1) + N(4N-3) = ${comma(2 * 7 + 8 * 29)} 이고 위 표의 246 과 같다`,
      `제약 규모 N = ${comma(N_LIMIT)} 이면`,
      `  정점마다 탐색  2(N-1) + N(4N-3) = ${comma(2 * (N_LIMIT - 1) + N_LIMIT * (4 * N_LIMIT - 3))} 번`,
      `  이 글이 세울 절차  ${comma(countedLite(N_LIMIT, caterpillar(N_LIMIT)).ops)} 번`,
    ].join("\n");
  },

  /** deep.build ③ — 기준 뿌리 하나의 답은 깊이를 더하기만 하면 나온다. */
  rootByDepth: () => {
    const one = bfsFrom(SMALL_N, SMALL_EDGES, 0);
    const rows = one.dist.map((d, v) => [`정점 ${v}`, String(d)]);
    return [
      ...table([["정점", "정점 0 에서의 거리"], ...rows], [1]),
      "",
      `합 ${one.dist.join(" + ")} = ${one.sum}`,
      `너비 우선 탐색으로 직접 구한 S(0) = ${one.sum}`,
    ].join("\n");
  },

  /** deep.build ④ — 뿌리를 이웃으로 한 칸 옮기면 무엇이 몇 개 바뀌는가. */
  moveOne: () => {
    const c = counted(SMALL_N, SMALL_EDGES);
    const base = bfsFrom(SMALL_N, SMALL_EDGES, 0);
    const rows: string[][] = [];
    for (const w of [1, 2]) {
      const near = c.size[w] as number;
      const far = SMALL_N - near;
      const got = bfsFrom(SMALL_N, SMALL_EDGES, w);
      rows.push([
        `0 -> ${w}`,
        String(near),
        String(far),
        `${base.sum} - ${near} + ${far} = ${base.sum - near + far}`,
        String(got.sum),
      ]);
    }
    return [
      ...table(
        [
          [
            "옮긴 방향",
            "가까워지는 정점",
            "멀어지는 정점",
            "S(0) 에서 고친 값",
            "직접 구한 값",
          ],
          ...rows,
        ],
        [1, 2],
      ),
      "",
      "가까워지는 정점은 옮겨 간 쪽 부분트리 안에 있는 것이고 나머지가 멀어진다",
    ].join("\n");
  },

  /** deep.build ④ — 같은 답을 두 방식으로 낸 계수. */
  costTwoWays: () => {
    const rows = [8, 64, 512].map((v) => {
      const edges = caterpillar(v);
      return [
        comma(v),
        comma(naive(v, edges).ops),
        comma(countedLite(v, edges).ops),
        `${(naive(v, edges).ops / countedLite(v, edges).ops).toFixed(1)} 배`,
      ];
    });
    return table(
      [["정점 N", "정점마다 탐색", "한 번 순회하고 전파", "비율"], ...rows],
      [0, 1, 2, 3],
    ).join("\n");
  },

  /** deep.build ⑤ — 옮길 때마다 가까워지는 정점을 세어 보는 후보의 계수. */
  recountCost: () => {
    const rows = [8, 64, 512].map((v) => {
      const edges = caterpillar(v);
      // 옮길 때마다 부분트리를 세면 옮김 한 번이 그 부분트리 크기만큼 걸린다.
      const c = counted(v, edges);
      let recount = 0;
      for (const [i, w] of c.order.entries()) {
        if (i === 0) continue;
        recount += c.size[w] as number;
      }
      return [
        comma(v),
        comma(recount),
        comma(c.writes - 1),
        `${(recount / Math.max(1, c.writes - 1)).toFixed(1)} 배`,
      ];
    });
    return [
      ...table(
        [["정점 N", "옮길 때마다 세면", "크기를 미리 두면", "비율"], ...rows],
        [0, 1, 2, 3],
      ),
      "",
      "옮김 횟수는 두 방식이 N - 1 로 같고, 한 번의 옮김에 드는 것이 갈린다",
    ].join("\n");
  },

  /** deep.build ⑤ — 기준 뿌리를 고정하지 않으면 크기가 걸음마다 달라진다. */
  basisFixed: () => {
    const n = 5;
    const edges = chain(5);
    const fixed = counted(n, edges).size;
    const rows: string[][] = [];
    for (let r = 0; r < n; r++) {
      // 뿌리를 `r` 로 옮겨 잡았을 때의 부분트리 크기.
      const near: number[][] = Array.from({ length: n }, () => []);
      for (const [a, b] of edges) {
        (near[a] as number[]).push(b);
        (near[b] as number[]).push(a);
      }
      const size: number[] = Array.from({ length: n }, () => 1);
      const parent: number[] = Array.from({ length: n }, () => -1);
      const order: number[] = [];
      const seen: boolean[] = Array.from({ length: n }, () => false);
      const stack = [r];
      seen[r] = true;
      while (stack.length > 0) {
        const u = stack.pop() as number;
        order.push(u);
        for (const w of near[u] as number[]) {
          if (seen[w]) continue;
          seen[w] = true;
          parent[w] = u;
          stack.push(w);
        }
      }
      for (let i = order.length - 1; i >= 1; i--) {
        const w = order[i] as number;
        const p = parent[w] as number;
        size[p] = (size[p] as number) + (size[w] as number);
      }
      rows.push([`뿌리 ${r} 기준`, bare(size)]);
    }
    return [
      ...table([
        ["기준", "size 배열"],
        ["뿌리 0 으로 고정", bare(fixed)],
      ]),
      "",
      ...table([["옮겨 잡을 때마다 다시 재면", "size 배열"], ...rows]),
      "",
      "다섯 벌을 각각 만들려면 한 벌마다 순회가 한 번씩 더 든다",
    ].join("\n");
  },

  /** deep.build ⑥ — 모든 간선에서 두 값이 같은가. */
  deltaAll: () => {
    const c = counted(WALK_N, WALK_EDGES);
    const direct = Array.from({ length: WALK_N }, (_, v) =>
      bfsFrom(WALK_N, WALK_EDGES, v),
    );
    const rows: string[][] = [];
    for (const [i, w] of c.order.entries()) {
      if (i === 0) continue;
      const p = c.parent[w] as number;
      const sw = c.size[w] as number;
      const sp = direct[p]?.sum ?? 0;
      const sc = direct[w]?.sum ?? 0;
      rows.push([
        `${p} -> ${w}`,
        String(sw),
        String(sp),
        String(sc),
        String(sc - sp),
        `${WALK_N} - 2 x ${sw} = ${WALK_N - 2 * sw}`,
      ]);
    }
    return [
      ...table(
        [
          [
            "옮긴 방향",
            "자식의 size",
            "S(부모)",
            "S(자식)",
            "실제 차이",
            "식이 낸 값",
          ],
          ...rows,
        ],
        [1, 2, 3, 4],
      ),
      "",
      `여섯 간선 전부에서 실제 차이와 식이 낸 값이 같다`,
      `행 순서는 방문 순서 order 를 따른다`,
    ].join("\n");
  },

  /** deep.walk T1 — 이웃 목록. */
  walkAdj: () => {
    const near: number[][] = Array.from({ length: WALK_N }, () => []);
    for (const [a, b] of WALK_EDGES) {
      (near[a] as number[]).push(b);
      (near[b] as number[]).push(a);
    }
    const rows = near.map((list, v) => [
      `near[${v}]`,
      `[${list.join(", ")}]`,
      String(list.length),
    ]);
    return [
      ...table([["자리", "이웃", "개수"], ...rows], [2]),
      "",
      `항목 수의 합 ${near.reduce((s, l) => s + l.length, 0)} = 간선 ${WALK_EDGES.length} x 2`,
    ].join("\n");
  },

  /** deep.walk T2~T4 — 첫 순회의 걸음마다의 상태. */
  walkOrder: () => {
    const c = counted(WALK_N, WALK_EDGES);
    const rows: string[][] = [];
    // 걸음을 다시 세면서 스택과 방문 순서를 적는다.
    const near: number[][] = Array.from({ length: WALK_N }, () => []);
    for (const [a, b] of WALK_EDGES) {
      (near[a] as number[]).push(b);
      (near[b] as number[]).push(a);
    }
    const seen: boolean[] = Array.from({ length: WALK_N }, () => false);
    const stack = [0];
    seen[0] = true;
    const order: number[] = [];
    while (stack.length > 0) {
      const u = stack.pop() as number;
      order.push(u);
      const pushed: number[] = [];
      for (const w of near[u] as number[]) {
        if (seen[w]) continue;
        seen[w] = true;
        stack.push(w);
        pushed.push(w);
      }
      rows.push([
        String(u),
        pushed.length === 0 ? "(없음)" : pushed.join(" "),
        `[${stack.join(", ")}]`,
        `[${order.join(", ")}]`,
      ]);
    }
    return [
      ...table([["꺼낸 정점", "새로 담은 정점", "스택", "방문 순서"], ...rows]),
      "",
      ...table([
        ["parent", bare(c.parent)],
        ["depth", bare(c.depth)],
      ]),
    ].join("\n");
  },

  /** deep.walk 멈춤 — 재귀로 적으면 어느 규모에서 끝까지 실행되지 않는가. */
  pauseRecursion: () => {
    const rows = [1_000, 10_000, N_LIMIT].map((v) => [
      comma(v),
      comma(v - 1),
      recursionVerdict(v),
      comma(countedLite(v, chain(v)).peak),
    ]);
    return [
      ...table(
        [
          [
            "사슬 정점 수",
            "필요한 호출 깊이",
            "재귀 사본",
            "배열 스택 최대 길이",
          ],
          ...rows,
        ],
        [0, 1, 3],
      ),
      "",
      "배열 스택은 사슬에서 길이가 1 을 넘지 않는다 — 자식이 하나뿐이라 담자마자 꺼낸다",
    ].join("\n");
  },

  /** deep.walk T5~T6 — 크기 누적의 걸음마다의 size. */
  walkSize: () => {
    const c = counted(WALK_N, WALK_EDGES);
    const rows: string[][] = [
      ["시작값", "—", "—", bare(c.sizeFrames[0] ?? [])],
    ];
    for (let i = c.order.length - 1; i >= 1; i--) {
      const w = c.order[i] as number;
      const p = c.parent[w] as number;
      const frame = c.sizeFrames[c.order.length - i] ?? [];
      rows.push([`i = ${i}`, `정점 ${w}`, `부모 ${p}`, bare(frame)]);
    }
    return [
      ...table([["읽은 자리", "정점", "더할 곳", "size"], ...rows]),
      "",
      `size[0] = ${c.size[0]} 이 정점 수 ${WALK_N} 과 같아진 것이 이 배열이 완성됐다는 표시다`,
    ].join("\n");
  },

  /** deep.walk 멈춤 — 전파 순서를 거꾸로 하면 어느 입력에서 답이 갈리는가. */
  pauseOrderAnswer: () => {
    const rows = MUTANT_CASES.map((c) => {
      const ok = show(treeRerooting(c.n, c.edges));
      const bad = show(backward.treeRerooting(c.n, c.edges));
      return [c.label, ok, bad, ok === bad ? "같다" : "다르다"];
    });
    return table([
      ["입력", "정본", "전파를 거꾸로 한 판", "판정"],
      ...rows,
    ]).join("\n");
  },

  /** deep.walk 멈춤 — 거꾸로 전파하면 걸음마다 무엇을 읽는가. */
  pauseOrderTrace: () => {
    const n = 5;
    const edges = chain(5);
    const c = counted(n, edges);
    const answer: number[] = Array.from({ length: n }, () => 0);
    answer[0] = c.answer[0] as number;
    const rows: string[][] = [];
    let unset = 0;
    for (let i = c.order.length - 1; i >= 1; i--) {
      const w = c.order[i] as number;
      const p = c.parent[w] as number;
      const before = answer[p] as number;
      if (p !== 0 && before === 0) unset++;
      answer[w] = before + n - 2 * (c.size[w] as number);
      rows.push([
        `i = ${i}`,
        `정점 ${w}`,
        `부모 ${p}`,
        String(before),
        String(answer[w] as number),
        String(c.answer[w] as number),
      ]);
    }
    return [
      ...table(
        [
          [
            "읽은 자리",
            "정점",
            "부모",
            "그때 읽은 부모의 답",
            "적은 값",
            "옳은 값",
          ],
          ...rows,
        ],
        [3, 4, 5],
      ),
      "",
      `부모의 답이 아직 0 인 채로 읽히는 자리가 ${unset} 군데이고, 거기서부터 값이 어긋난다`,
    ].join("\n");
  },

  /** deep.walk T7 — 기준 뿌리의 답. */
  walkRootSum: () => {
    const c = counted(WALK_N, WALK_EDGES);
    const direct = bfsFrom(WALK_N, WALK_EDGES, 0);
    return [
      ...table([
        ["depth", bare(c.depth)],
        ["정점 0 에서의 거리", bare(direct.dist)],
      ]),
      "",
      `깊이의 합 ${c.depth.join(" + ")} = ${c.answer[0]}`,
      `너비 우선 탐색으로 직접 구한 S(0) = ${direct.sum}`,
    ].join("\n");
  },

  /** deep.walk T8~T10 — 전파의 걸음마다의 answer. */
  walkProp: () => {
    const c = counted(WALK_N, WALK_EDGES);
    const rows: string[][] = [
      ["시작값", "—", "—", "—", bare(c.answerFrames[0] ?? [])],
    ];
    for (let i = 1; i < c.order.length; i++) {
      const w = c.order[i] as number;
      const p = c.parent[w] as number;
      const sw = c.size[w] as number;
      const frame = c.answerFrames[i] ?? [];
      rows.push([
        `i = ${i}`,
        `정점 ${w}`,
        `부모 ${p}`,
        `${(c.answerFrames[i - 1] ?? [])[p]} + ${WALK_N} - 2 x ${sw} = ${frame[w]}`,
        bare(frame),
      ]);
    }
    return [
      ...table([["읽은 자리", "정점", "부모", "쓴 식", "answer"], ...rows]),
      "",
      `반환값 ${show(treeRerooting(WALK_N, WALK_EDGES))}`,
    ].join("\n");
  },

  /** deep.walk 멈춤 — 스택을 큐로 바꿔도 답이 안 갈린다. */
  pauseQueueAnswer: () => {
    const rows = MUTANT_CASES.map((c) => {
      const ok = show(treeRerooting(c.n, c.edges));
      const bad = show(asQueue.treeRerooting(c.n, c.edges));
      return [c.label, ok, bad, ok === bad ? "같다" : "다르다"];
    });
    return table([["입력", "정본", "큐로 꺼낸 판", "판정"], ...rows]).join(
      "\n",
    );
  },

  /** deep.walk 멈춤 — 그래도 방문 순서 자체는 달라진다. */
  pauseQueueOrder: () => {
    const rows = MUTANT_CASES.map((c) => {
      const a = show(counted(c.n, c.edges).order);
      const b = show(queueOrder(c.n, c.edges));
      return [c.label, a, b];
    });
    return [
      ...table([
        ["입력", "스택으로 꺼낸 방문 순서", "큐로 꺼낸 방문 순서"],
        ...rows,
      ]),
      "",
      "두 순서 모두 부모가 자식보다 앞에 있다 — 절차가 요구하는 것은 그 성질 하나다",
    ].join("\n");
  },

  /** related — 답이 가장 작은 정점과 그 정점을 뗐을 때 남는 가장 큰 조각. */
  relatedCentroid: () => {
    const cases: [string, number, Edges][] = [
      ["사슬 (정점 5)", 5, chain(5)],
      ["별 (정점 5)", 5, star(5)],
      ["전개 입력 (정점 7)", WALK_N, WALK_EDGES],
      ["완전 이진 (정점 15)", 15, balanced(15)],
    ];
    const rows = cases.map(([label, n, edges]) => {
      const answer = treeRerooting(n, edges);
      const best = minimizers(answer);
      return [
        label,
        show(answer),
        best.join(" · "),
        best.map((v) => String(largestPiece(n, edges, v))).join(" · "),
        best.map(() => String(Math.floor(n / 2))).join(" · "),
      ];
    });
    return [
      ...table([
        [
          "입력",
          "답",
          "가장 작은 자리",
          "그 정점을 뗀 최대 조각",
          "N/2 의 내림",
        ],
        ...rows,
      ]),
      "",
      "네 입력 모두 답이 가장 작은 정점에서 최대 조각이 정점 수의 절반을 넘지 않는다",
    ].join("\n");
  },

  /** deep.math ② — 정의를 작은 값에 넣어 검산한다. */
  mathCheck: () => {
    const c = counted(WALK_N, WALK_EDGES);
    const rows = Array.from({ length: WALK_N }, (_, v) => {
      const direct = bfsFrom(WALK_N, WALK_EDGES, v);
      return [
        String(v),
        String(c.size[v] as number),
        String(c.depth[v] as number),
        bare(direct.dist),
        String(direct.sum),
        String(c.answer[v] as number),
      ];
    });
    return [
      ...table(
        [["v", "size(v)", "depth(v)", "d(v, ·)", "합", "answer[v]"], ...rows],
        [0, 1, 2, 4, 5],
      ),
      "",
      `정의대로 거리를 더한 값과 절차가 낸 값이 일곱 자리 모두 같다`,
    ].join("\n");
  },

  /** deep.math ③ — 간선 분할로 얻은 총합 항등식을 실측과 맞춘다. */
  mathIdentity: () => {
    const cases: [string, number, Edges][] = [
      ["전개 입력", WALK_N, WALK_EDGES],
      ["사슬 (정점 9)", 9, chain(9)],
      ["별 (정점 9)", 9, star(9)],
      ["완전 이진 (정점 15)", 15, balanced(15)],
      ["생성식 무작위 (정점 64)", 64, randomTree(64, 20260905)],
    ];
    const rows = cases.map(([label, n, edges]) => {
      const total = treeRerooting(n, edges).reduce((s, x) => s + x, 0);
      const byEdge = edgeSplit(n, edges).reduce((s, e) => s + e.a * e.b, 0);
      return [
        label,
        comma(total),
        comma(2 * byEdge),
        total === 2 * byEdge ? "같다" : "다르다",
      ];
    });
    return [
      ...table(
        [["입력", "answer 의 합", "2 x sum a(N-a)", "판정"], ...rows],
        [1, 2],
      ),
      "",
      "간선 하나가 트리를 a 개와 N-a 개로 가르고, 그 간선을 쓰는 순서 있는 정점 짝이 2 x a(N-a) 개다",
    ].join("\n");
  },

  /** deep.math ④ — 닫힌 형태에 제약 규모를 넣은 값. */
  mathScale: () => {
    const rows = [10, 1_000, N_LIMIT].map((v) => {
      const lite = countedLite(v, chain(v));
      const closed = (v * (v - 1)) / 2;
      return [
        comma(v),
        comma(lite.max),
        comma(closed),
        lite.max === closed ? "같다" : "다르다",
      ];
    });
    return [
      ...table(
        [["사슬 정점 수", "answer 의 최댓값", "N(N-1)/2", "판정"], ...rows],
        [0, 1, 2],
      ),
      "",
      `제약 상한 N = ${comma(N_LIMIT)} 에서 답의 최댓값은 ${comma((N_LIMIT * (N_LIMIT - 1)) / 2)} 이고`,
      `부호 있는 32 비트가 담는 한계 ${comma(2 ** 31 - 1)} 를 ${((N_LIMIT * (N_LIMIT - 1)) / 2 / (2 ** 31 - 1)).toFixed(1)} 배 넘는다`,
      `배정밀도 실수가 정확히 담는 한계 ${comma(Number.MAX_SAFE_INTEGER)} 안에는 들어간다`,
    ].join("\n");
  },

  /** invariant ② — 걸음마다 불변식이 유지되는가. */
  invariantHold: () => {
    const c = counted(WALK_N, WALK_EDGES);
    const rows: string[][] = [];
    for (let i = 1; i < c.order.length; i++) {
      const w = c.order[i] as number;
      const p = c.parent[w] as number;
      const done = c.order.slice(0, i + 1);
      const direct = bfsFrom(WALK_N, WALK_EDGES, w).sum;
      rows.push([
        `i = ${i}`,
        `정점 ${w}`,
        `부모 ${p}`,
        `[${done.join(", ")}]`,
        String((c.answerFrames[i] ?? [])[w] ?? 0),
        String(direct),
        (c.answerFrames[i] ?? [])[w] === direct ? "같다" : "다르다",
      ]);
    }
    return [
      ...table(
        [
          [
            "걸음",
            "이번에 적은 정점",
            "읽은 자리",
            "값이 정해진 정점",
            "적은 값",
            "직접 구한 값",
            "판정",
          ],
          ...rows,
        ],
        [4, 5],
      ),
      "",
      "값이 정해진 정점의 목록이 방문 순서의 앞부분과 언제나 같다",
    ].join("\n");
  },

  /** invariant ② — 엣지 케이스. */
  invariantEdge: () => {
    const cases: [string, number, Edges][] = [
      ["정점 하나", 1, []],
      ["정점 둘", 2, [[0, 1]]],
      ["사슬 (정점 3)", 3, chain(3)],
      ["별 (정점 3)", 3, star(3)],
      ["사슬 (정점 100,000)", N_LIMIT, chain(N_LIMIT)],
      ["별 (정점 100,000)", N_LIMIT, star(N_LIMIT)],
    ];
    const rows = cases.map(([label, n, edges]) => {
      if (n <= 3) {
        const answer = treeRerooting(n, edges);
        const want = naive(n, edges).answer;
        return [
          label,
          show(answer),
          show(want),
          show(answer) === show(want) ? "같다" : "다르다",
        ];
      }
      const answer = treeRerooting(n, edges);
      const head = `[${(answer[0] as number).toLocaleString("en-US")}, ${(answer[1] as number).toLocaleString("en-US")}, …]`;
      const want = label.startsWith("사슬")
        ? `[${comma((n * (n - 1)) / 2)}, ${comma((n * (n - 1)) / 2 + n - 2 * (n - 1))}, …]`
        : `[${comma(n - 1)}, ${comma(1 + 2 * (n - 2))}, …]`;
      return [label, head, want, head === want ? "같다" : "다르다"];
    });
    return [
      ...table([["입력", "절차가 낸 값", "손으로 세운 값", "판정"], ...rows]),
      "",
      "정점 하나면 전파가 한 번도 실행되지 않고 깊이의 합 0 이 그대로 답이다",
    ].join("\n");
  },

  /** invariant ③ — 불변식을 지키던 줄을 바꾸면 어떤 값이 나오는가. */
  mutantHalfDelta: () => {
    const rows = MUTANT_CASES.map((c) => {
      const ok = show(treeRerooting(c.n, c.edges));
      const bad = show(halfDelta.treeRerooting(c.n, c.edges));
      return [c.label, ok, bad, ok === bad ? "같다" : "다르다"];
    });
    const one = show(treeRerooting(1, []));
    const oneBad = show(halfDelta.treeRerooting(1, []));
    rows.push(["정점 하나", one, oneBad, one === oneBad ? "같다" : "다르다"]);
    return table([
      ["입력", "정본", "가까워지는 정점을 뺀 판", "판정"],
      ...rows,
    ]).join("\n");
  },

  /** perf.derive — 걸음마다의 계수. */
  perfDerive: () => {
    const c = counted(WALK_N, WALK_EDGES);
    const rows: string[][] = [
      ["①", LABELS[0]?.[1] ?? "", String(2 * WALK_EDGES.length), "2E"],
      [
        "②",
        LABELS[1]?.[1] ?? "",
        String(c.pops + c.reads + c.pushes - 1),
        "N + 2E + (N-1)",
      ],
      ["③", LABELS[2]?.[1] ?? "", String(c.adds), "N-1"],
      ["④", LABELS[3]?.[1] ?? "", String(WALK_N), "N"],
      ["⑤", LABELS[4]?.[1] ?? "", String(c.writes - 1), "N-1"],
    ];
    const sum =
      2 * WALK_EDGES.length +
      (c.pops + c.reads + c.pushes - 1) +
      c.adds +
      WALK_N +
      (c.writes - 1);
    return [
      ...table(
        [["라벨", "하는 일", "이 입력의 횟수", "N 과 E 로"], ...rows],
        [2],
      ),
      "",
      `다섯 라벨의 합 ${sum} — 실행이 센 기본 연산도 ${countedLite(WALK_N, WALK_EDGES).ops} 이다`,
      `트리라 E = N - 1 이므로 총식은 9N - 7 이고, N = ${WALK_N} 에서 ${9 * WALK_N - 7} 이다`,
    ].join("\n");
  },

  /** perf.bounds — 모양을 바꿔도 계수가 같은가. */
  perfBounds: () => {
    const rows: string[][] = [];
    for (const [name, gen] of SHAPES) {
      for (const v of [1_000, N_LIMIT]) {
        const lite = countedLite(v, gen(v));
        rows.push([
          name,
          comma(v),
          comma(lite.ops),
          comma(9 * v - 7),
          comma(lite.peak),
        ]);
      }
    }
    return [
      ...table(
        [["모양", "정점 N", "기본 연산", "9N - 7", "스택 최대 길이"], ...rows],
        [1, 2, 3, 4],
      ),
      "",
      "기본 연산은 다섯 모양에서 모두 9N - 7 이고 스택 최대 길이만 모양에 달렸다",
    ].join("\n");
  },

  /** perf.worst — 무엇이 최악이고 무엇이 최악이 아닌가. */
  perfWorst: () => {
    const forward = countedLite(N_LIMIT, star(N_LIMIT));
    const reversed = countedLite(N_LIMIT, star(N_LIMIT).slice().reverse());
    const rows: string[][] = [
      [
        "별, 간선 목록 그대로",
        comma(forward.ops),
        comma(forward.peak),
        comma(forward.max),
      ],
      [
        "별, 간선 목록을 뒤집어서",
        comma(reversed.ops),
        comma(reversed.peak),
        comma(reversed.max),
      ],
    ];
    for (const [name, gen] of SHAPES) {
      const lite = countedLite(N_LIMIT, gen(N_LIMIT));
      rows.push([name, comma(lite.ops), comma(lite.peak), comma(lite.max)]);
    }
    return [
      ...table(
        [
          [
            "정점 100,000 짜리 입력",
            "기본 연산",
            "스택 최대 길이",
            "답의 최댓값",
          ],
          ...rows,
        ],
        [1, 2, 3],
      ),
      "",
      `스택이 가장 길어지는 것은 별이고 그 길이는 ${comma(forward.peak)} 이다`,
      `답이 가장 커지는 것은 사슬이고 그 값은 ${comma(countedLite(N_LIMIT, chain(N_LIMIT)).max)} 이다`,
      "간선 목록의 순서를 뒤집어도 기본 연산과 스택 최대 길이가 둘 다 안 바뀐다",
    ].join("\n");
  },

  /** selfcheck — 예측 문제의 답. */
  selfcheckAnswer: () => {
    const n = 6;
    const edges: Edges = [
      [0, 1],
      [1, 2],
      [1, 3],
      [3, 4],
      [3, 5],
    ];
    const c = counted(n, edges);
    const rows = Array.from({ length: n }, (_, v) => [
      String(v),
      String(c.size[v] as number),
      String(c.depth[v] as number),
      String(c.answer[v] as number),
    ]);
    return [
      ...table(
        [["v", "size(v)", "depth(v)", "answer[v]"], ...rows],
        [0, 1, 2, 3],
      ),
      "",
      `방문 순서 ${show(c.order)}`,
      `반환값 ${show(c.answer)}`,
    ].join("\n");
  },
};
