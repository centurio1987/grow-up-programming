/**
 * 역순쌍 개수 (Count Inversions) — Merge Sort 변형
 *
 * 길이 $n$인 배열 $A$가 주어질 때, 다음 조건을 만족하는 쌍 $(i, j)$의 개수를 구한다:
 *
 * $$\text{inv}(A) = \left|\, \{ (i, j) \;\mid\; 0 \leq i < j < n,\; A[i] > A[j] \} \,\right|$$
 *
 * 단순 이중 루프는 $O(n^2)$이므로, Merge Sort를 변형하여
 * 병합 단계에서 좌측 부분배열의 남은 원소 개수만큼 역순쌍을 누적한다.
 *
 * 좌측 $L$, 우측 $R$을 병합할 때 $L[i] > R[j]$이면 $L$의 $i$번째부터 끝까지
 * $|L| - i$개의 원소가 모두 $R[j]$보다 크므로 그만큼 역순쌍을 더한다.
 *
 * 시간 복잡도는 $O(n \log n)$.
 *
 * @param arr - 정수 배열 ($1 \leq n \leq 10^5$)
 * @returns 역순쌍의 총 개수 ($\geq 0$)
 */
export function countInversions(_arr: number[]): number {
  throw new Error("Not implemented");
}
