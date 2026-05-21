/**
 * 구간 최솟값 질의 (정적 배열)
 *
 * 갱신이 없는 정수 배열 $A$가 주어지고, 여러 질의 $(l, r)$이 들어온다.
 * 각 질의에 대해 $\min(A[l], A[l+1], \ldots, A[r])$을 반환한다.
 *
 * 알고리즘: Sparse Table — 전처리 $O(N \log N)$, 질의 $O(1)$
 *
 * - $N$은 배열 길이 ($1 \leq N \leq 100{,}000$)
 * - $Q$는 질의 개수 ($1 \leq Q \leq 100{,}000$)
 * - $A[i]$는 정수 ($-10^9 \leq A[i] \leq 10^9$)
 * - $0 \leq l \leq r \leq N-1$
 */

/**
 * Sparse Table Range Min
 *
 * 사전 계산:
 *
 * $$st[k][i] = \min\bigl(A[i],\, A[i+1],\, \ldots,\, A[i + 2^k - 1]\bigr)$$
 *
 * 질의 ($l \leq r$, $k = \lfloor \log_2(r-l+1) \rfloor$):
 *
 * $$\text{min}(l, r) = \min\bigl(st[k][l],\, st[k][r - 2^k + 1]\bigr)$$
 *
 * 전처리 $O(N \log N)$, 질의당 $O(1)$
 *
 * @param A - 정수 배열 ($1 \leq N \leq 100{,}000$)
 * @param queries - 질의 배열 $[(l, r), \ldots]$
 * @returns 각 질의 구간의 최솟값 배열
 */
export function sparseTableRangeMin(A: number[], queries: Array<[number, number]>): number[] {
  throw new Error("Not implemented");
}
