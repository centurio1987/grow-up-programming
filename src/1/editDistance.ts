/**
 * 편집 거리 (Edit Distance, Levenshtein Distance)
 *
 * 두 문자열 $s$, $t$가 주어질 때 $s$를 $t$로 변환하기 위해 필요한 최소 편집 횟수를 반환한다.
 * 허용되는 연산은 삽입, 삭제, 교체 세 가지이며 각각 비용은 $1$이다.
 *
 * 알고리즘: 2D DP, $O(nm)$
 *
 * - $n = |s|,\, m = |t|$ ($0 \leq n, m \leq 1{,}000$)
 */

/**
 * Edit Distance (Levenshtein)
 *
 * 점화식 ($1 \leq i \leq n,\, 1 \leq j \leq m$):
 *
 * $$dp[i][j] = \begin{cases} dp[i-1][j-1] & \text{if } s[i-1] = t[j-1] \\ 1 + \min(dp[i-1][j],\, dp[i][j-1],\, dp[i-1][j-1]) & \text{otherwise} \end{cases}$$
 *
 * 초기 조건:
 *
 * $$dp[0][j] = j,\quad dp[i][0] = i$$
 *
 * 결과:
 *
 * $$\text{editDistance}(s, t) = dp[n][m]$$
 *
 * 시간복잡도: $O(nm)$
 *
 * @param s - 시작 문자열 ($0 \leq |s| \leq 1{,}000$)
 * @param t - 목표 문자열 ($0 \leq |t| \leq 1{,}000$)
 * @returns 최소 편집 횟수 ($\geq 0$)
 */
export function editDistance(s: string, t: string): number {
  throw new Error("Not implemented");
}
