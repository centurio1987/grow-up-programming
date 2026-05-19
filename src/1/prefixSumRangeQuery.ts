/**
 * 구간 합 질의 (정적 배열)
 *
 * 정적 정수 배열 $A$가 주어지고, 여러 개의 질의 $(l, r)$이 들어온다.
 * 각 질의는 $A[l] + A[l+1] + \ldots + A[r]$ ($l \leq r$)을 의미한다.
 * 모든 질의에 답한 결과 배열을 반환한다.
 *
 * 알고리즘: Prefix Sum — 전처리 $O(N)$, 질의 $O(1)$
 *
 * - $N$은 배열 길이 ($1 \leq N \leq 100{,}000$)
 * - $Q$는 질의 개수 ($1 \leq Q \leq 100{,}000$)
 * - $A[i]$는 정수 ($-10^4 \leq A[i] \leq 10^4$)
 * - $0 \leq l \leq r \leq N-1$
 */

/**
 * Prefix Sum Range Query
 *
 * 누적합 배열:
 *
 * $$P[0] = 0,\quad P[i] = \sum_{k=0}^{i-1} A[k]$$
 *
 * 각 질의 $(l, r)$에 대해:
 *
 * $$\text{sum}(l, r) = P[r+1] - P[l]$$
 *
 * 시간복잡도: 전처리 $O(N)$, 질의당 $O(1)$, 전체 $O(N + Q)$
 *
 * @param A - 정수 배열 ($1 \leq N \leq 100{,}000$)
 * @param queries - 질의 배열 $[(l, r), \ldots]$ ($1 \leq Q \leq 100{,}000$)
 * @returns 각 질의에 대응되는 구간 합 배열
 */
export function prefixSumRangeQuery(_A: number[], _queries: Array<[number, number]>): number[] {
  throw new Error("Not implemented");
}
