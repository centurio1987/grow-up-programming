/**
 * 외판원 문제 — 비트마스크 DP (TSP, Held-Karp)
 *
 * $n$개 도시의 거리 행렬 $dist[i][j]$가 주어진다.
 * 도시 0에서 출발하여 모든 도시를 정확히 한 번씩 방문하고
 * 다시 도시 0으로 돌아오는 최소 비용을 구한다.
 *
 * 알고리즘: Held-Karp 비트마스크 DP — $dp[mask][v]$는
 * 방문한 도시 집합이 $mask$이고 현재 위치가 $v$일 때의 최소 비용.
 *
 * - $1 \leq n \leq 20$
 * - $0 \leq dist[i][j] \leq 10^6$, $dist[i][i] = 0$
 */

/**
 * TSP (Held-Karp Bitmask DP)
 *
 * 점화식:
 *
 * $$dp[mask][v] = \min_{u \in mask,\; u \neq v} \bigl(dp[mask \setminus \{v\}][u] + dist[u][v]\bigr)$$
 *
 * 초기 조건:
 *
 * $$dp[\{0\}][0] = 0$$
 *
 * 결과:
 *
 * $$\text{tspBitmask}(dist) = \min_{v \neq 0} \bigl(dp[(1 \ll n) - 1][v] + dist[v][0]\bigr)$$
 *
 * 시간복잡도: $O(n^2 \cdot 2^n)$, 공간복잡도: $O(n \cdot 2^n)$
 *
 * @param dist - $n \times n$ 거리 행렬 ($1 \leq n \leq 20$)
 * @returns 최소 투어 비용 ($\geq 0$)
 */
export function tspBitmask(_dist: number[][]): number {
  throw new Error("Not implemented");
}
