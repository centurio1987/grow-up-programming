/**
 * 소수 판정 (Miller-Rabin, 결정적 버전)
 *
 * 64비트 범위의 정수 $n$에 대해 결정적인 소수 판정을 수행한다.
 *
 * 페르마의 소정리의 강화 버전:
 *
 * $$n - 1 = 2^s \cdot d \quad (d \text{ odd})$$
 *
 * 임의 증인 $a$ ($2 \leq a < n$)에 대해 다음 중 하나가 성립하면 $n$은 $a$에 대해 강한 의사 소수이다:
 *
 * $$a^d \equiv 1 \pmod{n} \quad \text{또는} \quad \exists\, r \in [0, s): a^{2^r d} \equiv -1 \pmod{n}$$
 *
 * 64-bit 범위에서 결정적이 되려면 다음 증인을 사용하면 충분하다:
 *
 * $$\{2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37\}$$
 *
 * 시간 복잡도: $O(k \log^3 n)$ ($k$는 증인의 수).
 *
 * @param n - 판별할 정수 (bigint, $n < 2^{64}$)
 * @returns $n$이 소수이면 `true`, 아니면 `false`
 */
export function millerRabin(_n: bigint): boolean {
  throw new Error("Not implemented");
}
