/**
 * 최장 공통 부분 수열 (Longest Common Subsequence, LCS)
 *
 * 두 문자열 $s$, $t$가 주어질 때 둘의 공통 부분 수열 중 가장 긴 것의 길이를 반환한다.
 * (부분 수열은 순서를 유지하며 일부 문자를 건너뛸 수 있다.)
 *
 * 알고리즘: 2D DP, $O(nm)$
 *
 * - $n = |s|,\, m = |t|$ ($0 \leq n, m \leq 1{,}000$)
 * - 문자는 ASCII로 가정
 */

/**
 * Longest Common Subsequence
 *
 * 점화식 ($1 \leq i \leq n,\, 1 \leq j \leq m$):
 *
 * $$dp[i][j] = \begin{cases} dp[i-1][j-1] + 1 & \text{if } s[i-1] = t[j-1] \\ \max(dp[i-1][j],\, dp[i][j-1]) & \text{otherwise} \end{cases}$$
 *
 * 결과:
 *
 * $$\text{LCS}(s, t) = dp[n][m]$$
 *
 * 시간복잡도: $O(nm)$
 *
 * @param s - 첫 번째 문자열 ($0 \leq |s| \leq 1{,}000$)
 * @param t - 두 번째 문자열 ($0 \leq |t| \leq 1{,}000$)
 * @returns 공통 부분 수열의 최대 길이 ($\geq 0$)
 */
export function longestCommonSubsequence(s: string, t: string): number {
  throw new Error("Not implemented");
}
