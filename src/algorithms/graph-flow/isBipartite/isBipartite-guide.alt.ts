/**
 * `purpose.alt`(경쟁 설계와의 대조)의 실측 하네스 — L13.
 *
 * 대조하는 둘은 **같은 답을 내는 서로 다른 절차**다.
 *
 * - **쪽 배열 탐색** — 이 가이드가 가르치는 절차. `.ref.ts` 와 같은 순서로 같은 일을 하고,
 *   읽고 쓴 배열 칸만 덧붙여 센다. 정본은 계수를 내보내지 않으므로 세는 사본이 필요하다.
 * - **쪽 관계 서로소 집합** — 이웃 목록을 만들지 않는다. 간선 `[u, v]` 를 「`u` 와 `v` 는
 *   서로 다른 쪽」이라는 관계로 읽고, 정점마다 대표까지의 홀짝(`rel`)을 함께 들고 다니는
 *   서로소 집합에 그 관계를 넣는다. 이미 같은 무리인데 홀짝이 같으면 그 간선이 규정을
 *   깨뜨리므로 `false` 다. `src/data-structures/disjoint-set/unionFind` 가 그 자료구조를
 *   다룬다.
 *
 * **홀짝을 함께 드는 판을 골랐다.** 정점을 두 벌(`v` 와 `v + n`)로 늘려 「같은 쪽」·「다른
 * 쪽」을 각각 한 무리로 묶는 판도 있는데, 그쪽은 배열 둘이 `2n` 칸이라 정점 축에서 미리
 * 불리하다. 대조가 정점 수와 간선 수의 비로 갈리는 자리를 보는 것이라, 정점 축이 더 가벼운
 * 쪽을 상대로 세워야 대조가 연출이 되지 않는다.
 *
 * **계수는 배열 칸 접근 수와 새로 잡는 칸 수 둘이다.** 칸을 한 번 읽으면 1, 한 번 쓰면 1로
 * 세고 두 절차에 같은 규칙을 쓴다. 둘 다 같은 입력에서 항상 같은 값이 나온다 — 벽시계는
 * 쓰지 않는다.
 *
 * **전개(정점 일곱)가 쓰는 입력을 첫 계수로 함께 잰다.** 다만 그 입력은 정점이 일곱이라
 * 간선 수와 정점 수의 비를 바꿔 볼 자리가 없다. 그래서 제약 상한인 정점 100,000 을 쓰는
 * 생성식을 여기에 **상수로 두어** 독자가 같은 수를 다시 얻을 수 있게 했다. 규모가 다른
 * 사유는 본문 대조 문단에도 적었다.
 *
 *   bun run tools/bench-alt.ts src/algorithms/graph-flow/isBipartite/isBipartite-guide.alt.ts
 */

type Edge = [number, number];

/** 제약 상한. 큰 입력이 전부 이 정점 수를 쓴다. */
const V = 100_000;

interface Counted {
  cells: number;
  allocated: number;
  answer: boolean;
}

/** 쪽 배열 탐색 — `.ref.ts` 와 같은 절차에 계수만 덧붙였다. */
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
  const side: number[] = Array.from({ length: n }, () => -1);
  cells += n;
  allocated += n;
  const stack: number[] = [];
  let peak = 0;

  for (let s = 0; s < n; s++) {
    cells++;
    if (side[s] !== -1) continue;
    cells += 2;
    side[s] = 0;
    stack.push(s);
    while (stack.length > 0) {
      if (stack.length > peak) peak = stack.length;
      cells += 3;
      const u = stack.pop() as number;
      const su = side[u] as number;
      const other = 1 - su;
      for (const v of nbr[u] as number[]) {
        cells += 2;
        if (side[v] === su) {
          return { cells, allocated: allocated + peak, answer: false };
        }
        cells++;
        if (side[v] !== -1) continue;
        cells += 2;
        side[v] = other;
        stack.push(v);
      }
    }
  }
  return { cells, allocated: allocated + peak, answer: true };
}

/**
 * 쪽 관계 서로소 집합 — 간선을 하나씩 받아 「두 끝은 서로 다른 쪽」이라는 관계를 넣는다.
 *
 * `rel[v]` 는 `v` 와 `parent[v]` 의 쪽이 같으면 0, 다르면 1이다. `find` 는 대표까지 걸어가며
 * 그 값들을 더해(배타적 논리합) 대표와의 홀짝을 내고, 같은 걸음에 경로를 대표로 붙인다.
 */
function relationDisjointSet(n: number, edges: Edge[]): Counted {
  let cells = 0;
  const parent: number[] = Array.from({ length: n }, (_, i) => i);
  cells += n;
  const rel: number[] = Array.from({ length: n }, () => 0);
  cells += n;
  const size: number[] = Array.from({ length: n }, () => 1);
  cells += n;
  const allocated = 3 * n;

  /** 대표를 돌려주고, 그 걸음에 `rel[x]` 를 대표 기준으로 고쳐 둔다. */
  const find = (x: number): number => {
    const path: number[] = [];
    let r = x;
    cells++; // 첫 parent[r] 읽기
    while ((parent[r] as number) !== r) {
      path.push(r);
      r = parent[r] as number;
      cells++; // 다음 바퀴의 parent[r] 읽기
    }
    let p = 0;
    for (let i = path.length - 1; i >= 0; i--) {
      const node = path[i] as number;
      // rel[node] 읽기 · rel[node] 쓰기 · parent[node] 쓰기
      cells += 3;
      p ^= rel[node] as number;
      rel[node] = p;
      parent[node] = r;
    }
    return r;
  };

  for (const [u, v] of edges) {
    const ru = find(u);
    const rv = find(v);
    cells += 2; // rel[u] · rel[v] 읽기
    const pu = rel[u] as number;
    const pv = rel[v] as number;
    if (ru === rv) {
      // 이미 한 무리다. 홀짝이 같으면 이 간선의 두 끝이 한 쪽에 함께 들어간다.
      if (pu === pv) return { cells, allocated, answer: false };
      continue;
    }
    cells += 2; // size 둘 읽기
    const a = (size[ru] as number) >= (size[rv] as number) ? ru : rv;
    const b = a === ru ? rv : ru;
    // parent[b] 쓰기 · rel[b] 쓰기 · size 읽기 둘 · size 쓰기
    cells += 5;
    parent[b] = a;
    // 어느 쪽을 붙이든 「두 끝의 홀짝이 달라야 한다」에서 같은 값이 나온다.
    rel[b] = pu ^ pv ^ 1;
    size[a] = (size[a] as number) + (size[b] as number);
  }
  return { cells, allocated, answer: true };
}

/** 전개(`deep.walk`)가 쓰는 입력 그대로. 두 절차를 같은 자리에서 한 번 재 둔다. */
const WALK_N = 7;
const WALK_EDGES: Edge[] = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 0],
  [4, 5],
  [5, 6],
  [6, 4],
];

/**
 * 정점 `v` 개에 간선 **정확히 `e` 개**를 얹은 이분 그래프.
 *
 * 번호 차가 홀수인 짝만 잇는다 — `[i, i+1]` 을 다 깔고 모자라면 `[i, i+3]`, 그다음 `[i, i+5]`
 * 순이다. 정점 번호의 홀짝을 쪽으로 삼으면 번호 차가 홀수인 간선은 언제나 두 쪽을 가르므로,
 * 얼마를 더해도 이분 그래프다. 차가 서로 다르니 같은 간선이 두 번 들어가지도 않는다.
 * 간선이 정점 수보다 적으면 나머지 정점은 간선이 없는 채로 남는다.
 */
export function bipartite(v: number, e: number): Edge[] {
  const out: Edge[] = [];
  for (let d = 1; d < v && out.length < e; d += 2) {
    for (let i = 0; i + d < v && out.length < e; i++) out.push([i, i + d]);
  }
  return out;
}

/**
 * 두 계수는 간선 수에 대해 기울기가 다른 직선이라 축마다 뒤집히는 자리가 하나뿐이고, 그
 * 자리가 서로 다르다. 이분으로 좁힌 결과가 아래 넷이다 — **뒤집히는 방향도 두 축이 반대다.**
 * 배열 칸 접근은 간선이 늘수록 이 절차 쪽이 유리해지고, 새로 잡는 칸은 반대다.
 */
const CELL_TIE = 100_005;
const CELL_FLIP = 100_006;
const ALLOC_TIE = 49_999;
const ALLOC_FLIP = 50_000;

const E_NONE = bipartite(V, 0);
const E_CELL_TIE = bipartite(V, CELL_TIE);
const E_CELL_FLIP = bipartite(V, CELL_FLIP);
const E_ALLOC_TIE = bipartite(V, ALLOC_TIE);
const E_ALLOC_FLIP = bipartite(V, ALLOC_FLIP);
const E_FULL = bipartite(V, 200_000);

function measure(run: (n: number, e: Edge[]) => Counted) {
  return () => ({
    "전개가 쓰는 정점 일곱에서 배열 칸 접근": run(WALK_N, WALK_EDGES).cells,
    "간선 0 개에서 배열 칸 접근": run(V, E_NONE).cells,
    [`간선 ${CELL_TIE.toLocaleString("en-US")} 개에서 배열 칸 접근`]: run(
      V,
      E_CELL_TIE,
    ).cells,
    [`간선 ${CELL_FLIP.toLocaleString("en-US")} 개에서 배열 칸 접근`]: run(
      V,
      E_CELL_FLIP,
    ).cells,
    "간선 200,000 개에서 배열 칸 접근": run(V, E_FULL).cells,
    "간선 0 개에서 새로 잡는 칸": run(V, E_NONE).allocated,
    [`간선 ${ALLOC_TIE.toLocaleString("en-US")} 개에서 새로 잡는 칸`]: run(
      V,
      E_ALLOC_TIE,
    ).allocated,
    [`간선 ${ALLOC_FLIP.toLocaleString("en-US")} 개에서 새로 잡는 칸`]: run(
      V,
      E_ALLOC_FLIP,
    ).allocated,
    "간선 200,000 개에서 새로 잡는 칸": run(V, E_FULL).allocated,
  });
}

export const cases = {
  "쪽 배열 탐색": measure(search),
  "쪽 관계 서로소 집합": measure(relationDisjointSet),
};
