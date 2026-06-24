/**
 * RadixTree (기수 트리 / Patricia Trie)
 *
 * Trie의 공간 최적화 버전으로, 에지에 단일 문자 대신 문자열 전체를 저장한다.
 * 자식이 하나뿐인 노드를 압축해 단어 수가 적을 때 Trie보다 메모리 효율이 높다.
 * Linux 커널의 IP 라우팅 테이블(ip_fib_trie), IP 주소 최장 접두사 매칭에 사용된다.
 *
 * 요구사항:
 * - insert: 단어를 삽입한다. 에지 레이블을 적절히 분할/병합한다
 * - search: 정확한 단어가 존재하는지 확인한다
 * - startsWith: 해당 접두사로 시작하는 단어가 하나 이상 있는지 확인한다
 * - delete: 단어를 삭제한다. 불필요한 노드를 병합해 트리를 압축 유지한다
 * - wordsWithPrefix: 접두사로 시작하는 모든 단어를 반환한다
 * - size: 저장된 단어 수를 반환한다
 *
 * 시간복잡도:
 * - insert: O(m) m = 단어 길이
 * - search: O(m)
 * - startsWith: O(m)
 * - delete: O(m)
 * - wordsWithPrefix: O(m + k) k = 결과 단어 길이 합
 * - size: O(1)
 */

interface RadixNode {
  children: Map<string, RadixNode>;  // 에지 첫 문자 → 자식 노드
  label: string;                      // 이 에지의 레이블 (문자열)
  isEnd: boolean;
}

export class RadixTree {
  private root: RadixNode;
  private count: number;

  constructor() {
    throw new Error("Not implemented");
  }

  /**
   * 단어를 기수 트리에 삽입한다.
   * 공통 접두사에서 에지를 분할(split)하고 나머지를 새 자식으로 추가한다.
   */
  insert(word: string): void {
    throw new Error("Not implemented");
  }

  /** 정확한 단어가 트리에 있으면 true를 반환한다. */
  search(word: string): boolean {
    throw new Error("Not implemented");
  }

  /** prefix로 시작하는 단어가 하나 이상 있으면 true를 반환한다. */
  startsWith(prefix: string): boolean {
    throw new Error("Not implemented");
  }

  /**
   * 단어를 삭제한다. 삭제 후 노드를 병합해 트리를 압축 상태로 유지한다.
   * 삭제 성공 시 true, 단어가 없으면 false를 반환한다.
   */
  delete(word: string): boolean {
    throw new Error("Not implemented");
  }

  /**
   * prefix로 시작하는 모든 단어를 배열로 반환한다.
   */
  wordsWithPrefix(prefix: string): string[] {
    throw new Error("Not implemented");
  }

  /** 현재 저장된 단어의 총 개수를 반환한다. */
  size(): number {
    throw new Error("Not implemented");
  }
}
