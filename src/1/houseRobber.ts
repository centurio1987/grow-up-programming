/**
 * House Robber (인접 불가 최대합)
 *
 * 일렬로 늘어선 집들이 있고, $i$번째 집의 현금이 $nums[i]$이다.
 * 인접한 집은 동시에 털 수 없을 때, 털 수 있는 최대 금액을 반환한다.
 *
 * 알고리즘: DP — $dp[i] = \max(dp[i-1],\; dp[i-2] + nums[i])$
 *
 * - $N$은 집의 개수 ($0 \leq N \leq 100{,}000$)
 * - $nums[i]$는 정수 ($0 \leq nums[i] \leq 10^4$)
 */

/**
 * House Robber
 *
 * 인접한 두 집은 동시에 선택할 수 없을 때, 선택된 집의 합의 최댓값을 구한다.
 *
 * 점화식:
 *
 * $$dp[i] = \max\bigl(dp[i-1],\; dp[i-2] + nums[i]\bigr)$$
 *
 * 초기 조건:
 *
 * $$dp[0] = nums[0],\quad dp[1] = \max(nums[0], nums[1])$$
 *
 * 결과:
 *
 * $$\text{rob}(nums) = dp[N-1]$$
 *
 * 시간복잡도: $O(N)$, 공간복잡도: $O(1)$ (롤링)
 *
 * @param nums - 각 집의 현금 ($0 \leq N \leq 100{,}000$)
 * @returns 털 수 있는 최대 금액 ($\geq 0$)
 */
export function houseRobber(_nums: number[]): number {
  throw new Error("Not implemented");
}
