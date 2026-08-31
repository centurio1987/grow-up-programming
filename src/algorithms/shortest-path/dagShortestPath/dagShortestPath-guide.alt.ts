/**
 * `purpose.alt` 가 인용하는 수치의 출처 — L13.
 *
 * **같은 그래프·같은 작업**에 두 설계를 걸고 **결정론적 계수**만 센다. 벽시계·처리량은
 * 실행마다 달라 "본문의 수치가 실측과 일치하는가"(P10)를 정의할 수 없다.
 *
 *   bun run tools/bench-alt.ts src/algorithms/shortest-path/dagShortestPath/dagShortestPath-guide.alt.ts
 *
 * **전개 입력도 함께 낸다**(`전개 입력 · …`). 다만 우열이 뒤집히는 자리를 보이는 데는 아래
 * `CHAIN` 을 쓴다 — 전개 그래프는 정점 여섯 · 간선 일곱이라 간선 목록을 몇 조각으로 가르든
 * 라운드 수가 두셋을 못 넘어서, 경계가 될 조각 수를 만들 수 없다. 그 사실을 본문 대조
 * 문단에도 적는다(L20).
 *
 * **입력은 생성식으로 고정한다.** 정점 `V = 1,000` 이고 간선은 두 벌이다 — `i → i+1` 의
 * 가중치가 `(i mod 7) + 1` 이고, `i → i+3` 의 가중치가 `((i * 5) mod 11) − 5` 다(음수가
 * 섞인다). 간선은 999 + 997 = 1,996 개다. 한 번 정한 입력은 수치가 마음에 안 든다는 이유로
 * 바꾸지 않는다(L20).
 *
 * **갈리는 축은 간선 목록의 순서다.** 같은 그래프의 같은 간선을 `b` 조각으로 가르고 **뒤
 * 조각부터** 적으면, 벨만-포드가 값을 확정하는 데 필요한 라운드 수가 `b` 에 따라 늘어난다.
 * 이 가이드의 절차는 그 순서를 읽지 않으므로 계수가 `b` 와 무관하다.
 */

import type { Edge } from "./dagShortestPath-guide.ref.ts";

/* ────────────────────────── 고정 입력 ────────────────────────── */

/** 본문 전개가 쓰는 그래프. 정점 여섯 · 방향 간선 일곱. */
export const WALK_N = 6;
export const WALK_EDGES: Edge[] = [
  [2, 3, 2],
  [0, 1, 3],
  [1, 2, -4],
  [0, 2, 5],
  [1, 3, 6],
  [4, 0, 2],
  [0, 3, 7],
];

export const V = 1_000;

/** 정점 `i` 에서 나가는 간선 목록. 위상 순서는 정점 번호 순서와 같다. */
function outgoing(i: number): Edge[] {
  const out: Edge[] = [];
  if (i + 1 < V) out.push([i, i + 1, (i % 7) + 1]);
  if (i + 3 < V) out.push([i, i + 3, ((i * 5) % 11) - 5]);
  return out;
}

/**
 * 같은 간선을 `b` 조각으로 갈라 **뒤 조각부터** 적은 목록. `b = 1` 이면 위상 순서 그대로다.
 * 조각 안에서는 정점 번호 오름차순을 지킨다.
 */
export function edgesInBlocks(b: number): Edge[] {
  const size = Math.ceil(V / b);
  const out: Edge[] = [];
  for (let block = b - 1; block >= 0; block--) {
    for (let i = block * size; i < Math.min(V, (block + 1) * size); i++) {
      out.push(...outgoing(i));
    }
  }
  return out;
}

const EDGE_COUNT = edgesInBlocks(1).length;

/* ────────────────────────── 두 설계 ────────────────────────── */

interface Count {
  /** 간선 하나를 처리한 횟수와 정점 하나를 읽은 횟수의 합. */
  ops: number;
  /** 절차가 새로 잡는 칸 수 — 거리 배열 밖의 보조 자료까지 센다. */
  cells: number;
  /** 답이 같은지 대조하려고 문자열로 굳힌 것. */
  answer: string;
}

const show = (dist: number[]): string =>
  dist.map((d) => (d === Number.POSITIVE_INFINITY ? "inf" : String(d))).join();

/**
 * 이 가이드의 절차. 정본(`dagShortestPath-guide.ref.ts`)과 같고 세는 자리만 덧붙였다.
 *
 * `ops` 는 간선 하나를 읽은 한 번과 정점 하나를 읽은 한 번을 각각 하나로 센다.
 * `cells` 는 이웃 목록 · 남은 선행 정점 수 · 줄 · 거리 배열의 칸을 더한 것이다.
 */
function 이가이드의절차(n: number, edges: Edge[], src: number): Count {
  let ops = 0;
  const adj: [number, number][][] = Array.from({ length: n }, () => []);
  const remaining: number[] = Array.from({ length: n }, () => 0);
  for (const [u, v, w] of edges) {
    ops++;
    (adj[u] as [number, number][]).push([v, w]);
    remaining[v] = (remaining[v] as number) + 1;
  }

  const order: number[] = [];
  for (let v = 0; v < n; v++) {
    ops++;
    if (remaining[v] === 0) order.push(v);
  }
  for (let i = 0; i < order.length; i++) {
    ops++;
    const u = order[i] as number;
    for (const [v] of adj[u] as [number, number][]) {
      ops++;
      remaining[v] = (remaining[v] as number) - 1;
      if (remaining[v] === 0) order.push(v);
    }
  }

  const dist: number[] = Array.from(
    { length: n },
    () => Number.POSITIVE_INFINITY,
  );
  dist[src] = 0;
  for (const u of order) {
    ops++;
    if (dist[u] === Number.POSITIVE_INFINITY) continue;
    for (const [v, w] of adj[u] as [number, number][]) {
      ops++;
      const nd = (dist[u] as number) + w;
      if (nd < (dist[v] as number)) dist[v] = nd;
    }
  }

  return {
    ops,
    cells: 3 * n + edges.length,
    answer: show(dist),
  };
}

/**
 * 벨만-포드 — 간선 목록 전체를 **고칠 것이 없을 때까지** 라운드마다 다시 읽는다.
 *
 * 한 라운드가 아무것도 못 고치면 멈추는 판이다(고정 `V−1` 라운드가 아니다). 사이클이 있는
 * 그래프에도 그대로 쓰이고 음수 사이클까지 판정하는 절차라, 이 문제만 놓고 열등한 상대를
 * 세운 것이 아니다.
 */
function 벨만포드(n: number, edges: Edge[], src: number): Count {
  let ops = 0;
  const dist: number[] = Array.from(
    { length: n },
    () => Number.POSITIVE_INFINITY,
  );
  ops += n;
  dist[src] = 0;

  for (let round = 0; round < n; round++) {
    let changed = false;
    for (const [u, v, w] of edges) {
      ops++;
      if (dist[u] === Number.POSITIVE_INFINITY) continue;
      const nd = (dist[u] as number) + w;
      if (nd < (dist[v] as number)) {
        dist[v] = nd;
        changed = true;
      }
    }
    if (!changed) break;
  }

  return { ops, cells: n, answer: show(dist) };
}

/** 라운드를 몇 번 돌았는지 — 경계가 왜 그 자리인지의 근거다. */
export function rounds(n: number, edges: Edge[], src: number): number {
  const dist: number[] = Array.from(
    { length: n },
    () => Number.POSITIVE_INFINITY,
  );
  dist[src] = 0;
  let used = 0;
  for (let round = 0; round < n; round++) {
    used++;
    let changed = false;
    for (const [u, v, w] of edges) {
      if (dist[u] === Number.POSITIVE_INFINITY) continue;
      const nd = (dist[u] as number) + w;
      if (nd < (dist[v] as number)) {
        dist[v] = nd;
        changed = true;
      }
    }
    if (!changed) break;
  }
  return used;
}

/* ────────────────────────── 대조 ────────────────────────── */

/** 두 설계가 같은 답을 내는지 확인한다. 다르면 대조 자체가 성립하지 않는다. */
function 확인(): void {
  const inputs: [number, Edge[], number][] = [
    [WALK_N, WALK_EDGES, 0],
    [V, edgesInBlocks(1), 0],
    [V, edgesInBlocks(4), 0],
    [V, edgesInBlocks(V), 0],
  ];
  for (const [n, edges, src] of inputs) {
    const a = 이가이드의절차(n, edges, src);
    const b = 벨만포드(n, edges, src);
    if (a.answer !== b.answer) {
      throw new Error(`두 설계의 답이 다르다 — ${a.answer} vs ${b.answer}`);
    }
  }
}
확인();

/** 조각 수를 늘려 가며 순서가 처음 뒤집히는 자리를 찾는다. */
export function flipPoint(): number {
  for (let b = 1; b <= V; b++) {
    const a = 이가이드의절차(V, edgesInBlocks(b), 0);
    const c = 벨만포드(V, edgesInBlocks(b), 0);
    if (c.ops > a.ops) return b;
  }
  return -1;
}

const FLIP = flipPoint();
if (FLIP < 2) {
  throw new Error(
    `조각 수를 ${V} 까지 늘려도 순서가 안 뒤집힌다 — 대조가 성립하지 않는다`,
  );
}

function 재기(run: (n: number, e: Edge[], s: number) => Count) {
  const walk = run(WALK_N, WALK_EDGES, 0);
  const one = run(V, edgesInBlocks(1), 0);
  const before = run(V, edgesInBlocks(FLIP - 1), 0);
  const at = run(V, edgesInBlocks(FLIP), 0);
  const full = run(V, edgesInBlocks(V), 0);
  return {
    "전개 입력 · 기본 연산": walk.ops,
    "조각 1 · 기본 연산": one.ops,
    [`조각 ${FLIP - 1} · 기본 연산`]: before.ops,
    [`조각 ${FLIP} · 기본 연산`]: at.ops,
    [`조각 ${V} · 기본 연산`]: full.ops,
    "저장 칸": full.cells,
  };
}

export const cases = {
  "이 가이드의 절차": () => 재기(이가이드의절차),
  "벨만-포드": () => 재기(벨만포드),
  경계: () => ({
    "순서가 뒤집히는 조각 수": FLIP,
    간선: EDGE_COUNT,
    [`조각 ${FLIP - 1} 의 라운드`]: rounds(V, edgesInBlocks(FLIP - 1), 0),
    [`조각 ${FLIP} 의 라운드`]: rounds(V, edgesInBlocks(FLIP), 0),
  }),
};
