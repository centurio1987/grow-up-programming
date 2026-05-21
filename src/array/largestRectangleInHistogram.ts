/**
 * 히스토그램에서의 최대 직사각형 넓이
 *
 * 비음의 정수 배열 $heights$가 히스토그램 막대의 높이를 나타낸다 (각 막대의 너비는 $1$).
 * 막대들로 만들 수 있는 가장 큰 직사각형의 넓이를 반환한다.
 *
 * 알고리즘: Monotonic Stack, $O(N)$
 *
 * - $N$은 배열 길이 ($1 \leq N \leq 100{,}000$)
 * - $heights[i]$는 비음의 정수 ($0 \leq heights[i] \leq 10^4$)
 */

/**
 * Largest Rectangle in Histogram
 *
 * 각 막대 $i$에 대해, 양옆으로 $heights[i]$ 이상인 막대가 이어지는 최대 너비를 구한다.
 * 단조 증가 스택을 사용하여 $i$가 팝될 때 왼쪽 경계 $L_i$와 오른쪽 경계 $R_i$를 정한다:
 *
 * $$\text{area}_i = heights[i] \cdot (R_i - L_i - 1)$$
 *
 * 결과:
 *
 * $$\text{maxArea}(heights) = \max_{0 \leq i < N} \text{area}_i$$
 *
 * 시간복잡도: $O(N)$
 *
 * @param heights - 히스토그램 높이 배열 ($1 \leq N \leq 100{,}000$)
 * @returns 최대 직사각형 넓이 ($\geq 0$)
 */
export function largestRectangleInHistogram(heights: number[]): number {
  throw new Error("Not implemented");
}
