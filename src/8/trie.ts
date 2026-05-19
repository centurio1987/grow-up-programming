/**
 * 사전 / 접두사 검색 (Trie)
 *
 * 문자열 집합을 트리(prefix tree)로 저장하여, 삽입/검색/접두사 검색을
 * 키 길이에 비례하는 시간에 수행한다.
 *
 * 키의 길이를 $L$이라 할 때 각 연산의 시간 복잡도:
 *
 * $$T_{\text{insert}}(L) = T_{\text{search}}(L) = T_{\text{startsWith}}(L) = O(L)$$
 *
 * 공간 복잡도는 전체 키 길이의 합 $\sum_i L_i$에 알파벳 크기 $|\Sigma|$를 곱한 것.
 *
 * 연산:
 * - `insert(word)`: 단어를 삽입한다.
 * - `search(word)`: 정확히 그 단어가 삽입된 적이 있는지 반환한다.
 * - `startsWith(prefix)`: 그 접두사로 시작하는 단어가 하나라도 있는지 반환한다.
 *
 * 제약: 단어/접두사 길이 $L \leq 10^{5}$, 총 문자 수 $\leq 10^{5}$.
 */
export class Trie {
  /**
   * 단어를 삽입한다.
   *
   * @param word - 삽입할 단어 ($0 \leq |word| \leq 10^{5}$)
   */
  insert(_word: string): void {
    throw new Error("Not implemented");
  }

  /**
   * 정확히 일치하는 단어가 삽입되어 있는지 반환한다.
   *
   * @param word - 검색할 단어
   * @returns `word`가 이전에 `insert`된 적이 있으면 `true`
   */
  search(_word: string): boolean {
    throw new Error("Not implemented");
  }

  /**
   * 주어진 접두사로 시작하는 단어가 하나라도 있는지 반환한다.
   *
   * @param prefix - 검사할 접두사
   * @returns 그 접두사로 시작하는 단어가 존재하면 `true`
   */
  startsWith(_prefix: string): boolean {
    throw new Error("Not implemented");
  }
}
