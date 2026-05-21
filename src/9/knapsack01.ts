/**
 * 0/1 배낭 문제 (0/1 Knapsack)
 *
 * 무게 $w_i$와 가치 $v_i$를 가진 $n$개의 물건이 있다.
 * 배낭의 최대 적재 용량이 $W$일 때, 각 물건을 0번 또는 1번만 담아
 * 가치 합을 최대로 하는 방법을 구한다.
 *
 * 알고리즘: 2차원 DP — $dp[i][w]$는 $i$번째 물건까지 고려하고
 * 용량이 $w$일 때 얻을 수 있는 최대 가치.
 *
 * - $1 \leq n \leq 100$
 * - $1 \leq W \leq 10^4$
 * - $1 \leq w_i, v_i \leq 10^4$
 */

/**
 * 0/1 Knapsack
 *
 * 점화식:
 *
 * $$dp[i][w] =
 * \begin{cases}
 *   dp[i-1][w] & \text{if } w_i > w \\
 *   \max\bigl(dp[i-1][w],\; dp[i-1][w - w_i] + v_i\bigr) & \text{otherwise}
 * \end{cases}$$
 *
 * 초기 조건:
 *
 * $$dp[0][w] = 0 \quad \forall\, w \in [0, W]$$
 *
 * 결과:
 *
 * $$\text{knapsack01}(weights, values, W) = dp[n][W]$$
 *
 * 시간복잡도: $O(nW)$, 공간복잡도: $O(nW)$ (또는 $O(W)$ 롤링)
 *
 * @param weights - 각 물건의 무게 배열 ($1 \leq n \leq 100$)
 * @param values - 각 물건의 가치 배열 (길이 $n$)
 * @param W - 배낭의 최대 용량 ($1 \leq W \leq 10^4$)
 * @returns 얻을 수 있는 최대 가치 ($\geq 0$)
 */
export function knapsack01(
  weights: number[],
  values: number[],
  W: number,
): number {
  throw new Error("Not implemented");
}
