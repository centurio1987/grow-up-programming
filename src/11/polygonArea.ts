export type Point = [number, number];
export type Segment = [Point, Point];

/**
 * 다각형 면적 — Shoelace Formula (가우스 면적 공식)
 *
 * 정점 $v_0 = (x_0, y_0), v_1 = (x_1, y_1), \ldots, v_{n-1} = (x_{n-1}, y_{n-1})$
 * 로 정의된 (자기교차 없는) 단순 다각형의 면적은 다음과 같이 계산한다:
 *
 * $$A = \frac{1}{2} \left| \sum_{i=0}^{n-1} (x_i\, y_{i+1} - x_{i+1}\, y_i) \right|$$
 *
 * 여기서 인덱스는 순환적이며 $v_n = v_0$ 이다. 절댓값을 취하므로 정점 순서가
 * 시계 방향이든 반시계 방향이든 동일한 비음수 결과를 반환한다.
 *
 * 시간 복잡도는 $O(n)$, 공간 복잡도는 $O(1)$ 이다.
 *
 * @param polygon - 단순 다각형의 정점 배열 ($3 \leq n \leq 10^5$, $-10^9 \leq x, y \leq 10^9$)
 * @returns 다각형의 면적 ($\geq 0$, 부동소수)
 */
export function polygonArea(_polygon: Point[]): number {
  throw new Error("Not implemented");
}
