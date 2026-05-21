/**
 * 확률·기댓값 DP — 주사위 N회 합이 K 이상일 확률
 *
 * 공정한 6면 주사위를 $N$번 던졌을 때, 나온 눈의 합이 $K$ 이상일 확률을 구한다.
 *
 * 알고리즘: 2차원 DP — $p[i][s]$는 $i$번째 시행 후 합이 정확히 $s$일 확률.
 * 각 단계에서 1~6의 눈이 각각 $1/6$의 확률로 더해진다.
 *
 * - $1 \leq N \leq 1000$
 * - $0 \leq K \leq 6N$
 */

/**
 * Probability / Expected Value DP
 *
 * 점화식:
 *
 * $$p[i][s] = \frac{1}{6} \sum_{d=1}^{6} p[i-1][s - d] \quad (s \geq d)$$
 *
 * 초기 조건:
 *
 * $$p[0][0] = 1$$
 *
 * 결과:
 *
 * $$\text{expectedValueDp}(N, K) = \sum_{s = K}^{6N} p[N][s]$$
 *
 * 시간복잡도: $O(N \cdot 6N \cdot 6) = O(N^2)$, 공간복잡도: $O(N)$ (롤링)
 *
 * @param N - 주사위 시행 횟수 ($1 \leq N \leq 1000$)
 * @param K - 목표 합 임계값 ($0 \leq K \leq 6N$)
 * @returns 합이 $K$ 이상일 확률 ($\in [0, 1]$)
 */
export function expectedValueDp(N: number, K: number): number {
  throw new Error("Not implemented");
}
