/**
 * 부분집합 순회 (Submask Enumeration)
 *
 * 정수 비트마스크 $m$이 주어질 때, $m$의 모든 부분집합(서브마스크)을 열거한다.
 * 즉, $s \subseteq m$인 모든 $s$를 (비트 단위 포함 관계로) 찾는다.
 *
 * 핵심 트릭:
 *
 * $$\text{for } s = m;\ s;\ s = (s-1) \,\&\, m$$
 *
 * 위 루프는 $m$의 서브마스크를 큰 값에서 작은 값 순으로 순회한다.
 * 마지막에 $s = 0$도 부분집합으로 포함시킨다.
 *
 * 부분집합의 개수는 $m$의 세팅된 비트 수를 $k$라 할 때 $2^k$ 개이며,
 * 모든 $m$에 대한 전체 서브마스크 합은 $\sum_{m=0}^{2^n - 1} 2^{\text{popcount}(m)} = 3^n$ 이다.
 *
 * 예시:
 *
 * - $\text{enumerateSubmasks}(0\text{b}1011) = [11, 10, 9, 8, 3, 2, 1, 0]$
 * - $\text{enumerateSubmasks}(0) = [0]$
 *
 * @param mask - 비트마스크 ($0 \leq \text{mask} \leq 2^{20}$)
 * @returns mask의 모든 부분집합을 내림차순으로 나열한 배열 (0 포함)
 */
export function enumerateSubmasks(mask: number): number[] {
  throw new Error("Not implemented");
}
