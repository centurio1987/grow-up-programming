/**
 * `purpose.alt` 가 인용하는 수치의 출처 — L13.
 *
 * **같은 입력·같은 잣대**에 두 설계를 걸고 **결정론적 계수**만 센다. 벽시계·처리량은 실행마다
 * 달라 "본문의 수치가 실측과 일치하는가"(P10)를 정의할 수 없다.
 *
 *   bun run tools/bench-alt.ts src/algorithms/shortest-path/aStarSearch/aStarSearch-guide.alt.ts
 *
 * **전개 입력을 그대로 쓰지 않은 이유**(L20). 전개 그래프는 정점 여덟 · 간선 여덟이라 두
 * 설계의 기본 연산이 30 대 17 로 갈리는데, 추정의 정확도를 바꿀 자리가 정점 여덟뿐이라 우열이
 * 뒤집히는 자리를 만들 수 없다. 전개 입력의 값도 함께 내고(`전개 입력 · …`), 뒤집히는 자리를
 * 보이는 데는 아래 `GRID` 를 쓴다. 그 사실을 본문 대조 문단에도 적는다.
 *
 * **입력은 생성식으로 고정한다.** 한 변 `SIDE = 32` 인 격자에서 상하좌우로 오갈 수 있고 모든
 * 간선의 가중치가 1 이다(정점 1,024 · 방향 간선 3,968). 시작은 왼쪽 위, 목표는 오른쪽 아래다.
 * 추정 함수는 **정점의 `p` 퍼센트에만 목표까지의 맨해튼 거리를 주고 나머지에는 0 을 준다** —
 * 어느 정점이 그 `p` 퍼센트인지는 정점 번호를 섞는 고정 해시가 정한다. 가중치가 전부 1 이라
 * 맨해튼 거리는 실제 최소 비용을 넘지 않고, 0 은 언제나 넘지 않으므로 **`p` 가 무엇이든 추정은
 * 허용 가능**하다. 한 번 정한 입력은 수치가 마음에 안 든다는 이유로 바꾸지 않는다(L20).
 *
 * **`p` 가 정보량의 축이다.** 0 이면 추정이 아무것도 안 알려 주고 100 이면 모든 정점에서
 * 맨해튼 거리를 준다. 양방향 다익스트라는 추정을 안 쓰므로 계수가 `p` 와 무관하다.
 */

import { aStarSearch, type Edge } from "./aStarSearch-guide.ref.ts";

/* ────────────────────────── 고정 입력 ────────────────────────── */

/** 본문 전개가 쓰는 그래프. 정점 여덟 · 방향 간선 여덟. */
export const WALK_N = 8;
export const WALK_SRC = 0;
export const WALK_GOAL = 6;
export const WALK_XY: [number, number][] = [
  [0, 0],
  [2, 1],
  [3, 0],
  [5, 0],
  [4, 1],
  [6, 0],
  [8, 0],
  [0, 5],
];
export const WALK_EDGES: Edge[] = [
  [0, 1, 3],
  [0, 2, 4],
  [0, 7, 5],
  [1, 4, 2],
  [2, 3, 7],
  [4, 3, 3],
  [3, 5, 2],
  [5, 6, 6],
];

/** 전개 입력의 추정 — 목표 정점까지의 맨해튼 거리. */
export function walkH(v: number): number {
  const [x, y] = WALK_XY[v] as [number, number];
  const [gx, gy] = WALK_XY[WALK_GOAL] as [number, number];
  return Math.abs(gx - x) + Math.abs(gy - y);
}

/** 격자의 한 변. */
export const SIDE = 32;

export function gridEdges(): Edge[] {
  const at = (r: number, c: number): number => r * SIDE + c;
  const edges: Edge[] = [];
  for (let r = 0; r < SIDE; r++) {
    for (let c = 0; c < SIDE; c++) {
      if (r + 1 < SIDE) {
        edges.push([at(r, c), at(r + 1, c), 1]);
        edges.push([at(r + 1, c), at(r, c), 1]);
      }
      if (c + 1 < SIDE) {
        edges.push([at(r, c), at(r, c + 1), 1]);
        edges.push([at(r, c + 1), at(r, c), 1]);
      }
    }
  }
  return edges;
}

const GRID = gridEdges();
const GRID_N = SIDE * SIDE;
const GRID_GOAL = GRID_N - 1;

/** 목표까지의 맨해튼 거리. 가중치가 전부 1 이라 실제 최소 비용을 넘지 않는다. */
export function manhattan(v: number): number {
  return (
    Math.abs(SIDE - 1 - Math.floor(v / SIDE)) + Math.abs(SIDE - 1 - (v % SIDE))
  );
}

/** 정점 번호를 섞는 고정 해시. 실행마다 같은 값이 나온다. */
function scatter(v: number): number {
  let x = (v * 2654435761) >>> 0;
  x ^= x >>> 15;
  x = (x * 2246822519) >>> 0;
  x ^= x >>> 13;
  return x >>> 0;
}

/** 정점의 `p` 퍼센트에만 맨해튼 거리를 주고 나머지에는 0 을 주는 추정. */
export function patchy(p: number): (v: number) => number {
  return (v: number) => (scatter(v) % 100 < p ? manhattan(v) : 0);
}

/* ────────────────────────── 잣대 ────────────────────────── */

interface Count {
  answer: number;
  ops: number;
  cells: number;
}

/**
 * 키가 가장 작은 항목을 먼저 내주는 이진 힙. **견준 횟수를 센다.**
 *
 * 두 설계가 같은 힙을 쓴다 — 자료구조가 다르면 계수가 자료구조의 차이를 재게 된다.
 */
class CountingHeap {
  items: [number, number, number][] = [];
  compares = 0;
  peak = 0;

  get size(): number {
    return this.items.length;
  }

  top(): number {
    return (this.items[0] as [number, number, number])[2];
  }

  push(node: number, cost: number, key: number): void {
    this.items.push([node, cost, key]);
    this.peak = Math.max(this.peak, this.items.length);
    let i = this.items.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      this.compares++;
      if (this.key(i) >= this.key(parent)) break;
      this.swap(i, parent);
      i = parent;
    }
  }

  pop(): [number, number, number] {
    const top = this.items[0] as [number, number, number];
    const last = this.items.pop() as [number, number, number];
    if (this.items.length > 0) {
      this.items[0] = last;
      let i = 0;
      for (;;) {
        const left = 2 * i + 1;
        const right = 2 * i + 2;
        let small = i;
        if (left < this.items.length) {
          this.compares++;
          if (this.key(left) < this.key(small)) small = left;
        }
        if (right < this.items.length) {
          this.compares++;
          if (this.key(right) < this.key(small)) small = right;
        }
        if (small === i) break;
        this.swap(i, small);
        i = small;
      }
    }
    return top;
  }

  private key(i: number): number {
    return (this.items[i] as [number, number, number])[2];
  }

  private swap(a: number, b: number): void {
    const t = this.items[a] as [number, number, number];
    this.items[a] = this.items[b] as [number, number, number];
    this.items[b] = t;
  }
}

function adjacency(n: number, edges: Edge[]): [number, number][][] {
  const adj: [number, number][][] = Array.from({ length: n }, () => []);
  for (const [u, v, w] of edges) (adj[u] as [number, number][]).push([v, w]);
  return adj;
}

/**
 * 이 가이드의 절차. 정본(`aStarSearch-guide.ref.ts`)과 같고 세는 자리만 덧붙였다.
 *
 * `기본 연산` 은 힙에서 키를 한 번 견준 것 · 간선 하나를 완화해 본 것 · 추정 함수를 한 번
 * 부른 것을 각각 하나로 센다. `저장 칸` 은 비용 배열 `V` 칸과 힙이 가장 커졌을 때의 항목
 * 수를 더한 것이다.
 */
function 이가이드의절차(
  n: number,
  edges: Edge[],
  src: number,
  goal: number,
  h: (v: number) => number,
): Count {
  const adj = adjacency(n, edges);
  const g = Array.from({ length: n }, () => Number.POSITIVE_INFINITY);
  g[src] = 0;
  const open = new CountingHeap();
  let ops = 1;
  open.push(src, 0, h(src));

  while (open.size > 0) {
    const [u, gu] = open.pop();
    if (u === goal)
      return { answer: gu, ops: ops + open.compares, cells: n + open.peak };
    if (gu > (g[u] as number)) continue;
    for (const [v, w] of adj[u] as [number, number][]) {
      ops++;
      const ng = gu + w;
      if (ng < (g[v] as number)) {
        g[v] = ng;
        ops++;
        open.push(v, ng, ng + h(v));
      }
    }
  }
  return {
    answer: Number.POSITIVE_INFINITY,
    ops: ops + open.compares,
    cells: n + open.peak,
  };
}

/**
 * 경쟁 설계 — **양방향 다익스트라**. 시작에서 앞으로, 목표에서 뒤로 두 탐색을 함께 밀고,
 * 두 탐색이 만난 자리의 합을 답 후보 `mu` 로 들고 있다가 **두 앞머리 키의 합이 `mu` 이상이
 * 되면** 멈춘다. 추정 함수를 한 번도 안 부르고, 대신 **역방향 이웃 목록**이 필요하다.
 *
 * 잣대는 위와 같다 — 힙 견주기 한 번 · 간선 완화 한 번을 각각 하나로 센다. 추정 호출은 0 이다.
 * `저장 칸` 은 비용 배열 둘(`2V`)과 두 힙의 최대 항목 수를 더한 것이다.
 */
function 양방향다익스트라(
  n: number,
  edges: Edge[],
  src: number,
  goal: number,
): Count {
  const adj = adjacency(n, edges);
  const rev: [number, number][][] = Array.from({ length: n }, () => []);
  for (const [u, v, w] of edges) (rev[v] as [number, number][]).push([u, w]);

  const df = Array.from({ length: n }, () => Number.POSITIVE_INFINITY);
  const db = Array.from({ length: n }, () => Number.POSITIVE_INFINITY);
  df[src] = 0;
  db[goal] = 0;
  const front = new CountingHeap();
  const back = new CountingHeap();
  front.push(src, 0, 0);
  back.push(goal, 0, 0);
  let mu = src === goal ? 0 : Number.POSITIVE_INFINITY;
  let ops = 0;

  while (front.size > 0 && back.size > 0) {
    if (front.top() + back.top() >= mu) break;
    const forward = front.top() <= back.top();
    const heap = forward ? front : back;
    const near = forward ? df : db;
    const far = forward ? db : df;
    const out = forward ? adj : rev;
    const [u, du] = heap.pop();
    if (du > (near[u] as number)) continue;
    for (const [v, w] of out[u] as [number, number][]) {
      ops++;
      const nd = du + w;
      if (nd < (near[v] as number)) {
        near[v] = nd;
        heap.push(v, nd, nd);
      }
      const meet = nd + (far[v] as number);
      if (meet < mu) mu = meet;
    }
  }
  return {
    answer: mu,
    ops: ops + front.compares + back.compares,
    cells: 2 * n + front.peak + back.peak,
  };
}

/* ────────────────────────── 계수 ────────────────────────── */

/**
 * 두 설계가 **정본과 같은 답**을 내는지 매번 확인한다.
 *
 * 답이 다른 구현으로 잰 계수는 저울질이 아니라 다른 문제의 값이다(2026-09-03 `digitDp` 실측이
 * 세운 규칙). 그래서 계수를 낼 때마다 정본을 함께 돌려 견준다.
 */
function measure(
  run: (
    n: number,
    e: Edge[],
    s: number,
    t: number,
    h: (v: number) => number,
  ) => Count,
  n: number,
  edges: Edge[],
  src: number,
  goal: number,
  h: (v: number) => number,
): Count {
  const got = run(n, edges, src, goal, h);
  const want = aStarSearch(n, edges, src, goal, h);
  if (got.answer !== want) {
    throw new Error(`정본과 다른 답을 냈다 — ${got.answer} vs ${want}`);
  }
  return got;
}

const 양방향 = (
  n: number,
  edges: Edge[],
  src: number,
  goal: number,
  _h: (v: number) => number,
): Count => 양방향다익스트라(n, edges, src, goal);

/** 양방향이 **마지막으로 앞선** 비율을 찾는다. */
export function lastAhead(): number {
  const rival = measure(양방향, GRID_N, GRID, 0, GRID_GOAL, patchy(100));
  let last = -1;
  for (let p = 0; p <= 100; p++) {
    const mine = measure(이가이드의절차, GRID_N, GRID, 0, GRID_GOAL, patchy(p));
    if (mine.ops >= rival.ops) last = p;
  }
  return last;
}

/**
 * **「뒤집히는 첫 자리」가 아니라 「마지막으로 앞선 자리」를 낸다.** 이 절차의 계수는 `p` 에
 * 대해 단조롭지 않다 — 추정을 일부 정점에만 주면 일관성이 깨져 재확장이 붙고, 그 때문에
 * 중간 구간이 오르내린다. 단조롭지 않은 계수에서 「첫 자리」는 요동에 흔들린다
 * (2026-09-03 `isPrimeTrial` 이 세운 관례).
 */
const LAST = lastAhead();
if (LAST < 1 || LAST >= 100) {
  throw new Error(
    `비율을 0~100 으로 훑어도 순서가 안 뒤집힌다 — 대조가 성립하지 않는다`,
  );
}

/** 최악 비율 — 이 절차의 기본 연산이 가장 커지는 자리. */
export function worstRatio(): number {
  let worst = -1;
  let at = -1;
  for (let p = 0; p <= 100; p++) {
    const mine = measure(이가이드의절차, GRID_N, GRID, 0, GRID_GOAL, patchy(p));
    if (mine.ops > worst) {
      worst = mine.ops;
      at = p;
    }
  }
  return at;
}

const WORST = worstRatio();

function 재기(
  run: (
    n: number,
    e: Edge[],
    s: number,
    t: number,
    h: (v: number) => number,
  ) => Count,
): Record<string, number> {
  const walk = measure(run, WALK_N, WALK_EDGES, WALK_SRC, WALK_GOAL, walkH);
  const zero = measure(run, GRID_N, GRID, 0, GRID_GOAL, patchy(0));
  const worst = measure(run, GRID_N, GRID, 0, GRID_GOAL, patchy(WORST));
  const before = measure(run, GRID_N, GRID, 0, GRID_GOAL, patchy(LAST));
  const after = measure(run, GRID_N, GRID, 0, GRID_GOAL, patchy(LAST + 1));
  const full = measure(run, GRID_N, GRID, 0, GRID_GOAL, patchy(100));
  return {
    "전개 입력 · 기본 연산": walk.ops,
    "전개 입력 · 저장 칸": walk.cells,
    "격자 · 추정 0% · 기본 연산": zero.ops,
    [`격자 · 추정 ${WORST}% · 기본 연산`]: worst.ops,
    [`격자 · 추정 ${LAST}% · 기본 연산`]: before.ops,
    [`격자 · 추정 ${LAST + 1}% · 기본 연산`]: after.ops,
    "격자 · 추정 100% · 기본 연산": full.ops,
    "격자 · 추정 100% · 저장 칸": full.cells,
  };
}

export const cases = {
  "이 가이드의 절차": () => 재기(이가이드의절차),
  "양방향 다익스트라": () => 재기(양방향),
  경계: () => ({
    "양방향이 마지막으로 앞선 비율": LAST,
    "이 절차의 기본 연산이 가장 큰 비율": WORST,
  }),
};
