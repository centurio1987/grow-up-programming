/**
 * Divide & Conquer DP — 부분합 기반 분할 최적화
 *
 * $n \times n$ 비용 행렬 $\text{cost}[i][j]$가 주어졌을 때 (구간 $[i, j]$를
 * 한 그룹으로 묶었을 때의 비용), $[0, n-1]$을 정확히 $k$개의 연속 구간으로
 * 분할하는 최소 총 비용을 구한다.
 *
 * 상태 점화식:
 *
 * $$dp[g][i] = \min_{g-1 \leq j < i} \left( dp[g-1][j] + \text{cost}[j+1][i] \right)$$
 *
 * 기저: $dp[1][i] = \text{cost}[0][i]$.
 *
 * 비용 함수가 사각 부등식(quadrangle inequality)을 만족할 때, 최적 분할점
 * $opt(g, i)$가 $i$에 대해 단조 증가하므로 Divide & Conquer DP로
 * $O(k \cdot n \log n)$ 시간에 해결한다.
 *
 * 분할 정복은 $g$ 계층에서 함수 `solve(lo, hi, optLo, optHi)`를 호출,
 * 중앙 $\text{mid} = \lfloor (lo + hi)/2 \rfloor$의 최적해를 $[optLo, optHi]$
 * 범위에서 탐색한 뒤 좌/우 구간에 대해 분할 범위를 좁혀 재귀한다.
 *
 * @param cost - $n \times n$ 비용 행렬 ($1 \leq n \leq 500$, $0 \leq \text{cost}[i][j]$)
 * @param k - 분할 개수 ($1 \leq k \leq n$)
 * @returns 분할 비용의 최솟값 ($\geq 0$)
 */
export function divideAndConquerDp(cost: number[][], k: number): number {
  throw new Error("Not implemented");
}
