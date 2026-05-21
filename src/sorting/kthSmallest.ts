/**
 * Kth Smallest Element (k번째 작은 원소)
 *
 * N개의 정수로 이루어진 배열 $A$와 정수 $k$ $(1 \leq k \leq N)$가 주어질 때,
 * $A$를 오름차순 정렬했을 때의 $k$번째 원소를 반환한다 (1-based).
 *
 * $$\text{kthSmallest}(A, k) = \text{sort}(A)[k-1]$$
 *
 * 대표 알고리즘:
 *
 * - Quickselect: 평균 $O(n)$, 최악 $O(n^2)$. 무작위 피벗으로 기대 시간 선형.
 * - Median of Medians: 최악 $O(n)$ 보장. 5개 단위 중앙값의 중앙값을 피벗.
 *
 * @param A - 정수 배열 ($1 \leq N \leq 100{,}000$, $-10^9 \leq A[i] \leq 10^9$)
 * @param k - 1-based 인덱스 ($1 \leq k \leq N$)
 * @returns 정렬했을 때 $k$번째로 작은 원소
 */
export function kthSmallest(A: number[], k: number): number {
  throw new Error("Not implemented");
}
