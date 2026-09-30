/**
 * `purpose.alt` 가 인용하는 수치의 출처 — L13.
 *
 *   bun run tools/bench-alt.ts src/algorithms/array/mosAlgorithm/mosAlgorithm-guide.alt.ts
 *
 * 두 설계를 **같은 입력 두 벌**에 걸고 **기본 연산 수**를 센다. 기본 연산은 원고 전체가 쓰는 비용 기준이다 —
 * 셈 구조의 한 자리(맵의 키 하나 · 펜윅 트리의 칸 하나)를 읽거나 고치는 일을 1 번으로 센다. 벽시계가
 * 아닌 까닭은 실행마다 같은 값이 나와야 「본문의 수치가 실측과 같은가」(P10)를 정의할 수 있어서다.
 *
 * - Mo's 알고리즘 — 창이 옮긴 칸 수. 칸 하나를 옮길 때 `count` 맵의 키 하나를 고친다(`add` · `remove`).
 *   정렬된 차례는 정본이 낸다(그림 사이드카의 `orderOf`).
 * - 오프라인 펜윅 트리 — 트리 칸을 읽거나 고친 횟수와, 원소마다 「직전 등장 자리」 맵의 키 하나를 고친
 *   횟수의 합.
 *
 * 입력은 원고가 쓰는 두 벌 그대로다. 전개 입력(`arr = [1, 1, 2, 1, 3]`, 질의 다섯)과 과제 규모 입력
 * (`n = q = 100,000`, 시드 20260930 의 선형 합동 생성기 — `makeInput`). 옛 판은 `n = 400 · q = 200` 한 벌에
 * Mo 는 이동 칸, 펜윅은 트리 방문만 셌다. 두 설계의 계수를 한 기준으로 맞추고 원고의 과제 규모와 같은
 * 입력을 쓰려고 바꿨다.
 */

import {
  A5,
  makeInput,
  moves,
  N_TASK,
  orderOf,
  Q5,
} from "./mosAlgorithm-guide.fig.tsx";
import { mosAlgorithm } from "./mosAlgorithm-guide.ref.ts";

type Query = [number, number];

/** Mo's 알고리즘의 기본 연산 — 정본이 정렬한 차례에서 창이 옮긴 칸 수. */
function moOps(arr: readonly number[], queries: readonly Query[]): number {
  return moves(orderOf(arr, queries).order).total;
}

/**
 * 경쟁 설계 — **오프라인 + 펜윅 트리**.
 *
 * 창을 옮기는 대신 배열을 왼쪽부터 한 번만 차례로 읽는다. 값 `v` 를 만나면 **그 값의 직전 등장 자리에서
 * 1 을 빼고** 지금 자리에 1 을 더한다. 그러면 시점 `i` 에서 트리의 구간합 `[l, i]` 가 곧 그 구간의 서로
 * 다른 값 수다 — 각 값이 **가장 오른쪽 등장**에서만 세어지기 때문이다. 질의를 `r` 로만 정렬하면 한 번
 * 읽는 동안 전부 답한다.
 */
export function fenwickDistinct(
  arr: readonly number[],
  queries: readonly Query[],
): { ops: number; out: number[] } {
  const n = arr.length;
  let ops = 0;
  const tree = new Array<number>(n + 1).fill(0);
  const update = (i: number, delta: number): void => {
    for (let x = i + 1; x <= n; x += x & -x) {
      tree[x] = (tree[x] as number) + delta;
      ops++;
    }
  };
  const prefix = (i: number): number => {
    let sum = 0;
    for (let x = i + 1; x > 0; x -= x & -x) {
      sum += tree[x] as number;
      ops++;
    }
    return sum;
  };

  const byR = queries
    .map((q, i) => ({ l: q[0], r: q[1], i }))
    .sort((a, b) => a.r - b.r);
  const last = new Map<number, number>();
  const out = new Array<number>(queries.length);
  let cursor = 0;

  for (let i = 0; i < n; i++) {
    const v = arr[i] as number;
    const prev = last.get(v);
    last.set(v, i);
    ops++; // 직전 등장 자리 맵의 키 하나를 읽고 고친다
    if (prev !== undefined) update(prev, -1);
    update(i, 1);
    while (cursor < byR.length && (byR[cursor] as { r: number }).r === i) {
      const q = byR[cursor] as { l: number; r: number; i: number };
      out[q.i] = prefix(q.r) - (q.l > 0 ? prefix(q.l - 1) : 0);
      cursor++;
    }
  }
  return { ops, out };
}

/** 펜윅 쪽 답이 정본과 같은지 — 전개 입력과, 과제 규모와 같은 생성식의 작은 입력에서 본다. */
const small = makeInput(1_000, 1_000);
for (const [arr, queries] of [
  [A5, Q5],
  [small.arr, small.queries],
] as [number[], Query[]][]) {
  const want = mosAlgorithm([...arr], queries);
  if (
    JSON.stringify(fenwickDistinct(arr, queries).out) !== JSON.stringify(want)
  ) {
    throw new Error("오프라인 펜윅 트리의 답이 정본과 다르다");
  }
}

const task = makeInput(N_TASK, N_TASK);

export const cases = {
  "Mo's 알고리즘": () => ({
    "전개 입력 기본 연산": moOps(A5, Q5),
    "과제 규모 기본 연산": moOps(task.arr, task.queries),
  }),
  "오프라인 펜윅 트리": () => ({
    "전개 입력 기본 연산": fenwickDistinct(A5, Q5).ops,
    "과제 규모 기본 연산": fenwickDistinct(task.arr, task.queries).ops,
  }),
};
