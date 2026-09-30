/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run tools/check-proof.ts src/algorithms/tree/treeRerooting/treeRerooting-guide.md
 *
 * **세는 사본과 기록 사본이 따로 있다.** 정본은 걸음마다의 상태도, 기본 연산 수도 내보내지 않는다.
 *
 * - `traced` — 정본과 같은 절차에 걸음 기록을 덧붙인 판. 걸음마다 배열 전부를 베끼므로 전개 입력처럼
 *   작은 입력에만 쓴다. 걸음 재생 패널과 본문 전개 표의 출처다.
 * - `counted` — 정본과 같은 절차의 끝 상태와 계수를 내는 판. 걸음을 베끼지 않는다.
 * - `countedLite` — 기본 연산 수 · 스택 최대 길이 · 답의 최댓값만 돌려주는 판. 정점 100,000 개 같은 큰
 *   입력은 이것만 쓴다 — 배열 전부를 여러 벌 쥐고 있지 않는다.
 *
 * 비용의 기준은 원고 전체에서 하나다 — **기본 연산**. 이웃 목록에 항목 하나를 넣는 일 · 이웃 목록의
 * 항목 하나를 읽는 일 · 스택에 정점 하나를 담거나 꺼내는 일 · 배열 칸 하나에 더한 값을 적는 일(부분트리
 * 크기 · 깊이의 합 · 답)을 각각 한 번으로 센다. 메모리의 기준은 배열 칸 수다.
 *
 * **답이 맞는지는 사본이 아니라 정본이 진다** — 사본은 자기 답을 정본과 맞대고(`자기대조`), 어긋나면
 * 던진다. 정의대로의 답(나머지 정점까지 거리를 하나씩 더한 값)은 `bfsFrom` 이 낸다.
 *
 * **변이가 아무것도 안 바꾸는지를 검사하는 자리는 중화 실행을 피해 간다.** `check-proof` 가 이 파일을
 * 한 번 더 부를 때는 `loadMutant` 이 정본을 그대로 돌려주므로(중화), 그 상태에서 「변이가 답을 안
 * 바꿨다」로 던지면 중화 대조 자체가 실행되지 않는다. 중화 여부는 변이 모듈의 함수가 정본과 **같은
 * 객체인가**로 알아낸다.
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { 과와, 은는, 을를, 이가 } from "../../../../tools/josa.ts";
import { treeRerooting } from "./treeRerooting-guide.ref.ts";

export type Edges = [number, number][];

/* ────────────────────────── 고정 입력 ────────────────────────── */

/**
 * 본문 전개가 끝까지 쓰는 트리. 정점 일곱 · 간선 여섯이다. 뿌리 0 에 자식이 둘이고, 한쪽(1)은 잎 둘을
 * 달았고 다른 쪽(2)은 깊이 3 까지 한 줄로 이어진다. 그래서 스택에 두 갈래가 함께 담기는 자리와 한 갈래를
 * 끝까지 내려가는 자리가 둘 다 나오고, 부분트리 크기가 1 · 2 · 3 · 7 로 갈린다.
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

/** 전체 컨셉과 「아이디어를 떠올리는 과정」이 쓰는 작은 트리. 정점 다섯. */
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

/** 등뼈 하나에 잎을 고르게 붙인 트리(애벌레). */
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

export const N_LIMIT = 100_000;
const SEED = 20260905;

/* ────────────────────────── 칸 맞춤 ────────────────────────── */

/** 한글은 고정폭 화면에서 두 칸을 먹는다. 칸 맞춤을 글자 수로 하면 머리줄만 어긋난다. */
const width = (s: string): number =>
  [...s].reduce((n, c) => n + (/[ᄀ-ᇿ　-〿㄰-㆏가-힯一-鿿]/.test(c) ? 2 : 1), 0);

const pad = (s: string, to: number): string =>
  s + " ".repeat(Math.max(0, to - width(s)));

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

/** 표 한 벌과 그 아래 문장 — 닫는 마커까지 대조되는 증명 블록의 몸. */
const withNote = (table: string, note: string): string =>
  [table, "", note].join("\n");

/** `10011001` → `10,011,001`. `toLocaleString` 은 환경에 따라 갈려서 직접 적는다. */
export const comma = (n: number | bigint): string =>
  String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

/** `[11, 12, 12, 17, 17, 15, 20]` 꼴 — 본문 표기와 같다. */
export const show = (xs: readonly (number | string)[]): string =>
  `[${xs.join(", ")}]`;

/** 집합 표기 — 원고 전체에서 `{0, 2}` 하나로 쓴다. */
export const setOf = (xs: readonly number[]): string =>
  `{${[...xs].sort((a, b) => a - b).join(", ")}}`;

/** 공백으로 벌린 배열 — 자리 번호를 세기 좋은 자리에 쓴다. */
const bare = (xs: readonly (number | string)[]): string => xs.join(" ");

/** 두 값을 나란히 놓은 판정 칸. */
const 판정 = (a: string, b: string): string => (a === b ? "같다" : "다르다");

/** 원문자 라벨의 조사 — ① 일 · ② 이 · ③ 삼 · ④ 사 · ⑤ 오 로 읽는다. */
const LABEL_READ: Record<string, string> = {
  "①": "일",
  "②": "이",
  "③": "삼",
  "④": "사",
  "⑤": "오",
};

/* ────────────────────────── 공용 조각 ────────────────────────── */

/** 무방향 간선 목록을 이웃 목록으로. 정본의 ① 과 같다. */
export function adjacency(n: number, edges: Edges): number[][] {
  const near: number[][] = Array.from({ length: n }, () => []);
  for (const [a, b] of edges) {
    (near[a] as number[]).push(b);
    (near[b] as number[]).push(a);
  }
  return near;
}

/** 정점 하나에서 너비 우선으로 거리를 잰다 — 정의대로의 답(`S`)과 거리의 출처다. */
export function bfsFrom(
  n: number,
  edges: Edges,
  src: number,
): { dist: number[]; sum: number } {
  const near = adjacency(n, edges);
  const dist: number[] = Array.from({ length: n }, () => -1);
  dist[src] = 0;
  const queue: number[] = [src];
  let sum = 0;
  for (let head = 0; head < queue.length; head++) {
    const u = queue[head] as number;
    sum += dist[u] as number;
    for (const w of near[u] as number[]) {
      if ((dist[w] as number) >= 0) continue;
      dist[w] = (dist[u] as number) + 1;
      queue.push(w);
    }
  }
  return { dist, sum };
}

/** 정점마다 정의대로 구한 답 `S(v)`. */
export const byDefinition = (n: number, edges: Edges): number[] =>
  Array.from({ length: n }, (_, v) => bfsFrom(n, edges, v).sum);

/* ────────────────────── 끝 상태와 계수를 내는 사본 ────────────────────── */

export interface Counts {
  answer: number[];
  order: number[];
  parent: number[];
  depth: number[];
  size: number[];
  /** 기본 연산 수. */
  ops: number;
  /** 스택이 가장 길었을 때의 항목 수. */
  peak: number;
}

/**
 * 정본과 같은 절차를 기준 뿌리 `base` 에서 실행한 사본. 정본은 기준 뿌리가 0 으로 고정이다 —
 * 「기준 뿌리를 정점 0 으로 두는 까닭」 절이 다른 뿌리를 시험할 때만 `base` 를 바꾼다.
 */
export function counted(n: number, edges: Edges, base = 0): Counts {
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
  const stack: number[] = [base];
  seen[base] = true;
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
  answer[base] = atRoot;
  for (let i = 1; i < order.length; i++) {
    const w = order[i] as number;
    const p = parent[w] as number;
    answer[w] = (answer[p] as number) + n - 2 * (size[w] as number);
    ops++;
  }
  return { answer, order, parent, depth, size, ops, peak };
}

/**
 * 기본 연산 수 · 스택 최대 길이 · 답의 최댓값과 합만 돌려주는 판. 정점 100,000 짜리 입력을 여러 벌
 * 다루는 블록이 이것을 쓴다 — 배열 전부를 돌려받아 여러 벌 쥐고 있지 않는다.
 */
export function countedLite(
  n: number,
  edges: Edges,
): { ops: number; peak: number; max: number; total: number } {
  const c = counted(n, edges);
  let max = 0;
  let total = 0;
  for (const x of c.answer) {
    if (x > max) max = x;
    total += x;
  }
  return { ops: c.ops, peak: c.peak, max, total };
}

/**
 * **가장 단순한 방법** — 정점마다 그 정점을 뿌리로 삼아 처음부터 다시 따라가고, 깊이를 더해 답 하나를
 * 낸다. 이웃 목록은 한 번만 만든다. 한 뿌리에서 하는 일은 정본의 ② 와 ④ 그대로다.
 */
export function perRoot(
  n: number,
  edges: Edges,
): { answer: number[]; ops: number; one: number } {
  const near = adjacency(n, edges);
  let ops = 2 * edges.length;
  const answer: number[] = [];
  let one = 0;
  for (let r = 0; r < n; r++) {
    let here = 0;
    const depth: number[] = Array.from({ length: n }, () => 0);
    const seen: boolean[] = Array.from({ length: n }, () => false);
    const stack = [r];
    seen[r] = true;
    while (stack.length > 0) {
      const u = stack.pop() as number;
      here++;
      for (const w of near[u] as number[]) {
        here++;
        if (seen[w]) continue;
        seen[w] = true;
        depth[w] = (depth[u] as number) + 1;
        stack.push(w);
        here++;
      }
    }
    let sum = 0;
    for (let v = 0; v < n; v++) {
      sum += depth[v] as number;
      here++;
    }
    answer.push(sum);
    ops += here;
    if (r === 0) one = here;
  }
  return { answer, ops, one };
}

/** 정점마다 다시 따라가는 방법의 기본 연산 — 작은 `N` 에서 센 값과 맞는지 `origin-naive` 가 확인한다. */
export const perRootFormula = (n: number): number =>
  2 * (n - 1) + n * (5 * n - 3);

/**
 * 간선 `(p, w)` 를 지웠을 때 `w` 쪽에 남는 정점을 스택으로 따라가 모으고, 그때 든 기본 연산을 함께
 * 낸다. 시작 정점을 담는 한 번도 센다.
 */
function countPiece(
  near: number[][],
  n: number,
  p: number,
  w: number,
): { count: number; ops: number; members: number[] } {
  const seen: boolean[] = Array.from({ length: n }, () => false);
  seen[p] = true;
  seen[w] = true;
  const stack = [w];
  const members: number[] = [];
  let ops = 1;
  while (stack.length > 0) {
    const u = stack.pop() as number;
    ops++;
    members.push(u);
    for (const x of near[u] as number[]) {
      ops++;
      if (seen[x]) continue;
      seen[x] = true;
      stack.push(x);
      ops++;
    }
  }
  return { count: members.length, ops, members };
}

/**
 * **먼저 시험하는 후보** — 기준 뿌리의 답은 깊이의 합으로 내고, 뿌리를 이웃으로 옮길 때마다 가까워지는
 * 조각을 그 자리에서 따라가 센다. 옮김 한 번이 그 조각 크기에 비례한다.
 */
export function recountMoves(
  n: number,
  edges: Edges,
): { answer: number[]; ops: number } {
  const near = adjacency(n, edges);
  let ops = 2 * edges.length;
  const parent: number[] = Array.from({ length: n }, () => -1);
  const depth: number[] = Array.from({ length: n }, () => 0);
  const order: number[] = [];
  const seen: boolean[] = Array.from({ length: n }, () => false);
  const stack = [0];
  seen[0] = true;
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
    }
  }
  const answer: number[] = Array.from({ length: n }, () => 0);
  let atRoot = 0;
  for (let v = 0; v < n; v++) {
    atRoot += depth[v] as number;
    ops++;
  }
  answer[0] = atRoot;
  for (let i = 1; i < order.length; i++) {
    const w = order[i] as number;
    const p = parent[w] as number;
    const piece = countPiece(near, n, p, w);
    ops += piece.ops;
    answer[w] = (answer[p] as number) + n - 2 * piece.count;
    ops++;
  }
  return { answer, ops };
}

/** 스택 대신 큐로 꺼내는 사본의 방문 순서. 변이 모듈은 방문 순서를 내보내지 않는다. */
export function queueOrder(n: number, edges: Edges): number[] {
  const near = adjacency(n, edges);
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
  const near = adjacency(n, edges);
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

/** 기준 뿌리 `base` 에서의 자식 목록. 자식은 방문 순서대로 담는다. */
export function childrenOf(n: number, edges: Edges, base = 0): number[][] {
  const c = counted(n, edges, base);
  const kids: number[][] = Array.from({ length: n }, () => []);
  for (const [i, w] of c.order.entries()) {
    if (i === 0) continue;
    (kids[c.parent[w] as number] as number[]).push(w);
  }
  return kids;
}

/** 정점 `v` 의 부분트리에 든 정점 전부. */
export function subtreeOf(kids: number[][], v: number): number[] {
  const out = [v];
  for (let i = 0; i < out.length; i++) {
    for (const u of kids[out[i] as number] as number[]) out.push(u);
  }
  return out;
}

/* ────────────────── 걸음 기록 사본 — 작은 입력에만 쓴다 ────────────────── */

export type SnapKind = "build" | "pop" | "size" | "root" | "down";

/** 걸음 하나가 끝난 뒤의 상태. */
export interface Snap {
  readonly kind: SnapKind;
  /** 이미 스택에 담긴 적이 있는 정점 — 부모와 깊이가 적혔다. */
  readonly seen: readonly boolean[];
  readonly stack: readonly number[];
  readonly order: readonly number[];
  readonly parent: readonly number[];
  readonly depth: readonly number[];
  readonly size: readonly number[];
  /** 부분트리 크기가 끝값인가 — 자식을 모두 올려 받았는가. 크기 단계 전에는 전부 거짓이다. */
  readonly sizeDone: readonly boolean[];
  /** 적힌 답. 아직 안 적은 칸은 `null` 이다. */
  readonly answer: readonly (number | null)[];
  /** pop 걸음 — 꺼낸 정점, 이미 지나와 건너뛴 이웃, 새로 담은 이웃. */
  readonly u?: number;
  readonly skipped?: readonly number[];
  readonly pushed?: readonly number[];
  /** size · down 걸음 — 읽은 자리 `i`, 정점 `w`, 부모 `p`, 그 걸음 전의 값. */
  readonly i?: number;
  readonly w?: number;
  readonly p?: number;
  readonly before?: number;
}

/**
 * 정본과 같은 순서로 실행하되 **걸음마다 상태 전부를 베껴 둔다.** 걸음 하나는 이웃 목록 만들기 한 번 ·
 * 스택에서 정점 하나 꺼내기 · 부분트리 크기 하나 올리기 · 기준 뿌리의 답 · 답 하나 내리기다. 답이 정본과
 * 어긋나면 던진다.
 */
export function traced(
  n: number,
  edges: Edges,
): { steps: Snap[]; near: number[][]; answer: number[] } {
  const steps: Snap[] = [];
  const near = adjacency(n, edges);
  const parent: number[] = Array.from({ length: n }, () => -1);
  const depth: number[] = Array.from({ length: n }, () => 0);
  const size: number[] = Array.from({ length: n }, () => 1);
  const order: number[] = [];
  const seen: boolean[] = Array.from({ length: n }, () => false);
  const stack: number[] = [0];
  seen[0] = true;
  const answer: (number | null)[] = Array.from({ length: n }, () => null);
  const sizeDone: boolean[] = Array.from({ length: n }, () => false);
  const snap = (kind: SnapKind, extra: Partial<Snap> = {}): void => {
    steps.push({
      kind,
      seen: seen.slice(),
      stack: stack.slice(),
      order: order.slice(),
      parent: parent.slice(),
      depth: depth.slice(),
      size: size.slice(),
      sizeDone: sizeDone.slice(),
      answer: answer.slice(),
      ...extra,
    });
  };
  snap("build");
  while (stack.length > 0) {
    const u = stack.pop() as number;
    order.push(u);
    const skipped: number[] = [];
    const pushed: number[] = [];
    for (const w of near[u] as number[]) {
      if (seen[w]) {
        skipped.push(w);
        continue;
      }
      seen[w] = true;
      parent[w] = u;
      depth[w] = (depth[u] as number) + 1;
      stack.push(w);
      pushed.push(w);
    }
    snap("pop", { u, skipped, pushed });
  }
  // 크기 단계 — 자식이 없는 정점은 시작값 1 이 곧 끝값이다.
  const remaining: number[] = Array.from({ length: n }, () => 0);
  for (let i = 1; i < order.length; i++) {
    const p = parent[order[i] as number] as number;
    remaining[p] = (remaining[p] as number) + 1;
  }
  for (let v = 0; v < n; v++) sizeDone[v] = remaining[v] === 0;
  for (let i = order.length - 1; i >= 1; i--) {
    const w = order[i] as number;
    const p = parent[w] as number;
    const before = size[p] as number;
    size[p] = before + (size[w] as number);
    remaining[p] = (remaining[p] as number) - 1;
    if (remaining[p] === 0) sizeDone[p] = true;
    snap("size", { i, w, p, before });
  }
  let atRoot = 0;
  for (let v = 0; v < n; v++) atRoot += depth[v] as number;
  answer[0] = atRoot;
  snap("root");
  for (let i = 1; i < order.length; i++) {
    const w = order[i] as number;
    const p = parent[w] as number;
    const before = answer[p] as number;
    answer[w] = before + n - 2 * (size[w] as number);
    snap("down", { i, w, p, before });
  }
  const final = answer as number[];
  if (show(final) !== show(treeRerooting(n, edges))) {
    throw new Error("기록 사본이 정본과 다른 답을 낸다");
  }
  return { steps, near, answer: final };
}

/** 전개 입력의 기록 — 그림 사이드카와 본문 표가 같은 기록을 쓴다. */
export const WALK = traced(WALK_N, WALK_EDGES);

/** 걸음 번호 — 원고의 `T#` 과 같다. */
export const stepOf = (k: number): string => `T${k + 1}`;

/** 한 갈래의 걸음이 차지하는 `T#` 구간. 표 칸에서는 `T2~T8` 꼴이다. */
export function spanPlain(kind: SnapKind): string {
  const at = WALK.steps
    .map((s, k) => (s.kind === kind ? k : -1))
    .filter((k) => k >= 0);
  const first = at[0] as number;
  const last = at.at(-1) as number;
  return first === last ? stepOf(first) : `${stepOf(first)}~${stepOf(last)}`;
}

/** 전개 입력의 끝 상태. */
export const FINAL = counted(WALK_N, WALK_EDGES);

/* ────────────────────────── 자기 대조 ────────────────────────── */

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
    [64, randomTree(64, SEED)],
  ];
  for (const [n, edges] of inputs) {
    const ref = show(treeRerooting(n, edges));
    if (show(counted(n, edges).answer) !== ref) {
      throw new Error("세는 사본이 정본과 다른 답을 낸다");
    }
    if (show(byDefinition(n, edges)) !== ref) {
      throw new Error("정본이 정의대로의 답과 다르다");
    }
    if (show(perRoot(n, edges).answer) !== ref) {
      throw new Error("정점마다 다시 따라가는 사본이 정본과 다른 답을 낸다");
    }
    if (show(recountMoves(n, edges).answer) !== ref) {
      throw new Error("옮길 때마다 세는 사본이 정본과 다른 답을 낸다");
    }
    if (show(recursive(n, edges)) !== ref) {
      throw new Error("재귀 사본이 정본과 다른 답을 낸다");
    }
    for (let b = 0; b < Math.min(n, 8); b++) {
      if (show(counted(n, edges, b).answer) !== ref) {
        throw new Error(`기준 뿌리 ${b} 사본이 정본과 다른 답을 낸다`);
      }
    }
  }
}
자기대조();

/* ────────────────────────── 변이 ────────────────────────── */

const REF = new URL("./treeRerooting-guide.ref.ts", import.meta.url).pathname;

interface Impl {
  treeRerooting(n: number, edges: Edges): number[];
}

/** 답을 내리는 반복문을 방문 순서의 뒤에서 앞으로 바꾼 사본. */
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
 * 중화 실행인가 — `loadMutant` 이 변이를 적용하지 않고 정본 모듈을 그대로 돌려주면 세 함수가 정본과
 * **같은 객체**다. 중화 상태에서 아래 검사를 돌리면 언제나 던지게 되고, 그러면 `check-proof` 의 중화
 * 대조가 이 편에서는 실행되지 않는다.
 */
const 중화됨 =
  backward.treeRerooting === treeRerooting &&
  halfDelta.treeRerooting === treeRerooting &&
  asQueue.treeRerooting === treeRerooting;

if (!중화됨) {
  // 답을 바꾸는 변이 둘이 어느 입력에서도 안 갈리면 그 절의 주장이 성립하지 않는다.
  for (const [label, impl] of [
    ["답을 거꾸로 내린 판", backward],
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
  // 큐 변이는 반대로 **답을 바꾸면 안 된다.** 바꾸면 그 짚고 가기의 전제가 거짓이다.
  for (const c of MUTANT_CASES) {
    if (
      show(treeRerooting(c.n, c.edges)) !==
      show(asQueue.treeRerooting(c.n, c.edges))
    ) {
      throw new Error(
        "큐로 바꾼 판이 답을 바꿨다 — 짚고 가기의 전제가 거짓이다",
      );
    }
  }
}

/* ────────────────────────── 수치 ────────────────────────── */

const SHAPES: [string, (v: number) => Edges][] = [
  ["사슬", chain],
  ["별", star],
  ["완전 이진", balanced],
  ["애벌레", caterpillar],
  ["생성식 무작위", (v) => randomTree(v, SEED)],
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
  const near = adjacency(n, edges);
  let best = 0;
  for (const s of near[v] as number[]) {
    best = Math.max(best, countPiece(near, n, v, s).count);
  }
  return best;
}

/** 부모와 자식을 잇는 간선을 방문 순서대로 — `[부모, 자식]`. */
export function treeEdgesInOrder(n: number, edges: Edges): [number, number][] {
  const c = counted(n, edges);
  return c.order.slice(1).map((w) => [c.parent[w] as number, w]);
}

/** 간선 `(p, w)` 를 지우고 `w` 쪽에 남는 정점들 — 그림 사이드카가 조각을 그릴 때 쓴다. */
export function pieceOf(
  n: number,
  edges: Edges,
  p: number,
  w: number,
): number[] {
  return countPiece(adjacency(n, edges), n, p, w).members;
}

/* ── concept ── */

/** concept — 정점 다섯짜리 트리의 답을 정의대로 구한 것과 정본. */
function conceptAnswers(): string {
  const ref = treeRerooting(SMALL_N, SMALL_EDGES);
  let same = 0;
  const rows = Array.from({ length: SMALL_N }, (_, v) => {
    const b = bfsFrom(SMALL_N, SMALL_EDGES, v);
    const others = b.dist.filter((_, u) => u !== v);
    if (b.sum === ref[v]) same++;
    return [`${v}`, others.join(" + "), comma(b.sum), comma(ref[v] as number)];
  });
  return withNote(
    md(
      ["정점 v", "나머지 정점까지의 거리", "정의대로 더한 S(v)", "정본"],
      rows,
      [2, 3],
    ),
    `정의대로 더한 값과 정본이 낸 값이 ${SMALL_N} 자리 가운데 ${same} 자리에서 같습니다.`,
  );
}

/** concept — 뿌리를 이웃으로 한 칸 옮겼을 때 무엇이 몇 개 바뀌는가. */
function conceptMove(): string {
  const c = counted(SMALL_N, SMALL_EDGES);
  const ref = treeRerooting(SMALL_N, SMALL_EDGES);
  const base = ref[0] as number;
  let same = 0;
  const kids = [...(childrenOf(SMALL_N, SMALL_EDGES)[0] as number[])].sort(
    (a, b) => a - b,
  );
  const rows = kids.map((w) => {
    const near = c.size[w] as number;
    const far = SMALL_N - near;
    const got = base - near + far;
    if (got === ref[w]) same++;
    return [
      `0 → ${w}`,
      `${near} 개`,
      `${far} 개`,
      `${base} − ${near} + ${far} = ${got}`,
      comma(ref[w] as number),
    ];
  });
  return withNote(
    md(
      [
        "옮긴 방향",
        "가까워지는 정점",
        "멀어지는 정점",
        "S(0) 에서 고친 값",
        "정본의 답",
      ],
      rows,
      [1, 2, 4],
    ),
    `${rows.length} 줄 가운데 고친 값이 정본의 답과 같은 줄은 ${same} 줄입니다.`,
  );
}

/** concept — 규모 상한에서 두 방법의 기본 연산. */
function conceptScale(): string {
  const n = N_LIMIT;
  return columns([
    ["정점 N", "정점마다 다시 따라가기", "트리 재루팅"],
    [
      comma(n),
      comma(perRootFormula(n)),
      comma(countedLite(n, caterpillar(n)).ops),
    ],
  ]);
}

/* ── deep.origin ── */

/** deep.origin ② — 정점마다 다시 따라가는 방법이 규모에 따라 몇 번이 되는가. */
function originNaive(): string {
  const rows: string[][] = [];
  let fit = 0;
  const sizes = [8, 64, 512, 4096];
  for (const v of sizes) {
    const edges = caterpillar(v);
    const all = perRoot(v, edges);
    if (all.ops === perRootFormula(v)) fit++;
    rows.push([
      comma(v),
      comma(all.one),
      comma(all.ops),
      comma(countedLite(v, edges).ops),
    ]);
  }
  if (fit !== sizes.length) {
    throw new Error("정점마다 다시 따라가기의 식이 센 값과 다르다");
  }
  const big = perRootFormula(N_LIMIT);
  const reroot = countedLite(N_LIMIT, caterpillar(N_LIMIT)).ops;
  rows.push([
    comma(N_LIMIT),
    comma(5 * N_LIMIT - 3),
    comma(big),
    comma(reroot),
  ]);
  const seconds = Math.round(big / 1e8);
  return withNote(
    md(
      ["정점 N", "뿌리 하나 따라가기", "정점마다 다시 따라가기", "트리 재루팅"],
      rows,
      [0, 1, 2, 3],
    ),
    `앞의 ${sizes.length} 줄은 등뼈에 잎을 붙인 트리에서 실제로 센 값이고, ${fit} 줄 모두 정점마다 다시 따라가기가 식 2(N − 1) + N(5N − 3) 과 같습니다. 마지막 줄의 앞 두 칸은 그 식과 5N − 3 에 넣어 늘린 어림이고, 기본 연산을 1 초에 1 억 번 한다고 치면 ${comma(seconds)} 초입니다. 마지막 줄의 트리 재루팅 ${comma(reroot)} 번은 실제로 센 값입니다.`,
  );
}

/** deep.origin — 뿌리마다 다시 따라가면 무엇이 되풀이되는가. */
function originRepeat(): string {
  const near = adjacency(SMALL_N, SMALL_EDGES);
  const items = near.reduce((a, l) => a + l.length, 0);
  const rows: string[][] = [];
  let allRead = 0;
  for (let r = 0; r < SMALL_N; r++) {
    const c = counted(SMALL_N, SMALL_EDGES, r);
    // 한 번 따라가며 읽은 이웃 항목 수 — 꺼낸 정점마다 그 목록을 끝까지 읽는다.
    const read = c.order.reduce((a, u) => a + (near[u] as number[]).length, 0);
    if (read === items) allRead++;
    rows.push([
      `${r}`,
      `${read}`,
      show(c.order),
      comma(bfsFrom(SMALL_N, SMALL_EDGES, r).sum),
    ]);
  }
  return withNote(
    md(["뿌리로 삼은 정점", "읽은 이웃 항목", "방문 순서", "S"], rows, [1, 3]),
    `${SMALL_N} 번 가운데 이웃 항목 ${items} 개를 전부 읽은 것이 ${allRead} 번입니다. 달라진 것은 출발점과 방문 순서뿐입니다.`,
  );
}

/** deep.origin ③ — 뿌리 하나의 답은 깊이를 더하면 나온다. */
function originRoot(): string {
  const c = counted(SMALL_N, SMALL_EDGES);
  const direct = bfsFrom(SMALL_N, SMALL_EDGES, 0);
  const rows = Array.from({ length: SMALL_N }, (_, v) => [
    `${v}`,
    `${c.depth[v]}`,
    `${direct.dist[v]}`,
  ]);
  const sum = c.depth.reduce((a, x) => a + x, 0);
  return withNote(
    md(["정점", "depth", "정점 0 에서 잰 거리"], rows, [1, 2]),
    `깊이를 더한 ${c.depth.join(" + ")} = ${sum}${이가(sum)} 정의대로 구한 S(0) = ${direct.sum}${과와(direct.sum)} ${sum === direct.sum ? "같습니다" : "다릅니다"}.`,
  );
}

/** deep.origin ④ — 이웃의 답을 두 방식으로 얻는 비용. */
function originTwoWays(): string {
  const near = adjacency(SMALL_N, SMALL_EDGES);
  const ref = treeRerooting(SMALL_N, SMALL_EDGES);
  const c = counted(SMALL_N, SMALL_EDGES);
  const perOne = perRoot(SMALL_N, SMALL_EDGES).one;
  const rows: string[][] = [];
  let same = 0;
  for (const w of [1, 2]) {
    const piece = countPiece(near, SMALL_N, 0, w);
    if (piece.count !== c.size[w]) throw new Error("조각 수가 size 와 다르다");
    const fix = (ref[0] as number) + SMALL_N - 2 * piece.count;
    const direct = bfsFrom(SMALL_N, SMALL_EDGES, w).sum;
    if (fix === direct) same++;
    rows.push([
      `S(${w})`,
      `정점 ${w}${을를(w)} 뿌리로 처음부터 다시 따라가기`,
      comma(perOne),
      comma(direct),
    ]);
    rows.push([
      `S(${w})`,
      `S(0) 에서 고치기 — ${w} 쪽 조각 ${setOf(piece.members)} 만 따라가 센다`,
      comma(piece.ops + 1),
      comma(fix),
    ]);
  }
  return withNote(
    md(["얻을 값", "방법", "기본 연산", "값"], rows, [2, 3]),
    `두 방법이 낸 값이 ${rows.length / 2} 쌍 가운데 ${same} 쌍에서 같습니다. 고치는 쪽이 따라간 것은 옮겨 간 쪽 조각뿐이고, 그 조각에서 얻은 것은 정점 수 하나입니다.`,
  );
}

/** 정점 8 · 64 · 512 · 4,096 에서 한 줄씩 옮겨 갈 때 기본 연산이 몇 배로 늘었는가 — 가장 작은 값과 큰 값. */
function growth(
  run: (v: number, e: Edges) => { ops: number },
  gen: (v: number) => Edges,
): string {
  const ops = [8, 64, 512, 4096].map((v) => run(v, gen(v)).ops);
  const ratios = ops.slice(1).map((x, i) => x / (ops[i] as number));
  const lo = Math.min(...ratios).toFixed(1);
  const hi = Math.max(...ratios).toFixed(1);
  return lo === hi ? lo : `${lo} ~ ${hi}`;
}

/** deep.origin ⑤ — 옮길 때마다 조각을 세는 후보. */
function originRecount(): string {
  const rows: string[][] = [];
  for (const [name, gen] of [
    ["애벌레", caterpillar],
    ["사슬", chain],
  ] as [string, (v: number) => Edges][]) {
    for (const v of [8, 64, 512, 4096]) {
      const edges = gen(v);
      const re = recountMoves(v, edges).ops;
      const ro = countedLite(v, edges).ops;
      rows.push([
        name,
        comma(v),
        comma(re),
        comma(ro),
        `${(re / ro).toFixed(1)} 배`,
      ]);
    }
  }
  return withNote(
    md(
      ["모양", "정점 N", "옮길 때마다 세기", "트리 재루팅", "비율"],
      rows,
      [1, 2, 3, 4],
    ),
    `옮김은 두 방법 모두 N − 1 번이고, 한 번의 옮김에 드는 것이 갈립니다. 정점 수가 여덟 배 될 때마다 트리 재루팅은 ${growth(countedLite, chain)} 배로 늘었고, 옮길 때마다 세기는 사슬에서 ${growth((v, e) => recountMoves(v, e), chain)} 배로 늘었습니다.`,
  );
}

/** 시도 사다리의 수 — 그림 사이드카가 받는다. */
export function ladderNumbers(): {
  naiveN: number;
  naiveOps: number;
  recountN: number;
  recountOps: number;
  bigN: number;
  bigOps: number;
} {
  const n = 4096;
  return {
    naiveN: N_LIMIT,
    naiveOps: perRootFormula(N_LIMIT),
    recountN: n,
    recountOps: recountMoves(n, chain(n)).ops,
    bigN: N_LIMIT,
    bigOps: countedLite(N_LIMIT, caterpillar(N_LIMIT)).ops,
  };
}

/* ── deep.build — 먼저 알아 둘 개념 ── */

/** 간선마다 size 로 읽은 두 조각과, 간선을 지우고 직접 센 두 조각. */
function buildEdgePieces(): string {
  const near = adjacency(WALK_N, WALK_EDGES);
  let same = 0;
  const pairs = treeEdgesInOrder(WALK_N, WALK_EDGES);
  const rows = pairs.map(([p, w]) => {
    const low = countPiece(near, WALK_N, p, w);
    const high = countPiece(near, WALK_N, w, p);
    const sw = FINAL.size[w] as number;
    if (low.count === sw && high.count === WALK_N - sw) same++;
    return [
      `(${p}, ${w})`,
      setOf(low.members),
      `${sw}`,
      setOf(high.members),
      `${WALK_N} − ${sw} = ${WALK_N - sw}`,
    ];
  });
  return withNote(
    md(
      ["간선", "자식 쪽 조각", "size[자식]", "부모 쪽 조각", "N − size[자식]"],
      rows,
      [2],
    ),
    `조각은 간선을 지우고 직접 따라가 모았습니다. 간선 ${pairs.length} 개 가운데 두 조각의 정점 수가 size[자식] 과 N − size[자식] 에 그대로 맞는 간선은 ${same} 개입니다.`,
  );
}

/** 부모의 크기는 자식 크기의 합에 자기 하나를 더한 것이다. */
function buildRelation(): string {
  const kids = childrenOf(WALK_N, WALK_EDGES);
  let same = 0;
  const rows = Array.from({ length: WALK_N }, (_, v) => {
    const ks = kids[v] as number[];
    const made = 1 + ks.reduce((a, c) => a + (FINAL.size[c] as number), 0);
    if (made === FINAL.size[v]) same++;
    return [
      `${v}`,
      ks.length === 0 ? "없음" : ks.join(" · "),
      ks.length === 0
        ? "1 (자식 없음)"
        : `1 + ${ks.map((c) => FINAL.size[c]).join(" + ")} = ${made}`,
      `${FINAL.size[v]}`,
    ];
  });
  return withNote(
    md(["정점 v", "자식", "1 + 자식의 size 합", "size[v]"], rows, [3]),
    `정점 ${WALK_N} 개 가운데 자식의 크기로 만든 값이 size[v] 와 같은 정점은 ${same} 개입니다.`,
  );
}

/** 뿌리마다 다시 잰 크기 — 기준 뿌리를 고정하지 않은 모양. */
function buildContrast(): string {
  const fixed = FINAL.size;
  const rows: string[][] = [];
  let changed = 0;
  for (let r = 0; r < WALK_N; r++) {
    const s = counted(WALK_N, WALK_EDGES, r).size;
    const diff = s.filter((x, v) => x !== fixed[v]).length;
    if (r > 0 && diff > 0) changed++;
    rows.push([`${r}`, bare(s), `${diff}`]);
  }
  return withNote(
    md(
      ["다시 잡은 뿌리", "size 배열", "뿌리 0 의 size 와 다른 자리"],
      rows,
      [2],
    ),
    `뿌리를 0 에서 다른 정점으로 옮긴 ${WALK_N - 1} 벌 가운데 size 배열이 뿌리 0 의 것과 달라진 벌은 ${changed} 벌입니다. 한 벌을 만들 때마다 트리를 처음부터 한 번씩 따라가야 합니다.`,
  );
}

/* ── deep.build — 단계 ── */

/** 1단계 — 이웃 목록. */
function buildLists(): string {
  const rows = WALK.near.map((l, v) => [`${v}`, show(l), `${l.length}`]);
  const total = WALK.near.reduce((a, l) => a + l.length, 0);
  return withNote(
    md(["정점 v", "near[v]", "길이"], rows, [2]),
    `길이를 모두 더한 ${total}${은는(total)} 간선 ${WALK_EDGES.length} 개의 두 배입니다.`,
  );
}

/** 2단계 — 스택으로 꺼낸 걸음마다의 상태. */
function buildOrder(): string {
  const rows = WALK.steps
    .filter((s) => s.kind === "pop")
    .map((s) => [
      `${s.u}`,
      (s.skipped as number[]).length === 0
        ? "없음"
        : (s.skipped as number[]).join(" · "),
      (s.pushed as number[]).length === 0
        ? "없음"
        : (s.pushed as number[]).join(" · "),
      show(s.stack),
      show(s.order),
    ]);
  const ahead = treeEdgesInOrder(WALK_N, WALK_EDGES).filter(
    ([p, w]) => FINAL.order.indexOf(p) < FINAL.order.indexOf(w),
  ).length;
  return withNote(
    md(
      [
        "꺼낸 정점",
        "이미 지나온 이웃",
        "새로 담은 정점",
        "그 뒤 스택",
        "그 뒤 order",
      ],
      rows,
    ),
    `parent 는 ${show(FINAL.parent)}, depth 는 ${show(FINAL.depth)} 입니다. 부모와 자식을 잇는 간선 ${WALK_EDGES.length} 개 가운데 order 에서 부모가 자식보다 앞에 놓인 간선은 ${ahead} 개입니다.`,
  );
}

/** 3단계 — 크기를 올리는 걸음마다. */
function buildSize(): string {
  const rows = WALK.steps
    .filter((s) => s.kind === "size")
    .map((s) => {
      const w = s.w as number;
      const p = s.p as number;
      return [
        `${s.i}`,
        `${w} → ${p}`,
        `${s.before} + ${s.size[w]} = ${s.size[p]}`,
        s.sizeDone[p] ? "끝값" : "자식이 남았다",
        bare(s.size),
      ];
    });
  return withNote(
    md(
      ["읽은 자리 i", "자식 → 부모", "size[부모]", "부모의 크기", "그 뒤 size"],
      rows,
    ),
    `마지막 걸음 뒤 size[0] = ${FINAL.size[0]}${이가(FINAL.size[0] as number)} 정점 수 ${WALK_N}${과와(WALK_N)} 같습니다.`,
  );
}

/** 3단계 — 올릴 때 자식의 크기가 이미 끝값이었는가. */
function buildSizeReady(): string {
  let ready = 0;
  const steps = WALK.steps.filter((s) => s.kind === "size");
  const rows = steps.map((s) => {
    const w = s.w as number;
    const ok = s.sizeDone[w] === true && s.size[w] === FINAL.size[w];
    if (ok) ready++;
    return [
      `${s.w} → ${s.p}`,
      `${s.size[w]}`,
      `${FINAL.size[w]}`,
      ok ? "끝값" : "덜 된 값",
    ];
  });
  return withNote(
    md(
      ["자식 → 부모", "그때 size[자식]", "다 올린 뒤 size[자식]", "올린 값"],
      rows,
      [1, 2],
    ),
    `올리기 ${steps.length} 번 가운데 자식의 크기가 이미 끝값이었던 것은 ${ready} 번입니다.`,
  );
}

/** 4단계 — 기준 뿌리의 답. */
function buildRoot(): string {
  const direct = bfsFrom(WALK_N, WALK_EDGES, 0);
  const rows = Array.from({ length: WALK_N }, (_, v) => [
    `${v}`,
    `${FINAL.depth[v]}`,
    `${direct.dist[v]}`,
  ]);
  const sum = FINAL.depth.reduce((a, x) => a + x, 0);
  const same = FINAL.depth.filter((d, v) => d === direct.dist[v]).length;
  return withNote(
    md(["정점 v", "depth[v]", "정점 0 에서 잰 거리"], rows, [1, 2]),
    `${WALK_N} 자리 가운데 depth 와 잰 거리가 같은 자리는 ${same} 자리이고, 깊이의 합 ${sum}${이가(sum)} answer[0] 입니다. 정의대로 구한 S(0) 도 ${direct.sum} 입니다.`,
  );
}

/** 5단계 — 답을 내리는 걸음마다와 정의대로의 답. */
function buildDown(): string {
  const def = byDefinition(WALK_N, WALK_EDGES);
  let same = 0;
  const steps = WALK.steps.filter((s) => s.kind === "down");
  const rows = steps.map((s) => {
    const w = s.w as number;
    const got = s.answer[w] as number;
    if (got === def[w]) same++;
    return [
      `${s.i}`,
      `${s.p} → ${w}`,
      `${s.before} + ${WALK_N} − 2 × ${FINAL.size[w]} = ${got}`,
      `${def[w]}`,
    ];
  });
  return withNote(
    md(
      ["읽은 자리 i", "부모 → 자식", "answer[자식]", "정의대로 구한 S"],
      rows,
      [3],
    ),
    `내리기 ${steps.length} 번 가운데 적은 값이 정의대로 구한 S 와 같은 것은 ${same} 번입니다.`,
  );
}

/** 5단계 — 상태 변수의 범위와, 그 끝값을 내는 입력. */
function buildRanges(): string {
  const lo = (xs: readonly number[]) => Math.min(...xs);
  const hi = (xs: readonly number[]) => Math.max(...xs);
  const ch = counted(5, chain(5));
  const st = counted(5, star(5));
  const rows = [
    [
      "size[v]",
      "1 이상 N 이하",
      `${lo(FINAL.size)} ~ ${hi(FINAL.size)}`,
      `잎에서 1 · 기준 뿌리에서 N (전개 입력의 size[0] = ${FINAL.size[0]})`,
    ],
    [
      "depth[v]",
      "0 이상 N − 1 이하",
      `${lo(FINAL.depth)} ~ ${hi(FINAL.depth)}`,
      `사슬의 반대쪽 끝에서 N − 1 (사슬 정점 5 의 depth[4] = ${ch.depth[4]})`,
    ],
    [
      "answer[v]",
      "N − 1 이상 N(N − 1)/2 이하",
      `${lo(FINAL.answer)} ~ ${hi(FINAL.answer)}`,
      `별의 가운데에서 N − 1 (별 정점 5 의 answer[0] = ${st.answer[0]}) · 사슬의 끝에서 N(N − 1)/2 (사슬 정점 5 의 answer[0] = ${ch.answer[0]})`,
    ],
  ];
  return md(
    ["상태", "범위", "전개 입력에서 나온 값", "끝값이 나오는 자리"],
    rows,
  );
}

/** 전제 — 트리가 아니면 무엇이 나오는가. */
function buildPremise(): string {
  const cycle: Edges = [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 0],
  ];
  const split: Edges = [
    [0, 1],
    [2, 3],
  ];
  const cyc = counted(4, cycle);
  const used = cyc.order.length - 1;
  const rows = [
    [
      "정점 4 · 간선 (0,1) (1,2) (2,3) (3,0)",
      "사이클이 없다",
      show(treeRerooting(4, cycle)),
      show(byDefinition(4, cycle)),
    ],
    [
      "정점 4 · 간선 (0,1) (2,3)",
      "이어져 있다",
      show(treeRerooting(4, split)),
      `${show(byDefinition(4, split))} (갈 수 있는 정점까지만)`,
    ],
  ];
  const visited = counted(4, split).order.length;
  return withNote(
    md(["입력", "깨지는 전제", "정본 절차가 낸 값", "정의대로 구한 값"], rows),
    `사이클 입력에서는 첫 순회가 간선 ${cycle.length} 개 가운데 ${used} 개만 부모와 자식을 잇는 간선으로 쓰고, 남은 간선을 없는 것처럼 계산했습니다. 끊긴 입력에서는 뿌리 0 에서 정점 ${visited} 개만 방문해, 정점 2 · 3 의 답이 시작값 0 으로 남았습니다.`,
  );
}

/** 설계 선택 — 기준 뿌리를 어디에 두어도 답과 비용이 같은가. */
function buildBase(): string {
  const ref = show(treeRerooting(WALK_N, WALK_EDGES));
  let same = 0;
  let sameOps = 0;
  const base0 = counted(WALK_N, WALK_EDGES).ops;
  const rows = Array.from({ length: WALK_N }, (_, r) => {
    const c = counted(WALK_N, WALK_EDGES, r);
    if (show(c.answer) === ref) same++;
    if (c.ops === base0) sameOps++;
    return [`${r}`, show(c.order), show(c.answer), `${c.ops}`];
  });
  return withNote(
    md(["기준 뿌리", "방문 순서", "답", "기본 연산"], rows, [3]),
    `기준 뿌리 ${WALK_N} 개 가운데 답이 정본과 같은 것은 ${same} 개이고, 기본 연산이 ${base0} 번으로 같은 것은 ${sameOps} 개입니다.`,
  );
}

/* ── deep.walk ── */

/** deep.walk 도입 — 끝까지 쓸 입력과 기대하는 반환값. */
function walkInput(): string {
  const edges = WALK_EDGES.map(([a, b]) => `[${a}, ${b}]`).join(", ");
  return [
    `const n = ${WALK_N};`,
    `const edges: [number, number][] = [${edges}];`,
    `// 이 절이 끝나면 ${show(treeRerooting(WALK_N, WALK_EDGES))} 이 나와야 한다`,
  ].join("\n");
}

/** T1 — 이웃 목록. */
function walkAdj(): string {
  const total = WALK.near.reduce((a, l) => a + l.length, 0);
  return columns([
    ...WALK.near.map((l, v) => [`near[${v}] = ${show(l)}`]),
    [`항목 수의 합 ${total} = 간선 ${WALK_EDGES.length} 개의 두 배`],
  ]);
}

/** T2~T8 — 첫 순회. */
function walkOrder(): string {
  const rows = WALK.steps
    .map((s, k) => ({ s, k }))
    .filter(({ s }) => s.kind === "pop")
    .map(({ s, k }) => [
      stepOf(k),
      `${s.u}`,
      (s.skipped as number[]).length === 0
        ? "없음"
        : (s.skipped as number[]).join(" · "),
      (s.pushed as number[]).length === 0
        ? "없음"
        : (s.pushed as number[]).join(" · "),
      show(s.stack),
      show(s.order),
    ]);
  return md(
    [
      "걸음",
      "꺼낸 u",
      "seen 이라 건너뛴 w",
      "담은 w",
      "그 뒤 stack",
      "그 뒤 order",
    ],
    rows,
  );
}

/** 짚고 가기 — 재귀로 적으면 어느 규모에서 끝까지 실행되지 않는가. */
function pauseRecursion(): string {
  const rows = [1_000, 10_000, N_LIMIT].map((v) => [
    comma(v),
    comma(v - 1),
    recursionVerdict(v),
    comma(countedLite(v, chain(v)).peak),
  ]);
  return withNote(
    md(
      ["사슬 정점 수", "필요한 호출 깊이", "재귀 사본", "배열 스택 최대 길이"],
      rows,
      [0, 1, 3],
    ),
    "배열 스택은 사슬에서 길이가 1 을 넘지 않습니다. 자식이 하나뿐이라 담자마자 꺼내기 때문입니다.",
  );
}

/** 짚고 가기 — 스택을 큐로 바꿔도 답이 안 갈린다. */
function pauseQueueAnswer(): string {
  let same = 0;
  const rows = MUTANT_CASES.map((c) => {
    const ok = show(treeRerooting(c.n, c.edges));
    const bad = show(asQueue.treeRerooting(c.n, c.edges));
    if (ok === bad) same++;
    return [c.label, ok, bad, 판정(ok, bad)];
  });
  return withNote(
    md(["입력", "정본", "큐로 꺼낸 판", "두 답"], rows),
    `${rows.length} 입력 가운데 두 답이 같은 입력은 ${same} 개입니다.`,
  );
}

/** 짚고 가기 — 그래도 방문 순서는 달라진다. */
function pauseQueueOrder(): string {
  let ahead = 0;
  let differ = 0;
  const rows = MUTANT_CASES.map((c) => {
    const base = counted(c.n, c.edges);
    const a = base.order;
    const b = queueOrder(c.n, c.edges);
    const ok = (ord: number[]) =>
      ord.every((w, i) => i === 0 || ord.indexOf(base.parent[w] as number) < i);
    if (ok(a) && ok(b)) ahead++;
    if (show(a) !== show(b)) differ++;
    return [c.label, show(a), show(b)];
  });
  return withNote(
    md(["입력", "스택으로 꺼낸 방문 순서", "큐로 꺼낸 방문 순서"], rows),
    `${rows.length} 입력 가운데 두 순서가 다른 입력은 ${differ} 개이고, 두 순서 모두 부모가 자식보다 앞에 있는 입력은 ${ahead} 개입니다.`,
  );
}

/** T9~T14 — 크기를 올리는 걸음. */
function walkSize(): string {
  const rows = WALK.steps
    .map((s, k) => ({ s, k }))
    .filter(({ s }) => s.kind === "size")
    .map(({ s, k }) => {
      const w = s.w as number;
      const p = s.p as number;
      return [
        stepOf(k),
        `${s.i}`,
        `${w}`,
        `${p}`,
        `size[${p}] = ${s.before} + ${s.size[w]} = ${s.size[p]}`,
        bare(s.size),
      ];
    });
  return md(["걸음", "i", "w", "p", "적은 값", "그 뒤 size"], rows);
}

/** T15 — 기준 뿌리의 답. */
function walkRoot(): string {
  const k = WALK.steps.findIndex((s) => s.kind === "root");
  const s = WALK.steps[k] as Snap;
  return columns([
    [stepOf(k), `depth     = ${show(s.depth)}`],
    ["", `atRoot    = ${s.depth.join(" + ")} = ${s.answer[0]}`],
    ["", `answer[0] = ${s.answer[0]}`],
  ]);
}

/** T16~T21 — 답을 내리는 걸음. */
function walkDown(): string {
  const rows = WALK.steps
    .map((s, k) => ({ s, k }))
    .filter(({ s }) => s.kind === "down")
    .map(({ s, k }) => {
      const w = s.w as number;
      const p = s.p as number;
      return [
        stepOf(k),
        `${s.i}`,
        `${w}`,
        `${p}`,
        `answer[${w}] = ${s.before} + ${WALK_N} − 2 × ${FINAL.size[w]} = ${s.answer[w]}`,
        bare(s.answer.map((x) => (x === null ? "—" : String(x)))),
      ];
    });
  return withNote(
    md(["걸음", "i", "w", "p", "적은 값", "그 뒤 answer"], rows),
    `반환값은 ${show(treeRerooting(WALK_N, WALK_EDGES))} 입니다. 표의 — 는 아직 안 적은 자리입니다.`,
  );
}

/** 짚고 가기 — 답을 거꾸로 내리면 어느 입력에서 답이 갈리는가. */
function pauseOrderAnswer(): string {
  let diff = 0;
  const rows = MUTANT_CASES.map((c) => {
    const ok = show(treeRerooting(c.n, c.edges));
    const bad = show(backward.treeRerooting(c.n, c.edges));
    if (ok !== bad) diff++;
    return [c.label, ok, bad, 판정(ok, bad)];
  });
  return withNote(
    md(["입력", "정본", "답을 거꾸로 내린 판", "두 답"], rows),
    `${rows.length} 입력 가운데 두 답이 다른 입력은 ${diff} 개입니다.`,
  );
}

/** 짚고 가기 — 거꾸로 내리면 걸음마다 무엇을 읽는가. 변이와 같은 줄을 바꾼 기록 사본이다. */
function pauseOrderTrace(): string {
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
    if (before === 0 && c.answer[p] !== 0) unset++;
    answer[w] = before + n - 2 * (c.size[w] as number);
    rows.push([
      `${i}`,
      `${p} → ${w}`,
      `${before}`,
      `${answer[w]}`,
      `${c.answer[w]}`,
    ]);
  }
  if (!중화됨 && show(answer) !== show(backward.treeRerooting(n, edges))) {
    throw new Error("거꾸로 내린 자취가 변이 모듈의 답과 다르다");
  }
  return withNote(
    md(
      [
        "읽은 자리 i",
        "부모 → 자식",
        "그때 읽은 answer[부모]",
        "적은 값",
        "옳은 값",
      ],
      rows,
      [2, 3, 4],
    ),
    `내리기 ${rows.length} 번 가운데 부모의 답이 아직 안 적혀 시작값 0 인 채로 읽힌 것이 ${unset} 번입니다.`,
  );
}

/** T1~T21 — 걸음마다 조건 판정과 갈래. */
function walkTrace(): string {
  const hit = new Map<string, string[]>();
  const mark = (label: string, id: string) => {
    hit.set(label, [...(hit.get(label) ?? []), id]);
  };
  const rows = WALK.steps.map((s, k) => {
    const id = stepOf(k);
    if (s.kind === "build") {
      mark("①", id);
      const total = WALK.near.reduce((a, l) => a + l.length, 0);
      return [
        id,
        "간선 목록을 이웃 목록으로 옮긴다",
        "—",
        "①",
        `near 항목 ${total} 개`,
      ];
    }
    if (s.kind === "pop") {
      mark("②", id);
      const sk = s.skipped as number[];
      const pu = s.pushed as number[];
      const cond = [
        "stack.length > 0 참",
        ...sk.map((w) => `seen[${w}] 참`),
        ...pu.map((w) => `seen[${w}] 거짓`),
      ].join(" · ");
      return [
        id,
        `정점 ${s.u}${을를(s.u as number)} 꺼낸다`,
        cond,
        "②",
        `stack ${show(s.stack)}`,
      ];
    }
    if (s.kind === "size") {
      mark("③", id);
      return [
        id,
        `size[${s.w}]${을를(s.w as number)} 부모 ${s.p} 에 올린다`,
        `i = ${s.i} ≥ 1 참`,
        "③",
        `size[${s.p}] = ${s.size[s.p as number]}`,
      ];
    }
    if (s.kind === "root") {
      mark("④", id);
      return [
        id,
        "깊이를 더해 기준 뿌리의 답을 낸다",
        "—",
        "④",
        `answer[0] = ${s.answer[0]}`,
      ];
    }
    mark("⑤", id);
    return [
      id,
      `부모 ${s.p} 의 답에서 answer[${s.w}]${을를(s.w as number)} 낸다`,
      `i = ${s.i} < ${WALK_N} 참`,
      "⑤",
      `answer[${s.w}] = ${s.answer[s.w as number]}`,
    ];
  });
  const listed = ["①", "②", "③", "④", "⑤"]
    .map((l) => {
      const ids = hit.get(l) ?? [];
      const span =
        ids.length === 1 ? ids[0] : `${ids[0]}\\~${ids.at(-1) as string}`;
      return `${l}${은는(LABEL_READ[l] as string)} ${span}`;
    })
    .join(", ");
  return withNote(
    md(["걸음", "하는 일", "조건 판정", "갈래", "그 뒤"], rows),
    `${listed} 에서 실행됐습니다. 반복문 셋은 각각 마지막 걸음 뒤에 조건 stack.length > 0 · i ≥ 1 · i < ${WALK_N} 이 거짓이 되어 끝났습니다. 반환값은 ${show(treeRerooting(WALK_N, WALK_EDGES))} 입니다.`,
  );
}

/** 전체 코드 뒤 — 여러 입력의 반환값. */
function walkResult(): string {
  const cases: [string, number, Edges][] = [
    ["전개 입력 (정점 7)", WALK_N, WALK_EDGES],
    ["정점 다섯짜리 트리", SMALL_N, SMALL_EDGES],
    ["사슬 (정점 5)", 5, chain(5)],
    ["별 (정점 5)", 5, star(5)],
    ["정점 하나", 1, []],
  ];
  return columns(
    cases.map(([label, n, edges]) => [
      label,
      "→",
      show(treeRerooting(n, edges)),
    ]),
  );
}

/* ── related ── */

function relatedCentroid(): string {
  const cases: [string, number, Edges][] = [
    ["사슬 (정점 5)", 5, chain(5)],
    ["별 (정점 5)", 5, star(5)],
    ["전개 입력 (정점 7)", WALK_N, WALK_EDGES],
    ["완전 이진 (정점 15)", 15, balanced(15)],
  ];
  let ok = 0;
  const rows = cases.map(([label, n, edges]) => {
    const answer = treeRerooting(n, edges);
    const best = minimizers(answer);
    const pieces = best.map((v) => largestPiece(n, edges, v));
    if (pieces.every((x) => x <= Math.floor(n / 2))) ok++;
    return [
      label,
      show(answer),
      best.join(" · "),
      pieces.join(" · "),
      `${Math.floor(n / 2)}`,
    ];
  });
  return withNote(
    md(
      [
        "입력",
        "답",
        "답이 가장 작은 정점",
        "그 정점을 뗀 가장 큰 조각",
        "N/2 의 내림",
      ],
      rows,
      [3, 4],
    ),
    `${rows.length} 입력 가운데 답이 가장 작은 정점을 뗀 가장 큰 조각이 정점 수의 절반을 넘지 않는 입력은 ${ok} 개입니다.`,
  );
}

/* ── deep.math ── */

/** 정의 셋을 전개 입력의 정점 1 에 넣는다. */
function mathOne(): string {
  const kids = childrenOf(WALK_N, WALK_EDGES)[1] as number[];
  const b = bfsFrom(WALK_N, WALK_EDGES, 1);
  const others = b.dist.map((d, u) => ({ d, u })).filter(({ u }) => u !== 1);
  return columns([
    [
      `ch(1) = ${setOf(kids)}`,
      `size(1) = 1 + ${kids.map((c) => `size(${c})`).join(" + ")} = 1 + ${kids.map((c) => FINAL.size[c]).join(" + ")} = ${FINAL.size[1]}`,
    ],
    ["depth(1)", `= d(0, 1) = ${FINAL.depth[1]}`],
    [
      "S(1)",
      `= ${others.map(({ u }) => `d(1,${u})`).join(" + ")} = ${others.map(({ d }) => d).join(" + ")} = ${b.sum}`,
    ],
  ]);
}

/** 정의를 일곱 정점 전부에 넣어 검산한다. */
function mathCheck(): string {
  let same = 0;
  const rows = Array.from({ length: WALK_N }, (_, v) => {
    const direct = bfsFrom(WALK_N, WALK_EDGES, v);
    if (direct.sum === FINAL.answer[v]) same++;
    return [
      `${v}`,
      `${FINAL.size[v]}`,
      `${FINAL.depth[v]}`,
      bare(direct.dist),
      `${direct.sum}`,
      `${FINAL.answer[v]}`,
    ];
  });
  return withNote(
    md(
      [
        "v",
        "size(v)",
        "depth(v)",
        "d(v, ·)",
        "정의대로 더한 S(v)",
        "answer[v]",
      ],
      rows,
      [1, 2, 4, 5],
    ),
    `정점 ${WALK_N} 개 가운데 정의대로 거리를 더한 값과 절차가 낸 값이 같은 정점은 ${same} 개입니다.`,
  );
}

/** 사슬 다섯에서 간선마다의 몫. */
function mathChain5(): string {
  const n = 5;
  const c = counted(n, chain(n));
  const lines: string[][] = [];
  let total = 0;
  for (const w of c.order.slice(1)) {
    const p = c.parent[w] as number;
    const a = c.size[w] as number;
    const part = 2 * a * (n - a);
    total += part;
    lines.push([
      `간선 (${p},${w})`,
      `조각 ${a} 개와 ${n - a} 개`,
      `2 × ${a} × ${n - a} = ${part}`,
    ]);
  }
  const ans = treeRerooting(n, chain(n));
  const sum = ans.reduce((s, x) => s + x, 0);
  lines.push(["", "간선마다의 몫을 더하면", `${total}`]);
  lines.push([`답 ${show(ans)}`, "을 더하면", `${sum}`]);
  return columns(lines);
}

/** 간선 분할로 얻은 총합 항등식을 여러 모양에서 맞춘다. */
function mathIdentity(): string {
  const cases: [string, number, Edges][] = [
    ["전개 입력", WALK_N, WALK_EDGES],
    ["사슬 (정점 9)", 9, chain(9)],
    ["별 (정점 9)", 9, star(9)],
    ["완전 이진 (정점 15)", 15, balanced(15)],
    ["생성식 무작위 (정점 64)", 64, randomTree(64, SEED)],
  ];
  let same = 0;
  const rows = cases.map(([label, n, edges]) => {
    const total = treeRerooting(n, edges).reduce((s, x) => s + x, 0);
    const c = counted(n, edges);
    let byEdge = 0;
    for (const w of c.order.slice(1)) {
      const a = c.size[w] as number;
      byEdge += a * (n - a);
    }
    if (total === 2 * byEdge) same++;
    return [
      label,
      comma(total),
      comma(2 * byEdge),
      판정(String(total), String(2 * byEdge)),
    ];
  });
  return withNote(
    md(
      ["입력", "answer 의 합", "간선마다 2 × a(N − a) 의 합", "두 값"],
      rows,
      [1, 2],
    ),
    `${rows.length} 입력 가운데 두 값이 같은 입력은 ${same} 개입니다.`,
  );
}

/** 사슬의 닫힌 형태를 N = 5 에 넣는다. */
function mathClosed5(): string {
  const n = 5;
  const ans = treeRerooting(n, chain(n));
  return columns(
    Array.from({ length: n }, (_, v) => {
      const left = (v * (v + 1)) / 2;
      const right = ((n - 1 - v) * (n - v)) / 2;
      return [
        `v = ${v}`,
        `${left} + (${n - 1 - v} × ${n - v})/2 = ${left + right}`,
        `answer[${v}] = ${ans[v]}`,
      ];
    }),
  );
}

/** 닫힌 형태에 규모 상한을 넣은 값. */
function mathScale(): string {
  let same = 0;
  const rows = [10, 1_000, N_LIMIT].map((v) => {
    const lite = countedLite(v, chain(v));
    const closed = (v * (v - 1)) / 2;
    if (lite.max === closed) same++;
    return [
      comma(v),
      comma(lite.max),
      comma(closed),
      판정(String(lite.max), String(closed)),
    ];
  });
  const top = (N_LIMIT * (N_LIMIT - 1)) / 2;
  const i32 = 2 ** 31 - 1;
  return withNote(
    md(
      ["사슬 정점 수", "answer 의 최댓값", "N(N − 1)/2", "두 값"],
      rows,
      [0, 1, 2],
    ),
    `${rows.length} 줄 가운데 두 값이 같은 줄은 ${same} 줄입니다. N = ${comma(N_LIMIT)} 에서 답의 최댓값 ${comma(top)}${은는(comma(top))} 부호 있는 32 비트 정수의 한계 ${comma(i32)}${을를(comma(i32))} ${(top / i32).toFixed(1)} 배 넘고, 배정밀도 실수가 정확히 담는 한계 ${comma(Number.MAX_SAFE_INTEGER)} 안에는 들어갑니다.`,
  );
}

/* ── invariant ── */

/** 걸음마다 불변식이 유지되는가. */
function invariantHold(): string {
  const def = byDefinition(WALK_N, WALK_EDGES);
  let ok = 0;
  const steps = WALK.steps
    .map((s, k) => ({ s, k }))
    .filter(({ s }) => s.kind === "root" || s.kind === "down");
  const rows = steps.map(({ s, k }) => {
    const i = s.kind === "root" ? 0 : (s.i as number);
    const prefix = s.order.slice(0, i + 1);
    const exact = prefix.every((v) => s.answer[v] === def[v]);
    const restEmpty = s.order.slice(i + 1).every((v) => s.answer[v] === null);
    if (exact && restEmpty) ok++;
    return [
      stepOf(k),
      s.kind === "root" ? "0" : `${s.w}`,
      show(prefix),
      exact ? "정의와 같다" : "다르다",
      restEmpty ? "비어 있다" : "적혔다",
    ];
  });
  return withNote(
    md(
      [
        "걸음",
        "이번에 적은 정점",
        "order 의 앞부분",
        "앞부분의 answer",
        "나머지의 answer",
      ],
      rows,
    ),
    `걸음 ${rows.length} 개 가운데 불변식의 두 조건이 모두 참인 걸음은 ${ok} 개입니다.`,
  );
}

/** 엣지 케이스. */
function invariantEdge(): string {
  const small: [string, number, Edges][] = [
    ["정점 하나", 1, []],
    ["정점 둘", 2, [[0, 1]]],
    ["사슬 (정점 3)", 3, chain(3)],
    ["별 (정점 3)", 3, star(3)],
  ];
  const rows: string[][] = small.map(([label, n, edges]) => {
    const a = show(treeRerooting(n, edges));
    const b = show(byDefinition(n, edges));
    return [label, a, b, 판정(a, b)];
  });
  const n = N_LIMIT;
  const chainAns = treeRerooting(n, chain(n));
  const top = (n * (n - 1)) / 2;
  const a1 = `[${comma(chainAns[0] as number)}, ${comma(chainAns[1] as number)}, …]`;
  const b1 = `[${comma(top)}, ${comma(top + n - 2 * (n - 1))}, …]`;
  rows.push(["사슬 (정점 100,000)", a1, b1, 판정(a1, b1)]);
  const starAns = treeRerooting(n, star(n));
  const a2 = `[${comma(starAns[0] as number)}, ${comma(starAns[1] as number)}, …]`;
  const b2 = `[${comma(n - 1)}, ${comma(1 + 2 * (n - 2))}, …]`;
  rows.push(["별 (정점 100,000)", a2, b2, 판정(a2, b2)]);
  return withNote(
    md(["입력", "절차가 낸 값", "정의 또는 식으로 구한 값", "두 값"], rows),
    "정점 셋까지는 정점마다 거리를 직접 더했고, 정점 100,000 짜리 둘은 앞 두 자리를 사슬은 N(N − 1)/2 와 거기에 N − 2(N − 1) 을 더한 값으로, 별은 N − 1 과 1 + 2(N − 2) 로 구했습니다. 정점 하나면 내리는 반복문이 한 번도 실행되지 않고, 깊이의 합 0 이 그대로 답입니다.",
  );
}

/** 불변식을 지키던 줄을 바꾸면 어떤 값이 나오는가. */
function invariantMutant(): string {
  const cases = [
    ...MUTANT_CASES,
    { label: "정점 하나", n: 1, edges: [] as Edges },
  ];
  let diff = 0;
  const rows = cases.map((c) => {
    const ok = show(treeRerooting(c.n, c.edges));
    const bad = show(halfDelta.treeRerooting(c.n, c.edges));
    if (ok !== bad) diff++;
    return [c.label, ok, bad, 판정(ok, bad)];
  });
  return withNote(
    md(["입력", "정본", "가까워지는 정점을 안 뺀 판", "두 답"], rows),
    `${rows.length} 입력 가운데 두 답이 다른 입력은 ${diff} 개입니다.`,
  );
}

/* ── perf ── */

const LABELS: [string, string, string, SnapKind][] = [
  ["①", "이웃 목록을 만든다", "2(N − 1)", "build"],
  [
    "②",
    "첫 순회로 방문 순서 · 부모 · 깊이를 정한다",
    "N + 2(N − 1) + (N − 1)",
    "pop",
  ],
  ["③", "부분트리 크기를 부모에 올린다", "N − 1", "size"],
  ["④", "깊이를 더해 기준 뿌리의 답을 낸다", "N", "root"],
  ["⑤", "부모의 답에서 자식의 답을 내린다", "N − 1", "down"],
];

/** perf.derive — 갈래마다의 계수. */
function perfDerive(): string {
  const c = counted(WALK_N, WALK_EDGES);
  const e = WALK_EDGES.length;
  // ② 는 꺼내기 N + 이웃 항목 읽기 2E + 담기 N − 1 이다.
  const counts = [
    2 * e,
    WALK_N + 2 * e + (WALK_N - 1),
    WALK_N - 1,
    WALK_N,
    WALK_N - 1,
  ];
  const rows = LABELS.map(([l, what, formula, kind], i) => [
    l,
    what,
    spanPlain(kind),
    `${counts[i]}`,
    formula,
  ]);
  const sum = counts.reduce((a, x) => a + x, 0);
  if (sum !== c.ops) throw new Error("갈래별 합이 센 기본 연산과 다르다");
  return withNote(
    md(
      ["갈래", "하는 일", "전개의 걸음", "이 입력의 횟수", "N 으로"],
      rows,
      [3],
    ),
    `다섯 갈래의 합 ${sum}${과와(sum)} 실행이 센 기본 연산 ${c.ops}${이가(c.ops)} 같고, 식 9N − 7 에 N = ${WALK_N}${을를(WALK_N)} 넣은 값도 ${9 * WALK_N - 7} 입니다.`,
  );
}

/** perf.bounds — 모양을 바꿔도 계수가 같은가. */
function perfBounds(): string {
  const rows: string[][] = [];
  let fit = 0;
  for (const [name, gen] of SHAPES) {
    for (const v of [1_000, N_LIMIT]) {
      const lite = countedLite(v, gen(v));
      if (lite.ops === 9 * v - 7) fit++;
      rows.push([
        name,
        comma(v),
        comma(lite.ops),
        comma(9 * v - 7),
        comma(lite.peak),
      ]);
    }
  }
  return withNote(
    md(
      ["모양", "정점 N", "기본 연산", "9N − 7", "스택 최대 길이"],
      rows,
      [1, 2, 3, 4],
    ),
    `${rows.length} 줄 가운데 기본 연산이 9N − 7 과 같은 줄은 ${fit} 줄이고, 스택 최대 길이만 모양에 따라 갈립니다.`,
  );
}

/** perf.worst — 축마다 무엇이 최악인가. */
function perfWorst(): string {
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
  let peakBy = "";
  let peak = 0;
  let maxBy = "";
  let max = 0;
  for (const [name, gen] of SHAPES) {
    const lite = countedLite(N_LIMIT, gen(N_LIMIT));
    rows.push([name, comma(lite.ops), comma(lite.peak), comma(lite.max)]);
    if (lite.peak > peak) {
      peak = lite.peak;
      peakBy = name;
    }
    if (lite.max > max) {
      max = lite.max;
      maxBy = name;
    }
  }
  const same = forward.ops === reversed.ops && forward.peak === reversed.peak;
  return withNote(
    md(
      ["정점 100,000 짜리 입력", "기본 연산", "스택 최대 길이", "답의 최댓값"],
      rows,
      [1, 2, 3],
    ),
    `스택이 가장 길어지는 것은 ${peakBy} 모양이고 그 길이는 ${comma(peak)} 입니다. 답이 가장 커지는 것은 ${maxBy} 모양이고 그 값은 ${comma(max)} 입니다. 간선 목록의 순서를 뒤집은 별은 기본 연산과 스택 최대 길이가 ${same ? "둘 다 그대로입니다" : "달라졌습니다"}.`,
  );
}

/* ── selfcheck ── */

export const CHECK_N = 6;
export const CHECK_EDGES: Edges = [
  [0, 1],
  [1, 2],
  [1, 3],
  [3, 4],
  [3, 5],
];

function selfcheckAnswer(): string {
  const c = counted(CHECK_N, CHECK_EDGES);
  const def = byDefinition(CHECK_N, CHECK_EDGES);
  const rows = Array.from({ length: CHECK_N }, (_, v) => [
    `${v}`,
    `${c.size[v]}`,
    `${c.depth[v]}`,
    `${c.answer[v]}`,
    `${def[v]}`,
  ]);
  return withNote(
    md(
      ["v", "size(v)", "depth(v)", "answer[v]", "정의대로 구한 S(v)"],
      rows,
      [1, 2, 3, 4],
    ),
    `방문 순서는 ${show(c.order)} 이고 반환값은 ${show(c.answer)} 입니다.`,
  );
}

export const PROOFS: Record<string, () => string> = {
  "concept-answers": conceptAnswers,
  "concept-move": conceptMove,
  "concept-scale": conceptScale,
  "origin-naive": originNaive,
  "origin-repeat": originRepeat,
  "origin-root": originRoot,
  "origin-two-ways": originTwoWays,
  "origin-recount": originRecount,
  "build-edge-pieces": buildEdgePieces,
  "build-relation": buildRelation,
  "build-contrast": buildContrast,
  "build-lists": buildLists,
  "build-order": buildOrder,
  "build-size": buildSize,
  "build-size-ready": buildSizeReady,
  "build-root": buildRoot,
  "build-down": buildDown,
  "build-ranges": buildRanges,
  "build-premise": buildPremise,
  "build-base": buildBase,
  "walk-input": walkInput,
  "walk-adj": walkAdj,
  "walk-order": walkOrder,
  "pause-recursion": pauseRecursion,
  "pause-queue-answer": pauseQueueAnswer,
  "pause-queue-order": pauseQueueOrder,
  "walk-size": walkSize,
  "walk-root": walkRoot,
  "walk-down": walkDown,
  "pause-order-answer": pauseOrderAnswer,
  "pause-order-trace": pauseOrderTrace,
  "walk-trace": walkTrace,
  "walk-result": walkResult,
  "related-centroid": relatedCentroid,
  "math-one": mathOne,
  "math-check": mathCheck,
  "math-chain5": mathChain5,
  "math-identity": mathIdentity,
  "math-closed5": mathClosed5,
  "math-scale": mathScale,
  "invariant-hold": invariantHold,
  "invariant-edge": invariantEdge,
  "invariant-mutant": invariantMutant,
  "perf-derive": perfDerive,
  "perf-bounds": perfBounds,
  "perf-worst": perfWorst,
  "selfcheck-answer": selfcheckAnswer,
};
