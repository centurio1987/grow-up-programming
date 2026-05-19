/**
 * 부분집합 합 (Subset Sum)
 *
 * 비음의 정수 배열 $nums$와 목표 합 $target$이 주어진다.
 * $nums$의 부분집합 중 원소 합이 정확히 $target$인 것이 존재하는지 판정한다.
 *
 * 알고리즘: 1차원 DP — $dp[x]$는 합 $x$를 만들 수 있는지의 불리언.
 *
 * - $1 \leq n \leq 1000$
 * - $0 \leq target \leq 10^4$
 * - $0 \leq nums[i] \leq 10^4$
 */

/**
 * Subset Sum
 *
 * 점화식 (원소 $v$를 추가 고려할 때, $x$를 큰 값부터 갱신):
 *
 * $$dp[x] \gets dp[x] \lor dp[x - v] \quad (x \geq v)$$
 *
 * 초기 조건:
 *
 * $$dp[0] = \text{true},\quad dp[x] = \text{false} \;\;(x > 0)$$
 *
 * 결과:
 *
 * $$\text{subsetSum}(nums, target) = dp[target]$$
 *
 * 시간복잡도: $O(n \cdot target)$, 공간복잡도: $O(target)$
 *
 * @param nums - 비음의 정수 배열 ($1 \leq n \leq 1000$)
 * @param target - 목표 합 ($0 \leq target \leq 10^4$)
 * @returns 부분집합 합이 $target$인 것이 존재하면 `true`
 */
export function subsetSum(_nums: number[], _target: number): boolean {
  throw new Error("Not implemented");
}
