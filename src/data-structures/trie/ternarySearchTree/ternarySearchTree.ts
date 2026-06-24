/**
 * TernarySearchTree (삼진 탐색 트리)
 *
 * 각 노드가 세 자식(왼쪽/가운데/오른쪽)을 가지는 트라이(Trie)의 변형.
 * - 왼쪽: 현재 노드의 문자보다 작은 문자
 * - 가운데: 현재 노드의 문자와 같은 문자 (다음 레벨로 진행)
 * - 오른쪽: 현재 노드의 문자보다 큰 문자
 *
 * 일반 Trie보다 메모리 효율적이고, 해시맵과 달리 정렬 순서를 지원하여
 * 철자 검사기(spell checker)나 자동완성에 활용됨.
 *
 * 요구사항:
 * - insert(word): 단어를 트리에 삽입
 * - search(word): 단어가 존재하는지 검색
 * - startsWith(prefix): 주어진 접두사로 시작하는 단어가 존재하는지 확인
 * - delete(word): 단어를 트리에서 삭제
 * - wordsWithPrefix(prefix): 주어진 접두사로 시작하는 모든 단어 반환
 * - size(): 저장된 단어 수 반환
 *
 * 시간복잡도:
 * - insert: O(m), m = 단어 길이
 * - search: O(m)
 * - startsWith: O(m)
 * - delete: O(m)
 * - wordsWithPrefix: O(m + k), k = 접두사로 시작하는 단어들의 총 길이
 * - size: O(1)
 */

class TSTNode {
  char: string;
  left: TSTNode | null = null;
  mid: TSTNode | null = null;
  right: TSTNode | null = null;
  isEnd: boolean = false;

  constructor(char: string) {
    this.char = char;
  }
}

export class TernarySearchTree {
  private root: TSTNode | null = null;
  private _size: number = 0;

  insert(word: string): void {
    throw new Error("Not implemented");
  }

  search(word: string): boolean {
    throw new Error("Not implemented");
  }

  startsWith(prefix: string): boolean {
    throw new Error("Not implemented");
  }

  delete(word: string): boolean {
    throw new Error("Not implemented");
  }

  wordsWithPrefix(prefix: string): string[] {
    throw new Error("Not implemented");
  }

  size(): number {
    throw new Error("Not implemented");
  }
}
