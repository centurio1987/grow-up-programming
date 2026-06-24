/**
 * HuffmanTree (허프만 트리)
 *
 * 문자별 빈도(frequency)를 기반으로 허프만 코딩 트리를 구성한다.
 * 빈도가 높은 문자에는 짧은 비트 코드를, 낮은 문자에는 긴 코드를 할당해
 * 평균 코드 길이를 최소화한다 (엔트로피 코딩).
 * ZIP/DEFLATE 알고리즘의 핵심 구성요소다.
 *
 * 요구사항:
 * - constructor: 문자 빈도 맵으로 허프만 트리를 구성한다
 * - encode: 텍스트를 비트 문자열로 인코딩한다
 * - decode: 비트 문자열을 원본 텍스트로 디코딩한다
 * - codeTable: 각 문자와 대응하는 허프만 코드 맵을 반환한다
 * - compressionRatio: 원본 8비트/문자 대비 압축률을 반환한다
 *
 * 시간복잡도:
 * - constructor: O(n log n) (n = 고유 문자 수, 최소 힙 사용)
 * - encode: O(m) (m = 입력 텍스트 길이)
 * - decode: O(m) (m = 비트 문자열 길이)
 * - codeTable: O(n)
 * - compressionRatio: O(m)
 */

interface HuffmanNode {
  char: string | null;
  freq: number;
  left: HuffmanNode | null;
  right: HuffmanNode | null;
}

export class HuffmanTree {
  private root: HuffmanNode | null;
  private codes: Map<string, string>;

  constructor(frequencies: Map<string, number>) {
    throw new Error("Not implemented");
  }

  /**
   * 텍스트를 허프만 코드로 인코딩해 비트 문자열('0'/'1' 문자 배열)을 반환한다.
   * frequencies에 없는 문자가 포함되면 에러를 던진다.
   */
  encode(text: string): string {
    throw new Error("Not implemented");
  }

  /**
   * 비트 문자열을 트리를 순회하며 원본 텍스트로 디코딩한다.
   */
  decode(bits: string): string {
    throw new Error("Not implemented");
  }

  /**
   * 각 문자에 할당된 허프만 코드 테이블을 반환한다.
   * 문자(key) → 코드 문자열(value) ex) "a" → "0", "b" → "10"
   */
  codeTable(): Map<string, string> {
    throw new Error("Not implemented");
  }

  /**
   * 압축률을 반환한다.
   * (허프만 코드 총 비트 수) / (원본 총 비트 수, 8비트/문자)
   * 값이 작을수록 압축률이 높다.
   */
  compressionRatio(text: string): number {
    throw new Error("Not implemented");
  }
}
