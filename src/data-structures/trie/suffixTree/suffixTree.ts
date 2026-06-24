/**
 * SuffixTree (접미사 트리)
 *
 * 문자열 s의 모든 접미사(suffix)를 압축 트리(Radix Tree 방식)로 저장한다.
 * 문자열 s[i..n-1]을 삽입함으로써 패턴 검색 및 반복 부분 문자열 탐색이 가능하다.
 * 유전체(DNA) 서열 분석, 최장 반복 부분 문자열 탐색에 사용된다.
 *
 * 구현 방식: Naive O(n^2) 구성 허용
 *  → 모든 접미사를 압축 트리(Radix Trie 방식)에 삽입
 *
 * 요구사항:
 * - constructor: 문자열 s로부터 접미사 트리를 구성한다
 * - search: 패턴이 s의 부분 문자열인지 확인한다 (O(m) 탐색)
 * - findAll: 패턴이 시작하는 모든 인덱스를 반환한다
 * - longestRepeatedSubstring: 가장 긴 반복 부분 문자열을 반환한다
 *
 * 시간복잡도:
 * - constructor: O(n^2) (Naive), O(n) (Ukkonen's 알고리즘)
 * - search: O(m) m = 패턴 길이
 * - findAll: O(m + k) k = 등장 횟수
 * - longestRepeatedSubstring: O(n)
 */

interface SuffixNode {
  children: Map<string, SuffixNode>;
  label: string;
  // 이 노드의 서브트리에 포함된 접미사 시작 인덱스들
  indices: number[];
}

export class SuffixTree {
  private root: SuffixNode;
  private s: string;

  constructor(s: string) {
    throw new Error("Not implemented");
  }

  /**
   * 패턴이 원본 문자열 s의 부분 문자열이면 true를 반환한다.
   * 접미사 트리를 탐색해 O(m)에 처리한다.
   */
  search(pattern: string): boolean {
    throw new Error("Not implemented");
  }

  /**
   * 패턴이 원본 문자열 s에서 시작하는 모든 인덱스를 반환한다.
   * 순서는 정의하지 않는다.
   */
  findAll(pattern: string): number[] {
    throw new Error("Not implemented");
  }

  /**
   * 원본 문자열에서 두 번 이상 등장하는 가장 긴 부분 문자열을 반환한다.
   * 없으면 빈 문자열을 반환한다.
   * 내부 노드(isEnd가 아닌 분기점)의 깊이가 곧 반복 문자열 길이다.
   */
  longestRepeatedSubstring(): string {
    throw new Error("Not implemented");
  }
}
