/**
 * 슬라이딩 윈도우 최댓값
 *
 * 정수 배열 $nums$와 윈도우 크기 $k$가 주어진다.
 * 길이 $k$인 슬라이딩 윈도우가 왼쪽부터 오른쪽으로 한 칸씩 움직일 때,
 * 각 윈도우 위치에서의 최댓값을 순서대로 반환한다.
 *
 * 알고리즘: Monotonic Deque, $O(N)$
 *
 * - $N$은 배열 길이 ($1 \leq N \leq 100{,}000$)
 * - $k$는 윈도우 크기 ($1 \leq k \leq N$)
 * - $nums[i]$는 정수 ($-10^4 \leq nums[i] \leq 10^4$)
 */

/**
 * Sliding Window Maximum
 *
 * 결과 길이: $N - k + 1$
 *
 * $$\text{result}[i] = \max_{i \leq j < i+k}\, nums[j]$$
 *
 * 단조 감소 덱(deque)에 후보 인덱스를 저장한다:
 * - 윈도우를 벗어난 앞쪽 인덱스를 제거
 * - 새 원소보다 작거나 같은 뒤쪽 인덱스를 제거
 * - 덱 앞의 값이 현재 윈도우 최댓값
 *
 * 시간복잡도: $O(N)$
 *
 * @param nums - 정수 배열 ($1 \leq N \leq 100{,}000$)
 * @param k - 윈도우 크기 ($1 \leq k \leq N$)
 * @returns 각 윈도우 위치에서의 최댓값 배열 (길이 $N - k + 1$)
 */
export function slidingWindowMaximum(nums: number[], k: number): number[] {
  throw new Error("Not implemented");
}
