/**
 * `purpose.alt` 가 인용하는 수치의 출처 — L13.
 *
 * **같은 입력·같은 작업 목록**에 두 설계를 세우고 **결정론적 계수**만 센다. 벽시계·처리량은
 * 실행마다 달라 「본문의 수치가 실측과 일치하는가」(P10)를 정의할 수 없다.
 *
 *   bun run tools/bench-alt.ts src/algorithms/tree/subtreeSumQuery/subtreeSumQuery-guide.alt.ts
 *
 * **두 설계가 매 실행마다 정본과 같은 답을 내는지 먼저 확인한다**(`확인()`). 답이 다른
 * 구현으로 잰 계수는 저울질이 아니라 다른 문제의 값이다.
 *
 * **전개 입력과 다른 입력을 쓴다**(L20). 전개는 정점 여섯이라 두 계수가 갈리는 자리를
 * 보이기에 너무 작다 — 사슬로 두어도 조상 사슬이 다섯 칸이라 펜윅 트리의 걸음 수와 같은
 * 자릿수다. 그래서 정점 수를 1,024 로 고정하고 **트리의 깊이만** 바꾼 가족을 함께 쓰고,
 * 전개 입력의 값도 표에 남긴다. 그 사실을 본문 대조 문단에도 적는다.
 *
 * **입력은 생성식으로 고정한다.** 정점 수 `N` 과 사슬 길이 `D` 를 받아 `0-1-…-D` 사슬을
 * 만들고 남은 정점 `D+1 … N-1` 을 전부 정점 `D` 의 자식으로 붙인다(`broom`). 값은
 * `values[v] = (v × 37) mod 101 − 50` 이고, 작업 목록은 바퀴 `t` 마다
 * `update((t × 401) mod N, (t × 53) mod 199 − 99)` 와 `querySubtree((t × 613) mod N)` 이다.
 * **갱신 자리도 질의 자리도 정점 전체를 고르게 지난다** — 한쪽에 유리한 자리만 고르면 그
 * 수치는 대조가 아니라 연출이다. 한 번 정한 입력은 수치가 마음에 안 든다는 이유로 바꾸지 않는다.
 */

import { SubtreeSumQuery } from "./subtreeSumQuery-guide.ref.ts";

/* ────────────────────────── 고정 입력 ────────────────────────── */

/** 본문 전개가 쓰는 트리. 정점 여섯 · 간선 다섯. */
export const WALK_N = 6;
export const WALK_EDGES: [number, number][] = [
  [0, 1],
  [0, 2],
  [1, 3],
  [1, 4],
  [2, 5],
];
export const WALK_VALUES = [1, 2, 3, 4, 5, 6];

/** 대조에 쓰는 정점 수. 깊이만 바꾸려고 고정한다. */
export const N = 1_024;

/** 작업 목록의 바퀴 수. 한 바퀴가 갱신 하나와 질의 하나다. */
export const ROUNDS = 512;

/** 제약 상한. 두 설계의 최악을 이 규모에서 한 번 잰다. */
export const LIMIT_N = 100_000;

/**
 * 사슬 길이 `d` 인 나무 — `0-1-…-d` 를 잇고 남은 정점을 전부 정점 `d` 의 자식으로 붙인다.
 *
 * `d = 1` 이면 뿌리 아래 정점 하나에 잎이 전부 매달린 모양이고, `d = n - 1` 이면 사슬이다.
 * 정점 수가 고정이라 **깊이만** 달라진다.
 */
export function broom(n: number, d: number): [number, number][] {
  const edges: [number, number][] = [];
  for (let v = 1; v <= d && v < n; v++) edges.push([v - 1, v]);
  for (let v = d + 1; v < n; v++) edges.push([d, v]);
  return edges;
}

/** 값 생성식. */
export function values(n: number): number[] {
  return Array.from({ length: n }, (_, v) => ((v * 37) % 101) - 50);
}

/** 작업 목록 — `[갱신할 정점, 새 값, 질의할 정점]` 을 바퀴 수만큼. */
export function work(n: number, rounds: number): [number, number, number][] {
  return Array.from({ length: rounds }, (_, t) => [
    (t * 401) % n,
    ((t * 53) % 199) - 99,
    (t * 613) % n,
  ]);
}

/* ────────────────────────── 두 설계 ────────────────────────── */

export interface Run {
  /** 만들 때 배열 칸에 접근한 횟수. */
  build: number;
  /** 작업 목록을 처리하며 배열 칸에 접근한 횟수. */
  ops: number;
  /** 들고 있는 배열 칸 수. */
  cells: number;
  /** 질의가 낸 답을 순서대로 담은 것. */
  answers: number[];
}

/** 뿌리에서 한 번 순회해 방문 순서와 부모를 낸다. 두 설계가 함께 쓴다. */
function traverse(
  n: number,
  edges: [number, number][],
  root: number,
): { order: number[]; parent: number[]; near: number[][]; reads: number } {
  let reads = 0;
  const near: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    (near[u] as number[]).push(v);
    (near[v] as number[]).push(u);
    reads += 2;
  }
  const parent: number[] = Array.from({ length: n }, () => -1);
  const seen: boolean[] = Array.from({ length: n }, () => false);
  const order: number[] = [];
  const stack = [root];
  seen[root] = true;
  while (stack.length > 0) {
    const u = stack.pop() as number;
    order.push(u);
    reads++;
    for (const w of near[u] as number[]) {
      reads++;
      if (seen[w] === true) continue;
      seen[w] = true;
      parent[w] = u;
      reads += 2;
      stack.push(w);
    }
  }
  return { order, parent, near, reads };
}

/**
 * 이 가이드의 설계 — 진입 자리로 부분 트리를 구간으로 만들고 펜윅 트리에 값을 담는다.
 * 정본(`subtreeSumQuery-guide.ref.ts`)과 같고 세는 자리만 덧붙였다.
 *
 * 배열 칸 접근은 **읽기 하나와 쓰기 하나를 각각 한 번**으로 센다.
 */
function 구간설계(
  n: number,
  edges: [number, number][],
  root: number,
  vals: number[],
  todo: [number, number, number][],
): Run {
  let build = 0;
  const near: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    (near[u] as number[]).push(v);
    (near[v] as number[]).push(u);
    build += 2;
  }
  const tin: number[] = Array.from({ length: n }, () => 0);
  const tout: number[] = Array.from({ length: n }, () => 0);
  const value = vals.slice();
  const seen: boolean[] = Array.from({ length: n }, () => false);
  const cursor: number[] = Array.from({ length: n }, () => 0);
  const stack = [root];
  let timer = 0;
  seen[root] = true;
  tin[root] = timer;
  timer++;
  build += 2;
  while (stack.length > 0) {
    const v = stack[stack.length - 1] as number;
    const nbrs = near[v] as number[];
    const i = cursor[v] as number;
    build += 2;
    if (i < nbrs.length) {
      cursor[v] = i + 1;
      const w = nbrs[i] as number;
      build += 3;
      if (seen[w] !== true) {
        seen[w] = true;
        tin[w] = timer;
        timer++;
        build += 2;
        stack.push(w);
      }
      continue;
    }
    tout[v] = timer - 1;
    build++;
    stack.pop();
  }
  const tree: number[] = Array.from({ length: n + 1 }, () => 0);
  for (let v = 0; v < n; v++) {
    tree[(tin[v] as number) + 1] = vals[v] as number;
    build += 3;
  }
  for (let i = 1; i <= n; i++) {
    const up = i + (i & -i);
    if (up <= n) {
      tree[up] = (tree[up] as number) + (tree[i] as number);
      build += 3;
    }
  }

  let ops = 0;
  const answers: number[] = [];
  const prefix = (last: number): number => {
    let sum = 0;
    for (let i = last + 1; i > 0; i -= i & -i) {
      sum += tree[i] as number;
      ops++;
    }
    return sum;
  };
  for (const [node, fresh, ask] of todo) {
    const delta = fresh - (value[node] as number);
    value[node] = fresh;
    ops += 3; // value 읽기 · value 쓰기 · tin 읽기
    for (let i = (tin[node] as number) + 1; i <= n; i += i & -i) {
      tree[i] = (tree[i] as number) + delta;
      ops += 2;
    }
    ops += 2; // tout 읽기 · tin 읽기
    answers.push(
      prefix(tout[ask] as number) - prefix((tin[ask] as number) - 1),
    );
  }
  return { build, ops, cells: 3 * n + (n + 1), answers };
}

/**
 * 경쟁 설계 — **부분 트리 합을 정점마다 통째로 들고 있고, 갱신은 조상 사슬을 거슬러 올라가며
 * 고친다.** 질의는 칸 하나를 읽는 것으로 끝난다.
 *
 * 같은 문제를 푼다 — 값 교체 갱신과 임의 정점의 부분 트리 합 질의를 그대로 받는다. 이쪽이
 * 이 가이드의 절차보다 짧고, 질의가 `O(1)` 이라 열등한 상대가 아니다.
 *
 * 배열 칸 접근은 같은 기준이다 — 읽기 하나와 쓰기 하나를 각각 한 번으로 센다.
 */
function 조상사슬설계(
  n: number,
  edges: [number, number][],
  root: number,
  vals: number[],
  todo: [number, number, number][],
): Run {
  const t = traverse(n, edges, root);
  let build = t.reads;
  const value = vals.slice();
  const sum = vals.slice();
  build += n;
  for (let i = t.order.length - 1; i >= 1; i--) {
    const w = t.order[i] as number;
    const p = t.parent[w] as number;
    sum[p] = (sum[p] as number) + (sum[w] as number);
    build += 4;
  }

  let ops = 0;
  const answers: number[] = [];
  for (const [node, fresh, ask] of todo) {
    const delta = fresh - (value[node] as number);
    value[node] = fresh;
    ops += 2;
    for (let c = node; c !== -1; c = t.parent[c] as number) {
      sum[c] = (sum[c] as number) + delta;
      ops += 3; // sum 읽기 · sum 쓰기 · parent 읽기
    }
    ops++;
    answers.push(sum[ask] as number);
  }
  return { build, ops, cells: 3 * n, answers };
}

/* ────────────────────────── 대조 ────────────────────────── */

/** 정본을 그대로 실행해 작업 목록의 답을 낸다. */
function 정본답(
  n: number,
  edges: [number, number][],
  root: number,
  vals: number[],
  todo: [number, number, number][],
): number[] {
  const sst = new SubtreeSumQuery(n, edges, root, vals);
  const out: number[] = [];
  for (const [node, fresh, ask] of todo) {
    sst.update(node, fresh);
    out.push(sst.querySubtree(ask));
  }
  return out;
}

function 같은가(a: number[], b: number[]): boolean {
  return a.length === b.length && a.every((x, i) => x === b[i]);
}

/** 두 설계가 **정본과 같은 답**을 내는지 확인한다. 다르면 대조가 성립하지 않는다. */
function 확인(): void {
  const inputs: [number, [number, number][], number][] = [
    [WALK_N, WALK_EDGES, 0],
    [N, broom(N, 1), 0],
    [N, broom(N, 10), 0],
    [N, broom(N, 64), 0],
    [N, broom(N, N - 1), 0],
  ];
  for (const [n, edges, root] of inputs) {
    const vals = n === WALK_N ? WALK_VALUES : values(n);
    const todo = work(n, Math.min(ROUNDS, 4 * n));
    const want = 정본답(n, edges, root, vals, todo);
    if (!같은가(구간설계(n, edges, root, vals, todo).answers, want)) {
      throw new Error("세는 사본이 정본과 다른 답을 낸다");
    }
    if (!같은가(조상사슬설계(n, edges, root, vals, todo).answers, want)) {
      throw new Error("경쟁 설계가 정본과 다른 답을 낸다");
    }
  }
}
확인();

/* ────────────────────────── 경계 ────────────────────────── */

const TODO = work(N, ROUNDS);
const VALS = values(N);

function 재기(
  run: (
    n: number,
    e: [number, number][],
    r: number,
    v: number[],
    t: [number, number, number][],
  ) => Run,
  d: number,
): Run {
  return run(N, broom(N, d), 0, VALS, TODO);
}

/**
 * 사슬 길이를 1 부터 `N - 1` 까지 **전수로** 재서 순서가 뒤집히는 자리를 찾는다.
 *
 * `lastAhead` 는 경쟁 설계가 아직 적은 마지막 사슬 길이이고 `firstBehind` 는 이 가이드의
 * 절차가 처음으로 적어지는 사슬 길이다. 두 계수가 사슬 길이에 대해 단조롭지 않을 수 있어
 * 이분 탐색을 쓰지 않는다 — 전수로 재고, 그 뒤로 다시 뒤집히지 않는지도 함께 본다.
 */
export function crossing(): { lastAhead: number; firstBehind: number } {
  let lastAhead = -1;
  let firstBehind = -1;
  for (let d = 1; d < N; d++) {
    const ahead = 재기(조상사슬설계, d).ops < 재기(구간설계, d).ops;
    if (ahead) lastAhead = d;
    else if (firstBehind === -1) firstBehind = d;
  }
  if (lastAhead === -1) {
    throw new Error(
      "어느 깊이에서도 경쟁 설계가 앞서지 않는다 — 대조가 아니다",
    );
  }
  if (firstBehind === -1) {
    throw new Error("어느 깊이에서도 순서가 안 뒤집힌다 — 절을 빼야 한다");
  }
  if (firstBehind !== lastAhead + 1) {
    throw new Error(
      `경계가 이어져 있지 않다 — 마지막으로 앞선 자리 ${lastAhead} · 처음 밀린 자리 ${firstBehind}`,
    );
  }
  return { lastAhead, firstBehind };
}

const CROSS = crossing();

/** 제약 상한 규모에서 한 번 잰다. 사슬과 별 두 극단이다. */
function 상한(
  run: (
    n: number,
    e: [number, number][],
    r: number,
    v: number[],
    t: [number, number, number][],
  ) => Run,
  d: number,
): Run {
  return run(
    LIMIT_N,
    broom(LIMIT_N, d),
    0,
    values(LIMIT_N),
    work(LIMIT_N, ROUNDS),
  );
}

function 표(
  run: (
    n: number,
    e: [number, number][],
    r: number,
    v: number[],
    t: [number, number, number][],
  ) => Run,
): Record<string, number> {
  const walk = run(WALK_N, WALK_EDGES, 0, WALK_VALUES, work(WALK_N, ROUNDS));
  const before = 재기(run, CROSS.lastAhead);
  const after = 재기(run, CROSS.firstBehind);
  const chain = 재기(run, N - 1);
  const limitChain = 상한(run, LIMIT_N - 1);
  const limitStar = 상한(run, 1);
  return {
    "전개 트리 · 작업 접근": walk.ops,
    [`사슬 길이 ${CROSS.lastAhead} · 작업 접근`]: before.ops,
    [`사슬 길이 ${CROSS.firstBehind} · 작업 접근`]: after.ops,
    [`사슬 길이 ${N - 1} · 작업 접근`]: chain.ops,
    "제약 상한 사슬 · 작업 접근": limitChain.ops,
    "제약 상한 별 · 작업 접근": limitStar.ops,
    "제약 상한 사슬 · 저장 칸": limitChain.cells,
  };
}

const 구간 = 표(구간설계);
const 조상사슬 = 표(조상사슬설계);

export const cases = {
  "이 가이드의 절차": () => 구간,
  "조상 사슬을 거슬러 고치는 판": () => 조상사슬,
  경계: () => ({
    "조상 사슬이 앞서는 마지막 사슬 길이": CROSS.lastAhead,
    "이 절차가 앞서는 첫 사슬 길이": CROSS.firstBehind,
  }),
};
