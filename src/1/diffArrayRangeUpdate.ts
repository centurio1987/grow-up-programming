/**
 * 구간 갱신 + 점 질의
 *
 * 길이 $N$의 정수 배열 $A$ (초기 모두 $0$)가 있다.
 * 일련의 구간 갱신 연산 $\text{update}(l, r, v)$가 주어진다:
 *
 * $$\forall i \in [l, r],\; A[i] \;{+}{=}\; v$$
 *
 * 모든 갱신 후의 배열 $A$를 반환한다.
 *
 * 알고리즘: 차분 배열 — 갱신 $O(1)$, 모든 점 복원 $O(N)$
 *
 * - $N$은 배열 길이 ($1 \leq N \leq 100{,}000$)
 * - $Q$는 갱신 횟수 ($1 \leq Q \leq 100{,}000$)
 * - $0 \leq l \leq r \leq N-1$, $-10^4 \leq v \leq 10^4$
 */

/**
 * Difference Array Range Update
 *
 * 차분 배열 $D$를 정의:
 *
 * $$D[l] \mathrel{+}= v,\quad D[r+1] \mathrel{-}= v$$
 *
 * 모든 갱신 후 누적합:
 *
 * $$A[i] = \sum_{k=0}^{i} D[k]$$
 *
 * 시간복잡도: 갱신 $O(1)$, 복원 $O(N)$, 전체 $O(N + Q)$
 *
 * @param N - 배열 길이 ($1 \leq N \leq 100{,}000$)
 * @param updates - 구간 갱신 배열 $[(l, r, v), \ldots]$
 * @returns 모든 갱신 후의 배열 $A$
 */
export function diffArrayRangeUpdate(
  _N: number,
  _updates: Array<[number, number, number]>,
): number[] {
  throw new Error("Not implemented");
}
