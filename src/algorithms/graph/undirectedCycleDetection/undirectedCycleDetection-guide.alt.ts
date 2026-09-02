/**
 * `purpose.alt`(경쟁 설계와의 대조)의 실측 하네스 — L13.
 *
 * 대조하는 둘은 **같은 답을 내는 서로 다른 절차**다.
 *
 * - **이웃 목록 탐색** — 이 가이드가 가르치는 절차. `.ref.ts` 와 같은 순서로 같은 일을 하고,
 *   읽고 쓴 배열 칸만 덧붙여 센다. 정본은 계수를 내보내지 않으므로 세는 사본이 필요하다.
 * - **서로소 집합** — 이웃 목록을 만들지 않고 간선을 하나씩 받아 두 끝의 뿌리를 견주는
 *   절차다. 뿌리가 같으면 이미 이어져 있다는 뜻이라 그 간선이 사이클을 닫는다.
 *   `src/data-structures/disjoint-set/unionFind` 가 그 자료구조를 다룬다.
 *
 * **계수는 배열 칸 접근 수와 새로 잡는 칸 수 둘이다.** 칸을 한 번 읽으면 1, 한 번 쓰면 1로
 * 세고 두 절차에 같은 규칙을 쓴다. 둘 다 같은 입력에서 항상 같은 값이 나온다 — 벽시계는
 * 쓰지 않는다.
 *
 * **전개(정점 여섯)가 쓰는 입력을 첫 계수로 함께 잰다.** 다만 그 입력에는 간선이 다섯뿐이라
 * 「사이클을 닫는 간선이 목록의 몇 번째에 있는가」를 바꿔 볼 자리가 없다. 그래서 제약 상한인
 * 정점 100,000 을 쓰는 생성식 셋을 여기에 **상수로 두어** 독자가 같은 수를 다시 얻을 수 있게
 * 했다. 규모가 다른 사유는 본문 대조 문단에도 적었다.
 *
 *   bun run tools/bench-alt.ts src/algorithms/graph/undirectedCycleDetection/undirectedCycleDetection-guide.alt.ts
 */

type Edge = [number, number];

/** 제약 상한. 큰 입력 넷이 모두 이 정점 수를 쓴다. */
const V = 100_000;

interface Counted {
  cells: number;
  allocated: number;
  answer: boolean;
}

/** 이웃 목록 탐색 — `.ref.ts` 와 같은 절차에 계수만 덧붙였다. */
function search(n: number, edges: Edge[]): Counted {
  let cells = 0;
  let allocated = 0;
  const nbr: number[][] = Array.from({ length: n }, () => []);
  cells += n;
  allocated += n;
  for (const [u, v] of edges) {
    // nbr[u] 읽기 · push · nbr[v] 읽기 · push
    cells += 4;
    allocated += 2;
    (nbr[u] as number[]).push(v);
    (nbr[v] as number[]).push(u);
  }
  const visited: boolean[] = Array.from({ length: n }, () => false);
  cells += n;
  allocated += n;
  const stack: number[] = [];
  const from: number[] = [];
  let peak = 0;

  for (let s = 0; s < n; s++) {
    cells++;
    if (visited[s]) continue;
    cells += 3;
    visited[s] = true;
    stack.push(s);
    from.push(-1);
    while (stack.length > 0) {
      if (stack.length > peak) peak = stack.length;
      cells += 3;
      const u = stack.pop() as number;
      const parent = from.pop() as number;
      for (const v of nbr[u] as number[]) {
        cells++;
        if (v === parent) continue;
        cells++;
        if (visited[v]) {
          return { cells, allocated: allocated + 2 * peak, answer: true };
        }
        cells += 3;
        visited[v] = true;
        stack.push(v);
        from.push(u);
      }
    }
  }
  return { cells, allocated: allocated + 2 * peak, answer: false };
}

/** 서로소 집합 — 간선을 하나씩 받아 두 끝의 뿌리를 견준다. 뿌리가 같으면 사이클이다. */
function disjointSet(n: number, edges: Edge[]): Counted {
  let cells = 0;
  let allocated = 0;
  const parent: number[] = Array.from({ length: n }, (_, i) => i);
  cells += n;
  allocated += n;
  const size: number[] = Array.from({ length: n }, () => 1);
  cells += n;
  allocated += n;

  const find = (x: number): number => {
    cells++;
    while (parent[x] !== x) {
      // parent[x] 읽기 · parent[그 값] 읽기 · parent[x] 쓰기
      cells += 3;
      const grand = parent[parent[x] as number] as number;
      parent[x] = grand;
      x = grand;
      // 다음 바퀴의 조건이 읽는 칸
      cells++;
    }
    return x;
  };

  for (const [u, v] of edges) {
    const a = find(u);
    const b = find(v);
    if (a === b) return { cells, allocated, answer: true };
    // size[a] · size[b] 읽기
    cells += 2;
    // 뿌리 쓰기 · size 읽기 둘 · size 쓰기
    cells += 4;
    if ((size[a] as number) < (size[b] as number)) {
      parent[a] = b;
      size[b] = (size[b] as number) + (size[a] as number);
    } else {
      parent[b] = a;
      size[a] = (size[a] as number) + (size[b] as number);
    }
  }
  return { cells, allocated, answer: false };
}

/** 전개(`deep.walk`)가 쓰는 입력 그대로. 두 절차를 같은 자리에서 한 번 재 둔다. */
const WALK_N = 6;
const WALK_EDGES: Edge[] = [
  [0, 1],
  [1, 2],
  [3, 4],
  [4, 5],
  [5, 3],
];

/** `0-1-…-(v-1)` 한 줄. 간선 99,999 개이고 사이클이 없다. */
function chain(v: number): Edge[] {
  const out: Edge[] = [];
  for (let i = 0; i + 1 < v; i++) out.push([i, i + 1]);
  return out;
}

/**
 * 정점 0·1·2 를 삼각형으로 잇고 나머지 정점 3…(v-1) 을 한 줄로 이은 그래프.
 * **삼각형 간선 셋을 목록의 `p` 번째 자리에 끼운다** — 사이클을 닫는 간선이 목록의 어디에
 * 있는가만 바뀌고 그래프 자체는 그대로다. 간선은 어느 `p` 에서도 99,999 개다.
 */
function triangleAt(v: number, p: number): Edge[] {
  const rest: Edge[] = [];
  for (let i = 3; i + 1 < v; i++) rest.push([i, i + 1]);
  const triangle: Edge[] = [
    [0, 1],
    [1, 2],
    [2, 0],
  ];
  return [...rest.slice(0, p), ...triangle, ...rest.slice(p)];
}

/**
 * 삼각형을 **정점 번호 맨 뒤**(v-3 · v-2 · v-1)에 두고 그 간선 셋을 목록 맨 앞에 둔 것.
 * 탐색은 정점 0 부터 시작하므로 삼각형에 닿기까지 사슬 전체를 지나간다.
 */
function triangleAtFarEnd(v: number): Edge[] {
  const rest: Edge[] = [];
  for (let i = 0; i + 1 < v - 3; i++) rest.push([i, i + 1]);
  const triangle: Edge[] = [
    [v - 3, v - 2],
    [v - 2, v - 1],
    [v - 1, v - 3],
  ];
  return [...triangle, ...rest];
}

const NO_CYCLE = chain(V);
const CYCLE_FIRST = triangleAt(V, 0);
const CYCLE_LAST = triangleAt(V, 99_996);
const CYCLE_FAR = triangleAtFarEnd(V);

/**
 * 두 계수는 `p` 에 대해 각각 기울기 0 과 12 인 직선이라 뒤집히는 자리가 하나뿐이다. 이분으로
 * 좁힌 결과가 **`p` = 33,333 에서 정확히 같고 33,334 부터 탐색이 적다**였다. 그 두 자리를
 * 계수로 함께 싣는다 — 경계를 값으로 대는 자리다.
 */
const CYCLE_AT_TIE = triangleAt(V, 33_333);
const CYCLE_AFTER_TIE = triangleAt(V, 33_334);

function measure(run: (n: number, e: Edge[]) => Counted) {
  return () => ({
    "전개가 쓰는 여섯 정점에서 배열 칸 접근": run(WALK_N, WALK_EDGES).cells,
    "삼각형 간선이 목록 맨 앞일 때 배열 칸 접근": run(V, CYCLE_FIRST).cells,
    "삼각형 간선이 33,334 번째일 때 배열 칸 접근": run(V, CYCLE_AT_TIE).cells,
    "삼각형 간선이 33,335 번째일 때 배열 칸 접근": run(V, CYCLE_AFTER_TIE)
      .cells,
    "삼각형 간선이 목록 맨 뒤일 때 배열 칸 접근": run(V, CYCLE_LAST).cells,
    "삼각형이 정점 번호 맨 뒤에 있을 때 배열 칸 접근": run(V, CYCLE_FAR).cells,
    "사이클이 없는 한 줄에서 배열 칸 접근": run(V, NO_CYCLE).cells,
    "사이클이 없는 한 줄에서 새로 잡는 칸": run(V, NO_CYCLE).allocated,
  });
}

export const cases = {
  "이웃 목록 탐색": measure(search),
  "서로소 집합": measure(disjointSet),
};
