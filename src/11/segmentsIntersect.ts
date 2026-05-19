export type Point = [number, number];
export type Segment = [Point, Point];

/**
 * 두 선분 교차 판정 — CCW
 *
 * 두 선분 $s_1 = \overline{p_1 p_2}$, $s_2 = \overline{p_3 p_4}$ 가
 * 교차하는지 여부를 외적 부호(CCW)로 판정한다.
 *
 * 세 점의 방향:
 *
 * $$\mathrm{ccw}(a, b, c) = \mathrm{sign}\!\left( (b_x - a_x)(c_y - a_y) - (b_y - a_y)(c_x - a_x) \right)$$
 *
 * 두 선분이 교차하는 일반 조건(양 끝점이 서로 반대편에 있음):
 *
 * $$\mathrm{ccw}(p_1, p_2, p_3) \cdot \mathrm{ccw}(p_1, p_2, p_4) \leq 0 \;\land\; \mathrm{ccw}(p_3, p_4, p_1) \cdot \mathrm{ccw}(p_3, p_4, p_2) \leq 0$$
 *
 * 등호가 동시에 성립할 때(공선)에는 각 선분의 bounding box가 겹치는지로 판정한다.
 * 끝점이 다른 선분 위에 있거나 끝점끼리 닿는 경우도 교차로 간주한다 ($T$자, $L$자 포함).
 * 시간 복잡도 $O(1)$.
 *
 * @param s1 - 첫 번째 선분 $[p_1, p_2]$ ($-10^9 \leq x, y \leq 10^9$)
 * @param s2 - 두 번째 선분 $[p_3, p_4]$ ($-10^9 \leq x, y \leq 10^9$)
 * @returns 두 선분이 교차하면 `true`, 아니면 `false`
 */
export function segmentsIntersect(_s1: Segment, _s2: Segment): boolean {
  throw new Error("Not implemented");
}
