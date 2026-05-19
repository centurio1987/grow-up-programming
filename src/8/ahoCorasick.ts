/**
 * 다중 패턴 검색 (Aho-Corasick)
 *
 * 텍스트 문자열 $T$와 패턴 집합 $P = \{p_0, p_1, \ldots, p_{k-1}\}$가 주어질 때,
 * 각 패턴이 $T$ 안에서 등장하는 모든 (패턴 인덱스, 등장 위치) 쌍을 반환한다.
 *
 * Aho-Corasick 자동자(Automaton)는 Trie 위에 실패 링크(failure link)를 구축하여
 * 모든 패턴을 동시에 $O(n + \sum |p_i| + z)$ 시간에 매칭한다.
 * 여기서 $n = |T|$, $z$는 전체 매칭 개수다.
 *
 * 반환 형식:
 *
 * $$\text{result} = \{\, (i, j) \mid 0 \leq i < k,\; 0 \leq j \leq n - |p_i|,\; T[j \ldots j + |p_i| - 1] = p_i \,\}$$
 *
 * 결과 정렬 순서는 구현에 따르며, 본 문제는 등장 위치(`position`) 오름차순,
 * 동률 시 `patternIndex` 오름차순으로 정렬한다.
 *
 * @param text - 검색 대상 텍스트 ($1 \leq n \leq 10^{5}$)
 * @param patterns - 패턴 배열 ($1 \leq k$, $\sum |p_i| \leq 10^{5}$)
 * @returns `{ patternIndex, position }` 매칭 결과 배열 (position 오름차순)
 */
export function ahoCorasick(
  _text: string,
  _patterns: string[],
): Array<{ patternIndex: number; position: number }> {
  throw new Error("Not implemented");
}
