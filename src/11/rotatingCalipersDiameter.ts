export type Point = [number, number];
export type Segment = [Point, Point];

/**
 * 회전 캘리퍼스 — 점 집합의 지름 (제곱 거리)
 *
 * 2차원 평면 위 $n$개의 점 $P = \{p_1, \ldots, p_n\}$ 의 지름은 가장 멀리 떨어진
 * 두 점 사이의 거리이다:
 *
 * $$\mathrm{diam}^2(P) = \max_{i \neq j} \left( (x_i - x_j)^2 + (y_i - y_j)^2 \right)$$
 *
 * 최댓값은 항상 $P$의 볼록 껍질 위 두 점 사이에서 발생하므로:
 *  1. 먼저 볼록 껍질을 $O(n \log n)$에 구성한다.
 *  2. 껍질을 따라 두 개의 평행 지지선(캘리퍼스)을 회전시키며, 한 쌍이 동시에
 *     서로 마주 보는 antipodal pair들을 모두 훑는다. 이 단계는 $O(h)$이다
 *     ($h$ = hull 크기).
 *  3. 모든 antipodal pair의 제곱 거리 중 최댓값을 반환한다.
 *
 * 부동소수 오차를 피하기 위해 거리는 제곱 형태로 반환한다.
 * 전체 시간 복잡도는 $O(n \log n)$ 이다.
 *
 * @param points - 점 배열 ($2 \leq n \leq 10^5$, $-10^9 \leq x, y \leq 10^9$ — 정수 좌표 권장)
 * @returns 가장 먼 두 점 사이의 제곱 거리 ($\geq 0$)
 */
export function rotatingCalipersDiameter(points: Point[]): number {
  throw new Error("Not implemented");
}
