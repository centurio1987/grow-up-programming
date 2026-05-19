/**
 * 확장 유클리드 호제법 (Extended Euclidean Algorithm)
 *
 * 두 정수 $a$, $b$에 대해 다음을 만족하는 정수 $x$, $y$를 구한다:
 *
 * $$a \cdot x + b \cdot y = \gcd(a, b)$$
 *
 * 이를 베주 항등식(Bezout's identity)이라 한다. 이 알고리즘은 모듈러 역원 계산과
 * 디오판토스 방정식 풀이의 핵심 도구이다.
 *
 * 점화식은 유클리드 호제법을 거꾸로 복원하여 얻는다:
 *
 * $$\begin{aligned}
 *   (g, x, y) &= \text{extGcd}(a, b) \\
 *   &= \text{extGcd}(b,\, a \bmod b) \to (g,\, y',\, x' - \lfloor a/b \rfloor \cdot y')
 * \end{aligned}$$
 *
 * 시간 복잡도는 $O(\log \min(|a|, |b|))$.
 *
 * @param a - 첫 번째 정수 (bigint)
 * @param b - 두 번째 정수 (bigint)
 * @returns `{ g, x, y }` 형태의 객체. $g = \gcd(a, b)$, $a x + b y = g$.
 */
export function extendedEuclidean(
  _a: bigint,
  _b: bigint,
): { g: bigint; x: bigint; y: bigint } {
  throw new Error("Not implemented");
}
