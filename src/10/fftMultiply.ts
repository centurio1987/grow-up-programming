/**
 * 다항식 / 큰 수 곱셈 (FFT, Fast Fourier Transform)
 *
 * 두 정수 계수 배열 $a = [a_0, a_1, \ldots, a_{n-1}]$, $b = [b_0, b_1, \ldots, b_{m-1}]$
 * 을 다항식의 계수 표현으로 보고, 곱한 다항식의 계수 배열을 반환한다.
 *
 * $$A(x) = \sum_{i=0}^{n-1} a_i x^i,\quad B(x) = \sum_{j=0}^{m-1} b_j x^j$$
 *
 * $$C(x) = A(x) \cdot B(x) = \sum_{k=0}^{n+m-2} c_k x^k,\quad
 *   c_k = \sum_{i+j=k} a_i \cdot b_j$$
 *
 * 결과 길이는 $n + m - 1$이며, FFT를 사용해 $O((n+m) \log (n+m))$ 시간에 계산한다.
 *
 * 부동소수점 FFT를 사용할 경우 결과는 가장 가까운 정수로 반올림한다.
 *
 * 엣지 케이스:
 * - 한쪽이 빈 배열이면 결과도 빈 배열로 정의한다.
 *
 * @param a - 첫 번째 다항식의 계수 (낮은 차수부터)
 * @param b - 두 번째 다항식의 계수 (낮은 차수부터)
 * @returns 두 다항식의 곱 다항식의 계수 (길이 $n + m - 1$, 빈 배열일 시 `[]`)
 */
export function fftMultiply(_a: number[], _b: number[]): number[] {
  throw new Error("Not implemented");
}
