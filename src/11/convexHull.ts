export type Point = [number, number];
export type Segment = [Point, Point];

/**
 * 볼록 껍질 (Convex Hull) — Andrew's Monotone Chain
 *
 * 2차원 평면 위 $n$개의 점 집합 $P = \{p_1, p_2, \ldots, p_n\}$ 에 대해,
 * 모든 점을 포함하는 최소 볼록 다각형의 꼭짓점들을 반시계 방향 순서로 반환한다.
 *
 * 볼록 껍질은 다음을 만족하는 가장 작은 볼록 집합 $C \subseteq \mathbb{R}^2$의 경계이다:
 *
 * $$C = \left\{ \sum_{i=1}^{n} \lambda_i\, p_i \;\middle|\; \lambda_i \geq 0,\; \sum_{i=1}^{n} \lambda_i = 1 \right\}$$
 *
 * Andrew's Monotone Chain은 점을 $x$좌표(동률 시 $y$좌표) 기준으로 정렬한 뒤,
 * 하한선(lower hull)과 상한선(upper hull)을 각각 구성하여 합친다. 세 점
 * $a, b, c$의 외적 부호:
 *
 * $$\mathrm{cross}(a, b, c) = (b_x - a_x)(c_y - a_y) - (b_y - a_y)(c_x - a_x)$$
 *
 * 값이 $0$ 이하이면 좌회전이 아니므로 스택에서 점을 제거한다.
 * 결과에는 공선상의 중간 점을 포함하지 않으며, 시간 복잡도는 $O(n \log n)$ 이다.
 *
 * @param points - 점들의 배열 ($1 \leq n \leq 10^5$, $-10^9 \leq x, y \leq 10^9$)
 * @returns 볼록 껍질의 꼭짓점을 반시계 방향으로 정렬한 배열 (공선 중간 점 제외)
 */
export function convexHull(points: Point[]): Point[] {
  throw new Error("Not implemented");
}
