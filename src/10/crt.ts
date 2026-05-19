/**
 * 중국인의 나머지 정리 (Chinese Remainder Theorem)
 *
 * 연립 합동식이 주어졌을 때 유일한 해 $x$ (모듈러 $M = \prod m_i$) 를 구한다.
 *
 * 입력:
 *
 * $$\begin{cases}
 *   x \equiv r_1 \pmod{m_1} \\
 *   x \equiv r_2 \pmod{m_2} \\
 *   \quad\vdots \\
 *   x \equiv r_k \pmod{m_k}
 * \end{cases}$$
 *
 * - 모든 $m_i$가 서로 쌍쌍이 서로소이면 해는 항상 존재하며,
 * - 일반적으로 모듈러 쌍 $(m_i, m_j)$에 대해 $r_i \equiv r_j \pmod{\gcd(m_i, m_j)}$ 이어야 한다.
 *
 * 출력:
 *
 * - 해가 존재하면 $\{ x, M \}$ ($0 \leq x < M$, $M = \text{lcm}(m_1, \ldots, m_k)$)
 * - 모순되어 해가 존재하지 않으면 `null`
 *
 * 시간 복잡도: 한 쌍을 합치는 데 확장 유클리드 $O(\log)$, 전체 $O(k \log M)$.
 *
 * @param remainders - 잔차 배열 $[r_1, \ldots, r_k]$
 * @param moduli - 모듈러 배열 $[m_1, \ldots, m_k]$ (모두 $\geq 1$)
 * @returns 해 $\{ x, M \}$ 또는 `null`
 */
export function crt(
  _remainders: bigint[],
  _moduli: bigint[],
): { x: bigint; M: bigint } | null {
  throw new Error("Not implemented");
}
