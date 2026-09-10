/**
 * `purpose.alt` 가 인용하는 수치의 출처 — L13.
 *
 * **같은 입력·같은 작업**에 두 설계를 세우고 **결정론적 계수**만 센다. 벽시계·처리량은
 * 실행마다 달라 "본문의 수치가 실측과 일치하는가"(P10)를 정의할 수 없다.
 *
 *   bun run tools/bench-alt.ts src/algorithms/shortest-path/spfa/spfa-guide.alt.ts
 *
 * **두 설계가 매 실행마다 같은 답을 내는지 먼저 확인한다**(`확인()`). 답이 다른 구현으로 잰
 * 계수는 저울질이 아니라 다른 문제의 값이다 — 여기서는 정본(`.ref.ts`)의 `dist` 를 두 설계
 * 모두와 대조한다.
 *
 * **전개 입력을 그대로 쓰지 않은 이유**(L20). 전개 그래프는 정점 여섯 · 간선 여덟이라 한
 * 정점의 나가는 간선을 늘릴 자리가 없고, 그 축이 바로 두 설계의 우열이 갈리는 축이다. 전개
 * 입력의 값도 함께 내고(`전개 입력 · …`), 우열이 뒤집히는 자리를 보이는 데는 아래 `허브`
 * 가족을 쓴다. 그 사실을 본문 대조 문단에도 적는다.
 *
 * **입력은 생성식으로 고정한다.** 사슬 길이 `M = 24` 를 고정하고 잎 수 `P` 하나만 바꾼다.
 * 한 번 정한 입력은 수치가 마음에 안 든다는 이유로 바꾸지 않는다(L20).
 */

import { type Edge, spfa } from "./spfa-guide.ref.ts";

const INF = Number.POSITIVE_INFINITY;

/* ────────────────────────── 고정 입력 ────────────────────────── */

/** 본문 전개가 쓰는 그래프. 정점 여섯 · 방향 간선 여덟. */
export const WALK_N = 6;
export const WALK_EDGES: Edge[] = [
  [0, 1, 6],
  [0, 2, 1],
  [0, 3, 20],
  [1, 3, 4],
  [2, 1, -3],
  [2, 3, 9],
  [3, 4, 2],
  [5, 4, 1],
];

/** 사슬 길이. 잎 수 `P` 하나만 바꾸려고 고정한다. */
export const M = 24;

/**
 * 사슬 `M` 개가 허브 하나로 들어가고 허브에서 잎 `p` 개로 나가는 그래프.
 *
 * 정점 번호는 `0` 이 출발점, `1..M` 이 사슬, `M+1` 이 허브, 그 뒤가 잎이다. 사슬 간선의
 * 가중치는 첫 칸만 100 이고 나머지는 1 이며, 사슬 `i` 에서 허브로 가는 간선의 가중치는
 * `2(M − i)` 라 사슬을 더 깊이 지날수록 허브까지의 값이 1 씩 작아진다. 그래서 허브의 값이
 * 여러 번 줄어들고, 줄어들 때마다 허브가 대기열에 다시 담긴다.
 *
 * **간선 목록에서 사슬은 내림차순으로 적는다.** 목록의 순서는 문제가 주는 것이지 푸는 쪽이
 * 고르는 것이 아니고, 이 순서가 바퀴 방식에 가장 불리한 자리다.
 */
export function hub(p: number): { n: number; edges: Edge[] } {
  const H = M + 1;
  const chain: Edge[] = [[0, 1, 100]];
  for (let i = 1; i < M; i++) chain.push([i, i + 1, 1]);
  chain.reverse();

  const toHub: Edge[] = [];
  for (let i = 1; i <= M; i++) toHub.push([i, H, 2 * (M - i)]);

  const leaves: Edge[] = [];
  for (let j = 0; j < p; j++) leaves.push([H, M + 2 + j, 1]);

  return { n: M + 2 + p, edges: [...chain, ...toHub, ...leaves] };
}

/* ────────────────────────── 두 설계 ────────────────────────── */

export interface Run {
  ops: number;
  cells: number;
  dist: number[];
}

/**
 * 이 가이드의 절차. 정본(`spfa-guide.ref.ts`)과 같고 세는 자리만 덧붙였다.
 *
 * `기본 연산` 은 간선 하나를 읽고 완화를 시도한 한 번과 대기열에 넣거나 꺼낸 한 번을 각각
 * 하나로 센다. `저장 칸` 은 거리 배열 · 대기열에 있는지 표시 · 이웃 목록 셋과 대기열이 가장
 * 길었을 때의 항목 수를 더한 것이다.
 */
function 대기열설계(n: number, edges: Edge[], src: number): Run {
  const adj: [number, number][][] = Array.from({ length: n }, () => []);
  for (const [u, v, w] of edges) (adj[u] as [number, number][]).push([v, w]);

  const dist = Array.from({ length: n }, () => INF);
  dist[src] = 0;
  const inQueue = Array.from({ length: n }, () => false);
  const queue: number[] = [src];
  inQueue[src] = true;
  let head = 0;
  let ops = 1;
  let peak = 1;

  while (head < queue.length) {
    const u = queue[head++] as number;
    inQueue[u] = false;
    ops++;
    peak = Math.max(peak, queue.length - head);

    for (const [v, w] of adj[u] as [number, number][]) {
      ops++;
      const nd = (dist[u] as number) + w;
      if (nd < (dist[v] as number)) {
        dist[v] = nd;
        if (!inQueue[v]) {
          inQueue[v] = true;
          queue.push(v);
          ops++;
        }
      }
    }
  }
  return { ops, cells: 3 * n + peak, dist };
}

/**
 * 경쟁 설계 — **간선 목록 전체를 바퀴로 되풀이해 읽는다.** 대기열이라는 개념이 없고, 한
 * 바퀴가 한 칸도 못 고치면 거기서 끝낸다. 바퀴는 많아야 `V − 1` 번이다.
 *
 * `기본 연산` 은 간선 하나를 읽고 완화를 시도한 한 번을 하나로 센다. `저장 칸` 은 거리 배열
 * `V` 칸에 고쳤는지를 적는 칸 하나를 더한 것이다.
 */
function 바퀴설계(n: number, edges: Edge[], src: number): Run {
  const dist = Array.from({ length: n }, () => INF);
  dist[src] = 0;
  let ops = 0;

  for (let round = 1; round <= Math.max(1, n - 1); round++) {
    let changed = false;
    for (const [u, v, w] of edges) {
      ops++;
      if (dist[u] === INF) continue;
      const nd = (dist[u] as number) + w;
      if (nd < (dist[v] as number)) {
        dist[v] = nd;
        changed = true;
      }
    }
    if (!changed) break;
  }
  return { ops, cells: n + 1, dist };
}

/* ────────────────────────── 대조 ────────────────────────── */

const show = (xs: number[]): string => xs.join(",");

/** 두 설계가 **정본과 같은 답**을 내는지 확인한다. 다르면 대조가 성립하지 않는다. */
function 확인(): void {
  const inputs: [number, Edge[]][] = [
    [WALK_N, WALK_EDGES],
    [hub(1).n, hub(1).edges],
    [hub(98).n, hub(98).edges],
    [hub(4096).n, hub(4096).edges],
    [3, [[0, 1, 10] as Edge, [0, 2, 1] as Edge, [2, 1, 1] as Edge]],
    [4, [[0, 1, 4] as Edge, [0, 2, 5] as Edge, [1, 2, -3] as Edge]],
  ];
  for (const [n, edges] of inputs) {
    const want = show(spfa(n, edges, 0));
    const a = 대기열설계(n, edges, 0);
    const b = 바퀴설계(n, edges, 0);
    if (show(a.dist) !== want) {
      throw new Error(
        `세는 사본이 정본과 다른 답을 낸다 — ${show(a.dist)} vs ${want}`,
      );
    }
    if (show(b.dist) !== want) {
      throw new Error(
        `경쟁 설계가 정본과 다른 답을 낸다 — ${show(b.dist)} vs ${want}`,
      );
    }
  }
}
확인();

/** 잎 수를 늘려 가며 두 계수가 처음 같아지는 자리와 처음 뒤집히는 자리를 찾는다. */
export function crossing(): { tie: number; ahead: number } {
  let tie = -1;
  let ahead = -1;
  for (let p = 1; p <= 400; p++) {
    const { n, edges } = hub(p);
    const a = 대기열설계(n, edges, 0);
    const b = 바퀴설계(n, edges, 0);
    if (tie < 0 && b.ops <= a.ops) tie = p;
    if (b.ops < a.ops) {
      ahead = p;
      break;
    }
  }
  if (tie < 2 || ahead < 2) {
    throw new Error(
      `잎 수를 400 까지 늘려도 순서가 안 뒤집힌다 — 대조가 성립하지 않는다`,
    );
  }
  return { tie, ahead };
}

const CROSS = crossing();

function 재기(
  run: (n: number, e: Edge[], s: number) => Run,
): Record<string, number> {
  const walk = run(WALK_N, WALK_EDGES, 0);
  const one = hub(1);
  const before = hub(CROSS.tie - 1);
  const at = hub(CROSS.tie);
  const after = hub(CROSS.ahead);
  const big = hub(4096);
  return {
    "전개 입력 · 기본 연산": walk.ops,
    "전개 입력 · 저장 칸": walk.cells,
    "잎 1 개 · 기본 연산": run(one.n, one.edges, 0).ops,
    [`잎 ${CROSS.tie - 1} 개 · 기본 연산`]: run(before.n, before.edges, 0).ops,
    [`잎 ${CROSS.tie} 개 · 기본 연산`]: run(at.n, at.edges, 0).ops,
    [`잎 ${CROSS.ahead} 개 · 기본 연산`]: run(after.n, after.edges, 0).ops,
    "잎 4096 개 · 기본 연산": run(big.n, big.edges, 0).ops,
    "잎 4096 개 · 저장 칸": run(big.n, big.edges, 0).cells,
  };
}

export const cases = {
  "이 가이드의 절차": () => 재기(대기열설계),
  "간선 목록을 바퀴로 읽는 설계": () => 재기(바퀴설계),
  경계: () => ({
    "두 계수가 같아지는 잎 수": CROSS.tie,
    "바퀴 설계가 앞서는 첫 잎 수": CROSS.ahead,
  }),
};
