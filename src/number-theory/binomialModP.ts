/**
 * 조합 수 (mod p) — 팩토리얼 전처리 + 페르마의 소정리 (필요 시 Lucas)
 *
 * 소수 $p$에 대해 이항 계수
 *
 * $$\binom{n}{k} = \frac{n!}{k!\,(n-k)!}$$
 *
 * 의 값을 $\bmod p$로 계산한다.
 *
 * 일반적으로 $n < p$ 인 경우 팩토리얼 전처리 후 페르마의 소정리로 역원을 계산:
 *
 * $$\binom{n}{k} \equiv n! \cdot (k!)^{-1} \cdot ((n-k)!)^{-1} \pmod p$$
 *
 * $$a^{-1} \equiv a^{p-2} \pmod p \quad (\gcd(a, p) = 1)$$
 *
 * $n \geq p$ 인 경우 Lucas의 정리를 적용한다:
 *
 * $$\binom{n}{k} \equiv \prod_i \binom{n_i}{k_i} \pmod p$$
 *
 * 여기서 $n_i$, $k_i$는 $n$, $k$의 base-$p$ 표현 자릿수.
 *
 * 엣지 케이스: $k < 0$ 또는 $k > n$ 이면 $0$, $k = 0$ 또는 $k = n$ 이면 $1$.
 *
 * @param n - 위 인자 ($n \geq 0$, bigint)
 * @param k - 아래 인자 ($k \geq 0$, bigint)
 * @param p - 소수 모듈러 ($p \geq 2$, bigint)
 * @returns $\binom{n}{k} \bmod p$ ($0 \leq$ 결과 $< p$)
 */
export function binomialModP(n: bigint, k: bigint, p: bigint): bigint {
  throw new Error("Not implemented");
}
