/**
 * 최장 증가 부분 수열 (Longest Increasing Subsequence, LIS)
 *
 * 정수 배열 $A$가 주어질 때, 엄격하게 증가하는 부분 수열의 최대 길이를 반환한다.
 * (부분 수열은 원소 순서를 유지하되 일부를 건너뛸 수 있다.)
 *
 * 알고리즘: DP + 이분 탐색 (Patience Sorting), $O(N \log N)$
 *
 * - $N$은 배열 길이 ($1 \leq N \leq 100{,}000$)
 * - $A[i]$는 정수 ($-10^9 \leq A[i] \leq 10^9$)
 */

/**
 * Longest Increasing Subsequence
 *
 * 길이 $N$의 배열 $A$에서 엄격하게 증가하는 부분 수열의 최대 길이를 구한다.
 *
 * Patience Sorting 기반 알고리즘:
 *
 * - 보조 배열 $tails$를 유지하며 $tails[k]$ = 길이 $k+1$인 LIS의 가능한 가장 작은 끝값.
 * - 각 $A[i]$에 대해 $tails$에서 $A[i]$ 이상인 첫 위치를 이분 탐색으로 찾아 교체/추가한다.
 *
 * $$\text{LIS}(A) = |tails|$$
 *
 * 시간복잡도: $O(N \log N)$
 *
 * @param A - 정수 배열 ($1 \leq N \leq 100{,}000$)
 * @returns 엄격 증가 LIS의 길이 ($\geq 1$)
 */
export function longestIncreasingSubsequence(_A: number[]): number {
  throw new Error("Not implemented");
}
