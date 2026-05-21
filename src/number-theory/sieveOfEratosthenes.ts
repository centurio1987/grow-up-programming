/**
 * 에라토스테네스의 체 (Sieve of Eratosthenes)
 *
 * $1 \leq n$ 이하의 모든 소수를 오름차순으로 반환한다.
 *
 * 알고리즘:
 *
 * 1. 길이 $n+1$의 boolean 배열 $\text{isPrime}$ 을 모두 `true`로 초기화하고 인덱스 0, 1은 `false`.
 * 2. $i = 2, 3, \ldots, \lfloor \sqrt{n} \rfloor$ 를 순회하며 $\text{isPrime}[i]$ 가 `true` 이면 $i^2, i^2 + i, i^2 + 2i, \ldots \leq n$ 을 모두 `false`로 표시.
 * 3. 최종적으로 $\text{isPrime}[k] = \text{true}$ 인 모든 $k$ 를 결과 배열에 담는다.
 *
 * 소수 정리에 의해 $n$ 이하의 소수는 약 $n / \ln n$ 개 존재한다:
 *
 * $$\pi(n) \sim \frac{n}{\ln n}$$
 *
 * 시간 복잡도: $O(n \log \log n)$.
 *
 * @param n - 상한 (음이 아닌 정수)
 * @returns $n$ 이하의 모든 소수 (오름차순)
 */
export function sieveOfEratosthenes(n: number): number[] {
  throw new Error("Not implemented");
}
