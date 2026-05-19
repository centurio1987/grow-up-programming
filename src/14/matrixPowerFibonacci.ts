/**
 * 행렬 거듭제곱을 이용한 피보나치 (Matrix Power Fibonacci)
 *
 * 피보나치 수열은 다음과 같이 정의된다:
 *
 * $$F_0 = 0,\quad F_1 = 1,\quad F_n = F_{n-1} + F_{n-2}\ (n \geq 2)$$
 *
 * 선형 점화식이므로 다음 행렬 항등식이 성립한다:
 *
 * $$\begin{pmatrix} 1 & 1 \\ 1 & 0 \end{pmatrix}^{n} =
 *   \begin{pmatrix} F_{n+1} & F_{n} \\ F_{n} & F_{n-1} \end{pmatrix}$$
 *
 * 반복 제곱 (Exponentiation by Squaring) 을 적용하면:
 *
 * $$M^n = \begin{cases}
 *   I & (n = 0) \\
 *   (M^{n/2})^2 & (n \text{ even}) \\
 *   M \cdot (M^{(n-1)/2})^2 & (n \text{ odd})
 * \end{cases}$$
 *
 * 시간 복잡도는 $O(\log n)$ 이며, 큰 $n$ ($\leq 10^{18}$)에 대해서도 빠르게 계산 가능하다.
 *
 * 결과 값이 매우 커질 수 있으므로 `bigint` 를 사용한다.
 *
 * 예시:
 *
 * - $F_{10} = 55$
 * - $F_{50} = 12{,}586{,}269{,}025$
 *
 * @param n - 피보나치 인덱스 ($0 \leq n \leq 10^{18}$)
 * @returns $F_n$ — n번째 피보나치 수 (bigint)
 */
export function matrixPowerFibonacci(_n: bigint): bigint {
  throw new Error("Not implemented");
}
