/**
 * Trie (트라이 / 접두사 트리)
 *
 * 문자 단위 분기 트리로 문자열 집합을 저장한다.
 * 각 노드는 자식 맵과 단어 종료 플래그를 가진다.
 * 접두사 기반 검색을 O(단어 길이)에 처리해 자동완성 엔진에 적합하다.
 *
 * 요구사항:
 * - insert: 단어를 삽입한다. 이미 존재하면 무시한다
 * - search: 정확한 단어가 존재하는지 확인한다
 * - startsWith: 해당 접두사로 시작하는 단어가 하나 이상 있는지 확인한다
 * - delete: 단어를 삭제한다. 삭제 성공 시 true, 없으면 false 반환
 * - wordsWithPrefix: 접두사로 시작하는 모든 단어를 반환한다
 * - size: 저장된 단어의 총 개수를 반환한다
 *
 * 시간복잡도:
 * - insert: O(m) m = 단어 길이
 * - search: O(m)
 * - startsWith: O(m)
 * - delete: O(m)
 * - wordsWithPrefix: O(m + k) k = 결과 단어 수 × 평균 길이
 * - size: O(1)
 */

interface TrieNode {
  children: Map<string, TrieNode>;
  isEnd: boolean;
}

export class Trie {
  private root: TrieNode;
  private count: number;

  constructor() {
    throw new Error("Not implemented");
  }

  /** 단어를 트라이에 삽입한다. 이미 존재하면 무시한다. */
  insert(word: string): void {
    throw new Error("Not implemented");
  }

  /** 정확한 단어가 트라이에 있으면 true를 반환한다. */
  search(word: string): boolean {
    throw new Error("Not implemented");
  }

  /** prefix로 시작하는 단어가 하나 이상 있으면 true를 반환한다. */
  startsWith(prefix: string): boolean {
    throw new Error("Not implemented");
  }

  /**
   * 단어를 삭제한다.
   * 삭제 성공 시 true, 단어가 없으면 false를 반환한다.
   * 해당 단어만 삭제하며 다른 단어의 공유 경로는 유지한다.
   */
  delete(word: string): boolean {
    throw new Error("Not implemented");
  }

  /**
   * prefix로 시작하는 모든 단어를 배열로 반환한다.
   * 순서는 정의하지 않는다 (사전순이면 더 좋음).
   */
  wordsWithPrefix(prefix: string): string[] {
    throw new Error("Not implemented");
  }

  /** 현재 저장된 단어의 총 개수를 반환한다. */
  size(): number {
    throw new Error("Not implemented");
  }
}
