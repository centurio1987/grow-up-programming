/**
 * Convex Hull Trick (CHT) — 직선 집합의 최솟값 쿼리 자료구조
 *
 * 직선 $\ell_i(x) = m_i \cdot x + b_i$의 집합 $\mathcal{L}$이 주어질 때,
 * 쿼리 $x$에 대해
 *
 * $$\text{query}(x) = \min_{\ell \in \mathcal{L}} \ell(x)$$
 *
 * 를 효율적으로 계산하는 자료구조.
 *
 * 본 구현은 **기울기 $m$이 단조 증가**(non-decreasing) 순서로 추가된다는 가정하에
 * 동작하며, 모노톤 스택으로 하한 볼록 껍질을 유지한다.
 *
 * 세 직선 $\ell_1, \ell_2, \ell_3$이 차례로 스택 상단에 있다고 할 때, $\ell_2$의
 * 교차점이 다른 두 직선보다 위에 있으면(즉 $\ell_2$가 최솟값을 갖는 구간이
 * 비어있으면) $\ell_2$를 제거한다. 판정식:
 *
 * $$(b_3 - b_1)(m_1 - m_2) \leq (b_2 - b_1)(m_1 - m_3)$$
 *
 * - `addLine(m, b)`: 기울기 $m$, 절편 $b$인 직선을 추가 ($m$이 비감소 순서로 들어옴).
 * - `query(x)`: 모든 직선 중 $x$에서의 최솟값을 반환.
 *
 * 쿼리 $x$가 임의 순서라면 이진 탐색으로 $O(\log n)$, 단조 증가라면 포인터로 $O(1)$ 분할 상환.
 * 본 구현은 임의 순서 쿼리를 지원하기 위해 이진 탐색을 사용한다.
 *
 * 시간 복잡도: addLine $O(1)$ 분할 상환, query $O(\log n)$.
 */
export class ConvexHullTrick {
  /**
   * 새 직선 $y = m x + b$를 추가한다. 기울기 $m$은 비감소 순서로 호출되어야 한다.
   *
   * @param m - 기울기 ($-10^9 \leq m \leq 10^9$, 비감소 순서)
   * @param b - 절편 ($-10^{18} \leq b \leq 10^{18}$)
   */
  addLine(_m: number, _b: number): void {
    throw new Error("Not implemented");
  }

  /**
   * 모든 등록된 직선 $\ell_i$ 중 $\ell_i(x) = m_i x + b_i$ 의 최솟값을 반환한다.
   *
   * @param x - 평가 지점 ($-10^9 \leq x \leq 10^9$)
   * @returns $\min_i (m_i x + b_i)$
   */
  query(_x: number): number {
    throw new Error("Not implemented");
  }
}
