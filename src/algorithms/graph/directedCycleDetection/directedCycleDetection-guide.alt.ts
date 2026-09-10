/**
 * `purpose.alt`(경쟁 설계와의 대조)의 실측 하네스 — L13.
 *
 * 대조하는 둘은 **같은 답을 내는 서로 다른 절차**다.
 *
 * - **삼색 표시** — 이 가이드가 가르치는 절차. `.ref.ts` 와 같은 순서로 같은 일을 하고,
 *   읽고 쓴 배열 칸만 덧붙여 센다. 정본은 계수를 내보내지 않으므로 세는 사본이 필요하다.
 * - **진입차수 세기** — 정점마다 들어오는 간선 수를 세어 두고 그 수가 0 인 정점을 큐에
 *   담는 절차(`topologicalSort` 가이드의 것). 큐가 빈 뒤 꺼낸 정점 수가 `n` 보다 작으면
 *   남은 정점이 사이클을 이루고 있다.
 *
 * **계수는 배열 칸 접근 수와 새로 잡는 칸 수 둘이다.** 둘 다 같은 입력에서 항상 같은 값이
 * 나온다 — 벽시계는 쓰지 않는다.
 *
 * **전개(정점 여섯)가 쓰는 입력을 첫 계수로 함께 잰다.** 다만 그 입력 하나로는 「사이클이
 * 어디에 있는가」를 바꿔 볼 자리가 없어 순서가 뒤집히는 것을 보일 수 없다. 그래서 제약
 * 상한인 정점 100,000 을 쓰는 생성식 셋을 여기에 **상수로 두어** 독자가 같은 수를 다시 얻을
 * 수 있게 했다. 규모가 다른 사유는 본문 대조 문단에도 적었다.
 *
 *   bun run tools/bench-alt.ts src/algorithms/graph/directedCycleDetection/directedCycleDetection-guide.alt.ts
 */

type Edge = [number, number];

/** 제약 상한. 큰 입력 셋이 모두 이 정점 수를 쓴다. */
const V = 100_000;

/** `0 → 1 → … → V-1` 사슬. 간선 99,999 개. 사이클이 없다. */
function chain(v: number): Edge[] {
  const out: Edge[] = [];
  for (let i = 0; i + 1 < v; i++) out.push([i, i + 1]);
  return out;
}

/**
 * 사슬에 되돌아가는 간선 `p+1 → p` 를 더한 것. 간선 100,000 개.
 * **그 간선을 목록 맨 앞에 둔다** — 탐색이 `next[p+1]` 의 첫 자리에서 그것을 확인한다.
 */
function chainWithBackEdgeAt(v: number, p: number): Edge[] {
  return [[p + 1, p], ...chain(v)];
}

/** 사슬의 끝에서 맨 앞으로 되돌아가는 간선 `V-1 → 0`. 진입차수 0 인 정점이 하나도 없다. */
function chainClosed(v: number): Edge[] {
  return [...chain(v), [v - 1, 0]];
}

interface Counted {
  cells: number;
  allocated: number;
  answer: boolean;
}

/** 삼색 표시 — `.ref.ts` 와 같은 절차에 계수만 덧붙였다. */
function threeColor(n: number, edges: Edge[]): Counted {
  let cells = 0;
  let allocated = 0;
  const next: number[][] = Array.from({ length: n }, () => []);
  cells += n;
  allocated += n;
  for (const [u, v] of edges) {
    cells += 2;
    (next[u] as number[]).push(v);
    allocated += 1;
  }
  const color: number[] = Array.from({ length: n }, () => 0);
  cells += n;
  allocated += n;
  const cursor: number[] = Array.from({ length: n }, () => 0);
  cells += n;
  allocated += n;
  const stack: number[] = [];
  let peak = 0;

  for (let s = 0; s < n; s++) {
    cells++;
    if (color[s] !== 0) continue;
    cells += 2;
    color[s] = 1;
    stack.push(s);
    while (stack.length > 0) {
      if (stack.length > peak) peak = stack.length;
      cells += 3;
      const u = stack[stack.length - 1] as number;
      const list = next[u] as number[];
      const i = cursor[u] as number;
      if (i === list.length) {
        cells += 2;
        color[u] = 2;
        stack.pop();
        continue;
      }
      cells += 3;
      cursor[u] = i + 1;
      const v = list[i] as number;
      if (color[v] === 1) {
        return { cells, allocated: allocated + peak, answer: true };
      }
      if (color[v] === 0) {
        cells += 2;
        color[v] = 1;
        stack.push(v);
      }
    }
  }
  return { cells, allocated: allocated + peak, answer: false };
}

/** 진입차수 세기 — 남은 선행 정점 수가 0 인 정점을 큐에 담고, 꺼낸 수를 `n` 과 견준다. */
function inDegree(n: number, edges: Edge[]): Counted {
  let cells = 0;
  let allocated = 0;
  const next: number[][] = Array.from({ length: n }, () => []);
  cells += n;
  allocated += n;
  const remaining: number[] = Array.from({ length: n }, () => 0);
  cells += n;
  allocated += n;
  for (const [u, v] of edges) {
    cells += 4;
    (next[u] as number[]).push(v);
    remaining[v] = (remaining[v] as number) + 1;
    allocated += 1;
  }

  const queue: number[] = [];
  for (let v = 0; v < n; v++) {
    cells++;
    if (remaining[v] === 0) {
      queue.push(v);
      cells++;
    }
  }

  let head = 0;
  let taken = 0;
  while (head < queue.length) {
    cells += 3;
    const u = queue[head] as number;
    head++;
    taken++;
    for (const v of next[u] as number[]) {
      cells += 2;
      remaining[v] = (remaining[v] as number) - 1;
      if (remaining[v] === 0) {
        queue.push(v);
        cells++;
      }
    }
  }
  return { cells, allocated: allocated + queue.length, answer: taken !== n };
}

/** 전개(`deep.walk`)가 쓰는 입력 그대로. 두 절차를 같은 자리에서 한 번 재 둔다. */
const WALK_N = 6;
const WALK_EDGES: Edge[] = [
  [0, 1],
  [1, 3],
  [3, 4],
  [0, 4],
  [0, 2],
  [2, 3],
  [2, 5],
  [5, 0],
];

const NO_CYCLE = chain(V);
const CYCLE_NEAR_START = chainWithBackEdgeAt(V, 1);
const CYCLE_BLOCKS_SEEDS = chainClosed(V);

/**
 * 두 계수는 `p` 에 대해 각각 기울기 8 과 6 인 직선이라(여러 자리에서 실측했다) 뒤집히는
 * 자리가 하나뿐이다. 그 자리를 이분으로 좁힌 결과가 `p = 99,992` 였고, 앞뒤 한 칸을 계수로
 * 함께 싣는다 — 경계를 값으로 대는 자리다.
 */
const CYCLE_AT_99991 = chainWithBackEdgeAt(V, 99_991);
const CYCLE_AT_99992 = chainWithBackEdgeAt(V, 99_992);

function measure(run: (n: number, e: Edge[]) => Counted) {
  return () => ({
    "전개가 쓰는 여섯 정점에서 배열 칸 접근": run(WALK_N, WALK_EDGES).cells,
    "사이클이 없는 사슬에서 배열 칸 접근": run(V, NO_CYCLE).cells,
    "사이클이 정점 0 에서 두 걸음일 때 배열 칸 접근": run(V, CYCLE_NEAR_START)
      .cells,
    "사이클이 씨앗을 전부 막을 때 배열 칸 접근": run(V, CYCLE_BLOCKS_SEEDS)
      .cells,
    "사이클이 정점 0 에서 99,992 걸음일 때 배열 칸 접근": run(V, CYCLE_AT_99991)
      .cells,
    "사이클이 정점 0 에서 99,993 걸음일 때 배열 칸 접근": run(V, CYCLE_AT_99992)
      .cells,
    "사이클이 없는 사슬에서 새로 잡는 칸": run(V, NO_CYCLE).allocated,
  });
}

export const cases = {
  "삼색 표시": measure(threeColor),
  "진입차수 세기": measure(inDegree),
};
