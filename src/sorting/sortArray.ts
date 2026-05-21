/**
 * Sort Array (일반 정렬)
 *
 * N개의 정수로 이루어진 배열 $A$가 주어질 때, 오름차순으로 정렬된 배열을 반환한다.
 *
 * 정렬 결과 배열 $B$는 다음을 만족한다:
 *
 * $$B[0] \leq B[1] \leq \cdots \leq B[N-1], \quad \text{multiset}(B) = \text{multiset}(A)$$
 *
 * 대표적인 비교 기반 정렬 알고리즘:
 *
 * - Quicksort: 평균 $O(n \log n)$, 최악 $O(n^2)$, 제자리, 불안정
 * - Mergesort: $O(n \log n)$ 보장, $O(n)$ 추가 메모리, 안정
 * - Heapsort: $O(n \log n)$ 보장, 제자리, 불안정
 *
 * @param A - 정수 배열 ($1 \leq N \leq 100{,}000$, $-10^9 \leq A[i] \leq 10^9$)
 * @returns 오름차순으로 정렬된 새 배열
 */
export function sortArray(A: number[]): number[] {
  throw new Error("Not implemented");
}
