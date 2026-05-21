/**
 * Knuth's Optimization — 최적 파일 병합 (Optimal Binary Merge Pattern)
 *
 * $n$개의 인접한 파일 크기 $\text{freq}[0..n-1]$이 주어진다. 두 인접 그룹을
 * 병합할 때 비용은 두 그룹의 크기 합이며, 모든 파일을 하나로 병합할 때까지의
 * 총 비용을 최소화한다.
 *
 * 누적합 $S(i, j) = \sum_{t=i}^{j} \text{freq}[t]$라 할 때:
 *
 * $$dp[i][j] = \min_{i \leq k < j} \left( dp[i][k] + dp[k+1][j] \right) + S(i, j)$$
 *
 * 기저: $dp[i][i] = 0$.
 *
 * 비용 함수가 사각 부등식 + 단조성을 만족하므로 Knuth's Optimization을 적용하면
 * 최적 분할점 $opt[i][j]$가 $opt[i][j-1] \leq opt[i][j] \leq opt[i+1][j]$를 만족한다.
 * 이를 이용해 전체 시간 복잡도가 $O(n^3) \to O(n^2)$로 감소한다.
 *
 * @param freq - 인접 파일 크기 배열 ($1 \leq n \leq 5000$, $\text{freq}[i] \geq 0$)
 * @returns 최적 병합 총 비용 ($\geq 0$)
 */
export function knuthOptimization(freq: number[]): number {
  throw new Error("Not implemented");
}
