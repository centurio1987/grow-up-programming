/**
 * `purpose.alt` 가 인용하는 수치의 출처 — L13.
 *
 * **같은 입력**에 두 설계를 걸고 **결정론적 계수**만 센다. 벽시계·처리량은 실행마다 달라
 * "본문의 수치가 실측과 일치하는가"(P10)를 정의할 수 없다.
 *
 *   bun run tools/bench-alt.ts src/algorithms/graph/dfsAllPaths/dfsAllPaths-guide.alt.ts
 *
 * **전개 입력도 함께 잰다**(L20). 다만 그 그래프는 정점 여섯이라 두 설계의 계수가 9 대 7 로
 * 두 개밖에 안 갈린다 — 그 차이가 설계의 성질에서 온 것인지 그래프가 작아서 그런 것인지
 * 구분되지 않는다. 그래서 우열이 뒤집히는 자리를 보이는 데는 아래 두 그래프를 더 쓰고,
 * 그 사실을 본문 대조 문단에도 적는다.
 *
 * **두 그래프는 간선 수를 맞춰 골랐다** — 격자 60 개, 덫 58 개. 계수 차이가 그래프 크기에서
 * 온 것이 아님이 그 자리에서 확인된다. 한 번 정한 입력은 수치가 마음에 안 든다는 이유로
 * 바꾸지 않는다(L20).
 */

type Edge = [number, number];

/* ────────────────────────── 고정 입력 ────────────────────────── */

/** 본문 전개가 쓰는 그래프. 정점 여섯 · 간선 여덟(자기 루프 하나 포함). */
export const WALK_N = 6;
export const WALK_EDGES: Edge[] = [
  [0, 2],
  [0, 1],
  [1, 2],
  [1, 4],
  [2, 0],
  [2, 4],
  [2, 5],
  [5, 5],
];
export const WALK_SOURCE = 0;
export const WALK_TARGET = 4;

/** 격자 한 변의 칸 수. `(M+1)²` 개 정점이 오른쪽·아래로만 이어진다. */
export const M = 5;

/** 덫 그래프의 막다른 무리 크기. 정점 `K+2` 개 · 간선 `K(K−1)+2` 개다. */
export const K = 8;

/**
 * 오른쪽·아래로만 가는 격자 DAG. **막다른 정점이 하나도 없다** — 어느 정점에서 출발해도
 * 오른쪽·아래로 계속 가면 오른쪽 아래 끝에 도달한다.
 */
export function grid(m: number): { n: number; edges: Edge[]; t: number } {
  const id = (r: number, c: number): number => r * (m + 1) + c;
  const edges: Edge[] = [];
  for (let r = 0; r <= m; r++) {
    for (let c = 0; c <= m; c++) {
      if (c < m) edges.push([id(r, c), id(r, c + 1)]);
      if (r < m) edges.push([id(r, c), id(r + 1, c)]);
    }
  }
  return { n: (m + 1) * (m + 1), edges, t: id(m, m) };
}

/**
 * 덫 그래프. 정점 0 에서 두 갈래가 갈리는데 한쪽은 도착 정점으로 바로 가고, 다른 한쪽은
 * 정점 `1 … k` 가 서로 전부 이어진 무리로 들어간다. 그 무리에서 도착 정점으로 가는 간선은
 * 하나도 없어서 **경로는 하나뿐인데 그 안을 지나는 단순 경로는 계승만큼** 많다.
 */
export function trap(k: number): { n: number; edges: Edge[]; t: number } {
  const t = k + 1;
  const edges: Edge[] = [
    [0, 1],
    [0, t],
  ];
  for (let a = 1; a <= k; a++) {
    for (let b = 1; b <= k; b++) {
      if (a !== b) edges.push([a, b]);
    }
  }
  return { n: k + 2, edges, t };
}

/* ────────────────────────── 두 설계 ────────────────────────── */

function adjacency(n: number, edges: Edge[]): number[][] {
  const sets: Set<number>[] = Array.from(
    { length: n },
    () => new Set<number>(),
  );
  for (const [u, v] of edges) {
    if (u === v) continue;
    (sets[u] as Set<number>).add(v);
  }
  return sets.map((s) => [...s].sort((a, b) => a - b));
}

interface Counts {
  진입: number;
  이웃검사: number;
  새칸: number;
  경로: number;
}

/**
 * 이 가이드의 절차. 정본(`dfsAllPaths-guide.ref.ts`)과 같고 세는 자리만 덧붙였다.
 *
 * `이웃검사` 는 이웃 목록에서 원소를 하나 읽은 횟수다. 새로 잡는 칸은 없다 — 상태 배열
 * 셋을 처음에 한 번 만들고 그것만 고쳐 쓴다.
 */
function 가이드절차(n: number, edges: Edge[], s: number, t: number): Counts {
  const adj = adjacency(n, edges);
  const onPath: boolean[] = Array.from({ length: n }, () => false);
  const path: number[] = [];
  const result: number[][] = [];
  let 진입 = 0;
  let 이웃검사 = 0;

  const walk = (u: number): void => {
    진입++;
    onPath[u] = true;
    path.push(u);
    if (u === t) {
      result.push(path.slice());
    } else {
      for (const v of adj[u] as number[]) {
        이웃검사++;
        if (onPath[v] === true) continue;
        walk(v);
      }
    }
    onPath[u] = false;
    path.pop();
  };

  walk(s);
  return { 진입, 이웃검사, 새칸: 0, 경로: result.length };
}

/**
 * 경쟁 설계 — **도달 가능성 가지치기**.
 *
 * 재귀 한 겹에 들어갈 때마다, 지금 경로 위의 정점을 뺀 그래프에서 도착 정점에 도달할 수 있는
 * 정점을 역방향 간선으로 전부 표시한다. 표시되지 않은 이웃으로는 아예 내려가지 않으므로
 * **진입한 노드가 전부 경로 하나 이상을 만든다.** 대신 노드마다 역방향 탐색 한 번과 표시
 * 배열 한 벌이 든다 — 그 배열이 재귀 한 단마다 새로 잡히는 `새칸` 이다.
 */
function 도달가능성가지치기(
  n: number,
  edges: Edge[],
  s: number,
  t: number,
): Counts {
  const adj = adjacency(n, edges);
  const rev: number[][] = Array.from({ length: n }, () => []);
  for (let u = 0; u < n; u++) {
    for (const v of adj[u] as number[]) (rev[v] as number[]).push(u);
  }
  const onPath: boolean[] = Array.from({ length: n }, () => false);
  const path: number[] = [];
  const result: number[][] = [];
  let 진입 = 0;
  let 이웃검사 = 0;
  let 새칸 = 0;

  const walk = (u: number): void => {
    진입++;
    onPath[u] = true;
    path.push(u);
    if (u === t) {
      result.push(path.slice());
    } else {
      // 지금 경로 위의 정점을 뺀 그래프에서 도착 정점에 도달할 수 있는 정점을 표시한다.
      const canReach = new Uint8Array(n);
      새칸 += n;
      canReach[t] = 1;
      const stack: number[] = [t];
      while (stack.length > 0) {
        const w = stack.pop() as number;
        for (const p of rev[w] as number[]) {
          이웃검사++;
          if (onPath[p] === true || canReach[p] === 1) continue;
          canReach[p] = 1;
          stack.push(p);
        }
      }
      for (const v of adj[u] as number[]) {
        이웃검사++;
        if (onPath[v] === true || canReach[v] === 0) continue;
        walk(v);
      }
    }
    onPath[u] = false;
    path.pop();
  };

  walk(s);
  return { 진입, 이웃검사, 새칸, 경로: result.length };
}

/* ────────────────────────── 계수 ────────────────────────── */

const GRID = grid(M);
const TRAP = trap(K);

function 재기(
  run: (n: number, e: Edge[], s: number, t: number) => Counts,
): Record<string, number> {
  const w = run(WALK_N, WALK_EDGES, WALK_SOURCE, WALK_TARGET);
  const g = run(GRID.n, GRID.edges, 0, GRID.t);
  const p = run(TRAP.n, TRAP.edges, 0, TRAP.t);
  // 두 설계가 **같은 답**을 내는지부터 확인한다. 다르면 대조가 성립하지 않는다.
  if (w.경로 !== 3 || g.경로 !== 252 || p.경로 !== 1) {
    throw new Error(
      `경로 수가 어긋난다 — 전개 ${w.경로} · 격자 ${g.경로} · 덫 ${p.경로}`,
    );
  }
  return {
    "전개 입력 · 진입한 노드": w.진입,
    "격자 · 진입한 노드": g.진입,
    "격자 · 이웃 검사": g.이웃검사,
    "덫 · 진입한 노드": p.진입,
    "덫 · 이웃 검사": p.이웃검사,
    "격자 · 새로 잡는 칸": g.새칸,
  };
}

export const cases = {
  "이 가이드의 절차": () => 재기(가이드절차),
  "도달 가능성 가지치기": () => 재기(도달가능성가지치기),
};
