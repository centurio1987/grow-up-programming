/**
 * 부분합이 K인 부분배열 개수
 *
 * 정수 배열 $nums$와 정수 $k$가 주어질 때, 합이 정확히 $k$가 되는 연속 부분 배열의 개수를 반환한다.
 *
 * 알고리즘: 누적합 + 해시맵 — $\text{prefix}[j] - \text{prefix}[i] = k$가 되는 $(i, j)$ 쌍을 센다.
 *
 * - $N$은 배열 길이 ($1 \leq N \leq 100{,}000$)
 * - $nums[i]$는 정수 ($-10^4 \leq nums[i] \leq 10^4$)
 * - $k$는 정수 ($-10^9 \leq k \leq 10^9$)
 */

/**
 * Subarray Sum Equals K
 *
 * 누적합을 $P[j] = \sum_{i=0}^{j-1} nums[i]$로 정의하면,
 * 합 $k$인 부분배열의 개수는 다음과 같다:
 *
 * $$\#\{(i, j) \,\mid\, 0 \leq i < j \leq N,\; P[j] - P[i] = k\}$$
 *
 * 해시맵에 누적합 등장 횟수를 저장하며 $P[j] - k$가 이전에 몇 번 나왔는지 누적한다.
 *
 * 시간복잡도: $O(N)$
 *
 * @param nums - 정수 배열 ($1 \leq N \leq 100{,}000$)
 * @param k - 목표 합
 * @returns 합이 $k$인 부분 배열의 개수
 */
export function subarraySumEqualsK(nums: number[], k: number): number {
  throw new Error("Not implemented");
}
