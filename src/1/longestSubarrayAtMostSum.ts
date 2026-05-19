/**
 * 연속 부분 배열 합 ≤ S 최장 길이
 *
 * 비음의 정수 배열 $nums$와 정수 $S$가 주어질 때,
 * 합이 $S$ 이하인 연속 부분 배열의 최대 길이를 반환한다.
 *
 * 알고리즘: Two Pointers / Sliding Window, $O(N)$
 *
 * - $N$은 배열 길이 ($1 \leq N \leq 100{,}000$)
 * - $nums[i]$는 비음의 정수 ($0 \leq nums[i] \leq 10^4$)
 * - $S$는 비음의 정수 ($0 \leq S \leq 10^9$)
 */

/**
 * Longest Subarray with Sum at Most S
 *
 * 두 포인터 $l, r$로 윈도우 $[l, r]$을 유지하며 합이 $S$를 초과하면 $l$을 증가시킨다.
 *
 * $$\text{result} = \max_{[l, r] \,:\, \sum_{k=l}^{r} nums[k] \leq S}\,(r - l + 1)$$
 *
 * 시간복잡도: $O(N)$ (각 인덱스가 $l, r$에 한 번씩 들른다)
 *
 * 주의: 비음의 정수 배열에서만 단순 슬라이딩 윈도우가 직접 동작한다.
 *
 * @param nums - 비음의 정수 배열 ($1 \leq N \leq 100{,}000$)
 * @param S - 합 상한 ($S \geq 0$)
 * @returns 합 $\leq S$인 가장 긴 연속 부분 배열의 길이 ($\geq 0$)
 */
export function longestSubarrayAtMostSum(_nums: number[], _S: number): number {
  throw new Error("Not implemented");
}
