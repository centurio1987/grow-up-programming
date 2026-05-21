/**
 * 행렬 체인 곱셈 (Matrix Chain Multiplication)
 *
 * 행렬 $A_1, A_2, \ldots, A_n$이 주어지고, 각 행렬의 차원을 $dims$ 배열로 표현한다.
 * 즉 $A_i$의 크기는 $dims[i-1] \times dims[i]$이다.
 * 행렬 곱셈의 결합 순서를 잘 선택해, 총 스칼라 곱셈 횟수를 최소화하는 값을 구한다.
 *
 * 알고리즘: 구간 DP — $dp[i][j]$는 $A_i \cdots A_j$를 곱하는 최소 비용.
 *
 * - $dims$의 길이는 $n + 1$ ($1 \leq n \leq 100$, 즉 $|dims| \leq 101$)
 * - $1 \leq dims[i] \leq 500$
 */

/**
 * Matrix Chain Multiplication
 *
 * 점화식:
 *
 * $$dp[i][j] = \min_{i \leq k < j}\bigl(dp[i][k] + dp[k+1][j] + dims[i-1] \cdot dims[k] \cdot dims[j]\bigr)$$
 *
 * 초기 조건:
 *
 * $$dp[i][i] = 0 \quad \forall\, i \in [1, n]$$
 *
 * 결과:
 *
 * $$\text{matrixChainMultiplication}(dims) = dp[1][n]$$
 *
 * 시간복잡도: $O(n^3)$, 공간복잡도: $O(n^2)$
 *
 * @param dims - 행렬 차원 배열 (길이 $n + 1$, $1 \leq n \leq 100$)
 * @returns 최소 스칼라 곱셈 횟수 ($\geq 0$)
 */
export function matrixChainMultiplication(dims: number[]): number {
  throw new Error("Not implemented");
}
