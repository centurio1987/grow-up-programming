/**
 * Maximum Slice (최대 부분합)
 *
 * 정수 배열 $A$가 주어질 때, 연속된 부분 배열의 합 중 최댓값을 구한다.
 *
 * 알고리즘: Kadane's Algorithm — 현재 위치에서 끝나는 최대합 점화식을 사용한다.
 *
 * - $N$은 정수 배열의 길이 ($1 \leq N \leq 100{,}000$)
 * - $A[i]$는 정수 ($-10{,}000 \leq A[i] \leq 10{,}000$)
 */

/**
 * Kadane's Algorithm
 *
 * 배열 $A$에서 연속된 부분 배열의 최대 합을 반환한다.
 *
 * 점화식:
 *
 * $$dp[i] = \max(A[i],\; dp[i-1] + A[i])$$
 *
 * 최종 결과:
 *
 * $$\text{kadane}(A) = \max_{0 \leq i < N} dp[i]$$
 *
 * 시간복잡도: $O(N)$
 *
 * @param A - 정수 배열 ($1 \leq N \leq 100{,}000$)
 * @returns 연속된 부분 배열의 최대 합
 */
export function kadane(A: number[]): number {
  throw new Error("Not implemented");
}
