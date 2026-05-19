/**
 * 팰린드롬 분할 — 최소 컷 (Palindrome Partitioning · Min Cut)
 *
 * 문자열 $s$가 주어진다. $s$를 모든 부분 문자열이 팰린드롬이 되도록
 * 분할할 때, 필요한 최소 컷 횟수를 구한다.
 * (분할 횟수가 $k$이면 부분 문자열은 $k+1$개)
 *
 * 알고리즘: 구간 DP — 먼저 $isPal[i][j]$ 테이블을 채우고,
 * $cuts[i]$를 0..i 부분 문자열의 최소 컷 횟수로 정의한다.
 *
 * - $1 \leq |s| \leq 2000$
 * - $s$는 영문 소문자
 */

/**
 * Palindrome Partitioning — Min Cut
 *
 * 점화식 (팰린드롬 판정):
 *
 * $$isPal[i][j] = (s_i = s_j) \wedge isPal[i+1][j-1]$$
 *
 * 점화식 (컷):
 *
 * $$cuts[i] = \min_{0 \leq j \leq i,\; isPal[j][i]}
 * \begin{cases}
 *   0 & \text{if } j = 0 \\
 *   cuts[j-1] + 1 & \text{otherwise}
 * \end{cases}$$
 *
 * 결과:
 *
 * $$\text{palindromePartitioningMinCut}(s) = cuts[n-1]$$
 *
 * 시간복잡도: $O(n^2)$, 공간복잡도: $O(n^2)$
 *
 * @param s - 입력 문자열 ($1 \leq |s| \leq 2000$)
 * @returns 최소 컷 횟수 ($\geq 0$)
 */
export function palindromePartitioningMinCut(_s: string): number {
  throw new Error("Not implemented");
}
