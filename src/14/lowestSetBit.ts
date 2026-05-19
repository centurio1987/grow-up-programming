/**
 * 최하위 1비트 (Lowest Set Bit)
 *
 * 32비트 정수 $x$가 주어질 때, $x$에서 가장 낮은 위치의 1비트만을 추출한 값을 반환한다.
 *
 * 핵심 트릭 (2의 보수 표현 활용):
 *
 * $$\text{lowestSetBit}(x) = x \,\&\, (-x)$$
 *
 * - $-x$ 는 2의 보수 표현에서 $\sim x + 1$ 과 동일하며,
 *   $x$의 최하위 1비트 위치를 기준으로 그 이상의 비트가 반전된다.
 * - 따라서 $x \,\&\, (-x)$ 는 정확히 최하위 1비트만 남긴다.
 *
 * 예시:
 *
 * - $\text{lowestSetBit}(12) = \text{lowestSetBit}(0\text{b}1100) = 4$
 * - $\text{lowestSetBit}(1) = 1$
 * - $\text{lowestSetBit}(0) = 0$
 *
 * 응용: Fenwick Tree(BIT)의 인덱스 이동, 비트 단위 DP 등.
 *
 * @param x - 32비트 정수 ($-2^{31} \leq x \leq 2^{31} - 1$)
 * @returns $x$의 최하위 1비트만 남긴 값 (0이면 0)
 */
export function lowestSetBit(_x: number): number {
  throw new Error("Not implemented");
}
