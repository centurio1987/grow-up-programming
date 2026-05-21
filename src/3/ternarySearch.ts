/**
 * Ternary Search — 단봉 함수의 극값 탐색
 *
 * 닫힌 구간 $[\text{lo}, \text{hi}]$ 위에서 단봉(unimodal) 함수 $f$가 주어진다.
 * $f$가 유일한 최솟값을 가질 때, 그 최솟값의 위치 $x^{*}$를 오차 $\varepsilon$ 이내로 추정한다.
 *
 * $$\text{ternarySearch}(f, \text{lo}, \text{hi}, \varepsilon) \approx \arg\min_{x \in [\text{lo}, \text{hi}]} f(x)$$
 *
 * 핵심 아이디어 — 구간을 세 등분하여 두 내부점 $m_1 < m_2$ 을 비교한다.
 *
 * $$m_1 = \text{lo} + \frac{\text{hi} - \text{lo}}{3}, \quad m_2 = \text{hi} - \frac{\text{hi} - \text{lo}}{3}$$
 *
 * 단봉 함수의 성질에 따라:
 *
 * $$f(m_1) < f(m_2) \Rightarrow x^{*} \in [\text{lo}, m_2], \quad f(m_1) > f(m_2) \Rightarrow x^{*} \in [m_1, \text{hi}]$$
 *
 * 매 반복마다 구간 길이가 $\tfrac{2}{3}$ 배로 줄어들므로:
 *
 * $$\text{반복 횟수} = \mathcal{O}\!\left( \log_{3/2} \frac{\text{hi} - \text{lo}}{\varepsilon} \right) = \mathcal{O}\!\left( \log \tfrac{1}{\varepsilon} \right)$$
 *
 * 시간 복잡도: $O(\log(1/\varepsilon))$ 회의 $f$ 호출, 공간 복잡도: $O(1)$.
 *
 * 제약 조건:
 * - $f$는 $[\text{lo}, \text{hi}]$ 위에서 단봉이며 유일한 최솟값을 가진다.
 * - $\text{lo} < \text{hi}$, $\varepsilon > 0$.
 *
 * @param f - $[\text{lo}, \text{hi}]$ 위에서 단봉인 실수 함수
 * @param lo - 탐색 구간의 좌측 끝
 * @param hi - 탐색 구간의 우측 끝
 * @param epsilon - 허용 오차 ($\text{hi} - \text{lo} \leq \varepsilon$ 이면 종료)
 * @returns $f$를 최소화하는 $x$의 근사값 (구간 중점)
 */
export function ternarySearch(
  f: (x: number) => number,
  lo: number,
  hi: number,
  epsilon: number,
): number {
  throw new Error("Not implemented");
}
