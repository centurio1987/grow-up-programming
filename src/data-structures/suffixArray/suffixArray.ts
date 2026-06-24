/**
 * SuffixArray (접미사 배열)
 *
 * 문자열의 모든 접미사를 사전순으로 정렬한 인덱스 배열.
 * 예: s = "banana"
 *   접미사: ["banana", "anana", "nana", "ana", "na", "a"]
 *   정렬:   ["a", "ana", "anana", "banana", "na", "nana"]
 *   SA:     [5, 3, 1, 0, 4, 2]
 *
 * 텍스트 검색 엔진, 유전체 서열 분석 등 긴 문자열에서 패턴을 빠르게
 * 찾는 데 활용됨. O(n^2) naive 구현을 허용.
 *
 * 요구사항:
 * - constructor(s): 문자열을 받아 접미사 배열 구성
 * - search(pattern): 패턴이 시작하는 모든 인덱스 반환 (정렬됨)
 * - lcp(i, j): suffixArray[i]와 suffixArray[j] 접미사의 최장 공통 접두사 길이
 * - longestRepeatedSubstring(): 가장 긴 반복 부분 문자열 반환
 * - suffixes(): 정렬된 접미사 배열 반환 (디버깅용)
 *
 * 시간복잡도:
 * - constructor: O(n^2 log n) — naive 정렬
 * - search: O(m log n), m = 패턴 길이
 * - lcp: O(m), m = 공통 접두사 길이
 * - longestRepeatedSubstring: O(n^2)
 * - suffixes: O(n)
 */
export class SuffixArray {
  private s: string;
  private sa: number[];

  constructor(s: string) {
    throw new Error("Not implemented");
  }

  search(pattern: string): number[] {
    throw new Error("Not implemented");
  }

  lcp(i: number, j: number): number {
    throw new Error("Not implemented");
  }

  longestRepeatedSubstring(): string {
    throw new Error("Not implemented");
  }

  suffixes(): string[] {
    throw new Error("Not implemented");
  }
}
