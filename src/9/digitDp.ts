/**
 * 자리수 DP — 자릿수 합이 K인 수의 개수
 *
 * 양의 정수 $N$과 $K$가 주어진다.
 * $1$ 이상 $N$ 이하의 정수 중, 십진법 자릿수의 합이 정확히 $K$인 수의 개수를 구한다.
 *
 * 알고리즘: 자리수 DP — $N$의 각 자릿수를 위에서 아래로 결정하며,
 * `(자리 인덱스, 지금까지의 자릿수 합, tight 플래그)`로 상태를 표현한다.
 *
 * - $1 \leq N \leq 10^{15}$ (number 안전 정수 범위 내)
 * - $0 \leq K \leq 135$ (최대 자리수 15 · 9 = 135)
 */

/**
 * Digit DP — Count of Numbers with Digit Sum = K
 *
 * $N$의 자릿수 배열을 $d_0 d_1 \cdots d_{L-1}$이라 두면,
 * 상태를 $(pos,\; sum,\; tight)$로 정의:
 *
 * $$f(pos, sum, tight) = \sum_{x=0}^{\,\text{limit}(tight)} f\bigl(pos+1,\; sum+x,\; tight \wedge (x = d_{pos})\bigr)$$
 *
 * 종료 조건:
 *
 * $$f(L, sum, *) = [sum = K]$$
 *
 * 결과 (단, $0$은 카운트에서 제외):
 *
 * $$\text{digitDp}(N, K) = f(0, 0, \text{true}) - [K = 0]$$
 *
 * 시간복잡도: $O(L \cdot K \cdot 10)$, 공간복잡도: $O(L \cdot K)$
 *
 * @param N - 상한 정수 ($1 \leq N \leq 10^{15}$)
 * @param K - 목표 자릿수 합 ($0 \leq K \leq 135$)
 * @returns 자릿수 합이 $K$인 $[1, N]$ 정수의 개수
 */
export function digitDp(_N: number, _K: number): number {
  throw new Error("Not implemented");
}
