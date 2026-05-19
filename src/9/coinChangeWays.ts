/**
 * 동전으로 금액 만드는 경우의 수 (Coin Change · Ways)
 *
 * 액면가 $coins = [c_1, c_2, \ldots, c_n]$의 동전이 각각 무한히 있다.
 * 정수 금액 $amount$를 만드는 서로 다른 조합(combination)의 수를 구한다.
 * (순서는 구분하지 않는다.)
 *
 * 알고리즘: 1차원 DP — 동전을 바깥 루프, 금액을 안쪽 루프로 두어
 * 조합의 수를 셈한다. (순열을 세려면 루프 순서를 바꾼다.)
 *
 * - $1 \leq n \leq 100$
 * - $0 \leq amount \leq 10^4$
 * - $1 \leq c_i \leq 10^4$
 */

/**
 * Coin Change — Number of Ways (Combinations)
 *
 * 점화식 (동전 $c$를 추가 고려할 때):
 *
 * $$dp[x] \mathrel{+}= dp[x - c] \quad (x \geq c)$$
 *
 * 초기 조건:
 *
 * $$dp[0] = 1,\quad dp[x] = 0 \;\;(x > 0)$$
 *
 * 결과:
 *
 * $$\text{coinChangeWays}(coins, amount) = dp[amount]$$
 *
 * 시간복잡도: $O(n \cdot amount)$, 공간복잡도: $O(amount)$
 *
 * @param coins - 동전 액면가 배열 ($1 \leq n \leq 100$)
 * @param amount - 만들 금액 ($0 \leq amount \leq 10^4$)
 * @returns 조합의 수 ($\geq 0$)
 */
export function coinChangeWays(_coins: number[], _amount: number): number {
  throw new Error("Not implemented");
}
