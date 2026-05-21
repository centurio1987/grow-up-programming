/**
 * 최대 곱 부분 배열 (Maximum Product Subarray)
 *
 * 정수 배열 $A$가 주어질 때, 연속된 부분 배열의 곱 중 최댓값을 구한다.
 *
 * 알고리즘: Kadane 변형 — 음수 곱셈으로 인해 최댓값과 최솟값을 동시에 추적해야 한다.
 *
 * - $N$은 배열 길이 ($1 \leq N \leq 100{,}000$)
 * - $A[i]$는 정수 ($-10 \leq A[i] \leq 10$)
 */

/**
 * Maximum Product Subarray
 *
 * 배열 $A$에서 연속된 부분 배열의 곱이 최대가 되는 값을 반환한다.
 *
 * 점화식 (음수 처리를 위해 max·min 동시 추적):
 *
 * $$mx[i] = \max(A[i],\; mx[i-1] \cdot A[i],\; mn[i-1] \cdot A[i])$$
 * $$mn[i] = \min(A[i],\; mx[i-1] \cdot A[i],\; mn[i-1] \cdot A[i])$$
 *
 * 결과:
 *
 * $$\text{maxProduct}(A) = \max_{0 \leq i < N} mx[i]$$
 *
 * 시간복잡도: $O(N)$
 *
 * @param A - 정수 배열 ($1 \leq N \leq 100{,}000$)
 * @returns 연속된 부분 배열의 곱의 최댓값
 */
export function maximumProductSubarray(A: number[]): number {
  throw new Error("Not implemented");
}
