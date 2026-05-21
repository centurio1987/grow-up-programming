/**
 * 빠른 거듭제곱 (Fast Exponentiation / Binary Exponentiation)
 *
 * 큰 지수에 대해 $\text{base}^{\text{exp}} \bmod m$을 효율적으로 계산한다.
 *
 * 분할 정복 점화식:
 *
 * $$\text{base}^{\text{exp}} = \begin{cases}
 *   1 & \text{if } \text{exp} = 0 \\
 *   (\text{base}^{\text{exp}/2})^2 & \text{if exp is even} \\
 *   \text{base} \cdot (\text{base}^{(\text{exp}-1)/2})^2 & \text{if exp is odd}
 * \end{cases}$$
 *
 * 모든 중간 결과는 $\bmod m$ 으로 환산하여 오버플로를 방지한다.
 *
 * 시간 복잡도: $O(\log \text{exp})$.
 *
 * @param base - 밑 (bigint)
 * @param exp - 지수 ($\text{exp} \geq 0$, bigint)
 * @param mod - 모듈러 ($m \geq 1$, bigint)
 * @returns $\text{base}^{\text{exp}} \bmod m$ ($0 \leq$ 결과 $< m$)
 */
export function fastPower(base: bigint, exp: bigint, mod: bigint): bigint {
  throw new Error("Not implemented");
}
