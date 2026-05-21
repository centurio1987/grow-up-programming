/**
 * 무한 배낭 — 동전 교환 최소 개수 (Coin Change · Min Coins)
 *
 * 액면가 $coins = [c_1, c_2, \ldots, c_n]$의 동전이 각각 무한히 있다.
 * 정수 금액 $amount$를 만들기 위해 필요한 동전의 최소 개수를 구한다.
 * 만들 수 없으면 $-1$을 반환한다.
 *
 * 알고리즘: 1차원 DP — $dp[x]$는 금액 $x$를 만드는 최소 동전 개수.
 *
 * - $1 \leq n \leq 100$
 * - $0 \leq amount \leq 10^4$
 * - $1 \leq c_i \leq 10^4$
 */

/**
 * Unbounded Knapsack — Min Coin Change
 *
 * 점화식:
 *
 * $$dp[x] = \min_{c \in coins,\; c \leq x} \bigl(dp[x - c] + 1\bigr)$$
 *
 * 초기 조건:
 *
 * $$dp[0] = 0,\quad dp[x] = +\infty \;\;(x > 0)$$
 *
 * 결과:
 *
 * $$\text{unboundedKnapsack}(coins, amount) =
 * \begin{cases}
 *   dp[amount] & \text{if } dp[amount] < \infty \\
 *   -1 & \text{otherwise}
 * \end{cases}$$
 *
 * 시간복잡도: $O(n \cdot amount)$, 공간복잡도: $O(amount)$
 *
 * @param coins - 동전 액면가 배열 ($1 \leq n \leq 100$)
 * @param amount - 만들 금액 ($0 \leq amount \leq 10^4$)
 * @returns 최소 동전 개수, 만들 수 없으면 $-1$
 */
export function unboundedKnapsack(coins: number[], amount: number): number {
  throw new Error("Not implemented");
}
