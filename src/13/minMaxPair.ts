/**
 * 최댓값·최솟값 동시 찾기 (Min-Max Pair) — 분할 정복
 *
 * 길이 $n$인 배열 $A$에 대해 최솟값과 최댓값을 동시에 구한다:
 *
 * $$\text{minMaxPair}(A) = \left( \min_{0 \leq i < n} A[i],\; \max_{0 \leq i < n} A[i] \right)$$
 *
 * 단순 선형 탐색은 비교 $2n - 2$회를 사용한다. 분할 정복으로 배열을 둘로 나누어
 * 각각의 (min, max)를 재귀적으로 구한 뒤 합치면 비교 횟수를
 *
 * $$T(n) = 2 T(n/2) + 2 \;\Rightarrow\; T(n) = \tfrac{3n}{2} - 2$$
 *
 * 로 줄일 수 있다. 시간 복잡도는 $O(n)$, 비교 횟수만 $1.5n$ 수준으로 감소한다.
 *
 * @param arr - 정수 배열 ($1 \leq n \leq 10^5$)
 * @returns `{ min, max }` — 각각 배열의 최솟값과 최댓값
 */
export function minMaxPair(arr: number[]): { min: number; max: number } {
  throw new Error("Not implemented");
}
