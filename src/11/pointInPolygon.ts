export type Point = [number, number];
export type Segment = [Point, Point];

/**
 * 점이 다각형 내부인지 판정 — Ray Casting
 *
 * 점 $p = (x_0, y_0)$ 가 정점 $v_0, v_1, \ldots, v_{n-1}$ 로 이루어진
 * (볼록·오목 무관한) 단순 다각형 내부에 있는지 판정한다.
 *
 * 점 $p$ 에서 $+x$ 방향 무한대로 광선을 쏘아, 다각형의 변과 교차하는 횟수 $k$ 를 센다:
 *
 * $$\text{inside}(p) = (k \bmod 2 = 1)$$
 *
 * 변 $\overline{v_i\, v_{i+1}}$ 의 $y$ 구간이 $y_0$ 를 포함할 때
 * ($\min(v_{i,y}, v_{i+1,y}) \leq y_0 < \max(v_{i,y}, v_{i+1,y})$),
 * 그 변이 $y = y_0$ 인 직선과 만나는 $x$좌표를 구해 $x_0$ 이상이면 카운트한다.
 *
 * 점이 정확히 변 위 또는 정점 위에 있으면 내부(true)로 간주한다.
 * 시간 복잡도는 $O(n)$ 이다.
 *
 * @param p - 검사할 점 ($-10^9 \leq x, y \leq 10^9$)
 * @param polygon - 다각형의 정점 배열 ($3 \leq n \leq 10^5$, 단순 다각형)
 * @returns 점이 다각형 내부(경계 포함)에 있으면 `true`
 */
export function pointInPolygon(_p: Point, _polygon: Point[]): boolean {
  throw new Error("Not implemented");
}
