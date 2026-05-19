/**
 * 부분 문자열 검색 (KMP / Z-Algorithm / Rabin-Karp)
 *
 * 텍스트 문자열 $T$와 패턴 문자열 $P$가 주어질 때,
 * $T$ 내에서 $P$가 등장하는 모든 시작 위치를 오름차순으로 반환한다.
 *
 * $T$의 길이를 $n$, $P$의 길이를 $m$이라 하면, 등장 위치 집합은:
 *
 * $$\text{Occ}(T, P) = \{\, i \mid 0 \leq i \leq n - m,\; T[i \ldots i+m-1] = P \,\}$$
 *
 * KMP / Z-Algorithm / Rabin-Karp 등의 알고리즘으로 $O(n + m)$에 해결한다.
 *
 * 빈 패턴 ($m = 0$)이 주어지면 모든 위치 $0, 1, \ldots, n$을 반환하지 않고
 * 빈 배열을 반환한다 (구현 규약).
 *
 * @param text - 검색 대상 텍스트 ($0 \leq n \leq 10^{5}$)
 * @param pattern - 검색할 패턴 ($0 \leq m \leq 10^{5}$)
 * @returns 패턴이 등장하는 시작 인덱스의 오름차순 배열
 */
export function findAllOccurrences(_text: string, _pattern: string): number[] {
  throw new Error("Not implemented");
}
