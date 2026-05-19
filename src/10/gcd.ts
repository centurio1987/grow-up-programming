/**
 * 최대공약수 (Greatest Common Divisor)
 *
 * 두 정수 $a$, $b$의 최대공약수를 유클리드 호제법으로 구한다.
 *
 * 유클리드 호제법은 다음 점화식을 반복 적용한다:
 *
 * $$\gcd(a, b) = \begin{cases} a & \text{if } b = 0 \\ \gcd(b,\, a \bmod b) & \text{otherwise} \end{cases}$$
 *
 * 두 인자 중 한쪽이 0이면 나머지의 절댓값이 결과가 되며,
 * 결과는 항상 음이 아닌 값으로 정의한다:
 *
 * $$\gcd(a, b) \geq 0$$
 *
 * 시간 복잡도는 $O(\log \min(|a|, |b|))$ 이다.
 *
 * @param a - 첫 번째 정수 ($-2^{63} \leq a \leq 2^{63}-1$ 범위의 bigint)
 * @param b - 두 번째 정수 ($-2^{63} \leq b \leq 2^{63}-1$ 범위의 bigint)
 * @returns 두 수의 최대공약수 ($\geq 0$)
 */
export function gcd(_a: bigint, _b: bigint): bigint {
  throw new Error("Not implemented");
}
