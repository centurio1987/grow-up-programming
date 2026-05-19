/**
 * 가장 가까운 큰 수 (Next Greater Element, NGE)
 *
 * 정수 배열 $nums$가 주어질 때, 각 원소에 대해 오른쪽으로 보았을 때
 * 자신보다 엄격하게 큰 첫 번째 원소를 반환한다.
 * 그러한 원소가 없으면 $-1$을 반환한다.
 *
 * 알고리즘: Monotonic Stack, $O(N)$
 *
 * - $N$은 배열 길이 ($1 \leq N \leq 100{,}000$)
 * - $nums[i]$는 정수 ($-10^9 \leq nums[i] \leq 10^9$)
 */

/**
 * Next Greater Element
 *
 * 결과 배열 $R$:
 *
 * $$R[i] = \begin{cases} nums[j] & j = \min\{ j > i \,\mid\, nums[j] > nums[i] \} \\ -1 & \text{such } j \text{ does not exist} \end{cases}$$
 *
 * 단조 감소 스택을 오른쪽부터 또는 왼쪽부터 운영하여 $O(N)$에 처리한다.
 *
 * @param nums - 정수 배열 ($1 \leq N \leq 100{,}000$)
 * @returns 각 위치의 NGE (없으면 $-1$)
 */
export function nextGreaterElement(_nums: number[]): number[] {
  throw new Error("Not implemented");
}
