/**
 * MinHash (민해시)
 *
 * Jaccard 유사도를 근사 추정하는 확률적 해시 기법.
 * numHashes개의 독립적인 해시 함수를 집합의 각 원소에 적용하여
 * 최솟값(minimum hash)만 서명(signature)으로 저장한다.
 * 두 서명의 일치 비율이 Jaccard 유사도의 불편 추정량이 된다.
 *
 * 요구사항:
 * - update(set): 집합을 받아 MinHash 서명 계산
 * - signature(): 현재 MinHash 서명 배열 반환
 * - MinHash.jaccard(a, b): 두 서명으로 Jaccard 유사도 추정 [0,1]
 * - MinHash.exact(a, b): 두 Set으로 정확한 Jaccard 유사도 계산 (검증용)
 *
 * 시간복잡도:
 * - update: O(n * k), n = 집합 크기, k = numHashes
 * - signature: O(k)
 * - jaccard: O(k)
 * - exact: O(n + m), n, m = 두 집합 크기
 */
export class MinHash {
  constructor(numHashes: number) {
    throw new Error("Not implemented");
  }

  /** 집합으로 MinHash 서명 계산 (이전 서명 덮어씀) */
  update(set: Iterable<string>): void {
    throw new Error("Not implemented");
  }

  /** 현재 MinHash 서명 배열 반환 */
  signature(): number[] {
    throw new Error("Not implemented");
  }

  /** 두 MinHash 서명으로 Jaccard 유사도 추정 [0,1] */
  static jaccard(a: MinHash, b: MinHash): number {
    throw new Error("Not implemented");
  }

  /** 두 Set으로 정확한 Jaccard 유사도 계산 (검증용) */
  static exact(a: Set<string>, b: Set<string>): number {
    throw new Error("Not implemented");
  }
}
