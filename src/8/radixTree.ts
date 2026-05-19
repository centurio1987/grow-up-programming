/**
 * 공백 압축된 사전 (Radix Tree / Patricia Trie)
 *
 * 일반적인 Trie는 단일 자식만 가지는 체인 노드들을 그대로 보존하지만,
 * Radix Tree(Patricia Trie)는 그러한 체인을 하나의 엣지 라벨로 합쳐 저장한다.
 * 이로써 노드 수가 키 개수에 비례하게 줄어들어 공간이 압축되며,
 * 연산 시간은 동일하게 키 길이 $L$에 비례한다:
 *
 * $$T_{\text{insert}}(L) = T_{\text{search}}(L) = T_{\text{startsWith}}(L) = O(L)$$
 *
 * 연산:
 * - `insert(word)`: 단어를 삽입한다. 기존 엣지와 공통 접두사를 공유하면 엣지를 분할한다.
 * - `search(word)`: 정확히 그 단어가 삽입된 적이 있는지 반환한다.
 * - `startsWith(prefix)`: 그 접두사로 시작하는 단어가 하나라도 있는지 반환한다.
 *
 * 제약: 단어/접두사 길이 $L \leq 10^{5}$, 총 문자 수 $\leq 10^{5}$.
 */
export class RadixTree {
  /**
   * 단어를 삽입한다. 필요시 공통 접두사로 엣지를 분할한다.
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
