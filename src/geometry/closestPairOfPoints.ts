export type Point = [number, number];
export type Segment = [Point, Point];

/**
 * 가장 가까운 두 점 쌍 — 분할 정복
 *
 * 2차원 평면 위 $n$개의 점 $P = \{p_1, \ldots, p_n\}$ 중 유클리드 거리가 최소인
 * 두 점 쌍의 거리를 반환한다:
 *
 * $$d^{*}(P) = \min_{i \neq j} \sqrt{(x_i - x_j)^2 + (y_i - y_j)^2}$$
 *
 * 분할 정복 알고리즘:
 *  1. 점들을 $x$좌표로 정렬한 뒤 절반으로 분할한다.
 *  2. 양쪽에서 재귀적으로 최소 거리 $\delta_L, \delta_R$를 구한다.
 *  3. $\delta = \min(\delta_L, \delta_R)$ 라 할 때, 분할 직선에서 가로폭 $\delta$ 이내의
 *     "스트립" 영역 점들을 $y$좌표 정렬 상태로 모은다.
 *  4. 스트립 내의 각 점은 자기보다 위쪽으로 $y$좌표 차이가 $\delta$ 미만인 점만 비교하면 되며,
 *     이때 비교 횟수는 점당 최대 상수(7) 이내이므로 합치는 단계가 $O(n)$이다.
 *
 * 전체 시간 복잡도는 $T(n) = 2T(n/2) + O(n) = O(n \log n)$ 이다.
 *
 * @param points - 점들의 배열 ($2 \leq n \leq 10^5$, $-10^9 \leq x, y \leq 10^9$)
 * @returns 가장 가까운 두 점 사이의 유클리드 거리 ($\geq 0$)
 */
export function closestPairOfPoints(points: Point[]): number {
  throw new Error("Not implemented");
}
